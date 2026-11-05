#!/usr/bin/env node
/** Lab-only peer ingress. Dry-run is the CLI default; --apply requires the
 * reviewed plan SHA. No role/schema creation, passwords, SSH or production DB.
 * PostgreSQL17 views expose `error`, not `errmsg`, and parse current files.
 * File worker uses Python3.9 stdlib openat/dir_fd to pin ancestors and leaves
 * private0600 backups. Cooperative lock + captured-error rollback, not a
 * crash-atomic multi-file transaction or exclusion of independent admin edits. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const DATABASE_AUTH_LAB='node0_gauntlet_r4';
export const TARGET_AUTH_NODE0=Object.freeze({dataDirectory:'/Users/javi/socdepoble-node0/dades/postgres17',socket:'/Users/javi/socdepoble-node0/dades/run/postgres17',bin:'/Users/javi/local/postgres17/Postgres.app/Contents/Versions/17/bin',python:'/Library/Developer/CommandLineTools/usr/bin/python3'});
const FILES=['pg_hba.node0.conf','pg_ident.node0.conf'];
const HBA=`local ${DATABASE_AUTH_LAB} node0_authenticator peer map=node0_authenticator`;
const IDENT='node0_authenticator javi node0_authenticator';
const SCHEMA='sdp.node0.auth-peer-plan.v1';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=(code,extra={})=>Object.assign(new Error(code),{code,...extra});
const env=Object.freeze({PATH:'/usr/bin:/bin:/usr/sbin:/sbin',LANG:'C',LC_ALL:'C',PGPASSFILE:'/dev/null',PGSERVICEFILE:'/dev/null',PGOPTIONS:'-c default_transaction_read_only=on -c statement_timeout=5000 -c lock_timeout=2000'});
const runnerDefault=(file,args)=>execFileSync(file,args,{encoding:'utf8',timeout:10000,maxBuffer:1024*1024,env});
function directory(value){
  if(typeof value!=='string'||!path.isAbsolute(value)||/[\0\r\n]/.test(value)||path.resolve(value)!==value)throw fail('node0_auth_directory_invalid');
  if(process.platform==='darwin'&&(value==='/tmp'||value.startsWith('/tmp/')))return'/private'+value;
  if(process.platform==='darwin'&&(value==='/var'||value.startsWith('/var/')))return'/private'+value;
  return value;
}

// No source bytes leave this worker through the CLI. Its JSON pipe is private
// to the orchestrator; stdout of main() contains hashes/insertions only.
const PYTHON=String.raw`
import sys,os,stat,json,hashlib,base64,secrets
FLAGS=os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW
NAMES=('pg_hba.node0.conf','pg_ident.node0.conf')
LOCK='.node0-auth-peer.lock'
root=None;lock=None;lock_info=None;original={};changed=[];backups=[];written=False
def bad(code): raise RuntimeError(code)
def emit(value): print(json.dumps(value,separators=(',',':')),flush=True)
def open_root(value):
    fd=os.open('/',FLAGS)
    try:
        for part in value.split('/')[1:]:
            child=os.open(part,FLAGS,dir_fd=fd);os.close(fd);fd=child
        return fd
    except BaseException: os.close(fd);raise
def root_same():
    fd=open_root(sys.argv[1])
    try:
        a,b=os.fstat(root),os.fstat(fd)
        if (a.st_dev,a.st_ino)!=(b.st_dev,b.st_ino):bad('node0_auth_directory_drift')
    finally:os.close(fd)
def state(name):
    if name not in NAMES:bad('node0_auth_file_scope')
    fd=os.open(name,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK,dir_fd=root)
    try:
        s=os.fstat(fd)
        if not stat.S_ISREG(s.st_mode) or s.st_nlink!=1 or s.st_uid!=os.getuid() or stat.S_IMODE(s.st_mode)!=0o600 or s.st_size>1048576:bad('node0_auth_file_unsafe')
        with os.fdopen(os.dup(fd),'rb') as handle:data=handle.read(1048577)
        t=os.fstat(fd)
        if len(data)>1048576 or (s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns,s.st_ctime_ns)!=(t.st_dev,t.st_ino,t.st_size,t.st_mtime_ns,t.st_ctime_ns):bad('node0_auth_read_drift')
        return {'sha256':hashlib.sha256(data).hexdigest(),'mode':stat.S_IMODE(s.st_mode),'data':base64.b64encode(data).decode('ascii')}
    finally:os.close(fd)
def owns_lock():
    if lock is None:return False
    try:
        s=os.stat(LOCK,dir_fd=root,follow_symlinks=False)
        return (s.st_dev,s.st_ino)==(lock_info.st_dev,lock_info.st_ino) and stat.S_ISREG(s.st_mode) and s.st_nlink==1 and s.st_uid==os.getuid() and stat.S_IMODE(s.st_mode)==0o600
    except FileNotFoundError:return False
def check_lock():
    root_same()
    if not owns_lock():bad('node0_auth_lock_drift')
def atomic(name,data):
    temp='.node0-auth-stage-'+secrets.token_hex(12)
    try:
        fd=os.open(temp,os.O_CREAT|os.O_EXCL|os.O_WRONLY|os.O_NOFOLLOW,0o600,dir_fd=root)
        with os.fdopen(fd,'wb') as out:
            out.write(data);out.flush();os.fchmod(out.fileno(),0o600);os.fsync(out.fileno())
        os.replace(temp,name,src_dir_fd=root,dst_dir_fd=root);os.fsync(root)
    finally:
        try:os.unlink(temp,dir_fd=root)
        except FileNotFoundError:pass
def check_post():
    check_lock()
    for item in changed:
        if state(item['name'])['sha256']!=item['afterSha256']:bad('node0_auth_postimage_drift')
def rollback():
    global written
    check_lock();todo=[]
    # Global CAS preflight: never partially restore over independent drift.
    for item in changed:
        found=state(item['name'])['sha256']
        if found==item['beforeSha256']:continue
        if found!=item['afterSha256']:bad('node0_auth_rollback_drift')
        todo.append(item['name'])
    for name in todo:atomic(name,base64.b64decode(original[name]['data']))
    written=False
def cleanup():
    if lock is not None:
        if owns_lock():os.unlink(LOCK,dir_fd=root)
        os.close(lock)
    if root is not None:os.close(root)
try:
    root=open_root(sys.argv[1]);info=os.fstat(root)
    if info.st_uid!=os.getuid() or stat.S_IMODE(info.st_mode)!=0o700:bad('node0_auth_directory_permissions')
    original={name:state(name) for name in NAMES};emit({'ok':True,'state':'ready','files':original})
    for line in sys.stdin:
        cmd=json.loads(line);action=cmd.get('action')
        if action=='close':emit({'ok':True,'state':'closed'});break
        if action=='apply':
            if lock is not None:bad('node0_auth_already_started')
            root_same();items=cmd.get('files')
            if not isinstance(items,list) or len(items)!=2 or [i.get('name') for i in items]!=list(NAMES):bad('node0_auth_file_scope')
            lock=os.open(LOCK,os.O_CREAT|os.O_EXCL|os.O_WRONLY|os.O_NOFOLLOW,0o600,dir_fd=root);os.fchmod(lock,0o600);lock_info=os.fstat(lock)
            os.write(lock,(str(os.getpid())+'\n').encode('ascii'));os.fsync(lock)
            for item in items:
                found=state(item['name'])
                if found['sha256']!=item['beforeSha256'] or found['mode']!=0o600:bad('node0_auth_cas_drift')
                data=base64.b64decode(item['afterData'],validate=True)
                if len(data)>1048576 or hashlib.sha256(data).hexdigest()!=item['afterSha256']:bad('node0_auth_payload_invalid')
            original={name:state(name) for name in NAMES}
            for item in items:
                if item['beforeSha256']==item['afterSha256']:continue
                check_lock()
                if state(item['name'])['sha256']!=item['beforeSha256']:bad('node0_auth_cas_drift')
                backup='.node0-auth-backup-'+secrets.token_hex(12)+'-'+item['name']
                fd=os.open(backup,os.O_CREAT|os.O_EXCL|os.O_WRONLY|os.O_NOFOLLOW,0o600,dir_fd=root)
                with os.fdopen(fd,'wb') as out:
                    out.write(base64.b64decode(original[item['name']]['data']));out.flush();os.fchmod(out.fileno(),0o600);os.fsync(out.fileno())
                backups.append({'name':backup,'sha256':item['beforeSha256'],'mode':384})
                changed.append(item);written=True
                atomic(item['name'],base64.b64decode(item['afterData']))
            check_post();emit({'ok':True,'state':'written','backups':backups})
        elif action=='check':check_post();emit({'ok':True,'state':'checked'})
        elif action=='rollback':rollback();emit({'ok':True,'state':'rolled_back','backups':backups})
        elif action=='commit':check_post();written=False;emit({'ok':True,'state':'committed','backups':backups});break
        else:bad('node0_auth_worker_command')
    if written:rollback()
except BaseException as error:
    code=str(error) if isinstance(error,RuntimeError) else 'node0_auth_file_operation_failed'
    rolled=False
    if written:
        try:rollback();rolled=True
        except BaseException:pass
    emit({'ok':False,'error':code,'rolledBack':rolled})
finally:cleanup()
`;
function worker(dataDirectory,python=TARGET_AUTH_NODE0.python){
  const child=spawn(python,['-I','-B','-u','-c',PYTHON,dataDirectory],{stdio:['pipe','pipe','pipe'],env});
  const queue=[],pending=[];let buffer='',closed=false,resolveClosed;
  const completion=new Promise(resolve=>{resolveClosed=resolve;});
  const deliver=value=>{const waiter=pending.shift();if(waiter){clearTimeout(waiter.timer);value.ok?waiter.resolve(value):waiter.reject(fail(value.error,{rolledBack:value.rolledBack}));}else queue.push(value);};
  child.stdout.on('data',chunk=>{buffer+=chunk.toString('utf8');let at;while((at=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,at);buffer=buffer.slice(at+1);try{deliver(JSON.parse(line));}catch{deliver({ok:false,error:'node0_auth_worker_protocol'});}}});
  child.stderr.on('data',()=>{});
  const end=()=>{closed=true;while(pending.length){const item=pending.shift();clearTimeout(item.timer);item.reject(fail('node0_auth_worker_closed'));}resolveClosed();};
  child.once('error',end);child.once('close',end);child.stdin.on('error',end);
  const next=()=>new Promise((resolve,reject)=>{
    if(queue.length){const value=queue.shift();return value.ok?resolve(value):reject(fail(value.error,{rolledBack:value.rolledBack}));}
    if(closed)return reject(fail('node0_auth_worker_closed'));
    const item={resolve,reject,timer:setTimeout(()=>{child.stdin.end();reject(fail('node0_auth_worker_timeout'));},10000)};pending.push(item);
  });
  return{ready:next(),async command(value){const response=next();child.stdin.write(JSON.stringify(value)+'\n');return response;},close(){child.stdin.end();return completion;}};
}
function sourceRows(bytes){
  let text;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw fail('node0_auth_config_encoding');}
  if(text.includes('\0')||text.startsWith('\ufeff')||/\r(?!\n)/.test(text))throw fail('node0_auth_config_encoding');
  const rows=text.match(/[^\n]*\n|[^\n]+$/g)??[];
  return{rows,eol:text.includes('\n')&&text[text.indexOf('\n')-1]==='\r'?'\r\n':'\n'};
}
function tokens(row){
  const active=row.replace(/\r?\n$/,'').split('#')[0].trim();
  if(!active)return[];
  if(/["\\]/.test(active)||/^(?:include|include_dir|include_if_exists)\b/.test(active))throw fail('node0_auth_unsupported_config');
  return active.split(/\s+/);
}
function patch(bytes,index){
  const {rows,eol}=sourceRows(bytes),expected=(index===0?HBA:IDENT).split(' ');let matching=-1,activeIndex=0,matchActive=-1;
  rows.forEach((row,i)=>{
    const parts=tokens(row);if(!parts.length)return;
    if(parts.join(' ')===expected.join(' ')){if(matching!==-1)throw fail('node0_auth_duplicate_rule');matching=i;matchActive=activeIndex;}
    else if(index===0){
      const local=parts[0]==='local';if(!local&&!['host','hostssl','hostnossl'].includes(parts[0]))throw fail('node0_auth_unsupported_config');
      const method=parts[local?3:4];if(!method||parts.some(p=>p.includes('node0_authenticator')))throw fail('node0_auth_conflicting_rule');
      const users=parts[2]?.split(',')??[];
      if(method!=='reject'&&users.some(u=>u==='all'||u.startsWith('+')||u.startsWith('/')||u.startsWith('@')))throw fail('node0_auth_broad_existing_rule');
    }else if(parts.length!==3||parts[0]==='node0_authenticator')throw fail('node0_auth_conflicting_map');
    activeIndex++;
  });
  if(matching!==-1&&(index===1||matchActive===0))return{bytes,already:true,present:true};
  if(matching!==-1){const line=rows[matching],rest=rows.filter((_,i)=>i!==matching).join('');return{bytes:Buffer.from(line+(line.endsWith('\n')?'':eol)+rest),already:false,present:true};}
  return{bytes:Buffer.concat([Buffer.from((index===0?HBA:IDENT)+eol),bytes]),already:false,present:false};
}
function build(states,{dataDirectory,database}){
  if(database!==DATABASE_AUTH_LAB)throw fail('node0_auth_database_scope');
  const payloads=[],files=FILES.map((name,index)=>{
    const before=states[name],bytes=Buffer.from(before.data,'base64');
    if(before.sha256!==sha(bytes)||before.mode!==0o600)throw fail('node0_auth_inspection_invalid');
    const result=patch(bytes,index),afterSha256=sha(result.bytes);
    payloads.push({name,beforeSha256:before.sha256,afterSha256,afterData:result.bytes.toString('base64')});
    return{name,beforeSha256:before.sha256,afterSha256,mode:0o600,changed:before.sha256!==afterSha256,already:result.already,beforePresent:result.present,insertion:index===0?HBA:IDENT};
  });
  const data={schema:SCHEMA,database,dataDirectory,operator:'javi',role:'node0_authenticator',files};
  return{plan:{...data,planSha256:sha(JSON.stringify(data))},payloads};
}
export async function creaPlaConnexioAuthNodeZero({database,dataDirectory=TARGET_AUTH_NODE0.dataDirectory,python=TARGET_AUTH_NODE0.python}={}){
  if(database!==DATABASE_AUTH_LAB)throw fail('node0_auth_database_scope');dataDirectory=directory(dataDirectory);
  const fileWorker=worker(dataDirectory,python);
  try{const ready=await fileWorker.ready;return build(ready.files,{dataDirectory,database}).plan;}
  finally{await fileWorker.close();}
}
const PREFLIGHT=`/* node0_auth_preflight */ SELECT json_build_object('database',current_database(),'operator',current_user,'version',current_setting('server_version_num')::int,'dataDirectory',current_setting('data_directory'),'hbaFile',current_setting('hba_file'),'identFile',current_setting('ident_file'),'authPolicyPresent',to_regprocedure('private.node0_auth_policy()') IS NOT NULL,'identViewAvailable',to_regclass('pg_catalog.pg_ident_file_mappings') IS NOT NULL,'role',(SELECT json_build_object('login',rolcanlogin,'inherit',rolinherit,'superuser',rolsuper,'bypassRls',rolbypassrls,'createDb',rolcreatedb,'createRole',rolcreaterole,'replication',rolreplication) FROM pg_roles WHERE rolname='node0_authenticator'),'memberships',(SELECT coalesce(json_agg(json_build_object('role',r.rolname,'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option) ORDER BY r.rolname),'[]'::json) FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid JOIN pg_roles u ON u.oid=m.member WHERE u.rolname='node0_authenticator'));`;
const HBA_CHECK=`/* node0_auth_hba_rules */ SELECT json_build_object('errors',(SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL),'expected',(SELECT count(*) FROM pg_hba_file_rules WHERE type='local' AND database=ARRAY['node0_gauntlet_r4']::text[] AND user_name=ARRAY['node0_authenticator']::text[] AND auth_method='peer' AND options=ARRAY['map=node0_authenticator']::text[]),'first',(SELECT min(rule_number) FROM pg_hba_file_rules WHERE type='local' AND database=ARRAY['node0_gauntlet_r4']::text[] AND user_name=ARRAY['node0_authenticator']::text[] AND auth_method='peer' AND options=ARRAY['map=node0_authenticator']::text[]));`;
const IDENT_CHECK=`/* node0_auth_ident_rules */ SELECT json_build_object('errors',(SELECT count(*) FROM pg_ident_file_mappings WHERE error IS NOT NULL),'expected',(SELECT count(*) FROM pg_ident_file_mappings WHERE map_name='node0_authenticator' AND sys_name='javi' AND pg_username='node0_authenticator'));`;
function safeRun(runner,file,args){try{return runner(file,args);}catch{throw fail('node0_auth_command_failed');}}
export async function aplicaPlaConnexioAuthNodeZero(plan,{apply=false,expectedPlanSha256=plan?.planSha256,runner=runnerDefault,python=TARGET_AUTH_NODE0.python,bin=TARGET_AUTH_NODE0.bin,socket=TARGET_AUTH_NODE0.socket}={}){
  if(plan?.schema!==SCHEMA||plan.database!==DATABASE_AUTH_LAB||!/^[a-f0-9]{64}$/.test(expectedPlanSha256??'')||expectedPlanSha256!==plan.planSha256)throw fail('node0_auth_plan_invalid');
  const dataDirectory=directory(plan.dataDirectory),fileWorker=worker(dataDirectory,python);let written=false,reloadAttempted=false,preflight;
  const sql=query=>{
    const raw=safeRun(runner,path.join(bin,'psql'),['-X','-q','-A','-t','-w','-h',socket,'-p','5432','-U','javi','-d',DATABASE_AUTH_LAB,'-v','ON_ERROR_STOP=1','-c',query]);
    try{return JSON.parse(raw);}catch{throw fail('node0_auth_database_response_invalid');}
  };
  const rules=present=>{
    const hba=sql(HBA_CHECK),ident=preflight.identViewAvailable?sql(IDENT_CHECK):null;
    if(hba.errors!==0||hba.expected!==(present?1:plan.files[0].beforePresent?1:0)||present&&hba.first!==1||ident&&(ident.errors!==0||ident.expected!==(present?1:plan.files[1].beforePresent?1:0)))throw fail('node0_auth_config_validation_failed');
    return{hba,ident,identViewVerified:Boolean(ident)};
  };
  try{
    const ready=await fileWorker.ready,{plan:current,payloads}=build(ready.files,{dataDirectory,database:plan.database});
    if(current.planSha256!==expectedPlanSha256)throw fail('node0_auth_cas_drift');
    if(JSON.stringify(plan)!==JSON.stringify(current))throw fail('node0_auth_plan_invalid');
    if(!apply)return{applied:false,plan:current};
    preflight=sql(PREFLIGHT);
    const role=preflight.role,members=preflight.memberships;
    if(preflight.database!==DATABASE_AUTH_LAB||preflight.operator!=='javi'||preflight.version<170000||preflight.version>=180000||preflight.dataDirectory!==dataDirectory||preflight.hbaFile!==path.join(dataDirectory,FILES[0])||preflight.identFile!==path.join(dataDirectory,FILES[1])||preflight.authPolicyPresent!==true||typeof preflight.identViewAvailable!=='boolean'||!role||role.login!==true||['inherit','superuser','bypassRls','createDb','createRole','replication'].some(k=>role[k]!==false)||!Array.isArray(members)||members.length!==2||members.map(m=>m.role).sort().join(',')!=='anon,authenticated'||members.some(m=>m.admin!==false||m.inherit!==false||m.set!==true))throw fail('node0_auth_preflight_refused');
    rules(false);
    if(!current.files.some(file=>file.changed))return{applied:false,alreadyConfigured:true,plan:current};
    const write=await fileWorker.command({action:'apply',files:payloads});written=true;
    const validation=rules(true);await fileWorker.command({action:'check'});
    reloadAttempted=true;safeRun(runner,path.join(bin,'pg_ctl'),['reload','-D',dataDirectory,'-s']);
    await fileWorker.command({action:'check'});rules(true);
    await fileWorker.command({action:'commit'});written=false;
    return{applied:true,plan:current,backups:write.backups,validation,reloaded:true};
  }catch(error){
    if(written){
      let restored=false,reloadedOriginal=false;
      try{await fileWorker.command({action:'rollback'});restored=true;if(reloadAttempted){rules(false);safeRun(runner,path.join(bin,'pg_ctl'),['reload','-D',dataDirectory,'-s']);reloadedOriginal=true;}}catch{ /* CAS refuses independent drift; never force restoration. */ }
      throw fail(error.code??'node0_auth_apply_failed',{rolledBack:restored,reloadedOriginal,rollbackRefused:!restored});
    }
    throw error?.code?error:fail('node0_auth_apply_failed');
  }finally{await fileWorker.close();}
}
export async function main(args=process.argv.slice(2)){
  let database,apply=false,expectedPlanSha256;
  for(let i=0;i<args.length;i++){
    if(args[i]==='--database')database=args[++i];else if(args[i]==='--apply')apply=true;else if(args[i]==='--expect-plan-sha256')expectedPlanSha256=args[++i];else throw fail('node0_auth_arguments_invalid');
  }
  if(database!==DATABASE_AUTH_LAB)throw fail('node0_auth_database_scope');
  if(apply&&(process.platform!=='darwin'||process.arch!=='arm64'||os.userInfo().username!=='javi'))throw fail('node0_auth_wrong_machine');
  if(apply&&!/^[a-f0-9]{64}$/.test(expectedPlanSha256??''))throw fail('node0_auth_plan_pin_required');
  const plan=await creaPlaConnexioAuthNodeZero({database});
  const result=apply?await aplicaPlaConnexioAuthNodeZero(plan,{apply,expectedPlanSha256}):{applied:false,plan};
  process.stdout.write(JSON.stringify(result,null,2)+'\n');return result;
}
let isMain=false;try{isMain=Boolean(process.argv[1])&&fs.realpathSync(path.resolve(process.argv[1]))===fileURLToPath(import.meta.url);}catch{ /* imported without a script file */ }
if(isMain)main().catch(error=>{process.stderr.write(JSON.stringify({error:error.code??'node0_auth_failed',...(error.rolledBack!==undefined?{rolledBack:error.rolledBack,rollbackRefused:error.rollbackRefused,reloadedOriginal:error.reloadedOriginal}:{})})+'\n');process.exitCode=1;});
