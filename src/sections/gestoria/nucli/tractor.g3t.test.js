// @vitest-environment node
/* Gestoria · nucli · tractor: les correccions del 3T (G3T-01, 02, 03, 04, 10 i
   14, i les de la revisió: G3T-R01 i R04) sobre carpetes sintètiques en
   memòria. Els PDF es munten ací mateix
   (Helvetica i FlateDecode amb node:zlib), amb empreses fictícies, CIF
   calculats i imports inventats. auditaTrimestre és la de veres, embolcallada
   en un espia per a veure els documents que li passa el tractor (el contracte
   amb el lot de l'auditoria). Cap dada de persona. */
import { deflateSync, inflateSync } from 'node:zlib';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { TRACTOR_FACTURES } from '../tractors.js';
import { auditaTrimestre } from './auditoria.js';
import { crearFactura } from './model.js';
import { executaTractorFactures } from './tractor.js';

vi.mock('./auditoria.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, auditaTrimestre: vi.fn(real.auditaTrimestre) };
});

/* ── Dades sintètiques ──────────────────────────────────────────────────── */

function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return (10 - ((parells + senars) % 10)) % 10;
}
const cif = (lletra, xifres) => `${lletra}${xifres}${controlCif(xifres)}`;

const CIF_TITULAR = cif('G', '7654321');
const CIF_SERVEIS = cif('B', '7100003');
const latin1 = (s) => Buffer.from(s, 'latin1');
const inflateNode = async (b) => new Uint8Array(inflateSync(b));

/**
 * Un PDF d'una pàgina amb una línia de text per element (comprimit). Opcions:
 * trailer (claus de més al tràiler: «/ID [...]», «/Encrypt 6 0 R»...), extra
 * (objectes de més, ja escrits) i cua (bytes darrere de %%EOF, com una còpia
 * que n'ha guanyat un).
 */
