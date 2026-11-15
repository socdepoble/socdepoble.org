/**
 * R28 · D-R24.2-5 i D-R24.2-6 · La migració 20261115030000 (exportació RGPD i quotes
 * d'escriptura de les taules R23) sobre PostgreSQL WASM (PGlite), amb tot el catàleg real en
 * l'ordre del verificador (scripts/supabase/verifica-migracions.mjs: noms de 10 i de 14 xifres,
 * dependències de capçalera i restriccions d'ordre_desplegament.json). Opt-in explícit, com
 * tests/administracio-multipoble-postgres.test.mjs:
 *   SDP_PGLITE_MODULE=/ruta/existent/pglite/dist/index.js node --test tests/r28-rgpd-quotes-r23.test.mjs
 * També admet file:///.../dist/index.js. No busca paquets ni instal·la res. Sense el mòdul
 * indicat, només informa d'una omissió: cap SQL validat.
 * Auth/Storage/Realtime són fixtures d'infraestructura (les mateixes de la prova multipoble);
 * les taules, la RLS, els disparadors i l'RPC són les migracions reals. Les escriptures de
 * l'API van com PostgREST (json_populate_recordset amb el rol i el JWT de la petició); les del
 * servidor, sense cap petició (editor SQL). Cap servei remot.
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
  test('R28 · PostgreSQL en memòria necessita un PGlite existent i explícit', {
    skip: entrada ? 'El mòdul indicat no existix; no s’ha executat cap migració.' : 'Falta SDP_PGLITE_MODULE; no s’ha executat cap migració.'
  }, () => {});
} else {
  assert.equal(fs.statSync(modulePath).isFile(), true, 'SDP_PGLITE_MODULE ha d’apuntar al fitxer d’entrada del mòdul.');
  const { PGlite } = await import(moduleURL.href);
  const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
  assert.equal(typeof PGlite, 'function', 'El mòdul indicat no exporta PGlite.');

  const ROOT = process.cwd(), MIG = 'supabase/migrations';
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const { capcalera, comparaVersions, dependenciesDeclarades, llegixOrdre, ordena, versioDeFitxer } = await import(pathToFileURL(path.join(ROOT, 'scripts/supabase/verifica-migracions.mjs')).href);
  const ordreBytes = fs.readFileSync(path.join(ROOT, 'supabase/ordre_desplegament.json'));
  const inventari = fs.readdirSync(path.join(ROOT, MIG)).filter(f => /^(?:\d{10}|\d{14})_.+\.sql$/.test(f)).sort((a, b) => comparaVersions(versioDeFitxer(a), versioDeFitxer(b)) || a.localeCompare(b, 'en'));
  const versions = inventari.map(versioDeFitxer);
  assert.equal(new Set(versions).size, versions.length, 'No s’admeten versions SQL duplicades.');
  const ordreDeclarat = llegixOrdre(ordreBytes.toString('utf8'), new Set(versions));
  const dependencies = new Map(inventari.map(file => {
    const versio = versioDeFitxer(file);
    return [versio, dependenciesDeclarades(capcalera(fs.readFileSync(path.join(ROOT, MIG, file), 'utf8')), versio).filter(d => comparaVersions(d.versio, versio) < 0).map(d => d.versio)];
  }));
  const pla = ordena({ versions, dependencies, restriccions: ordreDeclarat.restriccions, portes: ordreDeclarat.portes });
  assert.deepEqual(pla.errors, [], 'No s’executa SQL amb un ordre inconsistent.');
  const files = pla.ordre.filter(p => p.tipus === 'migracio').map(p => inventari.find(file => file.startsWith(p.id + '_')));
  assert.equal(files.length, inventari.length);
  assert.ok(files.every(Boolean));
  const captures = new Map(files.map(file => {
    const bytes = fs.readFileSync(path.join(ROOT, MIG, file));
    return [file, { sha256: sha(bytes), sql: bytes.toString('utf8') }];
  }));

  const R28 = '20261115030000_r28_rgpd_exportacio_i_quotes_r23.sql';
  const DEPENDENCIES_R28 = ['2611070600', '20261114000100', '20261113233000', '20261114023000', '20261114171500'];
  const R23 = ['20261113233000', '20261114023000', '20261114171500'];
  const SQL_R28 = captures.get(R28)?.sql;

  /* Els mateixos substituts d'infraestructura que tests/administracio-multipoble-postgres.test.mjs. */
  const bootstrap = "CREATE ROLE anon NOLOGIN;\nCREATE ROLE authenticated NOLOGIN;\nCREATE ROLE service_role NOLOGIN BYPASSRLS;\nCREATE SCHEMA auth;\nCREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb NOT NULL DEFAULT '{}');\nCREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;\nGRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;\nGRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;\nCREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;\nCREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'authenticated')$$;\nCREATE TABLE auth.sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE);\nALTER TABLE auth.users ADD COLUMN banned_until timestamptz;\nALTER TABLE auth.users ADD COLUMN email_confirmed_at timestamptz;\nCREATE SCHEMA storage;\nCREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);\nCREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text REFERENCES storage.buckets(id),name text,owner uuid,owner_id text,metadata jsonb,version text,created_at timestamptz DEFAULT now(),UNIQUE(bucket_id,name));\nALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;\nCREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;\nCREATE FUNCTION storage.operation() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('storage.operation',true)$$;\nGRANT USAGE ON SCHEMA storage TO anon,authenticated,service_role;\nGRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;\nCREATE SCHEMA realtime;\nCREATE TABLE realtime.messages(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,extension text,topic text,payload jsonb);\nALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;\nCREATE FUNCTION realtime.topic() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('realtime.topic',true)$$;\n";

  /** Una base nova amb el bootstrap i els fitxers indicats, en l'ordre del pla. */
  async function creaBase(llista) {
    const db = new PGlite({ extensions: { pgcrypto } });
    await db.exec(bootstrap);
    const errors = [];
    for (const file of llista) {
      try { await db.exec(captures.get(file).sql); } catch (e) {
        errors.push({ file, code: e.code, message: e.message });
        await db.exec('ROLLBACK').catch(() => {});
      }
    }
    return { db, errors };
  }
  /** Una petició de l'API: rol i JWT locals a la transacció, com PostgREST. */
  async function com(db, who, sql, params = [], { role = who ? 'authenticated' : 'anon' } = {}) {
    await db.exec('BEGIN');
    try {
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claim.role',$2,true), set_config('request.jwt.claims',$3,true)",
        [who ?? '', role, JSON.stringify(who ? { sub: who, role, aal: 'aal1' } : { role })]);
      await db.exec('SET LOCAL ROLE ' + role);
      const r = await db.query(sql, params);
      await db.exec('COMMIT');
      return r;
    } catch (e) {
      await db.exec('ROLLBACK');
      throw e;
    }
  }
  /* PostgREST: les columnes són les claus del cos i les files venen de json_populate_recordset. */
  const insercio = (taula, filesCos, { conflicte = null, retorna }) => {
    const cols = Object.keys(filesCos[0]).join(', ');
    return [`with ins as (insert into public.${taula} (${cols}) select ${cols} from json_populate_recordset(null::public.${taula}, $1::json)
      ${conflicte ? `on conflict (${conflicte}) do nothing` : ''} returning ${retorna}) select coalesce(json_agg(ins), '[]'::json) as j from ins`,
    [JSON.stringify(filesCos)]];
  };
  const aportacio = (user, n, extra = {}) => ({
    user_id: user, tipus: 'variant_isoglossa', pregunta_id: 'q01_creilla', text_aportat: `Variant sintètica ${n}`,
    poble_comarca: 'La Torre de les Maçanes · L’Alacantí', poble: 'La Torre de les Maçanes', comarca_id: 'alacanti',
    abast_comarcal: 'nomes_poble', consentiment_arxiu_obert: true, consentiment_versio: 'cc-by-sa-4.0-v1',
    consentiment_acceptat_at: '2026-11-15T01:00:00.000Z', ...extra
  });
  const vot = (user, n, pregunta = 'q02_espencat') => ({ user_id: user, pregunta_id: pregunta, variant_clau: `v_${n}`, paraula_etiqueta: `V ${n}` });
  const aporta = (db, who, filesCos) => com(db, who, ...insercio('aportacions_veu_poble', filesCos, { retorna: 'id, estat_moderacio, created_at' })).then(r => r.rows[0].j);
  const vota = (db, who, filesCos) => com(db, who, ...insercio('joc_isoglosses_vots_consens', filesCos, { conflicte: 'user_id, pregunta_id, variant_clau', retorna: 'pregunta_id, variant_clau' })).then(r => r.rows[0].j);
  const exporta = (db, who) => com(db, who, 'SELECT public.exporta_les_meues_dades() AS e').then(r => r.rows[0].e);
  const quantes = async (db, taula, user) => (await db.query(`SELECT count(*)::int AS n FROM public.${taula} WHERE user_id=$1`, [user])).rows[0].n;
  const error = (codi, prefix) => e => {
    assert.equal(e.code, codi, e.message);
    if (prefix) assert.ok(e.message.startsWith(prefix), e.message);
    return true;
  };
  /* Servidor sense petició de l'API (editor SQL): el disparador no hi entra i created_at es conserva. */
  const servidorAportacions = (db, user, n, fa) => db.query(`INSERT INTO public.aportacions_veu_poble(user_id,tipus,pregunta_id,text_aportat,poble_comarca,consentiment_arxiu_obert,consentiment_versio,consentiment_acceptat_at,created_at)
    SELECT $1,'variant_isoglossa','q01_creilla','Variant del servidor '||g,'Poble sintètic',true,'cc-by-sa-4.0-v1',now(),now()-$3::interval FROM generate_series(1,$2) g`, [user, n, fa]);
  const servidorVots = (db, user, n, fa) => db.query(`INSERT INTO public.joc_isoglosses_vots_consens(user_id,pregunta_id,variant_clau,paraula_etiqueta,created_at)
    SELECT $1,'q03_bresquilla','servidor_'||lpad(g::text,4,'0'),'Servidor '||g,now()-$3::interval FROM generate_series(1,$2) g`, [user, n, fa]);
  const endarrereix = (db, taula, user, interval) => db.query(`UPDATE public.${taula} SET created_at=created_at-$2::interval WHERE user_id=$1`, [user, interval]);

  const TAULES_R23 = ['refranys_poble', 'aportacions_veu_poble', 'joc_isoglosses_vots_consens'];
  /** ACL de taula i de columna, RLS i polítiques de les tres taules R23. */
  async function permisos(db) {
    const q = async (sql, p = []) => (await db.query(sql, p)).rows;
    return {
      taules: await q(`SELECT c.relname, c.relacl::text AS acl, c.relrowsecurity AS rls, c.relforcerowsecurity AS forca FROM pg_class c
        WHERE c.oid IN ('public.refranys_poble'::regclass,'public.aportacions_veu_poble'::regclass,'public.joc_isoglosses_vots_consens'::regclass) ORDER BY 1`),
      columnes: await q(`SELECT a.attrelid::regclass::text AS taula, a.attname, a.attacl::text AS acl FROM pg_attribute a
        WHERE a.attrelid IN ('public.refranys_poble'::regclass,'public.aportacions_veu_poble'::regclass,'public.joc_isoglosses_vots_consens'::regclass)
          AND a.attnum > 0 AND NOT a.attisdropped ORDER BY 1,2`),
      politiques: await q(`SELECT tablename, policyname, cmd, roles::text, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename = ANY($1) ORDER BY 1,2`, [TAULES_R23])
    };
  }
  /** Funcions, disparadors i índexs que toca R28, i la base privada que no ha de tocar. */
  async function empremta(db) {
    const q = async (sql, p = []) => (await db.query(sql, p)).rows;
    return {
      funcions: await q(`SELECT p.oid::regprocedure::text AS sig, p.prosecdef, array_to_string(p.proconfig, ',') AS cfg, md5(p.prosrc) AS md5, p.proacl::text AS acl
        FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE (n.nspname,p.proname) IN (('private','aportacions_veu_poble_limita_ritme'),('private','joc_isoglosses_vots_limita_ritme'),('public','exporta_les_meues_dades'),('private','exporta_les_meues_dades_base_r33')) ORDER BY 1`),
      disparadors: await q(`SELECT tgrelid::regclass::text AS taula, tgname, tgenabled, tgtype, tgfoid::regprocedure::text AS funcio FROM pg_trigger
        WHERE NOT tgisinternal AND tgrelid = ANY(ARRAY['public.refranys_poble'::regclass,'public.aportacions_veu_poble'::regclass,'public.joc_isoglosses_vots_consens'::regclass]) ORDER BY 1,2`),
      index: await q(`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename = ANY($1) ORDER BY 1,2`, [TAULES_R23])
    };
  }
  const md5Funcio = async (db, sig) => (await db.query('SELECT md5(prosrc) AS m FROM pg_proc WHERE oid=to_regprocedure($1)', [sig])).rows[0]?.m ?? null;
  async function aplicaR28(db) {
    try { await db.exec(SQL_R28); } catch (e) { await db.exec('ROLLBACK').catch(() => {}); throw e; }
  }

  describe('R28 · exportació RGPD i quotes d’escriptura R23 en PostgreSQL WASM local', { concurrency: false }, () => {
    const id = n => `28000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
    const TOWN = id(1);
    const [ANNA, BERTA, CARME, DANI, ELNA, FERRAN, GINA, HUGO, IRENE] = [11, 12, 13, 14, 15, 16, 17, 18, 19].map(id);
    let db, errorsCataleg;
    const abans = {};
    let permisosAbans, empremta1, empremta2, baseAbans, exportaAbans;
    const propies = { ANNA: { aportacions: [], vots: [] }, BERTA: { aportacions: [], vots: [] } };

    before(async () => {
      assert.ok(SQL_R28, `la migració ${R28} és al catàleg`);
      ({ db, errors: errorsCataleg } = await creaBase(files.filter(f => f !== R28)));
      assert.deepEqual(errorsCataleg, [], 'No validar R28 sobre un catàleg incomplet');
      /* Camps reals de GoTrue que l'exportació llig i la fixture mínima no porta. */
      await db.exec('ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(); ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz');
      await db.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'r28-poble','Poble sintètic') ON CONFLICT DO NOTHING", [TOWN]);
      for (const [n, who] of [ANNA, BERTA, CARME, DANI, ELNA, FERRAN, GINA, HUGO, IRENE].entries()) {
        await db.query('INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,now(),$3)',
          [who, `r28-${n}@example.invalid`, { full_name: `Persona sintètica ${n}`, tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
      }
      /* Abans de R28: les escriptures de la targeta, sense cap quota. */
      for (const [nom, who, n] of [['ANNA', ANNA, 2], ['BERTA', BERTA, 1]]) {
        for (let k = 1; k <= n; k++) propies[nom].aportacions.push((await aporta(db, who, [aportacio(who, `${nom}-${k}`)]))[0].id);
        for (let k = 1; k <= n; k++) {
          await vota(db, who, [vot(who, `${nom.toLowerCase()}_${k}`, 'q01_creilla')]);
        }
        propies[nom].vots = (await db.query('SELECT id FROM public.joc_isoglosses_vots_consens WHERE user_id=$1', [who])).rows.map(r => r.id);
      }
      /* L'aportació de BERTA, aprovada i pública: tampoc ha d'eixir a l'exportació d'ANNA. */
      await db.query("UPDATE public.aportacions_veu_poble SET estat_moderacio='aprovat' WHERE user_id=$1", [BERTA]);
      /* Una secció anterior amb contingut real (notes): ha de quedar igual després de R28. */
      await db.query("INSERT INTO public.notes(id,tenant_id,owner_user_id,title,content) VALUES($1,$2,$3,'Nota sintètica','<p>Text sintètic</p>')", [id(91), TOWN, ANNA]);
      for (const [nom, who] of [['ANNA', ANNA], ['BERTA', BERTA], ['CARME', CARME]]) abans[nom] = await exporta(db, who);
      permisosAbans = await permisos(db);
      baseAbans = await md5Funcio(db, 'private.exporta_les_meues_dades_base_r33()');
      exportaAbans = await md5Funcio(db, 'public.exporta_les_meues_dades()');
      await aplicaR28(db);
      empremta1 = await empremta(db);
      await aplicaR28(db);
      empremta2 = await empremta(db);
    });
    after(async () => {
      await db?.close();
      const iguals = [...captures].every(([file, c]) => sha(fs.readFileSync(path.join(ROOT, MIG, file))) === c.sha256);
      assert.equal(iguals, true, 'Les fonts SQL han canviat durant l’assaig; resultat no atribuïble al mateix catàleg.');
      assert.equal(sha(fs.readFileSync(path.join(ROOT, 'supabase/ordre_desplegament.json'))), sha(ordreBytes), 'L’ordre declarat ha canviat durant l’assaig.');
    });

    test('el catàleg complet s’aplica en l’ordre del verificador i R28 hi va l’última, darrere de les seues dependències', t => {
      t.diagnostic(`catàleg: ${files.length} migracions (${versions.filter(v => v.length === 10).length} de 10 xifres i ${versions.filter(v => v.length === 14).length} de 14)`);
      assert.deepEqual(errorsCataleg, []);
      assert.equal(files.at(-1), R28);
      for (const v of DEPENDENCIES_R28) {
        assert.ok(files.findIndex(f => f.startsWith(v + '_')) >= 0, `dependència present: ${v}`);
        assert.ok(dependencies.get('20261115030000').includes(v), `capçalera: depén de ${v}`);
      }
    });

    test('idempotent: la segona aplicació no canvia cap funció, disparador ni índex, i la base privada no es toca', () => {
      assert.deepEqual(empremta2, empremta1);
      assert.equal(empremta1.funcions.find(f => f.sig === 'private.exporta_les_meues_dades_base_r33()').md5, baseAbans);
      assert.notEqual(empremta1.funcions.find(f => f.sig === 'exporta_les_meues_dades()').md5, exportaAbans, 'l’embolcall és el nou');
      assert.deepEqual(empremta1.disparadors.map(d => [d.taula, d.tgname, d.funcio]), [
        ['aportacions_veu_poble', 'aportacions_veu_poble_limita_ritme', 'private.aportacions_veu_poble_limita_ritme()'],
        ['joc_isoglosses_vots_consens', 'joc_isoglosses_vots_limita_ritme', 'private.joc_isoglosses_vots_limita_ritme()']
      ], 'cap disparador a refranys_poble (sense autoria ni escriptura de l’API)');
      assert.ok(empremta1.index.some(i => i.indexname === 'idx_joc_isoglosses_vots_user_created'));
    });

    test('cap GRANT ni política nova: ACL de taula i de columna, RLS i polítiques idèntiques; funcions definer amb search_path buit', async () => {
      assert.deepEqual(await permisos(db), permisosAbans);
      for (const f of empremta1.funcions) {
        assert.equal(f.prosecdef, true, f.sig);
        assert.equal(f.cfg, 'search_path=""', f.sig);
      }
      for (const sig of ['private.aportacions_veu_poble_limita_ritme()', 'private.joc_isoglosses_vots_limita_ritme()']) {
        for (const rol of ['public', 'anon', 'authenticated', 'service_role']) {
          assert.equal((await db.query("SELECT has_function_privilege($1,$2,'EXECUTE') AS p", [rol, sig])).rows[0].p, false, `${rol} no executa ${sig}`);
        }
      }
      for (const [rol, pot] of [['public', false], ['anon', false], ['authenticated', true], ['service_role', false]]) {
        assert.equal((await db.query("SELECT has_function_privilege($1,'public.exporta_les_meues_dades()','EXECUTE') AS p", [rol])).rows[0].p, pot, rol);
      }
    });

    test('exportació: cada secció anterior es conserva igual i només s’hi afig veu_del_poble', async () => {
      for (const [nom, who] of [['ANNA', ANNA], ['BERTA', BERTA], ['CARME', CARME]]) {
        const ara = await exporta(db, who);
        assert.equal(Object.hasOwn(abans[nom], 'veu_del_poble'), false);
        const { generat_al: g1, ...vella } = abans[nom];
        const { generat_al: g2, veu_del_poble, ...nova } = ara;
        assert.ok(g1 && g2);
        assert.deepEqual(nova, vella, `${nom}: les seccions de 2611070600 no canvien`);
        assert.deepEqual(Object.keys(veu_del_poble).sort(), ['aportacions', 'vots_isoglosses']);
      }
      assert.equal(abans.ANNA.notes.length, 1, 'la secció de notes té contingut real');
      assert.ok(Array.isArray(abans.ANNA.seed_revisions));
    });

    test('exportació: les files R23 pròpies amb les columnes de la persona, i cap fila d’una altra', async () => {
      const COLS_APORTACIO = ['abast_comarcal', 'audio_mime', 'audio_storage_path', 'comarca_id', 'consentiment_acceptat_at', 'consentiment_arxiu_obert', 'consentiment_versio',
        'created_at', 'durada_segons', 'estat_moderacio', 'id', 'mida_bytes', 'poble', 'poble_comarca', 'pregunta_id', 'refrany_id', 'text_aportat', 'tipus'];
      const COLS_VOT = ['abast_comarcal', 'comarca_id', 'created_at', 'id', 'paraula_etiqueta', 'poble', 'pregunta_id', 'variant_clau'];
      const veus = {};
      for (const [nom, who] of [['ANNA', ANNA], ['BERTA', BERTA]]) {
        const veu = (await exporta(db, who)).veu_del_poble;
        veus[nom] = veu;
        assert.deepEqual(veu.aportacions.map(a => a.id).sort(), [...propies[nom].aportacions].sort(), `${nom}: les seues aportacions`);
        assert.deepEqual(veu.vots_isoglosses.map(v => v.id).sort(), [...propies[nom].vots].sort(), `${nom}: els seus vots`);
        for (const a of veu.aportacions) assert.deepEqual(Object.keys(a).sort(), COLS_APORTACIO);
        for (const v of veu.vots_isoglosses) assert.deepEqual(Object.keys(v).sort(), COLS_VOT);
      }
      const [primera] = veus.ANNA.aportacions;
      assert.equal(primera.text_aportat, 'Variant sintètica ANNA-1');
      assert.equal(primera.consentiment_arxiu_obert, true);
      assert.equal(primera.consentiment_versio, 'cc-by-sa-4.0-v1');
      assert.ok(Number.isFinite(Date.parse(primera.consentiment_acceptat_at)), 'el moment del consentiment és de la persona');
      assert.equal(primera.estat_moderacio, 'pendent');
      assert.equal(veus.BERTA.aportacions[0].estat_moderacio, 'aprovat');
      const textAnna = JSON.stringify(veus.ANNA);
      for (const aliena of [BERTA, ...propies.BERTA.aportacions, ...propies.BERTA.vots, 'BERTA-1', 'berta_1']) {
        assert.equal(textAnna.includes(aliena), false, `res de BERTA a l’exportació d’ANNA (${aliena}), tampoc la seua aportació aprovada i pública`);
      }
      assert.equal(textAnna.includes(ANNA), false, 'sense user_id: és el compte mateix');
      assert.deepEqual((await exporta(db, CARME)).veu_del_poble, { aportacions: [], vots_isoglosses: [] });
      await assert.rejects(com(db, null, 'SELECT public.exporta_les_meues_dades()'), error('42501'));
    });

    test('aportacions: 60 en una hora; la 61a cau sencera, i passada l’hora torna a entrar amb l’hora del servidor', async () => {
      const lot = n => Array.from({ length: n }, (_, k) => aportacio(CARME, `CARME-${k}`));
      await assert.rejects(aporta(db, CARME, lot(61)), error('42900', 'SDP-VEU-429'), 'un lot de 61 en una sola petició');
      assert.equal(await quantes(db, 'aportacions_veu_poble', CARME), 0, 'cap fila a mitges');
      assert.equal((await aporta(db, CARME, lot(60))).length, 60);
      await assert.rejects(aporta(db, CARME, [aportacio(CARME, 'CARME-61')]), error('42900', 'SDP-VEU-429'));
      await endarrereix(db, 'aportacions_veu_poble', CARME, '61 minutes');
      const [rebut] = await aporta(db, CARME, [aportacio(CARME, 'CARME-61', { created_at: '2000-01-01T00:00:00Z' })]);
      assert.equal(rebut.estat_moderacio, 'pendent');
      const creada = (await db.query('SELECT created_at > now() - interval \'5 minutes\' AS ara FROM public.aportacions_veu_poble WHERE id=$1', [rebut.id])).rows[0];
      assert.equal(creada.ara, true, 'una data del client no trau la fila de la finestra');
    });

    test('aportacions: 500 en 24 hores; la quota d’una altra persona no es delata i el servidor en queda fora', async () => {
      await servidorAportacions(db, DANI, 500, '2 hours');
      assert.equal(await quantes(db, 'aportacions_veu_poble', DANI), 500, 'el servidor escriu sense quota');
      await assert.rejects(aporta(db, DANI, [aportacio(DANI, 'DANI-501')]), error('42900', 'SDP-VEU-429'));
      await assert.rejects(aporta(db, ANNA, [aportacio(DANI, 'falsa')]), error('42501'), 'autoria aliena: la RLS, no la quota de DANI');
      await endarrereix(db, 'aportacions_veu_poble', DANI, '23 hours');
      assert.equal((await aporta(db, DANI, [aportacio(DANI, 'DANI-501')])).length, 1);
    });

    test('aportacions: 2000 vives com a molt; esborrar-ne una torna a fer lloc, i el missatge diu el total real', async () => {
      await servidorAportacions(db, ELNA, 2000, '3 days');
      await assert.rejects(aporta(db, ELNA, [aportacio(ELNA, 'ELNA-2001')]), error('53400', 'SDP-VEU-QUOTA'));
      const { id: una } = (await db.query('SELECT id FROM public.aportacions_veu_poble WHERE user_id=$1 LIMIT 1', [ELNA])).rows[0];
      assert.equal((await com(db, ELNA, 'DELETE FROM public.aportacions_veu_poble WHERE id=$1', [una])).affectedRows, 1);
      assert.equal((await aporta(db, ELNA, [aportacio(ELNA, 'ELNA-2001')])).length, 1);
      assert.equal(await quantes(db, 'aportacions_veu_poble', ELNA), 2000);
      /* Qui ja passa el sostre (una fila més del servidor) no n'afig cap; el missatge diu quantes en té, no la constant. */
      await servidorAportacions(db, ELNA, 1, '3 days');
      await assert.rejects(aporta(db, ELNA, [aportacio(ELNA, 'ELNA-2002')]),
        error('53400', 'SDP-VEU-QUOTA: ja tens 2001 aportacions desades i el màxim per persona és 2000.'));
    });

    test('vots: el repetit no compta ni topa amb la quota; 60 en una hora i 2000 vius', async () => {
      const lot = (who, n, desde = 0) => Array.from({ length: n }, (_, k) => vot(who, `f${desde + k}`));
      assert.equal((await vota(db, FERRAN, lot(FERRAN, 60))).length, 60);
      assert.deepEqual(await vota(db, FERRAN, [vot(FERRAN, 'f0')]), [], 'un vot repetit no desa res i no cau');
      await assert.rejects(vota(db, FERRAN, lot(FERRAN, 1, 60)), error('42900', 'SDP-ISOGLOSSES-429'));
      await assert.rejects(com(db, FERRAN, "INSERT INTO public.joc_isoglosses_vots_consens(user_id,pregunta_id,variant_clau,paraula_etiqueta) VALUES($1,'q02_espencat','v_f0','V f0')", [FERRAN]),
        error('23505'), 'sense ON CONFLICT, el repetit continua sent una violació d’unicitat');
      await endarrereix(db, 'joc_isoglosses_vots_consens', FERRAN, '61 minutes');
      assert.equal((await vota(db, FERRAN, lot(FERRAN, 1, 60))).length, 1);
      await servidorVots(db, GINA, 2000, '3 days');
      await assert.rejects(vota(db, GINA, [vot(GINA, 'nou')]), error('53400', 'SDP-ISOGLOSSES-QUOTA'));
      assert.deepEqual(await com(db, GINA, ...insercio('joc_isoglosses_vots_consens', [{ user_id: GINA, pregunta_id: 'q03_bresquilla', variant_clau: 'servidor_0001', paraula_etiqueta: 'Servidor 1' }],
        { conflicte: 'user_id, pregunta_id, variant_clau', retorna: 'pregunta_id' })).then(r => r.rows[0].j), [], 'al sostre, el vot repetit tampoc cau');
      await assert.rejects(vota(db, ANNA, [vot(GINA, 'fals')]), error('42501'), 'autoria aliena: la RLS, no la quota de GINA');
      /* Qui ja passa el sostre (un vot més del servidor) no n'afig cap; el missatge diu quants en té, no la constant. */
      await db.query("INSERT INTO public.joc_isoglosses_vots_consens(user_id,pregunta_id,variant_clau,paraula_etiqueta,created_at) VALUES($1,'q03_bresquilla','servidor_extra','Servidor extra',now()-interval '3 days')", [GINA]);
      await assert.rejects(vota(db, GINA, [vot(GINA, 'nou')]),
        error('53400', 'SDP-ISOGLOSSES-QUOTA: ja tens 2001 vots desats i el màxim per persona és 2000.'));
    });

    test('vots: 500 en 24 hores; el 501è de l’API cau per la finestra del dia i, passat el dia, torna a entrar', async () => {
      await servidorVots(db, HUGO, 500, '2 hours');
      assert.equal(await quantes(db, 'joc_isoglosses_vots_consens', HUGO), 500, 'el servidor escriu sense quota');
      await assert.rejects(vota(db, HUGO, [vot(HUGO, 'h501')]), error('42900', 'SDP-ISOGLOSSES-429'), 'cap vot en l’última hora: el límit és el de 24 hores');
      assert.equal(await quantes(db, 'joc_isoglosses_vots_consens', HUGO), 500, 'el 501è no s’ha desat');
      await endarrereix(db, 'joc_isoglosses_vots_consens', HUGO, '23 hours');
      assert.equal((await vota(db, HUGO, [vot(HUGO, 'h501')])).length, 1);
    });

    test('vots: created_at és l’hora del servidor; un vot enviat amb created_at 2000-01-01 es desa amb now() i compta a la finestra', async () => {
      const antic = '2000-01-01T00:00:00Z';
      const lot = Array.from({ length: 60 }, (_, k) => ({ ...vot(IRENE, `i${k}`), created_at: antic }));
      assert.equal((await vota(db, IRENE, lot)).length, 60);
      const { rows: [desats] } = await db.query(`SELECT count(*)::int AS n, count(*) FILTER (WHERE created_at > now() - interval '5 minutes')::int AS ara,
        count(*) FILTER (WHERE created_at < '2001-01-01')::int AS del_client FROM public.joc_isoglosses_vots_consens WHERE user_id=$1`, [IRENE]);
      assert.deepEqual(desats, { n: 60, ara: 60, del_client: 0 }, 'cap vot es desa amb la data del client');
      await assert.rejects(vota(db, IRENE, [{ ...vot(IRENE, 'i60'), created_at: antic }]), error('42900', 'SDP-ISOGLOSSES-429'), 'els 60 compten a l’última hora');
    });

    test('anon no escriu cap de les tres taules, i ningú de l’API escriu el refranyer', async () => {
      await assert.rejects(aporta(db, null, [aportacio(ANNA, 'anon')]), error('42501'));
      await assert.rejects(vota(db, null, [vot(ANNA, 'anon')]), error('42501'));
      const refrany = { id: 'r28-refrany', categoria: 'camp-olivera', text_refrany: 'Refrany sintètic de prova', comarca: 'L’Alacantí' };
      for (const who of [null, ANNA]) {
        await assert.rejects(com(db, who, ...insercio('refranys_poble', [refrany], { retorna: 'id' })), error('42501'), who ? 'authenticated' : 'anon');
        await assert.rejects(com(db, who, "UPDATE public.refranys_poble SET estat='publicat'"), error('42501'));
        await assert.rejects(com(db, who, 'DELETE FROM public.refranys_poble'), error('42501'));
      }
      assert.equal((await db.query("SELECT count(*)::int AS n FROM public.aportacions_veu_poble WHERE text_aportat='Variant sintètica anon'")).rows[0].n, 0);
    });

    test('precondició: sense les taules R23, R28 avorta neta (SDP-R28-002) i no canvia res', async t => {
      const { db: sense, errors } = await creaBase(files.filter(f => f !== R28 && !R23.some(v => f.startsWith(v + '_'))));
      try {
        assert.deepEqual(errors, []);
        const exportaVell = await md5Funcio(sense, 'public.exporta_les_meues_dades()');
        await assert.rejects(aplicaR28(sense), error('55000', 'SDP-R28-002'));
        assert.equal(await md5Funcio(sense, 'public.exporta_les_meues_dades()'), exportaVell);
        assert.equal(await md5Funcio(sense, 'private.aportacions_veu_poble_limita_ritme()'), null);
        assert.equal(await md5Funcio(sense, 'private.joc_isoglosses_vots_limita_ritme()'), null);
        t.diagnostic('SDP-R28-002 abans de crear cap funció ni disparador');
      } finally { await sense.close(); }
    });
  });
}
