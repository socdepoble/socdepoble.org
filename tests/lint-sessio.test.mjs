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
  'src/app/App.jsx',
  'src/app/App.test.jsx',
  'src/hooks/usePullToRefresh.js',
  'src/hooks/usePullToRefresh.test.js',
  'src/components/PedraSeca/organismes/UniversalCard.jsx',
  'src/components/PedraSeca/organismes/UniversalCard.test.jsx',
  'src/components/layout/AppGridColumn.jsx',
  'src/components/universal/PageFrame.jsx',
  'src/components/universal/PageFrame.test.jsx',
  'src/components/universal/editorial.js',
  'src/components/universal/editorial.test.js',
  'src/components/universal/graph/BrainGraph.jsx',
  'src/components/universal/graph/BrainGraph.test.jsx',
  'src/components/universal/graph/useForceLayout.js',
  'src/components/universal/workspace/ItemMedia.jsx',
  'src/components/universal/workspace/NavGlyph.jsx',
  'src/components/universal/workspace/NavGlyph.test.jsx',
  'src/components/universal/workspace/UniversalWorkspace.jsx',
  'src/components/universal/workspace/UniversalWorkspace.test.jsx',
  'src/sections/consola/ConsolaSection.jsx',
  'src/sections/consola/ConsolaSection.test.jsx',
  'src/sections/consola/ConsolaSection.navegacio.test.jsx',
  'src/sections/consola/consolaContent.js',
  'src/sections/consola/consolaContent.test.js',
  'src/sections/consola/consolaPagines.js',
  'src/sections/consola/consolaPagines.test.js',
  'src/sections/consola/peces.jsx',
  'src/sections/consola/peces.test.jsx',
  'src/sections/consola/mapa/ActorsMapa.jsx',
  'src/sections/consola/mapa/AgentsAtomics.jsx',
  'src/sections/consola/mapa/ExploradorMapa.jsx',
  'src/sections/consola/mapa/FluxosMapa.jsx',
  'src/sections/consola/mapa/InventariMapa.jsx',
  'src/sections/consola/mapa/MapaConsola.jsx',
  'src/sections/consola/mapa/grafMapa.js',
  'src/sections/consola/mapa/grafMapa.test.js',
  'src/sections/consola/mapa/vistesMapa.test.jsx',
  'src/sections/disseny/DesignSection.jsx',
  'src/sections/disseny/cataleg/manifest.js',
  'src/sections/text/TextSection.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.test.jsx',
  'src/sections/wiki-de-poble/parseMarkdown.js',
  'src/sections/wiki-de-poble/parseMarkdown.test.js',
  'src/config/i18n.js',
  'tests/frontmatter-sessio.test.mjs',
  'tests/enllacos-sessio.test.mjs',
  'tests/portes-sessio.test.mjs',
  'tests/cerca-sessio.test.mjs',
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
