import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { llegixOrdre, llegixReadme, ordena } from '../scripts/supabase/verifica-migracions.mjs';
import { compilaOperacioNodeZero } from '../tooling/node0/backend-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const BUSINESS_MIGRATIONS = [
  '2609080000_initial_schema.sql',
  '2609080100_xat_v2.sql',
  '2609080200_xat_v2_correccions.sql',
  '2609080300_xat_v2_membres.sql',
  '2609110600_perfil_avatar_i_permisos.sql',
  '2609121500_correccio_privacitat_perfils.sql',
  '2609140000_schema_notes.sql',
  '2609150000_seguretat_profunda_deepseek.sql',
  '2609200600_xat_limit_correccio.sql',
  '2609261200_publicacions_autoria.sql',
  '2609261500_identitat_perfil_f1.sql',
  '2609262232_copyright_editor.sql',
  '2609270200_xat_f0_fonament.sql',
  '2609272200_xat_entitats.sql',
  '2609282035_perfil_emoticona.sql',
  '2609282100_xat_de_pagina.sql',
  '2609291210_xat_cerca_accents.sql',
  '2610042330_xat_pagina_iaia.sql',
  '2610081543_xat_consentiment_i_metadades.sql',
  '2610090100_convergencia_xat_de_pagina.sql',
  '2610201500_moderacio_denuncies_i_bloquejos.sql',
  '2610220240_xat_adjunts_i_quota.sql',
  '2610241400_normes_exigides_ugc.sql',
  '2610282100_usuari_i_poble_canonic.sql',
  '2610290400_xat_e2ee_claus_i_sobres.sql',
  '2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql',
  '2611020417_xat_avisos_push.sql',
  '2611030330_politica_privacitat_2_4.sql',
  '2611080431_xat_push_leases.sql',
  '2611080432_xat_lliurament_i_presencia.sql'
];
const EXTRA = [
 '2609130500_bucket_mitjans.sql',
 '2609271400_notes_paperera.sql',
 '2610042350_convergencia_perfil_i_create_organization.sql',
 '2610061448_superadmin_aal2.sql',
 '2610081401_organitzacions_poble.sql',
 '2610241440_baixa_completa_ugc_i_fitxers.sql',
 // Producció té 2611011500 (sonda te_autoria_poble): només hi ha pot_signar_com_organitzacio(uuid,uuid).
 '2611011500_autoria_ajuntament_mateix_poble.sql',
 '2611110100_cua_purga_storage_ugc.sql',
 '2611111735_copublicacio_registrada.sql',
 '2611112005_mur_lectura_publica_foraster.sql',
 '2611112149_mur_estat_public_i_padro.sql',
 '2611121430_mur_foraster_projeccio_publica_opcio_a.sql',
 '2611121830_frontera_contingut_editorial_i_notes_privades.sql',
 '2611121850_mur_text_dates_i_contactes.sql'
];
const MIGRATION='2611122200_mur_membres_i_actes_v2.sql';
const TOWN='11000000-0000-4000-8000-000000000021', TOWN2='11000000-0000-4000-8000-000000000022';
const OWNER='22000000-0000-4000-8000-000000000021', OTHER='22000000-0000-4000-8000-000000000022', OUTSIDER='22000000-0000-4000-8000-000000000023';
const id=n=>`44000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
async function actor(db,who,fn,role=who?'authenticated':'anon') {
 await db.query('begin');
 try {
  await db.query(`set local role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claim.aal','aal2',true)",[who??'',role]);
  const r=await fn(db); await db.query('commit');return r;
 }catch(e){await db.query('rollback');throw e;}
}
const pub=(db,town=TOWN)=>db.query('select * from public.llig_mur_public($1)',[town]);
const rich=(db,town=TOWN,ids=null,limit=51,before=null,beforeId=null)=>db.query('select public.llig_mur_membres($1,null,$3,$4,$5,$2) as result',[town,ids,limit,before,beforeId]);
const result=r=>r.rows[0].result;
async function submission(db,n,{owner=OWNER,town=TOWN,payload={},...extra}={}) {
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
 await db.query(`insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,description,payload,visibility,moderation_state,deleted_at,created_at)
 values($1,$2,$3,$4,$5,$10,$6,$7,$8,$9,coalesce($11::timestamptz,now()))`,[id(n),town,owner,extra.section??'mur',extra.title??'Publicació de prova',
 {content:'<p>Text de prova</p>',status:'published',visibility:'public',...payload},extra.visibility??'public',extra.moderation??'visible',extra.deleted??null,
 extra.description??'Resum',extra.created??null]);
}
async function note(db,n,{owner=OWNER,town=TOWN}={}){
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
 await db.query('insert into public.notes(id,tenant_id,owner_user_id,title,content) values($1,$2,$3,$4,$5)',[id(n),town,owner,'Nota privada','<p>Cos privat</p>']);
}
const publish=(db,n,act,revision=1,operation=act+100000,payload={})=>db.query(
 "select public.publica_nota_al_mur($1,$2,'mur',$3,$4,$5) as result",
 [id(n),id(act),{title:'Acte públic',content:'<p>Cos públic</p>',status:'published',visibility:'public',...payload},revision,id(operation)]);
const revoke=(db,n)=>db.query('select public.revoca_publicacio_mur($1,$2) as ok',[id(n),TOWN]);
const revokeNote=(db,n,rev,act)=>db.query('select public.revoca_publicacio_de_nota($1,$2,$3,$4) as ok',[id(n),TOWN,rev,act==null?null:id(act)]);
const error=(code,prefix)=>e=>e.code===code&&(!prefix||e.message.startsWith(prefix));
// R22 · Còpia pública de promoteToPublic: nom determinista sdp-net-v1-<sha256>.
const copia=(n,owner=OWNER,carpeta='mur')=>`${owner}/${carpeta}/sdp-net-v1-${String(n).padStart(64,'0')}.webp`;
const objecte=(db,n,nom,owner=OWNER)=>db.query("insert into storage.objects(id,bucket_id,name,owner,owner_id,version) values($1,'mitjans',$2,$3::uuid,$3::uuid::text,'v1')",[id(n),nom,owner]);

