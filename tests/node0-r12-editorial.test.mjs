import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {creaFixturePosse} from './node0-posse-fixture.mjs';
import {sqlText,sqlJson} from '../tooling/node0/postgres-node0.mjs';
import {NODE0_AUTH_TENANT} from '../tooling/node0/auth-node0.mjs';
import {APLEC_2023_HTML} from '../src/sections/mur/articles/aplec2023Content.js';
import {compilaOperacioNodeZero} from '../tooling/node0/backend-node0.mjs';

const run=Boolean(process.env.SDP_PGLITE_MODULE);
test('R12 patch editorial: permisos SQL, CAS, integritat de font i backfill selectiu',{skip:!run&&'PGlite explícit requerit'},async t=>{
 const f=await creaFixturePosse();
 try{
  const tenant=f.tenantId,original={id:'manifest-de-poble',content:'<p>Versió original</p>',title:'Manifest',author:'Sóc de Poble',pobles_etiquetats:['benillup'],source_url:'https://socdepoble.net/manifest-de-poble/'};
  await f.pg.query("UPDATE public.app_content SET payload=$1,version=7 WHERE tenant_id=$2 AND key='feedPosts'",[JSON.stringify([original,{id:'altra',content:'<p>Intacta</p>'}]),tenant]);
  await f.pg.query("INSERT INTO public.app_content(tenant_id,key,payload,version) VALUES($1,'pages',$2,3) ON CONFLICT(tenant_id,key) DO UPDATE SET payload=excluded.payload,version=excluded.version",[tenant,JSON.stringify([{id:'projecte',title:'Projecte',html:'<p>Original</p>',icon:'🏡',contentLanguage:'es',translations:{es:{html:'<p>Antic</p>'}}},{id:'mateix-text',html:'<p>Sense canvi</p>',translations:{es:{html:'<p>Igual</p>'}}}])]);
  await f.pg.query("INSERT INTO node0.public_documents(kind,id,document) VALUES('feedPosts','manifest-de-poble',$1) ON CONFLICT(kind,id) DO UPDATE SET document=excluded.document",[JSON.stringify(original)]);
  const call=async({seccio='mur',id='manifest-de-poble',canvis={content:'<p>Editat</p>'},versio=7,aal='aal2',user=f.alice.id,tenantId=tenant}={})=>{
   const claims=sqlJson({sub:user,role:'authenticated',aal});
   try{
    const results=await f.pg.exec(`BEGIN;SELECT set_config('request.jwt.claim.sub',${sqlText(user)},true);SELECT set_config('request.jwt.claims',${claims}::text,true);SET LOCAL ROLE authenticated;SELECT public.admin_actualitza_publicacio_editorial(${sqlText(seccio)},${sqlText(id)},${sqlJson(canvis)},${versio},${sqlText(tenantId)}::uuid) AS result;COMMIT;`);
    return results.find(r=>r.rows?.[0]?.result)?.rows[0].result;
   }catch(error){await f.pg.exec('ROLLBACK;RESET ROLE;');throw error;}
  };
  await t.test('anonymous lacks EXECUTE; authenticated non-admin and aal1 are rejected before reads',async()=>{
   assert.equal((await f.pg.query("SELECT has_function_privilege('anon','public.admin_actualitza_publicacio_editorial(text,text,jsonb,integer,uuid)','EXECUTE') AS allowed")).rows[0].allowed,false);
   await assert.rejects(call(),e=>e.code==='42501');
   await f.pg.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin') ON CONFLICT(user_id) DO UPDATE SET role='superadmin'",[f.alice.id]);
   await assert.rejects(call({aal:'aal1'}),e=>e.code==='42501');
  });
  await t.test('one existing item is changed and server-owned authorship/source/other items survive',async()=>{
   const result=await call({canvis:{title:'Manifest editat',content:'<p>Document sencer editat</p>',subtitle:'Subtítol',image_url:'/assets/foto.jpg',tags:['Territori']}});
   assert.equal(result.versio,8);assert.equal(result.item._editorialVersio,8);assert.equal(result.item._editorialClau,'feedPosts');assert.equal(result.item.editorial_format,'html-r6');
   assert.equal(result.item.author,original.author);assert.equal(result.item.source_url,original.source_url);assert.deepEqual(result.item.pobles_etiquetats,original.pobles_etiquetats);assert.equal(result.item.post_subtitle,'Subtítol');assert.equal(result.item.imageSrc,'/assets/foto.jpg');
   const row=(await f.pg.query("SELECT payload FROM public.app_content WHERE tenant_id=$1 AND key='feedPosts'",[tenant])).rows[0];assert.deepEqual(row.payload[1],{id:'altra',content:'<p>Intacta</p>'});
  });
  await t.test('stale revision, authority keys, wrong section, unknown id and malformed fields cannot write',async()=>{
   await assert.rejects(call(),e=>e.code==='40001');
   for(const input of [{canvis:{owner_user_id:f.bob.id}},{canvis:{content:{html:'x'}}},{canvis:{tags:[{}]}},{seccio:'notes'},{id:'absent',versio:8}])await assert.rejects(call(input),e=>['22023','P0002'].includes(e.code));
   assert.equal((await f.pg.query("SELECT version FROM public.app_content WHERE tenant_id=$1 AND key='feedPosts'",[tenant])).rows[0].version,8);
  });
  await t.test('system pages share the same permission and optimistic CAS contract',async()=>{
   const result=await call({seccio:'pagines',id:'projecte',versio:3,canvis:{html:'<p>Projecte editable</p>',lead:'Introducció'}});
   assert.equal(result.versio,4);assert.equal(result.item.html,'<p>Projecte editable</p>');assert.equal(result.item.icon,'🏡');assert.equal(result.item.contentLanguage,'ca');assert.equal(result.item.translations,undefined);
   const unchanged=await call({seccio:'pagines',id:'mateix-text',versio:4,canvis:{html:'<p>Sense canvi</p>',image:'/assets/foto.jpg'}});assert.deepEqual(unchanged.item.translations,{es:{html:'<p>Igual</p>'}});
  });
  await t.test('backfill fills only known legacy content and never resurrects a deliberate empty edit',async()=>{
   const migration=fs.readFileSync(new URL('../supabase/migrations/2611051930_edicio_publicacions_editorials.sql',import.meta.url),'utf8');
   await f.pg.query("UPDATE public.app_content SET payload=$1,version=8 WHERE tenant_id=$2 AND key='feedPosts'",[JSON.stringify([{...original,content:'',editorial_format:'html-r6'}]),tenant]);
   await f.pg.query("UPDATE public.app_content SET payload=$1,version=2 WHERE tenant_id=$2 AND key='events'",[JSON.stringify([{id:'aplec-2023',title:'Aplec',source_url:'original'}]),tenant]);
   await f.pg.exec(migration);
   const rows=(await f.pg.query("SELECT key,payload,version FROM public.app_content WHERE tenant_id=$1 AND key IN ('feedPosts','events')",[tenant])).rows;
   assert.equal(rows.find(r=>r.key==='feedPosts').payload[0].content,'');assert.equal(rows.find(r=>r.key==='feedPosts').version,8);
   assert.equal(rows.find(r=>r.key==='events').payload[0].content,APLEC_2023_HTML);assert.equal(rows.find(r=>r.key==='events').payload[0].source_url,'original');assert.equal(rows.find(r=>r.key==='events').version,3);
  });
  await t.test('altre tenant amb el mateix slug no pot xafar el mirall públic del Node0 pilot',async()=>{
   const other='99999999-1111-4111-8111-111111111111';
   assert.equal(tenant,NODE0_AUTH_TENANT);
   const before=(await f.pg.query("SELECT document FROM node0.public_documents WHERE kind='feedPosts' AND id='manifest-de-poble'")).rows[0].document;
   await f.pg.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'altre-tenant','Altre poble')",[other]);
   await f.pg.query("INSERT INTO public.app_content(tenant_id,key,payload,version) VALUES($1,'feedPosts',$2,1)",[other,JSON.stringify([original])]);
   const result=await call({tenantId:other,versio:1,canvis:{content:'<p>Publicació de l’altre poble</p>'}});
   assert.equal(result.item.content,'<p>Publicació de l’altre poble</p>');
   assert.deepEqual((await f.pg.query("SELECT document FROM node0.public_documents WHERE kind='feedPosts' AND id='manifest-de-poble'")).rows[0].document,before);
   const sql=fs.readFileSync(new URL('../supabase/migrations/2611051930_edicio_publicacions_editorials.sql',import.meta.url),'utf8');assert.ok(sql.includes(NODE0_AUTH_TENANT));
  });
  await t.test('Node0 compiler uses the same RPC and never accepts raw SQL/authority arguments',()=>{
   const sql=compilaOperacioNodeZero('adminActualitzaPublicacioEditorial',{edicio:{seccio:'mur',id:'manifest-de-poble',canvis:{content:'x'},versio:8}},tenant);
   assert.match(sql,/public\.admin_actualitza_publicacio_editorial/);
   assert.throws(()=>compilaOperacioNodeZero('adminActualitzaPublicacioEditorial',{edicio:{seccio:'mur',id:'manifest-de-poble',canvis:{author:'forjat'},versio:8}},tenant));
  });
 }finally{await f.close();}
});
