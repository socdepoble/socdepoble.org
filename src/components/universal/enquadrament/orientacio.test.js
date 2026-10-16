import { afterEach, describe, expect, test, vi } from 'vitest';
import { llegixExif } from './exif.js';
import {
  ORIENTACIO_AUTOMATICA_PER_DEFECTE, aplicaMatriu, navegadorAplicaOrientacio, segmentOrientacio, transformacioOrientacio,
} from './orientacio.js';
import { APP0_JFIF, IMATGE, SOI, concatena } from './jpegProva.js';

/* Onada 4, T3a · Les huit orientacions EXIF (ADR multimèdia §3.2 i §5). Una
   foto guardada de 4×2 px: on ha d'anar cada cantó perquè isca dreta. Les
   regles són les de l'estàndard EXIF («la fila 0 és el costat … i la columna
   0 és el costat …»). */

afterEach(() => {
  vi.restoreAllMocks();
});

const W = 4;
const H = 2;

/* [orientació, matriu esperada, mida girada, on cau el cantó de dalt a
   l'esquerra guardat, on cau el de dalt a la dreta guardat]. */
const CASOS = [
  [1, [1, 0, 0, 1, 0, 0], [4, 2], 'dalt-esquerra', 'dalt-dreta'],
  [2, [-1, 0, 0, 1, 4, 0], [4, 2], 'dalt-dreta', 'dalt-esquerra'],
  [3, [-1, 0, 0, -1, 4, 2], [4, 2], 'baix-dreta', 'baix-esquerra'],
  [4, [1, 0, 0, -1, 0, 2], [4, 2], 'baix-esquerra', 'baix-dreta'],
  [5, [0, 1, 1, 0, 0, 0], [2, 4], 'dalt-esquerra', 'baix-esquerra'],
  [6, [0, 1, -1, 0, 2, 0], [2, 4], 'dalt-dreta', 'baix-dreta'],
  [7, [0, -1, -1, 0, 2, 4], [2, 4], 'baix-dreta', 'dalt-dreta'],
  [8, [0, -1, 1, 0, 0, 4], [2, 4], 'baix-esquerra', 'dalt-esquerra'],
];

const cantoDe = ({ x, y }, amplada, alcada) => {
  const v = y === 0 ? 'dalt' : (y === alcada ? 'baix' : '?');
  const h = x === 0 ? 'esquerra' : (x === amplada ? 'dreta' : '?');
  return `${v}-${h}`;
};

describe('T3a · transformacioOrientacio: les huit', () => {
  test.each(CASOS)('orientació %i', (o, matriu, [amplada, alcada], tl, tr) => {
    const t = transformacioOrientacio(o, W, H);
    expect(t.matriu).toEqual(matriu);
    expect([t.amplada, t.alcada]).toEqual([amplada, alcada]);
    expect(cantoDe(aplicaMatriu(t.matriu, 0, 0), t.amplada, t.alcada)).toBe(tl);
    expect(cantoDe(aplicaMatriu(t.matriu, W, 0), t.amplada, t.alcada)).toBe(tr);
    // La foto sencera cau dins del canvas girat: cap cantó fora.
    for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) {
      const p = aplicaMatriu(t.matriu, x, y);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(t.amplada);
      expect(p.y).toBeLessThanOrEqual(t.alcada);
    }
  });

  test('de 5 a 8 la mida es gira; d’1 a 4, no', () => {
    for (let o = 1; o <= 8; o += 1) {
      const t = transformacioOrientacio(o, 3000, 2000);
      expect([t.amplada, t.alcada]).toEqual(o >= 5 ? [2000, 3000] : [3000, 2000]);
    }
  });

  test('una orientació desconeguda (null, 0, 9) es dibuixa tal com està', () => {
    for (const o of [null, undefined, 0, 9, '6']) {
      expect(transformacioOrientacio(o, W, H)).toEqual({ amplada: W, alcada: H, matriu: [1, 0, 0, 1, 0, 0] });
    }
  });
});

describe('T3a · segmentOrientacio', () => {
  test('el lector propi el llig: el segment de la sonda és un EXIF vàlid', () => {
    for (let o = 1; o <= 8; o += 1) {
      const bytes = concatena(SOI, segmentOrientacio(o), IMATGE);
      expect(llegixExif(bytes)).toEqual({ orientacio: o, gps: null, dataCaptura: null });
    }
  });
});

