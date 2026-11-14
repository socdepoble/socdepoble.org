/* R22.5 · La migració 20261114000400 (buckets) sobre PostgreSQL 18.6 real, amb
   tot el catàleg anterior en l'ordre del verificador i els residus literals de
   producció de Storage del 13-11-2026: els buckets heretats chat_attachments,
   images i profiles, públics (q29), mitjans sense límits (q29) i les 12
   polítiques fetes a mà al Dashboard (q14). El bootstrap local porta un
   esborrany mínim de storage (buckets, objects, foldername, operation); la
   prova no simula el servei de Storage ni els seus fitxers. L'aplica dues
   vegades seguides amb un rol sense superusuari. Cap servei remot. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const MIGRATION = '20261114000400_r22_5_buckets_mitjans_i_heretats.sql';
const id = n => `22500000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), A = id(11), B = id(12);
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const error = (code, prefix) => e => e.code === code && (!prefix || e.message.startsWith(prefix));

/* Residus literals de producció (q29 i q14, 13-11-2026). */
const STORAGE_PRODUCCIO = `
  insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
    ('chat_attachments','chat_attachments',true,null,array['image/*','video/*','application/pdf']),
    ('images','images',true,null,null),
    ('profiles','profiles',true,null,null)
  on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
  update storage.buckets set public = true, file_size_limit = null, allowed_mime_types = null where id = 'mitjans';
  create policy "Només l'amo de la foto pot esborrar-la o editar-la 1ffg0oo_0" on storage.objects for update to authenticated using (((bucket_id = 'images'::text) AND (auth.uid() = owner)));
  create policy "Només l'amo de la foto pot esborrar-la o editar-la 1ffg0oo_1" on storage.objects for select to authenticated using (((bucket_id = 'images'::text) AND (auth.uid() = owner)));
  create policy "Només l'amo de la foto pot esborrar-la o editar-la 1ffg0oo_2" on storage.objects for delete to authenticated using (((bucket_id = 'images'::text) AND (auth.uid() = owner)));
  create policy "Només l'amo de la foto pot esborrar-la o editar-la 1ffg0oo_3" on storage.objects for insert to authenticated with check (((bucket_id = 'images'::text) AND (auth.uid() = owner)));
  create policy "Permetre pujada d'imatges només a registrats 1ffg0oo_0" on storage.objects for insert to authenticated with check ((bucket_id = 'images'::text));
  create policy "Permetre pujada només a usuaris registrats 1ffg0oo_0" on storage.objects for insert to authenticated with check ((bucket_id = 'images'::text));
  create policy "Permetre pujada només a usuaris registrats 5i2qmh_0" on storage.objects for insert to authenticated with check ((bucket_id = 'chat_attachments'::text));
  create policy "Public Access" on storage.objects for select to public using ((bucket_id = 'profiles'::text));
  create policy "Public read access" on storage.objects for select to public using ((bucket_id = 'images'::text));
  create policy "Users can update their own profile images" on storage.objects for update to authenticated using (((bucket_id = 'profiles'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
  create policy "Users can upload their own profile images" on storage.objects for insert to authenticated with check (((bucket_id = 'profiles'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
  create policy "Users can view chat attachments" on storage.objects for select to public using (((bucket_id = 'chat_attachments'::text) AND (auth.role() = 'authenticated'::text)));`;

async function actor(db, who, sql, params = []) {
  const role = who ? 'authenticated' : 'anon';
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
      [who ?? '', role, JSON.stringify({ sub: who, role, aal: 'aal1' })]);
    const result = await db.query(sql, params); await db.query('commit'); return result;
  } catch (e) { await db.query('rollback'); throw e; }
}
const visibles = async (db, who, bucket) => (await actor(db, who, 'select count(*)::int as n from storage.objects where bucket_id = $1', [bucket])).rows[0].n;
const objecte = (bucket, nom, owner, metadata = null) => db => db.query("insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata) values($1,$2,$3::uuid,$3::text,'v1',$4)", [bucket, nom, owner, metadata]);

async function empremta(db) {
  const q = async sql => (await db.query(sql)).rows;
  return {
    buckets: await q('select id, public, file_size_limit, allowed_mime_types from storage.buckets order by 1'),
    politiques: await q("select policyname, permissive, cmd, roles::text, qual, with_check from pg_policies where schemaname='storage' and tablename='objects' order by 1"),
    disparadors: await q("select tgname, tgenabled, tgtype, pg_get_triggerdef(oid) as def from pg_trigger where tgrelid='storage.objects'::regclass and not tgisinternal order by 1"),
    funcio: await q("select md5(prosrc) as md5, prosecdef, proconfig::text as cfg from pg_proc where oid = 'private.mitjans_public_nomes_imatges()'::regprocedure")
  };
}

