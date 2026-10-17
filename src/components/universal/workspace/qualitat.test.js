// @vitest-environment node
/* T7A · Closca i navegació del Workspace · qualitat: ESLint amb la
   configuració del projecte i zero missatges (avisos inclosos, l'equivalent
   de --max-warnings=0) sobre cada fitxer que el lot crea o toca, i les
   comprovacions de Pedra Seca per text. Patró de
   src/sections/gestoria/qualitat.test.js. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

/* Els fitxers JS/JSX que el T7A crea o toca. Els fulls CSS del lot
   (AppGridShell.css, layout.css) només hi han rebut comentaris; les seues
   xifres les vigila src/components/layout/graella.capes.test.js. */
const FITXERS = Object.freeze([
  'src/components/layout/AppGridShell.jsx',
  'src/components/layout/graella.js',
  'src/components/layout/graella.test.js',
  'src/components/layout/graella.capes.test.js',
  'src/components/universal/UniversalToolbar.jsx',
  'src/components/universal/PageFrame.jsx',
  'src/components/universal/PageFrame.seccio.test.jsx',
  'src/components/universal/workspace/UniversalWorkspace.jsx',
  'src/components/universal/workspace/UniversalWorkspace.columnes.test.jsx',
  'src/components/universal/workspace/WorkspaceContext.jsx',
  'src/components/universal/workspace/workspaceState.js',
  'src/components/universal/workspace/workspaceFolderForest.js',
  'src/components/universal/workspace/workspaceFolderForest.test.js',
  'src/components/universal/workspace/seleccioUrl.js',
  'src/components/universal/workspace/seleccioUrl.test.js',
  'src/components/universal/workspace/qualitat.test.js',
  /* Llei de la Roda Dentada (ordre del Mestre, 261007) · Les carpetes a la
     vista de la roda dentada: la preferència, el barril i les proves. */
  'src/components/universal/workspace/carpetesVisibles.js',
  'src/components/universal/workspace/carpetesVisibles.test.js',
  'src/components/universal/workspace/index.js',
  'src/components/universal/workspace/UniversalWorkspace.ajustos.test.jsx',
  'src/components/universal/workspace/UniversalWorkspace.ajustos.consumidors.test.jsx',
  'src/components/universal/workspace/UniversalWorkspace.ajustos.seccions.test.jsx',
  'src/components/universal/workspace/UniversalWorkspace.ajustos.notes.test.jsx',
  'src/components/universal/workspace/UniversalWorkspace.barres.test.jsx',
  'src/sections/notes/NotesSection.jsx',
  'src/sections/notes/NotesSection.test.jsx',
  'src/sections/notes/NotesSection.url.test.jsx',
  'src/sections/notes/carpetes.js',
  /* MD (ordre del Mestre, 261003) · Mestre-detall en mòbil: la closca, les
     dues fletxes, l'activació a cada arrel, els espècimens i les proves. */
  'src/components/layout/AppGridShell.test.jsx',
  'src/components/universal/UniversalPage.jsx',
  'src/components/universal/workspace/UniversalWorkspace.mestreDetall.test.jsx',
  'src/sections/notes/NotesSection.mestreDetall.test.jsx',
  'src/sections/disseny/DesignSection.jsx',
  'src/sections/disseny/DesignSection.mestreDetall.test.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenGestor.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenUniversalWorkspace.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.jsx',
  'src/sections/profile/PerfilShell.jsx',
  'src/sections/admin/AdminSection.mestreDetall.test.jsx',
  /* Revisió de MD · la memòria del nivell, la carpeta activa amb filles, la
     tornada dels estats del detall i de la llista d'Admin, i les proves de
     les línies d'activació de la Wiki i del Perfil. */
  'src/components/universal/workspace/nivellMestreDetall.js',
  'src/components/universal/workspace/nivellMestreDetall.test.js',
  /* Ordre del Mestre (261007) · Emojis XL a les llistes reals i diversitat
     d'emojis: la fitxa (ItemMedia), la targeta viva i la seua insígnia, els
     espècimens de Disseny i les fitxes de la Wiki, amb les seues proves. */
  'src/components/universal/workspace/ItemMedia.jsx',
  'src/components/universal/workspace/NavGlyph.mida.test.js',
  'src/components/universal/workspace/UniversalWorkspace.test.jsx',
  'src/components/universal/insigniaEmoji.jsx',
  'src/components/universal/insigniaEmoji.test.jsx',
  /* Revisió final (261007) · la guarda única d'Unicode per a Safari 16 i la
     prova de la revisió de la roda dentada. */
  'src/sections/disseny/cataleg/guardaEmojisSafari16.js',
  'src/components/universal/workspace/UniversalWorkspace.ajustos.revisio.test.jsx',
  'src/components/universal/targetaViva.js',
  'src/components/universal/targetaViva.test.js',
  'src/components/universal/TargetaViva.test.jsx',
  'src/sections/notes/NotaFitxa.test.jsx',
  'src/sections/profile/PerfilShell.targetaViva.test.jsx',
  'src/sections/disseny/cataleg/manifest.js',
  'src/sections/disseny/cataleg/manifest.icones.test.js',
  'src/sections/wiki-de-poble/iconesWiki.js',
  'src/sections/wiki-de-poble/iconesWiki.test.js',
  'src/sections/wiki-de-poble/WikiDePobleSection.icones.test.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.mestreDetall.test.jsx',
  'src/sections/profile/PerfilShell.mestreDetall.test.jsx',
  'src/sections/admin/AdminSection.jsx',
  /* Ordre del Mestre (pla 261007_0012, §0.7) · Emojis a l'índex de la Wiki
     (carpetes i portada): la prova del model que en fixa els glifs. */
  'src/sections/wiki-de-poble/WikiDePobleSection.einesLocals.test.jsx',
  /* Gauntlet del 261016 (Bloc 0 i Bloc 4) · El recompte de no llegides de
     l'arbre (el Lector) i el focus diferit de l'espai: les dues proves noves
     del component, que cap porta d'ESLint no vigilava. */
  'src/components/universal/workspace/UniversalWorkspace.recompte.test.jsx',
  'src/components/universal/workspace/UniversalWorkspace.focusDiferit.test.jsx',
  /* Bloc 3.8 del Gauntlet (261016) · Les accions de la secció a la capçalera
     de la llista (accionsLlista). */
  'src/components/universal/workspace/UniversalWorkspace.accionsLlista.test.jsx'
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
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/components/universal/workspace/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('fora de proves: cap style=, cap hex, res fora del Baseline 2022', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
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
