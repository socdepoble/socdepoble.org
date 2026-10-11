/* Onada 11 (261010; prompt 261010_1730, tasca 2) · Les tres còpies de
   CATEGORIES_BASE (classificacioBloc.js, NotesEditor.jsx i
   ConnectarSection.jsx) s'han unificat: una sola font, a
   src/data/personalitzacio.js, re-exportada per classificacioBloc.js. Els
   valors són els d'abans, lletra a lletra, i els consumidors del Bloc
   (NotesSection, NotesEditor, SnippetCurador i ConnectarSection) passen per
   categoriesBase / etiquetesBase, que sense personalització tornen la base. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { AVIS_CATEGORIA, CATEGORIES_BASE, ETIQUETES_BASE } from './classificacioBloc.js';
import * as dades from '../../data/personalitzacio.js';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const font = (ruta) => readFileSync(path.join(process.cwd(), 'src/sections', ruta), 'utf8');

test('els valors de sèrie són els de sempre i la mateixa referència que la capa de dades', () => {
  expect(CATEGORIES_BASE).toEqual(['Sistema']);
  expect(ETIQUETES_BASE).toEqual(['Productivitat', 'Tutorial']);
  expect(CATEGORIES_BASE).toBe(dades.CATEGORIES_BASE);
  expect(ETIQUETES_BASE).toBe(dades.ETIQUETES_BASE);
  expect(AVIS_CATEGORIA).toMatch(/^Cal almenys una categoria/);
});

test.each([
  ['NotesEditor.jsx', 'notes/NotesEditor.jsx'],
  ['ConnectarSection.jsx', 'connectar/ConnectarSection.jsx']
])('%s ja no porta cap còpia local de les llistes de sèrie', (_, ruta) => {
  const codi = font(ruta);
  expect(codi).not.toMatch(/^const CATEGORIES_BASE = \[/m);
  expect(codi).not.toMatch(/^const ETIQUETES_BASE = \[/m);
  expect(codi).toMatch(/from '\.\.\/\.\.\/data\/personalitzacio\.js'/);
});

test.each([
  ['NotesSection.jsx', 'notes/NotesSection.jsx', ['categoriesBase', 'etiquetesBase']],
  ['NotesEditor.jsx', 'notes/NotesEditor.jsx', ['categoriesBase', 'etiquetesBase']],
  ['SnippetCurador.jsx', 'notes/SnippetCurador.jsx', ['categoriesBase', 'etiquetesBase']],
  ['ConnectarSection.jsx', 'connectar/ConnectarSection.jsx', ['categoriesBase']]
])('%s llig les llistes de sèrie a través de la taxonomia del poble (useCoreContent().personalitzacio)', (_, ruta, funcions) => {
  const codi = font(ruta);
  for (const funcio of funcions) expect(codi).toMatch(new RegExp(`${funcio}\\(`));
  expect(codi).toMatch(/personalitzacio\?\.taxonomia\?\.payload/);
  expect(codi).toMatch(/useCoreContent\(\)/);
});
