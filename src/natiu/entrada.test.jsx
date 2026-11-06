/* L'entrada mínima de l'app nativa (261003, abans de la lease de Capacitor) ·
   ARQUITECTURA.txt §1.2, passos 2, 3 i 4b, amb el tenant del build. Com a
   src/entrades.capaDelPaquet.test.jsx: host.js i l'App no hi pinten res i
   s'espien; tot és sintètic. Quan arribe el selector de poble (després de la
   lease), esta prova creix amb els casos del §5 (ordre amb la tria). */
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LANGUAGE_STORAGE_KEY, desaIdiomaTriat } from '../config/i18n.js';
import { delVal } from '../config/storage.js';

const ENTORN = vi.hoisted(() => {
  const entorn = {
    VITE_SUPABASE_URL: 'https://paquet.supabase.test',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_del_paquet',
    // L'app nativa no en fa cas: el mode de dades és sempre 'remote'.
    VITE_DATA_MODE: 'seed',
    VITE_TENANT_ID: '11111111-1111-4111-8111-111111111111'
  };
  for (const [variable, valor] of Object.entries(entorn)) vi.stubEnv(variable, valor);
  return entorn;
});
const pintats = vi.hoisted(() => []);

/* Onada 12 (261011) · arrenca() torna una promesa, com la de veres: l'entrada li posa un .catch. */
vi.mock('../host.js', () => ({ configura: vi.fn(), arrenca: vi.fn(async () => ({ fase: 'segellat' })), arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('../config/capaDelPaquet.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, fixaCapaDelPaquet: vi.fn(original.fixaCapaDelPaquet) };
});
vi.mock('react-dom/client', () => ({ createRoot: () => ({ render: (node) => pintats.push(node) }) }));
vi.mock('../PedraSecaEmbed.jsx', () => ({ default: () => null }));
vi.mock('../css/index.css?inline', () => ({ default: '' }));
/* Fase D (261020, tasca 1) · El pas 0: el registre és el de veres (sense simular:
   un mòdul simulat amb importOriginal conserva l'estat entre resetModules), la
   fàbrica de l'adaptador s'espia i el connector natiu és una sonda que diu si
   algú l'ha carregat. */
const natiu = vi.hoisted(() => ({ carregat: false, fallada: null }));
vi.mock('./entradaSocial.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    creaEntradaSocial: vi.fn((opcions) => {
      if (natiu.fallada) throw natiu.fallada;
      return original.creaEntradaSocial(opcions);
    })
  };
});
vi.mock('@capgo/capacitor-social-login', () => {
  natiu.carregat = true;
  return { SocialLogin: { initialize: vi.fn(), login: vi.fn(), logout: vi.fn() } };
});
/* TE-05 · La fàbrica dels avisos, espiada: el canal d'Android (canalDelXat) és una opció seua. */
vi.mock('./avisosNatius.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, creaAvisosNatius: vi.fn((opcions) => original.creaAvisosNatius(opcions)) };
});
/* Pla 261028_1526 (P1-22, TE-05) · La llengua del dispositiu (navigator.languages
   del WebView). La de jsdom és 'en-US'; els casos de sempre corren amb una que
   l'app no parla ('oc'), i per això no porten cap `language`. */
const dispositiu = vi.hoisted(() => ({ llengues: ['oc'], llengua: 'oc' }));
/* Una porta davant del tros d'una llengua: tancada, el diccionari no arriba,
   i «el primer pintat l'espera» no depén de quant tarda un import() que una
   prova anterior ja ha resolt. Un vi.doMock nou a cada prova (un mòdul simulat
   sobreviu a resetModules); oberta, el diccionari de veres. */
