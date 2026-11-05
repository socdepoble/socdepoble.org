/** Explicit native LAB only. HTTP loopback fixture, never Caddy/public ports.
 * Uses a real direct node0_authenticator login, not a SET ROLE wrapper.
 * Confirmation delivery is captured in memory; no email or Mastodon requests.
 * The Ed25519 key below is the deliberately public RFC9421 test fixture.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {randomBytes,randomUUID,createHash,createHmac,createPublicKey,webcrypto} from 'node:crypto';
import {creaPostgres,sqlText} from '../tooling/node0/postgres-node0.mjs';
import {creaAuthNodeZero,NODE0_AUTH_TENANT} from '../tooling/node0/auth-node0.mjs';
import {creaBackendPrivatNodeZero} from '../tooling/node0/backend-node0.mjs';
import {creaServidor} from '../tooling/node0/servidor-node0-soberania.mjs';
import {creaIdentificadorClientNodeZero} from '../tooling/node0/client-ingress-node0.mjs';

const LAB='node0_gauntlet_r4',ORIGIN='https://socdepoble.cat';
const SOCKET='/Users/javi/socdepoble-node0/dades/run/postgres17';
const PSQL='/Users/javi/local/postgres17/Postgres.app/Contents/Versions/17/bin/psql';
const CLIENT_IP='198.51.100.77';
const enabled=process.env.SDP_NODE0_NATIVE_LAB==='1';
function validaLaboratori(env){
  if(env.SDP_NODE0_NATIVE_LAB!=='1'||env.PGDATABASE!==LAB||env.PGUSER!=='javi'||env.PGHOST!==SOCKET||(env.PGPORT!==undefined&&env.PGPORT!=='5432')||(env.NODE0_PSQL!==undefined&&env.NODE0_PSQL!==PSQL))throw Error('node0_http_native_dedicated_lab_required');
  for(const key of['PGPASSWORD','PGHOSTADDR','PGSERVICE','PGSERVICEFILE','PGOPTIONS'])if(Object.hasOwn(env,key))throw Error('node0_http_native_overrides_rejected');
  return true;
}
test('native HTTP guard refuses production and ambiguous connections before any socket or database',()=>{
  const safe={SDP_NODE0_NATIVE_LAB:'1',PGDATABASE:LAB,PGUSER:'javi',PGHOST:SOCKET,PGPORT:'5432',NODE0_PSQL:PSQL};
  assert.equal(validaLaboratori(safe),true);
  for(const patch of[{SDP_NODE0_NATIVE_LAB:'0'},{PGDATABASE:'socdepoble_node0'},{PGUSER:'node0_authenticator'},{PGHOST:'192.168.0.23'},{PGHOST:'/tmp'},{PGPORT:'5433'},{NODE0_PSQL:'/other/psql'},{PGPASSWORD:'unused'},{PGHOSTADDR:'127.0.0.1'},{PGOPTIONS:'unused'}])assert.throws(()=>validaLaboratori({...safe,...patch}));
});

test('native direct-authenticator HTTP signup, isolation and member-only data',
  {skip:enabled?false:'Set SDP_NODE0_NATIVE_LAB=1 with the exact dedicated LAB connection',timeout:90000},async t=>{
    validaLaboratori(process.env);
    // Construct a small environment; never inherit passwords/services/options
    // or load the real node0.env/ActivityPub private key.
    const env={PGDATABASE:LAB,PGHOST:SOCKET,PGPORT:'5432',PGUSER:'javi',NODE0_PSQL:PSQL,PGPASSFILE:'/dev/null',PATH:'/usr/bin:/bin',LANG:'C'};
    const operator=creaPostgres({env});
    const target=await operator.query("SELECT json_build_object('database',current_database(),'operator',session_user,'version',current_setting('server_version_num')::int,'migrations',(SELECT count(*) FROM node0.schema_migrations),'authReady',to_regprocedure('private.node0_auth_norms_state(text,uuid)') IS NOT NULL);");
    assert.equal(target.database,LAB);assert.equal(target.operator,'javi');assert.ok(target.version>=170000&&target.version<180000);assert.equal(target.migrations,75);assert.equal(target.authReady,true);
    const authDb=creaPostgres({env:{...env,PGUSER:'node0_authenticator'}});
    const roleReady=await authDb.verificaRolAutenticador();
    const roleIdentity=await authDb.query("SELECT json_build_object('login',session_user,'current',current_user);");
    assert.equal(roleIdentity.login,'node0_authenticator');assert.equal(roleIdentity.current,'node0_authenticator');
    // The lab was bootstrapped independently. Install only the lab AP tables
    // needed by the public status/projection handler, with a JSON final value.
    await operator.query(fs.readFileSync(new URL('../tooling/node0/schema-node0.sql',import.meta.url),'utf8')+'\nSELECT to_jsonb(true);');
    const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/node0-rfc9421/rfc9421-ed25519.json',import.meta.url),'utf8'));
    const privateKey=await webcrypto.subtle.importKey('pkcs8',Buffer.from(fixture.privateKeyPkcs8Base64,'base64'),'Ed25519',false,['sign']);
    const fingerprint=createHash('sha256').update(createPublicKey(fixture.publicKeyPem).export({format:'der',type:'spki'})).digest('hex');
    const run=randomUUID().replaceAll('-',''),emails=[`http-${run}-a@example.invalid`,`http-${run}-b@example.invalid`];
    const password=`LAB-HTTP-only-${run}-password`,privateText=`PRIVATE_NOTE_${run}`,memberText=`MEMBER_POST_${run}`,chatText=`PRIVATE_CHAT_${run}`;
    const noteId=randomUUID(),mismatchId=randomUUID(),submissionId=randomUUID(),messageId=randomUUID();
    const rateSecret=randomBytes(32),proxySecret=randomBytes(32).toString('hex'),mail=new Map(),accounts=[];
    const auth=creaAuthNodeZero({db:authDb,rateSecret,mailTransport:async message=>{mail.set(message.to,message.token);}});
    const backend=creaBackendPrivatNodeZero({db:authDb,tenantId:NODE0_AUTH_TENANT});
    let remoteCalls=0;
    const server=creaServidor({db:operator,claus:{privateKey,publicKeyPem:fixture.publicKeyPem,fingerprint},auth,backend,
      identificaClient:creaIdentificadorClientNodeZero({proxySecret}),request:async()=>{remoteCalls++;throw Error('native_http_no_external_transport');}});
    let port,policy,filId;
    const emailSql=emails.map(sqlText).join(',');
    const collision=await operator.query(`SELECT json_build_object('count',count(*)) FROM auth.users WHERE email IN (${emailSql});`);assert.equal(collision.count,0);
    function wire(route,{method='POST',body={},person,expectedActor=person?.id,origin=ORIGIN}={}){
      const bytes=method==='POST'?Buffer.from(JSON.stringify(body)):null;
      return new Promise((resolve,reject)=>{
        const headers={Host:'socdepoble.cat',Origin:origin,'X-Sdp-Proxy-Auth':proxySecret,'X-Sdp-Client-IP':CLIENT_IP,
          ...(bytes?{'Content-Type':'application/json','Content-Length':bytes.length}:{}),...(person?{Cookie:person.cookie}:{}),...(expectedActor?{'X-Sdp-Expected-Actor':expectedActor}:{})};
        const request=http.request({host:'127.0.0.1',port,path:'/api/v1/node0/'+route,method,headers,agent:false},response=>{
          const chunks=[];let size=0;
          response.on('data',chunk=>{size+=chunk.length;if(size>2*1024*1024)request.destroy(Error('native_http_response_limit'));else chunks.push(chunk);});
          response.on('error',reject);response.on('end',()=>{
            try{resolve({status:response.statusCode,headers:response.headers,body:JSON.parse(Buffer.concat(chunks).toString('utf8'))});}catch{reject(Error('native_http_invalid_json'));}
          });
        });
        request.setTimeout(20000,()=>request.destroy(Error('native_http_request_timeout')));request.on('error',reject);request.end(bytes);
      });
    }
    const ok=(response,status)=>assert.equal(response.status,status,response.body?.error??'HTTP status');
    const noCors=response=>assert.equal(response.headers['access-control-allow-origin'],undefined);
    try{
      await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});port=server.address().port;
      await t.test('direct request-role grants and ready status reflect the actual fixture dependencies',async()=>{
        assert.equal(roleReady,true);
        await assert.rejects(authDb.query('SELECT row_to_json(c) FROM private.node0_credentials c LIMIT 1;'),e=>e.sqlState==='42501');
        const status=await wire('status',{method:'GET',origin:'https://socdepoble.org'});ok(status,200);
        assert.equal(status.body.postgresql.ok,true);assert.equal(status.body.ed25519.fingerprint,fingerprint);
        for(const name of['userSessions','actorBinding','norms','emailDelivery','emailVerificationWithPassword','emailPasswordRecovery'])assert.equal(status.body.capabilities[name],true);
        assert.equal(status.body.capabilities.adminPublish,false);assert.equal(status.body.capabilities.possePrepared,false);
        assert.equal(status.body.activitypub.remoteInteropVerified,false);assert.equal(status.headers['access-control-allow-origin'],'*');
      });
      await t.test('signup, in-memory confirmation and login traverse HTTP for two synthetic people',async()=>{
        policy=await wire('auth/policy',{method:'GET'});ok(policy,200);
        for(const[index,email]of emails.entries()){
          const registration=await wire('auth/register',{body:{email,password,metadata:{accepta_rgpd:true,versio_politica:policy.body.privacy.version,tenant_id:NODE0_AUTH_TENANT,full_name:`HTTP LAB ${index}`}}});
          ok(registration,202);assert.equal(registration.body.verification_required,true);assert.equal(registration.headers['set-cookie'],undefined);
          const token=mail.get(email);assert.ok(typeof token==='string'&&/^[A-Za-z0-9_-]{43}$/.test(token),'captured laboratory confirmation token');
          const confirmation=await wire('auth/verify-email',{body:{token,password,metadata:{accepta_rgpd:true,versio_politica:policy.body.privacy.version}}});ok(confirmation,200);
          const login=await wire('auth/login',{body:{email,password}});ok(login,200);noCors(login);
          const setCookie=login.headers['set-cookie']?.[0];assert.ok(typeof setCookie==='string'&&setCookie.includes('; HttpOnly')&&setCookie.includes('; Secure')&&setCookie.includes('; SameSite=Strict')&&setCookie.includes('; Path=/'));
          assert.equal(login.body.access_token,undefined);assert.equal(login.body.token,undefined);
          accounts.push({id:login.body.user.id,email,cookie:setCookie.split(';')[0]});
        }
        assert.notEqual(accounts[0].id,accounts[1].id);
      });
      await t.test('norms state starts unaccepted and records an actual acceptance timestamp over HTTP',async()=>{
        for(const person of accounts){
          const before=await wire('auth/norms-state',{person});ok(before,200);assert.equal(before.body.versio,policy.body.normsVersion);assert.equal(before.body.acceptada_al,null);
          const accepted=await wire('auth/norms',{person,body:{accept:true,version:policy.body.normsVersion}});ok(accepted,200);
          const after=await wire('auth/norms-state',{person});ok(after,200);assert.ok(Number.isFinite(Date.parse(after.body.acceptada_al)));
        }
      });
      await t.test('private Notes persist for the owner and remain invisible and immutable to the other person',async()=>{
        const created=await wire('private/createNote',{person:accounts[0],body:{input:{id:noteId,folderId:'f-notes',title:'HTTP private note',content:privateText}}});ok(created,201);assert.equal(created.body.id,noteId);assert.equal(created.body.content,privateText);
        const own=await wire('private/loadNotes',{person:accounts[0],body:{noteId}});ok(own,200);assert.equal(own.body.rows[0].content,privateText);
        const other=await wire('private/loadNotes',{person:accounts[1],body:{noteId}});ok(other,200);assert.deepEqual(other.body.rows,[]);
        const denied=await wire('private/updateNote',{person:accounts[1],body:{id:noteId,expectedRevision:created.body.revision,updates:{content:'forbidden'}}});ok(denied,404);
      });
      await t.test('an A expectation with the B cookie yields409 and zero business writes',async()=>{
        const denied=await wire('private/createNote',{person:accounts[1],expectedActor:accounts[0].id,body:{input:{id:mismatchId,title:'must not exist',content:privateText}}});ok(denied,409);assert.equal(denied.body.error,'session_actor_changed');
        const actual=await operator.query(`SELECT json_build_object('count',count(*)) FROM public.notes WHERE id=${sqlText(mismatchId)}::uuid;`);assert.equal(actual.count,0);
      });
      await t.test('wrong private method and foreign Origin fail without private CORS',async()=>{
        const wrongMethod=await wire('private/getProfile',{method:'GET',person:accounts[0]});ok(wrongMethod,405);noCors(wrongMethod);
        const foreign=await wire('private/getProfile',{person:accounts[0],origin:'https://socdepoble.org'});ok(foreign,403);noCors(foreign);
        const session=await wire('auth/session',{method:'GET',person:accounts[0],origin:'https://socdepoble.org'});ok(session,403);noCors(session);
      });
      await t.test('member-only publication is readable privately and never appears in public projection endpoints',async()=>{
        const saved=await wire('private/appendSectionSubmissionNetworkOnly',{person:accounts[0],body:{submission:{id:submissionId,sectionId:'mur',title:'HTTP LAB member-only',payload:{content:memberText},actor:{tipus:'persona',id:accounts[0].id}}}});ok(saved,201);assert.equal(saved.body.owner_user_id,accounts[0].id);
        const page=await wire('private/loadSeccioPage',{person:accounts[1],body:{sectionId:'mur',limit:50}});ok(page,200);assert.ok(page.body.rows.some(row=>row.id===submissionId));
        for(const route of['core','mur','notes']){
          const publicRead=await wire(route,{method:'GET',origin:'https://socdepoble.org'});ok(publicRead,200);
          const text=JSON.stringify(publicRead.body);for(const value of[...emails,...accounts.map(a=>a.id),privateText,memberText,submissionId])assert.equal(text.includes(value),false,'public projection must not expose synthetic private/member data');
        }
      });
      await t.test('direct chat RPC and201 text delivery traverse the actual authenticated HTTP boundary',async()=>{
        const direct=await wire('private/creaFilDirecte',{person:accounts[0],body:{altreUsuariId:accounts[1].id,titol:`HTTP LAB ${run}`}});ok(direct,200);filId=typeof direct.body==='string'?direct.body:direct.body?.id;assert.match(filId,/^[a-f0-9-]{36}$/i);
        const sent=await wire('private/enviaMissatge',{person:accounts[0],body:{filId,id:messageId,text:chatText}});ok(sent,201);assert.ok(Number(sent.body[0]?.seq)>0);
        const read=await wire('private/loadMissatges',{person:accounts[1],body:{filId,limit:10}});ok(read,200);assert.ok(read.body.some(message=>message.cos===chatText));
      });
      await t.test('logout revokes the cookie through HTTP while the other person remains authenticated',async()=>{
        const logout=await wire('auth/logout',{person:accounts[0]});ok(logout,200);assert.ok(logout.headers['set-cookie']?.[0].includes('Max-Age=0'));
        const denied=await wire('private/loadNotes',{person:accounts[0]});ok(denied,401);noCors(denied);
        const emptySession=await wire('auth/session',{method:'GET',person:accounts[0]});ok(emptySession,200);assert.equal(emptySession.body.user,null);
        const other=await wire('private/getProfile',{person:accounts[1]});ok(other,200);assert.equal(other.body.id,accounts[1].id);
        assert.equal(remoteCalls,0);
      });
    }finally{
      server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));
      // Recover exact generated IDs even if confirmation/login failed before
      // the HTTP response. No broad test-prefix deletion and no production DB.
      const owned=await operator.query(`SELECT coalesce(jsonb_agg(id),'[]'::jsonb) FROM auth.users WHERE email IN (${emailSql});`);
      const ids=[...new Set([...owned,...accounts.map(a=>a.id)])],idSql=ids.length?ids.map(id=>`${sqlText(id)}::uuid`).join(','):null;
      if(idSql)await operator.query(`BEGIN; DELETE FROM public.section_submissions WHERE owner_user_id IN (${idSql}); DELETE FROM public.notes WHERE owner_user_id IN (${idSql}); DELETE FROM public.xat_fils WHERE creat_per IN (${idSql}); DELETE FROM auth.users WHERE id IN (${idSql}) AND email IN (${emailSql}); COMMIT; SELECT to_jsonb(true);`);
      const keys=new Set();for(const action of['register','verify','login']){keys.add(createHmac('sha256',rateSecret).update(action+'\0ip\0'+CLIENT_IP).digest('hex'));for(const email of emails)keys.add(createHmac('sha256',rateSecret).update(action+'\0email\0'+email).digest('hex'));}
      await operator.query(`WITH removed AS (DELETE FROM private.node0_auth_rates WHERE key_hash IN (${[...keys].map(sqlText).join(',')}) RETURNING key_hash) SELECT json_build_object('ratesRemoved',(SELECT count(*) FROM removed));`);
      const remaining=await operator.query(`SELECT json_build_object('users',(SELECT count(*) FROM auth.users WHERE email IN (${emailSql})),'notes',(SELECT count(*) FROM public.notes WHERE id IN (${sqlText(noteId)}::uuid,${sqlText(mismatchId)}::uuid)),'posts',(SELECT count(*) FROM public.section_submissions WHERE id=${sqlText(submissionId)}::uuid),'threads',(SELECT count(*) FROM public.xat_fils WHERE ${filId?`id=${sqlText(filId)}::uuid`:'false'}));`);
      assert.deepEqual(remaining,{users:0,notes:0,posts:0,threads:0},'all generated HTTP fixture records removed');
      t.diagnostic('LAB-only HTTP fixture: direct authenticator connection; captured mail; no Caddy, production config or remote publication; generated records cleaned.');
    }
  });
