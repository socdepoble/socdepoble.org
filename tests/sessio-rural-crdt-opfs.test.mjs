import test from 'node:test';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';
import {creaSessioRural} from '../src/data/sessioRural.js';
import {CarpetaFalsa} from './helpers/carpetaLocalFalsa.js';import {creaBloquejosOpfsFalsos} from './helpers/bloquejosOpfsFalsos.js';
const abast={persona:'INTERNAL_ACCOUNT_SENTINEL',tenant:'torre',endpoint:'seed',mode:'seed'};
const setup=()=>{const root=new CarpetaFalsa('opfs'),locks=creaBloquejosOpfsFalsos();return{root,opts:{abast,municipi:'La Torre',motor:'opfs',storage:{getDirectory:async()=>root},locks,crypto:webcrypto,BroadcastChannel:null}};};
async function obri(t,opts){const s=await creaSessioRural(opts);t.after(()=>s.close());return s;}
const idDe=s=>s.notes[0].id;
const textDe=async s=>(await s.estat()).notes[0]?.content;
const edit=(s,draft,content,extra={})=>s.editaNota({id:draft.nota.id,title:draft.nota.title,content,base:draft.base,...extra});

test('dos sessions OPFS, base causal pròpia i RGA integrat a cua no perden edicions simultànies',async t=>{
 const {opts}=setup(),a=await obri(t,opts),b=await obri(t,opts);const initial=await a.desaNota({title:'Nota',content:'abc'}),id=idDe(initial);
 assert.equal(initial.crdt,true);assert.equal(initial.motor,'opfs');
 const [da,db]=await Promise.all([a.preparaEdicio(id),b.preparaEdicio(id)]);
 await Promise.all([edit(a,da,'aXbc'),edit(b,db,'abYc')]);assert.equal(await textDe(a),'aXbYc');assert.equal(await textDe(b),'aXbYc');
 const p=await a.exportaVault();assert.equal(p.crdt.ops.length,3);assert.equal(new Set(p.crdt.ops.map(o=>o.replica)).size,2);assert.equal((await a.estat()).notes.length,1);
});
test('dues bases velles del mateix escriptor no es fan causals pel comptador de la cua',async t=>{
 const {opts}=setup(),a=await obri(t,opts),initial=await a.desaNota({title:'Nota',content:'abc'}),id=idDe(initial);
 const da=await a.preparaEdicio(id),db=await a.preparaEdicio(id);await edit(a,da,'aXbc');await edit(a,db,'abYc');assert.equal(await textDe(a),'aXbYc');
});
test('dos dispositius intercanvien batches amb convergència, replay idempotent i sense UUID de compte',async t=>{
 const a=await obri(t,setup().opts),b=await obri(t,setup().opts),initial=await a.desaNota({title:'Nota',content:'abc'}),id=idDe(initial);
 const genesis=await a.exportaVault();assert.equal(JSON.stringify(genesis).includes(abast.persona),false);await b.importaVault(genesis);
 const da=await a.preparaEdicio(id),db=await b.preparaEdicio(id);await edit(a,da,'aXbc');await edit(b,db,'abYc');
 const pa=await a.exportaVault(),pb=await b.exportaVault();await Promise.all([a.importaVault(pb),b.importaVault(pa)]);await a.importaVault(pb);
 assert.equal(await textDe(a),'aXbYc');assert.equal(await textDe(b),'aXbYc');assert.deepEqual((await a.exportaVault()).crdt,(await b.exportaVault()).crdt);
});
test('delete concurrent conserva edició i delete causal conserva tombstones al backup',async t=>{
 const a=await obri(t,setup().opts),b=await obri(t,setup().opts),initial=await a.desaNota({title:'Nota',content:'abc'}),id=idDe(initial);await b.importaVault(await a.exportaVault());
 const da=await a.preparaEdicio(id),db=await b.preparaEdicio(id);await a.eliminaNota({id,base:da.base});await edit(b,db,'Text concurrent');await a.importaVault(await b.exportaVault());assert.equal(await textDe(a),'Text concurrent');
 const current=await a.preparaEdicio(id);await a.eliminaNota({id,base:current.base});assert.equal((await a.estat()).notes.length,0);assert.equal((await a.exportaVault()).crdt.ops.length,4);
});
test('consolidar la cua no retalla història CRDT i invalida les sessions antigues',async t=>{
 const {opts}=setup(),a=await obri(t,{...opts,maxOperacionsCua:2}),old=await obri(t,opts),initial=await a.desaNota({title:'Nota',content:'abc'}),id=idDe(initial);
 const base=await a.preparaEdicio(id);await edit(a,base,'aXbc');await assert.rejects(edit(a,base,'abYc'),{code:'RURAL_DIARI_PLE'});const before=await a.exportaVault();
 const consolidated=await a.consolidaDiari();assert.equal(consolidated.pendents,0);assert.deepEqual((await a.exportaVault()).crdt,before.crdt);await assert.rejects(old.estat(),e=>e.code==='SDP-RURAL-GENERACIO');
 const b=await obri(t,opts);assert.equal(await textDe(b),'aXbc');
});


