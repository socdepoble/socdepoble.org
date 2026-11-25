#!/usr/bin/env node
/** Inspecció local sense xarxa. Els JWT i les claus no ixen mai del procés.
 * Un HTTP acceptat pel proveïdor no acredita l'entrega a un dispositiu.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPrivateKey, createPublicKey, verify } from 'node:crypto';
import { parseEnv } from './aprovisiona-push.mjs';
import { clauVapid, contacteVapid, jwtVapid, peticioWebPush } from '../../supabase/functions/notifica-xat/webpush.js';
import { jwtApns, jwtFcm, compteDeServei, peticioApns, peticioFcm } from '../../supabase/functions/notifica-xat/natius.js';

const CHANNELS = Object.freeze(['web', 'ios', 'android']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH = /^[0-9a-f]{64}$/;
const own = (v, k) => Object.hasOwn(v, k);
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Només fitxers regulars privats. No seguix enllaços ni llig directoris/git. */
export function lligPrivat(file, { max = 262144 } = {}) {
  let parent = path.resolve(file);
  for (;;) {
    if (fs.lstatSync(parent).isSymbolicLink()) {
      if (parent === '/tmp' || parent === '/var') parent = fs.realpathSync(parent);
      else throw Error('push_smoke_unsafe_symlink');
    }
    const next = path.dirname(parent);
    if (next === parent) break;
    parent = next;
  }
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1 || stat.size > max || stat.uid !== process.getuid() || (stat.mode & 0o077)) throw Error('push_smoke_unsafe_private_file');
    return fs.readFileSync(fd, 'utf8');
  } finally { fs.closeSync(fd); }
}

function comprovaJwt(jwt, key, algorithm) {
  const parts = jwt.split('.');
  if (parts.length !== 3) throw Error('jwt_shape');
  const opts = algorithm === 'ES256' ? { key: createPublicKey(key), dsaEncoding: 'ieee-p1363' } : createPublicKey(key);
  if (!verify('SHA256', Buffer.from(parts.slice(0, 2).join('.')), opts, Buffer.from(parts[2], 'base64url'))) throw Error('jwt_signature');
  const header = JSON.parse(Buffer.from(parts[0], 'base64url'));
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url'));
  if (header.alg !== algorithm) throw Error('jwt_algorithm');
  return { header, claims };
}

