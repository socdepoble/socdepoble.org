#!/usr/bin/env node
/** Run ON NODE 0 after the CAS kit has been reviewed/applied to its dedicated checkout.
 * Default dry-run. Does not modify the frontend or an unknown Caddy configuration.
 * Caddy integration requires a concrete candidate and the expected original SHA.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import { createHash, randomBytes } from 'node:crypto';
import { main as hydrate } from './hidrata-postgres-node0.mjs';
import { camiSegur, fitxerRegular } from './fitxers-segurs.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const xml = (text) => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function run(command, args, env = process.env, allowFailure = false) {
  const result = spawnSync(command, args, { env, encoding: 'utf8', timeout: 600000, maxBuffer: 16 * 1024 * 1024 });
  if (!allowFailure && (result.status !== 0 || result.error)) throw new Error(`node0_install_command_failed:${path.basename(command)}:${args[0]}`);
  return result;
}
export function configuraCaddy({ original, candidate, expectedSha, caddy = '/opt/homebrew/bin/caddy', runner = run }) {
  if (!path.isAbsolute(original) || !path.isAbsolute(candidate) || !/^[0-9a-f]{64}$/.test(expectedSha)) throw new Error('node0_caddy_concrete_candidate_required');
  try { for (const file of [original,candidate]) fitxerRegular(file); } catch { throw new Error('node0_caddy_file_invalid'); }
  const old = fs.readFileSync(original), proposed = fs.readFileSync(candidate);
  if (sha(old) !== expectedSha) throw new Error('node0_caddy_preimage_drift');
  if (!proposed.includes('127.0.0.1:4340')) throw new Error('node0_caddy_route_missing');
  runner(caddy, ['validate','--config',candidate,'--adapter','caddyfile']);
  const backup = `${original}.node0-${expectedSha.slice(0,12)}.backup`;
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, old, { flag:'wx', mode: fs.statSync(original).mode & 0o777 });
  else { fitxerRegular(backup); if (sha(fs.readFileSync(backup)) !== expectedSha) throw new Error('node0_caddy_backup_drift'); }
  if (sha(fs.readFileSync(original)) !== expectedSha) throw new Error('node0_caddy_preimage_drift');
  const temp = `${original}.node0-${randomBytes(8).toString('hex')}.tmp`;
  fs.writeFileSync(temp, proposed, { flag:'wx', mode: fs.statSync(original).mode & 0o777 });
  fs.renameSync(temp, original);
  try { runner(caddy, ['reload','--config',original,'--adapter','caddyfile']); }
  catch (error) {
    try { fitxerRegular(original); } catch { throw new Error('node0_caddy_recovery_required'); }
    if (sha(fs.readFileSync(original)) !== sha(proposed)) throw new Error('node0_caddy_recovery_required');
    const recovery = `${original}.node0-${randomBytes(8).toString('hex')}.tmp`;
    fs.writeFileSync(recovery,old,{flag:'wx',mode:fs.statSync(original).mode & 0o777});
    fs.renameSync(recovery,original);
    runner(caddy, ['reload','--config',original,'--adapter','caddyfile']); throw error;
  }
  return { originalSha256: expectedSha, candidateSha256: sha(proposed), backup };
}
export async function main(args = process.argv.slice(2)) {
  const apply = args.includes('--apply');
  const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length+3);
  if (args.some((a) => a !== '--apply' && !['caddyfile','candidate','expected-sha'].some((key) => a.startsWith(`--${key}=`)))) throw new Error('node0_install_invalid_argument');
  const caddy = { original:value('caddyfile'), candidate:value('candidate'), expectedSha:value('expected-sha') };
  if (Object.values(caddy).some(Boolean) && !Object.values(caddy).every(Boolean)) throw new Error('node0_caddy_concrete_candidate_required');
  if (!apply) { process.stdout.write(JSON.stringify({ applied:false, root:ROOT, machineRequired:'192.168.0.23 macOS', database:'socdepoble_node0', postgresql:17, daemon:'127.0.0.1:4340', caddyCandidateSupplied:Boolean(caddy.original) })+'\n'); return; }
  if (process.platform !== 'darwin' || !Object.values(os.networkInterfaces()).flat().some((a) => a?.address === '192.168.0.23')) throw new Error('node0_wrong_machine');
  const brew = '/opt/homebrew/bin/brew';
  const appBin = path.join(os.homedir(),'local/postgres17/Postgres.app/Contents/Versions/17/bin');
  const appInstalled = fs.existsSync(path.join(appBin,'psql'));
  const psql = appInstalled ? path.join(appBin,'psql') : '/opt/homebrew/opt/postgresql@17/bin/psql';
  if (!appInstalled) {
    if (!fs.existsSync(psql)) run(brew,['install','postgresql@17']);
    run(brew,['services','start','postgresql@17']);
  }
  const socket = appInstalled ? path.join(os.homedir(),'socdepoble-node0/dades/run/postgres17') : '/tmp';
  const operator = os.userInfo().username;
  const env = { ...process.env, PGHOST:socket, PGPORT:'5432', PGDATABASE:'postgres', PGUSER:operator, PGCONNECT_TIMEOUT:'5' };
  for (const name of ['PGHOSTADDR','PGSERVICE','PGSERVICEFILE','PGOPTIONS']) delete env[name];
  const version = Number(run(psql,['-X','-w','-At','-v','ON_ERROR_STOP=1','-c',"SELECT current_setting('server_version_num')"],env).stdout.trim());
  if (version < 170000 || version >= 180000 || !Number.isInteger(version)) throw new Error('node0_postgresql_17_required');
  const databases = run(psql,['-X','-w','-At','-v','ON_ERROR_STOP=1','-c',"SELECT datname FROM pg_database WHERE datname='socdepoble_node0'"],env).stdout.trim();
  if (!databases) run(path.join(path.dirname(psql),'createdb'),['socdepoble_node0'],env);
  const migrationEnv = { ...env, PGDATABASE:'socdepoble_node0', NODE0_PSQL:psql };
  let migrationReceipt='';
  const code = await hydrate(['--apply'],{env:migrationEnv,stdout:{write:value=>{migrationReceipt+=value;}}});
  if (code !== 0) throw new Error('node0_migrations_failed');
  run(psql,['-X','-w','-q','-v','ON_ERROR_STOP=1','-f',path.join(ROOT,'tooling/node0/schema-node0.sql')],migrationEnv);
  const configDir = camiSegur(path.join(os.homedir(),'.config/socdepoble'),{allowMissing:true});
  fs.mkdirSync(configDir,{recursive:true,mode:0o700});
  const migrationFile=path.join(configDir,'migration-receipt.json');
  if(fs.existsSync(migrationFile))fitxerRegular(migrationFile);
  fs.writeFileSync(migrationFile,migrationReceipt,{mode:0o600});
  const envFile = path.join(configDir,'node0.env');
  let envText = '';
  if (fs.existsSync(envFile)) {
    if ((fitxerRegular(envFile).stat.mode & 0o077)) throw new Error('node0_env_permissions');
    envText = fs.readFileSync(envFile,'utf8');
  }
  const existing = parseEnv(envText);
  for (const name of ['PGHOSTADDR','PGSERVICE','PGSERVICEFILE','PGOPTIONS']) if (existing[name]) throw new Error('node0_existing_env_connection_mismatch');
  const defaults = { PGHOST:socket, PGPORT:'5432', PGDATABASE:'socdepoble_node0', PGUSER:'node0_runtime', NODE0_PSQL:psql, SDP_NODE0_PORT:'4340' };
  const legacyIdentity=path.join(os.homedir(),'socdepoble-node0/dades/node0_ed25519.json');
  if(fs.existsSync(legacyIdentity)){
    if(fitxerRegular(legacyIdentity).stat.mode&0o077)throw new Error('node0_identity_permissions');
    defaults.SDP_NODE0_KEY_FILE=legacyIdentity;
  }
  const additions = [];
  for (const [name,required] of Object.entries(defaults)) {
    if (existing[name] && existing[name] !== required) throw new Error('node0_existing_env_connection_mismatch');
    if (!existing[name]) additions.push(`${name}=${required}`);
  }
  if (!existing.SDP_NODE0_ADMIN_TOKEN) additions.push(`SDP_NODE0_ADMIN_TOKEN=${randomBytes(32).toString('hex')}`);
  else if (existing.SDP_NODE0_ADMIN_TOKEN.length < 32) throw new Error('node0_existing_env_token_weak');
  if (additions.length) {
    const envTemp = `${envFile}.${randomBytes(8).toString('hex')}.tmp`;
    fs.writeFileSync(envTemp,envText+(envText.endsWith('\n')?'':'\n')+additions.join('\n')+'\n',{flag:'wx',mode:0o600});
    fs.renameSync(envTemp,envFile);
  }
  const launchDir = camiSegur(path.join(os.homedir(),'Library/LaunchAgents'),{allowMissing:true}), label = 'cat.socdepoble.node0-soberania';
  fs.mkdirSync(launchDir,{recursive:true});
  const plist = path.join(launchDir,`${label}.plist`);
  const contents = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>Label</key><string>${label}</string><key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>${xml(path.join(ROOT,'tooling/node0/arranca-node0.mjs'))}</string><string>${xml(envFile)}</string></array><key>WorkingDirectory</key><string>${xml(ROOT)}</string><key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>30</integer><key>StandardOutPath</key><string>${xml(path.join(configDir,'node0.stdout.log'))}</string><key>StandardErrorPath</key><string>${xml(path.join(configDir,'node0.stderr.log'))}</string></dict></plist>`;
  const existed=fs.existsSync(plist);
  if (existed) { fitxerRegular(plist);if(fs.readFileSync(plist,'utf8')!==contents)throw new Error('node0_launch_config_drift'); }
  else fs.writeFileSync(plist,contents,{flag:'wx',mode:0o600});
  run('/usr/bin/plutil',['-lint',plist]);
  const domain = `gui/${process.getuid()}`;
  const loaded=spawnSync('/bin/launchctl',['print',`${domain}/${label}`],{stdio:'ignore'}).status===0;
  if(!loaded)run('/bin/launchctl',['bootstrap',domain,plist]);
  else if(additions.length)run('/bin/launchctl',['kickstart','-k',`${domain}/${label}`]);
  let status;
  for(let attempt=0;attempt<40;attempt++){
    try{const response=await fetch('http://127.0.0.1:4340/api/v1/node0/status',{signal:AbortSignal.timeout(1000)});const value=await response.json();if(response.ok&&value.postgresql?.ok===true){status=value;break;}}catch{/* bounded launchd startup */}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  if (!status) throw new Error('node0_healthcheck_failed');
  const routing = caddy.original ? configuraCaddy({...caddy,caddy:process.env.NODE0_CADDY||'/opt/homebrew/bin/caddy'}) : { integrated:false, fragment:path.join(ROOT,'tooling/node0/Caddy.node0.fragment') };
  process.stdout.write(JSON.stringify({applied:true,migrations:{count:JSON.parse(migrationReceipt).migrations.length,receipt:migrationFile,sha256:sha(migrationReceipt)},localStatus:status,routing})+'\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error=>{process.stderr.write((error.message?.startsWith('node0_')?error.message:'node0_install_failed')+'\n');process.exitCode=1;});
