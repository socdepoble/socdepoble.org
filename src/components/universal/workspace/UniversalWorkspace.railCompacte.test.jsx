/* P6 (ordre del Mestre, 261003) · El Workspace usable en pantalles
   xicotetes: la primera columna estreta (el rail de la llista plegada, amb el
   menú) sempre a la vista i un desplegador clar de la llista, perquè l'editor
   ocupe l'espai i les tres columnes no es xafen. Integrat amb el
   mestre-detall (MD): en estret, els seus nivells no canvien; amb el detall a
   la vista, la llista es queda en rail. En «ample» res no canvia.
   jsdom no fa layout: l'amplària, l'observador i els fotogrames, a mà, com a
   UniversalWorkspace.mestreDetall.test.jsx. Dades sintètiques. */
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
    mestreDetall="navegacio"
    {...props}
  />
);

const closca = (c) => c.querySelector('.app-grid-shell');
const panell = (c) => closca(c).dataset.panell;
const navegacio = (c) => c.querySelector('#app-grid-sidebar');
const llista = (c) => c.querySelector('#app-grid-list');
const detallCol = (c) => c.querySelector('#app-grid-main');
const rail = (c) => c.querySelector('#app-grid-rail');
const tancada = (el) => [el.hasAttribute('inert'), el.getAttribute('aria-hidden')];
const enLlista = (c, nom) => within(llista(c)).getByRole('button', { name: nom });
const potsEnLlista = (c, nom) => within(llista(c)).queryByRole('button', { name: nom });
const enRail = (c, nom) => within(rail(c)).getByRole('button', { name: nom });
const carpeta = (c, nom) => within(navegacio(c)).getByRole('button', { name: nom });
/* Mai dos panells oberts (MD): les tres columnes sense aria-hidden. El rail
   d'estret no és cap columna: viu a part (#app-grid-rail). */
const obertes = (c) => ['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']
  .filter((id) => c.querySelector(id).getAttribute('aria-hidden') !== 'true');

/* ═══ Estret (375) amb el mestre-detall ═══════════════════════════════ */

test('P6 · a 375, amb el detall a la vista, el rail és a l’esquerra: desplegador, menú, lupa i documents; l’editor, la resta', () => {
  entorn(375, ({ buida }) => {
    const { container } = munta();
    /* La primera vista de MD, la navegació, tapa el rail. */
    expect(panell(container)).toBe('left');
    expect(tancada(rail(container))).toEqual([true, 'true']);
    fireEvent.click(carpeta(container, 'Mur'));
    buida();
    fireEvent.click(enLlista(container, 'Segona'));
    buida();
    expect([panell(container), closca(container).dataset.llista]).toEqual(['', 'rail']);
    /* El contracte de MD no canvia: una sola columna oberta, el detall. */
    expect(obertes(container)).toEqual(['#app-grid-main']);
    expect(tancada(rail(container))).toEqual([false, null]);
    expect(within(detallCol(container)).getByTestId('detall').textContent).toBe('Segona');

    const expandir = enRail(container, 'Expandir NOTES');
    expect(expandir.getAttribute('aria-expanded')).toBe('false');
    expect(expandir.getAttribute('aria-controls')).toBe('app-grid-list');
    expect(expandir.hasAttribute('data-obri-columna')).toBe(true);
    /* El menú: obridor de la closca. */
    const menu = enRail(container, 'CARPETES');
    expect(menu.getAttribute('aria-controls')).toBe('app-grid-sidebar');
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(menu.hasAttribute('data-obri-columna')).toBe(true);
    expect(enRail(container, 'Cercar elements')).toBeTruthy();
    /* Els documents del rail, amb l'actual marcat. */
    const documents = within(rail(container)).getByRole('navigation', { name: 'NOTES' });
    expect(within(documents).getByRole('button', { name: 'Segona' }).getAttribute('aria-current')).toBe('true');
    /* L'ordre del rail: el desplegador dalt de tot, després el menú. */
    const botons = [...rail(container).querySelectorAll('button')];
    expect(botons.indexOf(expandir)).toBe(0);
    expect(botons.indexOf(menu)).toBe(1);
    /* En el rail no hi ha cap Replegar ni cap fitxa. */
    expect(within(rail(container)).queryByRole('button', { name: 'Replegar NOTES' })).toBeNull();
    expect(rail(container).querySelector('.sdp-gestor-fitxa')).toBeNull();
  });
});

