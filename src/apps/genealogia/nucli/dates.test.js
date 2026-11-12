// @vitest-environment node
/* Arbre Genealògic · les 4 precisions de data, la seua lectura i escriptura,
   l'interval de cada una i la comparació entre dates de precisions diferents. */
import { describe, expect, test } from 'vitest';
import { comparaDates, dataDesconeguda, escriuData, etiquetaData, intervalAny, llegeixData, netejaData, relacioDates } from './dates.js';

const ANY = 2026;
const llig = (t) => llegeixData(t, { anyActual: ANY });

describe('llegeixData', () => {
  test('les 4 precisions', () => {
    expect(llig('1908').data).toEqual({ precisio: 'exacta', any: 1908, mes: null, dia: null });
    expect(llig('1908-03').data).toEqual({ precisio: 'exacta', any: 1908, mes: 3, dia: null });
    expect(llig('1908-03-12').data).toEqual({ precisio: 'exacta', any: 1908, mes: 3, dia: 12 });
    expect(llig('~1908').data).toEqual({ precisio: 'aproximada', any: 1908, mes: null, dia: null });
    expect(llig('1908?').data).toEqual({ precisio: 'estimada', any: 1908, mes: null, dia: null });
    expect(llig('1930s').data).toEqual({ precisio: 'aproximada', any: 1935, mes: null, dia: null });
    expect(llig('').data).toEqual(dataDesconeguda());
    expect(llig('?').data).toEqual(dataDesconeguda());
    expect(llig(null).ok).toBe(true);
    expect(llig(' 1908 ').data.any).toBe(1908);
  });

  test('formats i rangs no vàlids', () => {
    expect(llig('1908-13')).toMatchObject({ ok: false, error: 'rang' });
    expect(llig('1900-02-29')).toMatchObject({ ok: false, error: 'rang' });
    expect(llig('2000-02-29').ok).toBe(true);
    expect(llig('1908-04-31')).toMatchObject({ ok: false, error: 'rang' });
    expect(llig('999')).toMatchObject({ ok: false, error: 'format' });
    expect(llig('0999')).toMatchObject({ ok: false, error: 'rang' });
    expect(llig('2028')).toMatchObject({ ok: false, error: 'rang' });
    expect(llig('2027').ok).toBe(true);
    expect(llig('1935s')).toMatchObject({ ok: false, error: 'format' });
    expect(llig('~~1908')).toMatchObject({ ok: false, error: 'format' });
    expect(llig('12/03/1908')).toMatchObject({ ok: false, error: 'format' });
    expect(llig({ any: 1908 })).toMatchObject({ ok: false, error: 'format' });
    expect(() => llegeixData('1908')).toThrow(TypeError);
  });

  test('una entrada llarga i maliciosa es rebutja de seguida (sense backtracking)', () => {
    const inici = Date.now();
    expect(llig(`${'1'.repeat(50000)}?`).ok).toBe(false);
    expect(Date.now() - inici).toBeLessThan(200);
  });
});

describe('escriuData i netejaData', () => {
  test('escriuData és la inversa de llegeixData', () => {
    for (const t of ['1908', '1908-03', '1908-03-12', '~1908', '1908?', '']) expect(escriuData(llig(t).data)).toBe(t);
    expect(escriuData(llig('1930s').data)).toBe('~1935');
  });

  test('netejaData accepta DataGen o text i llança si no val', () => {
    expect(netejaData({ precisio: 'exacta', any: '1908', mes: 3, dia: null }, { anyActual: ANY })).toEqual({ precisio: 'exacta', any: 1908, mes: 3, dia: null });
    expect(netejaData('~1908', { anyActual: ANY }).precisio).toBe('aproximada');
    expect(netejaData(undefined, { anyActual: ANY })).toEqual(dataDesconeguda());
    expect(netejaData({ precisio: 'desconeguda', any: 1908 }, { anyActual: ANY })).toEqual(dataDesconeguda());
    expect(() => netejaData({ precisio: 'aproximada', any: 1908, mes: 3 }, { anyActual: ANY })).toThrow(TypeError);
    expect(() => netejaData({ precisio: 'exacta', any: 1908, dia: 3 }, { anyActual: ANY })).toThrow(TypeError);
    expect(() => netejaData({ precisio: 'segura', any: 1908 }, { anyActual: ANY })).toThrow(TypeError);
    expect(() => netejaData('ahir', { anyActual: ANY })).toThrow(TypeError);
    expect(() => netejaData({ precisio: 'exacta', any: 1908, mes: 2, dia: 30 }, { anyActual: ANY })).toThrow(TypeError);
  });
});

describe('intervals i comparació entre precisions', () => {
  test('exacta ±0, aproximada ±5, estimada ±10, desconeguda null', () => {
    expect(intervalAny(llig('1908').data)).toEqual({ min: 1908, max: 1908 });
    expect(intervalAny(llig('~1908').data)).toEqual({ min: 1903, max: 1913 });
    expect(intervalAny(llig('1908?').data)).toEqual({ min: 1898, max: 1918 });
    expect(intervalAny(llig('1930s').data)).toEqual({ min: 1930, max: 1940 });
    expect(intervalAny(dataDesconeguda())).toBeNull();
    expect(intervalAny(null)).toBeNull();
  });

  test('relacioDates només ordena el que és segur', () => {
    expect(relacioDates(llig('1900').data, llig('1910').data)).toBe('abans');
    expect(relacioDates(llig('1910').data, llig('1900').data)).toBe('despres');
    expect(relacioDates(llig('~1908').data, llig('1910').data)).toBe('solapa');
    expect(relacioDates(llig('1908?').data, llig('1919').data)).toBe('abans');
    expect(relacioDates(llig('1908?').data, llig('1918').data)).toBe('solapa');
    expect(relacioDates(llig('~1908').data, llig('1908?').data)).toBe('solapa');
    expect(relacioDates(dataDesconeguda(), llig('1908').data)).toBeNull();
  });

  test('comparaDates ordena per any, després per precisió, i les desconegudes al final', () => {
    const dates = ['1908?', '', '1900', '~1908', '1908'].map((t) => llig(t).data);
    expect(dates.sort(comparaDates).map(escriuData)).toEqual(['1900', '1908', '~1908', '1908?', '']);
  });

  test('etiquetaData', () => {
    expect(etiquetaData(llig('1908').data)).toBe('1908');
    expect(etiquetaData(llig('~1908').data)).toBe('~1908');
    expect(etiquetaData(llig('1908?').data)).toBe('1908?');
    expect(etiquetaData(llig('1908-03-12').data, 'ca')).toBe('12/03/1908');
    expect(etiquetaData(llig('1908-03-12').data, 'eu')).toBe('1908/03/12');
    expect(etiquetaData(llig('1908-03').data, 'es')).toBe('03/1908');
    expect(etiquetaData(dataDesconeguda())).toBe('');
  });
});
