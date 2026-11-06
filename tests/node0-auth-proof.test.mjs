import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {creaAuthNodeZero,creaCredencialNodeZero,NODE0_AUTH_TENANT,hashTokenNodeZero} from '../tooling/node0/auth-node0.mjs';
import {creaSessioNodeZeroHttp} from '../src/data/node0/sessioNodeZeroHttp.js';
import {creaAdaptadorNodeZeroHttp} from '../src/data/node0/adaptadorNodeZeroHttp.js';
import {preparaClientPrivatNodeZero} from '../src/data/node0/clientPrivatNodeZero.js';
import {metodesSenseCas} from '../src/data/conformitat/kit.js';
import {verificaAmbFormulari} from './fixtures/node0-auth-proof-ui.mjs';
import {creaPlaMigracions,preparaHidratacio,generaSql} from '../tooling/node0/hidrata-postgres-node0.mjs';
const moduleURL=process.env.SDP_PGLITE_MODULE?pathToFileURL(process.env.SDP_PGLITE_MODULE):null;
const {PGlite}=moduleURL?await import(moduleURL.href):{}, {pgcrypto}=moduleURL?await import(new URL('./contrib/pgcrypto.js',moduleURL)):{};
const testSql=(name,run)=>test(name,{skip:moduleURL?false:'Set SDP_PGLITE_MODULE for the actual disposable PostgreSQL proof'},run);
const PA='Attacker submitted first password 101!',PV='Victim submitted initial password 102!',PF='Victim explicitly chooses final password 103!',PR='Victim explicitly resets password 104!';
const consent={accepta_rgpd:true,versio_politica:'2.5'},headers={origin:'https://socdepoble.cat','content-type':'application/json'};
const signup=(email,password=PA)=>({email,password,metadata:{...consent,tenant_id:NODE0_AUTH_TENANT,full_name:'Disposable proof fixture'}});
testSql('R6 email proof owns the final password, one-use credential version, consent and24h pending TTL',async t=>{
 const initial=new PGlite();await initial.exec('CREATE DATABASE socdepoble_node0');const image=await initial.dumpDataDir('none');await initial.close();
 const pg=new PGlite({database:'socdepoble_node0',loadDataDir:image,extensions:{pgcrypto}});let queue=Promise.resolve();const mail=[];
 const db={query(sql){const work=queue.then(async()=>{try{const results=await pg.exec('BEGIN; SET LOCAL ROLE node0_authenticator; '+sql+' COMMIT;');return results.find(r=>r.rows?.[0]?.result!==undefined)?.rows[0].result;}catch(error){await pg.exec('ROLLBACK');throw Object.assign(Error('fixture_sql_failed'),{sqlState:error.code});}});queue=work.catch(()=>{});return work;}};
 const auth=creaAuthNodeZero({db,rateSecret:randomBytes(32),mailTransport:async msg=>mail.push(msg)});
 const call=(action,body={},cookie)=>auth.handle(action,{headers:{...headers,...(cookie?{cookie}:{})},body,remoteAddress:'198.51.100.61'});
 const sql=fs.readFileSync(new URL('../tooling/node0/auth-node0.sql',import.meta.url),'utf8');
 const q=async(statement,args=[])=> (await pg.query(statement,args)).rows;
 const latest=email=>mail.filter(msg=>msg.to===email).at(-1);
 const verify=(token,password=PF,metadata=consent)=>call('verify-email',{token,password,...(metadata?{metadata}:{})});
 let email='victim-primary@example.invalid',firstToken,secondToken,firstCookie,secondCookie,id;
 try{
  await pg.exec(generaSql(creaPlaMigracions(),await preparaHidratacio(),{advisoryLock:false}));await pg.exec(sql);
  await t.test('installation is idempotent, all79 migrations real (R9: plus the /legal 2.5 seal) and zero people precreated',async()=>{
   assert.equal((await q('SELECT count(*)::int n FROM node0.schema_migrations'))[0].n,79);assert.equal((await q('SELECT count(*)::int n FROM auth.users'))[0].n,0);await pg.exec(sql);
   assert.equal((await q("SELECT to_regprocedure('private.node0_auth_verify(text)') IS NULL missing"))[0].missing,true);
  });
  await t.test('pending registration has no attributed canonical consent, no session and a24h deadline',async()=>{
   assert.equal((await call('register',signup(email))).status,202);firstToken=latest(email).token;
   assert.equal(latest(email).from,'socdepoble@socdepoble.org');
   const row=(await q('SELECT c.user_id,c.version::int,c.pending_until-c.created_at AS ttl,u.email_confirmed_at FROM private.node0_credentials c JOIN auth.users u ON u.id=c.user_id WHERE c.email=$1',[email]))[0];id=row.user_id;
   assert.equal(row.version,1);assert.equal(row.email_confirmed_at,null);assert.equal((await q('SELECT count(*)::int n FROM public.consentiments WHERE user_id=$1',[id]))[0].n,0);
   assert.equal((await q('SELECT consentiment_rgpd_at FROM public.profiles WHERE id=$1',[id]))[0].consentiment_rgpd_at,null);
   assert.equal((await q("SELECT pending_until BETWEEN created_at+interval '23 hours 59 minutes' AND created_at+interval '24 hours 1 minute' valid FROM private.node0_credentials WHERE user_id=$1",[id]))[0].valid,true);
  });
  await t.test('repeat pending registration rotates credentials and token while preserving original pending TTL',async()=>{
   const before=(await q('SELECT digest,pending_until FROM private.node0_credentials WHERE user_id=$1',[id]))[0];assert.equal((await call('register',signup(email,PV))).status,202);secondToken=latest(email).token;
   const after=(await q('SELECT digest,pending_until,version::int FROM private.node0_credentials WHERE user_id=$1',[id]))[0];assert.notEqual(after.digest,before.digest);assert.equal(after.version,2);assert.deepEqual(after.pending_until,before.pending_until);assert.notEqual(firstToken,secondToken);assert.equal(mail.length,2);
   assert.equal((await verify(firstToken)).status,400);assert.equal((await call('login',{email,password:PV})).status,401);
  });
  await t.test('token only, missing consent or wrong shown version has zero activation and never consumes a valid token',async()=>{
   assert.equal((await call('verify-email',{token:secondToken})).status,400);
   assert.equal((await verify(secondToken,PF,null)).status,422);
   assert.equal((await verify(secondToken,PF,{accepta_rgpd:true,versio_politica:'2.3'})).status,422);
   assert.equal((await q('SELECT email_confirmed_at FROM auth.users WHERE id=$1',[id]))[0].email_confirmed_at,null);assert.equal((await q('SELECT count(*)::int n FROM public.consentiments WHERE user_id=$1',[id]))[0].n,0);
   assert.equal((await q('SELECT count(*)::int n FROM private.node0_email_challenges WHERE token_hash=$1',[hashTokenNodeZero(secondToken)]))[0].n,1);
  });
  await t.test('receiver chooses a NEW final password; neither pre-registration password gains access',async()=>{
   const verified=await verify(secondToken);assert.equal(verified.status,200);assert.deepEqual(verified.body,{verified:true,login_required:true});assert.equal(verified.headers['Set-Cookie'],undefined);assert.equal((await verify(secondToken)).status,400);
   for(const password of [PA,PV])assert.equal((await call('login',{email,password})).status,401);
   const login=await call('login',{email,password:PF});assert.equal(login.status,200);firstCookie=login.headers['Set-Cookie'].split(';')[0];
   const c=(await q("SELECT versio_politica,accio,origen FROM public.consentiments WHERE user_id=$1 AND tipus='rgpd_acepta'",[id]));assert.deepEqual(c.map(r=>[r.versio_politica,r.accio,r.origen]),[['2.5','atorga','alta']]);
  });
  await t.test('verified duplicate registration does not rotate credentials, notify, revoke or overwrite the account',async()=>{
   const before=(await q('SELECT version::int,digest FROM private.node0_credentials WHERE user_id=$1',[id]))[0],sent=mail.length;
   assert.equal((await call('register',signup(email,PA))).status,202);assert.equal(mail.length,sent);assert.deepEqual((await q('SELECT version::int,digest FROM private.node0_credentials WHERE user_id=$1',[id]))[0],before);assert.equal((await call('session',{},firstCookie)).body.user.id,id);
  });
  await t.test('email password recovery emits purpose-bound proof, revokes ALL sessions and never fabricates consent',async()=>{
   secondCookie=(await call('login',{email,password:PF})).headers['Set-Cookie'].split(';')[0];const nConsent=(await q('SELECT count(*)::int n FROM public.consentiments WHERE user_id=$1',[id]))[0].n;
   assert.equal((await call('request-password-reset',{email})).status,202);const proof=latest(email);assert.equal(proof.purpose,'reset-password');
   assert.equal((await verify(proof.token)).status,400,'reset proof is not a verification proof');
   const reset=await call('reset-password',{token:proof.token,password:PR});assert.equal(reset.status,200);assert.deepEqual(reset.body,{password_changed:true,login_required:true});assert.equal(reset.headers['Set-Cookie'],undefined);
   for(const cookie of [firstCookie,secondCookie])assert.equal((await call('session',{},cookie)).body.user,null);
   assert.equal((await call('reset-password',{token:proof.token,password:PA})).status,400);assert.equal((await call('login',{email,password:PF})).status,401);assert.equal((await call('login',{email,password:PR})).status,200);
   assert.equal((await q('SELECT count(*)::int n FROM public.consentiments WHERE user_id=$1',[id]))[0].n,nConsent);
  });
  await t.test('unknown recovery is generic202 with no email/account; no mail transport fails503 BEFORE any DB write',async()=>{
   const sent=mail.length;assert.deepEqual((await call('request-password-reset',{email:'unknown@example.invalid'})).body,{recovery_requested:true});assert.equal(mail.length,sent);
   let calls=0;const noMail=creaAuthNodeZero({db:{query(){calls++;throw Error('must not touch storage');}},rateSecret:randomBytes(32)});
   for(const action of ['register','request-password-reset','resend-verification']){const result=await noMail.handle(action,{headers,body:signup('nomail@example.invalid'),remoteAddress:'198.51.100.7'});assert.equal(result.status,503);}assert.equal(calls,0);
  });
  await t.test('pending email recovery requires its OWN explicit consent and sets the receiver password',async()=>{
   const pending='pending-reset@example.invalid';await call('register',signup(pending));const verifyToken=latest(pending).token;await call('request-password-reset',{email:pending});const token=latest(pending).token;
   assert.equal((await call('reset-password',{token,password:PR})).status,400);assert.equal((await verify(verifyToken)).status,400);
   assert.equal((await call('reset-password',{token,password:PR,metadata:consent})).status,200);assert.equal((await call('login',{email:pending,password:PA})).status,401);assert.equal((await call('login',{email:pending,password:PR})).status,200);
   assert.equal((await q("SELECT count(*)::int n FROM public.consentiments c JOIN private.node0_credentials a ON a.user_id=c.user_id WHERE a.email=$1",[pending]))[0].n,1);
  });
  await t.test('resend invalidates previous token; credential-version drift and challenge expiry cannot activate',async()=>{
   const p='stale@example.invalid';await call('register',signup(p));const old=latest(p).token;await call('resend-verification',{email:p});const current=latest(p).token;assert.notEqual(old,current);assert.equal((await verify(old)).status,400);
   await q('UPDATE private.node0_credentials SET version=version+1 WHERE email=$1',[p]);assert.equal((await verify(current)).status,400);
   await call('resend-verification',{email:p});const expired=latest(p).token;await q('UPDATE private.node0_email_challenges SET expires_at=clock_timestamp()-interval \'1 second\' WHERE token_hash=$1',[hashTokenNodeZero(expired)]);assert.equal((await verify(expired)).status,400);
  });
  await t.test('pending24h expiry refuses even fresh proof; bounded purge removes only expired never-verified accounts',async()=>{
   const expired='expired@example.invalid';await call('register',signup(expired));const token=latest(expired).token;await q('UPDATE private.node0_credentials SET pending_until=clock_timestamp()-interval \'1 second\' WHERE email=$1',[expired]);const sent=mail.length;
   assert.equal((await verify(token)).status,400);assert.equal((await call('resend-verification',{email:expired})).status,202);assert.equal(mail.length,sent);
   await q('SELECT private.node0_auth_purge_pending()');assert.equal((await q('SELECT count(*)::int n FROM auth.users WHERE email=$1',[expired]))[0].n,0);assert.equal((await q('SELECT count(*)::int n FROM auth.users WHERE id=$1',[id]))[0].n,1);
  });
  await t.test('verification binds the actually presented consent version and reset binds the current credential version',async()=>{
   const email='consent-binding@example.invalid';await call('register',signup(email));const token=latest(email).token;
   await q('UPDATE private.node0_email_challenges SET consent_version=$1 WHERE token_hash=$2',['2.3',hashTokenNodeZero(token)]);
   assert.equal((await verify(token,PF,consent)).status,400);assert.equal((await q('SELECT email_confirmed_at FROM auth.users WHERE email=$1',[email]))[0].email_confirmed_at,null);
   await call('request-password-reset',{email});const reset=latest(email).token;await q('UPDATE private.node0_credentials SET version=version+1 WHERE email=$1',[email]);
   assert.equal((await call('reset-password',{token:reset,password:PR,metadata:consent})).status,400);
  });
  await t.test('actual HTTP helper and optional SDK groups send explicit password/consent; no token storage or automatic login',async()=>{
   const email='sdk-proof@example.invalid';let cookie='',requests=[];
   const fetchImpl=async(url,options)=>{
    requests.push({route:new URL(url).pathname,method:options.method,body:options.body});
    if(url.endsWith('/status'))return new Response(JSON.stringify({node:'node0',postgresql:{ok:true},capabilities:{userSessions:true,actorBinding:true,roleRead:true,...auth.capabilities}}),{headers:{'Content-Type':'application/json'}});
    const action=new URL(url).pathname.split('/').at(-1),body=options.body?JSON.parse(options.body):{};
    const response=await auth.handle(action,{headers:{...headers,...(cookie?{cookie}:{}),...(new Headers(options.headers).get('x-sdp-expected-actor')?{'x-sdp-expected-actor':new Headers(options.headers).get('x-sdp-expected-actor')}:{} )},body,remoteAddress:'198.51.100.62'});
    if(response.headers['Set-Cookie'])cookie=response.headers['Set-Cookie'].split(';')[0];
    return new Response(JSON.stringify(response.body),{status:response.status,headers:response.headers});
   };
   const publicAdapter=creaAdaptadorNodeZeroHttp({endpoint:'https://socdepoble.cat/api/v1/node0',tenantId:NODE0_AUTH_TENANT,fetchImpl}),transport=creaSessioNodeZeroHttp({endpoint:'https://socdepoble.cat/api/v1/node0',origin:'https://socdepoble.cat',fetchImpl});
   const client=await preparaClientPrivatNodeZero({publicAdapter,transport,habilitaPrivat:true,emetCanvi(){}});
   try{
    assert.deepEqual(metodesSenseCas(),[],'new optional methods must have conformity cases');
    await client.adapter.registerWithPassword(email,PA,{...consent});assert.equal(client.adapter.getCurrentUser(),null);
    const before=requests.length;await assert.rejects(client.adapter.confirmaCorreu('bad-token',PF,consent),e=>e.code==='SDP-CORREU-001');assert.equal(requests.length,before);
    await verificaAmbFormulari({token:latest(email).token,password:PF,onConfirma:(...args)=>client.adapter.confirmaCorreu(...args)});assert.equal(client.adapter.getCurrentUser(),null,'email proof never auto logs in');
    assert.equal(requests.find(r=>r.route.endsWith('/verify-email')).method,'POST');
    const proof=JSON.parse(requests.find(r=>r.route.endsWith('/verify-email')).body);assert.equal(proof.password,PF);assert.deepEqual(proof.metadata,consent);
    await client.adapter.loginWithPassword(email,PF);const actor=client.adapter.getCurrentUser().id,epoch=client.inspecta().epoch;
    await client.adapter.demanaRestablimentCorreu(email);assert.equal(client.adapter.getCurrentUser().id,actor);assert.equal(client.inspecta().epoch,epoch);
    await client.adapter.restablixContrasenyaAmbCorreu(latest(email).token,PR);assert.equal(client.adapter.getCurrentUser(),null);assert.equal((await call('login',{email,password:PF})).status,401);assert.equal((await call('login',{email,password:PR})).status,200);
   }finally{client.adapter.destroy();}
  });
  await t.test('installer reapply preserves NEW valid proof but old token-only entry point and helper gates stay inaccessible',async()=>{
   const email='reapply@example.invalid';await call('register',signup(email));const token=latest(email).token;await pg.exec(sql);assert.equal((await verify(token)).status,200);
   for(const role of ['anon','authenticated','node0_runtime','node0_authenticator']){
    await pg.exec('SET ROLE '+role);try{await assert.rejects(pg.query("SELECT private.node0_auth_finish_email(repeat('0',64),'verify',repeat('0',32),repeat('0',128),'2.5')"),e=>e.code==='42501');await assert.rejects(pg.query('SELECT private.node0_auth_purge_pending()'),e=>e.code==='42501');}finally{await pg.exec('RESET ROLE');}
   }
  });
 }finally{await pg.close();}
});

