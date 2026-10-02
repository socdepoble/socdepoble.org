// @vitest-environment node
/* Gestoria · nucli · tractor: el pipeline sencer sobre una carpeta sintètica
   en memòria. Els PDF es munten ací mateix (Helvetica i FlateDecode amb
   node:zlib), amb empreses fictícies i CIF calculats; l'únic identificador
   real és el NIF públic d'un proveïdor del catàleg, que el tractor hi posa
   pel nom del fitxer. Cap dada de persona. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, test } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { ErrorAprovacio, preparaRegistre } from '../../tractors/nucli/aprovacio.js';
import { TRACTOR_CORREUS, TRACTOR_FACTURES } from '../tractors.js';
import { crearFactura } from './model.js';
import {
  CODIS_TRACTOR, ErrorTractor, LIMITS_TRACTOR, esRutaOculta, executaCreuamentCorreus, executaTractorFactures, trimestreDeCarpeta
} from './tractor.js';

/* ── Dades sintètiques ──────────────────────────────────────────────────── */

function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return (10 - ((parells + senars) % 10)) % 10;
}
const cif = (lletra, xifres) => `${lletra}${xifres}${controlCif(xifres)}`;

const TITULAR = 'Associacio Titular Exemple';
const CIF_TITULAR = cif('G', '7654321');
const CIF_LLUM = cif('B', '7100001');
const CIF_CLIENT = cif('B', '7100008');
const MB = 1024 * 1024;

const latin1 = (s) => Buffer.from(s, 'latin1');
const bytes = (text) => new TextEncoder().encode(text);
const inflateNode = async (b) => new Uint8Array(inflateSync(b));

/* Un PDF d'una pàgina amb una línia de text per element, comprimit o no. */
function pdf(linies, { comprimit = true } = {}) {
  const contingut = linies.map((l, i) => `BT /F1 10 Tf 72 ${780 - i * 16} Td (${l.replace(/[\\()]/g, '\\$&')}) Tj ET`).join('\n');
  const dades = comprimit ? deflateSync(latin1(contingut)) : latin1(contingut);
  const objectes = [
    latin1('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    latin1('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
    latin1('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n'),
    Buffer.concat([
      latin1(`4 0 obj\n<< ${comprimit ? '/Filter /FlateDecode ' : ''}/Length ${dades.length} >>\nstream\n`), dades, latin1('\nendstream\nendobj\n')
    ]),
    latin1('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n')
  ];
  const capcalera = latin1('%PDF-1.7\n');
  const posicions = [];
  let pos = capcalera.length;
  for (const o of objectes) {
    posicions.push(pos);
    pos += o.length;
  }
  const xref = `xref\n0 6\n0000000000 65535 f \n${posicions.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`;
  return new Uint8Array(Buffer.concat([capcalera, ...objectes, latin1(`${xref}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`)]));
}

const LINIES_LLUM = [
  'Exemple Llum SL',
  `CIF: ${CIF_LLUM}`,
  'Numero de factura: EL-2026-07',
  'Fecha de la factura: 31/07/2026',
  `Cliente: ${TITULAR}`,
  `NIF: ${CIF_TITULAR}`,
  'Concepto: Subministrament electric juliol',
  'Base imponible 100,00 EUR',
  'IVA 21% 21,00 EUR',
  'Total factura 121,00 EUR'
];
const PDF_LLUM = pdf(LINIES_LLUM);
const PDF_EMESA = pdf([
  TITULAR,
  `NIF: ${CIF_TITULAR}`,
  'Factura num. F26-0003',
  'Data: 10/08/2026',
  'Client: Exemple Distribucions SL',
  `CIF client: ${CIF_CLIENT}`,
  'Concepte: Taller de pedra seca',
  'Base imposable 200,00',
  'IVA 21% 42,00',
  'Total 242,00'
]);
const PDF_REBUT = pdf(['Justificant de pagament', 'Lloguer del local', 'Total pagat 300,00 EUR']);
const CSV_PROVEIDOR = [
  'Número de factura,7777777777',
  'Fecha de la factura,31 jul 2026',
  'Importe de la factura,"12,10 €"',
  '',
  'Descripción,Intervalo,Cantidad,Importe(€)',
  'Servei al núvol,1 jul 2026 - 31 jul 2026,1,"10,00"',
  'Subtotal en EUR,,,"10,00"',
  'I.V.A. (21%),,,"2,10"',
  'Total en EUR,,,"12,10"'
].join('\r\n');

const MODEL_2T = '2026_2T/2026-FACTURACIO-Associacio_Titular_Exemple_-_2T.csv';
const TEXT_MODEL = 'full sintètic del 2T';

function carpetaSintetica() {
  return {
    [MODEL_2T]: bytes(TEXT_MODEL),
    '2026_2T/factura_vella.pdf': PDF_LLUM,
    '2026_3T/exemple_llum_juliol.pdf': PDF_LLUM,
    '2026_3T/exemple_llum_juliol copia.pdf': PDF_LLUM,
    '2026_3T/F26-0003.pdf': PDF_EMESA,
    '2026_3T/7777777777.csv': bytes(CSV_PROVEIDOR),
    '2026_3T/Rebut_lloguer.pdf': PDF_REBUT,
    '2026_3T/foto_tiquet.jpg': new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]),
    '2026_3T/notes.txt': bytes('apunts'),
    '2026_3T/.DS_Store': new Uint8Array([0, 0, 0, 1]),
    '2026_3T/.amagada/secret.pdf': PDF_LLUM,
    'altres/document.pdf': PDF_EMESA
  };
}

/* L'historial del 2T tal com el tornaria un lector de fulls. */
const historica = (dades) => crearFactura({ origen: { fitxer: MODEL_2T, metode: 'model' }, ...dades });
const MODEL_LLEGIT = Object.freeze({
  any: 2026,
  t: 2,
  titular: TITULAR,
  inici: { a: 2026, m: 4, d: 1 },
  fi: { a: 2026, m: 6, d: 30 },
  ingressos: [
    historica({ tipus: 'ingres', data: '15/04/2026', num: 'F26 0001', contrapart: 'Exemple Distribucions SL', nif: CIF_CLIENT, descripcio: 'Taller', subtotal: 50000, iva: 10500, total: 60500 }),
    historica({ tipus: 'ingres', data: '20/05/2026', num: 'F26 0002', contrapart: 'Exemple Distribucions SL', nif: CIF_CLIENT, descripcio: 'Taller', subtotal: 50000, iva: 10500, total: 60500 })
  ],
  despeses: [4, 5, 6].map((m) => historica({
    tipus: 'despesa', data: { a: 2026, m, d: 28 }, num: `EL-2026-0${m}`, contrapart: 'Exemple Llum SL', nif: CIF_LLUM,
    descripcio: 'Subministrament electric', subtotal: 10000, iva: 2100, total: 12100
  })),
  avisos: [{ codi: 'TOTALS_NO_QUADREN', severitat: 'mitjana', missatge: 'Avís sintètic del lector.' }]
});

