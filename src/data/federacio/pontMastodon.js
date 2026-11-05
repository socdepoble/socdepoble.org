/** Pont públic portable. HTTPS + WebFinger + autor; no prova criptogràfica.
 * Mai rep OAuth: l'eixida es delega a un transport autoritzat del servidor. */
import { CONTEXT_AS, PUBLIC, htmlDeText, textPla } from '../activitypub.js';
import { llevaEtiquetes, llevaScriptsIEstils } from '../../config/contentHelpers.js';
export const COMPTE_MASTODON = Object.freeze({ acct: 'depoble@mastodont.cat', origen: 'https://mastodont.cat', perfil: 'https://mastodont.cat/@depoble', actor: 'https://mastodont.cat/users/depoble', rss: 'https://mastodont.cat/@depoble.rss' });
export const LIMITS_MASTODON = Object.freeze({ resposta: 1048576, html: 65536, text: 10000, elements: 40, terminiMs: 10000 });
const segmentador=typeof Intl.Segmenter==='function'?new Intl.Segmenter('und',{granularity:'grapheme'}):null;
/** A code-point budget that never cuts an available extended grapheme cluster.
 * Invalid input Unicode is normalized to U+FFFD, never passed to PostgreSQL.
 * Older engines without Segmenter retain the Unicode-scalar-safe fallback. */
