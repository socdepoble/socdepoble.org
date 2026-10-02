/**
 * xlsx.js — un full maquetat (maquetaFull, a fullModel.js) com a llibre d'Excel.
 *
 * Una sola fulla amb les cel·les, les combinacions i les amplades del full
 * maquetat. El text va a la taula de cadenes compartides (xl/sharedStrings.xml),
 * la forma que lligen tots els visors (Excel, LibreOffice, Numbers i les vistes
 * prèvies del mòbil), i els zeros a l'esquerra es conserven perquè el text és
 * text. Dates com a número de sèrie, imports en euros exactes (sense coma
 * flotant) i totals amb la fórmula i el valor ja calculat, perquè els visors
 * que no recalculen també mostren la xifra. styles.xml naix només dels estils
 * que fa servir el full, amb els apply* de cada propietat (LibreOffice no
 * aplica la que no el porta). Les propietats del document no porten dates ni
 * dades personals, i el ZIP té data fixa: la mateixa entrada dona els mateixos
 * bytes. JS pur: sense DOM ni React.
 *
 * Ordre dels elements (ECMA-376, part 1, §18.3.1.99 i §18.8.39):
 *   <worksheet>  sheetPr, dimension, sheetViews, sheetFormatPr, cols, sheetData,
 *                mergeCells, pageMargins, pageSetup, ignoredErrors
 *   <styleSheet> numFmts, fonts, fills, borders, cellStyleXfs, cellXfs, cellStyles
 */
import { esDataValida, formatData, serialExcel } from './dates.js';
import { lletraColumna } from './fullModel.js';
import { creaZip } from './zip.js';

const DECLARACIO = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n';
const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_REL_DOC = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_REL_PAQUET = 'http://schemas.openxmlformats.org/package/2006/relationships';
const TIPUS_CONTINGUT = 'application/vnd.openxmlformats-officedocument';
const APLICACIO = 'Sóc de Poble';

const HORITZONTAL = Object.freeze({ esquerra: 'left', centre: 'center', dreta: 'right' });
const VERTICAL = Object.freeze({ dalt: 'top', centre: 'center', baix: 'bottom' });
/* Formats que Excel ja porta (ECMA-376, §18.8.30): no es declaren a numFmts. */
const FORMATS_PREDEFINITS = new Map([['General', 0], ['0', 1], ['0.00', 2], ['#,##0', 3], ['#,##0.00', 4], ['0%', 9], ['0.00%', 10], ['@', 49]]);
const PRIMER_FORMAT_PROPI = 164;
/* Píxels de la xifra més ampla d'Arial 10 i de Calibri 11, la base de les amplades (ECMA-376, §18.3.1.13). */
const PIXELS_XIFRA = 7;
/* El número de sèrie 61 és l'1 de març de 1900: abans, Excel compta un 29 de febrer que no va existir. */
const PRIMER_SERIAL_FIABLE = 61;
const FONT_PER_DEFECTE = Object.freeze({ nom: 'Calibri', mida: 11 });
const ALT_FILA_PER_DEFECTE = 15;

/* Caràcters que XML 1.0 no admet (també els suplents solts, gràcies a la bandera u). */
const NO_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿\uD800-\uDFFF]/gu;
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

/* Cèntims com a decimal exacte, sense passar per coma flotant: 123456 → «1234.56». */
function euros(cents) {
  const abs = Math.abs(cents);
  const decimals = abs % 100;
  const enter = (abs - decimals) / 100;
  const text = decimals === 0 ? String(enter) : `${enter}.${String(decimals).padStart(2, '0')}`.replace(/0$/, '');
  return cents < 0 ? `-${text}` : text;
}

/* Caràcters → amplada d'Excel: la que mostra Excel quan s'hi escriuen eixos caràcters (10 → 10.7109375). */
const ampladaExcel = (caracters) => Math.trunc(((caracters * PIXELS_XIFRA + 5) / PIXELS_XIFRA) * 256) / 256;

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

