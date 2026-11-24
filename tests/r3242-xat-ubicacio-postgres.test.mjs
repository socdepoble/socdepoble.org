import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cosMigracio, creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';

import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { projecta132PerFixture } from './fixtures/r3278-cataleg-parcial.mjs';

const FILE = '20261122160200_r32_42_xat_ubicacio_dos_decimals.sql';
const id = n => `32420000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), A = id(11), FIL = id(100), MSG = id(201);
async function actor(db, sql, params = [], role = 'authenticated', who = A) {
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)",
      [who, JSON.stringify({ sub: who, role: 'authenticated', aal: 'aal1' })]);
    const result = await db.query(sql, params); await db.query('commit'); return result;
  } catch (e) { await db.query('rollback'); throw e; }
}

test('R32.42 DOL-55: migració repetida, passat i RPC de client antic arrodonits', { timeout: 240000 }, async t => {
  const { startLocalPostgres } = await import(process.env.SDP_R3242_ENGINE === 'pglite'
    ? './fixtures/r32_25-pglite-pg.mjs' : './fixtures/r3242-privacitat-postgres-local.mjs');
  const cluster = await startLocalPostgres({ dataRoot: join(tmpdir(), 'sdp-r3242-native') }), db = cluster.db;
  try {
    const plan = creaPlaMigracions(); await db.query(plan.bootstrap);
    for (const m of plan.migrations.filter(m => !m.file.includes('r32_42') && !m.file.includes('r3242'))) {
      let body = m.body;
      if (m.file === '20261123180000_r3252_indexs_suport_fk_verificats.sql') {
        const partial = await projecta132PerFixture(db, { absentRelations: ['private.ajuntament_auditoria', 'private.ajuntament_dominis_oficials'] });
        assert.deepEqual(partial.report.omittedRelations, ['private.ajuntament_auditoria', 'private.ajuntament_dominis_oficials']);
        assert.equal(partial.report.deploymentOrLedger, false);
        t.diagnostic(JSON.stringify(partial.report));
        body = cosMigracio(partial.sql);
      }
      try { await db.query('begin'); await db.query(body); await db.query('commit'); }
      catch (e) { await db.query('rollback'); throw new Error(`${m.file}: ${e.message}`, { cause: e }); }
    }
    await db.query("insert into public.towns(id,slug,name) values($1,'r3242-synthetic','Poble sintètic R32.42')", [TOWN]);
    await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
      [A, `${A}@example.invalid`, { full_name: 'Veí sintètic', tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
    await actor(db, "select public.accepta_normes_convivencia('2026-10-24')");
    await db.query("insert into public.xat_fils(id,tenant_id,tipus,titol,creat_per) values($1,$2,'grup','R32.42 sintètic',$3)", [FIL,TOWN,A]);
    await db.query('insert into public.xat_participants(fil_id,usuari_id) values($1,$2)', [FIL,A]);
    const publica = async (msg, ubicacio) => {
      await actor(db, 'select public.xat_reserva_adjunt($1,$2,64,\'video/mp4\',1000)', [msg,FIL]);
      await db.query("insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata) values('xat_adjunts',$1,$2::uuid,($2::uuid)::text,$3,$4)",
        [msg,A,`fixture-${msg}`,{ size:64,mimetype:'video/mp4' }]);
      return (await actor(db,'select public.xat_publica_adjunt($1,null,null,$2::jsonb) as ack',[msg,JSON.stringify(ubicacio)])).rows[0].ack;
    };
    const exacte = {lat:38.612345678,lng:-0.428765432};
    assert.deepEqual((await publica(MSG,exacte)).metadades.ubicacio,exacte);
    const migration = fs.readFileSync(new URL('../supabase/migrations/'+FILE,import.meta.url),'utf8');
    await db.query(migration); await db.query(migration);
    await t.test('backfill visible i RPC idempotent retornen només 2 decimals', async () => {
      const saved = (await db.query('select metadades from public.xat_missatges where id=$1',[MSG])).rows[0].metadades;
      assert.deepEqual(saved.ubicacio,{lat:38.61,lng:-0.43});
      const ack = (await actor(db,'select public.xat_publica_adjunt($1,null,null,$2::jsonb) as ack',[MSG,JSON.stringify(exacte)])).rows[0].ack;
      assert.deepEqual(ack.metadades.ubicacio,{lat:38.61,lng:-0.43});
    });
    await t.test('client antic, signes, zero i límits també passen per la guarda', async () => {
      for (const [index,lloc] of [{lat:-38.616,lng:0.005},{lat:90,lng:-180},{lat:0,lng:0}].entries()) {
        const ack = await publica(id(210+index),lloc);
        assert.deepEqual(ack.metadades.ubicacio,{lat:Number(lloc.lat.toFixed(2)),lng:Number(lloc.lng.toFixed(2))});
      }
      await db.query("update public.xat_missatges set metadades=metadades||'{\"ubicacio\":{\"lat\":-0.005,\"lng\":179.9999},\"altre\":\"intacte\"}'::jsonb where id=$1",[MSG]);
      assert.deepEqual((await db.query('select metadades from public.xat_missatges where id=$1',[MSG])).rows[0].metadades.ubicacio,{lat:-0.01,lng:180});
      assert.equal((await db.query('select metadades->>\'altre\' as altre from public.xat_missatges where id=$1',[MSG])).rows[0].altre,'intacte');
    });
    await t.test('tipus o rangs invàlids fallen abans de persistir; null lleva ubicació', async () => {
      for (const lloc of [{lat:91,lng:0},{lat:'38',lng:0},{lat:2,lng:3,exacta:true},[],true]) {
        await assert.rejects(db.query('update public.xat_missatges set metadades=jsonb_set(metadades,array[\'ubicacio\'],$2::jsonb) where id=$1',[MSG,JSON.stringify(lloc)]),/ubicació invàlida/);
      }
      await db.query("update public.xat_missatges set metadades=jsonb_set(metadades,array['ubicacio'],'null'::jsonb) where id=$1",[MSG]);
      assert.equal((await db.query("select metadades ? 'ubicacio' as te from public.xat_missatges where id=$1",[MSG])).rows[0].te,false);
    });
    await t.test('CHECK no permet exactitud encara que el trigger estiga desactivat pel propietari', async () => {
      await db.query('alter table public.xat_missatges disable trigger aa_xat_ubicacio_dos_decimals');
      try {
        await assert.rejects(db.query("update public.xat_missatges set metadades=jsonb_set(metadades,array['ubicacio'],'{\"lat\":38.61234,\"lng\":0}'::jsonb) where id=$1",[MSG]),/xat_ubicacio_dos_decimals/);
      } finally { await db.query('alter table public.xat_missatges enable trigger aa_xat_ubicacio_dos_decimals'); }
    });
    await t.test('RPC pública opt-in transporta el flag sense retirar fitxes ni ampliar dades privades', async () => {
      const murSql=fs.readFileSync(new URL('../supabase/migrations/20261122160300_r32_42_mur_visibilitat_publica.sql',import.meta.url),'utf8');
      const old=(await db.query("select oid,pronargdefaults from pg_proc where oid='public.llig_mur_public(uuid,text,integer,timestamptz,uuid,boolean)'::regprocedure")).rows[0];
      // v1.2.23 · L4-10 (ordre del Mestre 261123) · Una base amb la sobrecàrrega de la v1.2.22 (mateix nom, boolean
      // primer) la perd en aplicar la migració; la RPC6 conserva OID i defaults.
      await db.query(`create function public.llig_mur_public(p_inclou_visibilitat boolean,p_tenant_id uuid default null,p_section_id text default null,
        p_limit integer default 200,p_before_created_at timestamptz default null,p_before_id uuid default null,p_nomes_projeccions boolean default false)
        returns setof jsonb language sql stable as $$ select '{}'::jsonb where false $$`);
      await db.query(murSql);await db.query(murSql);
      assert.equal((await db.query("select to_regprocedure('public.llig_mur_public(boolean,uuid,text,integer,timestamptz,uuid,boolean)') is null as absent")).rows[0].absent,true);
      assert.deepEqual((await db.query("select oid,pronargdefaults from pg_proc where oid='public.llig_mur_public(uuid,text,integer,timestamptz,uuid,boolean)'::regprocedure")).rows[0],old);
      for(const [index,section,flags] of [[0,'mercat',{mostrarAlMur:false}],[1,'mercat',{mostrarAlMur:true}],[2,'events',{ocultarDelMur:true}],[3,'events',{ocultarDelMur:false}],[4,'mur',{}]]) {
        await actor(db,"insert into public.section_submissions(id,tenant_id,section_id,title,description,payload,visibility,moderation_state,owner_user_id) values($1,$2,$3,'Pública','Cos públic',$4::jsonb,'public','visible',$5)",
          [id(300+index),TOWN,section,JSON.stringify({...flags,type:section==='mercat'?'product':section==='events'?'event':'feed',secret_no_exposar:'privat'}),A],'postgres');
      }
      await db.query('set role anon');
      try {
        for(const section of ['mercat','events']) {
          const legacy=(await db.query('select * from public.llig_mur_public(p_tenant_id=>$1,p_section_id=>$2)',[TOWN,section])).rows;
          const rows=(await db.query('select public.llig_mur_public_v7(p_inclou_visibilitat=>true,p_tenant_id=>$1,p_section_id=>$2) as item',[TOWN,section])).rows.map(r=>r.item);
          assert.equal(legacy.length,2);assert.equal(rows.length,2);
          assert.deepEqual(rows.map(r=>r.id),legacy.map(r=>r.id));
          assert.deepEqual(rows.map(r=>r.mostrar_al_mur).sort(),[false,true]);
          assert.ok(rows.every(r=>!Object.hasOwn(r,'payload')&&!Object.hasOwn(r,'owner_user_id')&&!JSON.stringify(r).includes('secret_no_exposar')));
          // La fitxa de cada secció continua accessible; el client sols filtra la projecció del Mur.
        }
      } finally { await db.query('reset role'); }
      const rpc7=(await db.query(`select pronargdefaults,proargnames[1] as discriminador,prosecdef,proconfig,
        has_function_privilege('anon',oid,'execute') as anon,has_function_privilege('authenticated',oid,'execute') as authenticated,
        has_function_privilege('service_role',oid,'execute') as service_role,
        exists(select 1 from aclexplode(proacl) a where a.grantee=0) as public_execute
        from pg_proc where oid='public.llig_mur_public_v7(boolean,uuid,text,integer,timestamptz,uuid,boolean)'::regprocedure`)).rows[0];
      assert.deepEqual(rpc7,{pronargdefaults:6,discriminador:'p_inclou_visibilitat',prosecdef:true,proconfig:['search_path=""'],
        anon:true,authenticated:true,service_role:false,public_execute:false});
      // v1.2.23 · L4-10 · Cap sobrecàrrega: un sol llig_mur_public (la RPC6) i un sol llig_mur_public_v7; la crida
      // posicional amb el primer paràmetre sense tipus ja no és ambigua (42725).
      assert.deepEqual((await db.query(`select p.proname,count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and p.proname in ('llig_mur_public','llig_mur_public_v7') group by p.proname order by p.proname`)).rows,
        [{proname:'llig_mur_public',n:1},{proname:'llig_mur_public_v7',n:1}]);
      await db.query('set role anon');
      try {
        const rpc6Posicional=(await db.query('select count(*)::int n from public.llig_mur_public($1)',[TOWN])).rows[0].n;
        assert.ok(rpc6Posicional>=4,String(rpc6Posicional));
        assert.equal((await db.query('select count(*)::int n from public.llig_mur_public_v7(true,$1)',[TOWN])).rows[0].n,rpc6Posicional);
      } finally { await db.query('reset role'); }
    });
    await t.test('foraster autenticat renegocia públic amb JWT i conserva bloquejos', async () => {
      const town2=id(2), foraster=id(99);
      await db.query("insert into public.towns(id,slug,name) values($1,'r3242-other','Altre poble sintètic')",[town2]);
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [foraster,`${foraster}@example.invalid`,{full_name:'Foraster sintètic',tenant_id:town2,accepta_rgpd:true,rgpd:true}]);
      const llig = async () => (await actor(db,'select public.llig_mur_public_v7(p_inclou_visibilitat=>true,p_tenant_id=>$1,p_section_id=>\'mercat\') as item',[TOWN],'authenticated',foraster)).rows.map(r=>r.item);
      const envelope=(await actor(db,'select public.llig_mur_membres(p_tenant_id=>$1,p_section_id=>\'mercat\') as dto',[TOWN],'authenticated',foraster)).rows[0].dto;
      assert.equal(envelope.lectura,'public');assert.ok(envelope.files.every(r=>!Object.hasOwn(r,'mostrar_al_mur')));
      assert.deepEqual((await llig()).map(r=>r.mostrar_al_mur).sort(),[false,true]);
      // La negociació del client ha de conservar el JWT. Una petició anon perdria este bloqueig.
      await actor(db,"insert into public.bloquejos(bloquejat_tipus,bloquejat_persona) values('persona',$1)",[A],'authenticated',foraster);
      assert.equal((await llig()).length,0);
    });
    t.diagnostic(`Motor ${process.env.SDP_R3242_ENGINE || 'PostgreSQL natiu'}; fixture pre-R32.42 parcial explícita, sense ledger de desplegament, i RPC real; clúster tancat en finally.`);
  } finally { await cluster.close(); }
});
