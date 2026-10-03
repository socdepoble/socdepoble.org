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
 * JS pur: sense DOM ni React.
 */
import { comprovaModel, textCela } from './model.js';

export const TIPUS_MIME_CSV = 'text/csv;charset=utf-8';
export const SEPARADOR_CSV = ';';
/* El BOM es fa des del punt de codi: cap caràcter invisible literal al codi. */
const BOM = String.fromCharCode(0xfeff);
const SALT = '\r\n';
const FORMULA = /^[=+\-@\t\r]/;

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
