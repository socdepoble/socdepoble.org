// @vitest-environment node
import { test, expect, vi } from 'vitest';
import { createLocalXatAdapter, reiniciaLocalXat } from './localXat.js';
vi.mock('./identitat.js',()=>({usuariDeSessio:()=>({id:'anna'}),getDefaultUserId:()=> 'anna'}));
test('dos pobles amb el mateix fil seed no compartixen avisos; baixa i microtasca també respecten l’abast',async()=>{
 reiniciaLocalXat();
 const a=createLocalXatAdapter(), b=createLocalXatAdapter();
 const ca={dataMode:'seed',tenantId:'00000000-0000-4000-8000-000000000001'};
 const cb={...ca,tenantId:'00000000-0000-4000-8000-000000000002'};
 const fa=(await a.loadFils(ca)).find(f=>f.tipus==='grup');
 expect((await b.loadFils(cb)).some(f=>f.id===fa.id)).toBe(true);
 const avisA=vi.fn(),avisB=vi.fn();
 const sa=await a.subscribeToXat(fa.id,avisA,ca),sb=await b.subscribeToXat(fa.id,avisB,cb);
 await a.enviaMissatge(fa.id,{id:'m1',text:'prova'},ca);
 await Promise.resolve();
 expect(avisA).toHaveBeenCalledTimes(1);expect(avisB).not.toHaveBeenCalled();
 await a.unsubscribeFromXat(sa.subscription);
 await a.enviaMissatge(fa.id,{id:'m2',text:'prova'},ca);
 await Promise.resolve();expect(avisA).toHaveBeenCalledTimes(1);
 await b.unsubscribeFromXat(sb.subscription);reiniciaLocalXat();
});