const FONS_CAP = '<fill><patternFill patternType="none"/></fill>';
const FONS_GRIS125 = '<fill><patternFill patternType="gray125"/></fill>';
const fonsXml = (argb) => `<fill><patternFill patternType="solid"><fgColor rgb="${escapa(argb)}"/><bgColor indexed="64"/></patternFill></fill>`;
const VORA_CAP = '<border><left/><right/><top/><bottom/><diagonal/></border>';
const VORA_FINA = `<border>${['left', 'right', 'top', 'bottom'].map((costat) => `<${costat} style="thin"><color auto="1"/></${costat}>`).join('')}<diagonal/></border>`;
const XF_PER_DEFECTE = '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>';

/* Mateix ordre de fills que escriu Excel: negreta, mida, color i nom. */
function fontXml(font, definicio) {
  const color = definicio.colorLletra ? `<color rgb="${escapa(definicio.colorLletra)}"/>` : '';
  return `<font>${definicio.negreta ? '<b/>' : ''}<sz val="${font.mida}"/>${color}<name val="${escapa(font.nom)}"/></font>`;
}

function alineacioXml(definicio) {
  const atributs = [
    HORITZONTAL[definicio.alineacio] ? ` horizontal="${HORITZONTAL[definicio.alineacio]}"` : '',
    VERTICAL[definicio.vertical] ? ` vertical="${VERTICAL[definicio.vertical]}"` : '',
    definicio.ajust ? ' wrapText="1"' : ''
  ].join('');
  return atributs ? `<alignment${atributs}/>` : '';
}

/* Registre d'estils: cada nom usat es convertix en un xf de cellXfs; fonts, fons, vores i formats es comparteixen. */
function registreEstils(maquetat, font) {
  const estils = maquetat.estils ?? {};
  const fonts = [fontXml(font, {})];
  const fons = [FONS_CAP, FONS_GRIS125];
  const vores = [VORA_CAP];
  const formats = new Map();
  const xfs = [XF_PER_DEFECTE];
  const perNom = new Map();
  const posicioDe = (llista, xml) => {
    const i = llista.indexOf(xml);
    if (i >= 0) return i;
    llista.push(xml);
    return llista.length - 1;
  };
  const formatId = (codi) => {
    if (codi == null || codi === '') return 0;
    if (FORMATS_PREDEFINITS.has(codi)) return FORMATS_PREDEFINITS.get(codi);
    if (!formats.has(codi)) formats.set(codi, PRIMER_FORMAT_PROPI + formats.size);
    return formats.get(codi);
  };
  const xfDe = (definicio) => {
    const numFmtId = formatId(definicio.numFmt);
    const fontId = posicioDe(fonts, fontXml(font, definicio));
    const fillId = definicio.fons ? posicioDe(fons, fonsXml(definicio.fons)) : 0;
    const borderId = definicio.vora === 'fina' ? posicioDe(vores, VORA_FINA) : 0;
    const alineacio = alineacioXml(definicio);
    const aplica = [
      numFmtId && 'applyNumberFormat', fontId && 'applyFont', fillId && 'applyFill', borderId && 'applyBorder', alineacio && 'applyAlignment'
    ].filter(Boolean).map((atribut) => ` ${atribut}="1"`).join('');
    const obertura = `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0"${aplica}`;
    return posicioDe(xfs, alineacio ? `${obertura}>${alineacio}</xf>` : `${obertura}/>`);
  };
  return {
    index(nom) {
      if (nom == null) return 0;
      if (!perNom.has(nom)) {
        if (!Object.prototype.hasOwnProperty.call(estils, nom)) throw new TypeError(`El full maquetat no té l'estil «${nom}».`);
        perNom.set(nom, xfDe(estils[nom] ?? {}));
      }
      return perNom.get(nom);
    },
    xml() {
      const numFmts = [...formats].map(([codi, id]) => `<numFmt numFmtId="${id}" formatCode="${escapa(codi)}"/>`).join('');
      return [
        DECLARACIO,
        `<styleSheet xmlns="${NS_MAIN}">`,
        formats.size > 0 ? `<numFmts count="${formats.size}">${numFmts}</numFmts>` : '',
        `<fonts count="${fonts.length}">${fonts.join('')}</fonts>`,
        `<fills count="${fons.length}">${fons.join('')}</fills>`,
        `<borders count="${vores.length}">${vores.join('')}</borders>`,
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
        `<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>`,
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
        '</styleSheet>'
      ].join('');
    }
  };
}

