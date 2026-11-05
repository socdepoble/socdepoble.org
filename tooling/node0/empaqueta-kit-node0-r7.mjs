#!/usr/bin/env node
/** R7 Workspace activation CAS, derived from reviewed R6 FD staging/publisher.
 * Sealed R3/R4/R5/R6 inputs are authenticated in JavaScript, never executed. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const PINS_R7=Object.freeze({
  r3:Object.freeze({manifest:'cc709422d99a1ed7fc69330810f948fed687d851f12b9ba5fa470ce10a740a60',sums:'9f428d612bfde4d6a83e476d5fde6b2a88557ed78a122d2378130997066a07cf',files:38}),
  r4:Object.freeze({manifest:'4a0224886368516031b9da5ebd3339f15f8221c06795c871a361e74b4ef0932c',sums:'12778b2f0f18c027069aa87cf774bb1ae4d124370ed7a57f85f67e4c3fc2bc56',files:35}),
  r5:Object.freeze({manifest:'61f58c8567877a49991c78aded75d11e0c4dcb0ace6831239ea50e7039666ba6',sums:'2a7dd66ddc507a608b48ec0d2fe3e4756789785f8095aa157badae98d5d33a84',files:46}),
  r6:Object.freeze({manifest:'425f50d147442ad38eaa0ac2e03c2ee87ad8c1760e2b782a151bb097effdc906',sums:'5e690e0241e0913015b50d66a145df719083d0569af8c3264aa06e57948ef17e',files:75}),
  verifier:'7cf18ed61180ffb0bbb00d0adb2517fa717b77178d92d9ae03190bce414daf8b'
});
// Independent, reviewed preimage authority. A caller cannot add pins by JSON.
export const EXTRA_PREIMAGE_PINS_R7=Object.freeze({
  'src/data/contracte.js':Object.freeze({sha256:'d6229505f6aa4f0c09783e01f27dfc338b8f44b998ae3cdb81886f0b34171b5f',mode:0o644}),
  'src/data/conformitat/kit.js':Object.freeze({sha256:'bc19591210599295764814bff64c5b7332f95967bdf09c1bf5c9ed242de3f1f8',mode:0o644}),
  'src/data/local/adaptadorLocal.js':Object.freeze({sha256:'b4d5b5b27c12c74755797bdbf862ab83d6ff732a88141b045723b957a906a0a5',mode:0o644}),
  'src/data/local/adaptadorLocal.test.js':Object.freeze({sha256:'c34021663a8ea49c62e90ca7ea53d19de4df7208e92a1e94a5568b4e9f003c3f',mode:0o644}),
  'src/data/local/adaptadorLocal.multipoble.test.js':Object.freeze({sha256:'c555a7125200573f7cee47d78362f98bfe05523df57cc68812306bda237a07c3',mode:0o600}),
  'src/data/local/adaptadorLocal.conformitat.test.js':Object.freeze({sha256:'09ba0a3dff4131fa4c18f26c3fc86ba4c79a6da94437473a5d9b2875189c612b',mode:0o644}),
  'src/data/conformitat/kit.test.js':Object.freeze({sha256:'cea16683c3a1e4c419c8beb685268563105e5b16bc226857aca7c97664caf671',mode:0o644}),
  'src/data/contracte.test.js':Object.freeze({sha256:'774611e5695643b2adafb5a06f7f08e00bd63bd0b5194910fe39a2790046e7ca',mode:0o644}),
  'src/data/localXat.silenci.test.js':Object.freeze({sha256:'0183f7d42ec3dccb4d879764174113bda7d835e8627ec37eda6e55d0c5cc5b34',mode:0o644})
});
export const RESOLVER_PREIMAGE_PINS_R7=Object.freeze({
  'tooling/node0/resolutor-mirall-institucional.mjs':Object.freeze({sha256:'5d552e619309d38650a0ee8efa6c9197dc15814405552a45a6bd14dc13f92fd3',mode:0o644}),
  'tooling/node0/sonda-directori-institucional.py':Object.freeze({sha256:'97149cdba27a1cb526a620d6b8b940181829b80dd5b017aa933310e708b9aeb5',mode:0o644}),
  'tests/node0-workspace-resolver.test.mjs':Object.freeze({sha256:'db6c453294e190fc06981393158a80294b2d98154ed2f539e7e20ff7270887e1',mode:0o644})
});
export const EXISTING_PREIMAGE_PINS_R7=Object.freeze({...RESOLVER_PREIMAGE_PINS_R7,
  'tooling/tests/node-suite-manifest.json':Object.freeze({sha256:'a402fd3e4071901f9265f7b2e5ec08a4ad5a19b71773df8b71cdd3010cf82b00',mode:0o644}),
  'tooling/node0/servidor-node0-soberania.mjs':Object.freeze({sha256:'6c4b1716c518e76d6cc064ddb054516022ad2a88c6ddbec0a841e94381ce3479',mode:0o644}),
  'tooling/node0/resiliencia-node0.mjs':Object.freeze({sha256:'9a77d5180c2e371bd729fb792441bdfe0bf5a7174b89f3f00e0dbd9068f6700a',mode:0o644}),
  'tests/node0-resilience.test.mjs':Object.freeze({sha256:'b0ea6b6f833842a36f2e3c8a71a6b41376294e21a63500c2a370b397585d24e8',mode:0o644})
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
  const files=[],directories=[];let totalBytes=0;rootDirectory(root);
  const walk=(folder,prefix='')=>{if(prefix.split('/').length>64)fail('inventory_depth_limit');for(const name of fs.readdirSync(folder).sort()){
    const rel=relative(prefix+name),absolute=path.join(folder,name),info=fs.lstatSync(absolute);
    if(info.isSymbolicLink())fail('inventory_non_regular');
    if(info.isDirectory()){if(directories.length>=4096)fail('inventory_file_limit');directories.push({path:rel,mode:info.mode&0o777});walk(absolute,rel+'/');}
    else{if(files.length>=4096||totalBytes+info.size>256*1024*1024)fail('inventory_resource_limit');const entry=inspect(root,rel);if(!entry)fail('inventory_disappeared');totalBytes+=entry.data.length;if(totalBytes>256*1024*1024)fail('inventory_resource_limit');files.push({path:rel,...entry});}
  }};walk(root);return{files,directories};
}
const byPath=(a,b)=>a.path<b.path?-1:a.path>b.path?1:0;
const snapshot=tree=>({directories:[...tree.directories].sort(byPath),files:tree.files.map(file=>({path:file.path,...state(file)})).sort(byPath)});
const validState=value=>value===null||plain(value)&&same(Object.keys(value).sort(),['mode','sha256'])&&/^[a-f0-9]{64}$/.test(value.sha256)&&Number.isInteger(value.mode)&&value.mode>=0&&value.mode<=0o777;
function validateKit(root,kind){
  const pin=PINS_R7[kind],manifestBytes=inspect(root,'MANIFEST.json'),sums=inspect(root,'SHA256SUMS'),verifier=inspect(root,'verifica_i_aplica.py');
  if(manifestBytes?.sha256!==pin.manifest||sums?.sha256!==pin.sums)fail(kind+'_baseline_pin_failed');
  if(verifier?.sha256!==PINS_R7.verifier||verifier.mode!==0o755)fail(kind+'_verifier_pin_failed');
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
function validateOptions(options,allowed){
  if(!plain(options))fail('invalid_options');
  for(const key of Reflect.ownKeys(options)){const d=Object.getOwnPropertyDescriptor(options,key);if(typeof key!=='string'||!allowed.includes(key)||!d?.enumerable||!Object.hasOwn(d,'value'))fail('invalid_options');}
}
function baseline({baseRoot,r3Root,r4Root,r5Root,r6Root}){
  const base=rootDirectory(baseRoot),r3=validateKit(rootDirectory(r3Root),'r3'),r4=validateKit(rootDirectory(r4Root),'r4'),r5=validateKit(rootDirectory(r5Root),'r5'),r6=validateKit(rootDirectory(r6Root),'r6'),fold=new Map();
  for(const file of r3.manifest.files)fold.set(file.path,file.after);
  for(const kit of [r4,r5])for(const file of kit.manifest.files){if(!same(fold.get(file.path)??null,file.before))fail((kit===r4?'r4':'r5')+'_fold_preimage_inconsistent');fold.set(file.path,file.after);}
  if(fold.size!==86)fail('pre_r6_baseline_fold_count_invalid');
  for(const[name,pin]of Object.entries(EXTRA_PREIMAGE_PINS_R7)){if(fold.has(name))fail('extra_preimage_overlaps_fold');fold.set(name,pin);}
  if(fold.size!==95)fail('pre_r6_baseline_count_invalid');
  for(const file of r6.manifest.files){if(!same(fold.get(file.path)??null,file.before))fail('r6_fold_preimage_inconsistent');fold.set(file.path,file.after);}
  if(fold.size!==139)fail('r7_baseline_fold_count_invalid');
  for(const[name,pin]of Object.entries(EXISTING_PREIMAGE_PINS_R7))if(!same(fold.get(name),pin))fail('r7_resolver_authority_mismatch');
  const approved=new Map(fold);
  const checkBase=()=>{for(const[name,expected]of approved)if(!same(state(inspect(base,name)),expected))fail('r7_base_postimage_drift');};checkBase();
  const recheck=()=>{checkBase();for(const kit of[r3,r4,r5,r6])if(!same(snapshot(inventory(kit.root)),kit.snapshot))fail('baseline_kit_changed_during_package');};
  return{base,r3,r4,r5,r6,fold,approved,recheck};
}
export function comprovaBaseR7(options){
  validateOptions(options,['baseRoot','r3Root','r4Root','r5Root','r6Root']);
  const checked=baseline(options);checked.recheck();return{write:false,files:checked.approved.size,preR6FoldedFiles:86,preR6ExtraFiles:9,r6NewFiles:44,foldSha256:sha(JSON.stringify([...checked.fold].sort(([a],[b])=>a<b?-1:a>b?1:0))),resolverPreimages:RESOLVER_PREIMAGE_PINS_R7,existingPreimages:EXISTING_PREIMAGE_PINS_R7,baseline:PINS_R7};
}

function evidenceAt(dest){
  let info;try{info=fs.lstatSync(dest);}catch(error){if(error.code==='ENOENT')return null;throw error;}
  if(!info.isDirectory()||info.isSymbolicLink()||fs.readdirSync(dest).some(name=>name!=='evidencies'))fail('delivery_already_sealed');const tree=inventory(dest);if(tree.files.some(file=>!file.path.startsWith('evidencies/')))fail('delivery_already_sealed');tree.identity={dev:info.dev,ino:info.ino};return tree;
}
// Trusted publisher, separate from both input-kit verifiers. openat/dir_fd
// keeps every output write under the pinned directory even after a path swap.
const FD_COMMON=String.raw`
import os,sys,stat,json,hashlib,base64,resource,secrets,signal,subprocess
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

`;
const STAGE=FD_COMMON+String.raw`
# R7_SAFE_STAGE
MAX_FILES=4096
MAX_BYTES=268435456
MAX_PATCH=4194304
def mkdirs(fd,name):
    current=os.dup(fd)
    try:
        for part in relative(name).split('/'):
            try:os.mkdir(part,0o755,dir_fd=current)
            except FileExistsError:pass
            child=os.open(part,DIR,dir_fd=current);os.close(current);current=child
        return current
    except BaseException:os.close(current);raise
def ensure_parent(fd,name):
    if '/' in name:
        holder=mkdirs(fd,name.rsplit('/',1)[0]);os.close(holder)
def leaf_fd(fd,name):
    holder,leaf=parent(fd,name)
    try:return os.open(leaf,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK,dir_fd=holder)
    finally:os.close(holder)
def diff_limit():
    resource.setrlimit(resource.RLIMIT_FSIZE,(MAX_PATCH+1,MAX_PATCH+1))
    resource.setrlimit(resource.RLIMIT_CPU,(10,10))
def terminated(signum,frame):bad('stage_timeout')
signal.signal(signal.SIGTERM,terminated)
base=stage=None
try:
    raw=sys.stdin.buffer.read(402653185)
    if len(raw)>402653184:bad('stage_input_limit')
    value=json.loads(raw);items=value['files'];directories=value['directories'];changes=value['changes']
    if not isinstance(items,list) or len(items)>MAX_FILES:bad('stage_file_limit')
    total=0;names=set();prepared=[]
    for item in items:
        name=relative(item['path']);mode=item['mode']
        if name in names or not isinstance(mode,int) or mode<0 or mode>0o777:bad('stage_invalid_entry')
        names.add(name);data=base64.b64decode(item['data'],validate=True);total+=len(data)
        if len(data)>33554432 or total>MAX_BYTES:bad('stage_byte_limit')
        prepared.append((name,data,mode))
    if len(directories)>MAX_FILES or len(changes)>512:bad('stage_file_limit')
    for item in directories:
        relative(item['path'])
        if not isinstance(item['mode'],int) or item['mode']<0 or item['mode']>0o777:bad('stage_invalid_entry')
    for item in changes:
        relative(item['path'])
        if 'fitxers/'+item['path'] not in names or (item['before'] and 'preimatges/'+item['path'] not in names):bad('stage_invalid_entry')
    base=root(value['parent']);info=os.fstat(base)
    if (info.st_dev,info.st_ino)!=(value['parentIdentity']['dev'],value['parentIdentity']['ino']):bad('stage_parent_drift')
    for attempt in range(16):
        name='.node0-r7-stage-'+secrets.token_hex(12)
        try:os.mkdir(name,0o700,dir_fd=base);break
        except FileExistsError:continue
    else:bad('stage_collision_limit')
    stage=os.open(name,DIR,dir_fd=base);stageinfo=os.fstat(stage)
    same_name(base,name,stage)
    for item in sorted(directories,key=lambda item:(item['path'].count('/'),item['path'])):
        same_name(base,name,stage);holder=mkdirs(stage,item['path']);os.close(holder)
    for entry,data,mode in prepared:
        same_name(base,name,stage);ensure_parent(stage,entry);exclusive(stage,entry,data,mode)
    patches=[];patch_bytes=0
    for change in changes:
        same_name(base,name,stage)
        old=leaf_fd(stage,'preimatges/'+change['path']) if change['before'] else os.open('/dev/null',os.O_RDONLY)
        new=leaf_fd(stage,'fitxers/'+change['path']);temporary='.node0-diff-'+secrets.token_hex(12)
        temporaryfd=os.open(temporary,os.O_RDWR|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600,dir_fd=stage)
        os.unlink(temporary,dir_fd=stage)
        try:
            result=subprocess.run(['/usr/bin/diff','-u','--label',('a/'+change['path']) if change['before'] else '/dev/null','--label','b/'+change['path'],'/dev/fd/'+str(old),'/dev/fd/'+str(new)],stdout=temporaryfd,stderr=subprocess.PIPE,pass_fds=(old,new),timeout=30,env={'LC_ALL':'C','PATH':'/usr/bin:/bin'},preexec_fn=diff_limit)
            size=os.fstat(temporaryfd).st_size
            if result.returncode not in (0,1) or size>MAX_PATCH:bad('stage_diff_limit_or_failed')
            os.lseek(temporaryfd,0,os.SEEK_SET);patch=os.read(temporaryfd,MAX_PATCH+1);patch_bytes+=len(patch)
            if patch_bytes>MAX_PATCH:bad('stage_diff_limit_or_failed')
            patches.append(patch)
        finally:os.close(old);os.close(new);os.close(temporaryfd)
    same_name(base,name,stage);ensure_parent(stage,'pegats/node0.patch');exclusive(stage,'pegats/node0.patch',b''.join(patches),0o644)
    for item in sorted(directories,key=lambda item:(-item['path'].count('/'),item['path'])):
        holder=mkdirs(stage,item['path'])
        try:os.fchmod(holder,item['mode'])
        finally:os.close(holder)
    same_name(base,name,stage);files,folders=inventory(stage)
    sums=''.join(files[entry]['sha256']+'  '+entry+'\n' for entry in sorted(files)).encode()
    exclusive(stage,'SHA256SUMS',sums,0o644);os.fsync(stage);os.fsync(base)
    same_name(base,name,stage);files,folders=inventory(stage)
    output={'stage':value['parent']+'/'+name,'stageIdentity':{'dev':stageinfo.st_dev,'ino':stageinfo.st_ino},'parentIdentity':value['parentIdentity'],'snapshot':{'directories':[{'path':entry,'mode':folders[entry]} for entry in sorted(folders)],'files':[{'path':entry,**files[entry]} for entry in sorted(files)]}}
    print(json.dumps(output))
except BaseException as error:
    sys.stderr.write((str(error) if isinstance(error,RuntimeError) else 'stage_refused')+'\n');sys.exit(1)
finally:
    for fd in (stage,base):
        if fd is not None:os.close(fd)
`;
const PUBLISH=FD_COMMON+String.raw`
# R7_SAFE_PUBLISH
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
function stageSafely(parent,files,directories,changes){
  if(files.length>4096||directories.length>4096)fail('stage_file_limit');
  if(files.reduce((sum,file)=>sum+Buffer.byteLength(file.data),0)>256*1024*1024)fail('stage_byte_limit');
  const parentInfo=fs.lstatSync(parent);
  const input={parent,parentIdentity:{dev:parentInfo.dev,ino:parentInfo.ino},files:files.map(file=>({path:file.path,data:Buffer.from(file.data).toString('base64'),mode:file.mode})),directories,changes};
  const result=spawnSync(PYTHON_BINARY,['-I','-B','-c',STAGE],{input:JSON.stringify(input),encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});
  if(result.status!==0)fail(/^stage_[a-z_]+\n$/.test(result.stderr??'')?result.stderr.trim():'stage_failed');
  let response;try{response=JSON.parse(result.stdout);}catch{fail('stage_protocol_invalid');}
  if(typeof response.stage!=='string'||path.dirname(response.stage)!==parent||!path.basename(response.stage).startsWith('.node0-r7-stage-')||!plain(response.stageIdentity)||!plain(response.parentIdentity)||!plain(response.snapshot))fail('stage_protocol_invalid');
  return response;
}
function publish(parent,stage,dest,evidence,tree,identities){
  const input={parent,parentIdentity:identities.parentIdentity,stage:path.basename(stage),stageIdentity:identities.stageIdentity,destination:path.basename(dest),evidence:evidence?{...snapshot(evidence),identity:evidence.identity}:null,snapshot:snapshot(tree)};
  const result=spawnSync(PYTHON_BINARY,['-I','-B','-c',PUBLISH],{input:JSON.stringify(input),encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
  if(result.status!==0)fail(/^publish_[a-z_]+\n$/.test(result.stderr??'')?result.stderr.trim():'publish_failed');
  let response;try{response=JSON.parse(result.stdout);}catch{fail('publish_protocol_invalid');}if(response.files!==tree.files.length)fail('publish_protocol_invalid');
}
export function empaquetaR7(options){
  validateOptions(options,['candidateRoot','baseRoot','r3Root','r4Root','r5Root','r6Root','kitRoot','paths']);
  const {candidateRoot,baseRoot,r3Root,r4Root,r5Root,r6Root,kitRoot,paths}=options;
  if(Array.isArray(paths)&&paths.length>512)fail('payload_file_limit');
  const checked=baseline({baseRoot,r3Root,r4Root,r5Root,r6Root}),candidate=rootDirectory(candidateRoot),names=pathsUnique(paths);
  if(typeof kitRoot!=='string'||!kitRoot)fail('explicit_kit_required');const requested=path.resolve(kitRoot),parent=rootDirectory(path.dirname(requested)),dest=path.join(parent,path.basename(requested));
  if([candidate,checked.base,checked.r3.root,checked.r4.root,checked.r5.root,checked.r6.root].some(root=>dest===root||dest.startsWith(root+'/')||root.startsWith(dest+'/')))fail('external_kit_required');
  const evidence=evidenceAt(dest),verifier=inspect(candidate,'tooling/node0/verifica_kit_node0.py');if(verifier?.sha256!==PINS_R7.verifier)fail('candidate_verifier_pin_failed');
  let capturedBytes=0;
  const files=names.map(name=>{
    const before=inspect(checked.base,name),after=inspect(candidate,name);if(!after)fail('candidate_missing');capturedBytes+=(before?.data.length??0)+after.data.length;if(capturedBytes>256*1024*1024)fail('payload_byte_limit');
    if(!same(state(before),checked.approved.get(name)??null))fail('r7_preimage_outside_reviewed_authority');
    if(before&&!Object.hasOwn(EXISTING_PREIMAGE_PINS_R7,name))fail('r7_existing_file_outside_frozen_scope');
    if(same(state(before),state(after)))fail('unchanged_payload');return{path:name,before,after};
  });
  for(const name of Object.keys(EXISTING_PREIMAGE_PINS_R7))if(!names.includes(name))fail('r7_existing_delta_required');
  const manifest={schema:'sdp.node0.cas.v1',name:'261104_kit_codex_node0_postgres_i_mastodon_r7_workspace_activacio',baseline:{r3:{manifestSha256:PINS_R7.r3.manifest,checksumsSha256:PINS_R7.r3.sums},r4:{manifestSha256:PINS_R7.r4.manifest,checksumsSha256:PINS_R7.r4.sums},r5:{manifestSha256:PINS_R7.r5.manifest,checksumsSha256:PINS_R7.r5.sums},r6:{manifestSha256:PINS_R7.r6.manifest,checksumsSha256:PINS_R7.r6.sums},preR6FoldedFiles:86,preR6ExtraPreimages:EXTRA_PREIMAGE_PINS_R7,previousRequiredPreimages:95,r6NewFiles:44,requiredPreimages:139,resolverPreimages:RESOLVER_PREIMAGE_PINS_R7,existingPreimages:EXISTING_PREIMAGE_PINS_R7},files:files.map(file=>({path:file.path,before:state(file.before),after:state(file.after)}))};
  const stagedFiles=(evidence?.files??[]).map(file=>({path:file.path,data:file.data,mode:file.mode}));
  for(const file of files){stagedFiles.push({path:'fitxers/'+file.path,data:file.after.data,mode:file.after.mode});if(file.before)stagedFiles.push({path:'preimatges/'+file.path,data:file.before.data,mode:file.before.mode});}
  stagedFiles.push({path:'MANIFEST.json',data:JSON.stringify(manifest,null,2)+'\n',mode:0o644},{path:'verifica_i_aplica.py',data:verifier.data,mode:0o755});
  stagedFiles.push({path:'README_INTEGRACIO.md',data:Buffer.from("# Node 0 · Workspace activació · delta CAS R7\n\nBase obligatòria: 139 postimatges autenticades. Es reconstrueixen plegant R3 + R4 + R5 (86), afegint les nou preimatges independents de R6 (95), i aplicant el manifest segellat R6 (44 rutes noves: 139). R3/R4/R5/R6 són entrades només de lectura. El constructor fixa manifests, SHA256SUMS, inventari complet, payloads, preimatges, modes i verificador. No executa codi dels kits d’entrada.\n\nLes úniques rutes existents que R7 pot modificar són les tres del resolutor: tooling/node0/resolutor-mirall-institucional.mjs, tooling/node0/sonda-directori-institucional.py i tests/node0-workspace-resolver.test.mjs; tooling/tests/node-suite-manifest.json per registrar les proves noves; i tooling/node0/servidor-node0-soberania.mjs, tooling/node0/resiliencia-node0.mjs i tests/node0-resilience.test.mjs per a l’estat de salut independent i la seua composició. Les set preimatges són les postimatges exactes de R6, fixades també al manifest. Les altres rutes de la llista explícita han de ser noves.\n\nAbans d’aplicar, usa el constructor revisat: `--check-base --base /copia --r3 /kit-r3 --r4 /kit-r4 --r5 /kit-r5 --r6 /kit-r6`. La comprovació és només de lectura i fixa les 139 rutes. És una precondició separada d’operador: l’aplicador universal comprova el CAS de les rutes del delta, no tota la base informativa del manifest.\n\nRevisió: `python3 verifica_i_aplica.py --target /copia`. Afegiu `--apply` per aplicar; la repetició és idempotent. `--rollback` comprova la reversió i `--rollback --apply` la fa. La reversió només cobreix les rutes del delta, no SQL, secrets, serveis, dades ni operacions remotes. Lock cooperatiu i substitució per fitxer: no és una transacció davant SIGKILL o tall elèctric.\n\nEl CAS lliura codi. La seua aplicació no inicia sessions, no escriu a Drive, no activa serveis i no acredita replicació al núvol. Les operacions del driver de Workspace requereixen l’ordre i la configuració explícites del seu contracte. Cap token, identitat age, .env o estat privat s’inclou com a font d’aquest kit.\n\nLes evidències es congelen durant l’empaquetat; SHA256SUMS es publica al final amb directoris fixats per fd i NOFOLLOW. Els checksums acrediten integritat, no autoria. Contrasteu els pins per un canal independent. Un kit segellat no s’actualitza in situ.\n"),mode:0o644});
  const staged=stageSafely(parent,stagedFiles,evidence?.directories??[],files.map(file=>({path:file.path,before:Boolean(file.before)}))),stage=staged.stage;
  checked.recheck();for(const file of files)if(!same(state(inspect(checked.base,file.path)),state(file.before))||!same(state(inspect(candidate,file.path)),state(file.after)))fail('source_changed_during_package');
  if(!same(state(inspect(candidate,'tooling/node0/verifica_kit_node0.py')),state(verifier)))fail('candidate_verifier_changed_during_package');
  const evidenceNow=evidenceAt(dest);if(!same(evidence? snapshot(evidence):null,evidenceNow? snapshot(evidenceNow):null))fail('evidence_changed_during_package');
  const stageAfter=inventory(stage);if(!same(snapshot(stageAfter),snapshot(staged.snapshot)))fail('stage_changed_during_package');
  publish(parent,stage,dest,evidence,stageAfter,staged);
  const final=inventory(dest);if(!same(snapshot(final),snapshot(stageAfter)))fail('delivery_changed_after_publish');
  return{kit:dest,files:files.length,baselineFiles:139,preR6FoldedFiles:86,preR6ExtraPreimages:9,r6NewFiles:44,resolverPreimages:3,suiteManifestPreimages:1,healthCompositionPreimages:3,existingPreimages:7,manifestSha256:inspect(dest,'MANIFEST.json').sha256,checksumsSha256:inspect(dest,'SHA256SUMS').sha256};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{
    const options={},keys={'--candidate':'candidateRoot','--base':'baseRoot','--r3':'r3Root','--r4':'r4Root','--r5':'r5Root','--r6':'r6Root','--kit':'kitRoot','--paths-file':'pathsFile'};let check=false;const args=process.argv.slice(2);
    for(let index=0;index<args.length;index++){if(args[index]==='--check-base'){if(check)fail('invalid_cli');check=true;continue;}const key=keys[args[index]];if(!key||options[key]!==undefined||!args[index+1]||args[index+1].startsWith('--'))fail('invalid_cli');options[key]=args[++index];}
    if(check){if(Object.keys(options).some(key=>!['baseRoot','r3Root','r4Root','r5Root','r6Root'].includes(key)))fail('invalid_cli');process.stdout.write(JSON.stringify(comprovaBaseR7(options))+'\n');}
    else{if(!options.pathsFile)fail('explicit_paths_file_required');const{pathsFile,...buildOptions}=options;buildOptions.paths=JSON.parse(fs.readFileSync(pathsFile,'utf8'));process.stdout.write(JSON.stringify(empaquetaR7(buildOptions))+'\n');}
  }catch(error){process.stderr.write((error?.message??'r7_package_failed')+'\n');process.exitCode=1;}
}