function pdf(linies, { trailer = '', extra = [], cua = '' } = {}) {
  const contingut = linies.map((l, i) => `BT /F1 10 Tf 72 ${780 - i * 16} Td (${l.replace(/[\\()]/g, '\\$&')}) Tj ET`).join('\n');
  const dades = deflateSync(latin1(contingut));
  const objectes = [
    latin1('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    latin1('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
    latin1('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n'),
    Buffer.concat([latin1(`4 0 obj\n<< /Filter /FlateDecode /Length ${dades.length} >>\nstream\n`), dades, latin1('\nendstream\nendobj\n')]),
    latin1('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n'),
    ...extra.map((o) => latin1(o))
  ];
  const capcalera = latin1('%PDF-1.7\n');
  const posicions = [];
  let pos = capcalera.length;
  for (const o of objectes) {
    posicions.push(pos);
    pos += o.length;
  }
  const n = objectes.length + 1;
  const xref = `xref\n0 ${n}\n0000000000 65535 f \n${posicions.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`;
  return new Uint8Array(Buffer.concat([
    capcalera, ...objectes, latin1(`${xref}trailer\n<< /Size ${n} /Root 1 0 R ${trailer} >>\nstartxref\n${pos}\n%%EOF\n${cua}`)
  ]));
}

/* Un PDF xifrat (Standard Security Handler): el text no es pot llegir, el /ID sí. */
const XIFRATGE = '6 0 obj\n<< /Filter /Standard /V 2 /R 3 /Length 128 /P -1084 /O <00112233> /U <44556677> >>\nendobj\n';
const xifrat = (id, { cua = '' } = {}) => pdf(['bytes que no es lligen'], {
  trailer: `/Encrypt 6 0 R /ID [<${id}> <${id}>]`, extra: [XIFRATGE], cua
});
/* Un PDF amb una pàgina sense text (com un escanejat). */
const senseText = ({ trailer = '', cua = '' } = {}) => pdf([], { trailer, cua });

/* G3T-R03: imports i dates inventats, que no coincidixen amb cap document real. El domicili amb número imita
   la trampa d'on podria eixir un número de factura fals. */
const FACTURA_SERVEIS = [
  'Exemple Serveis SL', `CIF: ${CIF_SERVEIS}`, 'Numero de factura: ES-2026-0007', 'Fecha de la factura: 21/07/2026',
  `NIF: ${CIF_TITULAR}`, 'Concepto: Manteniment de la web', 'Base imponible 600,00 EUR', 'IVA 21% 126,00 EUR', 'Total factura 726,00 EUR'
];
const JUSTIFICANT = [
  'Banc Exemple', 'Justificante de transferencia', 'Ordenante: Associacio Titular Exemple', 'Beneficiario: Exemple Serveis SL',
  'Concepto: Factura num. ES-2026-0007', 'Fecha: 22/07/2026', 'IMPORTE: 726,00 eur.', 'Domicilio Social Carrer Major, num. 7'
];

function fontMemoria(fitxers, { falla = {} } = {}) {
  const crides = [];
  return {
    crides,
    font: {
      nom: 'Facturacio',
      async llista() {
        crides.push('llista');
        return Object.keys(fitxers).map((ruta) => ({ ruta, mida: fitxers[ruta].length, modificat: 0 }));
      },
      async llig(ruta) {
        crides.push(`llig:${ruta}`);
        if (falla[ruta]) throw falla[ruta];
        return fitxers[ruta];
      }
    }
  };
}

/* L'aprovació signada del tractor (el model de tractor.test.js). */
const ARA = Date.UTC(2026, 9, 2, 10, 0, 0);
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const autenticador = await creaAutenticadorSimulat();
const SIGNAT = await autenticador.signa({ manifest: TRACTOR_FACTURES, empremta: EMPREMTA, ara: ARA - 60000 });
const APROVACIO = Object.freeze({
  manifest: TRACTOR_FACTURES, empremta: EMPREMTA, registres: [SIGNAT], claus: autenticador.claus,
  origen: autenticador.origen, rpId: autenticador.rpId, ara: ARA
});

const analitza = (fitxers, extra = {}) => executaTractorFactures({
  font: fontMemoria(fitxers, extra).font, any: 2026, t: 3, aprovacio: APROVACIO, inflate: inflateNode,
  avui: { a: 2026, m: 10, d: 2 }, nifsTitular: [CIF_TITULAR], ...extra
});
const codis = (llista) => llista.map((x) => x.codi);
const doc = (r, ruta) => r.documents.find((d) => d.ruta === ruta);
const files = (r) => [...r.proposta.ingressos, ...r.proposta.despeses];
const fitxersDe = (r) => files(r).map((f) => f.origen.fitxer).sort();
/* Els documents que el tractor ha passat a auditaTrimestre en l'última anàlisi. */
const documentsAuditats = () => auditaTrimestre.mock.calls[auditaTrimestre.mock.calls.length - 1][0].documents;

beforeEach(() => {
  auditaTrimestre.mockClear();
});

/* ── G3T-01 ─────────────────────────────────────────────────────────────── */

describe('G3T-01: un justificant de transferència és un rebut, no una factura', () => {
  test('pel nom («Justi_…»): rebut amb l’import per a l’auditoria, i cap fila al full', async () => {
    const r = await analitza({ '2026_3T/Justi_0001.pdf': pdf(JUSTIFICANT) });
    expect(doc(r, '2026_3T/Justi_0001.pdf')).toMatchObject({ tipus: 'rebut', sentit: 'rebuda', estat: 'ignorada' });
    expect(files(r)).toEqual([]);
    expect(documentsAuditats()).toContainEqual(expect.objectContaining({ ruta: '2026_3T/Justi_0001.pdf', tipus: 'rebut', import: 72600 }));
    expect(r.incidencies).toContainEqual(expect.objectContaining({ codi: 'REBUT_SENSE_FACTURA', fitxer: '2026_3T/Justi_0001.pdf' }));
    expect(codis(r.incidencies)).not.toContain('SENTIT_DESCONEGUT');
  });

  test('pel contingut: un nom neutre amb «Justificante de transferencia» passa a rebut amb REBUT_PEL_CONTINGUT', async () => {
    const r = await analitza({ '2026_3T/operacio_0716.pdf': pdf(JUSTIFICANT) });
    const d = doc(r, '2026_3T/operacio_0716.pdf');
    expect(d).toMatchObject({ tipus: 'rebut', sentit: 'rebuda', estat: 'ignorada' });
    expect(d.motiu).toMatch(/no és una factura/);
    expect(d.avisos).toContainEqual(expect.objectContaining({ codi: 'REBUT_PEL_CONTINGUT', severitat: 'mitjana' }));
    expect(d.facturaId).toBeUndefined();
    expect(files(r)).toEqual([]);
    expect(codis(d.avisos)).not.toContain('SENTIT_DESCONEGUT');
    expect(codis(r.incidencies)).not.toContain('SENTIT_DESCONEGUT');
    expect(documentsAuditats()).toContainEqual(expect.objectContaining({ ruta: '2026_3T/operacio_0716.pdf', tipus: 'rebut', import: 72600 }));
  });

  test('amb la factura que paga al trimestre, l’auditoria el casa i no hi ha REBUT_SENSE_FACTURA', async () => {
    const r = await analitza({ '2026_3T/operacio_0716.pdf': pdf(JUSTIFICANT), '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS) });
    expect(fitxersDe(r)).toEqual(['2026_3T/serveis_juliol.pdf']);
    expect(r.incidencies.filter((i) => i.codi === 'REBUT_SENSE_FACTURA')).toEqual([]);
  });

  test.each([
    [['Banc Exemple', 'Orden de transferencia', 'Importe: 45,00 EUR']],
    [['Banc Exemple', 'Comprobante de pago con tarjeta', 'Importe: 45,00 EUR']],
    [['Caixa Exemple', 'Comprovant de la transferència', 'Import: 45,00 EUR']],
    [['Banc Exemple', 'Justificant de pagament', 'Import 45,00 EUR']],
    [['Comprobante', 'Banc Exemple', 'Importe: 45,00 EUR']]
  ])('també pel contingut: %j', async (linies) => {
    const r = await analitza({ '2026_3T/document_0001.pdf': pdf(linies) });
    expect(doc(r, '2026_3T/document_0001.pdf')).toMatchObject({ tipus: 'rebut', estat: 'ignorada' });
    expect(files(r)).toEqual([]);
  });

  test('una factura amb base i IVA que diu «no es un justificante de pago» continua sent una factura', async () => {
    const r = await analitza({ '2026_3T/serveis_juliol.pdf': pdf([...FACTURA_SERVEIS, 'Este documento no sirve como justificante de pago']) });
    expect(doc(r, '2026_3T/serveis_juliol.pdf')).toMatchObject({ tipus: 'factura', estat: 'extreta' });
    expect(fitxersDe(r)).toEqual(['2026_3T/serveis_juliol.pdf']);
    expect(codis(doc(r, '2026_3T/serveis_juliol.pdf').avisos)).not.toContain('REBUT_PEL_CONTINGUT');
  });

  test('ni una negació just davant, ni la forma de pagament, ni «Comprobante fiscal» dins d’una línia el fan rebut', async () => {
    const r = await analitza({
      '2026_3T/serveis_agost.pdf': pdf(['Exemple Serveis SL', 'Factura num. ES-2026-0008', 'Total 50,00 EUR', 'Este documento no es un justificante de pago']),
      '2026_3T/serveis_setembre.pdf': pdf(['Exemple Serveis SL', 'Comprobante fiscal de la factura', 'Factura num. ES-2026-0009', 'Total 60,00 EUR']),
      '2026_3T/serveis_octubre.pdf': pdf(['Exemple Serveis SL', 'Factura num. ES-2026-0010', 'Total 70,00 EUR', 'Forma de pago: orden de transferencia'])
    });
    expect(fitxersDe(r)).toEqual(['2026_3T/serveis_agost.pdf', '2026_3T/serveis_octubre.pdf', '2026_3T/serveis_setembre.pdf']);
  });
});

/* ── G3T-02 ─────────────────────────────────────────────────────────────── */

describe('G3T-02: una còpia pel nom no entra dues vegades al full', () => {
  test('el mateix text i un byte de més: la còpia s’ignora amb DUPLICAT i es pot tornar a la proposta', async () => {
    const r = await analitza({
      '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS),
      '2026_3T/serveis_juliol copia.pdf': pdf(FACTURA_SERVEIS, { cua: '\n' })
    });
    expect(fitxersDe(r)).toEqual(['2026_3T/serveis_juliol.pdf']);
    const copia = doc(r, '2026_3T/serveis_juliol copia.pdf');
    expect(copia).toMatchObject({ estat: 'ignorada', copiaDe: '2026_3T/serveis_juliol.pdf' });
    expect(copia.avisos).toContainEqual(expect.objectContaining({ codi: 'DUPLICAT', severitat: 'info' }));
    expect(codis(copia.avisos)).not.toContain('POSSIBLE_COPIA');
    /* Restaurable: la seua factura és a les excloses, no a la proposta. */
    expect(r.excloses).toHaveLength(1);
    expect(r.excloses[0]).toMatchObject({ num: 'ES-2026-0007', total: 72600, origen: { fitxer: '2026_3T/serveis_juliol copia.pdf', metode: 'pdf' } });
    expect(copia.facturaId).toBe(r.excloses[0].id);
    expect(r.excloses[0].id).not.toBe(files(r)[0].id);
  });

  test('amb el mateix contingut (sha256) es manté com abans: ignorada, DUPLICAT i cap exclosa', async () => {
    const r = await analitza({ '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS), '2026_3T/serveis_juliol (1).pdf': pdf(FACTURA_SERVEIS) });
    expect(fitxersDe(r)).toEqual(['2026_3T/serveis_juliol.pdf']);
    expect(doc(r, '2026_3T/serveis_juliol (1).pdf')).toMatchObject({ estat: 'ignorada', copiaDe: '2026_3T/serveis_juliol.pdf' });
    expect(r.excloses).toEqual([]);
  });

  test('un text diferent amb nom de còpia no es fusiona: les dues al full i POSSIBLE_COPIA', async () => {
    const altra = FACTURA_SERVEIS.map((l) => l.replace('ES-2026-0007', 'ES-2026-0017'));
    const r = await analitza({ '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS), '2026_3T/serveis_juliol copia.pdf': pdf(altra) });
    expect(fitxersDe(r)).toEqual(['2026_3T/serveis_juliol copia.pdf', '2026_3T/serveis_juliol.pdf']);
    expect(codis(doc(r, '2026_3T/serveis_juliol copia.pdf').avisos)).toContain('POSSIBLE_COPIA');
    expect(doc(r, '2026_3T/serveis_juliol copia.pdf').copiaDe).toBeUndefined();
    expect(r.excloses).toEqual([]);
  });

  test('dos xifrats amb el mateix /ID: la còpia s’ignora i només l’original queda per fer a mà', async () => {
    const r = await analitza({ '2026_3T/factura.pdf': xifrat('a1b2c3d4'), '2026_3T/factura copia.pdf': xifrat('a1b2c3d4', { cua: '\n' }) });
    expect(files(r)).toEqual([]);
    expect(doc(r, '2026_3T/factura copia.pdf')).toMatchObject({ estat: 'ignorada', copiaDe: '2026_3T/factura.pdf' });
    expect(codis(doc(r, '2026_3T/factura copia.pdf').avisos)).toContain('DUPLICAT');
    expect(doc(r, '2026_3T/factura.pdf')).toMatchObject({ estat: 'manual' });
    expect(r.incidencies.filter((i) => i.codi === 'PDF_XIFRAT').map((i) => i.fitxer)).toEqual(['2026_3T/factura.pdf']);
    expect(r.excloses).toEqual([]);
  });

  test('dos xifrats amb /ID diferents i noms semblants no es fusionen', async () => {
    const r = await analitza({ '2026_3T/factura.pdf': xifrat('a1b2c3d4'), '2026_3T/factura copia.pdf': xifrat('e5f60718', { cua: '\n' }) });
    expect(files(r)).toEqual([]);
    expect(doc(r, '2026_3T/factura copia.pdf')).toMatchObject({ estat: 'manual' });
    expect(doc(r, '2026_3T/factura copia.pdf').copiaDe).toBeUndefined();
    expect(codis(doc(r, '2026_3T/factura copia.pdf').avisos)).toEqual(expect.arrayContaining(['POSSIBLE_COPIA', 'PDF_XIFRAT']));
    expect(r.incidencies.filter((i) => i.codi === 'PDF_XIFRAT').map((i) => i.fitxer).sort()).toEqual(['2026_3T/factura copia.pdf', '2026_3T/factura.pdf']);
  });

  test('sense text: el mateix /ID els fusiona; sense /ID, no', async () => {
    const amb = await analitza({
      '2026_3T/escaneig.pdf': senseText({ trailer: '/ID [<0f0e> <0d0c>]' }),
      '2026_3T/escaneig copia.pdf': senseText({ trailer: '/ID [<0f0e> <0d0c>]', cua: '\n' })
    });
    expect(doc(amb, '2026_3T/escaneig copia.pdf')).toMatchObject({ estat: 'ignorada', copiaDe: '2026_3T/escaneig.pdf' });
    const sense = await analitza({ '2026_3T/escaneig.pdf': senseText(), '2026_3T/escaneig copia.pdf': senseText({ cua: '\n' }) });
    expect(doc(sense, '2026_3T/escaneig copia.pdf').copiaDe).toBeUndefined();
    expect(codis(doc(sense, '2026_3T/escaneig copia.pdf').avisos)).toContain('POSSIBLE_COPIA');
  });

  test('un llegible i un xifrat amb nom de còpia no es fusionen', async () => {
    const r = await analitza({ '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS), '2026_3T/serveis_juliol copia.pdf': xifrat('a1b2c3d4') });
    expect(doc(r, '2026_3T/serveis_juliol copia.pdf').copiaDe).toBeUndefined();
  });

  /* La còpia d'un rebut no es llig: si l'auditoria la rebera com un rebut més, sense import ni cita, en
     donaria un REBUT_SENSE_FACTURA fals. El grup de duplicats ja li arriba per `duplicats`. */
  test('les còpies d’un rebut (pel nom i pel contingut) no s’auditen com a rebuts de més', async () => {
    const rebut = ['Receipt number 2000-0003', 'Invoice number ES-2026-0007', 'Amount paid 726,00 EUR'];
    const r = await analitza({
      '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS),
      '2026_3T/Rebut_serveis.pdf': pdf(rebut),
      '2026_3T/Rebut_serveis copia.pdf': pdf(rebut, { cua: '\n' }),
      '2026_3T/Rebut_serveis (1).pdf': pdf(rebut)
    });
    for (const ruta of ['2026_3T/Rebut_serveis copia.pdf', '2026_3T/Rebut_serveis (1).pdf']) {
      expect(doc(r, ruta)).toMatchObject({ tipus: 'rebut', estat: 'ignorada', copiaDe: '2026_3T/Rebut_serveis.pdf' });
    }
    expect(documentsAuditats().map((d) => d.ruta)).toEqual(['2026_3T/Rebut_serveis.pdf', '2026_3T/serveis_juliol.pdf']);
    expect(r.incidencies.filter((i) => i.codi === 'REBUT_SENSE_FACTURA')).toEqual([]);
    /* El duplicat sí que s'avisa: el grup arriba a l'auditoria encara que la còpia no s'audite com a rebut. */
    expect(r.incidencies.filter((i) => i.codi === 'DUPLICAT').map((i) => i.fitxer).sort())
      .toEqual(['2026_3T/Rebut_serveis (1).pdf', '2026_3T/Rebut_serveis copia.pdf']);
  });
});

/* ── L'historial dels fulls anteriors ───────────────────────────────────── */

describe('l’historial: el tractor el torna i el passa a l’auditoria', () => {
  const CIF_CLIENT = cif('B', '7100008');
  const MODEL_2T = '2026_2T/2026-FACTURACIO-Titular_Exemple_-_2T.csv';
  const historica = (dades) => crearFactura({ origen: { fitxer: MODEL_2T, metode: 'model' }, ...dades });
  const MODEL = Object.freeze({
    any: 2026,
    t: 2,
    titular: 'Associacio Titular Exemple',
    ingressos: [historica({
      tipus: 'ingres', data: '15/05/2026', num: 'F26 0001', contrapart: 'Exemple Distribucions SL', nif: CIF_CLIENT,
      descripcio: 'Taller', subtotal: 50000, iva: 10500, total: 60500
    })],
    despeses: [historica({
      tipus: 'despesa', data: '20/06/2026', num: 'ES-2026-0006', contrapart: 'Exemple Serveis SL', nif: CIF_SERVEIS,
      descripcio: 'Manteniment de la web', subtotal: 10000, iva: 2100, total: 12100
    })],
    avisos: []
  });
  const EMESA = [
    'Associacio Titular Exemple', `NIF: ${CIF_TITULAR}`, 'Factura num. F26-0003', 'Data: 10/08/2026', 'Client: Exemple Distribucions SL',
    `CIF client: ${CIF_CLIENT}`, 'Concepte: Taller de pedra seca', 'Base imposable 200,00', 'IVA 21% 42,00', 'Total 242,00'
  ];
  const llegeixModel = () => MODEL;

  test('r.historial porta les factures dels fulls anteriors una sola vegada, i és el que rep l’auditoria', async () => {
    const r = await analitza({
      [MODEL_2T]: latin1('full sintètic del 2T'),
      '2026_2T/2026-FACTURACIO-Titular_Exemple_-_2T revisat.csv': latin1('el mateix full, desat dues vegades'),
      '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS)
    }, { llegeixModel });
    expect(r.historial.map((f) => f.num)).toEqual(['F26 0001', 'ES-2026-0006']);
    const crida = auditaTrimestre.mock.calls[auditaTrimestre.mock.calls.length - 1][0];
    expect(crida.historial).toBe(r.historial);
  });

  test('sense cap full anterior, l’historial és buit', async () => {
    const r = await analitza({ '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS) });
    expect(r.historial).toEqual([]);
  });

  test('la sèrie emesa es comprova entre trimestres: F26 0001 al 2T i F26-0003 al 3T fan un FORAT_NUMERACIO', async () => {
    const r = await analitza({ [MODEL_2T]: latin1('full sintètic del 2T'), '2026_3T/F26-0003.pdf': pdf(EMESA) }, { llegeixModel });
    expect(r.proposta.ingressos.map((f) => f.num)).toEqual(['F26-0003']);
    const forats = r.incidencies.filter((i) => i.codi === 'FORAT_NUMERACIO');
    expect(forats).toHaveLength(1);
    expect(forats[0].missatge).toMatch(/0002/);
  });
});

/* ── G3T-10 ─────────────────────────────────────────────────────────────── */

describe('G3T-10: un document sense cap camp llegit no és una fila buida del full', () => {
  test('un PDF xifrat: per fer a mà, amb PDF_XIFRAT al document i a les incidències, i sense SENTIT_DESCONEGUT', async () => {
    const r = await analitza({ '2026_3T/factura.pdf': xifrat('a1b2c3d4'), '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS) });
    expect(fitxersDe(r)).toEqual(['2026_3T/serveis_juliol.pdf']);
    const d = doc(r, '2026_3T/factura.pdf');
    expect(d).toMatchObject({ tipus: 'factura', estat: 'manual' });
    expect(d.facturaId).toBeUndefined();
    expect(d.avisos).toContainEqual(expect.objectContaining({ codi: 'PDF_XIFRAT', severitat: 'mitjana' }));
    expect(codis(d.avisos)).not.toContain('SENTIT_DESCONEGUT');
    expect(r.incidencies).toContainEqual(expect.objectContaining({ codi: 'PDF_XIFRAT', severitat: 'mitjana', fitxer: '2026_3T/factura.pdf' }));
    /* Només la factura llegible (sense historial ni catàleg) compta com a «sense sentit». */
    expect(r.incidencies.filter((i) => i.codi === 'SENTIT_DESCONEGUT').map((i) => i.missatge)).toEqual([expect.stringMatching(/^Una factura/)]);
  });

  test('un PDF sense text (escanejat): PDF_SENSE_DADES i cap fila', async () => {
    const r = await analitza({ '2026_3T/tiquet_escanejat.pdf': senseText() });
    expect(files(r)).toEqual([]);
    expect(doc(r, '2026_3T/tiquet_escanejat.pdf')).toMatchObject({ estat: 'manual' });
    expect(codis(doc(r, '2026_3T/tiquet_escanejat.pdf').avisos)).toContain('PDF_SENSE_DADES');
    expect(r.incidencies).toContainEqual(expect.objectContaining({ codi: 'PDF_SENSE_DADES', severitat: 'mitjana', fitxer: '2026_3T/tiquet_escanejat.pdf' }));
  });

  test('un PDF que no s’ha pogut llegir: el motiu de la lectura, una incidència i cap fila', async () => {
    const r = await analitza({ '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS) }, { falla: { '2026_3T/serveis_juliol.pdf': new Error('permís denegat') } });
    expect(files(r)).toEqual([]);
    const d = doc(r, '2026_3T/serveis_juliol.pdf');
    expect(d.estat).toBe('manual');
    expect(codis(d.avisos)).toContain('FITXER_ILLEGIBLE');
    expect(codis(d.avisos)).not.toContain('PDF_SENSE_DADES');
    expect(r.incidencies).toContainEqual(expect.objectContaining({ codi: 'PDF_SENSE_DADES', fitxer: '2026_3T/serveis_juliol.pdf' }));
  });

  test('sense descompressor, el xifrat tampoc no fa fila, però la resta queda pendent com abans', async () => {
    const r = await analitza({ '2026_3T/factura.pdf': xifrat('a1b2c3d4'), '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS) }, { inflate: null });
    expect(fitxersDe(r)).toEqual(['2026_3T/serveis_juliol.pdf']);
    expect(files(r)[0].estat).toBe('pendent');
    expect(codis(doc(r, '2026_3T/factura.pdf').avisos)).toContain('PDF_XIFRAT');
  });
});

/* ── G3T-14 ─────────────────────────────────────────────────────────────── */

describe('G3T-14: el sentit pel proveïdor del catàleg que diu el text', () => {
  /* Com una factura de veres: el nom del proveïdor i el domini, i el titular darrere de «Bill to». */
  const FACTURA_CATALEG = [
    'Invoice', 'Invoice number ABCD1234-0001', 'Invoice date 03/07/2026', 'Cloudflare, Inc.', 'Questions: billing@cloudflare.com',
    'Bill to', 'Associacio Titular Exemple', `VAT: ES${CIF_TITULAR}`, 'Subtotal 25,00 EUR', 'VAT 21% 5,25 EUR', 'Total 30,25 EUR'
  ];

  test('«Invoice-…» amb el domini d’un proveïdor del catàleg és una factura rebuda, sense SENTIT_DESCONEGUT', async () => {
    const r = await analitza({ '2026_3T/Invoice-ABCD1234-0001.pdf': pdf(FACTURA_CATALEG) });
    const d = doc(r, '2026_3T/Invoice-ABCD1234-0001.pdf');
    expect(d).toMatchObject({ tipus: 'factura', sentit: 'rebuda' });
    expect(d.motiu).toMatch(/catàleg/);
    expect(codis(d.avisos)).not.toContain('SENTIT_DESCONEGUT');
    expect(codis(r.incidencies)).not.toContain('SENTIT_DESCONEGUT');
    expect(r.proposta.despeses).toHaveLength(1);
  });

  test('sense cap pista del catàleg, continua sense sentit i ho avisa', async () => {
    const r = await analitza({ '2026_3T/Invoice-ABCD1234-0001.pdf': pdf(FACTURA_CATALEG.map((l) => l.replace('cloudflare.com', 'exemple.invalid'))) });
    expect(doc(r, '2026_3T/Invoice-ABCD1234-0001.pdf').sentit).toBeNull();
    expect(codis(r.incidencies)).toContain('SENTIT_DESCONEGUT');
  });

  /* G3T-R01: una factura emesa sense la sèrie de l'historial que en el concepte cita un proveïdor del catàleg. */
  const EMESA_SENSE_SERIE = (concepte, capcalera = ['Associacio Titular Exemple', `NIF: ${CIF_TITULAR}`]) => pdf([
    ...capcalera, 'Factura 17/2026', 'Data: 22/07/2026', 'Client: Exemple SL',
    `Concepte: ${concepte}`, 'Base imposable 300,00', 'IVA 21% 63,00', 'Total 363,00'
  ]);

  test.each([
    ['el titular a la capçalera i unes paraules del catàleg al concepte', 'Migració a Google Cloud', undefined],
    ['amb el domini i les paraules, el titular a la capçalera diu que és emesa', 'Migració a Google Cloud (consola a cloud.google.com)', undefined],
    ['sense el titular, unes paraules del concepte no identifiquen el proveïdor', 'Migració a Google Cloud', ['Taller Exemple']]
  ])('%s: continua sense sentit i amb SENTIT_DESCONEGUT', async (_cas, concepte, capcalera) => {
    const r = await analitza({ '2026_3T/taller_pedra_seca.pdf': EMESA_SENSE_SERIE(concepte, capcalera) });
    const d = doc(r, '2026_3T/taller_pedra_seca.pdf');
    expect(d.sentit).toBeNull();
    expect(codis(d.avisos)).toContain('SENTIT_DESCONEGUT');
    expect(codis(r.incidencies)).toContain('SENTIT_DESCONEGUT');
  });
});

/* ── G3T-04 (la part del tractor) ───────────────────────────────────────── */

describe('G3T-04: el rebut porta el número de factura que cita', () => {
  test('«Invoice number» davant del «Receipt number»: numeroCitat al document i als documents de l’auditoria', async () => {
    const r = await analitza({
      '2026_3T/Receipt-2000-0001.pdf': pdf(['Receipt number 2000-0001', 'Invoice number EXA-0004', 'Date paid 24/08/2026', 'Amount paid 30,25 EUR'])
    });
    expect(doc(r, '2026_3T/Receipt-2000-0001.pdf')).toMatchObject({ tipus: 'rebut', numeroCitat: 'EXA-0004' });
    expect(documentsAuditats()).toContainEqual(expect.objectContaining({
      ruta: '2026_3T/Receipt-2000-0001.pdf', tipus: 'rebut', import: 3025, numeroCitat: 'EXA-0004'
    }));
  });

  test.each([
    ['Factura nº F-2026-07', 'F-2026-07'],
    ['Número de factura: F-2026-08', 'F-2026-08'],
    ['Factura num. F-2026-09', 'F-2026-09']
  ])('etiqueta en castellà o valencià «%s»', async (linia, esperat) => {
    const r = await analitza({ '2026_3T/Rebut_lloguer.pdf': pdf(['Rebut de lloguer', linia, 'Import 300,00 EUR']) });
    expect(doc(r, '2026_3T/Rebut_lloguer.pdf').numeroCitat).toBe(esperat);
  });

  test('un rebut que només diu el seu número no cita cap factura: null', async () => {
    const r = await analitza({ '2026_3T/Receipt-2000-0002.pdf': pdf(['Receipt number 2000-0002', 'Amount paid 10,00 EUR']) });
    expect(doc(r, '2026_3T/Receipt-2000-0002.pdf').numeroCitat).toBeNull();
    expect(documentsAuditats()).toContainEqual(expect.objectContaining({ ruta: '2026_3T/Receipt-2000-0002.pdf', numeroCitat: null }));
  });

  test('el justificant reclassificat pel contingut també cita la factura del concepte', async () => {
    const r = await analitza({ '2026_3T/operacio_0716.pdf': pdf(JUSTIFICANT) });
    expect(doc(r, '2026_3T/operacio_0716.pdf').numeroCitat).toBe('ES-2026-0007');
  });

  test('els documents que no són rebuts no porten numeroCitat', async () => {
    const r = await analitza({ '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS) });
    expect(doc(r, '2026_3T/serveis_juliol.pdf')).not.toHaveProperty('numeroCitat');
    expect(documentsAuditats()[0]).not.toHaveProperty('numeroCitat');
  });

  test('el rebut porta també l’import al document: la revisió el pot tornar a casar sense número', async () => {
    const r = await analitza({ '2026_3T/Justi_0001.pdf': pdf(JUSTIFICANT), '2026_3T/serveis_juliol.pdf': pdf(FACTURA_SERVEIS) });
    expect(doc(r, '2026_3T/Justi_0001.pdf')).toMatchObject({ tipus: 'rebut', import: 72600 });
    expect(doc(r, '2026_3T/serveis_juliol.pdf')).not.toHaveProperty('import');
  });
});

/* ── G3T-03 (la part del tractor) ───────────────────────────────────────── */

describe('G3T-03: el tractor passa els noms propis a la recepta', () => {
  const CIF_CLIENT_A = cif('B', '7100008');
  const CIF_CLIENT_B = cif('B', '7100016');
  const MODEL_2T = '2026_2T/2026-FACTURACIO-Titular_Exemple_-_2T.csv';
  const MODEL = Object.freeze({
    any: 2026,
    t: 2,
    titular: 'Associacio Titular Exemple',
    ingressos: [crearFactura({
      tipus: 'ingres', data: '15/05/2026', num: 'F26 0001', contrapart: 'Exemple Distribucions SL', nif: CIF_CLIENT_A,
      descripcio: 'Taller', subtotal: 50000, iva: 10500, total: 60500, origen: { fitxer: MODEL_2T, metode: 'model' }
    })],
    despeses: [],
    avisos: []
  });
  const llegeixModel = () => MODEL;
  /* La capçalera posa la marca (o el titular) darrere de «Client:» i el client de veres va a la línia següent. */
  const emesa = (num, propi, client, cifClient) => pdf([
    `Factura num. ${num}`, 'Data: 10/08/2026', `Client: ${propi}`, client, `CIF: ${cifClient}`,
    'Concepte: Taller de pedra seca', 'Base imposable 200,00', 'IVA 21% 42,00', 'Total 242,00'
  ]);
  const contraparts = (r) => r.proposta.ingressos.map((f) => [f.num, f.contrapart]);

  test('el titular dels fulls anteriors no és mai el client d’una factura emesa', async () => {
    const r = await analitza({
      [MODEL_2T]: latin1('full sintètic del 2T'),
      '2026_3T/F26-0002.pdf': emesa('F26-0002', 'Associacio Titular Exemple', 'Exemple Distribucions SL', CIF_CLIENT_A)
    }, { llegeixModel });
    expect(contraparts(r)).toEqual([['F26-0002', 'Exemple Distribucions SL']]);
    expect(r.nomsPropis).toEqual(['Associacio Titular Exemple']);
  });

  test('els noms que diu la persona (nomsTitular) també compten', async () => {
    const r = await analitza({
      [MODEL_2T]: latin1('full sintètic del 2T'),
      '2026_3T/F26-0002.pdf': emesa('F26-0002', 'Marca Exemple Propia', 'Exemple Distribucions SL', CIF_CLIENT_A)
    }, { llegeixModel, nomsTitular: ['Marca Exemple Propia', '', null, ' Associacio Titular Exemple '] });
    expect(contraparts(r)).toEqual([['F26-0002', 'Exemple Distribucions SL']]);
    expect(r.nomsPropis).toEqual(['Associacio Titular Exemple', 'Marca Exemple Propia']);
  });

  test('un nom que ix de client en factures emeses amb NIF diferents és la marca: es torna a llegir el client', async () => {
    const r = await analitza({
      [MODEL_2T]: latin1('full sintètic del 2T'),
      '2026_3T/F26-0002.pdf': emesa('F26-0002', 'Marca Exemple Propia', 'Exemple Distribucions SL', CIF_CLIENT_A),
      '2026_3T/F26-0003.pdf': emesa('F26-0003', 'Marca Exemple Propia', 'Exemple Cooperativa de Serveis SL', CIF_CLIENT_B)
    }, { llegeixModel });
    expect(contraparts(r)).toEqual([['F26-0002', 'Exemple Distribucions SL'], ['F26-0003', 'Exemple Cooperativa de Serveis SL']]);
    expect(r.nomsPropis).toEqual(['Associacio Titular Exemple', 'Marca Exemple Propia']);
    /* El document apunta a la factura de la proposta (la nova, no la de la primera lectura). */
    const ids = new Set(r.proposta.ingressos.map((f) => f.id));
    expect(ids.has(doc(r, '2026_3T/F26-0003.pdf').facturaId)).toBe(true);
  });

  test('el mateix client (mateix NIF) en diverses factures emeses continua sent el client', async () => {
    const r = await analitza({
      [MODEL_2T]: latin1('full sintètic del 2T'),
      '2026_3T/F26-0002.pdf': emesa('F26-0002', 'Exemple Distribucions SL', 'Taller de la Vila', CIF_CLIENT_A),
      '2026_3T/F26-0003.pdf': emesa('F26-0003', 'Exemple Distribucions SL', 'Taller de la Vila', CIF_CLIENT_A)
    }, { llegeixModel });
    expect(contraparts(r)).toEqual([['F26-0002', 'Exemple Distribucions SL'], ['F26-0003', 'Exemple Distribucions SL']]);
    expect(r.nomsPropis).toEqual(['Associacio Titular Exemple']);
  });
});

/* ── G3T-R04 (la part del tractor) ──────────────────────────────────────── */

describe('G3T-R04: un abonament porta `abonament` a la Factura i l’avís ABONAMENT', () => {
  const ABONAMENT = [
    'Credit note CN-0001', 'Exemple Serveis SL', `CIF: ${CIF_SERVEIS}`, 'Fecha: 23/07/2026',
    'Base imponible 50,00 EUR', 'IVA 21% 10,50 EUR', 'Total 60,50 EUR'
  ];

  test('«Credit note» amb els imports en positiu: negatius, `abonament` i ABONAMENT mitjana amb la factura', async () => {
    const r = await analitza({ '2026_3T/abonament_serveis.pdf': pdf(ABONAMENT) });
    const [f, ...resta] = files(r);
    expect(resta).toEqual([]);
    expect(f).toMatchObject({ abonament: true, subtotal: -5000, iva: -1050, total: -6050 });
    expect(r.incidencies).toContainEqual(expect.objectContaining({ codi: 'ABONAMENT', severitat: 'mitjana', facturaId: f.id }));
    expect(doc(r, '2026_3T/abonament_serveis.pdf').fragments.abonament).toBe('Credit note CN-0001');
  });

  test('una frase que comença per «Credit note» no fa cap abonament', async () => {
    const linies = ABONAMENT.map((l) => (l === 'Credit note CN-0001' ? 'Credit note requests must be sent within 30 days' : l));
    const r = await analitza({ '2026_3T/serveis_juliol.pdf': pdf(linies) });
    const [f] = files(r);
    expect(f).not.toHaveProperty('abonament');
    expect(f).toMatchObject({ subtotal: 5000, iva: 1050, total: 6050 });
    expect(codis(r.incidencies)).not.toContain('ABONAMENT');
  });
});
