// @vitest-environment node
/* Decisió 2 del Mestre (261007) · «El Mur "Carregant": RENOVACIÓ SILENCIOSA»
   · qualitat: ESLint amb la configuració del projecte i zero missatges
   (avisos inclosos, l'equivalent de --max-warnings=0) sobre cada fitxer que
   la peça toca, i la guarda de la doctrina: cap proveïdor torna a posar la
   generació de la sessió a la clau d'AÏLLAMENT. Patró de
   src/sections/notes/qualitat.test.js. scopedProviders.test.jsx ja té la seua
   porta (src/data/qualitat.test.js). */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

const PROVEIDORS = Object.freeze([
  'src/app/contexts/CoreContentContext.jsx',
  'src/sections/mur/MurContext.jsx',
  'src/sections/multimedia/MultimediaContext.jsx'
]);

const FITXERS = Object.freeze([
  'src/app/contexts/useScopedResource.js',
  'src/app/contexts/useScopedResource.test.jsx',
  ...PROVEIDORS,
  'src/sections/mur/MurContext.test.jsx',
  'src/app/contexts/qualitat.renovacio.test.js',
  /* Relleu 261007 (peça «netes») · La prova de l'avís de revalidació d'App.jsx
     (Decisió 2, errorRevalidacio): esta és la seua porta natural, i fins ara
     la lintava src/sections/xat/qualitat.test.js. */
  'src/app/App.revalidacio.test.jsx',
  /* Relleu 261007 (peça «netes») · Proves de src/app de l'Auditoria 261007 (B)
     que cap porta qualitat no vigilava: la neteja d'App.jsx i la
     sincronització del tema entre instàncies (UIContext). */
  'src/app/App.neteja.test.jsx',
  'src/app/contexts/UIContext.tema.test.jsx'
]);

describe('el cens', () => {
  test('tots els fitxers de la peça existixen', () => {
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
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/app/contexts/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

/* La renovació del JWT puja la generació amb la mateixa identitat: és
   FRESCOR, i la gestiona useScopedResource. Tornar-la a la clau d'àmbit d'un
   proveïdor tornaria a buidar-lo («Carregant») a cada renovació.
   Revisió adversarial 261007 · La guarda mira l'AST i no la forma del text:
   un proveïdor no llig la generació de la sessió enlloc (cap identificador
   `generacio` fora dels comentaris). Així no depén de com s'escriga la clau
   (JSON.stringify, un useMemo de la peça de paginació…). La conducta la
   fixen useScopedResource.test.jsx («Decisió 2 · una renovació…») i
   scopedProviders.test.jsx (renovació, canvi d'actor i canvi de persona). */
/** Una regla `no-restricted-syntax` sobre l'AST: els comentaris no hi compten. */
async function infraccions(fitxers, selector, message) {
  const eslint = new ESLint({ cwd: ARREL, overrideConfig: { rules: { 'no-restricted-syntax': ['error', { selector, message }] } } });
  const resultats = await eslint.lintFiles(fitxers.map((f) => path.join(ARREL, f)));
  expect(resultats).toHaveLength(fitxers.length);
  // Sonda: la regla salta amb codi i no amb un comentari que diu el mateix.
  const [sonda] = await eslint.lintText('// generacio revalidating\nexport const clau = (s) => [s.generacio, \'revalidating\'];\n', { filePath: path.join(ARREL, 'src/app/contexts/sonda.js') });
  expect(sonda.messages.filter((m) => m.message === message).map((m) => m.line)).toEqual([2]);
  return resultats.flatMap((r) => r.messages
    .filter((m) => m.message === message)
    .map((m) => `${path.relative(ARREL, r.filePath)}:${m.line}`));
}

describe('doctrina de la renovació silenciosa', () => {
  test('cap proveïdor llig `generacio` (ni a la clau d’àmbit ni enlloc)', async () => {
    const message = 'Decisió 2 (261007): la generació de la sessió és frescor i la porta useScopedResource; cap proveïdor no l’ha de llegir.';
    expect(await infraccions(PROVEIDORS, "Identifier[name='generacio']", message)).toEqual([]);
  }, 120000);

  test('cap estat nou: els consumidors comproven status !== \'ready\'', async () => {
    const message = 'Decisió 2 (261007): cap estat nou; la revalidació és la marca `revalidant` amb status \'ready\'.';
    expect(await infraccions(['src/app/contexts/useScopedResource.js', ...PROVEIDORS], "Literal[value='revalidating']", message)).toEqual([]);
  }, 120000);
});
