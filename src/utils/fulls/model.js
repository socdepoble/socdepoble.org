/**
 * model.js — el model comú dels fulls de càlcul (XLSX i CSV).
 *
 *   {
 *     fulles: [{
 *       nom: 'Resum',                                   // 1-31 caràcters, sense [ ] : * ? / \
 *       columnes: [{ titol: 'Data', tipus: 'data', amplada?: 12, decimals?: 2 }],
 *       files: [['2026-10-02', …], …]                   // un valor per columna, en ordre
 *     }]
 *   }
 *
 * Un valor buit (null, undefined o '') és una cel·la buida en qualsevol tipus.
 *   text     cadena (un nombre o un booleà es passa a text); màxim 32767 caràcters
 *   nombre   enter segur (Number.isSafeInteger)
 *   decimal  nombre finit; es mostra amb `decimals` xifres (2 per defecte)
 *   data     'AAAA-MM-DD' i una data que existix
 *   hora     'HH:MM' o 'HH:MM:SS', de 00:00 a 23:59:59
 *   import   cèntims enters (Number.isSafeInteger): mai coma flotant
 * Un valor que no és del tipus de la columna llança un TypeError que diu la
 * fulla, la fila i la columna: un full mal fet no s'escriu a mitges.
 * `amplada` és en caràcters; sense, una per tipus (o la del títol, si és més ample).
 * JS pur: sense DOM ni React.
 */

export const TIPUS_CELLA = Object.freeze(['text', 'nombre', 'decimal', 'data', 'hora', 'import']);
/* Les files d'Excel són 1.048.576 i la primera és la capçalera. */
export const MAX_FILES = 1048575;
export const MAX_COLUMNES = 16384;
export const MAX_TEXT = 32767;
const MAX_NOM_FULLA = 31;
const MAX_AMPLADA = 255;
const MAX_DECIMALS = 10;
const DECIMALS_PER_DEFECTE = 2;
const AMPLADA_PER_TIPUS = Object.freeze({ text: 24, nombre: 10, decimal: 12, data: 12, hora: 8, import: 14 });
const CARACTERS_PROHIBITS_FULLA = '[]:*?/\\';
/* Caràcters que XML 1.0 no admet (també els suplents solts, gràcies a la
   bandera u). xlsx.js els lleva del text de les cel·les. Escrits com a
   escapaments: cap caràcter invisible literal al codi. */
export const CARACTERS_NO_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u{FFFE}\u{FFFF}\uD800-\uDFFF]/gu;
/* En un nom de fulla, a més, cap control (tabulador, salts, DEL ni C1): l'XLSX
   el perdria i dues fulles podrien acabar amb el mateix nom. */
const CONTROL_EN_NOM = /[\u0000-\u001F\u007F-\u009F\u{FFFE}\u{FFFF}\uD800-\uDFFF]/u;
/* «History» el reserva Excel per al control de canvis. */
const NOMS_RESERVATS = new Set(['history']);
const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const HORA = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

/**
 * Lletra de columna d'Excel: 0 → A, 25 → Z, 26 → AA.
 * @param {number} index des de 0
 * @returns {string}
 */
export function lletraColumna(index) {
  if (!Number.isSafeInteger(index) || index < 0 || index >= MAX_COLUMNES) throw new RangeError(`Columna fora de rang: ${index}`);
  let n = index + 1;
  let lletres = '';
  while (n > 0) {
    const resta = (n - 1) % 26;
    lletres = String.fromCharCode(65 + resta) + lletres;
    n = (n - 1 - resta) / 26;
  }
  return lletres;
}

/** Les parts d'una data 'AAAA-MM-DD' que existix, o null. */
export function partsData(valor) {
  const m = typeof valor === 'string' ? DATA_ISO.exec(valor) : null;
  if (!m) return null;
  const [any, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  /* setUTCFullYear i no Date.UTC, que desplaça els anys 0-99 al segle XX. */
  const data = new Date(0);
  data.setUTCFullYear(any, mes - 1, dia);
  if (data.getUTCFullYear() !== any || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
  return { any, mes, dia };
}

/** Segons des de mitjanit d'una hora 'HH:MM' o 'HH:MM:SS', o null. */
export function segonsDeHora(valor) {
  const m = typeof valor === 'string' ? HORA.exec(valor) : null;
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] ?? 0);
}

const dosXifres = (n) => String(n).padStart(2, '0');

