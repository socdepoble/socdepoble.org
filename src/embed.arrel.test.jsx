/**
 * W4-01 (261003, auditoria de Codex) · el paquet autònom (embed.jsx) no munta
 * res sobre un #root que no és seu.
 *
 * Abans, embed.jsx penjava un <soc-de-poble> amb routerType 'browser' de
 * qualsevol #root buit del document. En un WordPress eixe #root pot ser d'un
 * altre plugin: el paquet hi creava una segona instància i, si muntava
 * primer, es feia amo de la URL de l'amfitrió. Ara només arrenquen els
 * elements explícits, com el que emet el shortcode (marcatge.php).
 *
 * Es munten l'element de veritat (customElements, shadow root tancat, arrel
 * de React pròpia) i el PedraSecaEmbed de veritat, amb els routers de
 * veritat. Es substituïxen l'App (un joc de rutes mínim), els proveïdors de
 * sessió i d'identitat, que parlarien amb el backend, i host.js: arrencaAuto
 * és un espia i el segellat es fa a mà amb defineCustomElement(), que és el
 * que faria arrenca() al tick següent. L'historial es vigila amb espies sobre
 * pushState i replaceState, i el #root alié amb un MutationObserver, que
 * veuria també un fill afegit i llevat dins del mateix tick.
 */
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act } from '@testing-library/react';
import { activeElements, defineCustomElement } from './PedraSecaEmbed.jsx';

