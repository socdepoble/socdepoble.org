import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {creaPlaConnexioAuthNodeZero,aplicaPlaConnexioAuthNodeZero,DATABASE_AUTH_LAB,TARGET_AUTH_NODE0,main} from '../tooling/node0/prepara-connexio-auth-node0.mjs';

const python=process.platform==='darwin'?TARGET_AUTH_NODE0.python:'/usr/bin/python3';
const HBA='local node0_gauntlet_r4 node0_authenticator peer map=node0_authenticator';
const IDENT='node0_authenticator javi node0_authenticator';
const names=['pg_hba.node0.conf','pg_ident.node0.conf'];
const originalHba='# PRIVATE_SOURCE_SENTINEL · comunitat\nlocal all javi peer\nlocal socdepoble_node0 node0_runtime peer map=sdp_node0_runtime\nlocal all all reject\nhost all all 127.0.0.1/32 reject\nhost all all ::1/128 reject';
const originalIdent='# preserve original maps\nsdp_node0_runtime javi node0_runtime\n';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function fixture(t,{hba=originalHba,ident=originalIdent}={}){
  const parent=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-auth-peer-test-'))),dataDirectory=path.join(parent,'data');
  fs.mkdirSync(dataDirectory,{mode:0o700});
  fs.writeFileSync(path.join(dataDirectory,names[0]),hba,{mode:0o600});fs.writeFileSync(path.join(dataDirectory,names[1]),ident,{mode:0o600});
  const before=names.map(name=>fs.readFileSync(path.join(dataDirectory,name)));
  t.after(()=>fs.rmSync(parent,{recursive:true,force:true}));
  return{parent,dataDirectory,before,plan:()=>creaPlaConnexioAuthNodeZero({dataDirectory,database:DATABASE_AUTH_LAB,python})};
}
function fakeRunner(dataDirectory,overrides={}){
  const calls=[];let hbaChecks=0,identChecks=0,reloads=0;
  const active=name=>fs.readFileSync(path.join(dataDirectory,name),'utf8').split(/\r?\n/).map(l=>l.split('#')[0].trim()).filter(Boolean);
  const runner=(file,args)=>{
    const query=args.at(-1);calls.push({file,args:[...args]});
    if(file.endsWith('/pg_ctl')){reloads++;return overrides.reload?.(reloads)??'';}
    assert.ok(file.endsWith('/psql'));assert.ok(args.includes('-w'));assert.equal(args[args.indexOf('-d')+1],DATABASE_AUTH_LAB);
    if(query.includes('node0_auth_preflight')){
      overrides.beforeApply?.();
      return JSON.stringify({database:DATABASE_AUTH_LAB,operator:'javi',version:170011,dataDirectory,hbaFile:path.join(dataDirectory,names[0]),identFile:path.join(dataDirectory,names[1]),authPolicyPresent:true,identViewAvailable:true,role:{login:true,inherit:false,superuser:false,bypassRls:false,createDb:false,createRole:false,replication:false},memberships:[{role:'anon',admin:false,inherit:false,set:true},{role:'authenticated',admin:false,inherit:false,set:true}],...overrides.preflight});
    }
    if(query.includes('node0_auth_hba_rules')){
      hbaChecks++;overrides.hbaCheck?.(hbaChecks);
      const rows=active(names[0]);return JSON.stringify({errors:overrides.hbaError?.(hbaChecks)??0,expected:rows.filter(r=>r===HBA).length,first:rows.indexOf(HBA)<0?null:rows.indexOf(HBA)+1});
    }
    if(query.includes('node0_auth_ident_rules')){identChecks++;return JSON.stringify({errors:overrides.identError?.(identChecks)??0,expected:active(names[1]).filter(r=>r===IDENT).length});}
    assert.fail('unexpected command');
  };
  return{runner,calls,get reloads(){return reloads;},get identChecks(){return identChecks;}};
}
const apply=(plan,runner)=>aplicaPlaConnexioAuthNodeZero(plan,{apply:true,expectedPlanSha256:plan.planSha256,runner,python});
const unchanged=f=>names.forEach((name,i)=>assert.deepEqual(fs.readFileSync(path.join(f.dataDirectory,name)),f.before[i]));

