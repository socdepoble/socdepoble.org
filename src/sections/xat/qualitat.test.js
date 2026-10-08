// @vitest-environment node
/* Decisió 1 del Mestre (261007) · «Bombolles del xat: S'HAN DE CONSERVAR» ·
   qualitat del proveïdor del xat i de les seues proves: ESLint amb la
   configuració del projecte i zero missatges (avisos inclosos, l'equivalent de
   --max-warnings=0) sobre cada fitxer que la decisió toca, i les comprovacions
   de Pedra Seca i de Model B per text que hi tenen sentit (un proveïdor i un
   mòdul pur, sense JSX de presentació propi ni CSS). Relleu 261007 · Fins
   ara cap porta d'ESLint cobria estos fitxers. Calcada de
   src/sections/notes/qualitat.test.js. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

/* Els fitxers de la Decisió 1: la clau de dades (ambitEstable) separada de la
   d'operació, la renovació que no buida res i els enviaments tallats que es
   reintenten amb el mateix id. */
const FITXERS = Object.freeze([
  'src/sections/xat/XatContext.jsx',
  'src/sections/xat/missatges.js',
  'src/sections/xat/XatContext.test.jsx',
  'src/sections/xat/XatContext.ambit.test.jsx',
  'src/sections/xat/missatges.test.js',
  'src/sections/xat/qualitat.test.js',
  /* Revisió adversarial (Relleu 261007) · La Decisió 1 també reescriu les
     proves P2 de l'esborrany (la clau de XatWorkspace és ambitEstable). La
     resta del xat (XatSection.jsx i XatSection.test.jsx) ja la lint
     src/config/qualitat.amfitrioAdmin.test.js. */
  'src/sections/xat/XatSection.revisio260930.test.jsx',
  /* Relleu 261007 · El padró de /cerca es demana per l'àmbit de dades del
     xat (ambitEstable), no per la clau d'operació. */
  'src/sections/search/useCercaGlobal.js',
  'src/sections/search/SearchSection.test.jsx',
  /* Relleu 261007 (peça «netes») · On porta una fila d'ajuda per defecte del
     Xat (ordre del Mestre, 261007): cap porta qualitat no el vigilava. La
     prova de l'avís de revalidació d'App.jsx (App.revalidacio.test.jsx) ja
     viu a la seua porta natural, src/app/contexts/qualitat.renovacio.test.js. */
  'src/sections/xat/useObriXatPerDefecte.js'
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
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/xat/sonda.js') });
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

/* Model B · La UI parla amb el backend només pel port (backendPort.js): cap
   fitxer de producció del lot importa un adaptador (Supabase, local o els
   de data/adaptadors). */
describe('Model B', () => {
  test('fora de proves, cap import d’un adaptador; el proveïdor va pel port', () => {
    const adaptador = /from\s+'[^']*\/data\/(?:supabase|adaptadors)\/[^']*'|from\s+'[^']*\/data\/local[A-Z][^']*'/;
    const trobats = FITXERS.filter((f) => !esProva(f)).filter((fitxer) => adaptador.test(llig(fitxer)));
    expect(trobats).toEqual([]);
    /* Sonda: el patró veu un import d'adaptador, i el proveïdor importa el port.
       Revisió adversarial (Relleu 261007) · Sense la paraula clau `import`: la
       Porta Enxufe (E1, tractor-enxufe.mjs) escaneja també les proves sense
       llevar els literals, i una sonda amb la sentència sencera hi comptava com
       un import real de l'adaptador. El patró només necessita el `from`. */
    expect(adaptador.test("from '../../data/supabase/xat.js'")).toBe(true);
    expect(adaptador.test("from '../../data/localXat.js'")).toBe(true);
    expect(llig('src/sections/xat/XatContext.jsx')).toMatch(/from '\.\.\/\.\.\/data\/backendPort\.js'/);
  });
});
