/* v1.2.14 · Porta Craft Anything de paritat visual (tooling/gates/tractor-craft-paritat-visual.mjs).
   Proves pures (graf d'imports amb @babel/parser, Tarjan, claims, arguments) i una prova real amb Chrome
   headless contra un servidor local efímer: el tractor ha de tornar 0 amb una pàgina neta, 1 amb una columna
   fantasma, llançar (eixida 2 a la CLI) si la ruta no carrega, i no deixar cap Chrome viu ni cap temporal propi.
   Gauntlet v1.2.14 · La prova real treballa amb un TMPDIR propi (mkdtemp): no mira el de la màquina ni els
   processos d'altres agents. Sense Chrome, la prova real se salta. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  analitzaCiclesImports,
  construeixClaims,
  esHostDeDades,
  extreuImportsEstatics,
  lligArgs,
  main,
  slugRuta,
} from '../tooling/gates/tractor-craft-paritat-visual.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function arrelTemporal(t, fitxers) {
  const arrel = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-craft-prova-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  for (const [rel, text] of Object.entries(fitxers)) {
    const abs = path.join(arrel, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  }
  return arrel;
}

test('extreuImportsEstatics: imports i reexportacions reals, també en diverses línies', () => {
  const codi = [
    "import A from './a.js';",
    "import { b,",
    '  c } from "./bc.js";',
    "import './estil.css';",
    "export * from './tot.js';",
    "export { d } from './d.js';",
    "import{e}from'./e.js';",
  ].join('\n');
  assert.deepEqual(extreuImportsEstatics(codi), ['./a.js', './bc.js', './estil.css', './tot.js', './d.js', './e.js']);
});

test('extreuImportsEstatics: un mòdul que no es pot analitzar llança, i el graf el compta com a no analitzat', (t) => {
  assert.throws(() => extreuImportsEstatics('import { a from "./a.js";'));
  const arrel = arrelTemporal(t, { 'src/bo.js': 'export const x = 1;\n', 'src/trencat.js': 'export const = ;\n' });
  const r = analitzaCiclesImports(arrel);
  assert.equal(r.totalFitxersAnalitzats, 1);
  assert.deepEqual(r.noAnalitzats.map((x) => x.fitxer), ['src/trencat.js']);
});

test('extreuImportsEstatics: cap aresta falsa des de cadenes, comentaris, plantilles, exports locals o import() dinàmics', () => {
  const codi = [
    'const plantilla = `',
    "import fals from './plantilla.js';",
    '`;',
    "const z = 1; import enLinia from './en-linia.js';",
    "const glob = 'src/**' + '/*.js';",
    "import real from './real.js';",
    "const avis = \"copiat from './fals.js'\";",
    "// import comentat from './comentat.js';",
    '/* import bloc from "./bloc.js"; */',
    "export const valor = 'from ./tampoc.js';",
    "export { valor as altre };",
    "const lazy = () => import('./dinamic.js');",
  ].join('\n');
  assert.deepEqual(extreuImportsEstatics(codi), ['./en-linia.js', './real.js']);
});

test('analitzaCiclesImports: troba el cicle, resol @/ i index, i ignora les proves', (t) => {
  const arrel = arrelTemporal(t, {
    'src/a.js': "import { b } from './b.js';\nexport const a = 1;\n",
    'src/b.js': "import { a } from '@/a';\nexport const b = 2;\n",
    'src/c/index.js': "import { a } from '../a.js';\nexport const c = a;\n",
    'src/d.js': "import { c } from './c';\nexport const d = c;\n",
    'src/d.test.js': "import { d } from './d.js';\nimport './a.js';\n",
  });
  const r = analitzaCiclesImports(arrel);
  assert.equal(r.totalFitxersAnalitzats, 4);
  assert.equal(r.totalCicles, 1);
  assert.deepEqual(r.cicles[0].membres, ['src/a.js', 'src/b.js']);
  assert.match(r.empremtatGlobalSrcSha256, /^[0-9a-f]{64}$/);
});

