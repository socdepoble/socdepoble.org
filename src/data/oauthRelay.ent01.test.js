/**
 * ENT-01 i ENT-08 (v1.2.25; auditoria 261125_0347, proposta atòmica 3) ·
 * L'ENTRADA AMB GOOGLE SENSE TEXT CRU.
 *   ENT-01 · Cap error d'oauthRelay.js no porta cap a la vista el text del
 *   proveïdor (access_denied, el JSON de GoTrue) ni el del navegador (Load
 *   failed, «signal is aborted without reason»): porta un `code` de
 *   CODI_ENTRADA i una frase pròpia, i el cru viatja a `cause`. La persona que
 *   diu «No» a Google rep CANCELADA_PROVEIDOR, que la vista calla; un
 *   access_denied amb un error_code més concret de GoTrue (signup_disabled…),
 *   també només al fragment, o amb un error_code present però buit, no és cap
 *   cancel·lació seua i és DESCONEGUT. Qualsevol error del bescanvi sense codi
 *   (un 200 que no és JSON, una sessió buida) és DESCONEGUT amb el cru a cause.
 *   ENT-08 · El fre de cinc entrades seguides rebutja amb MASSA_INTENTS i un
 *   text humà, i «Cancel·la l'entrada» (descomptaIntentDeGoogle) no compta.
 *   K-CAB-ENT0108 (v1.2.25, claus de G9) · Tres d'eixos error_code ja no són
 *   DESCONEGUT sinó un codi propi amb frase als cinc diccionaris:
 *   signup_disabled → ALTES_TANCADES, user_banned → COMPTE_SUSPES i
 *   provider_email_needs_verification → CORREU_GOOGLE_PENDENT. Qualsevol altre
 *   continua sent DESCONEGUT.
 */
import { webcrypto } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { backendScope } from '../config/backendConfig.js';
import { getEfimer, getVal, setEfimer, setVal } from '../config/storage.js';
import { cancelAuthAttempts } from './authAttempt.js';
import { CODI_ENTRADA } from './errorsBackend.js';
import ca from '../config/idiomes/ca.js';
import { esborraSessio, usuariDeSessio } from './identitat.js';
import { _intern, descomptaIntentDeGoogle, entraAmbGoogle, gestionaTornada } from './oauthRelay.js';

