import { beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({rpc:vi.fn(),scope:true}));
vi.mock('./runtime.js',()=>({rpc:m.rpc,getResolvedConfig:()=>({runtimeDataMode:'remote'})}));
vi.mock('../identitat.js',()=>({usuariDeSessio:()=>({id:'persona'}),capturaSessio:()=>()=>{},esBackendDeSessio:()=>m.scope}));
import { cercaMissatgesFil, carregaMissatgeFilPerId } from './xatCerca.js';
const FIL='ABCD0000-0000-4000-8000-000000000001', ID='ABCD0000-0000-4000-8000-000000000002';
beforeEach(()=>{m.scope=true;m.rpc.mockReset();});
it('T3 normalitza els UUID de consulta i resposta en majúscules/minúscules',async()=>{
  m.rpc.mockResolvedValue([{id:ID,fil_id:FIL.toLowerCase(),seq:1,cos:'Text'}]);
  expect((await cercaMissatgesFil(FIL,'Text'))[0]).toMatchObject({id:ID.toLowerCase(),filId:FIL.toLowerCase()});
  expect(m.rpc.mock.calls[0][1].p_fil_id).toBe(FIL.toLowerCase());
  await carregaMissatgeFilPerId(FIL,ID);expect(m.rpc.mock.calls[1][1].p_id).toBe(ID.toLowerCase());
});
it('T2 la guarda Àmbit canviat és assolible després d’una resposta en vol',async()=>{
  m.rpc.mockImplementation(async()=>{m.scope=false;return [];});
  await expect(cercaMissatgesFil(FIL,'Text')).rejects.toMatchObject({name:'AbortError',message:'Àmbit canviat.'});
});
