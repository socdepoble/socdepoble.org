/** AH11 status is observation, not a promise of cloud upload or zero data loss.
 * Only metadata crosses this boundary; no private paths, tokens or key material.
 */
import {execFile} from 'node:child_process';
const iso=(value,now)=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value&&Date.parse(value)<=now?value:null;
const bool=value=>typeof value==='boolean'?value:null;
export function normalitzaResiliencia(value,now=Date.now()){
  const configured=value?.workspaceMirrorConfigured===true,snapshot=configured?iso(value?.lastMirrorSnapshotAt,now):null;
  const verified=configured?iso(value?.lastMirrorVerifiedAt,now):null;
  return{
    localTimeMachine:{configured:bool(value?.localTimeMachine?.configured),latestBackupFound:bool(value?.localTimeMachine?.latestBackupFound),checkedAt:iso(value?.localTimeMachine?.checkedAt,now)},
    workspaceMirrorConfigured:configured,lastMirrorSnapshotAt:snapshot,mirrorIntegrityOk:Boolean(configured&&snapshot&&value?.mirrorIntegrityOk===true&&value?.mirrorAuthenticationVerified===true),
    mirrorVerificationSource:verified&&['last_verified_snapshot','live_authenticated_snapshot'].includes(value?.mirrorVerificationSource)?value.mirrorVerificationSource:null,lastMirrorVerifiedAt:verified,
    mirrorAuthenticationVerified:Boolean(configured&&snapshot&&value?.mirrorIntegrityOk===true&&value?.mirrorAuthenticationVerified===true),
    mirrorRetentionOk:configured&&snapshot?bool(value?.mirrorRetentionOk):null,
    mirrorRecoveryCustodyVerified:false
  };
}
const exec=(file,args,signal)=>new Promise(resolve=>execFile(file,args,{encoding:'utf8',timeout:5000,maxBuffer:65536,signal,env:{PATH:'/usr/bin:/bin',LANG:'C'}},(error,stdout)=>resolve({ok:!error,stdout:typeof stdout==='string'?stdout:''})));
export async function inspeccionaTimeMachine({platform=process.platform,run=exec,signal}={}){
  if(platform!=='darwin')return{configured:null,latestBackupFound:null};
  const destination=await run('/usr/bin/tmutil',['destinationinfo','-X'],signal);
  if(!destination.ok)return{configured:null,latestBackupFound:null};
  const configured=/<key>ID<\/key>/.test(destination.stdout);
  if(!configured)return{configured:false,latestBackupFound:false};
  const latest=await run('/usr/bin/tmutil',['latestbackup'],signal);
  return{configured:true,latestBackupFound:latest.ok?latest.stdout.trim().length>0:null};
}
/** A mirrorProbe must be a server-side verifier/receipt reader. A configured
 * folder alone must never return integrityOk:true. Concurrency is single-flight
 * and bounded probes are cached, so public status cannot spawn tmutil per GET.
 */
export function creaSalutResiliencia({timeMachineProbe=inspeccionaTimeMachine,mirrorProbe=async()=>({configured:false}),now=Date.now,cacheMs=60000,probeTimeoutMs=4000}={}){
  if(typeof timeMachineProbe!=='function'||typeof mirrorProbe!=='function'||typeof now!=='function'||!Number.isSafeInteger(cacheMs)||cacheMs<1000||cacheMs>3600000||!Number.isSafeInteger(probeTimeoutMs)||probeTimeoutMs<10||probeTimeoutMs>5000)throw TypeError('node0_resilience_dependencies_required');
  let cached=null,at=-Infinity,pending=null;
  async function refresh(){
    const current=now();if(cached&&current>=at&&current-at<cacheMs)return structuredClone(cached);
    if(pending)return structuredClone(await pending);
    pending=(async()=>{
      const controller=new AbortController();let timer;
      const timeout=new Promise(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(null);},probeTimeoutMs);});
      const results=[null,null];
      const observe=(index,probe)=>Promise.resolve().then(()=>probe({signal:controller.signal})).then(value=>{results[index]={status:'fulfilled',value};},()=>{results[index]={status:'rejected'};});
      const probes=Promise.all([observe(0,timeMachineProbe),observe(1,mirrorProbe)]);
      try{await Promise.race([probes,timeout]);}finally{clearTimeout(timer);}
      const tm=results[0]?.status==='fulfilled'?results[0].value:null,mirror=results[1]?.status==='fulfilled'?results[1].value:null,checked=now();
      const raw={localTimeMachine:{configured:tm?.configured,latestBackupFound:tm?.latestBackupFound,checkedAt:new Date(checked).toISOString()},workspaceMirrorConfigured:mirror?.configured===true,lastMirrorSnapshotAt:mirror?.lastSnapshotAt,mirrorIntegrityOk:mirror?.integrityOk===true,mirrorVerificationSource:mirror?.verificationSource,lastMirrorVerifiedAt:mirror?.verifiedAt,mirrorAuthenticationVerified:mirror?.authenticationVerified,mirrorRetentionOk:mirror?.retentionOk};
      cached=normalitzaResiliencia(raw,checked);at=checked;return cached;
    })();
    try{return structuredClone(await pending);}finally{pending=null;}
  }
  function status(){
    const current=now();
    if(!cached||current<at||current-at>=cacheMs)void refresh().catch(()=>{});
    return structuredClone(cached??normalitzaResiliencia(null,current));
  }
  return Object.freeze({status,refresh});
}
