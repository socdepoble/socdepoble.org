#!/usr/bin/env node
/** Isolated PostgreSQL 17 laboratory. Never targets the production database. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { creaPlaMigracions, generaSql, preparaHidratacio } from './hidrata-postgres-node0.mjs';
export const LAB_DATABASE='node0_gauntlet_r4';
const bin=path.join(os.homedir(),'local/postgres17/Postgres.app/Contents/Versions/17/bin');
export async function preparaLaboratori({apply=false}={}){
  if(os.userInfo().username!=='javi'||process.arch!=='arm64'||!fs.existsSync(path.join(bin,'psql')))throw new Error('node0_lab_native_operator_required');
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
  const plan=creaPlaMigracions({root}),hydration=await preparaHidratacio({root});
  const env={...process.env,PGHOST:path.join(os.homedir(),'socdepoble-node0/dades/run/postgres17'),PGPORT:'5432',PGUSER:'javi',PGDATABASE:LAB_DATABASE,PGCONNECT_TIMEOUT:'5'};
  for(const key of ['PGPASSWORD','PGHOSTADDR','PGSERVICE','PGSERVICEFILE','PGOPTIONS'])delete env[key];
  if(!apply)return {apply:false,database:LAB_DATABASE,migrations:plan.migrations.length,productionWrites:0};
  const query=(database,sql)=>{
    if(![LAB_DATABASE,'postgres'].includes(database))throw new Error('node0_lab_database_rejected');
    const r=spawnSync(path.join(bin,'psql'),['-X','-w','-qAt','-v','ON_ERROR_STOP=1'],{env:{...env,PGDATABASE:database},input:sql,encoding:'utf8',maxBuffer:16*1024*1024,timeout:120000});
    if(r.status!==0)throw new Error('node0_lab_database_failed');return r.stdout.trim();
  };
  const exists=query('postgres',"SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname='node0_gauntlet_r4');");
  if(exists!=='t'){
    const created=spawnSync(path.join(bin,'createdb'),['-w',LAB_DATABASE],{env:{...env,PGDATABASE:'postgres'},stdio:'ignore',timeout:10000});
    if(created.status!==0)throw new Error('node0_lab_create_failed');
  }
  query(LAB_DATABASE,generaSql(plan,hydration));
  const authPath=path.join(root,'tooling/node0/auth-node0.sql');
  if(fs.existsSync(authPath))query(LAB_DATABASE,fs.readFileSync(authPath,'utf8'));
  const privacyPath=path.join(root,'tooling/node0/privacitat-postgres-node0.sql');
  if(fs.existsSync(privacyPath))query(LAB_DATABASE,fs.readFileSync(privacyPath,'utf8'));
  const backendPath=path.join(root,'tooling/node0/backend-node0.sql');
  if(fs.existsSync(backendPath))query(LAB_DATABASE,fs.readFileSync(backendPath,'utf8'));
  const status=JSON.parse(query(LAB_DATABASE,"SELECT json_build_object('database',current_database(),'migrations',(SELECT count(*) FROM node0.schema_migrations),'users',(SELECT count(*) FROM auth.users),'notes',(SELECT count(*) FROM public.notes),'version',current_setting('server_version'));"));
  return {apply:true,...status,productionWrites:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  if(process.argv.slice(2).some(x=>x!=='--apply'))throw new Error('node0_lab_invalid_argument');
  preparaLaboratori({apply:process.argv.includes('--apply')}).then(r=>process.stdout.write(JSON.stringify(r)+'\n')).catch(()=>{process.stderr.write('node0_lab_preparation_failed\n');process.exitCode=1;});
}
