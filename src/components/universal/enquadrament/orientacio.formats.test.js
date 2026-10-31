import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { compressImage } from '../../../utils/imageUtils.js';
import {
  MAX_BYTES_EXIF, llegixExif, llegixMetadadesImatge, llegixOrientacioImatge, senseDades, teExif,
} from './exif.js';
import { carregaImatge, exportaRetall } from './imatgeCanvas.js';
import { APP0_JFIF, IMATGE, SOI, app1Exif, concatena, dataOriginal, gpsTorre, orientacio, tiff } from '../../../../tests/helpers/jpegProva.js';
import { dibuixaDreta, orientacioPendent, transformacioOrientacio } from './orientacio.js';

/* Gauntlet 261016 · P2 de Codex (02:04:33, relleus 02:22 i 02:25) · Una foto
   WebP de 1.200 × 900 amb l'EXIF Orientation 6 eixia del retallador i de la
   pujada directa sense girar: exif.js només trobava l'EXIF dins d'un JPEG, la
   sonda del navegador es feia amb un JPEG i valia per a qualsevol format, i
   compressImage no girava mai. Ací, amb bytes sintètics (cap foto real, cap
   ubicació de ningú), els tres formats i les orientacions 1, 3, 6 i 8:
     · el lector multiformat (JPEG APP1, PNG eXIf, WebP EXIF), per trossos;
     · la decisió per format (orientacioPendent), amb el navegador que ha
       mesurat Codex: Chromium 151 posa drets el JPEG i el PNG, el WebP no;
     · la transformació UNA vegada, al retallador (carregaImatge) i a la
       pujada directa (compressImage), i l'EXIF que hi torna a posar la
       pujada (exifIncrustat.js, amb l'orientació a 1) sempre damunt d'un
       raster ja dret.
   Els PNG i els WebP són embolcalls per a provar el lector, no imatges que es
   puguen descodificar: jsdom no descodifica res i Image s'emula. */

const text4 = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));
const FIRMA_PNG = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const FIRMA_EXIF = Uint8Array.of(0x45, 0x78, 0x69, 0x66, 0, 0);

/* Un tros PNG: longitud (BE), tipus, dades i el CRC (a zero: el lector no el
   mira, és feina del descodificador). */
function trosPng(tipus, dades) {
  const b = new Uint8Array(12 + dades.length);
  new DataView(b.buffer).setUint32(0, dades.length);
  b.set(text4(tipus), 4);
  b.set(dades, 8);
  return b;
}
function ihdr(amplada = 1200, alcada = 900) {
  const d = new Uint8Array(13);
  const v = new DataView(d.buffer);
  v.setUint32(0, amplada);
  v.setUint32(4, alcada);
  d[8] = 8; // 8 bits
  d[9] = 2; // RGB
  return trosPng('IHDR', d);
}
const IEND = trosPng('IEND', new Uint8Array(0));
/** Un PNG amb el TIFF en un eXIf, abans de la imatge (com Pillow) o darrere. */
function pngAmbExif(bytesTiff, { despres = false, pixels = new Uint8Array(4), abans = [] } = {}) {
  const exif = trosPng('eXIf', bytesTiff);
  const idat = trosPng('IDAT', pixels);
  return concatena(FIRMA_PNG, ihdr(), ...abans, ...(despres ? [idat, exif] : [exif, idat]), IEND);
}

/* Un tros RIFF: tipus, longitud (LE), dades i el farciment dels senars. */
function trosWebp(tipus, dades) {
  const b = new Uint8Array(8 + dades.length + (dades.length & 1));
  b.set(text4(tipus));
  new DataView(b.buffer).setUint32(4, dades.length, true);
  b.set(dades, 8);
  return b;
}
function riff(...trossos) {
  const b = concatena(text4('RIFF'), new Uint8Array(4), text4('WEBP'), ...trossos);
  new DataView(b.buffer).setUint32(4, b.length - 8, true);
  return b;
}
const VP8X = (() => {
  const d = new Uint8Array(10);
  d[0] = 0x08; // bit E: porta EXIF
  d.set([0xaf, 0x04, 0x00], 4); // amplada − 1 = 1199
  d.set([0x83, 0x03, 0x00], 7); // alçada − 1 = 899
  return trosWebp('VP8X', d);
})();
/** Un WebP com el que fa exifIncrustat.js: VP8X, la imatge i, al final, EXIF. */
function webpAmbExif(bytesTiff, { pixels = new Uint8Array(10), abans = [] } = {}) {
  return riff(VP8X, ...abans, trosWebp('VP8 ', pixels), trosWebp('EXIF', bytesTiff));
}
const jpegAmbTiff = (bytesTiff) => concatena(SOI, APP0_JFIF, app1Exif(bytesTiff), IMATGE);

const FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const ORIENTACIONS = [1, 3, 6, 8];
const AMB_EXIF = { 'image/jpeg': jpegAmbTiff, 'image/png': pngAmbExif, 'image/webp': webpAmbExif };
const CASOS = FORMATS.flatMap((format) => ORIENTACIONS.map((o) => [format, o]));

const metadades = (o, ordre = 'MM') => tiff({
  ordre, ifd0: [orientacio(o)], exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre(),
});
const esperat = (o) => ({
  orientacio: o, gps: { lat: 38.5919, lng: -0.4184, altitud: 456.7 }, dataCaptura: '2017-05-14T10:22:33+02:00',
});
const foto = (format, o, tipus = format) => new File([AMB_EXIF[format](metadades(o))], 'foto', { type: tipus });

/** Codex, 02:04:33: Chromium 151 posa drets el JPEG i el PNG en descodificar-los; el WebP, no. */
const giraElNavegador = (format) => format !== 'image/webp';
const chromium = () => vi.fn(async ({ format } = {}) => giraElNavegador(format));
const esIdentitat = (m) => m.length === 6 && m.every((x, i) => x === [1, 0, 0, 1, 0, 0][i]);
const transformacions = (ctx) => ctx.setTransform.mock.calls.filter((m) => !esIdentitat(m));

