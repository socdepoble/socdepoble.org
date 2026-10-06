import { afterEach, beforeEach, expect, test, vi } from 'vitest';
/* D1 (260926) · Renovació, restauració, pany i eixida contra el registre persistent.
   identitat i storage reals; es falsegen la política, el transport i Realtime. */
const m = vi.hoisted(() => ({ policy: null }));
vi.mock('../../config/runtimePolicy.js', () => ({ getRuntimePolicy: () => m.policy }));
vi.mock('./runtime.js', async () => {
  const identitat = await import('../identitat.js');
  return {
    configuraRefrescSessio: () => {}, getCurrentUser: () => identitat.usuariDeSessio(), request: vi.fn(), rpc: vi.fn(),
    getResolvedConfig: (config = {}) => ({ supabaseUrl: (config.supabaseUrl || '').replace(/\/$/, ''),
      supabaseAnonKey: config.supabaseAnonKey || '', tenantId: config.tenantId || null, runtimeDataMode: 'remote' })
  };
});
vi.mock('./realtime.js', () => ({ tancaRealtime: async () => {} }));
vi.mock('./config.js', () => ({ resetClient: () => {} }));
vi.mock('../oauthRelay.js', () => ({ entraAmbGoogle: vi.fn(), gestionaTornada: vi.fn() }));
import { refreshSession, logout } from './auth.js';
import { configuraBackendSessio, adoptaSessioExterna, desaSessio, esborraSessio, usuariDeSessio, CLAU_JWT, CLAU_REFRESC, CLAU_ORIGEN, CLAU_PERSISTENT } from '../identitat.js';
import { backendScope } from '../../config/backendConfig.js';
import { getEfimer, getVal, setVal } from '../../config/storage.js';

const EMISSOR = 'https://auth.example.test';
const A = '11111111-2222-4333-8444-555555555555';
const CONFIG = Object.freeze({ supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'public' });
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const token = (sub, segons = 3600) => `${b64u({ alg: 'none' })}.${b64u({ sub, iss: EMISSOR, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + segons })}.c2ln`;
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const registre = () => getVal(CLAU_PERSISTENT, null);
const posaRegistre = (rt, sub = A) => setVal(CLAU_PERSISTENT, { v: 1, rt, sub, t: Date.now(), backend: backendScope(CONFIG) });
const entra = (rt = 'r1') => desaSessio({ access_token: token(A), refresh_token: rt, user: { id: A } });
const pestanyaNova = () => window.sessionStorage.clear();
const sessioNova = (rt) => ({ ok: true, status: 200, json: async () => ({ access_token: token(A), refresh_token: rt, user: { id: A } }) });
const cosDe = (crida) => JSON.parse(crida[1].body);
beforeEach(() => { m.policy = { auth: { issuer: EMISSOR, audiences: ['authenticated'], persistencia: 'local' } }; configuraBackendSessio(CONFIG); });
afterEach(() => {
  vi.unstubAllGlobals(); vi.restoreAllMocks();
  esborraSessio({ abast: 'tot' });
  window.sessionStorage.clear(); window.localStorage.clear(); m.policy = null;
});

test('restauració en una pestanya nova: gasta r1, el registre passa a r2 i la pestanya no guarda cap refresh token', async () => {
  entra('r1'); pestanyaNova();
  const fetch = vi.fn(async () => sessioNova('r2')); vi.stubGlobal('fetch', fetch);
  expect(await refreshSession(CONFIG)).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toBe('https://backend.example.test/auth/v1/token?grant_type=refresh_token');
  expect(cosDe(fetch.mock.calls[0])).toEqual({ refresh_token: 'r1' });
  expect(registre()).toMatchObject({ rt: 'r2', sub: A });
  expect(usuariDeSessio()?.id).toBe(A);
  expect(getEfimer(CLAU_REFRESC, null)).toBeNull();
  expect(getEfimer(CLAU_ORIGEN, null)).toBe('registre');
});

test('renovació d’una pestanya que viu del registre: rota el registre i conserva l’entrada', async () => {
  entra('r1');
  vi.stubGlobal('fetch', vi.fn(async () => sessioNova('r2')));
  expect(await refreshSession(CONFIG)).toBe(true);
  expect(registre().rt).toBe('r2');
  expect(getEfimer(CLAU_REFRESC, null)).toBeNull();
});

