/* T7 · UniversalWorkspace: P3 (la columna de carpetes pot arrencar plegada,
   per opció) i P5 (el filtre opcional que inclou les subcarpetes). Sense les
   opcions, res no canvia: ho vigilen les proves de sempre de
   UniversalWorkspace.test.jsx. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { Folder } from 'lucide-react';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';
import { createWorkspaceState, filterWorkspaceItems } from './workspaceState.js';

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

const MODEL = {
  status: 'ready',
  navigationGroups: [
    { id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }, { id: 'f-mercat', label: 'Mercat' }] },
    { id: 'tags', label: 'ETIQUETES', options: [{ id: 'tag_Tutorial', label: 'Tutorial' }] }
  ],
  items: [
    { id: 'n1', title: 'Primera', categoryIds: ['f-mur'] },
    { id: 'm1', title: 'Samarreta', categoryIds: ['f-mercat'] }
  ]
};

const ETIQUETES = { categories: 'CARPETES', items: 'NOTES' };

/* Com UniversalWorkspace.test.jsx: amplària i fotogrames a mà. */
function ambAmpladaIFotogrames(amplada, prova) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const rafAbans = globalThis.requestAnimationFrame;
  const cua = [];
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.requestAnimationFrame = (cb) => { cua.push(cb); return cua.length; };
  const buidaFotogrames = () => act(() => { while (cua.length) cua.shift()(0); });
  try {
    prova(buidaFotogrames);
  } finally {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    globalThis.requestAnimationFrame = rafAbans;
  }
}

