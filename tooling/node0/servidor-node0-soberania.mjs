#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, timingSafeEqual, webcrypto } from 'node:crypto';
import { creaPostgres, sqlText, sqlJson } from './postgres-node0.mjs';
import { drenaOutboxFederadaNodeZero } from './outbox-federada-node0.mjs';
import { esperaPostgresNodeZero, cancelacioArrencadaNodeZero, comprovaArrencadaActiva } from './espera-postgres-node0.mjs';
import { peticioMastodont } from './xarxa-node0.mjs';
import { camiSegur, fitxerRegular } from './fitxers-segurs.mjs';
import { clauDeDocumentActor, verificaSignaturaHttpActivityPub, textDHtmlRemot, MAXIM_COS_INBOX } from '../../src/data/federacio/inboxActivityPub.js';
import { signaPeticioHttpMessageActivityPub } from './http-message-signatures-ed25519.mjs';
import { actorAmbMultikeyEd25519 } from './actor-multikey-ed25519.mjs';
import { retallaTextFederat, textMastodon } from '../../src/data/federacio/pontMastodon.js';
import {envoltaSqlMastodon,cteDesaMastodon,ctesRetiraMastodon,sincronitzaMastodonPrivacitat,lligEstatMastodonActual} from './reconciliacio-mastodon-node0.mjs';
import {creaSalutResiliencia,normalitzaResiliencia} from './resiliencia-node0.mjs';
import {creaSalutMirallWorkspace} from './salut-mirall-workspace-node0.mjs';
import {webFingerInstitucional} from './identitat-institucional-node0.mjs';
import {creaMastodonInboundPeriodic,normalitzaMastodonInbound} from './mastodon-inbound-periodic-node0.mjs';
import {creaGestorHttpPosse} from './http-posse-node0.mjs';
import {creaLectorMitjansPublicsPosse} from './posse/mitjans-publics-posse-node0.mjs';

const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';
const ORIGIN = 'https://socdepoble.cat';
const ACTOR = `${ORIGIN}/ap/actors/socdepoble`;
const MASTODON_ACTOR = 'https://mastodont.cat/users/depoble';
const errorHttp = (status, code) => Object.assign(new Error(code), { status });
const idDe = (value) => typeof value === 'string' ? value : value?.id;
const sha = (value) => createHash('sha256').update(value).digest('hex');
const json = (res, status, body, extra = {}) => {
  const bytes = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Length': Buffer.byteLength(bytes), ...extra }); res.end(bytes);
};
export async function llegixCos(req, limit = MAXIM_COS_INBOX) {
  if (Number(req.headers['content-length']) > limit) throw errorHttp(413, 'payload_too_large');
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > limit) throw errorHttp(413, 'payload_too_large'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
export function autoritzat(headers, token) {
  if (typeof token !== 'string' || token.length < 32) return false;
  const got = Buffer.from(headers.authorization || ''), expected = Buffer.from(`Bearer ${token}`);
  return got.length === expected.length && timingSafeEqual(got, expected);
}
export async function carregaClaus(file) {
  try { file = camiSegur(file,{allowMissing:true}); } catch { throw new Error('node0_key_permissions'); }
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (fs.lstatSync(dir).isSymbolicLink()) throw new Error('node0_key_directory_symlink');
  if (!fs.existsSync(file)) {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    fs.writeFileSync(file, JSON.stringify({ publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }), privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }) }), { flag: 'wx', mode: 0o600 });
  }
  let stat; try { stat = fitxerRegular(file).stat; } catch { throw new Error('node0_key_permissions'); }
  if ((stat.mode & 0o077) || stat.size > 16384) throw new Error('node0_key_permissions');
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  const privateKey = createPrivateKey(value.privateKeyPem);
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('node0_key_type');
  const publicKey = createPublicKey(privateKey), pem = publicKey.export({ type: 'spki', format: 'pem' });
  if (pem !== value.publicKeyPem) throw new Error('node0_key_pair_mismatch');
  return { publicKeyPem: pem, fingerprint: sha(publicKey.export({ type: 'spki', format: 'der' })),
    privateKey: await webcrypto.subtle.importKey('pkcs8', privateKey.export({ type: 'pkcs8', format: 'der' }), 'Ed25519', false, ['sign']) };
}