describe('exif.js · el lector multiformat: JPEG APP1, PNG eXIf i WebP EXIF', () => {
  test.each(CASOS.flatMap(([format, o]) => [[format, o, 'MM'], [format, o, 'II']]))(
    '%s, orientació %i, %s: orientació, GPS i data, del buffer i del File, pels bytes i no pel MIME',
    async (format, o, ordre) => {
      const bytes = AMB_EXIF[format](metadades(o, ordre));
      expect(llegixExif(bytes)).toEqual(esperat(o));
      // Una vista desplaçada dins d'un buffer més gran.
      expect(llegixExif(concatena(Uint8Array.of(7, 7), bytes, Uint8Array.of(9)).subarray(2, -1))).toEqual(esperat(o));
      expect(llegixExif(bytes, { ambGps: false, ambData: false })).toEqual({ orientacio: o, gps: null, dataCaptura: null });
      expect(teExif(bytes)).toBe(true);
      const fitxer = new File([bytes], 'sense-extensio', { type: 'application/octet-stream' });
      expect(await llegixMetadadesImatge(fitxer)).toEqual(esperat(o));
      expect(await llegixOrientacioImatge(fitxer)).toEqual({ format, orientacio: o });
    },
  );

  test('PNG i WebP sense EXIF, o amb el tros de l’altre format: sense dades i teExif fals', async () => {
    const t = metadades(6);
    const casos = [
      [concatena(FIRMA_PNG, ihdr(), trosPng('IDAT', new Uint8Array(4)), IEND), 'image/png'],
      [riff(VP8X, trosWebp('VP8 ', new Uint8Array(10))), 'image/webp'],
      [concatena(FIRMA_PNG, ihdr(), trosPng('EXIF', t), trosPng('IDAT', new Uint8Array(4)), IEND), 'image/png'],
      [riff(VP8X, trosWebp('VP8 ', new Uint8Array(10)), trosWebp('eXIf', t)), 'image/webp'],
    ];
    for (const [bytes, format] of casos) {
      expect(llegixExif(bytes)).toEqual(senseDades());
      expect(teExif(bytes)).toBe(false);
      expect(await llegixOrientacioImatge(new File([bytes], 'x'))).toEqual({ format, orientacio: null });
    }
  });

  test('el TIFF amb «Exif\\0\\0» al davant (com l’APP1, i com l’accepta extreuTiff) també es llig', () => {
    const t = concatena(FIRMA_EXIF, metadades(8));
    expect(llegixExif(pngAmbExif(t))).toEqual(esperat(8));
    expect(llegixExif(webpAmbExif(t))).toEqual(esperat(8));
  });

  test('un eXIf darrere dels píxels es llig; darrere d’IEND, ja no és del PNG', () => {
    const t = metadades(3);
    expect(llegixExif(pngAmbExif(t, { despres: true })).orientacio).toBe(3);
    const darrereIend = concatena(FIRMA_PNG, ihdr(), trosPng('IDAT', new Uint8Array(4)), IEND, trosPng('eXIf', t));
    expect(llegixExif(darrereIend)).toEqual(senseDades());
  });

  test('el que no s’entén és «sense dades», mai una lectura de fora del tros, del RIFF ni del buffer', () => {
    const t = metadades(6);
    const webp = webpAmbExif(t);
    const png = pngAmbExif(t);
    // RIFF que diu més que el fitxer (truncat) o menys del que porta (l'EXIF en queda fora).
    expect(llegixExif(webp.subarray(0, -1))).toEqual(senseDades());
    const curt = webp.slice();
    new DataView(curt.buffer).setUint32(4, curt.length - 8 - (8 + t.length), true);
    expect(llegixExif(curt)).toEqual(senseDades());
    // Una longitud de tros absurda, o un PNG que no comença per IHDR.
    const absurd = png.slice();
    new DataView(absurd.buffer).setUint32(8, 0xffffffff);
    expect(llegixExif(absurd)).toEqual(senseDades());
    expect(llegixExif(concatena(FIRMA_PNG, trosPng('eXIf', t), ihdr(), IEND))).toEqual(senseDades());
    // Els desplaçaments del TIFF no ixen del tros: un IFD0 que apunta al final.
    const fora = t.slice();
    new DataView(fora.buffer).setUint32(4, fora.length);
    expect(llegixExif(pngAmbExif(fora))).toEqual(senseDades());
    expect(llegixExif(webpAmbExif(fora))).toEqual(senseDades());
    // Un tros EXIF de més de MAX_BYTES_EXIF no es llig.
    expect(llegixExif(webpAmbExif(concatena(t, new Uint8Array(MAX_BYTES_EXIF))))).toEqual(senseDades());
  });

  test('com extreuTiff, l’eXIf es troba encara que vaja darrere de molts trossos; el recorregut es para als 65.536', () => {
    const t = metadades(6);
    /* n trossos tEXt buits (12 bytes cadascun) entre l'IHDR i l'eXIf, escrits
       d'una passada: amb el «...» de concatena no hi cabrien tants arguments. */
    const amb = (n) => {
      const buit = trosPng('tEXt', new Uint8Array(0));
      const farciment = new Uint8Array(n * buit.length);
      for (let i = 0; i < n; i += 1) farciment.set(buit, i * buit.length);
      return pngAmbExif(t, { abans: [farciment] });
    };
    expect(llegixExif(amb(70)).orientacio).toBe(6);
    expect(llegixExif(amb(65534)).orientacio).toBe(6); // IHDR (0) + 65.534 tEXt + eXIf (65.535)
    expect(llegixExif(amb(65535))).toEqual(senseDades());
  });

  test('File: l’EXIF darrere de 2 MiB de píxels es llig sense carregar-los (el prefix de sempre, capçaleres de 8 bytes i el tros de l’EXIF)', async () => {
    const t = metadades(6);
    const pixels = new Uint8Array(2 * 1024 * 1024);
    for (const bytes of [pngAmbExif(t, { despres: true, pixels }), webpAmbExif(t, { pixels })]) {
      const fitxer = new File([bytes], 'gran');
      const tall = vi.spyOn(fitxer, 'slice');
      expect(await llegixMetadadesImatge(fitxer)).toEqual(esperat(6));
      const crides = tall.mock.calls.map(([a, b]) => [a, b]);
      expect(crides[0]).toEqual([0, MAX_BYTES_EXIF]);
      const resta = crides.slice(1);
      expect(resta.length).toBeGreaterThan(0);
      expect(resta.every(([a, b]) => a >= MAX_BYTES_EXIF && (b - a === 8 || b - a === t.length))).toBe(true);
      expect(resta.some(([a]) => a > pixels.length)).toBe(true);
      expect(crides.reduce((s, [a, b]) => s + (b - a), 0)).toBeLessThanOrEqual(MAX_BYTES_EXIF + 64 * 8 + t.length);
    }
  });

  test('File: 100 IDAT de 8 KiB davant de l’eXIf (libpng): 64 capçaleres d’una en una i, després, el fitxer sencer UNA vegada, com extreuTiff', async () => {
    const t = metadades(6);
    const idat = trosPng('IDAT', new Uint8Array(8192));
    const bytes = pngAmbExif(t, { abans: Array.from({ length: 100 }, () => idat) });
    const fitxer = new File([bytes], 'molts.png', { type: 'image/png' });
    const tall = vi.spyOn(fitxer, 'slice');
    expect(await llegixMetadadesImatge(fitxer)).toEqual(esperat(6));
    const crides = tall.mock.calls.map(([a, b]) => [a, b]);
    expect(crides[0]).toEqual([0, MAX_BYTES_EXIF]);
    expect(crides.slice(1).map(([a, b]) => b - a)).toEqual(Array(64).fill(8));
  });

  test('File: més gran que PES_MAXIM_ENTRADA i amb massa capçaleres fora del prefix, no es llig sencer: sense dades, sense rebutjar', async () => {
    const t = metadades(6);
    const gran = trosPng('IDAT', new Uint8Array(25 * 1024 * 1024));
    const idat = trosPng('IDAT', new Uint8Array(16));
    const fitxer = new File([pngAmbExif(t, { abans: [gran, ...Array.from({ length: 70 }, () => idat)] })], 'enorme.png');
    const tall = vi.spyOn(fitxer, 'slice');
    const sencer = vi.spyOn(fitxer, 'arrayBuffer');
    expect(await llegixOrientacioImatge(fitxer)).toEqual({ format: 'image/png', orientacio: null });
    expect(tall.mock.calls).toHaveLength(1 + 64);
    expect(sencer).not.toHaveBeenCalled();
  });

  test('llegixOrientacioImatge: una lectura per fitxer (el pressupost comprimix fins a 12 vegades el mateix)', async () => {
    const fitxer = foto('image/webp', 6);
    const tall = vi.spyOn(fitxer, 'slice');
    const primera = await llegixOrientacioImatge(fitxer);
    expect(await llegixOrientacioImatge(fitxer)).toBe(primera);
    expect(Object.isFrozen(primera)).toBe(true);
    expect(tall).toHaveBeenCalledTimes(1);
  });

  test('fuzz determinista: 3.000 PNG i WebP mutats, cap excepció, cap valor fora de rang; el File mai rebutja', async () => {
    let a = 0x5eed;
    const aleatori = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let x = a;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
    const mostres = [pngAmbExif(metadades(6, 'II')), webpAmbExif(metadades(8, 'MM')), pngAmbExif(metadades(3), { despres: true })];
    const muta = (original) => {
      let b = Uint8Array.from(original);
      for (let i = 0, n = 1 + Math.floor(aleatori() * 4); i < n && b.length; i += 1) {
        const p = Math.floor(aleatori() * b.length);
        const op = Math.floor(aleatori() * 4);
        if (op === 0) b[p] ^= 1 + Math.floor(aleatori() * 255);
        else if (op === 1 && p + 4 <= b.length) new DataView(b.buffer).setUint32(p, [0, 8, 0xffff, 0x7fffffff, 0xffffffff][Math.floor(aleatori() * 5)], aleatori() < 0.5);
        else if (op === 2) b = b.slice(0, p);
        else b = concatena(b.slice(0, p), b.slice(p, p + 13), b.slice(p));
      }
      return b;
    };
    const valid = (r) => Object.keys(r).sort().join() === 'dataCaptura,gps,orientacio'
      && (r.orientacio === null || (Number.isInteger(r.orientacio) && r.orientacio >= 1 && r.orientacio <= 8));
    for (let cas = 0; cas < 3000; cas += 1) {
      const bytes = muta(mostres[cas % 3]);
      expect(valid(llegixExif(bytes))).toBe(true);
      expect(typeof teExif(bytes)).toBe('boolean');
      if (cas % 30 === 0) {
        const r = await llegixOrientacioImatge(new Blob([bytes]));
        expect(Object.keys(r).sort()).toEqual(['format', 'orientacio']);
        expect(valid(await llegixMetadadesImatge(new Blob([bytes])))).toBe(true);
      }
    }
  });
});

