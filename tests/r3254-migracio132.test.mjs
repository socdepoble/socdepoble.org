import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { preparaMigracio132, MIGRACIO_132, SHA256_MIGRACIO_132 } from '../tooling/gates/lib/r3254-migracio132.mjs';
import { cosMigracio } from '../tooling/node0/hidrata-postgres-node0.mjs';

test('132 pending exact pin: refuse source drift before emitting any deploy SQL', () => {
  const source = fs.readFileSync(new URL('../' + MIGRACIO_132, import.meta.url));
  assert.throws(() => preparaMigracio132({ source: Buffer.concat([source, Buffer.from('\n')]) }), /source_drift/);
  const { sql, report } = preparaMigracio132();
  assert.equal(report.source_sha256, SHA256_MIGRACIO_132);
  assert.equal(report.expected_foreign_keys, 88);
  assert.equal(report.mandatory_foreign_keys, 78);
  assert.equal(report.production_only_foreign_keys, 10);
  assert.equal(report.observed_projection_foreign_keys, 82);
  assert.ok(sql.includes(cosMigracio(source.toString('utf8'))));
  assert.equal(report.applied, false); assert.equal(report.production_observed, false);
  assert.equal((sql.match(/^BEGIN;/gm) || []).length, 1);
  assert.equal((sql.match(/^COMMIT;/gm) || []).length, 1);
});

test('every target and CAS table is locked NOWAIT before the original DDL', () => {
  const { sql, report } = preparaMigracio132();
  assert.deepEqual(report.locked_tables, [...report.locked_tables].sort());
  for (const table of report.locked_tables) {
    const lock = `LOCK TABLE ${table.split('.').map(s => '"' + s + '"').join('.')} IN SHARE MODE NOWAIT;`;
    assert.ok(sql.indexOf(lock) < sql.indexOf('DO $r3252$'));
  }
  assert.ok(sql.indexOf('FOR UPDATE NOWAIT;') < sql.indexOf('DO $r3252$'));
  assert.match(sql, /pg_try_advisory_xact_lock\(3254,132\)/);
  assert.deepEqual(report.lock_order, [...report.lock_order].sort());
  for (const table of report.conditional_tables) {
    assert.ok(sql.includes(`IF to_regclass('${table}') IS NOT NULL THEN LOCK TABLE`));
  }
});
