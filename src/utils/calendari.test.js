/* T40 (ordre del Mestre, 260928) · El calendari pur, compartit per la Consola
   i pel selector de data de publicació. Cap prova depén del fus horari del
   sistema: les dates es construïxen en hora local (new Date(any, mes, dia, h, m)). */
import { expect, test } from 'vitest';
import {
  DIES_CURTS, DIES_LLARGS, combinaDataHora, cursorDe, dataIsoONull, esMateixDia, graellaMes, horaDe, mouMes
} from './calendari.js';
import * as consola from '../sections/consola/mapa/calendariMapa.js';

test('la Consola reexporta les mateixes peces: cap import antic canvia', () => {
  expect(consola.graellaMes).toBe(graellaMes);
  expect(consola.mouMes).toBe(mouMes);
  expect(consola.DIES_CURTS).toBe(DIES_CURTS);
  expect(consola.DIES_LLARGS).toBe(DIES_LLARGS);
});

test('graellaMes: setembre de 2026 comença en dimarts i té 30 dies', () => {
  const setmanes = graellaMes(2026, 8);
  expect(setmanes[0]).toEqual([null, 1, 2, 3, 4, 5, 6]);
  expect(setmanes.flat().filter(Boolean)).toHaveLength(30);
  expect(setmanes.every((s) => s.length === 7)).toBe(true);
});

test('mouMes i cursorDe creuen l’any', () => {
  expect(mouMes({ any: 2026, mes: 11 }, 1)).toEqual({ any: 2027, mes: 0 });
  expect(mouMes({ any: 2026, mes: 0 }, -1)).toEqual({ any: 2025, mes: 11 });
  expect(cursorDe(new Date(2026, 11, 31, 23, 59))).toEqual({ any: 2026, mes: 11 });
  expect(cursorDe(new Date(2027, 0, 1).toISOString())).toEqual({ any: 2027, mes: 0 });
});

test('esMateixDia compara en hora local i no confon anys', () => {
  const d = new Date(2026, 8, 28, 23, 30);
  expect(esMateixDia(d, 2026, 8, 28)).toBe(true);
  expect(esMateixDia(d.toISOString(), 2026, 8, 28)).toBe(true);
  expect(esMateixDia(d, 2025, 8, 28)).toBe(false);
  expect(esMateixDia(null, 2026, 8, 28)).toBe(false);
  expect(esMateixDia('demà', 2026, 8, 28)).toBe(false);
});

test('combinaDataHora conserva el dia i l’hora locals', () => {
  const iso = combinaDataHora(2026, 8, 28, '09:05');
  const d = new Date(iso);
  expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 8, 28, 9, 5]);
  expect(horaDe(iso)).toBe('09:05');
  expect(combinaDataHora(2026, 1, 30, '10:00')).toBeNull();
  expect(combinaDataHora(2026, 8, 28, '24:00')).toBeNull();
  expect(combinaDataHora(2026, 8, 28, '')).toBeNull();
  expect(combinaDataHora(2026, 8, 28, 'migdia')).toBeNull();
});

test('dataIsoONull: només dates ISO de veres', () => {
  expect(dataIsoONull('2026-09-28T10:00:00.000Z')).toBe('2026-09-28T10:00:00.000Z');
  expect(dataIsoONull('2026-09-28T12:00:00+02:00')).toBe('2026-09-28T10:00:00.000Z');
  // El timestamptz de Postgres (PostgREST) pot portar microsegons.
  expect(dataIsoONull('2026-09-28T10:00:00.123456+00:00')).toBe('2026-09-28T10:00:00.123Z');
  expect(dataIsoONull(new Date(Date.UTC(2026, 8, 28)))).toBe('2026-09-28T00:00:00.000Z');
  for (const brossa of ['2026-02-30', '2026-02-30T10:00:00Z', 'demà', '', '   ', null, undefined, 42, {}, new Date('x')]) {
    expect(dataIsoONull(brossa)).toBeNull();
  }
});

test('horaDe torna buit per a valors que no són dates', () => {
  expect(horaDe(null)).toBe('');
  expect(horaDe('')).toBe('');
  expect(horaDe('demà')).toBe('');
});
