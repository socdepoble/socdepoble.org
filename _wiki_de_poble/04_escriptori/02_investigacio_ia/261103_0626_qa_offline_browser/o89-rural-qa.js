// ../../../../../private/tmp/sdp-codex-o89/candidate/src/data/local/persistenciaLocalRural.js
var COLLECCIONS_RURALS = Object.freeze(["bans", "notes", "directory", "calendar", "catalog"]);
var ESQUEMA_INSTANTANIA_RURAL = "sdp.instantania-local-rural.v1";
var ESQUEMA_COLLECCIONS = "sdp.colleccions-rural.v1";
var DB = "sdp-rural-v1";
var STORE = "estat";
var CLAU_COLLECCIONS = "colleccions";
var MAX_BYTES = 4 * 1024 * 1024;
var PROHIBIDES = /* @__PURE__ */ new Set([
  "proto",
  "prototype",
  "constructor",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "authorization",
  "token",
  "secret",
  "credentials",
  "session",
  "auth",
  "jwt",
  "password",
  "contrasenya",
  "privatekey",
  "secretkey",
  "servicekey",
  "servicerolekey",
  "apikey"
]);
var encoder = new TextEncoder();
var error = (code, missatge, cause) => Object.assign(new Error(missatge, cause ? { cause } : void 0), { code });
var invalid = (missatge) => error("SDP-RURAL-INVALID", missatge);
var cancel = () => Object.assign(error("SDP-RURAL-CANCEL", "Operaci\xF3 rural cancel\xB7lada."), { name: "AbortError" });
var esPla = (valor) => valor !== null && typeof valor === "object" && !Array.isArray(valor) && (Object.getPrototypeOf(valor) === Object.prototype || Object.getPrototypeOf(valor) === null);
var enter = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
var normalitzaClau = (clau) => clau.toLowerCase().replace(/[_-]/g, "");
function copiaJSON(valor, limitBytes = MAX_BYTES) {
  const vist = /* @__PURE__ */ new WeakSet();
  let nodes = 0;
  let pressupost = 0;
  function copia(v, depth) {
    nodes += 1;
    if (depth > 24 || nodes > 5e4) throw invalid("Estructura JSON rural massa gran.");
    if (v === null || typeof v === "boolean") return v;
    if (typeof v === "number") {
      if (!Number.isFinite(v)) throw invalid("Nombre JSON rural no finit.");
      return Object.is(v, -0) ? 0 : v;
    }
    if (typeof v === "string") {
      pressupost += v.length;
      if (pressupost > limitBytes) throw invalid("Dades rurals per damunt de la quota.");
      return v;
    }
    if (typeof v !== "object" || vist.has(v) || !Array.isArray(v) && !esPla(v)) throw invalid("Tipus JSON rural no adm\xE9s.");
    if (Object.getOwnPropertySymbols(v).length) throw invalid("S\xEDmbols no admesos.");
    vist.add(v);
    const descriptors = Object.getOwnPropertyDescriptors(v);
    let result3;
    if (Array.isArray(v)) {
      if (v.length > 1e4 || Object.keys(descriptors).length !== v.length + 1) throw invalid("Llista rural inv\xE0lida.");
      result3 = [];
      for (let i = 0; i < v.length; i += 1) {
        const d = descriptors[i];
        if (!d || !Object.hasOwn(d, "value") || !d.enumerable) throw invalid("Llista amb buits o accessors.");
        result3.push(copia(d.value, depth + 1));
      }
    } else {
      result3 = {};
      for (const key of Object.keys(descriptors).sort()) {
        const d = descriptors[key];
        if (!key || key.length > 128 || /[\u0000-\u001f]/.test(key) || PROHIBIDES.has(normalitzaClau(key)) || !Object.hasOwn(d, "value") || !d.enumerable) throw invalid("Clau JSON rural no admesa.");
        pressupost += key.length;
        if (pressupost > limitBytes) throw invalid("Dades rurals per damunt de la quota.");
        Object.defineProperty(result3, key, { value: copia(d.value, depth + 1), enumerable: true, writable: true, configurable: true });
      }
    }
    vist.delete(v);
    return result3;
  }
  const result2 = copia(valor, 0);
  if (encoder.encode(JSON.stringify(result2)).byteLength > limitBytes) throw invalid("Quota de bytes rural excedida.");
  return result2;
}
function clausExactes(objecte, keys2) {
  if (!esPla(objecte) || Object.keys(objecte).sort().join("\0") !== [...keys2].sort().join("\0")) throw invalid("Esquema rural desconegut.");
}
function textAbast(text, max) {
  if (typeof text !== "string" || !text || text !== text.trim() || text.length > max || /[\u0000-\u001f\u007f]/.test(text)) throw invalid("Abast rural inv\xE0lid.");
  return text;
}
function validaAbast(entrada) {
  const a = copiaJSON(entrada, 4096);
  clausExactes(a, ["persona", "tenant", "endpoint", "mode"]);
  const abast2 = {
    persona: textAbast(a.persona, 256),
    tenant: textAbast(a.tenant, 256),
    endpoint: textAbast(a.endpoint, 2048),
    mode: textAbast(a.mode, 64)
  };
  if (!["local", "seed"].includes(abast2.endpoint)) {
    let u;
    try {
      u = new URL(abast2.endpoint);
    } catch {
      throw invalid("Endpoint rural malformat.");
    }
    if (!["https:", "http:"].includes(u.protocol) || u.username || u.password || u.search || u.hash) {
      throw invalid("L\u2019endpoint rural ha de ser HTTP(S), sense credencials, consulta ni fragment.");
    }
  }
  return Object.freeze(abast2);
}
var canon = (valor) => JSON.stringify(copiaJSON(valor));
var abastIgual = (a, b) => canon(a) === canon(b);
var keyValida = (key) => textAbast(key, 512);
function comprovaSenyal(signal) {
  if (signal?.aborted) throw cancel();
}
function estatValid(entrada, limitBytes) {
  if (entrada === void 0 || entrada === null) return null;
  const state = copiaJSON(entrada, limitBytes);
  if (!esPla(state) || !enter(state.revision, 1, Number.MAX_SAFE_INTEGER)) throw invalid("Revisi\xF3 rural inv\xE0lida.");
  return state;
}
function esperaAcotada(promesa, signal, timeoutMs, pendents) {
  comprovaSenyal(signal);
  return new Promise((resolve, reject) => {
    let fet = false;
    const neteja = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      pendents?.delete(tancat);
    };
    const acaba = (e, valor) => {
      if (fet) return;
      fet = true;
      neteja();
      if (e) reject(e);
      else resolve(valor);
    };
    const abort = () => acaba(cancel());
    const tancat = () => acaba(error("SDP-RURAL-TANCAT", "Magatzem rural tancat."));
    const timer = setTimeout(() => acaba(error("SDP-RURAL-TIMEOUT", "Operaci\xF3 rural fora de termini.")), timeoutMs);
    signal?.addEventListener("abort", abort, { once: true });
    pendents?.add(tancat);
    Promise.resolve(promesa).then((v) => acaba(null, v), (e) => acaba(e));
    if (signal?.aborted) abort();
  });
}
function errorIDB(cause) {
  if (cause?.code?.startsWith?.("SDP-RURAL-")) return cause;
  return error(cause?.name === "QuotaExceededError" ? "SDP-RURAL-QUOTA" : "SDP-RURAL-IDB", "No s\u2019ha pogut confirmar la persist\xE8ncia rural.", cause);
}
function creaMotorRural({
  abast: abast2,
  motor = "indexeddb",
  indexedDB: indexedDB2 = globalThis.indexedDB,
  memoria = /* @__PURE__ */ new Map(),
  limitBytes = MAX_BYTES,
  timeoutMs = 1e4
} = {}) {
  const scope = validaAbast(abast2);
  if (!["memoria", "indexeddb"].includes(motor)) throw invalid("Motor rural desconegut.");
  if (!enter(limitBytes, 512, 32 * 1024 * 1024) || !enter(timeoutMs, 1, 6e4)) throw invalid("L\xEDmits rurals inv\xE0lids.");
  if (motor === "memoria" && !(memoria instanceof Map)) throw invalid("La mem\xF2ria rural ha de ser un Map expl\xEDcit.");
  const prefix = canon(scope);
  const keyOf = (key) => JSON.stringify([prefix, keyValida(key)]);
  let closed = false;
  let database = null;
  let opening = null;
  let failOpening = null;
  const pendents = /* @__PURE__ */ new Set();
  const active2 = /* @__PURE__ */ new Set();
  const check = (signal) => {
    comprovaSenyal(signal);
    if (closed) throw error("SDP-RURAL-TANCAT", "Magatzem rural tancat.");
  };
  function open() {
    check();
    if (!indexedDB2 || typeof indexedDB2.open !== "function") return Promise.reject(error("SDP-RURAL-NO-IDB", "IndexedDB no disponible; no es fa fallback a mem\xF2ria."));
    if (database) return Promise.resolve(database);
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => fail2(error("SDP-RURAL-TIMEOUT", "Obertura rural fora de termini.")), timeoutMs);
      const fail2 = (cause) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        failOpening = null;
        reject(errorIDB(cause));
      };
      failOpening = fail2;
      let request;
      try {
        request = indexedDB2.open(DB, 1);
      } catch (e) {
        fail2(e);
        return;
      }
      request.onupgradeneeded = () => {
        try {
          if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
        } catch (e) {
          try {
            request.transaction.abort();
          } catch {
          }
          fail2(e);
        }
      };
      request.onerror = () => fail2(request.error);
      request.onblocked = () => fail2(error("SDP-RURAL-BLOCKED", "Una altra connexi\xF3 bloqueja el magatzem rural."));
      request.onsuccess = () => {
        if (settled || closed) {
          request.result.close();
          fail2(error("SDP-RURAL-TANCAT", "Magatzem rural tancat."));
          return;
        }
        settled = true;
        clearTimeout(timer);
        failOpening = null;
        database = request.result;
        const connection = database;
        const oblida = () => {
          if (database === connection) {
            database = null;
            opening = null;
          }
        };
        connection.onversionchange = () => {
          connection.close();
          oblida();
        };
        connection.onclose = oblida;
        resolve(connection);
      };
    });
    opening = opening.catch((e) => {
      opening = null;
      throw e;
    });
    return opening;
  }
  async function transaccio(key, transforma = null, { signal } = {}) {
    check(signal);
    const clau = keyOf(key);
    if (motor === "memoria") {
      const actual = estatValid(memoria.get(clau), limitBytes);
      const result2 = transforma ? transforma(actual) : { value: actual };
      if (!result2 || typeof result2.then === "function") throw invalid("La transformaci\xF3 rural ha de ser s\xEDncrona.");
      check(signal);
      if (Object.hasOwn(result2, "next")) memoria.set(clau, estatValid(result2.next, limitBytes));
      return copiaJSON(result2.value, limitBytes);
    }
    const db = await esperaAcotada(open(), signal, timeoutMs, pendents);
    check(signal);
    return new Promise((resolve, reject) => {
      let tx;
      let value;
      let failure2;
      let settled = false;
      let timer;
      const finish = (cause) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        active2.delete(abort);
        if (cause) reject(errorIDB(cause));
        else {
          try {
            check(signal);
            resolve(copiaJSON(value, limitBytes));
          } catch (e) {
            reject(e);
          }
        }
      };
      const abort = () => {
        failure2 = cancel();
        try {
          tx?.abort();
        } catch {
          finish(failure2);
        }
      };
      try {
        tx = db.transaction(STORE, transforma ? "readwrite" : "readonly");
        active2.add(abort);
        signal?.addEventListener("abort", abort, { once: true });
        timer = setTimeout(() => {
          failure2 = error("SDP-RURAL-TIMEOUT", "Transacci\xF3 rural fora de termini.");
          try {
            tx.abort();
          } catch {
            finish(failure2);
          }
        }, timeoutMs);
        tx.oncomplete = () => finish();
        tx.onabort = () => finish(failure2 || tx.error || error("SDP-RURAL-IDB", "Transacci\xF3 rural avortada."));
        tx.onerror = () => {
          failure2 ||= tx.error;
        };
        const store = tx.objectStore(STORE);
        const req = store.get(clau);
        req.onsuccess = () => {
          try {
            check(signal);
            const actual = estatValid(req.result, limitBytes);
            const result2 = transforma ? transforma(actual) : { value: actual };
            if (!result2 || typeof result2.then === "function") throw invalid("La transformaci\xF3 rural ha de ser s\xEDncrona.");
            value = copiaJSON(result2.value, limitBytes);
            if (Object.hasOwn(result2, "next")) store.put(estatValid(result2.next, limitBytes), clau);
          } catch (e) {
            failure2 = e;
            try {
              tx.abort();
            } catch {
              finish(e);
            }
          }
        };
      } catch (e) {
        failure2 = e;
        try {
          tx?.abort();
        } catch {
        }
        finish(e);
      }
    });
  }
  function close() {
    closed = true;
    failOpening?.(error("SDP-RURAL-TANCAT", "Magatzem rural tancat."));
    for (const stop of [...pendents]) stop();
    for (const abort of [...active2]) abort();
    database?.close();
    database = null;
  }
  return { transaccio, close, check, abast: scope, limitBytes, timeoutMs, pendents };
}
function creaMagatzemAtomicRural(opcions) {
  const motor = creaMotorRural(opcions);
  return Object.freeze({
    abast: motor.abast,
    read: (key, config) => motor.transaccio(key, null, config),
    async compareAndSwap(key, expectedRevision, nextState, config) {
      if (!enter(expectedRevision, 0, Number.MAX_SAFE_INTEGER - 1)) throw invalid("Revisi\xF3 esperada inv\xE0lida.");
      const next = estatValid(nextState, motor.limitBytes);
      if (!next || next.revision !== expectedRevision + 1) throw invalid("La nova revisi\xF3 ha de ser expectedRevision+1.");
      return motor.transaccio(key, (actual) => (actual?.revision ?? 0) === expectedRevision ? { next, value: true } : { value: false }, config);
    },
    close: motor.close
  });
}
function buides() {
  return Object.fromEntries(COLLECCIONS_RURALS.map((col) => [col, []]));
}
function validaColleccions(entrada, limitRegistres, limitBytes) {
  const cols = copiaJSON(entrada, limitBytes);
  clausExactes(cols, COLLECCIONS_RURALS);
  let total = 0;
  for (const col of COLLECCIONS_RURALS) {
    if (!Array.isArray(cols[col])) throw invalid("Una col\xB7lecci\xF3 rural ha de ser una llista.");
    total += cols[col].length;
    if (total > limitRegistres) throw invalid("Massa registres en la instant\xE0nia rural.");
    const ids = /* @__PURE__ */ new Set();
    for (const row of cols[col]) {
      if (!esPla(row) || typeof row.id !== "string" || !row.id || row.id.length > 512 || ids.has(row.id)) throw invalid("ID rural buit, duplicat o no textual.");
      ids.add(row.id);
    }
  }
  return cols;
}
function columna(col) {
  if (!COLLECCIONS_RURALS.includes(col)) throw invalid("Col\xB7lecci\xF3 rural desconeguda.");
  return col;
}
function creaPersistenciaLocalRural(opcions = {}) {
  const motor = creaMotorRural(opcions);
  const { ara = Date.now, crypto: crypto2 = globalThis.crypto, limitRegistres = 5e3 } = opcions;
  if (typeof ara !== "function" || !enter(limitRegistres, 1, 1e4)) throw invalid("Opcions de la instant\xE0nia rural inv\xE0lides.");
  const colsValides = (cols) => validaColleccions(cols, limitRegistres, motor.limitBytes);
  function contingut(state) {
    if (state === null) return buides();
    clausExactes(state, ["schema", "revision", "collections"]);
    if (state.schema !== ESQUEMA_COLLECCIONS) throw invalid("Estat de col\xB7leccions desconegut.");
    return colsValides(state.collections);
  }
  async function digest2(payload, signal) {
    motor.check(signal);
    if (typeof crypto2?.subtle?.digest !== "function") throw error("SDP-RURAL-NO-CRYPTO", "SHA-256 no disponible.");
    const hash = await esperaAcotada(crypto2.subtle.digest("SHA-256", encoder.encode(JSON.stringify(copiaJSON(payload, motor.limitBytes)))), signal, motor.timeoutMs, motor.pendents);
    motor.check(signal);
    return [...new Uint8Array(hash)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  async function actualitza(col, transforma, config = {}) {
    columna(col);
    if (typeof transforma !== "function") throw invalid("Cal una transformaci\xF3 s\xEDncrona.");
    return motor.transaccio(CLAU_COLLECCIONS, (state) => {
      const collections = contingut(state);
      const result2 = transforma(collections[col]);
      if (result2?.then || !Array.isArray(result2)) throw invalid("La transformaci\xF3 retorna una llista s\xEDncrona.");
      collections[col] = result2;
      const next = { schema: ESQUEMA_COLLECCIONS, revision: (state?.revision ?? 0) + 1, collections: colsValides(collections) };
      return { next, value: next.collections[col] };
    }, config);
  }
  const api = {
    abast: motor.abast,
    async llegix(col, config) {
      columna(col);
      return contingut(await motor.transaccio(CLAU_COLLECCIONS, null, config))[col];
    },
    desa(col, records, config) {
      const copia = copiaJSON(records, motor.limitBytes);
      return actualitza(col, () => copia, config);
    },
    actualitza,
    async exportaInstantaniaLocal({ signal } = {}) {
      const collections = contingut(await motor.transaccio(CLAU_COLLECCIONS, null, { signal }));
      const createdAt = ara();
      if (!enter(createdAt, 0, Number.MAX_SAFE_INTEGER)) throw invalid("Rellotge rural inv\xE0lid.");
      const payload = { schema: ESQUEMA_INSTANTANIA_RURAL, abast: motor.abast, createdAt, collections };
      const sha256 = await digest2(payload, signal);
      return copiaJSON({ schema: payload.schema, abast: payload.abast, createdAt, collections, sha256 }, motor.limitBytes);
    },
    async restauraInstantaniaLocal(entrada, { signal } = {}) {
      motor.check(signal);
      let raw = entrada;
      if (typeof raw === "string") {
        if (encoder.encode(raw).byteLength > motor.limitBytes) throw invalid("Instant\xE0nia massa gran.");
        try {
          raw = JSON.parse(raw);
        } catch {
          throw invalid("JSON de la instant\xE0nia inv\xE0lid.");
        }
      }
      const snap = copiaJSON(raw, motor.limitBytes);
      clausExactes(snap, ["schema", "abast", "createdAt", "collections", "sha256"]);
      if (snap.schema !== ESQUEMA_INSTANTANIA_RURAL || !enter(snap.createdAt, 0, Number.MAX_SAFE_INTEGER) || typeof snap.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(snap.sha256)) throw invalid("Esquema de la instant\xE0nia inv\xE0lid.");
      const scope = validaAbast(snap.abast);
      if (!abastIgual(scope, motor.abast)) throw error("SDP-RURAL-ABAST", "La instant\xE0nia \xE9s d\u2019un altre \xE0mbit.");
      const collections = colsValides(snap.collections);
      const before = await motor.transaccio(CLAU_COLLECCIONS, null, { signal });
      const payload = { schema: snap.schema, abast: scope, createdAt: snap.createdAt, collections };
      if (await digest2(payload, signal) !== snap.sha256) throw error("SDP-RURAL-HASH", "SHA-256 de la instant\xE0nia divergent.");
      return motor.transaccio(CLAU_COLLECCIONS, (state) => {
        if ((state?.revision ?? 0) !== (before?.revision ?? 0)) throw error("SDP-RURAL-CONFLICTE", "El dest\xED ha canviat durant la verificaci\xF3.");
        const next = { schema: ESQUEMA_COLLECCIONS, revision: (state?.revision ?? 0) + 1, collections };
        return { next, value: { revision: next.revision, registres: COLLECCIONS_RURALS.reduce((n, col) => n + collections[col].length, 0), integritat: "sha256-verificada", autenticitat: "no-verificada" } };
      }, { signal });
    },
    tanca: motor.close,
    close: motor.close
  };
  return Object.freeze(api);
}

// ../../../../../private/tmp/sdp-codex-o89/candidate/src/data/local/cuaOperacionsOffline.js
var ESQUEMA_CUA_OFFLINE = "sdp.cua-offline.v1";
var ESQUEMA_OP = "sdp.mutacio-offline.v1";
var GENESI = "0".repeat(64);
var MAX = Number.MAX_SAFE_INTEGER;
var MAX_OP_BYTES = 128 * 1024;
var MAX_STATE_BYTES = 4 * 1024 * 1024;
var contextos = /* @__PURE__ */ new WeakMap();
var encoder2 = new TextEncoder();
var err = (code) => Object.assign(new Error(code), { code });
var invalid2 = () => err("OFFLINE_INVALID_INPUT");
var enter2 = (n, min = 0, max = MAX) => Number.isSafeInteger(n) && n >= min && n <= max;
var esObjecte = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
var igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var idValid = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
function json(value, limit = MAX_STATE_BYTES) {
  try {
    return copiaJSON(value, limit);
  } catch {
    throw invalid2();
  }
}
function keys(value, allowed, required = allowed) {
  if (!esObjecte(value) || Object.keys(value).some((k) => !allowed.includes(k)) || required.some((k) => !Object.hasOwn(value, k))) throw invalid2();
}
function recordId(v) {
  if (typeof v !== "string" || v.length < 1 || v.length > 256 || v !== v.trim() || /[\u0000-\u001f\u007f/\\]/.test(v) || v === "." || v === "..") throw invalid2();
  return v;
}
function vector(v) {
  if (!esObjecte(v) || Object.keys(v).length > 64) throw invalid2();
  for (const [node, n] of Object.entries(v)) if (!idValid(node) || !enter2(n)) throw invalid2();
  return v;
}
function clock(v) {
  keys(v, ["wallTime", "counter", "nodeId"]);
  if (!enter2(v.wallTime) || !enter2(v.counter) || !idValid(v.nodeId)) throw invalid2();
  return v;
}
function unionVector(a, b) {
  const out2 = {};
  for (const node of /* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)])) out2[node] = Math.max(a[node] ?? 0, b[node] ?? 0);
  return vector(json(out2));
}
function seguentRellotgeHLC(local, observed, physicalTime, nodeId) {
  if (!enter2(physicalTime) || !idValid(nodeId)) throw invalid2();
  const l = local == null ? null : clock(json(local));
  const r = observed == null ? null : clock(json(observed));
  const wallTime = Math.max(physicalTime, l?.wallTime ?? 0, r?.wallTime ?? 0);
  let counter = 0;
  if (l?.wallTime === wallTime && r?.wallTime === wallTime) counter = Math.max(l.counter, r.counter) + 1;
  else if (l?.wallTime === wallTime) counter = l.counter + 1;
  else if (r?.wallTime === wallTime) counter = r.counter + 1;
  if (!enter2(counter)) throw err("OFFLINE_CLOCK_EXHAUSTED");
  return { wallTime, counter, nodeId };
}
function comparaRellotgesHLC(a, b) {
  const x = clock(json(a));
  const y = clock(json(b));
  for (const k of ["wallTime", "counter", "nodeId"]) {
    if (x[k] < y[k]) return -1;
    if (x[k] > y[k]) return 1;
  }
  return 0;
}
function cryptoFor(value) {
  if (!value?.subtle?.digest || typeof value.randomUUID !== "function") throw err("OFFLINE_CRYPTO_UNAVAILABLE");
  return value;
}
async function digest(crypto2, body) {
  const bytes = encoder2.encode(JSON.stringify(json(body, MAX_OP_BYTES)));
  const sha = await crypto2.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(sha), (b) => b.toString(16).padStart(2, "0")).join("");
}
var hashValid = (h2) => typeof h2 === "string" && /^[a-f0-9]{64}$/.test(h2);
function withoutHash(op) {
  const body = json(op, MAX_OP_BYTES);
  delete body.hash;
  return body;
}
function blank(ctx) {
  return {
    schema: ESQUEMA_CUA_OFFLINE,
    revision: 0,
    abast: json(ctx.abast),
    nodeId: ctx.nodeId,
    clock: null,
    context: {},
    nextSeq: 1,
    ack: { seq: 0, hash: GENESI },
    entries: [],
    inflight: null,
    blocked: null
  };
}
function schemaState(value) {
  keys(value, ["schema", "revision", "abast", "nodeId", "clock", "context", "nextSeq", "ack", "entries", "inflight", "blocked"]);
  if (value.schema !== ESQUEMA_CUA_OFFLINE || !enter2(value.revision) || !idValid(value.nodeId) || !enter2(value.nextSeq, 1) || !Array.isArray(value.entries) || value.entries.length > 1e3) throw invalid2();
  validaAbast(value.abast);
  if (value.clock != null && clock(value.clock).nodeId !== value.nodeId) throw invalid2();
  vector(value.context);
  keys(value.ack, ["seq", "hash"]);
  if (!enter2(value.ack.seq) || !hashValid(value.ack.hash) || value.ack.seq === 0 && value.ack.hash !== GENESI) throw invalid2();
  if (value.nextSeq !== value.ack.seq + value.entries.length + 1) throw invalid2();
  if ((value.context[value.nodeId] ?? 0) !== value.nextSeq - 1 || value.nextSeq > 1 && value.clock == null) throw invalid2();
  if (value.inflight != null) {
    keys(value.inflight, ["opId", "leaseId", "claimedAt", "expiresAt"]);
    if (!idValid(value.inflight.opId) || !idValid(value.inflight.leaseId) || !enter2(value.inflight.expiresAt) || !enter2(value.inflight.claimedAt) || value.inflight.expiresAt <= value.inflight.claimedAt || value.entries[0]?.opId !== value.inflight.opId) throw invalid2();
  }
  if (value.blocked != null) {
    keys(value.blocked, ["opId", "kind", "code"]);
    if (!idValid(value.blocked.opId) || !["auth", "validation", "protocol", "unexpected"].includes(value.blocked.kind) || !idValid(value.blocked.code) || value.entries[0]?.opId !== value.blocked.opId) throw invalid2();
  }
}
function schemaOp(op, state, seq, prev) {
  keys(op, [
    "schema",
    "opId",
    "nodeId",
    "seq",
    "abast",
    "resource",
    "recordId",
    "action",
    "changes",
    "baseVersion",
    "context",
    "version",
    "hlc",
    "fieldClocks",
    "prevHash",
    "hash"
  ]);
  if (op.schema !== ESQUEMA_OP || !idValid(op.opId) || op.nodeId !== state.nodeId || op.seq !== seq || !igual(op.abast, state.abast) || op.prevHash !== prev || !hashValid(op.hash) || typeof op.resource !== "string" || !/^[a-z][a-z0-9_.-]{0,127}$/.test(op.resource) || !["create", "update", "delete"].includes(op.action) || !esObjecte(op.changes)) throw invalid2();
  recordId(op.recordId);
  clock(op.hlc);
  vector(op.context);
  vector(op.version);
  if (op.hlc.nodeId !== state.nodeId || op.version[state.nodeId] !== op.seq || !esObjecte(op.fieldClocks) || op.baseVersion !== null && !enter2(op.baseVersion) && !(typeof op.baseVersion === "string" && op.baseVersion.length <= 128)) throw invalid2();
  if (op.action === "delete" && Object.keys(op.changes).length) throw invalid2();
  if ((op.context[state.nodeId] ?? 0) !== op.seq - 1 || !igual(op.version, unionVector(op.context, { [state.nodeId]: op.seq }))) throw invalid2();
  for (const c of Object.values(op.fieldClocks)) clock(c);
}
async function verifyOfflineQueueChain(queueOrState, { crypto: crypto2 = globalThis.crypto } = {}) {
  try {
    const ctx = contextos.get(queueOrState);
    const state = ctx ? await readState(ctx) : json(queueOrState);
    const c = cryptoFor(ctx?.crypto ?? crypto2);
    schemaState(state);
    let seq = state.ack.seq;
    let previous = state.ack.hash;
    let previousClock = null;
    const ids = /* @__PURE__ */ new Set();
    for (const op of state.entries) {
      seq += 1;
      schemaOp(op, state, seq, previous);
      if (ids.has(op.opId) || previousClock && comparaRellotgesHLC(previousClock, op.hlc) >= 0 || await digest(c, withoutHash(op)) !== op.hash) throw invalid2();
      ids.add(op.opId);
      previous = op.hash;
      previousClock = op.hlc;
    }
    if (previousClock && (!state.clock || comparaRellotgesHLC(previousClock, state.clock) !== 0 || !igual(state.context, state.entries.at(-1).version))) throw invalid2();
    return { valid: true, anchoredAt: json(state.ack), pending: state.entries.length, tailHash: previous, authenticated: false };
  } catch {
    return { valid: false, code: "OFFLINE_INTEGRITY" };
  }
}
function active(ctx, signal) {
  if (!ctx.open || ctx.isScopeActive(ctx.abast) !== true) throw err("OFFLINE_SCOPE_INACTIVE");
  if (signal?.aborted) throw Object.assign(err("OFFLINE_CANCELLED"), { name: "AbortError" });
}
function context(queue) {
  const ctx = contextos.get(queue);
  if (!ctx) throw invalid2();
  return ctx;
}
async function readState(ctx, signal) {
  active(ctx, signal);
  const raw = await storageRequest(ctx, signal, (joined) => ctx.store.read(ctx.key, { signal: joined }));
  active(ctx, signal);
  const state = raw == null ? blank(ctx) : json(raw, ctx.maxBytes);
  schemaState(state);
  if (state.nodeId !== ctx.nodeId || !igual(state.abast, json(ctx.abast))) throw err("OFFLINE_INTEGRITY");
  const checked = await verifyOfflineQueueChain(state, { crypto: ctx.crypto });
  active(ctx, signal);
  if (!checked.valid) throw err("OFFLINE_INTEGRITY");
  return state;
}
async function cas(ctx, state, signal) {
  active(ctx, signal);
  const previous = state.revision;
  if (!enter2(previous + 1)) throw err("OFFLINE_REVISION_EXHAUSTED");
  state.revision += 1;
  const changed = await storageRequest(ctx, signal, (joined) => ctx.store.compareAndSwap(ctx.key, previous, json(state, ctx.maxBytes), { signal: joined }));
  active(ctx, signal);
  return changed;
}
async function storageRequest(ctx, signal, action) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const sources = [ctx.lifetime.signal, signal].filter(Boolean);
  for (const s of sources) {
    s.addEventListener("abort", abort, { once: true });
    if (s.aborted) abort();
  }
  try {
    return await action(controller.signal);
  } finally {
    for (const s of sources) s.removeEventListener("abort", abort);
  }
}
async function revise(ctx, transform, signal) {
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const state = await readState(ctx, signal);
    const result2 = await transform(state);
    active(ctx, signal);
    if (result2.write === false || await cas(ctx, state, signal)) return result2.value;
  }
  throw err("OFFLINE_CAS_BUSY");
}
function creaCuaOperacionsOffline({
  abast: abast2,
  nodeId,
  store,
  motor = "indexeddb",
  indexedDB: indexedDB2 = globalThis.indexedDB,
  memoria,
  crypto: crypto2 = globalThis.crypto,
  ara = Date.now,
  maxOperations = 1e3,
  maxBytes = MAX_STATE_BYTES,
  leaseMs = 3e4,
  timeoutMs = 15e3,
  isScopeActive = () => true
} = {}) {
  let scope;
  try {
    scope = validaAbast(abast2);
  } catch {
    throw invalid2();
  }
  if (!idValid(nodeId) || typeof ara !== "function" || typeof isScopeActive !== "function" || !enter2(maxOperations, 1, 1e3) || !enter2(maxBytes, 512, MAX_STATE_BYTES) || !enter2(leaseMs, 1, 6e4) || !enter2(timeoutMs, 1, 6e4)) throw invalid2();
  const storage = store ?? creaMagatzemAtomicRural({ abast: scope, motor, indexedDB: indexedDB2, memoria, limitBytes: maxBytes });
  if (typeof storage.read !== "function" || typeof storage.compareAndSwap !== "function") throw invalid2();
  try {
    if (!igual(json(validaAbast(storage.abast)), json(scope))) throw invalid2();
  } catch {
    throw invalid2();
  }
  const ctx = {
    abast: scope,
    nodeId,
    store: storage,
    crypto: cryptoFor(crypto2),
    ara,
    maxOperations,
    maxBytes,
    leaseMs,
    timeoutMs,
    isScopeActive,
    key: `offline-queue:${nodeId}`,
    open: true,
    drain: null,
    controller: null,
    lifetime: new AbortController(),
    ownsStore: store == null
  };
  const queue = Object.freeze({
    abast: scope,
    enqueueOfflineMutation: (op, options) => enqueueOfflineMutation(queue, op, options),
    peekOfflineQueue: (options) => peekOfflineQueue(queue, options),
    drainOfflineQueue: (port, options) => drainOfflineQueue(queue, port, options),
    verifyOfflineQueueChain: () => verifyOfflineQueueChain(queue),
    resume: () => revise(ctx, (s) => {
      s.blocked = null;
      return { value: true };
    }),
    close: () => {
      ctx.open = false;
      ctx.lifetime.abort();
      ctx.controller?.abort();
      if (ctx.ownsStore) ctx.store.close();
    }
  });
  contextos.set(queue, ctx);
  return queue;
}
async function peekOfflineQueue(queue, { signal } = {}) {
  return json(await readState(context(queue), signal));
}
async function enqueueOfflineMutation(queue, input, { signal } = {}) {
  const ctx = context(queue);
  active(ctx, signal);
  const value = json(input, MAX_OP_BYTES);
  keys(value, ["resource", "recordId", "action", "changes", "baseVersion", "causalContext", "observedHlc"], ["resource", "recordId", "action", "changes"]);
  if (typeof value.resource !== "string" || !/^[a-z][a-z0-9_.-]{0,127}$/.test(value.resource) || !["create", "update", "delete"].includes(value.action) || !esObjecte(value.changes) || Object.keys(value.changes).length > 128 || value.action === "delete" && Object.keys(value.changes).length) throw invalid2();
  recordId(value.recordId);
  if (value.baseVersion != null && !enter2(value.baseVersion) && !(typeof value.baseVersion === "string" && value.baseVersion.length <= 128)) throw invalid2();
  const observed = value.observedHlc == null ? null : clock(value.observedHlc);
  const causal = value.causalContext == null ? {} : vector(value.causalContext);
  const opId = ctx.crypto.randomUUID();
  return revise(ctx, async (s) => {
    if (s.entries.length >= ctx.maxOperations) throw err("OFFLINE_QUEUE_FULL");
    if (!enter2(s.nextSeq + 1)) throw err("OFFLINE_SEQUENCE_EXHAUSTED");
    const now = ctx.ara();
    if (!enter2(now)) throw invalid2();
    const hlc = seguentRellotgeHLC(s.clock, observed, now, ctx.nodeId);
    const parent = unionVector(s.context, causal);
    if ((parent[ctx.nodeId] ?? 0) >= s.nextSeq) throw invalid2();
    const version = unionVector(parent, { [ctx.nodeId]: s.nextSeq });
    const fieldClocks = {};
    for (const [key, val] of Object.entries(value.changes)) if (typeof val === "string") fieldClocks[key] = hlc;
    const body = {
      schema: ESQUEMA_OP,
      opId,
      nodeId: ctx.nodeId,
      seq: s.nextSeq,
      abast: json(ctx.abast),
      resource: value.resource,
      recordId: value.recordId,
      action: value.action,
      changes: value.changes,
      baseVersion: value.baseVersion ?? null,
      context: parent,
      version,
      hlc,
      fieldClocks,
      prevHash: s.entries.at(-1)?.hash ?? s.ack.hash
    };
    const op = json({ ...body, hash: await digest(ctx.crypto, body) }, MAX_OP_BYTES);
    s.entries.push(op);
    s.nextSeq += 1;
    s.clock = hlc;
    s.context = version;
    json(s, ctx.maxBytes);
    return { value: json(op) };
  }, signal);
}
function failure(error2) {
  const status = typeof error2?.status === "number" ? error2.status : typeof error2?.statusCode === "number" ? error2.statusCode : 0;
  const code = typeof error2?.code === "string" ? error2.code : "";
  if ([401, 403].includes(status) || ["UNAUTHORIZED", "FORBIDDEN", "AUTH_REQUIRED", "SESSION_EXPIRED"].includes(code)) return { kind: "auth", code: "REMOTE_AUTH", retryable: false };
  if ([400, 404, 409, 422].includes(status) || ["VALIDATION_ERROR", "INVALID_INPUT", "CONFLICT"].includes(code)) return { kind: "validation", code: "REMOTE_VALIDATION", retryable: false };
  if (error2?.name === "AbortError") return { kind: "cancel", code: "CANCELLED", retryable: true };
  if ([408, 425, 429, 500, 502, 503, 504].includes(status) || error2 instanceof TypeError || ["NETWORK_ERROR", "OFFLINE_TIMEOUT"].includes(code)) return { kind: "network", code: "REMOTE_RETRYABLE", retryable: true };
  return { kind: code === "OFFLINE_BAD_ACK" ? "protocol" : "unexpected", code: "REMOTE_REJECTED", retryable: false };
}
function invoke(ctx, port, op, controller) {
  return new Promise((resolve, reject) => {
    let finished = false;
    let timer;
    const done = (error2, value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", aborted);
      if (error2) reject(error2);
      else resolve(value);
    };
    const aborted = () => done(Object.assign(err("OFFLINE_CANCELLED"), { name: "AbortError" }));
    controller.signal.addEventListener("abort", aborted, { once: true });
    timer = setTimeout(() => {
      done(err("OFFLINE_TIMEOUT"));
      controller.abort();
    }, ctx.timeoutMs);
    if (controller.signal.aborted) {
      aborted();
      return;
    }
    Promise.resolve().then(() => {
      active(ctx, controller.signal);
      return port.applyOfflineMutation(json(op), {
        idempotencyKey: op.opId,
        scope: json(ctx.abast),
        signal: controller.signal
      });
    }).then((ack) => done(null, ack), (error2) => done(error2));
  });
}
async function runDrain(ctx, port, { signal, maxOperations = 1e3 } = {}) {
  if (!enter2(maxOperations, 1, 1e3)) throw invalid2();
  const controller = new AbortController();
  ctx.controller = controller;
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  let acknowledged = 0;
  try {
    for (let count = 0; count < maxOperations; count += 1) {
      active(ctx, controller.signal);
      const claim = await revise(ctx, (s) => {
        if (!s.entries.length) return { write: false, value: { status: "drained" } };
        if (s.blocked) return { write: false, value: { status: "blocked", reason: s.blocked.kind } };
        const now = ctx.ara();
        if (!enter2(now) || !enter2(now + ctx.leaseMs)) throw invalid2();
        if (s.inflight && s.inflight.expiresAt > now && s.inflight.claimedAt <= now) return { write: false, value: { status: "busy" } };
        const leaseId = ctx.crypto.randomUUID();
        s.inflight = { opId: s.entries[0].opId, leaseId, claimedAt: now, expiresAt: now + ctx.leaseMs };
        return { value: { status: "claimed", op: json(s.entries[0]), leaseId } };
      }, controller.signal);
      if (claim.status !== "claimed") return { ...claim, acknowledged };
      let ack;
      try {
        ack = await invoke(ctx, port, claim.op, controller);
        active(ctx, controller.signal);
        const confirmed = json(ack, 4096);
        keys(confirmed, ["opId", "committed"]);
        if (confirmed.opId !== claim.op.opId || confirmed.committed !== true) throw err("OFFLINE_BAD_ACK");
      } catch (e) {
        if (!ctx.open || ctx.isScopeActive(ctx.abast) !== true || signal?.aborted) return { status: "cancelled", acknowledged };
        const f = failure(e?.code === "OFFLINE_INVALID_INPUT" ? err("OFFLINE_BAD_ACK") : e);
        await revise(ctx, (s) => {
          if (s.inflight?.leaseId !== claim.leaseId) return { write: false, value: false };
          s.inflight = null;
          if (!f.retryable) s.blocked = { opId: claim.op.opId, kind: f.kind, code: f.code };
          return { value: true };
        });
        return { status: f.kind === "cancel" ? "cancelled" : f.retryable ? "retryable" : "blocked", reason: f.kind, acknowledged };
      }
      const accepted = await revise(ctx, (s) => {
        if (s.inflight?.leaseId !== claim.leaseId || s.entries[0]?.opId !== claim.op.opId) return { write: false, value: false };
        const head = s.entries.shift();
        s.ack = { seq: head.seq, hash: head.hash };
        s.inflight = null;
        return { value: true };
      }, controller.signal);
      if (!accepted) return { status: "lease-lost", acknowledged };
      acknowledged += 1;
    }
    const remaining = await readState(ctx, controller.signal);
    return { status: remaining.entries.length ? "pending" : "drained", acknowledged };
  } catch (e) {
    if (!ctx.open || e?.name === "AbortError" || e?.code === "OFFLINE_SCOPE_INACTIVE") return { status: "cancelled", acknowledged };
    throw e;
  } finally {
    signal?.removeEventListener("abort", abort);
    if (ctx.controller === controller) ctx.controller = null;
  }
}
function drainOfflineQueue(queue, port, options) {
  const ctx = context(queue);
  active(ctx);
  if (port?.capacitats?.idempotenciaOffline !== true || typeof port.applyOfflineMutation !== "function") {
    return Promise.reject(err("OFFLINE_IDEMPOTENCY_REQUIRED"));
  }
  if (ctx.drain) return ctx.drain;
  ctx.drain = runDrain(ctx, port, options).finally(() => {
    ctx.drain = null;
  });
  return ctx.drain;
}

