/**
 * Cua rural opcional; no importa backendPort, no l'encén i no programa feina.
 * Una cadena SHA-256 acredita integritat, NO signatura, autenticitat o xifrat.
 * L'àncora ack és durable: llevar una fila confirmada no reinicia seq/prevHash.
 * El replay exigix idempotència remota per opId. Una lease CAS evita enviaments
 * simultanis normals; expirar-la pot repetir una petició que el servidor ja
 * ha aplicat. No s'afirma exactly-once ni que LWW siga un CRDT complet.
 */
import { creaMagatzemAtomicRural, copiaJsonRural, normalitzaAbastRural } from './persistenciaLocalRural.js';

export const ESQUEMA_CUA_OFFLINE = 'sdp.cua-offline.v1';
const ESQUEMA_OP = 'sdp.mutacio-offline.v1';
const GENESI = '0'.repeat(64);
const MAX = Number.MAX_SAFE_INTEGER;
const MAX_OP_BYTES = 128 * 1024;
const MAX_STATE_BYTES = 4 * 1024 * 1024;
/** Fita ε de deriva HLC: un rellotge observat més enllà es rebutja, no s'adopta. */
export const MAX_DERIVA_HLC_MS = 300000;
const MAX_COMPTADOR_OBSERVAT = 0xFFFFFFFF;
const BLOCKED_KINDS = ['auth', 'validation', 'conflict', 'protocol', 'unexpected'];
const STATE_KEYS = ['schema', 'revision', 'abast', 'nodeId', 'clock', 'context', 'nextSeq', 'ack', 'entries', 'inflight', 'blocked'];
const MAX_RESOLVED = 64;
const contextos = new WeakMap();
const encoder = new TextEncoder();
const err = (code) => Object.assign(new Error(code), { code });
const invalid = () => err('OFFLINE_INVALID_INPUT');
const enter = (n, min = 0, max = MAX) => Number.isSafeInteger(n) && n >= min && n <= max;
const esObjecte = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const idValid = v => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
function json(value, limit = MAX_STATE_BYTES) {
  try { return copiaJsonRural(value, limit); } catch { throw invalid(); }
}
function keys(value, allowed, required = allowed) {
  if (!esObjecte(value) || Object.keys(value).some(k => !allowed.includes(k)) || required.some(k => !Object.hasOwn(value, k))) throw invalid();
}
function recordId(v) {
  if (typeof v !== 'string' || v.length < 1 || v.length > 256 || v !== v.trim()
      || /[\u0000-\u001f\u007f/\\]/.test(v) || v === '.' || v === '..') throw invalid();
  return v;
}
function vector(v) {
  if (!esObjecte(v) || Object.keys(v).length > 64) throw invalid();
  for (const [node, n] of Object.entries(v)) if (!idValid(node) || !enter(n)) throw invalid();
  return v;
}
function clock(v) {
  keys(v, ['wallTime', 'counter', 'nodeId']);
  if (!enter(v.wallTime) || !enter(v.counter) || !idValid(v.nodeId)) throw invalid();
  return v;
}
function unionVector(a, b) {
  const out = {};
  for (const node of new Set([...Object.keys(a), ...Object.keys(b)])) out[node] = Math.max(a[node] ?? 0, b[node] ?? 0);
  return vector(json(out));
}

/** HLC receive/tick pur. El rellotge físic pot recular; el lògic no. Un observat
 * més enllà de physicalTime + maxDriftMs, o amb un comptador > 2^32-1, es rebutja
 * (OFFLINE_CLOCK_DRIFT): no enverina el rellotge durable ni esgota la cua. */
