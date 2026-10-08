/**
 * Decisió 5 del Mestre (261007) · el paquet trossejat de punta a punta, amb el
 * host.js de veritat: el carregador clàssic deixa el SocDePoble provisional, un
 * <script> de l'amfitrió posat DESPRÉS del paquet hi parla (LLEI 1, «Sessió»)
 * abans que arribe cap mòdul, i embed.jsx, en avaluar-se, en pren el control,
 * exposa l'API real i hi reprodueix les crides en ordre.
 *
 * Com src/embed.arrencada.test.jsx, només se substituïxen l'adaptador de
 * Supabase (parlaria amb la xarxa), l'App (un joc de rutes mínim) i els
 * proveïdors de sessió i d'identitat. El paquet s'avalua una sola vegada per
 * fitxer, com en una pàgina: l'API real no es pot tornar a definir. Les proves
 * van en ordre i compartixen la pàgina. L'import que faria el carregador no
 * resol mai: ací el «mòdul» és l'import('./embed.jsx') de la prova.
 */
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { act } from '@testing-library/react';
import { CONTRACTE_AMFITRIO_V1 } from './config/contracteAmfitrio.js';
import { instalaCarregador } from './config/carregadorDelPaquet.js';

vi.hoisted(() => {
  for (const variable of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_DATA_MODE', 'VITE_TENANT_ID']) vi.stubEnv(variable, '');
});
vi.mock('./data/supabase/index.js', async () => {
  const { CONTRACTE_NUCLI } = await import('./data/contracte.js');
  return Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => undefined]));
});
vi.mock('./app/contexts/SessionContext.jsx', () => ({ SessionProvider: ({ children }) => children }));
vi.mock('./app/contexts/IdentitatContext.jsx', () => ({ IdentitatProvider: ({ children }) => children }));
vi.mock('./app/App.jsx', async () => {
  const { Route, Routes } = await import('./app/contexts/RouterContext.jsx');
  function AppDeProva() {
    return (
      <Routes>
        <Route path="*" element={<p>Pantalla de prova</p>} />
      </Routes>
    );
  }
  return { default: AppDeProva };
});

const DIST = 'https://amfitrio.invalid/wp-content/plugins/socdepoble-enxufe/dist/';
const SRC = `${DIST}soc-de-poble.standalone.js?ver=1.0.5.abc`;
const MODUL = 'trossos/soc-de-poble-Prova123.js';
const AUTH = Object.freeze({ issuer: 'https://emissor.invalid', audiences: ['socdepoble'] });

let provisional;
let diferida;
let configurada;
/* Els console.error de l'avaluació del mòdul: la sessió de la cua rebutjada i
   l'avís de redirecció (vegeu les proves del final). */
let errorsDeLAvaluacio = [];

const pendentDespresDe = async (promesa) => {
  const marca = Symbol('pendent');
  return Promise.race([promesa, new Promise((resolve) => { setTimeout(() => resolve(marca), 20); })]).then((valor) => valor === marca);
};

beforeAll(async () => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  const caixa = document.createElement('div');
  caixa.className = 'socdepoble-enxufe';
  caixa.append(document.createElement('soc-de-poble'));
  document.body.append(caixa);

  // 0 · Un <script> de l'amfitrió ABANS del paquet deixa la seua cua (canal 3 de host.js).
  window.SocDePobleCua = [];

  // 1 · El carregador clàssic (el <script src> del paquet, amb el ?ver= de WordPress).
  const script = document.createElement('script');
  script.setAttribute('src', SRC);
  provisional = instalaCarregador(window, document, script,
    { modul: MODUL, claus: CONTRACTE_AMFITRIO_V1.api.claus, fitxer: 'soc-de-poble.standalone.js' },
    () => new Promise(() => {}));

  // 2 · El <script> de l'amfitrió, DESPRÉS del paquet: abans que arribe cap mòdul.
  if (window.SocDePoble) {
    diferida = window.SocDePoble.deferArrenca();
    configurada = window.SocDePoble.configura({ auth: AUTH });
  }
  /* Relleu 261007 · i, encara abans del mòdul, una sessió per la cua (el push
     natiu de l'Array: processarCua encara no l'ha substituït). El testimoni és
     sintètic: només interessa en quin moment arriba, no si és vàlid. */
  window.SocDePobleCua.push(['sessio', { access_token: 'sintetic' }]);

  // 3 · El mòdul d'entrada s'avalua (el que faria l'import() del carregador).
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await act(async () => { await import('./embed.jsx'); });
    errorsDeLAvaluacio = error.mock.calls.map(([missatge]) => String(missatge));
  } finally {
    error.mockRestore();
  }
});

