// R32.87 · Prova PGlite dels tres blindatges P0 de Gemini 4 Neon (migració 136). Cada forat es reprodueix
// primer amb el catàleg fins a 135 i després es comprova tancat amb 136 sobre el mateix escenari.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {creaBaseR3246,asClient} from './fixtures/r3246-catalogue-pglite.mjs';
import {sembraR3264,enviaR3264,SA,SB,SC,SD,SF,ORG,STOWN,sid} from './fixtures/r3264-xat-elimina-per-a-tothom-casos.mjs';

const migration=fs.readFileSync(new URL('../supabase/migrations/20261124174000_r3287_blindatge_xat_elimina_lssi_i_resol_reclamacio.sql',import.meta.url),'utf8');
const denied=e=>e.code==='42501';
const EDIT='select public.publica_section_submission_beta_cas($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as ack';
const FUNCIONS=['public.xat_elimina_per_a_tothom(uuid,uuid)','public.publica_section_submission_beta_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamp with time zone,uuid)','public.revoca_publicacio_mur(uuid,uuid)','public.resol_reclamacio(uuid,boolean)'];

test('R32.87 · migració 136: ex-admin revocat, prova LSSI i resol_reclamacio amb superadmin nul',{timeout:240000},async t=>{
 const pg=await creaBaseR3246({throughVersion:'20261124033000'});
 const actor=(uid,sql,args=[])=>asClient(pg,{uid},sql,args);
 const del=async(uid,id)=>(await actor(uid,'select public.xat_elimina_per_a_tothom($1,$2) as q',[SF,id]))[0].q;
 const edit=(id,op,expected)=>actor(SA,EDIT,[id,STOWN,'mur',{content:'Text de prova'},'Títol','',null,false,expected,op]).then(r=>r[0].ack);
 const fila=async id=>(await pg.query('select id,updated_at,moderation_state,deleted_at from public.section_submissions where id=$1',[id])).rows[0];
 const meta=async()=>(await pg.query('select p.oid::text,p.proowner,p.proacl::text as acl,pg_get_functiondef(p.oid) as def from unnest($1::text[]) f join pg_proc p on p.oid=to_regprocedure(f) order by f',[FUNCIONS])).rows;
 // Un ex-administrador revocat: va enviar com a l'entitat i ja no la gestiona ni és participant del fil.
 const comunicatOficial=async id=>{
  await pg.query("insert into public.organization_memberships(organization_id,tenant_id,user_id,role) values($1,$2,$3,'admin') on conflict(organization_id,user_id) do update set role='admin'",[ORG,STOWN,SC]);
  await pg.query("insert into public.xat_missatges(id,fil_id,usuari_id,text,tipus,com_org_id) values($1,$2,$3,'Comunicat oficial','text',$4)",[id,SF,SC,ORG]);
  await pg.query('delete from public.organization_memberships where organization_id=$1 and user_id=$2',[ORG,SC]);
 };
 const retirada=async(id,op)=>{
  await edit(id,op,null);
  await pg.query("update public.section_submissions set moderation_state='retirada_cautelar' where id=$1",[id]);
  return fila(id);
 };
 try{
  await sembraR3264(pg);
  await t.test('abans de 136: els tres forats són reals',async()=>{
   const oficial=sid(500);await comunicatOficial(oficial);
   assert.equal((await del(SC,oficial)).esborrat,true);
   const r=await retirada(sid(600),sid(700));
   assert.equal((await actor(SA,'select public.revoca_publicacio_mur($1,$2) as ok',[r.id,STOWN]))[0].ok,true);
   assert.equal(await fila(r.id),undefined);
   const r2=await retirada(sid(601),sid(701));
   await edit(r2.id,sid(702),r2.updated_at);
   assert.notEqual((await fila(r2.id)).updated_at.getTime(),r2.updated_at.getTime());
   await pg.exec("alter function private.es_superadmin() rename to es_superadmin_r3287");
   await pg.exec('create function private.es_superadmin() returns boolean language sql stable as $$select null::boolean$$');
   try{
    await assert.rejects(actor(SB,'select public.resol_reclamacio($1,true)',[sid(800)]),e=>e.code==='22023'&&/SDP-CLAIM-011/.test(e.message));
   }finally{
    await pg.exec('drop function private.es_superadmin()');
    await pg.exec('alter function private.es_superadmin_r3287() rename to es_superadmin');
   }
  });
  await t.test('136 s’aplica, és idempotent i conserva OID, propietari i ACL',async()=>{
   const abans=await meta();
   await pg.exec(migration);
   const despres=await meta();
   assert.deepEqual(despres.map(({oid,proowner,acl})=>[oid,proowner,acl]),abans.map(({oid,proowner,acl})=>[oid,proowner,acl]));
   for(const [i,f] of despres.entries())assert.notEqual(f.def,abans[i].def);
   await pg.exec(migration);
   assert.deepEqual(await meta(),despres);
  });
  await t.test('xat: un ex-admin revocat i un membre expulsat no esborren; l’autor vigent i l’admin del fil sí',async()=>{
   const oficial=sid(501);await comunicatOficial(oficial);
   await assert.rejects(del(SC,oficial),denied);
   assert.equal((await pg.query('select text from public.xat_missatges where id=$1',[oficial])).rows[0].text,'Comunicat oficial');
   const propi=sid(502);await enviaR3264(pg,propi);
   const expulsat=sid(503);await enviaR3264(pg,expulsat,{uid:SB});
   await pg.query('delete from public.xat_participants where fil_id=$1 and usuari_id=$2',[SF,SB]);
   await assert.rejects(del(SB,expulsat),denied);
   assert.equal((await del(SA,propi)).esborrat,true);
   assert.equal((await del(SD,expulsat)).esborrat,true);
  });
  await t.test('LSSI: una fila retirada_cautelar no es revoca ni es sobreescriu; una visible sí',async()=>{
   const r=await retirada(sid(610),sid(710));
   await assert.rejects(actor(SA,'select public.revoca_publicacio_mur($1,$2)',[r.id,STOWN]),denied);
   await assert.rejects(edit(r.id,sid(711),r.updated_at),e=>denied(e)&&/retirada o en revisió/.test(e.message));
   assert.deepEqual(await fila(r.id),r);
   await pg.query("update public.section_submissions set moderation_state='visible',deleted_at=now() where id=$1",[r.id]);
   await assert.rejects(actor(SA,'select public.revoca_publicacio_mur($1,$2)',[r.id,STOWN]),denied);
   const v=await edit(sid(611),sid(712),null);assert.ok(v);
   assert.equal((await actor(SA,'select public.revoca_publicacio_mur($1,$2) as ok',[sid(611),STOWN]))[0].ok,true);
  });
  await t.test('resol_reclamacio: un es_superadmin nul refusa amb SDP-CLAIM-010',async()=>{
   await pg.exec("alter function private.es_superadmin() rename to es_superadmin_r3287");
   await pg.exec('create function private.es_superadmin() returns boolean language sql stable as $$select null::boolean$$');
   try{
    await assert.rejects(actor(SB,'select public.resol_reclamacio($1,true)',[sid(801)]),e=>denied(e)&&/SDP-CLAIM-010/.test(e.message));
   }finally{
    await pg.exec('drop function private.es_superadmin()');
    await pg.exec('alter function private.es_superadmin_r3287() rename to es_superadmin');
   }
  });
  await t.test('una funció divergent avorta tota la migració amb 55000',async()=>{
   await pg.exec("create or replace function public.resol_reclamacio(p_claim uuid,p_aprova boolean) returns void language plpgsql security definer set search_path='' as $$begin raise exception 'divergent'; end$$");
   await assert.rejects(pg.exec(migration),e=>e.code==='55000'&&/SDP-R3287-002/.test(e.message));
  });
 }finally{await pg.close();}
});
