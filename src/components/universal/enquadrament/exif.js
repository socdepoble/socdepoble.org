/**
 * exif.js — Lector d'EXIF propi i mínim per a JPEG (Onada 4, T3a; ADR
 * multimèdia §3.1). Sense dependències i sense DOM: es prova en Node.
 *
 * Llig NOMÉS el que el retallador necessita:
 *   · IFD0 › Orientation (0x0112).
 *   · Exif IFD (0x8769) › DateTimeOriginal (0x9003) i OffsetTimeOriginal (0x9011).
 *   · GPS IFD (0x8825) › LatitudeRef, Latitude, LongitudeRef, Longitude,
 *     AltitudeRef i Altitude (1 a 6).
 *
 * LLEI: no llança mai. Un fitxer truncat, un desplaçament fora del buffer, un
 * IFD que apunta a si mateix o un nombre d'entrades absurd tornen «sense
 * dades». Els límits són durs: cap bucle depén del que diga el fitxer.
 *
 * No escriu res: el fitxer que ix del retallador és un canvas nou i no porta
 * cap EXIF (ADR D4). Les coordenades viatgen com a camps (D6).
 */

/** El que es llig del principi del fitxer: l'APP1 ha d'anar abans de la imatge. */
export const MAX_BYTES_EXIF = 256 * 1024;
/** Segments JPEG que es miren abans de rendir-se. */
const MAX_SEGMENTS = 64;
/** Entrades per IFD: un IFD0 real en porta poques desenes. */
const MAX_ENTRADES_IFD = 512;
/** Caràcters d'un camp ASCII de data («AAAA:MM:DD hh:mm:ss» + NUL). */
const MAX_ASCII = 64;

const TAG_ORIENTACIO = 0x0112;
const TAG_EXIF_IFD = 0x8769;
const TAG_GPS_IFD = 0x8825;
const TAG_DATA_ORIGINAL = 0x9003;
const TAG_ZONA_ORIGINAL = 0x9011;
const GPS_REF_LAT = 1;
const GPS_LAT = 2;
const GPS_REF_LNG = 3;
const GPS_LNG = 4;
const GPS_REF_ALT = 5;
const GPS_ALT = 6;

const TIPUS_BYTE = 1;
const TIPUS_ASCII = 2;
const TIPUS_SHORT = 3;
const TIPUS_LONG = 4;
const TIPUS_RATIONAL = 5;
const TIPUS_UNDEFINED = 7;
const TIPUS_IFD = 13; // alguns programes escriuen així els punters 0x8769 i 0x8825
const MIDA_TIPUS = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8, 13: 4 };

/** Una còpia nova cada vegada: qui la rep la pot modificar sense tacar-ne cap altra. */
export function senseDades() {
  return { orientacio: null, gps: null, dataCaptura: null };
}

/** Coordenades possibles: finites, dins del rang i no el 0/0 d'un GPS sense senyal. */
export function coordenadesValides(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  // Un receptor sense posició escriu zeros: el golf de Guinea no és cap poble nostre.
  return !(lat === 0 && lng === 0);
}

function vistaDe(entrada) {
  if (entrada instanceof ArrayBuffer) return new DataView(entrada);
  if (ArrayBuffer.isView(entrada)) return new DataView(entrada.buffer, entrada.byteOffset, entrada.byteLength);
  return null;
}

/* La «vista» del TIFF: tots els desplaçaments de l'EXIF compten des de la
   capçalera II/MM i no poden eixir del segment APP1. */
function lectorTiff(v, inici, mida) {
  const le = v.getUint16(inici) === 0x4949;
  const dins = (pos, n) => Number.isInteger(pos) && pos >= 0 && n >= 0 && pos + n <= mida;
  return {
    le,
    dins,
    u8: (pos) => v.getUint8(inici + pos),
    u16: (pos) => v.getUint16(inici + pos, le),
    u32: (pos) => v.getUint32(inici + pos, le),
  };
}

/* Un IFD com a Map(tag → entrada). Només es guarden els tags demanats. Un
   desplaçament ja visitat (bucle) o fora del TIFF torna null. */
function llegixIfd(t, offset, tags, visitats) {
  if (visitats.has(offset) || !t.dins(offset, 2)) return null;
  visitats.add(offset);
  const nombre = t.u16(offset);
  if (nombre === 0 || nombre > MAX_ENTRADES_IFD || !t.dins(offset + 2, nombre * 12)) return null;
  const entrades = new Map();
  for (let i = 0; i < nombre; i += 1) {
    const p = offset + 2 + i * 12;
    const tag = t.u16(p);
    if (!tags.has(tag)) continue;
    const tipus = t.u16(p + 2);
    const quantitat = t.u32(p + 4);
    const midaTipus = MIDA_TIPUS[tipus];
    if (!midaTipus || quantitat === 0) continue;
    const bytes = midaTipus * quantitat;
    // Fins a 4 bytes el valor va dins de l'entrada; si no, l'entrada en diu on és.
    const pos = bytes <= 4 ? p + 8 : t.u32(p + 8);
    if (!t.dins(pos, bytes)) continue;
    entrades.set(tag, { tipus, quantitat, pos });
  }
  return entrades;
}