function lectorSintetic() {
  const lectures = [];
  return { lectures, llegeixModel: (text, opcions) => { lectures.push({ text, ...opcions }); return MODEL_LLEGIT; } };
}

function fontMemoria(fitxers, { nom = 'Facturacio', mides = {}, falla = {}, retorna = {} } = {}) {
  const crides = [];
  const font = {
    nom,
    async llista() {
      crides.push('llista');
      return Object.keys(fitxers).map((ruta) => ({ ruta, mida: mides[ruta] ?? fitxers[ruta].length, modificat: 0 }));
    },
    async llig(ruta) {
      crides.push(`llig:${ruta}`);
      if (falla[ruta]) throw falla[ruta];
      if (retorna[ruta]) return retorna[ruta];
      if (!(ruta in fitxers)) throw new Error('absent');
      return fitxers[ruta];
    },
    async escriu(ruta) {
      crides.push(`escriu:${ruta}`);
    }
  };
  return { font, crides };
}

/* Una font que apunta cada propietat que se li demana. */
function fontEspia() {
  const accessos = [];
  const { font } = fontMemoria(carpetaSintetica());
  return {
    accessos,
    font: new Proxy(font, {
      get(objecte, propietat) {
        accessos.push(String(propietat));
        return Reflect.get(objecte, propietat);
      }
    })
  };
}

const ARA = Date.UTC(2026, 9, 2, 10, 0, 0);
const DIA = 86400000;
const AVUI = { a: 2026, m: 10, d: 2 };
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const ALTRA_EMPREMTA = `sha256:${'cd'.repeat(32)}`;

/* Els dos tractors exigixen signatura (dades personals): un autenticador
   WebAuthn simulat signa de veres i la porta ho verifica. */
const autenticador = await creaAutenticadorSimulat();
const MANIFEST_ALTERAT = Object.freeze({ ...TRACTOR_FACTURES, descripcio: 'Una altra descripció.' });
const SIGNATS = new Map(await Promise.all([TRACTOR_FACTURES, TRACTOR_CORREUS, MANIFEST_ALTERAT].map(async (manifest, i) => [
  manifest, await autenticador.signa({ manifest, empremta: EMPREMTA, ara: ARA - 60000, nonce: new Uint8Array(16).fill(i) })
])));
const signat = (manifest) => SIGNATS.get(manifest);
/* Revocar no exigix cap nivell: useTractors.revoca la fa amb confirmació. */
const revocacio = (manifest, ara) => preparaRegistre({
  manifest, empremta: EMPREMTA, decisio: 'revocat', nivell: 'confirmacio', ara, nonce: new Uint8Array(16).fill(9)
});
/* Una confirmació escrita, la d'abans: el registre és vàlid, però no arriba al nivell. */
const CONFIRMADA = preparaRegistre({
  manifest: { ...TRACTOR_FACTURES, nivellMinim: 'confirmacio' }, empremta: EMPREMTA, decisio: 'aprovat',
  nivell: 'confirmacio', ara: ARA - 60000, nonce: new Uint8Array(16).fill(8)
});

function aprovacioDe(manifest, { empremta = EMPREMTA, registres, ara = ARA } = {}) {
  return {
    manifest, empremta, registres: registres ?? [signat(manifest)], claus: autenticador.claus,
    origen: autenticador.origen, rpId: autenticador.rpId, ara
  };
}

/* Un WebCrypto que servix per a la porta (verificar la signatura acaba amb
   verify) i després es perd o falla: així es prova el que passa a l'anàlisi. */
function webcryptoDespresDeLaPorta(digestDespres) {
  const real = globalThis.crypto.subtle;
  let portaPassada = false;
  return {
    get digest() {
      return portaPassada ? digestDespres : real.digest.bind(real);
    },
    importKey: (...args) => real.importKey(...args),
    async verify(...args) {
      const ok = await real.verify(...args);
      portaPassada = true;
      return ok;
    }
  };
}

const base = (font, extra = {}) => ({
  font, any: 2026, t: 3, aprovacio: aprovacioDe(TRACTOR_FACTURES), inflate: inflateNode, avui: AVUI, nifsTitular: [CIF_TITULAR], ...extra
});
const codis = (llista) => llista.map((x) => x.codi);
const doc = (r, ruta) => r.documents.find((d) => d.ruta === ruta);
const errorDe = (promesa) => promesa.then(() => null, (error) => error);

/* ── Proves ─────────────────────────────────────────────────────────────── */

describe('trimestreDeCarpeta i esRutaOculta', () => {
  test.each([
    ['2026_3T', { any: 2026, t: 3 }],
    ['2026-3T', { any: 2026, t: 3 }],
    ['2026 3t', { any: 2026, t: 3 }],
    ['3T_2026', { any: 2026, t: 3 }],
    ['1t-2025', { any: 2025, t: 1 }],
    ['2026_4T revisat', { any: 2026, t: 4 }],
    ['2026_5T', null],
    ['20263T', null],
    ['2026_3TRIM', null],
    ['Factures', null],
    ['', null]
  ])('«%s»', (nom, esperat) => {
    expect(trimestreDeCarpeta(nom)).toEqual(esperat);
  });

  test('ocults i del sistema, a qualsevol nivell', () => {
    for (const ruta of ['.DS_Store', '2026_3T/._factura.pdf', '.git/config', '__MACOSX/x.pdf', 'a/Thumbs.db', 'desktop.ini']) {
      expect(esRutaOculta(ruta), ruta).toBe(true);
    }
    expect(esRutaOculta('2026_3T/factura.pdf')).toBe(false);
  });

  test('els límits són explícits i els codis, coneguts', () => {
    expect(LIMITS_TRACTOR.midaFitxer).toBe(25 * MB);
    expect(Object.isFrozen(LIMITS_TRACTOR)).toBe(true);
    expect(CODIS_TRACTOR).toEqual(expect.arrayContaining(['CARPETA_BUIDA', 'TRIMESTRE_NO_TROBAT', 'FITXER_MASSA_GRAN']));
  });
});

