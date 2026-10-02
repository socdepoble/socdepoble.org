/** Runtime del directori: IIFE amb React extern i dependències PHP efectives.
 * Fixtures locals; no carrega WordPress, comptes, dades ni URLs remotes. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { JSDOM } from 'jsdom';
import config, { GLOBALS_WORDPRESS, externDeWordPress, runtimeDelBuild, senseReactIncrustat, manifestDeRelease } from '../vite.standalone.config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = path.join(os.homedir(), '.studio/php-bin');
const PHP = [process.env.PHP_BIN, 'php', ...(fs.existsSync(studio) ? fs.readdirSync(studio).sort().reverse().map(v => path.join(studio, v, 'php')) : [])]
  .filter(Boolean).find(bin => spawnSync(bin, ['-v'], { timeout: 5000 }).status === 0);

test('la variant desconeguda falla; WordPress externalitza només els globals disponibles', () => {
  assert.throws(() => runtimeDelBuild('wordpres'), /SDP_VARIANT/);
  for (const id of ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime']) assert.equal(externDeWordPress(id), true);
  assert.equal(externDeWordPress('react-router-dom'), false);
  assert.throws(() => externDeWordPress('react/jsx-dev-runtime'), /sense equivalent/);
  const vals = { SDP_VARIANT: 'wordpress', SDP_RELEASE: '', VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: 'sb_publishable_' + 'fixturesintetica' };
  const before = Object.fromEntries(Object.keys(vals).map(k => [k, process.env[k]]));
  try {
    Object.assign(process.env, vals);
    const cfg = config({ mode: 'production', command: 'build' });
    assert.equal(cfg.build.outDir, 'wordpress-plugin/builds/directori/dist');
    assert.equal(cfg.build.rollupOptions.external('react'), true);
    assert.equal(cfg.build.rollupOptions.output.globals['react/jsx-runtime'], 'ReactJSXRuntime');
    const guard = cfg.plugins.flat(Infinity).find(p => p.name === 'sdp-react-del-nucli');
    assert.throws(() => guard.generateBundle.call({ error: m => { throw Error(m); } }, {}, {
      main: { modules: { '/a/node_modules/react/cjs/react.production.min.js': {} } }
    }), /encara incrusta React/);
  } finally {
    for (const [k, v] of Object.entries(before)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
});

test('l’IIFE renderitza JSX i actualitza hooks amb un únic React extern', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-runtime-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const entry = path.join(dir, 'fixture.jsx');
  fs.writeFileSync(entry, `import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
function Counter() { const [n, setN] = useState(0); return <button onClick={() => setN(n + 1)}>{n}</button>; }
export function mount(node) { const root = createRoot(node); flushSync(() => root.render(<Counter />)); return root; }
`);
  const result = await build({ configFile: false, root: ROOT, logLevel: 'silent',
    plugins: [react(), senseReactIncrustat()],
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: { write: false, minify: false, lib: { entry, name: 'RuntimeFixture', formats: ['iife'] },
      rollupOptions: { external: externDeWordPress, output: { globals: GLOBALS_WORDPRESS } } }
  });
  const output = (Array.isArray(result) ? result[0] : result).output.find(o => o.type === 'chunk');
  assert.ok(!Object.keys(output.modules).some(id => /node_modules\/(react|react-dom)\//.test(id)));
  const dom = new JSDOM('<main></main>', { runScripts: 'outside-only', url: 'https://fixture.invalid/' });
  t.after(() => dom.window.close());
  // Les UMD locals donen la mateixa API global que les biblioteques del nucli WP.
  for (const file of ['react/umd/react.production.min.js', 'react-dom/umd/react-dom.production.min.js']) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, 'node_modules', file), 'utf8'));
  }
  // Implementació JSX externa de React 18; executada contra el mateix React global.
  const jsx = fs.readFileSync(path.join(ROOT, 'node_modules/react/cjs/react-jsx-runtime.production.min.js'), 'utf8');
  const factory = new dom.window.Function('require', 'exports', jsx + '; return exports;');
  dom.window.ReactJSXRuntime = factory(id => { assert.equal(id, 'react'); return dom.window.React; }, {});
  dom.window.eval(output.code);
  const root = dom.window.RuntimeFixture.mount(dom.window.document.querySelector('main'));
  assert.equal(dom.window.document.querySelector('button').textContent, '0');
  dom.window.ReactDOM.flushSync(() => dom.window.document.querySelector('button').click());
  assert.equal(dom.window.document.querySelector('button').textContent, '1');
  root.unmount();
});

test('PHP valida runtimes i registra els handles fixos; la referència WP no ofereix un script incomplet', { skip: !PHP && 'PHP absent' }, t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-php-runtime-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'dist'));
  const runner = path.join(dir, 'runner.php');
  fs.writeFileSync(runner, `<?php
define('ABSPATH', __DIR__); define('SOCDEPOBLE_ENXUFE_FITXER', __DIR__ . '/plugin.php');
define('SOCDEPOBLE_ENXUFE_MANIFEST', 'dist/sdp-release.json'); define('SOCDEPOBLE_ENXUFE_BUNDLE', 'dist/app.js');
define('SOCDEPOBLE_ENXUFE_HANDLE', 'socdepoble-enxufe'); define('SOCDEPOBLE_ENXUFE_VERSIO', '0.2.0');
function plugin_dir_path($p) { return dirname($p) . '/'; }
function plugins_url($p, $file) { return 'https://fixture.invalid/' . $p; }
function esc_url_raw($v, $args) { return $v; } function sanitize_text_field($v) { return $v; }
function add_action(...$args) {} function add_filter(...$args) {}
function wp_register_script(...$args) { $GLOBALS['script'] = $args; }
function wp_register_style(...$args) {} function wp_add_inline_style(...$args) {}
require $argv[1] . '/wordpress-plugin/includes/manifest.php';
require $argv[1] . '/wordpress-plugin/includes/marcatge.php';
$manifest = socdepoble_enxufe_manifest_local();
socdepoble_enxufe_registra_actius();
echo json_encode(array('manifest' => $manifest, 'deps' => $GLOBALS['script'][2],
  'reference' => ($manifest['runtime']['amfitrio'] ?? null) === 'wordpress' ? socdepoble_enxufe_marcatge_de_referencia() : null));
`);
  const base = manifestDeRelease({ versio: '0.2.0', node: {}, generat: '2026-10-02T00:00:00Z',
    fitxers: [{ cami: 'soc-de-poble.standalone.js', contingut: Buffer.from('fixture') }] }).manifest;
  const run = runtime => {
    fs.writeFileSync(path.join(dir, 'dist/sdp-release.json'), JSON.stringify({ ...base, runtime }));
    const p = spawnSync(PHP, [runner, ROOT], { encoding: 'utf8', timeout: 10000 });
    assert.equal(p.status, 0, p.stderr + p.stdout);
    return JSON.parse(p.stdout);
  };
  for (const runtime of [undefined, runtimeDelBuild('autonom')]) {
    const result = run(runtime); assert.equal(result.manifest.runtime.amfitrio, 'autonom'); assert.deepEqual(result.deps, []);
  }
  const wp = run(runtimeDelBuild('wordpress'));
  assert.deepEqual(wp.deps, ['react', 'react-dom', 'react-jsx-runtime']);
  assert.match(wp.reference, /autonomous distribution for version 0\.2\.0/); assert.doesNotMatch(wp.reference, /<script/);
  for (const runtime of [{ amfitrio: 'unknown', dependencies: [] }, { ...runtimeDelBuild('wordpress'), dependencies: ['evil'] },
    { ...runtimeDelBuild('wordpress'), wordpressMinim: '6.5' }]) assert.equal(run(runtime).manifest, null);
});
