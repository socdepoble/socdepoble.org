import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { compressImage } from './imageUtils.js';
import { llegixExif, teExif } from '../components/universal/enquadrament/exif.js';
import { extreuTiff, precisioDeGps, preparaTiff } from '../components/universal/enquadrament/exifIncrustat.js';
import {
  APP0_JFIF, IMATGE, SOI, app1Exif, concatena, dataOriginal, gpsTorre, jpegAmbExif, orientacio,
} from '../components/universal/enquadrament/jpegProva.js';
import { navegadorAplicaOrientacio, transformacioOrientacio } from '../components/universal/enquadrament/orientacio.js';
import { creaOrdres } from '../components/universal/richText/extensions/index.js';

/* Onada 4 · revisió adversarial (K3, ADR multimèdia D4) · compressImage és la
   porta per on passen TOTES les pujades d'imatge (capçalera, avatar, logotip,
   ajust d'imatge i imatges del text enriquit). Ací es prova que no té cap
   drecera: el que ix són sempre els bytes del codificador del canvas, mai els
   de l'original, encara que l'original siga un JPEG xicotet amb GPS.

   Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · GIRADA A POSTA.
   Abans, el que ixia no portava mai l'EXIF. Ara la tria de sèrie de la
   casella del diàleg («Conserva la ubicació i la data de la foto»,
   conservaExif) el conserva: el canvas amb l'EXIF publicable de l'original
   (GPS, data, orientació 1), mai els bytes de l'original. L'opt-out
   (conservaExif: false) i els camins sense casella (sense l'opció: l'ordre
   «/» Imatge, el logotip) continuen nets, i el primer bloc ho fixa.

   jsdom no descodifica ni codifica: Image, el context 2D i toDataURL
   s'emulen. El «codificador» torna un JPEG net (sense APP1): si algun camí
   tornara l'original, els seus bytes portarien l'«Exif» i el GPS de la Torre. */

const SORTIDA_CANVAS = concatena(SOI, APP0_JFIF, IMATGE);
const FOTO_GPS = jpegAmbExif({ ifd0: [orientacio(6)], exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre() });
const MARCA_EXIF = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // «Exif\0\0», en qualsevol lloc del fitxer

const aBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
function deDataUrl(url) {
  const coma = url.indexOf(',');
  const capcalera = url.slice(0, coma);
  const dades = url.slice(coma + 1);
  const tipus = /^data:([^;,]*)/.exec(capcalera)?.[1] || '';
  const binari = capcalera.includes(';base64') ? atob(dades) : decodeURIComponent(dades);
  return { tipus, bytes: Uint8Array.from(binari, (c) => c.charCodeAt(0)) };
}
const bytesDe = (blob) => new Promise((resol, rebutja) => {
  const lector = new FileReader();
  lector.onload = () => resol(new Uint8Array(lector.result));
  lector.onerror = () => rebutja(lector.error);
  lector.readAsArrayBuffer(blob);
});
function conteMarcaExif(bytes) {
  for (let i = 0; i + MARCA_EXIF.length <= bytes.length; i += 1) {
    if (MARCA_EXIF.every((b, k) => bytes[i + k] === b)) return true;
  }
  return false;
}
/** Els bytes que han eixit no són l'original i no porten cap rastre d'EXIF ni de GPS. */
function esperaNet(bytes) {
  expect([...bytes]).toEqual([...SORTIDA_CANVAS]);
  expect(conteMarcaExif(bytes)).toBe(false);
  expect(teExif(bytes)).toBe(false);
  expect(llegixExif(bytes).gps).toBeNull();
}

let ctx;
let mida;
let errorsEnHandlers;
let imatges;

/* Una Image falsa: «descodifica» en posar-li src. Com un navegador, una
   excepció dins d'onload es reporta i no es propaga. */
class ImatgeFalsa {
  constructor() {
    this.width = 0;
    this.height = 0;
    imatges.push(this);
  }

  set src(url) {
    this.url = url;
    queueMicrotask(() => {
      this.width = mida.w;
      this.height = mida.h;
      try {
        this.onload?.();
      } catch (err) {
        errorsEnHandlers.push(err);
      }
    });
  }

  get src() {
    return this.url;
  }
}

