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
/* Onada R30 · A6-RX2 · La moneda del final es busca sola i els blancs de davant
   se'n van amb trimEnd (el mateix joc de blancs que \s). Abans, «\s*(?:€|eur)$»
   es tornava a provar des de cada blanc d'una tira llarga i la recorria sencera
   cada vegada (temps quadràtic). Trau exactament el mateix (linealitat.test.js). */
const MONEDA_DARRERE = /(?:€|eur)$/i;
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
  const moneda = MONEDA_DARRERE.exec(s);
  if (moneda) s = s.slice(0, moneda.index).trimEnd();
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
  /* Onada R30 · A6-RX2 · Xifres, punts i comes, amb una xifra almenys. Abans,
     «[\d.,]*\d[\d.,]*» provava cada xifra com la «primera» i tornava a recórrer
     la resta (quadràtic amb «1111…x»); ara la primera xifra és la primera de
     veres. Mateix llenguatge. */
  if (!/^[.,]*\d[\d.,]*$/.test(s)) return null;
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
  let acumulat = 0n;
  let incomplet = false;
  for (const valor of llista ?? []) {
    if (Number.isSafeInteger(valor)) acumulat += BigInt(valor);
    else incomplet = true;
  }
  const total = Number(acumulat);
  if (!Number.isSafeInteger(total)) throw new RangeError('La suma dels imports és massa gran per a representar-la en cèntims segurs.');
  return { total, incomplet };
}

/* Les estimacions també admeten qualsevol enter segur. Els productes i les
   sumes intermèdies poden passar-ne el límit encara que el resultat hi càpia. */
const errorNumeric = (codi, text) => Object.assign(new RangeError(text), { codi });
const enterGran = (valor) => {
  if (!Number.isSafeInteger(valor)) throw errorNumeric('IMPORT_FORA_DE_RANG', 'Cal un import en cèntims enters segurs.');
  return BigInt(valor);
};
const aCentims = (valor) => {
  if (valor > BigInt(Number.MAX_SAFE_INTEGER) || valor < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw errorNumeric('IMPORT_FORA_DE_RANG', 'El resultat és massa gran per a calcular-lo amb precisió. Revisa els imports o redueix el percentatge de l’escenari.');
  }
  return Number(valor);
};

/** Suma exacta d'imports coneguts; falla explícitament si el resultat no cap. */
export function sumaCentims(llista, { minimZero = false } = {}) {
  const suma = llista.reduce((total, valor) => total + enterGran(valor), 0n);
  return aCentims(minimZero && suma < 0n ? 0n : suma);
}

/* Mateix empat que Math.round, cap amunt també en negatiu; només es lleva
   l'error de coma flotant, sense canviar la política de les estimacions. */
export function arrodoneixFraccio(numerador, denominador) {
  if (typeof numerador !== 'bigint' || typeof denominador !== 'bigint' || denominador <= 0n) {
    throw errorNumeric('DIVISOR_INVALID', 'No es pot calcular la base amb estes suposicions: l’IVA i la retenció han de deixar un divisor positiu. Revisa els percentatges.');
  }
  const quocient = numerador / denominador;
  const residu = numerador % denominador;
  const ajust = residu * 2n >= denominador ? 1n : residu * -2n > denominador ? -1n : 0n;
  return aCentims(quocient + ajust);
}

/** import × multiplicador / divisor, arredonit una sola vegada. */
export const proporcioCentims = (import_, multiplicador, divisor) => arrodoneixFraccio(
  enterGran(import_) * enterGran(multiplicador), enterGran(divisor)
);

/** Aplica un canvi percentual decimal sense perdre cèntims en 100 + percentatge. */
export function escalaCentims(import_, percentatge) {
  if (typeof percentatge !== 'number' || !Number.isFinite(percentatge)) {
    throw errorNumeric('IMPORT_FORA_DE_RANG', 'Cal un percentatge finit.');
  }
  const [mantissa, exponent = '0'] = String(percentatge).toLowerCase().split('e');
  const decimals = mantissa.split('.')[1]?.length ?? 0;
  const potencia = Number(exponent) - decimals;
  const xifres = BigInt(mantissa.replace('.', ''));
  const numerador = potencia > 0 ? xifres * 10n ** BigInt(potencia) : xifres;
  const denominador = potencia < 0 ? 10n ** BigInt(-potencia) : 1n;
  return arrodoneixFraccio(enterGran(import_) * (100n * denominador + numerador), 100n * denominador);
}
