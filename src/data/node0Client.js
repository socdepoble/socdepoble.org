/**
 * node0Client.js — Client de lectura pública verificada del Node 0 (socdepoble.cat)
 * per a la SPA de Sóc de Poble (Fediversity · Partida 1 i 3).
 *
 * Dissenyat sota el principi de Zero-Crashes i Seguretat Perimetral:
 *  - Mai dispara cap consulta automàtica en importar-se ni en muntar PedraSecaEmbed.
 *  - Només admet orígens https:// (o http:// en loopback 127.0.0.1 / localhost per a proves).
 *  - Timeout curt per defecte (4.000 ms), sense credencials (credentials: 'omit'),
 *    sense redireccions (redirect: 'error') i amb límit estricte de bytes (512 KB).
 *  - Coacció primitiva estricta del JSON rebut (cap spread cec ni claus de prototip).
 *  - Fallback determinista quan el Node 0 està apagat, lent o fora de línia.
 */

export const ORIGEN_NODE_ZERO_DEFECTE = 'https://socdepoble.cat';
export const TIMEOUT_NODE_ZERO_DEFECTE = 4000;
export const MAX_BYTES_NODE_ZERO = 512 * 1024;
export const REL_NODEINFO_2_1 = 'http://nodeinfo.diaspora.software/ns/schema/2.1';

const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const typedArrayName = Object.getOwnPropertyDescriptor(typedArrayPrototype, Symbol.toStringTag).get;
const typedArrayByteLength = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'byteLength').get;

const CLAU_PROHIBIDA = new Set(['__proto__', 'prototype', 'constructor', 'email', 'phone', 'token', 'password', 'secret', 'privateKey', 'privateKeyPem']);
const CAMPS_TEXT_PUBLICACIO = Object.freeze([
  'id', 'slug', 'type', 'kind', 'sectionId', 'title', 'subtitle', 'summary',
  'description', 'content', 'body', 'text', 'lead', 'author', 'author_name',
  'author_entity_id', 'author_handle', 'created_at', 'updated_at', 'date',
  'time', 'inici', 'fi', 'location', 'town_name', 'town', 'poble_id',
  'comarca', 'provincia', 'image_url', 'avatar_url', 'hero_url', 'url',
  'source', 'source_url', 'canonicalUrl', 'uri', 'visibility', 'content_warning',
  'price', 'currency', 'category', 'categoryId'
]);
const CAMPS_BOOL_PUBLICACIO = Object.freeze(['isPublished', 'is_public', 'pinned', 'featured', 'sensitive']);
const CAMPS_NUM_PUBLICACIO = Object.freeze(['lat', 'lng', 'revision', 'width', 'height']);
const CAMPS_LLISTA_PUBLICACIO = Object.freeze(['tags', 'categories', 'labels']);

const esObjectePla = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
  && [Object.prototype, null].includes(Object.getPrototypeOf(v));

const cadenaSegura = (v, max = 65536) => {
  if (typeof v === 'string') return v.slice(0, max);
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
};

const enterSegur = (v, defecte = 0) => (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : defecte);

export function normalitzaOrigenNode0(origen = ORIGEN_NODE_ZERO_DEFECTE) {
  if (typeof origen !== 'string' || origen !== origen.trim() || /[\u0000-\u0020\u007f\\]/.test(origen)) {
    throw new TypeError('Origen del Node 0 invàlid.');
  }
  let url;
  try {
    url = new URL(origen);
  } catch {
    throw new TypeError('Origen del Node 0 invàlid.');
  }
  const esLoopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (
    url.username || url.password || url.search || url.hash
    || (url.pathname !== '/' && url.pathname !== '')
    || !(url.protocol === 'https:' || (url.protocol === 'http:' && esLoopback))
  ) {
    throw new TypeError('Origen del Node 0 invàlid.');
  }
  return url.origin;
}

/* R6 Bloc 4 (troballa P3 del Bloc 1) · Un camp d'URL només passa si és http(s)
   absolut sense credencials o un camí relatiu a l'arrel (mai «//»): cap
   `javascript:`, `data:` ni esquema estrany no arriba a un href o a un src.
   La barra inversa i els caràcters de control es rebutgen perquè el navegador
   els reinterpreta (`/\exemple.test` és una URL d'un altre origen). */
