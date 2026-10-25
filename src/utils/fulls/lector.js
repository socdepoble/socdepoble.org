/**
 * lector.js — llig un llibre XLSX (Excel, LibreOffice o Numbers) i en torna
 * les fulles amb les cel·les tipades. És el camí de tornada de xlsx.js.
 *
 *   llegixLlibre(bytes) → {
 *     date1904: false,
 *     fulles: [{
 *       nom: 'Diari',
 *       combinacions: [{ ref: 'B1:E1', fila: 1, col: 1, filaFi: 1, colFi: 4 }],
 *       celles: [{ fila: 3, col: 0, ref: 'A3', tipus: 'hora', valor: '07:00', formula: null, format: 'h:mm' }]
 *     }]
 *   }
 *
 * `fila` és el número de fila del full (des d'1) i `col`, l'índex de la
 * columna des de 0 (A = 0), el mateix de model.js · lletraColumna.
 * Les cel·les van en l'ordre del fitxer i hi són totes les que porta, també
 * les buides amb format (el camp per omplir d'una plantilla). Tipus i valor:
 *   text       cadena (cadenes compartides amb text enriquit, inlineStr, str)
 *   nombre     número
 *   data       'AAAA-MM-DD'
 *   hora       'HH:MM' o 'HH:MM:SS'; sense la part de data, si en porta
 *              (Numbers en posa una a les hores). Amb un format de temps
 *              transcorregut ([h]:mm) les hores poden passar de 23.
 *   data-hora  'AAAA-MM-DDTHH:MM' o 'AAAA-MM-DDTHH:MM:SS'
 *   boolea     true o false
 *   error      el codi d'Excel ('#DIV/0!', '#N/A'…)
 *   buit       null
 * Una data o una hora és un número amb un format de data o d'hora: els
 * predefinits 14–22 i 45–47 o un de propi. `date1904` diu el sistema de dates
 * del llibre (Numbers i l'Excel antic de Mac fan servir el de 1904); les
 * dates ja ixen convertides. `formula` és el text de la fórmula sense «=»
 * (null si no n'hi ha) i `valor`, el resultat que el full va guardar: el
 * lector no calcula res. Una fórmula compartida es reconstruïx des de la seua
 * cel·la mestra; si no es pot, `formula` és ''. `format` és el codi del format
 * de nombre ('General', 'h:mm', 'dd/mm/yy'…).
 *
 * Només es descomprimix el que diuen les relacions del paquet: el llibre, les
 * fulles de treball, les cadenes compartides i els estils. Les imatges, els
 * gràfics, els dibuixos i les propietats del document (autor, dates) no es
 * lligen mai. Les relacions es reconeixen pel final del seu tipus
 * ('/worksheet', '/styles'…), que val per a l'OOXML de transició i l'estricte.
 * Límits: 20 MiB de fitxer, 64 MiB d'XML descomprimit i 200.000 cel·les.
 * XML sense DOM: expressions regulars sobre un format que escriuen màquines,
 * amb el prefix d'espai de noms opcional. Deute declarat: amb un XML malmés a
 * propòsit (moltes etiquetes <c>, <si> o <v> sense tancar) el temps d'anàlisi
 * creix amb el quadrat de la part, i cap dels límits l'atura; cal un
 * analitzador per posicions (indexOf). JS pur: sense DOM ni React.
 */
import { lletraColumna, partsData } from './model.js';
import { llegeixZip } from './zip.js';

const LIMIT_BYTES = 20 * 1024 * 1024;
const LIMIT_EIXIDA = 64 * 1024 * 1024;
const LIMIT_CELLES = 200000;
const MAX_FILES_FULL = 1048576;
const MAX_COLUMNES_FULL = 16384;
const SEGONS_DIA = 86400;
const MS_DIA = 86400000;
/* Dies del 30-12-1899 (l'origen dels números de sèrie) a l'1-1-1904 (el dia 0 del sistema de 1904). */
const DIES_1904 = 1462;
/* L'últim dia que entén un full: el 31-12-9999. */
const MAX_DIES = 2958465;
const LLIBRE_PER_DEFECTE = 'xl/workbook.xml';

