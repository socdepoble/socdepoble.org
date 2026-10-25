import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { deflateRawSync, gzipSync as zlibGzip } from 'node:zlib';
const zlibDeflateRaw = (dades) => deflateRawSync(dades, { level: 9 });
import { parseAst } from 'rollup/parseAst';
import { build } from 'vite';
import { JSDOM, VirtualConsole } from 'jsdom';

import { createHash, randomBytes } from 'node:crypto';
import configStandalone, {
  CARPETA_DE_TROSSOS,
  CONTRACTE_AMFITRIO,
  DIRECTORI_DE_VITE,
  ENTRADA_DEL_PAQUET,
  ESQUEMA_RELEASE,
  FITXER_INVENTARI,
  FITXER_RELEASE,
  FORMATS_DEL_PAQUET,
  LIMIT_DEL_CARREGADOR,
  MODUL_DELS_TROSSOS,
  PROPIS_DEL_LLOC,
  codiDelCarregador,
  descripcioDelPaquet,
  errorsDeRelease,
  espaisDelPaquetPlugin,
  esHostLocal,
  formatDelPaquet,
  manifestDeRelease,
  manifestDeReleasePlugin,
  nodeSegellat,
  origenDeMitjans,
  politicaDeMitjans,
  recursosDelPlugin,
  recursosPublicsDelPlugin,
  retiraPropisDelLloc,
  versioDelBuild
} from '../vite.standalone.config.js';
import { CONTRACTE_AMFITRIO_V1 } from '../src/config/contracteAmfitrio.js';
import { MARCA_DEL_CARREGADOR } from '../src/config/carregadorDelPaquet.js';
import { ADAPTADOR, LIMIT_DIRECTORI, SLUG, empaqueta, llegixZip, verificaInventari, verificaPaquet } from '../wordpress-plugin/eines/empaqueta.mjs';
import { MITJANS_EXTERNS_DEL_DIRECTORI, bessonaDe, bessonesDe, separaRecursos } from '../src/config/politicaDeMitjans.js';

/* public/ de mostra: el que viatja i el que és propi del servidor del lloc. */
const VIATGEN = [
  'assets/system/ui/logo.svg',
  'assets/towns/a/1.jpg',
  'components/c.js',
  'fonts/x.css',
  'rag-index.json',
  'slugIndex.json'
];
const ES_QUEDEN = [
  '.DS_Store',
  '.htaccess',
  'assets/.DS_Store',
  'auth/callback.html',
  'robots.txt',
  'sitemap.xml'
];

function publicDeMostra(extra = []) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-standalone-'));
  for (const rel of [...VIATGEN, ...ES_QUEDEN, ...extra]) {
    const abs = path.join(arrel, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `contingut de ${rel}`);
  }
  return arrel;
}

/** Executa el plugin com ho faria Rollup i torna el que ha emés. */
function emet(plugin, config = { publicDir: '' }) {
  const emesos = [];
  plugin.configResolved(config);
  plugin.generateBundle.call({ emitFile: (f) => { emesos.push(f); return f.fileName; } }, {}, {});
  return emesos;
}