/** Prova els constructors productius amb destinataris sintètics; cap fetch. */
export async function revisaMaterialStaged(env, { channels = CHANNELS, ara = Date.UTC(2026, 10, 25, 2) } = {}) {
  const errors = [], checked = [];
  if (!object(env) || !Array.isArray(channels) || !channels.length || new Set(channels).size !== channels.length || channels.some(c => !CHANNELS.includes(c))) {
    return { ok: false, errors: ['invalid_configuration'], checked, remoteVerified: false, deviceDeliveryVerified: false };
  }
  const check = async (channel, fn) => {
    try { await fn(); checked.push(channel); } catch { errors.push(`${channel}_credentials_or_payload_invalid`); }
  };
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(env.SDP_CRON_SECRET || '')) errors.push('cron_secret_missing_or_invalid');
  if (channels.includes('web')) await check('web', async () => {
    const vapid = await clauVapid({ publica: env.SDP_PUSH_VAPID_PUBLICA, privada: env.SDP_PUSH_VAPID_PRIVADA });
    const contact = contacteVapid(env.SDP_PUSH_VAPID_SUBJECTE);
    if (!vapid || !contact) throw Error('vapid');
    const jwt = await jwtVapid({ clau: vapid.clau, audiencia: 'https://web.push.apple.com', contacte: contact, ara });
    const point = Buffer.from(env.SDP_PUSH_VAPID_PUBLICA, 'base64url');
    const key = createPrivateKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', d: env.SDP_PUSH_VAPID_PRIVADA, x: point.subarray(1, 33).toString('base64url'), y: point.subarray(33).toString('base64url') } });
    const { claims } = comprovaJwt(jwt, key, 'ES256');
    const request = peticioWebPush({ endpoint: 'https://web.push.apple.com/sdp-smoke-synthetic', jwt, publica: env.SDP_PUSH_VAPID_PUBLICA });
    if (claims.aud !== 'https://web.push.apple.com' || claims.exp !== Math.floor(ara / 1000) + 43200 || claims.sub !== contact || own(request.opcions, 'body') || request.opcions.redirect !== 'error') throw Error('web_contract');
  });
  if (channels.includes('ios')) await check('ios', async () => {
    if (env.SDP_APNS_EQUIP !== '9KNUA4JR8P' || env.SDP_APNS_TOPIC !== 'org.socdepoble.app' || !['produccio', 'sandbox'].includes(env.SDP_APNS_ENTORN)) throw Error('apns_contract');
    const pem = (env.SDP_APNS_CLAU_P8 || '').replace(/\\n/g, '\n');
    const key = createPrivateKey(pem);
    if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails.namedCurve !== 'prime256v1') throw Error('apns_key');
    const jwt = await jwtApns({ equip: env.SDP_APNS_EQUIP, clauId: env.SDP_APNS_CLAU_ID, clauPem: pem, ara });
    const { header, claims } = comprovaJwt(jwt, key, 'ES256');
    const request = peticioApns({ entorn: env.SDP_APNS_ENTORN, topic: env.SDP_APNS_TOPIC, testimoni: 'ab'.repeat(32), jwt, llengua: 'ca', ara });
    const body = JSON.parse(request.opcions.body);
    if (header.kid !== env.SDP_APNS_CLAU_ID || claims.iss !== env.SDP_APNS_EQUIP || claims.iat !== Math.floor(ara / 1000) || body.sdp.desti !== '/xat' || request.opcions.redirect !== 'error') throw Error('apns_payload');
  });
  if (channels.includes('android')) await check('android', async () => {
    const raw = JSON.parse(env.SDP_FCM_COMPTE_SERVEI || '');
    if (raw.token_uri && raw.token_uri !== 'https://oauth2.googleapis.com/token') throw Error('fcm_authority');
    const account = compteDeServei(env.SDP_FCM_COMPTE_SERVEI);
    if (!account) throw Error('fcm_account');
    const key = createPrivateKey(account.clauPem);
    if (key.asymmetricKeyType !== 'rsa' || key.asymmetricKeyDetails.modulusLength < 2048) throw Error('fcm_key');
    const jwt = await jwtFcm({ correu: account.correu, clauPem: account.clauPem, ara });
    const { claims } = comprovaJwt(jwt, key, 'RS256');
    const request = peticioFcm({ projecte: account.projecte, testimoni: 'sdp_smoke_synthetic_'.repeat(3), accessToken: 'synthetic-local-only-credential', llengua: 'ca', ara });
    if (claims.aud !== 'https://oauth2.googleapis.com/token' || claims.iss !== account.correu || claims.exp !== Math.floor(ara / 1000) + 3600 || JSON.parse(request.opcions.body).message.data.desti !== '/xat' || request.opcions.redirect !== 'error') throw Error('fcm_payload');
  });
  return { ok: errors.length === 0, checked, errors, remoteVerified: false, deviceDeliveryVerified: false };
}

/** Rebut extern sense tokens. La coherència d'un rebut no prova la seua autenticitat.
 * Cap booleà caller-supplied deviceDeliveryVerified pot elevar este resultat.
 */
