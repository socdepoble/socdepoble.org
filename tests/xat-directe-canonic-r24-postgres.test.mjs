/* R24 · IDEA-260 (a), costat del servidor. La migració 20261114060000 sobre
   PostgreSQL 18.6 real, amb tot el catàleg anterior en l'ordre del
   verificador (creaPlaMigracions), aplicada dues vegades seguides amb un rol
   SENSE superusuari (com l'editor SQL de Supabase) i amb els privilegis per
   defecte de Supabase (tota funció nova executable per anon i PUBLIC si no es
   revoca). Llavor sintètica directament a les taules, com faria un fil
   inserit pel servidor o a mà: dos directes Alícia↔Bernat amb missatges
   intercalats, una resposta d'un fil a l'altre, un adjunt, una fila de la cua
   d'avisos, una denúncia, lectures, marques i estat; un duplicat buit
   Alícia↔Carme; una parella amb E2EE, una amb «buidat», una lligada a la IAIA
   i una amb missatges temporals diferents; un canal d'entitat
   amb Alícia de gestora; la mateixa parella en un altre poble. Cap servei
   remot. Amb SDP_R24_XAT_BASELINE=1 la migració no s'aplica i les mateixes
   assercions s'avaluen sobre l'estat vell (prova en roig). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const MIGRATION = '20261114060000_r24_xat_directe_canonic_i_reconciliacio.sql';
const BASELINE = process.env.SDP_R24_XAT_BASELINE === '1';
const id = n => `24000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TOWN = id(1), ALTRE = id(2);
const ALICE = id(11), BOB = id(12), CAROL = id(13), DAVE = id(14), EVE = id(15), FRANK = id(16);
const A = id(101), B = id(102), C1 = id(103), C2 = id(104), E1 = id(105), E2 = id(106), V1 = id(107), V2 = id(108);
const I1 = id(109), I2 = id(110), T1 = id(111), T2 = id(112);
const PENDENTS = [E1, E2, V1, V2, I1, I2, T1, T2];
const M = n => id(200 + n);
const ADJ = id(301);
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const B64_32 = Buffer.alloc(32, 0xab).toString('base64url');
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

async function asActor(db, who, fn, role = who ? 'authenticated' : 'anon') {
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
      [who ?? '', role, JSON.stringify({ sub: who, role, aal: 'aal1' })]);
    const result = await fn(db); await db.query('commit'); return result;
  } catch (e) { await db.query('rollback'); throw e; }
}
const actor = (db, who, sql, params = [], role) => asActor(db, who, c => c.query(sql, params), role);
const crea = (db, who, altre, town = TOWN) => actor(db, who, 'select public.crea_fil_directe($1,$2,null) as id', [town, altre]).then(r => r.rows[0].id);
const envia = (db, who, fil, msg, text) => actor(db, who, "select * from public.xat_envia($1,$2,'text',$3,null,'{}'::jsonb)", [msg, fil, text]);
const meus = (db, who) => actor(db, who, 'select * from public.xat_fils_meus($1)', [TOWN]).then(r => r.rows);

async function directe(db, fil, creat, a, b, town = TOWN) {
  await db.query("insert into public.xat_fils(id,tenant_id,creat_per,tipus,creat_al,actualitzat_al) values($1,$2,$3,'directe',$4,$4)", [fil, town, a, creat]);
  await db.query('insert into public.xat_participants(fil_id,usuari_id,creat_al) values($1,$2,$4),($1,$3,$4)', [fil, a, b, creat]);
}
/** Fils personals de dues persones (dos participants, sense entitat), del més antic al més nou. */
const filsDeParella = async (db, a, b, town = TOWN) => (await db.query(`select f.id from public.xat_fils f
  where f.tenant_id=$3 and f.tipus='directe' and f.org_id is null
    and (select count(*) from public.xat_participants p where p.fil_id=f.id)=2
    and exists(select 1 from public.xat_participants p where p.fil_id=f.id and p.usuari_id=$1)
    and exists(select 1 from public.xat_participants p where p.fil_id=f.id and p.usuari_id=$2)
  order by f.creat_al, f.id`, [a, b, town])).rows.map(r => r.id);
const teColumna = async (db, taula, columna) => (await db.query(
  'select count(*)::int as n from pg_attribute where attrelid=to_regclass($1) and attname=$2 and not attisdropped', [taula, columna])).rows[0].n === 1;
