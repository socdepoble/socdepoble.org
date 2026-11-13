#!/usr/bin/env node
/** Local provisioning only. Values never enter reports; no implicit deploy/build/rotation. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const MIGRACIONS = Object.freeze([
  '2611020417_xat_avisos_push.sql',
  '2611080431_xat_push_leases.sql',
  '2611080432_xat_lliurament_i_presencia.sql'
]);
const fail = code => { throw Object.assign(new Error(code), { safeCode: code }); };
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const own = (o, k) => Object.hasOwn(o, k);
const MAX = 65536;
function parentsSafe(file) {
  let p = path.resolve(file);
  while (true) {
    if (fs.existsSync(p) && fs.lstatSync(p).isSymbolicLink()) fail('unsafe_symlink');
    const next = path.dirname(p);
    if (next === p) break;
    // macOS /tmp and /var are system aliases, never user-controlled leaves.
    if (next === '/tmp' || next === '/var') p = fs.realpathSync(next);
    else p = next;
  }
}
function read(file, { privateFile = false } = {}) {
  parentsSafe(file);
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const s = fs.fstatSync(fd);
    if (!s.isFile() || s.nlink !== 1 || s.size > MAX) fail('unsafe_file');
    if (privateFile && ((s.mode & 0o077) || s.uid !== process.getuid())) fail('unsafe_private_mode');
    return fs.readFileSync(fd, 'utf8');
  } finally { fs.closeSync(fd); }
}
// Real path even before the leaf exists: nearest existing ancestor plus the missing tail.
function realPath(file) {
  const tail = [];
  let p = path.resolve(file);
  while (!fs.existsSync(p) && path.dirname(p) !== p) { tail.unshift(path.basename(p)); p = path.dirname(p); }
  return path.join(fs.realpathSync(p), ...tail);
}
// Never inside a git work tree (repository or worktree `.git`): shared trees take global
// commits, and .gitignore is only the second line of defence.
function outsideRepository(dir) {
  for (let p = realPath(dir); ; p = path.dirname(p)) {
    if (fs.lstatSync(path.join(p, '.git'), { throwIfNoEntry: false })) fail('private_directory_inside_repository');
    if (path.dirname(p) === p) return;
  }
}
function privateDir(dir) {
  outsideRepository(dir);
  parentsSafe(dir);
  const s = fs.lstatSync(dir);
  if (!s.isDirectory() || (s.mode & 0o077) || s.uid !== process.getuid()) fail('unsafe_private_directory');
}
function writeNew(file, text) {
  fs.writeFileSync(file, text, { flag: 'wx', mode: 0o600 });
}
export function parseEnv(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > MAX || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text)) fail('invalid_env');
  const out = Object.create(null);
  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!m || own(out, m[1])) fail('invalid_env');
    let value = m[2];
    if (value.startsWith('"') || value.startsWith("'")) {
      const q = value[0];
      if (value.length < 2 || !value.endsWith(q)) fail('invalid_env');
      value = value.slice(1, -1);
    }
    if (value.includes('\r') || value.includes('\n')) fail('invalid_env');
    out[m[1]] = value;
  }
  return out;
}
function vapidPair(env) {
  const p = env.SDP_PUSH_VAPID_PUBLICA, d = env.SDP_PUSH_VAPID_PRIVADA;
  if (!/^[A-Za-z0-9_-]{87}$/.test(p || '') || !/^[A-Za-z0-9_-]{43}$/.test(d || '')) fail('invalid_vapid');
  const b = Buffer.from(p, 'base64url');
  if (b.length !== 65 || b[0] !== 4 || b.toString('base64url') !== p || Buffer.from(d, 'base64url').toString('base64url') !== d) fail('invalid_vapid');
  const jwk = { kty: 'EC', crv: 'P-256', x: b.subarray(1, 33).toString('base64url'), y: b.subarray(33).toString('base64url'), d };
  try {
    const key = crypto.createPrivateKey({ key: jwk, format: 'jwk' });
    const derived = crypto.createPublicKey(key).export({ format: 'jwk' });
    // OpenSSL may accept inconsistent EC coordinates; recompute from scalar.
    const ec = crypto.createECDH('prime256v1'); ec.setPrivateKey(Buffer.from(d, 'base64url'));
    if (!crypto.timingSafeEqual(ec.getPublicKey(), b) || derived.x !== jwk.x || derived.y !== jwk.y) fail('invalid_vapid');
    const msg = Buffer.from('sdp-r21.2-vapid-proof');
    if (!crypto.verify('sha256', msg, crypto.createPublicKey(key), crypto.sign('sha256', msg, key))) fail('invalid_vapid');
  } catch { fail('invalid_vapid'); }
  const subject = env.SDP_PUSH_VAPID_SUBJECTE || '';
  if (subject.length > 200 || !/^mailto:[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(subject)) fail('invalid_subject');
  return hash(p);
}
const overlays = env => ({
  'web.public.env': `VITE_PUSH_VAPID_PUBLICA=${env.SDP_PUSH_VAPID_PUBLICA}\nVITE_SDP_XAT_RITME=1\n`,
  'native.public.env': 'VITE_SDP_PUSH_NATIU=1\nVITE_SDP_XAT_RITME=1\n'
});
export function generateVapid(dir, subject) {
  const target = path.resolve(dir);
  if (fs.existsSync(target)) {
    privateDir(target);
    const env = parseEnv(read(path.join(target, 'vapid.private.env'), { privateFile: true }));
    const fingerprint = vapidPair(env);
    if (subject !== env.SDP_PUSH_VAPID_SUBJECTE) fail('subject_drift');
    for (const [name, value] of Object.entries(overlays(env))) if (read(path.join(target, name), { privateFile: true }) !== value) fail('overlay_drift');
    const manifest = JSON.parse(read(path.join(target, 'manifest.json'), { privateFile: true }));
    if (manifest.schema !== 'sdp.push.local.v1' || manifest.publicSha256 !== fingerprint) fail('manifest_drift');
    return { ok: true, reused: true, publicSha256: fingerprint };
  }
  outsideRepository(target);
  parentsSafe(path.dirname(target));
  // Validate subject before generating any material.
  if (typeof subject !== 'string' || subject.length > 200 || !/^mailto:[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(subject)) fail('invalid_subject');
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const j = privateKey.export({ format: 'jwk' });
  const p = Buffer.concat([Buffer.from([4]), Buffer.from(j.x, 'base64url'), Buffer.from(j.y, 'base64url')]).toString('base64url');
  const env = { SDP_PUSH_VAPID_PUBLICA: p, SDP_PUSH_VAPID_PRIVADA: j.d, SDP_PUSH_VAPID_SUBJECTE: subject };
  const fingerprint = vapidPair(env);
  fs.mkdirSync(target, { mode: 0o700 });
  try {
    writeNew(path.join(target, 'vapid.private.env'), Object.entries(env).map(([k, v]) => `${k}=${v}\n`).join(''));
    for (const [name, value] of Object.entries(overlays(env))) writeNew(path.join(target, name), value);
    writeNew(path.join(target, 'manifest.json'), JSON.stringify({ schema: 'sdp.push.local.v1', publicSha256: fingerprint }, null, 2) + '\n');
  } catch (error) {
    fs.rmSync(target, { recursive: true });
    throw error;
  }
  return { ok: true, reused: false, publicSha256: fingerprint };
}
function configuration(dir, inputs) {
  privateDir(dir);
  const env = parseEnv(read(path.join(dir, 'vapid.private.env'), { privateFile: true }));
  vapidPair(env);
  if (inputs) {
    const extra = parseEnv(read(inputs, { privateFile: true }));
    for (const key of Object.keys(extra)) {
      if (own(env, key) && env[key] !== extra[key]) fail('input_conflict');
      env[key] = extra[key];
    }
    for (const key of ['SDP_APNS_CLAU_P8', 'SDP_FCM_COMPTE_SERVEI']) {
      if (!env[`${key}_FILE`]) continue;
      if (env[key]) fail('input_conflict');
      env[key] = read(path.resolve(path.dirname(inputs), env[`${key}_FILE`]), { privateFile: true }).trim();
    }
  }
  return env;
}
function assess({ root, dir, inputs, channels = ['web', 'ios', 'android'] }) {
  if (!Array.isArray(channels) || !channels.length || new Set(channels).size !== channels.length || channels.some(c => !['web', 'ios', 'android'].includes(c))) fail('invalid_channels');
  const env = configuration(dir, inputs), issues = [];
  const issue = (ok, code) => { if (!ok) issues.push(code); };
  issue(/^[A-Za-z0-9_-]{32,256}$/.test(env.SDP_CRON_SECRET || ''), 'cron_secret_missing_or_invalid');
  for (const name of MIGRACIONS) issue(fs.existsSync(path.join(root, 'supabase/migrations', name)), 'migration_missing');
  // Public overlay is checked byte for byte; never inspect arbitrary build env values.
  for (const [name, value] of Object.entries(overlays(env))) issue(read(path.join(dir, name), { privateFile: true }) === value, 'overlay_drift');
  if (channels.includes('ios')) {
    issue(env.SDP_APNS_EQUIP === '9KNUA4JR8P', 'apns_team');
    issue(/^[A-Z0-9]{10}$/.test(env.SDP_APNS_CLAU_ID || ''), 'apns_key_id');
    issue(env.SDP_APNS_TOPIC === 'org.socdepoble.app', 'apns_topic');
    issue(['produccio', 'sandbox'].includes(env.SDP_APNS_ENTORN), 'apns_environment');
    try {
      const pem = (env.SDP_APNS_CLAU_P8 || '').replace(/\\n/g, '\n');
      issue(pem.trim().startsWith(['-----BEGIN', 'PRIVATE KEY-----'].join(' ')), 'apns_pkcs8');
      const key = crypto.createPrivateKey(pem);
      issue(key.asymmetricKeyType === 'ec' && key.asymmetricKeyDetails.namedCurve === 'prime256v1', 'apns_key');
    } catch { issue(false, 'apns_key'); }
  }
  if (channels.includes('android')) {
    try {
      const account = JSON.parse(env.SDP_FCM_COMPTE_SERVEI || '');
      issue(account.type === 'service_account' && /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(account.project_id || '') && /^[a-z0-9-]+@[a-z0-9.-]+\.iam\.gserviceaccount\.com$/.test(account.client_email || ''), 'fcm_account');
      issue(!account.token_uri || account.token_uri === 'https://oauth2.googleapis.com/token', 'fcm_token_authority');
      const key = crypto.createPrivateKey(account.private_key || '');
      issue((account.private_key || '').trim().startsWith(['-----BEGIN', 'PRIVATE KEY-----'].join(' ')), 'fcm_pkcs8');
      issue(key.asymmetricKeyType === 'rsa' && key.asymmetricKeyDetails.modulusLength >= 2048, 'fcm_key');
      const google = JSON.parse(read(path.join(root, 'android/app/google-services.json')));
      issue(google.project_info?.project_id === account.project_id, 'firebase_project');
      issue(google.client?.some(c => c.client_info?.android_client_info?.package_name === 'org.socdepoble.app' && typeof c.client_info.mobilesdk_app_id === 'string' && c.client_info.mobilesdk_app_id.length > 0 && c.api_key?.some(k => typeof k.current_key === 'string' && k.current_key.length > 0)), 'firebase_app');
    } catch { issue(false, 'fcm_or_firebase_file'); }
  }
  const executables = ['supabase', 'psql', ...(channels.includes('web') ? ['firebase'] : [])];
  const tools = Object.fromEntries(executables.map(name => [name, (process.env.PATH || '').split(path.delimiter).some(dir => {
    try { fs.accessSync(path.join(dir, name), fs.constants.X_OK); return fs.statSync(path.join(dir, name)).isFile(); } catch { return false; }
  })]));
  return { report: { schema: 'sdp.push.preflight.v1', scope: 'local_preparation_only', ok: issues.length === 0, channels, issues: [...new Set(issues)], tools, toolsAvailable: Object.values(tools).every(Boolean), publicSha256: hash(env.SDP_PUSH_VAPID_PUBLICA), remoteVerified: false, authorizationVerified: false, deviceDeliveryVerified: false }, env };
}
export function preflight(options) { return assess(options).report; }
export function stage(options) {
  const { report, env } = assess(options);
  if (!report.ok) return report;
  const out = path.join(options.dir, 'staged');
  const edge = ['SDP_CRON_SECRET', 'SDP_PUSH_VAPID_PUBLICA', 'SDP_PUSH_VAPID_PRIVADA', 'SDP_PUSH_VAPID_SUBJECTE'];
  if (report.channels.includes('ios')) edge.push('SDP_APNS_EQUIP', 'SDP_APNS_CLAU_ID', 'SDP_APNS_CLAU_P8', 'SDP_APNS_TOPIC', 'SDP_APNS_ENTORN');
  if (report.channels.includes('android')) edge.push('SDP_FCM_COMPTE_SERVEI');
  const values = Object.fromEntries(edge.map(k => [k, k === 'SDP_FCM_COMPTE_SERVEI' ? JSON.stringify(JSON.parse(env[k])) : env[k].replace(/\r?\n/g, '\\n')]));
  // Single quotes preserve JSON backslashes. The provider normalizes PEM \\n.
  if (Object.values(values).some(v => /['\r\n\x00]/.test(v))) fail('unsupported_secret_encoding');
  const secretText = Object.entries(values).map(([k, v]) => `${k}='${v}'\n`).join('');
  const files = { 'edge.secrets.env': secretText };
  // No blind db push. Exact migration bytes only, preserving their transactions.
  files['schema.sql'] = MIGRACIONS.map(n => read(path.join(options.root, 'supabase/migrations', n))).join('\n');
  files['activa.sql'] = "begin;\nset local lock_timeout='5s';\nset local statement_timeout='15s';\ndo $$ begin\nif to_regprocedure('public.xat_push_desperta_v2(uuid,uuid)') is null or to_regprocedure('public.xat_ritme(uuid)') is null then raise exception 'push_schema_incomplete'; end if;\nend $$;\ninsert into private.ajustos(clau,valor) values ('push_xat_actiu','si') on conflict(clau) do update set valor=excluded.valor;\ncommit;\n";
  if (fs.existsSync(out)) {
    privateDir(out);
    if (Object.keys(files).some(name => read(path.join(out, name), { privateFile: true }) !== files[name])) fail('stage_drift');
    return { ...report, staged: true, reused: true };
  }
  fs.mkdirSync(out, { mode: 0o700 });
  try { for (const [name, text] of Object.entries(files)) writeNew(path.join(out, name), text); }
  catch (error) { fs.rmSync(out, { recursive: true }); throw error; }
  return { ...report, staged: true, reused: false };
}
export function deploymentPlan(ref) {
  if (!/^[a-z]{20}$/.test(ref || '')) fail('invalid_project_ref');
  return [
    'psql service=sdp_push -X -v ON_ERROR_STOP=1 -f "$PRIVATE/staged/schema.sql"',
    `supabase secrets set --env-file "$PRIVATE/staged/edge.secrets.env" --remote=${ref} --yes`,
    `supabase functions deploy notifica-xat --no-verify-jwt --remote=${ref} --yes`,
    `supabase functions deploy notifica-xat-desperta --remote=${ref} --yes`,
    '# Configure authenticated external recovery cron; test JWT relay separately.',
    `supabase secrets set SDP_PUSH_ACTIU=si --remote=${ref} --yes`,
    'psql service=sdp_push -X -v ON_ERROR_STOP=1 -f "$PRIVATE/staged/activa.sql"'
  ];
}
export async function tick({ ref, dir, inputs, fetchImpl = fetch }) {
  deploymentPlan(ref);
  const env = configuration(dir, inputs);
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(env.SDP_CRON_SECRET || '')) fail('cron_secret_missing_or_invalid');
  const response = await fetchImpl(`https://${ref}.supabase.co/functions/v1/notifica-xat`, { method: 'POST', headers: { 'x-sdp-cron': env.SDP_CRON_SECRET }, signal: AbortSignal.timeout(15000), redirect: 'error' });
  await response.body?.cancel();
  return { ok: response.ok, status: response.status, deviceDeliveryVerified: false };
}
export async function main(args = process.argv.slice(2)) {
  try {
    const [command, ...rest] = args, opts = Object.create(null);
    const allowed = new Set(['root', 'private-dir', 'inputs', 'channels', 'subject', 'project-ref']);
    for (let i = 0; i < rest.length; i += 2) {
      const k = rest[i]?.replace(/^--/, '');
      if (!rest[i]?.startsWith('--') || !allowed.has(k) || own(opts, k) || !rest[i + 1] || rest[i + 1].startsWith('--')) fail('invalid_arguments');
      opts[k] = rest[i + 1];
    }
    if (!opts['private-dir'] && command !== 'plan') fail('private_directory_required');
    const options = { root: path.resolve(opts.root || '.'), dir: path.resolve(opts['private-dir'] || '.'), inputs: opts.inputs && path.resolve(opts.inputs), channels: opts.channels?.split(',') };
    let result;
    if (command === 'vapid') result = generateVapid(options.dir, opts.subject);
    else if (command === 'preflight') result = preflight(options);
    else if (command === 'stage') result = stage(options);
    else if (command === 'plan') result = { ok: true, commands: deploymentPlan(opts['project-ref']), executed: false };
    else if (command === 'tick') result = await tick({ ...options, ref: opts['project-ref'] });
    else fail('invalid_command');
    process.stdout.write(JSON.stringify(result) + '\n');
    return result.ok ? 0 : 2;
  } catch (error) {
    process.stdout.write(JSON.stringify({ ok: false, error: error.safeCode || 'operation_failed' }) + '\n');
    return 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = await main();
