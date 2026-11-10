import { VERSIO_POLITICA_PRIVACITAT } from '../src/config/politicaPrivacitat.js';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaAuthNodeZero, creaCredencialNodeZero, hashTokenNodeZero, NODE0_AUTH_LIMITS, NODE0_AUTH_TENANT } from '../tooling/node0/auth-node0.mjs';
import { xarxaRateNodeZero } from '../tooling/node0/xarxa-rate-node0.mjs';
import { iniciaMantenimentAuthNodeZero, NODE0_AUTH_MAINTENANCE } from '../tooling/node0/manteniment-auth-node0.mjs';
import { preparaConsultaPrivadaNodeZero } from '../tooling/node0/consulta-privada-node0.mjs';
import { sqlText } from '../tooling/node0/postgres-node0.mjs';
// The same frozen test runs in its isolated candidate tree and after reviewer's
// integration into tests/. Dependencies always come from that repository.
const sourceRoot = fs.existsSync(new URL('../tooling/node0/hidrata-postgres-node0.mjs', import.meta.url)) ? new URL('../', import.meta.url) : new URL('../../../', import.meta.url);
const { preparaHidratacio, generaSql } = await import(new URL('tooling/node0/hidrata-postgres-node0.mjs', sourceRoot));
const {creaPlaMigracionsR15A3:creaPlaMigracions,comprovaLedgerR15A3}=await import(new URL('tests/helpers/plaMigracionsR15A3.js',sourceRoot));

const headers = { origin: 'https://socdepoble.cat', 'content-type': 'application/json' };
const consent = { accepta_rgpd: true, versio_politica: VERSIO_POLITICA_PRIVACITAT };
const pass = 'Synthetic owner password 2026!';
const request = body => ({ headers, body, remoteAddress: '198.51.100.101' });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

test('IPv6 quota aggregates subnets of one /48 and preserves mapped IPv4 identity', () => {
  assert.equal(xarxaRateNodeZero('2001:db8:1234:1::1'), 'v6:2001:db8:1234::/48');
  assert.equal(xarxaRateNodeZero('2001:0db8:1234:ffff::1234'), xarxaRateNodeZero('2001:db8:1234:1::1'));
  assert.notEqual(xarxaRateNodeZero('2001:db8:1235::1'), xarxaRateNodeZero('2001:db8:1234::1'));
  assert.equal(xarxaRateNodeZero('::ffff:198.51.100.101'), xarxaRateNodeZero('198.51.100.101'));
  assert.equal(xarxaRateNodeZero('::1'), 'v6:::/48');
});

test('scrypt dispatch has a global strict cap and releases slots after completion', async () => {
  const outcomes = await Promise.allSettled(Array.from({ length: NODE0_AUTH_LIMITS.activeKdfs + 1 }, () => creaCredencialNodeZero(pass)));
  assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 2);
  assert.equal(outcomes.filter(result => result.status === 'rejected' && result.reason.code === 'auth_busy').length, 1);
  assert.match((await creaCredencialNodeZero(pass)).digest, /^[0-9a-f]{128}$/);
});

test('email proof runs an indexed challenge hint before password derivation and retains private binding', async () => {
  const calls = [], token = randomBytes(32).toString('base64url');
  const db = { async query(sql, options) {
    assert.deepEqual(options, { privateValues: true });
    calls.push(sql);
    const compiled = preparaConsultaPrivadaNodeZero(sql);
    assert.ok(!compiled.sql.includes(token));
    if (sql.includes('node0_auth_rate(')) return true;
    if (sql.includes('node0_auth_challenge_ready(')) return false;
    throw new Error('unexpected functional query');
  } };
  const auth = creaAuthNodeZero({ db, rateSecret: randomBytes(32) });
  for (const action of ['verify-email', 'reset-password']) {
    const result = await auth.handle(action, request({ token, password: 'short', metadata: consent }));
    assert.equal(result.status, 400); assert.equal(result.body.error, 'verification_invalid');
  }
  assert.equal(calls.filter(sql => sql.includes('node0_auth_challenge_ready(')).length, 2);
  assert.ok(!calls.some(sql => sql.includes('node0_auth_verify(') || sql.includes('node0_auth_reset(')));
  auth.close();
});

