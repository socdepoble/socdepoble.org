/* T7 (P2) · graella.js: els llindars i els camins de plegat de la closca.
   La fórmula de referència és la que AppGridShell.jsx portava escrita a mà
   abans del T7: el mòdul ha de donar exactament les mateixes mides. */
import { describe, expect, test } from 'vitest';
import { COLUMNES, PUNTS_DE_TALL, amplariaMinimaAmple, columnesTancades, midaDeGraella } from './graella.js';

const PER_DEFECTE = { left: 260, middle: 280 };
const AMPLES = { left: 420, middle: 520 };

/* AppGridShell.jsx abans del T7 (measure). */
function midaDAbans(w, { left, middle }, cw) {
  const actualLeft = left ? 56 : cw.left;
  const actualMiddle = middle ? 56 : cw.middle;
  const minAmple = Math.max(900, actualLeft + actualMiddle + 320 + 1 * 2);
  if (w < 720) return 'estret';
  if (w < minAmple) return 'mitja';
  return 'ample';
}

describe('PUNTS_DE_TALL', () => {
  test('els números de sempre, congelats', () => {
    expect(PUNTS_DE_TALL).toEqual({ estret: 720, ample: 900, plegada: 56, detall: 320, separador: 1, eines: 500, compacte: 1023 });
    expect(Object.isFrozen(PUNTS_DE_TALL)).toBe(true);
    expect(COLUMNES).toEqual(['left', 'middle', 'right']);
  });
});

describe('midaDeGraella', () => {
  test('els llindars amb les amplàries per defecte: 720 i 900', () => {
    expect(midaDeGraella(0, {}, PER_DEFECTE)).toBe('estret');
    expect(midaDeGraella(719, {}, PER_DEFECTE)).toBe('estret');
    expect(midaDeGraella(720, {}, PER_DEFECTE)).toBe('mitja');
    expect(midaDeGraella(899, {}, PER_DEFECTE)).toBe('mitja');
    expect(midaDeGraella(900, {}, PER_DEFECTE)).toBe('ample');
  });

  test('columnes desades amples pugen la mínima; plegar-ne una la torna a baixar', () => {
    expect(amplariaMinimaAmple({}, AMPLES)).toBe(420 + 520 + 320 + 2);
    expect(midaDeGraella(1000, {}, AMPLES)).toBe('mitja');
    expect(amplariaMinimaAmple({ left: true }, AMPLES)).toBe(900);
    expect(midaDeGraella(1000, { left: true }, AMPLES)).toBe('ample');
    expect(amplariaMinimaAmple({ left: true, middle: true }, AMPLES)).toBe(900);
  });

  test('sense amplàries ni plegat, la mínima és la d’«ample»', () => {
    expect(amplariaMinimaAmple()).toBe(PUNTS_DE_TALL.ample);
    expect(midaDeGraella(950)).toBe('ample');
  });

  test('dona les mateixes mides que la fórmula d’abans del T7', () => {
    const plegats = [{}, { left: true }, { middle: true }, { left: true, middle: true }];
    for (const amplades of [PER_DEFECTE, AMPLES, { left: 210, middle: 250 }, { left: 300, middle: 340 }]) {
      for (const plegades of plegats) {
        for (let w = 0; w <= 1600; w += 7) {
          expect(midaDeGraella(w, plegades, amplades), `${w} ${JSON.stringify(plegades)} ${JSON.stringify(amplades)}`)
            .toBe(midaDAbans(w, { left: false, middle: false, ...plegades }, amplades));
        }
      }
    }
  });
});

describe('columnesTancades', () => {
  test('ample: cap; mitjà: la navegació si no és el panell; estret: tot el que no és el panell', () => {
    expect(columnesTancades('ample', null)).toEqual({ left: false, middle: false, right: false });
    expect(columnesTancades('mitja', null)).toEqual({ left: true, middle: false, right: false });
    expect(columnesTancades('mitja', 'left')).toEqual({ left: false, middle: false, right: false });
    expect(columnesTancades('estret', null)).toEqual({ left: true, middle: true, right: false });
    expect(columnesTancades('estret', 'left')).toEqual({ left: false, middle: true, right: true });
    expect(columnesTancades('estret', 'middle')).toEqual({ left: true, middle: false, right: true });
  });

  /* Barres (ordre del Mestre, 261004) · Amb railEsquerra, en «mitja» la
     navegació és un rail fix: mai tancada. Ample i estret, com sempre. */
  test('railEsquerra: en mitjà la navegació no es tanca mai; en ample i en estret, res no canvia', () => {
    const rail = { railEsquerra: true };
    expect(columnesTancades('mitja', null, rail)).toEqual({ left: false, middle: false, right: false });
    expect(columnesTancades('mitja', 'left', rail)).toEqual({ left: false, middle: false, right: false });
    expect(columnesTancades('mitja', 'middle', rail)).toEqual({ left: false, middle: false, right: false });
    for (const mida of ['ample', 'estret']) {
      for (const panell of [null, 'left', 'middle']) {
        expect(columnesTancades(mida, panell, rail), `${mida} ${panell}`).toEqual(columnesTancades(mida, panell));
      }
    }
    /* Sense l'opció, o amb false, la regla d'abans. */
    expect(columnesTancades('mitja', null, {})).toEqual({ left: true, middle: false, right: false });
    expect(columnesTancades('mitja', null, { railEsquerra: false })).toEqual({ left: true, middle: false, right: false });
  });
});
