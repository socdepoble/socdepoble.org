// @vitest-environment-options {"url": "https://gentdelatorre.net/alguna/pagina?x=1"}
/* P1 · Onada 3 (261003) · Entrada amb Google des d'un amfitrió (Model B).
   A gentdelatorre.net, «Entrar amb Google» acabava a la /registre d'una SPA
   vella de socdepoble.org: el flux tornava a un relé fix d'un domini propi i
   GoTrue, que no el tenia a la llista, queia a la Site URL. Ara la tornada és
   la pàgina de l'amfitrió on s'ha premut el botó, llegida de window.location.
   jsdom viu a la pàgina de l'amfitrió (la capçalera d'este fitxer) i el
   paquet es prova com en producció (DEV fals). */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setEfimer, getEfimer } from '../config/storage.js';
import { backendScope } from '../config/backendConfig.js';
import { esborraSessio, usuariDeSessio } from './identitat.js';
import { cancelAuthAttempts } from './authAttempt.js';
import { entraAmbGoogle, gestionaTornada, urlDeTornada, esTornadaValida } from './oauthRelay.js';

const ORIGEN = 'https://gentdelatorre.net';
const PAGINA = `${ORIGEN}/alguna/pagina?x=1`;
const config = () => ({ hasSupabaseConfig: true, supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'public' });
const sessioBona = () => ({ ok: true, json: async () => ({ access_token: 'synthetic', user: { id: 'A' } }) });
const emergent = () => { const popup = { location: {}, closed: false, close: vi.fn() }; vi.spyOn(window, 'open').mockReturnValue(popup); return popup; };
const vesA = (ruta) => window.history.replaceState(null, '', ruta);
const missatge = (origin, source) => Object.assign(new Event('message'), { origin, source, data: { type: 'sdp:oauth', code: 'code' } });
const unTorn = () => new Promise((resol) => { setTimeout(resol, 0); });

beforeEach(() => {
  vi.stubEnv('DEV', false);
  vi.stubEnv('PROD', true);
});
afterEach(() => {
  cancelAuthAttempts(); esborraSessio(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers();
  window.sessionStorage.clear();   // també el comptador del Circuit Breaker
  window.localStorage.clear();
  vesA('/alguna/pagina?x=1');
});

test('premissa: la pàgina és la de l’amfitrió i el paquet és el de producció', () => {
  expect(window.location.href).toBe(PAGINA);
  expect(import.meta.env.DEV).toBe(false);
});

test('l’anada porta de tornada exactament la pàgina de l’amfitrió, mai socdepoble.org', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const popup = emergent();
  const work = entraAmbGoogle({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  const url = new URL(popup.location.href);
  expect(url.origin + url.pathname).toBe('https://backend.example.test/auth/v1/authorize');
  expect(url.searchParams.get('redirect_to')).toBe(PAGINA);
  expect(popup.location.href).not.toMatch(/socdepoble\.org/);
  expect(url.searchParams.has('state')).toBe(false);
  cancelAuthAttempts(); await result;
});

test('l’anada no s’emporta les restes d’una entrada anterior ni el fragment', async () => {
  vi.stubGlobal('crypto', webcrypto);
  vesA('/alguna/pagina?x=1&code=vell&error_code=bad_oauth_state#sdp_code=vell');
  const popup = emergent();
  const work = entraAmbGoogle({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  expect(new URL(popup.location.href).searchParams.get('redirect_to')).toBe(PAGINA);
  cancelAuthAttempts(); await result;
});

test('la mare només accepta el codi de l’emergent i de l’origen de la pàgina', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  const popup = emergent();
  const work = entraAmbGoogle({}, config);
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  const verificador = getEfimer('sdp:oauth:verificador');
  window.dispatchEvent(missatge('https://auth.socdepoble.org', popup));                 // el relé retirat
  window.dispatchEvent(missatge('https://gentdelatorre.net.atacant.example', popup));   // s'hi assembla
  window.dispatchEvent(missatge(ORIGEN, { alie: true }));                                // font aliena
  await unTorn();
  expect(fetch).not.toHaveBeenCalled();
  window.dispatchEvent(missatge(ORIGEN, popup));
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: verificador });
  expect(usuariDeSessio()?.id).toBe('A');
});

test('l’emergent torna el codi a l’origen de la pàgina encara que la URL en diga un altre', async () => {
  const opener = { postMessage: vi.fn() };
  vi.stubGlobal('opener', opener);
  vi.useFakeTimers(); vi.spyOn(window, 'close').mockImplementation(() => {});
  for (const alie of ['https://socdepoble.org', 'https://atacant.example']) {
    opener.postMessage.mockClear();
    vesA(`/alguna/pagina?x=1&code=abc&sdp_origin=${encodeURIComponent(alie)}`);
    expect(await gestionaTornada({}, config)).toBeNull();
    expect(opener.postMessage).toHaveBeenCalledTimes(1);
    expect(opener.postMessage).toHaveBeenCalledWith({ type: 'sdp:oauth', code: 'abc' }, ORIGEN);
    expect(window.location.search).not.toMatch(/code=/);
  }
});

test('redirecció completa: bescanvia, neteja el codi i la pàgina continua on estava', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  setEfimer('sdp:oauth:verificador', 'verifier');
  setEfimer('sdp:oauth:backend', backendScope(config()));
  vesA('/alguna/pagina?x=1&code=code');
  await gestionaTornada({}, config);
  expect(usuariDeSessio()?.id).toBe('A');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: 'verifier' });
  expect(window.location.href).toBe(PAGINA);
});