export function seguentRellotgeHLC(local, observed, physicalTime, nodeId, { maxDriftMs = MAX_DERIVA_HLC_MS } = {}) {
  if (!enter(physicalTime) || !idValid(nodeId) || !enter(maxDriftMs, 0, 86400000)) throw invalid();
  const l = local == null ? null : clock(json(local));
  const r = observed == null ? null : clock(json(observed));
  if (r && (r.wallTime > physicalTime + maxDriftMs || r.counter > MAX_COMPTADOR_OBSERVAT)) throw err('OFFLINE_CLOCK_DRIFT');
  const wallTime = Math.max(physicalTime, l?.wallTime ?? 0, r?.wallTime ?? 0);
  let counter = 0;
  if (l?.wallTime === wallTime && r?.wallTime === wallTime) counter = Math.max(l.counter, r.counter) + 1;
  else if (l?.wallTime === wallTime) counter = l.counter + 1;
  else if (r?.wallTime === wallTime) counter = r.counter + 1;
  if (!enter(counter)) throw err('OFFLINE_CLOCK_EXHAUSTED');
  return { wallTime, counter, nodeId };
}

/** Ordre total estable, sense localeCompare ni inferència de concurrència. */
export function comparaRellotgesHLC(a, b) {
  const x = clock(json(a)); const y = clock(json(b));
  for (const k of ['wallTime', 'counter', 'nodeId']) {
    if (x[k] < y[k]) return -1;
    if (x[k] > y[k]) return 1;
  }
  return 0;
}

function relacioCausal(a, b) {
  if (a == null || b == null || !Object.keys(a).length || !Object.keys(b).length) return 'unknown';
  vector(a); vector(b);
  let greater = false; let less = false;
  for (const node of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if ((a[node] ?? 0) > (b[node] ?? 0)) greater = true;
    if ((a[node] ?? 0) < (b[node] ?? 0)) less = true;
  }
  return greater && less ? 'concurrent' : greater ? 'after' : less ? 'before' : 'equal';
}

/**
 * Reconciliació pura de camps textuals. Els vectors, no el timestamp, proven
 * causalitat/concurrència. Sense vectors es preserva el perdedor per revisió
 * amb «causality-unavailable», sense etiquetar-lo com a concurrent.
 * Input remot: {resource,recordId,values,hlc,version?,fieldClocks?,deleted?}.
 * Les operacions create/update/delete mantenen identitat; delete concurrent
 * es resol al nivell del registre i conserva els textos de la part perdedora.
 */
