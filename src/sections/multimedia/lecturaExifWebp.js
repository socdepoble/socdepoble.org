/**
 * lecturaExifWebp.js — les peces pures per a llegir l'EXIF d'un WebP més gran
 * que el prefix del visor (useMetadadesFoto.js).
 *
 * Gauntlet 261017 (C03 de Codex) · El visor demana els primers MAX_BYTES_EXIF
 * (256 KB) de la foto. En WebP el tros «EXIF» sol anar DARRERE de la imatge, i
 * el lector estricte d'exif.js, que no es toca, rebutja amb raó un RIFF que
 * declara més bytes dels que té: d'un WebP gran el panell deia «Desconegut»
 * encara que la foto portara càmera. Ací no hi ha xarxa ni DOM, només:
 *   · rangDeContentRange: «bytes inici-fi/total», estricte.
 *   · webpAmbExifFora: el prefix és un WebP que anuncia EXIF (el bit E del
 *     VP8X) i el RIFF no hi cap.
 *   · cercaExifWebp: el recorregut dels trossos, que només demana les
 *     capçaleres de 8 bytes; els píxels se salten.
 *   · webpMinim: RIFF + VP8X + EXIF, un WebP menut i ben format que es passa
 *     tal qual a llegixExif.
 * Qui demana els bytes (Range, Content-Range, origen, temps i cancel·lació)
 * és useMetadadesFoto.js.
 */
import { MAX_BYTES_EXIF } from '../../components/universal/enquadrament/exif.js';

const RIFF = 0x52494646; // «RIFF»
const WEBP = 0x57454250; // «WEBP»
const VP8X = 0x56503858; // «VP8X»
const EXIF = 0x45584946; // «EXIF»
/** El bit E (hi ha EXIF) del primer byte del VP8X. */
const BIT_EXIF = 0x08;
/** El VP8X té 10 bytes de dades: els senyals i les mides del llenç. */
const MIDA_VP8X = 10;
/** RIFF, mida i WEBP (12) + la capçalera (8) i les dades (10) del VP8X. */
const CAP_VP8X = 12 + 8 + MIDA_VP8X;
/** Trossos que es recorren com a molt: un tope dur, com el de exif.js. */
const MAX_TROSSOS = 65536;

const vistaDe = (bytes) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

/**
 * Un Content-Range de bytes, «bytes inici-fi/total», com a { inici, fi, total },
 * o null si no és exactament això (cap «*», cap rang buit o fora del total).
 */
export function rangDeContentRange(valor) {
  const m = /^bytes (\d{1,15})-(\d{1,15})\/(\d{1,15})$/i.exec(typeof valor === 'string' ? valor.trim() : '');
  if (!m) return null;
  const [inici, fi, total] = m.slice(1).map(Number);
  return inici <= fi && fi < total ? { inici, fi, total } : null;
}

/**
 * La fi del RIFF (8 + la mida que declara) si `prefix` és el principi d'un
 * WebP amb VP8X que anuncia EXIF i el RIFF no hi cap; si no, 0. Un WebP sense
 * VP8X o sense el bit E no en porta: no cal anar a buscar res.
 */
export function webpAmbExifFora(prefix) {
  if (!(prefix instanceof Uint8Array) || prefix.byteLength < CAP_VP8X) return 0;
  const v = vistaDe(prefix);
  if (v.getUint32(0) !== RIFF || v.getUint32(8) !== WEBP || v.getUint32(12) !== VP8X) return 0;
  if (v.getUint32(16, true) !== MIDA_VP8X || (v.getUint8(20) & BIT_EXIF) === 0) return 0;
  const fi = 8 + v.getUint32(4, true);
  return fi > prefix.byteLength ? fi : 0;
}

/**
 * El recorregut dels trossos d'un WebP que acaba a `fi`: demana la capçalera
 * de cada tros (yield pos) i rep una DataView d'eixos 8 bytes, o null si no
 * hi són. Torna { inici, mida } de les dades del tros «EXIF», o null si no
 * n'hi ha, si una longitud ix del RIFF o si el tros no pot portar un TIFF
 * (menys de 8 bytes) o passa de MAX_BYTES_EXIF (el mateix sostre que
 * llegixExif).
 */
export function* cercaExifWebp(fi) {
  let pos = 12;
  for (let n = 0; n < MAX_TROSSOS && pos + 8 <= fi; n += 1) {
    const c = yield pos;
    if (!c || c.byteLength < 8) return null;
    const mida = c.getUint32(4, true);
    const inici = pos + 8;
    if (inici + mida > fi) return null; // truncat, o una longitud absurda
    if (c.getUint32(0) === EXIF) return mida >= 8 && mida <= MAX_BYTES_EXIF ? { inici, mida } : null;
    pos = inici + mida + (mida & 1); // el farciment dels trossos senars
  }
  return null;
}

/**
 * Un WebP menut i ben format: el RIFF (amb la mida que li toca), el VP8X del
 * prefix i el tros EXIF. El llig llegixExif sense relaxar cap regla.
 */
export function webpMinim(prefix, exif) {
  const farciment = exif.byteLength & 1;
  const b = new Uint8Array(CAP_VP8X + 8 + exif.byteLength + farciment);
  const v = vistaDe(b);
  b.set(prefix.subarray(0, CAP_VP8X), 0);
  v.setUint32(4, b.byteLength - 8, true);
  v.setUint32(CAP_VP8X, EXIF);
  v.setUint32(CAP_VP8X + 4, exif.byteLength, true);
  b.set(exif, CAP_VP8X + 8);
  return b;
}
