/* L'entrada mínima de l'app nativa (261003, abans de la lease de Capacitor) ·
   ARQUITECTURA.txt §1.2, passos 2, 3 i 4b, amb el tenant del build. Com a
   src/entrades.capaDelPaquet.test.jsx: host.js i l'App no hi pinten res i
   s'espien; tot és sintètic. Quan arribe el selector de poble (després de la
   lease), esta prova creix amb els casos del §5 (ordre amb la tria). */
import { afterEach, expect, test, vi } from 'vitest';

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
