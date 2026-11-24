import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cosMigracio, creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { projecta132PerFixture } from './fixtures/r3278-cataleg-parcial.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const MIG = '20261117140000_r32_5_lssi_revisio_cautelar.sql';
const id = n => `32500000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), A = id(11), B = id(12), ADMIN = id(13), PUBLIC = id(21), PRIVATE = id(22);
const sql = readFileSync(new URL('../supabase/migrations/' + MIG, import.meta.url), 'utf8');
const error = code => e => e.code === code;

test('R32.5 LSSI · PostgreSQL real, catàleg complet, RLS, quota i retirada cautelar', { timeout: 180000 }, async t => {
  const cluster = await startLocalPostgres({ dataRoot: join(tmpdir(), 'sdp-lssi-native') }), db = cluster.db;
  t.after(() => cluster.close());
  const plan = creaPlaMigracions();
  await db.query(plan.bootstrap);
  for (const m of plan.migrations) {
    if (m.file === MIG) continue;
    let body = m.body;
    if (m.file === '20261123180000_r3252_indexs_suport_fk_verificats.sql') {
      const partial = await projecta132PerFixture(db, { absentRelations: ['private.lssi_revisions'] });
      assert.deepEqual(partial.report.omittedRelations, ['private.lssi_revisions']);
      assert.equal(partial.report.deploymentOrLedger, false);
      t.diagnostic(JSON.stringify(partial.report));
      body = cosMigracio(partial.sql);
    }
    try { await db.query('begin'); await db.query(body); await db.query('commit'); }
    catch (e) { throw new Error(`${m.file}: ${e.message}`, { cause: e }); }
  }
  assert.equal((await db.query("select to_regprocedure('public.admin_safata_denuncies_lssi(text,integer)') f")).rows[0].f, null);
  await db.query(sql);
  await db.query("insert into public.towns(id,slug,name) values($1,'r325-lssi','Poble sintètic LSSI')", [TOWN]);
  for (const uid of [A, B, ADMIN]) await db.query(
    'insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
    [uid, `${uid}@example.invalid`, { full_name: 'Persona sintètica', tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
  await db.query("insert into public.user_platform_roles(user_id,role) values($1,'superadmin') on conflict do nothing", [ADMIN]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [A]);
  await db.query('select public.accepta_normes_convivencia(private.versio_normes_vigent())');
  for (const [uid, visibility] of [[PUBLIC, 'public'], [PRIVATE, 'private']]) await db.query(
    `insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,description,payload,visibility)
     values($1,$2,$3,'mur','Prova','Resum',$4,$5)`,
    [uid, TOWN, A, { content: '<p>Contingut sintètic</p>', status: 'published', visibility }, visibility]);
  await db.query("select set_config('request.jwt.claim.sub','',false)");
  const actor = async (who, text, args = [], aal = 'aal2', client = db) => {
    await client.query('begin');
    try {
      await client.query(`set local role ${who ? 'authenticated' : 'anon'}`);
      await client.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [who ?? '', JSON.stringify({ sub: who, role: who ? 'authenticated' : 'anon', aal })]);
      const result = await client.query(text, args);
      await client.query('commit'); return result.rows;
    } catch (e) { await client.query('rollback'); throw e; }
  };
  const report = (who, content = PUBLIC, client = db) => actor(who,
    "select public.denuncia_publicacio_mur($1,'altre','Revisió humana') r", [content], 'aal2', client);
  const inbox = (who, aal = 'aal2') => actor(who, "select public.admin_safata_denuncies_lssi('pendent',50) r", [], aal);
  let denuncia;

  await t.test('no oracle privat; quota i deduplicació existents, cap retirada automàtica', async () => {
    await assert.rejects(report(A, PRIVATE), error('22023'));
    assert.deepEqual((await report(A))[0].r, { rebuda: true, repetida: false });
    assert.deepEqual((await report(A))[0].r, { rebuda: true, repetida: true });
    await report(B); await report(null);
    assert.equal((await db.query('select moderation_state from public.section_submissions where id=$1', [PUBLIC])).rows[0].moderation_state, 'visible');
    denuncia = (await db.query('select id from public.denuncies where denunciant=$1', [A])).rows[0].id;
  });
  await t.test('anon, veïna i superadmin aal1 no lligen safata ni decidixen; dades privades revocades', async () => {
    for (const who of [null, A, B]) {
      await assert.rejects(inbox(who), error('42501'));
      await assert.rejects(actor(who, "select public.admin_revisa_denuncia_lssi($1,'retirada','Prova','pendent')", [denuncia]), error('42501'));
      await assert.rejects(actor(who, 'select * from private.lssi_revisions'), error('42501'));
    }
    await assert.rejects(inbox(ADMIN, 'aal1'), error('42501'));
    assert.equal((await actor(A, 'select id from public.denuncies')).length, 1);
    await assert.rejects(actor(A, "update public.denuncies set estat='retirada'"), error('42501'));
    const pending = (await inbox(ADMIN))[0].r;
    assert.equal(pending.length, 3);
    assert.ok(pending.every(r => !('denunciant' in r) && !('ip_hash' in r)));
    await assert.rejects(actor(ADMIN, "select public.admin_safata_denuncies_lssi('pendent',101)"), error('22023'));
    await db.query('update public.profiles set baixa_demanada_at=now() where id=$1', [ADMIN]);
    await assert.rejects(inbox(ADMIN), error('42501'));
    await db.query('update public.profiles set baixa_demanada_at=null where id=$1', [ADMIN]);
  });
  await t.test('20/hora també amb connexions concurrents, duplicats sense quota nova', async () => {
    for (let n = 0; n < 18; n++) await actor(B,
      "select public.denuncia_contingut('publicacio',$1,'altre')", [`quota-${n}`]);
    const c1 = await cluster.connect(), c2 = await cluster.connect();
    const calls = await Promise.allSettled([c1, c2].map((c, n) => actor(B,
      "select public.denuncia_contingut('publicacio',$1,'altre')", [`quota-final-${n}`], 'aal2', c)));
    assert.equal(calls.filter(x => x.status === 'fulfilled').length, 1);
    assert.equal(calls.find(x => x.status === 'rejected').reason.code, '42900');
    assert.deepEqual((await report(B))[0].r, { rebuda: true, repetida: true });
  });
  await t.test('replay idempotent, search_path buit i RLS real de l’auditoria', async () => {
    // Reproduïx la primera versió de la FK: el replay també ha de reparar-la.
    await db.query(`alter table private.lssi_revisions alter column revisor set not null;
      alter table private.lssi_revisions drop constraint lssi_revisions_revisor_fkey;
      alter table private.lssi_revisions add constraint lssi_revisions_revisor_fkey
        foreign key (revisor) references auth.users(id)`);
    await db.query(sql);
    const fk = (await db.query("select confdeltype from pg_constraint where conrelid='private.lssi_revisions'::regclass and conname='lssi_revisions_revisor_fkey'")).rows;
    assert.deepEqual(fk, [{ confdeltype: 'n' }]);
    assert.equal((await db.query("select attnotnull from pg_attribute where attrelid='private.lssi_revisions'::regclass and attname='revisor'")).rows[0].attnotnull, false);
    assert.equal((await inbox(ADMIN))[0].r.length, 3);
    const functions = (await db.query("select proconfig from pg_proc where proname in ('admin_safata_denuncies_lssi','admin_revisa_denuncia_lssi')")).rows;
    assert.equal(functions.length, 2);
    assert.ok(functions.every(f => f.proconfig.includes('search_path=""')));
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='private.lssi_revisions'::regclass")).rows[0].relrowsecurity, true);
  });
  await t.test('moderació espera advisory sense bloquejar abans la fila de publica/revoca', async () => {
    const review = await cluster.connect(), publisher = await cluster.connect();
    let pending;
    try {
      await publisher.query('begin');
      await publisher.query("select pg_advisory_xact_lock(hashtextextended('sdp:mur:'||$1,0))", [PUBLIC]);
      await review.query('begin');
      await review.query('set local role authenticated');
      await review.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [ADMIN, JSON.stringify({ sub: ADMIN, aal: 'aal2' })]);
      const pid = (await review.query('select pg_backend_pid() pid')).rows[0].pid;
      pending = review.query("select public.admin_revisa_denuncia_lssi($1,'revisada','Prova de panys','pendent')", [denuncia]);
      let blocked = false;
      const until = Date.now() + 3000;
      while (Date.now() < until) {
        blocked = (await db.query("select wait_event='advisory' blocked from pg_stat_activity where pid=$1", [pid])).rows[0]?.blocked;
        if (blocked) break;
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      assert.equal(blocked, true, 'LSSI espera el pany de la publicació');
      await publisher.query('select id from public.section_submissions where id=$1 for update nowait', [PUBLIC]);
      await publisher.query('rollback');
      await pending;
    } finally {
      await publisher.query('rollback');
      if (pending) await pending.catch(() => {});
      await review.query('rollback');
    }
    assert.equal((await db.query('select estat from public.denuncies where id=$1', [denuncia])).rows[0].estat, 'pendent');
  });
  await t.test('decisió humana atòmica: amaga projecció pública, conserva original i registra motiu', async () => {
    const before = (await db.query('select payload,created_at from public.section_submissions where id=$1', [PUBLIC])).rows[0];
    // v1.2.22 · R32.42 (20261122160300) afig la RPC7. v1.2.23 · L4-10 (ordre del Mestre 261123) · La RPC7 es diu
    // llig_mur_public_v7 i ja no és cap sobrecàrrega de la RPC6. La RPC6 es crida amb nom, com fa PostgREST, i la retirada
    // cautelar també ha d'amagar la fila a la RPC7, la que el client demana primer amb VITE_SDP_MUR_VISIBILITAT=1.
    const visible = () => actor(null, 'select * from public.llig_mur_public(p_tenant_id=>$1)', [TOWN]);
    const visible7 = async () => (await actor(null,
      'select public.llig_mur_public_v7(p_inclou_visibilitat=>true,p_tenant_id=>$1) as item', [TOWN])).map(r => r.item);
    assert.ok((await visible()).some(r => r.id === PUBLIC));
    assert.ok((await visible7()).some(r => r.id === PUBLIC && r.mostrar_al_mur === true));
    await assert.rejects(actor(ADMIN, "select public.admin_revisa_denuncia_lssi($1,'retirada','  ','pendent')", [denuncia]), error('22023'));
    const review = () => actor(ADMIN, "select public.admin_revisa_denuncia_lssi($1,'retirada','Cautela documentada','pendent') r", [denuncia]);
    assert.equal((await review())[0].r.repetida, false);
    assert.equal((await review())[0].r.repetida, true);
    assert.equal((await visible()).some(r => r.id === PUBLIC), false);
    assert.equal((await visible7()).some(r => r.id === PUBLIC), false);
    assert.deepEqual((await db.query('select payload,created_at from public.section_submissions where id=$1', [PUBLIC])).rows[0], before);
    assert.equal((await db.query('select justificacio from private.lssi_revisions where denuncia_id=$1', [denuncia])).rows[0].justificacio, 'Cautela documentada');
    await assert.rejects(actor(ADMIN, "select public.admin_revisa_denuncia_lssi($1,'desestimada','Altra decisió','pendent')", [denuncia]), error('40001'));
    await db.query(sql);
    assert.equal((await db.query('select count(*)::int n from private.lssi_revisions')).rows[0].n, 1);
    await assert.rejects(report(A), error('22023'));
  });
  await t.test('purga RGPD del revisor conserva decisió i justificació amb autoria nul·la', async () => {
    const fields = 'denuncia_id,decisio,justificacio,estat_contingut_anterior,revisada_al';
    const before = (await db.query(`select ${fields},revisor from private.lssi_revisions where denuncia_id=$1`, [denuncia])).rows[0];
    assert.equal(before.revisor, ADMIN);
    await db.query("insert into private.baixes(user_id,purga_prevista_al) values($1,now()-interval '1 day')", [ADMIN]);
    assert.equal((await db.query('select private.purga_una_baixa($1) purgada', [ADMIN])).rows[0].purgada, true);
    assert.equal((await db.query('select count(*)::int n from auth.users where id=$1', [ADMIN])).rows[0].n, 0);
    const after = (await db.query(`select ${fields},revisor from private.lssi_revisions where denuncia_id=$1`, [denuncia])).rows[0];
    assert.deepEqual(after, { ...before, revisor: null });
    assert.equal(after.decisio, 'retirada');
    assert.equal(after.justificacio, 'Cautela documentada');
    assert.equal((await db.query('select estat from public.denuncies where id=$1', [denuncia])).rows[0].estat, 'retirada');
    assert.equal((await db.query('select moderation_state from public.section_submissions where id=$1', [PUBLIC])).rows[0].moderation_state, 'retirada_cautelar');
    await db.query(sql);
    assert.deepEqual((await db.query(`select ${fields},revisor from private.lssi_revisions where denuncia_id=$1`, [denuncia])).rows[0], after);
    await assert.rejects(inbox(ADMIN), error('42501'));
  });
});
