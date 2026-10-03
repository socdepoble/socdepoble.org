// @vitest-environment node
/* T7C · Snippet Curador (Workspace en mode compacte) · qualitat: ESLint amb
   la configuració del projecte i zero missatges (avisos inclosos, l'equivalent
   de --max-warnings=0) sobre cada fitxer que el lot crea o toca, i les
   comprovacions de Pedra Seca per text. Patró de
   src/sections/gestoria/qualitat.test.js. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

/* Els fitxers que el T7C crea o toca. Cap full CSS: el snippet reutilitza
   les classes de /connectar (bloc T43) i de la botonera de classificació. */
const FITXERS = Object.freeze([
  'src/components/universal/workspace/UniversalWorkspace.jsx',
  'src/components/universal/workspace/WorkspaceContext.jsx',
  'src/components/universal/workspace/UniversalWorkspace.compacte.test.jsx',
  'src/sections/notes/NotesSection.jsx',
  'src/sections/notes/NotesSection.desa.test.jsx',
  'src/sections/notes/SnippetCurador.jsx',
  'src/sections/notes/modeDesa.js',
  'src/sections/notes/modeDesa.test.js',
  'src/sections/notes/classificacioBloc.js',
  'src/sections/notes/qualitat.test.js',
  /* Correccions T7C-R1…R5. */
  'src/sections/notes/PrevisualitzacioExtern.jsx',
  'src/sections/notes/PrevisualitzacioExtern.test.jsx',
  'src/sections/connectar/contingutExtern.js'
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
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/notes/sonda.js') });
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

  test('una sola font de punts de tall: cap amplària pròpia (la mida és la de layout/graella.js)', () => {
    const vetats = [/@media/, /matchMedia/, /innerWidth/, /clientWidth/, /\b(?:720|900|1023)\b/];
    /* La finestra que obri el bookmarklet (modeDesa.js) no és cap punt de
       tall de la closca: la seua línia no compta. */
    const senseBookmarklet = (codi) => codi.split('\n').filter((linia) => !linia.includes('BOOKMARKLET: javascript:')).join('\n');
    const trobats = FITXERS.filter((f) => !esProva(f)).flatMap((fitxer) => {
      const codi = senseBookmarklet(llig(fitxer));
      return vetats.filter((patro) => patro.test(codi)).map((patro) => `${fitxer}: ${patro}`);
    });
    expect(trobats).toEqual([]);
  });

  test('l’h1 i l’h2 del snippet no acaben en punt', () => {
    const codi = llig('src/sections/notes/SnippetCurador.jsx');
    const titol = codi.match(/\stitle="([^"]+)"/)?.[1];
    const subtitol = codi.match(/\ssubtitle="([^"]+)"/)?.[1];
    expect(titol).toBe('Desar al Bloc');
    expect(subtitol).toBe('On el vols desar?');
    expect([titol, subtitol].filter((t) => t.endsWith('.'))).toEqual([]);
  });

  test('cap botó nou a la Pàgina Universal: el snippet no toca la barra blava ni la targeta', () => {
    const codi = llig('src/sections/notes/SnippetCurador.jsx');
    expect(codi).not.toMatch(/BarraBlava|onConnect=\{(?!false)/);
  });
});

/* Correcció T7C-R3 · Una sola composició del contingut de fora i una sola
   regla D1: el snippet munta PrevisualitzacioExtern i reglaDEntrada, i no
   en porta cap còpia (targeta, objecte, peu ni mode resolt). */
describe('cap estructura redundant', () => {
  test('el snippet no copia la composició ni la regla D1', () => {
    const codi = llig('src/sections/notes/SnippetCurador.jsx');
    expect(codi).toMatch(/<PrevisualitzacioExtern\b/);
    expect(codi).toMatch(/reglaDEntrada\(/);
    /* Formes de codi (no els comentaris que nomenen les peces). */
    const copies = [
      /<UniversalCard\b/, /className="sdp-connectar__(?:objecte|previsualitzacio|peu|nota|autor|identitat)"/,
      /normalizeBackendConfig\(/, /modeResolt\(/, /titol="Mode Foraster/, /<Alerta\b/
    ];
    expect(copies.filter((patro) => patro.test(codi)).map(String)).toEqual([]);
  });
});
