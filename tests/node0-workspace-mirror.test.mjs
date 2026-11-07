import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash,createHmac,randomBytes} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {spawn} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {exportaMirall,inspeccionaMirall,creaRunnerSnapshot,validaRecipientAge,CARPETES_MIRALL,SQL_OBRI_CAPTURA_LEDGER,validaLedgerCapturat} from '../tooling/node0/exporta-mirall-workspace-node0.mjs';

const SHA=value=>createHash('sha256').update(value).digest('hex'),H='a'.repeat(64);
const NOW=Date.parse('2026-11-04T20:20:00.123Z'),GEN='20261104T202000Z-0123456789abcdef';
// Synthetic public X25519 recipient bytes, not an actual newly generated key.
function recipient(){const alphabet='qpzry9x8gf2tvdw0s3jn54khce6mua7l',data=Array(52).fill(0);let chk=1;for(const v of[3,3,3,0,1,7,5,...data,0,0,0,0,0,0]){const top=chk>>>25;chk=((chk&0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((top>>>i)&1)chk^=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3][i];}chk^=1;return'age1'+data.map(v=>alphabet[v]).join('')+Array.from({length:6},(_,i)=>alphabet[(chk>>>(5*(5-i)))&31]).join('');}
const RECIPIENT=recipient(),CIPHER=Buffer.concat([Buffer.from('age-encryption.org/v1\n'),Buffer.alloc(150,72)]);
const LEDGER=Object.freeze({migrations:80,migrationLedgerSha256:'b'.repeat(64)}),CAPTURE_PROTOCOL='sdp.node0.snapshot-ledger.v1';
import {exportaMunicipiOpenData} from '../src/data/exportaMunicipiOpenData.js';
const FIXTURE_INPUT={municipi:{slug:'sella',nom:'Sella'},ara:'2026-11-04T00:00:00Z',noticies:[{id:'synthetic-public-fixture',title:'Relat de prova',poble_id:'sella',author_entity_id:'synthetic-organisation',body:'Relat públic de prova.',copyright:'CC BY 4.0'}]};
const ZIP=(await exportaMunicipiOpenData(FIXTURE_INPUT)).zip;
const ARTICLE={id:'20000000-0000-4000-8000-000000000001',section:'mur',visibility:'public',publicProofSha256:H,title:'Crònica pública',summary:'La festa del poble',bodyMarkdown:'Memòria col·lectiva. <script>window.test=1</script>',canonicalUrl:'https://socdepoble.org/mur/cronica-publica',publishedAt:'2026-11-04T12:00:00.000Z',updatedAt:'2026-11-04T12:00:00.000Z',tags:['Patrimoni'],authorDisplayName:'Sóc de Poble'};
async function fixture(t){
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'sdp-mirror-lab-'));const mirrorDir=path.join(base,'drive-mirror'),stateDir=path.join(base,'private-state'),sources=path.join(base,'public');
  for(const p of[mirrorDir,stateDir,sources])await fs.mkdir(p,{mode:0o700});
  t.after(()=>fs.rm(base,{recursive:true,force:true}));
  const mediaBytes=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]);await fs.writeFile(path.join(sources,'cartell.png'),mediaBytes);
  const zipBytes=Buffer.from(ZIP);await fs.writeFile(path.join(sources,'municipi.zip'),zipBytes);
  const media={root:sources,relativePath:'cartell.png',canonicalName:'cartell-canonic.png',sha256:SHA(mediaBytes),bytes:mediaBytes.length,public:true,publicProofSha256:H,mimeType:'image/png',license:'CC-BY-SA-4.0'};
  const zip={root:sources,relativePath:'municipi.zip',canonicalName:'la-torre-de-les-macanes-1.2.0.zip',sha256:SHA(zipBytes),bytes:zipBytes.length,public:true,publicProofSha256:H,mimeType:'application/zip',license:'CC-BY-SA-4.0',version:'1.2.0'};
  let articles=[structuredClone(ARTICLE)],medias=[media],zips=[zip],runs=0;
  const providers={listPublicArticles:async()=>articles,listPublicMedia:async()=>medias,listPublicOpenData:async()=>zips};
  const authDir=path.join(base,'local-auth');await fs.mkdir(authDir,{mode:0o700});const authentication={keyFile:path.join(authDir,'authentication.bin'),keyId:'r8-local-test'};await fs.writeFile(authentication.keyFile,randomBytes(32),{mode:0o600});
  const reviewedSourceRoots=['media','opendata','restore'].map(kind=>({kind,root:sources}));
  const options={mirrorDir,stateDir,authentication,reviewedSourceRoots,recipient:RECIPIENT,providers,now:()=>NOW,generationId:GEN,runner:async({recipient})=>{runs++;assert.equal(recipient,RECIPIENT);return{ciphertext:CIPHER,completed:true,encrypted:true,format:'pg_dump-custom-gzip-6',encryption:'age-X25519',captureProtocol:CAPTURE_PROTOCOL,migrationLedger:LEDGER};}};
  return{base,mirrorDir,stateDir,authentication,sources,media,zip,options,runs:()=>runs,setArticles:value=>{articles=value;},setMedia:value=>{medias=value;},setZips:value=>{zips=value;}};
}
async function current(f){return JSON.parse(await fs.readFile(path.join(f.mirrorDir,'CURRENT.json'),'utf8'));}

