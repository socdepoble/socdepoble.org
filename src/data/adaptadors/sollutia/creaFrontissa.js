/** Frontissa interna de SdP: catàleg immutable, DTO i transport de lectura acotat. */
export class ErrorDades extends Error {
  constructor(code, status = null) {
    super(code);
    this.name = 'ErrorDades';
    this.code = code;
    this.status = status;
  }
}

export function creaFrontissa({ apiOrigin, allowedOrigins, resources, fetchImpl = fetch }) {
  const base = new URL(apiOrigin);
  if (base.protocol !== 'https:' || base.username || base.password ||
      base.pathname !== '/' || base.search || base.hash ||
      !allowedOrigins.includes(base.origin)) throw new ErrorDades('INVALID_ORIGIN');

  const catalog = Object.create(null);
  for (const [name, source] of Object.entries(resources)) {
    if (source.enabled !== true) continue;
    if (!source.captureId || typeof source.decode !== 'function' ||
        typeof source.path !== 'string' || !source.path.startsWith('/') ||
        source.path.startsWith('//') || source.path.includes('\\') ||
        !Array.isArray(source.params) ||
        !Number.isSafeInteger(source.maxBytes) || source.maxBytes <= 0 ||
        !Number.isSafeInteger(source.timeoutMs) || source.timeoutMs <= 0) {
      throw new ErrorDades('INVALID_RESOURCE');
    }
    const target = new URL(source.path, base);
    if (target.origin !== base.origin || target.username || target.password ||
        target.search || target.hash) throw new ErrorDades('INVALID_RESOURCE');
    catalog[name] = Object.freeze({
      url: target.href, decode: source.decode,
      params: Object.freeze([...source.params]),
      maxBytes: source.maxBytes, timeoutMs: source.timeoutMs
    });
  }
  Object.freeze(catalog);

  return async function llig(name, params = {}, { signal } = {}) {
    if (!Object.hasOwn(catalog, name)) throw new ErrorDades('UNKNOWN_RESOURCE');
    const resource = catalog[name];
    const url = new URL(resource.url);
    for (const [key, value] of Object.entries(params)) {
      if (!resource.params.includes(key) ||
          !['string', 'number', 'boolean'].includes(typeof value) ||
          (typeof value === 'number' && !Number.isFinite(value)) ||
          String(value).length > 512) throw new ErrorDades('INVALID_QUERY');
      url.searchParams.set(key, String(value));
    }
    if (url.href.length > 4096) throw new ErrorDades('INVALID_QUERY');
    if (signal?.aborted) throw new ErrorDades('CANCELLED');
    const controller = new AbortController();
    let expired = false;
    let reader;
    let completed = false;
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => { expired = true; controller.abort(); }, resource.timeoutMs);
    try {
      const response = await fetchImpl(url.href, {
        method: 'GET', credentials: 'omit', redirect: 'error',
        headers: { Accept: 'application/json' }, signal: controller.signal
      });
      if (!response.ok) {
        throw new ErrorDades(response.status === 401 ? 'UNAUTHENTICATED'
          : response.status === 403 ? 'FORBIDDEN' : 'UNAVAILABLE', response.status);
      }
      const type = response.headers.get('content-type') || '';
      if (!/^application\/(?:[a-z0-9.+-]+\+)?json(?:;|$)/i.test(type)) {
        throw new ErrorDades('INVALID_PAYLOAD');
      }
      const declared = response.headers.get('content-length');
      if (declared && Number(declared) > resource.maxBytes) throw new ErrorDades('PAYLOAD_TOO_LARGE');
      if (!response.body?.getReader) throw new ErrorDades('INVALID_PAYLOAD');
      reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: true });
      let bytes = 0;
      let text = '';
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > resource.maxBytes) throw new ErrorDades('PAYLOAD_TOO_LARGE');
        text += decoder.decode(part.value, { stream: true });
      }
      text += decoder.decode();
      if (controller.signal.aborted) throw new ErrorDades(expired ? 'TIMEOUT' : 'CANCELLED');
      let dto;
      try { dto = resource.decode(JSON.parse(text)); }
      catch { throw new ErrorDades('INVALID_PAYLOAD'); }
      completed = true;
      return dto;
    } catch (error) {
      if (expired) throw new ErrorDades('TIMEOUT');
      if (signal?.aborted) throw new ErrorDades('CANCELLED');
      if (error instanceof ErrorDades) throw error;
      throw new ErrorDades('UNAVAILABLE');
    } finally {
      if (!completed) {
        controller.abort();
        if (reader) await reader.cancel().catch(() => {});
      }
      reader?.releaseLock();
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
    }
  };
}
