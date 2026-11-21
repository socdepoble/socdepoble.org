import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {database,bootstrap,migrate,seed,actor,id,T,A,count} from './fixtures/r32_25-push.mjs';
const engine=process.env.SDP_R32_25_ENGINE||'native';
const send=(db,fil,n)=>actor(db,A,"select * from public.xat_envia($1,$2,'text','Missatge sintètic D24',null,'{}')",[id(n),fil]);
async function recipients(db){for(let n=40;n<54;n++){await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)values($1,$2,now(),$3)',[id(n),id(n)+'@example.invalid',{tenant_id:T,accepta_rgpd:true,full_name:'Sintètic D24'}]);await actor(db,id(n),"select public.accepta_normes_convivencia('2026-10-24')");}}
const direct=async(db,n)=>(await actor(db,A,'select public.crea_fil_directe($1,$2,null) id',[T,id(n)])).rows[0].id;
const qcount=db=>count(db,'private.xat_push_cua');
test('R32.25 S2 · D24: 10 directes nous/24h, missatge preservat, denegació persistent · '+engine,{timeout:180000},async t=>{
 const db=await database(engine);t.after(()=>db.close());await bootstrap(db);await seed(db);await recipients(db);
 await t.test('roig: preimatge real encua 11 directes nous sense sostre',async()=>{for(let n=40;n<51;n++)await send(db,await direct(db,n),1000+n);assert.equal(await qcount(db),11);});
 await db.exec('delete from public.xat_fils;delete from private.xat_push_cua');await migrate(db);await migrate(db);
 await t.test('verd: 11é missatge persistix, però només 10 converses noves poden avisar',async()=>{
  assert.equal((await db.query("select valor from private.ajustos where clau='push_xat_directes_nous_dia'")).rows[0].valor,'10');
  for(let n=40;n<51;n++)await send(db,await direct(db,n),2000+n);
  assert.equal(await count(db,'public.xat_missatges'),11);assert.equal(await qcount(db),10);
  const decisions=(await db.query('select admes,count(*) n from private.xat_push_directes_nous group by admes order by admes')).rows;assert.deepEqual(decisions.map(x=>[x.admes,Number(x.n)]),[[false,1],[true,10]]);
 });
 await t.test('segon missatge i despertar explícit no esquiven el sostre del 11é directe',async()=>{
  const fil=await direct(db,50);await send(db,fil,3050);assert.equal(await count(db,'public.xat_missatges'),12);assert.equal(await qcount(db),10);
  await actor(db,null,'select public.xat_push_desperta_v2($1,$2)',[id(3050),A],'service_role');assert.equal(await qcount(db),10);
 });
 await t.test('conversa admesa continua avisant sense consumir una altra plaça',async()=>{await send(db,await direct(db,40),3040);assert.equal(await qcount(db),11);assert.equal(await count(db,'private.xat_push_directes_nous'),11);});
 await t.test('sostre configurable malformat torna a10, finestra exacta24h i denegada antiga',async()=>{
  await db.exec("update private.ajustos set valor='malformat' where clau='push_xat_directes_nous_dia';update private.xat_push_directes_nous set primer_al=now()-interval '24 hours'");
  await send(db,await direct(db,51),3051);assert.equal(await qcount(db),12);
  await send(db,await direct(db,50),4050);assert.equal(await qcount(db),13);
  assert.equal(await count(db,'private.xat_push_directes_nous'),1);
 });
 await t.test('flag apagat conserva missatge sense encuar ni consumir quota',async()=>{await delay(5100); // respecta el límit real 15/5s, sense desactivar-lo
await db.exec("update private.ajustos set valor='no' where clau='push_xat_actiu'");const before=await qcount(db);await send(db,await direct(db,52),4052);assert.equal(await qcount(db),before);assert.equal(await count(db,'private.xat_push_directes_nous'),1);await db.exec("update private.ajustos set valor='si' where clau='push_xat_actiu'");});
 if(engine==='native')await t.test('dues sessions reals al límit9: pany remitent, només una de dues entra',async()=>{
  await db.exec("delete from private.xat_push_cua;delete from private.xat_push_directes_nous;update private.ajustos set valor='10' where clau='push_xat_directes_nous_dia'");
  for(let n=40;n<49;n++)await db.query('insert into private.xat_push_directes_nous(fil_id,remitent_id,admes)values($1,$2,true)',[await direct(db,n),A]);
  const f1=await direct(db,52),f2=await direct(db,53); // f1 was sent with flag off: already old, use empty new fids below
  await db.query('delete from public.xat_missatges where fil_id=$1',[f1]);
  const one=await db.connect(),two=await db.connect();
  await one.query('begin');await one.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true)",[A]);await one.query('set local role authenticated');
  await one.query("select * from public.xat_envia($1,$2,'text','D24 concurrent1',null,'{}')",[id(8001),f1]);
  let complete=false;const second=send({...db,exec:q=>two.query(q),query:(...a)=>two.query(...a)},f2,8002).finally(()=>{complete=true;});
  let waiting=false;try{for(let i=0;i<100;i++){const r=(await db.query('select wait_event from pg_stat_activity where pid=$1',[two.processID])).rows[0];if(r?.wait_event==='advisory'){waiting=true;break;}await delay(5);}assert.equal(waiting,true);assert.equal(complete,false);}finally{await one.query('commit');}
  await second;assert.equal(await qcount(db),1);assert.equal(Number((await db.query('select count(*) n from private.xat_push_directes_nous where admes')).rows[0].n),10);assert.equal(Number((await db.query('select count(*) n from public.xat_missatges where id in($1,$2)',[id(8001),id(8002)])).rows[0].n),2);
 });
 await t.test('baixa remetent i eliminaciófil retiren decisions amb FK cascade',async()=>{const fil=await direct(db,51);await db.query('delete from public.xat_fils where id=$1',[fil]);assert.equal(Number((await db.query('select count(*) n from private.xat_push_directes_nous where fil_id=$1',[fil])).rows[0].n),0);await db.query('delete from auth.users where id=$1',[A]);assert.equal(await count(db,'private.xat_push_directes_nous'),0);});
});
