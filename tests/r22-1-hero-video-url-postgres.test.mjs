/* R22.1 · Gauntlet r221-dades-03, r221-dades-06 i r221-ui-04 · La migració
   20261113060000 sobre PostgreSQL 18.6 real, amb tot el catàleg anterior en
   l'ordre del verificador: la columna hero_video_url naix amb el seu CHECK i
   els seus permisos, la persona i les gestores la desen, el directori, la RPC
   de l'editor i perfil_public la tornen (perfil_public només a la fitxa
   sencera), i tornar-la a aplicar no canvia res. Cap servei remot. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';
import { esVideoDeCapcaleraDesable } from '../src/utils/sanitize.js';

const MIGRATION = '20261113060000_r22_1_hero_video_url.sql';
const id = n => `22100000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), OTHER_TOWN = id(2), ALICE = id(11), BOB = id(12), EVE = id(13), ORG = id(50), PRIVADA = id(51);
const VIDEO = 'https://socdepoble.org/media/video-sintetic.mp4';
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const error = code => e => e.code === code;

async function actor(db, who, sql, params = [], role = who ? 'authenticated' : 'anon') {
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
      [who ?? '', role, JSON.stringify({ sub: who, role, aal: 'aal1' })]);
    const result = await db.query(sql, params); await db.query('commit'); return result;
  } catch (e) { await db.query('rollback'); throw e; }
}

/* L'empremta del que la migració toca: columnes, restriccions, permisos de columna, vista i funcions. */
async function empremta(db) {
  const q = async sql => (await db.query(sql)).rows;
  return {
    columnes: await q("select table_name,column_name,data_type,is_nullable from information_schema.columns where table_schema='public' and column_name='hero_video_url' order by 1"),
    checks: await q("select conrelid::regclass::text as taula,conname,pg_get_constraintdef(oid) as def from pg_constraint where conname like '%hero_video_url%' order by 1,2"),
    permisos: await q("select table_name,grantee,privilege_type from information_schema.column_privileges where table_schema='public' and column_name='hero_video_url' order by 1,2,3"),
    vista: await q("select pg_get_viewdef('public.organization_directory'::regclass) as def"),
    funcions: await q("select p.oid::regprocedure::text as sig,pg_get_function_result(p.oid) as res,p.prosrc,p.proacl::text as acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('list_my_organizations','perfil_public') order by 1")
  };
}

