import { afterEach, expect, test, vi } from 'vitest';
import { creaAdaptadorLocal } from './adaptadorLocal.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
const A='1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', B='2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6', C='3f405162-7c8d-4e9f-8a01-c2d3e4f5a6b7';
const P='11111111-1111-4111-8111-111111111111', ORG='socdepoble';
const subjecte=id=>({tipus:'persona',id});
const codi=code=>expect.objectContaining({code});
const vius=[];
const nou=(extra={})=>{const a=creaAdaptadorLocal({mode:'local',dades:{persones:[A,B,C].map((id,i)=>({id,nom:['Anna','Berta','Carme'][i],avatar:'',publica:true,poble:'La Torre'})),towns:[{id:P,slug:'la-torre',title:'La Torre'}]},...extra});vius.push(a);return a;};
function entra(a,id=A,metadata={}){configuraBackendSessio(a.configuracio);expect(desaSessio({access_token:'testimoni-local',user:{id,user_metadata:metadata}})).toBe(true);}
const publica=(a,id)=>a.desaVisibilitatConnexions({...subjecte(id),visibilitatConnexions:'publica'});
afterEach(async()=>{esborraSessio({abast:'tot'});await Promise.all(vius.splice(0).map(a=>a.destroy()));vi.unstubAllGlobals();});

test('FEDI23 · global privada per defecte, own conserva connexions i públic no té bypass own',async()=>{
 const a=nou();entra(a);await a.segueix(subjecte(B));
 expect(await a.preferenciesConnexions(subjecte(A))).toMatchObject({visibilitatConnexions:'privada',connexions:[{tipus:'persona',id:B,visibilitatConnexions:'publica',direccio:'sortint'}]});
 expect(await a.connexionsPubliquesDe(subjecte(A))).toEqual([]);
 await publica(a,A);expect(await a.connexionsPubliquesDe(subjecte(A))).toMatchObject([{tipus:'persona',id:B,nom:'Berta',direccio:'sortint'}]);
 await a.desaVisibilitatConnexions({...subjecte(A),visibilitatConnexions:'privada',connexio:subjecte(B)});
 expect(await a.connexionsPubliquesDe(subjecte(A))).toEqual([]);
 await a.desaVisibilitatConnexions({...subjecte(A),visibilitatConnexions:'privada'});
 await a.desaVisibilitatConnexions({...subjecte(A),visibilitatConnexions:'publica',connexio:subjecte(B)});
 expect(await a.connexionsPubliquesDe(subjecte(A))).toEqual([]);
});

test('FEDI23 · union bidireccional deduplica i no publica reverse edge privat ni inventa mutua',async()=>{
 const a=nou();entra(a);await a.segueix(subjecte(B));await publica(a,A);
 entra(a,B);await a.segueix(subjecte(A));
 expect(await a.connexionsPubliquesDe(subjecte(A))).toMatchObject([{id:B,direccio:'sortint'}]);
 await publica(a,B);expect(await a.connexionsPubliquesDe(subjecte(A))).toMatchObject([{id:B,direccio:'mutua'}]);
 await a.desaVisibilitatConnexions({...subjecte(B),visibilitatConnexions:'privada',connexio:subjecte(A)});
 expect(await a.connexionsPubliquesDe(subjecte(A))).toEqual([]);
 entra(a);await a.deixaDeSeguir(subjecte(B));expect(await a.connexionsPubliquesDe(subjecte(A))).toEqual([]);
});

test('FEDI23 · prefs own/admin només, metadata forjada no dóna autoritat i DTO públic segur',async()=>{
 const a=nou();entra(a);await a.segueix(subjecte(B));await publica(a,A);
 entra(a,C,{role:'owner',is_superadmin:true,organization_id:'rentonar'});
 await expect(a.preferenciesConnexions(subjecte(A))).rejects.toEqual(codi('SDP-CONN-002'));
 await expect(a.desaVisibilitatConnexions({...subjecte(A),visibilitatConnexions:'publica'})).rejects.toEqual(codi('SDP-CONN-002'));
 await expect(a.desaVisibilitatConnexions({tipus:'entitat',id:'rentonar',visibilitatConnexions:'publica'})).rejects.toEqual(codi('SDP-CONN-002'));
 esborraSessio({abast:'tot'});const rows=await a.connexionsPubliquesDe(subjecte(A));expect(rows).toHaveLength(1);
 expect(Object.keys(rows[0]).sort()).toEqual(['avatar','creatAl','direccio','id','nom','ruta','tipus','visibilitatConnexions'].sort());
 expect(rows[0].ruta).toBe(`/gent/${B}`);expect(JSON.stringify(rows)).not.toMatch(/email|metadata|owner|tenant|actor/i);
});

