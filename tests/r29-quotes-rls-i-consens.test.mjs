/**
 * Onada R29 · DECISIÓ-R29-02 · La migració 20261115170000 (SQL-R29-01, SQL-R29-02, SQL-R29-03,
 * SQL-R29-04 i SQL-R29-06) sobre PostgreSQL WASM (PGlite), amb tot el catàleg real en l'ordre del
 * verificador (scripts/supabase/verifica-migracions.mjs), com tests/r28-rgpd-quotes-r23.test.mjs:
 *   SDP_PGLITE_MODULE=/ruta/existent/pglite/dist/index.js node --test tests/r29-quotes-rls-i-consens.test.mjs
 * Sense el mòdul indicat, només s'executa la prova estàtica de la llista de preguntes.
 * Cada defecte es reprodueix primer sobre el catàleg sense R29 (la prova en roig: el before() ho
 * assereix) i després es comprova la correcció; amb SDP_R29_BASELINE=1, R29 no s'aplica i les proves
 * de la correcció cauen. Les escriptures de l'API van com PostgREST
 * (json_populate_recordset o l'RPC, amb el rol i el JWT de la petició); les del servidor, sense cap
 * petició (editor SQL). Cap servei remot.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test, { after, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PREGUNTES_ISOGLOSSES } from '../src/components/patrimoni/isoglossesComarcals.js';
import { clauDeMot, LIMIT_RESUM_CONSENS } from '../src/data/consensIsoglosses.js';

const ROOT = process.cwd(), MIG = 'supabase/migrations';
const R29 = '20261115170000_r29_quotes_rls_i_consens.sql';
const SQL_R29_FONT = fs.readFileSync(path.join(ROOT, MIG, R29), 'utf8');

/* Onada R29 · La llista tancada del resum ha de ser la del joc: una pregunta nova al client sense
   migració nova faria desaparéixer el seu consens remot. */