export function reconciliaConflicteOffline(localOp, remoteRecord) {
  const local = json(localOp, MAX_OP_BYTES); const remote = json(remoteRecord, MAX_OP_BYTES);
  if (!esObjecte(local) || !esObjecte(remote) || typeof local.resource !== 'string'
      || !/^[a-z][a-z0-9_.-]{0,127}$/.test(local.resource) || local.resource !== remote.resource
      || local.recordId !== remote.recordId || !['create', 'update', 'delete'].includes(local.action)
      || !esObjecte(local.changes) || !esObjecte(remote.values)) throw invalid();
  recordId(local.recordId); recordId(remote.recordId);
  if (remote.deleted != null && typeof remote.deleted !== 'boolean') throw invalid();
  if (local.abast != null && remote.abast != null && !igual(json(local.abast), json(remote.abast))) throw invalid();
  const lClock = clock(local.hlc); const rClock = clock(remote.hlc);
  for (const val of Object.values(local.changes)) if (typeof val !== 'string') throw err('OFFLINE_RECONCILE_TEXT_ONLY');
  const relation = relacioCausal(local.version, remote.version);
  const concurrent = relation === 'concurrent';
  const needsReview = relation === 'unknown';
  const record = json(remote);
  const losses = {};
  let deletionLoss = null;
  const localWins = relation === 'after' || (relation !== 'before' && comparaRellotgesHLC(lClock, rClock) > 0);
  if (relation === 'equal' && ((local.action === 'delete') !== (remote.deleted === true)
      || Object.entries(local.changes).some(([k, v]) => remote.values[k] !== v))) throw err('OFFLINE_CAUSAL_INCONSISTENCY');
  const fields = local.fieldClocks == null ? {} : json(local.fieldClocks);
  const remoteFields = remote.fieldClocks == null ? {} : json(remote.fieldClocks);
  if (!esObjecte(fields) || !esObjecte(remoteFields)) throw invalid();
  record.fieldClocks = remoteFields;
  if (local.action === 'delete' || remote.deleted === true) {
    record.deleted = localWins ? local.action === 'delete' : remote.deleted === true;
    if ((concurrent || needsReview) && (local.action === 'delete') !== (remote.deleted === true)) {
      const loser = localWins ? remote.values : local.changes;
      for (const [key, value] of Object.entries(loser)) if (typeof value === 'string') losses[key] = value;
      deletionLoss = localWins ? remote.deleted === true : local.action === 'delete';
    }
    if (localWins && local.action !== 'delete') {
      for (const [key, value] of Object.entries(local.changes)) record.values[key] = value;
    }
  } else {
    for (const [key, value] of Object.entries(local.changes)) {
      const present = Object.hasOwn(remote.values, key);
      if (present && typeof remote.values[key] !== 'string') throw err('OFFLINE_RECONCILE_TEXT_ONLY');
      const lc = fields[key] == null ? lClock : clock(fields[key]);
      const rc = remoteFields[key] == null ? rClock : clock(remoteFields[key]);
      const wins = relation === 'after' || (relation !== 'before' && (!present || comparaRellotgesHLC(lc, rc) > 0));
      if (wins) { record.values[key] = value; record.fieldClocks[key] = lc; }
      if ((concurrent || needsReview) && present && remote.values[key] !== value) losses[key] = wins ? remote.values[key] : value;
    }
  }
  record.hlc = comparaRellotgesHLC(lClock, rClock) > 0 ? lClock : rClock;
  if (local.version != null && remote.version != null) record.version = unionVector(local.version, remote.version);
  const conflictCopy = Object.keys(losses).length || deletionLoss !== null ? {
    resource: local.resource, recordId: local.recordId, values: losses,
    reason: concurrent ? 'concurrent' : 'causality-unavailable', localHlc: lClock, remoteHlc: rClock,
    ...(deletionLoss !== null ? { deleted: deletionLoss } : {}),
  } : null;
  return { record, concurrent, needsReview, causalRelation: relation, conflictCopy };
}

