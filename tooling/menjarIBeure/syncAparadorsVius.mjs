/** Motor pur de plans d'aparadors consentits. Cap xarxa, IO, LLM o rellotge.
 * El consumidor aplica `plan` amb CAS i consentiment al servidor; `next_state`
 * només permet reproduir el reductor. No modifica publicacions ni mitjans.
 */
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { llevaEtiquetes, llevaScriptsIEstils } from '../../src/config/contentHelpers.js';

export const SCHEMA_PLA_APARADORS = 'sdp.aparadors-sync.plan.v1';
export const LIMITS_APARADORS = Object.freeze({ products: 2000, events: 4000, bytes: 4 * 1024 * 1024 });
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const HASH = /^[a-f0-9]{64}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const STATUS = new Set(['active', 'pending_review', 'seasonal_hidden']);
const BAD_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MAX_CENTS = BigInt(Number.MAX_SAFE_INTEGER);
const ORDER = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const SOURCE_KEYS = ['source_id', 'canonical_origin', 'sync_consent', 'consented_at', 'enabled', 'price_locale'];
const STATE_KEYS = ['state_version', 'last_complete_scan_date', 'last_complete_scan_digest', 'products'];
const PRODUCT_KEYS = ['external_product_id', 'external_source_url', 'title', 'price_cents', 'currency', 'in_stock', 'status',
  'missing_streak', 'last_seen_date', 'last_missing_scan_date', 'proposed_label', 'approved_at'];

export class ErrorSyncAparador extends TypeError {
  constructor(code) { super(`El pla de sincronització no és vàlid (${code}).`); this.name = 'ErrorSyncAparador'; this.code = code; }
}
const fail = code => { throw new ErrorSyncAparador(code); };
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const keys = (value, allowed) => { if (!plain(value) || Object.keys(value).some(key => !allowed.includes(key))) fail('unknown_fields'); };
const integer = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= min && value <= max;
const date = value => typeof value === 'string' && DAY.test(value) && Number.isFinite(Date.parse(value))
  && new Date(value).toISOString().slice(0, 10) === value;
