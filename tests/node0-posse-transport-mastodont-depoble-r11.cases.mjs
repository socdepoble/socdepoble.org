import test from 'node:test';
import assert from 'node:assert/strict';
import {creaTransportMastodontDepoble} from '../tooling/node0/posse/transport-mastodont-depoble.mjs';

const ROOT='https://mastodont.cat',ACTOR=ROOT+'/users/depoble',TOKEN='LAB_ONLY_FAKE_TOKEN',HASH='a'.repeat(64),KEY='sdp-posse-'+HASH;
const account={id:'42',username:'depoble',acct:'depoble',url:ROOT+'/@depoble',uri:ACTOR};
const scopes=['read:accounts','write:statuses','write:media'];
const remote=id=>({id,account:{id:'42',source:{private:'DO NOT EXPOSE'}},url:ROOT+'/@depoble/'+id,uri:ACTOR+'/statuses/'+id,visibility:'public'});
function adapter(options={}){
  const calls=[],rates=[];
  const fetchImpl=options.fetchImpl??(async(url,request)=>{
    calls.push({url,request});assert.ok(url.startsWith(ROOT+'/api/'));assert.equal(request.headers.Authorization,'Bearer '+TOKEN);assert.equal(request.redirect,'error');assert.equal(request.credentials,'omit');
    if(url.endsWith('/verify_credentials'))return Response.json(options.account??account);
    if(url.endsWith('/api/v2/media'))return Response.json({id:'50',type:'image',url:'https://files.mastodont.cat/public.png'},{status:options.mediaStatus??200});
    if(url.endsWith('/api/v1/media/50'))return options.processing?new Response(null,{status:206}):Response.json({id:'50',type:'image',url:'https://files.mastodont.cat/public.png'});
    if(url.includes('/api/v1/statuses'))return Response.json(remote(request.method==='PUT'?'900':'901'));
    assert.fail('unexpected endpoint');
  });
  const transport=creaTransportMastodontDepoble({fetchImpl,token:TOKEN,certifyScopes:async()=>({ok:true,scopes:options.scopes??scopes,proofSha256:HASH}),beforeMutation:options.beforeMutation??(async()=>({allowed:true})),noteRateLimit:async info=>{rates.push(info);},deadlineMs:options.deadlineMs??10000});
  return{transport,calls,rates};
}
const post=patch=>({leaseId:'lease1',operation:'create',externalStatusId:null,idempotencyKey:KEY,status:'Public article https://socdepoble.org/mur/article',visibility:'public',language:'ca',mediaIds:[],accountIdentity:ACTOR,...patch});