test('FEDI23 · perfil no publicat, baixa i bloqueig no es revelen ni per reverse',async()=>{
 const a=nou();entra(a);await a.segueix(subjecte(B));await publica(a,A);
 entra(a,B);await a.getProfile();await a.updateProfile({is_public:false});
 expect(await a.connexionsPubliquesDe(subjecte(A))).toEqual([]);
 await a.updateProfile({is_public:true});entra(a);await a.bloquejaAutor({...subjecte(B),nom:'Berta'});
 expect(await a.connexionsPubliquesDe(subjecte(A))).toEqual([]);
});

test('FEDI23 · sortints privades d’entitat són gestionables sense exposició pública',async()=>{
 const a=nou();entra(a);await a.segueix({...subjecte(B),com:ORG});
 const prefs=await a.preferenciesConnexions({tipus:'entitat',id:ORG});expect(prefs.connexions).toMatchObject([{id:B,direccio:'sortint'}]);
 expect(await a.connexionsPubliquesDe({tipus:'entitat',id:ORG})).toEqual([]);
 await a.desaVisibilitatConnexions({tipus:'entitat',id:ORG,visibilitatConnexions:'publica'});
 expect(await a.connexionsPubliquesDe({tipus:'entitat',id:ORG})).toMatchObject([{id:B,direccio:'sortint'}]);
});

test('FEDI23 · membre necessita consentiment persona; treballador no rep autoritat i pending no concedeix res',async()=>{
 const a=nou();entra(a);await a.inclouPersonaEnEntitat({orgId:ORG,personaId:B,rol:'treballador'});
 await a.desaVisibilitatConnexions({tipus:'entitat',id:ORG,visibilitatConnexions:'publica'});
 expect(await a.membresIEntitatsConnectadesDe({tipus:'entitat',id:ORG})).toEqual([]);
 entra(a,B);expect((await a.listMyOrganizations()).find(o=>o.id===ORG)?.role).not.toBe('admin');await publica(a,B);
 expect(await a.membresIEntitatsConnectadesDe({tipus:'entitat',id:ORG})).toMatchObject([{id:B,rol:'treballador',direccio:'membre'}]);
 await a.desaVisibilitatConnexions({...subjecte(B),visibilitatConnexions:'privada',connexio:{tipus:'entitat',id:ORG}});
 expect(await a.membresIEntitatsConnectadesDe({tipus:'entitat',id:ORG})).toEqual([]);
 const abans=await a.listMyOrganizations();const pending=await a.solicitaUnirSeAEntitat({orgId:'rentonar',rol:'administrador'});
 expect(pending).toMatchObject({estat:'pendent',orgId:'rentonar',personaId:B,rol:'administrador'});expect(await a.listMyOrganizations()).toEqual(abans);
});

test('FEDI23 · admin no crea owner/admin i cap camp extra forja rol; membres se separen dels rols funcionals',async()=>{
 const a=nou();entra(a);await a.desaMembreOrganitzacio(ORG,{tipus:'persona',id:B,rol:'member'});await a.transfereixPropietatOrganitzacio(ORG,{tipus:'persona',id:B});
 await expect(a.inclouPersonaEnEntitat({orgId:ORG,personaId:C,rol:'administrador'})).rejects.toEqual(codi('SDP-ORGMEM-006'));
 await expect(a.inclouPersonaEnEntitat({orgId:ORG,personaId:C,rol:'owner'})).rejects.toEqual(codi('SDP-CONN-001'));
 await expect(a.inclouPersonaEnEntitat({orgId:ORG,personaId:C,rol:'usuari',role:'owner'})).rejects.toEqual(codi('SDP-CONN-001'));
 await a.inclouPersonaEnEntitat({orgId:ORG,personaId:C,rol:'usuari'});expect((await a.llistaMembresOrganitzacio(ORG)).find(m=>m.id===C)?.rol).toBe('member');
});