const instant = value => typeof value === 'string' && value.length <= 64 && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const hash = value => createHash('sha256').update(value).digest('hex');
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (plain(value)) return `{${Object.keys(value).sort(ORDER).map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

/** Captura sense invocar getters/toJSON; cicles, prototips i símbols es refusen. */
function copyJson(input) {
  const seen = new Set(); let nodes = 0, chars = 0;
  const visit = (value, depth) => {
    if (++nodes > 100000 || depth > 24) fail('json_limit');
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'string') { chars += value.length; if (chars > LIMITS_APARADORS.bytes) fail('json_limit'); return value; }
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if ((!plain(value) && !Array.isArray(value)) || seen.has(value) || Object.getOwnPropertySymbols(value).length) fail('unsafe_json');
    if (Array.isArray(value) && (Object.getPrototypeOf(value) !== Array.prototype || value.length > 20000)) fail('unsafe_json');
    seen.add(value);
    const descriptors = Object.getOwnPropertyDescriptors(value), out = Array.isArray(value) ? [] : {};
    const names = Object.keys(descriptors).filter(key => !(Array.isArray(value) && key === 'length'));
    if (Array.isArray(value) && (names.length !== value.length || names.some((name, index) => name !== String(index)))) fail('unsafe_json');
    for (const name of names) {
      const descriptor = descriptors[name];
      if (BAD_KEYS.has(name) || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) fail('unsafe_json');
      chars += name.length;
      Object.defineProperty(out, name, { value: visit(descriptor.value, depth + 1), enumerable: true, writable: true, configurable: true });
    }
    seen.delete(value); return out;
  };
  const result = visit(input, 0);
  if (Buffer.byteLength(JSON.stringify(result)) > LIMITS_APARADORS.bytes) fail('json_limit');
  return result;
}

function safeUrlText(value) {
  if (typeof value !== 'string' || !value || value.length > 2048 || value !== value.trim()
    || /[\u0000-\u0020\u007f-\u009f\\\p{Cf}\u2028\u2029]/u.test(value)
    || /%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i.test(value)) fail('unsafe_url');
}
export function origenCanonicAparador(value) {
  safeUrlText(value); let url; try { url = new URL(value); } catch { fail('unsafe_origin'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash
    || isIP(host.replace(/^\[|\]$/g, '')) || !host.includes('.') || host.endsWith('.')
    || ['localhost', 'local', 'internal', 'invalid'].some(suffix => host === suffix || host.endsWith(`.${suffix}`))) fail('unsafe_origin');
  return url.origin;
}
export function urlCanonicaProducte(value, canonicalOrigin) {
  const origin = origenCanonicAparador(canonicalOrigin); safeUrlText(value);
  let url; try { url = new URL(value, `${origin}/`); } catch { fail('unsafe_url'); }
  if (url.origin !== origin || url.username || url.password || url.port || url.protocol !== 'https:') fail('foreign_url');
  url.hash = '';
  const names = new Set();
  for (const name of [...url.searchParams.keys()]) {
    if (name.toLowerCase().startsWith('utm_') || ['fbclid', 'gclid', '_ga'].includes(name.toLowerCase())) { url.searchParams.delete(name); continue; }
    if (names.has(name)) fail('duplicate_url_parameter'); names.add(name);
  }
  url.searchParams.sort();
  return url.href;
}

/** Cap arredoniment: només quantitats exactament representables en cèntims. */
export function preuEnCentims(value, { minorUnit = null, locale = 'canonical' } = {}) {
  if (typeof value === 'number') {
    // Decimal JSON: el límit manté resolució molt inferior a un cèntim.
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000 || minorUnit !== null && !Number.isSafeInteger(value)) fail('invalid_price');
    value = String(value); locale = 'canonical';
  }
  if (typeof value !== 'string' || !value || value.length > 40 || value !== value.trim()) fail('invalid_price');
  if (minorUnit !== null) {
    if (!integer(minorUnit, 0, 6) || !/^\d{1,20}$/.test(value)) fail('invalid_minor_price');
    let amount = BigInt(value);
    if (minorUnit <= 2) amount *= 10n ** BigInt(2 - minorUnit);
    else { const divisor = 10n ** BigInt(minorUnit - 2); if (amount % divisor) fail('subcent_precision'); amount /= divisor; }
    if (amount > MAX_CENTS) fail('price_overflow'); return Number(amount);
  }
  if (!['canonical', 'es-ES', 'ca-ES', 'en-GB'].includes(locale)) fail('unknown_price_locale');
  const decimal = ['es-ES', 'ca-ES'].includes(locale) ? ',' : '.';
  const grouping = locale === 'canonical' ? null : decimal === ',' ? '.' : ',';
  const parts = value.split(decimal);
  if (parts.length > 2 || parts.length === 2 && !/^\d{1,2}$/.test(parts[1])) fail('subcent_precision');
  let whole = parts[0];
  if (grouping && whole.includes(grouping)) {
    const groups = whole.split(grouping);
    if (!/^\d{1,3}$/.test(groups[0]) || groups.slice(1).some(group => !/^\d{3}$/.test(group))) fail('ambiguous_price');
    whole = groups.join('');
  }
  if (!/^\d{1,16}$/.test(whole)) fail('invalid_price');
  const amount = BigInt(whole) * 100n + BigInt((parts[1] || '').padEnd(2, '0'));
  if (amount > MAX_CENTS) fail('price_overflow'); return Number(amount);
}

function entities(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  let out = '';
  for (let i = 0; i < value.length; i++) {
    if (value[i] !== '&') { out += value[i]; continue; }
    let end = i + 1; while (end < value.length && end - i <= 12 && value[end] !== ';' && value[end] !== '&') end++;
    if (value[end] !== ';' || end - i > 12) { out += '&'; continue; }
    const code = value.slice(i + 1, end); let decoded = named[code];
    if (code.startsWith('#') && /^#(?:\d{1,7}|x[0-9a-f]{1,6})$/i.test(code)) {
      const number = code[1].toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number(code.slice(1));
      if (number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff)) decoded = String.fromCodePoint(number);
    }
    if (decoded === undefined) out += value.slice(i, end + 1); else out += decoded;
    i = end;
  }
  return out;
}
export function textPlaAparador(value, limit = 300) {
  if (typeof value !== 'string' || value.length > 8192 || !integer(limit, 1, 1000)) fail('invalid_text');
  const clean = llevaEtiquetes(llevaScriptsIEstils(entities(value)))
    .replace(/[<>\u0000-\u001f\u007f-\u009f\p{Cf}]/gu, ' ').replace(/\s+/g, ' ').trim();
  return [...clean].slice(0, limit).join('');
}
const productId = value => { if (typeof value !== 'string' || !value || value.length > 200 || /[\u0000-\u0020\u007f-\u009f\p{Cf}]/u.test(value)) fail('invalid_product_id'); return value; };

function parseJson(body) {
  if (typeof body !== 'string' || Buffer.byteLength(body) > LIMITS_APARADORS.bytes) fail('body_limit');
  let value; try { value = JSON.parse(body); } catch { fail('invalid_json'); }
  return copyJson(value);
}
function pageOk(page, origin) {
  if (!plain(page) || page.status !== 200 || typeof page.content_type !== 'string') fail('http_error');
  const url = urlCanonicaProducte(page.url, origin);
  if (typeof page.body !== 'string' || Buffer.byteLength(page.body) > LIMITS_APARADORS.bytes) fail('body_limit');
  return url;
}
function wooProduct(row, origin) {
  if (!plain(row) || !integer(row.id, 1) || !plain(row.prices) || row.prices.currency_code !== 'EUR' || !integer(row.prices.currency_minor_unit, 0, 6)
      || typeof row.is_in_stock !== 'boolean') fail('invalid_woo_product');
  if (['variable', 'grouped'].includes(row.type) || row.prices.price_range != null || row.is_password_protected === true) fail('ambiguous_product');
  const title = textPlaAparador(row.name); if (!title) fail('empty_title');
  return { external_product_id: `woo:${row.id}`, external_source_url: urlCanonicaProducte(row.permalink, origin), title,
    price_cents: preuEnCentims(row.prices.price, { minorUnit: row.prices.currency_minor_unit }), currency: 'EUR', in_stock: row.is_in_stock,
    proposed_label: textPlaAparador(typeof row.categories?.[0]?.name === 'string' ? row.categories[0].name : title, 80) || title.slice(0, 80) };
}
function fromWoo(capture, source) {
  const rows = []; let total = null, pages = null, perPage = null;
  const seen = new Set();
  for (const page of capture.pages) {
    keys(page, ['url', 'status', 'content_type', 'body', 'page', 'per_page', 'total', 'total_pages']);
    const address = new URL(pageOk(page, source.canonical_origin));
    if (!/^application\/json(?:;|$)/i.test(page.content_type) || address.pathname !== '/wp-json/wc/store/v1/products'
      || [...address.searchParams.keys()].some(key => !['page', 'per_page'].includes(key))) fail('invalid_woo_page');
    if (!integer(page.page, 1, 2000) || !integer(page.per_page, 1, 100) || !integer(page.total, 0, LIMITS_APARADORS.products)
      || !integer(page.total_pages, 0, 2000) || seen.has(page.page)) fail('invalid_pagination');
    if ((address.searchParams.get('page') ?? '1') !== String(page.page)
      || (address.searchParams.get('per_page') ?? '10') !== String(page.per_page)) fail('pagination_url_mismatch');
    seen.add(page.page);
    if (total === null) { total = page.total; pages = page.total_pages; perPage = page.per_page; }
    if (total !== page.total || pages !== page.total_pages || perPage !== page.per_page || pages !== Math.ceil(total / perPage)) fail('inconsistent_totals');
    const items = parseJson(page.body);
    if (!Array.isArray(items) || items.length > perPage || items.length !== Math.min(perPage, Math.max(0, total - (page.page - 1) * perPage))) fail('truncated_page');
    rows.push(...items.map(item => wooProduct(item, source.canonical_origin)));
  }
  if (capture.pages.length !== Math.max(pages ?? 0, 1) || rows.length !== total) fail('incomplete_capture');
  for (let page = 1; page <= Math.max(pages, 1); page++) if (!seen.has(page)) fail('incomplete_capture');
  return rows;
}

function tagEnd(text, from) {
  let quote = '';
  for (let i = from; i < text.length; i++) {
    const char = text[i];
    if (quote) { if (char === quote) quote = ''; }
    else if (char === '"' || char === "'") quote = char;
    else if (char === '>') return i;
  }
  fail('truncated_html');
}
function tagType(tag) {
  let i = 0, type = null;
  while (i < tag.length) {
    while (i < tag.length && /\s/.test(tag[i])) i++;
    const begin = i; while (i < tag.length && !/[\s=>]/.test(tag[i])) i++;
    const name = tag.slice(begin, i).toLowerCase();
    while (i < tag.length && /\s/.test(tag[i])) i++;
    let value = '';
    if (tag[i] === '=') {
      i++; while (i < tag.length && /\s/.test(tag[i])) i++;
      const quote = tag[i] === '"' || tag[i] === "'" ? tag[i++] : '';
      const start = i;
      while (i < tag.length && (quote ? tag[i] !== quote : !/[\s>]/.test(tag[i]))) i++;
      value = tag.slice(start, i); if (quote) i++;
    }
    if (name === 'type') { if (type !== null) fail('ambiguous_script_type'); type = entities(value).toLowerCase(); }
    if (i === begin) i++;
  }
  return type;
}
function rawClose(lower, name, from) {
  let close = lower.indexOf(`</${name}`, from);
  while (close >= 0 && !/[\s/>]/.test(lower[close + name.length + 2] || '')) close = lower.indexOf(`</${name}`, close + name.length + 2);
  if (close < 0) fail('truncated_html');
  return close;
}
/** Escàner monotònic: comentaris, etiquetes i cossos de script es visiten una volta. */
function jsonLdScripts(html) {
  // Unicode lowercasing can change string length (İ); offsets must stay exact.
  const lower = html.replace(/[A-Z]/g, char => String.fromCharCode(char.charCodeAt(0) + 32)), result = []; let offset = 0;
  while (offset < html.length) {
    const open = lower.indexOf('<', offset); if (open < 0) break;
    if (lower.startsWith('<!--', open)) { const end = lower.indexOf('-->', open + 4); if (end < 0) fail('truncated_html'); offset = end + 3; continue; }
    const end = tagEnd(html, open + 1);
    const name = /^<([a-z][a-z0-9:-]*)(?=[\s/>])/.exec(lower.slice(open, Math.min(end + 1, open + 128)))?.[1];
    // Estos contextos requerixen un parser HTML amb arbre; no s'inferix cap dada.
    if (['template', 'svg', 'math'].includes(name)) fail('ambiguous_html_context');
    if (name === 'plaintext') break;
    if (['style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript'].includes(name)) {
      const close = rawClose(lower, name, end + 1);
      offset = tagEnd(html, close + 2) + 1; continue;
    }
    if (name !== 'script') { offset = end + 1; continue; }
    if (end - open > 4096) fail('tag_limit');
    const type = tagType(html.slice(open + 7, end));
    const close = rawClose(lower, 'script', end + 1);
    const closeEnd = tagEnd(html, close + 2);
    if (type === 'application/ld+json') { result.push(parseJson(html.slice(end + 1, close))); if (result.length > 100) fail('script_limit'); }
    offset = closeEnd + 1;
  }
  return result;
}
const typed = (value, type) => [type, `https://schema.org/${type}`, `http://schema.org/${type}`].some(t => value === t || Array.isArray(value) && value.includes(t));
function ldProduct(row, source) {
  const offer = Array.isArray(row.offers) && row.offers.length === 1 ? row.offers[0] : row.offers;
  if (!plain(offer) || !typed(offer['@type'], 'Offer') || offer.priceCurrency !== 'EUR') fail('ambiguous_offer');
  const title = textPlaAparador(row.name); if (!title) fail('empty_title');
  const url = urlCanonicaProducte(row.url ?? offer.url, source.canonical_origin);
  const id = typeof row.productID === 'string' && row.productID ? `product:${row.productID}`
    : typeof row.sku === 'string' && row.sku ? `sku:${row.sku}` : `url:${hash(url)}`;
  const availability = typeof offer.availability === 'string' ? offer.availability.split('/').at(-1) : null;
  const stock = ['InStock', 'LimitedAvailability', 'OnlineOnly', 'InStoreOnly'].includes(availability) ? true
    : ['OutOfStock', 'SoldOut', 'Discontinued', 'BackOrder', 'PreOrder', 'PreSale'].includes(availability) ? false : null;
  return { external_product_id: productId(id), external_source_url: url, title,
    price_cents: preuEnCentims(offer.price, { locale: source.price_locale ?? 'canonical' }), currency: 'EUR', in_stock: stock,
    proposed_label: textPlaAparador(typeof row.category === 'string' ? row.category : title, 80) || title.slice(0, 80) };
}
function fromJsonLd(capture, source) {
  if (!Array.isArray(capture.expected_page_urls) || !integer(capture.total_products, 0, LIMITS_APARADORS.products)) fail('coverage_absent');
  const expected = new Set(capture.expected_page_urls.map(url => urlCanonicaProducte(url, source.canonical_origin)));
  if (expected.size !== capture.expected_page_urls.length || expected.size !== capture.pages.length) fail('incomplete_capture');
  const rows = [], seenPages = new Set();
  for (const page of capture.pages) {
    keys(page, ['url', 'status', 'content_type', 'body']);
    const url = pageOk(page, source.canonical_origin);
    if (!expected.has(url) || seenPages.has(url)) fail('incomplete_capture'); seenPages.add(url);
    const documents = /^application\/ld\+json(?:;|$)/i.test(page.content_type) ? [parseJson(page.body)]
      : /^text\/html(?:;|$)/i.test(page.content_type) ? jsonLdScripts(page.body) : fail('invalid_content_type');
    const stack = [...documents]; let visited = 0;
    while (stack.length) {
      if (++visited > 20000) fail('jsonld_limit');
      const item = stack.pop();
      if (Array.isArray(item)) { stack.push(...item); continue; }
      if (!plain(item)) continue;
      if (typed(item['@type'], 'Product')) rows.push(ldProduct(item, source));
      else for (const key of ['@graph', 'mainEntity', 'itemListElement', 'item']) if (Object.hasOwn(item, key)) stack.push(item[key]);
      if (rows.length > LIMITS_APARADORS.products) fail('product_limit');
    }
  }
  if (rows.length !== capture.total_products) fail('inconsistent_totals');
  return rows;
}