test('server preflight verifies token account and scopes before any mutation',async()=>{
  assert.deepEqual(adapter().transport.requiredScopes({media:false}),['read:accounts','write:statuses']);
  for(const options of[{account:{...account,username:'other'}},{scopes:['read:accounts']}]){
    const sample=adapter(options);await assert.rejects(sample.transport.preflight({requiredScopes:scopes}));assert.equal(sample.calls.filter(call=>call.request.method!=='GET').length,0);
  }
  const sample=adapter(),certificate=await sample.transport.preflight({requiredScopes:scopes});assert.equal(certificate.accountIdentity,ACTOR);assert.equal(JSON.stringify(certificate).includes(TOKEN),false);assert.equal(JSON.stringify(certificate).includes('source'),false);
});
test('credential and durable quota gates refuse media/status effects before POST',async()=>{
  const unverified=adapter();await assert.rejects(unverified.transport.publishStatus(post()),e=>e.effect==='not-dispatched');assert.equal(unverified.calls.length,0);
  const denied=adapter({beforeMutation:async()=>({allowed:false})});await denied.transport.preflight({requiredScopes:scopes});await assert.rejects(denied.transport.publishStatus(post()),e=>e.effect==='not-dispatched');assert.equal(denied.calls.length,1);
});
test('multipart v2 upload includes public bytes and description with fixed origin credentials',async()=>{
  const sample=adapter();await sample.transport.preflight({requiredScopes:scopes});const bytes=new Uint8Array([1,2,3]);
  const uploaded=await sample.transport.uploadMedia({leaseId:'lease1',bytes,mimeType:'image/png',description:'<p>Cartell públic</p>'});assert.deepEqual(uploaded,{id:'50',ready:true});
  const request=sample.calls.at(-1);assert.equal(request.url,ROOT+'/api/v2/media');assert.equal(request.request.method,'POST');assert.match(request.request.headers['Content-Type'],/^multipart\/form-data; boundary=sdp-posse-/);assert.equal(Buffer.isBuffer(request.request.body),true);assert.ok(request.request.body.includes(Buffer.from(bytes)));assert.ok(request.request.body.includes(Buffer.from('Cartell públic')));assert.equal(request.request.body.includes(Buffer.from('<p>')),false);assert.equal(request.request.headers['Content-Length'],String(request.request.body.length));
});
test('async202 media and GET206 remain pending and are never mistaken for a processed attachment',async()=>{
  const sample=adapter({mediaStatus:202,processing:true});await sample.transport.preflight({requiredScopes:scopes});
  assert.deepEqual(await sample.transport.uploadMedia({leaseId:'lease',bytes:new Uint8Array([1]),mimeType:'image/jpeg'}),{id:'50',ready:false});assert.deepEqual(await sample.transport.getMedia({id:'50'}),{id:'50',ready:false});
});
test('status creates use stable Idempotency-Key while later edits PUT the same verified remote ID',async()=>{
  const sample=adapter();await sample.transport.preflight({requiredScopes:scopes});const created=await sample.transport.publishStatus(post({mediaIds:['50']}));assert.equal(created.id,'901');assert.equal(created.accountIdentity,ACTOR);assert.equal(JSON.stringify(created).includes('DO NOT EXPOSE'),false);
  assert.equal(sample.calls.at(-1).request.headers['Idempotency-Key'],KEY);assert.deepEqual(JSON.parse(sample.calls.at(-1).request.body).media_ids,['50']);
  const edited=await sample.transport.publishStatus(post({operation:'update',externalStatusId:'900'}));assert.equal(edited.id,'900');assert.equal(sample.calls.at(-1).url,ROOT+'/api/v1/statuses/900');assert.equal(sample.calls.at(-1).request.method,'PUT');
});
test('untrusted IDs, origin aliases and malformed inputs never become bearer destinations',async()=>{
  const sample=adapter();await sample.transport.preflight({requiredScopes:scopes});
  for(const patch of[{operation:'update',externalStatusId:'https://evil.example'},{accountIdentity:'https://evil.example/users/depoble'},{mediaIds:['50/../secret']},{status:'\ud800'},{status:'x'.repeat(501)}])await assert.rejects(sample.transport.publishStatus(post(patch)),e=>e.effect==='not-dispatched');
  assert.equal(sample.calls.length,1);
});
test('remote private errors, redirects and invalid returned status identity never leak response details',async()=>{
  for(const response of[Response.json({error:'SECRET TOKEN SENTINEL'},{status:500}),Response.json({...remote('900'),account:{id:'foreign'}}),new Response('<html>SECRET BODY</html>',{headers:{'content-type':'text/html'}})]){
    let calls=0;const sample=adapter({fetchImpl:async()=>{calls++;return calls===1?Response.json(account):response;}});await sample.transport.preflight({requiredScopes:scopes});await assert.rejects(sample.transport.publishStatus(post()),e=>!e.message.includes('SECRET')&&!e.message.includes('foreign'));assert.equal(calls,2);
  }
});
test('late quota confirmation after deadline cannot invoke fetch or POST',async()=>{
  let release;const gate=new Promise(resolve=>{release=resolve;}),sample=adapter({deadlineMs:5,beforeMutation:async()=>{await gate;return{allowed:true};}});
  await sample.transport.preflight({requiredScopes:scopes});await assert.rejects(sample.transport.publishStatus(post()),e=>e.effect==='not-dispatched');release();await new Promise(resolve=>setImmediate(resolve));assert.equal(sample.calls.length,1);
});
