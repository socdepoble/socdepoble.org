#!/usr/bin/env node
/** R32.14 · Explicit historical URL -> verified final page inventory.
 * Expected O(number of URLs + total UTF-8 URI bytes), using Map/Set lookup;
 * no sorting, recursive traversal, URL fetches or guessed slug destinations.
 * CLI: mapa-redireccions-301.mjs input.json [--format all|firebase|wordpress|nginx]
 * Input: {redireccions:[{source,destination,status:301}],destinsDisponibles:[...]}
 * destinsDisponibles must come from the actual content inventory, not SPA 200s.
 * No emitter deploys anything or proves control over a historical domain.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TARGET = 'https://socdepoble.org';
const MAX_URL = 2048;
const MAX_ROWS = 200000;
const MAX_FILE = 64 * 1024 * 1024;
const HOSTS = Object.freeze(['socdepoble.net', 'socdepoble.com', 'elrentonar.blogspot.com']);
const BAD_SEGMENT = /\/\.{1,2}(?:\/|$)|\/\//;
const ASCII_PATH = /^\/[A-Za-z0-9._~/-]*$/;
const UNICODE_PATH = /^\/[\p{L}\p{M}\p{N}._~/-]*$/u;
const IGNORABLE_UNICODE = /\p{Default_Ignorable_Code_Point}/u;
const CANONICAL_ASCII_SOURCE = /^https:\/\/socdepoble\.(?:net|com)\/[A-Za-z0-9._~/-]*(?:\?(?:p|page_id|attachment_id)=[1-9][0-9]{0,18})?$/;
const QUERY_ID = /^(?:p|page_id|attachment_id)=[1-9][0-9]{0,18}$/;
// Grammar only: no URI, input object or verification result is retained here.
const ASCII_URI_CLASS = new Uint8Array(128);
for (const range of [[65, 90], [97, 122]]) for (let c = range[0]; c <= range[1]; c++) ASCII_URI_CLASS[c] = 1;
for (let c = 48; c <= 57; c++) ASCII_URI_CLASS[c] = 2;
for (const c of [95, 126, 45]) ASCII_URI_CLASS[c] = 1;
ASCII_URI_CLASS[46] = 3;
ASCII_URI_CLASS[47] = 4;

/** Canonical source prefix only; the caller checks primitive/length first. */
function canonicalSourcePrefix301(value) {
  return value.startsWith('https://socdepoble.') && value[22] === '/'
    && (value[19] === 'n' && value[20] === 'e' && value[21] === 't'
      || value[19] === 'c' && value[20] === 'o' && value[21] === 'm');
}

function indexedSourceQuery301(value, index, query, segment) {
  if (segment === 1 || segment === 2) return null;
  let position;
  if (value.startsWith('p=', query)) position = query + 2;
  else if (value.startsWith('page_id=', query)) position = query + 8;
  else if (value.startsWith('attachment_id=', query)) position = query + 14;
  else return null;
  const digits = value.length - position;
  if (digits < 1 || digits > 19 || value.charCodeAt(position) < 49 || value.charCodeAt(position) > 57) return null;
  let number = 0, scale = 0;
  for (; position < value.length; position++) {
    const digit = value.charCodeAt(position) - 48;
    if (digit < 0 || digit > 9) return null;
    number = number * 10 + digit;
    scale = scale ? scale * 10 : 1;
  }
  index.preparedValue = value;
  index.preparedBucket = scale && number < index.limit && scale <= index.limit
    ? number * 2 + (value.charCodeAt(19) & 1) : -1;
  return value;
}

/** Validate a canonical ASCII source and obtain its numeric tail in one scan.
 * The prefix slash is position22; unsupported syntax retains the original
 * full normalizer. Only the fresh source index keeps the pending exact value. */
