import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';
import { creaPlaMigracions, generaSql, preparaHidratacio } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { preparaMigracio132, MIGRACIO_132 } from '../tooling/gates/lib/r3254-migracio132.mjs';
import { FK_SQL } from '../tooling/gates/lib/radiografia-local.mjs';

const indexes = async db => (await db.query(`SELECT n.nspname,c.relname,pg_get_indexdef(c.oid) AS definition
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_index i ON i.indexrelid=c.oid
 WHERE n.nspname IN('public','private') ORDER BY 1,2`)).rows;
const countMissing = async db => (await db.query(FK_SQL)).rows.length;

// Requerix PostgreSQL natiu i dos sessions; PGlite no acredita concurrència.
// L'orquestradora executa este fitxer amb el permís SysV del seu entorn.
test('R32.54 · native 131→132, bounded admission and lock consequences', { timeout: 240000 }, async t => {
  const cluster = await startLocalPostgres({ dataRoot: resolve('.r3254/native-pg') });
  const db = cluster.db, other = await cluster.connect();
  const evidence = { production_observed: false, engine: null, cases: [], limits: [
    'Normal CREATE INDEX holds SHARE locks until transaction end; incoming writers can block.',
    'No production traffic, table size, hosted Supabase service or zero-global-blocking claim.'
  ] };
  try {
    evidence.engine = (await db.query('SELECT version() AS version')).rows[0].version;
    const plan = creaPlaMigracions(), end = plan.migrations.findIndex(m => m.version === '20261123010000');
    assert.ok(end >= 0); plan.migrations = plan.migrations.slice(0, end + 1);
    assert.equal(plan.migrations.length, 131);
    await db.query(generaSql(plan, await preparaHidratacio(), { advisoryLock: false }));
    assert.equal(await countMissing(db), 78);
    const before = await indexes(db), { sql, report } = preparaMigracio132();
    const baselineSettings = (await db.query("SELECT current_setting('lock_timeout') AS locks,current_setting('statement_timeout') AS statements")).rows[0];
    const failFast = async (name, hold, expected = '55P03') => {
      await other.query('BEGIN');
      try {
        await other.query(hold);
        const start = performance.now();
        await assert.rejects(db.query(sql), error => error.code === expected);
        const elapsed_ms = performance.now() - start;
        await db.query('ROLLBACK');
        assert.ok(elapsed_ms < 1500, `admission exceeded 1500ms: ${elapsed_ms}`);
        assert.deepEqual(await indexes(db), before);
        assert.equal(await countMissing(db), 78);
        evidence.cases.push({ name, code: expected, elapsed_ms, no_partial_indexes: true });
      } finally { await db.query('ROLLBACK'); await other.query('ROLLBACK'); }
    };
    await t.test('existing writer: NOWAIT rejects and rolls back earlier acquired locks', async () => {
      const target = report.tables.at(-1).split('.').map(s => '"' + s + '"').join('.');
      await failFast('existing_writer', `LOCK TABLE ${target} IN ROW EXCLUSIVE MODE`);
      // Every earlier lock must be released after failure, not only the busy one.
      await other.query('BEGIN');
      try { for (const table of report.locked_tables) await other.query(`LOCK TABLE ${table} IN ACCESS EXCLUSIVE MODE NOWAIT`); }
      finally { await other.query('ROLLBACK'); }
    });
    await t.test('contract row inversion and concurrent migration advisory lock refuse without deadlock', async () => {
      await failFast('cas_row_inversion', 'SELECT id FROM private.r3244_edicio_contract WHERE id=1 FOR UPDATE');
      await failFast('concurrent_runner', 'SELECT pg_advisory_xact_lock(3254,132)');
    });
    await t.test('new DML after SHARE is blocked until rollback: explicitly not zero global locks', async () => {
      await db.query('BEGIN; LOCK TABLE public.notes IN SHARE MODE NOWAIT');
      try {
        await other.query("SET lock_timeout='40ms'");
        await assert.rejects(other.query('UPDATE public.notes SET title=title WHERE false'), error => error.code === '55P03');
      } finally { await db.query('ROLLBACK'); await other.query("SET lock_timeout='0'"); }
      await other.query('UPDATE public.notes SET title=title WHERE false');
      evidence.cases.push({ name: 'incoming_writer', blocked_by_share: true, restored_after_rollback: true });
    });
    await t.test('statement cancellation calibration rolls back all transaction locks', async () => {
      // Fault injection only: deployed SQL remains pinned at 120s.
      const injected = sql.replace("SET LOCAL statement_timeout='120s';", "SET LOCAL statement_timeout='5ms'; SELECT pg_sleep(0.1);");
      assert.notEqual(injected, sql);
      await assert.rejects(db.query(injected), error => error.code === '57014');
      await db.query('ROLLBACK');
      assert.deepEqual(await indexes(db), before);
      assert.deepEqual((await db.query("SELECT current_setting('lock_timeout') AS locks,current_setting('statement_timeout') AS statements")).rows[0], baselineSettings);
      evidence.cases.push({ name: 'statement_timeout_calibration', code: '57014', no_partial_indexes: true, settings_restored: true });
    });
    await t.test('preimage drift fails closed before any index persists', async () => {
      await db.query('CREATE INDEX r3254_unrelated ON public.page_revisions(id)');
      const drifted = await indexes(db);
      await assert.rejects(db.query(sql), error => error.code === '55000'); await db.query('ROLLBACK');
      assert.deepEqual(await indexes(db), drifted);
      await db.query('DROP INDEX r3254_unrelated');
      evidence.cases.push({ name: 'cas_preimage_drift', code: '55000', no_partial_indexes: true });
    });
    await t.test('full 132 and repeat preserve CAS and remove all 78 FK gaps with 76 indexes', async () => {
      await db.query(sql);
      const after = await indexes(db);
      assert.equal(after.length - before.length, 76);
      assert.equal(await countMissing(db), 0);
      assert.equal((await db.query('SELECT snapshot=private.r3244_edicio_snapshot() AS matches FROM private.r3244_edicio_contract WHERE id=1')).rows[0].matches, true);
      await db.query(sql); assert.deepEqual(await indexes(db), after);
      await db.query(fs.readFileSync(new URL('../' + MIGRACIO_132, import.meta.url), 'utf8'));
      assert.deepEqual(await indexes(db), after);
      assert.deepEqual((await db.query("SELECT current_setting('lock_timeout') AS locks,current_setting('statement_timeout') AS statements")).rows[0], baselineSettings);
      evidence.cases.push({ name: 'full_132_repeat', fk_before: 78, fk_after: 0, indexes_added: 76, wrapper_and_original_idempotent: true });
    });
    fs.mkdirSync(resolve('.r3254/evidencies/lot01'), { recursive: true });
    fs.writeFileSync(resolve('.r3254/evidencies/lot01/native-locks.json'), JSON.stringify(evidence, null, 2) + '\n', { mode: 0o600 });
  } finally { await db.query('ROLLBACK').catch(() => {}); await other.query('ROLLBACK').catch(() => {}); await cluster.close(); }
});
