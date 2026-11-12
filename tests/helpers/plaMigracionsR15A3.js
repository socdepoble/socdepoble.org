/** Only the authentication release fixture: Claude R15-A3 deliberately defers
 * SQL2611080440. Full-source migration suites and the R15 dry verifier still
 * execute its canonical body separately. No shipping planner is changed. */
import assert from 'node:assert/strict';
import {creaPlaMigracions} from '../../tooling/node0/hidrata-postgres-node0.mjs';
import {VERSIO_POLITICA_PRIVACITAT} from '../../src/config/politicaPrivacitat.js';

export function creaPlaMigracionsR15A3() {
  const source=creaPlaMigracions();
  assert.equal(VERSIO_POLITICA_PRIVACITAT,'2.5','A3 keeps client2.5 until coordinated deployment');
  const deferred=source.migrations.filter(m=>m.version==='2611080440');
  assert.equal(deferred.length,1,'The exact deferred2.6 source must remain in the catalogue');
  assert.equal(deferred[0].file,'2611080440_politica_privacitat_2_6.sql');
  assert.ok(deferred[0].sql.includes('7db70d0101ef51d095ed94110ed560bbd010f62d7d1b8ccf6b0d3f6cc9901d4e'));
  const migrations=source.migrations.filter(m=>m.version!=='2611080440');
  assert.equal(migrations.length+1,source.migrations.length);
  return {...source,migrations,deferred,sourceMigrations:source.migrations};
}

export async function comprovaLedgerR15A3(query) {
  const plan=creaPlaMigracionsR15A3();
  const rows=await query('SELECT file,sha256 FROM node0.schema_migrations ORDER BY file');
  assert.deepEqual(rows,plan.migrations.map(m=>({file:m.file,sha256:m.sha256})).sort((a,b)=>a.file.localeCompare(b.file)));
  assert.equal(rows.length,plan.sourceMigrations.length-1,'Only the exact unapplied2.6 migration is deferred');
  assert.equal(rows.some(r=>r.file===plan.deferred[0].file),false);
  assert.equal((await query('SELECT private.versio_vigent() AS version'))[0].version,'2.5');
}
