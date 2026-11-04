/**
 * Persistència rural opcional. No importa backendPort ni activa cap mode.
 * OPFS opt-in: snapshot de lot en un fitxer + Web Locks.
 * IndexedDB: un read/modify/write dins de la mateixa transacció; l'ack és
 * oncomplete. WebCrypto sempre fora de la transacció. Memòria és opt-in.
 * SHA-256 acredita integritat, no autenticitat ni xifrat. Les instantànies
 * són privades de persona+tenant+endpoint+mode i no inclouen la cua ni auth.
 * https://www.w3.org/TR/IndexedDB/#transactions
 */
import { sha256Hex } from './federacio/portabilitatFediversity.js';

export const COLLECCIONS_RURALS = Object.freeze(['bans', 'notes', 'directory', 'calendar', 'catalog']);
export const ESQUEMA_INSTANTANIA_RURAL = 'sdp.instantania-local-rural.v1';
const ESQUEMA_COLLECCIONS = 'sdp.colleccions-rural.v1';
const DB = 'sdp-rural-v1';
const STORE = 'estat';
const CLAU_COLLECCIONS = 'colleccions';
const MAX_BYTES = 4 * 1024 * 1024;
// Entrades normalitzades amb normalitzaClau: __proto__ també esdevé «proto».
const PROHIBIDES = new Set(['proto', 'prototype', 'constructor', 'accesstoken', 'refreshtoken', 'idtoken',
  'authorization', 'token', 'secret', 'credentials', 'session', 'auth', 'jwt', 'password', 'contrasenya', 'privatekey', 'secretkey', 'servicekey', 'servicerolekey', 'apikey']);
const encoder = new TextEncoder();
// Les instàncies que compartixen Map i abast compartixen també el pany.
const MEMORIA_OCUPADA = new WeakMap();
const error = (code, missatge, cause) => Object.assign(new Error(missatge, cause ? { cause } : undefined), { code });
const invalid = missatge => error('SDP-RURAL-INVALID', missatge);
const cancel = () => Object.assign(error('SDP-RURAL-CANCEL', 'Operació rural cancel·lada.'), { name: 'AbortError' });
const esPla = valor => valor !== null && typeof valor === 'object' && !Array.isArray(valor)
  && (Object.getPrototypeOf(valor) === Object.prototype || Object.getPrototypeOf(valor) === null);
const enter = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
const normalitzaClau = clau => clau.toLowerCase().replace(/[_-]/g, '');

/** Còpia JSON estricta: cap getter, toJSON, símbol, prototip especial, cicle,
 * buit d'array, undefined, NaN ni propietat no enumerable. Límits abans de
 * stringify/digest; no s'estén mai un objecte rebut sense validar-lo. */
function copiaJSON(valor, limitBytes = MAX_BYTES) {
  const vist = new WeakSet();
  let nodes = 0;
  let pressupost = 0;
  function copia(v, depth) {
    nodes += 1;
    if (depth > 24 || nodes > 50000) throw invalid('Estructura JSON rural massa gran.');
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) throw invalid('Nombre JSON rural no finit.');
      return Object.is(v, -0) ? 0 : v;
    }
    if (typeof v === 'string') {
      pressupost += v.length;
      if (pressupost > limitBytes) throw invalid('Dades rurals per damunt de la quota.');
      return v;
    }
    if (typeof v !== 'object' || vist.has(v) || (!Array.isArray(v) && !esPla(v))) throw invalid('Tipus JSON rural no admés.');
    if (Object.getOwnPropertySymbols(v).length) throw invalid('Símbols no admesos.');
    vist.add(v);
    const descriptors = Object.getOwnPropertyDescriptors(v);
    let result;
    if (Array.isArray(v)) {
      if (v.length > 10000 || Object.keys(descriptors).length !== v.length + 1) throw invalid('Llista rural invàlida.');
      result = [];
      for (let i = 0; i < v.length; i += 1) {
        const d = descriptors[i];
        if (!d || !Object.hasOwn(d, 'value') || !d.enumerable) throw invalid('Llista amb buits o accessors.');
        result.push(copia(d.value, depth + 1));
      }
    } else {
      result = {};
      for (const key of Object.keys(descriptors).sort()) {
        const d = descriptors[key];
        if (!key || key.length > 128 || /[\u0000-\u001f]/.test(key) || PROHIBIDES.has(normalitzaClau(key))
            || !Object.hasOwn(d, 'value') || !d.enumerable) throw invalid('Clau JSON rural no admesa.');
        pressupost += key.length;
        if (pressupost > limitBytes) throw invalid('Dades rurals per damunt de la quota.');
        Object.defineProperty(result, key, { value: copia(d.value, depth + 1), enumerable: true, writable: true, configurable: true });
      }
    }
    vist.delete(v);
    return result;
  }
  const result = copia(valor, 0);
  if (encoder.encode(JSON.stringify(result)).byteLength > limitBytes) throw invalid('Quota de bytes rural excedida.');
  return result;
}

