/* F1 · Onada 4 (261003) · Auditoria de Codex 261003_1903, F1. Amb COOP (la
   posa Google), el WindowProxy que guarda la mare diu closed === true mentre
   la persona encara s'autentica. El vigilant de 700 ms ho prenia per una
   cancel·lació: rebutjava al primer tic, llevava els escoltadors i el finally
   d'entraAmbGoogle esborrava el verificador PKCE; el camí 2 (storage) ja no
   podia acabar. Ara `closed` no es llig: l'intent només acaba per una
   cancel·lació explícita, per un codi o un error del seu id que arriba, o pel
   termini.
   F1v2 · W4-03 (auditoria de Codex 261003_1950): amb Chrome 154 i capçaleres
   COOP reals, l'emergent torna amb window.name "" i opener null. L'avís global
   del primer pegat (CLAU_ESPERA) era una heurística entre pestanyes: ara cada
   intent té un id a la tornada (sdp_oauth_attempt), un registre d'espera per
   id i una clau de traspàs per id, i la mare només consumix el seu.
   Temporitzadors falsos i dades sintètiques. COOP en un navegador de veres és
   [NO VERIFICAT] ací: ací l'emergent tallat és opener null i name buit. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { getEfimer, setEfimer, getVal, setVal, STORAGE_PREFIX } from '../config/storage.js';
import { backendScope } from '../config/backendConfig.js';
import { esborraSessio, usuariDeSessio } from './identitat.js';
import { cancelAuthAttempts } from './authAttempt.js';
import { _intern, entraAmbGoogle, gestionaTornada } from './oauthRelay.js';

const config =() => ({ hasSupabaseConfig: true, supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'public' });
const sessioBona = () => ({ ok: true, json: async () => ({ access_token: 'synthetic', user: { id: 'A' } }) });
const TIC_MS = 700;   // el període del vigilant retirat
const UN_ALTRE = 'unAltreIntentDeProva_1';   // l'id d'un altre intent, ben format (22 caràcters)
const CAMI3 = 'unaPestanyaDelCami3_ok';     // l'id d'un camí 3, ben format
/* L'emergent amb COOP: closed === true des del primer moment. */
const emergentCoop = () => { const popup = { location: {}, closed: true, close: vi.fn() }; vi.spyOn(window, 'open').mockReturnValue(popup); return popup; };
const intentDe = (popup) => new URL(new URL(popup.location.href).searchParams.get('redirect_to')).searchParams.get('sdp_oauth_attempt');
const traspas = (id, carrega, clau = _intern.clauTraspas(id)) => Object.assign(new Event('storage'), {
  key: STORAGE_PREFIX + clau, newValue: JSON.stringify({ type: 'sdp:oauth', id, ...carrega, t: Date.now() })
});
const missatge = (source, carrega) => Object.assign(new Event('message'), { origin: window.location.origin, source, data: { type: 'sdp:oauth', ...carrega } });
const verificador = () => getEfimer(_intern.CLAU_VERIFICADOR, null);
const espera = (id) => getVal(_intern.clauEspera(id), null);
const desat = (id) => getVal(_intern.clauTraspas(id), null);

/* L'anada fins a esperaCodi: l'emergent ja va cap a /authorize. */
async function obriEntrada(entra = entraAmbGoogle) {
  const popup = emergentCoop();
  const work = entra({}, config);
  await vi.advanceTimersByTimeAsync(0);
  expect(popup.location.href).toContain('/authorize');
  return { popup, work, id: intentDe(popup) };
}

/* Cada pestanya té la seua capa efímera; jsdom en té una. Es guarda i es torna. */
const capaEfimera = () => Object.fromEntries(Object.keys(window.sessionStorage).map((k) => [k, window.sessionStorage.getItem(k)]));
const posaCapaEfimera = (capa) => {
  window.sessionStorage.clear();
  for (const [k, v] of Object.entries(capa)) window.sessionStorage.setItem(k, v);
};

/* Com un navegador: el que escriu una pestanya a localStorage arriba com a
   `storage` a les altres. `escritesDe` les replega; `retransmet` les lliura. */
async function escritesDe(cos) {
  const escrites = [];
  const original = Storage.prototype.setItem;
  const espia = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (clau, valor) {
    if (this === window.localStorage) escrites.push([clau, String(valor)]);
    return original.call(this, clau, valor);
  });
  try { return { resultat: await cos(), escrites }; } finally { espia.mockRestore(); }
}
const retransmet = (escrites) => {
  for (const [key, newValue] of escrites) window.dispatchEvent(Object.assign(new Event('storage'), { key, newValue }));
};

