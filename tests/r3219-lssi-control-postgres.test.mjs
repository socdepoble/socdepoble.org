import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { creaPlaMigracions, generaSql, preparaHidratacio } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const PATCH = read('supabase/snippets/r32_19_lssi_control_i_unicode.sql');
const PROBE = read('supabase/snippets/r32_19_sonda_readonly_files_120_121.sql');
const id = n => `32190000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const A = id(1), B = id(2), ADMIN = id(3), TOWN = 'ac3bec76-255b-5ca2-8886-28fcceab4267';
const REPORT = 'select public.registra_denuncia_diligent($1,$2,$3,$4) r';
const REVIEW = 'select public.revisa_denuncia_diligent($1,$2,$3,$4,$5,$6) r';
const code = expected => error => error.code === expected;
async function as(db, who, sql, values = []) {
  await db.query('begin');
  await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true),set_config('request.headers',$3,true)", [who ?? '', JSON.stringify({ sub: who, role: who ? 'authenticated' : 'anon', aal: 'aal2' }), '{"x-real-ip":"192.0.2.19"}']);
  await db.query(`set local role ${who ? 'authenticated' : 'anon'}`);
  try { const result = await db.query(sql, values); await db.query('commit'); return result.rows; }
  catch (error) { await db.query('rollback'); throw error; }
}
const snapshot = async db => (await db.query("select (select count(*)::int from public.denuncies) denuncies,(select count(*)::int from private.r3213_lssi_audit) audit,(select count(*)::int from private.r3213_lssi_rebuts) rebuts,(select sum(versio)::int from private.r3213_lssi_flux) versions")).rows;
const hashes = async db => (await db.query("select proname,encode(sha256(convert_to(prosrc,'UTF8')),'hex') hash,proconfig,prosecdef,proacl::text acl from pg_proc where oid in ('public.registra_denuncia_diligent(uuid,text,text,uuid)'::regprocedure,'public.revisa_denuncia_diligent(uuid,text,integer,text,text,uuid)'::regprocedure,'public.admin_revisa_denuncia_lssi(uuid,text,text,text)'::regprocedure) order by proname")).rows;
async function suite(t, db, exec) {
  await exec(generaSql(creaPlaMigracions(), await preparaHidratacio(), { advisoryLock: false }));
  for (const who of [A, B, ADMIN]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)', [who, `${who}@example.invalid`, { full_name: 'R3219 LAB', tenant_id: TOWN, accepta_rgpd: true }]);
    await db.query('insert into private.normes_acceptades(usuari_id,versio) values($1,private.versio_normes_vigent()) on conflict do nothing', [who]);
    await db.query('insert into public.town_memberships(town_id,user_id) values($1,$2) on conflict do nothing', [TOWN, who]);
  }
  await db.query("insert into public.user_platform_roles(user_id,role) values($1,'superadmin')", [ADMIN]);
  await exec(read('supabase/snippets/r32_13_pf03_crdt_ack_i_lssi_denuncies.sql'));
  await exec(read('supabase/snippets/r32_15_patch_registra_denuncia_diligent_produccio.sql'));
  for (let k = 0; k < 3; k++) await db.query("insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,payload,visibility) values($1,$2,$3,'mur','LAB',$4,'public')", [id(100 + k), TOWN, A, { content: 'Fixture', status: 'published', visibility: 'public' }]);
  await t.test('preimatge reproduïx control persistit; el pegat conserva històric sense validar-lo retrospectivament', async () => {
    const antic = (await as(db, B, REPORT, [id(100), 'altre', 'antic\u0001detall', id(200)]))[0].r;
    await exec(PATCH);
    assert.equal((await db.query('select detall from public.denuncies where objecte_id=$1', [id(100)])).rows[0].detall, 'antic\u0001detall');
    assert.equal((await as(db, ADMIN, REVIEW, [antic.id, 'rebuda', 1, 'en_revisio', 'Revisió d’històric intacte', id(201)]))[0].r.versio, 2);
  });
  await t.test('reaplicació exacta, cos i ACL estables; helper privat sense EXECUTE API', async () => {
    const before = await hashes(db); await exec(PATCH); assert.deepEqual(await hashes(db), before);
    assert.ok(before.every(f => f.prosecdef && f.proconfig.join('') === 'search_path=""'));
    assert.equal((await db.query("select prosecdef from pg_proc where oid='private.r3219_denuncia_detall_valid()'::regprocedure")).rows[0].prosecdef, true);
    for (const who of [null, B]) await assert.rejects(as(db, who, "select private.r3219_lssi_text_valid('text')"), code('42501'));
  });
  await t.test('tots els C0 vetats i DEL: nova denúncia rebutjada sense cap efecte ni rebut', async () => {
    const before = await snapshot(db);
    for (const c of [...Array(32).keys()].filter(c => ![0, 9, 10, 13].includes(c)).concat(127)) {
      await assert.rejects(as(db, B, REPORT, [id(101), 'altre', 'x' + String.fromCharCode(c) + 'y', id(300 + c)]), code('22023'));
    }
    assert.deepEqual(await snapshot(db), before);
  });
  let report;
  await t.test('TAB, LF, CR, emoji i màxim de 1000 caràcters Unicode continuen admesos', async () => {
    const valid = '😀'.repeat(994) + '\t\n\rxyz';
    report = (await as(db, B, REPORT, [id(101), 'altre', valid, id(500)]))[0].r;
    assert.equal((await db.query('select char_length(detall) n from public.denuncies where id=$1', [report.id])).rows[0].n, 1000);
    await assert.rejects(as(db, B, REPORT, [id(101), 'altre', valid + 'x', id(501)]), code('22023'));
  });
  await t.test('ampliació rebutjada encara després de cinc notes; no pot colar-se per deduplicació/quota', async () => {
    for (let k = 0; k < 5; k++) assert.equal((await as(db, B, REPORT, [id(101), 'altre', 'ampliació ' + k, id(510 + k)]))[0].r.repetida, true);
    const before = await snapshot(db);
    await assert.rejects(as(db, B, REPORT, [id(101), 'altre', 'x\u007fy', id(520)]), code('22023'));
    assert.deepEqual(await snapshot(db), before);
  });
  await t.test('notes humanes: RPC diligent i clàssica refusen control abans de canvi d’estat', async () => {
    const before = await snapshot(db);
    await assert.rejects(as(db, ADMIN, REVIEW, [report.id, 'rebuda', 1, 'en_revisio', 'x\u000by', id(600)]), code('22023'));
    await assert.rejects(as(db, ADMIN, "select public.admin_revisa_denuncia_lssi($1,'revisada',$2,'pendent')", [report.id, 'x\u000cy']), code('22023'));
    assert.deepEqual(await snapshot(db), before);
    assert.equal((await as(db, ADMIN, REVIEW, [report.id, 'rebuda', 1, 'en_revisio', 'Revisió\namb prova 😀', id(601)]))[0].r.versio, 2);
  });
  await t.test('CHECK cobreix inserció antiga i notes directes privilegiades, sense afeblir RLS', async () => {
    const before = await snapshot(db);
    await assert.rejects(as(db, A, "select public.denuncia_publicacio_mur($1,'altre',$2)", [id(102), 'x\u0001y']), code('22023'));
    await assert.rejects(db.query('insert into private.r3213_lssi_audit(denuncia_id,actor_id,estat,justificacio) values($1,$2,\'en_revisio\',$3)', [report.id, ADMIN, 'x\u0001y']), code('23514'));
    assert.deepEqual(await snapshot(db), before);
  });
  /* Gauntlet v1.2.15 · public.denuncia_contingut és SECURITY INVOKER: el disparador de detall ha de ser
     SECURITY DEFINER perquè anon, authenticated i service_role no tenen EXECUTE sobre l'ajudant privat. */
  await t.test('denuncia_contingut (INVOKER) i service_role: el disparador definer no trenca cap rol i el control dona 22023', async () => {
    assert.equal((await db.query("select prosecdef from pg_proc where oid='private.r3219_denuncia_detall_valid()'::regprocedure")).rows[0].prosecdef, true);
    const CONTINGUT = "select public.denuncia_contingut('missatge',$1,'altre',$2) r";
    for (const [k, who] of [null, B].entries()) {
      assert.equal((await as(db, who, CONTINGUT, [`r3219-msg-${k}-amb`, 'detall correcte']))[0].r.rebuda, true);
      assert.equal((await as(db, who, CONTINGUT, [`r3219-msg-${k}-sense`, null]))[0].r.rebuda, true);
      await assert.rejects(as(db, who, CONTINGUT, [`r3219-msg-${k}-control`, 'x\u0001y']), code('22023'));
    }
    await db.query('begin'); await db.query('set local role service_role');
    try {
      await db.query("insert into public.denuncies(objecte_tipus,objecte_id,motiu,detall) values('persona','r3219-srv','altre','servei')");
      await db.query("update public.denuncies set detall='servei revisat' where objecte_id='r3219-srv'");
      await db.query('commit');
    } catch (error) { await db.query('rollback'); throw error; }
    assert.equal((await db.query("select detall from public.denuncies where objecte_id='r3219-srv'")).rows[0].detall, 'servei revisat');
  });
  await t.test('NUL i UTF8 de surrogats no tenen representació SQL; JSON invalida els desaparellats', async () => {
    for (const bytes of ['00', 'eda080', 'edb080', 'eda080edb080']) await assert.rejects(db.query("select convert_from(decode($1,'hex'),'UTF8')", [bytes]), code('22021'));
    for (const json of ['"\\ud800"', '"\\udfff"', '"\\ud800x"', '"\\udfff\\ud800"']) await assert.rejects(db.query('select $1::jsonb', [json]), code('22P02'));
    assert.equal((await db.query("select $1::jsonb #>> '{}' as t", ['"\\ud83d\\ude00"'])).rows[0].t, '😀');
  });
  await t.test('sonda 120–121: transacció read-only, estructura positiva sense mutació', async () => {
    const before = await snapshot(db); await exec(PROBE); assert.deepEqual(await snapshot(db), before);
    assert.match(PROBE, /begin read only;/i); assert.doesNotMatch(PROBE, /\b(?:insert|update|delete|create|alter|drop|grant|revoke)\b/i);
  });
  await t.test('constraint ja validada es conserva; deriva de trigger o CHECK avorta sense rebaixar-la', async () => {
    await db.query('alter table private.r3213_lssi_audit validate constraint r3219_r3213_lssi_audit_justificacio_text_valid');
    await exec(PATCH);
    assert.equal((await db.query("select convalidated v from pg_constraint where conrelid='private.r3213_lssi_audit'::regclass and conname='r3219_r3213_lssi_audit_justificacio_text_valid'")).rows[0].v, true);
    const original = (await db.query("select pg_get_functiondef('private.r3219_denuncia_detall_valid()'::regprocedure) ddl")).rows[0].ddl;
    await db.query("create or replace function private.r3219_denuncia_detall_valid() returns trigger language plpgsql set search_path='' as $$begin return new; end;$$");
    const before = await hashes(db); await assert.rejects(exec(PATCH), /SDP-R3219-DRIFT: trigger de detall/); await db.query('rollback'); assert.deepEqual(await hashes(db), before);
    await db.query(original);
    await db.query('alter table private.lssi_revisions drop constraint r3219_lssi_revisions_justificacio_text_valid');
    await db.query('alter table private.lssi_revisions add constraint r3219_lssi_revisions_justificacio_text_valid check (true) not valid');
    await assert.rejects(exec(PATCH), /SDP-R3219-DRIFT: constraint lssi_revisions/); await db.query('rollback');
    assert.equal((await db.query("select pg_get_expr(conbin,conrelid,false) e from pg_constraint where conrelid='private.lssi_revisions'::regclass and conname='r3219_lssi_revisions_justificacio_text_valid'")).rows[0].e, 'true');
  });
  await t.test('deriva desconeguda avorta tot el pegat; cap helper ni RPC parcial', async () => {
    await db.query("create or replace function public.registra_denuncia_diligent(p_publicacio uuid,p_motiu text,p_detall text,p_operacio uuid) returns jsonb language sql security definer set search_path='' as $$ select '{}'::jsonb $$");
    const before = await hashes(db); await assert.rejects(exec(PATCH), /SDP-R3219-DRIFT/); await db.query('rollback'); assert.deepEqual(await hashes(db), before);
  });
}
test('R32.19 LSSI PostgreSQL 18.6 natiu', { timeout: 180000 }, async t => {
  const c = await startLocalPostgres(); t.after(() => c.close());
  assert.match((await c.db.query('select version() v')).rows[0].v, /PostgreSQL 18\.6(?:\s|$)/);
  await suite(t, c.db, sql => c.db.query(sql));
});
test('R32.19 LSSI paritat PGlite obligatòria', { timeout: 180000 }, async t => {
  assert.ok(process.env.SDP_PGLITE_MODULE, 'SDP_PGLITE_MODULE és obligatori.');
  const url = pathToFileURL(process.env.SDP_PGLITE_MODULE), { PGlite } = await import(url.href), { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', url));
  const seed = new PGlite(); await seed.exec('create database socdepoble_node0'); const image = await seed.dumpDataDir('none'); await seed.close();
  const db = new PGlite({ database: 'socdepoble_node0', loadDataDir: image, extensions: { pgcrypto } }); t.after(() => db.close());
  await suite(t, db, sql => db.exec(sql));
});