const porta = vi.hoisted(() => ({ obri: () => {}, simulats: [] }));
function tancaElTros(codi) {
  const tancada = new Promise((obri) => { porta.obri = obri; });
  const ruta = `../config/idiomes/${codi}.js`;
  porta.simulats.push(ruta);
  vi.doMock(ruta, async (importOriginal) => { await tancada; return importOriginal(); });
}
beforeEach(() => {
  Object.defineProperty(window.navigator, 'languages', { configurable: true, get: () => dispositiu.llengues });
  Object.defineProperty(window.navigator, 'language', { configurable: true, get: () => dispositiu.llengua });
});
afterEach(() => {
  dispositiu.llengues = ['oc'];
  dispositiu.llengua = 'oc';
  porta.obri();
  for (const ruta of porta.simulats.splice(0)) vi.doUnmock(ruta);
});
afterAll(() => {
  delete window.navigator.languages;
  delete window.navigator.language;
});

const CAPA_NATIVA = Object.freeze({
  supabaseUrl: ENTORN.VITE_SUPABASE_URL,
  supabaseAnonKey: ENTORN.VITE_SUPABASE_ANON_KEY,
  dataMode: 'remote',
  tenantId: ENTORN.VITE_TENANT_ID
});
const DEL_LLOC = Object.freeze({ pluginUrl: '/', manageDocumentHead: true, routerType: 'browser' });

/** Avalua l'entrada en un registre de mòduls nou, amb un #root buit (o ple). */
async function avalua(arrel = '<div id="root"></div>') {
  vi.resetModules();
  pintats.length = 0;
  // Llegit en un document inert (DOMParser) i importat; no sanitizeHtml: lleva l'id="root".
  const pagina = new DOMParser().parseFromString(arrel, 'text/html');
  document.body.replaceChildren(...[...pagina.body.childNodes].map((node) => document.importNode(node, true)));
  await import('./entrada.jsx');
  return { host: await import('../host.js'), capa: await import('../config/capaDelPaquet.js') };
}

afterEach(() => {
  document.body.replaceChildren();
  vi.clearAllMocks();
});

test('fixa la capa (backend del build, mode remote, tenant del build) abans de configura(), i configura() no porta backend ni tenant', async () => {
  const { host, capa } = await avalua();
  expect(capa.fixaCapaDelPaquet).toHaveBeenCalledTimes(1);
  expect(capa.fixaCapaDelPaquet).toHaveBeenCalledWith(CAPA_NATIVA);
  expect(capa.capaDelPaquet()).toEqual(CAPA_NATIVA);
  expect(Object.keys(capa.fixaCapaDelPaquet.mock.calls[0][0]).every((clau) => capa.CLAUS_DEL_PAQUET.includes(clau))).toBe(true);
  expect(host.configura).toHaveBeenCalledTimes(1);
  expect(capa.fixaCapaDelPaquet.mock.invocationCallOrder[0]).toBeLessThan(host.configura.mock.invocationCallOrder[0]);
  const [[opcions]] = host.configura.mock.calls;
  expect(Object.keys(opcions).sort()).toEqual(['auth', 'config']);
  expect(opcions.config).toEqual(DEL_LLOC);
  expect(opcions.auth).toEqual({ issuer: 'https://auth.socdepoble.org', audiences: ['authenticated'], persistencia: 'local' });
  expect(capa.separaClausDelPaquet(opcions.config).descartades).toEqual([]);
});

test('arrenca després de configura(), pinta una sola vegada amb la capa per davall del lloc i no exposa cap global', async () => {
  const { host } = await avalua();
  expect(host.arrenca).toHaveBeenCalledTimes(1);
  expect(host.configura.mock.invocationCallOrder[0]).toBeLessThan(host.arrenca.mock.invocationCallOrder[0]);
  expect(host.exposaGlobal).not.toHaveBeenCalled();
  expect(host.arrencaAuto).not.toHaveBeenCalled();
  expect(pintats).toHaveLength(1);
  expect(pintats[0].props.config).toEqual({ ...CAPA_NATIVA, ...DEL_LLOC });
  expect(pintats[0].props.isFirstInstance).toBe(true);
  expect(pintats[0].props.targetNode).toBe(document.getElementById('root'));
});

/* Onada 12 (261011; ordres 261011_0130, punt 7) · Com main.jsx: el rebuig d'una
   arrencada fallida té amo i l'App es pinta igual. */
