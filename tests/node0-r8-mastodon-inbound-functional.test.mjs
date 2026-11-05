import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaMastodonInboundPeriodic, LIMITS_MASTODON_INBOUND, normalitzaMastodonInbound } from '../tooling/node0/mastodon-inbound-periodic-node0.mjs';

let sourceRoot = new URL('../', import.meta.url);
for (let depth = 0; depth < 8 && !fs.existsSync(new URL('tooling/node0/hidrata-postgres-node0.mjs', sourceRoot)); depth++) sourceRoot = new URL('../', sourceRoot);
assert.ok(fs.existsSync(new URL('tooling/node0/hidrata-postgres-node0.mjs', sourceRoot)), 'source repository is available above the isolated fixture');
// Execute the exact server integration copy without writing to root source or
// binding a socket. Resolve its unchanged imports against the source repository.
const serverCandidate = new URL('../tooling/node0/servidor-node0-soberania.mjs', import.meta.url);
const serverOriginal = new URL('tooling/node0/servidor-node0-soberania.mjs', sourceRoot);
const serverModule = fs.readFileSync(serverCandidate, 'utf8').replace(/(\bfrom\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (_match, prefix, quote, relative) =>
  prefix + quote + new URL(relative, relative === './mastodon-inbound-periodic-node0.mjs' ? serverCandidate : serverOriginal).href + quote);
const { creaServidor } = await import('data:text/javascript;base64,' + Buffer.from(serverModule).toString('base64'));
const BASE = Date.parse('2026-11-04T23:00:00Z'), ACTOR = 'https://mastodont.cat/users/depoble';
const account = { id: '42', username: 'depoble', acct: 'depoble', url: 'https://mastodont.cat/@depoble', uri: ACTOR };
const status = (id, patch = {}) => ({ id, uri: `${ACTOR}/statuses/${id}`, url: `https://mastodont.cat/@depoble/${id}`, account,
  visibility: 'public', created_at: '2026-11-04T22:00:00Z', content: '<p>Synthetic public status</p>', reblog: null, ...patch });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const flush = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve)); };
function clock() {
  let at = BASE, sequence = 0; const jobs = new Map();
  return {
    now: () => at,
    timers: {
      setTimeout(fn, delay) { const handle = { id: ++sequence, at: at + delay, fn, unref() {} }; jobs.set(handle.id, handle); return handle; },
      clearTimeout(handle) { jobs.delete(handle?.id); }
    },
    pending: () => jobs.size,
    nextDelay() { const next = [...jobs.values()].sort((a, b) => a.at - b.at || a.id - b.id)[0]; return next ? next.at - at : null; },
    fireNext() {
      const next = [...jobs.values()].sort((a, b) => a.at - b.at || a.id - b.id)[0];
      assert.ok(next, 'a scheduled automatic tick exists'); jobs.delete(next.id); at = next.at; return next.fn();
    }
  };
}
function api({ id = '123' } = {}) {
  const reads = []; let mode = 'public';
  return {
    reads, setMode(value) { mode = value; },
    async fetchImpl(url, options) {
      reads.push(url);
      assert.equal(options.method, 'GET'); assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
      assert.equal(options.body, undefined); assert.ok(!Object.keys(options.headers).some(key => /authorization|cookie/i.test(key)));
      assert.equal(new URL(url).origin, 'https://mastodont.cat');
      if (url.includes('/.well-known/webfinger?')) return Response.json({ subject: 'acct:depoble@mastodont.cat', links: [{ rel: 'self', type: 'application/activity+json', href: ACTOR }] });
      if (url.endsWith('/api/v1/accounts/lookup?acct=depoble')) return Response.json(account);
      if (url.includes('/api/v1/accounts/42/statuses?')) return Response.json(mode === 'public' && !url.includes('&max_id=') ? [status(id)] : []);
      assert.equal(url, `https://mastodont.cat/api/v1/statuses/${id}`);
      if (mode === 'missing') return Response.json({ error: 'Record not found' }, { status: 404 });
      if (mode === 'private') return Response.json(status(id, { visibility: 'private', content: '<p>Synthetic private body</p>' }));
      return Response.json(status(id));
    }
  };
}
const emptyDb = () => ({ async query(sql) { return sql.startsWith('SELECT coalesce(jsonb_agg') ? [] : { saved: 0, retired: 0 }; } });

