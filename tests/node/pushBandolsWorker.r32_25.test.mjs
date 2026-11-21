/* R32.25: synthetic RPC/provider boundaries only; no real token or network. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaGestor, formaDelDispositiu } from '../../supabase/functions/notifica-xat/gestor.js';
import * as native from '../../supabase/functions/notifica-xat/natius.js';
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const address = 'synthetic_fcm_device_'.repeat(3);
const NOW = Date.parse('2026-11-21T09:00:00Z'); // 10:00 Madrid, winter.
function device(avis, n = 1) {
  return { id: id(1), tipus: 'fcm', adreca: address, llengua: 'ca', ...(avis === undefined ? {} : { avis }),
    lliuraments: [{ id: id(100 + n), lease: id(200 + n) }] };
}
/* Secret sintètic de prova (porta de literals: prefix TEST_ONLY_, ≥ 32 caràcters com exigix postcommit.js). */
const CRON_SINTETIC = 'TEST_ONLY_SYNTHETIC_CRON_SECRET_R32_25_WORKER';
async function run(rows, results = ['enviat'], active = true) {
  const sends = [], acks = [], logs = [], rpc = [];
  let pass = 0;
  const gestor = creaGestor({ env: { SUPABASE_URL: 'https://synthetic.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic_service',
    SDP_CRON_SECRET: CRON_SINTETIC, SDP_PUSH_ACTIU: active ? 'si' : 'no' }, ara: () => NOW,
    registre: Object.fromEntries(['info', 'warn', 'error'].map(k => [k, (...args) => logs.push(args.join(' '))])),
    fetch: async (url, options) => {
      const name = url.split('/').at(-1); rpc.push(name);
      if (name === 'xat_push_neteja') return Response.json({ dispositius: 0, cua: 0 });
      if (name === 'xat_push_reclama_v2') return Response.json(pass++ === 0
        ? { protocol: 'lease-v2', missatges: 1, treballs: rows.length, retallats: 0, dispositius: rows }
        : { protocol: 'lease-v2', missatges: 0, treballs: 0, retallats: 0, dispositius: [] });
      if (name === 'xat_push_confirma_v2') {
        acks.push(...JSON.parse(options.body).p_resultats); return Response.json({ expulsats: 0 });
      }
      throw Error('unexpected synthetic boundary');
    },
    creaEnviadorsNatius: async () => ({ fcm: async payload => { sends.push(payload); return { resultat: results[sends.length - 1] ?? results[0], estat: 200 }; } })
  });
  const response = await gestor(new Request('https://synthetic.invalid/worker', { method: 'POST', headers: { 'x-sdp-cron': CRON_SINTETIC } }));
  return { status: response.status, summary: await response.json(), sends, acks, logs, rpc };
}
test('one device, chat and urgent: independent sends and independent lease ACKs', async () => {
  const result = await run([device('xat'), device('urgent', 2)], ['enviat', 'reintenta']);
  assert.equal(result.status, 200);
  assert.equal(result.sends.length, 2);
  assert.deepEqual(result.sends[0], { tipus: 'fcm', adreca: address, llengua: 'ca' });
  assert.deepEqual(result.sends[1], { tipus: 'fcm', adreca: address, llengua: 'ca', avis: 'urgent' });
  assert.deepEqual(result.acks, [ { id: id(101), lease: id(201), resultat: 'acceptat' }, { id: id(102), lease: id(202), resultat: 'reintenta' } ]);
  for (const secret of [address, id(1), id(101), id(201)]) assert.ok(!JSON.stringify({ summary: result.summary, logs: result.logs }).includes(secret));
});
test('unknown channel, urgent web and duplicate same channel never send', async () => {
  assert.equal(formaDelDispositiu({ ...device('urgent'), tipus: 'web', adreca: 'https://web.push.apple.com/synthetic' }), null);
  assert.equal(formaDelDispositiu(device('digest')), null);
  assert.equal(formaDelDispositiu(device(null)), null);
  const result = await run([device('urgent'), device('urgent', 2), device('digest', 3)]);
  assert.equal(result.sends.length, 1);
  assert.equal(result.summary.sense_provar, 2);
  assert.equal(result.acks.length, 1);
});
test('old SQL rows preserve exact chat sender contract and disabled worker only cleans', async () => {
  const chat = await run([device(undefined)]);
  assert.deepEqual(chat.sends, [{ tipus: 'fcm', adreca: address, llengua: 'ca' }]);
  const off = await run([device('urgent')], ['enviat'], false);
  assert.deepEqual(off.rpc, ['xat_push_neteja']); assert.equal(off.sends.length, 0); assert.equal(off.acks.length, 0);
});
test('native urgent payload is fixed, private, distinct and bounded until Madrid 22:00', () => {
  const at = Date.parse('2026-11-21T20:30:00Z');
  const fcm = native.peticioFcm({ projecte: 'sdp-synthetic', testimoni: address, accessToken: 'synthetic', llengua: 'ca', avis: 'urgent', ara: at });
  const message = JSON.parse(fcm.opcions.body).message;
  assert.equal(message.notification.body, 'Avís urgent del teu ajuntament');
  assert.deepEqual(message.android, { priority: 'HIGH', ttl: '1800s', collapse_key: 'sdp-poble-urgent', notification: { tag: 'sdp-poble-urgent', channel_id: 'poble_urgent' } });
  assert.deepEqual(message.data, { desti: '/mur', avis: 'urgent' });
  const apns = native.peticioApns({ testimoni: 'ab'.repeat(32), jwt: 'synthetic', llengua: 'ca', avis: 'urgent', ara: at });
  assert.equal(apns.opcions.headers['apns-expiration'], String(at / 1000 + 1800));
  assert.equal(apns.opcions.headers['apns-collapse-id'], 'sdp-poble-urgent');
  assert.deepEqual(JSON.parse(apns.opcions.body), { aps: { alert: { title: 'Sóc de Poble', body: 'Avís urgent del teu ajuntament' }, sound: 'default', 'thread-id': 'sdp-poble-urgent' }, sdp: { v: 1, desti: '/mur', avis: 'urgent' } });
});
test('native constructors refuse quiet time, last <300s, unknown type, and preserve chat bytes', () => {
  for (const instant of ['2026-11-21T20:55:01Z', '2026-11-21T21:00:00Z', '2026-11-22T06:59:59Z']) {
    assert.equal(native.peticioFcm({ projecte: 'sdp-synthetic', testimoni: address, accessToken: 'synthetic', avis: 'urgent', ara: Date.parse(instant) }), null);
    assert.equal(native.peticioApns({ testimoni: 'ab'.repeat(32), jwt: 'synthetic', avis: 'urgent', ara: Date.parse(instant) }), null);
  }
  assert.equal(native.peticioFcm({ projecte: 'sdp-synthetic', testimoni: address, accessToken: 'synthetic', avis: 'digest', ara: NOW }), null);
  const chat = native.peticioApns({ testimoni: 'ab'.repeat(32), jwt: 'synthetic', llengua: 'ca', ara: NOW });
  assert.equal(chat.opcions.body, '{"aps":{"alert":{"title":"Sóc de Poble","body":"Tens missatges nous"},"badge":1,"sound":"default","thread-id":"sdp-xat"},"sdp":{"v":1,"desti":"/xat"}}');
  assert.equal(chat.opcions.headers['apns-expiration'], String(NOW / 1000 + 86400));
});