beforeEach(() => {
  vi.useFakeTimers();
  // Un repte PKCE sense fils de fons: els temporitzadors falsos no l'esperen.
  vi.stubGlobal('crypto', {
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    subtle: { digest: vi.fn(async () => new ArrayBuffer(32)) }
  });
});
afterEach(() => {
  cancelAuthAttempts(); esborraSessio(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  window.sessionStorage.clear();   // també el comptador del Circuit Breaker
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

test('premissa: els ids de prova tenen la forma d’una marca de veres', () => {
  for (const id of [UN_ALTRE, CAMI3]) expect(id).toMatch(_intern.FORMA_INTENT);
});

test('F1 · reproducció de Codex: closed === true abans del primer tic, deu tics, i el codi del seu id arriba per storage', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  const { popup, work, id } = await obriEntrada();
  const original = verificador();
  expect(original).toBeTruthy();
  expect(getEfimer(_intern.CLAU_INTENT, null)).toBe(id);
  let acabada = false;
  work.then(() => { acabada = true; }, () => { acabada = true; });
  // El primer tic és el que abans rebutjava; en passen deu.
  await vi.advanceTimersByTimeAsync(10 * TIC_MS);
  expect(acabada).toBe(false);
  expect(verificador()).toBe(original);
  expect(popup.close).not.toHaveBeenCalled();
  expect(espera(id)).toEqual({ t: expect.any(Number), cami: 'emergent' });
  window.dispatchEvent(traspas(id, { code: 'code' }));
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: original });
  expect(usuariDeSessio()?.id).toBe('A');
  expect(verificador()).toBeNull();
  expect(getEfimer(_intern.CLAU_INTENT, null)).toBeNull();
  expect(espera(id)).toBeNull();
  // Cap escoltador viu: un traspàs posterior no bescanvia res.
  window.dispatchEvent(traspas(id, { code: 'code-2' }));
  await vi.advanceTimersByTimeAsync(0);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('F1 · closed === true pel camí 1: el missatge de l’emergent amb el seu id també completa l’entrada', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  const { popup, work, id } = await obriEntrada();
  const original = verificador();
  await vi.advanceTimersByTimeAsync(3 * TIC_MS);
  window.dispatchEvent(missatge(popup, { id: UN_ALTRE, code: 'codi-alie' }));   // un altre id: ignorat
  await vi.advanceTimersByTimeAsync(0);
  expect(fetch).not.toHaveBeenCalled();
  window.dispatchEvent(missatge(popup, { id, code: 'code' }));
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: original });
  expect(verificador()).toBeNull();
});

test('F1 · closed === true i un error del seu id per storage: rebutja amb l’error, sense bescanvi, i neteja', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  const { work, id } = await obriEntrada();
  const result = expect(work).rejects.toThrow('Denegat');
  await vi.advanceTimersByTimeAsync(3 * TIC_MS);
  window.dispatchEvent(traspas(UN_ALTRE, { error: 'HOST-CHECKOUT-FAILED' }));   // la clau d'un altre id: ignorada
  window.dispatchEvent(traspas(UN_ALTRE, { error: 'HOST-CHECKOUT-FAILED' }, _intern.clauTraspas(id)));   // la seua clau, un altre id
  window.dispatchEvent(traspas(id, { error: 'Denegat' }));
  await result;
  expect(fetch).not.toHaveBeenCalled();
  expect(verificador()).toBeNull();
  expect(espera(id)).toBeNull();
});

test('F1 · closed === true i la persona cancel·la: AbortError, fora verificador, registre i escoltadors; un codi tardà no bescanvia', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  const { popup, work, id } = await obriEntrada();
  const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await vi.advanceTimersByTimeAsync(3 * TIC_MS);
  cancelAuthAttempts();
  await result;
  expect(popup.close).toHaveBeenCalled();
  expect(verificador()).toBeNull();
  expect(espera(id)).toBeNull();
  // L'arribada tardana, pels dos camins: ningú no l'escolta.
  window.dispatchEvent(traspas(id, { code: 'code' }));
  window.dispatchEvent(missatge(popup, { id, code: 'code' }));
  await vi.advanceTimersByTimeAsync(0);
  expect(fetch).not.toHaveBeenCalled();
  expect(usuariDeSessio()).toBeNull();
});

test('F1 · cancel·lat, l’emergent que torna tard ja no troba el registre: no passa el codi i dona l’error amable', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  vi.spyOn(window, 'close').mockImplementation(() => {});
  const { work, id } = await obriEntrada();
  const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  cancelAuthAttempts();
  await result;
  // L'emergent, ara: sense opener, sense nom i sense la capa de la mare.
  window.sessionStorage.clear();
  vi.stubGlobal('opener', null);
  window.history.replaceState(null, '', `/?code=code&sdp_oauth_attempt=${id}`);
  const { resultat, escrites } = await escritesDe(() => gestionaTornada({}, config).catch((e) => e));
  expect(resultat.message).toMatch(/verificador/);
  expect(escrites).toEqual([]);
  expect(desat(id)).toBeNull();
  expect(window.location.search).toBe('');
  expect(fetch).not.toHaveBeenCalled();
});

test('F1 · closed === true i res més: el termini rebutja a TEMPS_MAXIM_MS, no abans', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  const { popup, work, id } = await obriEntrada();
  let error = null;
  work.catch((e) => { error = e; });
  await vi.advanceTimersByTimeAsync(_intern.TEMPS_MAXIM_MS - 1);
  expect(error).toBeNull();
  expect(verificador()).toBeTruthy();
  expect(espera(id)).toMatchObject({ cami: 'emergent' });
  expect(popup.close).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  await expect(work).rejects.toThrow('L\'entrada ha tardat massa. Torna a provar.');
  expect(popup.close).toHaveBeenCalled();
  expect(verificador()).toBeNull();
  expect(espera(id)).toBeNull();
  // Un codi que arriba després del termini tampoc no bescanvia.
  window.dispatchEvent(traspas(id, { code: 'code' }));
  await vi.advanceTimersByTimeAsync(0);
  expect(fetch).not.toHaveBeenCalled();
});

