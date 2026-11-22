// @vitest-environment node
import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaEsdeveniment, indexaMes, instantEnLaZona, ocorreElDia, ocurrenciesEnRang } from './esdeveniment.js';
import { esActePassat } from '../sections/calendari/actePassat.js';
import { mesDeLActeMesProper } from '../sections/mur/agendaMur.js';

const repetit = (inici, regla) => creaEsdeveniment({ id: 'mercat', titol: 'Mercat', inici: { dataHora: inici, zona: 'Europe/Madrid' }, recurrencia: [regla] });
afterEach(() => vi.unstubAllEnvs());

describe.each(['Europe/Madrid', 'Atlantic/Canary', 'UTC', 'America/New_York'])('UNTIL UTC inclusiu des de %s', zona => {
  test('00:30 Madrid del dia 21 és 23:30Z del dia 20 i entra exactament una vegada', () => {
    vi.stubEnv('TZ', zona);
    const event = repetit('2026-11-07T00:30', 'RRULE:FREQ=WEEKLY;UNTIL=20261120T233000Z');
    expect(ocorreElDia(event, 2026, 10, 21)).toBe(true);
    expect(ocorreElDia(event, 2026, 10, 28)).toBe(false);
    const { ocurrencies } = ocurrenciesEnRang(event, new Date(2026, 10, 21), new Date(2026, 10, 22));
    expect(ocurrencies.map(o => o.diaInici)).toEqual(['2026-11-21']);
    expect(esActePassat({ acte: event }, Date.UTC(2026, 10, 21, 22, 59))).toBe(false);
    expect(esActePassat({ acte: event }, Date.UTC(2026, 10, 21, 23))).toBe(true);
  });
  test('un segon abans exclou l’última ocurrència; el canvi d’hora usa el desfasament del seu dia', () => {
    vi.stubEnv('TZ', zona);
    expect(ocorreElDia(repetit('2026-11-07T00:30', 'RRULE:FREQ=WEEKLY;UNTIL=20261120T232959Z'), 2026, 10, 21)).toBe(false);
    const primavera = repetit('2026-03-22T09:00', 'RRULE:FREQ=WEEKLY;UNTIL=20260329T070000Z');
    expect(ocorreElDia(primavera, 2026, 2, 29)).toBe(true);
    expect(ocorreElDia(repetit('2026-03-22T09:00', 'RRULE:FREQ=WEEKLY;UNTIL=20260329T065959Z'), 2026, 2, 29)).toBe(false);
  });
  test('BYHOUR no deixa passar hores posteriors al límit del mateix dia', () => {
    vi.stubEnv('TZ', zona);
    const event = repetit('2026-11-20T09:00', 'RRULE:FREQ=DAILY;BYHOUR=9,18;UNTIL=20261121T080000Z');
    const { ocurrencies } = ocurrenciesEnRang(event, new Date(2026, 10, 21), new Date(2026, 10, 22));
    expect(ocurrencies).toHaveLength(1);
  });
});

/* v1.2.20 · Gauntlet R1 (L3-03) · A l'hora repetida de la tardor (25-10-2026, de 03:00 CEST a 02:00
   CET), les 02:30 de Madrid són primer les 00:30Z i després les 01:30Z: l'RFC 5545 (§3.3.5) mana la
   primera, i un UNTIL dins d'eixa hora no pot fer perdre l'última ocurrència. */
test('L3-03 · instantEnLaZona tria la primera aparició de l’hora repetida i no toca la de primavera', () => {
  const a = (dataHora, zona = 'Europe/Madrid') => instantEnLaZona({ dataHora, zona });
  expect(a('2026-10-25T02:30')).toBe(Date.UTC(2026, 9, 25, 0, 30));
  expect(a('2026-10-25T02:00')).toBe(Date.UTC(2026, 9, 25, 0, 0));
  expect(a('2026-10-25T02:59')).toBe(Date.UTC(2026, 9, 25, 0, 59));
  expect(a('2026-10-25T01:59')).toBe(Date.UTC(2026, 9, 24, 23, 59));
  expect(a('2026-10-25T03:00')).toBe(Date.UTC(2026, 9, 25, 2, 0));
  expect(a('2026-10-25T12:00')).toBe(Date.UTC(2026, 9, 25, 11, 0));
  expect(a('2026-03-29T02:30')).toBe(Date.UTC(2026, 2, 29, 1, 30));
  expect(a('2026-03-29T03:30')).toBe(Date.UTC(2026, 2, 29, 1, 30));
  expect(a('2026-11-01T01:30', 'America/New_York')).toBe(Date.UTC(2026, 10, 1, 5, 30));
});

describe.each(['Europe/Madrid', 'Atlantic/Canary', 'UTC', 'America/New_York'])('L3-03 · UNTIL dins de l’hora repetida de la tardor des de %s', zona => {
  test('l’ocurrència de les 02:30 del diumenge del canvi entra amb un UNTIL des de la primera aparició', () => {
    vi.stubEnv('TZ', zona);
    for (const until of ['20261025T003000Z', '20261025T010000Z', '20261025T012959Z']) {
      const acte = repetit('2026-10-18T02:30', `RRULE:FREQ=WEEKLY;UNTIL=${until}`);
      expect(ocorreElDia(acte, 2026, 9, 25)).toBe(true);
      const { ocurrencies } = ocurrenciesEnRang(acte, new Date(2026, 9, 18), new Date(2026, 9, 26));
      expect(ocurrencies.map(o => o.diaInici)).toEqual(['2026-10-18', '2026-10-25']);
    }
    expect(ocorreElDia(repetit('2026-10-18T02:30', 'RRULE:FREQ=WEEKLY;UNTIL=20261025T002959Z'), 2026, 9, 25)).toBe(false);
  });
});

