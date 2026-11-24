import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash, webcrypto } from 'node:crypto';
const root = path.resolve(process.env.SDP_CENTIMS_SOURCE_ROOT || process.cwd());
const source = p => import(pathToFileURL(path.join(root, p)).href);
const M = Number.MAX_SAFE_INTEGER, MAX = BigInt(M);
const date = { a: 2026, m: 1, d: 2 };
export const facturaCentims = (i, tipus, base, retencio = 0) => ({ id: String(i), num: String(i), contrapart: `Sintetica ${i}`, tipus, data: date, subtotal: base, iva: 0, retencio, total: base - (base < 0 ? -retencio : retencio) });
const audit = async facts => (await source('src/sections/gestoria/nucli/auditoriaPagaments.js')).auditaPagaments({ fulls: [{ any: 2026, t: 1, factures: facts }] });
// Independent quotient/remainder oracle: no production helper computes the expectation.
function rational(n, d, away) {
  const negative = n < 0n, abs = negative ? -n : n, q = abs / d, r = abs % d;
  const up = r * 2n > d || r * 2n === d && (!negative || away);
  return (negative ? -1n : 1n) * (q + (up ? 1n : 0n));
}
function generator() { let state = 3262; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state; }; }
export function registraInvariantsCentims(test, assert) {
  test('public payment summary marks an unrepresentable final result as unknown and incomplete', async () => {
    const a = await audit([facturaCentims(1, 'ingres', M), facturaCentims(2, 'despesa', -1)]), r = a.trimestres[0].resum;
    assert.equal(r.resultat, null); assert.equal(r.incomplet, true);
    const { informePagaments } = await source('src/sections/gestoria/nucli/auditoriaPagaments.js');
    assert.match(informePagaments(a).join('\n'), /rang|representar|precisi/);
  });
  test('public retention summary survives large cancellations and deterministic permutations', async () => {
    const ret = 1351079888211149, facts = Array.from({ length: 15 }, (_, i) => facturaCentims(i, 'ingres', i < 8 ? M : -M, ret)), rand = generator();
    for (let round = 0; round < 32; round++) {
      const list = [...facts]; if (round) for (let j = list.length - 1; j; j--) { const k = rand() % (j + 1); [list[j], list[k]] = [list[k], list[j]]; }
      const r = (await audit(list)).trimestres[0].resum;
      assert.equal(r.retencions, ret); assert.equal(r.ingressos.base, M);
    }
  });
  test('negative overflow and retention overflow never escape as unsafe DTO numbers', async () => {
    const a = (await audit([facturaCentims(1, 'ingres', -M), facturaCentims(2, 'despesa', 1)])).trimestres[0].resum;
    assert.equal(a.resultat, null); assert.equal(a.incomplet, true);
    const b = (await audit([facturaCentims(1, 'ingres', 1, M), facturaCentims(2, 'ingres', 1, M)])).trimestres[0].resum;
    assert.equal(b.retencions, null); assert.equal(b.incomplet, true);
  });
  test('public proportional payment avoids a one-cent error near a rational half', async () => {
    const { auditaPagaments } = await source('src/sections/gestoria/nucli/auditoriaPagaments.js');
    const a = { ...facturaCentims(1, 'ingres', 1000000000000), num: 'INV-A01' }, b = { ...facturaCentims(2, 'ingres', 1), num: 'INV-B02' };
    const movement = { dataOperacio: date, dataValor: date, centims: 500000000001, conceptes: [{ codi: '01', camps: ['INV-A01 INV-B02', ''] }] };
    const result = auditaPagaments({ fulls: [{ any: 2026, t: 1, factures: [a, b] }], moviments: [movement] });
    assert.equal(result.conciliacio.parelles[0].regla, 'R4');
    assert.equal(result.trimestres[0].resum.cobrat, 500000000001);
    // Same public R4 path across two quarters, with large exact full payments.
    for (const tipus of ['ingres', 'despesa']) {
      const x = { ...facturaCentims(1, tipus, 6059855885133111), num: 'INV-A01' };
      const y = { ...facturaCentims(2, tipus, 1473671684803940), num: 'INV-B02', data: { a: 2026, m: 4, d: 2 } };
      const bank = { ...movement, centims: (tipus === 'ingres' ? 1 : -1) * 7533527569937051 };
      const full = auditaPagaments({ fulls: [{ any: 2026, t: 1, factures: [x] }, { any: 2026, t: 2, factures: [y] }], moviments: [bank] });
      assert.equal(full.conciliacio.parelles[0].regla, 'R4');
      const key = tipus === 'ingres' ? 'cobrat' : 'pagat';
      assert.deepEqual(full.trimestres.map(q => q.resum[key]), [x.total, y.total]);
    }
  });
  test('public reconciliation does not publish an unsafe difference for an oversized cited invoice group', async () => {
    const { concilia } = await source('src/sections/gestoria/nucli/concilia.js');
    const facts = [{ ...facturaCentims(1, 'ingres', M - 1), num: 'INV-A01' }, { ...facturaCentims(2, 'ingres', M - 2), num: 'INV-B02' }];
    const movement = { dataOperacio: date, dataValor: date, centims: 1, conceptes: [{ codi: '01', camps: ['INV-A01 INV-B02', ''] }] };
    const result = concilia({ factures: facts, moviments: [movement] });
    assert.equal(result.parelles[0].regla, 'R4'); assert.equal(result.parelles[0].diferencia, null);
    assert.ok(result.incidencies.some(i => i.codi === 'IMPORT_DESCONEGUT'));
  });
  test('Bar multiplication/division agrees with independent rational oracle across signs and boundaries', async () => {
    const { proporcioMitjaAmunt } = await source('src/apps/bar/nucli/comu.js'), rand = generator();
    const values = [0, 1, -1, M, -M, M - 1, 4503599627370495];
    for (let i = 0; i < 500; i++) {
      const v = i < values.length ? values[i] : (rand() % 2 ? -1 : 1) * (M - rand());
      const f = [0, 1, 2, 3, 99, 100, 101, 10000, M][rand() % 9], d = [1, 2, 3, 100, 101, 10000, M][rand() % 7];
      const expected = rational(BigInt(v) * BigInt(f), BigInt(d), true);
      if (expected > MAX || expected < -MAX) assert.throws(() => proporcioMitjaAmunt(v, f, d), e => e.codi === 'IMPORT');
      else assert.equal(proporcioMitjaAmunt(v, f, d), Number(expected));
    }
  });
  test('Bar and Gestoria preserve their distinct negative tie policies', async () => {
    const bar = await source('src/apps/bar/nucli/comu.js'), g = await source('src/sections/gestoria/nucli/diners.js');
    for (let n = -101; n <= 101; n++) for (const d of [1, 2, 3, 5, 100]) {
      assert.equal(bar.mitjaAmunt(n, d), Number(rational(BigInt(n), BigInt(d), true)));
      assert.equal(g.arrodoneixFraccio(BigInt(n), BigInt(d)), Number(rational(BigInt(n), BigInt(d), false)));
    }
    assert.equal(bar.mitjaAmunt(-5, 2), -3); assert.equal(g.arrodoneixFraccio(-5n, 2n), -2);
  });
  test('both money sums retain intermediate cancellation while rejecting final overflow', async () => {
    const bar = await source('src/apps/bar/nucli/comu.js'), g = await source('src/sections/gestoria/nucli/diners.js');
    for (const values of [[M, 2, -2], [-M, -2, 2], [M, -M, 0], [M, M, -M]]) {
      const exact = Number(values.reduce((sum, v) => sum + BigInt(v), 0n));
      assert.equal(bar.suma(values, n => n), exact); assert.equal(g.sumaCentims(values), exact); assert.equal(g.sumaImports(values).total, exact);
    }
    for (const values of [[M, 1], [-M, -1]]) { assert.throws(() => bar.suma(values, n => n)); assert.throws(() => g.sumaCentims(values)); }
    assert.deepEqual(g.sumaImports([1, null, 2]), { total: 3, incomplet: true });
  });
  test('equal splits conserve every cent at the safe limit for all supported party counts', async () => {
    const { partsIguals } = await source('src/apps/bar/nucli/divisio.js');
    for (let n = 1; n <= 50; n++) for (let offset = 0; offset < 100; offset++) {
      const amount = M - offset, parts = partsIguals(amount, n);
      assert.equal(parts.reduce((sum, v) => sum + BigInt(v), 0n), BigInt(amount));
      assert.ok(parts.every(Number.isSafeInteger)); assert.ok(Math.max(...parts) - Math.min(...parts) <= 1);
    }
  });
  test('splitting discounted lines and successive refunds conserves the original amount', async () => {
    const { parteixLinia, totalLinia } = await source('src/apps/bar/nucli/linia.js'), { creaDevolucio } = await source('src/apps/bar/nucli/tiquet.js');
    for (let q = 2; q < 35; q++) {
      const line = { id: 'line', producteId: 'product', varianteId: 'default', categoriaId: 'cafe', nomCongelat: 'Sintetic', preuUnitariCents: 101, quantitat: q, ivaPercent: 10, estat: 'marxada', descompte: { tipus: 'percent', valor: 17, motiu: 'Sintetic' } };
      const [left, part] = parteixLinia(line, 1, 'split'); assert.equal(totalLinia(left) + totalLinia(part), totalLinia(line));
      const ticket = { id: 'ticket', tipus: 'venda', estat: 'tancada', origen: { tipus: 'barra' }, linies: [line] }, previous = [];
      for (let i = 0; i < q; i++) previous.push(creaDevolucio(ticket, [{ liniaId: 'line', quantitat: 1 }], { id: `refund-${i}`, tornId: 'torn', motiu: 'Sintetic', metode: 'efectiu', numero: i + 1, ara: '2026-11-24T00:00:00Z', devolucionsPrevies: previous }));
      assert.equal(previous.reduce((sum, t) => sum - BigInt(t.totals.totalCents), 0n), BigInt(totalLinia(line)));
    }
  });
  test('inclusive VAT base and quota conserve signed totals without changing any rate', async () => {
    const { desglossaIva } = await source('src/apps/bar/nucli/iva.js');
    for (const rate of [0, 4, 10, 21, 100]) for (const amount of [1, -1, 100, -101, M, -M]) {
      const [r] = desglossaIva([{ ivaPercent: rate, amount }], l => l.amount);
      const base = rational(BigInt(amount) * 100n, BigInt(100 + rate), true);
      assert.equal(r.baseCents, Number(base)); assert.equal(BigInt(r.baseCents) + BigInt(r.quotaCents), BigInt(amount));
    }
  });
  test('format and parser roundtrips preserve exact cents in bulk, with distinct decimal grammars', async () => {
    const u = await source('src/utils/diners.js'), g = await source('src/sections/gestoria/nucli/diners.js');
    for (let i = 0; i < 500; i++) for (const n of [M - i, -M + i, i, -i]) {
      assert.equal(u.parseEuros(u.formatEuros(n)), n || 0); assert.equal(g.parseImport(g.formatImport(n)), n || 0);
    }
    assert.equal(u.parseEuros('0,005'), null); assert.equal(g.parseImport('0,005'), 1); assert.equal(g.parseImport('-0,005'), -1);
    assert.equal(u.parseEuros('90.071.992.547.409,92'), null); assert.equal(g.parseImport('90.071.992.547.409,92'), null);
  });
  test('decimal scenario percentages use exact rationals and preserve the existing rounding policy', async () => {
    const { escalaCentims } = await source('src/sections/gestoria/nucli/diners.js');
    for (const [p, n, d] of [[0.1, 1n, 10n], [-12.5, -25n, 2n], [-100, -100n, 1n], [1e-7, 1n, 10000000n]]) for (const amount of [1, -1, 10001, -10001, M, -M]) {
      const expected = rational(BigInt(amount) * (100n * d + n), 100n * d, false);
      if (expected > MAX || expected < -MAX) assert.throws(() => escalaCentims(amount, p), e => e.codi === 'IMPORT_FORA_DE_RANG');
      else assert.equal(escalaCentims(amount, p), Number(expected));
    }
  });
  test('Mercat preserves long exact decimal text and leaves nonnumeric offers unchanged', async () => {
    const { formataPreuMercat } = await source('src/sections/mercat/preuMercat.js');
    assert.equal(formataPreuMercat('9007199254740991,99'), '9.007.199.254.740.991,99\u00a0€');
    for (const text of ['A convenir', '10-20 €/kg', '1,005', '9007199254740991.999']) assert.equal(formataPreuMercat(text), text);
    assert.equal(formataPreuMercat(0), '0,00\u00a0€');
  });
  test('demand stock uses decimal rational ceilings and rejects an unsafe final projection', async () => {
    const { calculaEstocSeguretat } = await source('src/data/inventari/reposicioAntiDobleComanda.js');
    const scale = 1000000n;
    for (let i = 1; i < 100; i++) {
      const input = { demandaDiaria: '0.1', terminiDies: '1.25', demandaMaximaDiaria: `${i}.2`, terminiMaximDies: '2.5' };
      const numerator = (BigInt(i) * scale + 200000n) * 2500000n - 100000n * 1250000n, d = scale * scale;
      assert.equal(calculaEstocSeguretat(input), Number(numerator / d + (numerator % d ? 1n : 0n)));
    }
    assert.throws(() => calculaEstocSeguretat({ demandaDiaria: 0, terminiDies: 0, demandaMaximaDiaria: M, terminiMaximDies: 2 }), RangeError);
  });
  test('fiscal decimal serialization and SHA detect a one-cent change with an independent hash oracle', async () => {
    const { importAEAT, calculaEmpremta } = await source('src/sections/gestoria/facturacio/registre/empremta.js');
    for (const n of [0, -1, 1, 99999999999999, -99999999999999]) {
      const b = BigInt(n), abs = b < 0n ? -b : b, expected = `${b < 0n ? '-' : ''}${abs / 100n}.${String(abs % 100n).padStart(2, '0')}`;
      assert.equal(importAEAT(n), expected);
    }
    const a = `ImporteTotal=${importAEAT(12345)}&Huella=`, b = `ImporteTotal=${importAEAT(12346)}&Huella=`;
    const hash = createHash('sha256').update(a, 'utf8').digest('hex').toUpperCase();
    assert.equal(await calculaEmpremta(a, webcrypto.subtle), hash); assert.notEqual(await calculaEmpremta(b, webcrypto.subtle), hash);
    assert.throws(() => importAEAT(100000000000000), RangeError);
  });
}