describe('orientacio.js · orientacioPendent: la decisió és per format, i una sola', () => {
  test.each(CASOS)('Chromium 151, %s amb orientació %i: només falta girar-la si el navegador no ho fa en eixe format', async (format, o) => {
    const orienta = chromium();
    expect(await orientacioPendent(foto(format, o), { orienta })).toBe(!giraElNavegador(format) && o > 1 ? o : 1);
    // Només es pregunta al navegador si hi ha res a girar, i pel format dels bytes.
    expect(orienta.mock.calls).toEqual(o > 1 ? [[{ format }]] : []);
  });

  test('el format és el dels bytes, no el MIME: un WebP que diu ser JPEG es gira; un JPEG que diu ser WebP, no', async () => {
    expect(await orientacioPendent(foto('image/webp', 6, 'image/jpeg'), { orienta: chromium() })).toBe(6);
    expect(await orientacioPendent(foto('image/jpeg', 6, 'image/webp'), { orienta: chromium() })).toBe(1);
  });

  test('un format que no és cap dels tres, cap Blob, o un lector o una sonda que fallen: no es gira (1)', async () => {
    const orienta = chromium();
    const gif = new File([concatena(text4('GIF89a'), new Uint8Array(32))], 'a.gif', { type: 'image/gif' });
    expect(await orientacioPendent(gif, { orienta })).toBe(1);
    expect(await orientacioPendent(null, { orienta })).toBe(1);
    expect(orienta).not.toHaveBeenCalled();
    expect(await orientacioPendent(foto('image/webp', 6), { orienta, lligOrientacio: async () => { throw new Error('llegit'); } })).toBe(1);
    expect(await orientacioPendent(foto('image/webp', 6), { orienta: async () => { throw new Error('sonda'); } })).toBe(1);
  });
});