function indexedAsciiSource301(value, index) {
  index.preparedValue = undefined;
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_URL || !canonicalSourcePrefix301(value)) return null;
  let segment = 0, number = 0, scale = 0;
  for (let position = 23; position < value.length; position++) {
    const code = value.charCodeAt(position), kind = ASCII_URI_CLASS[code];
    if (kind === 2) {
      segment = 3;
      number = number * 10 + code - 48;
      scale = scale ? scale * 10 : 1;
    } else {
      if (kind === 4) {
        if (segment !== 3) return null;
        segment = 0;
      } else if (kind === 3) {
        if (segment < 3) segment++;
      } else if (kind === 1) segment = 3;
      else if (code === 63) return indexedSourceQuery301(value, index, position + 1, segment);
      else return null;
      number = scale = 0;
    }
  }
  if (segment === 1 || segment === 2) return null;
  index.preparedValue = value;
  index.preparedBucket = scale && number < index.limit && scale <= index.limit
    ? number * 2 + (value.charCodeAt(19) & 1) : -1;
  return value;
}
const record = o => {
  if (o === null || typeof o !== 'object' || Array.isArray(o)) return false;
  const prototype = Object.getPrototypeOf(o);
  return prototype === Object.prototype || prototype === null;
};

/** Canonical URI transport syntax; no silent WHATWG dot/slash normalization.
 * Common ASCII is checked in C++ regex scans. Percent paths use a bounded slow
 * path and must encode NFC/NFKC-stable Unicode with uppercase UTF-8 escapes.
 * Encoded ASCII, double escapes, encoded separators, controls and bidi fail.
 */
export function rutaCanonica301(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_URL || value[0] !== '/') return null;
  if (ASCII_PATH.test(value)) return BAD_SEGMENT.test(value) ? null : value;
  if (!value.includes('%') || /[^\x21-\x7e]/.test(value)) return null;
  let decoded;
  try { decoded = decodeURIComponent(value); } catch { return null; }
  if (!UNICODE_PATH.test(decoded) || IGNORABLE_UNICODE.test(decoded) || BAD_SEGMENT.test(decoded)
    || decoded !== decoded.normalize('NFC') || decoded !== decoded.normalize('NFKC')
    || encodeURI(decoded) !== value) return null;
  return value;
}

function blogPath(pathname) {
  if (pathname === '/') return true;
  if (pathname.startsWith('/p/')) return pathname.length > 8 && pathname.endsWith('.html') && !pathname.slice(3).includes('/');
  if (pathname.length < 15 || pathname[5] !== '/' || pathname[8] !== '/' || !pathname.endsWith('.html')) return false;
  for (const i of [1, 2, 3, 4, 6, 7]) if (pathname.charCodeAt(i) < 48 || pathname.charCodeAt(i) > 57) return false;
  const month = Number(pathname.slice(6, 8));
  return month >= 1 && month <= 12 && pathname.slice(9, -5).length > 0 && !pathname.slice(9).includes('/');
}

/** Accept http/https and www aliases, but never credentials, ports, IDN hosts,
 * backslashes, fragments or ambiguous queries. WordPress ID query URLs remain
 * exact, and Blogger's sole ?m=1 alias is explicitly the same article.
 */
export function normalitzaOrigen301(value) {
  if (typeof value !== 'string' || value.length > MAX_URL || value.length < 10) return null;
  if (CANONICAL_ASCII_SOURCE.test(value) && value.indexOf('//', 8) === -1 && value.indexOf('/.') === -1) return value;
  const start = value.startsWith('https://') ? 8 : value.startsWith('http://') ? 7 : 0;
  if (!start) return null;
  let slash = value.indexOf('/', start);
  if (slash < 0) slash = value.length;
  const rawHost = value.slice(start, slash);
  const host = rawHost.startsWith('www.') ? rawHost.slice(4) : rawHost;
  if (!HOSTS.includes(host) || rawHost.startsWith('www.elrentonar.')) return null;
  let uri = slash === value.length ? '/' : value.slice(slash);
  const question = uri.indexOf('?');
  const pathname = question < 0 ? uri : uri.slice(0, question);
  if (!rutaCanonica301(pathname)) return null;
  if (host === 'elrentonar.blogspot.com') {
    if (!blogPath(pathname) || question >= 0 && uri.slice(question + 1) !== 'm=1') return null;
    uri = pathname;
  } else if (question >= 0 && !QUERY_ID.test(uri.slice(question + 1))) return null;
  if (start === 8 && rawHost === host && slash !== value.length && uri === value.slice(slash)) return value;
  return `https://${host}${uri}`;
}

