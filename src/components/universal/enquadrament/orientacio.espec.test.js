import { describe, expect, test } from 'vitest';
import { transformacioOrientacio } from './orientacio.js';

/* Onada 4 · revisió adversarial (K6) · Les huit matrius de
   transformacioOrientacio contrastades amb l'estàndard SENSE fer servir cap
   matriu de referència ni aplicaMatriu (que són del mateix autor):
     · la foto dreta es construïx només amb la taula textual de l'EXIF
       (etiqueta 0x0112: on queda la fila 0 i on queda la columna 0);
     · el punt es transforma amb la definició de setTransform(a, b, c, d, e, f)
       de l'estàndard HTML del canvas: x' = a·x + c·y + e, y' = b·x + d·y + f.
   Una foto guardada de 3×2 amb sis valors diferents: cada píxel ha de caure
   en un lloc únic i l'esperat. */

/* EXIF 2.32, Orientation: «The 0th row is at the visual … and the 0th column is the visual …». */
const ESTANDARD = Object.freeze({
  1: { fila0: 'dalt', columna0: 'esquerra' },
  2: { fila0: 'dalt', columna0: 'dreta' },
  3: { fila0: 'baix', columna0: 'dreta' },
  4: { fila0: 'baix', columna0: 'esquerra' },
  5: { fila0: 'esquerra', columna0: 'dalt' },
  6: { fila0: 'dreta', columna0: 'dalt' },
  7: { fila0: 'dreta', columna0: 'baix' },
  8: { fila0: 'esquerra', columna0: 'baix' },
});

const GUARDADA = [
  ['a', 'b', 'c'],
  ['d', 'e', 'f'],
];

/** La foto dreta, deduïda només de la taula de l'estàndard. */
function dretaSegonsEstandard(o, guardada) {
  const H = guardada.length;
  const W = guardada[0].length;
  const { fila0, columna0 } = ESTANDARD[o];
  const filesHoritzontals = fila0 === 'dalt' || fila0 === 'baix';
  const amplada = filesHoritzontals ? W : H;
  const alcada = filesHoritzontals ? H : W;
  const dreta = Array.from({ length: alcada }, () => Array(amplada).fill(null));
  for (let r = 0; r < H; r += 1) {
    for (let c = 0; c < W; c += 1) {
      let x;
      let y;
      if (filesHoritzontals) {
        y = fila0 === 'dalt' ? r : H - 1 - r;
        x = columna0 === 'esquerra' ? c : W - 1 - c;
      } else {
        // La fila r guardada passa a ser una COLUMNA; la columna c, una fila.
        x = fila0 === 'esquerra' ? r : H - 1 - r;
        y = columna0 === 'dalt' ? c : W - 1 - c;
      }
      dreta[y][x] = guardada[r][c];
    }
  }
  return dreta;
}

/** HTML, CanvasRenderingContext2D.setTransform(a, b, c, d, e, f): la matriu [[a c e] [b d f] [0 0 1]]. */
const perSetTransform = ([a, b, c, d, e, f], x, y) => ({ x: a * x + c * y + e, y: b * x + d * y + f });

/** La foto dreta tal com la pinta imatgeCanvas.giraSiCal: setTransform(matriu) i drawImage(foto, 0, 0). */
function dretaSegonsCanvas(o, guardada) {
  const H = guardada.length;
  const W = guardada[0].length;
  const t = transformacioOrientacio(o, W, H);
  const dreta = Array.from({ length: t.alcada }, () => Array(t.amplada).fill(null));
  for (let r = 0; r < H; r += 1) {
    for (let c = 0; c < W; c += 1) {
      // El centre del píxel guardat (c, r).
      const p = perSetTransform(t.matriu, c + 0.5, r + 0.5);
      const x = Math.floor(p.x);
      const y = Math.floor(p.y);
      if (y < 0 || y >= t.alcada || x < 0 || x >= t.amplada) return { fora: [r, c, p] };
      if (dreta[y][x] !== null) return { repetit: [r, c, p] };
      dreta[y][x] = guardada[r][c];
    }
  }
  return dreta;
}

describe('K6 · les huit orientacions contra l’estàndard EXIF', () => {
  test.each([1, 2, 3, 4, 5, 6, 7, 8])('orientació %i: el canvas pinta el que diu la taula de l’estàndard', (o) => {
    expect(dretaSegonsCanvas(o, GUARDADA)).toEqual(dretaSegonsEstandard(o, GUARDADA));
  });

  test('ancoratges coneguts: 6 és girar 90° en el sentit del rellotge i 8, en contra; 3, mitja volta', () => {
    // Girar 90° en el sentit del rellotge una matriu H×W: nova[y][x] = vella[H-1-x][y].
    const H = GUARDADA.length;
    const W = GUARDADA[0].length;
    const horari = Array.from({ length: W }, (_, y) => Array.from({ length: H }, (_, x) => GUARDADA[H - 1 - x][y]));
    const antihorari = Array.from({ length: W }, (_, y) => Array.from({ length: H }, (_, x) => GUARDADA[x][W - 1 - y]));
    const mitjaVolta = GUARDADA.map((fila) => [...fila].reverse()).reverse();
    expect(dretaSegonsCanvas(6, GUARDADA)).toEqual(horari);
    expect(dretaSegonsCanvas(8, GUARDADA)).toEqual(antihorari);
    expect(dretaSegonsCanvas(3, GUARDADA)).toEqual(mitjaVolta);
    expect(horari).toEqual([['d', 'a'], ['e', 'b'], ['f', 'c']]);
  });

  test('també amb una foto quadrada i una de 1×N (cap cas degenerat)', () => {
    const quadrada = [['a', 'b'], ['c', 'd']];
    const tira = [['a', 'b', 'c', 'd']];
    for (let o = 1; o <= 8; o += 1) {
      expect(dretaSegonsCanvas(o, quadrada)).toEqual(dretaSegonsEstandard(o, quadrada));
      expect(dretaSegonsCanvas(o, tira)).toEqual(dretaSegonsEstandard(o, tira));
    }
  });
});
