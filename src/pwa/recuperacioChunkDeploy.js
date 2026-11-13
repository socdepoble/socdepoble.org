/* Recuperació de desplegament: una prova de build nou, mai qualsevol error.
 * El registre és de sessió i només conté empremtes de recursos públics.
 * Ni Notes, ni IndexedDB, ni subscripcions push es toquen.
 * Gauntlet R22 (pwa-01) · Recarregar buida també el que només viu en memòria
 * i no és al DOM: l'esborrany d'una conversa que ja no es veu
 * (src/sections/xat/esborranys.js), l'historial de la IAIA (política 2.5) o
 * una escriptura de Notes en cua. Des de la primera entrada de la persona
 * d'este document (ENTRADES_AMB_ESTAT_EN_MEMORIA: escriure, enganxar, triar en
 * un camp o deixar anar), la recuperació no recarrega sola, i la vista
 * diferida cau a la seua barrera honesta, que avisa i no esborra res.
 * Ronda 3 · Este veto NO cobrix l'estat que naix només d'un clic, sense cap
 * d'eixos esdeveniments ni cap camp amb valor al DOM: una pregunta suggerida de
 * la IAIA (Conversa.jsx → enviaPreguntaRapida → historial de
 * IAIALocalProvider), una emoticona del calaix (Compositor.jsx → inserix) en
 * un esborrany que després es deixa en una altra conversa, o l'informe
 * d'«Informa d'un error» (desaEsborrany). Eixe estat es pot perdre en la
 * recàrrega. Un clic no pot vetar: el clic d'una navegació és justament el
 * que troba el tros retirat. El veto d'eixe estat és `tePendents`, que
 * l'entrada (registre.js) encara no passa; /versions ho diu així. */
export const CLAU_RECUPERACIO_CHUNK = 'sdp:chunk-deploy:v1';
export const FINESTRA_ANTI_BUCLE_MS = 60000;
export const MAXIM_HTML_DEPLOY = 131072;
const MAXIM_EMPREMTES = 16;
const RECURS = /^\/assets\/[A-Za-z0-9_.-]+-[A-Za-z0-9_-]{8}\.(?:js|mjs|css)$/;
const JS_MIME = new Set(['application/javascript', 'text/javascript', 'application/ecmascript', 'text/ecmascript']);
const MIME = value => typeof value === 'string' ? value.split(';', 1)[0].trim().toLowerCase() : '';
const blanc = c => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';

function recursPropi(value, origin) {
  if (typeof value !== 'string' || value.length > 512 || /[\s\\\u0000-\u001f\u007f]/u.test(value)) return null;
  try {
    const url = new URL(value, origin + '/');
    return url.origin === origin && !url.username && !url.password && !url.search && !url.hash
      && RECURS.test(url.pathname) ? url.pathname : null;
  } catch { return null; }
}

/** Parser acotat i lineal de tags/atributs, sense DOM ni carregar recursos. */
export function entradesHtmlDeploy(html, origin) {
  if (typeof html !== 'string' || html.length > MAXIM_HTML_DEPLOY) return [];
  const lower = html.replace(/[A-Z]/g, c => c.toLowerCase()), result = [],
    raw = new Set(['script', 'style', 'textarea', 'title', 'noscript', 'xmp', 'iframe', 'noembed', 'noframes']);
  let i = 0, templates = 0;
  while (i < html.length) {
    const start = lower.indexOf('<', i);
    if (start < 0) break;
    if (lower.startsWith('<!--', start)) {
      const end = lower.indexOf('-->', start + 4);
      i = end < 0 ? html.length : end + 3;
      continue;
    }
    let p = start + 1, closing = false;
    if (html[p] === '/') { closing = true; p++; }
    const nameStart = p;
    while (p < html.length && /[a-z0-9]/.test(lower[p])) p++;
    const tag = lower.slice(nameStart, p), attrs = Object.create(null);
    let complete = false;
    while (p < html.length) {
      while (blanc(html[p]) || html[p] === '/') p++;
      if (html[p] === '>') { p++; complete = true; break; }
      const a = p;
      while (p < html.length && !blanc(html[p]) && html[p] !== '=' && html[p] !== '>') p++;
      const key = lower.slice(a, p);
      while (blanc(html[p])) p++;
      let value = '';
      if (html[p] === '=') {
        p++; while (blanc(html[p])) p++;
        const quote = html[p] === '"' || html[p] === "'" ? html[p++] : null;
        const v = p;
        while (p < html.length && (quote ? html[p] !== quote : !blanc(html[p]) && html[p] !== '>')) p++;
        value = html.slice(v, p);
        if (quote && html[p] === quote) p++;
      }
      if (key && !Object.hasOwn(attrs, key)) attrs[key] = value;
      if (p === a) p++;
    }
    i = p;
    if (!complete) break;
    // El parser no certifica arbres de namespaces aliens.
    if (!closing && (tag === 'svg' || tag === 'math')) return [];
    if (!closing && tag === 'plaintext') break;
    if (tag === 'template') { templates = Math.max(0, templates + (closing ? -1 : 1)); continue; }
    if (!closing && !templates && tag === 'script' && attrs.type?.toLowerCase() === 'module') {
      const path = recursPropi(attrs.src, origin);
      if (path && !path.endsWith('.css') && !result.includes(path)) result.push(path);
      if (result.length > 8) return [];
    }
    if (!closing && raw.has(tag)) {
      let end = lower.indexOf('</' + tag, i);
      while (end >= 0 && !(blanc(lower[end + tag.length + 2]) || ['>', '/'].includes(lower[end + tag.length + 2]))) {
        end = lower.indexOf('</' + tag, end + tag.length + 2);
      }
      i = end < 0 ? html.length : end;
    }
  }
  return result.sort();
}

