// @vitest-environment node
import { expect, test } from 'vitest';
import { comparadorDe, costDesplacamentDe } from './rebost.js';

test.each(['100', '100.0', '1e2', [], {}, null, true])('R32.4: el comparador no coacciona preus JSON (%j)', (preu) => {
    const llista = { elementsComu: [{ capaMode: {
      estat: 'falta', especificacio: '1 kg', unitatPreu: 'kg', preuPobleCents: preu, preuGranSuperficieCents: 100
    } }] };
    expect(comparadorDe(llista), JSON.stringify(preu)).toBeNull();
});

test('R32.4: la benzina arrodonix una sola vegada i no puja els valors inferiors a mig cèntim', () => {
  for (const [km, esperat] of [[8.199999999, 184], [8.2, 185], [8.200000001, 185]]) {
    expect(costDesplacamentDe({ km, consumL100km: 7.5, preuLitreCents: 150 })).toBe(esperat);
  }
  expect(costDesplacamentDe({ km: 0.249999999, consumL100km: 2, preuLitreCents: 50 })).toBe(0);
  expect(costDesplacamentDe({ km: 1e-7, consumL100km: 2, preuLitreCents: 50 })).toBe(0);
});