function clausExactes(objecte, keys) {
  if (!esPla(objecte) || Object.keys(objecte).sort().join('\u0000') !== [...keys].sort().join('\u0000')) throw invalid('Esquema rural desconegut.');
}
function textAbast(text, max) {
  if (typeof text !== 'string' || !text || text !== text.trim() || text.length > max || /[\u0000-\u001f\u007f]/.test(text)) throw invalid('Abast rural invàlid.');
  return text;
}
function validaAbast(entrada) {
  const a = copiaJSON(entrada, 4096);
  clausExactes(a, ['persona', 'tenant', 'endpoint', 'mode']);
  const abast = { persona: textAbast(a.persona, 256), tenant: textAbast(a.tenant, 256),
    endpoint: textAbast(a.endpoint, 2048), mode: textAbast(a.mode, 64) };
  // Sentinels locals explícits. Una URL malformada no pot esquivar la
  // comprovació de credencials fent-se passar per una etiqueta qualsevol.
  if (!['local', 'seed'].includes(abast.endpoint)) {
    let u;
    try { u = new URL(abast.endpoint); } catch { throw invalid('Endpoint rural malformat.'); }
    if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password || u.search || u.hash) {
      throw invalid('L’endpoint rural ha de ser HTTP(S), sense credencials, consulta ni fragment.');
    }
  }
  return Object.freeze(abast);
}
const canon = valor => JSON.stringify(copiaJSON(valor));
const abastIgual = (a, b) => canon(a) === canon(b);
const keyValida = key => textAbast(key, 512);
function comprovaSenyal(signal) { if (signal?.aborted) throw cancel(); }
function estatValid(entrada, limitBytes) {
  if (entrada === undefined || entrada === null) return null;
  const state = copiaJSON(entrada, limitBytes);
  if (!esPla(state) || !enter(state.revision, 1, Number.MAX_SAFE_INTEGER)) throw invalid('Revisió rural invàlida.');
  return state;
}
function clausDeLot(entrada) {
  if (!Array.isArray(entrada) || entrada.length < 1 || entrada.length > 8) throw invalid('Un lot rural necessita d’una a huit claus.');
  const claus = copiaJSON(entrada, 32768).map(keyValida);
  if (new Set(claus).size !== claus.length) throw invalid('El lot rural repetix una clau.');
  return claus;
}
function propietatsDeDades(valor) {
  if (!esPla(valor) || Object.getOwnPropertySymbols(valor).length) throw invalid('La transformació rural ha de tornar dades síncrones.');
  const descriptors = Object.getOwnPropertyDescriptors(valor);
  if (Object.values(descriptors).some(d => !d.enumerable || !Object.hasOwn(d, 'value'))) throw invalid('Accessors i propietats ocultes no admesos en el lot rural.');
  return descriptors;
}
function resultatDeLot(result, claus, limitBytes) {
  const descriptors = propietatsDeDades(result);
  clausExactes(descriptors, ['next', 'value']);
  const next = propietatsDeDades(descriptors.next.value);
  const canvis = [];
  for (const [clau, d] of Object.entries(next)) {
    if (!claus.includes(clau) || d.value === undefined) throw invalid('El lot rural només pot canviar les claus declarades.');
    canvis.push([clau, d.value === null ? null : estatValid(d.value, limitBytes)]);
  }
  // També el resultat s’ha de poder lliurar abans de la primera escriptura.
  return { canvis, value: copiaJSON(descriptors.value.value, limitBytes) };
}
// Esperes acotades, amb cancel·lació del consumidor. No hi ha cap interval
// ni reintent de fons; el timeout no pot cancel·lar WebCrypto ja començat.
function esperaAcotada(promesa, signal, timeoutMs, pendents) {
  comprovaSenyal(signal);
  return new Promise((resolve, reject) => {
    let fet = false;
    const neteja = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); pendents?.delete(tancat); };
    const acaba = (e, valor) => { if (fet) return; fet = true; neteja(); if (e) reject(e); else resolve(valor); };
    const abort = () => acaba(cancel());
    const tancat = () => acaba(error('SDP-RURAL-TANCAT', 'Magatzem rural tancat.'));
    const timer = setTimeout(() => acaba(error('SDP-RURAL-TIMEOUT', 'Operació rural fora de termini.')), timeoutMs);
    signal?.addEventListener('abort', abort, { once: true });
    pendents?.add(tancat);
    Promise.resolve(promesa).then(v => acaba(null, v), e => acaba(e));
    if (signal?.aborted) abort();
  });
}

