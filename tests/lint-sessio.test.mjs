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
  /* Sessió 260927 nit (Claude Fable, T20-T28). */
  'src/app/App.jsx',
  'src/app/contexts/RouterContext.jsx',
  'src/config/sections.js',
  'src/components/universal/UniversalUtils.js',
  'src/components/universal/UniversalEditorShell.jsx',
  'src/components/universal/UniversalEditorShell.test.jsx',
  'src/components/universal/classificacio/BotoneraClassificacio.jsx',
  'src/components/universal/classificacio/DialegEmoticona.jsx',
  'src/components/universal/classificacio/Classificacio.test.jsx',
  'src/components/universal/workspace/NavGlyph.jsx',
  'src/components/universal/workspace/NavGlyph.test.jsx',
  'src/data/localNotes.js',
  'src/sections/disseny/cataleg/detalls/EspecimenControlsBarra.jsx',
  'src/sections/notes/NotaFitxa.jsx',
  'src/sections/notes/NotesEditor.jsx',
  'src/sections/notes/NotesSection.jsx',
  'src/sections/notes/NotesContext.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.test.jsx',
  'src/utils/emoji.js',
  'src/utils/emoji.test.js',
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
