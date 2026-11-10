import { VERSIO_POLITICA_PRIVACITAT } from '../src/config/politicaPrivacitat.js';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { creaAuthNodeZero, creaCredencialNodeZero, verificaContrasenyaNodeZero, hashSessioNodeZero,
  hashTokenNodeZero, contextSqlNodeZero, NODE0_AUTH_COOKIE, NODE0_AUTH_TENANT, NODE0_SCRYPT } from '../tooling/node0/auth-node0.mjs';
import { preparaHidratacio, generaSql } from '../tooling/node0/hidrata-postgres-node0.mjs';
import {creaPlaMigracionsR15A3 as creaPlaMigracions,comprovaLedgerR15A3} from './helpers/plaMigracionsR15A3.js';
import { sqlText } from '../tooling/node0/postgres-node0.mjs';

const origin = 'https://socdepoble.cat';
const secret = Buffer.alloc(32, 7);
const headers = { origin, 'content-type': 'application/json' };
const pass = 'La prova local llarga 42!';
const signup = (email, name = 'Persona de prova') => ({ email, password: pass,
  metadata: { accepta_rgpd: true, versio_politica: VERSIO_POLITICA_PRIVACITAT, tenant_id: NODE0_AUTH_TENANT, full_name: name } });
const verifiedActors = new Map();
const cookieOf = result => { const cookie=result.headers['Set-Cookie']?.split(';')[0]; if(cookie&&result.body.user?.id)verifiedActors.set(cookie,result.body.user.id); return cookie; };
const input = (body = {}, cookie, remoteAddress = '127.0.0.1') => ({ headers: { ...headers, ...(cookie ? { cookie, 'x-sdp-expected-actor': verifiedActors.get(cookie) } : {}) }, body, remoteAddress });

