/**
 * exifIncrustat.js — Gauntlet nocturn 261016, Bloc 1.2 (mandat del Mestre,
 * pla §0.1.3) · L'EXIF de la foto ORIGINAL, preparat per a publicar i tornat
 * a posar dins de la foto que ix del canvas. Pur: sense DOM i sense
 * dependències (es prova en Node amb bytes sintètics).
 *
 * El canvas (compressImage, exportaRetall) torna a codificar i perd l'EXIF.
 * El mandat vol el contrari de sèrie: la ubicació (GPS), la data i la càmera
 * de les fotos es conserven per al patrimoni del poble (arbres monumentals,
 * fonts, la flora de la Torre de les Maçanes), i la persona les pot llevar
 * abans de publicar (la casella del DialegEnquadrament). Això supera la D4 de
 * l'ADR multimèdia («l'EXIF es destruïx per defecte») NOMÉS als camins que
 * mostren eixa casella; la resta (imatges enganxades, l'ordre «/» Imatge del
 * text enriquit, el logotip) continua net com abans.
 *
 * Gauntlet 261016 (Codex, relleu 02:26) · Res no es diu «íntegre» si no ho
 * és. El que es publica (analitzaTiff, preparaTiff) és EXACTAMENT això:
 *   · ES CONSERVA, a la MATEIXA posició (cap desplaçament no canvia: el
 *     MakerNote de cada càmera en porta de propis i no es pot moure), el graf
 *     de l'IFD0: l'IFD0, l'Exif IFD (0x8769) amb el MakerNote sencer
 *     (0x927c), el GPS IFD (0x8825), l'IFD d'Interoperabilitat (0xa005) i els
 *     SubIFD (0x014a), cada directori amb TOTS els valors de les seues
 *     entrades, de qualsevol tipus. Cap byte on apunta una entrada conservada
 *     no es posa a zero ni es talla.
 *   · Els bytes que no reclama cap estructura (els «orfes»): amb MakerNote es
 *     conserven tal qual, perquè el MakerNote hi pot apuntar i no se sap on;
 *     sense MakerNote ningú no hi apunta i es posen a zero (llista blanca,
 *     com netejaMetadades.js).
 *   · S'OMET l'IFD1 (la cadena del «següent» de l'IFD0), els seus valors i la
 *     miniatura: és una còpia de l'original SENSE retallar i ensenyaria el que
 *     la persona ha tallat. Es posen a zero i, darrere de l'últim byte
 *     conservat, es tallen. El «següent» de l'IFD0 passa a 0, i el dels altres
 *     directoris conservats també (cap n'encadena cap altre).
 *   · Orientation (0x0112) passa a 1: el canvas ja ha posat dreta la foto.
 *   · Gauntlet 261016 (Bloc B, P1) · S'OMET el MakerNote que porta dins un
 *     JPEG (FF D8 FF i un segment de veres: jpegDins), com la previsualització
 *     de l'original sense retallar que hi desen Nikon, Pentax o Casio. La seua
 *     entrada ix del directori (les altres es desplacen 12 bytes, en el mateix
 *     ordre; el comptador baixa; el «següent» va darrere de l'última, a 0, i
 *     la cua lliure, a zero), i els seus bytes van a zero. Sense cap MakerNote
 *     conservat, els orfes ja no els pot reclamar ningú: també a zero.
 *
 * Quan això no es pot fer sense deixar cap punter sense destinació ni cap tros
 * de l'original sense retallar, ho diu (ESTAT_EXIF.NO_CONSERVABLE, amb el
 * MOTIU_EXIF), mai amb un null silenciós ni amb una foto neta d'amagat: un
 * bloc que no és un TIFF; un punter fora del bloc, un cicle o un directori
 * compartit; un tipus TIFF desconegut (no se sap on és el valor); una
 * miniatura que toca un byte conservat; dades d'imatge (miniatura, tires o
 * rajoles) declarades per un directori conservat; amb MakerNote, un orfe
 * que comença com un JPEG (una miniatura que ningú no declara); o un MakerNote
 * amb un JPEG que no es pot ometre sense trencar res (un altre valor hi apunta,
 * o el seu directori quedaria sense cap entrada, que TIFF 6.0 no admet).
 *
 * Gauntlet 261016 (Bloc B, P2) · El PUBLICABLE diu també què porta el bloc
 * que es publicarà (`contingut`), per l'estructura i no pel que el lector
 * estricte (exif.js) n'ha sabut interpretar: la casella i els avisos parlen de
 * la ubicació si hi ha un GPS IFD amb cap entrada que no siga la versió, de la
 * data si hi ha DateTime, DateTimeOriginal o DateTimeDigitized, i de les dades
 * que identifiquen la càmera (marca, model, números de sèrie, un nom de
 * persona) si en queda cap.
 *
 * On va (incrustaEnWebp, incrustaEnJpeg), amb el sostre de cada format
 * (sostreTiff): l'EXIF publicable no depén del format, el que hi cap sí.
 *   · WebP: un tros «EXIF» (abans de l'XMP, si n'hi ha) i el bit E (0x08) de
 *     VP8X. Si el canvas ha fet un WebP simple (només VP8 o VP8L), es crea el
 *     VP8X amb les mides reals del flux, i el bit L si el VP8L du alfa. El
 *     sostre és el que es llig (MAX_BYTES_TIFF_WEBP, 4 MiB, molt per davall
 *     del límit del RIFF): de fet, el limita el pressupost de 80.000 B.
 *   · JPEG: un APP1 «Exif» darrere de SOI (i de l'APP0 JFIF, si n'hi ha, com
 *     fa segmentOrientacio a netejaMetadades.js). Sostre: MAX_BYTES_TIFF.
 *   · Cap altre format (el PNG de Safari 16 quan es demana WebP): en eixe cas
 *     el pressupost ja torna a codificar la foto en JPEG (pujadaImatge.js).
 *     Qui ha triat conservar l'EXIF i no hi cap rep un avís
 *     (ERROR_EXIF_NO_CONSERVABLE), no una foto neta.
 *
 * LLEI: no llança mai. Cap bucle depén del que diga el fitxer: cada volta
 * avança, i cada marca de bytes és lineal (capes), no per rang.
 */
import { llegixExif, teExif } from './exif.js';
import { PRECISIONS } from './geolocalitzacio.js';
import { PES_MAXIM_ENTRADA } from './limits.js';
import { FORMAT_JPEG, FORMAT_PNG, FORMAT_WEBP, formatImatge } from './netejaMetadades.js';

/**
 * L'etiqueta de la casella del diàleg quan la foto porta la ubicació o la
 * data; la repetixen els avisos (pujadaImatge.js).
 */
export const ETIQUETA_CONSERVA_EXIF = 'Conserva la ubicació i la data de la foto';
/** Gauntlet 261016 (Codex, 02:26) · La mateixa casella quan només hi ha la càmera (marca, model, MakerNote…). */
export const ETIQUETA_CONSERVA_CAMERA = 'Conserva les dades de la càmera de la foto';
/** L'avís quan la persona ha triat conservar-lo i no es pot: no es puja res, i es diu com eixir-ne. */
export const ERROR_EXIF_NO_CONSERVABLE = `No es pot conservar la ubicació i la data d’esta foto; desmarca «${ETIQUETA_CONSERVA_EXIF}» per a pujar-la sense.`;
export const ERROR_EXIF_NO_CONSERVABLE_CAMERA = `No es poden conservar les dades de la càmera d’esta foto; desmarca «${ETIQUETA_CONSERVA_CAMERA}» per a pujar-la sense.`;

/**
 * Els estats d'un EXIF que hi és (sense EXIF, exifPublicable torna null): es
 * pot publicar, o hi és però no es pot conservar sense trencar-lo.
 */
