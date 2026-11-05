/** Independent private backend probes; only disposable PGlite, never native/prod accounts. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {sqlText} from '../tooling/node0/postgres-node0.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes,randomUUID} from 'node:crypto';
import {creaBackendPrivatNodeZero,compilaOperacioNodeZero,sqlContextSessioNodeZero} from '../tooling/node0/backend-node0.mjs';
import {creaAuthNodeZero,NODE0_AUTH_TENANT,NODE0_AUTH_COOKIE} from '../tooling/node0/auth-node0.mjs';
import {creaPlaMigracions,preparaHidratacio,generaSql,ROOT} from '../tooling/node0/hidrata-postgres-node0.mjs';
const origin='https://socdepoble.cat',tenant=NODE0_AUTH_TENANT;
const token=randomBytes(32).toString('base64url'),cookie=`${NODE0_AUTH_COOKIE}=${token}`;
const id='10000000-0000-4000-8000-000000000001';

test('private operations reject foreign origin, missing session and forged scope before SQL',async()=>{
  let calls=0;const backend=creaBackendPrivatNodeZero({tenantId:tenant,db:{query:async()=>{calls++;assert.fail('no query');}}});
  assert.equal((await backend.handle('getProfile',{headers:{cookie}})).status,403);
  assert.equal((await backend.handle('getProfile',{headers:{origin}})).status,401);
  for(const [action,body] of[['getProfile',{userId:id}],['loadNotes',{owner_user_id:id}],['updateProfile',{updates:{role:'superadmin'}}],['updateOrganization',{id,updates:{created_by:id}}],['loadMissatges',{filId:"'; DROP TABLE auth.users;--"}],['updateProfile',{updates:{full_name:'unpaired\ud800'}}],['updateProfile',{updates:JSON.parse('{"__proto__":"not-a-field"}')}],['updateProfile',{updates:{constructor:'not-a-field'}}]]){
    const result=await backend.handle(action,{headers:{origin,cookie},body});assert.equal(result.status,400,action);
  }
  assert.equal((await backend.handle('pg_sleep',{headers:{origin,cookie},body:{}})).status,501);
  const deliveryOnly=await backend.handle('marcaLlegit',{headers:{origin,cookie},body:{filId:id,rebutFinsSeq:1}});
  assert.equal(deliveryOnly.status,501);assert.equal(deliveryOnly.body.error,'delivery_receipt_unavailable');assert.equal(calls,0,'Delivery-only absence must not become an implicit read mark.');
});
test('private context is validated before claims and role, inside one explicit transaction',()=>{
  const sql=sqlContextSessioNodeZero('ab'.repeat(32),id);
  assert.ok(sql.startsWith('BEGIN;'));assert.ok(sql.indexOf('private.node0_auth_context(')<sql.indexOf("set_config('request.jwt.claim.sub'"));
  assert.ok(sql.indexOf("IF c IS NULL")<sql.indexOf('SET LOCAL ROLE authenticated'));
  assert.match(sql,/SET LOCAL ROLE authenticated/);assert.doesNotMatch(sql,/SET(?: LOCAL)? ROLE (?:postgres|service_role)/);
  assert.throws(()=>sqlContextSessioNodeZero("'; COMMIT;--"));
  const update=compilaOperacioNodeZero('updateNote',{id,updates:{title:'same'},expectedRevision:7},tenant);
  assert.match(update,/owner_user_id=\(SELECT auth\.uid\(\)\)/);assert.ok(update.includes('revision='+sqlText('7')+'::integer'));
});
test('private backend never forwards a storage error message/status as its own public failure',async()=>{
  const marker='private-fixture-row@example.invalid';
  const backend=creaBackendPrivatNodeZero({tenantId:tenant,db:{query:async()=>{throw Object.assign(new Error(marker),{status:503});}}});
  const result=await backend.handle('getProfile',{headers:{origin,cookie,'x-sdp-expected-actor':id},body:{}});assert.equal(result.status,503);assert.deepEqual(result.body,{error:'node0_private_operation_failed'});assert.equal(JSON.stringify(result).includes(marker),false);
});

const modulePath=process.env.SDP_PGLITE_MODULE;
if(!modulePath)test('private backend SQL requires explicit disposable PostgreSQL runtime',{skip:'Set SDP_PGLITE_MODULE; no mocked SQL authorization'},()=>{});
else{
  const moduleURL=modulePath.startsWith('file:')?new URL(modulePath):pathToFileURL(path.resolve(modulePath));
  const{PGlite}=await import(moduleURL.href);const{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',moduleURL));
  test('private operations execute actual RLS, session context and revision checks for two fixture users',async t=>{
    const initial=new PGlite();await initial.exec('CREATE DATABASE socdepoble_node0');const image=await initial.dumpDataDir('none');await initial.close();
    const pg=new PGlite({database:'socdepoble_node0',loadDataDir:image,extensions:{pgcrypto}});
    let queue=Promise.resolve(),lastDatabaseError=null;const deliveries=[];
    const connection={query(sql){const task=queue.then(async()=>{try{const source=sql.startsWith('BEGIN;')?`SET ROLE node0_authenticator;\n${sql}\nRESET ROLE;`:`BEGIN; SET LOCAL ROLE node0_authenticator;\n${sql}\nCOMMIT;`;const results=await pg.exec(source);lastDatabaseError=null;const result=[...results].reverse().find(v=>v.rows?.length);return result?Object.values(result.rows[0])[0]:null;}catch(error){lastDatabaseError={code:error.code,message:error.message};await pg.exec('ROLLBACK; RESET ROLE;');error.sqlState=error.code;throw error;}});queue=task.catch(()=>{});return task;}};
    const auth=creaAuthNodeZero({db:connection,rateSecret:Buffer.alloc(32,0x13),mailTransport:async message=>{deliveries.push(message);}});
    const backend=creaBackendPrivatNodeZero({db:connection,tenantId:tenant});
    const pass='Disposable fixture password 142!';
    const actors=new Map();
    const request=(body={},session)=>({headers:{origin,'content-type':'application/json',...(session?{cookie:session,'x-sdp-expected-actor':actors.get(session)}:{})},body,remoteAddress:'127.0.0.1'});
    const call=(action,body,session)=>backend.handle(action,request(body,session));
    const account=async(email,username)=>{
      const policy=(await auth.handle('policy')).body;
      const registered=await auth.handle('register',request({email,password:pass,metadata:{accepta_rgpd:true,versio_politica:policy.privacy.version,tenant_id:tenant,full_name:'Disposable '+username,username}}));assert.equal(registered.status,202);
      const delivery=deliveries.find(v=>v.to===email);assert.ok(delivery);assert.equal((await auth.handle('verify-email',request({token:delivery.token,password:pass,metadata:{accepta_rgpd:true,versio_politica:policy.privacy.version}}))).status,200);
      const logged=await auth.handle('login',request({email,password:pass}));assert.equal(logged.status,200);const account={id:logged.body.user.id,cookie:logged.headers['Set-Cookie'].split(';')[0]};actors.set(account.cookie,account.id);return account;
    };
    try{
      await pg.exec(generaSql(creaPlaMigracions(),await preparaHidratacio(),{advisoryLock:false}));
      await pg.exec(fs.readFileSync(path.join(ROOT,'tooling/node0/auth-node0.sql'),'utf8'));
      const alice=await account('fixture-alice@example.invalid','fixture-alice');const bob=await account('fixture-bob@example.invalid','fixture-bob');
      let note;
      await t.test('getProfile is session-derived and does not leak the previous user',async()=>{
        for(const person of[alice,bob,alice]){const result=await call('getProfile',{},person.cookie);assert.equal(result.status,200);assert.equal(result.body.id,person.id);}
        assert.equal((await pg.query('SELECT current_user AS role')).rows[0].role,'postgres');
        assert.equal((await pg.query("SELECT nullif(current_setting('request.jwt.claim.sub',true),'') AS sub")).rows[0].sub,null);
      });
      await t.test('createNote really persists an owned private note with the supplied text',async()=>{
        const created=await call('createNote',{input:{title:'Private fixture note',content:'Owned by fixture Alice'}},alice.cookie);
        assert.equal(created.status,201,JSON.stringify({created,lastDatabaseError}));assert.equal(created.body.title,'Private fixture note');note=created.body;
        const actual=(await pg.query('SELECT owner_user_id,tenant_id FROM public.notes WHERE id=$1',[note.id])).rows[0];assert.equal(actual.owner_user_id,alice.id);assert.equal(actual.tenant_id,tenant);
      });
      await t.test('foreign-session note reads and writes fail under actual RLS',async()=>{
        assert.ok(note,'requires successful persisted create');
        const read=await call('loadNotes',{noteId:note.id},bob.cookie);assert.equal(read.status,200);assert.deepEqual(read.body.rows,[]);
        const changed=await call('updateNote',{id:note.id,updates:{content:'foreign overwrite'},expectedRevision:note.revision},bob.cookie);assert.equal(changed.status,404);
        assert.equal((await pg.query('SELECT content FROM public.notes WHERE id=$1',[note.id])).rows[0].content,'Owned by fixture Alice');
      });
      await t.test('cookie switched to Bob cannot perform an operation prepared by Alice',async()=>{
        const stale=request({input:{title:'Wrong actor must not write'}},bob.cookie);stale.headers['x-sdp-expected-actor']=alice.id;
        const denied=await backend.handle('createNote',stale);assert.equal(denied.status,409);assert.equal(denied.body.error,'session_actor_changed');
        assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.notes WHERE owner_user_id=$1',[bob.id])).rows[0].n,0);
        assert.equal((await call('getProfile',{},bob.cookie)).body.id,bob.id);
      });
      await t.test('optimistic revision detects a stale update without overwriting the winner',async()=>{
        assert.ok(note);const first=await call('updateNote',{id:note.id,updates:{content:'winner'},expectedRevision:note.revision},alice.cookie);assert.equal(first.status,200,JSON.stringify(first));
        const stale=await call('updateNote',{id:note.id,updates:{content:'stale'},expectedRevision:note.revision},alice.cookie);assert.equal(stale.status,409);assert.equal((await pg.query('SELECT content FROM public.notes WHERE id=$1',[note.id])).rows[0].content,'winner');
      });
      await t.test('SQL punctuation in profile text is stored as data and changes no identity',async()=>{
        const hostile="x'); DROP TABLE auth.users; --";const changed=await call('updateProfile',{updates:{full_name:hostile}},alice.cookie);assert.equal(changed.status,200,JSON.stringify(changed));assert.equal(changed.body.full_name,hostile);
        assert.equal((await pg.query('SELECT count(*)::int AS n FROM auth.users')).rows[0].n,2);assert.equal((await call('getProfile',{},bob.cookie)).body.id,bob.id);
      });
      await t.test('actual direct chat persists once and excludes a third real fixture account',async()=>{
        const charlie=await account('fixture-charlie@example.invalid','fixture-charlie');
        const policy=(await auth.handle('policy')).body;
        for(const person of[alice,bob]){const accepted=await auth.handle('norms',request({accept:true,version:policy.normsVersion},person.cookie));assert.equal(accepted.status,200,JSON.stringify(accepted));}
        const created=await call('creaFilDirecte',{altreUsuariId:bob.id,titol:'Disposable private thread'},alice.cookie);assert.equal(created.status,200,JSON.stringify(created));assert.match(created.body,/^[a-f0-9-]{36}$/);
        const filId=created.body,messageId=randomUUID(),text='A real fixture-only message';
        const sent=await call('enviaMissatge',{filId,id:messageId,text},alice.cookie);assert.equal(sent.status,201,JSON.stringify(sent));assert.ok(sent.body.some(row=>row.id===messageId&&row.usuari_id===alice.id));
        const repeat=await call('enviaMissatge',{filId,id:messageId,text},alice.cookie);assert.equal(repeat.status,201);assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.xat_missatges WHERE id=$1',[messageId])).rows[0].n,1);
        const history=await call('loadMissatges',{filId},bob.cookie);assert.equal(history.status,200,JSON.stringify(history));assert.ok(history.body.some(row=>row.id===messageId&&row.cos===text));
        for(const action of['loadMissatges','enviaMissatge','marcaLlegit']){const body=action==='enviaMissatge'?{filId,id:randomUUID(),text:'not authorized'}:action==='marcaLlegit'?{filId,llegitFinsSeq:1}:{filId};assert.equal((await call(action,body,charlie.cookie)).status,403,action);}
        assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.xat_missatges WHERE fil_id=$1',[filId])).rows[0].n,1);
      });
      await t.test('logout invalidates the next private transaction without revoking another user',async()=>{
        assert.equal((await auth.handle('logout',request({},alice.cookie))).status,200);assert.equal((await call('getProfile',{},alice.cookie)).status,401);assert.equal((await call('getProfile',{},bob.cookie)).body.id,bob.id);
      });
    }finally{await pg.close();}
  });
}