test('F1v2 · cada mare només esborra el seu registre i el seu traspàs', async () => {
  const { work, id } = await obriEntrada();
  const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  const daltra = { t: Date.now(), cami: 'emergent' };
  const traspasDaltra = { type: 'sdp:oauth', id: UN_ALTRE, code: 'el-seu', t: Date.now() };
  setVal(_intern.clauEspera(UN_ALTRE), daltra);
  setVal(_intern.clauTraspas(UN_ALTRE), traspasDaltra);
  cancelAuthAttempts();
  await result;
  expect(espera(id)).toBeNull();
  expect(espera(UN_ALTRE)).toEqual(daltra);
  expect(desat(UN_ALTRE)).toEqual(traspasDaltra);
});

test('F1 · l’emergent no hereta un verificador ni un id vells: s’esborren abans d’obrir-lo, amb el registre vell', async () => {
  setEfimer(_intern.CLAU_VERIFICADOR, 'verificador-vell');
  setEfimer(_intern.CLAU_INTENT, UN_ALTRE);
  setVal(_intern.clauEspera(UN_ALTRE), { t: Date.now(), cami: 'redireccio' });
  let enObrir = 'no s’ha obert';
  const popup = { location: {}, closed: true, close: vi.fn() };
  vi.spyOn(window, 'open').mockImplementation(() => {
    enObrir = { verificador: verificador(), intent: getEfimer(_intern.CLAU_INTENT, null), registre: espera(UN_ALTRE) };
    return popup;
  });
  const work = entraAmbGoogle({}, config);
  const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await vi.advanceTimersByTimeAsync(0);
  expect(enObrir).toEqual({ verificador: null, intent: null, registre: null });
  expect(verificador()).toBeTruthy();
  expect(verificador()).not.toBe('verificador-vell');
  expect(getEfimer(_intern.CLAU_INTENT, null)).toBe(intentDe(popup));
  expect(intentDe(popup)).not.toBe(UN_ALTRE);
  cancelAuthAttempts(); await result;
});

test('F1v2 · si el registre de l’emergent no es pot escriure, l’emergent es tanca i l’entrada fa el camí 3', async () => {
  const original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (clau, valor) {
    if (String(clau).includes(_intern.PREFIX_ESPERA)) throw new DOMException('Ple', 'QuotaExceededError');
    return original.call(this, clau, valor);
  });
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  const popup = emergentCoop();
  entraAmbGoogle({}, config);
  await vi.advanceTimersByTimeAsync(0);
  expect(popup.close).toHaveBeenCalledTimes(1);
  expect(popup.location.href).toBeUndefined();
  expect(redirigeix).toHaveBeenCalledTimes(1);
  const tornada = new URL(new URL(redirigeix.mock.calls[0][0]).searchParams.get('redirect_to'));
  // El camí 3 només necessita la capa efímera d'esta pestanya.
  expect(getEfimer(_intern.CLAU_INTENT, null)).toBe(tornada.searchParams.get('sdp_oauth_attempt'));
  expect(verificador()).toBeTruthy();
});

test('F1v2 · si l’emergent no es deixa navegar, la pestanya fa el camí 3 i el registre ho diu', async () => {
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  const popup = { closed: false, close: vi.fn(), location: { set href(_url) { throw new Error('bloquejat'); } } };
  vi.spyOn(window, 'open').mockReturnValue(popup);
  entraAmbGoogle({}, config);
  await vi.advanceTimersByTimeAsync(0);
  expect(redirigeix).toHaveBeenCalledTimes(1);
  const id = getEfimer(_intern.CLAU_INTENT, null);
  expect(espera(id)).toEqual({ t: expect.any(Number), cami: 'redireccio' });
});

/* Revisió adversarial de F1v2 (261003) · Una pestanya que ja es diu
   'sdp-oauth' (un emergent que no s'ha tancat i on la persona torna a prémer
   Google) rep d'window.open('', 'sdp-oauth') la seua pròpia finestra: comprovat
   a Chromium, `window.open(...) === window`. No és cap emergent. Abans, el
   registre deia CAMI.EMERGENT, la pestanya navegava ella mateixa, de tornada el
   registre manava (passava el codi i es tancava, amb el verificador al costat)
   i tancaPopup tancava la pestanya en un avort o en el termini. */
test('F1v2 · window.open que torna la mateixa finestra no és cap emergent: camí 3, bescanvia de tornada i no es tanca', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  const tanca = vi.spyOn(window, 'close').mockImplementation(() => {});
  vi.spyOn(window, 'open').mockReturnValue(window);
  entraAmbGoogle({}, config).catch(() => {});
  await vi.advanceTimersByTimeAsync(0);
  expect(redirigeix).toHaveBeenCalledTimes(1);
  const id = getEfimer(_intern.CLAU_INTENT, null);
  expect(new URL(new URL(redirigeix.mock.calls[0][0]).searchParams.get('redirect_to')).searchParams.get('sdp_oauth_attempt')).toBe(id);
  expect(espera(id)).toEqual({ t: expect.any(Number), cami: 'redireccio' });
  const original = verificador();
  // De tornada, a la mateixa pestanya: bescanvia amb el seu verificador, no passa res a ningú.
  window.history.replaceState(null, '', `/?code=code&sdp_oauth_attempt=${id}`);
  await expect(gestionaTornada({}, config)).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: original });
  expect(desat(id)).toBeNull();
  expect(espera(id)).toBeNull();
  await vi.advanceTimersByTimeAsync(100);
  expect(tanca).not.toHaveBeenCalled();
});

