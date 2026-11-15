/* Onada R29 · R29-02-1 · Disseny: un ?item= que no és al catàleg. El catàleg
   és estàtic i complet (itemsComplete), així que l'absència és demostrada: la
   reconciliació porta, amb replace, a la fitxa de reserva de la categoria, i
   cap «No s’ha pogut obrir l’element. Reintentar» atrapa la persona (abans,
   el model es prenia per parcial i el reintent tornava al mateix error).
   Arnés de DesignSection.mestreDetall.test.jsx: l'espai de treball de veres,
   el router en memòria de veres i un espècimen de mostra. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';

vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/UIContext', () => {
  const useUIActions = () => ({ t: (_, alternativa) => alternativa, resolveAsset: (uri) => uri });
  const useUIState = () => ({ externalConfig: {}, locale: 'ca-ES', language: 'ca' });
  return { useUIActions, useUIState, useUIActionsOpcional: useUIActions, useUIStateOpcional: useUIState };
});
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
function Arrere() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(-1)}>Arrere de la prova</button>;
}
const munta = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <DesignSection />
    <Sonda />
    <Arrere />
  </MemoryRouter>
);
const detall = (c) => c.querySelector('#app-grid-main');
const url = () => screen.getByTestId('url').textContent;
const titol = (c) => within(detall(c)).getByRole('heading', { level: 1 }).textContent;

test('la premissa: l’espècimen de reserva d’Inventari és al catàleg', () => {
  expect(ESPECIMEN?.title).toBe('Inventari Global');
});

test.each([1400, 375])('a %i px, ?item= desconegut a Inventari porta a la primera fitxa, sense cap alerta', (amplada) => {
  const buida = ambAmplada(amplada);
  const { container } = munta('/disseny?categoria=inventari&item=no-existix');
  buida();
  expect(detall(container).querySelector('[role="alert"]')).toBeNull();
  expect(url()).toContain(`item=${ESPECIMEN.id}`);
  expect(url()).not.toContain('no-existix');
  expect(titol(container)).toBe(ESPECIMEN.title);
});

test.each([1400, 375])('a %i px, ?item= desconegut a Fonaments porta a la portada', (amplada) => {
  const buida = ambAmplada(amplada);
  const { container } = munta('/disseny?categoria=fonaments&item=no-existix');
  buida();
  expect(detall(container).querySelector('[role="alert"]')).toBeNull();
  expect(url()).toContain('item=__intro');
  expect(url()).not.toContain('no-existix');
  if (amplada === 375) expect(container.querySelector('.app-grid-shell').dataset.panell).toBe('');
});

test('la reconciliació és un replace: l’Arrere no torna a l’enllaç trencat', () => {
  const buida = ambAmplada(1400);
  munta('/disseny?categoria=inventari&item=no-existix');
  buida();
  expect(url()).toContain(`item=${ESPECIMEN.id}`);
  fireEvent.click(screen.getByRole('button', { name: 'Arrere de la prova' }));
  buida();
  expect(url()).not.toContain('no-existix');
});
