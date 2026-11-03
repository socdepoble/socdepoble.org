/**
 * Enxufe optatiu: cap import des de backendPort ni activació per defecte.
 * Torna {backend,drena,destroy}; desendollar és tornar al port original.
 * Les lectures declarades conserven la resposta completa en una cau acotada.
 * Les escriptures requerixen descriptor i replay remot idempotent explícits:
 * un error de xarxa després d'un commit no permet repetir una RPC ordinària.
 * Auth, xat, permisos i mètodes NetworkOnly mai s'encuen per inferència.
 */
import { CONTRACTE_BACKEND } from '../contracte.js';
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';
import { copiaJsonRural, normalitzaAbastRural, COLLECCIONS_RURALS } from './persistenciaLocalRural.js';

const fail = (code, text) => Object.assign(new Error(text), { code, codi: code });
const avortat = () => Object.assign(fail('SDP-OFFLINE-CANCEL', 'Operació offline cancel·lada.'), { name: 'AbortError' });
const IGUAL = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const MUTACIONS = new Set(['createNote', 'updateNote', 'mouNota', 'esborraNota']);
// Ampliar esta frontera requerix revisar el contracte de privacitat: ni un
// descriptor injectat pot transformar auth, xat o NetworkOnly en una cau.
const LECTURES_CACHE = new Set(['loadNotes', 'loadMur', 'loadCoreContent']);
const CLOCK_ID = '@sdp:backend-cache-clock';
const CLOCK_KIND = 'backend-cache-clock-v1';
function epochDe(rows) {
  const row = rows.find(r => r.id === CLOCK_ID);
  if (!row) return 0;
  if (row.kind !== CLOCK_KIND || !Number.isSafeInteger(row.epoch) || row.epoch < 0) throw fail('SDP-OFFLINE-CACHE', 'Rellotge de cau invàlid.');
  return row.epoch;
}
function avancaEpoch(rows) {
  const epoch = epochDe(rows) + 1;
  if (!Number.isSafeInteger(epoch)) throw fail('SDP-OFFLINE-CACHE', 'Rellotge de cau esgotat.');
  return [...rows.filter(r => r.id !== CLOCK_ID), { id: CLOCK_ID, kind: CLOCK_KIND, epoch }];
}

/** Projecció idempotent de Notes: és una vista local, mai una revisió de servidor. */
export function projectaNotesOffline(entrada, op, context = {}) {
  const value = copiaJsonRural(entrada);
  if (op.resource !== 'notes' || !Array.isArray(value?.notes)) return value;
  const config = context.selectors?.[1]?.kind === 'value' ? context.selectors[1].value : {};
  const requested = typeof config?.noteId === 'string' ? config.noteId : value.noteResolution?.id;
  if (requested && requested !== op.recordId) return value;
  const notes = value.notes;
  if (op.action === 'delete') {
    value.notes = notes.filter(n => n.id !== op.recordId);
    if (requested) value.noteResolution = { id: requested, status: 'not-found' };
  }
  else if (op.action === 'create') {
    // Una pàgina filtrada o un cursor no equival a la llista sencera.
    const fullList = config && !Object.keys(config).length && value.notesComplete !== false && value.complete !== false;
    if ((requested || fullList) && !notes.some(n => n.id === op.recordId)) {
      value.notes = [...notes, Object.assign({}, copiaJsonRural(op.changes), { id: op.recordId })];
      if (requested) value.noteResolution = { id: requested, status: 'found' };
    }
  } else if (op.action === 'update') {
    value.notes = notes.map(n => n.id === op.recordId ? Object.assign({}, n, copiaJsonRural(op.changes), { id: n.id }) : n);
  }
  return value;
}
const DEFAULT_LECTURES = Object.freeze({
  loadNotes: Object.freeze({ colleccio: 'notes', clau: clauLecturaCompleta, projecta: projectaNotesOffline }),
  loadMur: Object.freeze({ colleccio: 'bans', clau: clauLecturaCompleta }),
  loadCoreContent: Object.freeze({ colleccio: 'directory', clau: clauLecturaCompleta })
});