test('cookie parser accepts one canonical opaque token, rejects duplicates and query-style aliases', () => {
  const token = randomBytes(32).toString('base64url');
  const cookie = `${NODE0_AUTH_COOKIE}=${token}`;
  assert.equal(hashSessioNodeZero({ cookie }), hashTokenNodeZero(token));
  for (const raw of ['', `${cookie}; ${cookie}`, `${NODE0_AUTH_COOKIE}=short`, `${NODE0_AUTH_COOKIE}=${token}=`, 'x'.repeat(8193)]) assert.equal(hashSessioNodeZero({ cookie: raw }), null);
  assert.equal(hashSessioNodeZero({ authorization: `Bearer ${token}` }), null);
  assert.throws(() => contextSqlNodeZero("'; select 1;--"));
  assert.match(contextSqlNodeZero(hashTokenNodeZero(token)), /^private\.node0_auth_context\(convert_from/);
});
test('scrypt uses fresh 16-byte salts, strong bounded parameters and exact password comparisons', async () => {
  assert.equal(NODE0_SCRYPT.N, 131072);
  const a = await creaCredencialNodeZero(pass), b = await creaCredencialNodeZero(pass);
  assert.match(a.salt, /^[a-f0-9]{32}$/); assert.match(a.digest, /^[a-f0-9]{128}$/); assert.notEqual(a.salt, b.salt);
  assert.equal(await verificaContrasenyaNodeZero(pass, a), true);
  assert.equal(await verificaContrasenyaNodeZero(pass + 'x', a), false);
  assert.equal(await verificaContrasenyaNodeZero(pass, null), false);
  for (const value of ['short', 'a'.repeat(257), 'a'.repeat(12) + '\0', '\ud800'.repeat(12)]) await assert.rejects(creaCredencialNodeZero(value), /password_invalid/);
});
test('configuration requires HTTPS origin, fixed local tenant and private durable rate secret', () => {
  const db = { query() { throw new Error('not called'); } };
  for (const options of [{}, { rateSecret: 'short' }, { rateSecret: secret, origin: 'http://socdepoble.cat' }, { rateSecret: secret, origin: `${origin}/` }, { rateSecret: secret, tenantId: 'untrusted' }]) assert.throws(() => creaAuthNodeZero({ db, ...options }));
  const noMail=creaAuthNodeZero({db,rateSecret:secret});assert.deepEqual(noMail.capabilities,{actorBinding:true,norms:true,emailDelivery:false,emailVerificationWithPassword:false,emailPasswordRecovery:false});assert.ok(Object.isFrozen(noMail.capabilities));
  assert.equal(creaAuthNodeZero({db,rateSecret:secret,mailTransport:async()=>{}}).capabilities.emailDelivery,true);
});
test('mutations reject missing/foreign Origin or form content before any database call', async () => {
  let queries = 0;
  const auth = creaAuthNodeZero({ db: { query() { queries++; throw new Error('private SQL detail'); } }, rateSecret: secret });
  for (const h of [{}, { ...headers, origin: 'https://socdepoble.org' }, { ...headers, origin: 'null' }, { ...headers, 'content-type': 'text/plain' }]) {
    const result = await auth.handle('login', { headers: h, body: { email: 'a@example.test', password: pass } });
    assert.ok([403, 415].includes(result.status));
  }
  assert.equal(queries, 0);
  assert.equal((await auth.handle('register', input(signup('a@example.test')))).status, 503);
  assert.equal(queries, 0, 'missing mail transport creates no account or sent-email screen');
  const session = await auth.handle('session', { headers: { origin: 'https://socdepoble.org' } });
  assert.equal(session.status, 403);
});
test('bound authentication mutations reject missing actor proof without touching storage or cookies',async()=>{
  let queries=0;const auth=creaAuthNodeZero({db:{query(){queries++;throw new Error('must not execute');}},rateSecret:secret});
  for(const action of ['logout','password','norms','norms-state'])for(const actor of ['', 'invalid', '00000000-0000-4000-8000-000000000001,00000000-0000-4000-8000-000000000002']){
    const result=await auth.handle(action,{...input({}),headers:{...headers,'x-sdp-expected-actor':actor}});
    assert.equal(result.status,409);assert.deepEqual(result.body,{error:'actor_binding_required'});assert.equal(result.headers['Set-Cookie'],undefined);
  }
  assert.equal(queries,0);
});

const modulePath = process.env.SDP_PGLITE_MODULE;
if (!modulePath) test('real SQL auth needs explicitly provided PGlite', { skip: 'Set SDP_PGLITE_MODULE; no mocked SQL authorization' }, () => {});
else {
  const moduleURL = modulePath.startsWith('file:') ? new URL(modulePath) : pathToFileURL(path.resolve(modulePath));
  const { PGlite } = await import(moduleURL.href);
  const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
  test('local identity against all canonical migrations, consent, verification, sessions and PostgreSQL permissions', async t => {
    // A fresh PGlite boots template1 even when a missing database is requested.
    // Create and reopen the real dedicated name; never weaken the SQL guard.
    const initial = new PGlite();
    await initial.exec('CREATE DATABASE socdepoble_node0');
    const image = await initial.dumpDataDir('none');
    await initial.close();
    const db = new PGlite({ database: 'socdepoble_node0', loadDataDir: image, extensions: { pgcrypto } });
    const deliveries = [];
    let queue = Promise.resolve();
    const connection = { query(sql) {
      const task = queue.then(async () => {
        try {
          const results = await db.exec(`BEGIN; SET LOCAL ROLE node0_authenticator; ${sql} COMMIT;`);
          const result = results.find(r => r.rows?.[0] && Object.hasOwn(r.rows[0], 'result'));
          return result?.rows[0].result;
        } catch (error) { await db.exec('ROLLBACK'); throw Object.assign(new Error('node0_database_query_failed'),{sqlState:error.code}); }
      });
      queue = task.catch(() => {}); return task;
    } };
    const auth = creaAuthNodeZero({ db: connection, rateSecret: secret, mailTransport: async message => { deliveries.push(message); } });
    const sql = fs.readFileSync(new URL('../tooling/node0/auth-node0.sql',import.meta.url), 'utf8');
    const query = (statement, values = []) => db.query(statement, values);
    const counts = async () => (await query('SELECT (SELECT count(*)::int FROM auth.users) AS users,(SELECT count(*)::int FROM public.profiles) AS profiles,(SELECT count(*)::int FROM private.node0_sessions) AS sessions')).rows[0];
    let aliceCookie, aliceSecondCookie, bobCookie;
    try {
      assert.equal((await query('SELECT current_database() AS name')).rows[0].name, 'socdepoble_node0');
      const hydration = await preparaHidratacio();
      await db.exec(generaSql(creaPlaMigracions(), hydration, { advisoryLock: false }));
      await comprovaLedgerR15A3(async(sql,args=[]) => (await db.query(sql,args)).rows);
      await db.exec(sql);
      await t.test('installation is idempotent and creates zero people', async () => {
        assert.deepEqual(await counts(), { users: 0, profiles: 0, sessions: 0 });
        await db.exec(sql);
        assert.deepEqual(await counts(), { users: 0, profiles: 0, sessions: 0 });
        const policy = await auth.handle('policy');
        assert.equal(policy.status, 200); assert.equal(policy.body.privacy.version, VERSIO_POLITICA_PRIVACITAT);
        assert.equal(policy.body.normsVersion, '2026-10-24');
        for(const signature of ['private.node0_auth_logout(text)','private.node0_auth_password(text,bigint,text,text)','private.node0_auth_norms(text,text)'])assert.equal((await query('SELECT to_regprocedure($1) IS NULL AS removed',[signature])).rows[0].removed,true,'Unbound R4 signature must not remain executable');
      });
      await t.test('request roles cannot read password/session/challenge tables or call identity gates', async () => {
        for (const role of ['anon', 'authenticated', 'node0_runtime', 'node0_authenticator']) {
          await db.exec(`SET ROLE ${role}`);
          try {
            for (const table of ['node0_credentials', 'node0_sessions', 'node0_email_challenges', 'node0_auth_rates']) await assert.rejects(query(`SELECT * FROM private.${table}`), e => e.code === '42501');
            if (role !== 'node0_authenticator') {
              await assert.rejects(query("SELECT private.node0_auth_credential('alice@example.test')"), e => e.code === '42501');
              await assert.rejects(query("SELECT private.node0_auth_norms_state(repeat('0',64),gen_random_uuid())"), e => e.code === '42501');
            }
            if(role==='authenticated')await assert.rejects(query('SELECT private.versio_normes_vigent()'),e=>e.code==='42501');
          } finally { await db.exec('RESET ROLE'); }
        }
        const role = (await query("SELECT rolsuper,rolinherit,rolbypassrls FROM pg_roles WHERE rolname='node0_authenticator'")).rows[0];
        assert.deepEqual(role, { rolsuper: false, rolinherit: false, rolbypassrls: false });
        assert.equal((await query("SELECT count(*)::int n FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='node0_runtime')")).rows[0].n, 0);
      });
      await t.test('explicit current privacy acceptance is required; owner/verified claims are discarded', async () => {
        for (const metadata of [{}, { accepta_rgpd: 'true', versio_politica: VERSIO_POLITICA_PRIVACITAT }, { accepta_rgpd: true, versio_politica: '2.6' }, { accepta_rgpd: true, versio_politica: '2.4' }, { accepta_rgpd: true, versio_politica: '2.3' }]) {
          const result = await auth.handle('register', input({ ...signup('invalid@example.test'), metadata }));
          assert.equal(result.status, 422);
        }
        assert.equal((await counts()).users, 0);
        const body = signup(' Alice@Example.test ', 'Alícia prova');
        body.metadata.owner_id = '00000000-0000-4000-8000-000000000001'; body.metadata.role = 'admin'; body.metadata.email_verified = true;
        const result = await auth.handle('register', input(body));
        assert.equal(result.status, 202); assert.equal(result.headers['Set-Cookie'], undefined);
        assert.deepEqual(result.body, { verification_required: true });
        const user = (await query("SELECT * FROM auth.users WHERE email='alice@example.test'")).rows[0];
        assert.equal(user.email_confirmed_at, null); assert.equal(user.raw_user_meta_data.role, undefined);
        assert.equal(user.raw_user_meta_data.email_verified, undefined); assert.equal(user.raw_user_meta_data.owner_id, undefined);
        const consent = (await query('SELECT versio_politica,text_sha256,accio,origen FROM public.consentiments WHERE user_id=$1', [user.id])).rows;
        assert.deepEqual(consent, [], 'pending email identity is not consent attributed to its owner');
        assert.equal((await counts()).profiles, 1, 'real user registration invokes canonical profile trigger');
        assert.equal((await query('SELECT count(*)::int n FROM private.normes_acceptades')).rows[0].n, 0);
      });
      await t.test('unverified/unknown/wrong passwords yield no cookie; verification is secret and single-use', async () => {
        for (const [email, password] of [['alice@example.test', pass], ['unknown@example.test', pass], ['alice@example.test', pass + 'wrong']]) {
          const result = await auth.handle('login', input({ email, password }));
          assert.equal(result.status, 401); assert.equal(result.headers['Set-Cookie'], undefined);
          assert.deepEqual(result.body, { error: 'credentials_invalid' });
        }
        assert.equal(deliveries.length, 1); assert.match(deliveries[0].token, /^[A-Za-z0-9_-]{43}$/);
        const stored = (await query('SELECT token_hash FROM private.node0_email_challenges')).rows[0].token_hash;
        assert.equal(stored, hashTokenNodeZero(deliveries[0].token)); assert.notEqual(stored, deliveries[0].token);
        assert.equal((await auth.handle('verify-email', input({ token: deliveries[0].token,password:pass,metadata:{accepta_rgpd:true,versio_politica:VERSIO_POLITICA_PRIVACITAT} }))).status, 200);
        assert.equal((await auth.handle('verify-email', input({ token: deliveries[0].token,password:pass,metadata:{accepta_rgpd:true,versio_politica:VERSIO_POLITICA_PRIVACITAT} }))).status, 400);
      });
      await t.test('cookie sessions persist only hashes, no bearer in JSON, and identify actual registered user', async () => {
        const a = await auth.handle('login', input({ email: 'alice@example.test', password: pass }));
        assert.equal(a.status, 200); aliceCookie = cookieOf(a);
        assert.match(a.headers['Set-Cookie'], /; Path=\/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800$/);
        assert.equal(a.body.access_token, undefined); assert.equal(a.body.user.email, 'alice@example.test');
        const b = await auth.handle('login', input({ email: 'alice@example.test', password: pass })); aliceSecondCookie = cookieOf(b);
        assert.notEqual(aliceCookie, aliceSecondCookie);
        assert.equal((await auth.handle('session', input({}, aliceCookie))).body.user.id, a.body.user.id);
        const stored = (await query('SELECT token_hash FROM private.node0_sessions')).rows.map(x => x.token_hash);
        assert.ok(stored.includes(hashSessioNodeZero({ cookie: aliceCookie })));
        assert.ok(!JSON.stringify(stored).includes(aliceCookie.split('=')[1]));
      });
      await t.test('duplicate registration never replaces credential or sends a new verification token', async () => {
        const before = (await query("SELECT digest FROM private.node0_credentials WHERE email='alice@example.test'")).rows[0].digest;
        const result = await auth.handle('register', input({ ...signup('alice@example.test'), password: pass + 'attacker' }));
        assert.equal(result.status, 202); assert.equal(deliveries.length, 1);
        assert.equal((await query("SELECT digest FROM private.node0_credentials WHERE email='alice@example.test'")).rows[0].digest, before);
      });
      await t.test('norms require explicit current version; acceptance belongs only to cookie actor', async () => {
        const initial=await auth.handle('norms-state',input({},aliceCookie));assert.equal(initial.status,200);assert.deepEqual(initial.body,{versio:'2026-10-24',acceptada_al:null});
        assert.equal((await auth.handle('norms', input({ version: '2026-10-24' }, aliceCookie))).status, 422);
        assert.equal((await auth.handle('norms', input({ accept: true, version: '2026-10-23' }, aliceCookie))).status, 422);
        assert.equal((await auth.handle('norms', input({ accept: true, version: '2026-10-24', owner_id: 'arbitrary' }, aliceCookie))).status, 200);
        const accepted = (await query('SELECT n.usuari_id,c.email FROM private.normes_acceptades n JOIN private.node0_credentials c ON c.user_id=n.usuari_id')).rows;
        assert.equal(accepted.length, 1); assert.equal(accepted[0].email, 'alice@example.test');
        const recorded=await auth.handle('norms-state',input({},aliceCookie));assert.equal(recorded.status,200);assert.equal(recorded.body.versio,'2026-10-24');assert.ok(Number.isFinite(Date.parse(recorded.body.acceptada_al)));
      });
      await t.test('norms state always uses the actual server version and cannot infer renewed acceptance',async()=>{
        const original=(await query("SELECT pg_get_functiondef('private.versio_normes_vigent()'::regprocedure) AS source")).rows[0].source;
        try{
          await db.exec("CREATE OR REPLACE FUNCTION private.versio_normes_vigent() RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT '2026-10-25'::text $$;");
          const current=await auth.handle('norms-state',input({version:'2026-10-24'},aliceCookie));
          assert.equal(current.status,200);assert.deepEqual(current.body,{versio:'2026-10-25',acceptada_al:null});
          const old=await auth.handle('norms',input({accept:true,version:'2026-10-24'},aliceCookie));assert.equal(old.status,422);
          assert.equal((await query("SELECT count(*)::int n FROM private.normes_acceptades WHERE versio='2026-10-25'")).rows[0].n,0);
        }finally{await db.exec(original);}
      });
      await t.test('second real fixture account stays independent; logout cannot revoke client-selected owner', async () => {
        assert.equal((await auth.handle('register', input(signup('bob@example.test', 'Robert prova')))).status, 202);
        const token = deliveries.at(-1).token;
        assert.equal((await auth.handle('verify-email', input({ token,password:pass,metadata:{accepta_rgpd:true,versio_politica:VERSIO_POLITICA_PRIVACITAT} }))).status, 200);
        const result = await auth.handle('login', input({ email: 'bob@example.test', password: pass }));
        bobCookie = cookieOf(result); assert.equal(result.status, 200);
        const aliceId=verifiedActors.get(aliceCookie),bobId=result.body.user.id;
        const before=(await query('SELECT salt,digest,version FROM private.node0_credentials WHERE user_id=$1',[bobId])).rows[0];
        for(const[action,body]of [['logout',{}],['password',{currentPassword:pass,password:pass+'foreign'}],['norms',{accept:true,version:'2026-10-24'}],['norms-state',{}]]){
          const attempt=input(body,bobCookie);attempt.headers['x-sdp-expected-actor']=aliceId;
          const denied=await auth.handle(action,attempt);assert.equal(denied.status,409,action);assert.equal(denied.body.error,'session_actor_changed');assert.equal(denied.headers['Set-Cookie'],undefined,'A stale tab must never clear the other actor cookie');
        }
        assert.deepEqual((await query('SELECT salt,digest,version FROM private.node0_credentials WHERE user_id=$1',[bobId])).rows[0],before);
        assert.equal((await query('SELECT count(*)::int n FROM private.normes_acceptades WHERE usuari_id=$1',[bobId])).rows[0].n,0);
        assert.equal((await auth.identifica({cookie:bobCookie})).user.id,bobId);
        const bobHash=hashSessioNodeZero({cookie:bobCookie});
        for(const expression of [
          `private.node0_auth_logout(${sqlText(bobHash)},${sqlText(aliceId)}::uuid)`,
          `private.node0_auth_password(${sqlText(bobHash)},1,${sqlText('11'.repeat(16))},${sqlText('22'.repeat(64))},${sqlText(aliceId)}::uuid)`,
          `private.node0_auth_norms(${sqlText(bobHash)},'2026-10-24',${sqlText(aliceId)}::uuid)`,
          `private.node0_auth_norms_state(${sqlText(bobHash)},${sqlText(aliceId)}::uuid)`
        ])await assert.rejects(connection.query(`SELECT to_jsonb(${expression}) AS result;`),error=>error.sqlState==='N0A01','The SQL gate itself must compare actor inside its transaction');
        await assert.rejects(connection.query(`SELECT to_jsonb(private.node0_auth_logout(${sqlText(bobHash)},NULL::uuid)) AS result;`),error=>error.sqlState==='N0A02');
        assert.deepEqual((await query('SELECT salt,digest,version FROM private.node0_credentials WHERE user_id=$1',[bobId])).rows[0],before);
        assert.equal((await auth.identifica({cookie:bobCookie})).user.id,bobId);
        assert.equal((await auth.handle('logout', input({ owner_id: result.body.user.id }, aliceCookie))).status, 200);
        assert.equal(await auth.identifica({ cookie: aliceCookie }), null);
        assert.equal((await auth.identifica({ cookie: bobCookie })).user.email, 'bob@example.test');
        assert.equal((await auth.identifica({ cookie: aliceSecondCookie })).user.email, 'alice@example.test');
      });
      await t.test('password rotation checks old password and revokes all actor sessions, preserves other account', async () => {
        const wrong = await auth.handle('password', input({ currentPassword: pass + 'wrong', password: pass + 'new' }, aliceSecondCookie));
        assert.equal(wrong.status, 401);
        const result = await auth.handle('password', input({ currentPassword: pass, password: pass + 'new', user_id: 'bob' }, aliceSecondCookie));
        assert.equal(result.status, 200); assert.match(result.headers['Set-Cookie'], /Max-Age=0$/);
        assert.equal(await auth.identifica({ cookie: aliceSecondCookie }), null);
        assert.equal((await auth.identifica({ cookie: bobCookie })).user.email, 'bob@example.test');
        const login = await auth.handle('login', input({ email: 'alice@example.test', password: pass + 'new' }));
        assert.equal(login.status, 200);
        const current = cookieOf(login);
        const c = (await query("SELECT user_id,version FROM private.node0_credentials WHERE email='alice@example.test'")).rows[0];
        assert.equal(c.version, 3, 'email-proof choice and later password rotation both advance credentials');
        const stale = await connection.query(`SELECT to_jsonb(private.node0_auth_create_session(${sqlText(c.user_id)}::uuid,1,${sqlText(hashTokenNodeZero('stale'))})) AS result;`);
        assert.equal(stale, null, 'stale password check cannot issue a session after rotation');
        await query('UPDATE private.node0_sessions SET expires_at=clock_timestamp()-interval \'1 second\' WHERE token_hash=$1', [hashSessioNodeZero({ cookie: current })]);
        assert.equal(await auth.identifica({ cookie: current }), null);
      });
      await t.test('banned account and canonical auth.sessions deletion invalidate existing cookies', async () => {
        await query("UPDATE auth.users SET banned_until=clock_timestamp()+interval '1 hour' WHERE email='bob@example.test'");
        assert.equal(await auth.identifica({ cookie: bobCookie }), null);
        await query("UPDATE auth.users SET banned_until=NULL WHERE email='bob@example.test'");
        assert.ok(await auth.identifica({ cookie: bobCookie }));
        await query("DELETE FROM auth.sessions WHERE user_id=(SELECT id FROM auth.users WHERE email='bob@example.test')");
        assert.equal(await auth.identifica({ cookie: bobCookie }), null);
      });
      await t.test('persistent account rate bucket stops a distributed login attack before KDF', async () => {
        let result;
        for (let i = 0; i < 9; i++) result = await auth.handle('login', input({ email: 'attack@example.test', password: pass }, null, `192.0.2.${i + 1}`));
        assert.equal(result.status, 429);
        assert.ok(!(await query('SELECT key_hash FROM private.node0_auth_rates')).rows.some(row => row.key_hash.includes('attack')));
      });
      await t.test('database diagnostics remain private on auth failures', async () => {
        const unavailable = creaAuthNodeZero({ db: { async query() { throw new Error('secret password and SQL'); } }, rateSecret: secret });
        assert.deepEqual(await unavailable.handle('policy'), { status: 503, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' }, body: { error: 'auth_unavailable' } });
      });
    } finally { await db.close(); }
  });
}
