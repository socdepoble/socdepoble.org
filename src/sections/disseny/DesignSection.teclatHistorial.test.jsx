/* Gauntlet 261030 (cicle 2) · IDEA-58 i l'historial: recórrer la llista de
   Disseny amb les fletxes, com al Finder, no deixa una entrada de l'historial
   per fitxa. Amb l'espai de treball de veres, el router en memòria de veres
   (la seua posició, `index`, és la de l'historial) i el DesignSection de
   veres, que fa push per a la raó 'user' i replace per a la resta:
     · tres fletxes afigen UNA entrada (la primera, la del clic);
     · l'Arrere torna on era la persona abans de recórrer la llista, i el
       focus va a la fitxa d'eixa tria (la fletxa següent continua d'ací);
     · el clic continua fent una entrada per fitxa.
   Els espècimens es substituïxen per un de mostra: ací es prova l'historial. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate, useRouter } from '../../app/contexts/RouterContext';

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

let restaura = () => {};
/* «ample» (1400 px): les tres columnes a la vista. jsdom no fa layout. */
function ample() {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const rafAbans = globalThis.requestAnimationFrame;
  const observadorAbans = globalThis.ResizeObserver;
  const cua = [];
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
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

/* La URL i la posició a l'historial del router; `arrere` és el botó Arrere del navegador. */
let arrere = () => {};
function Sonda() {
  const { pathname, search } = useLocation();
  const { index } = useRouter();
  const navega = useNavigate();
  arrere = () => navega(-1);
  return (
    <>
      <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>
      <output data-testid="entrada">{index}</output>
    </>
  );
}
const munta = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <DesignSection />
    <Sonda />
  </MemoryRouter>
);
const url = () => screen.getByTestId('url').textContent;
const entrada = () => Number(screen.getByTestId('entrada').textContent);
const fitxes = (c) => [...c.querySelectorAll('#app-grid-list .sdp-gestor-llista .sdp-gestor-fitxa')];
const prem = (key) => fireEvent.keyDown(document.activeElement, { key });

test('la premissa: el Panell de Disseny és una fitxa de Fonaments', () => {
  expect(CATALOG_ITEMS.find((item) => item.id === 'fonaments-panell')?.categoryIds).toContain('fonaments');
});

test('tres fletxes a la llista de Disseny són una sola entrada de l’historial, i l’Arrere torna on era la persona amb el focus', () => {
  const buida = ample();
  const { container } = munta('/disseny?categoria=fonaments&item=fonaments-panell');
  buida();
  const abans = url();
  const entradaAbans = entrada();
  const fitxesAbans = fitxes(container);
  expect(fitxesAbans.length).toBeGreaterThanOrEqual(5);
  const activa = fitxesAbans.find((f) => f.getAttribute('aria-current') === 'true');
  const titolDeSortida = activa.textContent;
  act(() => activa.focus());

  prem('ArrowDown');
  buida();
  const primera = url();
  expect(primera).not.toBe(abans);
  expect(entrada()).toBe(entradaAbans + 1);
  prem('ArrowDown');
  prem('ArrowDown');
  buida();
  expect(url()).not.toBe(primera);
  expect(entrada()).toBe(entradaAbans + 1);
  prem('ArrowUp');
  buida();
  expect(entrada()).toBe(entradaAbans + 1);

  act(() => arrere());
  buida();
  expect(url()).toBe(abans);
  expect(entrada()).toBe(entradaAbans);
  const ara = fitxes(container).find((f) => f.textContent === titolDeSortida);
  expect(ara.getAttribute('aria-current')).toBe('true');
  expect(document.activeElement).toBe(ara);

  /* Des d'ací, una fletxa obri un recorregut nou: una entrada més. */
  prem('ArrowDown');
  buida();
  expect(entrada()).toBe(entradaAbans + 1);
});

test('sense cap fitxa triada (/disseny), les fletxes fan una entrada i l’Arrere torna a la portada', () => {
  const buida = ample();
  const { container } = munta('/disseny?categoria=fonaments');
  buida();
  const abans = url();
  const entradaAbans = entrada();
  act(() => fitxes(container)[0].focus());
  for (const tecla of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown']) {
    prem(tecla);
    buida();
  }
  expect(url()).toMatch(/[?&]item=/);
  expect(entrada()).toBe(entradaAbans + 1);
  act(() => arrere());
  buida();
  expect(url()).toBe(abans);
  expect(entrada()).toBe(entradaAbans);
});

test('el clic continua fent una entrada de l’historial per fitxa', () => {
  const buida = ample();
  const { container } = munta('/disseny?categoria=fonaments');
  buida();
  const entradaAbans = entrada();
  for (const index of [1, 2, 3]) {
    fireEvent.click(fitxes(container)[index]);
    buida();
  }
  expect(entrada()).toBe(entradaAbans + 3);
});