testSql('R5→R6 upgrade invalidates old token-only proof while preserving immutable historical consent evidence',async()=>{
 const initial=new PGlite();await initial.exec('CREATE DATABASE socdepoble_node0');const image=await initial.dumpDataDir('none');await initial.close();
 const pg=new PGlite({database:'socdepoble_node0',loadDataDir:image,extensions:{pgcrypto}}),mail=[];
 try{
  await pg.exec(generaSql(creaPlaMigracions(),await preparaHidratacio(),{advisoryLock:false}));await pg.exec(fs.readFileSync(new URL('./fixtures/node0-auth-r5.sql',import.meta.url),'utf8'));
  const email='upgrade-victim@example.invalid',token=randomBytes(32).toString('base64url'),credential=await creaCredencialNodeZero(PA);
  await pg.query('SELECT private.node0_auth_register($1,$2::jsonb,$3,$4,$5)',[email,JSON.stringify(signup(email).metadata),credential.salt,credential.digest,hashTokenNodeZero(token)]);
  assert.equal((await pg.query('SELECT count(*)::int n FROM public.consentiments')).rows[0].n,1,'legacy evidence existed before migration');
  await pg.exec(fs.readFileSync(new URL('../tooling/node0/auth-node0.sql',import.meta.url),'utf8'));
  assert.equal((await pg.query('SELECT count(*)::int n FROM private.node0_email_challenges')).rows[0].n,0);
  let queue=Promise.resolve();const db={query(sql){const result=queue.then(async()=>{try{const rows=await pg.exec('BEGIN; SET LOCAL ROLE node0_authenticator; '+sql+' COMMIT;');return rows.find(row=>row.rows?.[0]?.result!==undefined)?.rows[0].result;}catch(error){await pg.exec('ROLLBACK');throw Object.assign(Error('fixture_sql_failed'),{sqlState:error.code});}});queue=result.catch(()=>{});return result;}};
  const auth=creaAuthNodeZero({db,rateSecret:randomBytes(32),mailTransport:async message=>mail.push(message)}),call=(action,body)=>auth.handle(action,{headers,body,remoteAddress:'198.51.100.80'});
  assert.equal((await call('verify-email',{token,password:PF,metadata:consent})).status,400);assert.equal((await call('login',{email,password:PA})).status,401);
  assert.equal((await call('register',signup(email,PV))).status,202);assert.equal((await call('verify-email',{token:mail.at(-1).token,password:PF,metadata:consent})).status,200);
  assert.equal((await call('login',{email,password:PA})).status,401);assert.equal((await call('login',{email,password:PV})).status,401);assert.equal((await call('login',{email,password:PF})).status,200);
  assert.equal((await pg.query('SELECT count(*)::int n FROM public.consentiments')).rows[0].n,2,'fresh explicit email-owner acceptance appends; old evidence is not rewritten');
 }finally{await pg.close();}
});
