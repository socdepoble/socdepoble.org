import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {COMPTE_WORKSPACE,NOM_MIRALL,resolMirallInstitucional,creaSondaMirallInstitucional,sondaDirectoriInstitucional} from '../tooling/node0/resolutor-mirall-institucional.mjs';

const NOW=Date.parse('2026-11-04T22:00:00.000Z'),DATE=new Date(NOW-1000).toISOString();
function recipient(){const alphabet='qpzry9x8gf2tvdw0s3jn54khce6mua7l',data=Array(52).fill(0);let chk=1;for(const v of[3,3,3,0,1,7,5,...data,0,0,0,0,0,0]){const top=chk>>>25;chk=((chk&0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((top>>>i)&1)chk^=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3][i];}chk^=1;return'age1'+data.map(v=>alphabet[v]).join('')+Array.from({length:6},(_,i)=>alphabet[(chk>>>(5*(5-i)))&31]).join('');}
const RECIPIENT=recipient();
async function fixture(t,{mount=true,target=true,staging=false,unit='My Drive'}={}){
 const base=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'sdp-institutional-resolver-'))),home=path.join(base,'home');await fs.mkdir(home,{mode:0o700});
 const account=path.join(home,'Library','CloudStorage',COMPTE_WORKSPACE),drive=path.join(account,unit),mirror=path.join(drive,NOM_MIRALL),stage=path.join(home,'socdepoble-node0','mirall-workspace-staging');
 if(mount)await fs.mkdir(target?mirror:drive,{recursive:true,mode:0o700});if(staging)await fs.mkdir(stage,{recursive:true,mode:0o700});
 t.after(()=>fs.rm(base,{recursive:true,force:true}));const calls=[];
 const probeDirectory=async(...args)=>{calls.push(['probe',args[0]]);return sondaDirectoriInstitucional(...args);};
 return{base,home,account,drive,mirror,stage,calls,options:{homeDir:home,recipient:RECIPIENT,probeDirectory}};
}
test('only the exact mounted institutional account with My Drive, owned target and valid age recipient is configured',async t=>{
 const f=await fixture(t);assert.deepEqual(await resolMirallInstitucional(f.options),{workspaceMirrorConfigured:true,mirrorDir:f.mirror,reason:null});
 assert.equal(f.calls.some(([,file])=>file.includes('GoogleDrive-')&&!file.startsWith(f.account)),false);
 const nested=path.join(f.drive,'custom','mirror');await fs.mkdir(nested,{recursive:true,mode:0o700});assert.equal((await resolMirallInstitucional({...f.options,mirrorDir:nested})).workspaceMirrorConfigured,true);
});
test('institutional units use their actual localised name and accept a read-only account root',async t=>{
 for(const unit of['My Drive','Mi unidad','El meu Drive']){
  const f=await fixture(t,{unit});await fs.chmod(f.account,0o500);
  try{
   const implicit=await resolMirallInstitucional(f.options),explicit=await resolMirallInstitucional({...f.options,mirrorDir:f.mirror});
   assert.equal(implicit.workspaceMirrorConfigured,true);assert.equal(implicit.mirrorDir,f.mirror);assert.deepEqual(explicit,implicit);
  }finally{await fs.chmod(f.account,0o700);}
 }
});
test('personal, prefix-lookalike, escape and noncanonical environment targets fail before any metadata access',async t=>{
 const f=await fixture(t);for(const mirrorDir of[path.join(f.home,'Library/CloudStorage/GoogleDrive-personal@example.invalid/My Drive/mirror'),f.account+'-evil/My Drive/mirror',path.join(f.drive,'..','elsewhere'),f.drive,f.drive+'/a/../b',path.join(f.home,'socdepoble-node0/mirall-workspace-staging')]){f.calls.length=0;assert.equal((await resolMirallInstitucional({...f.options,mirrorDir})).workspaceMirrorConfigured,false);assert.deepEqual(f.calls,[]);}
});
test('missing institutional mount never scans old account roots or reports staging as Workspace',async t=>{
 const f=await fixture(t,{mount:false,staging:true});const old=path.join(f.home,'Library/CloudStorage/GoogleDrive-old@example.invalid/My Drive');await fs.mkdir(old,{recursive:true,mode:0o700});const observed=[];
 const probe=creaSondaMirallInstitucional({...f.options,now:()=>NOW,inspectMirror:async input=>{observed.push(input.mirrorDir);return{integrityOk:true,lastSnapshotAt:DATE,path:'/PRIVATE/PATH',token:'PRIVATE_SENTINEL'};}}),result=await probe();
 assert.equal(result.configured,false);assert.equal(result.integrityOk,false);assert.equal(result.lastSnapshotAt,null);assert.deepEqual(result.staging,{configured:true,lastSnapshotAt:DATE,integrityOk:true});assert.deepEqual(observed,[f.stage]);assert.equal(JSON.stringify(result).includes(f.home),false);assert.equal(JSON.stringify(result).includes('PRIVATE'),false);assert.equal(f.calls.some(([,file])=>file.includes('GoogleDrive-old@')),false);
});
test('absent target or invalid/missing recipient cannot activate an institutional root',async t=>{
 const f=await fixture(t,{target:false});assert.equal((await resolMirallInstitucional(f.options)).workspaceMirrorConfigured,false);
 for(const recipient of[undefined,'','AGE-SECRET-KEY-1NOT-A-RECIPIENT',RECIPIENT+'x']){f.calls.length=0;assert.equal((await resolMirallInstitucional({...f.options,recipient})).workspaceMirrorConfigured,false);assert.deepEqual(f.calls,[]);}
});
test('symlink account or My Drive and group-writable or foreign-owner directory fail closed',async t=>{
 const f=await fixture(t,{mount:false});const outside=path.join(f.home,'unrelated');await fs.mkdir(outside);await fs.mkdir(path.dirname(f.account),{recursive:true,mode:0o700});await fs.symlink(outside,f.account);assert.equal((await resolMirallInstitucional(f.options)).workspaceMirrorConfigured,false);assert.equal(f.calls.some(([,file])=>file.startsWith(outside)),false);
 const g=await fixture(t);await fs.chmod(g.mirror,0o770);assert.equal((await resolMirallInstitucional(g.options)).workspaceMirrorConfigured,false);await fs.chmod(g.mirror,0o700);assert.equal((await resolMirallInstitucional({...g.options,expectedUid:process.getuid()+1})).workspaceMirrorConfigured,false);
 const h=await fixture(t,{target:false});await fs.rmdir(h.drive);await fs.symlink(outside,h.drive);assert.equal((await resolMirallInstitucional(h.options)).workspaceMirrorConfigured,false);
});
test('named-directory replacement during pinning is rejected and no alternative account is inspected',async t=>{
 const f=await fixture(t),outside=path.join(f.home,'unrelated-account'),marker=path.join(f.base,'FOREIGN_METADATA_READ');await fs.mkdir(path.join(outside,'My Drive',NOM_MIRALL),{recursive:true,mode:0o700});const inode=(await fs.stat(outside)).ino;
 const python=process.platform==='darwin'?'/Library/Developer/CommandLineTools/usr/bin/python3':'/usr/bin/python3',wrapper=path.join(f.base,'python-race');
 await fs.writeFile(wrapper,'#!'+python+'\nimport os,sys,runpy\noriginal=os.open\nchanged=False\ndef replacement(name,*args,**kw):\n    global changed\n    if name=="My Drive" and kw.get("dir_fd") is not None and os.fstat(kw["dir_fd"]).st_ino=='+inode+':\n        with open('+JSON.stringify(marker)+',"w") as out:out.write("UNEXPECTED")\n    fd=original(name,*args,**kw)\n    if name=='+JSON.stringify(COMPTE_WORKSPACE)+' and not changed:\n        changed=True\n        os.rename('+JSON.stringify(f.account)+','+JSON.stringify(f.account+'-saved')+')\n        os.symlink('+JSON.stringify(outside)+','+JSON.stringify(f.account)+')\n    return fd\nos.open=replacement\nrunpy.run_path(sys.argv[-1],run_name="__main__")\n',{mode:0o700});
 const probeDirectory=(target,home,uid,options)=>sondaDirectoriInstitucional(target,home,uid,{...options,python:wrapper});
 assert.equal((await resolMirallInstitucional({...f.options,probeDirectory})).workspaceMirrorConfigured,false);await assert.rejects(fs.access(marker));
});
test('public probe never leaks private paths, never invents integrity and honours cancellation',async t=>{
 const f=await fixture(t,{staging:true});let reads=0;const probe=creaSondaMirallInstitucional({...f.options,now:()=>NOW,inspectMirror:async()=>{reads++;throw Error('/PRIVATE/KEY');}});const result=await probe();assert.equal(result.configured,true);assert.equal(result.integrityOk,false);assert.deepEqual(result.staging,{configured:true,lastSnapshotAt:null,integrityOk:false});assert.equal(JSON.stringify(result).includes('PRIVATE'),false);assert.equal(reads,2);
 const aborted=new AbortController();aborted.abort();reads=0;const cancelled=await probe({signal:aborted.signal});assert.equal(cancelled.configured,false);assert.equal(cancelled.staging.configured,false);assert.equal(reads,0);
});
test('future or invalid snapshot dates do not become integrity evidence, even on a valid mount',async t=>{
 const f=await fixture(t);for(const lastSnapshotAt of['2026-02-30T10:00:00.000Z',new Date(NOW+1).toISOString(),null]){const probe=creaSondaMirallInstitucional({...f.options,inspectStaging:false,now:()=>NOW,inspectMirror:async()=>({integrityOk:true,lastSnapshotAt})});const result=await probe();assert.equal(result.configured,true);assert.equal(result.integrityOk,false);assert.equal(result.lastSnapshotAt,null);}
});