/* GoTrue no torna el text de la consulta tal com l'ha rebut: prepPKCERedirectURL
   fa `q.Set("code", code); u.RawQuery = q.Encode()`, que ordena les claus,
   convertix «buit» en «buit=» i %20 en «+». La pàgina torna amb els mateixos
   paràmetres; la neteja només en lleva el codi i deixa la resta com ve. */
test('redirecció completa amb la consulta reescrita per GoTrue: fora el codi, la resta tal com ve', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  setEfimer('sdp:oauth:verificador', 'verifier');
  setEfimer('sdp:oauth:backend', backendScope(config()));
  vesA('/alguna/pagina?a=1&b=2&buit=&code=code&espai=a+b');
  await gestionaTornada({}, config);
  expect(usuariDeSessio()?.id).toBe('A');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: 'verifier' });
  expect(window.location.href).toBe(`${ORIGEN}/alguna/pagina?a=1&b=2&buit=&espai=a+b`);
});

/* L'enllaç de confirmació de l'alta per correu torna a la mateixa pàgina amb
   tokens implícits al fragment: no s'adopten, i la pàgina queda neta. */
test('la tornada del correu de confirmació a la pàgina de l’amfitrió no adopta tokens i neteja el fragment', async () => {
  vesA('/alguna/pagina?x=1#access_token=tok-sintetic&refresh_token=rt-sintetic&token_type=bearer&type=signup');
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(usuariDeSessio()).toBeNull();
  expect(window.location.href).toBe(PAGINA);
});

test('el codi pel fragment també es neteja i la pàgina continua on estava', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  setEfimer('sdp:oauth:verificador', 'verifier');
  setEfimer('sdp:oauth:backend', backendScope(config()));
  vesA('/alguna/pagina?x=1#sdp_code=code');
  await gestionaTornada({}, config);
  expect(usuariDeSessio()?.id).toBe('A');
  expect(window.location.href).toBe(PAGINA);
});

test('una tornada d’error de GoTrue es neteja sencera, error_code inclòs', async () => {
  vesA('/alguna/pagina?x=1&error=access_denied&error_code=bad_oauth_state&error_description=Denegat');
  await expect(gestionaTornada({}, config)).rejects.toThrow('access_denied');
  expect(window.location.href).toBe(PAGINA);
});

test('esTornadaValida: mateix origen, http(s), sense fragment ni credencials, amb topall de longitud', () => {
  expect(esTornadaValida(PAGINA, ORIGEN)).toBe(true);
  expect(esTornadaValida(`${ORIGEN}/`, ORIGEN)).toBe(true);
  expect(esTornadaValida('http://localhost:3340/registre', 'http://localhost:3340')).toBe(true);
  for (const dolenta of [
    'https://atacant.example/alguna/pagina', 'https://gentdelatorre.net.atacant.example/', 'http://gentdelatorre.net/alguna/pagina',
    'https://gentdelatorre.net:8443/', '//atacant.example/alguna/pagina', '/alguna/pagina', 'javascript:alert(1)', 'data:text/html,hola',
    `${PAGINA}#sdp_code=x`, `${PAGINA}#`, 'https://usuari:clau@gentdelatorre.net/', `${ORIGEN}/${'a'.repeat(2048)}`, '', null, undefined, 42
  ]) expect(esTornadaValida(dolenta, ORIGEN), String(dolenta)).toBe(false);
});

test('urlDeTornada: la pàgina tal com està, sense fragment ni paràmetres d’OAuth', () => {
  expect(urlDeTornada()).toBe(PAGINA);
  vesA('/alguna/pagina?x=1&code=v&state=s&error=e&error_code=c&error_description=d&sdp_code=v&sdp_oauth_error=z#sdp_code=v');
  expect(urlDeTornada()).toBe(PAGINA);
  // Sense res a llevar, la consulta de l'amfitrió viatja literal: cap reserialització.
  vesA('/alguna/pagina?b=2&a=1&buit&espai=a%20b');
  expect(urlDeTornada()).toBe(`${ORIGEN}/alguna/pagina?b=2&a=1&buit&espai=a%20b`);
  vesA('/alguna/pagina?b=2&code=v&buit&espai=a%20b');
  expect(urlDeTornada()).toBe(`${ORIGEN}/alguna/pagina?b=2&buit&espai=a%20b`);
  // Massa llarga: el camí sense consulta i, si encara no cap, l'arrel del mateix origen.
  vesA(`/alguna/pagina?llarg=${'x'.repeat(3000)}`);
  expect(urlDeTornada()).toBe(`${ORIGEN}/alguna/pagina`);
  vesA(`/${'p'.repeat(3000)}`);
  expect(urlDeTornada()).toBe(`${ORIGEN}/`);
  // Sense pàgina http(s), no hi ha tornada.
  for (const href of ['about:blank', 'file:///C:/pagina.html', 'blob:https://gentdelatorre.net/1', 'no és una URL'])
    expect(() => urlDeTornada({ href }), href).toThrow('pàgina http o https');
});

test('el flux no porta cap domini escrit a mà', () => {
  const font = readFileSync(join(process.cwd(), 'src/data/oauthRelay.js'), 'utf8');
  expect(font).not.toMatch(/socdepoble\.org/);
  expect(font).not.toMatch(/['"`]https?:\/\//);
});
