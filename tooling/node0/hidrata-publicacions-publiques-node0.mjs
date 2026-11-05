#!/usr/bin/env node
/** Actual published public data → local Node0 projection. No Supabase writes.
 * Default: GET discovery and reviewable plan only. --apply requires a saved
 * plan + exact SHA, Node0 machine and dedicated local PostgreSQL operator.
 * No profiles/auth/users, owner attribution, credentials or private RPCs.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { validatePublicCredentials } from '../../src/config/publicCredentials.js';
import { htmlDeText } from '../../src/data/activitypub.js';
import { textMastodon, retallaTextFederat, executaAmbTerminiMastodon } from '../../src/data/federacio/pontMastodon.js';
import { uuidMunicipi, aplicaAmbPsql } from './hidrata-postgres-node0.mjs';
import { sqlText, sqlJson } from './postgres-node0.mjs';

const ORIGIN = 'https://socdepoble.org';
const SCHEMA = 'sdp.node0.public-hydration.v1';
const SLUG = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const KINDS = Object.freeze(['towns', 'agents', 'feedPosts', 'events', 'marketItems']);
const ENTITY_SLUGS = Object.freeze(['socdepoble', 'rentonar', 'olidelatorre']);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (code) => { throw new Error(code); };
const text = (v, n = 10000) => retallaTextFederat(textMastodon(typeof v === 'string' ? v : ''),n);
const realDay = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0,10) === v;
const iso = (v) => { if (typeof v !== 'string' || (/^\d{4}-\d{2}-\d{2}/.test(v) && !realDay(v.slice(0,10)))) return null; const n = Date.parse(v); return Number.isFinite(n) ? new Date(n).toISOString() : null; };
const scalar = (v) => typeof v === 'string' ? v : '';
function publicUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const u = new URL(value, ORIGIN);
    if (!value.startsWith('https://') && !value.startsWith('/')) return null;
    if (u.protocol !== 'https:' || u.username || u.password || u.port || u.hash || !u.hostname.includes('.') || u.hostname.endsWith('.')
      || /^[\d.]+$/.test(u.hostname) || u.hostname.includes(':') || ['localhost', 'local', 'internal', 'home.arpa', 'test', 'invalid'].some(s => u.hostname === s || u.hostname.endsWith(`.${s}`))) return null;
    // Published images/links only; credentials in a query are never imported.
    if ([...u.searchParams.keys()].some(k => /token|secret|password|signature|authorization|api.?key/i.test(k))) return null;
    return u.href;
  } catch { return null; }
}

export async function getPublic(url, { fetchImpl = globalThis.fetch, headers = {}, limit = 4 * 1024 * 1024, terminiMs } = {}) {
  const u = new URL(url);
  if (u.origin !== ORIGIN && !/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(u.origin)) fail('public_source_origin_rejected');
  return executaAmbTerminiMastodon(async signal => {
    let res;
    try { res = await fetchImpl(url, { method: 'GET', headers, redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer', signal }); }
    catch { fail('public_source_transport_failed'); }
    if (!res?.ok || (res.url && res.url !== u.href)) fail(`public_source_http_${Number(res?.status) || 0}`);
    if (!res.body?.getReader || Number(res.headers?.get('content-length')) > limit) fail('public_source_response_limit');
    const reader = res.body.getReader(); const chunks = []; let n = 0;
    const cancel = () => { try { Promise.resolve(reader.cancel()).catch(() => {}); } catch { /* closed transport */ } };
    signal.addEventListener('abort', cancel, { once: true }); if (signal.aborted) cancel();
    try { while (true) { const { done, value } = await reader.read(); if (done) break; n += value.byteLength; if (n > limit) { cancel(); fail('public_source_response_limit'); } chunks.push(value); } }
    finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
    const bytes = Buffer.concat(chunks.map(v => Buffer.from(v)), n);
    let body; try { body = new TextDecoder('utf8', { fatal: true }).decode(bytes); } catch { fail('public_source_invalid_utf8'); }
    return { body, proof: { url, method: 'GET', status: res.status, retrievedAt: new Date().toISOString(), serverDate: res.headers?.get('date') || null, sha256: sha(bytes), bytes: n, contentType: res.headers?.get('content-type') || null } };
  }, { terminiMs });
}

