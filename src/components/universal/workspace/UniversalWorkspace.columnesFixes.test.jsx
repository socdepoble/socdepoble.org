/* Ordre del Mestre (30-10-2026 ~12:45) · Restauració de les 3 columnes fixes
   i de les icones de Carpeta i Nota a l'UniversalWorkspace.
     1. Plegades, el botó de dalt del rail de CARPETES porta la carpeta (o la
        icona de categories de la secció) i el de NOTES, la del document (o
        la de la secció; al Bloc, NotebookPen): mai la [|<] de PanelLeftOpen.
        Amb la navegació visible al costat, el rail de NOTES no hi duplica
        cap carpeta.
     2. Fora de mòbil, les tres columnes són fixes a la graella, amb els dos
        separadors: cap panell flotant ni vel. Els panells, en «estret».
   jsdom no fa layout: l'amplària, l'observador i els fotogrames, a mà, com a
   UniversalWorkspace.barres.test.jsx. Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { Bookmark, NotebookPen } from 'lucide-react';

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => null,
  Link: 'a'
}));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import { UniversalWorkspace } from './UniversalWorkspace.jsx';
import { _reiniciaCarpetesVisibles } from './carpetesVisibles.js';

const MODEL = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [
    { id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }, { id: 'f-mercat', label: 'Mercat' }] }
  ],
  items: [
    { id: 'n1', title: 'Primera', categoryIds: ['f-mur'] },
    { id: 'n2', title: 'Tomaques', categoryIds: ['f-mercat'] }
  ]
});
const ETIQUETES = Object.freeze({ categories: 'CARPETES', items: 'NOTES' });
const detall = ({ item }) => <p data-testid="detall">{item ? item.title : 'cap'}</p>;

beforeEach(() => { sessionStorage.clear(); localStorage.clear(); _reiniciaCarpetesVisibles(); });
afterEach(() => cleanup());

function entorn(amplada, prova) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const rafAbans = globalThis.requestAnimationFrame;
  const observadorAbans = globalThis.ResizeObserver;
  const cua = [];
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.requestAnimationFrame = (cb) => { cua.push(cb); return cua.length; };
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  const buida = () => act(() => { while (cua.length) cua.shift()(0); });
  try {
    prova({ buida });
  } finally {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    else delete HTMLElement.prototype.clientWidth;
    globalThis.requestAnimationFrame = rafAbans;
    globalThis.ResizeObserver = observadorAbans;
  }
}

const munta = (props = {}) => render(
  <UniversalWorkspace
    model={MODEL}
    labels={ETIQUETES}
    icons={{}}
    tagFilter={false}
    renderDetail={detall}
    initialSelection={{ categoryId: 'f-mur', itemId: 'n1' }}
    {...props}
  />
);

const closca = (c) => c.querySelector('.app-grid-shell');
const navegacio = (c) => c.querySelector('#app-grid-sidebar');
const llista = (c) => c.querySelector('#app-grid-list');
const tancada = (el) => [el.hasAttribute('inert'), el.getAttribute('aria-hidden')];
/* El nom Lucide de la icona d'un botó (lucide-folder, lucide-file-text…). */
const icona = (boto) => [...(boto.querySelector('svg')?.classList ?? [])].find((c) => c.startsWith('lucide-')) ?? null;
const railTop = (columna) => columna.querySelector('.app-grid-col-header--collapsed > .app-grid-col-header__rail-top');
/* Totes les accions de la capçalera plegada, sota l'Expandir. */
const accionsDelRail = (columna) => [...columna.querySelectorAll('.app-grid-col-header--collapsed > button:not(.app-grid-col-header__rail-top)')]
  .map((b) => `${b.getAttribute('aria-label')}:${icona(b)}`);

for (const amplada of [800, 820, 899, 1180]) {
  test(`Columnes fixes · a ${amplada} les tres columnes són a la graella, obertes, amb els dos separadors; cap panell ni vel`, () => {
    entorn(amplada, () => {
      const { container } = munta({ mestreDetall: 'navegacio' });
      expect([closca(container).dataset.layout, closca(container).dataset.panell]).toEqual(['ample', '']);
      expect(closca(container).hasAttribute('data-llista')).toBe(false);
      for (const id of ['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']) {
        expect([id, ...tancada(container.querySelector(id))]).toEqual([id, false, null]);
      }
      expect(container.querySelector('.app-grid-resizer--left')).not.toBeNull();
      expect(container.querySelector('.app-grid-resizer--middle')).not.toBeNull();
      expect(within(navegacio(container)).getByRole('button', { name: 'Replegar CARPETES' })).toBeTruthy();
      /* La navegació és al costat: la llista no porta cap obridor de panell. */
      expect(llista(container).querySelector('[aria-controls="app-grid-sidebar"]')).toBeNull();
    });
  });
}