/* Formats de nombre que porta el full sense declarar-los (ECMA-376, part 1, §18.8.30). */
const FORMATS_PREDEFINITS = new Map([
  [0, 'General'], [1, '0'], [2, '0.00'], [3, '#,##0'], [4, '#,##0.00'], [9, '0%'], [10, '0.00%'], [11, '0.00E+00'],
  [12, '# ?/?'], [13, '# ??/??'], [14, 'mm-dd-yy'], [15, 'd-mmm-yy'], [16, 'd-mmm'], [17, 'mmm-yy'],
  [18, 'h:mm AM/PM'], [19, 'h:mm:ss AM/PM'], [20, 'h:mm'], [21, 'h:mm:ss'], [22, 'm/d/yy h:mm'],
  [37, '#,##0 ;(#,##0)'], [38, '#,##0 ;[Red](#,##0)'], [39, '#,##0.00;(#,##0.00)'], [40, '#,##0.00;[Red](#,##0.00)'],
  [45, 'mm:ss'], [46, '[h]:mm:ss'], [47, 'mmss.0'], [48, '##0.0E+0'], [49, '@']
]);

const ENTITATS = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'' });

/* ── XML mínim ─────────────────────────────────────────────────────────── */

/* Les entitats d'XML: les cinc predefinides i les numèriques. */
function desescapa(text) {
  if (!text.includes('&')) return text;
  return text.replace(/&(#[xX][0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (sencer, nom) => {
    if (nom[0] !== '#') return ENTITATS[nom];
    const punt = nom[1] === 'x' || nom[1] === 'X' ? parseInt(nom.slice(2), 16) : Number(nom.slice(1));
    return punt <= 0x10ffff ? String.fromCodePoint(punt) : sencer;
  });
}

/* El text d'un element <t>: les entitats, les seccions CDATA i, després, els
   escapaments «_xHHHH_» d'OOXML (un «_x005F_» davant és un «_» literal). */
function textOoxml(cru) {
  const pla = cru.includes('<![CDATA[')
    ? cru.split(/<!\[CDATA\[([\s\S]*?)\]\]>/).map((tros, i) => (i % 2 === 1 ? tros : desescapa(tros))).join('')
    : desescapa(cru);
  return pla.includes('_x') ? pla.replace(/_x([0-9A-Fa-f]{4})_/g, (sencer, hex) => String.fromCharCode(parseInt(hex, 16))) : pla;
}

const CARACTER_NOM = /[\w:.-]/;
const BLANC = /\s/;

/* Els atributs d'una etiqueta, pel nom sencer i pel nom local (r:id → id).
   Gauntlet 261025_0545 (RX-M4) · Un recorregut per posicions que casa el
   mateix que /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g: l'expressió, dins
   d'una etiqueta amb una tira llarga de caràcters de nom i cap «=», tornava a
   recórrer la tira des de cada posició (quadràtic). Un nom sense «=» i una
   cometa darrere, o amb la cometa sense tancar, no casa des de cap punt de la
   seua tira: es bota sencer. S'exporta per a la prova diferencial; index.js
   no la reexporta. */
