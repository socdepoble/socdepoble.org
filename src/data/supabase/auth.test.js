import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, exp: null, changed: vi.fn(), epoch: 0, refreshes: 0, saveOk: true, saved: vi.fn(), clear: vi.fn(), realtime: vi.fn(async () => {}), request: vi.fn() }));
vi.mock('../../config/storage.js', () => ({ getEfimer: () => 'synthetic-refresh' }));
/* D1: auth.js tria el refresh token amb triaRefresc; ací sempre és el de la pestanya. */
vi.mock('../identitat.js', () => ({ configuraBackendSessio: vi.fn(), esBackendDeSessio: () => true, jwtPerBackend: () => 'synthetic-refresh', CLAU_REFRESC: 'refresh', CLAU_JWT: 'jwt', CLAU_ORIGEN: 'origen', get versioSessio() { return m.epoch; },
  triaRefresc: () => ({ rt: 'synthetic-refresh', mode: 'efimer', sub: 'A' }), rotaRegistre: vi.fn(), oblidaRegistre: vi.fn(),
  desaSessio: (value, options) => { m.epoch++; if (options?.renovacio) m.refreshes++; m.saved(value); return m.saveOk; },
  capturaSessio: () => { const generation = m.epoch - m.refreshes; return () => { if (generation !== m.epoch - m.refreshes) throw new DOMException('La sessió ha canviat.', 'AbortError'); }; }, esborraSessio: () => { m.epoch++; m.clear(); },
  usuariDeSessio: () => m.user, actualitzaUsuariSessio: m.changed,
  caducitatJwt: () => m.exp, MARGE_RENOVACIO_MS: 60_000 }));
vi.mock('../oauthRelay.js', () => ({ entraAmbGoogle: vi.fn(), gestionaTornada: vi.fn() }));
vi.mock('./runtime.js', () => ({ configuraRefrescSessio: vi.fn(), getCurrentUser: () => m.user,
  getResolvedConfig: config => ({ supabaseUrl: 'https://example.test', supabaseAnonKey: 'public', runtimeDataMode: config.dataMode || 'remote', ...config }), request: m.request, rpc: vi.fn() }));
