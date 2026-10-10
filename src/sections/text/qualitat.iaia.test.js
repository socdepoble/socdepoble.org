// @vitest-environment node
/* Onada 10 (261010; decisió del Mestre del 261010) · Qualitat del front de
   la IAIA MarIA: el botó «Anar al xat» de /iaia, el text «Qui és la IAIA
   MarIA?» del seu perfil i les proves del Cercador. ESLint amb la
   configuració del projecte i zero missatges (avisos inclosos, l'equivalent de
   --max-warnings=0) sobre cada fitxer que el front crea o toca, i les
   comprovacions de Pedra Seca i de Model B per text que hi tenen sentit.
   Calcada de src/sections/xat/qualitat.test.js. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

const FITXERS = Object.freeze([
  /* El botó de /iaia: la taula d'accions, la peça i la ruta que el munta. */
  'src/sections/text/accionsDeText.js',
  'src/sections/text/accionsDeText.test.js',
  'src/sections/text/AccioDeLaPaginaDeText.jsx',
  'src/sections/xat/useObriXatPerDefecte.js',
  'src/sections/xat/rutaDelXatDeLaIAIA.test.js',
  'src/data/localXat.iaia.test.js',
  'src/app/App.jsx',
  'src/app/App.iaia.test.jsx',
  /* El text del perfil: la font única i el padró que el copia. */
  'src/data/agentsSeed.js',
  'src/data/identitatsSeed.js',
  'src/sections/profile/PerfilPublicSection.iaia.test.jsx',
  /* El Cercador: els tres usuaris fundacionals, amb les dades de la llavor. */
  'src/sections/search/indexCerca.fundacionals.test.js',
  'src/sections/text/qualitat.iaia.test.js'
]);

/* Les peces noves de producció: les úniques on el front escriu interfície. */
const PECES_NOVES = Object.freeze([
  'src/sections/text/accionsDeText.js',
  'src/sections/text/AccioDeLaPaginaDeText.jsx'
]);

const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

describe('el cens', () => {
  test('tots els fitxers del lot existixen', () => {
    expect(FITXERS.filter((fitxer) => !existsSync(path.join(ARREL, fitxer)))).toEqual([]);
    expect(PECES_NOVES.filter((fitxer) => !FITXERS.includes(fitxer))).toEqual([]);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((fitxer) => path.join(ARREL, fitxer)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís compta com a error).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/text/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('les peces noves: cap style=, cap hex, cap classe nova, res fora del Baseline 2022', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [/className=/, 'className (la peça és PortaDePagina, que ja porta les seues)'],
      [/:has\(/, ':has()'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    const trobats = PECES_NOVES.flatMap((fitxer) => {
      const codi = llig(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('el botó és la porta gran de Pedra Seca, sense cap component nou a PedraSeca', () => {
    const peca = llig('src/sections/text/AccioDeLaPaginaDeText.jsx');
    expect(peca).toContain("import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';");
    expect(peca).toContain('<PortaDePagina porta={porta} />');
  });
});

/* Model B · La UI parla amb el backend només pel port: cap peça nova importa
   un adaptador (Supabase, local o els de data/adaptadors). */
describe('Model B', () => {
  test('les peces noves i la ruta del xat de la IAIA no importen cap adaptador', () => {
    const adaptador = /from\s+'[^']*\/data\/(?:supabase|adaptadors)\/[^']*'|from\s+'[^']*\/data\/local[A-Z][^']*'/;
    const vigilats = [...PECES_NOVES, 'src/sections/xat/useObriXatPerDefecte.js'];
    expect(vigilats.filter((fitxer) => adaptador.test(llig(fitxer)))).toEqual([]);
    /* Sonda: el patró veu un import d'adaptador (només el `from`, com a la
       porta del xat: la Porta Enxufe escaneja també les proves). */
    expect(adaptador.test("from '../../data/supabase/xat.js'")).toBe(true);
    expect(adaptador.test("from '../../data/localXat.js'")).toBe(true);
  });

  test('la taula d’accions de text no toca systemPages.js: ’anima’ no hi entra', () => {
    const sistema = llig('src/config/systemPages.js');
    expect(sistema).not.toMatch(/key:\s*'anima'/);
    expect(sistema).not.toMatch(/^import\s/m);
  });
});
