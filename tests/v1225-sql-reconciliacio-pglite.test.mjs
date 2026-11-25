import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { creaBaseR3246 } from './fixtures/r3246-catalogue-pglite.mjs';
import { cosMigracio } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { avaluaSonda132135, preparaReconciliacio132135, contracteSonda132 } from '../tooling/gates/lib/v1225-reconciliacio132135.mjs';

const probe=fs.readFileSync(new URL('../supabase/snippets/v1225_sonda_132_135_push_readonly.sql',import.meta.url),'utf8');
const capture=async pg=>(await pg.exec(probe)).flatMap(r=>r.rows??[]).find(r=>r.preflight)?.preflight;
const indexes=async pg=>(await pg.query("SELECT n.nspname,c.relname,pg_get_indexdef(c.oid) AS ddl FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_index i ON i.indexrelid=c.oid WHERE n.nspname IN('public','private') ORDER BY 1,2")).rows;

test('C4 read-only probe tolerates genuinely absent dependencies and emits no fabricated readiness',async()=>{
 assert.ok(process.env.SDP_PGLITE_MODULE,'PGlite required, no skip');
 const {PGlite}=await import(pathToFileURL(process.env.SDP_PGLITE_MODULE));const pg=new PGlite();
 try{
  const result=await capture(pg);assert.equal(result.business_rows_read,false);assert.equal(result.functions.length,8);assert.equal(result.tables.length,contracteSonda132().probeTables.length);
  assert.deepEqual(result.push_settings,{push_poble_actiu:'unknown',push_xat_actiu:'unknown'});
  assert.equal(result.functions.every(f=>f.present===false),true);const assessed=avaluaSonda132135(result);assert.equal(assessed.ready,false);assert.ok(assessed.issues.includes('r3244_receipt_absent'));
  assert.equal((await pg.query("SELECT current_setting('transaction_read_only') AS v")).rows[0].v,'off');
 }finally{await pg.close();}
});
test('C4 Push settings remain read-only, tolerate absent/wrong table shapes and expose only si/no/unknown',async()=>{
 assert.ok(process.env.SDP_PGLITE_MODULE,'PGlite required, no skip');
 const {PGlite}=await import(pathToFileURL(process.env.SDP_PGLITE_MODULE));const pg=new PGlite();
 try{
  await pg.exec('CREATE SCHEMA private; CREATE TABLE private.ajustos(clau integer,valor text)');
  assert.deepEqual((await capture(pg)).push_settings,{push_poble_actiu:'unknown',push_xat_actiu:'unknown'});
  await pg.exec('DROP TABLE private.ajustos; CREATE TABLE private.ajustos(clau text,valor text)');
  await pg.query('INSERT INTO private.ajustos(clau,valor) VALUES($1,$2),($3,$4),($5,$6)',[
   'push_poble_actiu','si','push_xat_actiu','no','other_private_setting','C4_SECRET_SENTINEL_NEVER_EXPOSE'
  ]);
  const before=(await pg.query('SELECT clau,valor FROM private.ajustos ORDER BY clau')).rows;
  const report=await capture(pg);
  assert.deepEqual(report.push_settings,{push_poble_actiu:'si',push_xat_actiu:'no'});
  assert.equal(JSON.stringify(report).includes('C4_SECRET_SENTINEL'),false);
  assert.equal(JSON.stringify(report).includes('other_private_setting'),false);
  assert.deepEqual((await pg.query('SELECT clau,valor FROM private.ajustos ORDER BY clau')).rows,before);
  await pg.query("UPDATE private.ajustos SET valor=$1 WHERE clau='push_xat_actiu'",['C4_SECRET_SENTINEL_AS_FLAG']);
  const secret=await capture(pg);
  assert.deepEqual(secret.push_settings,{push_poble_actiu:'si',push_xat_actiu:'unknown'});
  assert.equal(JSON.stringify(secret).includes('C4_SECRET_SENTINEL'),false);
  await pg.exec("INSERT INTO private.ajustos(clau,valor) VALUES('push_poble_actiu','no')");
  assert.deepEqual((await capture(pg)).push_settings,{push_poble_actiu:'unknown',push_xat_actiu:'unknown'});
  await pg.exec("DELETE FROM private.ajustos WHERE clau='push_poble_actiu'");
  assert.equal((await capture(pg)).push_settings.push_poble_actiu,'unknown');
  assert.equal((await pg.query("SELECT current_setting('transaction_read_only') AS v")).rows[0].v,'off');
  assert.match(probe,/BEGIN READ ONLY;/);assert.match(probe,/ROLLBACK;\s*$/);
 }finally{await pg.close();}
});
test('C4 original132 and135 reconcile atomically, reject unknown bodies and replay idempotently',{timeout:180000},async t=>{
 const pg=await creaBaseR3246({throughVersion:'20261123010000'}), prepared=preparaReconciliacio132135();
 try{
  assert.equal(fs.readFileSync(new URL('../supabase/snippets/v1225_reconcilia_132_135_atomic.sql',import.meta.url),'utf8'),prepared.sql);
  const observed=await capture(pg);assert.equal(avaluaSonda132135(observed).ready,true);
  assert.equal(observed.tables.find(v=>v.name==='public.xat_dispositius_push').present,true);
  assert.equal(JSON.stringify(observed).includes('prosrc'),false);

  await t.test('[DEFECTE] C4 all 78 mandatory FK identities and definitions plus required locks are checked',()=>{
   const contract=contracteSonda132();assert.equal(contract.canonical.length,78);assert.equal(contract.observed.length,10);
   for(const expected of contract.canonical){
    const key=`${expected.schema}.${expected.table}.${expected.name}`;
    const absent=structuredClone(observed);absent.foreign_keys=absent.foreign_keys.filter(f=>`${f.schema_name}.${f.table_name}.${f.name}`!==key);
    assert.ok(avaluaSonda132135(absent).issues.includes('required_fk_absent:'+key),key);
    const drift=structuredClone(observed);drift.foreign_keys.find(f=>`${f.schema_name}.${f.table_name}.${f.name}`===key).definition+=' NOT VALID';
    assert.ok(avaluaSonda132135(drift).issues.includes('fk_definition_drift:'+key),key);
   }
   for(const name of contract.requiredTables){
    const absent=structuredClone(observed);absent.tables.find(t=>t.name===name).present=false;
    assert.ok(avaluaSonda132135(absent).issues.includes('required_table_absent:'+name),name);
   }
   const bad=structuredClone(observed);bad.foreign_keys.push(bad.foreign_keys[0]);assert.equal(avaluaSonda132135(bad).ready,false);
   const old=structuredClone(observed);delete old.foreign_keys;assert.equal(avaluaSonda132135(old).ready,false);
   const malformed=structuredClone(observed);malformed.tables[0].columns=null;assert.equal(avaluaSonda132135(malformed).ready,false);
   for(const name of contract.probeTables)assert.ok(observed.tables.some(t=>t.name===name),name);
   assert.throws(()=>contracteSonda132({source132:Buffer.from('unknown source')}),/source_drift/);
  });
  await t.test('[DEFECTE] C4 missing app_content_historial blocks readiness before intact SQL guards reject it',async()=>{
   await pg.exec('ALTER TABLE public.app_content_historial RENAME TO c4_test_historial_absent');
   try{
    const missing=await capture(pg),result=avaluaSonda132135(missing);
    assert.equal(missing.tables.find(t=>t.name==='public.app_content_historial').present,false);
    assert.equal(result.ready,false);
    assert.ok(result.issues.includes('required_table_absent:public.app_content_historial'));
    assert.ok(result.issues.includes('required_fk_absent:public.app_content_historial.app_content_historial_autor_fkey'));
    await assert.rejects(pg.exec(prepared.sql),e=>e.code==='42P01');await pg.exec('ROLLBACK;');
   }finally{await pg.exec('ALTER TABLE public.c4_test_historial_absent RENAME TO app_content_historial');}
   assert.equal(avaluaSonda132135(await capture(pg)).ready,true);
  });
  await t.test('[DEFECTE] C4 production-only FK absence follows original explicit-column policy',()=>{
   const contract=contracteSonda132();
   for(const expected of contract.observed){
    const key=`${expected.schema}.${expected.table}.${expected.name}`;
    const missing=structuredClone(observed);missing.foreign_keys=missing.foreign_keys.filter(f=>`${f.schema_name}.${f.table_name}.${f.name}`!==key);
    const table=missing.tables.find(t=>t.name===`${expected.schema}.${expected.table}`);
    table.columns=table.columns.filter(c=>!expected.columns.includes(c.name));
    assert.equal(avaluaSonda132135(missing).issues.includes('observed_fk_absent:'+key),false);
    table.columns.push({name:expected.columns[0],type:'uuid'});
    assert.ok(avaluaSonda132135(missing).issues.includes('observed_fk_absent:'+key));
   }
  });

  await t.test('probe never accepts hashes it has not observed and does not trust production_verified',()=>{
   const tamper=structuredClone(observed);tamper.functions.find(f=>f.signature==='private.is_town_member(uuid)').body_sha256='0'.repeat(64);tamper.production_verified=true;
   const result=avaluaSonda132135(tamper);assert.equal(result.ready,false);assert.equal(result.productionVerified,false);
   const stale=structuredClone(observed);stale.observed_at=new Date(0).toISOString();assert.equal(avaluaSonda132135(stale).ready,false);
  });
  await t.test('135 failure rolls all 132 index changes back rather than leaving a partial lot',async()=>{
   const before=await indexes(pg);
   await assert.rejects(pg.transaction(async tx=>{
    await tx.exec("UPDATE pg_proc SET prosrc=prosrc||E'\\n-- unknown production variant' WHERE oid=to_regprocedure('private.is_town_member(uuid)')");
    await tx.exec(cosMigracio(prepared.sql));
   }),e=>e.code==='55000'&&e.message==='r3272_hygiene_function_drift');
   assert.deepEqual(await indexes(pg),before);
   assert.equal((await pg.query("SELECT count(*)::int AS n FROM pg_policy WHERE polname='r3272 profiles sense llista anon'")).rows[0].n,0);
  });
  await pg.exec(prepared.sql);
  const after=await indexes(pg);assert.ok(after.length>0);
  assert.equal((await pg.query("SELECT has_function_privilege('anon','private.is_town_member(uuid)','EXECUTE') AS anon,has_function_privilege('authenticated','private.is_town_member(uuid)','EXECUTE') AS auth")).rows[0].anon,false);
  assert.equal((await pg.query("SELECT has_function_privilege('authenticated','private.is_town_member(uuid)','EXECUTE') AS auth")).rows[0].auth,true);
  assert.equal((await pg.query("SELECT snapshot=private.r3244_edicio_snapshot() AS matches FROM private.r3244_edicio_contract WHERE id=1")).rows[0].matches,true);
  await pg.exec(prepared.sql);assert.deepEqual(await indexes(pg),after);
  assert.equal(prepared.report.productionVerified,false);assert.equal(prepared.report.guardsPreserved,true);
  assert.throws(()=>preparaReconciliacio132135({source135:Buffer.from('tamper')}),/source_drift/);
 }finally{await pg.close();}
});
