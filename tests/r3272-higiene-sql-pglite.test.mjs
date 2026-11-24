import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {creaBaseR3246, asClient, catalogueR3246} from './fixtures/r3246-catalogue-pglite.mjs';
import {SA, STOWN, sid, sembraStorageR3246} from './fixtures/r3246-storage-casos.mjs';
import {sembraEnumeracioProfilesR3272} from './fixtures/r3272-produccio-parcial.mjs';
import {cosMigracio} from '../tooling/node0/hidrata-postgres-node0.mjs';

const sql = fs.readFileSync(new URL('../supabase/migrations/20261124033000_r3272_profiles_sense_enumeracio_i_execute_minim.sql', import.meta.url), 'utf8');
const signatures = ['private.comprova_una_propietaria()', 'private.is_town_member(uuid)',
  'private.trigger_rate_limit_xat()', 'public.touch_updated_at()'];
const functionState = async pg => (await pg.query(`SELECT oid,oid::regprocedure::text AS signature,prosrc,proconfig,
 proowner,prorettype,provolatile,prosecdef,proacl::text AS acl FROM pg_proc
 WHERE oid=ANY($1::regprocedure[]) ORDER BY oid`, [signatures])).rows;
const withoutAcl = rows => rows.map(({acl, ...rest}) => { void acl; return rest; });
const call = (pg, role, sql, args = [], uid = null) => asClient(pg, {role, uid}, sql, args);
const drift = error => error.code === '55000';

