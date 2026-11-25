/** Reconciliació atòmica: un únic COMMIT per als dos originals pendents.
 * Cap hash nou ni dependència absent s'accepta automàticament.
 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { cosMigracio } from '../../node0/hidrata-postgres-node0.mjs';
import { preparaMigracio132, MIGRACIO_132, SHA256_MIGRACIO_132 } from './r3254-migracio132.mjs';

const ROOT = new URL('../../../', import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const SOURCE_135 = 'supabase/migrations/20261124033000_r3272_profiles_sense_enumeracio_i_execute_minim.sql';
// SHA fixat del fitxer pendent; no del catàleg de producció desconegut.
export const SHA_135 = '2578292da6597dd294765515e60018131ceabd37cd24691344bae17c62907f8c';
export const EXPECTED_FUNCTIONS = Object.freeze({
 'private.r3244_edicio_snapshot()': { hash: 'dfd4af7e5d14168db57fcd18990bbec7e75c191c8e65736c6820ad94f758369e', result: 'jsonb', volatility: 's', securityDefiner: false },
 'private.comprova_una_propietaria()': { hash: 'ce2b0844ccb7e77c629520493e0c1ca3a416fec06523212649a8d936ed53c82c', result: 'trigger', volatility: 'v' },
 'private.is_town_member(uuid)': { hash: '40f37baa53e0afd3d7f4273b2521d72180ff573df9405dc33961337ecc9877f9', result: 'boolean', volatility: 's' },
 'private.trigger_rate_limit_xat()': { hash: 'f2ef75ee1621ed707a07c1aa52885cc683f1445618dbd82d960d72bf634a138b', result: 'trigger', volatility: 'v' },
 'public.touch_updated_at()': { hash: '3c6d6c41d6262a20e7c102dbd49bb3383bd86a4138c8a3ab6b9b04a1ec2420a5', result: 'trigger', volatility: 'v' }
});

/** Contracte derivat únicament de la 132 exacta, mai del rebut del caller. */
export function contracteSonda132({ source132 = fs.readFileSync(new URL(MIGRACIO_132, ROOT)) } = {}) {
 if (sha(source132) !== SHA256_MIGRACIO_132) throw Error('v1225_migration132_source_drift');
 const text = source132.toString('utf8');
 const canonical = [...text.matchAll(/^\s*\('(public|private)','([a-z0-9_]+)','([a-z0-9_]+)','(FOREIGN KEY [^']+)','([a-z0-9_]+)'\)[,]?\s*$/gm)]
  .map(m => ({ schema: m[1], table: m[2], name: m[3], definition: m[4], index: m[5] }));
 const observed = [...text.matchAll(/^\s*\('(public|private)','([a-z0-9_]+)','([a-z0-9_]+)',ARRAY\[([^\]]+)\]::text\[\],'((?:auth|public|private)\.[a-z0-9_]+)','([a-z0-9_]+)'\)[,]?\s*$/gm)]
  .map(m => ({ schema: m[1], table: m[2], name: m[3], columns: [...m[4].matchAll(/'([a-z0-9_]+)'/g)].map(v => v[1]), referencedTable: m[5], index: m[6] }));
 const key = f => `${f.schema}.${f.table}.${f.name}`;
 if (canonical.length !== 78 || observed.length !== 10 || new Set([...canonical, ...observed].map(key)).size !== 88) throw Error('v1225_migration132_contract_count');
 const report = preparaMigracio132({ source: source132 }).report;
 const requiredTables = report.locked_tables;
 const requiredDerived = [...new Set([...canonical.map(f => `${f.schema}.${f.table}`), 'private.r3244_edicio_contract'])].sort();
 if (JSON.stringify(requiredTables) !== JSON.stringify(requiredDerived)) throw Error('v1225_migration132_lock_contract');
 const probeTables = [...new Set([...report.lock_order, 'storage.objects', 'public.xat_dispositius_push', 'public.xat_missatges', 'public.push_subscriptions'])].sort();
 return { sourceSha256: SHA256_MIGRACIO_132, canonical, observed, requiredTables, conditionalTables: report.conditional_tables, probeTables };
}

