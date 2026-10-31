import { beforeEach, afterEach, expect, test, vi } from 'vitest';
vi.mock('../src/PedraSecaEmbed.jsx',()=>({defineCustomElement:vi.fn()}));
vi.mock('../src/data/identitat.js',()=>({adoptaSessioExterna:vi.fn(),esborraSessio:vi.fn(),configuraBackendSessio:vi.fn()}));
vi.mock('../src/utils/sanitize.js',()=>({sanitizeHtml:x=>x}));
vi.mock('../src/config/xifratXat.js',async(importOriginal)=>({...await importOriginal(),E2EE_ACTIU_PER_DEFECTE:true}));
vi.mock('../src/data/supabase/index.js',async()=>{
 const {CONTRACTE_NUCLI}=await import('../src/data/contracte.js');return Object.fromEntries(CONTRACTE_NUCLI.map(n=>[n,vi.fn()]));
});
beforeEach(()=>{vi.resetModules();vi.stubGlobal('isSecureContext',true);});
afterEach(()=>vi.unstubAllGlobals());
test('l’adaptador injectat rep servei abans de validació i segellat, sense ampliar el contracte',async()=>{
 const {CONTRACTE_NUCLI}=await import('../src/data/contracte.js'),host=await import('../src/host.js');
 const impl=Object.fromEntries(CONTRACTE_NUCLI.map(n=>[n,vi.fn()]));host.injectaBackendDelPaquet(impl);await host.arrenca();
 const {getBackendImplementation}=await import('../src/data/backendPort.js'),{serveiXifratXat}=await import('../src/data/xifratXat.js');
 const backend=getBackendImplementation();expect(Object.isFrozen(backend)).toBe(true);expect(serveiXifratXat(backend)).not.toBeNull();expect(Object.keys(backend)).not.toContain('fixaAmbit');
});
test('l’adaptador per defecte passa pel mateix decorador abans de segellar',async()=>{
 const host=await import('../src/host.js');await host.arrenca();const {getBackendImplementation}=await import('../src/data/backendPort.js'),{serveiXifratXat}=await import('../src/data/xifratXat.js');
 expect(Object.isFrozen(getBackendImplementation())).toBe(true);expect(serveiXifratXat(getBackendImplementation())).not.toBeNull();
});
/* P1-12 pas 17 (disseny §4.7) · host.js passa el pressupost LRU dels blob: desxifrats per classe d'aparell. */
test('pressupost dels blob: per defecte, 100 MB a l’escriptori (sense punter gruixut ni app nativa)',async()=>{
 const host=await import('../src/host.js');await host.arrenca();const {getBackendImplementation}=await import('../src/data/backendPort.js'),{serveiXifratXat}=await import('../src/data/xifratXat.js');
 expect(serveiXifratXat(getBackendImplementation()).estatAmbit()).toMatchObject({pressupostBlobs:100_000_000,bytesBlobs:0});
});
test('amb punter gruixut (mòbil o tauleta) el pressupost és de 48 MB',async()=>{
 vi.stubGlobal('matchMedia',(q)=>({matches:q==='(pointer: coarse)'}));
 const host=await import('../src/host.js');await host.arrenca();const {getBackendImplementation}=await import('../src/data/backendPort.js'),{serveiXifratXat}=await import('../src/data/xifratXat.js');
 expect(serveiXifratXat(getBackendImplementation()).estatAmbit().pressupostBlobs).toBe(48_000_000);
});
test('un matchMedia que llança no trenca l’arrencada: cau a l’escriptori',async()=>{
 vi.stubGlobal('matchMedia',()=>{throw new Error('sense media queries');});
 const host=await import('../src/host.js');await host.arrenca();const {getBackendImplementation}=await import('../src/data/backendPort.js'),{serveiXifratXat}=await import('../src/data/xifratXat.js');
 expect(serveiXifratXat(getBackendImplementation()).estatAmbit().pressupostBlobs).toBe(100_000_000);
});
