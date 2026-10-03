/**
 * xlsx.js — un model de full (model.js) com a llibre d'Excel (.xlsx).
 *
 * Diverses fulles, cadascuna amb la capçalera en negreta i fixada a dalt.
 * El text va a la taula de cadenes compartides (xl/sharedStrings.xml), la
 * forma que lligen Excel, LibreOffice, Numbers i les vistes prèvies del mòbil;
 * una cel·la de text mai s'avalua com a fórmula. Els tipus:
 *   text → cadena · nombre → '0' · decimal → '0.00' (o els decimals de la
 *   columna) · data → número de sèrie amb 'dd/mm/yyyy' · hora → fracció del
 *   dia amb 'hh:mm' · import → euros exactes (sense coma flotant) amb
 *   '#,##0.00 €'.
 * Les propietats del document només diuen l'aplicació: ni autor, ni títol,
 * ni dates. El ZIP té data fixa: la mateixa entrada dona els mateixos bytes.
 *
 * Els espais de noms d'OOXML (schemas.openxmlformats.org) són identificadors
 * dins del fitxer: el navegador no s'hi connecta mai. Són les úniques adreces
 * de src/utils/fulls/.
 *
 * Ordre dels elements (ECMA-376, part 1, §18.3.1.99 i §18.8.39):
 *   <worksheet>  dimension, sheetViews, sheetFormatPr, cols, sheetData,
 *                pageMargins, ignoredErrors
 *   <styleSheet> numFmts, fonts, fills, borders, cellStyleXfs, cellXfs, cellStyles
 * JS pur: sense DOM ni React.
 */
import { CARACTERS_NO_XML, comprovaModel, dataLocal, decimalsColumna, eurosExactes, lletraColumna, partsData, valorCela, ampladaColumna } from './model.js';
import { creaZip } from './zip.js';

export const TIPUS_MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const DECLARACIO = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n';
const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_REL_DOC = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_REL_PAQUET = 'http://schemas.openxmlformats.org/package/2006/relationships';
const NS_TIPUS = 'http://schemas.openxmlformats.org/package/2006/content-types';
const NS_APP = 'http://schemas.openxmlformats.org/officeDocument/2006/extended-properties';
const NS_CORE = 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties';
const REL_CORE = 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties';
const TIPUS_CONTINGUT = 'application/vnd.openxmlformats-officedocument';
const APLICACIO = 'Sóc de Poble';

/* Formats que Excel ja porta (ECMA-376, §18.8.30): no es declaren a numFmts. */
const FORMATS_PREDEFINITS = new Map([['0', 1], ['0.00', 2]]);
const PRIMER_FORMAT_PROPI = 164;
/* Píxels de la xifra més ampla de Calibri 11, la base de les amplades (ECMA-376, §18.3.1.13). */
const PIXELS_XIFRA = 7;
/* El número de sèrie 61 és l'1 de març de 1900: abans, Excel compta un 29 de febrer que no va existir. */
const PRIMER_SERIAL_FIABLE = 61;
const SEGONS_DIA = 86400;
const MS_DIA = 86400000;
const XF_CAPCALERA = 1;

/* Caràcters que XML 1.0 no admet: la definició és a model.js, que també els
   rebutja als noms de fulla. */
const NO_XML = CARACTERS_NO_XML;
const ESPAIS_A_PRESERVAR = /^\s|\s$|\s\s|[\t\n]/;

/* Text d'una cel·la: sense caràcters prohibits, salts LF, i cap «_xHHHH_»
   literal (Excel el llegiria com un caràcter: s'escriu «_x005F_xHHHH_»). */
const netejaText = (valor) => String(valor ?? '')
  .replace(NO_XML, '')
  .replace(/\r\n?/g, '\n')
  .replace(/_x([0-9A-Fa-f]{4})_/g, '_x005F_x$1_');

