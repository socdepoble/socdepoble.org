/** First real mirror selection. Public fixed Node0 API + fixed .org assets.
 * No credentials, environment files, private profile/note/chat projections.
 */
import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=code=>{throw Object.assign(Error(code),{code});};
export const SHA_ZIP='fb1611627c2cd2e23defe38f04d9dd58ed7cdc2a95766d5c5fc381f500a651be';
export const NOM_ZIP='dades-obertes-la-torre-de-les-macanes-20261103.zip';
const ENDPOINT='http://127.0.0.1:4340/api/v1/node0/mur';
export function urlArticlePublic(value,section){try{const u=new URL(value);return typeof value==='string'&&u.href===value&&u.origin==='https://socdepoble.org'&&!u.search&&!u.hash&&!u.username&&!u.password&&!value.includes('%')&&new RegExp('^/'+section+'/[a-zA-Z0-9][a-zA-Z0-9/_-]{0,255}$').test(u.pathname);}catch{return false;}}
function nullableIso(value){if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))return null;const d=new Date(value);return /^\d{4}-\d{2}-\d{2}T/.test(value)?d.toISOString():null;}
function day(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value?value:null;}
export function seleccionaPublicacions(mur,{sourceSha256,retrievedAt}={}){
  if(!mur||!Array.isArray(mur.feedPosts)||!Array.isArray(mur.events)||mur.feedPosts.length+mur.events.length>1000||!/^[a-f0-9]{64}$/.test(sourceSha256))fail('mirror_public_source_invalid');
  const articles=[],images=[],omissions=[];let mastodon=0;
  for(const[kind,section]of[['feedPosts','mur'],['events','events']])for(const p of mur[kind]){
    if(!p||typeof p.id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:-]{0,127}$/.test(p.id)){omissions.push({kind,reason:'invalid-public-id'});continue;}
    const federated=p.source==='mastodon'||p.federacio?.origen==='mastodon'||p.id.startsWith('mastodon:');
    if(p.visibility!=='public'){omissions.push({kind,id:p.id,reason:'not-explicitly-public'});continue;}
    const candidate=p.canonicalUrl??p.url,canonicalUrl=urlArticlePublic(candidate,section)?candidate:null;
    let originalSourceUrl;if(federated){const source=p.uri??p.url;try{const u=new URL(source);if(u.href!==source||u.origin!=='https://mastodont.cat'||u.search||u.hash||!/^\/(?:@depoble\/|users\/depoble\/statuses\/)\d{1,30}$/.test(u.pathname))throw Error();originalSourceUrl=source;mastodon++;}catch{omissions.push({kind,id:p.id,reason:'unverified-federated-source'});continue;}}
    const publicProofSha256=sha(JSON.stringify({endpoint:ENDPOINT,sourceSha256,kind,id:p.id,retrievedAt})),eventDate=section==='events'?day(p.date??p.inici?.slice(0,10)):null;
    const body=typeof p.body==='string'?p.body:typeof p.content==='string'?p.content:'';
    articles.push({id:p.id,section,visibility:'public',publicProofSha256,title:typeof p.title==='string'?p.title:'',summary:typeof p.summary==='string'?p.summary:'',bodyMarkdown:(eventDate?'Data de l’esdeveniment: '+eventDate+'\n\n':'')+body,canonicalUrl,...(originalSourceUrl?{originalSourceUrl}:{}),publishedAt:nullableIso(p.created_at??p.published_at),updatedAt:nullableIso(p.updated_at),...(eventDate?{eventDate}:{}),tags:Array.isArray(p.tags)?p.tags.filter(t=>typeof t==='string'):[],authorDisplayName:typeof p.author_name==='string'?p.author_name:''});
    if(typeof p.image_url==='string')images.push({url:p.image_url,publicProofSha256,license:typeof p.provenance?.licence==='string'?p.provenance.licence:'Public source; licence not supplied'});
  }
  return{articles,images,coverage:{observedFeedPosts:mur.feedPosts.length,observedEvents:mur.events.length,selectedArticles:articles.length,mastodonPublicReplicasArchived:mastodon,canonicalUrlsPending:articles.filter(a=>a.canonicalUrl===null).length,omissions,marketExcluded:true,privateCollectionsRead:false,completeWorkspaceInventoryVerified:false,originalExternalArticlesArchived:false}};
}
export async function lligGetPublic(url,{fetchImpl=fetch,maxBytes=4*1024*1024,accept='application/json',signal,deadlineMs=10000}={}){
  if(signal?.aborted)fail('mirror_public_get_failed');const controller=new AbortController();let reader,timer;
  const cancel=target=>{try{if(typeof target?.cancel==='function')Promise.resolve(target.cancel()).catch(()=>{});}catch{/* cleanup must not replace the request error */}};
  const cancelReader=()=>cancel(reader);controller.signal.addEventListener('abort',cancelReader,{once:true});
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Object.assign(Error('mirror_public_get_timeout'),{code:'mirror_public_get_timeout'}));},deadlineMs);});
  const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
  const work=(async()=>{
  let response;try{response=await fetchImpl(url,{method:'GET',redirect:'error',headers:{Accept:accept},signal:controller.signal});}catch{fail('mirror_public_get_failed');}
  // Injected transports can resolve after the caller's race/finally ended.
  // Dispose of that response without reading it or starting another reader.
  if(controller.signal.aborted){if(typeof response?.body?.cancel==='function')cancel(response.body);else if(typeof response?.body?.getReader==='function')cancel(response.body.getReader());fail('mirror_public_get_failed');}
  if(response.status!==200||response.redirected)fail('mirror_public_get_status');
  const mime=response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  const length=response.headers.get('content-length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>maxBytes))fail('mirror_public_get_limit');
  if(!response.body||typeof response.body.getReader!=='function')fail('mirror_public_get_body');reader=response.body.getReader();const chunks=[];let total=0;
  try{while(true){if(controller.signal.aborted)fail('mirror_public_get_failed');const r=await reader.read();if(controller.signal.aborted)fail('mirror_public_get_failed');if(r.done)break;total+=r.value.byteLength;if(total>maxBytes)fail('mirror_public_get_limit');chunks.push(Buffer.from(r.value));}}finally{cancelReader();}
  return{bytes:Buffer.concat(chunks),mime};
  })();try{return await Promise.race([work,timeout]);}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);controller.abort();controller.signal.removeEventListener('abort',cancelReader);cancelReader();}
}
export function assetPublic(value){try{const u=new URL(value);if(u.href!==value||u.origin!=='https://socdepoble.org'||u.username||u.password||u.search||u.hash||!u.pathname.startsWith('/assets/')||/%(?:2f|5c|00)/i.test(u.pathname))return null;const name=decodeURIComponent(u.pathname.split('/').at(-1)).normalize('NFC');if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,180}\.(?:jpe?g|png|webp|pdf|mp3|ogg|wav|m4a)$/i.test(name))return null;return{name,url:value};}catch{return null;}}
export function comprovaMagic(bytes,mime,name){
  const b=Buffer.from(bytes),ext=name.split('.').at(-1).toLowerCase();
  return mime==='image/jpeg'&&['jpg','jpeg'].includes(ext)&&b.length>3&&b[0]===255&&b[1]===216&&b[2]===255||mime==='image/png'&&ext==='png'&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||mime==='image/webp'&&ext==='webp'&&b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'||mime==='application/pdf'&&ext==='pdf'&&b.subarray(0,5).toString()==='%PDF-'||mime==='audio/mpeg'&&ext==='mp3'&&(b.subarray(0,3).toString()==='ID3'||b[0]===255&&(b[1]&224)===224)||mime==='audio/ogg'&&ext==='ogg'&&b.subarray(0,4).toString()==='OggS'||mime==='audio/wav'&&ext==='wav'&&b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WAVE'||mime==='audio/mp4'&&ext==='m4a'&&b.subarray(4,8).toString()==='ftyp';
}
export function validaArrelPublica(value){
  if(typeof value!=='string'||!path.isAbsolute(value)||path.normalize(value)!==value||/[\\\x00-\x1f\x7f]/.test(value))fail('mirror_public_root_invalid');
  for(const part of value.split('/').slice(1))if(['dades','.config','.cloudflared','.ssh','library','logs','log','.env'].includes(part.toLowerCase())||part.toLowerCase().startsWith('.env'))fail('mirror_public_root_forbidden');
  return value;
}
async function arrelPublicaRevisada(value){
  validaArrelPublica(value);let current='/';
  for(const part of value.split('/').slice(1)){current=path.join(current,part);const s=await fs.lstat(current);if(!s.isDirectory()||s.isSymbolicLink())fail('mirror_public_root_unsafe');}
  return value;
}
export async function directoriPrivat(value){
  validaArrelPublica(value);if(!path.isAbsolute(value)||path.normalize(value)!==value)fail('mirror_native_directory_invalid');let current='/';
  for(const part of value.split('/').slice(1)){current=path.join(current,part);let info;try{info=await fs.lstat(current);}catch(e){if(e.code!=='ENOENT'||current!==value)fail('mirror_native_parent_missing');await fs.mkdir(current,{mode:0o700});info=await fs.lstat(current);}if(!info.isDirectory()||info.isSymbolicLink())fail('mirror_native_directory_unsafe');}
  const info=await fs.lstat(value);if(info.uid!==process.getuid()||(info.mode&0o777)!==0o700)fail('mirror_native_directory_permissions');return value;
}
export async function desaPublicCache(root,name,bytes){
  if(!/^[a-zA-Z0-9][A-Za-z0-9._-]{0,230}$/.test(name))fail('mirror_native_cache_name');const file=path.join(root,name);
  let handle;try{handle=await fs.open(file,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);await handle.writeFile(bytes);await handle.sync();}catch(e){if(e.code!=='EEXIST')fail('mirror_native_cache_write');const h=await fs.open(file,constants.O_RDONLY|constants.O_NOFOLLOW);try{const s=await h.stat();if(!s.isFile()||s.nlink!==1||s.uid!==process.getuid()||(s.mode&0o777)!==0o600||s.size!==bytes.length||sha(await h.readFile())!==sha(bytes))fail('mirror_native_cache_drift');}finally{await h.close();}}finally{await handle?.close();}
  return{name,sha256:sha(bytes),bytes:bytes.length};
}
export async function preparaFonts({fetchImpl=fetch,cacheDir,workspaceRoot,restoreAssets=[],reviewedRecipeRoots=[],reviewedOpenDataPin={name:NOM_ZIP,sha256:SHA_ZIP},now=Date.now}={}){
  if(!reviewedOpenDataPin||Object.keys(reviewedOpenDataPin).sort().join(',')!=='name,sha256'||!/^[-A-Za-z0-9_][A-Za-z0-9._-]{0,180}\.zip$/.test(reviewedOpenDataPin.name)||!/^[a-f0-9]{64}$/.test(reviewedOpenDataPin.sha256))fail('mirror_opendata_pin_invalid');
  const release=reviewedOpenDataPin;
  validaArrelPublica(cacheDir);const openDataRoot=validaArrelPublica(path.join(workspaceRoot,'public/opendata'));
  if(!Array.isArray(reviewedRecipeRoots)||reviewedRecipeRoots.length>16)fail('mirror_recipe_roots_invalid');
  for(const root of reviewedRecipeRoots)await arrelPublicaRevisada(root);
  if(!restoreAssets.every(asset=>reviewedRecipeRoots.includes(asset.root)))fail('mirror_recipe_root_not_reviewed');
  await arrelPublicaRevisada(openDataRoot);
  await directoriPrivat(cacheDir);
  const fetched=await lligGetPublic(ENDPOINT,{fetchImpl});if(fetched.mime!=='application/json')fail('mirror_public_source_mime');
  let data;try{data=JSON.parse(fetched.bytes);}catch{fail('mirror_public_source_json');}
  const retrievedAt=new Date(now()).toISOString(),selected=seleccionaPublicacions(data,{sourceSha256:sha(fetched.bytes),retrievedAt}),media=[],assetOmissions=[];let total=0;
  if(selected.images.length>20)fail('mirror_public_assets_budget');
  const names=new Map();for(const item of selected.images){const asset=assetPublic(item.url);if(!asset){assetOmissions.push({reason:'asset-url-refused'});continue;}
    try{const response=await lligGetPublic(asset.url,{fetchImpl,maxBytes:8*1024*1024,accept:'image/jpeg,image/png,image/webp,application/pdf,audio/*'});if(!comprovaMagic(response.bytes,response.mime,asset.name))fail('mirror_public_asset_magic');total+=response.bytes.length;if(total>32*1024*1024)fail('mirror_public_assets_budget');
      const hash=sha(response.bytes);if(names.has(asset.name)){if(names.get(asset.name)!==hash)assetOmissions.push({name:asset.name,reason:'asset-name-conflict'});continue;}names.set(asset.name,hash);
      const saved=await desaPublicCache(cacheDir,hash+'-'+asset.name,response.bytes);media.push({root:cacheDir,relativePath:saved.name,canonicalName:asset.name,sha256:hash,bytes:saved.bytes,public:true,publicProofSha256:item.publicProofSha256,mimeType:response.mime,license:item.license});
    }catch(e){assetOmissions.push({name:asset.name,reason:/^mirror_[a-z_]+$/.test(e.code??'')?e.code:'asset-unavailable'});}
  }
  const zipPath=path.join(openDataRoot,release.name),handle=await fs.open(zipPath,constants.O_RDONLY|constants.O_NOFOLLOW);let zip;
  try{const s=await handle.stat();if(!s.isFile()||s.nlink!==1||s.size>32*1024*1024)fail('mirror_native_zip_unsafe');zip=await handle.readFile();}finally{await handle.close();}
  if(sha(zip)!==release.sha256)fail('mirror_native_zip_pin');
  const proof=sha(JSON.stringify({source:'canonical-public-OpenData-1.2.0',sha256:release.sha256}));
  const opendata={root:openDataRoot,relativePath:release.name,canonicalName:'la-torre-de-les-macanes-1.2.0.zip',sha256:release.sha256,bytes:zip.length,public:true,publicProofSha256:proof,mimeType:'application/zip',license:'See canonical llicencies.md in package',version:'1.2.0'};
  return{reviewedSourceRoots:[{kind:'media',root:cacheDir},{kind:'opendata',root:openDataRoot},...reviewedRecipeRoots.map(root=>({kind:'restore',root}))],providers:{listPublicArticles:async()=>selected.articles,listPublicMedia:async()=>media,listPublicOpenData:async()=>[opendata],listRestoreAssets:async()=>restoreAssets},coverage:{...selected.coverage,selectedMedia:media.length,assetOmissions,sourceSha256:sha(fetched.bytes),retrievedAt},restoreAssetsAllowlist:restoreAssets.map(a=>({name:a.canonicalName,sha256:a.sha256}))};
}