/* Gauntlet 261016 (P2 de Codex) · compressImage pregunta al navegador, una
   vegada per format i sessió, si ja posa dreta una foto amb orientació (la
   de prova en porta la 6). jsdom no descodifica res: la resposta es fixa al
   valor segur (sí, com fan amb el JPEG els navegadors de la Baseline), i les
   proves d'este fitxer continuen veient una sola imatge i un sol toDataURL.
   La sonda real es prova a orientacio.test.js; el gir de cada format, a
   orientacio.formats.test.js. */
beforeAll(async () => {
  for (const format of ['image/jpeg', 'image/png', 'image/webp']) {
    await navegadorAplicaOrientacio({ format, sonda: async () => true, refresca: true });
  }
});

beforeEach(() => {
  ctx = { clearRect: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn(), setTransform: vi.fn() };
  mida = { w: 4000, h: 3000 };
  errorsEnHandlers = [];
  imatges = [];
  vi.stubGlobal('Image', ImatgeFalsa);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation((tipus = 'image/png') => `data:${tipus};base64,${aBase64(SORTIDA_CANVAS)}`);
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const { tipus, bytes } = deDataUrl(url);
    return { blob: async () => new Blob([bytes], { type: tipus }) };
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const fotoGps = (tipus = 'image/jpeg', nom = 'arbre.jpg') => new File([FOTO_GPS], nom, { type: tipus });

describe('K3 · compressImage: sempre torna a codificar (sense l’opció conservaExif, net)', () => {
  test('una foto amb GPS: es descodifica l’original, es redueix i ix el codificador del canvas, sense EXIF', async () => {
    expect(teExif(FOTO_GPS)).toBe(true);
    const dataUrl = await compressImage(fotoGps(), { maxSize: 1200, format: 'image/webp', quality: 0.8 });
    const { tipus, bytes } = deDataUrl(dataUrl);
    expect(tipus).toBe('image/webp');
    esperaNet(bytes);
    // L'original només s'ha fet servir per a descodificar-lo.
    expect(imatges).toHaveLength(1);
    expect(deDataUrl(imatges[0].src).bytes).toEqual(FOTO_GPS);
    expect(ctx.drawImage).toHaveBeenCalledWith(imatges[0], 0, 0, 1200, 900);
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/webp', 0.8);
  });

  test.each([
    ['un JPEG menut que ja cap i es demana en JPEG', 'image/jpeg', 'image/jpeg'],
    ['un PNG', 'image/png', 'image/webp'],
    ['un GIF', 'image/gif', 'image/webp'],
    ['un WebP que es demana en WebP', 'image/webp', 'image/webp'],
  ])('cap drecera: %s també passa pel canvas', async (_cas, tipusEntrada, format) => {
    mida = { w: 10, h: 10 }; // ja és més xicoteta que maxSize: res a reduir
    const dataUrl = await compressImage(fotoGps(tipusEntrada), { maxSize: 600, format, quality: 0.8 });
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledTimes(1);
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);
    expect(deDataUrl(dataUrl).tipus).toBe(format);
    esperaNet(deDataUrl(dataUrl).bytes);
  });

  /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · compressImage no amplia
     mai, ni un costat menut ni una foto que ja hi cap: la mida exacta la fa
     el retall (useEnquadramentImatge), i els intents del pressupost ja no
     toquen maxSize, només la qualitat. */
  test.each([
    ['una foto gran apaïsada es reduïx pel costat llarg', { w: 4000, h: 3000 }, 1200, [1200, 900]],
    ['una foto gran vertical es reduïx pel costat llarg', { w: 3000, h: 4000 }, 960, [720, 960]],
    ['un retall de 1.200 × 1.200 que ja hi cap no canvia', { w: 1200, h: 1200 }, 1200, [1200, 1200]],
    ['una foto menuda no s’amplia fins a 1.200', { w: 300, h: 200 }, 1200, [300, 200]],
    ['un avatar menut no s’amplia fins a 400', { w: 250, h: 250 }, 400, [250, 250]],
  ])('mai s’amplia: %s', async (_cas, original, maxSize, [amplada, alcada]) => {
    mida = original;
    await compressImage(fotoGps(), { maxSize, format: 'image/webp', quality: 0.7 });
    expect(ctx.drawImage).toHaveBeenCalledWith(imatges[0], 0, 0, amplada, alcada);
    expect(amplada <= original.w && alcada <= original.h).toBe(true);
  });

  /* Gauntlet 261016 (Bloc 1) · La reserva JPEG de les fotos (Safari 16, que
     no codifica WebP en canvas): fons blanc abans de dibuixar, perquè la part
     transparent no isca negra. En WebP o en PNG, cap fons. */
  test.each([
    ['en JPEG, fons blanc abans de dibuixar', 'image/jpeg', 1],
    ['en WebP, cap fons', 'image/webp', 0],
    ['en PNG, cap fons', 'image/png', 0],
  ])('%s', async (_cas, format, fons) => {
    mida = { w: 800, h: 600 };
    await compressImage(fotoGps('image/png', 'logo.png'), { maxSize: 400, format, quality: 0.8 });
    expect(ctx.fillRect).toHaveBeenCalledTimes(fons);
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith(format, 0.8);
    if (fons) {
      expect(ctx.fillStyle).toBe('white');
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 400, 300);
      expect(ctx.fillRect.mock.invocationCallOrder[0]).toBeLessThan(ctx.drawImage.mock.invocationCallOrder[0]);
    }
  });

  test('robustesa: si el canvas falla dins d’onload, la promesa rebutja (no es queda penjada per sempre)', async () => {
    const penjada = Symbol('penjada');
    const ambTemps = (promesa) => Promise.race([
      promesa.then(() => 'resolta', (err) => err),
      new Promise((resol) => { setTimeout(() => resol(penjada), 2000); }),
    ]);
    HTMLCanvasElement.prototype.getContext.mockReturnValue(null);
    expect(await ambTemps(compressImage(fotoGps()))).toBeInstanceOf(Error);
    HTMLCanvasElement.prototype.getContext.mockReturnValue(ctx);
    HTMLCanvasElement.prototype.toDataURL.mockImplementation(() => {
      throw new DOMException('The canvas has been tainted by cross-origin data.', 'SecurityError');
    });
    expect(await ambTemps(compressImage(fotoGps()))).toMatchObject({ name: 'SecurityError' });
    expect(errorsEnHandlers).toEqual([]);
  });
});

