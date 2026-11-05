import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {creaSalutMirallWorkspace,validaRebutSalutMirall} from '../tooling/node0/salut-mirall-workspace-node0.mjs';
const NOW=Date.parse('2026-11-04T22:00:00.000Z'),DATE=new Date(NOW).toISOString(),H='a'.repeat(64),sha=v=>createHash('sha256').update(v).digest('hex');
function recipient(){const a='qpzry9x8gf2tvdw0s3jn54khce6mua7l',data=Array(52).fill(0);let c=1;for(const v of[3,3,3,0,1,7,5,...data,0,0,0,0,0,0]){const top=c>>>25;c=((c&0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((top>>>i)&1)c^=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3][i];}c^=1;return'age1'+data.map(v=>a[v]).join('')+Array.from({length:6},(_,i)=>a[(c>>>(5*(5-i)))&31]).join('');}
const RECIPIENT=recipient();
function fixture(t){
 const home=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-private-mirror-health-'))),account=path.join(home,'Library/CloudStorage/GoogleDrive-socdepoble@socdepoble.org'),mirrorDir=path.join(account,'Mi unidad/Sóc de Poble · Mirall Sobirà Node 0'),config=path.join(home,'.config/socdepoble');
 fs.mkdirSync(mirrorDir,{recursive:true,mode:0o700});fs.mkdirSync(config,{recursive:true,mode:0o700});fs.chmodSync(account,0o500);
 t.after(()=>{fs.chmodSync(account,0o700);fs.rmSync(home,{recursive:true,force:true});});
 const record={schema:'sdp.node0.mirror.private-state.v3',configured:true,account:'socdepoble@socdepoble.org',generation:'20261104T220000Z-0123456789abcdef',mirrorConfigSha256:sha(mirrorDir),recipientSha256:sha(RECIPIENT),lastSnapshotAt:DATE,manifestSha256:H,sumsSha256:H,integrityOk:true,verifiedAt:DATE,verificationSource:'last_verified_snapshot',cloudUploadedVerified:false,restoreVerified:false,authenticationVerified:true,authenticationAlgorithm:'HMAC-SHA256',authenticationKeyId:'node0-r8-local-1',retentionOk:null,retentionCode:null},file=path.join(config,'workspace-mirror-state.json');
 const write=value=>{fs.writeFileSync(file,JSON.stringify(value));fs.chmodSync(file,0o600);};write(record);
 return{home,account,mirrorDir,config,file,record,write,probe:creaSalutMirallWorkspace({homeDir:home,mirrorDir,recipient:RECIPIENT,now:()=>NOW,verifyCurrent:async()=>({...record,verifiedAt:DATE,integrityOk:true})})};
}
test('private receipt reports only its last verified snapshot with a separately observed institutional mount',async t=>{
 const f=fixture(t),value=await f.probe();assert.deepEqual(value,{configured:true,lastSnapshotAt:DATE,integrityOk:true,verifiedAt:DATE,verificationSource:'live_authenticated_snapshot',authenticationVerified:true,retentionOk:null});assert.equal(JSON.stringify(value).includes(f.home),false);assert.equal(JSON.stringify(value).includes(RECIPIENT),false);
});
test('the receipt is bound to account, exact target, recipient and generation',async t=>{
 const f=fixture(t);for(const patch of[{account:'other@example.invalid'},{mirrorConfigSha256:'b'.repeat(64)},{recipientSha256:'b'.repeat(64)},{generation:'20260101T220000Z-0123456789abcdef'},{schema:'sdp.node0.mirror.private-state.v1'}]){f.write({...f.record,...patch});assert.equal((await f.probe()).integrityOk,false);}
});
test('future, impossible, expired and reversed dates cannot certify a snapshot',async t=>{
 const f=fixture(t);for(const patch of[{verifiedAt:new Date(NOW+1).toISOString()},{verifiedAt:'2026-02-30T20:00:00.000Z'},{verifiedAt:new Date(NOW-86400001).toISOString(),lastSnapshotAt:new Date(NOW-86400002).toISOString()},{lastSnapshotAt:new Date(NOW+1).toISOString()}]){f.write({...f.record,...patch});assert.equal((await f.probe()).integrityOk,false);}
});
test('unknown fields, nonboolean success and claims of cloud upload are rejected without leaking values',async t=>{
 const f=fixture(t);for(const patch of[{extra:'PRIVATE_SENTINEL'},{integrityOk:'true'},{cloudUploadedVerified:true},{manifestSha256:'invalid'}]){f.write({...f.record,...patch});const v=await f.probe();assert.equal(v.integrityOk,false);assert.equal(JSON.stringify(v).includes('PRIVATE'),false);}
 assert.equal(validaRebutSalutMirall(f.record),false);
});
test('missing or malformed private state and broader filesystem permissions never imply integrity',async t=>{
 const f=fixture(t);fs.writeFileSync(f.file,'not-json');assert.equal((await f.probe()).integrityOk,false);f.write(f.record);fs.chmodSync(f.file,0o644);assert.equal((await f.probe()).integrityOk,false);fs.chmodSync(f.file,0o600);fs.chmodSync(f.config,0o755);assert.equal((await f.probe()).integrityOk,false);fs.chmodSync(f.config,0o700);fs.unlinkSync(f.file);assert.equal((await f.probe()).integrityOk,false);
});
test('linked receipt files and linked or absent mount targets fail closed',async t=>{
 const f=fixture(t),copy=path.join(f.config,'copy.json');fs.linkSync(f.file,copy);assert.equal((await f.probe()).integrityOk,false);fs.unlinkSync(copy);const saved=f.mirrorDir+'-saved';fs.renameSync(f.mirrorDir,saved);assert.equal((await f.probe()).configured,false);fs.symlinkSync(saved,f.mirrorDir);assert.equal((await f.probe()).configured,false);fs.unlinkSync(f.mirrorDir);fs.renameSync(saved,f.mirrorDir);
});
test('foreign and staging targets are rejected before any state read, and cancellation remains inert',async t=>{
 const f=fixture(t);for(const mirrorDir of[path.join(f.home,'socdepoble-node0/mirall-workspace-staging'),path.join(f.home,'Library/CloudStorage/GoogleDrive-other@example.invalid/My Drive/Sóc de Poble · Mirall Sobirà Node 0')])assert.equal((await creaSalutMirallWorkspace({homeDir:f.home,mirrorDir,recipient:RECIPIENT})()).configured,false);
 const abort=new AbortController();abort.abort();assert.equal((await f.probe({signal:abort.signal})).configured,false);
 const later=new AbortController(),pending=f.probe({signal:later.signal});later.abort();assert.equal((await pending).integrityOk,false);
});