test('automatic start is immediate and idempotent, success schedules five minutes, status is sanitized', async () => {
  const time = clock(), source = api();
  const controller = creaMastodonInboundPeriodic({ db: emptyDb(), fetchImpl: source.fetchImpl, now: time.now, timers: time.timers });
  assert.deepEqual(controller.status(), { enabled: false, lastSuccess: null, errorCode: null });
  assert.equal(controller.start(), true); assert.equal(controller.start(), false); assert.equal(time.pending(), 1);
  assert.equal(time.nextDelay(), 0); await time.fireNext(); await flush();
  assert.equal(time.nextDelay(), LIMITS_MASTODON_INBOUND.intervalMs);
  assert.deepEqual(controller.status(), { enabled: true, lastSuccess: new Date(BASE).toISOString(), errorCode: null });
  assert.deepEqual(normalitzaMastodonInbound({ enabled: true, lastSuccess: 'bad', errorCode: 'synthetic confidential diagnostic', extra: 'not public' }),
    { enabled: true, lastSuccess: null, errorCode: 'mastodon_inbound_status_unavailable' });
  await controller.stop(); await controller.stop(); assert.equal(time.pending(), 0); assert.equal(controller.status().enabled, false);
  assert.ok(source.reads.length > 0);
});

test('errors use capped backoff and a closed public code, then success restores the normal interval', async () => {
  const time = clock(), source = api(); let failing = true;
  const controller = creaMastodonInboundPeriodic({ db: emptyDb(), now: time.now, timers: time.timers,
    fetchImpl: (...args) => { if (failing) throw new Error('synthetic private diagnostic'); return source.fetchImpl(...args); } });
  controller.start();
  for (const delay of [600000, 1200000, 1800000, 1800000]) {
    await time.fireNext(); await flush();
    assert.equal(time.nextDelay(), delay); assert.equal(controller.status().errorCode, 'mastodon_inbound_unavailable');
    assert.equal(controller.status().lastSuccess, null);
  }
  failing = false; await time.fireNext(); await flush();
  assert.equal(time.nextDelay(), 300000); assert.equal(controller.status().errorCode, null); assert.ok(controller.status().lastSuccess);
  await controller.stop();
});

test('success is published only after the final local database transaction settles', async () => {
  const time = clock(), commit = deferred(), source = api(); let queries = 0;
  const controller = creaMastodonInboundPeriodic({ db: { async query(sql) {
    queries++; if (sql.startsWith('SELECT coalesce(jsonb_agg')) return [];
    await commit.promise; return { saved: 1, retired: 0 };
  } }, fetchImpl: source.fetchImpl, now: time.now, timers: time.timers });
  controller.start(); const first = time.fireNext(); await flush();
  assert.equal(queries, 2); assert.equal(controller.status().lastSuccess, null);
  const joined = controller.runNow(); assert.equal(queries, 2);
  commit.resolve(); await first; await joined; await flush();
  assert.equal(controller.status().lastSuccess, new Date(BASE).toISOString()); assert.equal(time.nextDelay(), 300000);
  await controller.stop();
});

test('an unresolved dependency keeps the slot after the deadline and cannot write a late plan', async () => {
  const time = clock(), gate = deferred(), source = api(); let calls = 0;
  const controller = creaMastodonInboundPeriodic({ db: { async query() { calls++; await gate.promise; return []; } }, fetchImpl: source.fetchImpl, now: time.now, timers: time.timers });
  controller.start(); const first = time.fireNext(); await flush(); assert.equal(calls, 1);
  const joined = controller.runNow(); assert.equal(calls, 1);
  time.fireNext(); await first; await assert.rejects(joined, { code: 'mastodon_inbound_timeout' });
  assert.equal(time.pending(), 0); assert.equal(controller.status().errorCode, 'mastodon_inbound_timeout');
  await assert.rejects(controller.runNow(), { code: 'mastodon_inbound_timeout' }); assert.equal(calls, 1);
  gate.resolve(); await flush(); assert.equal(calls, 1); assert.equal(source.reads.length, 0);
  assert.equal(time.nextDelay(), 600000); await controller.stop();
});

