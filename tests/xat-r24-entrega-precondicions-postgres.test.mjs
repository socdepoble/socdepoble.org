/* R24 · G-sql-1 (Gauntlet R24, onada 3) · 20261114061000 depén de 2611080432
   i de 20261113003000. Sense elles, la migració s'aplicava sense error i
   deixava public.xat_fils_meus trencada per a tothom en temps d'execució
   (42883: private.xat_reconcilia_beta_testers(uuid) no existix), perquè el cos
   PL/pgSQL no es valida en CREATE FUNCTION. Ara ha d'avortar neta, abans de
   tocar res, amb SDP-XAT-947 (55000), com SDP-XAT-941 a 20261114060000.
   Prefix històric anterior a 20261114061000 menys 20261113003000. Cap
   migració posterior entra en este fixture deliberadament incomplet.
   PostgreSQL 18.6 local i descartable; cap servei remot. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const ENTREGA = '20261114061000_r24_xat_rebuts_entrega.sql';
const R219B = '20261113003000_r21_9b_canal_beta_testers_i_sync_aparadors.sql';
const id = n => `24940000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), ALICE = id(11);
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('R24 · 20261114061000 sense 20261113003000 avorta neta (SDP-XAT-947) i la llista continua funcionant', { timeout: 180000 }, async () => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  try {
    const plan = creaPlaMigracions();
    assert.ok(plan.migrations.some(m => m.file === R219B), 'el catàleg conté 20261113003000');
    const posicio = plan.migrations.findIndex(m => m.file === ENTREGA);
    assert.ok(posicio > plan.migrations.findIndex(m => m.file === R219B), 'R24 seguix R21.9b al pla verificat');
    await db.query(plan.bootstrap);
    for (const m of plan.migrations.slice(0, posicio)) {
      if (m.file === R219B) continue;
      await db.query('begin'); await db.query(m.body); await db.query('commit');
    }
    await db.query("insert into public.towns(id,slug,name) values($1,'r24-pre','Poble sintètic')", [TOWN]);
    await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
      [ALICE, `${ALICE}@example.invalid`, { full_name: 'Alícia Sintètica', tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
    const llista = async () => {
      await db.query('begin');
      try {
        await db.query('set local role authenticated');
        await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)", [ALICE, JSON.stringify({ sub: ALICE, role: 'authenticated' })]);
        return (await db.query('select * from public.xat_fils_meus($1)', [TOWN])).rows;
      } finally { await db.query('rollback'); }
    };
    const signatura = async () => (await db.query(
      "select pg_get_function_result(to_regprocedure('public.xat_fils_meus(uuid)')) as r")).rows[0].r;
    assert.ok(Array.isArray(await llista()), 'abans de R24, la llista funciona');
    const abans = await signatura();

    let error = null;
    try { await db.query(read(`supabase/migrations/${ENTREGA}`)); }
    catch (e) { error = e; await db.query('rollback').catch(() => {}); }

    assert.ok(error, 'la migració s’ha aplicat sense les seues dependències (cap precondició)');
    assert.equal(error.code, '55000', `SQLSTATE ${error.code}: ${error.message}`);
    assert.match(error.message, /^SDP-XAT-947: /);
    assert.equal((await db.query("select to_regprocedure('private.xat_cursors_altres(uuid,uuid)') as f")).rows[0].f, null,
      'avorta abans de crear el helper');
    assert.equal(await signatura(), abans, 'xat_fils_meus no ha canviat');
    try { assert.ok(Array.isArray(await llista())); }
    catch (e) { assert.fail(`després de l’intent, xat_fils_meus falla per a tothom: ${e.code} ${e.message}`); }
  } finally { await cluster.close(); }
});
