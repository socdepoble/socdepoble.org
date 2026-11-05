/** R6 public Mastodon projection reconciliation. GET only, no OAuth.
 * Missing from a bounded page is never a withdrawal. Every retirement needs
 * a complete individual GET of a previously stored canonical URI. Any failed
 * request aborts the entire plan before SQL. Permanent tombstones deliberately
 * require operator review before any later public resurrection of the same URI.
 */
import {COMPTE_MASTODON as C,normalitzaEstatMastodon,textMastodon,executaAmbTerminiMastodon} from '../../src/data/federacio/pontMastodon.js';
import {sqlText,sqlJson} from './postgres-node0.mjs';

const URI=/^https:\/\/mastodont\.cat\/users\/depoble\/statuses\/([1-9][0-9]{0,29})$/;
const ID=/^[1-9][0-9]{0,29}$/;
const fail=code=>{throw Error(code);};
export const LIMITS_RECONCILIACIO=Object.freeze({pages:5,pageSize:40,known:100,concurrency:4,bytes:1048576,deadlineMs:10000});
export function idUriMastodon(uri){const id=typeof uri==='string'?URI.exec(uri)?.[1]:null;if(!id)fail('mastodon_reconciliation_uri_invalid');return id;}
const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():null;

/** Separate lock and DML commands provide a fresh READ COMMITTED snapshot
 * after any waiting writer. A lock CTE within the DML statement is insufficient.
 * All R6 AP/REST writers share these sorted transaction-scoped URI locks. */
