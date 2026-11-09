import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {despertaXatConfirmat} from './despertaXat.js';
/* Sanejament R15 (B2 · P1-01, Q-06) · notifica-xat-desperta no és a producció: sense
   VITE_SDP_XAT_RITME==='1' (literal de build), cap petició. Amb la bandera, el kit. */
describe('sense la bandera VITE_SDP_XAT_RITME, cap petició a notifica-xat-desperta',()=>{
 afterEach(()=>vi.unstubAllEnvs());
 it.each([undefined,'','0','true',' 1','1 '])('valor %s: torna false i no invoca res, ni després de la cua de microtasques',async valor=>{
  if(valor===undefined)vi.stubEnv('VITE_SDP_XAT_RITME',undefined);else vi.stubEnv('VITE_SDP_XAT_RITME',valor);
  const invoke=vi.fn().mockResolvedValue({data:{ok:true}}),vigent=vi.fn(()=>true);
  expect(despertaXatConfirmat({functions:{invoke}},{missatgeId:'00000000-0000-4000-8000-000000000001',seq:4},vigent)).toBe(false);
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  expect(invoke).not.toHaveBeenCalled();expect(vigent).not.toHaveBeenCalled();
 });
 it('la guarda és el literal plegable, la primera sentència de la funció',()=>{
  const codi=readFileSync(resolve(process.cwd(),'src/data/supabase/despertaXat.js'),'utf8');
  const cos=codi.slice(codi.indexOf('export function despertaXatConfirmat')).replace(/\/\*[\s\S]*?\*\//g,'');
  expect(cos).toMatch(/^export function despertaXatConfirmat\([^)]*\)\s*\{\s*if \(import\.meta\.env\.VITE_SDP_XAT_RITME !== '1'\) return false;/);
 });
});
beforeEach(()=>vi.stubEnv('VITE_SDP_XAT_RITME','1'));
afterEach(()=>vi.unstubAllEnvs());
const missatgeId='00000000-0000-4000-8000-000000000001';
const settle=async()=>{await Promise.resolve();await Promise.resolve();};
it('sends only committed id with SDK deadline and captured-scope check',async()=>{
 const invoke=vi.fn().mockResolvedValue({data:{ok:true}}),signal=new AbortController().signal;
 expect(despertaXatConfirmat({functions:{invoke}},{missatgeId,seq:4,signal},()=>true)).toBe(true);expect(invoke).not.toHaveBeenCalled();await settle();expect(invoke).toHaveBeenCalledWith('notifica-xat-desperta',{body:{missatgeId},timeout:8000,signal});
});
it.each([{missatgeId:'bad',seq:1},{missatgeId,seq:0},{missatgeId,seq:1.5},{missatgeId,seq:'1'},{missatgeId,seq:NaN}])('rejects unconfirmed/malformed data before invocation',value=>{
 const invoke=vi.fn();expect(despertaXatConfirmat({functions:{invoke}},value,()=>true)).toBe(false);expect(invoke).not.toHaveBeenCalled();
});
it('checks captured identity again in the dispatch microtask',async()=>{
 let current=true;const invoke=vi.fn();despertaXatConfirmat({functions:{invoke}},{missatgeId,seq:1},()=>current);current=false;await settle();expect(invoke).not.toHaveBeenCalled();
});
it('cancellation after enqueue prevents the invoke',async()=>{
 const c=new AbortController(),invoke=vi.fn();despertaXatConfirmat({functions:{invoke}},{missatgeId,seq:1,signal:c.signal},()=>true);c.abort();await settle();expect(invoke).not.toHaveBeenCalled();
});
it('absent SDK capability, synchronous/async failure and throwing guard never escape',async()=>{
 expect(despertaXatConfirmat({}, {missatgeId,seq:1},()=>true)).toBe(false);
 expect(despertaXatConfirmat({functions:{invoke:vi.fn()}},{missatgeId,seq:1},()=>{throw Error('guard');})).toBe(false);
 for(const invoke of [()=>{throw Error('offline');},()=>Promise.reject(Error('offline')),()=>new Promise(()=>{})])expect(()=>despertaXatConfirmat({functions:{invoke}},{missatgeId,seq:1},()=>true)).not.toThrow();await settle();
});