vi.mock('./realtime.js', () => ({ tancaRealtime: m.realtime }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { refreshSession, logout, loginWithPassword, updateProfile, updateUserPassword, registerWithPassword, loginWithGoogle, recullTornadaOAuth, getProfile, comprovaServidor } from './auth.js';
import { rpc } from './runtime.js';
import { entraAmbGoogle, gestionaTornada } from '../oauthRelay.js';
import { CODI_ENTRADA } from '../errorsBackend.js';

test.each(['localhost', '127.0.0.1', '[::1]'])('Google en %s explica l’alternativa sense obrir OAuth', async host => {
  entraAmbGoogle.mockClear();
  await expect(loginWithGoogle({ supabaseUrl: `http://${host}:54321` })).rejects.toMatchObject({
    code: 'GOOGLE_LOCAL_UNAVAILABLE',
    message: 'El login amb Google només està disponible a Producció. Utilitza correu i contrasenya.'
  });
  expect(entraAmbGoogle).not.toHaveBeenCalled();
});

test.each(['seed', 'local'])('cap entrada remota es pot guardar dins de %s', async dataMode => {
  m.request.mockClear(); entraAmbGoogle.mockClear(); gestionaTornada.mockClear();
  const config = { dataMode };
  await expect(loginWithPassword('a@example.test', 'password', config)).rejects.toThrow('entrada real');
  await expect(registerWithPassword('a@example.test', 'password', {}, config)).rejects.toThrow('entrada real');
  await expect(loginWithGoogle(config)).rejects.toThrow('entrada real');
  await expect(recullTornadaOAuth(config)).rejects.toThrow('entrada real');
  /* T4 · A més del text de sempre, el codi neutral: la interfície no llig el missatge. */
  for (const entra of [() => loginWithPassword('a@example.test', 'password', config),
    () => registerWithPassword('a@example.test', 'password', {}, config), () => loginWithGoogle(config), () => recullTornadaOAuth(config)]) {
    await expect(entra()).rejects.toMatchObject({ code: CODI_ENTRADA.MODE_LOCAL });
  }
  expect(m.request).not.toHaveBeenCalled();
  expect(entraAmbGoogle).not.toHaveBeenCalled();
  expect(gestionaTornada).not.toHaveBeenCalled();
});
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
/* D1: eixir revoca al servidor; cap prova ha d'eixir de veres a la xarxa. */
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 204 }))); });
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
test('PATCH de perfil sense fila confirmada no anuncia èxit ni escriu a GoTrue', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'A' };
  /* Una baixa en curs: la política restrictiva «profiles sense baixa» torna []. */
  m.request.mockResolvedValueOnce([]);
  await expect(updateProfile({ is_public: true })).rejects.toThrow('no s’ha confirmat');
  expect(m.request).toHaveBeenCalledTimes(1);
  expect(m.request.mock.calls[0][2].method).toBe('PATCH');
  expect(m.changed).not.toHaveBeenCalled();
});
test('perfil amb fila correcta actualitza la sessió vigent', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'A' };
  m.request.mockResolvedValueOnce([{ id: 'A', full_name: 'Nom A' }]).mockResolvedValueOnce({ id: 'A' });
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
test('perfil amb el JWT a punt de caducar: es renova abans del PATCH i del PUT /auth/v1/user', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'A' }; m.exp = Date.now() + 10_000;
  const ordre = []; vi.stubGlobal('fetch', renovacioBona(ordre));
  m.saved.mockImplementationOnce(() => { m.exp = Date.now() + 3600_000; });
  m.request.mockImplementation(async (path, _config, options) => {
    ordre.push(`${options.method} ${path.split('?')[0]}`);
    return path.startsWith('/auth/') ? { id: 'A' } : [{ id: 'A', full_name: 'Nom A' }];
  });
  expect(await updateProfile({ full_name: 'Nom A' })).toEqual({ id: 'A', full_name: 'Nom A' });
  expect(ordre).toEqual(['renova', 'PATCH /rest/v1/profiles', 'PUT /auth/v1/user']);
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
test('credencials rebutjades: l’adaptador tradueix el 400 invalid_credentials de GoTrue en una frase', async () => {
  const cru = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${cos}`), { status });
  const original = cru(400, '{"code":400,"error_code":"invalid_credentials","msg":"Invalid login credentials"}');
  m.request.mockReset().mockRejectedValueOnce(original);
  await expect(loginWithPassword('synthetic@example.test', 'x')).rejects.toMatchObject({
    message: 'El correu o la contrasenya no són correctes.', status: 400, cause: original, code: CODI_ENTRADA.CREDENCIALS
  });
  /* Correcció de la revisió T1–T4 (260930) · Abans, les respostes 4xx sense traducció
     (un codi desconegut, un altre estat, un cos que no és JSON) passaven intactes i la
     vista en parsejava el `msg` en anglés. Ara són DESCONEGUT, amb la frase genèrica
     valenciana i l'original a `cause`: la prova és més estricta, no més fluixa. El
     TypeError que no és de xarxa (no és cap resposta del servidor) continua intacte. */
  for (const error of [cru(400, '{"error_code":"__proto__","msg":{}}'), cru(403, '{"error_code":"invalid_credentials"}'), cru(400, 'no és JSON')]) {
    m.request.mockRejectedValueOnce(error);
    await expect(loginWithPassword('synthetic@example.test', 'x')).rejects.toMatchObject({
      code: CODI_ENTRADA.DESCONEGUT, status: error.status, cause: error,
      message: 'No s’ha pogut completar l’operació. Revisa les dades i torna-ho a provar.'
    });
  }
  const programa = new TypeError('offline');
  m.request.mockRejectedValueOnce(programa);
  await expect(loginWithPassword('synthetic@example.test', 'x')).rejects.toBe(programa);
});

/* ───────── T4 · Vocabulari neutral d'errors d'entrada (CODI_ENTRADA) ───────── */

const cruGoTrue = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${cos}`), { name: 'ErrorSupabase', status });
const CASOS_GOTRUE = [
  ['400 email_not_confirmed', () => cruGoTrue(400, '{"code":400,"error_code":"email_not_confirmed","msg":"Email not confirmed"}'), CODI_ENTRADA.CORREU_PENDENT, 400],
  ['422 weak_password', () => cruGoTrue(422, '{"code":422,"error_code":"weak_password","msg":"Password should be at least 6 characters.","weak_password":{"reasons":["length"]}}'), CODI_ENTRADA.CONTRASENYA_FEBLE, 422],
  ['422 user_already_exists', () => cruGoTrue(422, '{"code":422,"error_code":"user_already_exists","msg":"User already registered"}'), CODI_ENTRADA.COMPTE_EXISTENT, 422],
  ['422 email_exists', () => cruGoTrue(422, '{"code":422,"error_code":"email_exists","msg":"Email address already registered"}'), CODI_ENTRADA.COMPTE_EXISTENT, 422],
  ['429 sense cos', () => cruGoTrue(429, 'Too Many Requests'), CODI_ENTRADA.MASSA_INTENTS, 429],
  ['400 over_email_send_rate_limit', () => cruGoTrue(400, '{"error_code":"over_email_send_rate_limit","msg":"email rate limit exceeded"}'), CODI_ENTRADA.MASSA_INTENTS, 400],
  ['500 del servidor', () => cruGoTrue(500, '{"msg":"Internal Server Error"}'), CODI_ENTRADA.SERVIDOR_INABASTABLE, 500],
  ['503 del servidor', () => cruGoTrue(503, 'Service Unavailable'), CODI_ENTRADA.SERVIDOR_INABASTABLE, 503],
  ['xarxa (estat 0)', () => cruGoTrue(0, 'Error de xarxa'), CODI_ENTRADA.SERVIDOR_INABASTABLE, 0],
  ['temps esgotat', () => Object.assign(new Error('La petició ha trigat massa temps.'), { name: 'TimeoutError' }), CODI_ENTRADA.SERVIDOR_INABASTABLE, undefined],
  /* Correcció de la revisió T1–T4 (260930) · Els 4xx sense codi neutral: DESCONEGUT. */
  ['422 signup_disabled', () => cruGoTrue(422, '{"code":422,"error_code":"signup_disabled","msg":"Signups not allowed for this instance"}'), CODI_ENTRADA.DESCONEGUT, 422],
  ['422 validation_failed', () => cruGoTrue(422, '{"code":422,"error_code":"validation_failed","msg":"Unable to validate email address: invalid format"}'), CODI_ENTRADA.DESCONEGUT, 422],
  ['400 email_address_invalid', () => cruGoTrue(400, '{"code":400,"error_code":"email_address_invalid","msg":"Email address is invalid"}'), CODI_ENTRADA.DESCONEGUT, 400],
  ['400 GoTrue antic sense error_code', () => cruGoTrue(400, '{"error":"invalid_grant","error_description":"Invalid login credentials"}'), CODI_ENTRADA.DESCONEGUT, 400]
];
for (const entra of [loginWithPassword, registerWithPassword]) {
  test.each(CASOS_GOTRUE)(`T4 · ${entra.name}: %s → code neutral, missatge valencià i l’original a cause`, async (_nom, fes, code, status) => {
    const original = fes();
    m.request.mockReset().mockRejectedValueOnce(original);
    const intent = entra('synthetic@example.test', 'contrasenya', ...(entra === registerWithPassword ? [{}] : []));
    const error = await intent.catch((e) => e);
    expect(error).toMatchObject({ code, cause: original });
    expect(error.status).toBe(status);
    /* Cap resta del vocabulari del proveïdor al missatge que veu la persona. */
    expect(error.message).not.toMatch(/Supabase|error_code|\{/);
    expect(error.message.length).toBeGreaterThan(10);
  });
}
test('T4 · registerWithPassword: invalid_credentials també es traduïx, i l’AbortError d’un intent substituït passa intacte', async () => {
  const original = cruGoTrue(400, '{"error_code":"invalid_credentials"}');
  m.request.mockReset().mockRejectedValueOnce(original);
  await expect(registerWithPassword('synthetic@example.test', 'contrasenya', {})).rejects.toMatchObject({ code: CODI_ENTRADA.CREDENCIALS });
  const avortat = new DOMException('Intent substituït', 'AbortError');
  m.request.mockRejectedValueOnce(avortat);
  await expect(registerWithPassword('synthetic@example.test', 'contrasenya', {})).rejects.toBe(avortat);
});

/* Correcció de la revisió T1–T4 (260930) · El `msg` de GoTrue, en anglés, no ix de
   l'adaptador: la frase és la genèrica en valencià i l'original viatja a `cause`. */
test('T4 · un 422 signup_disabled es traduïx a DESCONEGUT amb la frase valenciana, sense l’anglés de GoTrue', async () => {
  const original = cruGoTrue(422, '{"code":422,"error_code":"signup_disabled","msg":"Signups not allowed for this instance"}');
  m.request.mockReset().mockRejectedValueOnce(original);
  const error = await registerWithPassword('synthetic@example.test', 'contrasenya', {}).catch((e) => e);
  expect(error).toMatchObject({ code: CODI_ENTRADA.DESCONEGUT, status: 422, cause: original });
  expect(error.message).toBe('No s’ha pogut completar l’operació. Revisa les dades i torna-ho a provar.');
  expect(error.message).not.toMatch(/Signups|not allowed/);
});

/* ───────── T2 i T4 · Capacitat 'salut': comprovaServidor mai rebutja ───────── */

test('salut · GET /auth/v1/health amb la clau pública, sense seguir redireccions: el servidor respon', async () => {
  const fetch = vi.fn(async () => ({ ok: true, status: 200 })); vi.stubGlobal('fetch', fetch);
  await expect(comprovaServidor({ supabaseUrl: 'https://poble.example.test', supabaseAnonKey: 'clau-publica' })).resolves.toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, opcions] = fetch.mock.calls[0];
  expect(url).toBe('https://poble.example.test/auth/v1/health');
  expect(opcions).toMatchObject({ method: 'GET', redirect: 'error', headers: { apikey: 'clau-publica' } });
  expect(opcions.headers).not.toHaveProperty('Authorization');
  expect(opcions.signal?.aborted).toBe(false);
});
test('salut · en seed també sonda la URL configurada (és el que es vol saber abans de canviar de mode)', async () => {
  const fetch = vi.fn(async () => ({ ok: true, status: 200 })); vi.stubGlobal('fetch', fetch);
  await expect(comprovaServidor({ dataMode: 'seed' })).resolves.toEqual({ ok: true });
  expect(fetch.mock.calls[0][0]).toBe('https://example.test/auth/v1/health');
});
test('salut · una resposta que no és ok, una fallada de xarxa o una URL buida tornen { ok: false } sense rebutjar', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));
  await expect(comprovaServidor({})).resolves.toEqual({ ok: false });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
  await expect(comprovaServidor({})).resolves.toEqual({ ok: false });
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  await expect(comprovaServidor({ supabaseUrl: '' })).resolves.toEqual({ ok: false });
  expect(fetch).not.toHaveBeenCalled();
});
test('salut · un servidor que no contesta s’avorta als 5 s i torna { ok: false }', async () => {
  vi.useFakeTimers();
  try {
    const fetch = vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Avortat', 'AbortError')));
    }));
    vi.stubGlobal('fetch', fetch);
    let resultat = 'pendent';
    const sonda = comprovaServidor({}).then((r) => { resultat = r; });
    await vi.advanceTimersByTimeAsync(4999);
    expect(resultat).toBe('pendent');
    await vi.advanceTimersByTimeAsync(1);
    await sonda;
    expect(resultat).toEqual({ ok: false });
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
  } finally { vi.useRealTimers(); }
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

