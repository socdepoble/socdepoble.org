/* R24 · G-sql-2 (Gauntlet R24, onada 3) · «Com tornar enrere» de
   20261114060000 i reaplicació. La marxa enrere es llig de la capçalera de la
   migració (cada sentència en una línia «--   …;») i el crea_fil_directe vell,
   de les línies de 2611121630 que la capçalera cita. Abans, la marxa enrere
   retirava el disparador i l'índex però deixava les claus parella_*: sense el
   disparador, una baixa de compte deixava l'UUID suprimit a xat_fils (contra
   la promesa del pas 6) i la reaplicació avortava amb SDP-XAT-946.
   Tres casos:
     1 · la marxa enrere documentada no deixa cap UUID d'un compte suprimit;
     2 · la reaplicació després de la marxa enrere documentada funciona;
     3 · la reaplicació també funciona després d'una marxa enrere parcial
         (sense retirar les claus): la migració retira les claus que ja no
         descriuen una parella viva i conserva les vives.
   PostgreSQL 18.6 local i descartable; cap servei remot. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const MIGRATION = '20261114060000_r24_xat_directe_canonic_i_reconciliacio.sql';
const id = n => `24980000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), ALICE = id(11), BOB = id(12), CAROL = id(13), DANI = id(14);
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/* La marxa enrere tal com la documenta la capçalera. */
function marxaEnrere(sql) {
  const linies = sql.split('\n');
  const inici = linies.findIndex(l => /^-- Com tornar enrere:/.test(l));
  const fi = linies.findIndex((l, i) => i > inici && /^-- Abans \(lectura\):/.test(l));
  assert.ok(inici > 0 && fi > inici, 'la capçalera documenta «Com tornar enrere»');
  const bloc = linies.slice(inici, fi);
  const sentencies = bloc.map(l => l.match(/^--\s+((?:drop|update|alter)\b.*;)\s*$/i)?.[1]).filter(Boolean);
  const cita = bloc.join('\n').match(/crea_fil_directe de 2611121630 \(línies (\d+)-(\d+)\)/);
  assert.ok(cita, 'la capçalera cita les línies del crea_fil_directe vell');
  const vell = read('supabase/migrations/2611121630_xat_propi.sql').split('\n').slice(Number(cita[1]) - 1, Number(cita[2])).join('\n');
  assert.match(vell, /^create or replace function public\.crea_fil_directe/);
  assert.match(vell, /\$\$;\s*$/);
  return { sentencies, vell };
}

async function actor(db, who, sql, params = []) {
  await db.query('begin');
  try {
    await db.query('set local role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)",
      [who, JSON.stringify({ sub: who, role: 'authenticated', aal: 'aal1' })]);
    const r = await db.query(sql, params); await db.query('commit'); return r;
  } catch (e) { await db.query('rollback'); throw e; }
}
const crea = (db, who, altre) => actor(db, who, 'select public.crea_fil_directe($1,$2,null) as id', [TOWN, altre]).then(r => r.rows[0].id);
const claus = async (db, who) => (await db.query('select count(*)::int n from public.xat_fils where $1 in (parella_menor, parella_major)', [who])).rows[0].n;
const clau = async (db, fil) => (await db.query('select parella_menor, parella_major from public.xat_fils where id=$1', [fil])).rows[0];

test('R24 · marxa enrere documentada de 20261114060000 i reaplicació', { timeout: 240000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  try {
    const plan = creaPlaMigracions();
    const pos = plan.migrations.findIndex(m => m.file === MIGRATION);
    assert.ok(pos > 0, 'la migració és al catàleg');
    await db.query(plan.bootstrap);
    for (const m of plan.migrations.slice(0, pos)) { await db.query('begin'); await db.query(m.body); await db.query('commit'); }
    await db.query('grant select on public.towns to authenticated');
    await db.query("insert into public.towns(id,slug,name) values($1,'r24-me','Poble sintètic')", [TOWN]);
    for (const [who, nom] of [[ALICE, 'Alícia'], [BOB, 'Bernat'], [CAROL, 'Carme'], [DANI, 'Dani']]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: `${nom} Sintètic`, tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
      await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
    }
    const AB = await crea(db, ALICE, BOB);
    const AC = await crea(db, ALICE, CAROL);
    const AD = await crea(db, ALICE, DANI);

    const sql = read(`supabase/migrations/${MIGRATION}`);
    const { sentencies, vell } = marxaEnrere(sql);
    await db.query(sql);
    assert.deepEqual(await clau(db, AB), { parella_menor: ALICE, parella_major: BOB });

    /* 1 · «Com tornar enrere», literal, dins d'una transacció. */
    assert.ok(sentencies.some(s => /^drop trigger if exists xat_parella_vigent on public\.xat_participants;$/.test(s)));
    assert.ok(sentencies.some(s => /^drop index if exists public\.xat_fils_parella_uq;$/.test(s)));
    await db.query(`begin;\n${sentencies.join('\n')}\n${vell}\ncommit;`);
    assert.equal((await db.query("select to_regclass('public.xat_fils_parella_uq') as i")).rows[0].i, null, 'la marxa enrere retira l’índex');

    /* Vida normal durant la marxa enrere: Bernat es dona de baixa (la cascada
       d'Auth esborra la seua fila de participant; és el camí de la purga). */
    await db.query('delete from auth.users where id=$1', [BOB]);

    await t.test('Durant la marxa enrere documentada cap fila conserva l’UUID d’un compte suprimit', async () => {
      const n = await claus(db, BOB);
      assert.equal(n, 0, `xat_fils conserva ${n} clau(s) amb l’UUID del compte esborrat`);
    });

    await t.test('Reaplicar la migració després de la marxa enrere documentada (repetible)', async () => {
      try { await db.query(sql); }
      catch (e) { await db.query('rollback').catch(() => {}); assert.fail(`la reaplicació avorta: ${e.code} ${e.message}`); }
      assert.ok((await db.query("select to_regclass('public.xat_fils_parella_uq') as i")).rows[0].i, 'l’índex únic hi torna a ser');
      assert.equal(await crea(db, CAROL, ALICE), AC);
      assert.deepEqual(await clau(db, AC), { parella_menor: ALICE, parella_major: CAROL });
      assert.deepEqual(await clau(db, AB), { parella_menor: null, parella_major: null });
    });

    await t.test('Una marxa enrere parcial (sense retirar les claus): la reaplicació retira les claus mortes i conserva les vives', async () => {
      await db.query(`begin;
        drop trigger if exists xat_parella_vigent on public.xat_participants;
        drop index if exists public.xat_fils_parella_uq;
        commit;`);
      await db.query('delete from auth.users where id=$1', [CAROL]);
      assert.equal(await claus(db, CAROL), 1, 'sense disparador, la clau morta es queda (és el cas que cal reparar)');
      try { await db.query(sql); }
      catch (e) { await db.query('rollback').catch(() => {}); assert.fail(`la reaplicació avorta: ${e.code} ${e.message}`); }
      assert.equal(await claus(db, CAROL), 0, 'la reaplicació retira l’UUID del compte suprimit');
      assert.deepEqual(await clau(db, AD), { parella_menor: ALICE, parella_major: DANI }, 'la parella viva conserva la clau');
      assert.equal(await crea(db, DANI, ALICE), AD);
      assert.ok((await db.query("select to_regclass('public.xat_fils_parella_uq') as i")).rows[0].i, 'l’índex únic hi torna a ser');
    });
  } finally { await cluster.close(); }
});