export function atributs(text) {
  const resultat = Object.create(null);
  let i = 0;
  while (i < text.length) {
    if (!CARACTER_NOM.test(text[i])) { i += 1; continue; }
    let fiNom = i;
    while (fiNom < text.length && CARACTER_NOM.test(text[fiNom])) fiNom += 1;
    let j = fiNom;
    while (j < text.length && BLANC.test(text[j])) j += 1;
    let tanca = -1;
    if (text[j] === '=') {
      j += 1;
      while (j < text.length && BLANC.test(text[j])) j += 1;
      if (text[j] === '"' || text[j] === '\'') tanca = text.indexOf(text[j], j + 1);
    }
    if (tanca === -1) { i = fiNom; continue; }
    const nom = text.slice(i, fiNom);
    const valor = desescapa(text.slice(j + 1, tanca));
    resultat[nom] = valor;
    const local = nom.slice(nom.indexOf(':') + 1);
    if (!(local in resultat)) resultat[local] = valor;
    i = tanca + 1;
  }
  return resultat;
}

/* El text de text enriquit (<si>, <is>): els <t> seguits, sense la fonètica (<rPh>). */
function textRic(xml) {
  const net = xml.includes('rPh') ? xml.replace(/<(?:\w+:)?rPh\b[\s\S]*?<\/(?:\w+:)?rPh>/g, '') : xml;
  let text = '';
  for (const m of net.matchAll(/<(?:\w+:)?t\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?t>)/g)) text += textOoxml(m[1] ?? '');
  return text;
}

/* Bytes d'una part com a text: UTF-8, o UTF-16 si porta el seu BOM; sense comentaris d'XML. */
function textDe(bytes) {
  const codificacio = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' : bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : 'utf-8';
  const text = new TextDecoder(codificacio).decode(bytes);
  return text.includes('<!--') ? text.replace(/<!--[\s\S]*?-->/g, '') : text;
}

/* ── El paquet: relacions i parts ──────────────────────────────────────── */

/* La part a què apunta un destí, relatiu a la carpeta de la part `base` ('' és l'arrel del paquet). */
function resolDesti(base, desti) {
  const absolut = desti.startsWith('/');
  const parts = absolut ? [] : base.split('/').slice(0, -1);
  for (const tros of (absolut ? desti.slice(1) : desti).split('/')) {
    if (tros === '..') parts.pop();
    else if (tros !== '.' && tros !== '') parts.push(tros);
  }
  return parts.join('/');
}

/* On són les relacions d'una part: xl/workbook.xml → xl/_rels/workbook.xml.rels. */
function relsDe(part) {
  const tall = part.lastIndexOf('/') + 1;
  return `${part.slice(0, tall)}_rels/${part.slice(tall)}.rels`;
}

/* Les relacions internes d'una part, amb el destí ja resolt. */
function relacions(xml, base) {
  const llista = [];
  for (const m of (xml ?? '').matchAll(/<(?:\w+:)?Relationship\b([^>]*?)\/?>/g)) {
    const a = atributs(m[1]);
    if (a.TargetMode === 'External' || !a.Target) continue;
    llista.push({ id: a.Id, tipus: a.Type ?? '', desti: resolDesti(base, a.Target) });
  }
  return llista;
}

const esDeTipus = (relacio, tipus) => relacio.tipus.endsWith(`/${tipus}`);

/* Llig del ZIP només les parts demanades (els noms de part no distingixen
   majúscules) i descompta el que ocupen del pressupost d'eixida. Si el
   pressupost no hi arriba, el missatge diu el límit del llibre, no el que en
   quedava ni el nom de la part. */
function llegixParts(bytes, noms, pressupost) {
  const volgudes = new Set(noms.map((nom) => nom.toLowerCase()));
  let llegides;
  try {
    llegides = llegeixZip(bytes, { nomes: (nom) => volgudes.has(nom.toLowerCase()), maxEixida: pressupost.resta });
  } catch (e) {
    if (!(e instanceof RangeError)) throw e;
    throw new RangeError(`El llibre descomprimit passa de ${textMida(pressupost.limit)}: és massa gran per a llegir-lo ací.`, { cause: e });
  }
  const parts = new Map();
  for (const { nom, dades } of llegides) {
    pressupost.resta -= dades.length;
    parts.set(nom.toLowerCase(), textDe(dades));
  }
  return (nom) => parts.get(nom.toLowerCase()) ?? null;
}