export function actorPublic(claus) {
  return actorAmbMultikeyEd25519({ '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'], id: ACTOR, type: 'Organization',
    preferredUsername: 'socdepoble', name: 'Sóc de Poble', url: ORIGIN,
    summary: '<p>Xarxa comunitària de Sóc de Poble. Node 0 de La Torre de les Maçanes.</p>',
    inbox: `${ORIGIN}/ap/inbox`, outbox: `${ORIGIN}/ap/outbox`, followers: `${ORIGIN}/ap/followers/socdepoble`, manuallyApprovesFollowers: false,
    publicKey: { id: `${ACTOR}#ed25519`, owner: ACTOR, publicKeyPem: claus.publicKeyPem } });
}

async function remoteActor(keyId, request) {
  const url = new URL(keyId);
  if (url.origin !== 'https://mastodont.cat') throw errorHttp(401, 'remote_actor_untrusted');
  url.hash = '';
  const response = await request(url.href, { headers: { Accept: 'application/activity+json' } });
  if (!response.ok || !(response.headers.get('content-type') || '').includes('json')) throw errorHttp(401, 'remote_actor_unavailable');
  const actor = await response.json();
  if (actor.id !== MASTODON_ACTOR || actor.preferredUsername !== 'depoble') throw errorHttp(401, 'remote_actor_mismatch');
  const clau = clauDeDocumentActor(actor, keyId);
  if (!clau || clau.owner !== MASTODON_ACTOR) throw errorHttp(401, 'remote_key_mismatch');
  return { clau, documentActor: actor };
}

