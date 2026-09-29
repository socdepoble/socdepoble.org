import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseAst } from 'rollup/parseAst';

import { createHash } from 'node:crypto';
import configStandalone, {
  CONTRACTE_AMFITRIO,
  DIRECTORI_DE_VITE,
  ENTRADA_DEL_PAQUET,
  ESQUEMA_RELEASE,
  FITXER_INVENTARI,
  FITXER_RELEASE,
  PROPIS_DEL_LLOC,
  errorsDeRelease,
  esHostLocal,
  manifestDeRelease,
  manifestDeReleasePlugin,
  nodeSegellat,
  recursosDelPlugin,
  recursosPublicsDelPlugin,
  retiraPropisDelLloc,
  versioDelBuild
} from '../vite.standalone.config.js';

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
  assert.deepEqual([...PROPIS_DEL_LLOC.arrel].sort(), ['auth', 'enxufe', 'robots.txt', 'sitemap.xml']);
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
  const claus = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const abans = Object.fromEntries(claus.map((k) => [k, process.env[k]]));
  // process.env mana sobre els .env de disc: la prova no depén del .env local.
  process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
  process.env.VITE_SUPABASE_ANON_KEY = 'sb_publishable_' + 'fixturesintetica';
  try {
    const cfg = configStandalone({ mode: 'production', command: 'build' });
    assert.equal(cfg.build.copyPublicDir, false);
    assert.ok(!('publicDir' in cfg), 'publicDir no s\'apaga: el dev server el continua servint');
    assert.equal(cfg.build.emptyOutDir, false);
    assert.equal(cfg.build.outDir, 'wordpress-plugin/dist');
    assert.equal(cfg.build.lib.fileName(), 'soc-de-poble.standalone.js');
    const plugins = cfg.plugins.flat(Infinity);
    const nostre = plugins.filter((p) => p && p.name === 'sdp-recursos-publics');
    assert.equal(nostre.length, 1);
    assert.equal(nostre[0].apply, 'build');
    assert.equal(typeof nostre[0].writeBundle, 'function', 'retira les restes de builds anteriors');
  } finally {
    for (const k of claus) {
      if (abans[k] === undefined) delete process.env[k];
      else process.env[k] = abans[k];
    }
  }
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
