/** App Store Connect, Node only. No CLI, environment-file read or upload on import.
 * Official protocol:
 * https://developer.apple.com/documentation/appstoreconnectapi/generating-tokens-for-api-requests
 * https://developer.apple.com/documentation/appstoreconnectapi/review-submissions
 * https://developer.apple.com/documentation/appstoreconnectapi/uploading-assets-to-app-store-connect
 * appScreenshots is Apple's documented legacy compatibility API (now deprecated).
 * A successful preparation is not approval or public availability.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { rutaDe } from './entorn.mjs';

const API = 'https://api.appstoreconnect.apple.com';
const INSPECT = Symbol.for('nodejs.util.inspect.custom');
const MAX_JSON = 2 * 1024 * 1024;
const MAX_IMAGE = 30 * 1024 * 1024;
const MAX_PAGES = 10;
const MAX_ASSETS = 100;
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const ID = /^[A-Za-z0-9-]{1,128}$/;
const VERSION = /^\d{1,4}(?:\.\d{1,4}){1,3}$/;
const BUILD = /^[1-9]\d{0,9}$/;
const LOCALE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/;
const APP_STATES = new Set(['PREPARE_FOR_SUBMISSION', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'PENDING_DEVELOPER_RELEASE', 'PENDING_APPLE_RELEASE', 'PROCESSING_FOR_APP_STORE', 'READY_FOR_SALE', 'READY_FOR_DISTRIBUTION', 'REJECTED', 'METADATA_REJECTED', 'DEVELOPER_REJECTED', 'INVALID_BINARY', 'WAITING_FOR_EXPORT_COMPLIANCE', 'REPLACED_WITH_NEW_VERSION', 'REMOVED_FROM_SALE', 'DEVELOPER_REMOVED_FROM_SALE', 'NOT_APPLICABLE', 'READY_FOR_REVIEW', 'ACCEPTED', 'PENDING_CONTRACT', 'PREORDER_READY_FOR_SALE']);
const own = (o, k) => Object.getOwnPropertyDescriptor(o ?? {}, k)?.value;
const plain = (o) => o !== null && typeof o === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(o));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class ErrorAsc extends Error {
  constructor(tipus, status = null) {
    const text = {
      clau: 'ASC: falta una clau ES256 vàlida i privada (no es mostra cap valor).',
      endpoint: 'ASC: adreça o paginació refusada; només l’origen autoritzat.',
      resposta: 'ASC: resposta incompleta, inesperada o massa gran.',
      transport: 'ASC: no s’ha pogut completar la petició; no s’ha repetit cap escriptura.',
      termini: 'ASC: termini esgotat; comprova l’estat abans de repetir una escriptura.',
      confirma: 'ASC: cal la confirmació exacta produccio:VERSIO+BUILD@sha12 abans de modificar res.',
      arguments: 'ASC: versió, build, aplicació o opcions no vàlides.',
      app: 'ASC: no hi ha una única aplicació que case exactament amb el bundle.',
      build: 'ASC: no hi ha un únic build iOS de la versió demanada.',
      valid: 'ASC: el build encara no és VALID; no s’ha preparat la versió.',
      estat: 'ASC: la versió no admet preparació en el seu estat actual.',
      notes: 'ASC: cada localització necessita notes no buides de fins a 4000 caràcters.',
      captures: 'ASC: falten captures processades d’iPhone o d’iPad; revisa les captures al portal.',
      review: 'ASC: falta informació completa per a App Review; revisa-la al portal.',
      herencia: 'ASC: no hi ha una versió aprovada de la qual heretar les metadades.',
      upload: 'ASC: operacions de pujada, integritat o processament de captures no vàlids.',
      submission: 'ASC: enviament ambigu o amb altres elements; revisa App Review al portal.'
    };
    const message = tipus === 'http'
      ? `ASC HTTP ${status}: ${status === 403 ? 'permisos o acord del compte pendents; revisa App Store Connect.' : status === 409 ? 'conflicte d’estat o metadades; revisa App Store Connect abans de repetir.' : 'petició refusada; revisa l’estat al portal.'}`
      : text[tipus] ?? text.resposta;
    super(message);
    this.name = 'ErrorAsc'; this.tipus = tipus; this.status = status;
  }
}
const fail = (kind) => { throw new ErrorAsc(kind); };
const id = (value) => typeof value === 'string' && ID.test(value) ? value : fail('resposta');
const data = (r, type) => {
  const d = r?.data;
  if (!d || Array.isArray(d) || d.type !== type) fail('resposta');
  id(d.id); return d;
};
const attr = (r) => plain(r?.attributes) ? r.attributes : {};
const rel = (r, name) => r?.relationships?.[name]?.data ?? null;

/** Key material is never an enumerable property, error cause or inspect result. */
export class ClauAsc {
  #clau; #kid; #issuer;
  constructor({ clau, kid, issuer } = {}) {
    try {
      if (typeof kid !== 'string' || !/^[A-Z0-9]{10}$/.test(kid) || typeof issuer !== 'string' || !UUID.test(issuer)) fail('clau');
      if (typeof clau !== 'string' || Buffer.byteLength(clau) > 64 * 1024 || !clau.startsWith('-----BEGIN PRIVATE KEY-----')) fail('clau');
      const key = crypto.createPrivateKey(clau);
      if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') fail('clau');
      this.#clau = key; this.#kid = kid; this.#issuer = issuer;
    } catch { throw new ErrorAsc('clau'); }
  }
  jwt({ ara = Date.now(), durada = 300 } = {}) {
    if (!Number.isFinite(ara) || ara < 0 || !Number.isInteger(durada) || durada < 1 || durada > 600) fail('clau');
    const iat = Math.floor(ara / 1000);
    const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const text = `${b64({ alg: 'ES256', kid: this.#kid, typ: 'JWT' })}.${b64({ iss: this.#issuer, iat, exp: iat + durada, aud: 'appstoreconnect-v1' })}`;
    try { return `${text}.${crypto.sign('sha256', Buffer.from(text), { key: this.#clau, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`; }
    catch { throw new ErrorAsc('clau'); }
  }
  toJSON() { return '[ClauAsc]'; }
  [INSPECT]() { return '[ClauAsc]'; }
}

