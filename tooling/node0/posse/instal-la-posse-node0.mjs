#!/usr/bin/env node
/** --check uses node0_authenticator; --install uses the privileged schema owner.
 * The static public DDL/owner readiness contains no session or secret values.
 * Explicit owner-only installer. main() invokes only the read-only readiness
 * check; it never elevates a request connection or installs a schema. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {creaPostgres} from '../postgres-node0.mjs';

const schema=fs.readFileSync(new URL('./posse-ledger.sql',import.meta.url),'utf8');
const FUNCTION_NAMES=['source_current','source_for_bridge','remote_current','assert_current','assert_history','rpc','credential_proof'];
const expectedFunctionHashes=Object.fromEntries(FUNCTION_NAMES.map(name=>{
  const start=schema.indexOf(`CREATE OR REPLACE FUNCTION node0_posse.${name}(`),body=schema.indexOf('AS $f$',start),end=schema.indexOf('$f$;',body+6);
  if(start<0||body<0||end<0)throw Error('posse_schema_definition_missing');
  return[name,createHash('sha256').update(schema.slice(body+6,end)).digest('hex')];
}));

export async function verificaEsquemaPosseNodeZero({db,ownerConnection=false}={}){
  if(typeof db?.query!=='function'||typeof ownerConnection!=='boolean')throw new TypeError('posse_readiness_database_required');
  let state;try{state=await db.query('SELECT node0_posse.readiness();',{privateValues:!ownerConnection});}catch{throw Error('posse_schema_unavailable');}
  if(state?.version!=='posse.r11.v1'||state.migrations!==75||state.ownerStable!==true||state.tablesPrivate!==true||state.sourceInstalled!==true||state.remoteInstalled!==true||FUNCTION_NAMES.some(name=>state.functionHashes?.[name]!==expectedFunctionHashes[name]))throw Error('posse_schema_drift');
  return true;
}
export async function instalaEsquemaPosseNodeZero({db}={}){
  if(typeof db?.query!=='function')throw new TypeError('posse_install_database_required');
  await db.query(schema+'\nSELECT json_build_object(\'installed\',true);',{privateValues:false});
  return verificaEsquemaPosseNodeZero({db,ownerConnection:true});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.argv.length!==3||!['--check','--install'].includes(process.argv[2]))throw Error('usage: instal-la-posse-node0.mjs --check|--install');
  const db=creaPostgres();
  try{await(process.argv[2]==='--check'?verificaEsquemaPosseNodeZero:instalaEsquemaPosseNodeZero)({db});process.stdout.write('posse_schema_ok\n');}
  catch{process.stderr.write('posse_schema_failed\n');process.exitCode=1;}
}
