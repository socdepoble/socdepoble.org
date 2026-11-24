import {afterEach,expect,test} from 'vitest';
import {creaAdaptadorLocal} from './adaptadorLocal.js';
import {configuraBackendSessio,desaSessio,esborraSessio} from '../identitat.js';
import {creaPaquetCompte,llegeixPaquetCompte} from '../portabilitatCompte.js';
const A='ca111111-1111-4111-8111-111111111111',B='ca222222-2222-4222-8222-222222222222';
const instances=[];
function create(){const a=creaAdaptadorLocal({mode:'local',tenantId:'a1111111-1111-4111-8111-111111111111',ara:()=>new Date('2026-11-23T12:00:00Z')});instances.push(a);return a;}
function enter(a,id=A){configuraBackendSessio(a.configuracio);desaSessio({access_token:'portable-local-fixture',user:{id}});}
afterEach(async()=>{await Promise.all(instances.splice(0).map(a=>a.destroy()));esborraSessio({abast:'tot'});});
test('v2 real account inclou carpeta/notes/org/patrimoni que RGPD v1 no promet',async()=>{
 const a=create();enter(a);
 const folder=await a.creaCarpetaNotes({nom:'Carpeta prova'});
 await a.createNote({id:'nota-original',title:'Text',content:'cos',folderId:folder.id});
 await a.desaRevisioPatrimoni({entitatTipus:'arbre',entitatSlug:'om-prova',campanyaAny:2026,versio:0,estatConservacio:'Bo',mesures:{altura:0},observacions:'camp'});
 const old=await a.exportaLesMeuesDades();expect(old.format).toBe('socdepoble.exportacio.v1');expect(old).not.toHaveProperty('noteFolders');
 const snapshot=await a.llegixCopiaCompte();
 expect(snapshot.dades.noteFolders).toContainEqual(expect.objectContaining({id:folder.id,nom:'Carpeta prova'}));
 expect(snapshot.dades.notes).toContainEqual(expect.objectContaining({id:'nota-original',content:'cos'}));expect(snapshot.dades.patrimoni).toHaveLength(1);
 const pack=creaPaquetCompte(snapshot),parsed=llegeixPaquetCompte(pack.zip,{sha256Esperat:pack.sha256});
 const restored=await a.restauraCopiaCompte(parsed);instances.push(restored.adaptador);
 expect(restored.restauracio.durabilitat).toBe('memoria');
 expect(restored.adaptador.perfilCopia).toBe('negoci-local');
 for(const excluded of ['loadFils','enviaMissatge','logout','adoptaSessioExterna','demanaBaixa','llistaRevisionsEditorialsWp'])expect(restored.adaptador[excluded]).toBeUndefined();
 expect((await restored.adaptador.llegixCopiaCompte()).dades).toEqual(snapshot.dades);
 const again=await a.restauraCopiaCompte(parsed);instances.push(again.adaptador);expect((await again.adaptador.llegixCopiaCompte()).dades).toEqual(snapshot.dades);
 enter(a,B);await expect(a.restauraCopiaCompte(parsed)).rejects.toMatchObject({code:'copia-actor'});
});

test('650 notes completes en tots els estats ixen en un snapshot, sense paginació truncada',async()=>{
 const {NOTE_FOLDERS_SEED}=await import('../carpetesSeed.js');
 const all=Array.from({length:650},(_,i)=>({id:`nota-${i}`,folderId:'f-notes',title:`Nota ${i}`,content:`Cos ${i}`,revision:i,estat:['activa','arxivada','paperera'][i%3]}));
 const storage={read:async()=>({}),mutate:async()=>{},readMany:async()=>[Object.fromEntries(all.map(row=>[row.id,row])),{}]};
 const a=creaAdaptadorLocal({mode:'local',magatzemNotes:storage});instances.push(a);enter(a);
 const s=await a.llegixCopiaCompte();expect(s.dades.notes).toEqual(all);expect(s.dades.noteFolders).toEqual(NOTE_FOLDERS_SEED);
});

test('snapshot rebutja dades crues malmeses sense fingir llista buida',async()=>{
 for(const stored of [null,[],{broken:null},{wrong:{id:'different',content:'x'}}]){
  const a=creaAdaptadorLocal({mode:'local',magatzemNotes:{read:async()=>({}),mutate:async()=>{},readMany:async()=>[stored,{}]}});instances.push(a);enter(a);
  await expect(a.llegixCopiaCompte()).rejects.toMatchObject({code:'copia-dades-malmeses'});
 }
});