describe('Bloc 1.2 · conservaExif: la tria de sèrie conserva l’EXIF publicable; l’opt-out, net', () => {
  const PUBLICABLE = preparaTiff(extreuTiff(FOTO_GPS));
  /* Un WebP simple de 1.200 × 1.200 (VP8, fotograma clau), com el del canvas de Chrome. */
  const VP8 = Uint8Array.of(0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, 0xb0, 0x04, 0xb0, 0x04, 0x11, 0x22);
  const WEBP_CANVAS = concatena(
    Uint8Array.of(0x52, 0x49, 0x46, 0x46, 4 + 8 + VP8.length, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20, VP8.length, 0, 0, 0),
    VP8,
  );
  /** El que ix porta l'EXIF publicable de la foto de prova: GPS, data i orientació 1. */
  function esperaAmbExif(bytes) {
    const bloc = extreuTiff(bytes);
    expect([...bloc]).toEqual([...PUBLICABLE]);
    expect(llegixExif(concatena(SOI, app1Exif(bloc))))
      .toEqual({ orientacio: 1, gps: { lat: 38.5919, lng: -0.4184, altitud: 456.7 }, dataCaptura: '2017-05-14T10:22:33+02:00' });
  }

  test('conservaExif (la casella marcada): el JPEG del canvas porta un APP1 nou amb el GPS, la data i l’orientació 1; la resta són els bytes del canvas', async () => {
    const dataUrl = await compressImage(fotoGps(), { maxSize: 1200, format: 'image/webp', quality: 0.8, conservaExif: true });
    const { tipus, bytes } = deDataUrl(dataUrl);
    expect(tipus).toBe('image/webp'); // la capçalera del canvas no canvia
    expect(teExif(bytes)).toBe(true);
    esperaAmbExif(bytes);
    expect(llegixExif(bytes).orientacio).toBe(1);
    expect([...bytes]).not.toEqual([...FOTO_GPS]);
    const app1 = 2 + APP0_JFIF.length;
    const longitud = (bytes[app1 + 2] << 8) | bytes[app1 + 3];
    expect([...bytes.subarray(0, app1), ...bytes.subarray(app1 + 2 + longitud)]).toEqual([...SORTIDA_CANVAS]);
  });

  /* P1-64 (pla 261028_1526 §3.1.1) · Amb `precisio`, la ubicació que torna a
     la foto ja va arrodonida (ajustaPrecisioGps); l'exacta, tal qual. */
  test('P1-64 · conservaExif amb `precisio`: el GPS del canvas ix arrodonit a la precisió triada', async () => {
    const poble = deDataUrl(await compressImage(fotoGps(), { maxSize: 1200, quality: 0.8, conservaExif: true, precisio: 'poble' })).bytes;
    expect(llegixExif(poble).gps).toEqual({ lat: 38.59, lng: -0.42, altitud: 500 });
    expect(precisioDeGps(extreuTiff(poble))).toBe('poble');
    esperaAmbExif(deDataUrl(await compressImage(fotoGps(), { maxSize: 1200, quality: 0.8, conservaExif: true, precisio: 'exacta' })).bytes);
  });

  test('conservaExif amb un WebP del canvas: tros EXIF i bit E de VP8X, creat amb les mides reals', async () => {
    HTMLCanvasElement.prototype.toDataURL.mockImplementation(() => `data:image/webp;base64,${aBase64(WEBP_CANVAS)}`);
    const { bytes } = deDataUrl(await compressImage(fotoGps(), { maxSize: 1200, quality: 0.8, conservaExif: true }));
    expect(String.fromCharCode(...bytes.subarray(12, 16))).toBe('VP8X');
    expect(bytes[20] & 0x08).toBe(0x08);
    esperaAmbExif(bytes);
  });

  test('el retall del diàleg no porta EXIF: es llig de `original`, la foto triada', async () => {
    const retall = new File([SORTIDA_CANVAS], 'enquadrament.jpg', { type: 'image/jpeg' });
    const { bytes } = deDataUrl(await compressImage(retall, { maxSize: 1200, conservaExif: true, original: fotoGps() }));
    esperaAmbExif(bytes);
    // L'original només dona l'EXIF: el que es descodifica és el retall.
    expect(imatges).toHaveLength(1);
    expect(deDataUrl(imatges[0].src).bytes).toEqual(SORTIDA_CANVAS);
  });

  test.each([
    ['l’opt-out (conservaExif: false)', { conservaExif: false }],
    ['l’opt-out amb l’original a part', { conservaExif: false, original: fotoGps() }],
    ['sense l’opció (els camins sense casella)', {}],
  ])('%s: net, com sempre', async (_cas, opcions) => {
    esperaNet(deDataUrl(await compressImage(fotoGps(), { maxSize: 1200, format: 'image/webp', ...opcions })).bytes);
  });

  test('un canvas que torna PNG (Safari 16 amb WebP) no en porta: el pressupost el torna a fer en JPEG', async () => {
    const SORTIDA_PNG = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52);
    const url = `data:image/png;base64,${aBase64(SORTIDA_PNG)}`;
    HTMLCanvasElement.prototype.toDataURL.mockImplementation(() => url);
    expect(await compressImage(fotoGps(), { maxSize: 1200, conservaExif: true })).toBe(url);
  });

  test('una foto sense EXIF, amb conservaExif: el mateix data URL del canvas', async () => {
    const neta = new File([SORTIDA_CANVAS], 'neta.jpg', { type: 'image/jpeg' });
    esperaNet(deDataUrl(await compressImage(neta, { maxSize: 1200, conservaExif: true })).bytes);
  });

  /* Gauntlet 261016 (P2 de Codex, relleu 02:25) · Abans compressImage no
     girava mai: amb un navegador que no posa dreta la foto (Chromium 151 amb
     un WebP), el raster eixia tombat i l'EXIF reinserit, amb l'orientació a 1,
     el deixava tombat per sempre. Ara es gira ací, una vegada i en el mateix
     drawImage que la reduïx, i l'EXIF va damunt del raster ja dret. */
  test('una foto que el navegador no ha posat dreta (orientació 6) ix dreta, i amb conservaExif l’orientació 1 va damunt', async () => {
    const orienta = vi.fn(async () => false);
    const dataUrl = await compressImage(fotoGps(), { maxSize: 1200, quality: 0.8, conservaExif: true, orienta });
    expect(orienta).toHaveBeenCalledWith({ format: 'image/jpeg' });
    // 4.000 × 3.000 guardats, 3.000 × 4.000 drets: 900 × 1.200, girada i reduïda d'un sol drawImage.
    expect(ctx.setTransform.mock.calls).toEqual([transformacioOrientacio(6, 1200, 900).matriu, [1, 0, 0, 1, 0, 0]]);
    expect(ctx.drawImage.mock.calls).toEqual([[imatges[0], 0, 0, 1200, 900]]);
    expect(ctx.setTransform.mock.invocationCallOrder[0]).toBeLessThan(HTMLCanvasElement.prototype.toDataURL.mock.invocationCallOrder[0]);
    esperaAmbExif(deDataUrl(dataUrl).bytes);
  });
});