/** Read literals in the currently published entry; never evaluate remote JS. */
export async function descobreixConfiguracioPublica({ fetchImpl = globalThis.fetch } = {}) {
  const home = await getPublic(ORIGIN, { fetchImpl, limit: 65536 });
  if (!home.proof.contentType?.startsWith('text/html')) fail('public_config_html_required');
  const entry = /\bsrc="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/.exec(home.body)?.[1];
  if (!entry) fail('public_config_entry_absent');
  const script = await getPublic(`${ORIGIN}${entry}`, { fetchImpl, limit: 2 * 1024 * 1024 });
  if (!['text/javascript','application/javascript'].includes(script.proof.contentType?.split(';')[0])) fail('public_config_javascript_required');
  const urls = [...new Set(script.body.match(/https:\/\/[a-z0-9]{20}\.supabase\.co/g) || [])];
  const keys = [...new Set(script.body.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) || [])].filter(k => {
    try { const p = JSON.parse(Buffer.from(k.split('.')[1], 'base64url')); return p.role === 'anon' && urls.includes(`https://${p.ref}.supabase.co`); } catch { return false; }
  });
  const tenants = [...new Set([...script.body.matchAll(/tenantId:"([a-f0-9-]{36})"/g)].map(m => m[1]))];
  if (urls.length !== 1 || keys.length !== 1 || tenants.length !== 1 || !UUID.test(tenants[0])) fail('public_config_ambiguous');
  validatePublicCredentials(urls[0], keys[0]);
  return { origin: urls[0], tenant: tenants[0], anonKey: keys[0], proof: { home: home.proof, entry: script.proof, anonKeySha256: sha(keys[0]), role: 'anon', backendOrigin: urls[0], publicTenant: tenants[0] } };
}

