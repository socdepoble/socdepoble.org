// @vitest-environment node
/* Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «Esta lògica de
   llistar elements de la categoria per a l'avatar actiu ha d'estar disponible
   per tot el sistema») · qualitat de la peça «històric de l'actor»: ESLint
   amb la configuració del projecte i zero missatges (avisos inclosos) sobre
   cada fitxer que crea o toca, i les comprovacions de Pedra Seca i del Model B
   per text. Patró de notes/qualitat.masLector.test.js. NotesSection.jsx i
   NotesEditor.jsx ja són al cens de notes/qualitat.test.js, i
   PublicacioDetall.jsx al de notes/qualitat.masLector.test.js. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

const FITXERS = Object.freeze([
  'src/components/universal/PageFrame.jsx',
  'src/components/universal/PageFrame.peuDePagina.test.jsx',
  'src/components/universal/DocumentEditor.peuDePagina.test.jsx',
  'src/sections/mur/PublicacionsDeLActor.jsx',
  'src/sections/mur/PublicacionsDeLActor.test.jsx',
  'src/sections/mur/usePublicacionsDeLActor.js',
  'src/sections/mur/usePublicacionsDeLActor.test.jsx',
  'src/sections/mur/qualitat.publicacionsActor.test.js',
  'src/sections/mercat/TargetaDelMercat.jsx',
  'src/sections/mercat/TargetaDelMercat.test.jsx',
  'src/sections/mercat/MercatSection.jsx',
  'src/sections/notes/NotesDetail.jsx',
  'src/sections/notes/NotesEditor.peuDePagina.test.jsx',
  'src/sections/notes/NotesSection.peuDePagina.test.jsx',
  'src/sections/notes/PublicacioDetall.peuDePagina.test.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenPublicacionsDeLActor.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenPublicacionsDeLActor.test.jsx',
  'src/sections/disseny/cataleg/manifest.js',
  'src/sections/disseny/cataleg/registre.js',
  'src/sections/disseny/cataleg/detailRegistry.jsx'
]);

/* Les peces noves: cap h1 (només el títol de la pàgina en porta). */
const PECES_NOVES = Object.freeze([
  'src/sections/mur/PublicacionsDeLActor.jsx',
  'src/sections/mur/usePublicacionsDeLActor.js',
  'src/sections/mercat/TargetaDelMercat.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenPublicacionsDeLActor.jsx'
]);

const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (f) => /\.test\.jsx?$/.test(f);
/* El codi sense els comentaris de bloc (també els {/* … *\/} del JSX): els
   comentaris nomenen formes vetades per a explicar per què no hi són. */
const codiDe = (ruta) => llig(ruta).replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

test('tots els fitxers del lot existixen', () => {
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
      const codi = codiDe(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('les peces noves no porten cap h1', () => {
    /* Relleu 261008 · Design Guard busca l'obertura de l'etiqueta pel text,
       sense AST, i també escaneja les proves: la classe [h] casa el mateix però
       no escriu l'etiqueta. */
    expect(PECES_NOVES.filter((f) => /<[h]1[\s>]|'h1'/.test(llig(f)))).toEqual([]);
  });

  test('la ranura té classe pròpia, dins de @layer components, amb tokens i sense cap punt de tall', () => {
    const utilitats = net(llig('src/css/utilities.css'));
    const regla = '.sdp-pagina-peu { flex: none; width: 100%; padding: 0 var(--sdp-pad-contenidor) var(--sdp-pad-contenidor); }';
    expect(utilitats).toContain(regla);
    const capa = utilitats.slice(utilitats.indexOf('@layer components {'), utilitats.indexOf('@layer utilities {'));
    expect(capa).toContain(regla);
    /* No reutilitza .content-wrapper (flex: 1 0 auto es repartiria l'espai amb l'article). */
    expect(net(llig('src/components/universal/PageFrame.jsx'))).toContain('<section className="sdp-pagina-peu" aria-label={etiquetaPeuDePagina || undefined}>');
  });
});

describe('Model B i maquinària existent', () => {
  test('cap import d’un adaptador del proveïdor: tot passa pel port (el Mur)', () => {
    const trobats = FITXERS.filter((f) => !esProva(f)).filter((f) => /from '[^']*data\/(?:supabase|adaptadors)\//.test(llig(f)));
    expect(trobats).toEqual([]);
  });

  test('el hook reutilitza itemsPublicatsDe, aliesDeLActor, useMur i l’ordre del Mur; cap targeta nova', () => {
    const hook = codiDe('src/sections/mur/usePublicacionsDeLActor.js');
    for (const peca of ['itemsPublicatsDe(', 'aliesDeLActor(', 'useMur()', 'momentDeLaTargeta(', 'perMomentDescendent', 'acteAEsdeveniment(', 'normalizeBackendConfig(']) {
      expect(hook, peca).toContain(peca);
    }
    /* Sense D2: les publicacions del Mur nascudes d'una nota sí que ixen. */
    expect(hook).not.toMatch(/publicadesDesDeNotes\s*[:}]/);
    const component = codiDe('src/sections/mur/PublicacionsDeLActor.jsx');
    expect(component).toMatch(/<TargetaDelMercat\b/);
    expect(component).toMatch(/<TargetaDelMur\b/);
    expect(component).toMatch(/<GraellaTargetes\b/);
    expect(component).not.toMatch(/<UniversalCard\b/);
  });
});
