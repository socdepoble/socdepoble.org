import { afterEach, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setEfimer, getEfimer, STORAGE_PREFIX } from '../config/storage.js';
import { backendScope } from '../config/backendConfig.js';
import { esborraSessio, usuariDeSessio } from './identitat.js';
import { beginAuthAttempt, cancelAuthAttempts } from './authAttempt.js';
import { gestionaTornada, entraAmbGoogle, _intern } from './oauthRelay.js';
const config = () => ({ hasSupabaseConfig: true, supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'public' });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { resolve, promise }; };
const sessioBona = () => ({ ok: true, json: async () => ({ access_token: 'synthetic', user: { id: 'A' } }) });
/* La tornada real de GoTrue amb PKCE: només `?code=`. Ni GoTrue ni auth-js 2.112.4
   (GoTrueClient.js, _getUrlForProvider) fan viatjar cap `state` del client. */
function returning() {
  window.history.replaceState(null, '', '/?code=code');
  setEfimer('sdp:oauth:verificador', 'verifier');
  setEfimer('sdp:oauth:backend', backendScope(config()));
}
const emergent = () => { const popup = { location: {}, closed: false, close: vi.fn() }; vi.spyOn(window, 'open').mockReturnValue(popup); return popup; };
afterEach(() => {
  cancelAuthAttempts(); esborraSessio(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  window.sessionStorage.clear();   // també el comptador del Circuit Breaker
  window.history.replaceState(null, '', '/');
});
test('retorn tardà després de logout no restaura la sessió encara que fetch ignore abort', async () => {
  returning(); const body = deferred(); const fetch = vi.fn(async () => ({ ok: true, json: () => body.promise })); vi.stubGlobal('fetch', fetch);
  const work = gestionaTornada({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await Promise.resolve(); esborraSessio();
  body.resolve({ access_token: 'synthetic', user: { id: 'A' } }); await result;
  expect(usuariDeSessio()).toBeNull(); expect(fetch.mock.calls[0][1].redirect).toBe('error'); expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
});
test('un intent nou cancel·la el bescanvi anterior i conserva el seu verificador', async () => {
  returning(); const response = deferred(); vi.stubGlobal('fetch', vi.fn(() => response.promise));
  const work = gestionaTornada({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  const newer = beginAuthAttempt(); setEfimer('sdp:oauth:verificador', 'new-verifier');
  response.resolve({ ok: true, json: async () => ({ access_token: 'old', user: { id: 'A' } }) }); await result;
  expect(getEfimer('sdp:oauth:verificador')).toBe('new-verifier');
  newer.assertCurrent(); expect(usuariDeSessio()).toBeNull();
});
test('el popup pendent es tanca i rebutja quan comença un altre mètode d’entrada', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const popup = emergent();
  const work = entraAmbGoogle({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  const newer = beginAuthAttempt(); await result;
  expect(popup.close).toHaveBeenCalled(); newer.assertCurrent(); expect(usuariDeSessio()).toBeNull();
});
test('el bescanvi vigent guarda exactament la sessió vàlida i neteja el retorn', async () => {
  returning(); const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  await gestionaTornada({}, config); expect(usuariDeSessio()?.id).toBe('A'); expect(window.location.search).toBe('');
  expect(getEfimer('sdp:oauth:verificador', null)).toBeNull();
  // El bescanvi és el d'auth-js 2.112.4 (_exchangeCodeForSession): /token?grant_type=pkce amb auth_code i code_verifier.
  expect(fetch.mock.calls[0][0]).toBe('https://backend.example.test/auth/v1/token?grant_type=pkce');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: 'verifier' });
});

test('un digest PKCE tardà no tanca el popup reutilitzat per l’intent següent', async () => {
  const first = deferred(), second = deferred();
  vi.stubGlobal('crypto', {
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    subtle: { digest: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) }
  });
  const popup = emergent();
  const a = entraAmbGoogle({}, config);
  const aResult = expect(a).rejects.toMatchObject({ name: 'AbortError' });
  const b = entraAmbGoogle({}, config);
  const bResult = expect(b).rejects.toMatchObject({ name: 'AbortError' });
  expect(popup.close).toHaveBeenCalledTimes(1);
  second.resolve(new ArrayBuffer(32));
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  first.resolve(new ArrayBuffer(32)); await aResult;
  expect(popup.close).toHaveBeenCalledTimes(1);
  expect(getEfimer('sdp:oauth:verificador')).toBeTruthy();
  cancelAuthAttempts(); await bResult;
  expect(popup.close).toHaveBeenCalledTimes(2);
});

/* ───────── D2.1 · PKCE sense state propi (auditoria 260925_1316 §4) ───────── */

test('/authorize porta el repte PKCE S256 i el relé, i cap state propi', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const popup = emergent();
  const work = entraAmbGoogle({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  const url = new URL(popup.location.href);
  expect(url.origin + url.pathname).toBe('https://backend.example.test/auth/v1/authorize');
  expect(url.searchParams.get('provider')).toBe('google');
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(url.searchParams.has('state')).toBe(false);
  expect(new URL(url.searchParams.get('redirect_to')).searchParams.get('sdp_origin')).toBe(window.location.origin);
  expect(getEfimer('sdp:oauth:state', null)).toBeNull();
  cancelAuthAttempts(); await result;
});
test('Camí 1: l’emergent torna només el codi i l’entrada es completa per PKCE', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  const popup = emergent();
  const work = entraAmbGoogle({}, config);
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  const verificador = getEfimer('sdp:oauth:verificador');
  const missatge = (origin, source) => Object.assign(new Event('message'), { origin, source, data: { type: 'sdp:oauth', code: 'code' } });
  window.dispatchEvent(missatge('https://atacant.example', popup));      // origen alié: ignorat
  window.dispatchEvent(missatge(_intern.relayOrigin({}), { alie: true }));  // font aliena: ignorada
  window.dispatchEvent(missatge(_intern.relayOrigin({}), popup));
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: verificador });
  expect(usuariDeSessio()?.id).toBe('A');
  expect(getEfimer('sdp:oauth:verificador', null)).toBeNull();
});
test('Camí 2 (COOP): el traspàs per storage amb només el codi completa l’entrada; un de ranci s’ignora', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  const popup = emergent();
  const work = entraAmbGoogle({}, config);
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  const traspas = (t) => Object.assign(new Event('storage'), {
    key: STORAGE_PREFIX + _intern.CLAU_TRASPAS, newValue: JSON.stringify({ type: 'sdp:oauth', code: 'code', t })
  });
  window.dispatchEvent(traspas(Date.now() - 180000));
  expect(fetch).not.toHaveBeenCalled();
  window.dispatchEvent(traspas(Date.now()));
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(fetch).toHaveBeenCalledTimes(1);
});
test('el verificador és d’un sol ús: el mateix codi no es bescanvia dues vegades', async () => {
  returning(); const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  await gestionaTornada({}, config); expect(usuariDeSessio()?.id).toBe('A');
  window.history.replaceState(null, '', '/?code=code');
  await expect(gestionaTornada({}, config)).rejects.toThrow('verificador');
  expect(fetch).toHaveBeenCalledTimes(1);
});
/* Ordre del Mestre (261002) · Tokens del flux implícit al fragment sense cap codi
   (l'enllaç de confirmació de correu de GoTrue, o un d'injectat): no s'adopten
   mai, no s'envien enlloc i no es queden a la barra d'adreces. */
