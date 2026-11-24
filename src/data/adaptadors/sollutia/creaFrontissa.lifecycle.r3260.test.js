// @vitest-environment node
import {getEventListeners} from 'node:events';
import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {creaFrontissa} from './creaFrontissa.js';
beforeEach(()=>vi.useFakeTimers());afterEach(()=>vi.useRealTimers());
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function setup(fetchImpl,decode=raw=>({name:raw.name})){return creaFrontissa({apiOrigin:'https://fixture.invalid',allowedOrigins:['https://fixture.invalid'],resources:{sample:{enabled:true,captureId:'synthetic-c8',path:'/sample',params:[],maxBytes:128,timeoutMs:20,decode}},fetchImpl});}
function lateResponse(cancel){return new Response(new ReadableStream({cancel}),{headers:{'content-type':'application/json'}});}
test.each(['abort','timeout'])('C8 · body de resposta tardana es cancel·la després de %s sense decodificar',async mode=>{
 const fetch=deferred(),cancel=vi.fn(),decode=vi.fn(),external=new AbortController();
 const pending=setup(()=>fetch.promise,decode)('sample',{},{signal:external.signal});const rejected=expect(pending).rejects.toMatchObject({code:mode==='abort'?'CANCELLED':'TIMEOUT'});
 if(mode==='abort')external.abort();else await vi.advanceTimersByTimeAsync(21);await rejected;
 expect(getEventListeners(external.signal,'abort')).toHaveLength(0);expect(vi.getTimerCount()).toBe(0);
 const response=lateResponse(cancel);fetch.resolve(response);await settle();
 expect(cancel).toHaveBeenCalledTimes(1);expect(response.body.locked).toBe(false);expect(decode).not.toHaveBeenCalled();
});
test('C8 · rebuig de cancel del cos tardà queda consumit i manté refús original',async()=>{
 const fetch=deferred(),cancel=vi.fn(()=>Promise.reject(new Error('Synthetic stream cancel failure'))),external=new AbortController();
 const pending=setup(()=>fetch.promise)('sample',{},{signal:external.signal});const rejected=expect(pending).rejects.toMatchObject({code:'CANCELLED'});external.abort();await rejected;
 fetch.resolve(lateResponse(cancel));await settle();expect(cancel).toHaveBeenCalledTimes(1);
});
test('C8 · resposta normal es consumix i neteja listener/timer sense cancel·lar el cos complet',async()=>{
 const external=new AbortController(),fetch=vi.fn(async()=>new Response('{"name":"A"}',{headers:{'content-type':'application/json'}}));
 await expect(setup(fetch)('sample',{},{signal:external.signal})).resolves.toEqual({name:'A'});
 expect(getEventListeners(external.signal,'abort')).toHaveLength(0);expect(vi.getTimerCount()).toBe(0);
});
