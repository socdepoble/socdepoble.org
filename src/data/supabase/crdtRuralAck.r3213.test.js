import {beforeEach,expect,test,vi} from 'vitest';
import {preparaSincronitzacioCrdtRural,estatCrdtRuralBuit,canviaCrdtRural} from '../crdtRural.js';
const m=vi.hoisted(()=>({rpc:vi.fn(),user:{id:'32130000-0000-4000-8000-000000000001'},epoch:0,config:{supabaseUrl:'https://replica.example',hasSupabaseConfig:true,runtimeDataMode:'remote',tenantId:'32130000-0000-4000-8000-000000000002'}}));
vi.mock('./runtime.js',()=>({rpc:m.rpc,getCurrentUser:()=>m.user,getResolvedConfig:()=>({...m.config})}));
vi.mock('../identitat.js',()=>({capturaSessio:()=>{const e=m.epoch;return()=>{if(e!==m.epoch)throw new DOMException('session changed','AbortError');};}}));
import {confirmaCapturaCrdtRural} from './crdtRuralAck.js';
const state=canviaCrdtRural(estatCrdtRuralBuit(),{id:'n',replica:'A',comptador:1,nota:{title:'A',content:'hello'}});
const p=preparaSincronitzacioCrdtRural(state,'snapshot');
const reply=()=>({requestId:p.requestId,sha256:p.sha256,frontera:p.frontera,confirmatEl:'2026-11-19T00:00:00.000Z',ack_remot_confirmat:true});
beforeEach(()=>{m.rpc.mockReset();m.config.runtimeDataMode='remote';m.config.supabaseUrl='https://replica.example';m.user={id:'32130000-0000-4000-8000-000000000001'};m.epoch=0;});
test('durable neutral adapter sends canonical capture and accepts exact committed receipt',async()=>{
 m.rpc.mockResolvedValue(reply());const result=await confirmaCapturaCrdtRural(p);expect(result.autoritat).toBe('https://replica.example');expect(m.rpc.mock.calls[0][0]).toBe('confirma_captura_crdt_rural');expect(m.rpc.mock.calls[0][1]).toMatchObject({p_request:'snapshot',p_sha256:p.sha256,p_frontier:p.frontera});
});
test('missing migration fails closed; auth denial retains denial identity',async()=>{
 m.rpc.mockRejectedValue(Object.assign(Error('missing'),{code:'PGRST202'}));await expect(confirmaCapturaCrdtRural(p)).rejects.toMatchObject({code:'RURAL_CRDT_ACK_UNAVAILABLE'});
 const denied=Object.assign(Error('denied'),{code:'42501'});m.rpc.mockRejectedValue(denied);await expect(confirmaCapturaCrdtRural(p)).rejects.toBe(denied);
});
test('old request, false durable flag, wrong hash, timestamp or surplus fields are not ACKs',async()=>{
 for(const patch of[{requestId:'old'},{sha256:'0'.repeat(64)},{ack_remot_confirmat:false},{confirmatEl:'bad'},{owner_id:'forged'}]){m.rpc.mockResolvedValue({...reply(),...patch});await expect(confirmaCapturaCrdtRural(p)).rejects.toThrow();}
});
test('session change and cancellation after await forbid an ACK from the former context',async()=>{
 m.rpc.mockImplementation(async()=>{m.epoch++;return reply();});await expect(confirmaCapturaCrdtRural(p)).rejects.toMatchObject({name:'AbortError'});
 m.epoch=0;const abort=new AbortController();m.rpc.mockImplementation(async()=>{abort.abort();return reply();});await expect(confirmaCapturaCrdtRural(p,{signal:abort.signal})).rejects.toMatchObject({name:'AbortError'});
});
test('seed/local/insecure authority cannot manufacture a remote receipt',async()=>{
 for(const mode of['seed','local']){m.config.runtimeDataMode=mode;await expect(confirmaCapturaCrdtRural(p)).rejects.toMatchObject({code:'RURAL_CRDT_ACK_UNAVAILABLE'});}
 m.config.runtimeDataMode='remote';m.config.supabaseUrl='http://replica.example';await expect(confirmaCapturaCrdtRural(p)).rejects.toThrow();expect(m.rpc).not.toHaveBeenCalled();
});