export const ESTAT_EXIF = Object.freeze({ PUBLICABLE: 'publicable', NO_CONSERVABLE: 'no-conservable' });
/** Per què no es pot conservar (ESTAT_EXIF.NO_CONSERVABLE). */
export const MOTIU_EXIF = Object.freeze({
  /** El bloc no és un TIFF, o l'IFD0 no s'entén. */
  ILLEGIBLE: 'illegible',
  /** Un punter fora del bloc, un cicle, un directori compartit o que no s'entén, o un tipus desconegut. */
  GRAF: 'graf',
  /** La miniatura toca el que es conserva, un directori conservat declara dades d'imatge, o un orfe és un JPEG. */
  MINIATURA: 'miniatura',
  /** Més gran del que es llig (MAX_BYTES_TIFF_WEBP). */
  MIDA: 'mida',
});

/** El bloc TIFF més gran que cap en un APP1 de JPEG: 65.535 − 2 (la longitud) − 6 («Exif\0\0»). */
export const MAX_BYTES_TIFF = 0xffff - 8;
/**
 * El bloc TIFF més gran que es llig i que va en un tros «EXIF» de WebP (el
 * RIFF en deixa fins a 4 GiB): un PNG o un WebP no tenen el sostre de l'APP1.
 * De fet, el que limita és el pressupost de la foto (PRESSUPOST_PUJADA).
 */
export const MAX_BYTES_TIFF_WEBP = 4 * 1024 * 1024;

const FIRMA_EXIF = Object.freeze([0x45, 0x78, 0x69, 0x66, 0x00, 0x00]); // «Exif\0\0»
/** Entrades per IFD: un IFD0 real en porta poques desenes. */
const MAX_ENTRADES_IFD = 512;
/** Directoris que es conserven com a molt (IFD0, Exif, GPS, Interoperabilitat i SubIFD), i baules de la cadena de l'IFD1. */
const MAX_IFD = 16;
/** Tires (o rajoles) d'una miniatura sense comprimir que es miren. */
const MAX_TIRES = 4096;

const TAG_TIRES = 0x0111; // StripOffsets
const TAG_ORIENTACIO = 0x0112;
const TAG_MIDA_TIRES = 0x0117; // StripByteCounts
const TAG_RAJOLES = 0x0144; // TileOffsets
const TAG_MIDA_RAJOLES = 0x0145; // TileByteCounts
const TAG_SUBIFD = 0x014a;
const TAG_MINIATURA = 0x0201; // JPEGInterchangeFormat
const TAG_MIDA_MINIATURA = 0x0202; // JPEGInterchangeFormatLength
const TAG_MAKER_NOTE = 0x927c;
const TAG_EXIF_IFD = 0x8769;
const TAG_GPS_IFD = 0x8825;
const TAG_INTEROP_IFD = 0xa005;
/** Els punters a un altre directori que formen el graf conservat. */
const TAGS_IFD = new Set([TAG_EXIF_IFD, TAG_GPS_IFD, TAG_INTEROP_IFD, TAG_SUBIFD]);
/** Les dades d'imatge que pot declarar un directori: [on són, quant fan]. */
const DADES_IMATGE = Object.freeze([[TAG_MINIATURA, TAG_MIDA_MINIATURA], [TAG_TIRES, TAG_MIDA_TIRES], [TAG_RAJOLES, TAG_MIDA_RAJOLES]]);
/* Les entrades que llig exif.js per al GPS i la data (tiffDeLectura). */
const LECTURA = Object.freeze([[TAG_EXIF_IFD, new Set([0x9003, 0x9011])], [TAG_GPS_IFD, new Set([1, 2, 3, 4, 5, 6])]]);
/* Gauntlet 261016 (Bloc B, P2) · El GPSVersionID: un GPS IFD que només porta
   això no diu cap lloc. */
const TAG_GPS_VERSIO = 0x0000;
/* Les dates que es publiquen: DateTime, DateTimeOriginal i DateTimeDigitized. */
const TAGS_DATA = new Set([0x0132, 0x9003, 0x9004]);
/* Les que identifiquen la càmera o una persona (`contingut`): Make i LensMake;
   Model i LensModel; BodySerialNumber, LensSerialNumber i el CameraSerialNumber
   del DNG; Artist i CameraOwnerName. */
const TAGS_CAMERA = Object.freeze({
  marca: new Set([0x010f, 0xa433]),
  model: new Set([0x0110, 0xa434]),
  serie: new Set([0xa431, 0xa435, 0xc62f]),
  nom: new Set([0x013b, 0xa430]),
});
/* Els primers bytes d'un valor que es miren per a saber si diu res. */
const MAX_BYTES_VALOR = 64;

const TIPUS_BYTE = 1;
const TIPUS_SHORT = 3;
const TIPUS_LONG = 4;
const TIPUS_UNDEFINED = 7;
const TIPUS_IFD = 13;
/* Els bytes de cada tipus TIFF/EXIF: BYTE, ASCII, SHORT, LONG, RATIONAL,
   SBYTE, UNDEFINED, SSHORT, SLONG, SRATIONAL, FLOAT, DOUBLE i IFD. */
const MIDA_TIPUS = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 13: 4 };

/* Una vista de bytes de qualsevol buffer, també d'un altre reialme (el
   ArrayBuffer de jsdom no és el de Node). */
function aBytes(entrada) {
  if (entrada instanceof Uint8Array) return entrada;
  if (ArrayBuffer.isView(entrada)) return new Uint8Array(entrada.buffer, entrada.byteOffset, entrada.byteLength);
  if (entrada && typeof entrada === 'object' && typeof entrada.byteLength === 'number') {
    try {
      return new Uint8Array(entrada);
    } catch {
      return null;
    }
  }
  return null;
}

