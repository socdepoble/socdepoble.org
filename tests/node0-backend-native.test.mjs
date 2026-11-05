/** Explicit opt-in, native PostgreSQL laboratory only. No production fixtures. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { creaPostgres, sqlText } from '../tooling/node0/postgres-node0.mjs';
import { creaAuthNodeZero, NODE0_AUTH_TENANT } from '../tooling/node0/auth-node0.mjs';
import { creaBackendPrivatNodeZero } from '../tooling/node0/backend-node0.mjs';
const enabled=process.env.SDP_NODE0_NATIVE_LAB==='1';
test('native PostgreSQL session + private RLS boundary', {skip:enabled?false:'Explicit Node 0 laboratory only'}, async t=>{
  assert.equal(process.env.PGDATABASE,'node0_gauntlet_r4');
  assert.equal(process.env.PGUSER,'javi');
  const operator=creaPostgres();
  const status=await operator.query("SELECT json_build_object('database',current_database(),'version',current_setting('server_version'),'users',(SELECT count(*) FROM auth.users));");
  assert.equal(status.database,'node0_gauntlet_r4');assert.match(status.version,/^17\./);
  const db={query:sql=>operator.query('SET ROLE node0_authenticator;\n'+sql)};
  const deliveries=[],nonce=randomUUID(),origin='https://socdepoble.cat';
  const auth=creaAuthNodeZero({db,rateSecret:randomBytes(32),mailTransport:async m=>{deliveries.push(m);}});
  const backend=creaBackendPrivatNodeZero({db,tenantId:NODE0_AUTH_TENANT});
  const headers={origin,'content-type':'application/json'},actors=new Map();
  const args=(body,cookie)=>({body,headers:{...headers,...(cookie?{cookie,'x-sdp-expected-actor':actors.get(cookie)}:{})},remoteAddress:'198.51.100.44'});
  const policy=await auth.handle('policy');assert.equal(policy.status,200);
  const password='Native laboratory password 42!';
  const ids=[],notes=[],organizations=[],submissions=[];let alice,bob,aliceUser,bobUser;
  async function person(label){
    const email=`${label}-${nonce}@example.invalid`;
    const registration=await auth.handle('register',args({email,password,metadata:{accepta_rgpd:true,versio_politica:policy.body.privacy.version,tenant_id:NODE0_AUTH_TENANT,full_name:`Laboratori ${label}`}}));
    assert.equal(registration.status,202,JSON.stringify(registration.body));
    assert.equal(deliveries.at(-1).to,email);
    assert.equal((await auth.handle('login',args({email,password}))).status,401);
    assert.equal((await auth.handle('verify-email',args({token:deliveries.at(-1).token,password,metadata:{accepta_rgpd:true,versio_politica:policy.body.privacy.version}}))).status,200);
    const login=await auth.handle('login',args({email,password}));assert.equal(login.status,200,JSON.stringify(login.body));
    assert.equal(login.body.access_token,undefined);
    const cookie=login.headers['Set-Cookie'].split(';')[0];assert.ok(cookie.startsWith('__Host-sdp-node0='));
    actors.set(cookie,login.body.user.id);
    ids.push(login.body.user.id);
    const norms=await auth.handle('norms',args({accept:true,version:policy.body.normsVersion},cookie));assert.equal(norms.status,200,JSON.stringify(norms.body));
    return [cookie,login.body.user];
  }
  try{
    await t.test('real registration, one-use confirmation and opaque cookie for two people',async()=>{
      [alice,aliceUser]=await person('alice');[bob,bobUser]=await person('bob');assert.notEqual(aliceUser.id,bobUser.id);
    });
    await t.test('credentials stay behind private grants with the actual request role',async()=>{
      await assert.rejects(db.query('SELECT row_to_json(x) FROM private.node0_credentials x LIMIT 1;'),e=>e.sqlState==='42501');
      const memberships=await operator.query("SELECT json_build_object('runtimeMemberships',(SELECT count(*) FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='node0_runtime'));");
      assert.equal(memberships.runtimeMemberships,0);
    });
    await t.test('private Notes persist exact text, return real revision and isolate the other owner',async()=>{
      const content="O'Brien; SELECT pg_sleep(9); -- 💚";
      const created=await backend.handle('createNote',args({input:{title:'Native private note',content,folderId:'f-notes'}},alice));
      assert.equal(created.status,201,JSON.stringify(created.body));assert.equal(created.body.content,content);assert.equal(created.body.revision,1);notes.push(created.body.id);
      const foreign=await backend.handle('loadNotes',args({noteId:created.body.id},bob));assert.equal(foreign.status,200);assert.deepEqual(foreign.body.rows,[]);
      const deny=await backend.handle('updateNote',args({id:created.body.id,updates:{content:'foreign'},expectedRevision:1},bob));assert.equal(deny.status,404);
      const changed=await backend.handle('updateNote',args({id:created.body.id,updates:{content:'Owner changed'},expectedRevision:1},alice));assert.equal(changed.status,200);assert.equal(changed.body.revision,2);
      const stale=await backend.handle('updateNote',args({id:created.body.id,updates:{content:'stale'},expectedRevision:1},alice));assert.equal(stale.status,409);
      assert.equal((await backend.handle('createNote',args({input:{title:'forged',owner_user_id:bobUser.id}},alice))).status,400);
      assert.equal((await backend.handle('loadNotes',args({tenantId:randomUUID()},alice))).status,400);
    });
    await t.test('profile update writes the authenticated person only',async()=>{
      const changed=await backend.handle('updateProfile',args({updates:{bio:'Native private profile test'}},alice));assert.equal(changed.status,200,JSON.stringify(changed.body));assert.equal(changed.body.id,aliceUser.id);
      const other=await backend.handle('getProfile',args({},bob));assert.equal(other.status,200);assert.equal(other.body.id,bobUser.id);assert.notEqual(other.body.bio,changed.body.bio);
      const role=await backend.handle('elMeuRol',args({},alice));assert.equal(role.status,200);assert.equal(role.body,'usuari');
    });
    await t.test('cross-tab cookie switch rejects the old UI actor inside the SQL transaction',async()=>{
      const request=args({input:{title:'Must never become a Bob note',content:'Stale Alice UI'}},bob);
      request.headers['x-sdp-expected-actor']=aliceUser.id;
      const refused=await backend.handle('createNote',request);assert.equal(refused.status,409,JSON.stringify(refused.body));assert.equal(refused.body.error,'session_actor_changed');
      const own=await backend.handle('loadNotes',args({},bob));assert.equal(own.status,200);assert.deepEqual(own.body.rows,[]);
      assert.equal((await backend.handle('getProfile',args({},bob))).body.id,bobUser.id);
    });
    await t.test('canonical organization creation stores owner and town atomically and preserves an idempotent retry',async()=>{
      const organization={kind:'company',name:'Empresa de laboratori',slug:`lab-${nonce}`,town_name:'La Torre de les Maçanes',lema:'l'.repeat(256)};
      const created=await backend.handle('createOrganization',args({organization},alice));assert.equal(created.status,201,JSON.stringify(created.body));assert.equal(created.body.created_by,undefined);assert.equal(created.body.town_name,organization.town_name);organizations.push(created.body.id);
      const creator=await operator.query(`SELECT jsonb_build_object('created_by',created_by) FROM public.organizations WHERE id=${sqlText(created.body.id)}::uuid;`);assert.equal(creator.created_by,aliceUser.id);
      const repeat=await backend.handle('createOrganization',args({organization},alice));assert.equal(repeat.status,201);assert.equal(repeat.body.id,created.body.id);
      const conflict=await backend.handle('createOrganization',args({organization:{...organization,town_name:'Altre poble'}},alice));assert.equal(conflict.status,409);
      const foreign=await backend.handle('updateOrganization',args({id:created.body.id,updates:{name:'Foreign overwrite'}},bob));assert.equal(foreign.status,404);
      const own=await backend.handle('listMyOrganizations',args({},alice));assert.equal(own.status,200);const stored=own.body.find(o=>o.id===created.body.id);assert.equal(stored.town_name,organization.town_name);assert.equal(stored.name,organization.name);assert.equal(stored.role,'owner');
    });
    await t.test('member publication and page obey canonical authorship, privacy and another owner protection',async()=>{
      const publication={sectionId:'mur',title:'Publicació del laboratori',payload:{title:'Publicació del laboratori',content:'Contingut reservat al laboratori',ownerUserId:bobUser.id,isSystem:true,type:'sistema',origen:{tipus:'connexio',abast:{persones:['private-fixture-recipient']}}},actor:{tipus:'persona',id:aliceUser.id}};
      const saved=await backend.handle('appendSectionSubmissionNetworkOnly',args({submission:publication},alice));assert.equal(saved.status,201,JSON.stringify(saved.body));submissions.push(saved.body.id);assert.equal(saved.body.owner_user_id,aliceUser.id);assert.equal(saved.body.payload.ownerUserId,aliceUser.id);assert.equal(saved.body.payload.isSystem,undefined);assert.equal(saved.body.payload.type,undefined);assert.equal(saved.body.payload.origen.abast,undefined);
      const page=await backend.handle('loadSeccioPage',args({sectionId:'mur',limit:50},bob));assert.equal(page.status,200,JSON.stringify(page.body));assert.ok(page.body.rows.some(row=>row.id===saved.body.id&&row.owner_user_id===aliceUser.id));assert.equal(page.body.complete,true);assert.equal(page.body.nextCursor,null);
      const foreign=await backend.handle('appendSectionSubmissionNetworkOnly',args({submission:{id:saved.body.id,sectionId:'mur',title:'Foreign overwrite',payload:{content:'denied'}}},bob));assert.ok([403,409].includes(foreign.status));
      await assert.rejects(operator.query('SET ROLE anon; SELECT coalesce(jsonb_agg(id),\'[]\'::jsonb) FROM public.section_submissions;'),error=>error.sqlState==='42501');
    });
    await t.test('direct thread and text message use canonical PostgreSQL RPC permissions',async()=>{
      const direct=await backend.handle('creaFilDirecte',args({altreUsuariId:bobUser.id,titol:'Laboratori'},alice));assert.equal(direct.status,200,JSON.stringify(direct.body));
      const fil=typeof direct.body==='string'?direct.body:direct.body?.id;
      assert.match(fil,/^[a-f0-9-]{36}$/);
      const sent=await backend.handle('enviaMissatge',args({filId:fil,id:randomUUID(),text:'Missatge de laboratori'},alice));assert.equal(sent.status,201,JSON.stringify(sent.body));assert.ok(Number(sent.body[0]?.seq)>0);
      const read=await backend.handle('loadMissatges',args({filId:fil,limit:10},bob));assert.equal(read.status,200,JSON.stringify(read.body));assert.equal(read.body.at(-1).cos,'Missatge de laboratori');
      const seq=Number(sent.body[0].seq);
      const received=await backend.handle('marcaLlegit',args({filId:fil,rebutFinsSeq:seq},bob));assert.equal(received.status,501,JSON.stringify(received.body));assert.equal(received.body.error,'delivery_receipt_unavailable');
      const unread=await backend.handle('loadFils',args({},bob));assert.equal(Number(unread.body.find(f=>f.id===fil).llegit_fins_seq),0,'unsupported delivery receipt must not claim the person read the message');
      const seen=await backend.handle('marcaLlegit',args({filId:fil,rebutFinsSeq:seq,llegitFinsSeq:seq},bob));assert.equal(seen.status,200);assert.equal(Number(seen.body[0].llegit_fins_seq),seq);
    });
    await t.test('logout revocation is rechecked inside each new private transaction',async()=>{
      assert.equal((await auth.handle('logout',args({},alice))).status,200);
      const denied=await backend.handle('loadNotes',args({},alice));assert.equal(denied.status,401,JSON.stringify(denied.body));
      assert.equal((await backend.handle('getProfile',args({},bob))).status,200);
    });
  }finally{
    // Cleanup is constrained by exact generated IDs and by the top-level
    // laboratory database guard. No production connection is constructed.
    if(notes.length)await operator.query(`WITH d AS (DELETE FROM public.notes WHERE id IN (${notes.map(id=>`${sqlText(id)}::uuid`).join(',')}) RETURNING id) SELECT json_build_object('notes',(SELECT count(*) FROM d));`);
    if(submissions.length)await operator.query(`WITH d AS (DELETE FROM public.section_submissions WHERE id IN (${submissions.map(id=>`${sqlText(id)}::uuid`).join(',')}) RETURNING id) SELECT json_build_object('submissions',(SELECT count(*) FROM d));`);
    if(organizations.length)await operator.query(`WITH d AS (DELETE FROM public.organizations WHERE id IN (${organizations.map(id=>`${sqlText(id)}::uuid`).join(',')}) RETURNING id) SELECT json_build_object('organizations',(SELECT count(*) FROM d));`);
    if(ids.length)await operator.query(`WITH d AS (DELETE FROM auth.users WHERE id IN (${ids.map(id=>`${sqlText(id)}::uuid`).join(',')}) RETURNING id) SELECT json_build_object('people',(SELECT count(*) FROM d));`);
  }
});
