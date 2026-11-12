import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { creaGestor } from '../supabase/functions/purga-fitxers/gestor.js';

const modulePath = process.env.SDP_PGLITE_MODULE;
const MIGRACIO = '2611110100';
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const ANTIC = '44444444-4444-4444-8444-444444444444';
const POBLE = '55555555-5555-4555-8555-555555555555';
const SQL = readFileSync(new URL('../supabase/migrations/2611110100_cua_purga_storage_ugc.sql', import.meta.url), 'utf8');

test('la purga de baixa no executa esborrats de metadades ni concedeix accés a la cua', () => {
  assert.doesNotMatch(SQL, /\bdelete\s+from\s+storage\.objects\b/i);
  assert.doesNotMatch(SQL, /\bgrant\b[^;]*on (?:table )?public\.cua_purga_storage_ugc\b/i);
  assert.match(SQL, /create trigger encua_storage_ugc_en_baixa before delete on auth\.users/i);
});

test('la migració falla tancada sense privilegi de bloqueig d’Auth i no amplia el search_path', () => {
  assert.match(SQL, /has_table_privilege\('auth\.users', 'UPDATE'\)[\s\S]*SDP-PURGA-010/);
  assert.match(SQL, /exception when lock_not_available then\s+raise exception 'SDP-PURGA-005/);
  assert.doesNotMatch(SQL, /set search_path = public, pg_temp/);
});

test('P0-20 · contracte real de baixa i cua a PostgreSQL WASM', { skip: !modulePath && 'SDP_PGLITE_MODULE requerix una instal·lació local' }, async (t) => {
  const url = modulePath.startsWith('file:') ? new URL(modulePath) : pathToFileURL(path.resolve(modulePath));
  const { PGlite } = await import(url.href);
  const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', url));
  const db = new PGlite({ extensions: { pgcrypto } });
  const { bootstrap, migrations } = creaPlaMigracions();

  async function com(rol, sql, params = [], usuari = '', jwtRole = rol) {
    await db.exec('BEGIN');
    try {
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
        [usuari, jwtRole, JSON.stringify({ sub: usuari, role: jwtRole })]);
      if (rol === 'anon') await db.exec('SET LOCAL ROLE anon');
      if (rol === 'authenticated') await db.exec('SET LOCAL ROLE authenticated');
      if (rol === 'service_role') await db.exec('SET LOCAL ROLE service_role');
      const { rows } = await db.query(sql, params);
      await db.exec('COMMIT');
      return rows;
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
  }

  const worker = (sql, params) => com('service_role', sql, params);
  const un = async (sql, params) => (await db.query(sql, params)).rows[0];
  const auth = async (uid) => {
    await db.query('INSERT INTO auth.users(id, email) VALUES ($1,$2)', [uid, `${uid}@example.invalid`]);
  };
  const objecte = async (bucket, nom, ownerId, owner = null, versio = 'versio-1') => {
    await db.query('INSERT INTO storage.objects (bucket_id, name, owner_id, owner, version) VALUES ($1,$2,$3,$4,$5)',
      [bucket, nom, ownerId, owner, versio]);
  };
  const baixa = (uid, quan) => db.query('INSERT INTO private.baixes (user_id, purga_prevista_al) VALUES ($1,$2)', [uid, quan]);
  const purga = async () => (await un('SELECT private.purga_baixes_vencudes(10) AS fetes')).fetes;
  const reclama = () => worker('SELECT * FROM public.purga_fitxers_reclama(50)');
  const confirma = async (ids) => (await worker('SELECT public.purga_fitxers_fets($1) AS fetes', [ids]))[0].fetes;
  const publicacio = (key, payload) => db.query('INSERT INTO public.app_content (tenant_id, key, payload) VALUES ($1,$2,$3::jsonb)', [POBLE, key, JSON.stringify(payload)]);
  const apiStorage = (bucket, nom) => db.query('DELETE FROM storage.objects WHERE bucket_id=$1 AND name=$2', [bucket, nom]);

  try {
    await t.test('aplica el catàleg real i revalida les files de la cua antiga', async () => {
      await db.exec(bootstrap);
      for (const migration of migrations) {
        if (migration.version === MIGRACIO) {
          await db.query("INSERT INTO public.towns(id, slug, name) VALUES ($1,'prova-r17-2b','Poble sintètic')", [POBLE]);
          await auth(A); await auth(B); await auth(C);
          await objecte('mitjans', 'antic-corroborat.webp', ANTIC);
          await objecte('mitjans', 'altre-propietari.webp', B);
          await db.query(`INSERT INTO private.purga_storage_pendent(user_id,bucket_id,nom)
            VALUES ($1,'mitjans','antic-corroborat.webp'), ($1,'mitjans','altre-propietari.webp')`, [ANTIC]);
        }
        await db.exec(migration.sql);
      }
      await db.exec(SQL);
      const traslladats = (await db.query('SELECT nom FROM public.cua_purga_storage_ugc')).rows;
      assert.deepEqual(traslladats, [{ nom: 'antic-corroborat.webp' }]);
      assert.equal((await un("SELECT count(*)::int AS total FROM private.purga_storage_pendent WHERE nom='altre-propietari.webp'")).total, 1);
    });

    await t.test('els rols de client no poden llegir, escriure ni cridar el worker', async () => {
      const denegat = (error) => error.code === '42501';
      assert.equal((await un("SELECT relrowsecurity AS activa FROM pg_class WHERE oid='public.cua_purga_storage_ugc'::regclass")).activa, true);
      for (const rol of ['anon', 'authenticated', 'service_role']) {
        await assert.rejects(com(rol, 'SELECT * FROM public.cua_purga_storage_ugc'), denegat);
        await assert.rejects(com(rol, 'DELETE FROM public.cua_purga_storage_ugc'), denegat);
      }
      for (const rol of ['anon', 'authenticated']) {
        await assert.rejects(com(rol, 'SELECT * FROM public.purga_fitxers_reclama(50)'), denegat);
        await assert.rejects(com(rol, 'SELECT public.purga_fitxers_fets(ARRAY[1]::bigint[])'), denegat);
        await assert.rejects(com(rol, "SELECT public.purga_fitxers_fallits(ARRAY[1]::bigint[], 'test')"), denegat);
      }
      await assert.rejects(com('service_role', 'SELECT * FROM public.purga_fitxers_reclama(50)', [], '', 'authenticated'), denegat);
    });

    await t.test('la baixa vencida compromet la cua i espera el worker abans d’esborrar Auth, també amb FK legacy', async () => {
      await db.exec('ALTER TABLE storage.objects ADD CONSTRAINT prova_owner_fk FOREIGN KEY (owner) REFERENCES auth.users(id)');
      await objecte('mitjans', 'fora-de-carpeta.webp', A, A);
      await objecte('mitjans_privats', 'privat-original.webp', null, A);
      // Objecte de Xat històric sense reserva. La prova del Xat certifica
      // la seua pujada ordinària i la migració ha de poder netejar l'orfe.
      await db.exec('ALTER TABLE storage.objects DISABLE TRIGGER xat_escriptura_final');
      await objecte('xat_adjunts', '66666666-6666-4666-8666-666666666666', A, A);
      await db.exec('ALTER TABLE storage.objects ENABLE TRIGGER xat_escriptura_final');
      await objecte('mitjans', 'publicacio-compartida.webp', A);
      await objecte('mitjans', `persones/${A}/alien.webp`, B, B);
      await objecte('mitjans', `persones/${A}/servei.webp`, null);
      await publicacio('feedPosts', [{ imatge: 'sdp-media://mitjans/publicacio-compartida.webp' }]);
      await baixa(A, '2000-01-01');
      await baixa(C, '2999-01-01');
      assert.equal(await purga(), 0);
      assert.equal((await un('SELECT count(*)::int AS total FROM auth.users WHERE id=$1', [A])).total, 1);
      assert.equal((await un('SELECT count(*)::int AS total FROM storage.objects WHERE owner_id=$1::text OR owner=$1::uuid', [A])).total, 4);
      assert.deepEqual((await db.query('SELECT nom, referenciat FROM public.cua_purga_storage_ugc WHERE user_id=$1 ORDER BY nom', [A])).rows,
        [{ nom: '66666666-6666-4666-8666-666666666666', referenciat: false },
          { nom: 'fora-de-carpeta.webp', referenciat: false },
          { nom: 'privat-original.webp', referenciat: false },
          { nom: 'publicacio-compartida.webp', referenciat: true }]);
      const [estat] = await com('authenticated', 'SELECT public.estat_baixa() AS estat', [], A);
      assert.ok(estat.estat.purga_iniciada_al);
      await assert.rejects(com('authenticated', 'SELECT public.cancela_baixa()', [], A), (e) => e.code === '55000');
      assert.equal((await com('authenticated', 'SELECT public.cancela_baixa() AS estat', [], C))[0].estat.cancelada, true);

      const lot = await reclama();
      assert.equal(lot.length, 4);
      assert.equal(lot.some((r) => r.nom === 'altre-propietari.webp'), false);
      assert.deepEqual(await reclama(), []);
      const ids = lot.map((r) => r.id);
      assert.equal(await confirma(ids), 0, 'el worker no confirma un objecte que encara té metadada');
      assert.equal((await worker("SELECT public.purga_fitxers_fallits($1, 'storage 503') AS fallits", [ids]))[0].fallits, 4);
      await assert.rejects(db.query("UPDATE storage.objects SET version='versio-nova' WHERE name='fora-de-carpeta.webp'"),
        (e) => e.code === '55000');
      await assert.rejects(objecte('mitjans', 'pujada-tardana.webp', A, A), (e) => e.code === '55000');

      // La fixture fa el canvi de metadades que faria una resposta real de l'API de Storage.
      for (const row of lot) await apiStorage(row.bucket_id, row.nom);
      assert.equal(await purga(), 0, 'l’absència de metadades encara requerix la confirmació del worker');
      assert.equal((await un('SELECT count(*)::int AS total FROM auth.users WHERE id=$1', [A])).total, 1);
      assert.equal(await confirma(ids), 4);
      assert.equal(await confirma(ids), 0);
      assert.equal(await purga(), 1);
      assert.equal((await un('SELECT count(*)::int AS total FROM auth.users WHERE id=$1', [A])).total, 0);
      assert.equal((await un("SELECT count(*)::int AS total FROM storage.objects WHERE name IN ('publicacio-compartida.webp','altre-propietari.webp')")).total, 2);
    });

    await t.test('una referència sobrevinguda després de reclamar es conserva i la baixa pot convergir', async () => {
      await objecte('mitjans', 'referencia-tardana.webp', C);
      await baixa(C, '2000-01-01');
      assert.equal(await purga(), 0);
      const [job] = await reclama();
      assert.equal(job.nom, 'referencia-tardana.webp');
      await publicacio('marketItems', [{ imatge: 'sdp-media://mitjans/referencia-tardana.webp' }]);
      await assert.rejects(apiStorage(job.bucket_id, job.nom), (e) => e.code === '55000');
      assert.equal(await confirma([job.id]), 0);
      await db.query("UPDATE public.cua_purga_storage_ugc SET ultim_intent_al=now()-interval '11 minutes' WHERE id=$1", [job.id]);
      assert.deepEqual(await reclama(), []);
      assert.equal(await purga(), 1);
      // La fila referenciada no conserva l'UUID ni la ruta del compte suprimit.
      assert.equal((await un('SELECT count(*)::int AS total FROM public.cua_purga_storage_ugc WHERE id=$1', [job.id])).total, 0);
      assert.equal((await un("SELECT count(*)::int AS total FROM storage.objects WHERE name='referencia-tardana.webp'")).total, 1);
    });

    await t.test('una FK legacy amb SET NULL conserva la ruta referenciada i permet esborrar Auth', async () => {
      const uid = '77777777-7777-4777-8777-777777777777';
      await auth(uid);
      await db.exec(`ALTER TABLE storage.objects DROP CONSTRAINT prova_owner_fk;
        ALTER TABLE storage.objects ADD CONSTRAINT prova_owner_fk FOREIGN KEY (owner) REFERENCES auth.users(id) ON DELETE SET NULL`);
      await objecte('mitjans', 'referenciat-fk.webp', uid, uid);
      await db.query(`INSERT INTO public.organizations (tenant_id, slug, name, kind, logo_url, created_by)
        VALUES ($1,'entitat-prova-r17','Entitat de prova','entity',$2,$3)`,
      [POBLE, 'https://storage.example.invalid/storage/v1/object/public/mitjans/referenciat-fk.webp?x=1#crop', B]);
      await baixa(uid, '2000-01-01');
      assert.equal(await purga(), 1);
      assert.deepEqual(await un("SELECT owner, owner_id FROM storage.objects WHERE name='referenciat-fk.webp'"), { owner: null, owner_id: uid });
    });

    await t.test('la cua no reclama ni confirma un DELETE pel nom en un bucket amb versions', async () => {
      const uid = '99999999-9999-4999-8999-999999999999';
      await db.exec("ALTER TABLE storage.buckets ADD COLUMN versioning_status text NOT NULL DEFAULT 'DISABLED'");
      const estatBucket = (estat) => db.query("UPDATE storage.buckets SET versioning_status=$1 WHERE id='mitjans_privats'", [estat]);
      await auth(uid);
      await objecte('mitjans_privats', 'versionat.webp', uid, uid);
      await baixa(uid, '2000-01-01');
      await estatBucket('ENABLED');
      assert.equal(await purga(), 0);
      // La fila bloquejada pel versionat no es reclama: la baixa ho anota per a l'operador.
      assert.match((await un('SELECT ultim_error FROM private.baixes WHERE user_id=$1', [uid])).ultim_error, /^SDP-BAIXA-043/);
      assert.deepEqual(await reclama(), []);
      await estatBucket('DISABLED');
      const [job] = await reclama();
      assert.equal(job.nom, 'versionat.webp');
      await estatBucket('SUSPENDED');
      await assert.rejects(apiStorage(job.bucket_id, job.nom), (e) => e.code === '55000');
      await estatBucket('DISABLED');
      await apiStorage(job.bucket_id, job.nom);
      await estatBucket('ENABLED');
      assert.equal(await confirma([job.id]), 0);
      assert.equal(await purga(), 0);
      await estatBucket('DISABLED');
      assert.equal(await confirma([job.id]), 1);
      assert.equal(await purga(), 1);
    });

    await t.test('un error diferit durant l’encuament desfà només la baixa afectada', async () => {
      const uid = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
      const altra = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
      await auth(uid);
      await auth(altra);
      await objecte('mitjans', 'error-diferit.webp', uid);
      await baixa(uid, '1999-01-01');
      await baixa(altra, '2000-01-01');
      await db.exec(`CREATE FUNCTION private.prova_baixa_diferida() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'restricció diferida sintètica'; END;
        $$;
        CREATE CONSTRAINT TRIGGER prova_baixa_diferida AFTER UPDATE ON private.baixes
          DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
          WHEN (new.user_id = '${uid}' AND old.purga_fitxers_iniciada_al IS NULL AND new.purga_fitxers_iniciada_al IS NOT NULL)
          EXECUTE FUNCTION private.prova_baixa_diferida();`);
      assert.equal(await purga(), 1);
      assert.deepEqual(await un('SELECT purga_fitxers_iniciada_al, intents FROM private.baixes WHERE user_id=$1', [uid]),
        { purga_fitxers_iniciada_al: null, intents: 1 });
      assert.equal((await un('SELECT count(*)::int AS total FROM public.cua_purga_storage_ugc WHERE user_id=$1', [uid])).total, 0);
      assert.equal((await un('SELECT count(*)::int AS total FROM auth.users WHERE id=$1', [altra])).total, 0);
      await db.query('DELETE FROM private.baixes WHERE user_id=$1', [uid]);
      await db.exec('DROP TRIGGER prova_baixa_diferida ON private.baixes; DROP FUNCTION private.prova_baixa_diferida();');
    });

    await t.test('esborrat directe d’Auth i reserva de ruta no permeten adoptar un objecte mentre està en cua', async () => {
      await objecte('mitjans_privats', 'directe.webp', B);
      await db.exec('ALTER TABLE storage.objects DROP CONSTRAINT prova_owner_fk');
      await db.query('BEGIN');
      await db.query('DELETE FROM auth.users WHERE id=$1', [B]);
      assert.equal((await un("SELECT count(*)::int AS total FROM public.cua_purga_storage_ugc WHERE nom='directe.webp'")).total, 1);
      await db.exec('ROLLBACK');
      assert.equal((await un("SELECT count(*)::int AS total FROM public.cua_purga_storage_ugc WHERE nom='directe.webp'")).total, 0);
      await db.query('DELETE FROM auth.users WHERE id=$1', [B]);
      const lot = await reclama();
      const job = lot.find((r) => r.nom === 'directe.webp');
      assert.ok(job);
      await apiStorage(job.bucket_id, job.nom);
      await assert.rejects(objecte('mitjans_privats', 'directe.webp', null), (e) => e.code === '55000');
      assert.equal(await confirma([job.id]), 1);
    });

    await t.test('un esborrat directe d’Auth conserva les imatges de les publicacions personals que sobreviuen', async () => {
      // section_submissions.owner_user_id no té FK cap a auth.users: fora de la
      // baixa, la publicació personal sobreviu i la seua imatge continua citada.
      const uid = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
      const nom = 'publicacio-personal-viva.webp';
      await auth(uid);
      await objecte('mitjans', nom, uid);
      await db.query(`INSERT INTO public.section_submissions (tenant_id, owner_user_id, section_id, title, payload)
        VALUES ($1,$2,'multimedia','Publicació personal viva',$3::jsonb)`,
      [POBLE, uid, JSON.stringify({ body: `sdp-media://mitjans/${nom}` })]);
      await db.query('DELETE FROM auth.users WHERE id=$1', [uid]);
      assert.equal((await un('SELECT count(*)::int AS total FROM public.section_submissions WHERE owner_user_id=$1', [uid])).total, 1);
      assert.deepEqual(await un('SELECT referenciat FROM public.cua_purga_storage_ugc WHERE nom=$1', [nom]), { referenciat: true });
      assert.equal((await reclama()).some((r) => r.nom === nom), false);
      assert.equal((await un('SELECT count(*)::int AS total FROM storage.objects WHERE name=$1', [nom])).total, 1);
    });

    await t.test('el worker real consumeix la cua SQL per l’API Storage i la baixa acaba', async () => {
      const uid = '88888888-8888-4888-8888-888888888888';
      const nom = 'worker-integrat.webp';
      await auth(uid);
      await objecte('mitjans_privats', nom, uid, uid);
      await baixa(uid, '2000-01-01');
      assert.equal(await purga(), 0);
      const secret = 'a'.repeat(32);
      const crides = [];
      const gestor = creaGestor({
        env: { SDP_CRON_SECRET: secret, SUPABASE_URL: 'https://storage.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test' },
        registre: { info() {}, error() {} },
        fetch: async (url, init) => {
          const ruta = new URL(url).pathname;
          const cos = JSON.parse(init.body);
          if (ruta === '/rest/v1/rpc/purga_fitxers_reclama') {
            return Response.json(await worker('SELECT * FROM public.purga_fitxers_reclama($1)', [cos.p_limit]));
          }
          if (ruta === '/rest/v1/rpc/purga_fitxers_fets') {
            return Response.json(await confirma(cos.p_ids));
          }
          assert.equal(ruta, '/storage/v1/object/mitjans_privats');
          assert.equal(init.method, 'DELETE');
          assert.deepEqual(cos, { prefixes: [nom] });
          crides.push(nom);
          await apiStorage('mitjans_privats', nom);
          return Response.json([{ name: nom }]);
        }
      });
      const resposta = await gestor(new Request('https://worker.example.invalid', { method: 'POST', headers: { 'x-sdp-cron': secret } }));
      assert.equal(resposta.status, 200);
      assert.equal((await resposta.json()).fets, 1);
      assert.deepEqual(crides, [nom]);
      assert.equal(await purga(), 1);
    });
  } finally {
    await db.close();
  }
});
