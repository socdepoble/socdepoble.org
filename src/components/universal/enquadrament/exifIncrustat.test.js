import { describe, expect, test } from 'vitest';
import {
  ESTAT_EXIF, ETIQUETA_CONSERVA_CAMERA, ETIQUETA_CONSERVA_EXIF, MAX_BYTES_TIFF, MAX_BYTES_TIFF_WEBP, MOTIU_EXIF,
  ajustaPrecisioGps, ambExifDeLoriginal, analitzaTiff, etiquetaConservaExif, exifCapEnFormat, exifPublicable, extreuTiff,
  incrustaEnDataUrl, incrustaEnJpeg, incrustaEnWebp, precisioDeGps, preparaTiff, sostreTiff, teExifPerConservar, teUbicacioOData,
} from './exifIncrustat.js';
import { geolocalitzacio } from './geolocalitzacio.js';
import { llegixExif, teExif } from './exif.js';
import {
  APP0_JFIF, IMATGE, SOI, TIPUS, app1Exif, concatena, dataOriginal, gpsTorre, orientacio, segment, tiff,
} from '../../../../tests/helpers/jpegProva.js';
import { FORMAT_JPEG, FORMAT_PNG, FORMAT_WEBP } from './netejaMetadades.js';

/* Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · Bytes sintètics:
   cap foto real al repositori. La foto de prova porta el GPS de la Torre, la
   data, la càmera, un MakerNote, l'orientació 6 i, a l'IFD1, una miniatura
   amb una marca que no pot eixir mai (és l'original sense retallar). */

const ascii = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));

function posicio(bytes, cerca) {
  for (let i = 0; i + cerca.length <= bytes.length; i += 1) {
    let iguals = true;
    for (let k = 0; k < cerca.length && iguals; k += 1) iguals = bytes[i + k] === cerca[k];
    if (iguals) return i;
  }
  return -1;
}

const MARCA_MINIATURA = ascii('MINIATURA-SENSE-RETALLAR');
const MINIATURA = concatena(Uint8Array.of(0xff, 0xd8), MARCA_MINIATURA, Uint8Array.of(0xff, 0xd9));
const MAKER_NOTE = Uint8Array.from({ length: 40 }, (_, i) => (i * 7 + 3) & 0xff);
const CAMERA = 'SONY';

/* Un bloc TIFF com el d'una càmera: IFD0 (orientació i marca), Exif (data i
   MakerNote), GPS i, al final, l'IFD1 amb un valor fora de línia i la
   miniatura. `miniaturaA` força on diu l'IFD1 que és la miniatura;
   `ambMakerNote: false` la fa sense MakerNote. */
function tiffDeCamera({ ordre = 'MM', orientacioValor = 6, miniaturaA = null, ambMakerNote = true } = {}) {
  const base = tiff({
    ordre,
    ifd0: [orientacio(orientacioValor), { tag: 0x010f, tipus: TIPUS.ASCII, valors: CAMERA }],
    exif: [
      ...dataOriginal('2017:05:14 10:22:33', '+02:00'),
      ...(ambMakerNote ? [{ tag: 0x927c, tipus: TIPUS.BYTE, valors: [...MAKER_NOTE] }] : []),
    ],
    gps: gpsTorre(),
  });
  const le = ordre === 'II';
  const posIfd1 = base.length;
  const posValors = posIfd1 + 2 + 3 * 12 + 4;
  const posMiniatura = posValors + 8;
  const t = new Uint8Array(posMiniatura + MINIATURA.length);
  t.set(base, 0);
  const v = new DataView(t.buffer);
  v.setUint32(8 + 2 + v.getUint16(8, le) * 12, posIfd1, le); // IFD0 → IFD1
  v.setUint16(posIfd1, 3, le);
  [[0x011a, 5, posValors], [0x0201, 4, miniaturaA ?? posMiniatura], [0x0202, 4, MINIATURA.length]].forEach(([tag, tipus, valor], i) => {
    const p = posIfd1 + 2 + i * 12;
    v.setUint16(p, tag, le);
    v.setUint16(p + 2, tipus, le);
    v.setUint32(p + 4, 1, le);
    v.setUint32(p + 8, valor, le);
  });
  v.setUint32(posValors, 72, le);
  v.setUint32(posValors + 4, 1, le);
  t.set(MINIATURA, posMiniatura);
  return { bloc: t, posIfd1 };
}

const jpegDeCamera = (bloc) => concatena(SOI, APP0_JFIF, app1Exif(bloc), IMATGE);
/* El bloc dins d'un JPEG mínim, per a llegir-lo amb el lector de sempre. */
const llig = (bloc) => llegixExif(concatena(SOI, app1Exif(bloc)));

/* PNG i WebP mínims: el lector no mira els CRC ni descodifica cap píxel. */
function trosPng(tipus, dades) {
  const t = new Uint8Array(12 + dades.length);
  new DataView(t.buffer).setUint32(0, dades.length);
  t.set(ascii(tipus), 4);
  t.set(dades, 8);
  return t;
}
const FIRMA_PNG = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const pngAmb = (exif) => concatena(FIRMA_PNG, trosPng('IHDR', new Uint8Array(13)), trosPng('eXIf', exif), trosPng('IDAT', Uint8Array.of(1, 2, 3)), trosPng('IEND', new Uint8Array(0)));

function tros(tipus, dades) {
  const t = new Uint8Array(8 + dades.length + (dades.length & 1));
  t.set(ascii(tipus), 0);
  new DataView(t.buffer).setUint32(4, dades.length, true);
  t.set(dades, 8);
  return t;
}
function riff(...trossos) {
  const cos = concatena(ascii('WEBP'), ...trossos);
  const r = new Uint8Array(8 + cos.length);
  r.set(ascii('RIFF'), 0);
  new DataView(r.buffer).setUint32(4, cos.length, true);
  r.set(cos, 8);
  return r;
}
/* Els trossos d'un RIFF, comprovant de passada la mida que declara. */
function trossosDe(webp) {
  const v = new DataView(webp.buffer, webp.byteOffset, webp.byteLength);
  expect(v.getUint32(4, true)).toBe(webp.length - 8);
  const llista = [];
  for (let pos = 12; pos < webp.length;) {
    const longitud = v.getUint32(pos + 4, true);
    llista.push({ tipus: String.fromCharCode(...webp.subarray(pos, pos + 4)), dades: webp.slice(pos + 8, pos + 8 + longitud) });
    pos += 8 + longitud + (longitud & 1);
  }
  return llista;
}
/* Un VP8 de 1.200 × 1.200 (fotograma clau) i un VP8L de 400 × 400 amb alfa. */
const VP8_1200 = Uint8Array.of(0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, 0xb0, 0x04, 0xb0, 0x04, 0x11, 0x22, 0x33);
const bitsVp8l = (399 | (399 << 14) | (1 << 28)) >>> 0;
const VP8L_400_ALFA = Uint8Array.of(0x2f, bitsVp8l & 0xff, (bitsVp8l >>> 8) & 0xff, (bitsVp8l >>> 16) & 0xff, bitsVp8l >>> 24, 0x99);

const aBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const deBase64 = (url) => Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), (c) => c.charCodeAt(0));

/* Codex, relleu 02:26 · Els blocs dels contraexemples, calcats de les seues
   fixtures (/tmp/sdp-codex-exif-incrustat-adversarial/*.oracle.json, sense
   dependre'n): tots els directoris davant (IFD0, Exif, GPS, Interoperabilitat
   i un SubIFD «privat»), i darrere els valors, cadascun en una posició parella
   (el farciment és 0). El MakerNote porta, al seu byte 8, un punter des de la
   capçalera TIFF al valor de 16 bytes del SubIFD: fora del seu propi tros.
   Sense IFD1. `blob` afig a l'IFD0 un valor opac (0xc7b0) de tants bytes:
   amb 70.000, el bloc fa 70.462 B, com el de Codex. */
