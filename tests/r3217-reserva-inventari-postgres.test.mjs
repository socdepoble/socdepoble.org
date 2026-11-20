import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';
import { creaPeticioReservaCicleInventari, validaRebutReservaCicleInventari } from '../src/data/reposicioInventariEsdeveniments.js';

const sql = readFileSync(new URL('../supabase/snippets/r32_17_reserva_inventari_cicle_idempotent.sql', import.meta.url), 'utf8');
const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const scope = { tenantId: uid(1), magatzemId: 'rebost', articleId: 'cigrons', cicle: '2026-11-20', quantitat: 12 };
const signature = 'public.reserva_reposicio_inventari(uuid,text,text,text,bigint)';
const callSql = 'select public.reserva_reposicio_inventari($1::pg_catalog.uuid,$2::pg_catalog.text,$3::pg_catalog.text,$4::pg_catalog.text,$5::pg_catalog.int8) rebut';
const params = p => [p.tenantId, p.magatzemId, p.articleId, p.cicle, p.quantitat];
const bootstrap = `
 create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema private; revoke create on schema public from public;
 create function auth.uid() returns pg_catalog.uuid language sql stable set search_path='' as $$
 select nullif(pg_catalog.current_setting('request.jwt.claim.sub',true),'')::pg_catalog.uuid $$;
 create table public.towns(id pg_catalog.uuid primary key);
 create table public.town_memberships(town_id pg_catalog.uuid references public.towns(id),user_id pg_catalog.uuid,role pg_catalog.text,primary key(town_id,user_id));
 create function private.is_town_member(p_tenant_id pg_catalog.uuid) returns pg_catalog.bool language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.town_memberships m where m.town_id=p_tenant_id and m.user_id=auth.uid()) $$;
 grant usage on schema public,auth,private to authenticated;grant execute on function auth.uid(),private.is_town_member(uuid) to authenticated;
 insert into public.towns values('${uid(1)}'),('${uid(2)}');
 insert into public.town_memberships values('${uid(1)}','${uid(11)}','admin'),('${uid(2)}','${uid(22)}','admin'),('${uid(1)}','${uid(12)}','member'),('${uid(1)}','${uid(13)}','admin');
`;

async function beginAs(db, actor = uid(11), isolation = 'read committed') {
  await db.query(`begin isolation level ${isolation}`);
  await db.query('set local role authenticated');
  await db.query("select pg_catalog.set_config('request.jwt.claim.sub',$1,true)", [actor]);
}
async function as(db, actor, text, values = []) {
  await beginAs(db, actor);
  try { const r = await db.query(text, values); await db.query('commit'); return r.rows; }
  catch (e) { await db.query('rollback'); throw e; }
}
const call = async (db, p = scope, actor = uid(11)) => (await as(db, actor, callSql, params(p)))[0].rebut;
const snapshot = async db => (await db.query(`select p.oid,p.prosrc,p.proconfig,p.proacl::pg_catalog.text acl,p.proowner from pg_catalog.pg_proc p where p.oid=$1::pg_catalog.regprocedure`, [signature])).rows;

