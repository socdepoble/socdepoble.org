// @vitest-environment node
import { describe, expect, test } from 'vitest';
import {
  CONTROL, arrodoneix, congela, copiaCongelada, errorAmbCodi, esDataIso, esReferenciaOpaca, sumaDies, textNet, textValid
} from './comu.js';

describe('arrodoneix: la meitat lluny de zero, amb enters', () => {
  test.each([
    [1500, 1000, 2], [1499, 1000, 1], [2500, 1000, 3], [-1500, 1000, -2], [-1499, 1000, -1],
    [0, 1000, 0], [-1, 1000, 0], [2097900, 10000, 210], [1260, 10000, 0], [12600, 10000, 1]
  ])('%i / %i → %i', (numerador, denominador, esperat) => {
    expect(arrodoneix(numerador, denominador)).toBe(esperat);
  });

  test('mai torna −0', () => {
    expect(Object.is(arrodoneix(-1, 1000), 0)).toBe(true);
  });

  test('exacte prop del límit dels enters segurs', () => {
    // 2^51 − 1 dividit per 3 (el doble més el denominador encara és un enter segur).
    const n = 2 ** 51 - 1;
    expect(arrodoneix(n, 3)).toBe((n - (n % 3)) / 3 + (n % 3 >= 2 ? 1 : 0));
    expect(() => arrodoneix(2 ** 53, 3)).toThrow(RangeError);
    expect(() => arrodoneix(Number.MAX_SAFE_INTEGER, 1)).toThrow(/massa gran/);
  });

  test('refusa el que no són enters ni un denominador positiu', () => {
    for (const [a, b] of [[1.5, 10], [10, 0], [10, -1], ['10', 1]]) expect(() => arrodoneix(a, b)).toThrow(RangeError);
  });
});

describe('congelar i copiar', () => {
  test('congela en profunditat', () => {
    const valor = congela({ a: { b: [{ c: 1 }] } });
    expect(Object.isFrozen(valor.a.b[0])).toBe(true);
  });

  test('la còpia congelada no comparteix res amb l’original i perd els undefined', () => {
    const original = { a: { b: 1 }, buit: undefined };
    const copia = copiaCongelada(original);
    original.a.b = 2;
    expect(copia).toEqual({ a: { b: 1 } });
    expect('buit' in copia).toBe(false);
    expect(Object.isFrozen(copia.a)).toBe(true);
  });
});

describe('les petites peces', () => {
  test('errorAmbCodi porta el codi i, si n’hi ha, els detalls', () => {
    expect(errorAmbCodi('X', 'missatge')).toMatchObject({ codi: 'X', message: 'missatge' });
    expect('detalls' in errorAmbCodi('X', 'missatge')).toBe(false);
    expect(errorAmbCodi('X', 'missatge', ['a']).detalls).toEqual(['a']);
  });

  test('esDataIso: aaaa-mm-dd i que existisca', () => {
    expect(esDataIso('2028-02-29')).toBe(true);
    for (const dolenta of ['2027-02-29', '2026-13-01', '2026-1-01', '01-01-2026', 20260101, null]) expect(esDataIso(dolenta)).toBe(false);
  });

  test('textNet i CONTROL', () => {
    expect(textNet('  a  ')).toBe('a');
    expect(textNet(3)).toBe('');
    expect(CONTROL.test('a\nb')).toBe(true);
    expect(CONTROL.test('a b')).toBe(false);
  });

  test('textValid: obligatori, d’una línia i amb màxim', () => {
    expect(textValid('  Forn  ', 10)).toBe('Forn');
    for (const dolent of ['', '   ', 'a\nb', 'massa llarg', 3, null]) expect(textValid(dolent, 10), String(dolent)).toBeNull();
  });

  test('sumaDies: el calendari de veres (mesos, anys i bixests)', () => {
    expect(sumaDies('2026-10-04', 90)).toBe('2027-01-02');
    expect(sumaDies('2028-02-28', 1)).toBe('2028-02-29');
    expect(sumaDies('2027-02-28', 1)).toBe('2027-03-01');
    expect(sumaDies('2026-01-01', -1)).toBe('2025-12-31');
    expect(() => sumaDies('2026-02-30', 1)).toThrow(RangeError);
    expect(() => sumaDies('2026-01-01', 1.5)).toThrow(RangeError);
  });

  test('esReferenciaOpaca: una referència a la configuració, mai el valor que referencia', () => {
    for (const bona of ['compte-principal', 'domicili-2', 'logo', 'c1']) expect(esReferenciaOpaca(bona), bona).toBe(true);
    // Formes de número de compte compostes a trossos: cap literal.
    const forma = ['es', '00', '1234', '5678', '9012', '3456'].join('');
    for (const dolenta of [forma, forma.toUpperCase(), 'compte-12345678', 'Compte', 'compte principal', '-compte', 'compte-', '', null]) {
      expect(esReferenciaOpaca(dolenta), String(dolenta)).toBe(false);
    }
  });
});
