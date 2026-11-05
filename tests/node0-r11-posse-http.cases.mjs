import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {creaGestorHttpPosse} from '../tooling/node0/http-posse-node0.mjs';
import {creaServidor,main} from '../tooling/node0/servidor-node0-soberania.mjs';

const ACTOR='00000000-0000-4000-8000-000000000001';
const BRIDGE='00000000-0000-4000-8000-000000000002';
const DRAFT='00000000-0000-4000-8000-000000000003';
const headers={origin:'https://socdepoble.cat',cookie:'__Host-sdp-node0='+Buffer.alloc(32,9).toString('base64url'),'x-sdp-expected-actor':ACTOR};
const confirmation={id:DRAFT,hash_esborrany:'a'.repeat(64),revisio_politica:'7',confirm:true};

function fixture(enabled=true){
  const calls=[];
  const row={id:DRAFT,hash_esborrany:confirmation.hash_esborrany,revisio_politica:'7',estat:'preparat',draft:{status:'Article públic https://socdepoble.org/mur/fixture'}};
  const service={
    motor:{listPrepared:async()=>[row],prepare:async()=>row,publish:async()=>{calls.push('legacy');return{};},queueHistorical:async()=>({})},
    loadDefaultBridge:async()=>{calls.push('default');return{id:BRIDGE};},
    prepareCurrent:async({bridgeId})=>{assert.equal(bridgeId,BRIDGE);calls.push('prepare-only');},
    listPrepared:async()=>{calls.push('list');return[row];},
    publishConfirmation:async value=>{calls.push({confirmation:value});return{estat:'publicat',created:true};}
  };
  const handler=creaGestorHttpPosse({publishingEnabled:enabled,creaMotorPerSessio:async context=>{calls.push({session:context});return service;}});
  return{handler,calls};
}

test('GET without a bridge query resolves the authorized default and returns exact durable confirmation fields',async()=>{
  const f=fixture();
  const result=await f.handler.handle('preparades',{headers});
  assert.equal(result.status,200);assert.equal(result.body.bridgeId,BRIDGE);
  assert.deepEqual(f.calls.slice(1),['default','prepare-only','list']);
  assert.deepEqual(result.body.publications.map(({id,hash_esborrany,revisio_politica,estat})=>({id,hash_esborrany,revisio_politica,estat})),[{...confirmation,confirm:undefined,estat:'preparat'}].map((row)=>{const copia={...row};delete copia.confirm;return copia;}));
});

test('POST accepts the four-field human contract and normalizes a numeric policy revision',async()=>{
  const f=fixture();
  for(const action of ['publish','publica']){
    assert.equal((await f.handler.handle(action,{headers,body:{...confirmation,revisio_politica:7}})).status,200);
  }
  const published=f.calls.filter(v=>v.confirmation);
  assert.equal(published.length,2);assert.deepEqual(published[0].confirmation,confirmation);
  assert.equal(f.calls.includes('legacy'),false);
});

test('blind, inherited, extra-field and malformed confirmations never construct a repository or transport',async()=>{
  const f=fixture();
  const invalid=[{}, {...confirmation,confirm:false},{...confirmation,confirm:'true'},
    {...confirmation,hash_esborrany:'A'.repeat(64)},{...confirmation,id:'slug-not-durable-id'},
    {...confirmation,revisio_politica:0},{...confirmation,revisio_politica:'01'},
    {...confirmation,revisio_politica:Number.MAX_SAFE_INTEGER+1},{...confirmation,status:'forged'},
    {...confirmation,author_entity_id:'rentonar'},{...confirmation,token:'not-authority'},
    {...confirmation,allowCommercial:true},{...confirmation,bridgeId:BRIDGE}];
  for(const body of invalid)assert.equal((await f.handler.handle('publish',{headers,body})).status,409);
  const inherited=Object.create({confirm:true});Object.assign(inherited,confirmation);delete inherited.confirm;
  assert.equal((await f.handler.handle('publish',{headers,body:inherited})).status,409);
  assert.deepEqual(f.calls,[]);
});

test('session, actor binding, same origin and publisher switch precede all service work',async()=>{
  for(const [patch,status] of [[{cookie:''},401],[{'x-sdp-expected-actor':''},409],[{origin:'https://foreign.invalid'},403]]){
    const f=fixture();assert.equal((await f.handler.handle('publish',{headers:{...headers,...patch},body:confirmation})).status,status);assert.deepEqual(f.calls,[]);
  }
  const disabled=fixture(false);
  assert.equal((await disabled.handler.handle('publish',{headers,body:confirmation})).status,503);
  assert.deepEqual(disabled.calls,[]);
  assert.equal((await disabled.handler.handle('preparades',{headers})).status,200);
});

async function dispatch(server,{url,method='GET',body='',extra={}}){
  const req=Readable.from(body?[Buffer.from(body)]:[]);
  Object.assign(req,{url,method,headers:{host:'socdepoble.cat',...headers,...extra}});
  return new Promise(resolve=>{const responseHeaders={};let status;
    server.emit('request',req,{headersSent:false,setHeader(k,v){responseHeaders[k]=v;},writeHead(value,values){status=value;Object.assign(responseHeaders,values);this.headersSent=true;},end(bytes){resolve({status,headers:responseHeaders,body:JSON.parse(bytes)});}});
  });
}

test('canonical daemon HTTP path permits no-query tray and rejects duplicate query, non-JSON and blind publish',async()=>{
  const f=fixture(),server=creaServidor({db:{},claus:{fingerprint:'synthetic'},posse:f.handler});
  try{
    assert.equal((await dispatch(server,{url:'/api/v1/node0/mastodon/preparades'})).status,200);
    const n=f.calls.length;
    assert.equal((await dispatch(server,{url:`/api/v1/node0/mastodon/preparades?bridgeId=${BRIDGE}&bridgeId=${BRIDGE}`})).status,400);
    assert.equal((await dispatch(server,{url:'/api/v1/node0/mastodon/publish',method:'POST',body:JSON.stringify(confirmation),extra:{'content-type':'text/plain'}})).status,415);
    assert.equal((await dispatch(server,{url:'/api/v1/node0/mastodon/publish',method:'POST',body:'{}',extra:{'content-type':'application/json'}})).status,409);
    assert.equal(f.calls.length,n);
    const result=await dispatch(server,{url:'/api/v1/node0/mastodon/publish',method:'POST',body:JSON.stringify(confirmation),extra:{'content-type':'application/json'}});
    assert.equal(result.status,200);assert.equal(result.headers['Access-Control-Allow-Origin'],undefined);
  }finally{server.close();}
});

test('main refuses POSSE activation without sessions and publication without POSSE before DB or key work',async()=>{
  let calls=0;
  const deps={creaPostgres(){calls++;throw Error('must not reach DB');},carregaClaus(){calls++;throw Error('must not load keys');}};
  await assert.rejects(main({SDP_NODE0_POSSE:'1'},deps),/node0_posse_auth_required/);
  await assert.rejects(main({SDP_NODE0_POSSE_PUBLISH:'1'},deps),/node0_posse_configuration_required/);
  assert.equal(calls,0);
});