const clau = async (db, fil) => (await teColumna(db, 'public.xat_fils', 'parella_menor'))
  ? (await db.query('select tenant_id, parella_menor, parella_major from public.xat_fils where id=$1', [fil])).rows[0] ?? null
  : { tenant_id: 'sense columna', parella_menor: null, parella_major: null };

/** Fotografia de tot el que la migració pot tocar, en JSON pla (dates ISO, seq enters). */
async function foto(db) {
  const q = async sql => (await db.query(sql)).rows.map(r => JSON.parse(JSON.stringify(r)));
  const ambClau = await teColumna(db, 'public.xat_fils', 'parella_menor');
  const privada = async (taula, sql) => ((await db.query('select to_regclass($1) as t', [taula])).rows[0].t ? q(sql) : []);
  return {
    fils: await q(`select id, tenant_id, tipus, org_id, interlocutor_id, creat_per, creat_al, actualitzat_al, ultim_seq::int as ultim_seq,
      epoca_actual, e2ee_des_de_seq, temporal_segons${ambClau ? ', parella_menor, parella_major' : ''} from public.xat_fils order by id`),
    participants: await q(`select fil_id, usuari_id, creat_al, rol, com_org_id, eixit_al, visible_des_de_seq::int as visible_des_de_seq,
      visible_fins_seq, llegit_fins_seq::int as llegit, rebut_fins_seq::int as rebut, buidat_fins_seq::int as buidat, silenciat_fins_al,
      arxivat_al, fixat_al, preferit_al, no_llegit_manual, avisos, etiqueta from public.xat_participants order by fil_id, usuari_id`),
    missatges: await q('select id, fil_id, seq::int as seq, usuari_id, com_org_id, text, creat_al, resposta_a, versio_xifrat from public.xat_missatges order by id'),
    adjunts: await q('select id, fil_id, usuari_id from public.xat_adjunts order by id'),
    lectures: await q('select fil_id, usuari_id, ultim_llegit_al from public.xat_lectures order by fil_id, usuari_id'),
    cua: await q('select fil_id, missatge_id from private.xat_push_cua order by id'),
    denuncies: await q('select objecte_id, fil_id from public.denuncies order by objecte_id'),
    fusionats: await privada('private.xat_fils_fusionats', 'select antic_id, supervivent_id, tenant_id, missatges_moguts from private.xat_fils_fusionats order by antic_id'),
    pendents: await privada('private.xat_fusions_pendents', 'select fils, tenant_id, motiu, detectat_al from private.xat_fusions_pendents order by fils')
  };
}
const nomes = (llista, fils) => llista.filter(r => fils.includes(r.fil_id ?? r.id));
const senseClau = fila => Object.fromEntries(Object.entries(fila).filter(([k]) => k !== 'parella_menor' && k !== 'parella_major'));

/** El que ha de quedar d'un grup [supervivent, ...duplicats]: ordre cronològic i prefix conservador. */
function esperat(pre, grup) {
  const supervivent = pre.fils.find(f => f.id === grup[0]);
  const msgs = pre.missatges.filter(m => grup.includes(m.fil_id))
    .sort((x, y) => (Date.parse(x.creat_al) - Date.parse(y.creat_al)) || (grup.indexOf(x.fil_id) - grup.indexOf(y.fil_id)) || (x.seq - y.seq));
  const base = Math.max(supervivent.ultim_seq, ...msgs.map(m => m.seq));
  const marques = {};
  for (const u of [...new Set(pre.participants.filter(p => grup.includes(p.fil_id)).map(p => p.usuari_id))]) {
    const de = fil => pre.participants.find(p => p.fil_id === fil && p.usuari_id === u);
    const prefix = llindar => { let k = 0; while (k < msgs.length && msgs[k].seq <= llindar(de(msgs[k].fil_id))) k++; return base + k; };
    marques[u] = { llegit: prefix(p => p.llegit), rebut: prefix(p => Math.max(p.llegit, p.rebut)) };
  }
  return { ids: msgs.map(m => m.id), seqs: msgs.map((_, i) => base + i + 1), base, marques };
}