test('C12 hygiene134: isolated observed Storage policy and minimal function privileges', {timeout: 180000}, async t => {
  const pg = await creaBaseR3246({throughVersion: '20261123233000'});
  try {
    await sembraStorageR3246(pg);
    await sembraEnumeracioProfilesR3272(pg);
    const before = await functionState(pg), catalogue = await catalogueR3246(pg);
    const objects = (await pg.query('SELECT * FROM storage.objects ORDER BY id')).rows;
    const policies = (await pg.query("SELECT * FROM pg_policies WHERE schemaname='storage' ORDER BY policyname")).rows;
    const bucket = (await pg.query("SELECT * FROM storage.buckets WHERE id='profiles'")).rows;
    const publicId = sid(710), privateId = sid(711);
    for (const [id, section, visibility] of [[publicId, 'mur', 'public'], [privateId, 'notes', 'private']]) {
      await pg.query(`INSERT INTO public.section_submissions(id,tenant_id,owner_user_id,section_id,title,payload,visibility)
        VALUES($1,$2,$3,$4,$5,$6,$7)`, [id, STOWN, SA, section, 'C12 oracle ' + section,
        {title: 'C12 oracle ' + section, content: 'Synthetic', status: 'published', visibility}, visibility]);
    }
    const sectionPolicies = (await pg.query("SELECT * FROM pg_policies WHERE schemaname='public' AND tablename='section_submissions' ORDER BY policyname")).rows;
    const publicRead = async () => call(pg, 'anon', 'SELECT item AS item FROM public.llig_mur_public_v7(true,$1) AS item', [STOWN]);
    const directRead = () => call(pg, 'anon', 'SELECT id,title FROM public.section_submissions WHERE id=ANY($1::uuid[])', [[publicId, privateId]]);
    await t.test('baseline canary exposes one synthetic profiles name and actual PUBLIC/anon execute', async () => {
      assert.equal((await call(pg, 'anon', "SELECT name FROM storage.objects WHERE bucket_id='profiles'")).length, 1);
      assert.equal((await pg.query("SELECT has_function_privilege('anon','private.is_town_member(uuid)','EXECUTE') AS allowed")).rows[0].allowed, true);
      assert.equal((await pg.query("SELECT has_function_privilege('anon','public.touch_updated_at()','EXECUTE') AS allowed")).rows[0].allowed, true);
    });
    await t.test('current catalogue already denies anonymous raw table access; real public RPC returns only public row', async () => {
      assert.equal(sectionPolicies.some(p => p.policyname === 'public read section_submissions'), false);
      assert.ok(sectionPolicies.some(p => p.policyname === 'r21_v2 anon sense cru' && p.qual === 'false'));
      await assert.rejects(directRead(), error => error.code === '42501' && /table section_submissions/.test(error.message));
      const rows = await publicRead();
      assert.ok(rows.some(row => row.item.id === publicId && row.item.title === 'C12 oracle mur'));
      assert.equal(rows.some(row => row.item.id === privateId), false);
    });
    await t.test('unknown function bodies refuse before any policy or ACL mutation', async () => {
      for (const signature of signatures) {
        await assert.rejects(pg.transaction(async tx => {
          await tx.query("UPDATE pg_proc SET prosrc=prosrc||E'\\n-- unverified body' WHERE oid=to_regprocedure($1)", [signature]);
          await tx.exec(cosMigracio(sql));
        }), error => drift(error) && error.message === 'r3272_hygiene_function_drift');
        assert.deepEqual(await functionState(pg), before);
        assert.equal((await pg.query("SELECT count(*)::int AS n FROM pg_policy WHERE polname='r3272 profiles sense llista anon'")).rows[0].n, 0);
      }
    });
    await t.test('missing required authenticated helper grant refuses without restoring privileges', async () => {
      await assert.rejects(pg.transaction(async tx => {
        await tx.exec('REVOKE EXECUTE ON FUNCTION private.is_town_member(uuid) FROM PUBLIC,authenticated');
        await tx.exec(cosMigracio(sql));
      }), error => drift(error) && error.message === 'r3272_required_rls_execute_missing');
      assert.deepEqual(await functionState(pg), before);
    });
    await t.test('policy name collision and disabled RLS refuse atomically', async () => {
      for (const mutation of [
        'CREATE POLICY "r3272 profiles sense llista anon" ON storage.objects FOR SELECT TO anon USING(true)',
        'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY',
      ]) await assert.rejects(pg.transaction(async tx => { await tx.exec(mutation); await tx.exec(cosMigracio(sql)); }), drift);
      assert.deepEqual(await functionState(pg), before);
    });
    await t.test('varchar bucket_id refuses before creating a policy or changing any function ACL', async () => {
      await assert.rejects(pg.transaction(async tx => {
        await tx.exec('ALTER TABLE storage.objects RENAME TO r3272_objects_original; CREATE TABLE storage.objects(id uuid,bucket_id varchar,name text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY');
        await tx.exec(cosMigracio(sql));
      }), error => drift(error) && error.message === 'r3272_storage_bucket_shape');
      assert.deepEqual(await functionState(pg), before);
      assert.equal((await pg.query("SELECT atttypid::regtype::text AS type FROM pg_attribute WHERE attrelid='storage.objects'::regclass AND attname='bucket_id'")).rows[0].type, 'text');
      assert.equal((await pg.query("SELECT count(*)::int AS n FROM pg_policy WHERE polname='r3272 profiles sense llista anon'")).rows[0].n, 0);
    });
    await t.test('inherited anonymous EXECUTE is not silently treated as removed', async () => {
      await assert.rejects(pg.transaction(async tx => {
        await tx.exec('CREATE ROLE r3272_unexpected; GRANT r3272_unexpected TO anon; GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO r3272_unexpected');
        await tx.exec(cosMigracio(sql));
      }), error => drift(error) && error.message === 'r3272_execute_postcondition_failed');
      assert.deepEqual(await functionState(pg), before);
      assert.equal((await pg.query("SELECT count(*)::int AS n FROM pg_policy WHERE polname='r3272 profiles sense llista anon'")).rows[0].n, 0);
    });
    await pg.exec(sql);
    await t.test('anonymous public RPC and raw-table denial remain exact after helper revoke, without a fake policy', async () => {
      await assert.rejects(directRead(), error => error.code === '42501' && /table section_submissions/.test(error.message));
      const rows = await publicRead();
      assert.ok(rows.some(row => row.item.id === publicId && row.item.title === 'C12 oracle mur'));
      assert.equal(rows.some(row => row.item.id === privateId), false);
      assert.deepEqual((await pg.query("SELECT * FROM pg_policies WHERE schemaname='public' AND tablename='section_submissions' ORDER BY policyname")).rows, sectionPolicies);
    });
    await t.test('restrictive anonymous guard survives permissive policy and preserves unrelated reads', async () => {
      assert.equal((await call(pg, 'anon', "SELECT name FROM storage.objects WHERE bucket_id='profiles'")).length, 0);
      assert.equal((await call(pg, 'anon', "SELECT name FROM storage.objects WHERE bucket_id='r3272_control'")).length, 1);
      assert.equal((await call(pg, 'authenticated', "SELECT name FROM storage.objects WHERE bucket_id='profiles'", [], SA)).length, 1);
      await pg.exec('CREATE POLICY r3272_extra_permissive ON storage.objects FOR SELECT TO anon USING(true)');
      try {
        assert.equal((await call(pg, 'anon', "SELECT name FROM storage.objects WHERE bucket_id='profiles'")).length, 0);
        assert.equal((await call(pg, 'anon', "SELECT name FROM storage.objects WHERE bucket_id='r3272_control'")).length, 1);
      } finally { await pg.exec('DROP POLICY r3272_extra_permissive ON storage.objects'); }
      assert.deepEqual((await pg.query("SELECT * FROM storage.buckets WHERE id='profiles'")).rows, bucket);
      assert.deepEqual((await pg.query('SELECT * FROM storage.objects ORDER BY id')).rows, objects);
    });
    await t.test('PUBLIC and anon removed only from four targets; real authenticated RLS helper still executes', async () => {
      for (const signature of signatures) {
        assert.equal((await pg.query("SELECT has_function_privilege('anon',to_regprocedure($1),'EXECUTE') AS allowed", [signature])).rows[0].allowed, false);
        assert.equal((await pg.query("SELECT count(*)::int AS n FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE p.oid=to_regprocedure($1) AND a.grantee=0 AND a.privilege_type='EXECUTE'", [signature])).rows[0].n, 0);
      }
      assert.equal((await call(pg, 'authenticated', 'SELECT private.is_town_member($1) AS member', [STOWN], SA))[0].member, true);
      await assert.rejects(call(pg, 'authenticated', 'SELECT public.touch_updated_at()', [], SA), error => error.code === '42501');
      assert.deepEqual(withoutAcl(await functionState(pg)), withoutAcl(before));
      const after = await catalogueR3246(pg);
      const targetKeys = new Set(['private.comprova_una_propietaria()', 'private.is_town_member(p_tenant_id uuid)',
        'private.trigger_rate_limit_xat()', 'public.touch_updated_at()']);
      const isTarget = f => targetKeys.has(`${f.schema}.${f.name}(${f.arguments})`);
      assert.equal(catalogue.functions.filter(isTarget).length, 4);
      assert.deepEqual(after.functions.filter(f => !isTarget(f)), catalogue.functions.filter(f => !isTarget(f)));
    });
    await t.test('ordinary authenticated profile update invokes the trigger without direct EXECUTE', async () => {
      const rows = await call(pg, 'authenticated', "UPDATE public.profiles SET full_name='C12 synthetic update' WHERE id=$1 RETURNING full_name,updated_at", [SA], SA);
      assert.equal(rows.length, 1); assert.equal(rows[0].full_name, 'C12 synthetic update');
      assert.ok(rows[0].updated_at);
    });
    await t.test('rerun preserves exact policy, bodies, ACLs and R32.44 receipt', async () => {
      const state = await catalogueR3246(pg), functions = await functionState(pg);
      await pg.exec(sql);
      assert.deepEqual(await catalogueR3246(pg), state);
      assert.deepEqual(await functionState(pg), functions);
      assert.equal((await pg.query('SELECT snapshot=private.r3244_edicio_snapshot() AS matches FROM private.r3244_edicio_contract WHERE id=1')).rows[0].matches, true);
      const after = (await pg.query("SELECT * FROM pg_policies WHERE schemaname='storage' AND policyname<>'r3272 profiles sense llista anon' ORDER BY policyname")).rows;
      assert.deepEqual(after, policies);
    });
  } finally { await pg.close(); }
});
