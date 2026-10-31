/* T7C (P1) · UniversalWorkspace en mode compacte: el detall és la vista i no
   és cap element (el Snippet Curador del Bloc). Sense l'opció, res no canvia:
   ho vigilen UniversalWorkspace.test.jsx i UniversalWorkspace.columnes.test.jsx.
   Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { Folder } from 'lucide-react';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';

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
  itemsComplete: true,
  navigationGroups: [
    {
      id: 'folders',
      label: null,
      options: [
        { id: 'f-mur', label: 'Mur' },
        { id: 'f-tic', label: 'TIC' },
        { id: 'f-foto', label: 'Foto', parentId: 'f-tic' }
      ]
    }
  ],
  items: [
    { id: 'n1', title: 'Primera', categoryIds: ['f-mur'] },
    { id: 'n2', title: 'Retrat', categoryIds: ['f-foto'] }
  ]
};
const ETIQUETES = { categories: 'CARPETES', items: 'NOTES' };
const detall = ({ item, selection }) => (
  <p data-testid="detall">{`${selection.categoryId}|${item ? item.id : 'cap'}`}</p>
);

/* Com UniversalWorkspace.columnes.test.jsx: amplària i fotogrames a mà. */
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

const munta = (props = {}) => render(
  <UniversalWorkspace model={MODEL} labels={ETIQUETES} icons={{ categories: Folder }} compacte
    initialSelection={{ categoryId: 'f-mur', itemId: null }} renderDetail={detall} {...props} />
);

