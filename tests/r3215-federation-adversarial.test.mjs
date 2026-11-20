import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,webcrypto} from 'node:crypto';
import {esIpNoPublica} from '../supabase/functions/noticies/gestor.js';
import {xarxaDe} from '../supabase/functions/ap-inbox-verifica/cuaLliurament.js';
import {cadenaDeSignatura,digestSha256,verificaSignaturaHttpActivityPub,clauDeDocumentActor,urlRemota} from '../src/data/federacio/inboxActivityPub.js';
import {creaCuaOperacionsOffline,reconciliaConflicteOffline} from '../src/data/cuaOperacionsOffline.js';
const now=Date.UTC(2026,10,19,17), actor='https://remote.example/users/a',keyId=actor+'#main-key',path='/ap/inbox/poble';
const pair=generateKeyPairSync('ed25519'),pem=pair.publicKey.export({type:'spki',format:'pem'});
const profile={id:actor,inbox:actor+'/inbox',publicKey:{id:keyId,owner:actor,publicKeyPem:pem}};
async function request({when=now,digest=null,expires=null,created=null}={}){
 const body=JSON.stringify({id:actor+'/activities/1',type:'Follow',actor,object:'https://local.example/ap/actors/poble.json'});
 const headers={host:'local.example',date:new Date(when).toUTCString(),digest:await digestSha256(body)};
 if(digest)headers.digest=digest(headers.digest);
 const names=created===null?['(request-target)','host','date','digest']:['(request-target)','host','(created)',...(expires===null?[]:['(expires)']),'digest'];
 const string=cadenaDeSignatura({metode:'POST',cami:path,capcaleres:headers,noms:names,created,expires});
 headers.signature=`keyId="${keyId}",algorithm="hs2019",headers="${names.join(' ')}",signature="${sign(null,Buffer.from(string),pair.privateKey).toString('base64')}"${created===null?'':`,created=${created}`}${expires===null?'':`,expires=${expires}`}`;
 return {metode:'POST',cami:path,capcaleres:headers,cos:body};
}
const verify=async(req,extra={})=>verificaSignaturaHttpActivityPub({...req,ara:now,obtenClauPublica:async()=>({clau:profile.publicKey,documentActor:profile}),hostEsperat:'local.example',...extra});
const forbidden=['0.0.0.0','10.255.255.255','100.64.0.0','100.127.255.255','127.255.255.255','169.254.169.254','172.16.0.0','172.31.255.255','192.0.0.1','192.0.2.1','192.168.255.255','198.18.0.1','198.19.255.255','198.51.100.1','203.0.113.1','224.0.0.1','255.255.255.255','::1','fc00::','fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff','fe80::1','febf::1','::ffff:8.8.8.8','::ffff:808:808','4000::1','8.008.8.8','2606:4700::1111%eth0'];
for(const ip of forbidden)test(`R32.15 SSRF blocks ${ip}`,()=>assert.equal(esIpNoPublica(ip),true));
for(const ip of['8.8.8.8','93.184.216.34','100.128.0.1','172.32.0.1','2606:4700:4700::1111','2001:4860:4860::8888'])test(`R32.15 global address ${ip}`,()=>assert.equal(esIpNoPublica(ip),false));
test('R32.15 DNS mixed public+private/invalid answers fail closed before fetch',async()=>{
 assert.equal(await xarxaDe('remote.example',{resolDns:async(h,type)=>type==='A'?['8.8.8.8']:['::ffff:8.8.8.8']}),'privada');
 assert.equal(await xarxaDe('remote.example',{resolDns:async()=>[]}),'desconeguda');
});
test('R32.15 signature window is at most +/-300 seconds even with signed long expires',async()=>{
 for(const offset of[-300000,0,300000])assert.equal((await verify(await request({when:now+offset}))).valida,true);
 for(const offset of[-301000,301000])assert.equal((await verify(await request({when:now+offset}))).valida,false);
 assert.equal((await verify(await request({created:now/1000-301,expires:now/1000+3600}))).valida,false);
});
test('R32.15 signature Digest has one unambiguous exact SHA256 value',async()=>{
 assert.equal((await verify(await request())).valida,true);
 for(const digest of[d=>`${d}, SHA-256=${'A'.repeat(43)}=`,d=>`${d}, ${d}`,d=>d.slice(0,-1),d=>d.replace('SHA-256=','SHA-256= ')])assert.equal((await verify(await request({digest}))).valida,false);
});
test('R32.15 key identity rejects duplicate same keyId declarations',()=>{
 assert.ok(clauDeDocumentActor(profile,keyId));
 assert.equal(clauDeDocumentActor({...profile,publicKey:[profile.publicKey,profile.publicKey]},keyId),null);
});
test('R32.15 URL rejects encoded host, slash ambiguity and controls',()=>{
 for(const url of['https://re%6dote.example/u','https://remote.example\\@evil.example/u','https://remote.example/\nkey'])assert.equal(urlRemota(url),null);
});
const scope={persona:'a',tenant:'p',endpoint:'https://node.example',mode:'remote'};
const make=(memoria,ara)=>creaCuaOperacionsOffline({abast:scope,nodeId:'A',motor:'memoria',memoria,crypto:webcrypto,ara});
const mutation={resource:'notes',recordId:'1',action:'update',changes:{title:'u'}};
test('R32.15 offline live lease cannot be stolen when a second clock rewinds',async()=>{
 const mem=new Map(),q=make(mem,()=>1000),q2=make(mem,()=>1);await q.enqueueOfflineMutation(mutation);
 let entered,done;const started=new Promise(r=>entered=r),release=new Promise(r=>done=r);let calls=0;
 const port={capacitats:{idempotenciaOffline:true},applyOfflineMutation:async op=>{calls++;entered();await release;return {opId:op.opId,committed:true};}};
 const first=q.drainOfflineQueue(port);await started;
 try{assert.equal((await q2.drainOfflineQueue(port)).status,'busy');assert.equal(calls,1);}finally{done();await first;q.close();q2.close();}
});
test('R32.15 identical causal point with contradictory content is rejected deterministically',()=>{
 const hlc={wallTime:1000,counter:1,nodeId:'A'};
 const op={...mutation,hlc};const other={resource:'notes',recordId:'1',values:{title:'v'},hlc};
 assert.throws(()=>reconciliaConflicteOffline(op,other),{code:'OFFLINE_CAUSAL_INCONSISTENCY'});
});