function provenance(row, proof, version = null) {
  return { sourceUrl: proof.url, sourceSha256: proof.sha256, recordSha256: sha(JSON.stringify(row)), retrievedAt: proof.retrievedAt,
    method: 'GET', sourceVersion: Number.isInteger(version) ? version : null, access: 'anonymous-public', licence: text(row.copyright, 240) || null };
}
function cleanEntity(row, proof) {
  if (!row || !UUID.test(scalar(row.id)) || !ENTITY_SLUGS.includes(row.slug) || !text(row.name, 300) || !['company', 'group', 'entity'].includes(row.kind)) fail('public_entity_invalid');
  return { id: row.slug, slug: row.slug, name: text(row.name, 300), title: text(row.name, 300), kind: row.kind, type: 'entity',
    avatar_url: publicUrl(row.logo_url), logo_url: publicUrl(row.logo_url), hero_url: publicUrl(row.hero_url), copyright: text(row.copyright, 240),
    created_at: iso(row.created_at), updated_at: iso(row.updated_at), visibility: 'public',
    url: `${ORIGIN}/empresa/${row.id}`, provenance: provenance(row, proof) };
}
export function projectaDadesPubliques(rows, entities, { contentProof, entitiesProof } = {}) {
  if (!Array.isArray(rows) || rows.length > 5 || !Array.isArray(entities) || entities.length !== 3) fail('public_snapshot_shape_invalid');
  const verified = new Map(); const groups = { towns: [], agents: [], feedPosts: [], events: [], marketItems: [] };
  for (const row of entities) { const dto = cleanEntity(row, entitiesProof); if (verified.has(row.id) || groups.agents.some(d => d.id === dto.id)) fail('public_entity_duplicate'); verified.set(row.id, dto.id); verified.set(dto.id, dto.id); groups.agents.push(dto); }
  if (!ENTITY_SLUGS.every(s => groups.agents.some(d => d.id === s))) fail('public_entities_incomplete');
  const seen = new Set();
  for (const row of rows) {
    if (!['towns', 'feedPosts', 'events', 'marketItems'].includes(row?.key) || seen.has(row.key) || !Array.isArray(row.payload) || row.payload.length > 100) fail('public_collection_invalid');
    seen.add(row.key);
    for (const item of row.payload) {
      if (!item || typeof item !== 'object' || Array.isArray(item) || !SLUG.test(scalar(item.id)) || !text(item.title, 300)) fail('public_document_invalid');
      if ((item.visibility !== undefined && !['public','publica'].includes(item.visibility)) || item.is_public === false || item.publicat === false) fail('public_document_not_public');
      if (groups[row.key].some(d => d.id === item.id)) fail('public_document_duplicate');
      const title = text(item.title, 300), authorKey = [item.author_org_id, item.authorOrgId, item.author_entity_id].find(v => typeof v === 'string' && verified.has(v));
      const authorSlug = verified.get(authorKey); const org = groups.agents.find(e => e.id === authorSlug);
      if (row.key !== 'towns' && !org) fail('public_document_author_unverified');
      const body = text(item.description ?? item.content ?? item.body);
      const dto = { id: item.id, title, subtitle: text(item.subtitle, 500), summary: text(item.entradilla ?? item.lead ?? item.excerpt ?? item.description, 1000),
        body, content: htmlDeText(body), description: htmlDeText(body), image_url: publicUrl(item.image_url ?? item.imageSrc ?? item.image),
        visibility: 'public', provenance: provenance(item, contentProof, row.version) };
      if (org) { dto.author_entity_id = org.id; dto.author_name = org.name; dto.author_avatar = org.avatar_url; }
      if (iso(item.created_at)) dto.created_at = iso(item.created_at);
      if (row.key === 'towns') { dto.type = 'town'; dto.name = title; dto.slug = item.id; dto.avatar_url = publicUrl(item.avatar_url); }
      if (row.key === 'marketItems') { dto.type = 'market'; dto.price = typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : text(item.price, 80); dto.external_url = publicUrl(item.external_url); dto.seller = org.name; dto.copyright = text(item.copyright, 240); }
      if (row.key === 'events') { dto.type = 'event'; if (realDay(item.date)) dto.date = item.date; if (typeof item.time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item.time)) dto.time = item.time; dto.portada_sencera = item.portada_sencera === true; }
      if (row.key === 'feedPosts') dto.type = 'post';
      const section = { towns: 'pobles', marketItems: 'mercat', events: 'events', feedPosts: 'mur' }[row.key];
      dto.url = `${ORIGIN}/${section}/${item.id}`;
      groups[row.key].push(dto);
    }
  }
  if (!['towns', 'feedPosts', 'events', 'marketItems'].every(k => seen.has(k))) fail('public_collections_incomplete');
  return groups;
}