/* ───────── F1 · Perfil (D2): les columnes noves no viatgen dins del JWT ───────── */

const crides = () => m.request.mock.calls.map(([path, , options]) => ({ ruta: `${options.method} ${path.split('?')[0]}`, cos: options.body }));
test('lema, presentació i capçalera sols: cap PUT a GoTrue ni canvi a la sessió; només el PATCH', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'A' };
  m.request.mockResolvedValueOnce([{ id: 'A', lema: 'Del Comtat' }]);
  const canvis = { lema: 'Del Comtat', presentacio_html: '<p>Hola</p>', hero_url: 'sdp-media://mitjans/t/A/capcalera.webp' };
  expect(await updateProfile(canvis)).toEqual({ id: 'A', lema: 'Del Comtat' });
  expect(crides()).toEqual([{ ruta: 'PATCH /rest/v1/profiles', cos: canvis }]);
  expect(m.changed).not.toHaveBeenCalled();
});
test('camps mixtos: a GoTrue només els de metadades; al PATCH, tots els del perfil i cap altre', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'A' };
  m.request.mockResolvedValueOnce([{ id: 'A' }]).mockResolvedValueOnce({ id: 'A' });
  await updateProfile({ full_name: 'Nom A', bio: 'Llaurador', lema: 'Del Comtat', presentacio_html: '<p>Hola</p>', role: 'superadmin', logo_url: 'https://img.example/logo.png' });
  expect(crides()).toEqual([
    { ruta: 'PATCH /rest/v1/profiles', cos: { full_name: 'Nom A', bio: 'Llaurador', lema: 'Del Comtat', presentacio_html: '<p>Hola</p>' } },
    { ruta: 'PUT /auth/v1/user', cos: { data: { full_name: 'Nom A', bio: 'Llaurador' } } }
  ]);
  expect(m.changed).toHaveBeenCalledTimes(1);
  expect(m.changed.mock.calls[0][0]).not.toHaveProperty('presentacio_html');
  expect(m.changed.mock.calls[0][0]).not.toHaveProperty('lema');
});
test('si profiles no respon, la fila de reserva ho diu (reserva: true); la de veres, no', async () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    m.request.mockReset(); m.user = { id: 'A', user_metadata: { full_name: 'Pep' } };
    m.request.mockRejectedValueOnce(Object.assign(new Error('La petició ha trigat massa temps.'), { name: 'TimeoutError' }));
    expect(await getProfile()).toMatchObject({ reserva: true, id: 'A', full_name: 'Pep' });
    m.request.mockResolvedValueOnce([{ id: 'A', full_name: 'Pep', lema: 'Del Mas' }]);
    expect(await getProfile()).toEqual({ id: 'A', full_name: 'Pep', lema: 'Del Mas' });
  } finally { avis.mockRestore(); m.user = { id: 'A' }; }
});
test('esborrar la foto lleva també la `picture` de Google a GoTrue (un null esborra la clau)', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'A' };
  m.request.mockResolvedValueOnce([{ id: 'A', avatar_url: null }]).mockResolvedValueOnce({ id: 'A' });
  await updateProfile({ avatar_url: null });
  expect(crides()[1]).toEqual({ ruta: 'PUT /auth/v1/user', cos: { data: { avatar_url: null, picture: null } } });
  expect(crides()[0].cos).toEqual({ avatar_url: null });       // picture no és cap columna de profiles
  expect(m.changed.mock.calls[0][0]).toMatchObject({ avatar_url: null });
  m.request.mockReset();
  m.request.mockResolvedValueOnce([{ id: 'A' }]).mockResolvedValueOnce({ id: 'A' });
  await updateProfile({ avatar_url: 'sdp-media://mitjans/t/A/avatars/x.webp' });
  expect(crides()[1].cos.data).not.toHaveProperty('picture');
});
/* T66 · L'emoticona de la fitxa (profiles.icon, 2609282035): al PATCH, mai a GoTrue. */
test('T66 · icon va al PATCH de profiles i mai al PUT de /auth/v1/user ni a la sessió', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'A' };
  m.request.mockResolvedValueOnce([{ id: 'A', icon: '🌾' }]);
  expect(await updateProfile({ icon: '🌾' })).toEqual({ id: 'A', icon: '🌾' });
  expect(crides()).toEqual([{ ruta: 'PATCH /rest/v1/profiles', cos: { icon: '🌾' } }]);
  expect(m.changed).not.toHaveBeenCalled();
  /* Amb un camp de metadades al costat, GoTrue rep el nom però no l'emoticona. */
  m.request.mockReset();
  m.request.mockResolvedValueOnce([{ id: 'A' }]).mockResolvedValueOnce({ id: 'A' });
  await updateProfile({ full_name: 'Nom A', icon: '🍅' });
  expect(crides()).toEqual([
    { ruta: 'PATCH /rest/v1/profiles', cos: { full_name: 'Nom A', icon: '🍅' } },
    { ruta: 'PUT /auth/v1/user', cos: { data: { full_name: 'Nom A' } } }
  ]);
  expect(m.changed.mock.calls[0][0]).not.toHaveProperty('icon');
});
test('T66 · icon es normalitza amb emojiSol: brossa o buit viatgen com a null; sense la clau, no hi és', async () => {
  m.request.mockReset(); m.user = { id: 'A' };
  m.request.mockResolvedValue([{ id: 'A' }]);
  await updateProfile({ icon: '🍅 Tomaques' });
  await updateProfile({ icon: '' });
  await updateProfile({ icon: ' 🌾 ' });
  await updateProfile({ lema: 'Del Mas' });
  expect(crides().map((c) => c.cos)).toEqual([{ icon: null }, { icon: null }, { icon: '🌾' }, { lema: 'Del Mas' }]);
  m.request.mockReset();
});
test('T66 · en seed/local l’emoticona es desa normalitzada al servidor local, sense xarxa', async () => {
  m.request.mockReset(); m.changed.mockClear(); m.user = { id: 'U-t66', user_metadata: { full_name: 'Pep' } };
  try {
    const fila = await updateProfile({ icon: ' 🌾 ' }, { dataMode: 'seed' });
    expect(fila).toMatchObject({ id: 'U-t66', icon: '🌾' });
    expect(await getProfile({ dataMode: 'seed' })).toMatchObject({ icon: '🌾' });
    expect(await updateProfile({ icon: 'res' }, { dataMode: 'seed' })).toMatchObject({ icon: null });
    expect(m.request).not.toHaveBeenCalled();
    expect(m.changed).not.toHaveBeenCalled();
  } finally { m.user = { id: 'A' }; }
});
test('una capçalera incrustada (data:) no s’envia', async () => {
  m.request.mockReset(); m.user = { id: 'A' };
  await expect(updateProfile({ hero_url: 'data:image/png;base64,AAAA' })).rejects.toThrow('no es desen incrustades');
  expect(m.request).not.toHaveBeenCalled();
});

