import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { creaIdbFalsEstructurat } from './helpers/idbFalsEstructurat.js';
import { CONTRACTE_NUCLI } from '../src/data/contracte.js';
import { validaBackendImplementation } from '../src/data/backendPort.js';
import { creaPersistenciaLocalRural } from '../src/data/local/persistenciaLocalRural.js';
import { creaCuaOperacionsOffline } from '../src/data/local/cuaOperacionsOffline.js';
import { creaEnxufeBackendOfflineFirst, projectaNotesOffline, esErrorTransportOffline } from '../src/data/local/enxufeBackendOfflineFirst.js';

const scope = Object.freeze({ persona: 'anna', tenant: 'poble', endpoint: 'https://poble.example', mode: 'remote' });
const defer = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture(options = {}) {
  const memoria = new Map();
  const persistencia = creaPersistenciaLocalRural({ abast: scope, motor: options.motor ?? 'memoria',
    indexedDB: options.indexedDB, memoria, crypto: webcrypto });
  let currentScope = scope, online = true, calls = 0, writes = 0;
  const notes = { notes: [{ id: 'a', title: 'Inicial' }], noteFolders: [{ id: 'f', name: 'Casa' }], notesComplete: true };
  const port = Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, () => null]));
  Object.assign(port, {
    getCurrentUser: () => ({ id: currentScope.persona }), getRuntimeDataMode: () => 'remote',
    loadNotes: async () => { calls += 1; return structuredClone(notes); },
    loadMur: async () => ({ feedPosts: [{ id: 'b', title: 'Avís' }], events: [], marketItems: [] }),
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    updateNote: () => { throw new Error('Una RPC no idempotent no és el replay'); },
    ...options.port
  });
  const cua = creaCuaOperacionsOffline({ abast: scope, nodeId: 'node-A', motor: options.motor ?? 'memoria',
    indexedDB: options.indexedDB, memoria,
    crypto: webcrypto, isScopeActive: () => currentScope === scope });
  const replayPort = { capacitats: { idempotenciaOffline: true }, applyOfflineMutation: async (op, config) => {
    writes += 1; assert.equal(op.opId, config.idempotencyKey); assert.deepEqual(config.scope, scope);
    for (const n of notes.notes) if (n.id === op.recordId) Object.assign(n, op.changes);
    return { opId: op.opId, committed: true };
  } };
  const target = new EventTarget();
  const escriptures = options.escriptures ?? (options.write ? {
    updateNote: { resource: 'notes', prepara: ([id, changes, revision]) => ({ resource: 'notes', recordId: id,
      action: 'update', changes, baseVersion: revision ?? 0 }), resultat: receipt => receipt }
  } : {});
  const handle = creaEnxufeBackendOfflineFirst({ port, persistencia, cua, replayPort, crypto: webcrypto,
    obteAbast: () => currentScope, estaConnectat: () => online, eventTarget: target,
    escriptures, ...options.enxufe });
  return { handle, backend: handle.backend, port, persistencia, cua, replayPort, target, notes,
    calls: () => calls, writes: () => writes,
    online: value => { online = value; }, scope: value => { currentScope = value; },
    close() { handle.destroy(); cua.close(); persistencia.tanca(); } };
}

test('port complet enxufable: nucli vàlid i mètodes síncrons conserven tipus/this', () => {
  const f = fixture({ port: { getRuntimeDataMode() { assert.equal(this, f.port); return 'remote'; } } });
  assert.equal(f.backend.getRuntimeDataMode(), 'remote');
  assert.equal(Object.keys(validaBackendImplementation(f.backend).candidate).length, CONTRACTE_NUCLI.length);
  f.close();
});

test('online desa la resposta completa; offline la recupera amb carpetes i sense compartir referències', async () => {
  const f = fixture();
  const first = await f.backend.loadNotes('anna'); first.notes[0].title = 'Mutació externa';
  f.online(false);
  const cached = await f.backend.loadNotes('anna');
  assert.equal(cached.notes[0].title, 'Inicial'); assert.deepEqual(cached.noteFolders, f.notes.noteFolders);
  cached.notes.length = 0; assert.equal((await f.backend.loadNotes('anna')).notes.length, 1);
  assert.equal(f.calls(), 1); f.close();
});