const MIDA_TIPUS = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1 };
const DESTI_MAKER_NOTE = Uint8Array.of(0x53, 0x44, 0x50, 0x00, 0xff, 0x80, 0x12, 0x34, 0x6a, 0xab, 0xcd, 0xef, 0x07, 0x02, 0x09, 0x01);
const text = (s) => ascii(`${s}\0`);

function tiffDeCodex({ ordre = 'II', blob = 0 } = {}) {
  const le = ordre === 'II';
  const enters = (pas, ...valors) => {
    const b = new Uint8Array(valors.length * pas);
    const v = new DataView(b.buffer);
    valors.forEach((x, i) => (pas === 2 ? v.setUint16(i * 2, x, le) : v.setUint32(i * 4, x, le)));
    return b;
  };
  const racionals = (...parells) => enters(4, ...parells.flat());
  const ifds = [
    ['ifd0', [
      { tag: 0x010f, tipus: 2, dades: text('Synthetic camera') },
      { tag: 0x0112, tipus: 3, dades: enters(2, 1) },
      { tag: 0x014a, ifd: 'privat' },
      { tag: 0x8769, ifd: 'exif' },
      { tag: 0x8825, ifd: 'gps' },
      { tag: 0xc7a1, tipus: 2, dades: text('opaque-ifd0-preserve') },
      ...(blob ? [{ tag: 0xc7b0, tipus: 7, dades: Uint8Array.from({ length: blob }, (_, i) => (i * 31 + 7) & 0xff) }] : []),
    ]],
    ['exif', [
      { tag: 0x9003, tipus: 2, dades: text('2026:10:15 09:15:30') },
      { tag: 0x9011, tipus: 2, dades: text('+02:00') },
      { tag: 0x927c, tipus: 7, mida: 24, dades: (p) => concatena(ascii('SDP-MAKE'), enters(4, p.valor['privat.51107'], 16), Uint8Array.of(8, 2, 7, 4, 9, 1, 0xfe, 0xed)) },
      { tag: 0xa005, ifd: 'interop' },
      { tag: 0xc7a2, tipus: 7, dades: Uint8Array.of(0x00, 0xff, 0x80, 0x41, 0x00, 0x7f, 0x55) },
    ]],
    ['gps', [
      { tag: 1, tipus: 2, dades: text('N') },
      { tag: 2, tipus: 5, dades: racionals([38, 1], [35, 1], [3084, 100]) },
      { tag: 3, tipus: 2, dades: text('W') },
      { tag: 4, tipus: 5, dades: racionals([0, 1], [25, 1], [624, 100]) },
      { tag: 5, tipus: 1, dades: Uint8Array.of(0) },
      { tag: 6, tipus: 5, dades: racionals([4567, 10]) },
    ]],
    ['interop', [{ tag: 1, tipus: 2, dades: ascii('R98\0') }, { tag: 2, tipus: 7, dades: ascii('0100') }]],
    ['privat', [{ tag: 0xc7a3, tipus: 7, dades: DESTI_MAKER_NOTE }]],
  ];
  const bytesDe = (e) => (e.ifd ? 4 : (e.mida ?? e.dades.length));
  const pos = { ifd: {}, valor: {} };
  let cursor = 8;
  for (const [nom, entrades] of ifds) {
    pos.ifd[nom] = cursor;
    cursor += 2 + entrades.length * 12 + 4;
  }
  for (const [nom, entrades] of ifds) {
    for (const e of entrades) {
      const n = bytesDe(e);
      if (n > 4) {
        pos.valor[`${nom}.${e.tag}`] = cursor;
        cursor += n + (n & 1);
      }
    }
  }
  const bloc = new Uint8Array(cursor);
  const v = new DataView(bloc.buffer);
  bloc.set(ascii(ordre), 0);
  v.setUint16(2, 42, le);
  v.setUint32(4, 8, le);
  for (const [nom, entrades] of ifds) {
    v.setUint16(pos.ifd[nom], entrades.length, le);
    entrades.forEach((e, i) => {
      const p = pos.ifd[nom] + 2 + i * 12;
      const n = bytesDe(e);
      v.setUint16(p, e.tag, le);
      v.setUint16(p + 2, e.ifd ? 4 : e.tipus, le);
      v.setUint32(p + 4, e.ifd ? 1 : n / MIDA_TIPUS[e.tipus], le);
      if (e.ifd) {
        v.setUint32(p + 8, pos.ifd[e.ifd], le);
        return;
      }
      const desti = n > 4 ? pos.valor[`${nom}.${e.tag}`] : p + 8;
      if (n > 4) v.setUint32(p + 8, desti, le);
      bloc.set(typeof e.dades === 'function' ? e.dades(pos) : e.dades, desti);
    });
  }
  return { bloc, pos, le };
}

/* On és, dins del directori de `posIfd`, l'entrada de `tag` (per a espatllar-la a posta). */
function entradaDe(bloc, le, posIfd, tag) {
  const v = new DataView(bloc.buffer, bloc.byteOffset, bloc.byteLength);
  for (let i = 0; i < v.getUint16(posIfd, le); i += 1) {
    const p = posIfd + 2 + i * 12;
    if (v.getUint16(p, le) === tag) return { v, p };
  }
  throw new Error(`cap entrada ${tag}`);
}

describe('extreuTiff · el bloc de l’original', () => {
  const { bloc } = tiffDeCamera();

  test('d’un JPEG (APP1 «Exif»), d’un PNG (eXIf, amb «Exif\\0\\0» davant o sense) i d’un WebP (EXIF)', () => {
    expect([...extreuTiff(jpegDeCamera(bloc))]).toEqual([...bloc]);
    expect([...extreuTiff(pngAmb(bloc))]).toEqual([...bloc]);
    expect([...extreuTiff(pngAmb(concatena(ascii('Exif\0\0'), bloc)))]).toEqual([...bloc]);
    expect([...extreuTiff(riff(tros('VP8 ', VP8_1200), tros('EXIF', bloc)))]).toEqual([...bloc]);
  });

  test('sense EXIF, mal format o un altre format: null, mai una excepció', () => {
    expect(extreuTiff(concatena(SOI, APP0_JFIF, IMATGE))).toBeNull();
    expect(extreuTiff(riff(tros('VP8 ', VP8_1200)))).toBeNull();
    expect(extreuTiff(ascii('GIF89a...........'))).toBeNull();
    expect(extreuTiff(null)).toBeNull();
    const sencer = jpegDeCamera(bloc);
    for (let n = 0; n < sencer.length; n += 7) expect(() => extreuTiff(sencer.subarray(0, n))).not.toThrow();
  });
});