test('Icones · a 820, plegades, CARPETES porta la carpeta i NOTES el document (sense icones de la secció); cap [|<] ni carpeta duplicada', () => {
  entorn(820, ({ buida }) => {
    const { container } = munta();
    fireEvent.click(within(navegacio(container)).getByRole('button', { name: 'Replegar CARPETES' }));
    buida();
    fireEvent.click(within(llista(container)).getByRole('button', { name: 'Replegar NOTES' }));
    buida();
    expect([closca(container).dataset.layout, closca(container).dataset.panell]).toEqual(['ample', '']);
    expect(container.querySelector('.app-grid-content.has-left-collapsed.has-middle-collapsed')).not.toBeNull();
    const topCarpetes = railTop(navegacio(container));
    const topNotes = railTop(llista(container));
    expect([topCarpetes.getAttribute('aria-label'), icona(topCarpetes)]).toEqual(['Expandir CARPETES', 'lucide-folder']);
    expect([topNotes.getAttribute('aria-label'), icona(topNotes)]).toEqual(['Expandir NOTES', 'lucide-file-text']);
    expect(container.querySelector('svg.lucide-panel-left-open')).toBeNull();
    /* El rail de NOTES: només la lupa davall de l'Expandir, cap segona carpeta. */
    expect(accionsDelRail(llista(container))).toEqual(['Cercar elements:lucide-search']);
    expect(llista(container).querySelector('[aria-controls="app-grid-sidebar"]')).toBeNull();
    /* Desplegar torna cada columna a la graella, amb el seu separador. */
    fireEvent.click(topCarpetes);
    buida();
    expect(closca(container).dataset.panell).toBe('');
    expect(container.querySelector('.app-grid-resizer--left')).not.toBeNull();
    fireEvent.click(railTop(llista(container)));
    buida();
    expect(container.querySelector('.app-grid-resizer--middle')).not.toBeNull();
  });
});

test('Icones · les de la secció manen: la de categories a CARPETES i la de la llista a NOTES (al Bloc, NotebookPen), també a 1400', () => {
  entorn(1400, () => {
    const { container } = munta({
      icons: { categories: Bookmark, items: NotebookPen },
      columnesInicials: { left: true, middle: true }
    });
    expect(icona(railTop(navegacio(container)))).toBe('lucide-bookmark');
    expect(icona(railTop(llista(container)))).toBe('lucide-notebook-pen');
    expect(container.querySelector('svg.lucide-panel-left-open')).toBeNull();
  });
});

test('Icones · el mode compacte a 820 és «ample» amb els dos rails a la graella, cada un amb la seua icona', () => {
  entorn(820, () => {
    const { container } = munta({ compacte: true, initialSelection: { categoryId: 'f-mur', itemId: null } });
    expect([closca(container).dataset.layout, closca(container).dataset.panell]).toEqual(['ample', '']);
    expect(tancada(navegacio(container))).toEqual([false, null]);
    expect(icona(railTop(navegacio(container)))).toBe('lucide-folder');
    expect(icona(railTop(llista(container)))).toBe('lucide-file-text');
    expect(llista(container).querySelector('[aria-controls="app-grid-sidebar"]')).toBeNull();
  });
});

test('Mòbil · a 375 el rail de la llista (#app-grid-rail) porta la icona del document i conserva la carpeta, l’única porta a la navegació', () => {
  entorn(375, () => {
    const { container } = munta({ mestreDetall: 'detall' });
    expect([closca(container).dataset.layout, closca(container).dataset.panell]).toEqual(['estret', '']);
    const rail = container.querySelector('#app-grid-rail');
    expect(icona(railTop(rail))).toBe('lucide-file-text');
    expect(accionsDelRail(rail)).toEqual(['CARPETES:lucide-folder', 'Cercar elements:lucide-search']);
    /* La carpeta obri el panell de la navegació, per damunt (mestre-detall). */
    fireEvent.click(within(rail).getByRole('button', { name: 'CARPETES' }));
    expect(closca(container).dataset.panell).toBe('left');
    expect(tancada(navegacio(container))).toEqual([false, null]);
  });
});