export function ascDisponible(valors = {}) {
  try { return ['SDP_ASC_KEY_ID', 'SDP_ASC_ISSUER_ID', 'SDP_ASC_KEY_PATH'].every((k) => typeof own(valors, k) === 'string' && own(valors, k).trim() !== ''); }
  catch { return false; }
}
function lligClau(valors, arrel) {
  let fd;
  try {
    if (!ascDisponible(valors) || typeof arrel !== 'string') fail('clau');
    const file = rutaDe(arrel, valors, 'SDP_ASC_KEY_PATH');
    const base = fs.realpathSync(arrel), real = fs.realpathSync(file), before = fs.lstatSync(file);
    if (!before.isFile() || !file.endsWith('.p8') || real === base || real.startsWith(base + path.sep)) fail('clau');
    fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    const st = fs.fstatSync(fd);
    if (!st.isFile() || st.dev !== before.dev || st.ino !== before.ino || (st.mode & 0o077) !== 0 || st.size > 64 * 1024) fail('clau');
    const bytes = Buffer.alloc(64 * 1024 + 1); let size = 0;
    while (size < bytes.length) { const n = fs.readSync(fd, bytes, size, bytes.length - size, null); if (!n) break; size += n; }
    if (size > 64 * 1024) fail('clau');
    return new ClauAsc({ clau: bytes.subarray(0, size).toString('utf8'), kid: own(valors, 'SDP_ASC_KEY_ID').trim(), issuer: own(valors, 'SDP_ASC_ISSUER_ID').trim() });
  } catch { throw new ErrorAsc('clau'); }
  finally { if (fd !== undefined) fs.closeSync(fd); }
}
function endpoint(baseUrl) {
  let u; try { u = new URL(baseUrl); } catch { fail('endpoint'); }
  const local = u.protocol === 'http:' && u.hostname === '127.0.0.1' && u.port !== '';
  if ((!local && u.origin !== API) || u.pathname !== '/' || u.search || u.hash || u.username || u.password) fail('endpoint');
  return { origin: u.origin, local };
}
async function bytesOf(response, max) {
  if (!response?.body?.getReader) fail('resposta');
  const reader = response.body.getReader(); const parts = []; let length = 0;
  try {
    for (;;) {
      const r = await reader.read(); if (r.done) break;
      length += r.value.byteLength;
      if (length > max) fail('resposta');
      parts.push(Buffer.from(r.value));
    }
    return Buffer.concat(parts, length);
  } finally { try { await reader.cancel(); } catch { /* transport owns its failure */ } }
}

