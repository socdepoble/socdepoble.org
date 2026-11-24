/** The npm exceptions describe input scope; they must not turn rejected input green. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const execute = (args, options = {}) => {
  const child = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 15000, ...options });
  assert.ifError(child.error);
  return child;
};
test('chain declares the two corpus/snapshot contracts without treating their absence as observed evidence', () => {
  const child = execute(['tooling/gates/tractor-cadena.mjs', '--json']);
  const report = JSON.parse(child.stdout);
  assert.equal(child.status, 0, child.stderr);
  for (const name of ['porta:alergens-unanimitat', 'porta:radiografia-supabase-viu']) {
    const entry = report.avisos.find(item => item.llei === 'C4' && item.subjecte === name);
    assert.ok(entry, name);
    assert.match(entry.missatge, /Contracte/);
    assert.match(entry.missatge, /primary/);
    assert.ok(!report.problemes.some(item => item.subjecte === name));
  }
  const absent = execute(['tooling/gates/verifica-alergens-unanimitat.mjs', '--strict']);
  assert.equal(absent.status, 1);
  assert.equal(JSON.parse(absent.stdout).coberturaEstudi, 'no_acreditada');
});
test('the exact npm commands reject invalid bounded input before external corpus/SQL is needed', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3288-input-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const input = path.join(directory, 'invalid.json');
  fs.writeFileSync(input, '{invalid');
  const scripts = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts;
  const commands = [
    ['porta:alergens-unanimitat', ['--file', input, '--strict'], 1],
    ['porta:radiografia-supabase-viu', ['--snapshot', input], 2]
  ];
  for (const [name, args, status] of commands) {
    const command = scripts[name].split(' ');
    assert.equal(command.shift(), 'node');
    const result = execute([...command, ...args]);
    assert.equal(result.status, status, name);
    const report = JSON.parse(result.stdout);
    assert.ok(report.estat === 'malformat' || report.verdict === 'INPUT_OR_LOCAL_EXECUTION_REJECTED', name);
    assert.ok(!result.stdout.includes(input));
  }
});
