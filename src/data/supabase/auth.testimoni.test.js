/* Fase D (261020, tasca 1) · La capacitat 'entradaAmbToken' de l'adaptador
   Supabase (entraAmbTokenDeProveidor): el testimoni del full natiu d'Apple o de
   Google canviat per una sessió amb grant_type=id_token. Els simulats són els
   d'auth.test.js (identitat, runtime, oauthRelay, recuperació); l'intent
   d'entrada (authAttempt.js) és el de veres. Tot és sintètic. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  user: { id: 'A', user_metadata: {} }, exp: null, epoch: 0, refreshes: 0, saveOk: true,
  ordre: [], rutes: null, changed: null
}));
vi.mock('../../config/storage.js', () => ({ getEfimer: () => 'synthetic-refresh' }));
vi.mock('../recuperacioPendent.js', () => ({
  ESTAT_ENLLAC: Object.freeze({ PENDENT: 'pendent', PERDUT: 'perdut' }),
  marcaRecuperacioPendent: vi.fn(), oblidaRecuperacioPendent: vi.fn(),
  anunciaEnllacDeRecuperacio: vi.fn(), oblidaEnllacDeRecuperacio: vi.fn(),
  estatEnllacDeRecuperacio: () => null, escoltaRecuperacioPendent: () => () => {}
}));
vi.mock('../identitat.js', () => ({
  configuraBackendSessio: vi.fn(() => { m.ordre.push('configura'); }), esBackendDeSessio: () => true, jwtPerBackend: () => 'synthetic-refresh',
  CLAU_REFRESC: 'refresh', CLAU_JWT: 'jwt', CLAU_ORIGEN: 'origen', get versioSessio() { return m.epoch; },
  triaRefresc: () => ({ rt: 'synthetic-refresh', mode: 'efimer', sub: 'A' }), rotaRegistre: vi.fn(), oblidaRegistre: vi.fn(),
  desaSessio: vi.fn(() => { m.epoch++; m.ordre.push('desa'); return m.saveOk; }),
  capturaSessio: () => { const generation = m.epoch - m.refreshes; return () => { if (generation !== m.epoch - m.refreshes) throw new DOMException('La sessió ha canviat.', 'AbortError'); }; },
  esborraSessio: () => { m.epoch++; },
  usuariDeSessio: () => m.user, actualitzaUsuariSessio: vi.fn((canvis) => { m.ordre.push('actualitza'); m.changed = canvis; }),
  caducitatJwt: () => m.exp, MARGE_RENOVACIO_MS: 60_000
}));
vi.mock('../oauthRelay.js', () => ({ entraAmbGoogle: vi.fn(), gestionaTornada: vi.fn(), exigeixSenseMarcAlie: vi.fn(),
  urlDeTornadaAlta: vi.fn(() => 'https://amfitrio.example.test/pagina?sdp_auth=alta'),
  urlDeTornadaRecuperacio: vi.fn(() => 'https://amfitrio.example.test/pagina?sdp_auth=recuperacio'),
  recullMarcaDeRecuperacio: vi.fn(() => null) }));
/* Cada petició passa per m.rutes: «MÈTODE ruta» → resposta, o una funció. */
vi.mock('./runtime.js', () => ({
  configuraRefrescSessio: vi.fn(), getCurrentUser: () => m.user,
  getResolvedConfig: (config) => ({ supabaseUrl: 'https://example.test', supabaseAnonKey: 'public', runtimeDataMode: config.dataMode || 'remote', ...config }),
  request: vi.fn(async (ruta, _config, opcions = {}) => {
    const clau = `${opcions.method || 'GET'} ${ruta}`;
    m.ordre.push(clau);
    const resposta = m.rutes?.[clau];
    if (resposta === undefined) throw new Error(`ruta desconeguda: ${clau}`);
    return typeof resposta === 'function' ? resposta(opcions) : resposta;
  }),
  rpc: vi.fn(async (nom) => { m.ordre.push(`rpc ${nom}`); return [{ poble_nou: false }]; })
}));
vi.mock('./realtime.js', () => ({ tancaRealtime: vi.fn(async () => {}) }));
vi.mock('./config.js', () => ({ resetClient: vi.fn(() => { m.ordre.push('reset'); }) }));
import { entraAmbTokenDeProveidor } from './auth.js';
import { request } from './runtime.js';
import { configuraBackendSessio, desaSessio } from '../identitat.js';
import { beginAuthAttempt, cancelAuthAttempts } from '../authAttempt.js';
import { CODI_ENTRADA } from '../errorsBackend.js';