/* ───────── La tornada de l'emergent tallat (gestionaTornada) ─────────
   Amb COOP, l'emergent torna amb opener null i sense el nom 'sdp-oauth'
   (Chrome 154, W4-03): ací, opener null i name buit. El reconeix el registre
   del seu id. */

test('F1v2 · l’emergent tallat torna sense opener ni nom: amb el registre del seu id, passa el codi per storage i es tanca', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  vi.stubGlobal('opener', null);
  vi.spyOn(window, 'close').mockImplementation(() => {});
  setVal(_intern.clauEspera(UN_ALTRE), { t: Date.now(), cami: 'emergent' });
  window.history.replaceState({ usr: 'r' }, '', `/?filter=all&code=code&sdp_oauth_attempt=${UN_ALTRE}`);
  expect(window.opener).toBeNull();
  expect(window.name).toBe('');
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(desat(UN_ALTRE)).toEqual({ type: 'sdp:oauth', id: UN_ALTRE, code: 'code', t: expect.any(Number) });
  expect(window.location.search).toBe('?filter=all');
  expect(window.history.state).toEqual({ usr: 'r' });
  await vi.advanceTimersByTimeAsync(60);
  expect(window.close).toHaveBeenCalled();
});

test('F1v2 · l’emergent tallat amb un error també el passa per storage, amb el seu id', async () => {
  vi.stubGlobal('opener', null);
  vi.spyOn(window, 'close').mockImplementation(() => {});
  setVal(_intern.clauEspera(UN_ALTRE), { t: Date.now(), cami: 'emergent' });
  window.history.replaceState(null, '', `/?error=access_denied&error_description=Denegat&sdp_oauth_attempt=${UN_ALTRE}`);
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(desat(UN_ALTRE)).toMatchObject({ type: 'sdp:oauth', id: UN_ALTRE, error: 'access_denied' });
  expect(window.location.search).toBe('');
});

test('F1v2 · amb la marca però sense registre vigent ni verificador: error amable, cap traspàs, només es lleven els nostres paràmetres', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  for (const registre of [
    null,                                                                  // cap
    { t: Date.now() - _intern.TEMPS_MAXIM_MS - 1, cami: 'emergent' },      // caducat
    { cami: 'emergent' },                                                  // sense hora
    { t: Date.now(), cami: 'un-altre' },                                   // camí desconegut
    { t: Date.now(), cami: 'redireccio' }                                  // camí 3 en una pestanya sense verificador
  ]) {
    if (registre) setVal(_intern.clauEspera(UN_ALTRE), registre);
    window.history.replaceState(null, '', `/?page_id=12&code=code&sdp_oauth_attempt=${UN_ALTRE}`);
    const { resultat, escrites } = await escritesDe(() => gestionaTornada({}, config).catch((e) => e));
    expect(resultat.message, JSON.stringify(registre)).toMatch(/S'ha perdut el verificador/);
    expect(escrites, JSON.stringify(registre)).toEqual([]);
    expect(desat(UN_ALTRE)).toBeNull();
    expect(window.location.search).toBe('?page_id=12');
  }
  expect(fetch).not.toHaveBeenCalled();
});

test('F1v2 · la pestanya del camí 3 té el verificador del seu id: bescanvia encara que una altra mare espere el seu emergent', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  const ID = CAMI3;
  setVal(_intern.clauEspera(UN_ALTRE), { t: Date.now(), cami: 'emergent' });
  setVal(_intern.clauEspera(ID), { t: Date.now(), cami: 'redireccio' });
  setEfimer(_intern.CLAU_VERIFICADOR, 'verifier');
  setEfimer(_intern.CLAU_INTENT, ID);
  setEfimer('sdp:oauth:backend', backendScope(config()));
  window.history.replaceState(null, '', `/?code=code&sdp_oauth_attempt=${ID}`);
  await gestionaTornada({}, config);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: 'verifier' });
  expect(usuariDeSessio()?.id).toBe('A');
  expect(desat(ID)).toBeNull();
  expect(espera(ID)).toBeNull();
  expect(espera(UN_ALTRE)).toMatchObject({ cami: 'emergent' });
});

/* La cadena sencera en un sol jsdom, amb el gestionaTornada de veres a
   l'emergent: la mare espera, l'emergent tallat (opener null, nom buit, sense
   la capa efímera de la mare) torna amb la marca, escriu el traspàs, i
   l'escriptura arriba a la mare com l'esdeveniment `storage` d'un navegador. */
test('F1v2 · cadena COOP: l’emergent de veres passa el codi i la mare el bescanvia amb el seu verificador', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  vi.spyOn(window, 'close').mockImplementation(() => {});
  const { work, id } = await obriEntrada();
  const original = verificador();
  await vi.advanceTimersByTimeAsync(10 * TIC_MS);
  // L'emergent.
  const mare = capaEfimera();
  window.sessionStorage.clear();
  vi.stubGlobal('opener', null);
  expect(window.name).toBe('');
  window.history.replaceState(null, '', `/?code=code&sdp_oauth_attempt=${id}`);
  const { resultat, escrites } = await escritesDe(() => gestionaTornada({}, config));
  expect(resultat).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(escrites.map(([clau]) => clau)).toEqual([STORAGE_PREFIX + _intern.clauTraspas(id)]);
  expect(window.location.search).toBe('');
  await vi.advanceTimersByTimeAsync(60);
  expect(window.close).toHaveBeenCalled();
  // La mare.
  posaCapaEfimera(mare);
  retransmet(escrites);
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: original });
  expect(usuariDeSessio()?.id).toBe('A');
  expect(verificador()).toBeNull();
  expect(espera(id)).toBeNull();
  expect(desat(id)).toBeNull();
});

