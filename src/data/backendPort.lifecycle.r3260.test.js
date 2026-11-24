// @vitest-environment node
import {getEventListeners} from 'node:events';
import {afterEach,expect,test,vi} from 'vitest';
import {CONTRACTE_NUCLI} from './contracte.js';
import {setBackendImplementation,loadNotesPage,destroy} from './backendPort.js';
import {estatPort} from './backendPortEstat.js';
afterEach(()=>{destroy();estatPort.currentImpl=null;estatPort.isLocked=false;});
test('C8 · segon senyal invàlid no deixa l’alta parcial del primer AbortSignal genuí',async()=>{
 const read=vi.fn(),impl=Object.fromEntries(CONTRACTE_NUCLI.map(name=>[name,()=>{}]));impl.loadNotesPage=read;setBackendImplementation(impl);
 const first=new AbortController();expect(getEventListeners(first.signal,'abort')).toHaveLength(0);
 await expect(Promise.resolve().then(()=>loadNotesPage({signal:{}},{signal:first.signal}))).rejects.toBeInstanceOf(TypeError);
 expect(read).not.toHaveBeenCalled();expect(getEventListeners(first.signal,'abort')).toHaveLength(0);expect(estatPort.lecturesEnVol.size).toBe(0);
});

test('C8 · alta que llança desfà també el primer listener genuí i conserva la causa', async () => {
 const read=vi.fn(),impl=Object.fromEntries(CONTRACTE_NUCLI.map(name=>[name,()=>{}]));impl.loadNotesPage=read;setBackendImplementation(impl);
 const first=new AbortController(),cause=new Error('Alta refusada.'),second={addEventListener(){throw cause;},removeEventListener(){}};
 await expect(Promise.resolve().then(()=>loadNotesPage({signal:second},{signal:first.signal}))).rejects.toBe(cause);
 expect(read).not.toHaveBeenCalled();expect(getEventListeners(first.signal,'abort')).toHaveLength(0);expect(estatPort.lecturesEnVol.size).toBe(0);
});
