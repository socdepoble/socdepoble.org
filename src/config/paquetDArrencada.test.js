// @vitest-environment node
/* P1-20 · D15 (Assalt 10/10, T4a, 261101) · El tros d'entrada del web per
   davall de 250 kB gzip sense canviar cap píxel. Guardes sense build:
     · trossDArrencada (vite.config.js) trau de l'entrada, a trossos que
       també es carreguen a l'arrencada, l'estil en text, el diccionari
       valencià, React i DOMPurify; res més;
     · la clausura d'importacions ESTÀTIQUES de les tres entrades (web,
       paquet i app) no arriba a cap mòdul que ha de ser diferit: la Wiki
       compilada, la geo de les fotos i l'EXIF, els altres diccionaris, el
       contingut de les pàgines, l'adaptador de Supabase, TipTap, Leaflet;
     · (T4a-C) la de la Consola tampoc arriba a la Wiki compilada: el detall
       d'una peça la demana amb import() (data/carregaWikiManifest.js).
   El pes real el diu `npm run build` (la línia de dist/assets/index-*.js). */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { beforeAll, describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => fs.readFileSync(path.join(ARREL, ruta), 'utf8');

describe('trossDArrencada (vite.config.js)', () => {
  const CASOS = [
    ['/x/node_modules/react/index.js', 'react'],
    ['/x/node_modules/react/jsx-runtime.js', 'react'],
    ['/x/node_modules/react-dom/cjs/react-dom.production.min.js', 'react'],
    ['/x/node_modules/scheduler/index.js', 'react'],
    ['/x/node_modules/dompurify/dist/purify.es.mjs', 'dompurify'],
    ['C:\\x\\node_modules\\react-dom\\client.js', 'react'],
    ['/x/node_modules/react-dom/index.js', 'react'],
    // El servidor i les utilitats de prova de react-dom mai no baixen a l'arrencada.
    ['/x/node_modules/react-dom/server.browser.js', null],
    ['/x/node_modules/react-dom/cjs/react-dom-server.browser.production.min.js', null],
    ['/x/node_modules/react-dom/cjs/react-dom-server-legacy.browser.production.min.js', null],
    ['/x/node_modules/react-dom/test-utils.js', null],
    ['/x/src/css/index.css?inline', 'estils'],
    ['/x/src/config/idiomes/ca.js', 'ca'],
    ['/x/src/sections/pobles/poblesAplecViquipedia.js', 'pobles-aplec'],
    ['/x/src/sections/mur/articles/aplec2023Content.js', 'pobles-aplec'],
    ['/x/src/sections/mur/articles/manifestDePobleContent.js', 'pobles-aplec'],
    ['/x/src/data/taxonomia/indexArticlesImportats.js', 'pobles-aplec'],
    ['/x/src/data/taxonomia/vocabulariCanonic.js', 'pobles-aplec'],
    ['/x/src/data/taxonomia/taxonomiaCanonica.js', null],
    ['/x/src/sections/pobles/pobleDeViquipedia.js', null],
    // IDEA-116 (Onada R9, R9V-C2-01) · la primera publicació del Mur no baixa a l'arrencada: tros diferit.
    ['/x/src/sections/mur/articles/novesTecnologiesCulturaRuralContent.js', null],
    ['/x/node_modules/lucide-react/dist/esm/icons/house.mjs', null],
    ['/x/node_modules/react-is/index.js', null],
    ['/x/node_modules/@tiptap/core/dist/index.js', null],
    ['/x/node_modules/some-pkg/node_modules/react/index.js', 'react'],
    ['/x/src/css/index.css', null],
    ['/x/src/sections/mur/MapaFotografic.css?inline', null],
    ['/x/src/config/idiomes/es.js', null],
    ['/x/src/data/wikiManifest.js', null],
    ['\0vite/preload-helper.js', null]
  ];
  let trossos;
  let delBuild;
  /* En un procés a part, com versio.test.js: avaluar vite.config.js dins de
     Vitest hi carregaria Vite i els connectors. La configuració s'avalua com
     la de `vite build` (no se'n llig el text): un manualChunks comentat, o un
     `build` sobreescrit més avall, hi canvia el valor. Les credencials
     públiques són sintètiques (validatePublicCredentials les exigix en
     compilar) i manen sobre les de qualsevol .env. */
  beforeAll(() => {
    const codi = `const { default: config, trossDArrencada } = await import('./vite.config.js');
const resolta = typeof config === 'function' ? await config({ command: 'build', mode: 'production', isPreview: false }) : config;
const eixida = resolta?.build?.rollupOptions?.output;
console.log(JSON.stringify({
  trossos: ${JSON.stringify(CASOS.map(([id]) => id))}.map((id) => trossDArrencada(id) ?? null),
  build: { esObjecte: Boolean(eixida) && !Array.isArray(eixida), manualChunks: eixida?.manualChunks === trossDArrencada }
}));`;
    const { status, stdout, stderr } = spawnSync(process.execPath, ['--input-type=module', '-e', codi], {
      cwd: ARREL,
      encoding: 'utf8',
      env: { ...process.env, VITEST: '', VITE_SUPABASE_URL: 'https://abc.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_fixturesintetica' },
      timeout: 60000
    });
    expect(status, stderr).toBe(0);
    ({ trossos, build: delBuild } = JSON.parse(stdout.trim().split('\n').at(-1)));
  }, 60000);

  test.each(CASOS.map(([id, tros], i) => [id, tros, i]))('%s → %s', (_id, tros, i) => {
    expect(trossos[i]).toBe(tros);
  });

  test('la configuració de `vite build` la fa servir com a manualChunks d’una eixida única', () => {
    expect(delBuild).toEqual({ esObjecte: true, manualChunks: true });
  });

  /* L'ordre d'avaluació: els trossos manuals s'avaluen abans que la resta de
     l'entrada. Només és innocu si són fulles: el diccionari no importa res, i
     React i DOMPurify no depenen de cap paquet de fora del tros 'react'. */
  test('els trossos d’arrencada són fulles: no arrosseguen cap mòdul de fora', () => {
    expect(especificadors(path.join(ARREL, 'src/config/idiomes/ca.js'))).toEqual([]);
    expect(especificadors(path.join(ARREL, 'src/sections/pobles/poblesAplecViquipedia.js'))).toEqual([]);
    expect(especificadors(path.join(ARREL, 'src/sections/mur/articles/aplec2023Content.js'))).toEqual([]);
    expect(especificadors(path.join(ARREL, 'src/sections/mur/articles/manifestDePobleContent.js'))).toEqual([]);
    expect(especificadors(path.join(ARREL, 'src/data/taxonomia/indexArticlesImportats.js'))).toEqual([]);
    expect(especificadors(path.join(ARREL, 'src/data/taxonomia/vocabulariCanonic.js'))).toEqual([]);
    const dependencies = (paquet) => Object.keys(JSON.parse(llig(`node_modules/${paquet}/package.json`)).dependencies ?? {})
      // loose-envify és una transformació de browserify: cap import en temps d'execució.
      .filter((nom) => nom !== 'loose-envify');
    expect(['react', 'react-dom', 'scheduler'].flatMap(dependencies).filter((nom) => !['react', 'scheduler'].includes(nom))).toEqual([]);
    expect(dependencies('dompurify')).toEqual([]);
  });
});

/* La clausura estàtica: import i export … from (no import()), àlies @/,
   extensions i index implícits, la consulta (?inline, ?raw) fora, i els
   import.meta.glob amb eager: true, que també són estàtics. Un mòdul que
   entra com a text (?raw, o un glob amb `query`) hi compta, però no
   s'executa: les seues importacions no es seguixen. Els paquets d'npm es
   nomenen per si mateixos, sense recórrer-los. */
const EXTENSIONS = ['', '.js', '.jsx', '.mjs', '/index.js', '/index.jsx'];
function resol(des, especificador) {
  const net = especificador.replace(/\?.*$/, '');
  let base = null;
  if (net.startsWith('@/')) base = path.join(ARREL, 'src', net.slice(2));
  else if (net.startsWith('.')) base = path.resolve(path.dirname(des), net);
  else if (net.startsWith('/src/')) base = path.join(ARREL, net);
  if (!base) return { paquet: net.startsWith('@') ? net.split('/').slice(0, 2).join('/') : net.split('/')[0] };
  for (const ext of EXTENSIONS) {
    const fitxer = base + ext;
    if (fs.existsSync(fitxer) && fs.statSync(fitxer).isFile()) return { fitxer };
  }
  return {};
}
const esText = (especificador) => /\?(?:raw|url)\b/.test(especificador);
const propietat = (objecte, nom) => objecte?.properties?.find((p) => p.key?.name === nom)?.value;
function especificadors(fitxer) {
  if (!/\.(m?js|jsx)$/.test(fitxer)) return [];
  const arbre = parse(fs.readFileSync(fitxer, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  const trobats = [];
  const visita = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visita); return; }
    if ((node.type === 'ImportDeclaration' || node.type === 'ExportAllDeclaration' || node.type === 'ExportNamedDeclaration') && node.source) {
      trobats.push({ especificador: node.source.value, text: esText(node.source.value) });
    }
    if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression' && node.callee.object?.type === 'MetaProperty'
      && node.callee.property?.name === 'glob' && propietat(node.arguments[1], 'eager')?.value === true) {
      const patrons = node.arguments[0].type === 'ArrayExpression' ? node.arguments[0].elements.map((e) => e.value) : [node.arguments[0].value];
      const text = Boolean(propietat(node.arguments[1], 'query'));
      const exclude = patrons.filter((p) => p.startsWith('!')).map((p) => p.slice(1));
      for (const patro of patrons.filter((p) => !p.startsWith('!'))) {
        for (const trobat of fs.globSync(patro, { cwd: path.dirname(fitxer), exclude })) trobats.push({ especificador: `./${trobat}`, text });
      }
    }
    for (const [clau, valor] of Object.entries(node)) if (!['loc', 'start', 'end', 'extra'].includes(clau)) visita(valor);
  };
  visita(arbre.program);
  return trobats;
}
function clausura(entrada) {
  const inici = path.join(ARREL, entrada);
  const fitxers = new Set([inici]);
  // Un fitxer que arriba primer com a text i després com a mòdul es recorre igual.
  const moduls = new Set([inici]);
  const paquets = new Set();
  const cua = [inici];
  while (cua.length) {
    const actual = cua.shift();
    for (const { especificador, text } of especificadors(actual)) {
      const { fitxer, paquet } = resol(actual, especificador);
      if (paquet) paquets.add(paquet);
      if (!fitxer) continue;
      fitxers.add(fitxer);
      if (!text && !moduls.has(fitxer)) { moduls.add(fitxer); cua.push(fitxer); }
    }
  }
  return { fitxers: new Set([...fitxers].map((f) => path.relative(ARREL, f).split(path.sep).join('/'))), paquets };
}