/** Els selectors formen part de la clau. Només AbortSignal és transport. */
function clauLecturaCompleta(args) {
  return args.map((value, index) => {
    if (value === undefined) return { kind: 'undefined' };
    if (index !== 1 || value === null || typeof value !== 'object') return { kind: 'value', value: copiaJsonRural(value, 16384) };
    const copy = Object.create(null);
    for (const [key, d] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (!Object.hasOwn(d, 'value')) throw fail('SDP-OFFLINE-CONFIG', 'Els selectors no poden tindre accessors.');
      if (key !== 'signal') Object.defineProperty(copy, key, { value: d.value, enumerable: d.enumerable, writable: true, configurable: true });
    }
    return { kind: 'value', value: copiaJsonRural(copy, 16384) };
  });
}

/** Només els errors neutrals de transport autoritzen una reserva de lectura.
 * Un 401/403/409, un error d'esquema o AbortError mai es convertix en offline. */
export function esErrorTransportOffline(error) {
  const status = error?.status ?? error?.statusCode;
  if (typeof status === 'number' && status > 0) return false;
  return error?.name !== 'AbortError' && [CODI_BACKEND_INABASTABLE, 'servidor-inabastable', 'offline']
    .includes(error?.codi ?? error?.code);
}

function metode(objecte, nom) {
  let p = objecte;
  while (p && p !== Object.prototype) {
    const d = Object.getOwnPropertyDescriptor(p, nom);
    if (d) {
      if (!Object.hasOwn(d, 'value') || typeof d.value !== 'function') throw fail('SDP-OFFLINE-CONFIG', 'El port ha de declarar mètodes, sense accessors.');
      return d.value.bind(objecte);
    }
    p = Object.getPrototypeOf(p);
  }
  return null;
}

function senyalDelsArguments(args) {
  for (let i = args.length - 1; i >= 0; i -= 1) {
    const a = args[i];
    if (a && typeof a === 'object') {
      const d = Object.getOwnPropertyDescriptor(a, 'signal');
      if (d && !Object.hasOwn(d, 'value')) throw fail('SDP-OFFLINE-CONFIG', 'Signal no pot ser un accessor.');
      if (d?.value !== undefined) return d.value;
    }
  }
  return undefined;
}

