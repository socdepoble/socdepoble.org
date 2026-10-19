/* Pla 261018_1605 (Tasques 0, 1 i 3; D1, D6 i D7; ordre del Mestre, 18-10-2026)
   · La fitxa de reserva de getProfile (pública, 'private' de visibility i la
   foto pròpia primer), la hidratació de la persona pilot i el pas de millor
   esforç que torna a escriure la foto pròpia a GoTrue després d'un retorn
   OAuth (reafirmaAvatarPropi): una sola lectura de la fila, un PUT només si
   cal, cap RPC més i mai cap error cap amunt. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, sessioCanviada: false, request: vi.fn(), changed: vi.fn(), rpc: vi.fn(async () => null) }));
vi.mock('../../config/storage.js', () => ({ getEfimer: () => null }));
vi.mock('../recuperacioPendent.js', () => ({
  ESTAT_ENLLAC: Object.freeze({ PENDENT: 'pendent', PERDUT: 'perdut' }),
  marcaRecuperacioPendent: vi.fn(), oblidaRecuperacioPendent: vi.fn(),
  anunciaEnllacDeRecuperacio: vi.fn(), oblidaEnllacDeRecuperacio: vi.fn(),
  estatEnllacDeRecuperacio: () => null, escoltaRecuperacioPendent: () => () => {}
}));
vi.mock('../identitat.js', () => ({
  configuraBackendSessio: vi.fn(), esBackendDeSessio: () => true, jwtPerBackend: () => null,
  CLAU_REFRESC: 'refresh', CLAU_JWT: 'jwt', CLAU_ORIGEN: 'origen', versioSessio: 0,
  triaRefresc: () => null, rotaRegistre: vi.fn(), oblidaRegistre: vi.fn(), desaSessio: () => true,
  /* La guarda de sessió de veres llança si la sessió ha canviat: ací, quan la prova ho diu. */
  capturaSessio: () => () => { if (m.sessioCanviada) throw new DOMException('La sessió ha canviat.', 'AbortError'); },
  esborraSessio: vi.fn(), usuariDeSessio: () => m.user, actualitzaUsuariSessio: m.changed,
  caducitatJwt: () => null, MARGE_RENOVACIO_MS: 60_000
}));
vi.mock('../oauthRelay.js', () => ({
  entraAmbGoogle: vi.fn(), gestionaTornada: vi.fn(), exigeixSenseMarcAlie: vi.fn(),
  urlDeTornadaAlta: vi.fn(() => 'https://amfitrio.example.test/pagina?sdp_auth=alta'),
  urlDeTornadaRecuperacio: vi.fn(() => 'https://amfitrio.example.test/pagina?sdp_auth=recuperacio'),
  recullMarcaDeRecuperacio: vi.fn(() => null)
}));
vi.mock('./runtime.js', () => ({
  configuraRefrescSessio: vi.fn(), getCurrentUser: () => m.user,
  getResolvedConfig: (config) => ({ supabaseUrl: 'https://example.test', supabaseAnonKey: 'public', runtimeDataMode: config.dataMode || 'remote', ...config }),
  request: m.request, rpc: m.rpc
}));
vi.mock('./realtime.js', () => ({ tancaRealtime: vi.fn(async () => {}) }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { getProfile, loginWithGoogle, recullTornadaOAuth } from './auth.js';
import { entraAmbGoogle, gestionaTornada } from '../oauthRelay.js';
import { CORREU_PERSONA_PILOT, PERSONA_PILOT } from '../identitatsSeed.js';

const GOOGLE = 'https://lh3.googleusercontent.com/a/foto-google';
const PROPIA = 'sdp-media://mitjans/poble/A/avatars/propia.webp';
const SESSIO = Object.freeze({ access_token: 'synthetic', user: { id: 'A' } });
const LECTURA = '/rest/v1/profiles?id=eq.A&select=avatar_url';
const crides = () => m.request.mock.calls.map(([ruta, , opcions]) => ({ ruta, metode: opcions?.method || 'GET', cos: opcions?.body }));
/* El pas no s'espera: es deixa acabar el que ja ha començat. */
const deixaAcabar = () => new Promise((resolve) => { setTimeout(resolve, 0); });

beforeEach(() => {
  m.request.mockReset(); m.changed.mockReset(); m.rpc.mockReset(); m.rpc.mockResolvedValue(null);
  m.sessioCanviada = false;
  m.user = { id: 'A', user_metadata: { avatar_url: GOOGLE, picture: GOOGLE } };
  gestionaTornada.mockReset(); entraAmbGoogle.mockReset();
});
afterEach(() => { m.user = { id: 'A' }; });

/* ───────── getProfile · la fila de reserva ───────── */

const fallaLaLectura = () => m.request.mockRejectedValueOnce(Object.assign(new Error('La petició ha trigat massa temps.'), { name: 'TimeoutError' }));

test('reserva: pública per defecte, sempre «private» de visibility i la foto pròpia primer', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  m.user = { id: 'A', avatar_url: PROPIA, user_metadata: { full_name: 'Pep', avatar_url: GOOGLE, visibility: 'public', town_name: 'Tibi' } };
  fallaLaLectura();
  expect(await getProfile()).toEqual({
    reserva: true, id: 'A', full_name: 'Pep', avatar_url: PROPIA, visibility: 'private', is_public: true, town_name: 'Tibi'
  });
  /* La pròpia guanya encara que vaja segona. */
  m.user = { id: 'A', avatar_url: GOOGLE, user_metadata: { avatar_url: PROPIA } };
  fallaLaLectura();
  expect((await getProfile()).avatar_url).toBe(PROPIA);
  /* Cap pròpia: la primera que hi haja, la de la sessió abans que la de les metadades. */
  m.user = { id: 'A', avatar_url: 'https://avatars.githubusercontent.com/u/1', user_metadata: { avatar_url: GOOGLE } };
  fallaLaLectura();
  expect((await getProfile()).avatar_url).toBe('https://avatars.githubusercontent.com/u/1');
  m.user = { id: 'A', user_metadata: { avatar_url: GOOGLE } };
  fallaLaLectura();
  expect((await getProfile()).avatar_url).toBe(GOOGLE);
  m.user = { id: 'A' };
  fallaLaLectura();
  expect(await getProfile()).toMatchObject({ avatar_url: '', visibility: 'private', is_public: true, town_name: '' });
  vi.restoreAllMocks();
});

test('reserva: is_public el de la sessió si en diu; si no, pública', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  m.user = { id: 'A', user_metadata: { is_public: false } };
  fallaLaLectura();
  expect((await getProfile()).is_public).toBe(false);
  m.user = { id: 'A', user_metadata: { is_public: null } };
  fallaLaLectura();
  expect((await getProfile()).is_public).toBe(true);
  vi.restoreAllMocks();
});

