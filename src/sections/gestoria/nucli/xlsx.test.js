// @vitest-environment jsdom
/* Gestoria · nucli · xlsx: el llibre d'Excel del full trimestral, comprovat
   amb un lector XLSX independent escrit ací (ZIP pel directori central amb
   CRC propi, i DOMParser) que reconstruïx la graella: valors, cadenes
   compartides, fórmules i l'estil efectiu de cada cel·la tal com l'aplicaria
   un visor estricte amb els apply*. Dades sintètiques: empreses fictícies i
   CIF calculats. */
import { describe, expect, test } from 'vitest';
import { fullAXlsx } from './xlsx.js';
import { maquetaFull } from './fullModel.js';
import { crearFactura } from './model.js';
import { PLANTILLA_GESTORIA, PLANTILLA_VERDA_ANTIGA } from './plantilla.js';

const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const COLUMNES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const PARTS = [
  '[Content_Types].xml', '_rels/.rels', 'docProps/app.xml', 'docProps/core.xml', 'xl/workbook.xml',
  'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml'
];
/* Ordre dels fills segons ECMA-376 (part 1): CT_Worksheet, CT_Stylesheet i CT_Workbook. */
const ORDRE_FULLA = [
  'sheetPr', 'dimension', 'sheetViews', 'sheetFormatPr', 'cols', 'sheetData', 'sheetCalcPr', 'sheetProtection', 'protectedRanges',
  'scenarios', 'autoFilter', 'sortState', 'dataConsolidate', 'customSheetViews', 'mergeCells', 'phoneticPr', 'conditionalFormatting',
  'dataValidations', 'hyperlinks', 'printOptions', 'pageMargins', 'pageSetup', 'headerFooter', 'rowBreaks', 'colBreaks',
  'customProperties', 'cellWatches', 'ignoredErrors', 'smartTags', 'drawing', 'legacyDrawing', 'legacyDrawingHF', 'picture',
  'oleObjects', 'controls', 'webPublishItems', 'tableParts', 'extLst'
];
const ORDRE_ESTILS = ['numFmts', 'fonts', 'fills', 'borders', 'cellStyleXfs', 'cellXfs', 'cellStyles', 'dxfs', 'tableStyles', 'colors', 'extLst'];
const ORDRE_LLIBRE = [
  'fileVersion', 'fileSharing', 'workbookPr', 'workbookProtection', 'bookViews', 'sheets', 'functionGroups', 'externalReferences',
  'definedNames', 'calcPr', 'oleSize', 'customWorkbookViews', 'pivotCaches', 'smartTagPr', 'smartTagTypes', 'webPublishing',
  'fileRecoveryPr', 'webPublishObjects', 'extLst'
];

/* ---------- Lector XLSX independent ---------- */

const TAULA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc(bytes) {
  let valor = 0xffffffff;
  for (const b of bytes) valor = TAULA_CRC[(valor ^ b) & 0xff] ^ (valor >>> 8);
  return (valor ^ 0xffffffff) >>> 0;
}

/* EOCD → directori central → capçalera local → dades, amb el CRC i la mida comprovats. */
function llegeixZip(zip) {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let fi = zip.length - 22;
  while (fi >= 0 && v.getUint32(fi, true) !== 0x06054b50) fi -= 1;
  expect(fi).toBeGreaterThanOrEqual(0);
  const parts = new Map();
  let pos = v.getUint32(fi + 16, true);
  for (let i = 0; i < v.getUint16(fi + 10, true); i += 1) {
    expect(v.getUint32(pos, true)).toBe(0x02014b50);
    expect(v.getUint16(pos + 10, true)).toBe(0);
    expect(v.getUint32(pos + 20, true)).toBe(v.getUint32(pos + 24, true));
    const llargNom = v.getUint16(pos + 28, true);
    const nom = new TextDecoder().decode(zip.subarray(pos + 46, pos + 46 + llargNom));
    const local = v.getUint32(pos + 42, true);
    expect(v.getUint32(local, true)).toBe(0x04034b50);
    const inici = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    const dades = zip.slice(inici, inici + v.getUint32(pos + 20, true));
    expect(crc(dades)).toBe(v.getUint32(pos + 16, true));
    parts.set(nom, new TextDecoder('utf-8', { fatal: true }).decode(dades));
    pos += 46 + llargNom + v.getUint16(pos + 30, true) + v.getUint16(pos + 32, true);
  }
  return parts;
}

