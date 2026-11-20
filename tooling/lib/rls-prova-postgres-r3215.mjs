/** Narrow evidence contract for ONE dynamic definer hardener. This is not a
 * SQL-parser exemption: all source/proof bytes and mandatory tests must match.
 * The RLS gate remains static; the SQL suite supplies the actual PG proof. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const DIAGNOSTICS_R6_PROVATS=Object.freeze([
 'SQL dinàmic amb SECURITY DEFINER no verificable estàticament; cal DDL de rutina de nivell superior o verificació PostgreSQL/PGlite.',
 "SQL dinàmic que altera el search_path d'una rutina no verificable estàticament; cal ALTER de nivell superior o verificació PostgreSQL/PGlite."
]);
export const CONTRACTE_R3215=Object.freeze({
 sql:'supabase/snippets/r32_15_blinda_definers_heretats_idempotent.sql',
 sqlSha256:'922c1b3cd542f41b849164e39e8e0055187f71c5ba797efe4a26991883cfd82c',
 certificate:'tests/fixtures/r3215-definers-verificacio.json',
 certificateSha256:'5492b2f8843b3058427d4592ef52554233467260b07ba51130cca0c93313e29a',
 companions:Object.freeze({
  'supabase/snippets/r32_15_diagnostic_definers_produccio.sql':'f9235d50ecd4f9898ebaa6bf69567874279fdd92fa5fd8280580320df69f9c58',
  'tests/r3215-definers-postgres.test.mjs':'4bc8d3c0a67de222bbdbeb5e9f9ef890a41c6314c27f0c9693c60f2e68f0b259',
  'tests/fixtures/r32-fossils.json':'7e6164936dc8ee82459cc514c0328c7a42cf75d4289f7eb453e12faf0f856bf1',
  'tests/fixtures/postgres-local.mjs':'fb259cdfe3d1d051db2b8de8e727dff5346681717cdc88d736cb5de8283011e7',
  'tests/r3215-rls-proof.test.mjs':'412417bb7ae10ae96ee3b0b3cb3852bedea2ba3c4549e86f164fe661030f80fb'
 }),
 requiredTests:Object.freeze(['tests/r3215-definers-postgres.test.mjs','tests/r3215-rls-proof.test.mjs'])
});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function regular(root,relative){
 let current=root;
 for(const [i,part]of relative.split('/').entries()){
  current=path.join(current,part);const st=fs.lstatSync(current);
  if(st.isSymbolicLink()||(i===relative.split('/').length-1?!st.isFile():!st.isDirectory()))throw Error('proof_nonregular');
 }
 return fs.readFileSync(current);
}
export function verificaProvaR6R3215(file,{root=process.cwd(),sql}={}){
 if(file!==CONTRACTE_R3215.sql)return Object.freeze({valid:false,reason:'outside_reviewed_source'});
 try{
  const dir=fs.realpathSync(root);
  if(typeof sql!=='string'||sha(sql)!==CONTRACTE_R3215.sqlSha256)return Object.freeze({valid:false,reason:'sql_bytes_not_verified'});
  if(sha(regular(dir,CONTRACTE_R3215.sql))!==CONTRACTE_R3215.sqlSha256)throw Error('sql_file_drift');
  for(const [relative,pin]of Object.entries(CONTRACTE_R3215.companions))if(sha(regular(dir,relative))!==pin)throw Error('proof_companion_drift');
  const certificateBytes=regular(dir,CONTRACTE_R3215.certificate);
  if(sha(certificateBytes)!==CONTRACTE_R3215.certificateSha256)throw Error('proof_receipt_drift');
  const receipt=JSON.parse(certificateBytes);
  if(receipt.schema!=='sdp.r3215.definers-proof.v1'||receipt.sqlSha256!==CONTRACTE_R3215.sqlSha256
   ||receipt.tests.pass!==67||receipt.tests.fail!==0||receipt.tests.skip!==0||receipt.nativeVersion!=='18.6'
   ||receipt.pglitePackage!=='0.3.16'||receipt.remoteExecuted!==false)throw Error('proof_receipt_contract');
  const manifest=JSON.parse(regular(dir,'tooling/tests/node-suite-manifest.json'));
  for(const required of CONTRACTE_R3215.requiredTests){
   if(manifest.requiredPrimary?.filter(p=>p===required).length!==1
    ||manifest.files?.filter(p=>p.path===required&&p.suite==='primary').length!==1)throw Error('proof_test_not_mandatory');
  }
  return Object.freeze({valid:true,receiptSha256:CONTRACTE_R3215.certificateSha256,nativeVersion:receipt.nativeVersion,pglitePackage:receipt.pglitePackage,assertions:receipt.tests.pass});
 }catch(error){return Object.freeze({valid:false,reason:error.code==='ENOENT'?'proof_missing':error.message});}
}