const TIPUS_CELLA = new Set(['text', 'data', 'import']);

function celXml(cel, ref, cadenes, estils) {
  if (!cel) return '';
  if (!TIPUS_CELLA.has(cel.tipus)) throw new TypeError(`Tipus de cel·la desconegut a ${ref}: ${cel.tipus}`);
  const s = estils.index(cel.estil);
  const obertura = `<c r="${ref}"${s ? ` s="${s}"` : ''}`;
  const formula = cel.formula ? `<f>${escapa(cel.formula)}</f>` : '';
  let text = null;
  if (cel.tipus === 'data' && esDataValida(cel.valor)) {
    const serial = serialExcel(cel.valor);
    if (serial >= PRIMER_SERIAL_FIABLE) return `${obertura}><v>${serial}</v></c>`;
    /* Una data d'abans de 1900 no té número de sèrie fiable: va com a text, i no es perd. */
    text = formatData(cel.valor);
  } else if (cel.tipus === 'import' && Number.isSafeInteger(cel.valor)) {
    return `${obertura}>${formula}<v>${euros(cel.valor)}</v></c>`;
  } else if (cel.tipus === 'text' && cel.valor != null) {
    text = netejaText(cel.valor);
  }
  if (text) return `${obertura} t="s"><v>${cadenes.index(text)}</v></c>`;
  if (formula) return `${obertura}>${formula}</c>`;
  return s ? `${obertura}/>` : '';
}

function fullaXml(maquetat, cadenes, estils) {
  const n = maquetat.columnes.length;
  let ultimaFila = 0;
  const files = maquetat.files.map((fila, i) => {
    const r = i + 1;
    const celles = (fila?.celles ?? []).slice(0, n).map((cel, j) => celXml(cel, `${lletraColumna(j)}${r}`, cadenes, estils)).join('');
    if (celles === '') return '';
    ultimaFila = r;
    return `<row r="${r}">${celles}</row>`;
  }).join('');
  const rang = ultimaFila > 0 ? `A1:${lletraColumna(n - 1)}${ultimaFila}` : 'A1';
  const altFila = typeof maquetat.altFila === 'number' && maquetat.altFila > 0 ? maquetat.altFila : ALT_FILA_PER_DEFECTE;
  const cols = maquetat.columnes
    .map((columna, i) => `<col min="${i + 1}" max="${i + 1}" width="${ampladaExcel(columna.amplada)}" customWidth="1"/>`)
    .join('');
  const combinacions = maquetat.combinacions ?? [];
  return [
    DECLARACIO,
    `<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL_DOC}">`,
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>',
    `<dimension ref="${rang}"/>`,
    '<sheetViews><sheetView tabSelected="1" workbookViewId="0"/></sheetViews>',
    `<sheetFormatPr defaultRowHeight="${altFila}"/>`,
    `<cols>${cols}</cols>`,
    files === '' ? '<sheetData/>' : `<sheetData>${files}</sheetData>`,
    combinacions.length > 0
      ? `<mergeCells count="${combinacions.length}">${combinacions.map((ref) => `<mergeCell ref="${escapa(ref)}"/>`).join('')}</mergeCells>`
      : '',
    '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>',
    '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>',
    /* Núm i NIF són text encara que semblen números: sense el triangle verd d'Excel. */
    ultimaFila > 0 ? `<ignoredErrors><ignoredError sqref="${rang}" numberStoredAsText="1"/></ignoredErrors>` : '',
    '</worksheet>'
  ].join('');
}