export function normalitzaDesti301(value) {
  if (typeof value !== 'string') return null;
  return rutaCanonica301(value.startsWith(`${TARGET}/`) ? value.slice(TARGET.length) : value);
}

function failure(code, index = null) {
  return { valid: false, count: 0, errors: [{ code, index }] };
}

// Optional input shape, verified from raw data on every call: canonical ASCII
// .net/.com sources in strictly increasing order, one distinct final path per
// row, paired with the same strictly increasing destination inventory. Checking
// both orders proves uniqueness/membership without allocating hash tables. Dots,
// aliases, Unicode, Blogger, queries, many-to-one and unordered imports fall back
// to the complete general verifier; this function never trusts a prior result.
const ORDERED_SOURCE = /^https:\/\/socdepoble\.(?:net|com)\/[A-Za-z0-9_~/-]*$/;
const ORDERED_DESTINATION = /^\/[A-Za-z0-9_~/-]*$/;
function orderedBijective(input) {
  if (input.origensEsperats !== undefined || input.redireccions.length !== input.destinsDisponibles.length) return null;
  let previousSource = '', previousDestination = '';
  for (let i = 0; i < input.redireccions.length; i++) {
    const row = input.redireccions[i];
    if (!record(row) || !Object.hasOwn(row, 'source') || !Object.hasOwn(row, 'destination') || row.status !== 301) return null;
    const source = row.source, destination = row.destination;
    if (typeof source !== 'string' || typeof destination !== 'string'
      || source.length > MAX_URL || destination.length > MAX_URL
      || source <= previousSource || destination <= previousDestination
      || destination !== input.destinsDisponibles[i]
      || !ORDERED_SOURCE.test(source) || !ORDERED_DESTINATION.test(destination)
      || source.indexOf('//', 8) !== -1 || destination.indexOf('//') !== -1) return null;
    previousSource = source;
    previousDestination = destination;
  }
  return { valid: true, count: input.redireccions.length, destinations: input.destinsDisponibles.length, errors: [], mode: 'ordered-bijective-ascii' };
}

/** Numeric tails are common in imported CMS URLs. A bounded direct bucket
 * avoids hashing the full URI in that case. One prefix bit distinguishes common
 * .net/.com numeric tails; they never prove equality. Each bucket retains its
 * exact string; colliding prefixes/hosts/leading zeros use the native Set, so
 * a suffix is never evidence of equality. Non-numeric and large IDs use Set
 * immediately. All operations remain expected O(bytes + rows), including an
 * adversary making every URI collide in the same suffix bucket. */
