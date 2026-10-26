/* Fase D (261020, tasca 1) · L'adaptador natiu de l'entrada amb Apple i Google
   (entradaSocial.js) amb un connector fals (vi.fn per a initialize, login i
   logout): mai es carrega el de veres. Decisions del Mestre (261020 15:15):
   Apple només a iOS, Google a iOS sempre amb forcePrompt. Clients sintètics. */
import { webcrypto } from 'node:crypto';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  creaEntradaSocial, credencialDe, entradaSenseProveidors, esCancelacio, opcionsDInici, opcionsDeLogin, plataformaDelDispositiu,
  proveidorsDe
} from './entradaSocial.js';
import { CODI_ENTRADA_NATIVA } from '../config/entradaNativa.js';
import { sha256HexPur } from './resum.js';

const WEB = '123456-websintetic.apps.googleusercontent.com';
const IOS = '123456-iossintetic.apps.googleusercontent.com';
const CLIENTS = Object.freeze({ googleWeb: WEB, googleIos: IOS });
const JWT = 'eyJh.eyJz.c2ln';

/* Actualitzada a posta (261024 T1): el resultat fals porta authorizationCode, com el del connector d'Apple. */
const CODI_APPLE = 'c0d1.0.apple-sintetic';
function connectorFals({ resultat = { idToken: JWT, accessToken: { token: 'acces-google' }, profile: { givenName: 'Maria', familyName: 'Ferrer' },
  authorizationCode: CODI_APPLE } } = {}) {
  const social = {
    initialize: vi.fn(async () => undefined),
    login: vi.fn(async ({ provider }) => ({ provider, result: resultat })),
    logout: vi.fn(async () => undefined)
  };
  // Com el mòdul de veres: el connector hi va dins (vegeu carregaPerDefecte).
  return { social, carregaConnector: vi.fn(async () => ({ SocialLogin: social })) };
}
const promesaOberta = () => {
  let resol;
  const promesa = new Promise((r) => { resol = r; });
  return { promesa, resol };
};

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('la plataforma i els proveïdors', () => {
  test('el pont de l’app diu la plataforma; sense pont, o si llança, web', () => {
    expect(plataformaDelDispositiu({ Capacitor: { getPlatform: () => 'ios' } })).toBe('ios');
    expect(plataformaDelDispositiu({ Capacitor: { getPlatform: () => 'android' } })).toBe('android');
    expect(plataformaDelDispositiu({ Capacitor: { getPlatform: () => 'web' } })).toBe('web');
    expect(plataformaDelDispositiu({ Capacitor: { getPlatform: () => { throw new Error('pont'); } } })).toBe('web');
    expect(plataformaDelDispositiu({})).toBe('web');
    expect(plataformaDelDispositiu(null)).toBe('web');
    expect(plataformaDelDispositiu()).toBe('web');
  });

  test('Apple només a iOS; Google a iOS amb els dos clients ben formats; Android, Google amb el client web', () => {
    expect(proveidorsDe('ios', CLIENTS)).toEqual(['apple', 'google']);
    expect(proveidorsDe('ios', { googleWeb: WEB })).toEqual(['apple']);
    expect(proveidorsDe('ios', { googleIos: IOS })).toEqual(['apple']);
    expect(proveidorsDe('ios', { googleWeb: WEB, googleIos: 'no-es-un-client' })).toEqual(['apple']);
    expect(proveidorsDe('ios')).toEqual(['apple']);
    expect(proveidorsDe('android', CLIENTS)).toEqual(['google']);
    expect(proveidorsDe('android', { googleWeb: `  ${WEB}  ` })).toEqual(['google']);
    expect(proveidorsDe('android', { googleIos: IOS })).toEqual([]);
    expect(proveidorsDe('web', CLIENTS)).toEqual([]);
  });

  /* Fase D (261020, revisió) · Un dispositiu natiu sense cap proveïdor registra
     igualment la plataforma: el Google web no apareix mai dins de l'app. */
  test('creaEntradaSocial torna null només a la web; a Android sense client, l’adaptador amb proveidors: []', () => {
    const { carregaConnector } = connectorFals();
    expect(creaEntradaSocial({ plataforma: 'web', clients: CLIENTS, carregaConnector })).toBeNull();
    expect(creaEntradaSocial()).toBeNull();
    const sense = creaEntradaSocial({ plataforma: 'android', clients: {}, carregaConnector });
    expect(sense).toMatchObject({ plataforma: 'android', proveidors: [] });
    expect(Object.isFrozen(sense) && Object.isFrozen(sense.proveidors)).toBe(true);
    expect(carregaConnector).not.toHaveBeenCalled();
  });

  test('entradaSenseProveidors: la plataforma sense cap botó ni connector; demana diu NO_DISPONIBLE; null a la web', async () => {
    expect(entradaSenseProveidors('web')).toBeNull();
    expect(entradaSenseProveidors(undefined)).toBeNull();
    const reserva = entradaSenseProveidors('ios');
    expect(reserva).toMatchObject({ plataforma: 'ios', proveidors: [] });
    expect(Object.isFrozen(reserva) && Object.isFrozen(reserva.proveidors)).toBe(true);
    await expect(reserva.demana('apple')).rejects.toMatchObject({ code: CODI_ENTRADA_NATIVA.NO_DISPONIBLE });
  });
});

