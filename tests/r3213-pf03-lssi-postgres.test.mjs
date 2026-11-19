import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {creaPlaMigracions,generaSql,preparaHidratacio} from '../tooling/node0/hidrata-postgres-node0.mjs';
import {startLocalPostgres} from './fixtures/postgres-local.mjs';
import {estatCrdtRuralBuit,canviaCrdtRural,fusionaCrdtRural,preparaSincronitzacioCrdtRural,registraAckCrdtRural,compactaCrdtRural} from '../src/data/crdtRural.js';
import {canonitzaJsonJcs} from '../src/data/federacio/portabilitatFediversity.js';
import {filaDenunciaDiligent} from '../src/data/moderacio/denunciesDiligents.js';
const SQL=readFileSync(new URL('../supabase/snippets/r32_13_pf03_crdt_ack_i_lssi_denuncies.sql',import.meta.url),'utf8');
const id=n=>`32130000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const A=id(1),B=id(2),ADMIN=id(3),C=id(4),TOWN='ac3bec76-255b-5ca2-8886-28fcceab4267',AUTH='https://replica.example';
const ACK='select public.confirma_captura_crdt_rural($1,$2,$3,$4,$5) r';
const REPORT='select public.registra_denuncia_diligent($1,$2,$3,$4) r';
const REVIEW='select public.revisa_denuncia_diligent($1,$2,$3,$4,$5,$6) r';
const code=c=>e=>e.code===c;
const note=(content='hello')=>({title:'Fixture',content,slug:'fixture'});
const first=canviaCrdtRural(estatCrdtRuralBuit(),{id:'n',replica:'A',comptador:1,nota:note()});
const deleted=fusionaCrdtRural(first,canviaCrdtRural(first,{id:'n',replica:'A',comptador:2,elimina:true}));
const params=p=>[TOWN,p.requestId,canonitzaJsonJcs(p.crdt),p.sha256,JSON.stringify(p.frontera)];
const ack=r=>({schema:'sdp.rural.remote-ack.v1',...r,autoritat:AUTH});
async function begin(db,who=A,aal='aal2',ip='192.0.2.11'){
 await db.query('begin isolation level read committed');
 await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true),set_config('request.headers',$3,true)",[who??'',JSON.stringify({sub:who,role:who?'authenticated':'anon',aal}),JSON.stringify({'x-real-ip':ip})]);
 await db.query(`set local role ${who?'authenticated':'anon'}`);
}
async function as(db,who,sql,values=[],aal='aal2',ip){
 await begin(db,who,aal,ip);
 try{const r=await db.query(sql,values);await db.query('commit');return r.rows;}
 catch(e){await db.query('rollback');throw e;}
}
async function blocked(db,holder,waiter){
 const deadline=Date.now()+4000;
 while(Date.now()<deadline){if((await db.query('select $1=any(pg_blocking_pids($2)) b',[holder,waiter])).rows[0].b)return;await new Promise(r=>setImmediate(r));}
 assert.fail('No observed independent-session blocking barrier');
}
async function suite(t,db,exec,cluster){
 const plan=creaPlaMigracions();await exec(generaSql(plan,await preparaHidratacio(),{advisoryLock:false}));
 for(const who of[A,B,ADMIN,C]){
  await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[who,`${who}@example.invalid`,{full_name:'R3213 LAB',tenant_id:TOWN,accepta_rgpd:true}]);
  await db.query('insert into private.normes_acceptades(usuari_id,versio) values($1,private.versio_normes_vigent()) on conflict do nothing',[who]);
  await db.query('insert into public.town_memberships(town_id,user_id) values($1,$2) on conflict do nothing',[TOWN,who]);
 }
 await db.query("insert into public.user_platform_roles(user_id,role) values($1,'superadmin') on conflict do nothing",[ADMIN]);
 await exec(SQL);t.diagnostic(JSON.stringify({sqlSHA256:createHash('sha256').update(SQL).digest('hex'),native:!!cluster}));
 for(let n=0;n<25;n++)await db.query("insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,payload,visibility) values($1,$2,$3,'mur','LAB',$4,'public')",[id(100+n),TOWN,A,{content:'Fixture',status:'published',visibility:'public'}]);
 await t.test('PF03 durable exact capture, replay keeps original clock; stale payload conflicts',async()=>{
  const p=preparaSincronitzacioCrdtRural(deleted,'initial'),r=(await as(db,A,ACK,params(p)))[0].r;
  assert.deepEqual((await as(db,A,ACK,params(p)))[0].r,r);
  assert.equal((await db.query('select count(*)::int n from private.r3213_crdt_captures')).rows[0].n,1);
  await assert.rejects(as(db,A,ACK,params(preparaSincronitzacioCrdtRural(first,'initial'))),code('40001'));
  await assert.rejects(as(db,null,ACK,params(p)),code('42501'));
  const divergent=canviaCrdtRural(estatCrdtRuralBuit(),{id:'n',replica:'A',comptador:1,nota:note('Different bytes, same DOT')});
  await assert.rejects(as(db,A,ACK,params(preparaSincronitzacioCrdtRural(divergent,'equivocation'))),code('40001'));
  const mixed=['a','Z','_','-','A'].map(replica=>canviaCrdtRural(estatCrdtRuralBuit(),{id:'mixed-'+replica,replica,comptador:3,nota:note()})).reduce(fusionaCrdtRural,estatCrdtRuralBuit());
  const mp=preparaSincronitzacioCrdtRural(mixed,'mixed-ascii-frontier');assert.deepEqual((await as(db,A,ACK,params(mp)))[0].r.frontera,mp.frontera);
  const bad=params(p);bad[3]='0'.repeat(64);await assert.rejects(as(db,A,ACK,bad),code('22023'));
  await assert.rejects(as(db,A,'select canonical_capture from private.r3213_crdt_captures'),code('42501'));
 });
 await t.test('PF03 owner and tenant scopes stay separate even with the same request ID and DOT',async()=>{
  const p=preparaSincronitzacioCrdtRural(deleted,'initial');
  const aBefore=(await db.query('select canonical_capture,capture_sha256,confirmed_at from private.r3213_crdt_captures where owner_id=$1 and request_id=$2',[A,'initial'])).rows;
  const bState=canviaCrdtRural(estatCrdtRuralBuit(),{id:'n',replica:'A',comptador:1,nota:note('B private bytes')});
  await as(db,B,ACK,params(preparaSincronitzacioCrdtRural(bState,'initial')));
  assert.deepEqual((await db.query('select canonical_capture,capture_sha256,confirmed_at from private.r3213_crdt_captures where owner_id=$1 and request_id=$2',[A,'initial'])).rows,aBefore);
  const wrongTenant=params(p);wrongTenant[0]=id(900);await assert.rejects(as(db,A,ACK,wrongTenant),code('42501'));
  assert.equal((await db.query('select count(*)::int n from private.r3213_crdt_captures where request_id=$1',['initial'])).rows[0].n,2);
 });
 await t.test('PF03 old persisted remote receipt + fresh receipt compacts only captured tombstone; offline write survives',async()=>{
  // Historical clock fixture as local operator; public RPC accepts no timestamp.
  await db.query("update private.r3213_crdt_captures set confirmed_at=date_trunc('milliseconds',clock_timestamp()-interval '91 days') where request_id='initial'");
  const p=preparaSincronitzacioCrdtRural(deleted,'initial'),old=(await as(db,A,ACK,params(p)))[0].r;
  const confirmed=registraAckCrdtRural(deleted,p,ack(old),AUTH);assert.equal(compactaCrdtRural(confirmed).ops.length,2);
  const next=preparaSincronitzacioCrdtRural(confirmed,'second'),fresh=(await as(db,A,ACK,params(next)))[0].r;
  const offline=canviaCrdtRural(first,{id:'n',replica:'B',comptador:1,nota:note('Offline write kept')});
  const merged=registraAckCrdtRural(fusionaCrdtRural(confirmed,offline),next,ack(fresh),AUTH);
  assert.equal(merged.sincronitzacio.acks.some(a=>a.dot==='B:1'),false);assert.ok(compactaCrdtRural(merged).ops.some(o=>o.replica==='B'));
  const compact=compactaCrdtRural(registraAckCrdtRural(confirmed,next,ack(fresh),AUTH));assert.equal(compact.ops.length,0);assert.equal(compact.sincronitzacio.retirades.length,1);
  assert.throws(()=>registraAckCrdtRural(merged,p,ack(old),AUTH),e=>e.code==='RURAL_CRDT_ACK_CLOCK_REGRESSION');
 });
 let report;
 await t.test('LSSI reuses existing denunciations, exact receipt and no automatic hiding',async()=>{
  report=(await as(db,B,REPORT,[id(100),'altre','Detailed report',id(300)]))[0].r;assert.equal(report.estat,'rebuda');assert.equal(report.versio,1);
  assert.deepEqual((await as(db,B,REPORT,[id(100),'altre','Detailed report',id(300)]))[0].r,{...report,repetida:true});
  await assert.rejects(as(db,B,REPORT,[id(101),'altre','Changed',id(300)]),code('40001'));
  assert.equal((await db.query('select moderation_state from public.section_submissions where id=$1',[id(100)])).rows[0].moderation_state,'visible');
 });
 await t.test('ACL/RLS deny anon, neighbour and aal1 moderator; private columns revoked',async()=>{
  for(const who of[null,A,B]){
   await assert.rejects(as(db,who,"select public.llista_denuncies_diligents('rebuda',50)"),code('42501'));
   await assert.rejects(as(db,who,REVIEW,[report.id,'rebuda',1,'en_revisio','Reason',id(310)]),code('42501'));
   for(const table of['r3213_crdt_dots','r3213_crdt_captures','r3213_lssi_flux','r3213_lssi_audit','r3213_lssi_rebuts'])await assert.rejects(as(db,who,`select * from private.${table}`),code('42501'));
  }
  await assert.rejects(as(db,ADMIN,"select public.llista_denuncies_diligents('rebuda',50)",[],'aal1'),code('42501'));
  for(const column of['ip_hash','denunciant','autor_id'])await assert.rejects(as(db,B,`select ${column} from public.denuncies`),code('42501'));
  assert.equal((await as(db,B,'select id from public.denuncies')).length,1);assert.equal((await as(db,A,'select id from public.denuncies')).length,0);
  const rows=(await as(db,ADMIN,"select public.llista_denuncies_diligents('rebuda',50) r"))[0].r;assert.equal(rows.length,1);assert.equal('ip_hash' in rows[0],false);
 });
 await t.test('LSSI CAS human caution, audit trail and immutable original content',async()=>{
  const before=(await db.query('select payload,created_at from public.section_submissions where id=$1',[id(100)])).rows[0];
  const args=[report.id,'rebuda',1,'en_revisio','Human investigation',id(311)];assert.equal((await as(db,ADMIN,REVIEW,args))[0].r.versio,2);
  assert.equal((await as(db,ADMIN,REVIEW,args))[0].r.repetida,true);
  await assert.rejects(as(db,ADMIN,REVIEW,[report.id,'rebuda',1,'arxivada','Obsolete decision',id(312)]),code('40001'));
  assert.equal((await as(db,ADMIN,REVIEW,[report.id,'en_revisio',2,'ocultacio_cautelar','Documented precaution',id(313)]))[0].r.estat,'ocultacio_cautelar');
  assert.equal((await db.query('select moderation_state from public.section_submissions where id=$1',[id(100)])).rows[0].moderation_state,'retirada_cautelar');
  assert.deepEqual((await db.query('select payload,created_at from public.section_submissions where id=$1',[id(100)])).rows[0],before);
  await as(db,ADMIN,REVIEW,[report.id,'ocultacio_cautelar',3,'resolta','Documented resolution',id(314)]);
  assert.equal((await db.query('select count(*)::int n from private.r3213_lssi_audit where denuncia_id=$1',[report.id])).rows[0].n,4);
  await assert.rejects(as(db,ADMIN,REVIEW,[report.id,'resolta',4,'rebuda','Cannot reopen',id(315)]),code('22023'));
 });
 await t.test('legacy report/review and new workflow share the same versioned state and audit',async()=>{
  await as(db,B,"select public.denuncia_publicacio_mur($1,'altre','Legacy report')",[id(102)],'aal2','192.0.2.55');
  const did=(await db.query('select id from public.denuncies where objecte_id=$1',[id(102)])).rows[0].id;
  assert.equal((await db.query('select estat from private.r3213_lssi_flux where denuncia_id=$1',[did])).rows[0].estat,'rebuda');
  await as(db,ADMIN,"select public.admin_revisa_denuncia_lssi($1,'retirada','Legacy documented human caution','pendent')",[did]);
  const state=(await db.query('select estat,versio from private.r3213_lssi_flux where denuncia_id=$1',[did])).rows[0];assert.deepEqual(state,{estat:'ocultacio_cautelar',versio:2});
  assert.equal((await db.query('select count(*)::int n from private.r3213_lssi_audit where denuncia_id=$1',[did])).rows[0].n,2);
  await assert.rejects(as(db,ADMIN,REVIEW,[did,'rebuda',1,'en_revisio','Stale new API',id(320)]),code('40001'));
  await as(db,ADMIN,REVIEW,[did,'ocultacio_cautelar',2,'resolta','New API closes the old case',id(321)]);
  assert.equal((await db.query('select estat from public.denuncies where id=$1',[did])).rows[0].estat,'revisada');
 });
 await t.test('real ACL/RLS mutants are killed by least-privilege and owner-row oracles',async()=>{
  const surface=async()=>{const rows=(await db.query("select relrowsecurity,has_table_privilege('authenticated',c.oid,'SELECT') readable from pg_class c where c.oid in('private.r3213_crdt_dots'::regclass,'private.r3213_crdt_captures'::regclass,'private.r3213_lssi_audit'::regclass,'private.r3213_lssi_flux'::regclass,'private.r3213_lssi_rebuts'::regclass)")).rows;assert.equal(rows.length,5);assert.ok(rows.every(x=>x.relrowsecurity&&!x.readable));};
  await surface();
  for(const mutation of['grant select on private.r3213_lssi_audit to authenticated','alter table private.r3213_crdt_captures disable row level security']){
   await db.query('begin');try{await db.query(mutation);await assert.rejects(surface());}finally{await db.query('rollback');}
  }
  await db.query('begin');try{
   await db.query('alter table public.denuncies disable row level security');
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[A]);await db.query('set local role authenticated');
   assert.ok((await db.query('select id from public.denuncies')).rows.length>0,'RLS mutant leaks another actor row');
  }finally{await db.query('rollback');}
  assert.equal((await as(db,A,'select id from public.denuncies')).length,0);
 });
 if(cluster){
  const a=await cluster.connect(),b=await cluster.connect(),pa=(await a.query('select pg_backend_pid() p')).rows[0].p,pb=(await b.query('select pg_backend_pid() p')).rows[0].p;
  assert.notEqual(pa,pb);t.diagnostic(JSON.stringify({independentBackendPids:[pa,pb],isolation:'read committed'}));
  await t.test('native PF03 observed two-session lock: commit replay and rollback keep captures durable',async()=>{
   for(const outcome of['commit','rollback']){
    const p=preparaSincronitzacioCrdtRural(first,'race-'+outcome);await begin(a);await begin(b);assert.equal((await b.query('show transaction_isolation')).rows[0].transaction_isolation,'read committed');
    const r1=(await a.query(ACK,params(p))).rows[0].r,pending=b.query(ACK,params(p));pending.catch(()=>{});
    try{await blocked(db,pa,pb);await a.query(outcome);const r2=(await pending).rows[0].r;await b.query('commit');if(outcome==='commit')assert.deepEqual(r2,r1);}
    finally{await a.query('rollback');await b.query('rollback');}
    assert.equal((await db.query('select count(*)::int n from private.r3213_crdt_captures where request_id=$1',[p.requestId])).rows[0].n,1);
   }
  });
  await t.test('native PF03 disjoint snapshots both survive; concurrent DOT equivocation rolls back the contender',async()=>{
   for(const conflict of[false,true]){
    const replica=conflict?'F':'E';
    const stateA=canviaCrdtRural(estatCrdtRuralBuit(),{id:'concurrent-'+replica,replica,comptador:1,nota:note('First device')});
    const stateB=canviaCrdtRural(estatCrdtRuralBuit(),{id:conflict?'concurrent-F':'disjoint-G',replica:conflict?'F':'G',comptador:1,nota:note('Second device')});
    const one=preparaSincronitzacioCrdtRural(stateA,'parallel-a-'+replica),two=preparaSincronitzacioCrdtRural(stateB,'parallel-b-'+replica);
    await begin(a);await begin(b);const r1=(await a.query(ACK,params(one))).rows[0].r;
    const pending=b.query(ACK,params(two)).then(x=>({x}),e=>({e}));
    try{
     await blocked(db,pa,pb);await a.query('commit');const result=await pending;
     if(conflict){assert.equal(result.e?.code,'40001');await b.query('rollback');}
     else{assert.equal(result.e,undefined);await b.query('commit');assert.ok(result.x.rows[0].r.confirmatEl>r1.confirmatEl);}
    }finally{await a.query('rollback');await b.query('rollback');}
    const count=(await db.query('select count(*)::int n from private.r3213_crdt_captures where request_id=any($1::text[])',[[one.requestId,two.requestId]])).rows[0].n;
    assert.equal(count,conflict?1:2);
   }
  });
  await t.test('native LSSI competing CAS decisions serialize without duplicate audit',async()=>{
   const r=(await as(db,A,REPORT,[id(105),'altre','Concurrent fixture',id(350)],'aal2','192.0.2.40'))[0].r;
   await begin(a,ADMIN);await begin(b,ADMIN);
   const r1=(await a.query(REVIEW,[r.id,'rebuda',1,'en_revisio','First decision',id(351)])).rows[0].r;
   const pending=b.query(REVIEW,[r.id,'rebuda',1,'arxivada','Competing decision',id(352)]).then(x=>({x}),e=>({e}));
   try{await blocked(db,pa,pb);await a.query('commit');assert.equal((await pending).e?.code,'40001');await b.query('rollback');assert.equal(r1.versio,2);}
   finally{await a.query('rollback');await b.query('rollback');}
   assert.equal((await db.query('select count(*)::int n from private.r3213_lssi_audit where denuncia_id=$1',[r.id])).rows[0].n,2);
  });
 }
 await t.test('author burst quota applies to legacy inserts; trusted IP is hashed',async()=>{
  // Reset the one other A report only in this isolated clock fixture.
  await db.query("update public.denuncies set creat_al=clock_timestamp()-interval '2 minutes' where denunciant=$1",[A]);
  for(let n=0;n<5;n++)await as(db,A,REPORT,[id(110+n),'altre','Burst fixture',id(400+n)],'aal2','192.0.2.99');
  await assert.rejects(as(db,A,REPORT,[id(115),'altre','Sixth report',id(410)],'aal2','192.0.2.99'),code('42900'));
  await assert.rejects(as(db,A,"select public.denuncia_contingut('publicacio','bypass','altre','Bypass')",[],'aal2','192.0.2.99'),code('42900'));
  await db.query("update public.denuncies set creat_al=clock_timestamp()-interval '2 minutes' where denunciant=$1",[B]);
  for(let n=0;n<5;n++)await as(db,B,REPORT,[id(116+n),'altre','Shared IP fixture',id(420+n)],'aal2','192.0.2.99');
  await assert.rejects(as(db,C,REPORT,[id(121),'altre','IP quota applies to a different author',id(430)],'aal2','192.0.2.99'),code('42900'));
  const hashes=(await db.query('select distinct ip_hash from public.denuncies where ip_hash is not null')).rows;assert.ok(hashes.length);assert.ok(hashes.every(r=>!r.ip_hash.includes('192.0.2')));
 });
 await t.test('account deletion purges authenticated replay receipts, captures and DOTs; anonymous receipt remains',async()=>{
  const user=id(500);
  await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[user,'retention@example.invalid',{full_name:'Retention LAB',tenant_id:TOWN,accepta_rgpd:true}]);
  await db.query('insert into private.normes_acceptades(usuari_id,versio) values($1,private.versio_normes_vigent())',[user]);
  await db.query('insert into public.town_memberships(town_id,user_id) values($1,$2) on conflict do nothing',[TOWN,user]);
  await db.query("insert into public.user_platform_roles(user_id,role) values($1,'superadmin')",[user]);
  const own=(await as(db,user,REPORT,[id(123),'altre','Report text is not duplicated in replay receipt',id(501)],'aal2','192.0.2.201'))[0].r;
  await as(db,user,REVIEW,[own.id,'rebuda',1,'en_revisio','Private review justification',id(502)],'aal2','192.0.2.201');
  await as(db,user,ACK,params(preparaSincronitzacioCrdtRural(first,'retention')));
  const anon=(await as(db,null,REPORT,[id(124),'altre','Anonymous report',id(503)],'aal2','192.0.2.202'))[0].r;
  const anonymousBefore=(await db.query('select subjecte,operacio_id,peticio_sha256,rebut,actor_id from private.r3213_lssi_rebuts where operacio_id=$1',[id(503)])).rows;
  assert.equal(anonymousBefore.length,1);assert.equal(anonymousBefore[0].actor_id,null);
  assert.equal((await db.query('select count(*)::int n from private.r3213_lssi_rebuts where actor_id=$1',[user])).rows[0].n,2);
  const fields=(await db.query("select column_name from information_schema.columns where table_schema='private' and table_name='r3213_lssi_rebuts'")).rows.map(r=>r.column_name);
  assert.equal(fields.includes('peticio'),false);assert.ok(fields.includes('peticio_sha256'));
  const auditBefore=(await db.query('select anterior,estat,justificacio from private.r3213_lssi_audit where denuncia_id=$1 order by creat_al,id',[own.id])).rows;
  await db.query('delete from auth.users where id=$1',[user]);
  for(const [table,column] of[['r3213_lssi_rebuts','actor_id'],['r3213_crdt_captures','owner_id'],['r3213_crdt_dots','owner_id']]){
   assert.equal((await db.query(`select count(*)::int n from private.${table} where ${column}=$1`,[user])).rows[0].n,0);
  }
  assert.equal((await db.query('select count(*)::int n from private.r3213_lssi_rebuts where subjecte=$1 or subjecte=$2',[user,'review:'+user])).rows[0].n,0);
  assert.deepEqual((await db.query('select subjecte,operacio_id,peticio_sha256,rebut,actor_id from private.r3213_lssi_rebuts where operacio_id=$1',[id(503)])).rows,anonymousBefore);
  assert.deepEqual((await db.query('select anterior,estat,justificacio from private.r3213_lssi_audit where denuncia_id=$1 order by creat_al,id',[own.id])).rows,auditBefore);
  assert.ok((await db.query('select actor_id from private.r3213_lssi_audit where denuncia_id=$1',[own.id])).rows.every(r=>r.actor_id===null));
  assert.equal((await db.query('select denunciant from public.denuncies where id=$1',[own.id])).rows[0].denunciant,null);
  assert.equal((await db.query('select estat from private.r3213_lssi_flux where denuncia_id=$1',[anon.id])).rows[0].estat,'rebuda');
 });

 await t.test('legacy nullable detail remains readable and a now-private publication can be archived',async()=>{
  await as(db,C,"select public.denuncia_publicacio_mur($1,'altre',null)",[id(122)],'aal2','192.0.2.220');
  const did=(await db.query('select id from public.denuncies where objecte_id=$1',[id(122)])).rows[0].id;
  const rows=(await as(db,ADMIN,"select public.llista_denuncies_diligents('rebuda',100) r"))[0].r;
  const row=rows.find(r=>r.id===did);assert.equal(row.detall,null);assert.equal(filaDenunciaDiligent(row).detall,'');
  await db.query("update public.section_submissions set visibility='private' where id=$1",[id(122)]);
  const before=(await db.query('select payload,visibility,moderation_state from public.section_submissions where id=$1',[id(122)])).rows[0];
  assert.equal((await as(db,ADMIN,REVIEW,[did,'rebuda',1,'arxivada','Publication is already private; archive the case',id(901)]))[0].r.estat,'arxivada');
  assert.deepEqual((await db.query('select payload,visibility,moderation_state from public.section_submissions where id=$1',[id(122)])).rows[0],before);
  assert.equal((await db.query('select estat from public.denuncies where id=$1',[did])).rows[0].estat,'desestimada');
  assert.equal((await db.query('select count(*)::int n from private.r3213_lssi_audit where denuncia_id=$1',[did])).rows[0].n,2);
 });
 await t.test('deleted publication allows case review and resolution, while caution requires a live public target',async()=>{
  const r=(await as(db,C,REPORT,[id(120),'altre','Publication later deleted',id(902)],'aal2','192.0.2.221'))[0].r;
  await db.query('update public.section_submissions set deleted_at=clock_timestamp() where id=$1',[id(120)]);
  assert.equal((await as(db,ADMIN,REVIEW,[r.id,'rebuda',1,'en_revisio','Review after deletion',id(903)]))[0].r.estat,'en_revisio');
  const before=(await db.query('select estat,versio from private.r3213_lssi_flux where denuncia_id=$1',[r.id])).rows;
  const audit=(await db.query('select count(*)::int n from private.r3213_lssi_audit where denuncia_id=$1',[r.id])).rows[0].n;
  await assert.rejects(as(db,ADMIN,REVIEW,[r.id,'en_revisio',2,'ocultacio_cautelar','Cannot caution a deleted target',id(904)]),code('40001'));
  await db.query('delete from public.section_submissions where id=$1',[id(120)]);
  await assert.rejects(as(db,ADMIN,REVIEW,[r.id,'en_revisio',2,'ocultacio_cautelar','Cannot caution an absent target',id(905)]),code('22023'));
  assert.deepEqual((await db.query('select estat,versio from private.r3213_lssi_flux where denuncia_id=$1',[r.id])).rows,before);
  assert.equal((await db.query('select count(*)::int n from private.r3213_lssi_audit where denuncia_id=$1',[r.id])).rows[0].n,audit);
  assert.equal((await as(db,ADMIN,REVIEW,[r.id,'en_revisio',2,'resolta','Resolve the case after physical deletion',id(906)]))[0].r.estat,'resolta');
  assert.equal((await db.query('select estat from public.denuncies where id=$1',[r.id])).rows[0].estat,'revisada');
  assert.equal((await db.query('select count(*)::int n from private.r3213_lssi_audit where denuncia_id=$1',[r.id])).rows[0].n,3);
 });
 await t.test('legacy profile reports remain outside the publication-only inbox and review RPC',async()=>{
  await as(db,C,"select public.denuncia_contingut('persona',$1,'altre','Legacy profile report')",[ADMIN],'aal2','192.0.2.222');
  const did=(await db.query("select id from public.denuncies where objecte_tipus='persona' and objecte_id=$1",[ADMIN])).rows[0].id;
  assert.equal((await db.query('select count(*)::int n from private.r3213_lssi_flux where denuncia_id=$1',[did])).rows[0].n,0);
  const rows=(await as(db,ADMIN,"select public.llista_denuncies_diligents('rebuda',100) r"))[0].r;assert.equal(rows.some(r=>r.id===did),false);
  await assert.rejects(as(db,ADMIN,REVIEW,[did,'rebuda',1,'en_revisio','Use the original profile workflow',id(907)]),code('22023'));
  assert.equal((await db.query('select estat from public.denuncies where id=$1',[did])).rows[0].estat,'pendent');
 });

 await t.test('post-install hostile temp types cannot redirect definer JSONB, timestamp or interval casts; cast mutant is killed',async()=>{
  const names=['jsonb','timestamptz','interval'];
  const start=SQL.indexOf('create function public.confirma_captura_crdt_rural('),ending=SQL.indexOf('end; $$;',start);
  assert.ok(start>=0&&ending>start);const good=SQL.slice(start,ending+'end; $$;'.length).replace('create function','create or replace function');
  const marker='capture:=p_capture::pg_catalog.jsonb',mutant=good.replace(marker,'capture:=p_capture::jsonb');assert.notEqual(mutant,good,'hostile-cast mutant must really change the RPC');
  try{
   for(const name of names)await db.query(`create domain pg_temp.${name} as pg_catalog.${name} check(false)`);
   // Reinstall the exact qualified definition to compile its statements with
   // the hostile types already present, rather than rely on cached plans.
   await db.query(good);
   const one=(await as(db,C,ACK,params(preparaSincronitzacioCrdtRural(first,'hostile-one'))))[0].r;
   const two=(await as(db,C,ACK,params(preparaSincronitzacioCrdtRural(first,'hostile-two'))))[0].r;
   assert.ok(two.confirmatEl>one.confirmatEl);
   await db.query(mutant);
   await assert.rejects(as(db,C,ACK,params(preparaSincronitzacioCrdtRural(first,'hostile-mutant'))),code('23514'));
   await db.query(good);
   assert.equal((await as(db,C,ACK,params(preparaSincronitzacioCrdtRural(first,'hostile-restored'))))[0].r.ack_remot_confirmat,true);
  }finally{
   await db.query(good);
   for(const name of names.reverse())await db.query(`drop domain if exists pg_temp.${name}`);
  }
 });

}
test('R32.13 PF03 LSSI native PostgreSQL 18.6 two sessions',{timeout:180000},async t=>{
 const c=await startLocalPostgres();t.after(()=>c.close());const version=(await c.db.query('select version() v')).rows[0].v;assert.match(version,/PostgreSQL 18\.6(?:\s|$)/);t.diagnostic(version);await suite(t,c.db,sql=>c.db.query(sql),c);
});
test('R32.13 PF03 LSSI PGlite parity without hidden skips',{timeout:180000},async t=>{
 assert.ok(process.env.SDP_PGLITE_MODULE,'Set SDP_PGLITE_MODULE explicitly; SQL verification never silently skips.');
 const url=pathToFileURL(process.env.SDP_PGLITE_MODULE),{PGlite}=await import(url.href),{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',url));
 const initial=new PGlite();await initial.exec('create database socdepoble_node0');const image=await initial.dumpDataDir('none');await initial.close();
 const pg=new PGlite({database:'socdepoble_node0',loadDataDir:image,extensions:{pgcrypto}});t.after(()=>pg.close());await suite(t,pg,sql=>pg.exec(sql),null);
});
