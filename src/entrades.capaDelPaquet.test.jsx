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

/* Onada 12 (261011) · arrenca() torna una promesa, com la de veres: main.jsx li posa un .catch. */
vi.mock('./host.js', () => ({ configura: vi.fn(), arrenca: vi.fn(async () => ({ fase: 'segellat' })), arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
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
  // Un sol node fix: createElement n'hi ha prou; no sanitizeHtml, que lleva l'id="root".
  const arrel = document.createElement('div');
  arrel.setAttribute('id', 'root');
  document.body.replaceChildren(arrel);
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

/* Onada 12 (261011; ordres 261011_0130, punt 7) · El rebuig d'una arrencada
   fallida té amo: es diu per consola i l'App es pinta igual (les vistes el
   reben per quanLlest(), que torna a arrencar en el reintent). */
test('main.jsx: una arrencada que falla no deixa cap rebuig sense amo i l’App es pinta igual', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const senseAmo = vi.fn();
  process.on('unhandledRejection', senseAmo);
  try {
    const fallada = new Error('tros caigut');
    const host = await import('./host.js');
    host.arrenca.mockRejectedValueOnce(fallada);
    await avalua(() => import('./main.jsx'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(host.arrenca).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith('[main] Arrencada fallida:', fallada);
    expect(senseAmo).not.toHaveBeenCalled();
    expect(pintats).toHaveLength(1);
  } finally {
    process.off('unhandledRejection', senseAmo);
    error.mockRestore();
  }
});

test('embed.jsx: fixa la capa del paquet abans d’exposar l’API (i de drenar la cua), i no munta res sobre el #root', async () => {
  const { host, capa } = await avalua(() => import('./embed.jsx'));
  expect(capa.fixaCapaDelPaquet).toHaveBeenCalledTimes(1);
  expect(capa.fixaCapaDelPaquet).toHaveBeenCalledWith(DEL_PAQUET);
  expect(capa.capaDelPaquet()).toEqual(DEL_PAQUET);
  expect(host.exposaGlobal).toHaveBeenCalledTimes(1);
  expect(capa.fixaCapaDelPaquet.mock.invocationCallOrder[0]).toBeLessThan(host.exposaGlobal.mock.invocationCallOrder[0]);
  expect(host.configura).not.toHaveBeenCalled();
  expect(host.arrencaAuto).toHaveBeenCalledTimes(1);
  /* W4-01 (261003): el paquet ja no penja cap element del #root, que pot ser
     d'un altre plugin; només arrenquen els elements explícits. El backend i
     el tenant tampoc no viatgen per cap JSON: no hi ha element que en porte.
     Les proves de l'arrel aliena són a embed.arrel.test.jsx. */
  expect(document.getElementById('root').hasChildNodes()).toBe(false);
  expect(document.querySelector('soc-de-poble')).toBeNull();
});
