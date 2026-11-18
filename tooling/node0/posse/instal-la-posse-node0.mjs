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
// Single pin source shared with direct SQL installation; never accept just a count.
const migrationPins=schema.match(/-- POSSE_MIGRATION_PINS_BEGIN\n([\s\S]*?)\n-- POSSE_MIGRATION_PINS_END/)?.[1];
const migrationPairs=[...(migrationPins??'').matchAll(/\((76|77|78|79|80|81|85|86|114|116|119|120|121|123),'([a-f0-9]{64})'\)/g)].map(([,count,hash])=>[count,hash]);
// Two reviewed85 compositions exist (R54 and R15-A3). Preserve exact pair
// identity instead of silently overwriting one hash in a count-keyed object.
const expectedMigrationLedgers=new Set(migrationPairs.map(([count,hash])=>`${count}:${hash}`));
// D-R27-3: parells exactes (76..86 amb els dos 85) més els complets acceptats; recompte no és identitat.
// Onada R30: el complet de 114 (20261115230000); els de 112 i 113 ja no s'accepten.
// Onada R32: el complet era el de 116 (R31 20261116031000 i 20261116040000) i el de 114 es conserva.
// Onada R32.2: es conserven eixe 116 i el 114, i s'afig el 119 amb les tres R32; dotze parells exactes i onze
// recomptes distints. Cap perfil de 117 no hi és. Els perfils del kit R30/R31 amb 20261115231000 i
// 20261115233000 (116 21a3cfc3, 117 i 118) no hi són: eixes migracions no formen part del catàleg.
// Onada R32.4: es conserven el 114, el 116 i el 119, i s'afig el 120 amb 20261117150000 (la pàgina
// /page/sistema-nervios al registre de copublicació, NO aplicada); tretze parells exactes i dotze recomptes distints.
// Onada v1.2.7 (kit R32.5 de Codex): es conserven el 119 i el 120 d'R32.4, i s'afig el 121 amb 20261117140000 (safata
// i revisió LSSI cautelar, NO aplicada); catorze parells exactes i tretze recomptes distints. El 120 del kit R32.5
// (els 119 més 20261117140000, sense 20261117150000) no és cap catàleg publicat i no hi és.
// Onada v1.2.8 (kits R32.7 i R32.8 de Codex): es conserva el 121 de la v1.2.7 i s'afig el 123 amb 20261117173000 i
// 20261117193000 (NO aplicades); quinze parells exactes i catorze recomptes distints. Cap 122 intermedi no és un catàleg publicat.
if(migrationPairs.length!==15||expectedMigrationLedgers.size!==15||new Set(migrationPairs.map(([count])=>count)).size!==14)throw Error('posse_migration_pins_missing');
const FUNCTION_NAMES=['source_current','source_for_bridge','remote_current','assert_current','assert_history','rpc','credential_proof'];
const expectedFunctionHashes=Object.fromEntries(FUNCTION_NAMES.map(name=>{
  const start=schema.indexOf(`CREATE OR REPLACE FUNCTION node0_posse.${name}(`),body=schema.indexOf('AS $f$',start),end=schema.indexOf('$f$;',body+6);
  if(start<0||body<0||end<0)throw Error('posse_schema_definition_missing');
  return[name,createHash('sha256').update(schema.slice(body+6,end)).digest('hex')];
}));

export async function verificaEsquemaPosseNodeZero({db,ownerConnection=false}={}){
  if(typeof db?.query!=='function'||typeof ownerConnection!=='boolean')throw new TypeError('posse_readiness_database_required');
  let state;try{state=await db.query('SELECT node0_posse.readiness();',{privateValues:!ownerConnection});}catch{throw Error('posse_schema_unavailable');}
  if(state?.version!=='posse.r11.v1'||!Number.isInteger(state.migrations)||!expectedMigrationLedgers.has(`${state.migrations}:${state.migrationLedgerSha256}`)||state.ownerStable!==true||state.tablesPrivate!==true||state.sourceInstalled!==true||state.remoteInstalled!==true||FUNCTION_NAMES.some(name=>state.functionHashes?.[name]!==expectedFunctionHashes[name]))throw Error('posse_schema_drift');
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