export function revisaRebutFum(receipt, { runId, channels = CHANNELS, ara = Date.now(), maximAntiguitatMs = 900000 } = {}) {
  const errors = [];
  if (!UUID.test(runId || '') || !Array.isArray(channels) || !channels.length || channels.some(c => !CHANNELS.includes(c)) || new Set(channels).size !== channels.length) return { ok: false, errors: ['invalid_expected_run'], deviceDeliveryVerified: false, activationAuthorized: false };
  if (!object(receipt) || receipt.format !== 'sdp.push.smoke-receipt.v1' || receipt.runId !== runId || receipt.mode !== 'real') errors.push('real_receipt_required');
  const rows = receipt?.channels;
  if (!Array.isArray(rows) || rows.length !== channels.length || new Set(rows.map(row => row?.channel)).size !== channels.length) errors.push('channel_coverage');
  const contract = receipt?.database;
  if (!object(contract) || contract.table !== 'public.xat_dispositius_push' || contract.rls !== true || contract.sessionCascade !== true || contract.enqueueTrigger !== true || contract.claimRpc !== true || contract.ackRpc !== true) errors.push('subscription_contract_incomplete');
  if (!object(receipt?.worker) || receipt.worker.httpStatus !== 200 || !Number.isInteger(receipt.worker.attempted) || receipt.worker.attempted !== channels.length || receipt.worker.accepted !== channels.length || receipt.worker.failed !== 0 || receipt.worker.unauthorized !== 0 || receipt.worker.untried !== 0 || receipt.worker.withoutProvider !== 0) errors.push('worker_silent_failure');
  const devices = new Set();
  for (const channel of channels) {
    const row = Array.isArray(rows) ? rows.find(r => r?.channel === channel) : null;
    if (!row || !HASH.test(row.subscriptionSha256 || '') || !UUID.test(row.messageId || '') || !HASH.test(row.deviceSha256 || '') || devices.has(row.deviceSha256)) { errors.push(`${channel}_correlation_missing`); continue; }
    devices.add(row.deviceSha256);
    const providerOk = channel === 'web' ? [200, 201, 202].includes(row.providerStatus) : row.providerStatus === 200;
    if (!providerOk || row.relayStatus !== 202 || row.ack !== 'acceptat') errors.push(`${channel}_provider_or_relay_failed`);
    const times = [row.subscribedAt, row.enqueuedAt, row.providerAcceptedAt, row.displayedAt].map(Date.parse);
    if (times.some(v => !Number.isFinite(v)) || times.some(v => v > ara || ara - v > maximAntiguitatMs) || times.some((v, i) => i > 0 && v < times[i - 1]) || row.displayedRunId !== runId || row.runId !== runId) errors.push(`${channel}_device_evidence_missing_or_stale`);
  }
  return { ok: errors.length === 0, errors: [...new Set(errors)], evidenceSource: 'operator_provided_receipt', deviceEvidencePresent: errors.length === 0, deviceDeliveryVerified: false, activationAuthorized: false };
}

export async function main(args = process.argv.slice(2)) {
  try {
    const opts = Object.create(null);
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--sense-ia') { opts.senseIa = true; continue; }
      if (!['--staged-dir', '--receipt', '--run-id'].includes(args[i]) || own(opts, args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw Error('invalid_arguments');
      opts[args[i]] = args[++i];
    }
    if (!opts.senseIa || !opts['--staged-dir']) throw Error('usage_requires_sense_ia_and_staged_dir');
    const material = await revisaMaterialStaged(parseEnv(lligPrivat(path.join(path.resolve(opts['--staged-dir']), 'edge.secrets.env'))));
    const receipt = opts['--receipt'] ? revisaRebutFum(JSON.parse(lligPrivat(path.resolve(opts['--receipt']))), { runId: opts['--run-id'] }) : { ok: false, errors: ['real_device_receipt_missing'], deviceDeliveryVerified: false, activationAuthorized: false };
    const report = { format: 'sdp.push.smoke.v1', ok: material.ok && receipt.ok, material, receipt, networkRequests: 0, activationAuthorized: false };
    process.stdout.write(JSON.stringify(report) + '\n');
    return report.ok ? 0 : 2;
  } catch {
    // Error de fitxer/parseig sempre opac: cap ruta privada, clau ni missatge d'OpenSSL.
    process.stdout.write(JSON.stringify({ format: 'sdp.push.smoke.v1', ok: false, errors: ['private_input_invalid'], networkRequests: 0, activationAuthorized: false }) + '\n');
    return 2;
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) process.exitCode = await main();