export function classificaErrorChunkDeploy(error, origin) {
  try {
    const seen = new Set(), messages = [], urls = [];
    let e = error;
    for (let n = 0; e && n < 4 && !seen.has(e); n++, e = typeof e === 'object' ? e.cause : null) {
      seen.add(e);
      const message = typeof e === 'string' ? e : typeof e.message === 'string' ? e.message : '';
      if (message.length > 4096) return null;
      const text = message.toLowerCase();
      const mime = text.includes('mime') && (text.includes('module') || text.includes('script'));
      if (e.name === 'SyntaxError' && !mime) return null;
      messages.push(text);
      for (const key of ['request', 'url', 'filename']) if (typeof e[key] === 'string' && e[key]) urls.push(e[key]);
      let from = 0;
      while (from < message.length) {
        const h = message.indexOf('http', from), a = message.indexOf('/assets/', from);
        const start = h < 0 ? a : a < 0 ? h : Math.min(h, a);
        if (start < 0) break;
        let end = start;
        while (end < message.length && !blanc(message[end]) && !['"', "'", '<', '>', ')'].includes(message[end])) end++;
        urls.push(message.slice(start, end)); from = Math.max(end, start + 1);
      }
    }
    const text = messages.join(' ');
    // Chromium, Firefox (Gauntlet R22, pwa-04) i WebKit, per este ordre.
    if (!(text.includes('failed to fetch dynamically imported module') || text.includes('error loading dynamically imported module')
      || text.includes('importing a module script failed')
      || text.includes('loading chunk') && text.includes('failed') || text.includes('chunkloaderror')
      || text.includes('unable to preload css') || text.includes('mime') && (text.includes('module') || text.includes('script')))) return null;
    if (urls.length > 16) return null;
    const paths = urls.map(url => recursPropi(url, origin));
    if (paths.some(path => !path)) return null;
    return { recurs: paths[0] || null };
  } catch { return null; }
}

