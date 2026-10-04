// @vitest-environment-options {"url": "https://host.example/wordpress/"}
/* W4-02 · Onada 4, quarta passada (261003) · Auditoria de Codex 261003_1950
   (reproducció de les 21:17, «no tancar W4-02 encara») i directriu de MarIA
   261003_2221. Un WordPress amb `?page_id=12&code=HOST-COUPON&state=HOST-STATE`
   perdia el seu code i el seu state quan l'entrada amb Google feia la
   redirecció completa (camí 3: emergent bloquejat, app instal·lada o registre
   fallit): la tornada els llevava abans d'eixir (dos `code` no hi caben) i, de
   tornada, la pàgina acabava en `?page_id=12&filter=all`.
   Ara, abans d'eixir, la pestanya guarda una INSTANTÀNIA per id a la capa
   efímera: la URL literal i el seu history.state. El callback continua sense
   els paràmetres aliens. Només quan la tornada és nostra (marca + verificador
   d'eixe id), la pàgina torna a ser exactament la d'abans, amb èxit o amb error.
   jsdom no navega: l'anada s'observa a _intern.redirigeix i la tornada de
   GoTrue es reprodueix (q.Set + q.Encode, que ordena les claus). Dades
   sintètiques; el servidor de PKCE és fals. Google i GoTrue de veres,
   [NO VERIFICAT] ací. */
import { afterEach, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { getEfimer, setEfimer, delEfimer } from '../config/storage.js';
import { esborraSessio, usuariDeSessio } from './identitat.js';
import { cancelAuthAttempts } from './authAttempt.js';
import { _intern, entraAmbGoogle, gestionaTornada } from './oauthRelay.js';

const ORIGEN = 'https://host.example';
/* La reproducció de Codex, literal. */
const CUPO = '/wordpress/?page_id=12&code=HOST-COUPON&state=HOST-STATE&filter=all';
const ESTAT_AMFITRIO = Object.freeze({ amfitrio: 'wordpress', pas: 3, llista: [1, 'dos', null, true], niu: { a: { b: 0.5 } } });
const UN_ALTRE = 'unAltreIntentDeProva_1';   // un id ben format (22 caràcters) d'un altre intent
const config = () => ({ hasSupabaseConfig: true, supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'public' });
const sessioBona = () => ({ ok: true, json: async () => ({ access_token: 'synthetic', user: { id: 'A' } }) });
const vesA = (ruta, estat = null) => window.history.replaceState(estat, '', ruta);
const instantania = (id) => getEfimer(_intern.PREFIX_INSTANTANIA + id, null);
const ara = () => window.location.href;

/* Les tres entrades del camí 3 (vegeu la capçalera d'oauthRelay.js). */
const ENTRADES = Object.freeze({
  'emergent bloquejat': () => { vi.spyOn(window, 'open').mockReturnValue(null); },
  'app instal·lada': () => {
    vi.stubGlobal('matchMedia', vi.fn((consulta) => ({ matches: consulta === '(display-mode: standalone)', media: consulta })));
  },
  'registre de l’emergent fallit': () => {
    vi.spyOn(window, 'open').mockReturnValue({ location: {}, closed: false, close: vi.fn() });
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (clau, valor) {
      if (String(clau).includes(_intern.PREFIX_ESPERA)) throw new DOMException('Ple', 'QuotaExceededError');
      return original.call(this, clau, valor);
    });
  }
});

/* L'anada: la persona és a `ruta` amb `estat`, prem Google i la pestanya se
   n'va per redirecció completa. Torna l'id, la tornada demanada a GoTrue i el
   verificador que s'ha quedat a la pestanya. */
async function anada(ruta, estat, entrada = 'emergent bloquejat') {
  vesA(ruta, estat);
  vi.stubGlobal('crypto', webcrypto);
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  ENTRADES[entrada]();
  entraAmbGoogle({}, config).catch(() => {});
  await vi.waitFor(() => expect(redirigeix).toHaveBeenCalledTimes(1));
  const tornada = new URL(redirigeix.mock.calls[0][0]).searchParams.get('redirect_to');
  const id = new URL(tornada).searchParams.get('sdp_oauth_attempt');
  const verificador = getEfimer(_intern.CLAU_VERIFICADOR, null);
  // La pestanya se n'ha anat: l'intent de l'anada ja no espera res.
  vi.restoreAllMocks();
  cancelAuthAttempts();
  return { id, tornada, verificador };
}

