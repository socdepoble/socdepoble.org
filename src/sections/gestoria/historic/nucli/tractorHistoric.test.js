// @vitest-environment node
/* Gestoria · Històric · el tractor 'gestoria.historic' (Onada 6, ordre del
   Mestre, 261009): fail-closed (cap byte es llig sense l'aprovació vigent
   del seu manifest), classificació dins i lectura reduïda (cap text de
   concepte, comerç ni SEPA a l'eixida). Un autenticador WebAuthn simulat
   signa de veres i la porta ho verifica. Extractes sintètics fets ací. */
import { describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../../tests/helpers/autenticadorSimulat.js';
import { ErrorAprovacio, preparaRegistre } from '../../../tractors/nucli/aprovacio.js';
import { TRACTOR_HISTORIC, TRACTOR_TAULER } from '../../tractors.js';
import {
  ACCEPTA_HISTORIC, CODIS_TRACTOR_HISTORIC, ErrorHistoric, LIMITS_HISTORIC, executaTractorHistoric, fnv1a
} from './tractorHistoric.js';

const ARA = Date.UTC(2026, 9, 9, 3, 0, 0);
const DIA = 86400000;
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const ALTRA = `sha256:${'cd'.repeat(32)}`;

const autenticador = await creaAutenticadorSimulat();
const ALTERAT = Object.freeze({ ...TRACTOR_HISTORIC, descripcio: 'Una altra descripció.' });
const SIGNATS = new Map(await Promise.all([TRACTOR_HISTORIC, TRACTOR_TAULER, ALTERAT].map(async (manifest, i) => [
  manifest, await autenticador.signa({ manifest, empremta: EMPREMTA, ara: ARA - 60000, nonce: new Uint8Array(16).fill(i + 30) })
])));
function aprovacioDe(manifest, { empremta = EMPREMTA, registres, ara = ARA } = {}) {
  return {
    manifest, empremta, registres: registres ?? [SIGNATS.get(manifest)], claus: autenticador.claus,
    origen: autenticador.origen, rpId: autenticador.rpId, ara
  };
}
const APROVACIO = aprovacioDe(TRACTOR_HISTORIC);

function fitxer(name, contingut, { size } = {}) {
  const bytes = typeof contingut === 'string' ? new TextEncoder().encode(contingut) : contingut;
  return { name, size: size ?? bytes.length, arrayBuffer: vi.fn(async () => bytes.slice().buffer) };
}

/* ── Norma 43 sintètica (posicions de nucli/c43.js) ── */
const xifres = (n, llargaria) => String(Math.abs(n)).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const aammdd = (iso) => iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10);
function n43({ entitat = '9999', compte = '0000004321', desde, fins, saldoInicial = 100000, moviments }) {
  const linies = [`11${entitat}0001${compte}${aammdd(desde)}${aammdd(fins)}2${xifres(saldoInicial, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`];
  let deure = 0, haver = 0, sumaDeure = 0, sumaHaver = 0;
  for (const m of moviments) {
    if (m.centims < 0) { deure += 1; sumaDeure -= m.centims; } else { haver += 1; sumaHaver += m.centims; }
    linies.push(`22${text('', 4)}0001${aammdd(m.data)}${aammdd(m.data)}${m.comu ?? '99'}000${m.centims < 0 ? '1' : '2'}${xifres(m.centims, 14)}${xifres(0, 10)}${text(m.ref ?? '', 12)}${text('', 16)}`);
    (m.conceptes ?? []).forEach((c, i) => linies.push(`23${xifres(i + 1, 2)}${text(c, 38)}${text('', 38)}`));
    if (m.usd != null) linies.push(`2401840${xifres(m.usd, 14)}${text('', 59)}`);
  }
  const saldoFinal = saldoInicial + sumaHaver - sumaDeure;
  linies.push(`33${entitat}0001${compte}${xifres(deure, 5)}${xifres(sumaDeure, 14)}${xifres(haver, 5)}${xifres(sumaHaver, 14)}2${xifres(saldoFinal, 14)}978${text('', 4)}`);
  linies.push(`88${'9'.repeat(18)}${xifres(linies.length, 6)}${text('', 54)}`);
  return linies.join('\r\n');
}