test('P6 · a 375, el desplegador obri la llista amb el focus a la fitxa actual, i el Replegar torna al detall amb el focus a l’Expandir', () => {
  entorn(375, ({ buida }) => {
    const seleccio = { categoryId: 'f-mur', itemId: 'n2' };
    const { container } = munta({ mestreDetall: 'detall', initialSelection: seleccio, selection: seleccio });
    expect(closca(container).dataset.llista).toBe('rail');

    const expandir = enRail(container, 'Expandir NOTES');
    expandir.focus();
    fireEvent.click(expandir);
    expect(panell(container)).toBe('middle');
    expect(obertes(container)).toEqual(['#app-grid-list']);
    /* El panell tapa rail i detall: el rail es queda muntat, tancat. */
    expect(tancada(rail(container))).toEqual([true, 'true']);
    expect(document.activeElement).toBe(enLlista(container, 'Segona'));
    expect(document.activeElement.getAttribute('aria-current')).toBe('true');

    const replegar = enLlista(container, 'Replegar NOTES');
    expect(replegar.getAttribute('aria-expanded')).toBe('true');
    expect(replegar.getAttribute('aria-controls')).toBe('app-grid-list');
    /* Visible també en estret: sense la classe que l'amagava. */
    expect(replegar.classList.contains('d-desktop-only')).toBe(false);

    replegar.focus();
    fireEvent.click(replegar);
    expect(panell(container)).toBe('');
    expect(obertes(container)).toEqual(['#app-grid-main']);
    expect(tancada(rail(container))).toEqual([false, null]);
    /* En el mateix commit, la guarda ja ha dut el focus a l'Expandir. */
    expect(document.activeElement).toBe(enRail(container, 'Expandir NOTES'));
    buida();
    expect(document.activeElement).toBe(enRail(container, 'Expandir NOTES'));
    /* Res no ha tocat el rail d'«ample»: la llista no és plegada en ample. */
    expect(container.querySelector('.has-middle-collapsed')).toBeNull();
  });
});

test('P6 · a 375, triar una fitxa del panell porta el focus a l’Expandir del rail i, després dels fotogrames, al detall (com MD)', () => {
  entorn(375, ({ buida }) => {
    const { container } = munta();
    fireEvent.click(carpeta(container, 'Mur'));
    buida();
    const fitxa = enLlista(container, 'Primera');
    fitxa.focus();
    fireEvent.click(fitxa);
    expect(llista(container).contains(document.activeElement)).toBe(false);
    expect(document.activeElement).toBe(enRail(container, 'Expandir NOTES'));
    buida();
    expect(document.activeElement).toBe(detallCol(container).querySelector('.sdp-workspace-detail'));
  });
});

test('P6 · a 375, el menú del rail obri la navegació al primer toc amb el focus a la carpeta activa, i la cascada de MD continua', () => {
  entorn(375, ({ buida }) => {
    const seleccio = { categoryId: 'f-mur', itemId: 'n1' };
    const { container } = munta({ mestreDetall: 'detall', initialSelection: seleccio, selection: seleccio });
    const menu = enRail(container, 'CARPETES');
    menu.focus();
    fireEvent.click(menu);
    expect(panell(container)).toBe('left');
    /* El panell de la navegació tapa rail i detall. */
    expect(obertes(container)).toEqual(['#app-grid-sidebar']);
    expect(tancada(rail(container))).toEqual([true, 'true']);
    expect(document.activeElement).toBe(carpeta(container, 'Mur'));

    fireEvent.click(carpeta(container, 'Mercat'));
    expect(panell(container)).toBe('middle');
    buida();
    fireEvent.click(enLlista(container, 'Tomaques'));
    expect([panell(container), closca(container).dataset.llista]).toEqual(['', 'rail']);
    buida();
    expect(document.activeElement).toBe(detallCol(container).querySelector('.sdp-workspace-detail'));
  });
});

test('P6 · a 375, la lupa del rail obri la llista amb el camp de cerca enfocat, i un document del rail s’obri al detall', () => {
  entorn(375, ({ buida }) => {
    const seleccio = { categoryId: 'f-mur', itemId: 'n1' };
    const { container } = munta({ mestreDetall: 'detall', initialSelection: seleccio, selection: seleccio });
    const documents = within(rail(container)).getByRole('navigation', { name: 'NOTES' });
    fireEvent.click(within(documents).getByRole('button', { name: 'Segona' }));
    buida();
    expect(within(detallCol(container)).getByTestId('detall').textContent).toBe('Segona');
    expect([panell(container), closca(container).dataset.llista]).toEqual(['', 'rail']);

    fireEvent.click(enRail(container, 'Cercar elements'));
    expect(panell(container)).toBe('middle');
    const camp = within(llista(container)).getByRole('searchbox');
    expect(document.activeElement).toBe(camp);
  });
});