class UriIndex {
  constructor(capacity, hostBits = true) {
    this.limit = capacity + 1;
    this.hostBits = hostBits;
    this.slots = new Int32Array(Math.max(1, this.limit * (hostBits ? 2 : 1)));
    this.values = new Array(capacity);
    this.next = 0;
    this.collisions = new Set();
    this.size = 0;
    this.preparedValue = undefined;
    this.preparedBucket = -1;
  }
  bucket(value) {
    let index = value.length - 1, digit = value.charCodeAt(index) - 48;
    if (digit < 0 || digit > 9) return -1;
    let number = 0, scale = 1;
    while (index >= 0 && digit >= 0 && digit <= 9) {
      number += digit * scale;
      if (number >= this.limit || scale > this.limit) return -1;
      scale *= 10;
      digit = value.charCodeAt(--index) - 48;
    }
    // Position 19 is n/c in canonical https://socdepoble.net/.com. Short
    // strings produce NaN here, whose bitwise conversion is deterministically 0.
    return this.hostBits ? number * 2 + (value.charCodeAt(19) & 1) : number;
  }
  has(value) {
    if (typeof value !== 'string') return false;
    const bucket = this.bucket(value);
    if (bucket < 0) return this.collisions.has(value);
    const slot = this.slots[bucket];
    return slot > 0 ? this.values[slot - 1] === value : slot < 0 && this.collisions.has(value);
  }
  add(value) {
    const bucket = this.preparedValue === value ? this.preparedBucket : this.bucket(value);
    this.preparedValue = undefined;
    if (bucket < 0) {
      const before = this.collisions.size;
      this.collisions.add(value);
      this.size += this.collisions.size - before;
      return;
    }
    const slot = this.slots[bucket];
    if (!slot) {
      this.values[this.next] = value;
      this.slots[bucket] = ++this.next;
      this.size++;
    } else if (slot > 0) {
      const before = this.values[slot - 1];
      if (before === value) return;
      this.collisions.add(before);
      this.collisions.add(value);
      this.slots[bucket] = -1;
      this.size++;
    } else {
      const before = this.collisions.size;
      this.collisions.add(value);
      this.size += this.collisions.size - before;
    }
  }
}

/** Shared raw invariants for both verifier and constructor. Every invocation
 * builds a fresh inventory and exact-source index. No result or input is trusted. */
function destinationIndex301(inventory) {
  const index = new UriIndex(inventory.length, false);
  for (let i = 0; i < inventory.length; i++) {
    const rawRoute = inventory[i];
    const route = normalitzaDesti301(rawRoute);
    if (!route) return failure('inventari_destins_invalid', i);
    index.add(route);
    if (index.size !== i + 1) return failure('desti_duplicat', i);
  }
  return index;
}
function checkRuleValues301(rawSource, rawDestination, sources, destinations, i) {
  const source = indexedAsciiSource301(rawSource, sources) || normalitzaOrigen301(rawSource);
  if (!source) return failure('origen_invalid', i);
  // Membership in this freshly checked inventory also proves path syntax.
  if (!destinations.has(rawDestination)) {
    const destination = normalitzaDesti301(rawDestination);
    if (!destination) return failure('desti_extern_cadena_o_bucle', i);
    if (!destinations.has(destination)) return failure('desti_no_verificat', i);
  }
  sources.add(source);
  if (sources.size !== i + 1) return failure('origen_duplicat_o_conflictiu', i);
  return source;
}
const generalSuccess301 = (sources, destinations) => ({ valid: true, count: sources.size, destinations: destinations.size, errors: [], mode: 'general' });

/** Complete raw verification, with destination-index construction included.
 * First-error result avoids allocating attacker-controlled error lists. Every
 * successful call rechecks each source and destination: no trusted-object cache.
 * The disjoint legacy-source/final-host contract rules out chains and cycles by
 * construction; any destination on a legacy host is rejected, even if listed.
 */
export function verificaMapaRedireccions301(input) {
  if (!record(input) || !Array.isArray(input.redireccions) || !Array.isArray(input.destinsDisponibles)
    || input.redireccions.length > MAX_ROWS || input.destinsDisponibles.length > MAX_ROWS) return failure('inventari_invalid');
  const ordered = orderedBijective(input);
  if (ordered) return ordered;
  const destinations = destinationIndex301(input.destinsDisponibles);
  if (!(destinations instanceof UriIndex)) return destinations;
  const sources = new UriIndex(input.redireccions.length);
  for (let i = 0; i < input.redireccions.length; i++) {
    const rule = input.redireccions[i];
    if (!record(rule) || !Object.hasOwn(rule, 'source') || !Object.hasOwn(rule, 'destination') || rule.status !== 301) return failure('regla_invalida', i);
    const checked = checkRuleValues301(rule.source, rule.destination, sources, destinations, i);
    if (typeof checked !== 'string') return checked;
  }
  if (input.origensEsperats !== undefined) {
    if (!Array.isArray(input.origensEsperats) || input.origensEsperats.length > MAX_ROWS) return failure('corpus_invalid');
    const expected = new Set();
    for (let i = 0; i < input.origensEsperats.length; i++) {
      const source = normalitzaOrigen301(input.origensEsperats[i]);
      if (!source || expected.has(source)) return failure('corpus_invalid_o_duplicat', i);
      expected.add(source);
      if (!sources.has(source)) return failure('origen_sense_regla', i);
    }
    if (sources.size !== expected.size) return failure('origen_fora_corpus');
  }
  return generalSuccess301(sources, destinations);
}