describe('mode compacte', () => {
  test('en ample, navegació i llista arrenquen en rail, la closca porta la classe i el detall no és cap element', () => {
    const { container } = munta();
    const shell = container.querySelector('.app-grid-shell');
    expect(shell.dataset.layout).toBe('ample');
    expect(container.querySelector('.app-grid-page.sdp-workspace.sdp-workspace--compacte')).not.toBeNull();
    expect(container.querySelector('.app-grid-content.has-left-collapsed.has-middle-collapsed')).not.toBeNull();
    const rail = screen.getByRole('navigation', { name: 'CARPETES' });
    expect(within(rail).getByRole('button', { name: 'Mur' }).getAttribute('aria-current')).toBe('page');
    /* La llista plegada és el rail dels documents de la carpeta. */
    expect(within(screen.getByRole('navigation', { name: 'NOTES' })).getByRole('button', { name: 'Primera' })).toBeTruthy();
    expect(screen.getByTestId('detall').textContent).toBe('f-mur|cap');
  });

  test('un columnesInicials explícit mana sobre el del mode compacte', () => {
    const { container } = munta({ columnesInicials: { left: true } });
    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
    expect(container.querySelector('.has-middle-collapsed')).toBeNull();
  });

  test('desplegada, la navegació no porta «Tot»: es tria una categoria', () => {
    ambAmpladaIFotogrames(1400, (buidaFotogrames) => {
      munta();
      fireEvent.click(screen.getByRole('button', { name: 'Expandir CARPETES' }));
      buidaFotogrames();
      expect(screen.getByRole('button', { name: 'Replegar CARPETES' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Tot' })).toBeNull();
    });
  });

  test('triar una categoria no obri cap element: la notificació porta itemId null', () => {
    const onSelectionChange = vi.fn();
    munta({ onSelectionChange });
    onSelectionChange.mockClear();
    fireEvent.click(within(screen.getByRole('navigation', { name: 'CARPETES' })).getByRole('button', { name: 'TIC' }));
    expect(onSelectionChange).toHaveBeenCalledWith({ categoryId: 'f-tic', itemId: null }, { reason: 'user' });
    expect(onSelectionChange.mock.calls.every(([seleccio]) => seleccio.itemId === null)).toBe(true);
    expect(screen.getByTestId('detall').textContent).toBe('f-tic|cap');
  });

  test('un document triat al rail de la llista sí que s’obri (selectItem)', () => {
    const onSelectionChange = vi.fn();
    munta({ onSelectionChange });
    fireEvent.click(within(screen.getByRole('navigation', { name: 'NOTES' })).getByRole('button', { name: 'Primera' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: 'f-mur', itemId: 'n1' }, { reason: 'user' });
  });

  test('sense selecció inicial d’element, la reconciliació tampoc en tria cap', () => {
    const onSelectionChange = vi.fn();
    munta({ initialSelection: { categoryId: 'f-mur' }, onSelectionChange });
    expect(screen.getByTestId('detall').textContent).toBe('f-mur|cap');
    expect(onSelectionChange.mock.calls.every(([seleccio]) => seleccio.itemId === null)).toBe(true);
  });

  /* Correcció T7C-R4 · Només camins que una persona pot fer: cap clic dins
     d'una columna inert. Columnes fixes (ordre del Mestre, 30-10-2026) · A
     800 el Snippet és «ample»: navegació i llista són els seus rails a la
     graella (COLUMNES_COMPACTE), cap panell. Triar una carpeta del rail no
     obri cap element ni la llista: el detall continua sent la vista. */
  test('a 800 (columnes fixes), triar una carpeta del rail de la navegació no obri cap panell ni la llista; el detall continua', () => {
    ambAmpladaIFotogrames(800, (buidaFotogrames) => {
      const { container } = munta();
      const shell = container.querySelector('.app-grid-shell');
      expect([shell.dataset.layout, shell.dataset.panell]).toEqual(['ample', '']);
      const llista = container.querySelector('#app-grid-list');
      expect([llista.hasAttribute('inert'), llista.getAttribute('aria-hidden')]).toEqual([false, null]);
      expect(container.querySelector('.app-grid-content.has-left-collapsed.has-middle-collapsed')).not.toBeNull();
      /* La navegació és al costat: cap obridor de panell a la llista. */
      expect(within(llista).queryByRole('button', { name: 'CARPETES' })).toBeNull();
      const rail = within(container.querySelector('#app-grid-sidebar')).getByRole('navigation', { name: 'CARPETES' });
      fireEvent.click(within(rail).getByRole('button', { name: 'TIC' }));
      buidaFotogrames();
      expect(shell.dataset.panell).toBe('');
      expect(screen.getByTestId('detall').textContent).toBe('f-tic|cap');
      expect(container.querySelector('.app-grid-content.has-left-collapsed.has-middle-collapsed')).not.toBeNull();
    });
  });

  /* Correcció dels verificadors (261004) · En «mitja» el Snippet no tenia el
     rail fix de la navegació (retirat, decisió 4 del Mestre de 30-10-2026): l'obridor
     de la capçalera de la llista és l'única porta a la navegació. Era el
     toggleColumn d'«ample» i obria un toc de cada dos (la closca obri el
     panell en desplegar, no en plegar). Després obria al primer toc.
     Columnes fixes (ordre del Mestre, 30-10-2026) · A 820 el Snippet és
     «ample»: la porta a la navegació és el seu Expandir, a la graella, i la
     desplega al primer toc cada vegada, sense panell; triar-hi una carpeta
     la deixa desplegada. */
  test('a 820 (columnes fixes), l’Expandir de la navegació la desplega a la graella al primer toc cada vegada, també després de triar una carpeta', () => {
    ambAmpladaIFotogrames(820, (buidaFotogrames) => {
      const { container } = munta();
      const shell = container.querySelector('.app-grid-shell');
      expect(shell.dataset.layout).toBe('ample');
      const navegacio = container.querySelector('#app-grid-sidebar');
      for (const carpeta of ['TIC', 'Mur']) {
        fireEvent.click(within(navegacio).getByRole('button', { name: 'Expandir CARPETES' }));
        buidaFotogrames();
        expect([carpeta, shell.dataset.panell, Boolean(container.querySelector('.has-left-collapsed'))]).toEqual([carpeta, '', false]);
        expect(container.querySelector('.app-grid-resizer--left')).not.toBeNull();
        fireEvent.click(within(navegacio).getByRole('button', { name: carpeta }));
        buidaFotogrames();
        expect([carpeta, shell.dataset.panell]).toEqual([carpeta, '']);
        expect(screen.getByTestId('detall').textContent).toBe(`${carpeta === 'TIC' ? 'f-tic' : 'f-mur'}|cap`);
        fireEvent.click(within(navegacio).getByRole('button', { name: 'Replegar CARPETES' }));
        buidaFotogrames();
        expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
      }
    });
  });

  /* Correcció dels verificadors (261004) · El Replegar del panell obert en
     «mitja» el tanca (tancaPanells) també sense el rail de la navegació.
     Abans commutava el plegat d'«ample»: en mode compacte la navegació
     arrenca plegada, i desplegar-la tornava a obrir el panell (el botó era
     mort i el panell només es tancava triant una carpeta). Columnes fixes
     (ordre del Mestre, 30-10-2026) · A 820 no hi ha panell: Replegar torna
     la navegació al rail de la graella, amb el focus a l'Expandir, i cap
     estat latent (l'Expandir la torna a desplegar al primer toc). */
  test('a 820 (columnes fixes), Replegar torna la navegació al rail de la graella i el focus a l’Expandir', () => {
    ambAmpladaIFotogrames(820, (buidaFotogrames) => {
      const { container } = munta();
      const shell = container.querySelector('.app-grid-shell');
      const navegacio = container.querySelector('#app-grid-sidebar');
      fireEvent.click(within(navegacio).getByRole('button', { name: 'Expandir CARPETES' }));
      buidaFotogrames();
      for (let vegada = 0; vegada < 2; vegada += 1) {
        const replegar = within(navegacio).getByRole('button', { name: 'Replegar CARPETES' });
        replegar.focus();
        fireEvent.click(replegar);
        buidaFotogrames();
        expect([vegada, shell.dataset.panell]).toEqual([vegada, '']);
        expect([navegacio.hasAttribute('inert'), navegacio.getAttribute('aria-hidden')]).toEqual([false, null]);
        expect(document.activeElement).toBe(within(navegacio).getByRole('button', { name: 'Expandir CARPETES' }));
        /* Cap estat latent: el mateix Expandir la torna a desplegar al primer toc. */
        fireEvent.click(document.activeElement);
        buidaFotogrames();
        expect(container.querySelector('.has-left-collapsed')).toBeNull();
        /* Ordre d'usabilitat (30-10-2026) · El focus, a la icona de l'esquerra
           (germana del [|<]), al lloc del botó de dalt del rail. */
        expect(document.activeElement).toBe(within(navegacio).getByRole('button', { name: 'Plegar la columna CARPETES' }));
      }
    });
  });

  /* Correcció T7C-R4 · El detall és la vista: en «estret» és l'única
     columna oberta i navegació i llista són panells tancats. La secció que
     munta el mode compacte du la tria al detall (el Snippet Curador ho fa
     amb la píndola de carpeta i DialegCarpeta). Un obridor al detall
     continua sent decisió del Mestre.
     Derogació (ordre del Mestre, 261004: «les dues barres han d'estar
     sempre presents plegades, o com a mínim una d'elles visible que permeta
     desplegar l'altra») · Abans no hi havia cap obridor a l'abast. Ara el
     rail de la closca (#app-grid-rail), a l'esquerra del detall, obri la
     navegació, i triar-hi una carpeta torna al detall, com en «mitja». */
  test('en estret, el detall és la vista i el rail de la closca obri la navegació; triar una carpeta torna al detall', () => {
    ambAmpladaIFotogrames(480, (buidaFotogrames) => {
      const { container } = munta();
      const shell = container.querySelector('.app-grid-shell');
      expect([shell.dataset.layout, shell.dataset.panell, shell.dataset.llista]).toEqual(['estret', '', 'rail']);
      for (const id of ['#app-grid-sidebar', '#app-grid-list']) {
        const columna = container.querySelector(id);
        expect([id, columna.hasAttribute('inert'), columna.getAttribute('aria-hidden')]).toEqual([id, true, 'true']);
      }
      const detall = container.querySelector('#app-grid-main');
      expect([detall.hasAttribute('inert'), detall.getAttribute('aria-hidden')]).toEqual([false, null]);
      expect(screen.getByTestId('detall').textContent).toBe('f-mur|cap');
      const rail = container.querySelector('#app-grid-rail');
      expect([rail.hasAttribute('inert'), rail.getAttribute('aria-hidden')]).toEqual([false, null]);
      const obridor = within(rail).getByRole('button', { name: 'CARPETES' });
      expect(obridor.getAttribute('aria-controls')).toBe('app-grid-sidebar');
      expect(within(rail).getByRole('button', { name: 'Expandir NOTES' }).getAttribute('aria-controls')).toBe('app-grid-list');
      fireEvent.click(obridor);
      expect(shell.dataset.panell).toBe('left');
      fireEvent.click(within(container.querySelector('#app-grid-sidebar')).getByRole('button', { name: 'TIC' }));
      buidaFotogrames();
      expect(shell.dataset.panell).toBe('');
      expect(screen.getByTestId('detall').textContent).toBe('f-tic|cap');
      expect(document.activeElement).toBe(container.querySelector('.sdp-workspace-detail'));
    });
  });

  test('si les dades fallen, el detall porta «Reintentar» (la llista és plegada)', () => {
    const refresh = vi.fn();
    munta({ model: { ...MODEL, status: 'error', refresh } });
    const alerta = within(columnaDetall()).getByRole('alert');
    fireEvent.click(within(alerta).getByRole('button', { name: 'Reintentar' }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  test('sense el mode compacte, el detall en error no porta «Reintentar» (com sempre)', () => {
    render(<UniversalWorkspace model={{ ...MODEL, status: 'error', refresh: vi.fn() }} labels={ETIQUETES} renderDetail={detall} />);
    expect(within(columnaDetall()).getByRole('alert').querySelector('button')).toBeNull();
  });
});

/* La columna del detall. */
function columnaDetall() {
  return document.querySelector('#app-grid-main');
}
