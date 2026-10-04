import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { compressImage } from './imageUtils.js';
import { llegixExif, teExif } from '../components/universal/enquadrament/exif.js';
import {
  APP0_JFIF, IMATGE, SOI, concatena, dataOriginal, gpsTorre, jpegAmbExif, orientacio,
} from '../components/universal/enquadrament/jpegProva.js';
import { creaOrdres } from '../components/universal/richText/extensions/index.js';

/* Onada 4 · revisió adversarial (K3, ADR multimèdia D4) · compressImage és la
   porta per on passen TOTES les pujades d'imatge (capçalera, avatar, logotip,
   ajust d'imatge i imatges del text enriquit). Ací es prova que no té cap
   drecera: el que ix són sempre els bytes del codificador del canvas, mai els
   de l'original, encara que l'original siga un JPEG xicotet amb GPS.

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

beforeEach(() => {
  ctx = { clearRect: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn() };
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

describe('K3 · compressImage: sempre torna a codificar', () => {
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
    expect(pujat.type).toBe('image/webp');
    esperaNet(await bytesDe(pujat));
    expect(cadena.setImage).toHaveBeenCalledWith({ src: 'sdp-media://mitjans/t/u/notes/a.webp', alt: 'arbre.jpg' });
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
