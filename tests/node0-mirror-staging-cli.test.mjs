import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {analitzaArgumentsMirall,preparaRecepta,main,TARGET} from '../tooling/node0/executa-mirall-staging-node0.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
function syntheticRecipient(){const a='qpzry9x8gf2tvdw0s3jn54khce6mua7l',data=Array(52).fill(0);let c=1;for(const v of[3,3,3,0,1,7,5,...data,0,0,0,0,0,0]){const t=c>>>25;c=((c&0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((t>>>i)&1)c^=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3][i];}c^=1;return'age1'+data.map(v=>a[v]).join('')+Array.from({length:6},(_,i)=>a[(c>>>(5*(5-i)))&31]).join('');}
const RECIPIENT=syntheticRecipient(),H='a'.repeat(64),sha=b=>createHash('sha256').update(b).digest('hex');
test('canonical CLI is dry-run by default and rejects unreviewed apply before native filesystem or process effects',async()=>{
  assert.deepEqual(analitzaArgumentsMirall(['--recipient',RECIPIENT]),{recipient:RECIPIENT,expected:undefined,apply:false});
  assert.equal(analitzaArgumentsMirall(['--recipient',RECIPIENT,'--expected-source-manifest-sha256',H,'--apply']).apply,true);
  for(const args of[['--recipient',RECIPIENT,'--apply'],['--recipient',RECIPIENT,'--expected-source-manifest-sha256','invalid'],['--recipient',RECIPIENT,'--apply','--apply'],['--recipient',RECIPIENT,'--destination','/tmp/foreign']])await assert.rejects(main(args),/mirror_native_/);
  assert.equal(TARGET.mirrorDir,'/Users/javi/socdepoble-node0/mirall-workspace-staging');
});
test('canonical source manifest pins all current files and contains no hidden LAB dependency or self recursion',async()=>{
  const manifest=JSON.parse(await fs.readFile(path.join(ROOT,'tooling/node0/manifest-mirall-staging.json')));assert.equal(manifest.schema,'sdp.node0.mirror.deployment.v1');assert.equal(manifest.files.length,34);
  for(const f of manifest.files){assert.equal(f.path.includes('.r6-lab'),false);assert.equal(f.path.includes('manifest-mirall-staging.json'),false);assert.equal(sha(await fs.readFile(path.join(ROOT,f.path))),f.sha256);}
});
test('canonical recipe preparation reads canonical assets, copies no secrets and never executes restoration code',async t=>{
  const base=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'sdp-mirror-recipe-')));t.after(()=>fs.rm(base,{recursive:true,force:true}));
  const recipe=await preparaRecepta({recipient:RECIPIENT,cacheDir:base});assert.equal(recipe.assets.length,3);
  const asset=recipe.assets.find(a=>a.canonicalName==='MANIFEST_FONTS_RESTAURACIO.json'),meta=JSON.parse(await fs.readFile(path.join(base,asset.relativePath)));
  assert.equal(meta.privateKeyIncluded,false);assert.equal(meta.environmentIncluded,false);assert.equal(meta.automaticExecution,false);assert.ok(meta.publicSourceFiles.every(f=>!f.path.includes('.r6-lab')));assert.equal(asset.sha256,recipe.manifestSha256);
  for(const a of recipe.assets)assert.equal(sha(await fs.readFile(path.join(base,a.relativePath))),a.sha256);
});