/* GoTrue torna a la tornada amb el resultat: prepPKCERedirectURL fa
   q.Set(...) i u.RawQuery = q.Encode(), que ordena les claus. És un document
   nou: history.state val null. */
function tornaDeGoTrue(tornada, resultat) {
  const u = new URL(tornada);
  for (const [clau, valor] of Object.entries(resultat)) u.searchParams.set(clau, valor);
  u.searchParams.sort();
  vesA(u.pathname + u.search, null);
}

afterEach(() => {
  cancelAuthAttempts(); esborraSessio(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  window.sessionStorage.clear();   // també el comptador del Circuit Breaker
  window.localStorage.clear();
  vesA('/wordpress/');
});

test('premissa: la pàgina de l’amfitrió de les proves', () => {
  expect(ara()).toBe(`${ORIGEN}/wordpress/`);
});

test('W4-02 · la reproducció de Codex: després d’entrar per redirecció completa, la barra d’adreces i history.state tornen a ser exactament els de WordPress', async () => {
  const { id, tornada, verificador } = await anada(CUPO, ESTAT_AMFITRIO);
  // El callback i la URL original van per separat: el code i el state de WordPress no viatgen a GoTrue.
  expect(tornada).toBe(`${ORIGEN}/wordpress/?page_id=12&filter=all&sdp_oauth_attempt=${id}`);
  // La instantània d'este id: la URL literal i el seu history.state; cap secret.
  expect(instantania(id)).toEqual({ v: 1, t: expect.any(Number), url: ORIGEN + CUPO, estat: ESTAT_AMFITRIO, nota: null });
  expect(JSON.stringify(instantania(id))).not.toContain(verificador);
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  tornaDeGoTrue(tornada, { code: 'codi-de-google' });
  // Els dos code no xoquen: a la tornada només hi ha el de GoTrue.
  expect(new URLSearchParams(window.location.search).getAll('code')).toEqual(['codi-de-google']);
  await expect(gestionaTornada({}, config)).resolves.toMatchObject({ access_token: 'synthetic' });
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'codi-de-google', code_verifier: verificador });
  expect(usuariDeSessio()?.id).toBe('A');
  expect(ara()).toBe(ORIGEN + CUPO);
  expect(window.history.state).toEqual(ESTAT_AMFITRIO);
  // Consumida, i el verificador també.
  expect(instantania(id)).toBeNull();
  expect(getEfimer(_intern.CLAU_VERIFICADOR, null)).toBeNull();
  // Una recàrrega no la torna a processar: sense la nostra marca, la pàgina és de WordPress.
  const replace = vi.spyOn(window.history, 'replaceState');
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(replace).not.toHaveBeenCalled();
  expect(ara()).toBe(ORIGEN + CUPO);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test.each(Object.keys(ENTRADES))('W4-02 · camí 3 per «%s»: la instantània es desa abans d’eixir i es restaura de tornada', async (entrada) => {
  const { id, tornada } = await anada(CUPO, ESTAT_AMFITRIO, entrada);
  expect(instantania(id)).toMatchObject({ url: ORIGEN + CUPO, estat: ESTAT_AMFITRIO, nota: null });
  vi.stubGlobal('fetch', vi.fn(async () => sessioBona()));
  tornaDeGoTrue(tornada, { code: 'code' });
  await gestionaTornada({}, config);
  expect(ara()).toBe(ORIGEN + CUPO);
  expect(window.history.state).toEqual(ESTAT_AMFITRIO);
});

test('W4-02 · amb l’emergent (camí 1 i 2) no es desa cap instantània: la pàgina no se’n va', async () => {
  vi.stubGlobal('crypto', webcrypto);
  vesA(CUPO, ESTAT_AMFITRIO);
  const popup = { location: {}, closed: false, close: vi.fn() };
  vi.spyOn(window, 'open').mockReturnValue(popup);
  const work = entraAmbGoogle({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  const id = getEfimer(_intern.CLAU_INTENT, null);
  expect(instantania(id)).toBeNull();
  cancelAuthAttempts(); await result;
  expect(ara()).toBe(ORIGEN + CUPO);
});

test('W4-02 · consulta duplicada i codificada, un error alié i el fragment: tornen literals, byte a byte', async () => {
  const ruta = '/wordpress/?a=1&a=2&code=HOST%20COUPON&q=caf%C3%A9&r=a%2Bb+c&buit&state=HOST-STATE&error=HOST-ERR#seccio-2';
  vesA(ruta);
  expect(ara()).toBe(ORIGEN + ruta);   // premissa: jsdom no la reescriu
  const { id, tornada } = await anada(ruta, { pas: 1 });
  // El callback lleva els aliens que xocarien amb GoTrue (code, state, error) i el fragment; la resta, literal.
  expect(tornada).toBe(`${ORIGEN}/wordpress/?a=1&a=2&q=caf%C3%A9&r=a%2Bb+c&buit&sdp_oauth_attempt=${id}`);
  expect(instantania(id).url).toBe(ORIGEN + ruta);
  vi.stubGlobal('fetch', vi.fn(async () => sessioBona()));
  tornaDeGoTrue(tornada, { code: 'code' });
  expect(window.location.search).not.toBe(new URL(ORIGEN + ruta).search);   // GoTrue l'ha reescrita
  await gestionaTornada({}, config);
  expect(ara()).toBe(ORIGEN + ruta);
  expect(window.location.hash).toBe('#seccio-2');
  expect(window.history.state).toEqual({ pas: 1 });
});

test('W4-02 · el proveïdor torna un error (la persona cancel·la a Google): la pàgina també torna a ser la d’abans', async () => {
  const { id, tornada } = await anada(CUPO, ESTAT_AMFITRIO);
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  tornaDeGoTrue(tornada, { error: 'access_denied', error_code: 'access_denied', error_description: 'Denegat' });
  await expect(gestionaTornada({}, config)).rejects.toThrow('access_denied');
  expect(fetch).not.toHaveBeenCalled();
  expect(ara()).toBe(ORIGEN + CUPO);
  expect(window.history.state).toEqual(ESTAT_AMFITRIO);
  expect(instantania(id)).toBeNull();
  expect(getEfimer(_intern.CLAU_VERIFICADOR, null)).toBeNull();
});

test('W4-02 · el bescanvi falla (400): la tornada era nostra i la pàgina també torna a ser la d’abans', async () => {
  const { tornada } = await anada(CUPO, ESTAT_AMFITRIO);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400, text: async () => '{"error_code":"bad_code_verifier"}' })));
  tornaDeGoTrue(tornada, { code: 'code' });
  await expect(gestionaTornada({}, config)).rejects.toThrow(/\(400\)/);
  expect(usuariDeSessio()).toBeNull();
  expect(ara()).toBe(ORIGEN + CUPO);
  expect(window.history.state).toEqual(ESTAT_AMFITRIO);
});