test('el token rotat es desa encara que la sessió canvie mentre la resposta viatja', async () => {
  entra('r1'); pestanyaNova();
  const resposta = deferred(); vi.stubGlobal('fetch', vi.fn(() => resposta.promise));
  const renovacio = refreshSession(CONFIG);
  esborraSessio({ abast: 'pestanya' });                       // l'època canvia pel camí
  resposta.resolve(sessioNova('r2'));
  expect(await renovacio).toBe(false);
  expect(registre().rt).toBe('r2');                           // descartar-lo deixaria un token gastat
  expect(getEfimer(CLAU_JWT, null)).toBeNull();
});

test('un 400 en restaurar esborra el registre i no hi ha segon intent', async () => {
  entra('r1'); pestanyaNova();
  const fetch = vi.fn(async () => ({ ok: false, status: 400 })); vi.stubGlobal('fetch', fetch);
  expect(await refreshSession(CONFIG)).toBe(false);
  expect(registre()).toBeNull();
  expect(await refreshSession(CONFIG)).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(1);                     // ni reintent ni revocació d'un token mort
});

test('un 400 amb r1 quan una altra pestanya ja ha rotat a r9: r9 es conserva', async () => {
  entra('r1');
  vi.stubGlobal('fetch', vi.fn(async () => { posaRegistre('r9'); return { ok: false, status: 400 }; }));
  expect(await refreshSession(CONFIG)).toBe(false);
  expect(usuariDeSessio()).toBeNull();                        // esta pestanya sí que ix
  expect(registre()?.rt).toBe('r9');
});

test('el servidor torna un altre compte per al token del registre: no s’entra i el registre cau', async () => {
  entra('r1'); pestanyaNova();
  const altre = '99999999-2222-4333-8444-555555555555';
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200,
    json: async () => ({ access_token: token(altre), refresh_token: 'r2', user: { id: altre } }) })));
  expect(await refreshSession(CONFIG)).toBe(false);
  expect(registre()).toBeNull();
  expect(usuariDeSessio()).toBeNull();
});

test('pany: mentre una altra pestanya renova no hi ha fetch; després es gasta el token que ella ha deixat', async () => {
  entra('r1'); pestanyaNova();
  let allibera; let cua = new Promise(r => { allibera = r; });   // l'altra pestanya té el pany
  const request = vi.fn((_nom, _opcions, fn) => (cua = cua.then(() => fn())));
  Object.defineProperty(globalThis.navigator, 'locks', { configurable: true, value: { request } });
  try {
    const fetch = vi.fn(async () => sessioNova('r3')); vi.stubGlobal('fetch', fetch);
    const renovacio = refreshSession(CONFIG);
    await Promise.resolve(); await Promise.resolve();
    expect(request).toHaveBeenCalledWith('sdp:sessio:renovacio', expect.objectContaining({ signal: expect.any(AbortSignal) }), expect.any(Function));
    expect(fetch).not.toHaveBeenCalled();
    posaRegistre('r2');                                       // l'altra pestanya ha rotat r1 → r2
    allibera();
    expect(await renovacio).toBe(true);
    expect(cosDe(fetch.mock.calls[0])).toEqual({ refresh_token: 'r2' });
    expect(registre().rt).toBe('r3');
  } finally { delete globalThis.navigator.locks; }
});

test('logout: buida el registre abans que responga la xarxa i revoca amb el JWT capturat', async () => {
  entra('r1');
  const jwt = getEfimer(CLAU_JWT, null);
  const resposta = deferred(); const fetch = vi.fn(() => resposta.promise); vi.stubGlobal('fetch', fetch);
  const eixida = logout(CONFIG);
  expect(registre()).toBeNull();
  expect(usuariDeSessio()).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, opcions] = fetch.mock.calls[0];
  expect(url).toBe('https://backend.example.test/auth/v1/logout?scope=local');
  expect(opcions).toMatchObject({ method: 'POST', keepalive: true, redirect: 'error',
    headers: { apikey: 'public', Authorization: `Bearer ${jwt}` } });
  resposta.resolve({ ok: true, status: 204 });
  await eixida;
  await logout(CONFIG);                                       // sense JWT no hi ha res a revocar
  expect(fetch).toHaveBeenCalledTimes(1);
});

/* keepalive no és a tot el baseline (Firefox 100-132) i el botó d'eixir recarrega la
   pàgina en tornar: l'eixida espera la revocació, però no més de 3 s. */
