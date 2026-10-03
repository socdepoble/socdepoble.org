/**
 * csv.js — fulles del model (model.js) com a CSV per a un full de càlcul en
 * valencià o en castellà.
 *
 * Punt i coma de separador (la coma és el decimal), BOM d'UTF-8 perquè
 * Excel no confonga els accents, i CRLF al final de cada fila, també de
 * l'última. Un camp amb punt i coma, cometes o salts de línia va entre
 * cometes, amb les de dins doblades (RFC 4180).
 *
 * Injecció de fórmules: un text que comença per = + - @, tabulador o retorn
 * un full l'executaria com a fórmula. `protegeixFormula` hi anteposa una
 * cometa simple. S'aplica a TOTS els textos (títols inclosos); els nombres,
 * imports, dates i hores els escriu este mòdul i no en necessiten.
 * Un text amb una coma o un tabulador també va entre cometes: un full que
 * llija el CSV separant per comes (configuració anglesa) o per tabuladors
 * el partiria, i el tros de després podria començar per «=». Els nombres
 * del mòdul («1,50») no van entre cometes, perquè es lligen com a nombres.
 *
 * Lectura: `llegixCsv` torna les files com a llistes de cadenes, tal qual
 * (sense convertir nombres ni dates). Deute declarat: és una còpia del
 * parseCsv de sections/gestoria/nucli/csv.js, que no es pot importar ni
 * tocar (els tractors de la Gestoria estan signats per empremta); s'han
 * d'unificar quan el Mestre reaprove els seus tractors. La detecció del
 * delimitador ja no és la mateixa: la de la Gestoria compta comes i partix
 * la coma decimal d'un CSV amb punt i coma.
 * JS pur: sense DOM ni React.
 */
import { comprovaModel, textCela } from './model.js';

export const TIPUS_MIME_CSV = 'text/csv;charset=utf-8';
export const SEPARADOR_CSV = ';';
/* El BOM es fa des del punt de codi: cap caràcter invisible literal al codi. */
const BOM = String.fromCharCode(0xfeff);
const SALT = '\r\n';
const FORMULA = /^[=+\-@\t\r]/;
const DELIMITADORS = [',', ';', '\t'];
const LINIES_MOSTRA = 10;
/* Bytes de 0x80 a 0x9F en windows-1252; els cinc que no hi són es queden com el byte (com fa WHATWG). */
const WINDOWS_1252 = [
  0x20AC, 0x81, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021, 0x02C6, 0x2030, 0x0160, 0x2039, 0x0152, 0x8D, 0x017D, 0x8F,
  0x90, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x02DC, 0x2122, 0x0161, 0x203A, 0x0153, 0x9D, 0x017E, 0x0178
];

/**
 * Neutralitza un text que un full de càlcul llegiria com a fórmula: si
 * comença per = + - @, tabulador o retorn, hi anteposa una cometa simple.
 * @param {unknown} valor
 * @returns {string}
 */
export function protegeixFormula(valor) {
  const text = valor == null ? '' : String(valor);
  return FORMULA.test(text) ? `'${text}` : text;
}

const entreCometes = (text) => `"${text.replace(/"/g, '""')}"`;

/* Un camp que escriu el mòdul (nombre, import, data, hora): entre cometes
   només si cal (separador, cometes o salts). */