/* Un navegador que copiara a l'emergent la capa efímera de la mare després
   d'obrir-lo [NO VERIFICAT que n'hi haja cap]: l'emergent veuria el verificador
   del seu id. El registre CAMI.EMERGENT mana igualment: passa el codi, no el
   bescanvia, i la mare no es queda esperant fins al termini. */
test('F1v2 · cadena COOP amb l’emergent que veu el verificador de la mare: el registre mana i el codi el bescanvia la mare', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  vi.spyOn(window, 'close').mockImplementation(() => {});
  const { work, id } = await obriEntrada();
  const original = verificador();
  vi.stubGlobal('opener', null);
  window.history.replaceState(null, '', `/?code=code&sdp_oauth_attempt=${id}`);
  const { resultat, escrites } = await escritesDe(() => gestionaTornada({}, config));
  expect(resultat).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  retransmet(escrites);
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: original });
});

/* Dos intents alhora en dues pestanyes. La segona pestanya és una segona
   instància dels mòduls (vi.resetModules), amb el seu intent actiu i la seua
   sessió; la capa efímera de cada pestanya es guarda i es torna a posar quan li
   toca. Els dos emergents fan servir el gestionaTornada de veres. Cada mare
   rep tots els esdeveniments `storage` i només consumix el del seu id. */
test('F1v2 · dos intents concurrents en dues pestanyes: cadascun es completa amb el seu codi i el seu verificador', async () => {
  const fetch = vi.fn(async (_url, opcions) => {
    const { auth_code: codi } = JSON.parse(opcions.body);
    return { ok: true, json: async () => ({ access_token: `tok-${codi}`, user: { id: codi } }) };
  });
  vi.stubGlobal('fetch', fetch);
  vi.spyOn(window, 'close').mockImplementation(() => {});
  // Pestanya A.
  const a = await obriEntrada();
  const capaA = capaEfimera();
  const verificadorA = verificador();
  // Pestanya B: una altra instància dels mòduls i una capa efímera buida.
  window.sessionStorage.clear();
  vi.resetModules();
  const pestanyaB = await import('./oauthRelay.js');
  const b = await obriEntrada(pestanyaB.entraAmbGoogle);
  const capaB = capaEfimera();
  const verificadorB = verificador();
  expect(a.id).not.toBe(b.id);
  expect(verificadorA).not.toBe(verificadorB);
  expect(espera(a.id)).toMatchObject({ cami: 'emergent' });
  expect(espera(b.id)).toMatchObject({ cami: 'emergent' });
  let acabadaA = false;
  a.work.then(() => { acabadaA = true; }, () => { acabadaA = true; });
  // Un missatge de l'emergent d'A amb l'id de B: A l'ignora.
  window.dispatchEvent(missatge(a.popup, { id: b.id, code: 'codi-B' }));
  await vi.advanceTimersByTimeAsync(0);
  expect(fetch).not.toHaveBeenCalled();
  // Torna primer l'emergent de B (opener null, sense capa efímera).
  vi.stubGlobal('opener', null);
  window.sessionStorage.clear();
  window.history.replaceState(null, '', `/?code=codi-B&sdp_oauth_attempt=${b.id}`);
  const tornadaB = await escritesDe(() => gestionaTornada({}, config));
  posaCapaEfimera(capaB);
  retransmet(tornadaB.escrites);   // arriba a les dues mares
  await expect(b.work).resolves.toMatchObject({ access_token: 'tok-codi-B' });
  expect(acabadaA).toBe(false);
  expect(espera(a.id)).toMatchObject({ cami: 'emergent' });
  // Després, el d'A.
  window.sessionStorage.clear();
  window.history.replaceState(null, '', `/?code=codi-A&sdp_oauth_attempt=${a.id}`);
  const tornadaA = await escritesDe(() => pestanyaB.gestionaTornada({}, config));
  posaCapaEfimera(capaA);
  retransmet(tornadaA.escrites);
  await expect(a.work).resolves.toMatchObject({ access_token: 'tok-codi-A' });
  expect(fetch.mock.calls.map(([, opcions]) => JSON.parse(opcions.body))).toEqual([
    { auth_code: 'codi-B', code_verifier: verificadorB },
    { auth_code: 'codi-A', code_verifier: verificadorA }
  ]);
  expect(espera(a.id)).toBeNull();
  expect(espera(b.id)).toBeNull();
});

/* ───────── F1-seguiments (Onada 4, 261003) · revisió adversarial de F1v2 ─────────
   Dades sintètiques i temporitzadors falsos. Un iframe d'un altre lloc, les
   particions d'emmagatzematge i COOP en un navegador de veres són [NO
   VERIFICAT] ací: la partició es simula buidant i tornant les capes. */

/* Les dues capes d'una pestanya, per a simular una partició. */
const capaLocal = () => Object.fromEntries(Object.keys(window.localStorage).map((k) => [k, window.localStorage.getItem(k)]));
const posaCapaLocal = (capa) => {
  window.localStorage.clear();
  for (const [k, v] of Object.entries(capa)) window.localStorage.setItem(k, v);
};
const index = () => getVal(_intern.CLAU_INDEX, null);
/* Una pestanya nova: una altra instància dels mòduls i una capa efímera buida.
   `cancela` n'avorta els intents (els d'este fitxer, l'afterEach). */
