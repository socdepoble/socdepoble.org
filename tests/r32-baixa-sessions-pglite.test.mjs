import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
const read = path => fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
if (!process.env.SDP_PGLITE_MODULE) throw new Error('SDP_PGLITE_MODULE obligatori: no s’omet la prova RGPD.');
const { PGlite } = await import(pathToFileURL(process.env.SDP_PGLITE_MODULE).href);
const migration = read('supabase/migrations/20261116170200_r32_baixa_sessions_atomiques.sql');
const rollback = read('supabase/snippets/r32_baixa_sessions_rollback.sql');
const A = '32000000-0000-4000-8000-000000000001', B = '32000000-0000-4000-8000-000000000002';
const source = read('supabase/migrations/2609291200_baixa_icon_copyright.sql').split('-- Completar les baixes ja en quarantena')[0]+'\ncommit;';
const cancelSource = read('supabase/migrations/2611110100_cua_purga_storage_ugc.sql').match(/create or replace function public\.cancela_baixa\(\)[\s\S]*?\$\$;/)[0];
async function base() {
  const db = new PGlite();
  await db.exec(read('tests/fixtures/r32-platform.sql'));
  await db.exec(`create schema private;
    create table public.profiles(id uuid primary key, full_name text,avatar_url text,bio text,lema text,presentacio_html text,hero_url text,icon text,copyright text,is_public boolean,baixa_demanada_at timestamptz);
    create table public.section_submissions(id uuid primary key,owner_user_id uuid,author_org_id uuid,payload jsonb);
    create table private.baixes(user_id uuid primary key,demanada_al timestamptz,purga_prevista_al timestamptz,instantania jsonb,motiu text,purga_fitxers_iniciada_al timestamptz);
    create table private.ajustos(clau text primary key,valor text);
    create function private.claus_personals_payload(jsonb,text) returns text[] language sql immutable as $$select array['author_name']::text[]$$;
    create table public.push_subscriptions(id uuid primary key default gen_random_uuid(),sessio_id uuid not null references auth.sessions(id) on delete cascade);`);
  await db.exec(source);
  await db.exec(cancelSource);
  for(const actor of [A,B]) {
    await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[actor,{full_name:actor,icon:'sol',copyright:'propi'}]);
    await db.query("insert into public.profiles values($1,$2,null,'bio','lema','','','sol','propi',true,null)",[actor,actor]);
    const id = (await db.query('insert into auth.sessions(user_id) values($1) returning id',[actor])).rows[0].id;
    await db.query('insert into public.push_subscriptions(sessio_id) values($1)',[id]);
    await db.query('insert into public.section_submissions values($1,$1,null,$2)',[actor,{author_name:actor,content:'Text propi'}]);
  }
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);
  return db;
}
async function defs(db) {
  return (await db.query("select oid,proowner,proacl::text acl,pg_get_functiondef(oid) ddl from pg_proc where oid=any(array['public.demana_baixa(text)'::regprocedure,'public.cancela_baixa()'::regprocedure]) order by oid")).rows;
}
async function counts(db) {
  return (await db.query(`select (select count(*)::int from auth.sessions where user_id='${A}') sessions,
    (select count(*)::int from public.push_subscriptions p join auth.sessions s on s.id=p.sessio_id where s.user_id='${B}') push_alie,
    (select count(*)::int from private.baixes) baixes,
    (select full_name from public.profiles where id='${A}') nom,
    (select raw_user_meta_data from auth.users where id='${A}') metadata,
    (select payload from public.section_submissions where id='${A}') payload`)).rows[0];
}
await test('R32 RGPD · DDL idempotent, revocació amb cascada i rollback exacte',async t => {
  const db=await base(); t.after(()=>db.close()); const before=await defs(db);
  await db.exec(migration); await db.exec(migration);
  assert.deepEqual((await defs(db)).map(r=>[r.oid,r.proowner,r.acl]),before.map(r=>[r.oid,r.proowner,r.acl]));
  const code=(await defs(db)).map(r=>r.ddl);
  assert.ok(code.every(s=>s.includes("pg_advisory_xact_lock(pg_catalog.hashtext('sdp-baixa')")));
  for(const role of ['anon','authenticated','service_role']) assert.equal((await db.query("select has_table_privilege($1,'private.r32_baixa_sessions_backup','select') yes",[role])).rows[0].yes,false);
  const r=(await db.query('select public.demana_baixa($1) baixa',['Prova sintètica'])).rows[0].baixa;
  assert.ok(r.demanada_al); let state=await counts(db);
  assert.equal(state.sessions,0); assert.equal(state.push_alie,1); assert.equal(state.baixes,1);
  assert.equal((await db.query('select count(*)::int n from public.push_subscriptions')).rows[0].n,1);
  assert.equal(state.nom,"Veïna que se n'ha anat"); assert.deepEqual(state.metadata,{}); assert.deepEqual(state.payload,{content:'Text propi'});
  // La reentrada durant quarantena no deixa una sessió zombi en repetir la baixa.
  await db.query('insert into auth.sessions(user_id) values($1)',[A]);
  await db.query('select public.demana_baixa(null)'); assert.equal((await counts(db)).sessions,0);
  // La guarda de purga ja iniciada de2611110100 es conserva literal.
  await db.query('update private.baixes set purga_fitxers_iniciada_al=now() where user_id=$1',[A]);
  await assert.rejects(db.query('select public.cancela_baixa()'),/SDP-BAIXA-041/);
  assert.equal((await counts(db)).baixes,1);
  await db.query('update private.baixes set purga_fitxers_iniciada_al=null where user_id=$1',[A]);
  await db.query('select public.cancela_baixa()'); state=await counts(db);
  assert.equal(state.baixes,0); assert.equal(state.nom,A); assert.equal(state.metadata.full_name,A); assert.equal(state.payload.author_name,A);
  await db.exec(rollback); await db.exec(rollback); assert.deepEqual(await defs(db),before);
  await db.exec(migration); assert.deepEqual((await defs(db)).map(r=>r.ddl),code);
});
await test('R32 RGPD · sense permís per a revocar sessions no confirma ni anonimitza parcialment',async t => {
  const db=await base(); t.after(()=>db.close());
  await db.exec(`create role baixador nologin; grant usage on schema public,private,auth to baixador;
    grant select,insert,update,delete on public.profiles,public.section_submissions,private.baixes,private.ajustos to baixador;
    grant select,update on auth.users to baixador;
    grant execute on function private.claus_personals_payload(jsonb,text) to baixador;
    alter function public.demana_baixa(text) owner to baixador;`);
  const before=await counts(db);
  // Contraprova del defecte sobre la funció històrica real: confirma mentre deixa la sessió viva.
  await db.exec('begin');
  const old=(await db.query('select public.demana_baixa(null) baixa')).rows[0].baixa;
  assert.ok(old.demanada_al); assert.equal((await counts(db)).sessions,1);
  await db.exec('rollback');
  await db.exec(migration);
  await assert.rejects(db.query('select public.demana_baixa(null)'),error=>error.code==='42501');
  assert.deepEqual(await counts(db),before);
});
await test('R32 RGPD · deriva de font o configuració no es corregix a cegues',async t=>{
  const db=await base(); t.after(()=>db.close());
  await db.exec('alter function public.cancela_baixa() set search_path=public');
  const before=await defs(db);
  await assert.rejects(db.exec(migration),/SDP-R32-BAIXA-005/);await db.exec('rollback');
  assert.deepEqual(await defs(db),before);
  assert.equal((await db.query("select to_regclass('private.r32_baixa_sessions_backup') t")).rows[0].t,null);
});