function enter(t, e) {
  if (!e || e.quantitat < 1) return null;
  if (e.tipus === TIPUS_SHORT) return t.u16(e.pos);
  if (e.tipus === TIPUS_LONG || e.tipus === TIPUS_IFD) return t.u32(e.pos);
  if (e.tipus === TIPUS_BYTE || e.tipus === TIPUS_UNDEFINED) return t.u8(e.pos);
  return null;
}

function text(t, e) {
  if (!e || e.tipus !== TIPUS_ASCII || e.quantitat > MAX_ASCII) return null;
  let s = '';
  for (let i = 0; i < e.quantitat; i += 1) {
    const c = t.u8(e.pos + i);
    if (c === 0) break;
    if (c < 0x20 || c > 0x7e) return null;
    s += String.fromCharCode(c);
  }
  return s;
}

/** RATIONAL sense signe; un denominador 0 fa la lectura impossible (NaN). */
function racionals(t, e, n) {
  if (!e || e.tipus !== TIPUS_RATIONAL || e.quantitat < n) return null;
  const valors = [];
  for (let i = 0; i < n; i += 1) {
    const num = t.u32(e.pos + i * 8);
    const den = t.u32(e.pos + i * 8 + 4);
    valors.push(den === 0 ? Number.NaN : num / den);
  }
  return valors;
}

function graus(t, e) {
  const v = racionals(t, e, 3);
  if (!v || v.some((x) => !Number.isFinite(x))) return Number.NaN;
  const [g, m, s] = v;
  if (m >= 60 || s >= 60) return Number.NaN;
  return g + m / 60 + s / 3600;
}

const arrodonix7 = (x) => Math.round(x * 1e7) / 1e7; // ~1 cm: sense soroll de coma flotant

function llegixGps(t, ifd) {
  const refLat = text(t, ifd.get(GPS_REF_LAT));
  const refLng = text(t, ifd.get(GPS_REF_LNG));
  if (!/^[NS]$/.test(refLat || '') || !/^[EW]$/.test(refLng || '')) return null;
  // Revisió (K5) · Es comprova el que es TORNA, ja arrodonit: 1e-9/1e-9 no és 0/0 abans i sí després.
  const lat = arrodonix7(graus(t, ifd.get(GPS_LAT)) * (refLat === 'S' ? -1 : 1));
  const lng = arrodonix7(graus(t, ifd.get(GPS_LNG)) * (refLng === 'W' ? -1 : 1));
  if (!coordenadesValides(lat, lng)) return null;
  const alt = racionals(t, ifd.get(GPS_ALT), 1)?.[0];
  const davall = enter(t, ifd.get(GPS_REF_ALT)) === 1;
  const altitud = Number.isFinite(alt) ? Math.round((davall ? -alt : alt) * 100) / 100 : null;
  return { lat, lng, altitud };
}

/* Revisió (K5) · El dia ha d'existir en eixe mes i any (cap 31 d'abril ni 29
   de febrer d'un any que no és de traspàs): la data va a una columna (D6). */
