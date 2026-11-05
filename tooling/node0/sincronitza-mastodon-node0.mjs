#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fitxerRegular } from './fitxers-segurs.mjs';
export async function main(args=process.argv.slice(2)){
  if(args.some(a=>a!=='--apply'))throw new Error('node0_sync_argument_invalid');
  if(!args.includes('--apply')){process.stdout.write(JSON.stringify({applied:false,account:'@depoble@mastodont.cat',operation:'public-read-to-local-postgresql',withdrawal:'explicit-known-URI-GET-proof-only',absenceDeletion:false,permanentTombstones:true,remotePublication:false})+'\n');return;}
  const file=fitxerRegular(path.join(os.homedir(),'.config/socdepoble/node0.env'));
  if(file.stat.mode&0o077)throw new Error('node0_sync_env_permissions');
  process.loadEnvFile(file.absolute);
  const token=process.env.SDP_NODE0_ADMIN_TOKEN;
  if(!token||token.length<32)throw new Error('node0_sync_admin_unconfigured');
  const response=await fetch('http://127.0.0.1:4340/api/v1/node0/mastodon/sync',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:'{}',signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error('node0_sync_failed');
  const result=await response.json();
  const status=await(await fetch('http://127.0.0.1:4340/api/v1/node0/status',{signal:AbortSignal.timeout(5000)})).json();
  process.stdout.write(JSON.stringify({applied:true,checkedAt:new Date().toISOString(),synchronization:result,postgresql:status.postgresql,remotePublication:false})+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(()=>{process.stderr.write('node0_mastodon_sync_failed\n');process.exitCode=1;});
