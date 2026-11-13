import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const MIGRATION = 'supabase/migrations/2611121830_frontera_contingut_editorial_i_notes_privades.sql';
const TOWN='26000000-0000-4000-8000-000000000001';
const OWNER='26000000-0000-4000-8000-000000000002';
const OTHER='26000000-0000-4000-8000-000000000003';
const ADMIN='26000000-0000-4000-8000-000000000004';
const NOTE='26000000-0000-4000-8000-000000000005';
const PUBLIC_KEYS=['towns','pages','feedPosts','marketItems','events','mediaItems','onboarding','taxonomia','estil'].sort();
const PRIVATE_KEYS=['agents','notes','noteFolders','unclassified-key'].sort();
async function asActor(db,role,who,fn,aal='aal1') {
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",[who||'',role,JSON.stringify({sub:who,role,aal})]);
    const value=await fn(db);await db.query('commit');return value;
  } catch(error) {await db.query('rollback');throw error;}
}
const keys=async(db,role,who,aal)=> (await asActor(db,role,who,c=>c.query('select key from public.app_content order by key'),aal)).rows.map(r=>r.key);

test('R21.6 · public catalogue and private notes boundary on real PostgreSQL18.6', {timeout:90000},async t=>{
  const cluster=await startLocalPostgres(),db=cluster.db;
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as v")).rows[0].v,'180006');
    for(const file of ['tests/fixtures/missatgeria-r21-2/bootstrap-platform.sql','supabase/migrations/2609080000_initial_schema.sql','supabase/migrations/2609080100_xat_v2.sql','supabase/migrations/2609080200_xat_v2_correccions.sql','supabase/migrations/2609080300_xat_v2_membres.sql','supabase/migrations/2609110600_perfil_avatar_i_permisos.sql','supabase/migrations/2609121500_correccio_privacitat_perfils.sql','supabase/migrations/2609140000_schema_notes.sql','supabase/migrations/2609140100_auditoria_rls_fixes.sql','supabase/migrations/2609160600_politiques_superadmin_organitzacions.sql','supabase/migrations/2610061448_superadmin_aal2.sql']) await db.query(read(file));
    // Platform primitive only: Supabase's auth.jwt exposes real request claims.
    await db.query("create or replace function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$");
    await db.query("insert into public.towns(id,slug,name) values($1,'r21-6-boundary','Poble sintètic')",[TOWN]);
    await db.query("insert into private.ajustos(clau,valor) values('poble_per_defecte',$1) on conflict(clau) do update set valor=excluded.valor",[TOWN]);
    for(const who of [OWNER,OTHER,ADMIN]) await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[who,`${who}@example.invalid`,{full_name:'Persona sintètica',tenant_id:TOWN,accepta_rgpd:true}]);
    await db.query("insert into public.user_platform_roles(user_id,role) values($1,'superadmin')",[ADMIN]);
    for(const key of [...PUBLIC_KEYS,...PRIVATE_KEYS]) await db.query('insert into public.app_content(tenant_id,key,payload,version) values($1,$2,$3,7)',[TOWN,key,JSON.stringify([{id:'synthetic-only',title:'No real remote content'}])]);
    await db.query("insert into public.notes(id,tenant_id,owner_user_id,title,content) values($1,$2,$3,'Nota sintètica','Contingut només del laboratori')",[NOTE,TOWN,OWNER]);
    const sql=read(MIGRATION);t.diagnostic(`${MIGRATION} sha256=${createHash('sha256').update(sql).digest('hex')}`);
    const before=(await db.query('select tenant_id,key,payload::text,version,updated_at::text from public.app_content order by key')).rows;
    await t.test('The historical broad policy really exposes personal catalogue keys before repair',async()=>{
      const prior=await keys(db,'anon');assert.ok(prior.includes('notes'));assert.ok(prior.includes('noteFolders'));assert.ok(!prior.includes('agents'));
      assert.equal((await db.query("select has_table_privilege('anon','public.notes','select') as v")).rows[0].v,true);
    });
    await t.test('A partial seven-key deployment is aligned to the existing nine-key public contract',async()=>{
      await db.query(`drop policy "app_content lectura publica" on public.app_content;
        create policy "app_content lectura publica" on public.app_content for select to anon,authenticated using(key in('towns','pages','feedPosts','marketItems','events','mediaItems','onboarding'));
        create policy "sdp app_content anon frontera" on public.app_content as restrictive for select to anon using(key in('towns','pages','feedPosts','marketItems','events','mediaItems','onboarding'));
        create policy "sdp app_content auth frontera" on public.app_content as restrictive for select to authenticated using(key in('towns','pages','feedPosts','marketItems','events','mediaItems','onboarding') or (select private.es_superadmin()));`);
      assert.deepEqual(await keys(db,'anon'),PUBLIC_KEYS.filter(k=>!['taxonomia','estil'].includes(k)));
      await db.query(sql);
      assert.deepEqual(await keys(db,'anon'),PUBLIC_KEYS);
      assert.deepEqual(await keys(db,'authenticated',ADMIN,'aal1'),PUBLIC_KEYS);
      assert.deepEqual(await keys(db,'authenticated',ADMIN,'aal2'),[...PUBLIC_KEYS,...PRIVATE_KEYS].sort());
    });
    await t.test('Public and ordinary authenticated reads use exactly the explicit editorial key set',async()=>{
      await db.query(sql);assert.deepEqual(await keys(db,'anon'),PUBLIC_KEYS);assert.deepEqual(await keys(db,'authenticated',OWNER),PUBLIC_KEYS);
      assert.equal((await db.query("select has_table_privilege('anon','public.notes','select') as v")).rows[0].v,false);
      await assert.rejects(asActor(db,'anon',null,c=>c.query('select * from public.notes limit 0')),e=>e.code==='42501');
    });
    await t.test('Superadmin AAL1 remains bounded; actual AAL2 retains all administrative catalogue rows',async()=>{
      assert.deepEqual(await keys(db,'authenticated',ADMIN,'aal1'),PUBLIC_KEYS);
      assert.deepEqual(await keys(db,'authenticated',ADMIN,'aal2'),[...PUBLIC_KEYS,...PRIVATE_KEYS].sort());
    });
    await t.test('Existing owner access and note CRUD remain; another account never reads the note',async()=>{
      const mine=await asActor(db,'authenticated',OWNER,c=>c.query('select id from public.notes'));assert.deepEqual(mine.rows,[{id:NOTE}]);
      assert.deepEqual((await asActor(db,'authenticated',OTHER,c=>c.query('select id from public.notes'))).rows,[]);
      await asActor(db,'authenticated',OWNER,c=>c.query("update public.notes set title='Editada sintètica' where id=$1",[NOTE]));
      assert.equal((await db.query('select title from public.notes where id=$1',[NOTE])).rows[0].title,'Editada sintètica');
    });
    await t.test('Stale permissive policies and inherited grants cannot reopen either boundary',async()=>{
      await db.query('create policy r21_6_fixture_stale_content on public.app_content for select using(true)');
      await db.query('create policy r21_6_fixture_stale_notes on public.notes for select using(true)');
      await db.query('grant select on public.notes to public,anon');
      assert.deepEqual(await keys(db,'anon'),PUBLIC_KEYS);assert.deepEqual(await keys(db,'authenticated',OTHER),PUBLIC_KEYS);
      assert.deepEqual((await asActor(db,'anon',null,c=>c.query('select id from public.notes'))).rows,[]);
      assert.deepEqual((await asActor(db,'authenticated',OTHER,c=>c.query('select id from public.notes'))).rows,[]);
      assert.deepEqual((await asActor(db,'authenticated',OWNER,c=>c.query('select id from public.notes'))).rows,[{id:NOTE}]);
    });
    await t.test('Membership revocation closes owner reads and migration replay preserves all payloads/versions',async()=>{
      await db.query('delete from public.town_memberships where town_id=$1 and user_id=$2',[TOWN,OWNER]);
      assert.deepEqual((await asActor(db,'authenticated',OWNER,c=>c.query('select id from public.notes'))).rows,[]);
      await db.query(sql);await db.query(sql);
      assert.deepEqual((await db.query('select tenant_id,key,payload::text,version,updated_at::text from public.app_content order by key')).rows,before);
      assert.equal((await db.query("select has_table_privilege('anon','public.notes','select') as v")).rows[0].v,false);
      const policies=(await db.query("select policyname from pg_policies where policyname like 'r21_6 %' order by policyname")).rows;
      assert.equal(policies.length,4);
    });
    await t.test('Exact operator metadata script is read-only, preserves every row and labels unavailable history',async()=>{
      const operatorSql=read('tooling/auditoria/audita-servidor-lectura.sql');
      const snapshot=async()=>({content:(await db.query('select tenant_id,key,payload::text,version,updated_at::text from public.app_content order by key')).rows,notes:(await db.query('select id,title,content,revision,updated_at::text from public.notes order by id')).rows});
      const beforeAudit=await snapshot(),notices=[];
      const listener=notice=>notices.push(notice.message);db.on('notice',listener);
      try {
        const result=await db.query(operatorSql);
        assert.ok(result.some(r=>r.rows?.some(row=>row.transaction_read_only==='on')));
        const serial=JSON.stringify(result.flatMap(r=>r.rows));
        assert.ok(!serial.includes('No real remote content'));assert.ok(!serial.includes('Contingut només del laboratori'));
        assert.ok(notices.some(n=>n.startsWith('R21.6_MIGRATION_HISTORY_UNKNOWN')));
        assert.deepEqual(await snapshot(),beforeAudit);
        assert.equal((await db.query('show transaction_read_only')).rows[0].transaction_read_only,'off');
        // Supabase platform metadata only, prepared outside the audited script.
        await db.query('create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key)');
        await db.query("insert into supabase_migrations.schema_migrations values('2611121830')");
        await db.query(operatorSql);
        assert.ok(notices.some(n=>n.startsWith('R21.6_MIGRATION_VERSIONS:')&&n.includes('2611121830')));
        assert.deepEqual(await snapshot(),beforeAudit);
        assert.deepEqual((await db.query('select version from supabase_migrations.schema_migrations')).rows,[{version:'2611121830'}]);
        const priorNotices=notices.length;
        await db.query('set role authenticated');
        try {
          await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false),set_config('request.jwt.claims',$2,false)",[OTHER,JSON.stringify({sub:OTHER,role:'authenticated',aal:'aal1'})]);
          await db.query(operatorSql);
          assert.ok(notices.slice(priorNotices).some(n=>n.startsWith('R21.6_MIGRATION_HISTORY_UNKNOWN: metadata schema access unavailable')));
        } finally {await db.query('rollback');await db.query('reset role');}
        assert.deepEqual(await snapshot(),beforeAudit);
      } finally {db.off('notice',listener);}
    });
  } finally {await cluster.close();}
});