/* ───────── D11 · L'alta amb Google es completa al servidor, de millor esforç ───────── */

const SESSIO_GOOGLE = Object.freeze({ access_token: 'synthetic', user: { id: 'A' } });
test('tornada d’OAuth amb sessió: completa_la_meua_alta amb el poble de la configuració', async () => {
  rpc.mockReset(); gestionaTornada.mockResolvedValueOnce(SESSIO_GOOGLE);
  const config = { tenantId: '11111111-2222-3333-4444-555555555555' };
  expect(await recullTornadaOAuth(config)).toBe(SESSIO_GOOGLE);
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(rpc.mock.calls[0][0]).toBe('completa_la_meua_alta');
  expect(rpc.mock.calls[0][1]).toEqual({ p_tenant_id: '11111111-2222-3333-4444-555555555555' });
  expect(rpc.mock.calls[0][2]).toBe(config);
});
test('sense poble configurat, p_tenant_id va a null i el servidor tria el de reserva', async () => {
  rpc.mockReset(); gestionaTornada.mockResolvedValueOnce(SESSIO_GOOGLE);
  await recullTornadaOAuth({});
  expect(rpc.mock.calls[0][1]).toEqual({ p_tenant_id: null });
});
test('l’entrada no espera la reparació ni cau si falla; sense la migració (404) ni tan sols avisa', async () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    rpc.mockReset(); rpc.mockReturnValueOnce(new Promise(() => {}));
    gestionaTornada.mockResolvedValueOnce(SESSIO_GOOGLE);
    expect(await recullTornadaOAuth({})).toBe(SESSIO_GOOGLE);          // la promesa penjada no bloqueja
    rpc.mockRejectedValueOnce(Object.assign(new Error('L\'esquema requerit no està aplicat'), { status: 404 }));
    gestionaTornada.mockResolvedValueOnce(SESSIO_GOOGLE);
    expect(await recullTornadaOAuth({})).toBe(SESSIO_GOOGLE);
    await Promise.resolve(); await Promise.resolve();
    expect(avis).not.toHaveBeenCalled();
    rpc.mockRejectedValueOnce(Object.assign(new Error('Supabase 500'), { status: 500 }));
    gestionaTornada.mockResolvedValueOnce(SESSIO_GOOGLE);
    expect(await recullTornadaOAuth({})).toBe(SESSIO_GOOGLE);
    await vi.waitFor(() => expect(avis).toHaveBeenCalledTimes(1));
  } finally { avis.mockRestore(); }
});
test('sense sessió desada (cap codi, finestra emergent o error) no es crida cap RPC', async () => {
  rpc.mockReset();
  gestionaTornada.mockResolvedValueOnce(null);
  expect(await recullTornadaOAuth({})).toBeNull();
  gestionaTornada.mockRejectedValueOnce(new Error('access_denied'));
  await expect(recullTornadaOAuth({})).rejects.toThrow('access_denied');
  expect(rpc).not.toHaveBeenCalled();
});
test('si la pertinença al poble naix ara, les seccions es tornen a llegir; si ja hi era, no', async () => {
  const recarregues = vi.fn();
  window.addEventListener('sdp:refresh-data', recarregues);
  try {
    rpc.mockReset(); rpc.mockResolvedValueOnce({ poble: 'T', poble_nou: true, baixa_demanada_at: null });
    gestionaTornada.mockResolvedValueOnce(SESSIO_GOOGLE);
    await recullTornadaOAuth({ tenantId: 'T' });
    await vi.waitFor(() => expect(recarregues).toHaveBeenCalledTimes(1));
    rpc.mockResolvedValueOnce({ poble: 'T', poble_nou: false, baixa_demanada_at: null });
    gestionaTornada.mockResolvedValueOnce(SESSIO_GOOGLE);
    await recullTornadaOAuth({ tenantId: 'T' });
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(recarregues).toHaveBeenCalledTimes(1);
  } finally { window.removeEventListener('sdp:refresh-data', recarregues); }
});
test('l’entrada amb Google per finestra emergent també completa l’alta', async () => {
  rpc.mockReset(); entraAmbGoogle.mockResolvedValueOnce(SESSIO_GOOGLE);
  expect(await loginWithGoogle({ tenantId: 'T' })).toBe(SESSIO_GOOGLE);
  expect(rpc).toHaveBeenCalledWith('completa_la_meua_alta', { p_tenant_id: 'T' }, { tenantId: 'T' });
});
/* Una alta amb correu que el trigger va deixar sense poble (poble tancat, tenantId buit)
   també s'ha de reparar quan la persona entra. */
