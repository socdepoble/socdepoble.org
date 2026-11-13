import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { MANIFEST_PATH, R21_2_SUITES, mergeR21_2Suites, inspectRegistration, applyRegistration, main } from '../tooling/push/registra-suites.mjs';
import { validateManifest } from '../tooling/tests/run-node-tests.mjs';

const helper = fileURLToPath(new URL('../tooling/push/registra-suites.mjs', import.meta.url));
const entry = (p, suite = 'primary') => ({ path: p, suite, reason: 'Existing fixture: preserve this text', custom: { keep: true } });
const baseManifest = () => ({ schema: 'sdp.node-suites.v1', policy: { untouched: true }, requiredPrimary: ['tests/existing.test.mjs'], extra: ['r21.1'], files: [entry('tests/existing.test.mjs'), entry('tests/legacy.test.mjs', 'laboratory')] });
function fixture(t, manifest = baseManifest()) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-push-register-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const p of [...manifest.files.map(e => e.path), ...R21_2_SUITES.map(e => e.path)]) {
    fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
    fs.writeFileSync(path.join(root, p), '// synthetic suite\n');
  }
  fs.mkdirSync(path.dirname(path.join(root, MANIFEST_PATH)), { recursive: true });
  fs.writeFileSync(path.join(root, MANIFEST_PATH), JSON.stringify(manifest), { mode: 0o640 });
  return { root, manifest, target: path.join(root, MANIFEST_PATH) };
}
const leftovers = root => fs.readdirSync(path.join(root, 'tooling/tests')).filter(p => p.endsWith('.tmp') || p.endsWith('.lock'));

test('pure merge appends only the explicit R21.2/R21.4/R21.5 primary suites and preserves the entire incoming R21.1 manifest', () => {
  const input = baseManifest();
  input.files.push(entry('tests/copublicacio-foraster-opcio-a.test.mjs'));
  input.requiredPrimary.push('tests/copublicacio-foraster-opcio-a.test.mjs');
  const before = structuredClone(input);
  const result = mergeR21_2Suites(input);
  assert.deepEqual(input, before);
  assert.deepEqual(result.manifest.files.slice(0, input.files.length), input.files);
  assert.deepEqual(result.manifest.requiredPrimary.slice(0, input.requiredPrimary.length), input.requiredPrimary);
  assert.deepEqual(result.manifest.policy, input.policy);
  assert.deepEqual(result.manifest.extra, input.extra);
  assert.deepEqual(result.added, R21_2_SUITES.map(e => e.path));
  assert.equal(result.manifest.files.find(e => e.path.includes('missatgeria-r21-2')).kind, 'postgres');
  assert.ok(result.manifest.files.slice(input.files.length).every(e => e.suite === 'primary'));
  assert.ok(!result.manifest.files.some(e => e.path.endsWith('publica-tot.r21_2.test.js')));
});

test('pure merge is idempotent and preserves compatible existing entries even without kind metadata', () => {
  const input = baseManifest();
  input.files.push(entry(R21_2_SUITES[0].path));
  const once = mergeR21_2Suites(input);
  assert.deepEqual(once.manifest.files[2], input.files[2]);
  const twice = mergeR21_2Suites(once.manifest);
  assert.equal(twice.changed, false);
  assert.deepEqual(twice.manifest, once.manifest);
});

test('conflicting categories, kind metadata, duplicates and malformed coverage fail without recategorizing', () => {
  for (const suite of ['laboratory', 'session']) {
    const input = baseManifest(); input.files.push(entry(R21_2_SUITES[0].path, suite));
    assert.throws(() => mergeR21_2Suites(input), /categoria incompatible/);
  }
  const input = baseManifest(); input.files.push({ ...R21_2_SUITES[0], kind: 'node' });
  assert.throws(() => mergeR21_2Suites(input), /categoria incompatible/);
  assert.throws(() => mergeR21_2Suites({ ...baseManifest(), files: [...baseManifest().files, baseManifest().files[0]] }), /duplicada/);
  assert.throws(() => mergeR21_2Suites({ ...baseManifest(), requiredPrimary: ['tests/legacy.test.mjs'] }), /cobertura primària incompatible/);
  assert.throws(() => mergeR21_2Suites({ ...baseManifest(), schema: 'wrong' }), /manifest invàlid/);
});