describe('orientacio.js · dibuixaDreta: la transformació, una vegada', () => {
  test.each(ORIENTACIONS)('orientació %i: els quatre cantons de la foto guardada cauen als del canvas dret', (o) => {
    const ctx = { setTransform: vi.fn(), drawImage: vi.fn() };
    const dreta = transformacioOrientacio(o, 600, 450);
    const foto6 = { soc: 'la imatge descodificada' };
    dibuixaDreta(ctx, foto6, o, dreta.amplada, dreta.alcada);
    expect(ctx.drawImage.mock.calls).toEqual([[foto6, 0, 0, 600, 450]]);
    if (o === 1) {
      expect(ctx.setTransform).not.toHaveBeenCalled();
      return;
    }
    expect(ctx.setTransform.mock.calls).toEqual([dreta.matriu, [1, 0, 0, 1, 0, 0]]);
    expect(ctx.setTransform.mock.invocationCallOrder[0]).toBeLessThan(ctx.drawImage.mock.invocationCallOrder[0]);
    expect(ctx.drawImage.mock.invocationCallOrder[0]).toBeLessThan(ctx.setTransform.mock.invocationCallOrder[1]);
    const [ma, mb, mc, md, me, mf] = dreta.matriu;
    const cantons = [[0, 0], [600, 0], [0, 450], [600, 450]].map(([x, y]) => [ma * x + mc * y + me, mb * x + md * y + mf]);
    expect(cantons.map(([x, y]) => `${x},${y}`).sort()).toEqual(
      [[0, 0], [dreta.amplada, 0], [0, dreta.alcada], [dreta.amplada, dreta.alcada]].map(([x, y]) => `${x},${y}`).sort(),
    );
  });
});