const CAMPS_URL_PUBLICACIO = new Set(['image_url', 'avatar_url', 'hero_url', 'url', 'source_url', 'canonicalUrl', 'uri']);
const urlSegura = (v) => {
  if (v === '' || /[\u0000-\u001f\u007f\\]/.test(v)) return '';
  if (/^\/(?!\/)/.test(v)) return v;
  try {
    const url = new URL(v);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? v : '';
  } catch {
    return '';
  }
};

export function sanejaPublicacioNode0(item) {
  if (!esObjectePla(item)) return null;
  const net = {};
  for (const camp of CAMPS_TEXT_PUBLICACIO) {
    if (Object.hasOwn(item, camp) && !CLAU_PROHIBIDA.has(camp)) {
      const cadena = cadenaSegura(item[camp]);
      const val = CAMPS_URL_PUBLICACIO.has(camp) ? urlSegura(cadena) : cadena;
      if (val !== '') net[camp] = val;
    }
  }
  if (!net.id) return null;
  if (net.visibility && net.visibility !== 'public') return null;
  for (const camp of CAMPS_BOOL_PUBLICACIO) {
    if (typeof item[camp] === 'boolean') net[camp] = item[camp];
  }
  for (const camp of CAMPS_NUM_PUBLICACIO) {
    if (typeof item[camp] === 'number' && Number.isFinite(item[camp])) net[camp] = item[camp];
  }
  for (const camp of CAMPS_LLISTA_PUBLICACIO) {
    if (Array.isArray(item[camp])) {
      net[camp] = item[camp]
        .slice(0, 50)
        .filter((v) => typeof v === 'string' && v.trim() !== '')
        .map((v) => v.slice(0, 200));
    }
  }
  return Object.freeze(net);
}

export function normalitzaEstatNode0(payload) {
  if (!esObjectePla(payload) || payload.node !== 'node0') {
    return null;
  }
  const pg = esObjectePla(payload.postgresql) ? payload.postgresql : {};
  const ap = esObjectePla(payload.activitypub) ? payload.activitypub : {};
  const ed = esObjectePla(payload.ed25519) ? payload.ed25519 : {};
  const mastodon = esObjectePla(payload.mastodon) ? payload.mastodon : {};
  const cap = esObjectePla(payload.capabilities) ? payload.capabilities : {};
  const res = esObjectePla(payload.resilience) ? payload.resilience : {};
  const mirrorContract = Object.hasOwn(res, 'workspaceMirrorConfigured');
  const mirrorConfigured = mirrorContract ? res.workspaceMirrorConfigured === true : res.encryptedMirrorConfigured === true || res.ok === true;
  const mirrorOk = mirrorContract ? mirrorConfigured && res.mirrorIntegrityOk === true && res.mirrorAuthenticationVerified === true && res.mirrorRetentionOk !== false : res.ok === true;
  const counts = esObjectePla(pg.registres) ? Object.values(pg.registres).map(v => enterSegur(v)) : [];
  const count = counts.reduce((total, v) => Math.min(Number.MAX_SAFE_INTEGER, total + v), 0);

  return Object.freeze({
    ok: pg.ok === true,
    offline: false,
    node: 'node0',
    postgresql: Object.freeze({
      ok: pg.ok === true,
      version: cadenaSegura(pg.version, 64),
      tables: enterSegur(pg.tables, enterSegur(pg.taules)),
      publicDocuments: enterSegur(pg.publicDocuments, count),
      latencyMs: enterSegur(pg.latencyMs, 0)
    }),
    resilience: Object.freeze({
      ok: mirrorOk,
      encryptedMirrorConfigured: mirrorConfigured,
      status: mirrorContract ? (mirrorOk ? 'ready' : 'pending') : cadenaSegura(res.status || (mirrorOk ? 'ready' : 'pending'), 64)
    }),
    activitypub: Object.freeze({
      active: ap.active === true,
      signatureProfile: cadenaSegura(ap.signatureProfile, 64),
      remoteInteropVerified: ap.remoteInteropVerified === true
    }),
    ed25519: Object.freeze({
      fingerprint: cadenaSegura(ed.fingerprint, 128)
    }),
    mastodon: Object.freeze({
      account: cadenaSegura(mastodon.account, 128),
      outboundConfigured: mastodon.outboundConfigured === true,
      outboundPublication: cadenaSegura(mastodon.outboundPublication, 64)
    }),
    capabilities: Object.freeze({
      publicRead: cap.publicRead === true,
      adminPublish: cap.adminPublish === true,
      possePrepared: cap.possePrepared === true,
      possePublish: cap.possePublish === true,
      userSessions: cap.userSessions === true
    })
  });
}

