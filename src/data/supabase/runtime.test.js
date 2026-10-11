import { afterEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ store: new Map(), epoch: 0 }));
vi.mock('../../config/publicCredentials.js', () => ({ validatePublicCredentials: () => {} }));
vi.mock('../../utils/sanitize.js', () => ({ permetOrigenMitjans: () => {} }));
vi.mock('../appSeed.js', () => ({ APP_SEED: { noteFolders: [{ id: 'demo-folder' }], notes: [{ id: 'demo-note' }] }, APP_SEED_VERSION: 'synthetic', getDefaultUserId: () => 'A' }));
vi.mock('../../config/storage.js', () => ({ getEfimer: (key, fallback = null) => (m.store.has(key) ? m.store.get(key) : fallback) }));
vi.mock('../identitat.js', () => ({ jwtPerBackend: () => m.store.get('jwt') ?? null, CLAU_JWT: 'jwt', CLAU_USUARI: 'user', usuariDeSessio: () => m.store.get('user') ?? null,
  get versioSessio() { return m.epoch; } }));
import { configuraRefrescSessio, request, rpc, ErrorSupabase, mapContentRowsToData } from './runtime.js';
import { CODI_BACKEND_INABASTABLE, esBackendInabastable } from '../errorsBackend.js';
import { byId } from '../../config/contentHelpers.js';
import { _reiniciaAutocuracio, incidents } from '../../utils/autocuracio.js';

test('el contingut remot buit no injecta notes, carpetes ni identitats de demostració', () => {
  expect(mapContentRowsToData([])).toMatchObject({ notes: [], noteFolders: [], agents: [], towns: [] });
  const notes = [{ id: 'real', folderId: 'own-folder' }];
  expect(mapContentRowsToData([{ key: 'notes', payload: notes }]).notes).toEqual(notes);
});

/* Onada 12 (261011; ordres 261011_0130, punt 7) · Llistes tolerants: una fila
   d'app_content amb la forma equivocada es pren buida i la resta de claus no
   se'n ressent. Abans l'objecte passava tal qual i byId(payload.towns)
   (CoreContentContext) llançava «items.filter is not a function». */
test('Onada 12 · un payload que no és una llista (objecte, text o null) dona [] i no tomba el contingut', () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  _reiniciaAutocuracio();
  try {
    const agents = [{ id: 'agent-real' }];
    const dades = mapContentRowsToData([
      { key: 'towns', payload: { id: 'sella' } }, { key: 'feedPosts', payload: 'text' }, { key: 'events', payload: null },
      { key: 'agents', payload: agents }
    ]);
    expect(dades).toMatchObject({ towns: [], feedPosts: [], events: [], marketItems: [], pages: [] });
    // La llista bona viatja intacta, la mateixa referència.
    expect(dades.agents).toBe(agents);
    // El que fa el proveïdor del contingut amb `towns`: ja no llança.
    expect(byId(dades.towns)).toEqual([]);
    expect(() => byId({ id: 'sella' })).toThrow(TypeError);
    // Queda anotat (mai el contingut) i s'avisa una vegada per clau; el null és l'estat normal.
    expect(incidents().map(({ tipus, on, accio }) => [tipus, on, accio]).sort()).toEqual([
      ['dades', 'feedPosts', 'llista-buida'], ['dades', 'towns', 'llista-buida']
    ]);
    expect(avis).toHaveBeenCalledTimes(2);
    mapContentRowsToData([{ key: 'towns', payload: { id: 'sella' } }]);
    expect(avis).toHaveBeenCalledTimes(2);
  } finally { avis.mockRestore(); _reiniciaAutocuracio(); }
});

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

/* T2 (ordre del Mestre, 260930) · Una petició que no arriba al servidor porta
   el codi neutral del port (errorsBackend.js), i la vista decidix per ell. El
   missatge de sempre es conserva: readableBackendError i Onboarding el lligen. */
const MISSATGE_XARXA = 'Error de xarxa: No es pot connectar al servidor. Comprova la teua connexió a internet o que el backend local estiga en marxa.';
test('T2 · un fetch que rebutja amb TypeError dona ErrorSupabase d’estat 0 i codi backend-inabastable', async () => {
  const fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  vi.stubGlobal('fetch', fetch);
  const error = await request('/rest/v1/app_content', CONFIG).catch((e) => e);
  expect(error).toBeInstanceOf(ErrorSupabase);
  expect(error).toMatchObject({ name: 'ErrorSupabase', status: 0, codi: CODI_BACKEND_INABASTABLE, message: MISSATGE_XARXA });
  expect(CODI_BACKEND_INABASTABLE).toBe('backend-inabastable');
  expect(esBackendInabastable(error)).toBe(true);
  // Cap reintent de xarxa: una sola petició.
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('T2 · un temps esgotat no porta el codi: el servidor pot estar viu i lent', async () => {
  vi.useFakeTimers();
  try {
    vi.stubGlobal('fetch', lenta(13_000));
    const crida = request('/rest/v1/app_content', CONFIG).catch((e) => e);
    await vi.advanceTimersByTimeAsync(12_001);
    const error = await crida;
    expect(error.name).toBe('TimeoutError');
    expect(error).not.toHaveProperty('codi');
    expect(esBackendInabastable(error)).toBe(false);
  } finally { vi.useRealTimers(); }
});

test('T2 · una resposta d’error del servidor tampoc porta el codi de xarxa', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(500)));
  const error = await request('/rest/v1/app_content', CONFIG).catch((e) => e);
  expect(error).toBeInstanceOf(ErrorSupabase);
  expect(error.status).toBe(500);
  expect(error).not.toHaveProperty('codi');
  expect(esBackendInabastable(error)).toBe(false);
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