const config = () => ({ hasSupabaseConfig: true, supabaseUrl: 'https://backend.socdepoble.test', supabaseAnonKey: 'anon-key-publica' });
const ID = 'CCCCCCCCCCCCCCCCCCCCCC';
const CLAU_FRE = 'sdp:oauth:cb';
/* Una màquina carregada pot passar de l'espera per defecte (1 s) de vi.waitFor. */
const ESPERA = Object.freeze({ timeout: 5000 });
/* El text cru que no pot arribar mai al veí. */
const CRU = /access_denied|Signups|flow_state|error_code|\{|Load failed|aborted|Circuit Breaker/;

const obriPopupFals = () => {
  const popup = { location: { href: '' }, closed: false, close: vi.fn() };
  vi.spyOn(window, 'open').mockReturnValue(popup);
  return popup;
};
const intentDe = (popup) => new URL(new URL(popup.location.href).searchParams.get('redirect_to')).searchParams.get(_intern.PARAM_INTENT);
const rebuig = async (promesa) => {
  try { await promesa; } catch (error) { return error; }
  throw new Error('La promesa havia de rebutjar.');
};

/* Camí 3 · Esta pestanya té el verificador d'este id, i GoTrue hi torna amb `consulta` (i `fragment`). */
function tornadaDelCami3(consulta, fragment = '') {
  window.history.replaceState(null, '', `/registre?${consulta}&${_intern.PARAM_INTENT}=${ID}${fragment ? `#${fragment}` : ''}`);
  setEfimer(_intern.CLAU_VERIFICADOR, 'verificador-cami3');
  setEfimer(_intern.CLAU_INTENT, ID);
  setEfimer('sdp:oauth:backend', backendScope(config()));
  setVal(_intern.clauEspera(ID), { t: Date.now(), cami: _intern.CAMI.REDIRECCIO });
}

/* Camí 1 · L'emergent torna a la pàgina i li passa `dades` a la mare. */
async function errorPelCami1(dades) {
  vi.stubGlobal('crypto', webcrypto);
  const popup = obriPopupFals();
  const promesa = entraAmbGoogle({}, config);
  await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'), ESPERA);
  window.dispatchEvent(new MessageEvent('message', {
    origin: window.location.origin,
    source: popup,
    data: { type: 'sdp:oauth', id: intentDe(popup), ...dades },
  }));
  return rebuig(promesa);
}

afterEach(() => {
  cancelAuthAttempts();
  esborraSessio();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  window.sessionStorage.clear();   // també el comptador del fre
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('ENT-01 · l’error del proveïdor', () => {
  it('camí 1: la persona diu «No» a Google i rep CANCELADA_PROVEIDOR, sense el text del proveïdor', async () => {
    expect(CODI_ENTRADA.CANCELADA_PROVEIDOR).toBe('cancelada-proveidor');
    const error = await errorPelCami1({ error: 'access_denied' });
    expect(error.code).toBe('cancelada-proveidor');
    expect(error.message).not.toMatch(CRU);
    expect(error.message.length).toBeGreaterThan(10);
    expect(error.cause).toMatchObject({ error: 'access_denied' });
  });

  /* v1.2.25 · K-CAB-ENT0108 · Abans esperava DESCONEGUT: signup_disabled ara té codi propi (ALTES_TANCADES). No és
     cap afluixament: continua sense ser cap cancel·lació, sense text cru i amb el cru a cause; el codi és més
     concret. DESCONEGUT el conserva un error_code que no tenim traduït (prova de baix). */
  it('camí 1: un access_denied amb un error_code de GoTrue (signup_disabled) no és cap cancel·lació: ALTES_TANCADES, amb el cru a cause', async () => {
    const error = await errorPelCami1({ error: 'access_denied', error_code: 'signup_disabled' });
    expect(error.code).toBe('altes-tancades');
    expect(error.message).not.toMatch(CRU);
    expect(error.cause).toMatchObject({ error: 'access_denied', error_code: 'signup_disabled' });
  });

  /* v1.2.25 · K-CAB-ENT0108 · Els tres error_code de GoTrue que arriben com a access_denied i tenen una frase pròpia
     als cinc diccionaris (section.login.error.*): el codi, mai CANCELADA_PROVEIDOR ni DESCONEGUT, i el cru a cause. */
  const CODIS_PROPIS = [
    ['signup_disabled', 'altes-tancades', 'ALTES_TANCADES', 'section.login.error.altesTancades'],
    ['user_banned', 'compte-suspes', 'COMPTE_SUSPES', 'section.login.error.compteSuspes'],
    ['provider_email_needs_verification', 'correu-google-pendent', 'CORREU_GOOGLE_PENDENT', 'section.login.error.confirmaCorreuGoogle']
  ];
  it.each(CODIS_PROPIS)('camí 1: error_code %s → %s (CODI_ENTRADA.%s), mai cancel·lació ni DESCONEGUT', async (codiGoTrue, code, nom, clau) => {
    expect(CODI_ENTRADA[nom]).toBe(code);
    const error = await errorPelCami1({ error: 'access_denied', error_code: codiGoTrue });
    expect(error.code).toBe(code);
    expect(error.code).not.toBe(CODI_ENTRADA.CANCELADA_PROVEIDOR);
    expect(error.message).not.toMatch(CRU);
    /* La frase pròpia de l'adaptador és la valenciana del diccionari, byte a byte (no la genèrica de Google). */
    expect(error.message).toBe(ca[clau]);
    expect(error.cause).toEqual({ error: 'access_denied', error_code: codiGoTrue });
  });

  it.each(CODIS_PROPIS)('camí 3: error_code %s a la consulta → %s, i també quan només el porta el fragment', async (codiGoTrue, code) => {
    tornadaDelCami3(`error=access_denied&error_code=${codiGoTrue}&error_description=Text+cru+de+GoTrue`);
    const perConsulta = await rebuig(gestionaTornada({}, config));
    expect(perConsulta.code).toBe(code);
    expect(perConsulta.message).not.toMatch(CRU);
    expect(perConsulta.message).not.toMatch(/Text cru/);
    expect(perConsulta.cause).toEqual({ error: 'access_denied', error_code: codiGoTrue });
    tornadaDelCami3('', `error=access_denied&error_code=${codiGoTrue}&error_description=Text+cru+de+GoTrue`);
    const perFragment = await rebuig(gestionaTornada({}, config));
    expect(perFragment.code).toBe(code);
    expect(perFragment.cause).toEqual({ error: 'access_denied', error_code: codiGoTrue });
  });

  it('un error_code de GoTrue que no tenim traduït continua sent DESCONEGUT (mai silenci, mai un codi propi), i un codi heretat de l’objecte no compta', async () => {
    for (const codiGoTrue of ['unexpected_failure', 'toString', 'SIGNUP_DISABLED']) {
      const error = await errorPelCami1({ error: 'access_denied', error_code: codiGoTrue });
      expect([codiGoTrue, error.code]).toEqual([codiGoTrue, 'desconegut']);
      expect(error.cause).toEqual({ error: 'access_denied', error_code: codiGoTrue });
      cancelAuthAttempts();
      window.sessionStorage.clear();
    }
  });

  it('un error que no és access_denied amb error_code propi també té el codi propi (el codi el dona l’error_code)', async () => {
    const error = await errorPelCami1({ error: 'server_error', error_code: 'user_banned' });
    expect(error.code).toBe('compte-suspes');
    expect(error.cause).toEqual({ error: 'server_error', error_code: 'user_banned' });
  });

  it('l’emergent passa a la mare també l’error_code de GoTrue', async () => {
    /* L'emergent es tanca 60 ms després (passaALaMare): amb rellotges falsos, el
       tancament cau ací, sobre l'espia, i no tanca jsdom a una prova posterior. */
    vi.useFakeTimers();
    vi.stubGlobal('opener', null);
    const tanca = vi.spyOn(window, 'close').mockImplementation(() => {});
    setVal(_intern.clauEspera(ID), { t: Date.now(), cami: _intern.CAMI.EMERGENT });
    window.history.replaceState(null, '', `/?error=access_denied&error_code=signup_disabled&error_description=Signups+not+allowed+for+this+instance&${_intern.PARAM_INTENT}=${ID}`);
    expect(await gestionaTornada({}, config)).toBeNull();
    expect(getVal(_intern.clauTraspas(ID), null)).toMatchObject({ type: 'sdp:oauth', id: ID, error: 'access_denied', error_code: 'signup_disabled' });
    await vi.advanceTimersByTimeAsync(60);
    expect(tanca).toHaveBeenCalledTimes(1);
  });

  it('camí 3: gestionaTornada amb ?error=access_denied rebutja amb code i sense access_denied al missatge', async () => {
    tornadaDelCami3('error=access_denied&error_description=User+cancelled');
    const error = await rebuig(gestionaTornada({}, config));
    expect(error.code).toBe('cancelada-proveidor');
    expect(error.message).not.toMatch(CRU);
    expect(window.location.search).toBe('');
    expect(getEfimer(_intern.CLAU_VERIFICADOR, null)).toBeNull();
  });

  /* v1.2.25 · K-CAB-ENT0108 · Les dues proves següents esperaven DESCONEGUT; signup_disabled i user_banned ara tenen
     codi propi (ALTES_TANCADES i COMPTE_SUSPES). Continuen vigilant el mateix: mai silenci, cap text de GoTrue, el cru
     a cause i l'error_code del fragment compta. */
  it('camí 3: un error de GoTrue amb error_code és el seu codi (ALTES_TANCADES), mai silenci, i sense el text de GoTrue', async () => {
    tornadaDelCami3('error=access_denied&error_code=signup_disabled&error_description=Signups+not+allowed+for+this+instance');
    const error = await rebuig(gestionaTornada({}, config));
    expect(error.code).toBe('altes-tancades');
    expect(error.message).not.toMatch(CRU);
    expect(error.cause).toMatchObject({ error: 'access_denied', error_code: 'signup_disabled' });
  });

  it('camí 3: l’error_code que només porta el fragment també compta: user_banned és COMPTE_SUSPES, mai silenci', async () => {
    tornadaDelCami3('', 'error=access_denied&error_code=user_banned&error_description=User+is+banned');
    const error = await rebuig(gestionaTornada({}, config));
    expect(error.code).toBe('compte-suspes');
    expect(error.message).not.toMatch(CRU);
    expect(error.cause).toEqual({ error: 'access_denied', error_code: 'user_banned' });
  });

  it('camí 3: un error_code present però buit (un rebuig del servidor sense codi) és DESCONEGUT, mai silenci', async () => {
    tornadaDelCami3('error=access_denied&error_code=&error_description=Database+error+saving+new+user', 'error=access_denied&error_description=Database+error+saving+new+user');
    const error = await rebuig(gestionaTornada({}, config));
    expect(error.code).toBe('desconegut');
    expect(error.message).not.toMatch(CRU);
    expect(error.cause).toEqual({ error: 'access_denied', error_code: '' });
  });

  it('camí 3: un error_code buit al fragment compta igual que a la consulta', async () => {
    tornadaDelCami3('error=access_denied', 'error=access_denied&error_code=');
    const error = await rebuig(gestionaTornada({}, config));
    expect(error.code).toBe('desconegut');
    expect(error.cause).toEqual({ error: 'access_denied', error_code: '' });
  });

  it('camí 1: un error_code buit que l’emergent passa a la mare tampoc no és cap cancel·lació', async () => {
    const error = await errorPelCami1({ error: 'access_denied', error_code: '' });
    expect(error.code).toBe('desconegut');
    expect(error.cause).toEqual({ error: 'access_denied', error_code: '' });
  });

  it('l’emergent passa l’error_code buit tal com és, i cap quan GoTrue no en porta', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('opener', null);
    vi.spyOn(window, 'close').mockImplementation(() => {});
    const traspas = async (consulta) => {
      window.localStorage.clear();
      setVal(_intern.clauEspera(ID), { t: Date.now(), cami: _intern.CAMI.EMERGENT });
      window.history.replaceState(null, '', `/?${consulta}&${_intern.PARAM_INTENT}=${ID}`);
      expect(await gestionaTornada({}, config)).toBeNull();
      await vi.advanceTimersByTimeAsync(60);
      return getVal(_intern.clauTraspas(ID), null);
    };
    expect(await traspas('error=access_denied&error_code=&error_description=Database+error')).toMatchObject({ error: 'access_denied', error_code: '' });
    expect(Object.hasOwn(await traspas('error=access_denied&error_description=User+cancelled'), 'error_code')).toBe(false);
  });
});

describe('ENT-01 · el bescanvi PKCE', () => {
  it('una resposta 400 de GoTrue porta l’estat, mai el cos, dins del text; el cos va a cause', async () => {
    tornadaDelCami3('code=codi-de-google');
    const cos = '{"code":400,"error_code":"flow_state_not_found","msg":"invalid flow state, no valid flow state found"}';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400, text: async () => cos })));
    const error = await rebuig(gestionaTornada({}, config));
    expect(error.code).toBe('desconegut');
    expect(error.status).toBe(400);
    expect(error.message).toMatch(/\(400\)/);
    expect(error.message).not.toMatch(CRU);
    expect(error.cause).toMatchObject({ status: 400, cos });
    expect(usuariDeSessio()).toBeNull();
  });

  it('una resposta 5xx és SERVIDOR_INABASTABLE', async () => {
    tornadaDelCami3('code=codi-de-google');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, text: async () => 'Service Unavailable' })));
    const error = await rebuig(gestionaTornada({}, config));
    expect(error.code).toBe('servidor-inabastable');
    expect(error.message).not.toMatch(/Service Unavailable/);
  });

  it.each([[500, 'servidor-inabastable'], [499, 'desconegut']])('la frontera dels 5xx: una resposta %i és %s', async (status, code) => {
    tornadaDelCami3('code=codi-de-google');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status, text: async () => 'Internal Server Error' })));
    const error = await rebuig(gestionaTornada({}, config));
    expect(error.code).toBe(code);
    expect(error.status).toBe(status);
  });

  it('un 200 amb un cos que no és JSON és DESCONEGUT, mai el SyntaxError del navegador; el SyntaxError va a cause', async () => {
    tornadaDelCami3('code=codi-de-google');
    const sintaxi = new SyntaxError('Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => { throw sintaxi; } })));
    const error = await rebuig(gestionaTornada({}, config));
    expect(error.code).toBe('desconegut');
    expect(error.message).not.toMatch(/Unexpected token|DOCTYPE|JSON/);
    expect(error.message).not.toMatch(CRU);
    expect(error.cause).toBe(sintaxi);
    expect(usuariDeSessio()).toBeNull();
  });

  it('un 200 sense sessió és DESCONEGUT, amb el text de l’adaptador a cause', async () => {
    tornadaDelCami3('code=codi-de-google');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) })));
    const error = await rebuig(gestionaTornada({}, config));
    expect(error.code).toBe('desconegut');
    expect(error.cause?.message).toBe('El servidor no ha tornat cap sessió.');
    expect(error.message).not.toBe(error.cause.message);
  });

  it('el navegador sense xarxa (TypeError «Load failed») és SERVIDOR_INABASTABLE, amb el TypeError a cause', async () => {
    tornadaDelCami3('code=codi-de-google');
    const xarxa = new TypeError('Load failed');
    vi.stubGlobal('fetch', vi.fn(async () => { throw xarxa; }));
    const error = await rebuig(gestionaTornada({}, config));
    expect(error.code).toBe('servidor-inabastable');
    expect(error.message).not.toMatch(CRU);
    expect(error.cause).toBe(xarxa);
  });

  it('el topall de 12 s del bescanvi és SERVIDOR_INABASTABLE, mai «signal is aborted without reason»', async () => {
    vi.useFakeTimers();
    tornadaDelCami3('code=codi-de-google');
    vi.stubGlobal('fetch', vi.fn((_url, opcions) => new Promise((_resol, rebutja) => {
      opcions.signal.addEventListener('abort', () => rebutja(new DOMException('signal is aborted without reason', 'AbortError')));
    })));
    const promesa = rebuig(gestionaTornada({}, config));
    await vi.advanceTimersByTimeAsync(12001);
    const error = await promesa;
    expect(error.code).toBe('servidor-inabastable');
    expect(error.message).not.toMatch(CRU);
  });

  it('una cancel·lació a mig bescanvi continua sent un AbortError, sense codi: la vista la calla', async () => {
    tornadaDelCami3('code=codi-de-google');
    vi.stubGlobal('fetch', vi.fn((_url, opcions) => new Promise((_resol, rebutja) => {
      opcions.signal.addEventListener('abort', () => rebutja(opcions.signal.reason));
    })));
    const promesa = rebuig(gestionaTornada({}, config));
    await Promise.resolve();
    cancelAuthAttempts();
    const error = await promesa;
    expect(error.name).toBe('AbortError');
    // Un DOMException porta el codi numèric llegat (20), mai cap de CODI_ENTRADA.
    expect(Object.values(CODI_ENTRADA)).not.toContain(error.code);
  });
});

