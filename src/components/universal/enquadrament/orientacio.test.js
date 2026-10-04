import { afterEach, describe, expect, test, vi } from 'vitest';
import { llegixExif } from './exif.js';
import {
  ORIENTACIO_AUTOMATICA_PER_DEFECTE, aplicaMatriu, navegadorAplicaOrientacio, segmentOrientacio, transformacioOrientacio,
} from './orientacio.js';
import { IMATGE, SOI, concatena } from './jpegProva.js';

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