export function envoltaSqlMastodon(uris,statement){
  if(!Array.isArray(uris)||uris.length>300||typeof statement!=='string')fail('mastodon_reconciliation_sql_invalid');
  const ordered=[...new Set(uris)];for(const uri of ordered)idUriMastodon(uri);ordered.sort();
  if(!ordered.length)return statement;
  return `BEGIN; DO $sdp_mastodon_uri$ BEGIN ${ordered.map(uri=>`PERFORM pg_advisory_xact_lock(hashtextextended(${sqlText('sdp-mastodon:'+uri)},0));`).join(' ')} END $sdp_mastodon_uri$;\n${statement}\nCOMMIT;`;
}
function cteName(name){if(!/^[a-z][a-z0-9_]{0,39}$/.test(name))fail('mastodon_reconciliation_sql_invalid');return name;}
function publicDocument(doc){
  const id=idUriMastodon(doc?.uri);
  if(doc.id!=='mastodon:'+id||doc.visibility!=='public'||doc.source!=='mastodon'||typeof doc.body!=='string'||!doc.body.isWellFormed()||Buffer.byteLength(JSON.stringify(doc))>128*1024)fail('mastodon_reconciliation_document_invalid');
  return id;
}
/** Caller chooses only trusted fixed CTE names; values use encoded SQL data. */
export function cteDesaMastodon(doc,{name='saved',claimed=false}={}){
  publicDocument(doc);cteName(name);
  const incomingVersion="coalesce(EXCLUDED.document->>'updated_at',EXCLUDED.document->>'created_at','')",currentVersion="coalesce(node0.public_documents.document->>'updated_at',node0.public_documents.document->>'created_at','')";
  // source_checked_at is an observation high-water mark, never a source
  // revision. Account sensitization can change without editing the status.
  // Equal source versions retain known CW/sensitive conservatively; only a
  // strictly newer source version (or operator review) can clear them.
  const base=`CASE WHEN ${incomingVersion}>=${currentVersion} THEN EXCLUDED.document ELSE node0.public_documents.document END`;
  const checked="greatest(nullif(node0.public_documents.document->>'source_checked_at',''),nullif(EXCLUDED.document->>'source_checked_at',''))";
  const sameVersion=`CASE WHEN ${incomingVersion}=${currentVersion} THEN jsonb_build_object('sensitive',coalesce(node0.public_documents.document->'sensitive'='true'::jsonb,false) OR coalesce(EXCLUDED.document->'sensitive'='true'::jsonb,false),'content_warning',coalesce(nullif(node0.public_documents.document->>'content_warning',''),EXCLUDED.document->>'content_warning','')) ELSE '{}'::jsonb END`;
  const chosen=`(${base})||(${sameVersion})||CASE WHEN ${checked} IS NOT NULL THEN jsonb_build_object('source_checked_at',${checked}) ELSE '{}'::jsonb END||jsonb_build_object('source','mastodon')`;
  // Verified Node0 R3 legacy shape: the top-level source marker was absent,
  // but the canonical table/document IDs and all federation provenance pins
  // already matched this exact URI. Adopt only that narrow shape; never an
  // unrelated source merely sharing a title, account name or external link.
  const legacy=`(node0.public_documents.document->>'source' IS NULL
    AND node0.public_documents.document->>'id'=EXCLUDED.id
    AND node0.public_documents.document->>'uri'=EXCLUDED.source_uri
    AND node0.public_documents.document#>>'{federacio,origen}'='mastodon'
    AND node0.public_documents.document#>>'{federacio,compte}'='depoble@mastodont.cat'
    AND node0.public_documents.document#>>'{federacio,verificacio}'='https-webfinger-autor'
    AND node0.public_documents.document#>>'{federacio,uri}'=EXCLUDED.source_uri)`;
  return `${name} AS (INSERT INTO node0.public_documents(kind,id,document,source_uri)
    SELECT 'feedPosts',${sqlText(doc.id)},${sqlJson(doc)},${sqlText(doc.uri)} ${claimed?'FROM claimed':''}
    WHERE NOT EXISTS(SELECT 1 FROM node0.tombstones WHERE id=${sqlText(doc.uri)})
    ON CONFLICT(kind,id) DO UPDATE SET document=${chosen},source_uri=EXCLUDED.source_uri
    WHERE node0.public_documents.source_uri=EXCLUDED.source_uri AND (node0.public_documents.document->>'source'='mastodon' OR ${legacy})
      AND NOT EXISTS(SELECT 1 FROM node0.tombstones WHERE id=${sqlText(doc.uri)})
    RETURNING id)`;
}
export function ctesRetiraMastodon(uri,{name='withdrawn',claimed=false}={}){
  idUriMastodon(uri);cteName(name);
  return `${name}_tombstone AS (INSERT INTO node0.tombstones(id,actor) SELECT ${sqlText(uri)},${sqlText(C.actor)} ${claimed?'FROM claimed':''} ON CONFLICT DO NOTHING RETURNING id),
    ${name} AS (DELETE FROM node0.public_documents WHERE kind='feedPosts' AND source_uri=${sqlText(uri)} ${claimed?'AND EXISTS(SELECT 1 FROM claimed)':''} RETURNING id)`;
}
export function sqlReconciliacioMastodon(plan){
  if(!plan||!Array.isArray(plan.publicacions)||plan.publicacions.length>300||!Array.isArray(plan.retirades)||plan.retirades.length>100)fail('mastodon_reconciliation_plan_invalid');
  const uris=new Set(),ctes=[],saved=[],removed=[];
  plan.publicacions.forEach((doc,index)=>{publicDocument(doc);if(uris.has(doc.uri))fail('mastodon_reconciliation_duplicate');uris.add(doc.uri);const name='saved'+index;ctes.push(cteDesaMastodon(doc,{name}));saved.push(`(SELECT count(*) FROM ${name})`);});
  plan.retirades.forEach((retirement,index)=>{
    const id=idUriMastodon(retirement.uri),proof=retirement.proof;
    if(uris.has(retirement.uri)||!proof||proof.method!=='GET'||proof.complete!==true||proof.url!==`${C.origen}/api/v1/statuses/${id}`||!['http404','http410','visibility:unlisted','visibility:private','visibility:direct'].includes(retirement.reason)||
      (retirement.reason.startsWith('http')?proof.status!==Number(retirement.reason.slice(4)):proof.status!==200))fail('mastodon_reconciliation_withdrawal_proof_invalid');
    uris.add(retirement.uri);const name='removed'+index;ctes.push(ctesRetiraMastodon(retirement.uri,{name}));removed.push(`(SELECT count(*) FROM ${name})`);
  });
  const statement=(ctes.length?'WITH '+ctes.join(',\n')+'\n':'')+`SELECT json_build_object('received',${plan.publicacions.length},'saved',${saved.join('+')||0},'retired',${removed.join('+')||0},'permanentTombstones',true);`;
  return envoltaSqlMastodon([...uris],statement);
}
async function jsonPublic(url,{fetchImpl,signal,allowMissing=false}){
  if(signal.aborted)fail('mastodon_reconciliation_aborted');let response;
  try{response=await fetchImpl(url,{method:'GET',headers:{Accept:'application/json, application/jrd+json','Cache-Control':'no-cache',Pragma:'no-cache'},redirect:'error',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal});}catch{fail('mastodon_reconciliation_transport');}
  if(signal.aborted)fail('mastodon_reconciliation_aborted');
  if(!response||(response.url&&response.url!==url))fail('mastodon_reconciliation_redirect');
  const status=response.status;if(!(response.ok||(allowMissing&&[404,410].includes(status))))fail('mastodon_reconciliation_http');
  if(!['application/json','application/jrd+json'].includes(response.headers?.get('content-type')?.split(';')[0].trim().toLowerCase())||Number(response.headers?.get('content-length'))>LIMITS_RECONCILIACIO.bytes||!response.body?.getReader)fail('mastodon_reconciliation_response');
  const reader=response.body.getReader(),chunks=[];let size=0;
  const cancel=()=>{try{Promise.resolve(reader.cancel()).catch(()=>{});}catch{/* already closed */}};
  signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>LIMITS_RECONCILIACIO.bytes){cancel();fail('mastodon_reconciliation_response');}chunks.push(Buffer.from(value));}}
  finally{signal.removeEventListener('abort',cancel);reader.releaseLock();}
  if(signal.aborted)fail('mastodon_reconciliation_aborted');let value;
  try{value=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(Buffer.concat(chunks,size)));}catch{fail('mastodon_reconciliation_json');}
  if([404,410].includes(status)&&(!value||typeof value.error!=='string'||!value.error))fail('mastodon_reconciliation_missing_proof');
  return {status,value};
}
function verifiedAccount(account){return account&&typeof account.id==='string'&&ID.test(account.id)&&account.username==='depoble'&&account.acct==='depoble'&&account.url===C.perfil&&(account.uri===undefined||account.uri===C.actor);}
function verifiedStatus(status,accountId){
  if(!status||typeof status.id!=='string'||!ID.test(status.id)||status.uri!==C.actor+'/statuses/'+status.id||status.url!==C.perfil+'/'+status.id||!verifiedAccount(status.account)||status.account.id!==accountId||!['public','unlisted','private','direct'].includes(status.visibility))fail('mastodon_reconciliation_status_identity');
  return status;
}
function project(status,accountId,checkedAt){
  const doc=normalitzaEstatMastodon(status,{compteId:accountId});if(!doc){if(status.visibility==='public'&&status.reblog==null)fail('mastodon_reconciliation_status_projection');return null;}
  doc.updated_at=iso(status.edited_at)??doc.created_at;doc.source_checked_at=checkedAt;
  doc.sensitive=status.sensitive===true;doc.content_warning=textMastodon(status.spoiler_text);return doc;
}
async function comptePublicVerificat(fetchImpl,signal){
  const get=url=>jsonPublic(url,{fetchImpl,signal});
  const wf=(await get(`${C.origen}/.well-known/webfinger?resource=acct%3Adepoble%40mastodont.cat`)).value;
  if(wf?.subject!=='acct:'+C.acct||!Array.isArray(wf.links)||!wf.links.some(link=>link?.rel==='self'&&['application/activity+json','application/ld+json; profile="https://www.w3.org/ns/activitystreams"'].includes(link.type)&&link.href===C.actor))fail('mastodon_reconciliation_webfinger');
  const account=(await get(C.origen+'/api/v1/accounts/lookup?acct=depoble')).value;if(!verifiedAccount(account))fail('mastodon_reconciliation_account');return account;
}
async function estatActualVerificat(uri,{account,fetchImpl,signal,checkedAt}){
  const id=idUriMastodon(uri),url=C.origen+'/api/v1/statuses/'+id;
  const found=await jsonPublic(url,{fetchImpl,signal,allowMissing:true}),proof={url,method:'GET',status:found.status,complete:true,checkedAt};
  if([404,410].includes(found.status))return{publicacio:null,retirada:{uri,reason:'http'+found.status,proof}};
  verifiedStatus(found.value,account.id);if(found.value.id!==id)fail('mastodon_reconciliation_status_identity');
  if(found.value.visibility!=='public')return{publicacio:null,retirada:{uri,reason:'visibility:'+found.value.visibility,proof}};
  const doc=project(found.value,account.id,checkedAt);if(!doc)fail('mastodon_reconciliation_status_projection');return{publicacio:doc,retirada:null};
}
/** An AP Update timestamp may be truncated to seconds by Mastodon while REST
 * edited_at retains milliseconds. Neither packet arrival order nor that coarse
 * timestamp can establish the current public body. Revalidate its exact URI.
 */
