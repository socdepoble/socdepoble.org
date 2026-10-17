/**
 * exif.js — Lector d'EXIF propi i mínim per a JPEG, PNG i WebP (Onada 4,
 * T3a; ADR multimèdia §3.1). Sense dependències (només limits.js) i sense
 * DOM: es prova en Node.
 *
 * Gauntlet 261016 (P2 de Codex, 02:04:33) · On és el bloc TIFF de l'EXIF:
 *   · JPEG: el primer APP1 «Exif» abans de la imatge (SOS).
 *   · PNG: el tros «eXIf» (el primer tros ha de ser l'IHDR; IEND tanca).
 *   · WebP: el tros «EXIF» del RIFF (sol anar darrere de la imatge).
 *   En PNG i WebP el TIFF va tal qual; si porta «Exif\0\0» al davant (com
 *   l'APP1), també es llig. Són les regles d'extreuTiff (exifIncrustat.js):
 *   l'EXIF que la pujada hi torna a posar, amb l'orientació a 1, és el mateix
 *   que este lector ha llegit per a girar la foto. Els CRC del PNG són feina
 *   del descodificador del navegador, no d'este lector.
 * El format es reconeix pels bytes, no pel MIME, amb la regla de formatImatge
 * (netejaMetadades.js, que importa este mòdul i per això no s'hi pot
 * importar). D'un File o Blob es llig el prefix de sempre (MAX_BYTES_EXIF) i,
 * en PNG i WebP, més enllà del prefix, només les capçaleres de 8 bytes dels
 * trossos i el tros de l'EXIF: els píxels que hi ha entremig no es carreguen.
 * Només si calen més de MAX_SEGMENTS capçaleres fora del prefix (un PNG amb
 * molts IDAT davant de l'eXIf) es llig el fitxer sencer, una vegada i fins a
 * PES_MAXIM_ENTRADA, com fa extreuTiff.
 *
 * Llig NOMÉS el que el retallador necessita:
 *   · IFD0 › Orientation (0x0112).
 *   · Exif IFD (0x8769) › DateTimeOriginal (0x9003) i OffsetTimeOriginal (0x9011).
 *   · GPS IFD (0x8825) › LatitudeRef, Latitude, LongitudeRef, Longitude,
 *     AltitudeRef i Altitude (1 a 6).
 *
 * Onada 0.3 (Gauntlet 261016, visor de l'Arxiu visual) · Amb `ambCamera:
 * true`, i només amb ella, també IFD0 › Make (0x010F), Model (0x0110), Artist
 * (0x013B) i Copyright (0x8298): el panell del visor diu la càmera, l'autor i
 * els drets que la foto declara. Les claus noves (camera, autor, copyright)
 * només ixen amb l'opció: la sortida per defecte continua sent la de
 * senseDades(), amb les tres claus de sempre. Els textos són ASCII imprimible
 * (el tipus ASCII de l'EXIF), sense els espais del final que hi posen moltes
 * càmeres, i fins a MAX_ASCII_TEXT caràcters; el Copyright en porta dos
 * separats per NUL (fotògraf i editor) i se'n llig el primer.
 *
 * LLEI: no llança mai. Un fitxer truncat, un desplaçament fora del buffer (o
 * del tros), un IFD que apunta a si mateix o un nombre d'entrades absurd
 * tornen «sense dades». Els límits són durs: cap bucle depén del que diga el
 * fitxer.
 *
 * No escriu res: el fitxer que ix del retallador és un canvas nou i no porta
 * cap EXIF (ADR D4). Les coordenades viatgen com a camps (D6).
 */
import { PES_MAXIM_ENTRADA } from './limits.js';

/**
 * El que es llig del principi del fitxer (l'APP1 d'un JPEG ha d'anar abans de
 * la imatge) i, en PNG i WebP, la mida màxima del tros de l'EXIF.
 */
export const MAX_BYTES_EXIF = 256 * 1024;
/**
 * Segments JPEG que es miren abans de rendir-se; d'un File, també les
 * capçaleres de PNG i WebP que es llegixen d'una en una fora del prefix.
 */
const MAX_SEGMENTS = 64;
/**
 * Trossos PNG o WebP que es recorren com a molt: cada un avança 8 bytes o
 * més, i n'hi caben més dels que porta un PNG de PES_MAXIM_ENTRADA amb IDAT
 * de 512 bytes.
 */
const MAX_TROSSOS = 65536;