test('una arrencada que falla no deixa cap rebuig sense amo i l’App es pinta igual', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const senseAmo = vi.fn();
  process.on('unhandledRejection', senseAmo);
  try {
    const fallada = new Error('tros caigut');
    (await import('../host.js')).arrenca.mockRejectedValueOnce(fallada);
    const { host } = await avalua();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(host.arrenca).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith('[natiu] Arrencada fallida:', fallada);
    expect(senseAmo).not.toHaveBeenCalled();
    expect(pintats).toHaveLength(1);
  } finally {
    process.off('unhandledRejection', senseAmo);
    error.mockRestore();
  }
});

test('amb un #root que ja té contingut no fa res: ni capa, ni configura, ni pintada', async () => {
  const { host, capa } = await avalua('<div id="root"><p>ja muntat</p></div>');
  expect(capa.fixaCapaDelPaquet).not.toHaveBeenCalled();
  expect(host.configura).not.toHaveBeenCalled();
  expect(host.arrenca).not.toHaveBeenCalled();
  expect(pintats).toHaveLength(0);
});

/* Fase D (261020, tasca 1) · El pas 0 del §1.2: l'entrada amb Apple i Google
   es registra abans de la capa, sense carregar el connector natiu, i mai tomba
   l'arrencada. Els dos clients de Google són sintètics. */