test('carpeta immutable integra CRDT entre dos dispositius OPFS i torna a convergir',async t=>{
 const folder=new CarpetaFalsa('compartida'),a=await obri(t,setup().opts),b=await obri(t,setup().opts),initial=await a.desaNota({title:'Nota',content:'abc'}),id=idDe(initial);
 await a.sincronitzaCarpeta(folder);await b.sincronitzaCarpeta(folder);
 const da=await a.preparaEdicio(id),db=await b.preparaEdicio(id);await edit(a,da,'aXbc');await edit(b,db,'abYc');
 await a.sincronitzaCarpeta(folder);await b.sincronitzaCarpeta(folder);await a.sincronitzaCarpeta(folder);
 assert.equal(await textDe(a),'aXbYc');assert.equal(await textDe(b),'aXbYc');
});

test('purge espera el pany d’export de carpeta i cap import posterior ressuscita dades',async t=>{
 const {opts}=setup(),a=await obri(t,opts),b=await obri(t,opts),folder=new CarpetaFalsa('compartida');await a.desaNota({title:'Privada',content:'ABC'});
 let release,entered;const gate=new Promise(r=>release=r),inside=new Promise(r=>entered=r),get=folder.getFileHandle.bind(folder);
 folder.getFileHandle=async(name,options)=>{if(name.startsWith('.sdp-crdt-')&&options?.create){entered();await gate;}return get(name,options);};
 const sync=a.sincronitzaCarpeta(folder);await inside;let purged=false;const purge=b.esborraTot().then(v=>{purged=true;return v;});
 await new Promise(r=>setTimeout(r,5));assert.equal(purged,false);release();await purge;
 await assert.rejects(sync,e=>e.code==='SDP-RURAL-GENERACIO');const c=await obri(t,opts);assert.equal((await c.estat()).notes.length,0);
});


test('canvi d’entrada durant write avorta abans de close i no deixa una intenció antiga',async t=>{
 const {root,opts}=setup();let entry=1;const guard=()=>{if(entry!==1)throw new DOMException('La sessió ha canviat.','AbortError');};
 const a=await obri(t,{...opts,comprovaAbast:guard});let release,entered;const gate=new Promise(r=>release=r),inside=new Promise(r=>entered=r);
 const get=root.getFileHandle.bind(root);let armed=true;
 root.getFileHandle=async(...args)=>{const file=await get(...args),create=file.createWritable.bind(file);file.createWritable=async(...opts)=>{const w=await create(...opts),write=w.write.bind(w);w.write=async data=>{await write(data);if(armed){armed=false;entered();await gate;}};return w;};return file;};
 const pending=a.desaNota({title:'Entrada antiga',content:'NO COMMIT'});await inside;entry=2;release();await assert.rejects(pending);
 const b=await obri(t,opts);assert.equal((await b.estat()).notes.length,0);assert.equal((await b.estat()).pendents,0);
});


test('metadades multivalor es resolen per camp de forma explícita i mantenen les altres variants',async t=>{
 const a=await obri(t,setup().opts),b=await obri(t,setup().opts),initial=await a.desaNota({title:'Base',content:'abc'}),id=idDe(initial);await b.importaVault(await a.exportaVault());
 const da=await a.preparaEdicio(id),db=await b.preparaEdicio(id);await edit(a,da,'abc',{title:'A',metadades:{tags:['a']}});await edit(b,db,'abc',{title:'B',metadades:{tags:['b']}});await a.importaVault(await b.exportaVault());
 const d=await a.preparaEdicio(id);assert.equal(d.nota.variants.title.length,2);assert.equal(d.nota.variants.tags.length,2);
 await edit(a,d,'abcX',{title:'A',resol:['title']});const r=(await a.estat()).notes[0];assert.equal(r.variants.title,undefined);assert.deepEqual(r.variants.tags.sort(),[['a'],['b']]);
});


test('abast mutable es captura abans de primera lectura OPFS i no canvia després de consolidar',async t=>{
 const {root,opts}=setup(),mutable={...abast};let release,entered;const gate=new Promise(r=>release=r),inside=new Promise(r=>entered=r);
 const pending=creaSessioRural({...opts,abast:mutable,storage:{getDirectory:async()=>{entered();await gate;return root;}}});await inside;mutable.persona='ALTRE_COMPTE_DURANT_AWAIT';release();
 const s=await pending;t.after(()=>s.close());await s.desaNota({title:'Sempre A',content:'Conservada A'});mutable.persona='ALTRE_COMPTE_DESPRES_ACTIVACIO';await s.consolidaDiari();
 assert.equal((await s.estat()).notes[0].content,'Conservada A');const reobert=await obri(t,opts);assert.equal((await reobert.estat()).notes[0].content,'Conservada A');
 const altre=await obri(t,{...opts,abast:mutable});assert.equal((await altre.estat()).notes.length,0);
});