test('cau inicial absent és error explícit, mai llista buida inventada', async () => {
  const f = fixture(); f.online(false);
  await assert.rejects(f.backend.loadNotes('anna'), { code: 'SDP-OFFLINE-SENSE-CAU' }); f.close();
});

test('selectors: llista, detall A/B i cursor són claus diferents; AbortSignal no canvia la clau', async () => {
  const f = fixture({ port: { loadNotes: async (_owner, config = {}) => ({ notes: [{ id: config.noteId ?? config.cursor ?? 'llista' }], noteFolders: [] }) } });
  for (const config of [{}, { noteId: 'a' }, { noteId: 'b' }, { cursor: 'c' }]) await f.backend.loadNotes('anna', config);
  f.online(false);
  for (const [config, id] of [[{}, 'llista'], [{ noteId: 'a' }, 'a'], [{ noteId: 'b' }, 'b'], [{ cursor: 'c' }, 'c']]) {
    assert.equal((await f.backend.loadNotes('anna', { ...config, signal: new AbortController().signal })).notes[0].id, id);
  }
  f.close();
});

test('transport neutral usa cau; errors auth/validació/esquema i AbortError mai són reserva', async () => {
  const f = fixture(); await f.backend.loadNotes('anna');
  const actual = f.port.loadNotes;
  f.port.loadNotes = async () => { throw Object.assign(new Error('xarxa'), { codi: 'backend-inabastable' }); };
  assert.equal((await f.backend.loadNotes('anna')).notes[0].id, 'a');
  for (const e of [Object.assign(new Error('auth'), { status: 401 }), Object.assign(new Error('invàlid'), { code: 'INVALID_INPUT' }),
    Object.assign(new Error('esquema'), { code: 'esquema-absent' }), Object.assign(new Error('cancel'), { name: 'AbortError' })]) {
    f.port.loadNotes = async () => { throw e; }; await assert.rejects(f.backend.loadNotes('anna'), e);
  }
  f.port.loadNotes = actual; f.close();
});

test('metodes d’autenticació, xat i NetworkOnly no es transformen en cues', async () => {
  let raw = 0;
  const f = fixture({ port: { loginWithPassword: () => { raw += 1; return 'original'; }, appendSectionSubmissionNetworkOnly: () => 'xarxa' } });
  f.online(false); assert.equal(f.backend.loginWithPassword('u', 'p'), 'original');
  assert.equal(f.backend.appendSectionSubmissionNetworkOnly({}), 'xarxa');
  assert.equal(raw, 1); assert.equal((await f.cua.peekOfflineQueue()).entries.length, 0); f.close();
});

test('cua offline de Notes projecta l’edició i el reconnect envia el mateix opId només una vegada', async () => {
  const f = fixture({ write: true }); await f.backend.loadNotes('anna'); f.online(false);
  const receipt = await f.backend.updateNote('a', { title: 'Sense cobertura' }, 3);
  assert.equal(receipt.queued, true); assert.equal(receipt.committed, false);
  assert.equal((await f.backend.loadNotes('anna')).notes[0].title, 'Sense cobertura');
  f.online(true); const drained = await f.handle.drena(); assert.equal(drained.acknowledged, 1);
  assert.equal((await f.cua.peekOfflineQueue()).entries.length, 0);
  f.online(false); assert.equal((await f.backend.loadNotes('anna')).notes[0].title, 'Sense cobertura');
  f.online(true); await f.handle.drena(); assert.equal(f.writes(), 1); f.close();
});

test('escriptura online usa la intenció durable i retorna confirmació després de l’ACK', async () => {
  const f = fixture({ write: true }); await f.backend.loadNotes('anna');
  const receipt = await f.backend.updateNote('a', { title: 'Confirmada' }, 1);
  assert.equal(receipt.queued, false); assert.equal(receipt.committed, true);
  f.online(false); assert.equal((await f.backend.loadNotes('anna')).notes[0].title, 'Confirmada'); f.close();
});

test('error remot després de possible commit conserva opId per reintent idempotent', async () => {
  const f = fixture({ write: true }); const ids = [];
  f.replayPort.applyOfflineMutation = async op => { ids.push(op.opId); throw new TypeError('resposta perduda'); };
  const receipt = await f.backend.updateNote('a', { title: 'Intenció' }, 0);
  assert.equal(receipt.queued, true);
  f.replayPort.applyOfflineMutation = async op => { ids.push(op.opId); return { opId: op.opId, committed: true }; };
  await f.handle.drena(); assert.equal(ids.length, 2); assert.equal(ids[0], ids[1]); f.close();
});

