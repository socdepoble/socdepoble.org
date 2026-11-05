/** Real PostgreSQL multi-connection proof. NEVER runs on the production DB.
 * Required: SDP_NODE0_NATIVE_LAB=1 PGDATABASE=node0_gauntlet_r4 PGUSER=javi
 * and an explicit local PGHOST. Schema/migrations must already exist in the lab.
 * Creates synthetic fixture registrations only; it sends no email or network.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { randomBytes, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { creaPostgres, sqlText } from '../tooling/node0/postgres-node0.mjs';
import { creaAuthNodeZero, creaCredencialNodeZero, hashSessioNodeZero, hashTokenNodeZero, NODE0_AUTH_TENANT } from '../tooling/node0/auth-node0.mjs';
import { creaBackendPrivatNodeZero, sqlContextSessioNodeZero, compilaOperacioNodeZero } from '../tooling/node0/backend-node0.mjs';

const enabled = process.env.SDP_NODE0_NATIVE_LAB === '1';
const origin = 'https://socdepoble.cat';
const headers = { origin, 'content-type': 'application/json' };
const cookieOf = response => response.headers['Set-Cookie']?.split(';')[0];
const actors=new Map();
const request = (body = {}, cookie) => ({ headers: { ...headers, ...(cookie ? { cookie,'x-sdp-expected-actor':actors.get(cookie) } : {}) }, body, remoteAddress: '127.0.0.1' });

export function validaLaboratoriNatiu(env) {
  if (env.SDP_NODE0_NATIVE_LAB !== '1' || env.PGDATABASE !== 'node0_gauntlet_r4' || env.PGUSER !== 'javi' ||
    !env.PGHOST || !((env.PGHOST.startsWith('/') && !/[\s,\0]/.test(env.PGHOST)) || ['127.0.0.1', '::1'].includes(env.PGHOST))) throw new Error('node0_native_dedicated_lab_required');
  for (const key of ['PGPASSWORD', 'PGHOSTADDR', 'PGSERVICE', 'PGSERVICEFILE', 'PGOPTIONS']) if (env[key]) throw new Error('node0_native_database_override_rejected');
  if (env.PGPORT && !/^[1-9][0-9]{0,4}$/.test(env.PGPORT)) throw new Error('node0_native_port_invalid');
  if (env.PGPORT && Number(env.PGPORT) > 65535) throw new Error('node0_native_port_invalid');
  return true;
}

/** Persistent psql connection; only JSON sentinels leave stdout. */
class Connection {
  constructor(env) {
    this.events = new EventEmitter(); this.messages = []; this.closed = false; this.buffer = ''; this.bytes = 0;
    this.child = spawn(env.NODE0_PSQL || 'psql', ['-X', '-w', '-qAt', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=sqlstate'],
      { env: { ...env, PGCONNECT_TIMEOUT: '5' }, stdio: ['pipe', 'pipe', 'pipe'], shell: false });
    this.child.stderr.resume(); this.child.stdin.on('error', () => {});
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', chunk => {
      this.bytes += Buffer.byteLength(chunk);
      if (this.bytes > 1024 * 1024) { this.child.kill('SIGTERM'); return; }
      this.buffer += chunk;
      let newline;
      while ((newline = this.buffer.indexOf('\n')) >= 0) {
        const line = this.buffer.slice(0, newline); this.buffer = this.buffer.slice(newline + 1);
        if (!line.trim()) continue;
        try { const value = JSON.parse(line); this.messages.push(value); this.events.emit('message', value); }
        catch { this.child.kill('SIGTERM'); }
      }
    });
    this.child.on('error', () => this.events.emit('failed'));
    this.finished = new Promise(resolve => this.child.once('close', code => {
      this.closed = true; this.code = code; this.events.emit('failed'); resolve(code);
    }));
  }
  send(sql) {
    if (this.closed) throw new Error('node0_native_connection_closed');
    this.child.stdin.write(sql + '\n');
  }
  wait(barrier, timeoutMs = 12000) {
    const existing = this.messages.find(value => value.barrier === barrier);
    if (existing) return Promise.resolve(existing);
    if (this.closed) return Promise.reject(new Error('node0_native_transaction_failed'));
    return new Promise((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); this.events.off('message', onMessage); this.events.off('failed', onFailure); };
      const onMessage = value => { if (value.barrier === barrier) { cleanup(); resolve(value); } };
      const onFailure = () => { cleanup(); reject(new Error('node0_native_transaction_failed')); };
      const timer = setTimeout(() => { cleanup(); reject(new Error('node0_native_barrier_timeout')); }, timeoutMs);
      this.events.on('message', onMessage); this.events.on('failed', onFailure);
    });
  }
  async close() {
    if (this.closed) return;
    this.child.stdin.end('ROLLBACK;\n');
    const timer = setTimeout(() => this.child.kill('SIGTERM'), 1000);
    try { await this.finished; } finally { clearTimeout(timer); }
  }
}

