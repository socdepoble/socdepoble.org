// @vitest-environment node
import{expect,test}from'vitest';
import{creaMagatzemOptinXat,VIDA_OPTIN_XAT_MS}from'./xifratXatOptin.js';
import{creaIdbFalsEstructurat}from'../../tests/helpers/idbFalsEstructurat.js';
import{clauIdentitat}from'./xifratXatMagatzem.js';
const A='aaaaaaaa-1111-4111-8111-111111111111',B='bbbbbbbb-2222-4222-8222-222222222222',FIL='eeeeeeee-5555-4555-8555-555555555555';
const ci=(user=A,backendId='supabase',endpoint='https://example.test')=>clauIdentitat({backendId,endpoint,joId:user});
test('R20 opt-in durable només al seu compte, backend, endpoint, fil i kid',async()=>{
 const idb=creaIdbFalsEstructurat(),crea=()=>creaMagatzemOptinXat({idb,navegador:null,Canal:null,ara:()=>1000});
 const a=crea();await a.activa(ci(),FIL,'kidA');a.tanca();const reload=crea();
 expect((await reload.llegix(ci(),FIL,{kid:'kidA'})).actiu).toBe(true);
 for(const scope of [ci(B),ci(A,'node0'),ci(A,'supabase','https://other.test')])expect((await reload.llegix(scope,FIL,{kid:'kidA'})).actiu).toBe(false);
 expect((await reload.llegix(ci(),FIL+'altre',{kid:'kidA'})).actiu).toBe(false);
 expect((await reload.llegix(ci(),FIL,{kid:'kidB'})).actiu).toBe(false);
});
test('R20 caducitat i revocació tombstone fallen tancades en altra instància',async()=>{
 let now=1000;const idb=creaIdbFalsEstructurat(),crea=()=>creaMagatzemOptinXat({idb,navegador:null,Canal:null,ara:()=>now});
 const a=crea(),b=crea();await a.activa(ci(),FIL,'kid',{caducaMs:2000});now=2000;
 expect((await b.llegix(ci(),FIL,{kid:'kid'})).actiu).toBe(false);
 now=3000;await a.activa(ci(),FIL,'kid');await b.revoca(ci(),FIL);
 expect((await a.llegix(ci(),FIL,{kid:'kid'})).actiu).toBe(false);
 await expect(a.activa(ci(),FIL,'kid',{caducaMs:now+VIDA_OPTIN_XAT_MS+1})).rejects.toMatchObject({codi:'opt-in-caducitat-invalida'});
});
test('R20 sense IndexedDB no hi ha fallback de consentiment en memòria',async()=>{
 const store=creaMagatzemOptinXat({idb:null,navegador:null,Canal:null});
 await expect(store.activa(ci(),FIL,'kid')).rejects.toMatchObject({codi:'opt-in-no-persistent'});
 await expect(store.llegix(ci(),FIL,{kid:'kid'})).rejects.toMatchObject({codi:'opt-in-no-persistent'});
});
test('R20 canvi de sessió mentre espera no escriu opt-in antic',async()=>{
 const idb=creaIdbFalsEstructurat(),store=creaMagatzemOptinXat({idb,navegador:null,Canal:null});let viu=true;
 const op=store.activa(ci(),FIL,'kid',{exigix:()=>{if(!viu)throw new Error('sessio-canviada');}});viu=false;
 await expect(op).rejects.toThrow('sessio-canviada');
 expect((await store.llegix(ci(),FIL,{kid:'kid'})).actiu).toBe(false);
});
test('R20 absència de kid, àmbit malformat i quota no concedixen consentiment',async()=>{
 const idb=creaIdbFalsEstructurat(),store=creaMagatzemOptinXat({idb,navegador:null,Canal:null});
 for(const scope of ['null','[]','["a","b",null]',' ["a","b","c"]','no-json'])await expect(store.activa(scope,FIL,'kid')).rejects.toMatchObject({codi:'opt-in-abast-invalid'});
 await store.activa(ci(),FIL,'kid');expect((await store.llegix(ci(),FIL)).actiu).toBe(false);
 const rows=idb.files('sdp-xat-optin-v1','fils');expect(rows).toHaveLength(1);
 expect(Object.keys(rows[0].valor).sort()).toEqual(['caducaMs','ci','creatMs','fil','id','kid','revisio','revocatMs'].sort());
 idb.omplit=true;await expect(store.activa(ci(),FIL+'nou','kid')).rejects.toBeDefined();
 expect(idb.files('sdp-xat-optin-v1','fils')).toHaveLength(1);
});