describe('preparaTiff · el que es publica', () => {
  test.each(['MM', 'II'])('%s · GPS, data i càmera íntegres; orientació 1; cap byte de la miniatura ni de l’IFD1', (ordre) => {
    const { bloc, posIfd1 } = tiffDeCamera({ ordre });
    const copia = bloc.slice();
    const net = preparaTiff(bloc);
    expect(llig(bloc)).toMatchObject({ orientacio: 6 });
    expect(llig(net)).toEqual({
      orientacio: 1,
      gps: { lat: 38.5919, lng: -0.4184, altitud: 456.7 },
      dataCaptura: '2017-05-14T10:22:33+02:00',
    });
    // La miniatura i l'IFD1 eren al final: es tallen sencers, i l'IFD0 ja no hi apunta.
    expect(posicio(net, MARCA_MINIATURA)).toBe(-1);
    expect(posicio(net, Uint8Array.of(0xff, 0xd8))).toBe(-1);
    expect(net.length).toBeLessThanOrEqual(posIfd1);
    const v = new DataView(net.buffer);
    expect(v.getUint32(8 + 2 + v.getUint16(8, ordre === 'II') * 12, ordre === 'II')).toBe(0);
    // La càmera i el MakerNote, byte a byte i al MATEIX lloc (els seus desplaçaments no es mouen).
    expect(posicio(net, ascii(CAMERA))).toBe(posicio(bloc, ascii(CAMERA)));
    expect(posicio(net, MAKER_NOTE)).toBe(posicio(bloc, MAKER_NOTE));
    expect(posicio(net, MAKER_NOTE)).toBeGreaterThan(0);
    // L'entrada no es toca.
    expect([...bloc]).toEqual([...copia]);
  });

  /* La marca de la càmera passa a viure DARRERE de la miniatura: el bloc ja
     no es pot tallar a l'IFD1, i el que queda al mig s'ha de buidar. La marca
     vella («SONY») queda òrfena: ja no la declara ningú. `orfe` la canvia. */
  function ambMiniaturaAlMig(opcions, orfe = null) {
    const { bloc, posIfd1 } = tiffDeCamera(opcions);
    const amb = concatena(bloc, ascii('NIKO\0'));
    const v = new DataView(amb.buffer);
    for (let i = 0; i < v.getUint16(8); i += 1) {
      if (v.getUint16(8 + 2 + i * 12) === 0x010f) v.setUint32(8 + 2 + i * 12 + 8, bloc.length);
    }
    if (orfe) amb.set(orfe, posicio(bloc, ascii(CAMERA)));
    return { amb, bloc, posIfd1 };
  }

  test('una miniatura al mig: els seus bytes i els de l’IFD1 es posen a zero', () => {
    const { amb, bloc, posIfd1 } = ambMiniaturaAlMig();
    const net = preparaTiff(amb);
    expect(net.length).toBe(amb.length);
    expect(posicio(net, ascii('NIKO'))).toBe(bloc.length);
    expect(posicio(net, MARCA_MINIATURA)).toBe(-1);
    expect(net.subarray(posIfd1, bloc.length).every((b) => b === 0)).toBe(true);
    expect(llig(net)).toMatchObject({ orientacio: 1, gps: { lat: 38.5919 }, dataCaptura: '2017-05-14T10:22:33+02:00' });
  });

  /* Gauntlet 261016 (Codex, relleu 02:26) · GIRADA A POSTA. Abans, tot byte
     orfe es posava a zero, també amb MakerNote, i un MakerNote que apuntara
     fora del seu tros quedava amb el punter i sense la destinació. Ara, amb
     MakerNote, l'orfe es conserva (no se sap si hi apunta); sense, ningú no hi
     apunta i es buida, com abans (llista blanca). */
  test('un byte orfe: sense MakerNote es posa a zero; amb MakerNote es conserva, perquè hi pot apuntar', () => {
    const sense = preparaTiff(ambMiniaturaAlMig({ ambMakerNote: false }).amb);
    expect(posicio(sense, ascii(CAMERA))).toBe(-1);
    expect(posicio(sense, ascii('NIKO'))).toBeGreaterThan(0);
    const { amb, bloc } = ambMiniaturaAlMig();
    expect(posicio(preparaTiff(amb), ascii(CAMERA))).toBe(posicio(bloc, ascii(CAMERA)));
  });

  test('amb MakerNote, un orfe que comença com un JPEG (una miniatura que ningú no declara): no es pot conservar', () => {
    const jpeg = Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 0x00);
    const { amb } = ambMiniaturaAlMig({}, jpeg);
    expect(analitzaTiff(amb)).toMatchObject({ estat: ESTAT_EXIF.NO_CONSERVABLE, motiu: MOTIU_EXIF.MINIATURA, tiff: null });
    expect(preparaTiff(amb)).toBeNull();
    // Sense MakerNote, l'orfe es buida i la resta es publica.
    const sense = preparaTiff(ambMiniaturaAlMig({ ambMakerNote: false }, jpeg).amb);
    expect(posicio(sense, jpeg.subarray(0, 3))).toBe(-1);
  });

  test('una miniatura que trepitja un byte conservat (el MakerNote): no es publica res, i es diu per què', () => {
    const { bloc } = tiffDeCamera();
    const dinsDelMakerNote = posicio(bloc, MAKER_NOTE) + 4;
    const trepitja = tiffDeCamera({ miniaturaA: dinsDelMakerNote }).bloc;
    expect(preparaTiff(trepitja)).toBeNull();
    expect(analitzaTiff(trepitja)).toMatchObject({
      estat: ESTAT_EXIF.NO_CONSERVABLE, motiu: MOTIU_EXIF.MINIATURA, tiff: null, gps: { lat: 38.5919 }, dataCaptura: '2017-05-14T10:22:33+02:00',
    });
  });

  test('un IFD conservat que declara dades d’imatge (una miniatura a l’IFD0): no es pot conservar', () => {
    const ifd0AmbMiniatura = tiff({ ifd0: [{ tag: 0x0201, tipus: TIPUS.LONG, valors: [8] }, { tag: 0x0202, tipus: TIPUS.LONG, valors: [4] }] });
    expect(analitzaTiff(ifd0AmbMiniatura)).toMatchObject({ estat: ESTAT_EXIF.NO_CONSERVABLE, motiu: MOTIU_EXIF.MINIATURA });
  });

  test('sense orientació ni GPS: la data i la càmera es publiquen igual', () => {
    const bloc = tiff({ ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: CAMERA }], exif: dataOriginal('2020:02:29 08:00:00') });
    const net = preparaTiff(bloc);
    expect(llig(net)).toEqual({ orientacio: null, gps: null, dataCaptura: '2020-02-29T08:00:00' });
    expect(posicio(net, ascii(CAMERA))).toBeGreaterThan(0);
  });

  test('bloc invàlid o IFD0 en bucle com a IFD1: preparaTiff null, analitzaTiff diu «il·legible», mai una excepció', () => {
    expect(preparaTiff(ascii('XX*\0\0\0\0\x08'))).toBeNull();
    expect(preparaTiff(tiff({ magic: 43 }))).toBeNull();
    expect(preparaTiff(new Uint8Array(4))).toBeNull();
    expect(preparaTiff(null)).toBeNull();
    expect(analitzaTiff(tiff({ magic: 43 }))).toMatchObject({ estat: ESTAT_EXIF.NO_CONSERVABLE, motiu: MOTIU_EXIF.ILLEGIBLE });
    expect(analitzaTiff(null)).toBeNull(); // cap bloc: sense EXIF
    // L'IFD0 apunta a si mateix com a IFD1: es publica l'IFD0, sense bucle (la cadena de l'IFD1 no es publica).
    const bucle = tiff({ ifd0: [orientacio(3)] });
    new DataView(bucle.buffer).setUint32(8 + 2 + 12, 8);
    expect(llig(preparaTiff(bucle))).toMatchObject({ orientacio: 1 });
    /* Gauntlet 261016 (Codex, relleu 02:26) · GIRADA A POSTA. Un MakerNote de
       70.000 bytes no cabria en cap APP1, però sí en un WebP: el sostre ja no
       és el de preparaTiff, sinó el del format d'eixida (sostreTiff). */
    const gran = tiff({ exif: [{ tag: 0x927c, tipus: TIPUS.BYTE, valors: new Array(70000).fill(1) }] });
    expect(preparaTiff(gran).length).toBe(gran.length);
    expect(MAX_BYTES_TIFF).toBe(65527);
    const { bloc } = tiffDeCamera();
    for (let n = 0; n < bloc.length; n += 5) {
      expect(() => preparaTiff(bloc.subarray(0, n))).not.toThrow();
      expect(() => analitzaTiff(bloc.subarray(0, n))).not.toThrow();
    }
  });
});