const WIKI = 'src/data/wikiManifest.js';
const DIFERITS = [
  WIKI,
  'src/sections/notes/geoDeLesFotos.js',
  'src/components/universal/enquadrament/exif.js',
  'src/components/universal/enquadrament/exifIncrustat.js',
  'src/config/idiomes/es.js', 'src/config/idiomes/en.js', 'src/config/idiomes/eu.js', 'src/config/idiomes/gl.js',
  'src/sections/text/pageContent.js',
  'src/data/supabase/index.js',
  'src/sections/disseny/cataleg/dades/emojisUnicode18.js',
  // P0-61 / IDEA-192 · El Brain de categories i etiquetes, el seu model i el graf.
  'src/sections/taxonomia/BrainTaxonomia.jsx', 'src/data/taxonomia/brainTaxonomia.js',
  'src/components/universal/graph/BrainGraph.jsx',
  /* Onada R14 · El receptari «Què dinem?»: les dades (149 receptes, ~205 KB), les dues seccions i els seus textos
     en 5 llengües només es baixen a /page/receptes i a /receptes/:slug (les claus de la interfície són al
     diccionari valencià, que és un tros d'arrencada propi i no compta en l'entrada). */
  'src/data/patrimoni/queDinem.js',
  'src/sections/patrimoni/ReceptesQueDinemSection.jsx', 'src/sections/patrimoni/ReceptaDetailSection.jsx',
  'src/sections/patrimoni/cercaReceptes.js', 'src/sections/patrimoni/CreditsQueDinem.jsx', 'src/sections/text/pageContent.patrimoniR14.js'
];
const PAQUETS_DIFERITS = ['@tiptap/core', '@tiptap/react', '@tiptap/starter-kit', 'leaflet', '@supabase/supabase-js'];

