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
  const manifest=JSON.parse(await fs.readFile(path.join(ROOT,'tooling/node0/manifest-mirall-staging.json')));assert.equal(manifest.schema,'sdp.node0.mirror.deployment.v1');assert.equal(manifest.files.length,38);
  // v1.2.23 · costura pin Node 0 (ordre del Mestre 261123) · el kit R32.44 afig a CAPACITATS de contracte.js dos contractes
  // opcionals (edicioPublicacionsPropies i revisionsPagines) i ja re-fixa tooling/node0/manifest-mirall-staging.json;
  // es revisa el canvi (només declaracions, cap camí ni secret nou) i el pin d'esta prova passa de 536cc6… a 1a8893….
  // v1.2.23 · pujada de versió (ordre del Mestre 261123) · VERSIO_CLIENT_NATIU 27 → 28 i el seu comentari: el pin passa a ee3bcf….
  // R78: reviewed C6/C10 optional backup/delete declarations; all38 actual source-byte checks stay strict.
  // v1.2.24 · pujada de versió (Pla 261124_1323, F5A) · VERSIO_CLIENT_NATIU 28 → 29 i el seu comentari, sense cap camí ni secret nou: el pin passa a a91a52….
  // v1.2.24 · R32.86 (IDEA-348) · systemPages.js afig la pàgina del joc «Cada cosa al seu lloc» (cap camí ni secret nou): el seu pin del manifest passa d'ad32c6… a 008711….
  for(const [source,pin] of Object.entries({
    'src/data/contracte.js':'a91a5286f58650e1dee8fea25687f825858995f32c80beef3822cfbe400f4567',
    'src/data/contracteAvisos.js':'9d8ee9cc8af5f3cb811ecfa345828ee165375972f3a70f83a8617371301cf5b2',
    'src/data/contracteConnexions.js':'547b1f339dbedc867ba1d0989f3d0b6407b7bd1901d72d017c0c06a5eb82cc17',
    'src/data/contracteOrganitzacions.js':'c6ac84378a30ab0bb9a8771839f2fb5c305764e6e9bd743835653524000b8c3e',
    'src/data/exportaMunicipiOpenData.js':'f81ced9bb51532e27dfb33b67bfacd64fd96165c020b21906fdb604cf9984c9e',
    'src/data/federacio/urlRemota.js':'c7a13e87cc88d0f0181d32419ae4e38276f7a8cf76bcf17ce7b7736a5466c167'
  }))assert.deepEqual(manifest.files.filter(f=>f.path===source),[{path:source,sha256:pin}]);
  for(const f of manifest.files){assert.equal(f.path.includes('.r6-lab'),false);assert.equal(f.path.includes('manifest-mirall-staging.json'),false);assert.equal(sha(await fs.readFile(path.join(ROOT,f.path))),f.sha256);}
});
test('canonical recipe preparation reads canonical assets, copies no secrets and never executes restoration code',async t=>{
  const base=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'sdp-mirror-recipe-')));t.after(()=>fs.rm(base,{recursive:true,force:true}));
  const recipe=await preparaRecepta({recipient:RECIPIENT,cacheDir:base});assert.equal(recipe.assets.length,3);
  const asset=recipe.assets.find(a=>a.canonicalName==='MANIFEST_FONTS_RESTAURACIO.json'),meta=JSON.parse(await fs.readFile(path.join(base,asset.relativePath)));
  assert.equal(meta.privateKeyIncluded,false);assert.equal(meta.environmentIncluded,false);assert.equal(meta.automaticExecution,false);assert.ok(meta.publicSourceFiles.every(f=>!f.path.includes('.r6-lab')));assert.equal(asset.sha256,recipe.manifestSha256);
  for(const a of recipe.assets)assert.equal(sha(await fs.readFile(path.join(base,a.relativePath))),a.sha256);
});
