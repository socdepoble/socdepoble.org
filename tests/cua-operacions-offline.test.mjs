import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { creaMagatzemAtomicRural } from '../src/data/local/persistenciaLocalRural.js';
import {
  creaCuaOperacionsOffline, enqueueOfflineMutation, peekOfflineQueue,
  drainOfflineQueue, verifyOfflineQueueChain, reconciliaConflicteOffline,
  seguentRellotgeHLC, comparaRellotgesHLC,
} from '../src/data/local/cuaOperacionsOffline.js';

const abast = Object.freeze({ persona: 'anna', tenant: 'poble', endpoint: 'https://poble.example', mode: 'remote' });
const mutation = (title = 'Bàndol') => ({ resource: 'notes', recordId: 'nota-1', action: 'update', changes: { title } });
function fixture(options = {}) {
  const memoria = options.memoria ?? new Map();
  const queue = creaCuaOperacionsOffline({ abast, nodeId: 'aparell-A', motor: 'memoria', memoria, crypto: webcrypto, ara: () => 1000, ...options });
  return { queue, memoria };
}
const replay = (apply) => ({ capacitats: { idempotenciaOffline: true }, applyOfflineMutation: apply ?? (async (op) => ({ opId: op.opId, committed: true })) });
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };

test('cua durable: create/update/delete, descriptors limitats i reinici amb el mateix magatzem', async () => {
  const { queue, memoria } = fixture();
  for (const action of ['create', 'update', 'delete']) await enqueueOfflineMutation(queue, { ...mutation(), action, changes: action === 'delete' ? {} : { title: action } });
  const restarted = fixture({ memoria }).queue;
  const snapshot = await peekOfflineQueue(restarted);
  assert.deepEqual(snapshot.entries.map((x) => x.action), ['create', 'update', 'delete']);
  assert.deepEqual(snapshot.entries.map((x) => x.seq), [1, 2, 3]);
  assert.equal((await verifyOfflineQueueChain(restarted)).valid, true);
});

test('abast complet aïlla persona, tenant, endpoint i mode; el payload no pot substituir-lo', async () => {
  const { queue, memoria } = fixture();
  await queue.enqueueOfflineMutation(mutation());
  for (const [key, value] of [['persona', 'berta'], ['tenant', 'altre'], ['endpoint', 'https://altre.example'], ['mode', 'local']]) {
    const other = fixture({ memoria, abast: { ...abast, [key]: value } }).queue;
    assert.equal((await other.peekOfflineQueue()).entries.length, 0);
  }
  await assert.rejects(queue.enqueueOfflineMutation({ ...mutation(), abast: { ...abast, persona: 'berta' } }), { code: 'OFFLINE_INVALID_INPUT' });
});

test('un store injectat d’una altra persona es rebutja encara que estiga buit', () => {
  const store = creaMagatzemAtomicRural({ abast: { ...abast, persona: 'berta' }, motor: 'memoria', memoria: new Map() });
  assert.throws(() => fixture({ store }), { code: 'OFFLINE_INVALID_INPUT' });
});

test('scope que caduca mentre CAS confirma: no es lliura l’operació antiga al context nou', async () => {
  const memoria = new Map(); const backing = creaMagatzemAtomicRural({ abast, motor: 'memoria', memoria });
  const entered = deferred(); const release = deferred(); let current = true;
  const store = { abast: backing.abast, read: (...args) => backing.read(...args),
    compareAndSwap: async (...args) => { entered.resolve(); await release.promise; return backing.compareAndSwap(...args); } };
  const { queue } = fixture({ store, isScopeActive: () => current });
  const pending = queue.enqueueOfflineMutation(mutation());
  await entered.promise; current = false; release.resolve();
  // P3-CUA-05: el rebuig declara que el CAS ja s'havia confirmat.
  await assert.rejects(pending, { code: 'OFFLINE_SCOPE_INACTIVE', committed: true });
  // La intenció ja confirmada localment només pertany a l'àmbit antic.
  assert.equal((await fixture({ memoria }).queue.peekOfflineQueue()).entries.length, 1);
  assert.equal((await fixture({ memoria, abast: { ...abast, persona: 'berta' } }).queue.peekOfflineQueue()).entries.length, 0);
});

