import { afterEach, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ token: 'jwt-A', calls: [] }));
vi.mock('@supabase/supabase-js', () => ({ createClient: (url, key, options) => {
  const client = { removeAllChannels: vi.fn(), realtime: { setAuth: vi.fn() } };
  state.calls.push({ url, key, options }); return client;
} }));
vi.mock('../identitat.js', () => ({ jwtPerBackend: config => config.tenantId === 'A' ? state.token : null }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: config => ({ ...config, supabaseUrl: config.backend_url || config.supabaseUrl, hasSupabaseConfig: true }) }));
afterEach(() => { vi.resetModules(); state.calls.length = 0; });
test('SDK keeps explicit partial tenant and does not reuse the previous tenant JWT', async () => {
  const { getClient } = await import('./config.js');
  const first = await getClient({ backend_url: 'https://sollutia.example.test', supabaseAnonKey: 'anon', tenantId: 'A' });
  expect(state.calls[0].options.global.headers.Authorization).toBe('Bearer jwt-A');
  expect(await getClient({ tenantId: 'B' })).not.toBe(first);
  expect(state.calls[1].options.global.headers.Authorization).toBe('Bearer anon');
  expect(state.calls[1].url).toBe('https://sollutia.example.test');
});
