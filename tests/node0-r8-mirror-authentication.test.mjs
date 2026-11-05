import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {spawnSync} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {exportaMirall} from '../tooling/node0/exporta-mirall-workspace-node0.mjs';
import {creaCertificadorMirall} from '../tooling/node0/certifica-salut-mirall-workspace-node0.mjs';
import {creaSalutMirallWorkspace} from '../tooling/node0/salut-mirall-workspace-node0.mjs';
import {autenticitatMirallLocal} from '../tooling/node0/autenticitat-mirall-node0.mjs';
const DATE='2026-11-04T22:00:00.000Z',NOW=Date.parse(DATE),R='age1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5cu47z';
const workerFile=fileURLToPath(new URL('../tooling/node0/fitxers-mirall.py',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
function worker(request){return new Promise((resolve,reject)=>{const child=spawn('/usr/bin/python3',['-I','-B',workerFile],{stdio:['pipe','pipe','ignore'],env:{PATH:'/usr/bin:/bin',LANG:'C'}});let out='';child.stdout.on('data',c=>{out+=c;});child.on('error',reject);child.on('close',()=>{const v=JSON.parse(out);v.ok?resolve(v.result):reject(Error(v.error));});child.stdin.end(JSON.stringify(request));});}
async function fixture(t){
 const home=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'sdp-r8-authenticated-'))),config=path.join(home,'.config/socdepoble'),mirrorDir=path.join(home,'Library/CloudStorage/GoogleDrive-socdepoble@socdepoble.org/Mi unidad/Sóc de Poble · Mirall Sobirà Node 0');
 await fs.mkdir(config,{recursive:true,mode:0o700});await fs.mkdir(mirrorDir,{recursive:true,mode:0o700});t.after(()=>fs.rm(home,{recursive:true,force:true}));
 const authentication=autenticitatMirallLocal(home);await fs.writeFile(authentication.keyFile,randomBytes(32),{mode:0o600});
 await exportaMirall({mirrorDir,stateDir:config,recipient:R,authentication,providers:{listPublicArticles:async()=>[],listPublicMedia:async()=>[],listPublicOpenData:async()=>[]},reviewedSourceRoots:[],apply:true,now:()=>NOW,runner:async()=>({ciphertext:Buffer.concat([Buffer.from('age-encryption.org/v1\n'),Buffer.alloc(128,11)]),completed:true,encrypted:true,format:'pg_dump-custom-gzip-6',encryption:'age-X25519'})});
 const probe=creaSalutMirallWorkspace({homeDir:home,mirrorDir,recipient:R,now:()=>NOW}),certify=creaCertificadorMirall({homeDir:home,resolveTarget:async()=>({workspaceMirrorConfigured:true,mirrorDir}),worker,readBack:probe,authentication,retentionOk:true,now:()=>NOW});
 return{home,config,mirrorDir,authentication,probe,certify:()=>certify({mirrorDir,recipient:R})};
}
test('real FD worker HMAC publication and recertification produce a v3 receipt consumed by HTTP health',async t=>{
 const f=await fixture(t);assert.equal((await f.probe()).integrityOk,true);await f.certify();const value=await f.probe();assert.equal(value.integrityOk,true);assert.equal(value.authenticationVerified,true);assert.equal(value.retentionOk,true);
 const receipt=JSON.parse(await fs.readFile(path.join(f.config,'workspace-mirror-state.json')));assert.equal(receipt.schema,'sdp.node0.mirror.private-state.v3');assert.equal(receipt.authenticationAlgorithm,'HMAC-SHA256');
});
test('Drive edits with recomputed public hashes cannot mint a fresh healthy private receipt',async t=>{
 const f=await fixture(t);assert.equal((await f.probe()).integrityOk,true);const pointer=JSON.parse(await fs.readFile(path.join(f.mirrorDir,'CURRENT.json'))),gen=path.join(f.mirrorDir,'generacions',pointer.generation),manifest=await fs.readFile(path.join(gen,'MANIFEST.json'));
 const changed=Buffer.concat([manifest,Buffer.from(' ')]),sums=(await fs.readFile(path.join(gen,'SHA256SUMS'),'utf8')).replace(sha(manifest),sha(changed));await fs.writeFile(path.join(gen,'MANIFEST.json'),changed);await fs.writeFile(path.join(gen,'SHA256SUMS'),sums);pointer.manifestSha256=sha(changed);pointer.sumsSha256=sha(sums);await fs.writeFile(path.join(f.mirrorDir,'CURRENT.json'),JSON.stringify(pointer));
 assert.equal((await f.probe()).integrityOk,false,'a historical receipt alone cannot mask a current Drive edit');await assert.rejects(f.certify(),/mirror_authentication_failed/);assert.equal((await f.probe()).integrityOk,false);
});
test('unsigned generations fail ordinary certification without writing a v3 receipt',async t=>{
 const f=await fixture(t);await fs.unlink(path.join(f.config,'workspace-mirror-state.json'));const pointer=JSON.parse(await fs.readFile(path.join(f.mirrorDir,'CURRENT.json')));await fs.unlink(path.join(f.mirrorDir,'generacions',pointer.generation,'AUTHENTICITY.json'));await assert.rejects(f.certify());assert.equal((await f.probe()).integrityOk,false);
});
test('an older failed verification cannot invalidate a newer private receipt',async t=>{
 const f=await fixture(t),old=await worker({action:'state-checkpoint',root:f.config}),file=path.join(f.config,'workspace-mirror-state.json'),record=JSON.parse(await fs.readFile(file));record.verifiedAt='2026-11-04T22:00:00.001Z';await worker({action:'state',root:f.config,data:Buffer.from(JSON.stringify(record)).toString('base64')});assert.equal((await worker({action:'invalidate-state',root:f.config,expectedReceiptSha256:old.receiptSha256})).invalidated,false);assert.equal(JSON.parse(await fs.readFile(file)).verifiedAt,record.verifiedAt);
});
test('local HMAC provisioning is atomic and idempotent and rejects unsafe metadata using synthetic keys only',()=>{
 const file=fileURLToPath(new URL('./fixtures/node0-mirror-authentication.test.py',import.meta.url)),r=spawnSync('/usr/bin/python3',['-I','-B',file],{encoding:'utf8',timeout:10000,maxBuffer:65536});assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),{passed:3,failed:0,secretPrinted:false});
});
