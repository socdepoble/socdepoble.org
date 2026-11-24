import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const canonical = new URL('../../supabase/migrations/20261123180000_r3252_indexs_suport_fk_verificats.sql', import.meta.url);
const PIN = 'fb6e55c005c149d753f1fc10bc2f2de33387425f543c97476ab0b615e43a0410';

/** Fixture only: never register this projection as migration 132 or in a ledger.
 * The production migration and POSSE digest remain unchanged. Omitted relations
 * must be declared exactly; a present relation never loses any FK validation.
 * Producer, receipt CAS, index collisions and postimage guards stay intact.
 */
export async function projecta132PerFixture(db, {absentRelations = [], source = fs.readFileSync(canonical)} = {}) {
  assert.equal(createHash('sha256').update(source).digest('hex'), PIN, 'fixture132_source_drift');
  const sql = source.toString('utf8');
  const targets = [...sql.matchAll(/^\s*\('(public|private)','([a-z0-9_]+)','[^']+','FOREIGN KEY /gm)]
    .map(match => `${match[1]}.${match[2]}`);
  assert.equal(targets.length, 78, 'fixture132_target_count');
  const relations = [...new Set(targets)].sort();
  assert.ok(Array.isArray(absentRelations) && absentRelations.every(r => relations.includes(r)), 'fixture132_unknown_omission');
  assert.equal(new Set(absentRelations).size, absentRelations.length, 'fixture132_duplicate_omission');
  const actual = (await db.query('SELECT x AS relation FROM unnest($1::text[]) x WHERE to_regclass(x) IS NULL ORDER BY x', [relations])).rows.map(r => r.relation);
  assert.deepEqual(actual, [...absentRelations].sort(), 'fixture132_undeclared_or_present_relation');
  const report = {fixtureOnly:true, canonicalSourceSha256:PIN, canonicalTargets:78,
    selectedCanonicalTargets:targets.filter(r => !actual.includes(r)).length,
    omittedRelations:actual, observedConditionalTargets:10, deploymentOrLedger:false};
  if (!actual.length) return {sql, report};
  const anchor = 'FROM canonical c\n UNION ALL';
  assert.equal(sql.split(anchor).length, 2, 'fixture132_projection_anchor');
  const names = actual.map(r => `'${r}'`).join(','); // All names come from the pinned canonical catalogue.
  return {sql:sql.replace(anchor, `FROM canonical c\n WHERE NOT ((c.schema_name||'.'||c.table_name)=ANY(ARRAY[${names}]::text[]))\n UNION ALL`), report};
}
