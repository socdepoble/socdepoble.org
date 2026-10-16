import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { teExif } from './exif.js';
import { carregaImatge, exportaRetall } from './imatgeCanvas.js';
import { APP0_JFIF, IMATGE, SOI, concatena, jpegAmbExif, gpsTorre, orientacio } from './jpegProva.js';
import { PES_MAXIM_ENTRADA } from './limits.js';

/* Onada 4, T3a · La frontera amb el navegador. jsdom no té canvas ni
   descodifica imatges: el context 2D, toBlob, Image i createObjectURL s'emulen
   i es restituïxen en acabar. */

/* El que escriuria un codificador de canvas: un JPEG sense cap APP1. */
const SORTIDA_CANVAS = concatena(SOI, APP0_JFIF, IMATGE);

const bytesDe = (blob) => new Promise((resol, rebutja) => {
  const lector = new FileReader();
  lector.onload = () => resol(new Uint8Array(lector.result));
  lector.onerror = () => rebutja(lector.error);
  lector.readAsArrayBuffer(blob);
});

let ctx;
let codifica;
const urlOriginal = { crea: URL.createObjectURL, revoca: URL.revokeObjectURL };

beforeEach(() => {
  ctx = { setTransform: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn(), clearRect: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx);
  // Per defecte, un navegador que sap codificar tots els formats.
  codifica = vi.fn((tipus) => tipus);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function toBlob(cb, tipus) {
    const real = codifica(tipus);
    cb(real === null ? null : new Blob([SORTIDA_CANVAS], { type: real }));
  });
  URL.createObjectURL = vi.fn(() => 'blob:prova/1');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  URL.createObjectURL = urlOriginal.crea;
  URL.revokeObjectURL = urlOriginal.revoca;
});

const RECT = { x: 10, y: 20, w: 300, h: 300 };
const element = { soc: 'imatge descodificada' };