function xml(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
  return doc.documentElement;
}
const filles = (el, nom) => (el ? [...el.children].filter((c) => c.localName === nom) : []);
const filla = (el, nom) => filles(el, nom)[0] ?? null;
const cert = (valor) => valor === '1' || valor === 'true';
/* «_xHHHH_» és un caràcter escapat d'Excel; «_x005F_» és el guió baix literal. */
const desescapa = (text) => text.replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

function llegeixCadenes(arrel) {
  return filles(arrel, 'si').map((si) => {
    const t = filla(si, 't');
    const trossos = t ? [t] : filles(si, 'r').map((r) => filla(r, 't')).filter(Boolean);
    return desescapa(trossos.map((tros) => tros.textContent).join(''));
  });
}

/* L'estil efectiu de cada xf: una propietat només s'aplica si el seu apply* ho diu; si no, mana l'estil de cel·la base. */
function llegeixEstils(arrel) {
  const numFmts = filles(filla(arrel, 'numFmts'), 'numFmt');
  const formats = new Map(numFmts.map((f) => [Number(f.getAttribute('numFmtId')), f.getAttribute('formatCode')]));
  const codiFormat = (id) => (id === 0 ? null : formats.get(id) ?? `predefinit:${id}`);
  const fonts = filles(filla(arrel, 'fonts'), 'font').map((f) => ({
    negreta: Boolean(filla(f, 'b')) && filla(f, 'b').getAttribute('val') !== '0',
    colorLletra: filla(f, 'color')?.getAttribute('rgb') ?? null,
    nom: filla(f, 'name')?.getAttribute('val') ?? null,
    mida: Number(filla(f, 'sz')?.getAttribute('val'))
  }));
  const fons = filles(filla(arrel, 'fills'), 'fill').map((f) => {
    const patro = filla(f, 'patternFill');
    return { patro: patro?.getAttribute('patternType') ?? null, color: filla(patro, 'fgColor')?.getAttribute('rgb') ?? null };
  });
  const vores = filles(filla(arrel, 'borders'), 'border')
    .map((b) => ['left', 'right', 'top', 'bottom'].every((costat) => filla(b, costat)?.getAttribute('style') === 'thin'));
  const bases = filles(filla(arrel, 'cellStyleXfs'), 'xf');
  const xfs = filles(filla(arrel, 'cellXfs'), 'xf').map((xf) => {
    const base = bases[Number(xf.getAttribute('xfId') ?? 0)];
    const tria = (atribut, aplica) => Number((cert(xf.getAttribute(aplica)) ? xf : base).getAttribute(atribut) ?? 0);
    const font = fonts[tria('fontId', 'applyFont')];
    const fill = fons[tria('fillId', 'applyFill')];
    const alineacio = cert(xf.getAttribute('applyAlignment')) ? filla(xf, 'alignment') : null;
    return {
      negreta: font.negreta,
      colorLletra: font.colorLletra,
      fons: fill.patro === 'solid' ? fill.color : null,
      vora: vores[tria('borderId', 'applyBorder')],
      alineacio: alineacio?.getAttribute('horizontal') ?? null,
      vertical: alineacio?.getAttribute('vertical') ?? null,
      ajust: cert(alineacio?.getAttribute('wrapText') ?? null),
      numFmt: codiFormat(tria('numFmtId', 'applyNumberFormat'))
    };
  });
  return { arrel, formats, fonts, fons, xfs, fontPerDefecte: fonts[Number(bases[0].getAttribute('fontId'))] };
}

function posicioDe(ref) {
  const [, lletres, fila] = /^([A-Z]+)(\d+)$/.exec(ref);
  return { fila: Number(fila), columna: [...lletres].reduce((n, lletra) => n * 26 + lletra.charCodeAt(0) - 64, 0) };
}

