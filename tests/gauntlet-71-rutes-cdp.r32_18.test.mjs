import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EXTRA_ROUTES,
  KEY_5LANG_ROUTES,
  SCENARIOS_PER_ROUTE,
  auditDomInPage,
  llistaRutesCompleta,
  main,
} from '../tooling/anatomia/gauntlet-71-rutes-cdp.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('gauntlet-71-rutes-cdp: cobrix exactament les 73 rutes canòniques de Consola Zero (R32.86 hi afig /cada-cosa-al-seu-lloc i /joc-taxonomia) més /page/guia i les 6 micro-apps', () => {
  const rutesJson = JSON.parse(fs.readFileSync(path.join(ARREL, 'tooling/gates/consola-zero.rutes.json'), 'utf8'));
  const { canoniques, totes } = llistaRutesCompleta(rutesJson);
  assert.equal(canoniques.length, 73);
  assert.equal(totes.length, 80);
  for (const extra of EXTRA_ROUTES) {
    assert.ok(totes.includes(extra), `Falta la ruta extra ${extra}`);
  }
  for (const app of ['/app/bar', '/app/nevera', '/app/gestoria', '/app/genealogia', '/app/lector', '/app/salut', '/page/guia']) {
    assert.ok(KEY_5LANG_ROUTES.has(app), `Falta ${app} a KEY_5LANG_ROUTES`);
  }
});

test('gauntlet-71-rutes-cdp: cobrix els 4 viewports (320, 359, 360, 1280), Mode Sènior ON/OFF, light/dark i les 5 llengües', () => {
  const viewports = new Set(SCENARIOS_PER_ROUTE.map((s) => `${s.w}x${s.h}`));
  assert.deepEqual([...viewports].sort(), ['1280x800', '320x700', '359x780', '360x800']);
  const temes = new Set(SCENARIOS_PER_ROUTE.map((s) => s.theme));
  assert.deepEqual([...temes].sort(), ['dark', 'light']);
  const seniors = new Set(SCENARIOS_PER_ROUTE.map((s) => s.senior));
  assert.deepEqual([...seniors].sort(), [false, true]);
  const llengues = new Set(SCENARIOS_PER_ROUTE.map((s) => s.lang));
  assert.deepEqual([...llengues].sort(), ['ca', 'en', 'es', 'eu', 'gl']);
});

test('gauntlet-71-rutes-cdp: auditDomInPage és una funció pura serialitzable i exclou contenidors secundaris en H1>=H2>=H3', () => {
  const codi = auditDomInPage.toString();
  assert.doesNotThrow(() => new Function(`return (${codi})`));
  assert.match(codi, /sdp-mode-senior-xip/);
  assert.match(codi, /H1>=H2/);
  assert.match(codi, /H2>=H3/);
  assert.match(codi, /nav, aside, dialog, \.sp-card, \.sdp-especimen/);
  assert.match(codi, /role="region"/);
});

/* Gauntlet v1.2.14 R2 · L'arnés construïx dins del seu directori de treball i no toca mai el <arrel>/dist d'una altra
   mà (construïx en un temporal sota node_modules/.cache); si Chrome no arrenca, rebutja (no tomba el procés) i no
   deixa cap temporal. Arrel falsa: firebase.json, rutes,
   un vite fals que escriu a --outDir i les dues eines SEO falses. */
test('gauntlet-71-rutes-cdp: no toca <arrel>/dist i neteja el treball si Chrome no arrenca', async () => {
  const base = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-g71-prova-'));
  const tmpPropi = path.join(base, 'tmp');
  const arrel = path.join(base, 'arrel');
  fs.mkdirSync(tmpPropi);
  for (const d of ['node_modules/vite/bin', 'tooling/gates', 'tooling/seo', 'dist']) fs.mkdirSync(path.join(arrel, d), { recursive: true });
  fs.writeFileSync(path.join(arrel, 'dist/marcador.txt'), 'build-de-produccio');
  fs.writeFileSync(path.join(arrel, 'firebase.json'), JSON.stringify({ hosting: { public: 'dist', rewrites: [{ source: '**', destination: '/index.html' }] } }));
  fs.writeFileSync(path.join(arrel, 'tooling/gates/consola-zero.rutes.json'), JSON.stringify({ rutes: ['/'], notFound: [], exempcions: [] }));
  fs.writeFileSync(path.join(arrel, 'node_modules/vite/bin/vite.js'), [
    "const fs = require('fs'); const path = require('path'); const a = process.argv; const o = a[a.indexOf('--outDir') + 1];",
    "fs.rmSync(o, { recursive: true, force: true }); fs.mkdirSync(o, { recursive: true });",
    "fs.writeFileSync(path.join(o, 'index.html'), '<!doctype html><div id=root></div>');",
    "fs.appendFileSync(path.join(process.cwd(), 'vite-log.txt'), o + '\\n');",
  ].join('\n'));
  fs.writeFileSync(path.join(arrel, 'tooling/seo/projeccio-publica.mjs'), "import fs from 'node:fs'; const a = process.argv; fs.writeFileSync(a[a.indexOf('--out') + 1], '{}');\n");
  fs.writeFileSync(path.join(arrel, 'tooling/seo/prerender-social.mjs'), 'process.exit(0);\n');
  // Un temporal abandonat per un SIGKILL anterior (pid mort): el build següent l'escombra.
  const abandonat = path.join(arrel, 'node_modules', '.cache', 'sdp-gauntlet-71-mort');
  fs.mkdirSync(abandonat, { recursive: true });
  fs.writeFileSync(path.join(abandonat, 'pid'), '999999');
  const tmpAbans = process.env.TMPDIR;
  process.env.TMPDIR = tmpPropi;
  try {
    await assert.rejects(main(['--arrel', arrel, '--chrome', path.join(base, 'no-hi-ha-chrome')]), /Chrome no ha arrencat/);
    assert.equal(fs.readFileSync(path.join(arrel, 'dist/marcador.txt'), 'utf8'), 'build-de-produccio');
    assert.deepEqual(fs.readdirSync(path.join(arrel, 'dist')), ['marcador.txt']);
    // vite escriu dins del projecte (sdp-public-net ho exigix), en un temporal sota node_modules/.cache, mai a dist.
    const outDirs = fs.readFileSync(path.join(arrel, 'vite-log.txt'), 'utf8').trim().split('\n');
    assert.equal(outDirs.length, 1);
    const cau = path.join(fs.realpathSync(arrel), 'node_modules', '.cache');
    assert.ok(outDirs[0].startsWith(cau + path.sep + 'sdp-gauntlet-71-'), `vite ha d'escriure sota node_modules/.cache: ${outDirs[0]}`);
    assert.deepEqual(fs.readdirSync(cau), [], 'cap temporal de build residual dins del projecte');
    assert.deepEqual(fs.readdirSync(tmpPropi), [], 'cap temporal sdp-gauntlet-71-cdp-* residual');
  } finally {
    if (tmpAbans === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = tmpAbans;
    fs.rmSync(base, { recursive: true, force: true });
  }
});