async function pestanyaNova() {
  window.sessionStorage.clear();
  vi.resetModules();
  const relay = await import('./oauthRelay.js');
  const { cancelAuthAttempts: cancela } = await import('./authAttempt.js');
  return { ...relay, cancela };
}

/* (1) host.js munta l'SPA dins d'un iframe d'un altre lloc. El localStorage
   de l'iframe és particionat pel lloc de dalt; l'emergent torna a la pàgina
   de l'SPA com a finestra de dalt, amb un altre emmagatzematge: no hi veu el
   registre del seu id. L'opener, sí (sense COOP). Abans: «S'ha perdut el
   verificador» a l'emergent, i la mare esperava fins al termini. */
test('F1-seguiments · iframe d’un altre lloc: l’emergent no veu el registre però té opener; passa el codi i la mare el bescanvia', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  vi.spyOn(window, 'close').mockImplementation(() => {});
  const { popup, work, id } = await obriEntrada();
  work.catch(() => {});   // si la prova cau abans, l'avort de l'afterEach no queda sense atendre
  const original = verificador();
  const mare = { local: capaLocal(), efimera: capaEfimera() };
  // L'emergent: la partició de dalt (cap registre), cap capa efímera i l'opener viu.
  window.localStorage.clear();
  window.sessionStorage.clear();
  const opener = { closed: false, postMessage: vi.fn() };
  vi.stubGlobal('opener', opener);
  window.history.replaceState({ usr: 'r' }, '', `/?filter=all&code=code&sdp_oauth_attempt=${id}`);
  expect(espera(id)).toBeNull();
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(opener.postMessage).toHaveBeenCalledTimes(1);
  expect(opener.postMessage).toHaveBeenCalledWith({ type: 'sdp:oauth', id, code: 'code' }, window.location.origin);
  // També el traspàs, a la seua partició, i l'id a l'índex de l'escombrada.
  expect(desat(id)).toMatchObject({ type: 'sdp:oauth', id, code: 'code' });
  expect(index()).toEqual({ [id]: expect.any(Number) });
  expect(window.location.search).toBe('?filter=all');
  expect(window.history.state).toEqual({ usr: 'r' });
  await vi.advanceTimersByTimeAsync(60);
  expect(window.close).toHaveBeenCalled();
  // La mare, a l'iframe: rep el missatge del seu emergent, del mateix origen.
  posaCapaLocal(mare.local);
  posaCapaEfimera(mare.efimera);
  window.dispatchEvent(missatge(popup, opener.postMessage.mock.calls[0][0]));
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: original });
  expect(usuariDeSessio()?.id).toBe('A');
  expect(espera(id)).toBeNull();
});

/* El registre és una pista. Un opener tancat o que és la mateixa finestra no
   és cap mare; un registre d'este id a la vista (caducat, o d'un camí 3 que ha
   perdut el verificador) diu que no som l'emergent d'un iframe. I amb COOP en
   un iframe (cap opener i el registre en una altra partició) cap camí no hi
   arriba: el límit conegut, l'error amable. */
