import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const installer=fileURLToPath(new URL('../tooling/node0/installa-age-node0.py',import.meta.url));
const archive=process.env.SDP_AGE_ARCHIVE??'';
const realAsset=archive?false:'Explicit official pinned archive required; no fake native crypto';
function python(body){
 const prefix=String.raw`import os,sys,json,hashlib,io,gzip,tarfile,tempfile,shutil,fcntl,stat,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('age_installer',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
home=Path(tempfile.mkdtemp(prefix='sdp-age-installer-test-')).resolve();os.chmod(home,0o700)
def expect(code,fn):
 try:fn()
 except m.Failure as error:assert str(error)==code,(str(error),code)
 else:raise AssertionError('Expected '+code)
def tar(entries):
 output=io.BytesIO()
 with tarfile.open(fileobj=output,mode='w:gz') as stream:
  for name,kind,size,mode,data in entries:
   item=tarfile.TarInfo(name);item.type=kind;item.size=size;item.mode=mode;item.linkname='../../outside' if kind in (tarfile.SYMTYPE,tarfile.LNKTYPE) else '';stream.addfile(item,io.BytesIO(data) if data is not None else None)
 return output.getvalue()
try:
`;
 const script=prefix+body.split('\n').map(line=>' '+line).join('\n')+'\nfinally:shutil.rmtree(home)\n';
 const result=spawnSync('/usr/bin/python3',['-I','-B','-c',script,installer,archive],{encoding:'utf8',timeout:45000,maxBuffer:1024*1024});
 assert.equal(result.status,0,result.stderr);assert.equal(result.stdout,'','No secret or recipient output is permitted');
}