test('R21.1 v2 · PostgreSQL 18.6 real: membres, actes, moderació i privadesa',{timeout:120000},async t=>{
 const cluster=await startLocalPostgres(),db=cluster.db;
 try {
  assert.equal((await db.query("select current_setting('server_version_num') as n")).rows[0].n,'180006');
  t.diagnostic((await db.query('select version() as v')).rows[0].v);
  await db.query(read('tests/fixtures/missatgeria-r21-2/bootstrap-platform.sql'));
  // Primitiva oficial de Storage, no substituïx cap lògica de negoci.
  await db.query("create function storage.foldername(text) returns text[] language sql immutable as $$ select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1] $$");
  for(const f of [...BUSINESS_MIGRATIONS,...EXTRA]){
   try {await db.query(read(`supabase/migrations/${f}`));}
   catch(e){e.message=`${f}: ${e.message}`;throw e;}
  }
  await db.query('grant insert,update,delete on public.section_submissions to authenticated');
  await db.query('grant select on public.towns to anon,authenticated');
  await db.query("insert into public.towns(id,slug,name) values($1,'r21-v2','Poble de prova'),($2,'r21-v2-altre','Altre poble de prova')",[TOWN,TOWN2]);
  for(const [person,town,name] of [[OWNER,TOWN,'AUTORA_PRIVADA'],[OTHER,TOWN,'MEMBRE_PRIVAT'],[OUTSIDER,TOWN2,'FORASTER_PRIVAT']]){
   await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[person,`${person}@example.invalid`,{full_name:name,tenant_id:town,accepta_rgpd:true}]);
   await actor(db,person,c=>c.query("select public.accepta_normes_convivencia('2026-10-24')"));
  }
  await db.query('update public.profiles set is_public=false where id in ($1,$2,$3)',[OWNER,OTHER,OUTSIDER]);

  // Història real V1: POST amb l'id de nota i PATCH de vincle abans de V2.
  for(const legacy of [7400,7407]){
   await note(db,legacy);await submission(db,legacy);
   await actor(db,OWNER,c=>c.query('update public.notes set is_published=true,published_submission_id=id where id=$1',[id(legacy)]));
  }
  // R22 (sql-05) · Una publicació antiga que ja passa dels límits de mida nous: la migració s'ha d'aplicar igual.
  await submission(db,7490,{title:'T'.repeat(1500),description:'R'.repeat(30000),payload:{content:'C'.repeat(150000)}});
  await db.query(read(`supabase/migrations/${MIGRATION}`));
  await db.query(read(`supabase/migrations/${MIGRATION}`));
  await t.test('acte V1 amb note.id: backfill, edició i replay, retirada i nova publicació segura',async()=>{
   const ledger=(await db.query('select note_id,tenant_id,owner_user_id,retired_at from private.mur_actes_notes where act_id=$1',[id(7400)])).rows[0];
   assert.deepEqual(ledger,{note_id:id(7400),tenant_id:TOWN,owner_user_id:OWNER,retired_at:null});
   const unknown=result(await actor(db,OWNER,c=>c.query("select public.publica_nota_al_mur($1,$1,'mur',null,2,$2) as result",[id(7400),id(7401)])));
   assert.equal(unknown,null);
   const edit=result(await actor(db,OWNER,c=>publish(c,7400,7400,2,7401,{content:'Edició legacy segura'})));
   assert.equal(edit.publicacio.id,id(7400));assert.equal(edit.publicacio.payload.content,'Edició legacy segura');assert.equal(edit.nota_revision,3);
   const replay=result(await actor(db,OWNER,c=>publish(c,7400,7400,2,7401,{content:'NO REESCRIURE'})));
   assert.equal(replay.replay,true);assert.equal(replay.publicacio.payload.content,'Edició legacy segura');assert.equal(replay.nota_revision,3);
   const activeProbe=result(await actor(db,OWNER,c=>c.query("select public.publica_nota_al_mur($1,$1,'mur',null,2,$2) as result",[id(7400),id(7401)])));
   assert.equal(activeProbe.publicacio.id,id(7400));assert.equal(activeProbe.replay,true);
   await actor(db,OWNER,c=>revokeNote(c,7400,3,7400));
   const retiredProbe=result(await actor(db,OWNER,c=>c.query("select public.publica_nota_al_mur($1,$1,'mur',null,2,$2) as result",[id(7400),id(7401)])));
   assert.equal(retiredProbe.retirada,true);assert.equal(retiredProbe.publicacio,null);
   const revision=(await db.query('select revision from public.notes where id=$1',[id(7400)])).rows[0].revision;
   await assert.rejects(actor(db,OWNER,c=>publish(c,7400,7400,revision,7402)),error('23514','SDP-MUR-REVOKED'));
   const repub=result(await actor(db,OWNER,c=>publish(c,7400,7403,revision,7404)));
   assert.equal(repub.publicacio.id,id(7403));
   // No deixa cap fila pública addicional en la resta de casos de la suite.
   await actor(db,OWNER,c=>revokeNote(c,7400,repub.nota_revision,7403));
   await note(db,7405);await submission(db,7405);
   await assert.rejects(actor(db,OWNER,c=>publish(c,7405,7405,1,7406)),error('22023','SDP-MUR-PUBLICACIO'));
   await actor(db,OWNER,c=>revoke(c,7405));
   await actor(db,OWNER,c=>revokeNote(c,7407,2,7407));
   const retiredWithoutV2Receipt=result(await actor(db,OWNER,c=>c.query("select public.publica_nota_al_mur($1,$1,'mur',null,2,$2) as result",[id(7407),id(7408)])));
   assert.equal(retiredWithoutV2Receipt.retirada,true);assert.equal(retiredWithoutV2Receipt.publicacio,null);
   assert.equal((await db.query('select count(*)::int n from private.mur_operacions_notes where act_id=$1',[id(7407)])).rows[0].n,0);
  });

  await t.test('idempotència aplica dos voltes sense alterar ACL ni crear variants RPC',async()=>{
   const rows=(await db.query("select proname,count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname in ('publica_nota_al_mur','llig_mur_membres','llig_mur_public') group by proname")).rows;
   assert.deepEqual(rows.map(r=>[r.proname,r.n]).sort(),[['llig_mur_membres',1],['llig_mur_public',1],['publica_nota_al_mur',1]]);
   // R22 (dades-05) · Les signatures velles ja no hi són; les noves, amb els mateixos GRANT i cap EXECUTE per a PUBLIC.
   const PUB='public.llig_mur_public(uuid,text,integer,timestamptz,uuid,boolean)',RICH='public.llig_mur_membres(uuid,text,integer,timestamptz,uuid,uuid[],boolean)';
   const acl=(await db.query(`select to_regprocedure('public.llig_mur_public(uuid,text,integer,timestamptz,uuid)') is null as pub_vella_fora,
     to_regprocedure('public.llig_mur_membres(uuid,text,integer,timestamptz,uuid,uuid[])') is null as rich_vella_fora,
     has_function_privilege('anon',$1,'execute') as anon_pub,has_function_privilege('authenticated',$1,'execute') as auth_pub,
     has_function_privilege('anon',$2,'execute') as anon_rich,has_function_privilege('authenticated',$2,'execute') as auth_rich,
     has_function_privilege('service_role',$1,'execute') as servei_pub,has_function_privilege('service_role',$2,'execute') as servei_rich,
     (select count(*)::int from pg_proc p,aclexplode(p.proacl) a where p.oid in ($1::regprocedure,$2::regprocedure) and a.grantee=0) as public_exec`,[PUB,RICH])).rows[0];
   assert.deepEqual(acl,{pub_vella_fora:true,rich_vella_fora:true,anon_pub:true,auth_pub:true,anon_rich:false,auth_rich:true,servei_pub:false,servei_rich:false,public_exec:0});
   // Un sol disparador de mida, encara que la migració s'haja aplicat dues vegades.
   assert.equal((await db.query("select count(*)::int n from pg_trigger where tgrelid='public.section_submissions'::regclass and tgname='section_submissions_limita_mida' and not tgisinternal")).rows[0].n,1);
   // PostgreSQL executa els BEFORE ROW per ordre de nom: el de mida mira el valor ja sanejat pels altres.
   const abans=(await db.query("select tgname from pg_trigger where tgrelid='public.section_submissions'::regclass and not tgisinternal and (tgtype & 3)=3 order by tgname")).rows.map(r=>r.tgname);
   t.diagnostic(`BEFORE ROW de section_submissions: ${abans.join(', ')}`);
   assert.equal(abans.at(-1),'section_submissions_limita_mida');
  });
  await t.test('sql-05 · límits de mida en escriure: una fila nova no passa del límit; una antiga més llarga es modera i s’encongix però no creix',async()=>{
   const llarg=(n,c='a')=>c.repeat(n);
   const mida=error('22001','SDP-MUR-MIDA');
   // Al límit exacte passa, en columnes i en payload.
   await submission(db,7491,{title:llarg(1000),description:llarg(20000),payload:{title:llarg(1000),description:llarg(20000),content:llarg(100000)}});
   // Un caràcter més, en qualsevol dels cinc camps, no.
   for(const [n,extra] of [[7492,{title:llarg(1001)}],[7493,{description:llarg(20001)}],[7494,{payload:{title:llarg(1001)}}],
     [7495,{payload:{description:llarg(20001)}}],[7496,{payload:{content:llarg(100001)}}]]){
    await assert.rejects(submission(db,n,extra),mida,`fila ${n}`);
   }
   assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=any($1)',[[7492,7493,7494,7495,7496].map(id)])).rows[0].n,0);
   // L'INSERT directe d'una persona també hi passa (el camí de les publicacions independents del Mercat):
   // dins del límit s'accepta i un caràcter de més a payload.description, no.
   const producte=(n,descripcio)=>actor(db,OWNER,c=>c.query("insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,description,payload) values($1,$2,$3,'mercat','Producte','Bo',$4) returning id",
    [id(n),TOWN,OWNER,{description:descripcio,status:'published',visibility:'public'}]));
   assert.equal((await producte(7497,llarg(20000))).rows[0].id,id(7497));
   await assert.rejects(producte(7501,llarg(20001)),mida);
   // La publicació atòmica des de Notes: rebutjada sencera, sense acte, operació ni vincle a mitges.
   await note(db,7498);
   await assert.rejects(actor(db,OWNER,c=>publish(c,7498,7499,1,107499,{content:llarg(100001)})),mida);
   assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=$1',[id(7499)])).rows[0].n,0);
   assert.equal((await db.query('select count(*)::int n from private.mur_actes_notes where act_id=$1',[id(7499)])).rows[0].n,0);
   assert.equal((await db.query('select count(*)::int n from private.mur_operacions_notes where operation_id=$1',[id(107499)])).rows[0].n,0);
   assert.deepEqual((await db.query('select is_published,published_submission_id from public.notes where id=$1',[id(7498)])).rows[0],{is_published:false,published_submission_id:null});
   // Les notes privades no són el Mur: cap límit nou.
   await submission(db,7500,{section:'notes',visibility:'private',payload:{content:llarg(150000)}});
   // La fila antiga (7490, d'abans de la migració) continua llegible, moderable i editable sense créixer.
   assert.equal(result(await actor(db,OTHER,c=>rich(c,TOWN,[id(7490)],1))).files[0].payload.content.length,150000);
   await db.query("update public.section_submissions set moderation_state='hidden' where id=$1",[id(7490)]);
   await db.query("update public.section_submissions set moderation_state='visible',title=title,description=description where id=$1",[id(7490)]);
   await db.query("update public.section_submissions set payload=jsonb_set(payload,'{content}',to_jsonb($2::text)) where id=$1",[id(7490),llarg(120000,'C')]);
   await assert.rejects(db.query("update public.section_submissions set payload=jsonb_set(payload,'{content}',to_jsonb($2::text)) where id=$1",[id(7490),llarg(120001,'C')]),mida);
   await assert.rejects(db.query('update public.section_submissions set description=$2 where id=$1',[id(7490),llarg(30001,'R')]),mida);
   await assert.rejects(db.query('update public.section_submissions set title=$2 where id=$1',[id(7490),llarg(1501,'T')]),mida);
   const antiga=(await db.query("select char_length(title) t,char_length(description) d,char_length(payload->>'content') c,moderation_state m from public.section_submissions where id=$1",[id(7490)])).rows[0];
   assert.deepEqual(antiga,{t:1500,d:30000,c:120000,m:'visible'});
   // L'upsert de l'autora (ON CONFLICT DO UPDATE, el camí de l'escriptura directa) sense créixer passa; si creix, no.
   const upsert=cos=>actor(db,OWNER,c=>c.query(`insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,description,payload)
    values($1,$2,$3,'mur',$4,$5,$6) on conflict(id) do update set title=excluded.title,description=excluded.description,payload=excluded.payload returning id`,
    [id(7490),TOWN,OWNER,llarg(1500,'T'),llarg(30000,'R'),{content:llarg(cos,'C'),status:'published',visibility:'public'}]));
   assert.equal((await upsert(120000)).rows[0].id,id(7490));
   await assert.rejects(upsert(120001),mida);
   for(const n of [7490,7491,7497,7500])await db.query('delete from public.section_submissions where id=$1',[id(n)]);
  });
  await t.test('anon sense SELECT cru, columnes, RPC membre ni constàncies privades',async()=>{
   for(const sql of ['select * from public.section_submissions','select owner_user_id from public.section_submissions','select payload from public.section_submissions','select * from private.mur_actes_notes','select * from private.mur_operacions_notes','select * from private.mur_publicacions_revocades','select public.llig_mur_membres(null)']){
    await assert.rejects(actor(db,null,c=>c.query(sql)),error('42501'));
   }
  });
  await t.test('DTO anònim escalar i membres de poble amb lectura rica completa',async()=>{
   await submission(db,1,{payload:{content:'<p>Cos ric</p>',image:'https://media.invalid/public.webp',author_name:'AUTORA_PRIVADA',tags:['festa'],poble_id:'la-torre',price:25,eventDate:'2026-11-12',contact:'secret@example.invalid',gps:{lat:38.123456}}});
   const anonymous=(await actor(db,null,pub)).rows[0];
   assert.deepEqual(Object.keys(anonymous),['id','tenant_id','section_id','title','description','public_content','created_at','updated_at','catalog_font','catalog_id','catalog_destins','destinacio_workspace']);
   assert.doesNotMatch(JSON.stringify(anonymous),/AUTORA_PRIVADA|owner_user_id|secret@|38\.123456|image|gps/);
   const member=result(await actor(db,OTHER,rich));assert.equal(member.lectura,'membre');
   assert.equal(member.files[0].owner_user_id,OWNER);assert.equal(member.files[0].payload.price,25);
   assert.equal(member.files[0].payload.eventDate,'2026-11-12');assert.deepEqual(member.files[0].payload.tags,['festa']);
   assert.equal((await actor(db,OTHER,c=>c.query('select owner_user_id,payload from public.section_submissions where id=$1',[id(1)]))).rows[0].owner_user_id,OWNER);
   assert.equal((await actor(db,OTHER,c=>c.query('select id from public.profiles where id=$1',[OWNER]))).rows.length,0);
  });
  await t.test('sessió Foraster degrada a DTO públic sense error ni owner, perfil o EXIF',async()=>{
   const outside=result(await actor(db,OUTSIDER,rich));assert.equal(outside.lectura,'public');
   assert.equal(outside.files.length,1);assert.doesNotMatch(JSON.stringify(outside),/owner_user_id|AUTORA_PRIVADA|gps|image/);
   assert.equal((await actor(db,OUTSIDER,c=>c.query('select * from public.section_submissions'))).rows.length,0);
   const nullSession=result(await actor(db,OWNER,c=>rich(c,null)));assert.equal(nullSession.lectura,'membre');
  });
  await t.test('privat, esborrat, moderat i draft només accessibles a autoria pel seu canal privat',async()=>{
   await submission(db,2,{visibility:'private'});await submission(db,3,{moderation:'hidden'});await submission(db,4,{payload:{status:'draft'}});await submission(db,5,{deleted:'2026-01-01'});
   assert.deepEqual(result(await actor(db,OTHER,rich)).files.map(r=>r.id),[id(1)]);
   assert.deepEqual((await actor(db,null,pub)).rows.map(r=>r.id),[id(1)]);
   assert.equal((await actor(db,OTHER,c=>c.query('select * from public.section_submissions where id=any($1)',[[id(2),id(3),id(4),id(5)]]))).rows.length,0);
  });
  await t.test('membre no pot editar ni esborrar autoria aliena tot i llegir-la',async()=>{
   assert.equal((await actor(db,OTHER,c=>c.query("update public.section_submissions set title='Atac' where id=$1 returning id",[id(1)]))).rows.length,0);
   assert.equal((await actor(db,OTHER,c=>c.query('delete from public.section_submissions where id=$1 returning id',[id(1)]))).rows.length,0);
  });
  await t.test('denúncia anònima per UUID resol autoria al servidor i retorna rebut sense autor',async()=>{
   const ack=result(await actor(db,null,c=>c.query("select public.denuncia_publicacio_mur($1,'spam_frau','Prova anònima') as result",[id(1)])));
   assert.deepEqual(ack,{rebuda:true,repetida:false});
   const row=(await db.query('select autor_id,autor_tipus,tenant_id,denunciant from public.denuncies where objecte_id=$1',[id(1)])).rows[0];
   assert.deepEqual(row,{autor_id:OWNER,autor_tipus:'persona',tenant_id:TOWN,denunciant:null});
   await assert.rejects(actor(db,null,c=>c.query('select * from public.denuncies')),error('42501'));
  });
  await t.test('denúncia membre repetida és idempotent i privada/inexistent iguals',async()=>{
   const request=c=>c.query("select public.denuncia_publicacio_mur($1,'altre',null) as result",[id(1)]);
   assert.deepEqual(result(await actor(db,OTHER,request)),{rebuda:true,repetida:false});
   assert.deepEqual(result(await actor(db,OTHER,request)),{rebuda:true,repetida:true});
   const responses=[];for(const n of [2,9999])try{await actor(db,null,c=>c.query("select public.denuncia_publicacio_mur($1,'altre',null)",[id(n)]));}catch(e){responses.push([e.code,e.message]);}
   assert.equal(responses.length,2);assert.deepEqual(responses[0],responses[1]);
  });
  await t.test('bloqueig UUID sense autor al rebut oculta en RPC rica, pública i SELECT Node 0',async()=>{
   const ack=result(await actor(db,OTHER,c=>c.query('select public.bloqueja_publicacio_mur($1) as result',[id(1)])));
   assert.deepEqual(ack,{bloquejat:true,publicacio_id:id(1)});
   assert.equal(result(await actor(db,OTHER,rich)).files.length,0);
   assert.equal((await actor(db,OTHER,pub)).rows.length,0);
   assert.equal((await actor(db,OTHER,c=>c.query('select * from public.section_submissions'))).rows.length,0);
   assert.equal((await actor(db,null,pub)).rows.length,1);
   await actor(db,OTHER,c=>c.query('delete from public.bloquejos'));
   assert.equal(result(await actor(db,OTHER,rich)).files.length,1);
  });
  await t.test('Foraster autenticat bloqueja per UUID i continua sense rebre autor',async()=>{
   await actor(db,OUTSIDER,c=>c.query('select public.bloqueja_publicacio_mur($1)',[id(1)]));
   assert.equal(result(await actor(db,OUTSIDER,rich)).files.length,0);
   // R22 (sql-03, notes-01, honestedat-02) · Tampoc la fila pròpia de bloquejos porta l'autora.
   const propis=(await actor(db,OUTSIDER,c=>c.query('select * from public.bloquejos'))).rows;
   assert.equal(propis.length,1);assert.doesNotMatch(JSON.stringify(propis),new RegExp(OWNER));
   assert.deepEqual([propis[0].bloquejat_tipus,propis[0].publicacio_id,propis[0].bloquejat_persona,propis[0].bloquejat_entitat],['publicacio',id(1),null,null]);
   await actor(db,OUTSIDER,c=>c.query('delete from public.bloquejos'));
   assert.equal((await db.query('select count(*)::int n from private.mur_bloquejos_opacs where bloquejador=$1',[OUTSIDER])).rows[0].n,0);
   assert.equal(result(await actor(db,OUTSIDER,rich)).files.length,1);
   await assert.rejects(actor(db,null,c=>c.query('select public.bloqueja_publicacio_mur($1)',[id(1)])),error('42501'));
  });
  await t.test('bloqueig opac: amaga l’autoria a la lectura mínima, mai on qui mira llig l’autoria, es desfà pel UUID i no es falsifica',async()=>{
   await submission(db,9500);await submission(db,9501,{town:TOWN2});
   assert.deepEqual(result(await actor(db,OUTSIDER,c=>c.query('select public.bloqueja_publicacio_mur($1) as result',[id(1)]))),{bloquejat:true,publicacio_id:id(1)});
   // Mateixa autoria al poble on és Foraster: la lectura mínima amaga les dues.
   assert.ok(!result(await actor(db,OUTSIDER,rich)).files.some(r=>[id(1),id(9500)].includes(r.id)));
   assert.ok(!(await actor(db,OUTSIDER,pub)).rows.some(r=>[id(1),id(9500)].includes(r.id)));
   // Al poble on és membre, la lectura rica i la mínima no canvien: res a comparar.
   const rica=result(await actor(db,OUTSIDER,c=>rich(c,TOWN2)));assert.equal(rica.lectura,'membre');
   assert.ok(rica.files.some(r=>r.id===id(9501)&&r.owner_user_id===OWNER));
   assert.ok((await actor(db,OUTSIDER,c=>pub(c,TOWN2))).rows.some(r=>r.id===id(9501)));
   // Un segon UUID de la mateixa autoria no afig files; un INSERT cru opac es rebutja.
   await actor(db,OUTSIDER,c=>c.query('select public.bloqueja_publicacio_mur($1)',[id(9500)]));
   assert.equal((await actor(db,OUTSIDER,c=>c.query('select count(*)::int n from public.bloquejos'))).rows[0].n,1);
   await assert.rejects(actor(db,OUTSIDER,c=>c.query("insert into public.bloquejos(bloquejat_tipus,publicacio_id) values('publicacio',$1)",[id(9500)])),error('42501'));
   await assert.rejects(actor(db,OUTSIDER,c=>c.query('select * from private.mur_bloquejos_opacs')),error('42501'));
   // Desbloquejar pel mateix UUID públic (el camí del client) les torna a mostrar.
   assert.equal((await actor(db,OUTSIDER,c=>c.query('delete from public.bloquejos where publicacio_id=$1 returning id',[id(1)]))).rows.length,1);
   assert.ok(result(await actor(db,OUTSIDER,rich)).files.some(r=>r.id===id(9500)));
   // Si l'autoria desapareix, la fila opaca visible també: cap entrada òrfena.
   await actor(db,OUTSIDER,c=>c.query('select public.bloqueja_publicacio_mur($1)',[id(1)]));
   await db.query('delete from private.mur_bloquejos_opacs where bloquejador=$1',[OUTSIDER]);
   assert.equal((await db.query('select count(*)::int n from public.bloquejos where bloquejador=$1',[OUTSIDER])).rows[0].n,0);
   // Si la mateixa publicació canvia de signatura, un altre bloqueig opac la torna a amagar i desbloquejar pel UUID les lleva totes dues.
   const entitat=result(await actor(db,OWNER,c=>c.query("select public.create_organization($1,'company','Entitat opaca','entitat-opaca-r22') as result",[TOWN])));
   await submission(db,9502);
   await actor(db,OUTSIDER,c=>c.query('select public.bloqueja_publicacio_mur($1)',[id(9502)]));
   await actor(db,OWNER,c=>c.query('update public.section_submissions set author_org_id=$2 where id=$1',[id(9502),entitat.id]));
   assert.ok(result(await actor(db,OUTSIDER,rich)).files.some(r=>r.id===id(9502)));
   await actor(db,OUTSIDER,c=>c.query('select public.bloqueja_publicacio_mur($1)',[id(9502)]));
   assert.ok(!result(await actor(db,OUTSIDER,rich)).files.some(r=>r.id===id(9502)));
   assert.doesNotMatch(JSON.stringify((await actor(db,OUTSIDER,c=>c.query('select * from public.bloquejos'))).rows),new RegExp(`${OWNER}|${entitat.id}`));
   assert.equal((await actor(db,OUTSIDER,c=>c.query('delete from public.bloquejos where publicacio_id=$1 returning id',[id(9502)]))).rows.length,2);
   for(const n of [9500,9501,9502])await db.query('delete from public.section_submissions where id=$1',[id(n)]);
  });
  await t.test('bloqueig opac coherent amb la llista: si qui bloqueja entra al padró del poble de la publicació, hi continua amagant l’autoria',async()=>{
   // R22 ronda 3 (P2) · Abans, en entrar al padró de TOWN les publicacions de l'autora tornaven a eixir a la lectura rica
   // i al SELECT autenticat, mentre la llista encara deia «qui firma esta publicació».
   const TOWN3='11000000-0000-4000-8000-000000000023';
   await db.query("insert into public.towns(id,slug,name) values($1,'r21-v2-tercer','Tercer poble de prova')",[TOWN3]);
   await submission(db,9510);await submission(db,9511,{town:TOWN2});await submission(db,9512,{town:TOWN3});await submission(db,9513,{owner:OTHER});
   const veu=async(town,ids)=>result(await actor(db,OUTSIDER,c=>rich(c,town,ids.map(id))));
   const cru=async ids=>(await actor(db,OUTSIDER,c=>c.query('select id,owner_user_id from public.section_submissions where id=any($1)',[ids.map(id)]))).rows;
   await actor(db,OUTSIDER,c=>c.query('select public.bloqueja_publicacio_mur($1)',[id(1)]));
   // La mateixa autoria des d'un tercer poble on també és Foraster: cap fila visible nova.
   await actor(db,OUTSIDER,c=>c.query('select public.bloqueja_publicacio_mur($1)',[id(9512)]));
   const llista=async()=>(await actor(db,OUTSIDER,c=>c.query('select bloquejat_tipus,publicacio_id,bloquejat_persona from public.bloquejos'))).rows;
   assert.deepEqual(await llista(),[{bloquejat_tipus:'publicacio',publicacio_id:id(1),bloquejat_persona:null}]);
   try{
    await db.query("insert into public.town_memberships(town_id,user_id,role) values($1,$2,'member'),($3,$2,'member')",[TOWN,OUTSIDER,TOWN3]);
    // Al poble de la publicació bloquejada ja llig l'autoria: la lectura rica i el SELECT cru (Node 0) continuen sense l'autora.
    const rica=await veu(TOWN,[1,9510,9513]);
    assert.equal(rica.lectura,'membre');
    assert.deepEqual(rica.files.map(r=>[r.id,r.owner_user_id]),[[id(9513),OTHER]]);
    assert.deepEqual((await cru([1,9510,9513])).map(r=>r.id),[id(9513)]);
    assert.ok(!(await actor(db,OUTSIDER,c=>pub(c,TOWN))).rows.some(r=>[id(1),id(9510)].includes(r.id)));
    // També al tercer poble, des d'on havia bloquejat la mateixa autoria.
    const tercer=await veu(TOWN3,[9512]);assert.equal(tercer.lectura,'membre');assert.deepEqual(tercer.files,[]);
    // Al poble on ja llegia l'autoria i no n'havia bloquejat res, res no canvia: comparar no revela qui firma.
    assert.deepEqual((await veu(TOWN2,[9511])).files.map(r=>[r.id,r.owner_user_id]),[[id(9511),OWNER]]);
    // La llista continua sent la mateixa fila opaca, sense l'autora.
    assert.doesNotMatch(JSON.stringify(await llista()),new RegExp(OWNER));
    // Desbloquejar pel UUID públic les torna totes.
    assert.equal((await actor(db,OUTSIDER,c=>c.query('delete from public.bloquejos where publicacio_id=$1 returning id',[id(1)]))).rows.length,1);
    assert.deepEqual((await veu(TOWN,[1,9510])).files.map(r=>[r.id,r.owner_user_id]).sort(),[[id(1),OWNER],[id(9510),OWNER]].sort());
    assert.deepEqual((await veu(TOWN3,[9512])).files.map(r=>r.id),[id(9512)]);
   }finally{
    await db.query('delete from public.town_memberships where user_id=$1 and town_id=any($2)',[OUTSIDER,[TOWN,TOWN3]]);
    await db.query('delete from public.bloquejos where bloquejador=$1',[OUTSIDER]);
    for(const n of [9510,9511,9512,9513])await db.query('delete from public.section_submissions where id=$1',[id(n)]);
   }
   assert.equal(result(await actor(db,OUTSIDER,rich)).lectura,'public');
  });
  await t.test('denúncia d’un Foraster autenticat: rebut i fila pròpia sense autora; la moderació la resol en privat',async()=>{
   const denuncia=c=>c.query("select public.denuncia_publicacio_mur($1,'altre',null) as result",[id(1)]);
   assert.deepEqual(result(await actor(db,OUTSIDER,denuncia)),{rebuda:true,repetida:false});
   const propies=(await actor(db,OUTSIDER,c=>c.query('select * from public.denuncies'))).rows;
   assert.equal(propies.length,1);assert.equal(propies[0].autor_id,null);assert.equal(propies[0].autor_tipus,null);
   assert.doesNotMatch(JSON.stringify(propies),new RegExp(OWNER));
   assert.deepEqual((await db.query('select autor_tipus,autor_id from private.mur_denuncies_autoria where denuncia_id=$1',[propies[0].id])).rows[0],{autor_tipus:'persona',autor_id:OWNER});
   assert.deepEqual(result(await actor(db,OUTSIDER,denuncia)),{rebuda:true,repetida:true});
   assert.equal((await db.query('select count(*)::int n from private.mur_denuncies_autoria')).rows[0].n,1);
   await assert.rejects(actor(db,OUTSIDER,c=>c.query('select * from private.mur_denuncies_autoria')),error('42501'));
   // Qui ja llig l'autoria (membre) conserva l'autor a la seua fila, com abans.
   assert.equal((await db.query('select autor_id from public.denuncies where denunciant=$1 and objecte_id=$2',[OTHER,id(1)])).rows[0].autor_id,OWNER);
  });
  await t.test('UUID absent i alié: resposta idèntica, cap tombstone ni poisoning',async()=>{
   const failures=[];for(const n of [1,99999])try{await actor(db,OTHER,c=>revoke(c,n));}catch(e){failures.push([e.code,e.message]);}
   assert.equal(failures.length,2);assert.deepEqual(failures[0],failures[1]);
   assert.equal((await db.query('select count(*)::int n from private.mur_publicacions_revocades where submission_id=any($1)',[[id(1),id(99999)]])).rows[0].n,0);
   await submission(db,99999);assert.ok((await actor(db,null,pub)).rows.some(r=>r.id===id(99999)));
  });
  await t.test('exmembre retira publicació pròpia i replay ACK; UUID retirat no ressuscita',async()=>{
   await submission(db,10);
   await db.query('delete from public.town_memberships where user_id=$1 and town_id=$2',[OWNER,TOWN]);
   assert.equal((await actor(db,OWNER,c=>revoke(c,10))).rows[0].ok,true);
   assert.equal((await actor(db,OWNER,c=>revoke(c,10))).rows[0].ok,true);
   await assert.rejects(submission(db,10),error('23514','SDP-MUR-REVOKED'));
   await db.query("insert into public.town_memberships(town_id,user_id,role) values($1,$2,'member')",[TOWN,OWNER]);
  });
  await t.test('publicació de nota atòmica crea UUID d’acte i vincle en un COMMIT',async()=>{
   await note(db,1000);
   const ack=result(await actor(db,OWNER,c=>publish(c,1000,2000)));
   assert.equal(ack.publicacio.id,id(2000));assert.equal(ack.nota_revision,2);assert.equal(ack.publicada_revision,2);assert.equal(ack.replay,false);
   const n=(await db.query('select is_published,published_submission_id,revision from public.notes where id=$1',[id(1000)])).rows[0];
   assert.deepEqual(n,{is_published:true,published_submission_id:id(2000),revision:2});
   assert.equal((await db.query('select act_id from private.mur_actes_notes where note_id=$1',[id(1000)])).rows[0].act_id,id(2000));
  });
  await t.test('no reutilitza note.id i nota absent o aliena no deixa actes orfes',async()=>{
   await assert.rejects(actor(db,OWNER,c=>publish(c,1000,1000,2)),error('22023'));
   await assert.rejects(actor(db,OWNER,c=>publish(c,1999,2999)),error('42501'));
   await assert.rejects(actor(db,OTHER,c=>publish(c,1000,2998,2)),error('42501'));
   assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=any($1)',[[id(2999),id(2998)]])).rows[0].n,0);
  });
  await t.test('replay d’operació perduda és ACK i edició deliberada usa nou operationId',async()=>{
   const replay=result(await actor(db,OWNER,c=>publish(c,1000,2000,1)));
   assert.equal(replay.replay,true);assert.equal(replay.nota_revision,2);
   const edit=result(await actor(db,OWNER,c=>publish(c,1000,2000,2,9001,{content:'Edició nova'})));
   assert.equal(edit.nota_revision,3);assert.equal(edit.publicada_revision,3);assert.equal(edit.publicacio.payload.content,'Edició nova');
   const old=result(await actor(db,OWNER,c=>publish(c,1000,2000,1)));
   assert.equal(old.replay,true);assert.equal(old.publicacio.payload.content,'Edició nova');assert.equal(old.nota_revision,3);assert.equal(old.publicada_revision,2);
   await assert.rejects(actor(db,OWNER,c=>publish(c,1000,2000,2,9002,{content:'ROLLBACK'})),error('40001','SDP-MUR-REVISION'));
  });
  await t.test('una nota no pot tindre dos actes actius ni usar una operació d’altra nota',async()=>{
   await assert.rejects(actor(db,OWNER,c=>publish(c,1000,2001,3)),error('40001'));
   await note(db,1001);
   await assert.rejects(actor(db,OWNER,c=>publish(c,1001,2002,1,102000)),error('42501'));
   assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=any($1)',[[id(2001),id(2002)]])).rows[0].n,0);
  });
  await t.test('fallada després d’INSERT d’acte desfà també INSERT: cap publicació òrfena',async()=>{
   await note(db,1010);
   await db.query(`create function public.r21_test_abort_note() returns trigger language plpgsql as $$ begin if new.id='${id(1010)}'::uuid and new.is_published then raise exception 'abort de prova'; end if;return new;end $$;
    create trigger z_r21_test_abort_note before update on public.notes for each row execute function public.r21_test_abort_note()`);
   await assert.rejects(actor(db,OWNER,c=>publish(c,1010,2010)),/abort de prova/);
   assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=$1',[id(2010)])).rows[0].n,0);
   await db.query('drop trigger z_r21_test_abort_note on public.notes; drop function public.r21_test_abort_note()');
  });
  await t.test('retirada explícita d’acte ignora edicions privades i permet republicar amb UUID nou',async()=>{
   await actor(db,OWNER,c=>c.query("update public.notes set content='Edició privada' where id=$1",[id(1000)]));
   assert.equal((await actor(db,OWNER,c=>revokeNote(c,1000,3,2000))).rows[0].ok,true);
   const n=(await db.query('select is_published,published_submission_id,revision from public.notes where id=$1',[id(1000)])).rows[0];
   assert.equal(n.is_published,false);assert.equal(n.published_submission_id,null);
   const repub=result(await actor(db,OWNER,c=>publish(c,1000,2003,n.revision)));
   assert.equal(repub.publicacio.id,id(2003));
   await assert.rejects(actor(db,OWNER,c=>publish(c,1000,2000,repub.nota_revision)),error('23514','SDP-MUR-REVOKED'));
   assert.equal((await actor(db,OWNER,c=>revokeNote(c,1000,3,2000))).rows[0].ok,true);
   assert.equal((await db.query('select published_submission_id from public.notes where id=$1',[id(1000)])).rows[0].published_submission_id,id(2003));
  });
  await t.test('wrapper antic de retirada rebut vell no retira una publicació nova',async()=>{
   await note(db,1020);const a=result(await actor(db,OWNER,c=>publish(c,1020,2020)));
   assert.equal((await actor(db,OWNER,c=>c.query('select public.revoca_publicacio_de_nota($1,$2,$3) as ok',[id(1020),TOWN,a.nota_revision]))).rows[0].ok,true);
   const n=(await db.query('select revision from public.notes where id=$1',[id(1020)])).rows[0];
   await actor(db,OWNER,c=>publish(c,1020,2021,n.revision));
   assert.equal((await actor(db,OWNER,c=>c.query('select public.revoca_publicacio_de_nota($1,$2,$3) as ok',[id(1020),TOWN,a.nota_revision]))).rows[0].ok,true);
   assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=$1',[id(2021)])).rows[0].n,1);
  });
  await t.test('paperera posa is_published=false, desvincula i retira sense tombstonar note.id',async()=>{
   await note(db,1030);await actor(db,OWNER,c=>publish(c,1030,2030));
   const n=(await actor(db,OWNER,c=>c.query("update public.notes set status='paperera' where id=$1 returning is_published,published_submission_id",[id(1030)]))).rows[0];
   assert.deepEqual(n,{is_published:false,published_submission_id:null});
   assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=$1',[id(2030)])).rows[0].n,0);
   assert.equal((await db.query('select count(*)::int n from private.mur_publicacions_revocades where submission_id=$1',[id(1030)])).rows[0].n,0);
   await actor(db,OWNER,c=>c.query("update public.notes set status='activa' where id=$1",[id(1030)]));
   const revision=(await db.query('select revision from public.notes where id=$1',[id(1030)])).rows[0].revision;
   await actor(db,OWNER,c=>publish(c,1030,2031,revision));
  });
  await t.test('nota esborrada retira acte real però no crea tombstone per UUID de nota absent',async()=>{
   await note(db,1040);await actor(db,OWNER,c=>publish(c,1040,2040));
   await actor(db,OWNER,c=>c.query('delete from public.notes where id=$1',[id(1040)]));
   assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=$1',[id(2040)])).rows[0].n,0);
   assert.equal((await db.query('select count(*)::int n from private.mur_publicacions_revocades where submission_id=$1',[id(1040)])).rows[0].n,0);
   assert.equal((await actor(db,OWNER,c=>revokeNote(c,1040,2,2040))).rows[0].ok,true);
  });
  await t.test('sanitització preserva ISO, hora, anys i ISBN; dos scripts conserven el text central',async()=>{
   for(const value of ['Fira del 2026-11-12','Crònica 1987-2026','Obri a les 2026-11-12 10:30','ISBN 978-84-123-4567-4','ISBN 0-306-40615-2','ISBN 0-8044-2957-X','Pàgines 120-135','2024-02-29','2000-02-29']){
    assert.equal((await db.query('select private.mur_text_public($1) as v',[value])).rows[0].v,value);
   }
   assert.equal((await db.query("select private.mur_text_public('<script>secret1</script>TEXT CENTRAL<script>secret2</script>') as v")).rows[0].v,'TEXT CENTRAL');
   assert.equal((await db.query("select private.mur_text_public('<style>secret1</style>TEXT<style>secret2</style>') as v")).rows[0].v,'TEXT');
  });
  await t.test('contactes adjacents, internacionals, punts, URL indirecta i GPS mai passen',async()=>{
   for(const value of ['600123456','600 123 456','965 55 12 34','+34 600 123 456','0034 600 123 456','(96) 555 12 34','600.123.456','600123456.965551234','600123456,965551234','600123456;965551234','600/123/456','600_123_456','ISBN 978-84-123-4567-8','ISBN 6001234560','9999-0000','2026-1987','600123456 965551234','02012345678','+49 (0) 123 456 7890','12 34 56 78','2026-02-31','2026-13-01','2025-02-29','1900-02-29']){
    const actual=(await db.query('select private.mur_text_public($1) as v',[value])).rows[0].v;
    assert.match(actual,/contacte omés/,`${value} -> ${actual}`);assert.doesNotMatch(actual,/600|965|555|0034|4567890/,value);
   }
   for(const value of ['38.123456 -0.123456','38,123456 -0,123456',"38° 43' 16.5\"N",'wa.me/34600123456','t.me/nomprivat','a@example.invalid']){
    const actual=(await db.query('select private.mur_text_public($1) as v',[value])).rows[0].v;assert.doesNotMatch(actual,/123456|43|34600|nomprivat|example/);
   }
  });
  await t.test('compartició antiga no autocita un perfil privat per la projecció anònima',async()=>{
   await submission(db,3000,{payload:{type:'compartit',origen:{autorNom:'PERSONA_PRIVADA'},content:'<p>Compartit de PERSONA_PRIVADA: recurs.</p>'}});
   const a=(await actor(db,null,pub)).rows.find(r=>r.id===id(3000));assert.equal(a.public_content,'');
   const m=result(await actor(db,OTHER,c=>rich(c,TOWN,[id(3000)]))).files[0];assert.match(m.payload.content,/PERSONA_PRIVADA/);assert.equal(m.payload.origen.autorNom,undefined);
  });
  await t.test('llista Storage anònima denegada però bucket públic i URL legítima es mantenen',async()=>{
   await db.query("insert into storage.objects(id,bucket_id,name,owner,owner_id,version) values($1,'mitjans',$2,$3::uuid,$3::uuid::text,'v1')",[id(4000),`${OWNER}/public.webp`,OWNER]);
   assert.equal((await actor(db,null,c=>c.query("select * from storage.objects where bucket_id='mitjans'"))).rows.length,0);
   assert.equal((await db.query("select public from storage.buckets where id='mitjans'")).rows[0].public,true);
   assert.equal((await actor(db,OWNER,c=>c.query("select name from storage.objects where bucket_id='mitjans'"))).rows[0].name,`${OWNER}/public.webp`);
  });
  await t.test('retirada encua només còpies públiques pròpies citades; conserva altres referències',async()=>{
   // R22 · Les còpies públiques porten el nom determinista de promoteToPublic.
   for(const n of [4001,4002,4003])await objecte(db,n,copia(n));
   await submission(db,4100,{payload:{image:`https://example.invalid/storage/v1/object/public/mitjans/${copia(4001)}`,image2:`https://example.invalid/storage/v1/object/public/mitjans/${copia(4002)}`}});
   await submission(db,4101,{payload:{image:`https://example.invalid/storage/v1/object/public/mitjans/${copia(4002)}`}});
   await actor(db,OWNER,c=>revoke(c,4100));
   const rows=(await db.query('select object_id,object_version,referenciat from public.cua_purga_storage_ugc where object_id=any($1) order by object_id',[[id(4001),id(4002),id(4003)]])).rows;
   assert.deepEqual(rows,[{object_id:id(4001),object_version:'v1',referenciat:false},{object_id:id(4002),object_version:'v1',referenciat:true}]);
  });
  await t.test('retirada esborra títol de xat i subjecte privat/retirat no es pot reobrir',async()=>{
   await submission(db,5000,{title:'TÍTOL PRIVAT RETIRABLE'});
   const thread=id(5001);
   await db.query("insert into public.xat_fils(id,tenant_id,tipus,titol,creat_per,subjecte_tipus,subjecte_id,subjecte_titol,subjecte_ruta,subjecte_uri) values($1,$2,'grup','TÍTOL PRIVAT RETIRABLE',$3,'publicacio',$4,'TÍTOL PRIVAT RETIRABLE','/mur/x','https://example.invalid/mur/x')",[thread,TOWN,OWNER,id(5000)]);
   assert.equal((await db.query("select * from private.xat_subjecte($1,'publicacio',$2)",[TOWN,id(5000)])).rows.length,1);
   await actor(db,OWNER,c=>revoke(c,5000));
   const f=(await db.query('select titol,subjecte_titol,subjecte_ruta,subjecte_uri from public.xat_fils where id=$1',[thread])).rows[0];
   assert.deepEqual(f,{titol:'Publicació retirada',subjecte_titol:null,subjecte_ruta:null,subjecte_uri:null});
   assert.equal((await db.query("select * from private.xat_subjecte($1,'publicacio',$2)",[TOWN,id(5000)])).rows.length,0);
   assert.equal((await db.query("select * from private.xat_subjecte($1,'publicacio',$2)",[TOWN,id(2)])).rows.length,0);
  });
  await t.test('visibilitat privada posterior també saneja títols de xat',async()=>{
   await submission(db,5010,{title:'TÍTOL DESPRÉS PRIVAT'});
   await db.query("insert into public.xat_fils(id,tenant_id,tipus,titol,creat_per,subjecte_tipus,subjecte_id,subjecte_titol) values($1,$2,'grup','TÍTOL DESPRÉS PRIVAT',$3,'publicacio',$4,'TÍTOL DESPRÉS PRIVAT')",[id(5011),TOWN,OWNER,id(5010)]);
   await actor(db,OWNER,c=>c.query("update public.section_submissions set visibility='private' where id=$1",[id(5010)]));
   assert.equal((await db.query('select subjecte_titol from public.xat_fils where id=$1',[id(5011)])).rows[0].subjecte_titol,null);
  });
  await t.test('paginació estable, límit51 i filtre UUID anterior a LIMIT també per a Foraster',async()=>{
   for(let n=6000;n<6060;n++)await submission(db,n);
   const first=result(await actor(db,OTHER,c=>rich(c,TOWN,null,999)));
   assert.equal(first.files.length,51);
   const last=first.files.at(-1),second=result(await actor(db,OTHER,c=>rich(c,TOWN,null,51,last.created_at,last.id)));
   assert.ok(!second.files.some(r=>first.files.some(f=>f.id===r.id)));
   assert.equal(result(await actor(db,OUTSIDER,c=>rich(c,TOWN,[id(1)],1))).files[0].id,id(1));
   assert.equal(result(await actor(db,OTHER,c=>rich(c,TOWN,[id(1)],1))).files[0].id,id(1));
  });
  await t.test('dades-05 · p_nomes_projeccions filtra al servidor abans del LIMIT a la lectura anònima i a les dues branques de membres',async()=>{
   const marca=(extra={})=>({projeccioCataleg:{v:1,font:'herbari',id:'timonet',destins:['herbari'],audiencia:'publica',...extra}});
   // Més antigues que les 60 publicacions de la prova anterior: un filtre fet després del LIMIT no les trobaria.
   const antiga=s=>`2001-01-01T00:00:0${s}Z`;
   await submission(db,9600,{payload:marca(),created:antiga(0)});
   await submission(db,9601,{payload:marca({audiencia:'privada'}),created:antiga(1)}); // marca que no és pública
   await submission(db,9602,{payload:marca({id:'44000000-0000-4000-8000-000000009602'}),created:antiga(2)}); // id amb forma d'UUID
   await submission(db,9603,{payload:{projeccioCataleg:'no-és-un-objecte'},created:antiga(3)});
   const nomesPub=(c,limit)=>c.query('select * from public.llig_mur_public(p_tenant_id=>$1,p_limit=>$2,p_nomes_projeccions=>true)',[TOWN,limit]);
   const nomesRich=(c,limit)=>c.query('select public.llig_mur_membres(p_tenant_id=>$1,p_limit=>$2,p_nomes_projeccions=>true) as result',[TOWN,limit]);
   const anonim=(await actor(db,null,c=>nomesPub(c,1))).rows;
   assert.deepEqual(anonim.map(r=>[r.id,r.catalog_font,r.catalog_id,r.catalog_destins]),[[id(9600),'herbari','timonet',['herbari']]]);
   const membre=result(await actor(db,OTHER,c=>nomesRich(c,1)));
   assert.equal(membre.lectura,'membre');assert.deepEqual(membre.files.map(r=>r.id),[id(9600)]);
   assert.equal(membre.files[0].owner_user_id,OWNER);assert.equal(membre.files[0].payload.projeccioCataleg.id,'timonet');
   const foraster=result(await actor(db,OUTSIDER,c=>nomesRich(c,1)));
   assert.equal(foraster.lectura,'public');assert.deepEqual(foraster.files.map(r=>[r.id,r.catalog_font]),[[id(9600),'herbari']]);
   assert.doesNotMatch(JSON.stringify(foraster),/owner_user_id|AUTORA_PRIVADA/);
   // Amb el filtre i un límit ample, cap fila sense marca vàlida.
   assert.deepEqual((await actor(db,null,c=>nomesPub(c,200))).rows.map(r=>r.id),[id(9600)]);
   assert.deepEqual(result(await actor(db,OTHER,c=>nomesRich(c,51))).files.map(r=>r.id),[id(9600)]);
   // El cursor continua sent de conjunt de claus: després de l'única projecció, res.
   assert.equal((await actor(db,null,c=>c.query('select * from public.llig_mur_public(p_tenant_id=>$1,p_before_created_at=>$2,p_before_id=>$3,p_nomes_projeccions=>true)',[TOWN,anonim[0].created_at,id(9600)]))).rows.length,0);
   // Per defecte, i amb false explícit, la lectura no canvia: les files sense projecció hi continuen.
   const totes=(await actor(db,null,c=>pub(c))).rows.map(r=>r.id);
   assert.ok([1,6059,9600,9601,9602,9603].every(n=>totes.includes(id(n))));
   assert.deepEqual((await actor(db,null,c=>c.query('select id from public.llig_mur_public(p_tenant_id=>$1,p_nomes_projeccions=>false)',[TOWN]))).rows.map(r=>r.id),totes);
   // Sense el filtre, la primera pàgina (també d'una sola fila) no arriba a la projecció: el filtre és abans del LIMIT.
   assert.notEqual((await actor(db,null,c=>c.query('select id from public.llig_mur_public(p_tenant_id=>$1,p_limit=>1)',[TOWN]))).rows[0].id,id(9600));
   const primera=result(await actor(db,OTHER,c=>rich(c,TOWN,null,51)));
   assert.equal(primera.files.length,51);assert.ok(!primera.files.some(r=>r.id===id(9600)));
   // La crida posicional antiga (cinc arguments, com Node 0 i la prova d'Opció A) resol la signatura nova sense ambigüitat.
   assert.ok((await actor(db,null,c=>c.query('select * from public.llig_mur_public($1,$2,$3,$4,$5)',[TOWN,'mur',200,null,null]))).rows.some(r=>r.id===id(9600)));
   for(const n of [9600,9601,9602,9603])await db.query('delete from public.section_submissions where id=$1',[id(n)]);
  });
  await t.test('reintents antics concurrents no reescriuen una edició nova',async()=>{
   await note(db,7000);const initial=result(await actor(db,OWNER,c=>publish(c,7000,7100)));
   const b=await cluster.connect();
   try{
    const [edit,replay]=await Promise.all([actor(db,OWNER,c=>publish(c,7000,7100,initial.nota_revision,7200,{content:'Contingut definitiu'})),actor(b,OWNER,c=>publish(c,7000,7100,1))]);
    assert.equal(result(edit).replay,false);assert.equal(result(replay).replay,true);
    assert.equal((await db.query("select payload->>'content' as v from public.section_submissions where id=$1",[id(7100)])).rows[0].v,'Contingut definitiu');
   }finally{await b.end();}
  });
  await t.test('consulta de rebut recupera revision abans del flush sense mutar ni acceptar UUID d’operació alié',async()=>{
   const revision=(await db.query('select revision from public.notes where id=$1',[id(7000)])).rows[0].revision;
   const probe=c=>c.query("select public.publica_nota_al_mur($1,$2,'mur',null,1,$3) as result",[id(7000),id(7100),id(107100)]);
   const ack=result(await actor(db,OWNER,probe));assert.equal(ack.replay,true);assert.equal(ack.nota_revision,revision);
   assert.equal((await db.query('select revision from public.notes where id=$1',[id(7000)])).rows[0].revision,revision);
   assert.equal(result(await actor(db,OWNER,c=>c.query("select public.publica_nota_al_mur($1,$2,'mur',null,1,$3) as result",[id(7000),id(7100),id(991234)]))),null);
   await assert.rejects(actor(db,OTHER,probe),error('42501'));
  });
  await t.test('Node 0 compila la lectura real i conserva autoria aliena amb RLS autenticada',async()=>{
   const sql=compilaOperacioNodeZero('loadSeccioPage',{sectionId:'mur',limit:50},TOWN);
   const row=(await actor(db,OTHER,c=>c.query(sql))).rows[0];
   const response=Object.values(row)[0];assert.equal(response.status,200);assert.equal(response.body.lectura,'membre');
   assert.ok(response.body.rows.some(r=>r.owner_user_id===OWNER));assert.ok(response.body.nextCursor);
   const outside=Object.values((await actor(db,OUTSIDER,c=>c.query(sql))).rows[0])[0];
   assert.equal(outside.body.lectura,'public');assert.doesNotMatch(JSON.stringify(outside),/owner_user_id|AUTORA_PRIVADA/);
  });
  await t.test('guarda restrictiva no reobri lectura privada encara que reaparega USING true',async()=>{
   await db.query('create policy "v2 prova permissiva" on public.section_submissions for select to authenticated using(true)');
   assert.equal((await actor(db,OTHER,c=>c.query('select * from public.section_submissions where id=$1',[id(2)]))).rows.length,0);
   await db.query('drop policy "v2 prova permissiva" on public.section_submissions');
  });
  await t.test('doble primer POST concurrent retorna un rebut i només crea un acte',async()=>{
   await note(db,7300);const b=await cluster.connect();
   try{
    const attempts=await Promise.all([actor(db,OWNER,c=>publish(c,7300,7301)),actor(b,OWNER,c=>publish(c,7300,7301))]);
    assert.deepEqual(attempts.map(r=>result(r).replay).sort(),[false,true]);
    assert.equal((await db.query('select revision from public.notes where id=$1',[id(7300)])).rows[0].revision,2);
    assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=$1',[id(7301)])).rows[0].n,1);
   }finally{await b.end();}
  });
  await t.test('UUID d’operació concurrent en notes diferents no deixa orfes ni duplica rebut',async()=>{
   await note(db,7310);await note(db,7311);const b=await cluster.connect();
   try{
    const attempts=await Promise.allSettled([actor(db,OWNER,c=>publish(c,7310,7312,1,7319)),actor(b,OWNER,c=>publish(c,7311,7313,1,7319))]);
    assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);
    assert.equal(attempts.filter(r=>r.status==='rejected')[0].reason.code,'42501');
    assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=any($1)',[[id(7312),id(7313)]])).rows[0].n,1);
   }finally{await b.end();}
  });
  await t.test('carrera edició atòmica contra retirada directa respecta nota→acte sense deadlock',async()=>{
   await note(db,7320);await actor(db,OWNER,c=>publish(c,7320,7321));const b=await cluster.connect();
   try{
    const attempts=await Promise.allSettled([actor(db,OWNER,c=>publish(c,7320,7321,2,7322,{content:'Edició en carrera'})),actor(b,OWNER,c=>revoke(c,7321))]);
    assert.equal(attempts[1].status,'fulfilled');
    if(attempts[0].status==='rejected')assert.ok(['40001','23514'].includes(attempts[0].reason.code),attempts[0].reason.message);
    assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=$1',[id(7321)])).rows[0].n,0);
   }finally{await b.end();}
  });
  await t.test('propietari usa RPC per editar o retirar actes vinculats; DML cru no invertix els panys',async()=>{
   assert.equal((await actor(db,OWNER,c=>c.query("update public.section_submissions set title='Edició crua' where id=$1 returning id",[id(7301)]))).rows.length,0);
   assert.equal((await actor(db,OWNER,c=>c.query('delete from public.section_submissions where id=$1 returning id',[id(7301)]))).rows.length,0);
  });
  await t.test('exmembre retira acte de nota per UUID encara que no puga llegir Notes',async()=>{
   await note(db,7330);await actor(db,OWNER,c=>publish(c,7330,7331));
   await db.query('delete from public.town_memberships where town_id=$1 and user_id=$2',[TOWN,OWNER]);
   assert.equal((await actor(db,OWNER,c=>c.query('select id from public.notes where id=$1',[id(7330)]))).rows.length,0);
   assert.equal((await actor(db,OWNER,c=>revokeNote(c,7330,2,7331))).rows[0].ok,true);
   await db.query("insert into public.town_memberships(town_id,user_id,role) values($1,$2,'member')",[TOWN,OWNER]);
  });
  await t.test('envelope manté autoria d’entitat verificada i no confia en owner del payload',async()=>{
   const org=result(await actor(db,OWNER,c=>c.query("select public.create_organization($1,'company','Entitat de prova','entitat-r21-v2') as result",[TOWN])));
   await note(db,7340);
   const payload={title:'Signatura d’entitat',description:'Resum d’entitat',author_org_id:org.id,payload:{content:'Cos signat',status:'published',visibility:'public',owner_user_id:OTHER}};
   const ack=result(await actor(db,OWNER,c=>c.query("select public.publica_nota_al_mur($1,$2,'mur',$3,1,$4) as result",[id(7340),id(7341),payload,id(7342)])));
   assert.equal(ack.publicacio.author_org_id,org.id);assert.equal(ack.publicacio.owner_user_id,OWNER);assert.equal(ack.publicacio.payload.content,'Cos signat');assert.equal(ack.publicacio.payload.owner_user_id,undefined);assert.equal(ack.publicacio.payload.ownerUserId,OWNER);
   await note(db,7343,{owner:OTHER});
   await assert.rejects(actor(db,OTHER,c=>c.query("select public.publica_nota_al_mur($1,$2,'mur',$3,1,$4)",[id(7343),id(7344),payload,id(7345)])),error('42501'));
  });
  /* T2 del 13-11-2026 (Gauntlet OM-01) · El segon argument de pot_signar_com_organitzacio és el poble de la nota:
     un ajuntament signa al seu poble i no al d'un altre (2611011500). Mata el mutant (v_org, null). */
  await t.test('autoria d’ajuntament: només el del poble de la nota (2611011500)',async()=>{
   // Els ajuntaments es reclamen, no es creen per RPC: la fixture els insereix i trg_organization_add_owner fa propietària la persona de created_by.
   await db.query("insert into public.organizations(id,tenant_id,slug,name,kind,created_by) values($1,$2,'ajuntament-r22-0','Ajuntament de prova','city_hall',$5),($3,$4,'ajuntament-r22-0-altre','Ajuntament d’un altre poble','city_hall',$5)",[id(7520),TOWN,id(7521),TOWN2,OWNER]);
   assert.equal((await db.query("select count(*)::int as n from public.organization_memberships where user_id=$1 and role='owner' and organization_id in ($2,$3)",[OWNER,id(7520),id(7521)])).rows[0].n,2);
   await note(db,7522);
   const propi={title:'Avís municipal',description:'Resum municipal',author_org_id:id(7520),payload:{content:'Cos municipal',status:'published',visibility:'public'}};
   const ack=result(await actor(db,OWNER,c=>c.query("select public.publica_nota_al_mur($1,$2,'mur',$3,1,$4) as result",[id(7522),id(7523),propi,id(7524)])));
   assert.equal(ack.publicacio.author_org_id,id(7520));assert.equal(ack.publicacio.tenant_id,TOWN);
   await note(db,7525);
   await assert.rejects(actor(db,OWNER,c=>c.query("select public.publica_nota_al_mur($1,$2,'mur',$3,1,$4)",[id(7525),id(7526),{...propi,author_org_id:id(7521)},id(7527)])),error('42501'));
  });
  await t.test('Storage autenticat només llista propis; worker reclama exactament la còpia sense referències',async()=>{
   assert.equal((await actor(db,OTHER,c=>c.query("select * from storage.objects where bucket_id='mitjans'"))).rows.length,0);
   assert.equal((await actor(db,OUTSIDER,c=>c.query("select * from storage.objects where bucket_id='mitjans'"))).rows.length,0);
   const claimed=(await actor(db,null,c=>c.query('select * from public.purga_fitxers_reclama(50)'),'service_role')).rows;
   assert.ok(claimed.some(r=>r.nom===copia(4001)));assert.ok(!claimed.some(r=>r.nom===copia(4002)));
   // Confirma la guarda real: una reclamació no acredita encara DELETE físic.
   const receipt=claimed.find(r=>r.nom===copia(4001));
   await actor(db,null,c=>c.query('select public.purga_fitxers_fets($1)',[[receipt.id]]),'service_role');
   assert.equal((await db.query('select ultim_error from public.cua_purga_storage_ugc where id=$1',[receipt.id])).rows[0].ultim_error,"SDP-PURGA-002: l'objecte encara és a Storage.");
  });
  await t.test('retirada amb author_avatar: l’avatar i els fitxers propis heretats no entren a la cua ni el worker els reclama',async()=>{
   // R22 (sql-01) · L'avatar viu al bucket públic, és de l'autora i el payload el cita.
   // `heretat` té la forma de dues carpetes <uid>/notes/<fitxer>: abans del 19-09-2026 (977930983) uploadToStorage
   // pujava ací, al bucket públic, l'ORIGINAL d'una imatge de nota, i la nota el cita. No és cap còpia de publicar.
   const avatar=`${OWNER}/avatars/000000009201.webp`,heretat=`${OWNER}/notes/000000009202.webp`,netaAvatar=copia(9206,OWNER,'avatars');
   for(const [n,nom] of [[9201,avatar],[9202,heretat],[9203,copia(9203)],[9204,copia(9204)],[9205,copia(9205)],[9206,netaAvatar]])await objecte(db,n,nom);
   await db.query('update public.profiles set avatar_url=$2,hero_url=$3 where id=$1',[OWNER,`sdp-media://mitjans/${avatar}`,`sdp-media://mitjans/${copia(9203)}`]);
   await db.query('update public.profiles set presentacio_html=$2 where id=$1',[OTHER,`<p><img src="https://example.invalid/storage/v1/object/public/mitjans/${copia(9204)}"></p>`]);
   await note(db,9200);
   await actor(db,OWNER,c=>publish(c,9200,9210,1,9211,{author_avatar:`sdp-media://mitjans/${avatar}`,image:`sdp-media://mitjans/${heretat}`,
    gallery:[copia(9203),copia(9204),copia(9205),netaAvatar].map(nom=>`sdp-media://mitjans/${nom}`)}));
   await actor(db,OWNER,c=>revokeNote(c,9200,2,9210));
   const cua=Object.fromEntries((await db.query('select nom,referenciat from public.cua_purga_storage_ugc where object_id=any($1)',[[9201,9202,9203,9204,9205,9206].map(id)])).rows.map(r=>[r.nom,r.referenciat]));
   // Només entren les còpies netes: la del perfil propi i la d'un perfil alié es conserven.
   assert.deepEqual(cua,{[copia(9203)]:true,[copia(9204)]:true,[copia(9205)]:false});
   const reclamats=(await actor(db,null,c=>c.query('select * from public.purga_fitxers_reclama(50)'),'service_role')).rows.map(r=>r.nom);
   assert.ok(reclamats.includes(copia(9205)));
   for(const nom of [avatar,heretat,copia(9203),copia(9204),netaAvatar])assert.ok(!reclamats.includes(nom),nom);
   assert.equal((await db.query('select avatar_url from public.profiles where id=$1',[OWNER])).rows[0].avatar_url,`sdp-media://mitjans/${avatar}`);
   // El perfil propi deixa de comptar quan la baixa ja ha iniciat la purga; l'alié no.
   await db.query('begin');
   try{
    await db.query('insert into private.baixes(user_id,purga_prevista_al,purga_fitxers_iniciada_al) values($1,now(),now())',[OWNER]);
    assert.equal((await db.query("select private.referencia_storage_ugc('mitjans',$1,$2) as v",[copia(9203),OWNER])).rows[0].v,false);
    assert.equal((await db.query("select private.referencia_storage_ugc('mitjans',$1,$2) as v",[copia(9204),OWNER])).rows[0].v,true);
   }finally{await db.query('rollback');}
   await db.query('update public.profiles set avatar_url=null,hero_url=null where id=$1',[OWNER]);
   await db.query("update public.profiles set presentacio_html='' where id=$1",[OTHER]);
  });
  await t.test('retirada d’un acte d’abans de sdp-net-v1: encua la còpia UUID de <poble>/<uid>/notes/ i la conserva si una publicació viva, un perfil o una nota pròpia la citen',async()=>{
   // R22 ronda 3 (P1) · Fins a c92b906de, promoteToPublic pujava la còpia pública a la mateixa ruta del privat
   // (`git show c92b906de~1:src/data/supabase/storage.js`: uploadFile('mitjans', path, …)), amb els bytes crus.
   // Les publicacions ja fetes citen eixes còpies; retirar-les les ha d'encuar per a la purga.
   const vella=n=>`${TOWN}/${OWNER}/notes/${id(n)}.webp`,ref=nom=>`sdp-media://mitjans/${nom}`;
   const url=nom=>`https://example.invalid/storage/v1/object/public/mitjans/${nom}`;
   // L'original d'abans del 19-09 (dues carpetes, nom UUID) que la nota cita: mai a la cua.
   const original=`${OWNER}/notes/${id(9706)}.jpg`;
   for(const n of [9701,9702,9703,9704,9705,9707])await objecte(db,n,vella(n));
   await objecte(db,9706,original);
   // Una altra publicació viva, un perfil alié i una nota pròpia (entre el 19 i el 23-09 publicar hi reescrivia la ref pública).
   await submission(db,9712,{payload:{image:url(vella(9702))}});
   await db.query('update public.profiles set presentacio_html=$2 where id=$1',[OTHER,`<p><img src="${url(vella(9703))}"></p>`]);
   await db.query('insert into public.notes(id,tenant_id,owner_user_id,title,content,hero_image) values($1,$2,$3,$4,$5,$6)',
    [id(9720),TOWN,OWNER,'Nota reescrita',`<p><img src="${ref(vella(9704))}"></p>`,ref(vella(9707))]);
   await note(db,9700);
   await actor(db,OWNER,c=>publish(c,9700,9710,1,9711,{image:ref(vella(9701)),gallery:[9702,9703,9704,9705,9707].map(n=>ref(vella(n))),original:url(original)}));
   await actor(db,OWNER,c=>revokeNote(c,9700,2,9710));
   const cua=async()=>Object.fromEntries((await db.query('select nom,referenciat from public.cua_purga_storage_ugc where object_id=any($1)',[[9701,9702,9703,9704,9705,9706,9707].map(id)])).rows.map(r=>[r.nom,r.referenciat]));
   assert.deepEqual(await cua(),{[vella(9701)]:false,[vella(9702)]:true,[vella(9703)]:true,[vella(9704)]:true,[vella(9705)]:false,[vella(9707)]:true});
   // Un acte nou que torna a citar una còpia vella encuada la conserva, com les sdp-net-v1.
   const revision=(await db.query('select revision from public.notes where id=$1',[id(9700)])).rows[0].revision;
   const nou=result(await actor(db,OWNER,c=>publish(c,9700,9713,revision,9714,{image:ref(vella(9705))})));
   assert.equal((await cua())[vella(9705)],true);
   const reclamats=(await actor(db,null,c=>c.query('select * from public.purga_fitxers_reclama(50)'),'service_role')).rows.map(r=>r.nom);
   assert.ok(reclamats.includes(vella(9701)));
   for(const nom of [9702,9703,9704,9705,9707].map(vella).concat(original))assert.ok(!reclamats.includes(nom),nom);
   // La nota pròpia deixa de comptar quan la baixa ja ha iniciat la purga, com el perfil i les publicacions pròpies.
   await db.query('begin');
   try{
    await db.query('insert into private.baixes(user_id,purga_prevista_al,purga_fitxers_iniciada_al) values($1,now(),now())',[OWNER]);
    for(const n of [9704,9707])assert.equal((await db.query("select private.referencia_storage_ugc('mitjans',$1,$2) as v",[vella(n),OWNER])).rows[0].v,false,vella(n));
   }finally{await db.query('rollback');}
   await actor(db,OWNER,c=>revokeNote(c,9700,nou.nota_revision,9713));
   await db.query("update public.profiles set presentacio_html='' where id=$1",[OTHER]);
   for(const [taula,n] of [['section_submissions',9712],['notes',9720]])await db.query(`delete from public.${taula} where id=$1`,[id(n)]);
  });
  await t.test('tornar a publicar la mateixa foto retirada: la còpia present respon Duplicate i el nou acte la conserva',async()=>{
   // R22 (sql-02) · La mateixa promoció regenera el mateix nom sdp-net-v1.
   const nom=copia(9300),ref=`sdp-media://mitjans/${nom}`;
   const puja=(owner=OWNER)=>db.query("insert into storage.objects(bucket_id,name,owner,owner_id,version) values('mitjans',$1,$2::uuid,$2::uuid::text,'v2')",[nom,owner]);
   const fila=async()=>(await db.query("select referenciat,intents from public.cua_purga_storage_ugc where bucket_id='mitjans' and nom=$1",[nom])).rows[0];
   await objecte(db,9300,nom);await note(db,9301);
   await actor(db,OWNER,c=>publish(c,9301,9302,1,9303,{image:ref}));
   await actor(db,OWNER,c=>c.query("update public.notes set status='arxivada' where id=$1",[id(9301)]));
   assert.deepEqual(await fila(),{referenciat:false,intents:0});
   await assert.rejects(puja(),error('23505'));
   await assert.rejects(puja(OTHER),error('55000','SDP-PURGA-004'));
   await actor(db,OWNER,c=>c.query("update public.notes set status='activa' where id=$1",[id(9301)]));
   const revision=(await db.query('select revision from public.notes where id=$1',[id(9301)])).rows[0].revision;
   const ack=result(await actor(db,OWNER,c=>publish(c,9301,9304,revision,9305,{image:ref})));
   assert.equal(ack.publicacio.payload.image,ref);
   assert.deepEqual(await fila(),{referenciat:true,intents:0});
   await assert.rejects(puja(),error('23505'));
   assert.ok(!(await actor(db,null,c=>c.query('select * from public.purga_fitxers_reclama(50)'),'service_role')).rows.some(r=>r.nom===nom));
   // Retirar-lo de nou la torna a encuar; una reclamació en curs o un objecte ja esborrat conserven la guarda.
   await actor(db,OWNER,c=>revokeNote(c,9301,ack.nota_revision,9304));
   assert.deepEqual(await fila(),{referenciat:false,intents:0});
   await db.query("update public.cua_purga_storage_ugc set intents=1,ultim_intent_al=now() where bucket_id='mitjans' and nom=$1",[nom]);
   await assert.rejects(puja(),error('55000','SDP-PURGA-004'));
   await db.query("update public.cua_purga_storage_ugc set intents=0,ultim_intent_al=null where bucket_id='mitjans' and nom=$1",[nom]);
   await db.query("delete from storage.objects where bucket_id='mitjans' and name=$1",[nom]);
   await assert.rejects(puja(),error('55000','SDP-PURGA-004'));
  });
  await t.test('canviar de secció un acte propi fora de la finestra dona SDP-SEC-002; un acte alié continua com absent',async()=>{
   // R22 (notes-05) · El codi que reconeix esRebuigDeSeccio, no SDP-MUR-OWNER.
   await note(db,9400);const a=result(await actor(db,OWNER,c=>publish(c,9400,9401)));
   const envelope={title:'Canvi',content:'<p>Cos</p>',status:'published',visibility:'public'};
   await assert.rejects(actor(db,OWNER,c=>c.query("select public.publica_nota_al_mur($1,$2,'mercat',$3,$4,$5)",[id(9400),id(9401),envelope,a.nota_revision,id(9402)])),error('22023','SDP-SEC-002'));
   assert.equal((await db.query('select section_id from public.section_submissions where id=$1',[id(9401)])).rows[0].section_id,'mur');
   await note(db,9403,{owner:OTHER});
   await assert.rejects(actor(db,OTHER,c=>c.query("select public.publica_nota_al_mur($1,$2,'mercat',$3,1,$4)",[id(9403),id(9401),envelope,id(9404)])),error('42501','SDP-MUR-OWNER'));
   await actor(db,OWNER,c=>revokeNote(c,9400,a.nota_revision,9401));
  });
  await t.test('rutes de còpia exactes i escapades no confonen prefixos ni borren fitxers aliens',async()=>{
   assert.equal((await db.query("select private.mur_cita_objecte($1,'mitjans',$2) as ok",[{image:'https://example.invalid/mitjans/a.webp-extra'},'a.webp'])).rows[0].ok,false);
   assert.equal((await db.query("select private.mur_cita_objecte($1,'mitjans',$2) as ok",[{image:'https://example.invalid/mitjans/imatge%20prova.webp'},'imatge prova.webp'])).rows[0].ok,true);
   assert.equal((await db.query("select private.mur_cita_objecte($1,'mitjans',$2) as ok",[{image:'https://example.invalid/notmitjans/a.webp'},'a.webp'])).rows[0].ok,false);
  });
  await t.test('redactor amb 90k caràcters i 5000 scripts conserva tot el text intermedi',async()=>{
   const input='<script>x</script>T'.repeat(5000);const start=performance.now();
   const out=(await db.query('select private.mur_text_public($1) as v',[input])).rows[0].v;
   assert.equal(out,'T'.repeat(5000));t.diagnostic(`mur_text_public 90k / 5000 scripts: ${Math.round(performance.now()-start)}ms`);
  });
  await t.test('redactor lineal: 100k caràcters de text pla i milers de dates sense cost quadràtic',async()=>{
   // R22 (sql-05) · Una fila de llig_mur_public crida el redactor tres vegades.
   const pla='Fira de tardor a la plaça major amb música i coca. '.repeat(1960);
   const temps=[];
   for(let i=0;i<3;i++){
    const start=performance.now();
    assert.equal((await db.query('select private.mur_text_public($1) as v',[pla])).rows[0].v,pla);
    temps.push(performance.now()-start);
   }
   const millor=Math.min(...temps);t.diagnostic(`mur_text_public 100k text pla: ${temps.map(Math.round).join('/')}ms`);
   // El millor de tres absorbix pics de càrrega: el bucle quadràtic anterior no baixava de ~280 ms per crida.
   assert.ok(millor<200,`100k de text pla: la crida més ràpida ha tardat ${Math.round(millor)}ms`);
   const dates='2026-11-12 '.repeat(9000);
   assert.equal((await db.query('select private.mur_text_public($1) as v',[dates])).rows[0].v,dates);
  });
  await t.test('Node 0 publica una nota atòmicament i consulta el rebut sense incrementar revisió',async()=>{
   await note(db,7350);
   const descriptor={id:id(7351),sectionId:'mur',title:'Node 0 publicació',payload:{content:'Cos Node 0',status:'published',visibility:'public'},noteId:id(7350),expectedNoteRevision:1,operationId:id(7352)};
   const query=compilaOperacioNodeZero('appendSectionSubmissionNetworkOnly',{submission:descriptor},TOWN);
   const r=await actor(db,OWNER,c=>c.query(query));const response=Object.values((Array.isArray(r)?r.at(-1):r).rows[0])[0];
   assert.equal(response.status,200);assert.equal(response.body.publicacio.id,id(7351));assert.equal(response.body.nota_revision,2);
   const probe=compilaOperacioNodeZero('appendSectionSubmissionNetworkOnly',{submission:{...descriptor,consulta:true}},TOWN);
   const p=await actor(db,OWNER,c=>c.query(probe));const ack=Object.values((Array.isArray(p)?p.at(-1):p).rows[0])[0];
   assert.equal(ack.body.replay,true);assert.equal(ack.body.nota_revision,2);
   await assert.rejects(actor(db,OTHER,c=>c.query(query)),error('42501'));
  });
  await t.test('PATCH status arxivada real retira i restaurar no ressuscita; exigeix UUID nou',async()=>{
   await note(db,7360);await actor(db,OWNER,c=>publish(c,7360,7361));
   const n=(await actor(db,OWNER,c=>c.query("update public.notes set status='arxivada' where id=$1 returning status,is_published,published_submission_id",[id(7360)]))).rows[0];
   assert.deepEqual(n,{status:'arxivada',is_published:false,published_submission_id:null});
   const probe=result(await actor(db,OWNER,c=>c.query("select public.publica_nota_al_mur($1,$2,'mur',null,1,$3) as result",[id(7360),id(7361),id(107361)])));
   assert.equal(probe.retirada,true);assert.equal(probe.publicacio,null);assert.equal(probe.publicada_revision,2);
   assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=$1',[id(7361)])).rows[0].n,0);
   await actor(db,OWNER,c=>c.query("update public.notes set status='activa' where id=$1",[id(7360)]));
   const revision=(await db.query('select revision from public.notes where id=$1',[id(7360)])).rows[0].revision;
   await assert.rejects(actor(db,OWNER,c=>publish(c,7360,7361,revision)),error('23514','SDP-MUR-REVOKED'));
   await actor(db,OWNER,c=>publish(c,7360,7362,revision));
  });
  await t.test('cua legacy anterior al PATCH paperera rep ACK i mai retira l’acte nou',async()=>{
   await note(db,7370);await actor(db,OWNER,c=>publish(c,7370,7371));
   await actor(db,OWNER,c=>c.query("update public.notes set status='paperera' where id=$1",[id(7370)]));
   assert.equal((await actor(db,OWNER,c=>c.query('select public.revoca_publicacio_de_nota($1,$2,2) as ok',[id(7370),TOWN]))).rows[0].ok,true);
   await actor(db,OWNER,c=>c.query("update public.notes set status='activa' where id=$1",[id(7370)]));
   const revision=(await db.query('select revision from public.notes where id=$1',[id(7370)])).rows[0].revision;
   await actor(db,OWNER,c=>publish(c,7370,7372,revision));
   assert.equal((await actor(db,OWNER,c=>c.query('select public.revoca_publicacio_de_nota($1,$2,2) as ok',[id(7370),TOWN]))).rows[0].ok,true);
   assert.equal((await db.query('select published_submission_id from public.notes where id=$1',[id(7370)])).rows[0].published_submission_id,id(7372));
  });
  await t.test('compartició de perfil antiga no projecta títol ni resum privats a anon',async()=>{
   await submission(db,7380,{title:'NOM DE PERFIL PRIVAT',payload:{type:'compartit',origen:{objecte:'persona',sectionId:'perfil',autorNom:'AUTOR PRIVAT',autorId:OTHER},content:'Body autocitat'}});
   await db.query("update public.section_submissions set description='RESUM PRIVAT AUTOCITAT' where id=$1",[id(7380)]);
   const row=(await actor(db,null,pub)).rows.find(r=>r.id===id(7380));
   assert.equal(row.title,'Recurs compartit');assert.equal(row.description,'');assert.equal(row.public_content,'');
  });
  await t.test('baixa pendent degrada lectura rica i no pot publicar nou acte',async()=>{
   await note(db,7390,{owner:OTHER});
   await db.query('update public.profiles set baixa_demanada_at=now() where id=$1',[OTHER]);
   const row=result(await actor(db,OTHER,rich));assert.equal(row.lectura,'public');assert.doesNotMatch(JSON.stringify(row),/owner_user_id/);
   await assert.rejects(actor(db,OTHER,c=>publish(c,7390,7391)),error('42501'));
   await db.query('update public.profiles set baixa_demanada_at=null where id=$1',[OTHER]);
  });
  await t.test('ACK perdut després d’edició privada separa revisió CAS actual de revisió publicada',async()=>{
   await note(db,7395);await actor(db,OWNER,c=>publish(c,7395,7396));
   await actor(db,OWNER,c=>c.query("update public.notes set content='ESBORRANY NO PUBLICAT' where id=$1",[id(7395)]));
   const ack=result(await actor(db,OWNER,c=>c.query("select public.publica_nota_al_mur($1,$2,'mur',null,1,$3) as result",[id(7395),id(7396),id(107396)])));
   assert.equal(ack.nota_revision,3);assert.equal(ack.publicada_revision,2);assert.equal(ack.publicacio.payload.content,'<p>Cos públic</p>');
   const edit=result(await actor(db,OWNER,c=>publish(c,7395,7396,3,7397,{content:'Edició publicada després'})));
   assert.equal(edit.publicada_revision,4);assert.equal(edit.nota_revision,4);
  });
  await t.test('legacy compartit no divulga autoria ni abast originals en RPC rica ni SELECT cru',async()=>{
   const manual='<p>Text manual conservat. Copyright personal.</p>';
   await submission(db,7398,{payload:{type:'compartit',origen:{tipus:'connexio',objecte:'publicacio',sectionId:'mur',itemId:'origen-public',titol:'Recurs',ruta:'/mur/origen-public',autorNom:'ORIGINAL PRIVAT',autorId:OUTSIDER,abast:{persones:[OUTSIDER]},grups:['grup-privat'],persones:[OUTSIDER]},content:'<p>Compartit des del Mur de ORIGINAL PRIVAT: <a href="/mur/origen-public">Recurs</a>.</p>'+manual,copyright:'Drets manuals'}});
   const sqlRaw=(await actor(db,OTHER,c=>c.query('select owner_user_id,payload from public.section_submissions where id=$1',[id(7398)]))).rows[0];
   const rpc=result(await actor(db,OTHER,c=>rich(c,TOWN,[id(7398)]))).files[0];
   for(const r of [sqlRaw,rpc]){
    assert.equal(r.owner_user_id,OWNER);assert.doesNotMatch(JSON.stringify(r.payload),/ORIGINAL PRIVAT|autorNom|autorId|abast|grup-privat|persones/);
    assert.equal(r.payload.content,'<p>Recurs compartit.</p>'+manual);assert.equal(r.payload.copyright,'Drets manuals');
   }
   // Reproduïm una fila preexistent anterior a la porta, després reapliquem.
   await db.query('alter table public.section_submissions disable trigger sdp_mur_saneja_compartit');
   await submission(db,7399,{title:'NOM PRIVAT ANTIC',payload:{type:'compartit',origen:{tipus:'connexio',objecte:'persona',sectionId:'perfil',autorNom:'NOM PRIVAT ANTIC'},content:'<p>Element connectat des del Perfil de NOM PRIVAT ANTIC: <strong>Perfil</strong>.</p>'+manual}});
   await db.query('alter table public.section_submissions enable trigger sdp_mur_saneja_compartit');
   await db.query(read(`supabase/migrations/${MIGRATION}`));
   const backfill=(await db.query('select title,payload from public.section_submissions where id=$1',[id(7399)])).rows[0];
   assert.equal(backfill.title,'Perfil compartit');assert.equal(backfill.payload.origen.titol,undefined);
   assert.doesNotMatch(JSON.stringify(backfill),/NOM PRIVAT ANTIC|autorNom/);assert.match(backfill.payload.content,/Text manual conservat/);
  });
  await t.test('backfill legacy signat per entitat preserva M18 amb JWT d’un Foraster',async()=>{
   const org=result(await actor(db,OWNER,c=>c.query("select public.create_organization($1,'company','Entitat legacy','entitat-legacy-v2') as result",[TOWN])));
   await db.query('alter table public.section_submissions disable trigger sdp_mur_saneja_compartit');
   await submission(db,7394,{payload:{type:'compartit',origen:{tipus:'connexio',objecte:'publicacio',autorNom:'NOM PRIVAT LEGACY'},content:'<p>Compartit des del Mur de NOM PRIVAT LEGACY: <strong>Recurs</strong>.</p><p>Manual</p>'}});
   await actor(db,OWNER,c=>c.query('update public.section_submissions set author_org_id=$2 where id=$1',[id(7394),org.id]));
   await db.query('alter table public.section_submissions enable trigger sdp_mur_saneja_compartit');
   const before=(await db.query("select pg_get_constraintdef(oid) as d,convalidated from pg_constraint where conrelid='public.section_submissions'::regclass and conname='section_submissions_autoria_org_valida'")).rows[0];
   await db.query("select set_config('request.jwt.claim.sub',$1,false)",[OUTSIDER]);
   await db.query(read(`supabase/migrations/${MIGRATION}`));
   const after=(await db.query("select pg_get_constraintdef(oid) as d,convalidated from pg_constraint where conrelid='public.section_submissions'::regclass and conname='section_submissions_autoria_org_valida'")).rows[0];
   assert.deepEqual(after,before);
   const row=(await db.query('select author_org_id,payload from public.section_submissions where id=$1',[id(7394)])).rows[0];
   assert.equal(row.author_org_id,org.id);assert.doesNotMatch(JSON.stringify(row.payload),/NOM PRIVAT LEGACY|autorNom/);assert.match(row.payload.content,/<p>Manual<\/p>/);
   await submission(db,7393,{owner:OTHER});
   await assert.rejects(actor(db,OTHER,c=>c.query('update public.section_submissions set author_org_id=$2 where id=$1',[id(7393),org.id])),e=>['42501','23514'].includes(e.code));
  });
  await t.test('esborrat directe d’Auth: l’original privat <poble>/<uid>/notes/<uuid> de mitjans_privats que la nota pròpia cita es purga',async()=>{
   // R22 ronda 4 (P2) · La forma <poble>/<uid>/notes/<uuid>.<ext> només és una còpia pública al bucket 'mitjans'.
   // uploadToStorage puja amb eixe mateix nom l'ORIGINAL privat de Notes a 'mitjans_privats', i la nota el cita.
   // Un esborrat d'Auth sense private.baixes (tauler o auth.admin.deleteUser) l'ha d'encuar sense referència.
   const PRIVADA='22000000-0000-4000-8000-000000000025';
   const nom=`${TOWN}/${PRIVADA}/notes/${id(9801)}.jpg`,ref=`sdp-media://mitjans_privats/${nom}`;
   const referencia=bucket=>db.query('select private.referencia_storage_ugc($1,$2,$3) as v',[bucket,nom,PRIVADA]).then(r=>r.rows[0].v);
   await db.query("insert into storage.buckets(id,name,public) values('mitjans_privats','mitjans_privats',false) on conflict(id) do nothing");
   await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[PRIVADA,`${PRIVADA}@example.invalid`,{full_name:'AUTORA_PRIVADA_NOTES',tenant_id:TOWN,accepta_rgpd:true}]);
   await db.query("insert into storage.objects(id,bucket_id,name,owner,owner_id,version) values($1,'mitjans_privats',$2,$3::uuid,$3::uuid::text,'v1')",[id(9801),nom,PRIVADA]);
   await db.query("select set_config('request.jwt.claim.sub',$1,false)",[PRIVADA]);
   await db.query('insert into public.notes(id,tenant_id,owner_user_id,title,content,hero_image) values($1,$2,$3,$4,$5,$6)',
    [id(9800),TOWN,PRIVADA,'Nota amb foto privada',`<p><img src="${ref}"></p>`,ref]);
   assert.equal(await referencia('mitjans_privats'),false);
   await db.query('delete from auth.users where id=$1',[PRIVADA]);
   assert.deepEqual((await db.query("select user_id,referenciat from public.cua_purga_storage_ugc where bucket_id='mitjans_privats' and nom=$1",[nom])).rows,
    [{user_id:PRIVADA,referenciat:false}]);
   const reclamats=(await actor(db,null,c=>c.query('select * from public.purga_fitxers_reclama(50)'),'service_role')).rows;
   assert.ok(reclamats.some(r=>r.bucket_id==='mitjans_privats'&&r.nom===nom),'el worker reclama l’original privat');
   await db.query('delete from public.notes where id=$1',[id(9800)]);
  });
  await t.test('baixa Auth deslliga owner de totes les constàncies sense ressuscitar actes',async()=>{
   await submission(db,8000,{owner:OUTSIDER,town:TOWN2});
   await actor(db,OUTSIDER,c=>c.query('select public.revoca_publicacio_mur($1,$2)',[id(8000),TOWN2]));
   await note(db,8001,{owner:OUTSIDER,town:TOWN2});
   await actor(db,OUTSIDER,c=>publish(c,8001,8002));
   await actor(db,OUTSIDER,c=>c.query('select public.revoca_publicacio_de_nota($1,$2,2,$3)',[id(8001),TOWN2,id(8002)]));
   // R22 · Els bloquejos opacs cauen amb l'autoria i amb qui bloqueja, sense files òrfenes.
   const TEMPORAL='22000000-0000-4000-8000-000000000024';
   await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[TEMPORAL,`${TEMPORAL}@example.invalid`,{full_name:'AUTORA_TEMPORAL',tenant_id:TOWN,accepta_rgpd:true}]);
   await actor(db,TEMPORAL,c=>c.query("select public.accepta_normes_convivencia('2026-10-24')"));
   await submission(db,8100,{owner:TEMPORAL});
   for(const n of [1,8100])await actor(db,OUTSIDER,c=>c.query('select public.bloqueja_publicacio_mur($1)',[id(n)]));
   assert.equal((await db.query('select count(*)::int n from public.bloquejos where bloquejador=$1',[OUTSIDER])).rows[0].n,2);
   await db.query('delete from public.section_submissions where id=$1',[id(8100)]);
   await db.query('delete from auth.users where id=$1',[TEMPORAL]);
   assert.deepEqual((await db.query('select publicacio_id from public.bloquejos where bloquejador=$1',[OUTSIDER])).rows,[{publicacio_id:id(1)}]);
   await db.query('delete from auth.users where id=$1',[OUTSIDER]);
   for(const table of ['public.bloquejos','private.mur_bloquejos_opacs'])assert.equal((await db.query(`select count(*)::int n from ${table} where bloquejador=$1`,[OUTSIDER])).rows[0].n,0,table);
   for(const table of ['mur_publicacions_revocades','mur_revocacions_notes','mur_actes_notes','mur_operacions_notes']){
    assert.equal((await db.query(`select count(*)::int n from private.${table} where owner_user_id=$1`,[OUTSIDER])).rows[0].n,0,table);
   }
   for(const table of ['mur_actes_notes','mur_operacions_notes'])assert.equal((await db.query(`select count(*)::int n from private.${table} where act_id=$1 and note_id is not null`,[id(8002)])).rows[0].n,0,table);
   assert.equal((await db.query('select owner_user_id from private.mur_publicacions_revocades where submission_id=$1',[id(8000)])).rows[0].owner_user_id,null);
   await assert.rejects(submission(db,8000,{owner:OWNER}),error('23514','SDP-MUR-REVOKED'));
  });
 }finally{await cluster.close();}
});

