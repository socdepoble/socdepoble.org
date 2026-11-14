/* R24 · IDEA-260 (b) · P0-1 · El rebut d'entrega dels altres a la llista de
   converses (xat_fils_meus.rebut_pels_altres_fins_seq) sobre PostgreSQL 18.6
   real, amb tot el catàleg en l'ordre del verificador i la migració
   20261114061000 l'última. Abans de la migració la columna no existix i el
   remitent no pot pintar mai el ✓✓ gris. Fixa també la regla D-1 (el mínim dels
   gestors vigents, com xat_ritme; pendent de decisió del
   Mestre), la monotonia, les denegacions (foraster, anon, gestor revocat), la
   IAIA fora del còmput i la idempotència. Cap servei remot. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const MIGRATION = '20261114061000_r24_xat_rebuts_entrega.sql';
const id = n => `24000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), OTHER_TOWN = id(2), ORG = id(50);
const ALICE = id(11), BOB = id(12), CARLES = id(13), EVE = id(14), DORA = id(15), BOT = id(16);
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const denied = (code = '42501') => e => e.code === code;

async function actor(db, who, sql, params = [], role = who ? 'authenticated' : 'anon') {
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
      [who ?? '', role, JSON.stringify({ sub: who, role, aal: 'aal1' })]);
    const result = await db.query(sql, params); await db.query('commit'); return result;
  } catch (e) { await db.query('rollback'); throw e; }
}
const row = async (db, who, fil) => (await actor(db, who, 'select * from public.xat_fils_meus($1)', [TOWN])).rows.find(r => r.id === fil);
const cursors = async (db, who, fil) => {
  const r = await row(db, who, fil);
  assert.ok(r, `${who} ha de veure el fil ${fil}`);
  assert.ok(Object.hasOwn(r, 'rebut_pels_altres_fins_seq'), 'xat_fils_meus ha de projectar rebut_pels_altres_fins_seq');
  return { rebut: Number(r.rebut_pels_altres_fins_seq), llegit: Number(r.llegit_pels_altres_fins_seq), propi: Number(r.rebut_fins_seq) };
};
const send = (db, who, fil, n) => actor(db, who, "select * from public.xat_envia($1,$2,'text',$3,null,'{}')", [id(1000 + n), fil, `Missatge sintètic ${n}`]);
const rebut = (db, who, fil, fins) => actor(db, who, 'select * from public.xat_marca_rebut($1,$2)', [fil, fins]);
const llegit = (db, who, fil, fins) => actor(db, who, 'select * from public.xat_marca($1,null,$2)', [fil, fins]);

test('R24 · rebut d’entrega dels altres a xat_fils_meus sobre PostgreSQL 18.6 real', { timeout: 300000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as n")).rows[0].n, '180006');
    const plan = creaPlaMigracions();
    await db.query(plan.bootstrap);
    for (const migration of plan.migrations) {
      await db.query('begin');
      try { await db.query(migration.body); await db.query('commit'); }
      catch (e) { await db.query('rollback'); throw new Error(`catàleg ${migration.file}: ${e.message}`, { cause: e }); }
    }
    await db.query("insert into public.towns(id,slug,name) values($1,'r24-entrega','Poble sintètic'),($2,'r24-entrega-altre','Altre poble')", [TOWN, OTHER_TOWN]);
    for (const [who, name, town] of [[ALICE, 'Alícia', TOWN], [BOB, 'Bernat', TOWN], [CARLES, 'Carles', TOWN], [EVE, 'Eva', OTHER_TOWN], [DORA, 'Dora', TOWN], [BOT, 'IAIA sintètica', TOWN]]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: name, tenant_id: town, accepta_rgpd: true, rgpd: true }]);
      if (who !== BOT) await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
    }
    /* Entitat reclamada amb el disparador real de propietat: Alícia propietària, Carles administrador. */
    await db.query("insert into public.organizations(id,tenant_id,kind,name,slug,created_by) values($1,$2,'entity','Entitat sintètica R24','r24-entitat',$3)", [ORG, TOWN, ALICE]);
    await db.query("insert into public.organization_memberships(organization_id,tenant_id,user_id,role) values($1,$2,$3,'admin') on conflict do nothing", [ORG, TOWN, CARLES]);

    await t.test('La migració R24 va darrere de les seues dependències i xat_fils_meus acaba amb la columna nova', async () => {
      /* Cap «és l'última del catàleg»: una migració posterior que no toque xat_fils_meus no l'ha de tombar
         (és el que va trencar R22.0 i R22.1). La invariant de veres és la columna al final del catàleg sencer. */
      const posicio = file => plan.migrations.findIndex(m => m.file === file);
      assert.ok(posicio(MIGRATION) >= 0, 'la migració R24 és al catàleg');
      for (const dependencia of ['2611080432_xat_lliurament_i_presencia.sql', '20261113003000_r21_9b_canal_beta_testers_i_sync_aparadors.sql']) {
        assert.ok(posicio(MIGRATION) > posicio(dependencia), `darrere de ${dependencia}`);
      }
      const columnes = (await db.query(`select unnest(proargnames) as nom from pg_proc where oid = 'public.xat_fils_meus(uuid)'::regprocedure`)).rows.map(r => r.nom);
      assert.equal(columnes.at(-1), 'rebut_pels_altres_fins_seq');
      assert.equal(columnes.at(-2), 'canal_clau', 'les columnes de R21.9b es conserven en el seu ordre');
    });

    let directe;
    await t.test('Persona↔persona: enviat → lliurat (rebut) → llegit, i el rebut no marca cap lectura', async () => {
      directe = (await actor(db, ALICE, 'select public.crea_fil_directe($1,$2,null) as id', [TOWN, BOB])).rows[0].id;
      await send(db, ALICE, directe, 1);
      assert.deepEqual(await cursors(db, ALICE, directe), { rebut: 0, llegit: 0, propi: 1 });
      await rebut(db, BOB, directe, 1);
      assert.deepEqual(await cursors(db, ALICE, directe), { rebut: 1, llegit: 0, propi: 1 }, '✓✓ gris: ha arribat a l’aplicació, sense llegir');
      const bernat = await row(db, BOB, directe);
      assert.equal(Number(bernat.no_llegits), 1, 'el rebut no apaga el no llegit del destinatari');
      await llegit(db, BOB, directe, 1);
      assert.deepEqual(await cursors(db, ALICE, directe), { rebut: 1, llegit: 1, propi: 1 }, '✓✓ blau');
    });

    await t.test('Monotonia i sostre: un rebut mai passa de l’últim seq ni recula', async () => {
      await send(db, ALICE, directe, 2);
      assert.equal((await rebut(db, BOB, directe, 999)).rows[0].rebut_fins_seq, '2');
      assert.equal((await rebut(db, BOB, directe, 0)).rows[0].rebut_fins_seq, '2');
      assert.deepEqual(await cursors(db, ALICE, directe), { rebut: 2, llegit: 1, propi: 2 });
    });

    let entitat;
    await t.test('D-1 · Mínim dels gestors vigents, la mateixa semàntica que xat_ritme; l’entitat veu el client', async () => {
      entitat = (await actor(db, BOB, 'select public.crea_fil_directe($1,$2,null) as id', [TOWN, ORG])).rows[0].id;
      await send(db, ALICE, entitat, 3);
      const vistaClient = await row(db, BOB, entitat);
      assert.equal(vistaClient.com_entitat, false); assert.equal(vistaClient.entitat_nom, 'Entitat sintètica R24');
      await rebut(db, BOB, entitat, 1);
      for (const gestor of [ALICE, CARLES]) {
        assert.deepEqual(await cursors(db, gestor, entitat), { rebut: 1, llegit: 0, propi: gestor === ALICE ? 1 : 0 },
          'el cogestor no compta com a destinatari de la seua pròpia entitat');
      }
      await send(db, BOB, entitat, 4);
      assert.deepEqual(await cursors(db, BOB, entitat), { rebut: 0, llegit: 0, propi: 2 }, 'D-1 = mínim: Carles encara no ha rebut res');
      await rebut(db, CARLES, entitat, 2);
      assert.deepEqual(await cursors(db, BOB, entitat), { rebut: 1, llegit: 0, propi: 2 }, 'Alícia té el cursor al seq 1, que va escriure ella');
      await llegit(db, ALICE, entitat, 2);
      assert.deepEqual(await cursors(db, BOB, entitat), { rebut: 2, llegit: 0, propi: 2 }, 'D-1 = mínim: el ✓✓ blau espera Carles');
      await llegit(db, CARLES, entitat, 2);
      assert.deepEqual(await cursors(db, BOB, entitat), { rebut: 2, llegit: 2, propi: 2 },
        'D-1 = mínim: ✓✓ blau quan tots els gestors vigents l’han llegit, igual que la bombolla (xat_ritme)');
    });

    await t.test('Gestor revocat: ni marca ni compta en els cursors del client', async () => {
      await send(db, BOB, entitat, 5);
      await rebut(db, ALICE, entitat, 3);
      assert.equal((await cursors(db, BOB, entitat)).rebut, 2, 'amb el mínim, Carles (2) fa esperar');
      await db.query('delete from public.organization_memberships where organization_id=$1 and user_id=$2', [ORG, CARLES]);
      await assert.rejects(rebut(db, CARLES, entitat, 3), denied());
      assert.deepEqual(await cursors(db, BOB, entitat), { rebut: 3, llegit: 2, propi: 3 }, 'només Alícia, l’única gestora vigent');
    });

    await t.test('Denegacions: foraster, anon i helper privat', async () => {
      await assert.rejects(rebut(db, EVE, directe, 1), denied());
      assert.equal(await row(db, EVE, directe), undefined);
      await assert.rejects(actor(db, null, 'select * from public.xat_fils_meus($1)', [TOWN]), denied());
      await assert.rejects(actor(db, null, 'select * from public.xat_marca_rebut($1,1)', [directe]), denied());
      await assert.rejects(actor(db, ALICE, 'select * from private.xat_cursors_altres($1,$2)', [directe, ALICE]), denied());
      const privilegis = (await db.query(`select
        has_function_privilege('anon','public.xat_fils_meus(uuid)','execute') as anon_fils,
        has_function_privilege('authenticated','public.xat_fils_meus(uuid)','execute') as auth_fils,
        has_function_privilege('anon','private.xat_cursors_altres(uuid,uuid)','execute') as anon_helper,
        has_function_privilege('authenticated','private.xat_cursors_altres(uuid,uuid)','execute') as auth_helper,
        has_function_privilege('service_role','private.xat_cursors_altres(uuid,uuid)','execute') as servei_helper,
        exists (select 1 from pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
          where p.oid in ('public.xat_fils_meus(uuid)'::regprocedure, 'private.xat_cursors_altres(uuid,uuid)'::regprocedure)
            and a.grantee = 0 and a.privilege_type = 'EXECUTE') as public_executa`)).rows[0];
      assert.deepEqual(privilegis, { anon_fils: false, auth_fils: true, anon_helper: false, auth_helper: false, servei_helper: false, public_executa: false });
      const forma = (await db.query(`select p.oid::regprocedure::text as sig, p.prosecdef as definer, p.proconfig as cfg, p.provolatile as vol
        from pg_proc p where p.oid in ('public.xat_fils_meus(uuid)'::regprocedure,'private.xat_cursors_altres(uuid,uuid)'::regprocedure) order by 1`)).rows;
      assert.deepEqual(forma, [
        { sig: 'private.xat_cursors_altres(uuid,uuid)', definer: false, cfg: ['search_path=""'], vol: 's' },
        { sig: 'xat_fils_meus(uuid)', definer: true, cfg: ['search_path=""'], vol: 'v' }
      ]);
    });

    await t.test('La IAIA d’un grup no frena el rebut ni el llegit dels humans', async () => {
      const grup = id(300);
      await db.query("insert into public.xat_fils(id,tenant_id,tipus,titol,creat_per) values($1,$2,'grup','Grup sintètic amb IAIA',$3)", [grup, TOWN, ALICE]);
      await db.query('insert into public.xat_participants(fil_id,usuari_id) values($1,$2),($1,$3),($1,$4)', [grup, ALICE, DORA, BOT]);
      await db.query("update auth.users set banned_until='infinity' where id=$1", [BOT]);
      await db.query('insert into private.xat_iaia_principals(bot_id,registered_by) values($1,$2)', [BOT, ALICE]);
      await db.query("insert into private.xat_iaia_binding(tenant_id,fil_id,bot_id,enabled,disclosure,updated_by) values($1,$2,$3,true,'Grup amb la IAIA declarada de proves',$4)", [TOWN, grup, BOT, ALICE]);
      assert.equal((await db.query('select private.xat_ritme_es_bot($1,$2) as v', [grup, BOT])).rows[0].v, true);
      await send(db, ALICE, grup, 6);
      await rebut(db, DORA, grup, 1);
      await llegit(db, DORA, grup, 1);
      assert.deepEqual(await cursors(db, ALICE, grup), { rebut: 1, llegit: 1, propi: 1 }, 'el cursor 0 de la IAIA no compta');
    });

    await t.test('Idempotència: reaplicar la migració no canvia res', async () => {
      const abans = await Promise.all([cursors(db, ALICE, directe), cursors(db, BOB, entitat), cursors(db, ALICE, id(300))]);
      const sql = read(`supabase/migrations/${MIGRATION}`);
      t.diagnostic(`${MIGRATION} sha256=${createHash('sha256').update(sql).digest('hex')}`);
      await db.query(sql); await db.query(sql);
      assert.deepEqual(await Promise.all([cursors(db, ALICE, directe), cursors(db, BOB, entitat), cursors(db, ALICE, id(300))]), abans);
      assert.equal((await db.query("select count(*)::int as n from pg_proc where proname in ('xat_fils_meus','xat_cursors_altres')")).rows[0].n, 2);
      assert.equal((await db.query("select has_function_privilege('anon','public.xat_fils_meus(uuid)','execute') as v")).rows[0].v, false);
    });
  } finally {
    await cluster.close();
  }
});