describe('Fase D · el pas 0: l’entrada nativa', () => {
  const CLIENT_WEB = '123456-websintetic.apps.googleusercontent.com';
  const CLIENT_IOS = '123456-iossintetic.apps.googleusercontent.com';
  const ambClients = (web, ios) => {
    vi.stubEnv('VITE_NATIU_GOOGLE_WEB_CLIENT_ID', web);
    vi.stubEnv('VITE_NATIU_GOOGLE_IOS_CLIENT_ID', ios);
  };
  /* D-10 (pla 261101_1246) · Apple només amb VITE_APPLE_OAUTH_ACTIU exactament 'true'. */
  const ambApple = (valor) => vi.stubEnv('VITE_APPLE_OAUTH_ACTIU', valor);
  afterEach(() => {
    vi.unstubAllGlobals();
    ambClients('', '');
    ambApple('');
    natiu.carregat = false;
    natiu.fallada = null;
  });

  test('sense el pont de l’app (la web), no es registra res i el registre diu web', async () => {
    ambClients(CLIENT_WEB, CLIENT_IOS);
    await avalua();
    const { creaEntradaSocial } = await import('./entradaSocial.js');
    const registre = await import('../config/entradaNativa.js');
    expect(creaEntradaSocial).toHaveBeenCalledTimes(1);
    expect(creaEntradaSocial.mock.calls[0][0].plataforma).toBe('web');
    expect(creaEntradaSocial.mock.results[0].value).toBeNull();
    expect(registre.plataformaNativa()).toBe('web');
    expect(registre.botonsNatius()).toEqual([]);
    expect(natiu.carregat).toBe(false);
  });

  /* Actualitzada a posta (D-10): amb Apple encés (VITE_APPLE_OAUTH_ACTIU=true), fora de `clients`. */
  test('a iOS amb els dos clients i Apple encés: Apple i Google, registrats abans de la capa i sense carregar el connector', async () => {
    vi.stubGlobal('Capacitor', { getPlatform: () => 'ios' });
    ambClients(CLIENT_WEB, CLIENT_IOS);
    ambApple('true');
    const { capa, host } = await avalua();
    const { creaEntradaSocial } = await import('./entradaSocial.js');
    const registre = await import('../config/entradaNativa.js');
    expect(creaEntradaSocial).toHaveBeenCalledWith({ plataforma: 'ios', clients: { googleWeb: CLIENT_WEB, googleIos: CLIENT_IOS }, appleActiu: true });
    expect(registre.plataformaNativa()).toBe('ios');
    expect(registre.botonsNatius()).toEqual(['apple', 'google']);
    expect(creaEntradaSocial.mock.invocationCallOrder[0]).toBeLessThan(capa.fixaCapaDelPaquet.mock.invocationCallOrder[0]);
    expect(creaEntradaSocial.mock.invocationCallOrder[0]).toBeLessThan(host.configura.mock.invocationCallOrder[0]);
    expect(natiu.carregat).toBe(false);
    // Les opcions de configura no canvien: el pas 0 no és cap opció de l'amfitrió.
    expect(Object.keys(host.configura.mock.calls[0][0]).sort()).toEqual(['auth', 'config']);
  });

  /* Fase D (261020, revisió) · A Android sense client web, la plataforma queda
     registrada sense cap botó: només el correu, i mai el Google web dins de l'app. */
  test('a iOS sense clients de Google: només Apple; a Android sense client web: la plataforma, cap botó', async () => {
    vi.stubGlobal('Capacitor', { getPlatform: () => 'ios' });
    ambApple('true');
    await avalua();
    expect((await import('../config/entradaNativa.js')).botonsNatius()).toEqual(['apple']);
    vi.stubGlobal('Capacitor', { getPlatform: () => 'android' });
    await avalua();
    const registre = await import('../config/entradaNativa.js');
    expect(registre.plataformaNativa()).toBe('android');
    expect(registre.botonsNatius()).toEqual([]);
    expect(natiu.carregat).toBe(false);
  });

  /* D-10 (pla 261101_1246, BOT-A3) · Sense Apple encés a Supabase, el flag no
     hi és o no és exactament 'true': a iOS cap botó social (App Store 4.8, ni
     Google amb els dos clients) i el connector no es carrega; queda el correu. */
  test('D-10 · a iOS sense VITE_APPLE_OAUTH_ACTIU=true: cap botó, ni Google, i el connector no es carrega', async () => {
    vi.stubGlobal('Capacitor', { getPlatform: () => 'ios' });
    ambClients(CLIENT_WEB, CLIENT_IOS);
    for (const valor of [undefined, '', 'false', 'TRUE', ' true', '1', 'yes']) {
      ambApple(valor);
      await avalua();
      const { creaEntradaSocial } = await import('./entradaSocial.js');
      const registre = await import('../config/entradaNativa.js');
      expect(creaEntradaSocial.mock.calls.at(-1)[0].appleActiu, String(valor)).toBe(false);
      expect(registre.plataformaNativa()).toBe('ios');
      expect(registre.botonsNatius(), String(valor)).toEqual([]);
      await expect(registre.demanaCredencialNativa('apple')).rejects.toMatchObject({ code: registre.CODI_ENTRADA_NATIVA.NO_DISPONIBLE });
    }
    expect(natiu.carregat).toBe(false);
  });

  test('D-10 · a Android el flag no canvia res: Google amb el client web, i mai Apple', async () => {
    vi.stubGlobal('Capacitor', { getPlatform: () => 'android' });
    ambClients(CLIENT_WEB, '');
    for (const valor of ['true', '']) {
      ambApple(valor);
      await avalua();
      expect((await import('../config/entradaNativa.js')).botonsNatius(), valor).toEqual(['google']);
    }
    expect(natiu.carregat).toBe(false);
  });

  test('un registre que falla ho diu per la consola, l’arrencada continua i la plataforma queda registrada sense botons', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      vi.stubGlobal('Capacitor', { getPlatform: () => 'ios' });
      natiu.fallada = new Error('registre trencat');
      const { capa, host } = await avalua();
      expect(error).toHaveBeenCalledWith('[natiu] Entrada nativa no registrada:', natiu.fallada);
      expect(error).toHaveBeenCalledTimes(1);
      const registre = await import('../config/entradaNativa.js');
      expect(registre.plataformaNativa()).toBe('ios');
      expect(registre.botonsNatius()).toEqual([]);
      expect(natiu.carregat).toBe(false);
      expect(capa.fixaCapaDelPaquet).toHaveBeenCalledTimes(1);
      expect(host.configura).toHaveBeenCalledTimes(1);
      expect(host.arrenca).toHaveBeenCalledTimes(1);
      expect(pintats).toHaveLength(1);
    } finally {
      error.mockRestore();
    }
  });
});

/* Fase D (261020, tasca 4.1) · L1 · Amb una tria desada que no és el valencià,
   el primer pintat espera el diccionari (pintaAmbDiccionari): cap fotograma en
   valencià en obrir l'app. Amb l'emmagatzematge buit, els casos de dalt pinten
   a l'acte, com sempre. */