export async function repActivitat({ req, bytes, db, request, now, admetActor }) {
  const verification = await verificaSignaturaHttpActivityPub({ metode: req.method, cami: req.url, capcaleres: req.headers, cos: bytes,
    hostEsperat: 'socdepoble.cat', ara: now(), obtenClauPublica: (keyId) => remoteActor(keyId, request), subtle: webcrypto.subtle });
  if (!verification.valida) throw errorHttp(401, verification.motiu);
  if(admetActor)admetActor(verification.actor);
  let activity; try { activity = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw errorHttp(400, 'invalid_json'); }
  if (!activity || typeof activity !== 'object' || Array.isArray(activity) || activity.actor !== verification.actor || activity.actor !== MASTODON_ACTOR) throw errorHttp(403, 'actor_mismatch');
  let activityUrl; try { activityUrl = new URL(activity.id); } catch { throw errorHttp(400, 'invalid_activity_id'); }
  if (activityUrl.origin !== 'https://mastodont.cat' || activityUrl.username || activityUrl.password || String(activity.id).length > 2048) throw errorHttp(400, 'invalid_activity_id');
  const claim = `INSERT INTO node0.inbox(id,actor,type) VALUES(${sqlText(activity.id)},${sqlText(activity.actor)},${sqlText(activity.type)}) ON CONFLICT DO NOTHING RETURNING id`;
  let effects = '', accept = null;const lockUris=[];
  if (activity.type === 'Follow') {
    if (idDe(activity.object) !== ACTOR) throw errorHttp(400, 'follow_target_mismatch');
    const inbox = verification.documentActor?.inbox;
    if (inbox !== `${MASTODON_ACTOR}/inbox`) throw errorHttp(400, 'remote_inbox_mismatch');
    accept = { '@context': 'https://www.w3.org/ns/activitystreams', id: `${ACTOR}#accepts/${sha(activity.id)}`, type: 'Accept', actor: ACTOR, to: [MASTODON_ACTOR],
      object: {id:activity.id,type:'Follow',actor:activity.actor,object:ACTOR} };
    effects = `, follower AS (INSERT INTO node0.followers(actor,inbox,follow_id) SELECT ${sqlText(activity.actor)},${sqlText(inbox)},${sqlText(activity.id)} FROM claimed ON CONFLICT(actor) DO UPDATE SET follow_id=EXCLUDED.follow_id RETURNING actor), queued AS (INSERT INTO node0.outbox(id,target,activity) SELECT ${sqlText(accept.id)},${sqlText(inbox)},${sqlJson(accept)} FROM claimed ON CONFLICT DO NOTHING RETURNING id)`;
  } else if (activity.type === 'Undo' && activity.object?.type === 'Follow') {
    if (idDe(activity.object.actor) !== activity.actor || idDe(activity.object.object) !== ACTOR) throw errorHttp(403, 'undo_actor_mismatch');
    effects = `, removed AS (DELETE FROM node0.followers WHERE actor=${sqlText(activity.actor)} AND follow_id=${sqlText(activity.object.id)} AND EXISTS(SELECT 1 FROM claimed) RETURNING actor)`;
  } else if (activity.type === 'Create' || activity.type === 'Update') {
    const object = activity.object;
    if (!object || object.type !== 'Note' || idDe(object.attributedTo) !== activity.actor || typeof object.id !== 'string' || object.id.length > 2048) throw errorHttp(400, 'invalid_note');
    let noteUrl; try { noteUrl = new URL(object.id); } catch { throw errorHttp(400, 'invalid_note_id'); }
    const statusId = /^https:\/\/mastodont\.cat\/users\/depoble\/statuses\/([0-9]{1,30})$/.exec(object.id)?.[1];
    if (noteUrl.origin !== 'https://mastodont.cat' || noteUrl.username || noteUrl.password || !statusId) throw errorHttp(400, 'invalid_note_id');
    lockUris.push(object.id);
    // Public in cc is Mastodon's unlisted audience. Do not promote unlisted,
    // followers-only or direct Notes to the anonymously readable projection.
    const audience=typeof object.to==='string'?[object.to]:Array.isArray(object.to)?object.to:[];
    if(!audience.includes(PUBLIC))effects=', '+ctesRetiraMastodon(object.id,{claimed:true});
    else if(activity.type==='Update'){
      let current;try{current=await lligEstatMastodonActual({uri:object.id,fetchImpl:request,now});}catch{throw errorHttp(503,'mastodon_public_update_unavailable');}
      effects=current.retirada?', '+ctesRetiraMastodon(object.id,{claimed:true}):', '+cteDesaMastodon(current.publicacio,{claimed:true});
    }else{
      const content = retallaTextFederat(textDHtmlRemot(object.content,65536),5000);
      const document = { id: `mastodon:${statusId}`, uri: object.id, title: '', body: content, content, summary: retallaTextFederat(content,220), author_entity_id: 'depoble-mastodon', visibility: 'public', source: 'mastodon', url: `https://mastodont.cat/@depoble/${statusId}`,sensitive:object.sensitive===true,content_warning:textMastodon(object.summary) };
      if (typeof object.published === 'string' && Number.isFinite(Date.parse(object.published))) document.created_at = new Date(object.published).toISOString();
      if(typeof object.updated==='string'&&Number.isFinite(Date.parse(object.updated)))document.updated_at=new Date(object.updated).toISOString();
      else if(document.created_at)document.updated_at=document.created_at;
      effects=', '+cteDesaMastodon(document,{claimed:true});
    }
  } else if (activity.type === 'Delete') {
    const target = idDe(activity.object);
    if (typeof target !== 'string' || !/^https:\/\/mastodont\.cat\/users\/depoble\/statuses\/[1-9][0-9]{0,29}$/.test(target)) throw errorHttp(400, 'invalid_delete');
    lockUris.push(target);effects=', '+ctesRetiraMastodon(target,{claimed:true});
  } else return { estat: 'ignorada', motiu: 'type_unsupported' };
  // Claim, effect and durable delivery queue are one PostgreSQL statement/transaction.
  const result = await db.query(envoltaSqlMastodon(lockUris,`WITH claimed AS (${claim}) ${effects} SELECT json_build_object('estat',CASE WHEN EXISTS(SELECT 1 FROM claimed) THEN 'processada' ELSE 'duplicada' END);`));
  return result;
}