test('401 bloqueja la intenció i no la pinta com a edició acceptada', async () => {
  const f = fixture({ write: true }); await f.backend.loadNotes('anna');
  f.replayPort.applyOfflineMutation = async () => { throw Object.assign(new Error('no'), { status: 401 }); };
  await assert.rejects(f.backend.updateNote('a', { title: 'Prohibida' }, 0), { code: 'SDP-OFFLINE-REBUTJADA' });
  f.online(false); assert.equal((await f.backend.loadNotes('anna')).notes[0].title, 'Inicial');
  assert.equal((await f.cua.peekOfflineQueue()).blocked.kind, 'auth'); f.close();
});

test('en tornar connexió un únic event drena; destroy lleva listener i no crea polling', async () => {
  const f = fixture({ write: true }); f.online(false); await f.backend.updateNote('a', { title: 'U' }, 0);
  f.online(true); f.target.dispatchEvent(new Event('online'));
  for (let i = 0; i < 20 && !f.writes(); i += 1) await tick();
  await f.handle.drena(); assert.equal(f.writes(), 1);
  f.handle.destroy(); f.target.dispatchEvent(new Event('online')); await tick(); assert.equal(f.writes(), 1); f.close();
});

test('canvi de persona/tenant/endpoint/mode rebutja lectures privades però deixa consultar identitat', async () => {
  for (const [key, value] of [['persona', 'berta'], ['tenant', 'altre'], ['endpoint', 'https://altre.example'], ['mode', 'local']]) {
    const f = fixture(); await f.backend.loadNotes('anna'); f.scope({ ...scope, [key]: value }); f.online(false);
    await assert.rejects(f.backend.loadNotes('anna'), { code: 'SDP-OFFLINE-ABAST' });
    assert.equal(f.backend.getCurrentUser().id, key === 'persona' ? 'berta' : 'anna'); f.close();
  }
});

test('resposta tardana d’una altra persona no s’entrega ni es persistix', async () => {
  const pending = defer(); const f = fixture({ port: { loadNotes: () => pending.promise } });
  const read = f.backend.loadNotes('anna'); await tick(); f.scope({ ...scope, persona: 'berta' });
  pending.resolve({ notes: [{ id: 'secret-A' }], noteFolders: [] });
  await assert.rejects(read, { code: 'SDP-OFFLINE-ABAST' }); assert.deepEqual(await f.persistencia.llegix('notes'), []); f.close();
});

test('una lectura antiga no sobreescriu l’escriptura confirmada durant l’espera', async () => {
  const f = fixture({ write: true }); await f.backend.loadNotes('anna');
  const pending = defer(); f.port.loadNotes = () => pending.promise;
  const read = f.backend.loadNotes('anna'); await tick();
  await f.backend.updateNote('a', { title: 'Confirmada' }, 0);
  pending.resolve({ notes: [{ id: 'a', title: 'Antiga' }], noteFolders: [] });
  await assert.rejects(read, { code: 'SDP-OFFLINE-LECTURA-ANTIGA' });
  f.online(false); assert.equal((await f.backend.loadNotes('anna')).notes[0].title, 'Confirmada'); f.close();
});

test('respostes remotes fora d’ordre no reescriuen la cau amb l’antiga', async () => {
  const a = defer(), b = defer(); let n = 0;
  const f = fixture({ port: { loadNotes: () => ++n === 1 ? a.promise : b.promise } });
  const one = f.backend.loadNotes('anna'), two = f.backend.loadNotes('anna'); await tick();
  b.resolve({ notes: [{ id: 'b' }], noteFolders: [] }); await two;
  a.resolve({ notes: [{ id: 'a' }], noteFolders: [] }); await one;
  f.online(false); assert.equal((await f.backend.loadNotes('anna')).notes[0].id, 'b'); f.close();
});

