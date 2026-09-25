import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const script = fileURLToPath(new URL('../tooling/gates/tractor-importacions.mjs', import.meta.url));
function run(t, source) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-importacions-')));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  fs.mkdirSync(path.join(root, 'tests'));
  fs.writeFileSync(path.join(root, 'tests/prova.test.mjs'), source);
  fs.writeFileSync(path.join(root, 'tests/real.mjs'), 'export default 1;');
  return spawnSync(process.execPath, [script], {cwd: root, encoding: 'utf8', timeout: 5000});
}
test('els literals de fixtures no són importacions però les proves sí que es comproven', t => {
  const valid = run(t, 'import real from "./real.mjs"; const fixture = `import absent from "./absent.mjs"`;');
  assert.equal(valid.status, 0, valid.stderr);
  const invalid = run(t, 'import absent from "./absent.mjs";');
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /absent.mjs/);
});
test('reexport, import dinàmic i require literals absents fallen', t => {
  for (const code of ['export * from "./absent.mjs";', 'import("./absent.mjs");', 'require("./absent.mjs");']) {
    const result = run(t, code);
    assert.equal(result.status, 1, code);
    assert.match(result.stderr, /absent.mjs/);
  }
});
test('un fitxer que no es pot analitzar no es declara verd', t => {
  const result = run(t, 'const = ;');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /PARSE:/);
});
