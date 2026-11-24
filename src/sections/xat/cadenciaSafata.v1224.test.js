/* v1.2.24 (IDEA-339) · Espaiat del sondeig de la safata quan la llista no canvia. */
import { describe, expect, test } from 'vitest';
import { esperaDeLaLlista, esperaDeLaLlistaQuieta } from './XatContext.jsx';

describe('esperaDeLaLlistaQuieta', () => {
  test('les tres primeres voltes iguals continuen als 25 s', () => {
    expect([0, 1, 2].map(esperaDeLaLlistaQuieta)).toEqual([25000, 25000, 25000]);
  });
  test('després 40 s i, a partir de la sisena, el sostre de 60 s', () => {
    expect([3, 4, 5].map(esperaDeLaLlistaQuieta)).toEqual([40000, 40000, 40000]);
    expect([6, 50, 10_000].map(esperaDeLaLlistaQuieta)).toEqual([60000, 60000, 60000]);
  });
  test('una entrada estranya és com cap volta quieta', () => {
    expect([-1, 1.5, NaN, undefined, null, '7'].map(esperaDeLaLlistaQuieta)).toEqual(Array(6).fill(25000));
  });
  test('mai no supera el sostre de les fallades reintentables', () => {
    expect(esperaDeLaLlistaQuieta(99)).toBeLessThanOrEqual(esperaDeLaLlista(99, true));
  });
});
