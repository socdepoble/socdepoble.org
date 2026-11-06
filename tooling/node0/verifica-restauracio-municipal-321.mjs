#!/usr/bin/env node
/** Executable clean restore rehearsal. Three logical copies on this host do
 * not establish two physical media or an offsite location: report those apart. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {creaPlaMigracions,ROOT,uuidMunicipi,SHA256_ZIP_CANONIC} from './hidrata-postgres-node0.mjs';
import {llegeixZipNodeZero} from './paquet-opendata-node0.mjs';
import {llegeixPaquetOpenData} from '../../src/data/importaMunicipiOpenData.js';
const sha=value=>createHash('sha256').update(value).digest('hex');
const stable=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(k=>[k,item[k]])):item);

export async function verificaRestauracioMunicipal321({modulePath,directory}={}){
  if(typeof modulePath!=='string'||!modulePath||typeof directory!=='string'||!path.isAbsolute(directory)||!path.resolve(directory).startsWith('/tmp/'))throw new TypeError('Explicit local PGlite module and /tmp evidence directory required.');
  const moduleURL=modulePath.startsWith('file:')?new URL(modulePath):pathToFileURL(path.resolve(modulePath));
  if(moduleURL.protocol!=='file:'||moduleURL.search||moduleURL.hash)throw new TypeError('Local module required.');
  const {PGlite}=await import(moduleURL.href),{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',moduleURL));
  const archive=await llegeixZipNodeZero({root:ROOT,sha256Esperat:SHA256_ZIP_CANONIC}),copies=[];
  // Exclusive files prevent replacing an older rehearsal or following a link.
  await fs.mkdir(directory,{recursive:true});
  for(const label of ['primary','backup','offsite-simulation']){
    const file=path.join(directory,`${label}-${randomUUID()}.zip`);
    await fs.writeFile(file,archive,{flag:'wx',mode:0o600});
    const bytes=await fs.readFile(file);if(sha(bytes)!==SHA256_ZIP_CANONIC)throw Error('copy_integrity_failed');
    copies.push({label,file,sha256:sha(bytes),bytes:bytes.length});
  }
  const plan=creaPlaMigracions(),restorations=[];
  for(const copy of copies){
    const bytes=new Uint8Array(await fs.readFile(copy.file));
    const parsed=await llegeixPaquetOpenData(bytes,{sha256Esperat:SHA256_ZIP_CANONIC});
    const db=new PGlite({extensions:{pgcrypto}}),tenant=uuidMunicipi(parsed.slug),actor=randomUUID();
    try{
      await db.exec(plan.bootstrap);
      for(const migration of plan.migrations)await db.exec(migration.sql);
      await db.query('INSERT INTO public.towns(id,slug,name) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[tenant,parsed.slug,parsed.municipi.nom]);
      await db.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)',[actor,`${actor}@example.invalid`,{tenant_id:tenant,name:'Rehearsal synthetic administrator',rgpd:true}]);
      await db.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin') ON CONFLICT(user_id) DO UPDATE SET role='superadmin'",[actor]);
      await db.exec('BEGIN');
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[actor,JSON.stringify({sub:actor,role:'authenticated',aal:'aal2'})]);
      await db.exec('SET LOCAL ROLE authenticated');
      const first=(await db.query('SELECT public.importa_municipi_open_data($1,$2) AS report',[tenant,parsed.lot])).rows[0].report;
      const replay=(await db.query('SELECT public.importa_municipi_open_data($1,$2) AS report',[tenant,parsed.lot])).rows[0].report;
      await db.exec('COMMIT');
      const rows=(await db.query('SELECT coleccio,id,document FROM private.municipi_opendata_documents ORDER BY coleccio,id')).rows;
      restorations.push({label:copy.label,cleanDatabase:true,first,replay,rows:rows.length,dataSha256:sha(stable(rows)),postgres:(await db.query('SELECT version() AS version')).rows[0].version});
    }finally{await db.close();}
  }
  if(new Set(restorations.map(r=>r.dataSha256)).size!==1)throw Error('restore_data_drift');
  const tampered=new Uint8Array(archive);tampered[0]^=1;
  let tamperRejected=false;try{await llegeixPaquetOpenData(tampered,{sha256Esperat:SHA256_ZIP_CANONIC});}catch{tamperRejected=true;}
  if(!tamperRejected)throw Error('tampered_archive_accepted');
  const report={version:'sdp.restore-rehearsal.r13.v1',copies,restorations,tamperRejected,
    migrations:plan.migrations.map(({file,sha256})=>({file,sha256})),
    evidence:{logicalCopies:3,verifiedMedia:1,verifiedOffsite:0,physical321Satisfied:false,nativePostgres:false,productionWrites:0},
    limitation:'PostgreSQL17 WASM with synthetic Auth infrastructure. Three verified local copies; two physical media and an offsite copy are not evidenced.'};
  await fs.writeFile(path.join(directory,'restore-report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const directory=process.argv[2];
  verificaRestauracioMunicipal321({modulePath:process.env.SDP_PGLITE_MODULE,directory}).then(report=>console.log(JSON.stringify(report))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
