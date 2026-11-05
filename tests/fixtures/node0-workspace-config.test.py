import importlib.util,json,tempfile
from pathlib import Path
source=Path(__file__).resolve().parents[2]/'tooling/node0/configura-mirall-institucional-node0.py'
spec=importlib.util.spec_from_file_location('workspace_config',source);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
_,_,parser=m.primitives()
body=b'# fixture\r\nMASTODON_ACCESS_TOKEN="LAB_ONLY_NOT_REAL"\r\nSDP_WORKSPACE_ACCOUNT=socdepoble@socdepoble.org\r\nSDP_WORKSPACE_AGE_RECIPIENT=age1'+b'q'*58+b'\r\n'
with tempfile.TemporaryDirectory(prefix='sdp-workspace-config-') as folder:
 home=Path(folder).resolve();home.chmod(0o700);config=home/'.config/socdepoble';config.mkdir(parents=True,mode=0o700);config.chmod(0o700);env=config/'node0.env';env.write_bytes(body);env.chmod(0o600)
 target=m.target(str(home));rendered=m.render(body,target,parser)
 assert rendered.startswith(body) and parser(rendered)[1][m.FIELD][2]==target.encode()
 assert m.render(rendered,target,parser)==rendered
 assert m.render(body+b'SDP_WORKSPACE_MIRROR_DIR="/fixture" # keep\r\n',target,parser).endswith(b' # keep\r\n')
 for unit in m.UNITS:assert m.target(str(home),unit).endswith('/'+unit+'/'+m.MIRROR)
 try:m.target(str(home),'Other unit');raise AssertionError('accepted')
 except m.Failure:pass
 try:m.configure(str(home));raise AssertionError('missing account accepted')
 except FileNotFoundError:pass
 assert not (home/'Library').exists() and env.read_bytes()==body
 account=home/'Library/CloudStorage'/m.ACCOUNT_ROOT;drive=account/'Mi unidad';drive.mkdir(parents=True,mode=0o700);account.chmod(0o500)
 try:
  first=m.configure(str(home));assert first['environmentChanged'] and first['mirrorDirectoryCreated'] and first['recipientRetained'] and not first['otherDriveRootsTouched']
  assert env.read_bytes().startswith(body) and env.stat().st_mode&0o777==0o600 and account.stat().st_mode&0o777==0o500 and (drive/m.MIRROR).stat().st_mode&0o777==0o700
  assert parser(env.read_bytes())[1][m.FIELD][2]==target.encode()
  before=env.stat();second=m.configure(str(home));after=env.stat();assert not second['environmentChanged'] and not second['mirrorDirectoryCreated'] and (before.st_ino,before.st_mtime_ns)==(after.st_ino,after.st_mtime_ns)
 finally:account.chmod(0o700)
print(json.dumps({'passed':7,'failed':0}))