/* ─── La frontera amb el navegador: canvas, Image i objectURL emulats ───── */

const SORTIDA_CANVAS = concatena(SOI, APP0_JFIF, IMATGE); // un JPEG net, com el d'un codificador
const aBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const deDataUrl = (url) => Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), (c) => c.charCodeAt(0));

let ctx;
let mides;
let imatges;
let canvases;
/* Pla 261022_1645 · Les mides de cada canvas en el moment de codificar: després,
   compressImage l'allibera (0 × 0) perquè Safari d'iOS no se'n quede sense memòria. */
let codificats;
const urlOriginal = { crea: URL.createObjectURL, revoca: URL.revokeObjectURL };

/* Una Image falsa: «descodifica» en posar-li src, amb la mida que toca a
   cada càrrega (la que donaria el navegador: dreta o tal com es guarda). */
class ImatgeFalsa {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    imatges.push(this);
  }

  set src(url) {
    this.url = url;
    queueMicrotask(() => {
      const [w, h] = mides.shift() || [0, 0];
      this.width = w;
      this.height = h;
      this.naturalWidth = w;
      this.naturalHeight = h;
      this.onload?.();
    });
  }

  get src() {
    return this.url;
  }
}

beforeEach(() => {
  ctx = { setTransform: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn(), clearRect: vi.fn() };
  mides = [];
  imatges = [];
  canvases = [];
  codificats = [];
  vi.stubGlobal('Image', ImatgeFalsa);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function getContext() {
    canvases.push(this);
    return ctx;
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function toDataURL(tipus = 'image/png') {
    codificats.push([this.width, this.height]);
    return `data:${tipus};base64,${aBase64(SORTIDA_CANVAS)}`;
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(new Blob([SORTIDA_CANVAS], { type: 'image/jpeg' })));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  URL.createObjectURL = urlOriginal.crea;
  URL.revokeObjectURL = urlOriginal.revoca;
});

describe('imatgeCanvas.js · el retallador gira UNA vegada, pel format', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:prova/1');
    URL.revokeObjectURL = vi.fn();
  });

  test.each(CASOS)('%s, orientació %i: es carrega dreta, girada aquí només si el navegador no ho ha fet', async (format, o) => {
    const dreta = transformacioOrientacio(o, 1200, 900);
    mides.push(giraElNavegador(format) ? [dreta.amplada, dreta.alcada] : [1200, 900]);
    const img = await carregaImatge(foto(format, o), { orienta: chromium() });
    const giraAci = !giraElNavegador(format) && o > 1;
    expect([img.amplada, img.alcada]).toEqual([dreta.amplada, dreta.alcada]);
    expect(transformacions(ctx)).toEqual(giraAci ? [dreta.matriu] : []);
    expect(ctx.drawImage).toHaveBeenCalledTimes(giraAci ? 1 : 0);
    expect(img.element instanceof HTMLCanvasElement).toBe(giraAci);
    if (giraAci) expect([img.element.width, img.element.height]).toEqual([dreta.amplada, dreta.alcada]);
    img.allibera();
  });

  test('la cadena sencera del diàleg (carrega → retalla → comprimix amb l’EXIF): una sola transformació, i l’orientació 1 damunt del raster dret', async () => {
    const original = foto('image/webp', 6);
    mides.push([1200, 900], [1200, 1200]); // el WebP tal com es guarda; després, el retall
    const orienta = chromium();
    const img = await carregaImatge(original, { orienta });
    expect([img.amplada, img.alcada]).toEqual([900, 1200]);
    const retall = await exportaRetall(img.element, { x: 0, y: 150, w: 900, h: 900 }, { amplada: 1200, alcada: 1200 });
    const dataUrl = await compressImage(retall, { maxSize: 1200, conservaExif: true, original, orienta });
    expect(transformacions(ctx)).toEqual([transformacioOrientacio(6, 1200, 900).matriu]);
    // El retall no porta cap orientació: compressImage no pregunta ni gira.
    expect(orienta).toHaveBeenCalledTimes(1);
    expect(ctx.drawImage).toHaveBeenLastCalledWith(imatges.at(-1), 0, 0, 1200, 1200);
    expect(llegixExif(deDataUrl(dataUrl))).toEqual({ ...esperat(6), orientacio: 1 });
    img.allibera();
  });
});