test('FEDI23 · poble exigeix autoritat explícita i només mostra vinculacions consentides i perfils públics',async()=>{
 const a=nou();entra(a);await expect(a.desaVisibilitatConnexions({tipus:'poble',id:P,visibilitatConnexions:'publica'})).rejects.toEqual(codi('SDP-CONN-002'));
 const b=nou({administracioLocal:{pobles:[{id:P,slug:'la-torre',nom:'La Torre'}],autoritza:async({personaId})=>personaId===A}});entra(b);
 await b.updateProfile({town_name:'La Torre'});await publica(b,A);await b.desaVisibilitatConnexions({tipus:'poble',id:P,visibilitatConnexions:'publica'});
 expect(await b.membresIEntitatsConnectadesDe({tipus:'poble',id:P})).toMatchObject([{tipus:'persona',id:A,direccio:'poble'}]);
 await b.desaVisibilitatConnexions({...subjecte(A),visibilitatConnexions:'privada',connexio:{tipus:'poble',id:P}});
 expect((await b.membresIEntitatsConnectadesDe({tipus:'poble',id:P})).some(r=>r.id===A)).toBe(false);
});

test('FEDI23 · snapshots abans microtasca/await, avortament i canvi sessió no escriuen',async()=>{
 const a=nou();entra(a);const dades={...subjecte(A),visibilitatConnexions:'publica'};const pending=a.desaVisibilitatConnexions(dades);dades.id=B;dades.visibilitatConnexions='privada';await pending;
 expect((await a.preferenciesConnexions(subjecte(A))).visibilitatConnexions).toBe('publica');
 const p=a.desaVisibilitatConnexions({...subjecte(A),visibilitatConnexions:'privada'});entra(a,B);await expect(p).rejects.toMatchObject({name:'AbortError'});
 entra(a);expect((await a.preferenciesConnexions(subjecte(A))).visibilitatConnexions).toBe('publica');
 const signal=AbortSignal.abort();await expect(a.desaVisibilitatConnexions({...subjecte(A),visibilitatConnexions:'privada'},{signal})).rejects.toMatchObject({name:'AbortError'});
});

test('FEDI23 · instàncies aïllades i accessors no executats, cap xarxa',async()=>{
 const fetch=vi.fn(()=>{throw new Error('XARXA_PROHIBIDA');});vi.stubGlobal('fetch',fetch);const a=nou(),b=nou();entra(a);await a.segueix(subjecte(B));await publica(a,A);
 expect(await b.connexionsPubliquesDe(subjecte(A))).toEqual([]);
 let calls=0;const hostile=Object.defineProperty({},'tipus',{enumerable:true,get(){calls++;return 'persona';}});
 await expect(a.desaVisibilitatConnexions(hostile)).rejects.toEqual(codi('SDP-CONN-001'));expect(calls).toBe(0);expect(fetch).not.toHaveBeenCalled();
});


test('FEDI23 · rols funcionals no sobreviuen baixa/promoció/degradació per API antiga',async()=>{
 const a=nou();entra(a);await a.reclamaOrganitzacio('rentonar');await a.inclouPersonaEnEntitat({orgId:'rentonar',personaId:B,rol:'treballador'});
 await a.desaVisibilitatConnexions({tipus:'entitat',id:'rentonar',visibilitatConnexions:'publica'});
 entra(a,B);await publica(a,B);expect((await a.listMyOrganizations()).some(o=>o.id==='rentonar')).toBe(false);
 expect((await a.membresIEntitatsConnectadesDe({tipus:'entitat',id:'rentonar'})).find(r=>r.id===B)?.rol).toBe('treballador');
 entra(a);await a.desaMembreOrganitzacio('rentonar',{tipus:'persona',id:B,rol:'member'});
 expect((await a.membresIEntitatsConnectadesDe({tipus:'entitat',id:'rentonar'})).find(r=>r.id===B)?.rol).toBe('usuari');
 await a.llevaMembreOrganitzacio('rentonar',{tipus:'persona',id:B});
 expect((await a.membresIEntitatsConnectadesDe({tipus:'entitat',id:'rentonar'})).some(r=>r.id===B)).toBe(false);
});

test('FEDI23 · bloqueig del peer també oculta l’aresta per a un observador anònim',async()=>{
 const a=nou();entra(a);await a.segueix(subjecte(B));await publica(a,A);
 entra(a,B);await a.bloquejaAutor({...subjecte(A),nom:'Anna'});esborraSessio({abast:'tot'});
 expect(await a.connexionsPubliquesDe(subjecte(A))).toEqual([]);
});

