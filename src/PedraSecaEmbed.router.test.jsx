/**
 * Enxufe universal · <soc-de-poble> tria el router per declaració.
 *
 * Es munta l'element de veritat (customElements, shadow root tancat, arrel de
 * React pròpia) i el PedraSecaEmbed de veritat, amb els routers i el useSEO
 * de veritat. Només es substituïxen l'App, que ací és un joc de rutes mínim,
 * i els proveïdors de sessió i d'identitat, que parlarien amb el backend.
 * El shadow root és tancat: la prova el llig per la referència privada
 * `_closedRoot`, com ho faria qui depura l'element.
 * L'historial es vigila amb espies sobre pushState i replaceState.
 *
 * El paquet d'aquestes proves no porta backend de fàbrica: les variables
 * VITE_* del backend es buiden abans d'avaluar l'element, perquè ací es
 * mira el que diu l'amfitrió i no el .env de qui les executa. Els defectes
 * del paquet es proven a PedraSecaEmbed.config.test.jsx.
 * configura({config}) deixa la seua config a la política d'execució; ací la
 * política es canvia per prova (`configura()` de més avall).
 */
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import PedraSecaEmbed, { activeElements, defineCustomElement } from './PedraSecaEmbed.jsx';
import { normalizeBackendConfig } from './config/backendConfig.js';