/* ── Formats de nombre ─────────────────────────────────────────────────── */

/* data · hora · data-hora · text · nombre, a partir del codi d'un format propi.
   Fora: el text entre cometes, els caràcters escapats, els de farciment
   (_x, *x) i els claudàtors que no són de temps transcorregut ([Red], [$-403]…);
   només compta la primera secció. Una «m» sense hores ni segons és el mes. */
function classeDeCodi(codi) {
  const net = codi
    .replace(/"[^"]*"/g, '')
    .replace(/\\./g, '')
    .replace(/[_*]./g, '')
    .replace(/\[(?![hms]+\])[^\]]*\]/gi, '')
    .split(';')[0]
    .toLowerCase()
    .trim();
  if (net === '' || net === 'general') return 'nombre';
  const teHora = /[hs]/.test(net);
  const teData = /[dy]/.test(net) || (!teHora && /m/.test(net) && !/[0#?]/.test(net));
  if (teData && teHora) return 'data-hora';
  if (teData) return 'data';
  if (teHora) return 'hora';
  return net.includes('@') ? 'text' : 'nombre';
}

function classePredefinida(id) {
  if (id >= 14 && id <= 17) return 'data';
  if ((id >= 18 && id <= 21) || (id >= 45 && id <= 47)) return 'hora';
  if (id === 22) return 'data-hora';
  return id === 49 ? 'text' : 'nombre';
}

/* Els formats del full: per a cada estil de cel·la (cellXfs), el codi i la
   classe. Els formats propis són només els del bloc <numFmts>: els dels
   formats condicionals (<dxfs>) poden repetir un numFmtId amb un altre codi. */
function estils(xml) {
  const propis = new Map();
  const perEstil = [];
  if (!xml) return perEstil;
  const formats = /<(?:\w+:)?numFmts\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?numFmts>)/.exec(xml);
  for (const m of (formats?.[1] ?? '').matchAll(/<(?:\w+:)?numFmt\b([^>]*?)\/?>/g)) {
    const a = atributs(m[1]);
    const id = Number(a.numFmtId);
    if (Number.isInteger(id) && typeof a.formatCode === 'string') propis.set(id, a.formatCode);
  }
  const bloc = /<(?:\w+:)?cellXfs\b[^>]*>([\s\S]*?)<\/(?:\w+:)?cellXfs>/.exec(xml);
  for (const m of bloc ? bloc[1].matchAll(/<(?:\w+:)?xf\b([^>]*?)\/?>/g) : []) {
    const id = Number(atributs(m[1]).numFmtId ?? 0);
    if (propis.has(id)) perEstil.push({ codi: propis.get(id), classe: classeDeCodi(propis.get(id)) });
    else perEstil.push({ codi: FORMATS_PREDEFINITS.get(id) ?? 'General', classe: classePredefinida(id) });
  }
  return perEstil;
}

const GENERAL = Object.freeze({ codi: 'General', classe: 'nombre' });

/* ── Números de sèrie: dates i hores ───────────────────────────────────── */

const dosXifres = (n) => String(n).padStart(2, '0');
/* [h]:mm, [mm]:ss…: temps transcorregut, que no torna a zero a mitjanit. */
const TRANSCORREGUT = /\[[hms]+\]/i;

function textHora(segons) {
  const hhmm = `${dosXifres(Math.floor(segons / 3600))}:${dosXifres(Math.floor((segons % 3600) / 60))}`;
  return segons % 60 === 0 ? hhmm : `${hhmm}:${dosXifres(segons % 60)}`;
}

/* 'AAAA-MM-DD' del dia `dies` del sistema de dates del llibre, o null si no
   és cap dia. En el sistema de 1900 el dia 1 és l'1-1-1900 i el 60, el
   29-2-1900 que el full compta i no va existir (com el dia 0): cap dels dos
   és una data. */
