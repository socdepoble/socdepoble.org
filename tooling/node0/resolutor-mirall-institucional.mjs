/** AH11 LAB. Read-only exact-account resolver. Never lists CloudStorage or
 * probes any alternative/personal account. No upload, login or Drive write. */
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validaRecipientAge,inspeccionaMirall} from './exporta-mirall-workspace-node0.mjs';

export const COMPTE_WORKSPACE='GoogleDrive-socdepoble@socdepoble.org';
export const UNITATS_WORKSPACE=Object.freeze(['My Drive','Mi unidad','El meu Drive']);
export const NOM_MIRALL='Sóc de Poble · Mirall Sobirà Node 0';
const plainPath=value=>typeof value==='string'&&value.length>1&&value.length<=4096&&path.isAbsolute(value)&&path.resolve(value)===value&&!/[\p{Cc}\p{Cf}\\]/u.test(value)&&value.split('/').length<=64;
const inside=(root,file)=>{const relative=path.relative(root,file);return relative!==''&&!path.isAbsolute(relative)&&relative.split(path.sep)[0]!=='..';};
const WORKER=fileURLToPath(new URL('./sonda-directori-institucional.py',import.meta.url));
/** Every lookup is openat(parent FD, NOFOLLOW). Even an ancestor swap cannot
 * redirect a lookup into another account before the final identity recheck. */
export function sondaDirectoriInstitucional(target,homeDir,expectedUid,{signal,python=process.platform==='darwin'?'/Library/Developer/CommandLineTools/usr/bin/python3':'/usr/bin/python3'}={}){
 if(signal?.aborted||!plainPath(target)||!plainPath(homeDir)||!plainPath(python)||!Number.isSafeInteger(expectedUid)||expectedUid<0)return Promise.resolve(false);
 const drives=UNITATS_WORKSPACE.map(unit=>path.join(homeDir,'Library','CloudStorage',COMPTE_WORKSPACE,unit)),stage=path.join(homeDir,'socdepoble-node0','mirall-workspace-staging');
 if(!drives.some(drive=>inside(drive,target))&&target!==stage)return Promise.resolve(false);
 return new Promise(resolve=>{
  let child,settled=false,output='',size=0;
  const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);resolve(value);};
  const timer=setTimeout(()=>{child?.kill('SIGKILL');finish(false);},2000);
  try{child=spawn(python,['-I','-B',WORKER],{stdio:['pipe','pipe','pipe'],signal,env:{PATH:'/usr/bin:/bin',LANG:'C'},shell:false});
   child.stdout.on('data',chunk=>{size+=chunk.length;if(size>4096){child.kill('SIGKILL');finish(false);}else output+=chunk.toString('utf8');});
   child.stderr.on('data',()=>{});child.once('error',()=>finish(false));child.stdin.once('error',()=>finish(false));
   child.once('close',code=>{try{const value=JSON.parse(output);finish(code===0&&Object.keys(value).length===1&&value.safe===true);}catch{finish(false);}});
   child.stdin.end(JSON.stringify({target,homeDir,expectedUid}));
  }catch{finish(false);}
 });
}

export async function resolMirallInstitucional({homeDir=os.homedir(),mirrorDir=process.env.SDP_WORKSPACE_MIRROR_DIR,recipient=process.env.SDP_WORKSPACE_AGE_RECIPIENT,expectedUid=process.getuid?.(),probeDirectory=sondaDirectoriInstitucional,signal}={}){
 const no=reason=>({workspaceMirrorConfigured:false,mirrorDir:null,reason});
 if(!plainPath(homeDir)||!Number.isSafeInteger(expectedUid)||expectedUid<0||typeof probeDirectory!=='function')return no('institutional_resolver_unavailable');
 const account=path.join(homeDir,'Library','CloudStorage',COMPTE_WORKSPACE),drives=UNITATS_WORKSPACE.map(unit=>path.join(account,unit));
 const candidates=mirrorDir===undefined||mirrorDir===''?drives.map(drive=>path.join(drive,NOM_MIRALL)):[mirrorDir];
 // Reject foreign/personal/noncanonical targets before any filesystem access.
 if(candidates.some(selected=>!plainPath(selected)||!drives.some(drive=>inside(drive,selected))))return no('institutional_target_rejected');
 try{validaRecipientAge(recipient);}catch{return no('institutional_recipient_unavailable');}
 for(const selected of candidates){
  let safe=false;try{safe=await probeDirectory(selected,homeDir,expectedUid,{signal})===true;}catch{/* no private diagnostics */}
  if(safe)return{workspaceMirrorConfigured:true,mirrorDir:selected,reason:null};
 }
 return no('institutional_mount_or_target_unavailable');
}

const metadata=(value,configured,now)=>{
 let date=null;try{const v=value?.lastSnapshotAt;if(typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v&&Date.parse(v)<=now)date=v;}catch{/* no paths/diagnostics from a probe */}
 return{configured,lastSnapshotAt:configured?date:null,integrityOk:Boolean(configured&&date&&value?.integrityOk===true)};
};

/** Safe public probe DTO. Staging is a separate local observation and can
 * never promote workspaceMirrorConfigured. Source/staging paths stay private. */
export function creaSondaMirallInstitucional({homeDir=os.homedir(),mirrorDir=process.env.SDP_WORKSPACE_MIRROR_DIR,recipient=process.env.SDP_WORKSPACE_AGE_RECIPIENT,expectedUid=process.getuid?.(),probeDirectory=sondaDirectoriInstitucional,inspectMirror=inspeccionaMirall,inspectStaging=true,now=Date.now}={}){
 if(typeof inspectMirror!=='function'||typeof now!=='function')throw TypeError('institutional_mirror_dependencies_required');
 const stage=plainPath(homeDir)?path.join(homeDir,'socdepoble-node0','mirall-workspace-staging'):null;
 return async({signal}={})=>{
  const resolved=await resolMirallInstitucional({homeDir,mirrorDir,recipient,expectedUid,probeDirectory,signal});
  let cloud=null,local=null,stagingConfigured=false;
  if(resolved.workspaceMirrorConfigured){try{cloud=await inspectMirror({mirrorDir:resolved.mirrorDir,signal,now});}catch{/* unknown integrity */}}
  let stageSafe=false;try{stageSafe=inspectStaging===true&&stage&&await probeDirectory(stage,homeDir,expectedUid,{signal})===true;}catch{/* no private diagnostics */}
  if(stageSafe){
   stagingConfigured=true;try{local=await inspectMirror({mirrorDir:stage,signal,now});}catch{/* local-only unknown */}
  }
  const stamp=now();return{...metadata(cloud,resolved.workspaceMirrorConfigured,stamp),staging:metadata(local,stagingConfigured,stamp)};
 };
}
