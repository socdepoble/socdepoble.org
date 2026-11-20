import test,{mock} from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {EventEmitter} from 'node:events';
import {resolXarxaPublica,fetchAmbResolucioPublica} from '../supabase/functions/ap-inbox-verifica/cuaLliurament.js';
import {creaObtenidor} from '../supabase/functions/ap-inbox-verifica/gestor.js';
import {esIpPublica,peticioMastodont} from '../tooling/node0/xarxa-node0.mjs';
import {creaTransportMastodontDepoble} from '../tooling/node0/posse/transport-mastodont-depoble.mjs';
const url='https://remote.example/document',dns=async(h,t)=>t==='A'?['8.8.8.8']:[];
test('R32.15 AP global fetch is fail-closed without a pinned provider, even with flag false',async()=>{
 const grant=await resolXarxaPublica('remote.example',{resolDns:dns});
 await assert.rejects(fetchAmbResolucioPublica(url,{redirect:'error'},{resolucio:grant,fetch:globalThis.fetch,requereixPinDns:false}),/dns_no_pinnat/);
 const getter=creaObtenidor({fetch:globalThis.fetch,resolDns:dns,ara:()=>1000});
 await assert.rejects(getter.obtenDocument(url),/dns_no_pinnat/);
});
test('R32.15 pinned provider receives immutable one-use public DNS snapshot; no native fallback',async()=>{
 const answer=['8.8.8.8'];let calls=0;const grant=await resolXarxaPublica('remote.example',{resolDns:async(h,t)=>t==='A'?answer:[]});answer[0]='127.0.0.1';
 const pinned=async(u,init,resolved)=>{calls++;assert.equal(u,url);assert.deepEqual(resolved.adreces,['8.8.8.8']);assert.ok(Object.isFrozen(resolved));assert.ok(Object.isFrozen(resolved.adreces));throw Error('pinned dial failed');};
 await assert.rejects(fetchAmbResolucioPublica(url,{redirect:'manual'},{resolucio:grant,fetch:()=>assert.fail('native fallback'),fetchPinnat:pinned}),/pinned dial failed/);
 await assert.rejects(fetchAmbResolucioPublica(url,{redirect:'manual'},{resolucio:grant,fetchPinnat:pinned}),/dns_concessio_invalida/);assert.equal(calls,1);
});
test('R32.15 forged, wrong-host and malformed DNS-family grants cannot dispatch',async()=>{
 for(const proof of[{estat:'publica',host:'remote.example',adreces:['8.8.8.8']},await resolXarxaPublica('another.example',{resolDns:dns})])await assert.rejects(fetchAmbResolucioPublica(url,{redirect:'error'},{resolucio:proof,fetch:()=>assert.fail('dispatched')}),/dns_concessio_invalida/);
 assert.equal((await resolXarxaPublica('remote.example',{resolDns:async()=>null})).estat,'desconeguda');
 assert.equal((await resolXarxaPublica('remote.example',{resolDns:async(h,t)=>t==='AAAA'?['8.8.8.8']:[]})).estat,'privada');
});
test('R32.15 Node0 POSSE uses the same complete public-address policy',()=>{
 for(const ip of['::ffff:8.8.8.8','4000::1','2001:1::1','2001:db8::1','3fff:1::1','192.88.99.1','100.64.0.1','169.254.169.254','2606:4700::1111%eth0'])assert.equal(esIpPublica(ip),false,ip);
 assert.equal(esIpPublica('2606:4700::1111'),true);
});
test('R32.15 Node0 real HTTPS boundary pins a frozen DNS snapshot to TLS lookup (no network)',async t=>{
 const answers=[{address:'8.8.8.8',family:4}];let lookedUp;
 const replacement=mock.method(https,'request',(target,options,onResponse)=>{
  assert.equal(target.hostname,'mastodont.cat');assert.equal(options.agent,false);assert.notEqual(options.rejectUnauthorized,false);
  answers[0].address='127.0.0.1'; // Rebinding after validation must not affect the socket lookup.
  const request=new EventEmitter();request.destroy=()=>{};
  request.end=()=>options.lookup(target.hostname,{family:4},(error,address,family)=>{
   assert.ifError(error);lookedUp={address,family};
   const incoming=new EventEmitter();incoming.statusCode=200;incoming.headers={'content-type':'text/plain'};incoming.complete=true;incoming.destroy=()=>{};
   onResponse(incoming);queueMicrotask(()=>{incoming.emit('data',Buffer.from('ok'));incoming.emit('end');});
  });return request;
 });t.after(()=>replacement.mock.restore());
 const response=await peticioMastodont('https://mastodont.cat/api/test',{resolver:async()=>answers});
 assert.deepEqual(lookedUp,{address:'8.8.8.8',family:4});assert.equal(await response.text(),'ok');
});
test('R32.15 invalid Node0 address family is rejected before HTTPS dispatch',async()=>{
 await assert.rejects(peticioMastodont('https://mastodont.cat/api/test',{resolver:async()=>[{address:'8.8.8.8',family:6}]}),/node0_remote_address_rejected/);
});
test('R32.15 POSSE expired certificates, clock rollback and NaN cannot authorize mutation',async()=>{
 let time=1000,calls=0;const actor='https://mastodont.cat/users/depoble',scopes=['read:accounts','write:statuses'];
 const transport=creaTransportMastodontDepoble({fetchImpl:async()=>{calls++;return Response.json({id:'42',username:'depoble',acct:'depoble',url:'https://mastodont.cat/@depoble',uri:actor});},token:'SYNTHETIC_PRIVATE_TOKEN',certifyScopes:async()=>({ok:true,scopes,proofSha256:'a'.repeat(64)}),beforeMutation:async()=>({allowed:true}),now:()=>time});
 await transport.preflight({requiredScopes:scopes});
 const op={leaseId:'lease',operation:'create',idempotencyKey:'sdp-posse-'+'a'.repeat(64),status:'Public',visibility:'public',language:'ca',accountIdentity:actor};
 for(const invalid of[999,301000,NaN]){time=invalid;await assert.rejects(transport.publishStatus(op),e=>e.effect==='not-dispatched');}assert.equal(calls,1);
});