test('FEDI23 · el getter propi signal.aborted no s’executa i el callback poble no pot canviar actor/selector',async()=>{
 const a=nou();entra(a);let getters=0;const signal=new AbortController().signal;Object.defineProperty(signal,'aborted',{get(){getters++;return false;}});
 await publica(a,A);await a.desaVisibilitatConnexions({...subjecte(A),visibilitatConnexions:'privada'},{signal});expect(getters).toBe(0);
 let resol;const b=nou({administracioLocal:{pobles:[{id:P,slug:'la-torre',nom:'La Torre'}],autoritza:()=>new Promise(r=>{resol=r;})}});entra(b);
 const dades={tipus:'poble',id:P,visibilitatConnexions:'publica'},pending=b.desaVisibilitatConnexions(dades);
 await vi.waitFor(()=>expect(resol).toBeTypeOf('function'));dades.id='alié';entra(b,B);resol(true);
 await expect(pending).rejects.toMatchObject({name:'AbortError'});esborraSessio({abast:'tot'});expect(await b.connexionsPubliquesDe({tipus:'poble',id:P})).toEqual([]);
});


test('FEDI23 · preferències inclouen pertinences vives privades per a excloure-les individualment',async()=>{
 const a=nou();entra(a);await a.reclamaOrganitzacio('rentonar');await a.inclouPersonaEnEntitat({orgId:'rentonar',personaId:B,rol:'treballador'});
 expect((await a.preferenciesConnexions({tipus:'entitat',id:'rentonar'})).connexions).toEqual(expect.arrayContaining([expect.objectContaining({id:B,direccio:'membre',rol:'treballador'})]));
 entra(a,B);expect((await a.preferenciesConnexions(subjecte(B))).connexions).toMatchObject([{id:'rentonar',direccio:'membre',rol:'treballador'}]);
 await a.desaVisibilitatConnexions({...subjecte(B),visibilitatConnexions:'privada',connexio:{tipus:'entitat',id:'rentonar'}});
 expect((await a.preferenciesConnexions(subjecte(B))).connexions[0].visibilitatConnexions).toBe('privada');
});


test('FEDI23 · canvi de sessió entre guarda i await intern rebutja abans de la mutació',async()=>{
 const a=nou();entra(a);await publica(a,A);
 const pending=a.desaVisibilitatConnexions({...subjecte(A),visibilitatConnexions:'privada'});
 queueMicrotask(()=>entra(a,B));await expect(pending).rejects.toMatchObject({name:'AbortError'});
 entra(a);expect((await a.preferenciesConnexions(subjecte(A))).visibilitatConnexions).toBe('publica');
});


test('FEDI23 · exclusió del vincle poble→resident domina consentiment públic del resident',async()=>{
 const a=nou({administracioLocal:{pobles:[{id:P,slug:'la-torre',nom:'La Torre'}],autoritza:async({personaId})=>personaId===A}});
 entra(a,B);await a.updateProfile({town_name:'La Torre'});await publica(a,B);
 entra(a);await a.desaVisibilitatConnexions({tipus:'poble',id:P,visibilitatConnexions:'publica'});
 expect((await a.membresIEntitatsConnectadesDe({tipus:'poble',id:P})).some(r=>r.id===B)).toBe(true);
 await a.desaVisibilitatConnexions({tipus:'poble',id:P,visibilitatConnexions:'privada',connexio:subjecte(B)});
 esborraSessio({abast:'tot'});expect((await a.membresIEntitatsConnectadesDe({tipus:'poble',id:P})).some(r=>r.id===B)).toBe(false);
});


test('FEDI23 · vincle de poble només injectat usa el mateix id canònic que la lectura pública',async()=>{
 const a=nou({dades:{towns:[],persones:[]},administracioLocal:{pobles:[{id:P,slug:'sella',nom:'Sella'}],autoritza:async({personaId})=>personaId===A}});
 entra(a,B);await a.updateProfile({town_name:'Sella'});await publica(a,B);
 entra(a);await a.desaVisibilitatConnexions({tipus:'poble',id:'sella',visibilitatConnexions:'publica'});
 expect((await a.membresIEntitatsConnectadesDe({tipus:'poble',id:P})).some(r=>r.id===B)).toBe(true);
 entra(a,B);await a.desaVisibilitatConnexions({...subjecte(B),visibilitatConnexions:'privada',connexio:{tipus:'poble',id:'sella'}});
 esborraSessio({abast:'tot'});expect((await a.membresIEntitatsConnectadesDe({tipus:'poble',id:P})).some(r=>r.id===B)).toBe(false);
});


