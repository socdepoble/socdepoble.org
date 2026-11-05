import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { empaquetaKitNodeZero } from '../tooling/node0/empaqueta-kit-node0.mjs';
const sha = value => createHash('sha256').update(value).digest('hex');
function put(root,name,data,mode=0o644) { const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data,{mode});fs.chmodSync(file,mode); }
function fixture() {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-node0-cas-test-')),base=path.join(dir,'base'),candidate=path.join(dir,'candidate'),target=path.join(dir,'target'),kit=path.join(dir,'kit');
  for(const root of[base,candidate,target])fs.mkdirSync(root);
  put(base,'src/data/backendPort.js','BASE\n');put(target,'src/data/backendPort.js','BASE\n');put(candidate,'src/data/backendPort.js','UPDATED\n');
  put(candidate,'src/data/local/node0-fixture.js','NEW\n',0o755);
  put(candidate,'tooling/node0/verifica_kit_node0.py',fs.readFileSync(new URL('../tooling/node0/verifica_kit_node0.py',import.meta.url)),0o755);
  const opts={baseRoot:base,candidateRoot:candidate,kitRoot:kit,paths:['src/data/backendPort.js','src/data/local/node0-fixture.js'],expectedBackendPortSha:sha('BASE\n')};
  const built=empaquetaKitNodeZero(opts);
  const execute=(...args)=>spawnSync('python3',[path.join(kit,'verifica_i_aplica.py'),'--target',target,...args],{encoding:'utf8'});
  return{dir,base,candidate,target,kit,opts,built,execute};
}
function snapshot(root) { const out={};function visit(dir,prefix=''){for(const name of fs.readdirSync(dir).sort()){const rel=prefix+name,abs=path.join(dir,name),st=fs.lstatSync(abs);if(st.isDirectory())visit(abs,rel+'/');else out[rel]=st.isSymbolicLink()?`link:${fs.readlinkSync(abs)}`:[sha(fs.readFileSync(abs)),st.mode&0o777];}}visit(root);return out; }
function rewriteChecksums(kit) { const out=[];function visit(dir,prefix=''){for(const name of fs.readdirSync(dir).sort()){const rel=prefix+name,abs=path.join(dir,name),st=fs.lstatSync(abs);if(st.isDirectory())visit(abs,rel+'/');else if(rel!=='SHA256SUMS')out.push(`${sha(fs.readFileSync(abs))}  ${rel}\n`);}}visit(kit);fs.writeFileSync(path.join(kit,'SHA256SUMS'),out.join('')); }

test('kit layout, dry-run, apply, modes, idempotence and reverse CAS',()=>{
  const f=fixture(),before=snapshot(f.target);
  assert.equal(f.built.files,2);for(const name of['fitxers','pegats','MANIFEST.json','SHA256SUMS','verifica_i_aplica.py','README_INTEGRACIO.md'])assert.ok(fs.existsSync(path.join(f.kit,name)),name);
  const dry=f.execute();assert.equal(dry.status,0,dry.stderr);assert.equal(JSON.parse(dry.stdout).write,false);assert.deepEqual(snapshot(f.target),before);
  const apply=f.execute('--apply');assert.equal(apply.status,0,apply.stderr);assert.equal(fs.readFileSync(path.join(f.target,'src/data/backendPort.js'),'utf8'),'UPDATED\n');assert.equal(fs.statSync(path.join(f.target,'src/data/local/node0-fixture.js')).mode&0o777,0o755);
  const second=f.execute('--apply');assert.equal(second.status,0,second.stderr);assert.equal(JSON.parse(second.stdout).already_applied,true);
  const rollbackDry=f.execute('--rollback');assert.equal(rollbackDry.status,0,rollbackDry.stderr);assert.equal(fs.readFileSync(path.join(f.target,'src/data/backendPort.js'),'utf8'),'UPDATED\n');
  const rollback=f.execute('--rollback','--apply');assert.equal(rollback.status,0,rollback.stderr);assert.deepEqual(snapshot(f.target),before);
  assert.equal(JSON.parse(f.execute('--rollback','--apply').stdout).already_applied,true);
});

