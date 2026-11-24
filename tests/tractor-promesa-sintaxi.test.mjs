import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { importacionsExecutables } from '../tooling/lib/promesa-js.mjs';

const root = '/tmp/sdp-promesa-synthetic';
const inspect = source => importacionsExecutables(source, { root, file: 'tooling/fixture.mjs' });
test('fixture strings and comments are data, real imports retain exact lines and decoded specifiers', () => {
  const result = inspect(`const fixture = "await import('./absent.js')";
// import('./comment.js')
const template = \`import('./text.js')\`;
await import('./real.js');
await import('./\\u006dissing.js');`);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.imports.map(({ spec, line }) => ({ spec, line })), [{ spec: './real.js', line: 4 }, { spec: './missing.js', line: 5 }]);
});
test('executable template interpolations and nested callbacks still contain live imports', () => {
  const result = inspect('const text = `value ${await import("./missing.js")}`; Promise.resolve().then(() => import("./callback.js"));');
  assert.deepEqual(result.imports.map(item => item.spec), ['./missing.js', './callback.js']);
});
test('Node --eval follows a literal const and its native cwd rather than the host source directory', () => {
  const source = `import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source="await import('./tooling/missing.mjs')";
spawnSync(process.execPath,['--input-type=module','-e',source],{cwd:ROOT});`;
  const result = inspect(source);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.imports.map(({ spec, base, inline }) => ({ spec, base, inline })), [{ spec: './tooling/missing.mjs', base: root, inline: true }]);
});
test('literal inline default cwd, aliases and namespace calls are inspected', () => {
  for (const source of [
    `import {execFileSync as run} from 'node:child_process';run('node',['--eval',"import('./absent.js')"]);`,
    `import cp from 'node:child_process';cp.spawnSync(process.execPath,['-e',\`import('./absent.js')\`]);`
  ]) {
    const result = inspect(source);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.imports.map(item => [item.spec, item.base]), [['./absent.js', root]]);
  }
});
test('shadowed source and unknown cwd cannot borrow another const binding', () => {
  const result = inspect(`import {spawnSync} from 'node:child_process';
const source="import('./outer.js')";
function run(source){spawnSync(process.execPath,['-e',source]);}
spawnSync(process.execPath,['-e',"import('./missing.js')"],{cwd:globalThis.cwd});`);
  assert.deepEqual(result.imports, []);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].detail, /cwd/);
});
test('invalid JavaScript fails closed rather than becoming an empty green scan', () => {
  const result = inspect('await import(');
  assert.equal(result.errors.length, 1);
  assert.equal(result.imports.length, 0);
});
test('native dispatch aliases respect lexical shadowing', () => {
  assert.deepEqual(inspect(`import {spawnSync} from 'node:child_process';
function custom(spawnSync){spawnSync('node',['-e',"import('./absent.js')"]);}`).imports, []);
  assert.deepEqual(inspect(`import {spawnSync} from 'node:child_process';
const custom={method(spawnSync){spawnSync('node',['-e',"import('./absent.js')"]);}};`).imports, []);
});
test('mutated argument arrays and option objects fail closed, including const aliases', () => {
  for (const setup of [
    `const args=['-e',"import('./safe.js')"];args[1]="import('./missing.js')";const options={};`,
    `const args=['-e',"import('./safe.js')"];const alias=args;alias[1]="import('./missing.js')";const options={};`,
    `const args=['-e',"import('./safe.js')"];const options={cwd:'/tmp/safe'};options.cwd='/tmp/other';`
  ]) {
    const result = inspect(`import {spawnSync} from 'node:child_process';${setup}spawnSync('node',args,options);`);
    assert.equal(result.errors.length, 1);
    assert.deepEqual(result.imports, []);
  }
});
test('nested eval import.meta.url and process.cwd resolve from the eval working directory', () => {
  const nested = `import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
const dir=path.dirname(fileURLToPath(import.meta.url));spawnSync('node',['-e',"import('./missing.js')"],{cwd:dir});`;
  const result = inspect(`import {spawnSync} from 'node:child_process';spawnSync('node',['-e',${JSON.stringify(nested)}],{cwd:'/tmp/other'});`);
  assert.deepEqual(result.errors, []);
  assert.equal(result.imports[0].base, '/tmp/other');
});
test('const argument and option objects retain cwd, last property wins', () => {
  for (const options of [
    `const options={cwd:'/tmp/other'};`,
    `const options={cwd:'/tmp/wrong',cwd:'/tmp/other'};`,
    `const options={...globalThis.extra,cwd:'/tmp/other'};`
  ]) {
    const result = inspect(`import {spawnSync} from 'node:child_process';
const args=['-e',"import('./absent.js')"];${options}spawnSync('node',args,options);`);
    assert.deepEqual(result.errors, []);
    assert.equal(result.imports[0].base, '/tmp/other');
  }
});
test('opaque option values, getters and later spreads cannot invent a cwd', () => {
  for (const options of ['globalThis.options', '{cwd:process.cwd(),...globalThis.extra}', '{get cwd(){return "/tmp/other"}}', '{[globalThis.key]:1}']) {
    const result = inspect(`import {spawnSync} from 'node:child_process';spawnSync('node',['-e',"import('./absent.js')"],${options});`);
    assert.equal(result.errors.length, 1, options);
    assert.deepEqual(result.imports, []);
  }
});
test('the real gate refuses missing executable imports and accepts source fixtures as data', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-promesa-gate-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'scripts'));
  fs.mkdirSync(path.join(directory, '.agents/deute'), { recursive: true });
  fs.writeFileSync(path.join(directory, '.agents/AGENTS.md'), '# Synthetic fixture');
  fs.writeFileSync(path.join(directory, '.agents/deute/.promesa-deute.json'), JSON.stringify({ max: { P1: 0, P2: 0, P3: 0 }, ids: [] }));
  fs.writeFileSync(path.join(directory, 'package.json'), '{"type":"module"}');
  const gate = fileURLToPath(new URL('../tooling/gates/tractor-promesa.mjs', import.meta.url));
  const run = source => {
    fs.writeFileSync(path.join(directory, 'scripts/main.js'), source);
    const child = spawnSync(process.execPath, [gate, `--arrel=${directory}`, '--json'], { cwd: directory, encoding: 'utf8', timeout: 15000 });
    assert.ifError(child.error);
    return { status: child.status, report: JSON.parse(child.stdout) };
  };
  assert.equal(run('const fixture="await import(\'./missing.js\')";').status, 0);
  for (const source of [
    'await import("./missing.js");',
    `import {spawnSync} from 'node:child_process';spawnSync('node',['-e',"import('./missing.js')"]);`,
    `import {spawnSync} from 'node:child_process';const options={cwd:'${directory}/other'};spawnSync('node',['-e',"import('./exists.js')"],options);`
  ]) {
    fs.writeFileSync(path.join(directory, 'exists.js'), 'export const exists=true;');
    const result = run(source);
    assert.equal(result.status, 1, source);
    assert.ok(result.report.compte.P1 > 0);
  }
});