const campDelModul = (text) => (/[;"\r\n]/.test(text) ? entreCometes(text) : text);

/* Un text de fora: protegit contra fórmules i, a més, entre cometes si porta
   coma o tabulador, perquè cap lector el partisca en un tros que comence per «=». */
const campDeFora = (valor) => {
  const text = protegeixFormula(valor);
  return /[;,"\t\r\n]/.test(text) ? entreCometes(text) : text;
};

const liniaCsv = (camps) => camps.join(SEPARADOR_CSV) + SALT;

/**
 * Files lliures com a CSV. Cada text es protegix contra fórmules; un nombre
 * s'escriu amb coma decimal; null i undefined, buits.
 * @param {Array<Array<unknown>>} files
 * @param {{ bom?: boolean }} [opcions] bom: false per a concatenar trossos
 * @returns {string}
 */
export function serialitzaCsv(files, { bom = true } = {}) {
  if (!Array.isArray(files)) throw new TypeError('serialitzaCsv espera una llista de files.');
  const linies = files.map((fila) => liniaCsv((fila ?? []).map((valor) => {
    if (valor == null) return '';
    if (typeof valor === 'number') return Number.isFinite(valor) ? campDelModul(String(valor).replace('.', ',')) : '';
    return campDeFora(valor);
  })));
  return (bom ? BOM : '') + linies.join('');
}

/**
 * Una fulla del model com a CSV: la capçalera amb els títols i una fila per
 * fila del model, cada valor escrit segons el tipus de la seua columna
 * (model.js · textCela). Un valor que no és del tipus llança un TypeError.
 * @param {{ nom: string, columnes: Array<{ titol: string, tipus: string, decimals?: number }>, files: unknown[][] }} fulla
 * @param {{ bom?: boolean, capcalera?: boolean }} [opcions]
 * @returns {string}
 */
export function fullaACsv(fulla, { bom = true, capcalera = true } = {}) {
  comprovaModel({ fulles: [fulla] });
  const linies = [];
  if (capcalera) linies.push(liniaCsv(fulla.columnes.map((columna) => campDeFora(columna.titol))));
  fulla.files.forEach((fila, k) => {
    const lloc = `fulla «${fulla.nom}», fila ${k + 1}`;
    linies.push(liniaCsv(fulla.columnes.map((columna, j) => {
      const text = textCela(fila[j], columna, lloc);
      return columna.tipus === 'text' ? campDeFora(text) : campDelModul(text);
    })));
  });
  return (bom ? BOM : '') + linies.join('');
}

/**
 * La fulla d'un model que es diu `nom`, com a CSV (un CSV només té una fulla).
 * @param {{ fulles: object[] }} model
 * @param {string} nom
 * @param {{ bom?: boolean, capcalera?: boolean }} [opcions]
 * @returns {string}
 */
export function modelACsv(model, nom, opcions) {
  comprovaModel(model);
  const fulla = model.fulles.find((f) => f.nom === nom);
  if (!fulla) throw new RangeError(`El model no té cap fulla «${nom}».`);
  return fullaACsv(fulla, opcions);
}

/* ── Lectura ───────────────────────────────────────────────────────────── */

function decodificaWindows1252(bytes) {
  const trossos = [];
  const tros = [];
  for (const b of bytes) {
    tros.push(b >= 0x80 && b <= 0x9F ? WINDOWS_1252[b - 0x80] : b);
    if (tros.length === 8192) trossos.push(String.fromCharCode(...tros.splice(0)));
  }
  trossos.push(String.fromCharCode(...tros));
  return trossos.join('');
}

/* El text d'uns bytes: UTF-16LE si porta el seu BOM; si no, UTF-8 estricte;
   i si no és UTF-8 vàlid, windows-1252 (el CSV d'un Excel antic). */
function textDeBytes(valor) {
  const b = ArrayBuffer.isView(valor) ? new Uint8Array(valor.buffer, valor.byteOffset, valor.byteLength) : new Uint8Array(valor);
  if (b.length >= 2 && b[0] === 0xFF && b[1] === 0xFE) return new TextDecoder('utf-16le').decode(b);
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(b);
  } catch {
    return decodificaWindows1252(b);
  }
}

const esXifra = (c) => c !== undefined && c >= '0' && c <= '9';

/* La mostra per a triar el delimitador: les 10 primeres línies amb text (un
   salt dins de cometes no tanca la línia; una cometa només n'obri si és al
   principi d'un camp, com a la lectura). Per a cada línia, quants n'hi ha de
   cada candidat fora de cometes, i quantes comes van entre dues xifres
   (pot ser la coma decimal d'un full en valencià: «1,50»). */
function mostraDelimitadors(text) {
  const linies = [];
  let actual = null;
  let entreCometes = false;
  let iniciDeCamp = true;
  for (let i = 0; i < text.length && linies.length < LINIES_MOSTRA; i += 1) {
    const c = text[i];
    if (entreCometes) {
      if (c === '"' && text[i + 1] === '"') i += 1;
      else if (c === '"') entreCometes = false;
      continue;
    }
    if (c === '\r' || c === '\n') {
      if (actual) linies.push(actual);
      actual = null;
      iniciDeCamp = true;
      continue;
    }
    if (!actual) actual = { comptes: new Map(DELIMITADORS.map((d) => [d, 0])), decimals: 0 };
    if (c === '"' && iniciDeCamp) {
      entreCometes = true;
      iniciDeCamp = false;
    } else if (actual.comptes.has(c)) {
      actual.comptes.set(c, actual.comptes.get(c) + 1);
      if (c === ',' && esXifra(text[i - 1]) && esXifra(text[i + 1])) actual.decimals += 1;
      iniciDeCamp = true;
    } else iniciDeCamp = false;
  }
  if (actual && linies.length < LINIES_MOSTRA) linies.push(actual);
  return linies;
}

/* El delimitador que partix més línies de la mostra en tants camps com la
   primera (la capçalera), si en són més d'un. En un empat guanya la coma; si
   hi ha comes entre xifres, el punt i coma (el CSV d'un full en valencià o en
   castellà, i el que escriu este mòdul). Si cap no partix la primera línia, el
   que més es repetix sense comptar les comes entre xifres, amb el mateix ordre
   en un empat: una sola columna de nombres amb coma decimal no es partix. */
function detectaDelimitador(text) {
  const linies = mostraDelimitadors(text);
  const ambDecimals = linies.some((l) => l.decimals > 0);
  const ordre = ambDecimals ? [';', '\t', ','] : [',', ';', '\t'];
  const triaDe = (punts) => ordre.reduce((millor, d) => (punts(d) > punts(millor) ? d : millor), ordre[0]);
  const camps = (l, d) => l.comptes.get(d) + 1;
  const constancia = (d) => (linies.length && camps(linies[0], d) > 1 ? linies.filter((l) => camps(l, d) === camps(linies[0], d)).length : 0);
  const millor = triaDe(constancia);
  if (constancia(millor) > 0) return millor;
  return triaDe((d) => linies.reduce((n, l) => n + l.comptes.get(d) - (d === ',' ? l.decimals : 0), 0));
}

/**
 * Llig un CSV i en torna les files com a llistes de cadenes, sense convertir
 * res. RFC 4180 amb tolerància: BOM fora, salts CRLF, LF o CR, cometes
 * doblades i delimitadors o salts de línia dins de cometes. Una cometa a
 * mitjan camp sense cometes és un caràcter més, i una cometa que no es tanca
 * s'emporta la resta del text al seu camp. Una línia buida és [''] i el salt
 * final no afig cap fila.
 * Accepta el text o els bytes del fitxer: UTF-8, UTF-16LE amb BOM o, si no
 * és UTF-8 vàlid, windows-1252.
 * @param {string|Uint8Array|ArrayBuffer} text
 * @param {{ delimitador?: 'auto' | ',' | ';' | '\t' }} [opcions] 'auto' (per
 *   defecte) tria entre coma, punt i coma i tabulador pels camps de la
 *   primera línia i de les següents, sense partir una coma decimal («1,50»).
 *   Si el format ja se sap, val més passar-lo.
 * @returns {string[][]}
 */
export function llegixCsv(text, { delimitador = 'auto' } = {}) {
  let font;
  if (typeof text === 'string') font = text;
  else if (ArrayBuffer.isView(text) || Object.prototype.toString.call(text) === '[object ArrayBuffer]') font = textDeBytes(text);
  else throw new TypeError('llegixCsv espera un text o els bytes del fitxer.');
  if (font.startsWith(BOM)) font = font.slice(1);
  if (delimitador !== 'auto' && !DELIMITADORS.includes(delimitador)) throw new RangeError(`Delimitador de CSV no vàlid: ${JSON.stringify(delimitador)}`);
  const sep = delimitador === 'auto' ? detectaDelimitador(font) : delimitador;
  const files = [];
  let fila = [];
  let camp = '';
  let entreCometes = false;
  let iniciDeCamp = true;
  let pendent = false;
  for (let i = 0; i < font.length; i += 1) {
    const c = font[i];
    if (entreCometes) {
      if (c !== '"') camp += c;
      else if (font[i + 1] === '"') {
        camp += '"';
        i += 1;
      } else entreCometes = false;
      continue;
    }
    if (c === '"' && iniciDeCamp) {
      entreCometes = true;
      iniciDeCamp = false;
      pendent = true;
    } else if (c === sep) {
      fila.push(camp);
      camp = '';
      iniciDeCamp = true;
      pendent = true;
    } else if (c === '\r' || c === '\n') {
      fila.push(camp);
      files.push(fila);
      fila = [];
      camp = '';
      iniciDeCamp = true;
      pendent = false;
      if (c === '\r' && font[i + 1] === '\n') i += 1;
    } else {
      camp += c;
      iniciDeCamp = false;
      pendent = true;
    }
  }
  if (pendent) {
    fila.push(camp);
    files.push(fila);
  }
  return files;
}