test('unconfigured export is inert and status never invents cloud or snapshot evidence',async()=>{
  assert.deepEqual(await exportaMirall(),{state:'unconfigured',configured:false,cloudUploadedVerified:false});
  assert.deepEqual(await inspeccionaMirall(),{configured:false,lastSnapshotAt:null,integrityOk:false,verifiedAt:null});
});
test('recipient accepts canonical native checksum and rejects identities, plugins, SSH, typos and controls',()=>{
  assert.equal(validaRecipientAge(RECIPIENT),RECIPIENT);
  for(const v of['AGE-SECRET-KEY-1SENTINEL','age-plugin-yubikey-1x','ssh-ed25519 AAAA',RECIPIENT+'\n',RECIPIENT.slice(0,-1)+'q',RECIPIENT.toUpperCase()])assert.throws(()=>validaRecipientAge(v),/recipient_invalid/);
});
test('default dry-run reads a deterministic synthetic canonical OpenData1.2 ZIP and whitelisted files without starting pg_dump',async t=>{
  const f=await fixture(t),out=await exportaMirall(f.options);assert.equal(out.state,'planned');assert.deepEqual(out.counts,{articles:1,media:1,openData:1,restoreAssets:0});assert.deepEqual(out.folders,CARPETES_MIRALL);assert.equal(f.runs(),0);assert.deepEqual(await fs.readdir(f.mirrorDir),[]);
});
test('publication creates all five folders, verified checksums, encrypted snapshot and private receipt',async t=>{
  const f=await fixture(t),out=await exportaMirall({...f.options,apply:true});assert.equal(out.state,'published-local');assert.equal(out.integrityOk,true);assert.equal(out.cloudUploadedVerified,false);assert.equal(out.restoreVerified,false);assert.equal(out.retentionOk,true);assert.equal(out.retentionCode,null);
  const pointer=await current(f),g=path.join(f.mirrorDir,'generacions',pointer.generation),manifest=JSON.parse(await fs.readFile(path.join(g,'MANIFEST.json')));
  assert.deepEqual((await fs.readdir(g)).sort(),[...CARPETES_MIRALL,'MANIFEST.json','SHA256SUMS','AUTHENTICITY.json'].sort());assert.equal(SHA(await fs.readFile(path.join(g,'MANIFEST.json'))),pointer.manifestSha256);assert.equal(SHA(await fs.readFile(path.join(g,'SHA256SUMS'))),pointer.sumsSha256);
  const snap=manifest.files.find(v=>v.kind==='encrypted-postgresql-snapshot');assert.ok(snap.path.endsWith('.dump.age'));assert.deepEqual(await fs.readFile(path.join(g,snap.path)),CIPHER);assert.equal(manifest.privacy.pgdataCopied,false);assert.equal(manifest.webFailoverImplemented,false);
  const md=await fs.readFile(path.join(g,manifest.files.find(v=>v.kind==='public-article-markdown').path),'utf8');assert.ok(md.includes('Crònica pública'));assert.ok(!md.includes('<script>'));
  const statePath=path.join(f.stateDir,'workspace-mirror-state.json'),state=JSON.parse(await fs.readFile(statePath));assert.equal((await fs.stat(statePath)).mode&0o777,0o600);assert.equal(state.manifestSha256,pointer.manifestSha256);assert.equal(state.integrityOk,true);assert.equal('mirrorDir'in state,false);assert.equal('recipient'in state,false);
  assert.deepEqual(await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication,now:()=>NOW}),{configured:true,lastSnapshotAt:new Date(NOW).toISOString(),integrityOk:true,verifiedAt:new Date(NOW).toISOString(),generation:pointer.generation,manifestSha256:pointer.manifestSha256,sumsSha256:pointer.sumsSha256});
});
test('successive generations preserve old bytes and CURRENT selects only the complete newest generation',async t=>{
  const f=await fixture(t);await exportaMirall({...f.options,apply:true});const old=await current(f),oldManifest=await fs.readFile(path.join(f.mirrorDir,'generacions',GEN,'MANIFEST.json'));
  const next=GEN.slice(0,-1)+'0';f.setArticles([{...ARTICLE,title:'Crònica següent'}]);await exportaMirall({...f.options,apply:true,generationId:next,now:()=>NOW+86400000});assert.equal((await current(f)).generation,next);assert.deepEqual(await fs.readFile(path.join(f.mirrorDir,'generacions',GEN,'MANIFEST.json')),oldManifest);assert.notEqual((await current(f)).manifestSha256,old.manifestSha256);
  await assert.rejects(exportaMirall({...f.options,apply:true,generationId:GEN}));assert.equal((await current(f)).generation,next);
});
test('private notes/chat/profile sections and extra personal fields cannot enter the public export DTO',async t=>{
  const f=await fixture(t);
  for(const a of[{...ARTICLE,visibility:'private'},{...ARTICLE,section:'notes'},{...ARTICLE,section:'profiles'},{...ARTICLE,email:'PRIVATE_SENTINEL'},{...ARTICLE,canonicalUrl:'https://socdepoble.org/notes/private'},{...ARTICLE,canonicalUrl:'https://socdepoble.org/%6eotes/private'}]){f.setArticles([a]);await assert.rejects(exportaMirall({...f.options,apply:true}));}
  assert.equal(f.runs(),0);assert.deepEqual(await fs.readdir(f.mirrorDir),[]);
});
test('unknown original timestamps remain null and optional civil event dates never invent a publication instant',async t=>{
  const f=await fixture(t);f.setArticles([{...ARTICLE,section:'events',canonicalUrl:'https://socdepoble.org/events/aplec-2023',publishedAt:null,updatedAt:null,eventDate:'2023-11-26'}]);
  const out=await exportaMirall({...f.options,apply:true}),g=path.join(f.mirrorDir,'generacions',out.generation),manifest=JSON.parse(await fs.readFile(path.join(g,'MANIFEST.json'))),item=JSON.parse(await fs.readFile(path.join(g,manifest.files.find(v=>v.kind==='public-article-json').path)));
  assert.equal(item.publishedAt,null);assert.equal(item.updatedAt,null);assert.equal(item.eventDate,'2023-11-26');
  for(const eventDate of['2026-02-30','2025-02-29','2026-13-01','2026-01-01T00:00:00Z',null]){f.setArticles([{...ARTICLE,eventDate}]);await assert.rejects(exportaMirall(f.options),/event_day_invalid/);}
  f.setArticles([{...ARTICLE,publishedAt:undefined}]);await assert.rejects(exportaMirall(f.options),/time_invalid/);
});
test('public backup accepts pending canonical URLs without POSSE authority and preserves a verified Mastodon source reference',async t=>{
  const f=await fixture(t),originalSourceUrl='https://mastodont.cat/users/depoble/statuses/123';f.setArticles([{...ARTICLE,id:'mastodon:123',canonicalUrl:null,originalSourceUrl,publishedAt:null,updatedAt:null}]);
  const out=await exportaMirall({...f.options,apply:true}),g=path.join(f.mirrorDir,'generacions',out.generation),manifest=JSON.parse(await fs.readFile(path.join(g,'MANIFEST.json'))),json=manifest.files.find(v=>v.kind==='public-article-json'),md=manifest.files.find(v=>v.kind==='public-article-markdown'),item=JSON.parse(await fs.readFile(path.join(g,json.path)));
  assert.equal(item.id,'mastodon:123');assert.equal(item.canonicalUrl,null);assert.equal(item.originalSourceUrl,originalSourceUrl);assert.ok(json.path.includes('mastodon%3A123'));
  const readable=await fs.readFile(path.join(g,md.path),'utf8');assert.ok(readable.includes('URL canònica pendent'));assert.ok(readable.includes(originalSourceUrl));assert.equal(readable.includes('https://socdepoble.org/mur/'),false);
  for(const source of['http://127.0.0.1/private','https://mastodont.cat.evil.test/users/depoble/statuses/123','https://evil.test/users/depoble/statuses/123','https://mastodont.cat/@someone/123','https://mastodont.cat/@depoble/123?token=sentinel','https://mastodont.cat/@depoble/123\u202e']){f.setArticles([{...ARTICLE,canonicalUrl:null,originalSourceUrl:source}]);await assert.rejects(exportaMirall(f.options),/original_source_invalid/);}
});
test('only exact reviewed restoration scripts are copied byte-for-byte, with no execution or secret-file bypass',async t=>{
  const f=await fixture(t),code=Buffer.from('throw Error("THIS_RESTORE_SCRIPT_MUST_NOT_EXECUTE");\nconst referenced=process.env.MASTODON_ACCESS_TOKEN;\n');await fs.writeFile(path.join(f.sources,'restore.mjs'),code);
  const asset={root:f.sources,relativePath:'restore.mjs',canonicalName:'restaura-node0.mjs',sha256:SHA(code),bytes:code.length,public:true,publicProofSha256:H,mimeType:'text/javascript'};
  const options={...f.options,providers:{...f.options.providers,listRestoreAssets:async()=>[asset]}};
  await assert.rejects(exportaMirall({...options,apply:true}),/not_reviewed/);await assert.rejects(exportaMirall({...options,apply:true,restoreAssetsAllowlist:[{name:asset.canonicalName,sha256:'0'.repeat(64)}]}),/not_reviewed/);
  const pins=[{name:asset.canonicalName,sha256:asset.sha256}],out=await exportaMirall({...options,apply:true,restoreAssetsAllowlist:pins});assert.equal(out.counts.restoreAssets,1);assert.deepEqual(await fs.readFile(path.join(f.mirrorDir,'generacions',GEN,'05_Recepta_Restauracio_Node0',asset.canonicalName)),code);
  for(const relativePath of['node0.env','private.key'])await assert.rejects(exportaMirall({...options,restoreAssetsAllowlist:pins,providers:{...f.options.providers,listRestoreAssets:async()=>[{...asset,relativePath}]}}),/source_forbidden/);
  const bad=Buffer.from("const "+["MASTODON","ACCESS","TOKEN"].join("_")+"="+JSON.stringify("TEST_ONLY_MIRROR_SENTINEL_123")+";\n");await fs.writeFile(path.join(f.sources,'bad.mjs'),bad);const unsafe={...asset,relativePath:'bad.mjs',sha256:SHA(bad),bytes:bad.length};
  await assert.rejects(exportaMirall({...options,restoreAssetsAllowlist:[{name:unsafe.canonicalName,sha256:unsafe.sha256}],providers:{...f.options.providers,listRestoreAssets:async()=>[unsafe]}}),e=>e.code==='mirror_plaintext_secret_marker'&&!e.message.includes('SENTINEL'));
});
test('credential, environment, private key and PGDATA file paths are refused even with a valid public flag/hash',async t=>{
  const f=await fixture(t);
  for(const p of['node0.env','.env.local','private.key','credentials.json','PGDATA/base/1','../cartell.png']){f.setMedia([{...f.media,relativePath:p}]);await assert.rejects(exportaMirall({...f.options,apply:true}));}
  f.setMedia([{...f.media,root:path.join(f.base,'.config')}]);await assert.rejects(exportaMirall({...f.options,apply:true}));assert.equal(f.runs(),0);
});
test('changed source bytes, duplicate case-folded names and invalid ZIPs fail preflight without writing or dumping',async t=>{
  const f=await fixture(t);f.setMedia([{...f.media,sha256:'0'.repeat(64)}]);await assert.rejects(exportaMirall({...f.options,apply:true}),/integrity/);
  f.setMedia([f.media,{...f.media,canonicalName:'CARTELL-CANONIC.PNG'}]);await assert.rejects(exportaMirall({...f.options,apply:true}),/duplicate/);
  f.setMedia([]);const bad=Buffer.from('not an OpenData package');await fs.writeFile(path.join(f.sources,'bad.zip'),bad);f.setZips([{...f.zip,relativePath:'bad.zip',sha256:SHA(bad),bytes:bad.length}]);await assert.rejects(exportaMirall({...f.options,apply:true}),/opendata_invalid/);assert.equal(f.runs(),0);assert.deepEqual(await fs.readdir(f.mirrorDir),[]);
});
test('symlink leaves and source ancestor symlinks are refused by NOFOLLOW',async t=>{
  const f=await fixture(t);await fs.symlink('cartell.png',path.join(f.sources,'linked.png'));f.setMedia([{...f.media,relativePath:'linked.png'}]);await assert.rejects(exportaMirall({...f.options,apply:true}));
  const rootAlias=path.join(f.base,'alias');await fs.symlink(f.sources,rootAlias);f.setMedia([{...f.media,root:rootAlias}]);await assert.rejects(exportaMirall({...f.options,apply:true}));assert.equal(f.runs(),0);
});
test('hard-linked source files and pre-existing target hardlink traps are rejected',async t=>{
  const f=await fixture(t);await fs.link(path.join(f.sources,'cartell.png'),path.join(f.sources,'second.png'));await assert.rejects(exportaMirall({...f.options,apply:true}));
  f.setMedia([]);await fs.link(path.join(f.sources,'municipi.zip'),path.join(f.mirrorDir,'trap.zip'));await assert.rejects(exportaMirall({...f.options,apply:true}));assert.equal(f.runs(),0);
});
test('target root symlink, lock contention and target tree symlink cannot receive a generation',async t=>{
  const f=await fixture(t),alias=path.join(f.base,'mirror-alias');await fs.symlink(f.mirrorDir,alias);await assert.rejects(exportaMirall({...f.options,mirrorDir:alias,apply:true}));
  const binary=process.platform==='darwin'?'/Library/Developer/CommandLineTools/usr/bin/python3':'/usr/bin/python3',holderScript=path.join(f.base,'hold-lock.py');
  await fs.writeFile(holderScript,'import os,sys,fcntl\nfd=os.open(sys.argv[1],os.O_RDWR|os.O_CREAT,0o600)\nfcntl.flock(fd,fcntl.LOCK_EX)\nprint("ready",flush=True)\nsys.stdin.buffer.read()\n');
  const holder=spawn(binary,['-I','-B',holderScript,path.join(f.mirrorDir,'.mirror-export.lock')],{stdio:['pipe','pipe','pipe']});const closed=new Promise(resolve=>holder.once('close',resolve));
  t.after(async()=>{holder.stdin.end();await closed;});await new Promise((resolve,reject)=>{holder.stdout.once('data',resolve);holder.once('error',reject);});
  await assert.rejects(exportaMirall({...f.options,apply:true}),/busy/);
  assert.equal(f.runs(),0);const target=path.join(f.base,'target');await fs.mkdir(target);await fs.symlink(target,path.join(f.mirrorDir,'trap'));await assert.rejects(exportaMirall({...f.options,apply:true}));assert.deepEqual(await fs.readdir(target),[]);
});
test('tampered published content and added symlinks turn integrity false and block a later publication',async t=>{
  const f=await fixture(t);await exportaMirall({...f.options,apply:true});const dir=path.join(f.mirrorDir,'generacions',GEN);await fs.appendFile(path.join(dir,'05_Recepta_Restauracio_Node0/README_RESTAURACIO.md'),'drift');
  assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication})).integrityOk,false);await assert.rejects(exportaMirall({...f.options,apply:true,generationId:GEN.slice(0,-1)+'0'}));assert.equal(f.runs(),1);assert.equal((await current(f)).generation,GEN);
});
test('private state must be outside Drive with owner-only permissions and an unsafe existing receipt cannot be replaced',async t=>{
  const f=await fixture(t);await assert.rejects(exportaMirall({...f.options,apply:true,stateDir:f.mirrorDir}),/private/);
  await fs.chmod(f.stateDir,0o755);await assert.rejects(exportaMirall({...f.options,apply:true}),/permissions/);await fs.chmod(f.stateDir,0o700);
  await fs.writeFile(path.join(f.stateDir,'workspace-mirror-state.json'),'untouched',{mode:0o644});await assert.rejects(exportaMirall({...f.options,apply:true}),/permissions/);assert.equal(f.runs(),0);assert.deepEqual(await fs.readdir(f.mirrorDir),[]);
});
test('snapshot failure or plaintext/dishonest result leaves CURRENT and state absent',async t=>{
  const f=await fixture(t);
  for(const runner of[async()=>{throw Error('PRIVATE_PROCESS_DIAGNOSTIC');},async()=>({completed:true,encrypted:true,format:'pg_dump-custom-gzip-6',encryption:'age-X25519',ciphertext:Buffer.from('PGDMP PRIVATE_SENTINEL')})])await assert.rejects(exportaMirall({...f.options,apply:true,runner}),e=>!e.message.includes('PRIVATE'));
  assert.deepEqual(await fs.readdir(f.mirrorDir),[]);assert.deepEqual(await fs.readdir(f.stateDir),[]);
});

