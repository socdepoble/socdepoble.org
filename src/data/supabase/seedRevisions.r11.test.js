import { beforeEach, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ actor: 'A', generation: 0, request: vi.fn(), rpc: vi.fn() }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => state.actor ? { id: state.actor } : null,
  getResolvedConfig: config => ({ runtimeDataMode: 'remote', hasSupabaseConfig: true, tenantId: 'tenant', ...config }),
  request: (...args) => state.request(...args), rpc: (...args) => state.rpc(...args) }));
vi.mock('../identitat.js', () => ({ capturaSessio: () => { const epoch = state.generation; return () => { if (epoch !== state.generation) throw new DOMException('Changed', 'AbortError'); }; } }));
import { loadSeedRevisions, desaRevisioSeed } from './seedRevisions.js';
const row = { seccio: 'mur', id: 'post', camps: { title: 'New' }, versio: 1, fontVersio: 1 };
beforeEach(() => { state.actor = 'A'; state.generation = 0; state.request.mockReset(); state.rpc.mockReset(); });
test('read projects public columns, scopes tenant and checks response identity', async () => {
  state.request.mockResolvedValue([{ section: 'mur', seed_id: 'post', payload: row.camps, version: 1, source_version: 1 }]);
  expect(await loadSeedRevisions({ seccio: 'mur', ids: ['post'] })).toEqual([row]);
  expect(state.request.mock.calls[0][0]).toContain('select=section,seed_id,payload,version,source_version&tenant_id=eq.tenant');
  expect(state.request.mock.calls[0][2]).toMatchObject({ anonim: true });
  state.request.mockResolvedValue([{ section: 'mur', seed_id: 'foreign', payload: row.camps, version: 1, source_version: 1 }]);
  await expect(loadSeedRevisions({ seccio: 'mur', ids: ['post'] })).rejects.toMatchObject({ code: 'resposta-invalida' });
});
test('write verifies CAS response and cannot send client authority', async () => {
  state.rpc.mockResolvedValue(row); const input = { ...row, versio: 0 };
  expect(await desaRevisioSeed(input)).toEqual(row);
  expect(state.rpc.mock.calls[0][1]).toEqual({ p_tenant_id: 'tenant', p_section: 'mur', p_seed_id: 'post', p_payload: row.camps, p_version: 0, p_source_version: 1 });
  state.rpc.mockClear(); await expect(desaRevisioSeed({ ...input, author_id: 'A' })).rejects.toMatchObject({ code: 'seed-invalid' }); expect(state.rpc).not.toHaveBeenCalled();
  state.rpc.mockResolvedValue({ ...row, versio: 4 }); await expect(desaRevisioSeed(input)).rejects.toMatchObject({ code: 'resposta-invalida' });
});
test('actor switch during reply, local mode and absent identity fail closed', async () => {
  state.rpc.mockImplementation(async () => { state.generation++; return row; });
  await expect(desaRevisioSeed({ ...row, versio: 0 })).rejects.toMatchObject({ name: 'AbortError' });
  state.actor = null; await expect(desaRevisioSeed({ ...row, versio: 0 })).rejects.toMatchObject({ code: 'sense-sessio' });
  await expect(loadSeedRevisions({ seccio: 'mur', ids: ['post'] }, { runtimeDataMode: 'local' })).rejects.toMatchObject({ code: 'no-disponible' });
});