test('logout espera la revocació abans de tornar, amb un topall de 3 s si la xarxa no respon', async () => {
  vi.useFakeTimers();
  try {
    entra('r1');
    const resposta = deferred(); vi.stubGlobal('fetch', vi.fn(() => resposta.promise));
    let tornat = false;
    const eixida = logout(CONFIG).then(() => { tornat = true; });
    await vi.advanceTimersByTimeAsync(100);
    expect(usuariDeSessio()).toBeNull();                      // l'estat local ja és buit
    expect(tornat).toBe(false);                               // la revocació encara viatja
    resposta.resolve({ ok: true, status: 204 });
    await eixida;
    expect(tornat).toBe(true);

    entra('r2');
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));   // la xarxa no respon mai
    let tornat2 = false;
    const eixida2 = logout(CONFIG).then(() => { tornat2 = true; });
    await vi.advanceTimersByTimeAsync(2900);
    expect(tornat2).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    await eixida2;
    expect(tornat2).toBe(true);
  } finally { vi.useRealTimers(); }
});

test('logout amb abast «pestanya» (la renovació automàtica ha fallat): buida la pestanya, conserva el registre i no revoca', async () => {
  entra('r1');
  const fetch = vi.fn(async () => ({ ok: true, status: 204 })); vi.stubGlobal('fetch', fetch);
  await logout(CONFIG, { abast: 'pestanya' });
  expect(usuariDeSessio()).toBeNull();
  expect(getEfimer(CLAU_JWT, null)).toBeNull();
  expect(registre()).toMatchObject({ rt: 'r1', sub: A });
  expect(fetch).not.toHaveBeenCalled();
});

test('logout d’una sessió injectada per l’amfitrió: SdP la deixa però no la revoca, perquè és seua', async () => {
  expect(adoptaSessioExterna({ access_token: token(A), user: { id: A } })).toBe(true);
  const fetch = vi.fn(async () => ({ ok: true, status: 204 })); vi.stubGlobal('fetch', fetch);
  await logout(CONFIG);
  expect(usuariDeSessio()).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

test('logout: una revocació que falla no fa fallar l’eixida', async () => {
  entra('r1');
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
  await expect(logout(CONFIG)).resolves.toBeUndefined();
  expect(usuariDeSessio()).toBeNull();
  expect(registre()).toBeNull();
});

/* 57c3f2d9 · «Tanca les altres sessions» revoca les altres i deixa esta entrada. */
test('logout «others»: revoca les altres sessions i conserva la d’este navegador', async () => {
  entra('r1');
  const jwt = getEfimer(CLAU_JWT, null);
  const fetch = vi.fn(async () => ({ ok: true, status: 204 })); vi.stubGlobal('fetch', fetch);
  await logout(CONFIG, { scope: 'others' });
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, opcions] = fetch.mock.calls[0];
  expect(url).toBe('https://backend.example.test/auth/v1/logout?scope=others');
  expect(opcions).toMatchObject({ headers: { Authorization: `Bearer ${jwt}` } });
  expect(usuariDeSessio()?.id).toBe(A);                       // esta sessió continua viva
  expect(registre()).toMatchObject({ rt: 'r1', sub: A });
  expect(getEfimer(CLAU_JWT, null)).toBe(jwt);
});

test('logout «others» d’una sessió de l’amfitrió no revoca res: és seua', async () => {
  expect(adoptaSessioExterna({ access_token: token(A), user: { id: A } })).toBe(true);
  const fetch = vi.fn(async () => ({ ok: true, status: 204 })); vi.stubGlobal('fetch', fetch);
  await logout(CONFIG, { scope: 'others' });
  expect(fetch).not.toHaveBeenCalled();
  expect(usuariDeSessio()?.id).toBe(A);
});

test('logout sense configuració usa l’última coneguda; «global» tanca totes les sessions del compte', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));
  await refreshSession(CONFIG).catch(() => false);            // recorda la configuració
  entra('r1');
  const fetch = vi.fn(async () => ({ ok: true, status: 204 })); vi.stubGlobal('fetch', fetch);
  await logout(undefined, { scope: 'global' });
  expect(fetch.mock.calls[0][0]).toBe('https://backend.example.test/auth/v1/logout?scope=global');
  entra('r2');
  await logout(CONFIG, { scope: 'qualsevol' });               // un abast desconegut no ix del client
  expect(fetch.mock.calls[1][0]).toBe('https://backend.example.test/auth/v1/logout?scope=local');
});