function diaExistix(any, mes, dia) {
  const data = new Date(Date.UTC(2000, mes - 1, dia));
  data.setUTCFullYear(any);
  return data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

/* «AAAA:MM:DD hh:mm:ss» (+ «+hh:mm») → «AAAA-MM-DDThh:mm:ss[+hh:mm]». Una
   data buida o de zeros (càmeres sense rellotge) no és cap data. */
function llegixData(t, ifd) {
  const brut = text(t, ifd.get(TAG_DATA_ORIGINAL));
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(brut || '');
  if (!m) return null;
  const [, a, mes, d, h, min, s] = m;
  const n = [a, mes, d, h, min, s].map(Number);
  if (n[0] < 1800 || n[1] < 1 || n[1] > 12 || n[2] < 1 || n[2] > 31 || n[3] > 23 || n[4] > 59 || n[5] > 59) return null;
  if (!diaExistix(n[0], n[1], n[2])) return null;
  const zona = text(t, ifd.get(TAG_ZONA_ORIGINAL));
  const sufix = /^[+-](0\d|1[0-4]):[0-5]\d$/.test(zona || '') ? zona : '';
  return `${a}-${mes}-${d}T${h}:${min}:${s}${sufix}`;
}

function llegixTiff(v, inici, mida, { ambGps, ambData }) {
  if (mida < 8) return senseDades();
  const marca = v.getUint16(inici);
  if (marca !== 0x4949 && marca !== 0x4d4d) return senseDades();
  const t = lectorTiff(v, inici, mida);
  if (t.u16(2) !== 42) return senseDades();
  const visitats = new Set();
  const ifd0 = llegixIfd(t, t.u32(4), new Set([TAG_ORIENTACIO, TAG_EXIF_IFD, TAG_GPS_IFD]), visitats);
  if (!ifd0) return senseDades();
  const resultat = senseDades();
  const o = enter(t, ifd0.get(TAG_ORIENTACIO));
  resultat.orientacio = Number.isInteger(o) && o >= 1 && o <= 8 ? o : null;
  if (ambData) {
    const punter = enter(t, ifd0.get(TAG_EXIF_IFD));
    const exif = punter === null ? null : llegixIfd(t, punter, new Set([TAG_DATA_ORIGINAL, TAG_ZONA_ORIGINAL]), visitats);
    if (exif) resultat.dataCaptura = llegixData(t, exif);
  }
  if (ambGps) {
    const punter = enter(t, ifd0.get(TAG_GPS_IFD));
    const gps = punter === null ? null
      : llegixIfd(t, punter, new Set([GPS_REF_LAT, GPS_LAT, GPS_REF_LNG, GPS_LNG, GPS_REF_ALT, GPS_ALT]), visitats);
    if (gps) resultat.gps = llegixGps(t, gps);
  }
  return resultat;
}

const esCapcaleraExif = (v, pos) => v.getUint32(pos) === 0x45786966 && v.getUint16(pos + 4) === 0; // «Exif\0\0»

/* Recorre els segments del JPEG fins al primer APP1 «Exif». Torna
   { inici, mida } del TIFF o null. Para en SOS/EOI: l'EXIF va abans. */
function trobaTiff(v) {
  const limit = Math.min(v.byteLength, MAX_BYTES_EXIF);
  if (limit < 4 || v.getUint16(0) !== 0xffd8) return null;
  let pos = 2;
  for (let n = 0; n < MAX_SEGMENTS && pos + 4 <= limit; n += 1) {
    if (v.getUint8(pos) !== 0xff) return null;
    const marcador = v.getUint8(pos + 1);
    if (marcador === 0xff) { pos += 1; continue; } // farciment
    if (marcador === 0xd9 || marcador === 0xda) return null; // EOI, SOS
    if (marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) { pos += 2; continue; } // sense longitud
    const longitud = v.getUint16(pos + 2);
    const fi = pos + 2 + longitud;
    if (longitud < 2 || fi > v.byteLength) return null; // truncat
    if (marcador === 0xe1 && longitud >= 16 && esCapcaleraExif(v, pos + 4)) {
      return { inici: pos + 10, mida: longitud - 8 };
    }
    pos = fi;
  }
  return null;
}

/**
 * Llig orientació, GPS i data de captura d'un JPEG (ArrayBuffer o vista).
 * `ambGps: false` no toca el bloc GPS (l'orientació sola, per a dibuixar).
 * Torna sempre { orientacio: 1..8|null, gps: { lat, lng, altitud|null }|null, dataCaptura: string|null }.
 */
export function llegixExif(buffer, { ambGps = true, ambData = true } = {}) {
  try {
    const v = vistaDe(buffer);
    if (!v) return senseDades();
    const tiff = trobaTiff(v);
    if (!tiff) return senseDades();
    return llegixTiff(v, tiff.inici, tiff.mida, { ambGps, ambData });
  } catch {
    return senseDades();
  }
}

/** Hi ha cap segment APP1 «Exif» abans de la imatge? (per a comprovar que el que ix en va net) */
export function teExif(buffer) {
  try {
    const v = vistaDe(buffer);
    return Boolean(v && trobaTiff(v));
  } catch {
    return false;
  }
}

/* Blob.arrayBuffer és de la Baseline; FileReader queda per als entorns que
   no el tenen (jsdom antic). */
function bytesDe(blob) {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resol, rebutja) => {
    const lector = new FileReader();
    lector.onload = () => resol(lector.result);
    lector.onerror = () => rebutja(lector.error);
    lector.readAsArrayBuffer(blob);
  });
}

/**
 * El mateix que llegixExif, d'un File o Blob: només en llig els primers
 * MAX_BYTES_EXIF (blob.slice). Mai rebutja: si no es pot llegir, sense dades.
 */
export async function llegixMetadadesImatge(fitxer, opcions) {
  try {
    if (typeof Blob === 'undefined' || !(fitxer instanceof Blob)) return senseDades();
    return llegixExif(await bytesDe(fitxer.slice(0, MAX_BYTES_EXIF)), opcions);
  } catch {
    return senseDades();
  }
}
