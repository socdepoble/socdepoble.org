/* Barres (ordre del Mestre, 261004: «La columna de la Wiki ha d'estar fixa
   i visible, almenys plegada, en tots els formats: les dues barres han
   d'estar sempre presents plegades, o com a mínim una d'elles visible que
   permeta desplegar l'altra») · Derogat en part per l'ordre del Mestre del
   30-10-2026 (~12:45): «fora de mòbil, l'UniversalWorkspace ha de mantindre
   sempre les 3 columnes fixes en la graella, mai superposades com a calaix
   flotant amb fons fosc». Abans, a 820 («mitja») la navegació era un rail
   fix i Expandir obria un panell per damunt amb vel. Ara la closca del
   Workspace (AppGridShell columnesFixes) és «ample» per damunt d'«estret»:
   la navegació és la primera columna de la graella, plegable en el rail
   d'«ample», i desplegar-la la torna a la graella amb el seu separador. El
   requisit de 261004 (sempre una barra visible) continua: plegada, el rail.
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
import { _reiniciaCarpetesVisibles } from './carpetesVisibles.js';

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

/* Llei de la Roda Dentada · La preferència de les carpetes a la vista té
   còpia en memòria: cada prova la torna a llegir de l'emmagatzematge buit. */
beforeEach(() => { sessionStorage.clear(); localStorage.clear(); _reiniciaCarpetesVisibles(); });
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

test('Columnes fixes · a 820 la navegació és la primera columna de la graella, desplegada i a l’abast, amb els dos separadors; cap panell ni rail de «mitja»', () => {
  entorn(820, () => {
    const { container } = munta();
    expect([closca(container).dataset.layout, panell(container)]).toEqual(['ample', '']);
    expect(tancada(navegacio(container))).toEqual([false, null]);
    expect(container.querySelector('.app-grid-page').classList.contains('sdp-workspace--universal')).toBe(true);
    expect(enNavegacio(container, 'Replegar CARPETES')).toBeTruthy();
    expect(enNavegacio(container, 'Configuració de l’espai de treball')).toBeTruthy();
    expect(enNavegacio(container, 'Mur').getAttribute('aria-current')).toBe('page');
    expect(potsEnNavegacio(container, 'Expandir CARPETES')).toBeNull();
    expect(container.querySelector('.app-grid-resizer--left')).not.toBeNull();
    expect(container.querySelector('.app-grid-resizer--middle')).not.toBeNull();
    /* Les desades (260 + 280) no hi caben amb els 320 del detall: es pinten
       repartides (graella.js, pistesAjustades). */
    const pagina = container.querySelector('.app-grid-page');
    expect([pagina.style.getPropertyValue('--app-grid-col-sidebar'), pagina.style.getPropertyValue('--app-grid-col-list')]).toEqual(['234px', '264px']);
  });
});

test('Columnes fixes · a 820 Replegar plega CARPETES en el rail amb el focus a l’Expandir, i Expandir la torna a la graella, mai com a panell', () => {
  entorn(820, ({ buida, redimensiona }) => {
    const { container } = munta();
    const replegar = enNavegacio(container, 'Replegar CARPETES');
    replegar.focus();
    fireEvent.click(replegar);
    buida();
    expect(panell(container)).toBe('');
    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
    expect(container.querySelector('.app-grid-resizer--left')).toBeNull();
    expect(tancada(navegacio(container))).toEqual([false, null]);
    const expandir = enNavegacio(container, 'Expandir CARPETES');
    expect(document.activeElement).toBe(expandir);
    /* En «ample», l'Expandir de sempre: no és cap obridor de panell. */
    expect(expandir.hasAttribute('data-obri-columna')).toBe(false);

    fireEvent.click(expandir);
    buida();
    expect([closca(container).dataset.layout, panell(container)]).toEqual(['ample', '']);
    expect(container.querySelector('.has-left-collapsed')).toBeNull();
    expect(container.querySelector('.app-grid-resizer--left')).not.toBeNull();
    /* Ordre d'usabilitat (30-10-2026) · Desplegada, el focus va a la icona de
       l'esquerra, l'equivalent del botó de dalt del rail (el mateix lloc). */
    expect(document.activeElement).toBe(enNavegacio(container, 'Plegar la columna CARPETES'));

    /* Cap estat latent: a 1400 l'arbre continua desplegat. */
    redimensiona(1400);
    expect(closca(container).dataset.layout).toBe('ample');
    expect(container.querySelector('.has-left-collapsed')).toBeNull();
    expect(enNavegacio(container, 'Replegar CARPETES')).toBeTruthy();
  });
});

/* Llei de la Roda Dentada (ordre del Mestre, 261007) · La roda del rail
   plegat és la mateixa de sempre: les carpetes amagades tampoc no hi són, i
   tornar-les a la vista les torna al rail. Columnes fixes (30-10-2026) · A
   820, el rail d'«ample» (columnesInicials), no el de «mitja». */