export function creaServidor({ db, claus, token, mastodonToken, auth = null, backend = null, posse = null, resilience = null, mastodonInbound = null, identificaClient = null, request = peticioMastodont, now = Date.now } = {}) {
  if (!db || !claus) throw new TypeError('node0_dependencies_required');
  const userBackendReady=typeof auth?.handle==='function'&&typeof backend?.handle==='function'&&typeof identificaClient==='function';
  const privateCapabilities=Object.fromEntries(['actorBinding','roleRead','createOrganization','sectionSubmissions','paginacioSeccions'].map(key=>[key,userBackendReady&&backend.capabilities?.[key]===true]));
  const actors = new Map();let coarseStart=now(),coarseCount=0;let active = 0;
  const admetActor=actor=>{
    const time=now(),entry=actors.get(actor);
    if(!entry||time-entry.start>=60000){actors.set(actor,{start:time,count:1});return;}
    if(++entry.count>30)throw errorHttp(429,'actor_rate_limited');
  };
  const server = http.createServer(async (req, res) => {
    if (active >= 16) return json(res, 503, { error: 'busy' });
    active += 1;
    try {
      if (typeof req.url !== 'string' || !req.url.startsWith('/') || req.url.startsWith('//') || req.url.length > 4096) throw errorHttp(400, 'invalid_path');
      const url = new URL(req.url, ORIGIN), route = url.pathname;
      if (req.headers.host !== 'socdepoble.cat' && !/^127\.0\.0\.1(?::\d{1,5})?$/.test(req.headers.host || '')) throw errorHttp(421, 'host_mismatch');
      // The prepared tray is private to bridge editors, including GET. Handle
      // it before public CORS and never fall back to the operator bearer path.
      const posseRoute=/^\/api\/v1\/node0\/mastodon\/(preparades|publish|publica|prepara|exporta-historic)$/.exec(route);
      if(posseRoute&&(posse||posseRoute[1]!=='publish')){
        const action=posseRoute[1],read=action==='preparades';
        if(req.method!==(read?'GET':'POST'))throw errorHttp(405,'method_not_allowed');
        if(!posse||typeof posse.handle!=='function')throw errorHttp(503,'posse_editorial_confirmation_required');
        let body={},query={};
        if(read){
          if(url.search){
            if([...url.searchParams].length!==1||!url.searchParams.has('bridgeId'))throw errorHttp(400,'posse_input_invalid');
            query={bridgeId:url.searchParams.get('bridgeId')};
          }
        }else{
          if(url.search)throw errorHttp(400,'posse_input_invalid');
          if(req.headers.origin!==ORIGIN)throw errorHttp(403,'origin_rejected');
          if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))throw errorHttp(415,'json_required');
          try{body=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(await llegixCos(req,16384)));}catch(error){if(error?.status===413)throw error;throw errorHttp(400,'invalid_json');}
        }
        const result=await posse.handle(action,{headers:req.headers,body,query});
        return json(res,result.status,result.body);
      }
      // Identity-bearing routes are handled before the public CORS branch.
      // Every private operation is a same-origin JSON POST, including reads.
      const privateRoute=/^\/api\/v1\/node0\/(auth|private)\/([a-zA-Z-]{1,64})$/.exec(route);
      if(privateRoute){
        if(url.search)throw errorHttp(400,'private_query_rejected');
        const [,kind,action]=privateRoute,handler=kind==='auth'?auth:backend;
        if(!handler)throw errorHttp(503,'node0_user_backend_unavailable');
        const read=kind==='auth'&&['policy','session'].includes(action);
        if(req.method!==(read?'GET':'POST'))throw errorHttp(405,'method_not_allowed');
        let body={},remoteAddress;
        if(!read){
          if(req.headers.origin!==ORIGIN)throw errorHttp(403,'origin_rejected');
          if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))throw errorHttp(415,'json_required');
          if(kind==='auth'){
            if(typeof identificaClient!=='function')throw errorHttp(503,'trusted_ingress_required');
            try{remoteAddress=identificaClient(req);}catch{throw errorHttp(503,'trusted_ingress_required');}
            if(typeof remoteAddress!=='string'||!remoteAddress)throw errorHttp(503,'trusted_ingress_required');
          }
          const bytes=await llegixCos(req,kind==='auth'?16384:768*1024);
          try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw errorHttp(400,'invalid_json');}
        }
        const answer=await handler.handle(action,{headers:req.headers,body,remoteAddress});
        return json(res,answer.status,answer.body,answer.headers);
      }
      if(req.method==='GET')res.setHeader?.('Access-Control-Allow-Origin','*');
      if (req.headers.origin && req.headers.origin !== ORIGIN && req.method!=='GET') throw errorHttp(403, 'origin_rejected');
      if (req.method === 'GET') {
        if (route === '/api/v1/node0/status') {
          const start = now(); let pg;
          let inboundState=normalitzaMastodonInbound(null);
          try{if(mastodonInbound)inboundState=normalitzaMastodonInbound(mastodonInbound.status());}
          catch{inboundState=normalitzaMastodonInbound({errorCode:'mastodon_inbound_status_unavailable'});}
          try { pg = await db.status(); } catch { return json(res, 503, { node: 'node0', postgresql: { ok: false }, activitypub: { active: false }, ed25519: { fingerprint: claus.fingerprint } }); }
          let resilienceState=normalitzaResiliencia(null,now());
          try{if(typeof resilience?.status==='function')resilienceState=normalitzaResiliencia(await resilience.status(),now());}catch{/* Health inspection failure never fabricates a protected backup. */}
          return json(res, 200, { node: 'node0', postgresql: { ...pg, latencyMs: now() - start }, resilience:resilienceState, activitypub: { active: true, ...pg.activitypub, signatureProfile:'rfc9421-ed25519', remoteInteropVerified: false }, ed25519: { fingerprint: claus.fingerprint }, mastodon: { account: '@depoble@mastodont.cat', outboundConfigured: Boolean(mastodonToken), tokenPreflight:'verify_credentials', automaticSync: inboundState.enabled, inbound: inboundState, outboundPublication:'manual-confirmation' }, capabilities: { publicRead: true, adminPublish: false, possePrepared:posse?.capabilities?.prepared===true,possePublish:posse?.capabilities?.publish===true, userSessions:userBackendReady,...privateCapabilities,norms:userBackendReady&&auth.capabilities?.norms===true,emailDelivery:userBackendReady&&auth.capabilities?.emailDelivery===true,emailVerificationWithPassword:userBackendReady&&auth.capabilities?.emailVerificationWithPassword===true,emailPasswordRecovery:userBackendReady&&auth.capabilities?.emailPasswordRecovery===true } });
        }
        const kinds = route === '/api/v1/node0/core' ? ['towns','pages','agents'] : route === '/api/v1/node0/mur' ? ['feedPosts','events','marketItems'] : route === '/api/v1/node0/multimedia' ? ['mediaItems'] : null;
        if (kinds) { const values = await Promise.all(kinds.map((kind) => db.documents(kind))); return json(res, 200, Object.fromEntries(kinds.map((kind, index) => [kind, values[index]]))); }
        if (route === '/api/v1/node0/notes') return json(res, 200, { notes: [], noteFolders: [] });
        if ([`/ap/actors/socdepoble`, `/ap/actors/socdepoble.json`].includes(route)) return json(res, 200, actorPublic(claus), { 'Content-Type': 'application/activity+json' });
        if (/^\/ap\/objects\/sdp-[a-f0-9]{64}$/.test(route)) {
          const object = await db.query(`SELECT coalesce((SELECT activity->'object' FROM node0.outbox WHERE activity->>'type'='Create' AND activity->'object'->>'id'=${sqlText(`${ORIGIN}${route}`)} LIMIT 1),'null'::jsonb);`);
          if (!object) throw errorHttp(404,'not_found');
          return json(res,200,{'@context':'https://www.w3.org/ns/activitystreams',...object},{'Content-Type':'application/activity+json'});
        }
        if (route === '/ap/outbox') {
          const items = await db.query("SELECT coalesce(json_agg(activity),'[]'::json) FROM (SELECT DISTINCT ON (id) id,activity FROM node0.outbox WHERE activity->>'type'='Create' ORDER BY id LIMIT 40) t;");
          const count = await db.query("SELECT json_build_object('count',count(DISTINCT id)) FROM node0.outbox WHERE activity->>'type'='Create';");
          return json(res, 200, { '@context': 'https://www.w3.org/ns/activitystreams', id: `${ORIGIN}/ap/outbox`, type: 'OrderedCollection', totalItems: count.count, first: { type: 'OrderedCollectionPage', partOf: `${ORIGIN}/ap/outbox`, orderedItems: items } }, { 'Content-Type': 'application/activity+json' });
        }
        if (route === '/ap/followers/socdepoble') {
          const count = await db.query("SELECT json_build_object('count',count(*)) FROM node0.followers;");
          return json(res, 200, { '@context': 'https://www.w3.org/ns/activitystreams', id: `${ORIGIN}${route}`, type: 'OrderedCollection', totalItems: count.count }, { 'Content-Type': 'application/activity+json' });
        }
        if (route === '/.well-known/webfinger') {
          if([...url.searchParams].length!==1)throw errorHttp(400,'webfinger_resource_required');
          const document=webFingerInstitucional(url.searchParams.get('resource'));
          if(!document)throw errorHttp(404,'not_found');
          return json(res,200,document,{'Content-Type':'application/jrd+json'});
        }
        throw errorHttp(404, 'not_found');
      }
      if (req.method !== 'POST') throw errorHttp(405, 'method_not_allowed');
      if (route === '/ap/inbox' || route === '/ap/inbox/socdepoble') {
        if (!['application/activity+json','application/ld+json'].includes((req.headers['content-type'] || '').split(';')[0])) throw errorHttp(415, 'unsupported_media_type');
        if(!req.headers.signature)throw errorHttp(401,'signature_missing');
        // Resource ceiling before expensive verification; identity quota only after crypto.
        // Proxy addresses and forwarding headers never identify a federation actor.
        const time=now();if(time-coarseStart>=60000){coarseStart=time;coarseCount=0;}
        if(++coarseCount>300)throw errorHttp(429,'inbox_busy');
        return json(res, 202, await repActivitat({ req, bytes: await llegixCos(req), db, request, claus, now, admetActor }));
      }
      if (!autoritzat(req.headers, token)) throw errorHttp(401, 'admin_auth_required');
      if (req.headers['content-type'] !== 'application/json') throw errorHttp(415, 'unsupported_media_type');
      const bytes = await llegixCos(req, 128 * 1024); let input;
      try { input = JSON.parse(bytes.toString('utf8')); } catch { throw errorHttp(400, 'invalid_json'); }
      if(!input||typeof input!=='object'||Array.isArray(input))throw errorHttp(400,'invalid_json_object');
      if (route === '/api/v1/node0/mastodon/sync') {
        return json(res, 200, await (mastodonInbound?mastodonInbound.runNow():sincronitzaMastodonPrivacitat({db,fetchImpl:request,now})));
      }
      if (route === '/api/v1/node0/mastodon/publish') {
        // AH09: configuring OAuth never authorizes arbitrary browser drafts.
        // The prepared editorial snapshot, actor approval and durable ledger
        // must be wired before this route can produce any remote effect.
        throw errorHttp(503, 'posse_editorial_confirmation_required');
      }
      if (route === '/api/v1/node0/activitypub/publish') {
        throw errorHttp(503, 'posse_editorial_confirmation_required');
      }
      throw errorHttp(404, 'not_found');
    } catch (error) { if (!res.headersSent) json(res, error.status || 503, { error: error.status ? error.message : 'node0_operation_failed' }); }
    finally { active -= 1; }
  });
  server.requestTimeout = 15000; server.headersTimeout = 10000; server.keepAliveTimeout = 5000;
  return server;
}

