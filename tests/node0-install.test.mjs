import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { configuraCaddy, main } from '../tooling/node0/installa-node0.mjs';
import { carregaClaus } from '../tooling/node0/servidor-node0-soberania.mjs';

const sha = (v) => createHash('sha256').update(v).digest('hex');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'node0-install-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const original = path.join(dir, 'Caddyfile'); const candidate = path.join(dir, 'Candidate');
  const old = 'socdepoble.cat {\n  root * /srv/web\n  file_server\n}\n';
  const proposed = 'socdepoble.cat {\n handle /api/v1/* { reverse_proxy 127.0.0.1:4340 }\n root * /srv/web\n file_server\n}\n';
  fs.writeFileSync(original, old, { mode: 0o640 }); fs.writeFileSync(candidate, proposed, { mode: 0o640 });
  return { dir, original, candidate, old, proposed, expectedSha: sha(old) };
}
test('installer per defecte és dry-run; no exigix Node0 ni toca serveis', () => {
  const result = JSON.parse(execFileSync(process.execPath, ['tooling/node0/installa-node0.mjs'], { cwd: path.resolve(import.meta.dirname, '..'), encoding: 'utf8' }));
  assert.equal(result.applied, false); assert.equal(result.daemon, '127.0.0.1:4340'); assert.equal(result.postgresql, 17);
});
test('apply falla en màquina errònia abans de qualsevol efecte de servei', async () => {
  const before = os.networkInterfaces;
  os.networkInterfaces = () => ({ lo: [{ address: '127.0.0.1' }] });
  try { await assert.rejects(main(['--apply']), /node0_wrong_machine/); }
  finally { os.networkInterfaces = before; }
});
test('installer rebutja flags desconegudes i candidats parcials', async () => {
  await assert.rejects(main(['--unknown']), /node0_install_invalid_argument/);
  await assert.rejects(main(['--candidate=/tmp/example']), /node0_caddy_concrete_candidate_required/);
});
test('Caddy exigix preimatge i ruta de candidat abans de runner', (t) => {
  const f = fixture(t); let calls = 0;
  assert.throws(() => configuraCaddy({ ...f, expectedSha: '0'.repeat(64), runner: () => { calls++; } }), /node0_caddy_preimage_drift/);
  fs.writeFileSync(f.candidate, 'sense ruta');
  assert.throws(() => configuraCaddy({ ...f, runner: () => { calls++; } }), /node0_caddy_route_missing/);
  assert.equal(calls, 0); assert.equal(fs.readFileSync(f.original, 'utf8'), f.old);
});
test('Caddy validació rebutjada no toca original', (t) => {
  const f = fixture(t);
  assert.throws(() => configuraCaddy({ ...f, runner: () => { throw new Error('invalid_caddy'); } }), /invalid_caddy/);
  assert.equal(fs.readFileSync(f.original, 'utf8'), f.old);
});
test('Caddy valida candidat, fa canvi atomic i recarrega; backup íntegre', (t) => {
  const f = fixture(t); const calls = [];
  const r = configuraCaddy({ ...f, runner: (command, args) => { calls.push({ command, args }); } });
  assert.equal(fs.readFileSync(f.original, 'utf8'), f.proposed); assert.equal(fs.readFileSync(r.backup, 'utf8'), f.old);
  assert.equal(r.candidateSha256, sha(f.proposed)); assert.equal(r.originalSha256, sha(f.old));
  assert.deepEqual(calls.map((c) => c.args[0]), ['validate', 'reload']);
  assert.equal(fs.statSync(f.original).mode & 0o777, 0o640);
});
test('Caddy detecta canvi humà durant validate i no el trepitja', (t) => {
  const f = fixture(t); const human = `${f.old}# canvi huma\n`;
  assert.throws(() => configuraCaddy({ ...f, runner: (_, args) => { if (args[0] === 'validate') fs.writeFileSync(f.original, human); } }), /node0_caddy_preimage_drift/);
  assert.equal(fs.readFileSync(f.original, 'utf8'), human);
});
test('Caddy reload fallit restaura exactament la preimatge si no hi ha drift', (t) => {
  const f = fixture(t); let reloads = 0;
  assert.throws(() => configuraCaddy({ ...f, runner: (_, args) => { if (args[0] === 'reload' && ++reloads === 1) throw new Error('reload_fail'); } }), /reload_fail/);
  assert.equal(fs.readFileSync(f.original, 'utf8'), f.old); assert.equal(reloads, 2);
});
test('F7 Caddy rollback no sobreescriu un canvi humà posterior al candidat', (t) => {
  const f = fixture(t); const human = `${f.proposed}# concurrent huma\n`; let reloads = 0;
  assert.throws(() => configuraCaddy({ ...f, runner: (_, args) => {
    if (args[0] === 'reload' && ++reloads === 1) { fs.writeFileSync(f.original, human); throw new Error('reload_fail'); }
  } }), /node0_caddy_recovery_required/);
  assert.equal(fs.readFileSync(f.original, 'utf8'), human); assert.equal(reloads, 1);
});
test('F8 Caddy rebutja fitxers symlink i hardlink abans del runner', (t) => {
  const f = fixture(t); const symlink = path.join(f.dir, 'Symlink'); const hardlink = path.join(f.dir, 'Hardlink');
  fs.symlinkSync(f.original, symlink); fs.linkSync(f.original, hardlink);
  for (const original of [symlink, hardlink]) assert.throws(() => configuraCaddy({ ...f, original, runner: () => assert.fail('no runner') }), /node0_caddy_file_invalid/);
});
test('F8 claus privades amb mode públic o symlink rebutjades', async (t) => {
  const f = fixture(t); const key = path.join(f.dir, 'keys', 'node0-key.json');
  await carregaClaus(key); fs.chmodSync(key, 0o644);
  await assert.rejects(carregaClaus(key), /node0_key_permissions/); fs.chmodSync(key, 0o600);
  const sym = path.join(f.dir, 'keys', 'symlink.json'); fs.symlinkSync(key, sym);
  await assert.rejects(carregaClaus(sym), /node0_key_permissions/);
});
test('F8 clau privada hardlinked és rebutjada', async (t) => {
  const f = fixture(t); const key = path.join(f.dir, 'keys', 'node0-key.json');
  await carregaClaus(key); const hardlink = path.join(f.dir, 'keys', 'hardlink.json'); fs.linkSync(key, hardlink);
  await assert.rejects(carregaClaus(hardlink), /node0_key_permissions/);
});
test('arrencada rebutja env públic o symlink abans de llegir configuració', (t) => {
  const f = fixture(t); const env = path.join(f.dir, 'node0.env'); const sym = path.join(f.dir, 'env-link');
  fs.writeFileSync(env, 'FAKE_TEST_VALUE=not-a-secret\n', { mode: 0o644 }); fs.symlinkSync(env, sym);
  for (const file of [env, sym]) assert.throws(() => execFileSync(process.execPath, ['tooling/node0/arranca-node0.mjs', file], { cwd: path.resolve(import.meta.dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), (e) => e.status === 1 && e.stderr.includes('node0_secure_start_failed'));
});
