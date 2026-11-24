import { expect, test, vi } from 'vitest';
const mock = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('./config.js', () => ({ getClient: async () => ({ rpc: mock.rpc }) }));
vi.mock('../identitat.js', () => ({ versioSessio: 0, usuariDeSessio: () => ({ id: 'A' }), jwtPerBackend: () => null, getDefaultUserId: () => 'A' }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: () => ({ runtimeDataMode: 'remote', tenantId: '00000000-0000-4000-8000-000000000001' }), generateUUID: () => 'uuid' }));
vi.mock('./utils.js', () => ({ handleError: error => error }));
import { loadMissatges, loadFils } from './xat.js';

test('R32.54 · xat_nous respecta també el límit demanat pel cridador', async () => {
  mock.rpc.mockReturnValue({ data: [], error: null, abortSignal() { return this; } });
  for (const limit of [1, 7, 50, 100]) {
    await loadMissatges('fil', { despresDeSeq: 123, limit });
    expect(mock.rpc).toHaveBeenLastCalledWith('xat_nous', { p_fil_id: 'fil', p_despres_de_seq: 123, p_limit: limit });
  }
});

test('R32.54 · límit API pendent: xat_fils_meus rep només tenant, cap cursor de recuperació', async () => {
  // Signatura canònica: 20261119143000_r32_14_xat_fils_previa_sense_amagats.sql
  // xat_fils_meus(p_tenant_id uuid) RETURNS TABLE. La firma no té p_limit ni
  // cursor; un doble que retalla a7 no permet deduir els13 que no han arribat.
  mock.rpc.mockClear();
  const rows = Array.from({ length: 20 }, (_, i) => ({ id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, tipus: 'grup', titol: `Fil ${i}` }));
  mock.rpc.mockReturnValue({ data: rows.slice(0, 7), error: null, abortSignal() { return this; } });
  const result = await loadFils({ limit: 20 });
  expect(result.filter(fil => !fil.perDefecte)).toHaveLength(7);
  expect(mock.rpc).toHaveBeenCalledTimes(1);
  expect(mock.rpc).toHaveBeenCalledWith('xat_fils_meus', { p_tenant_id: '00000000-0000-4000-8000-000000000001' });
});
