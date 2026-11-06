/** Full real migration catalogue and shipping bootstrap; synthetic auth users
 * only. No replacement for es_superadmin, RLS, chat triggers or install gates. */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {creaPlaMigracions,generaSql,preparaHidratacio,ROOT} from '../../tooling/node0/hidrata-postgres-node0.mjs';
export async function creaFixtureR20b(){
 const input=process.env.SDP_PGLITE_MODULE;if(!input)throw Error('Explicit local PGlite required');
 const url=input.startsWith('file:')?new URL(input):pathToFileURL(path.resolve(input));
 const {PGlite}=await import(url.href),{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',url));
 const initial=new PGlite();await initial.exec('CREATE DATABASE socdepoble_node0');const image=await initial.dumpDataDir('none');await initial.close();
 const pg=new PGlite({database:'socdepoble_node0',loadDataDir:image,extensions:{pgcrypto}}),plan=creaPlaMigracions(),hydration=await preparaHidratacio();
 const baseline=plan.migrations.filter(m=>m.version<'2611052345');
 if(baseline.length!==76)throw Error('Expected R7 baseline76 migrations');
 await pg.exec(generaSql({...plan,migrations:baseline},hydration,{advisoryLock:false}));
 for(const name of ['auth-node0.sql','backend-node0.sql'])await pg.exec(fs.readFileSync(path.join(ROOT,'tooling/node0',name),'utf8'));
 const installed=new Set(baseline.map(m=>m.version)),tenantId=hydration.municipalityId;
 async function phase(versions){
   for(const v of versions)installed.add(v);
   // Run the shipping ledger checker against every actually installed source.
   await pg.exec(generaSql({...plan,migrations:plan.migrations.filter(m=>installed.has(m.version))},null,{advisoryLock:false}));
 }
 async function as(uid,sql,params=[],{role='authenticated',aal='aal2'}={}){
   await pg.exec('BEGIN');try{
     await pg.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[uid??'',JSON.stringify({...(uid?{sub:uid}:{}),role,aal})]);
     await pg.exec('SET LOCAL ROLE '+role);
     const r=await pg.query(sql,params);await pg.exec('COMMIT');return r.rows;
   }catch(e){await pg.exec('ROLLBACK;RESET ROLE');throw e;}
 }
 async function person(name,{consent=true,tenant=tenantId,admin=false}={}){
   const id=randomUUID();await pg.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)',[id,`${name}@example.invalid`,{tenant_id:tenant,name,rgpd:true}]);
   if(consent)await as(id,"SELECT public.registra_consentiment('rgpd_acepta',null)");
   const norms=(await pg.query('SELECT private.versio_normes_vigent() AS version')).rows[0].version;
   await as(id,'SELECT public.accepta_normes_convivencia($1)',[norms]);
   if(admin)await pg.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin') ON CONFLICT(user_id) DO UPDATE SET role='superadmin'",[id]);
   return id;
 }
 async function organization(owner,slug){return (await as(owner,"SELECT public.create_organization($1,'group',$2,$3,'','',null) AS value",[tenantId,'Synthetic '+slug,slug]))[0].value.id;}
 return {pg,plan,tenantId,phase,as,person,organization,async count(){return (await pg.query('SELECT count(*)::integer AS n FROM node0.schema_migrations')).rows[0].n;},close:()=>pg.close()};
}