describe.each(['src/main.jsx', 'src/embed.jsx', 'src/natiu/entrada.jsx'])('la clausura estàtica de %s', (entrada) => {
  let graf;
  beforeAll(() => { graf = clausura(entrada); });

  test('arriba al que l’arrencada necessita (la prova no és buida)', () => {
    expect(graf.fitxers.size).toBeGreaterThan(200);
    expect(graf.fitxers.has('src/css/index.css')).toBe(true);
    expect(graf.fitxers.has('src/config/idiomes/ca.js')).toBe(true);
    // Qui publica (i demana la geo amb import()) sí que hi és.
    expect(graf.fitxers.has('src/sections/notes/NotesContext.jsx')).toBe(true);
    expect(graf.paquets.has('react')).toBe(true);
  });

  test('no arriba a cap mòdul diferit', () => {
    expect(DIFERITS.filter((f) => graf.fitxers.has(f))).toEqual([]);
    expect(PAQUETS_DIFERITS.filter((p) => graf.paquets.has(p))).toEqual([]);
  });
});

describe('la clausura estàtica de la Consola (T4a-C)', () => {
  let graf;
  beforeAll(() => { graf = clausura('src/sections/consola/ConsolaSection.jsx'); });

  /* P0-61 / IDEA-192 · Expectativa actualitzada a posta: BrainGraph ja és diferit
     (React.lazy a ExploradorMapa.jsx i a BrainTaxonomia.jsx), amb tros propi que
     compartixen la Consola i el Brain de taxonomia. La prova continua sense ser
     buida per l'Explorador del Mapa, que és qui pinta el graf. */
  test('arriba al detall d’una peça i a l’Explorador (la prova no és buida)', () => {
    expect(graf.fitxers.has('src/sections/consola/mapa/DetallPeca.jsx')).toBe(true);
    expect(graf.fitxers.has('src/sections/consola/mapa/ExploradorMapa.jsx')).toBe(true);
    expect(graf.fitxers.has('src/data/carregaWikiManifest.js')).toBe(true);
  });

  test('no arriba al graf ni al Brain de taxonomia, que són diferits (P0-61)', () => {
    expect(graf.fitxers.has('src/components/universal/graph/BrainGraph.jsx')).toBe(false);
    expect(graf.fitxers.has('src/sections/taxonomia/BrainTaxonomia.jsx')).toBe(false);
    expect(graf.fitxers.has('src/data/taxonomia/tesaurusDoctoralSocDePoble.js')).toBe(false);
  });

  test('no arriba a la Wiki compilada', () => {
    expect(graf.fitxers.has(WIKI)).toBe(false);
  });
});