const GENER = n43({
  desde: '2025-01-01', fins: '2025-01-31', moviments: [
    { data: '2025-01-05', centims: -2150, conceptes: ['COMPRA TARJ. ANTHROPIC'], usd: 2200, ref: 'REFPRIVADA01' },
    { data: '2025-01-08', centims: -2000, conceptes: ['OPENAI *CHATGPT SUBSCR'] },
    { data: '2025-01-09', centims: -1200, conceptes: ['GOOGLE *SERVICES'] },
    { data: '2025-01-15', centims: 121000, conceptes: ['TRANSFERENCIA DE EMPRESA SINTETICA'] },
    { data: '2025-01-28', centims: -29400, conceptes: ['TGSS COTIZACION 0521'] }
  ]
});
/* El text privat que no ha d'eixir mai del tractor. */
const PRIVATS = ['ANTHROPIC', 'CHATGPT', 'GOOGLE', 'EMPRESA SINTETICA', 'TGSS', 'REFPRIVADA', 'TITULAR SINTETIC'];
const CLAUS_VETADES = [
  'nom', 'oficina', 'modalitat', 'codiDivisa', 'linia', 'document', 'ref1', 'ref2', 'conceptPropi', 'conceptes', 'sepa',
  'creditor', 'idCreditor', 'cif', 'mandat', 'concepte', 'comerc', 'fi', 'registres', 'recompte', 'codificacio', 'text'
];
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

describe('el manifest', () => {
  test('dades personals, signatura, cap xarxa, fitxa pròpia; fonts congelades i ordenades', () => {
    expect(TRACTOR_HISTORIC).toMatchObject({
      schema: 'sdp.tractor.v1', id: 'gestoria.historic', dadesPersonals: true, nivellMinim: 'signatura', xarxa: 'cap',
      fitxa: 'src/sections/gestoria/fitxes/gestoria_historic.md', caducitatDies: 90
    });
    expect(Object.isFrozen(TRACTOR_HISTORIC.fonts)).toBe(true);
    expect([...TRACTOR_HISTORIC.fonts]).toEqual([...TRACTOR_HISTORIC.fonts].sort());
    expect(new Set(TRACTOR_HISTORIC.fonts).size).toBe(TRACTOR_HISTORIC.fonts.length);
    for (const font of ['src/sections/gestoria/historic/nucli/tractorHistoric.js', 'src/sections/gestoria/despeses/nucli/categories.js',
      'src/sections/tractors/nucli/aprovacio.js', 'src/sections/gestoria/nucli/c43.js']) expect(TRACTOR_HISTORIC.fonts).toContain(font);
    expect(ACCEPTA_HISTORIC).toBe('.n43,.aeb,.c43,.q43,.txt,.dat,.csv');
    expect(LIMITS_HISTORIC).toMatchObject({ fitxers: 60, midaFitxer: 10 * 1024 * 1024 });
  });
});

describe('fail-closed: sense l’aprovació del seu manifest, cap byte es llig', () => {
  const revocada = [
    SIGNATS.get(TRACTOR_HISTORIC),
    preparaRegistre({ manifest: TRACTOR_HISTORIC, empremta: EMPREMTA, decisio: 'revocat', nivell: 'confirmacio', ara: ARA - 1000, nonce: new Uint8Array(16).fill(9) })
  ];
  test.each([
    ['sense cap registre', aprovacioDe(TRACTOR_HISTORIC, { registres: [] }), 'APROVACIO_REQUERIDA'],
    ['amb l’aprovació del Tauler', aprovacioDe(TRACTOR_TAULER), 'APROVACIO_REQUERIDA'],
    ['amb l’empremta divergent', aprovacioDe(TRACTOR_HISTORIC, { empremta: ALTRA }), 'EMPREMTA_DIVERGENT'],
    ['amb un manifest alterat', aprovacioDe(ALTERAT), 'EMPREMTA_DIVERGENT'],
    ['amb l’aprovació revocada', aprovacioDe(TRACTOR_HISTORIC, { registres: revocada }), 'APROVACIO_REVOCADA'],
    ['amb l’aprovació caducada', aprovacioDe(TRACTOR_HISTORIC, { ara: ARA + 91 * DIA }), 'APROVACIO_CADUCADA'],
    ['sense cap clau registrada', { ...APROVACIO, claus: [] }, 'SIGNATURA_INVALIDA'],
    ['sense aprovació', undefined, 'APROVACIO_REQUERIDA']
  ])('%s: ErrorAprovacio i cap byte demanat', async (_cas, aprovacio, codi) => {
    const triat = fitxer('gener.n43', GENER);
    const error = await errorDe(executaTractorHistoric({ fitxers: [triat], aprovacio }));
    expect(error).toBeInstanceOf(ErrorAprovacio);
    expect(error.codi).toBe(codi);
    expect(triat.arrayBuffer).not.toHaveBeenCalled();
  });

  test('un senyal ja cancel·lat, una regla invàlida o massa fitxers: cap byte', async () => {
    const triat = fitxer('gener.n43', GENER);
    const controlador = new AbortController();
    controlador.abort();
    expect((await errorDe(executaTractorHistoric({ fitxers: [triat], aprovacio: APROVACIO, signal: controlador.signal }))).codi).toBe('LECTURA_CANCELLADA');
    const regla = await errorDe(executaTractorHistoric({ fitxers: [triat], aprovacio: APROVACIO, regles: [{ patro: 'x', categoria: 'ia' }] }));
    expect(regla).toBeInstanceOf(ErrorHistoric);
    expect(regla.codi).toBe('REGLA_INVALIDA');
    const molts = Array.from({ length: 61 }, (_, i) => fitxer(`e${i}.n43`, GENER));
    expect((await errorDe(executaTractorHistoric({ fitxers: molts, aprovacio: APROVACIO }))).codi).toBe('MASSA_FITXERS');
    expect((await errorDe(executaTractorHistoric({ fitxers: [], aprovacio: APROVACIO }))).codi).toBe('PARAMETRES_INVALIDS');
    expect(triat.arrayBuffer).not.toHaveBeenCalled();
    expect(molts.some((f) => f.arrayBuffer.mock.calls.length)).toBe(false);
    expect(CODIS_TRACTOR_HISTORIC).toContain('REGLA_INVALIDA');
  });
});