async function wrappedPython(f,body){
  const binary=process.platform==='darwin'?'/Library/Developer/CommandLineTools/usr/bin/python3':'/usr/bin/python3',wrapper=path.join(f.base,'instrumented-python');
  await fs.writeFile(wrapper,'#!'+binary+'\nimport sys,os,runpy\noriginal=os.replace\n'+body+'\nrunpy.run_path(sys.argv[-1],run_name="__main__")\n',{mode:0o700});return wrapper;
}
test('a captured failure before atomic CURRENT leaves previous generation and private receipt unchanged',async t=>{
  const f=await fixture(t);await exportaMirall({...f.options,apply:true});const before=await fs.readFile(path.join(f.mirrorDir,'CURRENT.json')),state=await fs.readFile(path.join(f.stateDir,'workspace-mirror-state.json'));
  const python=await wrappedPython(f,'def replacement(a,b,**kw):\n    if b=="CURRENT.json": raise OSError("injected write failure")\n    return original(a,b,**kw)\nos.replace=replacement');
  await assert.rejects(exportaMirall({...f.options,apply:true,generationId:GEN.slice(0,-1)+'0',python}),/file_operation_failed/);
  assert.deepEqual(await fs.readFile(path.join(f.mirrorDir,'CURRENT.json')),before);assert.deepEqual(await fs.readFile(path.join(f.stateDir,'workspace-mirror-state.json')),state);assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication})).integrityOk,true);
});
test('a root-path swap at rename cannot redirect writes outside the pinned directory',async t=>{
  const f=await fixture(t);await exportaMirall({...f.options,apply:true});const moved=path.join(f.base,'original-pinned-mirror');
  const python=await wrappedPython(f,'def replacement(a,b,**kw):\n    if b=="CURRENT.json":\n        os.rename('+JSON.stringify(f.mirrorDir)+','+JSON.stringify(moved)+')\n        os.mkdir('+JSON.stringify(f.mirrorDir)+',0o700)\n        with open('+JSON.stringify(path.join(f.mirrorDir,'CURRENT.json'))+',"w") as out: out.write("OUTSIDE_SENTINEL")\n    return original(a,b,**kw)\nos.replace=replacement');
  await assert.rejects(exportaMirall({...f.options,apply:true,generationId:GEN.slice(0,-1)+'0',python}),/root_drift/);
  assert.equal(await fs.readFile(path.join(f.mirrorDir,'CURRENT.json'),'utf8'),'OUTSIDE_SENTINEL');assert.deepEqual((await fs.readdir(f.mirrorDir)),['CURRENT.json']);assert.equal((await inspeccionaMirall({mirrorDir:moved,authentication:f.authentication})).integrityOk,true);
});
test('SIGKILL before CURRENT releases the persistent kernel lock and a later export recovers without losing the previous snapshot',async t=>{
  const f=await fixture(t);await exportaMirall({...f.options,apply:true});const previous=await fs.readFile(path.join(f.mirrorDir,'CURRENT.json')),state=await fs.readFile(path.join(f.stateDir,'workspace-mirror-state.json'));
  const python=await wrappedPython(f,'import signal\ndef replacement(a,b,**kw):\n    if b=="CURRENT.json": os.kill(os.getpid(),signal.SIGKILL)\n    return original(a,b,**kw)\nos.replace=replacement');
  const crashed=GEN.slice(0,-1)+'0';await assert.rejects(exportaMirall({...f.options,apply:true,generationId:crashed,python}));
  assert.deepEqual(await fs.readFile(path.join(f.mirrorDir,'CURRENT.json')),previous);assert.deepEqual(await fs.readFile(path.join(f.stateDir,'workspace-mirror-state.json')),state);
  assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication})).integrityOk,true);assert.equal((await fs.stat(path.join(f.mirrorDir,'.mirror-export.lock'))).mode&0o777,0o600);
  const next=GEN.slice(0,-1)+'1',recovered=await exportaMirall({...f.options,apply:true,generationId:next});assert.equal(recovered.generation,next);assert.equal(recovered.integrityOk,true);assert.equal((await current(f)).generation,next);
  assert.deepEqual(await fs.readdir(path.join(f.mirrorDir,'generacions')),[next]);
});
test('corruption racing CURRENT publication rolls the selector back by CAS and preserves the prior valid snapshot',async t=>{
  const f=await fixture(t);await exportaMirall({...f.options,apply:true});const previous=await fs.readFile(path.join(f.mirrorDir,'CURRENT.json')),state=await fs.readFile(path.join(f.stateDir,'workspace-mirror-state.json')),next=GEN.slice(0,-1)+'0';
  const target=path.join(f.mirrorDir,'generacions',next,'05_Recepta_Restauracio_Node0/README_RESTAURACIO.md');
  const python=await wrappedPython(f,'fired=False\ndef replacement(a,b,**kw):\n    global fired\n    if b=="CURRENT.json" and not fired:\n        fired=True\n        with open('+JSON.stringify(target)+',"ab") as out: out.write(b"corrupted concurrently")\n    return original(a,b,**kw)\nos.replace=replacement');
  await assert.rejects(exportaMirall({...f.options,apply:true,generationId:next,python}),/rolled_back/);
  assert.deepEqual(await fs.readFile(path.join(f.mirrorDir,'CURRENT.json')),previous);assert.deepEqual(await fs.readFile(path.join(f.stateDir,'workspace-mirror-state.json')),state);assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication})).integrityOk,true);
});
test('postcommit pointer drift is never overwritten by automatic rollback',async t=>{
  const f=await fixture(t);await exportaMirall({...f.options,apply:true});const next=GEN.slice(0,-1)+'0',currentPath=path.join(f.mirrorDir,'CURRENT.json'),target=path.join(f.mirrorDir,'generacions',next,'05_Recepta_Restauracio_Node0/README_RESTAURACIO.md');
  const python=await wrappedPython(f,'fired=False\ndef replacement(a,b,**kw):\n    global fired\n    result=original(a,b,**kw)\n    if b=="CURRENT.json" and not fired:\n        fired=True\n        with open('+JSON.stringify(target)+',"ab") as out: out.write(b"corruption")\n        import json\n        with open('+JSON.stringify(currentPath)+',"r") as src: pointer=json.load(src)\n        pointer["manifestSha256"]="0"*64\n        with open('+JSON.stringify(currentPath)+',"w") as out: json.dump(pointer,out)\n    return result\nos.replace=replacement');
  await assert.rejects(exportaMirall({...f.options,apply:true,generationId:next,python}),/rollback_current_drift/);assert.equal((await current(f)).manifestSha256,'0'.repeat(64));
});
test('an exception after rename is treated as an attempted external effect and rolls back the selector safely',async t=>{
  const f=await fixture(t);await exportaMirall({...f.options,apply:true});const previous=await fs.readFile(path.join(f.mirrorDir,'CURRENT.json'));
  const python=await wrappedPython(f,'fired=False\ndef replacement(a,b,**kw):\n    global fired\n    result=original(a,b,**kw)\n    if b=="CURRENT.json" and not fired:\n        fired=True\n        raise OSError("injected aftereffect failure")\n    return result\nos.replace=replacement');
  await assert.rejects(exportaMirall({...f.options,apply:true,generationId:GEN.slice(0,-1)+'0',python}),/rolled_back/);assert.deepEqual(await fs.readFile(path.join(f.mirrorDir,'CURRENT.json')),previous);assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication})).integrityOk,true);
});
test('obvious plaintext credential markers cannot enter public article or attachment bytes',async t=>{
  const f=await fixture(t);
  for(const value of['MASTODON_ACCESS_TOKEN=LAB_SENTINEL','Bearer LAB_SECRET_SENTINEL','-----BEGIN PRIVATE KEY-----']){f.setArticles([{...ARTICLE,bodyMarkdown:value}]);await assert.rejects(exportaMirall({...f.options,apply:true}),e=>e.code==='mirror_plaintext_secret_marker'&&!e.message.includes('SENTINEL'));}
  f.setArticles([ARTICLE]);const bytes=Buffer.from('%PDF-1.4\nBearer LAB_SECRET_SENTINEL');await fs.writeFile(path.join(f.sources,'bad.pdf'),bytes);f.setMedia([{...f.media,relativePath:'bad.pdf',canonicalName:'bad.pdf',sha256:SHA(bytes),bytes:bytes.length,mimeType:'application/pdf'}]);await assert.rejects(exportaMirall({...f.options,apply:true}),/secret_marker/);assert.equal(f.runs(),0);assert.deepEqual(await fs.readdir(f.mirrorDir),[]);
});