function cryptoFor(value) {
  if (!value?.subtle?.digest || typeof value.randomUUID !== 'function') throw err('OFFLINE_CRYPTO_UNAVAILABLE');
  return value;
}
async function digest(crypto, body) {
  const bytes = encoder.encode(JSON.stringify(json(body, MAX_OP_BYTES)));
  const sha = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(sha), b => b.toString(16).padStart(2, '0')).join('');
}
const hashValid = h => typeof h === 'string' && /^[a-f0-9]{64}$/.test(h);
function withoutHash(op) { const body = json(op, MAX_OP_BYTES); delete body.hash; return body; }
function blank(ctx) {
  return { schema: ESQUEMA_CUA_OFFLINE, revision: 0, abast: json(ctx.abast), nodeId: ctx.nodeId,
    clock: null, context: {}, nextSeq: 1, ack: { seq: 0, hash: GENESI }, entries: [], inflight: null, blocked: null };
}
function schemaState(value) {
  keys(value, [...STATE_KEYS, 'resolved'], STATE_KEYS);
  if (value.schema !== ESQUEMA_CUA_OFFLINE || !enter(value.revision) || !idValid(value.nodeId)
      || !enter(value.nextSeq, 1) || !Array.isArray(value.entries) || value.entries.length > 1000) throw invalid();
  normalitzaAbastRural(value.abast);
  if (value.clock != null && clock(value.clock).nodeId !== value.nodeId) throw invalid();
  vector(value.context);
  keys(value.ack, ['seq', 'hash']);
  if (!enter(value.ack.seq) || !hashValid(value.ack.hash) || (value.ack.seq === 0 && value.ack.hash !== GENESI)) throw invalid();
  if (value.nextSeq !== value.ack.seq + value.entries.length + 1) throw invalid();
  if ((value.context[value.nodeId] ?? 0) !== value.nextSeq - 1 || value.nextSeq > 1 && value.clock == null) throw invalid();
  if (value.inflight != null) {
    keys(value.inflight, ['opId', 'leaseId', 'claimedAt', 'expiresAt']);
    if (!idValid(value.inflight.opId) || !idValid(value.inflight.leaseId) || !enter(value.inflight.expiresAt)
        || !enter(value.inflight.claimedAt) || value.inflight.expiresAt <= value.inflight.claimedAt
        || value.entries[0]?.opId !== value.inflight.opId) throw invalid();
  }
  if (value.blocked != null) {
    keys(value.blocked, ['opId', 'kind', 'code']);
    if (!idValid(value.blocked.opId) || !BLOCKED_KINDS.includes(value.blocked.kind)
        || !idValid(value.blocked.code) || value.entries[0]?.opId !== value.blocked.opId) throw invalid();
  }
  // Registre fitat de caps retirats per decisió explícita (resolveBlockedHead): mai confirmats pel servidor.
  if (value.resolved != null) {
    if (!Array.isArray(value.resolved) || value.resolved.length > MAX_RESOLVED) throw invalid();
    let last = 0;
    for (const r of value.resolved) {
      keys(r, ['opId', 'seq', 'hash', 'kind', 'code', 'outcome', 'at']);
      if (!idValid(r.opId) || !enter(r.seq, 1) || r.seq <= last || r.seq > value.ack.seq || !hashValid(r.hash)
          || !BLOCKED_KINDS.includes(r.kind) || !idValid(r.code) || !['superseded', 'discarded'].includes(r.outcome) || !enter(r.at)) throw invalid();
      last = r.seq;
    }
  }
}
function schemaOp(op, state, seq, prev) {
  keys(op, ['schema', 'opId', 'nodeId', 'seq', 'abast', 'resource', 'recordId', 'action', 'changes',
    'baseVersion', 'context', 'version', 'hlc', 'fieldClocks', 'prevHash', 'hash']);
  if (op.schema !== ESQUEMA_OP || !idValid(op.opId) || op.nodeId !== state.nodeId || op.seq !== seq
      || !igual(op.abast, state.abast) || op.prevHash !== prev || !hashValid(op.hash)
      || typeof op.resource !== 'string' || !/^[a-z][a-z0-9_.-]{0,127}$/.test(op.resource)
      || !['create', 'update', 'delete'].includes(op.action) || !esObjecte(op.changes)) throw invalid();
  recordId(op.recordId); clock(op.hlc); vector(op.context); vector(op.version);
  if (op.hlc.nodeId !== state.nodeId || op.version[state.nodeId] !== op.seq || !esObjecte(op.fieldClocks)
      || (op.baseVersion !== null && !enter(op.baseVersion) && !(typeof op.baseVersion === 'string' && op.baseVersion.length <= 128))) throw invalid();
  if (op.action === 'delete' && Object.keys(op.changes).length) throw invalid();
  if ((op.context[state.nodeId] ?? 0) !== op.seq - 1 || !igual(op.version, unionVector(op.context, { [state.nodeId]: op.seq }))) throw invalid();
  for (const c of Object.values(op.fieldClocks)) clock(c);
}

/** Verificació fitada, sense mutació, arrelada a l’ack durable conegut. */
export async function verifyOfflineQueueChain(queueOrState, { crypto = globalThis.crypto } = {}) {
  try {
    const ctx = contextos.get(queueOrState);
    const state = ctx ? await readState(ctx) : json(queueOrState);
    const c = cryptoFor(ctx?.crypto ?? crypto);
    schemaState(state);
    let seq = state.ack.seq; let previous = state.ack.hash; let previousClock = null;
    const ids = new Set();
    for (const op of state.entries) {
      seq += 1; schemaOp(op, state, seq, previous);
      if (ids.has(op.opId) || previousClock && comparaRellotgesHLC(previousClock, op.hlc) >= 0
          || await digest(c, withoutHash(op)) !== op.hash) throw invalid();
      ids.add(op.opId); previous = op.hash; previousClock = op.hlc;
    }
    if (previousClock && (!state.clock || comparaRellotgesHLC(previousClock, state.clock) !== 0
        || !igual(state.context, state.entries.at(-1).version))) throw invalid();
    return { valid: true, anchoredAt: json(state.ack), pending: state.entries.length, tailHash: previous, authenticated: false };
  } catch {
    return { valid: false, code: 'OFFLINE_INTEGRITY' };
  }
}