test('els objectes del caller i els snapshots retornats no són l’estat mutable de la cua', async () => {
  const { queue } = fixture();
  const op = mutation(); await queue.enqueueOfflineMutation(op); op.changes.title = 'canvi fora';
  const snapshot = await queue.peekOfflineQueue(); snapshot.entries[0].changes.title = 'canvi a la còpia';
  assert.equal((await queue.peekOfflineQueue()).entries[0].changes.title, 'Bàndol');
});

test('cadena SHA-256 rebutja canvi de payload, ordre, seqüència, àmbit i prevHash', async () => {
  const { queue } = fixture();
  await queue.enqueueOfflineMutation(mutation('u')); await queue.enqueueOfflineMutation(mutation('dos'));
  const initial = await queue.peekOfflineQueue();
  for (const tamper of [
    (s) => { s.entries[0].changes.title = 'alterat'; },
    (s) => { s.entries.reverse(); },
    (s) => { s.entries[0].seq += 1; },
    (s) => { s.entries[0].abast.persona = 'berta'; },
    (s) => { s.entries[1].prevHash = '0'.repeat(64); },
  ]) {
    const s = structuredClone(initial); tamper(s);
    assert.equal((await verifyOfflineQueueChain(s, { crypto: webcrypto })).valid, false);
  }
});

test('ack durable conserva l’àncora del hash i nextSeq després de retirar operacions enviades', async () => {
  const { queue, memoria } = fixture();
  const first = await queue.enqueueOfflineMutation(mutation('u'));
  await queue.enqueueOfflineMutation(mutation('dos'));
  const r = await queue.drainOfflineQueue(replay(), { maxOperations: 1 });
  assert.equal(r.acknowledged, 1);
  const restarted = fixture({ memoria }).queue;
  const s = await restarted.peekOfflineQueue();
  assert.deepEqual(s.ack, { seq: 1, hash: first.hash });
  assert.equal(s.entries[0].prevHash, first.hash);
  assert.equal((await restarted.enqueueOfflineMutation(mutation('tres'))).seq, 3);
  await restarted.drainOfflineQueue(replay());
  const empty = await restarted.peekOfflineQueue();
  assert.equal(empty.ack.seq, 3); assert.equal(empty.nextSeq, 4); assert.equal(empty.entries.length, 0);
  assert.equal((await restarted.verifyOfflineQueueChain()).valid, true);
});

test('el límit exacte del batch no anuncia pendents quan l’últim ack ja ha buidat la cua', async () => {
  const { queue } = fixture(); await queue.enqueueOfflineMutation(mutation());
  assert.deepEqual(await queue.drainOfflineQueue(replay(), { maxOperations: 1 }), { status: 'drained', acknowledged: 1 });
});

test('port sense idempotència o mètode de replay no rep cap crida', async () => {
  const { queue } = fixture(); await queue.enqueueOfflineMutation(mutation());
  let calls = 0;
  for (const port of [{ applyOfflineMutation: async () => { calls += 1; } }, { capacitats: { idempotenciaOffline: true } }]) {
    await assert.rejects(drainOfflineQueue(queue, port), { code: 'OFFLINE_IDEMPOTENCY_REQUIRED' });
  }
  assert.equal(calls, 0); assert.equal((await queue.peekOfflineQueue()).entries.length, 1);
});

test('reintent després d’ack perdut usa el mateix opId; el remot idempotent aplica un sol efecte', async () => {
  const { queue } = fixture(); const op = await queue.enqueueOfflineMutation(mutation());
  const ids = new Set(); let effects = 0; let calls = 0;
  const port = replay(async (incoming, options) => {
    calls += 1; assert.equal(options.idempotencyKey, incoming.opId); assert.deepEqual(options.scope, abast);
    if (!ids.has(incoming.opId)) { ids.add(incoming.opId); effects += 1; }
    if (calls === 1) throw new TypeError('network lost after commit');
    return { opId: incoming.opId, committed: true };
  });
  assert.equal((await queue.drainOfflineQueue(port)).status, 'retryable');
  assert.equal((await queue.peekOfflineQueue()).entries[0].opId, op.opId);
  assert.equal((await queue.drainOfflineQueue(port)).acknowledged, 1);
  assert.equal(effects, 1); assert.equal(calls, 2);
});