/** Diagnosi, no autorització. Una foto caducada no salta cap guarda SQL. */
export function avaluaSonda132135(probe, { ara = Date.now(), maximAntiguitatMs = 900000 } = {}) {
 const issues = [];
 const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
 const tableShape = t => object(t) && typeof t.name === 'string' && typeof t.present === 'boolean'
  && Array.isArray(t.columns) && t.columns.every(c => object(c) && typeof c.name === 'string' && typeof c.type === 'string');
 const fkShape = f => object(f) && ['schema_name', 'table_name', 'name', 'definition', 'referenced_table'].every(k => typeof f[k] === 'string')
  && Array.isArray(f.columns) && f.columns.every(c => typeof c === 'string');
 if (!object(probe) || probe.format !== 'sdp.v1225.preflight-132-135-push.v1'
  || !Array.isArray(probe.functions) || !probe.functions.every(f => object(f) && typeof f.signature === 'string')
  || !Array.isArray(probe.tables) || !probe.tables.every(tableShape)
  || !Array.isArray(probe.storage_policies) || !Array.isArray(probe.foreign_keys) || !probe.foreign_keys.every(fkShape)) return { ready: false, issues: ['invalid_probe'], productionVerified: false };
 const captured = Date.parse(probe.observed_at);
 if (!Number.isSafeInteger(ara) || !Number.isSafeInteger(maximAntiguitatMs) || maximAntiguitatMs < 0
  || !Number.isFinite(captured) || captured > ara || ara-captured > maximAntiguitatMs) issues.push('probe_stale');
 const fkKey = f => `${f.schema_name}.${f.table_name}.${f.name}`;
 if (new Set(probe.functions.map(f => f.signature)).size !== probe.functions.length
  || new Set(probe.tables.map(t => t.name)).size !== probe.tables.length
  || new Set(probe.foreign_keys.map(fkKey)).size !== probe.foreign_keys.length) issues.push('probe_duplicate_targets');
 for (const [signature, expected] of Object.entries(EXPECTED_FUNCTIONS)) {
  const fn = probe.functions.find(f => f.signature === signature);
  if (fn?.present !== true) { issues.push('required_function_absent:' + signature); continue; }
  if (fn.body_sha256 !== expected.hash || fn.result !== expected.result || fn.volatility !== expected.volatility || fn.security_definer !== (expected.securityDefiner ?? true) || !Array.isArray(fn.config) || fn.config.length !== 1 || fn.config[0] !== 'search_path=""') issues.push('required_function_drift:' + signature);
 }
 const contract = contracteSonda132();
 for (const name of contract.requiredTables) {
  const table = probe.tables.find(t => t.name === name);
  if (table?.present !== true) issues.push('required_table_absent:' + name);
  else if (!['r', 'p'].includes(table.kind)) issues.push('required_table_kind_drift:' + name);
 }
 for (const name of contract.probeTables) if (!probe.tables.some(t => t.name === name)) issues.push('probe_table_coverage_incomplete:' + name);
 const byFk = new Map(probe.foreign_keys.map(f => [fkKey(f), f]));
 for (const required of contract.canonical) {
  const key = `${required.schema}.${required.table}.${required.name}`, observed = byFk.get(key);
  if (!observed) issues.push('required_fk_absent:' + key);
  else if (observed.definition !== required.definition) issues.push('fk_definition_drift:' + key);
 }
 for (const expected of contract.observed) {
  const key = `${expected.schema}.${expected.table}.${expected.name}`, observed = byFk.get(key);
  const table = probe.tables.find(t => t.name === `${expected.schema}.${expected.table}`);
  if (!observed) {
   // Mateixa absència explícita que la 132: taula o totes les columnes observades absents.
   // No es creen taules, columnes ni dependències per a fer-la passar.
   if (table?.columns.some(c => expected.columns.includes(c.name))) issues.push('observed_fk_absent:' + key);
  } else if (JSON.stringify(observed.columns) !== JSON.stringify(expected.columns) || observed.referenced_table !== expected.referencedTable) issues.push('observed_fk_shape_drift:' + key);
 }
 const storage = probe.tables.find(t => t.name === 'storage.objects');
 if (storage?.present !== true || storage.rls !== true || !storage.columns.some(c => c.name === 'bucket_id' && c.type === 'text')) issues.push('storage_contract_incomplete');
 if (probe.tables.find(t => t.name === 'private.r3244_edicio_contract')?.present !== true) issues.push('r3244_receipt_absent');
 const member = probe.functions.find(f => f.signature === 'private.is_town_member(uuid)');
 if (member?.effective_execute?.authenticated !== true) issues.push('required_authenticated_execute_absent');
 return { ready: issues.length === 0, issues, productionVerified: false,
  remainingGuards: ['r3244_live_snapshot_equals_receipt', 'index_collision', 'storage_policy_collision', 'effective_execute_after_revoke', 'transaction_concurrency_locks'] };
}

export function preparaReconciliacio132135({ source135 = fs.readFileSync(new URL(SOURCE_135, ROOT)), source132 } = {}) {
 if (sha(source135) !== SHA_135) throw Error('v1225_migration135_source_drift');
 const first = preparaMigracio132(source132 === undefined ? {} : { source: source132 });
 const sql = `-- C4/v1.2.25: 132 + 135 pendents, un únic COMMIT. No aplicar sense sonda.
-- Depén de: 20261124033000
-- No registra 132/135 com aplicades: l'operador reconcilia el seu registre després del COMMIT.
BEGIN;
SET LOCAL search_path=pg_catalog,public;
SET LOCAL lock_timeout='1s';
SET LOCAL statement_timeout='120s';
${cosMigracio(first.sql)}
${cosMigracio(source135.toString('utf8'))}
COMMIT;
`;
 return { sql, report: { format: 'sdp.v1225.reconciliacio132135.v1', source132Sha256: first.report.source_sha256, source135Sha256: SHA_135, sha256: sha(sql), applied: false, productionVerified: false, guardsPreserved: true, atomic: true, limitations: ['Cap dependència absent es crea o s’activa.', 'Les variants de producció desconegudes fallen abans del COMMIT; cal revisar la sonda.', 'Cal una connexió dedicada amb stop-on-error i ROLLBACK si la transacció falla.', 'SHARE NOWAIT evita esperes però bloqueja escriptures mentre es creen índexs.'] } };
}
