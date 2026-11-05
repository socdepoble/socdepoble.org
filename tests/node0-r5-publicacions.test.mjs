/** Independent R5 publication probes: actual75 migrations, disposable SQL only. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {creaAuthNodeZero,NODE0_AUTH_TENANT} from '../tooling/node0/auth-node0.mjs';
import {creaBackendPrivatNodeZero} from '../tooling/node0/backend-node0.mjs';
import {creaPlaMigracions,preparaHidratacio,generaSql,ROOT} from '../tooling/node0/hidrata-postgres-node0.mjs';
const origin='https://socdepoble.cat',tenant=NODE0_AUTH_TENANT,password='Disposable publications fixture password 82!';
const modulePath=process.env.SDP_PGLITE_MODULE;
if(!modulePath)test('R5 publications require explicit disposable PostgreSQL',{skip:'Set SDP_PGLITE_MODULE; no mocked SQL authorization'},()=>{});
else{
  const moduleURL=modulePath.startsWith('file:')?new URL(modulePath):pathToFileURL(path.resolve(modulePath));
  const{PGlite}=await import(moduleURL.href);const{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',moduleURL));
  test('publications respect canonical authorship, norms, membership and bounded tuple pagination',async t=>{
    const initial=new PGlite();await initial.exec('CREATE DATABASE socdepoble_node0');const image=await initial.dumpDataDir('none');await initial.close();
    const pg=new PGlite({database:'socdepoble_node0',loadDataDir:image,extensions:{pgcrypto}});
    let queue=Promise.resolve(),calls=0,lastError=null;const mail=[];
    const connection={query(sql){calls++;const task=queue.then(async()=>{try{const source=sql.startsWith('BEGIN;')?`SET ROLE node0_authenticator;\n${sql}\nRESET ROLE;`:`BEGIN; SET LOCAL ROLE node0_authenticator;\n${sql}\nCOMMIT;`;const results=await pg.exec(source);lastError=null;const row=[...results].reverse().find(v=>v.rows?.length);return row?Object.values(row.rows[0])[0]:null;}catch(error){lastError={code:error.code,message:error.message};await pg.exec('ROLLBACK; RESET ROLE;');error.sqlState=error.code;throw error;}});queue=task.catch(()=>{});return task;}};
    const auth=creaAuthNodeZero({db:connection,rateSecret:Buffer.alloc(32,0x35),mailTransport:async message=>{mail.push(message);}}),backend=creaBackendPrivatNodeZero({db:connection,tenantId:tenant});
    const request=(body={},person)=>({headers:{origin,'content-type':'application/json',...(person?{cookie:person.cookie,'x-sdp-expected-actor':person.id}:{})},body,remoteAddress:'127.0.0.1'});
    const call=(action,body,person)=>backend.handle(action,request(body,person));
    const scalar=async(sql,values=[])=>Object.values((await pg.query(sql,values)).rows[0])[0];
    let policy,alice,bob,charlie,published,organization;
    const registration=async label=>{
      const email=`r5-publish-${label}@example.invalid`;
      assert.equal((await auth.handle('register',request({email,password,metadata:{accepta_rgpd:true,versio_politica:policy.privacy.version,tenant_id:tenant,full_name:'Publication fixture '+label}}))).status,202);
      assert.equal((await auth.handle('verify-email',request({token:mail.find(v=>v.to===email).token,password,metadata:{accepta_rgpd:true,versio_politica:policy.privacy.version}}))).status,200);
      const login=await auth.handle('login',request({email,password}));assert.equal(login.status,200);return{id:login.body.user.id,cookie:login.headers['Set-Cookie'].split(';')[0]};
    };
    const accept=async person=>assert.equal((await auth.handle('norms',request({accept:true,version:policy.normsVersion},person))).status,200);
    const append=(submission,person=alice)=>call('appendSectionSubmissionNetworkOnly',{submission},person);
    try{
      await pg.exec(generaSql(creaPlaMigracions(),await preparaHidratacio(),{advisoryLock:false}));await pg.exec(fs.readFileSync(path.join(ROOT,'tooling/node0/auth-node0.sql'),'utf8'));await pg.exec(fs.readFileSync(path.join(ROOT,'tooling/node0/backend-node0.sql'),'utf8'));
      policy=(await auth.handle('policy')).body;alice=await registration('alice');bob=await registration('bob');charlie=await registration('charlie');
      await t.test('publication requires genuine current norms acceptance before SQL write',async()=>{
        const result=await append({sectionId:'mur',title:'Must be refused before norms',payload:{body:'Fixture'}});assert.equal(result.status,403,JSON.stringify({result,lastError}));
        assert.match(lastError?.message??'',/SDP-MOD-428/,'Must reach canonical norms trigger, not an unrelated missing grant');assert.equal(await scalar('SELECT count(*)::int FROM public.section_submissions'),0);
      });
      await accept(alice);await accept(bob);await accept(charlie);
      await t.test('person authority comes only from session and canonical triggers, never payload aliases',async()=>{
        const result=await append({id:randomUUID(),sectionId:'mur',title:'Genuine author fixture',actor:{tipus:'persona',id:alice.id},payload:{ownerUserId:bob.id,owner_user_id:bob.id,authorOrgId:randomUUID(),author_org_id:randomUUID(),author_name:'FORGED',author:'FORGED',source:'system',type:'sistema',isSystem:true,isAvis:true,is_pinned:true,mainHref:'/admin',origen:{abast:'sistema',font:'Fixture origin'}}});
        assert.equal(result.status,201,JSON.stringify({result,lastError}));published=result.body;
        assert.equal(published.owner_user_id,alice.id);assert.equal(published.tenant_id,tenant);assert.equal(published.author_org_id,null);assert.equal(published.payload.ownerUserId,alice.id);assert.equal(published.payload.authorOrgId,null);assert.equal(published.payload.author_org_id,null);assert.equal(published.payload.author_name,'Publication fixture alice');
        assert.equal(published.payload.type,undefined);for(const key of['owner_user_id','author','source','isSystem','isAvis','is_pinned','mainHref'])assert.equal(published.payload[key],undefined,key);assert.deepEqual(published.payload.origen,{font:'Fixture origin'});
      });
      await t.test('another valid member cannot rewrite the first owner id or impersonate a person',async()=>{
        assert.ok(published);const attack=await append({id:published.id,sectionId:'mur',title:'Bob must not replace Alice',payload:{body:'ATTACK'}},bob);assert.ok([403,409].includes(attack.status),JSON.stringify({attack,lastError}));
        assert.equal(await scalar('SELECT title FROM public.section_submissions WHERE id=$1',[published.id]),'Genuine author fixture');assert.equal(await scalar('SELECT owner_user_id FROM public.section_submissions WHERE id=$1',[published.id]),alice.id);
        const impersonate=await append({sectionId:'mur',title:'Forged person',actor:{tipus:'persona',id:alice.id},payload:{}},bob);assert.equal(impersonate.status,403);
      });
      await t.test('cross-tab expected actor mismatch cannot publish as the replacement cookie owner',async()=>{
        const id=randomUUID(),input=request({submission:{id,sectionId:'mur',title:'Stale actor fixture',payload:{}}},bob);input.headers['x-sdp-expected-actor']=alice.id;
        const result=await backend.handle('appendSectionSubmissionNetworkOnly',input);assert.equal(result.status,409);assert.equal(result.body.error,'session_actor_changed');assert.equal(await scalar('SELECT count(*)::int FROM public.section_submissions WHERE id=$1',[id]),0);
      });
      await t.test('entity signing requires canonical owner/admin membership, never a claimed organization id',async()=>{
        const created=await call('createOrganization',{organization:{kind:'company',name:'Publication fixture company',slug:'r5-publish-alice-company',town_name:'La Torre de les Maçanes'}},alice);assert.equal(created.status,201,JSON.stringify({created,lastError}));organization=created.body;
        const signed=await append({sectionId:'mur',title:'Entity fixture',actor:{tipus:'entitat',id:organization.id},payload:{}});assert.equal(signed.status,201,JSON.stringify({signed,lastError}));assert.equal(signed.body.author_org_id,organization.id);assert.equal(signed.body.owner_user_id,alice.id);assert.equal(signed.body.payload.author_name,organization.name);
        const denied=await append({sectionId:'mur',title:'Foreign entity fixture',actor:{tipus:'entitat',id:organization.id},payload:{}},bob);assert.ok([400,403].includes(denied.status),JSON.stringify({denied,lastError}));
        assert.equal(await scalar("SELECT count(*)::int FROM public.section_submissions WHERE title='Foreign entity fixture'"),0);
      });
      await t.test('read policy is member-only; anonymous access is zero or denied, removed member sees no rows',async()=>{
        const member=await call('loadSeccioPage',{sectionId:'mur'},charlie);assert.equal(member.status,200,JSON.stringify({member,lastError}));assert.ok(member.body.rows.some(row=>row.id===published.id));
        try{const result=await pg.exec('BEGIN; SET LOCAL ROLE anon; SELECT count(*)::int AS n FROM public.section_submissions; COMMIT;');assert.equal(result.find(v=>v.rows?.length).rows[0].n,0);}catch(error){await pg.exec('ROLLBACK; RESET ROLE;');assert.equal(error.code,'42501');}
        await pg.query('DELETE FROM public.town_memberships WHERE town_id=$1 AND user_id=$2',[tenant,charlie.id]);
        const removed=await call('loadSeccioPage',{sectionId:'mur'},charlie);assert.equal(removed.status,200,JSON.stringify({removed,lastError}));assert.deepEqual(removed.body.rows,[]);
      });
      await t.test('tuple cursor preserves microseconds, limits50 and completes without gaps or duplicates',async()=>{
        await pg.query("INSERT INTO public.section_submissions(id,tenant_id,owner_user_id,section_id,title,payload,created_at) SELECT md5('r5-publication-page-'||i)::uuid,$1,$2,'events','Page fixture '||i,jsonb_build_object('sequence',i),timestamptz '2026-11-04 12:00:00.123400+00'+i*interval '1 microsecond' FROM generate_series(1,51)i",[tenant,alice.id]);
        const expected=(await pg.query("SELECT id FROM public.section_submissions WHERE section_id='events' ORDER BY created_at DESC,id DESC")).rows.map(v=>v.id),seen=[];let cursor,complete=false;
        for(let step=0;step<4&&!complete;step++){
          const page=await call('loadSeccioPage',{sectionId:'events',limit:50,...(cursor?{cursor}:{})},bob);assert.equal(page.status,200,JSON.stringify({page,lastError}));assert.ok(page.body.rows.length>0);assert.ok(page.body.rows.length<=50);seen.push(...page.body.rows.map(v=>v.id));complete=page.body.complete;
          if(!complete){assert.ok(page.body.nextCursor);assert.match(page.body.nextCursor.createdAt,/\.\d{6}/);cursor=page.body.nextCursor;}else assert.equal(page.body.nextCursor,null);
        }
        assert.equal(complete,true);assert.deepEqual(seen,expected);assert.equal(new Set(seen).size,51);
      });
      await t.test('byte-capped pages continue through128KiB-class rows and never return empty incomplete pages',async()=>{
        await pg.query("INSERT INTO public.section_submissions(id,tenant_id,owner_user_id,section_id,title,payload,created_at) SELECT md5('r5-publication-bytes-'||i)::uuid,$1,$2,'mercat','Bytes fixture '||i,jsonb_build_object('body',repeat('x',125000)),timestamptz '2026-11-04 12:00:00+00'+i*interval '1 second' FROM generate_series(1,10)i",[tenant,alice.id]);
        const seen=[];let cursor,complete=false;
        for(let step=0;step<4&&!complete;step++){
          const page=await call('loadSeccioPage',{sectionId:'mercat',...(cursor?{cursor}:{})},bob);assert.equal(page.status,200,JSON.stringify({status:page.status,error:page.body?.error,lastError}));assert.ok(page.body.rows.length>0);assert.ok(Buffer.byteLength(JSON.stringify(page.body.rows))<=1048576);seen.push(...page.body.rows.map(v=>v.id));complete=page.body.complete;
          if(!complete){assert.ok(page.body.nextCursor);cursor=page.body.nextCursor;}else assert.equal(page.body.nextCursor,null);
        }
        assert.equal(complete,true);assert.equal(seen.length,10);assert.equal(new Set(seen).size,10);
      });
      await t.test('legacy row beyond response budget yields413, never an infinite empty continuation',async()=>{
        await pg.query("INSERT INTO public.section_submissions(tenant_id,owner_user_id,section_id,title,payload) VALUES($1,$2,'multimedia','Legacy oversized fixture',jsonb_build_object('body',repeat('x',1048576)))",[tenant,alice.id]);
        const result=await call('loadSeccioPage',{sectionId:'multimedia'},bob);assert.equal(result.status,413,JSON.stringify({status:result.status,error:result.body?.error,lastError}));assert.equal(result.body.error,'publication_too_large_to_read');
      });
      await t.test('notes section is never listable through the community-page operation',async()=>{
        const before=calls;const result=await call('loadSeccioPage',{sectionId:'notes'},alice);assert.equal(result.status,400);assert.equal(calls,before);
      });
      await t.test('malformed cursors and over-budget publication payloads fail before SQL',async()=>{
        const before=calls;
        for(const cursor of[{},'bad',{createdAt:'invalid',id:randomUUID()},{createdAt:'2026-13-01T00:00:00Z',id:randomUUID()},{createdAt:'2026-11-04T00:00:00Z',id:'invalid'},{createdAt:'2026-11-04T00:00:00Z',id:randomUUID(),extra:true}])assert.equal((await call('loadSeccioPage',{sectionId:'mur',cursor},alice)).status,400);
        assert.equal((await append({sectionId:'mur',title:'Oversize rejected',payload:{body:'x'.repeat(128*1024)}})).status,400);assert.equal(calls,before);
      });
    }finally{await pg.close();}
  });
}