function normalSource(value) {
  keys(value, SOURCE_KEYS);
  if (typeof value.source_id !== 'string' || !UUID.test(value.source_id) || value.sync_consent !== true || value.enabled !== true || !instant(value.consented_at)) fail('consent_required');
  if (value.price_locale !== undefined && !['canonical', 'es-ES', 'ca-ES', 'en-GB'].includes(value.price_locale)) fail('unknown_price_locale');
  return { ...value, canonical_origin: origenCanonicAparador(value.canonical_origin) };
}
function normalState(value, source) {
  keys(value, STATE_KEYS);
  if (!integer(value.state_version) || !Array.isArray(value.products) || value.products.length > LIMITS_APARADORS.products
    || !(value.last_complete_scan_date === null || date(value.last_complete_scan_date))
    || !(value.last_complete_scan_digest === null || HASH.test(value.last_complete_scan_digest))
    || (value.last_complete_scan_date === null) !== (value.last_complete_scan_digest === null)) fail('invalid_state');
  const ids = new Set(), urls = new Set();
  for (const row of value.products) {
    keys(row, PRODUCT_KEYS); productId(row.external_product_id);
    if (typeof row.title !== 'string' || [...row.title].length > 300 || !integer(row.price_cents) || row.currency !== 'EUR'
      || ![true, false, null].includes(row.in_stock) || !STATUS.has(row.status) || !integer(row.missing_streak, 0, 2)
      || ![row.last_seen_date, row.last_missing_scan_date].every(day => day === null || date(day))
      || !(row.proposed_label === null || typeof row.proposed_label === 'string' && [...row.proposed_label].length <= 80)
      || !(row.approved_at === null || instant(row.approved_at)) || row.status !== 'pending_review' && !instant(row.approved_at)) fail('invalid_product_state');
    if ([row.last_seen_date, row.last_missing_scan_date].some(day => day !== null
      && (value.last_complete_scan_date === null || day > value.last_complete_scan_date))
      || (row.missing_streak === 0) !== (row.last_missing_scan_date === null)) fail('inconsistent_state_dates');
    if (row.external_source_url !== urlCanonicaProducte(row.external_source_url, source.canonical_origin)) fail('noncanonical_state_url');
    if (ids.has(row.external_product_id) || urls.has(row.external_source_url)) fail('duplicate_state');
    ids.add(row.external_product_id); urls.add(row.external_source_url);
  }
  return value;
}
function rejected(source, observedOn, state, reason) {
  return { should_apply: false, plan: { schema: SCHEMA_PLA_APARADORS, source_id: source.source_id, observed_on: observedOn, expected_state_version: state.state_version,
    scan: { status: 'rejected', digest: hash(`rejected:${reason}`), product_count: 0, reason }, product_changes: [], events: [] }, next_state: state };
}
function syncFields(row) {
  return Object.fromEntries(['title', 'price_cents', 'currency', 'in_stock', 'status', 'missing_streak', 'last_seen_date', 'last_missing_scan_date', 'proposed_label'].map(key => [key, row[key]]));
}