afterAll(() => {
  delete window.SocDePobleCua;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('el mòdul pren el control: l’API real substituïx el provisional, congelada i no configurable', () => {
  expect(provisional).not.toBeNull();
  const real = window.SocDePoble;
  expect(real).not.toBe(provisional);
  expect(Object.isFrozen(real)).toBe(true);
  expect(Object.getOwnPropertyDescriptor(window, 'SocDePoble').configurable).toBe(false);
  expect(Object.keys(real)).toEqual(Object.keys(provisional));
  expect(real.isReady).toBe(true);
  expect(provisional.isReady).toBe(true);
});

test('les crides encuades arriben a l’API real, en ordre, amb el seu resultat', async () => {
  await expect(diferida).resolves.toBeUndefined();
  const resultat = await configurada;
  expect(Object.keys(resultat).sort()).toEqual(['acceptats', 'descartades', 'desconeguts', 'pendents']);
  expect(window.SocDePoble.estat().config.sollutiaIssuer).toBe(AUTH.issuer);
});

test('la base de recursos és la del carregador, sense consulta ni barra final', async () => {
  const { baseRecursos } = await import('./config/assetResolver.js');
  expect(baseRecursos()).toBe(DIST.replace(/\/$/, ''));
});

test('deferArrenca es respecta: arrencaAuto no segella, i el provisional reenvia arrenca() a l’API real', async () => {
  expect(await pendentDespresDe(window.SocDePoble.quanLlest())).toBe(true);
  expect(provisional.estat().fase).toBe('configurable');
  let estatFinal;
  await act(async () => { estatFinal = await provisional.arrenca(); });
  expect(estatFinal.fase).toBe('segellat');
  expect(customElements.get('soc-de-poble')).toBeTypeOf('function');
  await expect(window.SocDePoble.quanLlest()).resolves.toMatchObject({ fase: 'segellat' });
});

/* Relleu 261007 · ordre entre canals (risc declarat a embed.jsx): exposaGlobal
   buida SocDePobleCua ABANS que adopta reproduïsca el provisional. Un push
   posterior al carregador passa davant de les crides al provisional que el
   precedien. Si mai es canvia l'ordre, esta prova ha de canviar amb la decisió. */
test('ordre entre canals: la sessió posada a SocDePobleCua després del carregador s’executa abans que el configura encuat al provisional', () => {
  // La sessió ha arribat sense emissor: el configura encara no s'havia reproduït (fail-closed).
  expect(errorsDeLAvaluacio.some((missatge) => missatge.includes('no s\'ha configurat cap emissor'))).toBe(true);
  // I el configura, reproduït després, sí que ha fixat l'emissor.
  expect(window.SocDePoble.estat().config.sollutiaIssuer).toBe(AUTH.issuer);
  // La cua s'ha buidat i, des d'ara, push executa a l'instant.
  expect(window.SocDePobleCua).toHaveLength(0);
  expect(Object.hasOwn(window.SocDePobleCua, 'push')).toBe(true);
});

/* Relleu 261007 · el mapa de mòduls s'indexa amb l'URL demanada i
   import.meta.url és la final. Ací el carregador ha demanat
   ${DIST}trossos/… i el mòdul s'avalua des del fitxer de la prova: és
   exactament la condició d'una redirecció, i embed.jsx l'ha de dir. */
test('un mòdul avaluat a una URL que no és la que ha demanat el carregador ho diu a la consola', () => {
  const avisos = errorsDeLAvaluacio.filter((missatge) => missatge.includes('[sdp-carregador]'));
  expect(avisos).toHaveLength(1);
  expect(avisos[0]).toContain(`${DIST}${MODUL}`);
  expect(avisos[0]).toMatch(/s'ha servit amb una redirecció/);
});

test('provisionalDelPaquet.js és el PRIMER import d’embed.jsx: fixa la base abans que s’avalue host.js', () => {
  const codi = fs.readFileSync(path.join(process.cwd(), 'src/embed.jsx'), 'utf8');
  const imports = [...codi.matchAll(/^import\s.*?from\s+['"]([^'"]+)['"];?$/gm)].map((m) => m[1]);
  expect(imports[0]).toBe('./config/provisionalDelPaquet.js');
  expect(imports.indexOf('./config/provisionalDelPaquet.js')).toBeLessThan(imports.indexOf('./host.js'));
});