function active(ctx, signal) {
  if (!ctx.open || ctx.isScopeActive(ctx.abast) !== true) throw err('OFFLINE_SCOPE_INACTIVE');
  if (signal?.aborted) throw Object.assign(err('OFFLINE_CANCELLED'), { name: 'AbortError' });
}
function context(queue) { const ctx = contextos.get(queue); if (!ctx) throw invalid(); return ctx; }
async function readState(ctx, signal) {
  active(ctx, signal);
  const raw = await storageRequest(ctx, signal, joined => ctx.store.read(ctx.key, { signal: joined }));
  active(ctx, signal);
  const state = raw == null ? blank(ctx) : json(raw, ctx.maxBytes);
  schemaState(state);
  if (state.nodeId !== ctx.nodeId || !igual(state.abast, json(ctx.abast))) throw err('OFFLINE_INTEGRITY');
  const checked = await verifyOfflineQueueChain(state, { crypto: ctx.crypto });
  active(ctx, signal);
  if (!checked.valid) throw err('OFFLINE_INTEGRITY');
  return state;
}
async function cas(ctx, state, signal) {
  active(ctx, signal);
  const previous = state.revision;
  if (!enter(previous + 1)) throw err('OFFLINE_REVISION_EXHAUSTED');
  state.revision += 1;
  const changed = await storageRequest(ctx, signal, joined => ctx.store.compareAndSwap(ctx.key, previous, json(state, ctx.maxBytes), { signal: joined }));
  if (changed === true) {
    // Confirmat: un abort tardà no el convertix en «cancel·lat». Un canvi d'àmbit
    // sí que es rebutja (la intenció és de l'àmbit antic), marcat com a confirmat.
    if (!ctx.open || ctx.isScopeActive(ctx.abast) !== true) throw Object.assign(err('OFFLINE_SCOPE_INACTIVE'), { committed: true });
    return true;
  }
  active(ctx, signal);
  return changed;
}
async function storageRequest(ctx, signal, action) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const sources = [ctx.lifetime.signal, signal].filter(Boolean);
  for (const s of sources) { s.addEventListener('abort', abort, { once: true }); if (s.aborted) abort(); }
  try { return await action(controller.signal); }
  finally { for (const s of sources) s.removeEventListener('abort', abort); }
}
async function revise(ctx, transform, signal) {
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const state = await readState(ctx, signal);
    const result = await transform(state);
    active(ctx, signal);
    if (result.write === false || await cas(ctx, state, signal)) return result.value;
  }
  throw err('OFFLINE_CAS_BUSY');
}

