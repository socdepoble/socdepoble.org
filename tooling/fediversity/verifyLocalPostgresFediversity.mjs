/** Local native evidence only: no remote server, deployment or physical3-2-1 claim. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {createInterface} from 'node:readline';
import {fileURLToPath, pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

export const EVIDENCE_SCHEMA = 'sdp.fediversity.local-native-postgres.v1';
export const hash = value => createHash('sha256').update(value).digest('hex');
// Legacy R56 labs and the single R15.2 clone only. Dot-prefixed cache leaves
// are legal; path traversal, aliases escaping the allowlist and symlink leaves
// remain forbidden. Never accept an arbitrary caller-provided filesystem root.
export function isPrivateLaboratoryPath(value) {
  return typeof value === 'string' && path.isAbsolute(value)
    && !value.split('/').some(part => part === '.' || part === '..')
    && /^\/(?:private\/)?tmp\/sdp_(?:r56_[A-Za-z0-9_-]+|codex_r15_2)(?:\/[A-Za-z0-9_.-]+)*$/.test(value);
}
export function privateDirectory(value) {
  if (!isPrivateLaboratoryPath(value)) throw Error('explicit_private_tmp_required');
  const real = fs.realpathSync(value);
  if (!isPrivateLaboratoryPath(real) || !fs.lstatSync(value).isDirectory() || fs.lstatSync(value).isSymbolicLink()) throw Error('physical_private_directory_required');
  return value;
}
export function libpqEnvironment({work, socket, database, user = 'r56_fixture', port = '5432'}) {
  privateDirectory(work); privateDirectory(socket);
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(database) || !/^[a-z][a-z0-9_]{0,62}$/.test(user) || !/^\d{1,5}$/.test(port)) throw Error('invalid_local_connection_identity');
  const emptyPass = path.join(work, 'empty.pgpass'), emptyService = path.join(work, 'empty.pg_service.conf');
  for (const file of [emptyPass, emptyService]) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, '', {flag:'wx', mode:0o600});
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.mode & 0o077 || stat.size !== 0) throw Error('private_empty_connection_file_required');
  }
  return {PATH:'/usr/bin:/bin:/usr/sbin:/sbin', LC_ALL:'C', LANG:'C', TMPDIR:work,
    PGHOST:socket, PGPORT:port, PGUSER:user, PGDATABASE:database, PGCONNECT_TIMEOUT:'3',
    PGPASSFILE:emptyPass, PGSERVICEFILE:emptyService, PGSYSCONFDIR:work, PGSSLMODE:'disable', PGAPPNAME:'r56-local-fixture'};
}
export class PsqlSession {
  constructor(bin, env, {timeoutMs = 15000} = {}) {
    this.timeoutMs = timeoutMs; this.pending = null; this.stderr = ''; this.closed = false;
    this.child = spawn(bin, ['-X','-w','-qAt','--set','ON_ERROR_STOP=off','--set','VERBOSITY=verbose'], {env, stdio:['pipe','pipe','pipe']});
    this.lines = createInterface({input:this.child.stdout});
    this.lines.on('line', line => {
      const p = this.pending; if (!p) return;
      if (line.startsWith(p.stateTag + ' ')) p.sqlstate = line.slice(p.stateTag.length + 1);
      else if (line.startsWith(p.errorTag + ' ')) p.lastError = line.slice(p.errorTag.length + 1);
      else if (line === p.doneTag) {
        this.pending = null; clearTimeout(p.timer);
        p.resolve({sqlstate:p.sqlstate, lastError:p.sqlstate === '00000' ? null : p.lastError,
          lines:p.lines, startedAt:p.startedAt, finishedAt:new Date().toISOString()});
      } else p.lines.push(line);
    });
    this.child.stderr.on('data', bytes => { this.stderr += bytes.toString(); });
    this.child.on('error', error => this.fail(error));
    this.child.on('close', code => { this.closed = true; this.fail(Error('psql_closed:' + code)); });
  }
  fail(error) { const p = this.pending; if (p) {this.pending = null; clearTimeout(p.timer); p.reject(error);} }
  query(sql) {
    if (this.pending || this.closed) return Promise.reject(Error('psql_busy_or_closed'));
    const id = randomUUID().replaceAll('-','');
    return new Promise((resolve,reject) => {
      const p = {resolve,reject,lines:[],stateTag:'R56_STATE_' + id,errorTag:'R56_ERROR_' + id,doneTag:'R56_DONE_' + id,startedAt:new Date().toISOString()};
      p.timer = setTimeout(() => {this.fail(Error('psql_statement_timeout')); this.child.kill('SIGTERM');}, this.timeoutMs);
      this.pending = p;
      this.child.stdin.write(sql + '\n\\echo ' + p.stateTag + ' :SQLSTATE\n\\echo ' + p.errorTag + ' :LAST_ERROR_MESSAGE\n\\echo ' + p.doneTag + '\n');
    });
  }
  async ok(sql) { const r = await this.query(sql); assert.equal(r.sqlstate,'00000',r.lastError ?? this.stderr); return r; }
  async json(sql) { const r = await this.ok(sql); if (r.lines.length !== 1) throw Error('one_json_row_required'); return JSON.parse(r.lines[0]); }
  async close() {
    if (this.closed) return; this.child.stdin.end('\\q\n');
    await new Promise(resolve => {this.child.once('close',resolve); const timer=setTimeout(() => this.child.kill('SIGTERM'),2000); this.child.once('close',()=>clearTimeout(timer));});
    this.lines.close();
  }
}

function command(bin,args,{env,input,timeout=120000}={}) {
  const result=spawnSync(bin,args,{env,input,encoding:'utf8',timeout,maxBuffer:16*1024*1024});
  if (result.error || result.status !== 0) throw Error(path.basename(bin) + '_failed:' + (result.error?.message ?? result.stderr.slice(-2000)));
  return result.stdout;
}
const literal = value => "'" + String(value).replaceAll("'","''") + "'";
const identity = {tenant:'00000000-0000-4000-8000-000000000101', owner:'00000000-0000-4000-8000-000000000001', targetA:'00000000-0000-4000-8000-000000000002', targetB:'00000000-0000-4000-8000-000000000003', foreign:'00000000-0000-4000-8000-000000000004'};

async function authenticate(session, uid, role = 'authenticated') {
  await session.ok('BEGIN ISOLATION LEVEL READ COMMITTED;');
  await session.ok(`SELECT set_config('request.jwt.claim.sub',${literal(uid ?? '')},true),set_config('request.jwt.claims',${literal(JSON.stringify({sub:uid,role,aal:'aal1'}))},true);`);
  await session.ok('SET LOCAL ROLE ' + role + ';');
  return session.json("SELECT json_build_object('backendPid',pg_backend_pid(),'role',current_user,'actor',auth.uid(),'transactionStartedAt',transaction_timestamp());");
}
async function concurrentTrial({A,B,rpcA,rpcB,expectedState,expectedMessage,operation,loserOutcome='conflict'}) {
  const server = session=>session.json("SELECT json_build_object('systemIdentifier',(pg_control_system()).system_identifier::text,'databaseOid',(SELECT oid::text FROM pg_database WHERE datname=current_database()));");
  const aServer=await server(A),bServer=await server(B);assert.deepEqual(aServer,bServer);
  const aIdentity = await authenticate(A, identity.owner), bIdentity = await authenticate(B, identity.owner);
  assert.notEqual(aIdentity.backendPid,bIdentity.backendPid); assert.equal(aIdentity.role,'authenticated'); assert.equal(bIdentity.role,'authenticated');
  const winner = await A.query(rpcA); assert.equal(winner.sqlstate,'00000',winner.lastError);
  await A.ok('RESET ROLE;');
  const loserPromise = B.query(rpcB); loserPromise.catch(()=>{});
  let observed = null;
  const deadline = performance.now() + 5000;
  while (performance.now() < deadline) {
    await A.ok('SELECT pg_stat_clear_snapshot();');
    const row = await A.json(`SELECT json_build_object('pid',pid,'state',state,'waitType',wait_event_type,'waitEvent',wait_event,'blockers',pg_blocking_pids(pid),'transactionStartedAt',xact_start,'queryStartedAt',query_start) FROM pg_stat_activity WHERE pid=${bIdentity.backendPid};`);
    if (row.waitType === 'Lock' && row.waitEvent === 'advisory' && row.blockers.includes(aIdentity.backendPid)) {observed=row; break;}
    await new Promise(resolve=>setTimeout(resolve,15));
  }
  assert(observed,'The second actual backend must be observed waiting on the first advisory lock');
  await A.ok('COMMIT;'); const committedAt=new Date().toISOString();
  const loser=await loserPromise; assert.equal(loser.sqlstate,expectedState); assert.equal(loser.lastError,expectedMessage);
  await B.ok('ROLLBACK;'); const rolledBackAt=new Date().toISOString();
  return {operation,sessions:[{connectionId:'A',...aIdentity,...aServer,sql:rpcA,rpc:winner,outcome:'committed',transactionFinishedAt:committedAt},{connectionId:'B',...bIdentity,...bServer,sql:rpcB,rpc:loser,outcome:loserOutcome,transactionFinishedAt:rolledBackAt}],observedWait:observed,distinctBackendPids:true,transactionOverlapObserved:true,rpcIntervalsClaim:'Client-observed RPC intervals: first RPC finishes while its transaction retains lock; second RPC waits. RPC statement overlap is not claimed.'};
}

export async function verifyLocalPostgresFediversity({root,postgresBin,work,onEvent=()=>{}}) {
  privateDirectory(root); privateDirectory(postgresBin); privateDirectory(work);
  const data=path.join(work,'data'),socket=path.join(work,'socket'); fs.mkdirSync(socket,{mode:0o700});
  const env=libpqEnvironment({work,socket,database:'socdepoble_node0'}),pg=name=>path.join(postgresBin,name),psql=(sql,database=env.PGDATABASE)=>command(pg('psql'),['-X','-w','-qAt','--set','ON_ERROR_STOP=1','--file','-'],{env:{...env,PGDATABASE:database},input:sql});
  const progress={schema:EVIDENCE_SCHEMA,at:new Date().toISOString(),collectorSourceSha256:hash(fs.readFileSync(fileURLToPath(import.meta.url))),evidenceKind:'local-synthetic-native',operationalEvidenceAccepted:false,fediversity100Accredited:false,root,work,steps:[],cleanup:{serverStopped:false},fixtureBoundary:'Canonical Node0 auth/storage/realtime compatibility, generated users and data; audited RPCs and migration bodies remain canonical.'};
  const note=(stage,detail={})=>{progress.steps.push({at:new Date().toISOString(),stage,...detail});onEvent(stage,detail);};
  let started=false,A,B;
  try {
    progress.versions={postgres:command(pg('postgres'),['--version'],{env}).trim(),pg_dump:command(pg('pg_dump'),['--version'],{env}).trim(),age:null};
    assert.match(progress.versions.postgres,/PostgreSQL\) 17\.11/);
    command(pg('initdb'),['-D',data,'--username=r56_fixture','--auth-local=trust','--auth-host=reject','--encoding=UTF8','--locale=C','--data-checksums'],{env});
    fs.appendFileSync(path.join(data,'postgresql.conf'),`\nlisten_addresses = ''\nunix_socket_directories = '${socket}'\nunix_socket_permissions = 0700\nshared_preload_libraries = ''\nlocal_preload_libraries = ''\nmax_connections = 12\n`);
    command(pg('pg_ctl'),['-D',data,'-l',path.join(work,'postgres.log'),'-w','start'],{env}); started=true;
    command(pg('createdb'),['--template=template0','socdepoble_node0'],{env:{...env,PGDATABASE:'postgres'}});
    progress.server=JSON.parse(psql("SELECT json_build_object('version',version(),'systemIdentifier',(pg_control_system()).system_identifier::text,'databaseOid',(SELECT oid::text FROM pg_database WHERE datname=current_database()),'listen',current_setting('listen_addresses'),'socket',current_setting('unix_socket_directories'),'checksums',current_setting('data_checksums'));").trim()); assert.equal(progress.server.listen,''); assert.equal(progress.server.socket,socket); assert.equal(progress.server.checksums,'on'); note('native-cluster',progress.server);
    const {creaPlaMigracions,generaSql}=await import(pathToFileURL(path.join(root,'tooling/node0/hidrata-postgres-node0.mjs')));
    const plan=creaPlaMigracions({root}); const sourcePins=plan.migrations.map(m=>({file:m.file,sha256:m.sha256})).sort((a,b)=>a.file<b.file?-1:a.file>b.file?1:0);
    psql(generaSql(plan,null)); psql(generaSql(plan,null));
    const ledger=JSON.parse(psql("SELECT json_agg(json_build_object('file',file,'sha256',sha256) ORDER BY version) FROM node0.schema_migrations;").trim()); assert.deepEqual(ledger,sourcePins);progress.migrations={count:ledger.length,pins:sourcePins,applicationOrder:plan.migrations.map(m=>m.file),orderSha256:plan.orderSha256,appliedExactlyOnce:true,ledgerSha256:hash(JSON.stringify(ledger))};
    progress.extensions=JSON.parse(psql('SELECT json_agg(json_build_object(\'name\',extname,\'version\',extversion) ORDER BY extname) FROM pg_extension;').trim()); assert(progress.extensions.some(e=>e.name==='pgcrypto'));note('canonical-migrations',{count:ledger.length,extensions:progress.extensions});
    const ids=[identity.owner,identity.targetA,identity.targetB,identity.foreign];
    psql(`ALTER TABLE auth.users DISABLE TRIGGER USER; INSERT INTO auth.users(id,email) VALUES ${ids.map((id,i)=>`(${literal(id)},'fixture${i}@example.invalid')`).join(',')}; ALTER TABLE auth.users ENABLE TRIGGER USER; INSERT INTO public.towns(id,slug,name) VALUES(${literal(identity.tenant)},'r56-fixture','R56 fixture'); INSERT INTO public.profiles(id,full_name) VALUES ${ids.map((id,i)=>`(${literal(id)},'Fixture ${i}')`).join(',')}; INSERT INTO public.town_memberships(town_id,user_id) VALUES ${ids.map(id=>`(${literal(identity.tenant)},${literal(id)})`).join(',')}; INSERT INTO public.app_content(tenant_id,key,payload,version) VALUES(${literal(identity.tenant)},'feedPosts',${literal(JSON.stringify([{id:'r56-seed',owner_user_id:identity.owner}]))}::jsonb,1);`);
    A=new PsqlSession(pg('psql'),env); B=new PsqlSession(pg('psql'),env);
    const seedRpc=title=>`SELECT public.desa_revisio_seed(${literal(identity.tenant)},'mur','r56-seed',${literal(JSON.stringify({title}))}::jsonb,0,1);`;
    progress.sql80=await concurrentTrial({A,B,rpcA:seedRpc('Winner'),rpcB:seedRpc('Loser'),expectedState:'40001',expectedMessage:'SDP-SEED-003: conflicte de versió.',operation:'public.desa_revisio_seed / SQL80'});
    const seed=JSON.parse(psql("SELECT json_build_object('rows',count(*),'version',max(version),'title',max(payload->>'title')) FROM public.seed_revisions WHERE seed_id='r56-seed';").trim());assert.deepEqual(seed,{rows:1,version:1,title:'Winner'});progress.sql80.final=seed;note('sql80-two-native-connections',{winnerRows:seed.rows,version:seed.version});
    psql(`INSERT INTO private.seguiments_altes(seguidor,al) SELECT ${literal(identity.owner)},clock_timestamp()-interval '30 seconds' FROM generate_series(1,29);`);
    const follow=id=>`SELECT public.segueix('persona',${literal(id)}::uuid,null);`;
    progress.p210=await concurrentTrial({A,B,rpcA:follow(identity.targetA),rpcB:follow(identity.targetB),expectedState:'42900',expectedMessage:'SDP-SEG-006: has fet massa seguiments nous en poc de temps.',operation:'public.segueix / P2-10',loserOutcome:'quota-denied'});
    const quota=JSON.parse(psql(`SELECT json_build_object('admissions',(SELECT count(*) FROM private.seguiments_altes WHERE seguidor=${literal(identity.owner)}),'living',(SELECT count(*) FROM public.seguiments WHERE seguidor=${literal(identity.owner)} AND deixat_al IS NULL));`).trim());assert.deepEqual(quota,{admissions:30,living:1}); progress.p210.final=quota;
    await authenticate(A,identity.owner);await A.ok(`SELECT public.deixa_de_seguir('persona',${literal(identity.targetA)}::uuid,null);`);await A.ok('COMMIT;');
    await authenticate(A,identity.owner);const afterRemoval=await A.query(follow(identity.targetB));assert.equal(afterRemoval.sqlstate,'42900');await A.ok('ROLLBACK;');progress.p210.afterRemoval=JSON.parse(psql(`SELECT json_build_object('admissions',(SELECT count(*) FROM private.seguiments_altes WHERE seguidor=${literal(identity.owner)}),'living',(SELECT count(*) FROM public.seguiments WHERE seguidor=${literal(identity.owner)} AND deixat_al IS NULL));`).trim());assert.deepEqual(progress.p210.afterRemoval,{admissions:30,living:0});note('p210-two-native-connections',progress.p210.afterRemoval);
    progress.negatives=[];
    for(const [name,uid,role,sql,state]of[['anonymous-seed',null,'anon',seedRpc('Denied'),'42501'],['foreign-seed',identity.foreign,'authenticated',seedRpc('Denied'),'42501'],['source-version-changed',identity.owner,'authenticated',`SELECT public.desa_revisio_seed(${literal(identity.tenant)},'mur','r56-seed','{"title":"No"}'::jsonb,1,2);`,'40001'],['private-quota-table',identity.owner,'authenticated','SELECT count(*) FROM private.seguiments_altes;','42501']]){await authenticate(A,uid,role);const r=await A.query(sql);assert.equal(r.sqlstate,state,name);await A.ok('ROLLBACK;');progress.negatives.push({name,sqlstate:r.sqlstate,denied:true});}
    await A.close();A=null;await B.close();B=null;note('authorization-negatives',{count:progress.negatives.length});
    const fingerprint=database=>JSON.parse(psql(`CREATE FUNCTION pg_temp.r56_snapshot() RETURNS jsonb LANGUAGE plpgsql AS $r56$ DECLARE r record; rows jsonb; result jsonb:='{}'; BEGIN FOR r IN SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p') AND n.nspname IN ('public','private','auth','storage','realtime','node0') ORDER BY n.nspname,c.relname LOOP EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),''[]''::jsonb) FROM %I.%I t',r.nspname,r.relname) INTO rows; result:=result||jsonb_build_object(r.nspname||'.'||r.relname,rows); END LOOP; RETURN result; END $r56$; SELECT jsonb_build_object('tables',pg_temp.r56_snapshot(),'seedFunction',pg_get_functiondef('public.desa_revisio_seed(uuid,text,text,jsonb,integer,integer)'::regprocedure),'followFunction',pg_get_functiondef('public.segueix(text,uuid,uuid)'::regprocedure),'privileges',jsonb_build_object('seedAnon',has_function_privilege('anon','public.desa_revisio_seed(uuid,text,text,jsonb,integer,integer)','EXECUTE'),'seedAuth',has_function_privilege('authenticated','public.desa_revisio_seed(uuid,text,text,jsonb,integer,integer)','EXECUTE'),'followAnon',has_function_privilege('anon','public.segueix(text,uuid,uuid)','EXECUTE'),'followAuth',has_function_privilege('authenticated','public.segueix(text,uuid,uuid)','EXECUTE')));`,database).trim());
    const source=fingerprint(env.PGDATABASE),dump=path.join(work,'native.dump');
    command(pg('pg_dump'),['--format=custom','--no-owner','--file',dump],{env});const dumpBytes=fs.readFileSync(dump);assert.equal(dumpBytes.subarray(0,5).toString(),'PGDMP');assert.deepEqual(fingerprint(env.PGDATABASE),source);
    const restoreInput=dump;progress.backup={nativePgDump:true,dumpSha256:hash(dumpBytes),dumpBytes:dumpBytes.length,nativeAge:false,encrypted:false,physical321Accredited:false,physicalMediaVerified:0,offsiteCustodyVerified:false,pending:'This collector verifies native plain PostgreSQL restoration only; age encryption and physical3-2-1 custody need separate evidence.'};
    command(pg('createdb'),['--template=template0','r56_restored'],{env:{...env,PGDATABASE:'postgres'}});
    const empty=Number(psql("SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p') AND n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%';",'r56_restored').trim());assert.equal(empty,0);
    command(pg('pg_restore'),['--no-owner','--exit-on-error','--dbname=r56_restored',restoreInput],{env});const restored=fingerprint('r56_restored');assert.deepEqual(restored,source);Object.assign(progress.backup,{databaseInitiallyEmpty:true,nativePostgresRestore:true,restoredDatabase:'r56_restored',tables:Object.keys(source.tables).length,sourceDataSha256:hash(JSON.stringify(source)),restoredDataSha256:hash(JSON.stringify(restored)),migrationLedgerSha256:progress.migrations.ledgerSha256,restoredFunctionsAndAclEqual:true});note('native-clean-restore',progress.backup);
    progress.nativeConcurrencyVerified=true;
  } finally {
    if(A)await A.close();if(B)await B.close();
    if(started||fs.existsSync(path.join(data,'postmaster.pid'))){command(pg('pg_ctl'),['-D',data,'-m','fast','-w','stop'],{env});progress.cleanup.serverStopped=true;}
    progress.cleanup.postmasterPidfileAbsent=!fs.existsSync(path.join(data,'postmaster.pid'));
    progress.cleanup.observedAt=new Date().toISOString(); onEvent('cleanup',progress.cleanup);
  }
  return progress;
}

async function main() {
  const o={};for(let i=2;i<process.argv.length;i+=2){if(!['--root','--toolchain','--out','--work'].includes(process.argv[i])||!process.argv[i+1]||o[process.argv[i]])throw Error('explicit_arguments_required');o[process.argv[i]]=process.argv[i+1];}
  if(!o['--root']||!o['--toolchain']||!o['--out'])throw Error('explicit_arguments_required');const toolchain=JSON.parse(fs.readFileSync(o['--toolchain']));
  let work;
  if(o['--work'])work=privateDirectory(o['--work']);
  else{const cache=path.join(privateDirectory(o['--root']),'node_modules/.cache');fs.mkdirSync(cache,{recursive:true,mode:0o700});privateDirectory(cache);work=fs.mkdtempSync(path.join(cache,'sdp-fediversity-native-'));}
  const result=await verifyLocalPostgresFediversity({root:o['--root'],postgresBin:toolchain.postgresBin,work,onEvent:(stage,detail)=>{const fd=fs.openSync(o['--out']+'.events.jsonl','a');try{fs.writeSync(fd,JSON.stringify({at:new Date().toISOString(),stage,...detail})+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}});const fd=fs.openSync(o['--out'],'wx');try{fs.writeSync(fd,JSON.stringify(result,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}console.log(JSON.stringify(result));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error);process.exitCode=1;});
