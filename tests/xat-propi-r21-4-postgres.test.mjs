import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

// Real migrations, local PG18.6, platform primitives only. No Supabase,
// provider transport, device, UI or deployment claim is made by this suite.
const MIGRATIONS = [
  '2609080000_initial_schema.sql','2609080100_xat_v2.sql','2609080200_xat_v2_correccions.sql',
  '2609080300_xat_v2_membres.sql','2609110600_perfil_avatar_i_permisos.sql','2609121500_correccio_privacitat_perfils.sql',
  '2609140000_schema_notes.sql','2609150000_seguretat_profunda_deepseek.sql','2609200600_xat_limit_correccio.sql',
  '2609261200_publicacions_autoria.sql','2609261500_identitat_perfil_f1.sql','2609262232_copyright_editor.sql',
  '2609270200_xat_f0_fonament.sql','2609272200_xat_entitats.sql','2609282035_perfil_emoticona.sql',
  '2609282100_xat_de_pagina.sql','2609291210_xat_cerca_accents.sql','2610042330_xat_pagina_iaia.sql',
  '2610081543_xat_consentiment_i_metadades.sql','2610090100_convergencia_xat_de_pagina.sql',
  '2610201500_moderacio_denuncies_i_bloquejos.sql','2610220240_xat_adjunts_i_quota.sql',
  '2610241400_normes_exigides_ugc.sql','2610282100_usuari_i_poble_canonic.sql','2610290400_xat_e2ee_claus_i_sobres.sql',
  '2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql','2611020417_xat_avisos_push.sql',
  '2611080431_xat_push_leases.sql','2611080432_xat_lliurament_i_presencia.sql'
];
const MIGRATION = 'supabase/migrations/2611121630_xat_propi.sql';
const id = n => `19000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const TOWN=id(1),OTHER_TOWN=id(2),ALICE=id(11),BOB=id(12),EVE=id(13),FORASTER=id(14),NO_CONSENT=id(15),DELETING=id(16),QUEUED_DELETE=id(17);
const read = p => readFileSync(new URL(`../${p}`, import.meta.url),'utf8');
const errorIs = (prefix,code='42501') => e => e.code===code && e.message.startsWith(prefix);
async function asActor(db,actor,fn,role='authenticated') {
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)",[actor??'',role]);
    const result=await fn(db); await db.query('commit'); return result;
  } catch(error) { await db.query('rollback'); throw error; }
}
async function adminTransaction(db,fn) {
  await db.query('begin');
  try { await fn(db); await db.query('commit'); }
  catch(error) { await db.query('rollback'); throw error; }
}
const create=(db,actor,other=actor,town=TOWN)=>asActor(db,actor,c=>c.query('select public.crea_fil_directe($1,$2,null) as id',[town,other]));
const send=(db,actor,thread,message,text='Nota pròpia sintètica')=>asActor(db,actor,c=>c.query("select * from public.xat_envia($1,$2,'text',$3,null,'{}')",[message,thread,text]));
const mine=(db,actor)=>asActor(db,actor,c=>c.query('select * from public.xat_fils_meus($1)',[TOWN]));

test('R21.4 fil propi: creació concurrent, propietat, lectura automàtica i zero destinataris push sobre PG18.6', {timeout:90000},async t=>{
  const cluster=await startLocalPostgres(),db=cluster.db;
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as v")).rows[0].v,'180006');
    for(const p of ['tests/fixtures/missatgeria-r21-2/bootstrap-platform.sql',...MIGRATIONS.map(m=>`supabase/migrations/${m}`)]) await db.query(read(p));
    await db.query("insert into public.towns(id,slug,name) values($1,'self-r21-4','Poble sintètic'),($2,'self-other-r21-4','Altre poble')",[TOWN,OTHER_TOWN]);
    for(const [actor,name,town,consent] of [[ALICE,'Alícia',TOWN,true],[BOB,'Bernat',TOWN,true],[EVE,'Eva',TOWN,true],[FORASTER,'Foraster',OTHER_TOWN,true],
      [NO_CONSENT,'Sense consentiment',TOWN,false],[DELETING,'Baixa de perfil',TOWN,true],[QUEUED_DELETE,'Baixa pendent',TOWN,true]]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[actor,`${actor}@example.invalid`,{full_name:name,tenant_id:town,accepta_rgpd:consent}]);
      await asActor(db,actor,c=>c.query("select public.accepta_normes_convivencia('2026-10-24')"));
    }
    const migration=read(MIGRATION); t.diagnostic(`${MIGRATION} sha256=${createHash('sha256').update(migration).digest('hex')}`);
    await t.test('La preimatge real rebutja self; la migració nova és repetible',async()=>{
      await assert.rejects(create(db,ALICE),errorIs('SDP-XAT-002','22023'));
      await db.query(migration); await db.query(migration);
      assert.equal((await db.query("select count(*)::int as n from pg_indexes where indexname='xat_fils_propi_usuari_uq'")).rows[0].n,1);
    });
    let own;
    await t.test('Dos dispositius creen alhora un únic directe d’un sol propietari',async()=>{
      const one=await cluster.connect(),two=await cluster.connect();
      let release,ready;const gate=new Promise(r=>{release=r;}),firstReady=new Promise(r=>{ready=r;});
      const first=asActor(one,ALICE,async c=>{const result=await c.query('select public.crea_fil_directe($1,$2,null) as id',[TOWN,ALICE]);ready();await gate;return result;});
      await Promise.race([firstReady,first]);
      const second=create(two,ALICE);
      let waiting=false;
      try {
        for(let attempt=0;attempt<100;attempt++) {
          const row=(await db.query('select wait_event from pg_stat_activity where pid=$1',[two.processID])).rows[0];
          if(row?.wait_event==='advisory') {waiting=true;break;} await delay(5);
        }
        assert.ok(waiting,'la segona connexió espera realment el pany de la primera');
      } finally {release();}
      const results=await Promise.all([first,second]);own=results[0].rows[0].id;
      assert.equal(results[1].rows[0].id,own);assert.equal((await create(db,ALICE)).rows[0].id,own);
      const f=(await db.query('select tipus,creat_per,propi_usuari_id,org_id from public.xat_fils where id=$1',[own])).rows[0];
      assert.deepEqual(f,{tipus:'directe',creat_per:ALICE,propi_usuari_id:ALICE,org_id:null});
      const p=(await db.query('select usuari_id,com_org_id,rol from public.xat_participants where fil_id=$1',[own])).rows;
      assert.deepEqual(p,[{usuari_id:ALICE,com_org_id:null,rol:'propietari'}]);
    });
    await t.test('El fil propi retorna nom i identitat pròpies sense duplicar participants ni rebuts aliens',async()=>{
      const rows=(await mine(db,ALICE)).rows;const row=rows.find(r=>r.id===own);
      assert.equal(row.participants,1);assert.equal(row.tipus,'directe');assert.deepEqual(row.altres_noms,['Alícia']);
      assert.deepEqual(row.altres,[{id:ALICE,nom:'Alícia',tipus:'persona',avatarUrl:null,slug:null}]);
      assert.equal(row.no_llegits,0);assert.equal(row.llegit_pels_altres_fins_seq,'0');
    });
    await t.test('Enviar, reintentar i marcar mantenen tot el fil llegit sense fabricar lectures d’altres persones',async()=>{
      const first=(await send(db,ALICE,own,id(101))).rows[0];assert.equal(first.seq,'1');
      assert.equal((await send(db,ALICE,own,id(101))).rows[0].seq,'1');
      await db.query('update public.xat_participants set no_llegit_manual=true where fil_id=$1',[own]);
      assert.equal((await send(db,ALICE,own,id(102))).rows[0].seq,'2');
      const row=(await mine(db,ALICE)).rows.find(r=>r.id===own);
      assert.equal(row.ultim_seq,'2');assert.equal(row.llegit_fins_seq,'2');assert.equal(row.rebut_fins_seq,'2');assert.equal(row.no_llegits,0);assert.equal(row.no_llegit_manual,false);
      assert.equal(row.ultim_autor_id,ALICE);assert.equal(row.llegit_pels_altres_fins_seq,'0');
      const marks=await asActor(db,ALICE,c=>c.query('select * from public.xat_marca($1,999,999)',[own]));assert.deepEqual(marks.rows,[{rebut_fins_seq:'2',llegit_fins_seq:'2'}]);
      const lower=await asActor(db,ALICE,c=>c.query('select * from public.xat_marca($1,0,0)',[own]));assert.deepEqual(lower.rows,marks.rows);
      assert.equal((await asActor(db,ALICE,c=>c.query('select * from public.xat_historial($1,null,50)',[own]))).rows.length,2);
    });
    await t.test('Enviaments concurrents del mateix compte acaben amb llegit=ultim_seq',async()=>{
      const one=await cluster.connect(),two=await cluster.connect();
      await Promise.all([send(one,ALICE,own,id(103)),send(two,ALICE,own,id(104))]);
      const row=(await mine(db,ALICE)).rows.find(r=>r.id===own);assert.equal(row.ultim_seq,'4');assert.equal(row.llegit_fins_seq,row.ultim_seq);assert.equal(row.rebut_fins_seq,row.ultim_seq);assert.equal(row.no_llegits,0);
    });
    await t.test('Amb push actiu i tres dispositius propis no es crea cap lliurament ni destinatari',async()=>{
      await db.query("insert into private.ajustos(clau,valor) values('push_xat_actiu','si') on conflict(clau) do update set valor=excluded.valor");
      for(const [platform,address] of [['web','https://fcm.googleapis.com/fcm/send/self-synthetic'],['ios','ac'.repeat(32)],['android','self_synthetic_fcm_registration_1234567890']])
        await asActor(db,ALICE,c=>c.query("select public.xat_push_desa($1,$2,null,'ca',true)",[platform,address]));
      await send(db,ALICE,own,id(105));
      assert.equal((await asActor(db,null,c=>c.query('select public.xat_push_desperta_v2($1,$2) as woke',[id(105),ALICE]),'service_role')).rows[0].woke,true);
      const claim=(await asActor(db,null,c=>c.query('select public.xat_push_reclama_v2(50) as result'),'service_role')).rows[0].result;
      assert.equal(claim.treballs,0);assert.deepEqual(claim.dispositius,[]);
      assert.equal((await db.query('select count(*)::int as n from private.xat_push_lliuraments')).rows[0].n,0);
      assert.equal((await db.query('select count(*)::int as n from public.xat_dispositius_push where usuari_id=$1',[ALICE])).rows[0].n,3);
    });
    await t.test('RLS i RPC impedixen llegir, escriure, marcar o adoptar el fil propi d’un altre compte',async()=>{
      for(const query of ['select * from public.xat_fils where id=$1','select * from public.xat_participants where fil_id=$1','select * from public.xat_missatges where fil_id=$1']) assert.deepEqual((await asActor(db,BOB,c=>c.query(query,[own]))).rows,[]);
      assert.ok(!(await mine(db,BOB)).rows.some(row=>row.id===own));
      for(const [query,args] of [['select * from public.xat_historial($1,null,50)',[own]],['select * from public.xat_nous($1,0,50)',[own]],['select * from public.xat_marca($1,1,1)',[own]]])
        await assert.rejects(asActor(db,BOB,c=>c.query(query,args)),errorIs('SDP-XAT-006'));
      await assert.rejects(send(db,BOB,own,id(106)),errorIs('SDP-XAT-006'));
      await assert.rejects(asActor(db,BOB,c=>c.query('insert into public.xat_participants(fil_id,usuari_id) values($1,$2)',[own,BOB])),e=>e.code==='42501');
      await assert.rejects(asActor(db,ALICE,c=>c.query('update public.xat_fils set propi_usuari_id=$1 where id=$2',[BOB,own])),e=>e.code==='42501');
      const bobOwn=(await create(db,BOB)).rows[0].id;assert.notEqual(bobOwn,own);
      const normal=(await create(db,BOB,ALICE)).rows[0].id;assert.notEqual(normal,own);assert.notEqual(normal,bobOwn);
      assert.equal((await db.query('select propi_usuari_id from public.xat_fils where id=$1',[normal])).rows[0].propi_usuari_id,null);
    });
    await t.test('Les restriccions de base rebutgen roster extra, owner substituït, cap participant i retirada del marcador',async()=>{
      for(const [query,args] of [
        ['insert into public.xat_participants(fil_id,usuari_id) values($1,$2)',[own,EVE]],
        ['update public.xat_participants set usuari_id=$2 where fil_id=$1',[own,EVE]],
        ['delete from public.xat_participants where fil_id=$1',[own]],
        ['update public.xat_fils set propi_usuari_id=null where id=$1',[own]],
        ['update public.xat_fils set creat_per=null where id=$1',[own]],
        ["update public.xat_fils set tipus='grup' where id=$1",[own]]
      ]) await assert.rejects(adminTransaction(db,c=>c.query(query,args)),e=>e.code==='23514');
      assert.equal((await db.query('select count(*)::int as n from public.xat_participants where fil_id=$1',[own])).rows[0].n,1);
    });
    await t.test('Sessió, pertinença i baixes pendents es validen al servidor; self no publica el perfil al directori',async()=>{
      await assert.rejects(asActor(db,null,c=>c.query('select public.crea_fil_directe($1,$2,null)',[TOWN,ALICE]),'anon'),e=>e.code==='42501');
      await assert.rejects(create(db,null,ALICE),errorIs('SDP-XAT-001'));
      await assert.rejects(create(db,FORASTER,FORASTER),errorIs('SDP-XAT-003'));
      await db.query('update public.profiles set baixa_demanada_at=now() where id=$1',[DELETING]);
      await db.query("insert into private.baixes(user_id,purga_prevista_al) values($1,now()+interval '30 days')",[QUEUED_DELETE]);
      await assert.rejects(create(db,DELETING),errorIs('SDP-XAT-004'));await assert.rejects(create(db,QUEUED_DELETE),errorIs('SDP-XAT-004'));
      assert.ok((await create(db,NO_CONSENT)).rows[0].id,'private self storage does not publish a recipient');
      await assert.rejects(create(db,ALICE,NO_CONSENT),errorIs('SDP-XAT-016'));
      const directory=(await asActor(db,ALICE,c=>c.query('select * from public.membres_del_poble($1,null,100)',[TOWN]))).rows;
      assert.ok(!directory.some(row=>row.usuari_id===NO_CONSENT));
      await db.query('update public.profiles set baixa_demanada_at=now() where id=$1',[ALICE]);
      assert.ok(!(await mine(db,ALICE)).rows.some(row=>row.id===own));
      await assert.rejects(send(db,ALICE,own,id(107)),errorIs('SDP-XAT-006'));
      await db.query('update public.profiles set baixa_demanada_at=null where id=$1',[ALICE]);
      await db.query("insert into private.baixes(user_id,purga_prevista_al) values($1,now()+interval '30 days')",[ALICE]);
      assert.ok(!(await mine(db,ALICE)).rows.some(row=>row.id===own));
      await assert.rejects(create(db,ALICE),errorIs('SDP-XAT-004'));
      await assert.rejects(send(db,ALICE,own,id(107)),errorIs('SDP-XAT-006'));
      await db.query('delete from private.baixes where user_id=$1',[ALICE]);
      await db.query('delete from public.town_memberships where town_id=$1 and user_id=$2',[TOWN,ALICE]);
      assert.ok(!(await mine(db,ALICE)).rows.some(row=>row.id===own));
      await assert.rejects(create(db,ALICE),errorIs('SDP-XAT-003'));
      await assert.rejects(send(db,ALICE,own,id(107)),errorIs('SDP-XAT-006'));
      await db.query('insert into public.town_memberships(town_id,user_id) values($1,$2)',[TOWN,ALICE]);
    });
    await t.test('El directe de dos participants conserva consentiment i rebuts independents',async()=>{
      const normal=(await create(db,ALICE,BOB)).rows[0].id;
      assert.equal((await create(db,BOB,ALICE)).rows[0].id,normal);
      assert.equal((await db.query('select count(*)::int as n from public.xat_participants where fil_id=$1',[normal])).rows[0].n,2);
      await send(db,ALICE,normal,id(108),'Directe normal sintètic');
      const row=(await mine(db,BOB)).rows.find(r=>r.id===normal);assert.equal(row.no_llegits,1);assert.equal(row.llegit_fins_seq,'0');assert.equal(row.participants,2);
      await asActor(db,BOB,c=>c.query("select public.revoca_consentiment('rgpd_acepta')"));
      assert.equal((await create(db,ALICE,BOB)).rows[0].id,normal,'existing direct survives withdrawal by established contract');
      await assert.rejects(create(db,EVE,BOB),errorIs('SDP-XAT-016'));
      await send(db,ALICE,normal,id(109),'Directe existent després de revocació');
    });
    await t.test('Reaplicar amb dades conserva identitat, missatges i un únic conjunt de disparadors',async()=>{
      const count=(await db.query('select count(*)::int as n from public.xat_missatges where fil_id=$1',[own])).rows[0].n;
      await db.query(migration);assert.equal((await create(db,ALICE)).rows[0].id,own);
      assert.equal((await db.query('select count(*)::int as n from public.xat_missatges where fil_id=$1',[own])).rows[0].n,count);
      assert.equal((await db.query("select count(*)::int as n from pg_trigger where tgname in('xat_propi_integritat_fil','xat_propi_integritat_participant','xat_propi_missatge')")).rows[0].n,3);
    });
    await t.test('La baixa física del compte elimina el fil propi per cascada sense bloquejar la purga existent',async()=>{
      const eveOwn=(await create(db,EVE)).rows[0].id;
      await send(db,EVE,eveOwn,id(110),'Nota descartable de la persona que es dona de baixa');
      await db.query('delete from auth.users where id=$1',[EVE]);
      for(const table of ['xat_fils','xat_participants','xat_missatges']) {
        const column=table==='xat_fils'?'id':'fil_id';
        assert.equal((await db.query(`select count(*)::int as n from public.${table} where ${column}=$1`,[eveOwn])).rows[0].n,0);
      }
    });
  } finally {await cluster.close();}
});
