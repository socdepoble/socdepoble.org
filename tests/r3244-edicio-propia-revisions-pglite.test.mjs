import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { creaPlaMigracions, generaSql, preparaHidratacio } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { llegixReadme } from '../scripts/supabase/verifica-migracions.mjs';

if (!process.env.SDP_PGLITE_MODULE) throw new Error('SDP_PGLITE_MODULE obligatori: cap verd sense SQL.');
const moduleUrl = pathToFileURL(process.env.SDP_PGLITE_MODULE);
const { PGlite } = await import(moduleUrl.href);
const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleUrl));
const migrationUrl = new URL('../supabase/migrations/20261122230000_r3244_edicio_propia_i_page_revisions.sql', import.meta.url);
const uid = n => `44000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const A = uid(1), B = uid(2), C = uid(3), ORG = uid(10), OTHER_ORG = uid(11);
// v1.2.23 · L4-03, L6-01 i L6-02 (Gauntlet R1) · D se'n va de baixa; E i F proven els dos sostres d'octets. La SHA-256
// és la del prosrc de public.exporta_les_meues_dades() d'R28, la que el preflight del paquet R32.11 exigix.
const D = uid(4), E = uid(5), F = uid(6);
// v1.2.23 · R2D-04 (Gauntlet R2) · G té 50 MiB de revisions editorials i encara pot desar al seu Mur personal.
const G = uid(7);
const EXPORTA_R28_PROSRC_SHA = '82cb25456d46aab8496596d3f97009399c0506c292ed439aaae4cf6841e9d029';
const TENANT = 'ac3bec76-255b-5ca2-8886-28fcceab4267';
const EDIT = 'SELECT public.publica_section_submission_beta_cas($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS ack';
const SAVE = 'SELECT public.desa_revisio_pagina($1,$2,$3,$4,$5,$6,$7,$8) AS ack';
const RESTORE = 'SELECT public.restaura_revisio_pagina($1,$2,$3,$4,$5,$6,$7) AS ack';
const code = value => error => error.code === value;

test('R32.44 · edició pròpia i historial append-only amb el catàleg real', async t => {
  const initial = new PGlite();
  let image;
  try { await initial.exec('CREATE DATABASE socdepoble_node0'); image = await initial.dumpDataDir('none'); }
  finally { await initial.close(); }
  const pg = new PGlite({ database: 'socdepoble_node0', loadDataDir: image, extensions: { pgcrypto } });
  const as = (actor, sql, args = [], role = 'authenticated', aal = 'aal1') => pg.transaction(async tx => {
    await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)", [actor ?? '', JSON.stringify({ sub: actor, role, aal })]);
    await tx.exec(`SET LOCAL ROLE ${role}`);
    return (await tx.query(sql, args)).rows;
  });
  const edit = (n, op, expected = null, { actor = A, section = 'mur', org = null, preserve = false, payload = { content: 'Text de prova' }, tenant = TENANT } = {}) =>
    as(actor, EDIT, [uid(n), tenant, section, payload, 'Títol', '', org, preserve, expected, uid(op)]).then(rows => rows[0].ack);
  const save = (section, item, expected, op, { actor = A, org = null, payload = { title: 'Revisió', content: '<p>Cos</p>' }, slug = null } = {}) =>
    as(actor, SAVE, [TENANT, section, slug, item, payload, org, expected, uid(op)]).then(rows => rows[0].ack);
  try {
    // v1.2.24 · R32.87 · Fins a 135: la 136 reescriu publica_section_submission_beta_cas i revoca_publicacio_mur, i la
    // reaplicació de la 130 (més avall) refusaria eixe cos nou com a deriva, com ha de fer.
    const plan = creaPlaMigracions();
    plan.migrations = plan.migrations.slice(0, plan.migrations.findIndex((m) => m.version === '20261124033000') + 1);
    assert.equal(plan.migrations.length, 135);
    await pg.exec(generaSql(plan, await preparaHidratacio(), { advisoryLock: false }));
    for (const actor of [A, B, C, D, E, F, G]) {
      await pg.query('INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,now(),$3)', [actor, `${actor}@example.invalid`, { full_name: 'Prova', tenant_id: TENANT, accepta_rgpd: true }]);
      await pg.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [TENANT, actor]);
      await pg.query('INSERT INTO private.normes_acceptades(usuari_id,versio) VALUES($1,private.versio_normes_vigent()) ON CONFLICT DO NOTHING', [actor]);
    }
    for (const org of [ORG, OTHER_ORG]) {
      await pg.query("INSERT INTO public.organizations(id,tenant_id,slug,name,kind,created_by) VALUES($1,$2,$3,'Entitat de prova','entity',$4)", [org, TENANT, `prova-${org.at(-1)}`, A]);
      await pg.query("INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,'owner') ON CONFLICT DO NOTHING", [org, TENANT, A]);
    }
    await pg.query("INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,'admin')", [ORG, TENANT, B]);

    let personal, entity;
    await t.test('qualsevol membre crea i edita mur/mercat/events amb CAS exacte', async () => {
      for (const [i, section] of ['mur', 'mercat', 'events'].entries()) {
        personal = await edit(100 + i, 200 + i, null, { section });
        const next = await edit(100 + i, 210 + i, personal.updated_at, { section });
        assert.ok(next.updated_at > personal.updated_at); assert.equal(next.created_at, personal.created_at);
        await assert.rejects(edit(100 + i, 220 + i, personal.updated_at, { section }), code('40001'));
      }
    });
    await t.test('entitat real: coadministradora edita sense usurpar propietària o signatura', async () => {
      entity = await edit(110, 230, null, { org: ORG });
      const next = await edit(110, 231, entity.updated_at, { actor: B, org: ORG });
      assert.equal(next.owner_user_id, A); assert.equal(next.author_org_id, ORG);
      assert.deepEqual(await edit(110, 231, entity.updated_at, { actor: B, org: ORG }), { ...next, replay: true });
      await assert.rejects(edit(110, 232, next.updated_at, { actor: C, org: ORG }), code('42501'));
      await assert.rejects(edit(110, 233, next.updated_at, { actor: B, org: null }), code('42501'));
      await assert.rejects(edit(110, 234, next.updated_at, { org: OTHER_ORG }), code('42501'));
      await assert.rejects(edit(110, 231, entity.updated_at, { actor: B, org: ORG, payload: { content: 'Cos canviat' } }), code('22023'));
      entity = next;
    });
    await t.test('també Mercat i Esdeveniments d’entitat: dos intents tenen un sol guanyador', async () => {
      for (const [i,section] of ['mercat','events'].entries()) {
        const a=await edit(112+i,235+i,null,{org:ORG,section});
        const results=await Promise.allSettled([edit(112+i,450+i,a.updated_at,{actor:B,org:ORG,section}),edit(112+i,460+i,a.updated_at,{org:ORG,section})]);
        assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
        assert.ok(results.filter(x=>x.status==='rejected').every(x=>x.reason.code==='40001'));
      }
    });
    await t.test('cap edició aliena, anònima, sense normes, no membre o amb JSONB no primitiu', async () => {
      const current = await edit(120, 240);
      await assert.rejects(edit(120, 241, current.updated_at, { actor: B }), code('42501'));
      await assert.rejects(as(null, EDIT, [uid(121), TENANT, 'mur', {}, 'X', '', null, false, null, uid(242)], 'anon'), code('42501'));
      await pg.query('DELETE FROM private.normes_acceptades WHERE usuari_id=$1', [A]);
      await assert.rejects(edit(120, 243, current.updated_at), code('42501'));
      await pg.query('INSERT INTO private.normes_acceptades(usuari_id,versio) VALUES($1,private.versio_normes_vigent())', [A]);
      await pg.query('DELETE FROM public.town_memberships WHERE user_id=$1', [C]);
      await assert.rejects(edit(121, 244, null, { actor: C }), code('42501'));
      for (const payload of [[], { content: {} }, { title: ['hostil'] }, { content: 'x'.repeat(700001) }]) await assert.rejects(edit(121, 245, null, { payload }), code('22023'));
      const safe = await edit(121, 246, null, { payload: { content: 'Text', origen: 'oficial', seller: 'Fals', ownerUserId: B } });
      const row = (await pg.query('SELECT payload FROM public.section_submissions WHERE id=$1', [safe.id])).rows[0].payload;
      for (const key of ['origen', 'seller', 'ownerUserId']) assert.equal(Object.hasOwn(row, key), false);
    });
    await t.test('historial Mur personal privat, CAS/idempotència i restauració afegix una versió', async () => {
      let r = await save('mur', uid(120), 0, 300);
      assert.equal(r.version_num, 1); assert.equal(r.author_id, A);
      assert.deepEqual(await save('mur', uid(120), 0, 300), { ...r, replay: true });
      await assert.rejects(save('mur', uid(120), 0, 301), code('40001'));
      await assert.rejects(save('mur', uid(120), 1, 302, { actor: B }), code('42501'));
      r = await save('mur', uid(120), 1, 303, { payload: { title: 'Segona', content: 'Cos nou' } });
      const restored = (await as(A, RESTORE, [TENANT, 'mur', null, uid(120), 1, 2, uid(304)])).at(0).ack;
      assert.equal(restored.version_num, 3); assert.equal(restored.restored_from, 1); assert.equal(restored.payload_jsonb.title, 'Revisió');
      const rows = (await as(A, 'SELECT public.llista_revisions_pagina($1,$2,$3,$4,$5,$6) AS rows', [TENANT, 'mur', null, uid(120), 20, null]))[0].rows;
      assert.deepEqual(rows.map(row => row.version_num), [3, 2, 1]);
      await assert.rejects(as(B, 'SELECT public.llista_revisions_pagina($1,$2,$3,$4,$5,$6)', [TENANT, 'mur', null, uid(120), 20, null]), code('42501'));
      for (const role of ['anon', 'authenticated', 'service_role']) {
        await assert.rejects(as(A, 'SELECT * FROM public.page_revisions', [], role), code('42501'));
        await assert.rejects(as(A, 'UPDATE public.page_revisions SET payload_jsonb=\'{}\'', [], role), code('42501'));
      }
      assert.equal((await pg.query('SELECT count(*)::int n FROM public.page_revisions WHERE item_id=$1', [uid(120)])).rows[0].n, 3);
      await assert.rejects(pg.query('DELETE FROM public.page_revisions WHERE item_id=$1', [uid(120)]), code('42501'));
    });
    await t.test('historial d’entitat depén de la pertinença actual, Sistema d’identitat oficial', async () => {
      const r = await save('mur', uid(110), 0, 310, { actor: B, org: ORG });
      assert.equal(r.actor_entity_id, ORG); assert.equal(r.author_id, B);
      await pg.query('DELETE FROM public.organization_memberships WHERE organization_id=$1 AND user_id=$2', [ORG, B]);
      await assert.rejects(save('mur', uid(110), 1, 311, { actor: B, org: ORG }), code('42501'));
      await assert.rejects(save('sistema', null, 0, 312, { org: ORG, slug: 'descarregues' }), code('42501'));
      await pg.query("INSERT INTO private.ajustos(clau,valor) VALUES('copublicacio_actor_socdepoble',$1) ON CONFLICT(clau) DO UPDATE SET valor=excluded.valor", [ORG]);
      const official = await save('sistema', null, 0, 313, { org: ORG, slug: 'descarregues' });
      assert.equal(official.slug, 'descarregues'); assert.equal(official.item_id, null);
      for (const payload of [{ title: {} }, { tags: [{}] }, { content: 'x'.repeat(700001) }, { title: 'X', author_id: B }]) await assert.rejects(save('sistema', null, 1, 314, { org: ORG, slug: 'descarregues', payload }), code('22023'));
      await assert.rejects(save('sistema', null, 1, 315, { org: ORG, slug: 'pagina-inventada' }), code('42501'));
    });
    await t.test('actes vinculats/revocats, privats i ajuntament no acreditat continuen vedats',async()=>{
      await pg.query('INSERT INTO private.mur_actes_notes(act_id,note_id,tenant_id,owner_user_id,created_note_revision) VALUES($1,null,$2,$3,1)',[uid(130),TENANT,A]);
      await assert.rejects(edit(130,330),code('42501'));
      await pg.query('INSERT INTO private.mur_publicacions_revocades(submission_id,tenant_id,owner_user_id) VALUES($1,$2,$3)',[uid(131),TENANT,A]);
      await assert.rejects(edit(131,331),code('42501'));
      for(const payload of [{visibility:'private',content:'Privat'},{status:'draft',content:'Esborrany'},{type:'sistema',content:'Suplantació'}]) await assert.rejects(edit(132,332,null,{payload}),code('42501'));
      const hall=uid(12);
      await pg.query("INSERT INTO public.organizations(id,tenant_id,slug,name,kind) VALUES($1,$2,'hall-prova','Ajuntament no acreditat','city_hall')",[hall,TENANT]);
      await pg.query("INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,'owner')",[hall,TENANT,A]);
      await assert.rejects(edit(132,333,null,{org:hall}),code('42501'));
      await assert.rejects(save('mur',uid(120),3,334,{org:ORG}),code('42501'));
    });
    const revisionsDe = async item => (await pg.query('SELECT count(*)::int n FROM public.page_revisions WHERE item_id=$1', [item])).rows[0].n;
    await t.test('v1.2.23 · L4-03 i L6-01 · la retirada LSSI cautelar conserva l’historial i esborrar la publicació se l’enduu', async () => {
      await edit(150, 600);
      await save('mur', uid(150), 0, 601);
      await save('mur', uid(150), 1, 602, { payload: { title: 'Segona', content: 'El meu telèfon' } });
      // v1.2.23 · L4-03 i L6-01 (Gauntlet R1) · Com admin_revisa_denuncia_lssi(…,'retirada',…): la fila es queda (R32.5, «sense esborrar contingut»).
      await pg.query("UPDATE public.section_submissions SET moderation_state='retirada_cautelar' WHERE id=$1", [uid(150)]);
      assert.equal(await revisionsDe(uid(150)), 2);
      // v1.2.24 · R32.87 · Amb la migració 136 l'autor ja no pot revocar una fila retirada (prova LSSI): ho prova
      // tests/r3287-blindatges-p0-pglite.test.mjs. Esta prova queda fixada al catàleg 135, el de la R32.44.
      assert.equal((await as(A, 'SELECT public.revoca_publicacio_mur($1,$2) AS ok', [uid(150), TENANT]))[0].ok, true);
      assert.equal((await pg.query('SELECT count(*)::int n FROM public.section_submissions WHERE id=$1', [uid(150)])).rows[0].n, 0);
      assert.equal(await revisionsDe(uid(150)), 0);
      // v1.2.23 · L4-03 i L6-01 (Gauntlet R1) · L'append-only continua per a tot el que no és una cascada: ni un DELETE directe ni la d'una fila viva.
      await assert.rejects(pg.query("DELETE FROM public.page_revisions WHERE slug='descarregues'"), code('42501'));
      await assert.rejects(pg.query('DELETE FROM public.page_revisions WHERE item_id=$1', [uid(120)]), code('42501'));
      assert.equal(await revisionsDe(uid(120)), 3);
      const fk = (await pg.query("SELECT pg_get_constraintdef(oid) def FROM pg_constraint WHERE conrelid='public.page_revisions'::regclass AND conname='page_revisions_item_fk'")).rows;
      assert.deepEqual(fk.map(r => r.def), ['FOREIGN KEY (item_id) REFERENCES section_submissions(id) ON DELETE CASCADE']);
    });
    await t.test('v1.2.23 · L4-03 i L6-01 · la purga d’una baixa vençuda s’enduu les revisions de les seues publicacions i un id reutilitzat no hereta res', async () => {
      await pg.query("INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,'admin')", [ORG, TENANT, D]);
      await edit(160, 610, null, { actor: D });
      await save('mur', uid(160), 0, 611, { actor: D, payload: { title: 'De D', content: 'Dades personals de D' } });
      const editorial = await save('sistema', null, 1, 612, { actor: D, org: ORG, slug: 'descarregues', payload: { title: 'Text editorial de D' } });
      await pg.query("INSERT INTO private.baixes(user_id,purga_prevista_al) VALUES($1, now() - interval '1 day')", [D]);
      assert.equal((await pg.query('SELECT private.purga_una_baixa($1) AS ok', [D])).rows[0].ok, true);
      assert.equal((await pg.query('SELECT count(*)::int n FROM auth.users WHERE id=$1', [D])).rows[0].n, 0);
      assert.equal((await pg.query('SELECT count(*)::int n FROM public.section_submissions WHERE id=$1', [uid(160)])).rows[0].n, 0);
      assert.equal(await revisionsDe(uid(160)), 0);
      // v1.2.23 · L4-03 i L6-01 (Gauntlet R1) · La revisió editorial (amb slug) es queda, sense autoria i amb el mateix cos.
      const kept = (await pg.query('SELECT author_id,payload_jsonb FROM public.page_revisions WHERE id=$1', [editorial.id])).rows;
      assert.equal(kept.length, 1); assert.equal(kept[0].author_id, null); assert.deepEqual(kept[0].payload_jsonb, { title: 'Text editorial de D' });
      // v1.2.23 · L4-03 i L6-01 (Gauntlet R1) · Cap revisió no queda òrfena: un id reutilitzat per qualsevol camí no trobaria historial d'altri.
      assert.equal((await pg.query('SELECT count(*)::int n FROM public.page_revisions r WHERE r.item_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.section_submissions s WHERE s.id=r.item_id)')).rows[0].n, 0);
      await assert.rejects(edit(160, 613), code('42501'));
    });
    await t.test('v1.2.23 · L4-03 · l’exportació inclou les revisions pròpies sense canviar l’embolcall públic d’R28', async () => {
      // v1.2.23 · L4-03 (Gauntlet R1) · Columnes de GoTrue que l'exportador canònic llig i que el fixture mínim del Node 0 no porta (com r32_11).
      await pg.exec('ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(); ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz');
      const data = (await as(A, 'SELECT public.exporta_les_meues_dades() AS data'))[0].data;
      assert.equal(data.format, 'socdepoble.exportacio.v1');
      for (const key of ['seed_revisions', 'veu_del_poble', 'page_revisions']) assert.ok(Object.hasOwn(data, key), key);
      const own = (await pg.query('SELECT id FROM public.page_revisions WHERE author_id=$1 ORDER BY created_at,id', [A])).rows.map(r => r.id);
      assert.ok(own.length >= 4);
      assert.deepEqual(data.page_revisions.map(r => r.id), own);
      assert.ok(data.page_revisions.every(r => r.author_id === A && !Object.hasOwn(r, 'request_sha256') && typeof r.payload_jsonb === 'object'));
      assert.ok(data.page_revisions.some(r => r.item_id === uid(120) && r.payload_jsonb.title === 'Segona'));
      // v1.2.23 · L4-03 (Gauntlet R1) · Cap revisió d'una altra persona: les de B (entitat) són a la taula, però no a l'exportació d'A.
      assert.ok((await pg.query('SELECT count(*)::int n FROM public.page_revisions WHERE author_id=$1', [B])).rows[0].n > 0);
      assert.equal(JSON.stringify(data.page_revisions).includes(B), false);
      // v1.2.23 · L4-03 (Gauntlet R1) · L'embolcall públic no canvia de cos (el paquet R32.11 en fixa el SHA); la base vigent es conserva sencera.
      const prosrc = (await pg.query("SELECT prosrc FROM pg_proc WHERE oid='public.exporta_les_meues_dades()'::regprocedure")).rows[0].prosrc;
      assert.equal(createHash('sha256').update(prosrc, 'utf8').digest('hex'), EXPORTA_R28_PROSRC_SHA);
      assert.match((await pg.query("SELECT pg_get_functiondef('private.exporta_les_meues_dades_base_abans_r3244()'::regprocedure) d")).rows[0].d, /private\.exporta_federacio_v1/);
      for (const sig of ['private.exporta_les_meues_dades_base_r33()', 'private.exporta_les_meues_dades_base_abans_r3244()']) {
        for (const role of ['anon', 'authenticated', 'service_role']) assert.equal((await pg.query('SELECT has_function_privilege($1,$2,\'EXECUTE\') ok', [role, sig])).rows[0].ok, false, `${role} ${sig}`);
      }
      assert.doesNotMatch(fs.readFileSync(migrationUrl, 'utf8'), /create\s+or\s+replace\s+function\s+public\.exporta_les_meues_dades\b/i);
      // v1.2.23 · L4-03 (Gauntlet R1) · La comprovació de lectura de la vinyeta de supabase/README.md torna true a les tres columnes.
      const readme = llegixReadme(fs.readFileSync(new URL('../supabase/README.md', import.meta.url), 'utf8'));
      const consultes = readme.consultesPerFitxer.get('20261122230000_r3244_edicio_propia_i_page_revisions.sql') ?? [];
      assert.equal(consultes.length, 1);
      const fila = (await pg.query(consultes[0].sql)).rows[0];
      assert.deepEqual(fila, { revisions_presents: true, revisions_en_cascada: true, exportacio_amb_revisions: true });
      await assert.rejects(as(null, 'SELECT public.exporta_les_meues_dades()', [], 'anon'), code('42501'));
    });
    await t.test('migració reaplicable conserva totes les revisions i DDL sense donar privilegis crus', async () => {
      const before = (await pg.query('SELECT * FROM public.page_revisions ORDER BY created_at,id')).rows;
      // v1.2.23 · R2F-01 (Gauntlet R2) · L'embolcall passa pel nom de treball i torna a base_r33 amb el mateix OID i ACL.
      const embolcall = "SELECT p.oid::int AS oid, p.proacl::text AS acl, to_regprocedure('private.exporta_les_meues_dades_embolcall_r3244()') IS NULL AS sense_nom_de_treball FROM pg_proc p WHERE p.oid='private.exporta_les_meues_dades_base_r33()'::regprocedure";
      const embolcallAbans = (await pg.query(embolcall)).rows;
      assert.equal(embolcallAbans[0].sense_nom_de_treball, true);
      await pg.exec(fs.readFileSync(migrationUrl, 'utf8'));
      assert.deepEqual((await pg.query('SELECT * FROM public.page_revisions ORDER BY created_at,id')).rows, before);
      assert.deepEqual((await pg.query(embolcall)).rows, embolcallAbans);
    });
    await t.test('drift d’ACL o cos desconegut falla tancat sense reparar ni perdre historial',async()=>{
      const sql=fs.readFileSync(migrationUrl,'utf8');
      await pg.exec('GRANT SELECT ON public.page_revisions TO authenticated');
      await assert.rejects(pg.exec(sql),code('22023'));await pg.exec('ROLLBACK');
      assert.equal((await pg.query("SELECT has_table_privilege('authenticated','public.page_revisions','SELECT') yes")).rows[0].yes,true);
      await pg.exec('REVOKE SELECT ON public.page_revisions FROM authenticated');
      const ddl=(await pg.query("SELECT pg_get_functiondef('private.beta_payload_valid(jsonb)'::regprocedure) ddl")).rows[0].ddl;
      await pg.exec("CREATE OR REPLACE FUNCTION private.beta_payload_valid(p_payload jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$BEGIN RETURN true; END$$");
      await assert.rejects(pg.exec(sql),code('22023'));await pg.exec('ROLLBACK');
      await pg.exec(ddl);await pg.exec(sql);
    });
    await t.test('v1.2.23 · R2D-03 · una base de laboratori sense la clau forana i amb revisions òrfenes la rep sense perdre les vives', async () => {
      // v1.2.23 · R2D-03 (Gauntlet R2) · Com una base amb la 130 d'abans de l'R1: sense page_revisions_item_fk, amb el
      // contracte desat en eixe estat i una revisió que ha sobreviscut a la revocació de la seua publicació.
      await edit(174, 660);
      await save('mur', uid(174), 0, 661);
      await pg.exec('ALTER TABLE public.page_revisions DROP CONSTRAINT page_revisions_item_fk');
      await pg.exec('UPDATE private.r3244_edicio_contract SET snapshot=private.r3244_edicio_snapshot() WHERE id=1');
      assert.equal((await as(A, 'SELECT public.revoca_publicacio_mur($1,$2) AS ok', [uid(174), TENANT]))[0].ok, true);
      const orfes = async () => (await pg.query('SELECT count(*)::int n FROM public.page_revisions r WHERE r.item_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.section_submissions s WHERE s.id=r.item_id)')).rows[0].n;
      assert.equal(await orfes(), 1);
      await assert.rejects(pg.query('DELETE FROM public.page_revisions WHERE item_id=$1', [uid(174)]), code('42501'));
      const vives = (await pg.query('SELECT * FROM public.page_revisions WHERE item_id IS DISTINCT FROM $1 ORDER BY created_at,id', [uid(174)])).rows;
      await pg.exec(fs.readFileSync(migrationUrl, 'utf8'));
      assert.equal(await orfes(), 0);
      assert.deepEqual((await pg.query('SELECT * FROM public.page_revisions ORDER BY created_at,id')).rows, vives);
      const fk = (await pg.query("SELECT pg_get_constraintdef(oid) def FROM pg_constraint WHERE conrelid='public.page_revisions'::regclass AND conname='page_revisions_item_fk'")).rows;
      assert.deepEqual(fk.map(r => r.def), ['FOREIGN KEY (item_id) REFERENCES section_submissions(id) ON DELETE CASCADE']);
      // v1.2.23 · R2D-03 (Gauntlet R2) · El disparador append-only torna a estar actiu: cap DELETE directe.
      assert.equal((await pg.query("SELECT tgenabled FROM pg_trigger WHERE tgrelid='public.page_revisions'::regclass AND tgname='page_revisions_immutable'")).rows[0].tgenabled, 'O');
      await assert.rejects(pg.query('DELETE FROM public.page_revisions WHERE item_id=$1', [uid(120)]), code('42501'));
    });
    await t.test('quotes reals sense truncar revisions ni convertir reintents en operacions noves',async()=>{
      await pg.query(`INSERT INTO public.page_revisions(tenant_id,section_id,slug,version_num,author_id,actor_entity_id,payload_jsonb,operation_id,request_sha256)
        SELECT $1,'sistema','consola',n,$2,$3,'{"title":"Quota"}'::jsonb,gen_random_uuid(),sha256(convert_to(n::text,'UTF8')) FROM generate_series(1,100) n`,[TENANT,A,ORG]);
      await assert.rejects(save('sistema',null,0,500,{org:ORG,slug:'legal'}),code('54000'));
      await pg.query(`INSERT INTO private.publicacions_beta_cas_rebuts(operation_id,submission_id,actor_id,tenant_id,request_sha256,confirmed_updated_at)
        SELECT gen_random_uuid(),$1,$2,$3,sha256(convert_to(n::text,'UTF8')),clock_timestamp() FROM generate_series(1,200) n`,[uid(120),A,TENANT]);
      await assert.rejects(edit(140,501),code('54000'));
      const existing=(await edit(121,246,null,{payload:{content:'Text',origen:'oficial',seller:'Fals',ownerUserId:B}}));
      assert.equal(existing.replay,true);
      assert.equal((await pg.query("SELECT count(*)::int n FROM public.page_revisions WHERE slug='consola'")).rows[0].n,100);
    });
    await t.test('v1.2.23 · L6-02 · sostre d’octets per compte: 8 MiB en 24 h i 50 MiB en total, abans del sostre de recompte', async () => {
      // v1.2.23 · L6-02 (Gauntlet R1) · Base64 aleatori: no es comprimix, i pg_column_size en compta els octets reals.
      const cos = { content: randomBytes(480000).toString('base64') };
      // v1.2.23 · R2D-04 (Gauntlet R2) · omple escriu revisions editorials (slug) o de publicació (item) directament.
      const omple = async (autor, { slug = null, item = null }, sostre, edat) => {
        for (let v = 1; ; v++) {
          const n = (await pg.query(`SELECT coalesce(sum(pg_column_size(payload_jsonb)),0)::bigint n FROM public.page_revisions WHERE author_id=$1 AND created_at>${edat ? "clock_timestamp()-interval '1 day'" : "'-infinity'"}`, [autor])).rows[0].n;
          if (Number(n) > sostre) return;
          await pg.query(`INSERT INTO public.page_revisions(tenant_id,section_id,slug,item_id,version_num,author_id,payload_jsonb,operation_id,request_sha256,created_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,gen_random_uuid(),sha256(convert_to($8,'UTF8')),${edat ? 'clock_timestamp()' : "clock_timestamp()-interval '2 days'"})`, [TENANT, slug ? 'sistema' : 'mur', slug, item, v, autor, cos, `${slug ?? item}:${v}`]);
        }
      };
      const recompteDia = async autor => (await pg.query("SELECT count(*)::int n FROM public.page_revisions WHERE author_id=$1 AND created_at>clock_timestamp()-interval '1 day'", [autor])).rows[0].n;
      // v1.2.23 · L6-02 (Gauntlet R1) · E: més de 8 MiB en les darreres 24 h, amb molt menys de 100 revisions.
      await edit(170, 620, null, { actor: E });
      assert.equal((await save('mur', uid(170), 0, 621, { actor: E })).version_num, 1);
      // v1.2.23 · R2D-04 (Gauntlet R2) · Les revisions editorials d'avui sí que compten en el sostre de 24 h.
      await omple(E, { slug: 'quota-octets-e' }, 8388608, true);
      assert.ok(await recompteDia(E) < 100);
      await assert.rejects(save('mur', uid(170), 1, 622, { actor: E }), error => error.code === '54000' && /SDP-PAGE-429/.test(error.message));
      // v1.2.23 · L6-02 (Gauntlet R1) · F: menys de 8 MiB avui, però més de 50 MiB en total.
      // v1.2.23 · R2D-04 (Gauntlet R2) · Els 50 MiB són de revisions d'una altra publicació seua, les que s'alliberen en esborrar-la.
      await edit(171, 630, null, { actor: F });
      assert.equal((await save('mur', uid(171), 0, 631, { actor: F })).version_num, 1);
      await edit(172, 633, null, { actor: F });
      await omple(F, { item: uid(172) }, 52428800, false);
      assert.ok(await recompteDia(F) < 100);
      await assert.rejects(save('mur', uid(171), 1, 632, { actor: F }), error => error.code === '54000' && /SDP-PAGE-429/.test(error.message));
      // v1.2.23 · R2D-04 (Gauntlet R2) · La comprovació va després de l'INSERT: el raise el desfà i no queda cap versió 2.
      assert.equal(await revisionsDe(uid(171)), 1);
      // v1.2.23 · L6-02 (Gauntlet R1) · Un replay d'una revisió ja desada no consumix quota.
      assert.equal((await save('mur', uid(171), 0, 631, { actor: F })).replay, true);
      // v1.2.23 · R2D-04 (Gauntlet R2) · G: més de 50 MiB de revisions editorials, que no s'esborren mai, no li bloquegen
      // una revisió del seu Mur personal; només compten en el sostre de 24 h.
      await omple(G, { slug: 'quota-octets-g' }, 52428800, false);
      await edit(173, 650, null, { actor: G });
      assert.equal((await save('mur', uid(173), 0, 651, { actor: G })).version_num, 1);
    });
    await t.test('baixa de compte lleva identificador d’autoria sense bloquejar FK ni reescriure contingut',async()=>{
      // v1.2.23 · L4-03 i L6-01 (Gauntlet R1) · Un esborrat directe d'Auth no esborra la publicació personal de B
      // (section_submissions no té FK cap a auth.users, 2611110100): ni la cascada de page_revisions_item_fk se n'enduu
      // les revisions, que s'hi queden amb l'author_id a null, com diu la vinyeta de la 130 a supabase/README.md.
      await edit(180,640,null,{actor:B});
      const propia=await save('mur',uid(180),0,641,{actor:B,payload:{title:'De B',content:'Cos personal de B'}});
      const before=(await pg.query('SELECT id,payload_jsonb FROM public.page_revisions WHERE author_id=$1',[B])).rows;
      assert.ok(before.length>1);assert.ok(before.some(r=>r.id===propia.id));
      assert.deepEqual((await pg.query('SELECT conname FROM pg_constraint WHERE conrelid=\'public.section_submissions\'::regclass AND contype=\'f\' AND confrelid=\'auth.users\'::regclass')).rows,[]);
      await pg.query('DELETE FROM auth.users WHERE id=$1',[B]);
      for(const r of before){const after=(await pg.query('SELECT author_id,payload_jsonb FROM public.page_revisions WHERE id=$1',[r.id])).rows[0];assert.equal(after.author_id,null);assert.deepEqual(after.payload_jsonb,r.payload_jsonb);}
      assert.deepEqual((await pg.query('SELECT owner_user_id FROM public.section_submissions WHERE id=$1',[uid(180)])).rows,[{owner_user_id:B}]);
      assert.equal(await revisionsDe(uid(180)),1);
    });
  } finally { await pg.close(); }
});