describe('T3a · exportaRetall', () => {
  test('WebP demanat i el navegador torna PNG (Safari): es torna a codificar en JPEG, amb fons blanc', async () => {
    codifica.mockImplementation((tipus) => (tipus === 'image/webp' ? 'image/png' : tipus));
    const fitxer = await exportaRetall(element, RECT, { amplada: 200, alcada: 200, tipus: 'image/webp', qualitat: 0.8 });
    expect(HTMLCanvasElement.prototype.toBlob.mock.calls.map((c) => c.slice(1))).toEqual([['image/webp', 0.8], ['image/jpeg', 0.8]]);
    expect(fitxer.type).toBe('image/jpeg');
    expect(fitxer.name).toBe('enquadrament.jpg');
    expect(ctx.fillRect).toHaveBeenCalledTimes(1); // només la passada JPEG
  });

  test('WebP demanat i suportat: un fitxer .webp, sense fons ni segona passada', async () => {
    const fitxer = await exportaRetall(element, RECT, { amplada: 200, alcada: 200, tipus: 'image/webp' });
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledTimes(1);
    expect(fitxer.type).toBe('image/webp');
    expect(fitxer.name).toBe('enquadrament.webp');
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  test('el contracte T46 no canvia: JPEG a 0,92 i PNG', async () => {
    const jpeg = await exportaRetall(element, RECT, { amplada: 200, alcada: 200 });
    expect(HTMLCanvasElement.prototype.toBlob.mock.calls[0].slice(1)).toEqual(['image/jpeg', 0.92]);
    expect(jpeg.name).toBe('enquadrament.jpg');
    const png = await exportaRetall(element, RECT, { amplada: 200, alcada: 200, tipus: 'image/png' });
    expect(png.name).toBe('enquadrament.png');
  });

  test('el fitxer que ix són EXACTAMENT els bytes de canvas.toBlob: cap APP1, cap EXIF de l’original', async () => {
    const original = jpegAmbExif({ ifd0: [orientacio(6)], gps: gpsTorre() });
    expect(teExif(original)).toBe(true);
    const fitxer = await exportaRetall(element, RECT, { amplada: 200, alcada: 200, tipus: 'image/webp' });
    const bytes = await bytesDe(fitxer);
    expect([...bytes]).toEqual([...SORTIDA_CANVAS]);
    expect(teExif(bytes)).toBe(false);
    // L'únic que es dibuixa és la imatge descodificada, mai els bytes del fitxer original.
    expect(ctx.drawImage).toHaveBeenCalledWith(element, 10, 20, 300, 300, 0, 0, 200, 200);
  });

  test('sense context 2D o sense blob: un error en valencià', async () => {
    codifica.mockReturnValue(null);
    await expect(exportaRetall(element, RECT, { amplada: 1, alcada: 1 })).rejects.toThrow('El navegador no ha pogut preparar la imatge enquadrada.');
    HTMLCanvasElement.prototype.getContext.mockReturnValue(null);
    await expect(exportaRetall(element, RECT, { amplada: 1, alcada: 1 })).rejects.toThrow('El navegador no ha pogut preparar la imatge enquadrada.');
  });
});

/* Una Image falsa: en posar-li src, «descodifica» amb la mida configurada. */
function imatgeFalsa({ amplada = 4000, alcada = 3000, falla = false } = {}) {
  return class ImatgeFalsa {
    constructor() {
      this.naturalWidth = 0;
      this.naturalHeight = 0;
    }

    set src(url) {
      this.url = url;
      queueMicrotask(() => {
        if (falla) {
          this.onerror?.();
          return;
        }
        this.naturalWidth = amplada;
        this.naturalHeight = alcada;
        this.onload?.();
      });
    }

    get src() {
      return this.url;
    }
  };
}

const fotoAmb = (o) => new File([jpegAmbExif({ ifd0: [orientacio(o)] })], 'foto.jpg', { type: 'image/jpeg' });

describe('T3a · carregaImatge: límits', () => {
  test('més de 25 MB: ErrorImatge «pes», sense descodificar res', async () => {
    const gran = new File(['x'], 'gran.jpg', { type: 'image/jpeg' });
    Object.defineProperty(gran, 'size', { value: PES_MAXIM_ENTRADA + 1 });
    await expect(carregaImatge(gran)).rejects.toMatchObject({ name: 'ErrorImatge', codi: 'pes' });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  test('massa píxels: ErrorImatge «pixels» i l’objectURL es revoca', async () => {
    vi.stubGlobal('Image', imatgeFalsa({ amplada: 20000, alcada: 100 }));
    await expect(carregaImatge(fotoAmb(1), { orienta: async () => true })).rejects.toMatchObject({ codi: 'pixels' });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:prova/1');
  });

  test('un HEIC que el navegador no obri: ErrorImatge «heic»; un altre format trencat, l’error de sempre', async () => {
    vi.stubGlobal('Image', imatgeFalsa({ falla: true }));
    const heic = new File(['x'], 'IMG_0001.HEIC', { type: 'image/heic' });
    await expect(carregaImatge(heic)).rejects.toMatchObject({ codi: 'heic' });
    await expect(carregaImatge(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).rejects.toThrow('El navegador no pot obrir esta imatge.');
  });
});

describe('T3a · carregaImatge: l’orientació s’aplica UNA vegada', () => {
  /* Gauntlet 261016 (P2 de Codex, 02:04:33) · ACTUALITZADA A POSTA. Abans es
     preguntava primer al navegador (una sonda JPEG que valia per a tot) i, si
     deia que sí, el fitxer no es llegia. Ara la resposta és PER FORMAT, i el
     format és el dels bytes: el fitxer es llig primer, una vegada (format i
     orientació, llegixOrientacioImatge), i al navegador només se li pregunta
     si hi ha res a girar. El que no canvia: si el navegador ja la posa dreta,
     no es gira res. */
  test('si el navegador ja la posa dreta en eixe format, no es gira res', async () => {
    vi.stubGlobal('Image', imatgeFalsa({ amplada: 3000, alcada: 4000 }));
    const lligOrientacio = vi.fn(async () => ({ format: 'image/jpeg', orientacio: 6 }));
    const orienta = vi.fn(async () => true);
    const foto = fotoAmb(6);
    const img = await carregaImatge(foto, { orienta, lligOrientacio });
    expect(lligOrientacio.mock.calls).toEqual([[foto]]);
    expect(orienta.mock.calls).toEqual([[{ format: 'image/jpeg' }]]);
    expect(ctx.setTransform).not.toHaveBeenCalled();
    expect([img.amplada, img.alcada]).toEqual([3000, 4000]);
    expect(img.element.constructor.name).toBe('ImatgeFalsa');
  });

  test('una foto dreta (1) o sense orientació: no es pregunta al navegador ni es gira', async () => {
    vi.stubGlobal('Image', imatgeFalsa({ amplada: 4000, alcada: 3000 }));
    const orienta = vi.fn(async () => false);
    for (const foto of [fotoAmb(1), new File([concatena(SOI, APP0_JFIF, IMATGE)], 'neta.jpg', { type: 'image/jpeg' })]) {
      const img = await carregaImatge(foto, { orienta });
      expect(img.element.constructor.name).toBe('ImatgeFalsa');
    }
    expect(orienta).not.toHaveBeenCalled();
    expect(ctx.setTransform).not.toHaveBeenCalled();
  });

  test('a la sonda li arriba el format dels bytes: un JPEG que diu ser PNG no fa servir la resposta del PNG', async () => {
    vi.stubGlobal('Image', imatgeFalsa({ amplada: 4000, alcada: 3000 }));
    const orienta = vi.fn(async ({ format }) => format !== 'image/jpeg');
    const foto = new File([jpegAmbExif({ ifd0: [orientacio(6)] })], 'foto.png', { type: 'image/png' });
    const img = await carregaImatge(foto, { orienta });
    expect(orienta.mock.calls).toEqual([[{ format: 'image/jpeg' }]]);
    expect([img.amplada, img.alcada]).toEqual([3000, 4000]);
    expect(ctx.setTransform.mock.calls[0]).toEqual([0, 1, -1, 0, 3000, 0]);
    img.allibera();
  });

  test('si no, el lector propi llig l’orientació del fitxer i es gira sobre un canvas (que ja no porta EXIF)', async () => {
    vi.stubGlobal('Image', imatgeFalsa({ amplada: 4000, alcada: 3000 }));
    const img = await carregaImatge(fotoAmb(6), { orienta: async () => false });
    expect(img.element).toBeInstanceOf(HTMLCanvasElement);
    expect([img.amplada, img.alcada]).toEqual([3000, 4000]);
    expect([img.element.width, img.element.height]).toEqual([3000, 4000]);
    expect(ctx.setTransform.mock.calls[0]).toEqual([0, 1, -1, 0, 3000, 0]);
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);
    expect(img.tipus).toBe('image/jpeg');
    img.allibera();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:prova/1');
    expect([img.element.width, img.element.height]).toEqual([0, 0]);
  });

  test('si no la posa dreta però la foto ja ve dreta (1), la imatge tal qual', async () => {
    vi.stubGlobal('Image', imatgeFalsa({ amplada: 4000, alcada: 3000 }));
    const img = await carregaImatge(fotoAmb(1), { orienta: async () => false });
    expect(img.element.constructor.name).toBe('ImatgeFalsa');
    expect(ctx.setTransform).not.toHaveBeenCalled();
  });

  test('una URL blob: directa no té bytes per a llegir: no es gira', async () => {
    vi.stubGlobal('Image', imatgeFalsa({ amplada: 400, alcada: 300 }));
    const orienta = vi.fn(async () => false);
    const img = await carregaImatge('blob:pagina/2', { orienta });
    expect(orienta).not.toHaveBeenCalled();
    expect(img.amplada).toBe(400);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});

/* Gauntlet 261016 (Bloc B, P2) · El blob que s'ha obert torna amb la imatge:
   el DialegEnquadrament en llig l'EXIF quan la font és una adreça ja desada
   (re-enquadrar una capçalera), i la pujada el rep com a `original`. Un blob:
   directe no se'n pot llegir (la CSP no en deixa fer fetch): null. */
describe('Bloc B · carregaImatge torna el blob que ha obert', () => {
  test('un File: el mateix File; una adreça: el blob baixat; un blob: directe, null', async () => {
    vi.stubGlobal('Image', imatgeFalsa({ amplada: 400, alcada: 300 }));
    const foto = fotoAmb(1);
    expect((await carregaImatge(foto, { orienta: async () => true })).blob).toBe(foto);
    const baixat = new Blob([jpegAmbExif({ gps: gpsTorre() })], { type: 'image/webp' });
    const fetch = vi.fn(async () => ({ ok: true, blob: async () => baixat }));
    vi.stubGlobal('fetch', fetch);
    const img = await carregaImatge('/assets/h.webp', { orienta: async () => true });
    expect(fetch).toHaveBeenCalledWith('/assets/h.webp', expect.objectContaining({ mode: 'cors', credentials: 'omit' }));
    expect(img.blob).toBe(baixat);
    expect((await carregaImatge('blob:pagina/2')).blob).toBeNull();
  });

  test('girada sobre un canvas, el blob continua sent el de l’original', async () => {
    vi.stubGlobal('Image', imatgeFalsa({ amplada: 4000, alcada: 3000 }));
    const foto = fotoAmb(6);
    const img = await carregaImatge(foto, { orienta: async () => false });
    expect(img.element).toBeInstanceOf(HTMLCanvasElement);
    expect(img.blob).toBe(foto);
    img.allibera();
  });
});
