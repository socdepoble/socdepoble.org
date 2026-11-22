import { describe, expect, test } from 'vitest';
import { formataPreuMercat } from './preuMercat.js';
import { propsDeTargetaDeProducte } from './targetaDeProducte.js';

describe('DOL-40 · preu canònic sense canviar el significat', () => {
  test.each([[15, '15,00\u00a0€'], ['15.00€', '15,00\u00a0€'], ['4,95 €', '4,95\u00a0€'],
    ['1.250,50 €', '1.250,50\u00a0€'], ['1,250.50 EUR', '1.250,50\u00a0€'], [0, '0,00\u00a0€'],
    ['-0.00€', '0,00\u00a0€'], ['-2.5 €', '-2,50\u00a0€']])('%j → %s', (entrada, esperat) => {
    expect(formataPreuMercat(entrada)).toBe(esperat);
  });
  test.each(['A convenir', '4,95 €/kg', '5–10 €', '1.234', '15.999€'])('conserva el text no inequívoc %s', text => {
    expect(formataPreuMercat(text)).toBe(text);
  });
  test.each([null, undefined, {}, NaN, Infinity])('un valor no textual invàlid no inventa preu %j', valor => {
    expect(formataPreuMercat(valor)).toBe('');
  });
  test('la targeta utilitza el formatador canònic i conserva l’import declarat', () => {
    const item = { id: 'oli', title: 'Oli', price: '8.30€' };
    expect(propsDeTargetaDeProducte(item).price).toBe('8,30\u00a0€');
  });
});
