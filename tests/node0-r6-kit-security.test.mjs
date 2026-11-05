/** R6 builder boundary tests. Only explicit immutable R3/R4 artifacts and /tmp fixtures. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {empaquetaR6,comprovaBaseR6,PINS_R6,EXTRA_PREIMAGE_PINS_R6} from '../tooling/node0/empaqueta-kit-node0-r6.mjs';
const r3Root=process.env.SDP_NODE0_R3_KIT,r4Root=process.env.SDP_NODE0_R4_KIT,r5Root=process.env.SDP_NODE0_R5_KIT,extraRoot=process.env.SDP_NODE0_R6_EXTRA_ROOT;
const enabled=Boolean(r3Root&&r4Root&&r5Root&&extraRoot),skip=enabled?false:'Explicit sealed R3/R4/R5 artifacts and independently pinned SDP_NODE0_R6_EXTRA_ROOT required; no forged substitute can match pinned hashes';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const changed='tooling/node0/xarxa-node0.mjs',fresh='tests/node0-r6-disposable-fixture.test.mjs';
function put(root,name,bytes,mode=0o644){const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);fs.chmodSync(target,mode);}
function tree(root){const result=[];const walk=(dir,prefix='')=>{for(const name of fs.readdirSync(dir).sort()){const rel=prefix+name,absolute=path.join(dir,name),info=fs.lstatSync(absolute);if(info.isDirectory())walk(absolute,rel+'/');else result.push({path:rel,mode:info.mode&0o777,sha256:sha(fs.readFileSync(absolute))});}};walk(root);return result;}
function fixture(t){
  const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r6-kit-probe-')));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const baseRoot=path.join(dir,'base'),candidateRoot=path.join(dir,'candidate'),kitRoot=path.join(dir,'delivery');fs.mkdirSync(baseRoot);fs.mkdirSync(candidateRoot);
  const fold=new Map();for(const root of[r3Root,r4Root,r5Root])for(const file of JSON.parse(fs.readFileSync(path.join(root,'MANIFEST.json'),'utf8')).files)fold.set(file.path,{root,...file});
  assert.equal(fold.size,86);for(const[name,file]of fold){const bytes=fs.readFileSync(path.join(file.root,'fitxers',name));put(baseRoot,name,bytes,file.after.mode);put(candidateRoot,name,bytes,file.after.mode);}
  for(const[name,pin]of Object.entries(EXTRA_PREIMAGE_PINS_R6)){const bytes=fs.readFileSync(path.join(extraRoot,name));assert.equal(sha(bytes),pin.sha256);assert.equal(fs.statSync(path.join(extraRoot,name)).mode&0o777,pin.mode);put(baseRoot,name,bytes,pin.mode);put(candidateRoot,name,bytes,pin.mode);}
  put(baseRoot,'tests/foreign-operator-sentinel.txt','Unrelated operator file must survive.\n');put(candidateRoot,'tests/foreign-operator-sentinel.txt','Unrelated operator file must survive.\n');
  put(candidateRoot,'tooling/node0/verifica_kit_node0.py',fs.readFileSync(path.join(r3Root,'verifica_i_aplica.py')),0o644);
  put(candidateRoot,changed,Buffer.concat([fs.readFileSync(path.join(candidateRoot,changed)),Buffer.from('\n// Disposable R6 fixture change.\n')]));put(candidateRoot,fresh,'// Disposable new R6 test fixture only.\n');
  return{dir,baseRoot,candidateRoot,kitRoot,r3Root,r4Root,r5Root,paths:[changed,fresh]};
}
function stageBarrier(callback,run){
 const spawn=childProcess.spawnSync;childProcess.spawnSync=function(file,args,...rest){if(args?.some(value=>typeof value==='string'&&value.includes('# R6_SAFE_STAGE')))callback();return spawn.call(this,file,args,...rest);};syncBuiltinESMExports();
 try{return run();}finally{childProcess.spawnSync=spawn;syncBuiltinESMExports();}
}
const buildOptions=options=>{const copy={...options};delete copy.dir;return copy;};
const baseOptions=({baseRoot,r3Root,r4Root,r5Root})=>({baseRoot,r3Root,r4Root,r5Root});
function trustedApply(options,target,...flags){
  const bytes=fs.readFileSync(path.join(r3Root,'verifica_i_aplica.py'));assert.equal(sha(bytes),PINS_R6.verifier);
  const result=spawnSync('python3',['-','--kit',options.kitRoot,'--target',target,...flags],{input:bytes,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
}
function kitCopy(t,original,label){const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r6-sealed-copy-')));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const copy=path.join(dir,label);fs.cpSync(original,copy,{recursive:true,verbatimSymlinks:true});return copy;}

test('R6 check-base validates all95 required preimages (86 folded +9 fixed) with zero writes, including CLI',{skip},t=>{
  const f=fixture(t),before=tree(f.baseRoot),r3Before=tree(r3Root),r4Before=tree(r4Root),r5Before=tree(r5Root);
  assert.equal(comprovaBaseR6(baseOptions(f)).files,95);const result=spawnSync(process.execPath,[new URL('../tooling/node0/empaqueta-kit-node0-r6.mjs',import.meta.url).pathname,'--check-base','--base',f.baseRoot,'--r3',r3Root,'--r4',r4Root,'--r5',r5Root],{encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).write,false);assert.equal(JSON.parse(result.stdout).files,95);
  assert.deepEqual(tree(f.baseRoot),before);assert.deepEqual(tree(r3Root),r3Before);assert.deepEqual(tree(r4Root),r4Before);assert.deepEqual(tree(r5Root),r5Before);assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R6 positive CAS preserves evidence and foreign files through apply, replay and rollback',{skip},t=>{
  const f=fixture(t),before=tree(f.baseRoot);fs.mkdirSync(path.join(f.kitRoot,'evidencies/empty'),{recursive:true});fs.chmodSync(path.join(f.kitRoot,'evidencies/empty'),0o750);put(f.kitRoot,'evidencies/critic.json','{"fixture":true}\n');
  const result=empaquetaR6(buildOptions(f));assert.equal(result.files,2);assert.equal(result.baselineFiles,95);assert.equal(sha(fs.readFileSync(path.join(f.kitRoot,'verifica_i_aplica.py'))),PINS_R6.verifier);assert.equal(fs.statSync(path.join(f.kitRoot,'evidencies/empty')).mode&0o777,0o750);
  assert.equal(trustedApply(f,f.baseRoot).write,false);assert.equal(trustedApply(f,f.baseRoot,'--apply').already_applied,false);assert.equal(trustedApply(f,f.baseRoot,'--apply').already_applied,true);
  for(const name of f.paths)assert.deepEqual(fs.readFileSync(path.join(f.baseRoot,name)),fs.readFileSync(path.join(f.candidateRoot,name)));assert.equal(fs.readFileSync(path.join(f.baseRoot,'tests/foreign-operator-sentinel.txt'),'utf8'),'Unrelated operator file must survive.\n');
  assert.equal(trustedApply(f,f.baseRoot,'--rollback','--apply').already_applied,false);assert.deepEqual(tree(f.baseRoot),before);assert.equal(comprovaBaseR6(baseOptions(f)).files,95);
  const sealed=tree(f.kitRoot);assert.throws(()=>empaquetaR6(buildOptions(f)),/delivery_already_sealed/);assert.deepEqual(tree(f.kitRoot),sealed);
});
test('R6 publishes a complete new exclusive destination when no evidence directory exists',{skip},t=>{
  const f=fixture(t),before=tree(f.baseRoot);assert.equal(fs.existsSync(f.kitRoot),false);const result=empaquetaR6(buildOptions(f));assert.equal(result.files,2);assert.equal(result.manifestSha256,sha(fs.readFileSync(path.join(f.kitRoot,'MANIFEST.json'))));assert.equal(result.checksumsSha256,sha(fs.readFileSync(path.join(f.kitRoot,'SHA256SUMS'))));assert.equal(trustedApply(f,f.baseRoot).already_applied,false);assert.deepEqual(tree(f.baseRoot),before);
});
test('R6 refuses pre-R3 base even for a new-only candidate delta',{skip},t=>{
  const f=fixture(t),empty=path.join(f.dir,'pre-r3');fs.mkdirSync(empty);for(const file of JSON.parse(fs.readFileSync(path.join(r3Root,'MANIFEST.json'),'utf8')).files)if(file.before)put(empty,file.path,fs.readFileSync(path.join(r3Root,'preimatges',file.path)),file.before.mode);
  assert.throws(()=>empaquetaR6({...buildOptions(f),baseRoot:empty,paths:[fresh]}),/r6_base_postimage_drift/);assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R6 refuses only-R3 and mixed bases despite correct selected new file',{skip},t=>{
  const f=fixture(t),only=path.join(f.dir,'only-r3');fs.mkdirSync(only);for(const file of JSON.parse(fs.readFileSync(path.join(r3Root,'MANIFEST.json'),'utf8')).files)put(only,file.path,fs.readFileSync(path.join(r3Root,'fitxers',file.path)),file.after.mode);
  assert.throws(()=>empaquetaR6({...buildOptions(f),baseRoot:only,paths:[fresh]}),/r6_base_postimage_drift/);
  put(f.baseRoot,'src/data/backendPort.js',fs.readFileSync(path.join(r3Root,'fitxers/src/data/backendPort.js')));assert.throws(()=>empaquetaR6({...buildOptions(f),paths:[fresh]}),/r6_base_postimage_drift/);
});
test('R6 refuses an arbitrary existing preimage outside the folded baseline',{skip},t=>{
  const f=fixture(t);put(f.candidateRoot,'tests/foreign-operator-sentinel.txt','MUST NOT REPLACE\n');assert.throws(()=>empaquetaR6({...buildOptions(f),paths:['tests/foreign-operator-sentinel.txt']}),/r6_preimage_outside_reviewed_authority/);assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R6 never executes malicious input verifier with authentic manifest and sidecar',{skip},t=>{
  const f=fixture(t),copy=kitCopy(t,r4Root,'substituted-r4'),marker=path.join(f.dir,'UNVERIFIED_EXECUTED');put(copy,'verifica_i_aplica.py',`from pathlib import Path\nPath(${JSON.stringify(marker)}).write_text("forbidden fixture effect")\n`,0o755);
  assert.throws(()=>empaquetaR6({...buildOptions(f),r4Root:copy}),/r4_verifier_pin_failed/);assert.equal(fs.existsSync(marker),false);assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R6 rejects modified baseline payload, altered mode and unlisted inventory file',{skip},t=>{
  const f=fixture(t),copy=kitCopy(t,r3Root,'altered-r3'),payload=path.join(copy,'fitxers',changed),bytes=fs.readFileSync(payload),mode=fs.statSync(payload).mode&0o777;
  fs.appendFileSync(payload,'\n// tamper\n');assert.throws(()=>comprovaBaseR6({...baseOptions(f),r3Root:copy}),/r3_integrity_mismatch/);fs.writeFileSync(payload,bytes);fs.chmodSync(payload,mode^0o100);assert.throws(()=>comprovaBaseR6({...baseOptions(f),r3Root:copy}),/r3_payload_or_preimage_mismatch/);fs.chmodSync(payload,mode);
  put(copy,'evidencies/unlisted.json','{}\n');assert.throws(()=>comprovaBaseR6({...baseOptions(f),r3Root:copy}),/r3_inventory_mismatch/);
});
test('R6 refuses symlinks and hardlinks in a pinned baseline artifact',{skip},t=>{
  const f=fixture(t),copy=kitCopy(t,r4Root,'unsafe-r4');fs.linkSync(path.join(copy,'fitxers',changed),path.join(f.dir,'hardlink-fixture'));assert.throws(()=>comprovaBaseR6({...baseOptions(f),r4Root:copy}),/source_non_regular/);
  const link=path.join(f.dir,'base-link');fs.symlinkSync(f.baseRoot,link);assert.throws(()=>comprovaBaseR6({...baseOptions(f),baseRoot:link}),/root_non_directory_or_symlink/);
});
test('R6 refuses substituted output verifier and invalid candidate paths before stage writes',{skip},t=>{
  const f=fixture(t);put(f.candidateRoot,'tooling/node0/verifica_kit_node0.py','raise SystemExit(0)\n');assert.throws(()=>empaquetaR6(buildOptions(f)),/candidate_verifier_pin_failed/);assert.equal(fs.existsSync(f.kitRoot),false);
  for(const paths of[['src/A.js','src/a.js'],['src/a','src/a/b.js'],['src/../private.txt'],['.agents/private.json'],['tests/.env.secret']])assert.throws(()=>empaquetaR6({...buildOptions(f),paths}));
});
test('R6 detects selected candidate mutation during staging and never seals output',{skip},t=>{
  const f=fixture(t);stageBarrier(()=>fs.appendFileSync(path.join(f.candidateRoot,fresh),'// concurrent fixture edit\n'),()=>assert.throws(()=>empaquetaR6(buildOptions(f)),/source_changed_during_package/));assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R6 rechecks all95 base paths, not just modified delta paths',{skip},t=>{
  const f=fixture(t);stageBarrier(()=>fs.appendFileSync(path.join(f.baseRoot,'src/data/backendPort.js'),'// independent base drift\n'),()=>assert.throws(()=>empaquetaR6(buildOptions(f)),/r6_base_postimage_drift/));assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R6 refuses concurrent evidence drift and preserves the writer data without a checksum seal',{skip},t=>{
  const f=fixture(t);put(f.kitRoot,'evidencies/critic.json','{"before":true}\n');stageBarrier(()=>put(f.kitRoot,'evidencies/critic.json','{"concurrent":true}\n'),()=>assert.throws(()=>empaquetaR6(buildOptions(f)),/evidence_changed_during_package/));assert.equal(fs.existsSync(path.join(f.kitRoot,'SHA256SUMS')),false);assert.equal(fs.readFileSync(path.join(f.kitRoot,'evidencies/critic.json'),'utf8'),'{"concurrent":true}\n');
});
test('R6 output root swap cannot create files in an outside directory at the publication boundary',{skip},t=>{
  const f=fixture(t),outside=path.join(f.dir,'outside'),original=path.join(f.dir,'original-delivery');fs.mkdirSync(outside);put(f.kitRoot,'evidencies/critic.json','{"original":true}\n');
  let swapped=false;const swap=()=>{if(swapped)return;swapped=true;fs.renameSync(f.kitRoot,original);fs.symlinkSync(outside,f.kitRoot);};
  const open=fs.openSync,spawn=childProcess.spawnSync;
  // Old path-based publisher: swap immediately before its first leaf open.
  fs.openSync=function(file,...args){if(file===path.join(f.kitRoot,'MANIFEST.json'))swap();return open.call(this,file,...args);};
  // New fd-pinned publisher: same hostile swap after all JS prechecks, before
  // the trusted worker starts. The original vulnerable path also remains above.
  childProcess.spawnSync=function(file,args,...rest){if(args?.some(value=>typeof value==='string'&&value.includes('# R6_SAFE_PUBLISH')))swap();return spawn.call(this,file,args,...rest);};syncBuiltinESMExports();
  try{assert.throws(()=>empaquetaR6(buildOptions(f)),/publish_|root_non_directory_or_symlink/);}finally{fs.openSync=open;childProcess.spawnSync=spawn;syncBuiltinESMExports();}
  assert.equal(swapped,true,'The adversarial schedule must actually run');assert.deepEqual(fs.readdirSync(outside),[],'No payload, README or manifest may escape through the replaced root');assert.equal(fs.readFileSync(path.join(original,'evidencies/critic.json'),'utf8'),'{"original":true}\n');
});

test('R6 nine fixed extra preimages are real existing before-images and replay restores all nine',{skip},t=>{
 const f=fixture(t),paths=Object.keys(EXTRA_PREIMAGE_PINS_R6),before=tree(f.baseRoot);
 for(const name of paths)fs.appendFileSync(path.join(f.candidateRoot,name),'\n// Disposable reviewed R6 extra change.\n');
 const result=empaquetaR6({...buildOptions(f),paths});assert.equal(result.baselineFiles,95);assert.equal(result.foldedBaselineFiles,86);assert.equal(result.extraPreimages,9);
 const manifest=JSON.parse(fs.readFileSync(path.join(f.kitRoot,'MANIFEST.json'),'utf8'));assert.equal(manifest.baseline.foldedFiles,86);assert.equal(manifest.baseline.requiredPreimages,95);
 for(const file of manifest.files){assert.ok(file.before,'An existing extra must never be represented as absent');assert.deepEqual(file.before,EXTRA_PREIMAGE_PINS_R6[file.path]);assert.equal(sha(fs.readFileSync(path.join(f.kitRoot,'preimatges',file.path))),file.before.sha256);}
 assert.match(fs.readFileSync(path.join(f.kitRoot,'README_INTEGRACIO.md'),'utf8'),/\n\n/);
 trustedApply(f,f.baseRoot,'--apply');assert.equal(trustedApply(f,f.baseRoot,'--apply').already_applied,true);trustedApply(f,f.baseRoot,'--rollback','--apply');assert.deepEqual(tree(f.baseRoot),before);
});
test('R6 missing or modified fixed extras fail even for a new-only delta',{skip},t=>{
 const f=fixture(t),names=Object.keys(EXTRA_PREIMAGE_PINS_R6);
 for(const name of names){const file=path.join(f.baseRoot,name),bytes=fs.readFileSync(file);fs.unlinkSync(file);assert.throws(()=>empaquetaR6({...buildOptions(f),paths:[fresh]}),/r6_extra_preimage_drift/);put(f.baseRoot,name,bytes);fs.appendFileSync(file,'\n// extra drift\n');assert.throws(()=>comprovaBaseR6({baseRoot:f.baseRoot,r3Root,r4Root,r5Root}),/r6_extra_preimage_drift/);put(f.baseRoot,name,bytes);fs.chmodSync(file,EXTRA_PREIMAGE_PINS_R6[name].mode^0o100);assert.throws(()=>comprovaBaseR6(baseOptions(f)),/r6_extra_preimage_drift/);fs.chmodSync(file,EXTRA_PREIMAGE_PINS_R6[name].mode);}
 assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R6 fixed pin map rejects caller extensions, false absence and JSON override authority',{skip},t=>{
 const f=fixture(t),extra=Object.keys(EXTRA_PREIMAGE_PINS_R6)[0];assert.ok(Object.isFrozen(EXTRA_PREIMAGE_PINS_R6));assert.throws(()=>{EXTRA_PREIMAGE_PINS_R6[extra].sha256='0'.repeat(64);},TypeError);
 for(const key of ['extraPins','extraPreimages','pinMap','baselineOverrides'])assert.throws(()=>empaquetaR6({...buildOptions(f),[key]:{[extra]:null}}),/invalid_options/);
 assert.throws(()=>comprovaBaseR6({...baseOptions(f),extraPreimages:{[extra]:null}}),/invalid_options/);
 const json=path.join(f.dir,'unreviewed-pins.json');fs.writeFileSync(json,JSON.stringify({[extra]:null}));const cli=spawnSync(process.execPath,[new URL('../tooling/node0/empaqueta-kit-node0-r6.mjs',import.meta.url).pathname,'--check-base','--base',f.baseRoot,'--r3',r3Root,'--r4',r4Root,'--r5',r5Root,'--extra-preimages',json],{encoding:'utf8'});assert.notEqual(cli.status,0);assert.equal(fs.existsSync(f.kitRoot),false);
 fs.unlinkSync(path.join(f.baseRoot,extra));assert.throws(()=>empaquetaR6({...buildOptions(f),paths:[extra]}),/r6_extra_preimage_drift/);assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R6 validates the sealed R5 kit itself without ever executing its substituted verifier',{skip},t=>{
 const f=fixture(t),copy=kitCopy(t,r5Root,'substituted-r5'),marker=path.join(f.dir,'R5_CODE_EXECUTED');put(copy,'verifica_i_aplica.py','from pathlib import Path\nPath('+JSON.stringify(marker)+').write_text("forbidden")\n',0o755);
 assert.throws(()=>empaquetaR6({...buildOptions(f),r5Root:copy}),/r5_verifier_pin_failed/);assert.equal(fs.existsSync(marker),false);
});
test('R6 refuses complete R3+R4 without R5 even when all reviewed extras exist',{skip},t=>{
 const f=fixture(t),old=path.join(f.dir,'only-r3-r4');fs.mkdirSync(old);const fold=new Map();for(const root of[r3Root,r4Root])for(const file of JSON.parse(fs.readFileSync(path.join(root,'MANIFEST.json'),'utf8')).files)fold.set(file.path,{root,...file});for(const[name,file]of fold)put(old,name,fs.readFileSync(path.join(file.root,'fitxers',name)),file.after.mode);for(const[name,pin]of Object.entries(EXTRA_PREIMAGE_PINS_R6))put(old,name,fs.readFileSync(path.join(extraRoot,name)),pin.mode);
 assert.throws(()=>empaquetaR6({...buildOptions(f),baseRoot:old,paths:[fresh]}),/r6_base_postimage_drift/);assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R6 rechecks all nine fixed extras after staging and never seals a drifted extra',{skip},t=>{
 const f=fixture(t),name=Object.keys(EXTRA_PREIMAGE_PINS_R6)[0];stageBarrier(()=>fs.appendFileSync(path.join(f.baseRoot,name),'// concurrent extra drift\n'),()=>assert.throws(()=>empaquetaR6(buildOptions(f)),/r6_extra_preimage_drift/));assert.equal(fs.existsSync(f.kitRoot),false);
});

function stageWorkerSchedule(transform,run,{allowLegacy=false}={}){
 const spawn=childProcess.spawnSync;let injected=false;
 childProcess.spawnSync=function(file,args,...rest){
  if(args?.some(value=>typeof value==='string'&&value.includes('# R6_SAFE_STAGE'))){args=args.map(value=>typeof value==='string'&&value.includes('# R6_SAFE_STAGE')?transform(value):value);injected=true;}
  return spawn.call(this,file,args,...rest);
 };syncBuiltinESMExports();
 try{run();assert.equal(injected||allowLegacy,true,'The fd worker barrier must actually execute');}finally{childProcess.spawnSync=spawn;syncBuiltinESMExports();}
}
test('R6 stage root swap at the exact create/open boundary cannot write a foreign payload',{skip},t=>{
 const f=fixture(t),outside=path.join(f.dir,'outside');fs.mkdirSync(outside);
 const mk=fs.mkdtempSync;let legacySwap=false;fs.mkdtempSync=function(prefix,...args){const result=mk.call(this,prefix,...args);if(prefix.includes('.node0-r6-stage-')){fs.renameSync(result,result+'-held');fs.symlinkSync(outside,result);legacySwap=true;}return result;};
 try{stageWorkerSchedule(code=>{
  const needle='    stage=os.open(name,DIR,dir_fd=base);stageinfo=os.fstat(stage)';assert.ok(code.includes(needle));
  return code.replace(needle,`    os.rename(name,name+'-held',src_dir_fd=base,dst_dir_fd=base);os.symlink(${JSON.stringify(outside)},name,dir_fd=base)\n${needle}`);
 },()=>assert.throws(()=>empaquetaR6(buildOptions(f)),/stage_refused|stage_root_drift|root_non_directory_or_symlink/),{allowLegacy:true});}finally{fs.mkdtempSync=mk;}
 assert.equal(legacySwap||fs.readdirSync(f.dir).some(name=>name.startsWith('.node0-r6-stage-')&&fs.lstatSync(path.join(f.dir,name)).isSymbolicLink()),true,'The hostile stage substitution must actually happen');
 assert.deepEqual(fs.readdirSync(outside),[]);assert.equal(fs.existsSync(f.kitRoot),false);
 const held=fs.readdirSync(f.dir).filter(name=>name.startsWith('.node0-r6-stage-')&&name.endsWith('-held'));assert.equal(held.length,1);assert.deepEqual(fs.readdirSync(path.join(f.dir,held[0])),[]);
});
test('R6 stage ancestor swap after parent pin keeps a leaf under its original directory fd',{skip},t=>{
 const f=fixture(t),outside=path.join(f.dir,'outside');fs.mkdirSync(outside);
 stageWorkerSchedule(code=>{
  const needle='        file=os.open(leaf,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,mode,dir_fd=holder)';assert.ok(code.includes(needle));
  return code.replace(needle,`        if name.startswith('fitxers/') and not os.path.lexists(${JSON.stringify(path.join(f.dir,'schedule-fired'))}):\n            os.rename('fitxers','fitxers-held',src_dir_fd=fd,dst_dir_fd=fd);os.symlink(${JSON.stringify(outside)},'fitxers',dir_fd=fd)\n            with open(${JSON.stringify(path.join(f.dir,'schedule-fired'))},'x') as marker:marker.write('temporary test barrier')\n${needle}`);
 },()=>assert.throws(()=>empaquetaR6(buildOptions(f)),/stage_refused|stage_failed/));
 assert.equal(fs.existsSync(path.join(f.dir,'schedule-fired')),true);assert.deepEqual(fs.readdirSync(outside),[]);assert.equal(fs.existsSync(f.kitRoot),false);
 const stage=fs.readdirSync(f.dir).find(name=>name.startsWith('.node0-r6-stage-'));assert.ok(stage);
 assert.ok(tree(path.join(f.dir,stage,'fitxers-held')).length>0,'A leaf was written to the pinned original parent, never the outside symlink target');
});
test('R6 stage output-parent swap before worker root open refuses before writing outside',{skip},t=>{
 const f=fixture(t),output=path.join(f.dir,'output'),outside=path.join(f.dir,'outside');fs.mkdirSync(output);fs.mkdirSync(outside);f.kitRoot=path.join(output,'delivery');
 stageWorkerSchedule(code=>{
  const needle="    base=root(value['parent']);info=os.fstat(base)";assert.ok(code.includes(needle));
  return code.replace(needle,`    os.rename(value['parent'],value['parent']+'-held');os.symlink(${JSON.stringify(outside)},value['parent'])\n${needle}`);
 },()=>assert.throws(()=>empaquetaR6(buildOptions(f)),/stage_refused/));
 assert.deepEqual(fs.readdirSync(outside),[]);assert.deepEqual(fs.readdirSync(output+'-held'),[]);assert.equal(fs.existsSync(f.kitRoot),false);
});
test('R6 payload cardinality limit refuses before any staging worker or output creation',{skip},t=>{
 const f=fixture(t),before=tree(f.dir);const paths=Array.from({length:513},(_,index)=>'tests/cardinality-'+index+'.mjs');
 assert.throws(()=>empaquetaR6({...buildOptions(f),paths}),/payload_file_limit/);assert.deepEqual(tree(f.dir),before);
});
test('R6 descriptor diff preserves UTF8, no-final-newline evidence and exact payload hashes',{skip},t=>{
 const f=fixture(t);put(f.candidateRoot,fresh,'// Sí, Sóc de Poble 🫒');const result=empaquetaR6(buildOptions(f));assert.equal(result.files,2);
 const patch=fs.readFileSync(path.join(f.kitRoot,'pegats/node0.patch'),'utf8');assert.match(patch,/Sí, Sóc de Poble 🫒/);assert.match(patch,/No newline at end of file/);
 trustedApply(f,f.baseRoot,'--apply');assert.equal(fs.readFileSync(path.join(f.baseRoot,fresh),'utf8'),'// Sí, Sóc de Poble 🫒');trustedApply(f,f.baseRoot,'--rollback','--apply');
});
test('R6 evidence inventory growth is bounded before a stage or delivery file is written',{skip},t=>{
 const f=fixture(t),evidence=path.join(f.kitRoot,'evidencies');fs.mkdirSync(evidence,{recursive:true});
 for(let index=0;index<4097;index++)fs.writeFileSync(path.join(evidence,'bounded-'+index+'.txt'),'');
 assert.throws(()=>empaquetaR6(buildOptions(f)),/inventory_resource_limit/);assert.equal(fs.existsSync(path.join(f.kitRoot,'MANIFEST.json')),false);assert.equal(fs.readdirSync(f.dir).some(name=>name.startsWith('.node0-r6-stage-')),false);
});
test('R6 evidence snapshot ordering handles nested prefixes and Unicode across JS and Python',{skip},t=>{
 const f=fixture(t);for(const name of ['a/inside.txt','a-b.txt','\ue000.txt','🫒.txt'])put(f.kitRoot,'evidencies/'+name,'Evidence bytes: '+name+'\n');
 const result=empaquetaR6(buildOptions(f));assert.equal(result.files,2);assert.equal(trustedApply(f,f.baseRoot).write,false);
 for(const name of ['a/inside.txt','a-b.txt','\ue000.txt','🫒.txt'])assert.equal(fs.readFileSync(path.join(f.kitRoot,'evidencies',name),'utf8'),'Evidence bytes: '+name+'\n');
});