const FORMAT_JPEG = 'image/jpeg';
const FORMAT_PNG = 'image/png';
const FORMAT_WEBP = 'image/webp';
const TROS_IHDR = 0x49484452;
const TROS_IEND = 0x49454e44;
const TROS_EXIF_PNG = 0x65584966; // «eXIf»
const TROS_EXIF_WEBP = 0x45584946; // «EXIF»
/** Entrades per IFD: un IFD0 real en porta poques desenes. */
const MAX_ENTRADES_IFD = 512;
/** Caràcters d'un camp ASCII de data («AAAA:MM:DD hh:mm:ss» + NUL). */
const MAX_ASCII = 64;
/** Caràcters de la càmera, l'autor o els drets: un avís de copyright és més llarg que una data. */
const MAX_ASCII_TEXT = 256;

const TAG_MARCA = 0x010f;
const TAG_MODEL = 0x0110;
const TAG_AUTOR = 0x013b;
const TAG_COPYRIGHT = 0x8298;
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

/* Sense dades, amb la forma que demana l'opció: amb `ambCamera`, també les
   tres claus de la càmera, l'autor i els drets, a null. */
function buitPer(ambCamera) {
  return ambCamera ? { ...senseDades(), camera: null, autor: null, copyright: null } : senseDades();
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

function text(t, e, maxim = MAX_ASCII) {
  if (!e || e.tipus !== TIPUS_ASCII || e.quantitat > maxim) return null;
  let s = '';
  for (let i = 0; i < e.quantitat; i += 1) {
    const c = t.u8(e.pos + i);
    if (c === 0) break;
    if (c < 0x20 || c > 0x7e) return null;
    s += String.fromCharCode(c);
  }
  return s;
}

/* Un text descriptiu (càmera, autor, drets): sense els espais de farciment i,
   buit, null. */
function textNet(t, e) {
  const s = text(t, e, MAX_ASCII_TEXT);
  const net = s === null ? '' : s.trim();
  return net === '' ? null : net;
}

/* La càmera: { marca, model } o null. Moltes càmeres repetixen la marca al
   model («Canon» i «Canon EOS 5D»): es tornen tal com les escriu el fitxer. */
function llegixCamera(t, ifd0) {
  const marca = textNet(t, ifd0.get(TAG_MARCA));
  const model = textNet(t, ifd0.get(TAG_MODEL));
  return marca || model ? { marca, model } : null;
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

function llegixTiff(v, inici, mida, { ambGps, ambData, ambCamera = false }) {
  if (mida < 8) return buitPer(ambCamera);
  const marca = v.getUint16(inici);
  if (marca !== 0x4949 && marca !== 0x4d4d) return buitPer(ambCamera);
  const t = lectorTiff(v, inici, mida);
  if (t.u16(2) !== 42) return buitPer(ambCamera);
  const visitats = new Set();
  const tags0 = [TAG_ORIENTACIO, TAG_EXIF_IFD, TAG_GPS_IFD, ...(ambCamera ? [TAG_MARCA, TAG_MODEL, TAG_AUTOR, TAG_COPYRIGHT] : [])];
  const ifd0 = llegixIfd(t, t.u32(4), new Set(tags0), visitats);
  if (!ifd0) return buitPer(ambCamera);
  const resultat = buitPer(ambCamera);
  const o = enter(t, ifd0.get(TAG_ORIENTACIO));
  resultat.orientacio = Number.isInteger(o) && o >= 1 && o <= 8 ? o : null;
  if (ambCamera) {
    resultat.camera = llegixCamera(t, ifd0);
    resultat.autor = textNet(t, ifd0.get(TAG_AUTOR));
    resultat.copyright = textNet(t, ifd0.get(TAG_COPYRIGHT));
  }
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

/* El format pels bytes del principi (la regla de formatImatge). */
function formatDe(v) {
  if (v.byteLength < 12) return null;
  if (v.getUint16(0) === 0xffd8 && v.getUint8(2) === 0xff) return FORMAT_JPEG;
  if (v.getUint32(0) === 0x89504e47 && v.getUint32(4) === 0x0d0a1a0a) return FORMAT_PNG;
  if (v.getUint32(0) === 0x52494646 && v.getUint32(8) === 0x57454250) return FORMAT_WEBP; // RIFF … WEBP
  return null;
}

const esJpeg = (v) => v.byteLength >= 2 && v.getUint16(0) === 0xffd8;

/* Recorre els segments del JPEG fins al primer APP1 «Exif». Torna
   { inici, mida } del TIFF o null. Para en SOS/EOI: l'EXIF va abans. */
function trobaTiffJpeg(v) {
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

/* Gauntlet 261016 · El recorregut dels trossos d'un PNG o d'un WebP, escrit
   UNA vegada per als dos lectors (un buffer sencer o un File per trossos):
   demana els bytes que necessita (yield [pos, n]) i rep una DataView d'eixos
   n bytes, o null si no hi són. Torna { inici, mida } del tros de l'EXIF o
   null. El contingut dels altres trossos (els píxels) no es demana mai: se
   salta movent el cursor. `capcalera` són els 12 primers bytes i `total`, la
   mida del fitxer; el RIFF no en pot passar. */
function* cercaTrosExif(format, capcalera, total) {
  const png = format === FORMAT_PNG;
  const fi = png ? total : 8 + capcalera.getUint32(4, true);
  if (fi < 12 || fi > total) return null;
  const minim = png ? 12 : 8; // longitud i tipus; en PNG, també el CRC
  let pos = png ? 8 : 12;
  for (let n = 0; n < MAX_TROSSOS && pos + minim <= fi; n += 1) {
    const c = yield [pos, 8];
    if (!c) return null;
    const mida = c.getUint32(png ? 0 : 4, !png);
    const tipus = c.getUint32(png ? 4 : 0);
    const inici = pos + 8;
    if (inici + mida + (png ? 4 : 0) > fi) return null; // truncat, o una longitud absurda
    if (png && (n === 0 ? tipus !== TROS_IHDR : tipus === TROS_IEND)) return null;
    if (tipus === (png ? TROS_EXIF_PNG : TROS_EXIF_WEBP)) return mida <= MAX_BYTES_EXIF ? { inici, mida } : null;
    pos = inici + mida + (png ? 4 : mida & 1); // el CRC del PNG; el farciment dels trossos senars del RIFF
  }
  return null;
}

/* El TIFF d'un tros, sense «Exif\0\0» al davant si n'hi ha. */
function tiffDelTros(v, inici, mida) {
  const t = mida >= 6 && esCapcaleraExif(v, inici) ? { inici: inici + 6, mida: mida - 6 } : { inici, mida };
  return t.mida >= 8 ? t : null;
}

/* On és el TIFF dins d'un buffer sencer: { inici, mida } o null. */
function trobaTiff(v) {
  if (esJpeg(v)) return trobaTiffJpeg(v);
  const format = formatDe(v);
  if (format !== FORMAT_PNG && format !== FORMAT_WEBP) return null;
  const cerca = cercaTrosExif(format, v, v.byteLength);
  let pas = cerca.next();
  while (!pas.done) {
    const [pos, n] = pas.value;
    pas = cerca.next(pos + n <= v.byteLength ? new DataView(v.buffer, v.byteOffset + pos, n) : null);
  }
  return pas.value && tiffDelTros(v, pas.value.inici, pas.value.mida);
}

/**
 * Llig orientació, GPS i data de captura d'un JPEG, un PNG o un WebP
 * (ArrayBuffer o vista). `ambGps: false` no toca el bloc GPS (l'orientació
 * sola, per a dibuixar).
 * Torna sempre { orientacio: 1..8|null, gps: { lat, lng, altitud|null }|null, dataCaptura: string|null }.
 * Amb `ambCamera: true`, a més, { camera: { marca, model }|null, autor: string|null, copyright: string|null }.
 */
export function llegixExif(buffer, { ambGps = true, ambData = true, ambCamera = false } = {}) {
  try {
    const v = vistaDe(buffer);
    if (!v) return buitPer(ambCamera);
    const tiff = trobaTiff(v);
    if (!tiff) return buitPer(ambCamera);
    return llegixTiff(v, tiff.inici, tiff.mida, { ambGps, ambData, ambCamera });
  } catch {
    return buitPer(ambCamera);
  }
}

/**
 * Porta cap EXIF que es llegiria (l'APP1 «Exif» d'un JPEG abans de la imatge,
 * l'eXIf d'un PNG o l'EXIF d'un WebP)? Per a comprovar que el que ix en va net.
 */
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

/* El que llig cercaTrosExif d'un File: els n bytes de `pos`, de la finestra
   ja llegida si hi són (el prefix o, després, el fitxer sencer); si no, un
   blob.slice d'eixos n bytes i prou. A la lectura MAX_SEGMENTS + 1 fora del
   prefix es llig el fitxer sencer (fins a PES_MAXIM_ENTRADA), UNA vegada.
   null si el fitxer no en té tants. */
function llegidorDe(fitxer, prefix) {
  let finestra = prefix;
  let lectures = 0;
  return async (pos, n) => {
    if (pos + n > finestra.byteLength && finestra.byteLength < fitxer.size) {
      if (pos + n > fitxer.size) return null;
      lectures += 1;
      if (lectures <= MAX_SEGMENTS) {
        const v = new DataView(await bytesDe(fitxer.slice(pos, pos + n)));
        return v.byteLength === n ? v : null;
      }
      if (fitxer.size > PES_MAXIM_ENTRADA) return null;
      finestra = new DataView(await bytesDe(fitxer));
    }
    return pos + n <= finestra.byteLength ? new DataView(finestra.buffer, finestra.byteOffset + pos, n) : null;
  };
}

/* On és el TIFF d'un File o Blob: el prefix de MAX_BYTES_EXIF (el mateix de
   sempre en JPEG) i, en PNG i WebP, el recorregut de cercaTrosExif amb el
   llegidor de dalt. Torna { format, v, tiff }: la vista on és el TIFF i
   { inici, mida } dins d'ella, o tiff null. */
async function localitzaTiff(fitxer) {
  const prefix = new DataView(await bytesDe(fitxer.slice(0, MAX_BYTES_EXIF)));
  const format = formatDe(prefix);
  if (esJpeg(prefix)) return { format, v: prefix, tiff: trobaTiffJpeg(prefix) };
  if (format !== FORMAT_PNG && format !== FORMAT_WEBP) return { format, v: prefix, tiff: null };
  const llig = llegidorDe(fitxer, prefix);
  const cerca = cercaTrosExif(format, prefix, fitxer.size);
  let pas = cerca.next();
  while (!pas.done) pas = cerca.next(await llig(...pas.value));
  if (!pas.value) return { format, v: prefix, tiff: null };
  const tros = await llig(pas.value.inici, pas.value.mida);
  return { format, v: tros, tiff: tros && tiffDelTros(tros, 0, tros.byteLength) };
}

/**
 * El mateix que llegixExif, d'un File o Blob: el prefix de MAX_BYTES_EXIF
 * (blob.slice) i, en PNG i WebP, les capçaleres dels trossos i el de l'EXIF,
 * encara que vaja darrere dels píxels. Mai rebutja: si no es pot llegir,
 * sense dades.
 */
export async function llegixMetadadesImatge(fitxer, opcions) {
  const { ambGps = true, ambData = true, ambCamera = false } = opcions || {};
  try {
    if (typeof Blob === 'undefined' || !(fitxer instanceof Blob)) return buitPer(ambCamera);
    const { v, tiff } = await localitzaTiff(fitxer);
    return tiff ? llegixTiff(v, tiff.inici, tiff.mida, { ambGps, ambData, ambCamera }) : buitPer(ambCamera);
  } catch {
    return buitPer(ambCamera);
  }
}

const SENSE_ORIENTACIO = Object.freeze({ format: null, orientacio: null });

async function llegixOrientacio(fitxer) {
  try {
    const { format, v, tiff } = await localitzaTiff(fitxer);
    const { orientacio } = tiff ? llegixTiff(v, tiff.inici, tiff.mida, { ambGps: false, ambData: false }) : senseDades();
    return Object.freeze({ format, orientacio });
  } catch {
    return SENSE_ORIENTACIO;
  }
}

/* Una lectura per fitxer: el retallador i cada intent de compressImage del
   pressupost (fins a 12, pujadaImatge.js) pregunten pel mateix. Es guarda
   la resposta, mai els bytes. */
const orientacions = new WeakMap();

/**
 * Gauntlet 261016 (P2 de Codex) · El format dels bytes ('image/jpeg',
 * 'image/png', 'image/webp' o null) i l'orientació EXIF (1..8 o null) d'un
 * File o Blob, en UNA lectura (la de llegixMetadadesImatge, sense el GPS ni la
 * data) i una vegada per fitxer. És el que necessita orientacioPendent
 * (orientacio.js) per a decidir, pel format, si el navegador ja l'ha posada
 * dreta. Torna un objecte congelat. Mai rebutja.
 */
export function llegixOrientacioImatge(fitxer) {
  if (typeof Blob === 'undefined' || !(fitxer instanceof Blob)) return Promise.resolve(SENSE_ORIENTACIO);
  if (!orientacions.has(fitxer)) orientacions.set(fitxer, llegixOrientacio(fitxer));
  return orientacions.get(fitxer);
}
