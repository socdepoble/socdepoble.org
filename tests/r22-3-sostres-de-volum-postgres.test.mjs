/* R22.3 · La migració 20261114000200 (sostres de volum per compte) sobre
   PostgreSQL 18.6 real, amb tot el catàleg anterior en l'ordre del verificador
   (també R22.2) i el residu literal de producció de public.user_tags (q10, q11,
   q12 i q14 del 13-11-2026). L'aplica dues vegades seguides amb un rol sense
   superusuari i afirma que cada sostre salta amb el seu codi SDP-* i que els
   fluxos legítims del client continuen: una nota amb una foto enganxada de
   5 MiB, el xat, la publicació directa al Mur i les dues RPC de publicació
   (publica_nota_al_mur i revoca_publicacio_de_nota). Cap servei remot. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const MIGRATION = '20261114000200_r22_3_sostres_de_volum.sql';
const id = n => `22300000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1);
const [F, G, H, O, E, X, Y, Z, P, Q] = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(id);
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const MiB = 1024 * 1024;
const error = (code, prefix) => e => e.code === code && (!prefix || e.message.startsWith(prefix));

/* Residu literal de producció: public.user_tags (q11 columnes, q12 claus, q14 polítiques, q10 ACL). */
const USER_TAGS_PRODUCCIO = `
  create table public.user_tags (id uuid not null default gen_random_uuid(), user_id uuid not null, tag_name text not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP, constraint user_tags_pkey primary key (id),
    constraint user_tags_user_id_tag_name_key unique (user_id, tag_name));
  alter table public.user_tags enable row level security;
  create policy "Users can delete their own tags" on public.user_tags for delete to public using ((auth.uid() = user_id));
  create policy "Users can insert their own tags" on public.user_tags for insert to authenticated with check ((auth.uid() = user_id));
  create policy "Users manage own tags" on public.user_tags for all to authenticated using ((( select auth.uid() as uid) = user_id));
  grant all on table public.user_tags to anon, authenticated, service_role;`;

async function actor(db, who, sql, params = [], { role = who ? 'authenticated' : 'anon', aal = 'aal1', setRole = true } = {}) {
  await db.query('begin');
  try {
    if (setRole) await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
      [who ?? '', role, JSON.stringify({ sub: who, role, aal })]);
    const result = Array.isArray(sql) ? await sql.reduce((p, [s, v]) => p.then(() => db.query(s, v ?? [])), Promise.resolve()) : await db.query(sql, params);
    await db.query('commit'); return result;
  } catch (e) { await db.query('rollback'); throw e; }
}
/* Com el servidor (service_role): cap sostre. */
const servidor = (db, sql, params = []) => actor(db, null, sql, params, { role: 'service_role', setRole: false });
const nota = (n, owner, bytes, extra = '') => [`insert into public.notes(id,tenant_id,owner_user_id,title,content) values($1,$2,$3,'Nota sintètica',$4)${extra}`,
  [id(n), TOWN, owner, `<p><img src="data:image/jpeg;base64,${'A'.repeat(bytes)}"></p>`]];
const publicacio = (n, owner, { seccio = 'mur', payload = {}, creat = null } = {}) => [
  `insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,description,payload${creat ? ',created_at' : ''})
   values($1,$2,$3,$4,'Publicació sintètica','',$5${creat ? ',$6' : ''}) returning id, created_at`,
  [id(n), TOWN, owner, seccio, { content: '<p>Text sintètic</p>', status: 'published', visibility: 'public', ...payload }, ...(creat ? [creat] : [])]];

/* Fixture: historial de xat ja escrit fa una estona (sense disparadors, amb seq explícit). */
const antics = async (sql, params) => {
  await db_.query('begin');
  try { await db_.query("set local session_replication_role = 'replica'"); await db_.query(sql, params); await db_.query('commit'); }
  catch (e) { await db_.query('rollback'); throw e; }
};
let db_;