describe('Fase D · L1: el primer pintat amb una tria desada que no és el valencià', () => {
  afterEach(() => { delVal(LANGUAGE_STORAGE_KEY); });

  test('espera el diccionari del castellà i pinta una sola vegada quan arriba', async () => {
    expect(desaIdiomaTriat('es')).toBe(true);
    await avalua();
    expect(pintats).toHaveLength(0);
    const { carregaDiccionari } = await import('../config/i18n.js'); // la mateixa instància que l'entrada
    await carregaDiccionari('es');
    await Promise.resolve();
    expect(pintats).toHaveLength(1);
    expect(pintats[0].props.config).toEqual({ ...CAPA_NATIVA, ...DEL_LLOC });
    expect(pintats[0].props.isFirstInstance).toBe(true);
  });
});

/* Pla 261028_1526 (P1-22, TE-05) · Dins de l'app, la llengua del sistema fa
   d'amfitrió: va a la config de l'element com a `language`, el primer pintat
   espera el seu diccionari i el canal d'Android parla eixa llengua. T1 no
   canvia: una tria explícita desada guanya, i una llengua que l'app no parla
   no porta res. configura() continua amb el del lloc i prou. */
describe('TE-05 · la llengua del dispositiu', () => {
  afterEach(() => { delVal(LANGUAGE_STORAGE_KEY); });
  const canal = async () => (await import('./avisosNatius.js')).creaAvisosNatius.mock.calls[0][0].canal();

  test('un dispositiu en castellà: espera el diccionari, la config porta language: es i el canal és en castellà', async () => {
    dispositiu.llengues = ['es-ES', 'ca'];
    tancaElTros('es');
    const { host } = await avalua();
    expect(pintats).toHaveLength(0);
    porta.obri();
    const { carregaDiccionari } = await import('../config/i18n.js');
    await carregaDiccionari('es');
    await Promise.resolve();
    expect(pintats).toHaveLength(1);
    expect(pintats[0].props.config).toEqual({ ...CAPA_NATIVA, ...DEL_LLOC, language: 'es' });
    expect(host.configura.mock.calls[0][0].config).toEqual(DEL_LLOC);
    expect((await canal()).nom).toBe('Mensajes del chat');
  });

  test('ca-ES-valencia és el valencià: pinta a l’acte, amb language: ca', async () => {
    dispositiu.llengues = ['ca-ES-valencia'];
    await avalua();
    expect(pintats).toHaveLength(1);
    expect(pintats[0].props.config).toEqual({ ...CAPA_NATIVA, ...DEL_LLOC, language: 'ca' });
    expect((await canal()).nom).toBe('Missatges del xat');
  });

  test('la tria desada guanya al dispositiu: gallec triat amb el telèfon en castellà espera el gallec', async () => {
    expect(desaIdiomaTriat('gl')).toBe(true);
    dispositiu.llengues = ['es-ES'];
    tancaElTros('gl');
    await avalua();
    expect(pintats).toHaveLength(0);
    porta.obri();
    const { carregaDiccionari } = await import('../config/i18n.js');
    await carregaDiccionari('gl');
    await Promise.resolve();
    expect(pintats).toHaveLength(1);
    expect(pintats[0].props.config.language).toBe('es');
    expect((await canal()).nom).toBe('Mensaxes do chat');
  });

  test('la primera que l’app parla: [fr-FR, en-GB] dona l’anglés', async () => {
    dispositiu.llengues = ['fr-FR', 'en-GB'];
    await avalua();
    const { carregaDiccionari } = await import('../config/i18n.js');
    await carregaDiccionari('en');
    await Promise.resolve();
    expect(pintats).toHaveLength(1);
    expect(pintats[0].props.config.language).toBe('en');
  });

  test('sense cap llengua de l’app (llista buida i navigator.language buit, o etiquetes que no són text): cap language i pinta a l’acte', async () => {
    for (const [llengues, llengua] of [[[], ''], [[42, null, {}], 'oc']]) {
      dispositiu.llengues = llengues;
      dispositiu.llengua = llengua;
      await avalua();
      expect(pintats).toHaveLength(1);
      expect(pintats[0].props.config).toEqual({ ...CAPA_NATIVA, ...DEL_LLOC });
    }
  });

  test('una llista buida cau a navigator.language', async () => {
    dispositiu.llengues = [];
    dispositiu.llengua = 'eu-ES';
    await avalua();
    const { carregaDiccionari } = await import('../config/i18n.js');
    await carregaDiccionari('eu');
    await Promise.resolve();
    expect(pintats).toHaveLength(1);
    expect(pintats[0].props.config.language).toBe('eu');
  });
});

