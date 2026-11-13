import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';
import { generateVapid, stage } from '../tooling/push/aprovisiona-push.mjs';

// RPC SQL reals; auth/storage són primitives de plataforma de la fixture.
// No prova GoTrue/PostgREST, WebSocket Realtime ni recepció física APNs/FCM/Web Push.
const MIGRATIONS = [
  '2609080000_initial_schema.sql',
  '2609080100_xat_v2.sql',
  '2609080200_xat_v2_correccions.sql',
  '2609080300_xat_v2_membres.sql',
  '2609110600_perfil_avatar_i_permisos.sql',
  '2609121500_correccio_privacitat_perfils.sql',
  '2609140000_schema_notes.sql',
  '2609150000_seguretat_profunda_deepseek.sql',
  '2609200600_xat_limit_correccio.sql',
  '2609261200_publicacions_autoria.sql',
  '2609261500_identitat_perfil_f1.sql',
  '2609262232_copyright_editor.sql',
  '2609270200_xat_f0_fonament.sql',
  '2609272200_xat_entitats.sql',
  '2609282035_perfil_emoticona.sql',
  '2609282100_xat_de_pagina.sql',
  '2609291210_xat_cerca_accents.sql',
  '2610042330_xat_pagina_iaia.sql',
  '2610081543_xat_consentiment_i_metadades.sql',
  '2610090100_convergencia_xat_de_pagina.sql',
  '2610201500_moderacio_denuncies_i_bloquejos.sql',
  '2610220240_xat_adjunts_i_quota.sql',
  '2610241400_normes_exigides_ugc.sql',
  '2610282100_usuari_i_poble_canonic.sql',
  '2610290400_xat_e2ee_claus_i_sobres.sql',
  '2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql',
  '2611020417_xat_avisos_push.sql',
  '2611030330_politica_privacitat_2_4.sql',
  '2611080431_xat_push_leases.sql',
  '2611080432_xat_lliurament_i_presencia.sql'
];
const TOWN = '11000000-0000-4000-8000-000000000021';
const OTHER_TOWN = '11000000-0000-4000-8000-000000000022';
const ALICE = '22000000-0000-4000-8000-000000000021';
const BOB = '22000000-0000-4000-8000-000000000022';
const OUTSIDER = '22000000-0000-4000-8000-000000000023';
const NO_CONSENT = '22000000-0000-4000-8000-000000000024';
const EVE = '22000000-0000-4000-8000-000000000025';
const MESSAGE = '33000000-0000-4000-8000-000000000021';
const read = relative => readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const sdpError = (prefix, code = '42501') => error => error.code === code && error.message.startsWith(prefix);

async function asActor(db, who, callback, role = 'authenticated') {
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)", [who ?? '', role]);
    const result = await callback(db);
    await db.query('commit');
    return result;
  } catch (error) {
    await db.query('rollback');
    throw error;
  }
}
const open = (db, other, town = TOWN) => db.query('select public.crea_fil_directe($1,$2,null) as id', [town, other]);
const send = (db, thread, id = MESSAGE, text = 'Missatge sintètic R21.2') => db.query('select * from public.xat_envia($1,$2,\'text\',$3,null,\'{}\')', [id, thread, text]);
const poll = (db, thread) => db.query('select public.xat_ritme($1) as result', [thread]);

