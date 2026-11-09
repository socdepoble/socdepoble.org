/**
 * R13-C7 (ordre del Mestre, 08-11-2026) · La migració 2611082238_admin_resum_sessions_dispositius.sql:
 * recomptes de persones distintes amb sessió activa per camí, només per a superadmin amb aal2.
 *
 * Dues parts:
 *   1. Estàtica (sempre; entra a `npm run test:precommit`): forma de la RPC, guarda, permisos,
 *      capçalera del verificador, que cap dada personal ix de la funció, el README i el client.
 *   2. PostgreSQL en memòria (opt-in, com tests/administracio-multipoble-postgres.test.mjs):
 *        SDP_PGLITE_MODULE=/ruta/existent/pglite/dist/index.js node --test tests/migracio-admin-resum-sessions-dispositius.test.mjs
 *      Aplica les 81 migracions reals en l'ordre del verificador sobre una fixture d'auth amb la
 *      forma de GoTrue (auth.sessions amb user_agent, created_at, updated_at i refreshed_at),
 *      sembra sessions sintètiques i comprova els recomptes, el rebuig del no-superadmin, del
 *      superadmin sense aal2 i d'anon. No busca paquets ni instal·la res; cap base remota.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test, { after, before, describe } from 'node:test';
import assert from 'node:assert/strict';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FITXER = '2611082238_admin_resum_sessions_dispositius.sql';
const SQL = fs.readFileSync(path.join(ARREL, 'supabase/migrations', FITXER), 'utf8');
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const PLA = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const CAMINS = ['app_ios', 'web_ios', 'app_android', 'web_android', 'escriptori', 'altres'];

describe('R13-C7 · estàtica: admin_resum_sessions_dispositius()', () => {
  test('una sola funció, plpgsql STABLE SECURITY DEFINER amb search_path buit i la guarda de superadmin (aal2)', () => {
    const creacions = [...CODI.matchAll(/create\s+(?:or\s+replace\s+)?function\s+([\w.]+)\s*\(([^)]*)\)/gi)];
    assert.deepEqual(creacions.map((m) => [m[1], m[2].trim()]), [['public.admin_resum_sessions_dispositius', '']]);
    const capcalera = PLA(CODI.slice(CODI.search(/create\s+or\s+replace\s+function/i), CODI.indexOf('$$')));
    assert.match(capcalera, /returns jsonb language plpgsql stable security definer set search_path = ''/);
    const cos = CODI.slice(CODI.indexOf('$$') + 2, CODI.lastIndexOf('$$'));
    const guarda = cos.indexOf('private.es_superadmin()');
    assert.ok(guarda > -1 && guarda < cos.indexOf('auth.sessions'), 'la guarda va abans de llegir cap sessió');
    assert.match(PLA(cos), /if not coalesce\(\(select private\.es_superadmin\(\)\), false\) then raise exception 'sdp-admin-003: [^']+' using errcode = '42501';/);
  });

  test('permisos: res per a public ni anon; execute per a authenticated (decidix la guarda)', () => {
    const codi = PLA(CODI);
    assert.match(codi, /revoke execute on function public\.admin_resum_sessions_dispositius\(\) from public, anon;/);
    assert.match(codi, /grant execute on function public\.admin_resum_sessions_dispositius\(\) to authenticated;/);
    assert.doesNotMatch(codi, /grant [^;]*to [^;]*\b(?:anon|public)\b/);
    assert.doesNotMatch(codi, /\b(?:insert|update|delete)\b/, 'només llig');
  });

  test('només ixen recomptes: claus tancades, cap columna personal ni el user_agent', () => {
    const cos = CODI.slice(CODI.indexOf('$$') + 2, CODI.lastIndexOf('$$'));
    /* Les claus dels jsonb_build_object: un literal seguit del valor (una subconsulta, c.cami, now() o un altre objecte). */
    const claus = [...cos.matchAll(/'([a-z0-9_]+)',\s*(?=\(|c\.|now\(\)|jsonb_build_object)/g)].map((m) => m[1]);
    assert.deepEqual([...new Set(claus)].sort(), ['cami', 'camins', 'consultat_a', 'persones_14d', 'persones_24h', 'persones_7d', 'total']);
    for (const clau of claus) assert.ok(['consultat_a', 'camins', 'total', 'cami', 'persones_24h', 'persones_7d', 'persones_14d'].includes(clau), clau);
    const sortida = cos.slice(cos.indexOf('select jsonb_build_object('));
    for (const prohibit of ['email', 'ip', 'user_agent', 'phone', 'raw_user_meta_data', 'full_name', 'a.user_id,', 'array_agg', 'string_agg'])
      assert.ok(!new RegExp(`\\b${prohibit.replace(/[.,]/g, '\\$&')}`).test(sortida.replace(/count\(distinct a\.user_id\)/g, '')), prohibit);
    assert.deepEqual([...cos.matchAll(/\('([a-z_]+)', (\d)\)/g)].map((m) => m[1]), CAMINS);
  });

  test('les regles del camí: «; wv)» per a l\'app d\'Android, «Safari/» per al navegador d\'iOS i 14 dies de finestra', () => {
    const cos = CODI.slice(CODI.indexOf('$$') + 2, CODI.lastIndexOf('$$'));
    assert.match(cos, /when nullif\(btrim\(s\.user_agent\), ''\) is null then 'altres'/);
    assert.match(cos, /position\('; wv\)' in s\.user_agent\) > 0 then 'app_android' else 'web_android'/);
    assert.match(cos, /s\.user_agent ~\* '\(iphone\|ipad\|ipod\)'/);
    assert.match(cos, /position\('Safari\/' in s\.user_agent\) > 0 then 'web_ios' else 'app_ios'/);
    assert.match(cos, /else 'escriptori'/);
    assert.match(cos, /greatest\(s\.created_at, s\.updated_at, s\.refreshed_at at time zone 'UTC'\) >= now\(\) - interval '14 days'/);
    for (const finestra of ["'24 hours'", "'7 days'"]) assert.ok(cos.includes(`a.activitat >= now() - interval ${finestra}`), finestra);
  });

  test('capçalera del verificador: depén de 2610061448, NO aplicada, consultes de lectura i una transacció', () => {
    const linies = SQL.split('\n');
    const cap = linies.slice(0, linies.findIndex((l) => !l.startsWith('--')));
    const text = cap.join('\n');
    assert.match(text, /^-- Depén de 2610061448 \(private\.es_superadmin\(\) amb aal2\)/m);
    assert.match(text, /NO aplicada: l'aplica el Mestre/);
    assert.match(text, /^-- Abans \(lectura\):/m);
    assert.match(text, /^-- Verificació posterior \(lectura\):/m);
    assert.equal(CODI.match(/^\s*begin;\s*$/gim)?.length, 1);
    assert.equal(CODI.match(/^\s*commit;\s*$/gim)?.length, 1);
    assert.match(CODI, /notify pgrst, 'reload schema';\s*commit;\s*$/);
  });

  test('el README la cataloga com a NO aplicada (vinyeta i fila 85) i nomena la prova', () => {
    const readme = fs.readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
    assert.ok(readme.includes(`- \`migrations/${FITXER}\``));
    assert.match(readme, /^\| 85 \| `2611082238` \| `2611082238_admin_resum_sessions_dispositius\.sql` \| \*\*NO aplicada: l'aplica el Mestre\*\* \|/m);
    assert.ok(readme.includes('tests/migracio-admin-resum-sessions-dispositius.test.mjs'));
  });

  test('el client crida la RPC pel nom exacte, sense paràmetres, i el panell nomena esta migració', () => {
    const client = fs.readFileSync(path.join(ARREL, 'src/data/supabase/admin.js'), 'utf8');
    assert.match(client, /rpc\('admin_resum_sessions_dispositius', \{\}, config/);
    const dades = fs.readFileSync(path.join(ARREL, 'src/data/resumSessionsDispositius.js'), 'utf8');
    assert.ok(dades.includes(`'${FITXER}'`));
  });
});

/* ───────────────────────── 2. PostgreSQL en memòria (opt-in) ───────────────────────── */

const entrada = process.env.SDP_PGLITE_MODULE?.trim() || '';
let moduleURL = null;
if (entrada) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(entrada) && !entrada.startsWith('file:')) throw new TypeError('SDP_PGLITE_MODULE només admet una ruta local o file URL.');
  moduleURL = entrada.startsWith('file:') ? new URL(entrada) : pathToFileURL(path.resolve(entrada));
  if (moduleURL.search || moduleURL.hash) throw new TypeError('El mòdul local no admet query ni fragment.');
}
const modulePath = moduleURL ? fileURLToPath(moduleURL) : null;

