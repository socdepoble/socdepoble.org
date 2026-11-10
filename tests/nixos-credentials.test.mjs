import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {llegixCredencialNodeZero,preparaEntornNodeZero,validaAclCredencialSystemd} from '../nix/start-node0.mjs';

const acl = uid => `user::r--\nuser:${uid}:r--\ngroup::---\nmask::r--\nother::---\n\n`;
const liniaCredencial = 'SDP_NODE0_ADMIN_TOKEN=public-synthetic-never-use-in-production-000000';
const denied = error => error.message === 'node0_nix_credential_permissions';
function fixture(run) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-nix-credential-'));
  const file=path.join(dir,'environment');fs.writeFileSync(file,liniaCredencial,{mode:0o600});
  try{return run({dir,file});}finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('systemd named-user ACL accepts only the exact service UID and zero group/other access',()=>{
  assert.equal(validaAclCredencialSystemd(acl(30001),30001),true);
  for(const unsafe of [acl(30002),acl(30001).replace('group::---','group::r--'),acl(30001).replace('other::---','other::r--'),acl(30001).replace('mask::r--','mask::rw-'),acl(30001)+'user:30002:r--\n',acl(30001).replace('user:30001:r--','user:30001:rw-'),acl(30001).replace('user:30001:r--','user:30001:r--\nuser:30001:r--')]) {
    assert.equal(validaAclCredencialSystemd(unsafe,30001),false,unsafe);
  }
  for(const uid of [0,-1,NaN,Infinity,'30001',undefined])assert.equal(validaAclCredencialSystemd(acl(30001),uid),false);
});
test('normal private0400/0600 credentials retain the exact secret allowlist and disabled activation flags',()=>fixture(({dir,file})=>{
  for(const mode of [0o400,0o600]){
    fs.chmodSync(file,mode);assert.equal(llegixCredencialNodeZero(file),liniaCredencial);
    const env=preparaEntornNodeZero({env:{CREDENTIALS_DIRECTORY:dir,SDP_NODE0_AUTH:'1',SDP_NODE0_IAIA:'1',NODE0_GETFACL:'/tmp/attacker'}});
    assert.equal(typeof env.SDP_NODE0_ADMIN_TOKEN,'string');
    for(const name of ['SDP_NODE0_AUTH','SDP_NODE0_IAIA','NODE0_GETFACL'])assert.equal(Object.hasOwn(env,name),false);
  }
}));
test('0440 is never generally accepted and world/group-readable private files fail closed',()=>fixture(({file})=>{
  for(const mode of [0o440,0o640,0o644,0o666]){
    fs.chmodSync(file,mode);let called=0;
    assert.throws(()=>llegixCredencialNodeZero(file,{readACL:()=>{called++;return acl(process.getuid());}}),denied);
    if(process.getuid()!==0)assert.equal(called,0,'A service-owned0440 file cannot invoke the root-owned systemd ACL exception.');
  }
}));
test('credential leaf symlinks, hardlinks and directories are refused',()=>fixture(({dir,file})=>{
  const alias=path.join(dir,'alias');fs.symlinkSync(file,alias);assert.throws(()=>llegixCredencialNodeZero(alias),denied);
  fs.unlinkSync(alias);fs.linkSync(file,alias);assert.throws(()=>llegixCredencialNodeZero(file),denied);
  assert.throws(()=>llegixCredencialNodeZero(dir),denied);
}));
test('credential bytes stay bounded at32KiB and malformed UTF8 cannot become replacement text',()=>fixture(({file})=>{
  fs.writeFileSync(file,Buffer.alloc(32769,65));assert.throws(()=>llegixCredencialNodeZero(file),denied);
  fs.writeFileSync(file,Buffer.from([0xff]));assert.throws(()=>llegixCredencialNodeZero(file),denied);
}));
test('a real named-file replacement during descriptor reading is detected',()=>fixture(({dir,file})=>{
  const read=fs.readSync;
  try{
    fs.readSync=(fd,...args)=>{fs.renameSync(file,path.join(dir,'original'));fs.writeFileSync(file,liniaCredencial,{mode:0o600});return read(fd,...args);};
    assert.throws(()=>llegixCredencialNodeZero(file),denied);
  }finally{fs.readSync=read;}
}));
test('growth after the metadata check cannot produce an unbounded read or an accepted credential',()=>fixture(({file})=>{
  const read=fs.readSync;
  try{
    fs.readSync=(fd,buffer,...args)=>{assert.equal(buffer.length,32769);fs.appendFileSync(file,'x'.repeat(40000));return read(fd,buffer,...args);};
    assert.throws(()=>llegixCredencialNodeZero(file),denied);
  }finally{fs.readSync=read;}
}));