// Identificador de pressupost, no firma ni empremta de seguretat.
function empremta(paths) {
  let value = 2166136261;
  for (const c of paths.join('|')) value = Math.imul(value ^ c.charCodeAt(0), 16777619) >>> 0;
  return value.toString(16).padStart(8, '0');
}
function registre(storage) {
  const raw = storage.getItem(CLAU_RECUPERACIO_CHUNK);
  if (raw === null) return { v: 1, ultima: null, vistes: [] };
  if (typeof raw !== 'string' || raw.length > 2048) throw Error('registre-invalid');
  const row = JSON.parse(raw);
  if (row?.v !== 1 || !Array.isArray(row.vistes) || row.vistes.length > MAXIM_EMPREMTES
    || !row.vistes.every(x => typeof x === 'string' && /^[a-f0-9]{8}$/.test(x))
    || new Set(row.vistes).size !== row.vistes.length
    || row.ultima !== null && (!Number.isSafeInteger(row.ultima) || row.ultima < 0)) throw Error('registre-invalid');
  return row;
}
function potReservar(row, fingerprint, now) {
  return Number.isSafeInteger(now) && now >= 0 && !row.vistes.includes(fingerprint)
    && row.vistes.length < MAXIM_EMPREMTES
    && (row.ultima === null || now - row.ultima >= FINESTRA_ANTI_BUCLE_MS);
}
function entradesDocument(document, origin) {
  const nodes = document?.querySelectorAll?.('script[type="module"][src]');
  if (!nodes || nodes.length > 16) return [];
  return [...new Set(Array.from(nodes, n => recursPropi(n.getAttribute?.('src') || n.src, origin))
    .filter(path => path && !path.endsWith('.css')))].sort();
}
function hiHaEdicio(document) {
  // Un diàleg tancat també pot conservar una edició pendent. Veto conservador:
  // no depenem de visibilitat, tipus text o de contenteditable="true" literal.
  const fields = document?.querySelectorAll?.('textarea, input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]), [contenteditable]:not([contenteditable="false"])') || [];
  return Array.from(fields).some(field => !field.disabled && !field.readOnly
    && (typeof field.value === 'string' ? field.value.length > 0 : Boolean(field.textContent?.length)));
}
async function textAcotat(response) {
  const declared = response.headers?.get('content-length');
  if (declared && (!/^\d{1,9}$/.test(declared) || Number(declared) > MAXIM_HTML_DEPLOY)) throw Error('html-gran');
  const reader = response.body?.getReader?.();
  if (!reader) throw Error('sense-stream');
  const chunks = []; let bytes = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAXIM_HTML_DEPLOY) throw Error('html-gran');
      chunks.push(part.value);
    }
  } catch (error) { try { await reader.cancel(); } catch { /* sense dades noves */ } throw error; }
  const all = new Uint8Array(bytes); let at = 0;
  for (const chunk of chunks) { all.set(chunk, at); at += chunk.byteLength; }
  return new TextDecoder().decode(all);
}
async function ambTopall(task, ms, controller) {
  let timer;
  try {
    return await Promise.race([task, new Promise((_, reject) => {
      timer = setTimeout(() => { controller?.abort(); reject(Error('temps')); }, ms);
    })]);
  } finally { clearTimeout(timer); }
}

/** Les dependències s'injecten per provar la mateixa màquina que usa la web.
 * `tePendents()` és el veto de l'estat en memòria que el DOM no veu (pwa-01):
 * cert, una resposta que no és funció o una excepció impedixen recarregar. */