test('ack buit, d’un altre opId o amb committed fals no buida la cua', async () => {
  for (const ack of [undefined, {}, { opId: 'un-altre', committed: true }, { opId: 'un-altre', committed: false }]) {
    const { queue } = fixture(); await queue.enqueueOfflineMutation(mutation());
    const r = await queue.drainOfflineQueue(replay(async () => ack));
    assert.equal(r.status, 'blocked'); assert.equal((await queue.peekOfflineQueue()).entries.length, 1);
  }
});

// P3-CUA-03: el 409 ja no és una validació, sinó un conflicte amb via de resolució explícita.
for (const [status, kind] of [[400, 'validation'], [401, 'auth'], [403, 'auth'], [409, 'conflict'], [422, 'validation']]) {
  test(`HTTP ${status} és ${kind}, queda visible i no es tracta com una fallada de xarxa`, async () => {
    const { queue } = fixture(); await queue.enqueueOfflineMutation(mutation()); let calls = 0;
    const port = replay(async () => { calls += 1; throw Object.assign(new Error('secret del servidor'), { status }); });
    const result = await queue.drainOfflineQueue(port);
    assert.equal(result.status, 'blocked'); assert.equal(result.reason, kind);
    assert.equal(JSON.stringify(result).includes('secret'), false);
    await queue.drainOfflineQueue(port); assert.equal(calls, 1);
    assert.equal((await queue.peekOfflineQueue()).entries.length, 1);
  });
}

test('un error desconegut no és una desconnexió; status 503 sí que permet reintent explícit', async () => {
  for (const [error, status] of [[new Error('unknown'), 'blocked'], [Object.assign(new Error('server'), { status: 503 }), 'retryable']]) {
    const { queue } = fixture(); await queue.enqueueOfflineMutation(mutation());
    assert.equal((await queue.drainOfflineQueue(replay(async () => { throw error; }))).status, status);
  }
});

test('dues instàncies amb el mateix magatzem no envien simultàniament la mateixa fila viva', async () => {
  const { queue, memoria } = fixture(); const second = fixture({ memoria }).queue;
  await queue.enqueueOfflineMutation(mutation()); const started = deferred(); const finish = deferred(); let calls = 0;
  const port = replay(async (op) => { calls += 1; started.resolve(); await finish.promise; return { opId: op.opId, committed: true }; });
  const firstDrain = queue.drainOfflineQueue(port); await started.promise;
  assert.equal((await second.drainOfflineQueue(port)).status, 'busy');
  finish.resolve(); assert.equal((await firstDrain).acknowledged, 1); assert.equal(calls, 1);
});

test('dos drains de la mateixa instància comparteixen el treball; un enqueue en vol sobreviu a l’ack', async () => {
  const { queue } = fixture(); await queue.enqueueOfflineMutation(mutation('u'));
  const started = deferred(); const finish = deferred(); let calls = 0;
  const port = replay(async (op) => { calls += 1; if (calls === 1) { started.resolve(); await finish.promise; } return { opId: op.opId, committed: true }; });
  const first = queue.drainOfflineQueue(port); await started.promise;
  const same = queue.drainOfflineQueue(port); await queue.enqueueOfflineMutation(mutation('dos')); finish.resolve();
  assert.equal((await first).acknowledged, 2); assert.equal((await same).acknowledged, 2); assert.equal(calls, 2);
});

test('tancar l’àmbit durant replay avorta el signal i ignora l’ack tardà; la fila queda durable', async () => {
  const { queue, memoria } = fixture(); await queue.enqueueOfflineMutation(mutation());
  const start = deferred(); const done = deferred(); let signal;
  const draining = queue.drainOfflineQueue(replay(async (op, options) => { signal = options.signal; start.resolve(); await done.promise; return { opId: op.opId, committed: true }; }));
  await start.promise; queue.close(); assert.equal(signal.aborted, true); done.resolve();
  assert.equal((await draining).status, 'cancelled');
  await assert.rejects(queue.peekOfflineQueue(), { code: 'OFFLINE_SCOPE_INACTIVE' });
  assert.equal((await fixture({ memoria }).queue.peekOfflineQueue()).entries.length, 1);
});