describe('ENT-08 · el fre de les entrades seguides', () => {
  const entra = () => { const p = entraAmbGoogle({}, config); p.catch(() => {}); return p; };

  it('5 crides seguides: la cinquena rebutja amb MASSA_INTENTS i un text humà, sense obrir cap finestra', async () => {
    vi.stubGlobal('crypto', webcrypto);
    obriPopupFals();
    for (let i = 0; i < 4; i += 1) entra();
    const error = await rebuig(entra());
    expect(error.code).toBe('massa-intents');
    expect(error.message).not.toMatch(CRU);
    expect(error.message.length).toBeGreaterThan(10);
    expect(window.open).toHaveBeenCalledTimes(4);
  });

  it('«Cancel·la l’entrada» no compta: amb una cancel·lació, la cinquena entra i la sisena ja no', async () => {
    vi.stubGlobal('crypto', webcrypto);
    obriPopupFals();
    for (let i = 0; i < 4; i += 1) entra();
    descomptaIntentDeGoogle();
    expect(getEfimer(CLAU_FRE, null)).toMatchObject({ count: 3 });
    entra();
    expect(window.open).toHaveBeenCalledTimes(5);
    expect((await rebuig(entra())).code).toBe('massa-intents');
  });

  it('descomptar no baixa de zero ni falla amb un comptador absent o malmés', () => {
    expect(() => descomptaIntentDeGoogle()).not.toThrow();
    expect(getEfimer(CLAU_FRE, null)).toBeNull();
    setEfimer(CLAU_FRE, 'brossa');
    expect(() => descomptaIntentDeGoogle()).not.toThrow();
    setEfimer(CLAU_FRE, { count: 0, time: Date.now() });
    descomptaIntentDeGoogle();
    expect(getEfimer(CLAU_FRE, null)).toMatchObject({ count: 0 });
  });
});
