/**
 * imatges.js — capçaleres de JPEG, PNG i WebP llegides en bytes, sense
 * decodificar la imatge: format, amplada, alçada i si porta EXIF i ubicació
 * GPS. Pur i defensiu: un fitxer tallat o estrany no llança mai, torna el que
 * s'ha pogut llegir (null on no se sap).
 *
 * La ubicació es busca a l'IFD GPS de l'EXIF (etiqueta 0x8825 de l'IFD0) i
 * compta si hi ha latitud (0x0002) o longitud (0x0004). L'orientació EXIF no
 * es té en compte: les dimensions són les de la capçalera.
 */

const SIGNATURA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const ETIQUETA_GPS = 0x8825;
const GPS_LATITUD = 0x0002;
const GPS_LONGITUD = 0x0004;
const MAX_ENTRADES_IFD = 512;
/* SOF0-SOF15 menys DHT (C4), JPG (C8) i DAC (CC): els que porten les dimensions. */
const MARCADORS_SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

const ascii = (b, inici, n) => (inici + n <= b.length ? String.fromCharCode(...b.subarray(inici, inici + n)) : '');
const u16be = (b, i) => (i + 2 <= b.length ? (b[i] << 8) | b[i + 1] : null);
const u16le = (b, i) => (i + 2 <= b.length ? b[i] | (b[i + 1] << 8) : null);
const u24le = (b, i) => (i + 3 <= b.length ? b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) : null);
const u32be = (b, i) => (i + 4 <= b.length ? ((b[i] << 24) >>> 0) + ((b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) : null);
const u32le = (b, i) => (i + 4 <= b.length ? ((b[i + 3] << 24) >>> 0) + ((b[i + 2] << 16) | (b[i + 1] << 8) | b[i]) : null);

/**
 * Busca l'IFD GPS dins d'un bloc TIFF (l'EXIF). true si porta latitud o
 * longitud, false si no, null si el bloc no es pot llegir.
 */
export function tiffTeGps(bytes, inici, longitud) {
  const fi = Math.min(bytes.length, inici + Math.max(0, longitud));
  const b = bytes.subarray(inici, fi);
  const ordre = ascii(b, 0, 2);
  if (ordre !== 'II' && ordre !== 'MM') return null;
  const u16 = ordre === 'II' ? u16le : u16be;
  const u32 = ordre === 'II' ? u32le : u32be;
  if (u16(b, 2) !== 42) return null;
  const etiquetesDe = (offset) => {
    const n = u16(b, offset);
    if (n === null || n > MAX_ENTRADES_IFD) return null;
    const etiquetes = new Map();
    for (let k = 0; k < n; k += 1) {
      const e = offset + 2 + k * 12;
      const etiqueta = u16(b, e);
      const valor = u32(b, e + 8);
      if (etiqueta === null || valor === null) return null;
      etiquetes.set(etiqueta, valor);
    }
    return etiquetes;
  };
  const ifd0 = u32(b, 4);
  const primer = ifd0 === null ? null : etiquetesDe(ifd0);
  if (!primer) return null;
  if (!primer.has(ETIQUETA_GPS)) return false;
  const gps = etiquetesDe(primer.get(ETIQUETA_GPS));
  if (!gps) return null;
  return gps.has(GPS_LATITUD) || gps.has(GPS_LONGITUD);
}

const prefixExif = (b, i) => ascii(b, i, 6) === 'Exif\u0000\u0000';
/* P1-64 (revisió adversarial 261028) · Una imatge pot portar més d'un EXIF: si
   qualsevol diu ubicació, en porta; si cap no ho diu i un no es llig, no se sap. */
const ambGps = (abans, ara) => (abans === true || ara === true ? true : abans === null || ara === null ? null : false);

function llegixPng(b) {
  const r = { format: 'png', amplada: null, alcada: null, exif: false, gps: false };
  if (ascii(b, 12, 4) === 'IHDR') {
    r.amplada = u32be(b, 16);
    r.alcada = u32be(b, 20);
  }
  for (let o = 8; o + 8 <= b.length;) {
    const n = u32be(b, o);
    const tipus = ascii(b, o + 4, 4);
    if (n === null || o + 12 + n > b.length) break;
    if (tipus === 'eXIf') {
      r.exif = true;
      r.gps = ambGps(r.gps, tiffTeGps(b, o + 8, n));
    }
    if (tipus === 'IEND') break;
    o += 12 + n;
  }
  return r;
}

function llegixJpeg(b) {
  const r = { format: 'jpeg', amplada: null, alcada: null, exif: false, gps: false };
  let o = 2;
  while (o + 4 <= b.length) {
    if (b[o] !== 0xff) break;
    const marcador = b[o + 1];
    if (marcador === 0xff) {
      o += 1;
      continue;
    }
    if (marcador === 0xd8 || marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) {
      o += 2;
      continue;
    }
    if (marcador === 0xd9 || marcador === 0xda) break;
    const n = u16be(b, o + 2);
    if (n === null || n < 2) break;
    if (marcador === 0xe1 && prefixExif(b, o + 4)) {
      r.exif = true;
      r.gps = ambGps(r.gps, tiffTeGps(b, o + 10, n - 8));
    } else if (MARCADORS_SOF.has(marcador)) {
      r.alcada = u16be(b, o + 5);
      r.amplada = u16be(b, o + 7);
    }
    o += 2 + n;
  }
  return r;
}

function llegixWebp(b) {
  const r = { format: 'webp', amplada: null, alcada: null, exif: false, gps: false };
  for (let o = 12; o + 8 <= b.length;) {
    const tipus = ascii(b, o, 4);
    const n = u32le(b, o + 4);
    const d = o + 8;
    if (n === null || d + n > b.length) break;
    if (tipus === 'VP8X') {
      r.amplada = 1 + u24le(b, d + 4);
      r.alcada = 1 + u24le(b, d + 7);
    } else if (tipus === 'VP8 ' && r.amplada === null) {
      if (b[d + 3] === 0x9d && b[d + 4] === 0x01 && b[d + 5] === 0x2a) {
        r.amplada = u16le(b, d + 6) & 0x3fff;
        r.alcada = u16le(b, d + 8) & 0x3fff;
      }
    } else if (tipus === 'VP8L' && r.amplada === null) {
      if (b[d] === 0x2f && d + 5 <= b.length) {
        const [b1, b2, b3, b4] = [b[d + 1], b[d + 2], b[d + 3], b[d + 4]];
        r.amplada = 1 + (((b2 & 0x3f) << 8) | b1);
        r.alcada = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
      }
    } else if (tipus === 'EXIF') {
      r.exif = true;
      const salt = prefixExif(b, d) ? 6 : 0;
      r.gps = ambGps(r.gps, tiffTeGps(b, d + salt, n - salt));
    }
    o = d + n + (n % 2);
  }
  return r;
}

/**
 * @param {Uint8Array} bytes
 * @returns {{ format: 'jpeg'|'png'|'webp'|null, amplada: number|null, alcada: number|null, exif: boolean, gps: boolean|null }}
 */
export function llegixCapcalera(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(0);
  if (SIGNATURA_PNG.every((x, i) => b[i] === x)) return llegixPng(b);
  if (b[0] === 0xff && b[1] === 0xd8) return llegixJpeg(b);
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return llegixWebp(b);
  return { format: null, amplada: null, alcada: null, exif: false, gps: false };
}
