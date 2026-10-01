import { expect, test, vi } from 'vitest';
vi.mock('../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { configura, arrenca, injectaSessio } from '../host.js';
import { getBackendImplementation } from '../data/backendPort.js';
import { normalizeBackendConfig } from './backendConfig.js';

test('the public host installs a complete WordPress/Sollutia adapter and forwards dynamic configuration', async () => {
  expect(() => configura({ backend: {} })).toThrow('Nucli incomplet');
  const backend = Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, vi.fn()]));
  backend.adoptaSessioExterna = vi.fn(() => true);
  backend.loadNotes.mockResolvedValue({ notes: [{ id: 'wordpress-note' }] });
  const config = { backend_url: 'https://wordpress.example.test/wp-json/sdp/v1', tenant_id: '00000000-0000-0000-0000-000000000000' };
  const fetch = vi.spyOn(globalThis, 'fetch');
  try {
    const result = configura({ backend, ...config, config: { backendId: 'wordpress' } });
    expect(result.pendents).toEqual([]);
    await arrenca();
    const normalized = normalizeBackendConfig();
    expect(normalized).toMatchObject({ backendUrl: config.backend_url, tenantId: '00000000-0000-0000-0000-000000000000', backendId: 'wordpress' });
    expect(await getBackendImplementation().loadNotes('local-user', normalized)).toEqual({ notes: [{ id: 'wordpress-note' }] });
    expect(injectaSessio({ session: 'opaque-host-session' })).toBe(true);
    expect(backend.adoptaSessioExterna).toHaveBeenCalledWith({ session: 'opaque-host-session' }, {});
    expect(fetch).not.toHaveBeenCalled();
    expect(() => configura({ backend })).toThrow('arrancada');
  } finally { fetch.mockRestore(); }
});
