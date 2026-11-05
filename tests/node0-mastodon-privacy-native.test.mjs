/** Native PostgreSQL17 LAB only. Two real runtime-role connections plus an
 * operator observer. No HTTP, credentials, source feeds or production writes.
 * Locks are established by JSON sentinels and pg_blocking_pids, never sleeps.
 * LAB has no runtime peer login: operator sessions enter SET ROLE explicitly.
 * This tests native locks/ACL, not a direct runtime-role peer login.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {EventEmitter} from 'node:events';
import {randomBytes} from 'node:crypto';
import {creaPostgres,sqlText,sqlJson,sqlDesaDocuments} from '../tooling/node0/postgres-node0.mjs';
import {envoltaSqlMastodon,ctesRetiraMastodon,sqlReconciliacioMastodon} from '../tooling/node0/reconciliacio-mastodon-node0.mjs';

const LAB='node0_gauntlet_r4',SOCKET='/Users/javi/socdepoble-node0/dades/run/postgres17';
const PSQL='/Users/javi/local/postgres17/Postgres.app/Contents/Versions/17/bin/psql',ACTOR='https://mastodont.cat/users/depoble';
const enabled=process.env.SDP_NODE0_NATIVE_LAB==='1';
function guard(env){
  if(env.SDP_NODE0_NATIVE_LAB!=='1'||env.PGDATABASE!==LAB||env.PGUSER!=='javi'||env.PGHOST!==SOCKET||(env.PGPORT!==undefined&&env.PGPORT!=='5432')||(env.NODE0_PSQL!==undefined&&env.NODE0_PSQL!==PSQL))throw Error('mastodon_native_exact_lab_required');
  for(const key of['PGPASSWORD','PGHOSTADDR','PGSERVICE','PGSERVICEFILE','PGOPTIONS'])if(Object.hasOwn(env,key))throw Error('mastodon_native_override_rejected');
  return true;
}
test('native Mastodon race guard refuses production and routing overrides before spawn',()=>{
  const safe={SDP_NODE0_NATIVE_LAB:'1',PGDATABASE:LAB,PGUSER:'javi',PGHOST:SOCKET,PGPORT:'5432',NODE0_PSQL:PSQL};assert.equal(guard(safe),true);
  for(const change of[{SDP_NODE0_NATIVE_LAB:'0'},{PGDATABASE:'socdepoble_node0'},{PGUSER:'node0_runtime'},{PGHOST:'127.0.0.1'},{PGHOST:'/tmp'},{PGPORT:'5433'},{NODE0_PSQL:'/other/psql'},{PGPASSWORD:''},{PGOPTIONS:'unused'},{PGSERVICE:'unused'}])assert.throws(()=>guard({...safe,...change}));
});

/** Small persistent-psql harness adapted from node0-auth-native-concurrency.
 * Only safe JSON fixture sentinels leave stdout. No raw SQL diagnostics escape.
 */
class Connection{
  constructor(env){
    this.events=new EventEmitter();this.messages=[];this.buffer='';this.bytes=0;this.closed=false;
    this.child=spawn(PSQL,['-X','-w','-qAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=sqlstate'],{env:{...env,PGCONNECT_TIMEOUT:'5'},stdio:['pipe','pipe','pipe'],shell:false});
    this.child.stderr.resume();this.child.stdin.on('error',()=>{});this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data',chunk=>{
      this.bytes+=Buffer.byteLength(chunk);if(this.bytes>1024*1024){this.child.kill('SIGTERM');return;}this.buffer+=chunk;let end;
      while((end=this.buffer.indexOf('\n'))>=0){const line=this.buffer.slice(0,end);this.buffer=this.buffer.slice(end+1);if(!line.trim())continue;
        try{const value=JSON.parse(line);this.messages.push(value);this.events.emit('message',value);}catch{this.child.kill('SIGTERM');}
      }
    });
    this.child.on('error',()=>this.events.emit('failed'));
    this.finished=new Promise(resolve=>this.child.once('close',code=>{this.closed=true;this.events.emit('failed');resolve(code);}));
    this.child.stdin.write('SET ROLE node0_runtime;\n');
  }
  send(sql){if(this.closed)throw Error('mastodon_native_connection_closed');this.child.stdin.write(sql+'\n');}
  wait(barrier,timeoutMs=12000){
    const existing=this.messages.find(value=>value.barrier===barrier);if(existing)return Promise.resolve(existing);if(this.closed)return Promise.reject(Error('mastodon_native_connection_failed'));
    return new Promise((resolve,reject)=>{
      const cleanup=()=>{clearTimeout(timer);this.events.off('message',onMessage);this.events.off('failed',onFailure);};
      const onMessage=value=>{if(value.barrier===barrier){cleanup();resolve(value);}};
      const onFailure=()=>{cleanup();reject(Error('mastodon_native_connection_failed'));};
      const timer=setTimeout(()=>{cleanup();reject(Error('mastodon_native_barrier_timeout'));},timeoutMs);this.events.on('message',onMessage);this.events.on('failed',onFailure);
    });
  }
  async close(){if(this.closed)return;this.child.stdin.end('ROLLBACK;\n');const timer=setTimeout(()=>this.child.kill('SIGTERM'),1000);try{await this.finished;}finally{clearTimeout(timer);}}
}

