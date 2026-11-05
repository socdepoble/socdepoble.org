import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {creaGestorHttpPosse} from '../tooling/node0/http-posse-node0.mjs';
import {creaServidor} from '../tooling/node0/servidor-node0-soberania.mjs';

const UUID='00000000-0000-4000-8000-000000000001',OTHER='00000000-0000-4000-8000-000000000002';
const token=Buffer.alloc(32,7).toString('base64url'),headers={origin:'https://socdepoble.cat',cookie:'__Host-sdp-node0='+token,'x-sdp-expected-actor':UUID};
const body={bridgeId:UUID,bridgeRevision:'1',preparedId:'p1',recordRevision:'1',draftHash:'a'.repeat(64),confirm:true};
function fixture({enabled=true,failure=null}={}){
  const calls=[];
  const handler=creaGestorHttpPosse({publishingEnabled:enabled,creaMotorPerSessio:async context=>{
    calls.push({factory:context});
    const invoke=async(operation,input,ctx)=>{calls.push({operation,input,context:ctx});if(failure)throw failure;return operation==='listPrepared'?[]:{state:operation==='publish'?'published':'prepared-only'};};
    return{motor:Object.fromEntries(['listPrepared','publish','prepare','queueHistorical'].map(op=>[op,(input,ctx)=>invoke(op,input,ctx)])),prepareCurrent:async(input,ctx)=>invoke('prepareCurrent',input,ctx)};
  }});
  return{handler,calls};
}
test('POSSE requires the opaque cookie and expected user before constructing a session-bound repository',async()=>{
  const s=fixture();
  for(const[patch,status]of[[{cookie:''},401],[{'x-sdp-expected-actor':''},409],[{origin:'https://socdepoble.org'},403]]){
    const result=await s.handler.handle('publish',{headers:{...headers,...patch},body});assert.equal(result.status,status);
  }
  assert.deepEqual(s.calls,[]);
});
test('POSSE confirmation accepts exact revisions and hash, never draft text, secrets or permissions',async()=>{
  const s=fixture();
  for(const patch of[{confirm:false},{confirm:'true'},{draftHash:'bad'},{status:'forged'},{authorId:OTHER},{token:'must not pass'},{allowCommercial:true}])assert.equal((await s.handler.handle('publish',{headers,body:{...body,...patch}})).status,409);
  assert.equal(s.calls.length,0);
  assert.equal((await s.handler.handle('publish',{headers,body})).status,200);
  assert.equal(s.calls[0].factory.expectedActor,UUID);assert.match(s.calls[0].factory.sessionHash,/^[a-f0-9]{64}$/);
  assert.ok(Object.isFrozen(s.calls[0].factory));assert.equal(JSON.stringify(s.calls).includes(token),false);
});
test('a disabled publisher never reaches a transport-capable factory; aliases share one action',async()=>{
  const disabled=fixture({enabled:false});assert.equal((await disabled.handler.handle('publish',{headers,body})).status,503);assert.equal(disabled.calls.length,0);
  const s=fixture();for(const action of['publish','publica'])assert.equal((await s.handler.handle(action,{headers,body})).status,200);
  assert.deepEqual(s.calls.filter(c=>c.operation).map(c=>c.operation),['publish','publish']);
});
test('conformity must be an explicit own JSON property even when a prototype is polluted',async()=>{
  const s=fixture(),missing={...body};delete missing.confirm;
  const before=Object.getOwnPropertyDescriptor(Object.prototype,'confirm');
  try{
    Object.defineProperty(Object.prototype,'confirm',{value:true,configurable:true});
    assert.equal((await s.handler.handle('publish',{headers,body:missing})).status,409);
    assert.equal(s.calls.length,0);
  }finally{if(before)Object.defineProperty(Object.prototype,'confirm',before);else Reflect.deleteProperty(Object.prototype,'confirm');}
});
test('current tray refresh is preparation only; history batches cannot smuggle a publisher flag',async()=>{
  const s=fixture();assert.equal((await s.handler.handle('preparades',{headers,query:{bridgeId:UUID}})).status,200);
  assert.deepEqual(s.calls.filter(c=>c.operation).map(c=>c.operation),['prepareCurrent','listPrepared']);
  const ref={tenantId:UUID,sectionId:'mur',id:OTHER};
  assert.equal((await s.handler.handle('exporta-historic',{headers,body:{bridgeId:UUID,recordIds:[ref]}})).status,200);
  const n=s.calls.length;
  for(const input of[{bridgeId:UUID,recordIds:Array(21).fill(ref)},{bridgeId:UUID,recordIds:[ref],publish:true},{bridgeId:UUID,recordIds:[{...ref,ownerId:UUID}]}])assert.equal((await s.handler.handle('exporta-historic',{headers,body:input})).status,400);
  assert.equal(s.calls.length,n);
});
test('a new request gets a fresh actor binding and internal diagnostics never reach JSON',async()=>{
  const s=fixture();await s.handler.handle('preparades',{headers,query:{bridgeId:UUID}});await s.handler.handle('preparades',{headers:{...headers,'x-sdp-expected-actor':OTHER},query:{bridgeId:UUID}});
  const contexts=s.calls.filter(c=>c.factory).map(c=>c.factory);assert.equal(contexts.length,2);assert.notEqual(contexts[0],contexts[1]);assert.equal(contexts[1].expectedActor,OTHER);
  const unsafe=fixture({failure:Object.assign(Error('PRIVATE SQL BODY'),{status:418,code:'PRIVATE_SQL_BODY'})});
  const answer=await unsafe.handler.handle('publish',{headers,body});assert.deepEqual(answer,{status:503,body:{error:'posse_operation_failed'}});
});
async function dispatch(server,{url,method='GET',body='',headers:extra={}}){
  const req=Readable.from(body?[Buffer.from(body)]:[]);Object.assign(req,{url,method,headers:{host:'socdepoble.cat',...extra}});
  return new Promise(resolve=>{const h={};let status;server.emit('request',req,{headersSent:false,setHeader(k,v){h[k.toLowerCase()]=v;},writeHead(s,values){status=s;for(const[k,v]of Object.entries(values))h[k.toLowerCase()]=v;this.headersSent=true;},end(bytes){resolve({status,headers:h,body:JSON.parse(bytes)});}});});
}
test('daemon routes tray and aliases before public CORS and operator bearer; duplicate query is refused',async()=>{
  const s=fixture(),server=creaServidor({db:{},claus:{fingerprint:'fixture'},posse:s.handler});
  try{
    const tray=await dispatch(server,{url:'/api/v1/node0/mastodon/preparades?bridgeId='+UUID,headers});assert.equal(tray.status,200);assert.equal(tray.headers['access-control-allow-origin'],undefined);
    const duplicate=await dispatch(server,{url:'/api/v1/node0/mastodon/preparades?bridgeId='+UUID+'&bridgeId='+OTHER,headers});assert.equal(duplicate.status,400);
    for(const action of['publish','publica']){
      const result=await dispatch(server,{url:'/api/v1/node0/mastodon/'+action,method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify(body)});assert.equal(result.status,200);assert.equal(result.headers['access-control-allow-origin'],undefined);
    }
    const foreign=await dispatch(server,{url:'/api/v1/node0/mastodon/publish',method:'POST',headers:{...headers,origin:'https://socdepoble.org','content-type':'application/json'},body:JSON.stringify(body)});assert.equal(foreign.status,403);
  }finally{server.close();}
});

// R11: mandatory primary entry. Submodules run unconditionally with this
// already-classified suite, keeping the requested tests/node0-* scope.
import './node0-posse-formatador-r11.cases.mjs';
import './node0-posse-historica-r11.cases.mjs';
import './node0-posse-motor-r11.cases.mjs';
import './node0-posse-servei-r11.cases.mjs';
import './node0-posse-sql.cases.mjs';
import './node0-posse-transport-mastodont-depoble-r11.cases.mjs';
import './node0-r11-posse-http.cases.mjs';
import './node0-r11-posse-main.cases.mjs';
import './node0-r11-posse-media.cases.mjs';