test('W4-02 · sense instantània, com abans: es lleven només els nostres paràmetres i la pàgina es queda en el callback', async () => {
  const { id, tornada } = await anada(CUPO, ESTAT_AMFITRIO);
  delEfimer(_intern.PREFIX_INSTANTANIA + id);
  vi.stubGlobal('fetch', vi.fn(async () => sessioBona()));
  tornaDeGoTrue(tornada, { code: 'code' });
  await gestionaTornada({}, config);
  expect(usuariDeSessio()?.id).toBe('A');
  expect(ara()).toBe(`${ORIGEN}/wordpress/?filter=all&page_id=12`);
  expect(window.history.state).toBeNull();
});

test('W4-02 · si la instantània no es pot desar, l’entrada continua igual i la tornada fa el de sempre', async () => {
  const original = Storage.prototype.setItem;
  vesA(CUPO, ESTAT_AMFITRIO);
  vi.stubGlobal('crypto', webcrypto);
  vi.spyOn(window, 'open').mockReturnValue(null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (clau, valor) {
    if (String(clau).includes(_intern.PREFIX_INSTANTANIA)) throw new DOMException('Ple', 'QuotaExceededError');
    return original.call(this, clau, valor);
  });
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  entraAmbGoogle({}, config).catch(() => {});
  await vi.waitFor(() => expect(redirigeix).toHaveBeenCalledTimes(1));
  const tornada = new URL(redirigeix.mock.calls[0][0]).searchParams.get('redirect_to');
  const id = new URL(tornada).searchParams.get('sdp_oauth_attempt');
  vi.restoreAllMocks(); cancelAuthAttempts();
  expect(instantania(id)).toBeNull();
  vi.stubGlobal('fetch', vi.fn(async () => sessioBona()));
  tornaDeGoTrue(tornada, { code: 'code' });
  await gestionaTornada({}, config);
  expect(usuariDeSessio()?.id).toBe('A');
  expect(ara()).toBe(`${ORIGEN}/wordpress/?filter=all&page_id=12`);
});