vi.hoisted(() => {
  for (const variable of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_DATA_MODE', 'VITE_TENANT_ID']) vi.stubEnv(variable, '');
});
vi.mock('./host.js', () => ({ arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('./app/contexts/SessionContext.jsx', () => ({ SessionProvider: ({ children }) => children }));
vi.mock('./app/contexts/IdentitatContext.jsx', () => ({ IdentitatProvider: ({ children }) => children }));
vi.mock('./app/App.jsx', async () => {
  const { Navigate, Route, Routes, useLocation } = await import('./app/contexts/RouterContext.jsx');
  function OnSoc() {
    const { pathname } = useLocation();
    return <output data-sonda="on">{pathname}</output>;
  }
  function AppDeProva() {
    return (
      <>
        <OnSoc />
        <Routes>
          <Route path="/" element={<Navigate to="/xat" replace />} />
          <Route path="/xat" element={<p>Pantalla del xat</p>} />
          <Route path="*" element={<p>NotFound</p>} />
        </Routes>
      </>
    );
  }
  return { default: AppDeProva };
});

const AMO_ALIE = 'other-wordpress-plugin';
const ARREL_ALIENA = `<div id="root" data-owner="${AMO_ALIE}"></div>`;

let push;
let replace;
const observadors = [];

/** Posa l'amfitrió en una URL i, a partir d'ací, compta les escriptures a l'historial. */
function situa(url) {
  window.history.replaceState(null, '', url);
  push = vi.spyOn(window.history, 'pushState');
  replace = vi.spyOn(window.history, 'replaceState');
}
const escriptures = () => push.mock.calls.length + replace.mock.calls.length;

/** Un #root buit que no és nostre, i tots els canvis que hi passen des d'ara. */
function arrelBuida(atributs = { 'data-owner': AMO_ALIE }) {
  const arrel = document.createElement('div');
  arrel.id = 'root';
  for (const [nom, valor] of Object.entries(atributs)) arrel.setAttribute(nom, valor);
  document.body.appendChild(arrel);
  const vistos = [];
  const observador = new MutationObserver((registres) => { vistos.push(...registres); });
  observador.observe(arrel, { childList: true, attributes: true, characterData: true, subtree: true });
  observadors.push(observador);
  return { arrel, canvis: () => [...vistos, ...observador.takeRecords()] };
}

/** L'element que emet el shortcode de WordPress, dins de la seua caixa. */
async function elementExplicit(atributs = {}) {
  const caixa = document.createElement('div');
  caixa.className = 'socdepoble-enxufe';
  const element = document.createElement('soc-de-poble');
  for (const [nom, valor] of Object.entries({ 'plugin-url': '/', ...atributs })) element.setAttribute(nom, valor);
  caixa.appendChild(element);
  await act(async () => { document.body.appendChild(caixa); });
  return element;
}

/** Avalua el paquet de nou, com si l'amfitrió el carregara ara, i torna el host simulat. */
async function carregaElPaquet() {
  vi.resetModules();
  await act(async () => { await import('./embed.jsx'); });
  return import('./host.js');
}

/** El que faria arrenca() al tick següent: definir l'element. Idempotent. */
async function segella() {
  await act(async () => { defineCustomElement(); });
}

const dins = (element) => element._closedRoot;
const on = (element) => dins(element).querySelector('[data-sonda="on"]').textContent;

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
});

afterEach(async () => {
  for (const observador of observadors.splice(0)) observador.disconnect();
  await act(async () => {
    for (const element of [...activeElements]) {
      element.remove();
      element._desmuntaAra();
    }
  });
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

test('un #root d’un altre plugin, buit i sense cap element explícit: es queda intacte i no hi ha cap instància', async () => {
  situa('/pagina-de-l-amfitrio');
  const alie = arrelBuida();
  const host = await carregaElPaquet();
  await segella();
  expect(host.exposaGlobal).toHaveBeenCalledTimes(1);
  expect(host.arrencaAuto).toHaveBeenCalledTimes(1);
  expect(alie.arrel.outerHTML).toBe(ARREL_ALIENA);
  expect(alie.canvis()).toEqual([]);
  expect(document.querySelectorAll('soc-de-poble')).toHaveLength(0);
  expect(activeElements.size).toBe(0);
  expect(escriptures()).toBe(0);
  expect(window.location.pathname).toBe('/pagina-de-l-amfitrio');
});

test('un #root buit sense amo declarat tampoc és nostre, ni amb ?arrencada=manual a la URL', async () => {
  situa('/pobles?arrencada=manual');
  const alie = arrelBuida({});
  await carregaElPaquet();
  await segella();
  expect(alie.arrel.outerHTML).toBe('<div id="root"></div>');
  expect(alie.canvis()).toEqual([]);
  expect(document.querySelectorAll('soc-de-poble')).toHaveLength(0);
  expect(activeElements.size).toBe(0);
  expect(escriptures()).toBe(0);
  expect(window.location.pathname + window.location.search).toBe('/pobles?arrencada=manual');
});

test('amb el #root alié i l’element del shortcode: una sola instància, la del shortcode, en memòria i sense tocar l’historial', async () => {
  situa('/wordpress/?page_id=12&filter=all#comentaris');
  const alie = arrelBuida();
  const element = await elementExplicit({ 'nom-poble': 'Gent de la Torre' });
  const host = await carregaElPaquet();
  await segella();
  expect(host.arrencaAuto).toHaveBeenCalledTimes(1);
  expect(document.querySelectorAll('soc-de-poble')).toHaveLength(1);
  expect([...activeElements]).toEqual([element]);
  expect(element.parentElement.className).toBe('socdepoble-enxufe');
  // El paquet no hi escriu cap declaració: l'element només porta el que diu l'amfitrió.
  expect(element.hasAttribute('config')).toBe(false);
  expect(element.config).not.toHaveProperty('routerType');
  expect(element.config.nomPoble).toBe('Gent de la Torre');
  expect(on(element)).toBe('/xat');
  expect(dins(element).textContent).toContain('Pantalla del xat');
  expect(alie.arrel.outerHTML).toBe(ARREL_ALIENA);
  expect(alie.canvis()).toEqual([]);
  expect(escriptures()).toBe(0);
  expect(window.location.pathname + window.location.search + window.location.hash).toBe('/wordpress/?page_id=12&filter=all#comentaris');
});

test('dos elements explícits: exactament dues instàncies, una per element, i el #root alié continua buit', async () => {
  situa('/pagina-de-l-amfitrio');
  const alie = arrelBuida();
  const primer = await elementExplicit();
  const segon = await elementExplicit({ 'ruta-inicial': '/xat' });
  await carregaElPaquet();
  await segella();
  expect(document.querySelectorAll('soc-de-poble')).toHaveLength(2);
  expect(activeElements.size).toBe(2);
  expect(new Set(activeElements)).toEqual(new Set([primer, segon]));
  for (const element of [primer, segon]) {
    expect(element.hasAttribute('config')).toBe(false);
    expect(on(element)).toBe('/xat');
  }
  expect(alie.arrel.outerHTML).toBe(ARREL_ALIENA);
  expect(alie.canvis()).toEqual([]);
  expect(escriptures()).toBe(0);
  expect(window.location.pathname).toBe('/pagina-de-l-amfitrio');
});

test('amb el document encara carregant, l’arrencada espera el DOMContentLoaded i tampoc toca el #root', async () => {
  situa('/pagina-de-l-amfitrio');
  const alie = arrelBuida();
  Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'loading' });
  let host;
  try {
    host = await carregaElPaquet();
    expect(host.exposaGlobal).toHaveBeenCalledTimes(1);
    expect(host.arrencaAuto).not.toHaveBeenCalled();
  } finally {
    delete document.readyState;
  }
  await act(async () => { document.dispatchEvent(new Event('DOMContentLoaded')); });
  expect(host.arrencaAuto).toHaveBeenCalledTimes(1);
  await segella();
  expect(alie.arrel.outerHTML).toBe(ARREL_ALIENA);
  expect(alie.canvis()).toEqual([]);
  expect(document.querySelectorAll('soc-de-poble')).toHaveLength(0);
  expect(escriptures()).toBe(0);
});

test('el codi d’embed.jsx no busca cap arrel ni crea cap element (comentaris a banda)', () => {
  const codi = fs.readFileSync(path.join(process.cwd(), 'src/embed.jsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  for (const patro of [/getElementById/, /querySelector/, /createElement/, /appendChild/, /\broot\b/]) {
    expect(codi, String(patro)).not.toMatch(patro);
  }
});
