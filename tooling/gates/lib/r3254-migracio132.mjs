import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { cosMigracio } from '../../node0/hidrata-postgres-node0.mjs';

export const MIGRACIO_132 = 'supabase/migrations/20261123180000_r3252_indexs_suport_fk_verificats.sql';
export const SHA256_MIGRACIO_132 = 'fb6e55c005c149d753f1fc10bc2f2de33387425f543c97476ab0b615e43a0410';
const canonical = new URL('../../../' + MIGRACIO_132, import.meta.url);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

/** No connexió ni credencials: genera una envoltura transaccional de la 132
 * pendent fixada per SHA. C12 esmena el fitxer no desplegat; els kits anteriors
 * conserven els seus bytes. L'operador l'executa en una connexió dedicada sense transacció
 * prèvia i amb stop-on-error. Un error requerix ROLLBACK abans del reintent.
 * NOWAIT evita esperar escriptors existents; SHARE bloqueja noves escriptures
 * mentre es construïxen els índexs. No és zero locks ni CREATE CONCURRENTLY.
 */
export function preparaMigracio132({ source = fs.readFileSync(canonical) } = {}) {
  if (sha256(source) !== SHA256_MIGRACIO_132) throw new Error('r3254_migration132_source_drift');
  const sql = source.toString('utf8');
  const targets = [...sql.matchAll(/^\s*\('(public|private)','([a-z0-9_]+)','[^']+',/gm)].map(match => `${match[1]}.${match[2]}`);
  const mandatory = [...sql.matchAll(/^\s*\('(public|private)','([a-z0-9_]+)','[^']+','FOREIGN KEY /gm)].map(match => `${match[1]}.${match[2]}`);
  if (targets.length !== 88 || mandatory.length !== 78) throw new Error('r3254_migration132_target_count');
  const tables = [...new Set(mandatory)].sort();
  const conditionalTables = [...new Set(targets)].filter(table => !tables.includes(table)).sort();
  // Esta taula conté el rebut CAS que la migració actualitza. El lock de
  // taula és compatible amb el FOR UPDATE; la fila s'adquirix també NOWAIT.
  const lockedTables = [...new Set([...tables, 'private.r3244_edicio_contract'])].sort();
  const lockOrder = [...lockedTables, ...conditionalTables].sort();
  const locks = lockOrder.map(table => {
    const statement = `LOCK TABLE ${table.split('.').map(part => '"' + part + '"').join('.')} IN SHARE MODE NOWAIT;`;
    return conditionalTables.includes(table)
      ? `DO $r3272_lock$ BEGIN IF to_regclass('${table}') IS NOT NULL THEN ${statement} END IF; END $r3272_lock$;`
      : statement;
  }).join('\n');
  const guarded = `-- R32.54/C12: envoltura de la migració 132 pendent; font fixada SHA256 ${SHA256_MIGRACIO_132}.
-- Executar amb connexió dedicada, stop-on-error i finestra de manteniment.
BEGIN;
SET LOCAL search_path=pg_catalog,public;
SET LOCAL lock_timeout='1s';
SET LOCAL statement_timeout='120s';
DO $r3254_guard$
BEGIN
  IF NOT pg_try_advisory_xact_lock(3254,132) THEN
    RAISE EXCEPTION USING ERRCODE='55P03',MESSAGE='r3254_migration132_already_running';
  END IF;
END
$r3254_guard$;
${locks}
SELECT id FROM private.r3244_edicio_contract WHERE id=1 FOR UPDATE NOWAIT;
${cosMigracio(sql)}
COMMIT;
`;
  return { sql: guarded, report: { format: 'sdp.r3254.migration132/v1', applied: false, production_observed: false,
    source: MIGRACIO_132, source_sha256: SHA256_MIGRACIO_132, sql_sha256: sha256(guarded),
    expected_foreign_keys: targets.length, mandatory_foreign_keys: mandatory.length, production_only_foreign_keys: 10,
    observed_projection_foreign_keys: 82, tables, locked_tables: lockedTables, conditional_tables: conditionalTables, lock_order: lockOrder,
    lock_policy: 'SHARE NOWAIT + contract row FOR UPDATE NOWAIT + transaction advisory try-lock; original 5s lock_timeout and 120s statement_timeout retained.',
    limits: ['Uses normal CREATE INDEX, so acquired SHARE locks block writers until COMMIT or ROLLBACK.',
      'NOWAIT rejects conflicting existing locks; it does not prove zero impact on concurrent writers.',
      'Execute the wrapper instead of the raw 132 once through the migration operator; do not register it as a new 133 migration.',
      'A rerun is idempotent only on the original migration DDL and CAS preconditions; a divergent deployed 132 needs reconciliation.',
      'Local compatibility or concurrency tests do not certify hosted production sizes, traffic or deployment safety.'] } };
}