/** Canonical R32.13 direct contract: one original URL + one explicitly
 * reviewed destination per article. Additional origins must be expanded into
 * separate records; silently dropping an alias is never permitted. */
function directEditorial301(articles, inventory) {
  const destinations = destinationIndex301(inventory);
  if (!(destinations instanceof UriIndex)) throw new TypeError(`Taula 301 invàlida: ${destinations.errors[0].code}`);
  const sources = new UriIndex(articles.length), redireccions = new Array(articles.length);
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    if (!record(article) || !Object.hasOwn(article, 'linkOriginal') || !Object.hasOwn(article, 'rutaDestiCanonica')) throw new TypeError('La via directa exigix linkOriginal i rutaDestiCanonica propis.');
    const rawSource = article.linkOriginal, destination = article.rutaDestiCanonica;
    if (Object.hasOwn(article, 'fontsOriginals')) {
      const originals = article.fontsOriginals;
      if (!Array.isArray(originals) || originals.length !== 1 || originals[0] !== rawSource) throw new TypeError('La via directa exigix expandir cada origen en un article explícit.');
    }
    const source = checkRuleValues301(rawSource, destination, sources, destinations, i);
    if (typeof source !== 'string') throw new TypeError(`Taula 301 invàlida: ${source.errors[0].code}`);
    redireccions[i] = { source, destination, status: 301 };
  }
  return { redireccions, destinsDisponibles: inventory, verificacio: generalSuccess301(sources, destinations) };
}

// A flat helper keeps the row counter local to the caller. No per-call
// closure/context allocation, and every output row crosses the same checks.
function editorialRule301(rawSource, explicitRoute, hasExplicitRoute, mapping, sources, destinations, index) {
  if (typeof rawSource !== 'string') throw new TypeError('Origen sense correspondència revisada.');
  if (index >= MAX_ROWS) throw new TypeError('Taula 301 fora de pressupost.');
  if (!Object.hasOwn(mapping, rawSource)) throw new TypeError(hasExplicitRoute ? 'Correspondències de destinació divergents.' : 'Origen sense correspondència revisada.');
  const mapped = mapping[rawSource];
  const destination = hasExplicitRoute ? explicitRoute : mapped;
  if (hasExplicitRoute && normalitzaDesti301(mapped) !== normalitzaDesti301(destination)) throw new TypeError('Correspondències de destinació divergents.');
  const source = checkRuleValues301(rawSource, destination, sources, destinations, index);
  if (typeof source !== 'string') throw new TypeError(`Taula 301 invàlida: ${source.errors[0].code}`);
  return { source, destination, status: 301 };
}

/** Construct and fully verify an explicit imported mapping in one pass.
 * Raw articles/mapping/inventory are untrusted. Newly created output rows have
 * known own fields/status, so they do not need a second schema-check pass.
 * URI, membership and duplicate invariants are exactly the verifier's helpers.
 * Destination paths are never inferred from source slugs. */