test('R24 · directe persona↔persona canònic: clau, reconciliació i crea_fil_directe per clau sobre PostgreSQL 18.6 real', { timeout: 180000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  const avisos = [];
  db.on('notice', n => { if (n.severity === 'WARNING') avisos.push(n.message); });
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as n")).rows[0].n, '180006');
    const plan = creaPlaMigracions();
    const posicio = plan.migrations.findIndex(m => m.file === MIGRATION);
    assert.ok(posicio >= 0, `${MIGRATION} no és al catàleg de supabase/migrations`);
    assert.ok(posicio > plan.migrations.findIndex(m => m.file.startsWith('2611121630_')), 'el pla del verificador la posa darrere del fil propi');
    assert.ok(posicio > plan.migrations.findIndex(m => m.file.startsWith('20261114000100_')), 'i darrere de R22.2 (última redefinició de xat_envia)');
    await db.query(plan.bootstrap);
    for (const migration of plan.migrations.slice(0, posicio)) {
      await db.query('begin');
      try { await db.query(migration.body); await db.query('commit'); }
      catch (e) { await db.query('rollback'); throw new Error(`baseline ${migration.file}: ${e.message}`, { cause: e }); }
    }

    /* ── Llavor ─────────────────────────────────────────────────────────── */
    /* Privilegi de plataforma de Supabase que el bootstrap local no té (q10 de R22.2). */
    await db.query('grant select on public.towns to authenticated');
    await db.query("insert into public.towns(id,slug,name) values($1,'r24-xat','Poble sintètic'),($2,'r24-xat-altre','Altre poble sintètic')", [TOWN, ALTRE]);
    for (const [who, nom] of [[ALICE, 'Alícia Sintètica'], [BOB, 'Bernat Sintètic'], [CAROL, 'Carme Sintètica'], [DAVE, 'David Sintètic'],
      [EVE, 'Eva Sintètica'], [FRANK, 'Francesc Sintètic']]) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
        [who, `${who}@example.invalid`, { full_name: nom, tenant_id: TOWN, accepta_rgpd: true, rgpd: true }]);
      await actor(db, who, "select public.accepta_normes_convivencia('2026-10-24')");
    }
    await db.query('insert into public.town_memberships(town_id,user_id) values($1,$2),($1,$3) on conflict do nothing', [ALTRE, ALICE, BOB]);
    const ORG = (await actor(db, ALICE, "select (public.create_organization($1,'company','Entitat sintètica','r24-entitat')->>'id') as id", [TOWN])).rows[0].id;

    await directe(db, A, '2026-11-01T10:00:00Z', ALICE, BOB);
    await directe(db, B, '2026-11-02T10:00:00Z', BOB, ALICE);
    await directe(db, C1, '2026-11-01T12:00:00Z', ALICE, CAROL);
    await directe(db, C2, '2026-11-05T12:00:00Z', CAROL, ALICE);
    await directe(db, E1, '2026-11-01T13:00:00Z', DAVE, EVE);
    await directe(db, E2, '2026-11-03T13:00:00Z', EVE, DAVE);
    await directe(db, V1, '2026-11-01T14:00:00Z', BOB, CAROL);
    await directe(db, V2, '2026-11-02T14:00:00Z', CAROL, BOB);
    await directe(db, I1, '2026-11-01T15:00:00Z', CAROL, EVE);
    await directe(db, I2, '2026-11-02T15:00:00Z', EVE, CAROL);
    await directe(db, T1, '2026-11-01T16:00:00Z', CAROL, DAVE);
    await directe(db, T2, '2026-11-02T16:00:00Z', DAVE, CAROL);
    await db.query('update public.xat_fils set temporal_segons=86400 where id=$1', [T2]);
    await db.query("insert into private.xat_iaia_binding(tenant_id,fil_id,bot_id,disclosure,updated_by) values($1,$2,$3,'Assistent sintètic de prova R24',$4)", [TOWN, I1, EVE, ALICE]);
    /* Missatges pel camí real (xat_envia) i després intercalats en el temps. */
    for (const [n, who, fil] of [[1, ALICE, A], [2, BOB, B], [3, BOB, A], [4, ALICE, B], [5, ALICE, A], [6, BOB, B]]) {
      await envia(db, who, fil, M(n), `Missatge sintètic ${n}`);
      await db.query('update public.xat_missatges set creat_al=$2 where id=$1', [M(n), `2026-11-03T09:0${n}:00Z`]);
    }
    await db.query('update public.xat_missatges set resposta_a=$2 where id=$1', [M(6), M(1)]);
    await envia(db, ALICE, C1, M(11), 'Hola, Carme');
    await envia(db, BOB, V2, M(21), 'Missatge buidat');
    await db.query('update public.xat_participants set buidat_fins_seq=1 where fil_id=$1 and usuari_id=$2', [V2, BOB]);
    await db.query('update public.xat_fils set epoca_actual=1, cap_epoca_hash=$2, e2ee_des_de_seq=1 where id=$1', [E2, B64_32]);
    const K = await crea(db, BOB, ORG);
    await envia(db, BOB, K, M(31), 'Pregunta a l’entitat');
    await envia(db, ALICE, K, M(32), 'Resposta de l’entitat');
    /* Marques, estat i lectures. */
    for (const [fil, who, llegit, rebut] of [[A, ALICE, 3, 3], [A, BOB, 2, 3], [B, ALICE, 2, 3], [B, BOB, 3, 3]])
      await db.query('update public.xat_participants set llegit_fins_seq=$3, rebut_fins_seq=$4 where fil_id=$1 and usuari_id=$2', [fil, who, llegit, rebut]);
    await db.query("update public.xat_participants set silenciat_fins_al='2027-01-01T00:00:00Z', arxivat_al='2026-11-04T00:00:00Z' where fil_id=$1 and usuari_id=$2", [A, ALICE]);
    await db.query("update public.xat_participants set no_llegit_manual=true, silenciat_fins_al='2026-12-01T00:00:00Z', avisos='cap' where fil_id=$1 and usuari_id=$2", [B, ALICE]);
    await db.query("update public.xat_participants set preferit_al='2026-11-04T10:00:00Z', etiqueta='Feina', fixat_al='2026-11-04T09:00:00Z' where fil_id=$1 and usuari_id=$2", [A, BOB]);
    await db.query("update public.xat_participants set fixat_al='2026-11-04T11:00:00Z', avisos='destacats' where fil_id=$1 and usuari_id=$2", [B, BOB]);
    await db.query("update public.xat_participants set fixat_al='2026-11-06T00:00:00Z' where fil_id=$1 and usuari_id=$2", [C2, CAROL]);
    for (const [fil, who, al] of [[A, ALICE, '2026-11-03T09:30:00Z'], [B, ALICE, '2026-11-03T09:40:00Z'], [B, BOB, '2026-11-03T09:50:00Z']])
      await db.query('insert into public.xat_lectures(fil_id,usuari_id,ultim_llegit_al) values($1,$2,$3) on conflict (fil_id,usuari_id) do update set ultim_llegit_al=excluded.ultim_llegit_al', [fil, who, al]);
    await db.query("insert into public.xat_adjunts(id,usuari_id,fil_id,bytes,mime,publicat) values($1,$2,$3,1024,'image/webp',true)", [ADJ, ALICE, B]);
    await db.query('insert into private.xat_push_cua(fil_id,missatge_id,autor_id) values($1,$2,$3)', [B, M(6), BOB]);
    await db.query("insert into public.denuncies(tenant_id,objecte_tipus,objecte_id,motiu,fil_id) values($1,'missatge',$2,'altre',$3)", [TOWN, M(4), B]);
    const pre = await foto(db);
    const missatgesAbans = pre.missatges.length, adjuntsAbans = pre.adjunts.length;

    await t.test('Abans: dos directes Alícia↔Bernat, un de buit Alícia↔Carme i cap clau ni índex de parella', async () => {
      assert.deepEqual(await filsDeParella(db, ALICE, BOB), [A, B]);
      assert.deepEqual(await filsDeParella(db, ALICE, CAROL), [C1, C2]);
      assert.equal((await crea(db, BOB, ALICE)), A, 'el predicat vell ja tornava el més antic');
      if (!BASELINE) {
        assert.equal(await teColumna(db, 'public.xat_fils', 'parella_menor'), false);
        assert.equal((await db.query("select to_regclass('public.xat_fils_parella_uq') as i")).rows[0].i, null);
      }
    });

    /* ── La migració, dues vegades, sense superusuari ─────────────────────── */
    let primera = null;
    let avisosPrimera = [];
    if (!BASELINE) {
      await db.query('create role sdp_editor_sql nosuperuser inherit; grant postgres to sdp_editor_sql');
      /* Privilegis per defecte de Supabase: qualsevol funció o taula nova seria
         de PUBLIC, anon, authenticated i service_role si la migració no ho revoca. */
      await db.query(`alter default privileges for role sdp_editor_sql in schema public, private grant all on functions to public, anon, authenticated, service_role;
        alter default privileges for role sdp_editor_sql in schema public, private grant all on tables to anon, authenticated, service_role`);
      const sql = read(`supabase/migrations/${MIGRATION}`);
      t.diagnostic(`${MIGRATION} sha256=${createHash('sha256').update(sql).digest('hex')}`);
      const aplica = async () => {
        await db.query('set role sdp_editor_sql');
        try {
          assert.equal((await db.query('select rolsuper from pg_roles where rolname = current_user')).rows[0].rolsuper, false);
          try { await db.query(sql); }
          catch (e) { await db.query('rollback'); throw e; }
        } finally { await db.query('reset role'); }
      };
      avisos.length = 0;
      await aplica();
      avisosPrimera = avisos.splice(0);
      primera = await foto(db);
      await aplica();
    }

    await t.test('Repetible: la segona aplicació no canvia cap fila', async () => {
      assert.ok(primera, 'la migració no s’ha aplicat');
      assert.deepEqual(await foto(db), primera);
    });

    await t.test('Un sol directe per parella i poble; el supervivent és el més antic i les làpides no porten cap usuari_id', async () => {
      assert.deepEqual(await filsDeParella(db, ALICE, BOB), [A]);
      assert.deepEqual(await filsDeParella(db, ALICE, CAROL), [C1]);
      assert.deepEqual(await clau(db, A), { tenant_id: TOWN, parella_menor: ALICE, parella_major: BOB });
      assert.deepEqual(await clau(db, C1), { tenant_id: TOWN, parella_menor: ALICE, parella_major: CAROL });
      const fusionats = (await db.query('select antic_id, supervivent_id, tenant_id, missatges_moguts from private.xat_fils_fusionats order by antic_id')).rows;
      assert.deepEqual(fusionats, [
        { antic_id: B, supervivent_id: A, tenant_id: TOWN, missatges_moguts: 3 },
        { antic_id: C2, supervivent_id: C1, tenant_id: TOWN, missatges_moguts: 0 }
      ]);
      const columnes = (await db.query(`select table_name, column_name from information_schema.columns
        where table_schema='private' and table_name in ('xat_fils_fusionats','xat_fusions_pendents') and data_type='uuid' order by 1, 2`)).rows;
      assert.deepEqual(columnes.map(c => `${c.table_name}.${c.column_name}`),
        ['xat_fils_fusionats.antic_id', 'xat_fils_fusionats.supervivent_id', 'xat_fils_fusionats.tenant_id', 'xat_fusions_pendents.tenant_id']);
      assert.ok((await db.query("select to_regclass('public.xat_fils_parella_uq') as i")).rows[0].i);
    });

    await t.test('Cada missatge hi és una sola vegada, en ordre cronològic, amb els ids, les respostes i el text intactes', async () => {
      const e = esperat(pre, [A, B]);
      const ara = (await db.query('select id, seq::int as seq, creat_al, resposta_a, text, usuari_id from public.xat_missatges where fil_id=$1 order by seq', [A])).rows;
      assert.deepEqual(ara.map(m => m.id), e.ids, 'ordre cronològic intercalat');
      assert.deepEqual(ara.map(m => m.seq), e.seqs, 'seq contigus per damunt de tot el grup');
      assert.ok(ara[0].seq > Math.max(...pre.missatges.filter(m => [A, B].includes(m.fil_id)).map(m => m.seq)), 'monòtona: cap seq vell no es reutilitza');
      for (const m of ara) {
        const abans = pre.missatges.find(x => x.id === m.id);
        assert.equal(m.resposta_a, abans.resposta_a); assert.equal(m.text, abans.text); assert.equal(m.usuari_id, abans.usuari_id);
        assert.equal(new Date(m.creat_al).toISOString(), new Date(abans.creat_al).toISOString());
      }
      assert.equal((await db.query('select ultim_seq::int as n from public.xat_fils where id=$1', [A])).rows[0].n, e.seqs.at(-1));
      assert.equal((await db.query('select count(*)::int as n from public.xat_missatges')).rows[0].n, missatgesAbans);
      assert.equal((await db.query('select count(*)::int as n from public.xat_adjunts')).rows[0].n, adjuntsAbans);
      assert.deepEqual((await db.query('select id from public.xat_missatges order by id')).rows.map(r => r.id), pre.missatges.map(m => m.id));
      /* El duplicat buit no renumera res. */
      assert.deepEqual((await db.query('select id, seq::int as seq from public.xat_missatges where fil_id=$1', [C1])).rows, [{ id: M(11), seq: 1 }]);
    });

    await t.test('Cursors coherents: prefix conservador, mai per davall del supervivent i cap no llegit amagat', async () => {
      const e = esperat(pre, [A, B]);
      const marques = (await db.query('select usuari_id, llegit_fins_seq::int as llegit, rebut_fins_seq::int as rebut from public.xat_participants where fil_id=$1 order by usuari_id', [A])).rows;
      assert.deepEqual(Object.fromEntries(marques.map(m => [m.usuari_id, { llegit: m.llegit, rebut: m.rebut }])), e.marques);
      for (const m of marques) {
        const vell = pre.participants.find(p => p.fil_id === A && p.usuari_id === m.usuari_id);
        assert.ok(m.llegit >= vell.llegit && m.rebut >= vell.rebut && m.rebut >= m.llegit, 'les marques no retrocedixen');
      }
      for (const who of [ALICE, BOB]) {
        const abans = pre.participants.filter(p => [A, B].includes(p.fil_id) && p.usuari_id === who)
          .reduce((s, p) => s + pre.fils.find(f => f.id === p.fil_id).ultim_seq - p.llegit, 0);
        const fila = (await meus(db, who)).find(r => r.id === A);
        assert.ok(fila.no_llegits >= abans, `${who}: ${fila.no_llegits} no llegits ≥ ${abans}`);
      }
    });

    await t.test('Estat per persona fusionat; adjunts, cua d’avisos, denúncies i lectures repuntats', async () => {
      const estat = Object.fromEntries((await db.query(`select usuari_id, arxivat_al, fixat_al, preferit_al, silenciat_fins_al, no_llegit_manual, avisos, etiqueta, creat_al
        from public.xat_participants where fil_id=$1`, [A])).rows.map(r => [r.usuari_id, JSON.parse(JSON.stringify(r))]));
      assert.deepEqual(estat[ALICE], { usuari_id: ALICE, arxivat_al: null, fixat_al: null, preferit_al: null, silenciat_fins_al: '2027-01-01T00:00:00.000Z',
        no_llegit_manual: true, avisos: 'cap', etiqueta: null, creat_al: '2026-11-01T10:00:00.000Z' },
      'arxivat només si ho estava a tots dos; el silenci més llarg; els avisos més restrictius');
      assert.deepEqual(estat[BOB], { usuari_id: BOB, arxivat_al: null, fixat_al: '2026-11-04T11:00:00.000Z', preferit_al: '2026-11-04T10:00:00.000Z',
        silenciat_fins_al: null, no_llegit_manual: false, avisos: 'destacats', etiqueta: 'Feina', creat_al: '2026-11-01T10:00:00.000Z' },
      'fixat i preferit: el més recent');
      assert.equal((await db.query('select fixat_al from public.xat_participants where fil_id=$1 and usuari_id=$2', [C1, CAROL])).rows[0].fixat_al.toISOString(), '2026-11-06T00:00:00.000Z');
      assert.deepEqual((await db.query('select fil_id from public.xat_adjunts where id=$1', [ADJ])).rows, [{ fil_id: A }]);
      assert.deepEqual((await db.query('select fil_id, missatge_id from private.xat_push_cua')).rows, [{ fil_id: A, missatge_id: M(6) }]);
      assert.deepEqual((await db.query('select fil_id from public.denuncies where objecte_id=$1', [M(4)])).rows, [{ fil_id: A }]);
      const lectures = (await db.query('select fil_id, usuari_id, ultim_llegit_al from public.xat_lectures where fil_id = any($1) order by usuari_id', [[A, B]])).rows;
      assert.deepEqual(lectures.map(l => [l.fil_id, l.usuari_id, l.ultim_llegit_al.toISOString()]),
        [[A, ALICE, '2026-11-03T09:40:00.000Z'], [A, BOB, '2026-11-03T09:50:00.000Z']]);
      assert.equal((await db.query('select count(*)::int as n from public.xat_participants where fil_id = any($1)', [[B, C2]])).rows[0].n, 0);
    });

    await t.test('El canal d’entitat no es toca, no porta clau i la gestora el continua veient a part', async () => {
      const ara = await foto(db);
      assert.deepEqual(nomes(ara.fils, [K]).map(senseClau), nomes(pre.fils, [K]));
      assert.deepEqual(await clau(db, K), { tenant_id: TOWN, parella_menor: null, parella_major: null });
      assert.deepEqual(nomes(ara.participants, [K]), nomes(pre.participants, [K]));
      assert.deepEqual(nomes(ara.missatges, [K]), nomes(pre.missatges, [K]));
      const files = await meus(db, ALICE);
      const ambBernat = files.filter(r => r.altres.some(x => x.id === BOB && x.tipus === 'persona'));
      assert.deepEqual(ambBernat.map(r => [r.id, r.com_entitat]).sort(), [[A, false], [K, true]].sort());
      assert.ok(!files.some(r => [B, C2].includes(r.id)));
    });

    await t.test('E2EE, «buidat», IAIA i temporals diferents van a pendents sense cap canvi; la clau és del més antic', async () => {
      const ara = await foto(db);
      assert.deepEqual(nomes(ara.fils, PENDENTS).map(senseClau), nomes(pre.fils, PENDENTS));
      assert.deepEqual(nomes(ara.participants, PENDENTS), nomes(pre.participants, PENDENTS));
      assert.deepEqual(nomes(ara.missatges, PENDENTS), nomes(pre.missatges, PENDENTS));
      assert.deepEqual(ara.pendents.map(p => [p.fils, p.tenant_id, p.motiu]),
        [[[E1, E2], TOWN, 'e2ee'], [[V1, V2], TOWN, 'visibilitat'], [[I1, I2], TOWN, 'iaia'], [[T1, T2], TOWN, 'temporal']]);
      assert.deepEqual(await clau(db, E1), { tenant_id: TOWN, parella_menor: DAVE, parella_major: EVE });
      assert.deepEqual(await clau(db, V1), { tenant_id: TOWN, parella_menor: BOB, parella_major: CAROL });
      assert.deepEqual(await clau(db, I1), { tenant_id: TOWN, parella_menor: CAROL, parella_major: EVE });
      assert.deepEqual(await clau(db, T1), { tenant_id: TOWN, parella_menor: CAROL, parella_major: DAVE });
      for (const fil of [E2, V2, I2, T2]) assert.equal((await clau(db, fil)).parella_menor, null);
      assert.equal(avisosPrimera.filter(a => a.startsWith('SDP-XAT-942:')).length, 4, 'un avís per grup pendent');
      assert.ok(avisosPrimera.every(a => !UUID.test(a)), 'els avisos no porten cap identificador');
    });

    await t.test('crea_fil_directe torna el supervivent en tots dos sentits, i la clau és per poble', async () => {
      assert.equal(await crea(db, ALICE, BOB), A);
      assert.equal(await crea(db, BOB, ALICE), A);
      assert.equal(await crea(db, CAROL, ALICE), C1);
      assert.equal(await crea(db, EVE, DAVE), E1);
      assert.equal(await crea(db, CAROL, BOB), V1);
      assert.equal(await crea(db, EVE, CAROL), I1);
      assert.equal(await crea(db, DAVE, CAROL), T1);
      const altre = await crea(db, ALICE, BOB, ALTRE);
      assert.notEqual(altre, A);
      assert.equal(await crea(db, BOB, ALICE, ALTRE), altre);
      assert.deepEqual(await clau(db, altre), { tenant_id: ALTRE, parella_menor: ALICE, parella_major: BOB });
      assert.deepEqual(await filsDeParella(db, ALICE, BOB), [A]);
    });

    let nou;
    await t.test('Dues connexions concurrents per a una parella nova esperen el pany i tornen el mateix fil', async () => {
      const one = await cluster.connect(), two = await cluster.connect();
      let release, ready;
      const gate = new Promise(r => { release = r; }), firstReady = new Promise(r => { ready = r; });
      const first = asActor(one, ALICE, async c => { const r = await c.query('select public.crea_fil_directe($1,$2,null) as id', [TOWN, FRANK]); ready(); await gate; return r; });
      await Promise.race([firstReady, first]);
      const second = crea(two, FRANK, ALICE);
      let waiting = false;
      try {
        for (let intent = 0; intent < 100; intent++) {
          const row = (await db.query('select wait_event from pg_stat_activity where pid=$1', [two.processID])).rows[0];
          if (row?.wait_event === 'advisory') { waiting = true; break; }
          await delay(5);
        }
        assert.ok(waiting, 'la segona connexió espera el pany de la primera');
      } finally { release(); }
      const [r1, r2] = await Promise.all([first, second]);
      nou = r1.rows[0].id;
      assert.equal(r2, nou);
      assert.deepEqual(await filsDeParella(db, ALICE, FRANK), [nou]);
      assert.deepEqual(await clau(db, nou), { tenant_id: TOWN, parella_menor: ALICE, parella_major: FRANK });
    });

    await t.test('Cap escriptura pot duplicar una parella amb clau (23505) ni posar clau a un canal (23514)', async () => {
      await assert.rejects(db.query("insert into public.xat_fils(tenant_id,tipus,parella_menor,parella_major) values($1,'directe',$2,$3)", [TOWN, ALICE, BOB]),
        e => e.code === '23505' && e.constraint === 'xat_fils_parella_uq');
      await assert.rejects(db.query("insert into public.xat_fils(tenant_id,tipus,parella_menor,parella_major) values($1,'directe',$2,$3)", [TOWN, BOB, ALICE]),
        e => e.code === '23514' && e.constraint === 'xat_fils_parella_forma', 'menor < major');
      await assert.rejects(db.query('update public.xat_fils set parella_menor=$2, parella_major=$3 where id=$1', [K, ALICE, BOB]),
        e => e.code === '23514' && e.constraint === 'xat_fils_parella_forma', 'mai en un canal d’entitat');
      await assert.rejects(db.query('update public.xat_fils set parella_menor=null where id=$1', [A]),
        e => e.code === '23514' && e.constraint === 'xat_fils_parella_forma', 'les dues meitats o cap');
    });

    await t.test('La clau només descriu una parella viva: eixida, compte esborrat o tercera persona la retiren', async () => {
      assert.ok(nou, 'cal el fil de la prova concurrent');
      await db.query('update public.xat_participants set visible_fins_seq=0 where fil_id=$1 and usuari_id=$2', [nou, FRANK]);
      assert.equal((await clau(db, nou)).parella_menor, null);
      const nou2 = await crea(db, ALICE, FRANK);
      assert.notEqual(nou2, nou, 'com el predicat vell: un fil on l’altra ja no hi és no es retroba');
      assert.deepEqual(await clau(db, nou2), { tenant_id: TOWN, parella_menor: ALICE, parella_major: FRANK });
      await db.query('delete from auth.users where id=$1', [FRANK]);
      assert.equal((await db.query('select count(*)::int as n from public.xat_fils where $1 in (parella_menor, parella_major)', [FRANK])).rows[0].n, 0,
        'cap fila conserva l’UUID d’un compte suprimit');
      await db.query('insert into public.xat_participants(fil_id,usuari_id) values($1,$2)', [C1, BOB]);
      assert.equal((await clau(db, C1)).parella_menor, null, 'un tercer participant la retira');
    });

    await t.test('Permisos: crea_fil_directe només per a authenticated; res de nou per a anon, PUBLIC ni service_role', async () => {
      const fn = 'public.crea_fil_directe(uuid,uuid,text)';
      const pot = async (rol, objecte, priv, tipus = 'function') => (await db.query(
        tipus === 'function' ? 'select has_function_privilege($1,$2,$3) as p' : 'select has_table_privilege($1,$2,$3) as p', [rol, objecte, priv])).rows[0].p;
      assert.equal(await pot('authenticated', fn, 'EXECUTE'), true);
      assert.equal(await pot('anon', fn, 'EXECUTE'), false);
      const publics = async sig => (await db.query('select count(*)::int as n from pg_proc p, aclexplode(coalesce(p.proacl, acldefault(\'f\', p.proowner))) a where p.oid=$1::regprocedure and a.grantee=0', [sig])).rows[0].n;
      assert.equal(await publics(fn), 0, 'PUBLIC no l’executa');
      assert.equal(await publics('private.xat_parella_vigent()'), 0);
      for (const rol of ['anon', 'authenticated', 'service_role']) {
        assert.equal(await pot(rol, 'private.xat_parella_vigent()', 'EXECUTE'), false, `${rol} executa el disparador`);
        for (const taula of ['private.xat_fils_fusionats', 'private.xat_fusions_pendents'])
          for (const priv of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) assert.equal(await pot(rol, taula, priv, 'table'), false, `${rol} ${priv} ${taula}`);
      }
      await assert.rejects(actor(db, null, 'select public.crea_fil_directe($1,$2,null)', [TOWN, BOB], 'anon'), e => e.code === '42501');
    });
  } finally {
    await cluster.close();
  }
});