const META={protocol:CAPTURE_PROTOCOL,database:'socdepoble_node0',serverMajor:17,isolation:'repeatable read',readOnly:true,snapshotId:'00000003-0000001B-1',...LEDGER};
function fakeSpawn({exit=0,hang=false,large=false,metadata=META,duplicate=false,controlLimit=false,dieCapture=false,ageExit=0,captureExit=0,closeDelay=0,ignoreTerm=false,partialTail=false,interleavedClose=false}={}){
  const calls=[],children=[];let seenPlain=Buffer.alloc(0);
  const close=(c,code)=>{if(c.closed)return;c.closed=true;c.stdout.end();c.stderr.end();c.emit('close',code);};
  function run(file,args,options){const c=new EventEmitter();c.stdin=new PassThrough();c.stdout=new PassThrough();c.stderr=new PassThrough();c.closed=false;c.killed=false;c.signals=[];c.kind=file.endsWith('/psql')?'capture':file.endsWith('/age')?'age':'dump';c.kill=signal=>{c.killed=true;c.signals.push(signal);if(!(ignoreTerm&&signal==='SIGTERM'))setTimeout(()=>close(c,null),closeDelay);return true;};children.push(c);calls.push({file,args,options});
    if(c.kind==='capture'){
      let sent=false;c.stdin.on('data',b=>{const text=b.toString();if(text.includes('BEGIN ISOLATION')){assert.ok(text.indexOf('pg_advisory_lock_shared')<text.indexOf('BEGIN ISOLATION'));assert.equal(sent,false);sent=true;if(hang===true||hang==='capture')return;queueMicrotask(()=>{const line=controlLimit?'x'.repeat(9000):JSON.stringify(metadata);c.stdout.write('\n'+line.slice(0,7));queueMicrotask(()=>{c.stdout.write(line.slice(7)+'\n'+(duplicate?line+'\n':'')+(partialTail?'extra':''));if(dieCapture)close(c,0);});});}else assert.equal(text,'ROLLBACK;\n');});
      c.stdin.on('finish',()=>setImmediate(()=>close(c,captureExit)));
    }else if(c.kind==='age'){c.stdin.on('data',b=>{seenPlain=Buffer.concat([seenPlain,b]);});c.stdin.on(interleavedClose?'finish':'end',()=>{if(hang!==true&&hang!=='age'){c.stdout.end(large?Buffer.alloc(200):CIPHER);if(interleavedClose){close(c,ageExit);close(children.find(child=>child.kind==='dump'),exit);}else setImmediate(()=>close(c,ageExit));}});}
    else if(hang!==true&&hang!=='dump'){assert.equal(children.find(x=>x.kind==='capture').closed,false,'exporting snapshot must stay alive');queueMicrotask(()=>{if(c.closed||c.killed)return;c.stdout.end(Buffer.from('PGDMP PRIVATE_DB_SENTINEL'));setImmediate(()=>close(c,exit));});}return c;}
  return{run,calls,children,plain:()=>seenPlain};
}
const SNAP={pgDump:'/safe/pg_dump',psql:'/safe/psql',age:'/safe/age',database:'socdepoble_node0',socket:'/safe/socket',user:'javi',timeoutMs:1000};
test('native runner has a direct stdout pipe, compressed consistent pg_dump flags and an isolated nonsecret environment',async()=>{
  const fake=fakeSpawn(),run=creaRunnerSnapshot({...SNAP,spawnImpl:fake.run}),out=await run({recipient:RECIPIENT});assert.deepEqual(out.ciphertext,CIPHER);assert.equal(out.encrypted,true);assert.ok(fake.plain().includes('PRIVATE_DB_SENTINEL'));
  assert.deepEqual(fake.calls.find(c=>c.file.endsWith('/age')).args,['--encrypt','--recipient',RECIPIENT]);const args=fake.calls.find(c=>c.file.endsWith('/pg_dump')).args;assert.ok(args.includes('--format=custom'));assert.ok(args.includes('--compress=gzip:6'));assert.ok(args.includes('--no-password'));assert.equal(args.some(v=>v.includes('PGDATA')||v.includes('--file')),false);
  assert.ok(args.includes('--snapshot='+META.snapshotId));assert.deepEqual(out.migrationLedger,LEDGER);assert.equal(Object.isFrozen(out.migrationLedger),true);assert.equal(out.nativeCaptureVerified,false);assert.ok(fake.children.every(c=>c.closed));
  for(const c of fake.calls){assert.equal(c.options.shell,false);assert.equal(c.options.env.PGPASSFILE,'/dev/null');assert.equal('PGPASSWORD'in c.options.env,false);assert.equal('HOME'in c.options.env,false);}
});
test('native runner requires both process exits and bounds timeout/output without logging private stderr',async()=>{
  const fail=fakeSpawn({exit:2});await assert.rejects(creaRunnerSnapshot({...SNAP,spawnImpl:fail.run})({recipient:RECIPIENT}),e=>e.code==='mirror_snapshot_process_failed'&&!e.message.includes('PRIVATE'));
  const timed=fakeSpawn({hang:'dump'});await assert.rejects(creaRunnerSnapshot({...SNAP,timeoutMs:10,spawnImpl:timed.run})({recipient:RECIPIENT}),/timeout/);assert.equal(timed.children.length,3);assert.ok(timed.children.every(c=>c.closed));
  const large=fakeSpawn({large:true});await assert.rejects(creaRunnerSnapshot({...SNAP,maxBytes:64,spawnImpl:large.run})({recipient:RECIPIENT}),/limit/);assert.ok(large.children.every(c=>c.closed));
});

