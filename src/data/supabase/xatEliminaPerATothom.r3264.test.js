// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import * as remote from './xatAccions.js';
import * as port from '../backendPort.js';
import { CONTRACTE_NUCLI, CAPACITATS } from '../contracte.js';
import { estatPort } from '../backendPortEstat.js';
import { creaAccionsMissatge } from '../xat/accionsMissatge.js';
import { creaOpcionsMotorAccions } from '../xat/creaOpcionsMotorAccions.js';
const m=vi.hoisted(()=>({rpc:vi.fn(),entry:1,user:{id:'actor'},jwt:'live'}));
vi.mock('./runtime.js',()=>({rpc:m.rpc}));
vi.mock('../identitat.js',()=>({usuariDeSessio:()=>m.user,jwtPerBackend:()=>m.jwt,entradaSessio:()=>m.entry,
 capturaSessio:()=>{const entry=m.entry;return()=>{if(entry!==m.entry)throw new DOMException('changed','AbortError');};}}));
const FIL='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ID='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',OTHER='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const AT='2026-11-23T23:40:01.123456+00:00';
const receipt=extra=>({missatgeId:ID,filId:FIL,reaccions:[],destacat:false,fixat:false,amagat:false,esborrat:true,esborratAl:AT,...extra});
const input={filId:FIL,missatgeId:ID};
beforeEach(()=>{m.rpc.mockReset();m.entry=1;m.user={id:'actor'};m.jwt='live';});
afterEach(()=>{port.destroy();estatPort.currentImpl=null;estatPort.isLocked=false;});
test('nou mètode existeix i envia només UUIDs del recurs, mai actor/rol del client',async()=>{
 m.rpc.mockResolvedValue(receipt({amagat:true,usuariId:'private',role:'admin',text:'private'}));
 const r=await remote.eliminaPerATothom({...input,usuariId:'forged',rol:'admin'});
 expect(m.rpc.mock.calls[0].slice(0,2)).toEqual(['xat_elimina_per_a_tothom',{p_fil_id:FIL,p_missatge_id:ID}]);
 expect(r).toEqual(receipt({amagat:true}));expect(r.esborratAl).toBe(AT);
});
test.each([{},null,receipt({esborrat:false}),receipt({esborrat:'true'}),receipt({esborratAl:null}),receipt({esborratAl:'yesterday'}),receipt({esborratAl:1}),receipt({esborratAl:'2026-02-31T00:00:00Z'}),receipt({esborratAl:'0000-01-01T00:00:00Z'}),receipt({esborratAl:'2026-01-01T00:00:00+25:00'}),receipt({esborratAl:'2026-01-01T24:00:00Z'}),receipt({missatgeId:OTHER}),receipt({filId:OTHER}),receipt({fixat:true}),receipt({destacat:true}),receipt({reaccions:[{emoji:'x',total:1,meua:true}]})])('no hi ha ACK amb marcador/recurs/camps invàlids %j',async r=>{
 m.rpc.mockResolvedValue(r);await expect(remote.eliminaPerATothom(input)).rejects.toMatchObject({code:'XAT_ACCIO_INVALIDA'});
});
test.each([null,{},['x'],1,{toString:()=>ID}])('UUID primitiu obligatori %j',async value=>{
 await expect(remote.eliminaPerATothom({...input,missatgeId:value})).rejects.toMatchObject({code:'XAT_ACCIO_INVALIDA'});expect(m.rpc).not.toHaveBeenCalled();
});
test.each([403,401])('denegació%s no és ACK ni fallback',async status=>{const cause=Object.assign(new Error('denied'),{status,postgrestCode:'PGRST202'});m.rpc.mockRejectedValue(cause);await expect(remote.eliminaPerATothom(input)).rejects.toBe(cause);});
test('RPC absent, entrada canviada i abort es rebutgen honestament',async()=>{
 m.rpc.mockRejectedValueOnce(Object.assign(new Error('absent'),{postgrestCode:'PGRST202'}));await expect(remote.eliminaPerATothom(input)).rejects.toMatchObject({code:'XAT_ACCIONS_SQL_ABSENT'});
 m.rpc.mockImplementationOnce(async()=>{m.entry++;return receipt();});await expect(remote.eliminaPerATothom(input)).rejects.toMatchObject({name:'AbortError'});
 const ac=new AbortController();m.rpc.mockImplementationOnce(async()=>{ac.abort();return receipt();});await expect(remote.eliminaPerATothom(input,{signal:ac.signal})).rejects.toMatchObject({name:'AbortError'});
});
function pipeline(){
 const impl=Object.fromEntries(CONTRACTE_NUCLI.map(n=>[n,()=>null]));for(const name of CAPACITATS.xatAccionsMissatge)impl[name]=remote[name];port.setBackendImplementation(impl);
 const message={id:ID,threadId:FIL,text:'original',xifrat:{immutable:true},metadades:{original:true},tipus:'text'};
 const env={ambit:'scope-a',actiu:true,usuariId:'actor',modeDades:'remote',config:{},missatgesPerFil:{[FIL]:[message]},esPersonaBloquejada:()=>false};
 let rows=env.missatgesPerFil;const entornAccions={current:env};
 const options=creaOpcionsMotorAccions({entornAccions,filsRef:{current:[{id:FIL,participant:true}]},desmuntat:{current:false},moderacioRef:{current:null},setEstatAccions:()=>{},mutaMissatges:fn=>{rows=fn(rows);},mutaFils:()=>{}});
 return{motor:creaAccionsMissatge(options),message,getRows:()=>rows,env};
}
test('port real→RPC→motor→opcions: només el rebut confirmat marca la còpia, sense mutar original/xifrat',async()=>{
 const p=pipeline();m.rpc.mockResolvedValue(receipt());
 expect(port.teCapacitat('xatAccionsMissatge')).toBe(true);const r=await p.motor.eliminaPerATothom(ID);
 expect(r).toMatchObject({esborrat:true,esborratAl:AT});expect(p.motor.snapshot().perMissatge[ID]).toMatchObject({esborrat:true,esborratAl:AT,estat:'confirmat'});
 expect(p.getRows()[FIL][0]).toMatchObject({esborrat:true,esborratAl:AT,text:'',xifrat:null,metadades:{}});expect(p.message.text).toBe('original');expect(p.message.xifrat).toEqual({immutable:true});
});
test.each(['denied','absent','invalid'])('motor no publica esborrat ni local ACK quan%s',async kind=>{
 const p=pipeline();if(kind==='invalid')m.rpc.mockResolvedValue(receipt({esborrat:false}));else m.rpc.mockRejectedValue(Object.assign(new Error(kind),kind==='denied'?{status:403}:{postgrestCode:'PGRST202'}));
 await expect(p.motor.eliminaPerATothom(ID)).rejects.toBeTruthy();expect(p.motor.snapshot().perMissatge[ID]?.esborrat).not.toBe(true);expect(p.getRows()[FIL][0]).toBe(p.message);
});
test('absència d’adaptador no inventa ACK i canvi de sessió descarta resposta tardana',async()=>{
 const p=pipeline();port.setBackendImplementation(Object.fromEntries(CONTRACTE_NUCLI.map(n=>[n,()=>null])));
 await expect(p.motor.eliminaPerATothom(ID)).rejects.toThrow();expect(p.getRows()[FIL][0]).toBe(p.message);
 const next=pipeline();let release;m.rpc.mockImplementationOnce(()=>new Promise(r=>{release=r;}));const pending=next.motor.eliminaPerATothom(ID);await Promise.resolve();m.entry++;release(receipt());await expect(pending).rejects.toMatchObject({name:'AbortError'});expect(next.getRows()[FIL][0]).toBe(next.message);
});

