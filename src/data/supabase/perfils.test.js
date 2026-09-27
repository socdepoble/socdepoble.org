import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ request: vi.fn(), local: vi.fn(), user: null }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: m.request,
  getResolvedConfig: (config = {}) => ({ hasSupabaseConfig: true, runtimeDataMode: config.dataMode || 'remote', ...config }) }));
vi.mock('../localPerfils.js', () => ({ localPerfils: { loadPerfilPublic: m.local } }));
import { loadPerfilPublic } from './perfils.js';
beforeEach(() => { vi.clearAllMocks(); m.user = null; m.request.mockResolvedValue([]); m.local.mockResolvedValue({ id: 'demo' }); });

test.each(['socdepoble', '0001', '11111111-1a1a-0000-0000-000000000000'])('remot no suplix %s amb el catàleg demostratiu', async id => {
  expect(await loadPerfilPublic(id)).toBeNull();
  expect(m.local).not.toHaveBeenCalled();
});

test('només una organització confirmada pel servidor proporciona la identitat pública', async () => {
  m.request.mockResolvedValue([{ id: 'org-real', name: 'Sóc de Poble', slug: 'soc-de-poble', kind: 'company' }]);
  expect(await loadPerfilPublic('soc-de-poble')).toMatchObject({ id: 'org-real', nom: 'Sóc de Poble', tipus: 'entitat' });
});

test.each(['seed', 'local'])('%s conserva el catàleg darrere del seu adaptador', async dataMode => {
  expect(await loadPerfilPublic('socdepoble', { dataMode })).toEqual({ id: 'demo' });
  expect(m.local).toHaveBeenCalledWith('socdepoble', null);
  expect(m.request).not.toHaveBeenCalled();
});
