// @vitest-environment-options {"url": "https://gentdelatorre.net/una/pagina?x=1"}
/* R · Onada 3 (261003) · Recuperació de contrasenya des d'un amfitrió (Model B).
   L'anada demana el correu amb redirect_to = la pàgina de l'amfitrió (urlDeTornada
   de P1, la de veres); la tornada porta el token_hash al fragment.
   R2 (decisió del Mestre, 261003) · recullTornadaOAuth NO el verifica: neteja la
   URL i el guarda en memòria; «Desa» (definixContrasenyaNova) el verifica, definix
   la contrasenya i, només llavors, desa la sessió. Ací oauthRelay.js,
   tornadaRecuperacio.js i recuperacioPendent.js són els de veres i jsdom viu a la
   pàgina de l'amfitrió; només es falsegen el transport, la revocació (fetch) i
   l'escriptura de la sessió. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ request: vi.fn(), desa: vi.fn(() => true), user: null, fetch: null }));
vi.mock('../identitat.js', async (importOriginal) => ({
  ...await importOriginal(),
  configuraBackendSessio: vi.fn(),
  desaSessio: (...args) => m.desa(...args),
  esBackendDeSessio: () => true,
  caducitatJwt: () => null,
  capturaSessio: () => () => {}
}));
vi.mock('./runtime.js', () => ({ configuraRefrescSessio: vi.fn(), getCurrentUser: () => m.user, request: m.request, rpc: vi.fn(),
  getResolvedConfig: (config) => ({ supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'public', runtimeDataMode: config.dataMode || 'remote', ...config }) }));
vi.mock('./realtime.js', () => ({ tancaRealtime: vi.fn(async () => {}) }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { definixContrasenyaNova, demanaRecuperacioContrasenya, logout, recullTornadaOAuth } from './auth.js';
import { CODI_ENTRADA } from '../errorsBackend.js';
import { STORAGE_PREFIX } from '../../config/storage.js';
import {
  CLAU_ENLLAC_OBERT, ESTAT_ENLLAC, anunciaEnllacDeRecuperacio, estatEnllacDeRecuperacio, marcaRecuperacioPendent,
  oblidaEnllacDeRecuperacio, oblidaRecuperacioPendent, recuperacioPendentPer
} from '../recuperacioPendent.js';

const PAGINA ='https://gentdelatorre.net/una/pagina?x=1';
/* F1-seguiments (Onada 4, 261003) · La tornada de la recuperació porta la seua marca. */
const TORNADA_RECUPERACIO = `${PAGINA}&sdp_auth=recuperacio`;
const HASH ='a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c';   // 56 hex, com GoTrue
const SESSIO = Object.freeze({ access_token: 'jwt-recuperacio', refresh_token: 'rt-sintetic', user: { id: 'U-1', email: 'ana@poble.test' } });
const NOVA = 'contrasenya-nova-llarga';
const errorGoTrue = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${JSON.stringify(cos)}`), { status });
const urlDe = (crida) => new URL(crida[0], 'https://backend.example.test');
const arribaAmb = (ruta = `/una/pagina?x=1#token_hash=${HASH}&type=recovery`) => {
  window.history.replaceState(null, '', ruta);
  return recullTornadaOAuth({});
};
/* Les crides al transport, en ordre: «POST /auth/v1/verify», «PUT /auth/v1/user»… */
const crides = () => m.request.mock.calls.map(([ruta, , opcions]) => `${opcions?.method ?? 'GET'} ${ruta}`);
/* Correcció de la revisió de R2 · Com fetch (i runtime.request): una petició
   amb un senyal avortat abans que arribe la resposta es rebutja amb AbortError
   i la resposta es perd. Sense açò, el transport fals tornaria la resposta
   encara que la petició portara un senyal avortat, i cap prova no veuria si
   /verify o el PUT tornen a dependre de l'intent d'entrada. */