async function suite(t, db, exec, cluster) {
  await exec(bootstrap); await exec(sql);
  await t.test('idempotent installer preserves function identity, body, ACL and reserved rows', async () => {
    const first = await call(db), before = await snapshot(db);
    await exec(sql); await exec(sql);
    assert.deepEqual(await snapshot(db), before);
    const repeated = await call(db);
    assert.equal(first.creada, true); assert.equal(repeated.creada, false);
    assert.equal(first.reserva_id, repeated.reserva_id);
    const parsed = validaRebutReservaCicleInventari(repeated, creaPeticioReservaCicleInventari(scope));
    assert.equal(parsed.potIniciarComanda, false);
    assert.equal((await db.query('select count(*)::int n from public.inventari_reserves_cicle')).rows[0].n, 1);
  });
  await t.test('same composite key cannot mutate quantity or regain permission after time passes', async () => {
    await assert.rejects(call(db, { ...scope, quantitat: 13 }), e => e.code === '22023' && /CONFLICT/.test(e.message));
    const r = await call(db, scope, uid(13)); assert.equal(r.creada, false);
    assert.equal((await db.query('select quantitat::pg_catalog.text q from public.inventari_reserves_cicle')).rows[0].q, '12');
  });
  await t.test('separate tenant/warehouse/article/cycle remain distinct including separator collisions', async () => {
    const inputs = [{ ...scope, tenantId: uid(2) }, { ...scope, magatzemId: 'rebost|article:3' },
      { ...scope, articleId: 'altres' }, { ...scope, cicle: 'segon' },
      { ...scope, magatzemId: 'a|b', articleId: 'c' }, { ...scope, magatzemId: 'a', articleId: 'b|c' }];
    const results = [];
    for (const p of inputs) results.push(await call(db, p, p.tenantId === uid(2) ? uid(22) : uid(11)));
    assert.ok(results.every(r => r.creada)); assert.equal(new Set(results.map(r => r.reserva_id)).size, inputs.length);
  });
  await t.test('RLS filters other tenants; anon, member and foreign admin cannot reserve', async () => {
    const one = await as(db, uid(11), 'select tenant_id from public.inventari_reserves_cicle');
    const two = await as(db, uid(22), 'select tenant_id from public.inventari_reserves_cicle');
    assert.ok(one.length && two.length); assert.ok(one.every(r => r.tenant_id === uid(1))); assert.ok(two.every(r => r.tenant_id === uid(2)));
    assert.equal((await as(db, uid(99), 'select tenant_id from public.inventari_reserves_cicle')).length, 0);
    for (const actor of [uid(12), uid(22), uid(99), '']) await assert.rejects(call(db, { ...scope, cicle: 'unauthorized' }, actor), e => e.code === '42501');
    const acl = (await db.query(`select
      pg_catalog.has_table_privilege('anon','public.inventari_reserves_cicle','SELECT') anon_read,
      pg_catalog.has_table_privilege('authenticated','public.inventari_reserves_cicle','INSERT,UPDATE,DELETE,TRUNCATE') auth_write,
      pg_catalog.has_function_privilege('anon',$1,'EXECUTE') anon_exec,
      pg_catalog.has_function_privilege('service_role',$1,'EXECUTE') service_exec,
      pg_catalog.has_function_privilege('authenticated',$1,'EXECUTE') auth_exec`, [signature])).rows[0];
    assert.deepEqual(acl, { anon_read: false, auth_write: false, anon_exec: false, service_exec: false, auth_exec: true });
    await db.query('begin'); await db.query('set local role anon');
    try { await assert.rejects(db.query(callSql, params(scope)), e => e.code === '42501'); } finally { await db.query('rollback'); }
    for (const text of ["delete from public.inventari_reserves_cicle", "update public.inventari_reserves_cicle set quantitat=9", "insert into public.inventari_reserves_cicle(tenant_id) values(null)"]) {
      await assert.rejects(as(db, uid(11), text), e => e.code === '42501');
    }
    const flags = (await db.query("select relrowsecurity,relforcerowsecurity from pg_catalog.pg_class where oid='public.inventari_reserves_cicle'::pg_catalog.regclass")).rows[0];
    assert.deepEqual(flags, { relrowsecurity: true, relforcerowsecurity: false });
  });
  await t.test('native types, empty search_path and qualified dependencies survive hostile temp names', async () => {
    const config = (await snapshot(db))[0]; assert.ok(config.proconfig.includes('search_path=""'));
    await exec(`create temp table inventari_reserves_cicle(reserva_id pg_catalog.uuid);create temp table town_memberships(town_id pg_catalog.uuid,user_id pg_catalog.uuid,role pg_catalog.text);
      create domain pg_temp.uuid as pg_catalog.uuid check(false);create domain pg_temp.text as pg_catalog.text check(false);create domain pg_temp.int8 as pg_catalog.int8 check(false);`);
    try {
      await exec(sql); // force recompilation while hostile types exist
      const result = await call(db, { ...scope, cicle: 'hostile' }); assert.equal(result.creada, true);
      assert.equal((await db.query('select count(*)::pg_catalog.int4 n from pg_temp.inventari_reserves_cicle')).rows[0].n, 0);
      await assert.rejects(call(db, { ...scope, tenantId: uid(2), cicle: 'hostile-other' }), e => e.code === '42501');
    } finally { await exec('rollback'); await exec('drop domain pg_temp.uuid;drop domain pg_temp.text;drop domain pg_temp.int8;drop table pg_temp.inventari_reserves_cicle;drop table pg_temp.town_memberships'); }
  });
  await t.test('null, controls, non-NFC, blank, overlong and unsafe-unit payloads fail closed', async () => {
    for (const p of [{ ...scope, quantitat: 0 }, { ...scope, quantitat: -1 }, { ...scope, quantitat: '9007199254740992' },
      { ...scope, quantitat: null }, { ...scope, magatzemId: null }, { ...scope, articleId: '' }, { ...scope, cicle: ' ' },
      { ...scope, cicle: 'x'.repeat(161) }, { ...scope, cicle: 'a\nb' }, { ...scope, articleId: 'e\u0301' },
      // Gauntlet v1.2.14 · Variants invisibles d'una mateixa clau: format Unicode i espais als extrems.
      ...['rebost\u200b', 'rebost\u202e', '\u2066rebost', 'rebost\u00ad', 'rebost\ufeff', 'rebost ', ' rebost', 'rebost\u00a0', '\u3000rebost',
        // Gauntlet v1.2.14 R2 · També els Cf astrals (etiquetes, notació musical, jeroglífics), com el client JS (\p{Cf}).
        'rebost\u{E0020}', 'reb\u{E0001}ost', 'rebost\u{1D173}', 'rebost\u{110BD}', '\u{13430}rebost', 'rebost\u{1BCA0}']
        .map((magatzemId) => ({ ...scope, magatzemId }))]) {
      await assert.rejects(call(db, p), e => e.code === '22023');
    }
  });
  await t.test('a stale ids CHECK from an earlier kit is renewed on reinstall (no silent adoption)', async () => {
    // Gauntlet v1.2.14 R2 · Una instal·lació anterior amb un CHECK sense els Cf astrals: la reinstal·lació el renova.
    await exec(`alter table public.inventari_reserves_cicle drop constraint inventari_reserves_cicle_ids_check;
      alter table public.inventari_reserves_cicle add constraint inventari_reserves_cicle_ids_check check (pg_catalog.char_length(magatzem_id) between 1 and 160)`);
    await exec(sql);
    const def = (await db.query("select pg_catalog.pg_get_constraintdef(oid) d from pg_catalog.pg_constraint where conrelid='public.inventari_reserves_cicle'::pg_catalog.regclass and conname='inventari_reserves_cicle_ids_check'")).rows;
    assert.equal(def.length, 1);
    assert.match(def[0].d, /U000E0020/);
    await assert.rejects(db.query("insert into public.inventari_reserves_cicle(tenant_id,magatzem_id,article_id,cicle_id,quantitat,creada_per) values($1,$2,'cigrons','stale-check',1,$3)",
      [scope.tenantId, 'rebost\u{E0021}', uid(11)]), e => e.code === '23514');
  });
  await t.test('reinstall fails closed when existing rows violate the renewed ids CHECK', async () => {
    // Gauntlet v1.2.14 R2b · Un CHECK vell i una fila astral que el nou refusa: la reinstal·lació falla sencera (23514).
    await exec(`alter table public.inventari_reserves_cicle drop constraint inventari_reserves_cicle_ids_check;
      alter table public.inventari_reserves_cicle add constraint inventari_reserves_cicle_ids_check check (pg_catalog.char_length(magatzem_id) between 1 and 160)`);
    await db.query("insert into public.inventari_reserves_cicle(tenant_id,magatzem_id,article_id,cicle_id,quantitat,creada_per) values($1,$2,'cigrons','fila-vella',1,$3)",
      [scope.tenantId, 'rebost\u{E0020}', uid(11)]);
    const before = await snapshot(db);
    try { await assert.rejects(exec(sql), e => e.code === '23514'); } finally { await exec('rollback'); }
    assert.deepEqual(await snapshot(db), before);
    const feble = (await db.query("select pg_catalog.pg_get_constraintdef(oid) d from pg_catalog.pg_constraint where conrelid='public.inventari_reserves_cicle'::pg_catalog.regclass and conname='inventari_reserves_cicle_ids_check'")).rows[0].d;
    assert.doesNotMatch(feble, /U000E0020/);
    await db.query("delete from public.inventari_reserves_cicle where cicle_id='fila-vella'");
    await exec(sql);
  });
  await t.test('a same-name non-CHECK constraint and a forced RLS from an earlier kit are not adopted silently', async () => {
    await exec('alter table public.inventari_reserves_cicle force row level security');
    await exec(sql);
    assert.equal((await db.query("select relforcerowsecurity f from pg_catalog.pg_class where oid='public.inventari_reserves_cicle'::pg_catalog.regclass")).rows[0].f, false);
    const before = await snapshot(db);
    await exec(`alter table public.inventari_reserves_cicle drop constraint inventari_reserves_cicle_ids_check;
      alter table public.inventari_reserves_cicle add constraint inventari_reserves_cicle_ids_check unique (creada_el, reserva_id)`);
    try { await assert.rejects(exec(sql), e => e.code === '55000' && /SCHEMA/.test(e.message)); } finally { await exec('rollback'); }
    await exec('alter table public.inventari_reserves_cicle drop constraint inventari_reserves_cicle_ids_check');
    await exec(sql);
    assert.deepEqual(await snapshot(db), before);
  });
  await t.test('foreign schema preimage fails transactionally without silently adopting it', async () => {
    const before = await snapshot(db);
    await exec('alter table public.inventari_reserves_cicle add column unexpected pg_catalog.text');
    try { await assert.rejects(exec(sql), e => e.code === '55000' && /SCHEMA/.test(e.message)); } finally { await exec('rollback'); }
    assert.deepEqual(await snapshot(db), before);
    await exec('alter table public.inventari_reserves_cicle drop column unexpected');
  });
  await t.test('expanded same-name unique key is rejected before a second reservation can be created', async () => {
    const before = await snapshot(db);
    await exec(`alter table public.inventari_reserves_cicle drop constraint inventari_reserves_cicle_scope_key;
      alter table public.inventari_reserves_cicle add constraint inventari_reserves_cicle_scope_key
      unique(tenant_id,magatzem_id,article_id,cicle_id,reserva_id)`);
    try {
      await assert.rejects(exec(sql), e => e.code === '55000' && /SCHEMA/.test(e.message));
    } finally { await exec('rollback'); }
    assert.deepEqual(await snapshot(db), before);
    await exec(`alter table public.inventari_reserves_cicle drop constraint inventari_reserves_cicle_scope_key;
      alter table public.inventari_reserves_cicle add constraint inventari_reserves_cicle_scope_key
      unique(tenant_id,magatzem_id,article_id,cicle_id)`);
    await exec(sql);
    assert.equal((await call(db)).creada, false);
    assert.equal((await db.query(`select count(*)::pg_catalog.int4 n from public.inventari_reserves_cicle
      where tenant_id=$1 and magatzem_id=$2 and article_id=$3 and cicle_id=$4`, params(scope).slice(0, 4))).rows[0].n, 1);
    const keys = (await db.query(`select c.conname,c.conkey::pg_catalog.text keys,i.indisunique,i.indisvalid,i.indisready,
      i.indnkeyatts,i.indnatts,i.indpred is null unfiltered,i.indexprs is null plain
      from pg_catalog.pg_constraint c join pg_catalog.pg_index i on i.indexrelid=c.conindid
      where c.conrelid='public.inventari_reserves_cicle'::pg_catalog.regclass and c.contype in ('p','u') order by c.contype`)).rows;
    assert.deepEqual(keys, [
      { conname: 'inventari_reserves_cicle_pkey', keys: '{1}', indisunique: true, indisvalid: true, indisready: true, indnkeyatts: 1, indnatts: 1, unfiltered: true, plain: true },
      { conname: 'inventari_reserves_cicle_scope_key', keys: '{2,3,4,5}', indisunique: true, indisvalid: true, indisready: true, indnkeyatts: 4, indnatts: 4, unfiltered: true, plain: true }
    ]);
  });
  await t.test('preexisting definer with alien owner is rejected without changing its identity or permissions', async () => {
    await exec('create role r3217_alien_owner');
    await exec(`alter function ${signature} owner to r3217_alien_owner`);
    const before = await snapshot(db);
    try {
      await assert.rejects(exec(sql), e => e.code === '55000' && /propietari de funcio/.test(e.message));
    } finally { await exec('rollback'); }
    assert.deepEqual(await snapshot(db), before);
    await exec(`alter function ${signature} owner to current_user`);
    await exec('drop role r3217_alien_owner');
    await exec(sql);
    assert.equal((await call(db)).creada, false);
  });
  if (!cluster) return;
  const a = await cluster.connect(), b = await cluster.connect();
  const pa = (await a.query('select pg_catalog.pg_backend_pid() pid')).rows[0].pid;
  const pb = (await b.query('select pg_catalog.pg_backend_pid() pid')).rows[0].pid;
  assert.notEqual(pa, pb); t.diagnostic(JSON.stringify({ independentBackendPids: [pa, pb], network: 'unix socket; TCP disabled' }));
  async function barrier(blocked = pb, holder = pa) {
    const until = Date.now() + 4000;
    while (Date.now() < until) {
      if ((await db.query('select $1=any(pg_catalog.pg_blocking_pids($2)) blocked', [holder, blocked])).rows[0].blocked) return;
      await new Promise(resolve => setImmediate(resolve));
    }
    assert.fail('No s’ha observat espera real entre dos backends.');
  }
  for (const ending of ['commit', 'rollback']) await t.test('native two-session race: holder ' + ending, async () => {
    const p = { ...scope, cicle: 'race-' + ending };
    await beginAs(a); const first = (await a.query(callSql, params(p))).rows[0].rebut; assert.equal(first.creada, true);
    await beginAs(b);
    const pending = b.query(callSql, params(p)).then(r => ({ r }), e => ({ e }));
    try {
      await barrier(); await a.query(ending); const { r, e } = await pending; assert.equal(e, undefined, e?.message);
      assert.equal(r.rows[0].rebut.creada, ending === 'rollback'); await b.query('commit');
      const rows = (await db.query('select * from public.inventari_reserves_cicle where cicle_id=$1', [p.cicle])).rows;
      assert.equal(rows.length, 1); assert.equal(rows[0].reserva_id, ending === 'commit' ? first.reserva_id : r.rows[0].rebut.reserva_id);
      assert.equal((await call(db, p)).creada, false);
    } finally { await a.query('rollback'); await b.query('rollback'); }
  });
  await t.test('native concurrent divergent quantity loses without updating winner', async () => {
    const p = { ...scope, cicle: 'race-conflict' }; await beginAs(a); await a.query(callSql, params(p)); await beginAs(b);
    const pending = b.query(callSql, params({ ...p, quantitat: 99 })).then(r => ({ r }), e => ({ e }));
    try { await barrier(); await a.query('commit'); const { e } = await pending; assert.equal(e?.code, '22023'); await b.query('rollback'); assert.equal((await call(db, p)).quantitat, 12); }
    finally { await a.query('rollback'); await b.query('rollback'); }
  });
  await t.test('native repeatable-read stale snapshot aborts safely with 40001', async () => {
    const p = { ...scope, cicle: 'repeatable' }; await beginAs(a); await a.query(callSql, params(p)); await beginAs(b, uid(11), 'repeatable read');
    await b.query('select count(*) from public.inventari_reserves_cicle');
    const pending = b.query(callSql, params(p)).then(r => ({ r }), e => ({ e }));
    try { await barrier(); await a.query('commit'); const { e } = await pending; assert.equal(e?.code, '40001'); await b.query('rollback'); assert.equal((await call(db, p)).creada, false); }
    finally { await a.query('rollback'); await b.query('rollback'); }
  });
  await t.test('native membership revocation serializes after the authorizing reservation', async () => {
    const p = { ...scope, cicle: 'membership-lock' }; await beginAs(a); await a.query(callSql, params(p)); await b.query('begin');
    const pending = b.query('delete from public.town_memberships where town_id=$1 and user_id=$2', [scope.tenantId, uid(11)]).then(r => ({ r }), e => ({ e }));
    try { await barrier(); await a.query('commit'); const { e } = await pending; assert.equal(e, undefined); await b.query('commit'); await assert.rejects(call(db, { ...scope, cicle: 'after-revoke' }), e => e.code === '42501'); }
    finally { await a.query('rollback'); await b.query('rollback'); await db.query("insert into public.town_memberships values($1,$2,'admin') on conflict do nothing", [scope.tenantId, uid(11)]); }
  });
}

