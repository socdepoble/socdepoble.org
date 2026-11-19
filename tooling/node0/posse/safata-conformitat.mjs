/** Optional signed POSSE tray. No credentials, network implementation or SQL.
 * journal.read/append must be a trusted, durable, atomic CAS adapter. Tests
 * use explicit memory adapters; their success does not certify persistence.
 * An external anchor detects truncation; controlling journal AND anchor can
 * rewrite local bookkeeping. Signed approvals still require trusted keys.
 * Withdrawal ACK and Tombstone are local audit evidence, not AP delivery.
 */
import {jsonCanonic,sha256Hex,base64url} from '../../../src/sections/tractors/nucli/canonic.js';
import {preparaRegistre,verificaRegistre} from '../../../src/sections/tractors/nucli/aprovacio.js';

const SCHEMA='sdp.posse.safata.v1',HASH=/^[a-f0-9]{64}$/,TTL=120000;
const STATES=new Set(['prepared','approved','dispatching','published','media-pending','revoked','indeterminate']);
const MAX_EVENTS=256,MAX_BYTES=2*1024*1024,MAX_NODES=20000,MAX_DEPTH=12;
const EVENT_KEYS=['schema','seq','previousHash','at','state','action','binding','approval','receipt','tombstone','hash'];
const BINDING_KEYS=['preparedId','bridgeId','bridgeRevision','recordRevision','remoteAccountIdentity','draftHash'];
const MANIFEST=Object.freeze({schema:'sdp.tractor.v1',id:'posse.safata',versio:'1.0.0',nom:'Aprovació de la safata POSSE',
  descripcio:'Signa una sola acció vinculada a la preparació i al cap del registre.',fitxa:'tooling/node0/posse/safata-conformitat.mjs',
  fonts:['tooling/node0/posse/safata-conformitat.mjs'],llig:['Preparació pública POSSE'],escriu:['Registre privat de conformitat'],
  xarxa:'Només el transport de servidor configurat explícitament',dadesPersonals:false,nivellMinim:'signatura',caducitatDies:1});
