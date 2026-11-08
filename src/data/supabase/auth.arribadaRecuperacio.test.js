/* P0-63 / IDEA-194 (punt 2; ordre del Mestre, 261108) · L'enllaç de
   recuperació obert en un navegador que ja té sessió.
   El cas real (àudio de la verificadora, 18:43:19): demana «Restablir la
   contrasenya» des de l'App mòbil; el correu porta <tornada>#token_hash=…&
   type=recovery i, en punxar-lo, s'obri Chrome, on ja hi ha la sessió de
   Google. Dos forats:
     · L'App nativa no té cap pàgina http(s) pública: a Android la pàgina és
       https://localhost/registre (capacitor.config.json, androidScheme), que
       GoTrue no admet a les Redirect URLs, i cau en silenci a la Site URL
       (https://socdepoble.org, sense camí); a iOS, capacitor://localhost, que
       urlDeTornada rebutja (cap correu). La tornada ha de ser l'entrada pública.
     · L'enllaç que cau a «/» (la Site URL, o qualsevol camí que redirigix en
       arrencar) perdia el fragment: <Navigate to="/xat" replace> (App.jsx)
       reescriu la URL en el primer pintat, i l'adaptador la llig després
       (recullTornadaOAuth espera host.quanLlest()). La persona acabava al Xat
       amb la sessió de Google i cap pantalla per a la contrasenya nova.
   Ací jsdom fa d'eixe navegador: el document ARRIBA amb el fragment (els mòduls
   s'avaluen amb la URL d'arribada), la redirecció la reescriu i, després,
   l'adaptador recull la tornada. Només es falsegen el transport, la revocació
   (fetch) i l'escriptura de la sessió, com a auth.recuperacio.test.js. */
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

const HASH = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c';   // 56 hex, com GoTrue
const SESSIO = Object.freeze({ access_token: 'jwt-recuperacio', refresh_token: 'rt-sintetic', user: { id: 'U-1', email: 'ana@poble.test' } });
const GOOGLE = Object.freeze({ id: 'U-1', email: 'ana@poble.test' });   // la sessió que ja hi havia a Chrome
const NOVA = 'contrasenya-nova-llarga';
const errorGoTrue = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${JSON.stringify(cos)}`), { status });
const crides = () => m.request.mock.calls.map(([ruta, , opcions]) => `${opcions?.method ?? 'GET'} ${ruta}`);
const emmagatzemat = () => [window.localStorage, window.sessionStorage]
  .flatMap((capa) => Object.keys(capa).map((clau) => `${clau}=${capa.getItem(clau)}`)).join('\n');

/* Un document nou que arriba a `url`: els mòduls s'avaluen de nou amb eixa URL
   a la barra d'adreces, com en obrir l'enllaç del correu. */
async function arribaA(url) {
  window.history.replaceState(null, '', url);
  vi.resetModules();
  return {
    auth: await import('./auth.js'),
    pendent: await import('../recuperacioPendent.js'),
    errors: await import('../errorsBackend.js')
  };
}
/* La redirecció del primer pintat (<Navigate replace>): camí nou, sense fragment. */
const redirigixA = (cami) => window.history.replaceState(null, '', cami);

beforeEach(() => {
  m.request.mockReset();
  m.desa.mockReset().mockImplementation(() => true);
  m.user = null;
  m.fetch = vi.fn(async () => ({ ok: true, status: 204 }));
  vi.stubGlobal('fetch', m.fetch);
  window.localStorage.clear();
  window.sessionStorage.clear();
});
afterEach(() => {
  delete window.Capacitor;
  window.history.replaceState(null, '', '/');
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
});

/* ── (b) L'arribada que una redirecció reescriu ── */

test.each([
  ['amb la sessió de Google activa', GOOGLE],
  ['sense sessió', null]
])('P0-63 · l’enllaç cau a «/» (Site URL) %s: la redirecció a /xat lleva el fragment i el token es recull igual, sense cap petició', async (_cas, usuari) => {
  m.user = usuari;
  const { auth, pendent } = await arribaA(`/#token_hash=${HASH}&type=recovery`);
  redirigixA('/xat');
  await expect(auth.recullTornadaOAuth({})).resolves.toEqual({ recuperacio: true });
  expect(pendent.estatEnllacDeRecuperacio()).toBe(pendent.ESTAT_ENLLAC.PENDENT);
  /* R2 intacte: en arribar no es verifica res, ni es desa cap sessió, ni el token va a cap emmagatzematge. */
  expect(m.request).not.toHaveBeenCalled();
  expect(m.desa).not.toHaveBeenCalled();
  expect(emmagatzemat()).not.toContain(HASH);
  expect(window.location.pathname + window.location.search + window.location.hash).toBe('/xat');
  /* «Desa» verifica eixe token i definix la contrasenya; la sessió nova, només després. */
  m.request.mockImplementation(async (ruta) => (ruta === '/auth/v1/verify' ? SESSIO : { id: 'U-1' }));
  await expect(auth.definixContrasenyaNova(NOVA, {})).resolves.toBe(true);
  expect(crides()).toEqual(['POST /auth/v1/verify', 'PUT /auth/v1/user']);
  expect(m.request.mock.calls[0][2].body).toEqual({ type: 'recovery', token_hash: HASH });
  expect(m.request.mock.calls[1][2].headers).toEqual({ Authorization: `Bearer ${SESSIO.access_token}` });
  expect(m.desa).toHaveBeenCalledWith(SESSIO);
  expect(pendent.estatEnllacDeRecuperacio()).toBeNull();
});

