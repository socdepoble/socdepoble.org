import {beforeEach,expect,test,vi} from 'vitest';
const m=vi.hoisted(()=>({rpc:vi.fn(),epoch:0,mode:'remote'}));
vi.mock('./runtime.js',()=>({rpc:m.rpc,getResolvedConfig:()=>({runtimeDataMode:m.mode})}));
vi.mock('../identitat.js',()=>({capturaSessio:()=>{const e=m.epoch;return()=>{if(e!==m.epoch)throw new DOMException('session changed','AbortError');};}}));
import {registraDenunciaDiligent,revisaDenunciaDiligent,llistaDenunciesDiligents} from './denunciesDiligents.js';
const id='32130000-0000-4000-8000-000000000001';
const report={publicacioId:id,motiu:'altre',detall:'Evidence',operacioId:id};
const review={id,estatEsperat:'rebuda',versio:1,estat:'en_revisio',justificacio:'Human review',operacioId:id};
beforeEach(()=>{m.rpc.mockReset();m.epoch=0;m.mode='remote';});
test('explicit RPCs send typed fields and consume exact neutral DTOs',async()=>{
 m.rpc.mockResolvedValue({id,estat:'rebuda',versio:1,repetida:false});expect((await registraDenunciaDiligent(report)).estat).toBe('rebuda');expect(m.rpc.mock.calls[0][1]).not.toHaveProperty('ip_hash');
 m.rpc.mockResolvedValue({id,estat:'en_revisio',versio:2,repetida:false});expect((await revisaDenunciaDiligent(review)).versio).toBe(2);
 m.rpc.mockResolvedValue([{id,publicacioId:id,motiu:'altre',detall:'Evidence',estat:'rebuda',versio:1}]);expect(await llistaDenunciesDiligents()).toHaveLength(1);
});
test('malformed or foreign receipt, duplicated inbox and changed session fail closed',async()=>{
 m.rpc.mockResolvedValue({id,estat:'en_revisio',versio:100,repetida:false});await expect(revisaDenunciaDiligent(review)).rejects.toThrow();
 const row={id,publicacioId:id,motiu:'altre',detall:'Evidence',estat:'rebuda',versio:1};m.rpc.mockResolvedValue([row,row]);await expect(llistaDenunciesDiligents()).rejects.toThrow();
 m.rpc.mockImplementation(async()=>{m.epoch++;return {id,estat:'rebuda',versio:1,repetida:false};});await expect(registraDenunciaDiligent(report)).rejects.toMatchObject({name:'AbortError'});
});
test('missing SQL remains an error and local mode is never a simulated successful denunciation',async()=>{
 const e=Object.assign(Error('SQL absent'),{code:'PGRST202'});m.rpc.mockRejectedValue(e);await expect(registraDenunciaDiligent(report)).rejects.toBe(e);
 m.mode='seed';await expect(registraDenunciaDiligent(report)).rejects.toMatchObject({code:'LSSI_DILIGENT_UNAVAILABLE'});
});
