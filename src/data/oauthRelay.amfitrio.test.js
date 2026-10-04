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
import { setEfimer, getEfimer, setVal, getVal, STORAGE_PREFIX } from '../config/storage.js';
import { backendScope } from '../config/backendConfig.js';
import { esborraSessio, usuariDeSessio } from './identitat.js';
import { cancelAuthAttempts } from './authAttempt.js';
import { _intern, entraAmbGoogle, gestionaTornada, urlDeTornada, urlDeTornadaOAuth, urlDeTornadaAlta, esTornadaValida } from './oauthRelay.js';

const ORIGEN = 'https://gentdelatorre.net';
const PAGINA = `${ORIGEN}/alguna/pagina?x=1`;
/* F1v2 · Un id d'intent ben format (FORMA_INTENT). */
const ID = 'Zm9vYmFyYmF6cXV4cXV1eA';
const config = () => ({ hasSupabaseConfig: true, supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'public' });
const sessioBona = () => ({ ok: true, json: async () => ({ access_token: 'synthetic', user: { id: 'A' } }) });
const emergent = () => { const popup = { location: {}, closed: false, close: vi.fn() }; vi.spyOn(window, 'open').mockReturnValue(popup); return popup; };
const vesA = (ruta, estat = null) => window.history.replaceState(estat, '', ruta);
const missatge = (origin, source, id) => Object.assign(new Event('message'), { origin, source, data: { type: 'sdp:oauth', id, code: 'code' } });
const unTorn = () => new Promise((resol) => { setTimeout(resol, 0); });
const tornadaDe = (popup) => new URL(popup.location.href).searchParams.get('redirect_to');
const intentDe = (popup) => new URL(tornadaDe(popup)).searchParams.get('sdp_oauth_attempt');
/* La pestanya del camí 3: el verificador i, al costat, l'id del seu intent. */
const pestanyaDelCami3 = () => {
  setEfimer('sdp:oauth:verificador', 'verifier');
  setEfimer(_intern.CLAU_INTENT, ID);
  setEfimer('sdp:oauth:backend', backendScope(config()));
};

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

test('l’anada porta de tornada exactament la pàgina de l’amfitrió amb la marca de l’intent, mai socdepoble.org', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const popup = emergent();
  const work = entraAmbGoogle({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  const url = new URL(popup.location.href);
  expect(url.origin + url.pathname).toBe('https://backend.example.test/auth/v1/authorize');
  /* F1v2 · Canvi: la tornada és PAGINA + la marca d'este intent (abans, PAGINA sola). */
  const id = intentDe(popup);
  expect(id).toMatch(_intern.FORMA_INTENT);
  expect(url.searchParams.get('redirect_to')).toBe(`${PAGINA}&sdp_oauth_attempt=${id}`);
  expect(popup.location.href).not.toMatch(/socdepoble\.org/);
  expect(url.searchParams.has('state')).toBe(false);
  cancelAuthAttempts(); await result;
});

test('l’anada no s’emporta les restes d’una entrada anterior (marca vella inclosa) ni el fragment', async () => {
  vi.stubGlobal('crypto', webcrypto);
  vesA(`/alguna/pagina?x=1&code=vell&error_code=bad_oauth_state&sdp_oauth_attempt=${ID}&sdp_auth=alta#sdp_code=vell`);
  const popup = emergent();
  const work = entraAmbGoogle({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  // F1v2 · Canvi: una sola marca, la nova; la vella no viatja.
  const id = intentDe(popup);
  expect(id).not.toBe(ID);
  expect(tornadaDe(popup)).toBe(`${PAGINA}&sdp_oauth_attempt=${id}`);
  cancelAuthAttempts(); await result;
});

test('la mare només accepta el codi de l’emergent, de l’origen de la pàgina i del seu id', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  const popup = emergent();
  const work = entraAmbGoogle({}, config);
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  const verificador = getEfimer('sdp:oauth:verificador');
  const id = intentDe(popup);
  window.dispatchEvent(missatge('https://auth.socdepoble.org', popup, id));                 // el relé retirat
  window.dispatchEvent(missatge('https://gentdelatorre.net.atacant.example', popup, id));   // s'hi assembla
  window.dispatchEvent(missatge(ORIGEN, { alie: true }, id));                                // font aliena
  window.dispatchEvent(missatge(ORIGEN, popup, ID));                                         // F1v2 · un altre intent
  await unTorn();
  expect(fetch).not.toHaveBeenCalled();
  window.dispatchEvent(missatge(ORIGEN, popup, id));
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: verificador });
  expect(usuariDeSessio()?.id).toBe('A');
});