/** Deliver existing durable activities; no editorial publication is created. */
export async function drenaOutbox({ db, claus, request = peticioMastodont, now = Date.now }) {
  return drenaOutboxFederadaNodeZero({db,privateKey:claus.privateKey,request,now,sqlText,
    sign:parameters=>signaPeticioHttpMessageActivityPub({...parameters,subtle:webcrypto.subtle})});
}

// Optional dependencies are a process-local test seam; no request can supply
// them. The real entry point always uses the canonical service and SQL ledger.
export async function main(env = process.env, dependencies = {}) {
  const startup = cancelacioArrencadaNodeZero();
  let userBackend={},authMaintenance=null,mastodonInbound=null,server=null,timer=null,stop=null;
  try {
    const createDb=dependencies.creaPostgres??creaPostgres;
    const loadKeys=dependencies.carregaClaus??carregaClaus;
    const requestor=dependencies.request??peticioMastodont;
    if(env.SDP_NODE0_POSSE==='1'&&env.SDP_NODE0_AUTH!=='1')throw new Error('node0_posse_auth_required');
    if(env.SDP_NODE0_POSSE_PUBLISH==='1'&&env.SDP_NODE0_POSSE!=='1')throw new Error('node0_posse_configuration_required');
    const port = Number(env.SDP_NODE0_PORT || 4340);
    if (!Number.isInteger(port) || port < 4340 || port > 65535) throw new Error('node0_port_invalid');
    const db = createDb({ env });
    const authDb=env.SDP_NODE0_AUTH==='1'?createDb({env:{...env,PGUSER:'node0_authenticator'}}):null;
    await esperaPostgresNodeZero({signal:startup.signal,probe:async({signal})=>{
      await db.verificaRol({signal});
      if(authDb)await authDb.verificaRolAutenticador({signal});
      return true;
    }});
    comprovaArrencadaActiva(startup.signal);
    let posseServiceFactory=null;
    if(env.SDP_NODE0_POSSE==='1'){
      const [{creaServeiPosseNodeZero},{verificaEsquemaPosseNodeZero}]=await Promise.all([
        import('./posse/servei-posse-node0.mjs'),import('./posse/instal-la-posse-node0.mjs')
      ]);
      // Readiness precedes key generation and maintenance side effects.
      await verificaEsquemaPosseNodeZero({db:authDb});
      comprovaArrencadaActiva(startup.signal);
      posseServiceFactory=creaServeiPosseNodeZero;
    }
    const claus = await loadKeys(env.SDP_NODE0_KEY_FILE || path.join(os.homedir(), '.config/socdepoble/node0_ed25519.json'));
    comprovaArrencadaActiva(startup.signal);
    if(authDb){
      // Operator configuration and authority gates remain independent of the SPA.
      const [{creaAuthNodeZero,NODE0_AUTH_TENANT},{creaBackendPrivatNodeZero},{creaIdentificadorClientNodeZero}]=await Promise.all([
        import('./auth-node0.mjs'),import('./backend-node0.mjs'),import('./client-ingress-node0.mjs')
      ]);
      const {iniciaMantenimentAuthNodeZero}=await import('./manteniment-auth-node0.mjs');
      comprovaArrencadaActiva(startup.signal);
      userBackend={auth:creaAuthNodeZero({db:authDb,rateSecret:env.SDP_NODE0_AUTH_RATE_SECRET,mailTransport:null}),
        backend:creaBackendPrivatNodeZero({db:authDb,tenantId:NODE0_AUTH_TENANT}),
        identificaClient:creaIdentificadorClientNodeZero({proxySecret:env.SDP_NODE0_PROXY_SECRET})};
      if(posseServiceFactory){
        // Runtime cannot install privileged schema or invent institutional
        // owners/bindings. Explicit activation requires the reviewed ledger.
        const publishingEnabled=env.SDP_NODE0_POSSE_PUBLISH==='1';
        const service=posseServiceFactory({db:authDb,tenantId:NODE0_AUTH_TENANT,publishingEnabled,
          tokenProvider:async()=>env.MASTODON_ACCESS_TOKEN||env.SDP_MASTODON_ACCESS_TOKEN,
          readPublicMedia:creaLectorMitjansPublicsPosse({root:env.SDP_NODE0_POSSE_MEDIA_DIR}),
          fetchImpl:requestor});
        userBackend.posse=creaGestorHttpPosse({creaMotorPerSessio:service.creaMotorPerSessio,publishingEnabled});
      }
      authMaintenance=iniciaMantenimentAuthNodeZero({db:authDb});
    }
    const resilience=(dependencies.creaSalutResiliencia??creaSalutResiliencia)({mirrorProbe:creaSalutMirallWorkspace({mirrorDir:env.SDP_WORKSPACE_MIRROR_DIR,recipient:env.SDP_WORKSPACE_AGE_RECIPIENT})});
    void resilience.refresh().catch(()=>{});
    mastodonInbound=(dependencies.creaMastodonInboundPeriodic??creaMastodonInboundPeriodic)({db,fetchImpl:requestor});
    server = creaServidor({ db, claus, resilience, mastodonInbound, request:requestor, token: env.SDP_NODE0_ADMIN_TOKEN, mastodonToken: env.MASTODON_ACCESS_TOKEN || env.SDP_MASTODON_ACCESS_TOKEN,...userBackend });
    server.once('close',()=>{
      clearInterval(timer);authMaintenance?.stop();userBackend.auth?.close();void mastodonInbound.stop();
      if(stop){process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);}
    });
    let draining = false;
    const tick = async () => { if (draining) return; draining = true; try { await drenaOutbox({ db, claus }); } catch { /* health reports durable backlog */ } finally { draining = false; } };
    timer = setInterval(tick, 30000); timer.unref();
    server.listen(port, '127.0.0.1', () => process.stdout.write(JSON.stringify({ service: 'node0-soberania', address: '127.0.0.1', port }) + '\n'));
    mastodonInbound.start();
    stop = () => { clearInterval(timer); void mastodonInbound.stop(); server.close(); };
    process.once('SIGTERM', stop); process.once('SIGINT', stop);
    return server;
  } catch(error) {
    clearInterval(timer);authMaintenance?.stop();userBackend.auth?.close();void mastodonInbound?.stop();
    if(server?.listening)server.close();
    throw error;
  } finally {
    startup.close();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(() => { process.stderr.write('node0_start_failed\n'); process.exitCode = 1; });