test('P6 · a 375 sense el mestre-detall, estret és com abans: cap rail, la llista tancada amb el detall a la vista', () => {
  entorn(375, () => {
    const { container } = munta({ mestreDetall: false });
    expect(panell(container)).toBe('');
    expect(closca(container).hasAttribute('data-llista')).toBe(false);
    expect(rail(container)).toBeNull();
    expect(tancada(llista(container))).toEqual([true, 'true']);
  });
});

/* Derogació (ordre del Mestre, 261004: «com a mínim una barra visible que
   permeta desplegar l'altra») · Abans el mode compacte no portava rail en
   cap mida xicoteta, i en estret el Snippet es quedava sense cap barra. Ara
   en estret porta el rail de la closca; en mitjà, com abans (la llista es
   veu i la seua capçalera obri la navegació). */
test('P6 · el mode compacte (Snippet Curador) a 820 és «ample» (columnes fixes, 30-10-2026), sense desplegador nou; en estret, el rail de la closca (Barres)', () => {
  entorn(820, () => {
    const { container } = munta({ compacte: true, mestreDetall: false });
    expect(closca(container).dataset.layout).toBe('ample');
    expect(closca(container).hasAttribute('data-llista')).toBe(false);
    expect(rail(container)).toBeNull();
    /* Corrector del Gauntlet (30-10-2026) · El [|<] declara la columna que
       plega (aria-controls, a totes les pàgines), però cap botó no n'és
       l'obridor de panell (data-obri-columna). */
    expect(container.querySelector('[data-obri-columna][aria-controls="app-grid-list"]')).toBeNull();
    /* En compacte la llista arrenca plegada: el seu Expandir. */
    expect(enLlista(container, 'Expandir NOTES').getAttribute('aria-controls')).toBe('app-grid-list');
    cleanup();
  });
  entorn(480, () => {
    const { container } = munta({ compacte: true, mestreDetall: false });
    expect([closca(container).dataset.panell, closca(container).dataset.llista]).toEqual(['', 'rail']);
    expect(tancada(rail(container))).toEqual([false, null]);
    expect(enRail(container, 'Expandir NOTES').getAttribute('aria-controls')).toBe('app-grid-list');
    expect(enRail(container, 'CARPETES').getAttribute('aria-controls')).toBe('app-grid-sidebar');
    /* El detall continua sent la vista d'eixida: cap panell obert. */
    expect(obertes(container)).toEqual(['#app-grid-main']);
    cleanup();
  });
});

/* Barres · Abans, la capçalera de la llista en compacte portava el
   toggleColumn d'«ample»: obria la navegació un toc de cada dos. */
test('Barres · a 480 en mode compacte, l’obridor de la capçalera de la llista obri la navegació al primer toc, cada vegada', () => {
  entorn(480, ({ buida }) => {
    const { container } = munta({ compacte: true, mestreDetall: false });
    for (let volta = 0; volta < 2; volta += 1) {
      fireEvent.click(enRail(container, 'Expandir NOTES'));
      expect(panell(container)).toBe('middle');
      const obridor = enLlista(container, 'CARPETES');
      expect(obridor.hasAttribute('data-obri-columna')).toBe(true);
      fireEvent.click(obridor);
      expect(panell(container), `toc ${volta + 1}`).toBe('left');
      fireEvent.click(carpeta(container, 'Mercat'));
      buida();
      expect(panell(container)).toBe('');
    }
  });
});

/* ═══ 820: tauleta, mòbil apaïsat, encastat estret, 1024 ════════════════
   Columnes fixes (ordre del Mestre, 30-10-2026 ~12:45) · Abans, «mitja»:
   la llista plegada era un rail de «mitja» amb el menú (la carpeta) i la
   navegació, un panell per damunt. Ara la closca del Workspace és «ample»
   per damunt d'«estret»: les tres columnes a la graella i el plegat de
   sempre. */

