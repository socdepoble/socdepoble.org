#!/usr/bin/env node
/** Explicit one-checkpoint migration. No new dump, key or generation; only the
 * reviewed R7 tree can acquire AUTHENTICITY, then ordinary HMAC certification.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {autenticitatMirallLocal} from './autenticitat-mirall-node0.mjs';
import {resolMirallInstitucional} from './resolutor-mirall-institucional.mjs';
import {validaRecipientAge} from './exporta-mirall-workspace-node0.mjs';
import {main as certify} from './certifica-salut-mirall-workspace-node0.mjs';
const GENERATION='20261104T212515Z-ef95f03c414aefb7';
const APPROVAL='seal-exact-r7-checkpoint-'+GENERATION;
const WORKER_SHA='4ba94625e2737c209fe6cba1735908ec983c62007b022b41b1f7a016e7460191';
const fail=()=>{throw Error('mirror_checkpoint_bootstrap_failed');};
export function creaBootstrapCheckpoint({homeDir,resolveTarget,worker,certifyExisting}){
 return async({mirrorDir,recipient})=>{
  validaRecipientAge(recipient);const target=await resolveTarget({homeDir,mirrorDir,recipient});if(target?.workspaceMirrorConfigured!==true||target.mirrorDir!==mirrorDir)fail();
  const result=await worker({action:'bootstrap-r7-authenticity',root:mirrorDir,authentication:autenticitatMirallLocal(homeDir),operatorApproval:APPROVAL});
  if(result?.generation!==GENERATION||result?.authenticationVerified!==true||result?.bootstrapped!==true)fail();
  const receipt=await certifyExisting();if(receipt?.generation!==GENERATION||receipt.receiptWritten!==true||receipt.readbackOk!==true)fail();
  return{schema:'sdp.node0.r8.checkpoint-bootstrap.v1',generation:GENERATION,authenticated:true,receiptWritten:true,readbackOk:true,newGeneration:false,newDump:false,recoveryIdentityRead:false,externalCustodyVerified:false,cloudUploadedVerified:false};
 };
}
export async function main(args=process.argv.slice(2)){
 if(!Array.isArray(args)||args.length>1||args.length===1&&args[0]!=='--apply')fail();
 if(!args.length)return{apply:false,action:'authenticate-sealed-r7-checkpoint',newGeneration:false,newDump:false};
 const home=os.homedir();if(process.platform!=='darwin'||os.arch()!=='arm64'||home!=='/Users/javi'||process.getuid()!==501||!Object.values(os.networkInterfaces()).flat().some(v=>v?.address==='192.168.0.23'))fail();
 const config=path.join(home,'.config/socdepoble/node0.env'),s=fs.lstatSync(config);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.uid!==501||(s.mode&0o777)!==0o600)fail();process.loadEnvFile(config);
 const program=fileURLToPath(new URL('./fitxers-mirall.py',import.meta.url)),held=fs.openSync(program,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const info=fs.fstatSync(held);if(!info.isFile()||info.nlink!==1||info.uid!==501||info.size>128*1024||createHash('sha256').update(fs.readFileSync(held)).digest('hex')!==WORKER_SHA)fail();}finally{fs.closeSync(held);}
 const worker=req=>{const p=spawnSync('/Library/Developer/CommandLineTools/usr/bin/python3',['-I','-B',program],{input:JSON.stringify(req),encoding:'utf8',timeout:30000,maxBuffer:65536,env:{PATH:'/usr/bin:/bin',LANG:'C'}});if(p.status!==0)fail();const result=JSON.parse(p.stdout);if(result.ok!==true)fail();return result.result;};
 return creaBootstrapCheckpoint({homeDir:home,resolveTarget:resolMirallInstitucional,worker,certifyExisting:()=>certify(['--apply'])})({mirrorDir:process.env.SDP_WORKSPACE_MIRROR_DIR,recipient:process.env.SDP_WORKSPACE_AGE_RECIPIENT});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().then(v=>console.log(JSON.stringify(v))).catch(()=>{console.error('mirror_checkpoint_bootstrap_failed');process.exitCode=1;});
