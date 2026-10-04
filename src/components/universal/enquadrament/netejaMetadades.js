/**
 * netejaMetadades.js — Neteja SÍNCRONA i sense pèrdua de les metadades d'una
 * imatge en data URL (Onada 4, RICH-EXIF; ADR multimèdia D4: l'EXIF original
 * es destruïx per defecte). Pur: sense DOM i sense dependències.
 *
 * Per què: el text enriquit accepta <img src="data:image/…;base64,…"> enganxat
 * tal qual (allowBase64 es queda: les notes sense servidor hi desen el data
 * URL de compressImage). Sense esta porta, una foto enganxada viatjaria amb el
 * GPS de casa. transformPastedHTML és síncron: ací no es torna a codificar cap
 * píxel, només es lleven trossos del contenidor.
 *
 * Llista BLANCA, no negra: es conserva el que cal per a pintar i res més.
 *   · JPEG: SOI, APP0 «JFIF», APP2 «ICC_PROFILE», APP14 «Adobe», les taules i
 *     els marcs (DQT, DHT, SOFn, DRI…), cada SOS amb les seues dades i EOI,
 *     byte a byte. Fora: APP1 (Exif, XMP), APP13 (IPTC, Photoshop), la resta
 *     d'APPn (MPF, FlashPix…), COM i tot el que va darrere d'EOI (fotos en
 *     moviment i imatges annexes, que porten el seu propi EXIF).
 *     L'orientació (2 a 8) es torna a escriure en un APP1 nou i mínim
 *     (segmentOrientacio): la foto continua dreta (Llei del Píxel) i no porta
 *     res més de l'original.
 *   · PNG: IHDR, PLTE, IDAT, IEND i els auxiliars de color, transparència i
 *     animació. Fora: eXIf, tEXt, iTXt, zTXt, tIME i qualsevol auxiliar
 *     desconegut. Els CRC dels conservats no es toquen.
 *   · WebP (RIFF): VP8X, ICCP, ANIM, ANMF, ALPH, VP8 i VP8L. Fora: EXIF, XMP i
 *     els desconeguts; es corregixen la mida RIFF i les banderes de VP8X.
 *
 * LLEI: mai llança. Un fitxer que no s'entén torna null i qui crida LLEVA la
 * imatge: conservar-la portaria bytes que ningú ha llegit (privacitat per
 * defecte). Cap bucle depén del que diga el fitxer: cada volta avança.
 */
import { llegixExif } from './exif.js';
import { segmentOrientacio } from './orientacio.js';

/** Pes màxim d'una imatge enganxada: el sostre de MIDA_MAXIMA_IMATGE (useHeroImageHandler.js). */
export const MAX_BYTES_NETEJA = 5 * 1024 * 1024;
/** Caràcters màxims d'un data URL abans de descodificar-lo (base64 i salts de línia de marge). */
export const MAX_LONGITUD_DATA_URL = MAX_BYTES_NETEJA * 2;

export const FORMAT_JPEG = 'image/jpeg';
export const FORMAT_PNG = 'image/png';
export const FORMAT_WEBP = 'image/webp';

const firma = (text) => Array.from(text, (c) => c.charCodeAt(0));
const FIRMA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const FIRMA_JFIF = firma('JFIF\0');
const FIRMA_ICC = firma('ICC_PROFILE\0');
const FIRMA_ADOBE = firma('Adobe');
const FIRMA_EXIF = firma('Exif\0\0');

function comencaPer(bytes, pos, esperat) {
  if (pos < 0 || pos + esperat.length > bytes.length) return false;
  for (let i = 0; i < esperat.length; i += 1) {
    if (bytes[pos + i] !== esperat[i]) return false;
  }
  return true;
}

