/**
 * Linter en mode lectura, per a agents engabiats (el hook local no admet
 * `npm run lint`). Passa l'ESLint del repositori (mateixa configuració que
 * `npm run lint`, amb --max-warnings=0) pels fitxers de FITXERS i falla si
 * hi ha cap error o avís. No escriu res.
 *
 * Ús:  node --test tests/lint-sessio.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Fitxers tocats en la sessió. Buida la llista per a passar tot `src`. */
const FITXERS = [
  'src/components/universal/workspace/UniversalWorkspace.jsx',
  'src/components/universal/workspace/UniversalWorkspace.test.jsx',
  'src/components/universal/DocumentEditor.jsx',
  'src/components/universal/UniversalEditorShell.jsx',
  'src/components/universal/textosLlavor.js',
  'src/sections/notes/NotesSection.jsx',
  'src/sections/notes/NotesSection.test.jsx',
  'src/sections/notes/NotesEditor.jsx',
  'src/sections/notes/NotesEditor.test.jsx',
  'src/sections/notes/NotaFitxa.jsx',
  'src/sections/notes/NotaFitxa.test.jsx',
  'src/sections/disseny/DesignSection.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.test.jsx',
  'tests/inventari-directoris.test.mjs',
  'tests/cerca-sessio.test.mjs',
  'tests/tractor-orfes-brain.test.mjs',
  'tests/lint-sessio.test.mjs'
];

test('lint dels fitxers de la sessió (lectura)', async () => {
  const eslint = new ESLint({ cwd: ROOT });
  const objectius = FITXERS.length ? FITXERS.map((f) => path.join(ROOT, f)) : [path.join(ROOT, 'src')];
  const resultats = await eslint.lintFiles(objectius);
  const formatter = await eslint.loadFormatter('stylish');
  const text = formatter.format(resultats);
  process.stdout.write(`${text || '✅ Lint net'}\n`);
  const errors = resultats.reduce((n, r) => n + r.errorCount + r.warningCount, 0);
  assert.equal(errors, 0, `${errors} problemes de lint`);
});
