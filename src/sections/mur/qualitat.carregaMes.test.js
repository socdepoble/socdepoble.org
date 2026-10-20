// @vitest-environment node
/* Decisió 4 del Mestre (261007) · «Tall de 50 publicacions: CARREGA
   PROGRESSIVA (LOAD MORE).» (ADR-2026-11-PAGINACIO-SECCIONS) · qualitat de la
   peça «carrega-mes»: ESLint amb la configuració del projecte i zero missatges
   (avisos inclosos, l'equivalent de --max-warnings=0) sobre cada fitxer que
   crea o toca, i les comprovacions del Model B, de Pedra Seca i de la
   maquinària existent per text. Patró de qualitat.publicacionsActor.test.js.
   contracte.js i backendPort.js ja són també al cens de src/data/qualitat.test.js,
   kit.js al de src/data/conformitat/qualitat.test.js, MurContext.jsx al de
   src/app/contexts/qualitat.renovacio.test.js i MurSection.jsx al de
   src/components/universal/barres/qualitat.comentar.test.js: ací hi tornen
   perquè la peça sencera tinga una sola porta. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

const FITXERS = Object.freeze([
  'src/data/contracte.js',
  'src/data/backendPort.js',
  'src/data/conformitat/kit.js',
  'src/data/conformitat/kit.test.js',
  'src/data/supabase/content.js',
  'src/data/supabase/content.paginacio.test.js',
  'src/data/supabase/conformitat.test.js',
  'src/sections/mur/MurContext.jsx',
  'src/sections/mur/MurContext.test.jsx',
  'src/sections/mur/MurSection.jsx',
  'src/sections/mur/MurSection.carregaMes.test.jsx',
  'src/sections/mercat/MercatSection.jsx',
  'src/sections/mercat/MercatSection.carregaMes.test.jsx',
  'src/sections/mur/qualitat.carregaMes.test.js'
]);

/* La interfície de la peça: parla amb el backend només pel port. */
const INTERFICIE = Object.freeze([
  'src/sections/mur/MurContext.jsx',
  'src/sections/mur/MurSection.jsx',
  'src/sections/mercat/MercatSection.jsx'
]);
const PAGINES = Object.freeze(['src/sections/mur/MurSection.jsx', 'src/sections/mercat/MercatSection.jsx']);
/* Relleu 261008 (revisió adversarial) · El reintent de cada pàgina: el Mur
   només torna a demanar les seccions que han fallat (reintentaMes); el
   Mercat en té una sola, i el reintent és el mateix «Mostra més». */
const REINTENT = Object.freeze({ 'src/sections/mur/MurSection.jsx': 'reintentaMes', 'src/sections/mercat/MercatSection.jsx': 'mostraMes' });

const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
/* El codi sense els comentaris de bloc (també els {/* … *\/} del JSX): els
   comentaris nomenen formes vetades per a explicar per què no hi són. */
const codiDe = (ruta) => llig(ruta).replace(/\/\*[\s\S]*?\*\//g, '');

test('tots els fitxers de la peça existixen', () => {
  expect(FITXERS.filter((f) => !existsSync(path.join(ARREL, f)))).toEqual([]);
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís compta com a error).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/mur/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Model B', () => {
  test('la interfície no importa cap adaptador: tot passa pel port', () => {
    const trobats = INTERFICIE.filter((f) => /from '[^']*data\/(?:supabase|adaptadors)\//.test(llig(f)));
    expect(trobats).toEqual([]);
    expect(codiDe('src/sections/mur/MurContext.jsx')).toMatch(/\bloadSeccioPage\b[^;]*from '\.\.\/\.\.\/data\/backendPort\.js'/);
  });

  test('la capacitat és opcional: fora del nucli, i la interfície la pregunta amb teCapacitat', () => {
    const contracte = codiDe('src/data/contracte.js');
    const nucli = contracte.slice(contracte.indexOf('CONTRACTE_NUCLI'), contracte.indexOf(']);'));
    expect(nucli).not.toContain('loadSeccioPage');
    expect(contracte).toMatch(/paginacioSeccions: Object\.freeze\(\['loadSeccioPage'\]\)/);
    expect(codiDe('src/sections/mur/MurContext.jsx')).toContain("teCapacitat('paginacioSeccions')");
  });

  test('l’adaptador no porta lògica de producte: cap text de la interfície ni cap botó', () => {
    const adaptador = codiDe('src/data/supabase/content.js');
    expect(adaptador).not.toMatch(/Mostra més|loadMore|carregaMes|hiHaMes/);
  });
});

describe('Pedra Seca i maquinària existent', () => {
  test('fora de proves: cap style=, cap hex, cap :has(), res fora del Baseline 2022', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [/:has\(/, ':has()'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    const trobats = FITXERS.filter((f) => !/\.test\.jsx?$/.test(f)).flatMap((fitxer) => {
      const codi = codiDe(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('el botó és el Boto canònic amb la clau que ja existia i l’avís és EstatErrorDades; cap classe nova', () => {
    for (const pagina of PAGINES) {
      const codi = codiDe(pagina);
      expect(codi, pagina).toMatch(/<Boto carregant=\{[^}]+\} onClick=\{mostraMes\}>\{t\('section\.mur\.loadMore', 'Mostra més'\)\}<\/Boto>/);
      expect(codi, pagina).toMatch(new RegExp(`<EstatErrorDades [^>]*onReintenta=\\{${REINTENT[pagina]}\\}`));
      expect(codi, pagina).toContain('className="sdp-camp sdp-camp--centrat"');
      expect(codi, pagina).not.toMatch(/<button\b/);
    }
    // La clau ja era al diccionari en les cinc llengües: la peça no n'afig cap.
    const diccionaris = ['ca', 'es', 'en', 'eu', 'gl'].map((codi) => llig(`src/config/idiomes/${codi}.js`)).join('\n');
    expect(diccionaris.match(/'section\.mur\.loadMore':/g)).toHaveLength(5);
    // Les classes del bloc del botó ja són al full de components.
    expect(llig('src/css/components.css')).toContain('.sdp-camp--centrat { align-items: center; }');
  });
});