test('R42 capture protocol rejects malformed metadata, duplicate responses and early capture loss without surviving children',async()=>{
  for(const change of[{database:'foreign'},{serverMajor:18},{isolation:'read committed'},{readOnly:false},{migrations:0},{migrations:1.5},{migrationLedgerSha256:'bad'},{snapshotId:'untrusted token'},{extra:true}]){
    const fake=fakeSpawn({metadata:{...META,...change}});await assert.rejects(creaRunnerSnapshot({...SNAP,spawnImpl:fake.run})({recipient:RECIPIENT}),/protocol_invalid/);assert.equal(fake.children.length,1);assert.ok(fake.children.every(c=>c.closed));
  }
  for(const options of[{duplicate:true},{controlLimit:true},{dieCapture:true},{partialTail:true},{ageExit:3},{captureExit:2}]){const fake=fakeSpawn(options);await assert.rejects(creaRunnerSnapshot({...SNAP,spawnImpl:fake.run})({recipient:RECIPIENT}),/mirror_snapshot_/);assert.ok(fake.children.every(c=>c.closed));}
});
test('R42 cancellation waits for owned child close and escalates ignored SIGTERM',async()=>{
  const fake=fakeSpawn({hang:'dump',ignoreTerm:true,closeDelay:5}),started=Date.now();
  await assert.rejects(creaRunnerSnapshot({...SNAP,timeoutMs:20,spawnImpl:fake.run})({recipient:RECIPIENT}),/timeout/);
  assert.ok(Date.now()-started>=250);assert.ok(fake.children.every(c=>c.closed&&c.signals.includes('SIGKILL')));
});
test('R42 actual spawn ENOENT for each process waits for close and reaps every previously created child',async()=>{
  for(const suffix of ['/psql','/age','/pg_dump']){
    const fake=fakeSpawn();let missingClosed=false;
    const spawnImpl=(file,args,options)=>{if(file.endsWith(suffix)){const child=spawn('/TEST_ONLY/r42-no-such-executable'+suffix,args,options);child.once('close',()=>{missingClosed=true;});return child;}return fake.run(file,args,options);};
    await assert.rejects(creaRunnerSnapshot({...SNAP,spawnImpl})({recipient:RECIPIENT}),error=>/^mirror_snapshot_/.test(error.code)&&!error.message.includes('TEST_ONLY'));
    assert.equal(missingClosed,true);assert.ok(fake.children.every(c=>c.closed));
  }
});
test('R45 valid EOF and writable finish may precede a deferred pipeline callback despite interleaved process closes',async()=>{
  const fake=fakeSpawn({interleavedClose:true}),out=await creaRunnerSnapshot({...SNAP,spawnImpl:fake.run})({recipient:RECIPIENT});
  assert.equal(out.completed,true);assert.equal(out.nativeCaptureVerified,false);assert.deepEqual(out.ciphertext,CIPHER);assert.ok(fake.children.every(child=>child.closed));
});
test('R45 three real Node subprocess doubles require a complete pipe as well as all process closes',async t=>{
  const fixture=fileURLToPath(new URL('./fixtures/node0-snapshot-child.mjs',import.meta.url));
  for(const scenario of ['success-control','success-fast-close','success-delayed-dump-close','age-early-zero','age-prefix-zero','dump-open-after-eof','dump-late-error','abort-pipe'])await t.test(scenario,async()=>{
    const owned=[];let pipeAborted=false;
    const spawnImpl=(file,args,options)=>{
      const role=file.endsWith('/psql')?'capture':file.endsWith('/pg_dump')?'dump':'age',child=spawn(process.execPath,[fixture,role,scenario,...args],options),state={role,child,closed:false,exited:false,stdoutEnded:false};owned.push(state);
      child.once('exit',code=>{state.exited=true;state.exitCode=code;});child.once('close',()=>{state.closed=true;});child.stdout.once('end',()=>{state.stdoutEnded=true;});
      if(role==='dump'&&scenario==='abort-pipe')child.stdout.once('data',()=>{pipeAborted=true;child.stdout.destroy(Error('PRIVATE_PIPE_ABORT_SENTINEL'));});
      return child;
    };
    const run=creaRunnerSnapshot({...SNAP,timeoutMs:scenario==='dump-open-after-eof'?500:2000,spawnImpl});
    if(scenario.startsWith('success-')){const out=await run({recipient:RECIPIENT});assert.equal(out.completed,true);assert.equal(out.nativeCaptureVerified,false);}
    else await assert.rejects(run({recipient:RECIPIENT}),error=>/^mirror_snapshot_/.test(error.code)&&(scenario!=='dump-open-after-eof'||error.code==='mirror_snapshot_timeout')&&!error.message.includes('PRIVATE')&&!error.message.includes(META.snapshotId));
    assert.equal(owned.length,3);assert.ok(owned.every(state=>state.closed&&state.exited));
    for(const {child}of owned)assert.throws(()=>process.kill(child.pid,0),error=>error.code==='ESRCH');
    if(scenario==='abort-pipe')assert.equal(pipeAborted,true);
    if(scenario==='dump-open-after-eof'){assert.equal(owned.find(state=>state.role==='dump').stdoutEnded,true);assert.equal(owned.find(state=>state.role==='age').exitCode,0);}
  });
  t.diagnostic('Simulation only: real Node children with deliberately fake PostgreSQL/age semantics; no native database or cryptographic interoperability claim.');
});
test('R42 source ledger validator returns an immutable exact copy and refuses accessor authority',()=>{
  const input={...LEDGER},copy=validaLedgerCapturat(input);input.migrations=1;assert.deepEqual(copy,LEDGER);assert.ok(Object.isFrozen(copy));
  for(const value of[null,{},Object.assign(Object.create(LEDGER),{}),{...LEDGER,verified:true},Object.defineProperty({...LEDGER},'migrations',{get(){throw Error('must not execute');}})])assert.throws(()=>validaLedgerCapturat(value),/mirror_/);
});
test('R42 authenticated manifest binds the captured ledger; semantic validation keeps legacy manual backups readable',async t=>{
  const f=await fixture(t),originalRunner=f.options.runner;
  await exportaMirall({...f.options,apply:true,runner:async input=>({...await originalRunner(input),nativeCaptureVerified:true,verified:true})});
  const pointer=await current(f),generation=path.join(f.mirrorDir,'generacions',pointer.generation),manifestPath=path.join(generation,'MANIFEST.json'),original=JSON.parse(await fs.readFile(manifestPath));
  assert.deepEqual(original.snapshot.migrationLedger,LEDGER);assert.equal(original.snapshot.migrationLedgerCapture.nativeVerified,false);assert.equal(original.snapshot.restoreVerified,false);assert.equal(original.publicSelection.atomicWithDatabaseDump,false);assert.equal(JSON.stringify(original).includes(META.snapshotId),false);
  const originalSums=await fs.readFile(path.join(generation,'SHA256SUMS'),'utf8'),key=await fs.readFile(f.authentication.keyFile);
  const rewrite=async(mutator,authenticate)=>{
    const manifest=structuredClone(original);mutator(manifest);const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n'),sums=Buffer.from(originalSums.replace(/^[a-f0-9]{64} {2}MANIFEST.json$/m,SHA(bytes)+'  MANIFEST.json'));
    await fs.writeFile(manifestPath,bytes);await fs.writeFile(path.join(generation,'SHA256SUMS'),sums);await fs.writeFile(path.join(f.mirrorDir,'CURRENT.json'),JSON.stringify({...pointer,manifestSha256:SHA(bytes),sumsSha256:SHA(sums)}));
    if(authenticate){const mac=createHmac('sha256',key).update(Buffer.concat([Buffer.from('sdp.node0.mirror.authentication.v1\0'),bytes,Buffer.from('\0'),sums])).digest('hex');await fs.writeFile(path.join(generation,'AUTHENTICITY.json'),JSON.stringify({algorithm:'HMAC-SHA256',keyId:f.authentication.keyId,mac,schema:'sdp.node0.mirror.authentication.v1'})+'\n');}
  };
  try{
    await rewrite(m=>{m.snapshot.migrationLedger.migrations++;},false);assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication})).integrityOk,false,'new SHA/pointer cannot replace the trusted MAC');
    for(const mutate of[m=>{m.snapshot.migrationLedger.migrations=0;},m=>{m.snapshot.migrationLedger.migrations=true;},m=>{m.snapshot.migrationLedger.migrationLedgerSha256='bad';},m=>{m.snapshot.migrationLedger.extra=true;},m=>{m.snapshot.migrationLedgerCapture.nativeVerified=true;},m=>{delete m.snapshot.migrationLedgerCapture;},m=>{delete m.snapshot.migrationLedger;delete m.snapshot.migrationLedgerCapture;}]){await rewrite(mutate,true);assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication})).integrityOk,false,'even a valid MAC does not authorize an invalid ledger protocol');}
    await rewrite(m=>{delete m.snapshot.migrationLedger;delete m.snapshot.migrationLedgerCapture;m.snapshot.consistent='pg_dump-transaction';},true);assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication})).integrityOk,true,'legacy metadata remains readable without a native/coherent-source claim');
  }finally{key.fill(0);}
});
test('R42 new publication refuses a missing source ledger and preserves the previous generation on capture failure',async t=>{
  const f=await fixture(t);await exportaMirall({...f.options,apply:true});const pointer=await fs.readFile(path.join(f.mirrorDir,'CURRENT.json')),state=await fs.readFile(path.join(f.stateDir,'workspace-mirror-state.json'));
  for(const runner of[async()=>({ciphertext:CIPHER,completed:true,encrypted:true,format:'pg_dump-custom-gzip-6',encryption:'age-X25519'}),async()=>{throw Error('PRIVATE_CAPTURE_DIAGNOSTIC');}])await assert.rejects(exportaMirall({...f.options,apply:true,generationId:GEN.slice(0,-1)+'0',runner}),e=>/^mirror_snapshot_/.test(e.code)&&!e.message.includes('PRIVATE'));
  assert.deepEqual(await fs.readFile(path.join(f.mirrorDir,'CURRENT.json')),pointer);assert.deepEqual(await fs.readFile(path.join(f.stateDir,'workspace-mirror-state.json')),state);assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication})).integrityOk,true);
});
test('R42 actual PostgreSQL capture SQL reads the source ledger in RR read-only and owns only a shared session lock',{skip:!process.env.SDP_PGLITE_MODULE&&'Set SDP_PGLITE_MODULE for actual PostgreSQL SQL proof'},async t=>{
  const {PGlite}=await import(pathToFileURL(process.env.SDP_PGLITE_MODULE).href),{sentenciesSql}=await import('../tooling/node0/hidrata-postgres-node0.mjs');
  const initial=new PGlite();await initial.exec('CREATE DATABASE socdepoble_node0');const image=await initial.dumpDataDir('none');await initial.close();
  const db=new PGlite({database:'socdepoble_node0',loadDataDir:image}),rows=[{version:'2611070600',file:'2611070600_seed_revisions.sql',sha256:'a'.repeat(64)},{version:'2611011800',file:'2611011800_exportació.sql',sha256:'b'.repeat(64)}];
  try{
    await db.exec('CREATE SCHEMA node0;CREATE TABLE node0.schema_migrations(version text PRIMARY KEY,file text NOT NULL,sha256 text NOT NULL)');for(const row of rows)await db.query('INSERT INTO node0.schema_migrations VALUES($1,$2,$3)',[row.version,row.file,row.sha256]);
    let result;for(const statement of sentenciesSql(SQL_OBRI_CAPTURA_LEDGER))result=await db.exec(statement);
    const captured=result.at(-1).rows[0].json_build_object,expected=SHA([...rows].sort((a,b)=>a.version<b.version?-1:1).map(row=>`${row.version}\t${row.file}\t${row.sha256}`).join('\n'));
    assert.deepEqual(validaLedgerCapturat({migrations:captured.migrations,migrationLedgerSha256:captured.migrationLedgerSha256}),{migrations:2,migrationLedgerSha256:expected});assert.equal(captured.database,'socdepoble_node0');assert.equal(captured.serverMajor,17);assert.equal(captured.isolation,'repeatable read');assert.equal(captured.readOnly,true);assert.match(captured.snapshotId,/^[a-f0-9]+(?:-[a-f0-9]+){2}$/i);
    // PGlite has one backend and exposes advisory pid=NULL (backend_pid=0).
    // The exact two-int lock key remains observable; no multi-backend claim.
    const locks=async()=>await db.query("SELECT mode,granted FROM pg_locks WHERE locktype='advisory' AND classid=1935960372::oid AND objid=1701737586::oid AND objsubid=2");assert.deepEqual((await locks()).rows,[{mode:'ShareLock',granted:true}]);
    await assert.rejects(db.exec("INSERT INTO node0.schema_migrations VALUES('9999999999','forbidden.sql',repeat('0',64))"),error=>error.code==='25006');await db.exec('ROLLBACK');assert.deepEqual((await locks()).rows,[{mode:'ShareLock',granted:true}],'ROLLBACK alone cannot release a session lock');
    assert.equal((await db.query('SELECT pg_advisory_unlock_shared(1935960372,1701737586) AS released')).rows[0].released,true);assert.deepEqual((await locks()).rows,[]);
    t.diagnostic('PGlite PostgreSQL17, one backend: SQL, hash, RR/read-only and shared lock verified; no cross-connection pg_dump/age/native guarantee.');
  }finally{await db.exec('ROLLBACK;SELECT pg_advisory_unlock_all()');await db.close();}
});