async function empremta(db) {
  const q = async sql => (await db.query(sql)).rows;
  const acl = "array(select case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end || ':' || a.privilege_type from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee <> p.proowner order by 1)::text";
  return {
    funcions: await q(`select p.oid::regprocedure::text as sig, p.prosecdef, p.proconfig::text as cfg, md5(p.prosrc) as md5, ${acl} as acl from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'private' and p.proname in ('notes_limita_volum','fusible_mida_bd','organitzacions_frena_abus','trigger_rate_limit_xat','publicacions_limita_volum') order by 1`),
    disparadors: await q(`select tgrelid::regclass::text as taula, tgname, tgenabled, tgtype, tgattr::text, tgfoid::regprocedure::text as funcio from pg_trigger
      where tgrelid in ('public.notes'::regclass,'public.organizations'::regclass,'public.xat_missatges'::regclass,'public.section_submissions'::regclass) and not tgisinternal order by 1,2`),
    index: await q("select indexname, indexdef from pg_indexes where indexname in ('idx_notes_owner','idx_section_submissions_owner_created') order by 1"),
    userTags: await q("select (select count(*)::int from pg_policies where tablename='user_tags') as politiques, has_table_privilege('anon','public.user_tags','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') as anon, has_table_privilege('authenticated','public.user_tags','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') as auth")
  };
}

