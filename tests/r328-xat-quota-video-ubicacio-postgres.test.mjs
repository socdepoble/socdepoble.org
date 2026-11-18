/** PostgreSQL natiu descartable: catàleg complet, rols reals i dues sessions
 * competint pel mateix pressupost. Storage és el seu esquema de compatibilitat;
 * no s'exercita l'API HTTP ni es connecta a cap servei de producció. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const FILE = '20261117193000_r32_8_xat_quota_250mb_video_60s_i_ubicacio.sql';
const BASELINE = process.env.SDP_R328_SQL_BASELINE === '1';
const id = n => `32800000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), A = id(11), B = id(12), C = id(13), OUT = id(14), FIL = id(100);
const protectedFunctions = ['public.xat_quota()', 'public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)',
  'public.xat_publica_adjunt(uuid,text,uuid)', 'private.xat_maxim_adjunt(text)', 'public.xat_envia(uuid,uuid,text,text,uuid,jsonb)'];
async function actor(db, who, sql, params = [], role = who ? 'authenticated' : 'anon') {
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
      [who ?? '', role, JSON.stringify({ sub: who, role, aal: 'aal1' })]);
    const result = await db.query(sql, params); await db.query('commit'); return result;
  } catch (error) { await db.query('rollback'); throw error; }
}
const reserve = (db, who, msg, bytes = 64, duration = 60_000) => actor(db, who,
  'select public.xat_reserva_adjunt($1,$2,$3,$4,$5) as result', [msg, FIL, bytes, 'video/mp4', duration]);
const publish = (db, who, msg, location, text = 'Vídeo sintètic') => actor(db, who,
  'select public.xat_publica_adjunt($1,$2,null,$3::jsonb) as result', [msg, text, location === undefined ? null : JSON.stringify(location)]).then(r => r.rows[0].result);
const denied = code => error => error.code === code;
async function functionSnapshot(db) {
  return (await db.query('select oid,oid::regprocedure::text as signature,proowner,proacl::text as acl,pg_get_functiondef(oid) as ddl,proconfig from pg_proc where oid=any($1::regprocedure[]) order by oid', [protectedFunctions])).rows;
}
async function securitySnapshot(db) {
  return {
    tables: (await db.query("select oid,relname,relrowsecurity,relforcerowsecurity,relowner,relacl::text as acl from pg_class where oid=any(array['public.xat_adjunts'::regclass,'public.xat_missatges'::regclass,'storage.objects'::regclass]) order by oid")).rows,
    policies: (await db.query("select polrelid,polname,polcmd,polpermissive,polroles,pg_get_expr(polqual,polrelid) as qual,pg_get_expr(polwithcheck,polrelid) as check from pg_policy where polrelid=any(array['public.xat_adjunts'::regclass,'public.xat_missatges'::regclass,'storage.objects'::regclass]) order by polrelid,polname")).rows,
  };
}
async function uploadMetadata(db, msg, who, bytes = 64) {
  await db.query("insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata) values('xat_adjunts',$1,$2::uuid,($2::uuid)::text,$3,$4)",
    [msg, who, 'fixture-' + msg, { size: bytes, mimetype: 'video/mp4' }]);
}

test('R32.8 · quota 250 MB, vídeo 60 s i ubicació sobre PostgreSQL real amb catàleg complet', { timeout: 240000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  try {
    const plan = creaPlaMigracions();
    await db.query(plan.bootstrap);
    const prior = plan.migrations.filter(m => m.file !== FILE);
    for (const migration of prior) {
      try { await db.query('begin'); await db.query(migration.body); await db.query('commit'); }
      catch (error) { await db.query('rollback'); throw new Error(`${migration.file}: ${error.message}`, { cause: error }); }
    }
    t.diagnostic(`Catàleg anterior complet: ${prior.length} migracions; PostgreSQL ${(await db.query('show server_version')).rows[0].server_version}.`);
    const beforeFunctions = await functionSnapshot(db), beforeSecurity = await securitySnapshot(db);
    const originalLegacy = beforeFunctions.find(f => f.signature === 'xat_publica_adjunt(uuid,text,uuid)');
    const migration = BASELINE ? null : fs.readFileSync(new URL('../supabase/migrations/' + FILE, import.meta.url), 'utf8');
    if (!BASELINE) {
      await db.query('create role r328_migrator nologin nosuperuser; grant postgres to r328_migrator; grant create on schema public to r328_migrator');
      await db.query('set role r328_migrator');
      try { await db.query(migration); await db.query(migration); } finally { await db.query('reset role'); }
    }
    await t.test('doble aplicació conserva OID, owner, ACL, RLS i el cos de la RPC històrica', async () => {
      const current = await functionSnapshot(db);
      assert.deepEqual(current.map(({ oid, signature, proowner, acl }) => ({ oid, signature, proowner, acl })),
        beforeFunctions.map(({ oid, signature, proowner, acl }) => ({ oid, signature, proowner, acl })));
      assert.deepEqual(await securitySnapshot(db), beforeSecurity);
      assert.deepEqual(current.find(f => f.signature === originalLegacy.signature), originalLegacy);
      assert.ok(current.filter(f => f.signature.startsWith('xat_')).every(f => f.proconfig?.includes('search_path=""')));
      const added = (await db.query("select p.prosecdef,p.proconfig,p.pronargdefaults,has_function_privilege('anon',p.oid,'execute') as anon,has_function_privilege('authenticated',p.oid,'execute') as authenticated from pg_proc p where p.oid=to_regprocedure('public.xat_publica_adjunt(uuid,text,uuid,jsonb)')")).rows[0];
      assert.ok(added); assert.equal(added.prosecdef, true); assert.equal(added.pronargdefaults, 0);
      assert.deepEqual(added.proconfig, ['search_path=""']); assert.equal(added.anon, false); assert.equal(added.authenticated, true);
    });
    await db.query("insert into public.towns(id,slug,name) values($1,'r328-synthetic','Poble sintètic R32.8')", [TOWN]);
    for (const who of [A, B, C, OUT]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: 'Veí sintètic', tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
      await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
    }
    await db.query("insert into public.xat_fils(id,tenant_id,tipus,titol,creat_per) values($1,$2,'grup','R32.8 sintètic',$3)", [FIL, TOWN, A]);
    await db.query('insert into public.xat_participants(fil_id,usuari_id) select $1,u from unnest($2::uuid[]) u', [FIL, [A, B, C]]);

    await t.test('quota retorna el límit nou, però bucket i sostres per fitxer continuen en 20 MB', async () => {
      const quota = (await actor(db, A, 'select public.xat_quota() as q')).rows[0].q;
      assert.equal(quota.limit, 250_000_000); assert.equal(quota.usats, 0);
      const bucket = (await db.query("select public,file_size_limit from storage.buckets where id='xat_adjunts'")).rows[0];
      assert.equal(bucket.public, false); assert.equal(Number(bucket.file_size_limit), 20_000_000);
      assert.equal(Number((await db.query("select private.xat_maxim_adjunt('video/mp4') as n")).rows[0].n), 20_000_000);
      await assert.rejects(reserve(db, A, id(201), 20_000_001), /SDP-XAT-020/);
    });
    await t.test('60.000 ms exactes passen; 60.001, nul, zero i negatiu no reserven', async () => {
      await reserve(db, A, id(202));
      for (const [index, duration] of [60_001, null, 0, -1].entries()) await assert.rejects(reserve(db, A, id(210 + index), 64, duration), denied('23514'));
      assert.equal((await db.query('select count(*)::int n from public.xat_adjunts where id=any($1::uuid[])', [[210,211,212,213].map(id)])).rows[0].n, 0);
      await uploadMetadata(db, id(202), A);
    });
    await t.test('anon, persona de fora i altre membre no poden reservar o publicar un adjunt alié', async () => {
      await assert.rejects(reserve(db, null, id(220)), denied('42501'));
      await assert.rejects(reserve(db, OUT, id(221)), denied('42501'));
      await assert.rejects(publish(db, null, id(202), { lat: 0, lng: 0 }), denied('42501'));
      await assert.rejects(publish(db, B, id(202), { lat: 0, lng: 0 }), denied('42501'));
      await assert.rejects(publish(db, OUT, id(202), { lat: 0, lng: 0 }), denied('42501'));
      await assert.rejects(actor(db, A, 'update public.xat_missatges set metadades=$1 where id=$2', [{ ubicacio: { lat: 1, lng: 2 } }, id(202)]), denied('42501'));
    });
    await t.test('ubicació estricta rebutja tipus, camps sobrants i rangs sense publicar ni consumir seq', async () => {
      const seq = (await db.query('select ultim_seq from public.xat_fils where id=$1', [FIL])).rows[0].ultim_seq;
      for (const point of [[], {}, 'secret', { lat: '0', lng: 0 }, { lat: true, lng: 0 }, { lat: null, lng: 0 },
        { lat: 90.0001, lng: 0 }, { lat: 0, lng: -180.0001 }, { lat: 'NaN', lng: 0 }, { lat: 0, lng: 'Infinity' }, { lat: 0, lng: 0, altitud: 3 }]) {
        await assert.rejects(publish(db, A, id(202), point), error => error.code === '22023' && /SDP-XAT-009/.test(error.message) && !error.message.includes('secret'));
      }
      assert.equal((await db.query('select ultim_seq from public.xat_fils where id=$1', [FIL])).rows[0].ultim_seq, seq);
      assert.equal((await db.query('select publicat from public.xat_adjunts where id=$1', [id(202)])).rows[0].publicat, false);
    });
    let acknowledged;
    await t.test('primera publicació conserva {lat,lng}; retry amb peu/GPS nous torna exactament el primer ACK', async () => {
      acknowledged = await publish(db, A, id(202), { lat: 38.64, lng: -0.49 });
      assert.deepEqual(acknowledged.metadades.ubicacio, { lat: 38.64, lng: -0.49 });
      assert.equal(acknowledged.metadades.adjunt.id, id(202));
      const again = await publish(db, A, id(202), { lat: 0, lng: 0 }, 'Peu diferent');
      assert.deepEqual(again, acknowledged);
      assert.equal((await db.query('select count(*)::int n from public.xat_missatges where id=$1', [id(202)])).rows[0].n, 1);
    });
    await t.test('la RPC antiga continua operativa i un retry nou no afig GPS a una publicació antiga', async () => {
      await reserve(db, A, id(230)); await uploadMetadata(db, id(230), A);
      const old = (await actor(db, A, 'select public.xat_publica_adjunt($1,$2,null) as result', [id(230), 'Antic'])).rows[0].result;
      assert.equal(Object.hasOwn(old.metadades, 'ubicacio'), false);
      assert.deepEqual(await publish(db, A, id(230), { lat: 90, lng: -180 }), old);
    });
    await t.test('null omet ubicació i els dos extrems geogràfics són vàlids', async () => {
      for (const [index, point] of [null, { lat: -90, lng: -180 }, { lat: 90, lng: 180 }].entries()) {
        const msg = id(240 + index); await reserve(db, A, msg); await uploadMetadata(db, msg, A);
        const result = await publish(db, A, msg, point);
        assert.equal(Object.hasOwn(result.metadades, 'ubicacio'), point !== null);
        if (point) assert.deepEqual(result.metadades.ubicacio, point);
      }
    });
    await t.test('reserva idempotent no duplica quota i rebutja un canvi de durada amb el mateix ID', async () => {
      const before = (await actor(db, A, 'select public.xat_quota() as q')).rows[0].q.usats;
      await reserve(db, A, id(202));
      assert.equal((await actor(db, A, 'select public.xat_quota() as q')).rows[0].q.usats, before);
      await assert.rejects(reserve(db, A, id(202), 64, 59_999), /SDP-XAT-008/);
    });
    await t.test('dues reserves concurrents comparteixen el pany: només una arriba a 250 MB', async () => {
      for (let i = 0; i < 12; i++) await db.query("insert into public.xat_adjunts(id,usuari_id,fil_id,bytes,mime,durada_ms,publicat,creat_al) values($1,$2,$3,20000000,'video/mp4',60000,true,now()-interval '2 hours')", [id(300 + i), C, FIL]);
      const left = await cluster.connect(), right = await cluster.connect();
      await left.query("set application_name='r328-race-left'"); await right.query("set application_name='r328-race-right'");
      await db.query('begin'); await db.query("select pg_advisory_xact_lock(hashtextextended('xat:quota:'||$1::text,0))", [C]);
      const outcomes = Promise.allSettled([reserve(left, C, id(320), 10_000_000), reserve(right, C, id(321), 10_000_000)]);
      try {
        let blocked = 0;
        for (let i = 0; i < 100 && blocked < 2; i++) {
          blocked = (await db.query("select count(*)::int n from pg_stat_activity where application_name like 'r328-race-%' and wait_event='advisory'")).rows[0].n;
          if (blocked < 2) await delay(10);
        }
        assert.equal(blocked, 2, 'Les dues sessions reals han d’esperar el mateix pany.');
      } finally { await db.query('commit'); }
      const result = await outcomes;
      assert.equal(result.filter(r => r.status === 'fulfilled').length, 1);
      assert.ok(result.some(r => r.status === 'rejected' && /SDP-XAT-020/.test(r.reason.message)));
      const q = (await actor(db, C, 'select public.xat_quota() as q')).rows[0].q;
      assert.equal(q.usats, 250_000_000); assert.equal(q.limit, 250_000_000);
    });
    await t.test('la quota encara compta bytes físics pendents de purga', async () => {
      await db.query("insert into public.xat_adjunts(id,usuari_id,fil_id,bytes,mime,durada_ms) values($1,$2,$3,10000000,'video/mp4',60000)", [id(400), B, FIL]);
      await uploadMetadata(db, id(400), B, 10_000_000);
      await db.query('delete from public.xat_adjunts where id=$1', [id(400)]);
      const quota = (await actor(db, B, 'select public.xat_quota() as q')).rows[0].q;
      assert.equal(quota.usats, 10_000_000);
      assert.equal((await db.query("select count(*)::int n from private.purga_storage_pendent where nom=$1 and feta_al is null", [id(400)])).rows[0].n, 1);
    });
    await t.test('objecte absent i descart pendent conserven els errors existents sense publicar ubicació', async () => {
      await reserve(db, A, id(410));
      await assert.rejects(publish(db, A, id(410), { lat: 0, lng: 0 }), /SDP-XAT-021/);
      await actor(db, A, 'select public.xat_prepara_descart($1)', [id(410)]);
      await assert.rejects(publish(db, A, id(410), { lat: 0, lng: 0 }), /SDP-XAT-006/);
    });
  } finally { await cluster.close(); }
});
