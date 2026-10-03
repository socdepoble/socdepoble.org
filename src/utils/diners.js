/**
 * diners.js — diners en cèntims enters, sense coma flotant.
 *
 * Tot import viu com a enter de cèntims (Number.isSafeInteger): 1,50 € és
 * 150. Ací només es passa de cèntims a text i de text a cèntims.
 *   formatEuros(123456)      → '1.234,56 €'  (Intl.NumberFormat ca-ES, EUR)
 *   parseEuros('1.234,56 €') → 123456
 * El text d'Intl porta espais durs (U+00A0) entre la xifra i el símbol.
 *
 * Independent de sections/gestoria/nucli/diners.js (carril de la Gestoria):
 * les apps noves no poden importar-lo.
 * JS pur: sense DOM ni React.
 */

const LOCAL = 'ca-ES';
const AMB_SIMBOL = new Intl.NumberFormat(LOCAL, { style: 'currency', currency: 'EUR' });
const SENSE_SIMBOL = new Intl.NumberFormat(LOCAL, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Qualsevol espai Unicode que no siga l'espai, el tabulador o un salt de
   línia (els espais durs d'Intl). Classe negada: cap caràcter invisible
   literal al codi font. */
const ESPAIS_DURS = /[^\S\n\r\t ]/g;
const MONEDA = /^(?:€|eur)\s*|\s*(?:€|eur)$/gi;
const SIGNE = /^[-+−]/;
/* Milers amb punt (o amb espai) i decimals amb coma, com s'escriu en valencià. */
const AMB_MILERS = /^(\d{1,3}(?:([. ])\d{3})(?:\2\d{3})*)(?:,(\d{1,2}))?$/;
const SENSE_MILERS = /^(\d*)(?:,(\d{1,2}))?$/;
/* El punt com a decimal només si no pot ser de milers: una o dues xifres darrere. */
const PUNT_DECIMAL = /^(\d*)\.(\d{1,2})$/;
const MAX_XIFRES_ENTERES = 15;

/** true si el valor és un import vàlid en cèntims (enter segur). */
export const esCents = (valor) => Number.isSafeInteger(valor);

/**
 * Cèntims → text en euros, com el du Intl en ca-ES: '1.234,56 €'.
 * Torna '' si el valor no és un enter segur (import desconegut).
 * @param {number} cents
 * @param {{ simbol?: boolean }} [opcions] simbol: false → '1.234,56'
 * @returns {string}
 */
export function formatEuros(cents, { simbol = true } = {}) {
  if (!esCents(cents)) return '';
  /* -0 no és cap import: «-0,00 €» confondria. */
  const euros = (cents === 0 ? 0 : cents) / 100;
  return (simbol ? AMB_SIMBOL : SENSE_SIMBOL).format(euros);
}

/**
 * Text → cèntims, o null si el text no és un import en euros que es puga
 * llegir sense dubte. Accepta el que escriu formatEuros i el que tecleja una
 * persona: '12', '12,5', '12,50', '1.234,56', '1 234,56', '2.50' (punt
 * decimal amb una o dues xifres), '-3,00 €', 'EUR 3'. Més de dues xifres
 * decimals, o grups de milers que no són de tres, tornen null: amb diners,
 * millor preguntar que endevinar.
 * @param {unknown} text
 * @returns {number|null}
 */
export function parseEuros(text) {
  if (typeof text !== 'string') return null;
  let s = text.replace(ESPAIS_DURS, ' ').trim().replace(MONEDA, '').trim();
  let negatiu = false;
  const signe = SIGNE.exec(s);
  if (signe) {
    negatiu = signe[0] !== '+';
    s = s.slice(1).replace(MONEDA, '').trim();
  }
  let enter;
  let decimals;
  const milers = AMB_MILERS.exec(s);
  const pla = milers ? null : SENSE_MILERS.exec(s);
  const punt = milers || pla ? null : PUNT_DECIMAL.exec(s);
  if (milers) {
    enter = milers[1].replace(/[. ]/g, '');
    decimals = milers[3] ?? '';
  } else if (pla) {
    [, enter, decimals = ''] = pla;
  } else if (punt) {
    [, enter, decimals] = punt;
  } else {
    return null;
  }
  if (enter === '' && decimals === '') return null;
  if (enter.replace(/^0+/, '').length > MAX_XIFRES_ENTERES) return null;
  const cents = Number(enter || '0') * 100 + Number(decimals.padEnd(2, '0'));
  if (!esCents(cents)) return null;
  return negatiu && cents !== 0 ? -cents : cents;
}