test.each([
  ['un opener tancat (la mare ja no hi és)', () => ({ closed: true, postMessage: vi.fn() }), null],
  ['un opener que és la mateixa finestra', () => window, null],
  ['un registre de camí 3 a la vista', () => ({ closed: false, postMessage: vi.fn() }), { cami: 'redireccio' }],
  ['un registre caducat a la vista', () => ({ closed: false, postMessage: vi.fn() }), { cami: 'emergent', t: Date.now() - _intern.TEMPS_MAXIM_MS - 1 }],
  ['COOP en un iframe: cap opener i cap registre (límit conegut)', () => null, null]
])('F1-seguiments · %s: l’error amable, cap missatge, cap traspàs i no es tanca', async (_cas, fesOpener, registre) => {
  vi.spyOn(window, 'close').mockImplementation(() => {});
  const opener = fesOpener();
  vi.stubGlobal('opener', opener);
  if (registre) setVal(_intern.clauEspera(UN_ALTRE), { t: Date.now(), ...registre });
  window.history.replaceState(null, '', `/?code=code&sdp_oauth_attempt=${UN_ALTRE}`);
  const { resultat, escrites } = await escritesDe(() => gestionaTornada({}, config).catch((e) => e));
  expect(resultat.message).toMatch(/S'ha perdut el verificador/);
  expect(escrites).toEqual([]);
  if (vi.isMockFunction(opener?.postMessage)) expect(opener.postMessage).not.toHaveBeenCalled();
  expect(window.location.search).toBe('');
  await vi.advanceTimersByTimeAsync(100);
  expect(window.close).not.toHaveBeenCalled();
});

/* (3) Brossa a localStorage: el registre d'una mare que es tanca a mitja
   entrada, i el traspàs d'un emergent que torna quan la mare ja no hi és (porta
   un codi: sense el verificador no val res, però no s'hi ha de quedar). jsdom no
   envia `storage` a la mateixa finestra: la mare d'A no se n'assabenta, com si
   la pestanya ja no hi fóra. vi.setSystemTime avança el rellotge sense disparar
   el termini d'A, que amb la pestanya tancada no existiria. */
async function mareQueSeNVa() {
  const a = await obriEntrada();
  a.work.catch(() => {});
  window.sessionStorage.clear();
  vi.stubGlobal('opener', null);
  window.history.replaceState(null, '', `/?code=codi-A&sdp_oauth_attempt=${a.id}`);
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(espera(a.id)).toMatchObject({ cami: 'emergent' });
  expect(desat(a.id)).toMatchObject({ code: 'codi-A' });
  return a;
}

test('F1-seguiments · en començar una entrada s’escombren el registre i el traspàs vells; els frescos d’una altra pestanya es queden', async () => {
  vi.spyOn(window, 'close').mockImplementation(() => {});
  const a = await mareQueSeNVa();
  // Cent segons després, la pestanya C comença: els d'A encara són frescos i es queden.
  vi.setSystemTime(Date.now() + 100000);
  const c = await pestanyaNova();
  const tc = await obriEntrada(c.entraAmbGoogle);
  tc.work.catch(() => {});
  expect(espera(a.id)).toMatchObject({ cami: 'emergent' });
  expect(desat(a.id)).toMatchObject({ code: 'codi-A' });
  // Passat TEMPS_MAXIM_MS des d'A, la pestanya B comença: fora els d'A; el de C, fresc, es queda.
  vi.setSystemTime(Date.now() + _intern.TEMPS_MAXIM_MS - 100000 + 1);
  const b = await pestanyaNova();
  const tb = await obriEntrada(b.entraAmbGoogle);
  tb.work.catch(() => {});
  expect(espera(a.id)).toBeNull();
  expect(desat(a.id)).toBeNull();
  expect(espera(tc.id)).toMatchObject({ cami: 'emergent' });
  expect(espera(tb.id)).toMatchObject({ cami: 'emergent' });
  expect(Object.keys(index()).sort()).toEqual([tb.id, tc.id].sort());
  c.cancela(); b.cancela();
});

test('F1-seguiments · en processar la marca d’un intent també s’escombren els vells, i mai els frescos', async () => {
  vi.spyOn(window, 'close').mockImplementation(() => {});
  const a = await mareQueSeNVa();
  vi.setSystemTime(Date.now() + 100000);
  const c = await pestanyaNova();
  const tc = await obriEntrada(c.entraAmbGoogle);
  tc.work.catch(() => {});
  // Passat TEMPS_MAXIM_MS des d'A, torna l'emergent de C (opener null, sense capa efímera).
  vi.setSystemTime(Date.now() + _intern.TEMPS_MAXIM_MS - 100000 + 1);
  window.sessionStorage.clear();
  window.history.replaceState(null, '', `/?code=codi-C&sdp_oauth_attempt=${tc.id}`);
  expect(await c.gestionaTornada({}, config)).toBeNull();
  expect(espera(a.id)).toBeNull();
  expect(desat(a.id)).toBeNull();
  expect(espera(tc.id)).toMatchObject({ cami: 'emergent' });
  expect(desat(tc.id)).toMatchObject({ code: 'codi-C' });
  expect(Object.keys(index())).toEqual([tc.id]);
  c.cancela();
});

test('F1-seguiments · l’entrada acabada no deixa res seu a localStorage: ni registre, ni traspàs, ni índex', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  const { work, id } = await obriEntrada();
  expect(index()).toEqual({ [id]: expect.any(Number) });
  window.dispatchEvent(traspas(id, { code: 'code' }));
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(Object.keys(window.localStorage).filter((k) => k.includes('sdp:oauth:'))).toEqual([]);
});

/* (4) Sense opener i sense poder escriure el traspàs (emmagatzematge ple o
   blocat), el resultat no ix per cap camí. Abans, l'emergent es tancava igual:
   la persona no veia res i la mare esperava fins al termini. */
test('F1-seguiments · sense opener ni traspàs possible: l’emergent no es tanca i dona l’error amable; amb opener, sí que es tanca', async () => {
  vi.spyOn(window, 'close').mockImplementation(() => {});
  const original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (clau, valor) {
    if (String(clau).includes(_intern.PREFIX_TRASPAS)) throw new DOMException('Ple', 'QuotaExceededError');
    return original.call(this, clau, valor);
  });
  setVal(_intern.clauEspera(UN_ALTRE), { t: Date.now(), cami: 'emergent' });
  vi.stubGlobal('opener', null);
  window.history.replaceState(null, '', `/?filter=all&code=code&sdp_oauth_attempt=${UN_ALTRE}`);
  await expect(gestionaTornada({}, config)).rejects.toThrow('L’entrada no ha pogut tornar a la pàgina. Tanca esta finestra i torna a provar.');
  await vi.advanceTimersByTimeAsync(1000);
  expect(window.close).not.toHaveBeenCalled();
  expect(desat(UN_ALTRE)).toBeNull();
  expect(window.location.search).toBe('?filter=all');
  // Amb l'opener viu, el camí 1 n'ix encara que el traspàs falle: es tanca.
  const opener = { closed: false, postMessage: vi.fn() };
  vi.stubGlobal('opener', opener);
  window.history.replaceState(null, '', `/?code=code&sdp_oauth_attempt=${UN_ALTRE}`);
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(opener.postMessage).toHaveBeenCalledWith({ type: 'sdp:oauth', id: UN_ALTRE, code: 'code' }, window.location.origin);
  await vi.advanceTimersByTimeAsync(60);
  expect(window.close).toHaveBeenCalledTimes(1);
});

/* ───────── Revisió adversarial de F1-seguiments (261003) ─────────
   Dades sintètiques i temporitzadors falsos; el servidor de PKCE és fals. */

