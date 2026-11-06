/** Disposable canonical PostgreSQL fixture. No production DB, users or secrets. */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {creaAuthNodeZero,hashSessioNodeZero,NODE0_AUTH_TENANT} from '../tooling/node0/auth-node0.mjs';
import {creaBackendPrivatNodeZero} from '../tooling/node0/backend-node0.mjs';
import {creaPlaMigracions,preparaHidratacio,generaSql,ROOT} from '../tooling/node0/hidrata-postgres-node0.mjs';
import {creaRepositoriPosse} from '../tooling/node0/posse/repositori-posse.mjs';
const H='1'.repeat(64),ARTICLE='2'.repeat(64),PASS='Disposable POSSE fixture 2026 952!';
export async function creaFixturePosse({modulePath=process.env.SDP_PGLITE_MODULE,exclou=[]}={}){
 if(!modulePath)throw Error('SDP_PGLITE_MODULE explicit disposable module required');
 const moduleURL=modulePath.startsWith('file:')?new URL(modulePath):pathToFileURL(path.resolve(modulePath));
 const {PGlite}=await import(moduleURL.href),{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',moduleURL));
 const initial=new PGlite();await initial.exec('CREATE DATABASE socdepoble_node0');const image=await initial.dumpDataDir('none');await initial.close();
 const pg=new PGlite({database:'socdepoble_node0',loadDataDir:image,extensions:{pgcrypto}});let queue=Promise.resolve(),lastError;
 const db={verificaRol:async()=>true,verificaRolAutenticador:async()=>true,query(sql,options={}){
  assert.equal(options.privateValues,true,'request SQL must be marked byte-private');
  const task=queue.then(async()=>{try{
   const script=sql.startsWith('BEGIN;')?`SET ROLE node0_authenticator;\n${sql}\nRESET ROLE;`:`BEGIN;SET LOCAL ROLE node0_authenticator;\n${sql}\nCOMMIT;`;
   const result=await pg.exec(script);lastError=null;const row=[...result].reverse().find(x=>x.rows?.length)?.rows[0];return row?Object.values(row)[0]:null;
  }catch(error){lastError={code:error.code,message:error.message};await pg.exec('ROLLBACK;RESET ROLE;');throw Object.assign(Error('fixture_database_failed'),{sqlState:error.code});}});queue=task.catch(()=>{});return task;
 }};
 try{
  const plan=creaPlaMigracions();
  // Versions left out to build an earlier reviewed ledger (tests/node0-posse-sql.cases.mjs).
  if(exclou.length)plan.migrations=plan.migrations.filter(m=>!exclou.includes(m.version));
  await pg.exec(generaSql(plan,await preparaHidratacio(),{advisoryLock:false}));
  for(const name of ['auth-node0.sql','backend-node0.sql','posse/posse-ledger.sql'])await pg.exec(fs.readFileSync(path.join(ROOT,'tooling/node0',name),'utf8'));
  const deliveries=[],auth=creaAuthNodeZero({db,rateSecret:Buffer.alloc(32,0x47),mailTransport:async m=>deliveries.push(m)}),backend=creaBackendPrivatNodeZero({db,tenantId:NODE0_AUTH_TENANT});
  const req=(body={},person)=>({headers:{origin:'https://socdepoble.cat','content-type':'application/json',...(person?{cookie:person.cookie,'x-sdp-expected-actor':person.id}:{})},body,remoteAddress:'127.0.0.1'});
  async function person(label){
   const email=`r11-${label}@example.invalid`,version=(await auth.handle('policy')).body.privacy.version;
   assert.equal((await auth.handle('register',req({email,password:PASS,metadata:{accepta_rgpd:true,versio_politica:version,tenant_id:NODE0_AUTH_TENANT,full_name:'Synthetic '+label}}))).status,202);
   assert.equal((await auth.handle('verify-email',req({token:deliveries.find(m=>m.to===email).token,password:PASS,metadata:{accepta_rgpd:true,versio_politica:version}}))).status,200);
   const response=await auth.handle('login',req({email,password:PASS}));assert.equal(response.status,200);
   const p={id:response.body.user.id,cookie:response.headers['Set-Cookie'].split(';')[0]};
   const norms=(await auth.handle('policy')).body.normsVersion;assert.equal((await auth.handle('norms',req({accept:true,version:norms},p))).status,200);return p;
  }
  const alice=await person('alice'),bob=await person('bob'),orgs={};
  for(const slug of ['socdepoble','rentonar','oli-comercial']){
   const result=await backend.handle('createOrganization',req({organization:{name:'Synthetic '+slug,slug,kind:'group',town_name:'La Torre de les Maçanes'}},alice));assert.equal(result.status,201,JSON.stringify(result));orgs[slug]=result.body;
  }
  for(const role of ['socdepoble','rentonar'])await pg.query('INSERT INTO node0_posse.institutional_authors(tenant_id,role,organization_id,proof_sha256) VALUES($1,$2,$3,$4)',[NODE0_AUTH_TENANT,role,orgs[role].id,H]);
  const remoteToken=Buffer.alloc(40,0x67).toString('base64url'),tokenSha256=createHash('sha256').update(remoteToken).digest('hex');
  await pg.query("INSERT INTO node0_posse.remote_bindings(tenant_id,owner_org_id,remote_account,secret_ref,proof_sha256,verified_at,expires_at,credential_sha256,scopes) VALUES($1,$2,'https://mastodont.cat/users/depoble','credentials/depoble',$3,clock_timestamp(),clock_timestamp()+interval '1 hour',$4,$5)",[NODE0_AUTH_TENANT,orgs.socdepoble.id,H,tokenSha256,['read:accounts','write:statuses','write:media']]);
  const repoFor=p=>creaRepositoriPosse({db,sessionHash:hashSessioNodeZero({cookie:p.cookie}),expectedActor:p.id,tenantId:NODE0_AUTH_TENANT});const repo=repoFor(alice);
  const config={id:randomUUID(),tenantId:NODE0_AUTH_TENANT,ownerUserId:null,ownerOrgId:orgs.socdepoble.id,remoteAccountIdentity:'https://mastodont.cat/users/depoble',secretRef:'credentials/depoble',policy:{excludeCommercial:true,excludedSections:['mercat']},linkedAuthors:['socdepoble','rentonar'].map(role=>({kind:'entity',id:orgs[role].id,enabled:true})),defaultTags:['SocDePoble'],enabled:true,quotaDaily:100,cadenceSeconds:1};
  const bridge=await repo.configureBridge(config);
  async function source({id=randomUUID(),author='socdepoble',section='mur',visibility='public',commercial=false,certified=true,title='Article públic sintètic',summary='Resum de la publicació rural',tags=[],...extra}={}){
   const result=await backend.handle('appendSectionSubmissionNetworkOnly',req({submission:{id,sectionId:section,title,description:summary,payload:{visibility,tags,...extra},actor:{tipus:'entitat',id:orgs[author].id}}},alice));assert.equal(result.status,201,JSON.stringify(result));
   const revision=(await pg.query('SELECT node0_posse.source_revision(s) AS rev FROM public.section_submissions s WHERE id=$1',[id])).rows[0].rev;
   const canonicalUrl='https://socdepoble.org/'+section+'/'+id;
   if(certified)await pg.query("INSERT INTO node0_posse.publication_certifications(tenant_id,section_id,record_id,source_revision,canonical_uri,article_sha256,proof_sha256,public_audience,commercial,verified_at,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,true,$8,clock_timestamp(),clock_timestamp()+interval '1 hour') ON CONFLICT(tenant_id,section_id,record_id) DO UPDATE SET source_revision=EXCLUDED.source_revision,canonical_uri=EXCLUDED.canonical_uri,article_sha256=EXCLUDED.article_sha256,commercial=EXCLUDED.commercial,verified_at=EXCLUDED.verified_at,expires_at=EXCLUDED.expires_at,revoked_at=NULL",[NODE0_AUTH_TENANT,section,id,revision,canonicalUrl,ARTICLE,H,commercial]);
   return{recordId:{tenantId:NODE0_AUTH_TENANT,sectionId:section,id},recordRevision:revision,canonicalUrl};
  }
  async function observe(row,{id='7001',links=[row.canonicalUrl],draftHash=null,account='https://mastodont.cat/users/depoble'}={}){
   await pg.query("INSERT INTO node0_posse.remote_observations(remote_account,external_status_id,external_url,links,public_audience,draft_hash,proof_sha256,verified_at) VALUES($1,$2,$3,$4,true,$5,$6,clock_timestamp()) ON CONFLICT(remote_account,external_status_id) DO UPDATE SET links=EXCLUDED.links,draft_hash=EXCLUDED.draft_hash,revoked_at=NULL",[account,id,'https://mastodont.cat/@depoble/'+id,links,draftHash,H]);
  }
  return{pg,db,auth,backend,alice,bob,orgs,bridge,config,repo,repoFor,source,observe,req,remoteToken,tokenSha256,tenantId:NODE0_AUTH_TENANT,articleSha256:ARTICLE,get lastError(){return lastError;},async close(){auth.close();await queue;await pg.close();}};
 }catch(error){await pg.close();throw error;}
}
