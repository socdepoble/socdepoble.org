import {afterEach,expect,test,vi} from 'vitest';
import {configuraBackendSessio,desaSessio,esborraSessio,entradaSessio} from '../identitat.js';
import {desaContacteOrganitzacio,llegeixContacteOrganitzacio,reiniciaMemoriaContacte} from './organizations.js';
const A='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',B='dddddddd-dddd-4ddd-8ddd-dddddddddddd',ORG='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CONFIG={dataMode:'remote',supabaseUrl:'https://final-critic.example.test',supabaseAnonKey:'sb_publishable_synthetic',tenantId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'};
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};
let tokens=0;
const enter=(id,renovacio=false)=>{configuraBackendSessio(CONFIG);expect(desaSessio({access_token:`token-${++tokens}`,user:{id}},{renovacio})).toBe(true);};
const out=p=>p.then(value=>({value}),error=>({error}));
const contact=mail=>new Response(JSON.stringify({correu:mail,es_public:false,origen_per_defecte:'cap',correu_per_defecte:null}),{headers:{'Content-Type':'application/json'}});
afterEach(()=>{reiniciaMemoriaContacte();esborraSessio({abast:'tot'});sessionStorage.clear();localStorage.clear();vi.unstubAllGlobals();vi.restoreAllMocks();vi.useRealTimers();});
for(const target of ['B','new A','logout'])test(`queued contact write from A cannot start as ${target} after shared probe is revoked`,async()=>{
 reiniciaMemoriaContacte();enter(A);const entered=deferred(),first=deferred();
 const fetch=vi.fn((_url,init)=>{if(fetch.mock.calls.length===1){entered.resolve(init);return first.promise;}return Promise.resolve(contact('segon@example.cat'));});vi.stubGlobal('fetch',fetch);
 const one=out(desaContacteOrganitzacio(ORG,{correu:'primer@example.cat',public:false},CONFIG));
 const two=out(desaContacteOrganitzacio(ORG,{correu:'segon@example.cat',public:false},CONFIG));
 await entered.promise;expect(fetch).toHaveBeenCalledTimes(1);esborraSessio({abast:'tot'});if(target!=='logout')enter(target==='B'?B:A);
 first.resolve(contact('primer@example.cat'));const observed=await Promise.all([one,two]);
 expect(observed[0]).toMatchObject({error:{name:'AbortError'}});
 expect(fetch).toHaveBeenCalledTimes(1);expect(observed[1]).toMatchObject({error:{name:'AbortError'}});
});