test('quota fallida de la cau no transforma un èxit remot en reintent d’escriptura', async () => {
  const events = []; const f = fixture({ enxufe: { onError: e => events.push(e) } });
  const actualitza = f.persistencia.actualitza;
  // Façana que falla només a la cau; la persistència de la cua és independent.
  const handle = creaEnxufeBackendOfflineFirst({ port: f.port, cua: f.cua, crypto: webcrypto,
    persistencia: { abast: scope, llegix: f.persistencia.llegix, actualitza: async () => { throw Object.assign(new Error('quota'), { code: 'SDP-RURAL-QUOTA' }); } },
    obteAbast: () => scope, eventTarget: null, onError: e => events.push(e) });
  assert.equal((await handle.backend.loadNotes('anna')).notes[0].id, 'a'); assert.equal(events[0].code, 'SDP-RURAL-QUOTA');
  assert.equal(typeof actualitza, 'function'); handle.destroy(); f.close();
});

test('límit1 de cau, selectors diferents i cap contaminació entre mètodes', async () => {
  const f = fixture({ enxufe: { maxCacheEntries: 1 } });
  await f.backend.loadNotes('anna', { noteId: 'a' }); await f.backend.loadNotes('anna', { noteId: 'b' });
  assert.equal((await f.persistencia.llegix('notes')).length, 1);
  await f.backend.loadMur('anna'); assert.equal((await f.persistencia.llegix('bans')).length, 1); f.close();
});

test('el projector no inserix una creació B dins del detall A i resol una creació del mateix detall', () => {
  const op = { resource: 'notes', action: 'create', recordId: 'b', changes: { title: 'B', id: 'alié' } };
  const detail = { notes: [{ id: 'a' }], noteResolution: { id: 'a', status: 'found' }, notesComplete: false };
  assert.deepEqual(projectaNotesOffline(detail, op), detail);
  const missing = { notes: [], noteResolution: { id: 'b', status: 'not-found' }, notesComplete: false };
  const filled = projectaNotesOffline(missing, op);
  assert.equal(filled.notes[0].id, 'b'); assert.equal(filled.noteResolution.status, 'found');
  assert.equal(projectaNotesOffline({ notes: [], complete: false }, op).notes.length, 0);
});

test('temporitzador acotat cancel·la el signal del port i destroy avorta lectures en curs', async () => {
  let signal;
  const f = fixture({ port: { loadNotes: (_u, config) => { signal = config.signal; return new Promise(() => {}); } }, enxufe: { timeoutMs: 10 } });
  await assert.rejects(f.backend.loadNotes('anna'), { code: 'SDP-OFFLINE-TIMEOUT' }); assert.equal(signal.aborted, true); f.close();
  const g = fixture({ port: { loadNotes: () => new Promise(() => {}) } }); const p = g.backend.loadNotes('anna'); await tick();
  g.handle.destroy(); await assert.rejects(p, { name: 'AbortError' }); g.close();
});

test('fallback no s’activa per TypeError genèric, codi d’auth ni AbortError disfressat', () => {
  assert.equal(esErrorTransportOffline(new TypeError('bug')), false);
  assert.equal(esErrorTransportOffline({ code: 'backend-inabastable', name: 'AbortError' }), false);
  assert.equal(esErrorTransportOffline({ code: 'backend-inabastable' }), true);
});

test('factory rebutja àmbits divergents, descriptor d’auth i port amb accessor', () => {
  const f = fixture();
  const base = { port: f.port, persistencia: f.persistencia, cua: f.cua, obteAbast: () => scope, eventTarget: null };
  assert.throws(() => creaEnxufeBackendOfflineFirst({ ...base, persistencia: { abast: { ...scope, persona: 'b' } } }), { code: 'SDP-OFFLINE-ABAST' });
  assert.throws(() => creaEnxufeBackendOfflineFirst({ ...base, escriptures: { loginWithPassword: { resource: 'notes', prepara() {}, resultat() {} } } }), { code: 'SDP-OFFLINE-IDEMPOTENCIA' });
  const hostile = Object.create(f.port); Object.defineProperty(hostile, 'loadNotes', { get() { throw new Error('getter no s’ha d’executar'); } });
  assert.throws(() => creaEnxufeBackendOfflineFirst({ ...base, port: hostile }), { code: 'SDP-OFFLINE-CONFIG' }); f.close();
});

