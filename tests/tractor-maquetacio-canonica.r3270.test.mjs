import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditaMaquetacio } from '../tooling/gates/tractor-maquetacio-canonica.mjs';

function fixture(run) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-c11-gate-'));
  const files={
    'src/Vista.jsx':'export const Vista=()=> <UniversalPage><h2>Cos àgil</h2></UniversalPage>;',
    'src/pageContent.fixture.js':'export const PAGE_COPY={ca:{html:"<h2>Prosa</h2>"}};',
    'src/ample.css':'p { max-width: var(--sdp-measure); }',
    'src/unicode.js':'globalThis.__c11GateMustNotExecute=true; export const nom="Torre d’Àlcalà 🌳";'
  };
  for(const[file,text]of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),text);}
  const cacheDir=path.join(root,'cache'),audit=options=>auditaMaquetacio(root,{cacheDir,...options});
  try{return run({root,files,cacheDir,audit});}finally{fs.rmSync(root,{recursive:true,force:true});}
}
const verdict=r=>({ok:r.ok,issues:r.issues,exemptions:r.exemptions,inventory:r.inventory});

test('fresh cache has a real engine identity and preserves every source key after decoding',()=>fixture(({files,audit})=>{
  const first=audit(),again=audit();
  assert.match(first.stats.engineHash,/^[a-f0-9]{64}$/);
  assert(first.stats.engineReadFiles>0);
  assert.equal(first.stats.cache,'verified-content-created');
  assert.equal(again.stats.cache,'verified-content-hit');
  assert.equal(again.stats.parsedModules,0);
  assert.equal(first.stats.inventoryReadFiles,Object.keys(files).length);
  assert.equal(again.stats.inventoryReadFiles,Object.keys(files).length);
  assert.deepEqual(verdict(again),verdict(first));
  assert.equal(globalThis.__c11GateMustNotExecute,undefined);
}));

test('buffer release keeps UTF-8 byte inventory and the full-AST verdict',()=>fixture(({files,audit})=>{
  const uncached=audit({cache:false}),oracle=audit({cache:false,fullAst:true});
  assert.equal(uncached.stats.actualReadBytes,Object.values(files).reduce((n,s)=>n+Buffer.byteLength(s),0));
  assert.equal(uncached.stats.actualReads,Object.keys(files).length);
  assert.deepEqual(uncached.issues.map(x=>x.code).sort(),['MC1','MC2','MC3']);
  assert.deepEqual(verdict(uncached),verdict(oracle));
  assert.equal(globalThis.__c11GateMustNotExecute,undefined);
}));

test('corrupt persisted report cannot suppress findings or lose inventory keys',()=>fixture(({audit,cacheDir})=>{
  const first=audit();fs.writeFileSync(path.join(cacheDir,'report.json'),'{"format":1,"identity":"corrupt"}');
  const repaired=audit();assert.equal(repaired.stats.cache,'verified-content-created');
  assert.deepEqual(verdict(repaired),verdict(first));assert.equal(repaired.stats.inventoryReadFiles,4);
}));

test('fresh byte reads invalidate a verified cache when a source changes',()=>fixture(({audit,root})=>{
  const first=audit();assert.equal(audit().stats.cache,'verified-content-hit');
  fs.writeFileSync(path.join(root,'src/Vista.jsx'),'export const Vista=()=> <UniversalPage><h3>Cos nou</h3></UniversalPage>;');
  const changed=audit();assert.equal(changed.stats.cache,'verified-content-created');
  assert.notEqual(changed.stats.sourceHash,first.stats.sourceHash);
  assert.equal(changed.stats.engineHash,first.stats.engineHash);
  assert.deepEqual(changed.issues.map(x=>x.code).sort(),['MC1','MC3']);
  assert.equal(changed.stats.actualReads,4);
}));
