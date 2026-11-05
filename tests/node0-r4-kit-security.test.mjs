/** Independent packaging trust-boundary probe. All executable fixture effects stay in /tmp. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {empaquetaR4} from '../tooling/node0/empaqueta-kit-node0-r4.mjs';
const sealed=process.env.SDP_NODE0_R3_KIT;

test('R4 never executes an unverified verifier despite pinned R3 manifest and checksum sidecar',{skip:!sealed?'Explicit sealed R3 artifact required; no substitute fixture can forge its pinned SHA':false},()=>{
  const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r4-verifier-trust-')));
  const candidateRoot=path.join(dir,'candidate'),baseRoot=path.join(dir,'base'),r3Root=path.join(dir,'substituted-r3'),kitRoot=path.join(dir,'delivery');
  for(const root of[candidateRoot,baseRoot,r3Root])fs.mkdirSync(root);
  for(const name of['MANIFEST.json','SHA256SUMS'])fs.copyFileSync(path.join(sealed,name),path.join(r3Root,name));
  fs.mkdirSync(path.join(candidateRoot,'tests'));fs.mkdirSync(path.join(candidateRoot,'tooling/node0'),{recursive:true});
  fs.writeFileSync(path.join(candidateRoot,'tests/node0-fixture.test.mjs'),'// Disposable fixture payload only.\n');
  fs.copyFileSync(path.join(sealed,'verifica_i_aplica.py'),path.join(candidateRoot,'tooling/node0/verifica_kit_node0.py'));
  const marker=path.join(dir,'UNVERIFIED_EXECUTED');
  fs.writeFileSync(path.join(r3Root,'verifica_i_aplica.py'),`from pathlib import Path\nPath(${JSON.stringify(marker)}).write_text("fixture-only execution proof")\nprint('{"write":false}')\n`);
  assert.throws(()=>empaquetaR4({candidateRoot,baseRoot,r3Root,kitRoot,paths:['tests/node0-fixture.test.mjs']}),/r3_verifier_pin_failed/);
  assert.equal(fs.existsSync(marker),false,'The pinned sidecar must authenticate verifier bytes before Python executes them.');
  assert.equal(fs.existsSync(kitRoot),false);
});
test('R4 refuses a substituted output verifier while the actual R3 baseline is intact',{skip:!sealed?'Explicit sealed R3 artifact required':false},()=>{
  const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r4-output-verifier-'))),baseRoot=path.join(dir,'base'),candidateRoot=path.join(dir,'candidate'),kitRoot=path.join(dir,'delivery');
  fs.mkdirSync(baseRoot);fs.mkdirSync(candidateRoot);const manifest=JSON.parse(fs.readFileSync(path.join(sealed,'MANIFEST.json'),'utf8'));
  for(const file of manifest.files){const target=path.join(baseRoot,file.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(sealed,'fitxers',file.path),target);fs.chmodSync(target,file.after.mode);}
  fs.mkdirSync(path.join(candidateRoot,'tests'));fs.mkdirSync(path.join(candidateRoot,'tooling/node0'),{recursive:true});
  fs.writeFileSync(path.join(candidateRoot,'tests/node0-fixture.test.mjs'),'// Disposable fixture payload only.\n');
  fs.writeFileSync(path.join(candidateRoot,'tooling/node0/verifica_kit_node0.py'),'raise SystemExit(0)\n');
  assert.throws(()=>empaquetaR4({candidateRoot,baseRoot,r3Root:sealed,kitRoot,paths:['tests/node0-fixture.test.mjs']}),/candidate_verifier_pin_failed/);
  assert.equal(fs.existsSync(kitRoot),false);
});
test('R4 generation requires all R3 postimages even when its delta contains only a new file',{skip:!sealed?'Explicit sealed R3 artifact required':false},()=>{
  const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r4-pre-r3-base-'))),baseRoot=path.join(dir,'before-r3'),candidateRoot=path.join(dir,'candidate'),kitRoot=path.join(dir,'delivery');
  fs.mkdirSync(baseRoot);fs.mkdirSync(candidateRoot);const manifest=JSON.parse(fs.readFileSync(path.join(sealed,'MANIFEST.json'),'utf8'));
  for(const file of manifest.files.filter(v=>v.before)){const target=path.join(baseRoot,file.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(sealed,'preimatges',file.path),target);fs.chmodSync(target,file.before.mode);}
  fs.mkdirSync(path.join(candidateRoot,'tests'));fs.mkdirSync(path.join(candidateRoot,'tooling/node0'),{recursive:true});
  fs.writeFileSync(path.join(candidateRoot,'tests/node0-fixture.test.mjs'),'// Disposable fixture payload only.\n');fs.copyFileSync(path.join(sealed,'verifica_i_aplica.py'),path.join(candidateRoot,'tooling/node0/verifica_kit_node0.py'));
  assert.throws(()=>empaquetaR4({candidateRoot,baseRoot,r3Root:sealed,kitRoot,paths:['tests/node0-fixture.test.mjs']}),/r3_baseline_/);
  assert.equal(fs.existsSync(kitRoot),false);
});
