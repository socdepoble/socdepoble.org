import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {creaPlaMigracions,ROOT,SHA256_ZIP_CANONIC} from '../tooling/node0/hidrata-postgres-node0.mjs';
import {llegeixZipNodeZero} from '../tooling/node0/paquet-opendata-node0.mjs';
import {llegeixPaquetOpenData} from '../src/data/importaMunicipiOpenData.js';
import {compilaOperacioNodeZero,creaBackendPrivatNodeZero} from '../tooling/node0/backend-node0.mjs';
import {capturaAdminUsuaris} from '../src/data/adminUsuaris.js';
const modulePath=process.env.SDP_PGLITE_MODULE;
const T='ac3bec76-255b-5ca2-8886-28fcceab4267',B='11111111-1111-4111-8111-111111111111';
const SA='22222222-2222-4222-8222-222222222222',VEI='33333333-3333-4333-8333-333333333333';
const sha=b=>createHash('sha256').update(b).digest('hex');

test('R13 bounded administration contract rejects client authority and accessors',()=>{
  assert.deepEqual(capturaAdminUsuaris(),{limit:25,cursorCreat:null,cursorId:null});
  for(const input of [{limit:0},{offset:-1},{role:'superadmin'},{get limit(){throw Error('getter');}}])assert.throws(()=>capturaAdminUsuaris(input));
  assert.throws(()=>compilaOperacioNodeZero('adminConnectaUsuari',{entrada:{usuariId:VEI,categoria:'amics'},tenantId:B},T));
});
test('R13 new operations require explicit deployment readiness and a cookie',async()=>{
  const db={query(){throw Error('must not query');}};
  const backend=creaBackendPrivatNodeZero({db,tenantId:T});
  const headers={origin:'https://socdepoble.cat'};
  for(const action of ['adminLlistaUsuarisRegistrats','adminAssignaMembreOrganitzacio','adminConnectaUsuari','restauraDadesObertes','importaMunicipiOpenData'])assert.equal((await backend.handle(action,{headers})).status,501);
  const ready=creaBackendPrivatNodeZero({db,tenantId:T,adminUsuarisReady:true,restauracioReady:true});
  assert.equal((await ready.handle('adminLlistaUsuarisRegistrats',{headers})).status,401);
  const cookie={...headers,cookie:'__Host-sdp-node0='+Buffer.alloc(32,1).toString('base64url'),'x-sdp-expected-actor':SA};
  assert.equal((await ready.handle('importaMunicipiOpenData',{headers:cookie,body:{zipBase64:'AAAA',sha256Esperat:'0'.repeat(64)}})).status,400);
});

