// @vitest-environment node
/* Gestoria · Tauler · el tractor 'gestoria.tauler': fail-closed (cap fitxer
   es llig sense l'aprovació vigent del seu manifest) i la lectura dels
   extractes, del CSV i de la configuració. Un autenticador WebAuthn simulat
   signa de veres i la porta ho verifica. Fitxers sintètics fets ací: cap
   dada real (entitat 9999 de prova, empresa i població inventades). */
import { describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../../tests/helpers/autenticadorSimulat.js';
import { ErrorAprovacio, preparaRegistre } from '../../../tractors/nucli/aprovacio.js';
import { ESQUEMA_CONFIG_EMPRESA } from '../../facturacio/configEmpresa.js';
import { llegeixC43 } from '../../nucli/c43.js';
import { llegeixMovimentsCsv } from '../../nucli/movimentsBanc.js';
import { TRACTOR_FACTURES, TRACTOR_TAULER } from '../../tractors.js';
import { comptesDe } from './resumTauler.js';
import {
  ACCEPTA_TAULER, CODIS_TRACTOR_TAULER, ESQUEMA_CONFIG, ErrorTauler, LIMITS_TAULER, executaTractorTauler, identitatDeConfig,
  reduixC43, reduixCsv
} from './tractorTauler.js';

const ARA = Date.UTC(2026, 9, 4, 8, 0, 0);
const DIA = 86400000;
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const ALTRA_EMPREMTA = `sha256:${'cd'.repeat(32)}`;

const autenticador = await creaAutenticadorSimulat();
const MANIFEST_ALTERAT = Object.freeze({ ...TRACTOR_TAULER, descripcio: 'Una altra descripció.' });
const SIGNATS = new Map(await Promise.all([TRACTOR_TAULER, TRACTOR_FACTURES, MANIFEST_ALTERAT].map(async (manifest, i) => [
  manifest, await autenticador.signa({ manifest, empremta: EMPREMTA, ara: ARA - 60000, nonce: new Uint8Array(16).fill(i + 20) })
])));

function aprovacioDe(manifest, { empremta = EMPREMTA, registres, ara = ARA } = {}) {
  return {
    manifest, empremta, registres: registres ?? [SIGNATS.get(manifest)], claus: autenticador.claus,
    origen: autenticador.origen, rpId: autenticador.rpId, ara
  };
}

/* Un fitxer triat: el nom, la mida i els bytes, que s'apunten quan es demanen. */
const llegits = [];
function fitxer(name, contingut, { size } = {}) {
  const bytes = typeof contingut === 'string' ? new TextEncoder().encode(contingut) : contingut;
  return {
    name,
    size: size ?? bytes.length,
    arrayBuffer: vi.fn(async () => {
      llegits.push(name);
      return bytes.slice().buffer;
    })
  };
}

/* ── Norma 43 sintètica (les posicions de nucli/c43.js) ─────────────────── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const N43 = [
  `119999000100000043212606012606302${xifres(100000, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`,
  `22${text('', 4)}000126061026061099000${'1'}${xifres(2500, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`,
  `3399990001000000432100001${xifres(2500, 14)}00000${xifres(0, 14)}2${xifres(97500, 14)}978${text('', 4)}`,
  `88${'9'.repeat(18)}${xifres(3, 6)}${text('', 54)}`
].join('\r\n');
const CSV = 'Fecha,F. valor,Concepto,Importe,Saldo\n2026-06-10,2026-06-10,COMPRA,-25.00,975.00\n';
const CONFIG = JSON.stringify({
  esquema: ESQUEMA_CONFIG, nif: 'no-es-llig', nom: 'Empresa de Prova SL', nomComercial: 'Taller de Prova',
  domicilis: [{ id: 'fiscal', adreca: 'Carrer Inventat 1', codiPostal: '00000', poblacio: 'Poble de Prova' }],
  domiciliFiscal: 'fiscal', comptes: [{ id: 'cobrament', iban: 'no-es-llig' }]
});

/* El mateix compte, amb un rebut SEPA (2301 esquema i creditor, 2302 identificador i mandat), oficina
   d'origen, document i referències: tot inventat, i l'identificador de creditor, fet a trossos. */
const ID_CREDITOR_SINTETIC = ['ES00', 'ZZZ', 'B', '99999999'].join('');
const N43_SEPA = [
  N43.split('\r\n')[0],
  `22${text('', 4)}0777260610260610030001${xifres(2500, 14)}${text('DOC7654321', 10)}${text('REFUNSINTETI', 12)}${text('REFDOSSINTETICA', 16)}`,
  `2301${text('CORE', 4)}${text('CREDITOR SINTETIC SL', 70)}${text('', 2)}`,
  `2302${text(ID_CREDITOR_SINTETIC, 35)}${text('MANDAT-SINTETIC-01', 41)}`,
  N43.split('\r\n')[2],
  `88${'9'.repeat(18)}${xifres(5, 6)}${text('', 54)}`
].join('\r\n');
const CSV_PRIVAT = [
  'Fecha,F. valor,Concepto,Importe,Saldo',
  '2026-06-10,2026-06-10,"OP.TARJ.COMPRA COMERCIO',
  '999999******1234 FORN DE PROVA",-25.00,975.00',
  '2026-06-11,2026-06-11,TRANSFERENCIA DE PERSONA SINTETICA,10.00,985.00'
].join('\n');
/* Els camps de la lectura sencera que el Tauler no ha de guardar mai. */
const CLAUS_VETADES = [
  'nom', 'oficina', 'modalitat', 'codiDivisa', 'linia', 'document', 'ref1', 'ref2', 'conceptPropi', 'conceptes', 'sepa',
  'creditor', 'idCreditor', 'cif', 'mandat', 'concepte', 'comerc', 'missatge', 'fi', 'registres', 'recompte', 'codificacio'
];
/* Totes les claus d'un objecte, a qualsevol fondària. */
function clausDe(valor, recollides = new Set()) {
  if (Array.isArray(valor)) valor.forEach((v) => clausDe(v, recollides));
  else if (valor && typeof valor === 'object') {
    for (const [clau, v] of Object.entries(valor)) {
      recollides.add(clau);
      clausDe(v, recollides);
    }
  }
  return [...recollides];
}

const errorDe = (promesa) => promesa.then(() => null, (error) => error);

describe('fail-closed: sense l’aprovació del seu manifest, cap fitxer es llig', () => {
  const revocada = [
    SIGNATS.get(TRACTOR_TAULER),
    preparaRegistre({ manifest: TRACTOR_TAULER, empremta: EMPREMTA, decisio: 'revocat', nivell: 'confirmacio', ara: ARA - 1000, nonce: new Uint8Array(16).fill(9) })
  ];
  test.each([
    ['sense cap registre', aprovacioDe(TRACTOR_TAULER, { registres: [] }), 'APROVACIO_REQUERIDA'],
    ['amb l’aprovació del tractor de factures', aprovacioDe(TRACTOR_FACTURES), 'APROVACIO_REQUERIDA'],
    ['amb l’empremta divergent', aprovacioDe(TRACTOR_TAULER, { empremta: ALTRA_EMPREMTA }), 'EMPREMTA_DIVERGENT'],
    ['amb un manifest alterat', aprovacioDe(MANIFEST_ALTERAT), 'EMPREMTA_DIVERGENT'],
    ['amb l’aprovació revocada', aprovacioDe(TRACTOR_TAULER, { registres: revocada }), 'APROVACIO_REVOCADA'],
    ['amb l’aprovació caducada', aprovacioDe(TRACTOR_TAULER, { ara: ARA + 91 * DIA }), 'APROVACIO_CADUCADA'],
    ['amb una signatura de cap clau registrada', { ...aprovacioDe(TRACTOR_TAULER), claus: [] }, 'SIGNATURA_INVALIDA']
  ])('%s: ErrorAprovacio i cap byte demanat', async (_cas, aprovacio, codi) => {
    const triat = fitxer('extracte.n43', N43);
    const error = await errorDe(executaTractorTauler({ fitxers: [triat], aprovacio }));
    expect(error).toBeInstanceOf(ErrorAprovacio);
    expect(error.codi).toBe(codi);
    expect(triat.arrayBuffer).not.toHaveBeenCalled();
  });

  test('el manifest: dades personals, signatura, cap xarxa, i no escriu res', () => {
    expect(TRACTOR_TAULER).toMatchObject({
      schema: 'sdp.tractor.v1', id: 'gestoria.tauler', dadesPersonals: true, nivellMinim: 'signatura', xarxa: 'cap',
      escriu: ['Res'], fitxa: 'src/sections/gestoria/fitxes/gestoria_tauler.md'
    });
    expect(Object.isFrozen(TRACTOR_TAULER.fonts)).toBe(true);
    expect([...TRACTOR_TAULER.fonts]).toEqual([...TRACTOR_TAULER.fonts].sort());
  });
});

describe('amb l’aprovació vigent', () => {
  const aprovacio = aprovacioDe(TRACTOR_TAULER);

  test('un senyal ja cancel·lat rebutja abans de demanar cap byte', async () => {
    const controlador = new AbortController();
    controlador.abort();
    const triat = fitxer('no_es_llig.csv', CSV);
    const error = await errorDe(executaTractorTauler({ fitxers: [triat], aprovacio, signal: controlador.signal }));
    expect(error).toBeInstanceOf(ErrorTauler);
    expect(error.codi).toBe('LECTURA_CANCELLADA');
    expect(CODIS_TRACTOR_TAULER).toContain(error.codi);
    expect(triat.arrayBuffer).not.toHaveBeenCalled();
  });

  test('cancel·lar durant la verificació criptogràfica no inicia fitxers després', async () => {
    const controlador = new AbortController();
    const original = globalThis.crypto.subtle;
    // La signatura es verifica de veres; s'avorta en tornar la verificació.
    const subtle = new Proxy(original, {
      get(target, key) {
        const valor = Reflect.get(target, key, target);
        if (key === 'verify') return async (...args) => {
          const valid = await valor.apply(target, args);
          controlador.abort();
          return valid;
        };
        return typeof valor === 'function' ? valor.bind(target) : valor;
      }
    });
    const triat = fitxer('no_es_llig.csv', CSV);
    const error = await errorDe(executaTractorTauler({ fitxers: [triat], aprovacio, subtle, signal: controlador.signal }));
    expect(controlador.signal.aborted).toBe(true);
    expect(error).toBeInstanceOf(ErrorTauler);
    expect(error.codi).toBe('LECTURA_CANCELLADA');
    expect(triat.arrayBuffer).not.toHaveBeenCalled();
  });

  test('llig la Norma 43, el CSV i, de la configuració, només el nom i la població', async () => {
    const r = await executaTractorTauler({
      fitxers: [fitxer('extracte.n43', N43), fitxer('moviments.csv', CSV), fitxer('empresa.json', CONFIG)], aprovacio
    });
    expect(r.avisos).toEqual([]);
    expect(r.extractes).toHaveLength(1);
    expect(r.extractes[0].lectura.comptes[0].capcalera).toMatchObject({ entitat: '9999', compte4: '4321', divisa: 'EUR' });
    expect(r.extractes[0].lectura.comptes[0].peu.saldoFinal).toBe(97500);
    expect(r.csv[0].lectura.moviments).toEqual([expect.objectContaining({ centims: -2500, saldo: 97500 })]);
    expect(r.identitat).toEqual({ nom: 'Taller de Prova', poble: 'Poble de Prova' });
    expect(JSON.stringify(r.identitat)).not.toMatch(/no-es-llig|Inventat|00000/);
  });

  test('un fitxer d’un altre tipus, massa gran o illegible no atura la resta: torna com a avís', async () => {
    const trencat = { name: 'trencat.n43', size: 10, arrayBuffer: async () => { throw new Error('disc'); } };
    const gran = fitxer('gran.n43', N43, { size: LIMITS_TAULER.midaFitxer + 1 });
    const r = await executaTractorTauler({
      fitxers: [fitxer('foto.jpg', 'x'), gran, trencat, fitxer('altre.json', '{"esquema":"un-altre"}'), fitxer('extracte.N43', N43)],
      aprovacio
    });
    expect(r.avisos.map((a) => a.codi)).toEqual(['TIPUS_DESCONEGUT', 'FITXER_MASSA_GRAN', 'FITXER_ILLEGIBLE', 'CONFIG_INVALIDA']);
    expect(r.extractes).toHaveLength(1);
    expect(r.identitat).toBeNull();
    expect(gran.arrayBuffer).not.toHaveBeenCalled();
    for (const a of r.avisos) expect(CODIS_TRACTOR_TAULER).toContain(a.codi);
  });

  /* Ordre del Mestre, 261004 (privacitat): la lectura que guarda el Tauler és
     la reduïda. Un extracte sintètic amb tot el que porta un de veres (titular,
     oficina, document, referències, rebut SEPA amb l'identificador del
     creditor i el mandat) i un CSV amb una compra amb targeta i una
     transferència d'una persona: res d'això ix del tractor. */
  test('la lectura reduïda: cap titular, oficina, concepte, referència, rebut SEPA ni nom de fitxer', async () => {
    const r = await executaTractorTauler({
      fitxers: [fitxer('extracte_TITULAR_SINTETIC.n43', N43_SEPA), fitxer('moviments_TITULAR.csv', CSV_PRIVAT)], aprovacio
    });
    /* La prova té dents: la lectura sencera sí que porta tot això. */
    const sencera = llegeixC43(N43_SEPA);
    expect(sencera.comptes[0].capcalera).toMatchObject({ nom: 'TITULAR SINTETIC', oficina: '0001' });
    expect(sencera.comptes[0].moviments[0].sepa).toMatchObject({ creditor: 'CREDITOR SINTETIC SL', idCreditor: ID_CREDITOR_SINTETIC });
    expect(llegeixMovimentsCsv(CSV_PRIVAT).moviments[0].comerc).toBe('FORN DE PROVA');

    expect(r.avisos).toEqual([]);
    const claus = clausDe(r);
    for (const vetada of CLAUS_VETADES) expect(claus, vetada).not.toContain(vetada);
    expect(JSON.stringify(r)).not.toMatch(/TITULAR|CREDITOR|B99999999|MANDAT|REFUNSINTETI|REFDOSSINTETICA|DOC7654321|0777|PERSONA|FORN|extracte_/);

    /* El que sí que guarda: el que necessiten les xifres del Tauler. */
    const [compte] = r.extractes[0].lectura.comptes;
    expect(compte.capcalera).toEqual({
      entitat: '9999', compte4: '4321', dataInicial: { a: 2026, m: 6, d: 1 }, dataFinal: { a: 2026, m: 6, d: 30 }, saldoInicial: 100000, divisa: 'EUR'
    });
    expect(compte.moviments).toEqual([{ dataOperacio: { a: 2026, m: 6, d: 10 }, dataValor: { a: 2026, m: 6, d: 10 }, centims: -2500, conceptComu: '03' }]);
    expect(compte.peu).toEqual({ saldoFinal: 97500 });
    expect(r.csv[0].lectura.moviments).toEqual([
      { fila: 2, dataOperacio: { a: 2026, m: 6, d: 10 }, dataValor: { a: 2026, m: 6, d: 10 }, centims: -2500, saldo: 97500 },
      { fila: 3, dataOperacio: { a: 2026, m: 6, d: 11 }, dataValor: { a: 2026, m: 6, d: 11 }, centims: 1000, saldo: 98500 }
    ]);
    expect(comptesDe(r).comptes[0]).toMatchObject({ entitat: '9999', compte4: '4321', saldo: 97500, saldoDe: 'peu' });
  });

  test('reduixC43 i reduixCsv: l’import en divisa i la severitat dels avisos, i no comparteixen cap objecte amb la sencera', () => {
    const sencera = {
      comptes: [{
        capcalera: { entitat: '9999', oficina: '0001', compte4: '4321', nom: 'TITULAR SINTETIC', dataInicial: { a: 2026, m: 6, d: 1 }, dataFinal: null, saldoInicial: 0, divisa: 'EUR' },
        moviments: [{ dataOperacio: { a: 2026, m: 6, d: 2 }, dataValor: null, centims: -1000, conceptComu: '12', ref1: 'X', divisa: { codi: '840', moneda: 'USD', centims: -1100 } }],
        peu: null
      }],
      avisos: [{ codi: 'SUMA', severitat: 'alta', missatge: 'Línia 3: REF X', linia: 3 }]
    };
    const reduida = reduixC43(sencera);
    expect(reduida.comptes[0].moviments[0]).toEqual({
      dataOperacio: { a: 2026, m: 6, d: 2 }, dataValor: null, centims: -1000, conceptComu: '12', divisa: { moneda: 'USD', centims: -1100 }
    });
    expect(reduida.comptes[0].peu).toBeNull();
    expect(reduida.avisos).toEqual([{ codi: 'SUMA', severitat: 'alta' }]);
    expect(reduida.comptes[0].capcalera.dataInicial).not.toBe(sencera.comptes[0].capcalera.dataInicial);
    expect(reduixCsv({ moviments: [{ fila: 2, concepte: 'PERSONA', comerc: 'FORN', centims: 5, saldo: null }], avisos: [] }).moviments)
      .toEqual([{ fila: 2, dataOperacio: null, dataValor: null, centims: 5, saldo: null }]);
    expect(reduixC43(null)).toEqual({ comptes: [], avisos: [] });
  });

  test('sense fitxers o massa fitxers de colp: ErrorTauler', async () => {
    expect((await errorDe(executaTractorTauler({ fitxers: [], aprovacio }))).codi).toBe('PARAMETRES_INVALIDS');
    const massa = Array.from({ length: 3 }, (_, i) => fitxer(`e${i}.n43`, N43));
    const error = await errorDe(executaTractorTauler({ fitxers: massa, aprovacio, limits: { fitxers: 2 } }));
    expect(error).toBeInstanceOf(ErrorTauler);
    expect(error.codi).toBe('MASSA_FITXERS');
  });
});

describe('la configuració de l’empresa', () => {
  test('l’esquema és el de facturacio/configEmpresa.js (copiat, no importat)', () => {
    expect(ESQUEMA_CONFIG).toBe(ESQUEMA_CONFIG_EMPRESA);
  });

  test('identitatDeConfig: el nom comercial o el legal i la població fiscal; res més', () => {
    const config = JSON.parse(CONFIG);
    expect(identitatDeConfig(config)).toEqual({ nom: 'Taller de Prova', poble: 'Poble de Prova' });
    expect(identitatDeConfig({ ...config, nomComercial: undefined })).toEqual({ nom: 'Empresa de Prova SL', poble: 'Poble de Prova' });
    expect(identitatDeConfig({ ...config, domiciliFiscal: 'cap' })).toEqual({ nom: 'Taller de Prova', poble: '' });
    expect(identitatDeConfig({ ...config, esquema: 'un-altre' })).toBeNull();
    expect(identitatDeConfig({ ...config, nom: '', nomComercial: 'x'.repeat(121) })).toBeNull();
    expect(identitatDeConfig(null)).toBeNull();
  });

  test('el selector accepta els extractes, el CSV i la configuració', () => {
    expect(ACCEPTA_TAULER).toBe('.n43,.aeb,.c43,.q43,.txt,.dat,.csv,.json');
    expect(llegits).not.toContain('gran.n43');
  });
});
