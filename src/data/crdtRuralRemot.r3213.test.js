import {beforeEach,expect,test,vi} from 'vitest';
import {webcrypto} from 'node:crypto';
import {creaSessioRural} from './sessioRural.js';
import {creaTransportCrdtRuralRemot} from './crdtRuralRemot.js';
import {preparaSincronitzacioCrdtRural,estatCrdtRuralBuit} from './crdtRural.js';
const m=vi.hoisted(()=>({confirm:vi.fn(),capable:true}));
vi.mock('./backendPort.js',()=>({teCapacitat:()=>m.capable,confirmaCapturaCrdtRural:(...a)=>m.confirm(...a)}));
const authority='https://replica.example';
const receipt=p=>({schema:'sdp.rural.remote-ack.v1',requestId:p.requestId,sha256:p.sha256,frontera:p.frontera,autoritat:authority,confirmatEl:'2026-11-19T00:00:00.000Z',ack_remot_confirmat:true});
async function session(){return creaSessioRural({abast:{persona:'actor',tenant:'torre',endpoint:'seed',mode:'seed'},municipi:'La Torre',motor:'memoria',memoria:new Map(),crdt:true,crypto:webcrypto,BroadcastChannel:null,transportCrdtRemot:creaTransportCrdtRuralRemot({autoritat:authority})});}
beforeEach(()=>{m.confirm.mockReset();m.capable=true;});
test('port bridge preserves native session CAS: in-flight local write remains unacknowledged',async()=>{
 const s=await session();let release,entered;const waiting=new Promise(r=>{release=r;}),captured=new Promise(r=>{entered=r;});
 try{
  await s.desaNota({title:'First',content:'Before RPC'});
  m.confirm.mockImplementation(async p=>{entered(p);await waiting;return receipt(p);});
  const pending=s.sincronitzaRemot(),request=await captured;
  await s.desaNota({title:'Second',content:'While remote is pending'});release();await pending;
  const state=(await s.exportaVault()).crdt;
  expect(state.ops).toHaveLength(2);expect(state.sincronitzacio.acks).toHaveLength(1);expect(state.sincronitzacio.acks[0].dot).toBe(`${request.crdt.ops[0].replica}:${request.crdt.ops[0].comptador}`);
 }finally{s.close();}
});
test('missing SQL, denied RPC and stale replay preserve complete local operations and queue',async()=>{
 const s=await session();try{
  await s.desaNota({title:'Kept',content:'Durable local write'});const before=(await s.exportaVault()).crdt;
  for(const e of[Object.assign(Error('missing migration'),{code:'PGRST202'}),Object.assign(Error('denied'),{code:'42501'}),new DOMException('timeout','AbortError')]){
   m.confirm.mockRejectedValue(e);await expect(s.sincronitzaRemot()).rejects.toBe(e);expect((await s.exportaVault()).crdt).toEqual(before);
  }
  const stale=preparaSincronitzacioCrdtRural(estatCrdtRuralBuit(),'stale');m.confirm.mockResolvedValue(receipt(stale));await expect(s.sincronitzaRemot()).rejects.toThrow();expect((await s.exportaVault()).crdt).toEqual(before);
 }finally{s.close();}
});
test('absent backend capability and mismatched/insecure authority fail closed',async()=>{
 const transport=creaTransportCrdtRuralRemot({autoritat:authority}),p=preparaSincronitzacioCrdtRural(estatCrdtRuralBuit(),'bridge');m.capable=false;
 await expect(transport.envia(p)).rejects.toMatchObject({code:'RURAL_CRDT_ACK_UNAVAILABLE'});expect(m.confirm).not.toHaveBeenCalled();
 m.capable=true;m.confirm.mockResolvedValue({...receipt(p),autoritat:'https://other.example'});await expect(transport.envia(p)).rejects.toMatchObject({code:'RURAL_CRDT_ACK_INVALID'});
 expect(()=>creaTransportCrdtRuralRemot({autoritat:'http://untrusted.invalid'})).toThrow();
});