describe('initialize', () => {
  test('mai en crear-lo: al primer toc, una sola vegada, amb les opcions exactes d’iOS', async () => {
    const { social, carregaConnector } = connectorFals();
    const adaptador = creaEntradaSocial({ plataforma: 'ios', clients: CLIENTS, carregaConnector });
    expect(adaptador.plataforma).toBe('ios');
    expect(adaptador.proveidors).toEqual(['apple', 'google']);
    expect(Object.isFrozen(adaptador) && Object.isFrozen(adaptador.proveidors)).toBe(true);
    expect(carregaConnector).not.toHaveBeenCalled();
    await adaptador.demana('apple');
    await adaptador.demana('google');
    expect(carregaConnector).toHaveBeenCalledTimes(1);
    expect(social.initialize).toHaveBeenCalledTimes(1);
    expect(social.initialize).toHaveBeenCalledWith({
      google: { iOSClientId: IOS, iOSServerClientId: WEB, mode: 'online' },
      apple: { redirectUrl: '', useProperTokenExchange: true }
    });
  });

  test('a Android, només Google amb el client web: cap clau apple', async () => {
    const { social, carregaConnector } = connectorFals();
    const adaptador = creaEntradaSocial({ plataforma: 'android', clients: CLIENTS, carregaConnector });
    expect(adaptador.proveidors).toEqual(['google']);
    await adaptador.demana('google');
    expect(social.initialize).toHaveBeenCalledWith({ google: { webClientId: WEB, mode: 'online' } });
    expect(opcionsDInici('android', CLIENTS, ['google', 'apple'])).not.toHaveProperty('apple');
  });

  /* 261026 (torn_e6be28f2) · El connector de veres és un Proxy de Capacitor que
     respon a qualsevol nom, també a `then`, sense cridar mai cap callback: una
     promesa resolta amb ell no es resol mai. L'adaptador no el torna mai d'una
     promesa, i el primer toc ja no espera els 20 s del topall. */
  test('un connector que respon a «then» com el Proxy de Capacitor no penja l’entrada', async () => {
    const { social } = connectorFals();
    const trampa = new Proxy(social, { get: (objectiu, nom) => (nom === 'then' ? () => {} : objectiu[nom]) });
    const adaptador = creaEntradaSocial({ plataforma: 'ios', clients: CLIENTS, carregaConnector: async () => ({ SocialLogin: trampa }) });
    const penjada = Symbol('penjada');
    const espera = new Promise((resol) => { setTimeout(() => resol(penjada), 1000); });
    await expect(Promise.race([adaptador.demana('apple'), espera])).resolves.toMatchObject({ testimoni: JWT });
    await expect(Promise.race([adaptador.oblida('apple').then(() => 'fet'), espera])).resolves.toBe('fet');
    expect(social.logout).toHaveBeenCalledTimes(1);
  });

  /* 261026 (prompt 261026_1615, revisió) · La prova d'abans injecta el
     carregador; esta passa pel de veres (carregaPerDefecte, l'import() del
     paquet), amb el paquet substituït per un mòdul que porta la trampa dins.
     Si el carregador tornara el connector sol, el primer toc es penjaria. El
     nom del paquet es compon a trossos, com a frontera.test.js. */
  describe('amb el carregador per defecte', () => {
    const PAQUET_SOCIAL = [['@cap', 'go'].join(''), ['capa', 'citor-social-login'].join('')].join('/');
    afterEach(() => {
      vi.doUnmock(PAQUET_SOCIAL);
      vi.resetModules();
    });

    test('l’import() del paquet amb el Proxy de Capacitor dins no penja el primer toc', async () => {
      const { social } = connectorFals();
      const trampa = new Proxy({}, {
        get: (_, nom) => (nom === 'then' ? () => {} : social[nom])
      });
      vi.resetModules();
      vi.doMock(PAQUET_SOCIAL, () => ({ SocialLogin: trampa }));
      const { creaEntradaSocial: creaFresc } = await import('./entradaSocial.js');
      const adaptador = creaFresc({ plataforma: 'ios', clients: CLIENTS });
      const penjada = Symbol('penjada');
      let temporitzador = null;
      const espera = new Promise((resol) => { temporitzador = setTimeout(() => resol(penjada), 1000); });
      try {
        await expect(Promise.race([adaptador.demana('apple'), espera])).resolves.toMatchObject({ testimoni: JWT, codiAutoritzacio: CODI_APPLE });
        await expect(Promise.race([adaptador.oblida('apple').then(() => 'fet'), espera])).resolves.toBe('fet');
      } finally {
        clearTimeout(temporitzador);
      }
      expect(social.initialize).toHaveBeenCalledTimes(1);
      expect(social.initialize).toHaveBeenCalledWith({
        google: { iOSClientId: IOS, iOSServerClientId: WEB, mode: 'online' },
        apple: { redirectUrl: '', useProperTokenExchange: true }
      });
      expect(social.login).toHaveBeenCalledTimes(1);
      expect(social.login.mock.calls[0][0].provider).toBe('apple');
      expect(social.logout).toHaveBeenCalledWith({ provider: 'apple' });
    });
  });

  test('un initialize fallit es torna a provar al toc següent', async () => {
    const { social, carregaConnector } = connectorFals();
    social.initialize.mockRejectedValueOnce(new Error('sense configuració'));
    const adaptador = creaEntradaSocial({ plataforma: 'ios', clients: CLIENTS, carregaConnector });
    await expect(adaptador.demana('apple')).rejects.toMatchObject({ code: CODI_ENTRADA_NATIVA.FALLIDA });
    await expect(adaptador.demana('apple')).resolves.toMatchObject({ testimoni: JWT });
    expect(carregaConnector).toHaveBeenCalledTimes(2);
    expect(social.initialize).toHaveBeenCalledTimes(2);
  });

  test('un connector que no carrega mai dona FALLIDA passats 20 s, sense deixar temporitzadors', async () => {
    /* Sense subtle, el resum és el pur (només microtasques): els temporitzadors falsos manen. */
    vi.stubGlobal('crypto', { getRandomValues: (bytes) => webcrypto.getRandomValues(bytes) });
    vi.useFakeTimers();
    const adaptador = creaEntradaSocial({ plataforma: 'ios', clients: CLIENTS, carregaConnector: () => new Promise(() => {}) });
    const demanada = adaptador.demana('apple');
    const resultat = expect(demanada).rejects.toMatchObject({ code: CODI_ENTRADA_NATIVA.FALLIDA, message: 'El connector natiu no ha respost.' });
    await vi.advanceTimersByTimeAsync(20000);
    await resultat;
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('login', () => {
  test('Apple rep el SHA-256 del nonce cru i cap scope; l’accés d’Apple es descarta i el nom ve del perfil', async () => {
    const { social, carregaConnector } = connectorFals();
    const adaptador = creaEntradaSocial({ plataforma: 'ios', clients: CLIENTS, carregaConnector });
    const credencial = await adaptador.demana('apple');
    const [[{ provider, options }]] = social.login.mock.calls;
    expect(provider).toBe('apple');
    expect(Object.keys(options)).toEqual(['nonce']);
    expect(credencial.nonce).toMatch(/^[0-9a-f]{64}$/);
    expect(options.nonce).toBe(sha256HexPur(credencial.nonce));
    /* Actualitzada a posta (261024 T1): el codi d'autorització d'Apple ja no es perd; l'accés d'Apple, sí. */
    expect(credencial).toEqual({ testimoni: JWT, nonce: credencial.nonce, testimoniAcces: null, nom: 'Maria Ferrer', codiAutoritzacio: CODI_APPLE });
  });

  test('T1 (261024) · el codi d’autorització només és d’Apple: sense codi, null; Google no en porta mai', () => {
    expect(credencialDe('apple', { idToken: JWT, authorizationCode: `  ${CODI_APPLE} ` }, 'n').codiAutoritzacio).toBe(CODI_APPLE);
    expect(credencialDe('apple', { idToken: JWT }, 'n').codiAutoritzacio).toBeNull();
    expect(credencialDe('apple', { idToken: JWT, authorizationCode: '   ' }, 'n').codiAutoritzacio).toBeNull();
    expect(credencialDe('google', { idToken: JWT, authorizationCode: CODI_APPLE }, 'n').codiAutoritzacio).toBeNull();
  });

  test('Google a iOS porta forcePrompt; a Android només el nonce; l’accés de Google es conserva i el nom no', async () => {
    const ios = connectorFals();
    const credencial = await creaEntradaSocial({ plataforma: 'ios', clients: CLIENTS, carregaConnector: ios.carregaConnector }).demana('google');
    expect(ios.social.login.mock.calls[0][0].options).toEqual({ nonce: sha256HexPur(credencial.nonce), forcePrompt: true });
    expect(credencial).toMatchObject({ testimoni: JWT, testimoniAcces: 'acces-google', nom: null, codiAutoritzacio: null });
    const android = connectorFals();
    await creaEntradaSocial({ plataforma: 'android', clients: CLIENTS, carregaConnector: android.carregaConnector }).demana('google');
    expect(Object.keys(android.social.login.mock.calls[0][0].options)).toEqual(['nonce']);
    expect(opcionsDeLogin('ios', 'apple', 'x')).toEqual({ nonce: 'x' });
  });

  test('cada toc porta un nonce nou', async () => {
    const { social, carregaConnector } = connectorFals();
    const adaptador = creaEntradaSocial({ plataforma: 'ios', clients: CLIENTS, carregaConnector });
    const a = await adaptador.demana('apple');
    const b = await adaptador.demana('apple');
    expect(a.nonce).not.toBe(b.nonce);
    expect(social.login.mock.calls[0][0].options.nonce).not.toBe(social.login.mock.calls[1][0].options.nonce);
  });

  test('USER_CANCELLED i «AuthorizationError error 1001» són CANCELADA; un temps esgotat «cancelled» i sense idToken, FALLIDA', async () => {
    const { social, carregaConnector } = connectorFals();
    const adaptador = creaEntradaSocial({ plataforma: 'ios', clients: CLIENTS, carregaConnector });
    social.login.mockRejectedValueOnce(Object.assign(new Error('The user canceled the sign-in flow.'), { code: 'USER_CANCELLED' }));
    await expect(adaptador.demana('google')).rejects.toMatchObject({ code: CODI_ENTRADA_NATIVA.CANCELADA });
    social.login.mockRejectedValueOnce(new Error('The operation couldn’t be completed. (com.apple.AuthenticationServices.AuthorizationError error 1001.)'));
    await expect(adaptador.demana('apple')).rejects.toMatchObject({ code: CODI_ENTRADA_NATIVA.CANCELADA });
    const temps = new Error('The request was cancelled because of a timeout');
    social.login.mockRejectedValueOnce(temps);
    await expect(adaptador.demana('google')).rejects.toMatchObject({ code: CODI_ENTRADA_NATIVA.FALLIDA, cause: temps });
    social.login.mockResolvedValueOnce({ provider: 'apple', result: { idToken: null } });
    await expect(adaptador.demana('apple')).rejects.toMatchObject({ code: CODI_ENTRADA_NATIVA.FALLIDA });
    expect(esCancelacio({ message: 'Sign in cancelled by the user' })).toBe(true);
    expect(esCancelacio({ message: 'cancel' })).toBe(false);
    expect(() => credencialDe('google', {}, 'n')).toThrow(expect.objectContaining({ code: CODI_ENTRADA_NATIVA.FALLIDA }));
  });

  /* Fase D (261020, revisió) · «Cancel·la l'entrada» mentre es carrega el connector. */
  test('viu() fals després de carregar el connector: CANCELADA tal qual i el full no s’obri; viu() cert, sí', async () => {
    const carrega = promesaOberta();
    const { social } = connectorFals();
    const adaptador = creaEntradaSocial({ plataforma: 'ios', clients: CLIENTS, carregaConnector: () => carrega.promesa });
    let viu = true;
    const demanada = adaptador.demana('apple', { viu: () => viu });
    viu = false;
    carrega.resol({ SocialLogin: social });
    await expect(demanada).rejects.toMatchObject({ code: CODI_ENTRADA_NATIVA.CANCELADA });
    expect(social.initialize).toHaveBeenCalledTimes(1);
    expect(social.login).not.toHaveBeenCalled();
    viu = true;
    await expect(adaptador.demana('apple', { viu: () => viu })).resolves.toMatchObject({ testimoni: JWT });
    expect(social.login).toHaveBeenCalledTimes(1);
    expect(social.initialize).toHaveBeenCalledTimes(1);
  });
});

describe('oblida', () => {
  test('abans de carregar res no fa res (eixir no carrega el connector)', async () => {
    const { carregaConnector } = connectorFals();
    const adaptador = creaEntradaSocial({ plataforma: 'ios', clients: CLIENTS, carregaConnector });
    await expect(adaptador.oblida('apple')).resolves.toBeUndefined();
    expect(carregaConnector).not.toHaveBeenCalled();
  });

  test('després d’una entrada crida logout amb el proveïdor i s’empassa el rebuig', async () => {
    const { social, carregaConnector } = connectorFals();
    const adaptador = creaEntradaSocial({ plataforma: 'android', clients: CLIENTS, carregaConnector });
    await adaptador.demana('google');
    await adaptador.oblida('google');
    expect(social.logout).toHaveBeenCalledWith({ provider: 'google' });
    social.logout.mockRejectedValueOnce(new Error('clearCredentialState'));
    await expect(adaptador.oblida('google')).resolves.toBeUndefined();
  });
});
