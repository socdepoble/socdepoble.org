// @vitest-environment node
/* Ordre del Mestre (261007, prompt 261007_1628, ordre E) · «No hi ha cap botó
   per a posar el logotip (o cap imatge) damunt de l'H1». Auditoria 261007
   (retocs de l'ordre E) · Cap porta lintava els fitxers de la peça: ESLint
   amb la configuració del projecte i zero missatges, avisos inclosos
   (l'equivalent de --max-warnings=0), sobre la fitxa del Perfil, el diàleg
   de la imatge i les proves noves de la peça, i les comprovacions de Pedra
   Seca per text. Calcada de src/sections/notes/qualitat.test.js. La closca
   (UniversalEditorShell.jsx), DocumentEditor.jsx i l'índex de les
   extensions no hi són: ja els linten
   src/components/universal/classificacio/qualitat.test.js i
   src/components/universal/richText/extensions/targetes/qualitat.test.js. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

/* Els fitxers que la peça de l'ordre E crea o toca. Onada 4 (retallador
   senzill, 261008) · També els de la finestra de retall de les imatges de la
   fitxa i les seues proves. */
const FITXERS = Object.freeze([
  'src/sections/profile/PerfilEditor.jsx',
  'src/sections/profile/PerfilEditor.logotip.test.jsx',
  'src/sections/profile/PerfilEditor.focusAvatar.test.jsx',
  'src/components/universal/UniversalEditorShell.logotip.test.jsx',
  'src/components/universal/DocumentEditor.logotip.test.jsx',
  'src/components/universal/richText/extensions/ordreImatge.avisos.test.js',
  'src/sections/profile/qualitat.logotip.test.js',
  'src/sections/profile/useImatgeDeFitxa.jsx',
  'src/sections/profile/useImatgeDeFitxa.test.jsx',
  'src/sections/profile/useEnquadramentAvatar.jsx',
  'src/sections/profile/PerfilEditor.imatges.test.jsx',
  'src/sections/profile/PerfilEditor.enquadramentAvatar.test.jsx',
  'src/components/universal/enquadrament/useEnquadramentImatge.jsx',
  'src/components/universal/enquadrament/DialegEnquadrament.jsx',
  'src/components/universal/enquadrament/DialegEnquadrament.senzill.test.jsx',
  'src/components/universal/enquadrament/enquadrament.js',
  'src/components/PedraSeca/organismes/Dialeg.jsx',
  'src/hooks/useHeroImageHandler.js',
  'src/hooks/useHeroImageHandler.test.js',
  'src/sections/profile/PerfilEditor.test.jsx',
  'src/sections/profile/enquadramentAvatar.limits.test.jsx',
  'src/sections/profile/enquadramentAvatar.privacitat.test.jsx',
  'src/sections/profile/PerfilPublicSection.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenEnquadrament.jsx'
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