test('R32.17 atomic inventory reservation native PostgreSQL two real sessions', { timeout: 120000 }, async t => {
  /* Gauntlet v1.2.14 · Un directori propi i efímer (mkdtemp), no una ruta compartida i previsible. */
  const dataRoot = mkdtempSync(join(realpathSync(tmpdir()), 'sdp_r32_17_inventari_pg-'));
  /* Gauntlet v1.2.14 R2 · La neteja es registra abans d'arrencar: si PostgreSQL no arrenca, el directori no queda orfe.
     Un sol hook (node:test executa els t.after en l'ordre de registre): primer tanca el clúster, si ha arrencat, i
     després esborra el directori. */
  let cluster = null;
  t.after(async () => {
    try { if (cluster) await cluster.close(); } finally { rmSync(dataRoot, { recursive: true, force: true }); }
  });
  cluster = await startLocalPostgres({ dataRoot });
  t.diagnostic(JSON.stringify({ engine: 'native', serverVersion: (await cluster.db.query('show server_version')).rows[0].server_version }));
  await suite(t, cluster.db, s => cluster.db.query(s), cluster);
});
test('R32.17 atomic inventory reservation PGlite', { timeout: 120000 }, async t => {
  assert.ok(process.env.SDP_PGLITE_MODULE, 'SDP_PGLITE_MODULE local explícit obligatori; no skip silenciós');
  const { PGlite } = await import(pathToFileURL(process.env.SDP_PGLITE_MODULE).href); const db = new PGlite(); t.after(() => db.close());
  t.diagnostic(JSON.stringify({ engine: 'pglite', serverVersion: (await db.query('show server_version')).rows[0].server_version, independentSessions: false }));
  await suite(t, db, s => db.exec(s));
});
