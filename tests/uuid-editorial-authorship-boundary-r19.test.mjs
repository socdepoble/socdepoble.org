/** R19 adversarial regression: a documented open capability must not be
 * implemented by forging an actor or weakening canonical signature checks. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {creaFixturePosse} from './node0-posse-fixture.mjs';
const enabled=Boolean(process.env.SDP_PGLITE_MODULE);

test('R19 UUID editorial boundary: real owner RLS, entity signature CHECK and existing editorial CAS',{skip:!enabled&&'Explicit local PGlite module required; no SQL claim without execution'},async t=>{
  const f=await creaFixturePosse();let source;
  const snapshot=async()=> (await f.pg.query('SELECT id,tenant_id,section_id,owner_user_id,author_org_id,title,description,payload,created_at,updated_at FROM public.section_submissions WHERE id=$1',[source.id])).rows[0];
  const as=async(user,{role='authenticated',aal='aal2'}={},sql,params=[])=>{
    await f.pg.exec('BEGIN');
    try{
      await f.pg.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[user,JSON.stringify({sub:user,role:'authenticated',aal})]);
      if(role)await f.pg.exec('SET LOCAL ROLE '+role);
      const result=await f.pg.query(sql,params);await f.pg.exec('COMMIT');return result.rows;
    }catch(error){await f.pg.exec('ROLLBACK;RESET ROLE');throw error;}
  };
  try{
    const org=await f.backend.handle('createOrganization',f.req({organization:{kind:'group',name:'R19 Bob synthetic organization',slug:'r19-bob-synthetic',town_name:'La Torre de les Maçanes'}},f.bob));assert.equal(org.status,201);
    source={id:randomUUID(),organizationId:org.body.id};
    const publication=await f.backend.handle('appendSectionSubmissionNetworkOnly',f.req({submission:{id:source.id,sectionId:'mur',title:'R19 original',payload:{content:'<p>Original public fixture</p>',visibility:'public'},actor:{tipus:'entitat',id:org.body.id}}},f.bob));
    assert.equal(publication.status,201,JSON.stringify({response:publication,lastError:f.lastError}));
    await f.pg.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin') ON CONFLICT(user_id) DO UPDATE SET role='superadmin'",[f.alice.id]);
    const before=await snapshot();
    await t.test('RPC76 cannot address a UUID submission absent from app_content, including an explicit synthetic namespace',async()=>{
      const version=(await f.pg.query("SELECT version FROM public.app_content WHERE tenant_id=$1 AND key='feedPosts'",[f.tenantId])).rows[0].version;
      for(const id of [source.id,'submission-'+source.id])await assert.rejects(
        as(f.alice.id,{},'SELECT public.admin_actualitza_publicacio_editorial($1,$2,$3,$4,$5)',['mur',id,{content:'<p>Must not persist</p>'},version,f.tenantId]),
        error=>error.code==='P0002'
      );
      assert.deepEqual(await snapshot(),before);
      assert.equal((await f.pg.query("SELECT to_regclass('public.seed_revisions') AS table0,to_regclass('private.seed_revisions') AS private0")).rows[0].table0,null);
      assert.equal((await f.pg.query("SELECT to_regclass('private.seed_revisions') AS table0")).rows[0].table0,null);
    });
    await t.test('ordinary superadmin UPDATE sees zero writable foreign-owner rows; forged author fields have no authority',async()=>{
      const changed=await as(f.alice.id,{},'UPDATE public.section_submissions SET title=$1 WHERE id=$2 RETURNING id',['Must not edit another owner',source.id]);
      assert.deepEqual(changed,[]);
      // Ownership is additionally protected by the canonical column grants.
      await assert.rejects(as(f.alice.id,{},'UPDATE public.section_submissions SET owner_user_id=$1 WHERE id=$2 RETURNING id',[f.alice.id,source.id]),e=>e.code==='42501');
      assert.deepEqual(await snapshot(),before);
    });
    await t.test('a privileged definer-like UPDATE still rejects the unchanged entity author under the real caller CHECK',async()=>{
      await assert.rejects(as(f.alice.id,{role:null},'UPDATE public.section_submissions SET title=$1 WHERE id=$2 RETURNING id',['Must not bypass signature',source.id]),
        error=>error.code==='23514'&&error.constraint==='section_submissions_autoria_org_valida');
      assert.deepEqual(await snapshot(),before);
    });
    await t.test('the original author can update through canonical permissions without changing owner or entity signature',async()=>{
      const rows=await as(f.bob.id,{aal:'aal1'},'UPDATE public.section_submissions SET title=$1 WHERE id=$2 RETURNING id,owner_user_id,author_org_id',['R19 author revision',source.id]);
      assert.equal(rows.length,1);assert.equal(rows[0].owner_user_id,f.bob.id);assert.equal(rows[0].author_org_id,source.organizationId);
      assert.equal((await snapshot()).title,'R19 author revision');
    });
    await t.test('a separate tenant cannot be selected to make RPC76 target this record',async()=>{
      const other=randomUUID();await f.pg.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'r19-other-municipality','R19 other municipality')",[other]);
      await assert.rejects(as(f.alice.id,{},'SELECT public.admin_actualitza_publicacio_editorial($1,$2,$3,$4,$5)',['mur',source.id,{title:'Wrong tenant'},1,other]),e=>e.code==='P0002');
      const actual=await snapshot();assert.equal(actual.tenant_id,f.tenantId);assert.equal(actual.owner_user_id,f.bob.id);assert.equal(actual.author_org_id,source.organizationId);
    });
    await t.test('the existing CAS version is tenant/key-wide and does not expose a per-UUID base revision',async()=>{
      const definition=(await f.pg.query("SELECT pg_get_functiondef('public.admin_actualitza_publicacio_editorial(text,text,jsonb,integer,uuid)'::regprocedure) AS source")).rows[0].source;
      assert.match(definition,/public\.app_content/);assert.match(definition,/fila\.version/);assert.doesNotMatch(definition,/UPDATE public\.section_submissions/i);
      const columns=(await f.pg.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='section_submissions'")).rows.map(r=>r.column_name);
      assert.equal(columns.includes('revision'),false);
      const wrapper=fs.readFileSync(new URL('../src/data/revisionsEditorials.js',import.meta.url),'utf8');
      assert.match(wrapper,/_editorialClau/);assert.match(wrapper,/FILA_DE_SECCIO\[seccio\]/);
      assert.equal((await f.pg.query("SELECT count(*)::integer AS n FROM node0.schema_migrations")).rows[0].n,78,'R19 must not add an unsafe migration79');
    });
  }finally{await f.close();}
});
