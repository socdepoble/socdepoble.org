// @vitest-environment-options {"url": "https://poble.exemple.test/el-meu-perfil?vista=1"}
/* P6 (Onada 3 · integració, laboratori FASE0_PWA §8) · Entrada amb Google
   dins de l'app instal·lada. A la pantalla d'inici d'iOS, window.open obri un
   full de Safari a banda, sense opener ni el mateix emmagatzematge: ni el
   postMessage ni l'esdeveniment storage hi arriben, i l'entrada es penjava
   fins al temporitzador. Instal·lada, l'entrada no obri cap emergent i fa
   directament la redirecció completa (camí 3), amb el verificador a la mateixa
   pestanya. jsdom no navega: la redirecció s'observa a _intern.redirigeix.
   Dades sintètiques; NO VERIFICAT en dispositiu (FASE0_PWA §6.11). */
import { afterEach, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { getEfimer, getVal } from '../config/storage.js';
import { backendScope } from '../config/backendConfig.js';
import { esborraSessio, usuariDeSessio } from './identitat.js';
import { cancelAuthAttempts } from './authAttempt.js';
import { _intern, entraAmbGoogle, esAppInstallada, gestionaTornada } from './oauthRelay.js';

const PAGINA = 'https://poble.exemple.test/el-meu-perfil?vista=1';
const config = () => ({ hasSupabaseConfig: true, supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'public' });
const sessioBona = () => ({ ok: true, json: async () => ({ access_token: 'synthetic', user: { id: 'A' } }) });
const vesA = (ruta) => window.history.replaceState(null, '', ruta);
const unTorn = () => new Promise((resol) => { setTimeout(resol, 0); });
/* Un matchMedia que només casa amb les consultes donades. */
const ambMedia = (...casen) => vi.fn((consulta) => ({ matches: casen.includes(consulta), media: consulta }));
/* L'URL d'autorització que ha rebut la redirecció completa. */
const urlRedirigida = (espia) => espia.mock.calls[0][0];

afterEach(() => {
  cancelAuthAttempts(); esborraSessio(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  delete window.navigator.standalone;
  window.sessionStorage.clear();   // també el comptador del Circuit Breaker
  window.localStorage.clear();
  vesA('/el-meu-perfil?vista=1');
});

test('esAppInstallada: el display-mode standalone o el navigator.standalone d’iOS; res més', () => {
  expect(esAppInstallada({ matchMedia: ambMedia('(display-mode: standalone)') })).toBe(true);
  expect(esAppInstallada({ matchMedia: ambMedia(), navigator: { standalone: true } })).toBe(true);
  // Al navegador: ni una cosa ni l'altra.
  expect(esAppInstallada({ matchMedia: ambMedia('(display-mode: browser)'), navigator: { standalone: false } })).toBe(false);
  expect(esAppInstallada({ navigator: {} })).toBe(false);
  // Un matchMedia que llança no tomba l'entrada: mana navigator.standalone.
  expect(esAppInstallada({ matchMedia: () => { throw new Error('x'); }, navigator: { standalone: true } })).toBe(true);
  expect(esAppInstallada({ matchMedia: () => { throw new Error('x'); } })).toBe(false);
  expect(esAppInstallada(null)).toBe(false);
  // jsdom (el navegador de les proves) no és cap app instal·lada.
  expect(esAppInstallada()).toBe(false);
});

test('instal·lada (display-mode standalone): cap emergent, redirecció completa amb PKCE i la tornada a la mateixa pàgina', async () => {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('matchMedia', ambMedia('(display-mode: standalone)'));
  const obri = vi.spyOn(window, 'open');
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  let resolta = false;
  entraAmbGoogle({}, config).then(() => { resolta = true; }, () => { resolta = true; });
  await vi.waitFor(() => expect(redirigeix).toHaveBeenCalledTimes(1));
  expect(obri).not.toHaveBeenCalled();
  const url = new URL(redirigeix.mock.calls[0][0]);
  expect(url.origin + url.pathname).toBe('https://backend.example.test/auth/v1/authorize');
  expect(url.searchParams.get('provider')).toBe('google');
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.get('code_challenge')).toBeTruthy();
  /* F1v2 · Canvi: la tornada porta la marca d'este intent (abans, PAGINA sola), i
     el registre del seu id diu que tornarà per redirecció. */
  const id = getEfimer(_intern.CLAU_INTENT, null);
  expect(id).toMatch(_intern.FORMA_INTENT);
  expect(url.searchParams.get('redirect_to')).toBe(`${PAGINA}&sdp_oauth_attempt=${id}`);
  expect(getVal(_intern.clauEspera(id), null)).toEqual({ t: expect.any(Number), cami: 'redireccio' });
  // El verificador i l'abast queden a la pestanya que se'n va i hi tornarà.
  expect(getEfimer(_intern.CLAU_VERIFICADOR, null)).toBeTruthy();
  expect(getEfimer('sdp:oauth:backend', null)).toBe(backendScope(config()));
  // Ja naveguem: la promesa no es resol mai.
  await unTorn();
  expect(resolta).toBe(false);
});

test('instal·lada a iOS (navigator.standalone): el mateix camí, i de tornada es bescanvia amb el verificador de la pestanya', async () => {
  vi.stubGlobal('crypto', webcrypto);
  Object.defineProperty(window.navigator, 'standalone', { value: true, configurable: true });
  const obri = vi.spyOn(window, 'open');
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  entraAmbGoogle({}, config);
  await vi.waitFor(() => expect(redirigeix).toHaveBeenCalledTimes(1));
  expect(obri).not.toHaveBeenCalled();
  const verificador = getEfimer(_intern.CLAU_VERIFICADOR, null);
  const tornada = new URL(urlRedirigida(redirigeix)).searchParams.get('redirect_to');
  cancelAuthAttempts();
  /* GoTrue torna a la tornada demanada amb el codi (F1v2 · canvi: amb la marca de
     l'intent): la mateixa pestanya el bescanvia. */
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  vesA(`${new URL(tornada).pathname}${new URL(tornada).search}&code=code`);
  await gestionaTornada({}, config);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: verificador });
  expect(usuariDeSessio()?.id).toBe('A');
  expect(window.location.href).toBe(PAGINA);
  expect(getEfimer(_intern.CLAU_INTENT, null)).toBeNull();
});

