import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {ttlUrgent} from '../supabase/functions/notifica-xat/natius.js';
import {database,bootstrap,migrate,seed,clock,clear,post,count,actor,id,T,A,B,C,H,H2} from './fixtures/r32_25-push.mjs';

const engine=process.env.SDP_R32_25_ENGINE||'native';
/* v1.2.17 (Gauntlet R1, L4-01) · Els escenaris de bàndols es calculen en hora de Madrid sobre el pròxim dia sense canvi
   d'hora (demà o després). xat_push_prepara_v2 i xat_push_reclama_v2 comparen la cua i les leases amb el now() real, i
   els dispositius es renoven amb el now() real; el rellotge privat (avisos_push_ara) només el fixa la prova. Amb els
   instants fixos del 21-11-2026, des de les 11:15Z la cua ja era «vella» i la prova depenia de l'hora a què es passava.
   Ara cada instant cau en les pròximes 48 hores, i el silenci 22:00–08:00 i la vida de 300 s es lligen igual a l'hivern
   i a l'estiu. Les proves pures de TTL i de canvi d'hora conserven les seues dates fixes. */
const desfasMadrid = (ms) => {
 const v = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  .formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
 return Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour, +v.minute, +v.second) - Math.floor(ms / 1000) * 1000;
};
const DIA = (() => {
 const ara = new Date();
 for (let n = 1; n < 8; n++) {
  const [y, m, d] = [ara.getUTCFullYear(), ara.getUTCMonth(), ara.getUTCDate() + n];
  const desfas = desfasMadrid(Date.UTC(y, m, d, 0, 0));
  if (desfas === desfasMadrid(Date.UTC(y, m, d + 1, 23, 0))) return { y, m, d, desfas };
 }
 throw new Error('cap dia sense canvi d\'hora en una setmana');
})();
/** L'instant UTC (ISO) de l'hora de Madrid `hms` («HH:MM:SS[.mmm]») del dia de l'escenari més `dies`. */
const madrid = (hms, dies = 0) => {
 const [h, mi, s] = hms.split(':'); const [seg, ms = '0'] = s.split('.');
 return new Date(Date.UTC(DIA.y, DIA.m, DIA.d + dies, +h, +mi, +seg, +ms.padEnd(3, '0').slice(0, 3)) - DIA.desfas).toISOString();
};
const noon=madrid('12:00:00');
test(`R32.25 S3 · Bàndols, consentiment, permisos i lease-v2 · ${engine}`,{timeout:180000},async t=>{
 const db=await database(engine);t.after(()=>db.close());await bootstrap(db);await seed(db);
 if(engine==='native')assert.equal((await db.query("select current_setting('server_version_num') v")).rows[0].v,'180006');
 await t.test('preimatge roja: cap protecció D24 ni contracte de bàndols',async()=>{
  assert.equal((await db.query("select to_regclass('private.xat_push_directes_nous') x")).rows[0].x,null);
  await assert.rejects(db.query('select private.avisos_push_normalitza($1)',['Bàndol urgent']),/does not exist/);
 });
 await migrate(db);await migrate(db);await clock(db,noon);
 await t.test('idempotència i bandera apagat per defecte: cap fila ni avisat',async()=>{
  assert.equal((await db.query("select valor from private.ajustos where clau='push_poble_actiu'")).rows[0].valor,'no');
  await post(db,100);assert.equal(await count(db,'private.xat_push_cua'),0);assert.equal(await count(db,'private.avisos_push_bandols_avisats'),0);
 });
 await db.exec("update private.ajustos set valor='si' where clau='push_poble_actiu'");
 await t.test('global push_xat apagat també apaga previsió i no consumix quota urgent',async()=>{
  await db.exec("update private.ajustos set valor='no' where clau='push_xat_actiu'");
  assert.deepEqual((await actor(db,A,'select public.avisos_push_bandols_preveu($1) x',[H])).rows[0].x,{sona_ara:false,motiu:'apagat'});
  await post(db,199);assert.equal(await count(db,'private.xat_push_cua'),0);assert.equal(await count(db,'private.avisos_push_bandols_avisats'),0);
  await db.exec("update private.ajustos set valor='si' where clau='push_xat_actiu'");
 });
 await t.test('només city_hall mateix poble i publicació visible',async()=>{
  await post(db,101,{org:null});assert.equal(await count(db,'private.xat_push_cua'),0);
  await assert.rejects(post(db,102,{org:H2}),/section_submissions_autoria_org_valida/);
  await post(db,103,{visibility:'private'});assert.equal(await count(db,'private.xat_push_cua'),0);
  await post(db,104);assert.equal(await count(db,'private.xat_push_cua'),1);
  assert.equal((await db.query('select canal from private.xat_push_cua')).rows[0].canal,'urgent');
 });
 await t.test('esborrany a públic, edició i privat/públic no dupliquen',async()=>{
  await clear(db);await post(db,110,{visibility:'private'});
  await db.query("update public.section_submissions set visibility='public' where id=$1",[id(110)]);
  assert.equal(await count(db,'private.xat_push_cua'),1);
  await db.query("update public.section_submissions set payload=payload||'{\"title\":\"Edició\"}'::jsonb where id=$1",[id(110)]);
  await db.query("update public.section_submissions set visibility='private' where id=$1",[id(110)]);
  await db.query("update public.section_submissions set visibility='public' where id=$1",[id(110)]);
  assert.equal(await count(db,'private.xat_push_cua'),1);
 });
 await t.test('màxim dos per24h, mínim10min, previsió honesta',async()=>{
  await clear(db);await clock(db,noon);await post(db,120);
  assert.deepEqual((await actor(db,A,'select public.avisos_push_bandols_preveu($1) x',[H])).rows[0].x,{sona_ara:false,motiu:'deu_minuts'});
  await post(db,121);assert.equal((await db.query('select sonat from private.avisos_push_bandols_avisats where submission_id=$1',[id(121)])).rows[0].sonat,false);
  await clock(db,madrid('12:10:00'));await post(db,122);assert.equal(await count(db,'private.xat_push_cua'),2);
  await clock(db,madrid('12:20:00'));await post(db,123);assert.equal(await count(db,'private.xat_push_cua'),2);
  assert.equal((await actor(db,A,'select public.avisos_push_bandols_preveu($1) x',[H])).rows[0].x.motiu,'sostre');
  await assert.rejects(actor(db,B,'select public.avisos_push_bandols_preveu($1)',[H]),/SDP-PUSH-B03/);
 });
 await t.test('fronteres22/08 i canvi DST: rellotge Madrid, cap retard fins matí',async()=>{
  let n=130;
  for(const [iso,sona]of[[madrid('21:59:59'),false],[madrid('22:00:00'),false],[madrid('23:30:00'),false],[madrid('07:59:59',1),false],[madrid('08:00:00',1),true],['2026-03-29T05:59:59Z',false],['2026-03-29T06:00:00Z',true],['2026-10-25T06:59:59Z',false],['2026-10-25T07:00:00Z',true]]){
   await clear(db);await clock(db,iso);await post(db,n++);assert.equal(await count(db,'private.xat_push_cua'),sona?1:0,iso);
  }
  await clock(db,noon);
 });
 await t.test('TTL SQL/worker:21:55 exacte300;1µs després no promet, no encua ni consumix quota',async()=>{
  let n=400;
  for(const [iso,ttl,workerMs]of[
   ['2026-11-21T20:54:59.999Z',300],['2026-11-21T20:55:00Z',300],
   ['2026-11-21T20:55:00.000001Z',299,Date.parse('2026-11-21T20:55:00Z')+0.001],
   ['2026-11-21T20:55:00.001Z',299],['2026-11-21T20:56:00Z',240],
   ['2026-11-21T21:00:00Z',0],['2026-07-21T19:55:00Z',300],
   ['2026-07-21T19:55:00.001Z',299],['2026-03-29T19:55:00Z',300],
   ['2026-10-25T20:55:00.001Z',299]
  ]){
   await clear(db);await clock(db,iso);
   const sqlTTL=(await db.query('select private.avisos_push_ttl_urgent($1::timestamptz) x',[iso])).rows[0].x;
   assert.equal(sqlTTL,ttl,iso);assert.equal(sqlTTL,ttlUrgent(workerMs??Date.parse(iso)),iso+' paritat amb el worker');
   const expected=ttl>=300?{sona_ara:true,motiu:null}:{sona_ara:false,motiu:ttl===0?'nit':'vida_insuficient'};
   assert.deepEqual((await actor(db,A,'select public.avisos_push_bandols_preveu($1) x',[H])).rows[0].x,expected,iso);
   await post(db,n++);assert.equal(await count(db,'private.xat_push_cua'),ttl>=300?1:0,iso);
   assert.equal(await count(db,'private.avisos_push_bandols_avisats'),ttl>=300?1:0,iso+' cap quota ni marca quan no hi ha vida');
  }
  for(const value of[null,'infinity','-infinity'])assert.equal((await db.query('select private.avisos_push_ttl_urgent($1::timestamptz) x',[value])).rows[0].x,0);
  await clear(db);await clock(db,noon);
 });
 await t.test('no es reobri publicació de31dies després purga',async()=>{
  await clear(db);await post(db,150,{created:'2026-10-21T10:00:00Z'});assert.equal(await count(db,'private.xat_push_cua'),0);
 });
 await t.test('consentiment3estats, no durador i nul rebutjat',async()=>{
  assert.equal((await actor(db,B,'select public.avisos_push_bandols_llig() x')).rows[0].x,null);
  await assert.rejects(actor(db,B,'select public.avisos_push_bandols_desa(null)'),/SDP-PUSH-B02/);
  assert.equal((await actor(db,B,'select public.avisos_push_bandols_accepta_si_absent() x')).rows[0].x,true);
  await actor(db,B,'select public.avisos_push_bandols_desa(false)');
  assert.equal((await actor(db,B,'select public.avisos_push_bandols_accepta_si_absent() x')).rows[0].x,false);
  assert.equal((await actor(db,B,'select public.avisos_push_bandols_llig() x')).rows[0].x,false);
  await assert.rejects(actor(db,null,'select public.avisos_push_bandols_desa(true)',[],'anon'),/permission denied/);
 });
 await t.test('RLS i mínimprivilegi: cap private ni funcions privades peranon/auth',async()=>{
  for(const role of['anon','authenticated'])for(const sql of['select * from private.avisos_push_bandols_avisats','select * from private.xat_push_directes_nous','select private.avisos_push_normalitza(\'alerta\')','select private.avisos_push_ara()','select private.avisos_push_ttl_urgent(now())'])await assert.rejects(actor(db,B,sql,[],role),/permission denied/);
  await assert.rejects(actor(db,B,'insert into public.avisos_push_bandols(usuari_id,actiu)values($1,true)',[A]),/permission denied/);
  assert.deepEqual((await actor(db,A,'select * from public.avisos_push_bandols')).rows,[]);
 });
 await db.exec(`insert into public.xat_dispositius_push(id,usuari_id,tipus,adreca,llengua)values('${id(201)}','${A}','fcm','${'a'.repeat(40)}','ca'),('${id(202)}','${B}','fcm','${'b'.repeat(40)}','ca'),('${id(203)}','${B}','web','https://fcm.googleapis.com/fcm/send/sintetic-r3225','ca'),('${id(204)}','${C}','apns','${'c'.repeat(64)}','ca')`);
 await t.test('destinataris: sí explícit, mateixpoble, autor fora, web fora',async()=>{
  await clear(db);await clock(db,noon);await post(db,160);
  let q=(await db.query('select id from private.xat_push_cua')).rows[0].id;
  assert.deepEqual((await db.query('select * from private.xat_push_candidats_v2($1)',[q])).rows,[]);
  for(const who of[A,B,C])await actor(db,who,'select public.avisos_push_bandols_desa(true)');
  const candidates=(await db.query('select * from private.xat_push_candidats_v2($1)',[q])).rows;assert.equal(candidates.length,1);assert.equal(candidates[0].usuari_id,B);assert.equal(candidates[0].tipus,'fcm');
 });
 await t.test('bloqueig ordinari, opac i baixa impedeixenlliurament',async()=>{
  const q=(await db.query('select id from private.xat_push_cua')).rows[0].id;
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[B]);
  await db.query("insert into public.bloquejos(bloquejador,bloquejat_tipus,bloquejat_entitat)values($1,'entitat',$2)",[B,H]);assert.equal((await db.query('select * from private.xat_push_candidats_v2($1)',[q])).rows.length,0);await db.query("update public.bloquejos set bloquejat_entitat=$1 where bloquejador=$2",[H2,B]);
  await db.query('insert into private.mur_bloquejos_opacs(bloqueig_id,bloquejador,bloquejat_entitat)select id,$1,$2 from public.bloquejos where bloquejador=$1',[B,H]);assert.equal((await db.query('select * from private.xat_push_candidats_v2($1)',[q])).rows.length,0);await db.exec('delete from public.bloquejos');
  await db.query("insert into private.baixes(user_id,purga_prevista_al)values($1,now()+interval '30 days')",[B]);assert.equal((await db.query('select * from private.xat_push_candidats_v2($1)',[q])).rows.length,0);await db.exec('delete from private.baixes');
 });
 await t.test('retirada abansreclamar descarta lease; xat iurgent comparteixaparell sensedupe',async()=>{
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);
  await db.query('select private.xat_push_prepara_v2(50)');await db.query("update public.section_submissions set visibility='private' where id=$1",[id(160)]);
  const res=(await actor(db,null,'select public.xat_push_reclama_v2(50) x',[],'service_role')).rows[0].x;assert.deepEqual(res.dispositius,[]);
  await clear(db);await post(db,161);
  const fil=(await actor(db,A,'select public.crea_fil_directe($1,$2,null) id',[T,B])).rows[0].id;
  await actor(db,A,"select * from public.xat_envia($1,$2,'text','Missatge sintètic',null,'{}')",[id(300),fil]);
  const x=(await actor(db,null,'select public.xat_push_reclama_v2(50) x',[],'service_role')).rows[0].x;
  const same=x.dispositius.filter(d=>d.id===id(202));assert.deepEqual(same.map(d=>d.avis??'xat').sort(),['urgent','xat']);assert.equal(same.length,2);
  for(const d of same)assert.deepEqual(Object.keys(d).sort(),d.avis==='urgent'?['adreca','avis','id','llengua','lliuraments','tipus']:['adreca','id','llengua','lliuraments','tipus']);
  const claim=async()=>(await actor(db,null,'select public.xat_push_reclama_v2(50) x',[],'service_role')).rows[0].x;
  const ack=async(items)=>(await actor(db,null,'select public.xat_push_confirma_v2($1::jsonb) x',[JSON.stringify(items)],'service_role')).rows[0].x;
  assert.equal((await claim()).treballs,0,'lease viva no es reclama dosvegades');
  const old=x.dispositius.flatMap(d=>d.lliuraments).map(d=>({...d,resultat:'acceptat'}));
  await db.exec("update private.xat_push_lliuraments set lease_fins=now()-interval '1 second'");
  assert.equal((await ack(old)).obsolets,old.length);
  const retry=await claim(),current=retry.dispositius.flatMap(d=>d.lliuraments).map(d=>({...d,resultat:'acceptat'}));
  assert.equal(retry.treballs,old.length);assert.ok(current.every(v=>old.some(w=>w.id===v.id&&w.lease!==v.lease)));
  assert.equal((await ack(old)).obsolets,old.length);assert.equal((await ack(current)).acceptats,current.length);

 });
 await t.test('revalidació tardana: flag off, retirada del sí i entrada a la nit descarten urgent',async()=>{
  for(const cause of['flag','consent','nit']){
   /* v1.2.17 · Gauntlet R2 (L4R2-04) · La «nit» publica a les 21:50 (TTL 600 >= 300: s'encua) i reclama a les 22:00, deu
      minuts després i dins de la finestra de 15 minuts de la cua. Abans publicava a migdia: a les 22:00 l'avís ja
      queia per vell, no pel silenci. */
   await clear(db);await clock(db,cause==='nit'?madrid('21:50:00'):noon);await db.exec("update private.ajustos set valor='si' where clau='push_poble_actiu'");await actor(db,B,'select public.avisos_push_bandols_desa(true)');await post(db,cause==='flag'?171:cause==='consent'?172:173);await db.query('select private.xat_push_prepara_v2(50)');
   /* v1.2.17 (L4-01) · Control positiu: hi ha una lease urgent preparada, i la revalidació la descarta per la causa. */
   assert.ok(await count(db,'private.xat_push_lliuraments')>0,cause);
   if(cause==='flag')await db.exec("update private.ajustos set valor='no' where clau='push_poble_actiu'");
   if(cause==='consent')await actor(db,B,'select public.avisos_push_bandols_desa(false)');
   if(cause==='nit'){
    await clock(db,madrid('22:00:00'));
    // La causa és el silenci: l'avís continua dins de la finestra de la cua i el rellotge ja és de nit.
    assert.deepEqual((await db.query("select bool_and(q.creat_al > private.avisos_push_ara() - interval '15 minutes') dins_finestra, private.avisos_push_en_silenci(private.avisos_push_ara()) silenci from private.xat_push_cua q where q.canal='urgent'")).rows[0],{dins_finestra:true,silenci:true},cause);
   }
   const r=(await actor(db,null,'select public.xat_push_reclama_v2(50) x',[],'service_role')).rows[0].x;assert.deepEqual(r.dispositius,[],cause);
  }
 });
 await t.test('una lease urgent preparada es descarta si la vida baixa de300s abans de reclamar',async()=>{
  await clear(db);await db.exec("update private.ajustos set valor='si' where clau='push_poble_actiu'");await actor(db,B,'select public.avisos_push_bandols_desa(true)');
  await clock(db,madrid('21:54:59'));await post(db,420);await db.query('select private.xat_push_prepara_v2(50)');assert.ok(await count(db,'private.xat_push_lliuraments')>0);
  await clock(db,madrid('21:55:00.001'));const x=(await actor(db,null,'select public.xat_push_reclama_v2(50) x',[],'service_role')).rows[0].x;assert.equal(x.treballs,0);assert.deepEqual(x.dispositius,[]);
 });
 if(engine==='native')await t.test('dos publicacions simultànies prenen pany de poble; no travessen 10min ni2/24h',async()=>{
  await clear(db);await db.exec("update private.ajustos set valor='si' where clau='push_poble_actiu'");await clock(db,noon);await post(db,180);await clock(db,madrid('12:10:00'));
  const one=await db.connect(),two=await db.connect(),wrap=c=>({...db,exec:q=>c.query(q),query:(...a)=>c.query(...a)});
  await one.query('begin');await post(wrap(one),181);await two.query('begin');let done=false;const second=post(wrap(two),182).then(()=>{done=true;});
  let waiting=false;try{for(let i=0;i<100;i++){const r=(await db.query('select wait_event from pg_stat_activity where pid=$1',[two.processID])).rows[0];if(r?.wait_event==='advisory'){waiting=true;break;}await delay(5);}assert.equal(waiting,true);assert.equal(done,false);}finally{await one.query('commit');}
  await second;await two.query('commit');assert.equal(await count(db,'private.xat_push_cua'),2);assert.equal(Number((await db.query('select count(*) n from private.avisos_push_bandols_avisats where sonat')).rows[0].n),2);
 });
});