describe('Codex 02:26 · el graf sencer: res del que s’apunta no es buida ni es talla', () => {
  test.each(['II', 'MM'])('%s · 450 B sense IFD1: ix sencer, byte a byte (el MakerNote, el SubIFD i el valor on apunta el MakerNote)', (ordre) => {
    const { bloc, pos } = tiffDeCodex({ ordre });
    expect(bloc.length).toBe(450);
    expect(pos.valor['privat.51107']).toBe(434);
    const net = preparaTiff(bloc);
    // L'orientació ja era 1 i no hi ha IFD1: no canvia cap byte.
    expect(net.length).toBe(450);
    expect([...net]).toEqual([...bloc]);
    expect([...net.subarray(434, 450)]).toEqual([...DESTI_MAKER_NOTE]);
    expect([...net.subarray(pos.ifd.privat, pos.ifd.privat + 18)]).toEqual([...bloc.subarray(pos.ifd.privat, pos.ifd.privat + 18)]);
    expect(analitzaTiff(bloc)).toMatchObject({
      estat: ESTAT_EXIF.PUBLICABLE, gps: { lat: 38.5919, lng: -0.4184, altitud: 456.7 }, dataCaptura: '2026-10-15T09:15:30+02:00',
    });
  });

  test('amb un IFD1 i la seua miniatura al final: es tallen, i la resta ix igual', () => {
    const { bloc, le } = tiffDeCodex();
    const miniatura = concatena(Uint8Array.of(0xff, 0xd8), MARCA_MINIATURA, Uint8Array.of(0xff, 0xd9));
    const ifd1 = new Uint8Array(2 + 2 * 12 + 4);
    const amb = concatena(bloc, ifd1, miniatura);
    const v = new DataView(amb.buffer);
    v.setUint32(8 + 2 + 6 * 12, bloc.length, le); // IFD0 → IFD1
    v.setUint16(bloc.length, 2, le);
    [[0x0201, bloc.length + ifd1.length], [0x0202, miniatura.length]].forEach(([tag, valor], i) => {
      const p = bloc.length + 2 + i * 12;
      v.setUint16(p, tag, le);
      v.setUint16(p + 2, 4, le);
      v.setUint32(p + 4, 1, le);
      v.setUint32(p + 8, valor, le);
    });
    expect([...preparaTiff(amb)]).toEqual([...bloc]);
  });

  test('els contraexemples de mal format: un estat explícit («no es pot conservar»), mai un bloc a mitges', () => {
    /* Un camp d'una entrada (+2 el tipus, +4 la quantitat, +8 el valor), canviat. */
    const posa = (ifd, tag, camp, valor) => ({ bloc, pos, le }) => {
      const { v, p } = entradaDe(bloc, le, pos.ifd[ifd], tag);
      if (camp === 2) v.setUint16(p + camp, valor, le);
      else v.setUint32(p + camp, valor === 'exif' ? pos.ifd.exif : valor, le);
    };
    const espatlla = {
      'un Exif que torna a l’IFD0 (cicle)': posa('ifd0', 0x8769, 8, 8),
      'el GPS i l’Exif al mateix directori': posa('ifd0', 0x8825, 8, 'exif'),
      'un SubIFD fora del bloc': posa('ifd0', 0x014a, 8, 0xfffffff0),
      'un valor que desborda el bloc': posa('exif', 0xc7a2, 4, 0x40000000),
      'un tipus TIFF desconegut (14)': posa('exif', 0xc7a2, 2, 14),
    };
    for (const [cas, aplica] of Object.entries(espatlla)) {
      const fixture = tiffDeCodex();
      aplica(fixture);
      expect(analitzaTiff(fixture.bloc), cas).toMatchObject({ estat: ESTAT_EXIF.NO_CONSERVABLE, motiu: MOTIU_EXIF.GRAF, tiff: null });
      expect(preparaTiff(fixture.bloc), cas).toBeNull();
    }
    // El GPS i la data es lligen igual (per a dir-ho a la casella), quan s'hi pot arribar.
    const fora = tiffDeCodex();
    espatlla['un SubIFD fora del bloc'](fora);
    expect(analitzaTiff(fora.bloc)).toMatchObject({ gps: { lat: 38.5919 }, dataCaptura: '2026-10-15T09:15:30+02:00' });
    // Un IFD0 que no s'entén: il·legible.
    expect(analitzaTiff(tiffDeCodex().bloc.slice(0, 19))).toMatchObject({ estat: ESTAT_EXIF.NO_CONSERVABLE, motiu: MOTIU_EXIF.ILLEGIBLE });
  });
});

describe('Codex 02:26 · el sostre és el del format d’eixida', () => {
  const { bloc } = tiffDeCodex({ blob: 70000 });
  const CANVAS_JPEG = concatena(SOI, APP0_JFIF, IMATGE);

  test('el TIFF de 70.462 B es prepara sencer: cap en un WebP, no en un APP1 de JPEG', () => {
    expect(bloc.length).toBe(70462);
    const net = preparaTiff(bloc);
    expect([...net]).toEqual([...bloc]);
    expect([sostreTiff(FORMAT_JPEG), sostreTiff(FORMAT_WEBP), sostreTiff(FORMAT_PNG)]).toEqual([MAX_BYTES_TIFF, MAX_BYTES_TIFF_WEBP, 0]);
    expect(MAX_BYTES_TIFF_WEBP).toBeGreaterThan(80000);
    const webp = incrustaEnWebp(riff(tros('VP8 ', VP8_1200)), net);
    expect([...extreuTiff(webp)]).toEqual([...net]);
    expect(incrustaEnJpeg(CANVAS_JPEG, net)).toBeNull();
    const dades = analitzaTiff(bloc);
    expect(exifCapEnFormat(dades, FORMAT_WEBP)).toBe(true);
    expect(exifCapEnFormat(dades, FORMAT_JPEG)).toBe(false);
    expect(exifCapEnFormat(dades, FORMAT_PNG)).toBe(false);
    expect(exifCapEnFormat(null, FORMAT_WEBP)).toBe(false);
  });

  test('exifPublicable d’un WebP amb eixe EXIF: publicable, amb el GPS i la data, que són més enllà dels primers 64 KB', async () => {
    const f = new File([riff(tros('VP8 ', VP8_1200), tros('EXIF', bloc))], 'arbre.webp', { type: 'image/webp' });
    const dades = await exifPublicable(f);
    expect(dades).toMatchObject({
      estat: ESTAT_EXIF.PUBLICABLE, gps: { lat: 38.5919, lng: -0.4184, altitud: 456.7 }, dataCaptura: '2026-10-15T09:15:30+02:00',
    });
    expect(dades.tiff.length).toBe(70462);
    const canvas = `data:image/webp;base64,${aBase64(riff(tros('VP8 ', VP8_1200)))}`;
    expect([...extreuTiff(deBase64(await ambExifDeLoriginal(canvas, f)))]).toEqual([...bloc]);
  });
});

