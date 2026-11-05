/** Clean-clone fallback probes. No output is written under public/ and no network is allowed. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {llegeixZipNodeZero} from '../tooling/node0/paquet-opendata-node0.mjs';
import {generaOpenData} from '../tooling/seo/genera-opendata.mjs';

const canonical='public/opendata/dades-obertes-la-torre-de-les-macanes-20261103.zip';
const digest='fb1611627c2cd2e23defe38f04d9dd58ed7cdc2a95766d5c5fc381f500a651be';
const snapshotBytes=fs.readFileSync(new URL('../public/opendata/snapshot-public.json',import.meta.url));
const snapshot=JSON.parse(snapshotBytes);
const expected=Buffer.from((await generaOpenData({snapshot,escriu:false,fetchImpl:()=>assert.fail('no network')})).paquet.zip);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function fixture(t,{withSnapshot=true}={}){
  const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-opendata-clone-'))),directory=path.join(root,'public/opendata');fs.mkdirSync(directory,{recursive:true});
  if(withSnapshot)fs.writeFileSync(path.join(directory,'snapshot-public.json'),snapshotBytes);
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return{root,directory,file:path.join(root,canonical)};
}
test('canonical snapshot reproduces exact pinned ZIP bytes in a clean clone without writing an artifact',async t=>{
  const f=fixture(t),before=fs.readdirSync(f.directory);let requests=0;const previous=globalThis.fetch;globalThis.fetch=()=>{requests++;throw Error('network forbidden');};
  try{const a=await llegeixZipNodeZero({root:f.root,sha256Esperat:digest}),b=await llegeixZipNodeZero({root:f.root,zip:canonical,sha256Esperat:digest});assert.ok(Buffer.isBuffer(a));assert.equal(hash(a),digest);assert.deepEqual(a,expected);assert.deepEqual(a,b);assert.equal(requests,0);assert.deepEqual(fs.readdirSync(f.directory),before);assert.equal(fs.existsSync(f.file),false);}
  finally{globalThis.fetch=previous;}
});
test('existing pinned ZIP works without any snapshot dependency',async t=>{
  const f=fixture(t,{withSnapshot:false});fs.writeFileSync(f.file,expected);
  assert.deepEqual(await llegeixZipNodeZero({root:f.root,sha256Esperat:digest}),expected);assert.deepEqual(fs.readdirSync(f.directory),[path.basename(canonical)]);
});
test('native minimal bundle reads its existing ZIP without any publication generator module',async t=>{
  const f=fixture(t,{withSnapshot:false}),modules=path.join(f.root,'tooling/node0');fs.mkdirSync(modules,{recursive:true});fs.writeFileSync(f.file,expected);
  for(const name of['paquet-opendata-node0.mjs','fitxers-segurs.mjs'])fs.copyFileSync(new URL('../tooling/node0/'+name,import.meta.url),path.join(modules,name));
  assert.equal(fs.existsSync(path.join(f.root,'tooling/seo/genera-opendata.mjs')),false);
  const isolated=await import(pathToFileURL(path.join(modules,'paquet-opendata-node0.mjs')).href);
  assert.deepEqual(await isolated.llegeixZipNodeZero({root:f.root,sha256Esperat:digest}),expected);
});
test('existing corrupt ZIP never falls back to an otherwise valid snapshot',async t=>{
  const f=fixture(t),bad=Buffer.from('existing corrupt artifact');fs.writeFileSync(f.file,bad);
  await assert.rejects(llegeixZipNodeZero({root:f.root,sha256Esperat:digest}),/node0_zip_hash_mismatch/);assert.deepEqual(fs.readFileSync(f.file),bad);
});
test('missing custom path or noncanonical expected SHA cannot trigger regeneration',async t=>{
  const f=fixture(t);fs.writeFileSync(path.join(f.directory,'snapshot-public.json'),'not valid JSON');
  for(const options of[{zip:'custom.zip',sha256Esperat:digest},{zip:canonical,sha256Esperat:'0'.repeat(64)}])await assert.rejects(llegeixZipNodeZero({root:f.root,...options}),error=>error.code==='ENOENT');
  assert.equal(fs.existsSync(f.file),false);
});
test('existing custom ZIP remains explicitly pinned and is not replaced',async t=>{
  const f=fixture(t,{withSnapshot:false}),custom=path.join(f.root,'custom.zip'),bytes=Buffer.from('caller-selected local fixture');fs.writeFileSync(custom,bytes);
  assert.deepEqual(await llegeixZipNodeZero({root:f.root,zip:custom,sha256Esperat:hash(bytes)}),bytes);await assert.rejects(llegeixZipNodeZero({root:f.root,zip:custom,sha256Esperat:digest}),/node0_zip_hash_mismatch/);
});
test('a directory or broken symlink at the canonical path is not a missing artifact',async t=>{
  for(const kind of['directory','symlink']){const f=fixture(t);if(kind==='directory')fs.mkdirSync(f.file);else fs.symlinkSync(path.join(f.root,'absent-target'),f.file);await assert.rejects(llegeixZipNodeZero({root:f.root,sha256Esperat:digest}),/node0_zip_nonregular/);}
});
test('invalid snapshot, invalid expected hash and absent snapshot fail without network or writes',async t=>{
  const f=fixture(t);fs.writeFileSync(path.join(f.directory,'snapshot-public.json'),'{');await assert.rejects(llegeixZipNodeZero({root:f.root,sha256Esperat:digest}),/node0_snapshot_invalid/);
  await assert.rejects(llegeixZipNodeZero({root:f.root,sha256Esperat:'untrusted'}),/node0_zip_expected_hash_required/);
  const absent=fixture(t,{withSnapshot:false});await assert.rejects(llegeixZipNodeZero({root:absent.root,sha256Esperat:digest}),error=>error.code==='ENOENT');assert.deepEqual(fs.readdirSync(absent.directory),[]);
});