test('FEDI23 · gestió pròpia del poble mostra vincles consentits encara que poble o vincle propi siguen privats',async()=>{
 const a=nou({dades:{towns:[],persones:[]},administracioLocal:{pobles:[{id:P,slug:'sella',nom:'Sella'}],autoritza:async({personaId})=>personaId===A}});
 entra(a,B);await a.updateProfile({town_name:'Sella'});await publica(a,B);
 entra(a);const subjectePoble={tipus:'poble',id:'sella'};
 expect(await a.preferenciesConnexions(subjectePoble)).toMatchObject({visibilitatConnexions:'privada',connexions:[{id:B,visibilitatConnexions:'publica',direccio:'poble'}]});
 await a.desaVisibilitatConnexions({...subjectePoble,visibilitatConnexions:'privada',connexio:subjecte(B)});
 expect((await a.preferenciesConnexions(subjectePoble)).connexions).toMatchObject([{id:B,visibilitatConnexions:'privada'}]);
 expect(await a.membresIEntitatsConnectadesDe(subjectePoble)).toEqual([]);
 await a.desaVisibilitatConnexions({...subjectePoble,visibilitatConnexions:'publica',connexio:subjecte(B)});
 await a.desaVisibilitatConnexions({...subjectePoble,visibilitatConnexions:'publica'});
 expect((await a.membresIEntitatsConnectadesDe(subjectePoble)).some(r=>r.id===B)).toBe(true);
 entra(a,B);await a.desaVisibilitatConnexions({...subjecte(B),visibilitatConnexions:'privada',connexio:{tipus:'poble',id:P}});
 entra(a);expect((await a.preferenciesConnexions(subjectePoble)).connexions).toEqual([]);
});


test('FEDI23 · bloqueig del representant humà també oculta l’aresta pública d’entitat sense filtrar actor',async()=>{
 const a=nou();entra(a);await a.segueix({...subjecte(B),com:ORG});await a.desaVisibilitatConnexions({tipus:'entitat',id:ORG,visibilitatConnexions:'publica'});
 expect((await a.connexionsPubliquesDe({tipus:'entitat',id:ORG})).some(r=>r.id===B)).toBe(true);
 entra(a,B);await a.bloquejaAutor({...subjecte(A),nom:'Anna'});esborraSessio({abast:'tot'});
 expect(await a.connexionsPubliquesDe({tipus:'entitat',id:ORG})).toEqual([]);
});


test('FEDI23 · entitat membre sense follow és gestionable pels dos extrems amb visibilitat pròpia',async()=>{
 const a=nou();entra(a);await a.reclamaOrganitzacio('rentonar');await a.desaMembreOrganitzacio(ORG,{tipus:'organitzacio',id:'rentonar',rol:'member'});
 const parent={tipus:'entitat',id:ORG},member={tipus:'entitat',id:'rentonar'};
 expect((await a.preferenciesConnexions(parent)).connexions).toEqual(expect.arrayContaining([expect.objectContaining({tipus:'entitat',id:'rentonar',rol:'usuari',direccio:'membre',visibilitatConnexions:'publica'})]));
 expect((await a.preferenciesConnexions(member)).connexions).toEqual(expect.arrayContaining([expect.objectContaining({tipus:'entitat',id:ORG,rol:'usuari',direccio:'membre',visibilitatConnexions:'publica'})]));
 await a.desaVisibilitatConnexions({...parent,visibilitatConnexions:'privada',connexio:member});
 expect((await a.preferenciesConnexions(parent)).connexions.find(r=>r.id==='rentonar').visibilitatConnexions).toBe('privada');
 await a.llevaMembreOrganitzacio(ORG,{tipus:'organitzacio',id:'rentonar'});
 expect((await a.preferenciesConnexions(parent)).connexions.some(r=>r.tipus==='entitat'&&r.id==='rentonar')).toBe(false);
 expect((await a.preferenciesConnexions(member)).connexions.some(r=>r.tipus==='entitat'&&r.id===ORG)).toBe(false);
});
