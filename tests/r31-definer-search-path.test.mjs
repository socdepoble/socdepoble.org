import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { creaPlaMigracions, generaSql } from '../tooling/node0/hidrata-postgres-node0.mjs';

const modulePath = process.env.SDP_PGLITE_MODULE;
if (!modulePath) throw new Error('Cal SDP_PGLITE_MODULE explícit; no inferir un resultat SQL R31.');
const moduleURL = modulePath.startsWith('file:') ? new URL(modulePath) : pathToFileURL(modulePath);
const { PGlite } = await import(moduleURL.href);
const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
const MIGRACIO = '20261116040000';
const T = '31000000-0000-4000-8000-000000000001';
const A = '31000000-0000-4000-8000-000000000011';
const B = '31000000-0000-4000-8000-000000000012';
const C = '31000000-0000-4000-8000-000000000013';
const M = '31000000-0000-4000-8000-000000000021';
const noBuit = `not coalesce(p.proconfig @> array['search_path=""']::text[],false)
  and not coalesce(p.proconfig @> array['search_path=']::text[],false)`;
const funcions = `select p.oid::text,n.nspname as schema,p.proname,p.proowner::text,p.proacl::text,
  p.prolang,p.prorettype,p.proretset,p.provolatile,p.proparallel,p.proleakproof,p.proisstrict,p.prosecdef,
  p.proargtypes::text,p.proallargtypes::text,p.proargmodes::text,p.proargnames,p.proargdefaults::text,
  p.prosrc,p.proconfig from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
  where p.prosecdef and n.nspname in ('public','private') order by p.oid`;
const autoritat = `select n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,
  coalesce((select jsonb_agg(jsonb_build_object('name',p.polname,'cmd',p.polcmd,'roles',p.polroles::text,
    'qual',pg_catalog.pg_get_expr(p.polqual,p.polrelid),'check',pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid))
    order by p.polname) from pg_catalog.pg_policy p where p.polrelid=c.oid),'[]'::jsonb) as policies
  from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private') and c.relkind in ('r','p') order by n.nspname,c.relname`;
const senseCos = r => { const copia = { ...r }; delete copia.prosrc; delete copia.proconfig; return copia; };

async function com(pg, usuari, sql, params = [], role = usuari ? 'authenticated' : 'anon') {
  await pg.exec('begin');
  try {
    await pg.exec(`set local role ${role}`);
    await pg.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true),set_config('request.headers',$4,true)",
      [usuari || '',role,JSON.stringify({ sub:usuari,role,aal:'aal1' }),JSON.stringify({ origin:'https://socdepoble.org' })]);
    const r = await pg.query(sql,params); await pg.exec('commit'); return r;
  } catch (error) { await pg.exec('rollback'); throw error; }
}

