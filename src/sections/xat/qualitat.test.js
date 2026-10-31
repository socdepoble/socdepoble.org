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
  'src/sections/xat/useObriXatPerDefecte.js',
  /* Onada 6 · El xat per als beta testers i la identitat de la IAIA: el
     nivell d'IA viu, «Informa d'un error», els errors SDP traduïts i les
     seues proves. */
  'src/sections/realitat/useNivellIaia.js',
  'src/sections/realitat/useNivellIaia.test.jsx',
  'src/sections/xat/contactesAjuda.js',
  'src/sections/xat/errorsXat.js',
  'src/sections/xat/errorsXat.test.js',
  'src/sections/xat/informeDError.js',
  'src/sections/xat/informeDError.test.js',
  'src/sections/xat/useInformaDUnError.js',
  'src/sections/xat/XatContext.nivellIaia.test.jsx',
  'src/sections/xat/XatSection.onada6.test.jsx',
  'src/sections/xat/components/BotoInformaDUnError.jsx',
  'src/sections/xat/components/DialegNovaConversa.iaia.test.jsx',
  'src/sections/xat/components/FakeChatOnboarding.iaia.test.jsx',
  'src/data/supabase/xat.iaia.test.js',
  'src/components/PedraSeca/atoms/Avatar.enquadrament.test.jsx',
  /* Revisió 261009 · La bombolla en error amb el codi SDP traduït. */
  'src/sections/xat/components/Bombolla.codiError.test.jsx',
  /* Gauntlet 261016 (Bloc 3.6) · Els quatre actors permanents i la IAIA a
     localhost: la regla neutra, el poble del xat i les seues proves. */
  'src/data/xatsPerDefecte.js',
  'src/data/xatsPerDefecte.test.js',
  'src/sections/xat/pobleAmfitrio.js',
  'src/sections/xat/XatSection.actorsPermanents.test.jsx',
  /* Gauntlet 261016_1530 (Bloc 3.6, ordre vigent) · L'ordre estricte dels
     quatre actors, la fila que porta a la comunitat de Sóc de Poble i les
     rutes canòniques de les capçaleres. */
  'src/sections/xat/actorsDelXat.js',
  'src/sections/xat/actorsDelXat.test.js',
  /* Gauntlet 261016_1530 (Bloc 3.6.3) · El nom de la IAIA a la bombolla porta
     a la seua fitxa, /iaia. */
  'src/sections/xat/components/Bombolla.autor.test.jsx',
  /* Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25) · Les rutes de la Wiki que
     cita la IAIA local són enllaços interns a la seua bombolla. */
  'src/sections/xat/components/Bombolla.wiki.test.jsx',
  /* IDEA-53 (pla 261029_1605, Bloc B) · La negreta del xat: el mòdul pur
     (sense lookbehind, Baseline Safari 16.0) i les seues proves. */
  'src/sections/xat/negreta.js',
  'src/sections/xat/negreta.test.js',
  'src/sections/xat/components/Bombolla.negreta.test.jsx',
  'src/sections/xat/components/Compositor.negreta.test.jsx',
  /* P1-12 pas 17 (pla 261029_1605, C.1; D-09) · L'avís d'OBLIT_FALLIT que
     XatContext pinta en eixir i la seua prova. */
  'src/sections/xat/components/AvisOblitXat.jsx',
  'src/sections/xat/components/AvisOblitXat.test.jsx',
  /* Gauntlet del Bloc B (QA-B01..B03, onada 261029_1605) · La tokenització
     única d'adreces i marques de negreta (tokenitzaText): sense lookbehind
     ni res fora del Baseline, i les seues proves. */
  'src/sections/xat/enllacos.js',
  'src/sections/xat/enllacos.test.js',
  /* IDEA-56 (pla 261029_1605, Bloc F.2) · El cervell local de la IAIA al xat
     de mostra i la seua resposta local, etiquetada, al grup públic de /iaia. */
  'src/sections/xat/components/FakeChatOnboarding.iaiaLocal.test.jsx',
  'src/sections/xat/components/Conversa.iaiaLocal.test.jsx'
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