test('default and explicit check are read-only and signal pending registration; apply is atomic and idempotent', t => {
  const { root, target } = fixture(t);
  const before = fs.readFileSync(target);
  const beforeStat = fs.statSync(target);
  for (const args of [['--root', root], ['--root', root, '--check']]) {
    assert.equal(main(args, () => {}), 1);
    assert.deepEqual(fs.readFileSync(target), before);
    assert.equal(fs.statSync(target).ino, beforeStat.ino);
    assert.deepEqual(leftovers(root), []);
  }
  assert.equal(main(['--root', root, '--apply'], () => {}), 0);
  assert.equal(fs.statSync(target).mode & 0o777, beforeStat.mode & 0o777);
  const applied = fs.readFileSync(target);
  const stat = fs.statSync(target);
  assert.equal(main(['--root', root, '--apply'], () => {}), 0);
  assert.equal(main(['--root', root, '--check'], () => {}), 0);
  assert.deepEqual(fs.readFileSync(target), applied);
  assert.equal(fs.statSync(target).ino, stat.ino);
  assert.deepEqual(leftovers(root), []);
  const catalog = validateManifest(root, JSON.parse(applied));
  assert.ok(R21_2_SUITES.every(e => catalog.suites.primary.includes(e.path)));
});

test('an absent suite or a directory instead of a suite blocks registration', t => {
  for (const variant of ['missing', 'directory']) {
    const { root, target } = fixture(t);
    const p = path.join(root, R21_2_SUITES[0].path);
    fs.unlinkSync(p); if (variant === 'directory') fs.mkdirSync(p);
    const before = fs.readFileSync(target);
    assert.throws(() => applyRegistration(root), variant === 'missing' ? /ruta absent/ : /ruta no regular/);
    assert.deepEqual(fs.readFileSync(target), before);
  }
});

test('suite, parent-directory and manifest symlinks are all rejected without writing through them', t => {
  for (const variant of ['file', 'parent', 'manifest']) {
    const { root, target } = fixture(t);
    const backup = path.join(root, 'outside');
    if (variant === 'file') {
      const p = path.join(root, R21_2_SUITES[0].path); fs.renameSync(p, backup); fs.symlinkSync(backup, p);
    } else if (variant === 'parent') {
      fs.renameSync(path.join(root, 'tests'), backup); fs.symlinkSync(backup, path.join(root, 'tests'));
    } else { fs.renameSync(target, backup); fs.symlinkSync(backup, target); }
    const before = fs.readFileSync(target);
    assert.throws(() => applyRegistration(root), /symlink rebutjat/);
    assert.deepEqual(fs.readFileSync(target), before);
  }
});

test('concurrent manifest drift is preserved and the temporary file and lock are removed', t => {
  const { root, target } = fixture(t);
  const drift = JSON.stringify({ ...baseManifest(), concurrent: true });
  const originalFsync = fs.fsyncSync;
  t.mock.method(fs, 'fsyncSync', fd => { originalFsync(fd); fs.writeFileSync(target, drift); });
  assert.throws(() => applyRegistration(root), /manifest ha canviat/);
  assert.equal(fs.readFileSync(target, 'utf8'), drift);
  assert.deepEqual(leftovers(root), []);
});

test('failed rename preserves original bytes and cleans its own files; an existing lock is never removed', t => {
  const { root, target } = fixture(t);
  const before = fs.readFileSync(target);
  t.mock.method(fs, 'renameSync', () => { throw new Error('fixture failure'); });
  assert.throws(() => applyRegistration(root), /aplicació atòmica fallida/);
  assert.deepEqual(fs.readFileSync(target), before);
  assert.deepEqual(leftovers(root), []);
  fs.writeFileSync(`${target}.r21-2.lock`, 'other owner');
  assert.throws(() => applyRegistration(root), /registre ocupat/);
  assert.equal(fs.readFileSync(`${target}.r21-2.lock`, 'utf8'), 'other owner');
});

test('real CLI is dry by default, handles invalid arguments and never exposes arbitrary filesystem errors', t => {
  const { root, target } = fixture(t);
  const before = fs.readFileSync(target);
  const run = args => spawnSync(process.execPath, [helper, '--root', root, ...args], { encoding: 'utf8' });
  const checked = run([]);
  assert.equal(checked.status, 1, checked.stderr);
  assert.equal(JSON.parse(checked.stdout).mode, 'check');
  assert.deepEqual(fs.readFileSync(target), before);
  for (const args of [['--check', '--apply'], ['--unknown'], ['--root']]) assert.equal(run(args).status, 2);
  assert.equal(run(['--apply']).status, 0);
  assert.equal(run(['--check']).status, 0);
  assert.equal(inspectRegistration(root).changed, false);
});
