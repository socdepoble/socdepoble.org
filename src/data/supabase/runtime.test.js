import { afterEach, expect, test, vi } from 'vitest';
/* v1.2.19 · fusió · `exp` és del preflight de la v1.2.17 i `entry` és de la guarda d'entrada de Codex R32.29. */
const m = vi.hoisted(() => ({ store: new Map(), epoch: 0, exp: new Map(), entry: 0 }));
vi.mock('../../config/publicCredentials.js', () => ({ validatePublicCredentials: () => {} }));
vi.mock('../../utils/sanitize.js', () => ({ permetOrigenMitjans: () => {} }));
vi.mock('../appSeed.js', () => ({ APP_SEED: { noteFolders: [{ id: 'demo-folder' }], notes: [{ id: 'demo-note' }] }, APP_SEED_VERSION: 'synthetic', getDefaultUserId: () => 'A' }));
vi.mock('../../config/storage.js', () => ({ getEfimer: (key, fallback = null) => (m.store.has(key) ? m.store.get(key) : fallback) }));
/* P0-ZERO-401-PREFLIGHT (v1.2.17) · caducitatJwt per token: sense entrada, null (un token opac),
   i request() no renova abans d'hora; les proves de sempre no en noten res. */
vi.mock('../identitat.js', () => ({ jwtPerBackend: () => m.store.get('jwt') ?? null, CLAU_JWT: 'jwt', CLAU_USUARI: 'user', usuariDeSessio: () => m.store.get('user') ?? null,
  capturaSessio: () => {
    const entry = m.entry;
    return () => { if (entry !== m.entry) throw new DOMException('La sessió ha canviat.', 'AbortError'); };
  },
  get versioSessio() { return m.epoch; }, caducitatJwt: (jwt) => m.exp.get(jwt) ?? null, MARGE_RENOVACIO_MS: 60_000 }));
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
const desa = (token, id) => { if (m.store.get('user')?.id !== id) m.entry++; m.epoch++; m.store.set('jwt', token); m.store.set('user', { id }); };
const esborra = () => { m.entry++; m.epoch++; m.store.clear(); };
const resposta = (status, body = null) => ({ ok: status < 400, status, text: async () => '', json: async () => body, headers: { get: () => null } });

test('R21.6 preserves SQLSTATE without confusing generic serialization with a revision rejection', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ...resposta(409), text: async () => JSON.stringify({ code: '40001', message: 'serialization conflict' }) })
    .mockResolvedValueOnce({ ...resposta(409), text: async () => JSON.stringify({ code: '40001', message: 'SDP-MUR-REVISION: conflicte de revisió' }) })
    .mockResolvedValueOnce({ ...resposta(403), text: async () => JSON.stringify({ code: { raw: 'bad' }, message: 'untrusted SDP-MUR-OWNER: body' }) }));
  await expect(request('/rest/v1/rpc/synthetic', CONFIG)).rejects.toMatchObject({ status: 409, sqlstate: '40001' });
  try { await request('/rest/v1/rpc/synthetic', CONFIG); throw new Error('unexpected success'); }
  catch (e) { expect(e).toMatchObject({ status: 409, sqlstate: '40001', codi: 'SDP-MUR-REVISION' }); }
  try { await request('/rest/v1/rpc/synthetic', CONFIG); throw new Error('unexpected success'); }
  catch (e) { expect(e).toMatchObject({ status: 403 }); expect(e.sqlstate).toBeUndefined(); expect(e.codi).toBeUndefined(); }
});
/* Gauntlet R22 (ronda 3, sql-05) · El límit de mida del disparador section_submissions_limita_mida arriba amb el seu
   codi neutral: el client el reconeix com a rebuig definitiu, no com una xarxa. */
test('R22 (ronda 3) · SDP-MUR-MIDA (22001) porta el codi neutral; un text que només l’esmenta, no', async () => {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce({ ...resposta(400), text: async () => JSON.stringify({ code: '22001', message: 'SDP-MUR-MIDA: el cos d\'una publicació no pot passar de 100000 caràcters.' }) })
    .mockResolvedValueOnce({ ...resposta(400), text: async () => JSON.stringify({ code: '22023', message: 'altre: SDP-MUR-MIDA: no' }) }));
  await expect(request('/rest/v1/rpc/publica_nota_al_mur', CONFIG)).rejects.toMatchObject({ status: 400, sqlstate: '22001', codi: 'SDP-MUR-MIDA' });
  try { await request('/rest/v1/rpc/publica_nota_al_mur', CONFIG); throw new Error('unexpected success'); }
  catch (e) { expect(e).toMatchObject({ status: 400, sqlstate: '22023' }); expect(e.codi).toBeUndefined(); }
});
const accioDA = () => request('/rest/v1/rpc/registra_consentiment', CONFIG, { method: 'POST', body: { p_tipus: 'synthetic-consent-A' } });
const tokens = (fetch) => fetch.mock.calls.map(([, options]) => options.headers.Authorization);
afterEach(() => { vi.unstubAllGlobals(); m.store.clear(); m.exp.clear(); configuraRefrescSessio(async () => false); });

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

