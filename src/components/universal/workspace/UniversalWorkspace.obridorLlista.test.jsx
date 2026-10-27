/* Ordre del Mestre (261026_2126, pla 261026_1615 §6) · La carpeta de
   l'esquerra del títol de la llista (l'obridor de la navegació) duplicava la
   del rail i trencava l'eix vertical del Bloc de Notes. Amb
   obridorALaLlista={false} es lleva només on la navegació té una altra porta
   a la vista: en «mitja», el seu rail fix. En «estret» es queda: la llista
   oberta tapa el rail i la carpeta de la capçalera és l'única porta a la
   vista. On era l'única porta en «mitja» (el mode compacte, sense cap rail),
   també es queda. Sense la prop, el de sempre (Wiki, Disseny, Perfil…). I el glif
   d'ordenar ja no va forçat a 20px: 24, com tots els de les dues files.
   jsdom no fa layout: l'amplària de la closca, l'observador i els fotogrames,
   a mà. Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { FileText, Folder } from 'lucide-react';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useRouter: () => null,
  Link: 'a'
}));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import { UniversalWorkspace } from './UniversalWorkspace.jsx';

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
const ICONES = Object.freeze({ categories: Folder, items: FileText });

beforeEach(() => { mocks.navigate.mockClear(); sessionStorage.clear(); });
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
    icons={ICONES}
    tagFilter={false}
    sortable={true}
    renderDetail={({ item }) => <p>{item ? item.title : 'Cap'}</p>}
    mestreDetall="navegacio"
    {...props}
  />
);

const closca = (c) => c.querySelector('.app-grid-shell');
const panell = (c) => closca(c).dataset.panell;
const llista = (c) => c.querySelector('#app-grid-list');
/* La capçalera de la llista oberta (fila 1) i la de la cerca (fila 2). */
const files = (c) => [...llista(c).querySelectorAll('aside.sdp-workspace-column > .app-grid-col-header')];
/* L'obridor de la navegació a l'esquerra del títol de la llista. */
const carpetaDeLaCapcalera = (c) => files(c)[0]?.querySelector('[data-obri-columna][aria-controls="app-grid-sidebar"]') ?? null;

test('§6 · sense la prop, la carpeta de la capçalera de la llista es queda (Wiki, Disseny, Perfil): en «mitja» i en «estret»', () => {
  entorn(820, () => {
    const { container } = munta();
    expect(closca(container).dataset.layout).toBe('mitja');
    expect(carpetaDeLaCapcalera(container)).not.toBeNull();
  });
  cleanup();
  entorn(375, () => {
    const { container } = munta();
    fireEvent.click(within(container.querySelector('#app-grid-sidebar')).getByRole('button', { name: 'Mur' }));
    expect(panell(container)).toBe('middle');
    expect(carpetaDeLaCapcalera(container)).not.toBeNull();
  });
});

test('§6 · obridorALaLlista={false} en «mitja»: cap carpeta a la capçalera; la navegació continua al rail fix de l’esquerra', () => {
  entorn(820, () => {
    const { container } = munta({ obridorALaLlista: false });
    expect([closca(container).dataset.layout, closca(container).dataset.esquerra]).toEqual(['mitja', 'rail']);
    expect(carpetaDeLaCapcalera(container)).toBeNull();
    // El títol de la llista obri la fila: la primera peça és el plec (icona i NOTES).
    expect(files(container)[0].firstElementChild.className).toContain('app-grid-col-header__plec');
    const rail = container.querySelector('#app-grid-sidebar');
    expect(within(rail).getByRole('navigation', { name: 'CARPETES' })).toBeTruthy();
    expect(within(rail).getByRole('button', { name: 'Expandir CARPETES' }).hasAttribute('data-obri-columna')).toBe(true);
  });
});

test('§6 · obridorALaLlista={false} en «estret»: la llista oberta tapa el rail, la carpeta de NOTES es queda i obri CARPETES d’un toc', () => {
  entorn(375, () => {
    const { container } = munta({ obridorALaLlista: false });
    fireEvent.click(within(container.querySelector('#app-grid-sidebar')).getByRole('button', { name: 'Mur' }));
    expect(panell(container)).toBe('middle');
    const obridor = carpetaDeLaCapcalera(container);
    expect(obridor).not.toBeNull();
    expect(obridor.getAttribute('aria-label')).toBe('CARPETES');
    expect(obridor.getAttribute('aria-expanded')).toBe('false');
    // La primera peça de la fila 1 és la carpeta; el plec (icona i NOTES) ve darrere.
    expect(files(container)[0].firstElementChild.className).not.toContain('app-grid-col-header__plec');
    fireEvent.click(obridor);
    expect(panell(container)).toBe('left');
  });
});

test('§6 · on la capçalera és l’única porta (mode compacte en «mitja», sense rail), la carpeta es queda encara que es demane llevar-la', () => {
  entorn(820, () => {
    const { container } = munta({ obridorALaLlista: false, compacte: true, mestreDetall: false });
    expect(closca(container).dataset.layout).toBe('mitja');
    expect(closca(container).hasAttribute('data-esquerra')).toBe(false);
    expect(carpetaDeLaCapcalera(container)).not.toBeNull();
  });
});

test('§6 · el glif d’ordenar fa 24px, com la lupa, la icona del títol i el [|<]; tota icona viu en una cel·la de botó', () => {
  entorn(820, () => {
    const { container } = munta({ obridorALaLlista: false });
    const [fila1, fila2] = files(container);
    const ordenar = within(fila2).getByRole('button', { name: 'Ordenar per data o nom' });
    expect(ordenar.querySelector('svg').getAttribute('width')).toBe('24');
    const mides = [...fila1.querySelectorAll('svg'), ...fila2.querySelectorAll('svg')].map((svg) => svg.getAttribute('width'));
    expect(mides.length).toBeGreaterThanOrEqual(4);
    expect(new Set(mides)).toEqual(new Set(['24']));
    // Sense Crear (cap onCreate), l'Ordenar és l'última peça de la fila 2: a plom del [|<] de la fila 1.
    expect(ordenar.parentElement.lastElementChild).toBe(ordenar);
    expect(within(fila1).getByRole('button', { name: 'Replegar NOTES' }).parentElement.lastElementChild.getAttribute('aria-label')).toBe('Replegar NOTES');
  });
});