test('canvi concurrent de perfil i canvi d’actor durant lectura no retornen snapshot mixt',async()=>{
 let release,start;const began=new Promise(resolve=>{start=resolve;});
 const a=creaAdaptadorLocal({mode:'local',magatzemNotes:{read:async()=>({}),mutate:async()=>{},readMany:async()=>{start();await new Promise(resolve=>{release=resolve;});return [{},{}];}}});instances.push(a);enter(a);
 const pending=a.llegixCopiaCompte();await began;await a.updateProfile({bio:'Canvi de prova'});release();
 await expect(pending).rejects.toMatchObject({code:'copia-snapshot-modificat'});
 let release2,start2;const begun2=new Promise(resolve=>{start2=resolve;});
 const b=creaAdaptadorLocal({mode:'local',magatzemNotes:{read:async()=>({}),mutate:async()=>{},readMany:async()=>{start2();await new Promise(resolve=>{release2=resolve;});return [{},{}];}}});instances.push(b);enter(b);
 const p=b.llegixCopiaCompte();await begun2;enter(b,B);release2();await expect(p).rejects.toMatchObject({name:'AbortError'});
});

test('últim recurs invàlid, política persistent i actor divergent no alteren el node actiu',async()=>{
 const a=create();enter(a);await a.createNote({id:'conservar',content:'No tocar'});
 const snapshot=await a.llegixCopiaCompte();const bad=structuredClone(snapshot);bad.dades.patrimoni=[{invalid:true}];
 await expect(a.restauraCopiaCompte(bad)).rejects.toThrow();expect((await a.llegixCopiaCompte()).dades).toEqual(snapshot.dades);
 expect(()=>creaAdaptadorLocal({mode:'local',persistenciaNotes:'indexeddb',negociRestaurat:snapshot})).toThrow();
 const pending=a.restauraCopiaCompte(snapshot);enter(a,B);await expect(pending).rejects.toMatchObject({name:'AbortError'});
 enter(a);expect((await a.llegixCopiaCompte()).dades).toEqual(snapshot.dades);
});

test('restauració completa amb carpetes jeràrquiques, òrgans pare/fill i patrimoni de diverses campanyes',async()=>{
 const {readFileSync}=await import('node:fs');const {NOTE_FOLDERS_SEED}=await import('../carpetesSeed.js');
 const source=JSON.parse(readFileSync('tests/fixtures/portabilitat-compte-v2/compte.synthetic.json','utf8'));
 source.dades.noteFolders=[...NOTE_FOLDERS_SEED,source.dades.noteFolders[1]];
 source.dades.organitzacions.push({id:'org-filla',name:'Filla sintètica',kind:'group',parent_organization_id:'org-sintetica',contacte:{correu:'',public:false}});
 source.dades.patrimoni.push({...source.dades.patrimoni[0],id:'da222222-2222-4222-8222-222222222222',campanyaAny:2025});
 const active=create();enter(active);const original=await active.llegixCopiaCompte();
 const one=await active.restauraCopiaCompte(source);instances.push(one.adaptador);
 expect((await one.adaptador.llegixCopiaCompte()).dades).toEqual(source.dades);
 expect((await one.adaptador.listMyOrganizations()).map(row=>row.id)).toEqual(['org-sintetica','org-filla']);
 await one.adaptador.mouNota('nota-1','activa',7);
 const note=await one.adaptador.loadNotes(A,{noteId:'nota-1'});expect(note.notes[0].content).toBe(source.dades.notes[0].content);
 expect((await active.llegixCopiaCompte()).dades).toEqual(original.dades);
 enter(active,B);await expect(one.adaptador.llegixCopiaCompte()).rejects.toMatchObject({name:'AbortError'});
 await expect(one.adaptador.updateProfile({bio:'Altre actor'})).rejects.toMatchObject({name:'AbortError'});
 expect(()=>one.adaptador.getCurrentUser()).toThrow();
 enter(active);await expect(one.adaptador.llegixCopiaCompte()).rejects.toMatchObject({name:'AbortError'});
});

test('fill administrable amb pare extern es restaura sense fer administrable el pare',async()=>{
 const active=create();enter(active);const snapshot=await active.llegixCopiaCompte();
 snapshot.dades.organitzacions=[{id:'fill-visible',name:'Fill visible',kind:'group',parent_organization_id:'pare-privat',contacte:{correu:'',public:false}}];
 const pack=creaPaquetCompte(snapshot);expect(pack.manifest.referenciesExternes[0].id).toBe('pare-privat');
 const result=await active.restauraCopiaCompte(llegeixPaquetCompte(pack.zip,{sha256Esperat:pack.sha256}));instances.push(result.adaptador);
 expect((await result.adaptador.llegixCopiaCompte()).dades).toEqual(snapshot.dades);
 expect((await result.adaptador.listMyOrganizations()).map(row=>row.id)).toEqual(['fill-visible']);
 await expect(result.adaptador.updateOrganization('pare-privat',{name:'No autoritzat'})).rejects.toThrow();
});