export async function lligEstatMastodonActual({uri,fetchImpl=globalThis.fetch,now=Date.now,deadlineMs=LIMITS_RECONCILIACIO.deadlineMs}={}){
  idUriMastodon(uri);const checkedAt=new Date(now()).toISOString();
  return executaAmbTerminiMastodon(async signal=>{const account=await comptePublicVerificat(fetchImpl,signal);return estatActualVerificat(uri,{account,fetchImpl,signal,checkedAt});},{terminiMs:deadlineMs});
}
export async function preparaReconciliacioMastodon({knownUris=[],knownComplete=true,fetchImpl=globalThis.fetch,now=Date.now,deadlineMs=LIMITS_RECONCILIACIO.deadlineMs}={}){
  if(!Array.isArray(knownUris)||knownUris.length>100||new Set(knownUris).size!==knownUris.length)fail('mastodon_reconciliation_known_invalid');for(const uri of knownUris)idUriMastodon(uri);
  const checkedAt=new Date(now()).toISOString();
  return executaAmbTerminiMastodon(async signal=>{
    const get=url=>jsonPublic(url,{fetchImpl,signal});
    const account=await comptePublicVerificat(fetchImpl,signal);
    const publications=new Map(),seen=new Set();let cursor=null,complete=false,pages=0,upperId=null,lowerId=null;
    for(let page=0;page<LIMITS_RECONCILIACIO.pages;page++){
      const url=`${C.origen}/api/v1/accounts/${account.id}/statuses?limit=40&exclude_reblogs=true`+(cursor?'&max_id='+cursor:'');
      const rows=(await get(url)).value;pages++;if(!Array.isArray(rows)||rows.length>40)fail('mastodon_reconciliation_page');
      if(!rows.length){complete=true;break;}
      let previous=cursor===null?null:BigInt(cursor);
      for(const row of rows){verifiedStatus(row,account.id);const numeric=BigInt(row.id);if((previous!==null&&numeric>=previous)||seen.has(row.id))fail('mastodon_reconciliation_page_order');previous=numeric;seen.add(row.id);upperId??=row.id;lowerId=row.id;
        const doc=project(row,account.id,checkedAt);if(doc)publications.set(doc.uri,doc);
      }cursor=rows.at(-1).id;
    }
    // Individual explicit evidence is required even after a complete empty
    // collection. This also safely checks historical objects outside200 rows.
    const targets=knownUris.filter(uri=>!publications.has(uri)),retirements=[];let next=0;
    const workers=Array.from({length:Math.min(4,targets.length)},async()=>{
      while(next<targets.length){if(signal.aborted)fail('mastodon_reconciliation_aborted');const uri=targets[next++],current=await estatActualVerificat(uri,{account,fetchImpl,signal,checkedAt});
        if(current.retirada)retirements.push(current.retirada);else publications.set(uri,current.publicacio);
      }
    });
    const results=await Promise.allSettled(workers);if(results.some(result=>result.status==='rejected'))fail('mastodon_reconciliation_target_failed');if(signal.aborted)fail('mastodon_reconciliation_aborted');
    return {publicacions:[...publications.values()],retirades:retirements.sort((a,b)=>a.uri.localeCompare(b.uri)),window:{complete,pages,pageSize:40,seen:seen.size,upperId,lowerId},known:{selected:knownUris.length,complete:knownComplete,limit:100,progress:'oldest source_checked_at first; repeat sync to cover additional historical URIs'},checkedAt,absenceDeletion:false,permanentTombstones:true};
  },{terminiMs:deadlineMs});
}
export async function sincronitzaMastodonPrivacitat({db,fetchImpl,now=Date.now,deadlineMs}={}){
  const known=await db.query(`SELECT coalesce(jsonb_agg(uri),'[]'::jsonb) FROM (SELECT source_uri AS uri FROM node0.public_documents WHERE kind='feedPosts' AND source_uri ~ '^https://mastodont[.]cat/users/depoble/statuses/[1-9][0-9]{0,29}$' ORDER BY nullif(document->>'source_checked_at','') ASC NULLS FIRST,source_uri LIMIT 101) stored;`);
  if(!Array.isArray(known))fail('mastodon_reconciliation_local_shape');
  const plan=await preparaReconciliacioMastodon({knownUris:known.slice(0,100),knownComplete:known.length<=100,fetchImpl,now,deadlineMs});
  const result=await db.query(sqlReconciliacioMastodon(plan));
  return {...result,window:plan.window,known:plan.known,absenceDeletion:false};
}
