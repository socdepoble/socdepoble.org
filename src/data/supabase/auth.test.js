import { afterEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ epoch: 0, saved: vi.fn(), clear: vi.fn(), realtime: vi.fn(async () => {}), request: vi.fn() }));
vi.mock('../../config/storage.js', () => ({ getEfimer: () => 'synthetic-refresh' }));
vi.mock('../identitat.js', () => ({ CLAU_REFRESC: 'refresh', get versioSessio() { return m.epoch; },
  desaSessio: value => { m.epoch++; m.saved(value); return true; }, esborraSessio: () => { m.epoch++; m.clear(); },
  usuariDeSessio: () => ({ id: 'A' }), actualitzaUsuariSessio: vi.fn() }));
vi.mock('../oauthRelay.js', () => ({ entraAmbGoogle: vi.fn(), gestionaTornada: vi.fn() }));
vi.mock('./runtime.js', () => ({ configuraRefrescSessio: vi.fn(), getCurrentUser: () => ({ id: 'A' }),
  getResolvedConfig: config => ({ supabaseUrl: 'https://example.test', supabaseAnonKey: 'public', ...config }), request: m.request, rpc: vi.fn() }));
vi.mock('./realtime.js', () => ({ tancaRealtime: m.realtime }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { refreshSession, logout, loginWithPassword } from './auth.js';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
afterEach(() => { vi.unstubAllGlobals(); m.saved.mockClear(); });
test('logout invalida abans d’esperar Realtime i una renovació antiga no restaura credencials', async () => {
  const body = deferred(), closing = deferred();
  const fetch = vi.fn(async () => ({ ok: true, json: () => body.promise })); vi.stubGlobal('fetch', fetch);
  const refresh = refreshSession(); await Promise.resolve();
  m.realtime.mockReturnValueOnce(closing.promise);
  const before = m.epoch; const exit = logout();
  expect(m.epoch).toBeGreaterThan(before);
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
  expect(fetch.mock.calls[0][1].redirect).toBe('error');
  body.resolve({ access_token: 'old', user: { id: 'A' } }); await refresh;
  expect(m.saved).not.toHaveBeenCalled(); closing.resolve(); await exit;
});
test('una sessió nova no reutilitza la promesa de renovació antiga', async () => {
  const first = deferred(), second = deferred();
  vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise));
  const a = refreshSession(); m.epoch++; const b = refreshSession();
  expect(a).not.toBe(b);
  first.resolve({ ok: false, status: 401 }); await a;
  const c = refreshSession(); expect(c).toBe(b);
  second.resolve({ ok: true, json: async () => ({ access_token: 'new', user: { id: 'B' } }) });
  expect(await b).toBe(true); expect(m.saved).toHaveBeenCalledTimes(1);
});
test('login tardà després de logout no entra de nou', async () => {
  const response = deferred(); m.request.mockReturnValueOnce(response.promise);
  const login = loginWithPassword('synthetic@example.test', 'synthetic');
  const assertion = expect(login).rejects.toMatchObject({ name: 'AbortError' });
  await logout(); response.resolve({ access_token: 'old', user: { id: 'A' } });
  await assertion; expect(m.saved).not.toHaveBeenCalled();
});
