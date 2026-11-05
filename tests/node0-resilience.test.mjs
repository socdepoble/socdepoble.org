import test from 'node:test';
import assert from 'node:assert/strict';
import {creaSalutResiliencia,normalitzaResiliencia,inspeccionaTimeMachine} from '../tooling/node0/resiliencia-node0.mjs';
const NOW=Date.parse('2026-11-04T20:00:00.000Z'),DATE=new Date(NOW).toISOString();
test('resilience strips every path/credential and never claims integrity without a configured dated snapshot',()=>{
  const secret='PRIVATE_FIXTURE_ONLY',raw={workspaceMirrorConfigured:true,lastMirrorSnapshotAt:DATE,mirrorIntegrityOk:true,mirrorAuthenticationVerified:true,path:secret,token:secret,localTimeMachine:{configured:true,latestBackupFound:true,checkedAt:DATE,destination:secret}};
  const value=normalitzaResiliencia(raw,NOW);assert.deepEqual(Object.keys(value),['localTimeMachine','workspaceMirrorConfigured','lastMirrorSnapshotAt','mirrorIntegrityOk','mirrorVerificationSource','lastMirrorVerifiedAt','mirrorAuthenticationVerified','mirrorRetentionOk','mirrorRecoveryCustodyVerified']);assert.equal(JSON.stringify(value).includes(secret),false);assert.equal(value.mirrorIntegrityOk,true);
  for(const patch of[{workspaceMirrorConfigured:false},{lastMirrorSnapshotAt:null},{lastMirrorSnapshotAt:'2026-02-30T00:00:00.000Z'},{lastMirrorSnapshotAt:new Date(NOW+1).toISOString()},{mirrorIntegrityOk:'true'},{mirrorAuthenticationVerified:false}])assert.equal(normalitzaResiliencia({...raw,...patch},NOW).mirrorIntegrityOk,false);
});
test('public status shares one bounded probe and callers cannot mutate cached metadata',async()=>{
  let tm=0,mirror=0,clock=NOW,release;
  const wait=new Promise(resolve=>release=resolve),service=creaSalutResiliencia({timeMachineProbe:async()=>{tm++;await wait;return{configured:true,latestBackupFound:true};},mirrorProbe:async()=>{mirror++;return{configured:true,lastSnapshotAt:DATE,integrityOk:true,authenticationVerified:true};},now:()=>clock,cacheMs:1000});
  const a=service.refresh(),b=service.refresh();release();const[first,second]=await Promise.all([a,b]);assert.equal(tm,1);assert.equal(mirror,1);first.localTimeMachine.configured=false;assert.equal(second.localTimeMachine.configured,true);
  assert.equal(service.status().mirrorIntegrityOk,true);assert.equal(tm,1);clock+=1000;await service.refresh();assert.equal(tm,2);
});
test('failed probes expose unknown Time Machine and unverified mirror without paths or diagnostics',async()=>{
  const service=creaSalutResiliencia({timeMachineProbe:async()=>{throw Error('/Users/private/key');},mirrorProbe:async()=>{throw Error('PRIVATE TOKEN');},now:()=>NOW});
  assert.deepEqual(await service.refresh(),{localTimeMachine:{configured:null,latestBackupFound:null,checkedAt:DATE},workspaceMirrorConfigured:false,lastMirrorSnapshotAt:null,mirrorIntegrityOk:false,mirrorVerificationSource:null,lastMirrorVerifiedAt:null,mirrorAuthenticationVerified:false,mirrorRetentionOk:null,mirrorRecoveryCustodyVerified:false});
});
test('a stuck probe cannot block status, poisons no future refresh and is cancelled at the deadline',async()=>{
  let stuck=true,signal,clock=NOW;
  const service=creaSalutResiliencia({timeMachineProbe:()=>({configured:true}),mirrorProbe:options=>{signal=options.signal;return stuck?new Promise(()=>{}):{configured:true,lastSnapshotAt:DATE,integrityOk:true,authenticationVerified:true};},now:()=>clock,cacheMs:1000,probeTimeoutMs:20});
  assert.equal(service.status().mirrorIntegrityOk,false);
  const failed=await service.refresh();assert.equal(failed.mirrorIntegrityOk,false);assert.equal(signal.aborted,true);
  stuck=false;clock+=1000;
  assert.equal((await service.refresh()).mirrorIntegrityOk,true,'the same instance recovers in its next cache window');
});
test('Time Machine only interprets configuration and latest-backup existence, never returns destinations',async()=>{
  const calls=[],run=async(file,args)=>{calls.push([file,args]);return{ok:true,stdout:args[0]==='destinationinfo'?'<plist><key>ID</key><string>fixture</string></plist>':'/Volumes/private-machine/2026-11-04-210642.backup'};};
  assert.deepEqual(await inspeccionaTimeMachine({platform:'darwin',run}),{configured:true,latestBackupFound:true});assert.equal(calls.length,2);assert.ok(calls.every(c=>c[0]==='/usr/bin/tmutil'));
  assert.deepEqual(await inspeccionaTimeMachine({platform:'linux',run}),{configured:null,latestBackupFound:null});assert.equal(calls.length,2);
  assert.deepEqual(await inspeccionaTimeMachine({platform:'darwin',run:async()=>({ok:false,stdout:'private diagnostic'})}),{configured:null,latestBackupFound:null});
});
test('a slow Time Machine probe cannot discard an independently verified snapshot receipt',async()=>{
 const service=creaSalutResiliencia({timeMachineProbe:()=>new Promise(()=>{}),mirrorProbe:async()=>({configured:true,lastSnapshotAt:DATE,integrityOk:true,authenticationVerified:true,verifiedAt:DATE,verificationSource:'last_verified_snapshot',path:'/PRIVATE/PATH'}),now:()=>NOW,probeTimeoutMs:20});
 const value=await service.refresh();assert.equal(value.workspaceMirrorConfigured,true);assert.equal(value.mirrorIntegrityOk,true);assert.equal(value.lastMirrorSnapshotAt,DATE);assert.equal(value.mirrorVerificationSource,'last_verified_snapshot');assert.equal(value.lastMirrorVerifiedAt,DATE);assert.equal(value.localTimeMachine.configured,null);assert.equal(JSON.stringify(value).includes('PRIVATE'),false);
 const invalid=normalitzaResiliencia({...value,lastMirrorVerifiedAt:new Date(NOW+1).toISOString()},NOW);assert.equal(invalid.mirrorVerificationSource,null);assert.equal(invalid.lastMirrorVerifiedAt,null);
});
