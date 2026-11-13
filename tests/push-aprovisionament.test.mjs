import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { generateVapid, parseEnv, preflight, stage, deploymentPlan, tick, MIGRACIONS } from '../tooling/push/aprovisiona-push.mjs';
import { clauVapid } from '../supabase/functions/notifica-xat/webpush.js';

const root = path.resolve(import.meta.dirname, '..');
const sentinel = 'NEVER_PRINT_PRIVATE_SENTINEL';
function lab(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-push-provision-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const dir = path.join(base, 'keys');
  generateVapid(dir, 'mailto:push@example.org');
  const inputs = path.join(base, 'inputs.env');
  fs.writeFileSync(inputs, 'SDP_CRON_SECRET=' + 'c'.repeat(48) + '\n', { mode: 0o600 });
  return { base, dir, inputs, root };
}
function nativeFixture(t) {
  const f = lab(t), tree = path.join(f.base, 'repo');
  fs.mkdirSync(path.join(tree, 'supabase/migrations'), { recursive: true });
  fs.mkdirSync(path.join(tree, 'android/app'), { recursive: true });
  for (const n of MIGRACIONS) fs.copyFileSync(path.join(root, 'supabase/migrations', n), path.join(tree, 'supabase/migrations', n));
  const apns = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ format: 'pem', type: 'pkcs8' });
  const rsa = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ format: 'pem', type: 'pkcs8' });
  const account = { type: 'service_account', project_id: 'sdp-fixture', client_email: 'push@sdp-fixture.iam.gserviceaccount.com', private_key: rsa, token_uri: 'https://oauth2.googleapis.com/token' };
  const apple = path.join(f.base, 'apple.p8'), google = path.join(f.base, 'firebase.json');
  fs.writeFileSync(apple, apns, { mode: 0o600 });
  fs.writeFileSync(google, JSON.stringify(account), { mode: 0o600 });
  fs.writeFileSync(f.inputs, `SDP_CRON_SECRET=${'c'.repeat(48)}\nSDP_APNS_EQUIP=9KNUA4JR8P\nSDP_APNS_CLAU_ID=ABCDEFGHIJ\nSDP_APNS_TOPIC=org.socdepoble.app\nSDP_APNS_ENTORN=produccio\nSDP_APNS_CLAU_P8_FILE=apple.p8\nSDP_FCM_COMPTE_SERVEI_FILE=firebase.json\n`);
  fs.writeFileSync(path.join(tree, 'android/app/google-services.json'), JSON.stringify({ project_info: { project_id: 'sdp-fixture' }, client: [{ client_info: { mobilesdk_app_id: '1:123:android:abc', android_client_info: { package_name: 'org.socdepoble.app' } }, api_key: [{ current_key: 'PUBLIC_FIXTURE' }] }] }));
  return { ...f, root: tree, apns, account, google };
}
test('VAPID is actual P-256 accepted by production helper; reuse never rotates', async t => {
  const f = lab(t), p = path.join(f.dir, 'vapid.private.env'), bytes = fs.readFileSync(p);
  const env = parseEnv(bytes.toString());
  const key = await clauVapid({ publica: env.SDP_PUSH_VAPID_PUBLICA, privada: env.SDP_PUSH_VAPID_PRIVADA }, crypto.webcrypto.subtle);
  assert.ok(key);
  assert.equal(Buffer.from(env.SDP_PUSH_VAPID_PUBLICA, 'base64url').length, 65);
  assert.equal(generateVapid(f.dir, 'mailto:push@example.org').reused, true);
  assert.deepEqual(fs.readFileSync(p), bytes);
  assert.equal(fs.statSync(f.dir).mode & 0o777, 0o700);
  for (const n of fs.readdirSync(f.dir)) assert.equal(fs.statSync(path.join(f.dir, n)).mode & 0o777, 0o600);
});
test('VAPID inconsistent scalar/public, partial directory, subject drift fail closed', t => {
  const f = lab(t), p = path.join(f.dir, 'vapid.private.env');
  assert.throws(() => generateVapid(f.dir, 'mailto:other@example.org'), /subject_drift/);
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/SDP_PUSH_VAPID_PRIVADA=.*/, `SDP_PUSH_VAPID_PRIVADA=${Buffer.alloc(32, 2).toString('base64url')}`));
  assert.throws(() => generateVapid(f.dir, 'mailto:push@example.org'), /invalid_vapid/);
  fs.rmSync(p);
  assert.throws(() => generateVapid(f.dir, 'mailto:push@example.org'));
  assert.equal(fs.existsSync(p), false);
});
test('dotenv never executes text and rejects ambiguity/control/duplicates/oversize', () => {
  assert.equal(parseEnv('KEY=$(touch /tmp/no-execution)\r\n').KEY, '$(touch /tmp/no-execution)');
  for (const text of ['X=1\nX=2', 'bad=3', 'X=\0', 'X="unterminated', 'A'.repeat(65537)]) assert.throws(() => parseEnv(text), /invalid_env/);
});
test('symlink, hardlink and unsafe private mode are refused', t => {
  const f = lab(t), p = path.join(f.dir, 'vapid.private.env');
  fs.chmodSync(p, 0o644);
  assert.throws(() => preflight({ ...f, channels: ['web'] }), /unsafe_private_mode/);
  fs.chmodSync(p, 0o600);
  fs.linkSync(p, path.join(f.base, 'hard'));
  assert.throws(() => preflight({ ...f, channels: ['web'] }), /unsafe_file/);
  fs.unlinkSync(path.join(f.base, 'hard'));
  fs.renameSync(p, path.join(f.base, 'real'));
  fs.symlinkSync(path.join(f.base, 'real'), p);
  assert.throws(() => preflight({ ...f, channels: ['web'] }), /unsafe_symlink/);
});
test('Web preflight explicit scope is ready; all channels correctly blocked', t => {
  const f = lab(t);
  assert.equal(preflight({ ...f, channels: ['web'] }).ok, true);
  const report = preflight(f);
  assert.equal(report.ok, false);
  assert.equal(report.remoteVerified, false);
  assert.ok(report.issues.includes('apns_key'));
  assert.equal(fs.existsSync(path.join(f.dir, 'staged')), false);
  assert.equal(stage(f).ok, false);
  assert.equal(fs.existsSync(path.join(f.dir, 'staged')), false);
});
test('all channel synthetic credentials validate; JSON and PEM roundtrip staging matches actual providers', t => {
  const f = nativeFixture(t);
  assert.equal(preflight(f).ok, true);
  assert.equal(stage(f).staged, true);
  const p = path.join(f.dir, 'staged/edge.secrets.env'), bytes = fs.readFileSync(p);
  const e = parseEnv(bytes.toString());
  assert.deepEqual(JSON.parse(e.SDP_FCM_COMPTE_SERVEI), f.account);
  assert.equal(e.SDP_APNS_CLAU_P8.replace(/\\n/g, '\n'), f.apns.trim());
  assert.equal(own(e, 'SDP_PUSH_ACTIU'), false);
  assert.equal(own(e, 'SDP_APNS_CLAU_PEM'), false);
  assert.equal(stage(f).reused, true);
  assert.deepEqual(fs.readFileSync(p), bytes);
  assert.equal(fs.statSync(p).mode & 0o777, 0o600);
});
const own = (o, k) => Object.hasOwn(o, k);
test('wrong Firebase project and token authority cannot be staged', t => {
  const f = nativeFixture(t);
  f.account.project_id = 'other-project';
  f.account.token_uri = 'https://evil.example/token';
  fs.writeFileSync(f.google, JSON.stringify(f.account));
  const r = stage(f);
  assert.equal(r.ok, false);
  assert.ok(r.issues.includes('firebase_project'));
  assert.ok(r.issues.includes('fcm_token_authority'));
  assert.equal(fs.existsSync(path.join(f.dir, 'staged')), false);
});
test('parseable SEC1/RSA PKCS1 keys are rejected because the actual senders require PKCS8', t => {
  const f = nativeFixture(t);
  const ec = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey;
  fs.writeFileSync(path.join(f.base, 'apple.p8'), ec.export({ format: 'pem', type: 'sec1' }));
  const rsa = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  f.account.private_key = rsa.export({ format: 'pem', type: 'pkcs1' });
  fs.writeFileSync(f.google, JSON.stringify(f.account));
  const r = stage(f);
  assert.equal(r.ok, false);
  assert.ok(r.issues.includes('apns_pkcs8'));
  assert.ok(r.issues.includes('fcm_pkcs8'));
  assert.equal(fs.existsSync(path.join(f.dir, 'staged')), false);
});
test('public overlays contain only client keys and flags; drift never overwritten', t => {
  const f = lab(t), p = path.join(f.dir, 'web.public.env');
  const publicEnv = parseEnv(fs.readFileSync(p, 'utf8'));
  assert.deepEqual(Object.keys(publicEnv), ['VITE_PUSH_VAPID_PUBLICA', 'VITE_SDP_XAT_RITME']);
  fs.appendFileSync(p, 'VITE_INJECTION=1\n');
  assert.equal(preflight({ ...f, channels: ['web'] }).ok, false);
  assert.throws(() => generateVapid(f.dir, 'mailto:push@example.org'), /overlay_drift/);
});
test('staging uses three exact reviewed migrations, separate explicit activation, rejects replay drift', t => {
  const f = lab(t);
  assert.equal(stage({ ...f, channels: ['web'] }).ok, true);
  const p = path.join(f.dir, 'staged/schema.sql');
  assert.equal(fs.readFileSync(p, 'utf8'), MIGRACIONS.map(n => fs.readFileSync(path.join(root, 'supabase/migrations', n), 'utf8')).join('\n'));
  assert.match(fs.readFileSync(path.join(f.dir, 'staged/activa.sql'), 'utf8'), /push_schema_incomplete/);
  fs.appendFileSync(p, '-- drift');
  assert.throws(() => stage({ ...f, channels: ['web'] }), /stage_drift/);
});
test('plan performs no work, pins remote domain and leaves JWT on relay', () => {
  const plan = deploymentPlan('a'.repeat(20)).join('\n');
  assert.match(plan, /notifica-xat --no-verify-jwt/);
  assert.match(plan, /notifica-xat-desperta --remote=[a-z]{20} --yes/);
  assert.doesNotMatch(plan, /notifica-xat-desperta --no-verify-jwt/);
  for (const bad of ['https://evil.example', '$(touch /tmp/x)', 'a'.repeat(21)]) assert.throws(() => deploymentPlan(bad), /invalid_project_ref/);
});
test('cron tick real request shape uses fixed authority with redirects denied; no payload logged', async t => {
  const f = lab(t); let calls = 0;
  const result = await tick({ ...f, ref: 'a'.repeat(20), fetchImpl: async (url, init) => {
    calls++;
    assert.equal(url, `https://${'a'.repeat(20)}.supabase.co/functions/v1/notifica-xat`);
    assert.equal(init.redirect, 'error');
    assert.equal(init.headers['x-sdp-cron'], 'c'.repeat(48));
    assert.equal(init.body, undefined);
    return new Response(sentinel, { status: 200 });
  } });
  assert.equal(calls, 1);
  assert.deepEqual(result, { ok: true, status: 200, deviceDeliveryVerified: false });
});
test('CLI refuses invalid/private input without secret, path or raw exception output', t => {
  const f = lab(t);
  fs.appendFileSync(f.inputs, `SDP_CRON_SECRET=${sentinel}\n`);
  const run = spawnSync(process.execPath, ['tooling/push/aprovisiona-push.mjs', 'stage', '--root', root, '--private-dir', f.dir, '--inputs', f.inputs], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 2);
  assert.deepEqual(JSON.parse(run.stdout), { ok: false, error: 'invalid_env' });
  assert.equal(run.stderr, '');
  assert.doesNotMatch(run.stdout, new RegExp(sentinel));
  assert.equal(run.stdout.includes(f.base), false);
});
test('private directory inside a git work tree (repository or worktree) is refused before any key exists', async t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-push-repo-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const repo = path.join(base, 'repo');
  assert.equal(spawnSync('git', ['init', '-q', repo], { encoding: 'utf8' }).status, 0);
  for (const dir of [path.join(repo, 'push-privat'), path.join(repo, 'a', 'b', 'push-privat')]) {
    assert.throws(() => generateVapid(dir, 'mailto:push@example.org'), /private_directory_inside_repository/);
    assert.equal(fs.existsSync(dir), false);
  }
  // The CLI says the same with a relative path, prints no path and leaves nothing for git to see.
  const run = spawnSync(process.execPath, [path.join(root, 'tooling/push/aprovisiona-push.mjs'), 'vapid', '--private-dir', './push-privat', '--subject', 'mailto:push@example.org'], { cwd: repo, encoding: 'utf8' });
  assert.equal(run.status, 2);
  assert.deepEqual(JSON.parse(run.stdout), { ok: false, error: 'private_directory_inside_repository' });
  assert.equal(run.stdout.includes(base), false);
  assert.equal(spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: repo, encoding: 'utf8' }).stdout, '');
  // Keys moved into the tree by hand: preflight, stage and tick refuse them too, and nothing is staged.
  const f = lab(t), moved = path.join(repo, 'claus');
  fs.renameSync(f.dir, moved);
  const options = { root, dir: moved, inputs: f.inputs, channels: ['web'] };
  assert.throws(() => preflight(options), /private_directory_inside_repository/);
  assert.throws(() => stage(options), /private_directory_inside_repository/);
  await assert.rejects(tick({ ...options, ref: 'abcdefghijklmnopqrst', fetchImpl: () => assert.fail('no request') }), /private_directory_inside_repository/);
  assert.equal(fs.existsSync(path.join(moved, 'staged')), false);
  // A linked worktree (a `.git` file) counts as a work tree as well.
  const worktree = path.join(base, 'worktree');
  fs.mkdirSync(worktree);
  fs.writeFileSync(path.join(worktree, '.git'), `gitdir: ${path.join(repo, '.git')}\n`);
  assert.throws(() => generateVapid(path.join(worktree, 'push'), 'mailto:push@example.org'), /private_directory_inside_repository/);
  // Outside any work tree (a sibling of the repository) it still works.
  assert.equal(generateVapid(path.join(base, 'fora'), 'mailto:push@example.org').ok, true);
});
test('.gitignore keeps every secret file the tool writes out of git, even if copied in by hand', t => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-push-ignore-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  assert.equal(spawnSync('git', ['init', '-q', repo], { encoding: 'utf8' }).status, 0);
  fs.copyFileSync(path.join(root, '.gitignore'), path.join(repo, '.gitignore'));
  const secrets = ['push-privat/vapid.private.env', 'push-privat/staged/edge.secrets.env', 'qualsevol/lloc/edge.secrets.env'];
  const run = spawnSync('git', ['check-ignore', '--no-index', ...secrets], { cwd: repo, encoding: 'utf8' });
  assert.equal(run.status, 0);
  assert.deepEqual(run.stdout.trim().split('\n').sort(), [...secrets].sort());
});
