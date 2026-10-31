/* MD (ordre del Mestre, 261003) · El patró mestre-detall del Workspace en
   «estret», com a les apps de missatgeria: primer la navegació (carpetes, o
   la llista si no n'hi ha), carpeta → llista → detall, i la fletxa ← de la barra blava (la
   UniversalPage de veres al detall) torna a la llista. Mai dos panells
   oberts. En ample i en mitjà res no canvia (Llei del Píxel), i el mode
   compacte (el Snippet Curador) es queda amb el detall.
   jsdom no fa layout: l'amplària de la closca (clientWidth), l'observador i
   els fotogrames es posen a mà. Dades sintètiques. */
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
import { UniversalPage } from '../UniversalPage.jsx';
import UniversalToolbar from '../UniversalToolbar.jsx';

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
/* El detall és una Pàgina Universal de veres: la barra blava i la seua fletxa. */
const ambPagina = ({ item }) => <UniversalPage chrome="context" title={item ? item.title : 'Cap'} />;

/* La memòria del nivell ({ clau, element }) viu a la capa efímera: cada
   prova comença com una pestanya nova. */
beforeEach(() => { mocks.navigate.mockClear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* L'amplària de la closca, l'observador de mida i els fotogrames, a mà.
   redimensiona() avisa tots els observadors (la closca i la barra d'eines). */
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

const espai = (props = {}) => (
  <UniversalWorkspace
    model={MODEL}
    labels={ETIQUETES}
    icons={ICONES}
    tagFilter={false}
    renderDetail={ambPagina}
    mestreDetall="navegacio"
    {...props}
  />
);
const munta = (props) => render(espai(props));

const closca = (c) => c.querySelector('.app-grid-shell');
const panell = (c) => closca(c).dataset.panell;
const navegacio = (c) => c.querySelector('#app-grid-sidebar');
const llista = (c) => c.querySelector('#app-grid-list');
const detall = (c) => c.querySelector('#app-grid-main');
/* Mai dos panells oberts: en estret, una sola columna sense aria-hidden. */
const obertes = (c) => ['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']
  .filter((id) => c.querySelector(id).getAttribute('aria-hidden') !== 'true');
const fitxa = (c, titol) => within(llista(c)).getByRole('button', { name: titol });
const carpeta = (c, nom) => within(navegacio(c)).getByRole('button', { name: nom });
const fletxaBlava = (c) => within(detall(c)).getByRole('button', { name: 'Tornar arrere' });
/* useId canvia d'un muntatge a l'altre: no és cap píxel. */
const senseIds = (html) => html.replace(/:r[0-9a-z]+:/g, ':id:').replace(/toc-r[0-9a-z]+/g, 'toc-id');

test('MD · a 375 i sense selecció: carpetes → llista → editor, i la fletxa blava torna a la llista amb el focus a la fitxa', () => {
  entorn(375, ({ buida }) => {
    const { container } = munta();
    expect([closca(container).dataset.layout, panell(container)]).toEqual(['estret', 'left']);
    expect(obertes(container)).toEqual(['#app-grid-sidebar']);
    expect(detall(container).getAttribute('inert')).toBe('true');

    fireEvent.click(carpeta(container, 'Mur'));
    expect(panell(container)).toBe('middle');
    expect(obertes(container)).toEqual(['#app-grid-list']);
    buida();
    expect(document.activeElement).toBe(llista(container).querySelector('aside.sdp-workspace-column'));

    const segona = fitxa(container, 'Segona');
    segona.focus();
    fireEvent.click(segona);
    expect(panell(container)).toBe('');
    expect(obertes(container)).toEqual(['#app-grid-main']);
    expect(llista(container).contains(document.activeElement)).toBe(false);
    buida();
    expect(document.activeElement).toBe(detall(container).querySelector('.sdp-workspace-detail'));
    expect(within(detall(container)).getByRole('heading', { level: 1 }).textContent).toBe('Segona');

    const fletxa = fletxaBlava(container);
    fletxa.focus();
    fireEvent.click(fletxa);
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(panell(container)).toBe('middle');
    expect(obertes(container)).toEqual(['#app-grid-list']);
    expect(detall(container).contains(document.activeElement)).toBe(false);
    const tornada = within(llista(container)).getByRole('button', { name: 'Segona' });
    expect(tornada.getAttribute('aria-current')).toBe('true');
    expect(document.activeElement).toBe(tornada);
  });
});

test('MD · la fletxa de la barra d’eines (UniversalToolbar) fa la mateixa tornada que la blava', () => {
  entorn(375, ({ buida }) => {
    const { container } = munta({ renderDetail: () => <UniversalToolbar /> });
    fireEvent.click(carpeta(container, 'Mur'));
    buida();
    fireEvent.click(fitxa(container, 'Primera'));
    buida();
    expect(panell(container)).toBe('');
    fireEvent.click(within(detall(container)).getByRole('button', { name: 'Tornar a la llista' }));
    expect(panell(container)).toBe('middle');
    expect(document.activeElement).toBe(within(llista(container)).getByRole('button', { name: 'Primera' }));
  });
});

test('MD · un enllaç profund (mestreDetall="detall") obri el detall, i la fletxa blava porta a la llista', () => {
  entorn(375, () => {
    const seleccio = { categoryId: 'f-mur', itemId: 'n2' };
    const { container } = munta({ mestreDetall: 'detall', initialSelection: seleccio, selection: seleccio });
    expect(panell(container)).toBe('');
    expect(obertes(container)).toEqual(['#app-grid-main']);
    fireEvent.click(fletxaBlava(container));
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(panell(container)).toBe('middle');
    expect(document.activeElement).toBe(within(llista(container)).getByRole('button', { name: 'Segona' }));
  });
});

test('MD · un remuntatge per workspaceKey (la sessió reinjectada) no trau la persona del nivell on era', () => {
  entorn(375, ({ buida }) => {
    const model = (clau) => ({ ...MODEL, workspaceKey: clau });
    const { container, rerender } = render(espai({ model: model('a') }));
    fireEvent.click(carpeta(container, 'Mur'));
    buida();
    fireEvent.click(fitxa(container, 'Segona'));
    buida();
    expect(panell(container)).toBe('');
    rerender(espai({ model: model('b') }));
    expect(panell(container)).toBe('');
    fireEvent.click(fletxaBlava(container));
    expect(panell(container)).toBe('middle');
    rerender(espai({ model: model('c') }));
    expect(panell(container)).toBe('middle');
    expect(obertes(container)).toEqual(['#app-grid-list']);
  });
});

test.each([
  ['sense columnesInicials (Disseny, Wiki, Perfil)', undefined],
  ['amb la navegació plegada en rail en ample (Notes)', { left: true }]
])('MD · %s: l’obridor de carpetes obri al primer toc, cada vegada, i porta el focus a la carpeta activa', (_, columnesInicials) => {
  entorn(375, ({ buida, redimensiona }) => {
    const { container } = munta({ columnesInicials });
    for (let volta = 0; volta < 3; volta += 1) {
      fireEvent.click(carpeta(container, 'Mur'));
      expect(panell(container)).toBe('middle');
      buida();
      const obridor = within(llista(container)).getByRole('button', { name: 'CARPETES' });
      expect(obridor.getAttribute('aria-controls')).toBe('app-grid-sidebar');
      expect(obridor.hasAttribute('data-obri-columna')).toBe(true);
      expect(obridor.getAttribute('aria-expanded')).toBe('false');
      obridor.focus();
      fireEvent.click(obridor);
      expect(panell(container), `toc ${volta + 1}`).toBe('left');
      expect(obertes(container)).toEqual(['#app-grid-sidebar']);
      expect(document.activeElement).toBe(carpeta(container, 'Mur'));
      expect(document.activeElement.getAttribute('aria-current')).toBe('page');
    }
    // L'obridor no toca el rail d'«ample»: tornar a l'escriptori el deixa com era.
    redimensiona(1400);
    expect(closca(container).dataset.layout).toBe('ample');
    expect(container.querySelector('.has-left-collapsed') !== null).toBe(Boolean(columnesInicials?.left));
  });
});

test('MD · el mode compacte (Snippet Curador) es queda amb el detall, i la fletxa blava continua sent l’historial', () => {
  entorn(375, () => {
    const { container } = munta({ compacte: true });
    expect(panell(container)).toBe('');
    expect(obertes(container)).toEqual(['#app-grid-main']);
    fireEvent.click(fletxaBlava(container));
    expect(mocks.navigate).toHaveBeenCalledWith(-1);
    expect(panell(container)).toBe('');
  });
});

test('MD · sense navegació (Admin), la primera vista és la llista i no hi ha obridor de carpetes', () => {
  entorn(375, ({ buida }) => {
    const model = { status: 'ready', navigationGroups: [], items: MODEL.items.map((item) => ({ ...item, categoryIds: [] })) };
    const { container } = munta({ model, icons: {} });
    expect(panell(container)).toBe('middle');
    expect(obertes(container)).toEqual(['#app-grid-list']);
    expect(within(llista(container)).queryByRole('button', { name: 'CARPETES' })).toBeNull();
    fireEvent.click(fitxa(container, 'Tomaques'));
    buida();
    expect(panell(container)).toBe('');
    fireEvent.click(fletxaBlava(container));
    expect(panell(container)).toBe('middle');
  });
});

test('MD · Llei del Píxel: a 1400 i a 820 el DOM és idèntic amb l’activació i sense, i la fletxa blava torna a l’historial', () => {
  const formes = ['navegacio', { clau: 'prova', element: null }, { clau: 'prova', element: 'n2' }];
  for (const amplada of [1400, 820]) {
    for (const mestreDetall of formes) {
      entorn(amplada, () => {
        const sense = senseIds(munta({ mestreDetall: false }).container.innerHTML);
        cleanup();
        const { container } = munta({ mestreDetall, tornaDeLaLlista: () => {} });
        /* Columnes fixes (ordre del Mestre, 30-10-2026) · A 820 també
           «ample»: el Workspace no passa per «mitja». */
        expect(closca(container).dataset.layout).toBe('ample');
        expect(senseIds(container.innerHTML), `${amplada} ${JSON.stringify(mestreDetall)}`).toBe(sense);
        fireEvent.click(fletxaBlava(container));
        expect(mocks.navigate).toHaveBeenLastCalledWith(-1);
        expect(panell(container)).toBe('');
        cleanup();
        mocks.navigate.mockClear();
      });
    }
  }
});

test('MD · sense l’activació, en estret tot és com abans: el detall primer i la fletxa blava a l’historial', () => {
  entorn(375, () => {
    const { container } = munta({ mestreDetall: false });
    expect(panell(container)).toBe('');
    fireEvent.click(fletxaBlava(container));
    expect(mocks.navigate).toHaveBeenCalledWith(-1);
    expect(panell(container)).toBe('');
  });
});

/* ═══ Revisió de MD ═════════════════════════════════════════════════════ */

/* Una carpeta amb filles, com SABER a la Wiki (wikiManifest.js). */
const MODEL_ARBRE = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [
    {
      id: 'folders',
      label: null,
      options: [
        { id: 'f-saber', label: 'Saber' },
        { id: 'f-saber/arq', label: 'Arquitectura', parentId: 'f-saber' },
        { id: 'f-mur', label: 'Mur' }
      ]
    }
  ],
  items: [
    { id: 'd1', title: 'Coneixement', categoryIds: ['f-saber'] },
    { id: 'd2', title: 'Pedra seca', categoryIds: ['f-saber/arq'] },
    { id: 'd3', title: 'Primera', categoryIds: ['f-mur'] }
  ]
});

test('MD · en estret, el nom de la carpeta activa amb filles porta a la seua llista (cap carreró) i el chevron continua plegant', () => {
  entorn(375, ({ buida }) => {
    const { container } = munta({ model: MODEL_ARBRE });
    expect(panell(container)).toBe('left');
    fireEvent.click(carpeta(container, 'Saber'));
    expect(panell(container)).toBe('middle');
    buida();
    fireEvent.click(within(llista(container)).getByRole('button', { name: 'CARPETES' }));
    expect(panell(container)).toBe('left');
    const saber = carpeta(container, 'Saber');
    expect(saber.getAttribute('aria-current')).toBe('page');
    expect(saber.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(saber);

    fireEvent.click(saber);
    expect(panell(container)).toBe('middle');
    expect(obertes(container)).toEqual(['#app-grid-list']);
    buida();
    expect(document.activeElement).toBe(llista(container).querySelector('aside.sdp-workspace-column'));
    // Cap tria nova: la mateixa carpeta i el mateix document.
    expect(fitxa(container, 'Coneixement').getAttribute('aria-current')).toBe('true');

    // Tornar a les carpetes: continua desplegada; el chevron la plega sense moure el panell.
    fireEvent.click(within(llista(container)).getByRole('button', { name: 'CARPETES' }));
    expect(carpeta(container, 'Saber').getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(within(navegacio(container)).getByRole('button', { name: 'Plegar Saber' }));
    expect(panell(container)).toBe('left');
    expect(carpeta(container, 'Saber').getAttribute('aria-expanded')).toBe('false');
  });
});

test('MD · en ample, el nom de la carpeta activa amb filles la plega i la desplega, com abans', () => {
  entorn(1400, () => {
    const { container } = munta({ model: MODEL_ARBRE });
    fireEvent.click(carpeta(container, 'Saber'));
    expect(carpeta(container, 'Saber').getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(carpeta(container, 'Saber'));
    expect(carpeta(container, 'Saber').getAttribute('aria-expanded')).toBe('false');
    expect(panell(container)).toBe('');
  });
});

test.each([
  ['les dades en error', { model: { ...MODEL, status: 'error' } }],
  ['un element que no es pot obrir', {
    model: { ...MODEL, itemsComplete: false },
    initialSelection: { categoryId: 'f-mur', itemId: 'n9' },
    selection: { categoryId: 'f-mur', itemId: 'n9' }
  }]
])('MD · un enllaç profund amb %s: el detall porta la fletxa ← cap a la llista, només en estret', (_, props) => {
  entorn(375, () => {
    const { container } = munta({ mestreDetall: 'detall', ...props });
    expect(panell(container)).toBe('');
    expect(within(detall(container)).getByRole('alert')).toBeTruthy();
    fireEvent.click(within(detall(container)).getByRole('button', { name: 'Tornar a la llista' }));
    expect(panell(container)).toBe('middle');
    expect(obertes(container)).toEqual(['#app-grid-list']);
  });
  cleanup();
  entorn(1400, () => {
    const { container } = munta({ mestreDetall: 'detall', ...props });
    expect(within(detall(container)).getByRole('alert')).toBeTruthy();
    expect(within(detall(container)).queryByRole('button', { name: 'Tornar a la llista' })).toBeNull();
  });
});

test('MD · { clau, element }: tornar al mòdul amb el mateix element (Arrere, recàrrega) porta al nivell on era; un altre element és un enllaç', () => {
  entorn(375, ({ buida }) => {
    const md = (element) => ({ clau: 'prova', element });
    const entrada = render(espai({ mestreDetall: md(null) }));
    expect(panell(entrada.container)).toBe('left');
    // La secció escriu l'element a la URL ella sola (l'efecte de n1, la reconciliació).
    entrada.rerender(espai({ mestreDetall: md('n1') }));
    expect(panell(entrada.container)).toBe('left');
    cleanup();

    // L'Arrere (o la recàrrega) dona la mateixa URL: no és cap enllaç.
    const torna = render(espai({ mestreDetall: md('n1') }));
    expect(panell(torna.container)).toBe('left');
    fireEvent.click(carpeta(torna.container, 'Mur'));
    buida();
    expect(panell(torna.container)).toBe('middle');
    cleanup();
    const llistaRecordada = render(espai({ mestreDetall: md('n1') }));
    expect(panell(llistaRecordada.container)).toBe('middle');

    // Obrir una nota: la URL porta la nota triada; tornar-hi és tornar a l'editor.
    fireEvent.click(fitxa(llistaRecordada.container, 'Segona'));
    llistaRecordada.rerender(espai({ mestreDetall: md('n2') }));
    expect(panell(llistaRecordada.container)).toBe('');
    cleanup();
    expect(panell(render(espai({ mestreDetall: md('n2') })).container)).toBe('');
    cleanup();

    // Un enllaç a un altre element (la Cerca, el Xat): el detall.
    expect(panell(render(espai({ mestreDetall: md('n3') })).container)).toBe('');
    cleanup();
    // Sense element, sempre la navegació (l'entrada pel menú de l'app).
    expect(panell(render(espai({ mestreDetall: md(null) })).container)).toBe('left');
  });
});

test('MD · sense navegació, tornaDeLaLlista posa la fletxa ← a la llista, només en estret (Admin: tornar al Tauler)', () => {
  const model = { status: 'ready', navigationGroups: [], items: MODEL.items.map((item) => ({ ...item, categoryIds: [] })) };
  const torna = vi.fn();
  const etiquetes = { ...ETIQUETES, back: 'Tornar al Tauler' };
  entorn(375, () => {
    const { container } = munta({ model, icons: {}, labels: etiquetes, tornaDeLaLlista: torna });
    expect(panell(container)).toBe('middle');
    fireEvent.click(within(llista(container)).getByRole('button', { name: 'Tornar al Tauler' }));
    expect(torna).toHaveBeenCalledTimes(1);
  });
  cleanup();
  for (const amplada of [1400, 820]) {
    entorn(amplada, () => {
      const { container } = munta({ model, icons: {}, labels: etiquetes, tornaDeLaLlista: torna });
      expect(container.querySelector('[aria-label="Tornar al Tauler"]'), `${amplada}`).toBeNull();
      cleanup();
    });
  }
  // Amb navegació, l'obridor de carpetes ocupa el lloc i no hi ha fletxa.
  entorn(375, () => {
    const { container } = munta({ labels: etiquetes, tornaDeLaLlista: torna });
    fireEvent.click(carpeta(container, 'Mur'));
    expect(within(llista(container)).getByRole('button', { name: 'CARPETES' })).toBeTruthy();
    expect(within(llista(container)).queryByRole('button', { name: 'Tornar al Tauler' })).toBeNull();
  });
});
