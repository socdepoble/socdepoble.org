import test from 'node:test';
import assert from 'node:assert/strict';
import {creaFixtureR20b} from './fixtures/r20b-municipal-fixture.mjs';
import {llegeixZipNodeZero} from '../tooling/node0/paquet-opendata-node0.mjs';
import {llegeixPaquetOpenData} from '../src/data/importaMunicipiOpenData.js';
import {ROOT,SHA256_ZIP_CANONIC} from '../tooling/node0/hidrata-postgres-node0.mjs';
test('R20b76→SQL78 alone: municipal storage security is independent of administration',{skip:!process.env.SDP_PGLITE_MODULE&&'Explicit local PGlite required'},async()=>{
 const f=await creaFixtureR20b();
 try{
  assert.equal(await f.count(),76);await f.phase(['2611060010']);assert.equal(await f.count(),77);
  for(const table of ['admin_accions','admin_invitacions','admin_etiquetes_connexio','admin_editors_organitzacio'])assert.equal((await f.pg.query('SELECT to_regclass($1) AS relation',[`private.${table}`])).rows[0].relation,null);
  for(const table of ['municipi_opendata','municipi_opendata_documents']){
   assert.equal((await f.pg.query('SELECT relrowsecurity AS enabled FROM pg_class WHERE oid=$1::regclass',[`private.${table}`])).rows[0].enabled,true);
   for(const role of ['anon','authenticated','service_role'])for(const privilege of ['SELECT','INSERT','UPDATE','DELETE'])assert.equal((await f.pg.query('SELECT has_table_privilege($1,$2,$3) AS allowed',[role,`private.${table}`,privilege])).rows[0].allowed,false);
  }
  const owner=await f.person('r20b-restore-owner',{admin:true}),user=await f.person('r20b-restore-person');
  const archive=await llegeixZipNodeZero({root:ROOT,sha256Esperat:SHA256_ZIP_CANONIC});
  const {lot}=await llegeixPaquetOpenData(new Uint8Array(archive),{sha256Esperat:SHA256_ZIP_CANONIC});
  const restore=(actor,aal='aal2')=>f.as(actor,'SELECT public.importa_municipi_open_data($1,$2) AS value',[f.tenantId,lot],{aal});
  await assert.rejects(restore(user),e=>e.code==='42501');await assert.rejects(restore(owner,'aal1'),e=>e.code==='42501');
  const first=(await restore(owner))[0].value,again=(await restore(owner))[0].value;
  for(const collection of ['entitats','noticies','agenda','memoria','memoriaOral']){assert.equal(first.creats[collection],lot[collection].length);assert.equal(again.iguals[collection],lot[collection].length);}
  const publicData=(await f.as(null,'SELECT public.llegix_municipi_open_data($1) AS value',[f.tenantId],{role:'anon'}))[0].value;
  for(const collection of Object.keys(publicData))assert.deepEqual(publicData[collection],lot[collection].toSorted((a,b)=>a.id<b.id?-1:a.id>b.id?1:0));
  assert.equal((await f.pg.query("SELECT has_function_privilege('anon','public.importa_municipi_open_data(uuid,jsonb)','EXECUTE') AS allowed")).rows[0].allowed,false);
 }finally{await f.close();}
});
