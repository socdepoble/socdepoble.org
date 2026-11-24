import { beforeEach, expect, test, vi } from 'vitest';
const remote = vi.hoisted(() => ({ request: vi.fn(), epoch: 0 }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => ({ id: 'A' }),
  getResolvedConfig: () => ({ runtimeDataMode: 'remote', hasSupabaseConfig: true, tenantId: 'tenant', supabaseUrl: 'https://fixture.invalid' }),
  request: (...args) => remote.request(...args), rpc: vi.fn() }));
vi.mock('../identitat.js', () => ({ capturaSessio: () => { const epoch = remote.epoch; return () => { if (remote.epoch !== epoch) throw new DOMException('Changed', 'AbortError'); }; } }));
import { loadSeedRevisions } from './seedRevisions.js';
const ids = Array.from({ length: 200 }, (_, i) => `post_${String(i).padStart(3, '0')}`);
const row = id => ({ section: 'mur', seed_id: id, payload: { title: id }, version: 1, source_version: 1 });
beforeEach(() => { remote.request.mockReset(); remote.epoch = 0; });

function pageServer(present, cap, { ranges = false } = {}) {
  remote.request.mockImplementation(async (url, _config, options) => {
    const params = new URL(url, 'http://local').searchParams;
    const wanted = params.get('seed_id').slice(4, -1).split(',');
    const matching = present.filter(id => wanted.includes(id));
    const page = matching.slice(0, cap).map(row);
    if (ranges) options.onResponseMetadata?.({ contentRange: page.length ? `0-${page.length - 1}/${matching.length}` : '*/0' });
    return page;
  });
}

test('R32.54 · 200 overlays amb max-rows7 es recuperen en lots de IDs pendents, sense duplicats', async () => {
  pageServer(ids, 7);
  const result = await loadSeedRevisions({ seccio: 'mur', ids });
  expect(result.map(r => r.id)).toEqual(ids);
  expect(remote.request).toHaveBeenCalledTimes(Math.ceil(200 / 7));
});
test('R32.54 · una minoria existent continua amb rang truncat i acaba amb total acreditat', async () => {
  pageServer(ids.slice(20, 30), 7, { ranges: true });
  expect((await loadSeedRevisions({ seccio: 'mur', ids })).map(r => r.id)).toEqual(ids.slice(20, 30));
  expect(remote.request).toHaveBeenCalledTimes(2);
});
test('R32.54 · sense rang, la cua buida confirma les revisions absents', async () => {
  pageServer(ids.slice(20, 30), 7);
  expect(await loadSeedRevisions({ seccio: 'mur', ids })).toHaveLength(10);
  expect(remote.request).toHaveBeenCalledTimes(3);
});
test('R32.54 · un servidor que ignora IDs pendents es rebutja, mai bucle o resposta parcial', async () => {
  remote.request.mockResolvedValue([row(ids[0])]);
  await expect(loadSeedRevisions({ seccio: 'mur', ids })).rejects.toMatchObject({ code: 'resposta-invalida' });
  expect(remote.request).toHaveBeenCalledTimes(2);
});
test('R32.54 · canvi de sessió durant la segona pàgina talla les següents', async () => {
  pageServer(ids, 7);
  const serve = remote.request.getMockImplementation();
  remote.request.mockImplementation(async (...args) => { const page = await serve(...args); if (remote.request.mock.calls.length === 2) remote.epoch++; return page; });
  await expect(loadSeedRevisions({ seccio: 'mur', ids })).rejects.toMatchObject({ name: 'AbortError' });
  expect(remote.request).toHaveBeenCalledTimes(2);
});
