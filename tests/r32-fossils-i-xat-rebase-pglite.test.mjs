/** R32: real PostgreSQL WASM, no production connection. Literal R22.2 fossil DDL is evidence from 13-11,
 * not a fresh export. Full catalogue replay includes every committed migration in the canonical order. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const entrada = process.env.SDP_PGLITE_MODULE;
if (!entrada) throw new Error('SDP_PGLITE_MODULE required: R32 SQL cannot be skipped.');
const moduleURL = pathToFileURL(entrada).href;
const { PGlite } = await import(moduleURL);
const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
const migration = read('supabase/migrations/20261116170000_r32_fossils_search_path.sql');
const rebase = read('supabase/migrations/20261116170100_r32_xat_propi_rebase_r24.sql');
const probe = read('supabase/snippets/r32_7_fossils_sonda.sql');
const rollback = read('supabase/snippets/r32_7_fossils_rollback.sql');
const fossils = JSON.parse(read('tests/fixtures/r32-fossils.json'));
const sha = s => createHash('sha256').update(s).digest('hex');
const id = n => `32000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
async function fails(db, sql, pattern) {
  try { await assert.rejects(db.exec(sql), pattern); } finally { await db.exec('rollback'); }
}
async function snapshot(db) {
  return (await db.query("select p.oid, p.oid::regprocedure::text as signature, pg_get_functiondef(p.oid) as definition,p.proacl::text as acl,p.proowner from pg_proc p where p.oid = any($1::regprocedure[]) order by p.oid", [Object.keys(fossils).map(s => `public.${s}`)])).rows;
}
async function fossilBase() {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role; create schema private; create schema auth; create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;");
  for (const ddl of Object.values(fossils)) await db.exec(ddl);
  await db.exec("grant usage on schema public to authenticated; grant execute on all functions in schema public to authenticated; revoke execute on all functions in schema public from public,anon;");
  return db;
}
await test('R32 fossil hardening: source pins, full backup, triggers, temp shadowing and reversible replay', { timeout: 120000 }, async t => {
  const db = await fossilBase(); t.after(() => db.close());
  const original = await snapshot(db);
  await db.exec(`create table public.push_subscriptions(last_used_at timestamptz); insert into public.push_subscriptions values(now()-interval '100 days'),(now());
    create table public.push_notifications_log(id uuid default gen_random_uuid(),user_id uuid,notification_type text,payload jsonb,success boolean,error_message text);
    create table public.messages(conversation_id uuid,sender_id uuid,read_at timestamptz);
    create table public.market_items(author_user_id uuid,created_at timestamptz default now());
    create table public.omega_posts(id uuid,parent_id uuid,uuid uuid,content text);
    create table public.post_translations(post_id uuid);
    create table public.entity_members(id integer); insert into public.entity_members values(1);
    create materialized view public.entity_member_map as select id from public.entity_members;
    create unique index entity_member_map_uq on public.entity_member_map(id);
    create trigger r32_market before insert on public.market_items for each row execute function public.check_market_rate_limit();
    create trigger r32_omega_parent before insert on public.omega_posts for each row execute function public.omega_set_default_parent_id();
    create trigger r32_omega_translation before update on public.omega_posts for each row execute function public.omega_invalidate_stale_translations();
    create trigger r32_entity after insert on public.entity_members for each statement execute function public.refresh_entity_member_map();`);
  const triggers = (await db.query("select tgname,pg_get_triggerdef(oid) as ddl from pg_trigger where tgname like 'r32_%' order by tgname")).rows;
  await t.test('probe is read-only and bounded to seven full DDL/dependency rows', async () => {
    await db.exec('begin read only');
    const rows = (await db.query(probe)).rows; await db.exec('commit');
    assert.equal(rows.length, 7); assert.ok(rows.every(r => r.present && r.definition && r.source_sha256?.length === 64));
    assert.equal(rows.filter(r => r.triggers.length).length, 4);
    assert.equal(rows.find(r => r.signature.includes('mark_messages')).source_sha256, sha(Object.values(fossils).find(s => s.includes('FUNCTION public.mark_messages_as_read')).match(/\$function\$([\s\S]*?)\$function\$/)[1]));
  });
  await t.test('two applications preserve function identities, ownership, ACL and trigger DDL', async () => {
    await db.exec(migration); await db.exec(migration);
    const current = await snapshot(db);
    assert.deepEqual(current.map(r => [r.oid,r.signature,r.acl,r.proowner]), original.map(r => [r.oid,r.signature,r.acl,r.proowner]));
    assert.equal((await db.query('select count(*)::int as n from private.r32_fossils_backup')).rows[0].n, 7);
    assert.equal((await db.query("select count(*)::int as n from pg_proc where oid=any($1::regprocedure[]) and array_to_string(proconfig,',')=$2", [Object.keys(fossils).map(s => `public.${s}`), 'search_path=""'])).rows[0].n, 7);
    assert.deepEqual((await db.query("select tgname,pg_get_triggerdef(oid) as ddl from pg_trigger where tgname like 'r32_%' order by tgname")).rows, triggers);
    for (const role of ['anon','authenticated','service_role']) {
      assert.equal((await db.query("select has_table_privilege($1,'private.r32_fossils_backup','select') as yes", [role])).rows[0].yes, false);
    }
  });
  await t.test('qualified legacy data paths operate with hostile pg_temp tables present', async () => {
    await db.exec(`create temp table push_subscriptions(last_used_at timestamptz); insert into pg_temp.push_subscriptions values(now()-interval '100 days');
      create temp table messages(conversation_id uuid,sender_id uuid,read_at timestamptz);
      create temp table market_items(author_user_id uuid,created_at timestamptz);
      create temp table push_notifications_log(id uuid); create temp table entity_member_map(id integer);`);
    await db.exec('select public.clean_expired_push_subscriptions()');
    assert.equal((await db.query('select count(*)::int n from public.push_subscriptions')).rows[0].n, 1);
    assert.equal((await db.query('select count(*)::int n from pg_temp.push_subscriptions')).rows[0].n, 1);
    await db.query('select public.log_push_notification($1,$2,$3,true,null)', [id(1),'r32',{synthetic:true}]);
    assert.equal((await db.query('select count(*)::int n from public.push_notifications_log')).rows[0].n, 1);
    await db.query('insert into public.messages values($1,$2,null),($1,$3,null)', [id(2),id(1),id(3)]);
    await db.query('select public.mark_messages_as_read($1,$2)', [id(2),id(1)]);
    assert.equal((await db.query('select count(*)::int n from public.messages where read_at is not null')).rows[0].n, 1);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id(1)]);
    for (let i=0;i<3;i++) await db.query('insert into public.market_items(author_user_id) values($1)', [id(1)]);
    await assert.rejects(db.query('insert into public.market_items(author_user_id) values($1)', [id(1)]), /Rate limit reached/);
    await db.query('insert into public.omega_posts(id,uuid,content) values($1,$1,$2)', [id(4),'unchanged']);
    assert.equal((await db.query('select parent_id from public.omega_posts')).rows[0].parent_id,id(4));
    await db.query("update public.omega_posts set content='unchanged'");
    await assert.rejects(db.query("update public.omega_posts set content='changed'"), /Traducciones eliminadas/);
    await db.exec('insert into public.entity_members values(2)');
    assert.equal((await db.query('select count(*)::int n from public.entity_member_map')).rows[0].n, 2);
  });
  await t.test('rollback refuses unknown option drift, restores exact full DDL and remains idempotent', async () => {
    await db.exec("alter function public.omega_set_default_parent_id() set search_path=public,pg_temp");
    await fails(db,rollback,/SDP-R32-FOSSIL-007/);
    await db.exec("alter function public.omega_set_default_parent_id() set search_path=''");
    await db.exec(rollback); await db.exec(rollback);
    assert.deepEqual(await snapshot(db), original);
    await db.exec(migration); await db.exec(migration);
  });
  await t.test('the additive self rebase fails before mutating a database without R24', async () => {
    await fails(db,rebase,/SDP-R32-XAT-001/);
    assert.equal((await db.query("select to_regclass('public.xat_fils') as r")).rows[0].r,null);
  });
});
await test('R32 unknown legacy source aborts all seven mutations atomically', { timeout: 90000 }, async t => {
  const db=await fossilBase();t.after(()=>db.close());
  await db.exec("create or replace function public.refresh_entity_member_map() returns trigger language plpgsql security definer set search_path=public as $$begin return null; end$$;");
  const before=await snapshot(db);
  await fails(db,migration,/SDP-R32-FOSSIL-004/);
  assert.deepEqual(await snapshot(db),before);
  assert.equal((await db.query("select to_regclass('private.r32_fossils_backup') as r")).rows[0].r,null);
});
await test('R32 known body with unknown initial configuration is rejected atomically', { timeout: 90000 }, async t => {
  const db=await fossilBase();t.after(()=>db.close());
  await db.exec("alter function public.refresh_entity_member_map() set statement_timeout='5s'");
  const before=await snapshot(db);
  await fails(db,migration,/SDP-R32-FOSSIL-008/);
  assert.deepEqual(await snapshot(db),before);
  assert.equal((await db.query("select to_regclass('private.r32_fossils_backup') as r")).rows[0].r,null);
});
await test('R32 full canonical catalogue replay and non-destructive own-thread rebase over R24', { timeout: 180000 }, async t => {
  const db = new PGlite({extensions:{pgcrypto}});t.after(()=>db.close());
  await db.exec(read('tests/fixtures/r32-platform.sql'));
  const plan=creaPlaMigracions();
  const applied=[];
  for(const entry of plan.migrations) {
    try { await db.exec(entry.sql); applied.push(entry.file); }
    catch(error) { await db.exec('rollback'); throw new Error(`${entry.file}: ${error.message}`, {cause:error}); }
  }
  t.diagnostic(`Complete canonical catalogue: ${applied.length} migrations, order SHA256 ${plan.orderSha256}`);
  assert.equal(applied.length,fs.readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(s=>s.endsWith('.sql')).length);
  assert.ok(applied.indexOf('20261116170100_r32_xat_propi_rebase_r24.sql')>applied.indexOf('20261114061000_r24_xat_rebuts_entrega.sql'));
  const protectedSignatures=['public.xat_fils_meus(uuid)','public.crea_fil_directe(uuid,uuid,text)','private.xat_participant_vigent(uuid,uuid)'];
  const defs=async()=>(await db.query('select oid,pg_get_functiondef(oid) as ddl from pg_proc where oid=any($1::regprocedure[]) order by oid',[protectedSignatures])).rows;
  const before=await defs();
  await t.test('a homonymous weak CHECK or nonunique index is rejected without replacing R24 functions',async()=>{
    const constraint=(await db.query("select pg_get_constraintdef(oid) as ddl from pg_constraint where conrelid='public.xat_fils'::regclass and conname='xat_fils_propi_forma'")).rows[0].ddl;
    const index=(await db.query("select pg_get_indexdef('public.xat_fils_propi_usuari_uq'::regclass) as ddl")).rows[0].ddl;
    await db.exec('alter table public.xat_fils drop constraint xat_fils_propi_forma; alter table public.xat_fils add constraint xat_fils_propi_forma check(true)');
    await fails(db,rebase,/SDP-R32-XAT-002/);
    assert.deepEqual(await defs(),before);
    await db.exec(`alter table public.xat_fils drop constraint xat_fils_propi_forma; alter table public.xat_fils add constraint xat_fils_propi_forma ${constraint}`);
    await db.exec('drop index public.xat_fils_propi_usuari_uq; create index xat_fils_propi_usuari_uq on public.xat_fils(tenant_id,propi_usuari_id) where propi_usuari_id is not null');
    await fails(db,rebase,/SDP-R32-XAT-002/);
    assert.deepEqual(await defs(),before);
    await db.exec(`drop index public.xat_fils_propi_usuari_uq; ${index}`);
    await db.exec(rebase);
    assert.deepEqual(await defs(),before);
  });
  const town=id(21),alice=id(22),bob=id(23);
  await db.query("insert into public.towns(id,slug,name) values($1,'r32-test','Poble de prova')",[town]);
  for(const actor of [alice,bob]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[actor,`${actor}@example.invalid`,{full_name:actor===alice?'Alícia':'Bernat',tenant_id:town,accepta_rgpd:true}]);
    await db.query("insert into public.town_memberships(town_id,user_id) values($1,$2) on conflict do nothing",[town,actor]);
    await db.query('insert into private.normes_acceptades(usuari_id,versio) values($1,private.versio_normes_vigent()) on conflict do nothing',[actor]);
  }
  async function as(actor,sql,params=[]) {
    await db.exec('begin');try {
      await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)",[actor,JSON.stringify({sub:actor,role:'authenticated',aal:'aal1'})]);
      await db.exec('set local role authenticated');const r=await db.query(sql,params);await db.exec('commit');return r;
    }catch(error){await db.exec('rollback');throw error;}
  }
  const own=(await as(alice,'select public.crea_fil_directe($1,$2,null) id',[town,alice])).rows[0].id;
  const direct=(await as(alice,'select public.crea_fil_directe($1,$2,null) id',[town,bob])).rows[0].id;
  await as(alice,"select * from public.xat_envia($1,$2,'text','R32 dada pròpia',null,'{}')",[id(24),own]);
  const messages=(await db.query('select * from public.xat_missatges where fil_id=$1',[own])).rows;
  await t.test('the old historical source really fails on R24 rather than silently dropping receipt metadata',async()=>{
    await fails(db,read('supabase/migrations/2611121630_xat_propi.sql'),/cannot change return type/);
    assert.deepEqual(await defs(),before);
  });
  await t.test('two additive replays preserve all three modern RPC definitions and all own messages',async()=>{
    await db.exec(rebase);await db.exec(rebase);
    assert.deepEqual(await defs(),before);
    assert.deepEqual((await db.query('select * from public.xat_missatges where fil_id=$1',[own])).rows,messages);
    const rows=(await as(alice,'select * from public.xat_fils_meus($1)',[town])).rows;
    const mine=rows.find(r=>r.id===own);assert.ok(mine);assert.equal(mine.participants,1);assert.equal(mine.no_llegits,0);
    assert.ok('canal_clau' in mine);assert.ok('rebut_pels_altres_fins_seq' in mine);
    assert.equal(mine.rebut_pels_altres_fins_seq,0);assert.equal(mine.llegit_pels_altres_fins_seq,0);
    assert.equal((await as(alice,'select public.crea_fil_directe($1,$2,null) id',[town,alice])).rows[0].id,own);
    assert.equal((await as(bob,'select public.crea_fil_directe($1,$2,null) id',[town,alice])).rows[0].id,direct);
    assert.ok(!(await as(bob,'select * from public.xat_fils_meus($1)',[town])).rows.some(r=>r.id===own));
    await assert.rejects(as(bob,"select * from public.xat_envia($1,$2,'text','Alié',null,'{}')",[id(25),own]),/SDP-XAT-006/);
  });
  await t.test('empty production fossils remain absent after full replay and repeat hardening',async()=>{
    await db.exec(migration);assert.equal((await db.query('select count(*)::int n from private.r32_fossils_backup')).rows[0].n,0);
    assert.ok((await db.query(probe)).rows.every(r=>r.present===false));
  });
});