test('HLC és monòton amb rellotge físic enrere i després d’un reinici', async () => {
  let time = 2000; const { queue, memoria } = fixture({ ara: () => time });
  const a = await queue.enqueueOfflineMutation(mutation('a')); time = 1000;
  const b = await queue.enqueueOfflineMutation(mutation('b'));
  const c = await fixture({ memoria, ara: () => 1 }).queue.enqueueOfflineMutation(mutation('c'));
  assert.equal(comparaRellotgesHLC(a.hlc, b.hlc), -1); assert.equal(comparaRellotgesHLC(b.hlc, c.hlc), -1);
  assert.deepEqual(seguentRellotgeHLC({ wallTime: 3, counter: 1, nodeId: 'A' }, { wallTime: 3, counter: 8, nodeId: 'B' }, 2, 'A'), { wallTime: 3, counter: 9, nodeId: 'A' });
});

test('enqueue concurrent preserva cada seqüència i la cadena amb CAS', async () => {
  const { queue, memoria } = fixture(); const other = fixture({ memoria }).queue;
  await Promise.all(Array.from({ length: 12 }, (_, i) => (i % 2 ? queue : other).enqueueOfflineMutation(mutation(String(i)))));
  const s = await queue.peekOfflineQueue();
  assert.deepEqual(s.entries.map((op) => op.seq), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.equal(new Set(s.entries.map((op) => op.opId)).size, 12);
  assert.equal((await verifyOfflineQueueChain(queue)).valid, true);
});

test('JSON d’usuari: accessors no s’executen; cicles, prototips, claus d’autoritat i tamany excessiu es rebutgen', async () => {
  const { queue } = fixture(); let touched = 0;
  const getter = {}; Object.defineProperty(getter, 'title', { enumerable: true, get() { touched += 1; return 'x'; } });
  const cycle = {}; cycle.x = cycle;
  for (const changes of [getter, cycle, new Date(), { title: undefined }, { title: Infinity }, JSON.parse('{"__proto__":{"admin":true}}'), { title: 'x'.repeat(200_000) }]) {
    await assert.rejects(queue.enqueueOfflineMutation({ ...mutation(), changes }));
  }
  await assert.rejects(queue.enqueueOfflineMutation({ ...mutation(), action: 'upsert' }));
  await assert.rejects(queue.enqueueOfflineMutation({ ...mutation(), autor: 'admin' }));
  assert.equal(touched, 0); assert.equal((await queue.peekOfflineQueue()).entries.length, 0);
});

test('sostres de cua i de text rebutgen sense persistir a mitges', async () => {
  const { queue } = fixture({ maxOperations: 1 }); await queue.enqueueOfflineMutation(mutation());
  await assert.rejects(queue.enqueueOfflineMutation(mutation('dos')), { code: 'OFFLINE_QUEUE_FULL' });
  assert.equal((await queue.peekOfflineQueue()).entries.length, 1);
  assert.equal((await verifyOfflineQueueChain('{malformed', { crypto: webcrypto })).valid, false);
});

const clock = (nodeId, counter = 0) => ({ wallTime: 1000, counter, nodeId });
const local = (changes = { title: 'local' }, version = { A: 2, B: 1 }, hlc = clock('A')) => ({ ...mutation(), changes, nodeId: 'A', seq: 2, opId: 'operation-a', version, hlc });
const remote = (values = { title: 'remote' }, version = { A: 1, B: 2 }, hlc = clock('B')) => ({ resource: 'notes', recordId: 'nota-1', values, version, hlc });

test('LWW determinista: empat HLC resol per nodeId; concurrència vectorial conserva còpia del text perdedor', () => {
  const result = reconciliaConflicteOffline(local(), remote());
  assert.equal(result.concurrent, true); assert.equal(result.record.values.title, 'remote');
  assert.equal(result.conflictCopy.values.title, 'local');
  assert.equal(result.conflictCopy.reason, 'concurrent');
});

test('ordre causal domina el rellotge; una edició seqüencial no fabrica un conflicte', () => {
  const r = reconciliaConflicteOffline(local({ title: 'nou' }, { A: 3, B: 2 }, clock('A')), remote({ title: 'vell' }, { A: 2, B: 2 }, { wallTime: 9999, counter: 0, nodeId: 'B' }));
  assert.equal(r.concurrent, false); assert.equal(r.record.values.title, 'nou'); assert.equal(r.conflictCopy, null);
});

test('sense vectors no es declara concurrència: còpia de seguretat amb causalitat desconeguda i revisió explícita', () => {
  const l = local({ title: 'a' }); const other = remote({ title: 'b' }); delete l.version; delete other.version;
  const r = reconciliaConflicteOffline(l, other);
  assert.equal(r.concurrent, false); assert.equal(r.needsReview, true); assert.equal(r.conflictCopy.reason, 'causality-unavailable');
});

test('una versió remota causalment posterior que ha retirat un camp no el repesca d’una operació antiga', () => {
  const r = reconciliaConflicteOffline(local({ title: 'retirat' }, { A: 1 }, clock('A', 8)), remote({}, { A: 2 }, clock('B')));
  assert.equal(r.causalRelation, 'before'); assert.equal(Object.hasOwn(r.record.values, 'title'), false);
});

test('termini de replay és fitat i avorta el transport sense ack ni timer recurrent', async () => {
  const { queue } = fixture({ timeoutMs: 5 }); await queue.enqueueOfflineMutation(mutation()); let signal;
  const r = await queue.drainOfflineQueue(replay(async (_op, options) => { signal = options.signal; return new Promise(() => {}); }));
  assert.equal(r.status, 'retryable'); assert.equal(signal.aborted, true);
  assert.equal((await queue.peekOfflineQueue()).entries.length, 1);
});

test('una lease interrompuda es pot reprendre amb rellotge físic enrere, sempre amb el mateix opId idempotent', async () => {
  let now = 1000; const { queue, memoria } = fixture({ ara: () => now }); const op = await queue.enqueueOfflineMutation(mutation());
  const begun = deferred(); const done = deferred();
  const drain = queue.drainOfflineQueue(replay(async (x) => { begun.resolve(); await done.promise; return { opId: x.opId, committed: true }; }));
  await begun.promise; queue.close(); done.resolve(); await drain; now = 1;
  const restarted = fixture({ memoria, ara: () => now }).queue; let seen;
  const r = await restarted.drainOfflineQueue(replay(async (x) => { seen = x.opId; return { opId: x.opId, committed: true }; }));
  assert.equal(r.acknowledged, 1); assert.equal(seen, op.opId);
});

test('comparació per camp conserva camps no editats i perdedors mixtos amb fieldClocks', () => {
  const l = local({ title: 'títol local', content: 'cos local' });
  l.fieldClocks = { title: clock('A', 3), content: clock('A', 1) };
  const r = remote({ title: 'títol remot', content: 'cos remot', extra: 'intacte' });
  r.fieldClocks = { title: clock('B', 2), content: clock('B', 2) };
  const result = reconciliaConflicteOffline(l, r);
  assert.deepEqual(result.record.values, { title: 'títol local', content: 'cos remot', extra: 'intacte' });
  assert.deepEqual(result.conflictCopy.values, { title: 'títol remot', content: 'cos local' });
});

test('LWW no muta entrades, no reinterpreta objectes com text i rebutja àmbits/recursos distints', () => {
  const l = local(); const r = remote(); const before = structuredClone([l, r]);
  reconciliaConflicteOffline(l, r); assert.deepEqual([l, r], before);
  assert.throws(() => reconciliaConflicteOffline(local({ title: {} }), r), { code: 'OFFLINE_RECONCILE_TEXT_ONLY' });
  assert.throws(() => reconciliaConflicteOffline(l, { ...r, recordId: 'altra' }), { code: 'OFFLINE_INVALID_INPUT' });
});

test('un delete perdedor concurrent es preserva explícitament encara que no porte camps textuals', () => {
  const l = local({}, { A: 2, B: 1 }, clock('A')); l.action = 'delete';
  const r = reconciliaConflicteOffline(l, remote());
  assert.equal(r.concurrent, true); assert.equal(r.record.deleted, false);
  assert.deepEqual(r.conflictCopy.values, {}); assert.equal(r.conflictCopy.deleted, true);
});

test('mateixa versió causal amb estat de delete diferent és inconsistent, no una nova edició concurrent', () => {
  const l = local({}, { A: 2 }); l.action = 'delete';
  assert.throws(() => reconciliaConflicteOffline(l, remote({}, { A: 2 })), { code: 'OFFLINE_CAUSAL_INCONSISTENCY' });
});

test('reconciliació sense identitat de recurs o registre es rebutja encara que els dos costats l’ometen', () => {
  for (const key of ['resource', 'recordId']) {
    const l = local(); const r = remote(); delete l[key]; delete r[key];
    assert.throws(() => reconciliaConflicteOffline(l, r), { code: 'OFFLINE_INVALID_INPUT' });
  }
});

/* Gauntlet O7-O9 (kit Codex O8-O9): P3-CUA-01, -02, -03 i -05. */
test('P3-CUA-01 · el vector d’una op sobre X no hereta el context observat en Y: còpia antiga contra remot {B:5} és concurrent', async () => {
  let now = 1000; const { queue } = fixture({ ara: () => now });
  await queue.enqueueOfflineMutation({ ...mutation('A a Y'), recordId: 'Y', causalContext: { B: 10 } });
  now += 1;
  const opX = await queue.enqueueOfflineMutation({ ...mutation('A a X'), recordId: 'X', causalContext: {} });
  assert.deepEqual(opX.version, { 'aparell-A': 2 });
  const r = reconciliaConflicteOffline(opX, { resource: 'notes', recordId: 'X', values: { title: 'B a X' }, version: { B: 5 }, hlc: { wallTime: 99_999, counter: 0, nodeId: 'B' } });
  assert.equal(r.causalRelation, 'concurrent'); assert.equal(r.record.values.title, 'B a X');
  assert.equal(r.conflictCopy.values.title, 'A a X');
  const posterior = await queue.enqueueOfflineMutation({ ...mutation('A després de B'), recordId: 'X', causalContext: { B: 5 } });
  assert.equal(reconciliaConflicteOffline(posterior, { resource: 'notes', recordId: 'X', values: { title: 'B a X' }, version: { B: 5 }, hlc: { wallTime: 99_999, counter: 0, nodeId: 'B' } }).causalRelation, 'after');
  assert.equal((await queue.verifyOfflineQueueChain()).valid, true);
});

test('P3-CUA-02 · un observedHlc verinós es rebutja amb OFFLINE_CLOCK_DRIFT i no inutilitza la cua', async () => {
  const { queue } = fixture();
  const MAX = Number.MAX_SAFE_INTEGER;
  for (const observedHlc of [{ wallTime: MAX, counter: MAX - 1, nodeId: 'B' }, { wallTime: 1000 + 300001, counter: 0, nodeId: 'B' }, { wallTime: 1000, counter: 2 ** 32, nodeId: 'B' }]) {
    await assert.rejects(queue.enqueueOfflineMutation({ ...mutation(), observedHlc }), { code: 'OFFLINE_CLOCK_DRIFT' });
  }
  assert.equal((await queue.peekOfflineQueue()).clock, null);
  const ok = await queue.enqueueOfflineMutation({ ...mutation(), observedHlc: { wallTime: 1000 + 300000, counter: 7, nodeId: 'B' } });
  assert.deepEqual(ok.hlc, { wallTime: 301000, counter: 8, nodeId: 'aparell-A' });
  assert.equal((await queue.enqueueOfflineMutation(mutation('després'))).seq, 2);
  assert.throws(() => seguentRellotgeHLC(null, { wallTime: 70_000, counter: 0, nodeId: 'B' }, 1000, 'A', { maxDriftMs: 60_000 }), { code: 'OFFLINE_CLOCK_DRIFT' });
  assert.throws(() => fixture({ maxDriftMs: -1 }), { code: 'OFFLINE_INVALID_INPUT' });
});

test('P3-CUA-03 · un 409 sobre X no reté Y i Z per sempre: resolució explícita, auditada i reconciliada', async () => {
  let now = 1000; const { queue } = fixture({ ara: () => now });
  const x = await queue.enqueueOfflineMutation({ ...mutation('local'), recordId: 'X' });
  await queue.enqueueOfflineMutation({ ...mutation('u'), recordId: 'Y' }); await queue.enqueueOfflineMutation({ ...mutation('d'), recordId: 'Z' });
  const remot = { resource: 'notes', recordId: 'X', values: { title: 'remot' }, hlc: { wallTime: 900, counter: 0, nodeId: 'B' }, version: { B: 3 } };
  const enviats = [];
  const port = replay(async op => {
    enviats.push(`${op.recordId}:${op.changes.title ?? ''}`);
    if (op.opId === x.opId) throw Object.assign(new Error('conflict'), { status: 409 });
    return { opId: op.opId, committed: true };
  });
  assert.deepEqual(await queue.drainOfflineQueue(port), { status: 'blocked', reason: 'conflict', acknowledged: 0 });
  await assert.rejects(queue.resolveBlockedHead({ opId: 'un-altre', outcome: 'superseded' }), { code: 'OFFLINE_NOT_BLOCKED' });
  await assert.rejects(queue.resolveBlockedHead({ opId: x.opId, outcome: 'esborra' }), { code: 'OFFLINE_INVALID_INPUT' });
  now = 2000;
  const retirada = await queue.resolveBlockedHead({ opId: x.opId, outcome: 'superseded' });
  assert.equal(retirada.opId, x.opId);
  const { record, conflictCopy } = reconciliaConflicteOffline(retirada, remot);
  // Concurrents ({aparell-A:1} contra {B:3}); guanya l'HLC local (1000 > 900) i el remot es conserva.
  assert.equal(record.values.title, 'local'); assert.equal(conflictCopy.values.title, 'remot');
  await queue.enqueueOfflineMutation({ ...mutation(record.values.title), recordId: 'X', causalContext: record.version, observedHlc: remot.hlc });
  const s = await queue.peekOfflineQueue();
  assert.equal(s.blocked, null);
  assert.deepEqual(s.resolved.map(r => [r.opId, r.kind, r.code, r.outcome, r.at]), [[x.opId, 'conflict', 'REMOTE_CONFLICT', 'superseded', 2000]]);
  assert.equal((await verifyOfflineQueueChain(queue)).valid, true);
  assert.equal((await queue.drainOfflineQueue(port)).status, 'drained');
  assert.deepEqual(enviats, ['X:local', 'Y:u', 'Z:d', `X:${record.values.title}`]);
  await assert.rejects(queue.resolveBlockedHead({ opId: x.opId, outcome: 'discarded' }), { code: 'OFFLINE_NOT_BLOCKED' });
  for (const bad of [{ ...s.resolved[0], seq: 9 }, { ...s.resolved[0], outcome: 'x' }, { ...s.resolved[0], extra: 1 }]) {
    assert.equal((await verifyOfflineQueueChain({ ...s, resolved: [bad] }, { crypto: webcrypto })).valid, false);
  }
});

test('P3-CUA-05 · un abort just després del CAS confirmat no informa de cancel·lació ni duplica la intenció', async () => {
  const memoria = new Map(); const backing = creaMagatzemAtomicRural({ abast, motor: 'memoria', memoria });
  const controller = new AbortController();
  const store = { abast: backing.abast, read: (...args) => backing.read(...args),
    compareAndSwap: async (...args) => { const ok = await backing.compareAndSwap(...args); controller.abort(); return ok; } };
  const { queue } = fixture({ store });
  const op = await queue.enqueueOfflineMutation(mutation(), { signal: controller.signal });
  const s = await fixture({ memoria }).queue.peekOfflineQueue();
  assert.deepEqual(s.entries.map(e => e.opId), [op.opId]);
});
