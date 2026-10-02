// @vitest-environment node
/* Gestoria · nucli · diners: imports en cèntims, heurística dels separadors
   i format espanyol del full per a la gestoria. */
import { describe, expect, test } from 'vitest';
import { formatImport, parseImport, sumaImports } from './diners.js';

/* Els espais no separables (el normal i l'estret) es fan des del punt de codi: cap caràcter invisible literal al fitxer. */
const NBSP = String.fromCharCode(0xa0);
const NNBSP = String.fromCharCode(0x202f);

describe('parseImport', () => {
  test.each([
    ['1.234,56 €', 123456],
    ['1,234.56', 123456],
    ['143,04', 14304],
    ['-106,32', -10632],
    ['−106,32', -10632],
    ['(12,00)', -1200],
    ['( 12,00 € )', -1200],
    ['12.5', 1250],
    ['€ 12,00', 1200],
    ['€12,00', 1200],
    ['EUR 12,00', 1200],
    ['12,00 EUR', 1200],
    ['12,00 eur', 1200],
    [`12,00${NBSP}€`, 1200],
    [`1${NNBSP}234,56${NBSP}€`, 123456],
    ['1 234 567,89 €', 123456789],
    ['1.234.567', 123456700],
    ['1,234,567', 123456700],
    ['1.234.567,89', 123456789],
    ['1,234,567.89', 123456789],
    ['+12,00', 1200],
    ['-€12,00', -1200],
    ['€ -12,00', -1200],
    ['- 12,00 €', -1200],
    ['  7  ', 700],
    ['0', 0],
    ['007,50', 750],
    [',50', 50],
    ['.5', 50],
    ['1,5', 150],
    ['1,05', 105]
  ])('«%s» → %i cèntims', (text, cents) => {
    expect(parseImport(text)).toBe(cents);
  });

  test('un sol separador amb tres xifres darrere és de milers', () => {
    expect(parseImport('12.345')).toBe(1234500);
    expect(parseImport('12,345')).toBe(1234500);
    expect(parseImport('1,005')).toBe(100500);
    expect(parseImport('-1.000 €')).toBe(-100000);
  });

  test('excepte si la part entera és zero: llavors és decimal i s’arredonix', () => {
    expect(parseImport('0,125')).toBe(13);
    expect(parseImport('0,124')).toBe(12);
    expect(parseImport('0.999')).toBe(100);
  });

  test('més de dos decimals: arredoniment a la meitat lluny de zero, sense coma flotant', () => {
    expect(parseImport('1234,567')).toBe(123457);
    expect(parseImport('12,3456')).toBe(1235);
    expect(parseImport('12,3449')).toBe(1234);
    expect(parseImport('-0,005')).toBe(-1);
    expect(parseImport('1.234,565')).toBe(123457);
    expect(parseImport('0,10')).toBe(10);
    expect(parseImport('0,29')).toBe(29);
  });

  test('el zero negatiu no existix', () => {
    expect(Object.is(parseImport('-0,00'), 0)).toBe(true);
    expect(Object.is(parseImport('(0,00)'), 0)).toBe(true);
  });

  test.each([
    '', '   ', 'abc', '12,34,56', '1.23,45', '1,234.567.89', '12,', '1.234.', '12 €€', '$12', 'USD 12', '12 USD',
    '1e5', '--12', '+-12', '12-', '(12', '12)', '1 23,45', '12,5 6', '€', '-', ',', '.', '99999999999999999999', 'NaN'
  ])('«%s» no és un import: null', (text) => {
    expect(parseImport(text)).toBeNull();
  });

  test('només llig text: números, null i objectes tornen null', () => {
    expect(parseImport(12)).toBeNull();
    expect(parseImport(null)).toBeNull();
    expect(parseImport(undefined)).toBeNull();
    expect(parseImport({})).toBeNull();
  });

  test('el límit de cèntims segurs', () => {
    expect(parseImport('9999999999999')).toBe(999999999999900);
    expect(parseImport('99999999999999')).toBeNull();
    expect(parseImport('0000000000000000012')).toBe(1200);
  });
});

describe('formatImport', () => {
  test.each([
    [123456, '1.234,56 €'],
    [-123456, '-1.234,56 €'],
    [0, '0,00 €'],
    [5, '0,05 €'],
    [-5, '-0,05 €'],
    [100, '1,00 €'],
    [25926, '259,26 €'],
    [149382, '1.493,82 €'],
    [100000000, '1.000.000,00 €'],
    [99999999999, '999.999.999,99 €']
  ])('%i → «%s»', (cents, text) => {
    expect(formatImport(cents)).toBe(text);
  });

  test('sense símbol', () => {
    expect(formatImport(123456, { simbol: false })).toBe('1.234,56');
    expect(formatImport(-1200, { simbol: false })).toBe('-12,00');
  });

  test('import desconegut: cadena buida', () => {
    for (const valor of [null, undefined, 1.5, Number.NaN, Infinity, '1200', 2 ** 60]) expect(formatImport(valor)).toBe('');
  });

  test('anada i tornada amb parseImport', () => {
    const valors = [0, 1, 9, 10, 99, 100, 101, 999, 1000, 99999, 100000, 123456789, -1, -100, -123456789, 4503599627370495];
    for (const cents of valors) {
      expect(parseImport(formatImport(cents))).toBe(cents);
      expect(parseImport(formatImport(cents, { simbol: false }))).toBe(cents);
    }
  });
});

describe('sumaImports', () => {
  test('suma els coneguts i avisa dels desconeguts', () => {
    expect(sumaImports([100, null, 250])).toEqual({ total: 350, incomplet: true });
    expect(sumaImports([100, 250, -50])).toEqual({ total: 300, incomplet: false });
    expect(sumaImports([1.5, 2])).toEqual({ total: 2, incomplet: true });
    expect(sumaImports([undefined])).toEqual({ total: 0, incomplet: true });
  });

  test('llista buida o absent', () => {
    expect(sumaImports([])).toEqual({ total: 0, incomplet: false });
    expect(sumaImports(null)).toEqual({ total: 0, incomplet: false });
  });
});
