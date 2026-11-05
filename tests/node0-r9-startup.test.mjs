import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { EventEmitter, getEventListeners } from 'node:events';
import { pathToFileURL } from 'node:url';
import { esperaPostgresNodeZero, errorPostgresTransitori, cancelacioArrencadaNodeZero } from '../tooling/node0/espera-postgres-node0.mjs';

const candidate = new URL('../tooling/node0/', import.meta.url);
const sourceRoot = process.env.SDP_NODE0_R9_SOURCE_ROOT
  ? pathToFileURL(path.resolve(process.env.SDP_NODE0_R9_SOURCE_ROOT)+path.sep) : new URL('../../', candidate);
const sqlError = sqlState => Object.assign(new Error('node0_database_query_failed'), { sqlState });
const flush = async () => { for (let i=0;i<16;i++) await Promise.resolve(); };
function clock() {
  let time=0,id=0;const timers=new Map();
  return { now:()=>time, setTimer:(fn,ms)=>{timers.set(++id,{fn,at:time+ms});return id;},clearTimer:id=>timers.delete(id),
    get pending(){return timers.size;},async advance(ms){const target=time+ms;await flush();for(;;){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>target)break;time=next[1].at;timers.delete(next[0]);next[1].fn();await flush();}time=target;await flush();} };
}
test('unavailable local DB becomes ready with bounded exponential delay and no leftover timer',async()=>{
  const c=clock();let calls=0;const signal=new AbortController().signal;
  const result=esperaPostgresNodeZero({...c,signal,initialDelayMs:10,maxDelayMs:20,timeoutMs:100,probe:async()=>{if(++calls<4)throw sqlError('57P03');return true;}});
  await c.advance(10);assert.equal(calls,2);await c.advance(20);assert.equal(calls,3);await c.advance(20);
  assert.deepEqual(await result,{attempts:4,elapsedMs:50});assert.equal(c.pending,0);assert.equal(getEventListeners(signal,'abort').length,0);
});
test('authority, ACL, schema, syntax, missing binary and unknown errors are final without waiting',async()=>{
  const errors=[new Error('node0_unsafe_runtime_role'),new Error('node0_unsafe_authenticator_grants'),new Error('node0_database_binary_unavailable'),new Error('node0_database_timeout'),sqlError('42501'),sqlError('42P01'),sqlError('42601'),sqlError('28P01'),sqlError('3D000'),new Error('unknown')];
  for(const error of errors){const c=clock();let calls=0;await assert.rejects(esperaPostgresNodeZero({...c,probe:async()=>{calls++;throw error;}}),e=>e===error);assert.equal(calls,1);assert.equal(c.pending,0);}
  assert.equal(errorPostgresTransitori(Object.assign(new Error('node0_unsafe_runtime_role'),{sqlState:'08006'})),false);
  for(const code of ['08000','08006','57P01','57P02','57P03'])assert.equal(errorPostgresTransitori(sqlError(code)),true);
});
test('deadline cancels a real probe signal, stays bounded and never starts a second probe',async()=>{
  const c=clock();let calls=0,aborted=0;
  const result=esperaPostgresNodeZero({...c,timeoutMs:30,probe:({signal})=>{calls++;signal.addEventListener('abort',()=>aborted++,{once:true});return new Promise(()=>{});}});
  const rejection=assert.rejects(result,/^Error: node0_startup_deadline$/);await c.advance(30);await rejection;
  assert.equal(calls,1);assert.equal(aborted,1);assert.equal(c.pending,0);
});
test('abort while sleeping or before entry clears timers and prevents further probes',async()=>{
  for(const before of [false,true]){const c=clock(),abort=new AbortController();let calls=0;if(before)abort.abort();
    const result=esperaPostgresNodeZero({...c,signal:abort.signal,probe:async()=>{calls++;throw sqlError('08006');}});
    const rejection=assert.rejects(result,/node0_startup_aborted/);await flush();abort.abort();await rejection;await c.advance(1000);
    assert.equal(calls,before?0:1);assert.equal(c.pending,0);assert.equal(getEventListeners(abort.signal,'abort').length,0);
  }
});
test('SIGTERM and SIGINT binding is idempotently disposable',()=>{
  for(const name of ['SIGTERM','SIGINT']){const fake=new EventEmitter(),binding=cancelacioArrencadaNodeZero(fake);fake.emit(name);assert.equal(binding.signal.aborted,true);binding.close();binding.close();assert.equal(fake.listenerCount('SIGTERM'),0);assert.equal(fake.listenerCount('SIGINT'),0);}
});

