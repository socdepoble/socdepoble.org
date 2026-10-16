// @vitest-environment node
/* Gauntlet 261016 (encàrrec D) · Font única de l'avatar de la fitxa a totes
   les superfícies del Perfil (avatarDeLaFitxa, fitxaDePerfil.js). Cap porta
   lintava DetallCompte.jsx, perfilModel.js ni les proves noves de la peça:
   ESLint amb la configuració del projecte i zero missatges, avisos inclosos
   (l'equivalent de --max-warnings=0). Calcada de qualitat.logotip.test.js.
   fitxaDePerfil.js, PerfilEditor.jsx i DetallVistes.jsx ja els linta
   src/components/universal/barres/qualitat.boinaAlPerfil.test.js, i
   PerfilShell.jsx, src/components/universal/workspace/qualitat.test.js. */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

/* Els fitxers que la peça crea o toca i que cap altra porta no linta. */
const FITXERS = Object.freeze([
  'src/sections/profile/DetallCompte.jsx',
  'src/sections/profile/DetallCompte.test.jsx',
  'src/sections/profile/perfilModel.js',
  'src/sections/profile/perfilModel.imatge.test.js',
  'src/sections/profile/fitxaDePerfil.test.js',
  'src/sections/profile/PerfilShell.avatarFontUnica.test.jsx',
  'src/sections/profile/qualitat.avatarFontUnica.test.js',
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
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/profile/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});