/* F1v2 · Canvi: l'emergent ja no es reconeix per l'`opener`, sinó pel registre
   d'espera del seu id (CAMI.EMERGENT). El missatge porta l'id. */
test('l’emergent torna el codi a l’origen de la pàgina encara que la URL en diga un altre', async () => {
  const opener = { postMessage: vi.fn() };
  vi.stubGlobal('opener', opener);
  vi.useFakeTimers(); vi.spyOn(window, 'close').mockImplementation(() => {});
  for (const alie of ['https://socdepoble.org', 'https://atacant.example']) {
    opener.postMessage.mockClear();
    setVal(_intern.clauEspera(ID), { t: Date.now(), cami: 'emergent' });
    vesA(`/alguna/pagina?x=1&code=abc&sdp_oauth_attempt=${ID}&sdp_origin=${encodeURIComponent(alie)}`);
    expect(await gestionaTornada({}, config)).toBeNull();
    expect(opener.postMessage).toHaveBeenCalledTimes(1);
    expect(opener.postMessage).toHaveBeenCalledWith({ type: 'sdp:oauth', id: ID, code: 'abc' }, ORIGEN);
    expect(window.location.search).not.toMatch(/code=|sdp_oauth_attempt/);
  }
});

test('redirecció completa: bescanvia, neteja el codi i la marca i la pàgina continua on estava amb el seu history.state', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  pestanyaDelCami3();
  setVal(_intern.clauEspera(ID), { t: Date.now(), cami: 'redireccio' });
  vesA(`/alguna/pagina?x=1&code=code&sdp_oauth_attempt=${ID}`, { usr: { des: 'el router' }, key: 'k1' });
  await gestionaTornada({}, config);
  expect(usuariDeSessio()?.id).toBe('A');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: 'verifier' });
  expect(window.location.href).toBe(PAGINA);
  expect(window.history.state).toEqual({ usr: { des: 'el router' }, key: 'k1' });
  // El registre del seu id, fora.
  expect(getVal(_intern.clauEspera(ID), null)).toBeNull();
});

/* GoTrue no torna el text de la consulta tal com l'ha rebut: prepPKCERedirectURL
   fa `q.Set("code", code); u.RawQuery = q.Encode()`, que ordena les claus,
   convertix «buit» en «buit=» i %20 en «+». La pàgina torna amb els mateixos
   paràmetres; la neteja només en lleva el codi i la marca, i deixa la resta com ve. */
test('redirecció completa amb la consulta reescrita per GoTrue: fora el codi i la marca, la resta tal com ve', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  pestanyaDelCami3();
  vesA(`/alguna/pagina?a=1&b=2&buit=&code=code&espai=a+b&sdp_oauth_attempt=${ID}`);
  await gestionaTornada({}, config);
  expect(usuariDeSessio()?.id).toBe('A');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: 'verifier' });
  expect(window.location.href).toBe(`${ORIGEN}/alguna/pagina?a=1&b=2&buit=&espai=a+b`);
});

/* L'enllaç de confirmació de l'alta per correu torna a la mateixa pàgina amb
   tokens implícits al fragment: no s'adopten, i la pàgina queda neta.
   F1v2 · Canvi: la tornada de l'alta porta la seua marca (sdp_auth=alta). */
test('la tornada del correu de confirmació a la pàgina de l’amfitrió no adopta tokens i neteja el fragment', async () => {
  vesA('/alguna/pagina?x=1&sdp_auth=alta#access_token=tok-sintetic&refresh_token=rt-sintetic&token_type=bearer&type=signup');
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(usuariDeSessio()).toBeNull();
  expect(window.location.href).toBe(PAGINA);
});

/* F1v2 · Canvi: un #sdp_code del relé retirat, sense la marca de l'intent, ja no
   és cap tornada nostra (W4-02). Ni bescanvi ni neteja. */
test('un #sdp_code del relé retirat, sense marca, no es bescanvia ni es toca', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  pestanyaDelCami3();
  vesA('/alguna/pagina?x=1#sdp_code=code');
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(usuariDeSessio()).toBeNull();
  expect(window.location.href).toBe(`${PAGINA}#sdp_code=code`);
  expect(getEfimer('sdp:oauth:verificador', null)).toBe('verifier');
});

test('una tornada d’error de GoTrue es neteja sencera, error_code i marca inclosos', async () => {
  pestanyaDelCami3();
  vesA(`/alguna/pagina?x=1&error=access_denied&error_code=bad_oauth_state&error_description=Denegat&sdp_oauth_attempt=${ID}#error=access_denied&error_code=bad_oauth_state`);
  await expect(gestionaTornada({}, config)).rejects.toThrow('access_denied');
  expect(window.location.href).toBe(PAGINA);
  // L'intent ha acabat: el verificador del seu id ja no serveix.
  expect(getEfimer('sdp:oauth:verificador', null)).toBeNull();
});