test('an actual GET that survives the inner plan deadline retains the single-flight slot', async () => {
  const time = clock(), response = deferred(); let fetches = 0, queries = 0;
  const controller = creaMastodonInboundPeriodic({ db: { async query() { queries++; return []; } },
    fetchImpl: () => { fetches++; return response.promise; }, now: time.now, timers: time.timers, networkDeadlineMs: 5 });
  controller.start(); await time.fireNext(); await flush();
  assert.equal(fetches, 1); assert.equal(queries, 1); assert.equal(time.pending(), 0);
  assert.equal(controller.status().errorCode, 'mastodon_inbound_unavailable');
  await assert.rejects(controller.runNow(), { code: 'mastodon_inbound_unavailable' });
  assert.equal(fetches, 1); assert.equal(queries, 1);
  response.resolve(Response.json({ subject: 'acct:depoble@mastodont.cat', links: [{ rel: 'self', type: 'application/activity+json', href: ACTOR }] }));
  await flush(); assert.equal(time.nextDelay(), 600000); assert.equal(queries, 1);
  await controller.stop();
});

test('actual response read and cancellation promises also retain the slot until both settle', async () => {
  const time = clock(), read = deferred(), cancel = deferred(); let queries = 0, cancellations = 0;
  const controller = creaMastodonInboundPeriodic({ db: { async query() { queries++; return []; } },
    fetchImpl: async () => ({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }),
      body: { getReader() { return { read: () => read.promise, cancel() { cancellations++; return cancel.promise; }, releaseLock() {} }; } } }),
    now: time.now, timers: time.timers, networkDeadlineMs: 5 });
  controller.start(); await time.fireNext(); await flush();
  assert.equal(queries, 1); assert.equal(cancellations, 1); assert.equal(time.pending(), 0);
  await assert.rejects(controller.runNow(), { code: 'mastodon_inbound_unavailable' });
  read.resolve({ done: true }); await flush(); assert.equal(time.pending(), 0);
  cancel.resolve(); await flush(); assert.equal(time.nextDelay(), 600000); assert.equal(queries, 1);
  await controller.stop();
});

test('stop drains its bounded visible run and a restart cannot overlap an old unresolved operation', async () => {
  const time = clock(), gate = deferred(), source = api(); let calls = 0;
  const controller = creaMastodonInboundPeriodic({ db: { async query(sql) { calls++; if (calls === 1) await gate.promise; return sql.startsWith('SELECT coalesce(jsonb_agg') ? [] : {}; } }, fetchImpl: source.fetchImpl, now: time.now, timers: time.timers });
  controller.start(); const first = time.fireNext(); await flush();
  const stopped = controller.stop(); time.fireNext(); await stopped; await first;
  assert.equal(controller.status().enabled, false); assert.equal(controller.status().errorCode, null);
  controller.start(); await time.fireNext(); assert.equal(calls, 1);
  gate.resolve(); await flush(); assert.equal(time.nextDelay(), 0);
  await time.fireNext(); await flush(); assert.equal(calls, 3); assert.ok(controller.status().lastSuccess);
  await controller.stop(); assert.equal(time.pending(), 0);
});