test('R8 source roots are closed and sensitive ancestors remain forbidden even if mistakenly reviewed',async t=>{
  const f=await fixture(t);
  await assert.rejects(exportaMirall({...f.options,reviewedSourceRoots:[]}),/root_not_reviewed/);
  for(const part of['dades','.config','.cloudflared','.ssh','Library','logs']){
    const root=path.join(f.base,part,'public');
    f.setMedia([{...f.media,root}]);
    await assert.rejects(exportaMirall({...f.options,reviewedSourceRoots:[{kind:'media',root},{kind:'opendata',root:f.sources}]}),/source_forbidden/);
  }
  assert.equal(f.runs(),0);assert.deepEqual(await fs.readdir(f.mirrorDir),[]);
});
test('R8 database is fixed and LAB database names are rejected before a process starts',()=>{
  for(const database of['node0_gauntlet_r4','LAB','other'])assert.throws(()=>creaRunnerSnapshot({...SNAP,database}),/config_invalid/);
});
test('R8 local pinned authentication is required and altered manifest cannot be blessed by rewritten SHA files',async t=>{
  const f=await fixture(t);
  await assert.rejects(exportaMirall({...f.options,apply:true,authentication:undefined}),/authentication_required/);assert.equal(f.runs(),0);
  await exportaMirall({...f.options,apply:true});
  assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir})).integrityOk,false);
  const g=path.join(f.mirrorDir,'generacions',GEN),manifestPath=path.join(g,'MANIFEST.json');
  const manifest=JSON.parse(await fs.readFile(manifestPath));manifest.cloudUploadedVerified=true;const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');await fs.writeFile(manifestPath,bytes);
  const sumsPath=path.join(g,'SHA256SUMS'),sums=(await fs.readFile(sumsPath,'utf8')).replace(/^[a-f0-9]{64} {2}MANIFEST.json$/m,SHA(bytes)+'  MANIFEST.json');await fs.writeFile(sumsPath,sums);
  const pointer=await current(f);pointer.manifestSha256=SHA(bytes);pointer.sumsSha256=SHA(sums);await fs.writeFile(path.join(f.mirrorDir,'CURRENT.json'),JSON.stringify(pointer));
  assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication})).integrityOk,false);
  assert.equal(await fs.readFile(path.join(g,'AUTHENTICITY.json'),'utf8').then(raw=>JSON.parse(raw).algorithm),'HMAC-SHA256');
});
test('R8 EXDEV during whole-directory publication leaves no partial visible generation and no CURRENT',async t=>{
  const f=await fixture(t),python=await wrappedPython(f,'import errno\noriginal_rename=os.rename\ndef rename(a,b,**kw):\n    if a.startswith("prepare-"): raise OSError(errno.EXDEV,"synthetic cross-device failure")\n    return original_rename(a,b,**kw)\nos.rename=rename');
  await assert.rejects(exportaMirall({...f.options,apply:true,python}),/file_operation_failed/);
  assert.deepEqual(await fs.readdir(path.join(f.mirrorDir,'generacions')),[]);assert.deepEqual(await fs.readdir(path.join(f.mirrorDir,'.staging')),[]);
  await assert.rejects(fs.stat(path.join(f.mirrorDir,'CURRENT.json')),/ENOENT/);
});
test('R8 source-copy gzip content is scanned with the same rules as completed generation bytes',async t=>{
  const f=await fixture(t);const {gzipSync}=await import('node:zlib');const data=gzipSync(Buffer.from('SMTP_FIXTURE=synthetic-only'),{mtime:0});
  await fs.writeFile(path.join(f.sources,'gzip.pdf'),data);f.setMedia([{...f.media,relativePath:'gzip.pdf',canonicalName:'gzip.pdf',sha256:SHA(data),bytes:data.length,mimeType:'application/pdf'}]);
  await assert.rejects(exportaMirall({...f.options,apply:true}),e=>e.code==='mirror_plaintext_secret_marker');assert.equal(f.runs(),0);
});
test('R8 clean clone OpenData fixture is deterministic and generated only from synthetic source',async()=>{
  assert.deepEqual((await exportaMunicipiOpenData(FIXTURE_INPUT)).zip,ZIP);
});