describe('K3 · el text enriquit (ordre /imatge): la pujada també ix del canvas', () => {
  function editorFals() {
    const cadena = { focus: () => cadena, deleteRange: () => cadena, setImage: vi.fn(() => cadena), run: vi.fn(() => true) };
    return { editor: { chain: () => cadena }, cadena };
  }
  /* El selector de fitxers: en fer-li click, «tria» la foto amb GPS. */
  function triaRa(fitxer) {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function tria() {
      Object.defineProperty(this, 'files', { value: [fitxer], configurable: true });
      this.dispatchEvent(new Event('change'));
    });
  }

  test('amb pujada al servidor: el fitxer que puja és el del canvas, no l’original', async () => {
    const original = fotoGps('image/jpeg', 'arbre.jpg');
    triaRa(original);
    const onImageUpload = vi.fn(async () => 'sdp-media://mitjans/t/u/notes/a.webp');
    const ordre = creaOrdres({ onImageUpload }).find((o) => o.id === 'imatge');
    const { editor, cadena } = editorFals();
    await ordre.executa({ editor, range: { from: 1, to: 2 } });
    expect(onImageUpload).toHaveBeenCalledTimes(1);
    const pujat = onImageUpload.mock.calls[0][0];
    expect(pujat).not.toBe(original);
    /* Gauntlet 261016 (Bloc 1) · Abans esta línia fixava 'image/webp' per a
       tot el que pujava, siguen quins siguen els bytes. El codificador fals
       d'esta prova torna un JPEG net (SORTIDA_CANVAS) amb la capçalera de
       WebP, i el fitxer ara diu el que porta (els bytes manen). */
    expect([pujat.type, /^\d+\.jpg$/.test(pujat.name)]).toEqual(['image/jpeg', true]);
    esperaNet(await bytesDe(pujat));
    expect(cadena.setImage).toHaveBeenCalledWith({ src: 'sdp-media://mitjans/t/u/notes/a.webp', alt: 'arbre.jpg' });
  });

  /* Gauntlet 261016 (Bloc 1) · Un navegador sense codificador WebP en canvas
     (Safari 16) torna PNG encara que se li demane WebP: el fitxer que puja
     es diu .png i porta image/png, i continua sense l'EXIF de l'original. */
  test('un canvas que torna PNG: el fitxer que puja és image/png i .png, i no porta l’EXIF', async () => {
    const SORTIDA_PNG = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52);
    HTMLCanvasElement.prototype.toDataURL.mockImplementation(() => `data:image/png;base64,${aBase64(SORTIDA_PNG)}`);
    triaRa(fotoGps('image/jpeg', 'arbre.jpg'));
    const onImageUpload = vi.fn(async () => 'sdp-media://mitjans/t/u/notes/a.png');
    const ordre = creaOrdres({ onImageUpload }).find((o) => o.id === 'imatge');
    await ordre.executa({ ...editorFals(), range: { from: 1, to: 2 } });
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/webp', 0.8);
    const pujat = onImageUpload.mock.calls[0][0];
    expect([pujat.type, /^\d+\.png$/.test(pujat.name)]).toEqual(['image/png', true]);
    const bytes = await bytesDe(pujat);
    expect([...bytes]).toEqual([...SORTIDA_PNG]);
    expect(conteMarcaExif(bytes)).toBe(false);
  });

  test('sense servidor: el data URL que es desa dins de la nota també és el del canvas', async () => {
    triaRa(fotoGps());
    const ordre = creaOrdres().find((o) => o.id === 'imatge');
    const { editor, cadena } = editorFals();
    await ordre.executa({ editor, range: { from: 1, to: 2 } });
    const { src } = cadena.setImage.mock.calls[0][0];
    esperaNet(deDataUrl(src).bytes);
  });
});