test('accepted recovery HTTP response is independent of account lookup, SMTP completion and error', async () => {
  const lookup = deferred(), mail = deferred(), deliveryStarted = deferred();
  let accountPresent = true, mailFails = false, deliveries = 0;
  const db = { async query(sql, options) {
    assert.deepEqual(options, { privateValues: true });
    if (sql.includes('node0_auth_rate(')) return true;
    if (sql.includes('node0_auth_reset_challenge(')) { await lookup.promise; return accountPresent; }
    throw new Error('unexpected functional query');
  } };
  const auth = creaAuthNodeZero({ db, rateSecret: randomBytes(32), mailTransport: async () => {
    deliveries++; deliveryStarted.resolve(); await mail.promise; if (mailFails) throw new Error('synthetic smtp failure');
  } });
  const start = performance.now();
  const known = await auth.handle('request-password-reset', request({ email: 'owner@example.invalid' }));
  const duration = performance.now() - start;
  assert.equal(known.status, 202); assert.deepEqual(known.body, { recovery_requested: true });
  assert.equal(deliveries, 0, 'HTTP completes while account lookup remains unresolved');
  assert.ok(duration >= NODE0_AUTH_LIMITS.resetResponseMs - 10 && duration < 1000);
  lookup.resolve(); await deliveryStarted.promise;
  mailFails = true; mail.resolve(); await wait(10);
  accountPresent = false;
  const absentStart = performance.now();
  const absent = await auth.handle('request-password-reset', request({ email: 'absent@example.invalid' }));
  assert.deepEqual(absent, known);
  assert.ok(performance.now() - absentStart >= NODE0_AUTH_LIMITS.resetResponseMs - 10);
  assert.equal(deliveries, 1);
  auth.close();
});

test('recovery backpressure bounds queued work and active workers with the same acknowledgement', async () => {
  const lookup = deferred(); let active = 0, maxActive = 0, lookups = 0;
  const auth = creaAuthNodeZero({ rateSecret: randomBytes(32), mailTransport: async () => {}, db: { async query(sql) {
    if (sql.includes('node0_auth_rate(')) return true;
    if (sql.includes('node0_auth_reset_challenge(')) {
      lookups++; active++; maxActive = Math.max(active, maxActive); await lookup.promise; active--; return false;
    }
    throw new Error('unexpected functional query');
  } } });
  const outcomes = await Promise.all(Array.from({ length: NODE0_AUTH_LIMITS.resetRequests + 1 }, (_, i) =>
    auth.handle('request-password-reset', request({ email: `synthetic-${i}@example.invalid` }))));
  assert.ok(outcomes.every(result => result.status === 202));
  assert.equal(maxActive, NODE0_AUTH_LIMITS.resetWorkers);
  lookup.resolve(); await wait(20);
  assert.equal(lookups, NODE0_AUTH_LIMITS.resetRequests);
  auth.close();
});

test('unsettled mail transports retain a strict process-wide slot until actual completion', async () => {
  const mail = deferred(); let deliveries = 0;
  const auth = creaAuthNodeZero({ rateSecret: randomBytes(32), mailTransport: async () => { deliveries++; await mail.promise; }, db: { async query(sql) {
    if (sql.includes('node0_auth_rate(') || sql.includes('node0_auth_reset_challenge(') || sql.includes('node0_auth_challenge(')) return true;
    throw new Error('unexpected functional query');
  } } });
  try {
    const responses = await Promise.all(['first', 'second'].map(name => auth.handle('request-password-reset', request({ email: `${name}@example.invalid` }))));
    assert.ok(responses.every(result => result.status === 202));
    assert.equal(deliveries, NODE0_AUTH_LIMITS.mailTransports);
    const extra = await auth.handle('resend-verification', request({ email: 'third@example.invalid' }));
    assert.equal(extra.status, 503); assert.equal(deliveries, NODE0_AUTH_LIMITS.mailTransports);
    mail.resolve(); await wait(10);
    assert.equal((await auth.handle('resend-verification', request({ email: 'third@example.invalid' }))).status, 202);
    assert.equal(deliveries, NODE0_AUTH_LIMITS.mailTransports + 1);
  } finally { mail.resolve(); auth.close(); await wait(10); }
});

test('retention worker skips overlapping ticks, bounds batches and stops', async () => {
  const gate = deferred(); let calls = 0;
  const worker = iniciaMantenimentAuthNodeZero({ db: { async query(sql, options) {
    assert.equal(sql, 'SELECT to_jsonb(private.node0_auth_sweep_pending()) AS result;');
    assert.deepEqual(options, { privateValues: true }); calls++; await gate.promise;
    return NODE0_AUTH_MAINTENANCE.batchSize;
  } } });
  await worker.tick(); assert.equal(calls, 1);
  gate.resolve(); await wait(10);
  assert.equal(calls, NODE0_AUTH_MAINTENANCE.maxBatches);
  worker.stop(); await worker.tick(); assert.equal(calls, NODE0_AUTH_MAINTENANCE.maxBatches);
});

