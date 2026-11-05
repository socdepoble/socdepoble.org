#!/usr/bin/env node
/** Disposable same-host restore proof; never a production restoration command. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {exigeixAbsenciaIdentitatLocal} from './custodia-age-node0.mjs';
import {llegeixIdentitatAgePipe,validaIdentitatAgeMemoria} from './identitat-age-pipe-node0.mjs';
const HOME='/Users/javi',POSTGRES_BIN=HOME+'/local/postgres17/Postgres.app/Contents/Versions/17/bin/';
const AGE=HOME+'/local/age-v1.3.2/age';
const SOCKET=HOME+'/socdepoble-node0/dades/run/postgres17',REAL=Symbol('native-proof');
const AGE_SHA='4012dfc2725883beafb710894af4f599b7a94f8c8e0f51f02cc96ab8df33915e';
const fail=code=>{throw new Error(code);};
export const nomRestauracioValid=name=>typeof name==='string'&&/^node0_restore_[a-f0-9]{16}$/.test(name);
const fields=info=>[info.dev,info.ino,info.size,info.mtimeMs,info.ctimeMs,info.mode,info.nlink];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function obriRegularRestauracio(file,{mode=null,maxBytes=512*1024*1024,minBytes=1}={}){
 if(typeof file!=='string'||!path.isAbsolute(file)||/[\r\n\0\\]/.test(file))fail('restore_file_path_invalid');
 let target=path.resolve(file);
 if(process.platform==='darwin')for(const[a,b]of[['/tmp','/private/tmp'],['/var','/private/var']])if(target.startsWith(a+'/')){let link;try{link=fs.readlinkSync(a);}catch{continue;}if([b,b.slice(1)].includes(link))target=b+target.slice(a.length);}
 let current=path.parse(target).root;for(const part of path.relative(current,path.dirname(target)).split(path.sep).filter(Boolean)){current=path.join(current,part);const s=fs.lstatSync(current);if(!s.isDirectory()||s.isSymbolicLink())fail('restore_parent_unsafe');}
 const fd=fs.openSync(target,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
 try{const info=fs.fstatSync(fd),named=fs.lstatSync(target);if(!info.isFile()||info.nlink!==1||info.uid!==process.getuid()||info.size<minBytes||info.size>maxBytes||info.mode&0o7000||mode!==null&&(info.mode&0o777)!==mode||info.dev!==named.dev||info.ino!==named.ino||named.isSymbolicLink())fail('restore_file_unsafe');return{fd,info,target};}catch(error){fs.closeSync(fd);throw error;}
}
export function hashCipherRestauracio(held,expected){
 if(!/^[a-f0-9]{64}$/.test(expected))fail('restore_cipher_pin_invalid');
 const magic=Buffer.from('age-encryption.org/v1\n'),header=Buffer.alloc(magic.length);if(fs.readSync(held.fd,header,0,header.length,0)!==magic.length||!header.equals(magic))fail('restore_cipher_header_invalid');
 const h=createHash('sha256'),buffer=Buffer.alloc(1024*1024);let offset=0,read;
 while((read=fs.readSync(held.fd,buffer,0,buffer.length,offset))>0){h.update(buffer.subarray(0,read));offset+=read;}
 if(h.digest('hex')!==expected||!same(fields(held.info),fields(fs.fstatSync(held.fd))))fail('restore_cipher_pin_mismatch');return true;
}
function assertHeld(held){if(!same(fields(held.info),fields(fs.fstatSync(held.fd))))fail('restore_input_changed');}
function env(database){return{PATH:'/usr/bin:/bin',LC_ALL:'C',PGHOST:SOCKET,PGPORT:'5432',PGUSER:'javi',PGDATABASE:database,PGPASSFILE:'/dev/null',PGSERVICEFILE:'/dev/null',PGCONNECT_TIMEOUT:'5',PGOPTIONS:'-c log_statement=none -c log_min_error_statement=panic -c log_min_messages=panic -c log_parameter_max_length=0 -c log_parameter_max_length_on_error=0'};}
function command(binary,args,database='postgres',timeout=20000){return new Promise((resolve,reject)=>{
 const child=spawn(binary,args,{env:env(database),shell:false,stdio:['ignore','pipe','ignore']}),chunks=[];let length=0,invalid=false;
 const timer=setTimeout(()=>{invalid=true;child.kill('SIGKILL');},timeout);
 child.stdout.on('data',chunk=>{length+=chunk.length;if(length>512*1024){invalid=true;child.kill('SIGKILL');}else chunks.push(Buffer.from(chunk));});
 child.on('error',()=>{invalid=true;});child.on('close',code=>{clearTimeout(timer);if(invalid||code!==0)return reject(new Error('restore_command_failed'));try{resolve(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks,length)).trim());}catch{reject(new Error('restore_command_protocol'));}});
});}
function json(text){try{return JSON.parse(text);}catch{fail('restore_command_protocol');}}
const CONTROL=['-X','-w','-qAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=sqlstate','--dbname=postgres'];
function control(sql){return command(POSTGRES_BIN+'psql',[...CONTROL,'-c',sql]);}
function ownershipQuery(name){if(!nomRestauracioValid(name))fail('restore_database_name_invalid');return`SELECT row_to_json(t) FROM (SELECT oid::text AS oid,pg_get_userbyid(datdba) AS owner,shobj_description(oid,'pg_database') AS proof FROM pg_database WHERE datname='${name}') t`;}
export async function restauraAmbIdentitatPipe(cipher,identity,name,{spawnImpl=spawn,timeoutMs=180000}={}){
 let decrypt,restore,timer,failed=false;
 const stop=()=>{failed=true;decrypt?.kill('SIGKILL');restore?.kill('SIGKILL');};
 try{
  if(!nomRestauracioValid(name)||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>180000)fail('restore_database_name_invalid');
  assertHeld(cipher);validaIdentitatAgeMemoria(identity);
  decrypt=spawnImpl(AGE,['--decrypt','--identity','/dev/fd/3'],{env:env(name),shell:false,stdio:[cipher.fd,'pipe','ignore','pipe']});decrypt.once('error',stop);
  restore=spawnImpl(POSTGRES_BIN+'pg_restore',['-w','--no-owner','--no-privileges','--exit-on-error','--single-transaction','--dbname='+name],{env:env(name),shell:false,stdio:['pipe','ignore','ignore']});restore.once('error',stop);
  const done=child=>new Promise((resolve,reject)=>{child.once('error',()=>{stop();reject(new Error('restore_stream_failed'));});child.once('close',code=>{if(code!==0){stop();reject(new Error('restore_stream_failed'));}else resolve();});});
  const completions=Promise.allSettled([done(decrypt),done(restore)]);
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{stop();reject(new Error('restore_stream_failed'));},timeoutMs);});
  decrypt.stdio[3].on('error',stop);decrypt.stdout.on('error',stop);restore.stdin.on('error',stop);
  decrypt.stdio[3].end(identity);decrypt.stdout.pipe(restore.stdin);
  const results=await Promise.race([completions,deadline]);if(failed||results.some(value=>value.status!=='fulfilled'))fail('restore_stream_failed');assertHeld(cipher);
 }catch{stop();fail('restore_stream_failed');}
 finally{clearTimeout(timer);decrypt?.stdout?.unpipe(restore?.stdin);decrypt?.stdio?.[3]?.destroy();identity?.fill(0);}
}

function nativeRuntime(cipher,identity){return{
 [REAL]:true,
 async versions(){const value=await command(POSTGRES_BIN+'pg_restore',['--version']);if(!/\b17\./.test(value))fail('restore_pg_version_unsupported');},
 async create(name){if(!nomRestauracioValid(name))fail('restore_database_name_invalid');await command(POSTGRES_BIN+'createdb',['-w','--template=template0','--encoding=UTF8','--locale=C','--maintenance-db=postgres',name]);},
 async mark(name,token){return json(await control(`COMMENT ON DATABASE "${name}" IS '${token}'; ${ownershipQuery(name)};`));},
 async owned(name){return json(await control(ownershipQuery(name)));},
 async drop(name){if(!nomRestauracioValid(name))fail('restore_database_name_invalid');await command(POSTGRES_BIN+'dropdb',['-w','--maintenance-db=postgres',name]);},
 async restore(name){
  return restauraAmbIdentitatPipe(cipher,identity,name);
 },
 async counts(name){return json(await command(POSTGRES_BIN+'psql',['-X','-w','-qAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=sqlstate','--dbname='+name,'-c',`SELECT json_build_object('database',current_database(),'serverMajor',current_setting('server_version_num')::int/10000,'tables',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname IN ('public','node0','private','auth')),'migrations',(SELECT count(*) FROM node0.schema_migrations),'publicDocuments',(SELECT count(*) FROM node0.public_documents),'profiles',(SELECT count(*) FROM public.profiles),'notes',(SELECT count(*) FROM public.notes),'appContent',(SELECT count(*) FROM public.app_content));`],name));}
};}

/** Fixture runtimes never assert native proof; the CLI creates its runtime internally. */
export async function provaRestauracioAmbRuntime(runtime,{suffix=randomBytes(8).toString('hex'),token=randomBytes(16).toString('hex')}={}){
 const name='node0_restore_'+suffix;if(!nomRestauracioValid(name)||!/^[a-f0-9]{32}$/.test(token))fail('restore_database_name_invalid');
 let created=false,owner=null,result=null,failure=null,dropped=false;
 try{
  await runtime.versions();await runtime.create(name);created=true;owner=await runtime.mark(name,token);
  if(!owner||!/^[0-9]+$/.test(owner.oid??'')||owner.owner!=='javi'||owner.proof!==token)fail('restore_ownership_unproven');
  await runtime.restore(name);const counts=await runtime.counts(name);
  if(!counts||counts.database!==name||counts.serverMajor!==17||counts.migrations!==75||!Number.isInteger(counts.tables)||counts.tables<1||['publicDocuments','profiles','notes','appContent'].some(key=>!Number.isInteger(counts[key])||counts[key]<0))fail('restore_counts_invalid');
  const safeCounts=Object.fromEntries(['serverMajor','tables','migrations','publicDocuments','profiles','notes','appContent'].map(key=>[key,counts[key]]));result={counts:safeCounts,restoreCommandsSucceeded:true,nativeRestoreVerified:runtime[REAL]===true,cleanMachineRestoreVerified:false,aclRestored:false,rolesChanged:false,plaintextDumpWritten:false,privateKeyLogged:false,privateIdentityFileRead:false,identityTransport:'anonymous-pipe',externalCustodyVerified:false,r5CustodyClosed:false};
 }catch(error){failure=error;}
 finally{
  if(created&&owner&&owner.owner==='javi'&&owner.proof===token){
   try{const current=await runtime.owned(name);if(!current||current.oid!==owner.oid||current.owner!==owner.owner||current.proof!==owner.proof)fail('restore_cleanup_ownership_changed');await runtime.drop(name);dropped=true;}catch{failure=new Error('restore_owned_cleanup_refused_or_failed');}
  }else if(created)failure=new Error('restore_ownership_unproven_cleanup_refused');
 }
 if(failure)throw Object.assign(new Error(/^restore_[a-z_]+$/.test(failure?.message??'')?failure.message:'restore_failed'),{newDisposableDatabaseCreated:created,ownedDisposableDatabaseDropped:dropped});
 return{...result,newDisposableDatabaseCreated:created,ownedDisposableDatabaseDropped:dropped};
}
export async function verificaRestauracioNodeZero(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).some(key=>!['ciphertextPath','expectedSha256','apply','identityStdin'].includes(key)))fail('restore_options_invalid');
 if(typeof value.ciphertextPath!=='string'||!path.isAbsolute(value.ciphertextPath)||!value.ciphertextPath.endsWith('.dump.age')||/[\r\n\0]/.test(value.ciphertextPath)||!/^[a-f0-9]{64}$/.test(value.expectedSha256??''))fail('restore_input_required');
 if(value.identityStdin!==undefined&&typeof value.identityStdin!=='boolean')fail('restore_options_invalid');
 if(value.apply!==undefined&&typeof value.apply!=='boolean')fail('restore_options_invalid');
 if(value.apply!==true)return{apply:false,newDatabasePattern:'node0_restore_<16hex>',template:'template0',willWritePlaintextDump:false,identityPipeRequired:true,privateIdentityFileAccepted:false,externalCustodyVerified:false,r5CustodyClosed:false,cleanMachineRestoreVerified:false};
 if(value.identityStdin!==true)fail('restore_identity_pipe_required');
 if(process.platform!=='darwin'||os.arch()!=='arm64'||os.homedir()!==HOME||os.userInfo().username!=='javi'||!Object.values(os.networkInterfaces()).flat().some(item=>item?.address==='192.168.0.23'))fail('restore_node0_machine_required');
 exigeixAbsenciaIdentitatLocal({homeDir:HOME});
 const held=[];let identity=null;
 try{
  const cipher=obriRegularRestauracio(value.ciphertextPath);held.push(cipher.fd);hashCipherRestauracio(cipher,value.expectedSha256);
  identity=await llegeixIdentitatAgePipe(process.stdin);
  const binary=obriRegularRestauracio(AGE,{mode:0o755,minBytes:1,maxBytes:16*1024*1024});held.push(binary.fd);
  if(createHash('sha256').update(fs.readFileSync(binary.fd)).digest('hex')!==AGE_SHA)fail('restore_age_binary_pin');
  for(const name of['createdb','dropdb','pg_restore','psql']){const tool=obriRegularRestauracio(POSTGRES_BIN+name,{mode:0o755,minBytes:1,maxBytes:32*1024*1024});held.push(tool.fd);}
  return await provaRestauracioAmbRuntime(nativeRuntime(cipher,identity));
 }finally{identity?.fill(0);for(const fd of held)fs.closeSync(fd);}
}
export async function mainRestauracio(argv=process.argv.slice(2)){
 try{
  const input={};for(let index=0;index<argv.length;index++){const arg=argv[index];if(arg==='--apply'||arg==='--identity-stdin'){const key=arg==='--apply'?'apply':'identityStdin';if(input[key]!==undefined)fail('restore_arguments_invalid');input[key]=true;}else{const name={'--ciphertext':'ciphertextPath','--sha256':'expectedSha256'}[arg];if(!name||input[name]!==undefined||!argv[index+1])fail('restore_arguments_invalid');input[name]=argv[++index];}}
  process.stdout.write(JSON.stringify(await verificaRestauracioNodeZero(input))+'\n');
 }catch(error){process.stderr.write(JSON.stringify({ok:false,error:/^(?:restore_[a-z_]+|custody_legacy_local_identity_present|custody_metadata_unproven)$/.test(error?.message??'')?error.message:'restore_failed',newDisposableDatabaseCreated:error?.newDisposableDatabaseCreated===true,ownedDisposableDatabaseDropped:error?.ownedDisposableDatabaseDropped===true})+'\n');process.exitCode=1;}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await mainRestauracio();
