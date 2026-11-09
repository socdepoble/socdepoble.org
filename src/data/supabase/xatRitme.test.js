import {beforeEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({rpc:vi.fn(),mode:'remote',actor:'A'}));
vi.mock('./runtime.js',()=>({rpc:mock.rpc,getResolvedConfig:()=>({runtimeDataMode:mock.mode,hasSupabaseConfig:true})}));
vi.mock('../identitat.js',()=>({usuariDeSessio:()=>({id:mock.actor}),versioSessio:1}));
import {loadRitmeXat,actualitzaPresenciaXat} from './xatRitme.js';
const id='00000000-0000-4000-8000-000000000003';
beforeEach(()=>{vi.clearAllMocks();mock.mode='remote';mock.actor='A';});
it('maps only explicit peer receipt data and uses bounded cancellable transport',async()=>{
 mock.rpc.mockResolvedValue({rebutPelsAltresFinsSeq:4,llegitPelsAltresFinsSeq:2,escrivint:[]});const signal=new AbortController().signal;
 expect((await loadRitmeXat(id,{signal})).rebutPelsAltresFinsSeq).toBe(4);expect(mock.rpc).toHaveBeenCalledWith('xat_ritme',{p_fil_id:id},{signal},{signal,timeoutMs:8000});
});
it('strips draft/actor fields before publication',async()=>{
 mock.rpc.mockResolvedValue({acceptat:true});await actualitzaPresenciaXat(id,{instancia:id,revisio:1,escrivint:true,text:'never on wire',usuariId:id});
 expect(mock.rpc.mock.calls[0][1]).toEqual({p_fil_id:id,p_instancia:id,p_revisio:1,p_escrivint:true});
});
it.each(['seed','local'])('mode%s never contacts a server',async mode=>{mock.mode=mode;await expect(loadRitmeXat(id)).rejects.toMatchObject({code:'SENSE_CAPACITAT_RITME'});expect(mock.rpc).not.toHaveBeenCalled();});
it('missing migration and malformed server response fail closed',async()=>{
 mock.rpc.mockRejectedValueOnce({status:404});await expect(loadRitmeXat(id)).rejects.toMatchObject({code:'SENSE_CAPACITAT_RITME'});
 mock.rpc.mockResolvedValue({rebutFinsSeq:99,escrivint:[]});await expect(loadRitmeXat(id)).rejects.toMatchObject({code:'BACKEND_RESPOSTA_INVALIDA'});
});

it('captured actor mismatch aborts before RPC, and late previous-actor data never escapes',async()=>{
 await expect(loadRitmeXat(id,{ritmeActorId:'B'})).rejects.toMatchObject({name:'AbortError'});expect(mock.rpc).not.toHaveBeenCalled();
 let resolve;mock.rpc.mockImplementation(()=>new Promise(r=>{resolve=r}));const pending=loadRitmeXat(id,{ritmeActorId:'A'});mock.actor='B';resolve({rebutPelsAltresFinsSeq:1,llegitPelsAltresFinsSeq:0,escrivint:[]});await expect(pending).rejects.toMatchObject({name:'AbortError'});
});