/** Injection accepts only the exact Apple origin or explicit ephemeral127.0.0.1.
 * No redirect, retry, arbitrary base path or Authorization on asset requests.
 */
export function clientAsc({ valors = {}, arrel, clau, fetchImpl = globalThis.fetch, baseUrl = API, ara = Date.now, timeoutMs = 30000, espera = sleep, maxRequests = 1000 } = {}) {
  const ep = endpoint(baseUrl);
  if (typeof fetchImpl !== 'function' || typeof ara !== 'function' || typeof espera !== 'function' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000 || !Number.isInteger(maxRequests) || maxRequests < 1 || maxRequests > 2000) fail('arguments');
  let key = clau, requests = 0;
  const bundleId = typeof own(valors, 'SDP_APP_ID') === 'string' ? own(valors, 'SDP_APP_ID') : null;
  const apiUrl = (value) => {
    if (typeof value !== 'string' || value.length > 16384) fail('endpoint');
    let u; try { u = new URL(value, ep.origin); } catch { fail('endpoint'); }
    if (u.origin !== ep.origin || u.username || u.password || u.hash || !u.pathname.startsWith('/v1/') || /%2f|%5c|\\/i.test(u.pathname)) fail('endpoint');
    return u.href;
  };
  async function transport(url, { method = 'GET', body, headers = {}, json = true, max = MAX_JSON, allow404 = false, auth = false } = {}) {
    if (++requests > maxRequests) fail('resposta');
    const controller = new AbortController(); let timer;
    try {
      const operation = (async () => {
        const h = { ...headers };
        if (auth) {
          key ??= lligClau(valors, arrel);
          if (!(key instanceof ClauAsc)) fail('clau');
          h.Authorization = `Bearer ${key.jwt({ ara: ara() })}`;
        }
        const response = await fetchImpl(url, { method, headers: h, ...(body === undefined ? {} : { body }), redirect: 'manual', signal: controller.signal });
        if (allow404 && response.status === 404) { try { await response.body?.cancel(); } catch { /* no echo */ } return null; }
        if (!response.ok) { try { await response.body?.cancel(); } catch { /* no echo */ } throw new ErrorAsc('http', Number.isInteger(response.status) && response.status >= 100 && response.status <= 599 ? response.status : 0); }
        if (response.status === 204) return null;
        const bytes = await bytesOf(response, max);
        if (!json) return bytes;
        try { return JSON.parse(bytes.toString('utf8')); } catch { fail('resposta'); }
      })();
      const expires = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new ErrorAsc('termini')); }, timeoutMs); });
      return await Promise.race([operation, expires]);
    } catch (error) { throw error instanceof ErrorAsc ? error : new ErrorAsc('transport'); }
    finally { clearTimeout(timer); controller.abort(); }
  }
  const request = (method, value, body, options = {}) => {
    if (!['GET', 'POST', 'PATCH'].includes(method)) fail('arguments');
    return transport(apiUrl(value), { method, auth: true, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }), allow404: options.allow404 === true });
  };
  async function list(value) {
    let next = apiUrl(value); const seen = new Set(), seenRows = new Set(), rows = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      if (seen.has(next)) fail('resposta'); seen.add(next);
      const r = await request('GET', next);
      if (!Array.isArray(r?.data) || r.data.length > 200) fail('resposta');
      for (const item of r.data) { if (!plain(item)) fail('resposta'); id(item.id); if (seenRows.has(item.id)) fail('resposta'); seenRows.add(item.id); rows.push(item); }
      const link = r.links?.next;
      if (link === undefined || link === null) return rows;
      next = apiUrl(link);
    }
    fail('resposta');
  }
  function assetUrl(value, upload = false) {
    let u; try { u = new URL(value); } catch { fail('upload'); }
    const sameLocal = ep.local && u.origin === ep.origin;
    const host = upload ? /^store-\d+\.blobstore\.apple\.com$/ : /^is\d+(?:-ssl)?\.mzstatic\.com$/;
    if ((!sameLocal && (u.protocol !== 'https:' || u.port || !host.test(u.hostname))) || u.username || u.password || u.hash || u.href.length > 16384) fail('upload');
    return u.href;
  }
  return Object.freeze({ request, list, bundleId, espera,
    download: (url) => transport(assetUrl(url), { json: false, max: MAX_IMAGE }),
    upload: (url, bytes, headers) => transport(assetUrl(url, true), { method: 'PUT', body: bytes, headers, json: false, max: MAX_JSON }),
    toJSON: () => '[ClientAsc]', [INSPECT]: () => '[ClientAsc]' });
}

