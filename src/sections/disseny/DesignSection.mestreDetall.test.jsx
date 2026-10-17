/* MD (ordre del Mestre, 261003) · Disseny en mòbil: patró mestre-detall,
   com a les apps de missatgeria. Amb l'espai de treball de veres, el router
   en memòria de veres i la Pàgina Universal de veres de cada espècimen (CatalogDetail):
     · /disseny a 375 px: primer DISSENY (les famílies), no la portada;
     · família → COMPONENTS → espècimen, una sola capa cada vegada;
     · la fletxa blava torna a COMPONENTS (no a l'historial);
     · /disseny?item=… (un enllaç) obri l'espècimen directament;
     · a 1400 px, res no canvia.
   Els espècimens es substituïxen per un de mostra: ací es prova la closca. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from '../../app/contexts/RouterContext';

vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (uri) => uri }),
  useUIState: () => ({ externalConfig: {}, locale: 'ca-ES', language: 'ca' })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', pageCopy: {} }) }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
vi.mock('./cataleg/detailRegistry', () => ({
  CATALOG_DETAIL_LOADERS: new Proxy({}, { get: () => function Mostra() { return <p>Espècimen de mostra</p>; } })
}));

import DesignSection from './DesignSection.jsx';
import { CATALOG_ITEMS } from './cataleg/manifest';

const ESPECIMEN = CATALOG_ITEMS.find((item) => item.id === 'inventari-global');

let restaura = () => {};
function ambAmplada(amplada) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const rafAbans = globalThis.requestAnimationFrame;
  const observadorAbans = globalThis.ResizeObserver;
  const cua = [];
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.requestAnimationFrame = (cb) => { cua.push(cb); return cua.length; };
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  restaura = () => {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    else delete HTMLElement.prototype.clientWidth;
    globalThis.requestAnimationFrame = rafAbans;
    globalThis.ResizeObserver = observadorAbans;
  };
  return () => act(() => { while (cua.length) cua.shift()(0); });
}

/* La memòria del nivell (nivellMestreDetall.js) viu a la capa efímera: cada
   prova comença com una pestanya nova. */
beforeEach(() => sessionStorage.clear());
afterEach(() => {
  cleanup();
  restaura();
  restaura = () => {};
});

function Sonda() {
  const { pathname, search } = useLocation();
  return <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>;
}
const munta = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <DesignSection />
    <Sonda />
  </MemoryRouter>
);
const closca = (c) => c.querySelector('.app-grid-shell');
const panell = (c) => closca(c).dataset.panell;
const obertes = (c) => ['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']
  .filter((id) => c.querySelector(id).getAttribute('aria-hidden') !== 'true');
const columna = (c, id) => c.querySelector(`#${id}`);
const url = () => screen.getByTestId('url').textContent;
/* La fitxa per defecte diu el títol i, darrere, el subtítol. */
const fitxaEspecimen = (c) => within(columna(c, 'app-grid-list'))
  .getByRole('button', { name: (nom) => nom.startsWith(ESPECIMEN.title) });

test('la premissa: l’espècimen de la prova és al catàleg', () => {
  expect(ESPECIMEN?.title).toBe('Inventari Global');
});

test('MD · /disseny a 375 px: primer DISSENY; família → COMPONENTS → espècimen; la fletxa blava torna a COMPONENTS', () => {
  const buida = ambAmplada(375);
  const { container } = munta('/disseny');
  expect([closca(container).dataset.layout, panell(container)]).toEqual(['estret', 'left']);
  expect(obertes(container)).toEqual(['#app-grid-sidebar']);

  fireEvent.click(within(columna(container, 'app-grid-sidebar')).getByRole('button', { name: 'Inventari' }));
  expect(panell(container)).toBe('middle');
  expect(obertes(container)).toEqual(['#app-grid-list']);
  buida();

  fireEvent.click(fitxaEspecimen(container));
  expect(panell(container)).toBe('');
  expect(obertes(container)).toEqual(['#app-grid-main']);
  buida();
  const detall = columna(container, 'app-grid-main');
  expect(within(detall).getByRole('heading', { level: 1 }).textContent).toBe(ESPECIMEN.title);
  expect(url()).toContain(`item=${ESPECIMEN.id}`);
  const abans = url();

  fireEvent.click(within(detall).getByRole('button', { name: 'Tornar arrere' }));
  expect(panell(container)).toBe('middle');
  expect(obertes(container)).toEqual(['#app-grid-list']);
  expect(url()).toBe(abans);
  expect(document.activeElement).toBe(fitxaEspecimen(container));

  // Des de COMPONENTS, la icona de DISSENY torna a les famílies al primer toc.
  fireEvent.click(within(columna(container, 'app-grid-list')).getByRole('button', { name: 'DISSENY' }));
  expect(panell(container)).toBe('left');
  expect(obertes(container)).toEqual(['#app-grid-sidebar']);
});

test('MD · un enllaç amb espècimen (/disseny?item=…) l’obri directament, i la fletxa blava porta a COMPONENTS', () => {
  ambAmplada(375);
  const { container } = munta(`/disseny?categoria=inventari&item=${ESPECIMEN.id}`);
  expect(panell(container)).toBe('');
  const detall = columna(container, 'app-grid-main');
  expect(within(detall).getByRole('heading', { level: 1 }).textContent).toBe(ESPECIMEN.title);
  fireEvent.click(within(detall).getByRole('button', { name: 'Tornar arrere' }));
  expect(panell(container)).toBe('middle');
  expect(url()).toContain(`item=${ESPECIMEN.id}`);
});

/* Revisió de MD · Triar una família escriu sola la seua primera fitxa a la
   URL (?item=…). Eixir i tornar amb l'Arrere no és cap enllaç. */
function Navegacio() {
  const navigate = useNavigate();
  return (
    <nav aria-label="App">
      <button type="button" onClick={() => navigate('/mur')}>Ves al Mur</button>
      <button type="button" onClick={() => navigate(-1)}>Arrere</button>
    </nav>
  );
}

test('MD · triar una família escriu la seua primera fitxa a la URL: eixir i tornar amb l’Arrere torna a COMPONENTS, no a l’espècimen', () => {
  ambAmplada(375);
  const { container } = render(
    <MemoryRouter rutaInicial="/disseny">
      <Routes>
        <Route path="/disseny" element={<DesignSection />} />
        <Route path="/mur" element={<p>Mur</p>} />
      </Routes>
      <Navegacio />
      <Sonda />
    </MemoryRouter>
  );
  expect(panell(container)).toBe('left');
  fireEvent.click(within(columna(container, 'app-grid-sidebar')).getByRole('button', { name: 'Inventari' }));
  expect(panell(container)).toBe('middle');
  const enLaLlista = url();
  expect(enLaLlista).toMatch(/[?&]item=/);

  const app = (nom) => within(screen.getByRole('navigation', { name: 'App' })).getByRole('button', { name: nom });
  fireEvent.click(app('Ves al Mur'));
  expect(url()).toBe('/mur');
  fireEvent.click(app('Arrere'));
  expect(url()).toBe(enLaLlista);
  expect(panell(container)).toBe('middle');
  expect(obertes(container)).toEqual(['#app-grid-list']);
});

test('MD · a 1400 px res no canvia: tres columnes, cap panell i la portada', () => {
  ambAmplada(1400);
  const { container } = munta('/disseny');
  expect([closca(container).dataset.layout, panell(container)]).toEqual(['ample', '']);
  expect(obertes(container)).toEqual(['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']);
});
