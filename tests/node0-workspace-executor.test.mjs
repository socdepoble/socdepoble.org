import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {creaExecutorMirallWorkspace,preparaReceptaWorkspace,analitzaArgumentsWorkspace,main} from '../tooling/node0/executa-mirall-workspace-node0.mjs';
import {UNITATS_WORKSPACE,COMPTE_WORKSPACE,NOM_MIRALL} from '../tooling/node0/resolutor-mirall-institucional.mjs';
const H='a'.repeat(64),HOME='/Users/lab',target=unit=>path.join(HOME,'Library','CloudStorage',COMPTE_WORKSPACE,unit,NOM_MIRALL),sha=b=>createHash('sha256').update(b).digest('hex');
// Synthetic public bytes; no private identity or production recipient.
function recipient(){const a='qpzry9x8gf2tvdw0s3jn54khce6mua7l',d=Array(52).fill(0);let c=1;for(const v of[3,3,3,0,1,7,5,...d,0,0,0,0,0,0]){const t=c>>>25;c=((c&0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((t>>>i)&1)c^=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3][i];}c^=1;return'age1'+d.map(v=>a[v]).join('')+Array.from({length:6},(_,i)=>a[(c>>>(5*(5-i)))&31]).join('');}
const RECIPIENT=recipient();
function scenario(overrides={}){
  const calls=[],exports=[];const execute=creaExecutorMirallWorkspace({homeDir:HOME,expectedUid:501,
    resolveTarget:async o=>{calls.push('resolve');return{workspaceMirrorConfigured:true,mirrorDir:o.mirrorDir};},
    prepareRecipe:async()=>{calls.push('recipe');return{assets:[],manifestSha256:H};},
    prepareSources:async()=>{calls.push('sources');return{providers:{publicOnly:true},coverage:{selectedArticles:10}};},
    createSnapshot:()=>{calls.push('runner');return async()=>{};},
    exportMirror:async o=>{calls.push('export');exports.push(o);return{state:o.apply?'published-local':'planned',integrityOk:o.apply,cloudUploadedVerified:true};},...overrides});
  return{execute,calls,exports,input:{mirrorDir:target('Mi unidad'),recipient:RECIPIENT}};
}
test('staging, personal accounts, alternative subfolders and unknown units fail before resolver or filesystem preparation',async()=>{
  const s=scenario();for(const mirrorDir of[undefined,path.join(HOME,'socdepoble-node0','mirall-workspace-staging'),target('Mi unidad').replace(COMPTE_WORKSPACE,'GoogleDrive-personal@example.test'),target('Unknown Drive'),target('My Drive')+'/extra',target('My Drive').replace(NOM_MIRALL,'other')])await assert.rejects(s.execute({...s.input,mirrorDir}),/target_rejected/);assert.deepEqual(s.calls,[]);
});
test('resolver must positively attest the same exact account path; no fallback or source preparation on failure',async()=>{
  for(const resolveTarget of[async()=>({workspaceMirrorConfigured:false,mirrorDir:null}),async()=>({workspaceMirrorConfigured:true,mirrorDir:path.join(HOME,'staging')}),async()=>{throw Error('PRIVATE_DIAGNOSTIC');}]){const s=scenario({resolveTarget});await assert.rejects(s.execute(s.input),e=>e.code==='mirror_workspace_unavailable'&&!e.message.includes('PRIVATE'));assert.deepEqual(s.calls,[]);}
});
test('all resolver allowlisted localised units work with dry-run default and no snapshot process or cloud claim',async()=>{
  for(const unit of UNITATS_WORKSPACE){const s=scenario(),out=await s.execute({...s.input,mirrorDir:target(unit)});assert.equal(out.state,'planned');assert.equal(out.workspaceMirrorConfigured,true);assert.equal(out.cloudUploadedVerified,false);assert.equal(out.localIntegrityVerified,false);assert.equal(s.calls.filter(c=>c==='resolve').length,2);assert.equal(s.calls.includes('runner'),false);assert.equal(s.exports[0].mirrorDir,target(unit));assert.equal(s.exports[0].apply,false);}
});
test('apply requires an exact source-manifest review pin before source/network or dispatch capability',async()=>{
  const s=scenario();await assert.rejects(s.execute({...s.input,apply:true}),/recipe_review_required/);assert.deepEqual(s.calls,[]);
  await assert.rejects(s.execute({...s.input,apply:true,expectedSourceManifestSha256:'b'.repeat(64)}),/recipe_review_required/);assert.deepEqual(s.calls,['resolve','recipe']);assert.equal(s.exports.length,0);
});
test('one confirmed apply writes only the verified target and cannot inherit a staging destination or fake cloud success',async()=>{
  const s=scenario({prepareSources:async()=>({mirrorDir:path.join(HOME,'staging'),providers:{},coverage:{selectedArticles:10}})});const out=await s.execute({...s.input,apply:true,expectedSourceManifestSha256:H});
  assert.equal(s.exports.length,1);assert.equal(s.exports[0].mirrorDir,s.input.mirrorDir);assert.equal(s.exports[0].apply,true);assert.equal(typeof s.exports[0].runner,'function');assert.equal(out.localIntegrityVerified,true);assert.equal(out.cloudUploadedVerified,false);
});
test('a local recovery identity blocks apply before any source preparation or dump',async()=>{
 const s=scenario({assertCustody:()=>{throw Error('custody_legacy_local_identity_present');}});await assert.rejects(s.execute({...s.input,apply:true,expectedSourceManifestSha256:H}),/custody_legacy_local_identity_present/);assert.deepEqual(s.calls,[]);assert.equal(s.exports.length,0);
});
test('a local identity appearing during preparation blocks the final dump capability',async()=>{
 let checks=0;const s=scenario({assertCustody:()=>{if(++checks===2)throw Error('custody_legacy_local_identity_present');}});await assert.rejects(s.execute({...s.input,apply:true,expectedSourceManifestSha256:H}),/custody_legacy_local_identity_present/);assert.equal(checks,2);assert.equal(s.calls.includes('runner'),false);assert.equal(s.exports.length,0);
});
test('target loss during preparation fails the second resolver check before export or pg_dump creation',async()=>{
  let probes=0;const s=scenario({resolveTarget:async o=>(++probes===1?{workspaceMirrorConfigured:true,mirrorDir:o.mirrorDir}:{workspaceMirrorConfigured:false,mirrorDir:null})});await assert.rejects(s.execute({...s.input,apply:true,expectedSourceManifestSha256:H}),/unavailable/);assert.equal(probes,2);assert.equal(s.calls.includes('runner'),false);assert.equal(s.exports.length,0);
});
test('captured configuration primitives cannot change target while the resolver is awaiting',async()=>{
  let input;const s=scenario({resolveTarget:async o=>{input.mirrorDir=path.join(HOME,'staging');return{workspaceMirrorConfigured:true,mirrorDir:o.mirrorDir};}});input={...s.input};await s.execute(input);assert.equal(s.exports[0].mirrorDir,s.input.mirrorDir);
});
test('CLI and public config pass only allowed fields, with dry-run default and no credential option',async()=>{
  assert.deepEqual(analitzaArgumentsWorkspace([]),{apply:false});for(const args of[['--force'],['--mirror-dir','--apply'],['--recipient',RECIPIENT,'--recipient',RECIPIENT],['--apply','--apply'],['--token','PRIVATE_SENTINEL']])assert.throws(()=>analitzaArgumentsWorkspace(args),/arguments/);
  let seen;await main([],{publicConfig:{SDP_WORKSPACE_MIRROR_DIR:target('Mi unidad'),SDP_WORKSPACE_AGE_RECIPIENT:RECIPIENT,PRIVATE_OTHER_SETTING:'PRIVATE_SENTINEL'},execute:async o=>{seen=o;return{};}});assert.deepEqual(seen,{apply:false,mirrorDir:target('Mi unidad'),recipient:RECIPIENT});
});
test('workspace recipe keeps frozen restoration assets but binds new target, public recipient and R7 source pins',async t=>{
  const cacheDir=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'sdp-workspace-recipe-')));t.after(()=>fs.rm(cacheDir,{recursive:true,force:true}));const oldMeta={publicSourceFiles:[],destination:'staging-outside-cloud',privateKeyIncluded:false,environmentIncluded:false},bytes=Buffer.from(JSON.stringify(oldMeta)),name='old.json';await fs.writeFile(path.join(cacheDir,name),bytes,{mode:0o600});
  const script={canonicalName:'reviewed-restoration.mjs',sha256:H,root:cacheDir,relativePath:'reviewed-restoration.mjs'},old={canonicalName:'MANIFEST_FONTS_RESTAURACIO.json',sha256:sha(bytes),root:cacheDir,relativePath:name,bytes:bytes.length};
  const basePrepare=async()=>({assets:[script,old],manifestSha256:old.sha256});const prepared=await preparaReceptaWorkspace({recipient:RECIPIENT,mirrorDir:target('Mi unidad'),cacheDir,basePrepare});assert.equal(prepared.assets[0],script);assert.equal(prepared.assets.length,2);
  const current=prepared.assets.find(a=>a.canonicalName==='MANIFEST_FONTS_RESTAURACIO.json'),meta=JSON.parse(await fs.readFile(path.join(cacheDir,current.relativePath)));assert.equal(meta.destination,'verified-institutional-workspace-folder');assert.equal(meta.mirrorConfigSha256,sha(target('Mi unidad')));assert.equal(meta.privateKeyIncluded,false);assert.equal(meta.environmentIncluded,false);assert.equal(meta.cloudUploadedVerified,false);assert.ok(meta.publicSourceFiles.some(f=>f.path==='tooling/node0/executa-mirall-workspace-node0.mjs'));assert.equal(JSON.stringify(meta).includes(HOME),false);
  const other=await preparaReceptaWorkspace({recipient:RECIPIENT,mirrorDir:target('My Drive'),cacheDir,basePrepare});assert.notEqual(other.manifestSha256,prepared.manifestSha256);
});
test('default workspace recipe composes with actual frozen R6 scripts using only a private temporary public cache',async t=>{
  const cacheDir=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'sdp-workspace-frozen-recipe-')));t.after(()=>fs.rm(cacheDir,{recursive:true,force:true}));
  const recipe=await preparaReceptaWorkspace({recipient:RECIPIENT,mirrorDir:target('Mi unidad'),cacheDir});
  const names=recipe.assets.map(a=>a.canonicalName);assert.ok(names.includes('restaura-node0-manual.mjs'));assert.ok(names.includes('rols-minims-node0.sql'));assert.equal(names.filter(n=>n==='MANIFEST_FONTS_RESTAURACIO.json').length,1);
  for(const asset of recipe.assets)assert.equal(sha(await fs.readFile(path.join(cacheDir,asset.relativePath))),asset.sha256);
  const metaAsset=recipe.assets.find(a=>a.canonicalName==='MANIFEST_FONTS_RESTAURACIO.json'),meta=JSON.parse(await fs.readFile(path.join(cacheDir,metaAsset.relativePath)));assert.equal(meta.destination,'verified-institutional-workspace-folder');assert.equal(meta.privateKeyIncluded,false);assert.equal(meta.environmentIncluded,false);assert.equal(meta.cloudUploadedVerified,false);
});