function llegeixLlibre(bytes) {
  const parts = llegeixZip(bytes);
  const llibre = xml(parts.get('xl/workbook.xml'));
  const fulla = filles(filla(llibre, 'sheets'), 'sheet')[0];
  const rels = filles(xml(parts.get('xl/_rels/workbook.xml.rels')), 'Relationship');
  const desti = (troba) => `xl/${rels.find(troba).getAttribute('Target')}`;
  const cadenes = llegeixCadenes(xml(parts.get(desti((r) => r.getAttribute('Type').endsWith('/sharedStrings')))));
  const estils = llegeixEstils(xml(parts.get(desti((r) => r.getAttribute('Type').endsWith('/styles')))));
  const camiFulla = desti((r) => r.getAttribute('Id') === fulla.getAttributeNS(NS_REL, 'id'));
  const arrel = xml(parts.get(camiFulla));
  const celles = new Map();
  let filaAnterior = 0;
  for (const row of filles(filla(arrel, 'sheetData'), 'row')) {
    const r = Number(row.getAttribute('r'));
    expect(r).toBeGreaterThan(filaAnterior);
    filaAnterior = r;
    let columnaAnterior = 0;
    for (const c of filles(row, 'c')) {
      const posicio = posicioDe(c.getAttribute('r'));
      expect(posicio.fila).toBe(r);
      expect(posicio.columna).toBeGreaterThan(columnaAnterior);
      columnaAnterior = posicio.columna;
      const tipus = c.getAttribute('t') ?? 'n';
      const v = filla(c, 'v')?.textContent ?? null;
      const estil = estils.xfs[Number(c.getAttribute('s') ?? 0)];
      expect(estil).toBeDefined();
      celles.set(c.getAttribute('r'), {
        tipus,
        valor: v === null ? null : tipus === 's' ? cadenes[Number(v)] : tipus === 'n' ? Number(v) : v,
        formula: filla(c, 'f')?.textContent ?? null,
        estil
      });
    }
  }
  return {
    parts,
    camiFulla,
    nomFulla: fulla.getAttribute('name'),
    cadenes,
    estils,
    celles,
    fulla: arrel,
    dimensio: filla(arrel, 'dimension').getAttribute('ref'),
    altFila: Number(filla(arrel, 'sheetFormatPr').getAttribute('defaultRowHeight')),
    combinacions: filles(filla(arrel, 'mergeCells'), 'mergeCell').map((m) => m.getAttribute('ref')),
    columnes: filles(filla(arrel, 'cols'), 'col').map((col) => ({
      min: Number(col.getAttribute('min')), max: Number(col.getAttribute('max')),
      amplada: Number(col.getAttribute('width')), propia: cert(col.getAttribute('customWidth'))
    }))
  };
}

