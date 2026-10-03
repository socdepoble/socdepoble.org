// @vitest-environment node
/* Dades · qualitat: ESLint amb la configuració del projecte i zero missatges
   (l'equivalent de --max-warnings=0) sobre els fitxers que s'han tocat per a
   alinear les fixtures amb el contracte de tenant (backendConfig.js exigix
   tenant_id UUID). El cens és explícit: qui toque un altre fitxer d'esta
   capa l'afig a la llista, mai el silencia. */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CENS = Object.freeze([
  'src/data/qualitat.test.js',
  'src/data/sessionService.test.js',
  'src/data/supabase/organizations.test.js',
  'src/app/contexts/scopedProviders.test.jsx'
]);

describe('el cens', () => {
  test('tots els fitxers del cens existixen', () => {
    for (const fitxer of CENS) expect(existsSync(path.join(ARREL, fitxer)), fitxer).toBe(true);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers del cens', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(CENS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(CENS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/data/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});
