/* R24 · G-sql-4 (Gauntlet R24, onada 3) · 20261114061000:
   1 · la llista (xat_fils_meus) i la bombolla (xat_ritme) diuen el mateix
       (D-1, MIN) en TOTS els estats de participant que distingixen: eixit,
       amagat, bot lligat, bot sense lligam, gestor revocat, costat d'entitat,
       directe i fil propi (cursors pseudoaleatoris deterministes);
   2 · els bots lligats es resolen UNA vegada per fil, no per participant:
       abans, private.xat_ritme_es_bot (PL/pgSQL amb EXECUTE) s'avaluava per
       cada participant de cada fil i la bústia era ×3-4 més lenta als grups
       grans. Es compta amb pg_stat_xact_user_functions (track_functions),
       sense mesurar temps;
   3 · el helper no és de l'API.
   Origen: prova de paritat de l'atacant «sql» del Gauntlet R24 (174/174).
   PostgreSQL 18.6 local i descartable; cap servei remot. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const id = n => `24960000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), ORG = id(50);
const H = [11, 12, 13, 14, 15, 16, 17].map(id); const [A, B, C, D, E, F, G] = H;
const BOT = id(30), BOT2 = id(31);
const GRUP = id(100), DIR = id(101), ENT = id(102), GRUP2 = id(103);

async function actor(db, who, sql, params = []) {
  await db.query('begin');
  try {
    await db.query('set local role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)",
      [who, JSON.stringify({ sub: who, role: 'authenticated', aal: 'aal1' })]);
    const r = await db.query(sql, params); await db.query('commit'); return r;
  } catch (e) { await db.query('rollback'); throw e; }
}

test('R24 · llista = bombolla (D-1) en tots els estats i bots resolts una vegada per fil', { timeout: 300000 }, async t => {
  const cluster = await startLocalPostgres({ dataRoot: join(tmpdir(), 'sdp-r24-native') }), db = cluster.db;
  try {
    const plan = creaPlaMigracions();
    await db.query(plan.bootstrap);
    for (const m of plan.migrations) { await db.query('begin'); await db.query(m.body); await db.query('commit'); }
    await db.query("insert into public.towns(id,slug,name) values($1,'r24-entrega-bots','Poble sintètic')", [TOWN]);
    for (const who of [...H, BOT, BOT2]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: `Sintètic ${who.slice(-2)}`, tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
      if (![BOT, BOT2].includes(who)) await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
    }
    await db.query("insert into public.organizations(id,tenant_id,kind,name,slug,created_by) values($1,$2,'entity','Entitat sintètica R24','r24-entitat-bots',$3)", [ORG, TOWN, A]);
    await db.query("insert into public.organization_memberships(organization_id,tenant_id,user_id,role) values($1,$2,$3,'admin'),($1,$2,$4,'admin') on conflict do nothing", [ORG, TOWN, B, C]);
    await db.query("insert into public.xat_fils(id,tenant_id,tipus,titol,creat_per,ultim_seq) values($1,$2,'grup','Grup R24',$3,40),($4,$2,'grup','Grup R24 bis',$3,40)", [GRUP, TOWN, A, GRUP2]);
    await db.query('insert into public.xat_participants(fil_id,usuari_id) select $1, u from unnest($2::uuid[]) u', [GRUP, [...H, BOT]]);
    await db.query('insert into public.xat_participants(fil_id,usuari_id) select $1, u from unnest($2::uuid[]) u', [GRUP2, [A, B, D, BOT2]]);
    await db.query("update auth.users set banned_until='infinity' where id = any($1)", [[BOT, BOT2]]);
    await db.query('insert into private.xat_iaia_principals(bot_id,registered_by) values($1,$3),($2,$3)', [BOT, BOT2, A]);
    await db.query("insert into private.xat_iaia_binding(tenant_id,fil_id,bot_id,enabled,disclosure,updated_by) values($1,$2,$3,true,'Grup amb la IAIA declarada de proves',$4)", [TOWN, GRUP, BOT, A]);
    /* E ha eixit; F l'ha deixat de veure; BOT2 és un principal sense lligam en GRUP2. */
    await db.query("update public.xat_participants set eixit_al=now() where fil_id=$1 and usuari_id=$2", [GRUP, E]);
    await db.query('update public.xat_participants set visible_fins_seq=12 where fil_id=$1 and usuari_id=$2', [GRUP, F]);
    // IDEA-339 comprova els directes al COMMIT: la fixture també ha de crear
    // el fil i els participants atòmicament, com fa la RPC canònica.
    await db.query('begin');
    await db.query("insert into public.xat_fils(id,tenant_id,tipus,creat_per) values($1,$2,'directe',$3)", [id(999), TOWN, D]);
    await assert.rejects(db.query('commit'), e => e.code === '23514' && /SDP-XAT-051/.test(e.message));
    await db.query('rollback');
    assert.equal((await db.query('select count(*)::int n from public.xat_fils where id=$1', [id(999)])).rows[0].n, 0);
    await db.query('begin');
    try {
      await db.query("insert into public.xat_fils(id,tenant_id,tipus,creat_per,ultim_seq) values($1,$2,'directe',$3,40)", [DIR, TOWN, D]);
      await db.query('insert into public.xat_participants(fil_id,usuari_id) values($1,$2),($1,$3)', [DIR, D, G]);
      await db.query("insert into public.xat_fils(id,tenant_id,tipus,creat_per,org_id,interlocutor_id,ultim_seq) values($1,$2,'directe',$3,$4,$3,40)", [ENT, TOWN, D, ORG]);
      await db.query('insert into public.xat_participants(fil_id,usuari_id) values($1,$2)', [ENT, D]);
      await db.query("insert into public.xat_participants(fil_id,usuari_id,com_org_id,rol) values($1,$2,$4,'admin'),($1,$3,$4,'admin')", [ENT, A, C, ORG]);
      await db.query('commit');
    } catch (e) { await db.query('rollback'); throw e; }
    assert.deepEqual((await db.query('select fil_id,count(*)::int n from public.xat_participants where fil_id=any($1) group by fil_id order by fil_id', [[DIR, ENT]])).rows,
      [{ fil_id: DIR, n: 2 }, { fil_id: ENT, n: 3 }]);
    const PROPI = (await actor(db, G, 'select public.crea_fil_directe($1,$2,null) as id', [TOWN, G])).rows[0].id;
    await db.query('update public.xat_fils set ultim_seq=40 where id=$1', [PROPI]);

    let llavor = 7;
    const rnd = () => (llavor = (llavor * 1103515245 + 12345) % 2147483648) % 41;
    const fils = [GRUP, GRUP2, DIR, ENT, PROPI];
    let comparacions = 0;
    for (let ronda = 0; ronda < 12; ronda++) {
      for (const p of (await db.query('select fil_id, usuari_id from public.xat_participants where fil_id = any($1)', [fils])).rows) {
        const l = rnd(), r = rnd();
        await db.query('update public.xat_participants set llegit_fins_seq=$3, rebut_fins_seq=$4 where fil_id=$1 and usuari_id=$2', [p.fil_id, p.usuari_id, l, Math.max(l, r)]);
      }
      if (ronda === 6) await db.query('delete from public.organization_memberships where organization_id=$1 and user_id=$2', [ORG, C]);
      for (const who of H) {
        for (const fila of (await actor(db, who, 'select * from public.xat_fils_meus($1)', [TOWN])).rows) {
          if (!fils.includes(fila.id)) continue;
          let ritme;
          try { ritme = (await actor(db, who, 'select public.xat_ritme($1) as r', [fila.id])).rows[0].r; }
          catch (e) { if (e.code === '42501') continue; throw e; }
          comparacions++;
          assert.deepEqual({ rebut: Number(fila.rebut_pels_altres_fins_seq), llegit: Number(fila.llegit_pels_altres_fins_seq) },
            { rebut: Number(ritme.rebutPelsAltresFinsSeq), llegit: Number(ritme.llegitPelsAltresFinsSeq) },
            `ronda ${ronda}, ${who.slice(-2)} al fil ${fila.id.slice(-3)}: llista ≠ bombolla`);
        }
      }
    }
    t.diagnostic(`comparacions llista↔bombolla: ${comparacions}`);
    assert.ok(comparacions > 100);

    await t.test('Els bots lligats es resolen una vegada per fil, no per participant', async () => {
      await db.query('begin');
      try {
        await db.query("set local track_functions = 'pl'");
        await db.query('set local role authenticated');
        await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)",
          [A, JSON.stringify({ sub: A, role: 'authenticated', aal: 'aal1' })]);
        const files = (await db.query('select id from public.xat_fils_meus($1)', [TOWN])).rows;
        await db.query('reset role');
        const crides = Object.fromEntries((await db.query(
          "select funcname, calls::int from pg_catalog.pg_stat_xact_user_functions where schemaname = 'private' and funcname in ('xat_ritme_es_bot', 'xat_bots_del_fil')")).rows
          .map(r => [r.funcname, r.calls]));
        const grup = Number((await db.query('select count(*)::int n from public.xat_participants where fil_id=$1', [GRUP])).rows[0].n);
        t.diagnostic(`fils a la llista d'A: ${files.length}; participants de GRUP: ${grup}; crides: ${JSON.stringify(crides)}`);
        assert.ok(files.length >= 3 && grup >= 8);
        const resolucions = (crides.xat_ritme_es_bot ?? 0) + (crides.xat_bots_del_fil ?? 0);
        assert.ok(resolucions <= files.length,
          `${resolucions} resolucions de bots per a ${files.length} fils: es resolen per participant, no per fil`);
      } finally { await db.query('rollback'); }
    });

    await t.test('Sense helper per a l’API: ni authenticated ni service_role el criden', async () => {
      await assert.rejects(actor(db, A, 'select * from private.xat_cursors_altres($1,$2)', [DIR, D]), e => e.code === '42501');
      await db.query('begin'); await db.query('set local role service_role');
      await assert.rejects(db.query('select * from private.xat_cursors_altres($1,$2)', [DIR, D]), e => e.code === '42501');
      await db.query('rollback');
    });
  } finally { await cluster.close(); }
});
