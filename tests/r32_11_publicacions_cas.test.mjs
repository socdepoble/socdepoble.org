import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { creaPlaMigracions, generaSql, preparaHidratacio } from '../tooling/node0/hidrata-postgres-node0.mjs';
const manual = fs.readFileSync(new URL('../supabase/snippets/r32_11_publicacions_cas.sql', import.meta.url), 'utf8');
test('R32.11 manual general publication CAS on full frozen catalog', { skip: !process.env.SDP_PGLITE_MODULE && 'Explicit disposable PGlite required' }, async t => {
  const url = pathToFileURL(process.env.SDP_PGLITE_MODULE), { PGlite } = await import(url.href), { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', url));
  const initial = new PGlite(); await initial.exec('CREATE DATABASE socdepoble_node0'); const image = await initial.dumpDataDir('none'); await initial.close();
  const pg = new PGlite({ database: 'socdepoble_node0', loadDataDir: image, extensions: { pgcrypto } });
  const tenant = 'ac3bec76-255b-5ca2-8886-28fcceab4267', owner = '11111111-1111-4111-8111-111111111111', foreign = '22222222-2222-4222-8222-222222222222';
  const id = n => `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`;
  const op = n => `44444444-4444-4444-8444-${String(n).padStart(12, '0')}`;
  async function as(actor, sql, params = [], role = 'authenticated') {
    return pg.transaction(async tx => {
      await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)", [actor || '', JSON.stringify({ sub: actor, role, aal: 'aal1' })]);
      await tx.exec(`SET LOCAL ROLE ${role}`); return (await tx.query(sql, params)).rows;
    });
  }
  const query = 'SELECT public.publica_section_submission_cas($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS ack';
  const args = (n, operation, expected = null, payload = { title: 'Local LAB', content: '<p>Fixture</p>' }, extra = {}) => [id(n), extra.tenant ?? tenant, extra.section ?? 'mur', payload, 'Local LAB', '', extra.org ?? null, extra.preserve ?? true, expected, op(operation)];
  const save = (n, operation, expected = null, payload, extra = {}) => as(extra.actor ?? owner, query, args(n, operation, expected, payload, extra), extra.role).then(rows => rows[0].ack);
  const code = value => error => error.code === value;
  try {
    const plan = creaPlaMigracions(); await pg.exec(generaSql(plan, await preparaHidratacio(), { advisoryLock: false }));
    await pg.exec('ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(); ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz');
    for (const actor of [owner, foreign]) {
      await pg.query('INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,now(),$3)', [actor,`${actor}@example.invalid`,{ full_name:'LAB',tenant_id:tenant,accepta_rgpd:true }]);
      await pg.query('INSERT INTO private.normes_acceptades(usuari_id,versio) VALUES($1,private.versio_normes_vigent()) ON CONFLICT DO NOTHING',[actor]);
    }
    await pg.query('DELETE FROM public.town_memberships WHERE user_id=$1',[foreign]);
    await pg.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [tenant, owner]);
    async function rejectedManual() {
      let error; try { await pg.exec(manual); } catch (cause) { error=cause; await pg.exec('ROLLBACK'); }
      assert.ok(error,'manual unexpectedly accepted incompatible schema'); assert.equal(error.code,'22023'); assert.match(error.message,/SDP-PUB-CAS-000/);
    }
    const originalExport=(await pg.query("SELECT pg_get_functiondef('public.exporta_les_meues_dades()'::regprocedure) AS ddl")).rows[0].ddl;
    await t.test('first-install collision rejects without overwriting unknown table or export helper',async()=>{
      await pg.exec('CREATE TABLE private.publicacions_cas_rebuts(operation_id uuid primary key,unknown_column text)');
      await rejectedManual();
      assert.equal((await pg.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='private' AND table_name='publicacions_cas_rebuts'")).rows[0].n,2);
      assert.equal((await pg.query("SELECT to_regprocedure('private.publicacions_cas_token()') AS p")).rows[0].p,null);
      assert.equal((await pg.query("SELECT pg_get_functiondef('public.exporta_les_meues_dades()'::regprocedure) AS ddl")).rows[0].ddl,originalExport);
      await pg.exec('DROP TABLE private.publicacions_cas_rebuts');
      await pg.exec("CREATE FUNCTION private.exporta_les_meues_dades_abans_r3211_cas() RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RETURN '{}'::jsonb; END $$");
      await rejectedManual(); await pg.exec('DROP FUNCTION private.exporta_les_meues_dades_abans_r3211_cas()');
    });
    await t.test('unexpected custom default ACL triggers full rollback on initial installation',async()=>{
      await pg.exec('CREATE ROLE r3211_cas_probe; ALTER DEFAULT PRIVILEGES GRANT SELECT ON TABLES TO r3211_cas_probe');
      await rejectedManual();
      assert.equal((await pg.query("SELECT to_regclass('private.publicacions_cas_rebuts') AS t,to_regprocedure('private.publicacions_cas_token()') AS f,to_regprocedure('private.exporta_les_meues_dades_abans_r3211_cas()') AS e")).rows[0].t,null);
      assert.equal((await pg.query("SELECT pg_get_functiondef('public.exporta_les_meues_dades()'::regprocedure) AS ddl")).rows[0].ddl,originalExport);
      await pg.exec('ALTER DEFAULT PRIVILEGES REVOKE SELECT ON TABLES FROM r3211_cas_probe');
    });
    await t.test('missing authenticated export grant rejects before first install, without restoring it',async()=>{
      await pg.exec('REVOKE EXECUTE ON FUNCTION public.exporta_les_meues_dades() FROM authenticated');await rejectedManual();
      assert.equal((await pg.query("SELECT has_function_privilege('authenticated','public.exporta_les_meues_dades()','EXECUTE') AS granted")).rows[0].granted,false);
      assert.equal((await pg.query("SELECT to_regclass('private.publicacions_cas_rebuts') AS t")).rows[0].t,null);
      await pg.exec('GRANT EXECUTE ON FUNCTION public.exporta_les_meues_dades() TO authenticated');
    });
    async function assertTemporaryTypeRejected(name) {
      await pg.exec(`CREATE DOMAIN pg_temp.${name} AS pg_catalog.${name}`);
      const before=(await pg.query("SELECT pg_catalog.current_setting('search_path') AS path")).rows[0].path;
      const canonical='public.publica_section_submission_cas(pg_catalog.uuid,pg_catalog.uuid,pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.text,pg_catalog.uuid,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.uuid)';
      const ddl=(await pg.query('SELECT pg_catalog.pg_get_functiondef(pg_catalog.to_regprocedure($1)) AS ddl',[canonical])).rows[0].ddl;
      try {
        await rejectedManual();
        assert.equal((await pg.query("SELECT pg_catalog.current_setting('search_path') AS path")).rows[0].path,before);
        assert.equal((await pg.query('SELECT pg_catalog.pg_get_functiondef(pg_catalog.to_regprocedure($1)) AS ddl',[canonical])).rows[0].ddl,ddl);
        assert.equal((await pg.query("SELECT pg_catalog.count(*)::pg_catalog.int4 AS n FROM pg_catalog.pg_proc WHERE pronamespace='public'::pg_catalog.regnamespace AND proname='publica_section_submission_cas'")).rows[0].n,ddl ? 1 : 0);
      } finally { await pg.exec(`DROP DOMAIN pg_temp.${name}`); }
    }
    await t.test('temporary type domains reject initial DDL without creating an RPC overload',async()=>{
      for(const name of ['uuid','text','jsonb','bytea','timestamptz','bool','trigger']) {
        // trigger is a pseudo-type and cannot be the base type of a domain.
        if(name==='trigger') continue;
        await assertTemporaryTypeRejected(name);
        assert.equal((await pg.query("SELECT pg_catalog.to_regclass('private.publicacions_cas_rebuts') AS t")).rows[0].t,null);
      }
    });
    await pg.exec(manual);
    await t.test('temporary type domains reject reapplication without changing the canonical RPC',async()=>{
      for(const name of ['uuid','text','jsonb','bytea','timestamptz','bool']) await assertTemporaryTypeRejected(name);
    });
    await t.test('replay guards deny column/custom ACL, policies, altered DDL, functions and trigger order',async()=>{
      const base=(await pg.query("SELECT pg_get_functiondef('private.exporta_les_meues_dades_abans_r3211_cas()'::regprocedure) AS ddl")).rows[0].ddl;
      const cases=[
       ['GRANT SELECT(operation_id) ON private.publicacions_cas_rebuts TO r3211_cas_probe','REVOKE SELECT(operation_id) ON private.publicacions_cas_rebuts FROM r3211_cas_probe'],
       ['GRANT SELECT ON private.publicacions_cas_rebuts TO r3211_cas_probe','REVOKE SELECT ON private.publicacions_cas_rebuts FROM r3211_cas_probe'],
       ['CREATE POLICY unexpected ON private.publicacions_cas_rebuts USING(true)','DROP POLICY unexpected ON private.publicacions_cas_rebuts'],
       ['ALTER TABLE private.publicacions_cas_rebuts DISABLE ROW LEVEL SECURITY','ALTER TABLE private.publicacions_cas_rebuts ENABLE ROW LEVEL SECURITY'],
       ['ALTER TABLE private.publicacions_cas_rebuts ALTER created_at DROP DEFAULT','ALTER TABLE private.publicacions_cas_rebuts ALTER created_at SET DEFAULT clock_timestamp()'],
       ['ALTER TABLE private.publicacions_cas_rebuts ALTER created_at DROP NOT NULL','ALTER TABLE private.publicacions_cas_rebuts ALTER created_at SET NOT NULL'],
       ["CREATE OR REPLACE FUNCTION private.exporta_les_meues_dades_abans_r3211_cas() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN RETURN '{}'::jsonb; END $$",base],
       ['GRANT EXECUTE ON FUNCTION private.exporta_les_meues_dades_abans_r3211_cas() TO r3211_cas_probe','REVOKE EXECUTE ON FUNCTION private.exporta_les_meues_dades_abans_r3211_cas() FROM r3211_cas_probe'],
       ['CREATE TRIGGER zzzz_r3211_probe BEFORE UPDATE ON public.section_submissions FOR EACH ROW EXECUTE FUNCTION private.publicacions_cas_token()','DROP TRIGGER zzzz_r3211_probe ON public.section_submissions'],
       ['ALTER TABLE public.section_submissions DISABLE TRIGGER zzz_r3211_publicacions_cas_token','ALTER TABLE public.section_submissions ENABLE TRIGGER zzz_r3211_publicacions_cas_token']
      ];
      for(const [mutate,restore] of cases){await pg.exec(mutate);try{await rejectedManual();}finally{await pg.exec(restore);}}
      await pg.exec(manual);
      assert.equal((await pg.query("SELECT pg_get_functiondef('private.exporta_les_meues_dades_abans_r3211_cas()'::regprocedure) AS ddl")).rows[0].ddl,base);
    });
    await t.test('manual preserves caller search_path and rejects an operator-shadowing namespace order',async()=>{
      const before=(await pg.query("SELECT pg_catalog.current_setting('search_path') AS path")).rows[0].path;
      const source=(await pg.query("SELECT pg_catalog.pg_get_functiondef('public.publica_section_submission_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamptz,uuid)'::pg_catalog.regprocedure) AS ddl")).rows[0].ddl;
      await pg.exec('CREATE SCHEMA r3211_caller');
      try {
        for(const caller of ['pg_catalog','r3211_caller, public']){
          await pg.query("SELECT pg_catalog.set_config('search_path',$1,false)",[caller]);
          await pg.exec(manual);
          assert.equal((await pg.query("SELECT pg_catalog.current_setting('search_path') AS path")).rows[0].path,caller);
          assert.equal((await pg.query("SELECT pg_catalog.pg_get_functiondef('public.publica_section_submission_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamptz,uuid)'::pg_catalog.regprocedure) AS ddl")).rows[0].ddl,source);
        }
        const bad='r3211_caller, pg_catalog, public'; await pg.query("SELECT pg_catalog.set_config('search_path',$1,false)",[bad]);
        await rejectedManual();
        assert.equal((await pg.query("SELECT pg_catalog.current_setting('search_path') AS path")).rows[0].path,bad);
      } finally { await pg.query("SELECT pg_catalog.set_config('search_path',$1,false)",[before]); await pg.exec('DROP SCHEMA r3211_caller'); }
    });
    let first, second;
    await t.test('create-only, immutable authority and closed exact-microsecond receipt', async () => {
      first = await save(1, 1, null, { title: 'Local LAB', content: 'Fixture', ownerUserId: foreign, author_org_id: foreign, isSystem: true, mainHref: 'https://example.invalid/',origen:{titol:'official'},seller:'Mayor',metadadesMedia:{copyright:'CC BY author consent'} });
      assert.deepEqual(Object.keys(first).sort(), ['id','tenant_id','owner_user_id','section_id','operation_id','updated_at','created_at','author_org_id','replay'].sort());
      assert.equal(first.owner_user_id, owner); assert.equal(first.replay, false); assert.match(first.updated_at, /\.\d{6}Z$/);
      const row = (await pg.query('SELECT * FROM public.section_submissions WHERE id=$1', [id(1)])).rows[0];
      assert.equal(row.owner_user_id, owner); assert.equal(row.author_org_id, null);
      for (const key of ['isSystem','mainHref','ownerUserId','author_org_id','origen','seller']) assert.equal(Object.hasOwn(row.payload,key), false);
      assert.deepEqual(row.payload.metadadesMedia,{copyright:'CC BY author consent'});
      await assert.rejects(save(1, 2), code('40001'));
    });
    await t.test('lost ACK replay, changed-body op reuse and old replay after edit', async () => {
      const payload = { title: 'Local LAB', content: 'stable' }; const a = await save(2, 20, null, payload);
      assert.deepEqual(await save(2, 20, null, payload), { ...a, replay: true });
      await assert.rejects(save(2, 20, null, { ...payload, content: 'changed' }), code('22023'));
      const b = await save(2, 21, a.updated_at); assert.notEqual(b.updated_at, a.updated_at);
      await assert.rejects(save(2, 20, null, payload), code('40001'));
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM private.publicacions_cas_rebuts WHERE submission_id=$1', [id(2)])).rows[0].n, 2);
    });
    await t.test('two contenders for create and same version yield exactly one successful commit', async () => {
      // PGlite serializes connections; each contender uses a complete independent
      // transaction. This tests CAS interleaving, not PostgreSQL process scheduling.
      const creates = await Promise.allSettled([save(3,30),save(3,31)]);
      assert.equal(creates.filter(x=>x.status==='fulfilled').length,1);
      const a = creates.find(x=>x.status==='fulfilled').value;
      const updates = await Promise.allSettled([save(3,32,a.updated_at),save(3,33,a.updated_at)]);
      assert.equal(updates.filter(x=>x.status==='fulfilled').length,1);
      assert.ok(updates.filter(x=>x.status==='rejected').every(x=>x.reason.code==='40001'));
    });
    await t.test('same transaction advances distinct tokens and preserves creation date', async () => {
      // Execute as authenticated in one transaction without the as() wrapper.
      await pg.exec('BEGIN'); await pg.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[owner]); await pg.exec('SET LOCAL ROLE authenticated');
      const a = (await pg.query(query,args(4,40))).rows[0].ack;
      const b = (await pg.query(query,args(4,41,a.updated_at))).rows[0].ack;
      const c = (await pg.query(query,args(4,42,b.updated_at))).rows[0].ack;
      await pg.exec('COMMIT'); assert.ok(a.updated_at<b.updated_at && b.updated_at<c.updated_at); assert.equal(a.created_at,c.created_at);
      second = c;
    });
    await t.test('microsecond token precision, tenant binding and organization preservation/explicit person', async () => {
      const a = await save(8,80);
      const wrongMicro = a.updated_at.replace(/(\d{6})Z$/, (_whole,micro)=>`${String((Number(micro)+1)%1000000).padStart(6,'0')}Z`);
      await assert.rejects(save(8,81,wrongMicro),code('40001'));
      const org=id(90); await pg.query("INSERT INTO public.organizations(id,tenant_id,slug,name,kind,created_by) VALUES($1,$2,'cas-lab','CAS LAB','entity',$3)",[org,tenant,owner]);
      await pg.query("INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,'owner') ON CONFLICT(organization_id,user_id) DO UPDATE SET role='owner'",[org,tenant,owner]);
      const signed = await save(9,90,null,undefined,{org,preserve:false}); assert.equal(signed.author_org_id,org);
      const kept = await save(9,91,signed.updated_at); assert.equal(kept.author_org_id,org);
      const person = await save(9,92,kept.updated_at,undefined,{preserve:false}); assert.equal(person.author_org_id,null);
      const otherTenant=id(91); await pg.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'cas-other','CAS Other')",[otherTenant]);
      await pg.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2)',[otherTenant,owner]);
      await assert.rejects(save(8,82,a.updated_at,undefined,{tenant:otherTenant}),code('42501'));
      await assert.rejects(save(10,100,null,{content:'x'.repeat(700001)}),code('22023'));
    });
    await t.test('existing or incoming CC-BY top-level license blocks CAS without losing the published row',async()=>{
      for(const section of ['mur','mercat','events','multimedia','notes']) await assert.rejects(save(12,120,null,{title:'LAB image',copyright:'CC BY 4.0 LAB'}, {section}),e=>e.code==='22023'&&/SDP-PUB-CAS-006/.test(e.message));
      const created=await save(12,121,null,{title:'LAB image',src:'/assets/lab-fixture.jpg'},{section:'multimedia'});
      // Historical opt-out row fixture only; clients retain the canonical DML ACL denial.
      await pg.exec('ALTER TABLE public.section_submissions DISABLE TRIGGER USER');
      const rows=(await pg.query(`UPDATE public.section_submissions SET payload=payload||'{}'::jsonb||jsonb_build_object('copyright','CC BY 4.0 LAB') WHERE id=$1 RETURNING to_char(updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS token`,[id(12)])).rows;
      await pg.exec('ALTER TABLE public.section_submissions ENABLE TRIGGER USER');
      const before=(await pg.query('SELECT to_jsonb(s) AS row FROM public.section_submissions s WHERE id=$1',[id(12)])).rows[0].row;
      await assert.rejects(save(12,122,rows[0].token,{title:'Should not replace rights'},{section:'multimedia'}),e=>e.code==='22023'&&/SDP-PUB-CAS-006/.test(e.message));
      assert.deepEqual((await pg.query('SELECT to_jsonb(s) AS row FROM public.section_submissions s WHERE id=$1',[id(12)])).rows[0].row,before);assert.ok(created);
    });
    await t.test('year9999 exact token advances one microsecond; incoherent legacy dates reject before mutation',async()=>{
      await save(13,130); await save(14,140);
      await pg.exec('ALTER TABLE public.section_submissions DISABLE TRIGGER USER');
      await pg.query("UPDATE public.section_submissions SET updated_at='9999-12-30T01:02:03.123456Z' WHERE id=$1",[id(13)]);
      await pg.query("UPDATE public.section_submissions SET created_at='2099-01-01T00:00:00Z',updated_at='2026-01-01T00:00:00.123456Z' WHERE id=$1",[id(14)]);
      await pg.exec('ALTER TABLE public.section_submissions ENABLE TRIGGER USER');
      assert.equal((await save(13,131,'9999-12-30T01:02:03.123456Z')).updated_at,'9999-12-30T01:02:03.123457Z');
      const before=(await pg.query('SELECT to_jsonb(s) AS row FROM public.section_submissions s WHERE id=$1',[id(14)])).rows[0].row;
      await assert.rejects(save(14,141,'2026-01-01T00:00:00.123456Z'),e=>e.code==='22023'&&/SDP-PUB-CAS-001/.test(e.message));
      assert.deepEqual((await pg.query('SELECT to_jsonb(s) AS row FROM public.section_submissions s WHERE id=$1',[id(14)])).rows[0].row,before);
    });
    await t.test('anonymous, nonmember, foreign owner, section, actor, token and public-private veto denials', async () => {
      await assert.rejects(save(5,50,null,undefined,{actor:foreign}),code('42501'));
      await assert.rejects(save(5,51,null,undefined,{actor:null,role:'anon'}),code('42501'));
      await pg.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2)',[tenant,foreign]);
      await assert.rejects(save(1,52,first.updated_at,undefined,{actor:foreign}),code('42501'));
      await assert.rejects(save(1,53,first.updated_at,undefined,{section:'events'}),code('42501'));
      await assert.rejects(save(5,54,null,undefined,{org:foreign,preserve:false}),code('42501'));
      await assert.rejects(save(5,55,'2026-11-18T01:02:03.123456Z'),code('40001'));
      for (const payload of [{content:'private',visibility:'private'},{content:'private',payload:{status:'draft'}},{type:'sistema'}]) await assert.rejects(save(5,56,null,payload),code('42501'));
      await assert.rejects(save(5,57,null,[]),code('22023'));
    });
    await t.test('linked-note and withdrawn identity cannot enter general CAS', async () => {
      await pg.query('INSERT INTO private.mur_publicacions_revocades(submission_id,tenant_id,owner_user_id) VALUES($1,$2,$3)',[id(6),tenant,owner]);
      await assert.rejects(save(6,60),code('42501'));
      await pg.query('INSERT INTO private.mur_actes_notes(act_id,note_id,tenant_id,owner_user_id,created_note_revision) VALUES($1,null,$2,$3,1)',[id(7),tenant,owner]);
      await assert.rejects(save(7,70),code('42501'));
    });
    await t.test('minimal receipts deny raw access; export remains own-only and replay is idempotent', async () => {
      for (const role of ['anon','authenticated']) await assert.rejects(as(owner,'SELECT * FROM private.publicacions_cas_rebuts',[],role),code('42501'));
      const before = (await pg.query('SELECT * FROM private.publicacions_cas_rebuts ORDER BY operation_id')).rows;
      const base = (await as(owner,'SELECT public.exporta_les_meues_dades() AS result'))[0].result;
      assert.ok(base.seed_revisions); assert.ok(base.veu_del_poble); assert.equal(base.publicacions_cas_rebuts.length,before.length);
      assert.ok(base.publicacions_cas_rebuts.every(r=>!('request_sha256' in r)));
      assert.deepEqual((await as(foreign,'SELECT public.exporta_les_meues_dades() AS result'))[0].result.publicacions_cas_rebuts,[]);
      await pg.exec(manual); assert.deepEqual((await pg.query('SELECT * FROM private.publicacions_cas_rebuts ORDER BY operation_id')).rows,before);
      const after = (await as(owner,'SELECT public.exporta_les_meues_dades() AS result'))[0].result;
      delete after.generat_al; delete base.generat_al; assert.deepEqual(after,base);
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.schema_migrations')).rows[0].n,plan.migrations.length);
    });
    await t.test('submission deletion cascades receipts and auth-account deletion removes its receipts', async () => {
      await pg.query('DELETE FROM public.section_submissions WHERE id=$1',[id(4)]);
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM private.publicacions_cas_rebuts WHERE submission_id=$1',[id(4)])).rows[0].n,0);
      await pg.query('DELETE FROM auth.users WHERE id=$1',[owner]);
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM private.publicacions_cas_rebuts WHERE owner_user_id=$1',[owner])).rows[0].n,0);
      assert.ok(second);
    });
  } finally { await pg.close(); }
});