for (const enter of [loginWithPassword, registerWithPassword]) {
  test(`${enter.name} amb sessió completa l’alta; sense sessió (confirmació per correu), no`, async () => {
    rpc.mockReset(); m.request.mockReset();
    m.request.mockResolvedValueOnce({ access_token: 'new', user: { id: 'A' } });
    await enter('synthetic@example.test', 'contrasenya', ...(enter === registerWithPassword ? [{}] : []), { tenantId: 'T' });
    expect(rpc).toHaveBeenCalledWith('completa_la_meua_alta', { p_tenant_id: 'T' }, { tenantId: 'T' });
    rpc.mockReset();
    m.request.mockResolvedValueOnce({ user: { id: 'A' } });
    const senseSessio = enter('synthetic@example.test', 'contrasenya', ...(enter === registerWithPassword ? [{}] : []), { tenantId: 'T' });
    if (enter === loginWithPassword) await expect(senseSessio).rejects.toThrow('no ha confirmat la sessió');
    else await expect(senseSessio).resolves.toEqual({ user: { id: 'A' } });
    expect(rpc).not.toHaveBeenCalled();
  });
}

test.each([null, {}, { access_token: 'token-sense-usuari' }, { user: { id: 'A' } }])('login incomplet no desa sessió ni completa alta: %j', async result => {
  rpc.mockReset(); m.request.mockReset(); m.saved.mockClear();
  m.request.mockResolvedValueOnce(result);
  await expect(loginWithPassword('synthetic@example.test', 'contrasenya')).rejects.toThrow('no ha confirmat la sessió');
  expect(m.saved).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});

/* ───────── D1 · Eixir revoca al servidor ───────── */

test('logout(config, { scope }) revoca amb keepalive i el JWT capturat abans de buidar', async () => {
  const fetch = vi.fn(async () => ({ ok: true, status: 204 })); vi.stubGlobal('fetch', fetch);
  const before = m.epoch;
  await logout({ supabaseUrl: 'https://backend.example.test' }, { scope: 'global' });
  expect(m.epoch).toBeGreaterThan(before);
  expect(fetch).toHaveBeenCalledWith('https://backend.example.test/auth/v1/logout?scope=global',
    expect.objectContaining({ method: 'POST', keepalive: true, headers: expect.objectContaining({ Authorization: 'Bearer synthetic-refresh' }) }));
});