/* T2 · D04/D10 (assalt 261101) · La lectura anònima de les dades obertes: amb
   una sessió desada, la petició va amb la clau pública (també si qui crida
   intenta posar-hi una altra Authorization), sense galetes, i un 401 no
   renova la sessió ni reintenta. */
test('T2 · anonim: clau pública amb una sessió desada, cap galeta, i un 401 no crida la renovació', async () => {
  desa('synthetic-JWT-de-la-sessio', 'A');
  const renova = vi.fn(async () => { desa('synthetic-A-renewed', 'A'); return true; });
  configuraRefrescSessio(renova);
  const fetch = vi.fn().mockResolvedValueOnce(resposta(200, [])).mockResolvedValue(resposta(401));
  vi.stubGlobal('fetch', fetch);
  await expect(request('/rest/v1/app_content?select=key,payload', CONFIG, { anonim: true, headers: { Authorization: 'Bearer colat' } })).resolves.toEqual([]);
  const [, opcions] = fetch.mock.calls[0];
  expect(opcions.headers).toMatchObject({ apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${CONFIG.supabaseAnonKey}` });
  expect(opcions.credentials).toBe('omit');
  expect(JSON.stringify(opcions)).not.toContain('synthetic-JWT-de-la-sessio');
  const error = await request('/rest/v1/app_content?select=key,payload', CONFIG, { anonim: true }).catch((e) => e);
  expect(error).toBeInstanceOf(ErrorSupabase);
  expect(error.status).toBe(401);
  expect(renova).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(2);
  // Sense `anonim`, la mateixa sessió envia el seu JWT (la guarda no ha canviat res més).
  fetch.mockResolvedValueOnce(resposta(200, []));
  await request('/rest/v1/app_content', CONFIG);
  expect(tokens(fetch).at(-1)).toBe('Bearer synthetic-JWT-de-la-sessio');
  expect(fetch.mock.calls.at(-1)[1]).not.toHaveProperty('credentials');
});

/* ═══════════════ P0-ZERO-401-PREFLIGHT (v1.2.17, captura del Mestre 261121 16:09) ═══════════════
   Una pestanya oberta més d'una hora llançava 4 peticions paral·leles amb el JWT caducat: 4 × 401
   rojos a la consola abans del reintent. request() renova ara ABANS del fetch quan el JWT ja ha
   caducat o li falta menys del marge, amb la guarda C14 i el reintent post-401 intactes. */
const ARA = () => Date.now();
const caducat = (token, ms = -1000) => { m.exp.set(token, ARA() + ms); return token; };
/* La renovació compartida, com refreshSession (auth.js): una sola per època, la mateixa promesa per
   a totes les peticions que la demanen alhora. */
function renovacioCompartida(nou = 'synthetic-A-renewed', id = 'A') {
  let enCurs = null;
  const fetes = { n: 0 };
  const renova = vi.fn(() => (enCurs ??= (async () => {
    await new Promise((r) => setTimeout(r, 5));
    fetes.n += 1; caducat(nou, 3_600_000); desa(nou, id); return true;
  })().finally(() => { enCurs = null; })));
  return { renova, fetes };
}
/* PostgREST de mentides: 401 per a un JWT caducat, 200 per a la resta. */
const postgrest = () => vi.fn(async (_url, opcions) => {
  const jwt = String(opcions.headers.Authorization).replace(/^Bearer /, '');
  return (m.exp.get(jwt) ?? Infinity) <= ARA() ? resposta(401) : resposta(200, { ok: true });
});
const quatre = () => Promise.all(['a', 'b', 'c', 'd'].map((t) => request(`/rest/v1/${t}`, CONFIG)));

test('P0-ZERO-401-PREFLIGHT · 4 peticions concurrents amb el JWT caducat: 0 × 401 i una sola renovació', async () => {
  desa(caducat('synthetic-A-expired'), 'A');
  const { renova, fetes } = renovacioCompartida();
  configuraRefrescSessio(renova);
  const fetch = postgrest();
  vi.stubGlobal('fetch', fetch);
  expect(await quatre()).toEqual([{ ok: true }, { ok: true }, { ok: true }, { ok: true }]);
  const estats = await Promise.all(fetch.mock.results.map((r) => r.value.then((x) => x.status)));
  expect(estats.filter((e) => e === 401)).toHaveLength(0);
  expect(fetch).toHaveBeenCalledTimes(4);
  expect(tokens(fetch)).toEqual(Array(4).fill('Bearer synthetic-A-renewed'));
  expect(fetes.n).toBe(1);
});

/* v1.2.17 · Gauntlet R2 (L2R2-02) · Un JWT encara vàlid, encara que li falten 30 s, ix tal qual: renovar-lo abans pujava
   l'època i els qui comparen versioSessio rebien AbortError amb l'escriptura ja feta. Un de caducat, sí que es renova. */
test('P0-ZERO-401-PREFLIGHT · un JWT vàlid dins del marge ix tal qual; només un de caducat es renova abans', async () => {
  desa(caducat('synthetic-A-a-punt', 30_000), 'A');
  const { renova } = renovacioCompartida();
  configuraRefrescSessio(renova);
  const fetch = postgrest();
  vi.stubGlobal('fetch', fetch);
  const epoca = m.epoch;
  await request('/rest/v1/a', CONFIG);
  expect(renova).not.toHaveBeenCalled();
  expect(m.epoch).toBe(epoca);
  expect(tokens(fetch)).toEqual(['Bearer synthetic-A-a-punt']);
  desa(caducat('synthetic-A-caducat'), 'A');
  await request('/rest/v1/b', CONFIG);
  expect(renova).toHaveBeenCalledTimes(1);
  expect(tokens(fetch).at(-1)).toBe('Bearer synthetic-A-renewed');
});

test('P0-ZERO-401-PREFLIGHT · ni la lectura anònima, ni /auth/, ni un token opac, ni sense sessió no renoven abans', async () => {
  const { renova } = renovacioCompartida();
  configuraRefrescSessio(renova);
  const fetch = vi.fn(async () => resposta(200, { ok: true }));
  vi.stubGlobal('fetch', fetch);
  desa(caducat('synthetic-A-expired'), 'A');
  await request('/rest/v1/app_content', CONFIG, { anonim: true });
  await request('/auth/v1/user', CONFIG);
  desa('synthetic-opac', 'A');
  await request('/rest/v1/a', CONFIG);
  esborra();
  await request('/rest/v1/b', CONFIG);
  expect(renova).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(4);
});

test('P0-ZERO-401-PREFLIGHT · si no es pot renovar i la sessió no canvia, ix com abans i el reintent post-401 continua', async () => {
  desa(caducat('synthetic-A-expired'), 'A');
  const renova = vi.fn(async () => false);
  configuraRefrescSessio(renova);
  const fetch = postgrest();
  vi.stubGlobal('fetch', fetch);
  await expect(request('/rest/v1/a', CONFIG)).rejects.toMatchObject({ status: 401 });
  expect(tokens(fetch)).toEqual(['Bearer synthetic-A-expired']);
  expect(renova).toHaveBeenCalledTimes(2);
});

test('P0-ZERO-401-PREFLIGHT · C14: la renovació preventiva que porta un altre actor o tanca la sessió avorta sense enviar res', async () => {
  const fetch = postgrest();
  vi.stubGlobal('fetch', fetch);
  desa(caducat('synthetic-A-expired'), 'A');
  configuraRefrescSessio(async () => { desa('synthetic-A-renewed', 'A'); esborra(); desa('synthetic-B', 'B'); return true; });
  await expect(request('/rest/v1/a', CONFIG)).rejects.toMatchObject({ name: 'AbortError' });
  /* v1.2.17 · Gauntlet R1 (L2-03) · Renovada i tot seguit tancada: AbortError, com el C14 post-401.
     La renovació que falla i buida la pestanya ja no és d'este cas: dona el 401 de sempre (vegeu L2-03). */
  desa(caducat('synthetic-A-expired'), 'A');
  configuraRefrescSessio(async () => { desa('synthetic-A-renewed', 'A'); esborra(); return true; });
  await expect(request('/rest/v1/b', CONFIG)).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled();
});

test('P0-ZERO-401-PREFLIGHT · després de renovar abans, una revocació remota (401) encara renova i reintenta una vegada', async () => {
  desa(caducat('synthetic-A-expired'), 'A');
  let n = 0;
  const renova = vi.fn(async () => { n += 1; const nou = `synthetic-A-renewed-${n}`; caducat(nou, 3_600_000); desa(nou, 'A'); return true; });
  configuraRefrescSessio(renova);
  const fetch = vi.fn().mockResolvedValueOnce(resposta(401)).mockResolvedValueOnce(resposta(200, { ok: true }));
  vi.stubGlobal('fetch', fetch);
  expect(await request('/rest/v1/a', CONFIG)).toEqual({ ok: true });
  expect(tokens(fetch)).toEqual(['Bearer synthetic-A-renewed-1', 'Bearer synthetic-A-renewed-2']);
  expect(renova).toHaveBeenCalledTimes(2);
});

/* ═══════════════ v1.2.17 · Gauntlet R1 · la renovació preventiva ═══════════════
   L2-01 una sola renovació preventiva per token (rellotge avançat), L2-02 el temps del fetch és
   seu, L2-03 la renovació que buida la pestanya dona el 401 de sempre, L2-04 el signal talla
   l'espera, L2-05 una renovació que llança no canvia res, S-02 una Authorization pròpia no renova. */
const servidorEnHora = () => vi.fn(async () => resposta(200, { ok: true }));
/* El rellotge del client avançat 59 min o més: cada token nou ja hi naix caducat (o dins del marge). */
function renovaNascutCaducat(prefix, ms = -1000) {
  let n = 0;
  return vi.fn(async () => { n += 1; desa(caducat(`${prefix}-${n}`, ms), 'A'); return true; });
}

/* Gauntlet R2 (L2R2-02) · Només el token que naix ja caducat entra al preflight; el de dins del marge ix tal qual. */
test.each([['caducat', -1000], ['caducat de fa una hora', -3_600_000]])('v1.2.17 · Gauntlet R1 (L2-01) · rellotge avançat, cada token nou naix %s: N peticions seqüencials fan una sola renovació preventiva', async (_cas, ms) => {
  const prefix = `synthetic-A-skew-${ms}`;
  desa(caducat(`${prefix}-0`, ms), 'A');
  const renova = renovaNascutCaducat(prefix, ms);
  configuraRefrescSessio(renova);
  const fetch = servidorEnHora();
  vi.stubGlobal('fetch', fetch);
  for (const t of ['a', 'b', 'c', 'd', 'e', 'f']) await request(`/rest/v1/${t}`, CONFIG);
  expect(renova).toHaveBeenCalledTimes(1);
  expect(tokens(fetch)).toEqual(Array(6).fill(`Bearer ${prefix}-1`));
});

test('v1.2.17 · Gauntlet R1 (L2-01) · rellotge avançat: 4 concurrents i 4 seqüencials, una sola renovació', async () => {
  desa(caducat('synthetic-A-skewc-0'), 'A');
  let enCurs = null;
  let fetes = 0;
  const renova = vi.fn(() => (enCurs ??= (async () => {
    await new Promise((r) => setTimeout(r, 5));
    fetes += 1; desa(caducat('synthetic-A-skewc-1'), 'A'); return true;
  })().finally(() => { enCurs = null; })));
  configuraRefrescSessio(renova);
  const fetch = servidorEnHora();
  vi.stubGlobal('fetch', fetch);
  await quatre();
  // Les 4 concurrents compartixen la mateixa promesa: 4 crides, una renovació.
  expect(renova).toHaveBeenCalledTimes(4);
  for (const t of ['e', 'f', 'g', 'h']) await request(`/rest/v1/${t}`, CONFIG);
  expect(renova).toHaveBeenCalledTimes(4);
  expect(fetes).toBe(1);
  expect(tokens(fetch)).toEqual(Array(8).fill('Bearer synthetic-A-skewc-1'));
});

test('v1.2.17 · Gauntlet R1 (L2-01) · rellotge avançat: el servidor encara decidix (401 → renova i reintenta) i el token nou tampoc no es renova abans', async () => {
  desa(caducat('synthetic-A-skewr-0'), 'A');
  const renova = renovaNascutCaducat('synthetic-A-skewr');
  configuraRefrescSessio(renova);
  const fetch = vi.fn().mockResolvedValueOnce(resposta(200, { ok: true })).mockResolvedValueOnce(resposta(401)).mockResolvedValue(resposta(200, { ok: true }));
  vi.stubGlobal('fetch', fetch);
  await request('/rest/v1/a', CONFIG);
  expect(await request('/rest/v1/b', CONFIG)).toEqual({ ok: true });
  await request('/rest/v1/c', CONFIG);
  await request('/rest/v1/d', CONFIG);
  // Una preventiva (skewr-1) i una post-401 (skewr-2); cap més.
  expect(renova).toHaveBeenCalledTimes(2);
  expect(tokens(fetch)).toEqual(['Bearer synthetic-A-skewr-1', 'Bearer synthetic-A-skewr-1', 'Bearer synthetic-A-skewr-2', 'Bearer synthetic-A-skewr-2', 'Bearer synthetic-A-skewr-2']);
});

test('v1.2.17 · Gauntlet R1 (L2-01) · rellotge avançat: l’oient de l’avís recarrega abans que la petició reprenga, i ni torna a renovar ni l’avorta', async () => {
  desa(caducat('synthetic-A-skewo-0'), 'A');
  const recarregues = [];
  let n = 0;
  const renova = vi.fn(async () => {
    n += 1; desa(caducat(`synthetic-A-skewo-${n}`, 30_000), 'A');
    // emetCanvi és dins de renova: sincronitza recarrega abans que la petició que l'ha demanada reprenga.
    if (n === 1) recarregues.push(request('/rest/v1/recarrega', CONFIG));
    return true;
  });
  configuraRefrescSessio(renova);
  const fetch = servidorEnHora();
  vi.stubGlobal('fetch', fetch);
  expect(await request('/rest/v1/a', CONFIG)).toEqual({ ok: true });
  expect(await Promise.all(recarregues)).toEqual([{ ok: true }]);
  expect(renova).toHaveBeenCalledTimes(1);
  expect(tokens(fetch)).toEqual(Array(2).fill('Bearer synthetic-A-skewo-1'));
});

test('v1.2.17 · Gauntlet R1 (L2-01) · una renovació fallida no fa passar per nascut el token d’una entrada nova', async () => {
  desa(caducat('synthetic-A-fall-0'), 'A');
  const renova = vi.fn(async () => false);
  configuraRefrescSessio(renova);
  vi.stubGlobal('fetch', servidorEnHora());
  await request('/rest/v1/a', CONFIG);
  expect(renova).toHaveBeenCalledTimes(1);
  desa(caducat('synthetic-A-fall-1'), 'A');
  await request('/rest/v1/b', CONFIG);
  expect(renova).toHaveBeenCalledTimes(2);
});

test('v1.2.17 · Gauntlet R1 (L2-01) · P0 intacte: la pestanya que torna una hora després d’una renovació preventiva torna a renovar abans', async () => {
  vi.useFakeTimers();
  try {
    desa(caducat('synthetic-A-hora-0'), 'A');
    let n = 0;
    const renova = vi.fn(async () => { n += 1; desa(caducat(`synthetic-A-hora-${n}`, 3_600_000), 'A'); return true; });
    configuraRefrescSessio(renova);
    const fetch = servidorEnHora();
    vi.stubGlobal('fetch', fetch);
    await request('/rest/v1/a', CONFIG);
    vi.setSystemTime(Date.now() + 3_601_000);
    await request('/rest/v1/b', CONFIG);
    expect(renova).toHaveBeenCalledTimes(2);
    expect(tokens(fetch)).toEqual(['Bearer synthetic-A-hora-1', 'Bearer synthetic-A-hora-2']);
  } finally { vi.useRealTimers(); }
});

test('v1.2.17 · Gauntlet R1 (L2-02) · la renovació preventiva no es menja el temps del fetch', async () => {
  vi.useFakeTimers();
  try {
    desa(caducat('synthetic-A-l202-expired'), 'A');
    configuraRefrescSessio(async () => {
      await new Promise((r) => setTimeout(r, 900));
      desa(caducat('synthetic-A-l202-renewed', 3_600_000), 'A'); return true;
    });
    const fetch = lenta(200); vi.stubGlobal('fetch', fetch);
    // 900 ms de renovació + 200 ms de fetch amb timeoutMs 1000: abans, TimeoutError als 1000 ms.
    const crida = request('/rest/v1/a', CONFIG, { timeoutMs: 1000 });
    const assercio = expect(crida).resolves.toEqual({ ok: true });
    await vi.advanceTimersByTimeAsync(1_200);
    await assercio;
    expect(tokens(fetch)).toEqual(['Bearer synthetic-A-l202-renewed']);
    // El temporitzador continua tallant el fetch: 900 ms de renovació + 1.200 ms de fetch, TimeoutError.
    desa(caducat('synthetic-A-l202-expired-2'), 'A');
    vi.stubGlobal('fetch', lenta(1_200));
    const llarga = request('/rest/v1/b', CONFIG, { timeoutMs: 1000 });
    const tallada = expect(llarga).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(1_950);
    await tallada;
  } finally { vi.useRealTimers(); }
});

test('v1.2.17 · Gauntlet R1 (L2-03) · la renovació preventiva que falla i buida la pestanya dona el 401 de sempre, sense enviar res', async () => {
  const fetch = postgrest();
  vi.stubGlobal('fetch', fetch);
  desa(caducat('synthetic-A-l203-expired'), 'A');
  configuraRefrescSessio(async () => { esborra(); return false; });
  const error = await request('/rest/v1/a', CONFIG).catch((e) => e);
  expect(error).toBeInstanceOf(ErrorSupabase);
  expect(error).toMatchObject({ name: 'ErrorSupabase', status: 401, message: 'Supabase 401: la sessió ha caducat i no s\'ha pogut renovar.' });
  // Un altre actor o una entrada nova del mateix, en canvi: AbortError (C14).
  desa(caducat('synthetic-A-l203-expired-2'), 'A');
  configuraRefrescSessio(async () => { esborra(); desa('synthetic-B', 'B'); return false; });
  await expect(request('/rest/v1/b', CONFIG)).rejects.toMatchObject({ name: 'AbortError' });
  desa(caducat('synthetic-A-l203-expired-3'), 'A');
  configuraRefrescSessio(async () => { esborra(); desa('synthetic-A-new-login', 'A'); return false; });
  await expect(request('/rest/v1/c', CONFIG)).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled();
  // El mateix estat que el camí post-401 de sempre amb la renovació fallida (un token opac, sense preflight).
  desa('synthetic-A-l203-opac', 'A');
  configuraRefrescSessio(async () => { esborra(); return false; });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(401)));
  await expect(request('/rest/v1/d', CONFIG)).rejects.toMatchObject({ name: 'ErrorSupabase', status: 401 });
});

test('v1.2.17 · Gauntlet R1 (L2-04) · el signal de qui crida talla l’espera de la renovació preventiva, sense enviar res', async () => {
  desa(caducat('synthetic-A-l204-expired'), 'A');
  let acaba;
  const renova = vi.fn(() => new Promise((r) => { acaba = r; }));
  configuraRefrescSessio(renova);
  const fetch = servidorEnHora();
  vi.stubGlobal('fetch', fetch);
  // Ja avortat abans de començar: ni renova.
  await expect(request('/rest/v1/a', CONFIG, { signal: AbortSignal.abort() })).rejects.toMatchObject({ name: 'AbortError' });
  expect(renova).not.toHaveBeenCalled();
  const ctl = new AbortController();
  const crida = request('/rest/v1/b', CONFIG, { signal: ctl.signal });
  expect(renova).toHaveBeenCalledTimes(1);
  ctl.abort();
  await expect(crida).rejects.toMatchObject({ name: 'AbortError' });
  // La renovació compartida acaba després: la petició avortada no envia res.
  desa(caducat('synthetic-A-l204-renewed', 3_600_000), 'A');
  acaba(true);
  await new Promise((r) => setTimeout(r, 0));
  expect(fetch).not.toHaveBeenCalled();
});

test.each([['5xx', () => new Error('Error de servidor (503)')], ['xarxa', () => new TypeError('Failed to fetch')]])('v1.2.17 · Gauntlet R1 (L2-05) · la renovació preventiva que llança (%s): ix com abans amb el JWT caducat i el reintent post-401 continua', async (cas, falla) => {
  const vell = caducat(`synthetic-A-l205-${cas}-expired`);
  const nou = `synthetic-A-l205-${cas}-renewed`;
  desa(vell, 'A');
  const renova = vi.fn().mockRejectedValueOnce(falla()).mockImplementationOnce(async () => { desa(caducat(nou, 3_600_000), 'A'); return true; });
  configuraRefrescSessio(renova);
  const fetch = postgrest();
  vi.stubGlobal('fetch', fetch);
  expect(await request('/rest/v1/a', CONFIG)).toEqual({ ok: true });
  expect(tokens(fetch)).toEqual([`Bearer ${vell}`, `Bearer ${nou}`]);
  expect(renova).toHaveBeenCalledTimes(2);
});

test('v1.2.17 · Gauntlet R1 (S-02) · amb una Authorization pròpia no renova abans: la petició no usa el JWT de la sessió', async () => {
  desa(caducat('synthetic-A-s02-expired'), 'A');
  const renova = vi.fn(async () => { desa(caducat('synthetic-A-s02-renewed', 3_600_000), 'A'); return true; });
  configuraRefrescSessio(renova);
  const fetch = servidorEnHora();
  vi.stubGlobal('fetch', fetch);
  await request('/functions/v1/compte-apple', CONFIG, { method: 'POST', body: { accio: 'revoca' }, headers: { Authorization: 'Bearer synthetic-testimoni' } });
  await request('/functions/v1/compte-apple', CONFIG, { method: 'POST', body: { accio: 'revoca' }, headers: { authorization: 'Bearer synthetic-testimoni' } });
  expect(renova).not.toHaveBeenCalled();
  expect(tokens(fetch)[0]).toBe('Bearer synthetic-testimoni');
  // Sense capçalera pròpia, la mateixa sessió sí que renova abans.
  await request('/rest/v1/a', CONFIG);
  expect(renova).toHaveBeenCalledTimes(1);
  expect(tokens(fetch).at(-1)).toBe('Bearer synthetic-A-s02-renewed');
});

/* ═══════════════ v1.2.19 · fusió · preflight de la v1.2.17 + llinatge i cancel·lació de Codex R32.29 ═══════════════
   Les dues bandes conviuen dins del mateix request(): la guarda d'entrada (capturaSessio) també vigila el preflight,
   la renovació post-401 que buida la pestanya continua donant el 401 de sempre.
   v1.2.19 · Gauntlet R1 (L1-02) · I la mateixa regla del temporitzador als dos camins (L2-02): cap renovació, ni la
   preventiva ni la post-401, no es menja el temps del fetch; només el signal de qui crida en talla l'espera. */
test('v1.2.19 · fusió · el preflight que torna una entrada nova del mateix UUID com a renovació avorta sense enviar res', async () => {
  desa(caducat('synthetic-A-fus-expired'), 'A');
  // Època + 1 i el mateix actor (passa la C14), però una entrada nova: la guarda d'entrada de R32.29 l'atura.
  configuraRefrescSessio(async () => { m.entry++; desa(caducat('synthetic-A-fus-reentrada', 3_600_000), 'A'); return true; });
  const fetch = servidorEnHora();
  vi.stubGlobal('fetch', fetch);
  await expect(request('/rest/v1/a', CONFIG)).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled();
});

test('v1.2.19 · fusió · (L2-03) la renovació post-401 que falla i buida la pestanya dona el 401 de sempre; si hi entra un altre, AbortError', async () => {
  // Un JWT encara vàlid per al client: sense preflight; el 401 és del servidor (revocació remota).
  desa(caducat('synthetic-A-fus-viu', 3_600_000), 'A');
  configuraRefrescSessio(async () => { esborra(); return false; });
  const text = vi.fn(async () => '');
  vi.stubGlobal('fetch', vi.fn(async () => ({ ...resposta(401), text })));
  const error = await request('/rest/v1/a', CONFIG).catch((e) => e);
  expect(error).toBeInstanceOf(ErrorSupabase);
  expect(error).toMatchObject({ status: 401, message: 'Supabase 401: la sessió ha caducat i no s\'ha pogut renovar.' });
  desa(caducat('synthetic-A-fus-viu-2', 3_600_000), 'A');
  configuraRefrescSessio(async () => { esborra(); desa('synthetic-B', 'B'); return false; });
  await expect(request('/rest/v1/b', CONFIG)).rejects.toMatchObject({ name: 'AbortError' });
  // Cap de les dues llig el cos de la sessió que ja no existix.
  expect(text).not.toHaveBeenCalled();
});

/* v1.2.19 · Gauntlet R1 (L1-02) · Substituïx «(L2-02 + R32.29) … talla també l’espera del refresc post-401», que fixava
   la regla contrària al camí post-401. Ara els dos camins, amb els mateixos números: timeoutMs 1000 i una renovació de
   1500 ms que acaba bé. «pre»: el JWT ja ha caducat per al client (preflight). «post»: encara val per al client, però el
   servidor el rebutja (revocació remota, deriva de rellotge): 401, renovació i reintent amb temporitzador propi. */
test.each([['preventiva (preflight)', 'pre'], ['post-401', 'post']])('v1.2.19 · Gauntlet R1 (L1-02) · la renovació %s no es menja el temps del fetch; el fetch de després el té sencer i el signal de qui crida talla l’espera', async (_cas, cami) => {
  vi.useFakeTimers();
  try {
    const nou = (ronda) => `synthetic-A-l102-${cami}-${ronda}-nou`;
    const entra = (ronda) => desa(caducat(`synthetic-A-l102-${cami}-${ronda}-vell`, cami === 'pre' ? -1000 : 3_600_000), 'A');
    const text = vi.fn(async () => '');
    /* Només el token renovat val al servidor; la resposta bona tarda `ms` i el signal la talla. */
    const servidor = (ronda, ms) => vi.fn((_url, opcions) => {
      if (opcions.headers.Authorization !== `Bearer ${nou(ronda)}`) return Promise.resolve({ ...resposta(401), text });
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => resolve(resposta(200, { ok: true })), ms);
        opcions.signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('avortada', 'AbortError')); });
      });
    });
    const renovaEn = (ronda, ms) => configuraRefrescSessio(() => new Promise((r) => setTimeout(() => { desa(caducat(nou(ronda), 3_600_000), 'A'); r(true); }, ms)));
    const esperat = (ronda) => [...(cami === 'post' ? [`Bearer synthetic-A-l102-${cami}-${ronda}-vell`] : []), `Bearer ${nou(ronda)}`];

    // 1. Renovació de 1500 ms + fetch de 200 ms amb timeoutMs 1000: les dades, no TimeoutError.
    entra(1); renovaEn(1, 1_500);
    let fetch = servidor(1, 200); vi.stubGlobal('fetch', fetch);
    let estat = 'pendent';
    let crida = request('/rest/v1/a', CONFIG, { timeoutMs: 1000 }).then((d) => { estat = d; }, (e) => { estat = e.name; });
    await vi.advanceTimersByTimeAsync(1_400);
    expect(estat).toBe('pendent');                          // passat timeoutMs, la renovació encara no ha acabat
    await vi.advanceTimersByTimeAsync(300);
    await crida;
    expect(estat).toEqual({ ok: true });
    expect(tokens(fetch)).toEqual(esperat(1));

    // 2. El fetch de després (el del preflight o el reintent) porta el temporitzador sencer: 1200 ms > 1000, TimeoutError.
    entra(2); renovaEn(2, 1_500);
    fetch = servidor(2, 1_200); vi.stubGlobal('fetch', fetch);
    estat = 'pendent';
    crida = request('/rest/v1/b', CONFIG, { timeoutMs: 1000 }).then((d) => { estat = d; }, (e) => { estat = e.name; });
    await vi.advanceTimersByTimeAsync(2_450);
    expect(estat).toBe('pendent');                          // 1500 de renovació + 950 del fetch de després
    await vi.advanceTimersByTimeAsync(100);
    await crida;
    expect(estat).toBe('TimeoutError');
    expect(tokens(fetch)).toEqual(esperat(2));

    // 3. Una renovació penjada: el temporitzador no la talla; el signal de qui crida, sí, sense enviar res més ni llegir el cos.
    entra(3);
    configuraRefrescSessio(() => new Promise(() => {}));
    fetch = servidor(3, 0); vi.stubGlobal('fetch', fetch);
    text.mockClear();
    const ctl = new AbortController();
    estat = 'pendent';
    crida = request('/rest/v1/c', CONFIG, { timeoutMs: 1000, signal: ctl.signal }).then((d) => { estat = d; }, (e) => { estat = e.name; });
    await vi.advanceTimersByTimeAsync(5_000);
    expect(estat).toBe('pendent');
    ctl.abort();
    await crida;
    expect(estat).toBe('AbortError');
    expect(fetch).toHaveBeenCalledTimes(cami === 'pre' ? 0 : 1);
    expect(text).not.toHaveBeenCalled();
  } finally { vi.useRealTimers(); }
});

/* v1.2.19 · Gauntlet R1 (L1-02) · Sense reintent (la renovació post-401 torna false i la sessió es queda), el cos del
   401 té el temps que li quedava al fetch: la renovació no el consumix, però el temporitzador el continua tallant. */
test('v1.2.19 · Gauntlet R1 (L1-02) · renovació post-401 fallida sense buidar la pestanya: el cos del 401 té la resta del temps del fetch', async () => {
  vi.useFakeTimers();
  try {
    desa(caducat('synthetic-A-l102-cos-viu', 3_600_000), 'A');
    configuraRefrescSessio(() => new Promise((r) => setTimeout(() => r(false), 1_500)));
    // El 401 arriba als 300 ms; el cos no arriba mai, però escolta el signal com un fetch de veres.
    vi.stubGlobal('fetch', vi.fn((_url, opcions) => new Promise((resolve) => setTimeout(() => resolve({ ...resposta(401),
      text: () => new Promise((_r, reject) => opcions.signal.addEventListener('abort', () => reject(new DOMException('avortada', 'AbortError')))) }), 300))));
    let estat = 'pendent';
    const crida = request('/rest/v1/a', CONFIG, { timeoutMs: 1000 }).then((d) => { estat = d; }, (e) => { estat = e.name; });
    // 300 ms de fetch + 1500 de renovació + 650 dels 700 que li quedaven: encara no.
    await vi.advanceTimersByTimeAsync(2_450);
    expect(estat).toBe('pendent');
    await vi.advanceTimersByTimeAsync(100);
    await crida;
    expect(estat).toBe('TimeoutError');
  } finally { vi.useRealTimers(); }
});

/* v1.2.19 · Gauntlet R2 (L1R2-01) · El termini del cos del 401 va amb un rellotge monotònic: un salt de l'hora del sistema
   durant el fetch (±1 h, el telèfon que corregix l'hora en tornar la xarxa) no el deixa sense topall ni el talla a zero. */
test.each([['arrere', -3_600_000], ['avant', 3_600_000]])('v1.2.19 · Gauntlet R2 (L1R2-01) · si l’hora salta %s durant el fetch, el cos del 401 continua tenint la resta del temps', async (_sentit, salt) => {
  vi.useFakeTimers();
  try {
    desa(caducat(`synthetic-A-l1r201-${_sentit}`, 3_600_000), 'A');
    configuraRefrescSessio(() => new Promise((r) => setTimeout(() => r(false), 1_500)));
    vi.stubGlobal('fetch', vi.fn((_url, opcions) => new Promise((resolve) => setTimeout(() => {
      vi.setSystemTime(Date.now() + salt);
      resolve({ ...resposta(401),
        text: () => new Promise((_r, reject) => opcions.signal.addEventListener('abort', () => reject(new DOMException('avortada', 'AbortError')))) });
    }, 300))));
    let estat = 'pendent';
    const crida = request('/rest/v1/a', CONFIG, { timeoutMs: 1000 }).then((d) => { estat = d; }, (e) => { estat = e.name; });
    // Com sense salt: 300 ms de fetch + 1500 de renovació + els 700 que li quedaven.
    await vi.advanceTimersByTimeAsync(2_450);
    expect(estat).toBe('pendent');
    await vi.advanceTimersByTimeAsync(100);
    await crida;
    expect(estat).toBe('TimeoutError');
  } finally { vi.useRealTimers(); }
});
