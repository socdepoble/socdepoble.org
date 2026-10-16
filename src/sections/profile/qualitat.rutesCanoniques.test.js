// @vitest-environment node
/* Gauntlet 261016 (Bloc 3.5.1 i 3.5.2; ordre del Mestre: les tres rutes
   canòniques, un sol perfil per identitat i el poble innegociable) · ESLint
   amb la configuració del projecte i zero missatges, avisos inclosos
   (l'equivalent de --max-warnings=0), sobre els fitxers que la peça crea o
   toca i les seues proves, i les comprovacions de Pedra Seca per text.
   Calcada de qualitat.logotip.test.js, que ja linta PerfilPublicSection.jsx;
   App.jsx el linta tests/lint-sessio.test.mjs. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

const FITXERS = Object.freeze([
  'src/app/App.rutesCanoniques.test.jsx',
  'src/config/navigation.js',
  'src/config/navigation.canoniques.test.js',
  'src/data/agentsSeed.js',
  'src/data/identitatsSeed.js',
  'src/data/identitatsSeed.fundacionals.test.js',
  'src/data/localPerfils.js',
  'src/data/localPerfils.test.js',
  'src/data/organizations.js',
  'src/data/organizations.test.js',
  'src/data/pobleOrganitzacio.js',
  'src/data/pobleOrganitzacio.test.js',
  'src/data/supabase/organizations.js',
  'src/data/supabase/organizations.test.js',
  'src/data/supabase/organizations.grup.test.js',
  'src/sections/profile/DialegNovaOrganitzacio.jsx',
  'src/sections/profile/DialegNovaOrganitzacio.test.jsx',
  'src/sections/profile/PerfilContext.jsx',
  'src/sections/profile/PerfilContext.test.jsx',
  'src/sections/profile/PerfilPublicSection.canonica.test.jsx',
  'src/sections/profile/PerfilPublicSection.capcalera.test.jsx',
  'src/sections/profile/qualitat.rutesCanoniques.test.js'
]);

const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (f) => /\.test\.jsx?$/.test(f);

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

describe('Pedra Seca', () => {
  test('fora de proves: cap style=, cap hex, cap :has(), res fora del Baseline 2022', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [/:has\(/, ':has()'],
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
