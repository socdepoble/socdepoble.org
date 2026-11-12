import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const TOWN = '11000000-0000-4000-8000-000000000001';
const ADMIN = '22000000-0000-4000-8000-000000000001';
const PERSON = '22000000-0000-4000-8000-000000000002';
const ACTOR = '33000000-0000-4000-8000-000000000001';
const OPERATION = '55000000-0000-4000-8000-000000000001';

async function sqlFile(client, file) {
  await client.query(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
}

async function asActor(client, actor, aal = 'aal2') {
  await client.query('begin');
  await client.query('set local role authenticated');
  await client.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.aal', $2, true)", [actor, aal]);
}

function transfer(client, resource, operation = OPERATION, version = 0) {
  return client.query(`select public.traspassa_publicacio($1, 'pagina', $2, $3, $4, $5, '{}', false) as result`,
    [TOWN, resource, version, operation, ACTOR]);
}

async function waitForLock(observer, pid) {
  const end = Date.now() + 5000;
  while (Date.now() < end) {
    const { rows } = await observer.query('select wait_event_type, wait_event from pg_stat_activity where pid = $1', [pid]);
    if (rows[0]?.wait_event_type === 'Lock' && rows[0]?.wait_event === 'advisory') return;
    await delay(10);
  }
  assert.fail('La segona connexió ha de quedar bloquejada al pany transaccional del recurs.');
}

test('R20 · PostgreSQL natiu, AAL2, Mur i concurrència entre connexions', { timeout: 90000 }, async t => {
  const cluster = await startLocalPostgres();
  const db = cluster.db;
  try {
    for (const file of [
      'tests/fixtures/copublicacio/bootstrap.sql',
      'supabase/migrations/2609080000_initial_schema.sql',
      'tests/fixtures/copublicacio/bootstrap-perfils.sql',
      'supabase/migrations/2609140000_schema_notes.sql',
      'supabase/migrations/2609261200_publicacions_autoria.sql',
      'supabase/migrations/2610061448_superadmin_aal2.sql',
      'supabase/migrations/2611111735_copublicacio_registrada.sql',
      'supabase/migrations/2611111735_copublicacio_registrada.sql'
    ]) {
      await sqlFile(db, file);
      t.diagnostic(file);
    }
    t.diagnostic((await db.query('select version()')).rows[0].version);

    await t.test('Regressió R19 amb ACL, padró, AAL2, revocació i reversió', async () => {
      await sqlFile(db, 'tests/fixtures/copublicacio/regression.sql');
      assert.equal((await db.query('select count(*)::int as n from private.publicacio_traspassos')).rows[0].n, 0);
    });

    await sqlFile(db, 'supabase/migrations/2611112005_mur_lectura_publica_foraster.sql');
    await sqlFile(db, 'supabase/migrations/2611112005_mur_lectura_publica_foraster.sql');
    await sqlFile(db, 'supabase/migrations/2611112149_mur_estat_public_i_padro.sql');
    await sqlFile(db, 'supabase/migrations/2611112149_mur_estat_public_i_padro.sql');
    // La fixture representa el SELECT del catàleg públic de pobles de Supabase.
    await db.query('grant select on public.towns to anon, authenticated');

    await t.test('Foraster llig approved/published i es bloquegen esborranys privats', async () => {
      try { await sqlFile(db, 'tests/fixtures/copublicacio/mur-public.sql'); }
      finally { await db.query('rollback'); }
    });

    await db.query(`insert into public.towns(id, slug, name) values ($1, 'r20-concurrencia', 'Poble sintètic R20')`, [TOWN]);
    for (const [id, name] of [[ADMIN, 'Administració sintètica'], [PERSON, 'Persona sintètica']]) {
      await db.query(`insert into auth.users(id,email_confirmed_at,raw_user_meta_data) values ($1,now(),$2)`,
        [id, { name, tenant_id: TOWN }]);
    }
    await db.query('update public.profiles set is_public = true where id = $1', [PERSON]);
    await db.query(`insert into public.user_platform_roles(user_id,role) values ($1,'superadmin')`, [ADMIN]);
    await db.query(`insert into public.organizations(id,tenant_id,slug,name,kind,created_by) values ($1,$2,'actor-r20','Entitat sintètica R20','entity',$3)`,
      [ACTOR, TOWN, ADMIN]);
    await db.query(`insert into public.app_content(tenant_id,key,payload) values ($1,'pages',$2)`,
      [TOWN, JSON.stringify([{ id: 'competicio' }, { id: 'reintent' }, { id: 'rollback' }])]);

    await t.test('AAL2 és literal i també exigeix un superadmin actiu', async () => {
      for (const aal of ['', 'aal1', 'AAL2', 'aal2 ', 'aal3', 'null']) {
        await asActor(db, ADMIN, aal);
        try {
          await assert.rejects(transfer(db, 'competicio'),
            error => error.code === '42501' && error.message.startsWith('SDP-COPUB-007:'));
        } finally { await db.query('rollback'); }
      }
      await asActor(db, PERSON);
      try {
        await assert.rejects(transfer(db, 'competicio'),
          error => error.code === '42501' && error.message.startsWith('SDP-COPUB-008:'));
      } finally { await db.query('rollback'); }
      assert.equal((await db.query('select count(*)::int as n from private.publicacio_traspassos')).rows[0].n, 0);
    });

    await t.test('El padró públic resol un article visible i oculta el mateix article privat', async () => {
      await db.query('begin');
      try {
        const article = '44000000-0000-4000-8000-000000000010';
        await db.query("select set_config('request.jwt.claim.sub',$1,true)", [ADMIN]);
        await db.query(`insert into public.section_submissions(id,tenant_id,owner_user_id,author_org_id,section_id,title,payload)
          values ($1,$2,$3,$4,'mur','Article sintètic públic','{"status":"published"}')`, [article,TOWN,ADMIN,ACTOR]);
        await db.query('set local role anon');
        await db.query("select set_config('request.jwt.claim.sub','',true)");
        const visible = (await db.query("select public.llig_publicadors_registrats($1,'article',$2) as result", [TOWN,article])).rows[0].result;
        assert.equal(visible.publicadorsRegistrats[0].actor_id, ACTOR);
        assert.equal(visible.publicadorsRegistrats[0].slug_ruta, '/perfil/' + ACTOR + '?registre=organitzacio');
        await db.query('reset role');
        await db.query("select set_config('request.jwt.claim.sub',$1,true)", [ADMIN]);
        await db.query("update public.section_submissions set payload='{\"status\":\"draft\"}' where id=$1", [article]);
        await db.query('set local role anon');
        await db.query("select set_config('request.jwt.claim.sub','',true)");
        const hidden = (await db.query("select public.llig_publicadors_registrats($1,'article',$2) as result", [TOWN,article])).rows[0].result;
        assert.deepEqual(hidden.publicadorsRegistrats, []);
      } finally { await db.query('rollback'); }
    });

    await t.test('Un superadmin AAL2 no pot aprovar la seua pròpia reclamació', async () => {
      await db.query('begin');
      try {
        const claim = '66000000-0000-4000-8000-000000000001';
        await db.query(`insert into public.organization_claims(id,organization_id,tenant_id,user_id) values ($1,$2,$3,$4)`,
          [claim, ACTOR, TOWN, ADMIN]);
        await db.query('set local role authenticated');
        await db.query("select set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claim.aal','aal2',true)", [ADMIN]);
        await assert.rejects(db.query('select public.resol_reclamacio($1,true)', [claim]),
          error => error.code === '42501' && error.message.startsWith('SDP-CLAIM-012:'));
      } finally { await db.query('rollback'); }
    });

    const a = await cluster.connect();
    const b = await cluster.connect();
    const pidA = (await a.query('select pg_backend_pid() as pid')).rows[0].pid;
    const pidB = (await b.query('select pg_backend_pid() as pid')).rows[0].pid;
    assert.notEqual(pidA, pidB);
    t.diagnostic(`Connexions natives independents ${pidA} i ${pidB}.`);

    for (const [index, [resource, sameOperation, rollback]] of [
      ['competicio', false, false], ['reintent', true, false], ['rollback', false, true]
    ].entries()) {
      await t.test(`Concurrència real ${resource}`, async () => {
        await asActor(a, ADMIN);
        await asActor(b, ADMIN);
        let pending;
        try {
          const operationA = '55000000-0000-4000-8000-' + String(index * 2 + 1).padStart(12, '0');
          const first = (await transfer(a, resource, operationA)).rows[0].result;
          assert.equal(first.versio, 1);
          const operationB = sameOperation ? operationA : '55000000-0000-4000-8000-' + String(index * 2 + 2).padStart(12, '0');
          pending = transfer(b, resource, operationB).then(result => ({ result }), error => ({ error }));
          await waitForLock(db, pidB);
          await a.query(rollback ? 'rollback' : 'commit');
          const second = await pending;
          if (resource === 'competicio') {
            assert.equal(second.error?.code, '40001');
            await b.query('rollback');
          } else {
            assert.equal(second.error, undefined);
            assert.equal(second.result.rows[0].result.versio, 1);
            assert.equal(second.result.rows[0].result.repetida, sameOperation);
            await b.query('commit');
          }
          const state = await db.query(`select versio from private.publicacio_publicadors where tenant_id=$1 and tipus='pagina' and recurs_id=$2`, [TOWN, resource]);
          assert.equal(state.rows[0].versio, 1);
          assert.equal((await db.query(`select count(*)::int as n from private.publicacio_traspassos where tenant_id=$1 and recurs_id=$2`, [TOWN, resource])).rows[0].n, 1);
        } finally {
          await a.query('rollback');
          await b.query('rollback');
          if (pending) await pending;
        }
      });
    }
  } finally { await cluster.close(); }
});
