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
  'src/sections/connectar/contingutExtern.js',
  /* P4 (ordre del Mestre, 261003) · Regressió UX del Bloc: sense la vista
     prèvia de la dreta, la «Nota sense títol» i la regla d'entrada. */
  'src/sections/notes/notaPreparada.js',
  'src/sections/notes/notaPreparada.test.jsx',
  'src/sections/notes/NotesEditor.jsx',
  'src/sections/notes/NotesEditor.test.jsx',
  'src/sections/notes/NotesEditor.p4.test.jsx',
  'src/sections/notes/NotesContext.jsx',
  'src/sections/notes/NotesSection.test.jsx',
  'src/sections/notes/NotesSection.p4.test.jsx',
  'src/sections/notes/NotesSection.url.test.jsx',
  'src/sections/notes/visibilitatNota.js',
  'src/sections/notes/visibilitatNota.test.js',
  /* Revisió de P4 · el sanejador del canal, en un mòdul pur. */
  'src/sections/notes/netejaCamp.js',
  /* SN (ordre del Mestre, 261003) · El snippet tria la destinació: el Bloc o
     el Lector. La plataforma i el Lector tenen les seues portes pròpies
     (plataforma/qualitat.test.js, lector/qualitat.test.js). */
  'src/sections/notes/NotesSection.lector.test.jsx',
  /* Bloc 3.8 del Gauntlet (261016) · Emojis XL al Bloc: el canal entre la
     graella i l'editor, la graella universal i les proves del bloc. */
  'src/sections/notes/canalEmojis.js',
  'src/components/universal/classificacio/GraellaEmojis.jsx',
  'src/sections/notes/NotesSection.emojis.test.jsx',
  'src/sections/notes/NotesSection.emojisRail.test.jsx',
  'src/sections/notes/NotesEditor.emojis.test.jsx',
  /* Gauntlet 261017 (F29–F34) · Les famílies del selector i les proves del
     canal. */
  'src/sections/notes/familiesEmojis.js',
  'src/sections/notes/familiesEmojis.test.js',
  'src/sections/notes/canalEmojis.test.js',
  /* Bloc 3.9 del Gauntlet (261016) · Editor Universal de notes: la plantilla
     canònica i el seu esvaïment (TipTap de veres), la signatura sense
     Foraster, «Nota sense títol» i la publicació sense la plantilla verge. */
  'src/sections/notes/llavorNota.js',
  'src/sections/notes/llavorNota.tiptap.test.jsx',
  'src/sections/notes/NotesContext.llavor.test.jsx',
  'src/sections/notes/autoriaNota.js',
  'src/sections/notes/autoriaNota.test.js',
  'src/sections/notes/NotaFitxa.jsx',
  'src/sections/notes/NotaFitxa.test.jsx',
  'src/sections/notes/DialegEsborrarNota.jsx',
  'src/sections/notes/NotesEditor.peuDePagina.test.jsx',
  'src/sections/notes/NotesSection.peuDePagina.test.jsx',
  /* Correccions de la revisió adversarial del Bloc 3.8/3.9 (261016): les
     guardes d'esLlavorDeNota al camí calent. */
  'src/sections/notes/llavorNota.test.js',
  /* Gauntlet 261017 (C02, C06 de Codex; WP7a) · La llavor davant de
     l'adversari i l'extracte de la llista amb una llavor. */
  'src/sections/notes/llavorNota.adversari.test.jsx',
  'src/sections/notes/NotesSection.extracteLlavor.test.jsx',
  /* Revisió del Gauntlet 261017 (ID6) · Les publicacions pròpies del Bloc amb
     el mode de dades resolt (modeDeDadesResolt), el mateix de l'editor. */
  'src/sections/notes/NotesSection.aliesResolt.test.jsx'
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
       tall de la closca: la seua línia no compta. Des de la integració de
       l'Onada 3 és la plantilla PLANTILLA_BOOKMARKLET (Model B, sense domini). */
    const esBookmarklet = (linia) => /BOOKMARKLET\b.*javascript:/.test(linia);
    const senseBookmarklet = (codi) => codi.split('\n').filter((linia) => !esBookmarklet(linia)).join('\n');
    const trobats = FITXERS.filter((f) => !esProva(f)).flatMap((fitxer) => {
      const codi = senseBookmarklet(llig(fitxer));
      return vetats.filter((patro) => patro.test(codi)).map((patro) => `${fitxer}: ${patro}`);
    });
    expect(trobats).toEqual([]);
  });

  /* SN · El títol depén de la destinació (TEXTOS_DESTI): «Desar al Bloc»,
     el de sempre i el de per defecte, i «Afegir al Lector». Cap no acaba en
     punt, ni el subtítol. */
  test('l’h1 i l’h2 del snippet no acaben en punt', () => {
    const codi = llig('src/sections/notes/SnippetCurador.jsx');
    expect(codi).toMatch(/\stitle=\{textos\.titol\}/);
    expect(codi).toMatch(/\ssubtitle=\{SUBTITOL\}/);
    const bloc = codi.match(/const TEXTOS_DESTI = Object\.freeze\(\{([\s\S]*?)\n\}\);/)?.[1] ?? '';
    const titols = [...bloc.matchAll(/titol: '([^']+)'/g)].map((m) => m[1]);
    const subtitol = codi.match(/const SUBTITOL = '([^']+)';/)?.[1];
    expect(titols).toEqual(['Desar al Bloc', 'Afegir al Lector']);
    expect(subtitol).toBe('On el vols desar?');
    expect([...titols, subtitol].filter((t) => t.endsWith('.'))).toEqual([]);
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