test('R22.1 · hero_video_url: CHECK, permisos, lectura i idempotència sobre PostgreSQL 18.6 real', { timeout: 180000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as n")).rows[0].n, '180006');
    const plan = creaPlaMigracions();
    /* R22.0 · La reconciliació 20261113112500 va darrere; R22.1 continua darrere de tot el catàleg de
       deu dígits i de 20261113003000, i només la seguixen versions de catorze dígits posteriors. */
    const posicio = plan.migrations.findIndex(m => m.file === MIGRATION);
    assert.ok(posicio > plan.migrations.findIndex(m => m.file.startsWith('20261113003000_')), 'el pla del verificador la posa darrere de 20261113003000');
    assert.ok(plan.migrations.slice(posicio + 1).every(m => /^\d{14}_/.test(m.file) && m.file > MIGRATION), 'darrere de tot el catàleg de deu dígits');
    await db.query(plan.bootstrap);
    for (const migration of plan.migrations.slice(0, posicio)) {
      await db.query('begin');
      try { await db.query(migration.body); await db.query('commit'); }
      catch (e) { await db.query('rollback'); throw new Error(`baseline ${migration.file}: ${e.message}`, { cause: e }); }
    }
    await db.query("insert into public.towns(id,slug,name) values($1,'r22-video','Poble sintètic'),($2,'r22-video-altre','Altre poble')", [TOWN, OTHER_TOWN]);
    for (const [who, name, town] of [[ALICE, 'Persona sintètica A', TOWN], [BOB, 'Persona sintètica B', TOWN], [EVE, 'Persona d’un altre poble', OTHER_TOWN]]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: name, tenant_id: town, accepta_rgpd: true, rgpd: true }]);
      await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
    }
    await db.query("insert into public.organizations(id,tenant_id,kind,name,slug,created_by,visibility) values($1,$2,'company','Empresa sintètica','r22-empresa',$3,'public')", [ORG, TOWN, ALICE]);
    await db.query("insert into public.organizations(id,tenant_id,kind,name,slug,created_by,visibility) values($1,$2,'group','Grup privat sintètic','r22-grup',$3,'members')", [PRIVADA, TOWN, ALICE]);
    const quiMana = (await db.query('select user_id,role from public.organization_memberships where organization_id=$1', [ORG])).rows;
    assert.deepEqual(quiMana.map(r => r.user_id), [ALICE], 'la gestora és la persona que l’ha creada (disparador real)');

    await t.test('Abans: cap columna, i el PATCH de la persona falla com el PGRST204 que el client degrada', async () => {
      assert.deepEqual((await empremta(db)).columnes, []);
      await assert.rejects(actor(db, ALICE, 'update public.profiles set hero_video_url=$1 where id=$2', [VIDEO, ALICE]), error('42703'));
    });

    const sql = read(`supabase/migrations/${MIGRATION}`);
    t.diagnostic(`${MIGRATION} sha256=${createHash('sha256').update(sql).digest('hex')}`);
    await db.query(sql);
    const primera = await empremta(db);

    await t.test('Idempotent: la segona aplicació deixa la mateixa empremta i cap fila canviada', async () => {
      const files = (await db.query('select id,hero_video_url,updated_at::text from public.organizations order by id')).rows;
      await db.query(sql);
      assert.deepEqual(await empremta(db), primera);
      assert.deepEqual((await db.query('select id,hero_video_url,updated_at::text from public.organizations order by id')).rows, files);
      assert.deepEqual(primera.columnes.map(c => [c.table_name, c.data_type, c.is_nullable]),
        [['organization_directory', 'text', 'YES'], ['organizations', 'text', 'YES'], ['profiles', 'text', 'YES']]);
    });

    await t.test('Permisos de columna mínims: UPDATE a authenticated; SELECT d’organizations a anon i authenticated; cap a anon per escriure', async () => {
      const permisos = primera.permisos.map(p => `${p.table_name}:${p.grantee}:${p.privilege_type}`);
      for (const esperat of ['organizations:anon:SELECT', 'organizations:authenticated:SELECT', 'organizations:authenticated:UPDATE', 'profiles:authenticated:UPDATE']) {
        assert.ok(permisos.includes(esperat), esperat);
      }
      assert.ok(!permisos.some(p => /:anon:(UPDATE|INSERT)$/.test(p)), permisos.join(', '));
      await assert.rejects(actor(db, null, 'update public.organizations set hero_video_url=$1 where id=$2', [VIDEO, ORG]), error('42501'));
    });

    await t.test('La persona desa, canvia i lleva el seu vídeo; el RETURNING el torna', async () => {
      for (const valor of [VIDEO, 'sdp-media://mitjans/22100000/video.webm', '/media/video-propi.mp4', 'https://socdepoble.cat/media/spot.webm?v=2', '', null]) {
        const r = await actor(db, ALICE, 'update public.profiles set hero_video_url=$1 where id=$2 returning hero_video_url', [valor, ALICE]);
        assert.deepEqual(r.rows, [{ hero_video_url: valor }], String(valor));
      }
      const r = await actor(db, BOB, 'update public.profiles set hero_video_url=$1 where id=$2 returning id', [VIDEO, ALICE]);
      assert.equal(r.rowCount, 0, 'ningú no escriu el vídeo d’una altra persona');
    });

    await t.test('El CHECK rebutja el bucket privat, el que no és vídeo, els orígens no https i els trucs de camí', async () => {
      const dolentes = [
        'sdp-media://mitjans_privats/22100000-0000-4000-8000-000000000011/secret.mp4',
        'sdp-media://mitjans/../fora.mp4',
        'https://socdepoble.org/media/foto.webp',
        'https://socdepoble.org/media/sense-extensio',
        'https://socdepoble.org.mp4',
        'http://socdepoble.org/media/video.mp4',
        '//fora.example/video.mp4',
        '/\\fora.example/video.mp4',
        'javascript:alert(1)//.mp4',
        'data:video/mp4;base64,AAAA.mp4',
        `https://socdepoble.org/media/${'v'.repeat(2050)}.mp4`,
        'https://socdepoble.org/media/salt\nde-linia.mp4',
        // R22.1 (r221-dades-03) · Un relatiu sense barra inicial: el client tampoc no l'admet (esVideoDeCapcaleraDesable).
        'media/x.mp4',
        './x.mp4',
        'x.webm'
      ];
      for (const valor of dolentes) {
        await assert.rejects(actor(db, ALICE, 'update public.profiles set hero_video_url=$1 where id=$2', [valor, ALICE]), error('23514'), `profiles · ${valor.slice(0, 60)}`);
        await assert.rejects(actor(db, ALICE, 'update public.organizations set hero_video_url=$1 where id=$2', [valor, ORG]), error('23514'), `organizations · ${valor.slice(0, 60)}`);
      }
    });

    /* R22.1 (r221-dades-03) · Paritat de veres: tot el que el validador únic
       del client (esVideoDeCapcaleraDesable, el de valorPerDesar i del diàleg)
       admet, el CHECK ho admet; i els valors que el client rebutja per forma
       (relatius sense barra, http://, el bucket privat, '..') el CHECK també
       els rebutja. El client pot ser més estricte (l'origen), mai més laxe. */
    await t.test('Paritat: el CHECK admet tot el que admet el validador del client', async () => {
      const corpus = [
        VIDEO, 'https://socdepoble.cat/media/spot.webm?v=2', 'https://socdepoble.cat/media/spot.WEBM#t=3',
        'https://SOCDEPOBLE.ORG/media/MAJUSCULES.MP4', 'sdp-media://mitjans/22100000/spot.mp4', 'SDP-MEDIA://mitjans/u/spot.webm',
        '/media/video-propi.mp4', '/media/amb espai.mp4', 'https://socdepoble.org/media/x.mp4\u0085', '/media/x\u2028.mp4',
        'media/x.mp4', './x.mp4', '../x.mp4', 'x.webm', 'http://localhost/media/v.mp4', 'http://socdepoble.org/media/video.mp4',
        'sdp-media://mitjans_privats/u/secret.mp4', 'sdp-media://mitjans/../fora.mp4', 'sdp-media://mitjans/a/../../b.webm',
        'https://socdepoble.org/media/a.mp4/..', 'https://socdepoble.org/media/foto.webp'
      ];
      const admesos = corpus.filter(valor => esVideoDeCapcaleraDesable(valor));
      assert.ok(admesos.length >= 8, admesos.join(' | '));
      for (const valor of admesos) {
        const r = await actor(db, ALICE, 'update public.profiles set hero_video_url=$1 where id=$2 returning hero_video_url', [valor, ALICE]);
        assert.deepEqual(r.rows, [{ hero_video_url: valor }], `client sí, CHECK no · ${JSON.stringify(valor)}`);
      }
      for (const valor of ['media/x.mp4', './x.mp4', '../x.mp4', 'x.webm', 'http://localhost/media/v.mp4', 'sdp-media://mitjans_privats/u/secret.mp4', 'sdp-media://mitjans/../fora.mp4']) {
        assert.equal(esVideoDeCapcaleraDesable(valor), false, `client · ${valor}`);
        await assert.rejects(actor(db, ALICE, 'update public.profiles set hero_video_url=$1 where id=$2', [valor, ALICE]), error('23514'), `CHECK · ${valor}`);
      }
      await actor(db, ALICE, 'update public.profiles set hero_video_url=null where id=$1', [ALICE]);
    });

    await t.test('La gestora desa el vídeo de l’entitat; el directori, la RPC de l’editor i la fitxa el tornen; ningú més no l’escriu', async () => {
      const desat = await actor(db, ALICE, 'update public.organizations set hero_video_url=$1 where id=$2 returning hero_video_url', [VIDEO, ORG]);
      assert.deepEqual(desat.rows, [{ hero_video_url: VIDEO }]);
      assert.equal((await actor(db, BOB, 'update public.organizations set hero_video_url=null where id=$1 returning id', [ORG])).rowCount, 0);
      const editor = (await actor(db, ALICE, 'select id,hero_url,hero_video_url from public.list_my_organizations($1)', [TOWN])).rows;
      assert.deepEqual(editor.find(r => r.id === ORG), { id: ORG, hero_url: null, hero_video_url: VIDEO });
      for (const who of [null, BOB, EVE]) {
        const directori = (await actor(db, who, 'select id,hero_video_url from public.organization_directory where id=any($1)', [[ORG, PRIVADA]])).rows;
        assert.deepEqual(directori, [{ id: ORG, hero_video_url: VIDEO }], `directori · ${who ?? 'anon'}`);
      }
      const columnes = (await db.query("select column_name from information_schema.columns where table_schema='public' and table_name='organization_directory' order by ordinal_position")).rows.map(r => r.column_name);
      assert.deepEqual(columnes.slice(-3), ['town_name', 'correu_public', 'hero_video_url'], 'la vista conserva les columnes d’abans en el seu ordre i afig la nova al final');
      assert.ok(!columnes.some(c => /contact_email|public_email|visibility/.test(c)));
      await actor(db, ALICE, 'update public.organizations set hero_video_url=null where id=$1', [ORG]);
      assert.equal((await actor(db, ALICE, 'select hero_video_url from public.list_my_organizations($1) where id=$2', [TOWN, ORG])).rows[0].hero_video_url, null, '«Llevar vídeo» es llig tornant a carregar');
    });

    await t.test('perfil_public torna el vídeo només a la fitxa sencera, i continua demanant sessió', async () => {
      await actor(db, ALICE, 'update public.profiles set hero_video_url=$1,is_public=true where id=$2', [VIDEO, ALICE]);
      const sencera = (await actor(db, BOB, 'select id,hero_url,hero_video_url from public.perfil_public($1)', [ALICE])).rows;
      assert.deepEqual(sencera, [{ id: ALICE, hero_url: null, hero_video_url: VIDEO }]);
      await db.query('update public.profiles set is_public=false where id=$1', [ALICE]);
      const minima = (await actor(db, BOB, 'select id,hero_video_url,lema from public.perfil_public($1)', [ALICE])).rows;
      assert.deepEqual(minima.map(r => [r.id, r.hero_video_url, r.lema]), [[ALICE, null, null]], 'la fitxa mínima d’un veí no porta el vídeo');
      assert.deepEqual((await actor(db, EVE, 'select id from public.perfil_public($1)', [ALICE])).rows, [], 'de fora del poble, res');
      assert.equal((await actor(db, ALICE, 'select hero_video_url from public.perfil_public($1)', [ALICE])).rows[0].hero_video_url, VIDEO, 'la mateixa persona sí que el veu');
      await assert.rejects(actor(db, null, 'select * from public.perfil_public($1)', [ALICE]), error('42501'));
    });
  } finally {
    await cluster.close();
  }
});