async function llegixJsonFitat(resposta, signal, maxBytes = MAX_BYTES_NODE_ZERO) {
  const failure = codi => Object.assign(new Error('Resposta del Node 0 invàlida.'), {codi});
  const cancelBody = () => { try { Promise.resolve(resposta?.body?.cancel?.()).catch(() => {}); } catch { /* cos ja tancat */ } };
  if (!resposta || !resposta.ok) {
    cancelBody();
    const status = Number.isInteger(resposta?.status) ? resposta.status : 0;
    throw Object.assign(new Error(`HTTP ${status}`), {codi: status === 404 ? 'NODE0_NOT_FOUND' : 'NODE0_HTTP_ERROR', status});
  }
  if (resposta.redirected) { cancelBody(); throw failure('NODE0_REDIRECT_REJECTED'); }
  const contentType = resposta.headers?.get?.('content-type') || '';
  if (!/^application\/(?:json|[a-z0-9.+-]+\+json)(?:;|$)/i.test(contentType)) { cancelBody(); throw failure('NODE0_INVALID_CONTENT_TYPE'); }
  const contentLength = resposta.headers?.get?.('content-length');
  if (contentLength != null && (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes)) { cancelBody(); throw failure('NODE0_PAYLOAD_TOO_LARGE'); }
  // Fetch streams are consumed incrementally. Never read response.text() before
  // enforcing the byte ceiling: a chunked response has no trustworthy length.
  const reader = resposta.body?.getReader?.();
  let textCos;
  if (reader) {
    const decoder = new TextDecoder('utf-8', {fatal: true}), parts = [];
    let bytes = 0;
    const cancel = () => { try { Promise.resolve(reader.cancel()).catch(() => {}); } catch { /* flux ja tancat */ } };
    signal.addEventListener('abort', cancel, {once: true});
    if (signal.aborted) cancel();
    try {
      while (true) {
        if (signal.aborted) throw failure('NODE0_ABORTED');
        const {value, done} = await reader.read();
        if (signal.aborted) throw failure('NODE0_ABORTED');
        if (done) break;
        if (!ArrayBuffer.isView(value) || typedArrayName.call(value) !== 'Uint8Array') throw failure('NODE0_INVALID_BODY');
        bytes += typedArrayByteLength.call(value);
        if (bytes > maxBytes) throw failure('NODE0_PAYLOAD_TOO_LARGE');
        parts.push(decoder.decode(value, {stream: true}));
      }
      parts.push(decoder.decode());
      textCos = parts.join('');
    } catch (cause) { cancel(); throw cause?.codi ? cause : failure('NODE0_INVALID_BODY'); }
    finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
  } else {
    // Browser Fetch exposes body.getReader for JSON. Reject transports that
    // cannot enforce a streaming ceiling, even with a declared Content-Length.
    cancelBody(); throw failure('NODE0_INVALID_BODY');
  }
  try { return JSON.parse(textCos); } catch { throw failure('NODE0_INVALID_JSON'); }
}

