// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { esCents, formatEuros, parseEuros } from './diners.js';

/* Intl separa la xifra i el símbol amb un espai dur: es compara en pla. */
const pla = (text) => text.replace(/[^\S\n\r\t ]/g, ' ');

describe('formatEuros', () => {
  test('cèntims → euros en ca-ES', () => {
    expect(pla(formatEuros(150))).toBe('1,50 €');
    expect(pla(formatEuros(5))).toBe('0,05 €');
    expect(pla(formatEuros(123456789))).toBe('1.234.567,89 €');
    expect(pla(formatEuros(-250))).toMatch(/^[-−]2,50 €$/);
  });

  test('zero és zero, també -0; sense símbol, només la xifra', () => {
    expect(pla(formatEuros(0))).toBe('0,00 €');
    expect(pla(formatEuros(-0))).toBe('0,00 €');
    expect(formatEuros(150, { simbol: false })).toBe('1,50');
  });

  test('un import desconegut és text buit', () => {
    for (const dolent of [1.5, Number.NaN, null, undefined, '150', 2 ** 53]) expect(formatEuros(dolent), String(dolent)).toBe('');
  });
});

describe('parseEuros', () => {
  test('el que tecleja una persona', () => {
    const casos = [
      ['12', 1200], ['12,5', 1250], ['12,50', 1250], [',5', 50], ['0,05', 5], ['007', 700],
      ['1.234,56', 123456], ['1 234,56', 123456], ['1.234.567', 123456700], ['1234,56', 123456],
      ['2.50', 250], ['2.5', 250], ['3 €', 300], ['€3', 300], ['EUR 3', 300], ['+3', 300],
      ['-3,00 €', -300], ['−3,00', -300], ['-0', 0]
    ];
    for (const [text, cents] of casos) expect(parseEuros(text), text).toBe(cents);
  });

  test('el dubte no s’endevina: torna null', () => {
    const dolents = ['', ' ', 'abc', '1,234.56', '12,345', '1.23.4', '12,', '1.2345', '3 $', '--3', '1e3', 12, null, '9'.repeat(16)];
    for (const text of dolents) expect(parseEuros(text), String(text)).toBeNull();
  });

  test('anada i tornada amb formatEuros, també amb els espais durs d’Intl', () => {
    for (const cents of [0, 1, 99, 100, 150, 99999, 100000, 123456789, -1, -123456]) {
      expect(parseEuros(formatEuros(cents)), String(cents)).toBe(cents);
      expect(parseEuros(formatEuros(cents, { simbol: false })), String(cents)).toBe(cents);
    }
  });

  test('esCents: només enters segurs', () => {
    expect(esCents(150)).toBe(true);
    expect(esCents(-150)).toBe(true);
    expect(esCents(1.5)).toBe(false);
    expect(esCents('150')).toBe(false);
  });
});
