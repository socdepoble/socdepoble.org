// R32.15 · P2 del Gauntlet v1.2.11: registra_denuncia_diligent ha de respectar el rebut
// de denuncia_publicacio_mur. Una denúncia pendent repetida torna repetida:true i el
// detall nou queda com a ampliació append-only, sense reescriure l'original.
// PostgreSQL 18.6 natiu i PGlite obligatoris; cap salt silenciós ni SQL remot.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { creaPlaMigracions, generaSql, preparaHidratacio } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';
import { rebutDenunciaDiligent } from '../src/data/moderacio/denunciesDiligents.js';

const R3213 = readFileSync(new URL('../supabase/snippets/r32_13_pf03_crdt_ack_i_lssi_denuncies.sql', import.meta.url), 'utf8');
const PEGAT = readFileSync(new URL('../supabase/snippets/r32_15_patch_registra_denuncia_diligent_produccio.sql', import.meta.url), 'utf8');
const id = (n) => `32150000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const A = id(1), B = id(2), ADMIN = id(3), TOWN = 'ac3bec76-255b-5ca2-8886-28fcceab4267';
const REPORT = 'select public.registra_denuncia_diligent($1,$2,$3,$4) r';
const COS_R3213 = '8e83339040e3f1cd547246486f1c87a88faa01660e64a8aa2aff7c4418545f21';
const code = (c) => (e) => e.code === c;
const cosDe = (sql, marca) => {
  const i = sql.indexOf(marca), a = sql.indexOf('$$', i) + 2, b = sql.indexOf('$$;', a);
  assert.ok(i >= 0 && a > i && b > a);
  return createHash('sha256').update(sql.slice(a, b)).digest('hex');
};
const COS_R3215 = cosDe(PEGAT, 'create or replace function public.registra_denuncia_diligent(');

async function as(db, who, sql, values = [], ip = '192.0.2.21') {
  await db.query('begin isolation level read committed');
  await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true),set_config('request.headers',$3,true)",
    [who ?? '', JSON.stringify({ sub: who, role: who ? 'authenticated' : 'anon', aal: 'aal2' }), JSON.stringify({ 'x-real-ip': ip })]);
  await db.query(`set local role ${who ? 'authenticated' : 'anon'}`);
  try { const r = await db.query(sql, values); await db.query('commit'); return r.rows; } catch (e) { await db.query('rollback'); throw e; }
}
const cosViu = async (db) => (await db.query("select encode(sha256(convert_to(prosrc,'UTF8')),'hex') h from pg_proc where oid='public.registra_denuncia_diligent(uuid,text,text,uuid)'::regprocedure")).rows[0].h;
const n = async (db, sql, v = []) => (await db.query(sql, v)).rows[0].n;

async function suite(t, db, exec) {
  await exec(generaSql(creaPlaMigracions(), await preparaHidratacio(), { advisoryLock: false }));
  for (const who of [A, B, ADMIN]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)', [who, `${who}@example.invalid`, { full_name: 'R3215 LAB', tenant_id: TOWN, accepta_rgpd: true }]);
    await db.query('insert into private.normes_acceptades(usuari_id,versio) values($1,private.versio_normes_vigent()) on conflict do nothing', [who]);
    await db.query('insert into public.town_memberships(town_id,user_id) values($1,$2) on conflict do nothing', [TOWN, who]);
  }
  await db.query("insert into public.user_platform_roles(user_id,role) values($1,'superadmin') on conflict do nothing", [ADMIN]);
  await exec(R3213);
  for (let k = 0; k < 8; k++) await db.query("insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,payload,visibility) values($1,$2,$3,'mur','LAB',$4,'public')", [id(100 + k), TOWN, A, { content: 'Fixture', status: 'published', visibility: 'public' }]);

  await t.test('preimatge R32.13 reproduïx el defecte: repetida:false i detall nou perdut', async () => {
    assert.equal(await cosViu(db), COS_R3213);
    await as(db, B, REPORT, [id(105), 'altre', 'Primer detall', id(900)]);
    const r = (await as(db, B, REPORT, [id(105), 'spam_frau', 'Detall nou important', id(901)]))[0].r;
    assert.equal(r.repetida, false, 'el defecte P2 es reproduïx abans del pegat');
    assert.equal(await n(db, "select count(*)::int n from private.r3213_lssi_audit a join public.denuncies d on d.id=a.denuncia_id where d.objecte_id=$1 and a.justificacio like '%Detall nou important%'", [id(105)]), 0);
  });

  await t.test('pegat idempotent: preimatge → postimatge → no-op, ACL exacta', async () => {
    // Supabase Cloud: privilegi per defecte de service_role sobre public.* (ALTER DEFAULT PRIVILEGES) i EXECUTE heretat.
    await db.query('alter default privileges in schema public grant all on functions to service_role');
    await db.query('grant execute on function public.registra_denuncia_diligent(uuid,text,text,uuid) to service_role');
    await exec(PEGAT);
    assert.equal(await cosViu(db), COS_R3215);
    const oid = (await db.query("select 'public.registra_denuncia_diligent(uuid,text,text,uuid)'::regprocedure::oid o")).rows[0].o;
    await exec(PEGAT);
    assert.equal((await db.query("select 'public.registra_denuncia_diligent(uuid,text,text,uuid)'::regprocedure::oid o")).rows[0].o, oid);
    const acl = (await db.query("select has_function_privilege('anon',$1::regprocedure,'EXECUTE') anon,has_function_privilege('authenticated',$1::regprocedure,'EXECUTE') auth,has_function_privilege('service_role',$1::regprocedure,'EXECUTE') svc", ['public.registra_denuncia_diligent(uuid,text,text,uuid)'])).rows[0];
    assert.deepEqual(acl, { anon: true, auth: true, svc: false });
  });

  await t.test('deriva desconeguda avorta tota la transacció sense tocar res', async () => {
    const abans = await cosViu(db);
    await db.query("create or replace function public.registra_denuncia_diligent(p_publicacio uuid,p_motiu text,p_detall text,p_operacio uuid) returns jsonb language sql security definer set search_path='' as $$ select '{}'::pg_catalog.jsonb $$");
    const deriva = await cosViu(db);
    await assert.rejects(exec(PEGAT), (e) => /SDP-R3215-DRIFT/.test(e.message));
    await db.query('rollback').catch(() => {});
    assert.equal(await cosViu(db), deriva);
    // Torna la preimatge real i reaplica el pegat (camí de producció).
    const i = R3213.indexOf('create function public.registra_denuncia_diligent('), j = R3213.indexOf('end; $$;', i) + 'end; $$;'.length;
    await db.query(R3213.slice(i, j).replace('create function', 'create or replace function'));
    assert.equal(await cosViu(db), COS_R3213);
    await exec(PEGAT);
    assert.equal(await cosViu(db), abans);
  });

  let primer;
  await t.test('primera denúncia: rebut exacte i repetida:false', async () => {
    primer = (await as(db, B, REPORT, [id(100), 'altre', 'Detall original', id(300)]))[0].r;
    assert.deepEqual(rebutDenunciaDiligent(primer), { id: primer.id, estat: 'rebuda', versio: 1, repetida: false });
  });

  await t.test('denúncia pendent repetida amb detall nou: repetida:true, ampliació append-only, original intacte', async () => {
    const r = (await as(db, B, REPORT, [id(100), 'spam_frau', 'Detall nou amb la prova', id(301)]))[0].r;
    assert.deepEqual(r, { ...primer, repetida: true });
    assert.equal(await n(db, 'select count(*)::int n from public.denuncies where objecte_id=$1', [id(100)]), 1);
    assert.equal((await db.query('select detall from public.denuncies where id=$1', [primer.id])).rows[0].detall, 'Detall original');
    const amp = (await db.query("select actor_id,anterior,estat,justificacio from private.r3213_lssi_audit where denuncia_id=$1 and anterior is not null order by creat_al", [primer.id])).rows;
    assert.deepEqual(amp, [{ actor_id: B, anterior: 'rebuda', estat: 'rebuda', justificacio: 'Ampliació del denunciant (motiu: spam_frau): Detall nou amb la prova' }]);
    // Replay exacte: mateix rebut, cap fila nova.
    assert.deepEqual((await as(db, B, REPORT, [id(100), 'spam_frau', 'Detall nou amb la prova', id(301)]))[0].r, { ...primer, repetida: true });
    assert.equal(await n(db, 'select count(*)::int n from private.r3213_lssi_audit where denuncia_id=$1', [primer.id]), 2);
    await assert.rejects(as(db, B, REPORT, [id(100), 'altre', 'Canviat', id(301)]), code('40001'));
  });

  await t.test('repetició literal no apunta res; com a màxim cinc ampliacions distintes', async () => {
    assert.equal((await as(db, B, REPORT, [id(100), 'altre', 'Detall original', id(302)]))[0].r.repetida, true);
    assert.equal((await as(db, B, REPORT, [id(100), 'spam_frau', 'Detall nou amb la prova', id(303)]))[0].r.repetida, true);
    assert.equal(await n(db, 'select count(*)::int n from private.r3213_lssi_audit where denuncia_id=$1', [primer.id]), 2);
    for (let k = 0; k < 7; k++) assert.equal((await as(db, B, REPORT, [id(100), 'altre', `Ampliació ${k}`, id(310 + k)]))[0].r.repetida, true);
    assert.equal(await n(db, "select count(*)::int n from private.r3213_lssi_audit where denuncia_id=$1 and starts_with(justificacio,'Ampliació del denunciant')", [primer.id]), 5);
  });

  await t.test('ampliació conserva l\'estat versionat del flux i no el fa avançar', async () => {
    // Publicació neta: el límit de cinc ampliacions de la prova anterior no hi compta.
    const d = (await as(db, B, REPORT, [id(103), 'altre', 'Original en revisió', id(450)]))[0].r;
    assert.equal((await as(db, ADMIN, 'select public.revisa_denuncia_diligent($1,$2,$3,$4,$5,$6) r', [d.id, 'rebuda', 1, 'en_revisio', 'Revisió humana', id(400)]))[0].r.versio, 2);
    const r = (await as(db, B, REPORT, [id(103), 'altre', 'Després de la revisió', id(500)]))[0].r;
    assert.deepEqual(r, { id: d.id, estat: 'en_revisio', versio: 2, repetida: true });
    const amp = (await db.query("select anterior,estat from private.r3213_lssi_audit where denuncia_id=$1 and starts_with(justificacio,'Ampliació del denunciant')", [d.id])).rows;
    assert.deepEqual(amp, [{ anterior: 'en_revisio', estat: 'en_revisio' }]);
    assert.deepEqual((await db.query('select estat,versio from private.r3213_lssi_flux where denuncia_id=$1', [d.id])).rows[0], { estat: 'en_revisio', versio: 2 });
  });

  await t.test('el camí deduplicat té quota: com a màxim 20 rebuts per persona i denúncia, el primer inclòs', async () => {
    const d = (await as(db, A, REPORT, [id(104), 'altre', 'Primera de A', id(700)]))[0].r;
    for (let k = 1; k <= 19; k++) assert.equal((await as(db, A, REPORT, [id(104), 'altre', `Repetició ${k}`, id(700 + k)]))[0].r.repetida, true);
    await assert.rejects(as(db, A, REPORT, [id(104), 'altre', 'Una de massa', id(799)]), code('42900'));
    // El replay d'una operació ja rebuda continua tornant el seu rebut.
    assert.deepEqual((await as(db, A, REPORT, [id(104), 'altre', 'Repetició 3', id(703)]))[0].r, { ...d, repetida: true });
  });

  await t.test('la denúncia repetida es busca pel tipus exacte de la publicació', async () => {
    const d = (await as(db, B, REPORT, [id(106), 'altre', 'Publicació', id(800)]))[0].r;
    await as(db, B, "select public.denuncia_contingut('producte',$1,'altre','Una altra via')", [id(106)]);
    const r = (await as(db, B, REPORT, [id(106), 'spam_frau', 'Ampliació de la publicació', id(801)]))[0].r;
    assert.equal(r.id, d.id); assert.equal(r.repetida, true);
  });

  await t.test('anònims i objectes distints continuen creant denúncies noves', async () => {
    const a1 = (await as(db, null, REPORT, [id(101), 'altre', 'Anònim u', id(600)], '198.51.100.7'))[0].r;
    const a2 = (await as(db, null, REPORT, [id(101), 'altre', 'Anònim dos', id(601)], '198.51.100.7'))[0].r;
    assert.equal(a1.repetida, false); assert.equal(a2.repetida, false); assert.notEqual(a1.id, a2.id);
    // ADMIN: B ja ha esgotat la quota de cinc denúncies noves per minut del disparador.
    const altre = (await as(db, ADMIN, REPORT, [id(102), 'ofensiu', 'Una altra publicació', id(602)]))[0].r;
    assert.equal(altre.repetida, false); assert.notEqual(altre.id, primer.id);
  });

  await t.test('ACL: el rebut no exposa auditoria; cap lectura directa de les taules privades', async () => {
    for (const who of [null, A, B]) await assert.rejects(as(db, who, 'select * from private.r3213_lssi_audit'), code('42501'));
  });
}

test('R32.15 LSSI repetida natiu PostgreSQL 18.6', { timeout: 180000 }, async (t) => {
  const c = await startLocalPostgres(); t.after(() => c.close());
  assert.match((await c.db.query('select version() v')).rows[0].v, /PostgreSQL 18\.6(?:\s|$)/);
  await suite(t, c.db, (sql) => c.db.query(sql));
});

test('R32.15 LSSI repetida paritat PGlite sense salts amagats', { timeout: 180000 }, async (t) => {
  assert.ok(process.env.SDP_PGLITE_MODULE, 'Set SDP_PGLITE_MODULE explicitly; SQL verification never silently skips.');
  const url = pathToFileURL(process.env.SDP_PGLITE_MODULE), { PGlite } = await import(url.href), { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', url));
  const initial = new PGlite(); await initial.exec('create database socdepoble_node0'); const image = await initial.dumpDataDir('none'); await initial.close();
  const pg = new PGlite({ database: 'socdepoble_node0', loadDataDir: image, extensions: { pgcrypto } }); t.after(() => pg.close());
  await suite(t, pg, (sql) => pg.exec(sql));
});