test('doble rebut ambigu no és confirmació; reintent retorna el mateix timestamp sense normalitzar',async()=>{
 m.rpc.mockResolvedValueOnce([receipt(),receipt()]);await expect(remote.eliminaPerATothom(input)).rejects.toMatchObject({code:'XAT_ACCIO_INVALIDA'});
 m.rpc.mockResolvedValue(receipt());const a=await remote.eliminaPerATothom(input),b=await remote.eliminaPerATothom(input);expect(a.esborratAl).toBe(AT);expect(b).toEqual(a);
});
test('una lectura antiga del sidecar no ressuscita un rebut eliminat confirmat',async()=>{
 const p=pipeline();let release;m.rpc.mockImplementationOnce(()=>new Promise(r=>{release=r;}));
 const old=p.motor.carregaAccionsMissatges({filId:FIL});await Promise.resolve();
 m.rpc.mockResolvedValueOnce(receipt());await p.motor.eliminaPerATothom(ID);
 release({missatges:[{...receipt(),esborrat:undefined,esborratAl:undefined,reaccions:[{emoji:'x',total:1,meua:true}]}],teMes:false,seguentId:null});await old;
 expect(p.motor.snapshot().perMissatge[ID]).toMatchObject({esborrat:true,esborratAl:AT,reaccions:[]});
});

test('mode local no és una confirmació global i abort abans de començar no transporta',async()=>{
 const p=pipeline();p.env.modeDades='local';await expect(p.motor.eliminaPerATothom(ID)).rejects.toMatchObject({code:'XAT_ACCIONS_SQL_ABSENT'});expect(m.rpc).not.toHaveBeenCalled();
 p.env.modeDades='remote';const ac=new AbortController();ac.abort();await expect(p.motor.eliminaPerATothom(ID,{signal:ac.signal})).rejects.toMatchObject({name:'AbortError'});expect(m.rpc).not.toHaveBeenCalled();
});
