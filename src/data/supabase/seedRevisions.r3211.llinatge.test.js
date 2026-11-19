// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ request: vi.fn(), rpc: vi.fn() }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => ({ id: 'actor' }), getResolvedConfig: c => ({ runtimeDataMode: 'remote', hasSupabaseConfig: true, tenantId: 'tenant-A', supabaseUrl: 'https://backend-A.test', ...c }), request: (...a) => state.request(...a), rpc: (...a) => state.rpc(...a) }));
vi.mock('../identitat.js', () => ({ capturaSessio: () => () => {} }));
import { loadSeedRevisions, desaRevisioSeed } from './seedRevisions.js';
const row = { seccio: 'mur', id: 'post', camps: { title: 'Nou' }, versio: 1, fontVersio: 1 };
const input = () => ({ ...row, camps: { ...row.camps }, versio: 0 });
beforeEach(() => { state.rpc.mockReset(); state.request.mockReset(); });

test.each(['tenantId', 'supabaseUrl'])('CAS seed R32.11: canviar %s mentre arriba ACK no confirma revisió d’un altre context', async camp => {
  const config = {}; state.rpc.mockImplementation(async () => { config[camp] = camp === 'tenantId' ? 'tenant-B' : 'https://backend-B.test'; return row; });
  const intent = input();
  await expect(desaRevisioSeed(intent, config)).rejects.toMatchObject({ name: 'AbortError' });
  expect(state.rpc).toHaveBeenCalledOnce(); expect(intent.versio).toBe(0); expect(intent.camps.title).toBe('Nou');
});

test.each(['tenantId', 'abort'])('CAS seed R32.11: lectura pública tardana amb %s no solapa el nou context', async canvi => {
  const c = new AbortController(), config = { signal: c.signal };
  state.request.mockImplementation(async () => { if (canvi === 'abort') c.abort(); else config.tenantId = 'tenant-B'; return [{ section: 'mur', seed_id: 'post', payload: row.camps, version: 1, source_version: 1 }]; });
  await expect(loadSeedRevisions({ seccio: 'mur', ids: ['post'] }, config)).rejects.toMatchObject({ name: 'AbortError' });
});

test.each([{ versio: 0 }, { versio: 2 }, { fontVersio: 2 }, { camps: { title: 'Mutat' } }, { id: 'other' }])('CAS seed R32.11: mutant ACK %j no és confirmació', async mutant => {
  state.rpc.mockResolvedValue({ ...row, ...mutant });
  await expect(desaRevisioSeed(input())).rejects.toThrow();
  expect(state.rpc).toHaveBeenCalledOnce();
});

test('CAS seed R32.11: RPC absent no activa fallback; error conserva draft i token', async () => {
  const intent = input(); state.rpc.mockRejectedValue(Object.assign(new Error('SDP-SEED-004'), { status: 404 }));
  await expect(desaRevisioSeed(intent)).rejects.toMatchObject({ code: 'no-disponible' });
  expect(state.rpc.mock.calls.map(([nom]) => nom)).toEqual(['desa_revisio_seed']); expect(state.request).not.toHaveBeenCalled();
  expect(intent).toEqual(input());
});