export function construeixMapaEditorial301(articles, { destinsDisponibles, destinacions } = {}) {
  if (!Array.isArray(articles) || articles.length > MAX_ROWS || !Array.isArray(destinsDisponibles) || destinsDisponibles.length > MAX_ROWS || destinacions !== undefined && !record(destinacions)) throw new TypeError('Cal corpus, inventari i correspondència explícita de destinacions.');
  if (destinacions === undefined) return directEditorial301(articles, destinsDisponibles);
  const destinations = destinationIndex301(destinsDisponibles);
  if (!(destinations instanceof UriIndex)) throw new TypeError(`Taula 301 invàlida: ${destinations.errors[0].code}`);
  const sources = new UriIndex(articles.length), redireccions = new Array(articles.length);
  let count = 0;
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    if (!record(article)) throw new TypeError('Article 301 invàlid.');
    const hasExplicitRoute = Object.hasOwn(article, 'rutaDestiCanonica');
    const route = hasExplicitRoute ? article.rutaDestiCanonica : undefined;
    if (Object.hasOwn(article, 'fontsOriginals')) {
      const list = article.fontsOriginals;
      if (!Array.isArray(list) || list.length === 0 || list.length > MAX_ROWS) throw new TypeError('Fonts originals absents o invàlides.');
      for (let j = 0; j < list.length; j++) redireccions[count] = editorialRule301(list[j], route, hasExplicitRoute, destinacions, sources, destinations, count++);
    } else {
      if (!Object.hasOwn(article, 'linkOriginal')) throw new TypeError('Origen original absent.');
      redireccions[count] = editorialRule301(article.linkOriginal, route, hasExplicitRoute, destinacions, sources, destinations, count++);
    }
  }
  redireccions.length = count;
  return { redireccions, destinsDisponibles, verificacio: generalSuccess301(sources, destinations) };
}

const regexLiteral = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const decodedPath = value => decodeURIComponent(value);
const aliases = host => host === HOSTS[2] ? [host] : [host, `www.${host}`];

function groupRules(rules) {
  const groups = new Map();
  for (const rule of rules) {
    const endHost = rule.source.indexOf('/', 8);
    const host = rule.source.slice(8, endHost);
    const uri = rule.source.slice(endHost);
    const question = uri.indexOf('?');
    const pathname = question < 0 ? uri : uri.slice(0, question);
    const query = question < 0 ? null : uri.slice(question + 1);
    if (!groups.has(host)) groups.set(host, new Map());
    const paths = groups.get(host);
    if (!paths.has(pathname)) paths.set(pathname, []);
    paths.get(pathname).push({ ...rule, pathname, query });
  }
  return groups;
}

function firebase(groups) {
  const hosting = [];
  for (const [host, paths] of groups) {
    const redirects = [];
    for (const rows of paths.values()) for (const row of rows) {
      if (row.query !== null) throw new TypeError('Firebase Hosting only matches paths: query-specific URL requires Apache/Nginx export.');
      redirects.push({ regex: `^${regexLiteral(decodedPath(row.pathname))}$`, destination: `${TARGET}${decodedPath(row.destination)}`, type: 301 });
    }
    hosting.push({ target: `legacy-${host.replaceAll('.', '-')}`, redirects });
  }
  return { hosting };
}