export async function preparaPublicacionsPubliques({ fetchImpl = globalThis.fetch } = {}) {
  const config = await descobreixConfiguracioPublica({ fetchImpl });
  const headers = { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}`, Accept: 'application/json' };
  const content = await getPublic(`${config.origin}/rest/v1/app_content?select=key,payload,version&key=in.(towns,feedPosts,events,marketItems)&tenant_id=eq.${config.tenant}&limit=5`, { fetchImpl, headers });
  const directory = await getPublic(`${config.origin}/rest/v1/organization_directory?select=id,slug,name,kind,logo_url,hero_url,copyright,created_at,updated_at&slug=in.(socdepoble,rentonar,olidelatorre)&limit=3`, { fetchImpl, headers });
  if (![content,directory].every(r => r.proof.contentType?.split(';')[0] === 'application/json')) fail('public_source_json_required');
  let rows, entities; try { rows = JSON.parse(content.body); entities = JSON.parse(directory.body); } catch { fail('public_source_invalid_json'); }
  const groups = projectaDadesPubliques(rows, entities, { contentProof: content.proof, entitiesProof: directory.proof });
  const plan = { schema: SCHEMA, createdAt: new Date().toISOString(), municipality: 'la-torre-de-les-macanes', localTenant: uuidMunicipi('la-torre-de-les-macanes'),
    sources: { configuration: config.proof, content: content.proof, organizations: directory.proof }, groups,
    omissions: { personalProfiles: 'No authenticated/private profiles or person identifiers queried; only the public organization directory.', organizationsTable: 'Public DTO projection only; no creator, owner, auth user or membership invented.', sourceAvailability: 'Fresh GET proves published source representation; no claim that stock or event dates are current.' },
    sanitisation: 'Explicit DTO fields only. Remote HTML reduced to plain text. No email, telephone, contact, owner ID, role, auth/session or arbitrary payload propagated.' };
  return { plan, sha256: sha(JSON.stringify(plan, null, 2) + '\n') };
}

const DTO_FIELDS = Object.freeze({
  common: ['id','title','subtitle','summary','body','content','description','image_url','visibility','provenance','url','type','author_entity_id','author_name','author_avatar','created_at'],
  towns: ['name','slug','avatar_url'], marketItems: ['price','external_url','seller','copyright'], events: ['date','time','portada_sencera'], feedPosts: [],
  agents: ['id','slug','name','title','kind','type','avatar_url','logo_url','hero_url','copyright','created_at','updated_at','visibility','url','provenance']
});
const PROVENANCE_FIELDS = ['sourceUrl','sourceSha256','recordSha256','retrievedAt','method','sourceVersion','access','licence'];
const PROOF_FIELDS = ['url','method','status','retrievedAt','serverDate','sha256','bytes','contentType'];
function exactKeys(value, allowed) { return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(k => allowed.includes(k)); }
function validProof(p, origin, pathname) {
  if (!exactKeys(p, PROOF_FIELDS) || p.method !== 'GET' || p.status !== 200 || !iso(p.retrievedAt) || !/^[a-f0-9]{64}$/.test(p.sha256) || !Number.isInteger(p.bytes) || p.bytes < 1 || p.bytes > 4*1024*1024) return false;
  try { const u = new URL(p.url); return u.origin === origin && pathname.test(u.pathname) && !u.username && !u.password && !u.hash; } catch { return false; }
}
export function validaPlaPublic(plan) {
  if (plan?.schema !== SCHEMA || plan.municipality !== 'la-torre-de-les-macanes' || plan.localTenant !== uuidMunicipi(plan.municipality)
    || !plan.sources?.content?.url?.startsWith('https://') || !plan.groups || Object.keys(plan.groups).sort().join(',') !== [...KINDS].sort().join(',')) fail('public_plan_invalid');
  if (!exactKeys(plan, ['schema','createdAt','municipality','localTenant','sources','groups','omissions','sanitisation']) || !iso(plan.createdAt)
    || !exactKeys(plan.sources, ['configuration','content','organizations'])) fail('public_plan_unknown_field');
  const cfg = plan.sources.configuration;
  if (!exactKeys(cfg, ['home','entry','anonKeySha256','role','backendOrigin','publicTenant']) || cfg.role !== 'anon' || !/^[a-f0-9]{64}$/.test(cfg.anonKeySha256)
    || !/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(cfg.backendOrigin) || !UUID.test(scalar(cfg.publicTenant))
    || !validProof(cfg.home, ORIGIN, /^\/$/) || !validProof(cfg.entry, ORIGIN, /^\/assets\/index-[A-Za-z0-9_-]+\.js$/)
    || !validProof(plan.sources.content, cfg.backendOrigin, /^\/rest\/v1\/app_content$/)
    || !validProof(plan.sources.organizations, cfg.backendOrigin, /^\/rest\/v1\/organization_directory$/)) fail('public_plan_source_invalid');
  const ids = plan.groups.agents.map(d => d?.id);
  if (ids.length !== 3 || !ENTITY_SLUGS.every(id => ids.includes(id))) fail('public_plan_entities_invalid');
  let total = 0;
  for (const kind of KINDS) {
    const docs = plan.groups[kind]; if (!Array.isArray(docs) || docs.length > 100) fail('public_plan_limit'); const seen = new Set();
    for (const d of docs) {
      const allowed = kind === 'agents' ? DTO_FIELDS.agents : [...DTO_FIELDS.common, ...DTO_FIELDS[kind]];
      const proof = kind === 'agents' ? plan.sources.organizations : plan.sources.content;
      if (!exactKeys(d, allowed) || !SLUG.test(scalar(d.id)) || d.visibility !== 'public' || !exactKeys(d.provenance, PROVENANCE_FIELDS)
        || !/^[a-f0-9]{64}$/.test(d.provenance.recordSha256) || d.provenance.sourceUrl !== proof.url || d.provenance.sourceSha256 !== proof.sha256
        || d.provenance.method !== 'GET' || d.provenance.access !== 'anonymous-public' || !iso(d.provenance.retrievedAt) || seen.has(d.id)) fail('public_plan_document_invalid');
      if (Object.values(d.provenance).some(v => v !== null && !['string','number'].includes(typeof v))) fail('public_plan_provenance_invalid');
      for (const [key, value] of Object.entries(d)) {
        if (key === 'provenance') continue;
        if (!['string','number','boolean'].includes(typeof value) && value !== null) fail('public_plan_nonprimitive');
        if (typeof value === 'number' && !Number.isFinite(value)) fail('public_plan_nonprimitive');
      }
      if (kind === 'agents') {
        if (!['company','group','entity'].includes(d.kind) || d.type !== 'entity' || d.slug !== d.id || !d.name || !new RegExp(`^${ORIGIN}/empresa/[a-f0-9-]{36}$`).test(d.url)) fail('public_plan_entity_invalid');
      } else {
        const section = { towns:'pobles', marketItems:'mercat', events:'events', feedPosts:'mur' }[kind];
        if (d.url !== `${ORIGIN}/${section}/${d.id}` || (kind !== 'towns' && !ENTITY_SLUGS.includes(d.author_entity_id))
          || d.content !== htmlDeText(d.body) || d.description !== htmlDeText(d.body)) fail('public_plan_publication_invalid');
        if (kind === 'events' && d.date !== undefined && !realDay(d.date)) fail('public_plan_event_day_invalid');
      }
      seen.add(d.id); total++;
    }
  }
  if (total > 500) fail('public_plan_limit');
  return total;
}

/** One local transaction, shared migration advisory lock, preserve unrelated rows. */
export function generaSqlPublic(plan) {
  validaPlaPublic(plan);
  const steps = [];
  for (const kind of KINDS) {
    for (const d of plan.groups[kind]) steps.push(`INSERT INTO node0.public_documents(kind,id,document,source_uri)
SELECT ${sqlText(kind)},${sqlText(d.id)},${sqlJson(d)},${sqlText(d.url)}
WHERE NOT EXISTS(SELECT 1 FROM node0.tombstones WHERE id IN (${sqlText(d.id)},${sqlText(d.url)}))
ON CONFLICT(kind,id) DO UPDATE SET document=EXCLUDED.document,source_uri=EXCLUDED.source_uri WHERE node0.public_documents.document IS DISTINCT FROM EXCLUDED.document OR node0.public_documents.source_uri IS DISTINCT FROM EXCLUDED.source_uri;`);
    steps.push(`WITH combined AS (
SELECT e AS document,0 AS rank FROM public.app_content a CROSS JOIN LATERAL jsonb_array_elements(a.payload) e WHERE a.tenant_id=${sqlText(plan.localTenant)}::uuid AND a.key=${sqlText(kind)}
UNION ALL SELECT e,1 FROM jsonb_array_elements(${sqlJson(plan.groups[kind])}) e),
chosen AS (SELECT DISTINCT ON (document->>'id') document FROM combined WHERE NOT EXISTS(SELECT 1 FROM node0.tombstones WHERE id IN(document->>'id',document->>'url')) ORDER BY document->>'id',rank DESC),
merged AS (SELECT coalesce(jsonb_agg(document ORDER BY document->>'id'),'[]'::jsonb) AS payload FROM chosen)
INSERT INTO public.app_content(tenant_id,key,payload) SELECT ${sqlText(plan.localTenant)}::uuid,${sqlText(kind)},payload FROM merged
ON CONFLICT(tenant_id,key) DO UPDATE SET payload=EXCLUDED.payload,version=public.app_content.version+1 WHERE public.app_content.payload IS DISTINCT FROM EXCLUDED.payload;`);
  }
  return `BEGIN;\nSELECT pg_advisory_xact_lock(1935960372,1701737586);\nDO $public_guard$ BEGIN
IF current_database()<>'socdepoble_node0' OR current_user='node0_runtime' OR to_regclass('node0.schema_migrations') IS NULL THEN RAISE EXCEPTION 'public_hydration_dedicated_node0_required'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.towns WHERE id=${sqlText(plan.localTenant)}::uuid AND slug='la-torre-de-les-macanes') THEN RAISE EXCEPTION 'public_hydration_town_missing'; END IF;
IF EXISTS(SELECT 1 FROM public.app_content WHERE tenant_id=${sqlText(plan.localTenant)}::uuid AND key IN ('towns','agents','feedPosts','events','marketItems') AND jsonb_typeof(payload)<>'array') THEN RAISE EXCEPTION 'public_hydration_existing_shape_invalid'; END IF;
IF EXISTS(SELECT 1 FROM public.app_content a CROSS JOIN LATERAL jsonb_array_elements(a.payload) e WHERE a.tenant_id=${sqlText(plan.localTenant)}::uuid AND a.key IN ('towns','agents','feedPosts','events','marketItems') AND (jsonb_typeof(e)<>'object' OR jsonb_typeof(e->'id') IS DISTINCT FROM 'string' OR coalesce(e->>'id','')='')) THEN RAISE EXCEPTION 'public_hydration_existing_document_invalid'; END IF;
IF EXISTS(SELECT 1 FROM public.app_content a CROSS JOIN LATERAL jsonb_array_elements(a.payload) e WHERE a.tenant_id=${sqlText(plan.localTenant)}::uuid AND a.key IN ('towns','agents','feedPosts','events','marketItems') GROUP BY a.key,e->>'id' HAVING count(*)>1) THEN RAISE EXCEPTION 'public_hydration_existing_duplicates'; END IF;
END $public_guard$;\n${steps.join('\n')}\nCOMMIT;\n`;
}

export async function main(args = process.argv.slice(2), { env = process.env, stdout = process.stdout } = {}) {
  const option = name => args.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  if (args.some(a => a !== '--apply' && !['plan','sha256','out'].some(n => a.startsWith(`--${n}=`)))) fail('public_hydration_invalid_argument');
  const apply = args.includes('--apply'), input = option('plan'); let plan, digest;
  if (input) {
    if (!path.isAbsolute(input)) fail('public_plan_absolute_required');
    const st = fs.lstatSync(input); if (!st.isFile() || st.isSymbolicLink() || st.nlink !== 1 || st.size > 2 * 1024 * 1024) fail('public_plan_file_invalid');
    const bytes = fs.readFileSync(input); digest = sha(bytes); try { plan = JSON.parse(bytes); } catch { fail('public_plan_json_invalid'); }
    if (!/^[a-f0-9]{64}$/.test(option('sha256') || '') || option('sha256') !== digest) fail('public_plan_hash_mismatch');
  } else {
    if (apply) fail('public_apply_saved_plan_required');
    ({ plan, sha256: digest } = await preparaPublicacionsPubliques());
  }
  const total = validaPlaPublic(plan);
  const output = option('out');
  if (output) { if (!path.isAbsolute(output) || apply) fail('public_plan_output_invalid'); fs.writeFileSync(output, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); }
  let applied = false;
  if (apply) {
    if (process.platform !== 'darwin' || !Object.values(os.networkInterfaces()).flat().some(i => i?.address === '192.168.0.23')) fail('public_apply_wrong_machine');
    aplicaAmbPsql(generaSqlPublic(plan), { env }); applied = true;
  }
  stdout.write(JSON.stringify({ applied, sha256: digest, total, counts: Object.fromEntries(KINDS.map(k => [k, plan.groups[k].length])), sources: plan.sources, omissions: plan.omissions }) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(e => { process.stderr.write(`${e.message}\n`); process.exitCode = 1; });