const fail=(code,status=409)=>{throw Object.assign(new Error(code),{code,status});};
const same=(a,b)=>jsonCanonic(a)===jsonCanonic(b);
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
function exact(v,keys){if(!plain(v)||Reflect.ownKeys(v).length!==keys.length||keys.some(k=>!Object.hasOwn(v,k)))fail('POSSE_TRAY_INPUT_INVALID',400);}
const iso=v=>typeof v==='string'&&v.length===24&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const opaque=v=>typeof v==='string'&&v.length>0&&v.length<=128&&!/[\s\x00-\x1f\x7f]/.test(v);
const head=events=>events.length?{seq:events.at(-1).seq,hash:events.at(-1).hash}:{seq:0,hash:null};
function expectedHead(h){exact(h,['seq','hash']);if(!Number.isSafeInteger(h.seq)||h.seq<0||!(h.hash===null&&h.seq===0||typeof h.hash==='string'&&HASH.test(h.hash)&&h.seq>0))fail('POSSE_TRAY_HEAD_INVALID',400);}
function snapshot(v){
  const stack=[{v,depth:0}],ancestors=new Set();let nodes=0,bytes=0;
  while(stack.length){const item=stack.pop(),x=item.v;if(item.exit){ancestors.delete(x);continue;}
    if(++nodes>MAX_NODES||item.depth>MAX_DEPTH)fail('POSSE_TRAY_LIMIT',400);
    if(typeof x==='string'){if(x.length>MAX_BYTES)fail('POSSE_TRAY_LIMIT',400);bytes+=new TextEncoder().encode(JSON.stringify(x)).byteLength;}
    else if(x===null||typeof x==='boolean'||typeof x==='number'&&Number.isSafeInteger(x))bytes+=24;
    else if(typeof x==='object'){
      if(!Array.isArray(x)&&!plain(x)||ancestors.has(x))fail('POSSE_TRAY_JSON_INVALID',400);
      if(Array.isArray(x)&&x.length>MAX_NODES)fail('POSSE_TRAY_LIMIT',400);
      const keys=Reflect.ownKeys(x);if(keys.length>MAX_NODES)fail('POSSE_TRAY_LIMIT',400);
      if(Array.isArray(x)&&keys.length!==x.length+1)fail('POSSE_TRAY_JSON_INVALID',400);
      ancestors.add(x);stack.push({v:x,exit:true});
      for(const k of keys){if(Array.isArray(x)&&k==='length')continue;const d=Object.getOwnPropertyDescriptor(x,k);
        if(typeof k!=='string'||!d.enumerable||!Object.hasOwn(d,'value')||Array.isArray(x)&&(!/^\d+$/.test(k)||String(Number(k))!==k||Number(k)>=x.length))fail('POSSE_TRAY_JSON_INVALID',400);
        bytes+=k.length*6+4;if(nodes+stack.length>=MAX_NODES||bytes>MAX_BYTES)fail('POSSE_TRAY_LIMIT',400);
        stack.push({v:d.value,depth:item.depth+1});}
    }else fail('POSSE_TRAY_JSON_INVALID',400);
    if(bytes>MAX_BYTES)fail('POSSE_TRAY_LIMIT',400);
  }
  const text=jsonCanonic(v);if(new TextEncoder().encode(text).length>MAX_BYTES)fail('POSSE_TRAY_LIMIT',400);
  return freeze(JSON.parse(text));
}
function bindingValid(b){
  exact(b,BINDING_KEYS);
  if(![b.preparedId,b.bridgeId,b.bridgeRevision,b.recordRevision].every(opaque)||!HASH.test(b.draftHash??''))fail('POSSE_TRAY_BINDING_INVALID',400);
  let u;try{u=new URL(b.remoteAccountIdentity);}catch{fail('POSSE_TRAY_BINDING_INVALID',400);}
  if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.href!==b.remoteAccountIdentity)fail('POSSE_TRAY_BINDING_INVALID',400);
}
function receiptValid(r,b){
  exact(r,['externalStatusId','externalUrl','accountIdentity']);
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(r.externalStatusId??'')||r.accountIdentity!==b.remoteAccountIdentity)fail('POSSE_TRAY_ACK_INVALID',503);
  let u;try{u=new URL(r.externalUrl);}catch{fail('POSSE_TRAY_ACK_INVALID',503);}
  if(u.protocol!=='https:'||u.origin!==new URL(b.remoteAccountIdentity).origin||u.username||u.password||u.hash||u.search||u.href!==r.externalUrl)fail('POSSE_TRAY_ACK_INVALID',503);
}
const keyOf=b=>jsonCanonic([b.bridgeId,b.preparedId]);
const view=events=>freeze({state:events.at(-1)?.state??'prepared',head:head(events),binding:events.at(-1)?.binding??null,
  receipt:events.at(-1)?.receipt??null,tombstone:events.at(-1)?.tombstone??null});
const body=e=>Object.fromEntries(Object.entries(e).filter(([k])=>k!=='hash'));
const challenge=(binding,h,action,nonce)=>({schema:SCHEMA,binding,journalHead:h,action,nonce});
const challengeHash=(b,h,a,n,subtle)=>sha256Hex(jsonCanonic(challenge(b,h,a,n)),subtle);
const canApprove=(previous,action)=>previous?.state==='approved'&&previous.action===action
  ||action==='publish'&&['prepared','media-pending'].includes(previous?.state)
  ||action==='revoke'&&previous?.receipt!==null&&previous?.receipt!==undefined&&['prepared','approved','published','media-pending'].includes(previous.state);
function targetBinding(events,b,action){
  if(action!=='revoke')return b;
  const publication=[...events].reverse().find(e=>e.state==='published'&&same(e.receipt,events.at(-1).receipt));
  if(!publication)fail('POSSE_TRAY_PUBLICATION_UNVERIFIED');return publication.binding;
}

/** A configured tray replaces public publish; the raw publisher is retained
 * only in this closure. captureContext returns a synchronous session guard.
 * Trusted key metadata may retain revokedAt for historical proof validation.
 * Revoked credentials cannot approve or dispatch a new action. */
