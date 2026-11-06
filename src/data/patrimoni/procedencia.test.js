// @vitest-environment node
/* Gauntlet R9 · G2-09 · La procedència de les dades de patrimoni es reproduïx des del repositori: cap mòdul
   de src/data/patrimoni/ no cita cap camí efímer ni personal (el bloc de notes de les IA, el /tmp privat del
   sistema o una carpeta d'usuari), i el banc de llavors remet a la prova i als extractes que sí que hi són.
   Els patrons van escrits amb classes de caràcters perquè la mateixa cerca de text no trobe esta prova. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

const DIR = path.join(process.cwd(), 'src/data/patrimoni');
const EFIMERS = /scratch[p]ad|\/private\/tm[p]|\/Users\/|claude-50[1]/;

test('G2-09 · cap mòdul de dades de patrimoni no cita cap camí efímer ni personal', () => {
  const moduls = readdirSync(DIR).filter((nom) => /\.js$/.test(nom) && !/\.test\.js$/.test(nom));
  expect(moduls).toContain('bancLlavors.js');
  const amb = moduls.filter((nom) => EFIMERS.test(readFileSync(path.join(DIR, nom), 'utf8')));
  expect(amb).toEqual([]);
});

test('G2-09 · el banc de llavors remet a la prova i als extractes del repositori', () => {
  const capcalera = readFileSync(path.join(DIR, 'bancLlavors.js'), 'utf8').split('*/')[0];
  expect(capcalera).toContain('patrimoniR9.fonts.test.js');
  expect(capcalera).toContain('tests/fixtures/patrimoni/');
  expect(existsSync(path.join(DIR, 'patrimoniR9.fonts.test.js'))).toBe(true);
  expect(existsSync(path.join(process.cwd(), 'tests/fixtures/patrimoni'))).toBe(true);
});
