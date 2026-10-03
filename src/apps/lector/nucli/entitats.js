/**
 * Lector de notícies · les entitats de caràcter i el text net (nucli pur).
 *
 * XML en té cinc; els feeds de veres porten també les d'HTML (&nbsp;,
 * &hellip;, les vocals amb accent…), encara que siga XML mal format. Ací es
 * descodifiquen les cinc d'XML, les numèriques i una llista TANCADA de les
 * d'HTML que es veuen en premsa. Una entitat desconeguda es queda com a text
 * tal qual. Cap entitat definida pel document (DOCTYPE): xml.js no en llig cap.
 *
 * netejaText lleva el que no és text: els controls (llevat de tabulador i
 * salts) i els invisibles i bidireccionals, que en un títol servixen per a
 * disfressar-lo (U+202E capgira el que es llig).
 */

/* Nom → punt de codi. Llatí-1 sencer i la tipografia de premsa. */
const NOMENADES = Object.freeze({
  amp: 38, lt: 60, gt: 62, quot: 34, apos: 39,
  nbsp: 160, iexcl: 161, cent: 162, pound: 163, curren: 164, yen: 165, brvbar: 166, sect: 167, uml: 168, copy: 169,
  ordf: 170, laquo: 171, not: 172, shy: 173, reg: 174, macr: 175, deg: 176, plusmn: 177, sup2: 178, sup3: 179,
  acute: 180, micro: 181, para: 182, middot: 183, cedil: 184, sup1: 185, ordm: 186, raquo: 187, frac14: 188,
  frac12: 189, frac34: 190, iquest: 191, Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195, Auml: 196, Aring: 197,
  AElig: 198, Ccedil: 199, Egrave: 200, Eacute: 201, Ecirc: 202, Euml: 203, Igrave: 204, Iacute: 205, Icirc: 206,
  Iuml: 207, ETH: 208, Ntilde: 209, Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213, Ouml: 214, times: 215,
  Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219, Uuml: 220, Yacute: 221, THORN: 222, szlig: 223, agrave: 224,
  aacute: 225, acirc: 226, atilde: 227, auml: 228, aring: 229, aelig: 230, ccedil: 231, egrave: 232, eacute: 233,
  ecirc: 234, euml: 235, igrave: 236, iacute: 237, icirc: 238, iuml: 239, eth: 240, ntilde: 241, ograve: 242,
  oacute: 243, ocirc: 244, otilde: 245, ouml: 246, divide: 247, oslash: 248, ugrave: 249, uacute: 250, ucirc: 251,
  uuml: 252, yacute: 253, thorn: 254, yuml: 255,
  OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, fnof: 402, circ: 710, tilde: 732,
  ensp: 8194, emsp: 8195, thinsp: 8201, ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218,
  ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225, bull: 8226, hellip: 8230, permil: 8240,
  prime: 8242, Prime: 8243, lsaquo: 8249, rsaquo: 8250, euro: 8364, trade: 8482, larr: 8592, uarr: 8593,
  rarr: 8594, darr: 8595
});

/* HTML llig les referències numèriques del 128 al 159 com Windows-1252 (els
   feeds vells hi posen les cometes i el guió llarg). La resta d'eixe tram és
   un control: fora. */
const WINDOWS_1252 = Object.freeze({
  128: 8364, 130: 8218, 131: 402, 132: 8222, 133: 8230, 134: 8224, 135: 8225, 136: 710, 137: 8240, 138: 352,
  139: 8249, 140: 338, 142: 381, 145: 8216, 146: 8217, 147: 8220, 148: 8221, 149: 8226, 150: 8211, 151: 8212,
  152: 732, 153: 8482, 154: 353, 155: 8250, 156: 339, 158: 382, 159: 376
});

const SUBSTITUT = 0xFFFD;
const ENTITAT = /&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([A-Za-z][A-Za-z0-9]{1,31}));/g;

function caracterDe(punt) {
  if (punt >= 128 && punt <= 159) return Object.hasOwn(WINDOWS_1252, punt) ? String.fromCodePoint(WINDOWS_1252[punt]) : '';
  if (!Number.isInteger(punt) || punt <= 0 || punt > 0x10FFFF || (punt >= 0xD800 && punt <= 0xDFFF)) {
    return String.fromCodePoint(SUBSTITUT);
  }
  return String.fromCodePoint(punt);
}

/** Descodifica les entitats d'un text (XML, numèriques i les HTML de la llista). */
export function descodifica(text) {
  if (typeof text !== 'string' || !text.includes('&')) return typeof text === 'string' ? text : '';
  return text.replace(ENTITAT, (sencera, decimal, hexadecimal, nom) => {
    if (decimal !== undefined) return caracterDe(Number.parseInt(decimal, 10));
    if (hexadecimal !== undefined) return caracterDe(Number.parseInt(hexadecimal, 16));
    return Object.hasOwn(NOMENADES, nom) ? String.fromCodePoint(NOMENADES[nom]) : sencera;
  });
}

/* Controls (sense tabulador ni salts), C1, invisibles i bidireccionals. Els
   trams alts es construïxen amb els punts de codi: escrits en cru no es
   veurien, i les portes del repo vetarien els invisibles als fitxers. */
const car = (punt) => String.fromCharCode(punt);
const tram = (de, fins) => `${car(de)}-${car(fins)}`;
const NO_TEXT = new RegExp(
  `[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F-\\x9F${tram(0x200B, 0x200F)}${tram(0x202A, 0x202E)}${tram(0x2060, 0x2069)}${car(0xFEFF)}${tram(0xFFFE, 0xFFFF)}]`,
  'g'
);

/** El text sense res que no siga text (veure la capçalera). */
export function netejaText(text) {
  return typeof text === 'string' ? text.replace(NO_TEXT, '') : '';
}

/** Tots els espais seguits (salts inclosos) en un de sol, i sense vores. */
export function plega(text) {
  return netejaText(text).replace(/\s+/g, ' ').trim();
}

/**
 * Talla un text a `maxim` unitats sense partir cap parell subrogat (un emoji
 * a mitges es pinta com a �).
 */
export function talla(text, maxim) {
  if (typeof text !== 'string' || text.length <= maxim) return typeof text === 'string' ? text : '';
  const codi = text.charCodeAt(maxim - 1);
  return text.slice(0, codi >= 0xD800 && codi <= 0xDBFF ? maxim - 1 : maxim);
}
