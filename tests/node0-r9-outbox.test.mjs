import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {drenaOutboxFederadaNodeZero as drain,retardOutboxNodeZero as delay,SQL_ESTAT_OUTBOX_NODE0 as health} from '../tooling/node0/outbox-federada-node0.mjs';
const modulePath=process.env.SDP_PGLITE_MODULE;let PGlite;
if(modulePath)({PGlite}=await import(modulePath.startsWith('file:')?modulePath:pathToFileURL(path.resolve(modulePath)).href));
const target='https://mastodont.cat/users/depoble/inbox',actor='https://socdepoble.cat/ap/actors/socdepoble';
const sqlText=value=>"'"+String(value).replaceAll("'","''")+"'";
async function fixture(t){const pg=new PGlite();t.after(()=>pg.close());await pg.exec('CREATE ROLE node0_runtime;CREATE SCHEMA node0;GRANT USAGE ON SCHEMA node0 TO node0_runtime;');await pg.exec(fs.readFileSync(new URL('../tooling/node0/schema-node0.sql',import.meta.url),'utf8'));await pg.exec('SET ROLE node0_runtime;');
 const db={query:async sql=>{const result=await pg.query(sql);return result.rows[0]?.[Object.keys(result.rows[0])[0]];}};
 const activity=id=>({id:actor+'#TEST_ONLY_'+id,type:'Accept',actor,object:{type:'Follow',id:'https://mastodont.cat/users/depoble#TEST_ONLY_'+id}});
 const seed=async(id,remote=target)=>pg.query("INSERT INTO node0.outbox(id,target,activity,next_attempt) VALUES($1,$2,$3::jsonb,'2000-01-01')",[id,remote,JSON.stringify(activity(id))]);
 const sign=async options=>{assert.equal(options.metode,'POST');assert.equal(options.url,target);assert.equal(options.actorId,actor);assert.equal(options.keyId,actor+'#ed25519');return{'Signature':'TEST_ONLY_SIGNATURE'};};
 return{pg,db,seed,activity,options:{db,privateKey:null,sqlText,sign,now:()=>Date.UTC(2026,10,5)}};}
