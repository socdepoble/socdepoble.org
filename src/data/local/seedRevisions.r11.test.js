import { afterEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { capturaRevisioSeed, capturaRespostaRevisioSeed, esFontPublicaRevisioSeed, aplicaRevisionsSeed } from '../seedRevisions.js';
import { creaAdaptadorLocal } from './adaptadorLocal.js';
import { creaContingutLocal } from './contingutLocal.js';
const TENANT = '11111111-1111-4111-8111-111111111111', A = '22222222-2222-4222-8222-222222222222', B = '33333333-3333-4333-8333-333333333333';
const instances = [];
afterEach(async () => { esborraSessio({ abast: 'tot' }); await Promise.all(instances.splice(0).map(a => a.destroy())); });
const create = extra => { const a = creaAdaptadorLocal({ mode: 'local', tenantId: TENANT, dades: { feedPosts: [{ id: 'owned', owner_user_id: A, title: 'Original' }, { id: 'textual', author_id: A }, { id: 'entity', owner_user_id: A, author_org_id: B }] }, ...extra }); instances.push(a); return a; };
const enter = (a, id = A) => { configuraBackendSessio(a.configuracio); expect(desaSessio({ access_token: 'r11-local-proof', user: { id } })).toBe(true); };
const revision = (extra = {}) => ({ seccio: 'mur', id: 'owned', camps: { title: 'New', content: '<p>Complete</p>' }, versio: 0, fontVersio: 1, ...extra });

test('neutral input rejects authority fields and getters without evaluating them', () => {
  const getter = vi.fn(); const input = revision(); Object.defineProperty(input.camps, 'author_id', { get: getter, enumerable: true });
  expect(() => capturaRevisioSeed(input)).toThrow(); expect(getter).not.toHaveBeenCalled();
  for (const extra of [{ versio: -1 }, { seccio: 'mercat' }, { id: '../escape' }, { camps: { content: '\ud800' } }, { camps: { publishDate: false } }]) expect(() => capturaRevisioSeed(revision(extra))).toThrow();
});
test('terminal integer version is readable after the last valid CAS and cannot wrap on write', () => {
  expect(capturaRespostaRevisioSeed(revision({ versio: 2147483647 })).versio).toBe(2147483647);
  expect(() => capturaRevisioSeed(revision({ versio: 2147483647 }))).toThrow();
  expect(capturaRevisioSeed(revision({ versio: 2147483646 })).versio).toBe(2147483646);
});
test('overlay refuses an old source version, including a race between app_content and revision reads', () => {
  const item = { id: 'owned', title: 'Canonical new edition', owner_user_id: B };
  expect(aplicaRevisionsSeed([item], [revision({ versio: 1 })], 2)).toEqual([item]);
  expect(aplicaRevisionsSeed([item], [revision({ versio: 1 })], 1)[0].title).toBe('New');
});
test('local and SQL publication flags agree; unpublished and duplicate seed sources cannot be revised', async () => {
  for (const flag of [{ status: 'draft' }, { visibility: 'private' }, { isPublished: false }, { visibility: null },
    { attributes: { visibility: 'private' } }, { payload: { status: 'draft' } }, { payload: { attributes: { isPublished: false } } }]) {
    expect(esFontPublicaRevisioSeed({ id: 'owned', ...flag })).toBe(false);
    const a = create({ dades: { feedPosts: [{ id: 'owned', owner_user_id: A, ...flag }] } }); enter(a);
    await expect(a.desaRevisioSeed(revision())).rejects.toMatchObject({ code: 'no-disponible' });
    expect(await a.loadSeedRevisions({ seccio: 'mur', ids: ['owned'] })).toEqual([]);
    enter(a, B); await expect(a.desaRevisioSeed(revision())).rejects.toMatchObject({ code: 'no-disponible' });
  }
  const duplicate = create({ dades: { feedPosts: [{ id: 'owned', owner_user_id: A }, { id: 'owned', owner_user_id: A }] } }); enter(duplicate);
  await expect(duplicate.desaRevisioSeed(revision())).rejects.toMatchObject({ code: 'no-disponible' });
  expect(esFontPublicaRevisioSeed({ status: 'published', visibility: 'public', isPublished: true })).toBe(true);
});
test('owner persists one revision, sees public overlay, and stale CAS leaves bytes unchanged', async () => {
  const a = create(); enter(a);
  expect(await a.desaRevisioSeed(revision())).toMatchObject({ versio: 1, camps: { title: 'New' } });
  expect((await a.loadMur()).feedPosts[0]).toMatchObject({ title: 'New', content: '<p>Complete</p>', _seedRevisioVersio: 1 });
  await expect(a.desaRevisioSeed(revision({ camps: { title: 'Stale' } }))).rejects.toMatchObject({ code: 'conflicte-versio' });
  const result = await a.desaRevisioSeed(revision({ versio: 1, camps: { publishDate: null } }));
  expect(result).toMatchObject({ versio: 2, camps: { title: 'New', content: '<p>Complete</p>', publishDate: null } });
  result.camps.title = 'Mutation'; expect((await a.loadSeedRevisions({ seccio: 'mur', ids: ['owned'] }))[0].camps.title).toBe('New');
});
test('textual metadata, entity signature and forged config cannot authorize an ordinary actor', async () => {
  const a = create(); enter(a);
  for (const id of ['textual', 'entity']) await expect(a.desaRevisioSeed(revision({ id }), { role: 'superadmin', aal: 'aal2' })).rejects.toMatchObject({ code: 'no-disponible' });
  await expect(a.desaRevisioSeed(revision(), { tenantId: B })).rejects.toMatchObject({ code: 'sense-permis' });
  enter(a, B); await expect(a.desaRevisioSeed(revision())).rejects.toMatchObject({ code: 'no-disponible' });
});
test('inputs and session are captured at invocation, before the async guard', async () => {
  const a = create(); enter(a); const input = revision(); const pending = a.desaRevisioSeed(input); input.camps.title = 'Changed after invocation';
  expect((await pending).camps.title).toBe('New');
  const next = a.desaRevisioSeed(revision({ versio: 1 })); enter(a, B);
  await expect(next).rejects.toMatchObject({ name: 'AbortError' }); enter(a);
  expect((await a.loadSeedRevisions({ seccio: 'mur', ids: ['owned'] }))[0].versio).toBe(1);
});
test('a withdrawn, private or duplicated backend source stops exposing an already saved revision', async () => {
  const sources = [{ id: 'owned', owner_user_id: A }];
  const content = creaContingutLocal({ copia: value => value === sources ? sources : structuredClone(value), coleccio: key => key === 'feedPosts' ? sources : [],
    configuracio: { tenantId: TENANT }, opcions: {}, alTancar: () => {}, usuari: () => ({ id: A }), abast: () => () => {},
    dadesObertes: { estat: {} }, nouId: () => 'local-fixture-row', ara: () => new Date('2026-11-07T05:00:00Z') });
  await content.desaRevisioSeed(revision());
  /* A trusted backend replacement, exercised through the same current-source
     lookup. Public arrays returned to clients are still defensive copies. */
  const query = { seccio: 'mur', ids: ['owned'] };
  expect(await content.loadSeedRevisions(query)).toHaveLength(1);
  sources[0].visibility = 'private'; expect(await content.loadSeedRevisions(query)).toEqual([]);
  delete sources[0].visibility;
  sources[0].attributes = { visibility: 'private' }; expect(await content.loadSeedRevisions(query)).toEqual([]);
  delete sources[0].attributes;
  sources[0].payload = { status: 'draft' }; expect(await content.loadSeedRevisions(query)).toEqual([]);
  delete sources[0].payload; sources.push({ ...sources[0] }); expect(await content.loadSeedRevisions(query)).toEqual([]);
  sources.splice(0); expect(await content.loadSeedRevisions(query)).toEqual([]);
  // No operation can mutate a publication's visibility through editorial fields.
  await expect(content.desaRevisioSeed(revision({ camps: { visibility: 'private' }, versio: 1 }))).rejects.toMatchObject({ code: 'seed-invalid' });
});
test('public metadata accepts a future event date; container vetoes do not inspect calendar fields', async () => {
  const event = { id: 'future-event', owner_user_id: A, date: '2099-07-01', inici: '2099-07-01T10:00:00Z', attributes: { visibility: 'public' }, payload: { status: 'published' } };
  expect(esFontPublicaRevisioSeed(event)).toBe(true);
  const a = create({ dades: { events: [event] } }); enter(a);
  await expect(a.desaRevisioSeed(revision({ seccio: 'events', id: event.id }))).resolves.toMatchObject({ versio: 1 });
  expect(await a.loadSeedRevisions({ seccio: 'events', ids: [event.id] })).toHaveLength(1);
});
test('personal export includes only the current writer’s own fields and never another writer’s retained public fields', async () => {
  const a = create({ administracioLocal: { pobles: [{ id: TENANT, slug: 'poble', nom: 'Poble' }], autoritza: async ({ personaId }) => personaId === B } });
  enter(a); await a.desaRevisioSeed(revision({ camps: { content: '<p>A-only contribution</p>' } }));
  const aExport = await a.exportaLesMeuesDades();
  expect(aExport.seed_revisions).toHaveLength(1); expect(aExport.seed_revisions[0]).toMatchObject({ author_id: A, payload: { content: '<p>A-only contribution</p>' } });
  enter(a, B); expect((await a.exportaLesMeuesDades()).seed_revisions).toEqual([]);
  await a.desaRevisioSeed(revision({ versio: 1, camps: { title: 'B-only contribution' } }));
  const bExport = await a.exportaLesMeuesDades();
  expect(bExport.seed_revisions).toHaveLength(1); expect(bExport.seed_revisions[0].payload).toEqual({ title: 'B-only contribution' });
  expect(JSON.stringify(bExport.seed_revisions)).not.toContain(A); expect(JSON.stringify(bExport.seed_revisions)).not.toContain('A-only');
  expect((await a.loadSeedRevisions({ seccio: 'mur', ids: ['owned'] }))[0].camps.content).toContain('A-only');
  enter(a); expect((await a.exportaLesMeuesDades()).seed_revisions).toEqual([]);
});
test('a pending export containing seed data is withheld after an account switch', async () => {
  let release, began;
  const held = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { began = resolve; });
  const a = create({ magatzemNotes: { read: async () => { began(); return held; }, mutate: async () => {} } });
  enter(a); await a.desaRevisioSeed(revision({ camps: { content: '<p>A own export sentinel</p>' } }));
  const result = a.exportaLesMeuesDades(), rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });
  await started; enter(a, B); release({}); await rejected;
});