test('R21.2 · missatgeria i rebuts sobre PostgreSQL 18.6 real, sense xarxa externa', { timeout: 90000 }, async t => {
  const cluster = await startLocalPostgres();
  const db = cluster.db;
  try {
    const engine = (await db.query('select version() as version, current_setting(\'server_version_num\') as number')).rows[0];
    assert.equal(engine.number, '180006');
    t.diagnostic(engine.version);
    for (const path of ['tests/fixtures/missatgeria-r21-2/bootstrap-platform.sql', ...MIGRATIONS.map(file => `supabase/migrations/${file}`)]) {
      const sql = read(path);
      try { await db.query(sql); }
      catch (error) { error.message = `${path}: ${error.message}`; throw error; }
      t.diagnostic(`${path} sha256=${createHash('sha256').update(sql).digest('hex')}`);
    }
    await db.query('insert into public.towns(id,slug,name) values ($1,\'r21-2\',\'Poble sintètic R21.2\'),($2,\'r21-2-altre\',\'Altre poble sintètic\')', [TOWN,OTHER_TOWN]);
    for (const [id,name,town,consent] of [[ALICE,'Alícia sintètica',TOWN,true],[BOB,'Bernat sintètic',TOWN,true],[OUTSIDER,'Foraster sintètic',OTHER_TOWN,true],[NO_CONSENT,'Sense consentiment',TOWN,false],[EVE,'Eva sintètica',TOWN,true]]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)', [id,`${id}@example.invalid`,{full_name:name,tenant_id:town,accepta_rgpd:consent}]);
    }
    // La versió registrada és real; cap perfil ni missatge de persones reals.
    for (const person of [ALICE,BOB,OUTSIDER,NO_CONSENT,EVE]) await asActor(db,person,c => c.query("select public.accepta_normes_convivencia('2026-10-24')"));
    let thread;

    await t.test('El rebuig anònim i el Foraster es distingixen de l’enviament autenticat', async () => {
      await assert.rejects(asActor(db,null,c => open(c,BOB),'anon'), error => error.code === '42501');
      await assert.rejects(asActor(db,null,c => open(c,BOB)), sdpError('SDP-XAT-001'));
      await assert.rejects(asActor(db,OUTSIDER,c => open(c,BOB)), sdpError('SDP-XAT-003'));
      await assert.rejects(asActor(db,ALICE,c => open(c,OUTSIDER)), sdpError('SDP-XAT-004'));
      await assert.rejects(asActor(db,ALICE,c => open(c,ALICE)), sdpError('SDP-XAT-002','22023'));
      await assert.rejects(asActor(db,ALICE,c => c.query("select public.xat_historial('sdp-per-defecte:javi',null,50)")), error => error.code === '22P02');
    });

    await t.test('Sense RGPD no apareix al directori ni s’obri cap directe nou', async () => {
      const consent=(await asActor(db,BOB,c=>c.query('select public.estat_consentiment() as result'))).rows[0].result;
      assert.equal(consent.versio_vigent,'2.4'); assert.equal(consent.cal_reconsentir,false);
      const rows = (await asActor(db,ALICE,c => c.query('select * from public.membres_del_poble($1,null,100)',[TOWN]))).rows;
      assert.ok(rows.some(row => row.usuari_id === BOB));
      assert.ok(!rows.some(row => row.usuari_id === NO_CONSENT));
      await assert.rejects(asActor(db,ALICE,c => open(c,NO_CONSENT)),sdpError('SDP-XAT-016'));
      const created = await asActor(db,ALICE,c => open(c,BOB));
      thread = created.rows[0].id;
      assert.match(thread,/^[0-9a-f-]{36}$/);
      assert.equal((await asActor(db,BOB,c => open(c,ALICE))).rows[0].id,thread);
      assert.equal((await db.query('select count(*)::int as n from public.xat_fils where id=$1',[thread])).rows[0].n,1);
    });

    await t.test('La sessió autora envia una vegada i l’altra rep contingut per historial i nous', async () => {
      const first = (await asActor(db,ALICE,c => send(c,thread))).rows[0];
      assert.equal(first.id,MESSAGE); assert.equal(first.seq,'1'); assert.equal(first.usuari_id,ALICE);
      const retry = (await asActor(db,ALICE,c => send(c,thread))).rows[0];
      assert.equal(retry.id,first.id); assert.equal(retry.seq,first.seq);
      const history = (await asActor(db,BOB,c => c.query('select * from public.xat_historial($1,null,50)',[thread]))).rows;
      const incoming = (await asActor(db,BOB,c => c.query('select * from public.xat_nous($1,0,100)',[thread]))).rows;
      assert.equal(history.length,1); assert.equal(incoming.length,1);
      for (const rows of [history,incoming]) { assert.equal(rows[0].id,MESSAGE); assert.equal(rows[0].cos,'Missatge sintètic R21.2'); assert.equal(rows[0].usuari_id,ALICE); }
      assert.equal((await db.query('select count(*)::int as n from public.xat_missatges where id=$1',[MESSAGE])).rows[0].n,1);
      const status = (await asActor(db,ALICE,c => poll(c,thread))).rows[0].result;
      assert.equal(status.rebutPelsAltresFinsSeq,0); assert.equal(status.llegitPelsAltresFinsSeq,0);
    });

    await t.test('Rebut independent no marca lectura; la lectura posterior és monòtona', async () => {
      await db.query('update public.xat_participants set no_llegit_manual=true where fil_id=$1 and usuari_id=$2',[thread,BOB]);
      const before = (await db.query('select ultim_llegit_al from public.xat_lectures where fil_id=$1 and usuari_id=$2',[thread,BOB])).rows;
      const receipt = (await asActor(db,BOB,c => c.query('select * from public.xat_marca_rebut($1,9999)',[thread]))).rows[0];
      assert.deepEqual(receipt,{rebut_fins_seq:'1',llegit_fins_seq:'0'});
      const after = (await db.query('select ultim_llegit_al from public.xat_lectures where fil_id=$1 and usuari_id=$2',[thread,BOB])).rows;
      assert.deepEqual(after,before);
      assert.equal((await db.query('select no_llegit_manual from public.xat_participants where fil_id=$1 and usuari_id=$2',[thread,BOB])).rows[0].no_llegit_manual,true);
      let status=(await asActor(db,ALICE,c => poll(c,thread))).rows[0].result;
      assert.equal(status.rebutPelsAltresFinsSeq,1); assert.equal(status.llegitPelsAltresFinsSeq,0);
      await asActor(db,BOB,c => c.query('select * from public.xat_marca($1,1,1)',[thread]));
      await asActor(db,BOB,c => c.query('select * from public.xat_marca_rebut($1,0)',[thread]));
      status=(await asActor(db,ALICE,c => poll(c,thread))).rows[0].result;
      assert.equal(status.rebutPelsAltresFinsSeq,1); assert.equal(status.llegitPelsAltresFinsSeq,1);
      assert.equal((await db.query('select no_llegit_manual from public.xat_participants where fil_id=$1 and usuari_id=$2',[thread,BOB])).rows[0].no_llegit_manual,false);
      await assert.rejects(asActor(db,BOB,c => c.query('select * from public.xat_marca_rebut($1,-1)',[thread])),sdpError('SDP-XAT-009','22023'));
    });

    await t.test('Un membre alié no pot llegir/enviar/rebre marques ni escriure directament', async () => {
      for (const [query,params] of [
        ['select * from public.xat_historial($1,null,50)',[thread]],
        ['select * from public.xat_nous($1,0,100)',[thread]],
        ['select * from public.xat_marca_rebut($1,1)',[thread]],
        ['select public.xat_ritme($1)',[thread]]
      ]) await assert.rejects(asActor(db,EVE,c => c.query(query,params)),sdpError('SDP-XAT-006'));
      await assert.rejects(asActor(db,EVE,c => send(c,thread,'33000000-0000-4000-8000-000000000025')),sdpError('SDP-XAT-006'));
      assert.deepEqual((await asActor(db,EVE,c => c.query('select * from public.xat_missatges where fil_id=$1',[thread]))).rows,[]);
      await assert.rejects(asActor(db,ALICE,c => c.query('insert into public.xat_missatges(fil_id,usuari_id,text) values($1,$2,\'bypass\')',[thread,BOB])),error => error.code === '42501');
    });

    await t.test('Revocar RGPD impedix el directe nou, però conserva el fil ja existent per contracte', async () => {
      await asActor(db,BOB,c => c.query("select public.revoca_consentiment('rgpd_acepta')"));
      assert.equal((await db.query('select consentiment_rgpd_at from public.profiles where id=$1',[BOB])).rows[0].consentiment_rgpd_at,null);
      await assert.rejects(asActor(db,EVE,c => open(c,BOB)),sdpError('SDP-XAT-016'));
      assert.equal((await asActor(db,ALICE,c => open(c,BOB))).rows[0].id,thread);
      const sent=(await asActor(db,ALICE,c => send(c,thread,'33000000-0000-4000-8000-000000000022','Missatge després de revocació'))).rows[0];
      assert.equal(sent.seq,'2');
      const incoming=(await asActor(db,BOB,c => c.query('select * from public.xat_nous($1,1,100)',[thread]))).rows;
      assert.equal(incoming.length,1); assert.equal(incoming[0].cos,'Missatge després de revocació');
    });

    await t.test('Una aportació a section_submissions no és entrega de xat ni bústia de contacte', async () => {
      const before = (await db.query('select count(*)::int as n from public.xat_missatges')).rows[0].n;
      const write = section => asActor(db,ALICE,c => c.query(`insert into public.section_submissions(tenant_id,owner_user_id,section_id,title,payload)
        values($1,$2,$3,'Aportació sintètica R21.2','{}')`,[TOWN,ALICE,section]));
      await assert.rejects(write('contacte'),error => error.code === '42501');
      // Aportació existent inserida per la fixture administrativa: la cadena
      // històrica seleccionada no concedeix INSERT de section_submissions.
      // No s'afirma publicació autenticada ni s'inventa cap GRANT.
      await db.query(`insert into public.section_submissions(tenant_id,owner_user_id,section_id,title,payload)
        values($1,$2,'mur','Aportació sintètica R21.2','{}')`,[TOWN,ALICE]);
      assert.equal((await db.query('select count(*)::int as n from public.xat_missatges')).rows[0].n,before);
      assert.equal((await db.query('select count(*)::int as n from private.xat_push_cua')).rows[0].n,0);
    });

    await t.test('Push SQL: node apagat, inscripció Web/APNs/FCM i endpoint privat', async () => {
      const register=(who,platform,address,gesture=false) => asActor(db,who,c => c.query('select public.xat_push_desa($1,$2,null,\'ca\',$3)',[platform,address,gesture]));
      await assert.rejects(register(BOB,'web','https://fcm.googleapis.com/fcm/send/synthetic-r21-2'),sdpError('SDP-PUSH-010','55000'));
      await db.query("insert into private.ajustos(clau,valor) values('push_xat_actiu','si') on conflict(clau) do update set valor=excluded.valor");
      for (const [platform,address] of [['web','https://fcm.googleapis.com/fcm/send/synthetic-r21-2'],['ios','ab'.repeat(32)],['android','synthetic:FCM_r21_2_token_1234567890']]) await register(BOB,platform,address);
      const own=(await asActor(db,BOB,c => c.query('select id,usuari_id,tipus from public.xat_dispositius_push'))).rows;
      assert.equal(own.length,3); assert.deepEqual(own.map(row=>row.tipus).sort(),['apns','fcm','web']);
      assert.deepEqual((await asActor(db,ALICE,c => c.query('select id from public.xat_dispositius_push'))).rows,[]);
      await assert.rejects(asActor(db,BOB,c => c.query('select adreca from public.xat_dispositius_push')),error=>error.code==='42501');
      await assert.rejects(register(EVE,'web','https://fcm.googleapis.com/fcm/send/synthetic-r21-2'),sdpError('SDP-PUSH-011'));
      await assert.rejects(register(BOB,'web','https://example.invalid/push'),sdpError('SDP-PUSH-003','22023'));
    });

    await t.test('Push SQL: només servidor, autor verificat i primer despertar dins de 30 segons', async () => {
      const fresh='33000000-0000-4000-8000-000000000030';
      const old='33000000-0000-4000-8000-000000000031';
      await asActor(db,ALICE,c => send(c,thread,fresh,'Despertador sintètic'));
      await asActor(db,ALICE,c => send(c,thread,old,'Despertador caducat sintètic'));
      await db.query("update private.xat_push_cua set creat_al=now()-interval '31 seconds' where missatge_id=$1",[old]);
      const wake=(id,who,role='service_role')=>asActor(db,null,c=>c.query('select public.xat_push_desperta_v2($1,$2) as woke',[id,who]),role);
      await assert.rejects(wake(fresh,ALICE,'authenticated'),error=>error.code==='42501');
      assert.equal((await wake(fresh,BOB)).rows[0].woke,false);
      assert.equal((await wake(old,ALICE)).rows[0].woke,false);
      assert.equal((await wake(fresh,ALICE)).rows[0].woke,true);
      assert.equal((await wake(fresh,ALICE)).rows[0].woke,false);
      await assert.rejects(asActor(db,ALICE,c=>c.query('select public.xat_push_reclama_v2(50)')),error=>error.code==='42501');
    });

    await t.test('Push SQL: lease de 120 segons, reintent recuperable i ACK obsolet barrat', async () => {
      const claim=()=>asActor(db,null,c=>c.query('select public.xat_push_reclama_v2(50) as result,extract(epoch from now())::text as claim_epoch'),'service_role');
      const ack=items=>asActor(db,null,c=>c.query('select public.xat_push_confirma_v2($1::jsonb) as result',[JSON.stringify(items)]),'service_role');
      const {result:first,claim_epoch:claimEpoch}=(await claim()).rows[0];
      assert.equal(first.protocol,'lease-v2'); assert.equal(first.dispositius.length,3); assert.equal(first.treballs,6);
      for(const device of first.dispositius) {
        assert.deepEqual(Object.keys(device).sort(),['adreca','id','llengua','lliuraments','tipus']);
        assert.equal(device.lliuraments.length,2);
        for(const delivery of device.lliuraments) assert.deepEqual(Object.keys(delivery).sort(),['id','lease']);
      }
      assert.ok(!JSON.stringify(first).includes('Despertador sintètic'));
      const lease=(await db.query('select bool_and(extract(epoch from lease_fins)-$1::numeric=120) as exact from private.xat_push_lliuraments',[claimEpoch])).rows[0].exact;
      assert.equal(lease,true,'la lease usa exactament 120 segons del rellotge transaccional del servidor');
      assert.equal((await claim()).rows[0].result.treballs,0,'un altre worker no pot reclamar una lease viva');
      const previous=first.dispositius.flatMap(d=>d.lliuraments).map(d=>({...d,resultat:'acceptat'}));
      await db.query("update private.xat_push_lliuraments set lease_fins=now()-interval '1 second'");
      assert.equal((await ack(previous)).rows[0].result.obsolets,6);
      const retried=(await claim()).rows[0].result;
      assert.equal(retried.treballs,6);
      const current=retried.dispositius.flatMap(d=>d.lliuraments).map(d=>({...d,resultat:'acceptat'}));
      assert.ok(current.every(item=>previous.some(old=>old.id===item.id && old.lease!==item.lease)));
      assert.equal((await ack(previous)).rows[0].result.obsolets,6);
      const wrong=[current[0],{...current[1],extra:'invalid'}];
      await assert.rejects(ack(wrong),sdpError('SDP-PUSH-005','22023'));
      assert.equal((await db.query('select count(*)::int as n from private.xat_push_lliuraments where completat_al is not null')).rows[0].n,0,'cap ACK parcial si el lot és invàlid');
      assert.equal((await ack(current)).rows[0].result.acceptats,6);
      assert.equal((await claim()).rows[0].result.treballs,0);
      // Acceptació del proveïdor és un estat de cua, mai un rebut físic ni lectura.
      const status=(await asActor(db,ALICE,c=>poll(c,thread))).rows[0].result;
      assert.equal(status.rebutPelsAltresFinsSeq,1); assert.equal(status.llegitPelsAltresFinsSeq,1);
    });

    await t.test('Push SQL: un rebuig antic no expulsa inscripció renovada ni el compte nou', async () => {
      const id='33000000-0000-4000-8000-000000000032';
      await asActor(db,ALICE,c=>send(c,thread,id,'Renovació sintètica'));
      const claim=(await asActor(db,null,c=>c.query('select public.xat_push_reclama_v2(50) as result'),'service_role')).rows[0].result;
      const web=claim.dispositius.find(d=>d.tipus==='web');
      const native=claim.dispositius.find(d=>d.tipus==='apns');
      await asActor(db,BOB,c=>c.query("select public.xat_push_desa('web',$1,null,'ca',false)",[web.adreca]));
      const ack=items=>asActor(db,null,c=>c.query('select public.xat_push_confirma_v2($1::jsonb) as result',[JSON.stringify(items)]),'service_role');
      const renewed=(await ack(web.lliuraments.map(d=>({...d,resultat:'expulsa'})))).rows[0].result;
      assert.equal(renewed.expulsats,0); assert.equal(renewed.reintentats,1);
      assert.equal((await db.query('select usuari_id from public.xat_dispositius_push where id=$1',[web.id])).rows[0].usuari_id,BOB);
      await asActor(db,EVE,c=>c.query("select public.xat_push_desa('ios',$1,null,'ca',true)",[native.adreca]));
      const changed=(await ack(native.lliuraments.map(d=>({...d,resultat:'expulsa'})))).rows[0].result;
      assert.equal(changed.expulsats,0); assert.equal(changed.obsolets,1);
      await assert.rejects(asActor(db,EVE,c=>c.query("select public.xat_push_retira_segura('ios',$1,$2)",[native.adreca,BOB])),sdpError('SDP-PUSH-012'));
      assert.equal((await db.query('select usuari_id from public.xat_dispositius_push where id=$1',[native.id])).rows[0].usuari_id,EVE);
    });

    await t.test('L’acceptació de normes és exigida al servidor abans d’un missatge nou', async () => {
      const before=(await db.query('select ultim_seq from public.xat_fils where id=$1',[thread])).rows[0].ultim_seq;
      await db.query('delete from private.normes_acceptades where usuari_id=$1',[ALICE]);
      await assert.rejects(asActor(db,ALICE,c => send(c,thread,'33000000-0000-4000-8000-000000000026')),sdpError('SDP-MOD-428'));
      await asActor(db,ALICE,c => c.query("select public.accepta_normes_convivencia('2026-10-24')"));
      assert.equal((await db.query('select ultim_seq from public.xat_fils where id=$1',[thread])).rows[0].ultim_seq,before);
    });
    await t.test('L’SQL d’activació generat s’aplica a les migracions reals i manté les ACL', async () => {
      const temp=mkdtempSync(join(tmpdir(),'sdp-r21-2-pg-stage-'));
      const dir=join(temp,'keys'),inputs=join(temp,'inputs.env');
      const prior=(await db.query("select valor from private.ajustos where clau='push_xat_actiu'")).rows[0]?.valor;
      try {
        generateVapid(dir,'mailto:postgres-fixture@example.invalid');
        writeFileSync(inputs,`SDP_CRON_SECRET=${'x'.repeat(48)}\n`,{mode:0o600});
        const prepared=stage({root:fileURLToPath(new URL('..',import.meta.url)),dir,inputs,channels:['web']});
        assert.equal(prepared.ok,true); assert.equal(prepared.staged,true);
        const count=(await db.query('select count(*)::int as n from public.xat_missatges')).rows[0].n;
        // Executem els bytes que rebria l’operador, sense corregir ni copiar la
        // signatura del productor dins del test. La primera versió fallava ací.
        await db.query(readFileSync(join(dir,'staged/schema.sql'),'utf8'));
        assert.equal((await db.query('select count(*)::int as n from public.xat_missatges')).rows[0].n,count);
        await db.query("update private.ajustos set valor='no' where clau='push_xat_actiu'");
        await db.query(readFileSync(join(dir,'staged/activa.sql'),'utf8'));
        assert.equal((await db.query("select valor from private.ajustos where clau='push_xat_actiu'")).rows[0].valor,'si');
        const acl=(await db.query(`select
          to_regprocedure('public.xat_push_desperta_v2(uuid,uuid)') is not null as wake_present,
          to_regprocedure('public.xat_push_desperta_v2(uuid)') is null as wrong_signature_absent,
          has_function_privilege('service_role','public.xat_push_desperta_v2(uuid,uuid)','execute') as worker_wakes,
          has_function_privilege('authenticated','public.xat_push_desperta_v2(uuid,uuid)','execute') as client_wakes,
          has_function_privilege('anon','public.xat_push_desperta_v2(uuid,uuid)','execute') as anon_wakes,
          has_function_privilege('authenticated','public.xat_ritme(uuid)','execute') as member_polls,
          has_function_privilege('anon','public.xat_ritme(uuid)','execute') as anon_polls`)).rows[0];
        assert.deepEqual(acl,{wake_present:true,wrong_signature_absent:true,worker_wakes:true,client_wakes:false,anon_wakes:false,member_polls:true,anon_polls:false});
      } finally {
        if(prior===undefined) await db.query("delete from private.ajustos where clau='push_xat_actiu'");
        else await db.query("update private.ajustos set valor=$1 where clau='push_xat_actiu'",[prior]);
        rmSync(temp,{recursive:true,force:true});
      }
    });
  } finally { await cluster.close(); }
});