test('exponential delay is bounded and Retry-After only lengthens it',()=>{
 assert.deepEqual(Array.from({length:8},(_,i)=>delay(i+1)),[300,600,1200,2400,4800,9600,19200,21600]);
 assert.equal(delay(1,{retryAfter:'60'}),300);assert.equal(delay(1,{retryAfter:'3600'}),3600);assert.equal(delay(1,{retryAfter:'9999999999'}),86400);
 assert.equal(delay(1,{retryAfter:'Thu, 05 Nov 2026 01:00:00 GMT',now:Date.UTC(2026,10,5)}),3600);
 for(const value of['-1','0.5','Wed, 99 Nov 2026 99:00:00 GMT','https://bad.invalid/','3600\n','a'.repeat(200)])assert.equal(delay(1,{retryAfter:value}),300);
 for(const attempt of[0,9,-1,1.5,NaN,'1'])assert.throws(()=>delay(attempt));
});
if(!modulePath)test('outbox SQL lifecycle requires an explicit local PGlite module',{skip:'Set SDP_PGLITE_MODULE; no implicit install or SQL proof claimed'},()=>{});
else{
test('successful durable delivery records once and keeps the original ActivityPub id',async t=>{const f=await fixture(t);await f.seed('success');let sends=0;
 const options={...f.options,request:async(url,request)=>{sends++;assert.equal(url,target);assert.deepEqual(JSON.parse(request.body),f.activity('success'));assert.equal(request.timeoutMs,10000);return new Response(null,{status:202});}};
 assert.deepEqual(await drain(options),{claimed:1,delivered:1,retried:0,exhausted:0,claimLost:0});assert.equal((await drain(options)).claimed,0);assert.equal(sends,1);
 const row=(await f.pg.query('SELECT attempts,delivered_at IS NOT NULL AS delivered,lease_until IS NULL AND lease_owner IS NULL AS released FROM node0.outbox')).rows[0];assert.deepEqual(row,{attempts:1,delivered:true,released:true});
 assert.deepEqual(await f.db.query('SELECT '+health),{delivered:1,exhausted:0,blocked:0,inFlight:0,waiting:0});
});
test('eight failures persist exponential scheduling and observable exhausted state',async t=>{const f=await fixture(t);await f.seed('retry');const ids=[];
 for(let attempt=1;attempt<=8;attempt++){const result=await drain({...f.options,request:async(_u,r)=>{ids.push(JSON.parse(r.body).id);throw Error('TEST_ONLY_PRIVATE_DIAGNOSTIC');}});assert.equal(result.claimed,1);assert.equal(result.exhausted,attempt===8?1:0);
  const row=(await f.pg.query('SELECT attempts,extract(epoch from(next_attempt-clock_timestamp()))::float8 AS delay,lease_owner IS NULL AND lease_until IS NULL AS released FROM node0.outbox')).rows[0];assert.equal(row.attempts,attempt);assert.ok(Math.abs(row.delay-delay(attempt))<3);assert.equal(row.released,true);
  if(attempt<8)await f.pg.exec("UPDATE node0.outbox SET next_attempt='2000-01-01';");
 }
 assert.equal(new Set(ids).size,1);assert.equal((await drain({...f.options,request:async()=>{throw Error('must_not_send_exhausted');}})).claimed,0);
 assert.deepEqual(await f.db.query('SELECT '+health),{delivered:0,exhausted:1,blocked:0,inFlight:0,waiting:0});assert.equal((await f.pg.query('SELECT count(*)::int AS n FROM node0.outbox')).rows[0].n,1);
});
test('503 Retry-After survives the durable SQL schedule',async t=>{const f=await fixture(t);await f.seed('remote-delay');await drain({...f.options,request:async()=>new Response(null,{status:503,headers:{'Retry-After':'3600'}})});const row=(await f.pg.query('SELECT extract(epoch from(next_attempt-clock_timestamp()))::float8 AS delay FROM node0.outbox')).rows[0];assert.ok(Math.abs(row.delay-3600)<3);});
test('concurrent drainers cannot both send a claimed row',async t=>{const f=await fixture(t);await f.seed('race');let release,started;const entered=new Promise(resolve=>{started=resolve;}),pending=new Promise(resolve=>{release=resolve;});let sent=0;
 const options={...f.options,request:async()=>{sent++;started();await pending;return new Response(null,{status:202});}};
 const first=drain(options);await entered;const second=await drain(options);assert.equal(second.claimed,0);release();await first;assert.equal(sent,1);
});
test('claim ownership drift is never overwritten after remote acknowledgement',async t=>{const f=await fixture(t);await f.seed('drift');const result=await drain({...f.options,request:async()=>{await f.pg.exec("UPDATE node0.outbox SET lease_owner='TEST_ONLY_OTHER_OWNER';");return new Response(null,{status:202});}});assert.equal(result.claimLost,1);assert.equal(result.delivered,0);const row=(await f.pg.query('SELECT attempts,delivered_at IS NULL AS pending,lease_owner FROM node0.outbox')).rows[0];assert.deepEqual(row,{attempts:0,pending:true,lease_owner:'TEST_ONLY_OTHER_OWNER'});});
test('a signer resuming after its lease was recovered cannot dispatch a delivered row',async t=>{const f=await fixture(t);await f.seed('stale-sign');let resume,entered;const ready=new Promise(resolve=>{entered=resolve;}),paused=new Promise(resolve=>{resume=resolve;});let staleSends=0;
 const first=drain({...f.options,sign:async options=>{entered();await paused;return f.options.sign(options);},request:async()=>{staleSends++;return new Response(null,{status:202});}});
 await ready;await f.pg.exec("UPDATE node0.outbox SET lease_until='2000-01-01';");
 assert.equal((await drain({...f.options,request:async()=>new Response(null,{status:202})})).delivered,1);resume();assert.equal((await first).claimLost,1);assert.equal(staleSends,0);
});
test('foreign targets are observable blocked rows and never acquire a delivery lease',async t=>{const f=await fixture(t);await f.seed('foreign','https://other.invalid/inbox');let called=false;assert.equal((await drain({...f.options,request:async()=>{called=true;}})).claimed,0);assert.equal(called,false);assert.equal((await f.db.query('SELECT '+health)).blocked,1);const row=(await f.pg.query('SELECT attempts,lease_until IS NULL AS unleased FROM node0.outbox')).rows[0];assert.deepEqual(row,{attempts:0,unleased:true});});
test('one drain is bounded to ten claimed jobs and an expired lease can recover',async t=>{const f=await fixture(t);for(let i=0;i<11;i++)await f.seed('batch-'+i);await f.pg.exec("UPDATE node0.outbox SET lease_owner='TEST_ONLY_EXPIRED',lease_until='2000-01-01';");let count=0;const result=await drain({...f.options,request:async()=>{count++;return new Response(null,{status:204});}});assert.equal(count,10);assert.equal(result.claimed,10);assert.equal((await f.db.query('SELECT '+health)).waiting,1);});
}
