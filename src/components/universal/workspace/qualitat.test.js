// @vitest-environment node
/* T7A · Closca i navegació del Workspace · qualitat: ESLint amb la
   configuració del projecte i zero missatges (avisos inclosos, l'equivalent
   de --max-warnings=0) sobre cada fitxer que el lot crea o toca, i les
   comprovacions de Pedra Seca per text. Patró de
   src/sections/gestoria/qualitat.test.js. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

/* Els fitxers JS/JSX que el T7A crea o toca. Els fulls CSS del lot
   (AppGridShell.css, layout.css) només hi han rebut comentaris; les seues
   xifres les vigila src/components/layout/graella.capes.test.js. */
const FITXERS = Object.freeze([
  'src/components/layout/AppGridShell.jsx',
  'src/components/layout/graella.js',
  'src/components/layout/graella.test.js',
  'src/components/layout/graella.capes.test.js',
  'src/components/universal/UniversalToolbar.jsx',
  'src/components/universal/PageFrame.jsx',
  'src/components/universal/PageFrame.seccio.test.jsx',
  'src/components/universal/workspace/UniversalWorkspace.jsx',
  'src/components/universal/workspace/UniversalWorkspace.columnes.test.jsx',
  'src/components/universal/workspace/WorkspaceContext.jsx',
  'src/components/universal/workspace/workspaceState.js',
  'src/components/universal/workspace/workspaceFolderForest.js',
  'src/components/universal/workspace/workspaceFolderForest.test.js',
  'src/components/universal/workspace/seleccioUrl.js',
  'src/components/universal/workspace/seleccioUrl.test.js',
  'src/components/universal/workspace/qualitat.test.js',
  'src/sections/notes/NotesSection.jsx',
  'src/sections/notes/NotesSection.test.jsx',
  'src/sections/notes/NotesSection.url.test.jsx',
  'src/sections/notes/carpetes.js'
]);

const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (f) => /\.test\.jsx?$/.test(f);

describe('el cens', () => {
  test('tots els fitxers del lot existixen', () => {
    expect(FITXERS.filter((f) => !existsSync(path.join(ARREL, f)))).toEqual([]);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís compta com a error).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/components/universal/workspace/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('fora de proves: cap style=, cap hex, res fora del Baseline 2022', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    const trobats = FITXERS.filter((f) => !esProva(f)).flatMap((fitxer) => {
      const codi = llig(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });
});
