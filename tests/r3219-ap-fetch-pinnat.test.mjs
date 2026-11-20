import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { creaFetchPinnat } from '../supabase/functions/ap-inbox-verifica/fetchPinnat.js';
import { resolXarxaPublica, fetchAmbResolucioPublica } from '../supabase/functions/ap-inbox-verifica/cuaLliurament.js';
import { creaObtenidor, creaGestor } from '../supabase/functions/ap-inbox-verifica/gestor.js';
const REMOTE_URL = 'https://remote.example/document';
const dns = async (_h, t) => t === 'A' ? ['8.8.8.8'] : [];
const grant = () => resolXarxaPublica('remote.example', { resolDns: dns });
const call = async (transport, init = {}, proof = undefined) => fetchAmbResolucioPublica(REMOTE_URL, { redirect: 'manual', ...init }, { resolucio: proof ?? await grant(), fetchPinnat: transport, requereixPinDns: true });
function boundary({ status = 200, headers = {}, chunks = ['ok'], complete = true, error = null, inspect = () => {}, hang = false, event = null } = {}) {
  const state = { calls: 0, requestDestroyed: 0, responseDestroyed: 0, sentBody: null };
  const request = (url, options, onResponse) => {
    state.calls++; inspect(url, options); const out = new EventEmitter();
    out.destroy = () => { state.requestDestroyed++; };
    out.end = body => {
      state.sentBody = body;
      if (hang) return;
      queueMicrotask(() => {
        if (error) { out.emit('error', error); return; }
        const incoming = new EventEmitter(); incoming.statusCode = status; incoming.headers = headers; incoming.complete = complete;
        incoming.destroy = () => { state.responseDestroyed++; };
        onResponse(incoming);
        for (const chunk of chunks) incoming.emit('data', Buffer.from(chunk));
        if (event) incoming.emit(event); else incoming.emit('end');
      });
    };
    return out;
  };
  return { request, state };
}
test('R32.19 AP real HTTPS boundary: IP frozen, Host/TLS/SNI original, fresh socket, no DNS fallback', async () => {
  const answers = ['8.8.8.8'];
  const proof = await resolXarxaPublica('remote.example', { resolDns: async (_h, type) => type === 'A' ? answers : [] });
  const stub = boundary({ inspect: (url, options) => {
    answers[0] = '127.0.0.1'; assert.equal(url.hostname, 'remote.example');
    assert.equal(options.servername, 'remote.example'); assert.equal(options.rejectUnauthorized, true); assert.equal(options.hostname, '8.8.8.8'); assert.equal(options.family, 4); assert.equal(options.autoSelectFamily, false); assert.equal(options.headers.host, 'remote.example'); assert.equal(options.agent.keepAlive, false); assert.deepEqual(options.agent.options.proxyEnv, {}); assert.equal(options.agent.maxCachedSessions, 0); assert.equal(options.maxHeaderSize, 16384);
    options.lookup(url.hostname, { all: true }, (error, addresses) => { assert.ifError(error); assert.deepEqual(addresses, [{ address: '8.8.8.8', family: 4 }]); });
    options.lookup(url.hostname, {}, (error, ip, family) => { assert.ifError(error); assert.equal(ip, '8.8.8.8'); assert.equal(family, 4); });
    options.lookup('evil.example', {}, error => assert.match(error.message, /pin_host_invalida/));
  } });
  const response = await call(creaFetchPinnat(stub), {}, proof); assert.equal(await response.text(), 'ok'); assert.equal(stub.state.calls, 1);
});
test('R32.19 AP invalid/private/mixed-family DNS cannot dispatch or reuse one-use grant', async () => {
  const stub = boundary(), transport = creaFetchPinnat(stub);
  const proof = await grant(); await call(transport, {}, proof);
  await assert.rejects(call(transport, {}, proof), /dns_concessio_invalida/);
  for (const ip of ['127.0.0.1', '169.254.169.254', '::ffff:8.8.8.8', '2606:4700::1111%lo0']) {
    const bad = Object.freeze({ estat: 'publica', host: 'remote.example', adreces: Object.freeze([ip]) });
    await assert.rejects(transport(REMOTE_URL, { redirect: 'error' }, bad), /dns_concessio_invalida/);
  }
  for (const resolver of [async () => ['127.0.0.1'], async () => ['8.8.8.8'], async () => { throw Error('dns'); }]) {
    const bad = await resolXarxaPublica('remote.example', { resolDns: resolver });
    await assert.rejects(call(transport, {}, bad), /dns_concessio_invalida/);
  }
  assert.equal(stub.state.calls, 1);
});
test('R32.19 AP POST signs/transmits same bytes, cannot override Host or TLS or request framing', async () => {
  const stub = boundary();
  const body = '{"text":"à"}'; assert.equal(Buffer.byteLength(body), 13);
  // Compute from UTF8 bytes, not JS code units.
  const actual = boundary({ inspect: (_url, options) => { assert.equal(Number(options.headers['content-length']), Buffer.byteLength(body)); assert.equal(options.servername, 'remote.example'); assert.equal(options.rejectUnauthorized, true); } });
  await call(creaFetchPinnat(actual), { method: 'POST', headers: { signature: 'signed' }, body, rejectUnauthorized: false });
  assert.equal(actual.state.sentBody.toString('utf8'), body);
  for (const init of [{ headers: { host: 'evil.example' } }, { headers: { 'content-length': '999' }, method: 'POST', body }, { headers: { 'transfer-encoding': 'chunked' } }, { body: 'x' }, { method: 'PUT' }, { method: 'POST', body: 'x'.repeat(65537) }, { redirect: 'follow' }]) await assert.rejects(call(creaFetchPinnat(stub), init));
  assert.equal(stub.state.calls, 0);
});
test('R32.19 AP redirects never reconnect; TLS errors never fall back to fetch', async () => {
  for (const status of [301, 302, 307, 308]) {
    const stub = boundary({ status, headers: { location: 'https://127.0.0.1/private' } });
    await assert.rejects(call(creaFetchPinnat(stub)), /redireccio/); assert.equal(stub.state.calls, 1); assert.equal(stub.state.responseDestroyed, 1);
  }
  const stub = boundary({ error: Object.assign(Error('certificate host mismatch'), { code: 'ERR_TLS_CERT_ALTNAME_INVALID' }) });
  await assert.rejects(call(creaFetchPinnat(stub)), { code: 'ERR_TLS_CERT_ALTNAME_INVALID' }); assert.equal(stub.state.calls, 1);
});
test('R32.19 AP byte/header limits, incomplete body, no-body statuses and abort clean sockets', async () => {
  for (const options of [{ chunks: ['123', '456'] }, { headers: { 'content-length': '6' } }, { complete: false }, { event: 'aborted' }]) {
    const stub = boundary(options); await assert.rejects(call(creaFetchPinnat({ ...stub, maximBytes: 5 })), /pin_resposta_(?:limit|incompleta)/); assert.equal(stub.state.requestDestroyed, 1);
  }
  const noBody = await call(creaFetchPinnat(boundary({ status: 204, chunks: [] }))); assert.equal(noBody.status, 204); assert.equal(await noBody.text(), '');
  const controller = new AbortController(), stub = boundary({ hang: true });
  const pending = call(creaFetchPinnat(stub), { signal: controller.signal }); await new Promise(resolve => setImmediate(resolve)); controller.abort();
  await assert.rejects(pending, /temps/); assert.equal(stub.state.requestDestroyed, 1);
  const before = boundary(); await assert.rejects(call(creaFetchPinnat(before), { signal: controller.signal }), /temps/); assert.equal(before.state.calls, 0);
  const timeout = boundary({ hang: true }); await assert.rejects(call(creaFetchPinnat({ ...timeout, topallMs: 5 })), /temps/); assert.equal(timeout.state.requestDestroyed, 1);
});
test('R32.19 AP getter uses pinned transport end-to-end; flag remains off and Deno entry wires it', async () => {
  const document = { id: REMOTE_URL, type: 'Person', inbox: 'https://remote.example/inbox' };
  const stub = boundary({ headers: { 'content-type': 'application/activity+json' }, chunks: [JSON.stringify(document)] });
  const getter = creaObtenidor({ fetch: () => assert.fail('native fallback'), resolDns: dns, fetchPinnat: creaFetchPinnat(stub), requereixPinDns: true, ara: () => 1000 });
  assert.deepEqual(await getter.obtenDocument(REMOTE_URL), document); assert.equal(stub.state.calls, 1);
  const disabled = creaGestor({ env: {}, fetch: () => assert.fail('AP off dispatch') });
  assert.equal((await disabled(new Request('https://socdepoble.org/functions/v1/ap-inbox-verifica', { method: 'POST', body: '{}' }))).status, 404);
  const entry = readFileSync(new URL('../supabase/functions/ap-inbox-verifica/index.ts', import.meta.url), 'utf8');
  assert.match(entry, /fetchPinnat: creaFetchPinnat\(\), requereixPinDns: true/); assert.match(entry, /'SDP_AP_ACTIVA'/);
});