export function creaRecuperacioChunkDeploy({
  finestra = globalThis.window, navegador = globalThis.navigator, fetchFn = globalThis.fetch,
  magatzem, ara = Date.now, topallMs = 3000, preparaWorker = async () => {}, tePendents = () => false
} = {}) {
  let vigent = true, pendent = null, ultimaSonda = null, controlador = null;
  const origin = finestra?.location?.origin;
  const topall = Number.isFinite(topallMs) ? Math.max(1, Math.min(5000, topallMs)) : 3000;
  const enMemoria = () => { try { return typeof tePendents !== 'function' || Boolean(tePendents()); } catch { return true; } };
  const contextValid = href => vigent && navegador?.onLine !== false
    && finestra?.location?.origin === origin && finestra.location.href === href && !hiHaEdicio(finestra.document)
    && !enMemoria();
  async function prepara(href, recurs) {
    if (!contextValid(href)) return;
    const cache = finestra.caches;
    const purge = async () => {
      if (!cache?.keys) return;
      for (const name of (await cache.keys()).slice(0, 64)) {
        if (!contextValid(href)) return;
        if (/^sdp-pwa-closca-v[0-9]+$/.test(name)) await cache.delete(name);
        else if (recurs && /^sdp-pwa-recursos-v[0-9]+$/.test(name)) {
          const resources = await cache.open(name);
          if (!contextValid(href)) return;
          await resources.delete(new URL(recurs, origin).href);
        }
      }
    };

    await ambTopall(Promise.allSettled([purge(), preparaWorker({ vigent: () => contextValid(href) })]), Math.min(topall, 1500));
  }
  async function executa(error) {
    const href = finestra?.location?.href;
    if (!contextValid(href) || typeof fetchFn !== 'function') return false;
    const failure = classificaErrorChunkDeploy(error, origin);
    if (!failure) return false;
    const old = entradesDocument(finestra.document, origin);
    if (!old.length) return false;
    const fingerprint = empremta(old), storage = magatzem === undefined ? finestra.sessionStorage : magatzem;
    const now = ara();
    if (!storage || !potReservar(registre(storage), fingerprint, now)) return false;
    if (ultimaSonda !== null && now - ultimaSonda < 1000) return false;
    ultimaSonda = now;
    const controller = new AbortController();
    controlador = controller;
    try {
      const fresh = await ambTopall((async () => {
        const response = await fetchFn(origin + '/index.html', { cache: 'no-store', credentials: 'same-origin',
          redirect: 'error', headers: { Accept: 'text/html' }, signal: controller.signal });
        if (response.status !== 200 || response.redirected || MIME(response.headers?.get('content-type')) !== 'text/html') return [];
        if (response.url && new URL(response.url).origin !== origin) return [];
        return entradesHtmlDeploy(await textAcotat(response), origin);
      })(), topall, controller);
      if (!fresh.length || empremta(fresh) === fingerprint || !contextValid(href)) return false;
      if (failure.recurs) {
        const response = await ambTopall(fetchFn(origin + failure.recurs, { method: 'HEAD', cache: 'no-store',
          credentials: 'same-origin', redirect: 'error', signal: controller.signal }), topall, controller);
        if (response.redirected || response.url && new URL(response.url).origin !== origin) return false;
        const type = MIME(response.headers?.get('content-type'));
        const absent = response.status === 404 || response.status === 410;
        const html = response.status === 200 && type === 'text/html';
        if (!absent && !html) return false;
        // Un JS vàlid o un error HTTP transitori no prova un hash retirat.
        if (response.status === 200 && (JS_MIME.has(type) || type === 'text/css')) return false;
      }
      if (!contextValid(href)) return false;
      const row = registre(storage), instant = ara();
      if (!potReservar(row, fingerprint, instant)) return false;
      const serialized = JSON.stringify({ v: 1, ultima: instant, vistes: row.vistes.concat(fingerprint) });
      storage.setItem(CLAU_RECUPERACIO_CHUNK, serialized);
      if (storage.getItem(CLAU_RECUPERACIO_CHUNK) !== serialized) return false;
      try { await prepara(href, failure.recurs); } catch { /* ajuda acotada, no condició de privadesa */ }
      if (!contextValid(href)) return false;
      finestra.location.reload();
      return true;
    } finally { controller.abort(); if (controlador === controller) controlador = null; }
  }
  return Object.freeze({
    recupera(error) {
      if (pendent) return pendent;
      pendent = Promise.resolve().then(() => executa(error)).catch(() => false).finally(() => { pendent = null; });
      return pendent;
    },
    atura() { vigent = false; controlador?.abort(); }
  });
}

/* pwa-01 · Les entrades de la persona que poden deixar estat només en memòria:
 * escriure, triar (també un fitxer o un selector), enganxar i deixar anar.
 * En captura, a la finestra: cap component no les pot amagar. La marca dura
 * tot el document; no hi ha rellotge ni reinici, i per tant cap bucle.
 * Cap clic no hi és (vegeu la capçalera): el que naix només d'un toc no
 * queda protegit per esta llista. */
export const ENTRADES_AMB_ESTAT_EN_MEMORIA = Object.freeze(['input', 'change', 'paste', 'drop']);
const CAPTURA = Object.freeze({ capture: true, passive: true });

let activa = null;
export function recuperaErrorChunkDeploy(error) {
  return activa ? activa.motor.recupera(error) : false;
}
export function instalLaRecuperacioChunkDeploy(opcions = {}) {
  const finestra = opcions.finestra || globalThis.window;
  if (activa?.finestra === finestra) return activa.atura;
  activa?.atura();
  let entrada = false;
  const marca = () => { entrada = true; };
  const altres = opcions.tePendents === undefined ? () => false : opcions.tePendents;
  const motor = creaRecuperacioChunkDeploy({ ...opcions, finestra,
    tePendents: () => entrada || typeof altres !== 'function' || Boolean(altres()) });
  const rep = event => { void motor.recupera(event?.payload || event?.reason || event?.error); };
  for (const tipus of ENTRADES_AMB_ESTAT_EN_MEMORIA) finestra.addEventListener(tipus, marca, CAPTURA);
  finestra.addEventListener('vite:preloadError', rep);
  finestra.addEventListener('unhandledrejection', rep);
  const entry = { finestra, motor, atura() {
    motor.atura();
    for (const tipus of ENTRADES_AMB_ESTAT_EN_MEMORIA) finestra.removeEventListener?.(tipus, marca, CAPTURA);
    finestra.removeEventListener?.('vite:preloadError', rep);
    finestra.removeEventListener?.('unhandledrejection', rep);
    if (activa === entry) activa = null;
  } };
  activa = entry;
  return entry.atura;
}
export function aturaRecuperacioChunkDeploy() { activa?.atura(); }