describe('amb l’aprovació vigent: classifica dins i en torna la lectura reduïda', () => {
  test('cada moviment porta id opac, categoria, proveïdor, confiança i motiu; la divisa del registre 24', async () => {
    const { extractes, csv, avisos, classificats } = await executaTractorHistoric({ fitxers: [fitxer('gener.n43', GENER)], aprovacio: APROVACIO });
    expect(csv).toEqual([]);
    expect(avisos).toEqual([]);
    const moviments = extractes[0].lectura.comptes[0].moviments;
    expect(moviments.map((m) => [m.categoria, m.proveidor, m.confianca])).toEqual([
      ['ia', 'anthropic', 'mitjana'], ['ia', 'openai', 'mitjana'], ['revisa', 'google', 'mitjana'], ['clients', null, 'baixa'], ['reta', null, 'mitjana']
    ]);
    expect(moviments[0].divisa).toEqual({ moneda: 'USD', centims: -2200 });
    for (const m of moviments) expect(m.id).toMatch(/^m[0-9a-f]{8}$/);
    expect(new Set(moviments.map((m) => m.id)).size).toBe(5);
    expect(classificats).toEqual({ ia: 2, revisa: 1, clients: 1, reta: 1 });
  });

  test('cap text del banc ni camp vetat a l’eixida', async () => {
    const resultat = await executaTractorHistoric({ fitxers: [fitxer('gener.n43', GENER)], aprovacio: APROVACIO });
    const json = JSON.stringify(resultat);
    for (const privat of PRIVATS) expect(json, privat).not.toContain(privat);
    expect(clausDe(resultat).filter((clau) => CLAUS_VETADES.includes(clau))).toEqual([]);
  });

  test('les regles de la persona classifiquen dins, i el seu text tampoc ix', async () => {
    const regles = [{ patro: 'google *services', categoria: 'ia', proveidor: 'google-gemini' }];
    const { extractes } = await executaTractorHistoric({ fitxers: [fitxer('gener.n43', GENER)], aprovacio: APROVACIO, regles });
    expect(extractes[0].lectura.comptes[0].moviments[2]).toMatchObject({ categoria: 'ia', proveidor: 'google-gemini', confianca: 'alta', motiu: 'REGLA_MANUAL' });
    expect(JSON.stringify(extractes)).not.toContain('SERVICES');
  });

  test('el mateix moviment té el mateix id en dos extractes que se solapen, siga quin siga l’ordre', async () => {
    const febrer = n43({ desde: '2025-01-20', fins: '2025-02-28', moviments: [
      { data: '2025-01-28', centims: -29400, conceptes: ['TGSS COTIZACION 0521'] },
      { data: '2025-02-05', centims: -2150, conceptes: ['ANTHROPIC'] }
    ] });
    const ids = async (ordre) => {
      const { extractes } = await executaTractorHistoric({ fitxers: ordre.map(([nom, t]) => fitxer(nom, t)), aprovacio: APROVACIO });
      return extractes.map((e) => e.lectura.comptes[0].moviments.map((m) => m.id));
    };
    const [a, b] = await ids([['gener.n43', GENER], ['febrer.n43', febrer]]);
    const [b2, a2] = await ids([['febrer.n43', febrer], ['gener.n43', GENER]]);
    expect(a2).toEqual(a);
    expect(b2).toEqual(b);
    expect(b[0]).toBe(a[4]);
    expect(fnv1a('')).toBe('811c9dc5');
  });

  test('Norma 43 i CSV junts: el comerç del CSV classifica la compra amb targeta, i el CSV també es classifica', async () => {
    const generic = n43({ desde: '2025-03-01', fins: '2025-03-31', moviments: [{ data: '2025-03-04', centims: -1800, conceptes: ['COMPRA TARJETA'] }] });
    const ambComerc = [
      'Fecha,F. valor,Concepto,Importe,Saldo',
      '2025-03-04,2025-03-04,"OP.TARJ.COMPRA COMERCIO',
      '999999******1234 PERPLEXITY AI",-18.00,982.00'
    ].join('\n');
    const { extractes, csv } = await executaTractorHistoric({
      fitxers: [fitxer('marc.n43', generic), fitxer('marc.csv', ambComerc)], aprovacio: APROVACIO
    });
    expect(extractes[0].lectura.comptes[0].moviments[0]).toMatchObject({ categoria: 'ia', proveidor: 'perplexity', confianca: 'alta', motiu: 'COMERC' });
    expect(csv[0].lectura.moviments[0]).toMatchObject({ categoria: 'ia', proveidor: 'perplexity', id: expect.stringMatching(/^m[0-9a-f]{8}$/) });
    expect(JSON.stringify(csv)).not.toContain('PERPLEXITY');
  });

  test('dos extractes solapats i un CSV: les dues còpies de la compra reben el comerç, siga quina siga la que es quede la sèrie', async () => {
    const compra = { data: '2025-03-04', centims: -1800, conceptes: ['COMPRA TARJETA'] };
    const marc = n43({ desde: '2025-03-01', fins: '2025-03-31', moviments: [compra] });
    const trimestre = n43({ desde: '2025-01-01', fins: '2025-03-31', moviments: [compra] });
    const ambComerc = [
      'Fecha,F. valor,Concepto,Importe,Saldo',
      '2025-03-04,2025-03-04,"OP.TARJ.COMPRA COMERCIO',
      '999999******1234 PERPLEXITY AI",-18.00,982.00'
    ].join('\n');
    const { extractes } = await executaTractorHistoric({
      fitxers: [fitxer('marc.n43', marc), fitxer('1t.n43', trimestre), fitxer('marc.csv', ambComerc)], aprovacio: APROVACIO
    });
    const copies = extractes.map((e) => e.lectura.comptes[0].moviments[0]);
    expect(copies.map((m) => [m.categoria, m.proveidor, m.motiu])).toEqual([['ia', 'perplexity', 'COMERC'], ['ia', 'perplexity', 'COMERC']]);
    expect(copies[0].id).toBe(copies[1].id);
  });

  test('un fitxer d’un altre tipus o massa gran no atura la resta: torna com a avís', async () => {
    const gran = fitxer('gran.n43', GENER, { size: 11 * 1024 * 1024 });
    const { extractes, avisos } = await executaTractorHistoric({
      fitxers: [fitxer('config.json', '{}'), gran, fitxer('gener.n43', GENER)], aprovacio: APROVACIO
    });
    expect(extractes).toHaveLength(1);
    expect(avisos.map((a) => a.codi)).toEqual(['TIPUS_DESCONEGUT', 'FITXER_MASSA_GRAN']);
    expect(gran.arrayBuffer).not.toHaveBeenCalled();
  });

  test('cancel·lar mentre llig: el fitxer començat acaba i no se’n comença cap altre', async () => {
    const controlador = new AbortController();
    const primer = { name: 'a.n43', size: 10, arrayBuffer: vi.fn(async () => { controlador.abort(); return new TextEncoder().encode(GENER).buffer; }) };
    const segon = fitxer('b.n43', GENER);
    const error = await errorDe(executaTractorHistoric({ fitxers: [primer, segon], aprovacio: APROVACIO, signal: controlador.signal }));
    expect(error.codi).toBe('LECTURA_CANCELLADA');
    expect(segon.arrayBuffer).not.toHaveBeenCalled();
  });
});
