/* R22.0 · La migració 20261113112500 sobre PostgreSQL 18.6 real, amb tot el
   catàleg anterior en l'ordre del verificador i la deriva que el Pas 0 del T2
   va observar a producció el 13-11-2026 (sense trg_rate_limit_xat, sense
   public.admin_list_users() i sense les polítiques «sdp mitjans …», amb la
   lectura de mitjans_privats de 2609191650). Comprova que tanca la lectura
   dels adjunts privats entre veïns, que una política permissiva afegida no la
   torna a obrir, que el límit de ritme del xat torna a actuar i que tornar-la
   a aplicar no canvia res. Cap servei remot. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const MIGRATION = '20261113112500_r22_0_reconciliacio_deriva_ritme_xat_i_mitjans_privats.sql';
const id = n => `22000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), OTHER_TOWN = id(2), AUTORA = id(11), VEINA = id(12), FORASTERA = id(13);
const PRIVAT = `${TOWN}/${AUTORA}/notes/adjunt-sintetic.webp`;
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const error = code => e => e.code === code;

async function actor(db, who, sql, params = [], role = who ? 'authenticated' : 'anon') {
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
      [who ?? '', role, JSON.stringify({ sub: who, role, aal: 'aal1' })]);
    const result = await db.query(sql, params); await db.query('commit'); return result;
  } catch (e) { await db.query('rollback'); throw e; }
}
const privatsVisibles = async (db, who) => (await actor(db, who,
  "select count(*)::int as n from storage.objects where bucket_id = 'mitjans_privats'")).rows[0].n;

/* El que la migració toca: polítiques de storage.objects, el disparador del xat i les funcions. */
async function empremta(db) {
  const q = async sql => (await db.query(sql)).rows;
  return {
    politiques: await q("select policyname,permissive,cmd,roles::text,qual,with_check from pg_policies where schemaname='storage' and tablename='objects' order by 1"),
    disparadors: await q("select tgname,tgenabled,tgfoid::regprocedure::text as funcio from pg_trigger where tgrelid='public.xat_missatges'::regclass and not tgisinternal order by 1"),
    funcions: await q("select p.oid::regprocedure::text as sig,p.prosecdef,p.proconfig::text,p.prosrc,p.proacl::text as acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname,p.proname) in (('public','admin_list_users'),('private','trigger_rate_limit_xat'),('private','es_ruta_mitjans_propia'),('private','es_ruta_mitjans_publics_propia')) order by 1"),
    index: await q("select indexname,indexdef from pg_indexes where indexname='idx_xat_missatges_usuari_creat'")
  };
}