/** 'AAAA-MM-DD' → 'DD/MM/AAAA', la forma que llig un full en valencià. */
export function dataLocal(valor) {
  const parts = partsData(valor);
  if (!parts) return '';
  return `${dosXifres(parts.dia)}/${dosXifres(parts.mes)}/${String(parts.any).padStart(4, '0')}`;
}

/** Cèntims com a decimal exacte, sense passar per coma flotant: 123456 → «1234.56». */
export function eurosExactes(cents, separador = '.') {
  const abs = Math.abs(cents);
  const decimals = abs % 100;
  const enter = (abs - decimals) / 100;
  return `${cents < 0 ? '-' : ''}${enter}${separador}${dosXifres(decimals)}`;
}

const esBuit = (valor) => valor === null || valor === undefined || valor === '';
const decimalsDe = (columna) => (Number.isSafeInteger(columna.decimals) ? columna.decimals : DECIMALS_PER_DEFECTE);

/**
 * Amplada d'una columna en caràcters: la declarada o la del tipus, i mai més
 * estreta que el títol.
 * @param {{ titol: string, tipus: string, amplada?: number }} columna
 * @returns {number}
 */
export function ampladaColumna(columna) {
  if (typeof columna.amplada === 'number') return columna.amplada;
  return Math.min(Math.max(AMPLADA_PER_TIPUS[columna.tipus] ?? 12, String(columna.titol).length + 2), 60);
}

function problemesNomFulla(nom, vistos, on) {
  if (typeof nom !== 'string' || nom.trim() === '') return [`${on}: cal un nom de fulla.`];
  const problemes = [];
  if (nom.length > MAX_NOM_FULLA) problemes.push(`${on}: el nom «${nom}» passa de ${MAX_NOM_FULLA} caràcters.`);
  if ([...nom].some((c) => CARACTERS_PROHIBITS_FULLA.includes(c))) problemes.push(`${on}: el nom «${nom}» porta [ ] : * ? / o \\.`);
  if (CONTROL_EN_NOM.test(nom)) problemes.push(`${on}: el nom ${JSON.stringify(nom)} porta caràcters de control o que XML no admet.`);
  if (nom.startsWith('\'') || nom.endsWith('\'')) problemes.push(`${on}: el nom «${nom}» comença o acaba amb un apòstrof.`);
  if (NOMS_RESERVATS.has(nom.toLowerCase())) problemes.push(`${on}: «${nom}» és un nom reservat d'Excel.`);
  const clau = nom.toLowerCase();
  if (vistos.has(clau)) problemes.push(`${on}: el nom «${nom}» es repetix (Excel no distingix majúscules).`);
  vistos.add(clau);
  return problemes;
}

function problemesColumna(columna, on) {
  if (!columna || typeof columna !== 'object') return [`${on}: cal { titol, tipus }.`];
  const problemes = [];
  if (typeof columna.titol !== 'string' || columna.titol.trim() === '') problemes.push(`${on}: cal un títol.`);
  if (!TIPUS_CELLA.includes(columna.tipus)) problemes.push(`${on}: tipus desconegut «${columna.tipus}».`);
  if (columna.amplada !== undefined && !(typeof columna.amplada === 'number' && columna.amplada > 0 && columna.amplada <= MAX_AMPLADA)) {
    problemes.push(`${on}: l'amplada ha de ser un nombre de 0 a ${MAX_AMPLADA}.`);
  }
  if (columna.decimals !== undefined && !(Number.isSafeInteger(columna.decimals) && columna.decimals >= 0 && columna.decimals <= MAX_DECIMALS)) {
    problemes.push(`${on}: els decimals han de ser un enter de 0 a ${MAX_DECIMALS}.`);
  }
  return problemes;
}

/**
 * Problemes d'estructura del model (no mira els valors de les cel·les).
 * @param {unknown} model
 * @returns {string[]} buit si el model és vàlid
 */