function dataDeDies(dies, date1904) {
  let desDelOrigen;
  if (date1904) desDelOrigen = dies + DIES_1904;
  else if (dies >= 61) desDelOrigen = dies;
  else if (dies >= 1 && dies < 60) desDelOrigen = dies + 1;
  else return null;
  if (desDelOrigen < 0 || desDelOrigen > MAX_DIES) return null;
  const data = new Date(Date.UTC(1899, 11, 30) + desDelOrigen * MS_DIA);
  return `${String(data.getUTCFullYear()).padStart(4, '0')}-${dosXifres(data.getUTCMonth() + 1)}-${dosXifres(data.getUTCDate())}`;
}

/* Un número segons la classe del seu format. Primer s'arredonix al segon (un
   45000,99999999997 és el dia 45001 amb soroll de coma flotant); una data pren
   el dia i una hora, la part del dia. Un número que no és cap data ni cap hora
   (negatiu, fora de rang) es queda com a nombre. */
function deNumero(n, format, date1904) {
  const { classe, codi } = format;
  if (n >= 0 && (classe === 'data' || classe === 'hora' || classe === 'data-hora')) {
    const totals = Math.round(n * SEGONS_DIA);
    const dies = Math.floor(totals / SEGONS_DIA);
    const segons = totals - dies * SEGONS_DIA;
    if (classe === 'hora') return { tipus: 'hora', valor: textHora(TRANSCORREGUT.test(codi) ? totals : segons) };
    const data = dataDeDies(dies, date1904);
    if (classe === 'data' && data !== null) return { tipus: 'data', valor: data };
    if (classe === 'data-hora') return data === null ? { tipus: 'hora', valor: textHora(segons) } : { tipus: 'data-hora', valor: `${data}T${textHora(segons)}` };
  }
  return { tipus: 'nombre', valor: n };
}

/* Una cel·la t="d" (data ISO 8601, poc freqüent) segons la classe del seu
   format; amb un format de data-hora, és data-hora també a mitjanit, com un
   número de sèrie. */
function deIso(text, classe) {
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(text);
  if (!m || !partsData(m[1])) return { tipus: 'text', valor: text };
  const segons = Number(m[2] ?? 0) * 3600 + Number(m[3] ?? 0) * 60 + Number(m[4] ?? 0);
  if (classe === 'hora') return { tipus: 'hora', valor: textHora(segons) };
  if (classe === 'data' || (classe !== 'data-hora' && segons === 0)) return { tipus: 'data', valor: m[1] };
  return { tipus: 'data-hora', valor: `${m[1]}T${textHora(segons)}` };
}

/* ── Referències i fórmules ────────────────────────────────────────────── */

function indexColumna(lletres) {
  let n = 0;
  for (const c of lletres.toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/* 'B3' o '$B$3' → { fila: 3, col: 1 }, o null si no és una cel·la del full. */
function cellaDe(ref) {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d{1,7})$/.exec(ref ?? '');
  if (!m) return null;
  const col = indexColumna(m[1]);
  const fila = Number(m[2]);
  return col < MAX_COLUMNES_FULL && fila >= 1 && fila <= MAX_FILES_FULL ? { fila, col } : null;
}

/* 'B1:E1' → { ref, fila, col, filaFi, colFi }, amb l'inici a dalt a l'esquerra. */
function rangDe(ref) {
  const [primera, segona = primera] = String(ref ?? '').split(':');
  const a = cellaDe(primera);
  const b = cellaDe(segona);
  if (!a || !b) return null;
  const r = { fila: Math.min(a.fila, b.fila), col: Math.min(a.col, b.col), filaFi: Math.max(a.fila, b.fila), colFi: Math.max(a.col, b.col) };
  return { ref: `${lletraColumna(r.col)}${r.fila}:${lletraColumna(r.colFi)}${r.filaFi}`, ...r };
}

/* Un literal de text, un nom de full entre cometes simples o una referència
   A1 (amb el caràcter de davant, que no pot ser part d'un nom: res de
   lookbehind, fora de la Baseline). */
const PECA_FORMULA = /"(?:[^"]|"")*"|'(?:[^']|'')*'|(^|[^A-Za-z0-9_.$])(\$?)([A-Z]{1,3})(\$?)(\d+)(?![A-Za-z0-9_(])/g;

