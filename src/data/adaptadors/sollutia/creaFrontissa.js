/** Frontissa interna de SdP: catàleg immutable, DTO i transport de lectura acotat. */
export class ErrorDades extends Error {
  constructor(code, status = null) {
    super(code); this.name = 'ErrorDades'; this.code = code; this.status = status;
  }
}
const pla = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const control = /[\u0000-\u0020\u007f-\u009f\p{Cf}]/u;
/* Sostre del catàleg compartit: Notícies ja limita el sobre JSON a 3 MiB i
   l'XML a 2 MiB; l'escapat també compta dins del sobre. Cada recurs conserva el seu límit
   inferior immutable; el comptador del stream, no Content-Length, l'aplica. */
const MAXIM_BYTES_CATALEG = 3_145_728;
/* Configuració i opcions són dades: cap getter ni coerció d'objectes es
   necessita per llegir un catàleg explícit. */
function campsPropis(value, code) {
  if (!pla(value)) throw new ErrorDades(code);
  const result = Object.create(null);
  for (const key of Reflect.ownKeys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !d.enumerable || !Object.hasOwn(d, 'value')
      || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new ErrorDades(code);
    result[key] = d.value;
  }
  return result;
}
/* S'aplica també al JSON cru abans del traductor; ignorar una branca al DTO
   no pot convertir un sobre amb claus de prototip en un contracte vàlid. */
function validaSobre(value) {
  const stack = [[value, 0]];
  let nodes = 0;
  while (stack.length) {
    const [item, depth] = stack.pop();
    if (++nodes > 10_000 || depth > 32) throw new ErrorDades('INVALID_PAYLOAD');
    if (!item || typeof item !== 'object') continue;
    for (const key of Object.keys(item)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new ErrorDades('INVALID_PAYLOAD');
      stack.push([item[key], depth + 1]);
      if (stack.length + nodes > 10_000) throw new ErrorDades('INVALID_PAYLOAD');
    }
  }
  return value;
}
function rutaValida(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\') || control.test(path)) return false;
  try { return path.split('/').every(part => { const s = decodeURIComponent(part); return !['.', '..'].includes(s) && !['/', '\\', '?', '#', '%'].some(c => s.includes(c)) && !control.test(s); }); }
  catch { return false; }
}
function espera(promesa, signal) {
  return new Promise((resolve, reject) => {
    const cancel = () => { signal.removeEventListener('abort', cancel); reject(signal.reason); };
    signal.addEventListener('abort', cancel, { once: true });
    Promise.resolve(promesa).then(resolve, reject).finally(() => signal.removeEventListener('abort', cancel));
    if (signal.aborted) cancel();
  });
}
/* El traductor és síncron. Cap Promise, accessor, prototip ni referència
   mutable de fora del consumidor travessa esta instantània de dades. */
