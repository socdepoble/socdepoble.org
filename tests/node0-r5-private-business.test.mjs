/** R5 independent business probes. Actual SQL in disposable PostgreSQL WASM only.
 * Three synthetic, explicitly registered fixture people; no native/prod connection.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {creaAuthNodeZero,NODE0_AUTH_TENANT} from '../tooling/node0/auth-node0.mjs';
import {creaBackendPrivatNodeZero} from '../tooling/node0/backend-node0.mjs';
import {creaPlaMigracions,preparaHidratacio,generaSql,ROOT} from '../tooling/node0/hidrata-postgres-node0.mjs';
const origin='https://socdepoble.cat',tenant=NODE0_AUTH_TENANT,pass='Disposable business fixture password 841!';
const modulePath=process.env.SDP_PGLITE_MODULE;
if(!modulePath)test('R5 business SQL requires an explicit disposable PostgreSQL runtime',{skip:'Set SDP_PGLITE_MODULE; no mocked SQL authorization'},()=>{});
else{
  const moduleURL=modulePath.startsWith('file:')?new URL(modulePath):pathToFileURL(path.resolve(modulePath));
  const{PGlite}=await import(moduleURL.href);const{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',moduleURL));
  test('real roles, organizations, parent permissions and actor-bound identity use canonical SQL',async t=>{
    const initial=new PGlite();await initial.exec('CREATE DATABASE socdepoble_node0');const image=await initial.dumpDataDir('none');await initial.close();
    const pg=new PGlite({database:'socdepoble_node0',loadDataDir:image,extensions:{pgcrypto}});
    let queue=Promise.resolve(),lastError=null,calls=0;const mail=[];
    const connection={query(sql){calls++;const task=queue.then(async()=>{try{const source=sql.startsWith('BEGIN;')?`SET ROLE node0_authenticator;\n${sql}\nRESET ROLE;`:`BEGIN; SET LOCAL ROLE node0_authenticator;\n${sql}\nCOMMIT;`;const results=await pg.exec(source);lastError=null;const result=[...results].reverse().find(v=>v.rows?.length);return result?Object.values(result.rows[0])[0]:null;}catch(error){lastError={code:error.code,message:error.message};await pg.exec('ROLLBACK; RESET ROLE;');error.sqlState=error.code;throw error;}});queue=task.catch(()=>{});return task;}};
    const auth=creaAuthNodeZero({db:connection,rateSecret:Buffer.alloc(32,0x34),mailTransport:async message=>{mail.push(message);}}),backend=creaBackendPrivatNodeZero({db:connection,tenantId:tenant});
    const request=(body={},person)=>({headers:{origin,'content-type':'application/json',...(person?{cookie:person.cookie,'x-sdp-expected-actor':person.id}:{})},body,remoteAddress:'127.0.0.1'});
    const call=(action,body,person)=>backend.handle(action,request(body,person));
    const scalar=async(sql,values=[])=>Object.values((await pg.query(sql,values)).rows[0])[0];
    const register=async label=>{
      const email=`r5-business-${label}@example.invalid`,policy=(await auth.handle('policy')).body;
      const result=await auth.handle('register',request({email,password:pass,metadata:{accepta_rgpd:true,versio_politica:policy.privacy.version,tenant_id:tenant,full_name:'Fixture business '+label,username:'r5-business-'+label,role:'superadmin',email_verified:true}}));assert.equal(result.status,202);
      assert.equal((await auth.handle('verify-email',request({token:mail.find(v=>v.to===email).token,password:pass,metadata:{accepta_rgpd:true,versio_politica:policy.privacy.version}}))).status,200);
      const login=await auth.handle('login',request({email,password:pass}));assert.equal(login.status,200);return{id:login.body.user.id,cookie:login.headers['Set-Cookie'].split(';')[0],email};
    };
    const company=(slug,extra={})=>({kind:'company',name:'Fixture '+slug,slug,town_name:'La Torre de les Maçanes',lema:'x'.repeat(256),description:'Disposable fixture only',...extra});
    let alice,bob,charlie,organization;
    try{
      await pg.exec(generaSql(creaPlaMigracions(),await preparaHidratacio(),{advisoryLock:false}));await pg.exec(fs.readFileSync(path.join(ROOT,'tooling/node0/auth-node0.sql'),'utf8'));await pg.exec(fs.readFileSync(path.join(ROOT,'tooling/node0/backend-node0.sql'),'utf8'));
      alice=await register('alice');bob=await register('bob');charlie=await register('charlie');
      await t.test('elMeuRol uses actual role rows and ignores metadata role forgery',async()=>{
        assert.equal(await scalar("SELECT raw_user_meta_data ? 'role' FROM auth.users WHERE id=$1",[alice.id]),false);
        await pg.query("UPDATE auth.users SET raw_user_meta_data=raw_user_meta_data||'{\"role\":\"superadmin\"}'::jsonb WHERE id=$1",[alice.id]);
        assert.deepEqual(await call('elMeuRol',{},alice),{status:200,body:'usuari'});
        await pg.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'moderador') ON CONFLICT(user_id) DO UPDATE SET role=EXCLUDED.role",[bob.id]);
        assert.deepEqual(await call('elMeuRol',{},bob),{status:200,body:'moderador'});assert.deepEqual(await call('elMeuRol',{},charlie),{status:200,body:'usuari'});
      });
      await t.test('company creation persists town and genuine creator ownership in one transaction',async()=>{
        const created=await call('createOrganization',{organization:company('r5-business-alice')},alice);assert.equal(created.status,201,JSON.stringify({created,lastError}));organization=created.body;
        assert.equal(await scalar('SELECT created_by FROM public.organizations WHERE id=$1',[organization.id]),alice.id);assert.equal(organization.tenant_id,tenant);assert.equal(organization.town_name,'La Torre de les Maçanes');assert.equal(organization.lema,'x'.repeat(256));
        const membership=(await pg.query('SELECT user_id,tenant_id,role FROM public.organization_memberships WHERE organization_id=$1',[organization.id])).rows;assert.deepEqual(membership,[{user_id:alice.id,tenant_id:tenant,role:'owner'}]);
        const listed=await call('listMyOrganizations',{},alice);assert.equal(listed.status,200);assert.ok(listed.body.some(row=>row.id===organization.id));
      });
      await t.test('same-town retries return the existing row without overwriting curated fields',async()=>{
        assert.ok(organization);const repeat=await call('createOrganization',{organization:company('r5-business-alice',{name:'MUST NOT REPLACE',lema:'MUST NOT REPLACE',description:'MUST NOT REPLACE'})},alice);assert.equal(repeat.status,201,JSON.stringify({repeat,lastError}));
        assert.equal(repeat.body.id,organization.id);assert.equal(repeat.body.name,organization.name);assert.equal(repeat.body.lema,organization.lema);assert.equal(repeat.body.description,organization.description);
        assert.equal(await scalar('SELECT count(*)::int FROM public.organizations WHERE slug=$1',['r5-business-alice']),1);
      });
      await t.test('a different town conflicts and cannot overwrite an existing organization',async()=>{
        assert.ok(organization);const result=await call('createOrganization',{organization:company('r5-business-alice',{town_name:'Other fixture town'})},alice);assert.equal(result.status,409,JSON.stringify({result,lastError}));
        assert.equal(await scalar('SELECT town_name FROM public.organizations WHERE id=$1',[organization.id]),'La Torre de les Maçanes');
      });
      await t.test('a different user cannot update or claim a creator membership for the company',async()=>{
        assert.ok(organization);const result=await call('updateOrganization',{id:organization.id,updates:{name:'FOREIGN OVERWRITE'}},bob);assert.equal(result.status,404,JSON.stringify({result,lastError}));
        assert.equal(await scalar('SELECT name FROM public.organizations WHERE id=$1',[organization.id]),organization.name);
        const clash=await call('createOrganization',{organization:company('r5-business-alice')},bob);assert.equal(clash.status,409,JSON.stringify({clash,lastError}));
        assert.equal(await scalar('SELECT count(*)::int FROM public.organization_memberships WHERE organization_id=$1 AND user_id=$2',[organization.id,bob.id]),0);
      });
      await t.test('group parent rules are canonical: own company allowed, foreign or group parent denied',async()=>{
        assert.ok(organization);const group={kind:'group',name:'Fixture child',slug:'r5-business-child',town_name:'La Torre de les Maçanes',parentOrganizationId:organization.id};
        const denied=await call('createOrganization',{organization:{...group,slug:'r5-business-foreign-child'}},bob);assert.equal(denied.status,403,JSON.stringify({denied,lastError}));
        const created=await call('createOrganization',{organization:group},alice);assert.equal(created.status,201,JSON.stringify({created,lastError}));assert.equal(created.body.parent_organization_id,organization.id);
        const nested=await call('createOrganization',{organization:{...group,slug:'r5-business-nested',parentOrganizationId:created.body.id}},alice);assert.equal(nested.status,403,JSON.stringify({nested,lastError}));
        const standalone=await call('createOrganization',{organization:{...group,slug:'r5-business-no-parent',parentOrganizationId:null}},charlie);assert.equal(standalone.status,201,JSON.stringify({standalone,lastError}));
      });
      await t.test('a failed town write rolls back the new company and owner membership',async()=>{
        const beforeMemberships=await scalar('SELECT count(*)::int FROM public.organization_memberships');
        await pg.exec("CREATE FUNCTION private.r5_fixture_refuse_town() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.slug='r5-business-refuse-town' THEN RAISE EXCEPTION 'fixture town failure' USING ERRCODE='42501'; END IF; RETURN NEW; END $$; CREATE TRIGGER r5_fixture_refuse_town BEFORE UPDATE OF town_name ON public.organizations FOR EACH ROW EXECUTE FUNCTION private.r5_fixture_refuse_town();");
        const rejected=await call('createOrganization',{organization:company('r5-business-refuse-town')},alice);assert.equal(rejected.status,403,JSON.stringify({rejected,lastError}));assert.equal(lastError?.message,'fixture town failure','The rejection must reach the injected town-write failure, not an earlier permission error.');assert.equal(await scalar('SELECT count(*)::int FROM public.organizations WHERE slug=$1',['r5-business-refuse-town']),0);assert.equal(await scalar('SELECT count(*)::int FROM public.organization_memberships'),beforeMemberships);
      });
      await t.test('cookieB with expectedActorA cannot create an organization for either person',async()=>{
        const input=request({organization:company('r5-business-wrong-actor')},bob);input.headers['x-sdp-expected-actor']=alice.id;
        const denied=await backend.handle('createOrganization',input);assert.equal(denied.status,409);assert.equal(denied.body.error,'session_actor_changed');assert.equal(await scalar('SELECT count(*)::int FROM public.organizations WHERE slug=$1',['r5-business-wrong-actor']),0);
      });
      await t.test('overlong or identity-bearing organization fields fail before SQL',async()=>{
        const before=calls;
        for(const value of[company('r5-business-invalid',{lema:'x'.repeat(257)}),company('r5-business-invalid',{created_by:bob.id}),company('r5-business-invalid',{tenant_id:'00000000-0000-4000-8000-000000000000'})])assert.equal((await call('createOrganization',{organization:value},alice)).status,400);
        assert.equal(calls,before);
      });
    }finally{await pg.close();}
  });
}