/** Opt-in explícit; la memòria és per a Node/proves, mai fallback silenciós. */
export function creaCuaOperacionsOffline({ abast, nodeId, store, motor = 'indexeddb', indexedDB = globalThis.indexedDB,
  memoria, crypto = globalThis.crypto, ara = Date.now, maxOperations = 1000, maxBytes = MAX_STATE_BYTES,
  leaseMs = 30000, timeoutMs = 15000, maxDriftMs = MAX_DERIVA_HLC_MS, isScopeActive = () => true } = {}) {
  let scope;
  try { scope = normalitzaAbastRural(abast); } catch { throw invalid(); }
  if (!idValid(nodeId) || typeof ara !== 'function' || typeof isScopeActive !== 'function'
      || !enter(maxOperations, 1, 1000) || !enter(maxBytes, 512, MAX_STATE_BYTES)
      || !enter(leaseMs, 1, 60000) || !enter(timeoutMs, 1, 60000) || !enter(maxDriftMs, 0, 86400000)) throw invalid();
  const storage = store ?? creaMagatzemAtomicRural({ abast: scope, motor, indexedDB, memoria, limitBytes: maxBytes });
  if (typeof storage.read !== 'function' || typeof storage.compareAndSwap !== 'function') throw invalid();
  try { if (!igual(json(normalitzaAbastRural(storage.abast)), json(scope))) throw invalid(); }
  catch { throw invalid(); }
  const ctx = { abast: scope, nodeId, store: storage, crypto: cryptoFor(crypto), ara, maxOperations, maxBytes,
    leaseMs, timeoutMs, maxDriftMs, isScopeActive, key: `offline-queue:${nodeId}`, open: true, drain: null, controller: null,
    lifetime: new AbortController(), ownsStore: store == null };
  const queue = Object.freeze({
    abast: scope,
    enqueueOfflineMutation: (op, options) => enqueueOfflineMutation(queue, op, options),
    peekOfflineQueue: options => peekOfflineQueue(queue, options),
    drainOfflineQueue: (port, options) => drainOfflineQueue(queue, port, options),
    verifyOfflineQueueChain: () => verifyOfflineQueueChain(queue),
    resume: () => revise(ctx, s => { s.blocked = null; return { value: true }; }),
    resolveBlockedHead: (decision, options) => resolveBlockedHead(queue, decision, options),
    close: () => { ctx.open = false; ctx.lifetime.abort(); ctx.controller?.abort(); if (ctx.ownsStore) ctx.store.close(); },
  });
  contextos.set(queue, ctx);
  return queue;
}

export async function peekOfflineQueue(queue, { signal } = {}) {
  return json(await readState(context(queue), signal));
}

/** Crida explícita d'intenció: no captura ni transforma errors d'un RPC viu. */
export async function enqueueOfflineMutation(queue, input, { signal } = {}) {
  const ctx = context(queue); active(ctx, signal);
  const value = json(input, MAX_OP_BYTES);
  keys(value, ['resource', 'recordId', 'action', 'changes', 'baseVersion', 'causalContext', 'observedHlc'], ['resource', 'recordId', 'action', 'changes']);
  if (typeof value.resource !== 'string' || !/^[a-z][a-z0-9_.-]{0,127}$/.test(value.resource)
      || !['create', 'update', 'delete'].includes(value.action) || !esObjecte(value.changes)
      || Object.keys(value.changes).length > 128 || value.action === 'delete' && Object.keys(value.changes).length) throw invalid();
  recordId(value.recordId);
  if (value.baseVersion != null && !enter(value.baseVersion) && !(typeof value.baseVersion === 'string' && value.baseVersion.length <= 128)) throw invalid();
  const observed = value.observedHlc == null ? null : clock(value.observedHlc);
  const causal = value.causalContext == null ? {} : vector(value.causalContext);
  const opId = ctx.crypto.randomUUID();
  return revise(ctx, async s => {
    if (s.entries.length >= ctx.maxOperations) throw err('OFFLINE_QUEUE_FULL');
    if (!enter(s.nextSeq + 1)) throw err('OFFLINE_SEQUENCE_EXHAUSTED');
    const now = ctx.ara(); if (!enter(now)) throw invalid();
    const hlc = seguentRellotgeHLC(s.clock, observed, now, ctx.nodeId, { maxDriftMs: ctx.maxDriftMs });
    // Vector observat del registre + punt propi anterior; mai el context d'altres registres.
    const parent = unionVector(causal, s.nextSeq > 1 ? { [ctx.nodeId]: s.nextSeq - 1 } : {});
    if ((parent[ctx.nodeId] ?? 0) >= s.nextSeq) throw invalid();
    const version = unionVector(parent, { [ctx.nodeId]: s.nextSeq });
    const fieldClocks = {};
    for (const [key, val] of Object.entries(value.changes)) if (typeof val === 'string') fieldClocks[key] = hlc;
    const body = { schema: ESQUEMA_OP, opId, nodeId: ctx.nodeId, seq: s.nextSeq, abast: json(ctx.abast), resource: value.resource,
      recordId: value.recordId, action: value.action, changes: value.changes, baseVersion: value.baseVersion ?? null,
      context: parent, version, hlc, fieldClocks, prevHash: s.entries.at(-1)?.hash ?? s.ack.hash };
    const op = json({ ...body, hash: await digest(ctx.crypto, body) }, MAX_OP_BYTES);
    s.entries.push(op); s.nextSeq += 1; s.clock = hlc; s.context = version;
    json(s, ctx.maxBytes);
    return { value: json(op) };
  }, signal);
}