test('fractional milliseconds cannot extend urgent FCM lifetime into Madrid quiet time', () => {
  const at = Date.parse('2026-11-21T20:54:59.999Z');
  assert.equal(native.segonsFinsAlSilenci(at), 300);
  const fcm = native.peticioFcm({ projecte: 'sdp-synthetic', testimoni: address, accessToken: 'synthetic', avis: 'urgent', ara: at });
  assert.equal(JSON.parse(fcm.opcions.body).message.android.ttl, '300s');
  assert.ok(at + 300000 < Date.parse('2026-11-21T21:00:00Z'));
  for (const ms of [1, 500, 999]) {
    const instant = Date.parse('2026-11-21T20:55:00Z') + ms;
    assert.equal(native.peticioFcm({ projecte: 'sdp-synthetic', testimoni: address, accessToken: 'synthetic', avis: 'urgent', ara: instant }), null);
    assert.equal(native.peticioApns({ testimoni: 'ab'.repeat(32), jwt: 'synthetic', avis: 'urgent', ara: instant }), null);
  }
});

test('Madrid local clock gates summer, winter and both DST transition dates', () => {
  for (const [iso, expected] of [
    ['2026-07-21T05:59:59Z', 0], ['2026-07-21T06:00:00Z', 21600],
    ['2026-07-21T19:00:00Z', 3600], ['2026-07-21T20:00:00Z', 0],
    ['2026-11-21T06:59:59Z', 0], ['2026-11-21T07:00:00Z', 21600],
    ['2026-03-29T00:59:59Z', 0], ['2026-03-29T01:00:00Z', 0], ['2026-03-29T06:00:00Z', 21600],
    ['2026-10-25T00:59:59Z', 0], ['2026-10-25T01:00:00Z', 0], ['2026-10-25T07:00:00Z', 21600]
  ]) assert.equal(native.ttlUrgent(Date.parse(iso)), expected, iso);
  for (const bad of [NaN, Infinity, -Infinity, undefined, null, '2026-11-21', 8.64e15 + 1]) assert.equal(native.ttlUrgent(bad), 0);
});