test('native Delete race reproduces legacy resurrection and proves the locked fresh-snapshot fix',
  {skip:enabled?false:'Explicit native dedicated LAB only; no connection attempted',timeout:90000},async t=>{
    guard(process.env);
    const env={PGDATABASE:LAB,PGHOST:SOCKET,PGPORT:'5432',PGUSER:'javi',NODE0_PSQL:PSQL,PGPASSFILE:'/dev/null',PATH:'/usr/bin:/bin',LANG:'C'};
    const control=creaPostgres({env}),runtimeEnv={...env};
    const identity=await control.query("SELECT json_build_object('database',current_database(),'operator',session_user,'version',current_setting('server_version_num')::int,'migrations',(SELECT count(*) FROM node0.schema_migrations));");
    assert.equal(identity.database,LAB);assert.equal(identity.operator,'javi');assert.ok(identity.version>=170000&&identity.version<180000);assert.equal(identity.migrations,75);
    const runtime=await control.query("SET ROLE node0_runtime; SELECT json_build_object('role',current_user,'login',session_user,'unsafe',rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication,'members',(SELECT count(*) FROM pg_auth_members WHERE member=pg_roles.oid)) FROM pg_roles WHERE rolname=current_user;");
    assert.deepEqual(runtime,{role:'node0_runtime',login:'javi',unsafe:false,members:0});
    await control.query(fs.readFileSync(new URL('../tooling/node0/schema-node0.sql',import.meta.url),'utf8')+'\nSELECT to_jsonb(true);');
    const ids=Array.from({length:2},()=>String(BigInt('0x'+randomBytes(12).toString('hex'))+1n)),uris=ids.map(id=>ACTOR+'/statuses/'+id),idSql=ids.map(id=>sqlText('mastodon:'+id)).join(','),uriSql=uris.map(sqlText).join(',');
    const collision=await control.query(`SELECT json_build_object('documents',(SELECT count(*) FROM node0.public_documents WHERE source_uri IN (${uriSql}) OR id IN (${idSql})),'tombstones',(SELECT count(*) FROM node0.tombstones WHERE id IN (${uriSql})));`);assert.deepEqual(collision,{documents:0,tombstones:0});
    async function waitBlocked(pid,blocker){
      assert.ok(Number.isSafeInteger(pid)&&pid>0&&Number.isSafeInteger(blocker)&&blocker>0);const end=Date.now()+8000;
      while(Date.now()<end){
        const state=await control.query(`SELECT json_build_object('waiting',wait_event_type='Lock','event',wait_event,'blockers',pg_blocking_pids(pid),'types',(SELECT coalesce(jsonb_agg(DISTINCT locktype),'[]'::jsonb) FROM pg_locks WHERE pid=${pid} AND NOT granted)) FROM pg_stat_activity WHERE pid=${pid};`);
        if(state?.waiting&&state.blockers.includes(blocker))return state;
        // Each iteration observes actual server state; elapsed time never proves
        // a lock or success. The deadline is only a failure bound.
      }throw Error('mastodon_native_expected_blocker_not_observed');
    }
    async function race(index,legacy){
      const id=ids[index],uri=uris[index],doc={id:'mastodon:'+id,uri,body:'Synthetic stale public fixture',source:'mastodon',visibility:'public',created_at:'2026-11-04T19:00:00.000Z',updated_at:'2026-11-04T19:00:00.000Z'};
      await control.query(`INSERT INTO node0.public_documents(kind,id,document,source_uri) VALUES('feedPosts',${sqlText(doc.id)},${sqlJson(doc)},${sqlText(uri)}); SELECT to_jsonb(true);`);
      const a=new Connection({...runtimeEnv,PGAPPNAME:'sdp-r6-delete-owner'}),b=new Connection({...runtimeEnv,PGAPPNAME:'sdp-r6-rest-writer'});
      try{
        const settings="SET statement_timeout='20s'; SET default_transaction_isolation='read committed';";
        a.send(settings);b.send(settings+" SELECT json_build_object('barrier','writer-ready','pid',pg_backend_pid(),'role',current_user,'login',session_user,'isolation',current_setting('transaction_isolation'));");
        const writer=await b.wait('writer-ready');assert.equal(writer.role,'node0_runtime');assert.equal(writer.login,'javi');assert.equal(writer.isolation,'read committed');
        const deleting=`WITH ${ctesRetiraMastodon(uri)} SELECT json_build_object('phase','delete-effect-finished');
          SELECT json_build_object('barrier','delete-held','pid',pg_backend_pid(),'role',current_user,'login',session_user,'tombstoneVisible',EXISTS(SELECT 1 FROM node0.tombstones WHERE id=${sqlText(uri)}),'documentGone',NOT EXISTS(SELECT 1 FROM node0.public_documents WHERE source_uri=${sqlText(uri)}));`;
        const transaction=envoltaSqlMastodon([uri],deleting);assert.equal(transaction.endsWith('COMMIT;'),true);
        // Pause the actual R6 transaction only at its final COMMIT boundary.
        a.send(transaction.slice(0,-'COMMIT;'.length));const holder=await a.wait('delete-held');
        assert.equal(holder.role,'node0_runtime');assert.equal(holder.login,'javi');assert.equal(holder.tombstoneVisible,true);assert.equal(holder.documentGone,true);
        const outside=await control.query(`SELECT json_build_object('tombstones',(SELECT count(*) FROM node0.tombstones WHERE id=${sqlText(uri)}),'documents',(SELECT count(*) FROM node0.public_documents WHERE source_uri=${sqlText(uri)}));`);assert.deepEqual(outside,{tombstones:0,documents:1});
        const writeSql=legacy?sqlDesaDocuments('feedPosts',[doc]):sqlReconciliacioMastodon({publicacions:[doc],retirades:[]});
        b.send(writeSql+"\nSELECT json_build_object('barrier','writer-finished');");const blocked=await waitBlocked(writer.pid,holder.pid);
        assert.equal(b.messages.some(message=>message.barrier==='writer-finished'),false);
        assert.equal(blocked.types.includes('advisory'),!legacy,'fixed writer must wait on the shared URI lock; legacy writer only waits on the deleted row transaction');
        a.send("COMMIT; SELECT json_build_object('barrier','delete-committed');");await a.wait('delete-committed');await b.wait('writer-finished');
        const final=await control.query(`SELECT json_build_object('documents',(SELECT count(*) FROM node0.public_documents WHERE source_uri=${sqlText(uri)}),'tombstones',(SELECT count(*) FROM node0.tombstones WHERE id=${sqlText(uri)}));`);
        assert.equal(final.tombstones,1);assert.equal(final.documents,legacy?1:0);
        t.diagnostic(`${legacy?'Legacy reproduced resurrection':'R6 prevented resurrection'}: PostgreSQL observed writer blocking on ${blocked.types.join(',')} with the deleting connection in pg_blocking_pids.`);
      }finally{await Promise.all([a.close(),b.close()]);}
    }
    try{
      await t.test('legacy actual sqlDesaDocuments resurrects after waiting for an uncommitted Delete',()=>race(0,true));
      await t.test('R6 actual reconciliation waits on URI lock then sees the committed tombstone in a fresh snapshot',()=>race(1,false));
    }finally{
      // Both writer sessions have closed before irreversible cleanup of only
      // these initially absent, generated LAB fixture IDs and URIs.
      await control.query(`BEGIN; DELETE FROM node0.public_documents WHERE kind='feedPosts' AND id IN (${idSql}) AND source_uri IN (${uriSql}); DELETE FROM node0.tombstones WHERE id IN (${uriSql}) AND actor=${sqlText(ACTOR)}; COMMIT; SELECT to_jsonb(true);`);
      const remaining=await control.query(`SELECT json_build_object('documents',(SELECT count(*) FROM node0.public_documents WHERE source_uri IN (${uriSql})),'tombstones',(SELECT count(*) FROM node0.tombstones WHERE id IN (${uriSql})));`);assert.deepEqual(remaining,{documents:0,tombstones:0});
    }
  });
