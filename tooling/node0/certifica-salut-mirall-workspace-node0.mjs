#!/usr/bin/env node
/** Operator-only certification of an existing generation; never a new dump.
 * inspect/read/state are the pinned R6 worker's existing FD-safe operations.
 */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolMirallInstitucional,COMPTE_WORKSPACE,NOM_MIRALL,UNITATS_WORKSPACE} from './resolutor-mirall-institucional.mjs';
import {validaRecipientAge} from './exporta-mirall-workspace-node0.mjs';
import {validaRebutSalutMirall,creaSalutMirallWorkspace} from './salut-mirall-workspace-node0.mjs';
import {autenticitatMirallLocal,MIRROR_AUTH_KEY_ID,MIRROR_AUTH_ALGORITHM} from './autenticitat-mirall-node0.mjs';
const sha=v=>createHash('sha256').update(v).digest('hex'),H=/^[a-f0-9]{64}$/,GEN=/^\d{8}T\d{6}Z-[a-f0-9]{16}$/;
const fail=()=>{throw Error('mirror_attestation_failed');};
/** Dependencies are operator capabilities, never fields of an HTTP request. */
export function creaCertificadorMirall({homeDir,resolveTarget,worker,readBack,authentication=autenticitatMirallLocal(homeDir),retentionOk=null,now=Date.now}){
 return async({mirrorDir,recipient})=>{
  if(typeof homeDir!=='string'||!path.isAbsolute(homeDir)||typeof mirrorDir!=='string'||!UNITATS_WORKSPACE.some(unit=>mirrorDir===path.join(homeDir,'Library','CloudStorage',COMPTE_WORKSPACE,unit,NOM_MIRALL)))fail();
  validaRecipientAge(recipient);const target=await resolveTarget({homeDir,mirrorDir,recipient});if(target?.workspaceMirrorConfigured!==true||target.mirrorDir!==mirrorDir)fail();
  if(authentication?.keyId!==MIRROR_AUTH_KEY_ID||![null,true,false].includes(retentionOk))fail();
  const stateRoot=path.join(homeDir,'.config','socdepoble'),checkpoint=await worker({action:'state-checkpoint',root:stateRoot});
  try{
  const first=await worker({action:'inspect',root:mirrorDir,authentication});if(!GEN.test(first?.generation??'')||!H.test(first?.manifestSha256??'')||!H.test(first?.sumsSha256??''))fail();
  const raw=await worker({action:'verified-manifest',root:mirrorDir,authentication});
  if(!Number.isSafeInteger(raw?.bytes)||raw.bytes<1||raw.bytes>65536||typeof raw.data!=='string')fail();
  const bytes=Buffer.from(raw.data,'base64');if(bytes.length!==raw.bytes||sha(bytes)!==first.manifestSha256)fail();const manifest=JSON.parse(bytes);
  if(manifest.schema!=='sdp.node0.workspace-mirror.v1'||manifest.generation!==first.generation||manifest.createdAt!==first.lastSnapshotAt||manifest.snapshot?.recipientSha256!==sha(recipient))fail();
  const second=await worker({action:'inspect',root:mirrorDir,authentication});for(const key of['generation','manifestSha256','sumsSha256','lastSnapshotAt'])if(first[key]!==second?.[key])fail();
  const record={schema:'sdp.node0.mirror.private-state.v3',configured:true,account:'socdepoble@socdepoble.org',generation:first.generation,mirrorConfigSha256:sha(mirrorDir),recipientSha256:sha(recipient),lastSnapshotAt:first.lastSnapshotAt,manifestSha256:first.manifestSha256,sumsSha256:first.sumsSha256,integrityOk:true,verifiedAt:new Date(now()).toISOString(),verificationSource:'last_verified_snapshot',cloudUploadedVerified:false,restoreVerified:false,authenticationVerified:true,authenticationAlgorithm:MIRROR_AUTH_ALGORITHM,authenticationKeyId:MIRROR_AUTH_KEY_ID,retentionOk,retentionCode:retentionOk===false?'mirror_retention_failed':null};
  if(!validaRebutSalutMirall(record,{mirrorDir,recipient,now:now()}))fail();
  const saved=await worker({action:'state',root:path.join(homeDir,'.config','socdepoble'),data:Buffer.from(JSON.stringify(record)+'\n').toString('base64')});if(saved?.written!==true)fail();
  const probe=await readBack();if(probe?.configured!==true||probe.integrityOk!==true||probe.lastSnapshotAt!==record.lastSnapshotAt||!Number.isFinite(Date.parse(probe.verifiedAt))||Date.parse(probe.verifiedAt)<Date.parse(record.verifiedAt)||Date.parse(probe.verifiedAt)>now())fail();
  return{schema:'sdp.node0.workspace-attestation.v1',generation:record.generation,manifestSha256:record.manifestSha256,sumsSha256:record.sumsSha256,lastSnapshotAt:record.lastSnapshotAt,verifiedAt:record.verifiedAt,verificationSource:'last_verified_snapshot',receiptWritten:true,readbackOk:true,cloudUploadedVerified:false,newGeneration:false,privateKeyRead:false,environmentWritten:false};
  }catch(error){
   // The private CAS preserves newer receipts. No Drive generation is changed.
   if(H.test(checkpoint?.receiptSha256??'')&&['mirror_authentication_failed','mirror_current_integrity','mirror_content_integrity','mirror_inventory_integrity','mirror_folder_integrity','mirror_tree_unsafe'].includes(error?.code??error?.message)){
    try{await worker({action:'invalidate-state',root:stateRoot,expectedReceiptSha256:checkpoint.receiptSha256});}catch{/* Never fabricate invalidation success. */}
   }
   throw error;
  }
 };
}
export async function main(args=process.argv.slice(2)){
 if(!Array.isArray(args)||args.some(a=>typeof a!=='string')||args.length>1||args.length===1&&args[0]!=='--apply')fail();
 if(args.length===0)return{apply:false,action:'certify-existing-generation',privateMetadataOnly:true,newGeneration:false};
 if(process.platform!=='darwin'||os.arch()!=='arm64'||os.homedir()!=='/Users/javi'||process.getuid()!==501||!Object.values(os.networkInterfaces()).flat().some(v=>v?.address==='192.168.0.23'))fail();
 const env=path.join(os.homedir(),'.config','socdepoble','node0.env'),s=fs.lstatSync(env);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||(s.mode&0o777)!==0o600||s.uid!==501)fail();process.loadEnvFile(env);
 const script=fileURLToPath(new URL('./fitxers-mirall.py',import.meta.url)),stat=fs.lstatSync(script);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.uid!==501||sha(fs.readFileSync(script))!=="4ba94625e2737c209fe6cba1735908ec983c62007b022b41b1f7a016e7460191")fail();
 const worker=req=>{const r=spawnSync('/Library/Developer/CommandLineTools/usr/bin/python3',['-I','-B',script],{input:JSON.stringify(req),encoding:'utf8',timeout:30000,maxBuffer:524288,env:{PATH:'/usr/bin:/bin',LANG:'C'}});if(r.status!==0)fail();const v=JSON.parse(r.stdout);if(v.ok!==true)throw Error(/^mirror_[a-z_]+$/.test(v.error??'')?v.error:'mirror_attestation_failed');return v.result;};
 const mirrorDir=process.env.SDP_WORKSPACE_MIRROR_DIR,recipient=process.env.SDP_WORKSPACE_AGE_RECIPIENT;
 return creaCertificadorMirall({homeDir:os.homedir(),resolveTarget:resolMirallInstitucional,worker,readBack:creaSalutMirallWorkspace({mirrorDir,recipient})})({mirrorDir,recipient});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().then(v=>console.log(JSON.stringify(v))).catch(()=>{console.error('mirror_attestation_failed');process.exitCode=1;});