/* ───────── W4-02 · Reproduccions de Codex (auditoria 261003_1950) ─────────
   Un WordPress amb consultes pròpies que diuen code, state o error. Ni s'ha
   començat cap entrada, o una altra pestanya n'espera una. La tornada no és
   nostra: cap efecte. Cada escriptura a localStorage es retransmet com
   l'esdeveniment `storage` que rebria la mare en una altra pestanya; la mare no
   ha de sentir res. */
const CUPO = '/wordpress/?page_id=12&code=HOST-COUPON&state=HOST-STATE&filter=all';
const PAGAMENT = '/wordpress/?page_id=12&error=HOST-CHECKOUT-FAILED';
const ESTAT_AMFITRIO = Object.freeze({ amfitrio: 'wordpress', pas: 3 });
const STORAGE_PREFIX_TRASPAS = STORAGE_PREFIX + _intern.PREFIX_TRASPAS;
const emmagatzemat = () => [window.localStorage, window.sessionStorage]
  .flatMap((capa) => Object.keys(capa).sort().map((clau) => `${clau}=${capa.getItem(clau)}`)).join('\n');

/* Com un navegador: el que escriu esta «pestanya» arriba com a `storage` a les altres. */
async function comAltraPestanya(cos) {
  const escrites = [];
  const original = Storage.prototype.setItem;
  const espia = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (clau, valor) {
    escrites.push([clau, String(valor)]);
    return original.call(this, clau, valor);
  });
  const esborra = vi.spyOn(Storage.prototype, 'removeItem');
  try { return { resultat: await cos(), escrites, esborrades: esborra.mock.calls.map(([clau]) => clau) }; }
  finally {
    espia.mockRestore(); esborra.mockRestore();
    for (const [key, newValue] of escrites) window.dispatchEvent(Object.assign(new Event('storage'), { key, newValue }));
  }
}

test.each([
  ['un cupó amb code i state', CUPO],
  ['un error de pagament', PAGAMENT]
])('W4-02 · %s sense cap entrada: null, cap canvi d’URL ni de history.state, cap escriptura ni esborrat', async (_cas, ruta) => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  vi.spyOn(window, 'close').mockImplementation(() => {});
  vesA(ruta, ESTAT_AMFITRIO);
  const replace = vi.spyOn(window.history, 'replaceState');
  const push = vi.spyOn(window.history, 'pushState');
  const abans = emmagatzemat();
  const { resultat, escrites, esborrades } = await comAltraPestanya(() => gestionaTornada({}, config));
  expect(resultat).toBeNull();
  expect(window.location.href).toBe(ORIGEN + ruta);
  expect(window.history.state).toEqual(ESTAT_AMFITRIO);
  expect(replace).not.toHaveBeenCalled();
  expect(push).not.toHaveBeenCalled();
  expect(escrites).toEqual([]);
  expect(esborrades).toEqual([]);
  expect(emmagatzemat()).toBe(abans);
  expect(window.close).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

test.each([
  ['un cupó amb code i state', CUPO],
  ['un error de pagament', PAGAMENT]
])('W4-02 · %s mentre una altra pestanya espera el seu emergent: la mare no se n’assabenta', async (_cas, ruta) => {
  vi.stubGlobal('crypto', webcrypto);
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  vi.spyOn(window, 'close').mockImplementation(() => {});
  // La mare: una entrada amb emergent, esperant.
  const popup = emergent();
  const work = entraAmbGoogle({}, config);
  let acabada = false;
  work.then(() => { acabada = true; }, () => { acabada = true; });
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  const id = intentDe(popup);
  const verificador = getEfimer('sdp:oauth:verificador');
  const registre = getVal(_intern.clauEspera(id), null);
  expect(registre).toMatchObject({ cami: 'emergent' });
  // L'altra pestanya: la pàgina de WordPress amb la seua consulta. Sense opener i sense nom, com un emergent tallat.
  vi.stubGlobal('opener', null);
  vesA(ruta, ESTAT_AMFITRIO);
  const { resultat, escrites, esborrades } = await comAltraPestanya(() => gestionaTornada({}, config));
  await unTorn();
  expect(resultat).toBeNull();
  expect(escrites).toEqual([]);
  expect(esborrades).toEqual([]);
  expect(window.location.href).toBe(ORIGEN + ruta);
  expect(window.history.state).toEqual(ESTAT_AMFITRIO);
  // La mare continua esperant, amb el seu verificador i el seu registre.
  expect(acabada).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
  expect(getEfimer('sdp:oauth:verificador')).toBe(verificador);
  expect(getVal(_intern.clauEspera(id), null)).toEqual(registre);
  expect(popup.close).not.toHaveBeenCalled();
  /* I el seu emergent de veres encara completa l'entrada, pel mateix canal: la
     prova que la retransmissió porta les escriptures (si l'amfitrió n'haguera
     fet cap, la mare l'hauria sentida). Esta «pestanya» compartix la capa
     efímera amb la mare i hi veu el verificador: el registre CAMI.EMERGENT mana
     igualment i passa el codi en compte de bescanviar-lo. */
  vesA(`/wordpress/?page_id=12&code=codi-de-google&sdp_oauth_attempt=${id}`, ESTAT_AMFITRIO);
  const tornada = await comAltraPestanya(() => gestionaTornada({}, config));
  expect(tornada.resultat).toBeNull();
  expect(tornada.escrites.map(([clau]) => clau)).toEqual([STORAGE_PREFIX_TRASPAS + id]);
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'codi-de-google', code_verifier: verificador });
  expect(window.location.href).toBe(`${ORIGEN}/wordpress/?page_id=12`);
  expect(window.history.state).toEqual(ESTAT_AMFITRIO);
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
  // F1v2 · Les dues marques tampoc no tornen mai a viatjar.
  vesA(`/alguna/pagina?x=1&sdp_oauth_attempt=${ID}&sdp_auth=alta`);
  expect(urlDeTornada()).toBe(PAGINA);
});

