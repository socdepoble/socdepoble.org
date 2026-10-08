// @vitest-environment node
/* Auditoria 261008 (B03, B04, B05, B08 i B09) · Porta d'ESLint per a les
   proves noves d'esta correcció, que cap altra porta no lint: zero
   missatges, avisos inclosos (l'equivalent de --max-warnings=0), amb la
   configuració del projecte. XatContext.jsx ja el lint qualitat.test.js;
   XatSection.jsx i Conversa.jsx, tests/lint_xat.test.mjs i
   src/config/qualitat.amfitrioAdmin.test.js. Calcada de qualitat.test.js. */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

const FITXERS = Object.freeze([
  'src/sections/xat/XatContext.xarxaRural.test.jsx',
  'src/sections/xat/XatSection.cicleDeVida.test.jsx',
  'src/sections/xat/components/Conversa.antics.test.jsx',
  'src/sections/xat/XatContext.qualitat261008.test.jsx',
  'tests/migracio-xat-consentiment-i-metadades.test.mjs'
]);

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
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/xat/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});
