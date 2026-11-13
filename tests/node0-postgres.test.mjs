import fs from 'node:fs';
import path from 'node:path';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaPlaMigracions, preparaHidratacio, cosMigracio, generaSql, aplicaAmbPsql, validaEntornLocal, main, ROOT, SHA256_ZIP_CANONIC, uuidMunicipi, dataHoraMunicipal } from '../tooling/node0/hidrata-postgres-node0.mjs';

const plan = creaPlaMigracions();
const local = { PGHOST: '/tmp', PGDATABASE: 'socdepoble_node0', PGUSER: 'node0_operator' };
test('catalogue is complete, canonical ordered and records exact source hashes', () => {
  const files=fs.readdirSync(path.join(ROOT,'supabase/migrations')).filter(f=>/^(?:\d{10}|\d{14})_.+\.sql$/.test(f));
  assert.equal(plan.migrations.length,files.length);
  assert.equal(new Set(plan.migrations.map(m=>m.version)).size,files.length);
  const i=v=>plan.migrations.findIndex(m=>m.version===v);
  assert.equal(i('2610312000'),i('2610311800')+1);assert.ok(i('2610312000')<i('2610311900'));
  assert.ok(plan.migrations.every(m=>/^[0-9a-f]{64}$/.test(m.sha256)));
});
test('transaction folding never removes function body tokens or quoted comments',()=>{
  const body="CREATE FUNCTION a() RETURNS void LANGUAGE plpgsql AS $$BEGIN; COMMIT; END$$;";
  assert.ok(cosMigracio('BEGIN;\n'+body+'\nCOMMIT;').includes(body));
  assert.equal(cosMigracio(body),body);
  assert.throws(()=>cosMigracio('BEGIN;SELECT 1;COMMIT;BEGIN;SELECT 2;COMMIT;'),/transaction_not_supported/);
});
test('only dedicated local database with explicit operator, no service or host override',()=>{
  assert.doesNotThrow(()=>validaEntornLocal(local));
  for(const altered of [{PGHOST:'192.168.0.23'},{PGHOST:'/tmp,remote.example'},{PGHOST:'localhost'},{PGHOST:''},{PGDATABASE:'postgres'},{PGDATABASE:'x;DROP DATABASE y'},{PGUSER:'node0_runtime'},{PGSERVICE:'x'},{PGOPTIONS:'-c role=postgres'},{PGHOSTADDR:'10.0.0.1'}]) {
    assert.throws(()=>validaEntornLocal({...local,...altered}));
  }
});
test('psql has no shell or secret arguments and suppresses echoed SQL errors',()=>{
  let seen;
  assert.deepEqual(aplicaAmbPsql(("SELEC" + "T 1;"), {env:{...local,PGPASSWORD:("secret-s" + "entinel")},run:(cmd,args,opts)=>{
    seen={cmd,args,opts};return {status:0,stdout:'secret-sentinel',stderr:''};
  }}),{applied:true});
  assert.equal(seen.opts.shell,false);assert.equal(seen.opts.input,'SELECT 1;');
  assert.ok(!seen.args.some(s=>s.includes('secret-sentinel')));assert.ok(seen.args.includes('-w'));
  assert.throws(()=>aplicaAmbPsql('bad SQL',{env:local,run:()=>({status:1,stderr:'secret-sentinel'})}),e=>e.message==='node0_psql_apply_failed');
});
test('dry-run validates without touching PostgreSQL or trusting env connection',async()=>{
  const output=[];const errors=[];
  assert.equal(await main([],{env:{},stdout:{write:s=>output.push(s)},stderr:{write:s=>errors.push(s)}}),0);
  assert.equal(JSON.parse(output.join('')).applied,false);assert.deepEqual(errors,[]);
});
test('real Open Data ZIP pin validates, no fictional market or personal accounts',async()=>{
  const hydration=await preparaHidratacio();
  assert.equal(hydration.sha256,SHA256_ZIP_CANONIC);assert.equal(hydration.version,'1.2.0');
  assert.equal(hydration.municipalityId,uuidMunicipi(hydration.municipality));
  assert.match(hydration.municipalityId,/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(hydration.documents.filter(d=>d.kind==='agents').length,3);
  assert.equal(hydration.documents.filter(d=>d.kind==='feedPosts').length,1);
  assert.equal(hydration.documents.filter(d=>d.kind==='events').length,1);
  const event=hydration.documents.find(d=>d.kind==='events').document;
  assert.equal(event.date,'2023-11-26');assert.equal(event.time,'10:30');
  assert.equal(event.inici,'2023-11-26T10:30:00+01:00');assert.equal(event.fi,'2023-11-26T13:30:00+01:00');
  assert.deepEqual(dataHoraMunicipal('2026-01-01T00:15:00+14:00'),{date:'2026-01-01',time:'00:15'});
  assert.deepEqual(dataHoraMunicipal('2026-01-01T23:50:00-12:00'),{date:'2026-01-01',time:'23:50'});
  assert.deepEqual(dataHoraMunicipal('2026-01-01'),{date:'2026-01-01'});
  assert.deepEqual(dataHoraMunicipal('2026-02-31T10:00:00Z'),{});
  assert.deepEqual(dataHoraMunicipal('2026-01-01T24:00:00Z'),{});
  assert.equal(hydration.documents.filter(d=>['perfils','mercat'].includes(d.kind)).length,0);
  await assert.rejects(preparaHidratacio({sha256Esperat:'0'.repeat(64)}));
});
  test('all canonical PostgreSQL migrations, bootstrap, hydration, idempotence and failclosed ledger',async()=>{
    const cluster=await startLocalPostgres();
    const db={query:(...args)=>cluster.db.query(...args),exec:sql=>cluster.db.query(sql),close:()=>cluster.close()};
    try {
    assert.match((await db.query('select version() AS version')).rows[0].version,/PostgreSQL 18\.6(?:\s|$)/);
      const h=await preparaHidratacio();
      const sql=generaSql(plan,h,{advisoryLock:false});
      await db.exec(sql);
      assert.equal((await db.query('SELECT count(*)::int AS n FROM node0.schema_migrations')).rows[0].n,plan.migrations.length);
      assert.equal((await db.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,h.documents.length);
      assert.equal((await db.query('SELECT count(*)::int AS n FROM auth.users')).rows[0].n,0);
      assert.equal((await db.query('SELECT count(*)::int AS n FROM public.towns')).rows[0].n,1);
      assert.equal((await db.query('SELECT count(*)::int AS n FROM public.app_content')).rows[0].n,5);
      assert.equal((await db.query('SELECT jsonb_array_length(payload) AS n FROM public.app_content WHERE key=$1',['agents'])).rows[0].n,3);
      assert.equal((await db.query('SELECT count(*)::int AS n FROM public.organizations')).rows[0].n,0);
      // Refute a fictitious institutional owner: canonical trigger rejects a
      // real organization row with created_by NULL. Never disable that trigger.
      await assert.rejects(db.query("INSERT INTO public.organizations(tenant_id,slug,name,kind,created_by) VALUES($1,'sense-persona','Entitat pública','entity',NULL)",[h.municipalityId]),e=>e.code==='23502');
      await db.query("UPDATE public.app_content SET payload='[{\"id\":\"curated-local\"}]'::jsonb WHERE key='feedPosts'");
      await db.query("UPDATE public.towns SET name='Nom curat localment'");
      await db.query("UPDATE node0.public_documents SET document=jsonb_set(document,'{title}','\"Edició local\"') WHERE kind='feedPosts'");
      await db.exec(sql);
      assert.equal((await db.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,h.documents.length);
      assert.equal((await db.query("SELECT payload->0->>'id' AS id FROM public.app_content WHERE key='feedPosts'")).rows[0].id,'curated-local');
      assert.equal((await db.query('SELECT name FROM public.towns')).rows[0].name,'Nom curat localment');
      assert.equal((await db.query("SELECT document->>'title' AS title FROM node0.public_documents WHERE kind='feedPosts'")).rows[0].title,'Edició local');
      const role=(await db.query("SELECT rolsuper,rolbypassrls,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname='node0_runtime'")).rows[0];
      assert.deepEqual(role,{rolsuper:false,rolbypassrls:false,rolcreaterole:false,rolcreatedb:false});
      await db.exec('SET ROLE node0_runtime');
      assert.equal((await db.query('SELECT count(*)::int AS n FROM node0.schema_migrations')).rows[0].n,plan.migrations.length);
      await assert.rejects(db.query("UPDATE node0.schema_migrations SET sha256=repeat('0',64)"),e=>e.code==='42501');
      await assert.rejects(db.query('SELECT * FROM auth.users'),e=>e.code==='42501');
      await db.exec('RESET ROLE');
      await db.exec("UPDATE node0.schema_migrations SET sha256=repeat('0',64) WHERE version=(SELECT min(version) FROM node0.schema_migrations)");
      await assert.rejects(db.exec(sql),/node0_migration_ledger_drift/);
      await db.exec('ROLLBACK').catch(()=>{});
    } finally {await db.close();}
  });
