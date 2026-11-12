/* ANSEL del GEDCOM 5.5.1 (apèndix C). Les marques precedixen la lletra. */
const MARQUES = new Map([
  [0xE1, '\u0300'], [0xE2, '\u0301'], [0xE3, '\u0302'], [0xE4, '\u0303'],
  [0xE5, '\u0304'], [0xE6, '\u0306'], [0xE7, '\u0307'], [0xE8, '\u0308'],
  [0xE9, '\u030C'], [0xEA, '\u030A'], [0xED, '\u0315'], [0xEE, '\u030B'],
  [0xF0, '\u0327'], [0xF1, '\u0328'], [0xF6, '\u0332'], [0xFE, '\u0313']
]);
const ESPAIADORS = new Map([
  [0xA1, 'Ł'], [0xA2, 'Ø'], [0xA3, 'Đ'], [0xA4, 'Þ'], [0xA5, 'Æ'], [0xA6, 'Œ'],
  [0xA8, '·'], [0xA9, '♭'], [0xAA, '®'], [0xAB, '±'], [0xAE, 'ʼ'], [0xB0, 'ʻ'],
  [0xB1, 'ł'], [0xB2, 'ø'], [0xB3, 'đ'], [0xB4, 'þ'], [0xB5, 'æ'], [0xB6, 'œ'],
  [0xB8, 'ı'], [0xB9, '£'], [0xBA, 'ð'], [0xC3, '©'], [0xC5, '¿'], [0xC6, '¡'], [0xCF, 'ß']
]);

const RE_VERSIO_7 = /^[ \t]*2 VERS 7\.[0-9.]+[ \t]*$/m;
const RE_VERSIO_5 = /^[ \t]*2 VERS 5\.5(?:\.[0-9]+)?[ \t]*$/m;
const RE_ANSEL = /^[ \t]*1 CHAR ANSEL[ \t]*$/im;
const RE_ASCII = /^[ \t]*1 CHAR ASCII[ \t]*$/im;

function capcalera(text) {
  // Un HEAD de mida acotada, acabat abans del primer registre.
  const tros = text.slice(0, 65536).replaceAll('\r', '\n');
  if (!tros.trimStart().startsWith('0 HEAD')) return '';
  const tall = tros.indexOf('\n0 ', tros.indexOf('0 HEAD') + 6);
  return tall < 0 ? tros : tros.slice(0, tall);
}

function llegeixAnsel(bytes) {
  let resultat = '';
  let marques = [];
  for (const byte of bytes) {
    if (MARQUES.has(byte)) {
      if (marques.length >= 8) throw new TypeError('ANSEL');
      marques.push(MARQUES.get(byte));
      continue;
    }
    const car = byte < 0x80 ? String.fromCharCode(byte) : ESPAIADORS.get(byte);
    if (!car || (marques.length && byte <= 0x20)) throw new TypeError('ANSEL');
    resultat += marques.length ? (car + marques.reverse().join('')).normalize('NFC') : car;
    marques = [];
  }
  if (marques.length) throw new TypeError('ANSEL');
  return resultat;
}

/** El GEDCOM 7 és UTF-8. Per al 5.5.x, reconeix ANSEL, ASCII i UTF-16. */
export function descodificaFitxerArbre(bytes) {
  const [primer, segon] = bytes;
  const littleEndian = (primer === 0xff && segon === 0xfe) || (primer === 0x30 && segon === 0);
  const bigEndian = (primer === 0xfe && segon === 0xff) || (primer === 0 && segon === 0x30);
  if (littleEndian || bigEndian) {
    const text = new TextDecoder(littleEndian ? 'utf-16le' : 'utf-16be', { fatal: true }).decode(bytes);
    if (!RE_VERSIO_5.test(capcalera(text))) throw new TypeError('GEDCOM UTF-16');
    return text;
  }
  const cap = capcalera(new TextDecoder('windows-1252').decode(bytes.subarray(0, 65536)));
  if (RE_ANSEL.test(cap)) {
    if (RE_VERSIO_7.test(cap)) throw new TypeError('GEDCOM 7 ANSEL');
    return llegeixAnsel(bytes);
  }
  if (RE_ASCII.test(cap) && bytes.some((byte) => byte > 0x7f)) throw new TypeError('ASCII');
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