const TIPUS_XML = [
  DECLARACIO,
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
  '<Default Extension="xml" ContentType="application/xml"/>',
  `<Override PartName="/xl/workbook.xml" ContentType="${TIPUS_CONTINGUT}.spreadsheetml.sheet.main+xml"/>`,
  `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="${TIPUS_CONTINGUT}.spreadsheetml.worksheet+xml"/>`,
  `<Override PartName="/xl/styles.xml" ContentType="${TIPUS_CONTINGUT}.spreadsheetml.styles+xml"/>`,
  `<Override PartName="/xl/sharedStrings.xml" ContentType="${TIPUS_CONTINGUT}.spreadsheetml.sharedStrings+xml"/>`,
  '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
  `<Override PartName="/docProps/app.xml" ContentType="${TIPUS_CONTINGUT}.extended-properties+xml"/>`,
  '</Types>'
].join('');

const relacio = (id, tipus, desti) => `<Relationship Id="${id}" Type="${tipus}" Target="${desti}"/>`;

const RELS_XML = [
  DECLARACIO,
  `<Relationships xmlns="${NS_REL_PAQUET}">`,
  relacio('rId1', `${NS_REL_DOC}/officeDocument`, 'xl/workbook.xml'),
  relacio('rId2', 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', 'docProps/core.xml'),
  relacio('rId3', `${NS_REL_DOC}/extended-properties`, 'docProps/app.xml'),
  '</Relationships>'
].join('');

const RELS_LLIBRE_XML = [
  DECLARACIO,
  `<Relationships xmlns="${NS_REL_PAQUET}">`,
  relacio('rId1', `${NS_REL_DOC}/worksheet`, 'worksheets/sheet1.xml'),
  relacio('rId2', `${NS_REL_DOC}/styles`, 'styles.xml'),
  relacio('rId3', `${NS_REL_DOC}/sharedStrings`, 'sharedStrings.xml'),
  '</Relationships>'
].join('');

/* Propietats del document: només l'aplicació. Ni títol, ni autor, ni dates. */
const APP_XML = [
  DECLARACIO,
  '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"',
  ' xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">',
  `<Application>${APLICACIO}</Application>`,
  '</Properties>'
].join('');

const CORE_XML = [
  DECLARACIO,
  '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"',
  ' xmlns:dc="http://purl.org/dc/elements/1.1/">',
  `<dc:creator>${APLICACIO}</dc:creator>`,
  '</cp:coreProperties>'
].join('');

const llibreXml = (nomFulla) => [
  DECLARACIO,
  `<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL_DOC}">`,
  `<bookViews><workbookView/></bookViews><sheets><sheet name="${escapa(nomFulla)}" sheetId="1" r:id="rId1"/></sheets>`,
  '</workbook>'
].join('');

/**
 * El full maquetat com a fitxer .xlsx.
 * @param {object} maquetat el de maquetaFull
 * @returns {Uint8Array}
 */
export function fullAXlsx(maquetat) {
  if (!maquetat || !Array.isArray(maquetat.files) || !Array.isArray(maquetat.columnes) || maquetat.columnes.length === 0) {
    throw new TypeError('fullAXlsx espera un full maquetat (el de maquetaFull).');
  }
  const font = maquetat.font && typeof maquetat.font.nom === 'string' && maquetat.font.mida > 0 ? maquetat.font : FONT_PER_DEFECTE;
  const nomFulla = typeof maquetat.nomFulla === 'string' && maquetat.nomFulla.trim() !== '' ? maquetat.nomFulla : 'Full';
  const cadenes = taulaCadenes();
  const estils = registreEstils(maquetat, font);
  const fulla = fullaXml(maquetat, cadenes, estils);
  const parts = [
    ['[Content_Types].xml', TIPUS_XML],
    ['_rels/.rels', RELS_XML],
    ['docProps/app.xml', APP_XML],
    ['docProps/core.xml', CORE_XML],
    ['xl/workbook.xml', llibreXml(nomFulla)],
    ['xl/_rels/workbook.xml.rels', RELS_LLIBRE_XML],
    ['xl/styles.xml', estils.xml()],
    ['xl/sharedStrings.xml', cadenes.xml()],
    ['xl/worksheets/sheet1.xml', fulla]
  ];
  const codificador = new TextEncoder();
  return creaZip(parts.map(([nom, xml]) => ({ nom, dades: codificador.encode(xml) })));
}
