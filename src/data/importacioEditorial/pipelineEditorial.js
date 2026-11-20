import { LIMITS_EDITORIALS, textAcotat, parsejaXmlEditorialSegur, fillsXml, textXml } from './xmlEditorialSegur.js';
import { sanejaHtmlEditorial, textEditorialNet, urlEditorialSegura } from './htmlEditorialSegur.js';
const ATOM = 'http://www.w3.org/2005/Atom', DC = 'http://purl.org/dc/elements/1.1/', CONTENT = 'http://purl.org/rss/1.0/modules/content/';
const WP = new Set(['http://wordpress.org/export/1.0/', 'http://wordpress.org/export/1.1/', 'http://wordpress.org/export/1.2/']);
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const typedArrayBytes = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'byteLength').get;
const typedArrayName = Object.getOwnPropertyDescriptor(typedArrayPrototype, Symbol.toStringTag).get;
const record = o => o !== null && typeof o === 'object' && !Array.isArray(o) && [Object.prototype, null].includes(Object.getPrototypeOf(o));
function string(value, optional = false) {
  if (value === undefined && optional) return '';
  if (typeof value !== 'string' || value.length > LIMITS_EDITORIALS.articleBytes) throw new TypeError('Camp editorial de text invàlid.');
  return value;
}
function list(value, mapper = v => string(v)) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 10000) throw new TypeError('Llista editorial invàlida.');
  return value.map(mapper);
}
const strings = values => [...new Set(values.filter(Boolean))].sort(cmp);
const first = (node, name, uri) => {
  const children = fillsXml(node, name, uri);
  if (children.length > 1) throw new TypeError('Camp escalar XML ambigu.');
  return children[0];
};
const content = (node, name, uri) => textXml(first(node, name, uri)).trim();
const wpText = (node, name) => {
  const fields = node.parts.filter(p => typeof p !== 'string' && p.local === name && WP.has(p.uri));
  if (fields.length > 1) throw new TypeError('Camp WXR ambigu.');
  return textXml(fields[0]).trim();
};
const rendered = value => typeof value === 'string' ? value : record(value) ? string(value.rendered) : string(value);
const bloggerText = value => typeof value === 'string' ? value : record(value) ? string(value.$t) : string(value, true);
function idText(value, prefix) {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Number.isSafeInteger(value) && value >= 0) return `${prefix}:${value}`;
  throw new TypeError('Identificador editorial invàlid.');
}
export function origenEditorial(value) {
  if (typeof value !== 'string' || value.length > 2048 || !/^https?:\/\//.test(value) || /[\s\\#\u0000-\u001f\u007f]/u.test(value)) throw new TypeError('Origen editorial invàlid.');
  const url = new URL(value);
  const host = url.hostname.startsWith('www.') ? url.hostname.slice(4) : url.hostname;
  if (!['socdepoble.net', 'socdepoble.com', 'elrentonar.blogspot.com'].includes(host) || url.username || url.password || url.port || url.hostname === 'www.elrentonar.blogspot.com') throw new TypeError('Domini editorial no autoritzat.');
  const slash = value.indexOf('/', value.indexOf('://') + 3), rawPath = slash === -1 ? '/' : value.slice(slash).split('?')[0];
  let decoded;
  try { decoded = decodeURIComponent(rawPath); } catch { throw new TypeError('Ruta editorial invàlida.'); }
  if (!/^\/[\p{L}\p{M}\p{N}._~/-]*$/u.test(decoded) || /\/\.{1,2}(?:\/|$)|\/\//.test(decoded) || decoded !== decoded.normalize('NFKC') || encodeURI(decoded) !== rawPath || url.pathname !== rawPath) throw new TypeError('Ruta editorial no canònica.');
  if (host === 'elrentonar.blogspot.com') {
    if (url.search && url.search !== '?m=1' || rawPath !== '/' && !/^\/(?:[0-9]{4}\/(?:0[1-9]|1[0-2])\/[^/]+|p\/[^/]+)\.html$/.test(rawPath)) throw new TypeError('URL Blogger no canònica.');
    url.search = '';
  } else if (url.search && !/^\?(?:p|page_id|attachment_id)=[1-9][0-9]{0,18}$/.test(url.search)) throw new TypeError('Query WordPress no canònica.');
  url.protocol = 'https:'; url.hostname = host;
  return url.href;
}
function dateUtc(value, gmt = false) {
  if (!value || value === '0000-00-00 00:00:00') return null;
  const raw = gmt ? value.replace(' ', 'T') + (/Z$|[+-][0-9]{2}:[0-9]{2}$/.test(value) ? '' : 'Z') : value;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(raw);
  if (!match) {
    if (gmt) throw new TypeError('Data GMT editorial invàlida.');
    return null; // original local wall time is retained, never guessed.
  }
  const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]), h = Number(match[4]), min = Number(match[5]), sec = Number(match[6]);
  const days = [31, y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (m < 1 || m > 12 || d < 1 || d > days[m - 1] || h > 23 || min > 59 || sec > 59 || match[7] !== 'Z' && (Number(match[7].slice(1, 3)) > 23 || Number(match[7].slice(4)) > 59)) throw new TypeError('Data editorial impossible.');
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) throw new TypeError('Data editorial invàlida.');
  return new Date(ms).toISOString();
}
function fromWxr(input) {
  const root = parsejaXmlEditorialSegur(input);
  if (root.local !== 'rss' || root.uri) throw new TypeError('Cal un export WordPress WXR RSS.');
  const channels = fillsXml(root, 'channel', '');
  if (channels.length !== 1) throw new TypeError('Channel WXR ambigu.');
  return fillsXml(channels[0], 'item', '').map(item => {
    const type = wpText(item, 'post_type'), status = wpText(item, 'status');
    const categories = fillsXml(item, 'category', '');
    return { kind: type === 'attachment' ? 'attachment' : status && status !== 'publish' ? 'skip' : type && !['post', 'page'].includes(type) ? 'skip' : 'article', sourceId: wpText(item, 'post_id'), linkOriginal: content(item, 'link', ''), title: content(item, 'title', ''), html: content(item, 'encoded', CONTENT), dateOriginal: content(item, 'pubDate', '') || wpText(item, 'post_date'), dateGmt: wpText(item, 'post_date_gmt'), updatedOriginal: wpText(item, 'post_modified_gmt'), updatedGmt: true,
      autors: fillsXml(item, 'creator', DC).map(textXml), categories: categories.filter(c => c.attrs.domain === 'category').map(textXml), etiquetes: categories.filter(c => c.attrs.domain === 'post_tag').map(textXml), attachment: wpText(item, 'attachment_url') };
  });
}
function fromAtom(input) {
  const root = parsejaXmlEditorialSegur(input);
  if (root.local !== 'feed' || root.uri !== ATOM) throw new TypeError('Cal un feed Atom Blogger.');
  return fillsXml(root, 'entry', ATOM).map(item => {
    const cats = fillsXml(item, 'category', ATOM);
    const kinds = cats.filter(c => c.attrs.scheme === 'http://schemas.google.com/g/2005#kind');
    if (kinds.some(c => !['http://schemas.google.com/blogger/2008/kind#post', 'http://schemas.google.com/blogger/2008/kind#page'].includes(c.attrs.term))) return { kind: 'skip' };
    const control = item.parts.find(p => typeof p !== 'string' && p.local === 'control' && ['http://purl.org/atom/app#', 'http://www.w3.org/2007/app'].includes(p.uri));
    if (control && content(control, 'draft', control.uri) === 'yes') return { kind: 'skip' };
    const links = fillsXml(item, 'link', ATOM).filter(link => link.attrs.rel === 'alternate');
    if (links.length !== 1) throw new TypeError('Enllaç alternatiu Blogger absent o ambigu.');
    const body = first(item, 'content', ATOM), title = first(item, 'title', ATOM);
    return { kind: kinds.some(c => !['http://schemas.google.com/blogger/2008/kind#post', 'http://schemas.google.com/blogger/2008/kind#page'].includes(c.attrs.term)) ? 'skip' : 'article', sourceId: content(item, 'id', ATOM), linkOriginal: links[0].attrs.href, title: title?.attrs.type === 'html' ? textEditorialNet(textXml(title)) : textXml(title), html: body?.attrs.type === 'text' ? escapePlain(textXml(body)) : body?.attrs.type === 'xhtml' ? xmlAsHtml(body) : textXml(body), dateOriginal: content(item, 'published', ATOM), updatedOriginal: content(item, 'updated', ATOM),
      autors: fillsXml(item, 'author', ATOM).map(a => content(a, 'name', ATOM)), categories: cats.filter(c => !c.attrs.scheme).map(c => c.attrs.term || ''), etiquetes: [] };
  });
}
function xmlAsHtml(node) {
  const out = [];
  const walk = child => {
    if (typeof child === 'string') { out.push(escapePlain(child)); return; }
    out.push(`<${child.local}`);
    for (const [key, value] of Object.entries(child.attrs)) if (!key.includes(':') && key !== 'xmlns') out.push(` ${key}="${escapePlain(value).replace(/"/g, '&quot;')}"`);
    out.push('>');
    for (const p of child.parts) walk(p);
    out.push(`</${child.local}>`);
  };
  for (const child of node.parts) walk(child);
  return out.join('');
}
function escapePlain(value) { return value.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }
function fromWpJson(input) {
  const rows = Array.isArray(input) ? input : record(input) && Array.isArray(input.posts) ? input.posts : null;
  if (!rows) throw new TypeError('JSON WordPress ha de ser un array REST o {posts:[]}.');
  return rows.map(item => {
    if (!record(item)) throw new TypeError('Post WordPress invàlid.');
    const embedded = item._embedded;
    const authors = record(embedded) && Array.isArray(embedded.author) ? embedded.author.map(a => record(a) ? string(a.name) : string(a)) : item.author !== undefined ? [idText(item.author, 'wp-author')] : [];
    return { kind: item.type === 'attachment' ? 'attachment' : item.status && item.status !== 'publish' ? 'skip' : 'article', sourceId: idText(item.id, 'wp'), title: rendered(item.title), html: rendered(item.content), linkOriginal: string(item.link), dateOriginal: string(item.date, true), dateGmt: string(item.date_gmt, true), updatedOriginal: string(item.modified_gmt, true), updatedGmt: true,
      autors: authors, categories: list(item.categories, v => idText(v, 'wp-category')), etiquetes: list(item.tags, v => idText(v, 'wp-tag')), attachment: string(item.source_url, true) };
  });
}
function fromBloggerJson(input) {
  if (!record(input)) throw new TypeError('Feed JSON Blogger invàlid.');
  const legacy = record(input.feed);
  const rows = legacy ? input.feed.entry : input.items;
  if (!Array.isArray(rows)) throw new TypeError('Cal feed.entry[] o items[] de Blogger.');
  return rows.map(item => {
    if (!record(item)) throw new TypeError('Entrada Blogger invàlida.');
    if (!legacy) return { kind: 'article', sourceId: idText(item.id, 'blogger'), title: string(item.title), html: string(item.content), linkOriginal: string(item.url), dateOriginal: string(item.published, true), updatedOriginal: string(item.updated, true), autors: record(item.author) ? [string(item.author.displayName)] : [], categories: list(item.labels), etiquetes: [] };
    const draft = item['app$control'];
    if (record(draft) && record(draft['app$draft']) && draft['app$draft'].$t === 'yes') return { kind: 'skip' };
    const rawCategories = list(item.category, c => { if (!record(c)) throw new TypeError('Categoria Blogger invàlida.'); return c; });
    if (rawCategories.some(c => c.scheme === 'http://schemas.google.com/g/2005#kind' && !['http://schemas.google.com/blogger/2008/kind#post', 'http://schemas.google.com/blogger/2008/kind#page'].includes(c.term))) return { kind: 'skip' };
    const links = list(item.link, l => { if (!record(l)) throw new TypeError('Link Blogger invàlid.'); return l; }).filter(l => l.rel === 'alternate');
    if (links.length !== 1) throw new TypeError('Enllaç alternatiu Blogger absent o ambigu.');
    const categories = list(item.category, c => { if (!record(c)) throw new TypeError('Categoria Blogger invàlida.'); return c; });
    return { kind: categories.some(c => c.scheme === 'http://schemas.google.com/g/2005#kind' && !['http://schemas.google.com/blogger/2008/kind#post', 'http://schemas.google.com/blogger/2008/kind#page'].includes(c.term)) ? 'skip' : 'article', sourceId: bloggerText(item.id), title: bloggerText(item.title), html: record(item.content) && item.content.type === 'text' ? escapePlain(bloggerText(item.content)) : bloggerText(item.content), linkOriginal: string(links[0].href), dateOriginal: bloggerText(item.published), updatedOriginal: bloggerText(item.updated),
      autors: list(item.author, a => { if (!record(a)) throw new TypeError('Autor Blogger invàlid.'); return bloggerText(a.name); }), categories: categories.filter(c => !c.scheme).map(c => string(c.term)), etiquetes: [] };
  });
}
export async function sha256Editorial(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
/** Only verified bytes produce attachment content digests. No network or URL hash. */
export async function verificaAdjuntsEditorials(input = []) {
  if (!Array.isArray(input) || input.length > LIMITS_EDITORIALS.articles) throw new TypeError('Adjunts invàlids.');
  const hashes = new Map(), seen = new Map();
  let total = 0;
  for (const item of input) {
    if (!record(item)) throw new TypeError('Adjunt invàlid.');
    const fields = Object.getOwnPropertyDescriptors(item);
    if (Object.keys(fields).length > 8 || ['bytes', 'url', 'sha256'].some(key => fields[key] && !Object.hasOwn(fields[key], 'value'))) throw new TypeError('Adjunts amb accessors prohibits.');
    const rawBytes = fields.bytes?.value, expectedHash = fields.sha256?.value;
    if (!ArrayBuffer.isView(rawBytes) || typedArrayName.call(rawBytes) !== 'Uint8Array') throw new TypeError('Calen bytes verificables de cada adjunt.');
    const byteLength = typedArrayBytes.call(rawBytes);
    if (byteLength > LIMITS_EDITORIALS.mediaBytes || (total += byteLength) > LIMITS_EDITORIALS.totalMediaBytes) throw new TypeError('Adjunts fora del pressupost de bytes.');
    const bytes = new Uint8Array(byteLength);
    Uint8Array.prototype.set.call(bytes, rawBytes); // internal slots; no attacker iterator/species.
    const url = urlEditorialSegura(fields.url?.value);
    if (!url) throw new TypeError('URL d’adjunt invàlida.');
    const sha256 = await sha256Editorial(bytes);
    if (expectedHash !== undefined && expectedHash !== sha256 || seen.has(url) && seen.get(url) !== sha256) throw new TypeError('Deriva del contingut d’un adjunt.');
    seen.set(url, sha256);
    if (!hashes.has(sha256)) hashes.set(sha256, { sha256, bytes: bytes.byteLength, fontsOriginals: [] });
    hashes.get(sha256).fontsOriginals.push(url);
  }
  return [...hashes.values()].map(a => ({ ...a, fontsOriginals: strings(a.fontsOriginals) })).sort((a, b) => cmp(a.sha256, b.sha256));
}
/** Offline review artifact. It never publishes, downloads, infers identity or
 * guesses destination slugs. Numeric CMS author/taxonomy IDs remain explicit. */
export async function importaEditorial(input, { format, adjunts = [] } = {}) {
  textAcotat(input);
  let raw;
  if (format === 'wordpress-wxr') raw = fromWxr(input);
  else if (format === 'blogger-atom') raw = fromAtom(input);
  else if (format === 'wordpress-json') raw = fromWpJson(JSON.parse(input));
  else if (format === 'blogger-json') raw = fromBloggerJson(JSON.parse(input));
  else throw new TypeError('Format editorial desconegut.');
  if (raw.length > LIMITS_EDITORIALS.articles) throw new TypeError('Massa articles.');
  const byHash = new Map(), bySource = new Map(), mediaUrls = new Set();
  let skipped = 0, duplicates = 0;
  for (const item of raw) {
    if (item.kind === 'skip') { skipped++; continue; }
    if (item.kind === 'attachment') {
      const url = urlEditorialSegura(item.attachment);
      if (!url) throw new TypeError('Adjunt WXR/JSON sense URL segura.');
      mediaUrls.add(url); continue;
    }
    const source = origenEditorial(item.linkOriginal);
    const title = textEditorialNet(string(item.title));
    if (!title) throw new TypeError('Article sense títol.');
    const clean = sanejaHtmlEditorial(string(item.html), { base: source });
    const publishDate = item.dateGmt ? dateUtc(item.dateGmt, true) : dateUtc(item.dateOriginal);
    const updated = dateUtc(item.updatedOriginal, item.updatedGmt);
    const autors = strings(item.autors.map(v => textEditorialNet(string(v)))), categories = strings(item.categories.map(v => textEditorialNet(string(v)))), etiquetes = strings(item.etiquetes.map(v => textEditorialNet(string(v))));
    for (const media of clean.mitjans) mediaUrls.add(media.url);
    const canonical = { title, subtitle: clean.subtitle, lead: clean.lead, htmlNet: clean.htmlNet, markdown: clean.markdown, publish_date: publishDate, updated_at: updated, autors, categories, etiquetes, mitjans: clean.mitjans };
    const sha256 = await sha256Editorial(JSON.stringify(canonical));
    if (bySource.has(source) && bySource.get(source) !== sha256) throw new TypeError('Una mateixa font té continguts divergents.');
    bySource.set(source, sha256);
    const origin = { url: source, sourceId: item.sourceId || '', dataPublicacioOriginal: item.dateOriginal || '', dataGmtOriginal: item.dateGmt || '', dataActualitzacioOriginal: item.updatedOriginal || '' };
    if (byHash.has(sha256)) {
      const existing = byHash.get(sha256); existing.fontsOriginals.push(source); existing.procedencia.push(origin); duplicates++; continue;
    }
    byHash.set(sha256, { schema: 'sdp.editorial.article.review.v1', id: `sha256:${sha256}`, sha256, ...canonical, description: clean.lead, entradilla: clean.lead, post_subtitle: clean.subtitle, estructura: clean.blocks, fontsOriginals: [source], procedencia: [origin], estat_revisio: 'pendent_admin', dataRequerixRevisio: publishDate === null });
  }
  const verified = await verificaAdjuntsEditorials(adjunts), verifiedUrls = new Set(verified.flatMap(a => a.fontsOriginals));
  const articles = [...byHash.values()].map(a => ({ ...a, fontsOriginals: strings(a.fontsOriginals), procedencia: [...new Map(a.procedencia.map(p => [JSON.stringify(p), p])).values()].sort((a, b) => cmp(a.url, b.url) || cmp(JSON.stringify(a), JSON.stringify(b))) })).sort((a, b) => cmp(a.sha256, b.sha256));
  const result = { schema: 'sdp.editorial.import.review.v1', format, articles, adjunts: verified, adjuntsPendents: [...mediaUrls].filter(url => !verifiedUrls.has(url)).sort(cmp), deduplicats: duplicates, omesos: skipped, limits: ['Preparació local pendent de revisió humana; no publica ni consulta xarxa.', 'SHA-256 acredita bytes i contingut, no autoria ni drets.', 'Les dates locals sense fus es conserven en procedència i requerixen revisió.', 'Mitjans sense bytes locals verificats continuen pendents; no es declaren deduplicats.'] };
  return { ...result, sha256: await sha256Editorial(JSON.stringify(result)) };
}