test('W4-02 · una URL més llarga que el topall no es guarda: cap instantània i la tornada de sempre', async () => {
  const ruta = `/wordpress/?page_id=12&code=HOST-COUPON&llarg=${'x'.repeat(_intern.LONGITUD_MAXIMA_INSTANTANIA)}`;
  const { id, tornada } = await anada(ruta, ESTAT_AMFITRIO);
  expect(instantania(id)).toBeNull();
  vi.stubGlobal('fetch', vi.fn(async () => sessioBona()));
  tornaDeGoTrue(tornada, { code: 'code' });
  await gestionaTornada({}, config);
  expect(ara()).toBe(`${ORIGEN}/wordpress/`);
});

test('W4-02 · la instantània d’un altre id no es restaura mai, i no es toca', async () => {
  const { id, tornada } = await anada(CUPO, ESTAT_AMFITRIO);
  delEfimer(_intern.PREFIX_INSTANTANIA + id);
  const daltre = { v: 1, t: Date.now(), url: `${ORIGEN}/wordpress/?altra=1`, estat: { altra: true }, nota: null };
  setEfimer(_intern.PREFIX_INSTANTANIA + UN_ALTRE, daltre);
  vi.stubGlobal('fetch', vi.fn(async () => sessioBona()));
  tornaDeGoTrue(tornada, { code: 'code' });
  await gestionaTornada({}, config);
  expect(ara()).toBe(`${ORIGEN}/wordpress/?filter=all&page_id=12`);
  expect(window.history.state).toBeNull();
  expect(instantania(UN_ALTRE)).toEqual(daltre);
});