async function publicGet(server, route) {
  return new Promise(resolve => {
    let code;
    server.emit('request', { method: 'GET', url: route, headers: { host: '127.0.0.1' } }, {
      setHeader() {}, writeHead(statusCode) { code = statusCode; }, end(body) { resolve({ status: code, body: JSON.parse(body) }); }
    });
  });
}
const modulePath = process.env.SDP_PGLITE_MODULE;
test('scheduled explicit 404 removes the stored public status from the actual mur handler without manual sync', { skip: !modulePath && 'Set SDP_PGLITE_MODULE for synthetic local PostgreSQL proof' }, async () => {
  const { PGlite } = await import(pathToFileURL(modulePath).href);
  const pg = new PGlite(), time = clock(), source = api(); let controller;
  try {
    await pg.exec('CREATE SCHEMA node0; CREATE ROLE node0_runtime; CREATE TABLE node0.public_documents(kind text NOT NULL,id text NOT NULL,document jsonb NOT NULL,source_uri text,PRIMARY KEY(kind,id)); GRANT USAGE ON SCHEMA node0 TO node0_runtime; GRANT SELECT,INSERT,UPDATE,DELETE ON node0.public_documents TO node0_runtime;');
    await pg.exec(fs.readFileSync(new URL('tooling/node0/schema-node0.sql', sourceRoot), 'utf8')); await pg.exec('SET ROLE node0_runtime');
    const db = {
      async query(sql) { const results = await pg.exec(sql); const row = results.findLast(result => result.rows?.length)?.rows[0]; return row?.[Object.keys(row)[0]]; },
      async documents(kind) { return (await pg.query('SELECT document FROM node0.public_documents WHERE kind=$1 ORDER BY id', [kind])).rows.map(row => row.document); },
      async status() { return { ok: true, activitypub: {} }; }
    };
    controller = creaMastodonInboundPeriodic({ db, fetchImpl: source.fetchImpl, now: time.now, timers: time.timers });
    const server = creaServidor({ db, claus: { fingerprint: 'synthetic' }, mastodonInbound: controller, now: time.now });
    const before = await publicGet(server, '/api/v1/node0/status');
    assert.deepEqual(before.body.mastodon.inbound, { enabled: false, lastSuccess: null, errorCode: null });
    assert.equal(before.body.mastodon.outboundPublication, 'manual-confirmation');
    assert.equal((await publicGet(server, '/api/v1/node0/mur')).body.feedPosts.length, 0);
    controller.start(); await time.fireNext(); await flush();
    const first = await publicGet(server, '/api/v1/node0/mur'); assert.equal(first.status, 200); assert.equal(first.body.feedPosts[0].id, 'mastodon:123');
    const firstSuccess = controller.status().lastSuccess;
    const publicState = (await publicGet(server, '/api/v1/node0/status')).body.mastodon;
    assert.deepEqual(publicState.inbound, controller.status()); assert.equal(publicState.automaticSync, true); assert.equal(publicState.outboundConfigured, false);
    source.setMode('missing'); assert.equal(time.nextDelay(), 300000); await time.fireNext(); await flush();
    assert.equal((await publicGet(server, '/api/v1/node0/mur')).body.feedPosts.length, 0);
    assert.ok(controller.status().lastSuccess > firstSuccess); assert.equal(controller.status().errorCode, null);
    assert.ok(source.reads.includes('https://mastodont.cat/api/v1/statuses/123'));
    assert.equal((await pg.query('SELECT count(*)::int n FROM node0.tombstones WHERE id=$1', [`${ACTOR}/statuses/123`])).rows[0].n, 1);
    source.setMode('public'); await time.fireNext(); await flush();
    assert.equal((await publicGet(server, '/api/v1/node0/mur')).body.feedPosts.length, 0, 'permanent tombstone rejects later stale public pages');
  } finally { if (controller) await controller.stop(); await pg.close(); }
});

test('scheduled missing collection entries require individual public or visibility proof', { skip: !modulePath && 'Set SDP_PGLITE_MODULE for synthetic local PostgreSQL proof' }, async () => {
  const { PGlite } = await import(pathToFileURL(modulePath).href);
  const pg = new PGlite(), time = clock(), source = api({ id: '456' }); let controller;
  try {
    await pg.exec('CREATE SCHEMA node0; CREATE ROLE node0_runtime; CREATE TABLE node0.public_documents(kind text NOT NULL,id text NOT NULL,document jsonb NOT NULL,source_uri text,PRIMARY KEY(kind,id)); GRANT USAGE ON SCHEMA node0 TO node0_runtime; GRANT SELECT,INSERT,UPDATE,DELETE ON node0.public_documents TO node0_runtime;');
    await pg.exec(fs.readFileSync(new URL('tooling/node0/schema-node0.sql', sourceRoot), 'utf8')); await pg.exec('SET ROLE node0_runtime');
    const db = { async query(sql) { const results = await pg.exec(sql); const row = results.findLast(result => result.rows?.length)?.rows[0]; return row?.[Object.keys(row)[0]]; } };
    controller = creaMastodonInboundPeriodic({ db, fetchImpl: source.fetchImpl, now: time.now, timers: time.timers });
    controller.start(); await time.fireNext(); await flush();
    source.setMode('absent-page'); await time.fireNext(); await flush();
    assert.equal((await pg.query('SELECT count(*)::int n FROM node0.public_documents')).rows[0].n, 1);
    assert.equal((await pg.query('SELECT count(*)::int n FROM node0.tombstones')).rows[0].n, 0);
    source.setMode('private'); await time.fireNext(); await flush();
    assert.equal((await pg.query('SELECT count(*)::int n FROM node0.public_documents')).rows[0].n, 0);
    assert.equal((await pg.query('SELECT count(*)::int n FROM node0.tombstones')).rows[0].n, 1);
    assert.equal(JSON.stringify((await pg.query('SELECT * FROM node0.tombstones')).rows).includes('Synthetic private body'), false);
  } finally { if (controller) await controller.stop(); await pg.close(); }
});
