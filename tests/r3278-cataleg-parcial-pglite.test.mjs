import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {creaBaseR3246} from './fixtures/r3246-catalogue-pglite.mjs';
import {projecta132PerFixture} from './fixtures/r3278-cataleg-parcial.mjs';
import {cosMigracio} from '../tooling/node0/hidrata-postgres-node0.mjs';
import {FK_SQL} from '../tooling/gates/lib/radiografia-local.mjs';

const sql=fs.readFileSync(new URL('../supabase/migrations/20261123180000_r3252_indexs_suport_fk_verificats.sql',import.meta.url),'utf8');
const omitted=['public.xat_missatges_fixats'];
const refusal=e=>e.code==='55000'&&e.message==='r3252_fk_constraint_drift';
const indexes=async pg=>(await pg.query("SELECT n.nspname,c.relname,pg_get_indexdef(c.oid) ddl FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','private') ORDER BY 1,2")).rows;
const rolledBack=async(pg,action)=>{await assert.rejects(pg.transaction(async tx=>{await action(tx);throw Error('fixture_trial_rollback');}),/fixture_trial_rollback/);};
async function rejectSql(tx,body,predicate) {
  await tx.exec('SAVEPOINT r3278_reject');
  await assert.rejects(async()=>{
    try {await tx.exec(body);}
    finally {await tx.exec('ROLLBACK TO SAVEPOINT r3278_reject');await tx.exec('RELEASE SAVEPOINT r3278_reject');}
  },predicate);
}

test('R32.78 fixture-only projection: declared absent tables, strict present FK and unchanged full132',{timeout:180000},async t=>{
  const pg=await creaBaseR3246({throughVersion:'20261123010000'});
  try {
    await t.test('complete catalogue returns exact production bytes and still requires all78 canonical targets',async()=>{
      const full=await projecta132PerFixture(pg);
      assert.equal(full.sql,sql);assert.equal(full.report.selectedCanonicalTargets,78);assert.deepEqual(full.report.omittedRelations,[]);
      assert.equal((await pg.query(FK_SQL)).rows.length,78);
      await assert.rejects(projecta132PerFixture(pg,{absentRelations:omitted}),/fixture132_undeclared_or_present_relation/);
    });
    await t.test('red oracle: raw132 refuses an absent canonical table; explicit fixture projection validates the remainder',async()=>{
      await rolledBack(pg,async tx=>{
        await tx.exec('DROP TABLE public.xat_missatges_fixats');
        await rejectSql(tx,cosMigracio(sql),refusal);
        const fixture=await projecta132PerFixture(tx,{absentRelations:omitted});
        assert.equal(fixture.report.selectedCanonicalTargets,77);assert.equal(fixture.report.deploymentOrLedger,false);
        await tx.exec(cosMigracio(fixture.sql));
        assert.equal((await tx.query(FK_SQL)).rows.length,0);
        assert.equal((await tx.query("SELECT snapshot=private.r3244_edicio_snapshot() AS equal FROM private.r3244_edicio_contract WHERE id=1")).rows[0].equal,true);
        const before=await indexes(tx);await tx.exec(cosMigracio(fixture.sql));assert.deepEqual(await indexes(tx),before);
      });
      assert.equal((await pg.query(FK_SQL)).rows.length,78);
    });
    await t.test('a missing table cannot be silently discovered or declared under an unknown name',async()=>{
      await rolledBack(pg,async tx=>{
        await tx.exec('DROP TABLE public.xat_missatges_fixats');
        await assert.rejects(projecta132PerFixture(tx),/fixture132_undeclared_or_present_relation/);
        await assert.rejects(projecta132PerFixture(tx,{absentRelations:['public.untrusted']}),/fixture132_unknown_omission/);
        await assert.rejects(projecta132PerFixture(tx,{absentRelations:[...omitted,...omitted]}),/fixture132_duplicate_omission/);
      });
    });
    await t.test('present table with missing or changed FK is rejected, even in an otherwise declared partial catalogue',async()=>{
      for(const mutation of [
        'ALTER TABLE public.organization_member_organizations DROP CONSTRAINT organization_member_organizations_created_by_fkey',
        'ALTER TABLE public.organization_member_organizations DROP CONSTRAINT organization_member_organizations_created_by_fkey; ALTER TABLE public.organization_member_organizations ADD CONSTRAINT organization_member_organizations_created_by_fkey FOREIGN KEY(created_by) REFERENCES auth.users(id) ON DELETE CASCADE'
      ]) await rolledBack(pg,async tx=>{
        await tx.exec('DROP TABLE public.xat_missatges_fixats');await tx.exec(mutation);
        const fixture=await projecta132PerFixture(tx,{absentRelations:omitted}),before=await indexes(tx);
        await rejectSql(tx,cosMigracio(fixture.sql),refusal);
        assert.deepEqual(await indexes(tx),before);
      });
    });
    await t.test('a colliding expression index still refuses and rolls back earlier index creation',async()=>{
      await rolledBack(pg,async tx=>{
        await tx.exec('DROP TABLE public.xat_missatges_fixats');
        await tx.exec('CREATE INDEX r3252_fk_211c5306e8df2b1715ef ON public.organization_member_organizations((created_by::text))');
        const fixture=await projecta132PerFixture(tx,{absentRelations:omitted}),before=await indexes(tx);
        await rejectSql(tx,cosMigracio(fixture.sql),e=>e.code==='55000'&&e.message==='r3252_fk_index_collision');
        assert.deepEqual(await indexes(tx),before);
      });
    });
    await t.test('producer and receipt CAS guards remain active in fixture projections',async()=>{
      for(const mutation of [
        "UPDATE pg_proc SET prosrc=prosrc||E'\\n-- unknown body' WHERE oid='private.r3244_edicio_snapshot()'::regprocedure",
        "UPDATE private.r3244_edicio_contract SET snapshot='{}'::jsonb WHERE id=1"
      ]) await rolledBack(pg,async tx=>{
        await tx.exec('DROP TABLE public.xat_missatges_fixats');
        const fixture=await projecta132PerFixture(tx,{absentRelations:omitted});await tx.exec(mutation);
        await rejectSql(tx,cosMigracio(fixture.sql),e=>e.code==='55000'&&/^r3252_r3244_(?:snapshot_function|preimage)_drift$/.test(e.message));
      });
    });
    await t.test('source drift is rejected before any catalogue request',async()=>{
      let requests=0;await assert.rejects(projecta132PerFixture({query(){requests++;throw Error('unexpected query');}},{source:sql+'\nSELECT 1;'}),/fixture132_source_drift/);assert.equal(requests,0);
    });
  } finally {await pg.close();}
});
