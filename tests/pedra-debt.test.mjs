import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { jsxClassValues } from '../tooling/lib/jsx-class-values.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const values = source => jsxClassValues(source).flatMap(row => row.value.trim().split(/\s+/)).filter(Boolean);

test('class values include both branches but exclude comparison strings', () => {
  assert.deepEqual(values("const x = <div className={mode === 'intens' ? 'dark-intens' : 'dark'} />;"), ['dark-intens', 'dark']);
  assert.deepEqual(values("const x = <div className={`base ${mode === 'intens' ? 'dark-intens' : 'dark'}`} />;"), ['dark-intens', 'dark']);
});
test('array/logical class values remain visible; predicates and joins are not classes', () => {
  assert.deepEqual(values("const x = <div className={['base', active && 'active', value || 'fallback'].filter(x => x !== 'condition-only').join(' ')} />;"), ['base', 'active', 'fallback']);
  assert.deepEqual(values("const x = <div className={active ? 'unknown-class' : 'other-unknown'} />;"), ['unknown-class', 'other-unknown']);
});
test('malformed JSX does not quietly reduce the class audit', () => {
  assert.throws(() => jsxClassValues('const x = <div className={broken')); 
});
test('gate reports unknown rendered classes and excludes control-only literals', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-class-values-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.mkdirSync(path.join(root, '.agents/deute'), { recursive: true });
  fs.writeFileSync(path.join(root, '.agents/deute/.pedra-seca-deute.json'), '{}');
  fs.writeFileSync(path.join(root, 'src/main.jsx'), "export const x = <div className={`base ${mode === 'intens' ? 'dark-intens' : 'unknown'}`} />;");
  fs.writeFileSync(path.join(root, 'src/style.css'), '.base {} .dark-intens {}');
  const run = spawnSync(process.execPath, [path.join(ROOT, 'tooling/brain/tractor-pedra-seca.mjs'), '--detall'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /\.unknown\s+→/);
  assert.doesNotMatch(run.stdout, /\.intens\s+→/);
});

test('CSS import graph follows the real central stylesheet, not comments or unreferenced files', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-css-imports-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src/css'), { recursive: true });
  fs.mkdirSync(path.join(root, '.agents/deute'), { recursive: true });
  fs.writeFileSync(path.join(root, '.agents/deute/.pedra-seca-deute.json'), '{}');
  fs.writeFileSync(path.join(root, 'src/main.jsx'), "import css from './css/index.css?inline'; export { css };");
  fs.writeFileSync(path.join(root, 'src/css/index.css'), "@import url('./linked.css'); @import './direct.css'; /* @import url('./orphan.css'); */");
  for (const name of ['linked', 'direct', 'orphan']) fs.writeFileSync(path.join(root, `src/css/${name}.css`), '.present {}');
  const run = spawnSync(process.execPath, [path.join(ROOT, 'tooling/brain/tractor-pedra-seca.mjs'), '--detall'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /src\/css\/orphan.css/);
  assert.doesNotMatch(run.stdout, /src\/css\/(?:linked|direct).css/);
});

/* P1-08 (pla 261028_1526, §3.6.2) · L'app nativa és una arrel del graf: el que penja de
   src/natiu/entrada.jsx no és orfe (LLEI 8), i un fitxer que no penja de cap entrada ho continua
   sent. Sense document.* a la fixture: la LLEI 6 en queda fora. */
test('the native entry (src/natiu/entrada.jsx) roots the module graph; a loose file stays orphan', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-entrada-nativa-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src/natiu'), { recursive: true });
  fs.mkdirSync(path.join(root, '.agents/deute'), { recursive: true });
  fs.writeFileSync(path.join(root, '.agents/deute/.pedra-seca-deute.json'), '{}');
  fs.writeFileSync(path.join(root, 'src/main.jsx'), 'export const lloc = 1;');
  fs.writeFileSync(path.join(root, 'src/natiu/entrada.jsx'), "import './entradaSocial.js'; export const natiu = 1;");
  fs.writeFileSync(path.join(root, 'src/natiu/entradaSocial.js'), 'export const social = 1;');
  fs.writeFileSync(path.join(root, 'src/natiu/orfe.js'), 'export const orfe = 1;');
  const run = spawnSync(process.execPath, [path.join(ROOT, 'tooling/brain/tractor-pedra-seca.mjs'), '--detall'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 1, 'amb el deute buit, l’orfe és una infracció nova');
  assert.match(run.stdout, /src\/natiu\/orfe\.js/);
  assert.doesNotMatch(run.stdout, /src\/natiu\/entrada(?:Social)?\.jsx?\b/);
});

/* P1-08 · Les entrades del tractor són les dels builds, ni més ni menys: la del lloc (el
   <script type="module"> d'index.html), la nativa (vite.natiu.config.js, ENTRADA_NATIVA), la del
   paquet (vite.standalone.config.js, lib.entry) i la Consola. Una de més amaga orfes de veres; cap
   no apunta a un fitxer que ja no existix (com el vell src/wp-standalone.js). El tractor acaba amb
   process.exit i no es pot importar: es llig el literal. */
test('tractor ENTRADES equal the Vite entries plus the Consola, and every entry exists on disk', async () => {
  const { ENTRADA_NATIVA } = await import('../vite.natiu.config.js');
  const llig = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const literal = /const ENTRADES = \[([^\]]*)\];/.exec(llig('tooling/brain/tractor-pedra-seca.mjs'))?.[1];
  assert.ok(literal, 'el literal de ENTRADES');
  const entrades = [...literal.matchAll(/'([^']+)'/g)].map(m => m[1]);
  const delLloc = /<script type="module" src="\/([^"]+)"><\/script>/.exec(llig('index.html'))?.[1];
  assert.ok(delLloc, 'el <script type="module"> d’index.html');
  const delPaquet = /lib:\s*\{\s*entry:\s*path\.resolve\(__dirname,\s*'([^']+)'\)/.exec(llig('vite.standalone.config.js'))?.[1];
  assert.ok(delPaquet, 'el lib.entry de vite.standalone.config.js');
  assert.deepEqual([...entrades].sort(), [delLloc, ENTRADA_NATIVA.replace(/^\//, ''), delPaquet, 'tooling/brain/mapa-consola.mjs'].sort(),
    'ENTRADES: les dels builds i la Consola, sense cap de més');
  for (const entrada of entrades) assert.ok(fs.existsSync(path.join(ROOT, entrada)), `${entrada}: entrada morta`);
});

/* Pedra Seca, part C (proposta 261031) · Les arrels de build de la LLEI 8 són
   tots els configs de Vite de l'arrel, ni més ni menys (vitest.*.config.js
   no: és de les proves). Un config nou que importe src/ sense entrar ací faria
   orfe codi de build; un de més, que ja no existix, amagaria orfes de veres. */
test('tractor ENTRADES_DE_BUILD equal the Vite configs at the root, and every one exists', () => {
  const llig = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const literal = /const ENTRADES_DE_BUILD = \[([^\]]*)\];/.exec(llig('tooling/brain/tractor-pedra-seca.mjs'))?.[1];
  assert.ok(literal, 'el literal de ENTRADES_DE_BUILD');
  const deBuild = [...literal.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const configs = fs.readdirSync(ROOT).filter((nom) => /^vite(?:\.[\w-]+)?\.config\.js$/.test(nom));
  assert.deepEqual([...deBuild].sort(), configs.sort());
});