export function creaEnxufeBackendOfflineFirst({ port, persistencia, cua, replayPort,
  obteAbast, estaConnectat = () => globalThis.navigator?.onLine !== false,
  lectures = DEFAULT_LECTURES, escriptures = {}, eventTarget = globalThis.window,
  onError = () => {}, crypto = globalThis.crypto, timeoutMs = 15000, maxCacheEntries = 64 } = {}) {
  if (!port || !persistencia || !cua || typeof obteAbast !== 'function' || typeof estaConnectat !== 'function'
      || typeof onError !== 'function' || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000
      || !Number.isSafeInteger(maxCacheEntries) || maxCacheEntries < 1 || maxCacheEntries > 512) {
    throw fail('SDP-OFFLINE-CONFIG', 'Configuració de l’enxufe offline invàlida.');
  }
  const abast = normalitzaAbastRural(obteAbast());
  if (!IGUAL(abast, normalitzaAbastRural(persistencia.abast)) || !IGUAL(abast, normalitzaAbastRural(cua.abast))) {
    throw fail('SDP-OFFLINE-ABAST', 'Port, cau i cua han de compartir el mateix àmbit.');
  }
  const checkScope = () => {
    if (closed) throw avortat();
    if (!IGUAL(abast, normalitzaAbastRural(obteAbast()))) throw fail('SDP-OFFLINE-ABAST', 'La identitat o el backend han canviat; crea un enxufe nou.');
  };
  const notify = (code, method) => { try { onError(Object.freeze({ code, method })); } catch { /* una notificació no canvia un commit */ } };
  const lectura = new Map(), escriptura = new Map();
  for (const [name, d] of Object.entries(lectures)) {
    if (!LECTURES_CACHE.has(name) || !CONTRACTE_BACKEND.includes(name) || !metode(port, name) || !d || !COLLECCIONS_RURALS.includes(d.colleccio) || typeof d.clau !== 'function') {
      throw fail('SDP-OFFLINE-CONFIG', 'Descriptor de lectura desconegut.');
    }
    lectura.set(name, { colleccio: d.colleccio, clau: d.clau, projecta: typeof d.projecta === 'function' ? d.projecta : null });
  }
  for (const [name, d] of Object.entries(escriptures)) {
    if (!MUTACIONS.has(name) || !metode(port, name) || !d || typeof d.prepara !== 'function' || typeof d.resultat !== 'function'
        || !COLLECCIONS_RURALS.includes(d.resource) || replayPort?.capacitats?.idempotenciaOffline !== true
        || typeof replayPort?.applyOfflineMutation !== 'function') {
      throw fail('SDP-OFFLINE-IDEMPOTENCIA', 'L’escriptura offline requerix un descriptor de Notes i replay idempotent explícit.');
    }
    escriptura.set(name, { prepara: d.prepara, resultat: d.resultat, resource: d.resource });
  }
  let closed = false, mutacionsConfirmades = 0;
  const active = new Set(), sequencies = new Map();

  function context(signal) {
    checkScope();
    if (signal && (typeof signal.addEventListener !== 'function' || typeof signal.removeEventListener !== 'function')) throw fail('SDP-OFFLINE-CONFIG', 'AbortSignal invàlid.');
    const control = new AbortController();
    const abort = () => control.abort(signal?.reason ?? avortat());
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    active.add(control);
    return {
      signal: control.signal,
      abort(reason) { control.abort(reason); },
      check() { if (control.signal.aborted) throw control.signal.reason?.code === 'SDP-OFFLINE-TIMEOUT' ? control.signal.reason : avortat(); checkScope(); },
      close() { signal?.removeEventListener('abort', abort); active.delete(control); }
    };
  }
  async function espera(fn, ctx, ambTemps = true) {
    ctx.check();
    let timer, abort;
    try {
      return await Promise.race([
        Promise.resolve().then(() => { ctx.check(); return fn(); }),
        new Promise((_, reject) => {
          abort = () => reject(ctx.signal.reason?.code === 'SDP-OFFLINE-TIMEOUT' ? ctx.signal.reason : avortat());
          ctx.signal.addEventListener('abort', abort, { once: true });
          if (ambTemps) timer = setTimeout(() => ctx.abort(fail('SDP-OFFLINE-TIMEOUT', 'Temps límit de l’enxufe offline.')), timeoutMs);
        })
      ]);
    } finally { clearTimeout(timer); ctx.signal.removeEventListener('abort', abort); }
  }
  async function cacheKey(name, d, args, ctx) {
    const value = copiaJsonRural(d.clau(args), 16384);
    if (typeof crypto?.subtle?.digest !== 'function') throw fail('SDP-OFFLINE-CRYPTO', 'SHA-256 no disponible.');
    const digest = await espera(() => crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value))), ctx);
    ctx.check();
    return { id: `backend:${name}:${[...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('')}`, selectors: value };
  }
  async function projecta(value, d, ctx, selectors) {
    const copy = copiaJsonRural(value);
    if (!d.projecta) return copy;
    const pending = await espera(() => cua.peekOfflineQueue({ signal: ctx.signal }), ctx);
    ctx.check();
    const ops = Array.isArray(pending?.entries) ? pending.entries : [];
    let out = copy;
    for (const op of ops) {
      if (pending.blocked && op.opId === pending.blocked.opId) break;
      out = copiaJsonRural(d.projecta(out, copiaJsonRural(op), { selectors }));
    }
    return out;
  }
  function argumentsAmbSenyal(args, signal) {
    const out = args.slice();
    const config = args[1];
    const copy = Object.create(null);
    if (config !== undefined && config !== null) {
      if (typeof config !== 'object' || Array.isArray(config)) throw fail('SDP-OFFLINE-CONFIG', 'Configuració de lectura invàlida.');
      for (const [key, d] of Object.entries(Object.getOwnPropertyDescriptors(config))) {
        if (!Object.hasOwn(d, 'value') || ['__proto__', 'constructor', 'prototype'].includes(key)) throw fail('SDP-OFFLINE-CONFIG', 'Configuració amb accessor o clau reservada.');
        if (key !== 'signal') copy[key] = d.value;
      }
    }
    copy.signal = signal; out[1] = copy;
    return out;
  }
  async function read(name, d, args) {
    const ctx = context(senyalDelsArguments(args));
    try {
      const versioLectura = mutacionsConfirmades;
      const epochInicial = epochDe(await espera(() => persistencia.llegix(d.colleccio, { signal: ctx.signal }), ctx));
      const guard = () => {
        ctx.check();
        if (versioLectura !== mutacionsConfirmades) throw fail('SDP-OFFLINE-LECTURA-ANTIGA', 'Una escriptura ha avançat la còpia local; repetix la lectura.');
      };
      const guardDurable = async () => {
        guard();
        const rows = await espera(() => persistencia.llegix(d.colleccio, { signal: ctx.signal }), ctx);
        guard();
        if (epochDe(rows) !== epochInicial) throw fail('SDP-OFFLINE-LECTURA-ANTIGA', 'La cau ha avançat des d’una altra pestanya; repetix la lectura.');
      };
      const { id, selectors } = await cacheKey(name, d, args, ctx);
      const seq = (sequencies.get(id) ?? 0) + 1;
      sequencies.set(id, seq);
      if (estaConnectat()) {
        let result;
        let received = false;
        try { result = await espera(() => metode(port, name)(...argumentsAmbSenyal(args, ctx.signal)), ctx); guard(); received = true; }
        catch (e) { guard(); if (!esErrorTransportOffline(e)) throw e; }
        if (received) {
          let cache;
          try {
            cache = copiaJsonRural(result);
            if (sequencies.get(id) === seq) {
              await espera(() => persistencia.actualitza(d.colleccio, rows => {
                guard();
                if (epochDe(rows) !== epochInicial) throw fail('SDP-OFFLINE-LECTURA-ANTIGA', 'Una altra connexió ha avançat la cau.');
                if (sequencies.get(id) !== seq) return rows;
                const previous = rows.filter(r => r.kind === 'backend-response' && r.id !== id);
                const keep = maxCacheEntries > 1 ? previous.slice(-(maxCacheEntries - 1)) : [];
                return [...rows.filter(r => r.kind !== 'backend-response'), ...keep, { id, kind: 'backend-response', selectors, value: cache }];
              }, { signal: ctx.signal }), ctx);
            }
            guard();
          } catch (e) { guard(); if (e.code === 'SDP-OFFLINE-LECTURA-ANTIGA') throw e; notify(e.code ?? 'SDP-OFFLINE-CACHE', name); if (cache === undefined) return result; }
          const projected = await projecta(cache, d, ctx, selectors);
          await guardDurable(); return projected;
        }
      }
      const rows = await espera(() => persistencia.llegix(d.colleccio, { signal: ctx.signal }), ctx);
      guard();
      const cached = rows.find(r => r.id === id && r.kind === 'backend-response');
      if (!cached) throw fail('SDP-OFFLINE-SENSE-CAU', 'Encara no hi ha una còpia local d’esta lectura.');
      const projected = await projecta(cached.value, d, ctx, selectors);
      await guardDurable(); return projected;
    } finally { ctx.close(); }
  }

  async function drena(config = {}) {
    const ctx = context(config.signal);
    try {
      if (!estaConnectat()) return { status: 'pending', acknowledged: 0, reason: 'offline' };
      if (!replayPort) return { status: 'pending', acknowledged: 0, reason: 'no-replay-port' };
      const before = await espera(() => cua.peekOfflineQueue({ signal: ctx.signal }), ctx);
      const out = await espera(() => cua.drainOfflineQueue(replayPort, { signal: ctx.signal }), ctx);
      const after = await espera(() => cua.peekOfflineQueue({ signal: ctx.signal }), ctx);
      // Un cap retirat amb resolveBlockedHead avança l'ack però no és una confirmació del servidor.
      const retirats = new Set((after.resolved ?? []).map(r => r.opId));
      const accepted = before.entries.filter(op => op.seq <= after.ack.seq && !retirats.has(op.opId));
      if (accepted.length) mutacionsConfirmades += 1;
      for (const [name, d] of lectura) {
        if (!d.projecta || !accepted.some(op => op.resource === d.colleccio)) continue;
        try {
          await espera(() => persistencia.actualitza(d.colleccio, rows => {
            ctx.check();
            return avancaEpoch(rows.map(row => {
              if (row.kind !== 'backend-response' || !row.id.startsWith(`backend:${name}:`)) return row;
              let value = row.value;
              for (const op of accepted) if (op.resource === d.colleccio) value = copiaJsonRural(d.projecta(value, op, { selectors: row.selectors }));
              return { id: row.id, kind: row.kind, selectors: row.selectors ?? [], value };
            }));
          }, { signal: ctx.signal }), ctx);
        } catch (e) { ctx.check(); notify(e.code ?? 'SDP-OFFLINE-CACHE', name); }
      }
      ctx.check(); return out;
    } finally { ctx.close(); }
  }
  async function write(name, d, args) {
    const ctx = context(senyalDelsArguments(args));
    try {
      const input = copiaJsonRural(d.prepara(args));
      if (input.resource !== d.resource) throw fail('SDP-OFFLINE-CONFIG', 'La mutació no correspon al descriptor.');
      ctx.check();
      // Sense carrera contra un CAS en curs: el temps límit avorta el signal, que la
      // cua només respecta abans del commit; una intenció durable mai es dona per fallida.
      const timer = setTimeout(() => ctx.abort(fail('SDP-OFFLINE-TIMEOUT', 'Temps límit de l’enxufe offline.')), timeoutMs);
      let op;
      try { op = await cua.enqueueOfflineMutation(input, { signal: ctx.signal }); }
      catch (e) { ctx.check(); throw e; }
      finally { clearTimeout(timer); }
      const rebut = (queued, status) => d.resultat(Object.freeze({ op: copiaJsonRural(op), queued, committed: !queued, status }));
      let result = { status: 'pending', acknowledged: 0 };
      let pending;
      try {
        ctx.check();
        if (estaConnectat()) result = await drena({ signal: ctx.signal });
        ctx.check();
        pending = await espera(() => cua.peekOfflineQueue({ signal: ctx.signal }), ctx);
        ctx.check();
      } catch (e) {
        // La intenció ja és durable: un abort o un temps esgotat posterior torna un rebut.
        if (!ctx.signal.aborted && e?.code !== 'SDP-OFFLINE-TIMEOUT') throw e;
        checkScope();
        return rebut(true, e?.code === 'SDP-OFFLINE-TIMEOUT' ? 'retryable' : 'cancelled');
      }
      const queued = pending.entries.some(row => row.opId === op.opId);
      // Només el cap bloquejat l'ha rebutjat el servidor; les posteriors no hi han arribat.
      if (queued && pending.blocked?.opId === op.opId) throw fail('SDP-OFFLINE-REBUTJADA', 'El servidor ha rebutjat l’operació; queda bloquejada per a revisió.');
      return rebut(queued, queued && pending.blocked ? 'blocked-behind' : result.status);
    } finally { ctx.close(); }
  }
  async function writeDirecte(name, fn, args) {
    const ctx = context(senyalDelsArguments(args));
    try {
      // Cap retry, cua ni temps límit propi: una RPC despatxada ja no es pot avortar,
      // i un SDP-OFFLINE-TIMEOUT amagaria un commit. El seu temps límit és el del port.
      const result = await espera(() => fn(...args), ctx, false);
      ctx.check(); mutacionsConfirmades += 1;
      try {
        await espera(() => persistencia.actualitza('notes', rows => {
          ctx.check(); return avancaEpoch(rows.filter(r => r.kind !== 'backend-response'));
        }, { signal: ctx.signal }), ctx);
      } catch (e) { ctx.check(); notify(e.code ?? 'SDP-OFFLINE-CACHE', name); }
      return result;
    } finally { ctx.close(); }
  }
  const backend = Object.create(null);
  for (const name of CONTRACTE_BACKEND) {
    const fn = metode(port, name);
    if (!fn) continue;
    backend[name] = lectura.has(name) ? (...args) => read(name, lectura.get(name), args)
      : escriptura.has(name) ? (...args) => write(name, escriptura.get(name), args)
        : MUTACIONS.has(name) ? (...args) => writeDirecte(name, fn, args)
        : (...args) => { if (closed) throw avortat(); return fn(...args); };
  }
  const online = () => { drena().catch(e => notify(e.code ?? 'SDP-OFFLINE-DRAIN', 'online')); };
  eventTarget?.addEventListener?.('online', online);
  function destroy() {
    if (closed) return;
    closed = true;
    eventTarget?.removeEventListener?.('online', online);
    for (const control of active) control.abort(avortat());
    active.clear(); sequencies.clear();
  }
  const teardown = metode(port, 'destroy');
  backend.destroy = () => { destroy(); return teardown?.(); };
  return Object.freeze({ backend: Object.freeze(backend), abast, drena, destroy });
}

export const enxufeBackendOfflineFirst = creaEnxufeBackendOfflineFirst;
