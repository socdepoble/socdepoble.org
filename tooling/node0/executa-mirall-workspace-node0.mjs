#!/usr/bin/env node
/** Institutional Drive executor. R7 prototype; frozen R6 sources stay intact.
 * No folder discovery/creation, personal Drive, staging fallback, login or API
 * credentials. Only an existing, exact, resolver-verified account target.
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {COMPTE_WORKSPACE,NOM_MIRALL,UNITATS_WORKSPACE,resolMirallInstitucional} from '../../tooling/node0/resolutor-mirall-institucional.mjs';
import {TARGET,preparaRecepta} from '../../tooling/node0/executa-mirall-staging-node0.mjs';
import {preparaFonts,desaPublicCache} from '../../tooling/node0/fonts-publiques-mirall-node0.mjs';
import {exportaMirall,creaRunnerSnapshot,validaRecipientAge} from '../../tooling/node0/exporta-mirall-workspace-node0.mjs';
import {autenticitatMirallLocal} from './autenticitat-mirall-node0.mjs';
import {exigeixAbsenciaIdentitatLocal} from './custodia-age-node0.mjs';

const H=/^[a-f0-9]{64}$/,sha=b=>createHash('sha256').update(b).digest('hex');
const fail=code=>{throw Object.assign(Error(code),{code});};
function exactTarget(homeDir,mirrorDir){
  if(typeof homeDir!=='string'||!path.isAbsolute(homeDir)||path.resolve(homeDir)!==homeDir||typeof mirrorDir!=='string'||!path.isAbsolute(mirrorDir)||path.resolve(mirrorDir)!==mirrorDir||/[\p{Cc}\p{Cf}\\]/u.test(homeDir+mirrorDir))return false;
  return UNITATS_WORKSPACE.some(unit=>mirrorDir===path.join(homeDir,'Library','CloudStorage',COMPTE_WORKSPACE,unit,NOM_MIRALL));
}
/** Replace the staging-only metadata asset; reuse all reviewed R6 scripts.
 * The review hash binds account, exact target hash, recipient and source bytes.
 * Only public recipe bytes are read; no private identity/environment input.
 */
export async function preparaReceptaWorkspace({recipient,mirrorDir,cacheDir=TARGET.cacheDir,basePrepare=preparaRecepta}={}){
  validaRecipientAge(recipient);
  const base=await basePrepare({recipient,cacheDir}),old=base.assets.find(a=>a.canonicalName==='MANIFEST_FONTS_RESTAURACIO.json');
  if(!old||old.sha256!==base.manifestSha256)fail('mirror_workspace_recipe_invalid');
  const handle=await fs.open(path.join(old.root,old.relativePath),constants.O_RDONLY|constants.O_NOFOLLOW);let bytes;
  try{const s=await handle.stat();if(!s.isFile()||s.nlink!==1||s.size>1024*1024)fail('mirror_workspace_recipe_invalid');bytes=await handle.readFile();}finally{await handle.close();}
  if(sha(bytes)!==old.sha256)fail('mirror_workspace_recipe_drift');const previous=JSON.parse(bytes);
  const additional=[['tooling/node0/executa-mirall-workspace-node0.mjs',fileURLToPath(import.meta.url)],['tooling/node0/resolutor-mirall-institucional.mjs',fileURLToPath(new URL('../../tooling/node0/resolutor-mirall-institucional.mjs',import.meta.url))],['tooling/node0/sonda-directori-institucional.py',fileURLToPath(new URL('../../tooling/node0/sonda-directori-institucional.py',import.meta.url))]];
  const sources=new Map((previous.publicSourceFiles??[]).map(f=>[f.path,f]));for(const[name,file]of additional)sources.set(name,{path:name,sha256:sha(await fs.readFile(file))});
  const metadata={...previous,schema:'sdp.node0.restoration-source-manifest.v2',institutionalAccount:'socdepoble@socdepoble.org',destination:'verified-institutional-workspace-folder',mirrorConfigSha256:sha(mirrorDir),baseRestorationManifestSha256:base.manifestSha256,publicSourceFiles:[...sources.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0),cloudUploadedVerified:false};
  const body=Buffer.from(JSON.stringify(metadata,null,2)+'\n'),saved=await desaPublicCache(cacheDir,sha(body)+'-MANIFEST_FONTS_RESTAURACIO.json',body);
  const replacement={...old,root:cacheDir,relativePath:saved.name,sha256:saved.sha256,bytes:saved.bytes,publicProofSha256:sha('reviewed-workspace-restoration-recipe:'+saved.sha256)};
  return{assets:[...base.assets.filter(a=>a!==old),replacement],manifestSha256:saved.sha256};
}