test('R32.15 WebFinger refuses ambiguous self identities before account/status requests',async()=>{
 const {lligPublicacionsMastodon,COMPTE_MASTODON:C}=await import('../src/data/federacio/pontMastodon.js');
 const self={rel:'self',type:'application/activity+json',href:C.actor};
 for(const links of[[self,self],[self,{...self,href:'https://evil.example/actor'}],[{...self,href:'https://mastodont.cat/users/other'}]]){
  let calls=0;await assert.rejects(lligPublicacionsMastodon({fetchImpl:async()=>{calls++;return Response.json({subject:'acct:'+C.acct,links});}}),{code:'MASTODON_WEBFINGER_NO_VERIFICAT'});assert.equal(calls,1);
 }
});
test('R32.15 Mastodon and POSSE cannot use global/native external fetch',async()=>{
 const {lligRespostaMastodon}=await import('../src/data/federacio/pontMastodon.js');
 await assert.rejects(lligRespostaMastodon('https://mastodont.cat/api/test'),{code:'MASTODON_DNS_PIN_REQUERIT'});
 let calls=0;const response=await lligRespostaMastodon('https://mastodont.cat/api/test',{fetchPinnat:async()=>{calls++;return Response.json({pinned:true});}});assert.deepEqual(response,{pinned:true});assert.equal(calls,1);
 assert.throws(()=>creaTransportMastodontDepoble({fetchImpl:globalThis.fetch,token:'SYNTHETIC_PRIVATE_TOKEN',certifyScopes:async()=>{},beforeMutation:async()=>{}}),/POSSE_PRIVATE_ADAPTER_CONFIGURATION_REQUIRED/);
});
test('R32.15 OpenData server fetch requires pinned provider and forbids redirected bytes',async()=>{
 const {entradaOpenDataDelPoble}=await import('../src/data/entradaOpenDataDelPoble.js');
 const {construeixOutbox}=await import('../src/data/activitypub.js');
 const slug='la-torre-de-les-macanes',origen='https://socdepoble.org';
 const options={municipi:{slug,nom:'La Torre'},port:{teCapacitat:()=>false},origen,ara:'2026-11-19T12:00:00Z'};
 await assert.rejects(entradaOpenDataDelPoble(slug,options),/transport DNS\/TLS pinat/);
 let calls=0;const fetchPinnat=async(url,init)=>{calls++;assert.equal(url,origen+'/ap/outbox/'+slug+'.json');assert.equal(init.redirect,'error');return Response.json(construeixOutbox(slug,[],{origen}));};
 const result=await entradaOpenDataDelPoble(slug,{...options,fetchPinnat});assert.deepEqual(result.actorsPublicats,[slug]);assert.equal(calls,1);
 const redirected=Response.json(construeixOutbox(slug,[],{origen}));Object.defineProperty(redirected,'redirected',{value:true});
 await assert.rejects(entradaOpenDataDelPoble(slug,{...options,fetchImpl:async()=>redirected}),/Redirecció/);
});
test('R32.15 exported media URLs preserve the strict raw authority boundary',async()=>{
 const {imatgeDe}=await import('../src/data/exportaMunicipiOpenData.js');
 for(const value of['https://%65xample.com/photo.png','https://example.com\\@127.0.0.1/photo.png','https://127.1/photo.png','https://[::ffff:8.8.8.8]/photo.png','https://foo..example/photo.png','https://-bad.example/photo.png','https://'+'x'.repeat(64)+'.example/photo.png'])assert.equal(imatgeDe(value),null,value);
 assert.equal(imatgeDe('https://cdn.example.org/photo.png'),'https://cdn.example.org/photo.png');
});

test('R32.15 legacy Mastodon server and reconciliation reject native fetch before dispatch',async()=>{
 const {publicaAMastodonServidor}=await import('../tooling/node0/pont-mastodon-servidor.mjs');
 const {preparaReconciliacioMastodon}=await import('../tooling/node0/reconciliacio-mastodon-node0.mjs');
 const item={title:'Festa',summary:'Públic',visibility:'public',canonicalUrl:'https://socdepoble.cat/mur/festa'};
 await assert.rejects(publicaAMastodonServidor(item,{token:'SYNTHETIC_PRIVATE_TOKEN',fetchImpl:globalThis.fetch}),{code:'MASTODON_DNS_PIN_REQUERIT'});
 await assert.rejects(preparaReconciliacioMastodon({fetchImpl:globalThis.fetch}),/mastodon_reconciliation_dns_pin_required/);
 let calls=0;const self={rel:'self',type:'application/activity+json',href:'https://mastodont.cat/users/depoble'};
 await assert.rejects(preparaReconciliacioMastodon({fetchImpl:async()=>{calls++;return Response.json({subject:'acct:depoble@mastodont.cat',links:[self,self]});}}),/mastodon_reconciliation_webfinger/);assert.equal(calls,1);
});
