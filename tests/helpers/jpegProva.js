/**
 * jpegProva.js — NOMÉS per a les proves (Onada 4, T3a). Munta JPEG sintètics
 * amb un APP1 «Exif» fet a mida, en II o MM, per a provar exif.js sense cap
 * foto real al repositori. El codi de producció no l'importa.
 *
 * Una entrada és { tag, tipus, valors, nombre?, offset? }:
 *   · tipus: TIPUS.BYTE | ASCII | SHORT | LONG | RATIONAL.
 *   · valors: un text (ASCII), números, o parells [num, den] (RATIONAL).
 *   · nombre i offset forcen els camps de l'entrada (fitxers trencats).
 */

export const TIPUS = Object.freeze({ BYTE: 1, ASCII: 2, SHORT: 3, LONG: 4, RATIONAL: 5 });
const MIDA = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 };

const quantitat = (e) => (e.tipus === TIPUS.ASCII ? e.valors.length + 1 : e.valors.length);
const bytesDades = (e) => {
  const b = MIDA[e.tipus] * quantitat(e);
  return b > 4 ? b : 0;
};
const midaIfd = (entrades) => 2 + entrades.length * 12 + 4 + entrades.reduce((s, e) => s + bytesDades(e), 0);

function escriuValors(v, le, pos, e) {
  if (e.tipus === TIPUS.ASCII) {
    [...e.valors].forEach((c, i) => v.setUint8(pos + i, c.charCodeAt(0)));
    v.setUint8(pos + e.valors.length, 0);
    return;
  }
  e.valors.forEach((x, i) => {
    if (e.tipus === TIPUS.BYTE) v.setUint8(pos + i, x);
    else if (e.tipus === TIPUS.SHORT) v.setUint16(pos + i * 2, x, le);
    else if (e.tipus === TIPUS.LONG) v.setUint32(pos + i * 4, x, le);
    else if (e.tipus === TIPUS.RATIONAL) {
      v.setUint32(pos + i * 8, x[0], le);
      v.setUint32(pos + i * 8 + 4, x[1], le);
    }
  });
}

function escriuIfd(v, le, inici, entrades) {
  v.setUint16(inici, entrades.length, le);
  let dades = inici + 2 + entrades.length * 12 + 4;
  entrades.forEach((e, i) => {
    const p = inici + 2 + i * 12;
    v.setUint16(p, e.tag, le);
    v.setUint16(p + 2, e.tipus, le);
    v.setUint32(p + 4, e.nombre ?? quantitat(e), le);
    let desti = p + 8;
    if (bytesDades(e) > 0) {
      v.setUint32(p + 8, e.offset ?? dades, le);
      desti = dades;
      dades += bytesDades(e);
    }
    escriuValors(v, le, desti, e);
  });
  v.setUint32(inici + 2 + entrades.length * 12, 0, le);
}

/**
 * Un bloc TIFF: IFD0 a l'offset 8, després l'Exif IFD i el GPS IFD.
 * punterExif / punterGps forcen on apunten (bucles, fora del buffer).
 */
export function tiff({ ordre = 'MM', ifd0 = [], exif = null, gps = null, punterExif, punterGps, magic = 42 } = {}) {
  const le = ordre === 'II';
  const punters = (exif ? 1 : 0) + (gps ? 1 : 0);
  const posExif = 8 + midaIfd(ifd0) + punters * 12;
  const posGps = posExif + (exif ? midaIfd(exif) : 0);
  const entrades0 = [...ifd0];
  if (exif) entrades0.push({ tag: 0x8769, tipus: TIPUS.LONG, valors: [punterExif ?? posExif] });
  if (gps) entrades0.push({ tag: 0x8825, tipus: TIPUS.LONG, valors: [punterGps ?? posGps] });
  entrades0.sort((a, b) => a.tag - b.tag);
  const total = posGps + (gps ? midaIfd(gps) : 0);
  const v = new DataView(new ArrayBuffer(total));
  v.setUint16(0, ordre === 'II' ? 0x4949 : ordre === 'MM' ? 0x4d4d : 0x5858);
  v.setUint16(2, magic, le);
  v.setUint32(4, 8, le);
  escriuIfd(v, le, 8, entrades0);
  if (exif) escriuIfd(v, le, posExif, exif);
  if (gps) escriuIfd(v, le, posGps, gps);
  return new Uint8Array(v.buffer);
}

export function concatena(...parts) {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const tot = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    tot.set(p, pos);
    pos += p.length;
  }
  return tot;
}

/** Un segment amb marcador i longitud (la longitud inclou els seus 2 bytes). */
export function segment(marcador, contingut) {
  const s = new Uint8Array(4 + contingut.length);
  const v = new DataView(s.buffer);
  v.setUint16(0, 0xff00 | marcador);
  v.setUint16(2, contingut.length + 2);
  s.set(contingut, 4);
  return s;
}

export const SOI = Uint8Array.of(0xff, 0xd8);
export const APP0_JFIF = segment(0xe0, Uint8Array.of(0x4a, 0x46, 0x49, 0x46, 0x00, 1, 1, 0, 0, 1, 0, 1, 0, 0));
/** Un SOS mínim amb unes dades qualssevol i EOI: la part de la imatge, que el lector no toca. */
export const IMATGE = Uint8Array.of(0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0x33, 0xff, 0xd9);

export const app1Exif = (bytesTiff) => segment(0xe1, concatena(Uint8Array.of(0x45, 0x78, 0x69, 0x66, 0, 0), bytesTiff));

/** SOI + APP0 + APP1 «Exif» + imatge. */
export function jpegAmbExif(opcionsTiff) {
  return concatena(SOI, APP0_JFIF, app1Exif(tiff(opcionsTiff)), IMATGE);
}

/** El GPS del centre de la Torre de les Maçanes (mapConfig.js): 38.5919, -0.4184. */
export function gpsTorre({ latRef = 'N', lngRef = 'W', lat, lng, alt = [[4567, 10]], altRef = 0 } = {}) {
  return [
    { tag: 1, tipus: TIPUS.ASCII, valors: latRef },
    { tag: 2, tipus: TIPUS.RATIONAL, valors: lat ?? [[38, 1], [35, 1], [3084, 100]] },
    { tag: 3, tipus: TIPUS.ASCII, valors: lngRef },
    { tag: 4, tipus: TIPUS.RATIONAL, valors: lng ?? [[0, 1], [25, 1], [624, 100]] },
    { tag: 5, tipus: TIPUS.BYTE, valors: [altRef] },
    ...(alt ? [{ tag: 6, tipus: TIPUS.RATIONAL, valors: alt }] : []),
  ];
}

export const orientacio = (o) => ({ tag: 0x0112, tipus: TIPUS.SHORT, valors: [o] });
export const dataOriginal = (text, zona) => [
  { tag: 0x9003, tipus: TIPUS.ASCII, valors: text },
  ...(zona ? [{ tag: 0x9011, tipus: TIPUS.ASCII, valors: zona }] : []),
];
