import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';
import { planificaSyncAparador } from '../tooling/menjarIBeure/syncAparadorsVius.mjs';

const MIGRATION = '20261113003000_r21_9b_canal_beta_testers_i_sync_aparadors.sql';
const BASELINE = process.env.SDP_R21_BETA_BASELINE === '1';
const id = n => `29000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), OTHER_TOWN = id(2), ALICE = id(11), BOB = id(12), EVE = id(13), NO_CONSENT = id(14), DELETING = id(15), QUEUED = id(16);
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const error = (code, prefix) => e => e.code === code && (!prefix || e.message.startsWith(prefix));
async function actor(db, who, sql, params = [], role = who ? 'authenticated' : 'anon') {
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
      [who ?? '', role, JSON.stringify({ sub: who, role, aal: 'aal2' })]);
    const result = await db.query(sql, params); await db.query('commit'); return result;
  } catch (e) { await db.query('rollback'); throw e; }
}
const mine = (db, who, town = TOWN) => actor(db, who, 'select * from public.xat_fils_meus($1)', [town]);
const send = (db, who, fil, message, metadata = {}) => actor(db, who,
  "select * from public.xat_envia($1,$2,'text','Informe sintètic',null,$3)", [message, fil, metadata]);
const value = r => r.rows[0]?.v;
// R22 ronda 3 (P3) · Els WARNING que una crida deixa al client: severitat, SQLSTATE i text.
async function avisos(db, fn) {
  const rebuts = [];
  const escolta = n => { if (n.severity === 'WARNING') rebuts.push({ code: n.code, message: n.message }); };
  db.on('notice', escolta);
  try { const resultat = await fn(); return { resultat, avisos: rebuts }; }
  finally { db.removeListener('notice', escolta); }
}

test('R21.9b · Beta, adjunts i estat privat sobre PostgreSQL 18.6 real', { timeout: 120000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  try {
    const version = (await db.query('select version() as v,current_setting(\'server_version_num\') as n')).rows[0];
    assert.equal(version.n, '180006'); t.diagnostic(version.v);
    const plan = creaPlaMigracions();
    await db.query(plan.bootstrap);
    // Supabase may grant ambient Storage SELECT. Prove RLS, not an absent ACL.
    await db.query('grant select on storage.objects to anon');
    for (const migration of plan.migrations.filter(m => m.file !== MIGRATION)) {
      await db.query('begin');
      try { await db.query(migration.body); await db.query('commit'); }
      catch (e) { await db.query('rollback'); throw new Error(`baseline ${migration.file}: ${e.message}`, { cause: e }); }
    }
    await db.query("insert into public.towns(id,slug,name) values($1,'r21-beta','Poble sintètic'),($2,'r21-beta-altre','Altre poble')", [TOWN, OTHER_TOWN]);
    for (const [who, name, town, consent] of [
      [ALICE, 'Àlies públic Alícia', TOWN, true], [BOB, 'Àlies públic Bernat', TOWN, true], [EVE, 'Altre poble', OTHER_TOWN, true],
      [NO_CONSENT, 'Sense consentiment de directori', TOWN, false], [DELETING, 'Baixa de perfil', TOWN, true], [QUEUED, 'Baixa en cua', TOWN, true]
    ]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: name, tenant_id: town, accepta_rgpd: consent, rgpd: consent }]);
      await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
    }
    // Claimed entity fixture, with its actual owner trigger and memberships.
    // The production RPC intentionally refuses creating new institutional rows.
    const org = id(50);
    await db.query('insert into public.organizations(id,tenant_id,kind,name,slug,created_by) values($1,$2,\'entity\',\'Entitat pilot sintètica\',\'r21-beta-pilot\',$3)', [org, TOWN, ALICE]);
    await db.query("insert into private.ajustos(clau,valor) values('copublicacio_actor_socdepoble',$1) on conflict(clau) do update set valor=excluded.valor", [org]);
    const original = (await actor(db, ALICE, 'select * from public.obri_fil_de_pagina($1,\'entitat\',$2,null)', [TOWN, org])).rows;
    const general = original.find(r => r.tipus === 'grup').id, community = original.find(r => r.tipus === 'comunitat').id;
    const impostor = id(90);
    await db.query("insert into public.xat_fils(id,tenant_id,tipus,titol,creat_per) values($1,$2,'grup','Beta Testers',$3)", [impostor, TOWN, ALICE]);
    await db.query('insert into public.xat_participants(fil_id,usuari_id) values($1,$2)', [impostor, ALICE]);
    await db.query('update public.profiles set baixa_demanada_at=now() where id=$1', [DELETING]);
    await db.query("insert into private.baixes(user_id,purga_prevista_al) values($1,now()+interval '30 days')", [QUEUED]);
    if (!BASELINE) {
      const sql = read(`supabase/migrations/${MIGRATION}`);
      t.diagnostic(`${MIGRATION} sha256=${createHash('sha256').update(sql).digest('hex')}`);
      await db.query(sql); await db.query(sql);
    }
    let beta;
    await t.test('Una crida normal llista Beta canònic, distint de General i del grup homònim', async () => {
      const rows = (await mine(db, ALICE)).rows;
      const candidates = rows.filter(r => r.canal_clau === 'beta_testers');
      assert.equal(candidates.length, 1, 'el servidor ha de reconciliar el canal real');
      beta = candidates[0].id;
      assert.notEqual(beta, general); assert.notEqual(beta, impostor);
      assert.equal(candidates[0].comunitat_id, community); assert.equal(candidates[0].tipus, 'grup');
      assert.equal(candidates[0].subjecte_id, org); assert.equal(candidates[0].org_id, null);
    });
    if (BASELINE) return;
    await t.test('Provisió concurrent i reintents conserven un sol UUID i un participant per persona', async () => {
      const one = await cluster.connect(), two = await cluster.connect();
      const lists = await Promise.all([mine(one, BOB), mine(two, BOB)]);
      for (const result of lists) assert.equal(result.rows.find(r => r.canal_clau === 'beta_testers').id, beta);
      assert.equal((await db.query("select count(*)::int as n from public.xat_fils where tenant_id=$1 and canal_clau='beta_testers'", [TOWN])).rows[0].n, 1);
      assert.equal((await db.query('select count(*)::int as n from public.xat_participants where fil_id=$1 and usuari_id=$2', [beta, BOB])).rows[0].n, 1);
      const again = (await actor(db, ALICE, 'select * from public.obri_fil_de_pagina($1,\'entitat\',$2,null)', [TOWN, org])).rows;
      assert.equal(again.find(r => r.tipus === 'grup').id, general);
      assert.ok(!again.some(r => r.id === beta), 'l’obertura genèrica conserva General com a destí');
    });
    await t.test('Anònim, Foraster, altre tenant i baixes no entren ni lligen ni falsifiquen el canal', async () => {
      await assert.rejects(mine(db, null), error('42501'));
      for (const who of [EVE, DELETING, QUEUED]) {
        assert.ok(!(await mine(db, who)).rows.some(r => r.id === beta));
        assert.deepEqual((await actor(db, who, 'select * from public.xat_missatges where fil_id=$1', [beta])).rows, []);
        await assert.rejects(actor(db, who, 'select * from public.xat_historial($1,null,50)', [beta]), error('42501'));
        await assert.rejects(actor(db, who, 'select * from public.xat_llig_fil_de_pagina($1,null,null,50)', [beta]), error('42501'));
      }
      assert.ok(!(await mine(db, BOB, OTHER_TOWN)).rows.some(r => r.id === beta));
      assert.ok(!(await mine(db, EVE, OTHER_TOWN)).rows.some(r => r.canal_clau === 'beta_testers'), 'no inventa una entitat oficial en un altre node');
      await assert.rejects(actor(db, BOB, "insert into public.xat_fils(tenant_id,tipus,titol,canal_clau) values($1,'grup','Fals','beta_testers')", [TOWN]), error('42501'));
      await assert.rejects(actor(db, BOB, 'select private.xat_reconcilia_beta_testers($1)', [TOWN]), error('42501'));
    });
    await t.test('La lectura de grup no exigix publicar el perfil al directori', async () => {
      assert.ok((await mine(db, NO_CONSENT)).rows.some(r => r.id === beta));
      assert.equal((await db.query('select consentiment_rgpd_at from public.profiles where id=$1', [NO_CONSENT])).rows[0].consentiment_rgpd_at, null);
      const directory = (await actor(db, ALICE, 'select * from public.membres_del_poble($1,null,100)', [TOWN])).rows;
      assert.ok(!directory.some(r => r.usuari_id === NO_CONSENT));
    });
    await t.test('Autoria server, zero metadades privades injectades i reintent de missatge idempotent', async () => {
      await db.query("update public.profiles set is_public=false,bio='BIO_PRIVADA_R21',presentacio_html='<p>perfil-privat@example.invalid</p>' where id=$1", [ALICE]);
      assert.deepEqual((await actor(db, BOB, 'select * from public.profiles where id=$1', [ALICE])).rows, []);
      const forged = { autorNom: 'Identitat falsa', email: 'privat@example.invalid', lat: 38.5, adjunt: { mime: 'image/svg+xml' } };
      const first = (await send(db, ALICE, beta, id(100), forged)).rows[0];
      assert.equal(first.autor_nom, 'Àlies públic Alícia');
      assert.equal((await send(db, ALICE, beta, id(100), forged)).rows[0].seq, first.seq);
      for (const query of ['select * from public.xat_historial($1,null,50)', 'select * from public.xat_nous($1,0,50)']) {
        const message = (await actor(db, BOB, query, [beta])).rows.find(r => r.id === id(100));
        assert.equal(message.autor_nom, 'Àlies públic Alícia'); assert.deepEqual(message.metadades, {});
        assert.ok(!JSON.stringify(message).includes('privat@example.invalid'));
        assert.ok(!JSON.stringify(message).includes('BIO_PRIVADA_R21'));
      }
      await assert.rejects(actor(db, null, 'select * from public.xat_historial($1,null,50)', [beta]), error('42501'));
    });
    await t.test('Arxiu, silenci, marques i eixida es conserven en reconciliar i reaplicar', async () => {
      await db.query("insert into public.organization_memberships(organization_id,tenant_id,user_id,role) values($1,$2,$3,'admin')", [org, TOWN, BOB]);
      assert.equal((await mine(db, BOB)).rows.find(r => r.id === beta).rol, 'admin');
      await db.query("update public.organization_memberships set role='member' where organization_id=$1 and user_id=$2", [org, BOB]);
      assert.equal((await actor(db, BOB, 'select private.es_admin_del_fil($1) as v', [beta])).rows[0].v, false, 'la revocació no espera el refresc del llistat');
      assert.equal((await mine(db, BOB)).rows.find(r => r.id === beta).rol, 'membre');
      await actor(db, BOB, "select public.xat_silencia($1,'sempre')", [beta]);
      await db.query("update public.xat_participants set arxivat_al='2026-11-01Z',llegit_fins_seq=1,rebut_fins_seq=1 where fil_id=$1 and usuari_id=$2", [beta, BOB]);
      const before = (await mine(db, BOB)).rows.find(r => r.id === beta);
      await db.query(read(`supabase/migrations/${MIGRATION}`));
      const after = (await mine(db, BOB)).rows.find(r => r.id === beta);
      for (const key of ['arxivat_al', 'silenciat_fins_al', 'llegit_fins_seq', 'rebut_fins_seq']) assert.deepEqual(after[key], before[key]);
      await db.query('update public.xat_participants set visible_fins_seq=1,eixit_al=now() where fil_id=$1 and usuari_id=$2', [beta, BOB]);
      assert.ok(!(await mine(db, BOB)).rows.some(r => r.id === beta));
      assert.equal((await db.query('select visible_fins_seq from public.xat_participants where fil_id=$1 and usuari_id=$2', [beta, BOB])).rows[0].visible_fins_seq, '1');
      await assert.rejects(send(db, BOB, beta, id(101)), error('42501'));
    });
    await t.test('Una baixa posterior revoca també un participant existent i un visitant', async () => {
      await db.query('update public.profiles set baixa_demanada_at=now() where id=$1', [ALICE]);
      assert.ok(!(await mine(db, ALICE)).rows.some(r => r.id === beta));
      await assert.rejects(send(db, ALICE, beta, id(102)), error('42501'));
      await assert.rejects(actor(db, ALICE, 'select * from public.xat_llig_fil_de_pagina($1,null,null,50)', [beta]), error('42501'));
      await db.query('update public.profiles set baixa_demanada_at=null where id=$1', [ALICE]);
      await db.query('delete from public.town_memberships where town_id=$1 and user_id=$2', [TOWN, ALICE]);
      assert.ok(!(await mine(db, ALICE)).rows.some(r => r.id === beta));
      await assert.rejects(send(db, ALICE, beta, id(103)), error('42501'));
      await db.query('insert into public.town_memberships(town_id,user_id) values($1,$2)', [TOWN, ALICE]);
    });
    await t.test('El llistat nou conserva el fil propi R21.4, el rebut automàtic i les marques E2EE', async () => {
      const own = value(await actor(db, ALICE, 'select public.crea_fil_directe($1,$2,null) as v', [TOWN, ALICE]));
      await send(db, ALICE, own, id(104));
      const row = (await mine(db, ALICE)).rows.find(r => r.id === own);
      assert.equal(row.participants, 1); assert.equal(row.canal_clau, null);
      assert.equal(row.llegit_fins_seq, row.ultim_seq); assert.equal(row.rebut_fins_seq, row.ultim_seq);
      assert.equal(row.altres[0].id, ALICE); assert.equal(row.epoca_actual, 0);
      assert.ok(Object.hasOwn(row, 'cap_epoca_hash')); assert.ok(Object.hasOwn(row, 'e2ee_des_de_seq'));
    });
    // R22 (sql-04) · Rotar el principal institucional deixa el canal antic incoherent:
    // la safata de cada membre continua amb els seus fils, sense provisió a mitges.
    await t.test('Rotar el principal institucional no fa caure la safata: Beta existent i fil propi continuen', async () => {
      const rotada = id(51);
      const propi = (await db.query('select id from public.xat_fils where propi_usuari_id=$1', [ALICE])).rows[0].id;
      await db.query("insert into public.organizations(id,tenant_id,kind,name,slug,created_by) values($1,$2,'entity','Entitat rotada sintètica','r21-beta-rotada',$3)", [rotada, TOWN, ALICE]);
      await db.query("update private.ajustos set valor=$1 where clau='copublicacio_actor_socdepoble'", [rotada]);
      try {
        const { resultat, avisos: rebuts } = await avisos(db, () => mine(db, ALICE));
        const rows = resultat.rows;
        // R22 ronda 3 (P3) · L'avís porta el SQLSTATE real (23514) i l'etiqueta SDP-XAT-018 és la seua.
        assert.deepEqual(rebuts.map(a => a.code), ['23514']);
        assert.match(rebuts[0].message, /^SDP-XAT-018: .*SQLSTATE 23514/);
        assert.ok(rows.some(r => r.id === beta), 'el canal Beta existent continua a la safata');
        assert.ok(rows.some(r => r.id === propi), 'el fil propi continua a la safata');
        assert.equal((await db.query('select count(*)::int as n from public.xat_fils where tenant_id=$1 and subjecte_id=$2', [TOWN, rotada])).rows[0].n, 0, 'cap provisió a mitges');
        assert.equal((await db.query("select subjecte_id from public.xat_fils where id=$1", [beta])).rows[0].subjecte_id, org);
      } finally {
        await db.query("update private.ajustos set valor=$1 where clau='copublicacio_actor_socdepoble'", [org]);
        await db.query('delete from public.organizations where id=$1', [rotada]);
      }
      assert.ok((await mine(db, ALICE)).rows.some(r => r.id === beta));
    });
    // R22 (sql-06) · Un llistat periòdic d'un membre ja reconciliat no pren el pany per poble;
    // només la provisió o un canvi de rol el prenen.
    await t.test('El llistat d’un membre ja reconciliat no pren el pany advisory per poble; la reconciliació sí', async () => {
      const panys = async (who) => {
        await db.query('begin');
        try {
          await db.query('set local role authenticated');
          await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)",
            [who, JSON.stringify({ sub: who, role: 'authenticated', aal: 'aal2' })]);
          const files = (await db.query('select * from public.xat_fils_meus($1)', [TOWN])).rows;
          const n = (await db.query("select count(*)::int as n from pg_locks where locktype='advisory' and pid=pg_backend_pid()")).rows[0].n;
          await db.query('commit'); return { files, n };
        } catch (e) { await db.query('rollback'); throw e; }
      };
      const rapid = await panys(ALICE);
      assert.ok(rapid.files.some(r => r.id === beta)); assert.equal(rapid.n, 0, 'cap pany advisory en el camí ràpid');
      const rol = (await db.query('select rol from public.xat_participants where fil_id=$1 and usuari_id=$2', [beta, ALICE])).rows[0].rol;
      await db.query("update public.xat_participants set rol='membre' where fil_id=$1 and usuari_id=$2", [beta, ALICE]);
      const reconcilia = await panys(ALICE);
      assert.equal(reconcilia.n, 1, 'la reconciliació del rol pren el pany per poble');
      assert.equal((await db.query('select rol from public.xat_participants where fil_id=$1 and usuari_id=$2', [beta, ALICE])).rows[0].rol, rol);
      assert.equal((await panys(ALICE)).n, 0);
    });
    // R22 ronda 3 (P3) · Només els dos errors de configuració previstos es contenen, cadascun amb el seu SQLSTATE.
    await t.test('Un pany per poble ocupat ajorna Beta amb el seu SQLSTATE (55P03) i sense l’etiqueta SDP-XAT-018', async () => {
      const rol = (await db.query('select rol from public.xat_participants where fil_id=$1 and usuari_id=$2', [beta, ALICE])).rows[0].rol;
      await db.query("update public.xat_participants set rol='membre' where fil_id=$1 and usuari_id=$2", [beta, ALICE]);
      const altra = await cluster.connect();
      try {
        await altra.query("select pg_advisory_lock(hashtextextended('xat:subjecte:'||$1::text||':entitat:'||$2::text,0))", [TOWN, org]);
        const { resultat, avisos: rebuts } = await avisos(db, async () => {
          await db.query('begin');
          try {
            await db.query('set local role authenticated');
            await db.query("set local lock_timeout='150ms'");
            await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)",
              [ALICE, JSON.stringify({ sub: ALICE, role: 'authenticated', aal: 'aal2' })]);
            const files = (await db.query('select * from public.xat_fils_meus($1)', [TOWN])).rows;
            await db.query('commit'); return files;
          } catch (e) { await db.query('rollback'); throw e; }
        });
        assert.ok(resultat.some(r => r.id === beta), 'la safata continua llistant el canal Beta existent');
        assert.deepEqual(rebuts.map(a => a.code), ['55P03']);
        assert.match(rebuts[0].message, /SQLSTATE 55P03/); assert.doesNotMatch(rebuts[0].message, /SDP-XAT-018/);
        assert.equal((await db.query('select rol from public.xat_participants where fil_id=$1 and usuari_id=$2', [beta, ALICE])).rows[0].rol, 'membre', 'cap reconciliació a mitges');
      } finally {
        await altra.query("select pg_advisory_unlock_all()"); await altra.end();
      }
      await mine(db, ALICE);
      assert.equal((await db.query('select rol from public.xat_participants where fil_id=$1 and usuari_id=$2', [beta, ALICE])).rows[0].rol, rol, 'el llistat següent reprén la reconciliació');
    });
    await t.test('Qualsevol altre error de la reconciliació Beta es propaga amb el seu SQLSTATE real', async () => {
      const rol = (await db.query('select rol from public.xat_participants where fil_id=$1 and usuari_id=$2', [beta, ALICE])).rows[0].rol;
      await db.query("update public.xat_participants set rol='membre' where fil_id=$1 and usuari_id=$2", [beta, ALICE]);
      await db.query(`create function public.r22_prova_falla_beta() returns trigger language plpgsql as $$
        begin
          if new.fil_id = '${beta}'::uuid and new.rol is distinct from old.rol then
            raise exception '%', current_setting('r22.prova_missatge') using errcode = current_setting('r22.prova_codi');
          end if;
          return new;
        end $$;
        create trigger z_r22_prova_falla_beta before update on public.xat_participants for each row execute function public.r22_prova_falla_beta()`);
      try {
        // Una serialització, un deadlock o un CHECK que no és SDP-XAT-018 no s'amaguen com a configuració.
        for (const [codi, missatge] of [['40001', 'serialització de prova'], ['40P01', 'interbloqueig de prova'], ['23514', 'una altra comprovació de prova']]) {
          await db.query("select set_config('r22.prova_codi',$1,false),set_config('r22.prova_missatge',$2,false)", [codi, missatge]);
          const { resultat, avisos: rebuts } = await avisos(db, () => mine(db, ALICE).then(() => null, e => e));
          assert.ok(resultat instanceof Error, `${codi}: la safata ha de rebre l’error`);
          assert.equal(resultat.code, codi); assert.equal(resultat.message, missatge);
          assert.deepEqual(rebuts, [], `${codi}: cap avís que el disfresse`);
        }
      } finally {
        await db.query('drop trigger z_r22_prova_falla_beta on public.xat_participants; drop function public.r22_prova_falla_beta()');
      }
      await mine(db, ALICE);
      assert.equal((await db.query('select rol from public.xat_participants where fil_id=$1 and usuari_id=$2', [beta, ALICE])).rows[0].rol, rol);
    });
    await t.test('PNG, JPEG i WebP només publiquen amb reserva i objecte Storage propis i metadata exacta', async () => {
      for (const [n, mime] of [[200, 'image/png'], [201, 'image/jpeg'], [202, 'image/webp']]) {
        const reserved = value(await actor(db, ALICE, 'select public.xat_reserva_adjunt($1,$2,1024,$3,null) as v', [id(n), beta, mime]));
        assert.equal(reserved.ruta, id(n)); assert.equal(reserved.pujat, false);
        await db.query("insert into storage.objects(bucket_id,name,owner_id,version,metadata) values('xat_adjunts',$1,$2,'v1',$3)", [id(n), ALICE, { mimetype: mime, size: 1024 }]);
        const receipt = value(await actor(db, ALICE, 'select public.xat_publica_adjunt($1,null,null) as v', [id(n)]));
        assert.equal(receipt.metadades.adjunt.mime, mime); assert.equal(receipt.metadades.adjunt.bytes, 1024);
        assert.deepEqual(Object.keys(receipt.metadades.adjunt).sort(), ['bytes', 'duradaMs', 'id', 'mime'].sort());
        const replay = value(await actor(db, ALICE, 'select public.xat_publica_adjunt($1,null,null) as v', [id(n)]));
        assert.equal(replay.id, receipt.id);
      }
      await assert.rejects(actor(db, ALICE, 'select public.xat_reserva_adjunt($1,$2,2000001,\'image/png\',null)', [id(203), beta]), error('23514'));
      await assert.rejects(actor(db, ALICE, 'select public.xat_reserva_adjunt($1,$2,1024,\'image/svg+xml\',null)', [id(204), beta]), error('22023'));
      const bucket = (await db.query("select public,file_size_limit,allowed_mime_types from storage.buckets where id='xat_adjunts'")).rows[0];
      assert.equal(bucket.public, false); assert.equal(bucket.file_size_limit, '20000000');
      assert.ok(bucket.allowed_mime_types.includes('image/png')); assert.ok(bucket.allowed_mime_types.includes('application/octet-stream'));
    });
    await t.test('Una reserva no legitima MIME/bytes/propietari falsos ni dona llistat anònim', async () => {
      const attachment = id(210);
      await actor(db, ALICE, "select public.xat_reserva_adjunt($1,$2,1024,'image/png',null)", [attachment, beta]);
      // The actual final-write trigger rejects the bad object before publication.
      for (const [owner, metadata] of [[EVE, { mimetype: 'image/png', size: 1024 }],
        [ALICE, { mimetype: 'image/jpeg', size: 1024 }], [ALICE, { mimetype: 'image/png', size: 1025 }]]) {
        await assert.rejects(db.query("insert into storage.objects(bucket_id,name,owner_id,version,metadata) values('xat_adjunts',$1,$2,'v1',$3)",
          [attachment, owner, metadata]), error('22023'));
      }
      await assert.rejects(actor(db, ALICE, 'select public.xat_publica_adjunt($1,null,null)', [attachment]), error('22023'));
      for (const who of [null, EVE]) {
        const result = await actor(db, who, "select * from storage.objects where bucket_id='xat_adjunts'").catch(e => e);
        if (result instanceof Error) assert.equal(result.code, '42501'); else assert.deepEqual(result.rows, []);
      }
      assert.equal((await db.query("select private.xat_maxim_adjunt('application/octet-stream') as n")).rows[0].n, '20000000');
    });
    const SOURCE = id(300), UNICODE_SOURCE = id(301), STRESS_SOURCE = id(302), origin = 'https://botiga.example.org';
    const source = { source_id: SOURCE, canonical_origin: origin, sync_consent: true, consented_at: '2026-11-12T00:00:00Z', enabled: true };
    const product = (n, price = '1250', stock = true) => ({ id: n, name: `Producte sintètic ${n}`, permalink: `${origin}/producte/${n}/`,
      prices: { currency_code: 'EUR', currency_minor_unit: 2, price }, is_in_stock: stock });
    const state = async () => value(await db.query(`select jsonb_build_object('state_version',s.state_version,
      'last_complete_scan_date',s.last_complete_scan_date,'last_complete_scan_digest',s.last_complete_scan_digest,
      'products',coalesce((select jsonb_agg(jsonb_build_object('external_product_id',p.external_product_id,
        'external_source_url',p.external_source_url,'title',p.title,'price_cents',p.price_cents,'currency',p.currency,
        'in_stock',p.in_stock,'status',p.status,'missing_streak',p.missing_streak,'last_seen_date',p.last_seen_date,
        'last_missing_scan_date',p.last_missing_scan_date,'proposed_label',p.proposed_label,'approved_at',p.approved_at)
        order by p.external_product_id) from private.aparadors_sync_products p where p.source_id=s.id),'[]'::jsonb)) as v
      from private.aparadors_sync_sources s where s.id=$1`, [SOURCE]));
    const build = async (day, products, status = 200) => planificaSyncAparador({ source, observedOn: day, state: await state(),
      capture: { format: 'woocommerce', complete: true, pages: [{ url: `${origin}/wp-json/wc/store/v1/products?page=1&per_page=100`,
        status, content_type: 'application/json', page: 1, per_page: 100, total: products.length, total_pages: 1, body: JSON.stringify(products) }] } });
    const apply = (plan, connection = db) => actor(connection, null, 'select public.aparadors_sync_registra_pla($1) as v', [JSON.stringify(plan)], 'service_role');
    const publicBefore = (await db.query('select (select count(*) from public.app_content)::int as content,(select count(*) from public.section_submissions)::int as submissions')).rows[0];
    let initial;
    await t.test('El motor pur real crea pending_review només al registre privat, amb consentiment i ACL de servei', async () => {
      await db.query('insert into private.aparadors_sync_sources(id,tenant_id,owner_user_id,canonical_origin,consented_at,enabled) values($1,$2,$3,$4,$5,true)',
        [SOURCE, TOWN, NO_CONSENT, origin, source.consented_at]);
      initial = (await build('2026-11-13', [product(123)])).plan;
      assert.equal(value(await apply(initial)).aplicat, true);
      assert.equal((await state()).products[0].status, 'pending_review'); assert.equal((await state()).products[0].approved_at, null);
      for (const who of [null, ALICE, EVE]) {
        await assert.rejects(actor(db, who, 'select public.aparadors_sync_registra_pla($1)', [initial]), error('42501'));
        await assert.rejects(actor(db, who, 'select * from private.aparadors_sync_sources'), error('42501'));
      }
      await assert.rejects(actor(db, null, "update private.aparadors_sync_sources set enabled=true", [], 'service_role'), error('42501'));
      // El servei només entra per l'RPC: cap lectura directa del registre privat, tampoc amb BYPASSRLS.
      await assert.rejects(actor(db, null, 'select count(*)::int as n from private.aparadors_sync_products', [], 'service_role'), error('42501'));
      assert.equal((await db.query('select count(*)::int as n from private.aparadors_sync_products where source_id=$1', [SOURCE])).rows[0].n, 1);
    });
    await t.test('ACK perdut, recalculació sense canvis i dues crides concurrents no dupliquen estat ni auditoria', async () => {
      const before = await state();
      assert.equal(value(await apply(initial)).replay, true);
      const noOp = (await build('2026-11-13', [product(123)])).plan;
      assert.equal(noOp.product_changes.length, 0); assert.equal(value(await apply(noOp)).replay, true);
      const next = (await build('2026-11-14', [product(123, '9999', false)])).plan;
      assert.equal(next.product_changes[0].mode, 'observe', 'pending_review no admet canvi automàtic de preu');
      const one = await cluster.connect(), two = await cluster.connect();
      const receipts = (await Promise.all([apply(next, one), apply(next, two)])).map(value);
      assert.equal(receipts.filter(r => r.aplicat).length, 1); assert.equal(receipts.filter(r => r.replay).length, 1);
      assert.equal((await state()).state_version, before.state_version + 1);
      assert.equal((await state()).products[0].price_cents, 1250); assert.equal((await state()).products[0].in_stock, true);
      assert.equal((await db.query('select count(*)::int as n from private.aparadors_sync_events where source_id=$1', [SOURCE])).rows[0].n, 1);
      const forgedReplay = structuredClone(next); forgedReplay.product_changes[0].state.price_cents = 999;
      await assert.rejects(apply(forgedReplay), error('40001'));
    });
    await t.test('Aprovació explícita i canvi de preu/stock només afecten el registre, sense reescriure la fitxa', async () => {
      await db.query('begin');
      await db.query("update private.aparadors_sync_products set status='active',approved_at='2026-11-14T01:00:00Z' where source_id=$1 and external_product_id='woo:123'", [SOURCE]);
      await db.query('update private.aparadors_sync_sources set state_version=state_version+1 where id=$1', [SOURCE]); await db.query('commit');
      const next = (await build('2026-11-15', [product(123, '1301', false), product(456, '900')])).plan;
      assert.deepEqual(next.events.map(e => e.kind).sort(), ['new_product_detected', 'price_changed', 'stock_changed']);
      await apply(next);
      const row = (await state()).products.find(p => p.external_product_id === 'woo:123');
      assert.equal(row.price_cents, 1301); assert.equal(row.in_stock, false); assert.equal(row.status, 'active');
      assert.equal(row.title, 'Producte sintètic 123');
      assert.deepEqual((await db.query('select (select count(*) from public.app_content)::int as content,(select count(*) from public.section_submissions)::int as submissions')).rows[0], publicBefore);
    });
    await t.test('Error HTTP i absència en dues lectures completes generen proposta persistent, mai baixa pública', async () => {
      await apply((await build('2026-11-16', [product(456, '900')])).plan);
      assert.equal((await state()).products.find(p => p.external_product_id === 'woo:123').missing_streak, 1);
      const before = await state(); const rejected = (await build('2026-11-17', [], 503)).plan;
      assert.equal(rejected.scan.status, 'rejected'); assert.equal(value(await apply(rejected)).rebutjat, true);
      assert.deepEqual(await state(), before);
      await apply((await build('2026-11-18', [product(456, '900')])).plan);
      let row = (await db.query("select status,missing_streak,proposed_status from private.aparadors_sync_products where source_id=$1 and external_product_id='woo:123'", [SOURCE])).rows[0];
      assert.deepEqual(row, { status: 'active', missing_streak: 2, proposed_status: 'seasonal_hidden' });
      await apply((await build('2026-11-19', [product(456, '900')])).plan);
      row = (await db.query("select proposed_status from private.aparadors_sync_products where source_id=$1 and external_product_id='woo:123'", [SOURCE])).rows[0];
      assert.equal(row.proposed_status, 'seasonal_hidden', 'el tercer dia no perd la proposta pendent');
      await db.query("update private.aparadors_sync_products set status='seasonal_hidden' where source_id=$1 and external_product_id='woo:123'", [SOURCE]);
      await db.query('update private.aparadors_sync_sources set state_version=state_version+1 where id=$1', [SOURCE]);
      const back = (await build('2026-11-20', [product(123, '1301', false), product(456, '900')])).plan;
      assert.ok(back.events.some(e => e.kind === 'product_returned_to_source')); await apply(back);
      row = (await db.query("select status,missing_streak,proposed_status from private.aparadors_sync_products where source_id=$1 and external_product_id='woo:123'", [SOURCE])).rows[0];
      assert.deepEqual(row, { status: 'seasonal_hidden', missing_streak: 0, proposed_status: null });
    });
    await t.test('CAS, URL, coerció, cobertura i payload privat adversaris fallen amb rollback íntegre', async () => {
      const next = (await build('2026-11-21', [product(123, '1400', false), product(456, '900')])).plan;
      const before = await state();
      const mutations = [
        p => { p.expected_state_version--; },
        p => { p.product_changes[0].external_source_url = 'https://altre.example.org/producte/'; },
        p => { p.product_changes[0].external_source_url += '\n'; },
        p => { p.product_changes[0].external_source_url += '#fragment'; },
        p => { p.product_changes[0].state.price_cents = '1400'; },
        p => { p.product_changes[0].state.email = 'privat@example.invalid'; },
        p => { p.product_changes.pop(); },
        p => { p.scan.product_count = 100; },
        p => { p.events = []; },
        p => { p.events[0].event_key = 'a'.repeat(64); },
        p => { p.events[0].before = { price_cents: 1 }; },
        p => { p.events[0].after = { email: 'privat@example.invalid' }; }
      ];
      for (const mutate of mutations) {
        const bad = structuredClone(next); mutate(bad);
        await assert.rejects(apply(bad), e => ['22023', '40001'].includes(e.code));
        assert.deepEqual(await state(), before);
      }
      const empty = structuredClone(next); empty.scan.product_count = 0; empty.product_changes = []; empty.events = [];
      await assert.rejects(apply(empty), error('22023')); assert.deepEqual(await state(), before);
      for (const primitive of [null, true, 8, 'text', [], { schema: 'sdp.aparadors-sync.plan.v1' }]) {
        await assert.rejects(apply(primitive), error('22023')); assert.deepEqual(await state(), before);
      }
    });
    await t.test('Origen HTTPS real i límits Unicode coincidixen entre motor, hash i PostgreSQL', async () => {
      for (const badOrigin of ['http://botiga.example.org', 'https://127.0.0.1', 'https://localhost',
        'https://botiga.example.org:444', 'https://dos..example.org', 'https://servidor.local']) {
        await assert.rejects(db.query('insert into private.aparadors_sync_sources(tenant_id,owner_user_id,canonical_origin) values($1,$2,$3)',
          [TOWN, NO_CONSENT, badOrigin]), error('23514'));
      }
      const unicodeOrigin = 'https://unicode.example.org';
      await db.query('insert into private.aparadors_sync_sources(id,tenant_id,owner_user_id,canonical_origin,consented_at,enabled) values($1,$2,$3,$4,$5,true)',
        [UNICODE_SOURCE, TOWN, NO_CONSENT, unicodeOrigin, source.consented_at]);
      const result = planificaSyncAparador({ source: { ...source, source_id: UNICODE_SOURCE, canonical_origin: unicodeOrigin },
        observedOn: '2026-11-13', state: { state_version: 0, last_complete_scan_date: null, last_complete_scan_digest: null, products: [] },
        capture: { format: 'woocommerce', complete: true, pages: [{ url: `${unicodeOrigin}/wp-json/wc/store/v1/products?page=1&per_page=100`,
          status: 200, content_type: 'application/json', page: 1, per_page: 100, total: 1, total_pages: 1,
          body: JSON.stringify([{ ...product(1), name: '🫒'.repeat(301), permalink: `${unicodeOrigin}/producte/1/` }]) }] } });
      assert.equal(value(await apply(result.plan)).aplicat, true);
      const row = (await db.query('select char_length(title)::int as title_chars,char_length(proposed_label)::int as label_chars from private.aparadors_sync_products where source_id=$1', [UNICODE_SOURCE])).rows[0];
      assert.deepEqual(row, { title_chars: 300, label_chars: 80 });
    });
    await t.test('El màxim de 2.000 productes manté correspondència d’auditoria i refusa 2.001 abans d’escriure', async () => {
      const stressOrigin = 'https://stress.example.org';
      await db.query('insert into private.aparadors_sync_sources(id,tenant_id,owner_user_id,canonical_origin,consented_at,enabled) values($1,$2,$3,$4,$5,true)',
        [STRESS_SOURCE, TOWN, NO_CONSENT, stressOrigin, source.consented_at]);
      const pages = Array.from({ length: 20 }, (_x, pageIndex) => ({ url: `${stressOrigin}/wp-json/wc/store/v1/products?page=${pageIndex + 1}&per_page=100`,
        status: 200, content_type: 'application/json', page: pageIndex + 1, per_page: 100, total: 2000, total_pages: 20,
        body: JSON.stringify(Array.from({ length: 100 }, (_y, index) => {
          const n = pageIndex * 100 + index + 1; return { ...product(n), permalink: `${stressOrigin}/producte/${n}/` };
        })) }));
      const result = planificaSyncAparador({ source: { ...source, source_id: STRESS_SOURCE, canonical_origin: stressOrigin },
        observedOn: '2026-11-13', state: { state_version: 0, last_complete_scan_date: null, last_complete_scan_digest: null, products: [] },
        capture: { format: 'woocommerce', complete: true, pages } });
      const tooMany = structuredClone(result.plan); tooMany.product_changes.push(structuredClone(tooMany.product_changes[0]));
      await assert.rejects(apply(tooMany), error('22023'));
      assert.equal((await db.query('select count(*)::int as n from private.aparadors_sync_products where source_id=$1', [STRESS_SOURCE])).rows[0].n, 0);
      const started = performance.now(); assert.equal(value(await apply(result.plan)).aplicat, true);
      t.diagnostic(JSON.stringify({ maximum_products: 2000, maximum_events: result.plan.events.length, sql_elapsed_ms: Math.round(performance.now() - started) }));
      assert.equal((await db.query('select count(*)::int as n from private.aparadors_sync_events where source_id=$1', [STRESS_SOURCE])).rows[0].n, 2000);
    });
    await t.test('Reaplicar amb dades i rebuts reals no els altera ni duplica polítiques o ACL', async () => {
      const snapshot = () => db.query(`select jsonb_build_object('sources',(select jsonb_agg(to_jsonb(t) order by id) from private.aparadors_sync_sources t),
        'products',(select jsonb_agg(to_jsonb(t) order by source_id,external_product_id) from private.aparadors_sync_products t),
        'events',(select jsonb_agg(to_jsonb(t) order by event_key) from private.aparadors_sync_events t),
        'receipts',(select jsonb_agg(to_jsonb(t) order by source_id,observed_on) from private.aparadors_sync_aplicacions t)) as v`);
      const before = value(await snapshot()); await db.query(read(`supabase/migrations/${MIGRATION}`));
      assert.deepEqual(value(await snapshot()), before);
      assert.equal((await db.query("select count(*)::int as n from pg_policies where schemaname='private' and tablename like 'aparadors\\_sync\\_%'")).rows[0].n, 0);
      assert.equal((await db.query(`select count(*)::int as n from pg_class c join pg_namespace s on s.oid=c.relnamespace
        where s.nspname='private' and c.relname like 'aparadors\\_sync\\_%' and c.relkind='r' and c.relrowsecurity
          and not has_table_privilege('service_role',c.oid,'select,insert,update,delete')`)).rows[0].n, 4);
      assert.equal((await db.query("select has_function_privilege('anon','public.aparadors_sync_registra_pla(jsonb)','execute') as v")).rows[0].v, false);
    });
    await t.test('Retirada del consentiment frena fins i tot replays i l’esborrat del compte purga tots els registres', async () => {
      await db.query('update private.aparadors_sync_sources set consented_at=null where id=$1', [SOURCE]);
      await assert.rejects(apply(initial), error('42501'));
      await db.query('update private.aparadors_sync_sources set consented_at=$2,enabled=false where id=$1', [SOURCE, source.consented_at]);
      await assert.rejects(apply(initial), error('42501'));
      await db.query('delete from auth.users where id=$1', [NO_CONSENT]);
      for (const table of ['sources', 'products', 'events', 'aplicacions']) {
        const column = table === 'sources' ? 'id' : 'source_id';
        assert.equal((await db.query(`select count(*)::int as n from private.aparadors_sync_${table} where ${column}=any($1::uuid[])`, [[SOURCE, UNICODE_SOURCE, STRESS_SOURCE]])).rows[0].n, 0);
      }
    });
    t.diagnostic(JSON.stringify({ schema: 'sdp.r21-9b.pg-evidence.v1', server_version_num: version.n,
      catalogue_migrations: plan.migrations.length, baseline_mode: BASELINE, remote_mutations: 0,
      limits: { image_bytes: 2000000, encrypted_bytes: 20000000 }, decoded_image_bytes_tested: false }));
  } finally { await cluster.close(); }
});
