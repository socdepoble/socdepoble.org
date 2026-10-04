/* Barres (ordre del Mestre, 261004: «La columna de la Wiki ha d'estar fixa
   i visible, almenys plegada, en tots els formats: les dues barres han
   d'estar sempre presents plegades, o com a mínim una d'elles visible que
   permeta desplegar l'altra») · En «mitja» la navegació del Workspace és un
   rail fix (AppGridShell railEsquerra): Expandir obri el panell amb el focus
   a la carpeta activa, i Replegar el tanca i torna al rail, sense tocar el
   plegat d'«ample». El mode compacte (Snippet, T7C-R4) no el porta.
   jsdom no fa layout: l'amplària, l'observador i els fotogrames, a mà, com a
   UniversalWorkspace.railCompacte.test.jsx. Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { FileText, Folder } from 'lucide-react';

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

const MODEL = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [
    { id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }, { id: 'f-mercat', label: 'Mercat' }] }
  ],
  items: [
    { id: 'n1', title: 'Primera', categoryIds: ['f-mur'] },
    { id: 'n2', title: 'Segona', categoryIds: ['f-mur'] },
    { id: 'n3', title: 'Tomaques', categoryIds: ['f-mercat'] }
  ]
});
const ETIQUETES = Object.freeze({ categories: 'CARPETES', items: 'NOTES' });
const ICONES = Object.freeze({ categories: Folder, items: FileText });
const detall = ({ item }) => <p data-testid="detall">{item ? item.title : 'cap'}</p>;

beforeEach(() => { sessionStorage.clear(); localStorage.clear(); });
afterEach(() => cleanup());

function entorn(ampladaInicial, prova) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const rafAbans = globalThis.requestAnimationFrame;
  const observadorAbans = globalThis.ResizeObserver;
  let amplada = ampladaInicial;
  const cua = [];
  const avisos = new Set();
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.requestAnimationFrame = (cb) => { cua.push(cb); return cua.length; };
  globalThis.ResizeObserver = class {
    constructor(cb) { this.cb = cb; }
    observe() { avisos.add(this.cb); }
    unobserve() {}
    disconnect() { avisos.delete(this.cb); }
  };
  const buida = () => act(() => { while (cua.length) cua.shift()(0); });
  const redimensiona = (nova) => {
    amplada = nova;
    act(() => { [...avisos].forEach((cb) => cb([{ contentRect: { width: nova } }])); });
  };
  try {
    prova({ buida, redimensiona });
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
    renderDetail={detall}
    initialSelection={{ categoryId: 'f-mur' }}
    {...props}
  />
);

const closca = (c) => c.querySelector('.app-grid-shell');
const panell = (c) => closca(c).dataset.panell;
const navegacio = (c) => c.querySelector('#app-grid-sidebar');
const tancada = (el) => [el.hasAttribute('inert'), el.getAttribute('aria-hidden')];
const enNavegacio = (c, nom) => within(navegacio(c)).getByRole('button', { name: nom });
const potsEnNavegacio = (c, nom) => within(navegacio(c)).queryByRole('button', { name: nom });

test('Barres · a 820 la navegació és el rail fix: Expandir (obridor de la closca), roda i carpetes, oberta i a l’abast', () => {
  entorn(820, () => {
    const { container } = munta();
    expect([closca(container).dataset.layout, panell(container), closca(container).dataset.esquerra]).toEqual(['mitja', '', 'rail']);
    expect(tancada(navegacio(container))).toEqual([false, null]);
    expect(container.querySelector('.app-grid-page').classList.contains('sdp-workspace--universal')).toBe(true);
    const expandir = enNavegacio(container, 'Expandir CARPETES');
    expect(expandir.getAttribute('aria-controls')).toBe('app-grid-sidebar');
    expect(expandir.getAttribute('aria-expanded')).toBe('false');
    expect(expandir.hasAttribute('data-obri-columna')).toBe(true);
    expect(enNavegacio(container, 'Configuració de l’espai de treball')).toBeTruthy();
    const rail = within(navegacio(container)).getByRole('navigation', { name: 'CARPETES' });
    expect(rail.classList.contains('sdp-workspace-rail')).toBe(true);
    expect(within(rail).getByRole('button', { name: 'Mur' }).getAttribute('aria-current')).toBe('page');
    /* L'arbre desplegat no hi és: és el rail. */
    expect(potsEnNavegacio(container, 'Replegar CARPETES')).toBeNull();
  });
});