const text4 = (b, p) => String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]);
const u32be = (b, p) => ((b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]) >>> 0;
const u32le = (b, p) => (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0;

function escriuU32le(b, p, valor) {
  b[p] = valor & 0xff;
  b[p + 1] = (valor >>> 8) & 0xff;
  b[p + 2] = (valor >>> 16) & 0xff;
  b[p + 3] = (valor >>> 24) & 0xff;
}

function escriuU24le(b, p, valor) {
  b[p] = valor & 0xff;
  b[p + 1] = (valor >>> 8) & 0xff;
  b[p + 2] = (valor >>> 16) & 0xff;
}

function comencaPerExif(b, pos) {
  if (pos < 0 || pos + FIRMA_EXIF.length > b.length) return false;
  return FIRMA_EXIF.every((x, i) => b[pos + i] === x);
}

/* El PNG i el WebP haurien de portar el TIFF tal qual, però n'hi ha que hi
   posen davant «Exif\0\0», com l'APP1. Es copia: qui el rep el pot tocar. */
const senseFirma = (dades) => (comencaPerExif(dades, 0) ? dades.slice(FIRMA_EXIF.length) : dades.slice());

/* ─── Extraure el bloc TIFF de l'original ─────────────────────────────── */

/* El primer APP1 «Exif» abans de la imatge (SOS): el que llig el navegador. */
function tiffDeJpeg(b) {
  let pos = 2;
  while (pos + 4 <= b.length) {
    if (b[pos] !== 0xff) return null;
    const marcador = b[pos + 1];
    if (marcador === 0xff) { pos += 1; continue; } // farciment
    if (marcador === 0xd9 || marcador === 0xda) return null; // EOI, SOS: l'EXIF va abans
    if (marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) { pos += 2; continue; } // sense longitud
    const longitud = (b[pos + 2] << 8) | b[pos + 3];
    const fi = pos + 2 + longitud;
    if (longitud < 2 || fi > b.length) return null; // truncat
    if (marcador === 0xe1 && longitud >= 16 && comencaPerExif(b, pos + 4)) return b.slice(pos + 10, fi);
    pos = fi;
  }
  return null;
}

/* El tros «eXIf», abans d'IEND. */
function tiffDePng(b) {
  let pos = 8;
  while (pos + 12 <= b.length) {
    const longitud = u32be(b, pos);
    const fi = pos + 12 + longitud;
    if (longitud > 0x7fffffff || fi > b.length) return null;
    const tipus = text4(b, pos + 4);
    if (tipus === 'eXIf') return senseFirma(b.subarray(pos + 8, pos + 8 + longitud));
    if (tipus === 'IEND') return null;
    pos = fi;
  }
  return null;
}

/* El tros «EXIF» del RIFF (sol anar darrere de la imatge). */
function tiffDeWebp(b) {
  const fiRiff = Math.min(b.length, 8 + u32le(b, 4));
  let pos = 12;
  while (pos + 8 <= fiRiff) {
    const longitud = u32le(b, pos + 4);
    const fi = pos + 8 + longitud;
    if (fi > fiRiff) return null;
    if (text4(b, pos) === 'EXIF') return senseFirma(b.subarray(pos + 8, fi));
    pos = fi + (longitud & 1); // els trossos senars porten un byte de farciment
  }
  return null;
}

/**
 * El bloc TIFF de l'EXIF d'un JPEG (APP1), d'un PNG (eXIf) o d'un WebP
 * (EXIF), en una còpia nova; o null si no en porta o no s'entén.
 */
export function extreuTiff(entrada) {
  try {
    const b = aBytes(entrada);
    const format = formatImatge(b);
    if (format === FORMAT_JPEG) return tiffDeJpeg(b);
    if (format === FORMAT_PNG) return tiffDePng(b);
    if (format === FORMAT_WEBP) return tiffDeWebp(b);
    return null;
  } catch {
    return null;
  }
}

/* ─── Preparar-lo per a publicar ──────────────────────────────────────── */

function segmentApp1(tiff) {
  const s = new Uint8Array(4 + FIRMA_EXIF.length + tiff.length);
  const longitud = 2 + FIRMA_EXIF.length + tiff.length;
  s.set([0xff, 0xe1, longitud >>> 8, longitud & 0xff], 0);
  s.set(FIRMA_EXIF, 4);
  s.set(tiff, 4 + FIRMA_EXIF.length);
  return s;
}

/* Un bloc TIFF (de fins a MAX_BYTES_TIFF) en un JPEG mínim (SOI + APP1), per
   a llegir-lo amb llegixExif. */
function embolcallJpeg(tiff) {
  const segment = segmentApp1(tiff);
  const jpeg = new Uint8Array(2 + segment.length);
  jpeg.set([0xff, 0xd8], 0);
  jpeg.set(segment, 2);
  return jpeg;
}

/* Les marques d'una llista de rangs [a, b), en una sola passada: un 1 per a
   cada byte que en cobrix algun. Cap rang, per gran o repetit, no fa cap
   volta de més. */
function capes(rangs, mida) {
  const delta = new Int32Array(mida + 1);
  for (const [a, b] of rangs) {
    const inici = Math.max(0, Math.min(mida, a));
    const fi = Math.max(0, Math.min(mida, b));
    if (inici < fi) {
      delta[inici] += 1;
      delta[fi] -= 1;
    }
  }
  const marca = new Uint8Array(mida);
  for (let i = 0, n = 0; i < mida; i += 1) {
    n += delta[i];
    marca[i] = n > 0 ? 1 : 0;
  }
  return marca;
}

/* Gauntlet 261016 (Bloc B, P1) · Comença un JPEG dins de [a, b)? El SOI
   (FF D8) i un segment de veres: FF (amb el farciment de FF que admet el
   format), un marcador amb llargària (ni RSTn, ni SOI, ni EOI) i una
   llargària de 2 o més que ja és dins del bloc. El segment pot acabar fora del
   rang: el que compta és on comença. Cada volta avança. */
function jpegDins(t, a, b) {
  for (let i = Math.max(0, a); i < b && i + 2 < t.length; i += 1) {
    if (t[i] === 0xff && t[i + 1] === 0xd8 && t[i + 2] === 0xff) {
      let j = i + 2;
      while (j < t.length && t[j] === 0xff) j += 1;
      const m = t[j];
      if (j + 2 < t.length && m >= 0xc0 && m <= 0xfe && !(m >= 0xd0 && m <= 0xd9) && ((t[j + 1] << 8) | t[j + 2]) >= 2) return true;
    }
  }
  return false;
}

/* Un TIFF xicotet, NOMÉS per a llegir el GPS i la data amb exif.js: els dos
   punters de l'IFD0 i, de l'Exif i del GPS, les entrades que llig (LECTURA),
   amb els valors copiats al darrere. Així es llig també el d'un bloc que no
   cap en un APP1 (un PNG o un WebP amb molt d'EXIF). No es publica mai. */
function tiffDeLectura(t, le, dirs) {
  const ifds = LECTURA.filter(([tag]) => dirs.get(tag))
    .map(([tag, tags]) => ({ tag, entrades: dirs.get(tag).entrades.filter((e) => tags.has(e.tag)) }));
  const fora = (e) => (e.bytes > 4 ? e.bytes + (e.bytes & 1) : 0);
  let cursor = 8 + 2 + ifds.length * 12 + 4;
  for (const x of ifds) {
    x.pos = cursor;
    cursor += 2 + x.entrades.length * 12 + 4 + x.entrades.reduce((s, e) => s + fora(e), 0);
  }
  const r = new Uint8Array(cursor);
  const w = new DataView(r.buffer);
  r.set(t.subarray(0, 4), 0); // II o MM, i el 42
  w.setUint32(4, 8, le);
  w.setUint16(8, ifds.length, le);
  ifds.forEach((x, i) => {
    const p = 10 + i * 12;
    w.setUint16(p, x.tag, le);
    w.setUint16(p + 2, TIPUS_LONG, le);
    w.setUint32(p + 4, 1, le);
    w.setUint32(p + 8, x.pos, le);
    w.setUint16(x.pos, x.entrades.length, le);
    let dades = x.pos + 2 + x.entrades.length * 12 + 4;
    x.entrades.forEach((e, k) => {
      const q = x.pos + 2 + k * 12;
      r.set(t.subarray(e.entrada, e.entrada + 8), q); // tag, tipus i quantitat, tal qual
      if (e.bytes > 4) {
        w.setUint32(q + 8, dades, le);
        r.set(t.subarray(e.pos, e.pos + e.bytes), dades);
        dades += fora(e);
      } else {
        r.set(t.subarray(e.entrada + 8, e.entrada + 12), q + 8);
      }
    });
  });
  return r;
}

/* El GPS i la data d'un bloc que no es pot conservar, per a dir-ho a la
   casella: el que se'n puga llegir dels primers MAX_BYTES_TIFF bytes. */
function lecturaParcial(bytes) {
  const { gps, dataCaptura } = llegixExif(embolcallJpeg(bytes.subarray(0, Math.min(bytes.length, MAX_BYTES_TIFF))));
  return { gps, dataCaptura };
}

const noConservable = (motiu, bytes) => ({ estat: ESTAT_EXIF.NO_CONSERVABLE, motiu, tiff: null, ...lecturaParcial(bytes) });

/**
 * Gauntlet 261016 (Codex, relleu 02:26) · El que es publicaria d'un bloc TIFF
 * (vegeu la capçalera: què es conserva i què s'omet), en una còpia nova
 * (l'entrada no es toca):
 *   · null: cap bloc, o un IFD0 buit (sense EXIF: res a publicar ni a perdre);
 *   · { estat: PUBLICABLE, tiff, gps, dataCaptura, contingut }: el bloc
 *     preparat, de qualsevol mida fins a MAX_BYTES_TIFF_WEBP (el sostre de
 *     cada format és de qui l'incrusta: sostreTiff), el GPS i la data que s'hi
 *     lligen, i el que porta per l'estructura (Bloc B): contingut = { ubicacio,
 *     data, marca, model, serie, nom }, booleans;
 *   · { estat: NO_CONSERVABLE, motiu, tiff: null, gps, dataCaptura }: hi ha
 *     EXIF, però no es pot conservar sense trencar-lo (MOTIU_EXIF); el GPS i
 *     la data, si s'hi arriba, per a dir-ho.
 * Mai llança.
 */
export function analitzaTiff(entrada) {
  try {
    const original = aBytes(entrada);
    if (!original || !original.length) return null;
    if (original.length > MAX_BYTES_TIFF_WEBP) return noConservable(MOTIU_EXIF.MIDA, original);
    if (original.length < 8) return noConservable(MOTIU_EXIF.ILLEGIBLE, original);
    const t = new Uint8Array(original);
    const mida = t.length;
    const v = new DataView(t.buffer);
    const marca = v.getUint16(0);
    const le = marca === 0x4949;
    if ((!le && marca !== 0x4d4d) || v.getUint16(2, le) !== 42) return noConservable(MOTIU_EXIF.ILLEGIBLE, original);
    const dins = (pos, n) => Number.isInteger(pos) && Number.isFinite(n) && pos >= 0 && n >= 0 && pos + n <= mida;

    /* Un directori: les entrades (amb on és cada valor) i on és el punter al
       següent; null si no cap al bloc. Un tipus desconegut fa `bytes` NaN: no
       se sap on és el seu valor. */
    const directori = (offset) => {
      if (!dins(offset, 2)) return null;
      const nombre = v.getUint16(offset, le);
      if (nombre > MAX_ENTRADES_IFD || !dins(offset + 2, nombre * 12 + 4)) return null;
      const entrades = [];
      for (let i = 0; i < nombre; i += 1) {
        const p = offset + 2 + i * 12;
        const tipus = v.getUint16(p + 2, le);
        const quantitat = v.getUint32(p + 4, le);
        const bytes = MIDA_TIPUS[tipus] ? MIDA_TIPUS[tipus] * quantitat : Number.NaN;
        // Fins a 4 bytes el valor va dins de l'entrada; si no, l'entrada diu on és.
        entrades.push({ tag: v.getUint16(p, le), tipus, quantitat, bytes, entrada: p, pos: bytes <= 4 ? p + 8 : v.getUint32(p + 8, le) });
      }
      return { offset, fi: offset + 2 + nombre * 12 + 4, seguent: offset + 2 + nombre * 12, entrades };
    };
    /* Els valors enters d'una entrada (SHORT, LONG o IFD), com a molt `maxim`. */
    const valors = (e, maxim) => {
      if (!e || e.quantitat < 1 || ![TIPUS_SHORT, TIPUS_LONG, TIPUS_IFD].includes(e.tipus)) return [];
      const pas = MIDA_TIPUS[e.tipus];
      const n = Math.min(e.quantitat, maxim);
      if (!dins(e.pos, n * pas)) return [];
      return Array.from({ length: n }, (_, i) => (pas === 2 ? v.getUint16(e.pos + i * 2, le) : v.getUint32(e.pos + i * 4, le)));
    };
    /* Les dades d'imatge que declara un directori: [a, b) amb llargària. */
    const imatgesDe = (dir) => DADES_IMATGE.flatMap(([tagOn, tagQuant]) => {
      const on = valors(dir.entrades.find((e) => e.tag === tagOn), MAX_TIRES);
      const quant = valors(dir.entrades.find((e) => e.tag === tagQuant), MAX_TIRES);
      return on.flatMap((o, i) => (quant[i] > 0 ? [[o, o + quant[i]]] : []));
    });

    const ifd0 = directori(v.getUint32(4, le));
    if (!ifd0) return noConservable(MOTIU_EXIF.ILLEGIBLE, original);
    if (!ifd0.entrades.length) return null;

    /* 1 · El graf: cada directori conservat, una vegada (un que es repetix és
       un cicle o un directori compartit), amb tots els seus valors. El valor
       del MakerNote hi entra després (1b): primer es mira si porta un JPEG. */
    const graf = [[0, 8]];
    const conservats = new Map();
    const pendents = [];
    const makerNotes = [];
    const ifdsGps = [];
    const visita = (dir) => {
      conservats.set(dir.offset, dir);
      dir.rang = [dir.offset, dir.fi];
      graf.push(dir.rang);
      for (const e of dir.entrades) {
        if (!Number.isFinite(e.bytes)) return MOTIU_EXIF.GRAF;
        if (e.bytes > 4 && !dins(e.pos, e.bytes)) return MOTIU_EXIF.GRAF;
        if (e.tag === TAG_MAKER_NOTE) makerNotes.push({ dir, e });
        else if (e.bytes > 4) graf.push([e.pos, e.pos + e.bytes]);
        if (TAGS_IFD.has(e.tag)) {
          if ((e.tipus !== TIPUS_LONG && e.tipus !== TIPUS_IFD) || e.quantitat > MAX_IFD) return MOTIU_EXIF.GRAF;
          const destins = valors(e, MAX_IFD).filter(Boolean);
          if (e.tag === TAG_GPS_IFD) ifdsGps.push(...destins);
          pendents.push(...destins);
        }
      }
      // Una imatge declarada dins del que es publica ixiria sense retallar.
      return imatgesDe(dir).length ? MOTIU_EXIF.MINIATURA : null;
    };
    let motiu = visita(ifd0);
    while (!motiu && pendents.length) {
      const offset = pendents.shift();
      const dir = conservats.has(offset) || conservats.size >= MAX_IFD ? null : directori(offset);
      motiu = dir ? visita(dir) : MOTIU_EXIF.GRAF;
    }
    if (motiu) return noConservable(motiu, original);

    /* 1b · Gauntlet 261016 (Bloc B, P1) · Un MakerNote amb un JPEG dins (la
       previsualització de l'original sense retallar) no es publica: els seus
       bytes queden fora del graf (3 els posa a zero) i la seua entrada ix del
       directori (4). Només si es pot fer sense trencar res: si un altre valor
       hi apunta, o si un altre valor toca el directori que es reescriu, o si
       el directori quedaria buit, ho diu. */
    const retirades = new Set(makerNotes.filter(({ e }) => e.bytes > 4 && jpegDins(t, e.pos, e.pos + e.bytes)).map(({ e }) => e));
    for (const { e } of makerNotes) if (e.bytes > 4 && !retirades.has(e)) graf.push([e.pos, e.pos + e.bytes]);
    // L'orfe es conserva (algú hi pot apuntar) només si queda cap MakerNote.
    const makerNote = makerNotes.some(({ e }) => !retirades.has(e));
    const publica = capes(graf, mida);
    const fi = graf.reduce((m, [, b]) => Math.max(m, b), 0);
    const reescrits = [...conservats.values()].filter((dir) => dir.entrades.some((e) => retirades.has(e)));
    if (reescrits.length) {
      const altres = capes(graf.filter((r) => !reescrits.some((dir) => dir.rang === r)), mida);
      const toca = (marca, a, b) => marca.subarray(a, b).some(Boolean);
      for (const e of retirades) if (toca(publica, e.pos, e.pos + e.bytes)) return noConservable(MOTIU_EXIF.MINIATURA, original);
      for (const dir of reescrits) {
        if (dir.entrades.every((e) => retirades.has(e)) || toca(altres, dir.offset, dir.fi)) return noConservable(MOTIU_EXIF.MINIATURA, original);
      }
    }

    /* Bloc B, P2 · Què porta el bloc que es publicarà, per l'estructura: la
       casella ho ha de dir encara que el lector estricte no ho entenga. Un
       valor que només té NUL o espais no diu res. */
    const diuAlgo = (e) => {
      const a = e.pos;
      const b = Math.min(e.pos + e.bytes, a + MAX_BYTES_VALOR);
      for (let i = a; i < b; i += 1) if (t[i] && t[i] !== 0x20) return true;
      return false;
    };
    const entrades = [...conservats.values()].flatMap((dir) => dir.entrades.filter((e) => !retirades.has(e)));
    const hiHa = (tags) => entrades.some((e) => tags.has(e.tag) && diuAlgo(e));
    const contingut = {
      ubicacio: ifdsGps.some((offset) => conservats.get(offset)?.entrades.some((e) => e.tag !== TAG_GPS_VERSIO)),
      data: hiHa(TAGS_DATA),
      marca: hiHa(TAGS_CAMERA.marca),
      model: hiHa(TAGS_CAMERA.model),
      serie: hiHa(TAGS_CAMERA.serie),
      nom: hiHa(TAGS_CAMERA.nom),
    };

    /* 2 · La cadena de l'IFD1: els seus directoris i valors, i les seues
       imatges (la miniatura). Un «següent» que cau dins del que es publica no
       és cap IFD1 (un bucle o brossa): la cadena s'acaba. */
    const ifd1 = [];
    const miniatures = [];
    for (let seguent = v.getUint32(ifd0.seguent, le), n = 0; seguent && n < MAX_IFD; n += 1) {
      const dir = seguent < mida && !publica[seguent] ? directori(seguent) : null;
      if (!dir) break;
      ifd1.push([dir.offset, dir.fi]);
      for (const e of dir.entrades) {
        if (e.bytes > 4) ifd1.push([e.pos, e.pos + e.bytes]);
      }
      miniatures.push(...imatgesDe(dir));
      seguent = v.getUint32(dir.seguent, le);
    }
    const miniatura = capes(miniatures, mida);
    const omes = capes([...ifd1, ...miniatures], mida);

    /* 3 · Byte a byte: el que es publica no es toca; la miniatura no hi pot
       tocar; l'IFD1 i la miniatura, a zero; l'orfe, a zero si ningú no hi pot
       apuntar (sense MakerNote) o tal qual si sí (llevat d'un JPEG amagat).
       Bloc B · Un MakerNote retirat (1b) ja no es publica: els seus bytes van
       a zero com un orfe, i si era l'únic, els orfes també. */
    let fiOrfes = 0;
    for (let i = 0; i < mida; i += 1) {
      if (publica[i]) {
        if (miniatura[i]) return noConservable(MOTIU_EXIF.MINIATURA, original);
      } else if (makerNote && !omes[i]) {
        if (t[i] === 0xff && t[i + 1] === 0xd8 && t[i + 2] === 0xff) return noConservable(MOTIU_EXIF.MINIATURA, original);
        if (t[i]) fiOrfes = i + 1;
      } else {
        t[i] = 0;
      }
    }

    // Cap directori conservat n'encadena cap altre: el de l'IFD0 deixa l'IFD1.
    for (const dir of conservats.values()) v.setUint32(dir.seguent, 0, le);
    // L'orientació, a 1: el canvas ja l'ha aplicada als píxels.
    const o = ifd0.entrades.find((e) => e.tag === TAG_ORIENTACIO);
    if (o && o.quantitat >= 1 && o.bytes <= 4) {
      if (o.tipus === TIPUS_SHORT) v.setUint16(o.pos, 1, le);
      else if (o.tipus === TIPUS_LONG) v.setUint32(o.pos, 1, le);
      else if (o.tipus === TIPUS_BYTE || o.tipus === TIPUS_UNDEFINED) t[o.pos] = 1;
    }

    const punter = (tag) => conservats.get(valors(ifd0.entrades.find((e) => e.tag === tag), 1)[0]);
    const dirs = new Map(LECTURA.map(([tag]) => [tag, punter(tag)]));
    const { gps, dataCaptura } = llegixExif(embolcallJpeg(tiffDeLectura(t, le, dirs)));

    /* 4 · Bloc B, P1 · L'entrada del MakerNote retirat ix del seu directori.
       Ara i no abans: fins ací, cada entrada era al seu lloc (l'orientació i
       tiffDeLectura en depenen). Les que queden es copien en el mateix ordre
       (els tags continuen creixents), el comptador baixa, el «següent» (0) va
       darrere de l'última i la cua que queda lliure, fins on acabava el
       directori, a zero. Els valors de fora no es mouen. */
    for (const dir of reescrits) {
      const queden = dir.entrades.filter((e) => !retirades.has(e)).map((e) => t.slice(e.entrada, e.entrada + 12));
      v.setUint16(dir.offset, queden.length, le);
      queden.forEach((entrada, k) => t.set(entrada, dir.offset + 2 + k * 12));
      const seguent = dir.offset + 2 + queden.length * 12;
      v.setUint32(seguent, 0, le);
      t.fill(0, seguent + 4, dir.fi);
    }
    return { estat: ESTAT_EXIF.PUBLICABLE, tiff: t.slice(0, Math.max(fi, fiOrfes)), gps, dataCaptura, contingut };
  } catch {
    // Només hi arriba un bloc de bytes: hi ha EXIF, però no s'entén. Es diu; no ix net d'amagat.
    return { estat: ESTAT_EXIF.NO_CONSERVABLE, motiu: MOTIU_EXIF.ILLEGIBLE, tiff: null, gps: null, dataCaptura: null };
  }
}

/**
 * El bloc TIFF que es pot publicar (analitzaTiff), en una còpia nova, o null
 * si no n'hi ha cap: sense EXIF o que no es pot conservar (analitzaTiff en diu
 * el motiu). El sostre de cada format és de qui l'incrusta (sostreTiff).
 */
export function preparaTiff(entrada) {
  const analisi = analitzaTiff(entrada);
  return analisi?.estat === ESTAT_EXIF.PUBLICABLE ? analisi.tiff : null;
}

/* ─── La precisió de la ubicació (P1-64, pla 261028_1526 §3.1.1) ──────── */

/* P1-64 (Mestre 261028, decisió 8) · La persona que conserva la ubicació d'una
   foto de publicació en tria la precisió (PRECISIONS: 'exacta', '100m' o
   'poble'). El fitxer és el registre del consentiment: el que porta i el camp
   que se'n deriva (geolocalitzacio) han de dir el MATEIX punt. Per això, amb
   '100m' o 'poble', les coordenades del GPS IFD es reescriuen EN EL LLOC, cap
   offset no es mou (el MakerNote en porta de propis: capçalera d'analitzaTiff):
     · GPSLatitude (2) i GPSLongitude (4), i els del destí (20 i 22) si n'hi ha:
       els tres RATIONAL passen a (round(v·10^d), 10^d), (0, 1), (0, 1), amb d
       els decimals de la precisió. El denominador fa de marca: precisioDeGps
       la recupera en llegir el fitxer;
     · GPSAltitude (6), arrodonida a 100 m.
   'exacta' (o cap precisió) torna la MATEIXA referència. Una estructura que no
   s'entén (un tipus, una quantitat o un denominador inesperats) torna null: no
   es pot conservar la ubicació a eixa precisió, i qui ho crida no hi posa cap
   EXIF (mai el punt exacte d'amagat; pujadaImatge.js ho diu). Mai llança. */
const GPS_LAT = 2;
const GPS_LNG = 4;
const GPS_REF_LAT = 1;
const GPS_REF_LNG = 3;
const GPS_ALT = 6;
const GPS_DESTI_LAT = 20;
const GPS_DESTI_LNG = 22;
const GPS_DESTI_REF_LAT = 19;
const GPS_DESTI_REF_LNG = 21;
const TIPUS_ASCII = 2;
const TIPUS_RATIONAL = 5;
/* Les coordenades que es reescriuen: [tag del valor, tag de la referència (N/S, E/W)]. */
const COORDENADES_GPS = Object.freeze([
  [GPS_LAT, GPS_REF_LAT], [GPS_LNG, GPS_REF_LNG], [GPS_DESTI_LAT, GPS_DESTI_REF_LAT], [GPS_DESTI_LNG, GPS_DESTI_REF_LNG],
]);
/** L'altitud d'una ubicació que no és exacta, arrodonida a tants metres. */
export const ARRODONIMENT_ALTITUD_M = 100;

const decimalsDe = (precisio) => PRECISIONS.find((p) => p.valor === precisio)?.decimals;
const arrodonixA = (valor, decimals) => Math.round(valor * 10 ** decimals) / 10 ** decimals;
const arrodonix7 = (x) => Math.round(x * 1e7) / 1e7; // el mateix soroll que lleva exif.js

/* Revisió adversarial 261028 · Els tags de text lliure (l'XMP, l'IPTC i el
   bloc de Photoshop) on pot viatjar una altra còpia de la ubicació, que no
   s'arrodonix: amb '100m' o 'poble', cap d'ells. I el mateix en text pla, en
   qualsevol lloc del bloc (el MakerNote inclòs). */
const TAGS_AMB_TEXT_LLIURE = new Set([0x02bc, 0x83bb, 0x8649]);
const GPS_EN_TEXT = /GPS(?:Dest)?(?:Latitude|Longitude)/;
const MAX_U32 = 0xffffffff;

/* El text latin1 d'uns bytes, a trossos (sense passar mai de la pila). */
function textLatin1(bytes) {
  let text = '';
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return text;
}

/* El GPS IFD d'un bloc TIFF: { t, v, le, dins, entrades: Map(tag → entrada),
   dirs }, false si no en porta (res a arrodonir) o null si no s'entén.
   Revisió adversarial 261028 · Es recorre tot el graf (IFD0, Exif, GPS,
   Interoperabilitat i SubIFD, com analitzaTiff) perquè cap lector no puga
   llegir un punt que no s'ha arrodonit: un tag repetit dins d'un directori
   (cada lector en tria un: analitzaTiff el primer, exif.js l'últim), un tipus
   desconegut, un directori repetit o un GPS IFD que no penja de l'IFD0 amb un
   sol punter tornen null. `dirs` són tots els directoris: { offset, rang,
   entrades }, amb `rang` el [a, b) que ocupen. */
function gpsDelTiff(bytes) {
  const t = aBytes(bytes);
  if (!t || t.length < 8) return null;
  const v = new DataView(t.buffer, t.byteOffset, t.byteLength);
  const marca = v.getUint16(0);
  const le = marca === 0x4949;
  if ((!le && marca !== 0x4d4d) || v.getUint16(2, le) !== 42) return null;
  const dins = (pos, n) => Number.isInteger(pos) && pos >= 0 && n >= 0 && pos + n <= t.length;
  const directori = (offset) => {
    if (!dins(offset, 2)) return null;
    const nombre = v.getUint16(offset, le);
    if (nombre > MAX_ENTRADES_IFD || !dins(offset + 2, nombre * 12)) return null;
    const entrades = new Map();
    for (let i = 0; i < nombre; i += 1) {
      const p = offset + 2 + i * 12;
      const tag = v.getUint16(p, le);
      const tipus = v.getUint16(p + 2, le);
      if (entrades.has(tag) || !MIDA_TIPUS[tipus]) return null;
      const quantitat = v.getUint32(p + 4, le);
      const bytes = MIDA_TIPUS[tipus] * quantitat;
      entrades.set(tag, { tipus, quantitat, bytes, pos: bytes <= 4 ? p + 8 : v.getUint32(p + 8, le) });
    }
    return { offset, rang: [offset, offset + 2 + nombre * 12 + 4], entrades };
  };
  const ifd0 = directori(v.getUint32(4, le));
  if (!ifd0) return null;
  const dirs = [ifd0];
  const vistos = new Set([ifd0.offset]);
  let gps = null;
  for (let i = 0; i < dirs.length; i += 1) {
    for (const [tag, e] of dirs[i].entrades) {
      if (!TAGS_IFD.has(tag)) continue;
      if ((e.tipus !== TIPUS_LONG && e.tipus !== TIPUS_IFD) || e.quantitat > MAX_IFD || !dins(e.pos, e.quantitat * 4)) return null;
      if (tag === TAG_GPS_IFD && (i !== 0 || e.quantitat !== 1)) return null;
      for (let k = 0; k < e.quantitat; k += 1) {
        const offset = v.getUint32(e.pos + k * 4, le);
        if (!offset) continue;
        const fill = vistos.has(offset) || dirs.length >= MAX_IFD ? null : directori(offset);
        if (!fill) return null;
        vistos.add(offset);
        dirs.push(fill);
        if (tag === TAG_GPS_IFD) gps = fill;
      }
    }
  }
  return gps ? { t, v, le, dins, entrades: gps.entrades, dirs } : false;
}

/* Els tres RATIONAL d'una coordenada: [[num, den] ×3] o null. */
function racionalsDe(gps, e, n) {
  if (!e || e.tipus !== TIPUS_RATIONAL || e.quantitat !== n || !gps.dins(e.pos, n * 8)) return null;
  return Array.from({ length: n }, (_, i) => [gps.v.getUint32(e.pos + i * 8, gps.le), gps.v.getUint32(e.pos + i * 8 + 4, gps.le)]);
}

function refDe(gps, e) {
  if (!e || e.tipus !== TIPUS_ASCII || e.quantitat < 1 || !gps.dins(e.pos, 1)) return '';
  return String.fromCharCode(gps.t[e.pos]);
}

/**
 * El bloc TIFF amb la ubicació arrodonida a la precisió (vegeu dalt): la
 * mateixa referència amb 'exacta', sense precisió o sense GPS IFD; una còpia
 * nova amb '100m' o 'poble'; null si no s'entén o la precisió és desconeguda.
 */
export function ajustaPrecisioGps(tiff, precisio) {
  try {
    if (precisio === undefined || precisio === null || precisio === 'exacta') return tiff;
    const decimals = decimalsDe(precisio);
    if (!Number.isInteger(decimals)) return null;
    const llegit = gpsDelTiff(tiff);
    if (llegit === false) return tiff;
    if (!llegit) return null;
    if (llegit.dirs.some((dir) => [...dir.entrades.keys()].some((tag) => TAGS_AMB_TEXT_LLIURE.has(tag)))) return null;
    if (!reescripturaNeta(llegit)) return null;
    const copia = new Uint8Array(llegit.t);
    const gps = { ...llegit, t: copia, v: new DataView(copia.buffer) };
    const k = 10 ** decimals;
    for (const [tag, tagRef] of COORDENADES_GPS) {
      const e = gps.entrades.get(tag);
      if (!e) continue;
      const v = racionalsDe(gps, e, 3);
      if (!v || v.some(([, den]) => den === 0)) return null;
      const [g, m, s] = v.map(([num, den]) => num / den);
      const signe = /^[SW]$/.test(refDe(gps, gps.entrades.get(tagRef))) ? -1 : 1;
      // El mateix arrodoniment que el camp (geolocalitzacio): sobre el valor amb signe.
      const n = Math.round(Math.abs(arrodonixA(arrodonix7(signe * (g + m / 60 + s / 3600)), decimals)) * k);
      if (!Number.isFinite(n) || n > 0xffffffff) return null;
      [[n, k], [0, 1], [0, 1]].forEach(([num, den], i) => {
        gps.v.setUint32(e.pos + i * 8, num, gps.le);
        gps.v.setUint32(e.pos + i * 8 + 4, den, gps.le);
      });
    }
    const alt = gps.entrades.get(GPS_ALT);
    if (alt) {
      const v = racionalsDe(gps, alt, 1);
      if (!v || v[0][1] === 0) return null;
      const metres = Math.round(v[0][0] / v[0][1] / ARRODONIMENT_ALTITUD_M) * ARRODONIMENT_ALTITUD_M;
      if (!Number.isFinite(metres) || metres > MAX_U32) return null;
      gps.v.setUint32(alt.pos, metres, gps.le);
      gps.v.setUint32(alt.pos + 4, 1, gps.le);
    }
    return arrodonitDeVeres(copia, precisio, decimals) ? copia : null;
  } catch {
    return null;
  }
}

/* Revisió adversarial 261028 · Es pot reescriure EN EL LLOC sense trencar res?
   Cap valor que es reescriu (els 24 bytes d'una coordenada, els 8 de
   l'altitud) no pot tocar un directori, un altre valor conservat (el MakerNote
   inclòs, i les referències N/S i E/W) ni un altre valor que es reescriu: un
   fitxer així eixiria amb el graf trencat o les coordenades barrejades. */
function reescripturaNeta(llegit) {
  const reescrites = [...COORDENADES_GPS.map(([tag]) => [tag, 24]), [GPS_ALT, 8]]
    .map(([tag, n]) => [llegit.entrades.get(tag), n])
    .filter(([e]) => e);
  const propies = new Set(reescrites.map(([e]) => e));
  const rangs = reescrites.map(([e, n]) => [e.pos, e.pos + n]);
  const protegits = llegit.dirs.flatMap((dir) => [dir.rang, ...[...dir.entrades.values()]
    .filter((e) => e.bytes > 4 && !propies.has(e)).map((e) => [e.pos, e.pos + e.bytes])]);
  const toca = ([a, b], [c, d]) => a < d && c < b;
  return rangs.every((r, i) => !protegits.some((p) => toca(r, p)) && rangs.every((q, j) => j === i || !toca(r, q)));
}

/* Revisió adversarial 261028 · La comprovació de després, amb els lectors de
   veres: el bloc continua sent publicable (analitzaTiff), la marca de la
   precisió es llig (precisioDeGps), el GPS que se'n llig no té més decimals
   que la precisió ni l'altitud més de 100 m d'exactitud, i cap text no hi diu
   cap altra latitud ni longitud. Si no, null: mai el punt exacte d'amagat. */
function arrodonitDeVeres(copia, precisio, decimals) {
  if (GPS_EN_TEXT.test(textLatin1(copia))) return false;
  const analisi = analitzaTiff(copia);
  if (analisi?.estat !== ESTAT_EXIF.PUBLICABLE) return false;
  const llegit = gpsDelTiff(copia);
  if (!llegit) return false;
  if ((llegit.entrades.has(GPS_LAT) || llegit.entrades.has(GPS_LNG)) && precisioDeGps(copia) !== precisio) return false;
  const k = 10 ** decimals;
  const ambDecimals = (x) => Math.abs(x * k - Math.round(x * k)) < 1e-6;
  const { gps } = analisi;
  return !gps || (ambDecimals(gps.lat) && ambDecimals(gps.lng) && (gps.altitud === null || gps.altitud % ARRODONIMENT_ALTITUD_M === 0));
}

/**
 * La precisió que porta un bloc TIFF (la marca que hi deixa ajustaPrecisioGps):
 * '100m' o 'poble' si la latitud i la longitud porten (n, 10^d), (0, 1), (0, 1)
 * amb els decimals d'eixa precisió; 'exacta' si porten un GPS d'una altra
 * forma (el de la càmera); null sense GPS o si no s'entén. Mai llança.
 */
export function precisioDeGps(tiff) {
  try {
    const gps = gpsDelTiff(tiff);
    if (!gps) return null;
    const lat = racionalsDe(gps, gps.entrades.get(GPS_LAT), 3);
    const lng = racionalsDe(gps, gps.entrades.get(GPS_LNG), 3);
    if (!lat || !lng) return null;
    const marca = (v) => (v[1][0] === 0 && v[1][1] === 1 && v[2][0] === 0 && v[2][1] === 1
      ? PRECISIONS.find((p) => p.valor !== 'exacta' && 10 ** p.decimals === v[0][1])?.valor : null);
    const delLat = marca(lat);
    return delLat && delLat === marca(lng) ? delLat : 'exacta';
  } catch {
    return null;
  }
}

/* ─── Incrustar-lo a la foto que ix del canvas ────────────────────────── */

/** El bloc TIFF més gran que cap en la foto d'un format (0 si el format no en porta). */
export function sostreTiff(format) {
  if (format === FORMAT_JPEG) return MAX_BYTES_TIFF;
  return format === FORMAT_WEBP ? MAX_BYTES_TIFF_WEBP : 0;
}

/** L'EXIF publicable (exifPublicable o analitzaTiff) cap en una foto d'este format? */
export const exifCapEnFormat = (dades, format) => Boolean(dades?.tiff?.length) && dades.tiff.length <= sostreTiff(format);

const blocValid = (bloc, format) => Boolean(bloc && bloc.length >= 8 && bloc.length <= sostreTiff(format));

/** Un JPEG amb el bloc TIFF en un APP1 nou, o null (cap JPEG, cap bloc, no hi cap o ja en portava un). */
export function incrustaEnJpeg(entrada, tiff) {
  try {
    const b = aBytes(entrada);
    const bloc = aBytes(tiff);
    if (!blocValid(bloc, FORMAT_JPEG) || formatImatge(b) !== FORMAT_JPEG || teExif(b)) return null;
    // Darrere de l'APP0 JFIF si n'hi ha (JFIF el vol just després de SOI); si no, darrere de SOI.
    const punt = b[2] === 0xff && b[3] === 0xe0 ? 4 + ((b[4] << 8) | b[5]) : 2;
    if (punt > b.length) return null;
    const segment = segmentApp1(bloc);
    const eixida = new Uint8Array(b.length + segment.length);
    eixida.set(b.subarray(0, punt), 0);
    eixida.set(segment, punt);
    eixida.set(b.subarray(punt), punt + segment.length);
    return eixida;
  } catch {
    return null;
  }
}

/* Les mides (i l'alfa) d'un WebP simple, del seu únic tros d'imatge. */
function midesDeWebpSimple({ tipus, dades: d }) {
  if (tipus === 'VP8 ' && d.length >= 10 && (d[0] & 1) === 0 && d[3] === 0x9d && d[4] === 0x01 && d[5] === 0x2a) {
    const amplada = (d[6] | (d[7] << 8)) & 0x3fff;
    const alcada = (d[8] | (d[9] << 8)) & 0x3fff;
    return amplada && alcada ? { amplada, alcada, alfa: false } : null;
  }
  if (tipus === 'VP8L' && d.length >= 5 && d[0] === 0x2f) {
    const bits = u32le(d, 1);
    return { amplada: (bits & 0x3fff) + 1, alcada: ((bits >>> 14) & 0x3fff) + 1, alfa: ((bits >>> 28) & 1) === 1 };
  }
  return null;
}

/** Un WebP amb el bloc TIFF en un tros «EXIF» i el bit E de VP8X, o null (fins a MAX_BYTES_TIFF_WEBP). */
export function incrustaEnWebp(entrada, tiff) {
  try {
    const b = aBytes(entrada);
    const bloc = aBytes(tiff);
    if (!blocValid(bloc, FORMAT_WEBP) || formatImatge(b) !== FORMAT_WEBP) return null;
    const midaRiff = u32le(b, 4);
    const fiRiff = 8 + midaRiff;
    if (midaRiff < 4 || fiRiff > b.length) return null;
    const trossos = [];
    let pos = 12;
    while (pos < fiRiff) {
      if (pos + 8 > fiRiff) return null;
      const tipus = text4(b, pos);
      const longitud = u32le(b, pos + 4);
      const fi = pos + 8 + longitud;
      if (fi > fiRiff) return null;
      if (tipus !== 'EXIF') trossos.push({ tipus, dades: b.subarray(pos + 8, fi) });
      pos = fi + (longitud & 1);
    }
    if (!trossos.length) return null;
    let vp8x;
    if (trossos[0].tipus === 'VP8X') {
      if (trossos[0].dades.length < 10) return null;
      vp8x = trossos.shift().dades.slice();
    } else {
      const mides = midesDeWebpSimple(trossos[0]);
      if (!mides) return null;
      vp8x = new Uint8Array(10);
      vp8x[0] = mides.alfa ? 0x10 : 0;
      escriuU24le(vp8x, 4, mides.amplada - 1);
      escriuU24le(vp8x, 7, mides.alcada - 1);
    }
    vp8x[0] |= 0x08;
    // L'ordre de l'especificació: VP8X, …, la imatge, EXIF i, al final, XMP.
    const xmp = trossos.findIndex((x) => x.tipus === 'XMP ');
    const exif = { tipus: 'EXIF', dades: bloc };
    const tots = [{ tipus: 'VP8X', dades: vp8x }, ...(xmp < 0 ? [...trossos, exif] : [...trossos.slice(0, xmp), exif, ...trossos.slice(xmp)])];
    const total = 12 + tots.reduce((s, x) => s + 8 + x.dades.length + (x.dades.length & 1), 0);
    const eixida = new Uint8Array(total);
    eixida.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
    escriuU32le(eixida, 4, total - 8);
    eixida.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
    let cursor = 12;
    for (const x of tots) {
      for (let i = 0; i < 4; i += 1) eixida[cursor + i] = x.tipus.charCodeAt(i);
      escriuU32le(eixida, cursor + 4, x.dades.length);
      eixida.set(x.dades, cursor + 8);
      cursor += 8 + x.dades.length + (x.dades.length & 1); // el farciment ja és 0
    }
    return eixida;
  } catch {
    return null;
  }
}

function deBase64(text) {
  try {
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

/**
 * El data URL del canvas (WebP o JPEG en base64) amb el bloc TIFF dins, o
 * null. Només canvien els bytes: la capçalera «data:…;base64,» és la mateixa.
 */
export function incrustaEnDataUrl(dataUrl, tiff) {
  if (typeof dataUrl !== 'string') return null;
  const coma = dataUrl.indexOf(',');
  if (coma < 0 || !/;base64$/i.test(dataUrl.slice(0, coma))) return null;
  const bytes = deBase64(dataUrl.slice(coma + 1));
  if (!bytes) return null;
  const format = formatImatge(bytes);
  const amb = format === FORMAT_WEBP ? incrustaEnWebp(bytes, tiff)
    : (format === FORMAT_JPEG ? incrustaEnJpeg(bytes, tiff) : null);
  return amb ? dataUrl.slice(0, coma + 1) + aBase64(amb) : null;
}

/* ─── La foto original (File o Blob) ──────────────────────────────────── */

/* Blob.arrayBuffer és de la Baseline; FileReader queda per als entorns que
   no el tenen (com exif.js). */
function bytesDelFitxer(fitxer) {
  if (typeof fitxer.arrayBuffer === 'function') return fitxer.arrayBuffer();
  return new Promise((resol, rebutja) => {
    const lector = new FileReader();
    lector.onload = () => resol(lector.result);
    lector.onerror = () => rebutja(lector.error);
    lector.readAsArrayBuffer(fitxer);
  });
}

async function llegixPublicable(fitxer) {
  try {
    if (!(fitxer.size > 0) || fitxer.size > PES_MAXIM_ENTRADA) return null;
    return analitzaTiff(extreuTiff(await bytesDelFitxer(fitxer)));
  } catch {
    return null;
  }
}

/* Una lectura per fitxer: el diàleg la fa per a decidir la casella, i la
   compressió hi torna a cada intent del pressupost. Es guarda el bloc
   preparat (pocs KB), mai els bytes de l'original. */
const publicables = new WeakMap();

/**
 * L'EXIF que es publicaria d'una foto (File o Blob, fins a 25 MB), el de
 * analitzaTiff: null (sense EXIF), { estat: PUBLICABLE, tiff, gps,
 * dataCaptura, contingut } o { estat: NO_CONSERVABLE, motiu, tiff: null, gps,
 * dataCaptura }. Mai rebutja.
 */
export function exifPublicable(fitxer) {
  if (typeof Blob === 'undefined' || !(fitxer instanceof Blob)) return Promise.resolve(null);
  if (!publicables.has(fitxer)) publicables.set(fitxer, llegixPublicable(fitxer));
  return publicables.get(fitxer);
}

/**
 * Gauntlet 261016 (Bloc B, P2) · La foto publicaria una ubicació? La que s'ha
 * llegit (gps) o, encara que el lector estricte no l'entenga, la que porta el
 * bloc (contingut.ubicacio): la casella diu el que es publica.
 */
export const teUbicacio = (dades) => Boolean(dades && (dades.gps || dades.contingut?.ubicacio));
/** El mateix per a la data (dataCaptura, o DateTime, DateTimeOriginal o DateTimeDigitized al bloc). */
export const teData = (dades) => Boolean(dades && (dades.dataCaptura || dades.contingut?.data));
/** La foto porta una ubicació o una data que la casella del diàleg deixaria publicar? */
export const teUbicacioOData = (dades) => teUbicacio(dades) || teData(dades);
/** L'EXIF hi és, però no es pot conservar (ESTAT_EXIF.NO_CONSERVABLE)? */
export const esNoConservable = (dades) => dades?.estat === ESTAT_EXIF.NO_CONSERVABLE;
/**
 * Gauntlet 261016 (Codex, 02:26) · Hi ha un EXIF per a la casella del diàleg:
 * publicable (també el d'una càmera sense GPS ni data) o que no es pot
 * conservar (la casella ho diu). Una lectura injectada que només porta { gps,
 * dataCaptura } també val.
 */
export const teExifPerConservar = (dades) => Boolean(dades && (dades.estat || dades.tiff || teUbicacioOData(dades)));
/** L'etiqueta de la casella per al que porta la foto: la ubicació o la data, o només la càmera. */
export const etiquetaConservaExif = (dades) => (teUbicacioOData(dades) ? ETIQUETA_CONSERVA_EXIF : ETIQUETA_CONSERVA_CAMERA);
/** L'avís quan no es pot conservar, amb l'etiqueta que es veu. */
export const errorExifNoConservable = (dades) => (teUbicacioOData(dades) ? ERROR_EXIF_NO_CONSERVABLE : ERROR_EXIF_NO_CONSERVABLE_CAMERA);

/**
 * El data URL del canvas amb l'EXIF publicable de l'original; si no n'hi ha
 * cap o el format no l'admet (o no hi cap: sostreTiff), el mateix data URL
 * (net). Mai rebutja: qui ha triat conservar-lo i no hi cap rep l'avís de
 * fotoDinsDelPressupost (pujadaImatge.js), que mira el format que ha eixit.
 * P1-64 · `precisio` ('exacta' | '100m' | 'poble'): la ubicació s'arrodonix
 * abans d'incrustar-la (ajustaPrecisioGps). Si no es pot arrodonir, la foto
 * ix neta, mai amb el punt exacte (fotoDinsDelPressupost ja ho ha dit abans).
 */
export async function ambExifDeLoriginal(dataUrl, original, { precisio } = {}) {
  try {
    const exif = await exifPublicable(original);
    const tiff = exif?.tiff ? ajustaPrecisioGps(exif.tiff, precisio) : null;
    return (tiff && incrustaEnDataUrl(dataUrl, tiff)) || dataUrl;
  } catch {
    return dataUrl;
  }
}