test('L3-03 · a Madrid, comparar i pintar fan servir el mateix instant (00:30Z)', () => {
  vi.stubEnv('TZ', 'Europe/Madrid');
  const acte = repetit('2026-10-18T02:30', 'RRULE:FREQ=WEEKLY;UNTIL=20261025T003000Z');
  const { ocurrencies } = ocurrenciesEnRang(acte, new Date(2026, 9, 18), new Date(2026, 9, 26));
  expect(ocurrencies.map(o => o.inici)).toEqual([Date.UTC(2026, 9, 18, 0, 30), Date.UTC(2026, 9, 25, 0, 30)]);
});

/* v1.2.20 · Gauntlet R1 (L3-04) · La xarxa de passos (HOURLY, MINUTELY o SECONDLY) encara fa
   l'hora de paret amb el fus de qui mira: fora de Madrid, el quadre «Assistiràs?» no pot
   desaparéixer abans de l'última ocurrència, ni dies abans de començar a l'oest. */
describe.each(['Europe/Madrid', 'Atlantic/Canary', 'UTC', 'America/New_York', 'America/Los_Angeles'])('L3-04 · xarxa de passos amb UNTIL UTC des de %s', zona => {
  test('HOURLY: no és passat abans de l’última ocurrència (01:30 de Madrid, 00:30Z)', () => {
    vi.stubEnv('TZ', zona);
    const acte = repetit('2026-12-05T23:30', 'RRULE:FREQ=HOURLY;INTERVAL=2;UNTIL=20261206T003000Z');
    for (const ara of [Date.UTC(2026, 11, 5, 22), Date.UTC(2026, 11, 6, 0), Date.UTC(2026, 11, 6, 0, 29)]) {
      expect(esActePassat({ acte }, ara)).toBe(false);
    }
    expect(esActePassat({ acte }, Date.UTC(2026, 11, 20))).toBe(true);
  });
  test('HOURLY i MINUTELY de dia: mai passats dies abans de començar', () => {
    vi.stubEnv('TZ', zona);
    for (const regla of ['RRULE:FREQ=HOURLY;UNTIL=20261205T150000Z', 'RRULE:FREQ=MINUTELY;INTERVAL=30;UNTIL=20261205T150000Z']) {
      const acte = repetit('2026-12-05T10:00', regla);
      expect(esActePassat({ acte }, Date.UTC(2026, 11, 1))).toBe(false);
      expect(esActePassat({ acte }, Date.UTC(2026, 11, 5, 14, 59))).toBe(false);
      expect(esActePassat({ acte }, Date.UTC(2026, 11, 20))).toBe(true);
    }
  });
});

/* v1.2.20 · Gauntlet R1 (L3-02) · El límit UTC no construïx cap Intl.DateTimeFormat a cada dia ni a
   cada minut, i només els dies del voltant de l'UNTIL fan formatToParts. Es compten les crides, no el
   temps: un pressupost en ms no és estable en una màquina carregada (els temps, a l'informe). */
test('L3-02 · el Calendari no paga Intl a cada dia amb actes repetits amb UNTIL', () => {
  vi.stubEnv('TZ', 'Europe/Madrid');
  const acte = (i, regla) => creaEsdeveniment({ id: `a${i}`, titol: 'Acte', recurrencia: [regla],
    inici: { dataHora: '2026-01-05T19:00', zona: 'Europe/Madrid' }, fi: { dataHora: '2026-01-05T20:00', zona: 'Europe/Madrid' } });
  const acabats = Array.from({ length: 15 }, (_, i) => acte(i, 'RRULE:FREQ=DAILY;UNTIL=20260630T170000Z'));
  const vius = Array.from({ length: 15 }, (_, i) => acte(i, 'RRULE:FREQ=DAILY;BYHOUR=9,12,18;UNTIL=20271231T170000Z'));
  const Original = Intl.DateTimeFormat;
  let construits = 0;
  const parts = vi.spyOn(Original.prototype, 'formatToParts');
  Intl.DateTimeFormat = new Proxy(Original, { construct(objectiu, arguments_, nou) { construits += 1; return Reflect.construct(objectiu, arguments_, nou); } });
  try {
    expect(mesDeLActeMesProper(acabats, new Date(2026, 10, 22))).toBeNull();
    expect(indexaMes(vius, 2026, 10).size).toBe(30);
    for (const esd of vius) expect(ocurrenciesEnRang(esd, new Date(2026, 9, 26), new Date(2026, 11, 7)).ocurrencies).toHaveLength(42 * 3);
  } finally {
    Intl.DateTimeFormat = Original;
  }
  expect(construits).toBe(0);
  // Una conversió de l'UNTIL per acte en compilar (30 actes): abans, dos formatadors per dia i per minut.
  expect(parts.mock.calls.length).toBeLessThanOrEqual(30);
  parts.mockRestore();
});