test('F1v2 · instal·lada: la tornada d’un camí 3 en una altra pestanya (sense el verificador) dona l’error amable, no bescanvia', async () => {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('matchMedia', ambMedia('(display-mode: standalone)'));
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  entraAmbGoogle({}, config);
  await vi.waitFor(() => expect(redirigeix).toHaveBeenCalledTimes(1));
  const tornada = new URL(urlRedirigida(redirigeix)).searchParams.get('redirect_to');
  cancelAuthAttempts();
  // L'altra pestanya (el full de Safari a banda): el registre hi és, però no el verificador.
  window.sessionStorage.clear();
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  vesA(`${new URL(tornada).pathname}${new URL(tornada).search}&code=code`);
  await expect(gestionaTornada({}, config)).rejects.toThrow('verificador');
  expect(fetch).not.toHaveBeenCalled();
  expect(window.location.href).toBe(PAGINA);
});

test('al navegador (no instal·lada) l’emergent continua sent el primer camí', async () => {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('matchMedia', ambMedia('(display-mode: browser)'));
  const popup = { location: {}, closed: false, close: vi.fn() };
  const obri = vi.spyOn(window, 'open').mockReturnValue(popup);
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  const work = entraAmbGoogle({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  expect(obri).toHaveBeenCalledWith('', 'sdp-oauth', 'width=520,height=680');
  expect(redirigeix).not.toHaveBeenCalled();
  cancelAuthAttempts(); await result;
});
