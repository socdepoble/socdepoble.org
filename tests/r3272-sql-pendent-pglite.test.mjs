import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {creaBaseR3246} from './fixtures/r3246-catalogue-pglite.mjs';
import {sembraFkObservadesR3272} from './fixtures/r3272-produccio-parcial.mjs';
import {FK_SQL} from '../tooling/gates/lib/radiografia-local.mjs';
import {cosMigracio} from '../tooling/node0/hidrata-postgres-node0.mjs';
import {preparaMigracio132} from '../tooling/gates/lib/r3254-migracio132.mjs';

const sql = fs.readFileSync(new URL('../supabase/migrations/20261123180000_r3252_indexs_suport_fk_verificats.sql', import.meta.url), 'utf8');
const observed = JSON.parse(fs.readFileSync(new URL('./fixtures/r3272-fk-observades.json', import.meta.url)));
const id = row => [row.schema_name, row.table_name, row.constraint_name].join('.');
const observedIds = new Set(observed.foreignKeys.map(id));
const gaps = async pg => (await pg.query(FK_SQL)).rows;
const indexState = async pg => (await pg.query(`SELECT n.nspname,c.relname,pg_get_indexdef(c.oid) AS ddl,i.indisvalid,i.indisready,i.indislive
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_index i ON i.indexrelid=c.oid
 WHERE n.nspname IN('public','private') ORDER BY 1,2`)).rows;
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rejectsDrift = error => error.code === '55000';

test('C12 pending132: canonical catalogue and explicit observed-FK projection', {timeout: 180000}, async t => {
  const pg = await creaBaseR3246({throughVersion: '20261123010000'});
  try {
    await t.test('exact HEAD producer and original 78 gaps; observed JSON is an 82-row projection', async () => {
      assert.equal(pg.r3246.migrations.length, 131);
      assert.equal((await pg.query("SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') AS hash FROM pg_proc WHERE oid='private.r3244_edicio_snapshot()'::regprocedure")).rows[0].hash,
        'dfd4af7e5d14168db57fcd18990bbec7e75c191c8e65736c6820ad94f758369e');
      const current = await gaps(pg);
      assert.equal(current.length, 78);
      assert.equal(current.filter(row => observedIds.has(id(row))).length, 72);
      assert.equal(observedIds.size, 82);
      assert.equal(observed.sourceSha256, '282b793277f69a222be81fcfc4a4b9cd8bbcc2170cbeda0c06cf4eb15ffcfcff');
      assert.equal(preparaMigracio132().report.expected_foreign_keys, 88);
    });
    await t.test('unknown producer refuses before any new index, without accepting a self-attesting receipt', async () => {
      const before = sha(await indexState(pg));
      await assert.rejects(pg.transaction(async tx => {
        await tx.exec("UPDATE pg_proc SET prosrc=prosrc||E'\\n-- unknown producer' WHERE oid='private.r3244_edicio_snapshot()'::regprocedure");
        await tx.exec(cosMigracio(sql));
      }), error => error.code === '55000' && error.message === 'r3252_r3244_snapshot_function_drift');
      assert.equal(sha(await indexState(pg)), before);
    });
    await t.test('canonical-only apply removes78 gaps and does not fabricate any missing production table/column', async () => {
      await pg.transaction(async tx => {
        await tx.exec(cosMigracio(sql));
        assert.equal((await tx.query(FK_SQL)).rows.length, 0);
        assert.equal((await tx.query("SELECT to_regclass('private.publicacions_cas_rebuts') AS absent")).rows[0].absent, null);
        // Roll the entire canonical-only trial back before the separate projection fixture.
        throw Object.assign(Error('trial rollback'), {trial: true});
      }).catch(error => { if (!error.trial) throw error; });
      assert.equal((await gaps(pg)).length, 78);
    });
    await sembraFkObservadesR3272(pg);
    await t.test('synthetic projection has all82 observed gaps plus6 local-only gaps, not an invented production catalogue', async () => {
      const before = await gaps(pg);
      assert.equal(before.length, 88);
      assert.equal(before.filter(row => observedIds.has(id(row))).length, 82);
      for (const expected of observed.foreignKeys) {
        const found = before.find(row => id(row) === id(expected));
        assert.ok(found, id(expected));
        assert.deepEqual(found.fk_columns, expected.fk_columns);
        assert.equal(found.referenced_table.replace(/^public\./, ''), expected.referenced_table.replace(/^public\./, ''));
      }
    });
    await t.test('observed existing column with missing or changed FK fails closed', async () => {
      for (const mutation of [
        'ALTER TABLE private.r3213_lssi_audit DROP CONSTRAINT r3213_lssi_audit_actor_id_fkey',
        'ALTER TABLE private.r3213_lssi_audit DROP CONSTRAINT r3213_lssi_audit_actor_id_fkey; ALTER TABLE private.r3213_lssi_audit ADD CONSTRAINT r3213_lssi_audit_actor_id_fkey FOREIGN KEY(actor_id) REFERENCES public.towns(id)',
        'ALTER TABLE private.r3213_lssi_audit DROP CONSTRAINT r3213_lssi_audit_actor_id_fkey; ALTER TABLE private.r3213_lssi_audit ADD CONSTRAINT r3213_lssi_audit_actor_id_fkey FOREIGN KEY(denuncia_id) REFERENCES auth.users(id)',
      ]) {
        const before = sha(await indexState(pg));
        await assert.rejects(pg.transaction(async tx => { await tx.exec(mutation); await tx.exec(cosMigracio(sql)); }), rejectsDrift);
        assert.equal(sha(await indexState(pg)), before);
      }
    });
    await t.test('observed target index-name collision refuses and rolls back every earlier index', async () => {
      const match = /\('private','r3213_lssi_rebuts','r3213_lssi_rebuts_actor_id_fkey',ARRAY\['actor_id'\]::text\[\],'auth.users','([^']+)'\)/.exec(sql);
      assert.ok(match);
      const before = sha(await indexState(pg));
      await assert.rejects(pg.transaction(async tx => {
        await tx.exec(`CREATE INDEX ${match[1]} ON private.r3213_lssi_rebuts((actor_id::text))`);
        await tx.exec(cosMigracio(sql));
      }), error => error.code === '55000' && error.message === 'r3252_fk_index_collision');
      assert.equal(sha(await indexState(pg)), before);
    });
    await t.test('all82 observed targets become usable and repeat application preserves exact indexes/receipt', async () => {
      const before = await indexState(pg);
      await pg.exec(preparaMigracio132().sql);
      const after = await indexState(pg);
      assert.equal((await gaps(pg)).length, 0);
      assert.equal(after.length - before.length, 86); // 88 FK targets reuse two canonical prefixes.
      assert.equal((await pg.query('SELECT snapshot=private.r3244_edicio_snapshot() AS equal FROM private.r3244_edicio_contract WHERE id=1')).rows[0].equal, true);
      const receipt = (await pg.query('SELECT snapshot FROM private.r3244_edicio_contract WHERE id=1')).rows[0].snapshot;
      await pg.exec(sql);
      assert.equal(sha(await indexState(pg)), sha(after));
      assert.deepEqual((await pg.query('SELECT snapshot FROM private.r3244_edicio_contract WHERE id=1')).rows[0].snapshot, receipt);
    });
  } finally { await pg.close(); }
});
