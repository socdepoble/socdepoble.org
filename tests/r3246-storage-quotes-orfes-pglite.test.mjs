import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {creaBaseR3246,asClient,catalogueR3246,eviR3246} from './fixtures/r3246-catalogue-pglite.mjs';
import {sid,STOWN,SA,SB,SO,SF,sembraStorageR3246} from './fixtures/r3246-storage-casos.mjs';
const denied=code=>e=>e.code===code;

test('R32.46 · Storage, quota i purga amb catàleg complet efímer',async t=>{
 const pg=await creaBaseR3246(),cases=[];
 const actor=(uid,sql,args=[],role=uid?'authenticated':'anon')=>asClient(pg,{uid,role},sql,args);
 const quota=uid=>actor(uid,'select public.xat_quota() as q').then(r=>r[0].q);
 const reserve=(uid,id,bytes=64,duration=60000)=>actor(uid,'select public.xat_reserva_adjunt($1,$2,$3,$4,$5) as q',[id,SF,bytes,'video/mp4',duration]);
 const upload=(id,uid,{owner=uid,ownerId=uid,bytes=64}={})=>pg.query("insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata) values('xat_adjunts',$1,$2,$3,'fixture-v1',$4) returning id",[id,owner,ownerId,{size:bytes,mimetype:'video/mp4'}]);
 const publish=(uid,id)=>actor(uid,'select public.xat_publica_adjunt($1,$2,null,$3::jsonb) as q',[id,'Vídeo local',{lat:38.64123,lng:-0.49123}]);
 const record=(id,objects)=>cases.push({id,objects,status:'executed'});
 const sha=s=>createHash('sha256').update(s).digest('hex');
 const migrationUrl=new URL('../supabase/migrations/20261123010000_r3246_quota_owner_id.sql',import.meta.url);
 const migration=fs.readFileSync(migrationUrl,'utf8');
 let migrationVerification;
 try{
  await sembraStorageR3246(pg);const c=await catalogueR3246(pg);
  await t.test('M01 · migració real idempotent i metadades de funció conservades',async()=>{
   // v1.2.25 · K-C1-SQL. Motiu: 20261125010000 (C1) redefinix després private.xat_neteja_adjunts
   // amb la protecció LSSI (cos guardat per hash), de manera que R32.46 ja no n'és l'últim escriptor
   // en el catàleg complet. La prova de R32.46 no s'afluixa: corre sencera, amb el mateix hash
   // f512f5ec…, sobre el catàleg fins a 20261123010000. Al catàleg complet es comprova a banda que
   // C1 conserva l'expressió owner_id de R32.46. Abans, la fallada d'esta prova deixava instal·lat el
   // cos antic i O02, O03 i Q04 fallaven en cascada.
   const complet=pg,r3246=await creaBaseR3246({throughVersion:'20261123010000'});
   let correctedR3246;
   try{correctedR3246=await (async pg=>{
   const metadata=async()=>(await pg.query("select oid,proowner,proacl::text as acl,proconfig,prosecdef,provolatile,pg_get_function_identity_arguments(oid) as args,pg_get_function_result(oid) as result from pg_proc where oid='private.xat_neteja_adjunts(integer)'::regprocedure")).rows[0];
   const definition=async()=>(await pg.query("select pg_get_functiondef('private.xat_neteja_adjunts(integer)'::regprocedure) as sql")).rows[0].sql;
   const final=await definition(),beforeMetadata=await metadata();
   const old="coalesce(o.owner, '00000000-0000-0000-0000-000000000000'::uuid)";
   const corrected="coalesce(case when o.owner_id ~ '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$' then o.owner_id::uuid end, o.owner, '00000000-0000-0000-0000-000000000000'::uuid)";
   assert.equal(final.split(corrected).length,2);
   // Precondició anterior en la mateixa DB efímera; s'aplica el fitxer real.
   const legacy=final.replace(corrected,()=>old);await pg.exec(legacy);
   assert.equal(sha(await definition()),'f512f5ec5f14cbaa9c49ad1e9d71185b6cf4b1c9c70b2c540393228160d16a70');
   await pg.exec(migration);assert.equal(await definition(),final);assert.deepEqual(await metadata(),beforeMetadata);
   await pg.exec(migration);assert.equal(await definition(),final);assert.deepEqual(await metadata(),beforeMetadata);
   // La guarda rebutja una definició divergent i no en canvia el cos.
   const divergent=final.replace('v_fetes integer := 0','v_fetes integer := 1');await pg.exec(divergent);
   await assert.rejects(pg.exec(migration),e=>e.code==='55000'&&/SDP-R3246-001/.test(e.message));
   await pg.exec('rollback');assert.equal(await definition(),divergent);await pg.exec(final);
   migrationVerification={file:migrationUrl.pathname,sha256:sha(migration),legacyDefinitionSha256:sha(legacy),finalDefinitionSha256:sha(final),applications:2,metadataPreserved:true,divergenceRejected:true};
   record('M01',['private.xat_neteja_adjunts']);
   return corrected;
   })(r3246);}finally{await r3246.close();}
   const finalComplet=(await complet.query("select pg_get_functiondef('private.xat_neteja_adjunts(integer)'::regprocedure) as sql")).rows[0].sql;
   assert.equal(finalComplet.split(correctedR3246).length,2,'El catàleg complet conserva l’atribució owner_id de R32.46.');
   migrationVerification.catalogueThroughVersion='20261123010000';
  });
  await t.test('S01 · tots els buckets reals, límits i ACL sense DDL de client',async()=>{
   assert.deepEqual(c.buckets.map(b=>b.id),['mitjans','mitjans_privats','xat_adjunts']);
   for(const b of c.buckets){assert(Number(b.file_size_limit)>0);assert(Array.isArray(b.allowed_mime_types)&&b.allowed_mime_types.length);if(b.id!=='mitjans')assert.equal(b.public,false);}
   for(const rel of c.tables.filter(x=>x.schema==='storage'))for(const role of ['anon','authenticated'])for(const privilege of ['truncate','references','trigger'])assert.equal(rel.effective[role][privilege],false);
   record('S01',c.buckets.map(b=>'bucket:'+b.id));
  });
  const pub=`${STOWN}/${SA}/mur/${sid(100)}.webp`,priv=`${STOWN}/${SA}/notes/${sid(101)}.pdf`;
  await t.test('S02 · pujades legítimes i lectures privades d’altri denegades',async()=>{
   for(const[bucket,name,mime]of[['mitjans',pub,'image/webp'],['mitjans_privats',priv,'application/pdf']]){
    const rows=await actor(SA,"insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata) values($1,$2,$3::text::uuid,$3::text,'v1',$4) returning id",[bucket,name,SA,{size:128,mimetype:mime}]);assert.equal(rows.length,1);
    assert.equal((await actor(SA,'select name from storage.objects where bucket_id=$1 and name=$2',[bucket,name])).length,1);
    assert.equal((await actor(SB,'select name from storage.objects where bucket_id=$1 and name=$2',[bucket,name])).length,0);
    await assert.rejects(actor(null,'select name from storage.objects where bucket_id=$1 and name=$2',[bucket,name]),denied('42501'));
    assert.equal((await actor(SB,"update storage.objects set version='alterada' where bucket_id=$1 and name=$2 returning id",[bucket,name])).length,0);
    assert.equal((await pg.query('select version from storage.objects where bucket_id=$1 and name=$2',[bucket,name])).rows[0].version,'v1');
   }
   record('S02',['storage.objects','bucket:mitjans','bucket:mitjans_privats']);
  });
  await t.test('S03 · mitjans: MIME i mida també validats en move',async()=>{
   await assert.rejects(pg.query("insert into storage.objects(bucket_id,name,owner,owner_id,metadata) values('mitjans',$1,$2::text::uuid,$2::text,$3)",[pub+'bad',SA,{size:128,mimetype:'video/mp4'}]),e=>/SDP-MITJANS-001/.test(e.message));
   await assert.rejects(pg.query("insert into storage.objects(bucket_id,name,owner,owner_id,metadata) values('mitjans',$1,$2::text::uuid,$2::text,$3)",[pub+'big',SA,{size:5242881,mimetype:'image/webp'}]),e=>/SDP-MITJANS-002/.test(e.message));
   await assert.rejects(pg.query("update storage.objects set bucket_id='mitjans' where bucket_id='mitjans_privats' and name=$1",[priv]),e=>/SDP-MITJANS-001/.test(e.message));
   assert.equal((await pg.query('select bucket_id from storage.objects where name=$1',[priv])).rows[0].bucket_id,'mitjans_privats');record('S03',['storage.objects','private.mitjans_public_nomes_imatges()']);
  });
  await t.test('S04 · nou bucket no s’obri amb una política permissiva',async()=>{
   await pg.query("insert into storage.buckets(id,name,public) values('r3246_legacy','r3246_legacy',true)");
   await pg.query("insert into storage.objects(bucket_id,name,owner,owner_id) values('r3246_legacy','legacy',$1::text::uuid,$1::text)",[SA]);
   await pg.exec('create policy r3246_permissiva on storage.objects for all to public using(true) with check(true)');
   try{
    for(const who of [SA,SB])assert.equal((await actor(who,"select id from storage.objects where bucket_id='r3246_legacy'")).length,0);
    await assert.rejects(actor(null,"select id from storage.objects where bucket_id='r3246_legacy'"),denied('42501'));
    await assert.rejects(actor(SA,"insert into storage.objects(bucket_id,name,owner,owner_id) values('r3246_legacy','nova',$1::text::uuid,$1::text)",[SA]),denied('42501'));
   }finally{await pg.exec('drop policy r3246_permissiva on storage.objects');}
   record('S04',['storage.objects','storage.buckets']);
  });
  const normal=sid(200);
  await t.test('Q01 · reserva, upload owner_id i publicació amb control positiu',async()=>{
   await reserve(SA,normal);await upload(normal,SA,{owner:null});
   for(const who of [null,SO])await assert.rejects(reserve(who,sid(who?201:202)),denied('42501'));
   await assert.rejects(publish(SB,normal),denied('42501'));
   const ack=(await publish(SA,normal))[0].q;assert.equal(ack.metadades.adjunt.id,normal);assert.deepEqual(ack.metadades.ubicacio,{lat:38.64,lng:-0.49});
   assert.deepEqual((await publish(SA,normal))[0].q,ack);
   assert.equal((await quota(SA)).usats,64);record('Q01',['public.xat_reserva_adjunt','public.xat_publica_adjunt','private.xat_escriptura_final()','public.xat_adjunts','public.xat_missatges']);
  });
  await t.test('S05 · adjunt publicat llegible pels participants i sense llistat ni canvi',async()=>{
   for(const who of [SA,SB])assert.equal((await actor(who,"select name from storage.objects where bucket_id='xat_adjunts' and name=$1",[normal])).length,1);
   assert.equal((await actor(SO,"select name from storage.objects where bucket_id='xat_adjunts' and name=$1",[normal])).length,0);
   await assert.rejects(actor(null,"select name from storage.objects where bucket_id='xat_adjunts' and name=$1",[normal]),denied('42501'));
   for(const operation of ['storage.object.list','storage.object.list_v2','storage.s3.object.list']){
    await pg.query("select set_config('storage.operation',$1,false)",[operation]);
    try{assert.equal((await actor(SA,"select name from storage.objects where bucket_id='xat_adjunts'")).length,0);}
    finally{await pg.query("select set_config('storage.operation','',false)");}
   }
   for(const who of [SA,SB]){
    assert.equal((await actor(who,"update storage.objects set version='changed' where bucket_id='xat_adjunts' and name=$1 returning id",[normal])).length,0);
    assert.equal((await actor(who,"delete from storage.objects where bucket_id='xat_adjunts' and name=$1 returning id",[normal])).length,0);
   }
   assert.equal((await pg.query("select version from storage.objects where bucket_id='xat_adjunts' and name=$1",[normal])).rows[0].version,'fixture-v1');
   record('S05',['storage.objects','private.xat_llegible_adjunt','public.xat_adjunts']);
  });
  await t.test('Q03 · confirmació estricta i cancel·lació sense objectes tardans',async()=>{
   const id=sid(240),cancelled=sid(241),before=(await quota(SA)).usats;
   await reserve(SA,id);
   for(const change of [{ownerId:SB},{bytes:65}])await assert.rejects(upload(id,SA,change),e=>e.code==='22023'&&/SDP-XAT-021/.test(e.message));
   await assert.rejects(publish(SA,id),e=>e.code==='22023'&&/SDP-XAT-021/.test(e.message));
   assert.equal((await pg.query("select count(*)::int as n from storage.objects where bucket_id='xat_adjunts' and name=$1",[id])).rows[0].n,0);
   assert.equal((await actor(SA,'select public.xat_cancella_reserva($1) as ok',[id]))[0].ok,true);
   await assert.rejects(upload(id,SA),e=>e.code==='22023'&&/SDP-XAT-021/.test(e.message));
   await reserve(SA,cancelled);await upload(cancelled,SA);
   assert.equal((await actor(SA,'select public.xat_cancella_reserva($1) as ok',[cancelled]))[0].ok,false);
   assert.equal((await quota(SA)).usats,before+64);
   await actor(SA,'select public.xat_prepara_descart($1)',[cancelled]);
   await assert.rejects(publish(SA,cancelled),denied('42501'));
   await assert.rejects(upload(cancelled,SA),e=>e.code==='22023'&&/SDP-XAT-021/.test(e.message));
   assert.equal((await actor(SA,"delete from storage.objects where bucket_id='xat_adjunts' and name=$1 returning id",[cancelled])).length,1);
   assert.equal((await actor(SA,'select public.xat_cancella_reserva($1) as ok',[cancelled]))[0].ok,true);
   assert.equal((await quota(SA)).usats,before);
   record('Q03',['private.xat_escriptura_final()','public.xat_cancella_reserva','public.xat_prepara_descart','public.xat_publica_adjunt','storage.objects']);
  });
  await t.test('Q02 · límits exactes, rebutjos i cap reserva parcial',async()=>{
   for(const [n,bytes,duration]of[[210,20000001,60000],[211,64,60001],[212,64,0]])await assert.rejects(reserve(SA,sid(n),bytes,duration));
   assert.equal((await pg.query('select count(*)::int as n from public.xat_adjunts where id=any($1::uuid[])',[[210,211,212].map(sid)])).rows[0].n,0);
   await reserve(SB,sid(213),20000000,60000);await reserve(SB,sid(213),20000000,60000);
   assert.equal((await quota(SB)).usats,20000000);await assert.rejects(reserve(SB,sid(213),20000000,59999));record('Q02',['public.xat_reserva_adjunt','public.xat_quota','public.xat_adjunts']);
  });
  const pending=sid(220);
  await t.test('O01 · bytes pendents no s’alliberen abans de la purga confirmada',async()=>{
   await reserve(SA,pending);await upload(pending,SA);await pg.query('delete from public.xat_adjunts where id=$1',[pending]);
   assert.equal((await quota(SA)).usats,128);
   const queue=(await pg.query('select id,user_id from private.purga_storage_pendent where nom=$1',[pending])).rows[0];assert.equal(queue.user_id,SA);
   for(const who of [SA,null])await assert.rejects(actor(who,'select public.purga_fitxers_reclama(50)'),denied('42501'));
   const work=await actor(null,'select * from public.purga_fitxers_reclama(50)',[],'service_role');assert(work.some(x=>x.nom===pending));
   assert.equal((await actor(null,'select public.purga_fitxers_fets($1::bigint[]) as n',[[queue.id]],'service_role'))[0].n,0);
   assert.equal((await quota(SA)).usats,128);
   await pg.query("delete from storage.objects where bucket_id='xat_adjunts' and name=$1",[pending]);
   assert.equal((await actor(null,'select public.purga_fitxers_fets($1::bigint[]) as n',[[queue.id]],'service_role'))[0].n,1);
   assert.equal((await quota(SA)).usats,64);record('O01',['private.purga_storage_pendent','public.purga_fitxers_reclama','public.purga_fitxers_fets','private.xat_bytes_en_purga','storage.objects']);
  });
  await t.test('O02 · residu històric owner NULL conserva owner_id en cua i quota',async()=>{
   const orphan=sid(230);await reserve(SB,orphan);await upload(orphan,SB,{owner:null});
   // Simulem una restauració històrica incompleta. Cap rol client pot desactivar el trigger.
   await pg.query("update storage.objects set created_at=now()-interval '2 hours' where bucket_id='xat_adjunts' and name=$1",[orphan]);
   await pg.exec('alter table public.xat_adjunts disable trigger xat_adjunt_a_purga');
   try{await pg.query('delete from public.xat_adjunts where id=$1',[orphan]);}finally{await pg.exec('alter table public.xat_adjunts enable trigger xat_adjunt_a_purga');}
   await pg.query('select private.xat_neteja_adjunts(500)');
   const row=(await pg.query('select user_id from private.purga_storage_pendent where nom=$1',[orphan])).rows[0];
   assert.equal(row.user_id,SB,'La identitat canònica owner_id del residu ha de conservar-se.');
   assert.equal((await quota(SB)).usats,20000064);record('O02',['private.xat_neteja_adjunts','private.xat_bytes_en_purga','private.purga_storage_pendent','storage.objects']);
  });
  await t.test('O03 · les cinc variants d’atribució mantenen quota i purga confirmada',async()=>{
   const unknown='00000000-0000-0000-0000-000000000000';
   const variants=[
    {id:sid(230),label:'owner-null-ownerid-valid',expected:SB},
    {id:sid(231),label:'legacy-owner',owner:SB,ownerId:null,expected:SB},
    {id:sid(232),label:'invalid-ownerid-fallback',owner:SB,ownerId:'invalid historical id',expected:SB},
    {id:sid(233),label:'ownerid-priority',owner:SA,ownerId:SB,expected:SB},
    {id:sid(234),label:'unknown-owner',owner:null,ownerId:'invalid historical id',expected:unknown}
   ];
   // L’operador representa quatre registres històrics; els clients no poden desactivar triggers.
   await pg.exec('alter table storage.objects disable trigger xat_escriptura_final');
   try{for(const v of variants.slice(1))await pg.query("insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata,created_at) values('xat_adjunts',$1,$2,$3,'historic',$4,now()-interval '2 hours')",[v.id,v.owner,v.ownerId,{size:64,mimetype:'video/mp4'}]);}
   finally{await pg.exec('alter table storage.objects enable trigger xat_escriptura_final');}
   await pg.query('select private.xat_neteja_adjunts(500)');
   await pg.query('select private.xat_neteja_adjunts(500)');
   for(const v of variants){
    const rows=(await pg.query("select id,user_id from private.purga_storage_pendent where bucket_id='xat_adjunts' and nom=$1",[v.id])).rows;
    assert.equal(rows.length,1);assert.equal(rows[0].user_id,v.expected);v.queueId=rows[0].id;
    await assert.rejects(reserve(SB,v.id),denied('42501'));
   }
   assert.equal((await quota(SB)).usats,20000256);
   assert.equal((await quota(SA)).usats,64);
   for(const who of [SA,null])await assert.rejects(actor(who,'select private.xat_neteja_adjunts(500)'),denied('42501'));
   const ids=variants.map(v=>v.queueId),work=await actor(null,'select * from public.purga_fitxers_reclama(50)',[],'service_role');
   for(const v of variants)assert(work.some(w=>w.nom===v.id));
   assert.equal((await actor(null,'select public.purga_fitxers_fets($1::bigint[]) as n',[ids],'service_role'))[0].n,0);
   assert.equal((await quota(SB)).usats,20000256);
   await pg.query("delete from storage.objects where bucket_id='xat_adjunts' and name=any($1::text[])",[variants.map(v=>v.id)]);
   assert.equal((await actor(null,'select public.purga_fitxers_fets($1::bigint[]) as n',[ids],'service_role'))[0].n,5);
   assert.equal((await actor(null,'select public.purga_fitxers_fets($1::bigint[]) as n',[ids],'service_role'))[0].n,0);
   assert.equal((await quota(SB)).usats,20000000);
   record('O03',['private.xat_neteja_adjunts','private.xat_bytes_en_purga','public.xat_quota','private.purga_storage_pendent','public.purga_fitxers_reclama','public.purga_fitxers_fets','storage.objects']);
   migrationVerification.ownerCases=variants;
  });
  await t.test('Q04 · quota acumulada exacta de 250 MB i absència de reserva parcial',async()=>{
   // Dades de prova d’operador: adjunts publicats vàlids, per exercir el còmput acumulat.
   const seeded=[];
   for(let i=0;i<13;i++){
    const id=sid(300+i),bytes=i<12?20000000:9999872;
    await pg.query("insert into public.xat_adjunts(id,usuari_id,fil_id,bytes,mime,durada_ms,publicat,versio) values($1,$2,$3,$4,'video/mp4',60000,true,'fixture-quota')",[id,SA,SF,bytes]);seeded.push(id);
   }
   assert.equal((await quota(SA)).usats,249999936);
   assert.equal((await quota(SA)).limit,250000000);
   await reserve(SA,sid(320));assert.equal((await quota(SA)).usats,250000000);
   await assert.rejects(reserve(SA,sid(321)),e=>e.code==='23514'&&/SDP-XAT-020/.test(e.message));
   assert.equal((await pg.query('select count(*)::int as n from public.xat_adjunts where id=$1',[sid(321)])).rows[0].n,0);
   assert.equal((await quota(SA)).usats,250000000);
   await pg.query('delete from public.xat_adjunts where id=any($1::uuid[])',[[...seeded,sid(320)]]);
   assert.equal((await quota(SA)).usats,64);
   record('Q04',['public.xat_reserva_adjunt','public.xat_quota','public.xat_adjunts']);
  });
  eviR3246('c3_storage_cases.json',{cases,migrationVerification,source:pg.r3246,limits:'Metadades Storage locals, no bytes físics ni API HTTP. O02 és una restauració històrica sintètica amb DDL d’operador, no una capacitat del client. PGlite seqüencial, sense concurrència nativa.'});
 }finally{await pg.close();}
});
