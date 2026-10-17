// @vitest-environment node
/* Gauntlet 261017 (C03 de Codex) · Les peces pures de lecturaExifWebp.js, sense
   xarxa: el Content-Range estricte, quan un WebP anuncia EXIF fora del prefix,
   el recorregut que només demana capçaleres (amb els seus topes) i el WebP
   mínim que llig el parser estricte d'exif.js, que no es toca. El control és
   el de Codex: el WebP sencer porta «Canon EOS 5D» i el prefix de 256 KB, no. */
import { describe, expect, test } from 'vitest';
import { MAX_BYTES_EXIF, llegixExif } from '../../components/universal/enquadrament/exif.js';
import { TIPUS, concatena, jpegAmbExif, tiff } from '../../components/universal/enquadrament/jpegProva.js';
import { cercaExifWebp, rangDeContentRange, webpAmbExifFora, webpMinim } from './lecturaExifWebp.js';

const ascii = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0));
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
/** El VP8X: senyals (0x08, hi ha EXIF) i un llenç de 1200 × 800. */
const vp8x = (senyals = 0x08) => tros('VP8X', Uint8Array.of(senyals, 0, 0, 0, 0xaf, 0x04, 0, 0x1f, 0x03, 0));
const CANON = tiff({ ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Canon' }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'EOS 5D' }] });
const EXIF = concatena(ascii('Exif\0\0'), CANON);
const IMATGE = new Uint8Array(400001); // senar: el tros porta farciment
const GRAN = riff(vp8x(), tros('VP8 ', IMATGE), tros('EXIF', EXIF), tros('XMP ', ascii('<x/>')));
const camera = (bytes) => llegixExif(bytes, { ambCamera: true, ambGps: false }).camera;

/* Fa córrer el recorregut sobre un buffer sencer i apunta què demana. */
function recorre(bytes, fi = bytes.length) {
  const demanades = [];
  const cerca = cercaExifWebp(fi);
  let pas = cerca.next();
  while (!pas.done) {
    demanades.push(pas.value);
    pas = cerca.next(pas.value + 8 <= bytes.length ? new DataView(bytes.buffer, bytes.byteOffset + pas.value, 8) : null);
  }
  return { resultat: pas.value, demanades };
}

describe('el control de Codex', () => {
  test('el WebP sencer porta la càmera; el prefix de 256 KB, per al parser estricte, no', () => {
    expect(GRAN.length).toBeGreaterThan(MAX_BYTES_EXIF);
    expect(camera(GRAN)).toEqual({ marca: 'Canon', model: 'EOS 5D' });
    expect(camera(GRAN.subarray(0, MAX_BYTES_EXIF))).toBeNull();
  });
});

describe('rangDeContentRange', () => {
  test('«bytes inici-fi/total», sense distingir majúscules ni espais de les vores', () => {
    expect(rangDeContentRange('bytes 0-262143/414560')).toEqual({ inici: 0, fi: 262143, total: 414560 });
    expect(rangDeContentRange(' Bytes 10-17/100 ')).toEqual({ inici: 10, fi: 17, total: 100 });
  });

  test('qualsevol altra cosa és null: res de «*», de rangs del revés, de més d’un rang ni de números enormes', () => {
    for (const valor of [null, undefined, 42, '', 'bytes */414560', 'bytes 0-9/*', 'bytes 5-4/10', 'bytes 0-10/10',
      'bytes=0-9/10', 'items 0-9/10', 'bytes 0-9/10, 20-29/40', 'bytes -1-9/10', 'bytes 0-9/1e3', 'bytes 0-1/9999999999999999']) {
      expect(rangDeContentRange(valor)).toBeNull();
    }
  });
});

describe('webpAmbExifFora', () => {
  test('el prefix d’un WebP gran que anuncia EXIF: la fi del RIFF', () => {
    expect(webpAmbExifFora(GRAN.subarray(0, MAX_BYTES_EXIF))).toBe(GRAN.length);
  });

  test('0 si el RIFF hi cap, si no anuncia EXIF, si no té VP8X o si no és un WebP', () => {
    expect(webpAmbExifFora(GRAN)).toBe(0);
    expect(webpAmbExifFora(riff(vp8x(0x10), tros('VP8 ', IMATGE)).subarray(0, MAX_BYTES_EXIF))).toBe(0);
    expect(webpAmbExifFora(riff(tros('VP8 ', IMATGE), tros('EXIF', EXIF)).subarray(0, MAX_BYTES_EXIF))).toBe(0);
    expect(webpAmbExifFora(riff(tros('VP8X', new Uint8Array(12).fill(0x08)), tros('VP8 ', IMATGE)).subarray(0, MAX_BYTES_EXIF))).toBe(0);
    expect(webpAmbExifFora(jpegAmbExif({ ifd0: [] }))).toBe(0);
    expect(webpAmbExifFora(GRAN.subarray(0, 29))).toBe(0);
    expect(webpAmbExifFora(GRAN.buffer)).toBe(0);
    expect(webpAmbExifFora(null)).toBe(0);
  });
});

describe('cercaExifWebp', () => {
  test('només demana capçaleres, salta els píxels (amb el farciment) i troba el tros EXIF', () => {
    const { resultat, demanades } = recorre(GRAN);
    const inici = 12 + 18 + 8 + IMATGE.length + 1 + 8;
    expect(demanades).toEqual([12, 30, inici - 8]);
    expect(resultat).toEqual({ inici, mida: EXIF.length });
    expect([...GRAN.subarray(inici, inici + EXIF.length)]).toEqual([...EXIF]);
  });

  test('null si no n’hi ha, si falta una capçalera o si una longitud ix del RIFF', () => {
    expect(recorre(riff(vp8x(), tros('VP8 ', IMATGE))).resultat).toBeNull();
    expect(recorre(GRAN.subarray(0, MAX_BYTES_EXIF), GRAN.length).resultat).toBeNull();
    const tallat = GRAN.slice(0, 12 + 18 + 8 + 16);
    new DataView(tallat.buffer).setUint32(4, tallat.length - 8, true);
    expect(recorre(tallat).resultat).toBeNull();
  });

  test('null si el tros EXIF no pot portar un TIFF o passa del sostre de llegixExif', () => {
    expect(recorre(riff(vp8x(), tros('EXIF', new Uint8Array(7)))).resultat).toBeNull();
    const cap = (mida) => {
      const c = new DataView(new ArrayBuffer(8));
      c.setUint32(0, 0x45584946);
      c.setUint32(4, mida, true);
      return c;
    };
    const cerca = cercaExifWebp(12 + 8 + MAX_BYTES_EXIF + 1);
    cerca.next();
    expect(cerca.next(cap(MAX_BYTES_EXIF + 1))).toEqual({ done: true, value: null });
    const justa = cercaExifWebp(12 + 8 + MAX_BYTES_EXIF);
    justa.next();
    expect(justa.next(cap(MAX_BYTES_EXIF))).toEqual({ done: true, value: { inici: 20, mida: MAX_BYTES_EXIF } });
  });

  test('un tope dur de trossos, diga el que diga el fitxer', () => {
    const buit = new DataView(new ArrayBuffer(8));
    const cerca = cercaExifWebp(Number.MAX_SAFE_INTEGER);
    let pas = cerca.next();
    let n = 0;
    while (!pas.done) {
      n += 1;
      pas = cerca.next(buit);
    }
    expect(pas.value).toBeNull();
    expect(n).toBe(65536);
  });
});

describe('webpMinim', () => {
  test('RIFF + VP8X + EXIF, amb la mida del RIFF correcta: el parser estricte hi llig la càmera', () => {
    const { resultat } = recorre(GRAN);
    const minim = webpMinim(GRAN.subarray(0, MAX_BYTES_EXIF), GRAN.subarray(resultat.inici, resultat.inici + resultat.mida));
    expect(String.fromCharCode(...minim.subarray(0, 4))).toBe('RIFF');
    expect(new DataView(minim.buffer).getUint32(4, true)).toBe(minim.length - 8);
    expect([...minim.subarray(8, 30)]).toEqual([...GRAN.subarray(8, 30)]); // WEBP i el VP8X del prefix
    expect(String.fromCharCode(...minim.subarray(30, 34))).toBe('EXIF');
    expect(camera(minim)).toEqual({ marca: 'Canon', model: 'EOS 5D' });
  });

  test('amb farciment o sense (longitud senar o parella), sempre ben format i llegible', () => {
    for (const exif of [EXIF, concatena(EXIF, Uint8Array.of(0))]) {
      const minim = webpMinim(GRAN, exif);
      expect(minim.length).toBe(30 + 8 + exif.length + (exif.length & 1));
      expect(new DataView(minim.buffer).getUint32(4, true)).toBe(minim.length - 8);
      expect(camera(minim)).toEqual({ marca: 'Canon', model: 'EOS 5D' });
    }
  });
});