describe('FAIL-CLOSED: sense l\'aprovació d\'este tractor no es toca la carpeta', () => {
  const revocada = [signat(TRACTOR_FACTURES), revocacio(TRACTOR_FACTURES, ARA - 30000)];
  test.each([
    ['sense aprovació', undefined, 'APROVACIO_REQUERIDA'],
    ['sense cap registre', aprovacioDe(TRACTOR_FACTURES, { registres: [] }), 'APROVACIO_REQUERIDA'],
    ['amb l\'aprovació del tractor del correu', aprovacioDe(TRACTOR_CORREUS), 'APROVACIO_REQUERIDA'],
    ['amb l\'empremta divergent', aprovacioDe(TRACTOR_FACTURES, { empremta: ALTRA_EMPREMTA }), 'EMPREMTA_DIVERGENT'],
    ['amb l\'aprovació revocada', aprovacioDe(TRACTOR_FACTURES, { registres: revocada }), 'APROVACIO_REVOCADA'],
    ['amb l\'aprovació caducada', aprovacioDe(TRACTOR_FACTURES, { ara: ARA + 91 * DIA }), 'APROVACIO_CADUCADA'],
    ['amb un manifest alterat', aprovacioDe(MANIFEST_ALTERAT), 'EMPREMTA_DIVERGENT'],
    ['amb una confirmació escrita (cal signatura)', aprovacioDe(TRACTOR_FACTURES, { registres: [CONFIRMADA] }), 'NIVELL_INSUFICIENT'],
    ['amb una signatura de cap clau registrada', { ...aprovacioDe(TRACTOR_FACTURES), claus: [] }, 'SIGNATURA_INVALIDA'],
    ['amb una signatura feta per a un altre origen', { ...aprovacioDe(TRACTOR_FACTURES), origen: 'https://altre.example.org' }, 'SIGNATURA_INVALIDA']
  ])('%s: ErrorAprovacio i cap accés a la font', async (_cas, aprovacio, codi) => {
    const { font, accessos } = fontEspia();
    const error = await errorDe(executaTractorFactures({ font, any: 2026, t: 3, aprovacio, inflate: inflateNode }));
    expect(error).toBeInstanceOf(ErrorAprovacio);
    expect(error.codi).toBe(codi);
    expect(accessos).toEqual([]);
  });

  test('amb l\'aprovació vigent sí que llig la carpeta', async () => {
    const { font, accessos } = fontEspia();
    await executaTractorFactures(base(font, { llegeixModel: lectorSintetic().llegeixModel }));
    expect(accessos).toContain('llista');
  });
});

