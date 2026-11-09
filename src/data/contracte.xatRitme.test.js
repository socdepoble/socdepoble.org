import {expect,it} from 'vitest';
import {CAPACITATS,CONTRACTE_NUCLI} from './contracte.js';
import {validaBackendImplementation} from './backendPort.js';
it('xatRitme is optional, complete and never changes the exact32-method core',()=>{
 expect(CONTRACTE_NUCLI).toHaveLength(32);expect(CAPACITATS.xatRitme).toEqual(['loadRitmeXat','actualitzaPresenciaXat']);
 const core=Object.fromEntries(CONTRACTE_NUCLI.map(n=>[n,()=>null]));expect(()=>validaBackendImplementation(core)).not.toThrow();
 expect(()=>validaBackendImplementation({...core,loadRitmeXat:()=>null})).toThrow('Capacitat parcial: xatRitme');
 expect(()=>validaBackendImplementation({...core,loadRitmeXat:()=>null,actualitzaPresenciaXat:()=>null})).not.toThrow();
 for(const n of CAPACITATS.xatRitme)expect(CONTRACTE_NUCLI).not.toContain(n);
});
