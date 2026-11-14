/* R22.4 · La migració 20261114000300 (private.purga_una_baixa amb assaig previ
   i avís SDP-BAIXA-044) sobre PostgreSQL 18.6 real, amb tot el catàleg anterior
   en l'ordre del verificador (també R22.2 i R22.3). Compara el cos de Git (el
   mateix que producció, md5 de q15) amb el nou: abans, un compte amb fitxers a
   la cua i una clau forana que para l'esborrat d'Auth quedava mig purgat i sense
   poder cancel·lar; després, l'error ix a la primera passada amb tot intacte.
   Cap servei remot ni cap planificador. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const MIGRATION = '20261114000300_r22_4_purga_baixes_avis_worker.sql';
const MD5_PURGA_PRODUCCIO = '8270ef8f64ef15c4ea6e80e75a6a0037';
const id = n => `22400000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1);
const [U, V, W, K, R, S, I, T, BOT] = [11, 12, 13, 14, 15, 16, 17, 18, 19].map(id);
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

async function actor(db, who, sql, params = []) {
  await db.query('begin');
  try {
    await db.query('set local role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)",
      [who, JSON.stringify({ sub: who, role: 'authenticated', aal: 'aal1' })]);
    const result = await db.query(sql, params); await db.query('commit'); return result;
  } catch (e) { await db.query('rollback'); throw e; }
}
/* Com purga_baixes_vencudes: una passada per persona, en un subbloc que es desfà si falla. */
const passada = async (db, who) => {
  await db.query("update private.baixes set purga_prevista_al = least(purga_prevista_al, now() - interval '1 day') where user_id = $1", [who]);
  await db.query('begin');
  try {
    const fet = (await db.query('select private.purga_una_baixa($1) as fet', [who])).rows[0].fet;
    await db.query('set constraints all immediate'); await db.query('commit'); return fet;
  } catch (e) { await db.query('rollback'); throw e; }
};
const estat = async (db, who) => (await db.query(`select (select count(*)::int from auth.users where id=$1) as compte,
  (select count(*)::int from public.notes where owner_user_id=$1) as notes,
  (select purga_fitxers_iniciada_al is not null from private.baixes where user_id=$1) as iniciada,
  (select ultim_error from private.baixes where user_id=$1) as error`, [who])).rows[0];
const empremta = async db => (await db.query(`select p.oid::regprocedure::text as sig, p.prosecdef, p.proconfig::text as cfg, md5(p.prosrc) as md5,
  pg_get_function_result(p.oid) as ret, coalesce(p.proacl::text, '') as acl from pg_proc p where p.oid = 'private.purga_una_baixa(uuid)'::regprocedure`)).rows;

