// @vitest-environment node
/* Pla 261018_1605 (D9; ordre del Mestre, 18-10-2026) · Perfil públic per
   defecte, «Nom · Poble», els pobles de la persona i «Multimèdia». Els fitxers
   del Perfil que la peça crea o toca i que cap altra porta no lintava: ESLint
   amb la configuració del projecte i zero missatges, avisos inclosos
   (l'equivalent de --max-warnings=0), i les comprovacions de Pedra Seca per
   text. Calcada de qualitat.avatarFontUnica.test.js i qualitat.logotip.test.js.
   DetallCompte.jsx, perfilModel.js i fitxaDePerfil.test.js ja els linta
   qualitat.avatarFontUnica.test.js; PerfilEditor.jsx, qualitat.logotip.test.js;
   PerfilShell.jsx, src/components/universal/workspace/qualitat.test.js.
   fitxaDePerfil.js també el linta qualitat.boinaAlPerfil.test.js: ací hi és pels
   vetos de Pedra Seca. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

const FITXERS = Object.freeze([
  'src/sections/profile/DetallMultimedia.jsx',
  'src/sections/profile/DetallMultimedia.test.jsx',
  'src/sections/profile/DetallAjust.jsx',
  'src/sections/profile/DetallAjust.test.jsx',
  'src/sections/profile/DetallPrivacitat.jsx',
  'src/sections/profile/DetallEspai.jsx',
  'src/sections/profile/perfilCamps.js',
  'src/sections/profile/perfilCamps.test.js',
  'src/sections/profile/visibilitatFitxa.js',
  'src/sections/profile/fitxaDePerfil.js',
  'src/sections/profile/PerfilContext.jsx',
  'src/sections/profile/PerfilContext.test.jsx',
  'src/sections/profile/DialegNovaOrganitzacio.jsx',
  'src/sections/profile/DialegNovaOrganitzacio.test.jsx',
  'src/sections/profile/PerfilShell.test.jsx',
  'src/sections/profile/PerfilShell.nomPoble.test.jsx',
  'src/sections/profile/qualitat.perfilPublicMultimedia.test.js',
  /* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punts 3 i 5) · «Multimèdia»
     per a cada actor, el visor de l'Arxiu amb les props del Perfil i el cens. Les
     peces de producció (VisorDeLArxiu.jsx, MultimediaSection.jsx, censImatges.js)
     ja les linta PedraSeca/qualitat.visor.test.js; perfilModel.js,
     qualitat.avatarFontUnica.test.js; PerfilShell.jsx, el de workspace/. */
  'src/sections/multimedia/VisorDeLArxiu.test.jsx',
  'src/sections/profile/PerfilShell.espai.test.jsx',
  'src/sections/profile/PerfilShell.targetaViva.test.jsx',
  'src/sections/profile/perfilModel.icones.test.js',
  'src/sections/profile/perfilModel.imatge.test.js',
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
  test('fora de proves: cap style=, cap hex, cap :has(), res fora del Baseline 2022, cap localStorage', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/#(?!(?:000|fff|ff7300|0984e3)\b)[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [/:has\(/, ':has()'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind'],
      [/\b(?:local|session)Storage\s*[.[]/, 'emmagatzematge del navegador'],
    ];
    const trobats = FITXERS.filter((f) => !esProva(f)).flatMap((fitxer) => {
      const codi = llig(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('«Multimèdia» i els pobles de la persona, només amb peces de Pedra Seca: cap <button> ni <input> crus', () => {
    const multimedia = llig('src/sections/profile/DetallMultimedia.jsx');
    /* Expectativa actualitzada a propòsit: relleu del Pla 2000, punt 3 · l'únic
       <button> cru és el disparador del visor de la casa (.sdp-visor__obridor,
       components.css), el mateix de detail/VisorDePublicacio.jsx: un embolcall
       transparent de la miniatura, no cap botó de Pedra Seca. */
    const disparador = /<button\s+type="button"\s+className="sdp-visor__obridor"/g;
    expect((multimedia.match(/<button\b/g) || []).length).toBe(1);
    expect(multimedia.match(disparador)).toHaveLength(1);
    expect(multimedia.replace(disparador, '')).not.toMatch(/<button\b|<input\b|className="sdp-boto/);
    expect(multimedia).toMatch(/\bBoto\b/);
    expect(multimedia).toMatch(/\bDialegConfirmacio\b/);
    const ajust = llig('src/sections/profile/DetallAjust.jsx');
    const pobles = ajust.slice(ajust.indexOf('function renderitzaPobles('), ajust.indexOf('function renderitzaFormulari('));
    expect(pobles.length).toBeGreaterThan(0);
    expect(pobles).not.toMatch(/<button\b|<input\b|className="sdp-boto/);
  });

  test('les fonts úniques: la foto pròpia, d’utils/sanitize.js; res de l’app; l’Arxiu visual, només per titularitat explícita', () => {
    for (const fitxer of ['src/sections/profile/fitxaDePerfil.js', 'src/sections/profile/DetallMultimedia.jsx']) {
      const codi = llig(fitxer);
      expect(codi).not.toMatch(/from '\.\.\/\.\.\/app\/contexts\//);
      expect(codi).not.toMatch(/esAvatarProveidorOAuth|esAvatarExternOAuth|PATRO_PROVEIDOR_OAUTH/);
      expect(codi).toMatch(/from '\.\.\/\.\.\/utils\/sanitize\.js'/);
    }
    /* Expectativa actualitzada a propòsit: ordre del Mestre (18-10-2026, relleu del
       Pla 2000, punt 3) · l'Arxiu visual hi torna (useMultimedia), però només
       filtrat per titularitat explícita (arxiuDeLActor · titularDelMitja). */
    const multimedia = llig('src/sections/profile/DetallMultimedia.jsx');
    expect(multimedia).not.toMatch(/config\/storage/);
    expect(multimedia).toMatch(/arxiuDeLActor\(mediaItems, idsActor, mena\)/);
    // Dins del component, l'Arxiu només es llig per a passar-lo per arxiuDeLActor.
    const component = multimedia.slice(multimedia.indexOf('export function DetallMultimedia('));
    expect(component.match(/\bmediaItems\b/g)).toEqual(['mediaItems', 'mediaItems', 'mediaItems']);
    expect(component).toMatch(/const \{ mediaItems \} = useMultimedia\(\);/);
    // L'avís de la fitxa pública té una sola font.
    const avis = 'La teua fitxa és pública perquè el veïnat et puga trobar.';
    const amb = FITXERS.filter((f) => !esProva(f) && llig(f).includes(avis));
    expect(amb).toEqual(['src/sections/profile/visibilitatFitxa.js']);
  });
});