async function peticioGetJson(url, { fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_NODE_ZERO_DEFECTE, signal } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw Object.assign(new Error('Fetch no disponible.'), { codi: 'NODE0_FETCH_UNAVAILABLE' });
  }
  if (signal?.aborted) {
    throw Object.assign(new Error('Peticio cancel·lada.'), { codi: 'NODE0_ABORTED' });
  }
  const controlador = new AbortController();
  let perTimeout = false;
  const avortaExtern = () => controlador.abort();
  signal?.addEventListener?.('abort', avortaExtern, { once: true });
  const timer = setTimeout(() => {
    perTimeout = true;
    controlador.abort();
  }, timeoutMs);

  try {
    const resposta = await fetchImpl(url, {
      method: 'GET',
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json' },
      signal: controlador.signal
    });
    return await llegixJsonFitat(resposta, controlador.signal);
  } catch (err) {
    if (perTimeout) {
      throw Object.assign(new Error('Temps d’espera esgotat connectant al Node 0.'), { codi: 'NODE0_TIMEOUT' });
    }
    if (signal?.aborted) {
      throw Object.assign(new Error('Peticio cancel·lada.'), { codi: 'NODE0_ABORTED' });
    }
    if (err?.codi) throw err;
    throw Object.assign(new Error('Node 0 inabastable.'), { codi: 'NODE0_UNREACHABLE' });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', avortaExtern);
  }
}