test('R29 · la llista de preguntes del resum és PREGUNTES_ISOGLOSSES i hi cap sencera (12 × 20 <= 250)', () => {
  const cos = SQL_R29_FONT.slice(SQL_R29_FONT.indexOf('create or replace function public.resum_consens_isoglosses_poble'));
  const llista = cos.match(/v\.pregunta_id = any \(array\[([^\]]+)\]\)/);
  assert.ok(llista, 'el resum filtra per una llista tancada');
  const sql = [...llista[1].matchAll(/'([a-z0-9_]+)'/g)].map(m => m[1]);
  assert.deepEqual(sql, PREGUNTES_ISOGLOSSES.map(p => p.id));
  assert.ok(sql.length * 20 <= LIMIT_RESUM_CONSENS, 'cap pregunta del joc no pot quedar fora del límit global');
});

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
  test('R29 · PostgreSQL en memòria necessita un PGlite existent i explícit', {
    skip: entrada ? 'El mòdul indicat no existix; no s’ha executat cap migració.' : 'Falta SDP_PGLITE_MODULE; no s’ha executat cap migració.'
  }, () => {});
} else {
  assert.equal(fs.statSync(modulePath).isFile(), true, 'SDP_PGLITE_MODULE ha d’apuntar al fitxer d’entrada del mòdul.');
  const { PGlite } = await import(moduleURL.href);
  const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
  assert.equal(typeof PGlite, 'function', 'El mòdul indicat no exporta PGlite.');

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

  const DEPENDENCIES_R29 = ['2610241400', '20261114000100', '20261113233000', '20261114023000', '2611091500', '2611110110', '20261114060000'];
  const R23 = ['20261113233000', '20261114023000', '20261114171500', '20261115030000'];
  const SQL_R29 = captures.get(R29)?.sql;
  const ABANS_R29 = files.filter(f => f !== R29);

  /* Els mateixos substituts d'infraestructura que tests/r28-rgpd-quotes-r23.test.mjs. */
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
  async function com(db, who, sql, params = [], { role = who ? 'authenticated' : 'anon', aal = 'aal1' } = {}) {
    await db.exec('BEGIN');
    try {
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claim.role',$2,true), set_config('request.jwt.claims',$3,true)",
        [who ?? '', role, JSON.stringify(who ? { sub: who, role, aal } : { role })]);
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
  const vot = (user, pregunta, etiqueta, variant = clauDeMot(etiqueta)) => ({ user_id: user, pregunta_id: pregunta, variant_clau: variant, paraula_etiqueta: etiqueta });
  const vota = (db, who, filesCos) => com(db, who, ...insercio('joc_isoglosses_vots_consens', filesCos, { conflicte: 'user_id, pregunta_id, variant_clau', retorna: 'pregunta_id, variant_clau' })).then(r => r.rows[0].j);
  const aportacio = (user, n) => ({
    user_id: user, tipus: 'variant_isoglossa', pregunta_id: 'q01_creilla', text_aportat: `Variant sintètica ${n}`,
    poble_comarca: 'Poble sintètic · Comarca sintètica', consentiment_arxiu_obert: true, consentiment_versio: 'cc-by-sa-4.0-v1',
    consentiment_acceptat_at: '2026-11-15T16:00:00.000Z'
  });
  const aporta = (db, who, filesCos) => com(db, who, ...insercio('aportacions_veu_poble', filesCos, { retorna: 'id, estat_moderacio' })).then(r => r.rows[0].j);
  const resum = (db, pregunta = null) => com(db, null, "SELECT coalesce(json_agg(r), '[]'::json) AS j FROM public.resum_consens_isoglosses_poble($1) r", [pregunta]).then(r => r.rows[0].j);
  const enviaCultura = (db, who, n) => com(db, who, "SELECT public.envia_aportacio_cultural($1,'Autoria sintètica','Poble sintètic',$2,true) AS a", [`Títol ${n}`, `Text cultural sintètic ${n}`]).then(r => r.rows[0].a);
  const revisio = (tenant, slug, extra = {}) => ({ tenant_id: tenant, entitat_tipus: 'llavor', entitat_slug: slug, campanya_any: 2026, estat_conservacio: 'Bo', mesures_jsonb: {}, observacions: '', ...extra });
  const revisa = (db, who, filesCos) => com(db, who, ...insercio('revisions_patrimoni', filesCos, { retorna: 'id, versio' })).then(r => r.rows[0].j);
  const quantes = async (db, sql, params) => (await db.query(sql, params)).rows[0].n;
  const error = (codi, prefix) => e => {
    assert.equal(e.code, codi, e.message);
    if (prefix) assert.ok(e.message.startsWith(prefix), e.message);
    return true;
  };
  /* Servidor sense petició de l'API (editor SQL): cap disparador nou hi entra. */
  const servidorCultura = (db, user, n, contingut, fa) => db.query(`INSERT INTO public.aportacions_culturals(usuari_id,titol,autoria,poble,contingut,permisos,creat_a)
    SELECT $1,'T'||g,'A','P',$3,true,now()-$4::interval FROM generate_series(1,$2) g`, [user, n, contingut, fa]);
  const servidorRevisions = (db, user, tenant, n, observacions, prefix) => db.query(`INSERT INTO public.revisions_patrimoni(tenant_id,entitat_tipus,entitat_slug,campanya_any,estat_conservacio,observacions,creat_per)
    SELECT $1,'llavor',$5||'-'||lpad(g::text,5,'0'),2026,'Bo',$4,$2 FROM generate_series(1,$3) g`, [tenant, user, n, observacions, prefix]);
  const servidorVots = (db, user, filesVot) => db.query(`INSERT INTO public.joc_isoglosses_vots_consens(user_id,pregunta_id,variant_clau,paraula_etiqueta)
    SELECT $1, f->>'pregunta_id', f->>'variant_clau', f->>'paraula_etiqueta' FROM jsonb_array_elements($2::jsonb) f`, [user, JSON.stringify(filesVot)]);
  const endarrereix = (db, taula, columnaUsuari, columnaData, user, interval) =>
    db.query(`UPDATE public.${taula} SET ${columnaData}=${columnaData}-$2::interval WHERE ${columnaUsuari}=$1`, [user, interval]);

  const TAULES = ['public.aportacions_veu_poble', 'public.joc_isoglosses_vots_consens', 'public.aportacions_culturals', 'public.revisions_patrimoni',
    'private.xat_fils_fusionats', 'private.xat_fusions_pendents'];
  const FUNCIONS_R29 = ['private.veu_del_poble_exigix_normes()', 'private.aportacions_culturals_limita_ritme()', 'private.revisions_patrimoni_limita_volum()'];
  /** ACL de taula i de columna i polítiques de les taules que toca R29 (la RLS, a part). */
  async function permisos(db) {
    const q = async (sql, p = []) => (await db.query(sql, p)).rows;
    return {
      taules: await q('SELECT c.oid::regclass::text AS taula, c.relacl::text AS acl, c.relforcerowsecurity AS forca FROM pg_class c WHERE c.oid = ANY($1::regclass[]) ORDER BY 1', [TAULES]),
      columnes: await q('SELECT a.attrelid::regclass::text AS taula, a.attname, a.attacl::text AS acl FROM pg_attribute a WHERE a.attrelid = ANY($1::regclass[]) AND a.attnum > 0 AND NOT a.attisdropped ORDER BY 1,2', [TAULES]),
      politiques: await q("SELECT schemaname, tablename, policyname, cmd, roles::text, qual, with_check FROM pg_policies WHERE (schemaname||'.'||tablename) = ANY($1) ORDER BY 1,2,3", [TAULES])
    };
  }
  /** Funcions, disparadors, índexs i RLS que toca R29. */
  async function empremta(db) {
    const q = async (sql, p = []) => (await db.query(sql, p)).rows;
    return {
      funcions: await q(`SELECT p.oid::regprocedure::text AS sig, p.prosecdef, array_to_string(p.proconfig, ',') AS cfg, md5(p.prosrc) AS md5, p.proacl::text AS acl
        FROM pg_proc p WHERE p.oid = ANY(ARRAY[${FUNCIONS_R29.map(f => `to_regprocedure('${f}')`).join(',')}, to_regprocedure('public.resum_consens_isoglosses_poble(text)')]) ORDER BY 1`),
      disparadors: await q('SELECT tgrelid::regclass::text AS taula, tgname, tgenabled, tgtype, tgfoid::regprocedure::text AS funcio FROM pg_trigger WHERE NOT tgisinternal AND tgrelid = ANY($1::regclass[]) ORDER BY 1,2', [TAULES]),
      index: await q("SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes WHERE (schemaname||'.'||tablename) = ANY($1) ORDER BY 1,2,3", [TAULES]),
      rls: await q('SELECT c.oid::regclass::text AS taula, c.relrowsecurity AS rls FROM pg_class c WHERE c.oid = ANY($1::regclass[]) ORDER BY 1', [TAULES])
    };
  }
  const md5Funcio = async (db, sig) => (await db.query('SELECT md5(prosrc) AS m FROM pg_proc WHERE oid=to_regprocedure($1)', [sig])).rows[0]?.m ?? null;
  const rlsPrivades = async db => (await db.query("SELECT c.relname, c.relrowsecurity AS rls FROM pg_class c WHERE c.oid IN (to_regclass('private.xat_fils_fusionats'), to_regclass('private.xat_fusions_pendents')) ORDER BY 1")).rows;
  /* Amb SDP_R29_BASELINE=1 la migració no s'aplica i les mateixes assercions s'avaluen sobre l'estat
     vell: totes les de la correcció han de caure (prova en roig), com SDP_R24_XAT_BASELINE. */
  const BASELINE = process.env.SDP_R29_BASELINE === '1';
  async function aplicaR29(db) {
    if (BASELINE) return;
    try { await db.exec(SQL_R29); } catch (e) { await db.exec('ROLLBACK').catch(() => {}); throw e; }
  }

  describe('R29 · RLS privada, normes R23, sostres per compte i resum del consens en PostgreSQL WASM local', { concurrency: false }, () => {
    const id = n => `29000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
    const TOWN = id(1);
    const P = Object.fromEntries(['ANNA', 'BERTA', 'CARME', 'ZED', 'SENSE', 'CULT_A', 'CULT_B', 'CULT_C', 'CULT_D', 'CULT_E', 'PAT', 'PAT2', 'PAT3', 'ADMIN']
      .map((nom, k) => [nom, id(11 + k)]));
    const SENSE_NORMES = new Set([P.SENSE]);
    const REALS = PREGUNTES_ISOGLOSSES.map(p => p.id);
    let db, errorsCataleg;
    const roig = {};
    let permisosAbans, empremtaAbans, empremta1, empremta2, md5Intactes;

    before(async () => {
      assert.ok(SQL_R29, `la migració ${R29} és al catàleg`);
      ({ db, errors: errorsCataleg } = await creaBase(ABANS_R29));
      assert.deepEqual(errorsCataleg, [], 'No validar R29 sobre un catàleg incomplet');
      await db.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'r29-poble','Poble sintètic') ON CONFLICT DO NOTHING", [TOWN]);
      for (const [n, [nom, who]] of Object.entries(P).entries()) {
        await db.query('INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,now(),$3)',
          [who, `r29-${n}@example.invalid`, { full_name: `Persona sintètica ${n}`, tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
        await db.query('INSERT INTO public.town_memberships(town_id,user_id,role) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [TOWN, who, nom === 'ADMIN' ? 'admin' : 'member']);
        if (!SENSE_NORMES.has(who)) await db.query('INSERT INTO private.normes_acceptades(usuari_id,versio) VALUES($1,private.versio_normes_vigent())', [who]);
      }
      await db.query("UPDATE public.town_memberships SET role='admin' WHERE town_id=$1 AND user_id=$2", [TOWN, P.ADMIN]);

      /* ── Abans de R29: el consens real (2 comptes a les 12 preguntes del joc) i un compte que vota
         preguntes inventades per l'API, en tandes de 60 (la quota R28 de l'hora). */
      for (const who of [P.ANNA, P.BERTA]) {
        await vota(db, who, REALS.map((pregunta, k) => k === 0 ? vot(who, pregunta, 'Creïlla') : vot(who, pregunta, `Variant ${k}`)));
      }
      await vota(db, P.CARME, [vot(P.CARME, 'q01_creilla', 'Creïlla')]);
      /* SQL-R29-04 · Un sol vot amb un altre text sobre la variant que han votat tres persones. */
      await vota(db, P.ZED, [vot(P.ZED, 'q01_creilla', '!! text arbitrari d un sol compte', 'creilla')]);
      const falsos = [];
      for (let q = 0; q <= 12; q++) for (let v = 0; v < 20; v++) falsos.push(vot(P.ZED, `a${String(q).padStart(2, '0')}`, `Text lliure ${v}`));
      for (let k = 0; k < falsos.length; k += 60) {
        await endarrereix(db, 'joc_isoglosses_vots_consens', 'user_id', 'created_at', P.ZED, '61 minutes');
        assert.equal((await vota(db, P.ZED, falsos.slice(k, k + 60))).length, Math.min(60, falsos.length - k));
        await endarrereix(db, 'joc_isoglosses_vots_consens', 'user_id', 'created_at', P.ZED, '61 minutes');
      }
      roig.resum = await resum(db);
      roig.creilla = await resum(db, 'q01_creilla');
      /* SQL-R29-03 · Sense les normes, l'API hi escrivia. */
      roig.votSense = await vota(db, P.SENSE, [vot(P.SENSE, 'q03_bresquilla', 'Bresquilla')]);
      roig.aportacioSense = await aporta(db, P.SENSE, [aportacio(P.SENSE, 'sense-normes')]);
      /* SQL-R29-01 · 25 aportacions culturals en una hora, i la revisió 1001 d'una persona. */
      for (let n = 1; n <= 25; n++) await enviaCultura(db, P.CULT_A, n);
      roig.cultura = await quantes(db, 'SELECT count(*)::int AS n FROM public.aportacions_culturals WHERE usuari_id=$1', [P.CULT_A]);
      await servidorRevisions(db, P.PAT, TOWN, 1000, '', 'llavor');
      roig.revisio = await revisa(db, P.PAT, [revisio(TOWN, 'llavor-api-1001')]);
      roig.rls = await rlsPrivades(db);

      permisosAbans = await permisos(db);
      empremtaAbans = await empremta(db);
      md5Intactes = {};
      for (const sig of ['private.aportacions_veu_poble_limita_ritme()', 'private.joc_isoglosses_vots_limita_ritme()', 'public.envia_aportacio_cultural(text,text,text,text,boolean)',
        'private.exigix_normes_aportacio_cultural()', 'private.prepara_revisio_patrimoni()']) md5Intactes[sig] = await md5Funcio(db, sig);
      await aplicaR29(db);
      empremta1 = await empremta(db);
      await aplicaR29(db);
      empremta2 = await empremta(db);
    });
    after(async () => {
      await db?.close();
      const iguals = [...captures].every(([file, c]) => sha(fs.readFileSync(path.join(ROOT, MIG, file))) === c.sha256);
      assert.equal(iguals, true, 'Les fonts SQL han canviat durant l’assaig; resultat no atribuïble al mateix catàleg.');
      assert.equal(sha(fs.readFileSync(path.join(ROOT, 'supabase/ordre_desplegament.json'))), sha(ordreBytes), 'L’ordre declarat ha canviat durant l’assaig.');
    });

    test('el catàleg complet s’aplica en l’ordre del verificador i R29 hi va l’última, darrere de les seues dependències', t => {
      t.diagnostic(`catàleg: ${files.length} migracions (${versions.filter(v => v.length === 10).length} de 10 xifres i ${versions.filter(v => v.length === 14).length} de 14)`);
      assert.deepEqual(errorsCataleg, []);
      assert.equal(files.at(-1), R29);
      for (const v of DEPENDENCIES_R29) {
        assert.ok(files.findIndex(f => f.startsWith(v + '_')) >= 0, `dependència present: ${v}`);
        assert.ok(dependencies.get('20261115170000').includes(v), `capçalera: depén de ${v}`);
      }
      assert.equal(dependencies.get('20261115170000').includes('20261115030000'), false, 'la R28 no és cap dependència');
    });

    test('en roig sense R29: el consens real fora del resum, una etiqueta d’un sol vot, escriptures sense normes, cap sostre i cap RLS privada', () => {
      assert.equal(roig.resum.length, 250);
      assert.equal(roig.resum.filter(f => REALS.includes(f.pregunta_id)).length, 0, 'SQL-R29-02: el consens real no hi arriba');
      assert.equal(roig.creilla.find(f => f.variant_clau === 'creilla').paraula_etiqueta, '!! text arbitrari d un sol compte', 'SQL-R29-04');
      assert.equal(roig.votSense.length, 1, 'SQL-R29-03: vot sense normes');
      assert.equal(roig.aportacioSense.length, 1, 'SQL-R29-03: aportació sense normes');
      assert.equal(roig.cultura, 25, 'SQL-R29-01: 25 aportacions culturals en una hora');
      assert.equal(roig.revisio.length, 1, 'SQL-R29-01: la revisió 1001');
      assert.deepEqual(roig.rls, [{ relname: 'xat_fils_fusionats', rls: false }, { relname: 'xat_fusions_pendents', rls: false }], 'SQL-R29-06');
    });

    test('idempotent: la segona aplicació no canvia res, i les funcions de la R28 i de la cultura no es toquen', async () => {
      assert.deepEqual(empremta2, empremta1);
      for (const [sig, md5] of Object.entries(md5Intactes)) assert.equal(await md5Funcio(db, sig), md5, sig);
      assert.notEqual(empremta1.funcions.find(f => f.sig === 'resum_consens_isoglosses_poble(text)').md5,
        empremtaAbans.funcions.find(f => f.sig === 'resum_consens_isoglosses_poble(text)').md5, 'el resum és el nou');
      const nous = empremta1.disparadors.filter(d => !empremtaAbans.disparadors.some(a => a.tgname === d.tgname && a.taula === d.taula));
      assert.deepEqual(nous.map(d => [d.taula, d.tgname, d.funcio]), [
        ['aportacions_culturals', 'aportacions_culturals_limita_ritme', 'private.aportacions_culturals_limita_ritme()'],
        ['aportacions_veu_poble', 'aportacions_veu_poble_exigix_normes', 'private.veu_del_poble_exigix_normes()'],
        ['joc_isoglosses_vots_consens', 'joc_isoglosses_vots_exigix_normes', 'private.veu_del_poble_exigix_normes()'],
        ['revisions_patrimoni', 'revisions_patrimoni_quota', 'private.revisions_patrimoni_limita_volum()']
      ]);
      assert.deepEqual(empremta1.index, empremtaAbans.index, 'cap índex nou');
      /* Pel nom: la porta de normes abans de les quotes, i les quotes darrere de les portes existents. */
      const ordre = taula => empremta1.disparadors.filter(d => d.taula === taula).map(d => d.tgname);
      assert.deepEqual(ordre('aportacions_veu_poble'), ['aportacions_veu_poble_exigix_normes', 'aportacions_veu_poble_limita_ritme']);
      assert.deepEqual(ordre('joc_isoglosses_vots_consens'), ['joc_isoglosses_vots_exigix_normes', 'joc_isoglosses_vots_limita_ritme']);
      assert.deepEqual(ordre('aportacions_culturals'), ['aportacions_culturals_exigix_normes', 'aportacions_culturals_limita_ritme']);
      assert.deepEqual(ordre('revisions_patrimoni'), ['revisions_patrimoni_prepara', 'revisions_patrimoni_quota']);
    });

    test('cap GRANT ni política nova; funcions definer amb search_path buit que cap rol de l’API executa; el resum continua públic', async () => {
      assert.deepEqual(await permisos(db), permisosAbans);
      for (const f of empremta1.funcions) {
        assert.equal(f.prosecdef, true, f.sig);
        assert.equal(f.cfg, 'search_path=""', f.sig);
      }
      for (const sig of FUNCIONS_R29) {
        for (const rol of ['public', 'anon', 'authenticated', 'service_role']) {
          assert.equal((await db.query("SELECT has_function_privilege($1,$2,'EXECUTE') AS p", [rol, sig])).rows[0].p, false, `${rol} no executa ${sig}`);
        }
      }
      for (const [rol, pot] of [['anon', true], ['authenticated', true]]) {
        assert.equal((await db.query("SELECT has_function_privilege($1,'public.resum_consens_isoglosses_poble(text)','EXECUTE') AS p", [rol])).rows[0].p, pot, rol);
      }
      const publics = (await db.query("SELECT count(*)::int AS n FROM pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a WHERE p.oid='public.resum_consens_isoglosses_poble(text)'::regprocedure AND a.grantee=0")).rows[0].n;
      assert.equal(publics, 0, 'PUBLIC no l’executa');
    });

    test('SQL-R29-06 · RLS activada sense cap política a les dues taules privades; cap rol de l’API hi entra i la propietària les continua llegint', async () => {
      assert.deepEqual(await rlsPrivades(db), [{ relname: 'xat_fils_fusionats', rls: true }, { relname: 'xat_fusions_pendents', rls: true }]);
      assert.equal(await quantes(db, "SELECT count(*)::int AS n FROM pg_policies WHERE schemaname='private' AND tablename IN ('xat_fils_fusionats','xat_fusions_pendents')"), 0);
      for (const rol of ['anon', 'authenticated', 'service_role']) {
        for (const taula of ['private.xat_fils_fusionats', 'private.xat_fusions_pendents']) {
          for (const priv of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
            assert.equal((await db.query('SELECT has_table_privilege($1,$2,$3) AS p', [rol, taula, priv])).rows[0].p, false, `${rol} ${priv} ${taula}`);
          }
        }
      }
      assert.equal(await quantes(db, 'SELECT (SELECT count(*) FROM private.xat_fils_fusionats) + (SELECT count(*) FROM private.xat_fusions_pendents) AS n'), 0);
    });

    test('SQL-R29-03 · sense les normes, l’API no vota ni aporta (SDP-MOD-428), tampoc amb un vot repetit; amb les normes i des del servidor, sí', async () => {
      const vots = () => quantes(db, 'SELECT count(*)::int AS n FROM public.joc_isoglosses_vots_consens WHERE user_id=$1', [P.SENSE]);
      const aportacions = () => quantes(db, 'SELECT count(*)::int AS n FROM public.aportacions_veu_poble WHERE user_id=$1', [P.SENSE]);
      const [v0, a0] = [await vots(), await aportacions()];
      await assert.rejects(vota(db, P.SENSE, [vot(P.SENSE, 'q05_poal', 'Poal')]), error('42501', 'SDP-MOD-428'));
      await assert.rejects(vota(db, P.SENSE, [vot(P.SENSE, 'q03_bresquilla', 'Bresquilla')]), error('42501', 'SDP-MOD-428'), 'el repetit (ON CONFLICT DO NOTHING) també');
      await assert.rejects(aporta(db, P.SENSE, [aportacio(P.SENSE, 'sense-normes-2')]), error('42501', 'SDP-MOD-428'));
      assert.deepEqual([await vots(), await aportacions()], [v0, a0], 'cap fila nova');
      /* Autoria aliena: la rebutja la RLS, no la porta de normes de ningú. */
      await assert.rejects(vota(db, P.ANNA, [vot(P.SENSE, 'q05_poal', 'Poal')]), e => e.code === '42501' && !e.message.startsWith('SDP-MOD-428'));
      await assert.rejects(aporta(db, P.ANNA, [aportacio(P.SENSE, 'aliena')]), e => e.code === '42501' && !e.message.startsWith('SDP-MOD-428'));
      assert.equal((await vota(db, P.ANNA, [vot(P.ANNA, 'q05_poal', 'Poal')])).length, 1, 'amb les normes, sí');
      assert.equal((await aporta(db, P.ANNA, [aportacio(P.ANNA, 'amb-normes')])).length, 1);
      await servidorVots(db, P.SENSE, [vot(P.SENSE, 'q05_poal', 'Poal')]);
      assert.equal(await vots(), v0 + 1, 'el servidor en queda fora');
      /* Les normes acceptades obrin la porta. */
      await db.query('INSERT INTO private.normes_acceptades(usuari_id,versio) VALUES($1,private.versio_normes_vigent())', [P.SENSE]);
      assert.equal((await vota(db, P.SENSE, [vot(P.SENSE, 'q06_tomaca', 'Tomaca')])).length, 1);
    });

    test('SQL-R29-02 · un compte amb preguntes inventades ja no expulsa el consens real del límit de 250', async () => {
      const ara = await resum(db);
      assert.ok(ara.length <= 250);
      assert.equal(ara.filter(f => !REALS.includes(f.pregunta_id)).length, 0, 'cap pregunta de fora del joc');
      assert.deepEqual([...new Set(ara.map(f => f.pregunta_id))], REALS, 'les dotze preguntes del joc, en ordre');
      const q02 = ara.find(f => f.pregunta_id === 'q02_espencat');
      assert.deepEqual([q02.variant_clau, q02.paraula_etiqueta, q02.total_vots], ['variant_1', 'Variant 1', 2]);
      assert.deepEqual(await resum(db, 'a00'), [], 'una pregunta inventada torna buit');
      assert.ok((await resum(db, 'q01_creilla')).length > 0);
      assert.ok(!JSON.stringify(ara).includes(P.ZED) && !JSON.stringify(ara).includes(P.ANNA), 'cap identificador personal');
    });

    test('SQL-R29-04 · l’etiqueta és la del mot de la clau: un sol vot amb un altre text no la reetiqueta, i sense cap etiqueta que hi case ix la clau', async () => {
      const creilla = (await resum(db, 'q01_creilla')).find(f => f.variant_clau === 'creilla' && f.comarca_id === null);
      assert.deepEqual([creilla.paraula_etiqueta, creilla.total_vots], ['Creïlla', 4], 'el vot continua comptant; el text no ix');
      /* Una variant que només ha votat el compte que ataca, amb un text que no és el seu mot. */
      await servidorVots(db, P.ZED, [vot(P.ZED, 'q07_pimento', 'Compra ara a un lloc de fora', 'brossa')]);
      const brossa = (await resum(db, 'q07_pimento')).find(f => f.variant_clau === 'brossa');
      assert.equal(brossa.paraula_etiqueta, 'brossa', 'mai text lliure: la clau mateixa');
    });

    test('SQL-R29-04 · la clau del mot a l’SQL és la de clauDeMot del client (NFD, sense marques, minúscules i trams fets «_»)', async () => {
      const ETIQUETES = ['Creïlla de secà', 'Pésol·l', 'ÀÉÍÒÚ àéíòú', 'Ñora', 'Çabata', 'İzmir', 'Kelvin K', 'Ångström', 'Bajoca  tendra', '¡Hola!',
        'L’espill', 'Dacsa-blanca', 'Ωmega a', 'Straße', 'Œuvre 12', '  Espai  final  '];
      const filesVot = ETIQUETES.map(e => vot(P.BERTA, 'q10_espill', e));
      assert.equal(new Set(filesVot.map(f => f.variant_clau)).size, ETIQUETES.length, 'claus distintes');
      for (const f of filesVot) assert.match(f.variant_clau, /^[a-z0-9_]{2,80}$/);
      await servidorVots(db, P.BERTA, filesVot);
      /* Un segon vot amb un text que no és el mot de la clau i que, en col·lació "C", passa davant. */
      await servidorVots(db, P.ZED, filesVot.map(f => ({ ...f, paraula_etiqueta: '! brossa' })));
      const files = await resum(db, 'q10_espill');
      for (const f of filesVot) {
        const fila = files.find(r => r.variant_clau === f.variant_clau);
        assert.ok(fila, f.variant_clau);
        assert.equal(fila.paraula_etiqueta, f.paraula_etiqueta.trim(), `${f.paraula_etiqueta} → ${f.variant_clau}`);
      }
    });

    test('SQL-R29-01 · aportacions culturals: 20 en una hora (la 21a cau), passada l’hora tornen a entrar, i qui no té normes cau abans per la porta de 2611091500', async () => {
      for (let n = 1; n <= 20; n++) assert.ok((await enviaCultura(db, P.CULT_B, n)).id);
      await assert.rejects(enviaCultura(db, P.CULT_B, 21), error('42900', 'SDP-CULTURA-429'));
      await assert.rejects(enviaCultura(db, P.CULT_A, 26), error('42900', 'SDP-CULTURA-429'), 'les 25 d’abans de R29 compten');
      assert.equal(await quantes(db, 'SELECT count(*)::int AS n FROM public.aportacions_culturals WHERE usuari_id=$1', [P.CULT_B]), 20);
      await endarrereix(db, 'aportacions_culturals', 'usuari_id', 'creat_a', P.CULT_B, '61 minutes');
      const nova = await enviaCultura(db, P.CULT_B, 21);
      assert.ok(Date.parse(nova.creat_a) > Date.now() - 5 * 60 * 1000, 'creat_a és l’hora del servidor');
      await db.query('DELETE FROM private.normes_acceptades WHERE usuari_id=$1', [P.CULT_A]);
      await assert.rejects(enviaCultura(db, P.CULT_A, 27), error('42501', 'SDP-MOD-428'), 'la porta de normes, no la quota');
    });

    test('SQL-R29-01 · aportacions culturals: 100 en 24 hores, 500 desades i 8 MiB per persona; el servidor en queda fora', async () => {
      await servidorCultura(db, P.CULT_C, 100, 'Text del servidor', '2 hours');
      await assert.rejects(enviaCultura(db, P.CULT_C, 1), error('42900', 'SDP-CULTURA-429'), 'cap en l’última hora: el límit és el del dia');
      await endarrereix(db, 'aportacions_culturals', 'usuari_id', 'creat_a', P.CULT_C, '23 hours');
      assert.ok((await enviaCultura(db, P.CULT_C, 1)).id);
      await servidorCultura(db, P.CULT_D, 500, 'Text del servidor', '3 days');
      await assert.rejects(enviaCultura(db, P.CULT_D, 1),
        error('53400', 'SDP-CULTURA-QUOTA: ja tens 500 aportacions culturals desades i el màxim per persona és 500.'));
      await servidorCultura(db, P.CULT_E, 105, '😀'.repeat(20000), '3 days');
      assert.equal(await quantes(db, 'SELECT count(*)::int AS n FROM public.aportacions_culturals WHERE usuari_id=$1', [P.CULT_E]), 105, 'el servidor escriu sense sostre');
      await assert.rejects(enviaCultura(db, P.CULT_E, 1), error('53400', 'SDP-CULTURA-QUOTA: les teues aportacions culturals ocuparien'));
    });

    test('SQL-R29-01 · revisions de patrimoni: 1000 per persona; esborrar-ne fa lloc i un lot que passa el sostre cau sencer', async () => {
      const deP = who => quantes(db, 'SELECT count(*)::int AS n FROM public.revisions_patrimoni WHERE creat_per=$1', [who]);
      assert.equal(await deP(P.PAT), 1001);
      await assert.rejects(revisa(db, P.PAT, [revisio(TOWN, 'llavor-api-1002')]),
        error('53400', 'SDP-PATRIMONI-QUOTA: ja tens 1001 revisions de patrimoni desades i el màxim per persona és 1000.'));
      const ids = (await db.query('SELECT id FROM public.revisions_patrimoni WHERE creat_per=$1 ORDER BY entitat_slug LIMIT 2', [P.PAT])).rows.map(r => r.id);
      for (const una of ids) assert.equal((await com(db, P.PAT, 'DELETE FROM public.revisions_patrimoni WHERE id=$1', [una])).affectedRows, 1);
      assert.equal((await revisa(db, P.PAT, [revisio(TOWN, 'llavor-api-1002')])).length, 1);
      await assert.rejects(revisa(db, P.PAT, [revisio(TOWN, 'llavor-api-1003')]), error('53400', 'SDP-PATRIMONI-QUOTA'));
      await servidorRevisions(db, P.PAT2, TOWN, 998, '', 'arbre');
      await assert.rejects(revisa(db, P.PAT2, ['a', 'b', 'c'].map(s => revisio(TOWN, `lot-${s}`))), error('53400', 'SDP-PATRIMONI-QUOTA'));
      assert.equal(await deP(P.PAT2), 998, 'cap fila a mitges');
      assert.equal((await revisa(db, P.PAT2, ['a', 'b'].map(s => revisio(TOWN, `lot-${s}`)))).length, 2);
    });

    test('SQL-R29-01 · revisions de patrimoni: 8 MiB per persona; una edició pròpia que creix també els mira, encongir sempre passa i l’administració no compta', async () => {
      await servidorRevisions(db, P.PAT3, TOWN, 530, '😀'.repeat(4000), 'gran');
      await servidorRevisions(db, P.PAT3, TOWN, 1, '', 'petita');
      await assert.rejects(revisa(db, P.PAT3, [revisio(TOWN, 'api-nova')]), error('53400', 'SDP-PATRIMONI-QUOTA: les teues revisions de patrimoni ocuparien'));
      const { id: petita } = (await db.query("SELECT id FROM public.revisions_patrimoni WHERE creat_per=$1 AND entitat_slug='petita-00001'", [P.PAT3])).rows[0];
      const { id: gran } = (await db.query("SELECT id FROM public.revisions_patrimoni WHERE creat_per=$1 AND entitat_slug='gran-00001'", [P.PAT3])).rows[0];
      await assert.rejects(com(db, P.PAT3, "UPDATE public.revisions_patrimoni SET observacions='Una nota que fa créixer la fila' WHERE id=$1", [petita]),
        error('53400', 'SDP-PATRIMONI-QUOTA'));
      assert.equal((await com(db, P.PAT3, "UPDATE public.revisions_patrimoni SET observacions='' WHERE id=$1", [gran])).affectedRows, 1, 'encongir passa');
      assert.equal((await com(db, P.ADMIN, "UPDATE public.revisions_patrimoni SET observacions='Nota de l’administració del poble' WHERE id=$1", [petita], { aal: 'aal2' })).affectedRows, 1,
        'l’edició d’una altra persona no mira la quota de l’autoria');
    });

    /** Una base amb tot el catàleg menys R29; `prepara` corre dins d'una transacció que R29, en avortar, desfà. */
    async function precondicio(llista, prepara, codi, prefix) {
      const { db: base, errors } = await creaBase(llista);
      try {
        assert.deepEqual(errors, []);
        const resumVell = await md5Funcio(base, 'public.resum_consens_isoglosses_poble(text)');
        const rlsVell = await rlsPrivades(base);
        await base.exec('BEGIN');
        await base.exec(prepara);
        await assert.rejects(aplicaR29(base), error(codi, prefix));
        assert.equal(await md5Funcio(base, 'public.resum_consens_isoglosses_poble(text)'), resumVell);
        assert.deepEqual(await rlsPrivades(base), rlsVell);
        for (const sig of FUNCIONS_R29) assert.equal(await md5Funcio(base, sig), null, sig);
      } finally { await base.close(); }
    }

    test('precondició: sense private.peticio_de_servidor() o sense private.ha_acceptat_normes(uuid), R29 avorta neta (SDP-R29-001)', async () => {
      await precondicio(ABANS_R29, 'DROP FUNCTION private.peticio_de_servidor()', '55000', 'SDP-R29-001');
      await precondicio(ABANS_R29, 'DROP FUNCTION private.ha_acceptat_normes(uuid)', '55000', 'SDP-R29-001');
    });

    test('precondició: sense les taules R23, R29 avorta neta (SDP-R29-002)', async () => {
      await precondicio(ABANS_R29.filter(f => !R23.some(v => f.startsWith(v + '_'))), 'SELECT 1', '55000', 'SDP-R29-002');
    });

    test('sense les taules opcionals (R24 privades, cultura i patrimoni), R29 s’aplica igual i no hi posa res', async () => {
      const { db: base, errors } = await creaBase(ABANS_R29);
      try {
        assert.deepEqual(errors, []);
        await base.exec('BEGIN');
        await base.exec('DROP TABLE private.xat_fils_fusionats; DROP TABLE private.xat_fusions_pendents; DROP TABLE public.revisions_patrimoni CASCADE; DROP TABLE public.aportacions_culturals CASCADE;');
        await aplicaR29(base);
        await aplicaR29(base);
        assert.deepEqual(await rlsPrivades(base), []);
        assert.equal(await quantes(base, "SELECT count(*)::int AS n FROM pg_trigger WHERE tgname IN ('aportacions_culturals_limita_ritme','revisions_patrimoni_quota')"), 0);
        assert.equal(await quantes(base, "SELECT count(*)::int AS n FROM pg_trigger WHERE tgname IN ('aportacions_veu_poble_exigix_normes','joc_isoglosses_vots_exigix_normes')"), 2);
      } finally { await base.close(); }
    });
  });
}