test('P0-63 · amb sessió, la tornada bona (/registre) que la redirecció de la sessió canvia al perfil abans de l’adaptador: el token es recull igual', async () => {
  m.user = GOOGLE;
  const { auth, pendent } = await arribaA(`/registre?sdp_auth=recuperacio#token_hash=${HASH}&type=recovery`);
  redirigixA('/el-meu-perfil');                       // OnboardingSection, amb currentUser
  await expect(auth.recullTornadaOAuth({})).resolves.toEqual({ recuperacio: true });
  expect(pendent.estatEnllacDeRecuperacio()).toBe(pendent.ESTAT_ENLLAC.PENDENT);
  expect(m.request).not.toHaveBeenCalled();
});

test('P0-63 · l’adreça d’arribada és d’un sol ús: una segona recollida ja no troba cap token', async () => {
  const { auth, pendent } = await arribaA(`/#token_hash=${HASH}&type=recovery`);
  redirigixA('/xat');
  await expect(auth.recullTornadaOAuth({})).resolves.toEqual({ recuperacio: true });
  pendent.oblidaRecuperacioPendent();
  await expect(auth.recullTornadaOAuth({})).resolves.toBeNull();
  expect(pendent.estatEnllacDeRecuperacio()).toBeNull();
  expect(m.request).not.toHaveBeenCalled();
});

test('P0-63 · si la barra d’adreces encara porta el token, mana el de la barra i es neteja com sempre', async () => {
  const { auth } = await arribaA(`/registre?sdp_auth=recuperacio#token_hash=${HASH}&type=recovery`);
  await expect(auth.recullTornadaOAuth({})).resolves.toEqual({ recuperacio: true });
  expect(window.location.pathname + window.location.search + window.location.hash).toBe('/registre');
});

test('P0-63 · un document que arriba sense tornada de recuperació no guarda res: Google i la resta, com sempre', async () => {
  const { auth, pendent } = await arribaA('/xat?x=1#seccio');
  await expect(auth.recullTornadaOAuth({})).resolves.toBeNull();
  expect(pendent.estatEnllacDeRecuperacio()).toBeNull();
  expect(window.location.pathname + window.location.search + window.location.hash).toBe('/xat?x=1#seccio');
});

test('P0-63 · token caducat amb la sessió de Google activa: «Desa» diu ENLLAC_CADUCAT, no desa res i la sessió d’abans no es toca', async () => {
  m.user = GOOGLE;
  const { auth, pendent, errors } = await arribaA(`/#token_hash=${HASH}&type=recovery`);
  redirigixA('/xat');
  await auth.recullTornadaOAuth({});
  m.request.mockRejectedValueOnce(errorGoTrue(403, { code: 403, error_code: 'otp_expired', msg: 'Email link is invalid or has expired' }));
  const rebuig = await auth.definixContrasenyaNova(NOVA, {}).catch((e) => e);
  expect(rebuig).toMatchObject({ code: errors.CODI_ENTRADA.ENLLAC_CADUCAT });
  expect(crides()).toEqual(['POST /auth/v1/verify']);
  expect(m.desa).not.toHaveBeenCalled();
  expect(m.fetch).not.toHaveBeenCalled();             // cap revocació: la sessió de Google continua
  /* L'estat es queda perquè la pantalla diga per què; un altre «Desa» no torna a la xarxa ni usa la sessió viva. */
  expect(pendent.estatEnllacDeRecuperacio()).toBe(pendent.ESTAT_ENLLAC.PENDENT);
  await expect(auth.definixContrasenyaNova(NOVA, {})).rejects.toMatchObject({ code: errors.CODI_ENTRADA.ENLLAC_CADUCAT });
  expect(crides()).toEqual(['POST /auth/v1/verify']);
});

/* ── (a) La tornada que es demana des de l'App nativa ── */

test('P0-63 · des de l’App nativa (Android, https://localhost), el correu torna a l’entrada pública, mai a localhost', async () => {
  window.Capacitor = { isNativePlatform: () => true };
  const { auth } = await arribaA('/registre?mode=entrar');
  m.request.mockResolvedValueOnce({});
  await expect(auth.demanaRecuperacioContrasenya('ana@poble.test')).resolves.toEqual({ enviat: true });
  const url = new URL(m.request.mock.calls[0][0], 'https://backend.example.test');
  expect(url.pathname).toBe('/auth/v1/recover');
  expect(url.searchParams.get('redirect_to')).toBe('https://socdepoble.org/registre?sdp_auth=recuperacio');
});

test('P0-63 · a la web, la tornada continua sent la pàgina on s’ha demanat (cap canvi)', async () => {
  const { auth } = await arribaA('/registre?mode=entrar');
  m.request.mockResolvedValueOnce({});
  await auth.demanaRecuperacioContrasenya('ana@poble.test');
  const url = new URL(m.request.mock.calls[0][0], 'https://backend.example.test');
  expect(url.searchParams.get('redirect_to')).toBe(`${window.location.origin}/registre?mode=entrar&sdp_auth=recuperacio`);
});