describe('incrustaEnJpeg · un APP1 darrere de SOI i de l’APP0', () => {
  const net = preparaTiff(tiffDeCamera().bloc);
  const CANVAS = concatena(SOI, APP0_JFIF, IMATGE);

  test('el JPEG del canvas porta l’EXIF publicable i la imatge intacta', () => {
    const amb = incrustaEnJpeg(CANVAS, net);
    expect(teExif(amb)).toBe(true);
    expect(llegixExif(amb)).toMatchObject({ orientacio: 1, gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2017-05-14T10:22:33+02:00' });
    expect([...amb.subarray(0, 2 + APP0_JFIF.length)]).toEqual([...SOI, ...APP0_JFIF]);
    expect([...amb.subarray(2 + APP0_JFIF.length, 4 + APP0_JFIF.length)]).toEqual([0xff, 0xe1]);
    expect([...amb.subarray(amb.length - IMATGE.length)]).toEqual([...IMATGE]);
    expect([...extreuTiff(amb)]).toEqual([...net]);
  });

  test('sense APP0, darrere de SOI; ja amb EXIF, cap bloc o cap JPEG: null', () => {
    const amb = incrustaEnJpeg(concatena(SOI, segment(0xdb, Uint8Array.of(0, 1, 2, 3)), IMATGE), net);
    expect([...amb.subarray(0, 4)]).toEqual([0xff, 0xd8, 0xff, 0xe1]);
    expect(incrustaEnJpeg(amb, net)).toBeNull();
    expect(incrustaEnJpeg(CANVAS, null)).toBeNull();
    expect(incrustaEnJpeg(riff(tros('VP8 ', VP8_1200)), net)).toBeNull();
  });
});

describe('incrustaEnWebp · el tros EXIF i el bit E de VP8X', () => {
  const net = preparaTiff(tiffDeCamera().bloc);

  test('un WebP simple (VP8): naix el VP8X amb les mides reals i el bit E, i la imatge no canvia', () => {
    const amb = incrustaEnWebp(riff(tros('VP8 ', VP8_1200)), net);
    const [vp8x, imatge, exif, ...resta] = trossosDe(amb);
    expect([vp8x.tipus, imatge.tipus, exif.tipus, resta]).toEqual(['VP8X', 'VP8 ', 'EXIF', []]);
    expect(vp8x.dades[0]).toBe(0x08);
    const v = new DataView(vp8x.dades.buffer);
    expect([(v.getUint32(4, true) & 0xffffff) + 1, (v.getUint32(6, true) >>> 8) + 1]).toEqual([1200, 1200]);
    expect([...imatge.dades]).toEqual([...VP8_1200]);
    expect([...exif.dades]).toEqual([...net]);
    expect(llig(extreuTiff(amb))).toMatchObject({ orientacio: 1, gps: { lat: 38.5919 } });
  });

  test('un VP8L amb alfa: el VP8X diu 400 × 400 i porta els bits L i E', () => {
    const [vp8x] = trossosDe(incrustaEnWebp(riff(tros('VP8L', VP8L_400_ALFA)), net));
    expect(vp8x.dades[0]).toBe(0x18);
    const v = new DataView(vp8x.dades.buffer);
    expect([(v.getUint32(4, true) & 0xffffff) + 1, (v.getUint32(6, true) >>> 8) + 1]).toEqual([400, 400]);
  });

  test('un WebP ampliat: conserva les banderes, canvia l’EXIF vell pel nou i el posa abans de l’XMP', () => {
    const VP8X = Uint8Array.of(0x10, 0, 0, 0, 0xaf, 0x04, 0x00, 0xaf, 0x04, 0x00);
    const vell = riff(tros('VP8X', VP8X), tros('ALPH', Uint8Array.of(1, 2)), tros('VP8 ', VP8_1200), tros('EXIF', ascii('VELL')), tros('XMP ', ascii('<x/>')));
    const trossos = trossosDe(incrustaEnWebp(vell, net));
    expect(trossos.map((x) => x.tipus)).toEqual(['VP8X', 'ALPH', 'VP8 ', 'EXIF', 'XMP ']);
    expect(trossos[0].dades[0]).toBe(0x18);
    expect([...trossos[0].dades.subarray(1)]).toEqual([...VP8X.subarray(1)]);
    expect([...trossos[3].dades]).toEqual([...net]);
  });

  test('un bloc de llargària senar porta el byte de farciment i el RIFF quadra', () => {
    const senar = net.length % 2 ? net : net.subarray(0, net.length - 1);
    const amb = incrustaEnWebp(riff(tros('VP8 ', VP8_1200)), senar);
    expect(amb.length % 2).toBe(0);
    expect([...trossosDe(amb).at(-1).dades]).toEqual([...senar]);
  });

  test('cap WebP, RIFF truncat o un VP8 que no és fotograma clau: null', () => {
    expect(incrustaEnWebp(concatena(SOI, IMATGE), net)).toBeNull();
    expect(incrustaEnWebp(riff(tros('VP8 ', VP8_1200)).subarray(0, 20), net)).toBeNull();
    expect(incrustaEnWebp(riff(tros('VP8 ', Uint8Array.of(0x11, ...VP8_1200.subarray(1)))), net)).toBeNull();
  });
});

describe('el data URL i la foto original', () => {
  const { bloc } = tiffDeCamera();
  const foto = () => new File([jpegDeCamera(bloc)], 'arbre.jpg', { type: 'image/jpeg' });
  const CANVAS_WEBP = `data:image/webp;base64,${aBase64(riff(tros('VP8 ', VP8_1200)))}`;

  test('incrustaEnDataUrl · canvien els bytes, no la capçalera; un PNG no en porta', () => {
    const net = preparaTiff(bloc);
    const amb = incrustaEnDataUrl(CANVAS_WEBP, net);
    expect(amb.startsWith('data:image/webp;base64,')).toBe(true);
    expect([...extreuTiff(deBase64(amb))]).toEqual([...net]);
    expect(incrustaEnDataUrl(`data:image/png;base64,${aBase64(pngAmb(new Uint8Array(8)))}`, net)).toBeNull();
    expect(incrustaEnDataUrl('data:image/webp,VP8', net)).toBeNull();
  });

  test('exifPublicable · el bloc preparat, el GPS i la data; una sola lectura per fitxer', async () => {
    const f = foto();
    const promesa = exifPublicable(f);
    expect(exifPublicable(f)).toBe(promesa);
    const dades = await promesa;
    expect([...dades.tiff]).toEqual([...preparaTiff(bloc)]);
    expect(dades).toMatchObject({ estat: ESTAT_EXIF.PUBLICABLE, gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2017-05-14T10:22:33+02:00' });
    expect(teUbicacioOData(dades)).toBe(true);
    expect(teExifPerConservar(dades)).toBe(true);
  });

  test('exifPublicable · sense EXIF, buit o que no és un fitxer: null', async () => {
    expect(await exifPublicable(new File([concatena(SOI, APP0_JFIF, IMATGE)], 'net.jpg', { type: 'image/jpeg' }))).toBeNull();
    expect(await exifPublicable(new File([], 'buit.jpg', { type: 'image/jpeg' }))).toBeNull();
    expect(await exifPublicable('/assets/foto.jpg')).toBeNull();
    expect(teUbicacioOData(null)).toBe(false);
    expect(teUbicacioOData({ gps: null, dataCaptura: null })).toBe(false);
    expect(teExifPerConservar(null)).toBe(false);
    expect(teExifPerConservar({ gps: null, dataCaptura: null })).toBe(false);
  });

  /* Codex, relleu 02:26 · Una càmera sense GPS ni data també té un EXIF
     publicable (la marca, el model i el MakerNote): la casella l'oferix. */
  test('exifPublicable · només la càmera: publicable, sense ubicació ni data; un bloc trencat: no es pot conservar (no null)', async () => {
    const camera = tiff({ ifd0: [orientacio(6), { tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Canon' }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'EOS R6' }] });
    const dades = await exifPublicable(new File([jpegDeCamera(camera)], 'camera.jpg', { type: 'image/jpeg' }));
    expect(dades).toMatchObject({ estat: ESTAT_EXIF.PUBLICABLE, gps: null, dataCaptura: null });
    expect(teUbicacioOData(dades)).toBe(false);
    expect(teExifPerConservar(dades)).toBe(true);
    const trencat = tiff({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre(), punterExif: 0x7fffffff });
    const noEs = await exifPublicable(new File([jpegDeCamera(trencat)], 'trencat.jpg', { type: 'image/jpeg' }));
    expect(noEs).toMatchObject({ estat: ESTAT_EXIF.NO_CONSERVABLE, motiu: MOTIU_EXIF.GRAF, tiff: null, gps: { lat: 38.5919 } });
    expect(teExifPerConservar(noEs)).toBe(true);
  });

  test('ambExifDeLoriginal · el WebP del canvas amb el GPS de l’original i sense la miniatura; sense EXIF, el mateix', async () => {
    const amb = deBase64(await ambExifDeLoriginal(CANVAS_WEBP, foto()));
    expect(llig(extreuTiff(amb))).toMatchObject({ orientacio: 1, gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2017-05-14T10:22:33+02:00' });
    expect(posicio(amb, MARCA_MINIATURA)).toBe(-1);
    const neta = new File([concatena(SOI, APP0_JFIF, IMATGE)], 'net.jpg', { type: 'image/jpeg' });
    expect(await ambExifDeLoriginal(CANVAS_WEBP, neta)).toBe(CANVAS_WEBP);
    expect(await ambExifDeLoriginal(CANVAS_WEBP, null)).toBe(CANVAS_WEBP);
  });
});

/* Gauntlet 261016 (Bloc B, privacitat i consentiment de l'EXIF publicable) ·
   P1: un MakerNote que porta dins un JPEG (la previsualització de l'original
   sense retallar, com la PreviewImage de Nikon, Pentax o Casio) no es publica;
   la resta del graf, sí. P2: l'etiqueta i l'avís es decidixen pel que porta el
   bloc que es publica (`contingut`), no pel que el lector estricte (exif.js)
   n'ha sabut interpretar. */
const textTiff = (tag, valors) => ({ tag, tipus: TIPUS.ASCII, valors });

/* El directori d'un punter de l'IFD0 (0x8769, 0x8825): on és, els seus tags i el «següent». */
function directoriDe(bloc, ordre, tagPunter) {
  const le = ordre === 'II';
  const { v, p } = entradaDe(bloc, le, 8, tagPunter);
  const pos = v.getUint32(p + 8, le);
  const n = v.getUint16(pos, le);
  const tags = Array.from({ length: n }, (_, i) => v.getUint16(pos + 2 + i * 12, le));
  return { pos, n, tags, seguent: v.getUint32(pos + 2 + n * 12, le), valor: (i) => v.getUint32(pos + 2 + i * 12 + 8, le) };
}

describe('Bloc B · P1 · un MakerNote que porta dins una previsualització JPEG', () => {
  const MARCA_PREVIA = ascii('ORIGINAL-SENSE-RETALLAR');
  const PREVIA = concatena(SOI, APP0_JFIF, MARCA_PREVIA, Uint8Array.of(0xff, 0xd9));
  // Com el d'una Nikon: una capçalera pròpia de 10 bytes i, darrere, la previsualització.
  const MAKER_NOTE_AMB_JPEG = concatena(ascii('Nikon\0'), Uint8Array.of(0x02, 0x10, 0x00, 0x00), PREVIA);
  const SERIE = '0123456789';
  const makerNote = (valors, extra = {}) => ({ tag: 0x927c, tipus: TIPUS.BYTE, valors: [...valors], ...extra });
  /* El MakerNote al mig de l'Exif IFD: davant, la data; darrere, una entrada
     amb el valor dins (PixelXDimension) i una amb el valor fora (el número de sèrie). */
  const blocAmb = ({ ordre = 'MM', mn = makerNote(MAKER_NOTE_AMB_JPEG), serie = {} } = {}) => tiff({
    ordre,
    ifd0: [orientacio(6), textTiff(0x010f, 'NIKON'), textTiff(0x0110, 'D850')],
    exif: [...dataOriginal('2017:05:14 10:22:33'), mn, { tag: 0xa002, tipus: TIPUS.LONG, valors: [4032] }, { ...textTiff(0xa431, SERIE), ...serie }],
    gps: gpsTorre(),
  });

  test.each(['MM', 'II'])('%s · l’entrada ix del directori (una menys, en ordre, «següent» a 0) i els seus bytes van a zero; el GPS, la data, la marca, el model i les altres entrades es conserven', (ordre) => {
    const bloc = blocAmb({ ordre });
    const abans = directoriDe(bloc, ordre, 0x8769);
    expect(abans.tags).toEqual([0x9003, 0x927c, 0xa002, 0xa431]);
    const lloc = posicio(bloc, MAKER_NOTE_AMB_JPEG);
    const dades = analitzaTiff(bloc);
    expect(dades).toMatchObject({ estat: ESTAT_EXIF.PUBLICABLE, gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2017-05-14T10:22:33' });
    const net = dades.tiff;
    expect(posicio(net, MARCA_PREVIA)).toBe(-1);
    expect(posicio(net, Uint8Array.of(0xff, 0xd8))).toBe(-1);
    expect(net.subarray(lloc, lloc + MAKER_NOTE_AMB_JPEG.length).every((b) => b === 0)).toBe(true);
    const despres = directoriDe(net, ordre, 0x8769);
    expect(despres.pos).toBe(abans.pos);
    expect(despres.tags).toEqual([0x9003, 0xa002, 0xa431]);
    expect(despres.seguent).toBe(0);
    expect(despres.valor(1)).toBe(4032); // el valor de dins viatja amb la seua entrada
    expect(despres.valor(2)).toBe(abans.valor(3)); // el de fora no s'ha mogut
    // La cua que ha quedat lliure (12 bytes), a zero.
    const fiNou = despres.pos + 2 + 3 * 12 + 4;
    expect(net.subarray(fiNou, fiNou + 12).every((b) => b === 0)).toBe(true);
    expect(posicio(net, ascii(SERIE))).toBe(posicio(bloc, ascii(SERIE)));
    expect(posicio(net, ascii('NIKON'))).toBe(posicio(bloc, ascii('NIKON')));
    expect(posicio(net, ascii('D850'))).toBe(posicio(bloc, ascii('D850')));
    expect(llig(net)).toMatchObject({ orientacio: 1, gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2017-05-14T10:22:33' });
    // Re-llegit, el bloc ja net és publicable tal qual (el re-enquadrament d'una foto ja pujada).
    expect([...preparaTiff(net)]).toEqual([...net]);
  });

  test('la previsualització comença dins del MakerNote i continua fora (un orfe): sense cap MakerNote conservat, l’orfe també va a zero', () => {
    const net = preparaTiff(blocAmb({ mn: makerNote(MAKER_NOTE_AMB_JPEG, { nombre: 12 }) }));
    expect(net).not.toBeNull();
    expect(posicio(net, MARCA_PREVIA)).toBe(-1);
    expect(posicio(net, Uint8Array.of(0xff, 0xd8))).toBe(-1);
    expect(posicio(net, ascii(SERIE))).toBeGreaterThan(0);
    expect(llig(net)).toMatchObject({ gps: { lat: 38.5919 }, dataCaptura: '2017-05-14T10:22:33' });
  });

  test('si el MakerNote és l’única entrada del seu directori, el directori quedaria buit (TIFF 6.0 en vol una): no es pot conservar, i es diu', () => {
    const bloc = tiff({ ifd0: [textTiff(0x010f, 'NIKON')], exif: [makerNote(MAKER_NOTE_AMB_JPEG)], gps: gpsTorre() });
    expect(analitzaTiff(bloc)).toMatchObject({ estat: ESTAT_EXIF.NO_CONSERVABLE, motiu: MOTIU_EXIF.MINIATURA, tiff: null, gps: { lat: 38.5919 } });
  });

  test('si una altra entrada apunta dins del MakerNote, posar-lo a zero la trencaria: no es pot conservar', () => {
    const lloc = posicio(blocAmb(), MAKER_NOTE_AMB_JPEG);
    const bloc = blocAmb({ serie: { offset: lloc + 4 } });
    expect(analitzaTiff(bloc)).toMatchObject({ estat: ESTAT_EXIF.NO_CONSERVABLE, motiu: MOTIU_EXIF.MINIATURA, tiff: null });
  });

  test('control: un FF D8 FF sense cap segment de veres darrere no és cap JPEG; el MakerNote es publica sencer, com abans', () => {
    const fals = concatena(ascii('Nikon\0'), Uint8Array.of(0x02, 0x10, 0xff, 0xd8, 0xff, 0x00, 0x00, 0x01));
    const bloc = blocAmb({ mn: makerNote(fals) });
    const net = preparaTiff(bloc);
    expect(posicio(net, fals)).toBe(posicio(bloc, fals));
    expect(directoriDe(net, 'MM', 0x8769).tags).toEqual([0x9003, 0x927c, 0xa002, 0xa431]);
  });
});

describe('Bloc B · P2 · l’etiqueta diu el que es publica: el GPS IFD i les dates del bloc, no el que n’ha entés el lector', () => {
  const MARCA = textTiff(0x010f, 'Canon');

  test('un GPS IFD sense les referències N/S i E/W: el lector no el llig, però es publica; l’etiqueta diu la ubicació', () => {
    const dades = analitzaTiff(tiff({ ifd0: [MARCA], gps: gpsTorre().filter((e) => e.tag !== 1 && e.tag !== 3) }));
    expect(dades).toMatchObject({ estat: ESTAT_EXIF.PUBLICABLE, gps: null, dataCaptura: null, contingut: { ubicacio: true, data: false } });
    expect(teUbicacioOData(dades)).toBe(true);
    expect(etiquetaConservaExif(dades)).toBe(ETIQUETA_CONSERVA_EXIF);
  });

  test('uns segons arrodonits a 60 (38° 35′ 60″): el lector torna null, però la latitud es publica; l’etiqueta diu la ubicació', () => {
    const dades = analitzaTiff(tiff({ ifd0: [MARCA], gps: gpsTorre({ lat: [[38, 1], [35, 1], [60, 1]] }) }));
    expect(dades).toMatchObject({ estat: ESTAT_EXIF.PUBLICABLE, gps: null, contingut: { ubicacio: true } });
    expect(etiquetaConservaExif(dades)).toBe(ETIQUETA_CONSERVA_EXIF);
  });

  test.each([['DateTime (0x0132), a l’IFD0', 0x0132], ['DateTimeDigitized (0x9004), a l’Exif IFD', 0x9004]])('la data només a %s: el lector no la llig, però es publica', (_nom, tag) => {
    const data = textTiff(tag, '2024:05:12 10:30:00');
    const dades = analitzaTiff(tag === 0x0132 ? tiff({ ifd0: [MARCA, data] }) : tiff({ ifd0: [MARCA], exif: [data] }));
    expect(dades).toMatchObject({ estat: ESTAT_EXIF.PUBLICABLE, gps: null, dataCaptura: null, contingut: { ubicacio: false, data: true } });
    expect(etiquetaConservaExif(dades)).toBe(ETIQUETA_CONSERVA_EXIF);
  });

  test('control: un GPS IFD amb només la versió (0x0000) no porta cap ubicació; l’etiqueta és la de la càmera', () => {
    const dades = analitzaTiff(tiff({ ifd0: [MARCA], gps: [{ tag: 0, tipus: TIPUS.BYTE, valors: [2, 2, 0, 0] }] }));
    expect(dades).toMatchObject({ estat: ESTAT_EXIF.PUBLICABLE, contingut: { ubicacio: false, data: false } });
    expect(etiquetaConservaExif(dades)).toBe(ETIQUETA_CONSERVA_CAMERA);
  });

  test('P2 (avatar) · les dades que identifiquen la càmera o una persona: marca, model, números de sèrie i noms, en qualsevol directori conservat', () => {
    const tot = analitzaTiff(tiff({
      ifd0: [MARCA, textTiff(0x0110, 'EOS R6'), textTiff(0x013b, 'Maria')],
      exif: [textTiff(0xa430, 'Maria'), textTiff(0xa431, '0123456789'), textTiff(0xa435, 'L-42')],
    }));
    expect(tot.contingut).toEqual({ ubicacio: false, data: false, marca: true, model: true, serie: true, nom: true });
    // Una entrada buida (només el NUL) no publica res.
    const nomesMarca = analitzaTiff(tiff({ ifd0: [MARCA], exif: [textTiff(0xa431, '')] }));
    expect(nomesMarca.contingut).toEqual({ ubicacio: false, data: false, marca: true, model: false, serie: false, nom: false });
  });
});

/* P1-64 (pla 261028_1526 §3.1.1; Mestre 261028, decisió 8) · La precisió de
   la ubicació, EN EL LLOC: el fitxer (el registre del consentiment) i el camp
   (geolocalitzacio) diuen el mateix punt, i el denominador en fa de marca. */
describe('P1-64 · ajustaPrecisioGps i precisioDeGps', () => {
  /* Els bytes on van els valors de GPSLatitude (2), GPSLongitude (4) i GPSAltitude (6). */
  function rangsGps(bloc, ordre) {
    const le = ordre === 'II';
    const v = new DataView(bloc.buffer, bloc.byteOffset, bloc.byteLength);
    const { pos } = directoriDe(bloc, ordre, 0x8825);
    const rangs = [];
    for (let i = 0; i < v.getUint16(pos, le); i += 1) {
      const p = pos + 2 + i * 12;
      const tag = v.getUint16(p, le);
      if (tag === 2 || tag === 4) rangs.push([v.getUint32(p + 8, le), 24]);
      if (tag === 6) rangs.push([v.getUint32(p + 8, le), 8]);
    }
    return rangs;
  }

  test.each(['MM', 'II'])('%s · el viatge d’anada i tornada per a les tres precisions, amb el camp i el fitxer d’acord', (ordre) => {
    const net = preparaTiff(tiffDeCamera({ ordre }).bloc);
    expect(precisioDeGps(net)).toBe('exacta');
    expect(ajustaPrecisioGps(net, 'exacta')).toBe(net);
    expect(ajustaPrecisioGps(net)).toBe(net);
    for (const precisio of ['100m', 'poble']) {
      const ajustat = ajustaPrecisioGps(net, precisio);
      expect(ajustat).not.toBe(net);
      expect(ajustat.length).toBe(net.length);
      expect(precisioDeGps(ajustat)).toBe(precisio);
      const camp = geolocalitzacio({ lat: 38.5919, lng: -0.4184, precisio, origen: 'exif' });
      expect(llig(ajustat).gps).toEqual({ lat: camp.lat, lng: camp.lng, altitud: 500 });
    }
    // L'entrada no es toca.
    expect(llig(net).gps).toEqual({ lat: 38.5919, lng: -0.4184, altitud: 456.7 });
  });

  test('cap offset es mou i el MakerNote queda intacte: només canvien els valors de la latitud, la longitud i l’altitud', () => {
    const net = preparaTiff(tiffDeCamera().bloc);
    const ajustat = ajustaPrecisioGps(net, 'poble');
    const rangs = rangsGps(net, 'MM');
    expect(rangs).toHaveLength(3);
    const dinsDelGps = (i) => rangs.some(([a, n]) => i >= a && i < a + n);
    const canviats = [...net.keys()].filter((i) => net[i] !== ajustat[i]);
    expect(canviats.length).toBeGreaterThan(0);
    expect(canviats.filter((i) => !dinsDelGps(i))).toEqual([]);
    expect(posicio(ajustat, MAKER_NOTE)).toBe(posicio(net, MAKER_NOTE));
    expect(posicio(ajustat, MAKER_NOTE)).toBeGreaterThan(0);
    expect(analitzaTiff(ajustat).estat).toBe(ESTAT_EXIF.PUBLICABLE);
  });

  test('el sud i l’oest arrodonixen igual que el camp; sense GPS IFD, la mateixa referència; una precisió desconeguda, null', () => {
    const sud = tiff({ gps: gpsTorre({ latRef: 'S', lngRef: 'W', lat: [[38, 1], [35, 1], [3084, 100]], lng: [[0, 1], [24, 1], [5580, 100]] }) });
    const ajustat = ajustaPrecisioGps(sud, '100m');
    const camp = geolocalitzacio({ lat: -38.5919, lng: -0.4155, precisio: '100m', origen: 'exif' });
    expect(llig(ajustat).gps).toMatchObject({ lat: camp.lat, lng: camp.lng });
    const senseGps = tiff({ ifd0: [orientacio(1)], exif: dataOriginal('2017:05:14 10:22:33') });
    expect(ajustaPrecisioGps(senseGps, 'poble')).toBe(senseGps);
    expect(precisioDeGps(senseGps)).toBeNull();
    expect(ajustaPrecisioGps(sud, 'mil·límetre')).toBeNull();
  });

  test('una estructura inesperada no es pot arrodonir: null, mai el punt exacte', () => {
    const quatre = tiff({ gps: gpsTorre({ lat: [[38, 1], [35, 1], [30, 1], [1, 1]] }) });
    expect(ajustaPrecisioGps(quatre, 'poble')).toBeNull();
    const zero = tiff({ gps: gpsTorre({ lat: [[38, 0], [35, 1], [30, 1]] }) });
    expect(ajustaPrecisioGps(zero, '100m')).toBeNull();
    expect(ajustaPrecisioGps(Uint8Array.of(1, 2, 3), 'poble')).toBeNull();
    expect(ajustaPrecisioGps(null, 'poble')).toBeNull();
    expect(precisioDeGps(null)).toBeNull();
  });

  test('ambExifDeLoriginal amb `precisio`: el WebP del canvas porta el punt arrodonit', async () => {
    const foto = new File([jpegDeCamera(tiffDeCamera().bloc)], 'arbre.jpg', { type: 'image/jpeg' });
    const canvas = `data:image/webp;base64,${aBase64(riff(tros('VP8 ', VP8_1200)))}`;
    const amb = extreuTiff(deBase64(await ambExifDeLoriginal(canvas, foto, { precisio: 'poble' })));
    expect(precisioDeGps(amb)).toBe('poble');
    expect(llig(amb).gps).toEqual({ lat: 38.59, lng: -0.42, altitud: 500 });
  });
});

/* Revisió adversarial 261028 (privacitat, 2 i 3) · ajustaPrecisioGps és de
   tancament segur: tot el que podria deixar el punt exacte dins del fitxer
   publicat, o trencar-lo en reescriure'l en el lloc, torna null (qui ho crida
   avisa i no hi posa cap EXIF). L'exacta continua tornant la mateixa referència. */
describe('P1-64 · revisió adversarial · ajustaPrecisioGps no deixa cap punt exacte d’amagat', () => {
  const GPS_LAT = { tag: 2, tipus: TIPUS.RATIONAL, valors: [[38, 1], [35, 1], [3084, 100]] };
  const posDelGps = (bloc) => directoriDe(bloc, 'MM', 0x8825).pos;
  /* El GPS de la Torre amb l'offset d'una entrada forçat (fitxers trencats). */
  const ambOffset = (tag, offset) => tiff({ gps: gpsTorre().map((e) => (e.tag === tag ? { ...e, offset } : e)) });
  const esperaNull = (bloc, motiu) => {
    for (const precisio of ['100m', 'poble']) expect(ajustaPrecisioGps(bloc, precisio), `${motiu} · ${precisio}`).toBeNull();
    expect(ajustaPrecisioGps(bloc, 'exacta'), motiu).toBe(bloc);
  };

  test('un tag repetit (dues latituds o dos punters GPS): cada lector en llegiria un de diferent', () => {
    const duesLatituds = tiff({ gps: [...gpsTorre(), { ...GPS_LAT, valors: [[38, 1], [36, 1], [2817, 100]] }].sort((a, b) => a.tag - b.tag) });
    esperaNull(duesLatituds, 'dues latituds');
    expect(precisioDeGps(duesLatituds)).toBeNull();
    const dosPunters = tiff({ ifd0: [{ tag: 0x8825, tipus: TIPUS.LONG, valors: [0] }], gps: gpsTorre() });
    esperaNull(dosPunters, 'dos punters GPS');
  });

  test('un GPS IFD que penja d’un altre directori (l’Exif) no s’arrodonix', () => {
    const base = tiff({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() });
    const desdeExif = tiff({ exif: [...dataOriginal('2017:05:14 10:22:33'), { tag: 0x8825, tipus: TIPUS.LONG, valors: [posDelGps(base)] }], gps: gpsTorre() });
    esperaNull(desdeExif, 'GPS dins de l’Exif');
  });

  test('l’XMP (0x02BC), l’IPTC (0x83BB) o el bloc de Photoshop (0x8649) dins del TIFF, o un «GPSLatitude» en text: null', () => {
    // Un text lliure que no diu «GPSLatitude» (la ciutat, la posició en un altre esquema): el tag ja n'és prou.
    const xmp = '<x:xmpmeta><rdf:Description photoshop:City="La Torre" drone:Pos="38.59194,-0.41843"/></x:xmpmeta>';
    for (const tag of [0x02bc, 0x83bb, 0x8649]) {
      esperaNull(tiff({ ifd0: [orientacio(1), { tag, tipus: TIPUS.BYTE, valors: [...ascii(xmp)] }], gps: gpsTorre() }), `tag ${tag.toString(16)}`);
    }
    // Sense cap tag de text lliure, un «GPSLatitude» en text dins d'un MakerNote.
    const makerNote = { tag: 0x927c, tipus: TIPUS.BYTE, valors: [...ascii(`Nota GPSLatitude=38.5919 ${'.'.repeat(16)}`)] };
    esperaNull(tiff({ exif: [makerNote], gps: gpsTorre() }), 'text al MakerNote');
  });

  test('un valor que es reescriu i toca un directori, un altre valor o una referència: null (el graf no es trenca)', () => {
    const base = tiff({ gps: gpsTorre() });
    const pos = posDelGps(base);
    const d = directoriDe(base, 'MM', 0x8825);
    const offsetDe = (tag) => d.valor(d.tags.indexOf(tag));
    esperaNull(ambOffset(4, offsetDe(2)), 'la longitud damunt de la latitud');
    esperaNull(ambOffset(2, pos), 'la latitud damunt del directori GPS');
    esperaNull(ambOffset(6, offsetDe(4) + 16), 'l’altitud damunt de la longitud');
    // La referència N/S fora de línia (5 bytes) que apunta damunt de la latitud.
    const ambRefLlarga = (offset) => tiff({ gps: gpsTorre().map((e) => (e.tag === 1 ? { ...e, valors: 'NNNN', offset } : e)) });
    const llarga = directoriDe(ambRefLlarga(), 'MM', 0x8825);
    esperaNull(ambRefLlarga(llarga.valor(llarga.tags.indexOf(2))), 'la referència damunt de la latitud');
    expect(precisioDeGps(ajustaPrecisioGps(ambRefLlarga(), '100m'))).toBe('100m');
    // La forma bona del mateix bloc sí que s'arrodonix.
    expect(precisioDeGps(ajustaPrecisioGps(base, 'poble'))).toBe('poble');
  });

  test('una altitud que no cap en 32 bits en arrodonir-la: null', () => {
    esperaNull(tiff({ gps: gpsTorre({ alt: [[0xffffffff, 1]] }) }), 'altitud');
  });
});
