import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SOURCE = process.env.SDP_RESTORATION_CANDIDATE || fileURLToPath(new URL('../tooling/brain/desenterrar.mjs', import.meta.url));
const OLD = Buffer.from([0, 255, 128, 10, 65]);
const CURRENT = Buffer.from([1, 254, 129, 13, 10, 66]);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-restoration-contract-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const env = { ...process.env };
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR']) delete env[key];
  function git(...args) {
    const result = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', ...args], { cwd: root, env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }
  git('init', '-q');
  git('config', 'user.name', 'Fixture');
  git('config', 'user.email', 'fixture@example.invalid');
  const target = path.join(root, 'sample.bin');
  fs.writeFileSync(target, OLD, { mode: 0o755 });
  git('add', 'sample.bin');
  git('commit', '-qm', 'old bytes');
  const old = git('rev-parse', 'HEAD');
  fs.writeFileSync(target, CURRENT);
  fs.chmodSync(target, 0o644);
  git('add', 'sample.bin');
  git('commit', '-qm', 'current bytes');
  const head = git('rev-parse', 'HEAD');
  const cli = path.join(root, 'tooling/brain/desenterrar.mjs');
  fs.mkdirSync(path.dirname(cli), { recursive: true });
  fs.mkdirSync(path.join(root, 'tooling/wiki'), { recursive: true });
  fs.writeFileSync(cli, fs.readFileSync(SOURCE));
  // The real CLI keeps its production authorizer. Only this disposable copy
  // imports a fixture authorizer, to test mutation ordering in a temp Git repo.
  fs.writeFileSync(path.join(root, 'tooling/wiki/reflex_petorreta.mjs'), `
import fs from 'node:fs';
export async function claimReceiptForMutation({receiptPath}) {
  if (!receiptPath) throw new Error('fixture receipt absent');
  fs.writeFileSync('claim-marker', 'claimed');
  if (process.env.SDP_FIXTURE_CAS === 'bytes') fs.writeFileSync('sample.bin', 'concurrent bytes');
  if (process.env.SDP_FIXTURE_CAS === 'mode') fs.chmodSync('sample.bin', 0o755);
  return {claimToken: 'fixture-token', receipt: {sessionId: 'fixture-session'}};
}
export async function completeMutationClaim() { fs.writeFileSync('complete-marker', 'complete'); }
`);
  function run(args, extra = {}) {
    return spawnSync(process.execPath, [cli, ...args], { cwd: root, env: { ...env, ...extra }, encoding: 'utf8', timeout: 10000 });
  }
  function inspect(ref = old) {
    const result = run(['--ref', ref, '--fitxer', 'sample.bin']);
    assert.equal(result.status, 0, result.stderr);
    const seal = /Segell per aplicar\s+: ([a-f0-9]{64})/.exec(result.stdout)?.[1];
    assert.ok(seal, result.stdout);
    return { result, seal };
  }
  const apply = (seal, extra = {}, ref = old) => run(['--ref', ref, '--fitxer', 'sample.bin', '--segell', seal, '--rebut', 'fixture-receipt.json'], extra);
  return { root, git, target, old, head, run, inspect, apply };
}

test('inspection resolves a commit and binds exact bytes, modes and HEAD without writing', t => {
  const f = fixture(t), before = f.git('status', '--porcelain'), { result, seal } = f.inspect();
  const expected = hash(['sdp.desenterrar.segell.v3', f.old, f.head, 'sample.bin', '100755', hash(OLD), hash(CURRENT), '644'].join('\0'));
  assert.equal(seal, expected);
  assert.match(result.stdout, new RegExp(`Commit resolt\\s+: ${f.old}`));
  assert.equal(f.git('status', '--porcelain'), before);
  assert.equal(fs.existsSync(path.join(f.root, '.sdp-paperera')), false);
  assert.deepEqual(fs.readFileSync(f.target), CURRENT);
});