test('age default plan creates no files, keys, recipients or network operations',()=>python(String.raw`
m.secrets.token_hex=lambda *args:(_ for _ in ()).throw(AssertionError('randomness in plan'))
m.subprocess.run=lambda *args,**kwargs:(_ for _ in ()).throw(AssertionError('process/network in plan'))
before=list(home.iterdir());p=m.plan(str(home));assert p['apply'] is False and p['persistentKeysCreated']==0 and not p['driveChanged'];assert list(home.iterdir())==before
`));
test('age CLI rejects unknown or duplicate arguments without echoing their values',()=>{
 for(const args of [['--secret=PRIVATE_FIXTURE_VALUE'],['--apply','--apply']]){
  const result=spawnSync('/usr/bin/python3',['-I','-B',installer,...args],{encoding:'utf8'});assert.equal(result.status,1);assert.equal(result.stdout,'');assert.equal(JSON.parse(result.stderr).error,'node0_age_invalid_arguments');assert.doesNotMatch(result.stderr,/PRIVATE_FIXTURE_VALUE/);
 }
});
test('age apply has an explicit Node0 Darwin arm64 nonroot machine guard',()=>python(String.raw`
m.sys.platform='fixture-platform';expect('node0_age_wrong_machine',m.node0_guard);assert list(home.iterdir())==[]
`));
test('age decodes only pinned executables plus LICENSE from the actual official archive',{skip:realAsset},()=>python(String.raw`
data=Path(sys.argv[2]).read_bytes();assert len(data)==m.ASSET['size'] and m.digest(data)==m.ASSET['sha256'];selected=m.decode_archive(data)
assert set(selected)=={'age','age-keygen','LICENSE'}
for name,body in selected.items():assert len(body)==m.SELECTED[name]['size'] and m.digest(body)==m.SELECTED[name]['sha256']
assert list(home.iterdir())==[]
`));
test('age rejects traversal, absolute, duplicate separator and foreign-root archive names',()=>python(String.raw`
for name in ['../outside','/outside','age/../outside','age//outside','age\\outside','other/file']:
 data=tar([(name,tarfile.REGTYPE,0,0o644,b'')]);code='node0_age_archive_root' if name=='other/file' else 'node0_age_archive_path';expect(code,lambda:m.decode_archive(data))
assert list(home.iterdir())==[]
`));
test('age refuses symlink, hardlink, device and FIFO archive entries without extraction',()=>python(String.raw`
for kind in [tarfile.SYMTYPE,tarfile.LNKTYPE,tarfile.CHRTYPE,tarfile.FIFOTYPE]:
 data=tar([('age/unsafe',kind,0,0o644,b'')]);expect('node0_age_archive_non_regular',lambda:m.decode_archive(data))
assert list(home.iterdir())==[]
`));
test('age refuses case aliases and excessive archive entry growth',()=>python(String.raw`
data=tar([('age/A',tarfile.REGTYPE,0,0o644,b''),('age/a',tarfile.REGTYPE,0,0o644,b'')]);expect('node0_age_archive_duplicate_or_count',lambda:m.decode_archive(data))
data=tar([('age/file'+str(i),tarfile.REGTYPE,0,0o644,b'') for i in range(65)]);expect('node0_age_archive_duplicate_or_count',lambda:m.decode_archive(data))
`));
test('age bounds declared member size and disallows executable setid mode',()=>python(String.raw`
data=tar([('age/huge',tarfile.REGTYPE,m.MAX_MEMBER+1,0o644,None)]);expect('node0_age_archive_non_regular',lambda:m.decode_archive(data))
data=tar([('age/unsafe',tarfile.REGTYPE,0,0o4755,b'')]);expect('node0_age_archive_non_regular',lambda:m.decode_archive(data))
`));
test('age verifies binary bytes independently of the compressed asset digest',()=>python(String.raw`
pin=m.SELECTED['age'];data=tar([('age/age',tarfile.REGTYPE,pin['size'],pin['mode'],b'0'*pin['size'])]);expect('node0_age_selected_digest_mismatch',lambda:m.decode_archive(data))
`));
test('age refuses unbounded decompressor reads before asking the source for bytes',()=>python(String.raw`
class NeverRead:
 def read(self,size):raise AssertionError('oversized read reached source')
expect('node0_age_archive_expansion_limit',lambda:m.ExpandedLimit(NeverRead()).read(m.MAX_EXPANDED+2))
`));
test('age refuses symlink root/ancestors and writable-by-others install parents',()=>python(String.raw`
outside=home/'outside';outside.mkdir();os.symlink(outside,home/'alias')
try:m.open_root(str(home/'alias'))
except OSError:pass
else:raise AssertionError('symlink root accepted')
(home/'local').mkdir();os.chmod(home/'local',0o777);expect('node0_age_unsafe_directory',lambda:m.install(str(home)));assert list(outside.iterdir())==[]
`));
test('age regular reads reject hardlinks and leaf symlinks',()=>python(String.raw`
source=home/'source';source.mkdir();fd=os.open(source,m.DIR)
try:
 m.exclusive(fd,'file',b'synthetic fixture',0o600);os.link(source/'file',home/'hardlink');expect('node0_age_unsafe_file',lambda:m.read_regular(fd,'file',0o600,100));os.unlink(home/'hardlink');os.symlink(home/'outside',source/'symlink')
 try:m.read_regular(fd,'symlink',0o600,100)
 except OSError:pass
 else:raise AssertionError('symlink accepted')
finally:os.close(fd)
`));
test('age refuses an existing unclaimed installation before download or replacement',()=>python(String.raw`
dest=home/'local'/m.DESTINATION;dest.mkdir(parents=True);os.chmod(dest,0o700);(dest/'foreign.txt').write_bytes(b'operator fixture');called=[]
expect('node0_age_existing_install_unclaimed',lambda:m.install(str(home),fetcher=lambda fd:called.append(True)))
assert not called and (dest/'foreign.txt').read_bytes()==b'operator fixture';assert sorted(x.name for x in dest.iterdir())==['foreign.txt']
`));
test('age exclusive installation creation refuses a concurrent existing directory',()=>python(String.raw`
local=home/'local';local.mkdir();(local/m.DESTINATION).mkdir();(local/m.DESTINATION/'operator').write_bytes(b'keep');fd=os.open(local,m.DIR)
try:
 try:m.publish_installation(fd,None,{})
 except FileExistsError:pass
 else:raise AssertionError('existing directory overwritten')
 assert (local/m.DESTINATION/'operator').read_bytes()==b'keep'
finally:os.close(fd)
`));
test('age installation root substitution cannot redirect payload writes outside',()=>python(String.raw`
local=home/'local';outside=home/'outside';local.mkdir();outside.mkdir();fd=os.open(local,m.DIR);original=m.os.open;swapped=[]
def schedule(name,*args,**kwargs):
 if name==m.DESTINATION and kwargs.get('dir_fd')==fd and not swapped:
  os.rename(local/m.DESTINATION,local/'held');os.symlink(outside,local/m.DESTINATION);swapped.append(True)
 return original(name,*args,**kwargs)
m.os.open=schedule
try:
 try:m.publish_installation(fd,None,{})
 except OSError:pass
 else:raise AssertionError('swapped root accepted')
 assert swapped and list(outside.iterdir())==[]
finally:m.os.open=original;os.close(fd)
`));
test('age installation lock rejects a concurrent installer without downloading',()=>python(String.raw`
local=home/'local';local.mkdir();lock=os.open(local/'.age-v1.3.2.install.lock',os.O_RDWR|os.O_CREAT,0o600);fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB);called=[]
try:expect('node0_age_install_busy',lambda:m.install(str(home),fetcher=lambda fd:called.append(True)));assert not called
finally:os.close(lock)
assert not any(x.name.startswith('.age-install-') for x in local.iterdir())
`));
test('age rejects a corrupt download, cleans scratch and creates no installation',()=>python(String.raw`
expect('node0_age_asset_digest_mismatch',lambda:m.install(str(home),fetcher=lambda fd:m.exclusive(fd,'archive.tar.gz',b'corrupt synthetic archive',0o600)))
assert sorted(x.name for x in (home/'local').iterdir())==['.age-v1.3.2.install.lock']
`));
test('age real native roundtrip and idempotency leave no canary identity or config changes',{skip:realAsset},()=>python(String.raw`
data=Path(sys.argv[2]).read_bytes();config=home/'.config'/'socdepoble';config.mkdir(parents=True);(config/'node0.env').write_bytes(b'untouched synthetic env');drive=home/'Drive';drive.mkdir();(drive/'sentinel').write_bytes(b'untouched synthetic drive')
before_env=(config/'node0.env').read_bytes();before_drive=(drive/'sentinel').read_bytes();environment=dict(os.environ)
first=m.install(str(home),fetcher=lambda fd:m.exclusive(fd,'archive.tar.gz',data,0o600));dest=home/'local'/m.DESTINATION;receipt_before=(dest/'installation.json').read_bytes()
second=m.install(str(home),fetcher=lambda fd:(_ for _ in ()).throw(AssertionError('idempotent download')))
assert first['canary']['nativeRoundtrip'] and first['canary']['temporaryIdentityRemoved'] and not first['alreadyInstalled'];assert second['alreadyInstalled'] and second['canary']['canaryFilesRemoved']
assert (dest/'installation.json').read_bytes()==receipt_before;assert set(x.name for x in dest.iterdir())==set(m.SELECTED)|{'installation.json'};assert sorted(x.name for x in (home/'local').iterdir())==['.age-v1.3.2.install.lock',m.DESTINATION]
assert stat.S_IMODE(dest.stat().st_mode)==0o700;assert stat.S_IMODE((dest/'installation.json').stat().st_mode)==0o600
assert (config/'node0.env').read_bytes()==before_env and (drive/'sentinel').read_bytes()==before_drive and dict(os.environ)==environment
serialized=json.dumps(first)+json.dumps(second);assert 'AGE-SECRET-KEY-' not in serialized and 'age1' not in serialized
`));
test('age rerun refuses a modified installed binary before any new download',{skip:realAsset},()=>python(String.raw`
data=Path(sys.argv[2]).read_bytes();m.install(str(home),fetcher=lambda fd:m.exclusive(fd,'archive.tar.gz',data,0o600));dest=home/'local'/m.DESTINATION;binary=dest/'age';binary.write_bytes(binary.read_bytes()+b'altered');called=[]
try:m.install(str(home),fetcher=lambda fd:called.append(True))
except m.Failure as error:assert str(error) in ['node0_age_unsafe_file','node0_age_file_digest_mismatch']
else:raise AssertionError('modified executable accepted')
assert not called and not any(x.name.startswith('.age-install-') for x in (home/'local').iterdir())
`));
