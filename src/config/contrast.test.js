/* Onada 11 (261010; prompt 261010_1730, tasca 2) · contrast.js és la fórmula
   de src/css/tokens.contracte.test.js (:55-67) traslladada a un mòdul: ací es
   comprova contra una còpia literal d'eixa fórmula i contra parells coneguts
   (negre sobre blanc 21:1; els contrastos anotats a tokens.css). */
import { describe, expect, test } from 'vitest';
import { contrast, esHex6, luminancia } from './contrast.js';

/* Còpia literal de tokens.contracte.test.js:55-64, sense els expect. */
function luminanciaDeLaProva(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastDeLaProva(a, b) {
  const [la, lb] = [luminanciaDeLaProva(a), luminanciaDeLaProva(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* Colors de tokens.css (hex cru a posta: ALLOW_RAW_COLOR, és la font de veritat copiada). */
const MOSTRES = [
  '#000000', '#ffffff', '#ff7300', '#0984e3',
  /* ALLOW_RAW_COLOR */ '#f3f0ec',
  /* ALLOW_RAW_COLOR */ '#3d3b35',
  /* ALLOW_RAW_COLOR */ '#0e0d0c',
  /* ALLOW_RAW_COLOR */ '#004983',
  /* ALLOW_RAW_COLOR */ '#92000c',
  /* ALLOW_RAW_COLOR */ '#ffedeb'
];

describe('contrast.js · la fórmula de tokens.contracte.test.js', () => {
  test('la luminància coincidix amb la de la prova del contracte per a cada mostra', () => {
    for (const hex of MOSTRES) expect(luminancia(hex)).toBeCloseTo(luminanciaDeLaProva(hex), 12);
  });

  test('el contrast coincidix amb el de la prova del contracte per a cada parell', () => {
    for (const a of MOSTRES) for (const b of MOSTRES) expect(contrast(a, b)).toBeCloseTo(contrastDeLaProva(a, b), 12);
  });

  test('negre sobre blanc: 21:1; un color sobre si mateix: 1:1; simètric', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 6);
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 6);
    expect(contrast('#ff7300', '#ff7300')).toBe(1);
    expect(contrast(MOSTRES[4], MOSTRES[5])).toBeCloseTo(contrast(MOSTRES[5], MOSTRES[4]), 12);
  });

  test('parells anotats a tokens.css: la roca sobre el taronja 7,12:1; el blau fort sobre blanc 9,21:1', () => {
    expect(contrast(MOSTRES[6], '#ff7300')).toBeCloseTo(7.12, 1);
    expect(contrast(MOSTRES[7], '#ffffff')).toBeCloseTo(9.21, 1);
    /* El cos (pedra-700) sobre l'app (pedra-150): 9,86 segons el bloc Bancal. */
    expect(contrast(MOSTRES[5], MOSTRES[4])).toBeCloseTo(9.86, 1);
  });

  test('luminància: blanc 1, negre 0, majúscules admeses', () => {
    expect(luminancia('#ffffff')).toBe(1);
    expect(luminancia('#000000')).toBe(0);
    expect(luminancia('#FFFFFF')).toBe(1);
  });

  test('fora del contracte (#fff curt, rgb(), buit, no cadena): null, i esHex6 fals', () => {
    for (const valor of ['#fff', 'rgb(0,0,0)', '', null, undefined, 123, '#ggggggg', '#12', 'ffffff']) {
      expect(esHex6(valor)).toBe(false);
      expect(luminancia(valor)).toBeNull();
      expect(contrast(valor, '#ffffff')).toBeNull();
      expect(contrast('#ffffff', valor)).toBeNull();
    }
    expect(esHex6('#ff7300')).toBe(true);
  });
});
