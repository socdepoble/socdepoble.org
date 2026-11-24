/* v1.2.24 · IDEA-339 · 20261124030000: comptes sense perfil, fils directes sense ningú i publicació de Realtime.
   PGlite amb el pla de migracions complet (el mateix que el Node 0). Cap verd sense SQL. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { creaPlaMigracions, generaSql, preparaHidratacio } from '../tooling/node0/hidrata-postgres-node0.mjs';

if (!process.env.SDP_PGLITE_MODULE) throw new Error('SDP_PGLITE_MODULE obligatori: cap verd sense SQL.');
const moduleUrl = pathToFileURL(process.env.SDP_PGLITE_MODULE);
const { PGlite } = await import(moduleUrl.href);
const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleUrl));
const MIGRACIO = fs.readFileSync(new URL('../supabase/migrations/20261124030000_v1224_integritat_xat_perfils_i_realtime.sql', import.meta.url), 'utf8');
const uid = (n) => `13200000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const A = uid(1), B = uid(2), C = uid(3), D = uid(4), E = uid(5);
const TENANT = 'ac3bec76-255b-5ca2-8886-28fcceab4267';

test('v1.2.24 · 20261124030000 sobre el catàleg real', async (t) => {
  const initial = new PGlite();
  let image;
  try { await initial.exec('CREATE DATABASE socdepoble_node0'); image = await initial.dumpDataDir('none'); }
  finally { await initial.close(); }
  const pg = new PGlite({ database: 'socdepoble_node0', loadDataDir: image, extensions: { pgcrypto } });
  const as = (actor, sql, args = []) => pg.transaction(async (tx) => {
    await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)", [actor, JSON.stringify({ sub: actor, role: 'authenticated', aal: 'aal1' })]);
    await tx.exec('SET LOCAL ROLE authenticated');
    return (await tx.query(sql, args)).rows;
  });
  const un = async (sql, args = []) => (await pg.query(sql, args)).rows[0];
  const reaplica = () => pg.exec(MIGRACIO);
  /* L'estat del client de juny: files fetes sense disparadors, com si foren d'abans. */
  const comAbans = (sql, args = []) => pg.transaction(async (tx) => {
    await tx.exec("SET LOCAL session_replication_role = 'replica'");
    return (await tx.query(sql, args)).rows;
  });
  try {
    await pg.exec(generaSql(creaPlaMigracions(), await preparaHidratacio(), { advisoryLock: false }));
    for (const actor of [A, B, C, D, E]) {
      await pg.query('INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,now(),$3)', [actor, `${actor}@example.invalid`, { full_name: `Veí ${actor.at(-1)}`, tenant_id: TENANT, accepta_rgpd: true }]);
      await pg.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [TENANT, actor]);
      await pg.query('UPDATE public.profiles SET consentiment_rgpd_at = coalesce(consentiment_rgpd_at, now()) WHERE id = $1', [actor]);
    }

    await t.test('1 · el compte sense perfil es repara; el de baixa, no', async () => {
      await comAbans('DELETE FROM public.profiles WHERE id = ANY($1::uuid[])', [[C, D]]);
      await pg.query("INSERT INTO private.baixes(user_id, purga_prevista_al) VALUES($1, now() + interval '30 days')", [D]);
      await reaplica();
      assert.equal((await un('SELECT full_name FROM public.profiles WHERE id = $1', [C]))?.full_name, 'Veí 3');
      assert.equal(await un('SELECT 1 AS hi FROM public.profiles WHERE id = $1', [D]), undefined);
      await pg.query('DELETE FROM private.baixes WHERE user_id = $1', [D]);
      await reaplica();
    });

    await t.test('2 · crea_fil_directe continua passant i deixa dos participants', async () => {
      const [{ fil }] = await as(A, 'SELECT public.crea_fil_directe($1,$2,null) AS fil', [TENANT, B]);
      assert.equal((await un('SELECT count(*)::int AS n FROM public.xat_participants WHERE fil_id = $1', [fil])).n, 2);
      const [{ fil: propi }] = await as(A, 'SELECT public.crea_fil_directe($1,$2,null) AS fil', [TENANT, A]);
      assert.equal((await un('SELECT count(*)::int AS n FROM public.xat_participants WHERE fil_id = $1', [propi])).n, 1);
    });

    await t.test('3 · un directe sense participants no arriba al COMMIT (SDP-XAT-051)', async () => {
      await assert.rejects(
        pg.query("INSERT INTO public.xat_fils(tenant_id,titol,creat_per,tipus) VALUES($1,'sol',$2,'directe')", [TENANT, A]),
        (error) => /SDP-XAT-051/.test(error.message)
      );
      await pg.transaction(async (tx) => {
        const { rows: [f] } = await tx.query("INSERT INTO public.xat_fils(tenant_id,titol,creat_per,tipus) VALUES($1,'amb un',$2,'directe') RETURNING id", [TENANT, A]);
        await tx.query('INSERT INTO public.xat_participants(fil_id,usuari_id) VALUES($1,$2)', [f.id, A]);
      });
    });

    await t.test('4 · els orfes de juny: el directe buit se’n va, el que té missatges i el de subjecte es queden', async () => {
      const [buit] = await comAbans("INSERT INTO public.xat_fils(tenant_id,titol,creat_per,tipus) VALUES($1,'orfe buit',$2,'directe') RETURNING id", [TENANT, A]);
      const [ple] = await comAbans("INSERT INTO public.xat_fils(tenant_id,titol,creat_per,tipus) VALUES($1,'orfe amb historial',$2,'directe') RETURNING id", [TENANT, A]);
      const [grup] = await comAbans("INSERT INTO public.xat_fils(tenant_id,titol,creat_per,tipus) VALUES($1,'grup de subjecte',null,'grup') RETURNING id", [TENANT]);
      await comAbans("INSERT INTO public.xat_missatges(fil_id,usuari_id,text,seq) VALUES($1,$2,'hola',1)", [ple.id, A]);
      await reaplica();
      const queden = (await pg.query('SELECT id FROM public.xat_fils WHERE id = ANY($1::uuid[])', [[buit.id, ple.id, grup.id]])).rows.map((r) => r.id).sort();
      assert.deepEqual(queden, [ple.id, grup.id].sort());
    });

    await t.test('5 · un directe que es queda sense ningú i sense res desapareix; amb missatges, no', async () => {
      /* La fila reparada a l'1 naix sense consentiment, com la de handle_new_user: el dona la persona. */
      await pg.query('UPDATE public.profiles SET consentiment_rgpd_at = now() WHERE id = $1', [C]);
      const [{ fil }] = await as(B, 'SELECT public.crea_fil_directe($1,$2,null) AS fil', [TENANT, C]);
      await pg.query('DELETE FROM public.xat_participants WHERE fil_id = $1', [fil]);
      assert.equal(await un('SELECT 1 AS hi FROM public.xat_fils WHERE id = $1', [fil]), undefined);
      const [{ fil: ambText }] = await as(B, 'SELECT public.crea_fil_directe($1,$2,null) AS fil', [TENANT, E]);
      await comAbans("INSERT INTO public.xat_missatges(fil_id,usuari_id,text,seq) VALUES($1,$2,'bon dia',1)", [ambText, B]);
      await pg.query('DELETE FROM public.xat_participants WHERE fil_id = $1', [ambText]);
      assert.equal((await un('SELECT 1 AS hi FROM public.xat_fils WHERE id = $1', [ambText]))?.hi, 1);
    });

    await t.test('6 · supabase_realtime es queda sense taules de public', async (st) => {
      try {
        await pg.exec('DROP PUBLICATION IF EXISTS supabase_realtime; CREATE PUBLICATION supabase_realtime FOR TABLE public.xat_missatges, public.notes');
      } catch (error) {
        st.skip(`PGlite no admet CREATE PUBLICATION: ${error.message}`);
        return;
      }
      assert.equal((await un("SELECT count(*)::int AS n FROM pg_publication_tables WHERE pubname = 'supabase_realtime'")).n, 2);
      await reaplica();
      assert.equal((await un("SELECT count(*)::int AS n FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public'")).n, 0);
      await pg.exec('DROP PUBLICATION supabase_realtime; CREATE PUBLICATION supabase_realtime FOR ALL TABLES');
      await reaplica();
      assert.equal((await un("SELECT puballtables FROM pg_publication WHERE pubname = 'supabase_realtime'")).puballtables, true);
      await pg.exec('DROP PUBLICATION supabase_realtime');
      await reaplica();
    });

    await t.test('7 · les dues funcions noves no són de ningú més', async () => {
      for (const nom of ['xat_fil_directe_amb_participants', 'xat_fil_directe_buit_fora']) {
        const fila = await un("SELECT has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth, has_function_privilege('anon', p.oid, 'EXECUTE') AS anon, p.prosecdef, p.proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'private' AND p.proname = $1", [nom]);
        assert.deepEqual([fila.auth, fila.anon, fila.prosecdef, fila.proconfig], [false, false, true, ['search_path=""']]);
      }
    });
  } finally {
    await pg.close();
  }
});
