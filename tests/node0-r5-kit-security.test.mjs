/** R5 builder boundary tests. Only explicit immutable R3/R4 artifacts and /tmp fixtures. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {empaquetaR5,comprovaBaseR5,PINS_R5} from '../tooling/node0/empaqueta-kit-node0-r5.mjs';
const r3Root=process.env.SDP_NODE0_R3_KIT,r4Root=process.env.SDP_NODE0_R4_KIT;
const enabled=Boolean(r3Root&&r4Root),skip=enabled?false:'Explicit sealed SDP_NODE0_R3_KIT and SDP_NODE0_R4_KIT required; no forged substitute can match pinned hashes';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const changed='tooling/node0/xarxa-node0.mjs',fresh='tests/node0-r5-disposable-fixture.test.mjs';
function put(root,name,bytes,mode=0o644){const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);fs.chmodSync(target,mode);}
function tree(root){const result=[];const walk=(dir,prefix='')=>{for(const name of fs.readdirSync(dir).sort()){const rel=prefix+name,absolute=path.join(dir,name),info=fs.lstatSync(absolute);if(info.isDirectory())walk(absolute,rel+'/');else result.push({path:rel,mode:info.mode&0o777,sha256:sha(fs.readFileSync(absolute))});}};walk(root);return result;}
function fixture(t){
  const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r5-kit-probe-')));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const baseRoot=path.join(dir,'base'),candidateRoot=path.join(dir,'candidate'),kitRoot=path.join(dir,'delivery');fs.mkdirSync(baseRoot);fs.mkdirSync(candidateRoot);
  const fold=new Map();for(const root of[r3Root,r4Root])for(const file of JSON.parse(fs.readFileSync(path.join(root,'MANIFEST.json'),'utf8')).files)fold.set(file.path,{root,...file});
  assert.equal(fold.size,61);for(const[name,file]of fold){const bytes=fs.readFileSync(path.join(file.root,'fitxers',name));put(baseRoot,name,bytes,file.after.mode);put(candidateRoot,name,bytes,file.after.mode);}
  put(baseRoot,'tests/foreign-operator-sentinel.txt','Unrelated operator file must survive.\n');put(candidateRoot,'tests/foreign-operator-sentinel.txt','Unrelated operator file must survive.\n');
  put(candidateRoot,'tooling/node0/verifica_kit_node0.py',fs.readFileSync(path.join(r3Root,'verifica_i_aplica.py')),0o644);
  put(candidateRoot,changed,Buffer.concat([fs.readFileSync(path.join(candidateRoot,changed)),Buffer.from('\n// Disposable R5 fixture change.\n')]));put(candidateRoot,fresh,'// Disposable new R5 test fixture only.\n');
  return{dir,baseRoot,candidateRoot,kitRoot,r3Root,r4Root,paths:[changed,fresh]};
}
function trustedApply(options,target,...flags){
  const bytes=fs.readFileSync(path.join(r3Root,'verifica_i_aplica.py'));assert.equal(sha(bytes),PINS_R5.verifier);
  const result=spawnSync('python3',['-','--kit',options.kitRoot,'--target',target,...flags],{input:bytes,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
}
function kitCopy(t,original,label){const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r5-sealed-copy-')));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const copy=path.join(dir,label);fs.cpSync(original,copy,{recursive:true,verbatimSymlinks:true});return copy;}

test('R5 check-base validates all61 folded postimages with zero writes, including CLI',{skip},t=>{
  const f=fixture(t),before=tree(f.baseRoot),r3Before=tree(r3Root),r4Before=tree(r4Root);
  assert.equal(comprovaBaseR5(f).files,61);const result=spawnSync(process.execPath,[new URL('../tooling/node0/empaqueta-kit-node0-r5.mjs',import.meta.url).pathname,'--check-base','--base',f.baseRoot,'--r3',r3Root,'--r4',r4Root],{encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).write,false);assert.equal(JSON.parse(result.stdout).files,61);
  assert.deepEqual(tree(f.baseRoot),before);assert.deepEqual(tree(r3Root),r3Before);assert.deepEqual(tree(r4Root),r4Before);assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R5 positive CAS preserves evidence and foreign files through apply, replay and rollback',{skip},t=>{
  const f=fixture(t),before=tree(f.baseRoot);fs.mkdirSync(path.join(f.kitRoot,'evidencies/empty'),{recursive:true});fs.chmodSync(path.join(f.kitRoot,'evidencies/empty'),0o750);put(f.kitRoot,'evidencies/critic.json','{"fixture":true}\n');
  const result=empaquetaR5(f);assert.equal(result.files,2);assert.equal(result.baselineFiles,61);assert.equal(sha(fs.readFileSync(path.join(f.kitRoot,'verifica_i_aplica.py'))),PINS_R5.verifier);assert.equal(fs.statSync(path.join(f.kitRoot,'evidencies/empty')).mode&0o777,0o750);
  assert.equal(trustedApply(f,f.baseRoot).write,false);assert.equal(trustedApply(f,f.baseRoot,'--apply').already_applied,false);assert.equal(trustedApply(f,f.baseRoot,'--apply').already_applied,true);
  for(const name of f.paths)assert.deepEqual(fs.readFileSync(path.join(f.baseRoot,name)),fs.readFileSync(path.join(f.candidateRoot,name)));assert.equal(fs.readFileSync(path.join(f.baseRoot,'tests/foreign-operator-sentinel.txt'),'utf8'),'Unrelated operator file must survive.\n');
  assert.equal(trustedApply(f,f.baseRoot,'--rollback','--apply').already_applied,false);assert.deepEqual(tree(f.baseRoot),before);assert.equal(comprovaBaseR5(f).files,61);
  const sealed=tree(f.kitRoot);assert.throws(()=>empaquetaR5(f),/delivery_already_sealed/);assert.deepEqual(tree(f.kitRoot),sealed);
});
test('R5 publishes a complete new exclusive destination when no evidence directory exists',{skip},t=>{
  const f=fixture(t),before=tree(f.baseRoot);assert.equal(fs.existsSync(f.kitRoot),false);const result=empaquetaR5(f);assert.equal(result.files,2);assert.equal(result.manifestSha256,sha(fs.readFileSync(path.join(f.kitRoot,'MANIFEST.json'))));assert.equal(result.checksumsSha256,sha(fs.readFileSync(path.join(f.kitRoot,'SHA256SUMS'))));assert.equal(trustedApply(f,f.baseRoot).already_applied,false);assert.deepEqual(tree(f.baseRoot),before);
});
test('R5 refuses pre-R3 base even for a new-only candidate delta',{skip},t=>{
  const f=fixture(t),empty=path.join(f.dir,'pre-r3');fs.mkdirSync(empty);for(const file of JSON.parse(fs.readFileSync(path.join(r3Root,'MANIFEST.json'),'utf8')).files)if(file.before)put(empty,file.path,fs.readFileSync(path.join(r3Root,'preimatges',file.path)),file.before.mode);
  assert.throws(()=>empaquetaR5({...f,baseRoot:empty,paths:[fresh]}),/r5_base_postimage_drift/);assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R5 refuses only-R3 and mixed bases despite correct selected new file',{skip},t=>{
  const f=fixture(t),only=path.join(f.dir,'only-r3');fs.mkdirSync(only);for(const file of JSON.parse(fs.readFileSync(path.join(r3Root,'MANIFEST.json'),'utf8')).files)put(only,file.path,fs.readFileSync(path.join(r3Root,'fitxers',file.path)),file.after.mode);
  assert.throws(()=>empaquetaR5({...f,baseRoot:only,paths:[fresh]}),/r5_base_postimage_drift/);
  put(f.baseRoot,'src/data/backendPort.js',fs.readFileSync(path.join(r3Root,'fitxers/src/data/backendPort.js')));assert.throws(()=>empaquetaR5({...f,paths:[fresh]}),/r5_base_postimage_drift/);
});
test('R5 refuses an arbitrary existing preimage outside the folded baseline',{skip},t=>{
  const f=fixture(t);put(f.candidateRoot,'tests/foreign-operator-sentinel.txt','MUST NOT REPLACE\n');assert.throws(()=>empaquetaR5({...f,paths:['tests/foreign-operator-sentinel.txt']}),/r5_preimage_outside_fold_or_drift/);assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R5 never executes malicious input verifier with authentic manifest and sidecar',{skip},t=>{
  const f=fixture(t),copy=kitCopy(t,r4Root,'substituted-r4'),marker=path.join(f.dir,'UNVERIFIED_EXECUTED');put(copy,'verifica_i_aplica.py',`from pathlib import Path\nPath(${JSON.stringify(marker)}).write_text("forbidden fixture effect")\n`,0o755);
  assert.throws(()=>empaquetaR5({...f,r4Root:copy}),/r4_verifier_pin_failed/);assert.equal(fs.existsSync(marker),false);assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R5 rejects modified baseline payload, altered mode and unlisted inventory file',{skip},t=>{
  const f=fixture(t),copy=kitCopy(t,r3Root,'altered-r3'),payload=path.join(copy,'fitxers',changed),bytes=fs.readFileSync(payload),mode=fs.statSync(payload).mode&0o777;
  fs.appendFileSync(payload,'\n// tamper\n');assert.throws(()=>comprovaBaseR5({...f,r3Root:copy}),/r3_integrity_mismatch/);fs.writeFileSync(payload,bytes);fs.chmodSync(payload,mode^0o100);assert.throws(()=>comprovaBaseR5({...f,r3Root:copy}),/r3_payload_or_preimage_mismatch/);fs.chmodSync(payload,mode);
  put(copy,'evidencies/unlisted.json','{}\n');assert.throws(()=>comprovaBaseR5({...f,r3Root:copy}),/r3_inventory_mismatch/);
});
test('R5 refuses symlinks and hardlinks in a pinned baseline artifact',{skip},t=>{
  const f=fixture(t),copy=kitCopy(t,r4Root,'unsafe-r4');fs.linkSync(path.join(copy,'fitxers',changed),path.join(f.dir,'hardlink-fixture'));assert.throws(()=>comprovaBaseR5({...f,r4Root:copy}),/source_non_regular/);
  const link=path.join(f.dir,'base-link');fs.symlinkSync(f.baseRoot,link);assert.throws(()=>comprovaBaseR5({...f,baseRoot:link}),/root_non_directory_or_symlink/);
});
test('R5 refuses substituted output verifier and invalid candidate paths before stage writes',{skip},t=>{
  const f=fixture(t);put(f.candidateRoot,'tooling/node0/verifica_kit_node0.py','raise SystemExit(0)\n');assert.throws(()=>empaquetaR5(f),/candidate_verifier_pin_failed/);assert.equal(fs.existsSync(f.kitRoot),false);
  for(const paths of[['src/A.js','src/a.js'],['src/a','src/a/b.js'],['src/../private.txt'],['.agents/private.json'],['tests/.env.secret']])assert.throws(()=>empaquetaR5({...f,paths}));
});
test('R5 detects selected candidate mutation during staging and never seals output',{skip},t=>{
  const f=fixture(t),mk=fs.mkdtempSync;fs.mkdtempSync=function(prefix,...args){const result=mk.call(this,prefix,...args);if(prefix.includes('.node0-r5-stage-'))fs.appendFileSync(path.join(f.candidateRoot,fresh),'// concurrent fixture edit\n');return result;};
  try{assert.throws(()=>empaquetaR5(f),/source_changed_during_package/);}finally{fs.mkdtempSync=mk;}assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R5 rechecks all61 base paths, not just modified delta paths',{skip},t=>{
  const f=fixture(t),mk=fs.mkdtempSync;fs.mkdtempSync=function(prefix,...args){const result=mk.call(this,prefix,...args);if(prefix.includes('.node0-r5-stage-'))fs.appendFileSync(path.join(f.baseRoot,'src/data/backendPort.js'),'// independent base drift\n');return result;};
  try{assert.throws(()=>empaquetaR5(f),/r5_base_postimage_drift/);}finally{fs.mkdtempSync=mk;}assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R5 refuses concurrent evidence drift and preserves the writer data without a checksum seal',{skip},t=>{
  const f=fixture(t);put(f.kitRoot,'evidencies/critic.json','{"before":true}\n');const mk=fs.mkdtempSync;fs.mkdtempSync=function(prefix,...args){const result=mk.call(this,prefix,...args);if(prefix.includes('.node0-r5-stage-'))put(f.kitRoot,'evidencies/critic.json','{"concurrent":true}\n');return result;};
  try{assert.throws(()=>empaquetaR5(f),/evidence_changed_during_package/);}finally{fs.mkdtempSync=mk;}assert.equal(fs.existsSync(path.join(f.kitRoot,'SHA256SUMS')),false);assert.equal(fs.readFileSync(path.join(f.kitRoot,'evidencies/critic.json'),'utf8'),'{"concurrent":true}\n');
});
test('R5 output root swap cannot create files in an outside directory at the publication boundary',{skip},t=>{
  const f=fixture(t),outside=path.join(f.dir,'outside'),original=path.join(f.dir,'original-delivery');fs.mkdirSync(outside);put(f.kitRoot,'evidencies/critic.json','{"original":true}\n');
  let swapped=false;const swap=()=>{if(swapped)return;swapped=true;fs.renameSync(f.kitRoot,original);fs.symlinkSync(outside,f.kitRoot);};
  const open=fs.openSync,spawn=childProcess.spawnSync;
  // Old path-based publisher: swap immediately before its first leaf open.
  fs.openSync=function(file,...args){if(file===path.join(f.kitRoot,'MANIFEST.json'))swap();return open.call(this,file,...args);};
  // New fd-pinned publisher: same hostile swap after all JS prechecks, before
  // the trusted worker starts. The original vulnerable path also remains above.
  childProcess.spawnSync=function(file,args,...rest){if(args?.some(value=>typeof value==='string'&&value.includes('# R5_SAFE_PUBLISH')))swap();return spawn.call(this,file,args,...rest);};syncBuiltinESMExports();
  try{assert.throws(()=>empaquetaR5(f),/publish_|root_non_directory_or_symlink/);}finally{fs.openSync=open;childProcess.spawnSync=spawn;syncBuiltinESMExports();}
  assert.equal(swapped,true,'The adversarial schedule must actually run');assert.deepEqual(fs.readdirSync(outside),[],'No payload, README or manifest may escape through the replaced root');assert.equal(fs.readFileSync(path.join(original,'evidencies/critic.json'),'utf8'),'{"original":true}\n');
});