/* P0-24 (G2120-07, marató 261101_2143) · A Android, l'entrada connecta l'Arrere
   natiu abans del primer pintat: la funció que el natiu avalua i l'estat inicial.
   A iOS (sense Arrere), res. */
describe('l’Arrere natiu (P0-24)', () => {
  afterEach(() => {
    delete window.__sdpEnrere;
    vi.unstubAllGlobals();
  });

  test('a Android connecta l’Arrere natiu: window.__sdpEnrere i l’estat inicial (0 capes) cap al connector', async () => {
    const nativePromise = vi.fn(() => Promise.resolve());
    vi.stubGlobal('Capacitor', { getPlatform: () => 'android', nativePromise });
    await avalua();
    await new Promise((r) => setTimeout(r, 0));
    expect(typeof window.__sdpEnrere).toBe('function');
    expect(window.__sdpEnrere()).toBe(false);
    expect(nativePromise).toHaveBeenCalledWith('EnrereNatiu', 'estat', { capes: 0 });
    expect(pintats).toHaveLength(1);
  });

  test('a iOS no hi ha cap funció de l’Arrere ni cap crida al connector', async () => {
    const nativePromise = vi.fn(() => Promise.resolve());
    vi.stubGlobal('Capacitor', { getPlatform: () => 'ios', nativePromise });
    await avalua();
    await new Promise((r) => setTimeout(r, 0));
    expect('__sdpEnrere' in window).toBe(false);
    expect(nativePromise).not.toHaveBeenCalledWith('EnrereNatiu', expect.anything(), expect.anything());
  });
});

/* B8C-4 (marató 261101_2143) · Els avisos push natius, darrere de la bandera.
   Amb la bandera de debò (apagada), l'adaptador ni es carrega. Amb la bandera
   simulada encesa i el pont sense el connector PushNotifications (el que hi
   haurà fins que el Mestre l'instal·le), es registra una sola vegada amb motiu
   'sense-connector' (registrar no crida estat()), sense cap crida nativa i
   sense res a la consola. Un registre que falla ho diu i l'App es pinta igual.
   ARB-N04-01 (corrector) · Cada prova porta el seu adaptador: un vi.doMock nou
   (un mòdul simulat sobreviu a resetModules) que compta les càrregues d'esta
   prova i posa el nucli fals per l'embolcall. @capacitor/core no se simula mai:
   simular-lo i desfer-ho el torna a avaluar, i el de veres trepitja el
   Capacitor simulat de les proves de Fase D (getPlatform passa a dir 'web'). */