// ../../../../../private/tmp/sdp-codex-o89/candidate/src/data/contracte.js
var CONTRACTE_NUCLI = Object.freeze([
  "loadCoreContent",
  "loadMur",
  "loadMultimedia",
  "loadNotes",
  "appendChatMessages",
  "appendSectionSubmissionNetworkOnly",
  "updateNote",
  "loginWithMagicLink",
  "registerWithPassword",
  "loginWithPassword",
  "loginWithGoogle",
  "listMyOrganizations",
  "createOrganization",
  "updateOrganization",
  "updateProfile",
  "updateUserPassword",
  "getProfile",
  "recullTornadaOAuth",
  "logout",
  "getCurrentUser",
  "getBackendConfigurat",
  "getRuntimeDataMode",
  "getDefaultUserId",
  "createNote",
  "loadFils",
  "loadMissatges",
  "enviaMissatge",
  "marcaLlegit",
  "creaFilDirecte",
  "carregaMembres",
  "subscribeToXat",
  "unsubscribeFromXat"
]);
var SECCIONS_PAGINABLES = Object.freeze({
  mur: "feedPosts",
  events: "events",
  mercat: "marketItems"
});
var CAPACITATS = Object.freeze({
  sessioExterna: Object.freeze(["adoptaSessioExterna"]),
  paginacioNotes: Object.freeze(["loadNotesPage"]),
  /* Decisió 4 del Mestre (261007) · «Carregar-ne més» al Mur i al Mercat
     (ADR-2026-11-PAGINACIO-SECCIONS). Opcional a posta: un backend sense ella
     continua sent vàlid, loadMur torna la primera pàgina com sempre i la
     interfície no pinta el botó. La interfície ho pregunta amb
     teCapacitat('paginacioSeccions'). Formes:
       loadMur(ownerUserId, config) → { feedPosts[], events[], marketItems[],
         paginacio? }. `paginacio` és ADDITIU i opcional: { [seccio]: cursor }
         només per a les seccions de SECCIONS_PAGINABLES que tenen més files
         després de la primera pàgina. L'absència del camp o de la clau vol
         dir que la secció és completa. El cursor és opac: només l'adaptador
         que l'ha emés el sap llegir.
       loadSeccioPage({ seccio, cursor, limit, signal }, config) →
         { elements[], complete, nextCursor }. La pàgina següent de les
         publicacions dels veïns de la secció, amb el mateix mapatge que la
         primera pàgina de loadMur i en el mateix ordre (de més nova a més
         vella, estable amb empats). `limit` ≤ 50 (per defecte, 50). El
         contingut de l'administració només va a la primera pàgina. complete
         i nextCursor null van junts. Sense servidor (mode de proves), cap
         pàgina més: { elements: [], complete: true, nextCursor: null }.
         Relleu 261008 (revisió adversarial) · `cursor: null` vol dir des de
         la publicació més nova dels veïns de la secció, sense el contingut
         de l'administració: pot solapar-se amb la primera pàgina de loadMur,
         i la interfície fusiona per id. Una
         `seccio` que no és de SECCIONS_PAGINABLES rebutja amb un Error. El
         kit de conformitat comprova tots dos casos. */
  paginacioSeccions: Object.freeze(["loadSeccioPage"]),
  admin: Object.freeze([
    "adminListUsers",
    "adminListOrganizations"
  ]),
  sessio: Object.freeze([
    "refrescaSessio",
    "elMeuRol"
  ]),
  /* Fase 4. No és nucli a posta: un backend sense Storage segueix sent
     vàlid i la interfície cau cap a data URL. teCapacitat('mitjans')
     és l'única manera legítima de preguntar-ho. */
  mitjans: Object.freeze([
    "uploadToStorage",
    "getPublicUrl",
    "resolveAsset",
    "promoteToPublic"
  ]),
  /* Pla 261018_1605 (Tasca 4, D8; ordre del Mestre, 18-10-2026) · La
     biblioteca de fotos pròpies de l'apartat «Multimèdia» del Perfil.
     Capacitat a banda a posta, i no dins de 'mitjans': el control de
     capacitat parcial (backendPort.js) tombaria tot 'mitjans' en un backend
     que només sap pujar, i la pujada d'avatars deixaria de funcionar.
     Opcional: sense ella, «Multimèdia» només pinta les fotos actives de la
     fitxa. La interfície ho pregunta amb teCapacitat('mitjansPropis').
     Formes (config sempre l'últim):
       llistaElsMeusMitjans(config) → Promise<Mitja[]>
         Només les imatges de la persona de la sessió al bucket públic, de
         més nova a més vella. [] sense sessió i en seed o local.
       esborraElMeuMitja(ref, config) → Promise<void>
         Esborra de veritat una foto de la biblioteca del Perfil i només
         eixa: una ref 'sdp-media://mitjans/<poble>/<uid>/avatars/<fitxer>'
         del poble resolt i de la persona de la sessió (Mitja.esborrable).
     Mitja: { ref, ruta, nom, carpeta, creat (ISO o null), mida (bytes o
     null), etag (sense cometes, o null), tipus (MIME o null), esborrable }.
     Els errors porten `codi` (i el mateix a `code`) de CODI_MITJANS o
     CODI_BACKEND_INABASTABLE (errorsBackend.js), o 'no-disponible' en seed
     o local; el missatge, en valencià, mai porta la ruta ni el text cru del
     proveïdor. */
  mitjansPropis: Object.freeze([
    "llistaElsMeusMitjans",
    "esborraElMeuMitja"
  ]),
  /* Adjunts privats del xat; independents dels mitjans públics del perfil.
     quotaXat(config) → { usats, limit, pendents: [{id, bytes, mime}] } en bytes (reserves incloses).
     publicaAdjuntXat(filId, {id, fitxer: Blob, tipus, duradaMs, text?, respostaA?}, config)
       → Missatge confirmat; id estable per reintentar sense duplicar quota.
       config.onProgres(fraccio 0..1) és opcional (XAT-03): els bytes ja pujats;
       no viatja a les RPC i qui no puja res de veres (seed, local) l'ignora.
     descartaAdjuntXat(id, config) → true després d’esborrar un pendent propi.
     urlAdjuntXat(id, config, { renova }?) → URL temporal, només amb accés vigent al fil;
       renova=true obliga a una signatura nova (cap URL desada).
     Sense servidor/migració: error 'sense-capacitat', mai èxit local simulat. */
  xatMultimedia: Object.freeze(["quotaXat", "publicaAdjuntXat", "urlAdjuntXat", "descartaAdjuntXat"]),
  /* P1-12 · Disseny E2EE §8.3: transport opac i opcional, sense activar el
     decorador ni donar suport a un backend que no implemente el grup sencer.
     Els arguments i resultats els conserva l'adaptador; ací no es deriva cap
     RPC ni es recodifica cap sobre. fixaAmbit és del servei del decorador
     (§8.1 / §21.1), no una operació de transport. */
  clausXat: Object.freeze([
    "publicaIdentitatXat",
    "laMevaIdentitatXat",
    "desaFraseXat",
    "clausDeXat",
    "desaLlibretaXat",
    "laMevaLlibretaXat",
    "estatXifratXat",
    "epoquesDelFilXat",
    "sobresMeusXat",
    "obriEpocaXat",
    "enviaXifratXat",
    "reembolcallaXat",
    "demanaXifratXat"
  ]),
  /* Separada de xatMultimedia: els quatre mètodes antics continuen sent un
     grup complet, i un backend sense bytes xifrats no anuncia este grup nou. */
  xatMultimediaXifrat: Object.freeze(["publicaAdjuntXifratXat", "bytesAdjuntXat"]),
  agenda: Object.freeze([
    "loadActesAgenda"
  ]),
  /* Fase 1 · Compte i consentiment. Opcionals a posta: la portabilitat i la
     supressió (RGPD arts. 20 i 17) i el consentiment demostrable (art. 7.1)
     són deures d'este node sobre Supabase, no del contracte. Un node sense
     elles —un altre Sóc de Poble federat sobre WordPress o en local— continua
     sent vàlid; la interfície ho pregunta amb teCapacitat('compte') i
     teCapacitat('consentiment'). */
  compte: Object.freeze([
    "exportaLesMeuesDades",
    "estatBaixa",
    "demanaBaixa",
    "cancelaBaixa"
  ]),
  consentiment: Object.freeze([
    "estatConsentiment",
    "registraConsentiment",
    "revocaConsentiment"
  ]),
  /* Cicle de vida de les notes: paperera, arxiu i esborrat definitiu.
     Opcional a posta: un backend injectat sense ella continua sent vàlid i
     l'editor no pinta «Borrar». La interfície ho pregunta amb
     teCapacitat('cicleNotes'). */
  cicleNotes: Object.freeze([
    "mouNota",
    "esborraNota"
  ]),
  /* Lògica d'Usuari (T4): la fitxa pública d'una persona, una entitat o un
     agent IA per id o slug. Opcional a posta: sense ella, la pàgina de perfil
     cau al catàleg d'agents del contingut base i no promet res més. */
  directori: Object.freeze([
    "loadPerfilPublic"
  ]),
  /* Pla 261022_1955 (Cercador Universal, T1) · El directori públic de les
     organitzacions: el que /cerca indexa perquè tota empresa, entitat o grup
     públic es trobe, amb sessió o sense. Capacitat a banda a posta, i no dins
     de 'directori': el control de capacitat parcial (backendPort.js) tombaria
     'directori' sencer en un amfitrió que ja el té i no sap llistar, i la
     fitxa pública deixaria d'obrir-se. Opcional: sense ella, /cerca només
     troba les organitzacions que ja porten les altres fonts. La interfície ho
     pregunta amb teCapacitat('directoriEntitats'). Forma (config sempre l'últim):
       listPublicOrganizations({ consulta?, poble?, limit?, signal? }, config) → Promise<Fila[]>
         Les organitzacions amb visibility 'public' de TOTS els pobles del node
         (el poble actiu el pondera qui busca, no el filtra), per nom i id.
         Sense consulta, les primeres `limit` (≤ LIMIT_DIRECTORI_ENTITATS, per
         defecte eixe); amb consulta, les que porten totes les seues paraules
         (com a molt cinc) al nom, al slug, al lema o a la descripció. Pot
         tornar-ne de més (un patró tolerant als accents, mai de menys): qui
         busca torna a plegar i filtrar. Sense servidor, [].
         P1-11 (pla 261024_2230, T5B-01) · Amb `poble` (el NOM del poble, el
         que desa el selector a town_name; pobleOrganitzacio.js ·
         pobleDelFiltre), només les d'eixe poble: town_name (el valor desat,
         tal qual) igual al nom del filtre sense espais als extrems, filtrat ABANS del límit (al servidor, mai
         al client després de tallar). Ni de més ni de menys. Un servidor
         que no sap el poble de les organitzacions (sense la columna
         town_name) rebutja amb un error de `code` 'NO-DISPONIBLE' (C11-01 de
         Codex: mai les de tots els pobles ni un buit mut); és l'única
         excepció a «cap codi més» i només amb `poble`. Un `poble` buit o
         que no és text no filtra res.
       Fila: la de la vista organization_directory, i mai cap correu:
         { id, tenant_id, slug, name, kind ('company' | 'entity' | 'group'),
         parent_organization_id, lema, description, logo_url (URL, ruta
         pròpia o referència opaca 'sdp-media://…'), hero_url,
         presentacio_html, copyright, town_name (o null), created_at, updated_at }.
     Els errors porten l'estat HTTP (`status`) quan n'hi ha; un tall o una
     cancel·lació, el seu nom (AbortError, TimeoutError). Cap codi més: qui
     busca no decidix res pel tipus d'error del directori. */
  directoriEntitats: Object.freeze([
    "listPublicOrganizations"
  ]),
  /* Agents IA que la persona administra (la IAIA): fitxa editable des del
     Workspace amb el mateix Editor Universal. Opcional: un node sense agents
     continua sent vàlid i el Perfil no pinta el grup. */
  agents: Object.freeze([
    "listMyAgents",
    "updateAgent"
  ]),
  /* T43 (ordre del Mestre, 260928) · Connectar-se a una organització per a
     administrar-la (en remot, una petició que revisa l'equip de Sóc de
     Poble). Opcional: sense ella la vista Connectar ho diu i no promet res. */
  reclamacions: Object.freeze([
    "reclamaOrganitzacio",
    "lesMevesReclamacions"
  ]),
  /* T43 · El correu opcional d'una organització: privat per a qui
     l'administra i, si vol, visible a la fitxa pública. Opcional: sense
     ella «El compte» de l'organització ho diu i no el demana. */
  contacteOrganitzacio: Object.freeze([
    "llegeixContacteOrganitzacio",
    "desaContacteOrganitzacio"
  ]),
  /* T63.2 i T67 · El xat comú d'una Pàgina Universal: troba o crea el grup
     (o la comunitat amb «Avisos» i «General») del subjecte i en torna el fil
     de destinació. Opcional a posta: un node sense ella continua sent vàlid
     i «Comentar» ho diu amb un avís honest. La interfície ho pregunta amb
     teCapacitat('xatDePagina'). Forma: obriFilDePagina(objecte, config) →
     { filId, fils: Conversa[] } o null si el subjecte no té xat. */
  xatDePagina: Object.freeze([
    "obriFilDePagina"
  ]),
  /* T2 i T4 (ordre del Mestre, 260930) · Saber si el node respon abans de
     canviar de mode: /registre no desa l'elecció remota contra un servidor
     aturat. Opcional a posta: sense ella el canvi es fa com fins ara (T16).
     Forma: comprovaServidor(config) → Promise<{ ok: boolean }>. Una fallada de
     xarxa o un temps esgotat tornen { ok: false }; no rebutja per això. */
  salut: Object.freeze([
    "comprovaServidor"
  ]),
  /* T8b · P0-23 (BOT-A2; Gauntlet Claude 261025_1705; assalt 261101) · La
     versió mínima de l'app nativa que el node encara servix. Opcional a
     posta: un node sense ella continua sent vàlid i l'app entra com sempre.
     Només la pregunta l'entrada nativa (src/natiu/entrada.jsx, amb
     teCapacitat('versioClient')); la web i el connector de WordPress no la
     pregunten mai. Forma (config sempre l'últim):
       versioMinimaClient(plataforma, config) → Promise<{ versioMinima, enllac } | null>
         plataforma 'ios' | 'android'. versioMinima és un enter ≥ 1, el que
         l'app compara amb VERSIO_CLIENT_NATIU (davall); enllac, l'adreça
         https on es baixa la versió nova (la botiga o la prova tancada), o
         null. Cap clau més. null quan no hi ha mínim: una altra plataforma,
         sense servidor (seed o local) o un servidor sense la migració.
     Els errors només són els de no arribar (l'estat HTTP, un tall, una
     cancel·lació): l'app no es bloqueja mai per un error (fail-open). Ho
     servix 2611011510_versio_minima_client.sql (NO aplicada: l'aplica el
     Mestre). */
  versioClient: Object.freeze([
    "versioMinimaClient"
  ]),
  /* R (Onada 3, 261003) · Recuperar la contrasenya perduda. Opcional a posta:
     un backend sense ella continua sent vàlid i /registre no pinta
     «Has oblidat la contrasenya?». La interfície ho pregunta amb
     teCapacitat('recuperacioContrasenya'). Formes:
       demanaRecuperacioContrasenya(correu, config) → Promise<{ enviat: true }>
         Envia l'enllaç. Resol IGUAL tant si el compte existix com si no; només
         rebutja amb error.code de CODI_ENTRADA (servidor, límit, desconegut).
       definixContrasenyaNova(contrasenya, config) → Promise<true>
         UNA sola crida que verifica i definix (R2). Amb un enllaç pendent en
         este document, el verifica ARA i definix la contrasenya amb la sessió
         que en trau; la sessió només es desa i s'avisa (sdp:auth-change) quan
         la contrasenya ja és la nova. Sense cap recuperació en curs, la de la
         sessió viva. Rebutja amb CODI_ENTRADA (ENLLAC_CADUCAT, feble, mateixa
         contrasenya…); amb una recuperació en curs i sense enllaç, mai toca la
         sessió viva.
     La tornada de l'enllaç passa pel nucli. R2 (decisió del Mestre, 261003:
     Safe Links d'Outlook) · recullTornadaOAuth resol amb `{ recuperacio: true }`
     SENSE sessió i sense cap petició: l'adaptador guarda l'enllaç en la memòria
     del document i ho diu al nucli ABANS de tornar
     (data/recuperacioPendent.js, anunciaEnllacDeRecuperacio). La interfície no
     deixa anar enlloc més fins que es desa o es descarta.
     Compatibilitat · Si un backend torna sessió amb `recuperacio` (el contracte
     d'abans de R2), App.jsx marca el compte (recuperacioPendent.js, §2) i la
     interfície no deixa usar eixa sessió fins que es definix la contrasenya. */
  recuperacioContrasenya: Object.freeze([
    "demanaRecuperacioContrasenya",
    "definixContrasenyaNova"
  ]),
  /* Fase D (261020, tasca 1; ordre del Mestre) · Entrar amb el testimoni OIDC
     (id_token) que un proveïdor ha emés fora de la web (el full natiu d'Apple o
     de Google). El port només parla OIDC: qui obri el full no és cosa del
     backend (config/entradaNativa.js). Opcional a posta: un backend sense ella
     continua sent vàlid i /registre no pinta els botons natius. La interfície
     ho pregunta amb teCapacitat('entradaAmbToken'). Forma (config sempre l'últim):
       entraAmbTokenDeProveidor(proveidor, { testimoni, nonce, testimoniAcces, nom, codiAutoritzacio }, config) → Promise<{ user }>
         proveidor 'apple' | 'google'; testimoni el JWT; nonce el CRU (el
         proveïdor n'ha rebut el SHA-256 en hex) o null; testimoniAcces l'access
         token de Google (at_hash) o null; nom el que el proveïdor dona fora del
         testimoni (Apple) o null, desat NOMÉS si la persona encara no en té cap
         de propi; codiAutoritzacio (T1, 261024; P0-04) el codi d'autorització
         d'un sol ús d'Apple (uns cinc minuts) o null: el backend el pot
         canviar al servidor per a revocar l'autorització d'Apple quan la
         persona es dona de baixa. Mai es guarda al client ni va a GoTrue, i
         si no es pot custodiar l'entrada no falla. Coreografia de
         loginWithPassword (sdp:auth-change, alta completada). Mai torna
         testimonis de sessió. Errors amb `code` de
         CODI_ENTRADA (TOKEN_REBUTJAT, PROVEIDOR_INACTIU…); en seed o local, MODE_LOCAL. */
  entradaAmbToken: Object.freeze([
    "entraAmbTokenDeProveidor"
  ]),
  /* Ordre del Mestre (261008, grup C) · Els membres d'una organització.
     Opcional a posta: un backend sense ella continua sent vàlid i el Perfil
     no pinta la gestió de membres ni «Eixir». La interfície ho pregunta amb
     teCapacitat('membresOrganitzacio'). Formes (config sempre l'últim):
       llistaMembresOrganitzacio(orgId, config) → Promise<Membre[]>
         Només per a qui administra l'organització (owner o admin).
       desaMembreOrganitzacio(orgId, { tipus, id, rol }, config) → Promise<Membre>
         Alta directa (sense invitació) o canvi de rol. rol per defecte
         'member'; una persona pot ser 'member' o 'admin', mai 'owner'; una
         organització, només 'member'.
       llevaMembreOrganitzacio(orgId, { tipus, id }, config) → Promise<{ llevat }>
         Idempotent: llevat false si ja no hi era. Amb el propi id i tipus
         'persona', és «Eixir», també per a qui només és membre.
     Membre: { tipus: 'persona' | 'organitzacio', id, nom, avatar,
     rol: 'owner' | 'admin' | 'member', desDe (ISO o null) }.
     Regles (decisions del Mestre, 261008), iguals a tots els adaptadors: la
     persona és del poble i no ha demanat la baixa; ningú canvia el seu propi
     rol; la propietària no es canvia ni es lleva; només ella nomena, degrada
     o lleva administradores; una organització membre és del mateix poble, no
     és ella mateixa, l'afig qui administra totes dues i no hereta cap permís.
     Els errors porten `code`: els de MISSATGES_MEMBRES_ORGANITZACIO, o
     NO-DISPONIBLE si el servidor encara no té l'esquema. */
  membresOrganitzacio: Object.freeze([
    "llistaMembresOrganitzacio",
    "desaMembreOrganitzacio",
    "llevaMembreOrganitzacio"
  ]),
  /* IDEA-24 (Llibre Mestre; marató 261101_2143, B4) · La transferència
     atòmica de la propietat d'una organització: la propietària ('owner') la
     cedix a una persona que ja n'és membre i ella passa a 'admin'. Capacitat a
     banda a posta, i no dins de 'membresOrganitzacio' (el control de capacitat
     parcial de backendPort.js tombaria la gestió de membres d'un node que no
     la sap fer, com 'titularPublic'). Opcional: qui oferisca «Transferir la
     propietat» ha de preguntar abans per esta capacitat amb teCapacitat i,
     sense ella, no l'ha d'oferir. Forma (config sempre l'últim):
       transfereixPropietatOrganitzacio(orgId, { tipus: 'persona', id }, config)
         → Promise<{ organizationId, anticOwnerId, nouOwnerId }>
         Una sola transacció: o canvien tots dos rols o cap; mai cap
         organització sense propietària ni amb dues. Només la propietària i
         la seua sessió; només per a TIPUS_TRANSFERIBLES ('group' i 'company':
         una entitat o un ajuntament només canvia de titular per reclamació
         revisada); la destinatària és una persona, no és qui crida, ja és
         membre de l'organització i del seu poble i no ha demanat la baixa.
         La tria de mostrar-se com a titular (consentimentTitular) de l'antiga
         propietària es perd. Mai torna cap correu.
     Els errors porten `code` de MISSATGES_MEMBRES_ORGANITZACIO (000 sense
     sessió, 001 tipus no transferible o destinatària que no és una persona,
     002 organització que no existix o no s'administra, 003 destinatària que
     no n'és membre o ha demanat la baixa, 004 una mateixa, 006 no n'és la
     propietària), o NO-DISPONIBLE si el servidor encara no té la RPC
     (2610311500_commutacio_grup_empresa_i_transferencia_propietat.sql). */
  transferenciaPropietat: Object.freeze([
    "transfereixPropietatOrganitzacio"
  ]),
  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor (TOTP)
     del superadmin. private.es_superadmin() exigix aal2 (migració
     2610061448): sense ell, el Tauler no pot desar res. Opcional a posta: un
     node sense servidor d'autenticació (la llavor, WordPress) continua sent
     vàlid i «El compte» no pinta la inscripció. La interfície ho pregunta amb
     teCapacitat('segonFactor') i, per a saber si cal confirmar-lo, mira
     `calSegonFactor` de la sessió. Formes (config sempre l'últim):
       llistaFactors(config) → Promise<Factor[]>
         Els factors TOTP del compte; buida sense sessió o sense servidor.
       inscriuFactor(nom, config) → Promise<{ id, qr, secret, uri }>
         Crea un factor pendent: `qr` és l'SVG com a data URI, `secret` la
         clau per a escriure-la a mà i `uri` l'otpauth://.
       reptaFactor(factorId, config) → Promise<{ repteId, caduca }>
         Obri un repte del factor; `caduca` és un instant ISO o null.
       verificaFactor({ factorId, repteId, codi }, config) → Promise<{ nivell: 'aal2' }>
         Confirma el codi i DESA la sessió nova (aal2) en lloc de la vella, amb
         la mateixa coreografia que una renovació (rotació del registre
         persistent, resetClient, sdp:auth-change). Verifica també el primer
         codi d'un factor acabat d'inscriure.
       retiraFactor(factorId, config) → Promise<{ id }>
     Factor: { id, nom, tipus: 'totp', estat: 'verificat' | 'pendent' }.
     Els errors porten `code` de CODI_SEGON_FACTOR (errorsBackend.js); en seed
     o local, llistaFactors torna [] i la resta rebutja amb 'no-disponible'. */
  segonFactor: Object.freeze([
    "llistaFactors",
    "inscriuFactor",
    "reptaFactor",
    "verificaFactor",
    "retiraFactor"
  ]),
  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · La personalització del
     poble que desa el superadmin: la taxonomia (categories i etiquetes) i
     l'estil (els tokens --sdp-* de la capa semàntica). Opcional a posta: un
     node sense ella continua sent vàlid i el Tauler no pinta «Desa». La
     interfície ho pregunta amb teCapacitat('personalitzacio'). Formes (config
     sempre l'últim):
       adminDesaPersonalitzacio({ clau, payload, versio }, config) → Promise<{ clau, payload, versio }>
         clau és 'taxonomia' o 'estil'; `versio` és la versió que s'editava
         (null o 0 si no n'hi havia) i la resposta porta la versió NOVA. Només
         amb el segon factor confirmat (aal2): si no, 'cal-segon-factor'; si
         algú ha desat pel camí, 'conflicte-versio'.
       adminHistorialPersonalitzacio(clau, config) → Promise<[{ versio, payload, creat, autor }]>
         Les versions desades, de més nova a més vella.
     La LECTURA no és cap mètode nou: loadCoreContent torna el camp ADDITIU i
     opcional `personalitzacio: { taxonomia: { payload, versio } | null,
     estil: { payload, versio } | null }`, que els consumidors fusionen amb
     la seua base (PAGE_COPY, tokens.css). Els errors porten `code` de
     CODI_PERSONALITZACIO (errorsBackend.js). */
  personalitzacio: Object.freeze([
    "adminDesaPersonalitzacio",
    "adminHistorialPersonalitzacio"
  ]),
  /* Fase D (261020, tasca 2; pla 261020_1300 · App Store 1.2 i Google Play
     UGC) · La moderació del contingut dels veïns: denunciar i bloquejar.
     Opcional a posta: un node sense ella continua sent vàlid i cap targeta
     ni bombolla no pinta «Més opcions». La interfície ho pregunta amb
     teCapacitat('moderacio'). Formes (config sempre l'últim):
       denunciaContingut({ objecte: { tipus, id }, motiu, detall?, autor?: { tipus, id }, filId? }, config)
         → Promise<{ rebuda: true, repetida: boolean }>
         tipus de TIPUS_OBJECTE_DENUNCIA; motiu de MOTIUS_DENUNCIA; detall de
         fins a MAXIM_DETALL_DENUNCIA caràcters. També sense sessió (anon).
         `repetida`: la mateixa persona ja l'havia denunciat i està pendent.
       llistaBloquejos(config) → Promise<Bloqueig[]>  (de qui crida; [] sense sessió)
       bloquejaAutor({ tipus, id, nom? }, config) → Promise<Bloqueig>  (idempotent)
       desbloquejaAutor({ tipus, id }, config) → Promise<{ desbloquejat: boolean }>
     Bloqueig: { tipus: 'persona' | 'entitat', id, nom: string | null, creatAl: ISO | null }.
     Els errors porten `code` de CODI_MODERACIO; sense la migració aplicada,
     'no-disponible'. */
  moderacio: Object.freeze([
    "denunciaContingut",
    "llistaBloquejos",
    "bloquejaAutor",
    "desbloquejaAutor"
  ]),
  /* Fase D (261020, tasca 2) · Les normes de convivència, acceptades abans
     de la primera publicació (Play UGC; App Store 1.2, tolerància zero).
     Opcional: sense ella la interfície ho recorda només en este dispositiu.
     Formes:
       estatNormes(config) → Promise<{ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: ISO | null }>
         L'acceptació de la versió vigent; sense sessió, acceptadaAl null.
       acceptaNormes(versio, config) → Promise<{ versio, acceptadaAl }>
         versio === VERSIO_NORMES_CONVIVENCIA (si no, 'versio-invalida');
         sense sessió, 'sense-sessio'. */
  normesConvivencia: Object.freeze([
    "estatNormes",
    "acceptaNormes"
  ]),
  /* T6b (IDEA-14; decisió del Mestre, 261024) · «Connectar / Seguir»: el
     seguiment d'un sol sentit d'una persona o d'una entitat. Qui és seguit ho
     sap i veu qui el seguix; cap algoritme (les llistes van per data, la més
     nova primer). Opcional a posta: un node sense ella continua sent vàlid i
     /connectar i el Perfil no pinten «Connectar amb {nom}» ni «Veïnat connectat amb tu». La
     interfície ho pregunta amb teCapacitat('seguiments'). Formes (config
     sempre l'últim; el seguit és { tipus: 'persona' | 'entitat', id }):
       segueix({ tipus, id }, config) → Promise<{ seguint: true, creatAl, nou, primer }>
         Idempotent: false si ja el seguies (creatAl, el d'aleshores).
         `primer` true NOMÉS la primera vegada de totes que seguixes eixa
         persona o entitat; tornar-la a seguir després de deixar-ho és
         false. `nou` es conserva per compatibilitat i val el mateix que
         `primer`: l'avís al xat ix una sola vegada per parella.
       deixaDeSeguir({ tipus, id }, config) → Promise<{ seguint: false }>
         Idempotent: també si no el seguies. Al servidor, un esborrat suau
         (la fila es queda amb deixat_al): no reinicia el límit per hora.
       estatSeguiment({ tipus, id }, config) → Promise<{ seguint: boolean, creatAl: ISO | null }>
         Sense sessió, { seguint: false, creatAl: null } i cap petició.
       elsMeusSeguiments(config) → Promise<[{ tipus, id, nom, creatAl }]>
         Només els de la persona (els fets amb `com` no hi són).
       quiEmSegueix({ orgId } = {}, config) → Promise<[{ tipus, id, nom, creatAl }]>
         Sense orgId, qui et seguix; amb orgId, qui seguix eixa entitat,
         només per a qui l'administra (owner o admin). Sense sessió, les
         dues llistes són [] i cap petició. `tipus` és 'persona' o
         'entitat' (TIPUS_SEGUIT): d'un seguiment fet com a entitat, `id` i
         `nom` són els de l'ENTITAT seguidora, mai els de la persona que el
         va fer.
     IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) · Connectar
     des d'una entitat (B2B rural), sense canviar la sessió global:
     segueix, deixaDeSeguir i estatSeguiment admeten `com` al mateix objecte
     ({ tipus, id, com }): l'id d'una organització que la persona de la
     sessió ADMINISTRA (owner o admin; en remot, un UUID; en local, l'id de
     la llavor). Sense `com` (o null, o ''), exactament el de sempre: la
     persona. Amb `com`, la connexió és de l'entitat, amb les mateixes
     respostes; si no l'administres, SDP-SEG-007. Una entitat no es connecta
     amb ella mateixa (SDP-SEG-003); entitat A → entitat B val encara que la
     persona també administre B, i persona → entitat que administra
     continua sent SDP-SEG-003. La quota (altes per hora i espera de represa)
     la compta la PERSONA que actua, mai l'entitat, i els bloquejos són els
     seus. Una entitat seguix cada destí com a molt una vegada, siga qui siga
     qui l'administra que ho haja fet, i qualsevol d'elles la pot deixar.
     Ho servix supabase/migrations/2610250100_seguiments_des_d_entitat.sql.
     Regles, iguals a tots els adaptadors (2610241430_seguiments.sql): una
     persona, només si sou del mateix poble; una entitat, si és pública; mai
     tu mateix ni una entitat que administres; cap bloqueig teu (moderacio);
     un límit d'altes o represes per hora. El bloqueig de l'altra banda és a
     l'ombra: seguir funciona igual i les lectures de qui seguix no l'amaguen;
     només quiEmSegueix, la de qui és seguit, deixa fora qui seguix. Una
     lectura amaga el que el bloqueig del seu sentit o una baixa tapen. Els
     errors porten `code`: els de
     MISSATGES_SEGUIMENTS (SDP-SEG-000…007), o NO-DISPONIBLE si el servidor
     encara no té l'esquema. */
  seguiments: Object.freeze([
    "segueix",
    "deixaDeSeguir",
    "estatSeguiment",
    "elsMeusSeguiments",
    "quiEmSegueix"
  ]),
  /* IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla
     261025_0200) · «Si connectes amb una empresa i la persona propietària té
     el perfil públic, t'hi pots connectar també a la mateixa pantalla». El
     servidor no diu mai qui administra una entitat (2610250100): la titular
     només es mostra si ELLA ho ha triat (consentimentTitular, davall).
     Capacitat a banda a posta, i no dins de 'directori' (el control de
     capacitat parcial de backendPort.js tombaria la fitxa pública en un
     amfitrió que no la té, com 'directoriEntitats'), ni amb la tria (un
     amfitrió pot mostrar la titular sense gestionar-ne la tria). Opcional:
     sense ella, /connectar no en diu res. Forma (config sempre l'últim):
       loadTitularPublic(orgId, config) → Promise<{ tipus: 'persona', id, nom, avatar } | null>
         La propietària (role 'owner'; mai una administradora ni qui ha
         publicat res) d'una organització pública, NOMÉS si ha triat
         mostrar-se, té el perfil públic, no ha demanat la baixa i cap
         bloqueig no la separa de qui mira; si no, null (també d'una
         organització que no existix), sense dir per què. Mai cap correu ni
         cap rol. Sense sessió, null i cap petició. Un servidor sense la
         migració, null. Els errors només són els de no arribar (un tall,
         una cancel·lació). Ho servix 2610250300_titular_public.sql. */
  titularPublic: Object.freeze([
    "loadTitularPublic"
  ]),
  /* IDEA-22, punt 2 · La tria de la propietària: només ella (role 'owner' i
     la seua sessió) la llig o la canvia; una administradora no la pot fer per
     ella. Opcional: sense ella, la gestió dels membres no pinta la casella.
     Formes (config sempre l'últim):
       estatTitularPublic(orgId, config) → Promise<{ titularPublic: boolean }>
       marcaTitularPublic(orgId, titularPublic, config) → Promise<{ titularPublic: boolean }>
         titularPublic és un booleà (si no, SDP-TIT-002); torna el valor desat.
     Els errors porten `code` de MISSATGES_TITULAR (SDP-TIT-000 sense sessió,
     SDP-TIT-001 si no n'és la propietària o l'organització no existix), o
     NO-DISPONIBLE si el servidor encara no té la migració. */
  consentimentTitular: Object.freeze([
    "estatTitularPublic",
    "marcaTitularPublic"
  ]),
  /* T2 · D04/D10 (assalt 261101; pla 261101_1246, D-3) · Les dades obertes
     d'un poble que el servidor ja servix a qualsevol visitant. Opcional: sense
     ella, el paquet Open Data de la fitxa del poble deixa notícies, agenda,
     memòria cultural i memòria oral a «Fonts pendents». Capacitat a banda de
     la restauració (davall) a posta: un servidor que només llig no ha de
     tombar la validació del port (capacitat parcial, backendPort.js).
     Forma (config sempre l'últim):
       llegixDadesObertes({ poble: { slug, nom }, signal? }, config) → Promise<DadesObertes>
         DadesObertes = { noticies, agenda, memoria, memoriaOral }, les quatre
         claus SEMPRE presents (COLECCIONS_DADES_OBERTES, davall). Cada una és
         una llista o null: null vol dir «este servidor no té eixa font», []
         que la té i és buida. Sempre anònima: el mateix resultat amb sessió i
         sense, i mai cap secret. Només el que el servidor ja servix a tothom:
         mai publicacions del veïnat (section_submissions), notes, xat, Mercat
         ni perfils. Pot tornar elements d'altres pobles (qui exporta torna a
         filtrar i falla tancat). Cap llista passa de LIMIT_DADES_OBERTES.
         Fila de noticies i agenda: la forma de loadMur().feedPosts i .events.
         Fila de memoriaOral: { id, okf: { cami, frontmatter, cos },
         author_org_id, copyright?, created_at?, updated_at?, visibility? }.
         Un poble que no és { slug, nom } de text no buit: TypeError.
     Els errors porten l'estat HTTP (`status`) quan n'hi ha; un tall o una
     cancel·lació, el seu nom (AbortError, TimeoutError). */
  dadesObertes: Object.freeze([
    "llegixDadesObertes"
  ]),
  /* T2 · D04/D10 (assalt 261101; pla 261101_1246, D-3) · Tornar a carregar en
     este servidor un poble que ve d'un paquet Open Data ja verificat
     (src/data/importaMunicipiOpenData.js). Opcional: hui només la servix
     l'adaptador local. Forma (config sempre l'últim):
       restauraDadesObertes(lot, config) → Promise<{ creats, actualitzats, iguals }>
         lot: la forma de validaLotDadesObertes (src/data/dadesObertesLot.js).
         Cadascun dels tres és { entitats, noticies, agenda, memoria,
         memoriaOral } d'enters ≥ 0. Atòmica (o tot o res) i idempotent
         (upsert per col·lecció i id: el mateix lot dues voltes dona creats 0
         i actualitzats 0). Mai esborra res ni escriu cap persona. Un lot
         invàlid rebutja amb TypeError; un id o un slug que ja és d'un altre
         poble, amb `code` 'conflicte-identificador' i sense escriure res; en
         un servidor amb comptes, qui no administra el node, amb `code`
         'sense-permis'. */
  restauracioDadesObertes: Object.freeze([
    "restauraDadesObertes"
  ]),
  /* B8C-2 (marató 261101_2143; Bloc B8, ordre del Mestre 261101) · Els
     aparells que reben els avisos push del Xat (la fase N2 de
     src/config/avisosPushXat.js). Opcional a posta: sense ella, Ajustos →
     Notificacions continua «en construcció» i ningú no demana cap permís.
     Contracte únic amb el servidor: B8-SERVIDOR §2.9. Formes (config sempre
     l'últim):
       desaDispositiuAvisos(d, config) → Promise<void>
       retiraDispositiuAvisos(d, config) → Promise<void>
         d = { plataforma, adreca, caducaMs?, llengua?, gest? }: plataforma
         de PLATAFORMES_AVISOS (davall); adreca, l'endpoint https de la
         subscripció web o el testimoni natiu; caducaMs, l'expirationTime de
         la subscripció (o null); llengua, la de l'app (una altra o cap: la
         del servidor); gest, cert només quan naix del gest de la persona
         (activar): sense gest, el servidor no canvia mai l'amo d'un aparell.
         Mai cap clau de la subscripció (p256dh, auth) ni cap dada de tornada.
         retiraDispositiuAvisos és de cortesia i idempotent (la baixa en eixir).
     Errors amb `code`: AVISOS_INVALID (una entrada que no casa la forma,
     sense cap petició, o SDP-PUSH-002/003/004 del servidor), AVISOS_ALIE
     (SDP-PUSH-011: l'aparell és d'una altra sessió i cal el gest) i
     NO-DISPONIBLE (sense servidor, un servidor sense la migració o amb els
     avisos apagats, SDP-PUSH-010). Ho servixen xat_push_desa i
     xat_push_retira de 2611020417_xat_avisos_push.sql (B8-SERVIDOR; NO
     aplicada: l'aplica el Mestre). Un node sense servidor la declara amb el rebuig honest
     NO-DISPONIBLE (src/data/local/conversesLocal.js). */
  avisosPush: Object.freeze([
    "desaDispositiuAvisos",
    "retiraDispositiuAvisos"
  ]),
  /* B8C-2 (marató 261101_2143; Bloc B8) · Silenciar una conversa: la columna
     xat_participants.silenciat_fins_al, que ja es llig, es pot escriure.
     Opcional: sense ella, el silenci es queda en la memòria de la pàgina
     (XatContext), mai a l'emmagatzematge del navegador. Forma (config sempre
     l'últim):
       silenciaFil({ filId, durada }, config) → Promise<{ silenciatFinsAl: string | null }>
         durada de DURADES_SILENCI (davall): '8h', '1setmana', 'sempre' o
         'cap' (lleva el silenci). La interfície mai no calcula dates: passa
         la durada. silenciatFinsAl és la data ISO de fi (per a «sempre», el
         mateix instant que SILENCI_SEMPRE: una data finita, mai 'infinity'
         ni null) o null. El text pot variar d'un adaptador a l'altre (el
         servidor torna '+00:00', la llavor 'Z'): compareu l'instant
         (Date.parse) o l'any ≥ 9999, mai la igualtat de text.
     Errors amb `code`: SILENCI_INVALID (una durada o un fil invàlids, sense
     cap petició, o SDP-XAT-050 del servidor), XAT_NO_PARTICIPANT (no eres
     membre actiu del fil, SDP-XAT-006) i NO-DISPONIBLE (un servidor sense la
     RPC). Ho servix xat_silencia(p_fil_id, p_durada) de
     2611020417_xat_avisos_push.sql (NO aplicada: l'aplica el Mestre), i la data de fi la posa el
     rellotge del servidor; en llavor i en local, finsAlDelSilenci (davall). */
  silenciXat: Object.freeze([
    "silenciaFil"
  ])
});
var COLECCIONS_DADES_OBERTES = Object.freeze(["noticies", "agenda", "memoria", "memoriaOral"]);
var CONTRACTE_BACKEND = Object.freeze([
  ...CONTRACTE_NUCLI,
  ...Object.values(CAPACITATS).flat()
]);
var TIPUS_SUBJECTE_XAT = Object.freeze({
  comunitat: Object.freeze(["entitat", "poble", "organitzacio"]),
  grup: Object.freeze(["publicacio", "producte", "esdeveniment", "multimedia", "grup", "pagina"])
});
var ALIES_SUBJECTE = Object.freeze({ organitzacio: "entitat" });
var PAGINES_AMB_XAT = Object.freeze({
  "/mur": "Mur",
  "/mercat": "Mercat",
  "/pobles": "Pobles",
  "/multimedia": "Multim\xE8dia",
  "/dispositius": "Dispositius",
  "/disseny": "Disseny",
  "/wikidepoble": "Wiki de Poble",
  "/projecte": "El projecte",
  "/constitucio": "Constituci\xF3",
  "/iaia": "L'\xE0nima de la iaia",
  "/roadmap": "Full de ruta",
  "/versions": "Versions",
  "/legal": "Legal i privacitat"
});
var PREFIX_DE_SUBJECTE = Object.freeze({
  entitat: "/empresa/",
  grup: "/grup/",
  poble: "/pobles/",
  publicacio: "/mur/",
  producte: "/mercat/",
  esdeveniment: "/events/",
  multimedia: "/multimedia/"
});
var MISSATGES_MEMBRES_ORGANITZACIO = Object.freeze({
  "SDP-ORGMEM-000": "Cal iniciar sessi\xF3.",
  "SDP-ORGMEM-001": "El tipus de membre o el rol no \xE9s v\xE0lid.",
  "SDP-ORGMEM-002": "Nom\xE9s qui administra l\u2019organitzaci\xF3 en veu i en gestiona els membres.",
  "SDP-ORGMEM-003": "Esta persona no \xE9s del poble de l\u2019organitzaci\xF3 o ha demanat la baixa.",
  "SDP-ORGMEM-004": "No pots canviar el teu propi rol.",
  "SDP-ORGMEM-005": "La propiet\xE0ria no es canvia ni es lleva.",
  "SDP-ORGMEM-006": "Nom\xE9s la propiet\xE0ria nomena, degrada o lleva administradores.",
  "SDP-ORGMEM-007": "Una organitzaci\xF3 no pot ser membre d\u2019ella mateixa ni d\u2019una d\u2019un altre poble.",
  "SDP-ORGMEM-008": "Per a afegir una organitzaci\xF3 com a membre, cal que tamb\xE9 l\u2019administres."
});
var TIPUS_TRANSFERIBLES = Object.freeze(["group", "company"]);
var TIPUS_OBJECTE_DENUNCIA = Object.freeze(["publicacio", "producte", "esdeveniment", "missatge", "persona", "entitat"]);
var MOTIUS_DENUNCIA = Object.freeze(["ofensiu", "spam_frau", "desinformacio", "altre"]);
var TIPUS_BLOQUEJAT = Object.freeze(["persona", "entitat"]);
var CODI_MODERACIO = Object.freeze({
  OBJECTIU_INVALID: "objectiu-invalid",
  MOTIU_INVALID: "motiu-invalid",
  DETALL_MASSA_LLARG: "detall-massa-llarg",
  AUTOBLOQUEIG: "autobloqueig",
  VERSIO_INVALIDA: "versio-invalida",
  LIMIT: "limit",
  SENSE_SESSIO: "sense-sessio",
  NO_DISPONIBLE: "no-disponible",
  DESCONEGUT: "desconegut"
});
var MISSATGE_MODERACIO = Object.freeze({
  "objectiu-invalid": "El contingut o la persona no s\xF3n v\xE0lids.",
  "motiu-invalid": "Tria un dels motius de la llista.",
  "detall-massa-llarg": "El detall passa de 1.000 car\xE0cters.",
  autobloqueig: "No et pots bloquejar a tu mateix.",
  "versio-invalida": "La versi\xF3 de les normes no \xE9s la vigent.",
  limit: "Massa den\xFAncies o bloquejos en poc de temps. Torna-ho a provar d\u2019ac\xED a una estona.",
  "sense-sessio": "Cal entrar al compte.",
  "no-disponible": "El servidor encara no t\xE9 la moderaci\xF3. Cal aplicar la migraci\xF3 pendent.",
  desconegut: "No s\u2019ha pogut completar. Torna-ho a provar."
});
var TIPUS_SEGUIT = Object.freeze(["persona", "entitat"]);
var MISSATGES_SEGUIMENTS = Object.freeze({
  "SDP-SEG-000": "Cal entrar al compte per a seguir alg\xFA.",
  "SDP-SEG-001": "La persona o l\u2019entitat no s\xF3n v\xE0lides.",
  "SDP-SEG-002": "No trobem esta persona o esta entitat, o no la pots seguir.",
  "SDP-SEG-003": "No et pots seguir a tu mateix ni seguir una entitat que administres.",
  "SDP-SEG-004": "L\u2019has bloquejada: desbloqueja-la abans de seguir-la.",
  "SDP-SEG-005": "Nom\xE9s qui administra l\u2019entitat veu qui la seguix.",
  "SDP-SEG-006": "Massa seguiments en poc de temps. Torna-ho a provar d\u2019ac\xED a una estona.",
  "SDP-SEG-007": "No administres l\u2019entitat amb qu\xE8 vols connectar.",
  "NO-DISPONIBLE": "El servidor encara no t\xE9 els seguiments. Cal aplicar la migraci\xF3 pendent.",
  DESCONEGUT: "No s\u2019ha pogut completar. Torna-ho a provar."
});
var MISSATGES_TITULAR = Object.freeze({
  "SDP-TIT-000": "Cal entrar al compte per a triar si et mostrem com a titular.",
  "SDP-TIT-001": "Nom\xE9s la propiet\xE0ria de l\u2019organitzaci\xF3 pot triar si es mostra com a titular.",
  "SDP-TIT-002": "La tria no \xE9s v\xE0lida.",
  "NO-DISPONIBLE": "El servidor encara no sap mostrar la titular. Cal aplicar la migraci\xF3 pendent.",
  DESCONEGUT: "No s\u2019ha pogut completar. Torna-ho a provar."
});
var PLATAFORMES_AVISOS = Object.freeze(["web", "ios", "android"]);
var DURADES_SILENCI = Object.freeze(["8h", "1setmana", "sempre", "cap"]);
var MS_DEL_SILENCI = Object.freeze({ "8h": 8 * 36e5, "1setmana": 7 * 24 * 36e5 });

// ../../../../../private/tmp/sdp-codex-o89/candidate/src/data/errorsBackend.js
var CODI_ENTRADA = Object.freeze({
  CREDENCIALS: "credencials",
  CORREU_PENDENT: "correu-pendent",
  SERVIDOR_INABASTABLE: "servidor-inabastable",
  MASSA_INTENTS: "massa-intents",
  CONTRASENYA_FEBLE: "contrasenya-feble",
  COMPTE_EXISTENT: "compte-existent",
  MODE_LOCAL: "mode-local",
  ENLLAC_CADUCAT: "enllac-caducat",
  MATEIXA_CONTRASENYA: "mateixa-contrasenya",
  TOKEN_REBUTJAT: "token-rebutjat",
  PROVEIDOR_INACTIU: "proveidor-inactiu",
  DESCONEGUT: "desconegut"
});
var CODI_BACKEND_INABASTABLE = "backend-inabastable";
var CODI_MITJANS = Object.freeze({
  SESSIO: "mitjans-sessio",
  SENSE_ESPAI: "mitjans-sense-espai",
  SENSE_PERMIS: "mitjans-sense-permis",
  MASSA_GRAN: "mitjans-massa-gran",
  FORMAT: "mitjans-format",
  SERVIDOR: "mitjans-servidor",
  DESCONEGUT: "mitjans-desconegut"
});
var CODI_SEGON_FACTOR = Object.freeze({
  CODI_INVALID: "codi-invalid",
  REPTE_CADUCAT: "repte-caducat",
  FACTOR_NO_TROBAT: "factor-no-trobat",
  NOM_REPETIT: "nom-repetit",
  MASSA_FACTORS: "massa-factors",
  NO_HABILITAT: "no-habilitat",
  SENSE_SESSIO: "sense-sessio",
  NO_DISPONIBLE: "no-disponible",
  DESCONEGUT: "desconegut"
});
var MISSATGE_SEGON_FACTOR = Object.freeze({
  [CODI_SEGON_FACTOR.CODI_INVALID]: "El codi no \xE9s correcte. Mira l\u2019aplicaci\xF3 d\u2019autenticaci\xF3 i torna-ho a provar.",
  [CODI_SEGON_FACTOR.REPTE_CADUCAT]: "El repte ha caducat. Demana\u2019n un altre i escriu el codi nou.",
  [CODI_SEGON_FACTOR.FACTOR_NO_TROBAT]: "Este segon factor ja no existix. Recarrega i torna-ho a provar.",
  [CODI_SEGON_FACTOR.NOM_REPETIT]: "Ja tens un segon factor amb este nom. Tria\u2019n un altre.",
  [CODI_SEGON_FACTOR.MASSA_FACTORS]: "Ja tens el m\xE0xim de segons factors inscrits. Retira\u2019n un abans d\u2019afegir-ne un altre.",
  [CODI_SEGON_FACTOR.NO_HABILITAT]: "Este node no t\xE9 habilitat el segon factor. Cal activar-lo al servidor.",
  [CODI_SEGON_FACTOR.SENSE_SESSIO]: "Cal iniciar sessi\xF3 per a gestionar el segon factor.",
  [CODI_SEGON_FACTOR.NO_DISPONIBLE]: "El segon factor no est\xE0 disponible en este mode: cal un servidor d\u2019autenticaci\xF3.",
  [CODI_SEGON_FACTOR.DESCONEGUT]: "No s\u2019ha pogut completar l\u2019operaci\xF3 del segon factor. Torna-ho a provar."
});
var CODI_PERSONALITZACIO = Object.freeze({
  CAL_SEGON_FACTOR: "cal-segon-factor",
  CONFLICTE_VERSIO: "conflicte-versio",
  CLAU_INVALIDA: "clau-invalida",
  SENSE_SESSIO: "sense-sessio",
  NO_DISPONIBLE: "no-disponible",
  DESCONEGUT: "desconegut"
});
var MISSATGE_PERSONALITZACIO = Object.freeze({
  [CODI_PERSONALITZACIO.CAL_SEGON_FACTOR]: "Cal confirmar el segon factor per a desar.",
  [CODI_PERSONALITZACIO.CONFLICTE_VERSIO]: "Alg\xFA ha desat una versi\xF3 m\xE9s nova. Recarrega i torna a aplicar el canvi.",
  [CODI_PERSONALITZACIO.CLAU_INVALIDA]: "Nom\xE9s es poden desar la taxonomia i l\u2019estil.",
  [CODI_PERSONALITZACIO.SENSE_SESSIO]: "Cal iniciar sessi\xF3 com a superadmin per a desar.",
  [CODI_PERSONALITZACIO.NO_DISPONIBLE]: "El servidor encara no t\xE9 les funcions de personalitzaci\xF3. Cal aplicar la migraci\xF3 pendent.",
  [CODI_PERSONALITZACIO.DESCONEGUT]: "No s\u2019ha pogut desar la personalitzaci\xF3. Torna-ho a provar."
});

// ../../../../../private/tmp/sdp-codex-o89/candidate/src/data/local/enxufeBackendOfflineFirst.js
var fail = (code, text) => Object.assign(new Error(text), { code, codi: code });
var avortat = () => Object.assign(fail("SDP-OFFLINE-CANCEL", "Operaci\xF3 offline cancel\xB7lada."), { name: "AbortError" });
var IGUAL = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var MUTACIONS = /* @__PURE__ */ new Set(["createNote", "updateNote", "mouNota", "esborraNota"]);
var LECTURES_CACHE = /* @__PURE__ */ new Set(["loadNotes", "loadMur", "loadCoreContent"]);
var CLOCK_ID = "@sdp:backend-cache-clock";
var CLOCK_KIND = "backend-cache-clock-v1";
function epochDe(rows) {
  const row = rows.find((r) => r.id === CLOCK_ID);
  if (!row) return 0;
  if (row.kind !== CLOCK_KIND || !Number.isSafeInteger(row.epoch) || row.epoch < 0) throw fail("SDP-OFFLINE-CACHE", "Rellotge de cau inv\xE0lid.");
  return row.epoch;
}
function avancaEpoch(rows) {
  const epoch = epochDe(rows) + 1;
  if (!Number.isSafeInteger(epoch)) throw fail("SDP-OFFLINE-CACHE", "Rellotge de cau esgotat.");
  return [...rows.filter((r) => r.id !== CLOCK_ID), { id: CLOCK_ID, kind: CLOCK_KIND, epoch }];
}
function projectaNotesOffline(entrada, op, context2 = {}) {
  const value = copiaJSON(entrada);
  if (op.resource !== "notes" || !Array.isArray(value?.notes)) return value;
  const config = context2.selectors?.[1]?.kind === "value" ? context2.selectors[1].value : {};
  const requested = typeof config?.noteId === "string" ? config.noteId : value.noteResolution?.id;
  if (requested && requested !== op.recordId) return value;
  const notes = value.notes;
  if (op.action === "delete") {
    value.notes = notes.filter((n) => n.id !== op.recordId);
    if (requested) value.noteResolution = { id: requested, status: "not-found" };
  } else if (op.action === "create") {
    const fullList = config && !Object.keys(config).length && value.notesComplete !== false && value.complete !== false;
    if ((requested || fullList) && !notes.some((n) => n.id === op.recordId)) {
      value.notes = [...notes, Object.assign({}, copiaJSON(op.changes), { id: op.recordId })];
      if (requested) value.noteResolution = { id: requested, status: "found" };
    }
  } else if (op.action === "update") {
    value.notes = notes.map((n) => n.id === op.recordId ? Object.assign({}, n, copiaJSON(op.changes), { id: n.id }) : n);
  }
  return value;
}
var DEFAULT_LECTURES = Object.freeze({
  loadNotes: Object.freeze({ colleccio: "notes", clau: clauLecturaCompleta, projecta: projectaNotesOffline }),
  loadMur: Object.freeze({ colleccio: "bans", clau: clauLecturaCompleta }),
  loadCoreContent: Object.freeze({ colleccio: "directory", clau: clauLecturaCompleta })
});
function clauLecturaCompleta(args) {
  return args.map((value, index) => {
    if (value === void 0) return { kind: "undefined" };
    if (index !== 1 || value === null || typeof value !== "object") return { kind: "value", value: copiaJSON(value, 16384) };
    const copy = /* @__PURE__ */ Object.create(null);
    for (const [key, d] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (!Object.hasOwn(d, "value")) throw fail("SDP-OFFLINE-CONFIG", "Els selectors no poden tindre accessors.");
      if (key !== "signal") Object.defineProperty(copy, key, { value: d.value, enumerable: d.enumerable, writable: true, configurable: true });
    }
    return { kind: "value", value: copiaJSON(copy, 16384) };
  });
}
function esErrorTransportOffline(error2) {
  const status = error2?.status ?? error2?.statusCode;
  if (typeof status === "number" && status > 0) return false;
  return error2?.name !== "AbortError" && [CODI_BACKEND_INABASTABLE, "servidor-inabastable", "offline"].includes(error2?.codi ?? error2?.code);
}
function metode(objecte, nom) {
  let p2 = objecte;
  while (p2 && p2 !== Object.prototype) {
    const d = Object.getOwnPropertyDescriptor(p2, nom);
    if (d) {
      if (!Object.hasOwn(d, "value") || typeof d.value !== "function") throw fail("SDP-OFFLINE-CONFIG", "El port ha de declarar m\xE8todes, sense accessors.");
      return d.value.bind(objecte);
    }
    p2 = Object.getPrototypeOf(p2);
  }
  return null;
}
function senyalDelsArguments(args) {
  for (let i = args.length - 1; i >= 0; i -= 1) {
    const a = args[i];
    if (a && typeof a === "object") {
      const d = Object.getOwnPropertyDescriptor(a, "signal");
      if (d && !Object.hasOwn(d, "value")) throw fail("SDP-OFFLINE-CONFIG", "Signal no pot ser un accessor.");
      if (d?.value !== void 0) return d.value;
    }
  }
  return void 0;
}
function creaEnxufeBackendOfflineFirst({
  port,
  persistencia,
  cua,
  replayPort,
  obteAbast,
  estaConnectat = () => globalThis.navigator?.onLine !== false,
  lectures = DEFAULT_LECTURES,
  escriptures = {},
  eventTarget = globalThis.window,
  onError = () => {
  },
  crypto: crypto2 = globalThis.crypto,
  timeoutMs = 15e3,
  maxCacheEntries = 64
} = {}) {
  if (!port || !persistencia || !cua || typeof obteAbast !== "function" || typeof estaConnectat !== "function" || typeof onError !== "function" || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 6e4 || !Number.isSafeInteger(maxCacheEntries) || maxCacheEntries < 1 || maxCacheEntries > 512) {
    throw fail("SDP-OFFLINE-CONFIG", "Configuraci\xF3 de l\u2019enxufe offline inv\xE0lida.");
  }
  const abast2 = validaAbast(obteAbast());
  if (!IGUAL(abast2, validaAbast(persistencia.abast)) || !IGUAL(abast2, validaAbast(cua.abast))) {
    throw fail("SDP-OFFLINE-ABAST", "Port, cau i cua han de compartir el mateix \xE0mbit.");
  }
  const checkScope = () => {
    if (closed) throw avortat();
    if (!IGUAL(abast2, validaAbast(obteAbast()))) throw fail("SDP-OFFLINE-ABAST", "La identitat o el backend han canviat; crea un enxufe nou.");
  };
  const notify = (code, method) => {
    try {
      onError(Object.freeze({ code, method }));
    } catch {
    }
  };
  const lectura = /* @__PURE__ */ new Map(), escriptura = /* @__PURE__ */ new Map();
  for (const [name, d] of Object.entries(lectures)) {
    if (!LECTURES_CACHE.has(name) || !CONTRACTE_BACKEND.includes(name) || !metode(port, name) || !d || !COLLECCIONS_RURALS.includes(d.colleccio) || typeof d.clau !== "function") {
      throw fail("SDP-OFFLINE-CONFIG", "Descriptor de lectura desconegut.");
    }
    lectura.set(name, { colleccio: d.colleccio, clau: d.clau, projecta: typeof d.projecta === "function" ? d.projecta : null });
  }
  for (const [name, d] of Object.entries(escriptures)) {
    if (!MUTACIONS.has(name) || !metode(port, name) || !d || typeof d.prepara !== "function" || typeof d.resultat !== "function" || !COLLECCIONS_RURALS.includes(d.resource) || replayPort?.capacitats?.idempotenciaOffline !== true || typeof replayPort?.applyOfflineMutation !== "function") {
      throw fail("SDP-OFFLINE-IDEMPOTENCIA", "L\u2019escriptura offline requerix un descriptor de Notes i replay idempotent expl\xEDcit.");
    }
    escriptura.set(name, { prepara: d.prepara, resultat: d.resultat, resource: d.resource });
  }
  let closed = false, mutacionsConfirmades = 0;
  const active2 = /* @__PURE__ */ new Set(), sequencies = /* @__PURE__ */ new Map();
  function context2(signal) {
    checkScope();
    if (signal && (typeof signal.addEventListener !== "function" || typeof signal.removeEventListener !== "function")) throw fail("SDP-OFFLINE-CONFIG", "AbortSignal inv\xE0lid.");
    const control = new AbortController();
    const abort = () => control.abort(signal?.reason ?? avortat());
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    active2.add(control);
    return {
      signal: control.signal,
      abort(reason) {
        control.abort(reason);
      },
      check() {
        if (control.signal.aborted) throw control.signal.reason?.code === "SDP-OFFLINE-TIMEOUT" ? control.signal.reason : avortat();
        checkScope();
      },
      close() {
        signal?.removeEventListener("abort", abort);
        active2.delete(control);
      }
    };
  }
  async function espera(fn, ctx) {
    ctx.check();
    let timer, abort;
    try {
      return await Promise.race([
        Promise.resolve().then(() => {
          ctx.check();
          return fn();
        }),
        new Promise((_, reject) => {
          abort = () => reject(ctx.signal.reason?.code === "SDP-OFFLINE-TIMEOUT" ? ctx.signal.reason : avortat());
          ctx.signal.addEventListener("abort", abort, { once: true });
          timer = setTimeout(() => ctx.abort(fail("SDP-OFFLINE-TIMEOUT", "Temps l\xEDmit de l\u2019enxufe offline.")), timeoutMs);
        })
      ]);
    } finally {
      clearTimeout(timer);
      ctx.signal.removeEventListener("abort", abort);
    }
  }
  async function cacheKey(name, d, args, ctx) {
    const value = copiaJSON(d.clau(args), 16384);
    if (typeof crypto2?.subtle?.digest !== "function") throw fail("SDP-OFFLINE-CRYPTO", "SHA-256 no disponible.");
    const digest2 = await espera(() => crypto2.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value))), ctx);
    ctx.check();
    return { id: `backend:${name}:${[...new Uint8Array(digest2)].map((x) => x.toString(16).padStart(2, "0")).join("")}`, selectors: value };
  }
  async function projecta(value, d, ctx, selectors) {
    const copy = copiaJSON(value);
    if (!d.projecta) return copy;
    const pending = await espera(() => cua.peekOfflineQueue({ signal: ctx.signal }), ctx);
    ctx.check();
    const ops = Array.isArray(pending?.entries) ? pending.entries : [];
    let out2 = copy;
    for (const op of ops) {
      if (pending.blocked && op.opId === pending.blocked.opId) break;
      out2 = copiaJSON(d.projecta(out2, copiaJSON(op), { selectors }));
    }
    return out2;
  }
  function argumentsAmbSenyal(args, signal) {
    const out2 = args.slice();
    const config = args[1];
    const copy = /* @__PURE__ */ Object.create(null);
    if (config !== void 0 && config !== null) {
      if (typeof config !== "object" || Array.isArray(config)) throw fail("SDP-OFFLINE-CONFIG", "Configuraci\xF3 de lectura inv\xE0lida.");
      for (const [key, d] of Object.entries(Object.getOwnPropertyDescriptors(config))) {
        if (!Object.hasOwn(d, "value") || ["__proto__", "constructor", "prototype"].includes(key)) throw fail("SDP-OFFLINE-CONFIG", "Configuraci\xF3 amb accessor o clau reservada.");
        if (key !== "signal") copy[key] = d.value;
      }
    }
    copy.signal = signal;
    out2[1] = copy;
    return out2;
  }
  async function read(name, d, args) {
    const ctx = context2(senyalDelsArguments(args));
    try {
      const versioLectura = mutacionsConfirmades;
      const epochInicial = epochDe(await espera(() => persistencia.llegix(d.colleccio, { signal: ctx.signal }), ctx));
      const guard = () => {
        ctx.check();
        if (versioLectura !== mutacionsConfirmades) throw fail("SDP-OFFLINE-LECTURA-ANTIGA", "Una escriptura ha avan\xE7at la c\xF2pia local; repetix la lectura.");
      };
      const guardDurable = async () => {
        guard();
        const rows2 = await espera(() => persistencia.llegix(d.colleccio, { signal: ctx.signal }), ctx);
        guard();
        if (epochDe(rows2) !== epochInicial) throw fail("SDP-OFFLINE-LECTURA-ANTIGA", "La cau ha avan\xE7at des d\u2019una altra pestanya; repetix la lectura.");
      };
      const { id, selectors } = await cacheKey(name, d, args, ctx);
      const seq = (sequencies.get(id) ?? 0) + 1;
      sequencies.set(id, seq);
      if (estaConnectat()) {
        let result2;
        let received = false;
        try {
          result2 = await espera(() => metode(port, name)(...argumentsAmbSenyal(args, ctx.signal)), ctx);
          guard();
          received = true;
        } catch (e) {
          guard();
          if (!esErrorTransportOffline(e)) throw e;
        }
        if (received) {
          let cache;
          try {
            cache = copiaJSON(result2);
            if (sequencies.get(id) === seq) {
              await espera(() => persistencia.actualitza(d.colleccio, (rows2) => {
                guard();
                if (epochDe(rows2) !== epochInicial) throw fail("SDP-OFFLINE-LECTURA-ANTIGA", "Una altra connexi\xF3 ha avan\xE7at la cau.");
                if (sequencies.get(id) !== seq) return rows2;
                const previous = rows2.filter((r) => r.kind === "backend-response" && r.id !== id);
                const keep = maxCacheEntries > 1 ? previous.slice(-(maxCacheEntries - 1)) : [];
                return [...rows2.filter((r) => r.kind !== "backend-response"), ...keep, { id, kind: "backend-response", selectors, value: cache }];
              }, { signal: ctx.signal }), ctx);
            }
            guard();
          } catch (e) {
            guard();
            if (e.code === "SDP-OFFLINE-LECTURA-ANTIGA") throw e;
            notify(e.code ?? "SDP-OFFLINE-CACHE", name);
            if (cache === void 0) return result2;
          }
          const projected2 = await projecta(cache, d, ctx, selectors);
          await guardDurable();
          return projected2;
        }
      }
      const rows = await espera(() => persistencia.llegix(d.colleccio, { signal: ctx.signal }), ctx);
      guard();
      const cached = rows.find((r) => r.id === id && r.kind === "backend-response");
      if (!cached) throw fail("SDP-OFFLINE-SENSE-CAU", "Encara no hi ha una c\xF2pia local d\u2019esta lectura.");
      const projected = await projecta(cached.value, d, ctx, selectors);
      await guardDurable();
      return projected;
    } finally {
      ctx.close();
    }
  }
  async function drena(config = {}) {
    const ctx = context2(config.signal);
    try {
      if (!estaConnectat()) return { status: "pending", acknowledged: 0, reason: "offline" };
      if (!replayPort) return { status: "pending", acknowledged: 0, reason: "no-replay-port" };
      const before = await espera(() => cua.peekOfflineQueue({ signal: ctx.signal }), ctx);
      const out2 = await espera(() => cua.drainOfflineQueue(replayPort, { signal: ctx.signal }), ctx);
      const after = await espera(() => cua.peekOfflineQueue({ signal: ctx.signal }), ctx);
      const accepted = before.entries.filter((op) => op.seq <= after.ack.seq);
      if (accepted.length) mutacionsConfirmades += 1;
      for (const [name, d] of lectura) {
        if (!d.projecta || !accepted.some((op) => op.resource === d.colleccio)) continue;
        try {
          await espera(() => persistencia.actualitza(d.colleccio, (rows) => {
            ctx.check();
            return avancaEpoch(rows.map((row) => {
              if (row.kind !== "backend-response" || !row.id.startsWith(`backend:${name}:`)) return row;
              let value = row.value;
              for (const op of accepted) if (op.resource === d.colleccio) value = copiaJSON(d.projecta(value, op, { selectors: row.selectors }));
              return { id: row.id, kind: row.kind, selectors: row.selectors ?? [], value };
            }));
          }, { signal: ctx.signal }), ctx);
        } catch (e) {
          ctx.check();
          notify(e.code ?? "SDP-OFFLINE-CACHE", name);
        }
      }
      ctx.check();
      return out2;
    } finally {
      ctx.close();
    }
  }
  async function write(name, d, args) {
    const ctx = context2(senyalDelsArguments(args));
    try {
      const input = copiaJSON(d.prepara(args));
      if (input.resource !== d.resource) throw fail("SDP-OFFLINE-CONFIG", "La mutaci\xF3 no correspon al descriptor.");
      const op = await espera(() => cua.enqueueOfflineMutation(input, { signal: ctx.signal }), ctx);
      ctx.check();
      let result2 = { status: "pending", acknowledged: 0 };
      if (estaConnectat()) result2 = await drena({ signal: ctx.signal });
      ctx.check();
      const pending = await espera(() => cua.peekOfflineQueue({ signal: ctx.signal }), ctx);
      ctx.check();
      const queued = pending.entries.some((row) => row.opId === op.opId);
      if (result2.status === "blocked") throw fail("SDP-OFFLINE-REBUTJADA", "El servidor ha rebutjat l\u2019operaci\xF3; queda bloquejada per a revisi\xF3.");
      return d.resultat(Object.freeze({ op: copiaJSON(op), queued, committed: !queued, status: result2.status }));
    } finally {
      ctx.close();
    }
  }
  async function writeDirecte(name, fn, args) {
    const ctx = context2(senyalDelsArguments(args));
    try {
      const result2 = await espera(() => fn(...args), ctx);
      ctx.check();
      mutacionsConfirmades += 1;
      try {
        await espera(() => persistencia.actualitza("notes", (rows) => {
          ctx.check();
          return avancaEpoch(rows.filter((r) => r.kind !== "backend-response"));
        }, { signal: ctx.signal }), ctx);
      } catch (e) {
        ctx.check();
        notify(e.code ?? "SDP-OFFLINE-CACHE", name);
      }
      return result2;
    } finally {
      ctx.close();
    }
  }
  const backend = /* @__PURE__ */ Object.create(null);
  for (const name of CONTRACTE_BACKEND) {
    const fn = metode(port, name);
    if (!fn) continue;
    backend[name] = lectura.has(name) ? (...args) => read(name, lectura.get(name), args) : escriptura.has(name) ? (...args) => write(name, escriptura.get(name), args) : MUTACIONS.has(name) ? (...args) => writeDirecte(name, fn, args) : (...args) => {
      if (closed) throw avortat();
      return fn(...args);
    };
  }
  const online = () => {
    drena().catch((e) => notify(e.code ?? "SDP-OFFLINE-DRAIN", "online"));
  };
  eventTarget?.addEventListener?.("online", online);
  function destroy() {
    if (closed) return;
    closed = true;
    eventTarget?.removeEventListener?.("online", online);
    for (const control of active2) control.abort(avortat());
    active2.clear();
    sequencies.clear();
  }
  const teardown = metode(port, "destroy");
  backend.destroy = () => {
    destroy();
    return teardown?.();
  };
  return Object.freeze({ backend: Object.freeze(backend), abast: abast2, drena, destroy });
}

