import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {iniciaActualitzacioWeb} from './actualitzacioWeb.js';
const instances=[];
beforeEach(()=>vi.useFakeTimers());
afterEach(()=>{for(const a of instances.splice(0))a.tanca();vi.useRealTimers();});
function start(options={}){
 const win=new EventTarget();win.document=new EventTarget();win.document.visibilityState='visible';win.navigator={onLine:true};
 win.location={reload:vi.fn()};win.setTimeout=(...args)=>setTimeout(...args);win.clearTimeout=id=>clearTimeout(id);win.Event=Event;
 let reload;
 const api=iniciaActualitzacioWeb({finestra:win,fetchImpl:async()=>({ok:true,status:200,text:async()=>JSON.stringify({versioSistema:'1.2.99'})}),versioCarregada:'1.2.1',publica:vi.fn(),fixaRecarrega:fn=>{if(fn)reload=fn;},esperaWorker:1500,...options});
 instances.push(api);return {win,api,reload:()=>reload()};
}
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
test('C7 · tanca durant preparació veta qualsevol reload tardà i callback retingut',async()=>{
 const worker=deferred(),prepare=vi.fn(()=>worker.promise),e=start({preparaWorker:prepare});await e.api.comprova();e.reload();await vi.advanceTimersByTimeAsync(0);
 expect(prepare).toHaveBeenCalledTimes(1);e.api.tanca();worker.resolve();await vi.advanceTimersByTimeAsync(2000);
 expect(e.win.location.reload).not.toHaveBeenCalled();e.reload();await vi.advanceTimersByTimeAsync(0);expect(prepare).toHaveBeenCalledTimes(1);
});
test('C7 · estat pendent que naix durant await exigeix confirmació abans de recarregar',async()=>{
 const worker=deferred(),confirm=vi.fn(()=>false);let pending=false;
 const e=start({preparaWorker:()=>worker.promise,tePendents:()=>pending,confirma:confirm});await e.api.comprova();e.reload();await vi.advanceTimersByTimeAsync(0);
 pending=true;worker.resolve();await vi.advanceTimersByTimeAsync(0);
 expect(confirm).toHaveBeenCalledTimes(1);expect(e.win.location.reload).not.toHaveBeenCalled();
 pending=false;e.reload();await vi.advanceTimersByTimeAsync(0);expect(e.win.location.reload).toHaveBeenCalledTimes(1);
});
test('C7 · tanca retira timers de tall i de recàrrega cancel·lada',async()=>{
 const worker=deferred(),e=start({preparaWorker:()=>worker.promise});await e.api.comprova();e.reload();await vi.advanceTimersByTimeAsync(0);
 e.api.tanca();expect(vi.getTimerCount()).toBe(0);worker.resolve();await vi.advanceTimersByTimeAsync(0);
 const other=start({preparaWorker:async()=>{}});await other.api.comprova();other.reload();await vi.advanceTimersByTimeAsync(0);
 expect(other.win.location.reload).toHaveBeenCalledTimes(1);other.api.tanca();expect(vi.getTimerCount()).toBe(0);
});
