// @vitest-environment node
import { expect, test } from 'vitest';
import { comparadorDe } from './rebost.js';
const element = (especificacio, poble = 100, gran = poble) => ({ capaMode: {
  estat: 'falta', especificacio, preuPobleCents: poble, preuGranSuperficieCents: gran, unitatPreu: 'kg'
} });

test('el comparador conserva la meitat de cèntim amb quantitats fraccionàries i conversions de grams', () => {
  for (const especificacio of ['0,145 kg', '145 g', '100 g + 45 g']) {
    expect(comparadorDe({ elementsComu: [element(especificacio)] })).toMatchObject({ pobleCents: 15, granCents: 15, totalGranCents: 15 });
  }
});

test('mai anuncia estalvis amb quantitats o productes que desborden els enters segurs', () => {
  for (const especificacio of ['999999999999999999999999 kg', '999999999999 kg']) {
    expect(comparadorDe({ elementsComu: [element(especificacio, 10_000_000)] })).toBeNull();
  }
  expect(comparadorDe({ elementsComu: [element('1 kg', Number.MAX_SAFE_INTEGER)] })).toBeNull();
  expect(comparadorDe({ elementsComu: [element('1 kg', -1)] })).toBeNull();
});

test('R32.2 · un preu en cadena (d’una fila aliena) no compta i mai tomba la targeta amb un SyntaxError de BigInt', () => {
  for (const preu of ['1e2', '1.0', '150', ' 150 ']) {
    expect(() => comparadorDe({ elementsComu: [element('1 kg', preu)] }), preu).not.toThrow();
    expect(comparadorDe({ elementsComu: [element('1 kg', preu)] }), preu).toBeNull();
    expect(comparadorDe({ elementsComu: [element('1 kg', 100, preu), element('0,145 kg')] }), preu)
      .toMatchObject({ articles: 1, sensePreu: 0, pobleCents: 15, granCents: 15 });
  }
});

test('una quantitat indeterminada es declara i no amaga la resta del comparador', () => {
  expect(comparadorDe({ elementsComu: [element('un poc'), element('0,145 kg')] })).toMatchObject({ articles: 1, sensePreu: 1, pobleCents: 15 });
});