test('restoration preserves binary bytes and revision mode with a readable verified backup manifest', t => {
  const f = fixture(t), { seal } = f.inspect(), result = f.apply(seal);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(fs.readFileSync(f.target), OLD);
  assert.equal(fs.statSync(f.target).mode & 0o777, 0o755);
  const backup = /Còpia verificada del contingut anterior: (.+)/.exec(result.stdout)?.[1];
  assert.ok(backup, result.stdout);
  assert.deepEqual(fs.readFileSync(path.join(f.root, backup)), CURRENT);
  assert.equal(fs.statSync(path.join(f.root, backup)).mode & 0o777, 0o644);
  const manifest = JSON.parse(fs.readFileSync(path.join(f.root, `${backup}.restauracio.json`), 'utf8'));
  assert.equal(manifest.beforeSha256, hash(CURRENT));
  assert.equal(manifest.beforeMode, '644');
  assert.equal(manifest.head, f.head);
  assert.equal(manifest.revisio, f.old);
  assert.equal(manifest.ruta, 'sample.bin');
  assert.equal(f.git('rev-parse', 'HEAD'), f.head);
  assert.equal(fs.existsSync(path.join(f.root, 'complete-marker')), true);
});

for (const change of ['bytes', 'mode', 'HEAD']) test(`inspection seal rejects stale ${change} before claiming or backing up`, t => {
  const f = fixture(t), { seal } = f.inspect();
  if (change === 'bytes') fs.writeFileSync(f.target, 'new local bytes');
  if (change === 'mode') fs.chmodSync(f.target, 0o755);
  if (change === 'HEAD') f.git('commit', '--allow-empty', '-qm', 'new HEAD');
  const bytes = fs.readFileSync(f.target), result = f.apply(seal);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Segell invàlid/);
  assert.deepEqual(fs.readFileSync(f.target), bytes);
  assert.equal(fs.existsSync(path.join(f.root, 'claim-marker')), false);
  assert.equal(fs.existsSync(path.join(f.root, '.sdp-paperera')), false);
});

for (const change of ['bytes', 'mode']) test(`concurrent ${change} after the claim stops before backup or replacement`, t => {
  const f = fixture(t), { seal } = f.inspect(), result = f.apply(seal, { SDP_FIXTURE_CAS: change });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CAS divergent/);
  assert.equal(fs.existsSync(path.join(f.root, '.sdp-paperera')), false);
  assert.equal(fs.existsSync(path.join(f.root, 'complete-marker')), false);
  if (change === 'bytes') assert.equal(fs.readFileSync(f.target, 'utf8'), 'concurrent bytes');
  else assert.deepEqual(fs.readFileSync(f.target), CURRENT);
});

test('missing receipt refuses before a backup or target replacement', t => {
  const f = fixture(t), { seal } = f.inspect(), result = f.run(['--ref', f.old, '--fitxer', 'sample.bin', '--segell', seal]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Sense lease/);
  assert.deepEqual(fs.readFileSync(f.target), CURRENT);
  assert.equal(fs.existsSync(path.join(f.root, '.sdp-paperera')), false);
});

test('local changes need explicit forca and still receive the verified backup', t => {
  const f = fixture(t);
  fs.writeFileSync(f.target, 'local work');
  const { seal } = f.inspect(), rejected = f.apply(seal);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /canvis no compromesos/);
  const accepted = f.run(['--ref', f.old, '--fitxer', 'sample.bin', '--segell', seal, '--rebut', 'fixture-receipt.json', '--forca']);
  assert.equal(accepted.status, 0, accepted.stderr);
  const backup = /Còpia verificada del contingut anterior: (.+)/.exec(accepted.stdout)?.[1];
  assert.equal(fs.readFileSync(path.join(f.root, backup), 'utf8'), 'local work');
  assert.deepEqual(fs.readFileSync(f.target), OLD);
});
