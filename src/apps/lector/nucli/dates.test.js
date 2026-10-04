// @vitest-environment node
/* Lector de notícies · les dates (dates.js): sense rellotge ni fus del procés. */
import { describe, expect, test } from 'vitest';
import { civilDe, dataCurta, dataDeBoina, dataLlarga, diesDesDe1970, horaRelativa, isoDeMs, llegixData, msDeData } from './dates.js';

describe('llegixData', () => {
  test.each([
    ['Fri, 02 Oct 2026 09:30:00 +0200', '2026-10-02T07:30:00.000Z'],
    ['Thu, 1 Oct 2026 18:05 GMT', '2026-10-01T18:05:00.000Z'],
    ['02 Oct 26 09:30:00 EST', '2026-10-02T14:30:00.000Z'],
    ['2 Oct 1999 00:00:00 -0000', '1999-10-02T00:00:00.000Z'],
    ['Sat, 03 Oct 2026 23:59:60 Z', '2026-10-03T23:59:59.000Z'],
    ['dc., 30 set. 2026 12:00:00 +0200', '2026-09-30T10:00:00.000Z'],
    ['1 des 2026 08:00 CET', '2026-12-01T07:00:00.000Z'],
    ['15 ag. 2026 08:00 CEST', '2026-08-15T06:00:00.000Z'],
    ['3 Oct 2026', '2026-10-03T00:00:00.000Z'],
    ['2026-10-02T08:00:00+02:00', '2026-10-02T06:00:00.000Z'],
    ['2026-10-02T08:00:00.123456Z', '2026-10-02T08:00:00.123Z'],
    ['2026-10-02 08:00', '2026-10-02T08:00:00.000Z'],
    ['2026-10-02T08:00-0530', '2026-10-02T13:30:00.000Z'],
    ['2026-10-02', '2026-10-02T00:00:00.000Z'],
    ['2024-02-29T12:00:00Z', '2024-02-29T12:00:00.000Z']
  ])('%s → %s', (text, iso) => {
    expect(llegixData(text)).toBe(iso);
  });

  test.each([
    ['31 Feb 2026 10:00:00 GMT'], ['Sat, 03 Oct 26 25:61:00 +0200'], ['2025-02-29'], ['2026-13-01'], ['2026-10-02T08:00:00+25:00'],
    ['ahir a la vesprada'], [''], ['   '], ['3 Foo 2026'], ['1800-01-01'], [null], [12345], ['2026-10-02T08:00:00 Lluna']
  ])('%s → null', (text) => {
    expect(llegixData(text)).toBeNull();
  });
});

describe('aritmètica civil', () => {
  test('anada i tornada en dies, de 1900 a 2400, sense Date', () => {
    expect(diesDesDe1970(1970, 1, 1)).toBe(0);
    expect(diesDesDe1970(2000, 3, 1)).toBe(11017);
    for (const dies of [-25567, -1, 0, 59, 11016, 20729, 157000]) expect(diesDesDe1970(...civilDe(dies))).toBe(dies);
  });

  test('isoDeMs i msDeData', () => {
    expect(isoDeMs(0)).toBe('1970-01-01T00:00:00.000Z');
    expect(msDeData('2026-10-02T07:30:00.000Z')).toBe(1790926200000);
    expect(isoDeMs(1790926200000)).toBe('2026-10-02T07:30:00.000Z');
    expect(isoDeMs(Number.NaN)).toBeNull();
    expect(msDeData('no')).toBeNull();
  });
});

describe('en valencià', () => {
  const ara = msDeData('2026-10-03T10:00:00Z');
  const fa = (ms) => isoDeMs(ara - ms);

  test.each([
    [10 * 1000, 'ara mateix'],
    [-3 * 60 * 1000, 'ara mateix'],
    [5 * 60 * 1000, 'fa 5 min'],
    [59 * 60 * 1000, 'fa 59 min'],
    [2 * 3600 * 1000, 'fa 2 h'],
    [23 * 3600 * 1000 + 59 * 60 * 1000, 'fa 23 h'],
    [24 * 3600 * 1000, 'fa 1 dia'],
    [3 * 24 * 3600 * 1000, 'fa 3 dies']
  ])('fa %i ms: «%s»', (ms, text) => {
    expect(horaRelativa(fa(ms), ara)).toBe(text);
  });

  test('passada una setmana (o en el futur), la data; d’un altre any, amb l’any', () => {
    expect(horaRelativa('2026-09-20T12:00:00Z', ara, 120)).toBe('20 de setembre');
    expect(horaRelativa('2026-04-01T12:00:00Z', ara, 120)).toBe('1 d’abril');
    expect(horaRelativa('2025-10-03T12:00:00Z', ara, 120)).toBe('3 d’octubre de 2025');
    expect(horaRelativa('2026-10-10T12:00:00Z', ara, 120)).toBe('10 d’octubre');
    expect(horaRelativa(null, ara)).toBe('');
    expect(horaRelativa('2026-10-02T12:00:00Z', Number.NaN)).toBe('');
  });

  test('el dia i l’hora són els del fus de qui llig (el desfasament)', () => {
    expect(dataLlarga('2026-10-02T22:30:00Z', 120)).toBe('3 d’octubre de 2026, 00:30');
    expect(dataLlarga('2026-10-02T22:30:00Z', 0)).toBe('2 d’octubre de 2026, 22:30');
    expect(dataCurta('2026-12-31T23:30:00Z', msDeData('2027-01-10T00:00:00Z'), 60)).toBe('1 de gener');
    expect(dataLlarga('no')).toBe('');
  });

  /* Ordre del Mestre, 261004 · La pastilla de la boina: el format únic de l'aplicació (dd/mm/aa i hh:mm). */
  test('la data de la boina: hora i dia curt, al fus de qui llig; null si no és una data', () => {
    expect(dataDeBoina('2026-10-03T09:30:00.000Z', 120)).toEqual({ time: '11:30', date: '03/10/26' });
    expect(dataDeBoina('2026-10-02T22:30:00Z', 120)).toEqual({ time: '00:30', date: '03/10/26' });
    expect(dataDeBoina('Fri, 02 Oct 2026 22:30:00 GMT')).toEqual({ time: '22:30', date: '02/10/26' });
    expect(dataDeBoina('2031-01-05T08:05:00Z', 60)).toEqual({ time: '09:05', date: '05/01/31' });
    for (const dolent of ['no', '', null, '2026-02-31T10:00:00Z']) expect(dataDeBoina(dolent), String(dolent)).toBeNull();
  });
});
