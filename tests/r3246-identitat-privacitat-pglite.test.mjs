import test from 'node:test';
import assert from 'node:assert/strict';
import { creaBaseR3246, asClient } from './fixtures/r3246-catalogue-pglite.mjs';
import { sembraIdentitatsR3246, uuidIdentitat as id, PERSONES, POBLE, ALTRE_POBLE, ENTITAT, ALTRA_ENTITAT, CORREUS, TELEFONS_CANARI, DOMINI, EVIDENCIA } from './fixtures/r3246-identitat-casos.mjs';

const { propietaria: A, administradora: B, membre: C, revisora: D } = PERSONES;
const CODE = code => error => error?.code === code;
const EDIT = 'SELECT public.publica_section_submission_beta_cas($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS ack';

test('R32.46 · identitat, acreditació municipal i contactes amb el catàleg real', { timeout: 180000 }, async t => {
  const pg = await creaBaseR3246();
  const client = async (uid, sql, args = [], { role = 'authenticated', aal = 'aal1' } = {}) => {
    const result = await asClient(pg, { uid, role, aal }, sql, args);
    return Array.isArray(result) ? result : result.rows;
  };
  const edit = async ({ uid = A, row, op, section = 'mur', tenant = POBLE, org = null, preserve = false, expected = null, title = 'Publicació sintètica C3' }) =>
    (await client(uid, EDIT, [id(row), tenant, section, { content: 'Contingut públic sintètic C3' }, title, '', org, preserve, expected, id(op)]))[0].ack;
  const raw = async row => (await pg.query('SELECT owner_user_id,author_org_id,tenant_id,section_id,title,payload,updated_at FROM public.section_submissions WHERE id=$1', [id(row)])).rows[0];
  const sign = async (uid, hall, town = POBLE) => (await client(uid, 'SELECT public.pot_signar_com_organitzacio($1,$2) AS allowed', [hall, town]))[0].allowed;
  try {
    const { ajuntament: H, compatibilityShim } = await sembraIdentitatsR3246(pg);
    process.stdout.write(`# compatibilityShim ${JSON.stringify(compatibilityShim)}\n`);
    let entityToken;

    await t.test('contractes reals: taules/RLS, signatures i cap overload antic', async () => {
      for (const table of ['section_submissions', 'organizations', 'organization_memberships', 'profiles']) {
        const row = (await pg.query("SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=$1", [table])).rows;
        assert.equal(row.length, 1, table); assert.equal(row[0].relrowsecurity, true, table);
      }
      for (const signature of ['public.publica_section_submission_beta_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamptz,uuid)', 'public.pot_signar_com_organitzacio(uuid,uuid)', 'public.contacte_organitzacio(uuid)', 'public.desa_contacte_organitzacio(uuid,text,boolean)', 'public.sollicita_acreditacio_ajuntament(uuid,text)', 'public.resol_acreditacio_ajuntament(uuid,boolean,text)']) {
        assert.notEqual((await pg.query('SELECT to_regprocedure($1)::text AS name', [signature])).rows[0].name, null, signature);
      }
      assert.equal((await pg.query("SELECT to_regprocedure('public.pot_signar_com_organitzacio(uuid)')::text AS name")).rows[0].name, null);
    });

    await t.test('controls positius: totes les persones poden publicar i editar com a persona AAL1', async () => {
      for (const [i, uid] of [A, B, C].entries()) {
        const first = await edit({ uid, row: 300 + i, op: 400 + i });
        const second = await edit({ uid, row: 300 + i, op: 410 + i, expected: first.updated_at, title: 'Versió nova pròpia' });
        assert.equal(second.owner_user_id, uid); assert.ok(second.updated_at > first.updated_at);
        assert.equal((await raw(300 + i)).title, 'Versió nova pròpia');
      }
    });

    await t.test('Mur/Mercat/Esdeveniments: cap edició aliena RPC, mateixa fila final i CAS propi viu', async () => {
      for (const [i, section] of ['mur', 'mercat', 'events'].entries()) {
        const first = await edit({ row: 320 + i, op: 420 + i, section }); const before = await raw(320 + i);
        for (const uid of [B, C]) await assert.rejects(edit({ uid, row: 320 + i, op: 430 + i * 2 + (uid === B ? 0 : 1), section, expected: first.updated_at, title: 'Intent alié' }), CODE('42501'));
        assert.deepEqual(await raw(320 + i), before);
        const next = await edit({ row: 320 + i, op: 440 + i, section, expected: first.updated_at });
        await assert.rejects(edit({ row: 320 + i, op: 450 + i, section, expected: first.updated_at }), CODE('40001'));
        assert.equal((await raw(320 + i)).updated_at.toISOString(), new Date(next.updated_at).toISOString());
      }
    });

    await t.test('camí directe revocat: cap canvi ni eliminació de publicació aliena', async () => {
      await edit({ row: 340, op: 460 }); const before = await raw(340);
      await assert.rejects(client(B, 'UPDATE public.section_submissions SET title=$2 WHERE id=$1 RETURNING id', [id(340), 'Intent directe alié']), CODE('42501'));
      await assert.rejects(client(C, 'DELETE FROM public.section_submissions WHERE id=$1 RETURNING id', [id(340)]), CODE('42501'));
      assert.deepEqual(await raw(340), before);
      await assert.rejects(client(null, EDIT, [id(341), POBLE, 'mur', { content: 'Text' }, 'Títol', '', null, false, null, id(461)], { role: 'anon' }), CODE('42501'));
      assert.equal(await raw(341), undefined);
    });

    await t.test('entitat: admin actual pot editar AAL1, member i autoria aliena no', async () => {
      for (const [i, section] of ['mur', 'mercat', 'events'].entries()) {
        const first = await edit({ row: 350 + i, op: 470 + i, section, org: ENTITAT });
        const next = await edit({ uid: B, row: 350 + i, op: 480 + i, section, preserve: true, expected: first.updated_at });
        if (i === 0) entityToken = next.updated_at;
        assert.equal(next.owner_user_id, A); assert.equal(next.author_org_id, ENTITAT);
        const before = await raw(350 + i);
        for (const candidate of [{ uid: C, org: ENTITAT }, { uid: B, org: ALTRA_ENTITAT }, { uid: B, org: null }]) {
          await assert.rejects(edit({ ...candidate, row: 350 + i, op: 500 + i * 3 + (candidate.uid === C ? 0 : candidate.org ? 1 : 2), section, expected: next.updated_at }), CODE('42501'));
          assert.deepEqual(await raw(350 + i), before);
        }
      }
      assert.equal(await sign(A, ENTITAT), true); assert.equal(await sign(B, ENTITAT), true); assert.equal(await sign(C, ENTITAT), false);
    });

    await t.test('una administradora degradada perd immediatament la firma i l’edició', async () => {
      const before = await raw(350);
      await pg.query("UPDATE public.organization_memberships SET role='member' WHERE organization_id=$1 AND user_id=$2", [ENTITAT, B]);
      try {
        assert.equal(await sign(B, ENTITAT), false);
        await assert.rejects(edit({ uid: B, row: 350, op: 530, org: ENTITAT, expected: entityToken }), CODE('42501'));
        assert.deepEqual(await raw(350), before);
      } finally { await pg.query("UPDATE public.organization_memberships SET role='admin' WHERE organization_id=$1 AND user_id=$2", [ENTITAT, B]); }
      const restored = await edit({ uid: B, row: 350, op: 531, org: ENTITAT, expected: entityToken });
      assert.equal(restored.owner_user_id, A); assert.equal(restored.author_org_id, ENTITAT);
    });

    await t.test('contacte: owner/admin veuen corporatiu; el correu d’accés només la mateixa owner', async () => {
      const owner = (await client(A, 'SELECT * FROM public.contacte_organitzacio($1)', [ENTITAT]))[0];
      const admin = (await client(B, 'SELECT * FROM public.contacte_organitzacio($1)', [ENTITAT]))[0];
      assert.equal(owner.correu, CORREUS.corporatiu); assert.equal(owner.correu_per_defecte, CORREUS.propietaria);
      assert.equal(admin.correu, CORREUS.corporatiu); assert.equal(admin.correu_per_defecte, '');
      await assert.rejects(client(C, 'SELECT * FROM public.contacte_organitzacio($1)', [ENTITAT]), CODE('42501'));
      await assert.rejects(client(null, 'SELECT * FROM public.contacte_organitzacio($1)', [ENTITAT], { role: 'anon' }), CODE('42501'));
      const members = await client(B, 'SELECT * FROM public.membres_organitzacio($1)', [ENTITAT]);
      assert.ok(!JSON.stringify(members).includes(CORREUS.propietaria));
      for (const token of Object.values(TELEFONS_CANARI)) assert.ok(!JSON.stringify(members).includes(token));
    });

    await t.test('cap lectura crua de contact_email ni auth.users per anon/authenticated', async () => {
      for (const role of ['anon', 'authenticated']) {
        assert.equal((await pg.query("SELECT has_column_privilege($1,'public.organizations','contact_email','SELECT') AS allowed", [role])).rows[0].allowed, false);
        const allowed = await pg.query("SELECT a.attname FROM pg_attribute a WHERE a.attrelid='auth.users'::regclass AND a.attnum>0 AND NOT a.attisdropped AND has_column_privilege($1,a.attrelid,a.attnum,'SELECT')", [role]);
        assert.deepEqual(allowed.rows, [], role);
        await assert.rejects(client(role === 'anon' ? null : A, 'SELECT contact_email FROM public.organizations WHERE id=$1', [ENTITAT], { role }), CODE('42501'));
        await assert.rejects(client(role === 'anon' ? null : A, 'SELECT * FROM auth.users', [], { role }), CODE('42501'));
      }
    });

    await t.test('directori: opt-in false oculta, true només mostra el corporatiu; membre no el pot canviar', async () => {
      const publicRow = () => client(null, 'SELECT * FROM public.organization_directory WHERE id=$1', [ENTITAT], { role: 'anon' });
      let rows = await publicRow(); assert.equal(rows.length, 1); assert.equal(rows[0].correu_public, null);
      const before = (await pg.query('SELECT contact_email,public_email FROM public.organizations WHERE id=$1', [ENTITAT])).rows[0];
      await assert.rejects(client(C, 'SELECT * FROM public.desa_contacte_organitzacio($1,$2,true)', [ENTITAT, 'canvi-ali@example.invalid']), CODE('42501'));
      assert.deepEqual((await pg.query('SELECT contact_email,public_email FROM public.organizations WHERE id=$1', [ENTITAT])).rows[0], before);
      const ack = (await client(B, 'SELECT * FROM public.desa_contacte_organitzacio($1,$2,true)', [ENTITAT, CORREUS.corporatiu]))[0];
      assert.equal(ack.es_public, true); assert.equal(ack.correu_per_defecte, '');
      rows = await publicRow(); assert.equal(rows[0].correu_public, CORREUS.corporatiu);
      assert.ok(!JSON.stringify(rows).includes(CORREUS.propietaria)); assert.ok(!Object.hasOwn(rows[0], 'contact_email'));
      for (const token of Object.values(TELEFONS_CANARI)) assert.ok(!JSON.stringify(rows).includes(token));
      await client(A, 'SELECT * FROM public.desa_contacte_organitzacio($1,$2,false)', [ENTITAT, CORREUS.corporatiu]);
      assert.equal((await publicRow())[0].correu_public, null);
    });

    await t.test('exportació pròpia i catàleg administratiu respecten identitat/AAL2 reals', async () => {
      for (const uid of [A, B, C, D]) await assert.rejects(client(uid, 'SELECT public.admin_list_users(10,0)'), CODE('42501'));
      await assert.rejects(client(null, 'SELECT public.admin_list_users(10,0)', [], { role: 'anon' }), CODE('42501'));
      const own = (await client(A, 'SELECT public.exporta_les_meues_dades() AS data'))[0].data;
      const json = JSON.stringify(own); assert.ok(json.includes(CORREUS.propietaria));
      assert.ok(json.includes(TELEFONS_CANARI.propietaria));
      for (const email of [CORREUS.administradora, CORREUS.membre, CORREUS.revisora]) assert.ok(!json.includes(email), email);
      for (const token of [TELEFONS_CANARI.administradora, TELEFONS_CANARI.membre, TELEFONS_CANARI.revisora]) assert.ok(!json.includes(token), token);
      const admin = (await client(D, 'SELECT public.admin_list_users(10,0) AS users', [], { aal: 'aal2' }))[0].users;
      assert.ok(Array.isArray(admin)); assert.ok(admin.some(u => u.id === A));
    });

    await t.test('city_hall no acreditat no firma, encara amb owner heretada; camps institucionals no editables', async () => {
      await pg.query("INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,'owner')", [H, POBLE, A]);
      assert.equal(await sign(A, H), false);
      const before = (await pg.query('SELECT claimed,kind FROM public.organizations WHERE id=$1', [H])).rows[0];
      await assert.rejects(client(A, 'UPDATE public.organizations SET claimed=true WHERE id=$1', [H]), CODE('42501'));
      await assert.rejects(client(A, "UPDATE public.organizations SET kind='company' WHERE id=$1", [H]), error => ['42501', '22023'].includes(error.code) && /SDP-ORGMEM-001|SDP-ORG-403/.test(error.message));
      await assert.rejects(client(A, "INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,'owner')", [H, POBLE, B]), CODE('42501'));
      for (const [i, section] of ['mur', 'mercat', 'events'].entries()) {
        await assert.rejects(edit({ row: 370 + i, op: 550 + i, section, org: H }), CODE('42501'));
        assert.equal(await raw(370 + i), undefined);
      }
      assert.deepEqual((await pg.query('SELECT claimed,kind FROM public.organizations WHERE id=$1', [H])).rows[0], before);
    });

    await t.test('acreditació: revisora real AAL2, correu vigent i via específica; després només el poble correcte', async () => {
      await assert.rejects(client(D, 'SELECT public.registra_domini_ajuntament($1,$2,$3)', [H, DOMINI, EVIDENCIA]), CODE('42501'));
      await client(D, 'SELECT public.registra_domini_ajuntament($1,$2,$3)', [H, DOMINI, EVIDENCIA], { aal: 'aal2' });
      const claim = (await client(A, 'SELECT (public.sollicita_acreditacio_ajuntament($1,$2)).id AS id', [H, EVIDENCIA]))[0].id;
      await assert.rejects(client(D, 'SELECT public.resol_reclamacio($1,true)', [claim], { aal: 'aal2' }), error => error.code === '42501' && /SDP-AJT-020/.test(error.message));
      assert.equal(await sign(A, H), false);
      await pg.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin')", [A]);
      try {
        await assert.rejects(client(A, 'SELECT public.resol_acreditacio_ajuntament($1,true,$2)', [claim, EVIDENCIA], { aal: 'aal2' }), error => error.code === '42501' && /SDP-AJT-013/.test(error.message));
      } finally { await pg.query('DELETE FROM public.user_platform_roles WHERE user_id=$1', [A]); }
      await pg.query('UPDATE auth.users SET email=$2 WHERE id=$1', [A, `correu-canviat@${DOMINI}`]);
      await assert.rejects(client(D, 'SELECT public.resol_acreditacio_ajuntament($1,true,$2)', [claim, EVIDENCIA], { aal: 'aal2' }), error => error.code === '42501' && /SDP-AJT-014/.test(error.message));
      await pg.query('UPDATE auth.users SET email=$2 WHERE id=$1', [A, CORREUS.propietaria]);
      await client(D, 'SELECT public.resol_acreditacio_ajuntament($1,true,$2)', [claim, EVIDENCIA], { aal: 'aal2' });
      assert.equal((await pg.query('SELECT claimed FROM public.organizations WHERE id=$1', [H])).rows[0].claimed, true);
      assert.equal(await sign(A, H), true); assert.equal(await sign(A, H, ALTRE_POBLE), false); assert.equal(await sign(C, H), false);
      assert.equal(await sign(D, H), false);
      assert.deepEqual((await pg.query("SELECT user_id FROM public.organization_memberships WHERE organization_id=$1 AND role='owner'", [H])).rows, [{ user_id: A }]);
      const legitimate = await edit({ row: 380, op: 560, org: H }); assert.equal(legitimate.author_org_id, H);
      await assert.rejects(edit({ row: 381, op: 561, tenant: ALTRE_POBLE, org: H }), CODE('42501'));
      assert.equal(await raw(381), undefined);
    });
  } finally { await pg.close(); }
});
