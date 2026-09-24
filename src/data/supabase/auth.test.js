import { afterEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, changed: vi.fn(), epoch: 0, saved: vi.fn(), clear: vi.fn(), realtime: vi.fn(async () => {}), request: vi.fn() }));
vi.mock('../../config/storage.js', () => ({ getEfimer: () => 'synthetic-refresh' }));
vi.mock('../identitat.js', () => ({ CLAU_REFRESC: 'refresh', get versioSessio() { return m.epoch; },
  desaSessio: value => { m.epoch++; m.saved(value); return true; }, esborraSessio: () => { m.epoch++; m.clear(); },
  usuariDeSessio: () => m.user, actualitzaUsuariSessio: m.changed }));
vi.mock('../oauthRelay.js', () => ({ entraAmbGoogle: vi.fn(), gestionaTornada: vi.fn() }));
vi.mock('./runtime.js', () => ({ configuraRefrescSessio: vi.fn(), getCurrentUser: () => m.user,
  getResolvedConfig: config => ({ supabaseUrl: 'https://example.test', supabaseAnonKey: 'public', ...config }), request: m.request, rpc: vi.fn() }));
vi.mock('./realtime.js', () => ({ tancaRealtime: m.realtime }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { refreshSession, logout, loginWithPassword, updateProfile } from './auth.js';
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

test('perfil d’A pendent no escriu ni actualitza la sessió B', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'A' };
  const response = deferred(); m.request.mockReturnValueOnce(response.promise);
  const work = updateProfile({ full_name: 'Nom A' }); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  m.epoch++; m.user = { id: 'B' }; response.resolve({ id: 'A' }); await result;
  expect(m.request).toHaveBeenCalledTimes(1); expect(m.changed).not.toHaveBeenCalled();
});
test('PATCH de perfil sense fila confirmada no anuncia èxit', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'A' };
  m.request.mockResolvedValueOnce({ id: 'A' }).mockResolvedValueOnce([]);
  await expect(updateProfile({ full_name: 'Nom A' })).rejects.toThrow('no s’ha confirmat');
  expect(m.changed).not.toHaveBeenCalled();
});
test('perfil amb fila correcta actualitza la sessió vigent', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'A' };
  m.request.mockResolvedValueOnce({ id: 'A' }).mockResolvedValueOnce([{ id: 'A', full_name: 'Nom A' }]);
  expect(await updateProfile({ full_name: 'Nom A' })).toEqual({ id: 'A', full_name: 'Nom A' });
  expect(m.changed).toHaveBeenCalledTimes(1);
});
