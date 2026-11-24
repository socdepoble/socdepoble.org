import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { bootstrap, actor, id } from './fixtures/r32_25-push.mjs';
import { creaPlaMigracions, generaSql } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/r3242-ajuntament-postgres-local.mjs';
import { llegixReadme } from '../scripts/supabase/verifica-migracions.mjs';
import { projecta132PerFixture } from './fixtures/r3278-cataleg-parcial.mjs';
const engine=process.env.SDP_R3242_SQL_ENGINE||'pglite';
const MIG='20261122160000_r3242_ajuntament_acreditacio_institucional.sql';
const migration=readFileSync(new URL(`../supabase/migrations/${MIG}`,import.meta.url),'utf8');
const JWT=`create or replace function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('sub',auth.uid(),'role',auth.role(),'aal',coalesce(nullif(current_setting('test.aal',true),''),'aal1'))$$;`;
const A=id(501),B=id(502),C=id(503),X=id(504),T=id(510),T2=id(511),T3=id(512),T4=id(513);
async function database(){
 if(engine==='native'){const c=await startLocalPostgres({dataRoot:'/tmp/r3242-ajuntament-pg'});return{exec:q=>c.db.query(q),query:(...a)=>c.db.query(...a),close:c.close,connect:c.connect};}
 assert.ok(process.env.SDP_PGLITE_MODULE,'PGlite obligatori, cap prova SQL omesa');
 const base=pathToFileURL(process.env.SDP_PGLITE_MODULE),{PGlite}=await import(base.href),{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',base)),{unaccent}=await import(new URL('./contrib/unaccent.js',base));
 const d=new PGlite({extensions:{pgcrypto,unaccent}});return{exec:q=>d.exec(q),query:(...a)=>d.query(...a),close:()=>d.close()};
}
const ask=(db,u,sql,params=[],role='authenticated')=>actor(db,u,sql,params,role);
const evidence='Evidència sintètica: nomenament institucional contrastat per secretaria';
test(`R32.42 ajuntament · ${engine} · ${process.env.SDP_R3242_BOOTSTRAP||'node0'}`,{timeout:180000},async t=>{
 const db=await database();
 try{
 if(process.env.SDP_R3242_BOOTSTRAP!=='push'){
  await db.exec(generaSql(creaPlaMigracions(),null,{advisoryLock:false}));
 }else{
 await bootstrap(db);
 // La fixture push omet 2609160600: reproduïm el seu grant públic de columnes, sense reexecutar migracions antigues no idempotents.
 const publicGrants=readFileSync(new URL('../supabase/migrations/2609160600_politiques_superadmin_organitzacions.sql',import.meta.url),'utf8').match(/grant select \([\s\S]*?\) on table public\.organizations to anon;/)[0];
 await db.exec(publicGrants);
 await db.exec(readFileSync(new URL('../supabase/migrations/2610311500_commutacio_grup_empresa_i_transferencia_propietat.sql',import.meta.url),'utf8'));
 }
 await db.exec(JWT);
 await db.query("insert into public.towns(id,slug,name) values($1,'r3242-torre','La Torre de les Maçanes'),($2,'r3242-alfafara','Alfafara'),($3,'r3242-sintetic','Municipi inexistent sintètic')",[T,T2,T3]);
 for(const [u,email]of[[A,'secretaria@ajuntament.example'],[B,'revisora@example.invalid'],[C,'alcaldia@ajuntament.example']]) await db.query("insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)values($1,$2,now(),$3)",[u,email,{full_name:'Persona sintètica',tenant_id:T,accepta_rgpd:true}]);
 await db.query("insert into public.user_platform_roles(user_id,role)values($1,'superadmin') on conflict(user_id)do update set role='superadmin'",[B]);
 await db.exec(migration);await db.exec(migration);
 const H=(await db.query("select id from public.organizations where tenant_id=$1 and kind='city_hall'",[T])).rows[0].id;
 await t.test('sembra INE idempotent, sense propietària ni membre i cap municipi inventat',async()=>{
  assert.equal(Number((await db.query('select count(*) n from private.ajuntament_municipis_ine')).rows[0].n),8132);
  assert.deepEqual((await db.query('select claimed,created_by,municipi_ine,description from public.organizations where id=$1',[H])).rows[0],{claimed:false,created_by:null,municipi_ine:'03132',description:'Fitxa municipal pendent d’acreditació oficial'});
  assert.equal(Number((await db.query('select count(*) n from public.organization_memberships where organization_id=$1',[H])).rows[0].n),0);
  // v1.2.23 · R2D-02 (Gauntlet R2) · El nom sembrat contrau i minusculitza l'article i s'apostrofa davant de vocal,
  // com nomDeLaGent: ningú no el pot esmenar fins a l'acreditació.
  assert.equal((await db.query('select name from public.organizations where id=$1',[H])).rows[0].name,'Ajuntament de la Torre de les Maçanes');
  assert.equal((await db.query("select name from public.organizations where tenant_id=$1 and kind='city_hall'",[T2])).rows[0].name,"Ajuntament d'Alfafara");
  assert.equal(Number((await db.query('select count(*) n from public.organizations where tenant_id=$1',[T3])).rows[0].n),0);
  const directory=(await ask(db,null,'select claimed,municipi_ine from public.organization_directory where id=$1',[H],'anon')).rows[0];assert.deepEqual(directory,{claimed:false,municipi_ine:'03132'});
 });
 await t.test('cap autoalta, canvi de tipus, claimed, auditoria ni RPC genèrica',async()=>{
  await assert.rejects(ask(db,A,"insert into public.organizations(tenant_id,slug,name,kind,created_by)values($1,'usurpacio','Oficina falsa','city_hall',$2)",[T,A]),/row-level security|permission denied/);
  for(const sql of["update public.organizations set claimed=true where id=$1","select * from private.ajuntament_auditoria where organization_id=$1"] ) await assert.rejects(ask(db,A,sql,[H]),/permission denied/);
  // v1.2.23 · M3-01 (ordre del Mestre 261123) · El missatge porta «sollutia» en lloc de l'errata «sollicitia».
  await assert.rejects(ask(db,A,'select public.sollicita_reclamacio($1,$2)',[H,evidence]),/SDP-AJT-020: usa sollutia acreditació institucional/);
  assert.equal(migration.includes('sollicitia'),false);
  await assert.rejects(ask(db,A,'select public.sollicita_acreditacio_ajuntament($1,$2)',[H,evidence]),/SDP-AJT-005/);
 });
 await t.test('domini vinculat a ajuntament, revisió AAL2 i correu autèntic confirmat',async()=>{
  await assert.rejects(ask(db,B,'select public.registra_domini_ajuntament($1,$2,$3)',[H,'ajuntament.example',evidence]),/SDP-AJT-010/);
  await db.exec("set test.aal='aal2'");
  await assert.rejects(ask(db,A,'select public.registra_domini_ajuntament($1,$2,$3)',[H,'ajuntament.example',evidence]),/SDP-AJT-010/);
  await ask(db,B,'select public.registra_domini_ajuntament($1,$2,$3)',[H,'ajuntament.example',evidence]);
  await db.query('update auth.users set email_confirmed_at=null where id=$1',[A]);
  await assert.rejects(ask(db,A,'select public.sollicita_acreditacio_ajuntament($1,$2)',[H,evidence]),/SDP-AJT-004/);
  await db.query('update auth.users set email_confirmed_at=now(),email=$2 where id=$1',[A,'persona@altra.cat']);
  await assert.rejects(ask(db,A,'select public.sollicita_acreditacio_ajuntament($1,$2)',[H,evidence]),/SDP-AJT-005/);
  await db.query('update auth.users set email=$2 where id=$1',[A,'secretaria@ajuntament.example']);
 });
 const claim=async u=>(await ask(db,u,'select (public.sollicita_acreditacio_ajuntament($1,$2)).id id',[H,evidence])).rows[0].id;
 let ca,cc;
 await t.test('sol·licitud sense poder institucional, doble pendent i bypass genèric',async()=>{
  ca=await claim(A);cc=await claim(C);
  await assert.rejects(claim(A),/duplicate key|unique constraint/);
  assert.equal((await db.query('select claimed from public.organizations where id=$1',[H])).rows[0].claimed,false);
  assert.equal((await ask(db,A,'select public.pot_signar_com_organitzacio($1,$2) x',[H,T])).rows[0].x,false);
  await assert.rejects(ask(db,B,'select public.resol_reclamacio($1,true)',[ca]),/SDP-AJT-020/);
  // v1.2.23 · M3-01 · Una sol·licitud institucional tampoc no es rebutja per la via genèrica: no perd l'evidència.
  await assert.rejects(ask(db,B,'select public.resol_reclamacio($1,false)',[ca]),/SDP-AJT-020/);
  assert.equal((await db.query('select estat from public.organization_claims where id=$1',[ca])).rows[0].estat,'pendent');
  await assert.rejects(ask(db,A,'select public.resol_acreditacio_ajuntament($1,true,$2)',[ca,evidence]),/SDP-AJT-010/);
 });
 await t.test('canvi del correu després de sol·licitar invalida aprovació',async()=>{
  await db.query('update auth.users set email=$2 where id=$1',[A,'altre@ajuntament.example']);
  await assert.rejects(ask(db,B,'select public.resol_acreditacio_ajuntament($1,true,$2)',[ca,evidence]),/SDP-AJT-014/);
  await db.query('update auth.users set email=$2 where id=$1',[A,'secretaria@ajuntament.example']);
 });
 await t.test('cap autoaprovació encara que la persona sol·licitant siga superadmin',async()=>{
  await db.query("insert into public.user_platform_roles(user_id,role)values($1,'superadmin') on conflict(user_id)do update set role='superadmin'",[A]);
  await assert.rejects(ask(db,A,'select public.resol_acreditacio_ajuntament($1,true,$2)',[ca,evidence]),/SDP-AJT-013/);
  await db.query('delete from public.user_platform_roles where user_id=$1',[A]);
 });
 await t.test('aprovació auditable, un sol owner, mateix poble, reaplicar no revoca',async()=>{
  await ask(db,B,'select public.resol_acreditacio_ajuntament($1,true,$2)',[ca,evidence]);
  assert.equal((await db.query('select claimed from public.organizations where id=$1',[H])).rows[0].claimed,true);
  await assert.rejects(ask(db,A,"update public.organizations set kind='company' where id=$1",[H]),/SDP-ORGMEM-001|SDP-ORG-403/);
  assert.equal((await ask(db,A,'select public.pot_signar_com_organitzacio($1,$2) x',[H,T])).rows[0].x,true);
  assert.equal((await ask(db,A,'select public.pot_signar_com_organitzacio($1,$2) x',[H,T2])).rows[0].x,false);
  await assert.rejects(ask(db,B,'select public.resol_acreditacio_ajuntament($1,true,$2)',[cc,evidence]),/SDP-AJT-002/);
  await assert.rejects(ask(db,B,'select public.resol_acreditacio_ajuntament($1,true,$2)',[ca,evidence]),/SDP-AJT-012/);
  await db.exec(migration);
  assert.equal((await db.query('select claimed from public.organizations where id=$1',[H])).rows[0].claimed,true);
  assert.equal(Number((await db.query("select count(*) n from public.organization_memberships where organization_id=$1 and role='owner'",[H])).rows[0].n),1);
  assert.equal(Number((await db.query("select count(*) n from private.ajuntament_auditoria where organization_id=$1 and accio='aprovada'",[H])).rows[0].n),1);
 });
 await t.test('resolució rebutjada conserva claimed=false i no crea propietària',async()=>{
  const H2=(await db.query("select id from public.organizations where tenant_id=$1 and kind='city_hall'",[T2])).rows[0].id;
  await ask(db,B,'select public.registra_domini_ajuntament($1,$2,$3)',[H2,'ajuntament.example',evidence]);
  const ca2=(await ask(db,A,'select (public.sollicita_acreditacio_ajuntament($1,$2)).id id',[H2,evidence])).rows[0].id;
  await assert.rejects(ask(db,B,'select public.resol_acreditacio_ajuntament($1,null,$2)',[ca2,evidence]),/SDP-AJT-011/);
  await ask(db,B,'select public.resol_acreditacio_ajuntament($1,false,$2)',[ca2,evidence]);
  assert.equal((await db.query('select claimed from public.organizations where id=$1',[H2])).rows[0].claimed,false);
  assert.equal(Number((await db.query('select count(*) n from public.organization_memberships where organization_id=$1',[H2])).rows[0].n),0);
 });
 // M3-02: la serialització necessita dues connexions reals; PGlite no en té i el salt queda marcat al TAP.
 await t.test('dues aprovacions simultànies no creen dues propietàries',{skip:!db.connect&&'cal PostgreSQL natiu (SDP_R3242_SQL_ENGINE=native)'},async()=>{
  const H2=(await db.query("select id from public.organizations where tenant_id=$1 and kind='city_hall'",[T2])).rows[0].id;
  const claims=[];
  for(const u of[A,C])claims.push((await ask(db,u,'select (public.sollicita_acreditacio_ajuntament($1,$2)).id id',[H2,evidence])).rows[0].id);
  const connections=await Promise.all([db.connect(),db.connect()]);
  try{
   const results=await Promise.allSettled(connections.map(async(c,i)=>{
    await c.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false),set_config('test.aal','aal2',false)",[B]);
    await c.query('set role authenticated');
    return c.query('select public.resol_acreditacio_ajuntament($1,true,$2)',[claims[i],evidence]);
   }));
   assert.equal(results.filter(r=>r.status==='fulfilled').length,1,'dues aprovacions simultànies no creen dues propietàries');
   assert.match(results.find(r=>r.status==='rejected').reason.message,/SDP-AJT-002/);
   assert.equal(Number((await db.query("select count(*) n from public.organization_memberships where organization_id=$1 and role='owner'",[H2])).rows[0].n),1);
  }finally{await Promise.allSettled(connections.map(c=>c.end()));}
 });
 await t.test('regularitza city_hall històric amb mateixa owner, sense transferir ni autoacreditar',async()=>{
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);
  const legacy=(await db.query("insert into public.organizations(tenant_id,slug,name,kind,created_by)values($1,'ajuntament-historic','Ajuntament històric sintètic','city_hall',$2) returning id",[T3,A])).rows[0].id;
  assert.equal((await ask(db,A,'select public.pot_signar_com_organitzacio($1,$2) x',[legacy,T3])).rows[0].x,false);
  await ask(db,B,'select public.registra_domini_ajuntament($1,$2,$3)',[legacy,'ajuntament.example',evidence]);
  await assert.rejects(ask(db,C,'select public.sollicita_acreditacio_ajuntament($1,$2)',[legacy,evidence]),/SDP-AJT-002/);
  const legacyClaim=(await ask(db,A,'select (public.sollicita_acreditacio_ajuntament($1,$2)).id id',[legacy,evidence])).rows[0].id;
  assert.equal((await db.query('select claimed from public.organizations where id=$1',[legacy])).rows[0].claimed,false);
  await ask(db,B,'select public.resol_acreditacio_ajuntament($1,true,$2)',[legacyClaim,evidence]);
  assert.equal((await ask(db,A,'select public.pot_signar_com_organitzacio($1,$2) x',[legacy,T3])).rows[0].x,true);
  assert.deepEqual((await db.query("select user_id from public.organization_memberships where organization_id=$1 and role='owner'",[legacy])).rows,[{user_id:A}]);
  assert.equal(Number((await db.query("select count(*) n from private.ajuntament_auditoria where organization_id=$1 and accio='regularitzada'",[legacy])).rows[0].n),1);
 });
 await t.test('auditoria sobreviu a baixa del revisor sense bloquejar-la',async()=>{
  const before=Number((await db.query('select count(*) n from private.ajuntament_auditoria')).rows[0].n);
  await db.query('delete from auth.users where id=$1',[B]);
  assert.equal(Number((await db.query('select count(*) n from private.ajuntament_auditoria')).rows[0].n),before);
  assert.ok(Number((await db.query('select count(*) n from private.ajuntament_auditoria where actor_id is null')).rows[0].n)>0);
 });
 }finally{await db.close();}
});
// M3-01: la sonda prèvia i el tancament de la vinyeta del README, sobre el catàleg sense 20261122160000.
test(`R32.42 ajuntament · ${engine} · reclamació genèrica anterior a la migració`,{timeout:180000},async t=>{
 const readme=llegixReadme(readFileSync(new URL('../supabase/README.md',import.meta.url),'utf8'));
 const sonda=(readme.consultesPerFitxer.get(MIG)??[]).find(c=>c.etiqueta==='previa'&&/public\.organization_claims/.test(c.sql))?.sql;
 assert.ok(sonda,'la vinyeta del README porta la sonda prèvia de només lectura');
 const tancament=readme.bullets.find(b=>b.fitxer===MIG)?.text.replace(/\s+/g,' ').match(/`(update public\.organization_claims [^`]*\bid in \(…\);)`/)?.[1];
 assert.ok(tancament,'la vinyeta del README porta el tancament de les reclamacions pendents');
 const db=await database();
 try{
  const plan=creaPlaMigracions();plan.migrations=plan.migrations.filter(m=>m.file!==MIG);
  // The test removes the city-hall migration to exercise its genuine preimage.
  // Project only its declared absent tables; do not relax the deployment SQL.
  const pending132=plan.migrations.find(m=>m.file==='20261123180000_r3252_indexs_suport_fk_verificats.sql');
  const index132=plan.migrations.indexOf(pending132);
  assert.ok(index132>=0,'la fixture necessita la 132 canònica');
  const before132={...plan,migrations:plan.migrations.slice(0,index132)};
  await db.exec(generaSql(before132,null,{advisoryLock:false}));
  const partial132=await projecta132PerFixture(db,{absentRelations:['private.ajuntament_auditoria','private.ajuntament_dominis_oficials']});
  // Fixture-only SQL has no canonical migration ledger entry.
  await db.exec(partial132.sql);
  const after132={...plan,migrations:plan.migrations.slice(index132+1)};
  // Direct source execution avoids claiming a full ledger for this partial fixture.
  for(const m of after132.migrations)await db.exec(m.sql);
  await db.exec(JWT);
  await db.query("insert into public.towns(id,slug,name) values($1,'r3242-reclamacions-antigues','Poble sintètic de reclamacions antigues')",[T4]);
  for(const [u,email]of[[A,'secretaria@ajuntament.example'],[B,'revisora@example.invalid'],[X,'antiga@example.invalid']]) await db.query("insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)values($1,$2,now(),$3)",[u,email,{full_name:'Persona sintètica',tenant_id:T4,accepta_rgpd:true}]);
  await db.query("insert into public.user_platform_roles(user_id,role)values($1,'superadmin') on conflict(user_id)do update set role='superadmin'",[B]);
  // Dos ajuntaments històrics es queden sense owner (la membresia desapareix) i reben una reclamació genèrica cadascun.
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[X]);
  const orgs=[];
  for(const slug of['ajuntament-reclamacio-oberta','ajuntament-reclamacio-tancada']) orgs.push((await db.query("insert into public.organizations(tenant_id,slug,name,kind,created_by)values($1,$2,'Ajuntament històric sintètic','city_hall',$3) returning id",[T4,slug,X])).rows[0].id);
  await db.query("select set_config('request.jwt.claim.sub','',false)");
  await db.query('delete from public.organization_memberships where organization_id=any($1::uuid[])',[orgs]);
  const reclamacions=[];
  for(const o of orgs) reclamacions.push((await ask(db,A,'select (public.sollicita_reclamacio($1,$2)).id id',[o,evidence])).rows[0].id);
  const [oberta,tancada]=reclamacions;
  assert.deepEqual((await db.query(sonda)).rows.map(r=>r.id).sort(),[...reclamacions].sort(),'la sonda veu les dues reclamacions pendents');
  await db.query(tancament.replace('(…)','($1)'),[tancada]);
  assert.deepEqual((await db.query(sonda)).rows.map(r=>r.id),[oberta],'la sentència del README només tanca la reclamació indicada');
  await db.exec(migration);
  await db.exec("set test.aal='aal2'");
  for(const o of orgs) await ask(db,B,'select public.registra_domini_ajuntament($1,$2,$3)',[o,'ajuntament.example',evidence]);
  const estat=async c=>(await db.query('select estat from public.organization_claims where id=$1',[c])).rows[0].estat;
  // v1.2.23 · M3-01 (ordre del Mestre 261123) · Sense tancar-la abans, la via genèrica no l'aprova mai, però una
  // superadmin la pot rebutjar amb rastre; després, la mateixa persona pot demanar l'acreditació institucional.
  await t.test('sense tancar abans, la via genèrica no l’aprova, una superadmin la rebutja amb rastre i l’acreditació continua',async()=>{
   await assert.rejects(ask(db,A,'select public.sollicita_acreditacio_ajuntament($1,$2)',[orgs[0],evidence]),/idx_claims_una_pendent/);
   await assert.rejects(ask(db,B,'select public.resol_reclamacio($1,true)',[oberta]),/SDP-AJT-020/);
   await assert.rejects(ask(db,B,'select public.resol_acreditacio_ajuntament($1,false,$2)',[oberta,evidence]),/SDP-AJT-012/);
   await assert.rejects(ask(db,A,'select public.resol_reclamacio($1,false)',[oberta]),/SDP-CLAIM-010/);
   assert.equal(await estat(oberta),'pendent');
   assert.equal(Number((await db.query("select count(*) n from public.organization_memberships where organization_id=$1",[orgs[0]])).rows[0].n),0);
   await ask(db,B,'select public.resol_reclamacio($1,false)',[oberta]);
   assert.equal(await estat(oberta),'rebutjada');
   assert.deepEqual((await db.query("select actor_id,accio from private.ajuntament_auditoria where claim_id=$1",[oberta])).rows,[{actor_id:B,accio:'reclamacio_generica_rebutjada'}]);
   assert.equal((await db.query('select claimed from public.organizations where id=$1',[orgs[0]])).rows[0].claimed,false);
   await assert.rejects(ask(db,B,'select public.resol_reclamacio($1,false)',[oberta]),/SDP-CLAIM-011/);
   const nova=(await ask(db,A,'select (public.sollicita_acreditacio_ajuntament($1,$2)).id id',[orgs[0],evidence])).rows[0].id;
   await assert.rejects(ask(db,B,'select public.resol_reclamacio($1,false)',[nova]),/SDP-AJT-020/);
   await ask(db,B,'select public.resol_acreditacio_ajuntament($1,true,$2)',[nova,evidence]);
   assert.equal((await db.query('select claimed from public.organizations where id=$1',[orgs[0]])).rows[0].claimed,true);
   assert.deepEqual((await db.query("select user_id from public.organization_memberships where organization_id=$1 and role='owner'",[orgs[0]])).rows,[{user_id:A}]);
  });
  await t.test('tancada abans amb la sentència del README, l’acreditació institucional continua',async()=>{
   const nova=(await ask(db,A,'select (public.sollicita_acreditacio_ajuntament($1,$2)).id id',[orgs[1],evidence])).rows[0].id;
   await ask(db,B,'select public.resol_acreditacio_ajuntament($1,true,$2)',[nova,evidence]);
   assert.equal((await db.query('select claimed from public.organizations where id=$1',[orgs[1]])).rows[0].claimed,true);
   assert.deepEqual((await db.query("select user_id from public.organization_memberships where organization_id=$1 and role='owner'",[orgs[1]])).rows,[{user_id:A}]);
   assert.equal(await estat(tancada),'rebutjada');
  });
 }finally{await db.close();}
});