test('F1v2 · urlDeTornadaOAuth: la tornada amb la marca de l’intent, també quan cau pel topall', () => {
  expect(urlDeTornadaOAuth(ID)).toBe(`${PAGINA}&sdp_oauth_attempt=${ID}`);
  vesA('/alguna/pagina');
  expect(urlDeTornadaOAuth(ID)).toBe(`${ORIGEN}/alguna/pagina?sdp_oauth_attempt=${ID}`);
  // Una marca vella a la pàgina es substituïx per la nova.
  vesA(`/alguna/pagina?x=1&sdp_oauth_attempt=${'B'.repeat(22)}&code=v`);
  expect(urlDeTornadaOAuth(ID)).toBe(`${PAGINA}&sdp_oauth_attempt=${ID}`);
  // El topall compta la marca: cada recurs la conserva.
  const marca = `sdp_oauth_attempt=${ID}`;
  const consultaJusta = 'q=' + 'x'.repeat(_intern.LONGITUD_MAXIMA_TORNADA - `${ORIGEN}/alguna/pagina?q=`.length);
  vesA(`/alguna/pagina?${consultaJusta}`);
  expect(urlDeTornada()).toBe(`${ORIGEN}/alguna/pagina?${consultaJusta}`);          // sense marca, hi cap
  expect(urlDeTornadaOAuth(ID)).toBe(`${ORIGEN}/alguna/pagina?${marca}`);             // amb marca, ja no: el camí
  vesA(`/${'p'.repeat(_intern.LONGITUD_MAXIMA_TORNADA - `${ORIGEN}/?`.length - marca.length + 1)}`);
  expect(urlDeTornadaOAuth(ID)).toBe(`${ORIGEN}/?${marca}`);                          // ni el camí: l'arrel
  expect(esTornadaValida(urlDeTornadaOAuth(ID), ORIGEN)).toBe(true);
  // Una marca que no té FORMA_INTENT no es posa mai.
  for (const dolenta of ['', 'curta', `${ID}=`, `${ID}&x=1`, null, undefined, 42])
    expect(() => urlDeTornadaOAuth(dolenta), String(dolenta)).toThrow('marca vàlida');
  expect(() => urlDeTornadaOAuth(ID, { href: 'about:blank' })).toThrow('pàgina http o https');
});

test('F1v2 · urlDeTornadaAlta: la tornada de l’alta amb sdp_auth=alta', () => {
  expect(urlDeTornadaAlta()).toBe(`${PAGINA}&sdp_auth=alta`);
  vesA('/alguna/pagina?x=1&sdp_auth=alta&code=vell#access_token=vell');
  expect(urlDeTornadaAlta()).toBe(`${PAGINA}&sdp_auth=alta`);
  expect(() => urlDeTornadaAlta({ href: 'about:blank' })).toThrow('pàgina http o https');
});

test('el flux no porta cap domini escrit a mà', () => {
  const font = readFileSync(join(process.cwd(), 'src/data/oauthRelay.js'), 'utf8');
  expect(font).not.toMatch(/socdepoble\.org/);
  expect(font).not.toMatch(/['"`]https?:\/\//);
});
