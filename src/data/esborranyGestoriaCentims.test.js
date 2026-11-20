import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { resumGestoriaCentims, exportaGestoriaCentims, verificaEmpremtesGestoriaCentims, AVIS_GESTORIA_CENTIMS } from './esborranyGestoriaCentims.js';
const linia = (id, data, tipus, base, iva = 0, retencio = 0, concepte = '') => ({ id, data, tipus, baseCentims: base, ivaCentims: iva, retencioCentims: retencio, concepte });
const font = { any: 2026, operacions: [linia('a', '2026-01-01', 'ingres', '10000000000000000001', 21, 1), linia('b', '2026-04-01', 'despesa', 17, 2), linia('c', '2026-12-31', 'ingres', -100, -21, -1)] };
const sha = s => createHash('sha256').update(s).digest('hex');
describe('R32.16 esborrany exacte per a gestoria humana', () => {
  it('concilia cada línia, trimestre i anual amb imports > MAX_SAFE_INTEGER', () => {
    const r = resumGestoriaCentims(font);
    expect(r.total.ingressos).toEqual({ baseCentims: '9999999999999999901', ivaCentims: '0', retencioCentims: '0', totalCentims: '9999999999999999901' });
    expect(r.total.despeses.totalCentims).toBe('19');
    expect(r.total.saldo.totalCentims).toBe('9999999999999999882');
    expect(r.trimestres.map(t => t.operacions)).toEqual([1, 1, 0, 1]);
    expect(r.quadratura).toEqual({ sumaLiniesIgualTotal: true, sumaTrimestresIgualTotal: true });
    expect(r.verifactu).toBe(false); expect(r.avis).toBe(AVIS_GESTORIA_CENTIMS);
    expect(Object.isFrozen(r.detall[0])).toBe(true);
  });
  it('selecciona trimestre sense mesclar anys i valida també les files excloses', () => {
    const r = resumGestoriaCentims({ ...font, trimestre: 2, operacions: [...font.operacions, linia('altre', '2025-01-01', 'ingres', 20)] });
    expect(r.periode).toBe('2026-T2'); expect(r.operacions).toBe(1); expect(r.exclososForaPeriode).toBe(3);
    expect(r.total.saldo.totalCentims).toBe('-19');
    expect(() => resumGestoriaCentims({ ...font, trimestre: 2, operacions: [...font.operacions, linia('altre', '2025-02-30', 'ingres', 1)] })).toThrow();
  });
  it('CSV trimestral exporta una sola agregació; l’anual separa T1..T4 del total', () => {
    const trimestre = exportaGestoriaCentims({ ...font, trimestre: 2 });
    expect(trimestre.csv.match(/"resum"/g)).toHaveLength(3);
    expect(exportaGestoriaCentims(font).csv.match(/"resum"/g)).toHaveLength(15);
  });
  it('normalitza BigInt, enters segurs i cadenes al mateix export canònic', () => {
    const r = exportaGestoriaCentims(font), reversed = exportaGestoriaCentims({ ...font, operacions: [...font.operacions].reverse() });
    expect(reversed).toEqual(r);
    for (const camp of ['json', 'csv']) expect(r.empremtes[camp]).toBe(sha(r[camp]));
    expect(verificaEmpremtesGestoriaCentims(r)).toBe(true);
    for (const camp of ['json', 'csv']) expect(verificaEmpremtesGestoriaCentims({ ...r, [camp]: r[camp] + 'x' })).toBe(false);
    expect(JSON.parse(r.json)).toEqual(r.resum); expect(r.json.endsWith('\n')).toBe(true);
    const op = linia('x', '2026-01-01', 'ingres', 10);
    expect(exportaGestoriaCentims({ any: 2026, operacions: [op] })).toEqual(exportaGestoriaCentims({ any: 2026, operacions: [{ ...op, baseCentims: 10n, ivaCentims: '0', retencioCentims: 0n }] }));
  });
  it('CSV protegix fórmules textuals, cometes i separadors; manté cèntims negatius', () => {
    const r = exportaGestoriaCentims({ any: 2026, operacions: [linia('=CMD()', '2026-01-01', 'ingres', -10, 0, 0, ' =SUM(1;2)"')] });
    expect(r.csv).toContain('"\'=CMD()"'); expect(r.csv).toContain('"\' =SUM(1;2)"""'); expect(r.csv).toContain('"-10"');
    expect(r.csv).toContain('"false"'); expect(r.csv).toContain('No Verifactu');
  });
  it('rebutja mutants de coacció, precisió, signes, quadratura i dates', () => {
    const op = linia('x', '2026-01-01', 'ingres', 1);
    for (const v of [0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, -0, '-0', '01', '+1', '1e3', '0.1', {}, [], '9'.repeat(1000), 10n ** 31n]) {
      expect(() => resumGestoriaCentims({ any: 2026, operacions: [{ ...op, baseCentims: v }] })).toThrow();
    }
    for (const patch of [{ ivaCentims: -1 }, { retencioCentims: -1 }, { totalCentims: 999 }, { data: '2026-02-29' }, { data: '2026-01-01T00:00:00Z' }, { id: 'x\u202Ey' }, { tipus: 'transferencia' }, { concepte: { toString: () => 'x' } }]) expect(() => resumGestoriaCentims({ any: 2026, operacions: [{ ...op, ...patch }] })).toThrow();
    expect(() => resumGestoriaCentims({ any: 2026, operacions: [op, op] })).toThrow();
    for (const trimestre of [0, 5, '1', {}, NaN]) expect(() => resumGestoriaCentims({ any: 2026, trimestre, operacions: [] })).toThrow();
    expect(() => resumGestoriaCentims({ any: 2024, operacions: [{ ...op, data: '2024-02-29' }] })).not.toThrow();
  });
  it('cap getter, toJSON ni forat d’array s’executa per fer un resum', () => {
    let crides = 0;
    const op = linia('x', '2026-01-01', 'ingres', 1);
    Object.defineProperty(op, 'baseCentims', { get: () => { crides++; return 1; }, enumerable: true });
    expect(() => resumGestoriaCentims({ any: 2026, operacions: [op] })).toThrow(); expect(crides).toBe(0);
    expect(() => resumGestoriaCentims({ any: 2026, operacions: new Array(1) })).toThrow();
    expect(() => resumGestoriaCentims({ any: 2026, operacions: [Object.assign(linia('x', '2026-01-01', 'ingres', 1), { toJSON() { crides++; } })] })).toThrow(); expect(crides).toBe(0);
  });
  it('rebutja iteradors injectats abans d’executar-los', () => {
    let crides = 0;
    const ops = [];
    ops[Symbol.iterator] = function* () { crides++; yield linia('x', '2026-01-01', 'ingres', 999); };
    expect(() => resumGestoriaCentims({ any: 2026, operacions: ops })).toThrow();
    expect(crides).toBe(0);
  });
  it('propietats: 500 conjunts, permutacions i rectificacions exactes contra oracle BigInt', () => {
    let seed = 3216;
    const rand = max => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max; };
    for (let cas = 0; cas < 500; cas++) {
      const ops = [], oracle = { ingres: 0n, despesa: 0n };
      for (let i = 0; i < 25; i++) {
        const tipus = rand(2) ? 'ingres' : 'despesa', signe = rand(5) ? 1n : -1n;
        const base = signe * (BigInt(rand(1000000)) + 9007199254740990n), iva = signe * BigInt(rand(100)), ret = signe * BigInt(rand(10));
        ops.push(linia(String(i), `2026-${String(1 + rand(12)).padStart(2, '0')}-01`, tipus, base, iva, ret)); oracle[tipus] += base + iva - ret;
      }
      const original = ops.map(o => ({ ...o })), r = resumGestoriaCentims({ any: 2026, operacions: ops });
      expect(BigInt(r.total.ingressos.totalCentims)).toBe(oracle.ingres); expect(BigInt(r.total.despeses.totalCentims)).toBe(oracle.despesa);
      expect(BigInt(r.total.saldo.totalCentims)).toBe(oracle.ingres - oracle.despesa);
      expect(resumGestoriaCentims({ any: 2026, operacions: [...ops].reverse() })).toEqual(r); expect(ops).toEqual(original);
    }
  });
});