test('reserva de la persona pilot: hidratada, amb la foto canònica en lloc de la de Google i sense tocar la visibility', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  m.user = { id: 'A', email: CORREU_PERSONA_PILOT, email_confirmed_at: '2026-10-01T00:00:00Z', user_metadata: { avatar_url: GOOGLE } };
  fallaLaLectura();
  expect(await getProfile()).toEqual({
    reserva: true, id: 'A', full_name: PERSONA_PILOT.nom, avatar_url: PERSONA_PILOT.avatar, visibility: 'private',
    is_public: true, town_name: PERSONA_PILOT.poble, bio: PERSONA_PILOT.bio, lema: PERSONA_PILOT.lema
  });
  vi.restoreAllMocks();
});

test('la fila de veres: la de la persona pilot s’hidrata (només buits); qualsevol altra, la mateixa', async () => {
  const fila = { id: 'A', full_name: 'Pep', lema: 'Del Mas' };
  m.request.mockResolvedValueOnce([fila]);
  expect(await getProfile()).toBe(fila);
  m.user = { id: 'A', email: CORREU_PERSONA_PILOT, email_confirmed_at: '2026-10-01T00:00:00Z', user_metadata: {} };
  m.request.mockResolvedValueOnce([{ id: 'A', full_name: 'Javi', avatar_url: GOOGLE, bio: '', lema: 'Del Mas', is_public: false }]);
  expect(await getProfile()).toEqual({
    id: 'A', full_name: 'Javi', avatar_url: PERSONA_PILOT.avatar, town_name: PERSONA_PILOT.poble, bio: PERSONA_PILOT.bio,
    lema: 'Del Mas', is_public: false
  });
});

