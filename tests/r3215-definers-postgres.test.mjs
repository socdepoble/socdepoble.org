/** R32.15 offline SQL proof. Canonical fossil bytes, native18.6 and PGlite;
 * no production connection, network, package installation or hidden skips. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {startLocalPostgres} from './fixtures/postgres-local.mjs';
import {creaPlaMigracions} from '../tooling/node0/hidrata-postgres-node0.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const diagnostic=read('supabase/snippets/r32_15_diagnostic_definers_produccio.sql');
const hardening=read('supabase/snippets/r32_15_blinda_definers_heretats_idempotent.sql');
const fossilDDL=JSON.parse(read('tests/fixtures/r32-fossils.json'));
const signatures=Object.keys(fossilDDL).map(s=>'public.'+s);
const sha=s=>createHash('sha256').update(s).digest('hex');
const id=n=>`32150000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const BASELINE=process.env.SDP_R3215_SQL_BASELINE==='1';
const SNAP=`select p.oid,n.nspname,p.proname,p.proowner,p.proacl::text acl,p.proconfig,p.prosrc,
 pg_catalog.pg_get_functiondef(p.oid) ddl,pg_catalog.pg_get_function_identity_arguments(p.oid) args
 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
 where n.nspname in('public','private') and p.prosecdef order by p.oid`;
const snapshot=async db=>(await db.query(SNAP)).rows;
const view=async db=>(await db.query("select pg_get_viewdef('public.entity_member_map'::regclass) ddl,(select relowner from pg_class where oid='public.entity_member_map'::regclass) owner")).rows;
async function fixture(db,exec){
 await exec(`create role anon;create role authenticated;create role service_role;create schema private;create schema auth;
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::pg_catalog.uuid$$;
  grant usage on schema public,auth to anon,authenticated,service_role;
  create table public.market_items(author_user_id uuid,created_at timestamptz default now());
  create table public.push_subscriptions(last_used_at timestamptz);
  create table public.push_notifications_log(id uuid default gen_random_uuid(),user_id uuid,notification_type text,payload jsonb,success boolean,error_message text);
  create table public.messages(conversation_id uuid,sender_id uuid,read_at timestamptz);
  create table public.post_translations(post_id uuid);
  create table public.omega_posts(id uuid,uuid uuid,parent_id uuid,content text);
  create table public.entity_members(id integer);
  insert into public.entity_members values(1);
  create materialized view public.entity_member_map as select id from public.entity_members;
  create unique index r3215_entity_key on public.entity_member_map(id);`);
 for(const ddl of Object.values(fossilDDL))await exec(ddl);
 await exec(`grant execute on all functions in schema public to anon,authenticated,service_role;
  grant insert,select,update on public.market_items,public.omega_posts,public.entity_members to authenticated;
  create trigger r3215_market before insert on public.market_items for each row execute function public.check_market_rate_limit();
  create trigger r3215_parent before insert on public.omega_posts for each row execute function public.omega_set_default_parent_id();
  create trigger r3215_omega before update on public.omega_posts for each row execute function public.omega_invalidate_stale_translations();
  create trigger r3215_entity after insert on public.entity_members for each statement execute function public.refresh_entity_member_map();`);
}
async function as(db,who,sql,params=[]){
 await db.query('begin');
 try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[who??'']);await db.query(`set local role ${who?'authenticated':'anon'}`);const r=await db.query(sql,params);await db.query('commit');return r.rows;}
 catch(e){await db.query('rollback');throw e;}
}
async function suite(t,db,exec,cluster=null){
 await fixture(db,exec);const initial=await snapshot(db),originalView=await view(db);
 const triggers=async()=>(await db.query("select oid,tgname,tgenabled,pg_get_triggerdef(oid) ddl from pg_trigger where tgname like 'r3215_%' order by oid")).rows;
 const originalTriggers=await triggers();
 await t.test('diagnostic runs in READ ONLY and inventories exact canonical7 before repair',async()=>{
  await exec('begin read only');let rows;try{rows=(await db.query(diagnostic)).rows;}finally{await exec('rollback');}
  assert.equal(rows.length,7);assert.ok(rows.every(r=>r.dins_abast_blindatge&&r.public_execute&&r.anon_execute_directe&&r.anon_execute_efectiu&&r.authenticated_execute_directe&&r.authenticated_execute_efectiu));
  assert.ok(rows.every(r=>r.search_path_buit===false&&r.definicio_sha256===sha(r.definicio)&&r.propietari));
  assert.deepEqual(await snapshot(db),initial);
 });
 await t.test('hardens real reviewed bodies, preserves OIDs/owners/defaults/triggers and explicit auth/service grants',async()=>{
  if(!BASELINE)await exec(hardening);
  const rows=(await db.query(diagnostic)).rows;
  assert.equal(rows.length,7);assert.ok(rows.every(r=>r.search_path_buit&&!r.public_execute&&!r.anon_execute_directe&&!r.anon_execute_efectiu&&r.authenticated_execute_directe&&r.authenticated_execute_efectiu));
  const after=await snapshot(db);
  assert.deepEqual(after.map(r=>[r.oid,r.proowner,r.args]),initial.map(r=>[r.oid,r.proowner,r.args]));
  assert.deepEqual(await triggers(),originalTriggers);assert.deepEqual(await view(db),originalView);
  for(const signature of signatures)assert.equal((await db.query("select has_function_privilege('service_role',to_regprocedure($1),'EXECUTE') yes",[signature])).rows[0].yes,true);
  for(const r of after)assert.ok(r.proconfig?.includes('search_path=""'));
 });
 if(BASELINE)return;
 const safe=await snapshot(db),safeDDLs=new Map(safe.map(r=>[r.proname,r.ddl]));
 await t.test('second and third applications are no-ops on source, identity, ACL and trigger DDL',async()=>{
  await exec(hardening);await exec(hardening);assert.deepEqual(await snapshot(db),safe);assert.deepEqual(await triggers(),originalTriggers);
 });
 await t.test('qualified runtime uses public objects even with hostile temporary homonyms and types',async()=>{
  await exec(`create temp table push_subscriptions(last_used_at timestamptz);insert into pg_temp.push_subscriptions values(now()-interval '100 days');
   create temp table messages(conversation_id uuid,sender_id uuid,read_at timestamptz);
   create temp table market_items(author_user_id uuid,created_at timestamptz);
   create temp table push_notifications_log(id uuid);
   create domain pg_temp.uuid as pg_catalog.uuid check(false);
   create domain pg_temp.interval as pg_catalog.interval check(false);
   create domain pg_temp.timestamptz as pg_catalog.timestamptz check(false);`);
  try{
   // Force a fresh PL/pgSQL compilation in the presence of hostile types.
   await exec(hardening);await db.query("insert into public.push_subscriptions values(now()-pg_catalog.interval '100 days'),(now())");
   await as(db,id(1),'select public.clean_expired_push_subscriptions()');
   assert.equal((await db.query('select count(*)::int n from public.push_subscriptions')).rows[0].n,1);
   assert.equal((await db.query('select count(*)::int n from pg_temp.push_subscriptions')).rows[0].n,1);
   const log=(await as(db,id(1),'select public.log_push_notification($1::pg_catalog.uuid,$2::pg_catalog.text,$3::pg_catalog.jsonb,true,null) id',[id(1),'fixture',{local:true}]))[0].id;assert.ok(log);
   assert.equal((await db.query('select count(*)::int n from public.push_notifications_log')).rows[0].n,1);
   assert.equal((await db.query('select count(*)::int n from pg_temp.push_notifications_log')).rows[0].n,0);
   await db.query('insert into public.messages values($1,$2,null),($1,$3,null)',[id(2),id(1),id(3)]);
   await as(db,id(1),'select public.mark_messages_as_read($1::pg_catalog.uuid,$2::pg_catalog.uuid)',[id(2),id(1)]);
   assert.equal((await db.query('select count(*)::int n from public.messages where read_at is not null')).rows[0].n,1);
   for(let n=0;n<3;n++)await as(db,id(1),'insert into public.market_items(author_user_id) values($1::pg_catalog.uuid)',[id(1)]);
   await assert.rejects(as(db,id(1),'insert into public.market_items(author_user_id) values($1::pg_catalog.uuid)',[id(1)]),/Rate limit reached/);
   await as(db,id(1),'insert into public.omega_posts(id,uuid,content) values($1::pg_catalog.uuid,$1::pg_catalog.uuid,$2)',[id(4),'unchanged']);
   assert.equal((await db.query('select parent_id from public.omega_posts')).rows[0].parent_id,id(4));
   await assert.rejects(as(db,id(1),"update public.omega_posts set content='changed'"),/Traducciones eliminadas/);
   await as(db,id(1),'insert into public.entity_members values(2)');
   assert.equal((await db.query('select count(*)::int n from public.entity_member_map')).rows[0].n,2);
  }finally{await exec('drop domain pg_temp.timestamptz;drop domain pg_temp.interval;drop domain pg_temp.uuid');}
 });
 const restores=async()=>{for(const ddl of safeDDLs.values())await exec(ddl);await exec('revoke all on all functions in schema public from public,anon;grant execute on all functions in schema public to authenticated,service_role');};
 async function refuse(setup,cleanup,signature,code='55000'){
  await setup();const before=await snapshot(db),beforeTriggers=await triggers();
  try{await assert.rejects(exec(hardening),e=>e.code===code&&e.message.includes(signature));}finally{await exec('rollback');}
  assert.deepEqual(await snapshot(db),before,'failure cannot mutate any earlier candidate');assert.deepEqual(await triggers(),beforeTriggers);
  await cleanup();await restores();
 }
 const original=fossilDDL['omega_set_default_parent_id()'];
 const injected=[
  ['dynamic EXECUTE',"EXECUTE 'SELECT 1';"],
  ['unqualified call','PERFORM version();'],
  ['qualified unknown call','PERFORM public.unreviewed();'],
  ['quoted identifier','PERFORM "pg_catalog"."version"();'],
  ['comment claims safety','/* pg_catalog.version() qualified */ PERFORM version();'],
  ['quoted literal claims safety',"PERFORM 'pg_catalog.version() EXECUTE DELETE';"],
  ['dollar quoted literal claims safety',"PERFORM $quoted$pg_catalog.version()$quoted$;"],
  ['unqualified relation hidden by comment','PERFORM 1 /* public.market_items */ FROM market_items;'],
  ['operator lookup','IF 1 OPERATOR(public.=) 1 THEN RETURN NEW; END IF;'],
  ['nested comments','/* outer /* pg_catalog.version() */ outer */ PERFORM version();'],
  ['string comment delimiters',"PERFORM '-- /* */ public.foo()';"],
  ['benign added comment is still unreviewed','/* added comment: review required */']
 ];
 for(const [name,code] of injected)await t.test('fail closed on canonical-name body mutant: '+name,async()=>{
  const mutant=original.replace('IF NEW.parent_id',code+'\n        IF NEW.parent_id');assert.notEqual(mutant,original);
  await refuse(()=>exec(mutant),async()=>{},'public.omega_set_default_parent_id');
 });
 await t.test('unknown fully qualified function after all known OIDs aborts the entire set',async()=>{
  await refuse(async()=>{
   await exec("alter function public.check_market_rate_limit() set search_path=public;grant execute on function public.check_market_rate_limit() to public,anon");
   await exec("create function public.r3215_unknown() returns int language sql security definer set search_path=public as $$select pg_catalog.length('literal EXECUTE')$$");
  },()=>exec('drop function public.r3215_unknown()'),'public.r3215_unknown');
 });
 await t.test('unknown overload cannot borrow the proof of a reviewed name',async()=>{
  await refuse(()=>exec("create function public.omega_set_default_parent_id(pg_catalog.text) returns pg_catalog.int4 language sql security definer set search_path=public as $$select 1$$"),()=>exec('drop function public.omega_set_default_parent_id(text)'),'public.omega_set_default_parent_id');
 });
 await t.test('unknown per-function GUC aborts instead of silently removing configuration',async()=>{
  await refuse(()=>exec("alter function public.omega_set_default_parent_id() set statement_timeout='5s'"),()=>exec('alter function public.omega_set_default_parent_id() reset statement_timeout'),'public.omega_set_default_parent_id');
 });
 await t.test('changed default expression is rejected even with an identical reviewed body',async()=>{
  const ddl=safeDDLs.get('log_push_notification'),mutant=ddl.replace(/DEFAULT NULL::text/,"DEFAULT 'changed'::text");assert.notEqual(mutant,ddl);
  await refuse(()=>exec(mutant),async()=>{},'public.log_push_notification');
 });
 await t.test('request owner authority is refused and ownership is not changed by the script',async()=>{
  await refuse(()=>exec('alter function public.omega_set_default_parent_id() owner to authenticated'),()=>exec('alter function public.omega_set_default_parent_id() owner to postgres'),'public.omega_set_default_parent_id');
 });
 await t.test('inherited owner authority cannot be removed by a direct REVOKE',async()=>{
  await refuse(()=>exec('grant postgres to authenticated'),()=>exec('revoke postgres from authenticated'),'public.check_market_rate_limit');
 });
 await t.test('NOINHERIT delegation with SET ROLE authority to owner also fails closed',async()=>{
  await exec('create role r3215_delegated_owner;grant postgres to r3215_delegated_owner');
  await refuse(async()=>{
   await exec('grant r3215_delegated_owner to authenticated with inherit false,set true');
   const authority=(await db.query("select pg_has_role('authenticated','postgres','USAGE') inherited,pg_has_role('authenticated','postgres','MEMBER') member,pg_has_role('authenticated','postgres','SET') can_set")).rows[0];
   assert.equal(authority.inherited,false);assert.equal(authority.member,true);assert.equal(authority.can_set,true);
  },()=>exec('revoke r3215_delegated_owner from authenticated'),'public.check_market_rate_limit');
 });
 await t.test('unexpected custom grant is not rewritten or revoked blindly',async()=>{
  await exec('create role r3215_custom');
  await refuse(()=>exec('grant execute on function public.omega_set_default_parent_id() to r3215_custom'),()=>exec('revoke execute on function public.omega_set_default_parent_id() from r3215_custom'),'public.omega_set_default_parent_id');
 });
 await t.test('public schema writable by a request role aborts safely',async()=>{
  await refuse(()=>exec('grant create on schema public to authenticated'),()=>exec('revoke create on schema public from authenticated'),'public.check_market_rate_limit');
 });
 await t.test('a qualified relation with a request owner is not a trusted dependency',async()=>{
  await refuse(()=>exec('alter table public.messages owner to authenticated'),()=>exec('alter table public.messages owner to postgres'),'public.mark_messages_as_read');
 });
 await t.test('a domain-shaped dependency cannot smuggle an operator/type implementation',async()=>{
  await exec('create domain public.r3215_uuid as uuid');
  await refuse(()=>exec('alter table public.messages alter column sender_id type public.r3215_uuid'),()=>exec('alter table public.messages alter column sender_id type pg_catalog.uuid'),'public.mark_messages_as_read');
 });
 await t.test('caller namespace order is preserved and unknown operator lookup fails closed',async()=>{
  await exec('create schema r3215_caller;set search_path=r3215_caller,pg_catalog,public');const before=(await db.query("select current_setting('search_path') path")).rows[0].path;
  try{await assert.rejects(exec(hardening),e=>e.code==='55000'&&e.message.includes('SDP-R3215-CALLER'));}finally{await exec('rollback');}
  assert.equal((await db.query("select current_setting('search_path') path")).rows[0].path,before);await exec('set search_path=public');
 });
 await t.test('diagnostic never invokes operators from an untrusted caller schema',async()=>{
  await exec(`create schema r3215_operator;
   create function r3215_operator.eq_name(a name,b name) returns boolean language plpgsql as $$begin perform pg_catalog.set_config('r3215.operator_called','yes',false);return a OPERATOR(pg_catalog.=) b;end$$;
   create function r3215_operator.eq_text(a text,b text) returns boolean language plpgsql as $$begin perform pg_catalog.set_config('r3215.operator_called','yes',false);return a OPERATOR(pg_catalog.=) b;end$$;
   create operator r3215_operator.= (leftarg=name,rightarg=name,function=r3215_operator.eq_name);
   create operator r3215_operator.= (leftarg=text,rightarg=text,function=r3215_operator.eq_text);
   set search_path=r3215_operator,pg_catalog,public;select pg_catalog.set_config('r3215.operator_called','',false);`);
  try{
   // Use a read-only transaction too: SET_CONFIG is permitted there and thus
   // reliably detects an invoked hostile operator without touching any table.
   await exec('begin read only');const rows=(await db.query(diagnostic)).rows;assert.equal(rows.filter(r=>r.dins_abast_blindatge).length,7);await exec('commit');
   assert.equal((await db.query("select pg_catalog.current_setting('r3215.operator_called',true) marker")).rows[0].marker,'');
  }finally{await exec('rollback;set search_path=public');}
 });
 await t.test('diagnostic includes an application schema outside mutation scope and reports ACL inheritance honestly',async()=>{
  await exec("create schema r3215_inventory;create function r3215_inventory.custom() returns integer language sql security definer set search_path='' as $$select 1$$");
  const rows=(await db.query(diagnostic)).rows,row=rows.find(r=>r.esquema==='r3215_inventory');assert.ok(row);assert.equal(row.dins_abast_blindatge,false);assert.equal(row.public_execute,true);assert.equal(row.anon_execute_directe,false);assert.equal(row.anon_execute_efectiu,true);assert.equal(row.definicio_sha256,sha(row.definicio));
  await exec(hardening);assert.equal((await db.query(diagnostic)).rows.find(r=>r.esquema==='r3215_inventory').definicio_sha256,row.definicio_sha256);
 });
 if(cluster){
  const a=await cluster.connect(),b=await cluster.connect();
  const pa=(await a.query('select pg_backend_pid() p')).rows[0].p,pb=(await b.query('select pg_backend_pid() p')).rows[0].p;assert.notEqual(pa,pb);
  t.diagnostic(JSON.stringify({nativeIndependentBackendPids:[pa,pb],isolation:'read committed',lockKey:[1935960372,1732150000]}));
  const barrier=async()=>{const until=Date.now()+3000;while(Date.now()<until){if((await db.query('select $1=any(pg_blocking_pids($2)) blocked',[pa,pb])).rows[0].blocked)return;await new Promise(resolve=>setImmediate(resolve));}assert.fail('Expected independent-session advisory wait was not observed');};
  for(const outcome of['commit','rollback'])await t.test('native advisory lock serializes replay after holder '+outcome,async()=>{
   const before=await snapshot(db);await a.query('begin isolation level read committed');await a.query('select pg_advisory_xact_lock(1935960372,1732150000)');
   const pending=b.query(hardening).then(()=>({ok:true}),error=>({error}));
   try{await barrier();assert.deepEqual(await snapshot(db),before);await a.query(outcome);const result=await pending;assert.equal(result.error,undefined,result.error?.message);assert.equal(result.ok,true);assert.deepEqual(await snapshot(db),before);}
   finally{await a.query('rollback');await b.query('rollback');}
  });
  await t.test('native waiting installer observes a newly committed unknown routine and aborts all changes',async()=>{
   await a.query('begin isolation level read committed');await a.query('select pg_advisory_xact_lock(1935960372,1732150000)');
   const pending=b.query(hardening).then(()=>({ok:true}),error=>({error}));
   try{await barrier();await a.query("create function public.r3215_late() returns int language sql security definer set search_path=public as $$select 1$$");await a.query('commit');const before=await snapshot(db),result=await pending;assert.equal(result.error?.code,'55000');assert.match(result.error.message,/public\.r3215_late/);await b.query('rollback');assert.deepEqual(await snapshot(db),before);}
   finally{await a.query('rollback');await b.query('rollback');await db.query('drop function if exists public.r3215_late()');}
  });
 }
 t.diagnostic(JSON.stringify({hardeningSHA256:sha(hardening),diagnosticSHA256:sha(diagnostic),canonicalFossilFixtureSHA256:sha(read('tests/fixtures/r32-fossils.json')),network:'disabled by task; no remote DB'}));
}
test('R32.15 definers native PostgreSQL18.6 canonical capsules and adversarial mutants',{timeout:180000},async t=>{
 const c=await startLocalPostgres({dataRoot:'/tmp/sdp_r32_15_pg'});t.after(()=>c.close());const nativeVersion=(await c.db.query('show server_version')).rows[0].server_version;assert.match(nativeVersion,/^18\.6(?:\s|$)/);t.diagnostic(JSON.stringify({engine:'native',serverVersion:nativeVersion}));await suite(t,c.db,s=>c.db.query(s),c);
});
test('R32.15 definers PGlite canonical capsules and adversarial mutants',{timeout:180000},async t=>{
 assert.ok(process.env.SDP_PGLITE_MODULE,'SDP_PGLITE_MODULE local path required: never silently skip');const {PGlite}=await import(pathToFileURL(process.env.SDP_PGLITE_MODULE).href);const db=new PGlite();t.after(()=>db.close());t.diagnostic(JSON.stringify({engine:'pglite',serverVersion:(await db.query('show server_version')).rows[0].server_version}));await suite(t,db,s=>db.exec(s));
});
test('R32.15 full canonical app catalog is a non-destructive no-op when no legacy capsule is present',{timeout:180000},async t=>{
 assert.ok(process.env.SDP_PGLITE_MODULE,'SDP_PGLITE_MODULE local path required: never silently skip');const url=pathToFileURL(process.env.SDP_PGLITE_MODULE),{PGlite}=await import(url.href),{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',url));const db=new PGlite({extensions:{pgcrypto}});t.after(()=>db.close());
 const plan=creaPlaMigracions();await db.exec(plan.bootstrap);for(const m of plan.migrations)try{await db.exec(m.sql);}catch(e){await db.exec('rollback');throw Error(m.file+': '+e.message,{cause:e});}
 const before=await snapshot(db);await db.exec(hardening);await db.exec(hardening);assert.deepEqual(await snapshot(db),before);assert.equal((await db.query(diagnostic)).rows.filter(r=>r.dins_abast_blindatge&&!r.search_path_buit).length,0);
});

test('R32.15 accepts the canonical R32/R32.10 postimages without rewriting their historical backup pins',{timeout:180000},async t=>{
 assert.ok(process.env.SDP_PGLITE_MODULE,'SDP_PGLITE_MODULE local path required: never silently skip');const {PGlite}=await import(pathToFileURL(process.env.SDP_PGLITE_MODULE).href);const db=new PGlite();t.after(()=>db.close());await fixture(db,s=>db.exec(s));
 await db.exec(read('supabase/migrations/20261116170000_r32_fossils_search_path.sql'));await db.exec(read('supabase/snippets/r32_10_fossils_acl_enduriment.sql'));
 const backups=async()=>(await db.query('select (select jsonb_agg(to_jsonb(x) order by signature) from private.r32_fossils_backup x) r32,(select jsonb_agg(to_jsonb(x) order by signature) from private.r3210_fossils_acl_backup x) r3210')).rows;
 const before=await snapshot(db),originalBackups=await backups();await db.exec(hardening);const after=await snapshot(db);await db.exec(hardening);assert.deepEqual(await snapshot(db),after);assert.deepEqual(await backups(),originalBackups);
 assert.deepEqual(after.map(r=>[r.oid,r.proowner,r.acl,r.args]),before.map(r=>[r.oid,r.proowner,r.acl,r.args]));
 for(const r of (await db.query(diagnostic)).rows)assert.ok(r.search_path_buit&&!r.public_execute&&!r.anon_execute_efectiu&&!r.authenticated_execute_efectiu);
 // The old preimage pins must detect the newer body; never silently repin history.
 try{await assert.rejects(db.exec(read('supabase/snippets/r32_10_fossils_acl_enduriment.sql')),e=>e.code==='55000');}finally{await db.exec('rollback');}
 assert.deepEqual(await snapshot(db),after);
});
