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