describe('imageUtils.js · compressImage: la pujada directa també gira UNA vegada', () => {
  test.each(CASOS)('%s, orientació %i, sense retall: el canvas ix dret i, amb conservaExif, porta l’orientació 1', async (format, o) => {
    const dreta = transformacioOrientacio(o, 1200, 900);
    mides.push(giraElNavegador(format) ? [dreta.amplada, dreta.alcada] : [1200, 900]);
    const dataUrl = await compressImage(foto(format, o), { maxSize: 600, conservaExif: true, orienta: chromium() });
    const giraAci = !giraElNavegador(format) && o > 1;
    const [w, h] = o >= 5 ? [450, 600] : [600, 450];
    expect(codificats.at(-1)).toEqual([w, h]);
    // Codificat, el canvas s'allibera.
    expect([canvases.at(-1).width, canvases.at(-1).height]).toEqual([0, 0]);
    expect(transformacions(ctx)).toEqual(giraAci ? [transformacioOrientacio(o, 600, 450).matriu] : []);
    expect(ctx.drawImage.mock.calls).toEqual([[imatges[0], 0, 0, ...(giraAci ? [600, 450] : [w, h])]]);
    // El raster es posa dret ABANS de codificar-lo, i l'EXIF de l'original hi torna amb l'orientació 1.
    if (giraAci) {
      expect(ctx.setTransform.mock.invocationCallOrder[0]).toBeLessThan(HTMLCanvasElement.prototype.toDataURL.mock.invocationCallOrder[0]);
    }
    expect(llegixExif(deDataUrl(dataUrl))).toEqual({ ...esperat(o), orientacio: 1 });
  });

  test('sense conservaExif (els camins sense casella): també dreta, i neta', async () => {
    mides.push([1200, 900]);
    const dataUrl = await compressImage(foto('image/webp', 8), { maxSize: 600, orienta: chromium() });
    expect(codificats.at(-1)).toEqual([450, 600]);
    expect([canvases.at(-1).width, canvases.at(-1).height]).toEqual([0, 0]);
    expect(transformacions(ctx)).toEqual([transformacioOrientacio(8, 600, 450).matriu]);
    expect([...deDataUrl(dataUrl)]).toEqual([...SORTIDA_CANVAS]);
  });

  test('el retall del diàleg ja és dret: no es torna a girar encara que l’original porte l’orientació 6', async () => {
    mides.push([1200, 1200]);
    const orienta = chromium();
    const retall = new File([SORTIDA_CANVAS], 'enquadrament.jpg', { type: 'image/jpeg' });
    const dataUrl = await compressImage(retall, { maxSize: 1200, conservaExif: true, original: foto('image/webp', 6), orienta });
    expect(orienta).not.toHaveBeenCalled();
    expect(ctx.setTransform).not.toHaveBeenCalled();
    expect(llegixExif(deDataUrl(dataUrl))).toEqual({ ...esperat(6), orientacio: 1 });
  });

  test('sense `orienta`, la sonda real: en jsdom (sense createObjectURL) és el valor segur, i no gira', async () => {
    URL.createObjectURL = undefined;
    mides.push([1200, 900]);
    await compressImage(foto('image/webp', 6), { maxSize: 600 });
    expect(ctx.setTransform).not.toHaveBeenCalled();
    expect(ctx.drawImage.mock.calls).toEqual([[imatges[0], 0, 0, 600, 450]]);
  });
});
