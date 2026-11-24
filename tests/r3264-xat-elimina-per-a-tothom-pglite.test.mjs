import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {rebutEliminacioMissatge} from '../src/data/xat/rebutEliminacioMissatge.js';
import {creaBaseR3246,asClient} from './fixtures/r3246-catalogue-pglite.mjs';
import {sembraR3264,enviaR3264,sembraXifratR3264,SA,SB,SO,SC,SD,SF,EF,ORG,STOWN,sid} from './fixtures/r3264-xat-elimina-per-a-tothom-casos.mjs';
const migration=fs.readFileSync(new URL('../supabase/migrations/20261123233000_r3264_xat_elimina_per_a_tothom_sense_caducitat.sql',import.meta.url),'utf8');
const denied=e=>e.code==='42501';
test('R3264 · esborrat global sobre catàleg acumulatiu i rols reals',{timeout:180000},async t=>{
 const pg=await creaBaseR3246({throughVersion:'20261123180000'});
 const actor=(uid,sql,args=[])=>asClient(pg,{uid},sql,args);
 const del=async(uid,id,fil=SF)=>(await actor(uid,'select public.xat_elimina_per_a_tothom($1,$2) as q',[fil,id]))[0].q;
 const msg=async id=>(await pg.query('select * from public.xat_missatges where id=$1',[id])).rows[0];
 const meta=async()=>(await pg.query("select oid,proowner,proacl::text as acl,proconfig,prosecdef from pg_proc where oid='private.xat_missatges_e2ee()'::regprocedure")).rows[0];
 try{
  await sembraR3264(pg);
  const plain=sid(100),encrypted=sid(101);
  await enviaR3264(pg,plain);await sembraXifratR3264(pg,encrypted);
  await t.test('baseline: RPC absent i purga E2EE rebutjada',async()=>{
   await assert.rejects(del(SA,plain),e=>e.code==='42883');
   await assert.rejects(pg.query("update public.xat_missatges set esborrat_al=now(),xifrat=null,metadades='{}' where id=$1",[encrypted]),denied);
   assert.equal((await msg(encrypted)).esborrat_al,null);
  });
  const oldMeta=await meta();
  await t.test('migració idempotent; metadades trigger i ACL',async()=>{
   await pg.exec(migration);assert.deepEqual(await meta(),oldMeta);
   const first=(await pg.query("select pg_get_functiondef('public.xat_elimina_per_a_tothom(uuid,uuid)'::regprocedure) as d")).rows[0].d;
   await pg.exec(migration);assert.deepEqual(await meta(),oldMeta);
   assert.equal((await pg.query("select pg_get_functiondef('public.xat_elimina_per_a_tothom(uuid,uuid)'::regprocedure) as d")).rows[0].d,first);
   const rights=(await pg.query("select r,has_function_privilege(r,'public.xat_elimina_per_a_tothom(uuid,uuid)','EXECUTE') as ok from unnest(array['anon','authenticated','service_role']) r")).rows;
   assert.deepEqual(rights.map(x=>x.ok),[false,true,false]);
  });
  await t.test('nul, anònim, foraster, membre i fil incorrecte denegats',async()=>{
   for(const uid of [null,SO,SB])await assert.rejects(del(uid,plain),denied);
   for(const [fil,id] of [[EF,plain],[null,plain],[SF,null],[SF,sid(999)]])await assert.rejects(del(SA,id,fil),denied);
   await assert.rejects(asClient(pg,{role:'anon'},'select public.xat_elimina_per_a_tothom($1,$2)',[SF,plain]),denied);
   assert.equal((await msg(plain)).text,'Missatge sintètic');
  });
  await t.test('defensa NULL d’autoria: no travessa l’OR d’autoritat',async()=>{
   const id=sid(110);await enviaR3264(pg,id);
   // El catàleg actual imposa NOT NULL. Esta prova de frontera simula un orfe
   // futur sense substituir cap helper d'autoritat i restaura la restricció.
   await pg.exec('alter table public.xat_missatges alter column usuari_id drop not null');
   try{
    await pg.query('update public.xat_missatges set usuari_id=null where id=$1',[id]);
    await assert.rejects(del(SO,id),denied);await assert.rejects(del(SB,id),denied);
    assert.equal((await msg(id)).esborrat_al,null);assert.equal((await del(SD,id)).esborrat,true);
   }finally{
    await pg.query('update public.xat_missatges set usuari_id=$2 where id=$1',[id,SA]);
    await pg.exec('alter table public.xat_missatges alter column usuari_id set not null');
   }
  });
  await t.test('autor: 10 anys i caducat, ocultació preservada, rebut mínim estable',async()=>{
   await pg.query("update public.xat_missatges set creat_al=now()-interval '10 years',caduca_al=now()-interval '1 day' where id=$1",[plain]);
   await pg.query('insert into public.xat_missatges_amagats(usuari_id,missatge_id) values($1,$2)',[SA,plain]);
   await pg.query('update public.xat_participants set com_org_id=$2 where fil_id=$1 and usuari_id=$3',[SF,ORG,SA]);
   const q=await del(SA,plain);
   await pg.query('update public.xat_participants set com_org_id=null where fil_id=$1 and usuari_id=$2',[SF,SA]);
   assert.deepEqual(rebutEliminacioMissatge(q,{filId:SF,missatgeId:plain}),q);
   assert.deepEqual(Object.keys(q).sort(),['amagat','destacat','esborrat','esborratAl','filId','fixat','missatgeId','reaccions'].sort());
   assert.equal(q.amagat,true);assert.equal(q.esborrat,true);assert.deepEqual(q.reaccions,[]);assert.equal(q.fixat,false);assert.equal(q.destacat,false);
   assert.deepEqual(await del(SA,plain),q);const m=await msg(plain);assert.equal(m.text,null);assert.equal(m.xifrat,null);assert.deepEqual(m.metadades,{});assert.equal(m.usuari_id,SA);
  });
  await t.test('administració real de fil i organització; membre/revocació no',async()=>{
   const id=sid(102);await enviaR3264(pg,id);assert.equal((await del(SD,id)).esborrat,true);
   const org=sid(103);await enviaR3264(pg,org);await pg.query('update public.xat_missatges set com_org_id=$1 where id=$2',[ORG,org]);
   await assert.rejects(del(SB,org),denied);assert.equal((await del(SC,org)).esborrat,true);
   const rev=sid(104);await enviaR3264(pg,rev);await pg.query('update public.xat_missatges set com_org_id=$1 where id=$2',[ORG,rev]);
   await pg.query("update public.organization_memberships set role='member' where organization_id=$1 and user_id=$2",[ORG,SC]);await assert.rejects(del(SC,rev),denied);
  });
  await t.test('E2EE: buida només payload; immutable i no resurrecció',async()=>{
   await assert.rejects(pg.query("update public.xat_missatges set esborrat_al=now(),xifrat=null,metadades='{}',usuari_id=$2 where id=$1",[encrypted,SB]),denied);
   assert.equal((await del(SA,encrypted,EF)).esborrat,true);const m=await msg(encrypted);assert.equal(m.xifrat,null);assert.deepEqual(m.metadades,{});assert.equal(m.versio_xifrat,1);
   await assert.rejects(pg.query('update public.xat_missatges set esborrat_al=null where id=$1',[encrypted]),denied);
  });
  await t.test('reaccions/fixats/destacats i push pendent, sense tocar missatge alié',async()=>{
   const id=sid(105),other=sid(106);await enviaR3264(pg,id);await enviaR3264(pg,other);
   await pg.query("insert into public.xat_reaccions(missatge_id,usuari_id,emoji) values($1,$2,'👍')",[id,SB]);
   await pg.query('insert into public.xat_missatges_destacats(usuari_id,missatge_id) values($1,$2)',[SB,id]);
   await pg.query('insert into public.xat_missatges_fixats(conversa_id,missatge_id,fixat_per) values($1,$2,$3)',[SF,id,SA]);
   const q=(await pg.query('insert into private.xat_push_cua(fil_id,missatge_id,autor_id) values($1,$2,$3) returning id',[SF,id,SA])).rows[0];
   await pg.query("insert into private.xat_push_lliuraments(cua_id,dispositiu_id,usuari_id,caduca_al,lease_id,lease_fins) values($1,$2,$3,now()+interval '1 day',$4,now()+interval '1 min')",[q.id,sid(300),SB,sid(301)]);
   await del(SA,id);for(const table of ['public.xat_reaccions','public.xat_missatges_destacats','public.xat_missatges_fixats','private.xat_push_cua'])assert.equal((await pg.query(`select count(*)::int as n from ${table} where missatge_id=$1`,[id])).rows[0].n,0);
   assert.equal((await pg.query('select count(*)::int as n from private.xat_push_lliuraments where cua_id=$1',[q.id])).rows[0].n,0);assert.equal((await msg(other)).esborrat_al,null);
  });
  await t.test('preview existent retomba a l’anterior viu',async()=>{
   const a=sid(107),b=sid(108);await enviaR3264(pg,a,{text:'anterior viu'});await enviaR3264(pg,b,{text:'últim eliminat'});
   const preview=async()=>(await actor(SA,'select * from public.xat_fils_meus($1)',[STOWN])).find(x=>x.id===SF);
   assert.equal((await preview()).ultim_text,'últim eliminat');await del(SA,b);assert.equal((await preview()).ultim_text,'anterior viu');
  });
  await t.test('adjunt inaccessible immediat; cleaner encola i conserva objecte físic',async()=>{
   const id=sid(109);await actor(SA,'select public.xat_reserva_adjunt($1,$2,64,$3,null)',[id,SF,'image/webp']);
   // L'upload és la primitiva Storage de plataforma; reserva/publicació/lectura són RPC autenticades reals.
   await pg.query("insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata) values('xat_adjunts',$1,$2::text::uuid,$2::text,'fixture-v1',$3)",[id,SA,{size:64,mimetype:'image/webp'}]);
   await actor(SA,'select public.xat_publica_adjunt($1,$2,null)',[id,'foto']);
   assert.equal((await actor(SB,'select public.xat_llegix_adjunt($1) as q',[id])).length,1);
   await del(SA,id);await assert.rejects(actor(SB,'select public.xat_llegix_adjunt($1)',[id]),denied);
   await pg.query('select private.xat_neteja_adjunts(500)');
   assert.equal((await pg.query("select count(*)::int as n from private.purga_storage_pendent where bucket_id='xat_adjunts' and nom=$1",[id])).rows[0].n,1);
   assert.equal((await pg.query("select count(*)::int as n from storage.objects where bucket_id='xat_adjunts' and name=$1",[id])).rows[0].n,1);
  });
  await t.test('deriva trigger i índex rebutjada sense mutació',async()=>{
   const def=(await pg.query("select pg_get_functiondef('private.xat_missatges_e2ee()'::regprocedure) as d")).rows[0].d;
   const drift=def.replace('DECLARE e integer;','DECLARE e integer; -- deriva sintètica');await pg.exec(drift);
   await assert.rejects(pg.exec(migration),e=>e.code==='55000');await pg.exec('rollback');
   assert.equal((await pg.query("select pg_get_functiondef('private.xat_missatges_e2ee()'::regprocedure) as d")).rows[0].d,drift);await pg.exec(def);
   await pg.exec('drop index private.xat_push_cua_missatge_idx; create index xat_push_cua_missatge_idx on private.xat_push_cua(autor_id)');
   await assert.rejects(pg.exec(migration),e=>e.code==='55000');await pg.exec('rollback');
   await pg.exec('drop index private.xat_push_cua_missatge_idx');await pg.exec(migration);
  });
  await t.test('deriva desconeguda RPC rebutjada sense sobreescriure',async()=>{
   const def=(await pg.query("select pg_get_functiondef('public.xat_elimina_per_a_tothom(uuid,uuid)'::regprocedure) as d")).rows[0].d;
   const drift=def.replace('v_uid uuid := auth.uid();','v_uid uuid := null;');await pg.exec(drift);
   await assert.rejects(pg.exec(migration),e=>e.code==='55000');await pg.exec('rollback');
   assert.equal((await pg.query("select pg_get_functiondef('public.xat_elimina_per_a_tothom(uuid,uuid)'::regprocedure) as d")).rows[0].d,drift);await pg.exec(def);
  });
 }finally{await pg.close();}
});
