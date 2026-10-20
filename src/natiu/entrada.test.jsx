/* L'entrada mínima de l'app nativa (261003, abans de la lease de Capacitor) ·
   ARQUITECTURA.txt §1.2, passos 2, 3 i 4b, amb el tenant del build. Com a
   src/entrades.capaDelPaquet.test.jsx: host.js i l'App no hi pinten res i
   s'espien; tot és sintètic. Quan arribe el selector de poble (després de la
   lease), esta prova creix amb els casos del §5 (ordre amb la tria). */
import { afterEach, describe, expect, test, vi } from 'vitest';
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
  afterEach(() => {
    vi.unstubAllGlobals();
    ambClients('', '');
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

  test('a iOS amb els dos clients: Apple i Google, registrats abans de la capa i sense carregar el connector', async () => {
    vi.stubGlobal('Capacitor', { getPlatform: () => 'ios' });
    ambClients(CLIENT_WEB, CLIENT_IOS);
    const { capa, host } = await avalua();
    const { creaEntradaSocial } = await import('./entradaSocial.js');
    const registre = await import('../config/entradaNativa.js');
    expect(creaEntradaSocial).toHaveBeenCalledWith({ plataforma: 'ios', clients: { googleWeb: CLIENT_WEB, googleIos: CLIENT_IOS } });
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
    await avalua();
    expect((await import('../config/entradaNativa.js')).botonsNatius()).toEqual(['apple']);
    vi.stubGlobal('Capacitor', { getPlatform: () => 'android' });
    await avalua();
    const registre = await import('../config/entradaNativa.js');
    expect(registre.plataformaNativa()).toBe('android');
    expect(registre.botonsNatius()).toEqual([]);
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