test('E-06 · descriptors de lectura rebutgen auth, xat, NetworkOnly, mutacions i noms aliens abans de cap efecte', async t => {
  const f = fixture();
  t.after(() => f.close());
  let calls = 0, selectors = 0;
  for (const name of ['updateUserPassword', 'enviaMissatge', 'appendSectionSubmissionNetworkOnly', 'updateNote', 'sendMessage', 'metodeDesconegut']) {
    const port = { ...f.port, [name]() { calls += 1; return { ok: true }; } };
    assert.throws(() => creaEnxufeBackendOfflineFirst({ port, persistencia: f.persistencia, cua: f.cua,
      obteAbast: () => scope, eventTarget: null,
      lectures: { [name]: { colleccio: 'notes', clau() { selectors += 1; return ['SYNTHETIC_PASSWORD_NOT_REAL']; } } }
    }), { code: 'SDP-OFFLINE-CONFIG' }, name);
  }
  assert.equal(calls, 0);
  assert.equal(selectors, 0);
  for (const collection of ['notes', 'bans', 'directory']) assert.deepEqual(await f.persistencia.llegix(collection), []);
  assert.deepEqual((await f.cua.peekOfflineQueue()).entries, []);
});


/* E-03/E-04/E-05 · Reproductors de la lectura independent. IndexedDB és el
   motor persistent, amb el fake estructurat del repo, no un Map privat. */
test('E-03 · dues pestanyes IDB: una lectura en vol no trepitja l’ACK de l’altra instància', async t => {
  const idb = creaIdbFalsEstructurat();
  let gate = null;
  const entered = defer();
  const a = fixture({ motor: 'indexeddb', indexedDB: idb, write: true, port: {
    loadNotes: async () => {
      if (gate) { entered.resolve(); return gate.promise; }
      return { notes: [{ id: 'a', title: 'Inicial' }], noteFolders: [], notesComplete: true };
    }
  } });
  const b = fixture({ motor: 'indexeddb', indexedDB: idb.pestanya(), write: true });
  t.after(() => { a.close(); b.close(); });
  await a.backend.loadNotes('anna');
  gate = defer();
  const read = a.backend.loadNotes('anna');
  const rejected = assert.rejects(read, { code: 'SDP-OFFLINE-LECTURA-ANTIGA' });
  await entered.promise; // la petició remota ja ha capturat la generació antiga
  const receipt = await b.backend.updateNote('a', { title: 'Confirmada a B' }, 0);
  assert.equal(receipt.committed, true);
  gate.resolve({ notes: [{ id: 'a', title: 'Antiga a A' }], noteFolders: [], notesComplete: true });
  await rejected;
  a.online(false);
  assert.equal((await a.backend.loadNotes('anna')).notes[0].title, 'Confirmada a B');
});

test('E-04 · ACK del passthrough de Notes invalida cau i lectures antigues sense encuar la RPC', async t => {
  const entered = defer();
  let gate = null, rawCalls = 0;
  const f = fixture({ motor: 'indexeddb', indexedDB: creaIdbFalsEstructurat(), port: {
    loadNotes: async () => {
      if (gate) { entered.resolve(); return gate.promise; }
      return { notes: [{ id: 'a', title: 'Inicial' }], noteFolders: [] };
    },
    updateNote: async (id, changes) => { rawCalls += 1; return { id, title: changes.title, revision: 4 }; }
  } });
  t.after(() => f.close());
  await f.backend.loadNotes('anna');
  gate = defer();
  const read = f.backend.loadNotes('anna');
  const rejected = assert.rejects(read, { code: 'SDP-OFFLINE-LECTURA-ANTIGA' });
  await entered.promise;
  assert.deepEqual(await f.backend.updateNote('a', { title: 'Confirmada directa' }, 3),
    { id: 'a', title: 'Confirmada directa', revision: 4 });
  gate.resolve({ notes: [{ id: 'a', title: 'Antiga' }], noteFolders: [] });
  await rejected;
  assert.equal(rawCalls, 1);
  assert.equal((await f.cua.peekOfflineQueue()).entries.length, 0);
  f.online(false);
  await assert.rejects(f.backend.loadNotes('anna'), { code: 'SDP-OFFLINE-SENSE-CAU' });
});

