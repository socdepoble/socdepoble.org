// @vitest-environment node
/* Entrada (/registre) · qualitat: ESLint amb la configuració del projecte i
   zero missatges (l'equivalent de --max-warnings=0) sobre els fitxers que ha
   tocat la recuperació de contrasenya (R, Onada 3, 261003). El cens és
   explícit: qui toque un altre fitxer de l'entrada l'afig a la llista, mai el
   silencia. */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CENS = Object.freeze([
  'src/sections/onboarding/qualitat.test.js',
  'src/sections/onboarding/RecuperacioSteps.jsx',
  'src/sections/onboarding/OnboardingSteps.jsx',
  'src/sections/onboarding/OnboardingSection.jsx',
  'src/sections/onboarding/OnboardingSection.recuperacio.test.jsx',
  'src/sections/onboarding/onboardingModel.js',
  'src/app/contexts/SessionContext.jsx',
  'src/app/contexts/SessionContext.test.jsx',
  /* Gauntlet 261016_1530 (Bloc 3.6.4; F66) · L'entrada pilot local. */
  'src/sections/onboarding/OnboardingSection.pilot.test.jsx',
  'src/app/App.entradaPilot.test.jsx',
  'src/data/sessioPilot.js',
  'src/data/sessioPilot.test.js',
  'src/data/sessionService.pilot.test.js',
  'src/data/identitat.js',
  'src/data/sessionService.js'
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
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/onboarding/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});