// ../../../../../private/tmp/sdp-codex-o89/browser-rural-tests.mjs
var result = document.querySelector("#result");
var tests = [];
var ok = (value, message) => {
  if (!value) throw new Error(message);
};
var suffix = crypto.randomUUID();
var abast = { persona: `prova-${suffix}`, tenant: "o89-fixture", endpoint: "https://offline.example", mode: "qa" };
var opts = { abast, motor: "indexeddb", indexedDB, crypto };
var p;
var q;
var h;
async function prova(name, fn) {
  try {
    await fn();
    tests.push({ name, status: "PASS" });
  } catch (e) {
    tests.push({ name, status: "FAIL", error: e.code ?? e.message });
  }
}
await prova("IndexedDB real: persist\xE8ncia despr\xE9s de tancar i reobrir", async () => {
  p = creaPersistenciaLocalRural(opts);
  await p.desa("notes", [{ id: "a", title: "Original", count: 0 }]);
  p.tanca();
  p = creaPersistenciaLocalRural(opts);
  ok((await p.llegix("notes"))[0].title === "Original", "reopen");
});
await prova("IndexedDB real: dues connexions i 30 transaccions at\xF2miques", async () => {
  const other = creaPersistenciaLocalRural(opts);
  await Promise.all(Array.from({ length: 30 }, (_, i) => (i % 2 ? p : other).actualitza("notes", (rows) => rows.map((row) => ({ id: row.id, title: row.title, count: row.count + 1 })))));
  ok((await p.llegix("notes"))[0].count === 30, "lost update");
  other.tanca();
});
await prova("SHA-256: snapshot, restauraci\xF3 i alteraci\xF3 rebutjada sense escriptura", async () => {
  const snap = await p.exportaInstantaniaLocal();
  await p.desa("notes", [{ id: "a", title: "Canviada", count: 0 }]);
  await p.restauraInstantaniaLocal(snap);
  ok((await p.llegix("notes"))[0].count === 30, "restore");
  const bad = structuredClone(snap);
  bad.collections.notes[0].title = "Alterada";
  let rejected = false;
  try {
    await p.restauraInstantaniaLocal(bad);
  } catch (e) {
    rejected = e.code === "SDP-RURAL-HASH";
  }
  ok(rejected, "hash");
  ok((await p.llegix("notes"))[0].title === "Original", "atomic rejection");
});
await prova("IndexedDB real: a\xEFllament d\u2019identitat", async () => {
  const other = creaPersistenciaLocalRural({ ...opts, abast: { ...abast, persona: "altra-prova-" + suffix } });
  ok((await other.llegix("notes")).length === 0, "scope");
  other.tanca();
});
await prova("Cua persistent real: reinici, cadena, ACK durable i mateix opId en reintent", async () => {
  q = creaCuaOperacionsOffline({ ...opts, nodeId: "browser" });
  await q.enqueueOfflineMutation({ resource: "notes", recordId: "a", action: "update", changes: { title: "Rural" } });
  q.close();
  q = creaCuaOperacionsOffline({ ...opts, nodeId: "browser" });
  ok((await q.verifyOfflineQueueChain()).valid, "chain");
  const applied = /* @__PURE__ */ new Set();
  let attempts = 0;
  const ids = [];
  const port = { capacitats: { idempotenciaOffline: true }, async applyOfflineMutation(op) {
    ids.push(op.opId);
    attempts++;
    applied.add(op.opId);
    if (attempts === 1) throw new TypeError("resposta perduda");
    return { opId: op.opId, committed: true };
  } };
  ok((await q.drainOfflineQueue(port)).status === "retryable", "retry");
  await q.drainOfflineQueue(port);
  ok(applied.size === 1 && ids[0] === ids[1], "idempotency");
  ok((await q.peekOfflineQueue()).ack.seq === 1, "durable ack");
});
await prova("Enxufe: lectura online, escriptura offline i drenatge en event online", async () => {
  let online = true;
  const events = new EventTarget();
  const raw = { notes: [{ id: "a", title: "Original" }], noteFolders: [], notesComplete: true };
  const port = { loadNotes: async () => structuredClone(raw), loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }), loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }), updateNote: async () => {
    throw new Error("RPC ordin\xE0ria no repetida");
  } };
  const replayPort = { capacitats: { idempotenciaOffline: true }, async applyOfflineMutation(op) {
    raw.notes[0].title = op.changes.title;
    return { opId: op.opId, committed: true };
  } };
  h = creaEnxufeBackendOfflineFirst({
    port,
    persistencia: p,
    cua: q,
    replayPort,
    obteAbast: () => abast,
    estaConnectat: () => online,
    eventTarget: events,
    escriptures: { updateNote: { resource: "notes", prepara: ([id, changes]) => ({ resource: "notes", recordId: id, action: "update", changes }), resultat: (value) => value } }
  });
  await h.backend.loadNotes(abast.persona);
  online = false;
  const receipt = await h.backend.updateNote("a", { title: "Pendent" });
  ok(receipt.queued, "queued");
  ok((await h.backend.loadNotes(abast.persona)).notes[0].title === "Pendent", "overlay");
  online = true;
  events.dispatchEvent(new Event("online"));
  await h.drena();
  for (let i = 0; i < 8 && (await q.peekOfflineQueue()).entries.length; i++) await h.drena();
  ok((await q.peekOfflineQueue()).entries.length === 0, "drain");
  online = false;
  ok((await h.backend.loadNotes(abast.persona)).notes[0].title === "Pendent", "cached ack");
  h.destroy();
});
await prova("Privacitat: descriptors auth i NetworkOnly rebutjats abans de selectors o cau", async () => {
  const before = JSON.stringify(await p.llegix("notes"));
  let calls = 0;
  let selectors = 0;
  for (const name of ["updateUserPassword", "enviaMissatge", "appendSectionSubmissionNetworkOnly"]) {
    let rejected = false;
    const port = { [name]: async () => {
      calls++;
      return { ok: true };
    } };
    try {
      creaEnxufeBackendOfflineFirst({ port, persistencia: p, cua: q, obteAbast: () => abast, eventTarget: null, lectures: { [name]: { colleccio: "notes", clau: (args) => {
        selectors++;
        return args;
      } } } });
    } catch (e) {
      rejected = e.code === "SDP-OFFLINE-CONFIG";
    }
    ok(rejected, "descriptor " + name);
  }
  ok(calls === 0 && selectors === 0, "callbacks");
  ok(JSON.stringify(await p.llegix("notes")) === before, "cau intacta");
});
await prova("E07: validador p\xFAblic rebutja __proto__ i variants niades abans de copiar", async () => {
  for (const key of ["__proto__", "prototype", "constructor", "proto"]) {
    let rejected = false;
    try {
      copiaJSON(JSON.parse('{"nested":{"' + key + '":{"role":"admin"}}}'));
    } catch {
      rejected = true;
    }
    ok(rejected, "reserved " + key);
  }
  ok(Object.getPrototypeOf(copiaJSON({ legitim: "text" })) === Object.prototype, "plain copied object");
  ok({}.role === void 0, "prototype intacte");
});
try {
  h?.destroy();
  q?.close();
  await p?.desa("notes", []);
  p?.tanca();
} catch {
}
var out = { schema: "sdp.qa.indexeddb.v1", engine: navigator.userAgent, realIndexedDB: typeof indexedDB.open === "function", remote: "simulat, sense xarxa", passed: tests.filter((t) => t.status === "PASS").length, failed: tests.filter((t) => t.status === "FAIL").length, tests };
result.textContent = JSON.stringify(out, null, 2);
document.title = out.failed ? "O89 QA FAIL" : "O89 QA PASS";