test('one divergent preimage rejects all writes and preserves lock-free target',()=>{
  const f=fixture();put(f.target,'src/data/backendPort.js','OTHER AGENT\n');const before=snapshot(f.target);const result=f.execute('--apply');assert.equal(result.status,1);assert.match(result.stderr,/cas_drift/);assert.deepEqual(snapshot(f.target),before);
});

test('mode drift and pre-existing new file reject before writes',()=>{
  for(const variant of['mode','new']){const f=fixture();if(variant==='mode')fs.chmodSync(path.join(f.target,'src/data/backendPort.js'),0o755);else put(f.target,'src/data/local/node0-fixture.js','EXISTING');const before=snapshot(f.target);assert.equal(f.execute('--apply').status,1);assert.deepEqual(snapshot(f.target),before);}
});

test('cooperative lock refuses and remains intact; no lock stealing',()=>{
  const f=fixture();put(f.target,'.node0-kit.lock','owner');const before=snapshot(f.target),result=f.execute('--apply');assert.equal(result.status,1);assert.match(result.stderr,/target_locked/);assert.deepEqual(snapshot(f.target),before);
});

test('tampered payload or verifier refuses before target mutation',()=>{
  for(const file of['fitxers/src/data/local/node0-fixture.js','verifica_i_aplica.py']){const f=fixture();fs.appendFileSync(path.join(f.kit,file),'\n# drift\n');const before=snapshot(f.target),result=f.execute('--apply');assert.equal(result.status,1);assert.deepEqual(snapshot(f.target),before);}
});

test('target and kit symlinks never follow outside the allowed roots',()=>{
  for(const variant of['target-parent','target-leaf','kit-leaf']){
    const f=fixture(),outside=path.join(f.dir,'outside');fs.mkdirSync(outside);put(outside,'sentinel','KEEP');
    if(variant==='target-parent')fs.symlinkSync(outside,path.join(f.target,'src/data/local'));
    if(variant==='target-leaf'){fs.mkdirSync(path.join(f.target,'src/data/local'));fs.symlinkSync(path.join(outside,'sentinel'),path.join(f.target,'src/data/local/node0-fixture.js'));}
    if(variant==='kit-leaf'){fs.renameSync(path.join(f.kit,'fitxers/src/data/local/node0-fixture.js'),path.join(f.kit,'fixture.saved'));fs.symlinkSync(path.join(outside,'sentinel'),path.join(f.kit,'fitxers/src/data/local/node0-fixture.js'));}
    const before=snapshot(outside);assert.equal(f.execute('--apply').status,1);assert.deepEqual(snapshot(outside),before);
  }
});

test('hardlinked target and untracked kit files refuse',()=>{
  for(const variant of['hardlink','extra']){const f=fixture();if(variant==='hardlink')fs.linkSync(path.join(f.target,'src/data/backendPort.js'),path.join(f.dir,'hardlink'));else put(f.kit,'UNTRACKED','extra');const before=snapshot(f.target);assert.equal(f.execute('--apply').status,1);assert.deepEqual(snapshot(f.target),before);}
});

test('forged traversal manifest with recomputed sidecar still refuses',()=>{
  const f=fixture(),p=path.join(f.kit,'MANIFEST.json'),manifest=JSON.parse(fs.readFileSync(p));manifest.files[0].path='../outside';fs.writeFileSync(p,JSON.stringify(manifest));rewriteChecksums(f.kit);const before=snapshot(f.target);assert.equal(f.execute('--apply').status,1);assert.deepEqual(snapshot(f.target),before);
});

