// @vitest-environment node
/* P1-12 · E2EE amb la bandera real apagada (E2EE_ACTIU_PER_DEFECTE = false,
   src/config/xifratXat.js): host.js no passa cap adaptador pel decorador, no
   registra cap servei, no toca IndexedDB ni fa soroll. Viu a l'arrel de src/
   (al costat de host.js, com PedraSecaEmbed.*.test.jsx) i es diu
   *.seguretat.test.js perquè entre al pre-commit (vitest.precommit.config.js,
   PRECOMMIT_INCLUDE: tota prova *.seguretat.test.{js,jsx} de davall de src/);
   abans vivia a tests/host.xifrat.apagat.test.js, fora del patró
   (pla 261029_1305, Bloc C, E1.4). */
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
const R = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');
const espia = vi.hoisted(() => ({ decorador: null }));
vi.mock('./PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
vi.mock('./data/identitat.js', () => ({ adoptaSessioExterna: vi.fn(), esborraSessio: vi.fn(), configuraBackendSessio: vi.fn() }));
vi.mock('./utils/sanitize.js', () => ({ sanitizeHtml: (x) => x }));
vi.mock('./data/xifratXat.js', async (orig) => { const m = await orig(); espia.decorador = vi.fn(m.ambXifratXat); return { ...m, ambXifratXat: espia.decorador }; });
vi.mock('./data/supabase/index.js', async () => {
  const { CONTRACTE_NUCLI } = await import('./data/contracte.js');
  return Object.fromEntries(CONTRACTE_NUCLI.map((n) => [n, vi.fn(() => n)]));
});
let consola;
beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('indexedDB', { open: vi.fn() });
  consola = ['log', 'warn', 'error', 'info', 'debug'].map((k) => vi.spyOn(console, k));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const sorollE2EE = () => consola.flatMap((s) => s.mock.calls).map((c) => c.map(String).join(' ')).filter((t) => /xifra|e2ee|clau|indexeddb/i.test(t));

test('flag real = false: adaptador injectat → el decorador no es crida, cap servei, receptor i arguments intactes per a tot el port', async () => {
  const { E2EE_ACTIU_PER_DEFECTE } = await import(R + '/config/xifratXat.js');
  expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
  const { CONTRACTE_NUCLI, CAPACITATS } = await import(R + '/data/contracte.js');
  const host = await import(R + '/host.js');
  const noms = [...new Set([...CONTRACTE_NUCLI, ...CAPACITATS.xatMultimedia])];
  const crides = [];
  const impl = Object.fromEntries(noms.map((n) => [n, function (...args) { crides.push([n, this, args]); return `r:${n}`; }]));
  const errorAsinc = new Error('fallada sintètica');
  impl.enviaMissatge = function (...args) { crides.push(['enviaMissatge', this, args]); return Promise.reject(errorAsinc); };
  const retorn = host.injectaBackendDelPaquet(impl);
  expect(retorn.pendents).toEqual([]);
  await host.arrenca();
  expect(espia.decorador).not.toHaveBeenCalled();
  const port = await import(R + '/data/backendPort.js');
  const { serveiXifratXat } = await import(R + '/data/xifratXat.js');
  const backend = port.getBackendImplementation();
  expect(Object.isFrozen(backend)).toBe(true);
  expect(serveiXifratXat(backend)).toBeNull();
  expect(Object.keys(backend).sort()).toEqual([...noms].sort());
  crides.length = 0;
  const XAT = ['loadFils', 'loadMissatges', 'enviaMissatge', 'appendChatMessages', 'marcaLlegit', 'creaFilDirecte', 'carregaMembres', 'subscribeToXat', 'unsubscribeFromXat', 'obriFilDePagina', 'quotaXat', 'publicaAdjuntXat', 'urlAdjuntXat', 'descartaAdjuntXat'].filter((n) => noms.includes(n) && typeof port[n] === 'function');
  expect(XAT.length).toBeGreaterThanOrEqual(8);
  const a = { id: 'fil-sintetic' }, b = Object.freeze({ signal: null }), c = 3;
  for (const n of XAT) {
    if (n === 'enviaMissatge') { await expect(port.enviaMissatge(a, b, c)).rejects.toBe(errorAsinc); continue; }
    expect(port[n](a, b, c), n).toBe(`r:${n}`);
  }
  expect(crides.map(([n]) => n)).toEqual(XAT);
  for (const [, that, args] of crides) { expect(that).toBe(impl); expect(args).toHaveLength(3); expect(args[0]).toBe(a); expect(args[1]).toBe(b); expect(args[2]).toBe(c); }
  for (const n of [...CAPACITATS.clausXat, ...CAPACITATS.xatMultimediaXifrat]) {
    expect(port.teCapacitat('clausXat')).toBe(false);
    expect(() => port[n](a)).toThrow('no està implementat');
  }
  expect(globalThis.indexedDB.open).not.toHaveBeenCalled();
  expect(sorollE2EE()).toEqual([]);
});

test('flag real = false: adaptador per defecte (import dinàmic) → tampoc passa pel decorador ni registra servei', async () => {
  const host = await import(R + '/host.js');
  await host.arrenca();
  expect(espia.decorador).not.toHaveBeenCalled();
  const port = await import(R + '/data/backendPort.js');
  const { serveiXifratXat } = await import(R + '/data/xifratXat.js');
  expect(serveiXifratXat(port.getBackendImplementation())).toBeNull();
  expect(port.teCapacitat('clausXat')).toBe(false);
  expect(port.teCapacitat('xatMultimediaXifrat')).toBe(false);
  expect(globalThis.indexedDB.open).not.toHaveBeenCalled();
  expect(sorollE2EE()).toEqual([]);
});