describe('executaTractorFactures: el trimestre sencer', () => {
  let r;
  let crides;
  let lector;
  beforeAll(async () => {
    const memoria = fontMemoria(carpetaSintetica());
    crides = memoria.crides;
    lector = lectorSintetic();
    r = await executaTractorFactures(base(memoria.font, { llegeixModel: lector.llegeixModel }));
  });

  test('la proposta: titular de l\'historial, l\'ingrés per la sèrie i cada despesa una sola vegada', () => {
    expect(r.proposta).toMatchObject({ titular: TITULAR, any: 2026, t: 3 });
    expect(r.proposta.ingressos).toHaveLength(1);
    expect(r.proposta.ingressos[0]).toMatchObject({
      tipus: 'ingres', num: 'F26-0003', contrapart: 'Exemple Distribucions SL', nif: CIF_CLIENT, data: { a: 2026, m: 8, d: 10 },
      subtotal: 20000, iva: 4200, total: 24200, estat: 'completa', origen: { fitxer: '2026_3T/F26-0003.pdf', metode: 'pdf' }
    });
    expect(r.proposta.despeses.map((f) => f.num).sort()).toEqual(['7777777777', 'EL-2026-07']);
    const llum = r.proposta.despeses.find((f) => f.num === 'EL-2026-07');
    expect(llum).toMatchObject({
      tipus: 'despesa', contrapart: 'Exemple Llum SL', nif: CIF_LLUM, data: { a: 2026, m: 7, d: 31 }, subtotal: 10000, iva: 2100, total: 12100,
      estat: 'completa', origen: { fitxer: '2026_3T/exemple_llum_juliol.pdf', metode: 'pdf' }
    });
    expect(llum.origen.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(r.proposta.despeses.find((f) => f.num === '7777777777')).toMatchObject({
      contrapart: 'Google Cloud EMEA Limited', total: 1210, estat: 'completa', origen: { fitxer: '2026_3T/7777777777.csv', metode: 'csv-proveidor' }
    });
  });

  test('cada document del trimestre amb el seu estat; els ocults i els de fora, ni hi són', () => {
    const llum = doc(r, '2026_3T/exemple_llum_juliol.pdf');
    expect(llum).toMatchObject({ tipus: 'factura', estat: 'extreta', proveidor: 'exemple-llum', ambit: 'trimestre' });
    expect(llum.facturaId).toBe(r.proposta.despeses.find((f) => f.num === 'EL-2026-07').id);
    expect(llum.fragments.total).toBe('Total factura 121,00 EUR');
    expect(doc(r, '2026_3T/exemple_llum_juliol copia.pdf')).toMatchObject({ estat: 'ignorada' });
    expect(codis(doc(r, '2026_3T/exemple_llum_juliol copia.pdf').avisos)).toContain('DUPLICAT');
    expect(doc(r, '2026_3T/F26-0003.pdf')).toMatchObject({ tipus: 'factura', sentit: 'emesa', estat: 'extreta' });
    expect(doc(r, '2026_3T/7777777777.csv')).toMatchObject({ tipus: 'csv-factura', sentit: 'rebuda', estat: 'extreta', proveidor: 'google-cloud' });
    expect(doc(r, '2026_3T/Rebut_lloguer.pdf')).toMatchObject({ tipus: 'rebut', estat: 'ignorada' });
    expect(doc(r, '2026_3T/foto_tiquet.jpg')).toMatchObject({ tipus: 'imatge', estat: 'manual' });
    expect(doc(r, '2026_3T/notes.txt')).toMatchObject({ estat: 'ignorada' });
    expect(doc(r, MODEL_2T)).toMatchObject({ tipus: 'model-trimestral', estat: 'extreta', ambit: 'historial' });
    expect(codis(doc(r, MODEL_2T).avisos)).toEqual(['TOTALS_NO_QUADREN']);
    const rutes = r.documents.map((d) => d.ruta);
    for (const absent of ['2026_3T/.DS_Store', '2026_3T/.amagada/secret.pdf', 'altres/document.pdf', '2026_2T/factura_vella.pdf']) {
      expect(rutes).not.toContain(absent);
    }
    for (const d of r.documents) expect(['extreta', 'parcial', 'manual', 'ignorada']).toContain(d.estat);
  });

  test('incidències: la factura mensual que falta, el duplicat, el rebut sense factura i el correu no revisat', () => {
    const mensuals = r.incidencies.filter((i) => i.codi === 'FALTA_MENSUAL' && i.proveidor === 'exemple-llum');
    expect(mensuals.map((i) => i.mes)).toEqual(['2026-08', '2026-09']);
    expect(r.incidencies).toContainEqual(expect.objectContaining({ codi: 'DUPLICAT', fitxer: '2026_3T/exemple_llum_juliol copia.pdf' }));
    expect(r.incidencies).toContainEqual(expect.objectContaining({ codi: 'REBUT_SENSE_FACTURA', fitxer: '2026_3T/Rebut_lloguer.pdf' }));
    expect(codis(r.incidencies)).toContain('CORREU_NO_REVISAT');
    expect(codis(r.incidencies)).not.toContain('PDF_SENSE_DESCOMPRESSOR');
    expect(codis(r.incidencies)).not.toContain('IVA_INCOHERENT');
    const ordre = ['alta', 'mitjana', 'baixa', 'info'];
    const pesos = r.incidencies.map((i) => ordre.indexOf(i.severitat));
    expect(pesos).toEqual([...pesos].sort((x, y) => x - y));
  });

  test('només llig els candidats i el full anterior, i no escriu res', () => {
    expect(crides[0]).toBe('llista');
    expect(crides.filter((c) => c.startsWith('llig:')).sort()).toEqual([
      `llig:${MODEL_2T}`,
      'llig:2026_3T/7777777777.csv',
      'llig:2026_3T/F26-0003.pdf',
      'llig:2026_3T/Rebut_lloguer.pdf',
      'llig:2026_3T/exemple_llum_juliol copia.pdf',
      'llig:2026_3T/exemple_llum_juliol.pdf'
    ]);
    expect(crides.some((c) => c.startsWith('escriu:'))).toBe(false);
    expect(lector.lectures).toEqual([{ text: TEXT_MODEL, fitxer: MODEL_2T }]);
  });

  test('cobertura, avisos i el context per al creuament amb el correu', () => {
    expect(r.cobertura).toMatchObject({ carpeta: 'revisada', correu: 'no-revisat', carpetaTrimestre: '2026_3T', historial: ['2026_2T'] });
    expect(codis(r.avisos)).not.toContain('SENSE_HISTORIAL');
    expect(codis(r.avisos)).not.toContain('TITULAR_DESCONEGUT');
    expect(r.proveidors.find((p) => p.clau === 'exemple-llum')).toMatchObject({ cadencia: 'mensual', mesosVistos: ['2026-04', '2026-05', '2026-06'] });
    expect(r.nifsPropis).toContain(CIF_TITULAR);
  });

  test('el resultat no porta bytes ni text cru dels documents', () => {
    const json = JSON.stringify(r);
    expect(json).not.toContain('%PDF');
    expect(json).not.toContain('FlateDecode');
    expect(json).not.toContain('Lloguer del local');
  });
});

describe('fonts estructurades i sèrie pròpia', () => {
  test('el PDF que ja ve en el CSV del proveïdor no es compta dues vegades: guanya el CSV', async () => {
    const fitxers = { ...carpetaSintetica(), '2026_3T/7777777777.pdf': pdf(['Factura 7777777777', 'Total 12,10 EUR']) };
    const r = await executaTractorFactures(base(fontMemoria(fitxers).font, { llegeixModel: lectorSintetic().llegeixModel }));
    const csv = r.proposta.despeses.find((f) => f.origen.metode === 'csv-proveidor');
    expect(r.proposta.despeses.map((f) => f.num).sort()).toEqual(['7777777777', 'EL-2026-07']);
    expect(doc(r, '2026_3T/7777777777.pdf')).toMatchObject({ estat: 'ignorada', facturaId: csv.id });
    expect(codis(doc(r, '2026_3T/7777777777.pdf').avisos)).toContain('MATEIXA_FACTURA');
  });

  test('la moneda i la retenció que llig la recepta arriben a la factura (format-fiscal-02)', async () => {
    const enDolars = pdf([
      'Example Cloud Inc', 'Invoice number INV-2026-0907', 'Invoice date: 30/08/2026',
      'Subtotal $20.00', 'VAT (21%) $4.20', 'Total $24.20'
    ]);
    const ambRetencio = pdf([
      'Exemple Assessors SL', `CIF: ${cif('B', '7100002')}`, 'Factura num. AS-2026-031', 'Fecha de la factura: 10/09/2026',
      'Base imponible 1.000,00 EUR', 'IVA 21% 210,00 EUR', 'Retencion IRPF 15%: -150,00 EUR', 'Total a pagar 1.060,00 EUR'
    ]);
    const fitxers = { [MODEL_2T]: bytes(TEXT_MODEL), '2026_3T/example_cloud.pdf': enDolars, '2026_3T/assessoria_setembre.pdf': ambRetencio };
    const r = await executaTractorFactures(base(fontMemoria(fitxers).font, { llegeixModel: lectorSintetic().llegeixModel }));
    const usd = r.proposta.despeses.find((f) => f.num === 'INV-2026-0907');
    expect(usd).toMatchObject({ moneda: 'USD', subtotal: 2000, iva: 420, total: 2420, estat: 'pendent' });
    expect(usd.confianca).toMatchObject({ subtotal: 'baixa', iva: 'baixa', total: 'baixa' });
    expect(r.incidencies).toContainEqual(expect.objectContaining({ codi: 'MONEDA_ESTRANGERA', severitat: 'alta', facturaId: usd.id }));
    const irpf = r.proposta.despeses.find((f) => f.num === 'AS-2026-031');
    expect(irpf).toMatchObject({ retencio: 15000, total: 106000, estat: 'completa' });
    expect(irpf).not.toHaveProperty('moneda');
    expect(r.incidencies).toContainEqual(expect.objectContaining({ codi: 'RETENCIO_IRPF', facturaId: irpf.id }));
  });

  test('una factura sense pista al nom és emesa si el seu número és de la sèrie apresa', async () => {
    const emesa = pdf([
      TITULAR, `NIF: ${CIF_TITULAR}`, 'Factura num. F26-0004', 'Data: 20/09/2026', 'Client: Exemple Distribucions SL',
      `CIF client: ${CIF_CLIENT}`, 'Concepte: Taller de cistelleria', 'Base imposable 100,00', 'IVA 21% 21,00', 'Total 121,00'
    ]);
    const fitxers = { [MODEL_2T]: bytes(TEXT_MODEL), '2026_3T/taller_setembre.pdf': emesa };
    const r = await executaTractorFactures(base(fontMemoria(fitxers).font, { llegeixModel: lectorSintetic().llegeixModel }));
    expect(r.proposta.ingressos.map((f) => [f.num, f.contrapart, f.total])).toEqual([['F26-0004', 'Exemple Distribucions SL', 12100]]);
    expect(doc(r, '2026_3T/taller_setembre.pdf')).toMatchObject({ sentit: 'emesa', estat: 'extreta' });
    expect(doc(r, '2026_3T/taller_setembre.pdf').motiu).toMatch(/sèrie/);
    expect(codis(r.incidencies)).not.toContain('SENTIT_DESCONEGUT');
  });
});

describe('sense descompressor de PDF', () => {
  test('les factures en PDF queden pendents i hi ha la incidència informativa', async () => {
    const r = await executaTractorFactures(base(fontMemoria(carpetaSintetica()).font, { inflate: null, llegeixModel: lectorSintetic().llegeixModel }));
    const incidencia = r.incidencies.find((i) => i.codi === 'PDF_SENSE_DESCOMPRESSOR');
    expect(incidencia.severitat).toBe('info');
    expect(incidencia.missatge).toMatch(/^Este navegador no pot descomprimir PDF/);
    const pdfs = [...r.proposta.ingressos, ...r.proposta.despeses].filter((f) => f.origen.metode === 'pdf');
    expect(pdfs.length).toBe(2);
    for (const f of pdfs) expect(f.estat).toBe('pendent');
    expect(doc(r, '2026_3T/exemple_llum_juliol.pdf').estat).toBe('manual');
    expect(r.proposta.ingressos.map((f) => f.origen.fitxer)).toEqual(['2026_3T/F26-0003.pdf']);
    expect(r.proposta.despeses.find((f) => f.origen.metode === 'csv-proveidor').estat).toBe('completa');
    const mensuals = r.incidencies.filter((i) => i.codi === 'FALTA_MENSUAL' && i.proveidor === 'exemple-llum');
    expect(mensuals.map((i) => i.mes)).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(codis(r.incidencies)).toContain('DUPLICAT');
  });

  test('un PDF sense compressió es llig, però la factura queda pendent igualment', async () => {
    const { font } = fontMemoria({ [MODEL_2T]: bytes(TEXT_MODEL), '2026_3T/exemple_llum_juliol.pdf': pdf(LINIES_LLUM, { comprimit: false }) });
    const r = await executaTractorFactures(base(font, { inflate: null, llegeixModel: lectorSintetic().llegeixModel }));
    expect(r.proposta.despeses[0]).toMatchObject({ num: 'EL-2026-07', total: 12100, estat: 'pendent' });
    expect(doc(r, '2026_3T/exemple_llum_juliol.pdf').estat).toBe('parcial');
  });

  test('inflate ha de ser una funció o null', async () => {
    const error = await errorDe(executaTractorFactures(base(fontMemoria(carpetaSintetica()).font, { inflate: 'deflate' })));
    expect(error).toMatchObject({ name: 'ErrorTractor', codi: 'PARAMETRES_INVALIDS' });
  });
});

describe('on és el trimestre', () => {
  test('sense la carpeta del trimestre: TRIMESTRE_NO_TROBAT, amb els que sí que hi ha, i res llegit', async () => {
    const { font, crides } = fontMemoria({ '2026_1T/a.pdf': PDF_LLUM, '2026_2T/b.pdf': PDF_LLUM });
    const error = await errorDe(executaTractorFactures(base(font)));
    expect(error).toBeInstanceOf(ErrorTractor);
    expect(error.codi).toBe('TRIMESTRE_NO_TROBAT');
    expect(error.detalls).toEqual(['2026_1T', '2026_2T']);
    expect(error.message).toMatch(/2026_3T/);
    expect(crides).toEqual(['llista']);
  });

  test('si la carpeta triada és d\'un altre trimestre, també ho diu', async () => {
    const { font } = fontMemoria({ 'a.pdf': PDF_LLUM }, { nom: '2026_2T' });
    const error = await errorDe(executaTractorFactures(base(font)));
    expect(error).toMatchObject({ codi: 'TRIMESTRE_NO_TROBAT', detalls: ['2026_2T'] });
  });

  test('la carpeta triada ja és el trimestre: els fitxers són a l\'arrel', async () => {
    const { font } = fontMemoria({ 'F26-0003.pdf': PDF_EMESA, 'exemple_llum_juliol.pdf': PDF_LLUM }, { nom: '3T_2026' });
    const r = await executaTractorFactures(base(font));
    expect(r.cobertura.carpetaTrimestre).toBe('');
    expect(r.documents.map((d) => d.ruta).sort()).toEqual(['F26-0003.pdf', 'exemple_llum_juliol.pdf']);
    expect(codis(r.avisos)).toEqual(expect.arrayContaining(['SENSE_HISTORIAL', 'TITULAR_DESCONEGUT']));
    expect(r.proposta.titular).toBe('');
    /* Sense historial no hi ha sèrie: la factura emesa no es reconeix i es proposa com a despesa. */
    expect(codis(r.incidencies)).toContain('SENTIT_DESCONEGUT');
  });

  test('una carpeta sense subcarpetes de trimestre es llig com si fora el trimestre, amb avís', async () => {
    const { font } = fontMemoria({ 'exemple_llum_juliol.pdf': PDF_LLUM }, { nom: 'Factures' });
    const r = await executaTractorFactures(base(font));
    expect(codis(r.avisos)).toContain('CARPETA_SENSE_TRIMESTRE');
    expect(r.proposta.despeses).toHaveLength(1);
  });

  test('amb dues carpetes del mateix trimestre, llig la de dalt i avisa de l\'altra', async () => {
    const { font, crides } = fontMemoria({ '2026-3T/a.pdf': PDF_LLUM, 'copies/2026_3T/b.pdf': PDF_EMESA });
    const r = await executaTractorFactures(base(font));
    expect(r.cobertura.carpetaTrimestre).toBe('2026-3T');
    expect(codis(r.avisos)).toContain('CARPETES_TRIMESTRE_DIVERSES');
    expect(crides).not.toContain('llig:copies/2026_3T/b.pdf');
  });

  test('una carpeta buida (o només amb ocults): CARPETA_BUIDA', async () => {
    const { font } = fontMemoria({ '.DS_Store': new Uint8Array(1), '2026_3T/.DS_Store': new Uint8Array(1) });
    const error = await errorDe(executaTractorFactures(base(font)));
    expect(error).toMatchObject({ name: 'ErrorTractor', codi: 'CARPETA_BUIDA' });
  });

  test('el full anterior en XLSX no es pot llegir, i ho diu', async () => {
    const { font, crides } = fontMemoria({
      '2026_2T/2026-FACTURACIO-Associacio_Titular_Exemple_-_2T.xlsx': new Uint8Array([0x50, 0x4b, 3, 4]),
      '2026_3T/exemple_llum_juliol.pdf': PDF_LLUM
    });
    const r = await executaTractorFactures(base(font));
    expect(codis(r.avisos)).toEqual(expect.arrayContaining(['MODEL_SENSE_CSV', 'SENSE_HISTORIAL']));
    expect(crides.some((c) => c.endsWith('.xlsx'))).toBe(false);
  });

  test('sense llegeixModel, el lector per defecte és el de fullModel.js (si encara l\'exporta)', async () => {
    const modul = await import('./fullModel.js');
    const full = [
      `${TITULAR} - 01/04/2026 - 30/06/2026 - 2T,,,,,,,`,
      ',,,,,,,',
      'INGRESSOS,,,,,,,',
      'Data,Núm,Client,NIF - CIF,Descripció,Subtotal,IVA,Total',
      `15/04/26,F26 0001,Exemple Distribucions SL,${CIF_CLIENT},Taller,"500,00 €","105,00 €","605,00 €"`,
      ',,,,,,,',
      'GASTOS,,,,,,,',
      'Data,Núm,Proveïdor,NIF - CIF,Descripció,Subtotal,IVA,Total',
      ...[4, 5, 6].map((m) => `28/0${m}/26,EL-2026-0${m},Exemple Llum SL,${CIF_LLUM},Llum,"100,00 €","21,00 €","121,00 €"`)
    ].join('\r\n');
    const { font } = fontMemoria({ [MODEL_2T]: bytes(full), '2026_3T/exemple_llum_juliol.pdf': PDF_LLUM });
    const r = await executaTractorFactures(base(font));
    if (typeof modul.llegeixModelCsv === 'function') {
      expect(r.proposta.titular).toBe(TITULAR);
      expect(r.proveidors.find((p) => p.clau === 'exemple-llum')).toMatchObject({ cadencia: 'mensual' });
      expect(doc(r, MODEL_2T).estat).toBe('extreta');
    } else {
      expect(codis(r.avisos)).toContain('LECTOR_MODEL_ABSENT');
    }
  });
});

describe('límits i errors: sempre tipats', () => {
  test('una llista massa llarga: MASSA_FITXERS abans de llegir res', async () => {
    const { font, crides } = fontMemoria(carpetaSintetica());
    const error = await errorDe(executaTractorFactures(base(font, { limits: { fitxersLlistats: 3 } })));
    expect(error).toMatchObject({ name: 'ErrorTractor', codi: 'MASSA_FITXERS' });
    expect(crides).toEqual(['llista']);
  });

  test('un fitxer de més de 25 MB a la llista no es llig: FITXER_MASSA_GRAN i cobertura parcial', async () => {
    const ruta = '2026_3T/F26-0003.pdf';
    const { font, crides } = fontMemoria(carpetaSintetica(), { mides: { [ruta]: 30 * MB } });
    const r = await executaTractorFactures(base(font, { llegeixModel: lectorSintetic().llegeixModel }));
    expect(crides).not.toContain(`llig:${ruta}`);
    expect(codis(doc(r, ruta).avisos)).toContain('FITXER_MASSA_GRAN');
    expect(doc(r, ruta).avisos.find((a) => a.codi === 'FITXER_MASSA_GRAN').missatge).toMatch(/25 MB/);
    expect(doc(r, ruta).estat).toBe('manual');
    expect(r.cobertura.carpeta).toBe('parcial');
  });

  test('si la font torna més bytes del límit, tampoc es processa', async () => {
    const ruta = '2026_3T/Rebut_lloguer.pdf';
    const { font } = fontMemoria(carpetaSintetica(), { mides: { [ruta]: 10 }, retorna: { [ruta]: new Uint8Array(4096) } });
    const r = await executaTractorFactures(base(font, { limits: { midaFitxer: 2048 }, llegeixModel: lectorSintetic().llegeixModel }));
    expect(codis(doc(r, ruta).avisos)).toContain('FITXER_MASSA_GRAN');
    expect(doc(r, '2026_3T/exemple_llum_juliol.pdf').estat).toBe('extreta');
  });

  test('massa documents al trimestre: només els primers, amb avís', async () => {
    const r = await executaTractorFactures(base(fontMemoria(carpetaSintetica()).font, {
      limits: { documentsTrimestre: 2 }, llegeixModel: lectorSintetic().llegeixModel
    }));
    expect(codis(r.avisos)).toContain('MASSA_DOCUMENTS');
    expect(r.documents.filter((d) => d.ambit === 'trimestre')).toHaveLength(2);
    expect(r.cobertura.carpeta).toBe('parcial');
  });

  test('un fitxer que no es pot llegir no atura l\'anàlisi', async () => {
    const ruta = '2026_3T/7777777777.csv';
    const { font } = fontMemoria(carpetaSintetica(), { falla: { [ruta]: new Error('permís denegat') } });
    const r = await executaTractorFactures(base(font, { llegeixModel: lectorSintetic().llegeixModel }));
    expect(doc(r, ruta)).toMatchObject({ estat: 'ignorada' });
    expect(codis(doc(r, ruta).avisos)).toContain('FITXER_ILLEGIBLE');
    expect(r.proposta.despeses.map((f) => f.num)).toEqual(['EL-2026-07']);
  });

  test('la font desenxufada a mitja anàlisi l\'atura amb FONT_OBLIDADA', async () => {
    const { font } = fontMemoria(carpetaSintetica(), {
      falla: { '2026_3T/F26-0003.pdf': new ErrorTractor('FONT_OBLIDADA', 'desenxufada') }
    });
    const error = await errorDe(executaTractorFactures(base(font, { llegeixModel: lectorSintetic().llegeixModel })));
    expect(error).toMatchObject({ name: 'ErrorTractor', codi: 'FONT_OBLIDADA' });
  });

  test('les limitacions de la font arriben als avisos i fan la cobertura parcial', async () => {
    const { font } = fontMemoria(carpetaSintetica());
    font.limitacions = [{ codi: 'PROFUNDITAT_MAXIMA', missatge: 'Carpetes massa fondes.' }];
    const r = await executaTractorFactures(base(font, { llegeixModel: lectorSintetic().llegeixModel }));
    expect(codis(r.avisos)).toContain('PROFUNDITAT_MAXIMA');
    expect(r.cobertura.carpeta).toBe('parcial');
  });

  test.each([
    ['la llista llança', { async llista() { throw new TypeError('cru'); }, async llig() { return new Uint8Array(0); } }, 'FONT_ILLEGIBLE'],
    ['la llista no és una llista', { async llista() { return 'no'; }, async llig() { return new Uint8Array(0); } }, 'FONT_ILLEGIBLE'],
    ['no hi ha font', null, 'FONT_INVALIDA'],
    ['la font no té llig', { async llista() { return []; } }, 'FONT_INVALIDA']
  ])('%s: %s', async (_cas, font, codi) => {
    const error = await errorDe(executaTractorFactures(base(font)));
    expect(error).toBeInstanceOf(ErrorTractor);
    expect(error.codi).toBe(codi);
  });

  test('un trimestre impossible: PARAMETRES_INVALIDS', async () => {
    const error = await errorDe(executaTractorFactures(base(fontMemoria(carpetaSintetica()).font, { t: 5 })));
    expect(error).toMatchObject({ name: 'ErrorTractor', codi: 'PARAMETRES_INVALIDS' });
  });

  test('sense WebCrypto la porta no pot verificar la signatura: SIGNATURA_INVALIDA i cap accés a la font', async () => {
    const { font, accessos } = fontEspia();
    const error = await errorDe(executaTractorFactures(base(font, { subtle: {} })));
    expect(error).toBeInstanceOf(ErrorAprovacio);
    expect(error.codi).toBe('SIGNATURA_INVALIDA');
    expect(accessos).toEqual([]);
  });

  test('sense WebCrypto després de la porta: CRIPTO_ABSENT; si el resum falla, ERROR_INTERN amb la causa', async () => {
    const sense = await errorDe(executaTractorFactures(base(fontMemoria(carpetaSintetica()).font, {
      subtle: webcryptoDespresDeLaPorta(undefined)
    })));
    expect(sense).toMatchObject({ name: 'ErrorTractor', codi: 'CRIPTO_ABSENT' });
    const trencat = webcryptoDespresDeLaPorta(async () => { throw new Error('maquinari'); });
    const intern = await errorDe(executaTractorFactures(base(fontMemoria(carpetaSintetica()).font, {
      subtle: trencat, llegeixModel: lectorSintetic().llegeixModel
    })));
    expect(intern).toMatchObject({ name: 'ErrorTractor', codi: 'ERROR_INTERN' });
    expect(intern.cause.message).toBe('maquinari');
  });

  test('un lector de fulls que falla deixa el full com a il·legible i continua', async () => {
    const llegeixModel = () => { throw new Error('format desconegut'); };
    const r = await executaTractorFactures(base(fontMemoria(carpetaSintetica()).font, { llegeixModel }));
    expect(doc(r, MODEL_2T)).toMatchObject({ estat: 'ignorada' });
    expect(codis(doc(r, MODEL_2T).avisos)).toContain('MODEL_ILLEGIBLE');
    expect(codis(r.avisos)).toContain('TITULAR_DESCONEGUT');
    expect(r.cobertura.historial).toEqual([]);
  });
});

describe('progrés', () => {
  test('fases en ordre, fet ≤ total i un onProgres que falla no atura res', async () => {
    const vist = [];
    const onProgres = (p) => {
      vist.push(p);
      throw new Error('la UI ha fallat');
    };
    const r = await executaTractorFactures(base(fontMemoria(carpetaSintetica()).font, { onProgres, llegeixModel: lectorSintetic().llegeixModel }));
    expect(r.proposta.despeses).toHaveLength(2);
    expect(vist[0]).toEqual({ fase: 'llistant', fet: 0, total: 1 });
    expect(vist[vist.length - 1]).toEqual({ fase: 'auditant', fet: 1, total: 1 });
    expect([...new Set(vist.map((p) => p.fase))]).toEqual(['llistant', 'historial', 'llegint', 'extraient', 'auditant']);
    for (const p of vist) expect(p.fet).toBeLessThanOrEqual(p.total);
  });
});

describe('executaCreuamentCorreus', () => {
  const adjunt = Buffer.from('COS-SECRET-3').toString('base64');
  const MBOX = [
    'From factures@example.org Mon Aug 31 09:00:00 2026',
    'From: Exemple Llum <factures@example.org>',
    'To: titular@example.org',
    "Subject: La teua factura d'agost",
    'Date: Mon, 31 Aug 2026 09:00:00 +0200',
    'Message-ID: <a1@example.org>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="LIMIT"',
    '',
    '--LIMIT',
    'Content-Type: text/plain; charset=utf-8',
    '',
    'COS-SECRET-1: el cos no ha d\'eixir mai',
    '--LIMIT',
    'Content-Type: application/pdf; name="factura_agost.pdf"',
    'Content-Disposition: attachment; filename="factura_agost.pdf"',
    'Content-Transfer-Encoding: base64',
    '',
    adjunt,
    '--LIMIT--',
    '',
    'From amic@example.org Sat Sep 12 10:00:00 2026',
    'From: Amic <amic@example.org>',
    'Subject: Sopar de divendres',
    'Date: Sat, 12 Sep 2026 10:00:00 +0200',
    '',
    'COS-SECRET-2',
    ''
  ].join('\n');

  let factures;
  beforeAll(async () => {
    factures = await executaTractorFactures(base(fontMemoria(carpetaSintetica()).font, { llegeixModel: lectorSintetic().llegeixModel }));
  });
  const creua = (extra = {}) => executaCreuamentCorreus({
    fitxers: [{ nom: 'correu.mbox', text: MBOX }],
    any: 2026,
    t: 3,
    factures: factures.proposta.despeses,
    proveidors: factures.proveidors,
    aprovacio: aprovacioDe(TRACTOR_CORREUS),
    ...extra
  });

  test.each([
    ['sense aprovació', undefined, 'APROVACIO_REQUERIDA'],
    ['amb l\'aprovació del tractor de factures', aprovacioDe(TRACTOR_FACTURES), 'APROVACIO_REQUERIDA'],
    ['amb l\'empremta divergent', aprovacioDe(TRACTOR_CORREUS, { empremta: ALTRA_EMPREMTA }), 'EMPREMTA_DIVERGENT']
  ])('%s: ErrorAprovacio i cap correu llegit', async (_cas, aprovacio, codi) => {
    const accessos = [];
    const fitxers = new Proxy([{ nom: 'correu.mbox', text: MBOX }], {
      get(objecte, propietat) {
        accessos.push(String(propietat));
        return Reflect.get(objecte, propietat);
      }
    });
    const error = await errorDe(executaCreuamentCorreus({ fitxers, any: 2026, t: 3, aprovacio }));
    expect(error).toBeInstanceOf(ErrorAprovacio);
    expect(error.codi).toBe(codi);
    expect(accessos).toEqual([]);
  });

  test('el correu de factura sense document i la cobertura parcial; només incidències de correu', async () => {
    const r = await creua();
    expect(r.incidencies).toContainEqual(expect.objectContaining({ codi: 'CORREU_SENSE_DOCUMENT', proveidor: 'exemple-llum', mes: '2026-08' }));
    expect(codis(r.incidencies)).toContain('CORREU_PARCIAL');
    expect(r.incidencies.every((i) => i.codi.startsWith('CORREU_'))).toBe(true);
    expect(r.cobertura).toMatchObject({ correu: 'revisat', correusRevisats: 2, periodeCorreu: { inici: { a: 2026, m: 8, d: 31 }, fi: { a: 2026, m: 9, d: 12 } } });
  });

  test('torna només les capçaleres dels correus de factura: mai el cos ni els adjunts', async () => {
    const r = await creua();
    expect(r.correus).toHaveLength(1);
    expect(r.correus[0]).toMatchObject({
      de: 'factures@example.org', nomRemitent: 'Exemple Llum', domini: 'example.org', assumpte: "La teua factura d'agost",
      data: { a: 2026, m: 8, d: 31 }, adjunts: ['factura_agost.pdf'], esFactura: true, fitxer: 'correu.mbox'
    });
    const json = JSON.stringify(r);
    expect(json).not.toContain('COS-SECRET');
    expect(json).not.toContain(adjunt);
  });

  test('fitxers il·legibles o massa grans: avís i cobertura parcial; la resta es llig', async () => {
    const r = await creua({
      fitxers: [{ nom: 'gran.mbox', text: 'x'.repeat(MBOX.length + 1) }, { nom: 'trencat.eml', text: 42 }, { nom: 'correu.mbox', text: MBOX }],
      limits: { midaCorreu: MBOX.length }
    });
    expect(r.avisos.map((a) => [a.codi, a.fitxer])).toEqual([['FITXER_MASSA_GRAN', 'gran.mbox'], ['FITXER_ILLEGIBLE', 'trencat.eml']]);
    expect(r.cobertura).toMatchObject({ correu: 'parcial', correusRevisats: 2 });
    expect(codis(r.incidencies)).toContain('CORREU_SENSE_DOCUMENT');
  });

  test('massa missatges: només els primers, amb avís', async () => {
    const r = await creua({ limits: { missatgesCorreu: 1 } });
    expect(codis(r.avisos)).toEqual(['MASSA_CORREUS']);
    expect(r.cobertura).toMatchObject({ correu: 'parcial', correusRevisats: 1 });
  });

  test('sense cap exportació, o amb un trimestre impossible: PARAMETRES_INVALIDS', async () => {
    for (const extra of [{ fitxers: [] }, { fitxers: null }, { t: 0 }]) {
      const error = await errorDe(creua(extra));
      expect(error).toMatchObject({ name: 'ErrorTractor', codi: 'PARAMETRES_INVALIDS' });
    }
  });
});

describe('qualitat del carril', () => {
  const ARREL = process.cwd();
  const CODI = ['src/sections/gestoria/nucli/tractor.js', 'src/sections/gestoria/font/fontNavegador.js'];
  const PROVES = ['src/sections/gestoria/nucli/tractor.test.js', 'src/sections/gestoria/font/fontNavegador.test.js'];
  const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

  test('ESLint del projecte: zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles([...CODI, ...PROVES].map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(CODI.length + PROVES.length);
    expect(missatges).toEqual([]);
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/gestoria/nucli/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 60000);

  test('cap API de xarxa, emmagatzematge, global escrita, backend ni impuresa al codi', () => {
    /* Alguns patrons es componen a trossos perquè les portes que llegixen src/ no els troben ací. */
    const vetats = [
      [new RegExp(['\\bfet', 'ch\\s*\\(|XMLHttp', 'Request|WebSo', 'cket|EventSo', 'urce|sendBea', 'con'].join('')), 'xarxa'],
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join('')), 'emmagatzematge'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita'],
      [new RegExp(['supa', 'base|backend', 'Port|adapta', 'dors'].join(''), 'i'), 'backend'],
      [/from 'react'|import\.meta\.glob|\?raw'|from 'node:/, 'nucli impur'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    for (const fitxer of CODI) {
      const codi = llig(fitxer);
      for (const [patro, que] of vetats) expect(patro.test(codi), `${fitxer}: ${que}`).toBe(false);
    }
  });

  test('cap color hex, terme vetat ni espai invisible, proves incloses', () => {
    const vetats = [
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [new RegExp(['Local-', 'First|Offline-', 'First|iOS ', '15|iPad ', 'A10'].join('')), 'terme vetat'],
      [/[^\S\n\r\t ]/, 'espai invisible']
    ];
    for (const fitxer of [...CODI, ...PROVES]) {
      const codi = llig(fitxer);
      for (const [patro, que] of vetats) expect(patro.test(codi), `${fitxer}: ${que}`).toBe(false);
    }
  });
});