export function creaSafataConformitatPosse({motor,journal,resolveAccount,claus,origen,rpId,captureContext,
  withdrawal=null,anchorFor=null,publishingEnabled=false,now=Date.now,subtle}={}){
  if(!motor||typeof motor.prepare!=='function'||typeof motor.publish!=='function'||typeof motor.listPrepared!=='function'
    ||typeof journal?.read!=='function'||typeof journal?.append!=='function'||typeof resolveAccount!=='function'
    ||!(Array.isArray(claus)||typeof claus==='function')||typeof origen!=='string'||new URL(origen).origin!==origen
    ||typeof rpId!=='string'||!rpId||typeof captureContext!=='function'||anchorFor!==null&&typeof anchorFor!=='function')throw TypeError('POSSE_TRAY_SERVER_CONFIGURATION_REQUIRED');
  const fixedKeys=Array.isArray(claus)?snapshot(claus):null;
  function operation(context,signal){const current=captureContext(context);if(typeof current!=='function')fail('POSSE_TRAY_CONTEXT_INVALID',403);
    return()=>{current();if(signal?.aborted)throw new DOMException('Operació cancel·lada.','AbortError');};}
  const instant=()=>{const ms=now();if(!Number.isFinite(ms)||Math.abs(ms)>8.64e15)fail('POSSE_TRAY_TIME_INVALID',400);const at=new Date(ms).toISOString();if(!iso(at))fail('POSSE_TRAY_TIME_INVALID',400);return at;};
  async function keysFor(context,b){return snapshot(fixedKeys??await claus(context,b));}
  async function verifyApproval(approval,b,h,action,at,keys){
    if(!approval||approval.tractor!==MANIFEST.id||approval.versio!==MANIFEST.versio||approval.nivell!=='signatura'||approval.decisio!=='aprovat'
      ||!iso(approval.data)||!iso(approval.caduca)||Date.parse(approval.caduca)-Date.parse(approval.data)>TTL
      ||Date.parse(approval.caduca)<=Date.parse(approval.data)||at<approval.data||at>=approval.caduca)fail('POSSE_TRAY_APPROVAL_INVALID',403);
    const known=keys.find(k=>k?.credencial===approval.prova?.credencial);
    if(!known||known.revokedAt!==undefined&&known.revokedAt!==null&&(!iso(known.revokedAt)||at>=known.revokedAt))fail('POSSE_TRAY_KEY_REVOKED',403);
    if(approval.empremta!==`sha256:${await challengeHash(b,h,action,approval.nonce,subtle)}`)fail('POSSE_TRAY_APPROVAL_BINDING',403);
    if((await verificaRegistre({registre:approval,claus:keys,origen,rpId,subtle})).valid!==true)fail('POSSE_TRAY_SIGNATURE_INVALID',403);
  }
  async function read(b,context,check){
    let raw;try{raw=await journal.read(keyOf(b),context);}catch{fail('POSSE_TRAY_JOURNAL_UNAVAILABLE',503);}check();
    if(!Array.isArray(raw)||raw.length>MAX_EVENTS)fail('POSSE_TRAY_JOURNAL_INVALID',503);
    const events=snapshot(raw),keys=await keysFor(context,b);check();const nonces=new Set();
    let previous=null,publishedBinding=null;
    for(const e of events){
      exact(e,EVENT_KEYS);bindingValid(e.binding);
      if(e.schema!==SCHEMA||!STATES.has(e.state)||!iso(e.at)||e.seq!==(previous?.seq??0)+1||e.previousHash!==(previous?.hash??null)
        ||typeof e.hash!=='string'||!HASH.test(e.hash)||await sha256Hex(jsonCanonic(body(e)),subtle)!==e.hash
        ||keyOf(e.binding)!==keyOf(b)||e.at>instant()||previous&&e.at<previous.at)fail('POSSE_TRAY_JOURNAL_INVALID',503);
      if(e.state==='prepared'){
        if(e.action!==null||e.approval!==null||e.tombstone!==null||!previous&&e.receipt!==null||previous&&(!['prepared','approved','published','media-pending'].includes(previous.state)
          ||!same(e.receipt,previous.receipt)))fail('POSSE_TRAY_TRANSITION_INVALID',503);
      }else{
        const expectedBinding=e.state==='approved'&&e.action==='revoke'?publishedBinding:previous?.binding;
        if(!previous||!same(e.binding,expectedBinding)||!['publish','revoke'].includes(e.action))fail('POSSE_TRAY_TRANSITION_INVALID',503);
        if(e.state==='approved'){
          if(!canApprove(previous,e.action)
            ||!same(e.receipt,previous.receipt)||e.tombstone!==null||nonces.has(e.approval?.nonce))fail('POSSE_TRAY_TRANSITION_INVALID',503);
          await verifyApproval(e.approval,e.binding,head([previous]),e.action,e.at,keys);nonces.add(e.approval.nonce);
        }else{
          if(e.state==='dispatching'?previous.state!=='approved':previous.state!=='dispatching')fail('POSSE_TRAY_TRANSITION_INVALID',503);
          if(e.state==='dispatching'&&e.at>=previous.approval.caduca)fail('POSSE_TRAY_APPROVAL_INVALID',403);
          if(e.action!==previous.action||!same(e.approval,previous.approval))fail('POSSE_TRAY_TRANSITION_INVALID',503);
          if(e.state==='published'&&e.action!=='publish'||e.state==='revoked'&&e.action!=='revoke'||e.state==='media-pending'&&e.action!=='publish')fail('POSSE_TRAY_TRANSITION_INVALID',503);
          if(e.state!=='revoked'&&e.tombstone!==null)fail('POSSE_TRAY_TRANSITION_INVALID',503);
          if(e.state==='revoked'){
            const tombstone={'@context':'https://www.w3.org/ns/activitystreams',type:'Tombstone',id:previous.receipt?.externalUrl,formerType:'Note',deleted:e.at};
            if(!same(e.receipt,previous.receipt)||!same(e.tombstone,tombstone))fail('POSSE_TRAY_TRANSITION_INVALID',503);
          }else if(e.state!=='published'&&!same(e.receipt,previous.receipt))fail('POSSE_TRAY_TRANSITION_INVALID',503);
        }
      }
      if(e.receipt!==null)receiptValid(e.receipt,e.binding);
      if(e.state==='published'&&e.receipt===null||e.state==='revoked'&&e.receipt===null)fail('POSSE_TRAY_ACK_INVALID',503);
      if(e.state==='published')publishedBinding=e.binding;
      previous=e;
    }
    if(anchorFor){const a=snapshot(await anchorFor(keyOf(b),context));check();if(a!==null){expectedHead(a);if(a.seq>0&&!events.some(e=>e.seq===a.seq&&e.hash===a.hash))fail('POSSE_TRAY_ANCHOR_ABSENT',503);}}
    return {events,keys};
  }
  async function append(events,b,state,action,approval,receipt,tombstone,context,check){
    if(events.length>=MAX_EVENTS)fail('POSSE_TRAY_LIMIT',400);check();const h=head(events),at=instant();
    if(events.length&&at<events.at(-1).at)fail('POSSE_TRAY_TIME_INVALID',400);
    const e={schema:SCHEMA,seq:h.seq+1,previousHash:h.hash,at,state,action,binding:b,approval,receipt,
      tombstone:state==='revoked'?{...tombstone,deleted:at}:tombstone};
    const event=snapshot({...e,hash:await sha256Hex(jsonCanonic(e),subtle)});check();
    let result;try{result=await journal.append(keyOf(b),event,{expectedHead:h},context);}
    catch(e){if(e?.code==='POSSE_TRAY_CAS_CHANGED')fail('POSSE_TRAY_CAS_CHANGED');fail('POSSE_TRAY_APPEND_UNCONFIRMED',503);}
    if(result?.committed!==true||!same(result.head,head([event])))fail('POSSE_TRAY_APPEND_UNCONFIRMED',503);
    return [...events,event];
  }
  async function freshBinding(row,context,check){
    const account=snapshot(await resolveAccount(row.bridgeId,context));check();
    if(row.bridgeRevision!==undefined&&account?.bridgeRevision!==row.bridgeRevision)fail('POSSE_TRAY_SOURCE_CHANGED');
    const b=snapshot({preparedId:row.preparedId,bridgeId:row.bridgeId,bridgeRevision:row.bridgeRevision??account.bridgeRevision,recordRevision:row.recordRevision,
      remoteAccountIdentity:account.remoteAccountIdentity,draftHash:row.draftHash});bindingValid(b);return b;
  }
  async function current(input,context,check){
    const rows=snapshot(await motor.listPrepared({bridgeId:input.bridgeId},context));check();
    const row=rows.find(r=>r.preparedId===input.preparedId);
    if(!row||row.stale||row.sourceUnavailable||row.state==='needs-primary-publication')fail('POSSE_TRAY_SOURCE_CHANGED');
    return {row,b:await freshBinding(row,context,check)};
  }
  async function prepare(input,context,{signal}={}){
    const request=snapshot(input),check=operation(context,signal);check();const row=snapshot(await motor.prepare(request,context));check();
    const b=await freshBinding(row,context,check),{events}=await read(b,context,check),previous=events.at(-1);
    if(previous&&['dispatching','indeterminate','revoked'].includes(previous.state))fail('POSSE_TRAY_RECONCILIATION_REQUIRED');
    const result=previous&&same(previous.binding,b)?events:await append(events,b,'prepared',null,null,previous?.receipt??null,null,context,check);
    check();return freeze({...row,conformitat:view(result)});
  }
  async function entry(input,context,check){
    exact(input,['bridgeId','preparedId','expectedHead']);expectedHead(input.expectedHead);
    // Read-only source authorization is required even when a removed source
    // is about to be withdrawn. listPrepared retains its remote identity.
    const rows=snapshot(await motor.listPrepared({bridgeId:input.bridgeId},context));check();
    const row=rows.find(r=>r.preparedId===input.preparedId);if(!row)fail('POSSE_TRAY_ENTRY_UNAVAILABLE',404);
    const account=snapshot(await resolveAccount(input.bridgeId,context));check();
    const provisional={preparedId:input.preparedId,bridgeId:input.bridgeId,bridgeRevision:row.bridgeRevision??account.bridgeRevision,
      recordRevision:row.recordRevision,remoteAccountIdentity:account.remoteAccountIdentity,draftHash:row.preparedDraftHash??row.draftHash};
    bindingValid(provisional);const data=await read(provisional,context,check);
    if(!data.events.length||!same(head(data.events),input.expectedHead))fail('POSSE_TRAY_CAS_CHANGED');
    const b=data.events.at(-1).binding;
    if(b.remoteAccountIdentity!==account.remoteAccountIdentity||b.bridgeRevision!==account.bridgeRevision)fail('POSSE_TRAY_SOURCE_CHANGED');
    return {...data,b};
  }
  async function preparaAprovacio(input,context,{signal}={}){
    const request=snapshot(input);exact(request,['bridgeId','preparedId','expectedHead','action']);
    const {action,...ref}=request,check=operation(context,signal);check();const data=await entry(ref,context,check),{events}=data,b=targetBinding(events,data.b,action);
    if(!canApprove(events.at(-1),action))fail('POSSE_TRAY_TRANSITION_INVALID');
    if(action==='revoke'&&(!withdrawal||typeof withdrawal.send!=='function'||typeof withdrawal.verifyAck!=='function'))fail('POSSE_TRAY_WITHDRAWAL_UNAVAILABLE',503);
    if(action==='publish'&&!same((await current(ref,context,check)).b,b))fail('POSSE_TRAY_SOURCE_CHANGED');
    const at=instant(),nonce=base64url(globalThis.crypto.getRandomValues(new Uint8Array(16))),empremta=`sha256:${await challengeHash(b,head(events),action,nonce,subtle)}`;check();
    const registre=preparaRegistre({manifest:MANIFEST,empremta,decisio:'aprovat',nivell:'signatura',ara:at,nonce});
    registre.caduca=new Date(Date.parse(at)+TTL).toISOString();return snapshot({registre,repte:challenge(b,head(events),action,nonce)});
  }
  async function aprova(input,context,{signal}={}){
    const request=snapshot(input);exact(request,['bridgeId','preparedId','expectedHead','action','aprovacio']);
    const {action,aprovacio,...ref}=request,check=operation(context,signal);check();const data=await entry(ref,context,check),{events,keys}=data,b=targetBinding(events,data.b,action),previous=events.at(-1);
    if(!canApprove(previous,action))fail('POSSE_TRAY_TRANSITION_INVALID');
    if(events.some(e=>e.state==='approved'&&e.approval.nonce===aprovacio.nonce))fail('POSSE_TRAY_NONCE_REPLAY',403);
    if(action==='publish'&&!same((await current(ref,context,check)).b,b))fail('POSSE_TRAY_SOURCE_CHANGED');
    await verifyApproval(aprovacio,b,head(events),action,instant(),keys);check();
    return view(await append(events,b,'approved',action,aprovacio,previous.receipt,null,context,check));
  }
  async function dispatch(input,context,{signal}={},action){
    if(publishingEnabled!==true)fail('POSSE_PUBLISH_DISABLED',503);
    if(action==='revoke'&&(!withdrawal||typeof withdrawal.send!=='function'||typeof withdrawal.verifyAck!=='function'))fail('POSSE_TRAY_WITHDRAWAL_UNAVAILABLE',503);
    const request=snapshot(input),check=operation(context,signal);check();const {events,b,keys}=await entry(request,context,check),previous=events.at(-1);
    if(previous.state!=='approved'||previous.action!==action)fail('POSSE_TRAY_APPROVAL_REQUIRED',403);
    await verifyApproval(previous.approval,b,head(events.slice(0,-1)),action,instant(),keys);check();
    if(action==='publish'&&!same((await current(request,context,check)).b,b))fail('POSSE_TRAY_SOURCE_CHANGED');
    let journalEvents=await append(events,b,'dispatching',action,previous.approval,previous.receipt,null,context,check);
    try{
      // Persistence or crypto may have outlived the authorization window or
      // a key revocation. Recheck before the first external side effect.
      const activeKeys=await keysFor(context,b);check();
      await verifyApproval(previous.approval,b,head(events.slice(0,-1)),action,instant(),activeKeys);check();
      let receipt=previous.receipt,state,tombstone=null;
      if(action==='publish'){
        const beforeMutation=async()=>{
          const currentKeys=await keysFor(context,b);check();
          await verifyApproval(previous.approval,b,head(events.slice(0,-1)),action,instant(),currentKeys);check();
          return()=>{check();if(instant()>=previous.approval.caduca)fail('POSSE_TRAY_APPROVAL_INVALID',403);};
        };
        const result=await motor.publish({bridgeId:b.bridgeId,preparedId:b.preparedId,bridgeRevision:b.bridgeRevision,recordRevision:b.recordRevision,draftHash:b.draftHash,confirm:true},context,{beforeMutation});check();
        if(result?.state==='media-pending')state='media-pending';
        else{if(result?.state!=='published')fail('POSSE_TRAY_ACK_INVALID',503);
          receipt=snapshot({externalStatusId:result.externalStatusId,externalUrl:result.externalUrl,accountIdentity:b.remoteAccountIdentity});receiptValid(receipt,b);state='published';}
      }else{
        receiptValid(receipt,b);const ack=snapshot(await withdrawal.send(snapshot({binding:b,receipt,operationId:journalEvents.at(-1).hash}),context,{signal}));check();
        if(ack?.withdrawn!==true||!same({externalStatusId:ack.externalStatusId,externalUrl:ack.externalUrl,accountIdentity:ack.accountIdentity},receipt)
          ||await withdrawal.verifyAck(ack,snapshot({binding:b,receipt}),context)!==true)fail('POSSE_TRAY_ACK_INVALID',503);check();
        state='revoked';tombstone={'@context':'https://www.w3.org/ns/activitystreams',type:'Tombstone',id:receipt.externalUrl,formerType:'Note',deleted:instant()};
      }
      journalEvents=await append(journalEvents,b,state,action,previous.approval,receipt,tombstone,context,check);check();return view(journalEvents);
    }catch{
      // Never erase a committed intent, even if a post-ACK append failed.
      // If this append also fails, dispatching itself blocks another send.
      if(journalEvents.at(-1)?.state==='dispatching')try{await append(journalEvents,b,'indeterminate',action,previous.approval,previous.receipt,null,context,()=>{});}catch{/* durable intent remains held */}
      fail('POSSE_TRAY_RECONCILIATION_REQUIRED',503);
    }
  }
  async function listPrepared(input,context,{signal}={}){
    const request=snapshot(input),check=operation(context,signal);check();const rows=snapshot(await motor.listPrepared(request,context));check();const result=[];
    for(const row of rows){const b=await freshBinding(row,context,check),data=await read(b,context,check);result.push(freeze({...row,conformitat:view(data.events)}));}return freeze(result);
  }
  async function queueHistorical(input,context,options){const request=snapshot(input);exact(request,['bridgeId','recordIds']);if(!Array.isArray(request.recordIds)||request.recordIds.length>20)fail('POSSE_BATCH_LIMIT',400);const publications=[];for(const recordId of request.recordIds)publications.push(await prepare({bridgeId:request.bridgeId,recordId},context,options));return freeze({state:'prepared-only',confirmationRequired:true,publications});}
  return Object.freeze({prepare,listPrepared,queueHistorical,preparaAprovacio,aprova,
    publish:(input,context,options)=>dispatch(input,context,options,'publish'),revoca:(input,context,options)=>dispatch(input,context,options,'revoke')});
}
