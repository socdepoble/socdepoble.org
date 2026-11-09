import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ calls: [], prepare: null, seal: null, layer: null, registrats: [], missatges: Object.freeze({ addEventListener() {}, removeEventListener() {} }) }));
vi.mock('./css/index.css?inline', () => ({ default: '' }));
vi.mock('react-dom/client', () => ({ createRoot: () => { state.calls.push('createRoot'); return { render: () => state.calls.push('render') }; } }));
vi.mock('./PedraSecaEmbed.jsx', () => ({ default: () => null }));
vi.mock('./host.js', () => ({
  configura: () => state.calls.push('configura'),
  arrenca: () => { state.calls.push('arrenca'); return state.seal; },
  exposaGlobal: () => state.calls.push('exposaGlobal')
}));
vi.mock('./config/capaDelPaquet.js', () => ({
  fixaCapaDelPaquet: capa => { state.layer = capa; state.calls.push('capaLegacy'); },
  capaDelPaquet: () => state.layer || {}
}));
vi.mock('./pwa/registre.js', () => ({ registraServiceWorker() {}, registreActiu() {}, registreDelSw() {}, portMissatgesAvisos: () => state.missatges, ESDEVENIMENT_AVIS_XAT: 'test' }));
/* Onada R9 (C3, G8-08) · La bandera és la de debò (encesa des del 261106): el
   bloc dels avisos de main.jsx corre de veres, amb el motor i l'adaptador
   simulats, i no ha de tocar l'ordre de l'arrencada ni escriure a la consola. */
vi.mock('./config/avisosPushXat.js', async (importOriginal) => ({
  AVISOS_PUSH_XAT_ACTIUS: (await importOriginal()).AVISOS_PUSH_XAT_ACTIUS,
  registraAvisosPush: (adaptador) => { state.registrats.push(adaptador); return true; }
}));
vi.mock('./config/motorAvisosPushXat.js', () => ({}));
vi.mock('./pwa/adaptadorAvisosPush.js', () => ({ creaAvisosPushWeb: (opcions) => ({ adaptadorFals: true, opcions }) }));
vi.mock('./pwa/instalacio.js', () => ({ capturaInstalacio() {} }));
vi.mock('./config/i18n.js', () => ({ pintaAmbDiccionari: pinta => pinta() }));
vi.mock('./config/fallbackBessones.js', () => ({ instalaFallbackDeBessones() {} }));
vi.mock('./config/configAmfitrio.js', () => ({ llegeixConfigAmfitrio: () => ({}) }));
vi.mock('./data/traductorDelLloc.js', () => ({ fixaCarregadorLliure() {}, fixaTraductorLliure() {} }));
const barrier = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
beforeEach(() => {
  vi.resetModules(); state.calls = []; state.layer = null; state.registrats = [];
  const arrel = document.createElement('div');
  arrel.id = 'root';
  document.body.replaceChildren(arrel);
  Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
function mockNode0(active) {
  vi.doMock('./data/node0/arrencadaNodeZero.js', () => ({ NODE_ZERO_HTTP_ACTIU: active, preparaArrencadaNodeZero: () => { state.calls.push('preparaNode0'); return typeof state.prepare === 'function' ? state.prepare() : state.prepare; } }));
}

test('main Node0 espera el backend abans de configurar i el segell abans de renderitzar', async () => {
  const prepare = barrier(), seal = barrier(); state.prepare = prepare.promise; state.seal = seal.promise;
  mockNode0(true);
  await import('./main.jsx');
  await vi.waitFor(() => expect(state.calls).toEqual(['preparaNode0']));
  prepare.resolve({ actiu: true });
  await vi.waitFor(() => expect(state.calls).toEqual(['preparaNode0', 'configura', 'exposaGlobal', 'arrenca']));
  expect(state.layer).toBeNull();
  seal.resolve();
  await vi.waitFor(() => expect(state.calls).toEqual(['preparaNode0', 'configura', 'exposaGlobal', 'arrenca', 'createRoot', 'render']));
});

test('main per defecte conserva la capa anterior i pinta sense esperar el segell asíncron de sempre', async () => {
  const seal = barrier(); state.seal = seal.promise; mockNode0(false);
  vi.stubEnv('VITE_SUPABASE_URL', 'https://original.supabase.test');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-original');
  vi.stubEnv('VITE_DATA_MODE', 'remote');
  vi.stubEnv('VITE_TENANT_ID', '11111111-2222-3333-4444-555555555555');
  await import('./main.jsx');
  expect(state.calls).toEqual(['capaLegacy', 'configura', 'exposaGlobal', 'arrenca', 'createRoot', 'render']);
  expect(state.layer).toEqual({ supabaseUrl: 'https://original.supabase.test', supabaseAnonKey: 'public-original', dataMode: 'remote', tenantId: '11111111-2222-3333-4444-555555555555' });
  seal.resolve();
  /* Amb la bandera de debò (encesa): un sol registre de l'adaptador web, fora de l'ordre de l'arrencada. */
  await vi.waitFor(() => expect(state.registrats).toHaveLength(1));
  expect(state.registrats[0].adaptadorFals).toBe(true);
  expect(Object.keys(state.registrats[0].opcions).sort()).toEqual(['clau', 'esdevenimentToc', 'missatges', 'produccio', 'registreActiu', 'registreDelSw']);
  // R54: el port de lectura del worker es transmet sense perdre'n la identitat.
  expect(state.registrats[0].opcions.missatges).toBe(state.missatges);
  expect(state.calls).toEqual(['capaLegacy', 'configura', 'exposaGlobal', 'arrenca', 'createRoot', 'render']);
});

test('main Node0 fallit no configura Supabase, no arrenca un altre adaptador i no pinta', async () => {
  state.prepare = () => Promise.reject(new Error('Node0 fixture failure')); state.seal = Promise.resolve(); mockNode0(true);
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  await import('./main.jsx');
  await vi.waitFor(() => expect(log).toHaveBeenCalledTimes(1));
  expect(state.calls).toEqual(['preparaNode0']); expect(state.layer).toBeNull();
});
