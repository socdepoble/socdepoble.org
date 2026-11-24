import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {creaBaseR3246,catalogueR3246} from './fixtures/r3246-catalogue-pglite.mjs';
import {FK_SQL,executeOriginalProbe,ORIGINAL_PROBE_SHA256} from '../tooling/gates/lib/radiografia-local.mjs';
import {cosMigracio} from '../tooling/node0/hidrata-postgres-node0.mjs';
import {sha256,projectSnapshot,compareSnapshots} from '../tooling/gates/lib/radiografia-snapshot.mjs';
const migration='supabase/migrations/20261123180000_r3252_indexs_suport_fk_verificats.sql';
const sql=fs.readFileSync(new URL('../'+migration,import.meta.url),'utf8');
const q=value=>'"'+value.replaceAll('"','""')+'"';
const indexes=async pg=>(await pg.query(`SELECT n.nspname,c.relname,pg_get_indexdef(c.oid) AS definition,i.indisvalid,i.indisready,i.indislive FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_index i ON i.indexrelid=c.oid WHERE n.nspname IN('public','private') ORDER BY 1,2`)).rows;
const missing=async pg=>(await pg.query(FK_SQL)).rows;
const evidence=(name,value)=>{const dir=process.env.SDP_R3252_EVIDENCE;if(dir)fs.writeFileSync(new URL(name+'',new URL('file://'+dir.replace(/\/$/,'')+'/')),JSON.stringify(value,null,2)+'\n',{mode:0o600});};
test('R32.52 · full chain 131, actual FK support, guarded post-131 migration and idempotence', {timeout:180000},async t=>{
 const pg=await creaBaseR3246({throughVersion:'20261123010000'});const results=[];
 try{
  assert.equal(pg.r3246.engine,'0.3.16');assert.equal(pg.r3246.migrations.length,131);
  const before=await executeOriginalProbe(pg),beforeFk=await missing(pg),beforeCatalogue=sha256(await catalogueR3246(pg)),beforeIndexes=await indexes(pg);
  assert.equal(before.r5_fk_sense_index.length,73);assert.equal(beforeFk.length,78);assert.equal(before.r2_alertes_politiques_rls.length,3);assert.equal(before.r3_security_definers_amb_alerta.length,13);assert.equal(before.r3_security_definers_amb_alerta.some(f=>f.missing_search_path),false);
  await t.test('original PUBLIC pseudo role, original hash and actual absence of fabricated role',async()=>{
   const r=(await pg.query("SELECT has_function_privilege('public','pg_catalog.abs(integer)','EXECUTE') AS allowed,exists(SELECT FROM pg_roles WHERE rolname='public') AS physical_role")).rows[0];assert.deepEqual(r,{allowed:true,physical_role:false});assert.equal(ORIGINAL_PROBE_SHA256,'995dfd7c60a64a0a2bd0e1fdce3b423fb41023be1c6720272ded4f06a528d528');results.push({id:'PUBLIC',status:'passed'});
  });
  await t.test('calibration: key prefix, permutation, INCLUDE, expression, partial, invalid/ready/live',async()=>{
   const cases=[['no_index','',true],['ordered','(a,b)',false],['permuted','(b,a)',false],['trailing','(a,b,c)',false],['include_only','(a) INCLUDE(b)',true],['include_trailing','(a,b) INCLUDE(c)',false],['expression_prefix','((a+1),b)',true],['expression_suffix','(a,b,(c+1))',false],['partial_unrelated','(a,b) WHERE c>0',true],['partial_fk_notnull','(a,b) WHERE a IS NOT NULL',false],['invalid','(a,b)',true],['not_ready','(a,b)',true],['not_live','(a,b)',true]];
   await pg.exec('BEGIN');try{
    await pg.exec('CREATE TABLE public.r3252_probe_parent(a int,b int,PRIMARY KEY(a,b))');
    for(const [name,index,expected]of cases){const table='r3252_probe_'+name,indexName=table+'_idx';await pg.exec(`CREATE TABLE public.${q(table)}(a int,b int,c int,FOREIGN KEY(a,b) REFERENCES public.r3252_probe_parent(a,b))`);if(index)await pg.exec(`CREATE INDEX ${q(indexName)} ON public.${q(table)} ${index}`);if(['invalid','not_ready','not_live'].includes(name)){const field={invalid:'indisvalid',not_ready:'indisready',not_live:'indislive'}[name];await pg.query(`UPDATE pg_index SET ${field}=false WHERE indexrelid=to_regclass($1)`,['public.'+indexName]);}
     assert.equal((await missing(pg)).some(r=>r.table_name===table),expected,name);results.push({id:name,status:'passed'});
    }
   }finally{await pg.exec('ROLLBACK');}
  });
  await t.test('original empty Storage bucket bug is visible, corrected count has zero ownerless objects',async()=>{
   const corrected=(await pg.query(`SELECT b.id,count(o.id)::int AS objects,count(*) FILTER(WHERE o.owner_id IS NULL AND o.owner IS NULL)::int AS original_orphans,count(o.id) FILTER(WHERE o.owner_id IS NULL AND o.owner IS NULL)::int AS corrected_orphans FROM storage.buckets b LEFT JOIN storage.objects o ON o.bucket_id=b.id GROUP BY b.id ORDER BY b.id`)).rows;
   assert.ok(corrected.some(r=>r.objects===0&&r.original_orphans===1&&r.corrected_orphans===0));results.push({id:'storage_empty_bucket',status:'passed'});
  });
  await t.test('R32.44 contract rejects unrelated index, function body, ACL and forged snapshot producer',async()=>{
   const saved=(await pg.query('SELECT snapshot FROM private.r3244_edicio_contract WHERE id=1')).rows[0].snapshot;
   const mutations=[
    'CREATE INDEX r3252_unrelated_contract_index ON public.page_revisions(id)',
    "UPDATE pg_proc SET prosrc=prosrc||E'\\n-- r3252 hostile body' WHERE oid='private.beta_payload_valid(jsonb)'::regprocedure",
    'REVOKE EXECUTE ON FUNCTION public.desa_revisio_pagina(uuid,text,text,uuid,jsonb,uuid,integer,uuid) FROM authenticated',
    "CREATE OR REPLACE FUNCTION private.r3244_edicio_snapshot() RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$SELECT snapshot FROM private.r3244_edicio_contract WHERE id=1$$"
   ];
   for(const mutation of mutations)await assert.rejects(pg.transaction(async tx=>{await tx.exec(mutation);await tx.exec(cosMigracio(sql));}),error=>error.code==='55000');
   assert.deepEqual((await pg.query('SELECT snapshot FROM private.r3244_edicio_contract WHERE id=1')).rows[0].snapshot,saved);
   assert.equal((await missing(pg)).length,78);results.push({id:'r3244_preimage_drift',status:'passed',vectors:4});
  });
  await t.test('postimage rejects an unregistered index and rolls back the entire migration',async()=>{
   const baseline=sha256(await indexes(pg));const mutant=cosMigracio(sql).replace('after_snapshot:=private.r3244_edicio_snapshot();',"EXECUTE 'CREATE INDEX r3252_hostile_postimage ON public.page_revisions(id)';after_snapshot:=private.r3244_edicio_snapshot();");assert.notEqual(mutant,cosMigracio(sql));
   await assert.rejects(pg.transaction(tx=>tx.exec(mutant)),error=>error.code==='55000');assert.equal(sha256(await indexes(pg)),baseline);assert.equal((await missing(pg)).length,78);results.push({id:'r3244_postimage_drift',status:'passed',rollback_all_indexes:true});
  });
  await t.test('migration removes all verified gaps, preserves ACL/policies/functions/constraints and row counts',async()=>{
   await pg.exec(sql);const after=await executeOriginalProbe(pg);assert.equal((await missing(pg)).length,0);assert.equal(after.r5_fk_sense_index.length,0);assert.deepEqual(after.r8_integritat_dades_agregada,before.r8_integritat_dades_agregada);assert.equal(sha256(await catalogueR3246(pg)),beforeCatalogue);
   const a=projectSnapshot(before).structural,b=projectSnapshot(after).structural;delete a.r5_fk_sense_index;delete b.r5_fk_sense_index;assert.deepEqual(a,b);
   assert.equal((await pg.query('SELECT snapshot=private.r3244_edicio_snapshot() AS matches FROM private.r3244_edicio_contract WHERE id=1')).rows[0].matches,true);
   const afterIndexes=await indexes(pg);assert.ok(afterIndexes.length>beforeIndexes.length);const hash=sha256(afterIndexes);await pg.exec(sql);assert.equal(sha256(await indexes(pg)),hash);assert.equal((await missing(pg)).length,0);
   await pg.exec(fs.readFileSync(new URL('../supabase/migrations/20261122230000_r3244_edicio_propia_i_page_revisions.sql',import.meta.url),'utf8'));assert.equal(sha256(await indexes(pg)),hash);await pg.exec(sql);assert.equal(sha256(await indexes(pg)),hash);
   results.push({id:'migration',status:'passed',fk_before:beforeFk.length,fk_after:0,indexes_added:afterIndexes.length-beforeIndexes.length,idempotent:true,catalogue_unchanged:true});
   evidence('local-before-after.json',{source:pg.r3246,original_probe_sha256:ORIGINAL_PROBE_SHA256,before_fk:beforeFk,results,comparison:compareSnapshots(before,after),indexes_added:afterIndexes.filter(r=>r.relname.startsWith('r3252_fk_'))});
  });
  await t.test('existing wrong-name index and constraint drift fail closed with 55000',async()=>{
   const target=(await indexes(pg)).find(r=>r.relname.startsWith('r3252_fk_'));assert.ok(target);const full=q(target.nspname)+'.'+q(target.relname),saved=q(target.relname+'_saved');
   await pg.exec(`ALTER INDEX ${full} RENAME TO ${saved};CREATE INDEX ${q(target.relname)} ON ${q(target.nspname)}.admin_accions(id)`);
   const collisionBefore=sha256(await indexes(pg));await assert.rejects(pg.exec(sql),e=>e.code==='55000');await pg.exec('ROLLBACK');assert.equal(sha256(await indexes(pg)),collisionBefore);
   await pg.exec(`DROP INDEX ${full};ALTER INDEX ${q(target.nspname)}.${saved} RENAME TO ${q(target.relname)}`);
   await pg.exec('ALTER TABLE public.xat_alliberaments_recuperacio RENAME CONSTRAINT xat_alliberaments_recuperacio_peticio_id_amic_id_intent_fkey TO r3252_drift');
   const driftBefore=sha256(await indexes(pg));await assert.rejects(pg.exec(sql),e=>e.code==='55000');await pg.exec('ROLLBACK');assert.equal(sha256(await indexes(pg)),driftBefore);results.push({id:'drift_collision',status:'passed'});
  });
  evidence('pglite-results.json',{source:pg.r3246,results,limits:['No production execution.','B-tree performance intent; plans are local and sequential.','Transaction CREATE INDEX takes locks; no CONCURRENTLY. Review deployment size and lock budget.']});
 }finally{await pg.close();}
});
