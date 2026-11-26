import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { projectaTaxonomiaPagina } from '../src/data/taxonomia/taxonomiaPagina.js';
if (!process.env.SDP_PGLITE_MODULE) throw new Error('Cal SDP_PGLITE_MODULE: cap omissió de SQL.');
const { PGlite } = await import(pathToFileURL(process.env.SDP_PGLITE_MODULE));
const sql=fs.readFileSync(new URL('../supabase/migrations/20261126030500_v1226_taxonomia_pagines.sql',import.meta.url),'utf8');
const A='10000000-0000-4000-8000-000000000001', B='10000000-0000-4000-8000-000000000002', T='20000000-0000-4000-8000-000000000001', U='20000000-0000-4000-8000-000000000002';
// Una entrada del Mur: el seu UUID és l'idPagina de la seua taxonomia.
const S='30000000-0000-4000-8000-000000000001';
const SENSE_AAL=Symbol('sense aal');
const patch={categoriesSistema:['Mur'],categoriesTematiques:['TIC'],etiquetes:['Idees'],geografia:{pobles:['La Torre']},mencions:['rentonar']};
// Un tros literal d'una migració del repositori; si el text de la font canvia, la prova cau abans de provar res.
const talla=(text,inici,fi)=>{const a=text.indexOf(inici),b=a<0?-1:text.indexOf(fi,a);assert.ok(a>=0&&b>a,`${inici} … ${fi}`);return text.slice(a,b+fi.length);};
test('IDEA-375 · SQL real: RLS, autoritat, privacitat viva, CAS i reaplicació',async t=>{
 const pg=new PGlite();
 // aal null envia el claim sense valor; SENSE_AAL el lleva del JWT (undefined activaria el valor per defecte).
 const as=(actor,query,args=[],role='authenticated',aal='aal2')=>pg.transaction(async tx=>{
  await tx.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[actor??'',JSON.stringify(aal===SENSE_AAL?{sub:actor}:{sub:actor,aal})]);
  await tx.exec(`set local role ${role}`); return tx.query(query,args);
 });
 const save=(p=patch,v=0,actor=A,tenant=T,aal='aal2',pagina='legal')=>as(actor,'select public.actualitza_taxonomia_pagina($1,$2,$3,$4) ack',[tenant,pagina,p,v],'authenticated',aal).then(x=>x.rows[0].ack);
 const read=(actor=A,role='authenticated',aal='aal2',pagina='legal')=>as(actor,'select public.llig_taxonomia_pagina($1,$2) ack',[T,pagina],role,aal).then(x=>x.rows[0].ack);
 try{
  await pg.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create schema private;
  create table auth.users(id uuid primary key); create table public.towns(id uuid primary key);
  create table public.user_platform_roles(user_id uuid,role text);
  create table public.app_content(tenant_id uuid,key text,payload jsonb);
  create table public.section_submissions(id uuid primary key,tenant_id uuid references public.towns(id),section_id text,payload jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
  grant usage on schema auth to anon,authenticated,service_role;`);
  // Les dependències d'autoritat i privacitat són els cossos reals del repositori.
  const root=process.env.SDP_BASELINE_ROOT ? pathToFileURL(process.env.SDP_BASELINE_ROOT+'/') : new URL('../',import.meta.url);
  const migracio=nom=>fs.readFileSync(new URL(`supabase/migrations/${nom}`,root),'utf8');
  const superadmin=migracio('2610061448_superadmin_aal2.sql');
  // El cos de Producció (deriva R22): 2610061448 no hi està aplicada i es_superadmin() no exigix aal2.
  const superadminInicial=talla(migracio('2609080000_initial_schema.sql'),'create or replace function private.es_superadmin()','\n$$;');
  await pg.exec(superadmin);
  // private.mur_public_eligible crida private.publicacio_mur_es_publica: no és càrrega morta.
  await pg.exec(talla(migracio('2611112149_mur_estat_public_i_padro.sql'),'create or replace function private.publicacio_mur_es_publica','grant execute on function private.publicacio_mur_es_publica(jsonb) to anon, authenticated;'));
  // Les columnes visibility, moderation_state i deleted_at, la taula de revocades i private.mur_public_eligible,
  // amb el text literal de 2611121430 (aplicada a Producció el 13-11-2026).
  await pg.exec(talla(migracio('2611121430_mur_foraster_projeccio_publica_opcio_a.sql'),'alter table public.section_submissions add column if not exists visibility','revoke all on function private.mur_public_eligible(jsonb) from public, anon, authenticated, service_role;'));
  await pg.query('insert into auth.users values($1),($2)',[A,B]);await pg.query('insert into public.towns values($1),($2)',[T,U]);
  await pg.query("insert into public.user_platform_roles values($1,'superadmin')",[A]);
  await pg.query("insert into public.app_content values($1,'pages',$2)",[T,[{id:'legal',isPublished:true}]]);
  await pg.exec(sql);
  await t.test('cap DML directe ni auditoria privada per als rols del client',async()=>{
   for(const role of ['anon','authenticated','service_role']){
    for(const q of ['select * from public.page_taxonomy','update public.page_taxonomy set versio=99','select * from private.page_taxonomy_audit']) await assert.rejects(as(A,q,[],role),e=>e.code==='42501');
   }
   assert.equal((await pg.query("select relrowsecurity from pg_class where oid='public.page_taxonomy'::regclass")).rows[0].relrowsecurity,true);
  });
  await t.test('rol real + segon factor: anon, veí, AAL1 i un JWT sense aal es deneguen',async()=>{
   await assert.rejects(save(patch,0,B),e=>e.code==='42501');
   await assert.rejects(save(patch,0,A,T,'aal1'),e=>e.code==='42501');
   // SQL NULL no acredita AAL2: sense coalesce, «not null» no llançaria.
   await assert.rejects(save(patch,0,A,T,null),e=>e.code==='42501');
   await assert.rejects(save(patch,0,A,T,SENSE_AAL),e=>e.code==='42501');
   await assert.rejects(as(null,'select public.actualitza_taxonomia_pagina($1,$2,$3,$4)',[T,'legal',patch,0],'anon'),e=>e.code==='42501');
  });
  let first;
  await t.test('edició autoritzada, CAS i auditoria autoritativa; font original intacta',async()=>{
   first=await save();assert.equal(first.versio,1);assert.deepEqual(first.etiquetes,['Idees']);
   assert.deepEqual(await read(null,'anon'),first);
   await assert.rejects(save(),e=>e.code==='40001');
   assert.equal((await pg.query('select count(*)::int n from private.page_taxonomy_audit')).rows[0].n,1);
   assert.equal((await pg.query('select actor_id from private.page_taxonomy_audit')).rows[0].actor_id,A);
   assert.deepEqual((await pg.query('select payload from public.app_content')).rows[0].payload,[{id:'legal',isPublished:true}]);
  });
  await t.test('objectes JSONB, claus d’autoritat, geografia hostil i zero categories es refusen',async()=>{
   for(const p of [{...patch,etiquetes:[{}]},{...patch,role:'superadmin'},{...patch,categoriesSistema:[]},{...patch,geografia:{pobles:[{}]}},{...patch,mencions:[['x']]},{...patch,categoriesSistema:['Intrús']},{...patch,geografia:{barri:['x']}},{...patch,geografia:[]},{...patch,etiquetes:'Idees'}]) await assert.rejects(save(p,1),e=>e.code==='22023',JSON.stringify(p));
   assert.equal((await pg.query('select versio from public.page_taxonomy')).rows[0].versio,1);
  });
  await t.test('la privacitat de la font viva domina; cap filtració anònima o entre tenants',async()=>{
   await pg.query("update public.app_content set payload=$1",[[{id:'legal',visibility:'private',isPublished:true}]]);
   assert.equal(await read(null,'anon'),null);assert.equal(await read(B),null);assert.deepEqual(await read(),first);
   await save({...patch,etiquetes:['Un altre poble']},0,A,U);
   assert.equal((await pg.query('select count(*)::int n from public.page_taxonomy')).rows[0].n,2);
   assert.deepEqual((await read()).etiquetes,['Idees']);
  });
  await t.test('amb el cos de Producció d’es_superadmin (2609080000, sense aal2), AAL1 ni escriu ni llig fonts ocultes',async()=>{
   await pg.exec(superadminInicial);
   try{
    // La premissa: este cos sí que dona superadmin amb un sol factor; només el segon factor en línia tanca la porta.
    assert.equal((await as(A,'select private.es_superadmin() ok',[],'postgres','aal1')).rows[0].ok,true);
    for(const aal of ['aal1',null,SENSE_AAL]) await assert.rejects(save(patch,1,A,T,aal),e=>e.code==='42501',String(aal));
    // La font continua privada: AAL1 no la llig; AAL2 sí, com a administració editorial.
    assert.equal(await read(A,'authenticated','aal1'),null);
    assert.equal(await read(A,'authenticated',null),null);
    assert.deepEqual(await read(A,'authenticated','aal2'),first);
    assert.equal((await pg.query('select versio from public.page_taxonomy where tenant_id=$1',[T])).rows[0].versio,1);
   }finally{await pg.exec(superadmin);}
  });
  await t.test('conflictes de flags, estat, moderació, esborrat i contenidors malformats no filtren metadades públiques',async()=>{
   const states=[{status:'draft'},{estat:'esborrany'},{private:true},{draft:true},{isDraft:true},{esborrany:true},{is_published:false},{published:false},{visibility:{}},{visibility:'unlisted'},{status:{}},{attributes:{private:true}},{payload:{estat:'esborrany'}},{attributes:[]},
    {moderation_state:'ocult'},{moderation_state:{}},{deleted:true},{deleted:null},{deleted_at:'2026-11-26T00:00:00Z'},{deletedAt:'2026-11-26T00:00:00Z'},{attributes:{deleted:true}},{payload:{moderation_state:'retirada_cautelar'}}];
   for(const state of states){
    await pg.query('update public.app_content set payload=$1',[[{id:'legal',isPublished:true,...state}]]);
    assert.equal(await read(null,'anon'),null,JSON.stringify(state));assert.equal(await read(B),null,JSON.stringify(state));assert.deepEqual(await read(),first);
   }
   // Control positiu: els marcadors en el seu valor visible no amaguen res.
   await pg.query('update public.app_content set payload=$1',[[{id:'legal',isPublished:true,moderation_state:'visible',deleted:false,deleted_at:null,deletedAt:null}]]);
   assert.deepEqual(await read(null,'anon'),first);
  });
  await t.test('una entrada del Mur segueix la frontera canònica: moderació, esborrat tou, visibilitat, revocació i secció',async()=>{
   const net={content:'Hola'};
   await pg.query("insert into public.section_submissions(id,tenant_id,section_id,payload) values($1,$2,'mur',$3)",[S,T,net]);
   const mur=await save({...patch,etiquetes:['Sensible'],geografia:{paratges:['Mas X']},mencions:['persona-y']},0,A,T,'aal2',S);
   assert.deepEqual(await read(null,'anon','aal2',S),mur,'control positiu: l’entrada visible projecta la taxonomia');
   const casos=[
    ['columna moderation_state',"update public.section_submissions set moderation_state='retirada_cautelar' where id=$1",[S]],
    ['columna deleted_at','update public.section_submissions set deleted_at=now() where id=$1',[S]],
    ['columna visibility',"update public.section_submissions set visibility='membres' where id=$1",[S]],
    ['fila revocada','insert into private.mur_publicacions_revocades(submission_id,tenant_id,owner_user_id) values($1,$2,$3)',[S,T,B]],
    ['payload moderation_state','update public.section_submissions set payload=$2 where id=$1',[S,{...net,moderation_state:'ocult'}]],
    ['payload deleted','update public.section_submissions set payload=$2 where id=$1',[S,{...net,deleted:true}]],
    ['payload deletedAt','update public.section_submissions set payload=$2 where id=$1',[S,{...net,deletedAt:'2026-11-26T00:00:00Z'}]],
    ['payload deleted_at','update public.section_submissions set payload=$2 where id=$1',[S,{...net,deleted_at:'2026-11-26T00:00:00Z'}]],
    ['payload visibility','update public.section_submissions set payload=$2 where id=$1',[S,{...net,visibility:'private'}]],
    // taxonomia_font_publica admet «publicada»; només private.mur_public_eligible la refusa: el cas lliga eixa crida.
    ['payload status publicada (el Mur la refusa)','update public.section_submissions set payload=$2 where id=$1',[S,{...net,status:'publicada'}]],
    ['secció notes',"update public.section_submissions set section_id='notes' where id=$1",[S]]
   ];
   for(const [nom,query,args] of casos){
    await pg.query(query,args);
    assert.equal(await read(null,'anon','aal2',S),null,nom);
    assert.equal(await read(B,'authenticated','aal2',S),null,nom);
    assert.deepEqual(await read(A,'authenticated','aal2',S),mur,`${nom}: l’administració editorial la continua veient`);
    await pg.query("update public.section_submissions set moderation_state='visible',deleted_at=null,visibility='public',section_id='mur',payload=$2 where id=$1",[S,net]);
    await pg.query('delete from private.mur_publicacions_revocades');
    assert.deepEqual(await read(null,'anon','aal2',S),mur,`${nom}: restaurada`);
   }
  });
  await t.test('el servidor normalitza com el client: farciment, NBSP, espais Unicode, astrals i duplicats; cada ACK es projecta',async()=>{
   const pagina='normes';
   // Llargària crua en unitats UTF-16 (String.length), abans de retallar; cap text buit després del retall.
   const rebutjats=[' '.repeat(50)+'x'.repeat(190),' '+'x'.repeat(200),' ',' ','\u3000\u2003\uFEFF','\u{1D538}'.repeat(101),'a\tb','\u007f'];
   for(const text of rebutjats){
    for(const p of [{...patch,etiquetes:[text]},{...patch,mencions:['ok',text]},{...patch,geografia:{paratges:[text]}}]) await assert.rejects(save(p,0,A,T,'aal2',pagina),e=>e.code==='22023',JSON.stringify(text));
   }
   assert.equal((await pg.query('select count(*)::int n from public.page_taxonomy where pagina_id=$1',[pagina])).rows[0].n,0);
   const ack=await save({...patch,categoriesSistema:[' Mur ','Mur'],etiquetes:['  Idees','Idees ','　Idees','Fira','x'.repeat(200)],
    geografia:{pobles:['La Torre',' La Torre'],paratges:[]},mencions:['\u{1D538}'.repeat(100)]},0,A,T,'aal2',pagina);
   assert.deepEqual(ack.categoriesSistema,['Mur']);
   assert.deepEqual(ack.etiquetes,['Idees','Fira','x'.repeat(200)]);
   assert.deepEqual(ack.geografia,{pobles:['La Torre'],paratges:[]});
   assert.deepEqual(ack.mencions,['\u{1D538}'.repeat(100)]);
   // El que el servidor desa i torna, el client ho projecta igual: cap fila que trenque la superposició.
   assert.deepEqual({...projectaTaxonomiaPagina(ack)},ack);
   const {idPagina,versio,...desat}=ack;
   assert.deepEqual((await pg.query('select taxonomia from public.page_taxonomy where pagina_id=$1',[pagina])).rows[0].taxonomia,desat);
   assert.deepEqual((await pg.query('select despres from private.page_taxonomy_audit where pagina_id=$1',[pagina])).rows[0].despres,desat);
   assert.deepEqual([idPagina,versio],[pagina,1]);
  });
  await t.test('la serialització és per pàgina: un bloqueig consultiu de transacció, i cap bloqueig de public.towns',async()=>{
   const {ack,locks}=await pg.transaction(async tx=>{
    await tx.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[A,JSON.stringify({sub:A,aal:'aal2'})]);
    await tx.exec('set local role authenticated');
    const ack=(await tx.query('select public.actualitza_taxonomia_pagina($1,$2,$3,$4) ack',[T,'cadenat',patch,0])).rows[0].ack;
    await tx.exec('reset role');
    // PGlite és una sola connexió i pg_locks no hi informa del pid: tots els bloquejos consultius són d'esta transacció.
    const locks=(await tx.query(`select count(*) filter (where objsubid=1 and ((classid::bigint<<32)|objid::bigint)=hashtextextended('page_taxonomy:'||$1||':'||$2,0))::int pagina,count(*)::int total
     from pg_locks where locktype='advisory'`,[T,'cadenat'])).rows[0];
    return {ack,locks};
   });
   assert.equal(ack.versio,1);
   assert.deepEqual(locks,{pagina:1,total:1});
   assert.equal((await pg.query("select count(*)::int n from pg_locks where locktype='advisory'")).rows[0].n,0,'el bloqueig s’allibera amb la transacció');
   // Cap FOR UPDATE de public.towns: el cos ja no bloqueja la fila de cap poble.
   assert.doesNotMatch((await pg.query("select pg_get_functiondef('public.actualitza_taxonomia_pagina(uuid,text,jsonb,integer)'::regprocedure) d")).rows[0].d,/public\.towns[^;]*for update/i);
  });
  await t.test('divergència de permisos refusa abans de restaurar ACL o tocar les dades',async()=>{
   await pg.exec('grant select on public.page_taxonomy to authenticated');
   await assert.rejects(pg.exec(sql),e=>e.code==='55000');await pg.exec('rollback');
   assert.equal((await pg.query("select has_table_privilege('authenticated','public.page_taxonomy','SELECT') ok")).rows[0].ok,true);
   await pg.exec('revoke select on public.page_taxonomy from authenticated');
  });
  // PGlite té una sola connexió: les dues crides es serialitzen. La carrera real entre dues connexions la cobrix
  // el bloqueig consultiu per pàgina de la prova d'abans, no esta.
  await t.test('reaplicar preserva dades i auditoria; dos CAS seguits amb la mateixa versió deixen un sol guanyador',async()=>{
   const before=(await pg.query('select * from private.page_taxonomy_audit order by tenant_id,pagina_id,versio')).rows;
   await pg.exec(sql);assert.deepEqual((await pg.query('select * from private.page_taxonomy_audit order by tenant_id,pagina_id,versio')).rows,before);
   const results=await Promise.allSettled([save({...patch,etiquetes:['A']},1),save({...patch,etiquetes:['B']},1)]);
   assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.ok(results.some(r=>r.status==='rejected'&&r.reason.code==='40001'));
  });
 }finally{await pg.close();}
});