const TOKEN = 'POST /auth/v1/token?grant_type=id_token';
const PERFIL = 'GET /rest/v1/profiles?id=eq.A';
const PATCH = 'PATCH /rest/v1/profiles?id=eq.A';
const PUT = 'PUT /auth/v1/user';
const FOTO = 'GET /rest/v1/profiles?id=eq.A&select=avatar_url';
const JWT = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ4In0.c2lnbmF0dXJh';
const NONCE = 'a'.repeat(64);
const SESSIO = Object.freeze({ access_token: 'sintetic-acces', refresh_token: 'sintetic-refresc', user: { id: 'A', user_metadata: {} } });
const CONFIG = Object.freeze({ dataMode: 'remote' });
const apple = (extra = {}) => ({ testimoni: JWT, nonce: NONCE, testimoniAcces: null, nom: null, ...extra });
const errorDeGoTrue = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${JSON.stringify(cos)}`), { status });
const ambRutes = (rutes = {}) => { m.rutes = { [TOKEN]: SESSIO, [FOTO]: [], ...rutes }; };
const promesaOberta = () => { let resol; const promesa = new Promise((r) => { resol = r; }); return { promesa, resol }; };
const esdeveniments = [];
const escolta = (event) => {
  esdeveniments.push(event.detail?.user ?? null);
  m.ordre.push(`event ${event.detail?.user?.id ?? 'null'}`);
};
/* Les tasques de millor esforç (alta, foto) no s'esperen: es deixen acabar. */
const buida = () => new Promise((resol) => setTimeout(resol, 0));

beforeEach(() => {
  m.user = { id: 'A', user_metadata: {} };
  m.saveOk = true;
  m.ordre.length = 0;
  m.changed = null;
  esdeveniments.length = 0;
  ambRutes();
  globalThis.window.addEventListener('sdp:auth-change', escolta);
});
afterEach(() => {
  globalThis.window.removeEventListener('sdp:auth-change', escolta);
  cancelAuthAttempts();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('la petició i la coreografia', () => {
  test('Apple: POST id_token amb provider, id_token i el nonce cru, sense access_token, i amb el senyal de l’intent', async () => {
    await entraAmbTokenDeProveidor('apple', apple({ testimoniAcces: 'codi-que-no-viatja' }), CONFIG);
    const [ruta, , opcions] = request.mock.calls[0];
    expect(ruta).toBe('/auth/v1/token?grant_type=id_token');
    expect(opcions.method).toBe('POST');
    expect(opcions.signal).toBeInstanceOf(AbortSignal);
    expect(opcions.body).toEqual({ provider: 'apple', id_token: JWT, nonce: NONCE });
  });

  test('Google porta l’access_token (at_hash); sense nonce, cap clau nonce', async () => {
    await entraAmbTokenDeProveidor('google', { testimoni: JWT, nonce: null, testimoniAcces: 'ya29.sintetic' }, CONFIG);
    expect(request.mock.calls[0][2].body).toEqual({ provider: 'google', id_token: JWT, access_token: 'ya29.sintetic' });
  });

  test('l’ordre: configura, token, desa, reset, l’avís amb l’usuari, l’alta i la foto; torna { user } sense cap testimoni', async () => {
    const resultat = await entraAmbTokenDeProveidor('apple', apple(), CONFIG);
    await buida();
    expect(m.ordre).toEqual(['configura', TOKEN, 'desa', 'reset', 'event A', 'rpc completa_la_meua_alta', FOTO]);
    expect(resultat).toEqual({ user: m.user });
    expect(JSON.stringify(resultat)).not.toMatch(/sintetic-acces|sintetic-refresc/);
    expect(desaSessio).toHaveBeenCalledWith(SESSIO);
  });
});

/* T1 (261024; P0-04, App Store 5.1.1(v)) · El codi d'autorització d'Apple va a
   la funció compte-apple, mai a GoTrue, i mai fa fallar l'entrada. */
const CUSTODIA = 'POST /functions/v1/compte-apple';
const CODI_APPLE = 'c0d1.0.apple-sintetic';
describe('la custòdia del codi d’Apple', () => {
  test('el cos de GoTrue no canvia; la custòdia ix DESPRÉS de desar la sessió, amb { accio, codi } i un topall', async () => {
    ambRutes({ [CUSTODIA]: { ok: true, resultat: 'desat' } });
    await entraAmbTokenDeProveidor('apple', apple({ codiAutoritzacio: ` ${CODI_APPLE} ` }), CONFIG);
    await buida();
    expect(request.mock.calls[0][2].body).toEqual({ provider: 'apple', id_token: JWT, nonce: NONCE });
    const custodia = request.mock.calls.filter(([ruta]) => ruta === '/functions/v1/compte-apple');
    expect(custodia).toHaveLength(1);
    expect(custodia[0][2]).toMatchObject({ method: 'POST', body: { accio: 'custodia', codi: CODI_APPLE } });
    expect(custodia[0][2].timeoutMs).toBeGreaterThanOrEqual(10000);
    expect(m.ordre.indexOf(CUSTODIA)).toBeGreaterThan(m.ordre.indexOf('reset'));
    expect(m.ordre.indexOf('reset')).toBeGreaterThan(m.ordre.indexOf('desa'));
    expect(JSON.stringify(request.mock.calls.filter(([ruta]) => ruta !== '/functions/v1/compte-apple'))).not.toContain(CODI_APPLE);
  });

  test('si la custòdia falla o penja, l’entrada ja s’ha completat igual i l’avís no porta el codi', async () => {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const penjada = promesaOberta();
    ambRutes({ [CUSTODIA]: () => penjada.promesa });
    await expect(entraAmbTokenDeProveidor('apple', apple({ codiAutoritzacio: CODI_APPLE }), CONFIG)).resolves.toEqual({ user: m.user });
    ambRutes({ [CUSTODIA]: () => { throw Object.assign(new Error(`Supabase 502: ${CODI_APPLE}`), { status: 502 }); } });
    await expect(entraAmbTokenDeProveidor('apple', apple({ codiAutoritzacio: CODI_APPLE }), CONFIG)).resolves.toEqual({ user: m.user });
    await buida();
    expect(avis).toHaveBeenCalled();
    expect(JSON.stringify(avis.mock.calls)).not.toContain(CODI_APPLE);
    penjada.resol(null);
    avis.mockRestore();
  });

  test('Google, un codi sense forma o cap codi: cap crida a la funció', async () => {
    await entraAmbTokenDeProveidor('google', { testimoni: JWT, nonce: null, codiAutoritzacio: CODI_APPLE }, CONFIG);
    await entraAmbTokenDeProveidor('apple', apple({ codiAutoritzacio: 'amb espais dins' }), CONFIG);
    await entraAmbTokenDeProveidor('apple', apple({ codiAutoritzacio: 'curt' }), CONFIG);
    await entraAmbTokenDeProveidor('apple', apple({ codiAutoritzacio: 'x'.repeat(1025) }), CONFIG);
    await entraAmbTokenDeProveidor('apple', apple(), CONFIG);
    await buida();
    expect(request.mock.calls.filter(([ruta]) => ruta === '/functions/v1/compte-apple')).toEqual([]);
  });

  test('un GoTrue que rebutja el testimoni no envia cap codi', async () => {
    ambRutes({ [TOKEN]: () => { throw errorDeGoTrue(400, { error: 'invalid_grant', error_description: 'Bad ID token' }); } });
    await expect(entraAmbTokenDeProveidor('apple', apple({ codiAutoritzacio: CODI_APPLE }), CONFIG)).rejects.toMatchObject({ code: CODI_ENTRADA.TOKEN_REBUTJAT });
    expect(request.mock.calls.filter(([ruta]) => ruta === '/functions/v1/compte-apple')).toEqual([]);
  });
});

describe('el nom d’Apple, només la primera vegada', () => {
  test('amb el nom de reserva (Veí/na): PATCH i PUT amb data.full_name, tots dos abans de l’avís', async () => {
    ambRutes({
      [PERFIL]: [{ id: 'A', full_name: 'Veí/na' }],
      [PATCH]: (opcions) => [{ id: 'A', ...opcions.body }],
      [PUT]: (opcions) => ({ id: 'A', user_metadata: opcions.body.data })
    });
    await entraAmbTokenDeProveidor('apple', apple({ nom: 'Maria Ferrer' }), CONFIG);
    const patch = request.mock.calls.find(([, , o]) => o?.method === 'PATCH');
    const put = request.mock.calls.find(([, , o]) => o?.method === 'PUT');
    expect(patch[2].body).toEqual({ full_name: 'Maria Ferrer' });
    expect(put[2].body).toEqual({ data: { full_name: 'Maria Ferrer' } });
    expect(m.ordre.indexOf(PUT)).toBeLessThan(m.ordre.indexOf('event A'));
    expect(m.ordre.indexOf(PATCH)).toBeLessThan(m.ordre.indexOf(PUT));
  });

  test('un nom propi a la fitxa no es trepitja; un nom propi a les metadades ni llig la fitxa; sense nom, res', async () => {
    ambRutes({ [PERFIL]: [{ id: 'A', full_name: 'Maria editada' }] });
    await entraAmbTokenDeProveidor('apple', apple({ nom: 'Maria Ferrer' }), CONFIG);
    expect(m.ordre).toContain(PERFIL);
    expect(m.ordre).not.toContain(PATCH);

    m.ordre.length = 0;
    ambRutes({ [TOKEN]: { ...SESSIO, user: { id: 'A', user_metadata: { full_name: 'Maria de sempre' } } } });
    await entraAmbTokenDeProveidor('apple', apple({ nom: 'Maria Ferrer' }), CONFIG);
    expect(m.ordre).not.toContain(PERFIL);

    m.ordre.length = 0;
    ambRutes();
    await entraAmbTokenDeProveidor('apple', apple({ nom: null }), CONFIG);
    expect(m.ordre).not.toContain(PERFIL);
  });

  test('un PATCH que falla no tomba l’entrada', async () => {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    ambRutes({ [PERFIL]: [{ id: 'A', full_name: '' }], [PATCH]: () => { throw errorDeGoTrue(403, { message: 'RLS' }); } });
    await expect(entraAmbTokenDeProveidor('apple', apple({ nom: 'Maria' }), CONFIG)).resolves.toEqual({ user: m.user });
    expect(m.ordre).toContain('event A');
    expect(avis).toHaveBeenCalled();
    avis.mockRestore();
  });

  test('un PATCH que no torna mai: l’entrada acaba passats 5 s', async () => {
    vi.useFakeTimers();
    ambRutes({ [PERFIL]: [{ id: 'A', full_name: 'Veí/na' }], [PATCH]: () => new Promise(() => {}) });
    const entrada = entraAmbTokenDeProveidor('apple', apple({ nom: 'Maria' }), CONFIG);
    await vi.advanceTimersByTimeAsync(4999);
    expect(m.ordre).not.toContain('event A');
    await vi.advanceTimersByTimeAsync(1);
    await expect(entrada).resolves.toEqual({ user: m.user });
    expect(m.ordre).toContain('event A');
  });

  test('el nom es neteja: cap emoji partit en el caràcter 120, fora els de control i els de direcció', async () => {
    ambRutes({
      [PERFIL]: [{ id: 'A', full_name: 'Veí/na' }],
      [PATCH]: (opcions) => [{ id: 'A', ...opcions.body }],
      [PUT]: (opcions) => ({ id: 'A', user_metadata: opcions.body.data })
    });
    const nom = `${'x'.repeat(119)}🙂🙂 final`;
    await entraAmbTokenDeProveidor('apple', apple({ nom }), CONFIG);
    const desat = request.mock.calls.find(([, , o]) => o?.method === 'PATCH')[2].body.full_name;
    expect(Array.from(desat)).toHaveLength(120);
    expect(desat.endsWith('🙂')).toBe(true);
    expect(/[\uD800-\uDBFF]$/.test(desat)).toBe(false);

    vi.clearAllMocks();
    await entraAmbTokenDeProveidor('apple', apple({ nom: 'Na‮ Maria\u0007\n  Ferrer' }), CONFIG);
    expect(request.mock.calls.find(([, , o]) => o?.method === 'PATCH')[2].body.full_name).toBe('Na Maria Ferrer');
  });
});

describe('els errors del servidor, pel codi', () => {
  test.each([
    ['Bad ID token', 400, { error: 'invalid request', error_description: 'Bad ID token' }, CODI_ENTRADA.TOKEN_REBUTJAT],
    ['un nonce que no casa', 400, { error: 'invalid nonce', error_description: 'Nonces mismatch' }, CODI_ENTRADA.TOKEN_REBUTJAT],
    ['validation_failed', 400, { code: 400, error_code: 'validation_failed', msg: 'x' }, CODI_ENTRADA.TOKEN_REBUTJAT],
    ['el proveïdor apagat', 400, { code: 400, error_code: 'provider_disabled', msg: 'Unsupported provider' }, CODI_ENTRADA.PROVEIDOR_INACTIU],
    ['massa intents', 429, { error_code: 'over_request_rate_limit' }, CODI_ENTRADA.MASSA_INTENTS],
    ['les altes tancades', 422, { error_code: 'signup_disabled' }, CODI_ENTRADA.DESCONEGUT],
    ['el servidor caigut', 503, {}, CODI_ENTRADA.SERVIDOR_INABASTABLE]
  ])('%s → %s, amb la causa i sense desar res', async (_cas, status, cos, code) => {
    const crua = errorDeGoTrue(status, cos);
    ambRutes({ [TOKEN]: () => { throw crua; } });
    await expect(entraAmbTokenDeProveidor('apple', apple(), CONFIG)).rejects.toMatchObject({ code, cause: crua });
    expect(desaSessio).not.toHaveBeenCalled();
  });

  test('sense xarxa (estat 0) és SERVIDOR_INABASTABLE; un AbortError passa tal qual', async () => {
    ambRutes({ [TOKEN]: () => { throw Object.assign(new Error('Error de xarxa'), { status: 0 }); } });
    await expect(entraAmbTokenDeProveidor('google', { testimoni: JWT }, CONFIG)).rejects.toMatchObject({ code: CODI_ENTRADA.SERVIDOR_INABASTABLE });
    const avort = new DOMException('avortat', 'AbortError');
    ambRutes({ [TOKEN]: () => { throw avort; } });
    await expect(entraAmbTokenDeProveidor('google', { testimoni: JWT }, CONFIG)).rejects.toBe(avort);
  });

  test('el text de cada codi nou és la frase en valencià', async () => {
    ambRutes({ [TOKEN]: () => { throw errorDeGoTrue(400, { error_code: 'provider_disabled' }); } });
    await expect(entraAmbTokenDeProveidor('apple', apple(), CONFIG)).rejects
      .toThrow('Esta manera d’entrar encara no està activada al servidor del poble. Entra amb el correu.');
    ambRutes({ [TOKEN]: () => { throw errorDeGoTrue(400, { error: 'invalid request', error_description: 'Bad ID token' }); } });
    await expect(entraAmbTokenDeProveidor('apple', apple(), CONFIG)).rejects
      .toThrow('El servidor del poble no ha acceptat la identificació del teu compte. Torna-ho a provar o entra amb el correu.');
  });
});

describe('els rebuigs sense petició', () => {
  test.each(['seed', 'local'])('en %s, MODE_LOCAL i cap petició', async (dataMode) => {
    await expect(entraAmbTokenDeProveidor('apple', apple(), { dataMode })).rejects.toMatchObject({ code: CODI_ENTRADA.MODE_LOCAL });
    expect(request).not.toHaveBeenCalled();
  });

  test.each([
    ['un proveïdor desconegut', 'facebook', apple(), CODI_ENTRADA.DESCONEGUT],
    ['un testimoni que no és un JWT', 'apple', apple({ testimoni: 'no-es-un-jwt' }), CODI_ENTRADA.TOKEN_REBUTJAT],
    ['un testimoni buit', 'google', { testimoni: '' }, CODI_ENTRADA.TOKEN_REBUTJAT],
    ['un nonce massa curt', 'apple', apple({ nonce: 'curt' }), CODI_ENTRADA.TOKEN_REBUTJAT],
    ['un nonce amb espais', 'apple', apple({ nonce: `${'a'.repeat(20)} ${'b'.repeat(20)}` }), CODI_ENTRADA.TOKEN_REBUTJAT],
    ['un accés de Google amb espais', 'google', { testimoni: JWT, testimoniAcces: 'ya29 sintetic' }, CODI_ENTRADA.TOKEN_REBUTJAT]
  ])('%s rebutja abans de configurar la sessió', async (_cas, proveidor, credencial, code) => {
    await expect(entraAmbTokenDeProveidor(proveidor, credencial, CONFIG)).rejects.toMatchObject({ code });
    expect(request).not.toHaveBeenCalled();
    expect(configuraBackendSessio).not.toHaveBeenCalled();
  });

  test('una sessió que no es pot desar avisa amb null i llança', async () => {
    m.saveOk = false;
    await expect(entraAmbTokenDeProveidor('apple', apple(), CONFIG)).rejects.toThrow('No s’ha pogut desar la sessió');
    expect(esdeveniments).toEqual([null]);
  });

  test('una resposta sense usuari no desa res', async () => {
    ambRutes({ [TOKEN]: { access_token: 'x' } });
    await expect(entraAmbTokenDeProveidor('apple', apple(), CONFIG)).rejects.toThrow('El servidor no ha confirmat la sessió');
    expect(desaSessio).not.toHaveBeenCalled();
  });

  test('una altra entrada pel camí avorta esta: AbortError i cap sessió desada', async () => {
    const resposta = promesaOberta();
    ambRutes({ [TOKEN]: () => resposta.promesa });
    const entrada = entraAmbTokenDeProveidor('apple', apple(), CONFIG);
    await Promise.resolve();
    const altra = beginAuthAttempt();
    resposta.resol(SESSIO);
    await expect(entrada).rejects.toMatchObject({ name: 'AbortError' });
    expect(desaSessio).not.toHaveBeenCalled();
    altra.finish();
  });
});