test('native concurrency guard rejects production and ambiguous connections without spawning psql', () => {
  const safe = { SDP_NODE0_NATIVE_LAB: '1', PGDATABASE: 'node0_gauntlet_r4', PGUSER: 'javi', PGHOST: '/tmp', PGPORT: '5432' };
  assert.equal(validaLaboratoriNatiu(safe), true);
  for (const changed of [{ SDP_NODE0_NATIVE_LAB: '0' }, { PGDATABASE: 'socdepoble_node0' }, { PGUSER: 'node0_runtime' }, { PGHOST: '192.168.0.23' }, { PGHOST: '/tmp,remote' }, { PGPASSWORD: 'unused' }, { PGSERVICE: 'other' }, { PGPORT: '65536' }]) assert.throws(() => validaLaboratoriNatiu({ ...safe, ...changed }));
});

test('native PostgreSQL context serializes logout and credential rotation with real private RPC commits',
  { skip: !enabled ? 'Explicit dedicated native lab required; no production connection attempted' : false, timeout: 90000 }, async t => {
    const env = { ...process.env };
    validaLaboratoriNatiu(env);
    const control = creaPostgres({ env });
    const identity = await control.query("SELECT json_build_object('database',current_database(),'operator',session_user,'version',current_setting('server_version_num'),'migrations',(SELECT count(*) FROM node0.schema_migrations));");
    assert.equal(identity.database, 'node0_gauntlet_r4'); assert.equal(identity.operator, 'javi');
    assert.ok(Number(identity.version) >= 170000 && Number(identity.version) < 180000); assert.equal(identity.migrations, 75);
    const authConnection = { query: sql => control.query(`BEGIN; SET LOCAL ROLE node0_authenticator; ${sql} COMMIT;`) };
    const privateConnection = { query: sql => control.query(`SET ROLE node0_authenticator; ${sql}`) };
    const deliveries = [];
    const auth = creaAuthNodeZero({ db: authConnection, rateSecret: randomBytes(32), mailTransport: async message => { deliveries.push(message); } });
    const backend = creaBackendPrivatNodeZero({ db: privateConnection, tenantId: NODE0_AUTH_TENANT });
    const fixture = randomUUID().replaceAll('-', '');
    const password = `Fixture-only-${fixture}-A!`;
    const nextPassword = `Fixture-only-${fixture}-B!`;
    const accounts = [], notes = [],organizations=[];
    const policy = await auth.handle('policy'); assert.equal(policy.status, 200);
    async function register(label) {
      const email = `gauntlet-${fixture}-${label}@example.invalid`;
      const result = await auth.handle('register', request({ email, password, metadata: {
        full_name: `Fixture Gauntlet ${label}`, accepta_rgpd: true, versio_politica: policy.body.privacy.version, tenant_id: NODE0_AUTH_TENANT
      } }));
      assert.equal(result.status, 202); assert.equal(result.headers['Set-Cookie'], undefined);
      const mail = deliveries.find(message => message.to === email); assert.ok(mail);
      assert.equal((await auth.handle('verify-email', request({ token: mail.token, password, metadata:{accepta_rgpd:true,versio_politica:policy.body.privacy.version} }))).status, 200);
      const login = await auth.handle('login', request({ email, password })); assert.equal(login.status, 200);
      const account = { email, id: login.body.user.id, cookie: cookieOf(login) };actors.set(account.cookie,account.id); accounts.push(account); return account;
    }
    async function waitBlocked(pid, blocker) {
      const deadline = Date.now() + 8000;
      while (Date.now() < deadline) {
        const state = await control.query(`SELECT json_build_object('waiting',wait_event_type='Lock','blockers',pg_blocking_pids(pid)) FROM pg_stat_activity WHERE pid=${Number(pid)};`);
        if (state?.waiting && state.blockers.includes(blocker)) return state;
        // Poll evidence of an actual PostgreSQL lock; never assume a lock from a
        // fixed delay. The total wait is bounded and all connections are owned.
        await delay(20);
      }
      throw new Error('node0_native_expected_lock_not_observed');
    }
    async function blockedMutation(account, mutationSql) {
      const a = new Connection(env), b = new Connection(env);
      const noteId = randomUUID(); notes.push(noteId);
      try {
        a.send(`SET statement_timeout='20s'; SET ROLE node0_authenticator; ${sqlContextSessioNodeZero(hashSessioNodeZero({ cookie: account.cookie }),account.id)}
          SELECT json_build_object('barrier','context-held','pid',pg_backend_pid(),'uid',auth.uid());`);
        const held = await a.wait('context-held'); assert.equal(held.uid, account.id);
        b.send(`SET statement_timeout='20s'; BEGIN; SET LOCAL ROLE node0_authenticator;
          SELECT json_build_object('barrier','writer-started','pid',pg_backend_pid());
          SELECT json_build_object('barrier','writer-done','result',${mutationSql});
          COMMIT; SELECT json_build_object('barrier','writer-committed');`);
        const writer = await b.wait('writer-started');
        const blocked = await waitBlocked(writer.pid, held.pid);
        assert.equal(blocked.waiting, true); assert.ok(!b.messages.some(message => message.barrier === 'writer-done'));
        // The already-authorized transaction can complete its real RLS write.
        a.send(`${compilaOperacioNodeZero('createNote', { input: { id: noteId, title: 'Fixture lock proof', content: 'Synthetic lab transaction only' } }, NODE0_AUTH_TENANT)}
          COMMIT; SELECT json_build_object('barrier','rpc-committed');`);
        await a.wait('rpc-committed');
        const completed = await b.wait('writer-done'); await b.wait('writer-committed');
        const note = await control.query(`SELECT json_build_object('id',id,'owner',owner_user_id) FROM public.notes WHERE id=${sqlText(noteId)}::uuid;`);
        assert.equal(note.id, noteId); assert.equal(note.owner, account.id);
        return completed.result;
      } finally { await Promise.all([a.close(), b.close()]); }
    }
    try {
      const alice = await register('a'), bob = await register('b');
      await t.test('context waits on credentials before acquiring any session row lock', async () => {
        const credentialOwner = new Connection(env), context = new Connection(env);
        const hash = hashSessioNodeZero({ cookie: alice.cookie });
        try {
          credentialOwner.send(`SET statement_timeout='20s'; BEGIN;
            SELECT json_build_object('barrier','credential-held','pid',pg_backend_pid()) FROM private.node0_credentials
              WHERE user_id=${sqlText(alice.id)}::uuid FOR UPDATE;`);
          const held = await credentialOwner.wait('credential-held');
          context.send(`SET statement_timeout='20s'; BEGIN; SET LOCAL ROLE node0_authenticator;
            SELECT json_build_object('barrier','context-started','pid',pg_backend_pid());
            SELECT json_build_object('barrier','context-finished','value',private.node0_auth_context(${sqlText(hash)}));
            COMMIT; SELECT json_build_object('barrier','context-committed');`);
          const started = await context.wait('context-started');
          await waitBlocked(started.pid, held.pid);
          // If the context has already taken S before waiting on C, this exact
          // NOWAIT probe fails 55P03. No scheduler timing assumption is needed:
          // pg_blocking_pids above proves the context is standing at C already.
          const probe = await control.query(`BEGIN;
            SELECT json_build_object('sessionLockAvailable',true) FROM private.node0_sessions
              WHERE token_hash=${sqlText(hash)} FOR UPDATE NOWAIT;
            ROLLBACK;`);
          assert.equal(probe.sessionLockAvailable, true);
          credentialOwner.send("ROLLBACK; SELECT json_build_object('barrier','credential-released');");
          await credentialOwner.wait('credential-released');
          const finished = await context.wait('context-finished'); await context.wait('context-committed');
          assert.equal(finished.value.user.id, alice.id);
        } finally { await Promise.all([credentialOwner.close(), context.close()]); }
      });
      await t.test('organisation gateway serializes the same slug before inspecting an existing town',async()=>{
        const slug=`org-${fixture}`,first={kind:'company',name:'Native concurrent company',slug,town_name:'La Torre de les Maçanes'};
        const second={...first,town_name:'Relleu'},appName=`node0-org-${fixture.slice(0,24)}`;
        const named=creaPostgres({env:{...env,PGAPPNAME:appName}});
        const bBackend=creaBackendPrivatNodeZero({db:{query:sql=>named.query('SET ROLE node0_authenticator;\n'+sql)},tenantId:NODE0_AUTH_TENANT});
        const a=new Connection(env);let pending;
        try{
          a.send(`SET statement_timeout='20s'; SET ROLE node0_authenticator; ${sqlContextSessioNodeZero(hashSessioNodeZero({cookie:alice.cookie}),alice.id)}
            SELECT pg_advisory_xact_lock(hashtextextended(${sqlText(`node0-org:${NODE0_AUTH_TENANT}:${slug}`)},0));
            SELECT jsonb_build_object('barrier','org-lock-held','pid',pg_backend_pid());`);
          const held=await a.wait('org-lock-held');pending=bBackend.handle('createOrganization',request({organization:second},alice.cookie));
          let observed=false;const deadline=Date.now()+8000;
          while(Date.now()<deadline){
            const blocked=await control.query(`SELECT jsonb_build_object('blocked',EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name=${sqlText(appName)} AND wait_event_type='Lock' AND ${Number(held.pid)}=ANY(pg_blocking_pids(pid))));`);
            if(blocked.blocked){observed=true;break;}await delay(20);
          }
          assert.equal(observed,true,'the second request must wait on the gateway slug lock before its previous-town SELECT');
          a.send(`${compilaOperacioNodeZero('createOrganization',{organization:first},NODE0_AUTH_TENANT)}
            SELECT jsonb_build_object('barrier','org-created','id',current_setting('node0.result')::jsonb->>'id'); COMMIT;
            SELECT jsonb_build_object('barrier','org-committed');`);
          const created=await a.wait('org-created');organizations.push(created.id);await a.wait('org-committed');
          const denied=await pending;assert.equal(denied.status,409);
          const stored=await control.query(`SELECT jsonb_build_object('town',town_name,'n',(SELECT count(*) FROM public.organizations WHERE tenant_id=${sqlText(NODE0_AUTH_TENANT)}::uuid AND slug=${sqlText(slug)})) FROM public.organizations WHERE id=${sqlText(created.id)}::uuid;`);
          assert.equal(stored.town,first.town_name);assert.equal(stored.n,1);
        }finally{
          await a.close();if(pending){const result=await pending;if(result.status===201&&result.body?.id)organizations.push(result.body.id);}
        }
      });
      await t.test('logout waits for authenticated transaction commit, then new private transaction is 401', async () => {
        const hash = hashSessioNodeZero({ cookie: alice.cookie });
        assert.equal(await blockedMutation(alice, `private.node0_auth_logout(${sqlText(hash)},${sqlText(alice.id)}::uuid)`), true);
        assert.equal(await auth.identifica({ cookie: alice.cookie }), null);
        assert.equal((await backend.handle('loadNotes', request({}, alice.cookie))).status, 401);
        assert.equal((await backend.handle('loadNotes', request({}, bob.cookie))).status, 200);
      });
      await t.test('password rotation waits for RPC commit and invalidates every old actor session only', async () => {
        const login = await auth.handle('login', request({ email: alice.email, password })); assert.equal(login.status, 200); alice.cookie = cookieOf(login);actors.set(alice.cookie,alice.id);
        const second = await auth.handle('login', request({ email: alice.email, password })); assert.equal(second.status, 200);
        const secondCookie = cookieOf(second);actors.set(secondCookie,alice.id);
        const credential = await authConnection.query(`SELECT coalesce(to_jsonb(private.node0_auth_credential(${sqlText(alice.email)})),'null'::jsonb);`);
        const replacement = await creaCredencialNodeZero(nextPassword);
        const hash = hashSessioNodeZero({ cookie: alice.cookie });
        const mutation = `private.node0_auth_password(${sqlText(hash)},${Number(credential.version)},${sqlText(replacement.salt)},${sqlText(replacement.digest)},${sqlText(alice.id)}::uuid)`;
        assert.equal(await blockedMutation(alice, mutation), true);
        for (const cookie of [alice.cookie, secondCookie]) {
          assert.equal(await auth.identifica({ cookie }), null);
          assert.equal((await backend.handle('loadNotes', request({}, cookie))).status, 401);
        }
        assert.equal((await backend.handle('loadNotes', request({}, bob.cookie))).status, 200);
        assert.equal((await auth.handle('login', request({ email: alice.email, password }))).status, 401);
        const fresh = await auth.handle('login', request({ email: alice.email, password: nextPassword })); assert.equal(fresh.status, 200);
        actors.set(cookieOf(fresh),alice.id);
        const newHash = hashSessioNodeZero({ cookie: cookieOf(fresh) });
        const staleSession = await authConnection.query(`SELECT coalesce(to_jsonb(private.node0_auth_create_session(${sqlText(alice.id)}::uuid,${Number(credential.version)},${sqlText(hashTokenNodeZero(randomBytes(32).toString('base64url')))})),'null'::jsonb);`);
        assert.equal(staleSession, null, 'pre-rotation password derivation cannot create a session afterwards');
        const stalePassword = await authConnection.query(`SELECT to_jsonb(private.node0_auth_password(${sqlText(newHash)},${Number(credential.version)},${sqlText(replacement.salt)},${sqlText(replacement.digest)},${sqlText(alice.id)}::uuid));`);
        assert.equal(stalePassword, false, 'stale version cannot overwrite credentials via a fresh cookie');
        assert.equal((await backend.handle('loadNotes', request({}, cookieOf(fresh)))).status, 200);
      });
    } finally {
      // Only IDs created by this test are removed; the canonical consent audit
      // may retain pseudonymous fixture records according to its real triggers.
      for (const id of notes) await control.query(`WITH d AS (DELETE FROM public.notes WHERE id=${sqlText(id)}::uuid) SELECT json_build_object('cleaned',true);`);
      for (const id of new Set(organizations)) await control.query(`WITH d AS (DELETE FROM public.organizations WHERE id=${sqlText(id)}::uuid) SELECT json_build_object('cleaned',true);`);
      for (const account of accounts) await control.query(`WITH d AS (DELETE FROM auth.users WHERE id=${sqlText(account.id)}::uuid AND email=${sqlText(account.email)}) SELECT json_build_object('cleaned',true);`);
    }
  });
