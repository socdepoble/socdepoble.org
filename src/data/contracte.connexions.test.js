import { expect,test } from 'vitest';
import * as port from './backendPort.js';
import { CAPACITATS, CONTRACTE_NUCLI } from './contracte.js';
const metodes=['preferenciesConnexions','desaVisibilitatConnexions','connexionsPubliquesDe','membresIEntitatsConnectadesDe','inclouPersonaEnEntitat','solicitaUnirSeAEntitat'];
test('FEDI23 · sis mètodes opcionals complets i delegats sense mutar nucli',()=>{
 expect(CAPACITATS.connexionsPubliques).toEqual(metodes);expect(Object.isFrozen(CAPACITATS.connexionsPubliques)).toBe(true);
 const nucli=Object.fromEntries(CONTRACTE_NUCLI.map(n=>[n,()=>null]));expect(()=>port.validaBackendImplementation(nucli)).not.toThrow();
 for(const n of metodes){expect(CONTRACTE_NUCLI).not.toContain(n);expect(typeof port[n]).toBe('function');}
 expect(()=>port.validaBackendImplementation({...nucli,preferenciesConnexions:()=>null})).toThrow('Capacitat parcial: connexionsPubliques');
 const impl={...nucli,...Object.fromEntries(metodes.map(n=>[n,(...args)=>({n,args})]))};port.setBackendImplementation(impl);
 for(const n of metodes) expect(port[n]({id:'x'},{})).toEqual({n,args:[{id:'x'},{}]});
});