test('R31 ADD118 · catàleg vigent, descriptors, ombres temporals i contractes reals', { timeout:120000 }, async t => {
  const first = new PGlite();
  await first.exec('create database socdepoble_node0');
  const image = await first.dumpDataDir('none'); await first.close();
  const pg = new PGlite({ database:'socdepoble_node0',loadDataDir:image,extensions:{ pgcrypto } });
  t.after(() => pg.close());
  const plan = creaPlaMigracions();
  const migration = plan.migrations.find(m => m.version === MIGRACIO);
  assert.ok(migration,'ADD118 ha d’estar al catàleg');
  const base = { ...plan,migrations:plan.migrations.slice(0,plan.migrations.indexOf(migration)) };
  await pg.exec(generaSql(base,null,{ advisoryLock:false }));
  const abans = (await pg.query(funcions)).rows;
  const rlsAbans = (await pg.query(autoritat)).rows;
  const check = async () => (await pg.query('select public.xat_verifica_prerequisits_e2ee() as c')).rows[0].c;
  const prerequisitsAbans = await check();

  await t.test('contraexemple mesurat: 29 definers vigents tenien path explícit no buit', async () => {
    const result = await pg.query(`select count(*)::int as n from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
      where p.prosecdef and n.nspname in ('public','private') and ${noBuit}`);
    assert.equal(result.rows[0].n,29);
    assert.ok(prerequisitsAbans.faltants.includes('definer_path:public.xat_fils_meus(uuid)'), 'la redefinició segura posterior ja divergix del checker històric');
  });

  await pg.exec(migration.sql);
  const despres = (await pg.query(funcions)).rows;
  await t.test('path buit efectiu, mateix OID/owner/ACL/signatures i RLS intacta', async () => {
    assert.deepEqual(despres.map(senseCos),abans.map(senseCos));
    assert.deepEqual((await pg.query(autoritat)).rows,rlsAbans);
    for (let i=0;i<abans.length;i++) {
      const modificada = ['mur_anti_resurreccio','xat_verifica_prerequisits_e2ee'].includes(abans[i].proname);
      if (modificada) assert.notEqual(despres[i].prosrc,abans[i].prosrc);
      else assert.equal(despres[i].prosrc,abans[i].prosrc);
      const settings = despres[i].proconfig || [];
      assert.ok(settings.includes('search_path=""') || settings.includes('search_path='));
      assert.deepEqual(settings.filter(s=>!s.startsWith('search_path=')),(abans[i].proconfig||[]).filter(s=>!s.startsWith('search_path=')));
    }
  });

  await t.test('reaplicar és idempotent i el verificador conserva la resta de checks', async () => {
    await pg.exec(migration.sql);
    assert.deepEqual((await pg.query(funcions)).rows,despres);
    const actual = await check();
    assert.deepEqual(actual.faltants,prerequisitsAbans.faltants.filter(f=>!f.startsWith('definer_path:')));
    assert.equal(actual.contracte,prerequisitsAbans.contracte);
    assert.equal(actual.flag_client_modificat,false);
    assert.equal(actual.entitats_habilitades,false);
    assert.equal(actual.requereix_ordre_del_mestre,true);
  });

  await t.test('pg_temp no suplanta catàlegs ni taules de negoci; ACL privada continua tancada', async () => {
    const real = await check();
    for (const nom of ['pg_class','pg_proc','pg_trigger','pg_attribute','pg_policies','pg_roles']) {
      await pg.exec(`create temp table ${nom} as select * from pg_catalog.${nom} with no data`);
    }
    for (const nom of ['xat_fils','xat_participants','xat_missatges','xat_epoques']) {
      await pg.exec(`create temp table ${nom} as select * from public.${nom} with no data`);
    }
    assert.deepEqual(await check(),real);
    await assert.rejects(com(pg,A,'select private.xat_e2ee_abast($1)',[M]),e=>e.code==='42501');
  });

  let fil;
  await t.test('Auth sintètic, historial/nous i E2EE conserven membres, orígens i denegacions', async () => {
    await pg.query("insert into public.towns(id,slug,name) values($1,'r31-definer','Poble sintètic')",[T]);
    for (const [usuari,nom] of [[A,'Alícia'],[B,'Bernat'],[C,'Carles']]) {
      await pg.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [usuari,`${usuari}@example.invalid`,JSON.stringify({ full_name:nom,tenant_id:T,accepta_rgpd:true,rgpd:true })]);
      await com(pg,usuari,"select public.accepta_normes_convivencia('2026-10-24')");
    }
    fil = (await com(pg,A,'select public.crea_fil_directe($1,$2,null) as id',[T,B])).rows[0].id;
    await com(pg,A,"select public.xat_envia($1,$2,'text','Missatge sintètic R31',null,'{}')",[M,fil]);
    assert.equal((await com(pg,B,'select * from public.xat_historial($1,null,50)',[fil])).rows[0].id,M);
    assert.equal((await com(pg,B,'select * from public.xat_nous($1,0,100)',[fil])).rows[0].id,M);
    const estat = await com(pg,B,'select * from public.xat_estat_xifrat($1::uuid[])',[[fil]]);
    assert.equal(estat.rows.length,1); assert.equal(estat.rows[0].abast,true);
    await assert.rejects(com(pg,C,'select * from public.xat_historial($1,null,50)',[fil]),e=>e.code==='42501');
    await assert.rejects(com(pg,C,'select * from public.xat_estat_xifrat($1::uuid[])',[[fil]]),e=>e.code==='42501');
    await assert.rejects(com(pg,null,'select * from public.xat_historial($1,null,50)',[fil]),e=>e.code==='42501');
    assert.deepEqual((await com(pg,C,'select id from public.xat_missatges where id=$1',[M])).rows,[]);
    assert.equal((await pg.query("select private.xat_lot3_b64('AQ',1) as b")).rows[0].b[0],1);
    await assert.rejects(pg.query("select private.xat_lot3_b64('no és base64',1)"),e=>e.code==='22023');
    assert.equal((await pg.query("select private.xat_sobre_format_v1_valid('{}'::jsonb) as valid")).rows[0].valid,false);
  });

  await t.test('deriva desconeguda avorta abans del DDL i conserva els descriptors presents', async () => {
    await pg.exec(`create or replace function private.xat_e2ee_abast(p_fil uuid) returns boolean
      language sql stable security definer set search_path='' as $$select false$$;`);
    const deriva = (await pg.query(funcions)).rows;
    await assert.rejects(pg.exec(migration.sql),/SDP-R31-DEFINER-DRIFT/);
    await pg.exec('rollback');
    assert.deepEqual((await pg.query(funcions)).rows,deriva);
  });
});
