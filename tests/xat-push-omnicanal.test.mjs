/* R21.2: local integration at the Auth/PostgREST/provider boundaries.
 * All keys are ephemeral, generated in memory. No env file, real device,
 * credentials, sockets or production service is read or contacted.
 * Database responses are fixtures: this suite does not certify SQL/RLS,
 * APNs HTTP/2 negotiation, device receipt, or an installed native binary.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { creaDespertador } from '../supabase/functions/notifica-xat-desperta/gestor.js';
import { creaGestor } from '../supabase/functions/notifica-xat/gestor.js';
import { creaEnviadorsNatius } from '../supabase/functions/notifica-xat/natius.js';

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const NOW = Date.UTC(2026, 10, 12, 16);
const BASE = 'https://project.synthetic.invalid';
const OAUTH = 'https://oauth2.googleapis.com/token';
const FCM = 'https://fcm.googleapis.com/v1/projects/sdp-synthetic/messages:send';
const APPLE = 'https://api.push.apple.com';
const USER = id(1), MESSAGE = id(2);
// These are synthetic sentinels, deliberately unusable as credentials.
const USER_AUTH = 'Bearer synthetic.user.assertion';
const SERVICE = 'eyJhbGciOiJIUzI1NiJ9.synthetic_service.fixture';
const CRON = 'synthetic_cron_fixture_'.repeat(3);
const ACCESS = 'synthetic_oauth_fixture_'.repeat(3);
const CONTACT = 'mailto:push@example.invalid';
const TEAM = 'SYNTH00001', KEY_ID = 'SYNTH00002';
const TOPIC = 'org.socdepoble.app';

const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ecJwk = ec.privateKey.export({ format: 'jwk' });
const ecRaw = Buffer.concat([Buffer.from([4]), Buffer.from(ecJwk.x, 'base64url'), Buffer.from(ecJwk.y, 'base64url')]);
const PUBLIC = ecRaw.toString('base64url');
const PKCS8 = pair => pair.privateKey.export({ format: 'pem', type: 'pkcs8' });
const ACCOUNT_EMAIL = 'synthetic@sdp-synthetic.iam.gserviceaccount.com';
const FCM_ACCOUNT = JSON.stringify({ type: 'service_account', project_id: 'sdp-synthetic', client_email: ACCOUNT_EMAIL,
  private_key: PKCS8(rsa), token_uri: 'https://untrusted.example.invalid/do-not-use' });

function jwtParts(jwt, key, alg) {
  const parts = jwt.split('.');
  assert.equal(parts.length, 3, 'compact JWT');
  const signed = Buffer.from(`${parts[0]}.${parts[1]}`);
  const signature = Buffer.from(parts[2], 'base64url');
  const options = alg === 'ES256' ? { key, dsaEncoding: 'ieee-p1363' } : key;
  assert.ok(verify('SHA256', signed, options, signature), 'independently verified JWT signature');
  assert.ok(!verify('SHA256', Buffer.concat([signed, Buffer.from('tamper')]), options, signature), 'tampering rejected');
  if (alg === 'ES256') assert.equal(signature.byteLength, 64, 'ES256 uses raw r || s');
  return { header: JSON.parse(Buffer.from(parts[0], 'base64url')), claims: JSON.parse(Buffer.from(parts[1], 'base64url')) };
}

function devices() {
  return [
    { id: id(10), tipus: 'web', adreca: 'https://web.push.apple.com/synthetic_fixture', llengua: 'ca' },
    { id: id(11), tipus: 'apns', adreca: 'ab'.repeat(32), llengua: 'eu' },
    { id: id(12), tipus: 'fcm', adreca: 'synthetic_fcm_device_'.repeat(3), llengua: 'gl' }
  ];
}

function world({ active = true, authenticated = true, shouldWake = true, envPatch = {}, statuses = {} } = {}) {
  const env = { SUPABASE_URL: BASE, SUPABASE_SERVICE_ROLE_KEY: SERVICE, SDP_CRON_SECRET: CRON,
    SDP_PUSH_ACTIU: active ? 'si' : '', SDP_PUSH_VAPID_PUBLICA: PUBLIC, SDP_PUSH_VAPID_PRIVADA: ecJwk.d,
    SDP_PUSH_VAPID_SUBJECTE: CONTACT, SDP_APNS_EQUIP: TEAM, SDP_APNS_CLAU_ID: KEY_ID,
    SDP_APNS_CLAU_P8: PKCS8(ec), SDP_APNS_TOPIC: TOPIC, SDP_FCM_COMPTE_SERVEI: FCM_ACCOUNT, ...envPatch };
  const w = { calls: [], providerCalls: [], errors: [], logs: [], pending: [], summaries: [], acks: [], batches: [], cache: new Map(), credentials: [], sequence: 100 };
  w.enqueue = (rows = devices()) => {
    const batch = rows.map(row => ({ ...row, lliuraments: [{ id: id(++w.sequence), lease: id(++w.sequence) }] }));
    w.batches.push({ protocol: 'lease-v2', missatges: 1, treballs: batch.length, retallats: 0, dispositius: batch });
    return batch;
  };
  const headersOf = options => new Headers(options.headers);
  const json = value => Response.json(value);
  w.fetch = async (url, options = {}) => {
    w.calls.push({ url, options });
    try {
      const headers = headersOf(options);
      assert.equal(options.redirect, 'error', 'all boundary calls forbid redirects');
      if (url === `${BASE}/auth/v1/user`) {
        assert.equal(options.method, 'GET');
        assert.ok(headers.get('authorization') === USER_AUTH, 'Auth receives caller assertion');
        assert.ok(headers.get('apikey') === SERVICE, 'Auth uses service API key only at trusted origin');
        return authenticated ? json({ id: USER }) : new Response(null, { status: 401 });
      }
      if (url.startsWith(`${BASE}/rest/v1/rpc/`)) {
        const name = url.split('/').at(-1), body = JSON.parse(options.body);
        assert.ok(headers.get('apikey') === SERVICE, 'RPC requires server API key');
        assert.ok(headers.get('authorization') === `Bearer ${SERVICE}`, 'RPC uses server authorization');
        if (name === 'xat_push_desperta_v2') {
          assert.deepEqual(body, { p_missatge_id: MESSAGE, p_usuari_esperat: USER }, 'identity comes from verified Auth user');
          return json(shouldWake);
        }
        if (name === 'xat_push_neteja') return json({ dispositius: 0, cua: 0 });
        if (name === 'xat_push_reclama_v2') return json(w.batches.shift() ?? { protocol: 'lease-v2', missatges: 0, treballs: 0, retallats: 0, dispositius: [] });
        if (name === 'xat_push_credencial') return json(w.cache.get(body.p_proveidor) ?? null);
        if (name === 'xat_push_desa_credencial') {
          w.credentials.push({ provider: body.p_proveidor, expires: body.p_caduca_al });
          w.cache.set(body.p_proveidor, body.p_valor);
          return json(true);
        }
        if (name === 'xat_push_confirma_v2') {
          w.acks.push(...body.p_resultats);
          return json({ expulsats: body.p_resultats.filter(row => row.resultat === 'expulsa').length });
        }
        assert.fail('unexpected RPC boundary');
      }
      assert.equal(options.method, 'POST');
      assert.ok(!headers.has('apikey'), 'server API key never reaches a provider');
      assert.ok(!headers.has('x-sdp-cron'), 'cron credential never reaches a provider');
      assert.ok(options.signal instanceof AbortSignal, 'provider call can be cancelled');
      if (url === OAUTH) {
        const form = new URLSearchParams(options.body);
        assert.equal(form.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer');
        const { header, claims } = jwtParts(form.get('assertion'), rsa.publicKey, 'RS256');
        assert.deepEqual(header, { alg: 'RS256', typ: 'JWT' });
        assert.deepEqual(claims, { iss: ACCOUNT_EMAIL, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: OAUTH,
          iat: NOW / 1000, exp: NOW / 1000 + 3600 });
        w.providerCalls.push({ provider: 'oauth' });
        return json({ access_token: ACCESS, expires_in: 3600 });
      }
      if (url.startsWith('https://web.push.apple.com/')) {
        const match = /^vapid t=([^,]+), k=(.+)$/.exec(headers.get('authorization'));
        assert.ok(match, 'RFC8292 VAPID header');
        assert.ok(match[2] === PUBLIC, 'VAPID public key equals subscription key');
        assert.equal(Buffer.from(match[2], 'base64url').byteLength, 65);
        const { header, claims } = jwtParts(match[1], ec.publicKey, 'ES256');
        assert.deepEqual(header, { typ: 'JWT', alg: 'ES256' });
        assert.deepEqual(claims, { aud: 'https://web.push.apple.com', exp: NOW / 1000 + 43200, sub: CONTACT });
        assert.equal(headers.get('ttl'), '86400');
        assert.equal(headers.get('topic'), 'sdp-xat');
        assert.equal(headers.get('urgency'), 'normal');
        assert.equal(headers.get('content-length'), '0');
        assert.equal(headers.get('content-encoding'), null);
        assert.equal(options.body, undefined, 'blind web wake has no encrypted payload to decrypt');
        w.providerCalls.push({ provider: 'web', jwt: match[1] });
        const status = statuses.web ?? 201;
        return new Response(null, { status });
      }
      if (url.startsWith(APPLE) || url.startsWith('https://api.sandbox.push.apple.com')) {
        const expectedOrigin = env.SDP_APNS_ENTORN === 'sandbox' ? 'https://api.sandbox.push.apple.com' : APPLE;
        assert.ok(url === `${expectedOrigin}/3/device/${devices()[1].adreca}`, 'APNs endpoint matches selected environment and device');
        const authorization = headers.get('authorization');
        assert.ok(authorization?.startsWith('bearer '));
        const jwt = authorization.slice(7), { header, claims } = jwtParts(jwt, ec.publicKey, 'ES256');
        assert.deepEqual(header, { alg: 'ES256', kid: KEY_ID });
        assert.deepEqual(claims, { iss: TEAM, iat: NOW / 1000 });
        assert.equal(headers.get('apns-topic'), TOPIC);
        assert.equal(headers.get('apns-push-type'), 'alert');
        assert.equal(headers.get('apns-priority'), '10');
        assert.equal(headers.get('apns-expiration'), String(NOW / 1000 + 86400));
        assert.equal(headers.get('apns-collapse-id'), 'sdp-xat');
        assert.deepEqual(JSON.parse(options.body), { aps: { alert: { title: 'Sóc de Poble', body: 'Mezu berriak dituzu' }, badge: 1, sound: 'default', 'thread-id': 'sdp-xat' },
          sdp: { v: 1, desti: '/xat' } });
        w.providerCalls.push({ provider: 'apns', jwt });
        return statuses.apns ? jsonError(statuses.apns) : new Response(null, { status: 200 });
      }
      if (url === FCM) {
        assert.ok(headers.get('authorization') === `Bearer ${ACCESS}`, 'FCM uses exchanged access token');
        assert.deepEqual(JSON.parse(options.body), { message: { token: devices()[2].adreca,
          notification: { title: 'Sóc de Poble', body: 'Tes mensaxes novas' },
          android: { priority: 'HIGH', ttl: '86400s', collapse_key: 'sdp-xat', notification: { tag: 'sdp-xat', channel_id: 'xat' } }, data: { desti: '/xat' } } });
        w.providerCalls.push({ provider: 'fcm' });
        return statuses.fcm ? jsonError(statuses.fcm) : json({ name: 'projects/sdp-synthetic/messages/provider-accepted-only' });
      }
      assert.fail('network destination outside explicit synthetic boundaries');
    } catch (error) { w.errors.push(error.message); throw error; }
  };
  const registre = Object.fromEntries(['info', 'warn', 'error'].map(level => [level, (...args) => w.logs.push(args.join(' '))]));
  const worker = creaGestor({ env, fetch: w.fetch, ara: () => NOW, registre, creaEnviadorsNatius });
  w.relay = creaDespertador({ env, fetch: w.fetch,
    worker: async req => { const response = await worker(req); w.summaries.push({ status: response.status, body: await response.json() }); },
    background: task => w.pending.push(task) });
  w.wake = async (body = { missatgeId: MESSAGE }, authorization = USER_AUTH) => {
    const response = await w.relay(new Request(`${BASE}/functions/v1/notifica-xat-desperta`, { method: 'POST',
      headers: { authorization, 'content-type': 'application/json' }, body: JSON.stringify(body) }));
    const result = { status: response.status, body: await response.json() };
    await Promise.all(w.pending);
    assert.deepEqual(w.errors, [], 'all mocked boundaries accepted valid wire protocol');
    return result;
  };
  w.assertPrivate = result => {
    const visible = JSON.stringify({ result, logs: w.logs, summaries: w.summaries });
    for (const forbidden of [SERVICE, CRON, ACCESS, USER_AUTH, PUBLIC, ecJwk.d, devices()[1].adreca, devices()[2].adreca,
      MESSAGE, USER, ...w.acks.flatMap(ack => [ack.id, ack.lease])]) {
      assert.ok(!visible.includes(forbidden), 'no credential, device address, author, message id or lease in public response/log');
    }
  };
  return w;
}

function jsonError({ status, body }) { return new Response(JSON.stringify(body ?? {}), { status, headers: { 'content-type': 'application/json' } }); }

test('R21.2 real relay -> worker -> three provider modules verifies wire signatures and server-only lease ACKs locally', async () => {
  const w = world(), batch = w.enqueue();
  const result = await w.wake();
  assert.deepEqual(result, { status: 202, body: { ok: true } });
  assert.equal(w.summaries.length, 1);
  assert.equal(w.summaries[0].status, 200);
  assert.equal(w.summaries[0].body.enviats, 3, 'three mocked provider acceptances, no device receipt claim');
  assert.deepEqual(w.providerCalls.map(call => call.provider).sort(), ['apns', 'fcm', 'oauth', 'web']);
  assert.deepEqual(w.acks.sort((a, b) => a.id.localeCompare(b.id)), batch.flatMap(row => row.lliuraments.map(claim => ({ ...claim, resultat: 'acceptat' }))));
  assert.deepEqual(w.credentials.map(row => row.provider).sort(), ['apns', 'fcm']);
  assert.ok(w.credentials.every(row => Date.parse(row.expires) < NOW + 3600000));
  w.assertPrivate(result);
});

test('R21.2 native credentials persist across fresh worker passes without reminting APNs JWT or Google OAuth', async () => {
  const w = world();
  w.enqueue(); await w.wake();
  w.enqueue(); const result = await w.wake();
  assert.equal(w.summaries.length, 2);
  assert.ok(w.summaries.every(row => row.status === 200 && row.body.enviats === 3));
  assert.equal(w.providerCalls.filter(call => call.provider === 'oauth').length, 1);
  const apns = w.providerCalls.filter(call => call.provider === 'apns');
  assert.ok(apns[0].jwt === apns[1].jwt, 'same cached APNs token reused');
  assert.equal(w.credentials.length, 2);
  w.assertPrivate(result);
});

test('R21.2 APNs sandbox is selected explicitly while topic and alert wire contract remain verified', async () => {
  const w = world({ envPatch: { SDP_APNS_ENTORN: 'sandbox' } });
  w.enqueue([devices()[1]]); const result = await w.wake();
  assert.equal(w.summaries[0].body.enviats, 1);
  assert.deepEqual(w.providerCalls.map(call => call.provider), ['apns']);
  w.assertPrivate(result);
});

test('R21.2 provider expiry, token rejection and temporary outage produce distinct lease ACK outcomes', async () => {
  const w = world({ statuses: { web: 410, apns: { status: 400, body: { reason: 'DeviceTokenNotForTopic' } },
    fcm: { status: 503, body: { error: { status: 'UNAVAILABLE' } } } } });
  const batch = w.enqueue(); const result = await w.wake();
  assert.equal(w.summaries[0].body.expulsats, 1);
  assert.equal(w.summaries[0].body.enviats, 0);
  const expected = ['expulsa', 'reintenta', 'reintenta'];
  assert.deepEqual(w.acks.sort((a, b) => a.id.localeCompare(b.id)), batch.flatMap((row, i) => row.lliuraments.map(claim => ({ ...claim, resultat: expected[i] }))));
  w.assertPrivate(result);
});

test('R21.2 missing all provider material keeps registrations eligible for retry without claiming delivery', async () => {
  const w = world({ envPatch: { SDP_PUSH_VAPID_PUBLICA: '', SDP_APNS_EQUIP: '', SDP_APNS_CLAU_ID: '', SDP_APNS_CLAU_P8: '', SDP_FCM_COMPTE_SERVEI: '' } });
  w.enqueue(); const result = await w.wake();
  assert.equal(w.summaries[0].body.sense_proveidor, 3);
  assert.equal(w.summaries[0].body.enviats, 0);
  assert.equal(w.providerCalls.length, 0);
  assert.ok(w.acks.every(row => row.resultat === 'reintenta'));
  w.assertPrivate(result);
});

test('R21.2 invalid Auth, unclaimed committed message and disabled server switch never run a provider', async t => {
  for (const [name, options, status] of [['Auth rejected', { authenticated: false }, 401], ['no current wake claim', { shouldWake: false }, 202], ['server switch disabled', { active: false }, 202]]) {
    await t.test(name, async () => {
      const w = world(options); w.enqueue(); const result = await w.wake();
      assert.equal(result.status, status);
      assert.equal(w.summaries.length, 0);
      assert.equal(w.providerCalls.length, 0);
      assert.equal(w.calls.filter(call => call.url.endsWith('/xat_push_reclama_v2')).length, 0);
      w.assertPrivate(result);
    });
  }
});

test('R21.2 caller cannot add worker authority, expected actor or payload to relay request', async () => {
  for (const extra of [{ p_usuari_esperat: id(99) }, { 'x-sdp-cron': CRON }, { text: 'private-message-must-not-travel' }, { lease: id(55) }]) {
    const w = world(), result = await w.wake({ missatgeId: MESSAGE, ...extra });
    assert.equal(result.status, 400);
    assert.equal(w.calls.length, 0);
    assert.equal(w.pending.length, 0);
    w.assertPrivate(result);
  }
});

test('R21.2 malformed lease capability is never sent to any provider or acknowledged', async () => {
  const w = world();
  const batch = w.enqueue(); batch[0].lliuraments[0].lease = 'malformed';
  const result = await w.wake();
  assert.equal(w.summaries[0].body.sense_provar, 1);
  assert.equal(w.summaries[0].body.enviats, 2);
  assert.equal(w.providerCalls.filter(call => call.provider === 'web').length, 0);
  assert.equal(w.acks.length, 2);
  w.assertPrivate(result);
});