test('E-05 · HTTP401 preval sobre un codi neutral i no entrega la còpia en cau', async t => {
  const f = fixture({ motor: 'indexeddb', indexedDB: creaIdbFalsEstructurat() });
  t.after(() => f.close());
  await f.backend.loadNotes('anna');
  const auth = Object.assign(new Error('Autorització denegada'), { status: 401, codi: 'backend-inabastable' });
  f.port.loadNotes = async () => { throw auth; };
  await assert.rejects(f.backend.loadNotes('anna'), auth);
  assert.equal(esErrorTransportOffline(auth), false);
});

test('cau limitada a1 conserva les files rurals normals i el rellotge durable després d’un ACK', async t => {
  const f = fixture({ motor: 'indexeddb', indexedDB: creaIdbFalsEstructurat(), write: true,
    enxufe: { maxCacheEntries: 1 } });
  t.after(() => f.close());
  const normals = [{ id: 'rural-a', text: 'Primera nota intacta' }, { id: 'rural-b', text: 'Segona nota intacta' }];
  await f.persistencia.desa('notes', normals);
  await f.backend.loadNotes('anna', { noteId: 'a' });
  await f.backend.updateNote('a', { title: 'Confirmada' }, 0);
  await f.backend.loadNotes('anna', { noteId: 'b' });
  const rows = await f.persistencia.llegix('notes');
  assert.deepEqual(rows.filter(row => normals.some(n => n.id === row.id)), normals);
  assert.equal(rows.filter(row => row.kind === 'backend-response').length, 1);
  const clock = rows.filter(row => row.kind === 'backend-cache-clock-v1');
  assert.equal(clock.length, 1);
  assert.equal(clock[0].epoch, 1);
  assert.equal(rows.length, 4); // 2 rurals +1 resposta +1 rellotge, sense inspecció del fake
});

/* Gauntlet O7-O9 (kit Codex O8-O9): ENX-03, ENX-04 i la part de l'enxufe de P3-CUA-05. */
test('ENX-03 · una RPC directa lenta no rep el temps límit de l’enxufe i, confirmada, invalida la cau', async t => {
  let rawCalls = 0;
  const f = fixture({ enxufe: { timeoutMs: 25 }, port: {
    updateNote: async (id, changes) => { rawCalls += 1; await new Promise(r => setTimeout(r, 100)); return { id, title: changes.title, revision: 1 }; }
  } });
  t.after(() => f.close());
  await f.backend.loadNotes('anna');
  assert.deepEqual(await f.backend.updateNote('a', { title: 'Lenta però confirmada' }, 0), { id: 'a', title: 'Lenta però confirmada', revision: 1 });
  assert.equal(rawCalls, 1);
  f.online(false);
  await assert.rejects(f.backend.loadNotes('anna'), { code: 'SDP-OFFLINE-SENSE-CAU' });
});

test('ENX-04 · una escriptura darrere d’un cap bloquejat no es declara rebutjada pel servidor', async t => {
  const f = fixture({ write: true }); const enviades = [];
  t.after(() => f.close());
  f.replayPort.applyOfflineMutation = async op => { enviades.push(op.recordId); throw Object.assign(new Error('no'), { status: 401 }); };
  await assert.rejects(f.backend.updateNote('a', { title: 'Prohibida' }, 0), { code: 'SDP-OFFLINE-REBUTJADA' });
  const receipt = await f.backend.updateNote('b', { title: 'Posterior' }, 0);
  assert.equal(receipt.queued, true); assert.equal(receipt.committed, false); assert.equal(receipt.status, 'blocked-behind');
  assert.deepEqual(enviades, ['a']);
  assert.deepEqual((await f.cua.peekOfflineQueue()).entries.map(e => e.recordId), ['a', 'b']);
});

test('P3-CUA-05 · una intenció ja durable amb un drenatge esgotat torna un rebut, mai un error', async t => {
  const f = fixture({ write: true, enxufe: { timeoutMs: 25 } });
  t.after(() => f.close());
  f.replayPort.applyOfflineMutation = () => new Promise(() => {});
  const receipt = await f.backend.updateNote('a', { title: 'Sense resposta' }, 0);
  assert.equal(receipt.queued, true); assert.equal(receipt.committed, false); assert.equal(receipt.status, 'retryable');
  assert.deepEqual((await f.cua.peekOfflineQueue()).entries.map(e => e.opId), [receipt.op.opId]);
});