test('W4-02 · una tornada que no és nostra no restaura mai la instantània: sense marca, amb marca repetida o sense el verificador d’eixe id', async () => {
  const { id, tornada } = await anada(CUPO, ESTAT_AMFITRIO);
  const desada = instantania(id);
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  // Sense marca: la pàgina de WordPress amb el seu code. Cap efecte.
  vesA('/wordpress/?page_id=12&code=HOST-COUPON', { wp: 1 });
  const replace = vi.spyOn(window.history, 'replaceState');
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(replace).not.toHaveBeenCalled();
  // La marca repetida no és cap marca.
  vesA(`/wordpress/?code=code&sdp_oauth_attempt=${id}&sdp_oauth_attempt=${id}`, { wp: 2 });
  replace.mockClear();
  expect(await gestionaTornada({}, config)).toBeNull();
  expect(replace).not.toHaveBeenCalled();
  expect(instantania(id)).toEqual(desada);
  // La marca d'este id, però la pestanya ja espera un altre intent: el verificador no és d'este id.
  setEfimer(_intern.CLAU_INTENT, UN_ALTRE);
  tornaDeGoTrue(tornada, { code: 'code' });
  await expect(gestionaTornada({}, config)).rejects.toThrow(/S'ha perdut el verificador/);
  expect(ara()).toBe(`${ORIGEN}/wordpress/?filter=all&page_id=12`);
  expect(window.history.state).toBeNull();
  expect(instantania(id)).toEqual(desada);
  expect(fetch).not.toHaveBeenCalled();
});

test('W4-02 · una instantània caducada no es restaura (cap avant ni cap arrere en el rellotge), però es consumix', async () => {
  /* Cap avant, el doble de la vigència: els mil·lisegons de la prova no la tornen a fer vigent. */
  for (const desplacament of [-(_intern.VIGENCIA_INSTANTANIA_MS + 1), 2 * _intern.VIGENCIA_INSTANTANIA_MS]) {
    window.sessionStorage.clear();
    const { id, tornada } = await anada(CUPO, ESTAT_AMFITRIO);
    setEfimer(_intern.PREFIX_INSTANTANIA + id, { ...instantania(id), t: Date.now() + desplacament });
    vi.stubGlobal('fetch', vi.fn(async () => sessioBona()));
    tornaDeGoTrue(tornada, { code: 'code' });
    await gestionaTornada({}, config);
    expect(ara(), String(desplacament)).toBe(`${ORIGEN}/wordpress/?filter=all&page_id=12`);
    expect(instantania(id)).toBeNull();
    esborraSessio();
  }
});

test('W4-02 · una instantània manipulada no navega mai ni obri cap redirector: no es restaura', async () => {
  const dolentes = [
    { url: 'https://atacant.example/wordpress/?page_id=12' },
    { url: 'http://host.example/wordpress/?page_id=12' },
    { url: '//atacant.example/wordpress/' },
    { url: '/wordpress/?page_id=12' },
    { url: 'javascript:alert(1)' },
    { url: 'https://usuari:clau@host.example/wordpress/' },
    { url: `${ORIGEN}/${'x'.repeat(_intern.LONGITUD_MAXIMA_INSTANTANIA)}` },
    // Revisió · una tornada nostra (marca i code de GoTrue) i un fragment amb tokens: capturaInstantania no els desa mai.
    { url: `${ORIGEN}/wordpress/?page_id=12&code=codi-vell&sdp_oauth_attempt=${UN_ALTRE}` },
    { url: `${ORIGEN}/wordpress/?page_id=12#access_token=JWT-SINTETIC` },
    { v: 2 },
    { nota: 'una-altra' },
    { estat: { data: '2026-10-03' }, nota: 'no-serialitzable' },
    { t: 'ara' }
  ];
  for (const canvi of dolentes) {
    window.sessionStorage.clear();   // el Circuit Breaker compta cada entrada d'este bucle
    const { id, tornada } = await anada(CUPO, ESTAT_AMFITRIO);
    setEfimer(_intern.PREFIX_INSTANTANIA + id, { ...instantania(id), ...canvi });
    vi.stubGlobal('fetch', vi.fn(async () => sessioBona()));
    tornaDeGoTrue(tornada, { code: 'code' });
    const replace = vi.spyOn(window.history, 'replaceState');
    await gestionaTornada({}, config);
    const destins = replace.mock.calls.map(([, , url]) => new URL(url, window.location.href).origin);
    expect(destins.every((origen) => origen === ORIGEN), JSON.stringify(canvi)).toBe(true);
    expect(ara(), JSON.stringify(canvi)).toBe(`${ORIGEN}/wordpress/?filter=all&page_id=12`);
    vi.restoreAllMocks();
    esborraSessio();
  }
});

test('W4-02 · un history.state que no és JSON pla no es guarda: nota, la URL es restaura i es conserva l’estat d’ara', async () => {
  for (const [estat, nota] of [
    [new Map([['a', 1]]), 'no-serialitzable'],
    [{ quan: new Date(0) }, 'no-serialitzable'],
    [{ gran: 'x'.repeat(_intern.LONGITUD_MAXIMA_INSTANTANIA) }, 'massa-gran']
  ]) {
    window.sessionStorage.clear();
    const { id, tornada } = await anada(CUPO, estat);
    expect(instantania(id)).toMatchObject({ url: ORIGEN + CUPO, estat: null, nota });
    vi.stubGlobal('fetch', vi.fn(async () => sessioBona()));
    tornaDeGoTrue(tornada, { code: 'code' });
    window.history.replaceState({ delRouter: 'nou' }, '', window.location.href);
    await gestionaTornada({}, config);
    expect(ara(), nota).toBe(ORIGEN + CUPO);
    expect(window.history.state, nota).toEqual({ delRouter: 'nou' });
    esborraSessio();
  }
});

/* Revisió adversarial de la quarta passada (261003) · Una URL que porta la
   nostra marca és una tornada nostra: el seu code és de GoTrue. Amb una xarxa
   lenta, el bescanvi del primer intent encara és en curs quan la persona torna
   a prémer Google. La instantània del segon no pot guardar el code ni la marca
   del primer: restaurada, deixaria a la barra una marca sense verificador, i
   la recàrrega següent donaria «S'ha perdut el verificador».
   Sisena passada (261004) · El reintent (Codex 261003_1950, «el segon intent
   perd la instantània de l'amfitrió»): el segon tampoc no pot quedar-se sense
   cap instantània. Hereta l'original del primer, literal i amb la seua hora,
   i torna al cupó, al state i al history.state de WordPress, amb èxit i amb
   error. */

/* El bescanvi del primer intent no respon encara; un avort el talla, com un fetch de veres. */
const bescanviPenjat = () => vi.fn((_url, opcions) => new Promise((_resol, rebutja) => {
  opcions.signal.addEventListener('abort', () => rebutja(new DOMException('Avortat.', 'AbortError')));
}));

/* La persona torna a prémer Google amb el bescanvi del primer en curs: emergent
   bloquejat, camí 3. Torna l'id i la tornada del segon. */
async function segonIntent(primerBescanvi) {
  vi.stubGlobal('crypto', webcrypto);
  vi.spyOn(window, 'open').mockReturnValue(null);
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  entraAmbGoogle({}, config).catch(() => {});
  await vi.waitFor(() => expect(redirigeix).toHaveBeenCalledTimes(1));
  expect(await primerBescanvi).toMatchObject({ name: 'AbortError' });
  const tornada = new URL(redirigeix.mock.calls[0][0]).searchParams.get('redirect_to');
  const id = new URL(tornada).searchParams.get('sdp_oauth_attempt');
  vi.restoreAllMocks(); cancelAuthAttempts();
  return { id, tornada };
}

/* Els dos finals de la tornada del segon: el bescanvi va bé, o la persona
   cancel·la a Google. */
const FINALS_DEL_SEGON = Object.freeze({
  'amb èxit': {
    resultat: { code: 'codi-2' },
    tornada: (promesa) => expect(promesa).resolves.toMatchObject({ access_token: 'synthetic' }),
    codis: ['codi-2'],
    usuari: 'A'
  },
  'amb l’error del proveïdor': {
    resultat: { error: 'access_denied', error_code: 'access_denied', error_description: 'Denegat' },
    tornada: (promesa) => expect(promesa).rejects.toThrow('access_denied'),
    codis: [],
    usuari: undefined
  }
});

test.each(Object.keys(FINALS_DEL_SEGON))('W4-02 · revisió: prémer Google amb una tornada nostra a la barra (bescanvi en curs) no guarda el code ni la marca de GoTrue, i el segon torna a WordPress %s', async (final) => {
  const cas = FINALS_DEL_SEGON[final];
  const primer = await anada(CUPO, ESTAT_AMFITRIO);
  const original = instantania(primer.id);
  vi.stubGlobal('fetch', bescanviPenjat());
  tornaDeGoTrue(primer.tornada, { code: 'codi-1' });
  const primerBescanvi = gestionaTornada({}, config).catch((error) => error);
  expect(ara()).toContain(`sdp_oauth_attempt=${primer.id}`);
  const { id, tornada } = await segonIntent(primerBescanvi);
  // El final del primer torna la pàgina de WordPress mentre el segon se'n va.
  expect(ara()).toBe(ORIGEN + CUPO);
  expect(window.history.state).toEqual(ESTAT_AMFITRIO);
  // El callback del segon no porta res del primer.
  expect(tornada).toBe(`${ORIGEN}/wordpress/?filter=all&page_id=12&sdp_oauth_attempt=${id}`);
  const desada = JSON.stringify(instantania(id));
  expect(desada).not.toContain('codi-1');
  expect(desada).not.toContain(primer.id);
  // El segon hereta l'original del primer, literal i amb la seua hora: cap rellotge nou.
  expect(instantania(id)).toEqual(original);
  // La tornada del segon acaba exactament en la pàgina de WordPress.
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  tornaDeGoTrue(tornada, cas.resultat);
  await cas.tornada(gestionaTornada({}, config));
  expect(fetch.mock.calls.map(([, opcions]) => JSON.parse(opcions.body).auth_code)).toEqual(cas.codis);
  expect(usuariDeSessio()?.id).toBe(cas.usuari);
  expect(ara()).toBe(ORIGEN + CUPO);
  const consulta = new URLSearchParams(window.location.search);
  expect(consulta.getAll('code')).toEqual(['HOST-COUPON']);
  expect(consulta.getAll('state')).toEqual(['HOST-STATE']);
  expect(window.history.state).toEqual(ESTAT_AMFITRIO);
  expect(ara()).not.toContain('sdp_oauth_attempt');
  expect(ara()).not.toContain('codi-1');
  expect(instantania(id)).toBeNull();
  // I una recàrrega no hi troba cap tornada nostra: cap error i cap canvi.
  await expect(gestionaTornada({}, config)).resolves.toBeNull();
  expect(ara()).toBe(ORIGEN + CUPO);
});

/* Sisena passada (261004) · L'herència té guardes: només la del bescanvi en
   curs d'esta pestanya i encara actiu, només si la barra és encara el seu
   callback i només si la instantània no ha caducat. Fora d'elles, el segon fa
   el de sempre. */
const SENSE_HERENCIA = Object.freeze({
  'un bescanvi ja cancel·lat': () => { cancelAuthAttempts(); },
  'una navegació aliena durant el bescanvi': () => {
    vesA(`${window.location.pathname}${window.location.search}#comentaris`, { wp: 'altre' });
  },
  'una instantània caducada pel camí': () => {
    const ara = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(ara + _intern.VIGENCIA_INSTANTANIA_MS + 1);
  }
});

test.each(Object.keys(SENSE_HERENCIA))('W4-02 · reintent: amb %s, el segon no hereta res i fa el de sempre', async (cas) => {
  const primer = await anada(CUPO, ESTAT_AMFITRIO);
  vi.stubGlobal('fetch', bescanviPenjat());
  tornaDeGoTrue(primer.tornada, { code: 'codi-1' });
  const primerBescanvi = gestionaTornada({}, config).catch((error) => error);
  SENSE_HERENCIA[cas]();
  const { id, tornada } = await segonIntent(primerBescanvi);
  expect(instantania(id)).toBeNull();
  vi.stubGlobal('fetch', vi.fn(async () => sessioBona()));
  tornaDeGoTrue(tornada, { code: 'codi-2' });
  await gestionaTornada({}, config);
  expect(usuariDeSessio()?.id).toBe('A');
  expect(ara()).toBe(`${ORIGEN}/wordpress/?filter=all&page_id=12`);
  expect(window.history.state).toBeNull();
});

/* Revisió adversarial · «Cap secret»: uns tokens al fragment (l'enllaç d'una
   alta que GoTrue ha fet caure a la Site URL sense la nostra marca, o l'entrada
   implícita de l'amfitrió) no entren a la capa efímera. La consulta de
   l'amfitrió, sí: el cupó torna. */
test('W4-02 · revisió: un fragment amb tokens no es guarda en la instantània; la consulta de l’amfitrió sí', async () => {
  const ruta = '/wordpress/?page_id=12&code=HOST-COUPON#access_token=JWT-SINTETIC&refresh_token=RT-SINTETIC&type=signup';
  const { id, tornada } = await anada(ruta, ESTAT_AMFITRIO);
  const desada = JSON.stringify(instantania(id));
  expect(desada).not.toContain('JWT-SINTETIC');
  expect(desada).not.toContain('RT-SINTETIC');
  expect(instantania(id)).toMatchObject({ url: `${ORIGEN}/wordpress/?page_id=12&code=HOST-COUPON`, estat: ESTAT_AMFITRIO, nota: null });
  vi.stubGlobal('fetch', vi.fn(async () => sessioBona()));
  tornaDeGoTrue(tornada, { code: 'code' });
  await gestionaTornada({}, config);
  expect(ara()).toBe(`${ORIGEN}/wordpress/?page_id=12&code=HOST-COUPON`);
  expect(window.history.state).toEqual(ESTAT_AMFITRIO);
});

test('W4-02 · dos intents seguits: el segon oblida la instantània del primer, i només el seu es restaura', async () => {
  const primer = await anada(CUPO, ESTAT_AMFITRIO);
  // La persona torna arrere sense acabar, canvia de pàgina a WordPress i torna a prémer Google.
  const segona = '/wordpress/?page_id=13&code=ALTRE-CUPO#pas-4';
  const segon = await anada(segona, { pas: 4 });
  expect(segon.id).not.toBe(primer.id);
  expect(instantania(primer.id)).toBeNull();
  expect(instantania(segon.id)).toMatchObject({ url: ORIGEN + segona });
  const fetch = vi.fn(async () => sessioBona()); vi.stubGlobal('fetch', fetch);
  // La tornada del primer ja no és d'esta pestanya: cap bescanvi i cap restauració.
  tornaDeGoTrue(primer.tornada, { code: 'codi-1' });
  await expect(gestionaTornada({}, config)).rejects.toThrow(/S'ha perdut el verificador/);
  expect(ara()).toBe(`${ORIGEN}/wordpress/?filter=all&page_id=12`);
  // La del segon, sí.
  tornaDeGoTrue(segon.tornada, { code: 'codi-2' });
  await gestionaTornada({}, config);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ auth_code: 'codi-2', code_verifier: segon.verificador });
  expect(ara()).toBe(ORIGEN + segona);
  expect(window.history.state).toEqual({ pas: 4 });
});