/* ───────── reafirmaAvatarPropi · després d'un retorn OAuth ───────── */

test('tornada OAuth: la fila té una foto pròpia que no és la de les metadades → PUT de només avatar_url i la sessió al dia', async () => {
  gestionaTornada.mockResolvedValueOnce(SESSIO);
  m.request.mockImplementation(async (ruta) => (ruta === LECTURA ? [{ avatar_url: ` ${PROPIA} ` }] : { id: 'A' }));
  expect(await recullTornadaOAuth({ tenantId: '00000000-0000-4000-8000-000000000000' })).toBe(SESSIO);
  await vi.waitFor(() => expect(m.changed).toHaveBeenCalledTimes(1));
  expect(m.changed).toHaveBeenCalledWith({ avatar_url: PROPIA });
  expect(crides()).toEqual([
    { ruta: LECTURA, metode: 'GET', cos: undefined },
    { ruta: '/auth/v1/user', metode: 'PUT', cos: { data: { avatar_url: PROPIA } } }
  ]);
  /* Cap RPC més que la de l'alta, i cap per la xarxa de request. */
  expect(m.rpc).toHaveBeenCalledTimes(1);
  expect(m.rpc.mock.calls[0][0]).toBe('completa_la_meua_alta');
  expect(crides().some((c) => c.ruta.includes('/rpc/'))).toBe(false);
});

test('finestra emergent de Google: el mateix pas', async () => {
  entraAmbGoogle.mockResolvedValueOnce(SESSIO);
  m.request.mockImplementation(async (ruta) => (ruta === LECTURA ? [{ avatar_url: '/assets/fotos/propia.jpg' }] : { id: 'A' }));
  expect(await loginWithGoogle({})).toBe(SESSIO);
  await vi.waitFor(() => expect(m.changed).toHaveBeenCalledWith({ avatar_url: '/assets/fotos/propia.jpg' }));
  expect(crides()[1]).toEqual({ ruta: '/auth/v1/user', metode: 'PUT', cos: { data: { avatar_url: '/assets/fotos/propia.jpg' } } });
  expect(m.rpc).toHaveBeenCalledTimes(1);
});

test('si la foto de les metadades ja és la pròpia de la fila, cap PUT', async () => {
  m.user = { id: 'A', user_metadata: { avatar_url: PROPIA, picture: GOOGLE } };
  gestionaTornada.mockResolvedValueOnce(SESSIO);
  m.request.mockResolvedValueOnce([{ avatar_url: PROPIA }]);
  await recullTornadaOAuth({});
  await vi.waitFor(() => expect(m.request).toHaveBeenCalledTimes(1));
  await deixaAcabar();
  expect(crides()).toEqual([{ ruta: LECTURA, metode: 'GET', cos: undefined }]);
  expect(m.changed).not.toHaveBeenCalled();
});

test.each([
  ['la de Google', [{ avatar_url: GOOGLE }]],
  ['una de fora', [{ avatar_url: 'https://atacant.example/foto.png' }]],
  ['cap (buida)', [{ avatar_url: '' }]],
  ['cap (null)', [{ avatar_url: null }]],
  ['sense fila', []],
  ['una resposta sense forma', { avatar_url: PROPIA }],
  ['res (undefined)', undefined]
])('si la fila porta %s, cap PUT ni cap canvi de sessió', async (_nom, resposta) => {
  gestionaTornada.mockResolvedValueOnce(SESSIO);
  m.request.mockResolvedValueOnce(resposta);
  expect(await recullTornadaOAuth({})).toBe(SESSIO);
  await vi.waitFor(() => expect(m.request).toHaveBeenCalledTimes(1));
  await deixaAcabar();
  expect(m.request).toHaveBeenCalledTimes(1);
  expect(m.changed).not.toHaveBeenCalled();
});

