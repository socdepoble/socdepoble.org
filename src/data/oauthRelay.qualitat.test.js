// @vitest-environment node
/* F1 (Onada 4, 261003) · qualitat: ESLint amb la configuració del projecte i
   zero missatges (l'equivalent de --max-warnings=0) sobre els fitxers que ha
   tocat la correcció de COOP a l'entrada amb Google. oauthRelay.js i
   OnboardingSection.jsx ja són als censos de la seua capa (data/qualitat.test.js
   i sections/onboarding/qualitat.test.js); ací van les proves noves. El cens
   és explícit: qui toque un altre fitxer de F1 l'afig a la llista, mai el
   silencia. */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CENS = Object.freeze([
  'src/data/oauthRelay.qualitat.test.js',
  'src/data/oauthRelay.coop.test.js',
  'src/sections/onboarding/OnboardingSection.cancela.test.jsx',
  /* F1v2 (W4-02, W4-03) · la tornada amb la marca de l'intent també fixa la del camí 3 instal·lat. */
  'src/data/oauthRelay.pwa.test.js',
  /* Quarta passada (261003) · W4-02, la instantània de la pàgina; B, l'entrada en un marc d'un altre origen. */
  'src/data/oauthRelay.instantania.test.js',
  'src/data/oauthRelay.marc.test.js',
  'src/sections/onboarding/OnboardingSection.marc.test.jsx'
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