const text4 = (b, p) => String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]);
const u32be = (b, p) => ((b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]) >>> 0;
const u32le = (b, p) => (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0;

function aBytes(entrada) {
  if (entrada instanceof Uint8Array) return entrada;
  if (entrada instanceof ArrayBuffer) return new Uint8Array(entrada);
  if (ArrayBuffer.isView(entrada)) return new Uint8Array(entrada.buffer, entrada.byteOffset, entrada.byteLength);
  return null;
}

/* Els trossos [inici, fi) que es conserven, en ordre, units en un buffer nou. */
function uneix(bytes, trossos) {
  const total = trossos.reduce((s, [a, b]) => s + (b - a), 0);
  const eixida = new Uint8Array(total);
  let p = 0;
  for (const [a, b] of trossos) {
    eixida.set(bytes.subarray(a, b), p);
    p += b - a;
  }
  return eixida;
}

const sencer = (trossos, n) => trossos.length === 1 && trossos[0][0] === 0 && trossos[0][1] === n;

function iguals(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** El format pels bytes del principi, no pel que diga el data URL. */
export function formatImatge(entrada) {
  const b = aBytes(entrada);
  if (!b || b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return FORMAT_JPEG;
  if (comencaPer(b, 0, FIRMA_PNG)) return FORMAT_PNG;
  if (text4(b, 0) === 'RIFF' && text4(b, 8) === 'WEBP') return FORMAT_WEBP;
  return null;
}

/* ─── JPEG ─────────────────────────────────────────────────────────────── */

const EOI = 0xd9;
const SOI = 0xd8;
const SOS = 0xda;
const TEM = 0x01;
const COM = 0xfe;
const esRst = (m) => m >= 0xd0 && m <= 0xd7;
const esApp = (m) => m >= 0xe0 && m <= 0xef;

/* Només es queden els APPn que canvien com es pinta la foto. */
function appConservat(bytes, marcador, inici, longitud) {
  const te = (esperat) => longitud >= esperat.length && comencaPer(bytes, inici, esperat);
  if (marcador === 0xe0) return te(FIRMA_JFIF);
  if (marcador === 0xe2) return te(FIRMA_ICC);
  if (marcador === 0xee) return te(FIRMA_ADOBE);
  return false;
}

/* Les dades d'un SOS acaben en el primer FF que no és farciment (FF00) ni
   reinici (RSTn). Torna la posició d'eixe FF, o -1 si el fitxer s'acaba abans. */
function fiDadesEntropiques(bytes, inici) {
  let p = inici;
  for (;;) {
    p = bytes.indexOf(0xff, p);
    if (p < 0 || p + 1 >= bytes.length) return -1;
    const seguent = bytes[p + 1];
    if (seguent === 0x00 || esRst(seguent)) p += 2;
    else return p;
  }
}

function netejaJpegCru(bytes) {
  const n = bytes.length;
  if (n < 4 || bytes[0] !== 0xff || bytes[1] !== SOI) return null;
  const trossos = [];
  let cursor = 0;
  let pos = 2;
  let ambImatge = false;
  let exif = null; // [inici, fi) del primer APP1 «Exif» de la capçalera: el que llig el navegador
  for (;;) {
    // Fora de les dades d'un SOS sempre hi ha un marcador.
    if (pos + 1 >= n || bytes[pos] !== 0xff) return null;
    const marcador = bytes[pos + 1];
    if (marcador === 0xff) { pos += 1; continue; } // farciment
    if (marcador === EOI) {
      if (!ambImatge) return null;
      trossos.push([cursor, pos + 2]); // el que hi haja darrere d'EOI es queda fora
      break;
    }
    if (esRst(marcador) || marcador === TEM) { pos += 2; continue; }
    if (marcador < 0xc0 || marcador === SOI) return null; // reservats, FF00 o un segon SOI
    // Revisió · JPG (C8) i JPGn (F0–FD) són reservats amb càrrega lliure: fora de la
    // llista blanca. libjpeg (Chrome, Firefox) tampoc els pinta: no s'entén → null.
    if (marcador === 0xc8 || (marcador >= 0xf0 && marcador <= 0xfd)) return null;
    if (pos + 4 > n) return null;
    const longitud = (bytes[pos + 2] << 8) | bytes[pos + 3];
    const fi = pos + 2 + longitud;
    if (longitud < 2 || fi > n) return null;
    if (marcador === COM || (esApp(marcador) && !appConservat(bytes, marcador, pos + 4, longitud - 2))) {
      if (!exif && !ambImatge && marcador === 0xe1 && longitud >= 16 && comencaPer(bytes, pos + 4, FIRMA_EXIF)) {
        exif = [pos, fi];
      }
      trossos.push([cursor, pos]);
      cursor = fi;
      pos = fi;
      continue;
    }
    if (marcador === SOS) {
      ambImatge = true;
      pos = fiDadesEntropiques(bytes, fi);
      if (pos < 0) return null;
      continue;
    }
    pos = fi;
  }
  let net = sencer(trossos, n) ? bytes : uneix(bytes, trossos);
  // Revisió · L'orientació es llig de l'APP1 que ha trobat este mateix recorregut,
  // encara que vaja darrere de 256 KiB d'ICC (el sostre de llegixExif): el navegador sí que el llig.
  const { orientacio } = exif
    ? llegixExif(uneix(bytes, [[0, 2], exif]), { ambGps: false, ambData: false })
    : { orientacio: null };
  if (Number.isInteger(orientacio) && orientacio >= 2 && orientacio <= 8) {
    // Després de l'APP0 JFIF si n'hi ha (JFIF el vol just després de SOI); si no, després de SOI.
    const punt = net[2] === 0xff && net[3] === 0xe0 ? 4 + ((net[4] << 8) | net[5]) : 2;
    const segment = segmentOrientacio(orientacio);
    const ambOrientacio = new Uint8Array(net.length + segment.length);
    ambOrientacio.set(net.subarray(0, punt), 0);
    ambOrientacio.set(segment, punt);
    ambOrientacio.set(net.subarray(punt), punt + segment.length);
    net = ambOrientacio;
  }
  // Una foto ja neta torna la mateixa referència: res a tornar a escriure.
  return net === bytes || iguals(net, bytes) ? bytes : net;
}

/* ─── PNG ──────────────────────────────────────────────────────────────── */

const PNG_CRITICS = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND']);
const PNG_AUXILIARS = new Set([
  'iCCP', 'sRGB', 'gAMA', 'cHRM', 'sBIT', 'cICP', 'mDCv', 'cLLi', // color
  'pHYs', 'tRNS', 'bKGD', 'hIST', 'sPLT', // presentació i transparència
  'acTL', 'fcTL', 'fdAT', // animació (APNG)
]);
const TIPUS_PNG = /^[A-Za-z]{4}$/;

function netejaPngCru(bytes) {
  const n = bytes.length;
  if (!comencaPer(bytes, 0, FIRMA_PNG)) return null;
  const trossos = [];
  let cursor = 0;
  let pos = 8;
  let ambDades = false;
  for (;;) {
    if (pos + 12 > n) return null;
    const longitud = u32be(bytes, pos);
    const tipus = text4(bytes, pos + 4);
    const fi = pos + 12 + longitud;
    if (!TIPUS_PNG.test(tipus) || longitud > 0x7fffffff || fi > n) return null;
    if (pos === 8 && tipus !== 'IHDR') return null;
    if (tipus === 'IEND') {
      if (!ambDades) return null;
      trossos.push([cursor, fi]); // el que hi haja darrere d'IEND es queda fora
      break;
    }
    if (tipus === 'IDAT') ambDades = true;
    const critic = (bytes[pos + 4] & 0x20) === 0; // majúscula: imprescindible per a pintar
    if (critic && !PNG_CRITICS.has(tipus)) return null;
    if (!critic && !PNG_AUXILIARS.has(tipus)) {
      trossos.push([cursor, pos]);
      cursor = fi;
    }
    pos = fi;
  }
  return sencer(trossos, n) ? bytes : uneix(bytes, trossos);
}

/* ─── WebP ─────────────────────────────────────────────────────────────── */

const WEBP_CONSERVATS = new Set(['VP8X', 'ICCP', 'ANIM', 'ANMF', 'ALPH', 'VP8 ', 'VP8L']);
const WEBP_IMATGE = new Set(['VP8 ', 'VP8L', 'ANMF']);
const WEBP_PRIMERS = new Set(['VP8X', 'VP8 ', 'VP8L']);
const BANDERES_METADADES = 0x08 | 0x04; // E (EXIF) i X (XMP) de VP8X

function netejaWebpCru(bytes) {
  const n = bytes.length;
  if (n < 20 || text4(bytes, 0) !== 'RIFF' || text4(bytes, 8) !== 'WEBP') return null;
  const midaRiff = u32le(bytes, 4);
  const fiRiff = 8 + midaRiff;
  if (midaRiff < 4 || fiRiff > n) return null;
  const trossos = [];
  let cursor = 0;
  let pos = 12;
  let banderes = -1;
  let ambImatge = false;
  while (pos < fiRiff) {
    if (pos + 8 > fiRiff) return null;
    const tipus = text4(bytes, pos);
    const longitud = u32le(bytes, pos + 4);
    const fi = pos + 8 + longitud + (longitud & 1); // els trossos senars porten un byte de farciment
    if (fi > fiRiff) return null;
    if (pos === 12 && !WEBP_PRIMERS.has(tipus)) return null;
    if (tipus === 'VP8X') {
      if (pos !== 12 || longitud < 10) return null;
      banderes = pos + 8;
    }
    if (WEBP_IMATGE.has(tipus)) ambImatge = true;
    if (!WEBP_CONSERVATS.has(tipus)) {
      trossos.push([cursor, pos]);
      cursor = fi;
    }
    pos = fi;
  }
  if (!ambImatge) return null;
  trossos.push([cursor, fiRiff]); // el que hi haja darrere del RIFF es queda fora
  const brutes = banderes >= 0 && (bytes[banderes] & BANDERES_METADADES) !== 0;
  if (sencer(trossos, n) && !brutes) return bytes;
  const net = uneix(bytes, trossos);
  const v = new DataView(net.buffer);
  v.setUint32(4, net.length - 8, true);
  // VP8X sempre és el primer tros: la seua posició no canvia en llevar-ne d'altres.
  if (banderes >= 0) net[banderes] &= ~BANDERES_METADADES;
  return net;
}

/* ─── API ──────────────────────────────────────────────────────────────── */

const ambSeguretat = (fn) => (entrada) => {
  try {
    const bytes = aBytes(entrada);
    if (!bytes || bytes.length > MAX_BYTES_NETEJA) return null;
    return fn(bytes);
  } catch {
    return null;
  }
};

/** JPEG sense metadades (la mateixa referència si ja era net) o null si no s'entén. */
export const netejaJpeg = ambSeguretat(netejaJpegCru);
/** PNG sense metadades (la mateixa referència si ja era net) o null si no s'entén. */
export const netejaPng = ambSeguretat(netejaPngCru);
/** WebP sense metadades (la mateixa referència si ja era net) o null si no s'entén. */
export const netejaWebp = ambSeguretat(netejaWebpCru);

const NETEJADORS = { [FORMAT_JPEG]: netejaJpeg, [FORMAT_PNG]: netejaPng, [FORMAT_WEBP]: netejaWebp };

/**
 * Els bytes d'una imatge sense metadades: { format, bytes, canviat } o null
 * (format desconegut, massa gran o mal format: qui crida la lleva).
 */
export function netejaMetadades(entrada) {
  try {
    const bytes = aBytes(entrada);
    const format = formatImatge(bytes);
    if (!format) return null;
    const net = NETEJADORS[format](bytes);
    return net ? { format, bytes: net, canviat: net !== bytes } : null;
  } catch {
    return null;
  }
}

function deBase64(text) {
  try {
    if (typeof atob !== 'function') return null;
    const binari = atob(text);
    const bytes = new Uint8Array(binari.length);
    for (let i = 0; i < binari.length; i += 1) bytes[i] = binari.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function aBase64(bytes) {
  const PAS = 0x8000; // String.fromCharCode.apply amb trossos: sense desbordar la pila
  let binari = '';
  for (let i = 0; i < bytes.length; i += PAS) {
    binari += String.fromCharCode.apply(null, bytes.subarray(i, i + PAS));
  }
  return btoa(binari);
}

const ESPAI = /[\t\n\f\r ]/;

/* Revisió · La URL com la llig el navegador (WHATWG URL): fora els controls C0
   i els espais dels extrems, i fora TOTS els tabuladors i salts de línia. Si
   no, «data\n:image/…» o «\u0001data:…» passarien per «no és un data URL» i el
   navegador els pintaria igual, amb el GPS. El trim de més (espais Unicode)
   només fa vore més data URL, mai menys. Lineal: res de regex amb «+$». */
function comLaLligElNavegador(src) {
  let inici = 0;
  let fi = src.length;
  while (inici < fi && src.charCodeAt(inici) <= 0x20) inici += 1;
  while (fi > inici && src.charCodeAt(fi - 1) <= 0x20) fi -= 1;
  return src.slice(inici, fi).trim().replace(/[\t\n\r]/g, '');
}

/**
 * La font d'una <img> enganxada, sense metadades.
 *   · No és un data URL, o no és d'imatge: torna `src` tal qual (el decidix
 *     el sanejador, sanitize.js).
 *   · data:image/… en base64 de JPEG, PNG o WebP: torna el data URL net, amb
 *     la capçalera canònica (cap paràmetre com «;name=casa.jpg»). Si ja era
 *     net i canònic, torna el mateix `src`.
 *   · Qualsevol altra imatge (GIF, AVIF, SVG, sense base64, mal formada o de
 *     més de MAX_BYTES_NETEJA): null, i qui crida LLEVA la imatge.
 */
export function netejaFontImatge(src) {
  if (typeof src !== 'string') return src;
  const url = comLaLligElNavegador(src);
  if (!/^data:/i.test(url)) return src;
  const coma = url.indexOf(',');
  const parametres = url.slice(5, coma < 0 ? url.length : coma).split(';').map((p) => p.trim().toLowerCase());
  if (!parametres[0].startsWith('image/')) return src;
  if (coma < 0 || parametres.length < 2 || parametres[parametres.length - 1] !== 'base64') return null;
  if (url.length > MAX_LONGITUD_DATA_URL) return null;
  const dades = url.slice(coma + 1);
  const bytes = deBase64(dades);
  if (!bytes) return null;
  const net = netejaMetadades(bytes);
  if (!net) return null;
  const capcalera = `data:${net.format};base64,`;
  if (!net.canviat && !ESPAI.test(dades)) {
    const canonic = capcalera + dades;
    return canonic === src ? src : canonic;
  }
  return capcalera + aBase64(net.bytes);
}
