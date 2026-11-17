// @vitest-environment node
import { expect, test } from 'vitest';
import { mitjaAmunt, sostre, suma } from './comu.js';
import { suggerimentsEfectiu } from './cobrament.js';
import { obriTorn, resumTorn } from './torn.js';

test('l’arrodoniment conserva exactament els enters segurs als dos extrems', () => {
  const maxim = Number.MAX_SAFE_INTEGER;
  expect(mitjaAmunt(maxim, 1)).toBe(maxim);
  expect(mitjaAmunt(-maxim, 1)).toBe(-maxim);
  expect(mitjaAmunt(maxim, 2)).toBe(4503599627370496);
  expect(mitjaAmunt(-maxim, 2)).toBe(-4503599627370496);
  expect(mitjaAmunt(maxim, maxim)).toBe(1);
  expect(Object.is(mitjaAmunt(-1, 3), 0)).toBe(true);
});

test('el sostre no fa una suma intermèdia insegura', () => {
  expect(sostre(Number.MAX_SAFE_INTEGER, 2)).toBe(4503599627370496);
  for (const args of [[1, 0], [-1, 2], [1.5, 2], [1, Number.NaN]]) {
    expect(() => sostre(...args)).toThrow(RangeError);
  }
});

test('les sumes de caixa són exactes i mai retornen un enter insegur', () => {
  const maxim = Number.MAX_SAFE_INTEGER;
  expect(suma([maxim, 2, -2], n => n)).toBe(maxim);
  expect(suma([-maxim, -2, 2], n => n)).toBe(-maxim);
  for (const imports of [[maxim, 1], [-maxim, -1], [0.5], [Number.NaN]]) {
    expect(() => suma(imports, n => n)).toThrow(expect.objectContaining({ codi: 'IMPORT' }));
  }
});

test('cap suggeriment ni resum de caixa anuncia imports insegurs', () => {
  const maxim = Number.MAX_SAFE_INTEGER;
  expect(suggerimentsEfectiu(maxim)).toEqual([maxim]);
  const torn = obriTorn({ id: 't-r32', fonsInicialCents: maxim, ara: '2026-11-16T00:00:00Z' });
  const entrada = { id: 'm1', tipus: 'entrada', importCents: 2 };
  const eixida = { id: 'm2', tipus: 'eixida', importCents: 2 };
  expect(resumTorn({ ...torn, moviments: [entrada, eixida] }).efectiuEsperatCents).toBe(maxim);
  expect(() => resumTorn({ ...torn, moviments: [entrada] })).toThrow(expect.objectContaining({ codi: 'IMPORT' }));
});