test('R22.4 · purga amb assaig previ i avís del worker sobre PostgreSQL 18.6 real', { timeout: 300000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as n")).rows[0].n, '180006');
    const plan = creaPlaMigracions();
    const posicio = plan.migrations.findIndex(m => m.file === MIGRATION);
    assert.ok(posicio > plan.migrations.findIndex(m => m.file.startsWith('20261114000200_')), 'darrere de R22.3');
    await db.query(plan.bootstrap);
    for (const migration of plan.migrations.slice(0, posicio)) {
      await db.query('begin');
      try { await db.query(migration.body); await db.query('commit'); }
      catch (e) { await db.query('rollback'); throw new Error(`baseline ${migration.file}: ${e.message}`, { cause: e }); }
    }
    assert.equal((await empremta(db))[0].md5, MD5_PURGA_PRODUCCIO, 'Git = producció abans de R22.4');
    await db.query('grant select on public.towns to authenticated');
    await db.query("insert into public.towns(id,slug,name) values($1,'r22-4-purga','Poble sintètic')", [TOWN]);
    for (const [n, who] of [U, V, W, K, R, S, I, T].entries()) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: `Persona sintètica ${n}`, tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
      await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
      await actor(db, who, "insert into public.notes(id,tenant_id,owner_user_id,title,content) values($1,$2,$3,'Nota sintètica','<p>Cos</p>')", [id(100 + n), TOWN, who]);
    }
    /* Un fitxer propi i no citat (va a la cua) i una clau forana RESTRICT que para l'esborrat final. */
    const fitxer = who => db.query("insert into storage.objects(bucket_id,name,owner,owner_id,version) values('mitjans',$1,$2::uuid,$2::text,'v1')", [`${TOWN}/${who}/mur/${who}.webp`, who]);
    await db.query('create table public.r22_4_bloqueja(user_id uuid references auth.users(id) on delete restrict)');
    for (const who of [U, V, W, K]) {
      await actor(db, who, "select public.demana_baixa('Baixa sintètica R22.4')");
    }
    for (const who of [U, V, W]) await fitxer(who);
    await db.query('insert into public.r22_4_bloqueja values ($1), ($2)', [U, V]);

    await t.test('Abans (cos de Git i de producció): la primera passada destruïx i tanca la cancel·lació encara que el final fallarà', async () => {
      assert.equal(await passada(db, U), false);
      assert.deepEqual(await estat(db, U), { compte: 1, notes: 0, iniciada: true, error: null });
      await assert.rejects(actor(db, U, 'select public.cancela_baixa()'), e => /SDP-BAIXA-041/.test(e.message));
      /* El worker fa la seua feina: esborra el binari, la fila de Storage i la de la cua. */
      await db.query('delete from storage.objects where owner_id = $1', [U]);
      await db.query('delete from public.cua_purga_storage_ugc where user_id = $1', [U]);
      await assert.rejects(passada(db, U), e => ['23001', '23503'].includes(e.code), 'la segona passada falla a l’esborrat d’Auth');
      assert.deepEqual(await estat(db, U), { compte: 1, notes: 0, iniciada: true, error: null }, 'compte mig purgat per sempre');
    });

    /* Producció no té town_memberships_user_id_fkey (q12; B-deriva-esquema-6). */
    await db.query('alter table public.town_memberships drop constraint town_memberships_user_id_fkey');
    const sql = read(`supabase/migrations/${MIGRATION}`);
    t.diagnostic(`${MIGRATION} sha256=${createHash('sha256').update(sql).digest('hex')}`);
    await db.query('create role sdp_editor_sql nosuperuser inherit; grant postgres to sdp_editor_sql');
    const aplica = async () => {
      await db.query('set role sdp_editor_sql');
      try { await db.query(sql); } finally { await db.query('reset role'); }
    };
    await aplica();
    const primera = await empremta(db);
    await aplica();
    await db.query('reassign owned by sdp_editor_sql to postgres');

    await t.test('Idempotent i amb la mateixa signatura i permisos (cap rol de l’API)', async () => {
      assert.deepEqual(await empremta(db), primera);
      assert.notEqual(primera[0].md5, MD5_PURGA_PRODUCCIO);
      assert.equal(primera[0].ret, 'boolean');
      assert.equal(primera[0].prosecdef, true);
      for (const rol of ['anon', 'authenticated', 'service_role']) {
        assert.equal((await db.query("select has_function_privilege($1,'private.purga_una_baixa(uuid)','EXECUTE') as x", [rol])).rows[0].x, false, rol);
      }
    });

    await t.test('Assaig: si l’esborrat d’Auth fallarà, l’error ix a la primera passada amb tot intacte i la baixa cancel·lable', async () => {
      await assert.rejects(passada(db, V), e => ['23001', '23503'].includes(e.code));
      assert.deepEqual(await estat(db, V), { compte: 1, notes: 1, iniciada: false, error: null });
      assert.equal((await db.query('select count(*)::int as n from public.cua_purga_storage_ugc where user_id=$1', [V])).rows[0].n, 0, 'la cua tampoc s’ha tocat');
      await actor(db, V, 'select public.cancela_baixa()');
      assert.equal((await db.query('select count(*)::int as n from private.baixes where user_id=$1', [V])).rows[0].n, 0, 'cancel·lada');
    });

    await t.test('SDP-BAIXA-044: la cua sense reclamar més de 24 h deixa rastre, i es neteja quan el worker la reclama', async () => {
      assert.equal(await passada(db, W), false, 'primera passada: el fitxer va a la cua');
      assert.deepEqual(await estat(db, W), { compte: 1, notes: 0, iniciada: true, error: null });
      await db.query("update public.cua_purga_storage_ugc set creat_al = now() - interval '25 hours' where user_id = $1", [W]);
      assert.equal(await passada(db, W), false);
      assert.equal((await estat(db, W)).error, 'SDP-BAIXA-044: fitxers a la cua sense reclamar des de fa més de 24 h; el worker purga-fitxers no corre.');
      await db.query('update public.cua_purga_storage_ugc set intents = 1, ultim_intent_al = now() where user_id = $1', [W]);
      assert.equal(await passada(db, W), false);
      assert.equal((await estat(db, W)).error, null, 'el worker ja reclama: sense avís');
      /* El worker esborra el binari i la fila de Storage; la passada següent acaba. */
      await db.query("delete from storage.objects where owner_id = $1", [W]);
      await db.query('delete from public.cua_purga_storage_ugc where user_id = $1', [W]);
      assert.equal(await passada(db, W), true);
      assert.equal((await estat(db, W)).compte, 0);
    });

    await t.test('Regressió: la purga d’una veïna sense fitxers i la d’una propietària de grup (relleu) acaben en una passada', async () => {
      assert.equal(await passada(db, K), true);
      assert.equal((await estat(db, K)).compte, 0);
      const colla = (await actor(db, R, "select (public.create_organization($1,'group','Colla sintètica','r22-4-colla')->>'id') as id", [TOWN])).rows[0].id;
      await actor(db, R, "select * from public.desa_membre_organitzacio($1,$2,'persona','member')", [colla, S]);
      await actor(db, R, "select public.demana_baixa('Baixa sintètica R22.4 de la propietària')");
      assert.equal(await passada(db, R), true);
      assert.deepEqual((await db.query('select user_id, role from public.organization_memberships where organization_id=$1', [colla])).rows, [{ user_id: S, role: 'owner' }]);
    });

    await t.test('Pertinença: amb la forma de producció (sense clau), la purga no deixa el poble d’un compte que ja no existix', async () => {
      await actor(db, T, "select public.demana_baixa('Baixa sintètica R22.4 amb pertinença')");
      assert.equal(await passada(db, T), true);
      assert.equal((await db.query('select count(*)::int as n from public.town_memberships where user_id=$1', [T])).rows[0].n, 0);
      assert.deepEqual((await db.query("select convalidated from pg_constraint where conrelid='public.town_memberships'::regclass and conname='town_memberships_user_id_fkey'")).rows, [{ convalidated: true }]);
    });

    await t.test('IAIA: qui li ha fet una pregunta es purga (cap fila de private.xat_iaia_jobs no ho para)', async () => {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)', [BOT, `${BOT}@example.invalid`, {}]);
      const fil = (await actor(db, I, 'select public.crea_fil_directe($1,$2,null) as id', [TOWN, I])).rows[0].id;
      const font = (await actor(db, I, "select (public.xat_envia($1,$2,'text','Pregunta sintètica',null,'{}')).id as id", [id(900), fil])).rows[0].id;
      await db.query(`insert into private.xat_iaia_jobs(tenant_id,fil_id,source_id,requester_id,bot_id,binding_revision,source_hash,state,lease_id,lease_until,attempts,reply_id)
        values($1,$2,$3,$4,$5,1,'h','answered',gen_random_uuid(),now(),1,gen_random_uuid())`, [TOWN, fil, font, I, BOT]);
      await actor(db, I, "select public.demana_baixa('Baixa sintètica R22.4 de qui ha usat la IAIA')");
      assert.equal(await passada(db, I), true);
      assert.deepEqual(await estat(db, I), { compte: 0, notes: 0, iniciada: null, error: null });
      assert.equal((await db.query('select count(*)::int as n from private.xat_iaia_jobs where requester_id=$1', [I])).rows[0].n, 0);
    });
  } finally {
    await cluster.close();
  }
});