test('analitzaCiclesImports: una arrel relativa troba els mateixos cicles que l’absoluta', (t) => {
  const arrel = arrelTemporal(t, {
    'src/a.js': "import { b } from './b.js';\nexport const a = 1;\n",
    'src/b.js': "import { a } from './a.js';\nexport const b = 2;\n",
  });
  const abans = process.cwd();
  process.chdir(arrel);
  try { assert.equal(analitzaCiclesImports('.').totalCicles, 1); }
  finally { process.chdir(abans); }
});

test('analitzaCiclesImports: un DAG net dona zero cicles', (t) => {
  const arrel = arrelTemporal(t, {
    'src/fulla.js': 'export const x = 1;\n',
    'src/branca.js': "import { x } from './fulla.js';\nexport const y = x;\n",
  });
  assert.equal(analitzaCiclesImports(arrel).totalCicles, 0);
});

test('construeixClaims: la columna fantasma, el desbordament i les targetes buides duplicades són roigs', () => {
  const net = { width: 1280, page_w: 1280, sideways_scroll: false, phantom_columns: [], duplicate_empty_cards: [], a11y: { wide_tables_p0128: 0, broken_images: 0 } };
  assert.ok(construeixClaims('/x', [net]).every((c) => c.passed));
  const brut = {
    ...net,
    sideways_scroll: true,
    phantom_columns: [{ tag: 'section', className: 'app-grid-column--left', width: 260, height: 777, bg: null }],
    duplicate_empty_cards: [{ text: 'Barra · 0 línies · 0,00 €', repeticions: 2 }],
  };
  const roigs = construeixClaims('/x', [brut], { consoleErrors: ['Error'], failedRequests: [{ url: '/a.js', status: 404 }] })
    .filter((c) => !c.passed).map((c) => c.title);
  assert.equal(roigs.length, 5);
  assert.ok(roigs.some((t) => t.includes('columnes fantasma')));
  assert.ok(construeixClaims('/x', []).some((c) => !c.passed), 'sense cap mesura no pot ser verd');
});

test('lligArgs: per defecte cap eixida fixa, rutes i amplàries parsejades, arguments desconeguts refusats', () => {
  const a = lligArgs(['node', 'tractor', '--rutes', '/a, /b', '--amplaries', '320,1280']);
  assert.equal(a.out, null);
  assert.deepEqual(a.rutes, ['/a', '/b']);
  assert.deepEqual(a.amplaries, [320, 1280]);
  assert.equal(a.baseUrl, 'http://localhost:3340');
  assert.throws(() => lligArgs(['node', 'tractor', '--desconegut']), /desconegut/);
  assert.throws(() => lligArgs(['node', 'tractor', '--settle-ms', 'no']), /settle-ms/);
  assert.equal(slugRuta('/app/bar/taules'), 'app_bar_taules');
  assert.equal(slugRuta('/'), 'inici');
});

test('main: sense Chrome falla abans de crear cap temporal', async (t) => {
  const arrel = arrelTemporal(t, { 'src/a.js': 'export const a = 1;\n' });
  const abans = fs.readdirSync(fs.realpathSync(os.tmpdir())).filter((n) => n.startsWith('sdp-craft-paritat-')).length;
  await assert.rejects(main(['node', 'tractor', '--arrel', arrel, '--chrome', path.join(arrel, 'no-hi-ha-chrome')]), /No trobe cap Chrome executable/);
  const despres = fs.readdirSync(fs.realpathSync(os.tmpdir())).filter((n) => n.startsWith('sdp-craft-paritat-')).length;
  assert.equal(despres, abans);
});

