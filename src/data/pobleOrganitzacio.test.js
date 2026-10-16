/* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «El poble és innegociable»)
   · La regla única del poble d'una organització: obligatori, retallat
   d'espais i amb el límit del CHECK del servidor en caràcters de veres. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { ERROR_POBLE_MASSA_LLARG, ERROR_SENSE_POBLE, MAXIM_NOM_POBLE, pobleDOrganitzacio } from './pobleOrganitzacio.js';

test('un poble de veres es desa retallat d’espais', () => {
  expect(pobleDOrganitzacio('La Torre de les Maçanes')).toBe('La Torre de les Maçanes');
  expect(pobleDOrganitzacio('  Benilloba \n')).toBe('Benilloba');
});

test.each(['', '   ', null, undefined, 7, {}, ['Alcoi']])('sense poble (%j) és un error amb missatge clar', (valor) => {
  expect(() => pobleDOrganitzacio(valor)).toThrow(ERROR_SENSE_POBLE);
  expect(ERROR_SENSE_POBLE).toBe('Cada organització ha de tindre el seu poble: tria’n un.');
});

test('el límit és el del CHECK (120), comptat com char_length: «🌾» és 1', () => {
  expect(MAXIM_NOM_POBLE).toBe(120);
  expect(pobleDOrganitzacio('🌾'.repeat(120))).toBe('🌾'.repeat(120));
  expect(() => pobleDOrganitzacio('x'.repeat(121))).toThrow(ERROR_POBLE_MASSA_LLARG);
  expect(ERROR_POBLE_MASSA_LLARG).toBe('El nom del poble pot tindre com a màxim 120 caràcters.');
  const sql = readFileSync(path.join(process.cwd(), 'supabase/migrations/2610081401_organitzacions_poble.sql'), 'utf8');
  expect(sql).toMatch(/check \(char_length\(town_name\) <= 120\)/);
});