function errorIDB(cause) {
  if (cause?.code?.startsWith?.('SDP-RURAL-')) return cause;
  return error(cause?.name === 'QuotaExceededError' ? 'SDP-RURAL-QUOTA' : 'SDP-RURAL-IDB', 'No s’ha pogut confirmar la persistència rural.', cause);
}

function creaMotorRural({ abast, motor = 'indexeddb', indexedDB = globalThis.indexedDB,
  memoria = new Map(), limitBytes = MAX_BYTES, timeoutMs = 10000, generacio = null,
  storage = globalThis.navigator?.storage, locks = globalThis.navigator?.locks, comprovaAbast = () => {} } = {}) {
  if (typeof comprovaAbast !== 'function') throw invalid('El comprovador d’abast ha de ser una funció.');
  const scope = validaAbast(abast);
  if (!['memoria', 'indexeddb', 'opfs'].includes(motor)) throw invalid('Motor rural desconegut.');
  if (!enter(limitBytes, 512, 32 * 1024 * 1024) || !enter(timeoutMs, 1, 60000)) throw invalid('Límits rurals invàlids.');
  if (motor === 'memoria' && !(memoria instanceof Map)) throw invalid('La memòria rural ha de ser un Map explícit.');
  const generacioVigent = generacio === null ? null : copiaJSON(generacio, 4096);
  if (generacioVigent !== null) {
    clausExactes(generacioVigent, ['clau', 'id']);
    keyValida(generacioVigent.clau); textAbast(generacioVigent.id, 512);
    Object.freeze(generacioVigent);
  }
  const prefix = canon(scope);
  const keyOf = key => JSON.stringify([prefix, keyValida(key)]);
  let closed = false;
  let database = null;
  let opening = null;
  let failOpening = null;
  const pendents = new Set();
  const active = new Set();
  const check = signal => { comprovaAbast(); comprovaSenyal(signal); if (closed) throw error('SDP-RURAL-TANCAT', 'Magatzem rural tancat.'); };

  function open() {
    check();
    if (!indexedDB || typeof indexedDB.open !== 'function') return Promise.reject(error('SDP-RURAL-NO-IDB', 'IndexedDB no disponible; no es fa fallback a memòria.'));
    if (database) return Promise.resolve(database);
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => fail(error('SDP-RURAL-TIMEOUT', 'Obertura rural fora de termini.')), timeoutMs);
      const fail = cause => { if (settled) return; settled = true; clearTimeout(timer); failOpening = null; reject(errorIDB(cause)); };
      failOpening = fail;
      let request;
      try { request = indexedDB.open(DB, 1); } catch (e) { fail(e); return; }
      request.onupgradeneeded = () => {
        try { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); }
        catch (e) { try { request.transaction.abort(); } catch { /* ja acabada */ } fail(e); }
      };
      request.onerror = () => fail(request.error);
      request.onblocked = () => fail(error('SDP-RURAL-BLOCKED', 'Una altra connexió bloqueja el magatzem rural.'));
      request.onsuccess = () => {
        if (settled || closed) { request.result.close(); fail(error('SDP-RURAL-TANCAT', 'Magatzem rural tancat.')); return; }
        settled = true; clearTimeout(timer); failOpening = null; database = request.result;
        const connection = database;
        const oblida = () => { if (database === connection) { database = null; opening = null; } };
        connection.onversionchange = () => { connection.close(); oblida(); };
        connection.onclose = oblida;
        resolve(connection);
      };
    });
    // Un error no deixa una promesa rebutjada memoritzada com a connexió bona.
    opening = opening.catch(e => { opening = null; throw e; });
    return opening;
  }

  const verificaGeneracio = state => {
    if (generacioVigent && state?.id !== generacioVigent.id) throw error('SDP-RURAL-GENERACIO', 'La generació del dispositiu rural ha canviat.');
  };

  /* OPFS opt-in: un sol fitxer per abast conté totes les claus. Web Locks
     serialitza read/modify/write entre pestanyes; close() del writable és
     l'únic punt de commit del lot complet. No existeix fallback a memòria.
     https://fs.spec.whatwg.org/#api-filesystemfilehandle-createwritable
     https://www.w3.org/TR/web-locks/#api-lockmanager-request */
  const hashOpfs = motor === 'opfs' ? sha256Hex(prefix) : null;
  const nomOpfs = `sdp-rural-${hashOpfs}.json`;
  let arrelOpfs = null;
  async function arrelDeOpfs() {
    if (!storage || typeof storage.getDirectory !== 'function') throw error('SDP-RURAL-NO-OPFS', 'OPFS no està disponible; no es fa fallback.');
    arrelOpfs ||= await storage.getDirectory();
    if (!arrelOpfs || typeof arrelOpfs.getFileHandle !== 'function') throw error('SDP-RURAL-NO-OPFS', 'El navegador no ha retornat un directori OPFS.');
    return arrelOpfs;
  }
  function estatOpfs(raw) {
    const data = copiaJSON(raw, limitBytes);
    clausExactes(data, ['schema', 'abast', 'estats']);
    if (data.schema !== 'sdp.opfs.atomic.v1' || !abastIgual(data.abast, scope) || !Array.isArray(data.estats)) throw invalid('Estat OPFS d’un altre àmbit o esquema.');
    const rows = new Map();
    for (const entry of data.estats) {
      clausExactes(entry, ['clau', 'estat']); const clau = keyValida(entry.clau);
      if (rows.has(clau) || entry.estat === null) throw invalid('Clau OPFS duplicada o buida.');
      rows.set(clau, estatValid(entry.estat, limitBytes));
    }
    return rows;
  }
  function transaccioOpfs(claus, transforma, signal, executaAmbPany = null) {
    check(signal);
    if (!locks || typeof locks.request !== 'function') return Promise.reject(error('SDP-RURAL-NO-LOCKS', 'Web Locks és obligatori per a OPFS.'));
    const control = new AbortController();
    let closing = false, settled = false, timer;
    return new Promise((resolve, reject) => {
      const finish = (cause, value) => {
        if (settled) return; settled = true; clearTimeout(timer);
        signal?.removeEventListener('abort', abort); active.delete(stop);
        if (cause) reject(cause); else resolve(value);
      };
      const abort = () => { control.abort(); if (!closing) finish(cancel()); };
      const stop = () => { control.abort(); if (!closing) finish(error('SDP-RURAL-TANCAT', 'Magatzem rural tancat.')); };
      const comprova = () => { check(control.signal); check(signal); };
      signal?.addEventListener('abort', abort, { once: true }); active.add(stop);
      timer = setTimeout(() => {
        control.abort();
        finish(closing ? Object.assign(error('SDP-RURAL-OPFS-COMMIT-DESCONEGUT', 'El commit OPFS no ha acabat dins del termini; torna a llegir l’estat.'), { committed: 'unknown' })
          : error('SDP-RURAL-TIMEOUT', 'Operació OPFS fora de termini.'));
      }, timeoutMs);
      const tasca = async () => {
        comprova();
        const root = await arrelDeOpfs(); comprova();
        let handle = null, writable = null, existed = true, committed = false;
        try {
          try { handle = await root.getFileHandle(nomOpfs, { create: false }); }
          catch (cause) { if (cause?.name !== 'NotFoundError') throw cause; existed = false; }
          comprova();
          let rows = new Map();
          if (handle) {
            const file = await handle.getFile(); comprova();
            if (file.size > limitBytes) throw error('SDP-RURAL-QUOTA', 'El fitxer OPFS supera la quota rural.');
            const text = await file.text(); comprova();
            if (encoder.encode(text).length > limitBytes) throw error('SDP-RURAL-QUOTA', 'El fitxer OPFS supera la quota rural.');
            let parsed; try { parsed = JSON.parse(text); } catch { throw invalid('El fitxer OPFS no és JSON vàlid.'); }
            rows = estatOpfs(parsed);
          }
          if (generacioVigent) verificaGeneracio(rows.get(generacioVigent.clau));
          const actual = Object.create(null);
          for (const clau of claus) actual[clau] = estatValid(rows.get(clau), limitBytes);
          if (executaAmbPany) {
            const value = await executaAmbPany(actual, control.signal); comprova();
            return copiaJSON(value, limitBytes);
          }
          const resultat = resultatDeLot(transforma ? transforma(actual) : { next: {}, value: actual[claus[0]] }, claus, limitBytes);
          comprova();
          if (!resultat.canvis.length) return resultat.value;
          for (const [clau, state] of resultat.canvis) { if (state === null) rows.delete(clau); else rows.set(clau, state); }
          const data = copiaJSON({ schema: 'sdp.opfs.atomic.v1', abast: scope,
            estats: [...rows].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([clau, estat]) => ({ clau, estat })) }, limitBytes);
          const text = JSON.stringify(data); comprova();
          handle ||= await root.getFileHandle(nomOpfs, { create: true }); comprova();
          writable = await handle.createWritable({ keepExistingData: false }); comprova();
          await writable.write(text); comprova();
          closing = true;
          await writable.close(); committed = true;
          try { comprovaAbast(); } catch (cause) { throw Object.assign(cause, { committed: true }); }
          // Com IDB: un abort que arriba durant un commit reeixit ha perdut
          // la carrera. Mai es retorna ACK abans del close confirmat.
          return resultat.value;
        } catch (cause) {
          if (writable && !committed) { try { await writable.abort(); } catch { /* stream ja acabat */ } }
          if (!existed && handle && !committed) { try { await root.removeEntry(nomOpfs); } catch { /* l'error original continua sent explícit */ } }
          throw cause;
        }
      };
      let feina;
      try { feina = locks.request(`sdp-rural-opfs:${hashOpfs}`, { mode: 'exclusive', signal: control.signal }, tasca); }
      catch (cause) { feina = Promise.reject(cause); }
      Promise.resolve(feina).then(value => finish(null, value), cause => {
        const traduit = cause?.code?.startsWith?.('SDP-RURAL-') ? cause
          : cause?.name === 'QuotaExceededError' ? error('SDP-RURAL-QUOTA', 'No hi ha espai per a confirmar OPFS.', cause)
            : cause?.name === 'AbortError' ? (closed ? error('SDP-RURAL-TANCAT', 'Magatzem rural tancat.') : cancel())
              : error('SDP-RURAL-OPFS', 'No s’ha pogut confirmar la persistència OPFS.', cause);
        finish(traduit);
      });
      if (signal?.aborted) abort();
    });
  }

  async function transaccioLot(keys, transforma, { signal } = {}) {
    check(signal);
    const claus = clausDeLot(keys);
    if (transforma !== null && typeof transforma !== 'function') throw invalid('Cal una transformació síncrona.');
    if (motor === 'opfs') return transaccioOpfs(claus, transforma, signal);
    const prepara = actual => resultatDeLot(transforma ? transforma(actual) : { next: {}, value: actual[claus[0]] }, claus, limitBytes);
    if (motor === 'memoria') {
      const ocupats = MEMORIA_OCUPADA.get(memoria) || new Set();
      if (ocupats.has(prefix)) throw error('SDP-RURAL-CONFLICTE', 'Transacció de memòria rural reentrant en el mateix àmbit.');
      MEMORIA_OCUPADA.set(memoria, ocupats); ocupats.add(prefix);
      try {
        const llig = key => estatValid(Map.prototype.get.call(memoria, keyOf(key)), limitBytes);
        if (generacioVigent) verificaGeneracio(llig(generacioVigent.clau));
        const actual = Object.create(null);
        for (const clau of claus) actual[clau] = llig(clau);
        const result = prepara(actual);
        check(signal);
        if (generacioVigent) verificaGeneracio(llig(generacioVigent.clau));
        for (const [clau, state] of result.canvis) {
          if (state === null) Map.prototype.delete.call(memoria, keyOf(clau));
          else Map.prototype.set.call(memoria, keyOf(clau), state);
        }
        return result.value;
      } finally {
        ocupats.delete(prefix);
        if (ocupats.size === 0) MEMORIA_OCUPADA.delete(memoria);
      }
    }
    const db = await esperaAcotada(open(), signal, timeoutMs, pendents);
    check(signal);
    return new Promise((resolve, reject) => {
      let tx;
      let value;
      let failure;
      let settled = false;
      let timer;
      const finish = cause => {
        if (settled) return;
        settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
        active.delete(abort);
        if (cause) reject(errorIDB(cause));
        // Un readwrite arribat a oncomplete ja és durable: la cancel·lació ha perdut la carrera.
        else { try { if (!transforma) check(signal); resolve(value); } catch (e) { reject(e); } }
      };
      // abort() llança en committing/finished: no es decidix ací, ho fan oncomplete/onabort.
      // Es restaura `failure` perquè un commit fallit (quota) informe del seu error real.
      const avorta = motiu => { const previ = failure; failure = motiu; try { tx.abort(); } catch { failure = previ; } };
      const abort = () => avorta(cancel());
      try {
        tx = db.transaction(STORE, transforma ? 'readwrite' : 'readonly');
        active.add(abort); signal?.addEventListener('abort', abort, { once: true });
        timer = setTimeout(() => avorta(error('SDP-RURAL-TIMEOUT', 'Transacció rural fora de termini.')), timeoutMs);
        tx.oncomplete = () => finish();
        tx.onabort = () => finish(failure || tx.error || error('SDP-RURAL-IDB', 'Transacció rural avortada.'));
        tx.onerror = () => { failure ||= tx.error; };
        const store = tx.objectStore(STORE);
        const falla = e => { failure = e; try { tx.abort(); } catch { finish(e); } };
        const transformaLot = actual => {
          try {
            check(signal);
            const result = prepara(actual);
            check(signal);
            value = result.value;
            for (const [clau, state] of result.canvis) {
              if (state === null) store.delete(keyOf(clau));
              else store.put(state, keyOf(clau));
            }
          } catch (e) { falla(e); }
        };
        const lligLot = metadata => {
          const actual = Object.create(null);
          let pendents = claus.length;
          for (const clau of claus) {
            if (generacioVigent && clau === generacioVigent.clau) {
              actual[clau] = estatValid(metadata, limitBytes);
              pendents -= 1;
            } else {
              const req = store.get(keyOf(clau));
              req.onsuccess = () => {
                try {
                  check(signal);
                  actual[clau] = estatValid(req.result, limitBytes);
                  if (--pendents === 0) transformaLot(actual);
                } catch (e) { falla(e); }
              };
            }
          }
          if (pendents === 0) transformaLot(actual);
        };
        check(signal);
        if (generacioVigent) {
          const req = store.get(keyOf(generacioVigent.clau));
          req.onsuccess = () => {
            try { check(signal); const metadata = estatValid(req.result, limitBytes); verificaGeneracio(metadata); lligLot(metadata); }
            catch (e) { falla(e); }
          };
        } else lligLot(null);
      } catch (e) { failure = e; try { tx?.abort(); } catch { /* no tx activa */ } finish(e); }
    });
  }
  function transaccio(key, transforma = null, config) {
    return transaccioLot([key], transforma ? actual => {
      const result = propietatsDeDades(transforma(actual[key]));
      if (!Object.hasOwn(result, 'value') || Object.keys(result).some(k => !['next', 'value'].includes(k))) throw invalid('Resultat de transformació rural invàlid.');
      return { next: Object.hasOwn(result, 'next') ? { [key]: result.next.value } : {}, value: result.value.value };
    } : null, config);
  }
  async function revisaGeneracio(config) {
    if (generacioVigent) await transaccio(generacioVigent.clau, null, config);
    else check(config?.signal);
  }
  function close() {
    closed = true;
    failOpening?.(error('SDP-RURAL-TANCAT', 'Magatzem rural tancat.'));
    for (const stop of [...pendents]) stop();
    for (const abort of [...active]) abort();
    database?.close(); database = null;
  }
  return { transaccio, transaccioLot, revisaGeneracio, close, check, abast: scope, limitBytes, timeoutMs, pendents,
    ambPany(claus, executa, config = {}) {
      if (motor !== 'opfs' || typeof executa !== 'function') return Promise.reject(invalid('El pany rural asíncron requerix OPFS explícit.'));
      return transaccioOpfs(clausDeLot(claus), null, config.signal, executa);
    } }; 
}