describe('B8C-4 · els avisos push natius, darrere de la bandera', () => {
  const nucliSenseConnector = () => ({
    Capacitor: { isPluginAvailable: vi.fn(() => false), getPlatform: vi.fn(() => 'android') },
    registerPlugin: vi.fn()
  });
  const carrega = { vegades: 0, fabrica: null };
  const ambAdaptador = (nucli) => {
    vi.doMock('./avisosPushNatius.js', async (importOriginal) => {
      carrega.vegades += 1;
      const original = await importOriginal();
      carrega.fabrica = vi.fn((...args) => original.adaptadorPushNatiuPerAlRegistre(args[0], { ...args[1], nucli }));
      return { ...original, adaptadorPushNatiuPerAlRegistre: carrega.fabrica };
    });
  };
  const ambBanderaEncesa = (canvis = {}) => {
    vi.doMock('../config/avisosPushXat.js', async (importOriginal) => {
      const original = await importOriginal();
      return { ...original, AVISOS_PUSH_XAT_ACTIUS: true, registraAvisosPush: vi.fn(original.registraAvisosPush), ...canvis };
    });
  };
  afterEach(() => {
    vi.doUnmock('../config/avisosPushXat.js');
    vi.doUnmock('./avisosPushNatius.js');
    carrega.vegades = 0;
    carrega.fabrica = null;
  });

  /* Onada R9 (C3, G8-08 f) · La bandera de debò és encesa des del 261106: el
     camí apagat (si el Mestre la torna a apagar) es prova apagant-la a mà. */
  const ambBanderaApagada = () => {
    vi.doMock('../config/avisosPushXat.js', async (importOriginal) => ({ ...(await importOriginal()), AVISOS_PUSH_XAT_ACTIUS: false }));
  };

  test('la bandera de debò és encesa (ordre del Mestre del 261106)', async () => {
    const real = await vi.importActual('../config/avisosPushXat.js');
    expect(real.AVISOS_PUSH_XAT_ACTIUS).toBe(true);
  });

  test('amb la bandera apagada: l’adaptador ni es carrega i el registre continua sense adaptador', async () => {
    ambAdaptador(nucliSenseConnector());
    ambBanderaApagada();
    await avalua();
    await new Promise((r) => setTimeout(r, 0));
    const registre = await import('../config/avisosPushXat.js');
    expect(registre.AVISOS_PUSH_XAT_ACTIUS).toBe(false);
    expect(registre.avisosPushDisponibles()).toBe(false);
    expect(registre.instantaniaAvisosPush()).toMatchObject({ disponible: false, tipus: null, motiu: null });
    expect(carrega.vegades).toBe(0);
    expect(pintats).toHaveLength(1);
  });

  test('amb la bandera encesa i el pont sense el connector: una sola vegada, motiu sense-connector, cap crida nativa ni res a la consola', async () => {
    const consola = ['log', 'info', 'warn', 'error', 'debug'].map((nivell) => vi.spyOn(console, nivell).mockImplementation(() => {}));
    const nucli = nucliSenseConnector();
    ambAdaptador(nucli);
    ambBanderaEncesa();
    try {
      await avalua();
      const registre = await import('../config/avisosPushXat.js');
      await vi.waitFor(() => expect(registre.avisosPushDisponibles()).toBe(true));
      expect(registre.registraAvisosPush).toHaveBeenCalledTimes(1);
      expect(registre.instantaniaAvisosPush()).toMatchObject({ disponible: true, tipus: 'natiu', motiu: 'sense-connector', estat: 'inactiu', ambServidor: false });
      expect(carrega.vegades).toBe(1);
      // L'entrada el construïx amb el nucli de per defecte: cap opció seua.
      expect(carrega.fabrica.mock.calls).toEqual([[]]);
      expect(nucli.Capacitor.isPluginAvailable).toHaveBeenCalledWith('PushNotifications');
      expect(nucli.registerPlugin).not.toHaveBeenCalled();
      expect(pintats).toHaveLength(1);
      for (const espia of consola) expect(espia).not.toHaveBeenCalled();
    } finally {
      for (const espia of consola) espia.mockRestore();
    }
  });

  test('un registre que falla ho diu per la consola, sense cap rebuig sense amo, i l’App es pinta igual', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const senseAmo = vi.fn();
    process.on('unhandledRejection', senseAmo);
    const fallada = new Error('ja registrat');
    ambAdaptador(nucliSenseConnector());
    ambBanderaEncesa({ registraAvisosPush: vi.fn(() => { throw fallada; }) });
    try {
      const { host } = await avalua();
      await vi.waitFor(() => expect(error).toHaveBeenCalledWith('[natiu] Avisos push no registrats:', fallada));
      await new Promise((r) => setTimeout(r, 0));
      expect(carrega.vegades).toBe(1);
      expect(senseAmo).not.toHaveBeenCalled();
      expect(host.arrenca).toHaveBeenCalledTimes(1);
      expect(pintats).toHaveLength(1);
    } finally {
      process.off('unhandledRejection', senseAmo);
      error.mockRestore();
    }
  });
});