export async function resolAppId({ client, appId, bundleId = client?.bundleId } = {}) {
  if (!client?.list || typeof bundleId !== 'string' || !/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(bundleId) || bundleId.length > 255) fail('app');
  const apps = await client.list(`/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&limit=200`);
  const matched = apps.filter((a) => a.type === 'apps' && attr(a).bundleId === bundleId);
  if (matched.length !== 1 || (appId !== undefined && id(String(appId)) !== matched[0].id)) fail('app');
  return id(matched[0].id);
}
const argumentsOf = (versio, build) => {
  if (typeof versio !== 'string' || !VERSION.test(versio) || typeof build !== 'string' || !BUILD.test(build)) fail('arguments');
};
const apiId = async (client, appId) => appId === undefined || client?.bundleId ? resolAppId({ client, appId }) : id(String(appId));
async function localizations(client, versionId) {
  const locs = await client.list(`/v1/appStoreVersions/${id(versionId)}/appStoreVersionLocalizations?limit=200`);
  if (locs.some((l) => l.type !== 'appStoreVersionLocalizations' || typeof attr(l).locale !== 'string' || !LOCALE.test(attr(l).locale))) fail('resposta');
  if (new Set(locs.map((l) => attr(l).locale)).size !== locs.length) fail('resposta');
  return locs;
}
async function screenshots(client, locs) {
  const all = []; let iphone = 0, ipad = 0;
  for (const loc of locs) {
    const sets = await client.list(`/v1/appStoreVersionLocalizations/${id(loc.id)}/appScreenshotSets?limit=200`);
    for (const set of sets) {
      if (set.type !== 'appScreenshotSets' || typeof attr(set).screenshotDisplayType !== 'string') fail('resposta');
      const images = await client.list(`/v1/appScreenshotSets/${id(set.id)}/appScreenshots?limit=200`);
      const complete = images.filter((s) => s.type === 'appScreenshots' && attr(s).assetDeliveryState?.state === 'COMPLETE');
      if (all.reduce((n, s) => n + s.images.length, 0) + complete.length > MAX_ASSETS) fail('resposta');
      const display = attr(set).screenshotDisplayType;
      if (display.startsWith('APP_IPHONE_')) iphone += complete.length;
      if (display.startsWith('APP_IPAD_')) ipad += complete.length;
      all.push({ locale: attr(loc).locale, display, images: complete, id: set.id });
    }
  }
  return { all, iphone, ipad };
}
const reviewValid = (detail) => {
  const a = attr(detail);
  return ['contactFirstName', 'contactLastName', 'contactPhone', 'contactEmail'].every((k) => typeof a[k] === 'string' && a[k].trim() !== '')
    && typeof a.demoAccountRequired === 'boolean' && (!a.demoAccountRequired || ['demoAccountName', 'demoAccountPassword'].every((k) => typeof a[k] === 'string' && a[k] !== ''));
};
async function reviewDetail(client, versionId) {
  const r = await client.request('GET', `/v1/appStoreVersions/${id(versionId)}/appStoreReviewDetail`, undefined, { allow404: true });
  return r?.data === null || r === null ? null : data(r, 'appStoreReviewDetails');
}
async function buildInfo(client, b, versio) {
  if (!b) return null;
  const p = data(await client.request('GET', `/v1/builds/${id(b.id)}/preReleaseVersion`), 'preReleaseVersions');
  if (typeof attr(b).version !== 'string' || !BUILD.test(attr(b).version) || !['PROCESSING', 'FAILED', 'INVALID', 'VALID'].includes(attr(b).processingState)
    || typeof attr(p).version !== 'string' || !VERSION.test(attr(p).version) || !['IOS', 'MAC_OS', 'TV_OS', 'VISION_OS'].includes(attr(p).platform)) fail('resposta');
  return { id: b.id, build: attr(b).version, processingState: attr(b).processingState,
    usesNonExemptEncryption: typeof attr(b).usesNonExemptEncryption === 'boolean' ? attr(b).usesNonExemptEncryption : null,
    versionString: attr(p).version, platform: attr(p).platform, matches: (versio === undefined || attr(p).version === versio) && attr(p).platform === 'IOS' };
}
async function inspect(client, appId, versio, build) {
  const versions = await client.list(`/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=200`);
  if (versions.some((v) => v.type !== 'appStoreVersions' || attr(v).platform !== 'IOS' || typeof attr(v).versionString !== 'string' || !VERSION.test(attr(v).versionString)
    || !APP_STATES.has(attr(v).appStoreState) || !['MANUAL', 'AFTER_APPROVAL', 'SCHEDULED'].includes(attr(v).releaseType))) fail('resposta');
  const exact = versions.filter((v) => attr(v).versionString === versio && attr(v).platform === 'IOS');
  if (exact.length > 1) fail('resposta');
  const builds = await client.list(`/v1/builds?filter[app]=${appId}${build === undefined ? '&sort=-uploadedDate&limit=20' : `&filter[version]=${encodeURIComponent(build)}&limit=200`}`);
  const candidates = [];
  for (const b of builds) {
    if (b.type !== 'builds' || typeof attr(b).version !== 'string' || !BUILD.test(attr(b).version) || (build !== undefined && attr(b).version !== build)) fail('resposta');
    const info = await buildInfo(client, b, versio); if (info.matches) candidates.push(info);
  }
  if (build !== undefined && candidates.length > 1) fail('build');
  const version = exact[0] ?? (versio === undefined ? versions.slice().sort((a, b) => String(attr(b).createdDate ?? '').localeCompare(String(attr(a).createdDate ?? '')))[0] : null) ?? null;
  let linked = null, locs = [], shots = { all: [], iphone: 0, ipad: 0 }, review = null;
  if (version) {
    const r = await client.request('GET', `/v1/appStoreVersions/${id(version.id)}/build`);
    if (r?.data) linked = await buildInfo(client, data(r, 'builds'), versio);
    locs = await localizations(client, version.id); shots = await screenshots(client, locs); review = await reviewDetail(client, version.id);
  }
  return { appId, versions, builds: candidates, version, linked, locs, shots, review };
}
const summary = (s, versio, build) => ({
  appId: s.appId, versio, build,
  versions: s.versions.map((v) => ({ id: v.id, versionString: attr(v).versionString, platform: attr(v).platform, appStoreState: attr(v).appStoreState, releaseType: attr(v).releaseType })),
  builds: s.builds.map((b) => ({ id: b.id, build: b.build, processingState: b.processingState, usesNonExemptEncryption: b.usesNonExemptEncryption, versionString: b.versionString, platform: b.platform })),
  versionId: s.version?.id ?? null, appStoreState: attr(s.version).appStoreState ?? null, releaseType: attr(s.version).releaseType ?? null,
  linkedBuild: s.linked ? { ...s.linked, matches: undefined } : null,
  readyForSale: !!(versio && build && s.version && attr(s.version).platform === 'IOS' && attr(s.version).versionString === versio && attr(s.version).appStoreState === 'READY_FOR_SALE'
    && s.linked?.matches && s.linked.build === build && s.linked.processingState === 'VALID'),
  localizations: s.locs.map((l) => ({ locale: attr(l).locale, whatsNewLength: typeof attr(l).whatsNew === 'string' ? attr(l).whatsNew.length : 0 })),
  captures: { iphone: s.shots.iphone, ipad: s.shots.ipad }, reviewDetail: reviewValid(s.review)
});

