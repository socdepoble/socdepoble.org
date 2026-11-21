// Executable reproduïble. Genera còpies efímeres dels 3 oracles, només adapta bootstrap.
// Les assertions de servidor 18.6 i concurrència R21.4 s'executen nativament sense canvis.
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const engine=process.env.SDP_R32_25_ENGINE||'native';
if(!['native','pglite'].includes(engine))throw Error('motor desconegut');
const evidence=process.env.SDP_R32_25_EVIDENCE||'/tmp/r3225-s2-evidence';await mkdir(evidence,{recursive:true});
const names=['missatgeria-r21-2-postgres.test.mjs','xat-propi-r21-4-postgres.test.mjs','r31-push-sessio-postgres.test.mjs'];
const report=[];
for(const name of names){
 const source=await readFile(path.join(root,'tests',name),'utf8');let s=source;
 const header="import {upgrade as r3225Upgrade,install as r3225Install} from './fixtures/r32_25-s2-upgrade.mjs';\n";
 const injections=[];const replace=(old,next,label)=>{if(!s.includes(old))throw Error(name+': punt no trobat '+label);s=s.replace(old,()=>next);injections.push({label,old,next});};
 if(name.startsWith('missatgeria')){
  replace("'./fixtures/postgres-local.mjs'","'./fixtures/r32_25-postgres-local.mjs'",'socketcurt');
  replace("    await db.query('insert into public.towns", "    await r3225Upgrade(db,MIGRATIONS);\n    await db.query('insert into public.towns",'dependències+R32.25 abansfixtures');
 }else if(name.startsWith('xat-propi')){
  replace("'./fixtures/postgres-local.mjs'","'./fixtures/r32_25-postgres-local.mjs'",'socketcurt');
  replace('    await db.query("insert into public.towns', '    await r3225Upgrade(db,MIGRATIONS);\n    await db.query("insert into public.towns','dependències+R32.25 abansfixtures');
  replace('await db.query(migration); await db.query(migration);','await db.query(migration); await db.query(migration); await r3225Install(db);','reinstal·lar desprésoraclepreimatgepropi');
 }else{
  const from=s.indexOf('  const { PGlite }'),to=s.indexOf('  const com = async');if(from<0||to<0)throw Error('bootstrapR31 absent');
  const old=s.slice(from,to);
  const next=`  ${engine==='native'?"const {createRequire}=await import('node:module');createRequire(import.meta.resolve('embedded-postgres'))('pg').types.setTypeParser(20,Number);":''}\n  const {database:r3225Database,bootstrap:r3225Bootstrap,id:r3225Id}=await import('./fixtures/r32_25-push.mjs');\n  const db=await r3225Database('${engine}');t.after(()=>db.close());await r3225Bootstrap(db);\n  await db.exec(\`create or replace function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$\`);\n  await db.query("insert into public.towns(id,slug,name)values($1,'r31-adapter','Poble sintètic')",[r3225Id(1)]);\n  for(const who of[A,B])await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)values($1,$2,now(),$3)',[who,who+'@example.invalid',{tenant_id:r3225Id(1),accepta_rgpd:true,full_name:'R31 sintètic'}]);\n  await db.query('insert into auth.sessions(id,user_id)values($1,$2),($3,$2),($4,$5)',[SA,A,SA2,SB,B]);\n  await db.query("insert into private.ajustos(clau,valor)values('push_xat_actiu','si')on conflict(clau)do update set valor=excluded.valor");\n`;
  replace(old,next,'plataforma+domini real substitueixbootstrapmínimR31');
  replace('  await db.exec(newSql);','  await db.exec(newSql); await r3225Install(db);','R32.25 desprésprimerR31');
  replace('    await db.exec(newSql);','    await db.exec(newSql); await r3225Install(db);','R32.25 desprésreapplyR31');
 }
 if(engine==='pglite'&&!name.startsWith('r31')){
  replace("'./fixtures/r32_25-postgres-local.mjs'","'./fixtures/r32_25-pglite-pg.mjs'",'transportPGliteseqüencialsensemockSQL');
  if(name.startsWith('missatgeria')){
   replace("    assert.equal(engine.number, '180006');","    t.diagnostic('PGlite real '+engine.number+'; la comprovació180006 sols es fa al natiu');",'comprovacióservidorseparadanativa');
   replace('PostgreSQL 18.6 real','PGlite funcional seqüencial (servidor18.6 validat en suite nativa)','títolhonest');
  }else{
   replace(`    assert.equal((await db.query("select current_setting('server_version_num') as v")).rows[0].v,'180006');`,"    t.diagnostic('PGlite funcional; comprovació180006 i sessionsindependents sols en suite nativa');",'comprovacióservidorseparadanativa');
   const from=s.indexOf('      const one=await cluster.connect(),two=await cluster.connect();'),to=s.indexOf('own=results[0].rows[0].id;',from);
   const old=s.slice(from,to),next="      const results=[await create(db,ALICE),await create(db,ALICE)];";
   replace(old,next,'domainidentitatseqüencial;assertionsadvisoryreservadesnatiu');
   replace('Dos dispositius creen alhora un únic directe d’un sol propietari','Dues crides seqüencials creen un únic directe (concurrència només nativa)','títolhonestidentitat');
   replace("      const one=await cluster.connect(),two=await cluster.connect();\n      await Promise.all([send(one,ALICE,own,id(103)),send(two,ALICE,own,id(104))]);","      await send(db,ALICE,own,id(103));await send(db,ALICE,own,id(104));",'enviamentsseqüencialsmateixesassertionsdomini');
   replace('Enviaments concurrents del mateix compte acaben amb llegit=ultim_seq','Enviaments seqüencials del mateix compte acaben amb llegit=ultim_seq','títolhonestenviament');
   replace('sobre PG18.6','sobre PGlite funcional (sessionsindependents sols al natiu)','títolhonest');
  }
 }
 s=header+s;
 const generated=path.join(root,'tests','.r32_25-adapted-'+engine+'-'+name);
 const hash=x=>createHash('sha256').update(x).digest('hex');
 await writeFile(generated,s);await writeFile(path.join(evidence,engine+'-'+name+'.injections.json'),JSON.stringify({source:name,sourceSha256:hash(source),adaptedSha256:hash(s),assertions:engine==='native'?'originals intactes':'mateixes assertions de domini; servidor/concurrència només nativa, exclusions detallades',injections},null,2));
 const out=await new Promise(resolve=>{const c=spawn(process.execPath,['--test',generated],{cwd:root,env:{...process.env,SDP_PGLITE_MODULE:process.env.SDP_PGLITE_MODULE||'/tmp/sdp_r32_25_pglite/pglite/dist/index.js'},stdio:['ignore','pipe','pipe']});let log='';c.stdout.on('data',b=>log+=b);c.stderr.on('data',b=>log+=b);c.on('exit',code=>resolve({code,log}));});
 await rm(generated,{force:true});await writeFile(path.join(evidence,engine+'-'+name+'.log'),out.log);report.push({name,engine,code:out.code,sourceSha256:hash(source),adaptedSha256:hash(s)});process.stdout.write(out.log);
}
await writeFile(path.join(evidence,engine+'-report.json'),JSON.stringify(report,null,2));
if(report.some(x=>x.code!==0))process.exitCode=1;
