// @vitest-environment node
/* Ordre del Mestre (261007, prompt 261007_1628, peça C · Panell de Control i
   RSS) · ESLint amb la configuració del projecte i zero missatges, avisos
   inclosos (l'equivalent de --max-warnings=0), als fitxers de la peça que cap
   altra porta no linta: la correspondència d'ids del Perfil i del Panell, la
   prova de la preferència (utilitatsActives.test.js) i l'adaptador del
   directori. Patró de src/config/qualitat.amfitrioAdmin.test.js.
   utilitatsActives.js, DetallEspai.jsx i la seua prova ja els linta
   src/config/qualitat.amfitrioAdmin.test.js; el Lector i els plugins, les
   seues portes. */
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const FITXERS = [
  'src/sections/profile/aplicacions.js',
  'src/sections/profile/aplicacions.test.js',
  'src/sections/profile/utilitatsActives.test.js',
  'src/sections/profile/utilitatsActives.qualitat.test.js',
  'src/data/supabase/perfils.js',
  'src/data/supabase/perfils.test.js'
];

describe('ESLint de la peça C (Perfil, Panell i directori)', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa ací (patró de src/apps/lector/qualitat.test.js).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/profile/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});