test('R13 actual SQL catalogue, admin permissions, clean municipal restore and cross-tenant rollback',{skip:!modulePath&&'SDP_PGLITE_MODULE explicit required'},async t=>{
  const url=modulePath.startsWith('file:')?new URL(modulePath):pathToFileURL(path.resolve(modulePath));
  const {PGlite}=await import(url.href),{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',url));
  const db=new PGlite({extensions:{pgcrypto}}),plan=creaPlaMigracions();
  let lot,archive;
  const as=async(user,aal,sql,params=[])=>{
    await db.exec('BEGIN');
    try{
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[user,JSON.stringify({sub:user,role:'authenticated',aal})]);
      await db.exec('SET LOCAL ROLE authenticated');
      const result=await db.query(sql,params);await db.exec('COMMIT');return result.rows;
    }catch(e){await db.exec('ROLLBACK;RESET ROLE;');throw e;}
  };
  const restore=(value=lot,tenant=T,user=SA,aal='aal2')=>as(user,aal,'SELECT public.importa_municipi_open_data($1,$2) AS informe',[tenant,value]);
  try{
    await t.test('all canonical migrations apply to a clean PostgreSQL WASM database',async()=>{
      await db.exec(plan.bootstrap);
      for(const migration of plan.migrations)await db.exec(migration.sql);
      // Native Node0 adds this exact infrastructure grant in backend-node0.sql.
      await db.exec('GRANT SELECT(id) ON public.towns TO authenticated');
      assert.equal(plan.migrations.length,86); // R15 adds2611091500; this full-source suite executes pending2.6 too.
      assert.equal(plan.migrations.some(m=>m.version==='2611091500'),true);
      archive=await llegeixZipNodeZero({root:ROOT,sha256Esperat:SHA256_ZIP_CANONIC});
      assert.equal(sha(archive),SHA256_ZIP_CANONIC);
      const parsed=await llegeixPaquetOpenData(new Uint8Array(archive),{sha256Esperat:SHA256_ZIP_CANONIC});
      assert.equal(parsed.versio,'1.2.0');lot=parsed.lot;
      await db.query('INSERT INTO public.towns(id,slug,name) VALUES($1,$2,$3),($4,$5,$6) ON CONFLICT DO NOTHING',[T,lot.municipi.slug,lot.municipi.nom,B,'sella','Sella']);
      for(const [id,name]of [[SA,'Administradora sintètica'],[VEI,'Veïna sintètica']]){
        await db.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)',[id,`${id}@example.invalid`,{tenant_id:T,name,rgpd:true}]);
        await as(id,'aal2',"SELECT public.registra_consentiment('rgpd_acepta',null)");
      }
      await db.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin') ON CONFLICT(user_id) DO UPDATE SET role='superadmin'",[SA]);
    });
    await t.test('private storage has RLS and no direct grants; public and aal1 cannot import',async()=>{
      for(const table of ['municipi_opendata','municipi_opendata_documents']){
        assert.equal((await db.query('SELECT relrowsecurity AS rls FROM pg_class WHERE oid=$1::regclass',[`private.${table}`])).rows[0].rls,true);
        assert.equal((await db.query("SELECT has_table_privilege('authenticated',$1,'SELECT,INSERT,UPDATE,DELETE') AS allowed",[`private.${table}`])).rows[0].allowed,false);
      }
      for(const [user,aal]of [[VEI,'aal2'],[SA,'aal1']])await assert.rejects(restore(lot,T,user,aal),e=>e.code==='42501');
      assert.equal((await db.query("SELECT has_function_privilege('anon','public.importa_municipi_open_data(uuid,jsonb)','EXECUTE') AS allowed")).rows[0].allowed,false);
    });
    await t.test('the exact pinned Open Data 1.2.0 archive restores all public collections and replays idempotently',async()=>{
      const result=(await restore())[0].informe;
      for(const c of ['entitats','noticies','agenda','memoria','memoriaOral'])assert.equal(result.creats[c],lot[c].length);
      const again=(await restore())[0].informe;
      for(const c of Object.keys(again.iguals))assert.equal(again.iguals[c],lot[c].length);
      const read=(await db.query('SELECT public.llegix_municipi_open_data($1) AS data',[T])).rows[0].data;
      for(const c of Object.keys(read))assert.deepEqual(read[c],lot[c].toSorted((a,b)=>a.id<b.id?-1:a.id>b.id?1:0));
    });
    await t.test('another municipality cannot steal IDs; malformed final collection rolls the whole function back',async()=>{
      const before=(await db.query('SELECT count(*)::integer AS n FROM private.municipi_opendata_documents')).rows[0].n;
      const other=structuredClone(lot);other.municipi={slug:'sella',nom:'Sella'};
      for(const row of other.entitats)row.town_name='Sella';
      for(const c of ['noticies','agenda','memoria'])for(const row of other[c])row.poble_id='sella';
      for(const row of other.memoriaOral)row.okf.frontmatter.municipi='sella';
      await assert.rejects(restore(other,B),e=>e.code==='23505');
      const invalid=structuredClone(lot);invalid.memoriaOral=[{id:'bad',visibility:'public',owner_user_id:VEI}];
      if(invalid.noticies.length)invalid.noticies[0].title='must rollback';
      await assert.rejects(restore(invalid),e=>e.code==='22023');
      assert.equal((await db.query('SELECT count(*)::integer AS n FROM private.municipi_opendata_documents')).rows[0].n,before);
      assert.equal((await db.query('SELECT count(*)::integer AS n FROM private.municipi_opendata WHERE tenant_id=$1',[B])).rows[0].n,0);
    });
    await t.test('admin list is bounded, excludes email and credentials, and requires aal2',async()=>{
      await assert.rejects(as(SA,'aal1','SELECT public.admin_llista_usuaris_registrats($1)',[T]),e=>e.code==='42501');
      await assert.rejects(as(VEI,'aal2','SELECT public.admin_llista_usuaris_registrats($1)',[T]),e=>e.code==='42501');
      const rows=(await as(SA,'aal2','SELECT public.admin_llista_usuaris_registrats($1,null,null,1) AS value',[T]))[0].value;
      assert.equal(rows.length,1);assert.equal(rows[0].email,undefined);assert.equal(rows[0].password,undefined);
      await assert.rejects(as(SA,'aal2','SELECT public.admin_llista_usuaris_registrats($1,null,null,51)',[T]),e=>e.code==='22023');
    });
    await t.test('direct SQL lot cannot smuggle private nested OKF metadata into anonymous Open Data',async()=>{
      const valid=structuredClone(lot),at='2026-11-06T00:00:00Z';
      valid.memoriaOral=[{id:'oral-public-r13',author_org_id:valid.entitats[0].id,visibility:'public',okf:{
        cami:`memoria-oral/${valid.municipi.slug}/relat-sintetic.md`,cos:'Relat públic sintètic.',frontmatter:{
          type:'Memòria oral',title:'Relat sintètic',description:'Fitxa pública de prova',status:'stable',municipi:valid.municipi.slug,
          tags:['oficis'],generated:{by:'socdepoble/memoria-oral',at},verified:[{by:'human:auditor',at}],stale_after:'2027-11-06T00:00:00+01:00',
          sources:[{id:'relat-public',resource:'https://example.invalid/relat',title:'Entrevista pública',author:'human:auditor'}]
        }
      }}];
      assert.equal((await restore(valid))[0].informe.creats.memoriaOral,1);
      const read=async()=>{
        await db.exec('BEGIN;SET LOCAL ROLE anon');
        try{return (await db.query('SELECT public.llegix_municipi_open_data($1) AS value',[T])).rows[0].value;}
        finally{await db.exec('ROLLBACK;RESET ROLE');}
      };
      const before=await read();assert.equal(before.memoriaOral[0].okf.frontmatter.sources[0].title,'Entrevista pública');
      const mutations=[
        o=>{o.owner_user_id=VEI;},o=>{o.frontmatter.owner_user_id=VEI;},o=>{o.frontmatter.correu='private-r13@example.invalid';},
        o=>{o.frontmatter.generated.token='private-r13';},o=>{o.frontmatter.generated.by={correu:'private-r13'};},
        o=>{o.frontmatter.generated.at='2026-02-30T00:00:00Z';},o=>{o.frontmatter.generated=null;},
        o=>{o.frontmatter.verified[0].owner_user_id=VEI;},o=>{o.frontmatter.verified[0].at='2026-11-06T24:00:00Z';},
        o=>{o.frontmatter.verified={by:'human:auditor',at};},o=>{o.frontmatter.verified=[{by:'human:auditor'}];},
        o=>{o.frontmatter.sources[0].password='private-r13';},o=>{o.frontmatter.sources[0].resource={correu:'private-r13'};},
        o=>{o.frontmatter.sources={resource:'https://example.invalid'};},o=>{o.frontmatter.sources=[{id:'resource-absent'}];},
        o=>{o.frontmatter.tags=[{correu:'private-r13'}];},o=>{o.frontmatter.tags='oficis';},
        o=>{o.frontmatter.status={owner_user_id:VEI};},o=>{o.frontmatter.status='private';},o=>{o.frontmatter.status=null;},
        o=>{o.frontmatter.stale_after='2026-01-01';},o=>{o.frontmatter.title={secret:'private-r13'};},
        o=>{o.cami='memoria-oral/altre-poble/relat.md';},o=>{o.cami='../secret.md';}
      ];
      for(const mutate of mutations){
        const hostile=structuredClone(valid);if(hostile.noticies.length)hostile.noticies[0].title='must rollback private-r13';
        mutate(hostile.memoriaOral[0].okf);
        await assert.rejects(restore(hostile),e=>e.code==='22023');
        assert.deepEqual(await read(),before,'a rejected final OKF row must not change any prior collection');
      }
      assert.ok(!JSON.stringify(await read()).includes('private-r13'));
    });
    await t.test('admin proposes only member invitations and preserves canonical authority',async()=>{
      const org=(await as(SA,'aal2',"SELECT public.create_organization($1,'group','El Rentonar sintètic','rentonar-sintetic','','',null) AS value",[T]))[0].value.id;
      const assign=(uid,rol='membre',tenant=T,remove=false)=>as(SA,'aal2','SELECT public.admin_assigna_membre_organitzacio($1,$2,$3,$4,$5) AS value',[tenant,uid,org,rol,remove]);
      for(const role of ['editor','admin','owner'])await assert.rejects(assign(VEI,role),e=>e.code==='42501');
      await assert.rejects(assign(SA),e=>e.code==='42501');
      await assert.rejects(assign(VEI,'membre',B),e=>e.code==='42501');
      const invitation=(await assign(VEI))[0].value;assert.equal(invitation.rol,'member');assert.equal(invitation.estat,'pendent');
      assert.equal((await db.query('SELECT count(*)::int AS n FROM public.organization_memberships WHERE organization_id=$1 AND user_id=$2',[org,VEI])).rows[0].n,0);
      const reply=(await as(VEI,'aal2','SELECT public.respon_invitacio_admin($1,true) AS value',[invitation.invitacioId]))[0].value;assert.equal(reply.acceptada,true);
      assert.equal((await db.query('SELECT role FROM public.organization_memberships WHERE organization_id=$1 AND user_id=$2',[org,VEI])).rows[0].role,'member');
      await assert.rejects(assign(VEI,'membre',T,true),e=>e.code==='42501');
    });
    await t.test('admin connection follows only as the real actor',async()=>{
      const r=(await as(SA,'aal2',"SELECT public.admin_connecta_usuari($1,$2) AS value",[T,VEI]))[0].value;
      assert.equal(r.usuariId,VEI);assert.equal(r.categoria,undefined);
      assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.seguiments WHERE seguidor=$1 AND seguit_persona=$2 AND deixat_al is null',[SA,VEI])).rows[0].n,1);
      assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.seguiments WHERE seguidor=$1 AND seguit_persona=$2 AND deixat_al is null',[VEI,SA])).rows[0].n,0);
      await assert.rejects(as(SA,'aal2',"SELECT public.admin_connecta_usuari($1,$2)",[B,VEI]),e=>e.code==='22023');
    });
    console.log(JSON.stringify({scope:'PostgreSQL WASM, clean database, real migrations; no native PostgreSQL17 or production mutation',postgres:(await db.query('SELECT version() AS version')).rows[0].version,migrations:plan.migrations.map(({file,sha256})=>({file,sha256})),archiveSha256:sha(archive)}));
  }finally{await db.close();}
});