test('R32.15 duplicate RNG operation IDs never corrupt the durable chain',async()=>{
 const memoria=new Map(),q=creaCuaOperacionsOffline({abast:scope,nodeId:'A',motor:'memoria',memoria,ara:()=>1000,crypto:{subtle:webcrypto.subtle,randomUUID:()=> 'same-operation'}});
 try{await q.enqueueOfflineMutation(mutation);await assert.rejects(q.enqueueOfflineMutation({...mutation,changes:{title:'v'}}),{code:'OFFLINE_DUPLICATE_OPERATION_ID'});assert.equal((await q.verifyOfflineQueueChain()).valid,true);assert.equal((await q.peekOfflineQueue()).entries.length,1);}finally{q.close();}
});
test('R32.15 offline retry after an ambiguous commit replays the same ID with one remote effect',async()=>{
 const q=make(new Map(),()=>1000),applied=new Set();let effects=0,calls=0;
 const op=await q.enqueueOfflineMutation(mutation);
 const port={capacitats:{idempotenciaOffline:true},applyOfflineMutation:async x=>{calls++;if(!applied.has(x.opId)){applied.add(x.opId);effects++;throw Object.assign(new Error('lost response'),{code:'NETWORK_ERROR'});}return{opId:x.opId,committed:true};}};
 try{assert.equal((await q.drainOfflineQueue(port)).status,'retryable');assert.equal((await q.drainOfflineQueue(port)).acknowledged,1);assert.deepEqual([...applied],[op.opId]);assert.equal(effects,1);assert.equal(calls,2);assert.equal((await q.verifyOfflineQueueChain()).valid,true);}finally{q.close();}
});
test('R32.15 contradictory same field-clock is rejected regardless of distinct envelope clocks',()=>{
 const clock={wallTime:100,counter:1,nodeId:'A'},op={...mutation,hlc:{...clock,wallTime:200},fieldClocks:{title:clock}},remote={resource:'notes',recordId:'1',values:{title:'other'},hlc:{...clock,wallTime:300},fieldClocks:{title:clock}};
 assert.throws(()=>reconciliaConflicteOffline(op,remote),{code:'OFFLINE_CAUSAL_INCONSISTENCY'});
});

test('R32.15 concurrent textual edits converge in both directions with clock skew and HLC tie',()=>{
 for(const [aClock,bClock] of[[{wallTime:1000,counter:0,nodeId:'A'},{wallTime:1000,counter:0,nodeId:'B'}],[{wallTime:80000,counter:0,nodeId:'A'},{wallTime:1,counter:99,nodeId:'B'}]]){
  const a={...mutation,changes:{title:'A'},hlc:aClock,version:{A:1},fieldClocks:{title:aClock}};
  const b={...mutation,changes:{title:'B'},hlc:bClock,version:{B:1},fieldClocks:{title:bClock}};
  const record=op=>({resource:op.resource,recordId:op.recordId,values:op.changes,hlc:op.hlc,version:op.version,fieldClocks:op.fieldClocks});
  const ab=reconciliaConflicteOffline(a,record(b)),ba=reconciliaConflicteOffline(b,record(a));
  assert.deepEqual(ab.record,ba.record);assert.equal(ab.concurrent,true);assert.equal(ba.concurrent,true);assert.ok(ab.conflictCopy);assert.ok(ba.conflictCopy);
 }
});