test('R8 postcommit cleanup failure preserves authenticated CURRENT, records success and exposes separate retention failure',async t=>{
  const f=await fixture(t),binary=process.platform==='darwin'?'/Library/Developer/CommandLineTools/usr/bin/python3':'/usr/bin/python3',python=path.join(f.base,'cleanup-failure-python');
  const script=['#!'+binary,'import json,sys,runpy','ns=runpy.run_path(sys.argv[-1],run_name="r8_fixture")','def cleanup_failure(*args,**kwargs):','    raise PermissionError("synthetic cleanup failure")','ns["publish"].__globals__["prune"]=cleanup_failure','try:','    result=ns["main"](json.load(sys.stdin))','    print(json.dumps({"ok":True,"result":result}))','except BaseException:','    print(json.dumps({"ok":False,"error":"mirror_file_operation_failed"}))','    sys.exit(1)',''].join('\n');
  await fs.writeFile(python,script,{mode:0o700});
  const out=await exportaMirall({...f.options,apply:true,python});assert.equal(out.state,'published-local');assert.equal(out.integrityOk,true);assert.equal(out.retentionOk,false);assert.equal(out.retentionCode,'mirror_retention_failed');
  assert.equal((await current(f)).generation,GEN);assert.equal((await inspeccionaMirall({mirrorDir:f.mirrorDir,authentication:f.authentication})).integrityOk,true);
  const state=JSON.parse(await fs.readFile(path.join(f.stateDir,'workspace-mirror-state.json')));assert.equal(state.generation,GEN);assert.equal(state.integrityOk,true);assert.equal(state.retentionOk,false);assert.equal(state.retentionCode,'mirror_retention_failed');
});
