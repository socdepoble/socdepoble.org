#!/usr/bin/env node
/** Explicit real first generation in staging OUTSIDE ALL Drive roots.
 * Public age recipient only in CLI; no private key or node0.env read here.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {preparaFonts,directoriPrivat,desaPublicCache} from './fonts-publiques-mirall-node0.mjs';
import {exportaMirall,creaRunnerSnapshot,validaRecipientAge} from './exporta-mirall-workspace-node0.mjs';
import {autenticitatMirallLocal} from './autenticitat-mirall-node0.mjs';
import {exigeixAbsenciaIdentitatLocal} from './custodia-age-node0.mjs';
export const TARGET=Object.freeze({workspaceRoot:'/Users/javi/socdepoble-node0-soberania',mirrorDir:'/Users/javi/socdepoble-node0/mirall-workspace-staging',cacheDir:'/Users/javi/socdepoble-node0/mirall-workspace-public-cache',stateDir:'/Users/javi/.config/socdepoble',socket:'/Users/javi/socdepoble-node0/dades/run/postgres17',pgDump:'/Users/javi/local/postgres17/Postgres.app/Contents/Versions/17/bin/pg_dump',psql:'/Users/javi/local/postgres17/Postgres.app/Contents/Versions/17/bin/psql',age:'/Users/javi/local/age-v1.3.2/age'});
const sha=b=>createHash('sha256').update(b).digest('hex');
const here=path.dirname(fileURLToPath(import.meta.url));
export async function preparaRecepta({recipient,cacheDir=TARGET.cacheDir}={}){
  validaRecipientAge(recipient);await directoriPrivat(cacheDir);const assets=[],sourceFiles=[];
  for(const name of['restaura-node0-manual.mjs','rols-minims-node0.sql']){const source=name==='restaura-node0-manual.mjs'?'restaura-node0-bundle.mjs':name;const bytes=await fs.readFile(path.join(here,'receptes-mirall',source));sourceFiles.push({name,source,sha256:sha(bytes)});const saved=await desaPublicCache(cacheDir,sha(bytes)+'-'+name,bytes);assets.push({root:cacheDir,relativePath:saved.name,canonicalName:name,sha256:saved.sha256,bytes:saved.bytes,public:true,publicProofSha256:sha('reviewed-server-restoration-recipe:'+saved.sha256),mimeType:name.endsWith('.sql')?'application/sql':'text/javascript'});}
  const deploymentBytes=await fs.readFile(path.join(here,'manifest-mirall-staging.json')),deployment=JSON.parse(deploymentBytes);
  if(deployment.schema!=='sdp.node0.mirror.deployment.v1'||!Array.isArray(deployment.files))throw Error('mirror_native_source_manifest_invalid');
  for(const file of deployment.files){if(typeof file.path!=='string'||file.path.startsWith('/')||file.path.split('/').includes('..')||!/^[a-f0-9]{64}$/.test(file.sha256)||sha(await fs.readFile(path.resolve(here,'../..',file.path)))!==file.sha256)throw Error('mirror_native_source_manifest_drift');}
  const manifest={schema:'sdp.node0.restoration-source-manifest.v1',institutionalAccount:'socdepoble@socdepoble.org',destination:'staging-outside-cloud',recipient,recipientSha256:sha(recipient),recipeFiles:sourceFiles,deploymentManifestSha256:sha(deploymentBytes),publicSourceFiles:deployment.files,casBundle:'Expanded R6 CAS installer must be supplied separately; these pinned public sources and offline scripts do not install the complete service',privateKeyIncluded:false,environmentIncluded:false,automaticExecution:false};
  const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n'),saved=await desaPublicCache(cacheDir,sha(bytes)+'-MANIFEST_FONTS_RESTAURACIO.json',bytes);assets.push({root:cacheDir,relativePath:saved.name,canonicalName:'MANIFEST_FONTS_RESTAURACIO.json',sha256:saved.sha256,bytes:saved.bytes,public:true,publicProofSha256:sha('reviewed-server-restoration-recipe:'+saved.sha256),mimeType:'application/json'});
  return{assets,manifestSha256:saved.sha256};
}
export function analitzaArgumentsMirall(argv){
  if(!Array.isArray(argv)||argv.some(v=>typeof v!=='string'))throw Error('mirror_native_arguments');
  const allowed=new Set(['--recipient','--expected-source-manifest-sha256','--apply']);let recipient,expected,apply=false;
  for(let i=0;i<argv.length;i++){if(!allowed.has(argv[i]))throw Error('mirror_native_arguments');if(argv[i]==='--apply'){if(apply)throw Error('mirror_native_arguments');apply=true;}else if(argv[i]==='--recipient'){if(recipient||!argv[i+1])throw Error('mirror_native_arguments');recipient=argv[++i];}else{if(expected||!argv[i+1])throw Error('mirror_native_arguments');expected=argv[++i];}}
  validaRecipientAge(recipient);
  if(expected!==undefined&&!/^[a-f0-9]{64}$/.test(expected)||apply&&expected===undefined)throw Error('mirror_native_recipe_review_required');
  return{recipient,expected,apply};
}
export async function main(argv=process.argv.slice(2)){
  const{recipient,expected,apply}=analitzaArgumentsMirall(argv);
  if(apply)exigeixAbsenciaIdentitatLocal({homeDir:'/Users/javi'});
  await directoriPrivat(TARGET.mirrorDir);const recipe=await preparaRecepta({recipient});
  if(apply&&expected!==recipe.manifestSha256)throw Error('mirror_native_recipe_review_required');
  const prepared=await preparaFonts({cacheDir:TARGET.cacheDir,workspaceRoot:TARGET.workspaceRoot,restoreAssets:recipe.assets,reviewedRecipeRoots:[TARGET.cacheDir]});
  if(apply)exigeixAbsenciaIdentitatLocal({homeDir:'/Users/javi'});
  const runner=creaRunnerSnapshot({...TARGET,database:'socdepoble_node0',user:'javi',timeoutMs:120000});
  const result=await exportaMirall({...TARGET,...prepared,recipient,runner,apply,authentication:autenticitatMirallLocal()});
  return{...result,sourceManifestSha256:recipe.manifestSha256,coverage:prepared.coverage,destination:'staging-outside-cloud',institutionalDriveConfigured:false,cloudUploadedVerified:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){main().then(v=>console.log(JSON.stringify(v))).catch(e=>{console.error(/^mirror_[a-z_]+$/.test(e.code??e.message)?e.code??e.message:'mirror_native_failed');process.exitCode=1;});}