function capturaDto(entrada) {
  let nodes = 0; const vistos = new WeakSet();
  const copia = (v, profunditat) => {
    if (++nodes > 10_000 || profunditat > 32) throw new ErrorDades('INVALID_PAYLOAD');
    if (v === null || typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number' && Number.isFinite(v)) return v;
    if ((!pla(v) && !Array.isArray(v)) || vistos.has(v)) throw new ErrorDades('INVALID_PAYLOAD');
    vistos.add(v);
    let resultat;
    if (Array.isArray(v)) {
      if (v.length > 10_000 || Reflect.ownKeys(v).length !== v.length + 1) throw new ErrorDades('INVALID_PAYLOAD');
      resultat = Array.from({ length: v.length }, (_, i) => {
        const d = Object.getOwnPropertyDescriptor(v, String(i));
        if (!d || !Object.hasOwn(d, 'value')) throw new ErrorDades('INVALID_PAYLOAD');
        return copia(d.value, profunditat + 1);
      });
    } else {
      resultat = {};
      for (const k of Reflect.ownKeys(v)) {
        const d = Object.getOwnPropertyDescriptor(v, k);
        if (typeof k !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(k) || !d.enumerable || !Object.hasOwn(d, 'value')) throw new ErrorDades('INVALID_PAYLOAD');
        resultat[k] = copia(d.value, profunditat + 1);
      }
    }
    vistos.delete(v); return Object.freeze(resultat);
  };
  return copia(entrada, 0);
}

export function creaFrontissa(config) {
  const { apiOrigin, allowedOrigins, resources, fetchImpl = fetch, capturaContext = () => () => {} } = campsPropis(config, 'INVALID_RESOURCE');
  let base;
  if (typeof apiOrigin !== 'string') throw new ErrorDades('INVALID_ORIGIN');
  try { base = new URL(apiOrigin); } catch { throw new ErrorDades('INVALID_ORIGIN'); }
  if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash
    || !Array.isArray(allowedOrigins) || !allowedOrigins.includes(base.origin)) throw new ErrorDades('INVALID_ORIGIN');
  if (!pla(resources) || typeof capturaContext !== 'function') throw new ErrorDades('INVALID_RESOURCE');
  const catalog = Object.create(null);
  for (const [name, rawSource] of Object.entries(campsPropis(resources, 'INVALID_RESOURCE'))) {
    const source = campsPropis(rawSource, 'INVALID_RESOURCE');
    if (source.enabled !== true) continue;
    if (typeof source.captureId !== 'string' || !/^[A-Za-z0-9._:-]{1,200}$/.test(source.captureId) || typeof source.decode !== 'function'
      || !rutaValida(source.path) || !Array.isArray(source.params) || source.params.some(p => typeof p !== 'string' || !/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(p))
      || new Set(source.params).size !== source.params.length || !Number.isSafeInteger(source.maxBytes) || source.maxBytes <= 0 || source.maxBytes > MAXIM_BYTES_CATALEG
      || !Number.isSafeInteger(source.timeoutMs) || source.timeoutMs <= 0 || source.timeoutMs > 60_000) throw new ErrorDades('INVALID_RESOURCE');
    const target = new URL(source.path, base);
    if (target.origin !== base.origin || target.username || target.password || target.search || target.hash) throw new ErrorDades('INVALID_RESOURCE');
    catalog[name] = Object.freeze({ url: target.href, decode: source.decode, params: Object.freeze([...source.params]), maxBytes: source.maxBytes, timeoutMs: source.timeoutMs });
  }
  Object.freeze(catalog);

  return async function llig(name, params = {}, options = {}) {
    if (typeof name !== 'string' || !Object.hasOwn(catalog, name)) throw new ErrorDades('UNKNOWN_RESOURCE');
    const opts = campsPropis(options, 'INVALID_OPTIONS');
    if (Object.keys(opts).some(key => key !== 'signal')) throw new ErrorDades('INVALID_OPTIONS');
    const { signal } = opts;
    if (signal !== undefined && !(signal instanceof AbortSignal)) throw new ErrorDades('INVALID_OPTIONS');
    const resource = catalog[name], url = new URL(resource.url);
    if (!pla(params)) throw new ErrorDades('INVALID_QUERY');
    for (const key of Reflect.ownKeys(params)) {
      const d = Object.getOwnPropertyDescriptor(params, key);
      if (typeof key !== 'string' || !d.enumerable || !Object.hasOwn(d, 'value')) throw new ErrorDades('INVALID_QUERY');
      const value = d.value;
      if (!resource.params.includes(key) || !['string', 'number', 'boolean'].includes(typeof value)
        || typeof value === 'number' && !Number.isFinite(value) || String(value).length > 512) throw new ErrorDades('INVALID_QUERY');
      url.searchParams.set(key, String(value));
    }
    if (url.href.length > 4096) throw new ErrorDades('INVALID_QUERY');
    if (signal?.aborted) throw new ErrorDades('CANCELLED');
    let context;
    try { context = capturaContext(); if (typeof context !== 'function') throw new Error(); context(); }
    catch { throw new ErrorDades('CONTEXT_CHANGED'); }
    const comprovaContext = () => { try { context(); } catch { throw new ErrorDades('CONTEXT_CHANGED'); } };
    const controller = new AbortController();
    let expired = false, reader, body, completed = false;
    const cancel = () => controller.abort(new ErrorDades('CANCELLED'));
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
    const timer = setTimeout(() => { expired = true; controller.abort(new ErrorDades('TIMEOUT')); }, resource.timeoutMs);
    try {
      if (controller.signal.aborted) throw controller.signal.reason;
      const response = await espera(fetchImpl(url.href, { method: 'GET', credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json' }, signal: controller.signal }), controller.signal);
      body = response.body;
      comprovaContext();
      if (!response.ok) throw new ErrorDades(response.status === 401 ? 'UNAUTHENTICATED' : response.status === 403 ? 'FORBIDDEN' : 'UNAVAILABLE', response.status);
      if (response.status === 206 || response.redirected === true
        || response.url && new URL(response.url).href !== url.href) throw new ErrorDades('INVALID_PAYLOAD');
      const type = response.headers.get('content-type') || '';
      if (!/^application\/(?:[a-z0-9.+-]+\+)?json(?:;|$)/i.test(type)) throw new ErrorDades('INVALID_PAYLOAD');
      const declared = response.headers.get('content-length');
      if (declared && (!/^\d{1,10}$/.test(declared) || Number(declared) > resource.maxBytes)) throw new ErrorDades('PAYLOAD_TOO_LARGE');
      if (!response.body?.getReader) throw new ErrorDades('INVALID_PAYLOAD');
      reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: true }), parts = [];
      let bytes = 0, chunks = 0;
      for (;;) {
        const part = await espera(reader.read(), controller.signal); comprovaContext();
        if (part.done) break;
        if (!ArrayBuffer.isView(part.value) || part.value.BYTES_PER_ELEMENT !== 1 || !part.value.byteLength || ++chunks > 65_536) throw new ErrorDades('INVALID_PAYLOAD');
        bytes += part.value.byteLength;
        if (bytes > resource.maxBytes) throw new ErrorDades('PAYLOAD_TOO_LARGE');
        try { parts.push(decoder.decode(part.value, { stream: true })); }
        catch { throw new ErrorDades('INVALID_PAYLOAD'); }
      }
      try { parts.push(decoder.decode()); }
      catch { throw new ErrorDades('INVALID_PAYLOAD'); }
      if (controller.signal.aborted) throw controller.signal.reason;
      let dto;
      try {
        const decoded = resource.decode(validaSobre(JSON.parse(parts.join(''))));
        if (decoded instanceof Promise) { decoded.catch(() => {}); throw new ErrorDades('INVALID_PAYLOAD'); }
        dto = capturaDto(decoded);
      } catch { throw new ErrorDades('INVALID_PAYLOAD'); }
      comprovaContext();
      if (controller.signal.aborted || signal?.aborted) throw new ErrorDades(expired ? 'TIMEOUT' : 'CANCELLED');
      completed = true; return dto;
    } catch (error) {
      if (expired) throw new ErrorDades('TIMEOUT');
      if (signal?.aborted) throw new ErrorDades('CANCELLED');
      if (error instanceof ErrorDades) throw error;
      throw new ErrorDades('UNAVAILABLE');
    } finally {
      if (!completed) {
        controller.abort();
        try { Promise.resolve(reader ? reader.cancel() : body?.cancel()).catch(() => {}); } catch { /* Ja avortat. */ }
      }
      try { reader?.releaseLock(); } catch { /* Una lectura avortada encara pot estar pendent. */ }
      clearTimeout(timer); signal?.removeEventListener('abort', cancel);
    }
  };
}