/* La fórmula de la cel·la mestra d'una fórmula compartida, moguda `dFiles` i
   `dColumnes`: les referències relatives es mouen i les absolutes ($), no. Una
   referència que ix del full és #REF!, com fa el full. */
function desplacaFormula(formula, dFiles, dColumnes) {
  return formula.replace(PECA_FORMULA, (sencer, davant, absC, lletres, absF, num) => {
    if (lletres === undefined) return sencer;
    const col = absC ? indexColumna(lletres) : indexColumna(lletres) + dColumnes;
    const fila = absF ? Number(num) : Number(num) + dFiles;
    if (col < 0 || col >= MAX_COLUMNES_FULL || fila < 1 || fila > MAX_FILES_FULL) return `${davant}#REF!`;
    return `${davant}${absC}${lletraColumna(col)}${absF}${fila}`;
  });
}

/* ── Una fulla ─────────────────────────────────────────────────────────── */

/* Tipus i valor d'una cel·la a partir del seu atribut t, el <v> i el <is>. */
function valorDe(t, v, interior, format, context, lloc) {
  switch (t) {
    case 's': {
      if (v === null || v.trim() === '') return { tipus: 'buit', valor: null };
      const index = Number(v);
      if (!Number.isInteger(index) || index < 0 || index >= context.cadenes.length) throw new TypeError(`Cadena compartida que no existix a ${lloc}.`);
      const text = context.cadenes[index];
      return text === '' ? { tipus: 'buit', valor: null } : { tipus: 'text', valor: text };
    }
    case 'inlineStr': {
      const is = /<(?:\w+:)?is\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?is>)/.exec(interior);
      const text = is && is[1] !== undefined ? textRic(is[1]) : '';
      return text === '' ? { tipus: 'buit', valor: null } : { tipus: 'text', valor: text };
    }
    case 'str': {
      const text = v === null ? '' : textOoxml(v);
      return text === '' ? { tipus: 'buit', valor: null } : { tipus: 'text', valor: text };
    }
    case 'b':
      return v === null || v === '' ? { tipus: 'buit', valor: null } : { tipus: 'boolea', valor: v === '1' || v === 'true' };
    case 'e':
      return { tipus: 'error', valor: v === null ? '' : desescapa(v) };
    case 'd':
      return v === null || v === '' ? { tipus: 'buit', valor: null } : deIso(desescapa(v), format.classe);
    default: {
      if (v === null || v.trim() === '') return { tipus: 'buit', valor: null };
      const n = Number(v);
      return Number.isFinite(n) ? deNumero(n, format, context.date1904) : { tipus: 'text', valor: desescapa(v) };
    }
  }
}

/* Les cel·les i les combinacions de l'XML d'una fulla. Les files i les
   cel·les sense referència (r és opcional) seguixen l'anterior. */