const postgresText=fs.readFileSync(new URL('postgres-node0.mjs',candidate),'utf8').replace(/(['"])(\.\/[^'"]+)\1/g,(_all,_quote,spec)=>JSON.stringify(new URL(spec,new URL('tooling/node0/postgres-node0.mjs',sourceRoot)).href));
const postgresUrl=`data:text/javascript;base64,${Buffer.from(postgresText).toString('base64')}`;
const {creaPostgres}=await import(postgresUrl);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r9-startup-test-'));
const executable=path.join(temp,'TEST_ONLY_psql.mjs');
fs.writeFileSync(executable,`#!${process.execPath}\nimport fs from 'node:fs';\nif(process.env.TEST_ONLY_PID_FILE){process.on('SIGTERM',()=>{});fs.writeFileSync(process.env.TEST_ONLY_PID_FILE,String(process.pid));setInterval(()=>{},1000);}else{process.stdin.resume();process.stdin.on('end',()=>{process.stderr.write(process.env.TEST_ONLY_DIAGNOSTIC||'');process.stdout.write(process.env.TEST_ONLY_RESULT||'');process.exitCode=Number(process.env.TEST_ONLY_EXIT||0);});}\n`,{mode:0o700});
const env={PGDATABASE:'TEST_ONLY_database',PGHOST:path.join(temp,'TEST_ONLY_socket'),PGUSER:'node0_runtime',PGPORT:'5432'};
test.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
async function adapterError(diagnostic,exit=2){const db=creaPostgres({executable,env:{...env,TEST_ONLY_DIAGNOSTIC:diagnostic,TEST_ONLY_EXIT:String(exit)}});try{await db.query('SELECT 1;');assert.fail('expected fixture failure');}catch(error){return error;}}
test('successful adapter query preserves JSON and disposes cancellation listener',async()=>{
  const abort=new AbortController(),expected={ok:true,text:'TEST_ONLY Maçanes'};
  const db=creaPostgres({executable,env:{...env,TEST_ONLY_RESULT:JSON.stringify(expected)}});
  assert.deepEqual(await db.query('SELECT 1;',{signal:abort.signal}),expected);
  assert.equal(getEventListeners(abort.signal,'abort').length,0);abort.abort();
});
test('adapter returns only sanitized SQLSTATE and classifies connection targets narrowly',async()=>{
  for(const code of ['08006','57P03','28P01','42501','42P01','42601']){
    const error=await adapterError(`ERROR: ${code}\nTEST_ONLY_NONCREDENTIAL_PRIVATE_TEXT\n`,1);
    assert.equal(error.message,'node0_database_query_failed');assert.equal(error.sqlState,code);assert.deepEqual(Object.keys(error),['sqlState']);assert.equal(String(error).includes('TEST_ONLY_NONCREDENTIAL'),false);
  }
  for(const reason of ['No such file or directory','Connection refused','timeout expired']){
    const error=await adapterError(`psql: error: connection to server on socket "${env.PGHOST}/.s.PGSQL.5432" failed: ${reason}\n`);
    assert.equal(error.message,'node0_database_transport_unavailable');assert.equal(errorPostgresTransitori(error),true);
  }
  for(const diagnostic of [`psql: error: connection to server on socket "${temp}/OTHER/.s.PGSQL.5432" failed: No such file or directory\n`,'psql: error: FATAL: password authentication failed\n','psql: error: FATAL: database does not exist\n','psql: error: FATAL: role does not exist\n']){
    assert.equal(errorPostgresTransitori(await adapterError(diagnostic)),false);
  }
});
test('missing executable fails closed and exposes no filesystem path',async()=>{
  const db=creaPostgres({env,executable:path.join(temp,'TEST_ONLY_missing_binary')});
  await assert.rejects(db.verificaRol(),e=>e.message==='node0_database_binary_unavailable'&&!String(e).includes(temp)&&!errorPostgresTransitori(e));
});
test('adapter abort reaps the actual child, including one needing SIGKILL',async()=>{
  const pidFile=path.join(temp,'TEST_ONLY_child.pid'),abort=new AbortController();
  const db=creaPostgres({executable,env:{...env,TEST_ONLY_PID_FILE:pidFile},timeoutMs:2000});
  const pending=db.verificaRol({signal:abort.signal});const rejection=assert.rejects(pending,/node0_database_aborted/);
  for(let i=0;i<200&&!fs.existsSync(pidFile);i++)await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(fs.existsSync(pidFile),true);const pid=Number(fs.readFileSync(pidFile,'utf8'));abort.abort();await rejection;
  assert.throws(()=>process.kill(pid,0),e=>e.code==='ESRCH');assert.equal(getEventListeners(abort.signal,'abort').length,0);
});
test('already aborted adapter invocation spawns no child',async()=>{
  const pidFile=path.join(temp,'TEST_ONLY_not_started.pid'),abort=new AbortController();abort.abort();
  const db=creaPostgres({executable,env:{...env,TEST_ONLY_PID_FILE:pidFile}});
  await assert.rejects(db.verificaRol({signal:abort.signal}),/node0_database_aborted/);assert.equal(fs.existsSync(pidFile),false);
});

function mainFixture(databaseFactory){
  globalThis.__SDP_R9_STARTUP_FIXTURE__={creaPostgres:databaseFactory};
  let source=fs.readFileSync(new URL('servidor-node0-soberania.mjs',candidate),'utf8');
  source=source.replace("import { creaPostgres, sqlText, sqlJson } from './postgres-node0.mjs';",`import { sqlText, sqlJson } from ${JSON.stringify(postgresUrl)};const creaPostgres=globalThis.__SDP_R9_STARTUP_FIXTURE__.creaPostgres;`);
  source=source.replace(/(from\s*|import\()(['"])(\.{1,2}\/[^'"]+)\2/g,(_all,prefix,_quote,spec)=>`${prefix}${JSON.stringify(spec==='./espera-postgres-node0.mjs'?new URL('espera-postgres-node0.mjs',candidate).href:new URL(spec,new URL('tooling/node0/servidor-node0-soberania.mjs',sourceRoot)).href)}`);
  return import(`data:text/javascript;base64,${Buffer.from(source+'\n//'+Math.random()).toString('base64')}`);
}
test('main abort during startup performs no key generation/listen and removes startup signal handlers',async()=>{
  let probeStarted=false,listenCalls=0;const originalListen=http.Server.prototype.listen;
  const before=['SIGTERM','SIGINT'].map(name=>process.listenerCount(name));const keyFile=path.join(temp,'TEST_ONLY_aborted_key.json');
  http.Server.prototype.listen=function(){listenCalls++;throw new Error('TEST_ONLY_unexpected_listen');};
  try{
    const {main}=await mainFixture(()=>({verificaRol:({signal})=>{probeStarted=true;return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('node0_database_aborted')),{once:true}));}}));
    const pending=main({SDP_NODE0_KEY_FILE:keyFile});const rejection=assert.rejects(pending,/node0_startup_aborted/);await flush();assert.equal(probeStarted,true);process.emit('SIGTERM');await rejection;
    assert.equal(fs.existsSync(keyFile),false);assert.equal(listenCalls,0);assert.deepEqual(['SIGTERM','SIGINT'].map(name=>process.listenerCount(name)),before);
  }finally{http.Server.prototype.listen=originalListen;delete globalThis.__SDP_R9_STARTUP_FIXTURE__;}
});
test('main checks authenticator authority before any key generation or listen',async()=>{
  let runtime=0,auth=0;const keyFile=path.join(temp,'TEST_ONLY_authority_key.json'),before=['SIGTERM','SIGINT'].map(name=>process.listenerCount(name));
  try{
    const {main}=await mainFixture(({env})=>env.PGUSER==='node0_authenticator'?{verificaRolAutenticador:async()=>{auth++;throw new Error('node0_unsafe_authenticator_grants');}}:{verificaRol:async()=>{runtime++;return true;}});
    await assert.rejects(main({SDP_NODE0_AUTH:'1',SDP_NODE0_KEY_FILE:keyFile}),/node0_unsafe_authenticator_grants/);
    assert.equal(runtime,1);assert.equal(auth,1);assert.equal(fs.existsSync(keyFile),false);assert.deepEqual(['SIGTERM','SIGINT'].map(name=>process.listenerCount(name)),before);
  }finally{delete globalThis.__SDP_R9_STARTUP_FIXTURE__;}
});
