/**
 * FEDI-16 · Regressió SQL sobre les migracions reals fins a 2611031700.
 * Executar des de l’arrel del repositori. Opt-in explícit:
 *   SDP_PGLITE_MODULE=/ruta/existent/pglite/dist/index.js node --test tests/administracio-multipoble-postgres.test.mjs
 * També admet file:///.../dist/index.js. No busca paquets ni instal·la res.
 * Sense el mòdul indicat, només informa d’una omissió: cap SQL validat.
 * Auth.uid/jwt/roles, Storage i Realtime són fixtures d’infraestructura;
 * el helper d’autoritat, les taules, les RLS i les RPC són migracions reals.
 * Les concessions ambientals de Supabase i GoTrue no es certifiquen ací.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test, { after, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const entrada = process.env.SDP_PGLITE_MODULE?.trim() || '';
let moduleURL = null;
if (entrada) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(entrada) && !entrada.startsWith('file:')) {
    throw new TypeError('SDP_PGLITE_MODULE només admet una ruta local o file URL.');
  }
  moduleURL = entrada.startsWith('file:') ? new URL(entrada) : pathToFileURL(path.resolve(entrada));
  if (moduleURL.search || moduleURL.hash) throw new TypeError('El mòdul local no admet query ni fragment.');
}
const modulePath = moduleURL ? fileURLToPath(moduleURL) : null;
if (!modulePath || !fs.existsSync(modulePath)) {
  test('FEDI-04 · PostgreSQL en memòria necessita un PGlite existent i explícit', {
    skip: entrada ? 'El mòdul indicat no existix; no s’ha executat cap migració.' : 'Falta SDP_PGLITE_MODULE; no s’ha executat cap migració.'
  }, () => {});
} else {
  assert.equal(fs.statSync(modulePath).isFile(), true, 'SDP_PGLITE_MODULE ha d’apuntar al fitxer d’entrada del mòdul.');
  const {
    PGlite
  } = await import(moduleURL.href);
  const {
    pgcrypto
  } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
  assert.equal(typeof PGlite, 'function', 'El mòdul indicat no exporta PGlite.');
  const packageURL = new URL('../package.json', moduleURL);
  const packageVersion = fs.existsSync(packageURL) ? JSON.parse(fs.readFileSync(packageURL, 'utf8')).version ?? null : null;
  const ROOT = process.cwd(),
    MIG = 'supabase/migrations';
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const { capcalera, dependenciesDeclarades, llegixOrdre, ordena } = await import(pathToFileURL(path.join(ROOT, 'scripts/supabase/verifica-migracions.mjs')).href);
  const ordrePath = path.join(ROOT, 'supabase/ordre_desplegament.json');
  const ordreBytes = fs.readFileSync(ordrePath);
  const inventari = fs.readdirSync(path.join(ROOT, MIG)).filter(f => /^\d{10}_.+\.sql$/.test(f)).sort();
  const versions = inventari.map(f => f.slice(0, 10));
  assert.equal(new Set(versions).size, versions.length, 'No s’admeten versions SQL duplicades.');
  const ordreDeclarat = llegixOrdre(ordreBytes.toString('utf8'), new Set(versions));
  const dependencies = new Map(inventari.map(file => {
    const versio = file.slice(0, 10);
    return [versio, dependenciesDeclarades(capcalera(fs.readFileSync(path.join(ROOT, MIG, file), 'utf8')), versio).filter(d => d.versio < versio).map(d => d.versio)];
  }));
  const pla = ordena({ versions, dependencies, restriccions: ordreDeclarat.restriccions, portes: ordreDeclarat.portes });
  assert.deepEqual(pla.errors, [], 'No s’executa SQL amb un ordre inconsistent.');
  const files = pla.ordre.filter(p => p.tipus === 'migracio').map(p => inventari.find(file => file.startsWith(p.id + '_')));
  assert.equal(files.length, inventari.length);
  assert.ok(files.every(Boolean));
  for (const r of ordreDeclarat.restriccions) {
    const abans = files.findIndex(f => f.startsWith(r.abans + '_'));
    const despres = files.findIndex(f => f.startsWith(r.despres + '_'));
    assert.ok(abans < despres, `${r.abans} ha d’anar abans de ${r.despres}`);
    if (r.just) assert.equal(despres, abans + 1, `${r.despres} ha d’anar immediatament després de ${r.abans}`);
  }
  const captures = files.map(file => {
    const bytes = fs.readFileSync(path.join(ROOT, MIG, file));
    return {
      file,
      bytes: bytes.length,
      sha256: sha(bytes),
      sql: bytes.toString('utf8')
    };
  });
  for (const requerida of ['2610061448_superadmin_aal2.sql', '2610101900_personalitzacio_superadmin.sql', '2611031700_administracio_multipoble.sql']) {
    assert.ok(files.includes(requerida), 'Dependència SQL real absent: ' + requerida);
  }
  // Substituts declarats de la infraestructura; no substituïxen private.es_superadmin.
  const bootstrap = "-- Només substituts de la infraestructura auth/rols de Supabase; cap taula\n-- d'organitzacions o de pertinences es redefineix en esta fixture.\nCREATE ROLE anon NOLOGIN;\nCREATE ROLE authenticated NOLOGIN;\nCREATE ROLE service_role NOLOGIN BYPASSRLS;\nCREATE SCHEMA auth;\nCREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb NOT NULL DEFAULT '{}');\nCREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;\nGRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;\nGRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;\nCREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;\nCREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'authenticated')$$;\nCREATE TABLE auth.sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE);\nALTER TABLE auth.users ADD COLUMN banned_until timestamptz;\nALTER TABLE auth.users ADD COLUMN email_confirmed_at timestamptz;\nCREATE SCHEMA storage;\nCREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);\nCREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text REFERENCES storage.buckets(id),name text,owner uuid,owner_id text,metadata jsonb,version text,created_at timestamptz DEFAULT now(),UNIQUE(bucket_id,name));\nALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;\nCREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;\nCREATE FUNCTION storage.operation() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('storage.operation',true)$$;\nGRANT USAGE ON SCHEMA storage TO anon,authenticated,service_role;\nGRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;\nCREATE SCHEMA realtime;\nCREATE TABLE realtime.messages(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,extension text,topic text,payload jsonb);\nALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;\nCREATE FUNCTION realtime.topic() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('realtime.topic',true)$$;\n-- No emissor de xarxa: els avisos de Realtime són infraestructura fora de l'assaig.\n";
  describe('FEDI-16 · administració multipoble en PostgreSQL WASM local', {
    concurrency: false
  }, () => {
    const T1 = '00000000-0000-4000-8000-000000000101',
      T2 = '00000000-0000-4000-8000-000000000102';
    const SA = '00000000-0000-4000-8000-000000000001',
      ADM = '00000000-0000-4000-8000-000000000002',
      VEI = '00000000-0000-4000-8000-000000000003',
      MOD = '00000000-0000-4000-8000-000000000004',
      ADMB = '00000000-0000-4000-8000-000000000005';
    let db;
    const applied = [],
      errors = [];
    async function com(uid, aal, fn, rol = 'authenticated', claims = {}) {
      await db.exec('BEGIN');
      try {
        await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [uid ?? '']);
        await db.query("SELECT set_config('request.jwt.claim.role',$1,true)", [rol]);
        await db.query("SELECT set_config('request.jwt.claims',$1,true)", [JSON.stringify(uid ? {
          ...claims,
          sub: uid,
          aal,
          role: rol
        } : {
          role: rol
        })]);
        await db.exec('SET LOCAL ROLE ' + rol);
        const result = await fn();
        await db.exec('COMMIT');
        return result;
      } catch (e) {
        await db.exec('ROLLBACK');
        throw e;
      }
    }
    const rebutja = (promise, codi) => assert.rejects(promise, error => {
      assert.equal(error.code, codi, error.message);
      return true;
    });
    const llista = () => db.query('SELECT * FROM public.admin_llista_pobles()');
    const llig = t => db.query('SELECT public.admin_llegix_personalitzacio($1) AS resultat', [t]);
    before(async () => {
      db = new PGlite({
        extensions: {
          pgcrypto
        }
      });
      await db.exec(bootstrap);
      for (const file of files) {
        try {
          await db.exec(captures.find(c => c.file === file).sql);
          applied.push(file);
        } catch (e) {
          errors.push({
            file,
            code: e.code,
            message: e.message
          });
          await db.exec('ROLLBACK').catch(() => {});
        }
      }
      assert.deepEqual(errors, [], 'No validar l’RPC sobre un catàleg incomplet');
      await db.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'sella','Sella'),($2,'xixona','Xixona') ON CONFLICT DO NOTHING", [T1, T2]);
      for (const [u, t] of [[SA, T1], [ADM, T1], [VEI, T1], [MOD, T2], [ADMB, T2]]) await db.query("INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)", [u, 'fixture-' + u.slice(-1) + '@example.test', {
        tenant_id: t,
        name: 'Persona de prova',
        rgpd: true
      }]);
      await db.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin'),($2,'moderador') ON CONFLICT(user_id) DO UPDATE SET role=excluded.role", [SA, MOD]);
      await db.query("INSERT INTO public.town_memberships(town_id,user_id,role) VALUES($1,$2,'admin') ON CONFLICT(town_id,user_id) DO UPDATE SET role='admin'", [T1, ADM]);
      await db.query("INSERT INTO public.town_memberships(town_id,user_id,role) VALUES($1,$2,'admin') ON CONFLICT(town_id,user_id) DO UPDATE SET role='admin'", [T2, ADMB]);
      for (const [t, k, p] of [[T1, 'taxonomia', {
        categories: ['A']
      }], [T1, 'estil', {
        tokens: {}
      }], [T2, 'taxonomia', {
        categories: ['B']
      }], [T2, 'estil', { tokens: { poble: 'B' } }], [T2, 'agents', {
        privat: 'sentinella-no-publica'
      }]]) await db.query("INSERT INTO public.app_content(tenant_id,key,payload,version) VALUES($1,$2,$3,7) ON CONFLICT(tenant_id,key) DO UPDATE SET payload=excluded.payload", [t, k, p]);
      for (const t of [T1, T2]) for (const k of ['taxonomia', 'estil']) {
        await db.query('INSERT INTO public.app_content_historial(tenant_id,key,payload,version,autor) SELECT tenant_id,key,payload,version,$3 FROM public.app_content WHERE tenant_id=$1 AND key=$2', [t, k, SA]);
      }
    });
    after(async () => {
      const resultat = db ? await db.query('SELECT version() AS version').catch(() => null) : null;
      await db?.close();
      const sourcesStillEqual = captures.every(c => sha(fs.readFileSync(path.join(ROOT, MIG, c.file))) === c.sha256);
      const resum = {
        prova: 'administracio-multipoble-postgres',
        timestamp: new Date().toISOString(),
        runtime: {
          package: '@electric-sql/pglite',
          version: packageVersion,
          moduleSha256: sha(fs.readFileSync(modulePath)),
          postgres: resultat?.rows[0]?.version ?? null
        },
        scope: 'PostgreSQL WASM en memòria; Auth/Storage/Realtime de fixture. Cap prova de GoTrue, servidor remot o desplegament.',
        bootstrapSha256: sha(bootstrap),
        migrations: captures.map(({ file, bytes, sha256 }) => ({ file, bytes, sha256 })),
        applied: applied.length,
        appliedFiles: applied,
        ordreSha256: sha(ordreBytes),
        ordreStillEqual: sha(fs.readFileSync(ordrePath)) === sha(ordreBytes),
        portesDeDesplegament: 'Només ordenades; no s’ha desplegat cap client ni funció externa.',
        errors,
        sourcesStillEqual
      };
      console.log(JSON.stringify(resum));
      assert.equal(sha(fs.readFileSync(ordrePath)), sha(ordreBytes), 'L’ordre declarat ha canviat durant l’assaig.');
      assert.equal(sourcesStillEqual, true, 'Les fonts SQL han canviat durant l’assaig; resultat no atribuïble al mateix catàleg.');
    });
    test('les 79 migracions completes (R9: amb el segell de /legal 2.5) s’apliquen amb l’ordre canònic 1800 → 2000 → 1900', () => {
      assert.deepEqual(errors, []);
      assert.equal(captures.length, 79);
      assert.deepEqual(applied, files);
      assert.deepEqual(files.filter(f => /^(2610311800|2610311900|2610312000)_/.test(f)).map(f => f.slice(0, 10)), ['2610311800', '2610312000', '2610311900']);
    });
    test('la funció d’autoritat és exactament la migració real amb rol i aal2', async () => {
      const def = (await db.query("SELECT pg_get_functiondef('private.es_superadmin()'::regprocedure) AS definicio")).rows[0].definicio;
      assert.match(def, /r\.role = 'superadmin'/);
      assert.match(def, /auth\.jwt\(\)/);
      assert.match(def, /'aal2'/);
      assert.equal((await com(SA, 'aal1', () => db.query('SELECT private.es_superadmin() AS valor'))).rows[0].valor, false);
      assert.equal((await com(SA, 'aal2', () => db.query('SELECT private.es_superadmin() AS valor'))).rows[0].valor, true);
    });
    test('ACL, SECURITY DEFINER, volatilitat i search_path de les dues RPC', async () => {
      const r = (await db.query("SELECT p.proname,p.prosecdef,p.provolatile,p.proconfig,EXISTS (SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) AS a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') AS public,has_function_privilege('anon',p.oid,'EXECUTE') AS anon,has_function_privilege('authenticated',p.oid,'EXECUTE') AS autenticat,has_function_privilege('service_role',p.oid,'EXECUTE') AS servei FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN('admin_llista_pobles','admin_llegix_personalitzacio') ORDER BY 1")).rows;
      assert.equal(r.length, 2);
      for (const f of r) {
        assert.equal(f.prosecdef, true);
        assert.equal(f.provolatile, 's');
        assert.deepEqual(f.proconfig, ['search_path=""']);
        assert.equal(f.public, false);
        assert.equal(f.anon, false);
        assert.equal(f.autenticat, true);
        assert.equal(f.servei, false);
      }
    });
    for (const rol of ['anon', 'service_role']) test(rol + ' sense concessió explícita no executa cap RPC', async () => {
      await rebutja(com(null, null, llista, rol), '42501');
      await rebutja(com(null, null, () => llig(T2), rol), '42501');
    });
    test('una concessió ambiental a service_role no substituïx uid, rol superadmin i aal2', async () => {
      // Simula el possible GRANT per defecte de la infraestructura; no és de la migració.
      await db.exec('BEGIN');
      try {
        await db.exec('GRANT EXECUTE ON FUNCTION public.admin_llista_pobles(),public.admin_llegix_personalitzacio(uuid) TO service_role');
        await db.query("SELECT set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claims',$1,true)", [JSON.stringify({
          role: 'service_role'
        })]);
        await db.exec('SET LOCAL ROLE service_role');
        await assert.rejects(llista(), e => e.code === '42501' && e.message.includes('SDP-ADMIN-003'));
      } finally {
        await db.exec('ROLLBACK');
      }
    });
    for (const [nom, u, aal] of [['veí', VEI, 'aal2'], ['admin municipal', ADM, 'aal2'], ['moderador', MOD, 'aal2'], ['superadmin aal1', SA, 'aal1'], ['superadmin sense claim aal', SA, null], ['authenticated sense uid', null, null]]) {
      test(nom + ' no llista ni llig A/B ni muta l’altre poble', async () => {
        await rebutja(com(u, aal, llista), '42501');
        for (const t of [T1, T2]) await rebutja(com(u, aal, () => llig(t)), '42501');
        await rebutja(com(u, aal, () => db.query("SELECT public.admin_desa_contingut($1,'taxonomia',$2,7)", [T2, {
          categories: ['no-autoritzat']
        }])), '42501');
      });
    }
    test('superadmin aal2 llista pobles reals i llig només claus/tenant sol·licitats', async () => {
      const l = (await com(SA, 'aal2', llista)).rows;
      assert.ok(l.some(t => t.id === T1));
      assert.ok(l.some(t => t.id === T2));
      assert.deepEqual(l.filter(t => [T1, T2].includes(t.id)).map(t => t.slug), ['sella', 'xixona']);
      for (const [t, nom] of [[T1, 'A'], [T2, 'B']]) {
        const r = (await com(SA, 'aal2', () => llig(t))).rows[0].resultat;
        assert.equal(r.tenantId, t);
        assert.deepEqual(r.files.map(f => f.key), ['estil', 'taxonomia']);
        assert.deepEqual(r.files.find(f => f.key === 'taxonomia').payload, {
          categories: [nom]
        });
        assert.ok(!JSON.stringify(r).includes('sentinella-no-publica'));
      }
    });
    test('uid/MFA autoritzats no converteixen un tenant absent, null o UUID invàlid en reserva', async () => {
      for (const t of [null, '00000000-0000-4000-8000-000000009999']) await rebutja(com(SA, 'aal2', () => llig(t)), '22023');
      await rebutja(com(SA, 'aal2', () => llig('no-es-uuid')), '22P02');
    });
    test('admin municipal no escriu directament dades de B i la sentinella queda intacta', async () => {
      try {
        const r = await com(ADM, 'aal2', () => db.query("UPDATE public.app_content SET payload='{}' WHERE tenant_id=$1 RETURNING key", [T2]));
        assert.equal(r.rows.length, 0);
      } catch (e) {
        assert.equal(e.code, '42501');
      }
      const r = (await db.query("SELECT payload FROM public.app_content WHERE tenant_id=$1 AND key='taxonomia'", [T2])).rows[0];
      assert.deepEqual(r.payload, {
        categories: ['B']
      });
    });
    test('les polítiques públiques deixen taxonomia/estil i oculten agents', async () => {
      for (const rol of ['anon', 'authenticated']) {
        const r = (await com(null, null, () => db.query('SELECT tenant_id,key FROM public.app_content WHERE tenant_id=$1 ORDER BY key', [T2]), rol)).rows;
        assert.deepEqual(r.map(x => x.key), ['estil', 'taxonomia']);
      }
    });
    test('RPC existent desa i historitza B només amb superadmin aal2 i versió exacta', async () => {
      const r = (await com(SA, 'aal2', () => db.query("SELECT public.admin_desa_contingut($1,'taxonomia',$2,7) AS resultat", [T2, {
        categories: ['B-revisada']
      }]))).rows[0].resultat;
      assert.equal(r.version, 8);
      const h = (await com(SA, 'aal2', () => db.query("SELECT * FROM public.admin_historial_contingut($1,'taxonomia')", [T2]))).rows;
      assert.equal(h[0].tenant_id, T2);
      assert.equal(h[0].autor, SA);
      assert.equal(h[0].version, 8);
      await rebutja(com(SA, 'aal2', () => db.query("SELECT public.admin_desa_contingut($1,'taxonomia',$2,7)", [T2, {
        categories: ['obsoleta']
      }])), 'PT409');
      const a = (await db.query("SELECT payload FROM public.app_content WHERE tenant_id=$1 AND key='taxonomia'", [T1])).rows[0];
      assert.deepEqual(a.payload, {
        categories: ['A']
      });
    });
    const claus = ['taxonomia', 'estil'];
    const actorsDenegats = [
      ['veí', VEI, 'aal2', 'authenticated'], ['admin A', ADM, 'aal2', 'authenticated'],
      ['admin B', ADMB, 'aal2', 'authenticated'], ['moderador', MOD, 'aal2', 'authenticated'],
      ['superadmin aal1', SA, 'aal1', 'authenticated'], ['superadmin sense aal', SA, null, 'authenticated'],
      ['authenticated sense uid', null, null, 'authenticated'], ['anon', null, null, 'anon'],
      ['service_role sense concessió', null, null, 'service_role']
    ];
    const desa = (t, k, payload, versio) => db.query('SELECT public.admin_desa_contingut($1,$2,$3,$4) AS resultat', [t, k, payload, versio]);
    const historia = (t, k) => db.query('SELECT * FROM public.admin_historial_contingut($1,$2)', [t, k]);
    const instantania = async () => ({
      contingut: (await db.query('SELECT tenant_id,key,payload,version,updated_at FROM public.app_content WHERE tenant_id IN($1,$2) ORDER BY tenant_id,key', [T1, T2])).rows,
      historial: (await db.query('SELECT id,tenant_id,key,payload,version,autor,creat FROM public.app_content_historial WHERE tenant_id IN($1,$2) ORDER BY id', [T1, T2])).rows,
      autoritat: (await db.query('SELECT user_id,role,granted_by FROM public.user_platform_roles ORDER BY user_id')).rows
    });
    const intacta = async (abans, missatge) => assert.deepEqual(await instantania(), abans, missatge);
    const capFilaO42501 = async promise => {
      let resultat;
      try { resultat = await promise; } catch (e) { assert.equal(e.code, '42501', e.message); return; }
      assert.deepEqual(resultat.rows, [], 'DML sense autoritat ha afectat files');
    };

    test('RLS activa i concessions explícites en contingut, historial i rols de plataforma', async () => {
      const r = (await db.query("SELECT relname,relrowsecurity FROM pg_class WHERE oid IN('public.app_content'::regclass,'public.app_content_historial'::regclass,'public.user_platform_roles'::regclass) ORDER BY relname")).rows;
      assert.equal(r.length, 3);
      assert.ok(r.every(x => x.relrowsecurity));
      const acl = (await db.query("SELECT has_table_privilege('anon','public.app_content_historial','SELECT') AS anon_hist,has_table_privilege('authenticated','public.app_content_historial','SELECT') AS auth_hist,has_table_privilege('authenticated','public.app_content_historial','INSERT,UPDATE,DELETE') AS auth_hist_dml,has_table_privilege('authenticated','public.user_platform_roles','INSERT,UPDATE,DELETE') AS auth_roles_dml")).rows[0];
      assert.deepEqual(acl, { anon_hist: false, auth_hist: true, auth_hist_dml: false, auth_roles_dml: false });
      const rpc = (await db.query("SELECT proname,prosecdef,proconfig,has_function_privilege('anon',oid,'EXECUTE') AS anon,has_function_privilege('authenticated',oid,'EXECUTE') AS auth,has_function_privilege('service_role',oid,'EXECUTE') AS service FROM pg_proc WHERE oid IN('public.admin_llista_pobles()'::regprocedure,'public.admin_llegix_personalitzacio(uuid)'::regprocedure,'public.admin_desa_contingut(uuid,text,jsonb,integer)'::regprocedure,'public.admin_historial_contingut(uuid,text)'::regprocedure)")).rows;
      assert.equal(rpc.length, 4);
      for (const f of rpc) { assert.equal(f.prosecdef, true); assert.deepEqual(f.proconfig, ['search_path=""']); assert.equal(f.anon, false); assert.equal(f.auth, true); assert.equal(f.service, false); }
    });

    for (const [nom, uid, aal, rol] of actorsDenegats) {
      test(`${nom}: RPC de lectura, escriptura i historial denegades en A/B × taxonomia/estil`, async () => {
        const abans = await instantania();
        await rebutja(com(uid, aal, llista, rol), '42501');
        for (const t of [T1, T2]) {
          await rebutja(com(uid, aal, () => llig(t), rol), '42501');
          for (const k of claus) {
            await rebutja(com(uid, aal, () => desa(t, k, { atac: nom }, 7), rol), '42501');
            await rebutja(com(uid, aal, () => historia(t, k), rol), '42501');
          }
        }
        await intacta(abans, 'Una RPC denegada ha alterat dades, versions, historial o autoritat');
      });
      test(`${nom}: INSERT/UPDATE/DELETE directes i historial no alteren A/B × taxonomia/estil`, async () => {
        const abans = await instantania();
        for (const t of [T1, T2]) for (const k of claus) {
          await rebutja(com(uid, aal, () => db.query("INSERT INTO public.app_content(tenant_id,key,payload,version) VALUES($1,$2,$3,99) ON CONFLICT(tenant_id,key) DO UPDATE SET payload=excluded.payload,version=excluded.version RETURNING key", [t, k, { atac: 'insert directe' }]), rol), '42501');
          await capFilaO42501(com(uid, aal, () => db.query("UPDATE public.app_content SET payload=$3,version=99 WHERE tenant_id=$1 AND key=$2 RETURNING key", [t, k, { atac: 'update directe' }]), rol));
          await capFilaO42501(com(uid, aal, () => db.query('DELETE FROM public.app_content WHERE tenant_id=$1 AND key=$2 RETURNING key', [t, k]), rol));
          await rebutja(com(uid, aal, () => db.query('INSERT INTO public.app_content_historial(tenant_id,key,payload,version,autor) VALUES($1,$2,$3,99,$4)', [t, k, { atac: 'historial insert' }, SA]), rol), '42501');
          await rebutja(com(uid, aal, () => db.query("UPDATE public.app_content_historial SET payload=$3 WHERE tenant_id=$1 AND key=$2 RETURNING id", [t, k, { atac: 'historial update' }]), rol), '42501');
          await rebutja(com(uid, aal, () => db.query('DELETE FROM public.app_content_historial WHERE tenant_id=$1 AND key=$2 RETURNING id', [t, k]), rol), '42501');
          const lectura = com(uid, aal, () => db.query('SELECT * FROM public.app_content_historial WHERE tenant_id=$1 AND key=$2', [t, k]), rol);
          if (rol === 'authenticated') assert.deepEqual((await lectura).rows, [], 'Historial privat filtrat a un actor no autoritzat');
          else await rebutja(lectura, '42501');
          await intacta(abans, 'Un atac DML o una lectura privada ha alterat les sentinelles');
        }
      });
    }

    test('claims i metadata que diuen superadmin no substituïxen la fila de rol del servidor', async () => {
      const abans = await instantania();
      const claims = { user_metadata: { role: 'superadmin', superadmin: true, tenant_id: T2, aal: 'aal2' }, app_metadata: { platform_role: 'superadmin', roles: ['superadmin'] }, platform_role: 'superadmin' };
      await rebutja(com(VEI, 'aal2', llista, 'authenticated', claims), '42501');
      for (const t of [T1, T2]) for (const k of claus) {
        await rebutja(com(VEI, 'aal2', () => desa(t, k, { atac: 'metadata forjada' }, 7), 'authenticated', claims), '42501');
        await rebutja(com(VEI, 'aal2', () => historia(t, k), 'authenticated', claims), '42501');
      }
      await rebutja(com(VEI, 'aal2', () => db.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin')", [VEI])), '42501');
      await intacta(abans, 'La suplantació de metadata ha concedit autoritat o ha mutat dades');
    });

    test('GRANT ambiental a service_role no substituïx uid, rol real i aal2 en les quatre RPC', async () => {
      const abans = await instantania();
      const signatures = 'public.admin_llista_pobles(),public.admin_llegix_personalitzacio(uuid),public.admin_desa_contingut(uuid,text,jsonb,integer),public.admin_historial_contingut(uuid,text)';
      await db.exec('GRANT EXECUTE ON FUNCTION ' + signatures + ' TO service_role');
      try {
        for (const [uid, aal] of [[null, null], [VEI, 'aal2'], [SA, 'aal1'], [SA, null]]) {
          await rebutja(com(uid, aal, llista, 'service_role'), '42501');
          for (const t of [T1, T2]) for (const k of claus) {
            await rebutja(com(uid, aal, () => llig(t), 'service_role'), '42501');
            await rebutja(com(uid, aal, () => desa(t, k, { atac: 'grant ambiental' }, 7), 'service_role'), '42501');
            await rebutja(com(uid, aal, () => historia(t, k), 'service_role'), '42501');
          }
        }
      } finally { await db.exec('REVOKE EXECUTE ON FUNCTION ' + signatures + ' FROM service_role'); }
      await intacta(abans, 'Una concessió ambiental ha alterat dades sense identitat autoritzada');
    });

    test('superadmin aal2 desa A/B × taxonomia/estil i cada versió només modifica el seu tenant i clau', async () => {
      for (const t of [T1, T2]) for (const k of claus) {
        const abans = await instantania();
        const original = abans.contingut.find(f => f.tenant_id === t && f.key === k);
        const payload = { validat: true, poble: t, clau: k };
        const valor = (await com(SA, 'aal2', () => desa(t, k, payload, original.version))).rows[0].resultat;
        assert.deepEqual(valor, { key: k, payload, version: original.version + 1 });
        const despres = await instantania();
        assert.deepEqual(despres.contingut.filter(f => f.tenant_id !== t || f.key !== k), abans.contingut.filter(f => f.tenant_id !== t || f.key !== k));
        assert.deepEqual(despres.autoritat, abans.autoritat);
        assert.equal(despres.historial.length, abans.historial.length + 1);
        const nova = despres.historial.at(-1);
        assert.equal(nova.tenant_id, t); assert.equal(nova.key, k); assert.equal(nova.autor, SA); assert.equal(nova.version, original.version + 1); assert.deepEqual(nova.payload, payload);
        const h = (await com(SA, 'aal2', () => historia(t, k))).rows;
        assert.ok(h.length >= 2, 'L’historial no ha conservat la sentinella anterior');
        assert.ok(h.every(f => f.tenant_id === t && f.key === k));
        assert.equal(h[0].version, original.version + 1);
        const estable = await instantania();
        await rebutja(com(SA, 'aal2', () => desa(t, k, { atac: 'versio obsoleta' }, original.version)), 'PT409');
        await intacta(estable, 'Un conflicte de versió ha alterat contingut o historial');
      }
    });

    test('migració1700 idempotent conserva revocacions d’execució', async () => {
      const sql = captures.find(c => c.file === '2611031700_administracio_multipoble.sql').sql;
      await db.exec(sql);
      await db.exec(sql);
      const r = (await db.query("SELECT has_function_privilege('anon','public.admin_llista_pobles()','EXECUTE') AS anon, has_function_privilege('service_role','public.admin_llista_pobles()','EXECUTE') AS servei")).rows[0];
      assert.equal(r.anon, false);
      assert.equal(r.servei, false);
    });
  });
}