test('R22.0 · reconciliació de la deriva de producció sobre PostgreSQL 18.6 real', { timeout: 180000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as n")).rows[0].n, '180006');
    const plan = creaPlaMigracions();
    /* Mateix patró que la prova de R22.1: la base són les migracions anteriors a esta en el pla del verificador. */
    const posicio = plan.migrations.findIndex(m => m.file === MIGRATION);
    assert.ok(posicio > plan.migrations.findIndex(m => m.file.startsWith('20261113060000_')), 'el pla del verificador la posa darrere de 20261113060000');
    assert.ok(plan.migrations.slice(posicio + 1).every(m => /^\d{14}_/.test(m.file) && m.file > MIGRATION), 'darrere de tot el catàleg de deu dígits');
    await db.query(plan.bootstrap);
    for (const migration of plan.migrations.slice(0, posicio)) {
      await db.query('begin');
      try { await db.query(migration.body); await db.query('commit'); }
      catch (e) { await db.query('rollback'); throw new Error(`baseline ${migration.file}: ${e.message}`, { cause: e }); }
    }
    /* La deriva observada a producció (fets_remots_pas0.md i sonda pas0_5 del T2). */
    await db.query(`
      drop trigger trg_rate_limit_xat on public.xat_missatges;
      drop function private.trigger_rate_limit_xat();
      drop function public.admin_list_users();
      drop policy "sdp mitjans privats frontera" on storage.objects;
      drop policy "sdp mitjans privats anon" on storage.objects;
      drop policy "sdp mitjans insercio frontera" on storage.objects;
      drop policy "sdp mitjans canvi frontera" on storage.objects;
      drop policy "sdp mitjans baixa frontera" on storage.objects;
      drop policy "mitjans_privats llegir propis o tenant" on storage.objects;
      create policy "mitjans_privats llegir propis o tenant" on storage.objects for select to authenticated
        using ((bucket_id = 'mitjans_privats') and (((storage.foldername(name))[2] = ((select auth.uid()))::text)
          or (select private.is_town_member(((storage.foldername(objects.name))[1])::uuid))));`);
    /* Primitiva de plataforma: a Supabase, anon té SELECT sobre storage.objects i la RLS decidix. */
    await db.query('grant select on storage.objects to anon');
    await db.query("insert into public.towns(id,slug,name) values($1,'r22-0-deriva','Poble sintètic'),($2,'r22-0-deriva-altre','Altre poble')", [TOWN, OTHER_TOWN]);
    for (const [who, name, town] of [[AUTORA, 'Persona sintètica A', TOWN], [VEINA, 'Persona sintètica B', TOWN], [FORASTERA, 'Persona d’un altre poble', OTHER_TOWN]]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: name, tenant_id: town, accepta_rgpd: true, rgpd: true }]);
      await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
    }
    await db.query("insert into storage.objects(bucket_id,name,owner,owner_id,version) values('mitjans_privats',$1,$2::uuid,$2::text,'v1')", [PRIVAT, AUTORA]);

    await t.test('Abans: la deriva de producció deixa llegir l’adjunt privat a una veïna', async () => {
      assert.equal(await privatsVisibles(db, VEINA), 1, 'el forat que R2 tanca');
      assert.equal(await privatsVisibles(db, AUTORA), 1);
      assert.equal(await privatsVisibles(db, FORASTERA), 0);
      assert.equal(await privatsVisibles(db, null), 0);
    });

    const sql = read(`supabase/migrations/${MIGRATION}`);
    t.diagnostic(`${MIGRATION} sha256=${createHash('sha256').update(sql).digest('hex')}`);
    await db.query(sql);
    const primera = await empremta(db);
    await db.query(sql);

    await t.test('Idempotent: la segona aplicació no canvia res', async () => {
      assert.deepEqual(await empremta(db), primera);
    });

    await t.test('R2: només la persona autora llig els seus adjunts privats', async () => {
      assert.equal(await privatsVisibles(db, VEINA), 0);
      assert.equal(await privatsVisibles(db, AUTORA), 1);
      assert.equal(await privatsVisibles(db, FORASTERA), 0);
      assert.equal(await privatsVisibles(db, null), 0);
      const noms = primera.politiques.map(p => p.policyname);
      for (const nom of ['sdp mitjans privats frontera', 'sdp mitjans privats anon', 'sdp mitjans insercio frontera', 'sdp mitjans canvi frontera', 'sdp mitjans baixa frontera']) {
        assert.ok(noms.includes(nom), nom);
        assert.equal(primera.politiques.find(p => p.policyname === nom).permissive, 'RESTRICTIVE', nom);
      }
    });

    await t.test('R2: una política permissiva afegida no torna a obrir mitjans_privats ni l’escriptura de mitjans', async () => {
      await db.query("create policy \"prova obertura\" on storage.objects for select to authenticated using (bucket_id = 'mitjans_privats')");
      await db.query("create policy \"prova escriptura\" on storage.objects for insert to authenticated with check (bucket_id = 'mitjans')");
      try {
        assert.equal(await privatsVisibles(db, VEINA), 0);
        await actor(db, AUTORA, "insert into storage.objects(bucket_id,name,owner,owner_id,version) values('mitjans',$1,$2::uuid,$2::text,'v1')", [`${AUTORA}/avatar/propi.webp`, AUTORA]);
        await assert.rejects(actor(db, AUTORA, "insert into storage.objects(bucket_id,name,owner,owner_id,version) values('mitjans',$1,$2::uuid,$2::text,'v1')", [`${VEINA}/avatar/alie.webp`, AUTORA]), error('42501'));
      } finally {
        await db.query('drop policy "prova obertura" on storage.objects; drop policy "prova escriptura" on storage.objects');
      }
    });

    await t.test('R2: les escriptures legítimes del client v1.2.0 continuen (uploadToStorage, còpia pública i esborrat propi)', async () => {
      const insereix = (who, bucket, nom) => actor(db, who, "insert into storage.objects(bucket_id,name,owner,owner_id,version) values($1,$2,$3::uuid,$3::text,'v1') returning id", [bucket, nom, who]);
      const privat = `${TOWN}/${AUTORA}/notes/${id(901)}.webp`;
      assert.equal((await insereix(AUTORA, 'mitjans_privats', privat)).rows.length, 1, 'pujada privada amb la ruta de uploadToStorage');
      assert.equal((await insereix(AUTORA, 'mitjans', `${TOWN}/${AUTORA}/notes/sdp-net-v1-${'a'.repeat(64)}.webp`)).rows.length, 1, 'còpia pública de promoteToPublic');
      assert.equal((await insereix(AUTORA, 'mitjans', `${TOWN}/${AUTORA}/mur/${id(902)}.webp`)).rows.length, 1, 'pujada pública amb la ruta de uploadToStorage');
      await assert.rejects(insereix(VEINA, 'mitjans_privats', `${TOWN}/${AUTORA}/notes/${id(903)}.webp`), error('42501'), 'ningú puja a la ruta privada d’una altra persona');
      assert.equal((await actor(db, AUTORA, "delete from storage.objects where bucket_id='mitjans_privats' and name=$1 returning id", [privat])).rows.length, 1, 'esborrat propi');
    });

    await t.test('R2: qui ix del poble deixa de llegir els seus privats (efecte documentat a la capçalera)', async () => {
      await db.query('delete from public.town_memberships where town_id=$1 and user_id=$2', [TOWN, AUTORA]);
      try { assert.equal(await privatsVisibles(db, AUTORA), 0); }
      finally { await db.query("insert into public.town_memberships(town_id,user_id,role) values($1,$2,'member')", [TOWN, AUTORA]); }
      assert.equal(await privatsVisibles(db, AUTORA), 1);
    });

    await t.test('R1: el disparador torna i el missatge 16 en 5 s es rebutja amb SDP-XAT-429', async () => {
      assert.deepEqual(primera.disparadors.find(d => d.tgname === 'trg_rate_limit_xat'), { tgname: 'trg_rate_limit_xat', tgenabled: 'O', funcio: 'private.trigger_rate_limit_xat()' });
      const fil = (await actor(db, AUTORA, 'select public.crea_fil_directe($1,$2,null) as id', [TOWN, AUTORA])).rows[0].id;
      for (let n = 1; n <= 15; n++) await actor(db, AUTORA, "select * from public.xat_envia($1,$2,'text',$3,null,'{}')", [id(100 + n), fil, `Missatge sintètic ${n}`]);
      await assert.rejects(actor(db, AUTORA, "select * from public.xat_envia($1,$2,'text',$3,null,'{}')", [id(116), fil, 'Missatge sintètic 16']),
        e => e.code === '42900' && e.message.startsWith('SDP-XAT-429'));
    });

    await t.test('R3: només queda la signatura paginada d’admin_list_users', async () => {
      assert.deepEqual(primera.funcions.filter(f => f.sig.startsWith('admin_list_users')).map(f => f.sig), ['admin_list_users(integer,integer)']);
    });
  } finally {
    await cluster.close();
  }
});
