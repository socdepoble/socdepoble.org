/**
 * W4-01 (261003) · el camí sencer del paquet autònom, amb el host.js de
 * veritat. embed.arrel.test.jsx substituïx host.js i segella a mà; ací
 * l'arrencada és la que fa el paquet a l'amfitrió: fixaCapaDelPaquet,
 * exposaGlobal, arrencaAuto, el tick següent i arrenca(), que definix
 * <soc-de-poble>. Així una autoarrencada que tornara a aparéixer a host.js, i
 * no a embed.jsx, també es veuria.
 *
 * Només se substituïxen l'adaptador de Supabase (parlaria amb la xarxa), l'App
 * (un joc de rutes mínim) i els proveïdors de sessió i d'identitat. L'element,
 * el PedraSecaEmbed i els routers són els de veritat. El paquet s'avalua una
 * sola vegada per fitxer, com en una pàgina: window.SocDePoble no es pot
 * tornar a definir. Les proves van en ordre i compartixen la pàgina.
 */
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { act } from '@testing-library/react';
// El mateix mòdul que importa host.js (cap resetModules en aquest fitxer).
import { activeElements } from './PedraSecaEmbed.jsx';

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

const URL_AMFITRIO = '/wordpress/?page_id=12#comentaris';
const ARREL_ALIENA = '<div id="root" data-owner="other-wordpress-plugin"></div>';

const registraSW = vi.fn();
let push;
let replace;
let arrel;
let canvisArrel;
let observador;
let paquet;

const escriptures = () => push.mock.calls.length + replace.mock.calls.length;
const on = (element) => element._closedRoot.querySelector('[data-sonda="on"]').textContent;

/** L'element que emet el shortcode (o el bloc) de WordPress, dins de la seua caixa. */
function caixaDelShortcode() {
  const caixa = document.createElement('div');
  caixa.className = 'socdepoble-enxufe';
  const element = document.createElement('soc-de-poble');
  element.setAttribute('plugin-url', '/');
  caixa.appendChild(element);
  return { caixa, element };
}

beforeAll(async () => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  // Un navegador amb service worker: si algú el registrara, es veuria.
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { register: registraSW } });
  window.history.replaceState(null, '', URL_AMFITRIO);
  push = vi.spyOn(window.history, 'pushState');
  replace = vi.spyOn(window.history, 'replaceState');

  // La pàgina abans del paquet: el #root d'un altre plugin i l'element del shortcode.
  // Llegit en un document inert (DOMParser) i importat; no sanitizeHtml: lleva l'id i el data-owner.
  const alie = new DOMParser().parseFromString(ARREL_ALIENA, 'text/html').body.firstElementChild;
  document.body.appendChild(document.importNode(alie, true));
  arrel = document.getElementById('root');
  canvisArrel = [];
  observador = new MutationObserver((registres) => { canvisArrel.push(...registres); });
  observador.observe(arrel, { childList: true, attributes: true, characterData: true, subtree: true });
  document.body.appendChild(caixaDelShortcode().caixa);

  await act(async () => { await import('./embed.jsx'); });
  paquet = window.SocDePoble;
  await act(async () => { await paquet.quanLlest(); });
});

afterAll(() => {
  observador.disconnect();
  delete navigator.serviceWorker;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('el paquet de veritat segella i munta només l’element del shortcode: el #root alié, la URL i l’historial no es toquen', async () => {
  expect(paquet.estat().fase).toBe('segellat');
  expect(customElements.get('soc-de-poble')).toBeTypeOf('function');
  const elements = [...document.querySelectorAll('soc-de-poble')];
  expect(elements).toHaveLength(1);
  expect([...activeElements]).toEqual(elements);
  expect(elements[0].parentElement.className).toBe('socdepoble-enxufe');
  expect(on(elements[0])).toBe('/xat');
  expect(arrel.outerHTML).toBe(ARREL_ALIENA);
  expect([...canvisArrel, ...observador.takeRecords()]).toEqual([]);
  expect(escriptures()).toBe(0);
  expect(window.location.pathname + window.location.search + window.location.hash).toBe(URL_AMFITRIO);
  // La PWA és de l'entrada pròpia: el paquet no registra cap service worker, ni en carregar la pàgina.
  await act(async () => { window.dispatchEvent(new Event('load')); });
  expect(registraSW).not.toHaveBeenCalled();
});

test('cicle de vida després de carregar: un bloc inserit més tard munta una instància més, i en llevar-lo es desmunta; el #root continua intacte', async () => {
  const { caixa, element } = caixaDelShortcode();
  await act(async () => { document.body.appendChild(caixa); });
  expect(document.querySelectorAll('soc-de-poble')).toHaveLength(2);
  expect(on(element)).toBe('/xat');
  expect(element._closedRoot.textContent).toContain('Pantalla del xat');

  expect(activeElements.size).toBe(2);

  // El desmuntatge el fa el disconnectedCallback de veritat (una microtasca), no la prova.
  await act(async () => { caixa.remove(); });
  expect(element._root).toBeNull();
  expect(activeElements.has(element)).toBe(false);
  expect(activeElements.size).toBe(1);
  expect(document.querySelectorAll('soc-de-poble')).toHaveLength(1);

  expect(arrel.outerHTML).toBe(ARREL_ALIENA);
  expect([...canvisArrel, ...observador.takeRecords()]).toEqual([]);
  expect(escriptures()).toBe(0);
  expect(window.location.pathname + window.location.search + window.location.hash).toBe(URL_AMFITRIO);
  expect(registraSW).not.toHaveBeenCalled();
});