const comFetch = (opcions) => {
  if (opcions?.signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
};
/* Tot el que hi ha a les dues capes d'emmagatzematge del navegador, en un text. */
const emmagatzemat = () => [window.localStorage, window.sessionStorage]
  .flatMap((capa) => Object.keys(capa).map((clau) => `${clau}=${capa.getItem(clau)}`)).join('\n');
/* Escolta els avisos de sessió (sdp:auth-change) mentre corre `cos`. */
async function ambAvisos(cos) {
  const avisos = [];
  const escolta = (e) => avisos.push(e.detail?.user?.id ?? null);
  window.addEventListener('sdp:auth-change', escolta);
  try { await cos(avisos); } finally { window.removeEventListener('sdp:auth-change', escolta); }
  return avisos;
}

beforeEach(() => {
  m.request.mockReset();
  m.desa.mockReset().mockImplementation(() => true);
  m.user = null;
  /* La revocació de la sessió privada va directa a fetch: mai a la xarxa de veres. */
  m.fetch = vi.fn(async () => ({ ok: true, status: 204 }));
  vi.stubGlobal('fetch', m.fetch);
  oblidaRecuperacioPendent();
});
afterEach(() => {
  window.history.replaceState(null, '', '/una/pagina?x=1');
  oblidaRecuperacioPendent();
  vi.unstubAllGlobals();
});

test('premissa: la pàgina és la de l’amfitrió', () => {
  expect(window.location.href).toBe(PAGINA);
});

/* ── Anada ── */

test('demanar el correu: POST /auth/v1/recover amb redirect_to del mateix origen que la pàgina, amb la marca i mai socdepoble.org', async () => {
  m.request.mockResolvedValueOnce({});
  await expect(demanaRecuperacioContrasenya('  Ana@Poble.TEST ')).resolves.toEqual({ enviat: true });
  expect(m.request).toHaveBeenCalledTimes(1);
  const crida = m.request.mock.calls[0];
  const url = urlDe(crida);
  expect(url.pathname).toBe('/auth/v1/recover');
  /* F1-seguiments · Canvi: la tornada porta la marca sdp_auth=recuperacio (abans, PAGINA sola). */
  expect(url.searchParams.get('redirect_to')).toBe(TORNADA_RECUPERACIO);
  expect(new URL(url.searchParams.get('redirect_to')).origin).toBe(window.location.origin);
  expect(JSON.stringify(crida)).not.toMatch(/socdepoble/);
  /* Sense PKCE a posta (R.txt §3): cap verificador ni repte viatgen. */
  expect(crida[2]).toEqual({ method: 'POST', body: { email: 'ana@poble.test' } });
});

test('demanar el correu: la tornada no s’emporta restes d’una entrada anterior (una marca vella inclosa) ni el fragment', async () => {
  window.history.replaceState(null, '', '/una/pagina?x=1&code=vell&error_code=bad_oauth_state&sdp_auth=recuperacio#token_hash=vell&type=recovery');
  m.request.mockResolvedValueOnce({});
  await demanaRecuperacioContrasenya('ana@poble.test');
  /* F1-seguiments · Canvi: una sola marca, la nova (abans, PAGINA sola). */
  expect(urlDe(m.request.mock.calls[0]).searchParams.get('redirect_to')).toBe(TORNADA_RECUPERACIO);
});

/* Correcció de la revisió · Anti-enumeració. GoTrue respon 200 a un correu sense
   compte; a un compte que ja ha rebut un correu fa massa poc, o quan el projecte
   ha esgotat el límit de correus, 429 over_email_send_rate_limit. Les respostes
   han de ser iguals per a la interfície: si no, el «Massa intents» delataria que
   el compte existix. R2 (decisió 3 del Mestre): es manté, sempre el genèric. */
test('demanar el correu: el límit de correus (d’un compte o el global) respon igual que un correu sense compte', async () => {
  m.request
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(errorGoTrue(429, { code: 429, error_code: 'over_email_send_rate_limit', msg: 'For security purposes, you can only request this after 42 seconds.' }))
    .mockRejectedValueOnce(errorGoTrue(429, { code: 429, error_code: 'over_email_send_rate_limit', msg: 'Email rate limit exceeded' }));
  const senseCompte = await demanaRecuperacioContrasenya('no-existix@poble.test');
  const ambCompteJaAvisat = await demanaRecuperacioContrasenya('existix@poble.test');
  const limitGlobal = await demanaRecuperacioContrasenya('un-altre@poble.test');
  expect(senseCompte).toEqual({ enviat: true });
  expect(ambCompteJaAvisat).toEqual(senseCompte);
  expect(limitGlobal).toEqual(senseCompte);
  expect(m.request).toHaveBeenCalledTimes(3);
});

test.each([
  ['el límit de peticions d’esta connexió', errorGoTrue(429, { code: 429, error_code: 'over_request_rate_limit', msg: 'Request rate limit reached' }), CODI_ENTRADA.MASSA_INTENTS],
  ['un 429 d’un GoTrue sense error_code', errorGoTrue(429, { code: 429, msg: 'Too many requests' }), CODI_ENTRADA.MASSA_INTENTS],
  ['la xarxa caiguda', Object.assign(new TypeError('Failed to fetch'), { status: 0 }), CODI_ENTRADA.SERVIDOR_INABASTABLE],
  ['un 400 sense codi propi', errorGoTrue(400, { code: 400, msg: 'Unable to validate email address' }), CODI_ENTRADA.DESCONEGUT]
])('demanar el correu amb %s: CODI_ENTRADA, frase valenciana i mai el cos cru', async (_cas, error, code) => {
  m.request.mockRejectedValueOnce(error);
  const rebuig = await demanaRecuperacioContrasenya('ana@poble.test').catch((e) => e);
  expect(rebuig).toMatchObject({ code });
  expect(rebuig.message).not.toMatch(/Supabase|security purposes|Unable|\{/);
});

test('demanar el correu en mode de proves no envia res', async () => {
  await expect(demanaRecuperacioContrasenya('ana@poble.test', { dataMode: 'seed' })).rejects.toMatchObject({ code: CODI_ENTRADA.MODE_LOCAL });
  expect(m.request).not.toHaveBeenCalled();
});

/* ── Arribada: cap petició ── */

test('R2 · arribada amb #token_hash&type=recovery: URL neta, CAP petició, sense sessió i l’enllaç pendent', async () => {
  const avisos = await ambAvisos(async () => {
    const resultat = await arribaAmb();
    expect(resultat).toEqual({ recuperacio: true });
  });
  expect(window.location.href).toBe(PAGINA);
  expect(m.request).not.toHaveBeenCalled();
  expect(m.fetch).not.toHaveBeenCalled();
  expect(m.desa).not.toHaveBeenCalled();
  expect(avisos).toEqual([]);
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  /* El token només viu en la memòria del document: ni localStorage ni sessionStorage. */
  expect(emmagatzemat()).not.toContain(HASH);
});

/* El cas de Safe Links d'Outlook: l'escàner obri l'enllaç i EXECUTA la pàgina
   abans que la persona. Amb R2 no gasta res: el token només viatja amb «Desa». */
test('R2 · un escàner que carrega la pàgina no consumix el token: «Desa» verifica i definix, en este ordre', async () => {
  await arribaAmb();                                        // l'escàner
  expect(m.request).not.toHaveBeenCalled();
  const ordre = [];
  m.request.mockImplementation(async (ruta, _config, opcions) => {
    ordre.push(`${opcions.method} ${ruta}`);
    return ruta === '/auth/v1/verify' ? SESSIO : { id: 'U-1' };
  });
  m.desa.mockImplementation(() => { ordre.push('desa la sessió'); return true; });
  const avisos = await ambAvisos(async () => {
    await expect(definixContrasenyaNova(NOVA, {})).resolves.toBe(true);   // la persona
  });
  expect(ordre).toEqual(['POST /auth/v1/verify', 'PUT /auth/v1/user', 'desa la sessió']);
  const [, , verificacio] = m.request.mock.calls[0];
  expect(verificacio.body).toEqual({ type: 'recovery', token_hash: HASH });
  /* Correcció de la revisió de R2 · Sense el senyal de l'intent (una resposta
     avortada cremaria el token) i amb un topall generós (connexions lentes). */
  expect(verificacio.signal).toBeUndefined();
  expect(verificacio.timeoutMs).toBe(30000);
  const [, , canvi] = m.request.mock.calls[1];
  expect(canvi.headers).toEqual({ Authorization: `Bearer ${SESSIO.access_token}` });
  expect(canvi.body).toEqual({ password: NOVA });
  expect(canvi.signal).toBeUndefined();
  expect(canvi.timeoutMs).toBe(30000);
  expect(m.desa).toHaveBeenCalledWith(SESSIO);
  expect(avisos).toEqual(['U-1']);
  expect(estatEnllacDeRecuperacio()).toBeNull();
  expect(m.fetch).not.toHaveBeenCalled();                   // la sessió desada no es revoca
});

test('R2 · el token a la consulta també s’accepta, sense cap petició, i la resta de la consulta es queda', async () => {
  await expect(arribaAmb(`/una/pagina?x=1&token_hash=${HASH}&type=recovery`)).resolves.toEqual({ recuperacio: true });
  expect(window.location.href).toBe(PAGINA);
  expect(m.request).not.toHaveBeenCalled();
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
});

test('tornada implícita (#access_token…&type=recovery, plantilla per defecte): MAI s’adopta, es neteja i es diu', async () => {
  window.sessionStorage.setItem(STORAGE_PREFIX + CLAU_ENLLAC_OBERT, '{"v":1}');   // una arribada anterior
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const rebuig = await arribaAmb('/una/pagina?x=1#access_token=injectat&refresh_token=injectat&type=recovery').catch((e) => e);
    expect(rebuig).toMatchObject({ recuperacio: true });
    expect(rebuig.message).toMatch(/no es pot usar ací/);
  } finally { avis.mockRestore(); }
  expect(m.request).not.toHaveBeenCalled();
  expect(m.desa).not.toHaveBeenCalled();
  expect(window.location.href).toBe(PAGINA);
  /* Cap enllaç pendent ni perdut que tape l'avís. */
  expect(estatEnllacDeRecuperacio()).toBeNull();
});

test('sense tornada de recuperació, recullTornadaOAuth continua amb Google com sempre (res a la URL: null)', async () => {
  await expect(recullTornadaOAuth({})).resolves.toBeNull();
  expect(m.request).not.toHaveBeenCalled();
  expect(estatEnllacDeRecuperacio()).toBeNull();
});

/* F1v2 (261003, W4-02) · gestionaTornada ja només actua amb la seua marca. La
   recuperació va abans: ha de continuar funcionant igual, també en una pàgina
   amb consultes de l'amfitrió que diuen code, state o error.
   F1-seguiments · Esta tornada no porta la marca de la recuperació: és la d'un
   enllaç demanat abans que n'hi haguera. També ha de funcionar. */
test('F1v2 · la recuperació continua funcionant: el token es recull i la consulta de l’amfitrió es queda literal', async () => {
  const ruta = '/una/pagina?x=1&code=HOST-COUPON&state=HOST-STATE&filter=all';
  await expect(arribaAmb(`${ruta}#token_hash=${HASH}&type=recovery`)).resolves.toEqual({ recuperacio: true });
  expect(window.location.pathname + window.location.search + window.location.hash).toBe(ruta);
  expect(m.request).not.toHaveBeenCalled();
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  /* I «Desa» la completa com sempre. */
  m.request.mockImplementation(async (rutaPeticio) => (rutaPeticio === '/auth/v1/verify' ? SESSIO : { id: 'U-1' }));
  await expect(definixContrasenyaNova(NOVA, {})).resolves.toBe(true);
  expect(crides()).toEqual(['POST /auth/v1/verify', 'PUT /auth/v1/user']);
  expect(m.desa).toHaveBeenCalledWith(SESSIO);
});

test('F1v2 · sense recuperació ni marca, una pàgina amb ?code i ?error de l’amfitrió no es toca', async () => {
  for (const ruta of ['/una/pagina?x=1&code=HOST-COUPON&state=HOST-STATE', '/una/pagina?x=1&error=HOST-CHECKOUT-FAILED']) {
    window.history.replaceState({ amfitrio: true }, '', ruta);
    const abans = emmagatzemat();
    await expect(recullTornadaOAuth({}), ruta).resolves.toBeNull();
    expect(window.location.pathname + window.location.search).toBe(ruta);
    expect(window.history.state).toEqual({ amfitrio: true });
    expect(emmagatzemat()).toBe(abans);
  }
  expect(m.request).not.toHaveBeenCalled();
  expect(m.fetch).not.toHaveBeenCalled();
});

/* ── F1-seguiments (Onada 4, 261003) · La marca de la recuperació ──
   Amb la plantilla per defecte de GoTrue, un enllaç caducat o ja usat torna a
   redirect_to amb #error=access_denied&error_code=otp_expired&error_description=…
   F1v2 no deia res i l'error es quedava a la URL (sense marca, un error de
   l'amfitrió no es toca, W4-02). Amb la marca: l'avís en valencià, a l'entrada
   (recuperacio), i de la URL només se'n van la marca i els paràmetres d'error. */
const ERROR_GOTRUE = 'error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
const CADUCAT_EN_ARRIBAR = 'L’enllaç ha caducat o ja s’ha fet servir. Demana’n un altre.';

test('F1-seguiments · de punta a punta: l’enllaç caducat torna a la tornada demanada amb l’error; avís en valencià i la pàgina neta', async () => {
  m.request.mockResolvedValueOnce({});
  await demanaRecuperacioContrasenya('ana@poble.test');
  const { pathname, search } = new URL(urlDe(m.request.mock.calls[0]).searchParams.get('redirect_to'));
  window.history.replaceState({ usr: 'r' }, '', `${pathname}${search}#${ERROR_GOTRUE}`);
  const rebuig = await recullTornadaOAuth({}).catch((e) => e);
  expect(rebuig).toMatchObject({ recuperacio: true, code: CODI_ENTRADA.ENLLAC_CADUCAT });
  expect(rebuig.message).toBe(CADUCAT_EN_ARRIBAR);
  expect(window.location.href).toBe(PAGINA);
  expect(window.history.state).toEqual({ usr: 'r' });
  expect(m.request).toHaveBeenCalledTimes(1);   // només l'anada
  expect(estatEnllacDeRecuperacio()).toBeNull();
});

test.each([
  ['al fragment', '?x=1&code=HOST-COUPON&state=HOST-STATE&sdp_auth=recuperacio&filter=all', `#${ERROR_GOTRUE}`],
  ['a la consulta', `?x=1&code=HOST-COUPON&state=HOST-STATE&sdp_auth=recuperacio&${ERROR_GOTRUE}&filter=all`, '']
])('F1-seguiments · l’error de GoTrue %s amb la marca: ENLLAC_CADUCAT i fora NOMÉS la marca i els paràmetres d’error', async (_cas, consulta, fragment) => {
  window.sessionStorage.setItem(STORAGE_PREFIX + CLAU_ENLLAC_OBERT, '{"v":1}');   // una arribada anterior en esta pestanya
  window.history.replaceState({ amfitrio: true }, '', `/una/pagina${consulta}${fragment}`);
  const rebuig = await recullTornadaOAuth({}).catch((e) => e);
  expect(rebuig).toMatchObject({ recuperacio: true, code: CODI_ENTRADA.ENLLAC_CADUCAT, message: CADUCAT_EN_ARRIBAR });
  expect(window.location.pathname + window.location.search + window.location.hash).toBe('/una/pagina?x=1&code=HOST-COUPON&state=HOST-STATE&filter=all');
  expect(window.history.state).toEqual({ amfitrio: true });
  expect(m.request).not.toHaveBeenCalled();
  expect(m.fetch).not.toHaveBeenCalled();
  /* L'estat 'perdut' d'una arribada anterior no tapa l'avís. */
  expect(estatEnllacDeRecuperacio()).toBeNull();
});

test('F1-seguiments · la marca sola (sense token ni error) se’n va i no passa res més', async () => {
  window.history.replaceState(null, '', '/una/pagina?x=1&sdp_auth=recuperacio');
  await expect(recullTornadaOAuth({})).resolves.toBeNull();
  expect(window.location.href).toBe(PAGINA);
  expect(m.request).not.toHaveBeenCalled();
  expect(estatEnllacDeRecuperacio()).toBeNull();
});

/* La mecànica del token_hash (tornadaRecuperacio.js) no canvia: amb la marca a
   la consulta, el token es llig i es neteja igual, i després se'n va la marca. */
test.each([
  ['al fragment (la plantilla «Reset password»)', `/una/pagina?x=1&sdp_auth=recuperacio#token_hash=${HASH}&type=recovery`],
  ['a la consulta', `/una/pagina?x=1&sdp_auth=recuperacio&token_hash=${HASH}&type=recovery`]
])('F1-seguiments · el token_hash %s amb la marca: es recull sense cap petició, la URL queda neta i «Desa» el completa', async (_cas, ruta) => {
  await expect(arribaAmb(ruta)).resolves.toEqual({ recuperacio: true });
  expect(window.location.href).toBe(PAGINA);
  expect(m.request).not.toHaveBeenCalled();
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  expect(emmagatzemat()).not.toContain(HASH);
  m.request.mockImplementation(async (rutaPeticio) => (rutaPeticio === '/auth/v1/verify' ? SESSIO : { id: 'U-1' }));
  await expect(definixContrasenyaNova(NOVA, {})).resolves.toBe(true);
  expect(crides()).toEqual(['POST /auth/v1/verify', 'PUT /auth/v1/user']);
  expect(m.request.mock.calls[0][2].body).toEqual({ type: 'recovery', token_hash: HASH });
  expect(m.desa).toHaveBeenCalledWith(SESSIO);
});

/* ── «Desa» ── */

test.each([
  ['amb error_code', errorGoTrue(403, { code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' })],
  ['d’un GoTrue sense error_code', errorGoTrue(403, { code: 403, msg: 'Token has expired or is invalid' })]
])('R2 · «Desa» amb l’enllaç caducat o ja usat (%s): ENLLAC_CADUCAT, cap PUT ni sessió; el segon «Desa» no torna a la xarxa', async (_cas, error) => {
  await arribaAmb();
  m.request.mockRejectedValueOnce(error);
  const rebuig = await definixContrasenyaNova(NOVA, {}).catch((e) => e);
  expect(rebuig).toMatchObject({ code: CODI_ENTRADA.ENLLAC_CADUCAT });
  expect(rebuig.message).toMatch(/ja no val/);
  expect(rebuig.message).not.toMatch(/Token has expired|Supabase/);
  expect(crides()).toEqual(['POST /auth/v1/verify']);
  expect(m.desa).not.toHaveBeenCalled();
  /* L'estat es queda: la pantalla diu per què i oferix «Demana un enllaç nou». */
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  await expect(definixContrasenyaNova(NOVA, {})).rejects.toMatchObject({ code: CODI_ENTRADA.ENLLAC_CADUCAT });
  expect(m.request).toHaveBeenCalledTimes(1);
});

test('R2 · contrasenya rebutjada després de verificar: cap sessió, i el reintent no torna a verificar (el token ja s’ha gastat)', async () => {
  await arribaAmb();
  m.request
    .mockResolvedValueOnce(SESSIO)
    .mockRejectedValueOnce(errorGoTrue(422, { code: 422, error_code: 'same_password', msg: 'New password should be different' }))
    .mockResolvedValueOnce({ id: 'U-1' });
  const avisos = await ambAvisos(async () => {
    const rebuig = await definixContrasenyaNova(NOVA, {}).catch((e) => e);
    expect(rebuig).toMatchObject({ code: CODI_ENTRADA.MATEIXA_CONTRASENYA });
    expect(rebuig.message).not.toMatch(/New password|Supabase/);
    expect(m.desa).not.toHaveBeenCalled();
  });
  expect(avisos).toEqual([]);
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  await expect(definixContrasenyaNova('una-altra-de-nova', {})).resolves.toBe(true);
  expect(crides()).toEqual(['POST /auth/v1/verify', 'PUT /auth/v1/user', 'PUT /auth/v1/user']);
  expect(m.request.mock.calls[2][2].body).toEqual({ password: 'una-altra-de-nova' });
  expect(m.desa).toHaveBeenCalledTimes(1);
  expect(m.desa).toHaveBeenCalledWith(SESSIO);
});

test('R2 · la sessió privada caduca mentre es tria (401 al PUT): ENLLAC_CADUCAT i cap reintent per la xarxa', async () => {
  await arribaAmb();
  m.request
    .mockResolvedValueOnce(SESSIO)
    .mockRejectedValueOnce(errorGoTrue(401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' }));
  await expect(definixContrasenyaNova(NOVA, {})).rejects.toMatchObject({ code: CODI_ENTRADA.ENLLAC_CADUCAT });
  await expect(definixContrasenyaNova(NOVA, {})).rejects.toMatchObject({ code: CODI_ENTRADA.ENLLAC_CADUCAT });
  expect(crides()).toEqual(['POST /auth/v1/verify', 'PUT /auth/v1/user']);
  expect(m.desa).not.toHaveBeenCalled();
});

/* Una recuperació en curs sense el token (la pàgina s'ha recarregat, o el
   nucli diu 'pendent' i l'adaptador no el té): mai la sessió viva, que pot ser
   d'un altre compte. */
test.each([
  ['perdut (recàrrega)', () => window.sessionStorage.setItem(STORAGE_PREFIX + CLAU_ENLLAC_OBERT, '{"v":1}'), ESTAT_ENLLAC.PERDUT],
  ['pendent sense token a l’adaptador', () => anunciaEnllacDeRecuperacio(), ESTAT_ENLLAC.PENDENT]
])('R2 · «Desa» amb l’enllaç %s: ENLLAC_CADUCAT, cap petició i mai la sessió viva', async (_cas, prepara, estat) => {
  m.user = { id: 'UN-ALTRE-COMPTE' };
  prepara();
  expect(estatEnllacDeRecuperacio()).toBe(estat);
  await expect(definixContrasenyaNova(NOVA, {})).rejects.toMatchObject({ code: CODI_ENTRADA.ENLLAC_CADUCAT });
  expect(m.request).not.toHaveBeenCalled();
  expect(m.desa).not.toHaveBeenCalled();
});

test('R2 · deixar l’enllaç després de verificar revoca la sessió privada (millor esforç) i no en desa cap', async () => {
  await arribaAmb();
  m.request
    .mockResolvedValueOnce(SESSIO)
    .mockRejectedValueOnce(errorGoTrue(422, { code: 422, error_code: 'weak_password', msg: 'Password is too weak' }));
  await expect(definixContrasenyaNova(NOVA, {})).rejects.toMatchObject({ code: CODI_ENTRADA.CONTRASENYA_FEBLE });
  oblidaEnllacDeRecuperacio();                              // «Torna a entrar»
  expect(m.fetch).toHaveBeenCalledTimes(1);
  const [url, opcions] = m.fetch.mock.calls[0];
  expect(url).toBe('https://backend.example.test/auth/v1/logout?scope=local');
  expect(opcions).toMatchObject({ method: 'POST', headers: { Authorization: `Bearer ${SESSIO.access_token}` } });
  expect(m.desa).not.toHaveBeenCalled();
  /* Ja no hi ha recuperació en curs: «Desa» seria la de la sessió viva, i no n'hi ha. */
  await expect(definixContrasenyaNova(NOVA, {})).rejects.toThrow(/La sessió ha caducat/);
  expect(crides()).toEqual(['POST /auth/v1/verify', 'PUT /auth/v1/user']);
});

test('R2 · si el navegador no pot desar la sessió després del PUT: la contrasenya ja és la nova i ho diu', async () => {
  await arribaAmb();
  m.request.mockResolvedValueOnce(SESSIO).mockResolvedValueOnce({ id: 'U-1' });
  m.desa.mockImplementation(() => false);
  const avisos = await ambAvisos(async () => {
    await expect(definixContrasenyaNova(NOVA, {})).rejects.toThrow(/ja està desada.*no ha pogut obrir la sessió.*contrasenya nova/);
  });
  expect(avisos).toEqual([null]);
  expect(crides()).toEqual(['POST /auth/v1/verify', 'PUT /auth/v1/user']);
  /* Correcció de la revisió de R2 · La sessió privada no es farà servir: es
     revoca al servidor. */
  expect(m.fetch).toHaveBeenCalledTimes(1);
  const [url, opcions] = m.fetch.mock.calls[0];
  expect(url).toBe('https://backend.example.test/auth/v1/logout?scope=local');
  expect(opcions).toMatchObject({ method: 'POST', headers: { Authorization: `Bearer ${SESSIO.access_token}` } });
  /* Un altre «Desa» repetix el mateix avís, sense xarxa i mai «caducat». */
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  const reintent = await definixContrasenyaNova(NOVA, {}).catch((e) => e);
  expect(reintent.message).toMatch(/ja està desada.*no ha pogut obrir la sessió/);
  expect(reintent.code).toBeUndefined();
  expect(m.request).toHaveBeenCalledTimes(2);
  /* «Torna a entrar»: res més a revocar. */
  oblidaEnllacDeRecuperacio();
  expect(m.fetch).toHaveBeenCalledTimes(1);
});

/* Correcció de la revisió de R2 · El PUT ja no porta el senyal de l'intent: si
   la sessió d'abans d'esta pestanya cau mentre es desa, la resposta no es perd
   (abans, un AbortError en anglés i un reintent que rebia same_password). La
   contrasenya ja és la nova i ho diu; cap sessió es desa damunt. */
test('R2 · la sessió d’abans cau durant el PUT: la contrasenya ja és la nova, ho diu en valencià i no desa cap sessió', async () => {
  await arribaAmb();
  m.request.mockImplementation(async (ruta, _config, opcions) => {
    if (ruta === '/auth/v1/verify') return SESSIO;
    void logout({}, { abast: 'pestanya' });                 // la sessió d'abans cau pel camí
    comFetch(opcions);
    return { id: 'U-1' };
  });
  const avisos = await ambAvisos(async () => {
    const rebuig = await definixContrasenyaNova(NOVA, {}).catch((e) => e);
    expect(rebuig.name).not.toBe('AbortError');
    expect(rebuig.message).toMatch(/ja està desada.*ha canviat mentre es desava.*contrasenya nova/);
  });
  expect(avisos).toEqual([null]);                           // només el buidat de la pestanya
  expect(m.desa).not.toHaveBeenCalled();
  expect(crides()).toEqual(['POST /auth/v1/verify', 'PUT /auth/v1/user']);
  expect(m.fetch).toHaveBeenCalledTimes(1);                 // la privada es revoca
  expect(m.fetch.mock.calls[0][1]).toMatchObject({ headers: { Authorization: `Bearer ${SESSIO.access_token}` } });
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  /* El reintent no torna a la xarxa (ni same_password ni «caducat»). */
  await expect(definixContrasenyaNova(NOVA, {})).rejects.toThrow(/ja està desada.*ha canviat mentre es desava/);
  expect(m.request).toHaveBeenCalledTimes(2);
});

/* Correcció de la revisió de R2 · /verify respon sense sessió: el token s'ha
   gastat. La pantalla ha d'oferir «Demana un enllaç nou» (ENLLAC_CADUCAT). */
test('R2 · /verify respon sense sessió: ENLLAC_CADUCAT, cap PUT, i el segon «Desa» no torna a la xarxa', async () => {
  await arribaAmb();
  m.request.mockResolvedValueOnce({});
  const rebuig = await definixContrasenyaNova(NOVA, {}).catch((e) => e);
  expect(rebuig).toMatchObject({ code: CODI_ENTRADA.ENLLAC_CADUCAT });
  expect(rebuig.cause?.message).toMatch(/no ha confirmat l’enllaç/);
  expect(crides()).toEqual(['POST /auth/v1/verify']);
  expect(m.desa).not.toHaveBeenCalled();
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  await expect(definixContrasenyaNova(NOVA, {})).rejects.toMatchObject({ code: CODI_ENTRADA.ENLLAC_CADUCAT });
  expect(m.request).toHaveBeenCalledTimes(1);
});

/* Verificació de R2 · El token es gasta quan /verify arriba al servidor. Si la
   sessió d'abans d'esta pestanya caduca pel camí (la renovació fallida fa
   tanca({ abast: 'pestanya' }) i cancel·la tots els intents d'entrada), la
   resposta no es pot perdre: la sessió privada es guarda i el reintent no torna
   a verificar. El transport falseja un servidor de veres: el mateix token, la
   segona vegada, és otp_expired. */
test('R2 · la sessió d’abans caduca mentre es verifica: el token no es crema i el reintent no torna a verificar', async () => {
  await arribaAmb();
  let verificacions = 0;
  m.request.mockImplementation(async (ruta, _config, opcions) => {
    if (ruta !== '/auth/v1/verify') { comFetch(opcions); return { id: 'U-1' }; }
    verificacions += 1;
    if (verificacions > 1) throw errorGoTrue(403, { code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' });
    void logout({}, { abast: 'pestanya' });                 // la sessió d'abans cau pel camí
    /* El servidor ja ha gastat el token; si /verify portara el senyal de
       l'intent (ara avortat), fetch en perdria la resposta. */
    comFetch(opcions);
    return SESSIO;
  });
  const primer = await definixContrasenyaNova(NOVA, {}).catch((e) => e);
  expect(primer.message).toMatch(/ha canviat mentre es desava.*l’enllaç encara val/);
  expect(m.desa).not.toHaveBeenCalled();
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  await expect(definixContrasenyaNova(NOVA, {})).resolves.toBe(true);
  expect(crides()).toEqual(['POST /auth/v1/verify', 'PUT /auth/v1/user']);
  expect(m.desa).toHaveBeenCalledWith(SESSIO);
  expect(m.fetch).not.toHaveBeenCalled();                   // ni la sessió d'abans (pestanya) ni la nova es revoquen
});

/* Verificació de R2 · Sense doble enviament també al port: la interfície ja
   desactiva «Desa», però el token és d'un sol ús i viu ací. */
test('R2 · dos «Desa» alhora: una sola verificació, un sol PUT, una sola sessió i el mateix resultat', async () => {
  await arribaAmb();
  m.request.mockImplementation(async (ruta) => (ruta === '/auth/v1/verify' ? SESSIO : { id: 'U-1' }));
  const resultats = await Promise.all([definixContrasenyaNova(NOVA, {}), definixContrasenyaNova(NOVA, {})]);
  expect(resultats).toEqual([true, true]);
  expect(crides()).toEqual(['POST /auth/v1/verify', 'PUT /auth/v1/user']);
  expect(m.desa).toHaveBeenCalledTimes(1);
  expect(estatEnllacDeRecuperacio()).toBeNull();
});

/* Verificació de R2 · L'enllaç es deixa mentre «Desa» treballa (eixir, una
   altra entrada): cap sessió es desa i la privada no queda viva al servidor. */
test.each([
  ['es verifica', '/auth/v1/verify'],
  ['es definix la contrasenya', '/auth/v1/user']
])('R2 · l’enllaç es deixa mentre %s: cap sessió desada i la privada es revoca', async (_cas, rutaOnEsDeixa) => {
  await arribaAmb();
  m.request.mockImplementation(async (ruta) => {
    if (ruta === rutaOnEsDeixa) oblidaEnllacDeRecuperacio();
    return ruta === '/auth/v1/verify' ? SESSIO : { id: 'U-1' };
  });
  const avisos = await ambAvisos(async () => {
    await expect(definixContrasenyaNova(NOVA, {})).rejects.toMatchObject({ name: 'AbortError' });
  });
  expect(m.desa).not.toHaveBeenCalled();
  expect(avisos).toEqual([]);
  expect(m.fetch).toHaveBeenCalledTimes(1);
  const [url, opcions] = m.fetch.mock.calls[0];
  expect(url).toBe('https://backend.example.test/auth/v1/logout?scope=local');
  expect(opcions).toMatchObject({ method: 'POST', headers: { Authorization: `Bearer ${SESSIO.access_token}` } });
  expect(estatEnllacDeRecuperacio()).toBeNull();
});

test('eixir de veres oblida la recuperació en curs (la marca i l’enllaç); buidar només la pestanya, no', async () => {
  await arribaAmb();
  marcaRecuperacioPendent('U-1');
  await logout({}, { abast: 'pestanya' });
  expect(recuperacioPendentPer('U-1')).toBe(true);
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  await logout({});
  expect(recuperacioPendentPer('U-1')).toBe(false);
  expect(estatEnllacDeRecuperacio()).toBeNull();
  /* L'enllaç oblidat ja no es pot usar: «Desa» seria el de la sessió viva. */
  m.user = null;
  await expect(definixContrasenyaNova(NOVA, {})).rejects.toThrow(/La sessió ha caducat/);
  expect(m.request).not.toHaveBeenCalled();
});

/* ── Sense recuperació en curs: la sessió viva (compatibilitat) ── */

test('contrasenya nova sense recuperació en curs: PUT /auth/v1/user amb la sessió viva', async () => {
  m.user = { id: 'U-1' };
  m.request.mockResolvedValueOnce({ id: 'U-1' });
  await expect(definixContrasenyaNova(NOVA)).resolves.toBe(true);
  expect(m.request).toHaveBeenCalledWith('/auth/v1/user', {}, { method: 'PUT', body: { password: NOVA } });
});

test.each([
  ['same_password', CODI_ENTRADA.MATEIXA_CONTRASENYA],
  ['weak_password', CODI_ENTRADA.CONTRASENYA_FEBLE]
])('contrasenya nova rebutjada per GoTrue (%s): CODI_ENTRADA i mai el text en anglés', async (errorCode, code) => {
  m.user = { id: 'U-1' };
  m.request.mockRejectedValueOnce(errorGoTrue(422, { code: 422, error_code: errorCode, msg: 'New password should be different' }));
  const rebuig = await definixContrasenyaNova(NOVA).catch((e) => e);
  expect(rebuig).toMatchObject({ code });
  expect(rebuig.message).not.toMatch(/New password|Supabase/);
});

test('contrasenya nova sense sessió ni recuperació: no s’envia res i el missatge és clar', async () => {
  m.user = null;
  m.fetch.mockImplementation(async () => ({ ok: false, status: 401 }));
  await expect(definixContrasenyaNova(NOVA)).rejects.toThrow();
  expect(m.request).not.toHaveBeenCalled();
});
