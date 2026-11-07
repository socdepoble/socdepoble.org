/** P2-08/09 · SQL real en PostgreSQL WASM local. Catàleg/ACL/RLS originals;
 * Auth/Storage són fixtures del Node0. Cap backend remot ni instal·lació.
 * SDP_PGLITE_MODULE=/ruta/local/pglite/dist/index.js node --test tests/exportacio-federacio-postgres.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { creaFixtureR20b } from './fixtures/r20b-municipal-fixture.mjs';

test('R11-P2-08/09 · exportació SQL amb dos comptes, contraparts i esquema incompatible', {
  skip: !process.env.SDP_PGLITE_MODULE && 'Cal un runtime PGlite local explícit; cap SQL certificat sense ell',
}, async (t) => {
  const f = await creaFixtureR20b();
  const contracte = JSON.parse(fs.readFileSync('supabase/contracts/exportacio_federacio.v1.json', 'utf8'));
  try {
    // Camps de GoTrue reals que la fixture Node0 mínima no necessita.
    await f.pg.exec('ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(); ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz');
    const A = await f.person('export-a'), B = await f.person('export-b');
    for (const [recurs, spec] of Object.entries(contracte.recursos)) {
      await f.pg.exec(`CREATE TABLE public.${recurs}(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ${spec.propietari} uuid REFERENCES auth.users(id), name text, content text, target_user_id uuid, internal_secret text)`);
      await f.pg.query(`INSERT INTO public.${recurs}(${spec.propietari},name,content,target_user_id,internal_secret) VALUES($1,'OWN-A','CONTENT-A',$2,'NOEXPORT-A'),($2,'OWN-B','CONTENT-B',$1,'NOEXPORT-B')`, [A, B]);
    }
    const sql = fs.readFileSync('supabase/migrations/2611011800_contracte_exportacio_federacio_v1.sql', 'utf8');
    await f.pg.exec(sql);
    await f.pg.exec(sql);
    const exporta = async (uid, role = 'authenticated') => (await f.as(uid, 'SELECT public.exporta_les_meues_dades() AS value', [], { role }))[0].value;
    const validaPropietat = (data, uid, altra) => {
      const fed = data.federacio_no_versionada;
      assert.equal(fed._contracte, contracte.esquema);
      for (const [recurs, spec] of Object.entries(contracte.recursos)) {
        assert.equal(fed[recurs].length, 1, recurs);
        assert.equal(fed[recurs][0][spec.propietari], uid);
        for (const col of Object.keys(fed[recurs][0])) assert.ok(Object.hasOwn(spec.columnes, col), `${recurs}.${col}`);
      }
      assert.ok(!JSON.stringify(fed).includes(altra));
      assert.ok(!JSON.stringify(fed).includes('NOEXPORT'));
    };
    await t.test('A i B exporten només files pròpies; contrapart i credencials internes fora de la projecció', async () => {
      validaPropietat(await exporta(A), A, B);
      validaPropietat(await exporta(B), B, A);
    });
    await t.test('privada no executable per authenticated/anon/service; pública només authenticated i sense sessió es denega', async () => {
      for (const role of ['anon', 'authenticated', 'service_role']) {
        const acl = (await f.pg.query("SELECT has_function_privilege($1,'private.exporta_federacio_v1(uuid)','EXECUTE') AS allowed", [role])).rows[0];
        assert.equal(acl.allowed, false, role);
        await assert.rejects(f.as(A, 'SELECT private.exporta_federacio_v1($1)', [B], { role }), (e) => e.code === '42501');
      }
      for (const role of ['anon', 'service_role']) await assert.rejects(exporta(A, role), (e) => e.code === '42501');
      await assert.rejects(exporta(null), (e) => e.code === '42501');
    });
    await t.test('denúncies pròpies i consentiments inclosos; denúncies de B sobre A només recompte de mesures', async () => {
      await f.as(A, "SELECT public.denuncia_contingut('persona',$1,'altre','REPORT-A','persona',$1)", [B]);
      await f.as(B, "SELECT public.denuncia_contingut('persona',$1,'altre','REPORT-B-PRIVATE','persona',$1)", [A]);
      const pendent = await exporta(A);
      assert.equal(pendent.moderacio.denuncies_fetes.length, 1);
      assert.equal(pendent.moderacio.denuncies_fetes[0].detall, 'REPORT-A');
      assert.deepEqual(pendent.moderacio.denuncies_rebudes, { amb_mesura: 0 });
      assert.ok(pendent.moderacio.normes_acceptades.length > 0);
      assert.ok(!JSON.stringify(pendent).includes('REPORT-B-PRIVATE'));
      await f.pg.query("UPDATE public.denuncies SET estat='retirada' WHERE denunciant=$1", [B]);
      const retirada = await exporta(A);
      assert.deepEqual(retirada.moderacio.denuncies_rebudes, { amb_mesura: 1 });
      assert.ok(!JSON.stringify(retirada).includes('REPORT-B-PRIVATE'));
    });
    await t.test('seguiments retirats fora i credencial Apple mai exportada', async () => {
      await f.as(B, "SELECT public.segueix('persona',$1)", [A]);
      assert.equal((await exporta(A)).seguiments.total_seguidors, 1);
      await f.as(B, "SELECT public.deixa_de_seguir('persona',$1)", [A]);
      assert.equal((await exporta(A)).seguiments.total_seguidors, 0);
      /* Fixture sintètica: es construïx en temps d'execució perquè la porta de literals secrets
         (test:precommit) no la confonga amb una credencial real. */
      const testimoniFixture = Buffer.from('SECRET-APPLE-DONOTEXPORT-FIXTURE').toString('base64');
      await f.pg.query("INSERT INTO private.autoritzacions_apple(user_id,client_id,testimoni_xifrat) VALUES($1,'org.example.fixture',$2)", [A, testimoniFixture]);
      const data = await exporta(A);
      assert.ok(data.apple.autoritzacio_desada_al);
      assert.ok(!JSON.stringify(data).includes(testimoniFixture));
    });
    await t.test('tipus aliè al contracte dona error per recurs; la resta continua', async () => {
      await f.pg.exec('ALTER TABLE public.posts ALTER COLUMN content TYPE jsonb USING to_jsonb(content)');
      const data = await exporta(A);
      assert.deepEqual(data.federacio_no_versionada.posts, { error: 'SDP-FED-ESQUEMA-NO-ADMES' });
      assert.equal(data.federacio_no_versionada.realms.length, 1);
    });
    await t.test('propietat sense FK validada falla tancada encara que l’UUID coincidisca', async () => {
      await f.pg.exec('ALTER TABLE public.connections DROP CONSTRAINT connections_user_id_fkey');
      const data = await exporta(A);
      assert.deepEqual(data.federacio_no_versionada.connections, { error: 'SDP-FED-ESQUEMA-NO-ADMES' });
      assert.equal(data.federacio_no_versionada.user_realms.length, 1);
    });
    console.log(JSON.stringify({
      scope: 'PostgreSQL WASM local; catàleg76 i migració2611011800 aplicada dues vegades; dades sintètiques; cap producció',
      migrationSha256: createHash('sha256').update(sql).digest('hex'),
      contractSha256: createHash('sha256').update(fs.readFileSync('supabase/contracts/exportacio_federacio.v1.json')).digest('hex'),
      postgres: (await f.pg.query('SELECT version() AS v')).rows[0].v,
    }));
  } finally { await f.close(); }
});