describe('P3 · columnesInicials', () => {
  test('createWorkspaceState: sense opció cap columna plegada; amb { left: true }, la navegació', () => {
    expect(createWorkspaceState().collapsed).toEqual({ left: false, middle: false });
    expect(createWorkspaceState({ categoryId: 'f-mur' }, { left: true }).collapsed).toEqual({ left: true, middle: false });
    expect(createWorkspaceState(undefined, { middle: true }).collapsed).toEqual({ left: false, middle: true });
    /* Només un true explícit: un valor qualsevol no plega res. */
    expect(createWorkspaceState({}, { left: 'si' }).collapsed).toEqual({ left: false, middle: false });
  });

  test('sense l’opció, en ample la navegació arrenca desplegada (com sempre)', () => {
    const { container } = render(<UniversalWorkspace model={MODEL} labels={ETIQUETES} renderDetail={() => null} />);
    expect(container.querySelector('.app-grid-shell').dataset.layout).toBe('ample');
    expect(screen.getByRole('button', { name: 'Replegar CARPETES' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Expandir CARPETES' })).toBeNull();
    expect(container.querySelector('.has-left-collapsed')).toBeNull();
  });

  test('amb { left: true }, en ample arrenca el rail; expandir porta a l’arbre i el focus al botó contrari', () => {
    ambAmpladaIFotogrames(1400, (buidaFotogrames) => {
      const { container } = render(
        <UniversalWorkspace model={MODEL} labels={ETIQUETES} columnesInicials={{ left: true }}
          initialSelection={{ categoryId: 'f-mur' }} renderDetail={() => null} />
      );
      expect(container.querySelector('.app-grid-shell').dataset.layout).toBe('ample');
      expect(container.querySelector('.app-grid-content.has-left-collapsed')).not.toBeNull();
      const rail = screen.getByRole('navigation', { name: 'CARPETES' });
      expect(rail.classList.contains('sdp-workspace-rail')).toBe(true);
      expect(within(rail).getByRole('button', { name: 'Mur' }).getAttribute('aria-current')).toBe('page');
      /* La llista no es plega: només la navegació. */
      expect(container.querySelector('.has-middle-collapsed')).toBeNull();
      expect(screen.getByRole('button', { name: 'Replegar NOTES' })).toBeTruthy();

      const expandir = screen.getByRole('button', { name: 'Expandir CARPETES' });
      expandir.focus();
      fireEvent.click(expandir);
      buidaFotogrames();
      expect(container.querySelector('.has-left-collapsed')).toBeNull();
      expect(container.querySelector('.sdp-workspace-rail')).toBeNull();
      const replegar = screen.getByRole('button', { name: 'Replegar CARPETES' });
      expect(document.activeElement).toBe(replegar);
    });
  });

  /* Derogació (ordre del Mestre, 261004: «les dues barres de la Wiki han
     d'estar sempre presents plegades, o com a mínim una d'elles visible que
     permeta desplegar l'altra») · Abans, en mitjà la navegació era tancada
     (aria-hidden) i sense rail. Ara és un rail fix, obert i a l'abast; el
     primer clic de la icona continua obrint el panell. */
  test('amb { left: true }, en mitjà la navegació és el rail fix i el primer clic de la icona obri el panell', () => {
    ambAmpladaIFotogrames(820, () => {
      const { container } = render(
        <UniversalWorkspace model={MODEL} labels={ETIQUETES} icons={{ categories: Folder }}
          columnesInicials={{ left: true }} renderDetail={() => null} />
      );
      const shell = container.querySelector('.app-grid-shell');
      expect([shell.dataset.layout, shell.dataset.panell, shell.dataset.esquerra]).toEqual(['mitja', '', 'rail']);
      const sidebar = container.querySelector('#app-grid-sidebar');
      expect(sidebar.getAttribute('aria-hidden')).toBeNull();
      expect(sidebar.hasAttribute('inert')).toBe(false);
      expect(sidebar.querySelector('.sdp-workspace-rail')).not.toBeNull();
      expect(within(sidebar).getByRole('button', { name: 'Expandir CARPETES' })).toBeTruthy();
      fireEvent.click(within(container.querySelector('#app-grid-list')).getByRole('button', { name: 'CARPETES' }));
      expect(shell.dataset.panell).toBe('left');
      expect(sidebar.getAttribute('aria-hidden')).toBeNull();
      /* Desplegada, l'arbre del panell: ja no és el rail. */
      expect(sidebar.querySelector('.sdp-workspace-rail')).toBeNull();
    });
  });
});

describe('P5 · inclouDescendents', () => {
  const NIUAT = {
    status: 'ready',
    itemsComplete: true,
    categories: [
      { id: 'wiki', label: 'Wiki' },
      { id: 'saber', label: 'Saber', parentId: 'wiki' },
      { id: 'protocols', label: 'Protocols', parentId: 'saber' },
      { id: 'hort', label: 'Hort' }
    ],
    items: [
      { id: 'portada', title: 'Portada', categoryIds: ['wiki'] },
      { id: 'protocol', title: 'Protocol viu', categoryIds: ['protocols'] },
      { id: 'tomaca', title: 'Tomaca', categoryIds: ['hort'] }
    ]
  };
  const titols = (container) => [...container.querySelectorAll('.sdp-gestor-fitxa__titol')].map((el) => el.textContent);

  test('filterWorkspaceItems: sense àmbit, només la categoria; amb àmbit, també les subcarpetes', () => {
    const items = NIUAT.items.map((item) => ({ ...item, tags: [] }));
    const estat = { activeCategoryId: 'wiki', activeTagIds: [], query: '' };
    expect(filterWorkspaceItems(items, estat).map((i) => i.id)).toEqual(['portada']);
    expect(filterWorkspaceItems(items, estat, { ambit: new Set(['wiki', 'saber', 'protocols']) }).map((i) => i.id))
      .toEqual(['portada', 'protocol']);
  });

  test('sense l’opció, triar «Wiki» només mostra els seus documents (com sempre)', () => {
    const { container } = render(<UniversalWorkspace model={NIUAT} initialSelection={{ categoryId: 'wiki' }} renderDetail={() => null} />);
    expect(titols(container)).toEqual(['Portada']);
  });

  test('amb l’opció, «Wiki» mostra també els de les subcarpetes, i una fulla no canvia', () => {
    const { container } = render(
      <UniversalWorkspace model={NIUAT} inclouDescendents initialSelection={{ categoryId: 'wiki' }} renderDetail={() => null} />
    );
    expect(titols(container)).toEqual(['Portada', 'Protocol viu']);
    fireEvent.click(screen.getByRole('button', { name: 'Hort' }));
    expect(titols(container)).toEqual(['Tomaca']);
  });

  test('amb l’opció, un document d’una subcarpeta obert des de la URL conserva la carpeta mare', () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <UniversalWorkspace model={NIUAT} inclouDescendents selection={{ categoryId: 'wiki', itemId: 'protocol' }}
        onSelectionChange={onSelectionChange} renderDetail={({ item }) => <p>Detall: {item?.title}</p>} />
    );
    expect(screen.getByText('Detall: Protocol viu')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Wiki' }).getAttribute('aria-current')).toBe('page');
    expect(titols(container)).toEqual(['Portada', 'Protocol viu']);
    /* La reconciliació no l'ha mogut a «Protocols». */
    expect(onSelectionChange).not.toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'protocols' }), expect.anything());
  });
});
