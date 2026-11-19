import { expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaServeiProjeccionsCataleg,creaMagatzemProjeccionsCataleg,registreProjeccioPendent } from './projeccionsCatalegServei.js';
import { creaIdbFals } from '../utils/__fixtures__/navegadorFals.js';
const SCOPE={tenantId:'22222222-2222-4222-8222-222222222222',ownerId:'11111111-1111-4111-8111-111111111111',backendId:'r3211-lab'};
const FONT={font:'herbari',id:'romer',title:'LAB initial',subtitle:'',lead:''};
function fixture(){const {idb}=creaIdbFals();let tick=0;const receipts=new Map(),calls=[];let lose=false,hook;
 const publica=vi.fn(async sub=>{calls.push(structuredClone(sub));await hook?.(sub);let receipt=receipts.get(sub.operationId);if(!receipt){receipt={...structuredClone(sub),updatedAt:`2026-11-18T01:00:00.${String(++tick).padStart(6,'0')}Z`};receipts.set(sub.operationId,receipt);}if(lose){lose=false;throw Error('lost ACK');}return structuredClone(receipt);});
 const crea=extra=>creaServeiProjeccionsCataleg({abast:SCOPE,idb,navegador:null,Canal:null,subtil:webcrypto.subtle,versionada:true,publica,...extra});
 return{crea,publica,calls,receipts,lose:()=>{lose=true;},hook:value=>{hook=value;}};
}
test('first CAS create persists op before dispatch, then exact opaque versions for updates',async()=>{
 const f=fixture(),s=f.crea();await s.prepara();await s.desa(FONT,['mur','bar']);f.hook(async sub=>{const row=(await s.llista())[0],a=sub.sectionId==='mur'?'publica':'privada';expect(row.operacions[a].id).toBe(sub.operationId);expect(row.operacions[a].expectedUpdatedAt).toBe(sub.expectedUpdatedAt);});
 await s.sincronitza();expect(f.calls.map(x=>x.expectedUpdatedAt)).toEqual([null,null]);const versions=(await s.llista())[0].versions;
 await s.desa({...FONT,title:'new'},['mur','bar']);await s.sincronitza();expect(f.calls.slice(2).map(x=>x.expectedUpdatedAt)).toEqual([versions.privada,versions.publica]);expect(registreProjeccioPendent((await s.llista())[0])).toBe(false);s.tanca();
});
test('lost ACK survives reload and later local draft: replay old exact operation then publish new edit',async()=>{
 const f=fixture();let s=f.crea();await s.prepara();await s.desa(FONT,['mur','bar']);f.lose();await expect(s.sincronitza()).rejects.toThrow('lost ACK');const operation=(await s.llista())[0].operacions.privada;await s.desa({...FONT,title:'new local draft'},['mur','bar']);s.tanca();
 s=f.crea();await s.prepara();expect((await s.llista())[0].operacions.privada).toEqual(operation);await s.sincronitza();expect(f.calls[1]).toEqual(f.calls[0]);const row=(await s.llista())[0];expect(row.font.title).toBe('new local draft');expect(row.confirmacions).toEqual({privada:2,publica:2});expect(row.operacions).toEqual({privada:null,publica:null});expect(f.receipts.size).toBe(3);s.tanca();
});
test('missing RPC, invalid ACK and cancellation retain draft, token and op',async()=>{
 for(const mode of ['missing','ack','cancel']){const f=fixture();let active=true;const s=f.crea({comprovaSessio:()=>{if(!active)throw new DOMException('scope','AbortError');},publica:async sub=>{if(mode==='missing')throw Object.assign(Error('missing'),{codi:'esquema-absent'});if(mode==='cancel'){active=false;return sub;}return{...sub,operationId:'foreign',updatedAt:'2026-11-18T00:00:00.000001Z'};}});await s.prepara();await s.desa(FONT,['bar']);await expect(s.sincronitza()).rejects.toBeTruthy();active=true;const row=(await s.llista())[0];expect(row.confirmacions.privada).toBe(0);expect(row.operacions.privada.id).toMatch(/^[a-f0-9-]{36}$/);expect(row.versions.privada).toBeNull();s.tanca();}
});
test('private-only source never sends public id and op is closed after complete ACK',async()=>{const f=fixture(),s=f.crea();await s.prepara();await s.desa(FONT,['bar']);await s.sincronitza();expect(f.calls).toHaveLength(1);expect(f.calls[0].sectionId).toBe('notes');expect(registreProjeccioPendent((await s.llista())[0])).toBe(false);s.tanca();});

test('storage failure saving op blocks all dispatch and preserves the draft',async()=>{
 const base=creaMagatzemProjeccionsCataleg({abast:SCOPE,idb:null,navegador:null,Canal:null});let fail=false;
 const wrapped={...base,actualitza:(store,key,change)=>base.actualitza(store,key,current=>{const next=change(current);if(fail&&next?.operacions?.privada)throw Error('storage refused');return next;})};
 const publica=vi.fn(),s=creaServeiProjeccionsCataleg({abast:SCOPE,magatzem:wrapped,subtil:webcrypto.subtle,versionada:true,publica});await s.prepara();await s.desa(FONT,['bar']);fail=true;
 await expect(s.sincronitza()).rejects.toThrow('storage refused');expect(publica).not.toHaveBeenCalled();const row=(await s.llista())[0];expect(row.font).toEqual(FONT);expect(row.confirmacions.privada).toBe(0);expect(row.operacions.privada).toBeNull();s.tanca();
});
test('legacy confirmed publication with unknown token cannot become create-only CAS',async()=>{
 const f=fixture();const legacy=f.crea({versionada:false,publica:async sub=>sub});await legacy.prepara();await legacy.desa(FONT,['bar']);await legacy.sincronitza();legacy.tanca();
 const s=f.crea();await s.prepara();await s.desa({...FONT,title:'new'},['bar']);await expect(s.sincronitza()).rejects.toMatchObject({codi:'versio-desconeguda'});expect(f.publica).not.toHaveBeenCalled();expect((await s.llista())[0].font.title).toBe('new');s.tanca();
});
test('a persisted CAS row cannot downgrade to legacy after reload, pending or already confirmed',async()=>{
 for(const pending of [true,false]){const f=fixture();let s=f.crea();await s.prepara();await s.desa(FONT,['bar']);if(pending){f.lose();await expect(s.sincronitza()).rejects.toThrow('lost ACK');}else{await s.sincronitza();await s.desa({...FONT,title:'next'},['bar']);}s.tanca();
 const legacy=vi.fn(async sub=>sub);s=f.crea({versionada:false,publica:legacy});await s.prepara();await expect(s.sincronitza()).rejects.toMatchObject({codi:'cas-no-disponible'});expect(legacy).not.toHaveBeenCalled();expect(registreProjeccioPendent((await s.llista())[0])).toBe(true);s.tanca();}
});
test('removing public destination while private ACK waits never dispatches a new public id',async()=>{
 const f=fixture(),s=f.crea();await s.prepara();await s.desa(FONT,['bar','mur']);let changed=false;f.hook(async sub=>{if(!changed&&sub.sectionId==='notes'){changed=true;await s.desa({...FONT,title:'private now'},['bar']);}});
 await s.sincronitza();expect(f.calls.every(sub=>sub.sectionId==='notes')).toBe(true);expect((await s.llista())[0].confirmacions).toEqual({privada:2,publica:2});s.tanca();
});