test('mai llança: ni si falla la lectura, ni si falla el PUT, ni si request no torna res', async () => {
  gestionaTornada.mockResolvedValueOnce(SESSIO);
  m.request.mockRejectedValueOnce(Object.assign(new Error('Supabase 500'), { status: 500 }));
  expect(await recullTornadaOAuth({})).toBe(SESSIO);
  await deixaAcabar();
  expect(m.changed).not.toHaveBeenCalled();

  gestionaTornada.mockResolvedValueOnce(SESSIO);
  m.request.mockReset();
  m.request.mockResolvedValueOnce([{ avatar_url: PROPIA }]).mockRejectedValueOnce(Object.assign(new Error('Supabase 401'), { status: 401 }));
  expect(await recullTornadaOAuth({})).toBe(SESSIO);
  await vi.waitFor(() => expect(m.request).toHaveBeenCalledTimes(2));
  await deixaAcabar();
  expect(m.changed).not.toHaveBeenCalled();

  /* Un request que llança abans de cap promesa. */
  gestionaTornada.mockResolvedValueOnce(SESSIO);
  m.request.mockReset();
  m.request.mockImplementationOnce(() => { throw new Error('Falten VITE_SUPABASE_URL i/o VITE_SUPABASE_ANON_KEY.'); });
  expect(await recullTornadaOAuth({})).toBe(SESSIO);
  await deixaAcabar();
  expect(m.changed).not.toHaveBeenCalled();

  /* El PUT confirma però la sessió no es pot desar: tampoc puja cap error. */
  gestionaTornada.mockResolvedValueOnce(SESSIO);
  m.request.mockReset();
  m.request.mockImplementation(async (ruta) => (ruta === LECTURA ? [{ avatar_url: PROPIA }] : { id: 'A' }));
  m.changed.mockImplementationOnce(() => { throw new Error('No s’ha pogut desar la sessió. Torna a entrar.'); });
  expect(await recullTornadaOAuth({})).toBe(SESSIO);
  await vi.waitFor(() => expect(m.changed).toHaveBeenCalledTimes(1));
});

test('si la sessió canvia mentre es llig la fila, ni PUT ni canvi de sessió', async () => {
  gestionaTornada.mockResolvedValueOnce(SESSIO);
  m.request.mockImplementationOnce(async () => { m.sessioCanviada = true; return [{ avatar_url: PROPIA }]; });
  await recullTornadaOAuth({});
  await vi.waitFor(() => expect(m.request).toHaveBeenCalledTimes(1));
  await deixaAcabar();
  expect(m.request).toHaveBeenCalledTimes(1);
  expect(m.changed).not.toHaveBeenCalled();

  /* Un altre compte a la sessió quan torna la lectura: tampoc. */
  m.sessioCanviada = false;
  m.request.mockReset();
  gestionaTornada.mockResolvedValueOnce(SESSIO);
  m.request.mockImplementationOnce(async () => { m.user = { id: 'B', user_metadata: {} }; return [{ avatar_url: PROPIA }]; });
  await recullTornadaOAuth({});
  await vi.waitFor(() => expect(m.request).toHaveBeenCalledTimes(1));
  await deixaAcabar();
  expect(m.request).toHaveBeenCalledTimes(1);
  expect(m.changed).not.toHaveBeenCalled();
});

test('si la sessió canvia durant el PUT, la sessió nova no es toca', async () => {
  gestionaTornada.mockResolvedValueOnce(SESSIO);
  m.request.mockImplementation(async (ruta) => {
    if (ruta === LECTURA) return [{ avatar_url: PROPIA }];
    m.sessioCanviada = true;
    return { id: 'A' };
  });
  await recullTornadaOAuth({});
  await vi.waitFor(() => expect(m.request).toHaveBeenCalledTimes(2));
  await deixaAcabar();
  expect(m.changed).not.toHaveBeenCalled();
});

test('sense sessió (cap codi a la tornada) no es llig res', async () => {
  gestionaTornada.mockResolvedValueOnce(null);
  expect(await recullTornadaOAuth({})).toBeNull();
  await deixaAcabar();
  expect(m.request).not.toHaveBeenCalled();
  expect(m.rpc).not.toHaveBeenCalled();
});