export function retallaTextFederat(v,n=10000){
  if(!Number.isSafeInteger(n)||n<0||n>65536)throw new TypeError('MASTODON_LIMIT_TEXT_INVALID');
  if(typeof v!=='string'||n===0)return'';
  const well=typeof v.toWellFormed==='function'?v.toWellFormed():v.replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g,'\ufffd');
  let output='',count=0;
  const pieces=segmentador?segmentador.segment(well):well;
  for(const part of pieces){const cluster=typeof part==='string'?part:part.segment;const size=[...cluster].length;if(count+size>n)break;output+=cluster;count+=size;}
  return output;
}
const txt = retallaTextFederat;
const falla = (code) => Object.assign(new Error(code), { code });
const idValid = (v) => typeof v === 'string' && /^[0-9]{1,30}$/.test(v);
const iso = (v) => { const t = typeof v === 'string' ? Date.parse(v) : NaN; return Number.isFinite(t) ? new Date(t).toISOString() : null; };
function desescapa(v) {
  const ents = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return txt(v, 65536).replace(/&(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z]{2,6});/gi, (s, nom) => {
    const k = nom.toLowerCase(); if (Object.hasOwn(ents, k)) return ents[k];
    const n = k.startsWith('#x') ? parseInt(k.slice(2), 16) : k.startsWith('#') ? Number(k.slice(1)) : NaN;
    return Number.isInteger(n) && n > 31 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : s;
  });
}
/** Text pla, per a renderitzar com a text; mai innerHTML. */
export function textMastodon(v) { return txt(textPla(desescapa(llevaEtiquetes(llevaScriptsIEstils(txt(v, 65536)))))); }
function urlHttps(v, origen = null) {
  if (typeof v !== 'string' || v.length > 2048 || !v.startsWith('https://')) return null;
  try {
    const u = new URL(v); const h = u.hostname;
    if (u.protocol !== 'https:' || u.username || u.password || u.port || u.hash || !h.includes('.') || h.endsWith('.') || /^[\d.]+$/.test(h) || h.includes(':')
      || ['localhost', 'local', 'internal', 'home.arpa', 'test', 'invalid'].some((s) => h === s || h.endsWith(`.${s}`))) return null;
    return !origen || u.origin === origen ? u.href : null;
  } catch { return null; }
}
function urlEstat(v) {
  const s = urlHttps(v, COMPTE_MASTODON.origen); if (!s) return null; const u = new URL(s);
  return /^\/(?:@depoble|users\/depoble\/statuses)\/[0-9]{1,30}$/.test(u.pathname) && !u.search ? s : null;
}
function atributs(tag) {
  const attrs = Object.create(null); let p = 0;
  while (p < tag.length && !/\s/.test(tag[p])) p++;
  while (p < tag.length) {
    while (p < tag.length && /\s/.test(tag[p])) p++;
    const i = p; while (p < tag.length && !/[\s=]/.test(tag[p])) p++;
    const k = tag.slice(i, p).toLowerCase(); while (p < tag.length && /\s/.test(tag[p])) p++;
    if (tag[p] !== '=') { if (p === i) p++; continue; } p++; while (p < tag.length && /\s/.test(tag[p])) p++;
    const q = ['"', "'"].includes(tag[p]) ? tag[p++] : null; const des = p;
    while (p < tag.length && (q ? tag[p] !== q : !/\s/.test(tag[p]))) p++;
    if (!Object.hasOwn(attrs, k)) attrs[k] = desescapa(tag.slice(des, p)); if (q && p < tag.length) p++;
  }
  return attrs;
}
function tagsHtml(v, nom) {
  const s = txt(v, 65536); const out = []; let p = 0;
  while ((p = s.indexOf('<', p)) !== -1 && out.length < 32) {
    const fi = s.indexOf('>', p + 1); if (fi === -1) break;
    const tag = s.slice(p + 1, fi); p = fi + 1;
    if (tag.slice(0, nom.length).toLowerCase() === nom && /\s/.test(tag[nom.length] ?? '')) out.push(atributs(tag));
  }
  return out;
}
function autor(compte, id) { return compte && compte.id === id && compte.username === 'depoble' && ['depoble', COMPTE_MASTODON.acct].includes(compte.acct) && compte.url === COMPTE_MASTODON.perfil; }
/** Projecció explícita sense HTML ni dades personals/atributs d'autoritat. */
export function normalitzaEstatMastodon(s, { compteId } = {}) {
  if ((!idValid(compteId) && !['rss', 'ap'].includes(compteId)) || !s || !idValid(s.id) || s.visibility !== 'public' || s.reblog != null || !autor(s.account, compteId) || !iso(s.created_at)) return null;
  const uri = urlEstat(s.uri); const url = urlEstat(s.url);
  if (uri !== `${COMPTE_MASTODON.actor}/statuses/${s.id}` || url !== `${COMPTE_MASTODON.perfil}/${s.id}`) return null;
  const text = textMastodon(s.content);
  const images = (Array.isArray(s.media_attachments) ? s.media_attachments : []).slice(0, 8).filter((a) => a?.type === 'image' && urlHttps(a.url)).map((a) => ({ url: urlHttps(a.url), alt: textMastodon(a.description) }));
  const links = [...new Set(tagsHtml(llevaScriptsIEstils(txt(s.content, 65536)), 'a').map((a) => urlHttps(a.href)).filter(Boolean))]; const card = urlHttps(s.card?.url); if (card && !links.includes(card)) links.push(card);
  return { id: `mastodon:${s.id}`, uri, url, source_url: url, title: '', body: text, text, summary: txt(text,220), created_at: iso(s.created_at), author: 'Sóc de Poble', author_handle: COMPTE_MASTODON.acct,
    visibility: 'public', source: 'mastodon', images, image_url: images[0]?.url ?? null, links, sensitive: s.sensitive === true, content_warning: textMastodon(s.spoiler_text),
    tags: (Array.isArray(s.tags) ? s.tags : []).slice(0, 32).map((t) => txt(t?.name, 64)).filter((t) => /^[\p{L}\p{N}_]+$/u.test(t)),
    federacio: { origen: 'mastodon', compte: COMPTE_MASTODON.acct, uri, verificacio: 'https-webfinger-autor' } };
}
/** El límit també acaba si un transport injectat ignora AbortSignal. */
export async function executaAmbTerminiMastodon(feina, { signal, terminiMs = LIMITS_MASTODON.terminiMs } = {}) {
  if (signal?.aborted) throw falla('MASTODON_AVORTAT');
  if (typeof feina !== 'function' || !Number.isInteger(terminiMs) || terminiMs < 1 || terminiMs > LIMITS_MASTODON.terminiMs) throw falla('MASTODON_TERMINI_INVALID');
  const c = new AbortController(); let timeout; let rebutja;
  const limit = new Promise((_, reject) => { rebutja = reject; });
  const atura = (code) => { c.abort(); rebutja(falla(code)); };
  const abort = () => atura('MASTODON_AVORTAT');
  signal?.addEventListener('abort', abort, { once: true });
  timeout = setTimeout(() => atura('MASTODON_TERMINI'), terminiMs);
  try {
    const treball = Promise.resolve().then(() => {
      if (c.signal.aborted || signal?.aborted) throw falla('MASTODON_AVORTAT');
      return feina(c.signal);
    });
    return await Promise.race([treball, limit]);
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
/** Fetch fixat a mastodont.cat, sense credencials, redireccions ni cos il·limitat. */
export async function lligRespostaMastodon(url, { fetchImpl = globalThis.fetch, signal, tipus = 'json', terminiMs } = {}) {
  if (typeof fetchImpl !== 'function' || !urlHttps(url, COMPTE_MASTODON.origen)) throw falla('MASTODON_URL_INVALIDA');
  return executaAmbTerminiMastodon(async (senyal) => {
    const res = await fetchImpl(url, { method: 'GET', redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { Accept: tipus === 'rss' ? 'application/rss+xml, application/xml;q=0.9' : 'application/activity+json, application/json;q=0.9' }, signal: senyal });
    if (!res?.ok) throw falla(`MASTODON_HTTP_${Number(res?.status) || 0}`);
    if (res.url && res.url !== url) throw falla('MASTODON_REDIRECCIO');
    const ct = (res.headers?.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!(tipus === 'rss' ? ['application/rss+xml', 'application/xml', 'text/xml'] : ['application/json', 'application/activity+json', 'application/jrd+json', 'application/ld+json']).includes(ct)) throw falla('MASTODON_TIPUS_INVALID');
    if (Number(res.headers?.get('content-length')) > LIMITS_MASTODON.resposta || !res.body?.getReader) throw falla('MASTODON_RESPOSTA_INVALIDA');
    const r = res.body.getReader(); const chunks = []; let n = 0;
    const cancela = () => { try { Promise.resolve(r.cancel()).catch(() => {}); } catch { /* transport ja tancat */ } };
    senyal.addEventListener('abort', cancela, { once: true }); if (senyal.aborted) cancela();
    try { while (true) { const { done, value } = await r.read(); if (done) break; n += value.byteLength; if (n > LIMITS_MASTODON.resposta) { cancela(); throw falla('MASTODON_RESPOSTA_GRAN'); } chunks.push(value); } }
    finally { senyal.removeEventListener('abort', cancela); r.releaseLock(); }
    const bytes = new Uint8Array(n); let p = 0; for (const chunk of chunks) { bytes.set(chunk, p); p += chunk.byteLength; }
    try { const s = new TextDecoder('utf-8', { fatal: true }).decode(bytes); return tipus === 'rss' ? s : JSON.parse(s); }
    catch { throw falla('MASTODON_JSON_INVALID'); }
  }, { signal, terminiMs });
}
async function verificaCompte(opts) {
  const wf = await lligRespostaMastodon(`${COMPTE_MASTODON.origen}/.well-known/webfinger?resource=acct%3Adepoble%40mastodont.cat`, opts);
  if (wf?.subject !== `acct:${COMPTE_MASTODON.acct}` || !Array.isArray(wf.links) || !wf.links.some((l) => l?.rel === 'self' && ['application/activity+json', 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'].includes(l.type) && l.href === COMPTE_MASTODON.actor)) throw falla('MASTODON_WEBFINGER_NO_VERIFICAT');
}
function elementXml(xml, nom) {
  const o = `<${nom}>`; const p = xml.indexOf(o); if (p === -1) return ''; const fi = xml.indexOf(`</${nom}>`, p + o.length); if (fi === -1) return '';
  const v = xml.slice(p + o.length, fi).trim(); return v.startsWith('<![CDATA[') && v.endsWith(']]>') ? v.slice(9, -3) : desescapa(v);
}
export function normalitzaRssMastodon(xml) {
  if (typeof xml !== 'string' || xml.length > LIMITS_MASTODON.resposta || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw falla('MASTODON_RSS_INVALID');
  const primer = xml.indexOf('<item>'); if (elementXml(primer === -1 ? xml : xml.slice(0, primer), 'link') !== COMPTE_MASTODON.perfil) throw falla('MASTODON_RSS_AUTOR_INVALID');
  const posts = []; const vistos = new Set(); let p = 0; let visitats = 0;
  while ((p = xml.indexOf('<item>', p)) !== -1 && visitats++ < LIMITS_MASTODON.elements) {
    const fi = xml.indexOf('</item>', p); if (fi === -1) throw falla('MASTODON_RSS_INVALID'); const item = xml.slice(p + 6, fi); p = fi + 7;
    const url = urlEstat(elementXml(item, 'link')); const data = iso(elementXml(item, 'pubDate')); if (!url || !data) continue;
    const id = new URL(url).pathname.split('/').at(-1); const uri = `${COMPTE_MASTODON.actor}/statuses/${id}`; if (vistos.has(uri)) continue; vistos.add(uri);
    const desc = elementXml(item, 'description');
    const media = tagsHtml(item, 'media:content').map((a) => ({ type: a.type?.startsWith('image/') ? 'image' : '', url: a.url, description: '' }));
    const post = normalitzaEstatMastodon({ id, url, uri, visibility: 'public', created_at: data, content: desc, media_attachments: media,
      account: { id: 'rss', username: 'depoble', acct: 'depoble', url: COMPTE_MASTODON.perfil } }, { compteId: 'rss' });
    if (post) { post.federacio.verificacio = 'https-webfinger-rss'; posts.push(post); }
  }
  return posts;
}
/** API, RSS o primera pàgina AP. Retorna DTOs públics deduplicats per URI. */
export async function lligPublicacionsMastodon({ fetchImpl = globalThis.fetch, signal, limit = 20, format = 'api' } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 40 || !['api', 'rss', 'activitypub'].includes(format)) throw falla('MASTODON_OPCIONS_INVALIDES');
  const opts = { fetchImpl, signal }; await verificaCompte(opts); let posts = [];
  if (format === 'rss') posts = normalitzaRssMastodon(await lligRespostaMastodon(COMPTE_MASTODON.rss, { ...opts, tipus: 'rss' }));
  else if (format === 'api') {
    const compte = await lligRespostaMastodon(`${COMPTE_MASTODON.origen}/api/v1/accounts/lookup?acct=depoble`, opts);
    if (!idValid(compte?.id) || !autor(compte, compte.id)) throw falla('MASTODON_COMPTE_NO_VERIFICAT');
    const estats = await lligRespostaMastodon(`${COMPTE_MASTODON.origen}/api/v1/accounts/${compte.id}/statuses?limit=${limit}&exclude_reblogs=true`, opts);
    if (!Array.isArray(estats) || estats.length > 40) throw falla('MASTODON_ESTATS_INVALIDS'); posts = estats.map((s) => normalitzaEstatMastodon(s, { compteId: compte.id })).filter(Boolean);
  } else {
    const actor = await lligRespostaMastodon(COMPTE_MASTODON.actor, opts); const outbox = `${COMPTE_MASTODON.actor}/outbox`;
    if (actor?.id !== COMPTE_MASTODON.actor || actor.preferredUsername !== 'depoble' || actor.outbox !== outbox) throw falla('MASTODON_ACTOR_NO_VERIFICAT');
    let col = await lligRespostaMastodon(outbox, opts); if (col?.first === `${outbox}?page=true`) col = await lligRespostaMastodon(col.first, opts);
    if (!Array.isArray(col?.orderedItems) || col.orderedItems.length > 40) throw falla('MASTODON_OUTBOX_INVALIDA');
    posts = col.orderedItems.map((a) => {
      const o = a?.object;
      if (a?.type !== 'Create' || a.actor !== COMPTE_MASTODON.actor || o?.type !== 'Note' || o.attributedTo !== COMPTE_MASTODON.actor || ![].concat(o.to ?? [], o.cc ?? []).includes(PUBLIC) || !urlEstat(o.id)) return null;
      const id = new URL(o.id).pathname.split('/').at(-1);
      return normalitzaEstatMastodon({ id, uri: o.id, url: o.url, visibility: 'public', created_at: o.published, content: o.content, spoiler_text: o.summary, sensitive: o.sensitive,
        media_attachments: (Array.isArray(o.attachment) ? o.attachment : []).slice(0, 8).map((m) => ({ type: typeof m?.mediaType === 'string' && m.mediaType.startsWith('image/') ? 'image' : '', url: m?.url, description: m?.name })),
        account: { id: 'ap', username: 'depoble', acct: 'depoble', url: COMPTE_MASTODON.perfil } }, { compteId: 'ap' });
    }).filter(Boolean);
  }
  const vistos = new Set(); posts = posts.filter((p) => { if (vistos.has(p.uri)) return false; vistos.add(p.uri); return true; }).slice(0, limit);
  return { compte: COMPTE_MASTODON.acct, actor: COMPTE_MASTODON.actor, format, verificacio: 'https-webfinger-autor', publicacions: posts };
}
export function formataPublicacioMastodon(item, { maxim = 500 } = {}) {
  if (!item || typeof item !== 'object' || !['public', 'publica'].includes(item.visibility ?? item.visibilitat) || item.federacio?.origen === 'mastodon' || item.source === 'mastodon') throw falla('MASTODON_PUBLICACIO_NO_PUBLICA');
  const url = urlHttps(item.canonicalUrl ?? item.urlCanonica ?? item.url);
  if (!url || !['https://socdepoble.org', 'https://socdepoble.cat'].includes(new URL(url).origin) || new URL(url).search
    || !/^\/(?:mur|mercat|events|vehicle|treball|habitatge|page)\/[a-zA-Z0-9_-]{1,128}$/.test(new URL(url).pathname)) throw falla('MASTODON_CANONICA_INVALIDA');
  if (!Number.isInteger(maxim) || maxim < 100 || maxim > 500) throw falla('MASTODON_LIMIT_INVALID');
  const titol = textMastodon(item.title ?? item.titol ?? item.nom); const resum = textMastodon(item.summary ?? item.resum ?? item.body ?? item.text);
  const tags = (Array.isArray(item.tags) ? item.tags : []).slice(0, 8).map((t) => txt(t, 32).replace(/^#/, '')).filter((t) => /^[\p{L}\p{N}_]+$/u.test(t)).map((t) => `#${t}`);
  const cua = `${tags.length ? `\n\n${tags.join(' ')}` : ''}\n\n${url}`; const contingut = [titol, resum].filter(Boolean).join('\n\n');
  if (!contingut || [...cua].length >= maxim) throw falla('MASTODON_TEXT_INVALID'); const espai = maxim - [...cua].length;
  return { status: [...contingut].length > espai ? `${txt(contingut,espai-1)}…${cua}` : `${contingut}${cua}`, visibility: 'public', language: 'ca', canonicalUrl: url };
}
export async function publicaAMastodon(item, opts = {}) {
  if ('token' in opts || 'accessToken' in opts || typeof opts.publicaServidor !== 'function') throw falla('MASTODON_SERVIDOR_REQUERIT');
  formataPublicacioMastodon(item); return opts.publicaServidor(item);
}
export function creaActivitatMastodon(item, { actor = 'https://socdepoble.cat/ap/actors/socdepoble', publicat, id } = {}) {
  const post = formataPublicacioMastodon(item); const data = iso(publicat); const oid = urlHttps(id);
  if (actor !== 'https://socdepoble.cat/ap/actors/socdepoble' || !data || !oid || new URL(oid).origin !== 'https://socdepoble.cat' || !new URL(oid).pathname.startsWith('/ap/objects/')) throw falla('MASTODON_ACTIVITAT_INVALIDA');
  const followers = 'https://socdepoble.cat/ap/followers/socdepoble';
  return { '@context': CONTEXT_AS, id: `${oid}#create`, type: 'Create', actor, published: data, to: [PUBLIC], cc: [followers],
    object: { id: oid, type: 'Note', attributedTo: actor, published: data, content: htmlDeText(post.status), url: post.canonicalUrl, to: [PUBLIC], cc: [followers] } };
}
