#!/usr/bin/env node
/** Offline only. No credentials, network, AI, SQL production writes or raw errors. */
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readSnapshot,compareSnapshots,fail,projectSnapshot,sha256} from './lib/radiografia-snapshot.mjs';
import {auditLocal} from './lib/radiografia-local.mjs';
const SAFE_CODES=new Set(['snapshot_schema_invalid','snapshot_size_limit','snapshot_json_invalid','snapshot_string_limit','snapshot_depth_limit','snapshot_node_limit','snapshot_duplicate_key','snapshot_forbidden_key','snapshot_array_limit','snapshot_number_invalid','snapshot_file_invalid','snapshot_symlink_rejected','snapshot_regular_file_required','snapshot_file_changed','snapshot_utf8_invalid','snapshot_file_unreadable','snapshot_duplicate_identity','snapshot_inconsistent','local_probe_no_result','local_probe_source_drift','cli_arguments_invalid']);
export async function main(args=process.argv.slice(2),{write=value=>process.stdout.write(JSON.stringify(value,null,2)+'\n'),audit=auditLocal}={}){
 try{
  if(args.length===1&&args[0]==='--help'){write({usage:'SDP_PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node tooling/gates/verifica-radiografia-supabase-viu.mjs [--snapshot /absolute/regular/file.json]',offline:true,snapshot_contract:'Original probe JSON object, strict schema, duplicate keys rejected, <=8MiB, no symlinks including parent components. Use canonical /private/tmp on macOS.',exit_codes:{0:'local audit completed or observed projection equal',1:'observed structural projection differs',2:'bounded input or execution failure'},limits:'Exactness covers the probe projection, not complete DDL or production safety.'});return 0;}
  let production=null;if(args.length){if(args.length!==2||args[0]!=='--snapshot'||args[1].startsWith('--'))fail('cli_arguments_invalid');production=readSnapshot(args[1]);}
  const {snapshot,report}=await audit();report.repo_structural_sha256=sha256(projectSnapshot(snapshot).structural);
  if(production){report.production_observed=true;report.production_snapshot_sha256=production.sha256;report.comparison=compareSnapshots(snapshot,production.snapshot);report.verdict=report.comparison.structural_equal?'OBSERVED_PROJECTION_EQUAL':'OBSERVED_STRUCTURAL_DRIFT';write(report);return report.comparison.structural_equal?0:1;}
  report.verdict='LOCAL_AUDIT_ONLY_PRODUCTION_UNOBSERVED';write(report);return 0;
 }catch(error){const code=error?.safeCode;write({format:'sdp.r3252.radiografia/v1',ok:false,verdict:'INPUT_OR_LOCAL_EXECUTION_REJECTED',code:SAFE_CODES.has(code)?code:'local_execution_failed'});return 2;}
}
let entryPoint=false;try{entryPoint=Boolean(process.argv[1])&&fs.realpathSync(process.argv[1])===fs.realpathSync(fileURLToPath(import.meta.url));}catch{/* Un executable absent no és el punt d’entrada del mòdul. */}
if(entryPoint)process.exitCode=await main();
