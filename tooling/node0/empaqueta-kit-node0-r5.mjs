#!/usr/bin/env node
/** R5 additive CAS. Baseline verification is native JavaScript, never kit code. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const PINS_R5=Object.freeze({
  r3:Object.freeze({manifest:'cc709422d99a1ed7fc69330810f948fed687d851f12b9ba5fa470ce10a740a60',sums:'9f428d612bfde4d6a83e476d5fde6b2a88557ed78a122d2378130997066a07cf',files:38}),
  r4:Object.freeze({manifest:'4a0224886368516031b9da5ebd3339f15f8221c06795c871a361e74b4ef0932c',sums:'12778b2f0f18c027069aa87cf774bb1ae4d124370ed7a57f85f67e4c3fc2bc56',files:35}),
  verifier:'7cf18ed61180ffb0bbb00d0adb2517fa717b77178d92d9ae03190bce414daf8b'
});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const PYTHON_BINARY=process.platform==='darwin'?'/Library/Developer/CommandLineTools/usr/bin/python3':'/usr/bin/python3';
const fail=code=>{throw new Error(code);};
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const state=value=>value?{sha256:value.sha256,mode:value.mode}:null;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const scope=name=>['src/','tests/','tooling/node0/'].some(prefix=>name.startsWith(prefix))||name==='tooling/tests/node-suite-manifest.json';
function relative(value){
  if(typeof value!=='string'||!value||value.length>4096||value!==value.normalize('NFC')||value.startsWith('/')||value.includes('\\')||/[\p{Cc}\p{Cf}\u2028\u2029]/u.test(value))fail('invalid_path');
  for(const part of value.split('/')){
    const lower=part.toLowerCase();
    if(!part||['.','..'].includes(part)||/[ .]$/.test(part)||/[<>:"|?*]/.test(part)||['.git','node_modules','.node0-kit.lock'].includes(lower)||lower.startsWith('.env')||lower.startsWith('.node0-kit-stage-')||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(part))fail('forbidden_path');
  }
  return value;
}
function pathsUnique(values){
  if(!Array.isArray(values)||!values.length)fail('explicit_unique_paths_required');
  const seen=[];const names=values.map(relative).sort();
  for(const name of names){
    // New delivery names are intentionally ASCII. This also makes portable
    // case-insensitive collision checking exact, without approximating Unicode casefold.
    if(!/^[\x20-\x7e]+$/.test(name)||!scope(name))fail('scope_rejected');const key=name.toLowerCase();
    if(seen.some(previous=>key===previous||key.startsWith(previous+'/')||previous.startsWith(key+'/')))fail('overlapping_or_duplicate_paths');seen.push(key);
  }
  return names;
}
function rootDirectory(value){
  if(typeof value!=='string'||!value)fail('explicit_root_required');let absolute=path.resolve(value);
  if(process.platform==='darwin')for(const[alias,actual]of[['/tmp','/private/tmp'],['/var','/private/var']])if(absolute===alias||absolute.startsWith(alias+'/')){let target;try{target=fs.readlinkSync(alias);}catch{continue;}if([actual,actual.slice(1)].includes(target))absolute=actual+absolute.slice(alias.length);}
  let cursor=path.parse(absolute).root;for(const part of absolute.slice(cursor.length).split('/').filter(Boolean)){cursor=path.join(cursor,part);const info=fs.lstatSync(cursor);if(info.isSymbolicLink()||!info.isDirectory())fail('root_non_directory_or_symlink');}
  return absolute;
}
function inspect(root,name){
  relative(name);rootDirectory(root);let cursor=root;const parts=name.split('/');
  for(const[index,part]of parts.entries()){
    cursor=path.join(cursor,part);let info;try{info=fs.lstatSync(cursor);}catch(error){if(error.code==='ENOENT')return null;throw error;}
    if(info.isSymbolicLink())fail('source_symlink');
    if(index<parts.length-1){if(!info.isDirectory())fail('source_non_directory');continue;}
    if(!info.isFile()||info.nlink!==1||info.size>32*1024*1024||(info.mode&0o7000))fail('source_non_regular');
    const fd=fs.openSync(cursor,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
    try{
      const before=fs.fstatSync(fd);if(!before.isFile()||before.nlink!==1||before.size>32*1024*1024||before.dev!==info.dev||before.ino!==info.ino)fail('source_changed_during_read');
      const data=fs.readFileSync(fd),after=fs.fstatSync(fd),leaf=fs.lstatSync(cursor);
      if(before.dev!==after.dev||before.ino!==after.ino||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs||after.dev!==leaf.dev||after.ino!==leaf.ino||leaf.isSymbolicLink()||leaf.nlink!==1)fail('source_changed_during_read');
      return{data,sha256:sha(data),mode:after.mode&0o777};
    }finally{fs.closeSync(fd);}
  }
  fail('invalid_path');
}
function inventory(root){
  const files=[],directories=[];rootDirectory(root);
  const walk=(folder,prefix='')=>{for(const name of fs.readdirSync(folder).sort()){
    const rel=relative(prefix+name),absolute=path.join(folder,name),info=fs.lstatSync(absolute);
    if(info.isSymbolicLink())fail('inventory_non_regular');
    if(info.isDirectory()){directories.push({path:rel,mode:info.mode&0o777});walk(absolute,rel+'/');}
    else{const entry=inspect(root,rel);if(!entry)fail('inventory_disappeared');files.push({path:rel,...entry});}
  }};walk(root);return{files,directories};
}
const snapshot=tree=>({directories:tree.directories,files:tree.files.map(file=>({path:file.path,...state(file)}))});
const validState=value=>value===null||plain(value)&&same(Object.keys(value).sort(),['mode','sha256'])&&/^[a-f0-9]{64}$/.test(value.sha256)&&Number.isInteger(value.mode)&&value.mode>=0&&value.mode<=0o777;
function validateKit(root,kind){
  const pin=PINS_R5[kind],manifestBytes=inspect(root,'MANIFEST.json'),sums=inspect(root,'SHA256SUMS'),verifier=inspect(root,'verifica_i_aplica.py');
  if(manifestBytes?.sha256!==pin.manifest||sums?.sha256!==pin.sums)fail(kind+'_baseline_pin_failed');
  if(verifier?.sha256!==PINS_R5.verifier||verifier.mode!==0o755)fail(kind+'_verifier_pin_failed');
  // Parse captured authenticated bytes. No second path read is used as input.
  let manifest;try{manifest=JSON.parse(manifestBytes.data.toString('utf8'));}catch{fail(kind+'_manifest_invalid');}
  if(!plain(manifest)||manifest.schema!=='sdp.node0.cas.v1'||!Array.isArray(manifest.files)||manifest.files.length!==pin.files)fail(kind+'_manifest_invalid');
  const tree=inventory(root),actual=new Map(tree.files.map(file=>[file.path,file])),entries=new Map(),foldedNames=new Set();
  for(const line of sums.data.toString('utf8').trimEnd().split('\n')){
    const match=/^([a-f0-9]{64}) {2}(.+)$/.exec(line);if(!match)fail(kind+'_checksums_invalid');const name=relative(match[2]),key=name.toLowerCase();
    if(name==='SHA256SUMS'||entries.has(name)||foldedNames.has(key))fail(kind+'_checksums_duplicate');entries.set(name,match[1]);foldedNames.add(key);
  }
  if(actual.size!==entries.size+1||!['MANIFEST.json','verifica_i_aplica.py','README_INTEGRACIO.md'].every(name=>entries.has(name)))fail(kind+'_inventory_mismatch');
  for(const[name,digest]of entries)if(actual.get(name)?.sha256!==digest)fail(kind+'_integrity_mismatch');
  if(!same(state(actual.get('MANIFEST.json')),state(manifestBytes))||!same(state(actual.get('SHA256SUMS')),state(sums))||!same(state(actual.get('verifica_i_aplica.py')),state(verifier)))fail(kind+'_changed_during_validation');
  pathsUnique(manifest.files.map(file=>file.path));
  for(const file of manifest.files){
    if(!plain(file)||!same(Object.keys(file).sort(),['after','before','path'])||!validState(file.before)||!validState(file.after)||file.after===null)fail(kind+'_manifest_state_invalid');
    if(!same(state(actual.get('fitxers/'+file.path)),file.after)||!same(state(actual.get('preimatges/'+file.path)),file.before))fail(kind+'_payload_or_preimage_mismatch');
  }
  return{root,manifest,verifier,tree,snapshot:snapshot(tree)};
}
function baseline({baseRoot,r3Root,r4Root}){
  const base=rootDirectory(baseRoot),r3=validateKit(rootDirectory(r3Root),'r3'),r4=validateKit(rootDirectory(r4Root),'r4'),fold=new Map();
  for(const file of r3.manifest.files)fold.set(file.path,file.after);
  for(const file of r4.manifest.files){if(!same(fold.get(file.path)??null,file.before))fail('r4_fold_preimage_inconsistent');fold.set(file.path,file.after);}
  if(fold.size!==61)fail('baseline_fold_count_invalid');
  const checkBase=()=>{for(const[name,expected]of fold)if(!same(state(inspect(base,name)),expected))fail('r5_base_postimage_drift');};checkBase();
  const recheck=()=>{checkBase();for(const kit of[r3,r4])if(!same(snapshot(inventory(kit.root)),kit.snapshot))fail('baseline_kit_changed_during_package');};
  return{base,r3,r4,fold,recheck};
}
export function comprovaBaseR5(options){
  const checked=baseline(options);checked.recheck();return{write:false,files:checked.fold.size,foldSha256:sha(JSON.stringify([...checked.fold].sort(([a],[b])=>a<b?-1:a>b?1:0))),baseline:PINS_R5};
}
function write(root,name,data,mode=0o644){
  relative(name);const destination=path.join(root,name);fs.mkdirSync(path.dirname(destination),{recursive:true});const fd=fs.openSync(destination,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,mode);
  try{fs.writeFileSync(fd,data);fs.fchmodSync(fd,mode);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
}
function evidenceAt(dest){
  let info;try{info=fs.lstatSync(dest);}catch(error){if(error.code==='ENOENT')return null;throw error;}
  if(!info.isDirectory()||info.isSymbolicLink()||fs.readdirSync(dest).some(name=>name!=='evidencies'))fail('delivery_already_sealed');const tree=inventory(dest);if(tree.files.some(file=>!file.path.startsWith('evidencies/')))fail('delivery_already_sealed');tree.identity={dev:info.dev,ino:info.ino};return tree;
}
// Trusted publisher, separate from both input-kit verifiers. openat/dir_fd
// keeps every output write under the pinned directory even after a path swap.
const PUBLISH=String.raw`
# R5_SAFE_PUBLISH
import os,sys,stat,json,hashlib
DIR=os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW
def bad(code):raise RuntimeError(code)
def root(value):
    fd=os.open('/',DIR)
    try:
        for part in value.split('/')[1:]:
            child=os.open(part,DIR,dir_fd=fd);os.close(fd);fd=child
        return fd
    except BaseException:os.close(fd);raise
def relative(value):
    if not isinstance(value,str) or not value or value.startswith('/') or '\\' in value or any(p in ('','.','..') for p in value.split('/')):bad('publish_invalid_path')
    return value
def parent(fd,name):
    parts=relative(name).split('/');current=os.dup(fd)
    try:
        for part in parts[:-1]:
            child=os.open(part,DIR,dir_fd=current);os.close(current);current=child
        return current,parts[-1]
    except BaseException:os.close(current);raise
def read(fd,name):
    holder,leaf=parent(fd,name)
    try:
        file=os.open(leaf,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK,dir_fd=holder)
        try:
            info=os.fstat(file)
            if not stat.S_ISREG(info.st_mode) or info.st_nlink!=1 or info.st_size>33554432:bad('publish_non_regular')
            with os.fdopen(os.dup(file),'rb') as stream:data=stream.read(33554433)
            after=os.fstat(file)
            if len(data)>33554432 or (info.st_dev,info.st_ino,info.st_size,info.st_mtime_ns,info.st_ctime_ns)!=(after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns,after.st_ctime_ns):bad('publish_read_drift')
            return data,{'sha256':hashlib.sha256(data).hexdigest(),'mode':stat.S_IMODE(info.st_mode)}
        finally:os.close(file)
    finally:os.close(holder)
def expected(value):return ({f['path']:{'sha256':f['sha256'],'mode':f['mode']} for f in value['files']},{d['path']:d['mode'] for d in value['directories']})
def inventory(fd,prefix=''):
    files={};directories={}
    for name in os.listdir(fd):
        full=relative(prefix+name);info=os.stat(name,dir_fd=fd,follow_symlinks=False)
        if stat.S_ISDIR(info.st_mode):
            child=os.open(name,DIR,dir_fd=fd)
            try:
                directories[full]=stat.S_IMODE(info.st_mode);a,b=inventory(child,full+'/');files.update(a);directories.update(b)
            finally:os.close(child)
        elif stat.S_ISREG(info.st_mode) and info.st_nlink==1:
            # prefix belongs to fd's ancestors, so read the local leaf only.
            files[full]=read(fd,name)[1]
        else:bad('publish_non_regular')
    return files,directories
def same_name(parentfd,name,held):
    current=os.open(name,DIR,dir_fd=parentfd)
    try:
        a,b=os.fstat(current),os.fstat(held)
        if (a.st_dev,a.st_ino)!=(b.st_dev,b.st_ino):bad('publish_root_drift')
    finally:os.close(current)
def exclusive(fd,name,data,mode):
    holder,leaf=parent(fd,name)
    try:
        file=os.open(leaf,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,mode,dir_fd=holder)
        with os.fdopen(file,'wb') as stream:stream.write(data);stream.flush();os.fchmod(stream.fileno(),mode);os.fsync(stream.fileno())
    finally:os.close(holder)
base=stage=dest=None
try:
    value=json.load(sys.stdin);base=root(value['parent']);baseinfo=os.fstat(base)
    if (baseinfo.st_dev,baseinfo.st_ino)!=(value['parentIdentity']['dev'],value['parentIdentity']['ino']):bad('publish_parent_drift')
    stage=os.open(value['stage'],DIR,dir_fd=base);stageinfo=os.fstat(stage)
    if (stageinfo.st_dev,stageinfo.st_ino)!=(value['stageIdentity']['dev'],value['stageIdentity']['ino']):bad('publish_stage_drift')
    wanted=expected(value['snapshot'])
    if inventory(stage)!=wanted:bad('publish_stage_drift')
    if value['evidence'] is None:
        os.mkdir(value['destination'],0o700,dir_fd=base);dest=os.open(value['destination'],DIR,dir_fd=base);existing=({}, {})
    else:
        dest=os.open(value['destination'],DIR,dir_fd=base);info=os.fstat(dest);identity=value['evidence']['identity']
        if (info.st_dev,info.st_ino)!=(identity['dev'],identity['ino']):bad('publish_root_drift')
        existing=expected(value['evidence'])
        if inventory(dest)!=existing:bad('publish_evidence_drift')
    for name,mode in sorted(wanted[1].items(),key=lambda item:(item[0].count('/'),item[0])):
        same_name(base,value['destination'],dest)
        if name in existing[1]:continue
        holder,leaf=parent(dest,name)
        try:
            os.mkdir(leaf,mode,dir_fd=holder);child=os.open(leaf,DIR,dir_fd=holder)
            try:os.fchmod(child,mode)
            finally:os.close(child)
        finally:os.close(holder)
    for name in sorted(wanted[0]):
        if name in existing[0] or name=='SHA256SUMS':continue
        same_name(base,value['destination'],dest);same_name(base,value['stage'],stage)
        data,found=read(stage,name)
        if found!=wanted[0][name]:bad('publish_stage_drift')
        exclusive(dest,name,data,found['mode'])
    same_name(base,value['destination'],dest)
    if inventory(dest)!=({k:v for k,v in wanted[0].items() if k!='SHA256SUMS'},wanted[1]):bad('publish_evidence_drift')
    data,found=read(stage,'SHA256SUMS')
    if found!=wanted[0]['SHA256SUMS']:bad('publish_stage_drift')
    exclusive(dest,'SHA256SUMS',data,found['mode']);os.fsync(dest);os.fsync(base)
    same_name(base,value['destination'],dest)
    if inventory(dest)!=wanted:bad('publish_final_drift')
    print(json.dumps({'files':len(wanted[0])}))
except BaseException as error:
    sys.stderr.write((str(error) if isinstance(error,RuntimeError) else 'publish_refused')+'\n');sys.exit(1)
finally:
    for fd in (dest,stage,base):
        if fd is not None:os.close(fd)
`;
function publish(parent,stage,dest,evidence,tree){
  const parentInfo=fs.lstatSync(parent),stageInfo=fs.lstatSync(stage);
  const input={parent,parentIdentity:{dev:parentInfo.dev,ino:parentInfo.ino},stage:path.basename(stage),stageIdentity:{dev:stageInfo.dev,ino:stageInfo.ino},destination:path.basename(dest),evidence:evidence?{...snapshot(evidence),identity:evidence.identity}:null,snapshot:snapshot(tree)};
  const result=spawnSync(PYTHON_BINARY,['-I','-B','-c',PUBLISH],{input:JSON.stringify(input),encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
  if(result.status!==0)fail(/^publish_[a-z_]+\n$/.test(result.stderr??'')?result.stderr.trim():'publish_failed');
  let response;try{response=JSON.parse(result.stdout);}catch{fail('publish_protocol_invalid');}if(response.files!==tree.files.length)fail('publish_protocol_invalid');
}
export function empaquetaR5({candidateRoot,baseRoot,r3Root,r4Root,kitRoot,paths}){
  const checked=baseline({baseRoot,r3Root,r4Root}),candidate=rootDirectory(candidateRoot),names=pathsUnique(paths);
  if(typeof kitRoot!=='string'||!kitRoot)fail('explicit_kit_required');const requested=path.resolve(kitRoot),parent=rootDirectory(path.dirname(requested)),dest=path.join(parent,path.basename(requested));
  if([candidate,checked.base,checked.r3.root,checked.r4.root].some(root=>dest===root||dest.startsWith(root+'/')||root.startsWith(dest+'/')))fail('external_kit_required');
  const evidence=evidenceAt(dest),verifier=inspect(candidate,'tooling/node0/verifica_kit_node0.py');if(verifier?.sha256!==PINS_R5.verifier)fail('candidate_verifier_pin_failed');
  const files=names.map(name=>{
    const before=inspect(checked.base,name),after=inspect(candidate,name);if(!after)fail('candidate_missing');
    if(!same(state(before),checked.fold.get(name)??null))fail('r5_preimage_outside_fold_or_drift');
    if(same(state(before),state(after)))fail('unchanged_payload');return{path:name,before,after};
  });
  const stage=fs.mkdtempSync(path.join(parent,'.node0-r5-stage-'));
  for(const directory of evidence?.directories??[]){const target=path.join(stage,directory.path);fs.mkdirSync(target,{recursive:true,mode:directory.mode});fs.chmodSync(target,directory.mode);}
  for(const item of evidence?.files??[])write(stage,item.path,item.data,item.mode);
  const manifest={schema:'sdp.node0.cas.v1',name:'261104_kit_codex_node0_postgres_i_mastodon_r5',baseline:{r3:{manifestSha256:PINS_R5.r3.manifest,checksumsSha256:PINS_R5.r3.sums},r4:{manifestSha256:PINS_R5.r4.manifest,checksumsSha256:PINS_R5.r4.sums},foldedFiles:61},files:files.map(file=>({path:file.path,before:state(file.before),after:state(file.after)}))};
  const patches=[];
  for(const file of files){
    write(stage,'fitxers/'+file.path,file.after.data,file.after.mode);if(file.before)write(stage,'preimatges/'+file.path,file.before.data,file.before.mode);
    const diff=spawnSync('/usr/bin/diff',['-u','--label',file.before?'a/'+file.path:'/dev/null','--label','b/'+file.path,file.before?path.join(stage,'preimatges',file.path):'/dev/null',path.join(stage,'fitxers',file.path)],{encoding:'utf8',maxBuffer:4*1024*1024});if(![0,1].includes(diff.status))fail('diff_failed');patches.push(diff.stdout);
  }
  write(stage,'MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');write(stage,'pegats/node0.patch',patches.join(''));write(stage,'verifica_i_aplica.py',verifier.data,0o755);
  write(stage,'README_INTEGRACIO.md',`# Node 0 · delta CAS R5\n\nBase obligatòria: les 61 postimatges resultants de R3 + R4, no l’arbre anterior ni només R3. Abans d’aplicar, usa el generador revisat amb \`--check-base --base /copia --r3 /kit-r3 --r4 /kit-r4\`: és només lectura i comprova íntegrament els dos kits fixats i les 61 postimatges. El verificador R3 per separat pot fallar legítimament després de R4, perquè R4 substituïx 12 fitxers.\n\nPins R3: MANIFEST ${PINS_R5.r3.manifest}; SHA256SUMS ${PINS_R5.r3.sums}. Pins R4: MANIFEST ${PINS_R5.r4.manifest}; SHA256SUMS ${PINS_R5.r4.sums}. Verificador universal: ${PINS_R5.verifier}. El generador no executa cap verificador dels kits: valida bytes, inventari, modes i checksums amb JavaScript.\n\nEl camp baseline del manifest és informatiu per a l’aplicador universal: el seu CAS comprova NOMÉS les rutes del delta. No exigix les altres postimatges de R3/R4; la porta \`--check-base\` és una precondició d’operador separada. Repetiu-la abans de l’aplicació sobre la còpia autoritzada.\n\nRevisió sense escriptura: \`python3 verifica_i_aplica.py --target /copia\`. Afegiu \`--apply\` per aplicar. Repetició idempotent; \`--rollback\` comprova la reversió i \`--rollback --apply\` la fa. Restaura exclusivament les preimatges R3+R4 del delta, no bases SQL, serveis, secrets o desplegaments. El lock és cooperatiu; les substitucions per fitxer i la reversió d’errors capturats no són una transacció davant SIGKILL o tall elèctric.\n\nEste kit és una entrega de codi revisable. No activeu automàticament sessions, ingress o publicacions remotes per aplicar fitxers. Les evidències han de distingir laboratori, PostgreSQL natiu, prova criptogràfica i entrega remota; \`remoteInteropVerified\` continua fals mentre no hi ha acceptació remota acreditada. No acredita els 32 mètodes obligatoris ni els 126 opcionals complets.\n\nLes fonts i evidències s’han de congelar durant l’empaquetat. Els checksums són integritat, no autoria: contrasteu els pins per un canal independent. Un destí ja segellat es refusa; no s’actualitza in situ.\n`);
  const stageBefore=inventory(stage);write(stage,'SHA256SUMS',stageBefore.files.map(file=>`${file.sha256}  ${file.path}\n`).join(''));
  checked.recheck();for(const file of files)if(!same(state(inspect(checked.base,file.path)),state(file.before))||!same(state(inspect(candidate,file.path)),state(file.after)))fail('source_changed_during_package');
  if(!same(state(inspect(candidate,'tooling/node0/verifica_kit_node0.py')),state(verifier)))fail('candidate_verifier_changed_during_package');
  const evidenceNow=evidenceAt(dest);if(!same(evidence? snapshot(evidence):null,evidenceNow? snapshot(evidenceNow):null))fail('evidence_changed_during_package');
  const stageAfter=inventory(stage);if(!same(snapshot(stageBefore),snapshot({directories:stageAfter.directories,files:stageAfter.files.filter(file=>file.path!=='SHA256SUMS')})))fail('stage_changed_during_package');
  publish(parent,stage,dest,evidence,stageAfter);
  const final=inventory(dest);if(!same(snapshot(final),snapshot(stageAfter)))fail('delivery_changed_after_publish');
  return{kit:dest,files:files.length,baselineFiles:61,manifestSha256:inspect(dest,'MANIFEST.json').sha256,checksumsSha256:inspect(dest,'SHA256SUMS').sha256};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{
    const options={},keys={'--candidate':'candidateRoot','--base':'baseRoot','--r3':'r3Root','--r4':'r4Root','--kit':'kitRoot','--paths-file':'pathsFile'};let check=false;const args=process.argv.slice(2);
    for(let index=0;index<args.length;index++){if(args[index]==='--check-base'){if(check)fail('invalid_cli');check=true;continue;}const key=keys[args[index]];if(!key||options[key]!==undefined||!args[index+1]||args[index+1].startsWith('--'))fail('invalid_cli');options[key]=args[++index];}
    if(check){if(Object.keys(options).some(key=>!['baseRoot','r3Root','r4Root'].includes(key)))fail('invalid_cli');process.stdout.write(JSON.stringify(comprovaBaseR5(options))+'\n');}
    else{if(!options.pathsFile)fail('explicit_paths_file_required');options.paths=JSON.parse(fs.readFileSync(options.pathsFile,'utf8'));process.stdout.write(JSON.stringify(empaquetaR5(options))+'\n');}
  }catch(error){process.stderr.write((error?.message??'r5_package_failed')+'\n');process.exitCode=1;}
}