test('default plan/dry-run is byte-preserving, private, deterministic and never executes PG',async t=>{
  const f=fixture(t),plan=await f.plan();assert.equal(plan.database,DATABASE_AUTH_LAB);assert.match(plan.planSha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(await f.plan(),plan);assert.equal(JSON.stringify(plan).includes('PRIVATE_SOURCE_SENTINEL'),false);
  const result=await aplicaPlaConnexioAuthNodeZero(plan,{python,runner:()=>assert.fail('dry-run must not execute SQL/reload')});
  assert.equal(result.applied,false);unchanged(f);assert.deepEqual(fs.readdirSync(f.dataDirectory).sort(),[...names].sort());
});
for(const eol of['\n','\r\n'])test(`apply preserves unrelated ${JSON.stringify(eol)} bytes and EOF; creates0600 backups, validates then reloads`,async t=>{
  const f=fixture(t,{hba:originalHba.replaceAll('\n',eol),ident:originalIdent.replaceAll('\n',eol)}),plan=await f.plan(),fake=fakeRunner(f.dataDirectory);
  const result=await apply(plan,fake.runner);assert.equal(result.applied,true);assert.equal(result.reloaded,true);assert.equal(fake.reloads,1);
  names.forEach((name,i)=>{const bytes=fs.readFileSync(path.join(f.dataDirectory,name));assert.ok(bytes.subarray(bytes.length-f.before[i].length).equals(f.before[i]));assert.equal(hash(bytes),plan.files[i].afterSha256);assert.equal(fs.statSync(path.join(f.dataDirectory,name)).mode&0o777,0o600);});
  assert.equal(result.backups.length,2);for(const backup of result.backups){const file=path.join(f.dataDirectory,backup.name);assert.equal(fs.statSync(file).mode&0o777,0o600);assert.equal(fs.statSync(file).nlink,1);assert.equal(hash(fs.readFileSync(file)),backup.sha256);}
  assert.equal(fs.existsSync(path.join(f.dataDirectory,'.node0-auth-peer.lock')),false);
  const reloadAt=fake.calls.findIndex(c=>c.file.endsWith('/pg_ctl'));assert.ok(fake.calls.slice(0,reloadAt).some(c=>c.args.at(-1).includes('node0_auth_hba_rules')));assert.ok(fake.calls.slice(0,reloadAt).some(c=>c.args.at(-1).includes('node0_auth_ident_rules')));
  const second=await f.plan();assert.ok(second.files.every(file=>!file.changed));assert.equal((await apply(second,fake.runner)).alreadyConfigured,true);assert.equal(fake.reloads,1);
});
test('moved existing managed HBA rule is not duplicated; failed reload restores byte-exact original and revalidates',async t=>{
  const f=fixture(t,{hba:originalHba+'\n'+HBA+' # managed existing\n'}),plan=await f.plan();assert.equal(plan.files[0].beforePresent,true);assert.equal(plan.files[0].changed,true);
  const fake=fakeRunner(f.dataDirectory,{reload(n){if(n===1)throw Error('simulated reload failure');return'';}});
  await assert.rejects(apply(plan,fake.runner),e=>e.rolledBack===true&&e.reloadedOriginal===true);unchanged(f);assert.equal(fake.reloads,2);
});
for(const field of['hba','ident'])test(`invalid post-write ${field} parse rolls back before any reload`,async t=>{
  const f=fixture(t),plan=await f.plan(),fake=fakeRunner(f.dataDirectory,field==='hba'?{hbaError:n=>n===2?1:0}:{identError:n=>n===2?1:0});
  await assert.rejects(apply(plan,fake.runner),e=>e.code==='node0_auth_config_validation_failed'&&e.rolledBack===true);unchanged(f);assert.equal(fake.reloads,0);
});
test('optional unavailable ident view is reported and never queried',async t=>{
  const f=fixture(t),plan=await f.plan(),fake=fakeRunner(f.dataDirectory,{preflight:{identViewAvailable:false}});
  const result=await apply(plan,fake.runner);assert.equal(result.validation.identViewVerified,false);assert.equal(fake.identChecks,0);assert.equal(fake.reloads,1);
});
test('catalog target, auth SQL presence, role flags and memberships fail before writes',async t=>{
  const f=fixture(t),plan=await f.plan();
  const role={login:true,inherit:false,superuser:false,bypassRls:false,createDb:false,createRole:false,replication:false};
  const unsafe=[{database:'socdepoble_node0'},{hbaFile:'/other/pg_hba.conf'},{identFile:'/other/pg_ident.conf'},{dataDirectory:'/other/data'},{authPolicyPresent:false},{version:180000},{role:{...role,login:false}},{role:{...role,inherit:true}},{role:{...role,superuser:true}},{memberships:[{role:'anon',admin:true,inherit:false,set:true},{role:'authenticated',admin:false,inherit:false,set:true}]}];
  for(const preflight of unsafe){const fake=fakeRunner(f.dataDirectory,{preflight});await assert.rejects(apply(plan,fake.runner),{code:'node0_auth_preflight_refused'});unchanged(f);assert.equal(fake.reloads,0);}
  assert.deepEqual(fs.readdirSync(f.dataDirectory).sort(),[...names].sort());
});
test('source drift or tampered plan rejects globally without executing PG',async t=>{
  const f=fixture(t),plan=await f.plan();fs.appendFileSync(path.join(f.dataDirectory,names[1]),'# human edit\n');
  await assert.rejects(apply(plan,()=>assert.fail('no SQL after drift')),{code:'node0_auth_cas_drift'});
  assert.ok(fs.readFileSync(path.join(f.dataDirectory,names[1]),'utf8').endsWith('# human edit\n'));
  const current=await f.plan(),changed=structuredClone(current);changed.files[0].beforePresent=true;
  await assert.rejects(apply(changed,()=>assert.fail('no SQL for tampered metadata')),{code:'node0_auth_plan_invalid'});
});
test('independent human drift refuses rollback and never overwrites that edit',async t=>{
  const f=fixture(t),plan=await f.plan(),human=Buffer.from('# HUMAN DRIFT MUST SURVIVE\n');
  const fake=fakeRunner(f.dataDirectory,{hbaCheck:n=>{if(n===2)fs.writeFileSync(path.join(f.dataDirectory,names[0]),human);},hbaError:n=>n===2?1:0});
  await assert.rejects(apply(plan,fake.runner),e=>e.rollbackRefused===true&&e.rolledBack===false);
  assert.deepEqual(fs.readFileSync(path.join(f.dataDirectory,names[0])),human);assert.equal(fake.reloads,0);
});
test('foreign cooperative lock remains untouched',async t=>{
  const f=fixture(t),plan=await f.plan(),lock=path.join(f.dataDirectory,'.node0-auth-peer.lock');fs.writeFileSync(lock,'foreign owner',{mode:0o600});
  const fake=fakeRunner(f.dataDirectory);await assert.rejects(apply(plan,fake.runner));unchanged(f);assert.equal(fs.readFileSync(lock,'utf8'),'foreign owner');assert.equal(fake.reloads,0);
});
test('symlink, hardlink and permissive files or directories refuse in read-only planning',async t=>{
  const f=fixture(t),first=path.join(f.dataDirectory,names[0]),outside=path.join(f.parent,'outside');fs.writeFileSync(outside,originalHba,{mode:0o600});
  fs.renameSync(first,first+'.original');fs.symlinkSync(outside,first);await assert.rejects(f.plan());fs.unlinkSync(first);fs.renameSync(first+'.original',first);
  fs.linkSync(first,path.join(f.parent,'hardlink'));await assert.rejects(f.plan());fs.unlinkSync(path.join(f.parent,'hardlink'));
  fs.chmodSync(first,0o644);await assert.rejects(f.plan());fs.chmodSync(first,0o600);
  fs.chmodSync(f.dataDirectory,0o755);await assert.rejects(f.plan());fs.chmodSync(f.dataDirectory,0o700);
  assert.equal(fs.readFileSync(outside,'utf8'),originalHba);
});
test('ancestor swap to symlink after inspection cannot redirect file writes',async t=>{
  const f=fixture(t),plan=await f.plan(),outside=path.join(f.parent,'outside'),original=path.join(f.parent,'pinned-original');fs.mkdirSync(outside,{mode:0o700});
  for(const name of names)fs.writeFileSync(path.join(outside,name),'OUTSIDE UNTOUCHED',{mode:0o600});
  const fake=fakeRunner(f.dataDirectory,{beforeApply(){fs.renameSync(f.dataDirectory,original);fs.symlinkSync(outside,f.dataDirectory);}});
  await assert.rejects(apply(plan,fake.runner));for(const name of names)assert.equal(fs.readFileSync(path.join(outside,name),'utf8'),'OUTSIDE UNTOUCHED');names.forEach((name,i)=>assert.deepEqual(fs.readFileSync(path.join(original,name)),f.before[i]));assert.equal(fake.reloads,0);
});
test('duplicate/conflicting mappings, external includes and broad auth grants never get rewritten',async t=>{
  const cases=[{hba:HBA+'\n'+HBA+'\n'+originalHba},{ident:IDENT+'\n'+IDENT+'\n'},{ident:'node0_authenticator other node0_authenticator\n'},{hba:'include other.conf\n'+originalHba},{hba:'local all all trust\n'+originalHba},{hba:'local socdepoble_node0 node0_authenticator peer map=other\n'+originalHba}];
  for(const input of cases){const f=fixture(t,input);await assert.rejects(f.plan());unchanged(f);}
});
test('production DB and unknown CLI options reject before reading any target configuration',async()=>{
  await assert.rejects(creaPlaConnexioAuthNodeZero({database:'socdepoble_node0',dataDirectory:'/does/not/exist',python}),{code:'node0_auth_database_scope'});
  await assert.rejects(main(['--database','socdepoble_node0']),{code:'node0_auth_database_scope'});
  await assert.rejects(main(['--database',DATABASE_AUTH_LAB,'--token','SENTINEL']),{code:'node0_auth_arguments_invalid'});
  await assert.rejects(main(['--database',DATABASE_AUTH_LAB,'--apply']),e=>['node0_auth_wrong_machine','node0_auth_plan_pin_required'].includes(e.code));
});