const escapa = (valor) => String(valor ?? '')
  .replace(NO_XML, '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* Caràcters → amplada d'Excel: la que mostra Excel quan s'hi escriuen eixos caràcters (10 → 10.7109375). */
const ampladaExcel = (caracters) => Math.trunc(((caracters * PIXELS_XIFRA + 5) / PIXELS_XIFRA) * 256) / 256;

/* Dies des del 30-12-1899: el número de sèrie d'Excel a partir de l'1-3-1900. */
function serialExcel(text) {
  const { any, mes, dia } = partsData(text);
  const data = new Date(0);
  data.setUTCFullYear(any, mes - 1, dia);
  const origen = new Date(0);
  origen.setUTCFullYear(1899, 11, 30);
  return Math.round((data.getTime() - origen.getTime()) / MS_DIA);
}

/* Taula de cadenes compartides, en l'ordre de la primera aparició. */
function taulaCadenes() {
  const indexs = new Map();
  let usos = 0;
  return {
    index(text) {
      usos += 1;
      if (!indexs.has(text)) indexs.set(text, indexs.size);
      return indexs.get(text);
    },
    xml() {
      const elements = [...indexs.keys()].map((text) => {
        const preserva = ESPAIS_A_PRESERVAR.test(text) ? ' xml:space="preserve"' : '';
        return `<si><t${preserva}>${escapa(text)}</t></si>`;
      });
      return `${DECLARACIO}<sst xmlns="${NS_MAIN}" count="${usos}" uniqueCount="${indexs.size}">${elements.join('')}</sst>`;
    }
  };
}

/* El format de nombre de cada tipus (null: el General). */
function codiFormat(columna) {
  switch (columna.tipus) {
    case 'nombre': return '0';
    case 'decimal': {
      const decimals = decimalsColumna(columna);
      return decimals === 0 ? '0' : `0.${'0'.repeat(decimals)}`;
    }
    case 'data': return 'dd/mm/yyyy';
    case 'hora': return 'hh:mm';
    case 'import': return '#,##0.00\\ "€"';
    default: return null;
  }
}

/* Registre d'estils: un xf per format usat; el 0 és el General i l'1, la capçalera. */
function registreEstils() {
  const formats = new Map();
  const xfs = [
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
  ];
  const perCodi = new Map();
  const formatId = (codi) => {
    if (FORMATS_PREDEFINITS.has(codi)) return FORMATS_PREDEFINITS.get(codi);
    if (!formats.has(codi)) formats.set(codi, PRIMER_FORMAT_PROPI + formats.size);
    return formats.get(codi);
  };
  return {
    perColumna(columna) {
      const codi = codiFormat(columna);
      if (codi === null) return 0;
      if (!perCodi.has(codi)) {
        xfs.push(`<xf numFmtId="${formatId(codi)}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`);
        perCodi.set(codi, xfs.length - 1);
      }
      return perCodi.get(codi);
    },
    xml() {
      const numFmts = [...formats].map(([codi, id]) => `<numFmt numFmtId="${id}" formatCode="${escapa(codi)}"/>`).join('');
      return [
        DECLARACIO,
        `<styleSheet xmlns="${NS_MAIN}">`,
        formats.size > 0 ? `<numFmts count="${formats.size}">${numFmts}</numFmts>` : '',
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>',
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>',
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>',
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
        `<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>`,
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
        '</styleSheet>'
      ].join('');
    }
  };
}

const celText = (ref, text, cadenes) => (text === '' ? '' : `<c r="${ref}" t="s"><v>${cadenes.index(text)}</v></c>`);

function celXml(valor, columna, ref, xf, cadenes, lloc) {
  const cela = valorCela(valor, columna, lloc);
  if (cela === null) return '';
  const numero = (v) => `<c r="${ref}"${xf ? ` s="${xf}"` : ''}><v>${v}</v></c>`;
  switch (cela.tipus) {
    case 'text': return celText(ref, netejaText(cela.valor), cadenes);
    case 'nombre': return numero(cela.valor);
    case 'decimal': return numero(String(cela.valor));
    case 'data': {
      const serial = serialExcel(cela.valor);
      /* Una data d'abans de l'1-3-1900 no té número de sèrie fiable: va com a text, i no es perd. */
      return serial >= PRIMER_SERIAL_FIABLE ? numero(serial) : celText(ref, dataLocal(cela.valor), cadenes);
    }
    case 'hora': return numero(String(cela.valor / SEGONS_DIA));
    case 'import': return numero(eurosExactes(cela.valor));
    default: return '';
  }
}

function fullaXml(fulla, posicio, cadenes, estils) {
  const columnes = fulla.columnes;
  const ultimaColumna = lletraColumna(columnes.length - 1);
  const xfs = columnes.map((columna) => estils.perColumna(columna));
  const capcalera = columnes
    .map((columna, j) => `<c r="${lletraColumna(j)}1" s="${XF_CAPCALERA}" t="s"><v>${cadenes.index(netejaText(columna.titol))}</v></c>`)
    .join('');
  let ultimaFila = 1;
  const files = fulla.files.map((fila, k) => {
    const r = k + 2;
    const celles = fila
      .map((valor, j) => celXml(valor, columnes[j], `${lletraColumna(j)}${r}`, xfs[j], cadenes, `fulla «${fulla.nom}», fila ${k + 1}`))
      .join('');
    if (celles === '') return '';
    ultimaFila = r;
    return `<row r="${r}">${celles}</row>`;
  }).join('');
  const rang = `A1:${ultimaColumna}${ultimaFila}`;
  const cols = columnes
    .map((columna, i) => `<col min="${i + 1}" max="${i + 1}" width="${ampladaExcel(ampladaColumna(columna))}" customWidth="1"/>`)
    .join('');
  const ambText = columnes.some((columna) => columna.tipus === 'text');
  return [
    DECLARACIO,
    `<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL_DOC}">`,
    `<dimension ref="${rang}"/>`,
    `<sheetViews><sheetView workbookViewId="0"${posicio === 0 ? ' tabSelected="1"' : ''}>`,
    '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>',
    '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>',
    '<sheetFormatPr defaultRowHeight="15"/>',
    `<cols>${cols}</cols>`,
    `<sheetData><row r="1">${capcalera}</row>${files}</sheetData>`,
    '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>',
    /* Un text fet de xifres («007») és text: sense el triangle verd d'Excel. */
    ambText ? `<ignoredErrors><ignoredError sqref="${rang}" numberStoredAsText="1"/></ignoredErrors>` : '',
    '</worksheet>'
  ].join('');
}

const relacio = (id, tipus, desti) => `<Relationship Id="${id}" Type="${tipus}" Target="${desti}"/>`;

function tipusXml(n) {
  const fulles = Array.from({ length: n }, (_, i) => (
    `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="${TIPUS_CONTINGUT}.spreadsheetml.worksheet+xml"/>`
  )).join('');
  return [
    DECLARACIO,
    `<Types xmlns="${NS_TIPUS}">`,
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    `<Override PartName="/xl/workbook.xml" ContentType="${TIPUS_CONTINGUT}.spreadsheetml.sheet.main+xml"/>`,
    fulles,
    `<Override PartName="/xl/styles.xml" ContentType="${TIPUS_CONTINGUT}.spreadsheetml.styles+xml"/>`,
    `<Override PartName="/xl/sharedStrings.xml" ContentType="${TIPUS_CONTINGUT}.spreadsheetml.sharedStrings+xml"/>`,
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    `<Override PartName="/docProps/app.xml" ContentType="${TIPUS_CONTINGUT}.extended-properties+xml"/>`,
    '</Types>'
  ].join('');
}

const RELS_XML = [
  DECLARACIO,
  `<Relationships xmlns="${NS_REL_PAQUET}">`,
  relacio('rId1', `${NS_REL_DOC}/officeDocument`, 'xl/workbook.xml'),
  relacio('rId2', REL_CORE, 'docProps/core.xml'),
  relacio('rId3', `${NS_REL_DOC}/extended-properties`, 'docProps/app.xml'),
  '</Relationships>'
].join('');

/* Propietats del document: només l'aplicació. Ni títol, ni autor, ni dates. */
const APP_XML = `${DECLARACIO}<Properties xmlns="${NS_APP}"><Application>${APLICACIO}</Application></Properties>`;
const CORE_XML = `${DECLARACIO}<cp:coreProperties xmlns:cp="${NS_CORE}"/>`;

function relsLlibreXml(n) {
  const fulles = Array.from({ length: n }, (_, i) => relacio(`rId${i + 1}`, `${NS_REL_DOC}/worksheet`, `worksheets/sheet${i + 1}.xml`));
  return [
    DECLARACIO,
    `<Relationships xmlns="${NS_REL_PAQUET}">`,
    ...fulles,
    relacio(`rId${n + 1}`, `${NS_REL_DOC}/styles`, 'styles.xml'),
    relacio(`rId${n + 2}`, `${NS_REL_DOC}/sharedStrings`, 'sharedStrings.xml'),
    '</Relationships>'
  ].join('');
}

const llibreXml = (fulles) => [
  DECLARACIO,
  `<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL_DOC}">`,
  '<bookViews><workbookView activeTab="0"/></bookViews><sheets>',
  ...fulles.map((fulla, i) => `<sheet name="${escapa(fulla.nom)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`),
  '</sheets></workbook>'
].join('');

/**
 * El model sencer com a fitxer .xlsx.
 * @param {{ fulles: Array<{ nom: string, columnes: Array<{ titol: string, tipus: string, amplada?: number, decimals?: number }>, files: unknown[][] }> }} model
 * @returns {Uint8Array}
 */
export function creaXlsx(model) {
  comprovaModel(model);
  const cadenes = taulaCadenes();
  const estils = registreEstils();
  const fulles = model.fulles.map((fulla, i) => fullaXml(fulla, i, cadenes, estils));
  const n = fulles.length;
  const parts = [
    ['[Content_Types].xml', tipusXml(n)],
    ['_rels/.rels', RELS_XML],
    ['docProps/app.xml', APP_XML],
    ['docProps/core.xml', CORE_XML],
    ['xl/workbook.xml', llibreXml(model.fulles)],
    ['xl/_rels/workbook.xml.rels', relsLlibreXml(n)],
    ['xl/styles.xml', estils.xml()],
    ['xl/sharedStrings.xml', cadenes.xml()],
    ...fulles.map((xml, i) => [`xl/worksheets/sheet${i + 1}.xml`, xml])
  ];
  const codificador = new TextEncoder();
  return creaZip(parts.map(([nom, xml]) => ({ nom, dades: codificador.encode(xml) })));
}