/** Dependencies are server/operator capabilities, never request-body claims. */
export function creaExecutorMirallWorkspace({homeDir=os.homedir(),expectedUid=process.getuid?.(),authentication=autenticitatMirallLocal(homeDir),assertCustody=exigeixAbsenciaIdentitatLocal,resolveTarget=resolMirallInstitucional,prepareRecipe=preparaReceptaWorkspace,prepareSources=preparaFonts,exportMirror=exportaMirall,createSnapshot=creaRunnerSnapshot}={}){
  return async input=>{
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['mirrorDir','recipient','apply','expectedSourceManifestSha256'].includes(k)))fail('mirror_workspace_arguments');
    const{mirrorDir,recipient,apply=false,expectedSourceManifestSha256:expected}=input;
    if(!exactTarget(homeDir,mirrorDir))fail('mirror_workspace_target_rejected');validaRecipientAge(recipient);
    if(typeof apply!=='boolean'||expected!==undefined&&!H.test(expected)||apply&&expected===undefined)fail('mirror_workspace_recipe_review_required');
    if(apply)assertCustody({homeDir});
    const resolve=async()=>{let value;try{value=await resolveTarget({homeDir,mirrorDir,recipient,expectedUid});}catch{fail('mirror_workspace_unavailable');}if(value?.workspaceMirrorConfigured!==true||value.mirrorDir!==mirrorDir)fail('mirror_workspace_unavailable');};
    await resolve();
    const recipe=await prepareRecipe({recipient,mirrorDir,cacheDir:TARGET.cacheDir});
    if(!H.test(recipe?.manifestSha256??'')||apply&&recipe.manifestSha256!==expected)fail('mirror_workspace_recipe_review_required');
    const prepared=await prepareSources({cacheDir:TARGET.cacheDir,workspaceRoot:TARGET.workspaceRoot,restoreAssets:recipe.assets,reviewedRecipeRoots:[TARGET.cacheDir]});
    // Public HTTP/cache preparation can take time; pin the same target again
    // immediately before handing the write capability to the frozen exporter.
    await resolve();
    if(apply)assertCustody({homeDir});
    const runner=apply?createSnapshot({...TARGET,database:'socdepoble_node0',user:'javi',timeoutMs:120000}):undefined;
    const result=await exportMirror({...TARGET,...prepared,mirrorDir,recipient,apply,runner,authentication});
    return{...result,sourceManifestSha256:recipe.manifestSha256,coverage:prepared.coverage,destination:'verified-institutional-workspace-folder',workspaceMirrorConfigured:true,localIntegrityVerified:result.integrityOk===true,cloudUploadedVerified:false};
  };
}
export function analitzaArgumentsWorkspace(argv){
  const allowed=new Set(['--recipient','--mirror-dir','--expected-source-manifest-sha256','--apply']),out={apply:false};
  if(!Array.isArray(argv)||argv.some(v=>typeof v!=='string'))fail('mirror_workspace_arguments');
  for(let i=0;i<argv.length;i++){const flag=argv[i];if(!allowed.has(flag))fail('mirror_workspace_arguments');if(flag==='--apply'){if(out.apply)fail('mirror_workspace_arguments');out.apply=true;continue;}
    const key=flag==='--recipient'?'recipient':flag==='--mirror-dir'?'mirrorDir':'expectedSourceManifestSha256';if(out[key]!==undefined||!argv[i+1]||argv[i+1].startsWith('--'))fail('mirror_workspace_arguments');out[key]=argv[++i];}
  return out;
}
export async function main(argv=process.argv.slice(2),{publicConfig,execute}={}){
  const options=analitzaArgumentsWorkspace(argv),config=publicConfig??{SDP_WORKSPACE_MIRROR_DIR:process.env.SDP_WORKSPACE_MIRROR_DIR,SDP_WORKSPACE_AGE_RECIPIENT:process.env.SDP_WORKSPACE_AGE_RECIPIENT};
  return(execute??creaExecutorMirallWorkspace())({...options,mirrorDir:options.mirrorDir??config.SDP_WORKSPACE_MIRROR_DIR,recipient:options.recipient??config.SDP_WORKSPACE_AGE_RECIPIENT});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){main().then(v=>console.log(JSON.stringify(v))).catch(e=>{console.error(/^mirror_[a-z_]+$/.test(e.code??e.message)?e.code??e.message:'mirror_workspace_failed');process.exitCode=1;});}
