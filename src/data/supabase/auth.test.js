import { afterEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, exp: null, changed: vi.fn(), epoch: 0, refreshes: 0, saveOk: true, saved: vi.fn(), clear: vi.fn(), realtime: vi.fn(async () => {}), request: vi.fn() }));
vi.mock('../../config/storage.js', () => ({ getEfimer: () => 'synthetic-refresh' }));
vi.mock('../identitat.js', () => ({ CLAU_REFRESC: 'refresh', get versioSessio() { return m.epoch; },
  desaSessio: (value, options) => { m.epoch++; if (options?.renovacio) m.refreshes++; m.saved(value); return m.saveOk; },
  capturaSessio: () => { const generation = m.epoch - m.refreshes; return () => { if (generation !== m.epoch - m.refreshes) throw new DOMException('La sessió ha canviat.', 'AbortError'); }; }, esborraSessio: () => { m.epoch++; m.clear(); },
  usuariDeSessio: () => m.user, actualitzaUsuariSessio: m.changed,
  caducitatJwt: () => m.exp, MARGE_RENOVACIO_MS: 60_000 }));
vi.mock('../oauthRelay.js', () => ({ entraAmbGoogle: vi.fn(), gestionaTornada: vi.fn() }));
vi.mock('./runtime.js', () => ({ configuraRefrescSessio: vi.fn(), getCurrentUser: () => m.user,
  getResolvedConfig: config => ({ supabaseUrl: 'https://example.test', supabaseAnonKey: 'public', ...config }), request: m.request, rpc: vi.fn() }));
vi.mock('./realtime.js', () => ({ tancaRealtime: m.realtime }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { refreshSession, logout, loginWithPassword, updateProfile, updateUserPassword, registerWithPassword } from './auth.js';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
afterEach(() => { vi.unstubAllGlobals(); m.saved.mockReset(); m.exp = null; });
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

/* ───────── Un JWT caducat no ix del client (tasca 4, auditoria 260925_1316) ─────────
   request() no reintenta les rutes /auth/: qui hi escriu ha de renovar abans. */
const renovacioBona = (ordre) => vi.fn(async () => { ordre.push('renova'); return { ok: true, json: async () => ({ access_token: 'new', user: { id: 'A' } }) }; });
test('contrasenya amb el JWT caducat: es renova ABANS del PUT /auth/v1/user', async () => {
  m.request.mockReset(); m.user = null; m.exp = Date.now() - 1000;
  const ordre = []; vi.stubGlobal('fetch', renovacioBona(ordre));
  m.saved.mockImplementationOnce(() => { m.user = { id: 'A' }; m.exp = Date.now() + 3600_000; });
  m.request.mockImplementationOnce(async (path, _config, options) => { ordre.push(`${options.method} ${path}`); return { id: 'A' }; });
  expect(await updateUserPassword('contrasenya-nova')).toBe(true);
  expect(ordre).toEqual(['renova', 'PUT /auth/v1/user']);
});
test('contrasenya sense sessió recuperable: no s’envia res i el missatge és clar', async () => {
  m.request.mockReset(); m.user = null; m.exp = Date.now() - 1000;
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401 })));
  await expect(updateUserPassword('contrasenya-nova')).rejects.toMatchObject({ name: 'AbortError' });
  expect(m.request).not.toHaveBeenCalled();
});
test('perfil amb el JWT a punt de caducar: es renova abans del PUT /auth/v1/user', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'A' }; m.exp = Date.now() + 10_000;
  const ordre = []; vi.stubGlobal('fetch', renovacioBona(ordre));
  m.saved.mockImplementationOnce(() => { m.exp = Date.now() + 3600_000; });
  m.request.mockImplementation(async (path, _config, options) => {
    ordre.push(`${options.method} ${path.split('?')[0]}`);
    return path.startsWith('/auth/') ? { id: 'A' } : [{ id: 'A', full_name: 'Nom A' }];
  });
  expect(await updateProfile({ full_name: 'Nom A' })).toEqual({ id: 'A', full_name: 'Nom A' });
  expect(ordre).toEqual(['renova', 'PUT /auth/v1/user', 'PATCH /rest/v1/profiles']);
});

for (const mutation of [() => updateProfile({ full_name: 'Nom A' }), () => updateUserPassword('nou')]) {
  for (const change of ['B', 'logout', 'reentrada A']) {
    test(`renovació pendent: ${mutation.toString()} aborta davant ${change} sense cap escriptura`, async () => {
      m.request.mockReset(); m.user = { id: 'A' }; m.exp = Date.now() + 10_000;
      const pending = deferred(); vi.stubGlobal('fetch', vi.fn(() => pending.promise));
      const work = mutation(); const assertion = expect(work).rejects.toMatchObject({ name: 'AbortError' });
      m.epoch++; m.user = change === 'B' ? { id: 'B' } : change === 'logout' ? null : { id: 'A' };
      pending.resolve({ ok: true, json: async () => ({ access_token: 'late', user: { id: 'A' } }) });
      await assertion; expect(m.request).not.toHaveBeenCalled();
    });
  }
}
test('resposta tardana de contrasenya no anuncia èxit després de reentrada', async () => {
  m.request.mockReset(); m.user = { id: 'A' }; m.exp = null;
  const pending = deferred(); m.request.mockReturnValueOnce(pending.promise);
  const work = updateUserPassword('nou'); const assertion = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await Promise.resolve(); m.epoch++; pending.resolve({ id: 'A' }); await assertion;
});
test('la configuració es captura abans de renovar', async () => {
  m.request.mockReset(); m.user = { id: 'A' }; m.exp = Date.now() + 10_000;
  const pending = deferred(); vi.stubGlobal('fetch', vi.fn(() => pending.promise));
  const config = { supabaseUrl: 'https://original.example.test' };
  const work = updateUserPassword('nou', config); config.supabaseUrl = 'https://substitut.example.test';
  m.saved.mockImplementationOnce(() => { m.exp = Date.now() + 3600_000; });
  m.request.mockResolvedValueOnce({ id: 'A' });
  pending.resolve({ ok: true, json: async () => ({ access_token: 'new', user: { id: 'A' } }) });
  await work; expect(m.request.mock.calls[0][1].supabaseUrl).toBe('https://original.example.test');
});
for (const enter of [loginWithPassword, registerWithPassword]) {
  test(`${enter.name} no anuncia èxit si no pot desar la sessió`, async () => {
    m.request.mockReset(); m.request.mockResolvedValueOnce({ access_token: 'new', user: { id: 'A' } }); m.saveOk = false;
    try { await expect(enter('synthetic@example.test', 'nou')).rejects.toThrow('No s’ha pogut desar'); }
    finally { m.saveOk = true; }
  });
}

for (const near of [false, true]) {
  test(`fallada de xarxa en refresh: JWT ${near ? 'encara vàlid' : 'caducat'}`, async () => {
    m.request.mockReset(); m.exp = Date.now() + (near ? 10_000 : -10_000); m.user = near ? { id: 'A' } : null;
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    m.request.mockResolvedValueOnce({ id: 'A' });
    if (near) expect(await updateUserPassword('nou')).toBe(true);
    else { await expect(updateUserPassword('nou')).rejects.toThrow('La sessió ha caducat'); expect(m.request).not.toHaveBeenCalled(); }
  });
}