/**
 * Retira de manera explícita i auditada el cap bloquejat (p. ex. després d'un 409),
 * perquè un conflicte no retinga la resta de la cua per sempre. No el marca com a
 * confirmat pel servidor: queda a `resolved` amb el motiu. Torna l'op retirada:
 * el consumidor la reconcilia (reconciliaConflicteOffline), en persistix la còpia
 * de conflicte i, si cal, encua la substituta amb causalContext/observedHlc remots.
 */
export async function resolveBlockedHead(queue, { opId, outcome } = {}, { signal } = {}) {
  const ctx = context(queue); active(ctx, signal);
  if (!idValid(opId) || !['superseded', 'discarded'].includes(outcome)) throw invalid();
  return revise(ctx, s => {
    const head = s.entries[0];
    if (!s.blocked || s.blocked.opId !== opId || head?.opId !== opId || s.inflight) throw err('OFFLINE_NOT_BLOCKED');
    const at = ctx.ara(); if (!enter(at)) throw invalid();
    s.entries.shift(); s.ack = { seq: head.seq, hash: head.hash };
    s.resolved = [...(s.resolved ?? []), { opId, seq: head.seq, hash: head.hash, kind: s.blocked.kind, code: s.blocked.code, outcome, at }].slice(-MAX_RESOLVED);
    s.blocked = null;
    return { value: json(head) };
  }, signal);
}

function failure(error) {
  const status = typeof error?.status === 'number' ? error.status : typeof error?.statusCode === 'number' ? error.statusCode : 0;
  const code = typeof error?.code === 'string' ? error.code : '';
  if ([401, 403].includes(status) || ['UNAUTHORIZED', 'FORBIDDEN', 'AUTH_REQUIRED', 'SESSION_EXPIRED'].includes(code)) return { kind: 'auth', code: 'REMOTE_AUTH', retryable: false };
  if (status === 409 || code === 'CONFLICT') return { kind: 'conflict', code: 'REMOTE_CONFLICT', retryable: false };
  if ([400, 404, 422].includes(status) || ['VALIDATION_ERROR', 'INVALID_INPUT'].includes(code)) return { kind: 'validation', code: 'REMOTE_VALIDATION', retryable: false };
  if (error?.name === 'AbortError') return { kind: 'cancel', code: 'CANCELLED', retryable: true };
  if ([408, 425, 429, 500, 502, 503, 504].includes(status) || error instanceof TypeError
      || ['NETWORK_ERROR', 'OFFLINE_TIMEOUT'].includes(code)) return { kind: 'network', code: 'REMOTE_RETRYABLE', retryable: true };
  return { kind: code === 'OFFLINE_BAD_ACK' ? 'protocol' : 'unexpected', code: 'REMOTE_REJECTED', retryable: false };
}
function invoke(ctx, port, op, controller) {
  return new Promise((resolve, reject) => {
    let finished = false;
    let timer;
    const done = (error, value) => {
      if (finished) return; finished = true; clearTimeout(timer);
      controller.signal.removeEventListener('abort', aborted);
      if (error) reject(error); else resolve(value);
    };
    const aborted = () => done(Object.assign(err('OFFLINE_CANCELLED'), { name: 'AbortError' }));
    controller.signal.addEventListener('abort', aborted, { once: true });
    timer = setTimeout(() => { done(err('OFFLINE_TIMEOUT')); controller.abort(); }, ctx.timeoutMs);
    if (controller.signal.aborted) { aborted(); return; }
    Promise.resolve().then(() => {
      active(ctx, controller.signal);
      return port.applyOfflineMutation(json(op), {
        idempotencyKey: op.opId, scope: json(ctx.abast), signal: controller.signal,
      });
    }).then(ack => done(null, ack), error => done(error));
  });
}

