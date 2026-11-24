import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {creaBaseR3246} from '../../../tests/fixtures/r3246-catalogue-pglite.mjs';
import {validateSnapshot,sha256,fail} from './radiografia-snapshot.mjs';
const probePath=fileURLToPath(new URL('../../../tests/fixtures/r3252-radiografia-original.sql',import.meta.url));
export const PINNED_ORIGINAL_PROBE_SHA256='995dfd7c60a64a0a2bd0e1fdce3b423fb41023be1c6720272ded4f06a528d528';
export const ORIGINAL_PROBE_SHA256=sha256(fs.readFileSync(probePath));
export const FK_SQL=fs.readFileSync(new URL('../../auditoria/radiografia-fk-validada.sql',import.meta.url),'utf8');
export const OBSERVED_SCOPE='Exact comparison of the original probe projection r1..r6 and r7 bucket configuration only. Alert-only r2/r3/r5/r6 and selected columns r4 cannot certify complete DDL, all policies, function bodies, effective privileges or production safety.';
export async function executeOriginalProbe(pg){
 const source=fs.readFileSync(probePath);if(sha256(source)!==PINNED_ORIGINAL_PROBE_SHA256)fail('local_probe_source_drift');
 const results=await pg.exec(source.toString('utf8'));
 const raw=results.flatMap(result=>result.rows??[]).find(row=>Object.hasOwn(row,'radiografia_adversarial_produccio'))?.radiografia_adversarial_produccio;
 if(raw===undefined)fail('local_probe_no_result');return validateSnapshot(typeof raw==='string'?JSON.parse(raw):raw);
}
export async function auditLocal({createBase=creaBaseR3246}={}){
 let pg;try{
  pg=await createBase();const snapshot=await executeOriginalProbe(pg);
  const foreignKeys=(await pg.query(FK_SQL)).rows;
  const storage=(await pg.query(`SELECT b.id AS bucket_id,count(o.id)::int AS total_objects,count(o.id) FILTER(WHERE o.owner_id IS NULL AND o.owner IS NULL)::int AS orphan_ownerless_objects FROM storage.buckets b LEFT JOIN storage.objects o ON o.bucket_id=b.id GROUP BY b.id ORDER BY b.id`)).rows;
  const publicRoleExists=(await pg.query("SELECT exists(SELECT FROM pg_roles WHERE rolname='public') AS present")).rows[0].present;
  return {snapshot,report:{format:'sdp.r3252.radiografia/v1',ok:true,scope:OBSERVED_SCOPE,production_observed:false,source:{engine:pg.r3246.engine,postgres_sha256:sha256(pg.r3246.postgres),migrations:pg.r3246.migrations.length,migrations_sha256:sha256(pg.r3246.migrations),order_sha256:pg.r3246.orderSha256,bootstrap_sha256:pg.r3246.bootstrapSha256,original_probe_sha256:ORIGINAL_PROBE_SHA256},audit:{counts:Object.fromEntries(Object.entries(snapshot).filter(([key,value])=>key.startsWith('r')&&Array.isArray(value)).map(([key,value])=>[key,value.length])),fk_validated:{count:foreignKeys.length,sha256:sha256(foreignKeys),scope:'B-tree usable key prefix; FK column permutation accepted; valid/ready/live; INCLUDE/expression prefix rejected; partial only exact FKcol IS NOT NULL accepted. Other predicates require plan review.'},public_pseudo_role:{physical_role_exists:publicRoleExists},storage_corrected:{sha256:sha256(storage),empty_bucket_orphan_fix:'count(o.id), original count(*) reports one orphan for an empty bucket.'}},limits:['PGlite PostgreSQL compatibility bootstrap is not hosted Supabase/Auth/Storage/Realtime.','R2 alerts include restrictive policies and legitimate implicit WITH CHECK = USING. R3 flags include intentional anonymous RPC and trigger functions; alerts are not proven vulnerabilities.','R7 object/size/orphan counts, R8 and physical/statistical metrics are volatile and never a structural parity claim.','No production snapshot has been inferred from local tests.']}};
 }finally{if(pg)await pg.close();}
}