test('R22.5 · buckets de mitjans i heretats sobre PostgreSQL 18.6 real', { timeout: 300000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as n")).rows[0].n, '180006');
    const plan = creaPlaMigracions();
    const posicio = plan.migrations.findIndex(m => m.file === MIGRATION);
    assert.ok(posicio > plan.migrations.findIndex(m => m.file.startsWith('20261114000300_')), 'darrere de R22.4');
    await db.query(plan.bootstrap);
    for (const migration of plan.migrations.slice(0, posicio)) {
      await db.query('begin');
      try { await db.query(migration.body); await db.query('commit'); }
      catch (e) { await db.query('rollback'); throw new Error(`baseline ${migration.file}: ${e.message}`, { cause: e }); }
    }
    await db.query(STORAGE_PRODUCCIO);
    /* Primitiva de plataforma: a Supabase, anon té SELECT sobre storage.objects i la RLS decidix. */
    await db.query('grant select on storage.objects to anon');
    await db.query("insert into public.towns(id,slug,name) values($1,'r22-5-buckets','Poble sintètic')", [TOWN]);
    for (const who of [A, B]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: 'Persona sintètica', tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
    }
    await objecte('profiles', `${A}/foto-heretada.jpg`, A, { mimetype: 'image/jpeg', size: 400000 })(db);
    await objecte('chat_attachments', `${A}/adjunt-heretat.jpg`, A, { mimetype: 'image/jpeg', size: 400000 })(db);
    await objecte('mitjans', `${TOWN}/${A}/mur/conforme.webp`, A, { mimetype: 'image/webp', size: 90000 })(db);

    await t.test('Abans: els heretats es llegixen sense sessió i mitjans no té límits', async () => {
      assert.equal(await visibles(db, null, 'profiles'), 1);
      assert.equal(await visibles(db, B, 'chat_attachments'), 1);
      await actor(db, B, "insert into storage.objects(bucket_id,name,owner,owner_id,version) values('images',$1,$2::uuid,$2::text,'v1')", [`${B}/nova.png`, B]);
      await db.query("delete from storage.objects where bucket_id='images'");
    });

    await t.test('Precondicions: sense un bucket viu (SDP-BUCKETS-001) o amb un objecte no conforme a mitjans (SDP-BUCKETS-005), avorta neta', async () => {
      const sql = read(`supabase/migrations/${MIGRATION}`);
      for (const [preparacio, codi] of [
        ["delete from storage.buckets where id = 'xat_adjunts'", 'SDP-BUCKETS-001'],
        [`insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata) values('mitjans','${TOWN}/${A}/capcalera.mp4','${A}'::uuid,'${A}','v1','{"mimetype":"video/mp4","size":3000000}')`, 'SDP-BUCKETS-005']]) {
        await db.query('begin');
        try {
          await db.query(preparacio);
          await assert.rejects(db.query(sql), e => e.message.startsWith(codi), codi);
        } finally { await db.query('rollback'); }
      }
      assert.equal((await db.query("select public from storage.buckets where id='profiles'")).rows[0].public, true, 'res a mitges');
    });

    await db.query('create role sdp_editor_sql nosuperuser inherit; grant postgres to sdp_editor_sql');
    const sql = read(`supabase/migrations/${MIGRATION}`);
    t.diagnostic(`${MIGRATION} sha256=${createHash('sha256').update(sql).digest('hex')}`);
    const aplica = async () => {
      await db.query('set role sdp_editor_sql');
      try { await db.query(sql); } finally { await db.query('reset role'); }
    };
    await aplica();
    const primera = await empremta(db);
    await aplica();
    await t.test('Idempotent: la segona aplicació, sense superusuari, no canvia res', async () => {
      assert.deepEqual(await empremta(db), primera);
    });
    await db.query('reassign owned by sdp_editor_sql to postgres');

    await t.test('Buckets: mitjans amb límits; cap altre públic; cap objecte esborrat', async () => {
      const buckets = Object.fromEntries(primera.buckets.map(b => [b.id, b]));
      assert.deepEqual(buckets.mitjans, { id: 'mitjans', public: true, file_size_limit: '5242880', allowed_mime_types: ['image/webp', 'image/jpeg', 'image/png', 'image/avif'] });
      for (const id of ['chat_attachments', 'images', 'profiles', 'mitjans_privats', 'xat_adjunts']) assert.equal(buckets[id].public, false, id);
      assert.equal((await db.query('select count(*)::int as n from storage.objects')).rows[0].n, 3);
      assert.equal(primera.politiques.filter(p => /'(chat_attachments|images|profiles)'/.test(`${p.qual} ${p.with_check}`)).length, 0);
    });

    await t.test('Frontera: els heretats ja no es llegixen ni s’hi escriu, encara que algú hi afija una política permissiva', async () => {
      assert.equal(await visibles(db, null, 'profiles'), 0);
      assert.equal(await visibles(db, B, 'chat_attachments'), 0);
      assert.equal(await visibles(db, A, 'profiles'), 0, 'ni la propietària');
      await db.query("create policy \"prova obertura\" on storage.objects for all to public using (true) with check (true)");
      try {
        assert.equal(await visibles(db, null, 'profiles'), 0);
        await assert.rejects(actor(db, B, "insert into storage.objects(bucket_id,name,owner,owner_id,version) values('images',$1,$2::uuid,$2::text,'v1')", [`${B}/altra.png`, B]), error('42501'));
      } finally { await db.query('drop policy "prova obertura" on storage.objects'); }
      assert.equal((await db.query("select count(*)::int as n from storage.objects where bucket_id='profiles'")).rows[0].n, 1, 'el servidor (sense RLS) els veu per a baixar-los');
    });

    await t.test('Fluxos del client: pujada pública i privada, lectura i esborrat propis', async () => {
      const insereix = (who, bucket, nom, metadata = null) => actor(db, who, "insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata) values($1,$2,$3::uuid,$3::text,'v1',$4) returning id", [bucket, nom, who, metadata]);
      assert.equal((await insereix(A, 'mitjans', `${TOWN}/${A}/mur/${id(901)}.webp`)).rows.length, 1, 'uploadToStorage (sense metadades a la inserció)');
      assert.equal((await insereix(A, 'mitjans', `${TOWN}/${A}/notes/sdp-net-v1-${'a'.repeat(64)}.webp`, { mimetype: 'image/webp', size: 120000 })).rows.length, 1, 'còpia pública');
      assert.equal((await insereix(A, 'mitjans_privats', `${TOWN}/${A}/notes/${id(902)}.pdf`, { mimetype: 'application/pdf', size: 900000 })).rows.length, 1, 'privat');
      assert.equal(await visibles(db, A, 'mitjans'), 3, 'la llista pròpia');
      assert.equal(await visibles(db, B, 'mitjans'), 0, 'mai la d’una altra persona (com hui amb r21_v2)');
      assert.equal(await visibles(db, null, 'mitjans'), 0);
      assert.equal((await actor(db, A, "delete from storage.objects where bucket_id='mitjans' and name=$1 returning id", [`${TOWN}/${A}/mur/${id(901)}.webp`])).rows.length, 1);
    });

    await t.test('Invariant de mitjans: només imatges de 5 MiB, també per move o copy (SDP-MITJANS-001 i 002)', async () => {
      const insereix = (metadata, nom) => db.query("insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata) values('mitjans',$1,$2::uuid,$2::text,'v1',$3)", [nom, A, metadata]);
      await assert.rejects(insereix({ mimetype: 'video/mp4', size: 3000000 }, `${TOWN}/${A}/mur/v.mp4`), error('22023', 'SDP-MITJANS-001'));
      await assert.rejects(insereix({ mimetype: 'image/png', size: 6 * 1024 * 1024 }, `${TOWN}/${A}/mur/gran.png`), error('22023', 'SDP-MITJANS-002'));
      await assert.rejects(insereix({ size: 1000 }, `${TOWN}/${A}/mur/sense-tipus`), error('22023', 'SDP-MITJANS-001'));
      await assert.rejects(db.query("update storage.objects set bucket_id='mitjans' where bucket_id='mitjans_privats' and name=$1", [`${TOWN}/${A}/notes/${id(902)}.pdf`]), error('22023', 'SDP-MITJANS-001'), 'move');
      assert.equal((await db.query("select has_function_privilege('authenticated','private.mitjans_public_nomes_imatges()','EXECUTE') as x")).rows[0].x, false, 'el disparador no necessita EXECUTE de qui puja');
    });
  } finally {
    await cluster.close();
  }
});
