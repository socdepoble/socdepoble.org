import {tableFingerprintSQL,functionFingerprintSQL} from '../tooling/migrations/r32_14_sql_contracte.mjs';
/** Disposable native PostgreSQL 18.6 + PGlite. Never opens a remote connection. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {creaPlaMigracions} from '../tooling/node0/hidrata-postgres-node0.mjs';
import {startLocalPostgres} from './fixtures/postgres-local.mjs';
import {sources,generate} from '../tooling/migrations/genera-super-bundle-r32_14.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const id=n=>`32140000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const TOWN=id(1),A=id(2),B=id(3),OUT=id(4),FIL=id(5);
test('R32.14 generator fails closed when the required SQL guard contract is absent',()=>{
 assert.throws(()=>generate({contractPath:'tooling/migrations/required-missing-contract.json'}),e=>e.code==='ENOENT');
});
test('R32.14 CLI is read-only, stdout is exact SQL and unsupported write modes fail closed',()=>{
 const source=new URL('../supabase/snippets/r32_14_super_bundle_produccio_pendent.sql',import.meta.url);
 const before=fs.statSync(source).mtimeMs,sql=fs.readFileSync(source,'utf8');
 const script=fileURLToPath(new URL('../tooling/migrations/genera-super-bundle-r32_14.mjs',import.meta.url));
 const run=(...args)=>spawnSync(process.execPath,[script,...args],{encoding:'utf8',maxBuffer:4*1024*1024});
 const emitted=run('--stdout');assert.equal(emitted.status,0,emitted.stderr);assert.equal(emitted.stdout,sql);
 const checked=run('--check');assert.equal(checked.status,0,checked.stderr);assert.equal(JSON.parse(checked.stdout).bytes,Buffer.byteLength(sql));
 const invalid=run('--write');assert.notEqual(invalid.status,0);assert.match(invalid.stderr,/Usage/);
 assert.equal(fs.statSync(source).mtimeMs,before);assert.equal(fs.readFileSync(source,'utf8'),sql);
});
const pending=new Set(sources.filter(x=>x.includes('/migrations/')).map(x=>x.split('/').at(-1)));
const FN_NAMES=[...new Set(sources.flatMap(file=>[...read(file).matchAll(/create (?:or replace )?function (public|private)\.([a-z0-9_]+)/gi)].map(m=>`${m[1]}.${m[2]}`)))];
const TABLE_NAMES=[...new Set(sources.flatMap(file=>[...read(file).matchAll(/create table (?:if not exists )?(public|private)\.([a-z0-9_]+)/gi)].map(m=>`${m[1]}.${m[2]}`)))];

async function capture(db){
 const tables={};for(const name of TABLE_NAMES){const row=(await db.query(tableFingerprintSQL,[name])).rows[0];if(row)tables[name]=row.shape;}
 const functions=(await db.query(functionFingerprintSQL,[FN_NAMES])).rows;
 const triggers=(await db.query("select tgname,pg_get_triggerdef(oid) ddl,tgenabled from pg_trigger where tgrelid='public.denuncies'::regclass and tgname in ('r3213_lssi_insercio','r3213_lssi_decisio','denuncies_abans_insercio') order by tgname")).rows;
 return {tables,functions,triggers};
}
async function actor(db,who,sql,params=[]){
 await db.query('begin isolation level read committed');
 try{await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",[who??'',who?'authenticated':'anon',JSON.stringify({sub:who,role:who?'authenticated':'anon',aal:'aal2'})]);await db.query(`set local role ${who?'authenticated':'anon'}`);const result=await db.query(sql,params);await db.query('commit');return result.rows;}
 catch(e){await db.query('rollback');throw e;}
}
const inbox=(db,who)=>actor(db,who,'select * from public.xat_fils_meus($1)',[TOWN]).then(rows=>rows.find(r=>r.id===FIL));
const hide=(db,who,n)=>actor(db,who,'select public.xat_elimina_per_a_mi($1,$2)',[FIL,id(n)]);
async function bootstrap(db,exec,partial){
 const plan=creaPlaMigracions();await exec(plan.bootstrap);
 for(const m of plan.migrations.filter(m=>!pending.has(m.file))){try{await exec(m.sql);}catch(e){await exec('rollback');throw Error(m.file+': '+e.message,{cause:e});}}
 if(partial){
  for(const ddl of Object.values(JSON.parse(read('tests/fixtures/r32-fossils.json'))))await exec(ddl);
  await exec(read('supabase/migrations/20261116170000_r32_fossils_search_path.sql'));
  for(const file of sources.slice(0,3))await exec(read(file));
  await exec(read('supabase/snippets/r32_13_pf03_crdt_ack_i_lssi_denuncies.sql'));
 }
 await exec(read('supabase/snippets/r32_11_publicacions_cas.sql'));
}
async function fixture(db){
 await db.query("insert into public.towns(id,slug,name) values($1,'r3214-fixture','Poble sintètic R32.14')",[TOWN]);
 for(const who of[A,B,OUT]){
  await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[who,`${who}@example.invalid`,{full_name:'Veí sintètic R32.14',tenant_id:TOWN,accepta_rgpd:true}]);
  await db.query('insert into private.normes_acceptades(usuari_id,versio) values($1,private.versio_normes_vigent()) on conflict do nothing',[who]);
 }
 await db.query("insert into public.xat_fils(id,tenant_id,tipus,titol,creat_per) values($1,$2,'grup','Fixture R32.14',$3)",[FIL,TOWN,A]);
 await db.query('insert into public.xat_participants(fil_id,usuari_id) select $1,u from unnest($2::uuid[]) u',[FIL,[A,B]]);
 await db.query("insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,payload,visibility) values($1,$2,$3,'mur','Legacy case',$4,'public')",[id(30),TOWN,A,{content:'R3214 old report',status:'published',visibility:'public'}]);
 await actor(db,B,"select public.denuncia_publicacio_mur($1,'altre','Legacy R3214 report')",[id(30)]);
 for(const [n,text] of[[10,'first visible'],[11,'second visible'],[12,'last hidden only for A']])await actor(db,A,"select * from public.xat_envia($1,$2,'text',$3,null,'{}')",[id(n),FIL,text]);
}
async function suite(t,db,exec,cluster,partial){
 await bootstrap(db,exec,partial);
 const original=(await db.query("select p.oid,pg_get_functiondef(p.oid) ddl,proacl::text acl,(select jsonb_agg(jsonb_build_array(r,pg_catalog.has_function_privilege(r,p.oid,'EXECUTE')) order by r) from unnest(array['anon','authenticated','service_role']) r) effective from pg_proc p where p.oid='public.publica_section_submission_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamptz,uuid)'::regprocedure")).rows;
 const before=await capture(db);await fixture(db);
 // Red oracle: the original inbox leaks the hidden preview before this migration.
 if(!partial){await exec(read(sources[0]));await hide(db,A,12);assert.equal((await inbox(db,A)).ultim_text,'last hidden only for A');}
 const sql=read('supabase/snippets/r32_14_super_bundle_produccio_pendent.sql');
 await exec(sql);const installed=await capture(db);
 const data=async()=>(await db.query('select (select count(*) from private.r3213_lssi_audit)::int audit,(select count(*) from private.r3213_lssi_flux)::int flux,(select count(*) from public.xat_missatges)::int messages,(select count(*) from private.r32_fossils_backup)::int fossils')).rows;
 const first=await data();await exec(sql);
 await t.test('two complete executions are idempotent, retain data and preinstalled publication CAS',async()=>{
  assert.deepEqual(await capture(db),installed);assert.deepEqual(await data(),first);
  assert.deepEqual((await db.query("select p.oid,pg_get_functiondef(p.oid) ddl,proacl::text acl,(select jsonb_agg(jsonb_build_array(r,pg_catalog.has_function_privilege(r,p.oid,'EXECUTE')) order by r) from unnest(array['anon','authenticated','service_role']) r) effective from pg_proc p where p.oid='public.publica_section_submission_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamptz,uuid)'::regprocedure")).rows,original);
  assert.equal(first[0].fossils,partial?7:0);assert.ok(first[0].audit>=1);assert.equal(first[0].flux,1);
  assert.equal(generate(),sql,'standalone file equals deterministic generator');
  const post=(await db.query(read('supabase/snippets/r32_14_postverificacio_produccio_pendent.sql'))).rows[0];assert.ok(Object.values(post).every(v=>v===true),JSON.stringify(post));
 });
 if(process.env.SDP_R3214_CAPTURE){fs.mkdirSync(process.env.SDP_R3214_CAPTURE,{recursive:true});fs.writeFileSync(`${process.env.SDP_R3214_CAPTURE}/${cluster?'native':'pglite'}-${partial?'partial':'clean'}.json`,JSON.stringify({before,installed},null,2));}
 await t.test('server preview follows each actor hidden set before any client thread load',async()=>{
  await hide(db,A,12);
  const a=await inbox(db,A),b=await inbox(db,B);
  assert.equal(a.ultim_text,'second visible');assert.equal(b.ultim_text,'last hidden only for A');
  assert.ok(new Date(a.ultim_al)<=new Date(b.ultim_al));assert.equal(a.ultim_seq,b.ultim_seq);assert.equal(Number(a.ultim_seq),3);
  assert.equal(a.ultim_autor_id,A);assert.equal(a.ultim_tipus,'text');
  await hide(db,A,11);assert.equal((await inbox(db,A)).ultim_text,'first visible');
  await hide(db,A,10);const empty=await inbox(db,A);
  for(const field of['ultim_text','ultim_al','ultim_autor_id','ultim_tipus'])assert.equal(empty[field],null);
  assert.equal((await inbox(db,B)).ultim_text,'last hidden only for A');
 });
 await t.test('anonymous and outsiders cannot enumerate; hidden storage remains inaccessible',async()=>{
  await assert.rejects(inbox(db,null),e=>e.code==='42501');assert.equal(await inbox(db,OUT),undefined);
  for(const who of[A,B,OUT])await assert.rejects(actor(db,who,'select * from public.xat_missatges_amagats'),e=>e.code==='42501');
  await assert.rejects(hide(db,OUT,12),e=>e.code==='42501');
 });
 await t.test('deleted, expired and cleared history cannot reappear as preview',async()=>{
  await db.query('update public.xat_missatges set esborrat_al=now() where id=$1',[id(12)]);
  assert.equal((await inbox(db,B)).ultim_text,'second visible');
  await db.query("update public.xat_missatges set caduca_al=now()-interval '1 second' where id=$1",[id(11)]);
  assert.equal((await inbox(db,B)).ultim_text,'first visible');
  await db.query('update public.xat_participants set buidat_fins_seq=1 where fil_id=$1 and usuari_id=$2',[FIL,B]);
  assert.equal((await inbox(db,B)).ultim_text,null);
  await db.query('update public.xat_missatges set esborrat_al=null,caduca_al=null where fil_id=$1',[FIL]);
  await db.query('update public.xat_participants set buidat_fins_seq=0 where fil_id=$1',[FIL]);
  await db.query('delete from public.xat_missatges_amagats where usuari_id=$1',[A]);
 });
 if(cluster){
  const a=await cluster.connect(),b=await cluster.connect();const pa=(await a.query('select pg_backend_pid() p')).rows[0].p,pb=(await b.query('select pg_backend_pid() p')).rows[0].p;assert.notEqual(pa,pb);t.diagnostic(JSON.stringify({independentBackendPids:[pa,pb],isolation:'read committed'}));
  await t.test('native concurrent sessions: uncommitted A hide, commit, own session B and rollback',async()=>{
   for(const outcome of['commit','rollback']){
    await db.query('delete from public.xat_missatges_amagats');
    await a.query('begin isolation level read committed');await a.query("select set_config('request.jwt.claim.sub',$1,true)",[A]);await a.query('set local role authenticated');
    await a.query('select public.xat_elimina_per_a_mi($1,$2)',[FIL,id(12)]);
    assert.equal((await a.query('select * from public.xat_fils_meus($1)',[TOWN])).rows.find(r=>r.id===FIL).ultim_text,'second visible');
    assert.equal((await inbox(b,A)).ultim_text,'last hidden only for A');assert.equal((await inbox(b,B)).ultim_text,'last hidden only for A');
    await a.query(outcome);assert.equal((await inbox(b,A)).ultim_text,outcome==='commit'?'second visible':'last hidden only for A');assert.equal((await inbox(b,B)).ultim_text,'last hidden only for A');
   }
  });
 }
 await t.test('super-bundle atomic rollback leaves earlier sections intact on deliberate late failure',async()=>{
  const baseline=await capture(db),rows=await data();
  const poisoned=sql.replace("notify pgrst,'reload schema';\ncommit;",()=>"do $$ begin raise exception 'r3214-rollback-probe'; end $$;\ncommit;");assert.notEqual(poisoned,sql);
  try{await assert.rejects(exec(poisoned),/r3214-rollback-probe/);}finally{await exec('rollback');}
  assert.deepEqual(await capture(db),baseline);assert.deepEqual(await data(),rows);
 });
 if(!process.env.SDP_R3214_CAPTURE)await t.test('unknown existing schema and function drift abort without replacement',async()=>{
  const ddl=(await db.query("select pg_get_functiondef('public.xat_alterna_destacat(uuid,uuid,boolean)'::regprocedure) ddl")).rows[0].ddl;
  await db.query("create or replace function public.xat_alterna_destacat(p_fil_id uuid,p_missatge_id uuid,p_actiu boolean) returns jsonb language sql as $$select '{}'::jsonb$$");
  try{await assert.rejects(exec(sql),/SDP-R3214-DRIFT/);}finally{await exec('rollback');await db.query(ddl);}
  await db.query('alter table private.r3213_crdt_captures add column unexpected text');
  try{await assert.rejects(exec(sql),/SDP-R3214-DRIFT/);}finally{await exec('rollback');await db.query('alter table private.r3213_crdt_captures drop column unexpected');}
 });
 t.diagnostic(JSON.stringify({engine:cluster?'native PostgreSQL 18.6':'PGlite',scenario:partial?'partial + 7 fossils + R32.11 + R32.13 installed':'clean pending + R32.11 installed',bundleSHA256:createHash('sha256').update(sql).digest('hex')}));
}
for(const partial of[false,true])test(`R32.14 native18.6 super-bundle ${partial?'partial':'clean'} + private inbox`,{timeout:240000},async t=>{
 const c=await startLocalPostgres({dataRoot:'/tmp/sdp_r32_14_pg'});t.after(()=>c.close());assert.match((await c.db.query('show server_version')).rows[0].server_version,/^18\.6(?:\s|$)/);await suite(t,c.db,sql=>c.db.query(sql),c,partial);
});
for(const partial of[false,true])test(`R32.14 PGlite super-bundle ${partial?'partial':'clean'} parity`,{timeout:240000},async t=>{
 assert.ok(process.env.SDP_PGLITE_MODULE,'PGlite explicit module required; never skipped');const url=pathToFileURL(process.env.SDP_PGLITE_MODULE),{PGlite}=await import(url.href),{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',url));
 const pg=new PGlite({extensions:{pgcrypto}});t.after(()=>pg.close());await suite(t,pg,sql=>pg.exec(sql),null,partial);
});
