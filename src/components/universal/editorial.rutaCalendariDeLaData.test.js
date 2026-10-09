/**
 * Onada 6 (prompt 261009_0230, punt 1; pla de l'Onada 5, tasca 16: «El botó
 * "Agenda" de la targeta portarà a la data específica del Calendari») ·
 * rutaCalendariDeLaData: la vista Mes del Calendari amb el dia triat. Una clau
 * «AAAA-MM-DD» que existix, amb la regla del ?date= (cursorDeClau,
 * calendari-5); la resta, el Calendari tal qual. La pastilla continua amb
 * rutaCalendariDelMes (el mes, ordre del Mestre 261001, carril A).
 */
import { expect, test } from 'vitest';
import { RUTA_CALENDARI, rutaCalendariDeLaData, rutaCalendariDelMes } from './editorial.js';
import { diaDeLaClau } from '../../sections/calendari/calendariGlobal.js';

test('un dia que existix: /calendari?vista=mes&date=AAAA-MM-DD', () => {
  expect(rutaCalendariDeLaData('2026-11-14')).toBe('/calendari?vista=mes&date=2026-11-14');
  expect(rutaCalendariDeLaData('2028-02-29')).toBe('/calendari?vista=mes&date=2028-02-29');
  expect(rutaCalendariDeLaData('1000-01-01')).toBe('/calendari?vista=mes&date=1000-01-01');
  expect(rutaCalendariDeLaData('9999-12-31')).toBe('/calendari?vista=mes&date=9999-12-31');
});

test('una clau que no és cap dia del calendari: el Calendari tal qual (cap dia inventat)', () => {
  for (const brossa of [
    null, undefined, '', 42, {}, 'demà', '2026-02-30', '2027-02-29', '2026-13-01', '2026-00-10', '2026-11-00', '2026-11-31',
    '0026-01-01', '0999-12-31', '2026-1-14', '2026-11-14T10:00', ' 2026-11-14', '2026-11-14&vista=any'
  ]) {
    expect(rutaCalendariDeLaData(brossa), String(brossa)).toBe(RUTA_CALENDARI);
  }
});

test('la mateixa regla que el ?date= de /calendari (diaDeLaClau): els dos diuen el mateix de cada clau', () => {
  for (const clau of ['2026-11-14', '2026-02-29', '2028-02-29', '0026-01-01', '2026-04-31', '1000-01-01', '2026-12-31']) {
    expect(rutaCalendariDeLaData(clau) !== RUTA_CALENDARI, clau).toBe(diaDeLaClau(clau) !== null);
  }
});

test('la pastilla no canvia: continua portant al mes', () => {
  expect(rutaCalendariDelMes('2026-11')).toBe('/calendari?mes=2026-11');
});