const modulePath = process.env.SDP_PGLITE_MODULE;
test('R8 PostgreSQL migration and synthetic owner lifecycle preserve verified semantics', { skip: !modulePath && 'Set SDP_PGLITE_MODULE for disposable PostgreSQL functional proof' }, async t => {
  const moduleURL = pathToFileURL(modulePath);
  const { PGlite } = await import(moduleURL.href), { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
  const first = new PGlite(); await first.exec('CREATE DATABASE socdepoble_node0');
  const image = await first.dumpDataDir('none'); await first.close();
  const pg = new PGlite({ database: 'socdepoble_node0', loadDataDir: image, extensions: { pgcrypto } });
  let queue = Promise.resolve(); const deliveries = [];
  const db = { query(sql, options) {
    assert.deepEqual(options, { privateValues: true });
    const work = queue.then(async () => {
      try {
        const result = await pg.exec('BEGIN; SET LOCAL ROLE node0_authenticator; ' + sql + ' COMMIT;');
        return result.find(value => value.rows?.[0]?.result !== undefined)?.rows[0].result;
      } catch (error) { await pg.exec('ROLLBACK'); throw Object.assign(new Error('synthetic_sql_failed'), { sqlState: error.code }); }
    });
    queue = work.catch(() => {}); return work;
  } };
  const auth = creaAuthNodeZero({ db, rateSecret: randomBytes(32), mailTransport: async message => deliveries.push(message) });
  const q = async (sql, values = []) => (await pg.query(sql, values)).rows;
  const call = (action, body) => auth.handle(action, request(body));
  const token = randomBytes(32).toString('base64url'), email = 'legacy-pending@example.invalid';
  let id, cookie, savedProfile;
  try {
    await pg.exec(generaSql(creaPlaMigracions(), await preparaHidratacio(), { advisoryLock: false }));
    await pg.exec(fs.readFileSync(new URL('tooling/node0/auth-node0.sql', sourceRoot), 'utf8'));
    await q('SELECT private.node0_auth_register($1,$2::jsonb,$3,$4,$5)', [email, JSON.stringify({ ...consent, tenant_id: NODE0_AUTH_TENANT, full_name: 'Earlier pending display', username: 'earlier-pending' }), '11'.repeat(16), '22'.repeat(64), hashTokenNodeZero(token)]);
    id = (await q('SELECT id FROM auth.users WHERE email=$1', [email]))[0].id;
    await q("UPDATE auth.users SET raw_user_meta_data=raw_user_meta_data||'{\"display_name\":\"Earlier pending display\",\"full_name\":\"Earlier pending display\",\"username\":\"earlier-pending\"}'::jsonb WHERE id=$1", [id]);
    await q("UPDATE public.profiles SET full_name='Earlier pending display',username='earlier-pending',is_public=true WHERE id=$1", [id]);
    assert.equal((await q('SELECT full_name,username FROM public.profiles WHERE id=$1', [id]))[0].full_name, 'Earlier pending display');
    const candidate = fs.readFileSync(new URL('../tooling/node0/auth-node0.sql', import.meta.url), 'utf8');
    await pg.exec(candidate); await pg.exec(candidate);
    await t.test('migration is idempotent with exact A3 deferred2.6 source ledger and existing pending records', async () => {
      await comprovaLedgerR15A3(q);
      assert.equal((await q('SELECT count(*)::int n FROM auth.users'))[0].n, 1);
      assert.equal((await q('SELECT count(*)::int n FROM public.consentiments WHERE user_id=$1', [id]))[0].n, 0);
      const access = (await q("SELECT has_function_privilege('node0_authenticator','private.node0_auth_challenge_ready(text,text)','EXECUTE') ready,has_function_privilege('node0_authenticator','private.node0_auth_sweep_pending()','EXECUTE') sweep,has_function_privilege('node0_authenticator','private.node0_auth_purge_pending(text)','EXECUTE') purge"))[0];
      assert.deepEqual(access, { ready: true, sweep: true, purge: false });
      for (const role of ['anon', 'authenticated', 'node0_runtime']) {
        const access = (await q('SELECT has_function_privilege($1,\'private.node0_auth_challenge_ready(text,text)\',\'EXECUTE\') ready,has_function_privilege($1,\'private.node0_auth_sweep_pending()\',\'EXECUTE\') sweep', [role]))[0];
        assert.deepEqual(access, { ready: false, sweep: false });
      }
      for (const role of ['anon', 'authenticated', 'node0_runtime', 'node0_authenticator']) {
        assert.equal((await q("SELECT has_table_privilege($1,'private.node0_pending_bans','SELECT') allowed", [role]))[0].allowed, false);
      }
    });
    await t.test('first email proof discards legacy pending profile and metadata, then authenticates owner chosen password', async () => {
      assert.equal((await q('SELECT private.node0_auth_challenge_ready($1,\'verify\') ready', [hashTokenNodeZero(token)]))[0].ready, true);
      const verified = await call('verify-email', { token, password: pass, metadata: consent });
      assert.equal(verified.status, 200);
      const user = (await q('SELECT raw_user_meta_data,email_confirmed_at FROM auth.users WHERE id=$1', [id]))[0];
      assert.deepEqual(user.raw_user_meta_data, { ...consent, tenant_id: NODE0_AUTH_TENANT }); assert.ok(user.email_confirmed_at);
      const profile = (await q('SELECT full_name,username,username_confirmat_at FROM public.profiles WHERE id=$1', [id]))[0];
      assert.equal(profile.full_name, 'Veí/na'); assert.match(profile.username, /^veina-[0-9a-f]{12}(?:-[0-9]+)?$/); assert.equal(profile.username_confirmat_at, null);
      assert.equal((await q('SELECT is_public FROM public.profiles WHERE id=$1', [id]))[0].is_public, false);
      assert.equal((await q('SELECT private.node0_auth_challenge_ready($1,\'verify\') ready', [hashTokenNodeZero(token)]))[0].ready, false);
      assert.equal((await q('SELECT count(*)::int n FROM public.consentiments WHERE user_id=$1', [id]))[0].n, 1);
      const login = await call('login', { email, password: pass }); assert.equal(login.status, 200);
      cookie = login.headers['Set-Cookie'].split(';')[0];
      assert.equal((await auth.identifica({ cookie })).user.id, id);
      await q("UPDATE public.profiles SET full_name='Owner chosen display',username='owner-chosen-name' WHERE id=$1", [id]);
      await q("UPDATE auth.users SET raw_user_meta_data=raw_user_meta_data||'{\"full_name\":\"Owner chosen display\",\"username\":\"owner-chosen-name\"}'::jsonb WHERE id=$1", [id]);
      savedProfile = (await q('SELECT full_name,username,username_confirmat_at FROM public.profiles WHERE id=$1', [id]))[0];
    });
    await t.test('confirmed recovery keeps owner profile, rotates credential, consumes challenge and revokes sessions', async () => {
      const sent = await call('request-password-reset', { email }); assert.equal(sent.status, 202);
      for (let i = 0; i < 50 && !deliveries.length; i++) await wait(10);
      assert.equal(deliveries.length, 1); assert.equal(deliveries[0].purpose, 'reset-password');
      const reset = await call('reset-password', { token: deliveries[0].token, password: pass + ' reset' }); assert.equal(reset.status, 200);
      assert.deepEqual((await q('SELECT full_name,username,username_confirmat_at FROM public.profiles WHERE id=$1', [id]))[0], savedProfile);
      assert.equal((await q('SELECT raw_user_meta_data FROM auth.users WHERE id=$1', [id]))[0].raw_user_meta_data.username, 'owner-chosen-name');
      assert.equal(await auth.identifica({ cookie }), null);
      assert.equal((await call('login', { email, password: pass + ' reset' })).status, 200);
    });
    await t.test('new pending signup discards caller profile fields and cannot create a session before proof', async () => {
      const result = await call('register', { email: 'new-pending@example.invalid', password: pass, metadata: { ...consent, full_name: 'Pending choice', username: 'pending-choice', town_name: 'Alcoi' } });
      assert.equal(result.status, 202);
      const user = (await q("SELECT id,raw_user_meta_data FROM auth.users WHERE email='new-pending@example.invalid'"))[0];
      assert.deepEqual(user.raw_user_meta_data, { accepta_rgpd: false, versio_politica: VERSIO_POLITICA_PRIVACITAT, tenant_id: NODE0_AUTH_TENANT });
      assert.equal((await call('login', { email: 'new-pending@example.invalid', password: pass })).status, 401);
    });
    await t.test('periodic sweep removes unrelated expired pending older than 48h and preserves verified accounts', async () => {
      const pending = (await q("SELECT id FROM auth.users WHERE email='new-pending@example.invalid'"))[0].id;
      await q("UPDATE private.node0_credentials SET created_at=clock_timestamp()-interval '49 hours',pending_until=clock_timestamp()-interval '25 hours' WHERE user_id=$1", [pending]);
      await q("UPDATE private.node0_credentials SET pending_until=clock_timestamp()-interval '25 hours' WHERE user_id=$1", [id]);
      await q("UPDATE auth.users SET banned_until=clock_timestamp()+interval '2 days' WHERE id=$1", [id]);
      const worker = iniciaMantenimentAuthNodeZero({ db });
      for (let i = 0; i < 50 && (await q('SELECT count(*)::int n FROM auth.users WHERE id=$1', [pending]))[0].n; i++) await wait(10);
      worker.stop(); await queue;
      assert.equal((await q('SELECT count(*)::int n FROM auth.users WHERE id=$1', [pending]))[0].n, 0);
      assert.equal((await q('SELECT count(*)::int n FROM private.node0_credentials WHERE user_id=$1', [pending]))[0].n, 0);
      assert.equal((await q('SELECT count(*)::int n FROM auth.users WHERE id=$1', [id]))[0].n, 1);
      assert.ok((await q('SELECT banned_until FROM auth.users WHERE id=$1', [id]))[0].banned_until);
    });
    await t.test('49h banned pending account is purged while a minimal expiring digest retains its ban', async () => {
      const bannedEmail = 'banned-pending@example.invalid';
      const signup = { email: bannedEmail, password: pass, metadata: consent };
      assert.equal((await call('register', signup)).status, 202);
      const bannedId = (await q('SELECT id FROM auth.users WHERE email=$1', [bannedEmail]))[0].id;
      const before = (await q('SELECT count(*)::int n FROM auth.users WHERE email=$1', [bannedEmail]))[0].n;
      await q("UPDATE private.node0_credentials SET created_at=clock_timestamp()-interval '49 hours',pending_until=clock_timestamp()-interval '25 hours' WHERE user_id=$1", [bannedId]);
      await q("UPDATE auth.users SET banned_until=clock_timestamp()+interval '2 days' WHERE id=$1", [bannedId]);
      assert.equal(before, 1);
      const challenge = deliveries.filter(message => message.to === bannedEmail).at(-1).token;
      assert.equal((await q("SELECT private.node0_auth_challenge_ready($1,'verify') ready", [hashTokenNodeZero(challenge)]))[0].ready, false);
      assert.equal(await db.query('SELECT to_jsonb(private.node0_auth_sweep_pending()) AS result;', { privateValues: true }), 1);
      assert.equal((await q('SELECT count(*)::int n FROM auth.users WHERE id=$1', [bannedId]))[0].n, 0);
      const tombstone = (await q('SELECT * FROM private.node0_pending_bans'))[0];
      assert.deepEqual(Object.keys(tombstone).sort(), ['banned_until', 'email_hash']);
      assert.equal(tombstone.email_hash, hashTokenNodeZero(bannedEmail));
      const sent = deliveries.length;
      assert.equal((await call('register', signup)).status, 202);
      assert.equal(deliveries.length, sent);
      assert.equal((await q('SELECT count(*)::int n FROM auth.users WHERE email=$1', [bannedEmail]))[0].n, 0);
      await q("UPDATE private.node0_pending_bans SET banned_until=clock_timestamp()-interval '1 second' WHERE email_hash=$1", [tombstone.email_hash]);
      assert.equal((await call('register', signup)).status, 202);
      assert.equal(deliveries.length, sent + 1);
      assert.equal((await q('SELECT count(*)::int n FROM auth.users WHERE email=$1', [bannedEmail]))[0].n, 1);
      await db.query('SELECT to_jsonb(private.node0_auth_sweep_pending()) AS result;', { privateValues: true });
      assert.equal((await q('SELECT count(*)::int n FROM private.node0_pending_bans'))[0].n, 0);
    });
    await t.test('private parameter compiler retains UTF-8 bytes for recovery email and token hash', () => {
      const value = 'Synthetic UTF-8 \ufeffÀlex';
      const compiled = preparaConsultaPrivadaNodeZero('SELECT ' + sqlText(value));
      const encoded = /\\bind '([^']+)'/.exec(compiled.script)[1];
      assert.deepEqual(JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')), [value]);
      assert.ok(!compiled.sql.includes(value));
    });
  } finally { auth.close(); await queue; await pg.close(); }
});
