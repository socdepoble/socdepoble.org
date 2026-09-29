import { afterEach, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ token: 'jwt-A', calls: [], clients: [], setAuth: null }));
vi.mock('@supabase/supabase-js', () => ({ createClient: (url, key, options) => {
  const client = { removeAllChannels: vi.fn(), realtime: { setAuth: vi.fn((...args) => state.setAuth?.(...args)) } };
  state.calls.push({ url, key, options }); state.clients.push(client); return client;
} }));
vi.mock('../identitat.js', () => ({ jwtPerBackend: config => config.tenantId === 'A' ? state.token : null }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: config => ({ ...config, supabaseUrl: config.backend_url || config.supabaseUrl, hasSupabaseConfig: true }) }));
afterEach(() => { vi.resetModules(); state.calls.length = 0; state.clients.length = 0; state.token = 'jwt-A'; state.setAuth = null; });
const TENANT_A = { backend_url: 'https://sollutia.example.test', supabaseAnonKey: 'anon', tenantId: 'A' };
test('SDK keeps explicit partial tenant and does not reuse the previous tenant JWT', async () => {
  const { getClient } = await import('./config.js');
  const first = await getClient({ backend_url: 'https://sollutia.example.test', supabaseAnonKey: 'anon', tenantId: 'A' });
  expect(state.calls[0].options.global.headers.Authorization).toBe('Bearer jwt-A');
  expect(await getClient({ tenantId: 'B' })).not.toBe(first);
  expect(state.calls[1].options.global.headers.Authorization).toBe('Bearer anon');
  expect(state.calls[1].url).toBe('https://sollutia.example.test');
});

/* T48 · «Multiple GoTrueClient instances detected»: el client no porta auth-js. */
test('T48 · el JWT entra per accessToken i el client no rep cap opció d’auth', async () => {
  const { getClient, clientActual } = await import('./config.js');
  expect(clientActual()).toBeNull();
  await getClient(TENANT_A);
  const { options } = state.calls[0];
  expect(options.auth).toBeUndefined();
  expect(await options.accessToken()).toBe('jwt-A');
  await getClient({ tenantId: 'B' });
  expect(state.calls[1].options.auth).toBeUndefined();
  expect(await state.calls[1].options.accessToken()).toBeNull();
});

test('T48 · dues crides concurrents amb el mateix JWT creen un sol client', async () => {
  const { getClient, clientActual } = await import('./config.js');
  const [a, b] = await Promise.all([getClient(TENANT_A), getClient(TENANT_A)]);
  expect(a).toBe(b);
  expect(state.calls).toHaveLength(1);
  expect(clientActual()).toBe(a);
});

test('T48 · resetClient anul·la la creació en curs: el candidat no es publica', async () => {
  let allibera;
  state.setAuth = () => new Promise(resolve => { allibera = resolve; });
  const { getClient, resetClient, clientActual } = await import('./config.js');
  const pendent = getClient(TENANT_A);
  resetClient();
  allibera();
  await expect(pendent).rejects.toThrow('cal reintentar');
  expect(state.clients[0].removeAllChannels).toHaveBeenCalled();
  expect(clientActual()).toBeNull();
  state.setAuth = null;
  const nou = await getClient(TENANT_A);
  expect(nou).toBe(state.clients[1]);
  expect(clientActual()).toBe(nou);
});

test('T48 · desar el nom (mateix JWT) no reinicia el client; un JWT nou sí', async () => {
  const { getClient } = await import('./config.js');
  const primer = await getClient(TENANT_A);
  window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: { id: 'u', nom: 'Nom nou' } } }));
  expect(primer.removeAllChannels).not.toHaveBeenCalled();
  expect(await getClient()).toBe(primer);
  expect(state.calls).toHaveLength(1);
  state.token = 'jwt-B';
  window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: { id: 'u' } } }));
  expect(primer.removeAllChannels).toHaveBeenCalled();
});

test('T48 · donar de baixa, tancar i reautenticar el temps real mai creen un client', async () => {
  const { tancaRealtime, reautenticaRealtime, unsubscribe } = await import('./realtime.js');
  await tancaRealtime(); await reautenticaRealtime(); await unsubscribe({ canal: 'x' });
  expect(state.calls).toHaveLength(0);
  const { getClient } = await import('./config.js');
  const client = await getClient(TENANT_A);
  Object.assign(client, { removeChannel: vi.fn() });
  Object.assign(client.realtime, { disconnect: vi.fn(), connect: vi.fn() });
  await unsubscribe('canal');
  expect(client.removeChannel).toHaveBeenCalledWith('canal');
  await reautenticaRealtime();
  expect(client.realtime.connect).toHaveBeenCalled();
  await tancaRealtime();
  expect(client.removeAllChannels).toHaveBeenCalled();
  expect(state.calls).toHaveLength(1);
});