test('P6 · a 820 (columnes fixes) el Replegar de la llista la plega en el rail d’«ample» i torna, amb el focus; cap carpeta duplicada al rail', () => {
  entorn(820, ({ buida }) => {
    const { container } = munta();
    expect([closca(container).dataset.layout, panell(container)]).toEqual(['ample', '']);
    expect(closca(container).hasAttribute('data-llista')).toBe(false);
    expect(llista(container).querySelector('.sdp-gestor-fitxa')).not.toBeNull();
    expect(container.querySelector('.app-grid-resizer--middle')).not.toBeNull();

    const replegar = enLlista(container, 'Replegar NOTES');
    /* El Replegar d'«ample»: no és l'obridor d'un panell (data-obri-columna),
       però declara la columna que plega (corrector del Gauntlet, 30-10-2026). */
    expect([replegar.getAttribute('aria-expanded'), replegar.getAttribute('aria-controls'), replegar.hasAttribute('data-obri-columna')])
      .toEqual(['true', 'app-grid-list', false]);
    replegar.focus();
    fireEvent.click(replegar);
    expect([closca(container).dataset.layout, closca(container).hasAttribute('data-llista')]).toEqual(['ample', false]);
    expect(container.querySelector('.has-middle-collapsed')).not.toBeNull();
    expect(container.querySelector('.app-grid-resizer--middle')).toBeNull();
    expect(rail(container)).toBeNull();
    expect(tancada(llista(container))).toEqual([false, null]);
    expect(tancada(detallCol(container))).toEqual([false, null]);
    buida();
    const expandir = enLlista(container, 'Expandir NOTES');
    expect(document.activeElement).toBe(expandir);
    /* La navegació és al costat: el rail no hi porta cap carpeta. */
    expect(potsEnLlista(container, 'CARPETES')).toBeNull();
    expect(llista(container).querySelector('.sdp-gestor-fitxa')).toBeNull();

    fireEvent.click(expandir);
    expect(container.querySelector('.has-middle-collapsed')).toBeNull();
    expect(container.querySelector('.app-grid-resizer--middle')).not.toBeNull();
    buida();
    /* Ordre d'usabilitat (30-10-2026) · El focus torna a la icona de
       l'esquerra, l'equivalent de l'Expandir del rail. */
    expect(document.activeElement).toBe(enLlista(container, 'Plegar la columna NOTES'));
  });
});

test('P6 · a 820 (columnes fixes) la navegació és la columna del costat: cap menú a la llista ni panell, i triar una carpeta la deixa a la graella', () => {
  entorn(820, ({ redimensiona }) => {
    const { container } = munta({ mestreDetall: false });
    expect(potsEnLlista(container, 'CARPETES')).toBeNull();
    for (const nom of ['Mercat', 'Mur']) {
      fireEvent.click(carpeta(container, nom));
      expect([nom, panell(container), closca(container).dataset.layout]).toEqual([nom, '', 'ample']);
      expect(tancada(navegacio(container))).toEqual([false, null]);
      expect(carpeta(container, nom).getAttribute('aria-current')).toBe('page');
    }
    redimensiona(1400);
    expect(closca(container).dataset.layout).toBe('ample');
    expect(container.querySelector('.has-left-collapsed')).toBeNull();
  });
});

test('P6 · la llista plegada a 820 és el rail d’«ample»: a 1400 la troba plegada, i de tornada també', () => {
  entorn(820, ({ redimensiona }) => {
    const { container } = munta();
    fireEvent.click(enLlista(container, 'Replegar NOTES'));
    expect(container.querySelector('.has-middle-collapsed')).not.toBeNull();
    redimensiona(1400);
    expect(closca(container).dataset.layout).toBe('ample');
    expect(container.querySelector('.has-middle-collapsed')).not.toBeNull();
    /* En «ample», el desplegador és el de sempre: no obri cap panell
       (data-obri-columna), i declara la columna (corrector del Gauntlet). */
    const expandir = enLlista(container, 'Expandir NOTES');
    expect([expandir.getAttribute('aria-expanded'), expandir.getAttribute('aria-controls'), expandir.hasAttribute('data-obri-columna')])
      .toEqual(['false', 'app-grid-list', false]);
    expect(potsEnLlista(container, 'CARPETES')).toBeNull();
    redimensiona(820);
    expect([closca(container).dataset.layout, closca(container).hasAttribute('data-llista')]).toEqual(['ample', false]);
    expect(container.querySelector('.has-middle-collapsed')).not.toBeNull();
  });
});

/* ═══ Ample (1400): res no canvia ════════════════════════════════════ */

test('P6 · a 1400 el Replegar és el d’«ample» (declara la columna, cap obridor de panell, la classe de sempre) i no hi ha data-llista', () => {
  entorn(1400, () => {
    const { container } = munta();
    expect(closca(container).dataset.layout).toBe('ample');
    expect(closca(container).hasAttribute('data-llista')).toBe(false);
    expect(rail(container)).toBeNull();
    const replegar = enLlista(container, 'Replegar NOTES');
    /* Corrector del Gauntlet (30-10-2026) · Declara la columna que plega, com
       a /disseny: abans /notes no en deia l'estat. Cap obridor de panell. */
    expect([replegar.getAttribute('aria-expanded'), replegar.getAttribute('aria-controls'), replegar.hasAttribute('data-obri-columna')])
      .toEqual(['true', 'app-grid-list', false]);
    expect(replegar.classList.contains('d-desktop-only')).toBe(true);
    /* Ni obridor del menú a la llista: la navegació és una columna. */
    expect(potsEnLlista(container, 'CARPETES')).toBeNull();
  });
});