if (!modulePath || !fs.existsSync(modulePath)) {
  test('R13-C7 · PostgreSQL en memòria necessita un PGlite existent i explícit', {
    skip: entrada ? 'El mòdul indicat no existix; no s’ha executat cap migració.' : 'Falta SDP_PGLITE_MODULE; no s’ha executat cap migració.'
  }, () => {});
} else {
  const { PGlite } = await import(moduleURL.href);
  const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
  const { capcalera, dependenciesDeclarades, llegixOrdre, ordena } = await import(pathToFileURL(path.join(ARREL, 'scripts/supabase/verifica-migracions.mjs')).href);
  const MIG = path.join(ARREL, 'supabase/migrations');
  const inventari = fs.readdirSync(MIG).filter((f) => /^\d{10}_.+\.sql$/.test(f)).sort();
  const versions = inventari.map((f) => f.slice(0, 10));
  const ordre = llegixOrdre(fs.readFileSync(path.join(ARREL, 'supabase/ordre_desplegament.json'), 'utf8'), new Set(versions));
  const dependencies = new Map(inventari.map((f) => [f.slice(0, 10),
    dependenciesDeclarades(capcalera(fs.readFileSync(path.join(MIG, f), 'utf8')), f.slice(0, 10)).filter((d) => d.versio < f.slice(0, 10)).map((d) => d.versio)]));
  const pla = ordena({ versions, dependencies, restriccions: ordre.restriccions, portes: ordre.portes });
  assert.deepEqual(pla.errors, []);
  const fitxers = pla.ordre.filter((p) => p.tipus === 'migracio').map((p) => inventari.find((f) => f.startsWith(`${p.id}_`)));
  assert.equal(fitxers.at(-1), FITXER, 'la migració nova és l’última del pla');

  /* Substituts de la infraestructura de Supabase (els de tests/administracio-multipoble-postgres.test.mjs);
     auth.sessions porta, a més, les columnes de GoTrue que llig la funció, amb els seus tipus. */
  const bootstrap = [
    'CREATE ROLE anon NOLOGIN;', 'CREATE ROLE authenticated NOLOGIN;', 'CREATE ROLE service_role NOLOGIN BYPASSRLS;',
    'CREATE SCHEMA auth;',
    "CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb NOT NULL DEFAULT '{}');",
    "CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;",
    'GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;',
    'GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;',
    "CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;",
    "CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'authenticated')$$;",
    'CREATE TABLE auth.sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,created_at timestamptz,updated_at timestamptz,refreshed_at timestamp without time zone,user_agent text,ip inet);',
    'ALTER TABLE auth.users ADD COLUMN banned_until timestamptz;', 'ALTER TABLE auth.users ADD COLUMN email_confirmed_at timestamptz;',
    'CREATE SCHEMA storage;',
    'CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);',
    'CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text REFERENCES storage.buckets(id),name text,owner uuid,owner_id text,metadata jsonb,version text,created_at timestamptz DEFAULT now(),UNIQUE(bucket_id,name));',
    'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;',
    "CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;",
    "CREATE FUNCTION storage.operation() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('storage.operation',true)$$;",
    'GRANT USAGE ON SCHEMA storage TO anon,authenticated,service_role;', 'GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;',
    'CREATE SCHEMA realtime;',
    'CREATE TABLE realtime.messages(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,extension text,topic text,payload jsonb);',
    'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;',
    "CREATE FUNCTION realtime.topic() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('realtime.topic',true)$$;"
  ].join('\n');

  const UA = Object.freeze({
    appIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    safariIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    appIpad: 'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    appAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240805.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.58 Mobile Safari/537.36',
    chromeAndroid: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0'
  });
  const id = (n) => `00000000-0000-4000-8000-0000000c07${String(n).padStart(2, '0')}`;
  const SA = id(1), VEI = id(2);
  const P = Object.freeze({ iphone: id(11), android: id(12), chrome: id(13), escriptori: id(14), sensenav: id(15), antiga: id(16), ipad: id(17) });

  describe('R13-C7 · PostgreSQL WASM: recomptes, rebuigs i cap dada personal', { concurrency: false }, () => {
    let db;
    async function com(uid, aal, fn, rol = 'authenticated') {
      await db.exec('BEGIN');
      try {
        await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [uid ?? '']);
        await db.query("SELECT set_config('request.jwt.claim.role',$1,true)", [rol]);
        await db.query("SELECT set_config('request.jwt.claims',$1,true)", [JSON.stringify(uid ? { sub: uid, aal, role: rol } : { role: rol })]);
        await db.exec(`SET LOCAL ROLE ${rol}`);
        const resultat = await fn();
        await db.exec('COMMIT');
        return resultat;
      } catch (e) {
        await db.exec('ROLLBACK');
        throw e;
      }
    }
    const resum = () => db.query('SELECT public.admin_resum_sessions_dispositius() AS r');
    const rebutja = (promesa, codi, text) => assert.rejects(promesa, (e) => {
      assert.equal(e.code, codi, e.message);
      if (text) assert.match(e.message, text);
      return true;
    });

    before(async () => {
      db = new PGlite({ extensions: { pgcrypto } });
      await db.exec(bootstrap);
      for (const fitxer of fitxers) await db.exec(fs.readFileSync(path.join(MIG, fitxer), 'utf8'));
      for (const u of [SA, VEI, ...Object.values(P)]) await db.query('INSERT INTO auth.users(id,email) VALUES($1,$2)', [u, `sintetica-${u.slice(-4)}@example.invalid`]);
      await db.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin') ON CONFLICT(user_id) DO UPDATE SET role=excluded.role", [SA]);
      const sessio = (u, ua, desplacament, { refrescada = null } = {}) => db.query(
        `INSERT INTO auth.sessions(user_id,user_agent,created_at,updated_at,refreshed_at) VALUES($1,$2,now()-$3::interval,now()-$3::interval,${refrescada ? "(now() at time zone 'UTC')-$4::interval" : 'NULL'})`,
        refrescada ? [u, ua, desplacament, refrescada] : [u, ua, desplacament]);
      await sessio(P.iphone, UA.appIphone, '1 hour');
      await sessio(P.iphone, UA.safariIphone, '3 days');
      await sessio(P.android, UA.appAndroid, '30 days', { refrescada: '2 hours' }); // activa pel refresc (timestamp sense zona, UTC)
      await sessio(P.android, UA.appAndroid, '1 hour'); // la mateixa persona: compta una vegada
      await sessio(P.chrome, UA.chromeAndroid, '10 days');
      await sessio(P.escriptori, UA.mac, '1 hour');
      await sessio(P.escriptori, UA.windows, '6 days');
      await sessio(P.sensenav, null, '5 days');
      await sessio(P.sensenav, '   ', '9 days');
      await sessio(P.antiga, UA.appAndroid, '20 days'); // fora dels 14 dies
      await sessio(P.ipad, UA.appIpad, '12 days');
    });
    after(async () => { await db?.close(); });

    test('superadmin amb aal2: els recomptes per camí, el total de persones distintes i res més', async () => {
      const { r } = (await com(SA, 'aal2', resum)).rows[0];
      assert.deepEqual(Object.keys(r).sort(), ['camins', 'consultat_a', 'total']);
      assert.ok(!Number.isNaN(Date.parse(r.consultat_a)));
      assert.deepEqual(r.camins, [
        { cami: 'app_ios', persones_24h: 1, persones_7d: 1, persones_14d: 2 },
        { cami: 'web_ios', persones_24h: 0, persones_7d: 1, persones_14d: 1 },
        { cami: 'app_android', persones_24h: 1, persones_7d: 1, persones_14d: 1 },
        { cami: 'web_android', persones_24h: 0, persones_7d: 0, persones_14d: 1 },
        { cami: 'escriptori', persones_24h: 1, persones_7d: 1, persones_14d: 1 },
        { cami: 'altres', persones_24h: 0, persones_7d: 1, persones_14d: 1 }
      ]);
      assert.deepEqual(r.total, { persones_24h: 3, persones_7d: 4, persones_14d: 6 });
      const text = JSON.stringify(r);
      for (const u of [SA, VEI, ...Object.values(P)]) assert.ok(!text.includes(u), 'cap identificador');
      for (const prohibit of ['@', 'Mozilla', 'iPhone', 'Android']) assert.ok(!text.includes(prohibit), prohibit);
    });

    test('sense cap sessió viva: tots els camins a zero, no buits', async () => {
      await db.exec('BEGIN');
      try {
        await db.exec('DELETE FROM auth.sessions');
        await db.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)", [SA, JSON.stringify({ sub: SA, aal: 'aal2', role: 'authenticated' })]);
        await db.exec('SET LOCAL ROLE authenticated');
        const { r } = (await resum()).rows[0];
        assert.deepEqual(r.camins.map((c) => c.cami), CAMINS);
        assert.ok(r.camins.every((c) => c.persones_24h === 0 && c.persones_7d === 0 && c.persones_14d === 0));
        assert.deepEqual(r.total, { persones_24h: 0, persones_7d: 0, persones_14d: 0 });
      } finally {
        await db.exec('ROLLBACK');
      }
    });

    for (const [nom, u, aal] of [['un veí amb aal2', VEI, 'aal2'], ['el superadmin sense aal2', SA, 'aal1'], ['el superadmin sense claim aal', SA, null], ['authenticated sense uid', null, null]]) {
      test(`${nom} rep 42501 SDP-ADMIN-003 i cap xifra`, async () => {
        await rebutja(com(u, aal, resum), '42501', /SDP-ADMIN-003/);
      });
    }

    test('anon i service_role sense concessió no l’executen (permís de la funció)', async () => {
      for (const rol of ['anon', 'service_role']) await rebutja(com(null, null, resum, rol), '42501', /permission denied/i);
    });

    test('ACL i forma: SECURITY DEFINER, STABLE, search_path buit, execute només per a authenticated', async () => {
      const [f] = (await db.query(`SELECT p.prosecdef, p.provolatile, p.proconfig, l.lanname,
        has_function_privilege('anon', p.oid, 'EXECUTE') AS anon, has_function_privilege('authenticated', p.oid, 'EXECUTE') AS autenticat,
        EXISTS (SELECT 1 FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE') AS public
        FROM pg_proc p JOIN pg_language l ON l.oid = p.prolang WHERE p.oid = 'public.admin_resum_sessions_dispositius()'::regprocedure`)).rows;
      assert.deepEqual(f, { prosecdef: true, provolatile: 's', proconfig: ['search_path=""'], lanname: 'plpgsql', anon: false, autenticat: true, public: false });
    });

    test('repetible: tornar a aplicar el fitxer no canvia el resultat ni els permisos', async () => {
      await db.exec(SQL);
      const { r } = (await com(SA, 'aal2', resum)).rows[0];
      assert.deepEqual(r.total, { persones_24h: 3, persones_7d: 4, persones_14d: 6 });
      assert.equal((await db.query("SELECT has_function_privilege('anon','public.admin_resum_sessions_dispositius()','EXECUTE') AS a")).rows[0].a, false);
    });
  });
}
