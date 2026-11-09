import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTRACTE_NUCLI} from '../src/data/contracte.js';
import {creaSessioNodeZeroHttp} from '../src/data/node0/sessioNodeZeroHttp.js';
import {preparaClientPrivatNodeZero} from '../src/data/node0/clientPrivatNodeZero.js';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,origin='http://127.0.0.1:49000';
const user={id:id(1),email:'synthetic@example.invalid',email_confirmed_at:'2026-11-08T00:00:00Z',user_metadata:{}};
const dto={rebutPelsAltresFinsSeq:12,llegitPelsAltresFinsSeq:4,escrivint:[{usuariId:id(2),vigentMs:8000}]};
function fixture(capability=true){
 const calls=[];
 const transport=creaSessioNodeZeroHttp({origin,endpoint:origin+'/api/v1/node0',fetchImpl:async(url,init)=>{
  const action=url.split('/').at(-1);calls.push({action,init});let body;
  if(action==='session')body={user};else if(action==='loadRitmeXat')body=dto;else if(action==='actualitzaPresenciaXat')body={acceptat:true};else if(action==='marcaLlegit')body=[{rebut_fins_seq:12,llegit_fins_seq:4}];else throw Error('unexpected');
  return new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json'}});
 }});
 const publicAdapter={...Object.fromEntries(CONTRACTE_NUCLI.map(n=>[n,()=>null])),configuracio:{backendId:'sdp-node0-http',backendUrl:origin+'/api/v1/node0',tenantId:id(9)},
  lligEstatNodeZero:async()=>({node:'node0',postgresql:{ok:true},capabilities:{userSessions:true,actorBinding:true,xatRitme:capability}})};
 return {calls,transport,options:{publicAdapter,transport,habilitaPrivat:true,emetCanvi:()=>{}}};
}
test('Node0 complete optional capability uses canonical same-origin cookie transport with actor binding and no draft data',async()=>{
 const f=fixture(),{adapter}=await preparaClientPrivatNodeZero(f.options);assert.deepEqual(await adapter.loadRitmeXat(id(3)),dto);
 await adapter.actualitzaPresenciaXat(id(3),{instancia:id(8),revisio:3,escrivint:true,text:'must never travel'});
 const last=f.calls.at(-1);assert.equal(last.action,'actualitzaPresenciaXat');assert.equal(last.init.credentials,'same-origin');assert.equal(last.init.headers['X-SDP-Expected-Actor'],user.id);
 assert.deepEqual(JSON.parse(last.init.body),{filId:id(3),instancia:id(8),revisio:3,escrivint:true});f.transport.destroy();
});
test('absent server capability does not expose either optional method;32 core methods remain',async()=>{
 const f=fixture(false),{adapter}=await preparaClientPrivatNodeZero(f.options);assert.equal(adapter.loadRitmeXat,undefined);assert.equal(adapter.actualitzaPresenciaXat,undefined);for(const n of CONTRACTE_NUCLI)assert.equal(typeof adapter[n],'function');assert.equal(f.calls.length,1);f.transport.destroy();
});
test('transport rejects forged identity and text fields before any request',async()=>{
 const f=fixture();await assert.rejects(f.transport.demanaPrivat('actualitzaPresenciaXat',{filId:id(3),instancia:id(8),revisio:1,escrivint:true,userId:id(2)},{expectedActor:user.id}));assert.equal(f.calls.length,0);f.transport.destroy();
});

test('Node0 rejects a previous actor presence intent before canonical transport dispatch',async()=>{
 const f=fixture(),{adapter}=await preparaClientPrivatNodeZero(f.options);await assert.rejects(adapter.actualitzaPresenciaXat(id(3),{instancia:id(8),revisio:1,escrivint:true},{ritmeActorId:id(2)}),e=>e.name==='AbortError');assert.equal(f.calls.length,1);f.transport.destroy();
});
