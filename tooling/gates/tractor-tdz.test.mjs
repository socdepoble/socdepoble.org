import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
const gate = fileURLToPath(new URL('./tractor-tdz.mjs', import.meta.url));
const cases = [
  ['false && omet dreta', 'const answer = false && later;\nconst later = 2;', 0],
  ['true || omet dreta', 'const answer = true || later;\nconst later = 2;', 0],
  ['ternari omet alternativa', 'const answer = true ? 1 : later;\nconst later = 2;', 0],
  ['mutant && avalua dreta', 'const answer = true && later;\nconst later = 2;', 1],
  ['mutant || avalua dreta', 'const answer = false || later;\nconst later = 2;', 1],
  ['mutant ternari avalua alternativa', 'const answer = false ? 1 : later;\nconst later = 2;', 1],
  ['TDZ directa', 'const answer = later;\nconst later = 2;', 1],
  ['mateixa línia', 'const answer = later; const later = 2;', 1],
  ['autoreferència', 'const answer = answer;', 1],
  ['IIFE eager', 'const answer = (() => later)();\nconst later = 2;', 1],
  ['destructuring posterior', 'const answer = later;\nconst { later } = { later: 2 };', 1],
  ['closure diferida', 'const answer = () => later;\nconst later = 2;\nif (answer() !== 2) throw Error();', 0],
  ['propietat no és binding', 'const row = { later: 2 };\nconst answer = row.later;\nconst later = 3;', 0],
  ['mutant declaració abans mateixa línia', 'const later = 2; const answer = later;', 0],
  ['mutant declaració abans IIFE', 'const later = 2; const answer = (() => later)();', 0],
  ['paràmetre homònim IIFE', 'const answer = ((later) => later)(2);\nconst later = 3;', 0],
  ['binding local homònim IIFE', 'const answer = (() => { const later = 2; return later; })();\nconst later = 3;', 0],
  ['let sense inicialitzador ja disponible', 'let later; const answer = later;', 0],
  ['destructuring anterior', 'const { later } = { later: 2 }; const answer = later;', 0],
  ['destructuring default ordenat', 'const [first = 2, answer = first] = [];', 0],
  ['destructuring default autoreferent', 'const [answer = answer] = [];', 1],
  ['nullish omet dreta', 'const answer = 0 ?? later;\nconst later = 2;', 0],
  ['nullish avalua dreta', 'const answer = null ?? later;\nconst later = 2;', 1],
  ['falsy numèric omet &&', 'const answer = 0 && later;\nconst later = 2;', 0],
  ['funció declarada cridada ara', 'function read() { return later; }\nconst answer = read();\nconst later = 2;', 1],
  ['funció declarada cridada després', 'function read() { return later; }\nconst later = 2;\nconst answer = read();', 0],
  ['IIFE no recorre return inassolible', 'const answer = (() => { return 1; later; })();\nconst later = 2;', 0],
  ['clau computada sí és lectura', 'const answer = { [later]: 2 };\nconst later = 3;', 1],
  ['funció local diferida de dins IIFE', 'const answer = (() => () => later)();\nconst later = 2;\nanswer();', 0],
  ['const function cridada eager', 'const read = () => later; const answer = read(); const later = 2;', 1],
  ['const function cridada després', 'const read = () => later; const later = 2; const answer = read();', 0],
  ['default param subministrat', 'const answer = ((x = later) => x)(2); const later = 3;', 0],
  ['default param absent', 'const answer = ((x = later) => x)(); const later = 3;', 1],
  ['default objecte subministrat', 'const answer = (({x = later}) => x)({x: 2}); const later = 3;', 0],
  ['default objecte absent', 'const answer = (({x = later}) => x)({}); const later = 3;', 1],
  ['funció reassignada segura', 'let read = () => later; read = () => 1; const answer = read(); const later = 2;', 0],
  ['funció reassignada insegura', 'let read = () => 1; read = () => later; const answer = read(); const later = 2;', 1],
  ['optional null no avalua índex', 'const answer = null?.[later]; const later = 2;', 0],
  ['classe abans disponible', 'class Later {}\nconst answer = Later;', 0],
  ['classe després TDZ', 'const answer = Later;\nclass Later {}', 1]
];
function command(args) {
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 3000,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, CI: '1',
      ...(process.env.SDP_OFFLINE_RECEIPTS ? { NODE_OPTIONS: process.env.NODE_OPTIONS, SDP_OFFLINE_RECEIPTS: process.env.SDP_OFFLINE_RECEIPTS } : {}) }, maxBuffer: 128 * 1024 });
  assert.ifError(r.error); assert.equal(r.signal, null); return r;
}
for (const [name, code, expected] of cases) test(name, t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-tdz-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, 'case.mjs'); fs.writeFileSync(file, code + '\n');
  const native = command([file]);
  assert.equal(native.status, expected, 'oracle Node no coincideix amb el golden: ' + native.stderr);
  if (expected) assert.match(native.stderr, /ReferenceError/);
  const actual = command([gate, root]);
  assert.equal(actual.status, expected, 'porta real: ' + actual.stdout + actual.stderr);
});
test('diagnòstic sintàctic es conserva i no executa font', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-tdz-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'bad.mjs'), 'const = ;');
  const r = command([gate, root]); assert.equal(r.status, 1); assert.match(r.stdout, /SINTAXI/);
});

test('helper pur i CLI conserven semàntica exacta i ordre determinista', async t => {
  const { auditaCodiTdz, auditaTdz } = await import('./tractor-tdz.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-tdz-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'z.mjs'), 'const z = later; const later = 2;');
  fs.writeFileSync(path.join(root, 'a.mjs'), 'const a = a;');
  const expected = auditaTdz(root);
  assert.equal(expected.length, 2); assert.match(expected[0].f, /a\.mjs$/);
  for (let n = 0; n < 10; n++) assert.deepEqual(auditaTdz(root), expected);
  for (const [, code, status] of cases) assert.equal(auditaCodiTdz(code).length > 0 ? 1 : 0, status);
  const a = command([gate, root]), b = command([gate, root]);
  assert.equal(a.status, 1); assert.equal(a.stdout, b.stdout); assert.equal(a.stderr, b.stderr);
});