/** CAS per a la cua: absent=revision0; l'estat nou porta expected+1. */
export function creaMagatzemAtomicRural(opcions) {
  const motor = creaMotorRural(opcions);
  return Object.freeze({
    abast: motor.abast,
    // No cridar altres mètodes d'este store dins del callback (pany no reentrant).
    ambPany: (claus, executa, config) => motor.ambPany(claus, executa, config),
    read: (key, config) => motor.transaccio(key, null, config),
    actualitzaLot: (claus, transforma, config) => typeof transforma === 'function'
      ? motor.transaccioLot(claus, transforma, config) : Promise.reject(invalid('Cal una transformació síncrona.')),
    async compareAndSwap(key, expectedRevision, nextState, config) {
      if (!enter(expectedRevision, 0, Number.MAX_SAFE_INTEGER - 1)) throw invalid('Revisió esperada invàlida.');
      const next = estatValid(nextState, motor.limitBytes);
      if (!next || next.revision !== expectedRevision + 1) throw invalid('La nova revisió ha de ser expectedRevision+1.');
      return motor.transaccio(key, actual => (actual?.revision ?? 0) === expectedRevision
        ? { next, value: true } : { value: false }, config);
    },
    close: motor.close
  });
}

function buides() { return Object.fromEntries(COLLECCIONS_RURALS.map(col => [col, []])); }
function validaColleccions(entrada, limitRegistres, limitBytes) {
  const cols = copiaJSON(entrada, limitBytes);
  clausExactes(cols, COLLECCIONS_RURALS);
  let total = 0;
  for (const col of COLLECCIONS_RURALS) {
    if (!Array.isArray(cols[col])) throw invalid('Una col·lecció rural ha de ser una llista.');
    total += cols[col].length;
    if (total > limitRegistres) throw invalid('Massa registres en la instantània rural.');
    const ids = new Set();
    for (const row of cols[col]) {
      if (!esPla(row) || typeof row.id !== 'string' || !row.id || row.id.length > 512 || ids.has(row.id)) throw invalid('ID rural buit, duplicat o no textual.');
      ids.add(row.id);
    }
  }
  return cols;
}
function columna(col) { if (!COLLECCIONS_RURALS.includes(col)) throw invalid('Col·lecció rural desconeguda.'); return col; }

