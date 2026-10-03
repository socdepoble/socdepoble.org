/* Model B (decisions A1 i A3 del Mestre, 261003) · les entrades pròpies de
   Sóc de Poble declaren el backend i el tenant per la via interna (la capa del
   paquet), abans que cap amfitrió parle, i no els passen per cap canal
   d'amfitrió: ni configura() ni el JSON de l'element.
     · main.jsx, el lloc propi (`npm run dev` i socdepoble.org): les mateixes
       VITE_* de sempre.
     · embed.jsx, el paquet autònom: les VITE_* que segella el build.
   host.js i l'App no hi pinten res: s'espien. Tot és sintètic. */
import { afterEach, expect, test, vi } from 'vitest';

const ENTORN = vi.hoisted(() => {
  const entorn = {
    VITE_SUPABASE_URL: 'https://paquet.supabase.test',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_del_paquet',
    VITE_DATA_MODE: 'seed',
    VITE_TENANT_ID: '11111111-1111-4111-8111-111111111111'
  };
  for (const [variable, valor] of Object.entries(entorn)) vi.stubEnv(variable, valor);
  return entorn;
});
const pintats = vi.hoisted(() => []);

vi.mock('./host.js', () => ({ configura: vi.fn(), arrenca: vi.fn(), arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('./config/capaDelPaquet.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, fixaCapaDelPaquet: vi.fn(original.fixaCapaDelPaquet) };
});
vi.mock('react-dom/client', () => ({ createRoot: () => ({ render: (node) => pintats.push(node) }) }));
vi.mock('./PedraSecaEmbed.jsx', () => ({ default: () => null }));
vi.mock('./css/index.css?inline', () => ({ default: '' }));

const DEL_PAQUET = Object.freeze({
  supabaseUrl: ENTORN.VITE_SUPABASE_URL,
  supabaseAnonKey: ENTORN.VITE_SUPABASE_ANON_KEY,
  dataMode: ENTORN.VITE_DATA_MODE,
  tenantId: ENTORN.VITE_TENANT_ID
});

/** Avalua l'entrada en un registre de mòduls nou, amb un #root buit. */
async function avalua(importaEntrada) {
  vi.resetModules();
  pintats.length = 0;
  document.body.innerHTML = '<div id="root"></div>';
  await importaEntrada();
  return { host: await import('./host.js'), capa: await import('./config/capaDelPaquet.js') };
}

/* vi.resetModules() no reinicia els mòduls simulats: els espies (i la capa,
   que les dues entrades fixen amb els mateixos valors) es conserven entre
   proves. Es buiden els comptadors. */
afterEach(() => {
  document.body.replaceChildren();
  vi.clearAllMocks();
});

test('main.jsx: fixa la capa del paquet amb les VITE_* abans de configura(), i configura() no porta backend ni tenant', async () => {
  const { host, capa } = await avalua(() => import('./main.jsx'));
  expect(capa.fixaCapaDelPaquet).toHaveBeenCalledTimes(1);
  expect(capa.fixaCapaDelPaquet).toHaveBeenCalledWith(DEL_PAQUET);
  expect(capa.capaDelPaquet()).toEqual(DEL_PAQUET);
  expect(host.configura).toHaveBeenCalledTimes(1);
  expect(capa.fixaCapaDelPaquet.mock.invocationCallOrder[0]).toBeLessThan(host.configura.mock.invocationCallOrder[0]);
  const [[opcions]] = host.configura.mock.calls;
  expect(Object.keys(opcions).sort()).toEqual(['auth', 'config']);
  expect(opcions.config).toEqual({ pluginUrl: '/', manageDocumentHead: true, routerType: 'browser' });
  expect(capa.separaClausDelPaquet(opcions.config).descartades).toEqual([]);
  // L'App del lloc rep la capa del paquet per davall de la del lloc, com l'element.
  expect(pintats).toHaveLength(1);
  expect(pintats[0].props.config).toEqual({ ...DEL_PAQUET, pluginUrl: '/', manageDocumentHead: true, routerType: 'browser' });
  expect(host.exposaGlobal).toHaveBeenCalledTimes(1);
  expect(host.arrenca).toHaveBeenCalledTimes(1);
});

test('embed.jsx: fixa la capa del paquet abans d’exposar l’API (i de drenar la cua), i el JSON del #root no porta backend ni tenant', async () => {
  const { host, capa } = await avalua(() => import('./embed.jsx'));
  expect(capa.fixaCapaDelPaquet).toHaveBeenCalledTimes(1);
  expect(capa.fixaCapaDelPaquet).toHaveBeenCalledWith(DEL_PAQUET);
  expect(capa.capaDelPaquet()).toEqual(DEL_PAQUET);
  expect(host.exposaGlobal).toHaveBeenCalledTimes(1);
  expect(capa.fixaCapaDelPaquet.mock.invocationCallOrder[0]).toBeLessThan(host.exposaGlobal.mock.invocationCallOrder[0]);
  expect(host.configura).not.toHaveBeenCalled();
  const element = document.querySelector('#root > soc-de-poble');
  expect(JSON.parse(element.getAttribute('config'))).toEqual({ pluginUrl: '/', routerType: 'browser', manageDocumentHead: false });
  // Cap clau que l'element descartaria (backend, tenant ni serveis propis): el #root no perd res.
  expect(capa.separaClausDelPaquet(JSON.parse(element.getAttribute('config'))).descartades).toEqual([]);
  for (const atribut of ['tenant-id', 'supabase-url', 'supabase-anon-key', 'backend-url', 'data-mode',
    'oauth-relay-url', 'bot-api-url', 'sollutia-issuer']) {
    expect(element.hasAttribute(atribut), atribut).toBe(false);
  }
});