vi.hoisted(() => {
  for (const variable of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_DATA_MODE', 'VITE_TENANT_ID']) vi.stubEnv(variable, '');
});
const politica = vi.hoisted(() => ({ actual: null }));
vi.mock('./config/runtimePolicy.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, getRuntimePolicy: (noAutoFreeze) => politica.actual ?? original.getRuntimePolicy(noAutoFreeze) };
});
vi.mock('./host.js', () => ({ arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('./app/contexts/SessionContext.jsx', () => ({ SessionProvider: ({ children }) => children }));
vi.mock('./app/contexts/IdentitatContext.jsx', () => ({ IdentitatProvider: ({ children }) => children }));
vi.mock('./app/App.jsx', async () => {
  const { Link, Navigate, Route, Routes, useLocation, useParams } = await import('./app/contexts/RouterContext.jsx');
  const { useSEO } = await import('./hooks/useSEO.js');
  function OnSoc() {
    const { pathname, search } = useLocation();
    return <output data-sonda="on">{pathname + (search ? `?${search}` : '')}</output>;
  }
  function Poble() {
    const { pobleId } = useParams();
    return <p>{`Poble ${pobleId}`}</p>;
  }
  // Com qualsevol vista de l'app: demana la capçalera, i qui mana decidix si s'hi escriu.
  function Capcalera() {
    useSEO({ title: 'Títol de l’app' });
    return null;
  }
  function AppDeProva() {
    return (
      <>
        <OnSoc />
        <Capcalera />
        <Link to="/xat">Xat</Link>
        <Routes>
          <Route path="/" element={<Navigate to="/xat" replace />} />
          <Route path="/xat" element={<p>Pantalla del xat</p>} />
          <Route path="/pobles" element={<p>Pobles</p>} />
          <Route path="/pobles/:pobleId" element={<Poble />} />
          <Route path="*" element={<p>NotFound</p>} />
        </Routes>
      </>
    );
  }
  return { default: AppDeProva };
});

const TITOL_AMFITRIO = 'Pàgina de l’amfitrió';
const CANONICAL_AMFITRIO = 'https://amfitrio.test/pagina';

let push;
let replace;

/** Posa l'amfitrió en una URL i, a partir d'ací, compta les escriptures a l'historial. */
function situa(url) {
  window.history.replaceState(null, '', url);
  push = vi.spyOn(window.history, 'pushState');
  replace = vi.spyOn(window.history, 'replaceState');
}
const escriptures = () => push.mock.calls.length + replace.mock.calls.length;

async function munta(atributs = {}, pare = document.body) {
  const element = document.createElement('soc-de-poble');
  for (const [nom, valor] of Object.entries(atributs)) element.setAttribute(nom, valor);
  await act(async () => { pare.appendChild(element); });
  return element;
}
const dins = (element) => element._closedRoot;
const on = (element) => dins(element).querySelector('[data-sonda="on"]').textContent;
const text = (element) => dins(element).textContent;

function capcaleraDeLAmfitrio() {
  document.title = TITOL_AMFITRIO;
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = CANONICAL_AMFITRIO;
  document.head.appendChild(canonical);
}
const canonicals = () => [...document.head.querySelectorAll('link[rel="canonical"]')].map((node) => node.href);

/** Com host.js:configura(): la config de l'amfitrió, normalitzada, queda a la política. */
function configura(config) {
  politica.actual = Object.freeze({ 
    backendConfig: Object.freeze({ ...normalizeBackendConfig(config) }),
    rawHostConfig: config
  });
}

beforeAll(() => {
  defineCustomElement();
});

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
});

afterEach(async () => {
  cleanup();
  await act(async () => {
    for (const element of [...activeElements]) {
      element.remove();
      element._desmuntaAra();
    }
  });
  document.body.replaceChildren();
  document.head.querySelectorAll('link[rel="canonical"]').forEach((node) => node.remove());
  document.title = '';
  delete globalThis.SocDePobleConfig;
  politica.actual = null;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

/* ── Router ──────────────────────────────────────────────────────────── */

test('(11) sense routerType ni base, a /comunitat/: memòria, cap NotFound i l’historial intacte', async () => {
  situa('/comunitat/');
  const element = await munta();
  expect(text(element)).toContain('Pantalla del xat');
  expect(text(element)).not.toContain('NotFound');
  expect(on(element)).toBe('/xat');
  expect(escriptures()).toBe(0);
  expect(window.location.pathname).toBe('/comunitat/');
  expect(element.config).not.toHaveProperty('routerType');
  expect(element.config).not.toHaveProperty('basename');
  expect(element.config).not.toHaveProperty('manageDocumentHead');
});

test('(12) base-path /comunitat a /comunitat/: navegador sota la base, acaba a /comunitat/xat', async () => {
  situa('/comunitat/');
  const element = await munta({ 'base-path': '/comunitat' });
  expect(window.location.pathname).toBe('/comunitat/xat');
  expect(on(element)).toBe('/xat');
  expect(text(element)).toContain('Pantalla del xat');
  expect(dins(element).querySelector('a').getAttribute('href')).toBe('/comunitat/xat');
  expect(push).not.toHaveBeenCalled();
  // La base no es copia crua a `basename`: la tria el router, normalitzada.
  expect(element.config).not.toHaveProperty('basename');
});

test('base declarada a basename amb barra final: es normalitza i també hi acaba', async () => {
  situa('/comunitat/');
  const element = await munta({ config: JSON.stringify({ basename: '/comunitat/' }) });
  expect(element.config.basename).toBe('/comunitat');
  expect(window.location.pathname).toBe('/comunitat/xat');
  expect(on(element)).toBe('/xat');
});

test.each([
  ['base-path protocol-relatiu', { 'base-path': '//evil.test' }],
  ['base-path amb barra invertida', { 'base-path': '/\\evil.test' }],
  ['basename protocol-relatiu al JSON', { config: JSON.stringify({ basename: '//evil.test' }) }],
  ['basename absolut al JSON', { config: JSON.stringify({ basename: 'https://evil.test/x' }) }]
])('(13) %s: cap basename ni cap href d’un altre origen', async (_, atributs) => {
  situa('/pagina-de-l-amfitrio');
  const element = await munta(atributs);
  expect(element.config).not.toHaveProperty('basename');
  expect(on(element)).toBe('/xat');
  const hrefs = [...dins(element).querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
  expect(hrefs).toEqual(['/xat']);
  for (const href of hrefs) expect(new URL(href, window.location.href).origin).toBe(window.location.origin);
  expect(escriptures()).toBe(0);
  expect(window.location.pathname).toBe('/pagina-de-l-amfitrio');
});

test.each([
  ['BROWSER'], ['navegador'], [1], [true], [{ tipus: 'browser' }]
])('routerType desconegut (%j) es descarta i l’element navega en memòria', async (routerType) => {
  situa('/pagina-de-l-amfitrio');
  const element = await munta({ config: JSON.stringify({ routerType }) });
  expect(element.config).not.toHaveProperty('routerType');
  expect(on(element)).toBe('/xat');
  expect(escriptures()).toBe(0);
});

test('routerType memory declarat guanya a la base: la URL continua sent de l’amfitrió', async () => {
  situa('/comunitat/');
  const element = await munta({ 'base-path': '/comunitat', config: JSON.stringify({ routerType: 'memory' }) });
  expect(element.config.routerType).toBe('memory');
  expect(on(element)).toBe('/xat');
  expect(escriptures()).toBe(0);
  expect(window.location.pathname).toBe('/comunitat/');
});

test('una segona instància viva navega sempre en memòria, encara que declare navegador', async () => {
  situa('/xat');
  const primera = await munta({ config: JSON.stringify({ routerType: 'browser' }) });
  expect(on(primera)).toBe('/xat');
  const segona = await munta({ config: JSON.stringify({ routerType: 'browser' }) });
  expect(on(segona)).toBe('/xat');
  expect(escriptures()).toBe(0);
  expect(window.location.pathname).toBe('/xat');
  expect(text(primera)).toContain('Pantalla del xat');
});

/* ── Capçalera del document ──────────────────────────────────────────── */

test('(14) en memòria i sense manageDocumentHead, el títol i el canonical són de l’amfitrió', async () => {
  situa('/pagina-de-l-amfitrio');
  capcaleraDeLAmfitrio();
  const element = await munta();
  expect(on(element)).toBe('/xat');
  expect(document.title).toBe(TITOL_AMFITRIO);
  expect(canonicals()).toEqual([CANONICAL_AMFITRIO]);
});

test('control de (14): amb manageDocumentHead true declarat, l’app sí que escriu la capçalera', async () => {
  situa('/pagina-de-l-amfitrio');
  capcaleraDeLAmfitrio();
  const element = await munta({ config: JSON.stringify({ manageDocumentHead: true }) });
  expect(element.config.manageDocumentHead).toBe(true);
  expect(document.title).toBe('Títol de l’app | Sóc de Poble');
});

test.each([
  ['sense routerType', {}],
  ['amb routerType browser', { config: JSON.stringify({ routerType: 'browser' }) }]
])('(15) dins de <div id="root"> %s i sense manageDocumentHead, el títol no es toca', async (_, atributs) => {
  situa('/xat');
  capcaleraDeLAmfitrio();
  const arrel = document.createElement('div');
  arrel.id = 'root';
  document.body.appendChild(arrel);
  const element = await munta(atributs, arrel);
  expect(element.parentNode.id).toBe('root');
  expect(on(element)).toBe('/xat');
  expect(element.config).not.toHaveProperty('manageDocumentHead');
  expect(document.title).toBe(TITOL_AMFITRIO);
  expect(canonicals()).toEqual([CANONICAL_AMFITRIO]);
});

test.each([['true'], [1], ['sí'], [null]])('manageDocumentHead no booleà (%j) es descarta i la capçalera no es toca', async (valor) => {
  situa('/pagina-de-l-amfitrio');
  capcaleraDeLAmfitrio();
  const element = await munta({ config: JSON.stringify({ manageDocumentHead: valor }) });
  expect(element.config).not.toHaveProperty('manageDocumentHead');
  expect(document.title).toBe(TITOL_AMFITRIO);
});

/* ── Punt d'entrada del paquet ───────────────────────────────────────── */

test('(17) el #root del paquet (embed.jsx) declara navegador: a /pobles pinta Pobles a /pobles', async () => {
  situa('/pobles');
  capcaleraDeLAmfitrio();
  const arrel = document.createElement('div');
  arrel.id = 'root';
  document.body.appendChild(arrel);
  await act(async () => { await import('./embed.jsx'); });
  const element = arrel.querySelector('soc-de-poble');
  expect(element).not.toBeNull();
  expect(element.config.routerType).toBe('browser');
  expect(element.config.manageDocumentHead).toBe(false);
  // Sense document.currentScript (mòdul ES), la ruta de sempre.
  expect(element.config.fontsHref).toBe('/fonts/noto-sans.css');
  expect(text(element)).toContain('Pobles');
  expect(text(element)).not.toContain('NotFound');
  expect(on(element)).toBe('/pobles');
  expect(window.location.pathname).toBe('/pobles');
  expect(escriptures()).toBe(0);
  expect(document.title).toBe(TITOL_AMFITRIO);
});

test('Llei del Píxel: la config de main.jsx (sense element) continua sent navegador i ama de la capçalera', async () => {
  situa('/pobles');
  const config = { pluginUrl: '/', manageDocumentHead: true, routerType: 'browser' };
  await act(async () => { render(<PedraSecaEmbed config={config} isFirstInstance={true} />); });
  expect(screen.getByText('Pobles')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Xat' }).getAttribute('href')).toBe('/xat');
  expect(window.location.pathname).toBe('/pobles');
  expect(escriptures()).toBe(0);
  expect(document.title).toBe('Títol de l’app | Sóc de Poble');
});

/* ── Canal de l'amfitrió i ruta inicial ──────────────────────────────── */

test('(19) window.SocDePobleConfig només hi porta nomPoble i poble; la resta del global no arriba mai', async () => {
  situa('/pagina-de-l-amfitrio');
  globalThis.SocDePobleConfig = Object.freeze({
    nomPoble: 'Gent de la Torre', poble: 'la-torre-de-les-macanes',
    supabaseUrl: 'https://evil.test', backend_url: 'https://evil.test', backendUrl: 'https://evil.test',
    supabaseAnonKey: 'sb_secret_evil', tenantId: '00000000-0000-0000-0000-000000000000', tenant_id: 'evil',
    dataMode: 'local', backendId: 'evil', routerType: 'browser', basename: '/amfitrio', basePath: '/amfitrio',
    rutaInicial: '/admin', manageDocumentHead: true, pluginUrl: 'https://evil.test/', fontsHref: 'https://evil.test/f.css',
    oauthRelayUrl: 'https://evil.test/cb', sollutiaIssuer: 'https://evil.test', botApiUrl: 'https://evil.test/bot'
  });
  const element = await munta();
  const config = element.config;
  expect(config.nomPoble).toBe('Gent de la Torre');
  expect(config.poble).toBe('la-torre-de-les-macanes');
  expect(config.rutaInicial).toBe('/pobles/la-torre-de-les-macanes');
  for (const clau of ['supabaseAnonKey', 'routerType', 'basename', 'basePath', 'manageDocumentHead', 'pluginUrl',
    'fontsHref', 'oauthRelayUrl', 'sollutiaIssuer', 'botApiUrl', 'tenant', 'tenant_id', 'backend_url'])
    expect(config, clau).not.toHaveProperty(clau);
  expect(config.tenantId).toBeNull();
  expect(config.backendId).toBe('supabase');
  expect(config.dataMode).not.toBe('local');
  expect(JSON.stringify(config)).not.toMatch(/evil|sb_secret|00000000-/);
  // Memòria i aterratge al poble: la URL de l'amfitrió no es mou.
  expect(on(element)).toBe('/pobles/la-torre-de-les-macanes');
  expect(text(element)).toContain('Poble la-torre-de-les-macanes');
  expect(escriptures()).toBe(0);
  expect(window.location.pathname).toBe('/pagina-de-l-amfitrio');
});

test('poble sense ruta-inicial: aterra a /pobles/<poble>, amb l’id sanejat', async () => {
  situa('/pagina-de-l-amfitrio');
  const element = await munta({ poble: ' Sella ' });
  expect(element.config.poble).toBe('sella');
  expect(element.config.rutaInicial).toBe('/pobles/sella');
  expect(on(element)).toBe('/pobles/sella');
  expect(text(element)).toContain('Poble sella');
});

test('una ruta-inicial explícita guanya al poble', async () => {
  situa('/pagina-de-l-amfitrio');
  const element = await munta({ poble: 'sella', 'ruta-inicial': '/pobles' });
  expect(element.config.rutaInicial).toBe('/pobles');
  expect(on(element)).toBe('/pobles');
  expect(text(element)).toContain('Pobles');
});

test('la ruta del JSON guanya al poble del global de l’amfitrió', async () => {
  situa('/pagina-de-l-amfitrio');
  globalThis.SocDePobleConfig = { poble: 'la-torre-de-les-macanes' };
  const element = await munta({ config: JSON.stringify({ rutaInicial: '/xat?vista=comunitats' }) });
  expect(element.config.poble).toBe('la-torre-de-les-macanes');
  expect(element.config.rutaInicial).toBe('/xat?vista=comunitats');
  expect(on(element)).toBe('/xat?vista=comunitats');
});

test.each([
  ['//evil.test/x'], ['https://evil.test/'], ['/a/../admin'], ['pobles/x'], ['/\\evil.test']
])('una ruta-inicial invàlida (%j) es descarta: aterra al poble i no ix de l’app', async (ruta) => {
  situa('/pagina-de-l-amfitrio');
  const element = await munta({ poble: 'sella', 'ruta-inicial': ruta });
  expect(element.config.rutaInicial).toBe('/pobles/sella');
  expect(on(element)).toBe('/pobles/sella');
  expect(escriptures()).toBe(0);
});

test('un poble invàlid no dona ni poble ni ruta: aterra a l’arrel de l’app', async () => {
  situa('/pagina-de-l-amfitrio');
  const element = await munta({ poble: '../admin' });
  expect(element.config).not.toHaveProperty('poble');
  expect(element.config).not.toHaveProperty('rutaInicial');
  expect(on(element)).toBe('/xat');
});

test('l’atribut nom-poble trepitja el global, i el global es torna a llegir a cada recàlcul', async () => {
  situa('/pagina-de-l-amfitrio');
  globalThis.SocDePobleConfig = { nomPoble: 'Gent de la Torre', poble: 'la-torre-de-les-macanes' };
  const element = await munta({ 'nom-poble': 'Penàguila' });
  expect(element.config.nomPoble).toBe('Penàguila');
  expect(element.config.poble).toBe('la-torre-de-les-macanes');

  globalThis.SocDePobleConfig = { nomPoble: 'Sella' };
  await act(async () => { element.removeAttribute('nom-poble'); });
  expect(element.config.nomPoble).toBe('Sella');
  expect(element.config).not.toHaveProperty('poble');
});

test('la propietat JS config trepitja atributs i global', async () => {
  situa('/pagina-de-l-amfitrio');
  globalThis.SocDePobleConfig = { nomPoble: 'Gent de la Torre' };
  const element = await munta({ 'nom-poble': 'Penàguila' });
  await act(async () => { element.config = { nomPoble: 'Sella' }; });
  expect(element.config.nomPoble).toBe('Sella');
});

test('nom-poble amb marques bidi i control arriba net i sense girar', async () => {
  situa('/pagina-de-l-amfitrio');
  const rlo = String.fromCodePoint(0x202E);
  const pdf = String.fromCodePoint(0x202C);
  const zwsp = String.fromCodePoint(0x200B);
  const element = await munta({ 'nom-poble': `Gent de la${zwsp} Torre ${rlo}etneisrevda${pdf}\t` });
  expect(element.config.nomPoble).toBe('Gent de la Torre etneisrevda');
});

/* ── Precedència de configura({config}) ─────────────────────────────── */
/* Contracte: SocDePobleConfig < configura({config}) < config-id < config <
   atributs < propietat JS. configura() és l'amfitrió que parla per l'API; el
   global, qualsevol script de la pàgina. */

test('configura({config}) trepitja el global: el seu poble i el seu nom guanyen, i hi aterra', async () => {
  situa('/pagina-de-l-amfitrio');
  globalThis.SocDePobleConfig = { nomPoble: 'Gent de la Torre', poble: 'la-torre-de-les-macanes' };
  configura({ nomPoble: 'Gent de Sella', poble: 'sella' });
  const element = await munta();
  expect(element.config.nomPoble).toBe('Gent de Sella');
  expect(element.config.poble).toBe('sella');
  expect(element.config.rutaInicial).toBe('/pobles/sella');
  expect(on(element)).toBe('/pobles/sella');
  expect(escriptures()).toBe(0);
});

test('l’atribut trepitja configura({config}), i la ruta es deriva del poble que guanya', async () => {
  situa('/pagina-de-l-amfitrio');
  configura({ nomPoble: 'Gent de Sella', poble: 'sella' });
  const element = await munta({ poble: 'penaguila', 'nom-poble': 'Penàguila' });
  expect(element.config.nomPoble).toBe('Penàguila');
  expect(element.config.poble).toBe('penaguila');
  expect(element.config.rutaInicial).toBe('/pobles/penaguila');
  expect(on(element)).toBe('/pobles/penaguila');
});

test('un poble declarat només a configura({config}) aterra a /pobles/<poble>, amb l’id sanejat', async () => {
  situa('/pagina-de-l-amfitrio');
  configura({ poble: ' Sella ' });
  const element = await munta();
  expect(element.config.poble).toBe('sella');
  expect(element.config.rutaInicial).toBe('/pobles/sella');
  expect(on(element)).toBe('/pobles/sella');
  expect(text(element)).toContain('Poble sella');
  expect(escriptures()).toBe(0);
});

test('una ruta inicial vàlida de configura({config}) guanya al poble del global', async () => {
  situa('/pagina-de-l-amfitrio');
  globalThis.SocDePobleConfig = { poble: 'la-torre-de-les-macanes' };
  configura({ rutaInicial: '/xat?vista=comunitats' });
  const element = await munta();
  expect(element.config.rutaInicial).toBe('/xat?vista=comunitats');
  expect(on(element)).toBe('/xat?vista=comunitats');
});

test('un global hostil (getter que llança) no trenca el muntatge', async () => {
  situa('/pagina-de-l-amfitrio');
  Object.defineProperty(globalThis, 'SocDePobleConfig', {
    configurable: true, get() { throw new Error('amfitrió trencat'); }
  });
  const element = await munta({ poble: 'sella' });
  expect(element.config.rutaInicial).toBe('/pobles/sella');
  expect(on(element)).toBe('/pobles/sella');
});
