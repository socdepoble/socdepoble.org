/* P6 · Revisió adversarial del desplegador de la llista en pantalles
   xicotetes (UniversalWorkspace.railCompacte.test.jsx en cobrix el camí
   feliç). Ací, els camins que la primera tanda no provava. jsdom no fa
   layout: l'amplària, l'observador i els fotogrames, a mà. Dades
   sintètiques. */
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

const SELECCIO = Object.freeze({ categoryId: 'f-mur', itemId: 'n1' });
const munta = (props = {}) => render(
  <UniversalWorkspace
    model={MODEL}
    labels={ETIQUETES}
    icons={ICONES}
    tagFilter={false}
    renderDetail={detall}
    mestreDetall="detall"
    initialSelection={SELECCIO}
    selection={SELECCIO}
    {...props}
  />
);

const closca = (c) => c.querySelector('.app-grid-shell');
const panell = (c) => closca(c).dataset.panell;
const llista = (c) => c.querySelector('#app-grid-list');
const rail = (c) => c.querySelector('#app-grid-rail');
const enRail = (c, nom) => within(rail(c)).getByRole('button', { name: nom });
const enLlista = (c, nom) => within(llista(c)).getByRole('button', { name: nom });
/* On és el focus, en curt (els missatges de fallada no bolquen el DOM). */
const focus = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'body';
  const lloc = el.closest('#app-grid-rail, #app-grid-list, #app-grid-main, #app-grid-sidebar')?.id || 'fora';
  return `${el.getAttribute('aria-label') || el.getAttribute('type') || el.tagName}@${lloc}`;
};

test('P6 (revisió) F1 · a 375, la lupa del rail amb la cerca ja oberta porta el focus al camp, en el mateix commit', () => {
  entorn(375, ({ buida }) => {
    const { container } = munta();
    fireEvent.click(enRail(container, 'Cercar elements'));
    expect(panell(container)).toBe('middle');
    expect(focus()).toBe('search@app-grid-list');
    fireEvent.click(enLlista(container, 'Segona'));
    buida();
    expect(panell(container)).toBe('');
    const lupa = enRail(container, 'Cercar elements');
    lupa.focus();
    fireEvent.click(lupa);
    expect(panell(container)).toBe('middle');
    expect(focus(), 'mateix commit').toBe('search@app-grid-list');
    buida();
    expect(focus(), 'després dels fotogrames').toBe('search@app-grid-list');
  });
});

test('P6 (revisió) F1 · a 820, la lupa del rail de la llista plegada la desplega amb el camp de cerca enfocat (el camí de toggleColumn)', () => {
  entorn(820, () => {
    const { container } = munta({ mestreDetall: false });
    fireEvent.click(enLlista(container, 'Replegar NOTES'));
    expect(closca(container).dataset.llista).toBe('rail');
    fireEvent.click(enLlista(container, 'Cercar elements'));
    expect(closca(container).hasAttribute('data-llista')).toBe(false);
    expect(focus()).toBe('search@app-grid-list');
  });
});

test('P6 (revisió) F2 · a 820, l’obridor de la navegació (aria-expanded) torna a tancar el panell, des de la capçalera i des del rail', () => {
  entorn(820, () => {
    const { container } = munta({ mestreDetall: false, initialSelection: undefined, selection: undefined });
    const menu = enLlista(container, 'CARPETES');
    menu.focus();
    fireEvent.click(menu);
    expect(panell(container)).toBe('left');
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    /* En mitjà la llista no es tanca: l'obridor continua a l'abast. */
    menu.focus();
    fireEvent.click(menu);
    expect(panell(container)).toBe('');
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(focus()).toBe('CARPETES@app-grid-list');

    /* El mateix amb la llista plegada en rail. */
    fireEvent.click(enLlista(container, 'Replegar NOTES'));
    const menuRail = enLlista(container, 'CARPETES');
    fireEvent.click(menuRail);
    expect(panell(container)).toBe('left');
    expect(menuRail.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(menuRail);
    expect(panell(container)).toBe('');
    expect(menuRail.getAttribute('aria-expanded')).toBe('false');
  });
});

test('P6 (revisió) F3 · d’estret a mitjà amb el focus al rail, el focus va a la fitxa actual de la llista, no a <body>', () => {
  entorn(375, ({ redimensiona, buida }) => {
    const { container } = munta();
    enRail(container, 'Expandir NOTES').focus();
    expect(focus()).toBe('Expandir NOTES@app-grid-rail');
    redimensiona(820);
    expect(closca(container).dataset.layout).toBe('mitja');
    expect(rail(container)).toBeNull();
    expect(focus(), 'mateix commit').toBe('button@app-grid-list');
    expect(document.activeElement.getAttribute('aria-current')).toBe('true');
    expect(document.activeElement.textContent).toContain('Primera');
    buida();
    expect(focus()).toBe('button@app-grid-list');
  });
});

test('P6 (revisió) F3 · d’estret a mitjà amb el focus al detall, la guarda no el mou', () => {
  entorn(375, ({ redimensiona }) => {
    const { container } = munta();
    const detallNode = container.querySelector('.sdp-workspace-detail');
    detallNode.focus();
    redimensiona(820);
    expect(closca(container).dataset.layout).toBe('mitja');
    expect(document.activeElement).toBe(detallNode);
  });
});