const desat = () => JSON.stringify({ ...window.sessionStorage, ...window.localStorage });
test('261002 · un #access_token sense codi no s’adopta i es neteja, conservant el camí i la consulta', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  window.history.replaceState(null, '', '/el-meu-perfil?vista=1#access_token=tok-sintetic&refresh_token=rt-sintetic&token_type=bearer&type=signup');
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(usuariDeSessio()).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(desat()).not.toMatch(/tok-sintetic|rt-sintetic/);
  expect(window.location.hash).toBe('');
  expect(window.location.pathname + window.location.search).toBe('/el-meu-perfil?vista=1');
});
test('261002 · un #refresh_token sol també es neteja; un fragment sense tokens no es toca', async () => {
  window.history.replaceState(null, '', '/mur#refresh_token=rt-sintetic');
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(usuariDeSessio()).toBeNull();
  expect(window.location.hash).toBe('');
  window.history.replaceState(null, '', '/mur#seccio-2');
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(window.location.pathname + window.location.hash).toBe('/mur#seccio-2');
});
test('un codi injectat en una pestanya que no ha començat cap entrada no es bescanvia', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  window.history.replaceState(null, '', '/mur#sdp_code=codi-alie');
  await expect(gestionaTornada({}, config)).rejects.toThrow('verificador');
  expect(fetch).not.toHaveBeenCalled(); expect(usuariDeSessio()).toBeNull();
  expect(window.location.hash).toBe('');
});

/* ───────── El relé (public/auth/callback.html) ─────────
   S'executa l'script real del fitxer desplegat. `window.close` i els temporitzadors
   es falsegen: tancar la finestra de jsdom tombaria l'entorn de proves. */

const RELE = readFileSync(join(process.cwd(), 'public/auth/callback.html'), 'utf8');
function executaRele(query, opener) {
  const doc = new DOMParser().parseFromString(RELE, 'text/html');
  const script = doc.querySelector('script').textContent;
  doc.querySelectorAll('script, style').forEach(node => node.remove());
  document.body.replaceChildren(...[...doc.body.childNodes].map(node => document.importNode(node, true)));
  window.history.replaceState(null, '', '/auth/callback.html' + query);
  vi.stubGlobal('opener', opener);   // l'afterEach el torna amb vi.unstubAllGlobals()
  vi.useFakeTimers(); vi.spyOn(window, 'close').mockImplementation(() => {});
  new Function(script)();
}
const origen = () => encodeURIComponent(window.location.origin);
test('relé: torna només el codi a l’origen validat, sense reenviar cap state', () => {
  const opener = { postMessage: vi.fn() };
  executaRele(`?code=abc&state=injectat&sdp_origin=${origen()}&sdp_path=%2Fmur`, opener);
  expect(opener.postMessage).toHaveBeenCalledTimes(1);
  expect(opener.postMessage).toHaveBeenCalledWith({ type: 'sdp:oauth', code: 'abc' }, window.location.origin);
});
test('relé: l’error del proveïdor torna sense state', () => {
  const opener = { postMessage: vi.fn() };
  executaRele(`?error=access_denied&error_description=Denegat&state=injectat&sdp_origin=${origen()}`, opener);
  expect(opener.postMessage).toHaveBeenCalledWith({ type: 'sdp:oauth', error: 'Denegat' }, window.location.origin);
});
test('relé: un origen que només s’assembla al nostre no rep res', () => {
  const opener = { postMessage: vi.fn() };
  executaRele(`?code=abc&sdp_origin=${encodeURIComponent('https://socdepoble.org.atacant.example')}`, opener);
  expect(opener.postMessage).not.toHaveBeenCalled();
  expect(document.getElementById('error').hidden).toBe(false);
});


test('un retorn PKCE no envia el verificador a un altre backend', async () => {
  returning();
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  await expect(gestionaTornada({}, () => ({ ...config(), supabaseUrl: 'https://other.example.test' }))).rejects.toThrow('backend');
  expect(fetch).not.toHaveBeenCalled();
  expect(usuariDeSessio()).toBeNull();
});