/** `capture`: captures íntegres, no un client HTTP. `observedOn` és el dia UTC
 * injectat pel cron. Un segon digest del mateix dia falla tancat. */
export function planificaSyncAparador(input) {
  const data = copyJson(input); keys(data, ['source', 'observedOn', 'capture', 'state']);
  const source = normalSource(data.source), state = normalState(data.state, source), observedOn = data.observedOn;
  if (!date(observedOn)) fail('invalid_observation_date');
  if (Date.parse(source.consented_at) >= Date.parse(`${observedOn}T00:00:00Z`) + 86400000) fail('future_consent');
  if (state.products.some(row => row.approved_at !== null
    && new Date(row.approved_at).toISOString().slice(0, 10) > observedOn)) fail('future_approval');
  let products;
  try {
    const capture = data.capture;
    keys(capture, ['format', 'complete', 'pages', 'expected_page_urls', 'total_products']);
    if (capture.complete !== true || !Array.isArray(capture.pages) || !capture.pages.length || capture.pages.length > 2000) fail('incomplete_capture');
    products = capture.format === 'woocommerce' ? fromWoo(capture, source)
      : capture.format === 'jsonld' ? fromJsonLd(capture, source) : fail('unknown_format');
    if (!products.length && state.products.length) fail('suspicious_empty');
    const ids = new Set(), urls = new Set();
    for (const product of products) {
      if (ids.has(product.external_product_id) || urls.has(product.external_source_url)) fail('duplicate_source');
      ids.add(product.external_product_id); urls.add(product.external_source_url);
    }
    products.sort((a, b) => ORDER(a.external_product_id, b.external_product_id));
  } catch (error) { if (error instanceof ErrorSyncAparador) return rejected(source, observedOn, state, error.code); throw error; }
  const digest = hash(canonical(products));
  const plan = { schema: SCHEMA_PLA_APARADORS, source_id: source.source_id, observed_on: observedOn, expected_state_version: state.state_version,
    scan: { status: 'complete', digest, product_count: products.length, reason: null }, product_changes: [], events: [] };
  if (state.last_complete_scan_date !== null && observedOn <= state.last_complete_scan_date) {
    if (observedOn === state.last_complete_scan_date && digest === state.last_complete_scan_digest) return { should_apply: false, plan, next_state: state };
    return rejected(source, observedOn, state, observedOn < state.last_complete_scan_date ? 'stale_scan' : 'day_already_observed');
  }
  if (!integer(state.state_version + 1)) fail('state_version_exhausted');
  const byId = new Map(state.products.map(row => [row.external_product_id, row]));
  const byUrl = new Map(state.products.map(row => [row.external_source_url, row]));
  const seen = new Set(), next = [];
  function event(id, kind, before, after) {
    plan.events.push({ event_key: hash(canonical([source.source_id, observedOn, id, kind, before, after])), external_product_id: id, kind, before, after });
  }
  function change(row, mode, proposedStatus = null) {
    next.push(row); plan.product_changes.push({ external_product_id: row.external_product_id, external_source_url: row.external_source_url,
      mode, state: syncFields(row), proposed_status: proposedStatus });
  }
  for (const product of products) {
    const idMatch = byId.get(product.external_product_id), urlMatch = byUrl.get(product.external_source_url);
    if (idMatch && urlMatch && idMatch !== urlMatch) return rejected(source, observedOn, state, 'identity_conflict');
    if (idMatch && idMatch.external_source_url !== product.external_source_url) return rejected(source, observedOn, state, 'linked_url_changed');
    const old = idMatch || urlMatch;
    if (old && seen.has(old.external_product_id)) return rejected(source, observedOn, state, 'identity_conflict');
    if (!old) {
      const row = { ...product, status: 'pending_review', missing_streak: 0, last_seen_date: observedOn, last_missing_scan_date: null, approved_at: null };
      change(row, 'insert_pending_review'); event(row.external_product_id, 'new_product_detected', null, { title: row.title, price_cents: row.price_cents,
        currency: 'EUR', in_stock: row.in_stock, status: 'pending_review', proposed_label: row.proposed_label }); continue;
    }
    seen.add(old.external_product_id);
    const linked = old.approved_at !== null && old.status !== 'pending_review';
    const row = { ...old, missing_streak: 0, last_seen_date: observedOn, last_missing_scan_date: null };
    let changed = false;
    if (linked && old.price_cents !== product.price_cents) { row.price_cents = product.price_cents; changed = true; event(old.external_product_id, 'price_changed', { price_cents: old.price_cents }, { price_cents: row.price_cents }); }
    if (linked && product.in_stock !== null && old.in_stock !== product.in_stock) { row.in_stock = product.in_stock; changed = true; event(old.external_product_id, 'stock_changed', { in_stock: old.in_stock }, { in_stock: row.in_stock }); }
    if (old.status === 'seasonal_hidden' && old.missing_streak > 0) event(old.external_product_id, 'product_returned_to_source', { status: old.status, missing_streak: old.missing_streak }, { status: old.status, missing_streak: 0 });
    change(row, changed ? 'update_linked' : 'observe');
  }
  for (const old of state.products) if (!seen.has(old.external_product_id)) {
    const row = { ...old, missing_streak: Math.min(2, old.missing_streak + 1), last_missing_scan_date: observedOn };
    const proposed = old.missing_streak < 2 && row.missing_streak === 2 && old.status !== 'seasonal_hidden' ? 'seasonal_hidden' : null;
    change(row, 'observe', proposed);
    if (proposed) event(old.external_product_id, 'product_missing_in_source', { missing_streak: old.missing_streak, status: old.status }, { missing_streak: 2, status: old.status });
  }
  if (next.length > LIMITS_APARADORS.products || plan.events.length > LIMITS_APARADORS.events || Buffer.byteLength(JSON.stringify(plan)) > LIMITS_APARADORS.bytes) return rejected(source, observedOn, state, 'plan_limit');
  plan.product_changes.sort((a, b) => ORDER(a.external_product_id, b.external_product_id));
  plan.events.sort((a, b) => ORDER(a.event_key, b.event_key));
  next.sort((a, b) => ORDER(a.external_product_id, b.external_product_id));
  return { should_apply: true, plan, next_state: { state_version: state.state_version + 1, last_complete_scan_date: observedOn, last_complete_scan_digest: digest, products: next } };
}
