import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { creaPlaMigracions, generaSql, preparaHidratacio } from '../tooling/node0/hidrata-postgres-node0.mjs';

test('P1-75: canonical SQL, author binding, current public revision and per-piece CAS', { skip: !process.env.SDP_PGLITE_MODULE && 'Explicit disposable PGlite module required' }, async t => {
  const url = pathToFileURL(process.env.SDP_PGLITE_MODULE), { PGlite } = await import(url.href), { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', url));
  const initial = new PGlite(); await initial.exec('CREATE DATABASE socdepoble_node0'); const image = await initial.dumpDataDir('none'); await initial.close();
  const pg = new PGlite({ database: 'socdepoble_node0', loadDataDir: image, extensions: { pgcrypto } });
  const tenant = 'ac3bec76-255b-5ca2-8886-28fcceab4267', owner = '11111111-1111-4111-8111-111111111111', foreign = '22222222-2222-4222-8222-222222222222';
  async function as(actor, query, params = [], { aal = 'aal1', role = 'authenticated' } = {}) {
    await pg.exec('BEGIN');
    try {
      await pg.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)", [actor || '', JSON.stringify({ sub: actor, role, aal })]);
      await pg.exec(`SET LOCAL ROLE ${role}`); const result = await pg.query(query, params); await pg.exec('COMMIT'); return result.rows;
    } catch (error) { await pg.exec('ROLLBACK;RESET ROLE'); throw error; }
  }
  const save = (actor, id, camps, version, options = {}) => as(actor, 'SELECT public.desa_revisio_seed($1,$2,$3,$4,$5,$6) AS revision', [tenant, 'mur', id, camps, version, options.fontVersio || 1], options).then(rows => rows[0].revision);
  try {
    await pg.exec(generaSql(creaPlaMigracions(), await preparaHidratacio(), { advisoryLock: false }));
    // GoTrue fields absent from the minimal Node0 compatibility fixture;
    // preserve the actual canonical Supabase export schema in this test.
    await pg.exec('ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(); ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz');
    await pg.exec('ALTER TABLE auth.users DISABLE TRIGGER USER');
    await pg.query("INSERT INTO auth.users(id,email) VALUES($1,'owner@example.invalid'),($2,'foreign@example.invalid')", [owner, foreign]);
    await pg.exec('ALTER TABLE auth.users ENABLE TRIGGER USER');
    const sources = [{ id: 'owned', owner_user_id: owner }, { id: 'textual', author_id: owner }, { id: 'entity', owner_user_id: owner, author_org_id: foreign }, { id: 'next', owner_user_id: owner }, { id: 'draft', owner_user_id: owner, status: 'draft' }, { id: 'private', owner_user_id: owner, visibility: 'private' },
      { id: 'nested-attributes', owner_user_id: owner, attributes: { visibility: 'private' } },
      { id: 'nested-payload', owner_user_id: owner, payload: { status: 'draft' } },
      { id: 'nested-both', owner_user_id: owner, payload: { attributes: { isPublished: false } } }];
    await pg.query("INSERT INTO public.app_content(tenant_id,key,payload,version) VALUES($1,'feedPosts',$2,1) ON CONFLICT(tenant_id,key) DO UPDATE SET payload=excluded.payload,version=1", [tenant, sources]);
    await t.test('author writes; direct client insert/update/delete remain forbidden', async () => {
      assert.deepEqual(await save(owner, 'owned', { title: 'Revised', content: '<p>Public</p>', publishDate: null }, 0), { seccio: 'mur', id: 'owned', camps: { title: 'Revised', content: '<p>Public</p>', publishDate: null }, versio: 1, fontVersio: 1 });
      for (const query of ['DELETE FROM public.seed_revisions', "UPDATE public.seed_revisions SET payload='{}'", "INSERT INTO public.seed_revisions(tenant_id,section,seed_id,payload,author_id) VALUES($1,'mur','forged','{}',$2)"]) await assert.rejects(as(owner, query, query.startsWith('INSERT') ? [tenant, owner] : []), e => e.code === '42501');
    });
    await t.test('foreign actor, fake author, entity signature, unpublished and absent sources fail closed', async () => {
      await assert.rejects(save(foreign, 'owned', { title: 'Foreign' }, 1), e => e.code === '42501');
      for (const id of ['textual', 'entity']) await assert.rejects(save(owner, id, { title: 'No authority' }, 0), e => e.code === '42501');
      for (const id of ['absent', 'draft', 'private']) await assert.rejects(save(owner, id, { title: 'Must remain private' }, 0), e => e.code === 'P0002');
      await assert.rejects(save(owner, 'owned', { owner_user_id: owner }, 1), e => e.code === '22023');
    });
    await t.test('nested attributes/payload publication vetoes deny both accounts before creating a public revision', async () => {
      for (const id of ['nested-attributes', 'nested-payload', 'nested-both']) {
        for (const actor of [owner, foreign]) await assert.rejects(save(actor, id, { content: '<p>Must not publish</p>' }, 0), e => e.code === 'P0002');
        assert.deepEqual(await as(null, 'SELECT seed_id FROM public.seed_revisions WHERE seed_id=$1', [id], { role: 'anon' }), []);
      }
    });
    await t.test('CAS rejects stale writers and versions remain per piece', async () => {
      await assert.rejects(save(owner, 'owned', { title: 'Stale' }, 0), e => e.code === '40001');
      assert.equal((await save(owner, 'next', { title: 'Independent' }, 0)).versio, 1);
      const second = await save(owner, 'owned', { title: 'Second' }, 1); assert.equal(second.versio, 2); assert.equal(second.camps.content, '<p>Public</p>'); assert.equal(second.camps.publishDate, null);
      await pg.query("UPDATE public.seed_revisions SET version=2147483646 WHERE seed_id='owned'");
      assert.equal((await save(owner, 'owned', { publishDate: null }, 2147483646)).versio, 2147483647);
      await assert.rejects(save(owner, 'owned', { title: 'Cannot wrap' }, 2147483647), e => e.code === '22023');
    });
    await t.test('anonymous read returns current fields and no author UUID or history', async () => {
      const rows = await as(null, 'SELECT section,seed_id,payload,version FROM public.seed_revisions ORDER BY seed_id', [], { role: 'anon' });
      assert.equal(rows.length, 2); assert.equal(rows.find(r => r.seed_id === 'owned').payload.title, 'Second');
      await assert.rejects(as(null, 'SELECT author_id FROM public.seed_revisions', [], { role: 'anon' }), e => e.code === '42501');
      await assert.rejects(save(null, 'owned', { title: 'Anon' }, 2, { role: 'anon' }), e => e.code === '42501');
    });
    await t.test('superadmin requires aal2 and the same source boundary', async () => {
      await pg.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin') ON CONFLICT(user_id) DO UPDATE SET role='superadmin'", [foreign]);
      await assert.rejects(save(foreign, 'textual', { title: 'No second factor' }, 0), e => e.code === '42501');
      assert.equal((await save(foreign, 'textual', { title: 'Admin review' }, 0, { aal: 'aal2' })).versio, 1);
      await assert.rejects(save(foreign, 'unknown', { title: 'Absent' }, 0, { aal: 'aal2' }), e => e.code === 'P0002');
    });
    await t.test('canonical update or reauthorship invalidates old overlays and rebasing cannot resurrect old fields', async () => {
      const nextSources = sources.map(row => row.id === 'owned' ? { ...row, owner_user_id: foreign, title: 'New canonical edition' } : row);
      await pg.query("UPDATE public.app_content SET payload=$2,version=2 WHERE tenant_id=$1 AND key='feedPosts'", [tenant, nextSources]);
      assert.deepEqual(await as(null, 'SELECT seed_id FROM public.seed_revisions', [], { role: 'anon' }), []);
      await assert.rejects(save(owner, 'owned', { title: 'Old author' }, 0, { fontVersio: 2 }), e => e.code === '42501');
      await assert.rejects(save(owner, 'next', { title: 'Old source' }, 1), e => e.code === '40001');
      // Àrbitre R11 (R33-L2-02) · The old row is invisible to every client, so its
      // version cannot be the rebase key: a new source starts at 0 and restarts at 1.
      await assert.rejects(save(owner, 'next', { title: 'Hidden version' }, 1, { fontVersio: 2 }), e => e.code === '40001');
      const rebased = await save(owner, 'next', { content: '<p>Newly reviewed body</p>' }, 0, { fontVersio: 2 });
      assert.equal(rebased.versio, 1); assert.equal(rebased.fontVersio, 2); assert.deepEqual(rebased.camps, { content: '<p>Newly reviewed body</p>' });
      await assert.rejects(save(owner, 'next', { title: 'Second rebase' }, 0, { fontVersio: 2 }), e => e.code === '40001');
      assert.deepEqual(await as(null, "SELECT version,source_version FROM public.seed_revisions WHERE seed_id='next'", [], { role: 'anon' }), [{ version: 1, source_version: 2 }]);
      assert.equal((await save(owner, 'next', { title: 'Continues' }, 1, { fontVersio: 2 })).versio, 2);
      // The superadmin row of 'textual' was written on source 1 and is hidden too: aal2 can rebase it from 0.
      await assert.rejects(save(foreign, 'textual', { title: 'Hidden' }, 1, { fontVersio: 2, aal: 'aal2' }), e => e.code === '40001');
      assert.equal((await save(foreign, 'textual', { title: 'Admin rebase' }, 0, { fontVersio: 2, aal: 'aal2' })).versio, 1);
    });
    await t.test('one public account RPC exports only the caller’s own submitted fields, never another writer’s contribution', async () => {
      const exported = actor => as(actor, 'SELECT public.exporta_les_meues_dades() AS exported').then(rows => rows[0].exported);
      const ownBefore = await exported(owner), foreignBefore = await exported(foreign);
      assert.deepEqual(ownBefore.seed_revisions.map(row => row.seed_id).sort(), ['next', 'owned']);
      assert.deepEqual(foreignBefore.seed_revisions.map(row => row.seed_id), ['textual']);
      assert.ok(ownBefore.seed_revisions.every(row => row.author_id === owner));
      assert.equal(JSON.stringify(ownBefore.seed_revisions).includes(foreign), false);
      await save(foreign, 'next', { title: 'Foreign writer’s own title' }, 2, { aal: 'aal2', fontVersio: 2 });
      const ownAfter = await exported(owner), foreignAfter = await exported(foreign);
      assert.deepEqual(ownAfter.seed_revisions.map(row => row.seed_id), ['owned']);
      assert.deepEqual(foreignAfter.seed_revisions.find(row => row.seed_id === 'next').payload, { title: 'Foreign writer’s own title' });
      assert.equal(JSON.stringify(foreignAfter.seed_revisions).includes('Newly reviewed body'), false);
      assert.equal(JSON.stringify(foreignAfter.seed_revisions).includes(owner), false);
      assert.equal((await pg.query("SELECT payload->>'content' AS content FROM public.seed_revisions WHERE seed_id='next'")).rows[0].content, '<p>Newly reviewed body</p>');
      await pg.query("INSERT INTO public.seed_revisions(tenant_id,section,seed_id,payload,author_payload,author_id,version,source_version) VALUES($1,'mur','orphan',$2,$2,null,1,1)", [tenant, { title: 'Unattributed orphan' }]);
      for (const actor of [owner, foreign]) assert.equal(JSON.stringify((await exported(actor)).seed_revisions).includes('orphan'), false);
      await assert.rejects(as(null, 'SELECT public.exporta_les_meues_dades()', [], { role: 'anon' }), e => e.code === '42501');
    });
    await t.test('the preserved export base is private and cannot be called by request roles', async () => {
      for (const role of ['anon', 'authenticated', 'service_role']) {
        assert.equal((await pg.query("SELECT has_function_privilege($1,'private.exporta_les_meues_dades_base_r33()','EXECUTE') AS allowed", [role])).rows[0].allowed, false);
      }
      await assert.rejects(as(owner, 'SELECT private.exporta_les_meues_dades_base_r33()'), e => e.code === '42501');
      assert.match((await pg.query("SELECT pg_get_functiondef('private.exporta_les_meues_dades_base_r33()'::regprocedure) AS body")).rows[0].body, /private\.exporta_federacio_v1/);
    });
    await t.test('migration replay preserves revisions and source withdrawal removes public access', async () => {
      const before = (await pg.query('SELECT * FROM public.seed_revisions ORDER BY seed_id')).rows;
      const ownBefore = (await as(owner, 'SELECT public.exporta_les_meues_dades() AS exported'))[0].exported.seed_revisions;
      const baseBefore = (await pg.query("SELECT pg_get_functiondef('private.exporta_les_meues_dades_base_r33()'::regprocedure) AS source")).rows[0].source;
      const sql = fs.readFileSync(new URL('../supabase/migrations/2611070600_seed_revisions.sql', import.meta.url), 'utf8'); await pg.exec(sql); await pg.exec(sql);
      assert.deepEqual((await pg.query('SELECT * FROM public.seed_revisions ORDER BY seed_id')).rows, before);
      assert.deepEqual((await as(owner, 'SELECT public.exporta_les_meues_dades() AS exported'))[0].exported.seed_revisions, ownBefore);
      assert.equal((await pg.query("SELECT pg_get_functiondef('private.exporta_les_meues_dades_base_r33()'::regprocedure) AS source")).rows[0].source, baseBefore);
      await pg.query("UPDATE public.app_content SET payload=$2 WHERE tenant_id=$1 AND key='feedPosts'", [tenant, [...sources, { id: 'owned', visibility: 'private' }]]);
      assert.equal((await as(null, "SELECT seed_id FROM public.seed_revisions WHERE seed_id='owned'", [], { role: 'anon' })).length, 0);
      await assert.rejects(save(owner, 'owned', { title: 'Duplicate authority' }, 0), e => e.code === 'P0002');
      await pg.query("UPDATE public.app_content SET payload=$2 WHERE tenant_id=$1 AND key='feedPosts'", [tenant, sources.filter(row => row.id !== 'owned')]);
      assert.equal((await as(null, "SELECT seed_id FROM public.seed_revisions WHERE seed_id='owned'", [], { role: 'anon' })).length, 0);
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.schema_migrations')).rows[0].n, 80);
    });
    await t.test('nested withdrawal hides an accepted revision under RLS without relying on a source version change', async () => {
      const source = (await pg.query("SELECT payload FROM public.app_content WHERE tenant_id=$1 AND key='feedPosts'", [tenant])).rows[0].payload;
      assert.equal((await as(null, "SELECT seed_id FROM public.seed_revisions WHERE seed_id='next'", [], { role: 'anon' })).length, 1);
      for (const metadata of [{ attributes: { visibility: 'private' } }, { payload: { status: 'draft' } }]) {
        await pg.query("UPDATE public.app_content SET payload=$2 WHERE tenant_id=$1 AND key='feedPosts'", [tenant, source.map(row => row.id === 'next' ? { ...row, ...metadata } : row)]);
        assert.equal((await as(null, "SELECT seed_id FROM public.seed_revisions WHERE seed_id='next'", [], { role: 'anon' })).length, 0);
        for (const actor of [owner, foreign]) await assert.rejects(save(actor, 'next', { title: 'Must not republish' }, 3, { fontVersio: 2, aal: 'aal2' }), e => e.code === 'P0002');
      }
    });
    await t.test('a future calendar event stays public when all explicit publication flags permit it', async () => {
      const event = { id: 'future-event', owner_user_id: owner, date: '2099-07-01', inici: '2099-07-01T10:00:00Z', attributes: { visibility: 'public' }, payload: { status: 'published' } };
      await pg.query("INSERT INTO public.app_content(tenant_id,key,payload,version) VALUES($1,'events',$2,1) ON CONFLICT(tenant_id,key) DO UPDATE SET payload=excluded.payload,version=1", [tenant, [event]]);
      const rows = await as(owner, 'SELECT public.desa_revisio_seed($1,$2,$3,$4,$5,$6) AS value', [tenant, 'events', event.id, { title: 'A public future event' }, 0, 1]);
      assert.equal(rows[0].value.versio, 1);
      assert.equal((await as(null, 'SELECT seed_id FROM public.seed_revisions WHERE seed_id=$1', [event.id], { role: 'anon' })).length, 1);
    });
    await t.test('explicit reapplication after the historical export migration restores the extension without copying the base', async () => {
      const baseBefore = (await pg.query("SELECT pg_get_functiondef('private.exporta_les_meues_dades_base_r33()'::regprocedure) AS source")).rows[0].source;
      await pg.exec(fs.readFileSync(new URL('../supabase/migrations/2611011800_contracte_exportacio_federacio_v1.sql', import.meta.url), 'utf8'));
      assert.equal(Object.hasOwn((await as(owner, 'SELECT public.exporta_les_meues_dades() AS exported'))[0].exported, 'seed_revisions'), false);
      await pg.exec(fs.readFileSync(new URL('../supabase/migrations/2611070600_seed_revisions.sql', import.meta.url), 'utf8'));
      assert.ok(Array.isArray((await as(owner, 'SELECT public.exporta_les_meues_dades() AS exported'))[0].exported.seed_revisions));
      assert.equal((await pg.query("SELECT pg_get_functiondef('private.exporta_les_meues_dades_base_r33()'::regprocedure) AS source")).rows[0].source, baseBefore);
    });
    // Àrbitre R11 (R33-L2-03) · Al final i amb una peça pròpia: les proves d'exportació
    // anteriors compten exactament les revisions de cada autor i el contingut de 'next'.
    await t.test('R33-L2-03 · UTF-16 lengths and the merged row stay readable by the client', async () => {
      const current = (await pg.query("SELECT payload,version FROM public.app_content WHERE tenant_id=$1 AND key='feedPosts'", [tenant])).rows[0], fontVersio = current.version + 1;
      await pg.query("UPDATE public.app_content SET payload=$2,version=$3 WHERE tenant_id=$1 AND key='feedPosts'", [tenant, [...current.payload, { id: 'utf16', owner_user_id: owner }], fontVersio]);
      assert.equal((await save(owner, 'utf16', { title: '😀'.repeat(2000) }, 0, { fontVersio })).versio, 1);
      await assert.rejects(save(owner, 'utf16', { title: '😀'.repeat(2001) }, 1, { fontVersio }), e => e.code === '22023' && /text invàlid/.test(e.message));
      await assert.rejects(save(owner, 'utf16', { tags: ['😀'.repeat(41)] }, 1, { fontVersio }), e => e.code === '22023' && /etiquetes invàlides/.test(e.message));
      assert.equal((await save(owner, 'utf16', { content: 'a'.repeat(600000) }, 1, { fontVersio })).versio, 2);
      const wide = '€'.repeat(4000), fields = Object.fromEntries(['title', 'subtitle', 'lead', 'heroImage', 'logoImage', 'copyright', 'icon', 'publishDate'].map(key => [key, wide]));
      await assert.rejects(save(owner, 'utf16', { ...fields, tags: Array.from({ length: 50 }, () => '€'.repeat(80)) }, 2, { fontVersio }), e => e.code === '22023' && /massa gran/.test(e.message));
      const [row] = (await pg.query("SELECT version,octet_length(payload::text) AS bytes FROM public.seed_revisions WHERE seed_id='utf16'")).rows;
      assert.equal(row.version, 2); assert.ok(row.bytes <= 700000);
    });
  } finally { await pg.close(); }
});
