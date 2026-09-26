import { afterEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ store: new Map(), epoch: 0 }));
vi.mock('../../config/publicCredentials.js', () => ({ validatePublicCredentials: () => {} }));
vi.mock('../../utils/sanitize.js', () => ({ permetOrigenMitjans: () => {} }));
vi.mock('../appSeed.js', () => ({ APP_SEED: { noteFolders: [], notes: [] }, APP_SEED_VERSION: 'synthetic', getDefaultUserId: () => 'A' }));
vi.mock('../../config/storage.js', () => ({ getEfimer: (key, fallback = null) => (m.store.has(key) ? m.store.get(key) : fallback) }));
vi.mock('../identitat.js', () => ({ jwtPerBackend: () => m.store.get('jwt') ?? null, CLAU_JWT: 'jwt', CLAU_USUARI: 'user', usuariDeSessio: () => m.store.get('user') ?? null,
  get versioSessio() { return m.epoch; } }));
import { configuraRefrescSessio, request, rpc, ErrorSupabase } from './runtime.js';

const CONFIG = { supabaseUrl: 'https://api.example.test', supabaseAnonKey: 'sb_publishable_synthetic' };
const desa = (token, id) => { m.epoch++; m.store.set('jwt', token); m.store.set('user', { id }); };
const esborra = () => { m.epoch++; m.store.clear(); };
const resposta = (status, body = null) => ({ ok: status < 400, status, text: async () => '', json: async () => body, headers: { get: () => null } });
const accioDA = () => request('/rest/v1/rpc/registra_consentiment', CONFIG, { method: 'POST', body: { p_tipus: 'synthetic-consent-A' } });
const tokens = (fetch) => fetch.mock.calls.map(([, options]) => options.headers.Authorization);
afterEach(() => { vi.unstubAllGlobals(); m.store.clear(); configuraRefrescSessio(async () => false); });

test('A → renovació → A reintenta una sola vegada amb el token renovat', async () => {
  desa('synthetic-A', 'A');
  configuraRefrescSessio(async () => { desa('synthetic-A-renewed', 'A'); return true; });
  const fetch = vi.fn().mockResolvedValueOnce(resposta(401)).mockResolvedValueOnce(resposta(200, { ok: true }));
  vi.stubGlobal('fetch', fetch);
  expect(await accioDA()).toEqual({ ok: true });
  expect(tokens(fetch)).toEqual(['Bearer synthetic-A', 'Bearer synthetic-A-renewed']);
});

test('C14: A → renovació → B no reenvia l’acció d’A amb el token de B', async () => {
  desa('synthetic-A', 'A');
  configuraRefrescSessio(async () => { desa('synthetic-A-renewed', 'A'); esborra(); desa('synthetic-B', 'B'); return true; });
  const fetch = vi.fn().mockResolvedValueOnce(resposta(401)).mockResolvedValue(resposta(200, { ok: true }));
  vi.stubGlobal('fetch', fetch);
  await expect(accioDA()).rejects.toMatchObject({ name: 'AbortError' });
  expect(tokens(fetch)).toEqual(['Bearer synthetic-A']);
});

test('C14: A → renovació → logout no reenvia l’acció amb la clau anònima', async () => {
  desa('synthetic-A', 'A');
  configuraRefrescSessio(async () => { desa('synthetic-A-renewed', 'A'); esborra(); return true; });
  const fetch = vi.fn().mockResolvedValueOnce(resposta(401)).mockResolvedValue(resposta(200, { ok: true }));
  vi.stubGlobal('fetch', fetch);
  await expect(accioDA()).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('C14: A → logout → A no hereta l’acció de la sessió anterior', async () => {
  desa('synthetic-A', 'A');
  configuraRefrescSessio(async () => { desa('synthetic-A-renewed', 'A'); esborra(); desa('synthetic-A-new-login', 'A'); return true; });
  const fetch = vi.fn().mockResolvedValueOnce(resposta(401)).mockResolvedValue(resposta(200, { ok: true }));
  vi.stubGlobal('fetch', fetch);
  await expect(accioDA()).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).toHaveBeenCalledTimes(1);
});

/* rpc(nom, cos, config, opcions): les opcions (timeoutMs, signal) arriben a request(),
   però ni el mètode ni el cos es poden sobreescriure. */
const lenta = (ms) => vi.fn((_url, opcions) => new Promise((resolve, reject) => {
  const t = setTimeout(() => resolve(resposta(200, { ok: true })), ms);
  opcions.signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('avortada', 'AbortError')); });
}));
test('rpc passa timeoutMs a request i no deixa canviar el mètode ni el cos', async () => {
  vi.useFakeTimers();
  try {
    desa('synthetic-A', 'A');
    const fetch = lenta(13_000); vi.stubGlobal('fetch', fetch);
    const crida = rpc('exporta', { a: 1 }, CONFIG, { timeoutMs: 60_000, method: 'GET', body: 'no' });
    await vi.advanceTimersByTimeAsync(13_000);
    await expect(crida).resolves.toEqual({ ok: true });
    const [url, opcions] = fetch.mock.calls[0];
    expect(url).toBe('https://api.example.test/rest/v1/rpc/exporta');
    expect(opcions.method).toBe('POST');
    expect(opcions.body).toBe('{"a":1}');
    // Sense l'opció, els 12 s de sempre la tallen: la prova de dalt no passa per casualitat.
    vi.stubGlobal('fetch', lenta(13_000));
    const curta = rpc('exporta', { a: 1 }, CONFIG);
    const assercio = expect(curta).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(12_001);
    await assercio;
  } finally { vi.useRealTimers(); }
});

test('un segon 401 després de renovar no torna a reintentar', async () => {
  desa('synthetic-A', 'A');
  const renova = vi.fn(async () => { desa('synthetic-A-renewed', 'A'); return true; });
  configuraRefrescSessio(renova);
  const fetch = vi.fn().mockResolvedValue(resposta(401));
  vi.stubGlobal('fetch', fetch);
  await expect(accioDA()).rejects.toBeInstanceOf(ErrorSupabase);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(renova).toHaveBeenCalledTimes(1);
});
