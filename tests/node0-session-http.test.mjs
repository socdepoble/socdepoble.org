import { test } from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import { creaSessioNodeZeroHttp } from '../src/data/local/sessioNodeZeroHttp.js';

const ENDPOINT='https://socdepoble.cat/api/v1/node0', ORIGIN='https://socdepoble.cat';
const ACTOR='11111111-1111-4111-8111-111111111111';
const ACTOR_B='22222222-2222-4222-8222-222222222222';
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const make=(fetchImpl,options={})=>creaSessioNodeZeroHttp({endpoint:ENDPOINT,origin:ORIGIN,fetchImpl,...options});
const code=(expected)=>error=>error.codi===expected;
function ambient(t,origin) {
  const previous=Object.getOwnPropertyDescriptor(globalThis,'location');
  Object.defineProperty(globalThis,'location',{configurable:true,value:{origin}});
  t.after(()=>previous?Object.defineProperty(globalThis,'location',previous):Reflect.deleteProperty(globalThis,'location'));
}

test('cookie transport uses ambient same origin; injected origin cannot bypass another page',t=>{
  ambient(t,'https://socdepoble.org');
  assert.throws(()=>make(()=>assert.fail('no fetch')),TypeError);
  assert.throws(()=>creaSessioNodeZeroHttp({endpoint:ENDPOINT,fetchImpl:()=>assert.fail('no fetch')}),TypeError);
});
test('same-origin page needs no injectable origin',async t=>{
  ambient(t,ORIGIN);
  const client=creaSessioNodeZeroHttp({fetchImpl:async()=>json({user:null})});
  assert.deepEqual(await client.demanaAuth('session'),{user:null}); client.destroy();
});
test('SSR requires an explicit fallback origin and cannot use a different origin',()=>{
  assert.throws(()=>creaSessioNodeZeroHttp({fetchImpl:()=>{}}),TypeError);
  assert.throws(()=>make(()=>{}, {origin:'https://socdepoble.org'}),TypeError);
});
test('endpoint rejects credentials, query, fragment, foreign path, nonlocal HTTP and malformed input',()=>{
  for(const endpoint of ['https://user:secret@socdepoble.cat/api/v1/node0','https://socdepoble.cat/api/v1/node0?token=secret','https://socdepoble.cat/api/v1/node0#token','https://socdepoble.cat/private','http://socdepoble.cat/api/v1/node0',' https://socdepoble.cat/api/v1/node0','https://socdepoble.cat/api\\v1\\node0']) assert.throws(()=>make(()=>{}, {endpoint}),TypeError);
});
test('explicit loopback HTTP fixture requires the matching origin',async()=>{
  const c=make(async()=>json({user:null}),{endpoint:'http://127.0.0.1:4340/api/v1/node0',origin:'http://127.0.0.1:4340'});
  assert.deepEqual(await c.demanaAuth('session'),{user:null}); c.destroy();
});
test('options reject secrets, unknown keys and accessor properties without invoking them',()=>{
  assert.throws(()=>make(()=>{}, {token:'SENTINEL'}),TypeError);
  let accessed=false;const options={origin:ORIGIN};Object.defineProperty(options,'fetchImpl',{enumerable:true,get(){accessed=true;return()=>{};}});
  assert.throws(()=>creaSessioNodeZeroHttp(options),TypeError);assert.equal(accessed,false);
});
test('session GET uses cookie transport without a cookie/Authorization header or body',async()=>{
  let request; const c=make(async(url,init)=>{request={url,init};return json({user:{id:'local-person'}});});
  assert.deepEqual(await c.demanaAuth('session'),{user:{id:'local-person'}});
  assert.equal(request.url,ENDPOINT+'/auth/session');assert.equal(request.init.method,'GET');
  assert.equal(request.init.credentials,'same-origin');assert.equal(request.init.mode,'same-origin');
  assert.equal(request.init.redirect,'error');assert.equal(request.init.cache,'no-store');
  assert.deepEqual(request.init.headers,{Accept:'application/json'});assert.equal(Object.hasOwn(request.init,'body'),false);c.destroy();
});
test('login POST sends exactly requested JSON and never exposes a response cookie',async()=>{
  let init;const c=make(async(_url,options)=>{init=options;return json({user:{id:'local-person'}});});
  assert.deepEqual(await c.demanaAuth('login',{email:'person@example.test',password:'private-input-only'}),{user:{id:'local-person'}});
  assert.equal(init.method,'POST');assert.equal(init.headers['Content-Type'],'application/json');
  assert.deepEqual(JSON.parse(init.body),{email:'person@example.test',password:'private-input-only'});c.destroy();
});
test('registration forwards consent metadata exactly, without adding owner or tenant identity',async()=>{
  let body;const c=make(async(_url,init)=>{body=JSON.parse(init.body);return json({verification_required:true},202);});
  const metadata={accepta_rgpd:true,versio_politica:'2026-11',full_name:'Public name'};
  assert.deepEqual(await c.demanaAuth('register',{email:'person@example.test',password:'private-input-only',metadata}),{verification_required:true});
  assert.deepEqual(body.metadata,metadata);assert.equal(Object.hasOwn(body.metadata,'tenant_id'),false);c.destroy();
});
test('private reads are POST and caller owner/user/tenant overrides fail before dispatch',async()=>{
  let calls=0;const c=make(async(url,init)=>{calls++;assert.equal(url,ENDPOINT+'/private/getProfile');assert.equal(init.method,'POST');return json(null);});
  assert.equal(await c.demanaPrivat('getProfile',{}, {expectedActor:ACTOR}),null);
  for(const input of [{owner_user_id:'foreign'},{userId:'foreign'},{tenantId:'foreign'}]) await assert.rejects(c.demanaPrivat('getProfile',input,{expectedActor:ACTOR}),TypeError);
  assert.equal(calls,1);c.destroy();
});
test('arbitrary RPC paths reject before fetch, including prototype keys',async()=>{
  let calls=0;const c=make(async()=>{calls++;return json({});});
  for(const name of ['../auth/login','__proto__','constructor','deleteProfile']) await assert.rejects(c.demanaPrivat(name),code('sense-capacitat'));
  await assert.rejects(c.demanaAuth('session',{password:'SENTINEL'}),TypeError);assert.equal(calls,0);c.destroy();
});
test('note input is captured before asynchronous dispatch and caller mutation does not change it',async()=>{
  let captured;const c=make(async(_url,init)=>{captured=JSON.parse(init.body);return json({id:'created'});});
  const input={input:{title:'Original',tags:['original']}};
  const pending=c.demanaPrivat('createNote',input,{expectedActor:ACTOR});input.input.title='Changed';input.input.tags.push('changed');
  await pending;assert.deepEqual(captured,{input:{title:'Original',tags:['original']}});c.destroy();
});
test('nested getters and cyclic/non-JSON input reject without invoking getters or fetch',async()=>{
  let accessed=false,calls=0;const c=make(async()=>{calls++;return json({});});
  const updates={};Object.defineProperty(updates,'title',{enumerable:true,get(){accessed=true;return'SENTINEL';}});
  await assert.rejects(c.demanaPrivat('updateNote',{updates,id:'id',expectedRevision:0},{expectedActor:ACTOR}),TypeError);
  const cyclic={};cyclic.self=cyclic;await assert.rejects(c.demanaPrivat('updateProfile',{updates:cyclic},{expectedActor:ACTOR}),TypeError);
  await assert.rejects(c.demanaPrivat('updateProfile',{updates:{bio:undefined}},{expectedActor:ACTOR}),TypeError);
  assert.equal(accessed,false);assert.equal(calls,0);c.destroy();
});
test('known server error is separate from user-facing generic text; arbitrary details are not copied',async()=>{
  const c=make(async()=>json({error:'credentials_invalid',details:'SENTINEL'},401));
  await assert.rejects(c.demanaAuth('login',{email:'x@example.test',password:'private'}),e=>e.codi==='sense-permis'&&e.status===401&&e.serverCode==='credentials_invalid'&&!JSON.stringify(e).includes('SENTINEL'));
  c.destroy();const d=make(async()=>json({error:'SENTINEL',password:'SENTINEL'},503));
  await assert.rejects(d.demanaAuth('session'),e=>e.codi==='NODE0_HTTP'&&e.serverCode===undefined&&!e.message.includes('SENTINEL'));d.destroy();
});
test('redirected, cross-URL, non-JSON and malformed UTF-8 responses fail closed',async()=>{
  const cases=[()=>{const r=json({});Object.defineProperty(r,'redirected',{value:true});return r;},()=>{const r=json({});Object.defineProperty(r,'url',{value:'https://evil.example/private'});return r;},()=>new Response('SENTINEL',{headers:{'Content-Type':'text/html'}}),()=>new Response(Uint8Array.from([0xc0,0xaf]),{headers:{'Content-Type':'application/json'}})];
  for(const fetchImpl of cases){const c=make(fetchImpl);await assert.rejects(c.demanaAuth('session'),code('BACKEND_RESPOSTA_INVALIDA'));c.destroy();}
});
test('response byte budget applies to advertised and streamed body size',async()=>{
  for(const response of [()=>new Response('{}',{headers:{'Content-Type':'application/json','Content-Length':'2097153'}}),()=>json({value:'x'.repeat(2097153)})]){
    const c=make(response);await assert.rejects(c.demanaAuth('session'),code('BACKEND_RESPOSTA_INVALIDA'));c.destroy();
  }
});
test('transport exceptions never expose fetch details',async()=>{
  const c=make(async()=>{throw new Error('SENTINEL');});
  await assert.rejects(c.demanaAuth('session'),e=>e.codi==='backend-inabastable'&&!e.message.includes('SENTINEL')&&e.cause===undefined);c.destroy();
});
test('coded transport exceptions cannot masquerade as locally normalized errors',async()=>{
  const c=make(async()=>{throw Object.assign(new Error('PRIVATE_SENTINEL'),{codi:'NODE0_HTTP',serverCode:'credentials_invalid',status:401});});
  await assert.rejects(c.demanaAuth('session'),e=>e.codi==='backend-inabastable'&&!e.message.includes('PRIVATE_SENTINEL')&&e.serverCode===undefined);c.destroy();
  const d=make(()=>new Response(new ReadableStream({start(controller){controller.error(Object.assign(new Error('PRIVATE_READER_SENTINEL'),{codi:'NODE0_HTTP'}));}}),{headers:{'Content-Type':'application/json'}}));
  await assert.rejects(d.demanaAuth('session'),e=>e.codi==='BACKEND_RESPOSTA_INVALIDA'&&!e.message.includes('PRIVATE_READER_SENTINEL'));d.destroy();
});
test('deadline settles even when fetch ignores its AbortSignal',async()=>{
  const c=make(()=>new Promise(()=>{}),{timeoutMs:15});await assert.rejects(c.demanaAuth('session'),code('backend-inabastable'));c.destroy();
});
test('deadline cancels a reader stalled after headers',async()=>{
  let cancelled=false;const c=make(()=>new Response(new ReadableStream({pull(){return new Promise(()=>{});},cancel(){cancelled=true;}}),{headers:{'Content-Type':'application/json'}}),{timeoutMs:20});
  await assert.rejects(c.demanaAuth('session'),code('backend-inabastable'));assert.equal(cancelled,true);c.destroy();
});
test('pre-abort and abort before dispatch never invoke fetch',async()=>{
  let calls=0;const c=make(async()=>{calls++;return json({});});
  const before=new AbortController();before.abort();await assert.rejects(c.demanaAuth('session',{}, {signal:before.signal}),{name:'AbortError'});
  const controller=new AbortController();const pending=c.demanaAuth('session',{}, {signal:controller.signal});controller.abort();await assert.rejects(pending,{name:'AbortError'});
  assert.equal(calls,0);c.destroy();
});
test('destroy aborts in-flight work and prevents all future operations',async()=>{
  let started;const barrier=new Promise(resolve=>{started=resolve;});
  const c=make(()=>{started();return new Promise(()=>{});});const pending=c.demanaAuth('session');await barrier;c.destroy();c.destroy();
  await assert.rejects(pending,code('NODE0_TANCAT'));await assert.rejects(c.demanaPrivat('getProfile'),code('NODE0_TANCAT'));
});
test('no cookie, localStorage, sessionStorage or document access occurs',async t=>{
  for(const key of ['localStorage','sessionStorage','document']) {
    const previous=Object.getOwnPropertyDescriptor(globalThis,key);Object.defineProperty(globalThis,key,{configurable:true,get(){throw new Error('private browser state read: '+key);}});
    t.after(()=>previous?Object.defineProperty(globalThis,key,previous):Reflect.deleteProperty(globalThis,key));
  }
  const c=make(async()=>json({logged_out:true}));assert.deepEqual(await c.demanaAuth('logout',{}, {expectedActor:ACTOR}),{logged_out:true});c.destroy();
});
test('all private and bound auth calls require a UUID expected actor before fetch',async()=>{
  let calls=0;const c=make(async()=>{calls++;return json({});});
  for(const actor of [undefined,'','invalid',ACTOR+','+ACTOR_B]){
    const config=actor===undefined?{}:{expectedActor:actor};
    await assert.rejects(c.demanaPrivat('getProfile',{},config),e=>e.codi==='actor_binding_required'&&e.status===409);
    for(const action of ['logout','password','norms','norms-state'])await assert.rejects(c.demanaAuth(action,{},config),code('actor_binding_required'));
  }
  assert.equal(calls,0);c.destroy();
});
test('expected actor is captured before await, canonicalized and sent only as a comparison header',async()=>{
  let captured;const actor='AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA';
  const c=make(async(_url,init)=>{captured=init;return json(null);});
  const config={expectedActor:actor};const pending=c.demanaPrivat('getProfile',{},config);config.expectedActor=ACTOR_B;
  await pending;assert.equal(captured.headers['X-SDP-Expected-Actor'],actor.toLowerCase());
  assert.deepEqual(JSON.parse(captured.body),{});assert.equal(captured.headers.Cookie,undefined);assert.equal(captured.headers.Authorization,undefined);c.destroy();
});
test('bound auth carries expected actor but unbound auth rejects accidental actor binding',async()=>{
  const requests=[];const c=make(async(url,init)=>{requests.push({url,init});return json({});});
  for(const action of ['logout','password','norms','norms-state'])await c.demanaAuth(action,{}, {expectedActor:ACTOR});
  assert.ok(requests.every(request=>request.init.headers['X-SDP-Expected-Actor']===ACTOR));
  for(const action of ['login','register','session','policy','verify-email','resend-verification'])await assert.rejects(c.demanaAuth(action,{}, {expectedActor:ACTOR}),TypeError);
  assert.equal(requests.length,4);c.destroy();
});
test('call config forbids arbitrary headers, cookies, secrets and actor accessors',async()=>{
  let accessed=false,calls=0;const c=make(async()=>{calls++;return json({});});
  for(const extra of [{headers:{'X-SDP-Expected-Actor':ACTOR_B}},{cookie:'opaque'},{token:'secret'},{owner:ACTOR_B}])await assert.rejects(c.demanaPrivat('getProfile',{}, {expectedActor:ACTOR,...extra}),TypeError);
  const config={};Object.defineProperty(config,'expectedActor',{enumerable:true,get(){accessed=true;throw new Error('must not read');}});
  await assert.rejects(c.demanaPrivat('getProfile',{},config),TypeError);assert.equal(accessed,false);assert.equal(calls,0);c.destroy();
});
test('role read and organization creation use fixed routes and exact DTO bodies',async()=>{
  const requests=[];const c=make(async(url,init)=>{requests.push({url,init});return json(url.endsWith('/elMeuRol')?'usuari':{id:'fixture-created'});});
  assert.equal(await c.demanaPrivat('elMeuRol',{}, {expectedActor:ACTOR}),'usuari');
  const organization={kind:'entity',name:'Fixture',slug:'fixture',town_name:'Municipi'};
  assert.deepEqual(await c.demanaPrivat('createOrganization',{organization},{expectedActor:ACTOR}),{id:'fixture-created'});
  assert.equal(requests[1].url,ENDPOINT+'/private/createOrganization');assert.deepEqual(JSON.parse(requests[1].init.body),{organization});
  await assert.rejects(c.demanaPrivat('createOrganization',{organization,userId:ACTOR_B},{expectedActor:ACTOR}),TypeError);assert.equal(requests.length,2);c.destroy();
});
test('actor-binding rejection codes are allowlisted without copying server diagnostics',async()=>{
  for(const serverCode of ['actor_binding_required','session_actor_changed']){
    const c=make(async()=>json({error:serverCode,details:'SENTINEL'},409));
    await assert.rejects(c.demanaPrivat('getProfile',{}, {expectedActor:ACTOR}),e=>e.status===409&&e.serverCode===serverCode&&!e.message.includes('SENTINEL')&&!JSON.stringify(e).includes('SENTINEL'));c.destroy();
  }
});
test('publication persistence has an explicit route and forwards only its submission envelope',async()=>{
  const requests=[];const c=make(async(url,init)=>{requests.push({url,init});return json({id:ACTOR});});
  const submission={id:ACTOR,sectionId:'mur',title:'Fixture',payload:{post_content:'<p>Fixture</p>'},actor:{tipus:'persona'}};
  await c.demanaPrivat('appendSectionSubmissionNetworkOnly',{submission},{expectedActor:ACTOR});
  assert.equal(requests[0].url,ENDPOINT+'/private/appendSectionSubmissionNetworkOnly');assert.equal(requests[0].init.headers['X-SDP-Expected-Actor'],ACTOR);assert.deepEqual(JSON.parse(requests[0].init.body),{submission});
  await assert.rejects(c.demanaPrivat('appendSectionSubmissionNetworkOnly',{submission,ownerUserId:ACTOR_B},{expectedActor:ACTOR}),TypeError);assert.equal(requests.length,1);c.destroy();
});
test('section cursor preserves PostgreSQL microseconds and is captured before dispatch',async()=>{
  let captured;const c=make(async(_url,init)=>{captured=JSON.parse(init.body);return json({rows:[],complete:true,nextCursor:null});});
  const body={sectionId:'mur',cursor:{createdAt:'2026-11-04T10:20:30.123456+00:00',id:ACTOR},limit:17};
  const pending=c.demanaPrivat('loadSeccioPage',body,{expectedActor:ACTOR});body.cursor.createdAt='2000-01-01T00:00:00Z';body.limit=50;
  await pending;assert.deepEqual(captured,{sectionId:'mur',cursor:{createdAt:'2026-11-04T10:20:30.123456+00:00',id:ACTOR},limit:17});c.destroy();
});
test('norms-state reads the server version through POST with actor binding and no caller version',async()=>{
  let captured;const c=make(async(url,init)=>{captured={url,init};return json({versio:'2026-10-24',acceptada_al:null});});
  assert.deepEqual(await c.demanaAuth('norms-state',{}, {expectedActor:ACTOR}),{versio:'2026-10-24',acceptada_al:null});
  assert.equal(captured.url,ENDPOINT+'/auth/norms-state');assert.equal(captured.init.method,'POST');assert.equal(captured.init.headers['X-SDP-Expected-Actor'],ACTOR);
  await assert.rejects(c.demanaAuth('norms-state',{version:'1900-01-01'},{expectedActor:ACTOR}),TypeError);c.destroy();
});
test('genuine cross-realm byte chunks pass but forged Uint8Array-shaped objects fail closed',async()=>{
  const bytes=[...new TextEncoder().encode('{"user":null}')];
  const foreign=runInNewContext('Uint8Array.from(values)',{values:bytes});assert.equal(foreign instanceof Uint8Array,false);
  const c=make(()=>new Response(new ReadableStream({start(controller){controller.enqueue(foreign);controller.close();}}),{headers:{'Content-Type':'application/json'}}));
  assert.deepEqual(await c.demanaAuth('session'),{user:null});c.destroy();
  const forged={byteLength:bytes.length,[Symbol.toStringTag]:'Uint8Array'};
  const d=make(()=>new Response(new ReadableStream({start(controller){controller.enqueue(forged);controller.close();}}),{headers:{'Content-Type':'application/json'}}));
  await assert.rejects(d.demanaAuth('session'),code('BACKEND_RESPOSTA_INVALIDA'));d.destroy();
});
test('non-byte views fail despite forged tags and the byte limit uses intrinsic length',async()=>{
  const byteCount=2*1024*1024+1;
  const cases=[new DataView(new ArrayBuffer(2)),new Uint16Array(2),new Uint8ClampedArray(2),runInNewContext('new Uint16Array(2)')];
  for(const view of cases){
    Object.defineProperty(view,Symbol.toStringTag,{value:'Uint8Array'});
    const c=make(()=>new Response(new ReadableStream({start(controller){controller.enqueue(view);controller.close();}}),{headers:{'Content-Type':'application/json'}}));
    await assert.rejects(c.demanaAuth('session'),code('BACKEND_RESPOSTA_INVALIDA'));c.destroy();
  }
  const large=new Uint8Array(byteCount);Object.defineProperty(large,'byteLength',{value:0});
  const d=make(()=>new Response(new ReadableStream({start(controller){controller.enqueue(large);controller.close();}}),{headers:{'Content-Type':'application/json'}}));
  await assert.rejects(d.demanaAuth('session'),code('BACKEND_RESPOSTA_INVALIDA'));d.destroy();
});