test('captured mid-apply failure rolls back exactly and releases owned lock',()=>{
  for(const phase of['before','after']){
    const f=fixture();
    const script=`import importlib.util, pathlib, sys\nsys.dont_write_bytecode=True\nspec=importlib.util.spec_from_file_location('cas',${JSON.stringify(path.join(f.kit,'verifica_i_aplica.py'))})\nm=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\noriginal=m.replace_file\ncalls=0\ndef failing(*args):\n global calls\n calls+=1\n if calls==2 and ${JSON.stringify(phase)}=='before': raise OSError('injected failure')\n result=original(*args)\n if calls==2 and ${JSON.stringify(phase)}=='after': raise OSError('injected failure')\n return result\nm.replace_file=failing\ntry: m.run(pathlib.Path(${JSON.stringify(f.kit)}),pathlib.Path(${JSON.stringify(f.target)}),True)\nexcept OSError: pass\nelse: raise AssertionError('failure did not fire')\nassert calls == ${phase==='before'?3:4}, calls\n`;
    const before=snapshot(f.target),result=spawnSync('python3',['-c',script],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.deepEqual(snapshot(f.target),before);
  }
});

test('builder refuses divergent baseline and existing new paths',()=>{
  const f=fixture();assert.throws(()=>empaquetaKitNodeZero({...f.opts,kitRoot:path.join(f.dir,'second'),expectedBackendPortSha:sha('WRONG')}),/baseline_drift/);
  fs.chmodSync(path.join(f.base,'src/data/backendPort.js'),0o755);assert.throws(()=>empaquetaKitNodeZero({...f.opts,kitRoot:path.join(f.dir,'mode-drift')}),/preimage_mode_drift/);fs.chmodSync(path.join(f.base,'src/data/backendPort.js'),0o644);
  put(f.base,'src/data/local/node0-fixture.js','someone else');assert.throws(()=>empaquetaKitNodeZero({...f.opts,kitRoot:path.join(f.dir,'third')}),/new_path_already_exists/);
});

test('symlink root and symlink root ancestor are rejected without following them',()=>{
  for(const variant of['root','ancestor']){
    const f=fixture(),alias=path.join(f.dir,'alias');
    fs.symlinkSync(variant==='root'?f.target:f.dir,alias);
    const target=variant==='root'?alias:path.join(alias,'target'),before=snapshot(f.target);
    const result=spawnSync('python3',[path.join(f.kit,'verifica_i_aplica.py'),'--target',target,'--apply'],{encoding:'utf8'});
    assert.equal(result.status,1,result.stdout);assert.deepEqual(snapshot(f.target),before);
  }
});

test('existing evidence-only delivery root is preserved, inventoried and ready only after checksum sidecar',()=>{
  const f=fixture(),dest=path.join(f.dir,'shared-kit');fs.mkdirSync(dest);put(dest,'evidencies/observation.json','{"ok":true}\n');
  const before=fs.readFileSync(path.join(dest,'evidencies/observation.json'));
  empaquetaKitNodeZero({...f.opts,kitRoot:dest});
  assert.deepEqual(fs.readFileSync(path.join(dest,'evidencies/observation.json')),before);
  const result=spawnSync('python3',[path.join(dest,'verifica_i_aplica.py'),'--target',f.target],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.ok(fs.readFileSync(path.join(dest,'SHA256SUMS'),'utf8').includes('  evidencies/observation.json\n'));
  assert.throws(()=>empaquetaKitNodeZero({...f.opts,kitRoot:dest}),/already_exists/);
});

test('main and test registry changes require explicit baseline pins and apply through the same CAS',()=>{
  const f=fixture();
  const cases=[['src/main.jsx','MAIN BASE\n','MAIN NODE0\n'],['tooling/tests/node-suite-manifest.json','{"tests":[]}\n','{"tests":["node0"]}\n']];
  const pins={};
  for(const[name,before,after]of cases){put(f.base,name,before);put(f.target,name,before);put(f.candidate,name,after);pins[name]=sha(before);}
  const dest=path.join(f.dir,'with-main');
  empaquetaKitNodeZero({...f.opts,kitRoot:dest,paths:[...f.opts.paths,...cases.map(([name])=>name)],additionalExpectedPreimages:pins});
  const result=spawnSync('python3',[path.join(dest,'verifica_i_aplica.py'),'--target',f.target,'--apply'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  for(const[name,,after]of cases)assert.equal(fs.readFileSync(path.join(f.target,name),'utf8'),after);
  assert.throws(()=>empaquetaKitNodeZero({...f.opts,kitRoot:path.join(f.dir,'wrong-main'),paths:[...f.opts.paths,...cases.map(([name])=>name)],additionalExpectedPreimages:{...pins,'src/main.jsx':sha('WRONG')}}),/existing_preimage_drift/);
});