test('Barres · a 820 Expandir obri el panell amb el focus a la carpeta activa; Replegar el tanca i torna al rail amb el focus a l’Expandir', () => {
  entorn(820, ({ buida, redimensiona }) => {
    const { container } = munta();
    const expandir = enNavegacio(container, 'Expandir CARPETES');
    expandir.focus();
    fireEvent.click(expandir);
    expect(panell(container)).toBe('left');
    /* En el mateix commit, el focus a la carpeta activa de l'arbre. */
    expect(document.activeElement).toBe(enNavegacio(container, 'Mur'));
    expect(document.activeElement.getAttribute('aria-current')).toBe('page');
    expect(potsEnNavegacio(container, 'Expandir CARPETES')).toBeNull();

    /* Abans, Replegar commutava el plegat d'«ample»: per davall del mínim
       d'ample no feia res visible (el panell es quedava obert) i deixava
       l'estat latent. */
    const replegar = enNavegacio(container, 'Replegar CARPETES');
    replegar.focus();
    fireEvent.click(replegar);
    expect(panell(container)).toBe('');
    expect(tancada(navegacio(container))).toEqual([false, null]);
    buida();
    expect(document.activeElement).toBe(enNavegacio(container, 'Expandir CARPETES'));

    /* Cap estat latent: en «ample» l'arbre arriba desplegat, com era. */
    redimensiona(1400);
    expect(closca(container).dataset.layout).toBe('ample');
    expect(closca(container).hasAttribute('data-esquerra')).toBe(false);
    expect(container.querySelector('.has-left-collapsed')).toBeNull();
    expect(enNavegacio(container, 'Replegar CARPETES')).toBeTruthy();
  });
});

test('Barres · a 820 una carpeta del rail filtra la llista i porta el focus a la llista; el rail es queda', () => {
  entorn(820, ({ buida }) => {
    const { container } = munta();
    const rail = within(navegacio(container)).getByRole('navigation', { name: 'CARPETES' });
    fireEvent.click(within(rail).getByRole('button', { name: 'Mercat' }));
    expect(panell(container)).toBe('');
    buida();
    const llista = container.querySelector('#app-grid-list');
    expect(document.activeElement).toBe(llista.querySelector('aside.sdp-workspace-column'));
    expect(within(llista).getByRole('button', { name: /Tomaques/ })).toBeTruthy();
    expect(within(navegacio(container)).getByRole('button', { name: 'Mercat' }).getAttribute('aria-current')).toBe('page');
  });
});

test('Barres · d’ample amb la navegació plegada a mitjà el rail és el mateix, i de tornada a ample continua plegada', () => {
  entorn(1400, ({ redimensiona }) => {
    const { container } = munta({ columnesInicials: { left: true } });
    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
    redimensiona(820);
    expect([closca(container).dataset.layout, closca(container).dataset.esquerra]).toEqual(['mitja', 'rail']);
    expect(enNavegacio(container, 'Expandir CARPETES').hasAttribute('data-obri-columna')).toBe(true);
    redimensiona(1400);
    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
    /* En «ample», l'Expandir de sempre: no és cap obridor de panell. */
    expect(enNavegacio(container, 'Expandir CARPETES').hasAttribute('data-obri-columna')).toBe(false);
  });
});

test('Barres · el mode compacte (Snippet, T7C-R4) no porta el rail de mitjà: la navegació, com abans', () => {
  entorn(820, () => {
    const { container } = munta({ compacte: true });
    expect(closca(container).dataset.layout).toBe('mitja');
    expect(closca(container).hasAttribute('data-esquerra')).toBe(false);
    expect(tancada(navegacio(container))).toEqual([true, 'true']);
  });
});

/* Correcció dels verificadors (261004) · El rail de «mitja» és per a una
   navegació declarada. Admin passa navigationGroups: [] i cap categoria
   (FILTRES sense cap filtre): el rail només hi portava un Expandir cap a un
   panell buit i la roda, i llevava 56 px al detall. Ara, la closca d'abans. */
test('Barres · sense cap navegació declarada (Admin) no hi ha rail a 820: la navegació, com abans', () => {
  entorn(820, () => {
    const model = { status: 'ready', itemsComplete: true, navigationGroups: [], items: MODEL.items.map((item) => ({ ...item, categoryIds: [] })) };
    const { container } = munta({ model, labels: { categories: 'FILTRES', items: 'USUARIS' }, icons: {}, mestreDetall: 'navegacio' });
    expect(closca(container).dataset.layout).toBe('mitja');
    expect(closca(container).hasAttribute('data-esquerra')).toBe(false);
    expect(tancada(navegacio(container))).toEqual([true, 'true']);
    expect(potsEnNavegacio(container, 'Expandir FILTRES')).toBeNull();
  });
});

/* Es llig de l'estructura (grups declarats), no de les opcions: mentre les
   carpetes carreguen el rail ja hi és, i el detall no es mou quan arriben. */
test('Barres · amb els grups declarats però encara buits (carregant), el rail ja hi és i s’hi queda quan arriben les carpetes', () => {
  entorn(820, () => {
    const carregant = { status: 'loading', navigationGroups: [{ id: 'folders', label: null, options: [] }], items: [] };
    const { container, rerender } = munta({ model: carregant });
    expect(closca(container).dataset.esquerra).toBe('rail');
    rerender(
      <UniversalWorkspace model={MODEL} labels={ETIQUETES} icons={ICONES} tagFilter={false} renderDetail={detall}
        initialSelection={{ categoryId: 'f-mur' }} />
    );
    expect(closca(container).dataset.esquerra).toBe('rail');
    expect(within(navegacio(container)).getByRole('navigation', { name: 'CARPETES' })).toBeTruthy();
  });
});

test('Barres · a 1400 i a 375 cap data-esquerra: ample i estret no canvien', () => {
  for (const amplada of [1400, 375]) {
    entorn(amplada, () => {
      const { container } = munta({ mestreDetall: 'navegacio' });
      expect(closca(container).hasAttribute('data-esquerra'), `${amplada}`).toBe(false);
      cleanup();
    });
  }
});