export async function consultaAppStore({ client, appId, versio, build } = {}) {
  if (versio !== undefined && (typeof versio !== 'string' || !VERSION.test(versio))) fail('arguments');
  if (build !== undefined && (typeof build !== 'string' || !BUILD.test(build))) fail('arguments');
  const app = await apiId(client, appId);
  return summary(await inspect(client, app, versio, build), versio, build);
}
function notesFor(notes, locs) {
  if (typeof notes !== 'string' && !plain(notes)) fail('notes');
  const result = new Map();
  for (const l of locs) {
    const locale = attr(l).locale;
    if (typeof locale !== 'string' || !LOCALE.test(locale)) fail('notes');
    const value = typeof notes === 'string' ? notes : own(notes, locale);
    if (typeof value !== 'string' || value.trim() === '' || value.length > 4000 || value.includes('\0') || value.includes('PRIVATE KEY-----') || !value.isWellFormed()) fail('notes');
    result.set(locale, value);
  }
  if (result.size === 0) fail('notes'); return result;
}
const resource = (type, attributes, relationships, ident) => ({ data: { type, ...(ident ? { id: ident } : {}), ...(attributes ? { attributes } : {}), ...(relationships ? { relationships } : {}) } });
const linkage = (type, ident) => ({ data: { type, id: id(ident) } });
const copyAttrs = (from, names) => Object.fromEntries(names.filter((k) => typeof attr(from)[k] === 'string' || typeof attr(from)[k] === 'boolean').map((k) => [k, attr(from)[k]]));
async function cloneScreenshots(client, from, toLocs) {
  let bytesTotal = 0;
  for (const source of from.all) {
    if (!source.images.length) continue;
    const targetLoc = toLocs.find((l) => attr(l).locale === source.locale); if (!targetLoc) fail('captures');
    const sets = await client.list(`/v1/appStoreVersionLocalizations/${id(targetLoc.id)}/appScreenshotSets?limit=200`);
    let set = sets.find((s) => attr(s).screenshotDisplayType === source.display);
    if (!set) set = data(await client.request('POST', '/v1/appScreenshotSets', resource('appScreenshotSets', { screenshotDisplayType: source.display }, { appStoreVersionLocalization: linkage('appStoreVersionLocalizations', targetLoc.id) })), 'appScreenshotSets');
    const existing = await client.list(`/v1/appScreenshotSets/${id(set.id)}/appScreenshots?limit=200`);
    // Existing processed screenshots are never removed, reordered or overwritten.
    if (existing.some((s) => attr(s).assetDeliveryState?.state === 'COMPLETE')) continue;
    if (existing.length) fail('upload');
    for (const original of source.images) {
      const image = attr(original).imageAsset;
      if (typeof image?.templateUrl !== 'string' || !Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1 || image.width > 10000 || image.height > 10000) fail('upload');
      const url = image.templateUrl.replaceAll('{w}', String(image.width)).replaceAll('{h}', String(image.height)).replaceAll('{f}', 'png');
      const bytes = await client.download(url); bytesTotal += bytes.length;
      if (!bytes.length || bytesTotal > 100 * 1024 * 1024) fail('upload');
      const reserved = data(await client.request('POST', '/v1/appScreenshots', resource('appScreenshots', { fileName: 'screenshot.png', fileSize: bytes.length }, { appScreenshotSet: linkage('appScreenshotSets', set.id) })), 'appScreenshots');
      const ops = attr(reserved).uploadOperations;
      if (!Array.isArray(ops) || ops.length < 1 || ops.length > 100) fail('upload');
      let offset = 0; const uploads = [];
      for (const op of ops) {
        if (op.method !== 'PUT' || !Number.isSafeInteger(op.offset) || !Number.isSafeInteger(op.length) || op.offset !== offset || op.length < 1 || op.offset + op.length > bytes.length || !Array.isArray(op.requestHeaders)) fail('upload');
        const headers = {};
        for (const h of op.requestHeaders) {
          if (typeof h?.name !== 'string' || !/^(?:content-type|x-amz-[a-z0-9-]+)$/i.test(h.name) || typeof h.value !== 'string' || h.value.length > 4096 || /[\r\n]/.test(h.value) || Object.hasOwn(headers, h.name.toLowerCase())) fail('upload');
          headers[h.name.toLowerCase()] = h.value;
        }
        uploads.push({ url: op.url, bytes: bytes.subarray(offset, offset + op.length), headers }); offset += op.length;
      }
      if (offset !== bytes.length) fail('upload');
      for (const u of uploads) await client.upload(u.url, u.bytes, u.headers);
      let shot = data(await client.request('PATCH', `/v1/appScreenshots/${id(reserved.id)}`, resource('appScreenshots', { uploaded: true, sourceFileChecksum: crypto.createHash('md5').update(bytes).digest('hex') }, null, reserved.id)), 'appScreenshots');
      for (let n = 0; n < 10 && attr(shot).assetDeliveryState?.state !== 'COMPLETE'; n++) {
        if (attr(shot).assetDeliveryState?.state === 'FAILED') fail('upload');
        await client.espera(1000); shot = data(await client.request('GET', `/v1/appScreenshots/${id(reserved.id)}`), 'appScreenshots');
      }
      if (attr(shot).assetDeliveryState?.state !== 'COMPLETE') fail('upload');
    }
  }
}

