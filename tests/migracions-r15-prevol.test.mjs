/** R15.2 dry PostgreSQL proof. Canonical migration bodies, synthetic GoTrue
 * compatibility fields, no production connection and no policy activation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { creaFixtureR20b } from './fixtures/r20b-municipal-fixture.mjs';

const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const preflight = read('scripts/supabase/verifica_migracions_r15.sql');
const culture = read('supabase/migrations/2611091500_sessions_i_curadoria_cultural.sql');
const privacy = read('supabase/migrations/2611080440_politica_privacitat_2_6.sql');
const failed = report => report.checks.filter(c => !c.ok).map(c => c.id);
const denied = e => e.code === '42501';

test('R15b · R8: the curator check is revoked from every client role, schema-qualified', () => {
  assert.match(culture, /^revoke all on function private\.pot_curar_cultura\(\) from public,anon,authenticated;$/m);
  // No top-level search_path change: every function keeps its own SET search_path = ''.
  assert.equal((culture.match(/^\s*(?:set (?:local |session )?|reset )search_path\b/gim) || []).length, 0);
});

test('R15 preflight + actual migrations: ACL, restrictive RLS, aal2, indexes and append-only policy', {
  skip: !process.env.SDP_PGLITE_MODULE && 'Explicit PGlite required; a skipped dry run never accredits Supabase',
  timeout: 120000
}, async t => {
  const f = await creaFixtureR20b();
  const reports = async () => {
    const result = await f.pg.exec(preflight);
    const main = result.find(r => r.rows[0]?.verificacio_r15)?.rows[0].verificacio_r15;
    const policy = result.find(r => r.rows[0]?.verificacio_privadesa_r15)?.rows[0].verificacio_privadesa_r15;
    assert.ok(main && policy, 'Both independent read-only reports are required');
    return {main, policy};
  };
  const mutateThenCheck = async (sql, id) => {
    // Separate transaction: the verifier's own read-only transaction rolls back.
    await f.pg.exec(sql);
    const r = await reports(); assert.ok(failed(r.main).includes(id), JSON.stringify(r.main));
  };
  try {
    await f.phase(['2611061520','2611082238']);
    await t.test('missing real GoTrue columns veto preflight; pending migrations are never called applied', async () => {
      const before = await reports();
      assert.equal(before.main.valid, false); assert.ok(failed(before.main).includes('dependency_auth_columns'));
      assert.equal(before.main.migration2611091500, 'pending'); assert.equal(before.policy.migration2611080440, 'pending');
      // Only a synthetic compatibility fixture, not GoTrue coverage.
      await f.pg.exec(`ALTER TABLE auth.sessions ADD COLUMN created_at timestamptz DEFAULT now(),
        ADD COLUMN updated_at timestamptz DEFAULT now(), ADD COLUMN refreshed_at timestamp,
        ADD COLUMN user_agent text;`);
      const pending = await reports();
      assert.deepEqual(failed(pending.main), []); assert.equal(pending.policy.valid, true);
      assert.equal(pending.policy.clientRequiredWhilePending, '2.5');
    });
    await t.test('both canonical culture applications are idempotent and satisfy catalog guards', async () => {
      // R15b · R8: the curator check is revoked from every client role, and applying the file
      // twice leaves the session search_path untouched.
      const searchPath = async () => (await f.pg.query('SHOW search_path')).rows[0].search_path;
      const pathBefore = await searchPath();
      await f.pg.exec(culture); await f.pg.exec(culture);
      assert.equal(await searchPath(), pathBefore);
      const acl = (await f.pg.query(`SELECT has_function_privilege('anon','private.pot_curar_cultura()','EXECUTE') AS anon,
        has_function_privilege('authenticated','private.pot_curar_cultura()','EXECUTE') AS authenticated,
        EXISTS(SELECT 1 FROM pg_proc p, aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
          WHERE p.oid='private.pot_curar_cultura()'::regprocedure AND a.grantee=0) AS public`)).rows[0];
      assert.deepEqual(acl, {anon:false, authenticated:false, public:false});
      const {main, policy} = await reports();
      assert.deepEqual(failed(main), []); assert.equal(main.valid, true);
      assert.equal(main.migration2611091500, 'present'); assert.equal(policy.migration2611080440, 'pending');
      assert.equal(main.remoteMigrationsApplied, false); assert.equal(main.serviceActivationAccredited, false);
    });
    const owner = await f.person('r15-owner'), stranger = await f.person('r15-stranger');
    const admin = await f.person('r15-admin', {admin:true});
    await f.pg.query('INSERT INTO private.curadors_culturals(usuari_id) VALUES($1)',[owner]);
    const as = (id, sql, params=[], aal='aal2') => f.as(id,sql,params,{aal});
    await t.test('actual aal1/user/anonymous refusals and owner-derived writes; approved never means ingested', async () => {
      await assert.rejects(as(admin,'SELECT public.admin_llista_sessions_dispositius()',[],'aal1'),denied);
      await assert.rejects(as(stranger,'SELECT public.admin_llista_sessions_dispositius()'),denied);
      await assert.rejects(f.as(null,'SELECT public.admin_llista_sessions_dispositius()',[],{role:'anon'}),denied);
      const state = (await as(owner,'SELECT public.estat_curadoria_cultural() AS value'))[0].value;
      assert.equal(state.pot_curar,true); assert.equal(state.ingestio_disponible,false);
      const weak = (await as(owner,'SELECT public.estat_curadoria_cultural() AS value',[],'aal1'))[0].value;
      assert.equal(weak.pot_curar,false);
      await assert.rejects(as(null,"SELECT public.envia_aportacio_cultural('T','A','P','C',true)"),denied);
      await assert.rejects(as(owner,"SELECT public.envia_aportacio_cultural('T','A','P','C',false)"),e=>e.code==='23514');
      const contribution = (await as(stranger,"SELECT public.envia_aportacio_cultural('Títol','Autora','Poble','Text literal',true) AS value"))[0].value;
      const stored = (await f.pg.query('SELECT usuari_id FROM public.aportacions_culturals WHERE id=$1',[contribution.id])).rows[0];
      assert.equal(stored.usuari_id,stranger);
      await assert.rejects(as(owner,"SELECT public.revisa_aportacio_cultural($1,'aprovat','')",[contribution.id],'aal1'),denied);
      await assert.rejects(as(stranger,"SELECT public.revisa_aportacio_cultural($1,'aprovat','')",[contribution.id]),denied);
      const revised = (await as(owner,"SELECT public.revisa_aportacio_cultural($1,'aprovat','Revisat') AS value",[contribution.id]))[0].value;
      assert.equal(revised.estat,'aprovat');
      assert.equal((await as(owner,'SELECT public.estat_curadoria_cultural() AS value'))[0].value.ingestio_disponible,false);
      await assert.rejects(as(owner,"SELECT public.revisa_aportacio_cultural($1,'ingerit','')",[contribution.id]),e=>e.code==='22023');
    });
    await t.test('SEG-R15b-04: nobody decides an own contribution and sending requires the current UGC norms', async () => {
      // D-6 (four eyes): the curator and the superadmin cannot decide what they sent themselves.
      for (const author of [owner, admin]) {
        const own = (await as(author,"SELECT public.envia_aportacio_cultural('Pròpia','Autora','Poble','Text propi',true) AS value"))[0].value;
        await assert.rejects(as(author,"SELECT public.revisa_aportacio_cultural($1,'aprovat','')",[own.id]),e=>denied(e)&&/SDP-CULTURA-PROPIA/.test(e.message));
        assert.equal((await f.pg.query('SELECT estat,revisor_id FROM public.aportacions_culturals WHERE id=$1',[own.id])).rows[0].estat,'pendent_revisio');
        const other = author===owner ? admin : owner;
        assert.equal((await as(other,"SELECT public.revisa_aportacio_cultural($1,'correccio','Una altra persona') AS value",[own.id]))[0].value.estat,'correccio');
      }
      // Same UGC gate as section_submissions and xat_missatges (2610241400).
      const noNorms = await f.person('r15-sense-normes');
      await f.pg.query('DELETE FROM private.normes_acceptades WHERE usuari_id=$1',[noNorms]);
      await assert.rejects(as(noNorms,"SELECT public.envia_aportacio_cultural('T','A','P','C',true)"),e=>denied(e)&&/SDP-MOD-428/.test(e.message));
      assert.equal((await f.pg.query('SELECT count(*)::integer AS n FROM public.aportacions_culturals WHERE usuari_id=$1',[noNorms])).rows[0].n,0);
    });
    await t.test('SEG-R15b-01: directory groups person and path, masks e-mail, hides session/person ids and audits each read', async () => {
      const audits = async () => (await f.pg.query('SELECT actor,filtres,files,total FROM private.admin_lectures_sessions ORDER BY id')).rows;
      const before = (await audits()).length;
      await f.pg.query(`INSERT INTO auth.sessions(user_id,user_agent) SELECT $1,'iPhone RAW-UA-CANARY' FROM generate_series(1,205)`,[stranger]);
      const result = (await as(admin,"SELECT public.admin_llista_sessions_dispositius('r15-stranger','app_ios') AS value"))[0].value;
      assert.equal(result.total,1); assert.equal(result.files.length,1);
      const [row] = result.files;
      assert.deepEqual(Object.keys(row).sort(),['activitat','cami','clau','correu_mascarat','nom','sessions']);
      assert.equal(row.cami,'app_ios'); assert.equal(row.sessions,205); assert.equal(row.nom,'r15-stranger');
      assert.equal(row.correu_mascarat,'r***@example.invalid'); assert.match(row.clau,/^[0-9a-f]{32}$/);
      const text = JSON.stringify(result);
      for (const forbidden of ['RAW-UA-CANARY',stranger,'r15-stranger@example.invalid','sessio_id','usuari_id','user_agent','access_token','refresh_token']) assert.ok(!text.includes(forbidden),forbidden);
      for (const {id} of (await f.pg.query('SELECT id::text AS id FROM auth.sessions WHERE user_id=$1',[stranger])).rows) assert.ok(!text.includes(id));
      // The key is opaque per query: it does not link two reads of the same person.
      const again = (await as(admin,"SELECT public.admin_llista_sessions_dispositius('r15-stranger','app_ios') AS value"))[0].value;
      assert.notEqual(again.files[0].clau,row.clau);
      const no = (await as(admin,"SELECT public.admin_llista_sessions_dispositius('r15-stranger','web_android') AS value"))[0].value;
      assert.equal(no.total,0); assert.deepEqual(no.files,[]);
      await assert.rejects(as(admin,'SELECT public.admin_llista_sessions_dispositius($1)', ['x'.repeat(121)]),e=>e.code==='22023');
      // One private audit row per read (refused reads roll back with their transaction).
      const rows = (await audits()).slice(before);
      assert.deepEqual(rows,[
        {actor:admin,filtres:{cerca:'r15-stranger',cami:'app_ios'},files:1,total:1},
        {actor:admin,filtres:{cerca:'r15-stranger',cami:'app_ios'},files:1,total:1},
        {actor:admin,filtres:{cerca:'r15-stranger',cami:'web_android'},files:0,total:0}]);
      // Consent withdrawn or account in deletion: never listed, as in admin_llista_usuaris_registrats.
      const unconsented = await f.person('r15-sense-consentiment',{consent:false});
      const leaving = await f.person('r15-baixa');
      await f.pg.query('UPDATE public.profiles SET baixa_demanada_at=now() WHERE id=$1',[leaving]);
      await f.pg.query(`INSERT INTO auth.sessions(user_id,user_agent) VALUES($1,'Mozilla/5.0 (Windows NT 10.0)'),($2,'Mozilla/5.0 (Windows NT 10.0)')`,[unconsented,leaving]);
      for (const name of ['r15-sense-consentiment','r15-baixa']) assert.equal((await as(admin,'SELECT public.admin_llista_sessions_dispositius($1) AS value',[name]))[0].value.total,0,name);
      // At most 200 person/path rows per read; the total still counts every match.
      await f.pg.exec(`INSERT INTO auth.users(id,email,raw_user_meta_data) SELECT gen_random_uuid(),'massa'||g||'@example.invalid',jsonb_build_object('name','r15-massa-'||g) FROM generate_series(1,201) g;
        UPDATE public.profiles p SET consentiment_rgpd_at=now() FROM auth.users u WHERE u.id=p.id AND u.email LIKE 'massa%@example.invalid';
        INSERT INTO auth.sessions(user_id,user_agent) SELECT id,'Mozilla/5.0 (X11; Linux x86_64)' FROM auth.users WHERE email LIKE 'massa%@example.invalid';`);
      const many = (await as(admin,"SELECT public.admin_llista_sessions_dispositius('r15-massa','escriptori') AS value"))[0].value;
      assert.equal(many.total,201); assert.equal(many.files.length,200); assert.equal(new Set(many.files.map(r=>r.clau)).size,200);
      // Append-only even for the table owner; no client role reads it.
      for (const sql of ['UPDATE private.admin_lectures_sessions SET files=0','DELETE FROM private.admin_lectures_sessions','TRUNCATE private.admin_lectures_sessions'])
        await assert.rejects(f.pg.exec(sql),e=>denied(e)&&/SDP-ADMIN-AUDIT-IMMUTABLE/.test(e.message),sql);
      await assert.rejects(as(admin,'SELECT * FROM private.admin_lectures_sessions'),denied);
    });
    await t.test('restrictive RLS defeats accidental direct grants plus a permissive-all policy', async () => {
      for(const relation of ['public.aportacions_culturals','private.curadors_culturals']) {
        await assert.rejects(as(stranger,`SELECT * FROM ${relation}`),denied);
        await f.pg.exec(`GRANT SELECT,INSERT,UPDATE,DELETE ON ${relation} TO authenticated;
          CREATE POLICY r15_mutant_allow ON ${relation} AS PERMISSIVE FOR ALL TO authenticated USING(true) WITH CHECK(true);`);
        assert.deepEqual(await as(stranger,`SELECT * FROM ${relation}`),[]);
        assert.deepEqual(await as(stranger,`DELETE FROM ${relation} RETURNING *`),[]);
        const r = await reports(); assert.ok(failed(r.main).includes('no_direct_table_grants'));
        await f.pg.exec(`DROP POLICY r15_mutant_allow ON ${relation}; REVOKE ALL ON ${relation} FROM authenticated;`);
      }
      const r = await reports(); assert.deepEqual(failed(r.main),[]);
    });
    await t.test('index removal, restrictive-policy removal and private-RPC grant are rejected independently', async () => {
      await mutateThenCheck('DROP INDEX public.aportacions_culturals_usuari_data','contribution_user_date_index');
      await f.pg.exec('CREATE INDEX aportacions_culturals_usuari_data ON public.aportacions_culturals(usuari_id,creat_a DESC)');
      await mutateThenCheck('DROP POLICY aportacions_culturals_nomes_rpc ON public.aportacions_culturals','rls_restrictive_deny_all');
      await f.pg.exec('CREATE POLICY aportacions_culturals_nomes_rpc ON public.aportacions_culturals AS RESTRICTIVE FOR ALL TO public USING(false) WITH CHECK(false)');
      await mutateThenCheck('GRANT EXECUTE ON FUNCTION private.pot_curar_cultura() TO authenticated','private_rpc_not_callable');
      await f.pg.exec('REVOKE EXECUTE ON FUNCTION private.pot_curar_cultura() FROM authenticated');
      assert.deepEqual(failed((await reports()).main),[]);
    });
    await t.test('exact security body hashes veto an ORtrue bypass despite every AAL2 keyword surviving', async () => {
      const definition=(await f.pg.query("SELECT pg_get_functiondef('private.pot_curar_cultura()'::regprocedure) AS value")).rows[0].value;
      const mutant=definition.replace('select coalesce(','select true or coalesce(');assert.notEqual(mutant,definition);
      await f.pg.exec(mutant);
      const report=(await reports()).main;
      assert.equal(report.checks.find(c=>c.id==='curator_aal2_guard').ok,true,'Keywords alone cannot detect this bypass.');
      assert.ok(failed(report).includes('canonical_security_function_bodies'));assert.equal(report.valid,false);
      assert.equal((await as(stranger,'SELECT public.estat_curadoria_cultural() AS value',[],'aal1'))[0].value.pot_curar,true,'The deliberately unsafe fixture reproduces a real privilege bypass, not a text-only mutant.');
      await f.pg.exec(definition);assert.deepEqual(failed((await reports()).main),[]);
    });
    await t.test('comment-only security body drift is held for review rather than called semantically equivalent', async () => {
      const row=(await f.pg.query("SELECT pg_get_functiondef(oid) AS definition,prosrc FROM pg_proc WHERE oid='private.es_superadmin()'::regprocedure")).rows[0];
      await f.pg.exec(row.definition.replace(row.prosrc,row.prosrc+'\n-- Synthetic operator comment drift\n'));
      assert.ok(failed((await reports()).main).includes('canonical_security_function_bodies'));
      await f.pg.exec(row.definition);assert.deepEqual(failed((await reports()).main),[]);
    });
    await t.test('private JSON helper search_path drift is vetoed without relying on body hashes alone', async () => {
      await mutateThenCheck("ALTER FUNCTION private.aportacio_cultural_json(public.aportacions_culturals) SET search_path='public,pg_catalog'",'canonical_security_function_bodies');
      await mutateThenCheck('ALTER FUNCTION private.aportacio_cultural_json(public.aportacions_culturals) RESET ALL','canonical_security_function_bodies');
      await f.pg.exec("ALTER FUNCTION private.aportacio_cultural_json(public.aportacions_culturals) SET search_path='' ");
      assert.deepEqual(failed((await reports()).main),[]);
    });
    await t.test('a valid named btree index with WHERE false cannot pass as full contribution coverage', async () => {
      await mutateThenCheck('DROP INDEX public.aportacions_culturals_usuari_data; CREATE INDEX aportacions_culturals_usuari_data ON public.aportacions_culturals(usuari_id,creat_a DESC) WHERE false','contribution_user_date_index');
      await f.pg.exec('DROP INDEX public.aportacions_culturals_usuari_data; CREATE INDEX aportacions_culturals_usuari_data ON public.aportacions_culturals(usuari_id,creat_a DESC)');
      assert.deepEqual(failed((await reports()).main),[]);
    });
    await t.test('privacy body bypass and conditional or AFTER triggers cannot masquerade as immutable policy enforcement', async () => {
      const definition=(await f.pg.query("SELECT pg_get_functiondef('private.politiques_immutables()'::regprocedure) AS value")).rows[0].value;
      const trigger=(await f.pg.query("SELECT pg_get_triggerdef(oid) AS value FROM pg_trigger WHERE tgrelid='public.politiques_privacitat'::regclass AND tgname='trg_politiques_immutables'")).rows[0].value;
      const original=(await f.pg.query("SELECT text_complet,text_sha256 FROM public.politiques_privacitat WHERE versio='2.5'")).rows[0];
      const mutant=definition.replace('if old.text_sha256 is not null and (','if false and old.text_sha256 is not null and (');
      assert.notEqual(mutant,definition);await f.pg.exec(mutant);
      const unsafe=(await reports()).main;
      assert.equal(unsafe.checks.find(c=>c.id==='privacy_append_only_trigger').ok,true,'Exact trigger metadata cannot replace an exact function-body check.');
      assert.ok(failed(unsafe).includes('canonical_security_function_bodies'));assert.equal(unsafe.valid,false);
      await f.pg.exec("UPDATE public.politiques_privacitat SET text_complet='UNSAFE SYNTHETIC MUTANT',text_sha256=encode(sha256(convert_to('UNSAFE SYNTHETIC MUTANT','UTF8')),'hex') WHERE versio='2.5'");
      assert.equal((await f.pg.query("SELECT text_complet FROM public.politiques_privacitat WHERE versio='2.5'")).rows[0].text_complet,'UNSAFE SYNTHETIC MUTANT');
      await f.pg.query("UPDATE public.politiques_privacitat SET text_complet=$1,text_sha256=$2 WHERE versio='2.5'",[original.text_complet,original.text_sha256]);
      await f.pg.exec(definition);
      for(const replacement of [trigger.replace(' BEFORE ',' AFTER '),trigger.replace(' EXECUTE ',' WHEN (false) EXECUTE '),trigger.replace(' UPDATE ',' UPDATE OF url ')]) {
        assert.notEqual(replacement,trigger);
        await f.pg.exec('DROP TRIGGER trg_politiques_immutables ON public.politiques_privacitat;'+replacement);
        assert.ok(failed((await reports()).main).includes('privacy_append_only_trigger'));
        await f.pg.exec('DROP TRIGGER trg_politiques_immutables ON public.politiques_privacitat;'+trigger);
      }
      assert.deepEqual(failed((await reports()).main),[]);
    });
    await t.test('policy2.5 with a noncanonical future effective date is vetoed despite matching content and hash', async () => {
      const setDate=async date=>{
        await f.pg.exec('ALTER TABLE public.politiques_privacitat DISABLE TRIGGER trg_politiques_immutables');
        await f.pg.query("UPDATE public.politiques_privacitat SET vigent_des_de=$1 WHERE versio='2.5'",[date]);
        await f.pg.exec('ALTER TABLE public.politiques_privacitat ENABLE TRIGGER trg_politiques_immutables');
      };
      await setDate('2100-01-01T00:00:00Z');
      const r=await reports();assert.equal(r.main.valid,true);assert.equal(r.policy.valid,false);
      await setDate('2026-11-05T23:00:00Z');assert.equal((await reports()).policy.valid,true);
    });
    const snapshots = async () => (await f.pg.query('SELECT versio,text_sha256,text_complet,vigent_des_de,url FROM public.politiques_privacitat ORDER BY versio')).rows;
    const before = await snapshots();
    await t.test('actual2611080440 is append-only/idempotent; old sealed rows and hashes remain exact', async () => {
      await f.pg.exec(privacy); await f.pg.exec(privacy);
      const after = await snapshots(); assert.deepEqual(after.filter(r=>r.versio!=='2.6'),before);
      const r = await reports(); assert.equal(r.policy.valid,true); assert.equal(r.policy.migration2611080440,'present');
      await assert.rejects(f.pg.exec("UPDATE public.politiques_privacitat SET text_complet='changed' WHERE versio='2.5'"),denied);
      await assert.rejects(f.pg.exec("DELETE FROM public.politiques_privacitat WHERE versio='2.6'"),denied);
      // An existing2.6 row with wrong URL must veto the canonical idempotent insert.
      await f.pg.exec("UPDATE public.politiques_privacitat SET url='/wrong' WHERE versio='2.6'");
      assert.equal((await reports()).policy.valid,false);
      await assert.rejects(f.pg.exec(privacy),denied); await f.pg.exec('ROLLBACK');
      await f.pg.exec("UPDATE public.politiques_privacitat SET url='/legal' WHERE versio='2.6'");
      assert.equal((await reports()).policy.valid,true);
    });
    await t.test('read-only verifier preserves rows and functions and cannot be used as a migration', async () => {
      const rows = await snapshots();
      const defs = (await f.pg.query("SELECT pg_get_functiondef('public.revisa_aportacio_cultural(uuid,text,text)'::regprocedure) AS def")).rows;
      const r = await reports(); assert.equal(r.main.valid,true); assert.equal(r.main.transactionReadOnly,true);
      assert.deepEqual(await snapshots(),rows);
      assert.deepEqual((await f.pg.query("SELECT pg_get_functiondef('public.revisa_aportacio_cultural(uuid,text,text)'::regprocedure) AS def")).rows,defs);
      await assert.rejects(f.pg.exec('BEGIN READ ONLY; CREATE TABLE public.r15_forbidden(id integer);'),e=>e.code==='25006');
      await f.pg.exec('ROLLBACK');
    });
  } finally { await f.close(); }
});