function wordpress(groups) {
  const lines = ['# Apache 2.4 .htaccess; place BEFORE WordPress BEGIN/END block.', '# Static targets only. Incoming queries are discarded; no user data is interpolated.', 'RewriteEngine On'];
  for (const [host, paths] of groups) for (const rows of paths.values()) {
    // Specific queries precede a path-wide mapping, regardless of input order.
    for (const hasQuery of [true, false]) for (const row of rows) {
      if ((row.query !== null) !== hasQuery) continue;
      const hostPattern = aliases(host).map(regexLiteral).join('|');
      lines.push(`RewriteCond %{HTTP_HOST} ^(?:${hostPattern})$ [NC]`);
      lines.push(`RewriteCond %{REQUEST_URI} ^${regexLiteral(decodedPath(row.pathname))}$`);
      if (hasQuery) lines.push(`RewriteCond %{QUERY_STRING} ^${regexLiteral(row.query)}$`);
      lines.push(`RewriteRule ^ ${TARGET}${row.destination} [R=301,END,NE,QSD]`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function nginx(groups) {
  const lines = ['# HTTP historical hosts. Merge locations into existing HTTPS servers with valid certificates.', '# Exact locations are case-sensitive. Static, validated destinations discard incoming queries.'];
  for (const [host, paths] of groups) {
    lines.push('server {', '    listen 80;', `    server_name ${aliases(host).join(' ')};`);
    for (const [pathname, rows] of paths) {
      lines.push(`    location = "${decodedPath(pathname)}" {`);
      for (const row of rows) if (row.query !== null) {
        lines.push(`        if ($args = "${row.query}") { return 301 ${TARGET}${row.destination}; }`);
      }
      const fallback = rows.find(row => row.query === null);
      lines.push(fallback ? `        return 301 ${TARGET}${fallback.destination};` : '        return 404;');
      lines.push('    }');
    }
    lines.push('}');
  }
  return `${lines.join('\n')}\n`;
}

/** Compiler includes complete verification and emission. Inventories stay in
 * supplied order (deterministic, O(n)); callers control the chosen corpus order.
 * Firebase outputs require independently bound targets per historical host.
 * Blogspot-hosted domains cannot be bound to Firebase/Nginx by this program.
 */
export function compilaMapaRedireccions301(input, { format = 'all' } = {}) {
  if (!['all', 'firebase', 'wordpress', 'nginx'].includes(format)) throw new TypeError('Format invàlid.');
  const result = verificaMapaRedireccions301(input);
  if (!result.valid) throw new TypeError(`Mapa 301 invàlid: ${result.errors[0].code} (${result.errors[0].index ?? '-'})`);
  const rules = input.redireccions.map(rule => ({ source: normalitzaOrigen301(rule.source), destination: normalitzaDesti301(rule.destination), status: 301 }));
  const groups = groupRules(rules);
  const compiled = {
    schema: 'sdp.redirect301.v1',
    redireccions: rules,
    hostBindings: [...groups.keys()].map(host => ({ host, aliases: aliases(host), firebaseTarget: `legacy-${host.replaceAll('.', '-')}`, requiresHostControl: true,
      blogspotProviderManaged: host === HOSTS[2] })),
    limits: ['Local content inventory verifies destinations; no HTTP response or deployment is certified.', 'Firebase targets must be bound per historical host; never merge these rules into socdepoble.org hosting.', 'Blogspot provider control is required; exports do not enable server configuration on blogspot.com.', 'Firebase preserves incoming queries; exact query matching/discarding requires Apache/Nginx.'],
  };
  if (format === 'all' || format === 'firebase') compiled.firebase = firebase(groups);
  if (format === 'all' || format === 'wordpress') compiled.wordpress = wordpress(groups);
  if (format === 'all' || format === 'nginx') compiled.nginx = nginx(groups);
  return compiled;
}

/** Import already reconciled articles: explicitly mapped, never slug guessing. */
export function importaInventariHistoric301(articles, destinsDisponibles, options) {
  if (!Array.isArray(articles) || articles.length > MAX_ROWS) throw new TypeError('Corpus d’articles invàlid.');
  const redireccions = articles.map(article => ({ source: article?.linkOriginal, destination: article?.rutaDestiCanonica, status: 301 }));
  return compilaMapaRedireccions301({ redireccions, destinsDisponibles }, options);
}

/** Explicit acceptance gate. Timings include every raw field check and
 * destination-index construction (general mode). Fixture construction is outside
 * verification timing and is reported as such. No cache or trusted prevalidation.
 * Ordered and general cases are separate; passing one never certifies the other.
 */
export function benchmark301({ shape = 'general', count = 100000, samples = 9 } = {}) {
  if (!['ordered', 'general', 'general-shuffled'].includes(shape) || !Number.isInteger(count) || count < 1 || count > MAX_ROWS
    || !Number.isInteger(samples) || samples < 3 || samples > 31) throw new TypeError('Benchmark invàlid.');
  const input = { redireccions: [], destinsDisponibles: [] };
  const fixtureStarted = performance.now();
  let totalUriCharacters = 0;
  for (let i = 0; i < count; i++) {
    const id = String(i).padStart(6, '0');
    const destination = `/page/article-${id}`;
    const host = shape === 'ordered' ? 'socdepoble.net' : i % 2 ? 'socdepoble.net' : 'socdepoble.com';
    input.destinsDisponibles.push(destination);
    const query = shape === 'general-shuffled' && i % 4 === 0;
    const source = query ? `https://${host}/index.php?${['p', 'page_id', 'attachment_id'][i % 3]}=${i + 1}` : `https://${host}/article-${id}`;
    input.redireccions.push({ source, destination, status: 301 });
    totalUriCharacters += source.length + destination.length * 2;
  }
  // Fixed seeded Fisher-Yates. Preserve the old 'general' profile for honest
  // comparison; this additional profile actually permutes rows and inventory.
  if (shape === 'general-shuffled') {
    let seed = 3214;
    for (const list of [input.redireccions, input.destinsDisponibles]) for (let i = list.length - 1; i > 0; i--) {
      seed = Math.imul(seed, 1664525) + 1013904223 | 0;
      const j = (seed >>> 0) % (i + 1);
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  const fixtureMs = performance.now() - fixtureStarted;
  const timings = [];
  let mode;
  for (let i = 0; i < samples; i++) {
    const started = performance.now();
    const result = verificaMapaRedireccions301(input);
    timings.push(performance.now() - started);
    if (!result.valid || result.count !== count) throw new Error('Fixture benchmark rebutjada.');
    mode = result.mode;
  }
  const medianMs = [...timings].sort((a, b) => a - b)[Math.floor(samples / 2)];
  return { schema: 'sdp.redirect301.benchmark.v1', shape, mode, urls: count, uniqueDestinations: count,
    fixtureMs, totalUriCharacters, samplesMs: timings, medianMs, minimumMs: Math.min(...timings), maximumMs: Math.max(...timings),
    targetMs: 25, targetMet: medianMs < 25,
    workload: { shuffledRows: shape === 'general-shuffled', shuffledInventory: shape === 'general-shuffled', queryRows: shape === 'general-shuffled' ? Math.ceil(count / 4) : 0, seed: shape === 'general-shuffled' ? 3214 : null },
    timingIncludes: 'every raw URI/schema check, duplicate detection and fresh destination-index construction; no caches',
    limits: 'Ordered bijective ASCII timing does not certify arbitrary unordered, Unicode or many-to-one input.' };
}

export function main(args = process.argv.slice(2), io = process) {
  if (args[0] === '--benchmark') {
    if (args.length > 2) throw new TypeError('Ús: --benchmark [ordered|general|general-shuffled]');
    const report = benchmark301({ shape: args[1] ?? 'general' });
    io.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report.targetMet ? 0 : 1;
  }

  if (args.length !== 1 && args.length !== 3 || !args[0] || args[0].startsWith('-')
    || args.length === 3 && args[1] !== '--format') throw new TypeError('Ús: mapa-redireccions-301.mjs input.json [--format all|firebase|wordpress|nginx]');
  const file = fs.openSync(args[0], fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  let bytes;
  try {
    const stat = fs.fstatSync(file);
    if (!stat.isFile() || stat.size > MAX_FILE) throw new TypeError('Inventari no regular o superior a 64 MiB.');
    bytes = fs.readFileSync(file);
    if (bytes.byteLength > MAX_FILE) throw new TypeError('Inventari superior a 64 MiB.');
  } finally { fs.closeSync(file); }
  const input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  const output = compilaMapaRedireccions301(input, { format: args[2] ?? 'all' });
  io.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  return 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { process.exitCode = main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
