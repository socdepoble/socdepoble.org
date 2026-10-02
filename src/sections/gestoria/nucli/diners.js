/**
 * diners.js — imports en cèntims (enters), sense coma flotant.
 *
 * El model de la Gestoria guarda els diners com a enters de cèntims
 * (Number.isSafeInteger) i null quan l'import és desconegut. Ací es llig el
 * text d'una factura o d'un CSV i s'escriu el format espanyol del full
 * («1.234,56 €»). JS pur: sense DOM ni React.
 *
 * HEURÍSTICA DELS SEPARADORS (parseImport)
 *   1. Amb punt i coma alhora, el que apareix l'últim és el decimal i l'altre
 *      és de milers: «1.234,56» i «1,234.56» valen 123456 cèntims.
 *   2. Amb un sol tipus de separador que apareix més d'una vegada, és de
 *      milers: «1.234.567».
 *   3. Amb un sol separador i exactament tres xifres darrere, és de milers:
 *      «12.345» són 12.345 €. Excepció: si la part entera és 0 o comença per
 *      0 («0,125»), és decimal.
 *   4. En qualsevol altre cas és el decimal: «143,04», «12.5», «,50».
 *   Els grups de milers han de ser de tres xifres; si no quadren, null.
 *   Més de dos decimals s'arredonixen a la meitat lluny de zero, en text (sense
 *   coma flotant). Negatiu: «-», «−» (U+2212) o parèntesis «(12,00)».
 *   Moneda: «€» o «EUR», davant o darrere; qualsevol altra moneda és null.
 *   Els espais durs (U+00A0, U+202F, U+2007, U+2009) valen com a espais, i els
 *   espais entre grups de tres xifres fan de separador de milers.
 */

/* Qualsevol espai Unicode que no siga l'espai, el tabulador o un salt de
   línia (inclou els espais durs de dalt). Classe negada: cap caràcter
   invisible literal al codi font (ESLint no-irregular-whitespace). */
const ESPAIS_DURS = /[^\S\n\r\t ]/g;
const SIGNE = /^([-+−])\s*/;
const MONEDA_DAVANT = /^(?:€|eur)\s*/i;
const MONEDA_DARRERE = /\s*(?:€|eur)$/i;
const MILERS_PUNT = /^\d{1,3}(?:\.\d{3})+$/;
const MILERS_COMA = /^\d{1,3}(?:,\d{3})+$/;
const MILERS_ESPAI = /^\d{1,3}(?: \d{3})+(?:[.,]\d+)?$/;
/* Guarda de longitud abans de Number(); el límit fi el posa isSafeInteger. */
const MAX_XIFRES_ENTERES = 15;

const grupsDeMilers = (text, sep) => (sep === '.' ? MILERS_PUNT : MILERS_COMA).test(text);

/* Separa la part entera i la decimal segons l'heurística; null si no quadra. */
function separaParts(s) {
  const punt = s.lastIndexOf('.');
  const coma = s.lastIndexOf(',');
  if (punt >= 0 && coma >= 0) {
    const dec = punt > coma ? '.' : ',';
    const mil = dec === '.' ? ',' : '.';
    const i = s.lastIndexOf(dec);
    if (s.indexOf(dec) !== i) return null;
    const enter = s.slice(0, i);
    if (!grupsDeMilers(enter, mil)) return null;
    return { enter: enter.split(mil).join(''), decimals: s.slice(i + 1), ambSeparador: true };
  }
  if (punt < 0 && coma < 0) return { enter: s, decimals: '', ambSeparador: false };
  const sep = punt >= 0 ? '.' : ',';
  const parts = s.split(sep);
  if (parts.length > 2) return grupsDeMilers(s, sep) ? { enter: parts.join(''), decimals: '', ambSeparador: false } : null;
  if (parts[1].length === 3 && /^[1-9]\d{0,2}$/.test(parts[0])) return { enter: parts.join(''), decimals: '', ambSeparador: false };
  return { enter: parts[0], decimals: parts[1], ambSeparador: true };
}

/**
 * Llig un import escrit i en torna els cèntims (enter), o null si el text no
 * és un import en euros que es puga llegir sense dubte.
 * @param {string} text
 * @returns {number|null}
 */
export function parseImport(text) {
  if (typeof text !== 'string') return null;
  let s = text.replace(ESPAIS_DURS, ' ').trim();
  let negatiu = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    negatiu = true;
    s = s.slice(1, -1).trim();
  }
  s = s.replace(MONEDA_DARRERE, '');
  let signe = SIGNE.exec(s);
  if (signe) s = s.slice(signe[0].length);
  s = s.replace(MONEDA_DAVANT, '');
  if (!signe) {
    signe = SIGNE.exec(s);
    if (signe) s = s.slice(signe[0].length);
  }
  if (signe && signe[1] !== '+') negatiu = true;
  if (s.includes(' ')) {
    if (!MILERS_ESPAI.test(s)) return null;
    s = s.split(' ').join('');
  }
  if (!/^[\d.,]*\d[\d.,]*$/.test(s)) return null;
  const parts = separaParts(s);
  if (!parts) return null;
  const { enter, decimals, ambSeparador } = parts;
  if (!/^\d*$/.test(enter) || !/^\d*$/.test(decimals)) return null;
  if (ambSeparador && decimals === '') return null;
  if (enter.replace(/^0+/, '').length > MAX_XIFRES_ENTERES) return null;
  let cents = Number(enter || '0') * 100 + Number(`${decimals}00`.slice(0, 2));
  if (decimals.length > 2 && decimals[2] >= '5') cents += 1;
  if (!Number.isSafeInteger(cents)) return null;
  return negatiu && cents !== 0 ? -cents : cents;
}

/**
 * Escriu cèntims en el format del full: «1.234,56 €», «-12,00 €».
 * Torna '' si el valor no és un enter segur (import desconegut).
 * @param {number} cents
 * @param {{ simbol?: boolean }} [opcions] simbol: false omet « €».
 * @returns {string}
 */
export function formatImport(cents, { simbol = true } = {}) {
  if (!Number.isSafeInteger(cents)) return '';
  const abs = Math.abs(cents);
  const euros = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const text = `${cents < 0 ? '-' : ''}${euros},${String(abs % 100).padStart(2, '0')}`;
  return simbol ? `${text} €` : text;
}

/**
 * Suma una llista d'imports en cèntims. Els desconeguts (null o no enters)
 * no compten, però marquen la suma com a incompleta.
 * @param {Array<number|null>} llista
 * @returns {{ total: number, incomplet: boolean }}
 */
export function sumaImports(llista) {
  let total = 0;
  let incomplet = false;
  for (const valor of llista ?? []) {
    if (Number.isSafeInteger(valor)) total += valor;
    else incomplet = true;
  }
  return { total, incomplet };
}