function llegixFulla(xml, nom, context) {
  const dades = /<(?:\w+:)?sheetData\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?sheetData>)/.exec(xml);
  const cos = dades?.[1] ?? '';
  const celles = [];
  const mestres = new Map();
  let fila = 0;
  let col = -1;
  for (const m of cos.matchAll(/<(?:\w+:)?row\b([^>]*?)\/?>|<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
    if (m[1] !== undefined) {
      const r = Number(atributs(m[1]).r);
      fila = Number.isInteger(r) && r >= 1 && r <= MAX_FILES_FULL ? r : fila + 1;
      col = -1;
      continue;
    }
    context.celles += 1;
    if (context.celles > context.maxCelles) throw new RangeError(`El llibre passa de ${milers(context.maxCelles)} cel·les: és massa gran per a llegir-lo ací.`);
    const a = atributs(m[2]);
    if (a.r !== undefined) {
      const lloc = cellaDe(a.r);
      if (!lloc) throw new TypeError(`Referència de cel·la que no és vàlida a la fulla «${nom}»: ${a.r}`);
      ({ fila, col } = lloc);
    } else {
      col += 1;
      fila = Math.max(fila, 1);
      if (col >= MAX_COLUMNES_FULL) throw new TypeError(`Massa columnes a la fulla «${nom}».`);
    }
    const ref = `${lletraColumna(col)}${fila}`;
    const interior = m[3] ?? '';
    const format = context.formats[Number(a.s ?? 0)] ?? context.formats[0] ?? GENERAL;
    const v = /<(?:\w+:)?v\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?v>)/.exec(interior);
    const f = /<(?:\w+:)?f\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?f>)/.exec(interior);
    let formula = null;
    if (f) {
      const af = atributs(f[1]);
      formula = f[2] === undefined ? '' : desescapa(f[2]);
      if (af.t === 'shared' && af.si !== undefined) {
        if (formula !== '') mestres.set(af.si, { formula, fila, col });
        else if (mestres.has(af.si)) {
          const mestra = mestres.get(af.si);
          formula = desplacaFormula(mestra.formula, fila - mestra.fila, col - mestra.col);
        }
      }
    }
    const { tipus, valor } = valorDe(a.t ?? 'n', v ? v[1] ?? '' : null, interior, format, context, `${nom}!${ref}`);
    celles.push({ fila, col, ref, tipus, valor, formula, format: format.codi });
  }
  const combinacions = [];
  for (const m of xml.matchAll(/<(?:\w+:)?mergeCell\b([^>]*?)\/?>/g)) {
    const rang = rangDe(atributs(m[1]).ref);
    if (rang) combinacions.push(rang);
  }
  return { nom, combinacions, celles };
}

/* ── El llibre ─────────────────────────────────────────────────────────── */

/* 200000 → '200.000', per als missatges a la persona. */
const milers = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
/* Una mida per als missatges a la persona: en MB, com la resta de l'aplicació,
   des d'1 MiB (arredonida cap avall: el que passa del límit passa també
   d'eixos MB), i en bytes per davall. */
const textMida = (bytes) => (bytes >= 1024 * 1024 ? `${milers(Math.floor(bytes / (1024 * 1024)))} MB` : `${milers(bytes)} bytes`);

function limitDe(valor, perDefecte, nom) {
  if (valor === undefined) return perDefecte;
  if (typeof valor !== 'number' || !(valor > 0)) throw new RangeError(`llegixLlibre: ${nom} ha de ser un nombre positiu.`);
  return Math.floor(valor);
}

function aBytes(valor) {
  if (ArrayBuffer.isView(valor)) return new Uint8Array(valor.buffer, valor.byteOffset, valor.byteLength);
  if (Object.prototype.toString.call(valor) === '[object ArrayBuffer]') return new Uint8Array(valor);
  throw new TypeError('llegixLlibre: calen els bytes del fitxer (Uint8Array o ArrayBuffer).');
}

/**
 * Llig un llibre .xlsx i en torna el sistema de dates i les fulles de treball,
 * en l'ordre del llibre (les fulles de gràfic no hi són). Vegeu la capçalera
 * per a la forma de les cel·les.
 * Un fitxer que no és un XLSX o està malmés llança un TypeError; un que passa
 * dels límits, un RangeError. Els missatges són en valencià i es poden
 * mostrar a la persona.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @param {{ maxBytes?: number, maxEixida?: number, maxCelles?: number }} [opcions]
 *   maxBytes: mida màxima del fitxer (20 MiB); maxEixida: XML descomprimit
 *   màxim (64 MiB); maxCelles: cel·les màximes de tot el llibre (200.000).
 * @returns {{ date1904: boolean, fulles: Array<{ nom: string,
 *   combinacions: Array<{ ref: string, fila: number, col: number, filaFi: number, colFi: number }>,
 *   celles: Array<{ fila: number, col: number, ref: string,
 *     tipus: 'text'|'nombre'|'data'|'hora'|'data-hora'|'boolea'|'error'|'buit',
 *     valor: string|number|boolean|null, formula: string|null, format: string }> }> }}
 */
