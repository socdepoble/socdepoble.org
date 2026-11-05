/** HTTP health requires bounded private metadata AND an independent current
 * HMAC/content inspection. Historical receipts alone never imply current health.
 * The daemon caches probes for 60s and aborts the worker at its health deadline.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {COMPTE_WORKSPACE,NOM_MIRALL,UNITATS_WORKSPACE} from './resolutor-mirall-institucional.mjs';
import {validaRecipientAge,inspeccionaMirall} from './exporta-mirall-workspace-node0.mjs';
import {MIRROR_AUTH_KEY_ID,MIRROR_AUTH_ALGORITHM,autenticitatMirallLocal} from './autenticitat-mirall-node0.mjs';
const SHA=/^[a-f0-9]{64}$/,TTL=24*60*60*1000,MAX=16384;
const io=fs.promises;
const FIELDS=['schema','configured','account','generation','mirrorConfigSha256','recipientSha256','lastSnapshotAt','manifestSha256','sumsSha256','integrityOk','verifiedAt','verificationSource','cloudUploadedVerified','restoreVerified','authenticationVerified','authenticationAlgorithm','authenticationKeyId','retentionOk','retentionCode'].sort();
const sha=value=>createHash('sha256').update(value).digest('hex');
const stamp=value=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
const identity=s=>[s.dev,s.ino,s.uid,s.mode,s.nlink];
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const no=configured=>({configured,lastSnapshotAt:null,integrityOk:false,verifiedAt:null,verificationSource:null,authenticationVerified:false,retentionOk:null});
function exactTarget(home,mirror){return typeof home==='string'&&typeof mirror==='string'&&path.isAbsolute(home)&&path.resolve(home)===home&&!/[\p{Cc}\p{Cf}\\]/u.test(home+mirror)&&UNITATS_WORKSPACE.some(unit=>mirror===path.join(home,'Library','CloudStorage',COMPTE_WORKSPACE,unit,NOM_MIRALL));}
async function observation(home,mirror,uid,signal){
 const account=path.join(home,'Library','CloudStorage',COMPTE_WORKSPACE),unit=path.dirname(mirror),records=[];
 for(const name of[account,unit,mirror]){if(signal?.aborted)throw Error('probe_aborted');const s=await io.lstat(name);if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==uid||s.mode&0o022)throw Error('mount_metadata_unavailable');records.push(identity(s));}
 return records;
}
async function readReceipt(home,uid,signal){
 const config=path.join(home,'.config','socdepoble');let cursor='/';
 for(const part of config.split('/').slice(1)){if(signal?.aborted)throw Error('probe_aborted');cursor=path.join(cursor,part);const s=await io.lstat(cursor),personal=cursor===home||cursor.startsWith(home+'/');if(!s.isDirectory()||s.isSymbolicLink()||(s.uid!==0&&s.uid!==uid)||personal&&(s.uid!==uid||s.mode&0o022)||!personal&&s.mode&0o022&&!(s.uid===0&&s.mode&0o1000))throw Error('private_state_unavailable');}
 for(const folder of[path.join(home,'.config'),config]){if(signal?.aborted)throw Error('probe_aborted');const s=await io.lstat(folder);if(s.uid!==uid||(s.mode&0o777)!==0o700)throw Error('private_state_unavailable');}
 if(signal?.aborted)throw Error('probe_aborted');
 const name=path.join(config,'workspace-mirror-state.json'),fd=await io.open(name,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
 try{
  const before=await fd.stat(),named=await io.lstat(name);
  if(!before.isFile()||before.nlink!==1||before.uid!==uid||(before.mode&0o7777)!==0o600||before.size<2||before.size>MAX||named.isSymbolicLink()||!equal(identity(before),identity(named)))throw Error('private_state_unavailable');
  if(signal?.aborted)throw Error('probe_aborted');
  const bytes=Buffer.alloc(MAX+1),{bytesRead:length}=await fd.read(bytes,0,bytes.length,0),after=await fd.stat();
  if(length!==before.size||!equal(identity(before),identity(after))||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs||!equal(identity(after),identity(await io.lstat(name))))throw Error('private_state_changed');
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,length)));
 }finally{await fd.close();}
}
export function validaRebutSalutMirall(value,{mirrorDir,recipient,now=Date.now()}={}){
 if(typeof mirrorDir!=='string'||typeof recipient!=='string'||!Number.isFinite(now))return false;
 if(!value||Object.getPrototypeOf(value)!==Object.prototype||!equal(Object.keys(value).sort(),FIELDS)||value.schema!=='sdp.node0.mirror.private-state.v3'||value.configured!==true||value.account!=='socdepoble@socdepoble.org'||value.verificationSource!=='last_verified_snapshot'||value.integrityOk!==true||value.cloudUploadedVerified!==false||value.restoreVerified!==false)return false;
 if(value.authenticationVerified!==true||value.authenticationAlgorithm!==MIRROR_AUTH_ALGORITHM||value.authenticationKeyId!==MIRROR_AUTH_KEY_ID||![null,true,false].includes(value.retentionOk)||value.retentionCode!==(value.retentionOk===false?'mirror_retention_failed':null))return false;
 if(![value.mirrorConfigSha256,value.recipientSha256,value.manifestSha256,value.sumsSha256].every(v=>typeof v==='string'&&SHA.test(v))||value.mirrorConfigSha256!==sha(mirrorDir)||value.recipientSha256!==sha(recipient))return false;
 if(!stamp(value.lastSnapshotAt)||!stamp(value.verifiedAt)||Date.parse(value.lastSnapshotAt)>Date.parse(value.verifiedAt)||Date.parse(value.verifiedAt)>now||now-Date.parse(value.verifiedAt)>TTL)return false;
 return typeof value.generation==='string'&&/^\d{8}T\d{6}Z-[a-f0-9]{16}$/.test(value.generation)&&value.generation.startsWith(value.lastSnapshotAt.slice(0,19).replaceAll('-','').replaceAll(':','')+'Z-');
}
export function creaSalutMirallWorkspace({homeDir=os.homedir(),mirrorDir=process.env.SDP_WORKSPACE_MIRROR_DIR,recipient=process.env.SDP_WORKSPACE_AGE_RECIPIENT,expectedUid=process.getuid?.(),now=Date.now,verifyCurrent=options=>inspeccionaMirall({...options,authentication:autenticitatMirallLocal(homeDir)})}={}){
 return async({signal}={})=>{
  if(signal?.aborted||!exactTarget(homeDir,mirrorDir)||!Number.isSafeInteger(expectedUid)||expectedUid<0)return no(false);
  try{validaRecipientAge(recipient);}catch{return no(false);}
  let before;try{before=await observation(homeDir,mirrorDir,expectedUid,signal);}catch{return no(false);}
  try{
   const receipt=await readReceipt(homeDir,expectedUid,signal);
   if(signal?.aborted||!validaRebutSalutMirall(receipt,{mirrorDir,recipient,now:now()})||!equal(before,await observation(homeDir,mirrorDir,expectedUid,signal)))return no(true);
   const current=await verifyCurrent({mirrorDir,signal,now});
   if(signal?.aborted||current?.integrityOk!==true||!['generation','manifestSha256','sumsSha256','lastSnapshotAt'].every(key=>current[key]===receipt[key])||!equal(before,await observation(homeDir,mirrorDir,expectedUid,signal)))return{...no(true),lastSnapshotAt:receipt.lastSnapshotAt,verifiedAt:receipt.verifiedAt,verificationSource:'last_verified_snapshot'};
   return{configured:true,lastSnapshotAt:receipt.lastSnapshotAt,integrityOk:true,verifiedAt:current.verifiedAt,verificationSource:'live_authenticated_snapshot',authenticationVerified:true,retentionOk:receipt.retentionOk};
  }catch{return no(true);}
 };
}