test('R22.3 · sostres de volum per compte sobre PostgreSQL 18.6 real', { timeout: 300000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  db_ = db;
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as n")).rows[0].n, '180006');
    const plan = creaPlaMigracions();
    const posicio = plan.migrations.findIndex(m => m.file === MIGRATION);
    assert.ok(posicio > plan.migrations.findIndex(m => m.file.startsWith('20261114000100_')), 'darrere de R22.2');
    await db.query(plan.bootstrap);
    for (const migration of plan.migrations.slice(0, posicio)) {
      await db.query('begin');
      try { await db.query(migration.body); await db.query('commit'); }
      catch (e) { await db.query('rollback'); throw new Error(`baseline ${migration.file}: ${e.message}`, { cause: e }); }
    }
    await db.query(USER_TAGS_PRODUCCIO);
    /* Primitives de plataforma de Supabase (q10): authenticated escriu section_submissions per l'API. */
    await db.query(`alter table auth.users add column if not exists created_at timestamptz not null default now(), add column if not exists last_sign_in_at timestamptz;
      grant select on public.towns to authenticated;
      grant insert, update, delete on public.section_submissions to authenticated;`);
    await db.query("insert into public.towns(id,slug,name) values($1,'r22-3-sostres','Poble sintètic')", [TOWN]);
    for (const [n, who] of [F, G, H, O, E, X, Y, Z, P, Q].entries()) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: `Persona sintètica ${n}`, tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
      await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
    }
    await db.query("insert into public.user_platform_roles(user_id,role) values($1,'superadmin') on conflict do nothing", [E]);
    await db.query("insert into public.user_tags(user_id,tag_name) values($1,'etiqueta heretada')", [F]);
    assert.equal((await actor(db, F, 'select count(*)::int as n from public.user_tags')).rows[0].n, 1, 'abans: la llegix i l’escriu per l’API');

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

    await t.test('user_tags: fora els privilegis i les polítiques; les files es queden', async () => {
      assert.deepEqual(primera.userTags, [{ politiques: 0, anon: false, auth: false }]);
      await assert.rejects(actor(db, F, 'select * from public.user_tags'), error('42501'));
      assert.equal((await db.query('select count(*)::int as n from public.user_tags')).rows[0].n, 1);
    });

    await t.test('notes: una foto enganxada de 5 MiB passa; 9 MiB, no (SDP-NOTES-MIDA)', async () => {
      assert.equal((await actor(db, F, ...nota(100, F, 5 * MiB, ' returning id'))).rows.length, 1);
      await assert.rejects(actor(db, F, ...nota(101, F, 9 * MiB)), error('22001', 'SDP-NOTES-MIDA'));
      assert.equal((await actor(db, F, 'update public.notes set title=$2 where id=$1 returning id', [id(100), 'Títol nou'])).rows.length, 1, 'editar-la continua');
    });

    await t.test('notes: una petició no passa de 16 MiB (SDP-NOTES-LOT)', async () => {
      await assert.rejects(actor(db, G, [nota(110, G, 7 * MiB), nota(111, G, 7 * MiB), nota(112, G, 7 * MiB)]), error('54000', 'SDP-NOTES-LOT'));
      assert.equal((await db.query('select count(*)::int as n from public.notes where owner_user_id=$1', [G])).rows[0].n, 0, 'res a mitges');
      await actor(db, G, [nota(110, G, 7 * MiB), nota(111, G, 7 * MiB)]);
    });

    await t.test('notes: una persona no passa de 50 MiB (SDP-NOTES-QUOTA); el servidor sí', async () => {
      for (let n = 0; n < 6; n++) await servidor(db, ...nota(120 + n, H, 8000000));
      await assert.rejects(actor(db, H, ...nota(130, H, 5 * MiB)), error('53400', 'SDP-NOTES-QUOTA'));
      assert.equal((await actor(db, H, ...nota(131, H, 1000, ' returning id'))).rows.length, 1, 'una nota menuda encara hi cap');
      assert.equal((await servidor(db, ...nota(132, H, 5 * MiB, ' returning id'))).rows.length, 1, 'service_role en queda fora');
    });

    await t.test('notes: per damunt de la quota es pot buidar (paperera, retirar del Mur, encongir); créixer, no', async () => {
      /* H ja passa de 50 MiB (sis notes de 8 MB i una de 5 MiB del servidor). */
      await assert.rejects(actor(db, H, "update public.notes set content = content || '<p>més</p>' where id=$1", [id(131)]), error('53400', 'SDP-NOTES-QUOTA'), 'fer-la créixer, no');
      assert.equal((await actor(db, H, "update public.notes set status='paperera' where id=$1 returning id", [id(120)])).rows.length, 1, 'enviar-la a la paperera');
      assert.equal((await actor(db, H, "update public.notes set status='activa' where id=$1 returning id", [id(120)])).rows.length, 1, 'restaurar-la');
      const rebut = (await actor(db, H, "select public.publica_nota_al_mur($1,$2,'mur',$3,1,$4) as r",
        [id(131), id(133), { title: 'Acte públic', content: '<p>Cos públic</p>', status: 'published', visibility: 'public' }, id(50133)])).rows[0].r;
      assert.ok(rebut && rebut.publicacio, 'publicar una nota que ja té');
      const revisio = (await db.query('select revision from public.notes where id=$1', [id(131)])).rows[0].revision;
      assert.equal((await actor(db, H, 'select public.revoca_publicacio_de_nota($1,$2,$3,$4) as ok', [id(131), TOWN, revisio, id(133)])).rows[0].ok, true, 'retirar-la del Mur');
      assert.equal((await actor(db, H, "update public.notes set content='<p>curt</p>' where id=$1 returning id", [id(121)])).rows.length, 1, 'encongir-la');
    });

    await t.test('notes: l’emoticona (notes.icon, sense fita) compta a la quota', async () => {
      for (let n = 0; n < 7; n++) await actor(db, Q, `insert into public.notes(id,tenant_id,owner_user_id,title,content,icon) values($1,$2,$3,'Nota sintètica','',$4)`, [id(150 + n), TOWN, Q, 'x'.repeat(7 * MiB)]);
      await assert.rejects(actor(db, Q, `insert into public.notes(id,tenant_id,owner_user_id,title,content,icon) values($1,$2,$3,'Nota sintètica','',$4)`, [id(157), TOWN, Q, 'x'.repeat(7 * MiB)]), error('53400', 'SDP-NOTES-QUOTA'));
      await servidor(db, 'delete from public.notes where owner_user_id=$1', [Q]);
    });

    await t.test('notes: amb la base per damunt de 350 MiB, el fusible para les altes però no la paperera', async () => {
      await db.query('begin');
      try {
        await db.query('create table public.r22_3_llast(x text)');
        await db.query('alter table public.r22_3_llast alter column x set storage external');
        await db.query("insert into public.r22_3_llast select repeat(md5(g::text), 32768) from generate_series(1, 360) g");
        assert.ok((await db.query('select pg_database_size(current_database()) as n')).rows[0].n > 367001600);
        await db.query('savepoint s');
        await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)", [F, JSON.stringify({ sub: F, role: 'authenticated' })]);
        await db.query('set local role authenticated');
        await assert.rejects(db.query(...nota(140, F, 10)), error('53100', 'SDP-BD-PLENA'));
        await db.query('rollback to savepoint s');
        /* CODEX-R24-11 · notes.icon no té cap fita de longitud i ja compta al sostre per
           persona: un canvi NOMÉS de l'emoticona també fa créixer Notes i el fusible l'ha de parar. */
        await db.query('savepoint s_icon');
        await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)", [F, JSON.stringify({ sub: F, role: 'authenticated' })]);
        await db.query('set local role authenticated');
        await assert.rejects(db.query('update public.notes set icon=$2 where id=$1 returning id', [id(100), 'x'.repeat(4096)]), error('53100', 'SDP-BD-PLENA'), 'un UPDATE només de notes.icon també para');
        await db.query('rollback to savepoint s_icon');
        await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)", [F, JSON.stringify({ sub: F, role: 'authenticated' })]);
        await db.query('set local role authenticated');
        assert.equal((await db.query("update public.notes set status='paperera', trashed_at=now() where id=$1 returning id", [id(100)])).rows.length, 1);
      } finally { await db.query('rollback'); }
    });

    await t.test('notes: sota el llindar del fusible, canviar l’emoticona continua (control de CODEX-R24-11)', async () => {
      assert.ok((await db.query('select pg_database_size(current_database()) as n')).rows[0].n < 367001600);
      assert.equal((await actor(db, F, 'update public.notes set icon=$2 where id=$1 returning id', [id(100), '🌳'])).rows.length, 1);
    });

    await t.test('organitzacions: 5 al dia, 20 en total, noms d’institució; el superadmin i el servidor en queden fora', async () => {
      const crea = (who, slug, nom = `Comerç ${slug}`, opts) => actor(db, who, "select (public.create_organization($1,'company',$2,$3)->>'id') as id", [TOWN, nom, slug], opts);
      for (let n = 1; n <= 5; n++) await crea(O, `r22-3-o-${n}`);
      await assert.rejects(crea(O, 'r22-3-o-6'), error('42900', 'SDP-ORG-429'));
      await db.query("update public.organizations set created_at = now() - interval '2 days' where created_by = $1", [O]);
      for (let n = 6; n <= 20; n++) {
        await db.query("insert into public.organizations(tenant_id,kind,name,slug,visibility,created_by,created_at) values($1,'company',$2,$3,'public',$4,now() - interval '3 days')", [TOWN, `Comerç ${n}`, `r22-3-o-${n}`, O]);
      }
      await assert.rejects(crea(O, 'r22-3-o-21'), error('42900', 'SDP-ORG-429'), 'el total');
      await assert.rejects(crea(P, 'r22-3-ajuntament', 'Ajuntament de la Prova'), error('42501', 'SDP-ORG-403'));
      const forn = (await crea(P, 'r22-3-forn', 'Forn de Pa de la Plaça')).rows[0].id;
      await assert.rejects(actor(db, P, 'update public.organizations set name=$2 where id=$1', [forn, 'Policia Local']), error('42501', 'SDP-ORG-403'), 'reanomenar no el salta');
      assert.ok((await crea(P, 'r22-3-hisenda', 'Hisenda El Molí')).rows[0].id, 'una hisenda és una finca');
      for (let n = 1; n <= 6; n++) await crea(E, `r22-3-e-${n}`, `Entitat ${n}`, { aal: 'aal2' });
      await servidor(db, "insert into public.organizations(tenant_id,kind,name,slug,visibility,created_by) values($1,'company','Ajuntament importat','r22-3-servidor','public',$2)", [TOWN, O]);
    });

    /* Crítica de seguretat del lliurament R22 · El nom que es veu és el que compta. Un guionet
       opcional (U+00AD) o un espai d'amplada zero no es veuen; un accent descompost (NFD), un espai
       dur, un doble espai (l'HTML el plega) o una lletra ciríl·lica o d'amplada completa pinten el
       mateix nom. El prerender ja els neteja (tooling/seo/text-veinal.mjs · textVeinal i
       nomNormalitzat); la guarda del servidor ha de veure el mateix. Cap nom legítim canvia. */
    await t.test('organitzacions: un nom d’institució disfressat amb Unicode continua sent SDP-ORG-403', async () => {
      const R = id(31);
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [R, `${R}@example.invalid`, { full_name: 'Persona sintètica R', tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
      await actor(db, R, "select public.accepta_normes_convivencia('2026-10-24')");
      const crea = (slug, nom) => actor(db, R, "select (public.create_organization($1,'company',$2,$3)->>'id') as id", [TOWN, nom, slug]);
      const disfressats = [
        ['r22-3-u-guionet', 'Ajunta­ment de la Prova'],
        ['r22-3-u-zwsp', 'Poli​cia Local'],
        ['r22-3-u-nfd', 'Policía Local'],
        ['r22-3-u-nbsp', 'Guardia Civil del Poble'],
        ['r22-3-u-doble', 'Casa de  la Vila'],
        ['r22-3-u-ciril', 'Аjuntament de la Prova'],
        ['r22-3-u-ample', 'Ａｊｕｎｔａｍｅｎｔ de la Prova']
      ];
      const admesos = [];
      for (const [slug, nom] of disfressats) {
        try { await crea(slug, nom); admesos.push(slug); } catch (e) { assert.ok(error('42501', 'SDP-ORG-403')(e), `${slug}: ${e.code} ${e.message}`); }
      }
      assert.deepEqual(admesos, [], 'noms d’institució disfressats que han entrat');
      assert.equal((await db.query('select count(*)::int as n from public.organizations where created_by=$1', [R])).rows[0].n, 0, 'cap disfressa ha entrat');
      /* Els noms legítims, també amb accents descompostos o ç, passen igual que abans. */
      for (const [slug, nom] of [['r22-3-u-moli', 'Forn El Molí'], ['r22-3-u-nfd-ok', 'Càn Pep de la Placa'], ['r22-3-u-calcat', 'Calçats Rosa']]) {
        assert.ok((await crea(slug, nom)).rows[0].id, nom);
      }
    });

    /* CODEX-R24-05 (D-ORG, decisió del Mestre) · Només es reserva un nom o un identificador que
       COMENÇA per la designació d'una institució (o que n'és exactament una), amb article o
       tractament davant si cal. Un comerç amb la institució al mig del nom («Forn de l'Ajuntament»,
       «Bar de la Plaça de l'Ajuntament», «Bar El Policia») és un nom legítim. La normalització del
       nom que es veu (NFKD, marques combinants, invisibles, confusables i espais) es conserva: la
       disfressa d'una institució al principi continua sent SDP-ORG-403. */
    await t.test('organitzacions (D-ORG): una institució al mig del nom és un comerç; al principi del nom o de l’identificador, no', async () => {
      const [S, T, U] = [32, 33, 34].map(id);
      for (const [n, who] of [S, T, U].entries()) {
        await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
          [who, `${who}@example.invalid`, { full_name: `Persona sintètica D-ORG ${n}`, tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
        await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
      }
      const crea = (who, slug, nom) => actor(db, who, "select (public.create_organization($1,'company',$2,$3)->>'id') as id", [TOWN, nom, slug]);
      /* Comerços i entitats de poble: la institució és al mig del nom o de l'identificador. */
      const rebutjats = [];
      for (const [who, slug, nom] of [
        [S, 'r24-dorg-forn', 'Forn de l’Ajuntament'],
        [S, 'r24-dorg-bar-placa', 'Bar de la Plaça de l’Ajuntament'],
        [S, 'r24-dorg-bar-policia', 'Bar El Policia'],
        [S, 'r24-dorg-amics', 'Amics de la Casa de la Vila'],
        [T, 'r24-dorg-cafeteria', 'Cafetería frente al Ayuntamiento'],
        [T, 'r24-dorg-penya', 'Penya Carrer Generalitat'],
        [T, 'r24-dorg-bar-ajuntament', 'Bar Nou']
      ]) {
        try { assert.ok((await crea(who, slug, nom)).rows[0].id, nom); }
        catch (e) { rebutjats.push(`${nom} (${slug}): ${e.code}`); }
      }
      assert.deepEqual(rebutjats, [], 'comerços amb la institució al mig del nom o de l’identificador que s’han rebutjat');
      /* Reanomenar: cap a una institució al mig, sí; cap a una al principi, no. */
      const forn = (await crea(T, 'r24-dorg-forn-placa', 'Forn de la Plaça')).rows[0].id;
      assert.equal((await actor(db, T, 'update public.organizations set name=$2 where id=$1 returning id', [forn, 'Forn de l’Ajuntament Vell'])).rows.length, 1, 'reanomenar amb la institució al mig');
      await assert.rejects(actor(db, T, 'update public.organizations set name=$2 where id=$1', [forn, 'L’Ajuntament de la Plaça']), error('42501', 'SDP-ORG-403'), 'reanomenar cap a una institució al principi');
      /* Al principi (també exactament), amb article o tractament, puntuació, cometes, emoticona,
         amplada completa, confusables o invisibles: continua reservat. Cap d'estos entra. */
      const reservats = [
        ['r24-dorg-r-exacte', 'Ajuntament'],
        ['r24-dorg-r-l-tipo', 'L’Ajuntament de la Prova'],
        ['r24-dorg-r-l-ascii', "L'Ajuntament de la Prova"],
        ['r24-dorg-r-excm', 'Excm. Ajuntament de la Prova'],
        ['r24-dorg-r-excmo', 'Excmo. Ayuntamiento de la Prueba'],
        ['r24-dorg-r-mi', 'M. I. Ajuntament de la Prova'],
        ['r24-dorg-r-cometes', '«Ajuntament de la Prova»'],
        ['r24-dorg-r-emoji', '🏛️ Ajuntament de la Prova'],
        ['r24-dorg-r-guardia', 'La Guàrdia Civil'],
        ['r24-dorg-r-jutjat', 'El Jutjat de Pau'],
        ['r24-dorg-r-ample', 'Ｌａ Ｇｅｎｅｒａｌｉｔａｔ'],
        ['r24-dorg-r-ciril', 'L’Аjuntament de la Prova'],
        ['r24-dorg-r-zwsp', 'La Poli​cia Local'],
        ['r24-dorg-r-guionet', 'El Consis­tori Nou'],
        ['ajuntament-de-la-prova', 'Forn Nou'],
        ['l-ajuntament-nou', 'Forn Nou']
      ];
      const colats = [];
      for (const [slug, nom] of reservats) {
        try { await crea(U, slug, nom); colats.push(`${nom} (${slug})`); }
        catch (e) { assert.ok(error('42501', 'SDP-ORG-403')(e), `${nom} (${slug}): ${e.code} ${e.message}`); }
      }
      assert.deepEqual(colats, [], 'noms o identificadors que comencen per una institució i han entrat');
      assert.equal((await db.query('select count(*)::int as n from public.organizations where created_by=$1', [U])).rows[0].n, 0);
    });

    await t.test('xat: la ràfega de R22.0 continua (15 cada 5 s)', async () => {
      const fil = (await actor(db, Z, 'select public.crea_fil_directe($1,$2,null) as id', [TOWN, Z])).rows[0].id;
      for (let n = 1; n <= 15; n++) await actor(db, Z, "select * from public.xat_envia($1,$2,'text',$3,null,'{}')", [id(1000 + n), fil, `Missatge ${n}`]);
      await assert.rejects(actor(db, Z, "select * from public.xat_envia($1,$2,'text','16',null,'{}')", [id(1016), fil]), error('42900', 'SDP-XAT-429: Has superat el límit de missatges permesos (15/5s).'));
    });

    await t.test('xat: 600 missatges per hora (SDP-XAT-429); el servidor en queda fora', async () => {
      const fil = (await actor(db, X, 'select public.crea_fil_directe($1,$2,null) as id', [TOWN, X])).rows[0].id;
      await antics(`insert into public.xat_missatges(id,fil_id,usuari_id,text,seq,creat_al)
        select gen_random_uuid(), $1, $2, 'Missatge antic ' || g, 1000000 + g, now() - interval '30 minutes' from generate_series(1, 600) g`, [fil, X]);
      await assert.rejects(actor(db, X, "select * from public.xat_envia($1,$2,'text','un més',null,'{}')", [id(1100), fil]), error('42900', 'SDP-XAT-429: Has superat el límit de missatges permesos (600/h).'));
      assert.equal((await servidor(db, "insert into public.xat_missatges(id,fil_id,usuari_id,text) values($1,$2,$3,'del servidor') returning id", [id(1101), fil, X])).rows.length, 1);
    });

    await t.test('xat: 4 MiB per hora (SDP-XAT-429); un compte normal no ho nota', async () => {
      const fil = (await actor(db, Y, 'select public.crea_fil_directe($1,$2,null) as id', [TOWN, Y])).rows[0].id;
      await antics(`insert into public.xat_missatges(id,fil_id,usuari_id,text,metadades,seq,creat_al)
        select gen_random_uuid(), $1, $2, repeat('€', 4096), jsonb_build_object('x', repeat('m', 16000)), 1000000 + g, now() - interval '20 minutes' from generate_series(1, 150) g`, [fil, Y]);
      await assert.rejects(actor(db, Y, "select * from public.xat_envia($1,$2,'text','hola',null,'{}')", [id(1200), fil]), error('42900', 'SDP-XAT-429: Has superat el volum de missatges permés (4 MB/h).'));
      const filQ = (await actor(db, Q, 'select public.crea_fil_directe($1,$2,null) as id', [TOWN, Q])).rows[0].id;
      for (let n = 1; n <= 3; n++) await actor(db, Q, "select * from public.xat_envia($1,$2,'text',$3,null,'{}')", [id(1300 + n), filQ, `Bon dia ${n}`]);
    });

    await t.test('Mur: created_at del servidor, sostre de payload i ritme a la inserció directa', async () => {
      const fila = (await actor(db, F, ...publicacio(2000, F, { creat: 'infinity' }))).rows[0];
      assert.ok(Math.abs(new Date(fila.created_at) - Date.now()) < 60000, `created_at forçat: ${fila.created_at}`);
      await assert.rejects(actor(db, F, ...publicacio(2001, F, { payload: { farciment: 'x'.repeat(1.5 * MiB) } })), error('22001', 'SDP-MUR-MIDA'));
      assert.equal((await actor(db, F, ...publicacio(2002, F, { seccio: 'notes', payload: { farciment: 'x'.repeat(2 * MiB) } }))).rows.length, 1, 'secció notes fins a 8 MiB');
      await assert.rejects(actor(db, F, ...publicacio(2003, F, { seccio: 'notes', payload: { farciment: 'x'.repeat(9 * MiB) } })), error('22001', 'SDP-MUR-MIDA'));
      /* Una fila vella més gran que el sostre es pot continuar editant sense créixer. */
      await servidor(db, ...publicacio(2004, F, { payload: { farciment: 'x'.repeat(2 * MiB) } }));
      assert.equal((await actor(db, F, 'update public.section_submissions set title=$2 where id=$1 returning id', [id(2004), 'Títol nou'])).rows.length, 1);
      assert.equal((await actor(db, F, "update public.section_submissions set payload = payload - 'farciment' || '{\"farciment\":\"curt\"}' where id=$1 returning id", [id(2004)])).rows.length, 1);
      /* Ritme: 59 publicacions de fa deu minuts, la 60a passa, la 61a no; tornar a publicar la mateixa sí. */
      for (let n = 0; n < 59; n++) await servidor(db, ...publicacio(2100 + n, G, { creat: new Date(Date.now() - 600000).toISOString() }));
      await actor(db, G, ...publicacio(2200, G));
      await assert.rejects(actor(db, G, ...publicacio(2201, G)), error('42900', 'SDP-MUR-429'));
      const [upsert, valors] = publicacio(2200, G);
      assert.equal((await actor(db, G, upsert.replace(' returning', ' on conflict (id) do update set title = excluded.title returning'), valors)).rows.length, 1);
      assert.equal((await servidor(db, ...publicacio(2202, G))).rows.length, 1, 'service_role en queda fora');
    });

    await t.test('Mur: publica_nota_al_mur i revoca_publicacio_de_nota continuen, amb els mateixos sostres', async () => {
      const publica = (who, n, act, payload = {}) => actor(db, who, "select public.publica_nota_al_mur($1,$2,'mur',$3,1,$4) as r",
        [id(n), id(act), { title: 'Acte públic', content: '<p>Cos públic</p>', status: 'published', visibility: 'public', ...payload }, id(act + 50000)]);
      await actor(db, P, "insert into public.notes(id,tenant_id,owner_user_id,title,content) values($1,$2,$3,'Nota per al Mur','<p>Cos</p>')", [id(3000), TOWN, P]);
      const rebut = (await publica(P, 3000, 3001)).rows[0].r;
      assert.ok(rebut && rebut.publicacio, JSON.stringify(rebut));
      const creada = (await db.query('select created_at from public.section_submissions where id=$1', [id(3001)])).rows[0].created_at;
      assert.ok(Math.abs(new Date(creada) - Date.now()) < 60000);
      const revisio = (await db.query('select revision from public.notes where id=$1', [id(3000)])).rows[0].revision;
      assert.equal((await actor(db, P, 'select public.revoca_publicacio_de_nota($1,$2,$3,$4) as ok', [id(3000), TOWN, revisio, id(3001)])).rows[0].ok, true);
      await actor(db, P, "insert into public.notes(id,tenant_id,owner_user_id,title,content) values($1,$2,$3,'Nota gran','<p>Cos</p>')", [id(3010), TOWN, P]);
      await assert.rejects(publica(P, 3010, 3011, { farciment: 'x'.repeat(1.5 * MiB) }), error('22001', 'SDP-MUR-MIDA'));
      for (let n = 0; n < 60; n++) await servidor(db, ...publicacio(3100 + n, P, { creat: new Date(Date.now() - 600000).toISOString() }));
      await actor(db, P, "insert into public.notes(id,tenant_id,owner_user_id,title,content) values($1,$2,$3,'Nota 61','<p>Cos</p>')", [id(3020), TOWN, P]);
      await assert.rejects(publica(P, 3020, 3021), error('42900', 'SDP-MUR-429'));
    });
  } finally {
    await cluster.close();
  }
});
