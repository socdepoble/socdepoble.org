#!/usr/bin/env node
/** AH11 LAB. Explicit public DTOs and FD-safe allowlisted files only.
 * The only private data input is pg_dump stdout, piped straight to age stdin.
 * No PGDATA copy, credential/key/env file input, Drive API, upload or failover.
 * A verified local generation is NOT evidence of completed cloud replication.
 */
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {llegeixPaquetOpenData} from '../../src/data/importaMunicipiOpenData.js';

export const CARPETES_MIRALL=Object.freeze(['01_Publicacions_i_Croniques','02_Multimedia_i_Patrimoni','03_Paquets_OpenData_Municipals','04_Snapshots_PostgreSQL','05_Recepta_Restauracio_Node0']);
const F=CARPETES_MIRALL,H=/^[a-f0-9]{64}$/,ID=/^[a-zA-Z0-9][a-zA-Z0-9_:-]{0,127}$/;
const LIMIT=128*1024*1024,WORKER=fileURLToPath(new URL('./fitxers-mirall.py',import.meta.url));
const ENV=Object.freeze({PATH:'/usr/bin:/bin:/usr/sbin:/sbin',LANG:'C',LC_ALL:'C',PGPASSFILE:'/dev/null',PGSERVICEFILE:'/dev/null'});
const error=code=>Object.assign(Error(code),{code});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
function exact(value,keys){if(!plain(value)||Object.keys(value).some(k=>!keys.includes(k))||Object.values(Object.getOwnPropertyDescriptors(value)).some(d=>!Object.hasOwn(d,'value')))throw error('mirror_input_invalid');}
function text(value,max){if(typeof value!=='string'||value.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)||value.isWellFormed?.()===false)throw error('mirror_text_invalid');return value.normalize('NFC');}
function iso(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw error('mirror_time_invalid');return value;}
function day(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw error('mirror_event_day_invalid');return value;}
function directory(value){if(typeof value!=='string'||!path.isAbsolute(value)||path.normalize(value)!==value||/[\x00-\x1f\x7f]/.test(value))throw error('mirror_root_invalid');return value;}
function relative(value){
  if(typeof value!=='string'||!value||value.length>1024||value!==value.normalize('NFC')||value.startsWith('/')||/[\\\x00-\x1f\x7f\u2028\u2029]/.test(value))throw error('mirror_path_invalid');
  for(const p of value.split('/'))if(!p||['.','..','.git','.ssh','.aws','.config','.cloudflared','.gnupg','dades','library','logs','log','pgdata','postgres17','node_modules'].includes(p.toLowerCase())||p.toLowerCase().startsWith('.env')||p.toLowerCase().endsWith('.env')||/[<>:"|?*]/.test(p)||/[ .]$/.test(p)||/(?:^|[._-])(?:credentials?|secrets?|tokens?|privatekeys?)(?:[._-]|$)/i.test(p)||/\.(?:pem|key|p12|pfx)$/i.test(p))throw error('mirror_source_forbidden');
  return value;
}
function safeUrl(value){
  if(typeof value!=='string'||value.includes('%')||value!==value.trim())throw error('mirror_canonical_invalid');
  let u;try{u=new URL(value);}catch{throw error('mirror_canonical_invalid');}
  if(u.origin!=='https://socdepoble.org'||u.username||u.password||u.search||u.hash||u.href!==value||!/^\/(?:mur|events|noticies|croniques|cursos)\/[a-zA-Z0-9][a-zA-Z0-9/_-]{0,255}$/.test(u.pathname))throw error('mirror_canonical_invalid');return value;
}
function originalSource(value){
  if(typeof value!=='string'||value!==value.trim()||/[\s\p{Cc}\p{Cf}]/u.test(value))throw error('mirror_original_source_invalid');
  let u;try{u=new URL(value);}catch{throw error('mirror_original_source_invalid');}
  if(u.href!==value||u.origin!=='https://mastodont.cat'||u.username||u.password||u.search||u.hash||!/^\/(?:@depoble\/|users\/depoble\/statuses\/)\d{1,30}$/.test(u.pathname))throw error('mirror_original_source_invalid');return value;
}
function markdown(value){return text(value,2*1024*1024).replaceAll('<','&lt;').replaceAll('>','&gt;').replace(/\]\(\s*(?:javascript|data|file|vbscript):[^)]*\)/gi,'](enllaç-omés)');}
function article(raw){
  exact(raw,['id','section','visibility','publicProofSha256','title','summary','bodyMarkdown','canonicalUrl','originalSourceUrl','publishedAt','updatedAt','eventDate','tags','authorDisplayName']);
  if(!ID.test(raw.id??'')||!['mur','events','noticies','croniques','cursos'].includes(raw.section)||raw.visibility!=='public'||!H.test(raw.publicProofSha256??''))throw error('mirror_public_article_required');
  if(!Array.isArray(raw.tags)||raw.tags.length>20)throw error('mirror_public_article_required');
  const out={id:raw.id,section:raw.section,visibility:'public',publicProofSha256:raw.publicProofSha256,title:text(raw.title,500),summary:text(raw.summary,4000),bodyMarkdown:markdown(raw.bodyMarkdown),canonicalUrl:raw.canonicalUrl===null?null:safeUrl(raw.canonicalUrl),...(raw.originalSourceUrl===undefined?{}:{originalSourceUrl:originalSource(raw.originalSourceUrl)}),publishedAt:raw.publishedAt===null?null:iso(raw.publishedAt),updatedAt:raw.updatedAt===null?null:iso(raw.updatedAt),...(raw.eventDate===undefined?{}:{eventDate:day(raw.eventDate)}),tags:raw.tags.map(t=>text(t,80)),authorDisplayName:text(raw.authorDisplayName,200)};
  return out;
}
function reviewedRoots(value){
  if(!Array.isArray(value)||value.length>32)throw error('mirror_source_roots_required');
  const seen=new Set();return value.map(pin=>{exact(pin,['kind','root']);if(!['media','opendata','restore'].includes(pin.kind))throw error('mirror_source_roots_invalid');directory(pin.root);relative(pin.root.slice(1));const id=pin.kind+'\0'+pin.root;if(seen.has(id))throw error('mirror_source_roots_invalid');seen.add(id);return{kind:pin.kind,root:pin.root};});
}
function source(raw,kind,roots){
  exact(raw,['root','relativePath','canonicalName','sha256','bytes','public','publicProofSha256','mimeType','license','version']);
  if(raw.public!==true||!H.test(raw.publicProofSha256??'')||!H.test(raw.sha256??'')||!Number.isSafeInteger(raw.bytes)||raw.bytes<1||raw.bytes>32*1024*1024||kind!=='restore'&&(typeof raw.license!=='string'||!raw.license||raw.license.length>200))throw error('mirror_public_source_required');
  const name=relative(raw.canonicalName);if(name.includes('/'))throw error('mirror_canonical_name_invalid');
  const extensions={'image/jpeg':/\.jpe?g$/i,'image/png':/\.png$/i,'image/webp':/\.webp$/i,'audio/mpeg':/\.mp3$/i,'audio/ogg':/\.ogg$/i,'audio/wav':/\.wav$/i,'audio/mp4':/\.m4a$/i,'application/pdf':/\.pdf$/i};
  if(kind==='media'&&!extensions[raw.mimeType]?.test(name)||kind==='opendata'&&(raw.mimeType!=='application/zip'||!name.endsWith('.zip')||raw.version!=='1.2.0'))throw error('mirror_source_type_invalid');
  if(kind==='restore'&&(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,100}\.(?:mjs|py|sql|md|json)$/.test(name)||!['text/plain','text/javascript','application/javascript','text/x-python','application/sql','text/markdown','application/json'].includes(raw.mimeType)))throw error('mirror_restore_type_invalid');
  relative(directory(raw.root).slice(1));
  if(!roots.some(pin=>pin.kind===kind&&pin.root===raw.root))throw error('mirror_source_root_not_reviewed');
  return{path:(kind==='media'?F[1]:kind==='restore'?F[4]:F[2])+'/'+name,kind:kind==='restore'?'restoration-script':kind,source:{root:raw.root,path:relative(raw.relativePath),kind},sha256:raw.sha256,bytes:raw.bytes};
}
/** Lowercase native X25519 age recipient only. No plugin, SSH or identities. */
export function validaRecipientAge(value){
  const alphabet='qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  if(typeof value!=='string'||!/^age1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(value))throw error('mirror_age_recipient_invalid');
  const values=[...value.slice(4)].map(c=>alphabet.indexOf(c));let chk=1;
  for(const v of [3,3,3,0,1,7,5,...values]){const top=chk>>>25;chk=((chk&0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((top>>>i)&1)chk^=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3][i];}
  if((chk>>>0)!==1||values[51]%16!==0)throw error('mirror_age_recipient_invalid');return value;
}
function bytesEntry(name,bytes,kind){const data=Buffer.from(bytes);return{path:name,sha256:sha(data),bytes:data.byteLength,kind,data:data.toString('base64')};}
function payload(value){return Buffer.from(JSON.stringify(value,null,2)+'\n');}
const RESTORE=`# Restauració manual del Node 0\n\nLa generació és una còpia local verificada; comprova separadament la disponibilitat a Drive i Time Machine. No acredita failover web ni una restauració en menys de 10 minuts.\n\n1. Verifica CURRENT.json, MANIFEST.json i SHA256SUMS en una màquina de confiança.\n2. Instal·la PostgreSQL 17 i age des de fonts oficials amb pins verificats.\n3. Desxifra el fitxer .dump.age amb una identitat guardada fora de Drive i restaura amb pg_restore en una base NOVA aïllada. No restaures directament sobre producció.\n4. Reaplica rols i privilegis des dels kits CAS revisats: pg_dump cobreix una base, no els rols globals del clúster. Configura secrets/claus localment o des d'una còpia xifrada separada.\n5. Verifica recompte/ACL/serveis i executa una prova de recuperació abans d'encaminar trànsit.\n\nNo hi ha claus, tokens, fitxers .env, còpia PGDATA, notes privades ni xats en les carpetes llegibles. El dump pot contindre dades privades i només s'escriu xifrat age. Retenció local màxima: 30 generacions diàries i 12 mensuals; Drive versions i paperera requereixen gestió separada. Cap upload automàtic està implementat en este laboratori.\n`;

function worker(req,{python=process.platform==='darwin'?'/Library/Developer/CommandLineTools/usr/bin/python3':'/usr/bin/python3',signal}={}){
  directory(python);
  return new Promise((resolve,reject)=>{let size=0,output='',settled=false;
    if(signal?.aborted){reject(error('mirror_worker_aborted'));return;}
    const child=spawn(python,['-I','-B',WORKER],{stdio:['pipe','pipe','pipe'],env:ENV,shell:false});
    const aborted=()=>{child.kill('SIGKILL');finish(error('mirror_worker_aborted'));};
    const finish=(cause,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',aborted);cause?reject(cause):resolve(value);};
    const timer=setTimeout(()=>{child.kill('SIGKILL');finish(error('mirror_worker_timeout'));},30000);
    signal?.addEventListener('abort',aborted,{once:true});
    child.stdout.on('data',chunk=>{size+=chunk.length;if(size>180*1024*1024){child.kill('SIGKILL');finish(error('mirror_worker_output_limit'));}else output+=chunk.toString('utf8');});
    child.stderr.on('data',()=>{});child.on('error',()=>finish(error('mirror_worker_unavailable')));child.stdin.on('error',()=>finish(error('mirror_worker_unavailable')));
    child.on('close',code=>{try{const r=JSON.parse(output);if(code!==0||r.ok!==true)return finish(error(/^mirror_[a-z_]+$/.test(r.error??'')?r.error:'mirror_file_operation_failed'));finish(null,r.result);}catch{finish(error('mirror_worker_protocol'));}});
    child.stdin.end(JSON.stringify(req));
  });
}
/** Production-capable process primitive, still inert until explicitly called.
 * stdout-only pg_dump --format=custom --compress=gzip:6 -> age -r recipient.
 * No shell, inherited env, passwords, input files, identity or plaintext file.
 */
export function creaRunnerSnapshot({pgDump,age,database,socket,user,timeoutMs=60000,maxBytes=64*1024*1024,spawnImpl=spawn}={}){
  directory(pgDump);directory(age);directory(socket);
  if(database!=='socdepoble_node0'||typeof user!=='string'||!/^javi$|^node0_operator$/.test(user)||!Number.isSafeInteger(timeoutMs)||timeoutMs<10||timeoutMs>300000||!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>LIMIT)throw error('mirror_snapshot_config_invalid');
  return async({recipient})=>{
    validaRecipientAge(recipient);
    return new Promise((resolve,reject)=>{let settled=false,dumpDone=false,ageDone=false,size=0;const chunks=[];let dumper,encryptor;
      const finish=(cause)=>{if(settled)return;settled=true;clearTimeout(timer);if(cause){dumper?.kill('SIGKILL');encryptor?.kill('SIGKILL');reject(cause);return;}const ciphertext=Buffer.concat(chunks);if(ciphertext.length<64||!ciphertext.subarray(0,22).equals(Buffer.from('age-encryption.org/v1\n')))return reject(error('mirror_snapshot_encryption_invalid'));resolve({ciphertext,completed:true,encrypted:true,format:'pg_dump-custom-gzip-6',encryption:'age-X25519'});};
      const timer=setTimeout(()=>finish(error('mirror_snapshot_timeout')),timeoutMs);
      try{
        encryptor=spawnImpl(age,['--encrypt','--recipient',recipient],{stdio:['pipe','pipe','pipe'],env:ENV,shell:false});
        dumper=spawnImpl(pgDump,['--format=custom','--compress=gzip:6','--no-password','--host',socket,'--port','5432','--username',user,'--dbname',database],{stdio:['ignore','pipe','pipe'],env:ENV,shell:false});
        for(const child of[dumper,encryptor]){child.once('error',()=>finish(error('mirror_snapshot_process_failed')));child.stderr.on('data',()=>{});}
        encryptor.stdin.on('error',()=>finish(error('mirror_snapshot_process_failed')));dumper.stdout.on('error',()=>finish(error('mirror_snapshot_process_failed')));
        dumper.stdout.pipe(encryptor.stdin);
        encryptor.stdout.on('data',chunk=>{size+=chunk.length;if(size>maxBytes)finish(error('mirror_snapshot_limit'));else chunks.push(Buffer.from(chunk));});
        dumper.once('close',code=>{if(code!==0)return finish(error('mirror_snapshot_process_failed'));dumpDone=true;if(ageDone)finish();});
        encryptor.once('close',code=>{if(code!==0)return finish(error('mirror_snapshot_process_failed'));ageDone=true;if(dumpDone)finish();});
      }catch{finish(error('mirror_snapshot_process_failed'));}
    });
  };
}

export async function inspeccionaMirall({mirrorDir,authentication,now=Date.now,python,signal}={}){
  if(!mirrorDir)return{configured:false,lastSnapshotAt:null,integrityOk:false,verifiedAt:null};
  const verifiedAt=new Date(now()).toISOString();
  try{const value=await worker({action:'inspect',root:directory(mirrorDir),authentication},{python,signal});return{configured:true,lastSnapshotAt:value?iso(value.lastSnapshotAt):null,integrityOk:Boolean(value),verifiedAt,...(value?{generation:value.generation,manifestSha256:value.manifestSha256,sumsSha256:value.sumsSha256}:{})};}catch{return{configured:true,lastSnapshotAt:null,integrityOk:false,verifiedAt};}
}
export async function exportaMirall({mirrorDir,stateDir,recipient,providers,restoreAssetsAllowlist=[],reviewedSourceRoots=[],authentication,runner,apply=false,now=Date.now,generationId,python}={}){
  if(!mirrorDir||!recipient)return{state:'unconfigured',configured:false,cloudUploadedVerified:false};
  directory(mirrorDir);validaRecipientAge(recipient);
  if(!providers||typeof providers.listPublicArticles!=='function'||typeof providers.listPublicMedia!=='function'||typeof providers.listPublicOpenData!=='function')throw error('mirror_public_providers_required');
  if(!Array.isArray(restoreAssetsAllowlist)||restoreAssetsAllowlist.length>100)throw error('mirror_restore_allowlist_invalid');
  const roots=reviewedRoots(reviewedSourceRoots);
  const restorePins=new Map();for(const pin of restoreAssetsAllowlist){exact(pin,['name','sha256']);if(typeof pin.name!=='string'||!H.test(pin.sha256??'')||restorePins.has(pin.name))throw error('mirror_restore_allowlist_invalid');relative(pin.name);restorePins.set(pin.name,pin.sha256);}
  const [articlesRaw,mediaRaw,openRaw,restoreRaw]=await Promise.all([providers.listPublicArticles(),providers.listPublicMedia(),providers.listPublicOpenData(),typeof providers.listRestoreAssets==='function'?providers.listRestoreAssets():[]]);
  if(!Array.isArray(articlesRaw)||articlesRaw.length>5000||!Array.isArray(mediaRaw)||mediaRaw.length>5000||!Array.isArray(openRaw)||openRaw.length>100||!Array.isArray(restoreRaw)||restoreRaw.length>100)throw error('mirror_provider_limit');
  const articles=articlesRaw.map(article),media=mediaRaw.map(v=>source(v,'media',roots)),openData=openRaw.map(v=>source(v,'opendata',roots)),restoreAssets=restoreRaw.map(v=>{const s=source(v,'restore',roots);if(restorePins.get(v.canonicalName)!==s.sha256)throw error('mirror_restore_not_reviewed');return s;});
  const publicProofs=[...articles.map(a=>a.publicProofSha256),...mediaRaw.map(a=>a.publicProofSha256),...openRaw.map(a=>a.publicProofSha256),...restoreRaw.map(a=>a.publicProofSha256)];
  const createdAt=new Date(now()).toISOString(),generation=generationId??createdAt.slice(0,19).replaceAll('-','').replaceAll(':','')+'Z-'+randomBytes(8).toString('hex');
  if(!/^\d{8}T\d{6}Z-[a-f0-9]{16}$/.test(generation))throw error('mirror_generation_invalid');
  const entries=[];
  for(const a of articles){const stem=F[0]+'/'+a.section+'/'+encodeURIComponent(a.id),footer=a.canonicalUrl?'URL canònica: '+a.canonicalUrl:'URL canònica pendent';entries.push(bytesEntry(stem+'.json',payload(a),'public-article-json'));entries.push(bytesEntry(stem+'.md',Buffer.from('# '+markdown(a.title).replaceAll('\n',' ')+'\n\n'+markdown(a.summary)+'\n\n'+a.bodyMarkdown+'\n\n'+footer+(a.originalSourceUrl?'\nFont original: '+a.originalSourceUrl:'')+'\n'),'public-article-markdown'));}
  entries.push(...media,...openData,...restoreAssets,bytesEntry(F[4]+'/README_RESTAURACIO.md',Buffer.from(RESTORE),'restoration-recipe'));
  // Preflight all declared bytes even in dry-run; no PostgreSQL process starts.
  for(const e of [...media,...openData,...restoreAssets]){
    const read=await worker({action:'read',root:e.source.root,path:e.source.path,kind:e.source.kind,reviewedSourceRoots:roots,sha256:e.sha256},{python});
    if(read.bytes!==e.bytes)throw error('mirror_source_integrity');
    const bytes=Buffer.from(read.data,'base64');
    if(e.kind==='restoration-script'){try{new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw error('mirror_restore_encoding_invalid');}}
    if(e.kind==='opendata'){let p;try{p=await llegeixPaquetOpenData(bytes,{sha256Esperat:e.sha256});}catch{throw error('mirror_opendata_invalid');}if(p.versio!=='1.2.0')throw error('mirror_opendata_invalid');}
  }
  // The same worker scanner handles DTO bytes, raw sources and archive contents.
  await worker({action:'scan',entries:entries.filter(e=>'data' in e)},{python});
  const counts={articles:articles.length,media:media.length,openData:openData.length,restoreAssets:restoreAssets.length};
  if(new Set(entries.map(e=>e.path.toLocaleLowerCase('en'))).size!==entries.length)throw error('mirror_duplicate_path');
  await worker({action:'preflight',root:mirrorDir,authentication},{python});
  if(apply!==true)return{state:'planned',configured:true,counts,folders:[...F],snapshot:{encrypted:true,format:'pg_dump-custom-gzip-6',recipientSha256:sha(recipient)},cloudUploadedVerified:false};
  directory(stateDir);if(path.relative(mirrorDir,stateDir)===''||!path.relative(mirrorDir,stateDir).startsWith('..'))throw error('mirror_state_must_be_private');
  await worker({action:'preflight-authentication',root:mirrorDir,authentication},{python});
  await worker({action:'preflight-state',root:stateDir},{python});
  if(typeof runner!=='function')throw error('mirror_snapshot_runner_required');
  let snapshot;try{snapshot=await runner({recipient});}catch{throw error('mirror_snapshot_failed');}
  if(snapshot?.completed!==true||snapshot.encrypted!==true||snapshot.format!=='pg_dump-custom-gzip-6'||snapshot.encryption!=='age-X25519'||!(snapshot.ciphertext instanceof Uint8Array)||snapshot.ciphertext.byteLength>LIMIT||snapshot.ciphertext.byteLength<64||!Buffer.from(snapshot.ciphertext).subarray(0,22).equals(Buffer.from('age-encryption.org/v1\n')))throw error('mirror_snapshot_encryption_invalid');
  entries.push(bytesEntry(F[3]+'/node0-'+generation+'.dump.age',snapshot.ciphertext,'encrypted-postgresql-snapshot'));
  entries.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  if(new Set(entries.map(e=>e.path.toLocaleLowerCase('en'))).size!==entries.length)throw error('mirror_duplicate_path');
  const files=entries.map(({path,sha256,bytes,kind})=>({path,sha256,bytes,kind}));
  const manifest={schema:'sdp.node0.workspace-mirror.v1',generation,createdAt,folders:[...F],counts,files,publicSelection:{proofs:publicProofs,completeWorkspaceInventoryVerified:false,atomicWithDatabaseDump:false},snapshot:{consistent:'pg_dump-transaction',format:snapshot.format,encryption:snapshot.encryption,recipientSha256:sha(recipient),restoreVerified:false},privacy:{readableScope:'public-whitelist',plaintextSecretsIncluded:false,pgdataCopied:false},cloudUploadedVerified:false,webFailoverImplemented:false};
  const published=await worker({action:'publish',mirrorDir,authentication,reviewedSourceRoots:roots,retentionNow:createdAt,entries,manifest:payload(manifest).toString('base64')},{python});
  const retentionOk=published.retentionOk===true,retentionCode=retentionOk?null:'mirror_retention_failed';
  const verifiedAt=new Date(now()).toISOString(),state={schema:'sdp.node0.mirror.private-state.v3',configured:true,account:'socdepoble@socdepoble.org',generation:published.generation,mirrorConfigSha256:sha(directory(mirrorDir)),recipientSha256:sha(recipient),lastSnapshotAt:published.lastSnapshotAt,manifestSha256:published.manifestSha256,sumsSha256:published.sumsSha256,integrityOk:true,retentionOk,retentionCode,verifiedAt,verificationSource:'last_verified_snapshot',authenticationVerified:true,authenticationAlgorithm:'HMAC-SHA256',authenticationKeyId:authentication.keyId,cloudUploadedVerified:false,restoreVerified:false};
  await worker({action:'state',root:stateDir,data:payload(state).toString('base64')},{python});
  return{state:'published-local',configured:true,generation,counts,lastSnapshotAt:published.lastSnapshotAt,manifestSha256:published.manifestSha256,sumsSha256:published.sumsSha256,integrityOk:true,retentionOk,retentionCode,verifiedAt,cloudUploadedVerified:false,restoreVerified:false};
}