/* (a') i l'escombrada. La prova del «registre caducat a la vista» posa el
   registre a mà, fora de l'índex, i l'escombrada no el veu. En el flux de veres
   sempre hi és (desaEspera l'apunta): l'escombrada de tornadaDeGoogle l'esborrava
   ABANS de decidir (a'), i un opener viu feia passar el codi i tancar la
   finestra en compte de l'error amable. Ara el registre es mira abans. */
test('Revisió F1-seguiments · registre caducat i apuntat a l’índex, com en el flux de veres: error amable, cap missatge ni traspàs, no es tanca', async () => {
  vi.spyOn(window, 'close').mockImplementation(() => {});
  const { work, id } = await obriEntrada();
  work.catch(() => {});
  expect(index()).toEqual({ [id]: expect.any(Number) });
  // La mare ha deixat la pàgina sense netejar: el registre i l'índex es queden.
  vi.setSystemTime(Date.now() + _intern.TEMPS_MAXIM_MS + 1);
  // L'emergent torna tard, al mateix emmagatzematge, amb l'opener viu.
  window.sessionStorage.clear();
  const opener = { closed: false, postMessage: vi.fn() };
  vi.stubGlobal('opener', opener);
  window.history.replaceState(null, '', `/?code=code&sdp_oauth_attempt=${id}`);
  const { resultat, escrites } = await escritesDe(() => gestionaTornada({}, config).catch((e) => e));
  expect(resultat.message).toMatch(/S'ha perdut el verificador/);
  expect(opener.postMessage).not.toHaveBeenCalled();
  expect(escrites).toEqual([]);
  expect(desat(id)).toBeNull();
  // L'escombrada continua: el registre caducat ja no hi és.
  expect(espera(id)).toBeNull();
  expect(index()).toBeNull();
  expect(window.location.search).toBe('');
  await vi.advanceTimersByTimeAsync(100);
  expect(window.close).not.toHaveBeenCalled();
});

/* W4-02 amb (a'). Una pàgina oberta per un altre lloc (opener viu) amb una
   marca ben formada però falsa i un `code`: el codi només ix cap a este origen
   (el navegador no el lliura a un opener d'un altre origen) i el traspàs porta
   l'id fals. La mare que espera no en fa cas, i el seu codi es bescanvia amb el
   seu verificador. */
test('Revisió F1-seguiments · W4-02: una marca falsa amb opener no toca la mare que espera', async () => {
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  vi.spyOn(window, 'close').mockImplementation(() => {});
  const { popup, work, id } = await obriEntrada();
  const original = verificador();
  let acabada = false;
  work.then(() => { acabada = true; }, () => { acabada = true; });
  const mare = capaEfimera();
  // La pàgina falsa: una pestanya nova, oberta per un altre lloc.
  window.sessionStorage.clear();
  const daltreLloc = { closed: false, postMessage: vi.fn() };
  vi.stubGlobal('opener', daltreLloc);
  window.history.replaceState(null, '', `/?page_id=12&code=EVIL&sdp_oauth_attempt=${UN_ALTRE}`);
  const falsa = await escritesDe(() => gestionaTornada({}, config));
  expect(falsa.resultat).toBeNull();
  expect(daltreLloc.postMessage).toHaveBeenCalledTimes(1);
  expect(daltreLloc.postMessage.mock.calls[0][1]).toBe(window.location.origin);
  expect(window.location.search).toBe('?page_id=12');
  // La mare rep tot el que ha escrit la pàgina falsa, i un missatge amb el seu id d'una font que no és el seu emergent.
  vi.stubGlobal('opener', null);
  posaCapaEfimera(mare);
  retransmet(falsa.escrites);
  window.dispatchEvent(missatge({}, { id, code: 'EVIL' }));
  await vi.advanceTimersByTimeAsync(0);
  expect(fetch).not.toHaveBeenCalled();
  expect(acabada).toBe(false);
  expect(espera(id)).toMatchObject({ cami: 'emergent' });
  // El seu emergent: el bescanvi porta el seu codi i el seu verificador.
  window.dispatchEvent(missatge(popup, { id, code: 'code' }));
  await expect(work).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'code', code_verifier: original });
});

/* PKCE, encara que l'id es filtrara: un codi emés per al repte d'un altre
   arriba amb l'id de la mare. La mare el bescanvia amb el SEU verificador i el
   servidor (fals ací; GoTrue de veres NO VERIFICAT) el rebutja: cap sessió. */
test('Revisió F1-seguiments · PKCE: un codi d’un altre repte amb l’id de la mare no obri cap sessió', async () => {
  const emesos = { EVIL: 'verificador-de-qui-ataca' };
  const fetch = vi.fn(async (_url, opcions) => {
    const { auth_code: codi, code_verifier: verif } = JSON.parse(opcions.body);
    return emesos[codi] === verif ? sessioBona() : { ok: false, status: 400, text: async () => '{"error_code":"bad_code_verifier"}' };
  });
  vi.stubGlobal('fetch', fetch);
  const { work, id } = await obriEntrada();
  const original = verificador();
  window.dispatchEvent(traspas(id, { code: 'EVIL' }));
  await expect(work).rejects.toThrow(/\(400\)/);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'EVIL', code_verifier: original });
  expect(usuariDeSessio()).toBeNull();
  expect(verificador()).toBeNull();
  expect(espera(id)).toBeNull();
});