async function submitReview(client, appId, versionId, onlyExisting = false) {
  const submissions = await client.list(`/v1/apps/${appId}/reviewSubmissions?limit=200`);
  let empty = null, selected = null;
  for (const s of submissions) {
    if (s.type !== 'reviewSubmissions') fail('resposta');
    const state = attr(s).state;
    if (!['READY_FOR_REVIEW', 'WAITING_FOR_REVIEW', 'IN_REVIEW'].includes(state)) continue;
    const items = await client.list(`/v1/reviewSubmissions/${id(s.id)}/items?include=appStoreVersion&limit=200`);
    if (items.length === 1 && items[0].type === 'reviewSubmissionItems' && rel(items[0], 'appStoreVersion')?.type === 'appStoreVersions' && rel(items[0], 'appStoreVersion')?.id === versionId) {
      if (selected) fail('submission'); selected = s;
    } else if (!items.length && state === 'READY_FOR_REVIEW') { if (empty) fail('submission'); empty = s; }
    else if (items.length) fail('submission');
  }
  if (selected && ['WAITING_FOR_REVIEW', 'IN_REVIEW'].includes(attr(selected).state)) return { id: selected.id, submitted: true, state: attr(selected).state, reused: true };
  if (onlyExisting) fail('submission');
  let submission = selected ?? empty;
  if (!submission) submission = data(await client.request('POST', '/v1/reviewSubmissions', resource('reviewSubmissions', { platform: 'IOS' }, { app: linkage('apps', appId) })), 'reviewSubmissions');
  if (!selected) await client.request('POST', '/v1/reviewSubmissionItems', resource('reviewSubmissionItems', null, { reviewSubmission: linkage('reviewSubmissions', submission.id), appStoreVersion: linkage('appStoreVersions', versionId) }));
  const checked = await client.list(`/v1/reviewSubmissions/${id(submission.id)}/items?include=appStoreVersion&limit=200`);
  if (checked.length !== 1 || checked[0].type !== 'reviewSubmissionItems' || rel(checked[0], 'appStoreVersion')?.type !== 'appStoreVersions' || rel(checked[0], 'appStoreVersion')?.id !== versionId) fail('submission');
  const sent = data(await client.request('PATCH', `/v1/reviewSubmissions/${id(submission.id)}`, resource('reviewSubmissions', { submitted: true }, null, submission.id)), 'reviewSubmissions');
  if (sent.id !== submission.id || !['WAITING_FOR_REVIEW', 'IN_REVIEW'].includes(attr(sent).state)) fail('submission');
  return { id: sent.id, submitted: true, state: attr(sent).state, reused: !!(selected ?? empty) };
}

