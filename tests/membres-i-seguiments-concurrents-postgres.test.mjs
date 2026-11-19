/** P1-13 / P2-10 · Dues sessions reals de PostgreSQL competint pels mateixos panys.
 * Cluster natiu descartable (embedded-postgres o SDP_POSTGRES_BIN), catàleg
 * complet de migracions i rols reals. No es connecta a cap servei de producció.
 *
 * Casos:
 *   1 · C11-03 (2610281730/2610311500): una administradora no pot degradar una
 *       administradora que la propietària acaba de nomenar en una altra sessió.
 *   2 · sdp-orgowner (2610311500): una transferència de propietat en curs fa
 *       esperar la propietària que nomena una administradora; quan es confirma,
 *       ja no és propietària i la crida es rebutja.
 *   3 · Quota de 30 altes per hora (2610241430/2610250100): és de la persona,
 *       també entre el camí personal i el camí com a entitat. Dues rondes amb
 *       ordre fix (personal i després entitat; entitat i després personal),
 *       cadascuna amb una persona i uns seguits propis i 29 altes de partida:
 *       la segona crida espera el pany de la persona i es rebutja.
 *
 * Línia base: SDP_MEMBRES_CONCURRENTS_BASELINE=1 aplica les mateixes migracions
 * sense les guardes de concurrència (els `perform pg_advisory_xact_lock(...)`
 * i la condició de l'ON CONFLICT de desa_membre_organitzacio). Amb la línia
 * base, els casos 1, 2 i 3 han de fallar: és la prova que el test mossega. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const BASELINE = process.env.SDP_MEMBRES_CONCURRENTS_BASELINE === '1';
const AMB_GUARDES = ['2610281730_membres_concurrents_i_correu_public.sql',
  '2610311500_commutacio_grup_empresa_i_transferencia_propietat.sql', '2610250100_seguiments_des_d_entitat.sql'];
const PANY = /^[ \t]*perform pg_advisory_xact_lock\(.*\);[ \t]*$/gm;
const GUARDA_ON_CONFLICT = /(on conflict \(organization_id, user_id\) do update set role = excluded\.role)\s*\n\s*where actual\.role <> 'owner'\s*\n\s*and \(v_meu = 'owner' or \(actual\.role <> 'admin' and excluded\.role <> 'admin'\)\);/g;

/** Línia base: retira les guardes i comprova que n'ha retirat alguna de cada fitxer. */
function senseGuardes(file, body) {
  const panys = body.match(PANY)?.length ?? 0;
  assert.ok(panys > 0, `${file}: la línia base no troba cap pany per retirar.`);
  let result = body.replace(PANY, '    null;');
  if (file !== AMB_GUARDES[2]) {
    const condicions = result.match(GUARDA_ON_CONFLICT)?.length ?? 0;
    assert.ok(condicions > 0, `${file}: la línia base no troba la condició de l'ON CONFLICT.`);
    result = result.replace(GUARDA_ON_CONFLICT, '$1;');
  }
  return result;
}

