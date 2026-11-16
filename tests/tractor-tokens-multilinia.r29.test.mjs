import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const porta = fileURLToPath(new URL('../tooling/gates/tractor-tokens.mjs', import.meta.url));
function executa(t, codi, llei = 'T1', tokens = ':root {\n  --sdp-conegut: red;\n  --sdp-pedra-500: red;\n}\n', canon = ':root {--sdp-canon-taronja: orange;}') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r29-tokens-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src/css'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/css/tokens.css'), tokens);
  fs.writeFileSync(path.join(root, 'src/css/design-tokens.css'), canon);
  fs.writeFileSync(path.join(root, 'src/css/component.css'), codi);
  const run = spawnSync(process.execPath, [porta, '--root', root, ...(llei ? ['--nomes', llei] : [])], { encoding: 'utf8' });
  assert.equal(run.signal, null);
  return { ...run, sortida: run.stdout + run.stderr };
}

for (const [nom, codi] of [
  ['compacte', '.a {color:var(--sdp-inexistent)}'],
  ['salt després de var(', '.a {\ncolor:var(\n--sdp-inexistent)}'],
  ['espai abans del tancament', '.a {color:var(--sdp-inexistent )}'],
  ['salt abans de coma', '.a {color:var(--sdp-inexistent\n, red)}'],
]) test(`T1 · token inexistent ${nom} rebutjat`, t => {
  const run = executa(t, codi);
  assert.equal(run.status, 1, run.sortida);
  assert.match(run.sortida, /--sdp-inexistent/);
});

test('T1 · conserva línia original i troba més d’un ús després de comentaris', t => {
  const run = executa(t, '/*\n var(--sdp-comentari)\n*/\n.a{color:var(\n --sdp-inexistent-a\n)}\n.b{color:var(--sdp-inexistent-b)}');
  assert.equal(run.status, 1, run.sortida);
  assert.match(run.sortida, /component\.css:4\s+↳[^\n]*--sdp-inexistent-a/);
  assert.match(run.sortida, /component\.css:7\s+↳[^\n]*--sdp-inexistent-b/);
  assert.doesNotMatch(run.sortida, /--sdp-comentari/);
});

for (const [nom, codi] of [
  ['multilínia', '.a{color:var(\n --sdp-conegut\n , red\n)}'],
  ['buit', '.a{color:var(--sdp-conegut,)}'],
]) test(`T2 · fallback ${nom} rebutjat encara que el token existix`, t => {
  const run = executa(t, codi, 'T2');
  assert.equal(run.status, 1, run.sortida);
  assert.match(run.sortida, /Fallback prohibit/);
});

test('T1/T2 · token definit multilínia sense fallback passa', t => {
  const codi = '.a{color:var(\n --sdp-conegut\n)} /* var(--sdp-comentari, red) */';
  for (const llei of ['T1', 'T2']) {
    const run = executa(t, codi, llei);
    assert.equal(run.status, 0, run.sortida);
  }
});

for (const [llei, nom, diagnostic] of [
  ['T4', '--sdp-pedra-500', 'és una primitiva'],
  ['T5', '--sdp-canon-taronja', 'és capa 0'],
]) test(`${llei} · token declarat d’una capa prohibida es rebutja també multilínia`, t => {
  const run = executa(t, `.a{color:var(\n${nom}\n)}`, llei);
  assert.equal(run.status, 1, run.sortida);
  assert.ok(run.sortida.includes(diagnostic), run.sortida);
});

test('mode complet · les dues capes prohibides no passen per haver-se partit en línies', t => {
  const run = executa(t, '.a{color:var(\n--sdp-pedra-500\n);border-color:var(\n--sdp-canon-taronja\n)}', null);
  assert.equal(run.status, 1, run.sortida);
  assert.match(run.sortida, /INFRACCIONS \(2\)/);
});

test('T3 · una declaració privada amb colon en la línia següent es rebutja', t => {
  const run = executa(t, '.a{\n--sdp-privat\n:red;\n}', 'T3');
  assert.equal(run.status, 1, run.sortida);
  assert.match(run.sortida, /component\.css:2\s+↳[^\n]*--sdp-privat/);
});

test('T1/T3 · una declaració canònica partida és una definició legítima', t => {
  const tokens = ':root {\n--sdp-conegut\n:red;\n}\n';
  for (const llei of ['T1', 'T3']) {
    const run = executa(t, '.a{color:var(--sdp-conegut)}', llei, tokens);
    assert.equal(run.status, 0, run.sortida);
  }
});

test('T1 · una declaració comentada del tema no definix cap token', t => {
  const run = executa(t, '.a{color:var(--sdp-comentat)}', 'T1', ':root { /* --sdp-comentat\n : red; */ }');
  assert.equal(run.status, 1, run.sortida);
  assert.match(run.sortida, /--sdp-comentat/);
});

test('T1 · una declaració comentada del cànon tampoc definix cap token', t => {
  const run = executa(t, '.a{color:var(--sdp-canon-comentat)}', 'T1', ':root {--sdp-conegut:red;}', ':root {/* --sdp-canon-comentat:orange; */}');
  assert.equal(run.status, 1, run.sortida);
  assert.match(run.sortida, /--sdp-canon-comentat/);
});