test('Barres · a 820 la roda del rail plegat amaga i torna a mostrar una carpeta del rail', () => {
  entorn(820, () => {
    const { container } = munta({ columnesInicials: { left: true } });
    const rail = () => within(navegacio(container)).getByRole('navigation', { name: 'CARPETES' });
    const delRail = () => within(rail()).getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(delRail()).toEqual(['Mur', 'Mercat']);
    fireEvent.click(enNavegacio(container, 'Configuració de l’espai de treball'));
    const dialeg = within(container.querySelector('dialog'));
    fireEvent.click(dialeg.getByRole('switch', { name: 'Vull vore Mercat' }));
    expect(delRail()).toEqual(['Mur']);
    /* El rail continua a la graella i obert: amagar no toca la closca. */
    expect([closca(container).dataset.layout, panell(container)]).toEqual(['ample', '']);
    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
    fireEvent.click(dialeg.getByRole('switch', { name: 'Vull vore Mercat' }));
    expect(delRail()).toEqual(['Mur', 'Mercat']);
  });
}, 30000);

test('Barres · a 820 una carpeta del rail plegat filtra la llista; el rail es queda i cap panell s’obri', () => {
  entorn(820, () => {
    const { container } = munta({ columnesInicials: { left: true } });
    const rail = within(navegacio(container)).getByRole('navigation', { name: 'CARPETES' });
    fireEvent.click(within(rail).getByRole('button', { name: 'Mercat' }));
    expect([closca(container).dataset.layout, panell(container)]).toEqual(['ample', '']);
    const llista = container.querySelector('#app-grid-list');
    expect(within(llista).getByRole('button', { name: /Tomaques/ })).toBeTruthy();
    expect(within(navegacio(container)).getByRole('button', { name: 'Mercat' }).getAttribute('aria-current')).toBe('page');
    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
  });
});

test('Barres · d’ample a 820 i de tornada, la navegació plegada és el mateix rail d’«ample»', () => {
  entorn(1400, ({ redimensiona }) => {
    const { container } = munta({ columnesInicials: { left: true } });
    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
    redimensiona(820);
    expect(closca(container).dataset.layout).toBe('ample');
    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
    /* En «ample», l'Expandir de sempre: no és cap obridor de panell. */
    expect(enNavegacio(container, 'Expandir CARPETES').hasAttribute('data-obri-columna')).toBe(false);
    redimensiona(1400);
    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
    expect(enNavegacio(container, 'Expandir CARPETES').hasAttribute('data-obri-columna')).toBe(false);
  });
});

test('Columnes fixes · el mode compacte (Snippet) a 820 és «ample»: la navegació, plegada en el rail de la graella, a l’abast', () => {
  entorn(820, () => {
    const { container } = munta({ compacte: true });
    expect([closca(container).dataset.layout, panell(container)]).toEqual(['ample', '']);
    expect(tancada(navegacio(container))).toEqual([false, null]);
    expect(enNavegacio(container, 'Expandir CARPETES')).toBeTruthy();
  });
});

/* Correcció dels verificadors (261004) · Admin passa navigationGroups: [] i
   cap categoria (FILTRES sense cap filtre). Columnes fixes (30-10-2026) · A
   820 és «ample», com a 1400: la navegació és la columna de la graella,
   oberta, sense cap rail de «mitja». */
test('Columnes fixes · sense cap navegació declarada (Admin) a 820 la navegació és la columna de la graella, com a 1400', () => {
  entorn(820, () => {
    const model = { status: 'ready', itemsComplete: true, navigationGroups: [], items: MODEL.items.map((item) => ({ ...item, categoryIds: [] })) };
    const { container } = munta({ model, labels: { categories: 'FILTRES', items: 'USUARIS' }, icons: {}, mestreDetall: 'navegacio' });
    expect([closca(container).dataset.layout, panell(container)]).toEqual(['ample', '']);
    expect(tancada(navegacio(container))).toEqual([false, null]);
    expect(potsEnNavegacio(container, 'Expandir FILTRES')).toBeNull();
  });
});

/* Mentre les carpetes carreguen, la closca ja és la de les columnes fixes i
   no es mou quan arriben. */
test('Columnes fixes · amb els grups declarats però encara buits (carregant), la closca ja és «ample» i s’hi queda quan arriben les carpetes', () => {
  entorn(820, () => {
    const carregant = { status: 'loading', navigationGroups: [{ id: 'folders', label: null, options: [] }], items: [] };
    const { container, rerender } = munta({ model: carregant });
    expect(closca(container).dataset.layout).toBe('ample');
    rerender(
      <UniversalWorkspace model={MODEL} labels={ETIQUETES} icons={ICONES} tagFilter={false} renderDetail={detall}
        initialSelection={{ categoryId: 'f-mur' }} />
    );
    expect([closca(container).dataset.layout, panell(container)]).toEqual(['ample', '']);
    expect(enNavegacio(container, 'Mur')).toBeTruthy();
  });
});

/* Corrector del Gauntlet f4 (30-10-2026, props-mortes-als-consumidors-i-a-les-proves)
   · La prova «a 1400 i a 375 cap data-esquerra» mirava un atribut que ja no
   produïx cap codi (railEsquerra, retirat amb la decisió 4 del Mestre): ara ho
   vigila la CSS, a AppGridShell.rail.test.jsx («cap regla de data-esquerra»). */