export function creaPersistenciaLocalRural(opcions = {}) {
  const motor = creaMotorRural(opcions);
  const { ara = Date.now, crypto = globalThis.crypto, limitRegistres = 5000 } = opcions;
  if (typeof ara !== 'function' || !enter(limitRegistres, 1, 10000)) throw invalid('Opcions de la instantània rural invàlides.');
  const colsValides = cols => validaColleccions(cols, limitRegistres, motor.limitBytes);
  function contingut(state) {
    if (state === null) return buides();
    clausExactes(state, ['schema', 'revision', 'collections']);
    if (state.schema !== ESQUEMA_COLLECCIONS) throw invalid('Estat de col·leccions desconegut.');
    return colsValides(state.collections);
  }
  function estatAmbColleccions(state, collections) {
    const original = estatValid(state, motor.limitBytes);
    contingut(original);
    return estatValid({ schema: ESQUEMA_COLLECCIONS, revision: (original?.revision ?? 0) + 1,
      collections: colsValides(collections) }, motor.limitBytes);
  }
  async function digest(payload, signal) {
    motor.check(signal);
    if (typeof crypto?.subtle?.digest !== 'function') throw error('SDP-RURAL-NO-CRYPTO', 'SHA-256 no disponible.');
    const hash = await esperaAcotada(crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(copiaJSON(payload, motor.limitBytes)))), signal, motor.timeoutMs, motor.pendents);
    motor.check(signal);
    // Una altra pestanya pot haver purgat mentre WebCrypto treballava.
    await motor.revisaGeneracio({ signal });
    return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  async function actualitza(col, transforma, config = {}) {
    columna(col);
    if (typeof transforma !== 'function') throw invalid('Cal una transformació síncrona.');
    return motor.transaccio(CLAU_COLLECCIONS, state => {
      const collections = contingut(state);
      const result = transforma(collections[col]);
      if (result?.then || !Array.isArray(result)) throw invalid('La transformació retorna una llista síncrona.');
      collections[col] = result;
      const next = estatAmbColleccions(state, collections);
      return { next, value: next.collections[col] };
    }, config);
  }
  const api = {
    abast: motor.abast,
    // Projeccions pures d’una captura atòmica: no lligen ni escriuen el dispositiu.
    colleccionsDe: state => contingut(estatValid(state, motor.limitBytes)),
    estatAmbColleccions,
    async llegix(col, config) { columna(col); return contingut(await motor.transaccio(CLAU_COLLECCIONS, null, config))[col]; },
    desa(col, records, config) { const copia = copiaJSON(records, motor.limitBytes); return actualitza(col, () => copia, config); },
    actualitza,
    async exportaInstantaniaLocal({ signal } = {}) {
      const collections = contingut(await motor.transaccio(CLAU_COLLECCIONS, null, { signal }));
      const createdAt = ara();
      if (!enter(createdAt, 0, Number.MAX_SAFE_INTEGER)) throw invalid('Rellotge rural invàlid.');
      const payload = { schema: ESQUEMA_INSTANTANIA_RURAL, abast: motor.abast, createdAt, collections };
      const sha256 = await digest(payload, signal);
      return copiaJSON({ schema: payload.schema, abast: payload.abast, createdAt, collections, sha256 }, motor.limitBytes);
    },
    async restauraInstantaniaLocal(entrada, { signal } = {}) {
      motor.check(signal);
      let raw = entrada;
      if (typeof raw === 'string') {
        if (encoder.encode(raw).byteLength > motor.limitBytes) throw invalid('Instantània massa gran.');
        try { raw = JSON.parse(raw); } catch { throw invalid('JSON de la instantània invàlid.'); }
      }
      const snap = copiaJSON(raw, motor.limitBytes);
      clausExactes(snap, ['schema', 'abast', 'createdAt', 'collections', 'sha256']);
      if (snap.schema !== ESQUEMA_INSTANTANIA_RURAL || !enter(snap.createdAt, 0, Number.MAX_SAFE_INTEGER)
          || typeof snap.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(snap.sha256)) throw invalid('Esquema de la instantània invàlid.');
      const scope = validaAbast(snap.abast);
      if (!abastIgual(scope, motor.abast)) throw error('SDP-RURAL-ABAST', 'La instantània és d’un altre àmbit.');
      const collections = colsValides(snap.collections);
      const before = await motor.transaccio(CLAU_COLLECCIONS, null, { signal });
      const payload = { schema: snap.schema, abast: scope, createdAt: snap.createdAt, collections };
      if (await digest(payload, signal) !== snap.sha256) throw error('SDP-RURAL-HASH', 'SHA-256 de la instantània divergent.');
      return motor.transaccio(CLAU_COLLECCIONS, state => {
        if ((state?.revision ?? 0) !== (before?.revision ?? 0)) throw error('SDP-RURAL-CONFLICTE', 'El destí ha canviat durant la verificació.');
        const next = estatAmbColleccions(state, collections);
        return { next, value: { revision: next.revision, registres: COLLECCIONS_RURALS.reduce((n, col) => n + collections[col].length, 0), integritat: 'sha256-verificada', autenticitat: 'no-verificada' } };
      }, { signal });
    },
    tanca: motor.close,
    close: motor.close
  };
  return Object.freeze(api);
}

export const exportaInstantaniaLocal = (persistencia, config) => persistencia.exportaInstantaniaLocal(config);
export const restauraInstantaniaLocal = (persistencia, snapshot, config) => persistencia.restauraInstantaniaLocal(snapshot, config);

// Coercionadors compartits amb la cua; no interpreten rols ni atorguen permisos.
export { copiaJSON as copiaJsonRural, validaAbast as normalitzaAbastRural };