export function llegixLlibre(bytes, opcions = {}) {
  const b = aBytes(bytes);
  const maxBytes = limitDe(opcions.maxBytes, LIMIT_BYTES, 'maxBytes');
  const maxCelles = limitDe(opcions.maxCelles, LIMIT_CELLES, 'maxCelles');
  const maxEixida = limitDe(opcions.maxEixida, LIMIT_EIXIDA, 'maxEixida');
  const pressupost = { resta: maxEixida, limit: maxEixida };
  if (b.length > maxBytes) throw new RangeError(`El fitxer passa de ${textMida(maxBytes)}: és massa gran per a llegir-lo ací.`);

  /* 1. L'arrel del paquet diu on és el llibre. */
  const arrel = llegixParts(b, ['_rels/.rels'], pressupost);
  const principal = relacions(arrel('_rels/.rels'), '').find((r) => esDeTipus(r, 'officeDocument'));
  const partLlibre = principal ? principal.desti : LLIBRE_PER_DEFECTE;
  /* 2. El llibre i les seues relacions. */
  const delLlibre = llegixParts(b, [partLlibre, relsDe(partLlibre)], pressupost);
  const xmlLlibre = delLlibre(partLlibre);
  if (xmlLlibre === null || !/<(?:\w+:)?workbook\b/.test(xmlLlibre)) throw new TypeError('No és un llibre XLSX: falta el llibre de fulls dins del paquet.');
  const relsLlibre = relacions(delLlibre(relsDe(partLlibre)), partLlibre);
  const propietats = /<(?:\w+:)?workbookPr\b([^>]*?)\/?>/.exec(xmlLlibre);
  const date1904 = propietats ? ['1', 'true'].includes(atributs(propietats[1]).date1904) : false;
  const fulles = [];
  for (const m of xmlLlibre.matchAll(/<(?:\w+:)?sheet\b([^>]*?)\/?>/g)) {
    const a = atributs(m[1]);
    const relacio = a.id === undefined ? null : relsLlibre.find((r) => r.id === a.id);
    if (relacio && esDeTipus(relacio, 'worksheet')) fulles.push({ nom: a.name ?? '', part: relacio.desti });
  }
  /* 3. Les cadenes, els estils i les fulles de treball: res més. */
  const cadenes = relsLlibre.filter((r) => esDeTipus(r, 'sharedStrings')).map((r) => r.desti);
  const estil = relsLlibre.filter((r) => esDeTipus(r, 'styles')).map((r) => r.desti);
  const part = llegixParts(b, [...cadenes, ...estil, ...fulles.map((f) => f.part)], pressupost);
  const xmlCadenes = cadenes.map(part).filter((x) => x !== null).join('');
  const context = {
    date1904,
    cadenes: [...xmlCadenes.matchAll(/<(?:\w+:)?si\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?si>)/g)].map((m) => textRic(m[1] ?? '')),
    formats: estils(estil.map(part).filter((x) => x !== null).join('')),
    celles: 0,
    maxCelles
  };
  return {
    date1904,
    fulles: fulles.map(({ nom, part: ruta }) => {
      const xml = part(ruta);
      if (xml === null) throw new TypeError(`Falta la fulla «${nom}» dins del paquet.`);
      return llegixFulla(xml, nom, context);
    })
  };
}