export function creaNode0Client({
  origin = ORIGEN_NODE_ZERO_DEFECTE,
  fetchImpl = globalThis.fetch,
  timeoutMs = TIMEOUT_NODE_ZERO_DEFECTE,
  fallbackPosts = []
} = {}) {
  const baseOrigin = normalitzaOrigenNode0(origin);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 50 || timeoutMs > 30000) {
    throw new TypeError('timeoutMs del Node 0 fora de rang (50..30000).');
  }
  const reservaSegura = Array.isArray(fallbackPosts)
    ? Object.freeze(fallbackPosts.map(sanejaPublicacioNode0).filter(Boolean))
    : Object.freeze([]);

  async function getStatus({ signal, throwOnError = false } = {}) {
    try {
      const payload = await peticioGetJson(`${baseOrigin}/api/v1/node0/status`, { fetchImpl, timeoutMs, signal });
      const normalitzat = normalitzaEstatNode0(payload);
      if (!normalitzat) {
        throw Object.assign(new Error('Esquema d’estat del Node 0 invàlid.'), { codi: 'NODE0_INVALID_SCHEMA' });
      }
      return normalitzat;
    } catch (err) {
      if (throwOnError) throw err;
      return Object.freeze({
        ok: false,
        offline: true,
        node: 'node0',
        error: err?.codi || 'NODE0_UNREACHABLE',
        postgresql: Object.freeze({ ok: false, version: '', tables: 0, publicDocuments: 0, latencyMs: 0 }),
        resilience: Object.freeze({ ok: false, encryptedMirrorConfigured: false, status: 'offline' }),
        activitypub: Object.freeze({ active: false, signatureProfile: '', remoteInteropVerified: false }),
        ed25519: Object.freeze({ fingerprint: '' }),
        mastodon: Object.freeze({ account: '', outboundConfigured: false, outboundPublication: 'manual-confirmation' }),
        capabilities: Object.freeze({ publicRead: false, adminPublish: false, possePrepared: false, possePublish: false, userSessions: false })
      });
    }
  }

  async function getPosts({ limit = 50, signal, throwOnError = false } = {}) {
    const maxItems = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 500) : 50;
    try {
      let payload;
      try {
        payload = await peticioGetJson(`${baseOrigin}/api/v1/node0/posts`, { fetchImpl, timeoutMs, signal });
      } catch (err) {
        if (err?.status === 404 || err?.codi === 'NODE0_NOT_FOUND') {
          payload = await peticioGetJson(`${baseOrigin}/api/v1/node0/mur`, { fetchImpl, timeoutMs, signal });
        } else {
          throw err;
        }
      }
      if (!esObjectePla(payload) && !Array.isArray(payload)) {
        throw Object.assign(new Error('Esquema de publicacions invàlid.'), { codi: 'NODE0_INVALID_SCHEMA' });
      }
      const llistaCrua = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.posts)
          ? payload.posts
          : [
              ...(Array.isArray(payload.feedPosts) ? payload.feedPosts : []),
              ...(Array.isArray(payload.events) ? payload.events : []),
              ...(Array.isArray(payload.marketItems) ? payload.marketItems : [])
            ];
      const posts = Object.freeze(llistaCrua.slice(0, maxItems).map(sanejaPublicacioNode0).filter(Boolean));
      const feedPosts = Object.freeze(
        (Array.isArray(payload?.feedPosts) ? payload.feedPosts : posts).slice(0, maxItems).map(sanejaPublicacioNode0).filter(Boolean)
      );
      const events = Object.freeze(
        (Array.isArray(payload?.events) ? payload.events : []).slice(0, maxItems).map(sanejaPublicacioNode0).filter(Boolean)
      );
      const marketItems = Object.freeze(
        (Array.isArray(payload?.marketItems) ? payload.marketItems : []).slice(0, maxItems).map(sanejaPublicacioNode0).filter(Boolean)
      );
      return Object.freeze({
        ok: true,
        fallback: false,
        posts,
        feedPosts,
        events,
        marketItems
      });
    } catch (err) {
      if (throwOnError) throw err;
      return Object.freeze({
        ok: false,
        fallback: true,
        error: err?.codi || 'NODE0_UNREACHABLE',
        posts: reservaSegura.slice(0, maxItems),
        feedPosts: reservaSegura.slice(0, maxItems),
        events: Object.freeze([]),
        marketItems: Object.freeze([])
      });
    }
  }

  async function getNodeInfo({ includeSchema = true, signal, throwOnError = false } = {}) {
    try {
      const wellKnown = await peticioGetJson(`${baseOrigin}/.well-known/nodeinfo`, { fetchImpl, timeoutMs, signal });
      if (!esObjectePla(wellKnown) || !Array.isArray(wellKnown.links)) {
        throw Object.assign(new Error('Esquema /.well-known/nodeinfo invàlid.'), { codi: 'NODE0_INVALID_NODEINFO' });
      }
      const enllac = wellKnown.links.find(
        (l) => esObjectePla(l) && l.rel === REL_NODEINFO_2_1 && typeof l.href === 'string'
      );
      if (!enllac) {
        throw Object.assign(new Error('Falta l’enllaç NodeInfo 2.1.'), { codi: 'NODE0_MISSING_NODEINFO_2_1' });
      }
      let hrefUrl;
      try {
        hrefUrl = new URL(enllac.href, baseOrigin);
      } catch {
        throw Object.assign(new Error('URL NodeInfo 2.1 invàlida.'), { codi: 'NODE0_INVALID_NODEINFO_HREF' });
      }
      if (hrefUrl.origin !== baseOrigin) {
        throw Object.assign(new Error('L’enllaç NodeInfo 2.1 apunta fora de l’origen del Node 0.'), { codi: 'NODE0_CROSS_ORIGIN_NODEINFO' });
      }
      let schema = null;
      if (includeSchema) {
        const doc = await peticioGetJson(hrefUrl.href, { fetchImpl, timeoutMs, signal });
        if (!esObjectePla(doc) || doc.version !== '2.1') {
          throw Object.assign(new Error('Document NodeInfo 2.1 invàlid.'), { codi: 'NODE0_INVALID_NODEINFO_DOC' });
        }
        schema = Object.freeze({
          version: '2.1',
          software: Object.freeze({
            name: cadenaSegura(doc.software?.name, 64),
            version: cadenaSegura(doc.software?.version, 64)
          }),
          protocols: Object.freeze(
            (Array.isArray(doc.protocols) ? doc.protocols : [])
              .filter((p) => typeof p === 'string')
              .slice(0, 10)
              .map((p) => cadenaSegura(p, 32))
          ),
          openRegistrations: doc.openRegistrations === true
        });
      }
      return Object.freeze({
        ok: true,
        offline: false,
        href: hrefUrl.href,
        nodeInfo: schema
      });
    } catch (err) {
      if (throwOnError) throw err;
      return Object.freeze({
        ok: false,
        offline: true,
        error: err?.codi || 'NODE0_UNREACHABLE',
        href: '',
        nodeInfo: null
      });
    }
  }

  return Object.freeze({
    origin: baseOrigin,
    timeoutMs,
    getStatus,
    getPosts,
    getNodeInfo
  });
}

export async function consultaEstatNode0(opcions = {}) {
  return creaNode0Client(opcions).getStatus(opcions);
}

export async function consultaPublicacionsNode0(opcions = {}) {
  return creaNode0Client(opcions).getPosts(opcions);
}

export async function consultaNodeInfoNode0(opcions = {}) {
  return creaNode0Client(opcions).getNodeInfo(opcions);
}

export default creaNode0Client;