const write=config=>desaContacteOrganitzacio(ORG,{correu:'segon@example.cat',public:false},config);
function probe(){
 const entered=deferred(),pending=deferred();
 const fetch=vi.fn((_url,init)=>{if(fetch.mock.calls.length===1){entered.resolve(init);return pending.promise;}return Promise.resolve(contact('segon@example.cat'));});
 vi.stubGlobal('fetch',fetch);return{entered,pending,fetch};
}
for(const renew of [false,true])test(`two live consumers retain probe and success, legitimate renewal ${renew}`,async()=>{
 reiniciaMemoriaContacte();enter(A);const original=entradaSessio(),{entered,pending,fetch}=probe();
 const one=out(write(CONFIG)),two=out(write(CONFIG));await entered.promise;expect(fetch).toHaveBeenCalledTimes(1);
 if(renew)enter(A,true);pending.resolve(contact('primer@example.cat'));
 expect(await one).toMatchObject({value:{correu:'primer@example.cat'}});expect(await two).toMatchObject({value:{correu:'segon@example.cat'}});
 expect(fetch).toHaveBeenCalledTimes(2);expect(entradaSessio()).toBe(original);
 expect(fetch.mock.calls[0][1].headers.Authorization===fetch.mock.calls[1][1].headers.Authorization).toBe(!renew);
});
for(const change of ['abort','signal','tenant','backend','key','mode'])test(`queued consumer rejects config change ${change} before another request`,async()=>{
 reiniciaMemoriaContacte();enter(A);const controller=new AbortController(),config={...CONFIG,signal:controller.signal},{entered,pending,fetch}=probe();
 const one=out(write(CONFIG)),two=out(write(config));await entered.promise;
 if(change==='abort')controller.abort();else if(change==='signal')config.signal=new AbortController().signal;
 else if(change==='tenant')config.tenantId=B;else if(change==='backend')config.supabaseUrl='https://other.example.test';
 else if(change==='key')config.supabaseAnonKey='sb_publishable_other';else config.dataMode='local';
 pending.resolve(contact('primer@example.cat'));
 expect(await one).toHaveProperty('value');expect(await two).toMatchObject({error:{name:'AbortError'}});expect(fetch).toHaveBeenCalledTimes(1);
});
for(const kind of ['read','write'])test(`absent ${kind} RPC retains single probe and explicit unavailable result`,async()=>{
 reiniciaMemoriaContacte();enter(A);const{entered,pending,fetch}=probe(),call=kind==='read'?c=>llegeixContacteOrganitzacio(ORG,c):write;
 const one=out(call(CONFIG)),two=out(call(CONFIG));await entered.promise;
 pending.resolve(new Response('{"code":"PGRST202"}',{status:404}));
 expect(await one).toMatchObject({error:{code:'NO-DISPONIBLE'}});expect(await two).toMatchObject({error:{code:'NO-DISPONIBLE'}});
 await expect(call(CONFIG)).rejects.toMatchObject({code:'NO-DISPONIBLE'});expect(fetch).toHaveBeenCalledTimes(1);
});
test('aborting the first probe consumer does not cancel the second live consumer',async()=>{
 reiniciaMemoriaContacte();enter(A);const entered=deferred(),first=new AbortController(),second=new AbortController();
 const fetch=vi.fn((_url,init)=>{if(fetch.mock.calls.length>1)return Promise.resolve(contact('segon@example.cat'));entered.resolve(init);return new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(init.signal.reason),{once:true}));});vi.stubGlobal('fetch',fetch);
 const one=out(write({...CONFIG,signal:first.signal})),two=out(write({...CONFIG,signal:second.signal}));
 await entered.promise;first.abort();expect(await one).toMatchObject({error:{name:'AbortError'}});
 expect(await two).toMatchObject({value:{correu:'segon@example.cat'}});expect(fetch).toHaveBeenCalledTimes(2);expect(second.signal.aborted).toBe(false);expect(fetch.mock.calls[1][1].signal.aborted).toBe(false);
});
test('revoked contact read returns no late ACK',async()=>{
 reiniciaMemoriaContacte();enter(A);const{entered,pending,fetch}=probe(),reading=out(llegeixContacteOrganitzacio(ORG,CONFIG));
 await entered.promise;esborraSessio({abast:'tot'});enter(B);pending.resolve(contact('old@example.cat'));
 expect(await reading).toMatchObject({error:{name:'AbortError'}});expect(fetch).toHaveBeenCalledTimes(1);
});

for(const late of ['success','absent','reject'])test(`cancelling the waiting consumer settles before probe release, late ${late}`,async()=>{
 vi.useFakeTimers();reiniciaMemoriaContacte();enter(A);const entered=deferred();let resolveProbe,rejectProbe;
 const firstReply=new Promise((resolve,reject)=>{resolveProbe=resolve;rejectProbe=reject;});
 const fetch=vi.fn((_url,init)=>{entered.resolve(init);return firstReply;});vi.stubGlobal('fetch',fetch);
 const control=new AbortController(),add=vi.spyOn(control.signal,'addEventListener'),remove=vi.spyOn(control.signal,'removeEventListener');
 let secondState='pending';const one=out(write(CONFIG)),two=out(write({...CONFIG,signal:control.signal})).then(value=>{secondState=value;return value;});
 const original=await entered.promise;control.abort();await vi.advanceTimersByTimeAsync(0);
 const beforeRelease=secondState;
 try{
  expect(beforeRelease).toMatchObject({error:{name:'AbortError'}});expect(original.signal.aborted).toBe(false);expect(fetch).toHaveBeenCalledTimes(1);
  const waiter=add.mock.calls.find(([type])=>type==='abort')?.[1];expect(waiter).toBeTypeOf('function');expect(remove).toHaveBeenCalledWith('abort',waiter);
 }finally{
  if(late==='reject')rejectProbe(new TypeError('late probe fixture'));else resolveProbe(late==='absent'?new Response('{"code":"PGRST202"}',{status:404}):contact('primer@example.cat'));
  await Promise.all([one,two]);
 }
 expect(await two).toMatchObject({error:{name:'AbortError'}});expect(fetch).toHaveBeenCalledTimes(1);
});