/* Gauntlet R22 (dades-01, honestedat-03) · El client v1.2.0 build 5 (web, connector WordPress 1.1.14 i botigues)
   només es publica amb tota la cadena del Mur R21 aplicada. Ho diuen la porta d'ordre_desplegament.json, la
   restricció que l'ordre alfabètic cru no expressa i el README, amb fletxes que el verificador comprova. */
test('dades-01 · la cadena del Mur R21 va abans del client v1.2.0 build 5 (porta, restricció i README)',()=>{
 const CADENA=['2611110100','2611111735','2611112149','2611121430','2611121850','2611122200','20261113003000'],PORTA='client-v1-2-0-build-5-mur-r21';
 const versions=readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(f=>/^(\d{10}|\d{14})_[a-z0-9_]+\.sql$/.test(f)).map(f=>f.split('_')[0]);
 const ordre=llegixOrdre(read('supabase/ordre_desplegament.json'),new Set(versions));
 const porta=ordre.portes.find(p=>p.id===PORTA);
 assert.ok(porta,`falta la porta ${PORTA}`);
 assert.deepEqual([porta.tipus,porta.despres,porta.abans],['client',CADENA,[]]);
 assert.match(porta.descripcio,/v1\.2\.0 build 5/);assert.match(porta.descripcio,/WordPress 1\.1\.14/);
 assert.ok(ordre.restriccions.some(r=>r.abans==='2611122200'&&r.despres==='20261113003000'));
 const pla=ordena({versions,restriccions:ordre.restriccions,portes:ordre.portes});
 assert.deepEqual(pla.errors,[]);
 const pos=new Map(pla.ordre.map((x,i)=>[`${x.tipus}:${x.id}`,i]));
 for(let i=1;i<CADENA.length;i++)assert.ok(pos.get(`migracio:${CADENA[i-1]}`)<pos.get(`migracio:${CADENA[i]}`),`${CADENA[i-1]} → ${CADENA[i]}`);
 assert.ok(pos.get('migracio:20261113003000')<pos.get(`porta:${PORTA}`));
 const readme=llegixReadme(read('supabase/README.md'));
 for(let i=1;i<CADENA.length;i++)assert.ok(readme.cadenes.some(c=>c.abans===CADENA[i-1]&&c.despres===CADENA[i]),`README: ${CADENA[i-1]} → ${CADENA[i]}`);
 for(const fitxer of ['2611121430_mur_foraster_projeccio_publica_opcio_a.sql','2611122200_mur_membres_i_actes_v2.sql']){
  assert.match(readme.bullets.find(b=>b.fitxer===fitxer).text,/abans de publicar el client/,fitxer);
 }
});