async function runDrain(ctx, port, { signal, maxOperations = 1000 } = {}) {
  if (!enter(maxOperations, 1, 1000)) throw invalid();
  const controller = new AbortController(); ctx.controller = controller;
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  let acknowledged = 0;
  try {
    for (let count = 0; count < maxOperations; count += 1) {
      active(ctx, controller.signal);
      const claim = await revise(ctx, s => {
        if (!s.entries.length) return { write: false, value: { status: 'drained' } };
        if (s.blocked) return { write: false, value: { status: 'blocked', reason: s.blocked.kind } };
        const now = ctx.ara(); if (!enter(now) || !enter(now + ctx.leaseMs)) throw invalid();
        if (s.inflight && s.inflight.expiresAt > now && s.inflight.claimedAt <= now) return { write: false, value: { status: 'busy' } };
        const leaseId = ctx.crypto.randomUUID();
        s.inflight = { opId: s.entries[0].opId, leaseId, claimedAt: now, expiresAt: now + ctx.leaseMs };
        return { value: { status: 'claimed', op: json(s.entries[0]), leaseId } };
      }, controller.signal);
      if (claim.status !== 'claimed') return { ...claim, acknowledged };
      let ack;
      try {
        ack = await invoke(ctx, port, claim.op, controller);
        active(ctx, controller.signal);
        const confirmed = json(ack, 4096); keys(confirmed, ['opId', 'committed']);
        if (confirmed.opId !== claim.op.opId || confirmed.committed !== true) throw err('OFFLINE_BAD_ACK');
      } catch (e) {
        if (!ctx.open || ctx.isScopeActive(ctx.abast) !== true || signal?.aborted) return { status: 'cancelled', acknowledged };
        const f = failure(e?.code === 'OFFLINE_INVALID_INPUT' ? err('OFFLINE_BAD_ACK') : e);
        await revise(ctx, s => {
          if (s.inflight?.leaseId !== claim.leaseId) return { write: false, value: false };
          s.inflight = null;
          if (!f.retryable) s.blocked = { opId: claim.op.opId, kind: f.kind, code: f.code };
          return { value: true };
        });
        return { status: f.kind === 'cancel' ? 'cancelled' : f.retryable ? 'retryable' : 'blocked', reason: f.kind, acknowledged };
      }
      const accepted = await revise(ctx, s => {
        if (s.inflight?.leaseId !== claim.leaseId || s.entries[0]?.opId !== claim.op.opId) return { write: false, value: false };
        const head = s.entries.shift(); s.ack = { seq: head.seq, hash: head.hash }; s.inflight = null;
        return { value: true };
      }, controller.signal);
      if (!accepted) return { status: 'lease-lost', acknowledged };
      acknowledged += 1;
    }
    const remaining = await readState(ctx, controller.signal);
    return { status: remaining.entries.length ? 'pending' : 'drained', acknowledged };
  } catch (e) {
    if (!ctx.open || e?.name === 'AbortError' || e?.code === 'OFFLINE_SCOPE_INACTIVE') return { status: 'cancelled', acknowledged };
    throw e;
  } finally {
    signal?.removeEventListener('abort', abort); if (ctx.controller === controller) ctx.controller = null;
  }
}

export function drainOfflineQueue(queue, port, options) {
  const ctx = context(queue); active(ctx);
  if (port?.capacitats?.idempotenciaOffline !== true || typeof port.applyOfflineMutation !== 'function') {
    return Promise.reject(err('OFFLINE_IDEMPOTENCY_REQUIRED'));
  }
  if (ctx.drain) return ctx.drain;
  ctx.drain = runDrain(ctx, port, options).finally(() => { ctx.drain = null; });
  return ctx.drain;
}