describe('T3a · navegadorAplicaOrientacio', () => {
  test('la resposta de la sonda es guarda: una sola descodificació per sessió', async () => {
    const sonda = vi.fn(async () => false);
    expect(await navegadorAplicaOrientacio({ sonda, refresca: true })).toBe(false);
    expect(await navegadorAplicaOrientacio({ sonda })).toBe(false);
    expect(await navegadorAplicaOrientacio()).toBe(false);
    expect(sonda).toHaveBeenCalledTimes(1);
  });

  test('si la sonda falla o no diu res clar, el valor segur (el navegador ja l’aplica)', async () => {
    expect(ORIENTACIO_AUTOMATICA_PER_DEFECTE).toBe(true);
    expect(await navegadorAplicaOrientacio({ sonda: () => { throw new Error('sense canvas'); }, refresca: true })).toBe(true);
    expect(await navegadorAplicaOrientacio({ sonda: async () => 'potser', refresca: true })).toBe(true);
    expect(await navegadorAplicaOrientacio({ sonda: async () => true, refresca: true })).toBe(true);
  });

  test('una sonda que no acaba mai no bloqueja: als 3 s, el valor segur', async () => {
    vi.useFakeTimers();
    try {
      const promesa = navegadorAplicaOrientacio({ sonda: () => new Promise(() => {}), refresca: true });
      await vi.advanceTimersByTimeAsync(3000);
      expect(await promesa).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  test('en jsdom (sense context 2D), la sonda real torna el valor segur', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(await navegadorAplicaOrientacio({ refresca: true })).toBe(true);
  });
});

/* Gauntlet 261016 · P2 de Codex (02:04:33) · Chromium 151 posa dret un JPEG
   o un PNG amb l'Orientation 6, però no un WebP: la sonda i la seua memòria
   són per format. Les sondes de PNG i de WebP són bytes incrustats
   (orientacio.js): ací es comprova que són el que diuen, tros a tros. */
describe('Gauntlet 261016 · la sonda és per format', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const bytesDe = (blob) => new Promise((resol, rebutja) => {
    const lector = new FileReader();
    lector.onload = () => resol(new Uint8Array(lector.result));
    lector.onerror = () => rebutja(lector.error);
    lector.readAsArrayBuffer(blob);
  });
  /* Un navegador fals: cada <img> «descodifica» amb la mida donada (2×1: no
     aplica l'orientació; 1×2: sí). Es guarden els blobs que se li donen. */
  function navegadorFals(amplada, alcada) {
    const blobs = [];
    const revoca = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: (blob) => { blobs.push(blob); return `blob:sonda/${blobs.length}`; }, revokeObjectURL: revoca });
    vi.stubGlobal('Image', class {
      set src(_url) {
        this.naturalWidth = amplada;
        this.naturalHeight = alcada;
        queueMicrotask(() => this.onload());
      }
    });
    return { blobs, revoca };
  }

  const TAULA_CRC = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (bytes) => {
    let c = 0xffffffff;
    for (const b of bytes) c = TAULA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const text = (b) => String.fromCharCode(...b);
  /** Els trossos d'un PNG: tipus, dades i si el CRC quadra. */
  function trossosPng(b) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const trossos = [];
    for (let p = 8; p + 12 <= b.length; p += 12 + v.getUint32(p)) {
      const n = v.getUint32(p);
      trossos.push({ tipus: text(b.subarray(p + 4, p + 8)), dades: b.subarray(p + 8, p + 8 + n), crc: v.getUint32(p + 8 + n) === crc32(b.subarray(p + 4, p + 8 + n)) });
    }
    return trossos;
  }
  /** Els trossos d'un RIFF/WebP: tipus i dades. */
  function trossosWebp(b) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const trossos = [];
    for (let p = 12; p + 8 <= b.length; p += 8 + v.getUint32(p + 4, true) + (v.getUint32(p + 4, true) & 1)) {
      trossos.push({ tipus: text(b.subarray(p, p + 4)), dades: b.subarray(p + 8, p + 8 + v.getUint32(p + 4, true)) });
    }
    return trossos;
  }

  test('la memòria és per format: el JPEG i el PNG drets no fan passar el WebP per dret', async () => {
    const sonda = vi.fn(async (format) => format !== 'image/webp');
    for (const format of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(await navegadorAplicaOrientacio({ format, sonda, refresca: true })).toBe(format !== 'image/webp');
    }
    expect(await navegadorAplicaOrientacio({ format: ' IMAGE/WEBP ', sonda })).toBe(false);
    expect(await navegadorAplicaOrientacio({ sonda })).toBe(true); // sense format: el JPEG, com abans
    expect(sonda.mock.calls).toEqual([['image/jpeg'], ['image/png'], ['image/webp']]);
    // Un format sense sonda (o que no se sap quin és) no hereta la resposta de cap altre.
    for (const format of ['image/avif', 'image/gif', null, '']) {
      expect(await navegadorAplicaOrientacio({ format, sonda })).toBe(ORIENTACIO_AUTOMATICA_PER_DEFECTE);
    }
    expect(sonda).toHaveBeenCalledTimes(3);
  });

  test.each(['image/png', 'image/webp'])('la sonda real de %s descodifica una imatge d’eixe format amb l’Orientation 6, sense cap codificador del canvas', async (format) => {
    const codificadors = [vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL'), vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')];
    const { blobs, revoca } = navegadorFals(2, 1);
    expect(await navegadorAplicaOrientacio({ format, refresca: true })).toBe(false);
    for (const c of codificadors) expect(c).not.toHaveBeenCalled();
    expect(blobs.map((b) => b.type)).toEqual([format]);
    expect(revoca).toHaveBeenCalledWith('blob:sonda/1');
    const bytes = await bytesDe(blobs[0]);
    expect(llegixExif(bytes)).toEqual({ orientacio: 6, gps: null, dataCaptura: null });
    if (format === 'image/png') {
      const trossos = trossosPng(bytes);
      expect(trossos.map((t) => t.tipus)).toEqual(['IHDR', 'eXIf', 'IDAT', 'IEND']);
      expect(trossos.every((t) => t.crc)).toBe(true);
      const ihdr = new DataView(trossos[0].dades.buffer, trossos[0].dades.byteOffset, 8);
      expect([ihdr.getUint32(0), ihdr.getUint32(4)]).toEqual([2, 1]);
    } else {
      expect([text(bytes.subarray(0, 4)), new DataView(bytes.buffer).getUint32(4, true), text(bytes.subarray(8, 12))]).toEqual(['RIFF', bytes.length - 8, 'WEBP']);
      const trossos = trossosWebp(bytes);
      expect(trossos.map((t) => t.tipus)).toEqual(['VP8X', 'VP8L', 'EXIF']);
      const [vp8x, vp8l] = trossos.map((t) => t.dades);
      expect(vp8x[0] & 0x08).toBe(0x08); // el bit E: porta EXIF
      expect([vp8x[4] | (vp8x[5] << 8) | (vp8x[6] << 16), vp8x[7] | (vp8x[8] << 8) | (vp8x[9] << 16)]).toEqual([1, 0]); // 2 × 1
      const bits = new DataView(vp8l.buffer, vp8l.byteOffset + 1, 4).getUint32(0, true);
      expect([vp8l[0], (bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1]).toEqual([0x2f, 2, 1]);
    }
  });

  test('el que mesura la sonda: 1×2 és que la posa dreta; 2×1, que no; una altra mida, el valor segur', async () => {
    for (const [amplada, alcada, esperat] of [[1, 2, true], [2, 1, false], [3000, 3000, ORIENTACIO_AUTOMATICA_PER_DEFECTE]]) {
      navegadorFals(amplada, alcada);
      expect(await navegadorAplicaOrientacio({ format: 'image/webp', refresca: true })).toBe(esperat);
    }
  });

  test('la de JPEG és la del canvas, amb toDataURL (síncron): l’Orientation 6 just darrere de SOI', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({});
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');
    const canvasJpeg = concatena(SOI, APP0_JFIF, IMATGE);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(`data:image/jpeg;base64,${btoa(String.fromCharCode(...canvasJpeg))}`);
    const { blobs } = navegadorFals(1, 2);
    expect(await navegadorAplicaOrientacio({ format: 'image/jpeg', refresca: true })).toBe(true);
    expect(toBlob).not.toHaveBeenCalled();
    const bytes = await bytesDe(blobs[0]);
    expect([...bytes]).toEqual([...concatena(SOI, segmentOrientacio(6), canvasJpeg.subarray(2))]);
  });

  test('un canvas que no dona cap JPEG (jsdom sense codificador, o un PNG): el valor segur, sense esperar cap resposta', async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({});
      const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
      const { blobs } = navegadorFals(2, 1);
      for (const resposta of [null, 'data:image/png;base64,iVBORw0KGgo=', 'no és cap URL']) {
        toDataURL.mockReturnValue(resposta);
        // Sense avançar el rellotge: la resposta arriba sense el temps esgotat de la sonda.
        expect(await navegadorAplicaOrientacio({ format: 'image/jpeg', refresca: true })).toBe(true);
      }
      expect(blobs).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});