test('real APNs/FCM senders revalidate quiet time after awaiting cached credentials', async () => {
  const subtle = globalThis.crypto.subtle;
  const ec = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const rsa = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const marker = ['PRIVATE', 'KEY'].join(' ');
  const pem = async key => `-----BEGIN ${marker}-----\n${Buffer.from(await subtle.exportKey('pkcs8', key)).toString('base64')}\n-----END ${marker}-----\n`;
  const env = { SDP_APNS_EQUIP: 'EQUIP12345', SDP_APNS_CLAU_ID: 'CLAU000001', SDP_APNS_CLAU_P8: await pem(ec.privateKey),
    SDP_FCM_COMPTE_SERVEI: JSON.stringify({ type: 'service_account', project_id: 'sdp-synthetic', client_email: 'prova@sdp-synthetic.iam.gserviceaccount.com', private_key: await pem(rsa.privateKey) }) };
  for (const tipus of ['apns', 'fcm']) {
    let instant = Date.parse('2026-11-21T20:54:00Z');
    let desbloqueja, entrada;
    const pendent = new Promise(resolve => { desbloqueja = resolve; });
    const llegint = new Promise(resolve => { entrada = resolve; });
    let intentsPush = 0;
    const enviadors = await native.creaEnviadorsNatius({ env, subtle, ara: () => instant, topallMs: 200,
      registre: { warn() {} },
      rpc: async nom => {
        if (nom === 'xat_push_credencial_v2') { entrada(); return pendent; }
        if (nom === 'xat_push_desa_credencial_v2') return true;
        throw Error('unexpected synthetic RPC');
      },
      fetch: async url => {
        if (url === native.FCM.TOKEN) return Response.json({ access_token: 'synthetic_access_'.repeat(4), expires_in: 3600 });
        intentsPush += 1;
        return new Response(null, { status: 200 });
      }
    });
    assert.equal(typeof enviadors[tipus], 'function');
    const resultat = enviadors[tipus]({ adreca: tipus === 'apns' ? 'ab'.repeat(32) : address, llengua: 'ca', avis: 'urgent' });
    await llegint;
    instant = Date.parse('2026-11-21T21:00:00Z');
    desbloqueja(null);
    assert.deepEqual(await resultat, { resultat: 'invalid', estat: 0 });
    assert.equal(intentsPush, 0, tipus + ': no push after 22:00');
  }
});

test('FCM chat payload stays byte-identical and never inherits urgent metadata', () => {
  const chat = native.peticioFcm({ projecte: 'sdp-synthetic', testimoni: address, accessToken: 'synthetic', llengua: 'ca', ara: NOW });
  assert.equal(chat.opcions.body, JSON.stringify({ message: { token: address, notification: { title: 'Sóc de Poble', body: 'Tens missatges nous' },
    android: { priority: 'HIGH', ttl: '86400s', collapse_key: 'sdp-xat', notification: { tag: 'sdp-xat', channel_id: 'xat' } }, data: { desti: '/xat' } } }));
  assert.doesNotMatch(chat.opcions.body, /urgent|poble_urgent|submission|lease|tenant|author/);
});
