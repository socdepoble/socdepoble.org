import { expect, test } from 'vitest';
import { deActeDelCalendari, deProducte } from './indexCerca.js';
import { facetesDeLEntrada } from './facetesCerca.js';
import { momentEditorial } from '../mur/targetesMur.js';

const CREAT = '2026-10-01T08:00:00.000Z';
const TRIADA = '2026-11-08T10:00:00.000Z';
const OPCIONS = { ara: Date.parse('2026-11-08T12:00:00.000Z'), desfasMinuts: 60 };
const producte = extra => ({ id: 'control', title: 'CONTROL oli', ambit: 'mercat', estat: 'reservat', created_at: CREAT, ...extra });

test('R56 · la data triada al producte és la mateixa al Mur i a les facetes de Cerca', () => {
  const row = producte({ publish_date: TRIADA });
  const entrada = deProducte(row);
  expect(entrada.data).toBe(momentEditorial(row));
  expect(facetesDeLEntrada(entrada, OPCIONS)).toContain('data:hui');
  expect(facetesDeLEntrada(entrada, OPCIONS)).toContain('estat:reservat');
});

test.each([undefined, null, ''])('R56 · sense data triada (%s), conserva la creació i ignora l’edició', publish_date => {
  const entrada = deProducte(producte({ publish_date, updated_at: TRIADA }));
  expect(entrada.data).toBe(Date.parse(CREAT));
  expect(facetesDeLEntrada(entrada, OPCIONS)).not.toContain('data:hui');
});

test.each(['sense-data', '2026-02-30T10:00:00Z', '2026-11-08T10:00:00.1234Z'])('R56 · una data triada present però invàlida no cau a creació: %s', publish_date => {
  expect(deProducte(producte({ publish_date })).data).toBe(0);
});

test('R56 · un acte continua usant la data de celebració, independent de publish_date', () => {
  expect(deActeDelCalendari({ id: 'acte', title: 'CONTROL acte', date: '2026-12-01', created_at: CREAT, publish_date: TRIADA }).data)
    .toBe(new Date(2026, 11, 1).getTime());
});

test('R56 · la zona horària triada representa el mateix instant editorial i tram local', () => {
  const row = producte({ publish_date: '2026-11-08T11:00:00+01:00', date: '2020-01-01' });
  expect(deProducte(row).data).toBe(momentEditorial(row));
  expect(facetesDeLEntrada(deProducte(row), OPCIONS)).toContain('data:hui');
});
