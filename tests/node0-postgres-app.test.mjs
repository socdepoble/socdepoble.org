import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { ASSET, plaPostgresNodeZero, configuracioPostgresNodeZero, plistPostgresNodeZero, main } from '../tooling/node0/installa-postgres-app-node0.mjs';

test('instal·lació PostgreSQL rebutja apply fora del Node0 abans d’efectes', async () => {
  const old = os.networkInterfaces;
  os.networkInterfaces = () => ({ loopback: [{ address: '127.0.0.1' }] });
  try { await assert.rejects(main(['--apply']), /node0_pg_wrong_machine/); }
  finally { os.networkInterfaces = old; }
  await assert.rejects(main(['--sudo']), /node0_pg_invalid_argument/);
});
test('clúster sobirà usa peer per operador, map explícit runtime i nega TCP', () => {
  const plan = plaPostgresNodeZero('/Users/javi');
  const config = configuracioPostgresNodeZero(plan, 'javi');
  assert.match(config.hba, /^local all javi peer$/m);
  assert.match(config.hba, /^local socdepoble_node0 node0_runtime peer map=sdp_node0_runtime$/m);
  assert.match(config.hba, /^local all all reject$/m);
  assert.match(config.hba, /^host all all 127\.0\.0\.1\/32 reject$/m);
  assert.match(config.ident, /^sdp_node0_runtime javi node0_runtime$/m);
  assert.equal(/\btrust\b/.test(config.hba), false);
  assert.match(config.config, /listen_addresses = '127\.0\.0\.1'/);
  assert.match(config.config, /unix_socket_permissions = 0700/);
  assert.throws(() => configuracioPostgresNodeZero(plan, 'javi\nall all trust'), /node0_pg_operator_invalid/);
});
test('LaunchAgent exclusiu d’usuari amb arguments separats, sense shell ni sudo', () => {
  const plan = plaPostgresNodeZero('/Users/javi'); const plist = plistPostgresNodeZero(plan);
  assert.match(plist, /org\.socdepoble\.postgres17/);
  assert.match(plist, /<key>RunAtLoad<\/key><true\/>/);
  assert.match(plist, /<key>KeepAlive<\/key><true\/>/);
  assert.match(plist, /Postgres\.app\/Contents\/Versions\/17\/bin\/postgres/);
  assert.equal(/sudo|\/bin\/(?:sh|zsh|bash)/.test(plist), false);
  assert.match(plan.data, /socdepoble-node0\/dades\/postgres17$/);
  assert.throws(() => plaPostgresNodeZero('/Users/javi\nInjected'), /node0_pg_home_invalid/);
});
test('asset oficial queda pinat per versió exacta i digest complet', () => {
  assert.equal(ASSET.postgresVersion, '17.11'); assert.equal(ASSET.id, 512422908);
  assert.equal(ASSET.size, 119621638);
  assert.equal(ASSET.sha256, 'b38bb00b8c8702a568270aab85995c550f7f93d1503b818efdc5ff9a519b7168');
  assert.equal(ASSET.url, 'https://github.com/PostgresApp/PostgresApp/releases/download/v2.9.6/Postgres-2.9.6-17.dmg');
  assert.equal(ASSET.publisherTeamIdentifier, 'ZF84SJ5A3G');
});
test('F12 app existent sense rebut propi és refusada abans de descarregar o executar', { skip: process.platform !== 'darwin' }, async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'node0-pg-existing-app-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'local/postgres17/Postgres.app'), { recursive: true, mode: 0o700 });
  const oldHome = os.homedir; const oldInterfaces = os.networkInterfaces;
  os.homedir = () => root; os.networkInterfaces = () => ({ en0: [{ address: '192.168.0.23' }] });
  try { await assert.rejects(main(['--apply']), /node0_pg_existing_app_unclaimed/); }
  finally { os.homedir = oldHome; os.networkInterfaces = oldInterfaces; }
});