export function validaModel(model) {
  if (!model || typeof model !== 'object' || !Array.isArray(model.fulles)) return ['Cal un model { fulles: [...] }.'];
  if (model.fulles.length === 0) return ['El model no té cap fulla.'];
  const problemes = [];
  const vistos = new Set();
  model.fulles.forEach((fulla, i) => {
    const on = `Fulla ${i + 1}`;
    if (!fulla || typeof fulla !== 'object') {
      problemes.push(`${on}: cal { nom, columnes, files }.`);
      return;
    }
    problemes.push(...problemesNomFulla(fulla.nom, vistos, on));
    if (!Array.isArray(fulla.columnes) || fulla.columnes.length === 0) problemes.push(`${on}: cal almenys una columna.`);
    else if (fulla.columnes.length > MAX_COLUMNES) problemes.push(`${on}: massa columnes.`);
    else fulla.columnes.forEach((columna, j) => problemes.push(...problemesColumna(columna, `${on}, columna ${j + 1}`)));
    if (!Array.isArray(fulla.files)) problemes.push(`${on}: cal una llista de files (pot ser buida).`);
    else if (fulla.files.length > MAX_FILES) problemes.push(`${on}: massa files.`);
    else {
      const n = Array.isArray(fulla.columnes) ? fulla.columnes.length : 0;
      fulla.files.forEach((fila, k) => {
        if (!Array.isArray(fila)) problemes.push(`${on}, fila ${k + 1}: cal una llista de valors.`);
        else if (fila.length > n) problemes.push(`${on}, fila ${k + 1}: té ${fila.length} valors i només hi ha ${n} columnes.`);
      });
    }
  });
  return problemes;
}

/**
 * Com validaModel, però llança un TypeError amb tots els problemes.
 * @param {unknown} model
 */
export function comprovaModel(model) {
  const problemes = validaModel(model);
  if (problemes.length > 0) throw new TypeError(`Model de full no vàlid:\n${problemes.join('\n')}`);
}

/**
 * El valor d'una cel·la, comprovat i normalitzat segons el tipus de la columna.
 *   text → string · nombre → enter · decimal → nombre · data → 'AAAA-MM-DD'
 *   hora → segons des de mitjanit · import → cèntims
 * @param {unknown} valor
 * @param {{ titol: string, tipus: string }} columna
 * @param {string} [lloc] on és la cel·la, per al missatge d'error
 * @returns {null | { tipus: string, valor: string|number }} null si és buida
 */
export function valorCela(valor, columna, lloc = '') {
  if (esBuit(valor)) return null;
  const tipus = columna.tipus;
  const falla = (que) => {
    throw new TypeError(`${lloc ? `${lloc}: ` : ''}la columna «${columna.titol}» (${tipus}) espera ${que}.`);
  };
  switch (tipus) {
    case 'text': {
      if (!['string', 'number', 'boolean'].includes(typeof valor)) falla('un text');
      const text = String(valor);
      if (text.length > MAX_TEXT) throw new RangeError(`${lloc ? `${lloc}: ` : ''}un text de més de ${MAX_TEXT} caràcters no cap en una cel·la.`);
      return { tipus, valor: text };
    }
    case 'nombre':
      if (!Number.isSafeInteger(valor)) falla('un enter');
      return { tipus, valor };
    case 'decimal':
      if (typeof valor !== 'number' || !Number.isFinite(valor)) falla('un nombre finit');
      return { tipus, valor: Object.is(valor, -0) ? 0 : valor };
    case 'data':
      if (!partsData(valor)) falla('una data AAAA-MM-DD que existisca');
      return { tipus, valor };
    case 'hora': {
      const segons = segonsDeHora(valor);
      if (segons === null) falla('una hora HH:MM o HH:MM:SS');
      return { tipus, valor: segons };
    }
    case 'import':
      if (!Number.isSafeInteger(valor)) falla('cèntims enters');
      return { tipus, valor: valor === 0 ? 0 : valor };
    default:
      throw new TypeError(`Tipus de cel·la desconegut: ${tipus}`);
  }
}

/**
 * El text d'una cel·la per al CSV, com l'entén un full de càlcul en valencià:
 * coma decimal, imports sense símbol ni separador de milers, dates DD/MM/AAAA
 * i hores HH:MM. El text va tal qual (la protecció de fórmules és de csv.js).
 * @param {unknown} valor
 * @param {{ titol: string, tipus: string, decimals?: number }} columna
 * @param {string} [lloc]
 * @returns {string}
 */
export function textCela(valor, columna, lloc = '') {
  const cela = valorCela(valor, columna, lloc);
  if (cela === null) return '';
  switch (cela.tipus) {
    case 'nombre': return String(cela.valor);
    case 'decimal': return cela.valor.toFixed(decimalsDe(columna)).replace('.', ',');
    case 'data': return dataLocal(cela.valor);
    case 'hora': {
      const s = cela.valor;
      const hhmm = `${dosXifres(Math.floor(s / 3600))}:${dosXifres(Math.floor((s % 3600) / 60))}`;
      return s % 60 === 0 ? hhmm : `${hhmm}:${dosXifres(s % 60)}`;
    }
    case 'import': return eurosExactes(cela.valor, ',');
    default: return cela.valor;
  }
}

/** Els decimals amb què es mostra una columna decimal. */
export const decimalsColumna = decimalsDe;