/* La graella de valors de A1 fins a l'última fila de la dimensió. */
function graella(llibre) {
  const ultima = Number(/(\d+)$/.exec(llibre.dimensio)[1]);
  return Array.from({ length: ultima }, (_, i) => COLUMNES.map((col) => llibre.celles.get(`${col}${i + 1}`)?.valor ?? null));
}
const estilsFila = (llibre, r) => COLUMNES.map((col) => llibre.celles.get(`${col}${r}`)?.estil ?? null);
const formulesFila = (llibre, r) => COLUMNES.map((col) => llibre.celles.get(`${col}${r}`)?.formula ?? null);
const tipusFila = (llibre, r) => COLUMNES.map((col) => llibre.celles.get(`${col}${r}`)?.tipus ?? null);
/* Dies des del 30/12/1899, calculats ací sense el codi del nucli. */
const serial = (a, m, d) => (Date.UTC(a, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000;

function enOrdre(el, ordre) {
  const posicions = [...el.children].map((c) => ordre.indexOf(c.localName));
  expect(posicions.every((i) => i >= 0)).toBe(true);
  for (let i = 1; i < posicions.length; i += 1) expect(posicions[i]).toBeGreaterThan(posicions[i - 1]);
}

/* ---------- Estils efectius esperats ---------- */

const NORMAL = { negreta: false, colorLletra: null, fons: null, vora: false, alineacio: null, vertical: null, ajust: false, numFmt: null };
const ambEstil = (canvis) => ({ ...NORMAL, ...canvis });
const EUROS = '#,##0.00 "€"';
const TITOL = ambEstil({ negreta: true, alineacio: 'center' });
const BARRA = ambEstil({ negreta: true, colorLletra: 'FFFFFFFF', fons: 'FF000000', alineacio: 'center' });
const CAPCALERA = ambEstil({ negreta: true, colorLletra: 'FFFFFFFF', fons: 'FF666666', alineacio: 'center' });
const DADA_DATA = ambEstil({ alineacio: 'left', vertical: 'top', numFmt: 'dd/mm/yy' });
const DADA_TEXT = ambEstil({ alineacio: 'left', vertical: 'top' });
const DADA_AJUST = ambEstil({ alineacio: 'left', vertical: 'top', ajust: true });
const DADA_IMPORT = ambEstil({ alineacio: 'right', vertical: 'top', numFmt: EUROS });
const ETIQUETA_TOTAL = ambEstil({ negreta: true, alineacio: 'right', vertical: 'top' });
const TOTAL = ambEstil({ negreta: true, alineacio: 'right', vertical: 'top', numFmt: EUROS });
const ESTILS_DADA = [DADA_DATA, DADA_TEXT, DADA_AJUST, DADA_TEXT, DADA_AJUST, DADA_IMPORT, DADA_IMPORT, DADA_IMPORT];
const ESTILS_TOTALS = [null, null, null, null, ETIQUETA_TOTAL, TOTAL, TOTAL, TOTAL];
const BUIDA = Array(8).fill(null);
const sola = (valor) => [valor, ...Array(7).fill(null)];

/* ---------- Dades sintètiques ---------- */

const CIF_A = 'A12345674';
function cifB(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return `B${xifres}${(10 - ((parells + senars) % 10)) % 10}`;
}
const CIF_B = cifB('7654321');

const factura = (canvis) => crearFactura({
  contrapart: 'Exemple Energia SCCL', nif: CIF_A, descripcio: 'Subministrament', origen: { fitxer: 'factures/exemple.pdf', metode: 'pdf' }, ...canvis
});
const INGRESSOS = [
  factura({
    tipus: 'ingres', num: 'V-2', data: { a: 2026, m: 5, d: 2 }, contrapart: 'Exemple Clients SL', descripcio: 'Taller de dos dies',
    subtotal: 50000, iva: 10500, total: 60500
  }),
  factura({
    tipus: 'ingres', num: 'V-1', data: { a: 2026, m: 4, d: 15 }, contrapart: 'Exemple Formació SCCL', nif: CIF_B, descripcio: 'Curs de poda',
    subtotal: 123456, iva: 25926, total: 149382
  })
];
/* [núm, mes, dia, subtotal en cèntims] en un ordre qualsevol, amb IVA del 21 %. */
const DESPESES_CRUES = [
  ['F-10', 6, 5, 1000], ['F-2', 6, 5, 2000], ['F-1', 4, 1, 3000], ['F-7', 5, 20, 4000], ['F-3', 4, 30, 5000], ['F-5', 5, 2, 6000],
  ['F-4', 5, 2, 7000], ['F-8', 6, 1, 8000], ['F-6', 5, 15, 9000], ['F-9', 6, 1, 10000], ['F-12', 6, 30, 12000], ['F-11', 6, 30, 11000]
];
const DESPESES = DESPESES_CRUES.map(([num, m, d, subtotal]) => factura({
  tipus: 'despesa', num, data: { a: 2026, m, d }, subtotal, iva: (subtotal * 21) / 100, total: (subtotal * 121) / 100
}));
const ORDRE_DESPESES = ['F-1', 'F-3', 'F-4', 'F-5', 'F-6', 'F-7', 'F-8', 'F-9', 'F-2', 'F-10', 'F-11', 'F-12'];
const filaDespesa = (num) => {
  const [, m, d, subtotal] = DESPESES_CRUES.find((crua) => crua[0] === num);
  return [serial(2026, m, d), num, 'Exemple Energia SCCL', CIF_A, 'Subministrament', subtotal / 100, (subtotal * 21) / 10000, (subtotal * 121) / 10000];
};

const genera = (plantilla, dades) => fullAXlsx(maquetaFull(plantilla, { titular: 'Exemple Titular', any: 2026, t: 2, ...dades }));
const BYTES_A = genera(PLANTILLA_GESTORIA, { ingressos: INGRESSOS, despeses: DESPESES });
const LLIBRE_A = llegeixLlibre(BYTES_A);

describe('fullAXlsx · paquet', () => {
  test('el DOMParser d\'aquest entorn detecta un XML mal format', () => {
    expect(new DOMParser().parseFromString('<a><b></a>', 'application/xml').getElementsByTagName('parsererror').length).toBeGreaterThan(0);
  });

  test('ZIP amb les parts d\'un XLSX, [Content_Types].xml primer, totes XML ben format', () => {
    expect([...BYTES_A.subarray(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect([...LLIBRE_A.parts.keys()]).toEqual(PARTS);
    for (const nom of PARTS) {
      expect(LLIBRE_A.parts.get(nom).startsWith('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')).toBe(true);
      xml(LLIBRE_A.parts.get(nom));
    }
  });

  test('tipus de contingut (també de les cadenes compartides) i relacions cap a parts que existixen', () => {
    const tipus = xml(LLIBRE_A.parts.get('[Content_Types].xml'));
    const overrides = new Map(filles(tipus, 'Override').map((o) => [o.getAttribute('PartName'), o.getAttribute('ContentType')]));
    expect([...overrides.keys()].sort()).toEqual(PARTS.filter((p) => !p.endsWith('.rels') && p !== '[Content_Types].xml').map((p) => `/${p}`).sort());
    expect(overrides.get('/xl/sharedStrings.xml')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml');
    const rels = filles(xml(LLIBRE_A.parts.get('_rels/.rels')), 'Relationship').map((r) => r.getAttribute('Target'));
    const relsLlibre = filles(xml(LLIBRE_A.parts.get('xl/_rels/workbook.xml.rels')), 'Relationship').map((r) => `xl/${r.getAttribute('Target')}`);
    expect(relsLlibre.sort()).toEqual(['xl/sharedStrings.xml', 'xl/styles.xml', 'xl/worksheets/sheet1.xml']);
    for (const desti of [...rels, ...relsLlibre]) expect(LLIBRE_A.parts.has(desti)).toBe(true);
  });

  test('ordre dels elements segons ECMA-376 a la fulla, als estils i al llibre', () => {
    enOrdre(LLIBRE_A.fulla, ORDRE_FULLA);
    enOrdre(LLIBRE_A.estils.arrel, ORDRE_ESTILS);
    enOrdre(xml(LLIBRE_A.parts.get('xl/workbook.xml')), ORDRE_LLIBRE);
    expect([...LLIBRE_A.fulla.children].map((c) => c.localName)).toEqual([
      'sheetPr', 'dimension', 'sheetViews', 'sheetFormatPr', 'cols', 'sheetData', 'mergeCells', 'pageMargins', 'pageSetup', 'ignoredErrors'
    ]);
  });

  test('styles.xml coherent: recomptes, els dos fons reservats, formats propis des del 164 i apply* d\'acord amb cada índex', () => {
    const arrel = LLIBRE_A.estils.arrel;
    for (const [pare, fill] of [['numFmts', 'numFmt'], ['fonts', 'font'], ['fills', 'fill'], ['borders', 'border'], ['cellStyleXfs', 'xf'], ['cellXfs', 'xf'], ['cellStyles', 'cellStyle']]) {
      const el = filla(arrel, pare);
      expect(filles(el, fill)).toHaveLength(Number(el.getAttribute('count')));
    }
    expect(LLIBRE_A.estils.fons.slice(0, 2).map((f) => f.patro)).toEqual(['none', 'gray125']);
    expect(Object.fromEntries(LLIBRE_A.estils.formats)).toEqual({ 164: 'dd/mm/yy', 165: EUROS });
    for (const xf of filles(filla(arrel, 'cellXfs'), 'xf')) {
      for (const [id, aplica] of [['numFmtId', 'applyNumberFormat'], ['fontId', 'applyFont'], ['fillId', 'applyFill'], ['borderId', 'applyBorder']]) {
        expect(cert(xf.getAttribute(aplica))).toBe(xf.getAttribute(id) !== '0');
      }
      expect(cert(xf.getAttribute('applyAlignment'))).toBe(Boolean(filla(xf, 'alignment')));
    }
  });

  test('cadenes compartides: cap text en línia, i recomptes d\'usos i d\'úniques', () => {
    const fullaXml = LLIBRE_A.parts.get('xl/worksheets/sheet1.xml');
    expect(fullaXml).not.toContain('inlineStr');
    const usos = [...LLIBRE_A.celles.values()].filter((c) => c.tipus === 's').length;
    const sst = xml(LLIBRE_A.parts.get('xl/sharedStrings.xml'));
    expect(Number(sst.getAttribute('count'))).toBe(usos);
    expect(Number(sst.getAttribute('uniqueCount'))).toBe(LLIBRE_A.cadenes.length);
    expect(new Set(LLIBRE_A.cadenes).size).toBe(LLIBRE_A.cadenes.length);
    expect(LLIBRE_A.cadenes.filter((c) => c === 'Totals')).toHaveLength(1);
  });

  test('propietats i llibre sense dades personals ni dates', () => {
    for (const nom of ['docProps/core.xml', 'docProps/app.xml', 'xl/workbook.xml']) {
      for (const dada of ['Exemple', 'Titular', CIF_A, CIF_B, '2026', 'created', 'modified']) expect(LLIBRE_A.parts.get(nom)).not.toContain(dada);
    }
    expect(filla(xml(LLIBRE_A.parts.get('docProps/core.xml')), 'creator').textContent).toBe('Sóc de Poble');
  });
});

describe('fullAXlsx · (a) un trimestre amb 2 ingressos i 12 despeses', () => {
  test('fulla «2T», Arial 10, files de 12,75 punts i amplades en caràcters', () => {
    expect(LLIBRE_A.nomFulla).toBe('2T');
    expect(LLIBRE_A.estils.fontPerDefecte).toEqual({ negreta: false, colorLletra: null, nom: 'Arial', mida: 10 });
    expect(LLIBRE_A.altFila).toBe(12.75);
    expect(LLIBRE_A.columnes.map((c) => [c.min, c.max, c.propia])).toEqual(COLUMNES.map((_, i) => [i + 1, i + 1, true]));
    expect(LLIBRE_A.columnes.map((c) => Math.floor(c.amplada))).toEqual([10, 17, 32, 13, 46, 12, 10, 12]);
    expect(LLIBRE_A.columnes[0].amplada).toBe(10.7109375);
    expect(LLIBRE_A.dimensio).toBe('A1:H25');
  });

  test('la graella exacta: títol, dues files buides, barres, capçaleres, dades per data i totals', () => {
    expect(graella(LLIBRE_A)).toEqual([
      sola('Exemple Titular - 01/04/2026 - 30/06/2026 - 2T'),
      BUIDA,
      BUIDA,
      sola('INGRESSOS'),
      ['Data', 'Núm', 'Client', 'NIF - CIF', 'Descripció', 'Subtotal', 'IVA', 'Total'],
      [serial(2026, 4, 15), 'V-1', 'Exemple Formació SCCL', CIF_B, 'Curs de poda', 1234.56, 259.26, 1493.82],
      [serial(2026, 5, 2), 'V-2', 'Exemple Clients SL', CIF_A, 'Taller de dos dies', 500, 105, 605],
      [null, null, null, null, 'Totals', 1734.56, 364.26, 2098.82],
      BUIDA,
      BUIDA,
      sola('GASTOS'),
      ['Data', 'Núm', 'Proveïdor', 'NIF - CIF', 'Descripció', 'Subtotal', 'IVA', 'Total'],
      ...ORDRE_DESPESES.map(filaDespesa),
      [null, null, null, null, 'Totals', 780, 163.8, 943.8]
    ]);
  });

  test('combinacions: el títol i les dues barres, de A a H', () => {
    expect(LLIBRE_A.combinacions).toEqual(['A1:H1', 'A4:H4', 'A11:H11']);
  });

  test('estils efectius fila per fila', () => {
    expect(estilsFila(LLIBRE_A, 1)).toEqual(Array(8).fill(TITOL));
    expect(estilsFila(LLIBRE_A, 2)).toEqual(BUIDA);
    expect(estilsFila(LLIBRE_A, 3)).toEqual(BUIDA);
    for (const r of [4, 11]) expect(estilsFila(LLIBRE_A, r)).toEqual(Array(8).fill(BARRA));
    for (const r of [5, 12]) expect(estilsFila(LLIBRE_A, r)).toEqual(Array(8).fill(CAPCALERA));
    for (const r of [6, 7, 13, 18, 24]) expect(estilsFila(LLIBRE_A, r)).toEqual(ESTILS_DADA);
    for (const r of [8, 25]) expect(estilsFila(LLIBRE_A, r)).toEqual(ESTILS_TOTALS);
    for (const r of [9, 10]) expect(estilsFila(LLIBRE_A, r)).toEqual(BUIDA);
  });

  test('tipus de cel·la: data i imports numèrics, la resta text de la taula compartida', () => {
    for (const r of [6, 13, 24]) expect(tipusFila(LLIBRE_A, r)).toEqual(['n', 's', 's', 's', 's', 'n', 'n', 'n']);
    expect(tipusFila(LLIBRE_A, 1)).toEqual(['s', 'n', 'n', 'n', 'n', 'n', 'n', 'n']);
    expect(LLIBRE_A.celles.get('B1').valor).toBeNull();
  });

  test('totals: SUM del rang de dades amb el valor en memòria cau', () => {
    expect(formulesFila(LLIBRE_A, 8)).toEqual([null, null, null, null, null, 'SUM(F6:F7)', 'SUM(G6:G7)', 'SUM(H6:H7)']);
    expect(formulesFila(LLIBRE_A, 25)).toEqual([null, null, null, null, null, 'SUM(F13:F24)', 'SUM(G13:G24)', 'SUM(H13:H24)']);
    expect(LLIBRE_A.parts.get('xl/worksheets/sheet1.xml')).toContain('<f>SUM(F6:F7)</f><v>1734.56</v>');
  });
});

describe('fullAXlsx · (b) un trimestre sense ingressos', () => {
  const llibre = llegeixLlibre(genera(PLANTILLA_GESTORIA, { despeses: DESPESES.slice(0, 2) }));

  test('els totals d\'INGRESSOS van just després de la capçalera, a zero i sense fórmula', () => {
    expect(graella(llibre)).toEqual([
      sola('Exemple Titular - 01/04/2026 - 30/06/2026 - 2T'),
      BUIDA,
      BUIDA,
      sola('INGRESSOS'),
      ['Data', 'Núm', 'Client', 'NIF - CIF', 'Descripció', 'Subtotal', 'IVA', 'Total'],
      [null, null, null, null, 'Totals', 0, 0, 0],
      BUIDA,
      BUIDA,
      sola('GASTOS'),
      ['Data', 'Núm', 'Proveïdor', 'NIF - CIF', 'Descripció', 'Subtotal', 'IVA', 'Total'],
      filaDespesa('F-2'),
      filaDespesa('F-10'),
      [null, null, null, null, 'Totals', 30, 6.3, 36.3]
    ]);
    expect(formulesFila(llibre, 6)).toEqual(BUIDA);
    expect(estilsFila(llibre, 6)).toEqual(ESTILS_TOTALS);
    expect(formulesFila(llibre, 13).slice(5)).toEqual(['SUM(F11:F12)', 'SUM(G11:G12)', 'SUM(H11:H12)']);
    expect(llibre.combinacions).toEqual(['A1:H1', 'A4:H4', 'A9:H9']);
  });
});

describe('fullAXlsx · (c) textos amb accents, &, <, cometes i zeros a l\'esquerra', () => {
  const contrapart = 'Cooperativa d\'Àger & Fills <SCCL> "Coop"';
  const descripcio = 'Línia u\nLínia dos: ñ, ç, l·l, € i _x0041_  amb  espais';
  const bytes = fullAXlsx(maquetaFull(PLANTILLA_GESTORIA, {
    titular: 'Exemple Àgora & Cia <Coop>', any: 2026, t: 2,
    ingressos: [factura({ tipus: 'ingres', num: '000123', data: { a: 2026, m: 4, d: 7 }, contrapart, nif: CIF_B, descripcio, subtotal: 100, iva: 21, total: 121 })],
    despeses: [factura({ tipus: 'despesa', num: '0042', data: { a: 2026, m: 4, d: 8 }, descripcio: '007 unitats\u0007', subtotal: 1000, iva: 210, total: 1210 })]
  }));
  const llibre = llegeixLlibre(bytes);

  test('els textos tornen exactes, com a cadenes compartides', () => {
    expect(llibre.celles.get('A1').valor).toBe('Exemple Àgora & Cia <Coop> - 01/04/2026 - 30/06/2026 - 2T');
    expect(['B6', 'C6', 'D6', 'E6'].map((ref) => llibre.celles.get(ref).valor)).toEqual(['000123', contrapart, CIF_B, descripcio]);
    expect(['B6', 'C6', 'E6'].map((ref) => llibre.celles.get(ref).tipus)).toEqual(['s', 's', 's']);
    expect(llibre.celles.get('B12').valor).toBe('0042');
    expect(llibre.celles.get('E12').valor).toBe('007 unitats');
  });

  test('l\'XML escapa el que cal i preserva els espais i els salts', () => {
    const cadenes = llibre.parts.get('xl/sharedStrings.xml');
    expect(cadenes).toContain('Cooperativa d\'Àger &amp; Fills &lt;SCCL&gt; &quot;Coop&quot;');
    expect(cadenes).toContain('_x005F_x0041_');
    expect(cadenes).toContain('<t xml:space="preserve">Línia u\nLínia dos');
    expect(cadenes).not.toContain('\u0007');
  });
});

describe('fullAXlsx · (d) determinisme', () => {
  test('dues generacions donen els mateixos bytes, també amb les factures en un altre ordre', () => {
    expect(genera(PLANTILLA_GESTORIA, { ingressos: INGRESSOS, despeses: DESPESES })).toEqual(BYTES_A);
    expect(genera(PLANTILLA_GESTORIA, { ingressos: [...INGRESSOS].reverse(), despeses: [...DESPESES].reverse() })).toEqual(BYTES_A);
  });
});

describe('fullAXlsx · (e) la plantilla verda antiga, sense canviar codi', () => {
  const contrapart = 'Exemple Clients amb un nom molt llarg de cooperativa SCCL';
  const llibre = llegeixLlibre(genera(PLANTILLA_VERDA_ANTIGA, {
    ingressos: [factura({ tipus: 'ingres', num: 'V-1', data: { a: 2026, m: 4, d: 15 }, contrapart, subtotal: 10000, iva: 2100, total: 12100 })]
  }));
  const VERD = 'FF0B6B2E';

  test('un altre full: títol antic, període a la tercera fila, seccions sense barra i capçaleres verdes', () => {
    expect(llibre.nomFulla).toBe('2T');
    expect(llibre.estils.fontPerDefecte).toEqual({ negreta: false, colorLletra: null, nom: 'Calibri', mida: 11 });
    expect(llibre.altFila).toBe(15);
    expect(graella(llibre)).toEqual([
      ['2026-FACTURACIO-Exemple_Titular', null, null, null, null, null, null, '2T'],
      BUIDA,
      sola('Exemple Titular - 01/04/2026 - 30/06/2026'),
      BUIDA,
      sola('INGRESSOS'),
      ['Data', 'Núm', 'Client', 'NIF - CIF', 'Descripció', 'Subtotal', 'IVA', 'Total'],
      [serial(2026, 4, 15), 'V-1', contrapart, CIF_A, 'Subministrament', 100, 21, 121],
      [null, null, null, null, 'Totals', 100, 21, 121],
      BUIDA,
      sola('GASTOS'),
      ['Data', 'Núm', 'Proveïdor', 'NIF - CIF', 'Descripció', 'Subtotal', 'IVA', 'Total'],
      [null, null, null, null, 'Totals', 0, 0, 0]
    ]);
    expect(llibre.combinacions).toEqual(['A3:H3']);
  });

  test('estils i amplades de la versió verda', () => {
    const negreta = ambEstil({ negreta: true });
    const verd = ambEstil({ negreta: true, colorLletra: 'FFFFFFFF', fons: VERD, vora: true });
    expect(estilsFila(llibre, 1)).toEqual([negreta, null, null, null, null, null, null, negreta]);
    expect(estilsFila(llibre, 3)).toEqual(Array(8).fill(ambEstil({ negreta: true, alineacio: 'center' })));
    expect(estilsFila(llibre, 5)).toEqual([negreta, null, null, null, null, null, null, null]);
    expect(estilsFila(llibre, 6)).toEqual(Array(8).fill(verd));
    expect(estilsFila(llibre, 7)).toEqual([
      ambEstil({ numFmt: 'dd/mm/yy' }), NORMAL, NORMAL, NORMAL, NORMAL, ...Array(3).fill(ambEstil({ numFmt: EUROS }))
    ]);
    expect(estilsFila(llibre, 8)).toEqual([
      null, null, null, null, ambEstil({ negreta: true, colorLletra: 'FFFFFFFF', fons: VERD, vora: true, alineacio: 'right' }),
      ...Array(3).fill(ambEstil({ negreta: true, numFmt: EUROS }))
    ]);
    expect(llibre.columnes.map((c) => Math.floor(c.amplada))).toEqual([10, 12, contrapart.length + 2, 13, 36, 14, 12, 14]);
  });
});

describe('fullAXlsx · entrades no vàlides', () => {
  test('cal un full maquetat', () => {
    expect(() => fullAXlsx(null)).toThrow(TypeError);
    expect(() => fullAXlsx({ titol: 'vell', blocs: [] })).toThrow(TypeError);
  });

  test('un estil que el full maquetat no declara és un error, no un estil buit', () => {
    const full = maquetaFull(PLANTILLA_GESTORIA, { titular: 'X', any: 2026, t: 2 });
    full.files[0].celles[0] = { ...full.files[0].celles[0], estil: 'inexistent' };
    expect(() => fullAXlsx(full)).toThrow(/inexistent/);
  });
});