const id = n => `13000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const T = id(1), G = id(100);
const O = id(11), A = id(12), X = id(13), Y = id(14), P = id(15), Q1 = id(16), Q2 = id(17);
const P2 = id(18), Q3 = id(19), Q4 = id(20);

async function entraComA(db, who) {
  await db.query('set local role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)",
    [who, JSON.stringify({ sub: who, role: 'authenticated', aal: 'aal1' })]);
}
/** Una crida completa: begin, rol i claims, consulta i commit (o rollback). */
async function actor(db, who, sql, params = []) {
  await db.query('begin');
  try {
    await entraComA(db, who);
    const result = await db.query(sql, params); await db.query('commit'); return result;
  } catch (error) { await db.query('rollback'); throw error; }
}
/** La mateixa crida, però la transacció es queda oberta: qui crida fa el commit. */
async function actorObert(db, who, sql, params = []) {
  await db.query('begin');
  try { await entraComA(db, who); return await db.query(sql, params); }
  catch (error) { await db.query('rollback'); throw error; }
}
const assentada = promise => promise.then(value => ({ status: 'fulfilled', value }), reason => ({ status: 'rejected', reason }));
const pid = async db => (await db.query('select pg_backend_pid() as pid')).rows[0].pid;
/** Espera fins que `qui` queda bloquejada per `per`, o fins que ja ha acabat. */
async function esperaBloqueig(db, qui, per, acabada) {
  for (let i = 0; i < 300; i++) {
    if (acabada()) return false;
    const { b } = (await db.query('select $2::int = any(pg_blocking_pids($1::int)) as b', [qui, per])).rows[0];
    if (b) return true;
    await delay(10);
  }
  return false;
}
const desa = (db, who, membre, role, obert = false) => (obert ? actorObert : actor)(db, who,
  'select * from public.desa_membre_organitzacio($1,$2,$3,$4)', [G, membre, 'persona', role]);
const rolDe = async (db, who) => (await db.query('select role from public.organization_memberships where organization_id=$1 and user_id=$2', [G, who])).rows[0]?.role ?? null;

test('P1-13 / P2-10 · membres i seguiments concurrents en PostgreSQL natiu', { timeout: 240000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  try {
    const plan = creaPlaMigracions();
    await db.query(plan.bootstrap);
    for (const migration of plan.migrations) {
      const body = BASELINE && AMB_GUARDES.includes(migration.file) ? senseGuardes(migration.file, migration.body) : migration.body;
      try { await db.query('begin'); await db.query(body); await db.query('commit'); }
      catch (error) { await db.query('rollback'); throw new Error(`${migration.file}: ${error.message}`, { cause: error }); }
    }
    t.diagnostic(`PostgreSQL ${(await db.query('show server_version')).rows[0].server_version}; ${plan.migrations.length} migracions${BASELINE ? '; LÍNIA BASE sense guardes de concurrència' : ''}.`);

    await db.query("insert into public.towns(id,slug,name) values($1,'p113-sintetic','Poble sintètic P1-13')", [T]);
    for (const who of [O, A, X, Y, P, Q1, Q2, P2, Q3, Q4]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: 'Veí sintètic', tenant_id: T, accepta_rgpd: true, rgpd: true }]);
    }
    await db.query("insert into public.organizations(id,tenant_id,kind,name,slug,created_by,visibility) values($1,$2,'group','Grup sintètic','p113-grup',$3,'public')", [G, T, O]);
    await db.query("insert into public.organization_memberships(organization_id,tenant_id,user_id,role) values($1,$2,$3,'owner') on conflict (organization_id,user_id) do update set role='owner'", [G, T, O]);
    await db.query("insert into public.organization_memberships(organization_id,tenant_id,user_id,role) values($1,$2,$3,'admin')", [G, T, A]);
    assert.equal((await db.query('select count(*)::int n from public.town_memberships where town_id=$1 and user_id=any($2::uuid[])', [T, [O, A, X, Y, P, Q1, Q2, P2, Q3, Q4]])).rows[0].n, 10);

    const s1 = await cluster.connect(), s2 = await cluster.connect();
    const pid1 = await pid(s1), pid2 = await pid(s2);

    await t.test('C11-03 · la degradació concurrent de l’administradora espera i es rebutja (42501 SDP-ORGMEM-006)', async () => {
      await desa(s1, O, X, 'admin', true);
      let acabada = false;
      const segona = assentada(desa(s2, A, X, 'member')).finally(() => { acabada = true; });
      let bloquejada;
      try { bloquejada = await esperaBloqueig(db, pid2, pid1, () => acabada); }
      finally { await s1.query('commit'); }
      const result = await segona;
      assert.equal(await rolDe(db, X), 'admin', 'La propietària ha nomenat X administradora; la sessió 2 no la pot degradar.');
      assert.equal(result.status, 'rejected');
      assert.equal(result.reason.code, '42501'); assert.match(result.reason.message, /SDP-ORGMEM-006/);
      assert.equal(bloquejada, true, 'La sessió 2 ha d’esperar la sessió 1.');
    });

    await t.test('sdp-orgowner · nomenar durant una transferència en curs es rebutja (42501 SDP-ORGMEM-002/006)', async () => {
      await actorObert(s1, O, 'select * from public.transfereix_propietat_organitzacio($1,$2)', [G, A]);
      let acabada = false;
      const segona = assentada(desa(s2, O, Y, 'admin')).finally(() => { acabada = true; });
      let bloquejada;
      try { bloquejada = await esperaBloqueig(db, pid2, pid1, () => acabada); }
      finally { await s1.query('commit'); }
      const result = await segona;
      assert.equal(await rolDe(db, A), 'owner'); assert.equal(await rolDe(db, O), 'admin');
      assert.notEqual(await rolDe(db, Y), 'admin', 'Qui ja no és propietària no pot nomenar administradores.');
      assert.equal(result.status, 'rejected');
      assert.equal(result.reason.code, '42501'); assert.match(result.reason.message, /SDP-ORGMEM-00[26]/);
      assert.equal(bloquejada, true, 'La sessió 2 ha d’esperar la transferència.');
    });

    /** Una ronda de la quota amb ordre fix: `primer` pren la 30a alta amb la
     * transacció oberta a s1; `segon` (s2) ha d'esperar el pany de la persona i,
     * quan s1 confirma, s'ha de rebutjar amb 42900 SDP-SEG-006. */
    const personal = q => ['personal', "select public.segueix('persona',$1) as r", [q]];
    const entitat = q => ['entitat', "select public.segueix('persona',$1,$2) as r", [q, G]];
    async function rondaQuota(qui, [nomPrimer, sqlPrimer, paramsPrimer], [nomSegon, sqlSegon, paramsSegon], seguits) {
      await db.query("insert into public.organization_memberships(organization_id,tenant_id,user_id,role) values($1,$2,$3,'admin')", [G, T, qui]);
      await db.query("insert into private.seguiments_altes(seguidor,al) select $1, now()-interval '5 minutes' from generate_series(1,29)", [qui]);
      await actorObert(s1, qui, sqlPrimer, paramsPrimer);
      let acabada = false, bloquejada = false, espera = null;
      const segona = assentada(actor(s2, qui, sqlSegon, paramsSegon)).finally(() => { acabada = true; });
      try {
        bloquejada = await esperaBloqueig(db, pid2, pid1, () => acabada);
        if (bloquejada) espera = (await db.query('select wait_event from pg_stat_activity where pid=$1', [pid2])).rows[0]?.wait_event ?? null;
      } finally { await s1.query('commit'); }
      const result = await segona;
      const ordre = `${nomPrimer} i després ${nomSegon}`;
      assert.equal((await db.query("select count(*)::int n from private.seguiments_altes where seguidor=$1 and al > now()-interval '1 hour'", [qui])).rows[0].n, 30,
        `${ordre}: la quota de 30 altes per hora és de la persona.`);
      assert.equal((await db.query('select count(*)::int n from public.seguiments where seguidor=$1 and deixat_al is null and seguit_persona=any($2::uuid[])', [qui, seguits])).rows[0].n, 1,
        `${ordre}: només hi ha d'haver l'alta del primer camí.`);
      assert.equal(result.status, 'rejected', `${ordre}: el segon camí s'ha de rebutjar.`);
      assert.equal(result.reason.code, '42900'); assert.match(result.reason.message, /SDP-SEG-006/);
      assert.equal(bloquejada, true, `${ordre}: el segon camí ha d'esperar el primer.`);
      assert.equal(espera, 'advisory', `${ordre}: l'espera és el pany advisory de la persona.`);
    }

    await t.test('quota de 30 altes per hora · personal i després entitat: l’entitat es rebutja', async () => {
      await rondaQuota(P, personal(Q1), entitat(Q2), [Q1, Q2]);
    });

    await t.test('quota de 30 altes per hora · entitat i després personal: la personal es rebutja', async () => {
      await rondaQuota(P2, entitat(Q3), personal(Q4), [Q3, Q4]);
    });
  } finally { await cluster.close(); }
});