test('main: un Chrome sense permís d’execució es refusa abans del spawn i sense temporals (Gauntlet R2)', async (t) => {
  const arrel = arrelTemporal(t, { 'src/a.js': 'export const a = 1;\n', 'chrome-noexec': '#!/bin/sh\nexit 0\n' });
  fs.chmodSync(path.join(arrel, 'chrome-noexec'), 0o644);
  const abans = fs.readdirSync(fs.realpathSync(os.tmpdir())).filter((n) => n.startsWith('sdp-craft-')).length;
  await assert.rejects(main(['node', 'tractor', '--arrel', arrel, '--chrome', path.join(arrel, 'chrome-noexec')]), /No trobe cap Chrome executable/);
  const despres = fs.readdirSync(fs.realpathSync(os.tmpdir())).filter((n) => n.startsWith('sdp-craft-')).length;
  assert.equal(despres, abans);
});

test('main: un Chrome que no arrenca (intèrpret inexistent) rebutja sense temporals ni processos (Gauntlet R2b)', async (t) => {
  const tmpPropi = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-craft-prova-tmp-'));
  const arrel = arrelTemporal(t, { 'src/a.js': 'export const a = 1;\n', 'chrome-trencat': '#!/no/hi/ha/interpret\n' });
  fs.chmodSync(path.join(arrel, 'chrome-trencat'), 0o755);
  const tmpAbans = process.env.TMPDIR;
  process.env.TMPDIR = tmpPropi;
  try {
    await assert.rejects(main(['node', 'tractor', '--arrel', arrel, '--chrome', path.join(arrel, 'chrome-trencat'), '--rutes', '/x', '--amplaries', '1280']), /Chrome no ha arrencat/);
    assert.deepEqual(fs.readdirSync(tmpPropi), [], 'cap sdp-craft-* residual');
  } finally {
    if (tmpAbans === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = tmpAbans;
    fs.rmSync(tmpPropi, { recursive: true, force: true });
  }
});

test('extreuImportsEstatics: .ts i .tsx s’analitzen amb TypeScript (Gauntlet R2)', () => {
  assert.deepEqual(extreuImportsEstatics('import type { T } from "./t";\nimport { type U } from "./u";\nexport type { V } from "./v";\nimport { a } from "./a";\nconst x: number = 1;\n', '.ts'), ['./a']);
  assert.deepEqual(extreuImportsEstatics('import B from "./b";\nexport const C = (p: { n: number }) => <B n={p.n} />;\n', '.tsx'), ['./b']);
  assert.throws(() => extreuImportsEstatics('const x: number = 1;\n', '.js'));
});

test('esHostDeDades: pel nom de host, no per subcadena (Gauntlet R2)', () => {
  assert.equal(esHostDeDades('https://adjl.supabase.co/rest/v1/x'), true);
  assert.equal(esHostDeDades('https://supabase.co/'), true);
  assert.equal(esHostDeDades('http://localhost:3340/api?desti=supabase.co'), false);
  assert.equal(esHostDeDades('https://supabase.com/docs'), false);
  assert.equal(esHostDeDades('https://evilsupabase.co/'), false);
  assert.equal(esHostDeDades('no és una URL'), false);
});

const chromesVius = (dir) => {
  try {
    return execFileSync('ps', ['-ax', '-o', 'command='], { encoding: 'utf8' })
      .split('\n').filter((l) => l.includes(dir) && l.includes('sdp-craft-cdp-') && !l.includes('ps -ax')).length;
  } catch { return 0; }
};

const PAGINA_NETA = '<!doctype html><html lang="ca"><head><meta charset="utf-8"><title>Neta</title></head>'
  + '<body style="margin:0"><main style="display:flex;gap:8px"><section><h1>Hola</h1><p>Text del poble.</p></section>'
  + '<aside><button type="button">Obri</button></aside></main></body></html>';
const PAGINA_FANTASMA = '<!doctype html><html lang="ca"><head><meta charset="utf-8"><title>Fantasma</title></head>'
  + '<body style="margin:0"><main style="display:flex"><section style="width:260px;height:600px"></section>'
  + '<section><h1>Taules</h1><p>Contingut.</p></section></main></body></html>';

test('main amb Chrome real: verd amb pàgina neta, roig amb columna fantasma, cap Chrome viu ni temporal', { skip: !fs.existsSync(CHROME) && 'Chrome no disponible' }, async (t) => {
  const servidor = http.createServer((req, res) => {
    if (req.url.startsWith('/no-hi-es')) { res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }); res.end('<!doctype html><title>404</title>'); return; }
    const html = req.url.startsWith('/fantasma') ? PAGINA_FANTASMA : req.url === '/' || req.url.startsWith('/neta') ? PAGINA_NETA : null;
    if (!html) { res.writeHead(204); res.end(); return; }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  t.after(() => new Promise((ok) => { servidor.closeAllConnections?.(); servidor.close(() => ok()); }));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const arrel = arrelTemporal(t, { 'src/a.js': 'export const a = 1;\n' });
  const out = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-craft-prova-out-'));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));
  const tmpPropi = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-craft-prova-tmp-'));
  const tmpAbans = process.env.TMPDIR;
  process.env.TMPDIR = tmpPropi;
  t.after(() => {
    if (tmpAbans === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = tmpAbans;
    fs.rmSync(tmpPropi, { recursive: true, force: true });
  });
  assert.equal(fs.realpathSync(os.tmpdir()), fs.realpathSync(tmpPropi));
  const logs = [];
  t.mock.method(console, 'log', (...a) => logs.push(a.join(' ')));

  const verd = await main(['node', 'tractor', '--arrel', arrel, '--base-url', base, '--rutes', '/neta',
    '--amplaries', '360,1280', '--out', path.join(out, 'neta'), '--settle-ms', '300']);
  assert.equal(verd, 0, logs.join('\n'));
  const kept = JSON.parse(fs.readFileSync(path.join(out, 'neta', 'kept-checks.json'), 'utf8'));
  assert.equal(kept.circularImportsCount, 0);
  assert.ok(fs.existsSync(path.join(out, 'neta', 'captures', 'neta', 'screenshot-360.png')));

  const roig = await main(['node', 'tractor', '--arrel', arrel, '--base-url', base, '--rutes', '/fantasma',
    '--amplaries', '1280', '--out', path.join(out, 'fantasma'), '--settle-ms', '300']);
  assert.equal(roig, 1);
  const cap = JSON.parse(fs.readFileSync(path.join(out, 'fantasma', 'captures', 'fantasma', 'capture.json'), 'utf8'));
  assert.ok(cap.claims.some((c) => !c.passed && c.title.includes('columnes fantasma')));

  // Una ruta que no carrega (404 o servidor caigut) no es mesura: main llança i la CLI ix amb 2.
  await assert.rejects(main(['node', 'tractor', '--arrel', arrel, '--base-url', base, '--rutes', '/no-hi-es',
    '--amplaries', '1280', '--out', path.join(out, 'no-hi-es'), '--settle-ms', '200']), /HTTP 404/);
  const tancat = http.createServer();
  await new Promise((ok) => tancat.listen(0, '127.0.0.1', ok));
  const portTancat = tancat.address().port;
  await new Promise((ok) => tancat.close(ok));
  await assert.rejects(main(['node', 'tractor', '--arrel', arrel, '--base-url', `http://127.0.0.1:${portTancat}`, '--rutes', '/',
    '--amplaries', '1280', '--out', path.join(out, 'caigut'), '--settle-ms', '200']), /No s'ha pogut carregar/);

  assert.equal(chromesVius(tmpPropi), 0, 'cap Chrome del tractor ha de quedar viu');
  const temporals = fs.readdirSync(tmpPropi).filter((n) => n.startsWith('sdp-craft-cdp-'));
  assert.deepEqual(temporals, [], 'cap perfil temporal de Chrome ha de quedar al disc');
});