/** Exact localIPA digest confirmation gates EVERY possible mutation, including
 * version metadata, inheritance and submission. No mutation retry or TestFlight.
 */
export async function preparaProduccio({ client, appId, versio, build, sha256, confirma, notes, esperaValid = false, enviaRevisio = false } = {}) {
  argumentsOf(versio, build);
  if (typeof sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(sha256) || confirma !== `produccio:${versio}+${build}@${sha256.slice(0, 12)}`) fail('confirma');
  if (typeof enviaRevisio !== 'boolean') fail('arguments');
  const wait = esperaValid === true ? { intents: 30, intervalMs: 10000 } : esperaValid === false ? { intents: 1, intervalMs: 0 } : esperaValid;
  if (!plain(wait) || !Number.isInteger(wait.intents) || wait.intents < 1 || wait.intents > 120 || !Number.isInteger(wait.intervalMs) || wait.intervalMs < 0 || wait.intervalMs > 30000) fail('arguments');
  const app = await apiId(client, appId); let current;
  for (let n = 0; n < wait.intents; n++) {
    current = await inspect(client, app, versio, build);
    if (current.builds.length > 1) fail('build');
    if (current.builds[0]?.processingState === 'VALID') break;
    if (['FAILED', 'INVALID'].includes(current.builds[0]?.processingState)) fail('valid');
    if (n + 1 < wait.intents) await client.espera(wait.intervalMs);
  }
  if (current.builds.length !== 1 || current.builds[0].processingState !== 'VALID') fail('valid');
  const before = summary(current, versio, build);
  if (before.readyForSale) return { ...before, prepared: true, submitted: false, alreadyPublic: true };
  if (current.version && ['WAITING_FOR_REVIEW', 'IN_REVIEW'].includes(attr(current.version).appStoreState)) {
    if (current.linked?.id !== current.builds[0].id || !current.linked.matches || attr(current.version).releaseType !== 'AFTER_APPROVAL' || !current.shots.iphone || !current.shots.ipad || !reviewValid(current.review)) fail('estat');
    const reviewSubmission = await submitReview(client, app, current.version.id, true);
    return { ...before, prepared: true, submitted: true, reviewSubmission };
  }
  if (current.version && !['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY', 'READY_FOR_REVIEW'].includes(attr(current.version).appStoreState)) fail('estat');
  const approved = current.versions.filter((v) => attr(v).platform === 'IOS' && attr(v).appStoreState === 'READY_FOR_SALE').sort((a, b) => String(attr(b).createdDate ?? '').localeCompare(String(attr(a).createdDate ?? '')))[0];
  let sourceLocs = current.locs;
  if (!sourceLocs.length) { if (!approved) fail('herencia'); sourceLocs = await localizations(client, approved.id); }
  let inheritedShots, inheritedReview;
  if (!current.shots.iphone || !current.shots.ipad) {
    if (!approved) fail('captures');
    const approvedLocs = await localizations(client, approved.id);
    inheritedShots = await screenshots(client, approvedLocs);
    sourceLocs = [...sourceLocs, ...approvedLocs.filter((l) => !sourceLocs.some((x) => attr(x).locale === attr(l).locale))];
    if (!inheritedShots.iphone || !inheritedShots.ipad) fail('captures');
  }
  if (!reviewValid(current.review)) {
    if (!approved) fail('review'); inheritedReview = await reviewDetail(client, approved.id);
    if (!reviewValid(inheritedReview)) fail('review');
  }
  const notesMap = notesFor(notes, sourceLocs);
  // All input notes and inherited resource presence are checked before create/PATCH.
  let version = current.version;
  if (!version) version = data(await client.request('POST', '/v1/appStoreVersions', resource('appStoreVersions', { platform: 'IOS', versionString: versio, releaseType: 'AFTER_APPROVAL' }, { app: linkage('apps', app) })), 'appStoreVersions');
  else if (attr(version).releaseType !== 'AFTER_APPROVAL') await client.request('PATCH', `/v1/appStoreVersions/${id(version.id)}`, resource('appStoreVersions', { releaseType: 'AFTER_APPROVAL' }, null, version.id));
  let locs = await localizations(client, version.id);
  for (const l of sourceLocs) {
    const locale = attr(l).locale;
    if (!locs.some((x) => attr(x).locale === locale)) {
      const created = data(await client.request('POST', '/v1/appStoreVersionLocalizations', resource('appStoreVersionLocalizations', { ...copyAttrs(l, ['description', 'keywords', 'marketingUrl', 'promotionalText', 'supportUrl']), locale, whatsNew: notesMap.get(locale) }, { appStoreVersion: linkage('appStoreVersions', version.id) })), 'appStoreVersionLocalizations');
      locs.push(created);
    }
  }
  for (const l of locs) {
    const text = notesMap.get(attr(l).locale); if (text === undefined) fail('notes');
    await client.request('PATCH', `/v1/appStoreVersionLocalizations/${id(l.id)}`, resource('appStoreVersionLocalizations', { whatsNew: text }, null, l.id));
  }
  if (inheritedShots) await cloneScreenshots(client, inheritedShots, locs);
  if (inheritedReview) {
    const attributes = copyAttrs(inheritedReview, ['contactFirstName', 'contactLastName', 'contactPhone', 'contactEmail', 'demoAccountRequired', 'demoAccountName', 'demoAccountPassword', 'notes']);
    if (current.review) await client.request('PATCH', `/v1/appStoreReviewDetails/${id(current.review.id)}`, resource('appStoreReviewDetails', attributes, null, current.review.id));
    else await client.request('POST', '/v1/appStoreReviewDetails', resource('appStoreReviewDetails', attributes, { appStoreVersion: linkage('appStoreVersions', version.id) }));
  }
  await client.request('PATCH', `/v1/appStoreVersions/${id(version.id)}/relationships/build`, { data: { type: 'builds', id: current.builds[0].id } });
  const after = await inspect(client, app, versio, build);
  if (after.linked?.id !== current.builds[0].id || !after.linked.matches || after.linked.processingState !== 'VALID' || attr(after.version).releaseType !== 'AFTER_APPROVAL') fail('resposta');
  if (!after.shots.iphone || !after.shots.ipad) fail('captures');
  if (!reviewValid(after.review)) fail('review');
  for (const l of after.locs) if (attr(l).whatsNew !== notesMap.get(attr(l).locale)) fail('notes');
  const reviewSubmission = enviaRevisio ? await submitReview(client, app, version.id) : null;
  return { ...summary(after, versio, build), prepared: true, submitted: reviewSubmission?.submitted === true, reviewSubmission };
}
