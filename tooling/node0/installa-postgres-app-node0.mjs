#!/usr/bin/env node
/** PostgreSQL 17 d'usuari per al Node 0, sense sudo ni aplicació gràfica.
 * Font oficial: https://postgresapp.com/downloads.html, release v2.9.6,
 * asset GitHub 512422908; digest publicat a l'API de la release oficial.
 * Per defecte només mostra el pla. --apply és exclusiu del Mac mini Node0.
 * No executa migracions ni toca el daemon, Caddy o els túnels existents.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
export const ASSET = Object.freeze({
  appVersion: '2.9.6', postgresVersion: '17.11', id: 512422908, size: 119621638,
  publisherTeamIdentifier: 'ZF84SJ5A3G',
  sha256: 'b38bb00b8c8702a568270aab85995c550f7f93d1503b818efdc5ff9a519b7168',
  url: 'https://github.com/PostgresApp/PostgresApp/releases/download/v2.9.6/Postgres-2.9.6-17.dmg',
  metadata: 'https://api.github.com/repos/PostgresApp/PostgresApp/releases/tags/v2.9.6'
});
const fail = (code) => { throw new Error(code); };
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const xml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function plaPostgresNodeZero(home = os.homedir()) {
  if (!path.isAbsolute(home) || /[\x00-\x1f'\\]/.test(home)) fail('node0_pg_home_invalid');
  const root = path.join(home, 'local/postgres17');
  const app = path.join(root, 'Postgres.app');
  return { home, root, app, bin: path.join(app, 'Contents/Versions/17/bin'),
    data: path.join(home, 'socdepoble-node0/dades/postgres17'),
    socket: path.join(home, 'socdepoble-node0/dades/run/postgres17'),
    plist: path.join(home, 'Library/LaunchAgents/org.socdepoble.postgres17.plist'),
    label: 'org.socdepoble.postgres17', port: 5432, listen: '127.0.0.1' };
}
function command(bin, args, { env = process.env, allowFailure = false, timeout = 300000 } = {}) {
  const result = spawnSync(bin, args, { env, timeout, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (!allowFailure && (result.status !== 0 || result.error)) fail(`node0_pg_command_failed:${path.basename(bin)}`);
  return result;
}
function directory(home, destination, mode = 0o700) {
  if (destination !== home && !destination.startsWith(`${home}/`)) fail('node0_pg_path_escape');
  const relative = path.relative(home, destination);
  let current = home;
  for (const part of relative.split('/').filter(Boolean)) {
    current = path.join(current, part);
    try { fs.lstatSync(current); } catch (e) { if (e.code !== 'ENOENT') throw e; fs.mkdirSync(current, { mode }); }
    const stat = fs.lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid()) fail('node0_pg_directory_unsafe');
  }
}
function regular(file, max = 1024 * 1024) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.uid !== process.getuid() || stat.size > max) fail('node0_pg_file_unsafe');
  return stat;
}
function writeOwn(file, text) {
  if (fs.existsSync(file)) {
    const stat = regular(file);
    if (stat.mode & 0o077 || fs.readFileSync(file, 'utf8') !== text) fail('node0_pg_managed_file_drift');
  } else fs.writeFileSync(file, text, { flag: 'wx', mode: 0o600 });
}
export function configuracioPostgresNodeZero(plan, operator) {
  if (typeof operator !== 'string' || !/^[a-z_][a-z0-9_-]{0,62}$/.test(operator)) fail('node0_pg_operator_invalid');
  return {
    hba: `# Sóc de Poble Node0; local peer only. TCP rejects every role.\nlocal all ${operator} peer\nlocal socdepoble_node0 node0_runtime peer map=sdp_node0_runtime\nlocal all all reject\nhost all all 127.0.0.1/32 reject\nhost all all ::1/128 reject\n`,
    ident: `# MAP OS-USER DB-USER\nsdp_node0_runtime ${operator} node0_runtime\n`,
    config: `# Sóc de Poble Node0; dedicated user-local cluster.\ninclude = 'postgresql.conf'\nlisten_addresses = '127.0.0.1'\nport = 5432\nunix_socket_directories = '${plan.socket}'\nunix_socket_permissions = 0700\nhba_file = '${path.join(plan.data, 'pg_hba.node0.conf')}'\nident_file = '${path.join(plan.data, 'pg_ident.node0.conf')}'\npassword_encryption = 'scram-sha-256'\nmax_connections = 50\nshared_buffers = '128MB'\nlogging_collector = off\n`
  };
}
export function plistPostgresNodeZero(plan) {
  const args = [path.join(plan.bin, 'postgres'), '-D', plan.data, '-c', `config_file=${path.join(plan.data, 'postgresql.node0.conf')}`];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>Label</key><string>${plan.label}</string><key>ProgramArguments</key><array>${args.map((a) => `<string>${xml(a)}</string>`).join('')}</array><key>WorkingDirectory</key><string>${xml(plan.data)}</string><key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>30</integer><key>StandardOutPath</key><string>${xml(path.join(plan.root, 'postgres17.stdout.log'))}</string><key>StandardErrorPath</key><string>${xml(path.join(plan.root, 'postgres17.stderr.log'))}</string></dict></plist>\n`;
}
export async function main(args = process.argv.slice(2)) {
  if (args.some((arg) => arg !== '--apply')) fail('node0_pg_invalid_argument');
  const plan = plaPostgresNodeZero();
  if (!args.includes('--apply')) { process.stdout.write(JSON.stringify({ apply: false, asset: ASSET, plan }) + '\n'); return; }
  if (process.platform !== 'darwin' || !Object.values(os.networkInterfaces()).flat().some((i) => i?.address === '192.168.0.23')) fail('node0_pg_wrong_machine');
  const operator = os.userInfo().username;
  const config = configuracioPostgresNodeZero(plan, operator);
  for (const dir of [plan.root, path.dirname(plan.data), plan.socket, path.dirname(plan.plist)]) directory(plan.home, dir);
  if ((fs.lstatSync(plan.root).mode & 0o077) || (fs.lstatSync(plan.socket).mode & 0o077)) fail('node0_pg_private_directory_required');
  const receiptPath = path.join(plan.root, 'installation.json');
  let ownedCluster = false;
  if (fs.existsSync(receiptPath)) {
    if (regular(receiptPath).mode & 0o077) fail('node0_pg_receipt_permissions');
    const saved = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    ownedCluster = saved.schema === 'sdp.node0.postgresql17.install.v1' && saved.assetSha256 === ASSET.sha256 && saved.plan?.data === plan.data && saved.teamIdentifier === ASSET.publisherTeamIdentifier;
    if (!ownedCluster) fail('node0_pg_receipt_mismatch');
  }
  if (fs.existsSync(plan.app) && !ownedCluster) fail('node0_pg_existing_app_unclaimed');
  if (fs.existsSync(plan.data) && !ownedCluster) fail('node0_pg_existing_cluster_unclaimed');
  const listener = command('/usr/sbin/lsof', ['-nP', '-iTCP:5432', '-sTCP:LISTEN'], { allowFailure: true });
  if (listener.status === 0 && !ownedCluster) fail('node0_pg_port_busy');
  const dmg = path.join(plan.root, 'Postgres-2.9.6-17.dmg');
  if (!fs.existsSync(dmg)) {
    const download = `${dmg}.${randomBytes(8).toString('hex')}.download`;
    fs.writeFileSync(download, '', { flag: 'wx', mode: 0o600 });
    command('/usr/bin/curl', ['--fail', '--location', '--proto', '=https', '--proto-redir', '=https', '--tlsv1.2', '--connect-timeout', '10', '--max-time', '300', '--silent', '--show-error', '--output', download, ASSET.url]);
    const stat = regular(download, ASSET.size);
    if (stat.size !== ASSET.size || hash(fs.readFileSync(download)) !== ASSET.sha256) fail('node0_pg_official_digest_mismatch');
    fs.renameSync(download, dmg);
  }
  if (regular(dmg, ASSET.size).size !== ASSET.size || hash(fs.readFileSync(dmg)) !== ASSET.sha256) fail('node0_pg_official_digest_mismatch');
  if (!fs.existsSync(plan.app)) {
    const mount = path.join(plan.root, `mount-${randomBytes(8).toString('hex')}`); directory(plan.home, mount);
    command('/usr/bin/hdiutil', ['attach', dmg, '-readonly', '-nobrowse', '-noautoopen', '-mountpoint', mount, '-plist']);
    try {
      const source = path.join(mount, 'Postgres.app');
      command('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', source]);
      command('/usr/sbin/spctl', ['--assess', '--type', 'execute', '--verbose=4', source]);
      command('/usr/bin/ditto', [source, plan.app]);
    } finally { command('/usr/bin/hdiutil', ['detach', mount]); fs.rmdirSync(mount); }
  }
  command('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', plan.app]);
  command('/usr/sbin/spctl', ['--assess', '--type', 'execute', '--verbose=4', plan.app]);
  const signing = command('/usr/bin/codesign', ['-d', '--verbose=4', plan.app]);
  const signature = `${signing.stdout}\n${signing.stderr}`;
  const teamIdentifier = /^TeamIdentifier=([A-Z0-9]{10})$/m.exec(signature)?.[1];
  if (teamIdentifier !== ASSET.publisherTeamIdentifier || !signature.includes('Authority=Developer ID Application:')) fail('node0_pg_developer_signature_missing');
  const postgres = path.join(plan.bin, 'postgres');
  const version = command(postgres, ['--version']).stdout.trim();
  if (!/^postgres \(PostgreSQL\) 17\.11(?:\s|$)/.test(version)) fail('node0_pg_version_mismatch');
  if (!ownedCluster) command(path.join(plan.bin, 'initdb'), ['-D', plan.data, `--username=${operator}`, '--auth-local=peer', '--auth-host=scram-sha-256', '--encoding=UTF8', '--locale=C', '--data-checksums']);
  if (fs.readFileSync(path.join(plan.data, 'PG_VERSION'), 'utf8').trim() !== '17' || (fs.lstatSync(plan.data).mode & 0o077)) fail('node0_pg_cluster_permissions');
  writeOwn(path.join(plan.data, 'pg_hba.node0.conf'), config.hba);
  writeOwn(path.join(plan.data, 'pg_ident.node0.conf'), config.ident);
  writeOwn(path.join(plan.data, 'postgresql.node0.conf'), config.config);
  for (const name of ['postgres17.stdout.log', 'postgres17.stderr.log']) {
    const file = path.join(plan.root, name);
    if (!fs.existsSync(file)) fs.writeFileSync(file, '', { flag: 'wx', mode: 0o600 });
    if (regular(file, 64 * 1024 * 1024).mode & 0o077) fail('node0_pg_log_permissions');
  }
  writeOwn(plan.plist, plistPostgresNodeZero(plan)); command('/usr/bin/plutil', ['-lint', plan.plist]);
  const label = `gui/${process.getuid()}/${plan.label}`;
  if (command('/bin/launchctl', ['print', label], { allowFailure: true }).status !== 0) command('/bin/launchctl', ['bootstrap', `gui/${process.getuid()}`, plan.plist]);
  command('/bin/launchctl', ['kickstart', label]);
  const env = { ...process.env, PGHOST: plan.socket, PGPORT: '5432', PGUSER: operator, PGDATABASE: 'postgres', PGCONNECT_TIMEOUT: '2' };
  for (const key of ['PGPASSWORD', 'PGPASSFILE', 'PGHOSTADDR', 'PGSERVICE', 'PGSERVICEFILE', 'PGOPTIONS']) delete env[key];
  let health = null;
  for (let i = 0; i < 30; i++) {
    const result = command(path.join(plan.bin, 'psql'), ['-X', '-w', '-At', '-v', 'ON_ERROR_STOP=1', '-c', "SELECT json_build_object('version',version(),'dataDirectory',current_setting('data_directory'),'listen',current_setting('listen_addresses'),'port',current_setting('port'),'socket',current_setting('unix_socket_directories'),'user',current_user,'checksums',current_setting('data_checksums'));"], { env, allowFailure: true, timeout: 5000 });
    if (result.status === 0) { health = JSON.parse(result.stdout.trim()); break; }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!health || health.dataDirectory !== plan.data || health.listen !== '127.0.0.1' || health.user !== operator || health.checksums !== 'on') fail('node0_pg_healthcheck_failed');
  const receipt = { schema: 'sdp.node0.postgresql17.install.v1', installedAt: new Date().toISOString(), assetSha256: ASSET.sha256, assetUrl: ASSET.url, assetId: ASSET.id,
    version, teamIdentifier, signatureVerified: true, notarizationAssessed: true, operator, plan, health,
    persistence: 'LaunchAgent RunAtLoad + KeepAlive in user GUI session; no claim of system boot before login', migrationsApplied: false, daemonChanged: false };
  if (!fs.existsSync(receiptPath)) fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  process.stdout.write(JSON.stringify(receipt) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((e) => { process.stderr.write(`${e.message}\n`); process.exitCode = 1; });