test('emet tot public/ excepte els ocults, robots.txt, sitemap.xml i auth/ de l\'arrel', () => {
  const arrel = publicDeMostra();
  try {
    const plugin = recursosPublicsDelPlugin({ directori: arrel });
    assert.equal(plugin.name, 'sdp-recursos-publics');
    assert.equal(plugin.apply, 'build');
    const emesos = emet(plugin);
    assert.deepEqual(emesos.map((f) => f.fileName).sort(), [...VIATGEN].sort());
    for (const f of emesos) {
      assert.equal(f.type, 'asset');
      // Sense `name`: el manifest de Vite no l'indexa i l'entrada continua sent l'única.
      assert.equal(f.name, undefined);
      assert.equal(Buffer.from(f.source).toString('utf8'), `contingut de ${f.fileName}`);
    }
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('les exclusions de nom són de l\'arrel; els ocults, de qualsevol fondària', () => {
  const arrel = publicDeMostra([
    'assets/robots.txt',
    'assets/auth/escut.png',
    'docs/sitemap.xml',
    'assets/.ocult/x.png',
    'assets/pages/01_chat/.keep',
    'assets/towns/b/.DS-Store'
  ]);
  try {
    const rels = recursosDelPlugin(arrel);
    for (const rel of ['assets/robots.txt', 'assets/auth/escut.png', 'docs/sitemap.xml']) assert.ok(rels.includes(rel), rel);
    for (const rel of ['assets/.ocult/x.png', 'assets/pages/01_chat/.keep', 'assets/towns/b/.DS-Store']) assert.ok(!rels.includes(rel), rel);
    assert.ok(rels.every((rel) => !rel.split('/').some((s) => s.startsWith('.'))));
    assert.deepEqual(rels, [...rels].sort(), 'ordre determinista');
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('sense directori explícit usa el publicDir de la config resolta; sense carpeta no emet res', () => {
  const arrel = publicDeMostra();
  try {
    assert.deepEqual(emet(recursosPublicsDelPlugin(), { publicDir: arrel }).map((f) => f.fileName).sort(), [...VIATGEN].sort());
    // L'explícit guanya a la config.
    assert.equal(emet(recursosPublicsDelPlugin({ directori: arrel }), { publicDir: path.join(arrel, 'fonts') }).length, VIATGEN.length);
    assert.deepEqual(emet(recursosPublicsDelPlugin(), { publicDir: '' }), []);
    assert.deepEqual(emet(recursosPublicsDelPlugin(), { publicDir: path.join(arrel, 'no-hi-es') }), []);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('sobre el public/ real: viatgen la Wiki (RAG, slugs), les fonts i els components; res del servidor', (t) => {
  const arrel = path.resolve('public');
  if (!fs.existsSync(arrel)) { t.skip('sense public/ en aquest arbre'); return; }
  const rels = recursosDelPlugin(arrel);
  // fonts-href i el Web Component d'identitat els demana l'amfitrió dins de dist/.
  for (const rel of ['fonts/noto-sans.css', 'components/sp-identity-components.js']) {
    if (fs.existsSync(path.join(arrel, rel))) assert.ok(rels.includes(rel), rel);
  }
  for (const rel of ['rag-index.json', 'slugIndex.json']) {
    if (fs.existsSync(path.join(arrel, rel))) assert.ok(rels.includes(rel), rel);
  }
  assert.ok(rels.every((rel) => !rel.split('/').some((s) => s.startsWith('.'))), 'cap ocult');
  assert.ok(rels.every((rel) => !['robots.txt', 'sitemap.xml'].includes(rel) && !rel.startsWith('auth/')), 'res del servidor');
});

test('la llista d\'exclusions és curta, congelada i no toca els recursos de l\'app', () => {
  assert.ok(Object.isFrozen(PROPIS_DEL_LLOC) && Object.isFrozen(PROPIS_DEL_LLOC.arrel));
  assert.equal(PROPIS_DEL_LLOC.prefixOcult, '.');
  // enxufe/ és el canal de releases de socdepoble.org (stable.json i la signatura).
  // sw.js i manifest.webmanifest: la PWA de l'entrada pròpia (Fase 0, 261003).
  // Ordre del Mestre (261021, prompt 261021_0015, tasca 3) · i les icones de 192 i 512 que només llig eixe manifest.
  assert.deepEqual([...PROPIS_DEL_LLOC.arrel].sort(), ['auth', 'enxufe', 'icona-app-192.png', 'icona-app-512.png', 'manifest.webmanifest',
    'robots.txt', 'sitemap.xml', 'sw.js']);
  for (const rel of ['rag-index.json', 'slugIndex.json', 'assets', 'fonts', 'components']) {
    assert.ok(!PROPIS_DEL_LLOC.arrel.includes(rel), rel);
  }
});

/* outDir de mostra: el que és de Vite, del build:seo i de l'app, i les
   restes pròpies del lloc que un build anterior hi copià de public/. */
const ES_CONSERVEN = [
  '.vite/manifest.json',
  'assets/auth/escut.png',
  'assets/robots.txt',
  'assets/towns/a/1.jpg',
  'docs/sitemap.xml',
  'fonts/x.css',
  'rag-index.json',
  'seo-routes.json',
  'slugIndex.json',
  'soc-de-poble.standalone.js',
  'socdepoble-react.css'
];
const RESTES = [
  '.DS_Store',
  '.htaccess',
  'assets/.DS_Store',
  'assets/.vite/x.json',
  'assets/pages/01_chat/.keep',
  'auth/callback.html',
  'robots.txt',
  'sitemap.xml'
];
/* El que retiraPropisDelLloc torna: un directori propi es lleva sencer. */
const RETIRATS = [
  '.DS_Store',
  '.htaccess',
  'assets/.DS_Store',
  'assets/.vite',
  'assets/pages/01_chat/.keep',
  'auth',
  'robots.txt',
  'sitemap.xml'
];

/** Projecte temporal amb wordpress-plugin/dist ple com el deixaria un build anterior. */
function outDirDeMostra() {
  const projecte = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-outdir-'));
  const outDir = path.join(projecte, 'wordpress-plugin', 'dist');
  for (const rel of [...ES_CONSERVEN, ...RESTES]) {
    const abs = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `contingut de ${rel}`);
  }
  return { projecte, outDir };
}

/** Camins relatius (POSIX, ordenats) de tot `directori`, ocults inclosos; un enllaç no es recorre. */
function contingut(directori) {
  const eixida = [];
  const recorre = (abs, rel) => {
    for (const entrada of fs.readdirSync(abs, { withFileTypes: true })) {
      const relFill = rel ? `${rel}/${entrada.name}` : entrada.name;
      if (entrada.isDirectory()) recorre(path.join(abs, entrada.name), relFill);
      else eixida.push(relFill);
    }
  };
  recorre(directori, '');
  return eixida.sort();
}

function registreDeMostra() {
  const info = [];
  const warn = [];
  return { info: (m) => info.push(m), warn: (m) => warn.push(m), info_: info, warn_: warn };
}

/** Executa el writeBundle del plugin com ho faria Rollup, després de configResolved. */
function escriu(plugin, config, opcions) {
  plugin.configResolved(config);
  plugin.writeBundle.call({}, opcions, {});
}

test('writeBundle retira de l\'outDir només les restes pròpies del lloc; .vite/manifest.json, seo-routes.json i el bundle es queden', () => {
  const { projecte, outDir } = outDirDeMostra();
  try {
    const registre = registreDeMostra();
    const config = { publicDir: '', root: projecte, build: { outDir: 'wordpress-plugin/dist' }, logger: registre };
    escriu(recursosPublicsDelPlugin(), config, { dir: outDir });
    assert.deepEqual(contingut(outDir), [...ES_CONSERVEN].sort());
    for (const rel of ES_CONSERVEN) {
      assert.equal(fs.readFileSync(path.join(outDir, rel), 'utf8'), `contingut de ${rel}`, rel);
    }
    assert.equal(registre.warn_.length, 0);
    assert.equal(registre.info_.length, 1);
    for (const rel of RETIRATS) assert.ok(registre.info_[0].includes(rel), `el registre nomena ${rel}`);
    // Idempotent: el segon build no troba res ni ho anuncia.
    escriu(recursosPublicsDelPlugin(), config, { dir: outDir });
    assert.deepEqual(contingut(outDir), [...ES_CONSERVEN].sort());
    assert.equal(registre.info_.length, 1);
  } finally { fs.rmSync(projecte, { recursive: true, force: true }); }
});

test('sense opcions.dir, writeBundle usa l\'outDir de la config resolta', () => {
  const { projecte, outDir } = outDirDeMostra();
  try {
    const registre = registreDeMostra();
    escriu(recursosPublicsDelPlugin(),
      { publicDir: '', root: projecte, build: { outDir: 'wordpress-plugin/dist' }, logger: registre }, {});
    assert.deepEqual(contingut(outDir), [...ES_CONSERVEN].sort());
    assert.equal(registre.info_.length, 1);
  } finally { fs.rmSync(projecte, { recursive: true, force: true }); }
});

test('retiraPropisDelLloc torna el que ha esborrat, ordenat, i mai segueix enllaços simbòlics', () => {
  const { projecte, outDir } = outDirDeMostra();
  const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-fora-'));
  try {
    for (const nom of ['.secret', 'robots.txt', 'auth']) fs.writeFileSync(path.join(fora, nom), nom);
    // Un enllaç ocult es lleva com a enllaç; un altre no es recorre.
    fs.symlinkSync(fora, path.join(outDir, '.enllac'), 'dir');
    fs.symlinkSync(fora, path.join(outDir, 'assets', 'enllac'), 'dir');
    assert.deepEqual(retiraPropisDelLloc(outDir), [...RETIRATS, '.enllac'].sort());
    assert.equal(fs.existsSync(path.join(outDir, '.enllac')), false);
    assert.ok(fs.lstatSync(path.join(outDir, 'assets', 'enllac')).isSymbolicLink());
    for (const nom of ['.secret', 'robots.txt', 'auth']) {
      assert.equal(fs.readFileSync(path.join(fora, nom), 'utf8'), nom, `fora de l'outDir: ${nom}`);
    }
    assert.ok(fs.existsSync(path.join(outDir, DIRECTORI_DE_VITE, 'manifest.json')));
    assert.deepEqual(retiraPropisDelLloc(outDir), [], 'res més a retirar');
    assert.deepEqual(retiraPropisDelLloc(''), []);
    assert.deepEqual(retiraPropisDelLloc(path.join(outDir, 'no-hi-es')), []);
  } finally {
    fs.rmSync(projecte, { recursive: true, force: true });
    fs.rmSync(fora, { recursive: true, force: true });
  }
});

test('un outDir que no és estrictament dins de l\'arrel del projecte no es toca', () => {
  const { projecte, outDir } = outDirDeMostra();
  try {
    const abans = contingut(outDir);
    const casos = [
      { publicDir: '', root: outDir },                        // outDir = arrel del projecte
      { publicDir: '', root: path.join(outDir, 'assets') },  // l'outDir conté el projecte
      { publicDir: '' }                                        // sense arrel coneguda
    ];
    for (const config of casos) {
      const registre = registreDeMostra();
      escriu(recursosPublicsDelPlugin(), { ...config, logger: registre }, { dir: outDir });
      assert.deepEqual(contingut(outDir), abans, JSON.stringify(config.root ?? null));
      assert.equal(registre.warn_.length, 1);
      assert.equal(registre.info_.length, 0);
    }
  } finally { fs.rmSync(projecte, { recursive: true, force: true }); }
});

test('la config del standalone endolla el plugin i apaga copyPublicDir, no publicDir', () => {
  // process.env mana sobre els .env de disc: la prova no depén del .env local.
  const base = { SDP_RELEASE: '', SDP_VARIANT: '', VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: 'sb_publishable_' + 'fixturesintetica' };
  ambEntorn({ ...base, SDP_PAQUET: '' }, () => {
    const cfg = configStandalone({ mode: 'production', command: 'build' });
    assert.equal(cfg.build.copyPublicDir, false);
    assert.ok(!('publicDir' in cfg), 'publicDir no s\'apaga: el dev server el continua servint');
    assert.equal(cfg.build.emptyOutDir, false);
    assert.equal(cfg.build.outDir, 'wordpress-plugin/dist');
    /* Decisió 5 del Mestre (261007): per defecte, el paquet trossejat. Rollup
       escriu el mòdul d'entrada ESM sota trossos/, i soc-de-poble.standalone.js
       (el carregador) l'emet el plugin sdp-carregador. */
    assert.deepEqual(cfg.build.lib.formats, ['es']);
    assert.equal(cfg.build.lib.fileName(), MODUL_DELS_TROSSOS);
    const plugins = cfg.plugins.flat(Infinity);
    const nostre = plugins.filter((p) => p && p.name === 'sdp-recursos-publics');
    assert.equal(nostre.length, 1);
    assert.equal(nostre[0].apply, 'build');
    assert.equal(typeof nostre[0].writeBundle, 'function', 'retira les restes de builds anteriors');
  });
  // Decisió 5 · l'interruptor torna a l'IIFE d'abans, amb el nom de sempre.
  ambEntorn({ ...base, SDP_PAQUET: 'monolitic' }, () => {
    const cfg = configStandalone({ mode: 'production', command: 'build' });
    assert.deepEqual(cfg.build.lib.formats, ['iife']);
    assert.equal(cfg.build.lib.fileName(), 'soc-de-poble.standalone.js');
  });
});

test('T14 · el mode llibreria substituïx process.env.NODE_ENV i el build refusa un paquet que encara el llija', () => {
  const claus = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'NODE_ENV'];
  const abans = Object.fromEntries(claus.map((k) => [k, process.env[k]]));
  process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
  process.env.VITE_SUPABASE_ANON_KEY = 'sb_publishable_' + 'fixturesintetica';
  try {
    // Vite fixa NODE_ENV='production' abans d'avaluar la config de qualsevol build.
    process.env.NODE_ENV = 'production';
    const cfg = configStandalone({ mode: 'development', command: 'build' });
    assert.equal(cfg.define['process.env.NODE_ENV'], JSON.stringify('production'), 'sense paquets híbrids amb --mode development');
    assert.ok(!('process.env' in cfg.define), 'no es tapa process.env sencer: amagaria altres claus');
    // El mateix criteri que isProduction de Vite: qualsevol altre valor és desenvolupament.
    for (const valor of ['development', 'test']) {
      process.env.NODE_ENV = valor;
      assert.equal(configStandalone({ mode: 'development', command: 'build' }).define['process.env.NODE_ENV'], JSON.stringify('development'), valor);
    }

    const guarda = cfg.plugins.flat(Infinity).find((p) => p && p.name === 'sdp-sense-process');
    assert.equal(guarda?.apply, 'build');
    const context = { parse: (codi) => parseAst(codi), error: (missatge) => { throw new Error(missatge); } };
    const passa = (code) => guarda.generateBundle.call(context, {}, { a: { type: 'chunk', fileName: 'a.js', code } });
    // Una lectura protegida i la prosa de la Wiki que viatja dins del paquet no són accessos.
    assert.doesNotThrow(() => passa('var a = typeof process < "u"; var w = "configura process.env.NODE_ENV al build";'));
    for (const code of ['var r = process.env.NODE_ENV === "production";', 'var r = process["env"];']) {
      assert.throws(() => passa(code), /encara llig process\.env/, code);
    }
  } finally {
    for (const k of claus) {
      if (abans[k] === undefined) delete process.env[k];
      else process.env[k] = abans[k];
    }
  }
});

/* ─────────── Manifest de l'artefacte universal (sdp.release.v1) ─────────── */

const TENANT = '11111111-2222-3333-4444-555555555555';
const hash = (algorisme, dades, codificacio = 'hex') => createHash(algorisme).update(dades).digest(codificacio);

test('el canal de releases (public/enxufe/) no viatja dins del paquet', () => {
  const arrel = publicDeMostra(['enxufe/stable.json', 'enxufe/stable.json.sig', 'assets/enxufe/logo.svg']);
  try {
    const rels = recursosDelPlugin(arrel);
    assert.ok(!rels.some((rel) => rel.startsWith('enxufe/')), 'res de enxufe/ a l\'arrel');
    assert.ok(rels.includes('assets/enxufe/logo.svg'), 'a una altra fondària és un recurs qualsevol');
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

/* Ordre del Mestre (261021, prompt 261021_0015, tasca 3) · Les icones de 192 i
   512 del manifest (instal·lar a l'ordinador) són de la mateixa PWA. */
const PWA_DEL_LLOC = ['sw.js', 'manifest.webmanifest', 'icona-app-192.png', 'icona-app-512.png'];

test('la PWA de l\'entrada pròpia (sw.js, manifest.webmanifest i les seues icones) no viatja al paquet ni hi queda de builds anteriors', (t) => {
  // De mostra: a l'arrel es queda; a una altra fondària és un recurs qualsevol.
  const arrel = publicDeMostra([...PWA_DEL_LLOC, ...PWA_DEL_LLOC.map((rel) => `assets/${rel}`)]);
  try {
    const rels = recursosDelPlugin(arrel);
    for (const rel of PWA_DEL_LLOC) assert.ok(!rels.includes(rel), rel);
    for (const rel of PWA_DEL_LLOC.map((r) => `assets/${r}`)) assert.ok(rels.includes(rel), rel);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }

  // Restes d'un build anterior a l'outDir: es retiren com la resta de propis del lloc.
  const { projecte, outDir } = outDirDeMostra();
  try {
    for (const rel of PWA_DEL_LLOC) fs.writeFileSync(path.join(outDir, rel), rel);
    const retirats = retiraPropisDelLloc(outDir);
    for (const rel of PWA_DEL_LLOC) {
      assert.ok(retirats.includes(rel), rel);
      assert.equal(fs.existsSync(path.join(outDir, rel)), false, rel);
    }
  } finally { fs.rmSync(projecte, { recursive: true, force: true }); }

  // Sobre el public/ real: si existixen, no viatgen.
  const real = path.resolve('public');
  if (!fs.existsSync(real)) { t.skip('sense public/ en aquest arbre'); return; }
  const relsReals = recursosDelPlugin(real);
  for (const rel of PWA_DEL_LLOC) assert.ok(!relsReals.includes(rel), `public/${rel}`);
});

test('nodeSegellat: origen públic, mode com dataMode.js i tenant només si és un UUID', () => {
  assert.deepEqual(nodeSegellat({ VITE_SUPABASE_URL: 'https://abc.supabase.co/', VITE_DATA_MODE: 'remote', VITE_TENANT_ID: TENANT.toUpperCase() }),
    { origen: 'https://abc.supabase.co', mode: 'remote', tenant: TENANT, desenvolupament: false });
  for (const url of ['http://localhost:54321', 'http://127.0.0.1:54321', 'https://localhost', 'http://abc.supabase.co', 'https://192.168.0.16', 'https://10.0.0.2', 'https://172.20.1.1', 'https://[::1]:54321', 'https://node.local']) {
    assert.equal(nodeSegellat({ VITE_SUPABASE_URL: url }).desenvolupament, true, url);
  }
  assert.deepEqual(nodeSegellat({}), { origen: null, mode: 'remote', tenant: null, desenvolupament: true });
  assert.equal(nodeSegellat({ VITE_DATA_MODE: 'hybrid' }).mode, 'remote', 'un mode desconegut és remote, com a dataMode.js');
  assert.equal(nodeSegellat({ VITE_DATA_MODE: 'seed' }).mode, 'seed');
  assert.equal(nodeSegellat({ VITE_TENANT_ID: 'default-tenant' }).tenant, null);
  assert.equal(esHostLocal('172.32.0.1'), false, 'fora de 172.16/12');
  assert.equal(esHostLocal('socdepoble.org'), false);
});

test('versioDelBuild i errorsDeRelease: una release necessita SDP_VERSIO i un node públic en remote amb poble', () => {
  assert.equal(versioDelBuild({}, '1.0.0'), '1.0.0-dev');
  assert.equal(versioDelBuild({ SDP_VERSIO: ' 0.2.0 ' }, '1.0.0'), '0.2.0');
  const bo = nodeSegellat({ VITE_SUPABASE_URL: 'https://abc.supabase.co', VITE_TENANT_ID: TENANT });
  assert.deepEqual(errorsDeRelease({ versio: '0.2.0', node: bo }), []);
  assert.deepEqual(errorsDeRelease({ versio: '0.2.0-rc.1', node: bo }), []);
  for (const versio of ['1.0.0-dev', '0.2', 'v0.2.0', '', undefined, '0.2.0-dev.1']) {
    assert.equal(errorsDeRelease({ versio, node: bo }).length, 1, String(versio));
  }
  const local = nodeSegellat({ VITE_SUPABASE_URL: 'http://localhost:54321', VITE_DATA_MODE: 'seed' });
  assert.equal(errorsDeRelease({ versio: '0.2.0', node: local }).length, 3, 'desenvolupament, mode i tenant');
});

test('manifestDeRelease: sha256, SRI sha384 i inventari ordenat del que s\'ha emés', () => {
  const bundle = Buffer.from('var SocDePoble = 1;');
  const fonts = Buffer.from('@font-face{}');
  const { manifest, manifestText, inventariText } = manifestDeRelease({
    versio: '0.2.0',
    node: { origen: 'https://abc.supabase.co', mode: 'remote', tenant: TENANT, desenvolupament: false },
    generat: '2026-09-29T20:00:00.000Z',
    fitxers: [
      { cami: 'rag-index.json', contingut: Buffer.from('{}') },
      { cami: ENTRADA_DEL_PAQUET, contingut: bundle },
      { cami: 'fonts/noto-sans.css', contingut: fonts }
    ]
  });
  assert.equal(manifest.schema, ESQUEMA_RELEASE);
  assert.equal(manifest.producte, 'soc-de-poble');
  assert.deepEqual(manifest.contracte, CONTRACTE_AMFITRIO);
  assert.deepEqual(manifest.entrada, { cami: ENTRADA_DEL_PAQUET, mida: bundle.length, sha256: hash('sha256', bundle), integrity: `sha384-${hash('sha384', bundle, 'base64')}` });
  assert.equal(manifest.fonts.integrity, `sha384-${hash('sha384', fonts, 'base64')}`);
  assert.deepEqual(manifest.inventari, { cami: FITXER_INVENTARI, fitxers: 3, sha256: hash('sha256', inventariText) });
  assert.deepEqual(JSON.parse(inventariText).fitxers.map((f) => f.cami), ['fonts/noto-sans.css', 'rag-index.json', ENTRADA_DEL_PAQUET]);
  assert.deepEqual(JSON.parse(manifestText), manifest);
  assert.ok(!/anon|publishable|secret|key/i.test(JSON.stringify(manifest.node)), 'del node només viatja l\'origen públic');
  assert.throws(() => manifestDeRelease({ versio: '0.2.0', node: {}, generat: 'x', fitxers: [] }), /no ha emés/);
});

test('el plugin del manifest escriu el que el build ha emés, sense .vite/ ni restes del disc', () => {
  const { projecte, outDir } = outDirDeMostra();
  try {
    const node = nodeSegellat({ VITE_SUPABASE_URL: 'http://localhost:54321', VITE_DATA_MODE: 'seed' });
    const plugin = manifestDeReleasePlugin({ versio: '1.0.0-dev', node, generat: '2026-09-29T20:00:00.000Z' });
    assert.equal(plugin.apply, 'build');
    const registre = registreDeMostra();
    plugin.configResolved({ root: projecte, build: { outDir: 'wordpress-plugin/dist' }, logger: registre });
    plugin.writeBundle.call({}, {}, {
      a: { type: 'chunk', fileName: ENTRADA_DEL_PAQUET, code: 'var SocDePoble = 1;' },
      b: { type: 'asset', fileName: 'rag-index.json', source: '{}' },
      c: { type: 'asset', fileName: 'fonts/noto-sans.css', source: new Uint8Array([64, 102]) },
      d: { type: 'asset', fileName: `${DIRECTORI_DE_VITE}/manifest.json`, source: '{}' },
      e: { type: 'asset', fileName: FITXER_RELEASE, source: '{"vell":true}' }
    });
    const manifest = JSON.parse(fs.readFileSync(path.join(outDir, FITXER_RELEASE), 'utf8'));
    const inventari = JSON.parse(fs.readFileSync(path.join(outDir, FITXER_INVENTARI), 'utf8'));
    assert.deepEqual(inventari.fitxers.map((f) => f.cami), ['fonts/noto-sans.css', 'rag-index.json', ENTRADA_DEL_PAQUET]);
    assert.equal(manifest.inventari.fitxers, 3);
    assert.equal(manifest.node.desenvolupament, true);
    // socdepoble-react.css i seo-routes.json són restes al disc: no entren.
    assert.ok(!JSON.stringify(inventari).includes('socdepoble-react.css'));
    assert.equal(registre.info_.length, 1);
    assert.match(registre.info_[0], /DESENVOLUPAMENT/);
  } finally { fs.rmSync(projecte, { recursive: true, force: true }); }
});

function ambEntorn(valors, funcio) {
  const abans = Object.fromEntries(Object.keys(valors).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(valors)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try { return funcio(); } finally {
    for (const [k, v] of Object.entries(abans)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('SDP_RELEASE=1 falla abans de compilar amb un node de desenvolupament i buida l\'outDir amb un de bo', () => {
  const clau = 'sb_publishable_' + 'fixturesintetica';
  ambEntorn({ SDP_RELEASE: '1', SDP_VERSIO: '0.2.0', VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: clau, VITE_DATA_MODE: 'seed', VITE_TENANT_ID: TENANT }, () => {
    assert.throws(() => configStandalone({ mode: 'production', command: 'build' }), /no es pot publicar[\s\S]*desenvolupament[\s\S]*mode remote/);
  });
  ambEntorn({ SDP_RELEASE: '1', SDP_VERSIO: undefined, VITE_SUPABASE_URL: 'https://abc.supabase.co', VITE_SUPABASE_ANON_KEY: clau, VITE_DATA_MODE: 'remote', VITE_TENANT_ID: TENANT }, () => {
    assert.throws(() => configStandalone({ mode: 'production', command: 'build' }), /SDP_VERSIO/);
  });
  ambEntorn({ SDP_RELEASE: '1', SDP_VERSIO: '0.2.0', VITE_SUPABASE_URL: 'https://abc.supabase.co', VITE_SUPABASE_ANON_KEY: clau, VITE_DATA_MODE: 'remote', VITE_TENANT_ID: TENANT }, () => {
    const cfg = configStandalone({ mode: 'production', command: 'build' });
    assert.equal(cfg.build.emptyOutDir, true, 'una release només porta el que ha emés este build');
    assert.equal(cfg.plugins.flat(Infinity).filter((p) => p && p.name === 'sdp-manifest-release').length, 1);
  });
  // En CI, sense URL real, la reserva de validatePublicCredentials no pot fer passar una release.
  ambEntorn({ CI: 'true', SDP_RELEASE: '1', SDP_VERSIO: '0.2.0', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: clau, VITE_DATA_MODE: 'remote', VITE_TENANT_ID: TENANT }, () => {
    assert.throws(() => configStandalone({ mode: 'production', command: 'build' }), /VITE_SUPABASE_URL no és una URL vàlida/);
  });
  ambEntorn({ SDP_RELEASE: undefined, VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: clau }, () => {
    const cfg = configStandalone({ mode: 'production', command: 'build' });
    assert.equal(cfg.build.emptyOutDir, false, 'fora de release, com sempre');
    assert.equal(cfg.plugins.flat(Infinity).filter((p) => p && p.name === 'sdp-manifest-release').length, 1, 'el manifest s\'escriu a cada build');
  });
});

/* ───────────── Paquet trossejat (decisió 5 del Mestre, 261007) ─────────────
   «Paquet WordPress de 4,4 MB: CODE SPLITTING OBLIGATORI.» El paquet de
   l'amfitrió és un carregador clàssic menut (soc-de-poble.standalone.js) que
   fa import() d'un mòdul ESM amb trossos amb hash a dist/trossos/; l'IIFE
   d'abans queda darrere de l'interruptor SDP_PAQUET=monolitic. Les proves van
   ací i no en un fitxer nou: tooling/tests/node-suite-manifest.json (fora
   d'abast) classifica cada tests/*.test.mjs i un fitxer nou posaria
   tests/node-suite-policy.test.mjs en roig. */

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLAU_DE_PROVA = 'sb_publishable_' + 'fixturesintetica';
const MODUL_DE_PROVA = 'trossos/soc-de-poble-Ab12_x-Y.js';
const DIST_AMFITRIO = 'https://amfitrio.invalid/wp-content/plugins/socdepoble-enxufe/dist/';
const SRC_DEL_CARREGADOR = `${DIST_AMFITRIO}${ENTRADA_DEL_PAQUET}?ver=1.0.5.abc`;
/* La mida de l'IIFE monolític al build del 261007 (sdp-release.json, mode
   remote): la xifra de la decisió del Mestre. */
const MIDA_IIFE_DE_LA_DECISIO = 4418786;
/* Trinquet de l'entrada ESM. Només pot baixar: si una peça nova la fa
   créixer, que siga a posta (i amb React.lazy, si no és del primer
   renderitzat). Era la primera mesura del build real (261007, 1.574.642 B
   amb sdp-espais) més un 5 %, 1.653.374 B.
   Onada 7 (261009) · El mateix sostre que src/apps/plataforma/pesDelNucli.test.js
   (SOSTRE_DEL_TROS_D_ENTRADA, el del build del 261008, 1.591.855 B): el build
   real de l'arbre ja hi cap (1.491.760 B, amb el logotip negre fora de
   l'entrada, BrandMark.jsx), i ara el trinquet es comprova en cada build
   real, no només sobre el dist vell. Es llig d'allí, com pesDelNucli llig les
   constants de vite.standalone.config.js: una sola font, i si algú el mou,
   els dos trinquets es mouen junts. No s'importa: és un fitxer de vitest. */
const SOSTRE_DE_L_ENTRADA = (() => {
  const font = fs.readFileSync(path.join(ARREL, 'src/apps/plataforma/pesDelNucli.test.js'), 'utf8');
  const trobada = font.match(/^const SOSTRE_DEL_TROS_D_ENTRADA = (\d+);/m);
  if (!trobada) throw new Error('src/apps/plataforma/pesDelNucli.test.js ja no declara SOSTRE_DEL_TROS_D_ENTRADA');
  return Number(trobada[1]);
})();

/** Tots els nodes d'un AST ESTree (Rollup), sense recursió. */
function nodesDe(arrel) {
  const tots = [];
  const pendents = [arrel];
  while (pendents.length) {
    const node = pendents.pop();
    tots.push(node);
    for (const fill of Object.values(node)) {
      if (Array.isArray(fill)) {
        for (const element of fill) if (element && typeof element.type === 'string') pendents.push(element);
      } else if (fill && typeof fill.type === 'string') {
        pendents.push(fill);
      }
    }
  }
  return tots;
}

const esProcessEnv = (node) => node.type === 'MemberExpression' && node.object.type === 'Identifier'
  && node.object.name === 'process' && (node.property.name === 'env' || node.property.value === 'env');

/** Les fonts literals de tota importació estàtica, reexportació o import() d'un mòdul. */
function fontsDImportacio(nodes) {
  return nodes
    .filter((n) => ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration', 'ImportExpression'].includes(n.type))
    .map((n) => n.source)
    .filter((font) => font && font.type === 'Literal')
    .map((font) => font.value);
}

test('formatDelPaquet: trossos per defecte a l\'autònom, sempre monolític a WordPress, cap valor desconegut', () => {
  assert.deepEqual([...FORMATS_DEL_PAQUET], ['trossos', 'monolitic']);
  assert.ok(Object.isFrozen(FORMATS_DEL_PAQUET));
  assert.equal(CARPETA_DE_TROSSOS, 'trossos');
  assert.equal(MODUL_DELS_TROSSOS, 'trossos/soc-de-poble-[hash].js');
  for (const buit of [undefined, null, '', '  ']) assert.equal(formatDelPaquet(buit), 'trossos', String(buit));
  assert.equal(formatDelPaquet(' trossos '), 'trossos');
  assert.equal(formatDelPaquet('monolitic'), 'monolitic');
  assert.equal(formatDelPaquet('', 'wordpress'), 'monolitic');
  assert.equal(formatDelPaquet('monolitic', 'wordpress'), 'monolitic');
  assert.throws(() => formatDelPaquet('trossos', 'wordpress'), /sempre monolítica/);
  for (const valor of ['iife', 'es', 'TROSSOS', 'monolític']) assert.throws(() => formatDelPaquet(valor), /SDP_PAQUET desconegut/, valor);
});

test('la forma de la config: trossejat per defecte, monolític amb l\'interruptor i WordPress sempre monolític', () => {
  const base = { SDP_RELEASE: '', SDP_VERSIO: '', VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: CLAU_DE_PROVA };
  const noms = (cfg) => cfg.plugins.flat(Infinity).filter(Boolean).map((p) => p.name);
  const config = () => configStandalone({ mode: 'production', command: 'build' });
  ambEntorn({ ...base, SDP_VARIANT: '', SDP_PAQUET: '' }, () => {
    const cfg = config();
    assert.equal(cfg.build.outDir, 'wordpress-plugin/dist');
    assert.deepEqual(cfg.build.lib.formats, ['es']);
    assert.equal(cfg.build.lib.fileName('es', 'embed'), MODUL_DELS_TROSSOS);
    // En lib, Vite deixaria els trossos a l'arrel de l'outDir i sense elevar importacions.
    assert.deepEqual(cfg.build.rollupOptions.output, {
      entryFileNames: MODUL_DELS_TROSSOS, chunkFileNames: 'trossos/[name]-[hash].js', hoistTransitiveImports: true
    });
    // Sense façana: l'entrada és el mòdul que porta el codi (cap anada i tornada més).
    assert.equal(cfg.build.rollupOptions.preserveEntrySignatures, 'allow-extension');
    assert.equal(cfg.build.rollupOptions.external, undefined, 'l\'autònom porta el seu React');
    assert.equal(noms(cfg).filter((nom) => nom === 'sdp-carregador').length, 1);
    assert.equal(noms(cfg).filter((nom) => nom === 'sdp-espais').length, 1);
    assert.equal(noms(cfg).filter((nom) => nom === 'sdp-sense-process').length, 1, 'la guarda T14 mira tots els trossos');
  });
  ambEntorn({ ...base, SDP_VARIANT: '', SDP_PAQUET: 'monolitic' }, () => {
    const cfg = config();
    assert.deepEqual(cfg.build.lib.formats, ['iife']);
    assert.equal(cfg.build.lib.fileName(), ENTRADA_DEL_PAQUET);
    assert.equal(cfg.build.rollupOptions, undefined, 'exactament la config d\'abans');
    assert.ok(!noms(cfg).includes('sdp-carregador'));
    assert.ok(!noms(cfg).includes('sdp-espais'));
  });
  ambEntorn({ ...base, SDP_VARIANT: 'wordpress', SDP_PAQUET: '' }, () => {
    const cfg = config();
    assert.equal(cfg.build.outDir, 'wordpress-plugin/builds/directori/dist');
    assert.deepEqual(cfg.build.lib.formats, ['iife']);
    assert.equal(cfg.build.lib.fileName(), ENTRADA_DEL_PAQUET);
    assert.equal(cfg.build.rollupOptions.external('react'), true);
    assert.deepEqual(Object.keys(cfg.build.rollupOptions.output), ['globals'], 'la branca WordPress no es toca');
    assert.ok(!noms(cfg).includes('sdp-carregador'));
    assert.ok(!noms(cfg).includes('sdp-espais'));
  });
  ambEntorn({ ...base, SDP_VARIANT: 'wordpress', SDP_PAQUET: 'trossos' }, () => {
    assert.throws(config, /sempre monolítica/);
  });
  ambEntorn({ ...base, SDP_VARIANT: '', SDP_PAQUET: 'iife' }, () => {
    assert.throws(config, /SDP_PAQUET desconegut/);
  });
});

test('manifestDeRelease amb `formatDelPaquet`: clau additiva, fora del contracte; descripcioDelPaquet la deduïx del que s\'ha emés', () => {
  const carregador = Buffer.from(`(()=>{import(${JSON.stringify(MODUL_DE_PROVA)})})();`);
  const fitxers = [
    { cami: ENTRADA_DEL_PAQUET, contingut: carregador },
    { cami: MODUL_DE_PROVA, contingut: Buffer.from('export{};') },
    { cami: 'trossos/NotesSection-Zz9_aB1c.js', contingut: Buffer.from('export{};') }
  ];
  const comu = { versio: '0.2.0', node: {}, generat: '2026-10-07T20:00:00.000Z', fitxers };
  const sense = manifestDeRelease(comu).manifest;
  assert.equal(Object.hasOwn(sense, 'formatDelPaquet'), false, 'sense el paràmetre, el manifest d\'abans');

  const bundle = {
    a: { type: 'asset', fileName: ENTRADA_DEL_PAQUET },
    b: { type: 'chunk', isEntry: true, fileName: MODUL_DE_PROVA },
    c: { type: 'chunk', isEntry: false, fileName: 'trossos/NotesSection-Zz9_aB1c.js' },
    d: { type: 'asset', fileName: 'assets/system/ui/logo.svg' }
  };
  const paquet = descripcioDelPaquet('trossos', bundle);
  assert.deepEqual(paquet, { format: 'trossos', modul: MODUL_DE_PROVA, trossos: 2 });
  const amb = manifestDeRelease({ ...comu, paquet }).manifest;
  assert.deepEqual(amb.formatDelPaquet, paquet);
  // Relleu 261007 · cap clau `paquet`: al canal signat, `paquet` són els zips.
  assert.equal(Object.hasOwn(amb, 'paquet'), false);
  assert.deepEqual(amb.contracte, CONTRACTE_AMFITRIO, 'formatDelPaquet no entra al contracte');
  assert.equal(amb.entrada.cami, ENTRADA_DEL_PAQUET);
  assert.equal(amb.entrada.sha256, hash('sha256', carregador), 'l\'empremta és la del carregador');
  const { formatDelPaquet: _descartat, ...restaAmb } = amb;
  assert.equal(_descartat, paquet);
  assert.deepEqual(restaAmb, sense, 'la resta del manifest no canvia');

  assert.equal(descripcioDelPaquet(undefined, bundle), undefined);
  assert.deepEqual(descripcioDelPaquet('monolitic', bundle), { format: 'monolitic' });
  assert.throws(() => descripcioDelPaquet('iife', bundle), /desconegut/);
  assert.throws(() => descripcioDelPaquet('trossos', {}), /un sol mòdul d'entrada/);
  assert.throws(() => descripcioDelPaquet('trossos', { b: { type: 'chunk', isEntry: true, fileName: ENTRADA_DEL_PAQUET } }), /un sol mòdul d'entrada/);
  assert.throws(() => descripcioDelPaquet('trossos', { ...bundle, e: { ...bundle.b, fileName: 'trossos/altra-Qq.js' } }), /un sol mòdul d'entrada/);
});

test('el plugin del manifest amb format: escriu `formatDelPaquet` a partir del bundle de writeBundle', () => {
  const { projecte, outDir } = outDirDeMostra();
  try {
    const node = nodeSegellat({ VITE_SUPABASE_URL: 'http://localhost:54321' });
    for (const [format, esperat] of [['trossos', { format: 'trossos', modul: MODUL_DE_PROVA, trossos: 2 }], ['monolitic', { format: 'monolitic' }]]) {
      const plugin = manifestDeReleasePlugin({ versio: '1.0.0-dev', node, generat: '2026-10-07T20:00:00.000Z', format });
      plugin.configResolved({ root: projecte, build: { outDir: 'wordpress-plugin/dist' }, logger: registreDeMostra() });
      plugin.writeBundle.call({}, {}, {
        a: { type: 'asset', fileName: ENTRADA_DEL_PAQUET, source: `import(${JSON.stringify(MODUL_DE_PROVA)})` },
        b: { type: 'chunk', isEntry: true, fileName: MODUL_DE_PROVA, code: 'export{};' },
        c: { type: 'chunk', isEntry: false, fileName: 'trossos/Xat-AbCd_123.js', code: 'export{};' }
      });
      const manifest = JSON.parse(fs.readFileSync(path.join(outDir, FITXER_RELEASE), 'utf8'));
      assert.deepEqual(manifest.formatDelPaquet, esperat, format);
      const inventari = JSON.parse(fs.readFileSync(path.join(outDir, FITXER_INVENTARI), 'utf8'));
      assert.deepEqual(inventari.fitxers.map((f) => f.cami), [ENTRADA_DEL_PAQUET, 'trossos/Xat-AbCd_123.js', MODUL_DE_PROVA], 'cada tros, amb el seu sha256');
    }
  } finally { fs.rmSync(projecte, { recursive: true, force: true }); }
});

test('codiDelCarregador: script clàssic menut, ASCII, sense import/export de nivell superior, amb una sola import()', async (t) => {
  const codi = await codiDelCarregador({ modul: MODUL_DE_PROVA });
  const mida = Buffer.byteLength(codi);
  t.diagnostic(`carregador: ${mida} B (sostre ${LIMIT_DEL_CARREGADOR} B)`);
  assert.ok(mida <= LIMIT_DEL_CARREGADOR, `${mida} B`);
  assert.doesNotThrow(() => new vm.Script(codi), 'un script clàssic');
  const tipus = nodesDe(parseAst(codi)).map((n) => n.type);
  for (const vetat of ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportDefaultDeclaration', 'ExportAllDeclaration']) {
    assert.ok(!tipus.includes(vetat), vetat);
  }
  assert.equal(tipus.filter((t2) => t2 === 'ImportExpression').length, 1);
  assert.ok([...codi].every((c) => c.charCodeAt(0) < 128), 'ASCII: no depén del charset de la pàgina');
  // Captura la base, encua l'API i demana el mòdul del build, i res de l'entorn.
  assert.ok(codi.includes('currentScript'));
  assert.ok(codi.includes(MARCA_DEL_CARREGADOR));
  assert.ok(codi.includes(JSON.stringify(MODUL_DE_PROVA)));
  for (const clau of CONTRACTE_AMFITRIO_V1.api.claus) assert.ok(codi.includes(JSON.stringify(clau)), clau);
  assert.ok(!codi.includes('process'), 'cap process.env');
  assert.equal(await codiDelCarregador({ modul: MODUL_DE_PROVA }), codi, 'determinista');
  for (const modul of ['../fora.js', 'soc-de-poble.js', `${MODUL_DE_PROVA}?ver=1`, 'trossos/a/b.js', 'trossos/a b.js', undefined]) {
    await assert.rejects(codiDelCarregador({ modul }), /no vàlid/, String(modul));
  }
});

test('sdp-espais: només lleva espais dels trossos ESM; cadenes, accents i marcadors de hash intactes', async () => {
  const plugin = espaisDelPaquetPlugin();
  assert.equal(plugin.name, 'sdp-espais');
  assert.equal(plugin.apply, 'build');
  assert.equal(plugin.renderChunk.order, 'post', 'després de la transpilació de Vite');
  const codi = 'import { a as b } from "./comu-!~{001}~.js";\n\n  const   salutacio  =  "Sóc   de Poble";\n  export const c = () =>   import("./NotesSection-!~{002}~.js");\n  export { salutacio, b };\n';
  const compacte = await plugin.renderChunk.handler(codi, { fileName: 'trossos/x.js' }, { format: 'es' });
  assert.ok(compacte.length < codi.length, 'més menut');
  for (const intacte of ['"./comu-!~{001}~.js"', '"./NotesSection-!~{002}~.js"', '"Sóc   de Poble"']) assert.ok(compacte.includes(intacte), intacte);
  const tipus = nodesDe(parseAst(compacte)).map((n) => n.type);
  assert.ok(tipus.includes('ImportDeclaration') && tipus.includes('ImportExpression') && tipus.includes('ExportNamedDeclaration'), 'continua sent un mòdul ESM');
  assert.equal(await plugin.renderChunk.handler(codi, { fileName: 'x.js' }, { format: 'iife' }), null, 'l\'IIFE no es toca');
});

/** Executa el carregador emés dins d'una pàgina JSDOM, amb import() substituït. */
function carregaEnJsdom(codi, importa, { url = 'https://amfitrio.invalid/pagina/', src = SRC_DEL_CARREGADOR, cos = '<soc-de-poble></soc-de-poble><soc-de-poble></soc-de-poble>' } = {}) {
  const errors = [];
  const avisos = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', (...args) => errors.push(args.map(String).join(' ')));
  virtualConsole.on('warn', (...args) => avisos.push(args.map(String).join(' ')));
  const dom = new JSDOM(`<!doctype html><html><body>${cos}</body></html>`, { runScripts: 'outside-only', url, virtualConsole });
  const script = dom.window.document.createElement('script');
  script.src = src;
  // currentScript només val mentre s'executa un script clàssic: ací, el carregador.
  Object.defineProperty(dom.window.document, 'currentScript', { configurable: true, get: () => script });
  const crides = [];
  dom.window.__sdpImporta = (adreca) => { crides.push(adreca); return importa(adreca); };
  assert.equal(codi.split('import(').length - 1, 1, 'una sola import()');
  dom.window.eval(codi.replace('import(', '__sdpImporta('));
  return { dom, crides, errors, avisos };
}

const tick = () => new Promise((resolve) => { setImmediate(resolve); });

test('el carregador emés, en JSDOM: provisional amb les claus de l\'API, import absolut sense ?ver= i cua fins a l\'adopció', async () => {
  const codi = await codiDelCarregador({ modul: MODUL_DE_PROVA });
  const { dom, crides, avisos } = carregaEnJsdom(codi, () => new Promise(() => {}));
  try {
    const provisional = dom.window.SocDePoble;
    assert.deepEqual([...Object.keys(provisional)], [...CONTRACTE_AMFITRIO_V1.api.claus]);
    assert.ok(Object.isFrozen(provisional));
    const descriptor = Object.getOwnPropertyDescriptor(dom.window, 'SocDePoble');
    assert.equal(descriptor.configurable, true);
    assert.equal(descriptor.writable, false);
    assert.deepEqual(crides, [`${DIST_AMFITRIO}${MODUL_DE_PROVA}`], 'la mateixa URL que resolen els trossos relatius');
    assert.equal(provisional.isReady, false);
    assert.equal(provisional.CONTRACTE_BACKEND, undefined);
    assert.deepEqual({ ...provisional.estat() }, { fase: 'carregant', configurable: true });

    // L'amfitrió parla abans que arribe el mòdul: s'encua i rep el resultat real.
    const resultat = provisional.configura({ auth: { issuer: 'https://emissor.invalid' } });
    const control = provisional[Symbol.for(MARCA_DEL_CARREGADOR)];
    assert.equal(control.base, DIST_AMFITRIO);
    const real = Object.freeze({ configura: (opcions) => ({ rebut: opcions.auth.issuer }), estat: () => ({ fase: 'segellat' }), isReady: true });
    assert.equal(control.adopta(real), false, 'mentre el provisional és a la finestra, no hi ha adopció');
    delete dom.window.SocDePoble;
    Object.defineProperty(dom.window, 'SocDePoble', { value: real, configurable: false, writable: false });
    assert.equal(control.adopta(real), true);
    assert.deepEqual(await resultat, { rebut: 'https://emissor.invalid' });
    assert.deepEqual(provisional.configura({ auth: { issuer: 'x' } }), { rebut: 'x' }, 'després, reenviament síncron');
    assert.equal(provisional.isReady, true);
    assert.equal(control.adopta(real), false, 'una sola vegada');
    assert.deepEqual(avisos, []);

    // Un segon carregador a la mateixa pàgina: avisa i no demana res.
    const segona = [];
    dom.window.__sdpImporta = (adreca) => { segona.push(adreca); return new Promise(() => {}); };
    dom.window.eval(codi.replace('import(', '__sdpImporta('));
    assert.deepEqual(segona, []);
    assert.equal(avisos.length, 1);
    assert.match(avisos[0], /ja existix/);
  } finally {
    dom.window.close();
  }
});

test('el carregador emés, en JSDOM: un import que falla deixa un missatge honest a la consola i a cada element, com a text', async () => {
  const codi = await codiDelCarregador({ modul: MODUL_DE_PROVA });
  const hostil = '<img src=x onerror="document.title=1">';
  const { dom, errors } = carregaEnJsdom(codi, () => Promise.reject(new Error(hostil)), { url: 'https://pagina.invalid/comunitat/' });
  try {
    const provisional = dom.window.SocDePoble;
    // El gestor s'enganxa abans que arribe el rebuig: cap rebuig sense gestionar.
    const encuada = assert.rejects(provisional.configura({}), /no ha pogut carregar els seus mòduls/);
    await tick();
    await encuada;
    await assert.rejects(provisional.arrenca(), /no ha pogut carregar els seus mòduls/, 'les crides posteriors també');
    assert.deepEqual({ ...provisional.estat() }, { fase: 'fallida', configurable: false });
    const doc = dom.window.document;
    const elements = [...doc.querySelectorAll('soc-de-poble')];
    assert.equal(elements.length, 2);
    for (const element of elements) {
      const bloc = element.querySelector('.sdp-arranc-fallida');
      assert.ok(bloc, 'cap pantalla blanca muda');
      assert.deepEqual([...bloc.children].map((fill) => fill.tagName), ['H3', 'P', 'PRE']);
      assert.equal(bloc.children[0].textContent, 'Error crític d\'arrencada');
      assert.match(bloc.children[1].textContent, /altre origen \(https:\/\/amfitrio\.invalid\).*Access-Control-Allow-Origin/);
      assert.ok(bloc.children[2].textContent.includes(hostil), 'el motiu, com a text');
      assert.ok(bloc.children[2].textContent.includes(`${DIST_AMFITRIO}${MODUL_DE_PROVA}`));
    }
    assert.equal(doc.querySelectorAll('img').length, 0, 'res del motiu s\'interpreta com a HTML');
    assert.notEqual(doc.title, '1');
    assert.ok(errors.some((linia) => linia.includes('no ha pogut carregar els seus mòduls')), 'i a la consola');
    // Relleu 261007 · un <soc-de-poble> que una SPA crea després de la fallada també es pinta.
    const posterior = doc.createElement('soc-de-poble');
    doc.body.append(posterior);
    await tick();
    assert.equal(posterior.querySelector('.sdp-arranc-fallida > p')?.textContent, elements[0].querySelector('.sdp-arranc-fallida > p').textContent);
  } finally {
    dom.window.close();
  }
});

test('verificaPaquet: el que diu `formatDelPaquet` és el que porta l\'inventari, i el carregador el demana', () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-verifica-paquet-'));
  try {
    fs.writeFileSync(path.join(dist, ENTRADA_DEL_PAQUET), `(()=>{import(${JSON.stringify(MODUL_DE_PROVA)})})();`);
    const camins = [ENTRADA_DEL_PAQUET, MODUL_DE_PROVA, 'trossos/Xat-AbCd_123.js', 'assets/x.png'];
    const trossos = { format: 'trossos', modul: MODUL_DE_PROVA, trossos: 2 };
    assert.deepEqual(verificaPaquet(dist, { formatDelPaquet: trossos }, camins), { format: 'trossos', trossos: 2 });
    assert.deepEqual(verificaPaquet(dist, {}, [ENTRADA_DEL_PAQUET, 'assets/x.png']), { format: 'monolitic', trossos: 0 }, 'els manifests d\'abans');
    assert.deepEqual(verificaPaquet(dist, { formatDelPaquet: { format: 'monolitic' } }, [ENTRADA_DEL_PAQUET]), { format: 'monolitic', trossos: 0 });
    assert.throws(() => verificaPaquet(dist, {}, camins), /monolític no porta trossos/);
    // Relleu 261007 · el nom d'abans no declara res: amb trossos a l'inventari, no s'empaqueta.
    assert.throws(() => verificaPaquet(dist, { paquet: trossos }, camins), /monolític no porta trossos/);
    assert.throws(() => verificaPaquet(dist, { formatDelPaquet: { format: 'iife' } }, camins), /desconegut/);
    assert.throws(() => verificaPaquet(dist, { formatDelPaquet: { ...trossos, trossos: 3 } }, camins), /diu 3 trossos/);
    assert.throws(() => verificaPaquet(dist, { formatDelPaquet: trossos }, camins.filter((cami) => cami !== MODUL_DE_PROVA)), /no és a l'inventari/);
    assert.throws(() => verificaPaquet(dist, { formatDelPaquet: { ...trossos, modul: '../fora.js' } }, camins), /no és a l'inventari/);
    assert.throws(() => verificaPaquet(dist, { formatDelPaquet: { ...trossos, trossos: 3 } }, [...camins, 'trossos/llegeix.txt']), /només hi van mòduls \.js/);
    fs.writeFileSync(path.join(dist, ENTRADA_DEL_PAQUET), '(()=>{import("trossos/soc-de-poble-Altre.js")})();');
    assert.throws(() => verificaPaquet(dist, { formatDelPaquet: trossos }, camins), /no demana/);
  } finally { fs.rmSync(dist, { recursive: true, force: true }); }
});

/** Un plugin temporal amb l'adaptador real, un dist trossejat i un directori monolític. */
function pluginTrossejat({ directoriAmbTrossos = false } = {}) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-empaqueta-trossos-'));
  const plugin = path.join(arrel, 'wordpress-plugin');
  fs.mkdirSync(plugin, { recursive: true });
  for (const rel of ADAPTADOR.fitxers) fs.copyFileSync(path.join(ARREL, 'wordpress-plugin', rel), path.join(plugin, rel));
  for (const carpeta of ADAPTADOR.carpetes) fs.cpSync(path.join(ARREL, 'wordpress-plugin', carpeta), path.join(plugin, carpeta), { recursive: true });
  const node = { origen: 'http://localhost:54321', mode: 'seed', tenant: TENANT, desenvolupament: true };
  const escriu = (dist, fitxers, opcions) => {
    for (const { cami, contingut } of fitxers) {
      fs.mkdirSync(path.dirname(path.join(dist, cami)), { recursive: true });
      fs.writeFileSync(path.join(dist, cami), contingut);
    }
    const { manifestText, inventariText } = manifestDeRelease({ versio: '1.0.0-dev', node, generat: '2026-10-07T20:00:00.000Z', fitxers, ...opcions });
    fs.writeFileSync(path.join(dist, FITXER_RELEASE), manifestText);
    fs.writeFileSync(path.join(dist, FITXER_INVENTARI), inventariText);
  };
  const dist = path.join(plugin, 'dist');
  escriu(dist, [
    { cami: ENTRADA_DEL_PAQUET, contingut: Buffer.from(`(()=>{import(${JSON.stringify(MODUL_DE_PROVA)})})();`) },
    { cami: MODUL_DE_PROVA, contingut: Buffer.from('import"./Xat-AbCd_123.js";') },
    { cami: 'trossos/Xat-AbCd_123.js', contingut: Buffer.from('export{};') },
    { cami: 'fonts/noto-sans.css', contingut: Buffer.from('@font-face{font-family:x}') }
  ], { paquet: { format: 'trossos', modul: MODUL_DE_PROVA, trossos: 2 } });
  // Un tros orfe d'un build anterior: no és a l'inventari i no s'empaqueta.
  fs.writeFileSync(path.join(dist, 'trossos/Vell-Zz99Zz99.js'), 'export{};');
  const directori = path.join(plugin, 'builds/directori/dist');
  escriu(directori, [
    { cami: ENTRADA_DEL_PAQUET, contingut: Buffer.from('var SocDePoble = React.createElement;\n') },
    { cami: 'fonts/noto-sans.css', contingut: Buffer.from('@font-face{font-family:x}') },
    ...(directoriAmbTrossos ? [{ cami: MODUL_DE_PROVA, contingut: Buffer.from('export{};') }] : [])
  ], {
    variant: 'wordpress',
    paquet: directoriAmbTrossos ? { format: 'trossos', modul: MODUL_DE_PROVA, trossos: 1 } : { format: 'monolitic' }
  });
  return { arrel, plugin, sortida: path.join(plugin, 'builds/paquets') };
}

test('empaqueta amb el paquet trossejat: els trossos inventariats entren als zips estàtic i de WordPress; el directori, monolític', () => {
  const f = pluginTrossejat();
  try {
    const r = empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: 'http://localhost:8881/enxufe/', prova: true });
    assert.deepEqual(r.restes, ['trossos/Vell-Zz99Zz99.js'], 'l\'orfe ix com a resta');
    const zip = (nom) => new Map(llegixZip(fs.readFileSync(path.join(f.sortida, nom))).map((e) => [e.nom, e.dades]));
    const [estatic, wordpress, directori] = [
      r.escrits.find((nom) => nom.includes('_estatic_spa_v')),
      r.escrits.find((nom) => nom.includes('_wordpress_enxufe_v')),
      r.escrits.find((nom) => nom.includes('_wordpress_directori_v'))
    ].map(zip);
    for (const rel of [MODUL_DE_PROVA, 'trossos/Xat-AbCd_123.js']) {
      assert.ok(estatic.has(`soc-de-poble/${rel}`), `estàtic: ${rel}`);
      /* Gauntlet 261025_0545 (WP-01) · l'arrel del zip és la carpeta que exigix el PHP
         (SOCDEPOBLE_ENXUFE_SLUG), no un literal: tests/enxufe-empaqueta.test.mjs lliga l'SLUG al plugin. */
      assert.ok(wordpress.has(`${SLUG}/dist/${rel}`), `WordPress: ${rel}`);
    }
    for (const nom of [...estatic.keys(), ...wordpress.keys()]) assert.ok(!nom.includes('Vell-'), nom);
    assert.ok(![...directori.keys()].some((nom) => nom.includes('/trossos/')), 'el directori no porta trossos');
    assert.deepEqual(r.canal.formatDelPaquet, { format: 'trossos', modul: MODUL_DE_PROVA, trossos: 2 }, 'el canal signat porta el manifest sencer');
    // Relleu 261007 · al canal, `paquet` només són els zips: cap col·lisió de noms.
    assert.equal(Object.hasOwn(r.canal, 'paquet'), false);
    assert.equal(r.canal.estatic.paquet.nom, r.escrits.find((nom) => nom.includes('_estatic_spa_v')));
    assert.equal(typeof r.canal.adaptadors.wordpress.paquet.sha256, 'string');
  } finally { fs.rmSync(f.arrel, { recursive: true, force: true }); }

  const trossejat = pluginTrossejat({ directoriAmbTrossos: true });
  try {
    assert.throws(() => empaqueta({ arrelPlugin: trossejat.plugin, sortida: trossejat.sortida, urlBase: 'http://localhost:8881/enxufe/', prova: true }), /directori ha de ser monolítica/);
    assert.equal(fs.existsSync(trossejat.sortida), false, 'zero paquets parcials');
  } finally { fs.rmSync(trossejat.arrel, { recursive: true, force: true }); }
});

/* PHP local, com tests/enxufe-runtime.test.mjs: es llig el manifest, es
   comprova el paquet sencer i es fa la referència copiable. Qualsevol avís de
   PHP és un error. Sense PHP, es salta. */
const studio = path.join(os.homedir(), '.studio/php-bin');
const PHP = [process.env.PHP_BIN, 'php', ...(fs.existsSync(studio) ? fs.readdirSync(studio).sort().reverse().map((v) => path.join(studio, v, 'php')) : [])]
  .filter(Boolean).find((bin) => spawnSync(bin, ['-v'], { timeout: 5000 }).status === 0);

const RUNNER_PAQUET = `<?php
error_reporting( E_ALL );
set_error_handler( static function ( $nivell, $missatge, $fitxer, $linia ) { throw new ErrorException( $missatge, 0, $nivell, $fitxer, $linia ); } );
define( 'ABSPATH', __DIR__ . '/' );
define( 'SOCDEPOBLE_ENXUFE_FITXER', __DIR__ . '/socdepoble-enxufe.php' );
define( 'SOCDEPOBLE_ENXUFE_MANIFEST', 'dist/sdp-release.json' );
define( 'SOCDEPOBLE_ENXUFE_BUNDLE', 'dist/soc-de-poble.standalone.js' );
define( 'SOCDEPOBLE_ENXUFE_FONTS', 'dist/fonts/noto-sans.css' );
define( 'SOCDEPOBLE_ENXUFE_SLUG', 'socdepoble' );
define( 'SOCDEPOBLE_ENXUFE_HANDLE', 'socdepoble' );
define( 'SOCDEPOBLE_ENXUFE_VERSIO', '0.0.0-prova' );
define( 'SOCDEPOBLE_ENXUFE_OPCIO', 'socdepoble_enxufe' );
function plugin_dir_path( $p ) { return dirname( $p ) . '/'; }
function plugins_url( $p, $f ) { return 'https://amfitrio.invalid/wp-content/plugins/socdepoble-enxufe/' . $p; }
function esc_attr( $v ) { return htmlspecialchars( (string) $v, ENT_QUOTES, 'UTF-8' ); }
function esc_url( $v ) { return esc_attr( $v ); }
function esc_url_raw( $v, $a = null ) { return $v; }
function sanitize_text_field( $v ) { return trim( (string) $v ); }
function sanitize_title( $v ) { return trim( preg_replace( '/[^a-z0-9-]+/', '-', strtolower( trim( (string) $v ) ) ), '-' ); }
function get_option( $nom, $defecte = false ) { return $defecte; }
function apply_filters( $nom, $valor, ...$args ) { return $valor; }
function wp_json_encode( $v, $flags = 0 ) { return json_encode( $v, $flags ); }
function add_action( ...$a ) {} function add_filter( ...$a ) {}
function socdepoble_enxufe_deepl_clau() { return ''; }
/* La Salut del lloc (relleu 261007): els textos tal qual i un lloc de producció. */
function __( $t, $d = null ) { return $t; }
function esc_html( $v ) { return esc_attr( $v ); }
function esc_html__( $t, $d = null ) { return esc_html( $t ); }
function admin_url( $p ) { return 'https://amfitrio.invalid/wp-admin/' . $p; }
function wp_get_environment_type() { return 'production'; }
require $argv[1] . '/wordpress-plugin/includes/manifest.php';
require $argv[1] . '/wordpress-plugin/includes/marcatge.php';
require $argv[1] . '/wordpress-plugin/includes/salut.php';
echo json_encode( array( 'manifest' => socdepoble_enxufe_manifest_local(), 'te_bundle' => socdepoble_enxufe_te_bundle(), 'referencia' => socdepoble_enxufe_marcatge_de_referencia(),
	'sencers' => socdepoble_enxufe_trossos_sencers(), 'salut' => socdepoble_enxufe_prova_paquet()['status'] ) );
`;

/* Relleu 261007 · la clau és `formatDelPaquet` (abans `paquet`, que al canal
   signat ja són els zips), i la Salut del lloc contrasta els trossos de
   l'inventari amb el disc: un desplegament parcial ja no és «package is ready». */
const TROS_DE_PROVA = 'trossos/Xat-AbCd_123.js';

test('PHP · manifest.php, te_bundle i Salut amb `formatDelPaquet`: el mòdul d\'entrada i els trossos de l\'inventari són obligatoris si es declara; una clau invàlida s\'ignora', { skip: !PHP && 'PHP absent' }, (t) => {
  const executa = ({ paquet, ambModul = true, ambTros = true, ambManifest = true, inventari = 'bo', transforma = (m) => m }) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-php-paquet-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.mkdirSync(path.join(dir, 'dist/trossos'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'runner.php'), RUNNER_PAQUET);
    fs.writeFileSync(path.join(dir, 'dist', ENTRADA_DEL_PAQUET), `(()=>{import(${JSON.stringify(MODUL_DE_PROVA)})})();`);
    if (ambModul) fs.writeFileSync(path.join(dir, 'dist', MODUL_DE_PROVA), 'export{};');
    if (ambTros) fs.writeFileSync(path.join(dir, 'dist', TROS_DE_PROVA), 'export{};');
    if (ambManifest) {
      const { manifest, inventariText } = manifestDeRelease({ versio: '1.0.5', node: { origen: 'https://node.invalid', mode: 'remote', desenvolupament: false }, generat: '2026-10-07T20:00:00.000Z',
        fitxers: [
          { cami: ENTRADA_DEL_PAQUET, contingut: Buffer.from('x') },
          { cami: MODUL_DE_PROVA, contingut: Buffer.from('export{};') },
          { cami: TROS_DE_PROVA, contingut: Buffer.from('export{};') }
        ], paquet });
      fs.writeFileSync(path.join(dir, 'dist', FITXER_RELEASE), `${JSON.stringify(transforma(manifest), null, 2)}\n`);
      // 'alterat': un inventari que no és el que signa el manifest (un altre build, una còpia a mitges).
      if (inventari === 'bo') fs.writeFileSync(path.join(dir, 'dist', FITXER_INVENTARI), inventariText);
      if (inventari === 'alterat') fs.writeFileSync(path.join(dir, 'dist', FITXER_INVENTARI), inventariText.replace(TROS_DE_PROVA, 'trossos/Altre-Zz99Zz99.js'));
    }
    const proces = spawnSync(PHP, [path.join(dir, 'runner.php'), ARREL], { encoding: 'utf8', timeout: 10000 });
    assert.equal(proces.status, 0, proces.stderr + proces.stdout);
    return JSON.parse(proces.stdout);
  };
  const trossos = { format: 'trossos', modul: MODUL_DE_PROVA, trossos: 2 };

  const sencer = executa({ paquet: trossos });
  assert.deepEqual(sencer.manifest.formatDelPaquet, { format: 'trossos', modul: MODUL_DE_PROVA });
  assert.equal(Object.hasOwn(sencer.manifest, 'paquet'), false);
  assert.match(sencer.manifest.inventari.sha256, /^[0-9a-f]{64}$/);
  assert.equal(sencer.te_bundle, true);
  assert.equal(sencer.sencers, true);
  assert.equal(sencer.salut, 'good');
  assert.match(sencer.referencia, /^<!-- dist\/trossos\/ loads as JavaScript modules: serve dist\/ without redirects, from the page origin or with Access-Control-Allow-Origin\. -->$/m);
  assert.doesNotMatch(sencer.referencia, /integrity|crossorigin/);
  assert.match(sencer.referencia, /<script src="[^"]*soc-de-poble\.standalone\.js"><\/script>/, 'les tres peces de sempre');

  const senseModul = executa({ paquet: trossos, ambModul: false });
  assert.equal(senseModul.te_bundle, false, 'sense el seu mòdul, el paquet no és sencer');
  assert.equal(senseModul.salut, 'critical');

  // Relleu 261007 · un desplegament parcial: el carregador i l'entrada hi són, un tros mandrós no.
  const senseTros = executa({ paquet: trossos, ambTros: false });
  assert.equal(senseTros.te_bundle, true, 'cada pàgina continua mirant només el carregador i l\'entrada');
  assert.equal(senseTros.sencers, false);
  assert.equal(senseTros.salut, 'critical', 'la Salut ja no diu «package is ready»');
  for (const inventari of ['absent', 'alterat']) {
    const eixida = executa({ paquet: trossos, inventari });
    assert.equal(eixida.sencers, false, `inventari ${inventari}`);
    assert.equal(eixida.salut, 'critical', `inventari ${inventari}`);
  }

  for (const paquet of [undefined, { format: 'monolitic' }, { format: 'trossos', modul: '../fora.js' }, { format: 'trossos', modul: 'trossos/a.js?x' },
    { format: 'trossos', modul: "trossos/a.js\n" }, { format: 'iife', modul: MODUL_DE_PROVA }, 'trossos']) {
    const eixida = executa({ paquet, ambModul: false, ambTros: false });
    assert.ok(eixida.manifest, `manifest vàlid: ${JSON.stringify(paquet)}`);
    assert.equal(Object.hasOwn(eixida.manifest, 'formatDelPaquet'), false, JSON.stringify(paquet));
    assert.equal(eixida.te_bundle, true, `només el bundle: ${JSON.stringify(paquet)}`);
    assert.equal(eixida.sencers, true, `sense trossos declarats, res a comprovar: ${JSON.stringify(paquet)}`);
    assert.equal(eixida.salut, 'good', JSON.stringify(paquet));
    assert.doesNotMatch(eixida.referencia, /trossos/);
  }
  // El nom d'abans no compta: un manifest amb `paquet` es llig com un monolític.
  const nomVell = executa({ paquet: trossos, ambModul: false, transforma: ({ formatDelPaquet: format, ...resta }) => ({ ...resta, paquet: format }) });
  assert.equal(Object.hasOwn(nomVell.manifest, 'formatDelPaquet'), false);
  assert.equal(nomVell.te_bundle, true);
  const senseManifest = executa({ ambManifest: false, ambModul: false });
  assert.equal(senseManifest.te_bundle, true, 'sense manifest, com sempre');
  assert.equal(senseManifest.sencers, true);
  assert.equal(senseManifest.salut, 'recommended');
});

/* ───────────────────────── El BUILD REAL ─────────────────────────
   La config real de vite.standalone.config.js, compilada amb { build } de
   Vite cap a un directori temporal: mai a wordpress-plugin/dist. publicDir:false
   (no es copia public/; com que l'outDir és fora de l'arrel, no s'hi retira
   res) i envDir buit (cap VITE_* del .env del desenvolupador entra al paquet);
   process.env mana sobre .env.local al loadEnv de la config, i es restaura
   sencer en acabar (Vite hi fixa NODE_ENV). El canari no VITE no pot aparéixer
   en cap fitxer; la prova no imprimix mai contingut, només noms i mides. */

const CANARI = `canari-${randomBytes(12).toString('hex')}`;

async function ambEntornAsync(valors, funcio) {
  const abans = { ...process.env };
  for (const [k, v] of Object.entries(valors)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try { return await funcio(); } finally {
    for (const k of Object.keys(process.env)) if (!Object.hasOwn(abans, k)) delete process.env[k];
    for (const [k, v] of Object.entries(abans)) if (process.env[k] !== v) process.env[k] = v;
  }
}

async function compilaDeVeritat(paquet, t) {
  const eixida = fs.mkdtempSync(path.join(os.tmpdir(), `sdp-build-${paquet || 'defecte'}-`));
  const envDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-env-buit-'));
  t.after(() => {
    fs.rmSync(eixida, { recursive: true, force: true });
    fs.rmSync(envDir, { recursive: true, force: true });
  });
  const resultat = await ambEntornAsync({
    SDP_RELEASE: '', SDP_VARIANT: '', SDP_PAQUET: paquet, SDP_VERSIO: '', SOURCE_DATE_EPOCH: '',
    VITE_SUPABASE_URL: 'https://fixture.invalid', VITE_SUPABASE_ANON_KEY: CLAU_DE_PROVA,
    VITE_DATA_MODE: 'remote', VITE_TENANT_ID: TENANT, SUPABASE_SERVICE_ROLE_KEY: CANARI
  }, () => build({
    root: ARREL,
    configFile: path.join(ARREL, 'vite.standalone.config.js'),
    configLoader: 'native', // sense fitxer temporal al costat de la config
    mode: 'production',
    logLevel: 'silent',
    publicDir: false,
    envDir,
    build: { outDir: eixida }
  }));
  const sortida = Array.isArray(resultat) ? resultat[0] : resultat;
  return { eixida, chunks: sortida.output.filter((f) => f.type === 'chunk') };
}

const gzip = (dades) => zlibGzip(dades).length;
let midaMonolitica = null;

test('BUILD REAL · SDP_PAQUET=monolitic torna l\'IIFE d\'un sol fitxer d\'abans (la mida d\'abans)', { timeout: 600000 }, async (t) => {
  const { eixida, chunks } = await compilaDeVeritat('monolitic', t);
  const js = contingut(eixida).filter((rel) => rel.endsWith('.js'));
  assert.deepEqual(js, [ENTRADA_DEL_PAQUET], 'un sol fitxer');
  assert.equal(fs.existsSync(path.join(eixida, CARPETA_DE_TROSSOS)), false);
  assert.equal(chunks.length, 1);
  assert.deepEqual(chunks[0].dynamicImports, [], 'IIFE: tot inlinat');
  const release = JSON.parse(fs.readFileSync(path.join(eixida, FITXER_RELEASE), 'utf8'));
  assert.deepEqual(release.formatDelPaquet, { format: 'monolitic' });
  const dades = fs.readFileSync(path.join(eixida, ENTRADA_DEL_PAQUET));
  assert.equal(release.entrada.mida, dades.length);
  assert.ok(!dades.includes(CANARI), `${ENTRADA_DEL_PAQUET}: porta el canari`);
  midaMonolitica = dades.length;
  t.diagnostic(`ABANS · monolític: ${dades.length} B (gzip ${gzip(dades)} B)`);
});

test('BUILD REAL · trossejat (per defecte): carregador clàssic menut, mòdul ESM i trossos amb hash, inventariats i nets', { timeout: 600000 }, async (t) => {
  const { eixida, chunks } = await compilaDeVeritat('', t);
  const llig = (rel) => fs.readFileSync(path.join(eixida, rel));
  const release = JSON.parse(llig(FITXER_RELEASE).toString('utf8'));
  const inventari = JSON.parse(llig(FITXER_INVENTARI).toString('utf8'));

  // El manifest descriu el paquet trossejat.
  assert.equal(release.formatDelPaquet.format, 'trossos');
  const { modul } = release.formatDelPaquet;
  assert.match(modul, /^trossos\/soc-de-poble-[A-Za-z0-9_-]+\.js$/);

  // El carregador: clàssic, menut, el de codiDelCarregador, i amb l'empremta del manifest.
  const carregador = llig(ENTRADA_DEL_PAQUET);
  const textCarregador = carregador.toString('utf8');
  assert.ok(carregador.length <= LIMIT_DEL_CARREGADOR, `${carregador.length} B`);
  assert.doesNotThrow(() => new vm.Script(textCarregador));
  const tipus = nodesDe(parseAst(textCarregador)).map((n) => n.type);
  assert.ok(!tipus.some((tipu) => /^(?:Import|Export\w*)Declaration$/.test(tipu)), 'cap import/export de nivell superior');
  assert.equal(tipus.filter((tipu) => tipu === 'ImportExpression').length, 1);
  assert.equal(textCarregador, await codiDelCarregador({ modul }), 'és exactament el que proven les proves del carregador');
  assert.ok(textCarregador.includes('currentScript') && textCarregador.includes(MARCA_DEL_CARREGADOR));
  assert.deepEqual(release.entrada, {
    cami: ENTRADA_DEL_PAQUET, mida: carregador.length, sha256: hash('sha256', carregador),
    integrity: `sha384-${hash('sha384', carregador, 'base64')}`
  });

  // L'inventari és exactament el disc (sense els sdp-*.json ni .vite/), amb el sha256 de cada tros.
  const disc = contingut(eixida).filter((rel) => !rel.startsWith(`${DIRECTORI_DE_VITE}/`) && ![FITXER_RELEASE, FITXER_INVENTARI].includes(rel));
  assert.deepEqual(inventari.fitxers.map((f) => f.cami), disc);
  for (const f of inventari.fitxers) assert.equal(f.sha256, hash('sha256', llig(f.cami)), f.cami);
  const trossos = disc.filter((rel) => rel.startsWith(`${CARPETA_DE_TROSSOS}/`));
  assert.ok(trossos.includes(modul));
  assert.ok(trossos.length > 1, 'hi ha trossos mandrosos');
  assert.equal(release.formatDelPaquet.trossos, trossos.length);
  for (const rel of trossos) assert.match(rel, /^trossos\/[^/]+-[A-Za-z0-9_-]{8}\.js$/, `${rel}: nom amb hash`);
  assert.deepEqual(disc.filter((rel) => rel.endsWith('.css') && !rel.startsWith('fonts/')), [], 'cap .css: el full viatja com a text a l\'entrada');

  // L'empaquetador accepta este build tal com és.
  const { camins, restes } = verificaInventari(eixida, release);
  assert.deepEqual(restes, [`${DIRECTORI_DE_VITE}/manifest.json`], 'només la traça de Vite, que no s\'empaqueta');
  assert.deepEqual(verificaPaquet(eixida, release, camins), { format: 'trossos', trossos: trossos.length });

  // tractor-build-previ continua trobant l'entrada al manifest de Vite.
  const deVite = JSON.parse(llig(`${DIRECTORI_DE_VITE}/manifest.json`).toString('utf8'));
  const entradesDeVite = Object.values(deVite).filter((e) => e.isEntry);
  assert.equal(entradesDeVite.length, 1);
  assert.equal(entradesDeVite[0].file, modul);
  assert.ok(entradesDeVite[0].dynamicImports?.length > 0, 'les rutes lazy tornen a ser lazy');

  // Cada tros: importacions relatives (cap 'react' nu ni URL absoluta), cap process.env, cap canari.
  assert.equal(chunks.length, trossos.length);
  for (const chunk of chunks) {
    const nodes = nodesDe(parseAst(chunk.code));
    assert.ok(!nodes.some(esProcessEnv), `${chunk.fileName}: llig process.env`);
    for (const font of fontsDImportacio(nodes)) assert.match(String(font), /^\.\//, `${chunk.fileName}: importa ${font}`);
    assert.ok(!chunk.code.includes(CANARI), `${chunk.fileName}: porta el canari d'un secret no VITE`);
  }
  assert.ok(!textCarregador.includes(CANARI));

  // L'entrada: el full d'estils hi és (?inline), la base es fixa abans de tot, i pesa molt menys.
  const entrada = chunks.find((chunk) => chunk.isEntry);
  assert.equal(entrada.fileName, modul);
  // Cap façana: el mòdul d'entrada porta embed.jsx i tot el seu graf estàtic.
  assert.ok(entrada.moduleIds.some((id) => id === path.join(ARREL, 'src', 'embed.jsx')), 'embed.jsx és a l\'entrada');
  assert.deepEqual(entrada.imports, [], 'l\'entrada no espera cap altre tros per a avaluar-se');
  /* Fase D (261020, tasca 4.1) · L1 · Diccionaris sota demanda: el valencià
     viatja a l'entrada; els altres quatre, cadascun al seu tros, sense
     importacions. Un import estàtic o un import.meta.glob els tornaria a ficar
     a l'entrada (i18n.idiomes.test.js ho guarda també sobre el text). */
  const idiomaDe = (id) => /[\\/]src[\\/]config[\\/]idiomes[\\/](ca|es|en|eu|gl)\.js$/.exec(id.split('?')[0])?.[1] ?? null;
  assert.deepEqual(entrada.moduleIds.map(idiomaDe).filter(Boolean), ['ca'], 'a l\'entrada només hi ha el diccionari valencià');
  for (const codi of ['es', 'en', 'eu', 'gl']) {
    const tros = chunks.find((chunk) => !chunk.isEntry && chunk.facadeModuleId && idiomaDe(chunk.facadeModuleId) === codi);
    assert.ok(tros, `el diccionari ${codi} té el seu propi tros`);
    assert.deepEqual(tros.imports, [], `el tros del diccionari ${codi} no importa res`);
  }
  const css = (chunk) => chunk.moduleIds.some((id) => id.includes(`${path.sep}src${path.sep}css${path.sep}index.css`));
  assert.ok(css(entrada), 'src/css/index.css?inline és a l\'entrada');
  assert.ok(!chunks.filter((chunk) => !chunk.isEntry).some(css), 'cap tros mandrós porta el full');
  assert.match(entrada.code, /\.sdp-iaia-consulta\{overflow:hidden\}/, 'el diàleg IAIA porta els seus estils dins del Shadow DOM');
  assert.match(entrada.code, /\.sdp-xat-adjunts\{flex:none;/, 'els controls multimèdia porten els seus estils dins del Shadow DOM');
  const deSrc = entrada.moduleIds
    .filter((id) => id.startsWith(path.join(ARREL, 'src') + path.sep))
    .map((id) => path.relative(ARREL, id.split('?')[0]).split(path.sep).join('/'));
  const posicio = deSrc.indexOf('src/config/provisionalDelPaquet.js');
  assert.ok(posicio >= 0, 'provisionalDelPaquet.js és a l\'entrada');
  assert.deepEqual(deSrc.slice(0, posicio).filter((rel) => !['src/config/assetResolver.js', 'src/config/carregadorDelPaquet.js'].includes(rel)), [],
    'provisionalDelPaquet.js s\'avalua abans que cap altre mòdul de src/ (excepte els seus dos imports)');

  const midaEntrada = llig(modul).length;
  const midaTotal = trossos.reduce((suma, rel) => suma + llig(rel).length, 0);
  const referencia = midaMonolitica ?? MIDA_IIFE_DE_LA_DECISIO;
  assert.ok(midaEntrada < MIDA_IIFE_DE_LA_DECISIO * 0.5, `entrada ${midaEntrada} B: ha de pesar menys del 50 % de ${MIDA_IIFE_DE_LA_DECISIO} B`);
  assert.ok(midaEntrada <= SOSTRE_DE_L_ENTRADA, `entrada ${midaEntrada} B: el trinquet és ${SOSTRE_DE_L_ENTRADA} B`);
  assert.ok(midaEntrada < referencia, 'l\'entrada pesa menys que el monolític');
  t.diagnostic(`DESPRÉS · carregador ${carregador.length} B · entrada ${midaEntrada} B (gzip ${gzip(llig(modul))} B) · ${trossos.length} trossos, ${midaTotal} B en total`);
  if (midaMonolitica) t.diagnostic(`ABANS · monolític ${midaMonolitica} B · l'entrada és el ${Math.round((midaEntrada / midaMonolitica) * 1000) / 10} %`);
  const pesants = Object.entries(entrada.modules)
    .sort((a, b) => b[1].renderedLength - a[1].renderedLength)
    .slice(0, 15);
  for (const [id, info] of pesants) t.diagnostic(`  ${info.renderedLength} B · ${path.relative(ARREL, id) || id}`);
  const mandrosos = chunks.filter((chunk) => !chunk.isEntry).sort((a, b) => b.code.length - a.code.length).slice(0, 5);
  for (const chunk of mandrosos) {
    t.diagnostic(`  tros ${chunk.fileName}: ${chunk.code.length} B · ${chunk.facadeModuleId ? path.relative(ARREL, chunk.facadeModuleId) : 'compartit'}`);
  }
  const segonaOnada = entrada.moduleIds.filter((id) => /@tiptap|prosemirror-|src\/data\/wikiManifest\.js|sections\/consola/.test(id.split(path.sep).join('/')));
  // Troballa per a la segona onada (React.lazy sobre peces estàtiques), no un error d'esta prova.
  t.diagnostic(`segona onada: ${segonaOnada.length ? `${segonaOnada.length} mòduls pesants encara a l'entrada (p. ex. ${path.relative(ARREL, segonaOnada[0])})` : 'cap mòdul de TipTap, ProseMirror, la Wiki ni la Consola a l\'entrada'}`);
});

/* ───────────── Encàrrec 261019_1425 · Política de mitjans (directori i autònom, D3) ───────────── */

test('origenDeMitjans: https i un host públic; http només cap a un host local i fora de les releases', () => {
  assert.equal(origenDeMitjans('https://socdepoble.org'), 'https://socdepoble.org');
  assert.equal(origenDeMitjans('https://socdepoble.org/'), 'https://socdepoble.org');
  assert.equal(origenDeMitjans('https://abc.supabase.co/storage/v1/object/public/mitjans/', { release: true }),
    'https://abc.supabase.co/storage/v1/object/public/mitjans');
  assert.equal(origenDeMitjans('http://localhost:3340'), 'http://localhost:3340', 'per a provar el directori a WordPress Studio');
  for (const [valor, release] of [['http://localhost:3340', true], ['http://socdepoble.org', false], ['https://localhost:3340', true],
    ['https://u:p@socdepoble.org', false], ['https://socdepoble.org/?a=1', false], ['https://socdepoble.org/#x', false],
    ['ftp://socdepoble.org', false], ['socdepoble.org', false], ['', false], [undefined, false]]) {
    assert.throws(() => origenDeMitjans(valor, { release }), /SDP_ORIGEN_MITJANS/, `${valor} (release ${release})`);
  }
});

test('politicaDeMitjans: l’autònom, només les bessones (D3); el directori, els prefixos externs i les bessones del public/ que s’emetrà', () => {
  assert.equal(politicaDeMitjans('autonom'), null, 'sense public/ (cap bessona) no hi ha política');
  assert.throws(() => politicaDeMitjans('joomla'), /SDP_VARIANT desconeguda/);
  const arrel = publicDeMostra(['assets/ui/v.jpg', 'assets/ui/v.webp', 'assets/towns/a/1.webp', 'assets/b/og.jpg', 'assets/b/og.png', 'assets/b/og.webp']);
  try {
    const politica = politicaDeMitjans('wordpress', { directori: arrel });
    assert.ok(Object.isFrozen(politica));
    assert.equal(politica.origen, MITJANS_EXTERNS_DEL_DIRECTORI.origen);
    assert.deepEqual(politica.externs, MITJANS_EXTERNS_DEL_DIRECTORI.prefixos);
    assert.deepEqual(politica.bessones, ['assets/towns/a/1.jpg', 'assets/ui/v.jpg'], 'og.jpg i og.png col·lidixen: cap no en té');
    // Decisió D3 del Mestre (261019) · L'autònom substituïx les mateixes bessones i no té cap origen extern.
    const autonom = politicaDeMitjans('autonom', { directori: arrel });
    assert.ok(Object.isFrozen(autonom));
    assert.deepEqual(autonom, { origen: null, externs: [], bessones: politica.bessones });
    const altre = politicaDeMitjans('wordpress', { directori: arrel, env: { SDP_ORIGEN_MITJANS: 'https://abc.supabase.co/storage/v1/object/public/mitjans' }, release: true });
    assert.equal(altre.origen, 'https://abc.supabase.co/storage/v1/object/public/mitjans');
    assert.throws(() => politicaDeMitjans('wordpress', { directori: arrel, env: { SDP_ORIGEN_MITJANS: 'http://localhost:3340' }, release: true }), /SDP_ORIGEN_MITJANS/);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('el perfil lleuger extern deixa fora tots els assets, conserva codi, fonts i Wiki i no canvia els altres perfils', () => {
  const arrel = publicDeMostra(['assets/logo.png', 'assets/ui/v.webp']);
  try {
    const politica = politicaDeMitjans('autonom', { directori: arrel, env: { SDP_MITJANS: 'externs' }, release: true });
    const emesos = emet(recursosPublicsDelPlugin({ directori: arrel, politica })).map(f => f.fileName);
    assert.equal(politica.origen, 'https://socdepoble.org');
    assert.deepEqual(politica.externs, ['assets/']);
    assert.ok(!emesos.some(cami => cami.startsWith('assets/')));
    for (const cami of ['components/c.js', 'fonts/x.css', 'rag-index.json', 'slugIndex.json']) assert.ok(emesos.includes(cami), cami);
    assert.throws(() => politicaDeMitjans('wordpress', { env: { SDP_MITJANS: 'externs' } }), /no és la variant del directori/);
    assert.throws(() => politicaDeMitjans('autonom', { env: { SDP_MITJANS: 'errada' } }), /SDP_MITJANS desconegut/);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('el plugin amb política no emet els externs ni els originals substituïts; sense, com sempre', () => {
  const arrel = publicDeMostra(['assets/system/ui/v.jpg', 'assets/system/ui/v.webp', 'assets/ui/v.webp', 'assets/towns/a/1.webp']);
  try {
    const politica = politicaDeMitjans('wordpress', { directori: arrel });
    const emesos = emet(recursosPublicsDelPlugin({ directori: arrel, politica })).map((f) => f.fileName).sort();
    assert.ok(!emesos.some((cami) => cami.startsWith('assets/towns/') || cami.startsWith('assets/ui/')), 'cap extern');
    assert.ok(!emesos.includes('assets/system/ui/v.jpg') && emesos.includes('assets/system/ui/v.webp'), 'la bessona en lloc de l’original');
    assert.ok(emesos.includes('assets/system/ui/logo.svg') && emesos.includes('rag-index.json'), 'l’estructura viatja');
    assert.deepEqual(emet(recursosPublicsDelPlugin({ directori: arrel })).map((f) => f.fileName).sort(),
      [...VIATGEN, 'assets/towns/a/1.webp', 'assets/system/ui/v.jpg', 'assets/system/ui/v.webp', 'assets/ui/v.webp'].sort());
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

/* Fase D (261020, L10) · L'app nativa deixa fora els índexs de la Wiki; el connector, mai. */
test('exclosos: un paquet pot deixar fora camins exactes; per defecte, cap', () => {
  const arrel = publicDeMostra(['assets/rag-index.json']);
  try {
    const tots = [...VIATGEN, 'assets/rag-index.json'].sort();
    assert.deepEqual(emet(recursosPublicsDelPlugin({ directori: arrel })).map((f) => f.fileName).sort(), tots, 'per defecte, cap exclòs');
    assert.deepEqual(emet(recursosPublicsDelPlugin({ directori: arrel, exclosos: [] })).map((f) => f.fileName).sort(), tots);
    const sense = emet(recursosPublicsDelPlugin({ directori: arrel, exclosos: ['rag-index.json', 'slugIndex.json'] })).map((f) => f.fileName).sort();
    assert.deepEqual(sense, tots.filter((rel) => rel !== 'rag-index.json' && rel !== 'slugIndex.json'));
    assert.ok(sense.includes('assets/rag-index.json'), 'el camí és exacte: un homònim d\'una subcarpeta viatja');
    // Un exclòs que no és a public/ no fa res.
    assert.deepEqual(emet(recursosPublicsDelPlugin({ directori: arrel, exclosos: ['no-hi-es.json'] })).map((f) => f.fileName).sort(), tots);
  } finally { fs.rmSync(arrel, { recursive: true, force: true }); }
});

test('manifestDeRelease amb `mitjans`: clau additiva amb l’origen, els externs i quantes bessones; fora de contracte i node', () => {
  const fitxers = [{ cami: ENTRADA_DEL_PAQUET, contingut: Buffer.from('x') }];
  const node = { origen: 'https://abc.supabase.co', mode: 'remote', tenant: null, desenvolupament: false };
  const sense = manifestDeRelease({ versio: '1.2.3', node, fitxers, generat: '2026-10-19T12:00:00.000Z' }).manifest;
  assert.ok(!('mitjans' in sense));
  const mitjans = { origen: 'https://socdepoble.org', externs: ['assets/uploads/'], bessones: ['assets/a/x.jpg', 'assets/b/y.png'] };
  const amb = manifestDeRelease({ versio: '1.2.3', node, fitxers, generat: '2026-10-19T12:00:00.000Z', variant: 'wordpress', mitjans }).manifest;
  assert.deepEqual(amb.mitjans, { origen: 'https://socdepoble.org', externs: ['assets/uploads/'], bessones: 2 });
  assert.deepEqual(amb.contracte, sense.contracte);
  assert.deepEqual(amb.node, sense.node);
});

test('la config: el directori segella l’origen extern i les bessones; l’autònom, només les bessones; un origen dolent falla abans de compilar', () => {
  const base = { SDP_RELEASE: '', SDP_VERSIO: '', SDP_PAQUET: '', SDP_ORIGEN_MITJANS: undefined, VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: CLAU_DE_PROVA };
  const config = () => configStandalone({ mode: 'production', command: 'build' });
  ambEntorn({ ...base, SDP_VARIANT: '' }, () => {
    // Decisió D3 del Mestre (261019) · L'autònom ho porta tot, però la bessona en lloc de l'original.
    const autonom = JSON.parse(config().define['import.meta.env.SDP_POLITICA_DE_MITJANS']);
    assert.equal(autonom.origen, null);
    assert.deepEqual(autonom.externs, []);
    assert.deepEqual(autonom.bessones, bessonesDe(recursosDelPlugin(path.resolve('public'))).filter((c) => c.startsWith('assets/')));
  });
  ambEntorn({ ...base, SDP_VARIANT: 'wordpress' }, () => {
    const segellada = JSON.parse(config().define['import.meta.env.SDP_POLITICA_DE_MITJANS']);
    assert.equal(segellada.origen, 'https://socdepoble.org');
    assert.deepEqual(segellada.externs, [...MITJANS_EXTERNS_DEL_DIRECTORI.prefixos]);
    assert.deepEqual(segellada.bessones, bessonesDe(recursosDelPlugin(path.resolve('public'))).filter((c) => c.startsWith('assets/')), 'les bessones del public/ real, sota assets/');
  });
  ambEntorn({ ...base, SDP_VARIANT: 'wordpress', SDP_ORIGEN_MITJANS: 'http://socdepoble.org' }, () => {
    assert.throws(config, /SDP_ORIGEN_MITJANS/);
  });
});

/* El límit només avisa a empaqueta.mjs (el zip s'escriu igual); ací la porta:
   el que la variant del directori porta de public/ ha de deixar lloc per al
   bundle (1,34 MiB comprimit el 261019) dins de LIMIT_DIRECTORI. */
const RESERVA_DEL_BUNDLE = 2 * 1024 * 1024;

test('sobre el public/ real: el que porta el directori cap dins del límit de WordPress.org amb lloc per al bundle', (t) => {
  const arrel = path.resolve('public');
  if (!fs.existsSync(arrel)) { t.skip('sense public/ en aquest arbre'); return; }
  const rels = recursosDelPlugin(arrel);
  const politica = { externs: MITJANS_EXTERNS_DEL_DIRECTORI.prefixos, bessones: bessonesDe(rels) };
  const { viatgen, substituits } = separaRecursos(rels, politica);
  for (const original of substituits) assert.ok(viatgen.includes(bessonaDe(original)), original);
  // La mateixa estimació que creaZip: deflate de nivell 9 o emmagatzemat, més les capçaleres.
  const zip = viatgen.reduce((suma, rel) => {
    const dades = fs.readFileSync(path.join(arrel, rel));
    return suma + Math.min(zlibDeflateRaw(dades).length, dades.length) + 76 + 2 * Buffer.byteLength(rel);
  }, 0);
  assert.ok(zip + RESERVA_DEL_BUNDLE < LIMIT_DIRECTORI,
    `public/ del directori: ${zip} B comprimits; amb la reserva del bundle passa de ${LIMIT_DIRECTORI} B. Moveu contingut a una carpeta externa (politicaDeMitjans.js) o convertiu-lo a WebP.`);
});

/* Revisió adversarial (261019, R1/F3) · L'origen dels mitjans del directori
   servix public/: el visor hi llig l'EXIF amb Range i el reenquadrament hi
   descarrega la foto des d'un altre origen (el WordPress que l'incrusta). */
test('la configuració d’allotjament del repositori servix /assets/ amb CORS i exposa Content-Range i ETag', () => {
  const { headers } = JSON.parse(fs.readFileSync(path.resolve('vercel.json'), 'utf8'));
  const deAssets = headers.find((h) => h.source === '/assets/(.*)');
  assert.ok(deAssets, 'cap regla per a /assets/');
  const valor = (clau) => deAssets.headers.find((h) => h.key === clau)?.value;
  assert.equal(valor('Access-Control-Allow-Origin'), '*');
  assert.deepEqual(valor('Access-Control-Expose-Headers').split(',').map((s) => s.trim()).sort(), ['Content-Range', 'ETag']);
});

/* Ordre del Mestre (261021, prompt 261021_0015, tasca 4: dossier de
   desbloqueig de socdepoble.org) · Dos forats de la configuració d'allotjament
   que el dossier demana tancar abans de cap desplegament:
   · el CSP de la capçalera ha d'admetre `data:` a connect-src, com el de
     index.html: el navegador aplica tots dos, i la pujada d'imatges fa
     fetch(dataUrl) (utils/pujadaImatge.js);
   · /assets/ ha d'admetre la capçalera Range a la preflight CORS: el visor hi
     llig l'EXIF amb Range des del WordPress que l'incrusta. */
test('vercel.json: connect-src admet data: (paritat amb index.html) i /assets/ admet Range a CORS', () => {
  const config = JSON.parse(fs.readFileSync(path.resolve('vercel.json'), 'utf8'));
  const csp = config.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')?.value || '';
  const connect = csp.match(/connect-src([^;]*)/);
  assert.ok(connect, 'cap connect-src a vercel.json');
  assert.ok(connect[1].trim().split(/\s+/).includes('data:'), connect[1]);
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8').match(/connect-src([^;"]*)/);
  assert.ok(html && html[1].trim().split(/\s+/).includes('data:'), 'index.html també ha de portar data: a connect-src');
  const deAssets = config.headers.find((h) => h.source === '/assets/(.*)');
  assert.equal(deAssets.headers.find((h) => h.key === 'Access-Control-Allow-Headers')?.value, 'Range');
});
