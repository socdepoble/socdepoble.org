import React from 'react';
import { act, render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import BrainGraph from './BrainGraph';
import useForceLayout from './useForceLayout';
vi.mock('../../../data/wikiManifest', () => ({ wikiManifest: {
  categories: [{ id: 'cat', label: 'Saber' }],
  items: [{ id: 'doc', title: 'Olivera', categoryId: 'cat', tags: ['poble'] }]
} }));
vi.mock('./useForceLayout', () => ({ default: vi.fn(({ nodes }) => ({ current: nodes.map((node, i) => ({ ...node, x: 350 + i * 70, y: 300 })) })) }));

/* Fotogrames a mà: `buida` els executa amb un rellotge que avança 16 ms per
   volta. El context 2D és mut i apunta l'escala i el desplaçament de cada
   pintat: és el que veu l'usuari. */
let cua;
let seguent;
let pintats;
function buida() {
  let rellotge = 0;
  for (let volta = 0; volta < 200 && cua.size; volta++) {
    const ara = [...cua.values()];
    cua.clear();
    rellotge += 16;
    ara.forEach((cb) => cb(rellotge));
  }
}
function contextFals() {
  const estat = {};
  return new Proxy(estat, {
    get: (obj, prop) => {
      if (prop in obj) return obj[prop];
      if (prop === 'translate') return (x, y) => pintats.push({ x, y });
      if (prop === 'scale') return (k) => { pintats.at(-1).k = k; };
      return () => {};
    },
    set: (obj, prop, valor) => { obj[prop] = valor; return true; }
  });
}
const vista = () => pintats.at(-1);
const rodeta = (canvas, init) => {
  const event = new WheelEvent('wheel', { cancelable: true, bubbles: true, ...init });
  fireEvent(canvas, event);
  return event;
};
/* PointerEvent de jsdom no porta pointerId: el posem a mà per a dos dits. */
const punter = (canvas, tipus, pointerId, clientX, clientY) => {
  const event = new MouseEvent(tipus, { bubbles: true, cancelable: true, button: 0, clientX, clientY });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  fireEvent(canvas, event);
};

beforeEach(() => {
  cua = new Map();
  seguent = 0;
  pintats = [];
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => { seguent += 1; cua.set(seguent, cb); return seguent; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => { cua.delete(id); }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(contextFals());
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  vi.stubGlobal('PointerEvent', MouseEvent);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('explora metadades dels tres tipus amb teclat', () => {
  render(<BrainGraph />);
  const select = screen.getByRole('combobox');
  for (const [id, type] of [['doc', 'Document'], ['cat', 'Categoria'], ['tag_poble', 'Etiqueta']]) {
    fireEvent.change(select, { target: { value: id } });
    expect(screen.getByText(type, { selector: 'dd' })).toBeTruthy();
  }
});

test('la rodeta sense tecla fa zoom centrat en el punter, i no desplaça la pàgina', () => {
  const { container } = render(<BrainGraph />);
  const canvas = container.querySelector('canvas');
  expect(vista()).toEqual({ x: 0, y: 0, k: 1 });

  const event = rodeta(canvas, { deltaY: 100, clientX: 200, clientY: 150 });
  expect(event.defaultPrevented).toBe(true);
  buida();
  const k = Math.exp(-0.2);
  expect(vista().k).toBeCloseTo(k);
  // El punt de davall del punter no es mou: (200, 150) continua en (200, 150).
  expect(vista().x).toBeCloseTo(200 * (1 - k));
  expect(vista().y).toBeCloseTo(150 * (1 - k));

  rodeta(canvas, { deltaY: -100, clientX: 200, clientY: 150 });
  buida();
  expect(vista().k).toBeCloseTo(1);
});

test('els esdeveniments d’un fotograma fan un sol pintat i cap re-render', () => {
  const { container } = render(<BrainGraph />);
  const canvas = container.querySelector('canvas');
  const renders = useForceLayout.mock.calls.length;
  const abans = pintats.length;
  for (let i = 0; i < 3; i++) rodeta(canvas, { deltaY: 100 });
  expect(pintats.length).toBe(abans);
  buida();
  expect(pintats.length).toBe(abans + 1);
  expect(vista().k).toBeCloseTo(Math.exp(-0.6));

  // Arrossegar tampoc re-renderitza: només mou la vista.
  fireEvent.pointerDown(canvas, { button: 0, clientX: 100, clientY: 100 });
  fireEvent.pointerMove(canvas, { clientX: 160, clientY: 130 });
  fireEvent.pointerMove(canvas, { clientX: 170, clientY: 140 });
  buida();
  expect(vista().x).toBeCloseTo(70);
  expect(vista().y).toBeCloseTo(40);
  expect(useForceLayout.mock.calls.length).toBe(renders);
});

test('la pinça del trackpad (ctrl) seguix els dits i el zoom respecta els límits', () => {
  const { container } = render(<BrainGraph />);
  const canvas = container.querySelector('canvas');
  expect(rodeta(canvas, { deltaY: -10, ctrlKey: true }).defaultPrevented).toBe(true);
  buida();
  expect(vista().k).toBeCloseTo(Math.exp(0.1));

  // Un bot enorme (ctrl+rodeta d'un ratolí) es talla per esdeveniment.
  rodeta(canvas, { deltaY: 1000, ctrlKey: true });
  buida();
  expect(vista().k).toBeCloseTo(Math.exp(0.1 - 0.25));

  for (let i = 0; i < 80; i++) { rodeta(canvas, { deltaY: -500 }); if (i % 10 === 0) buida(); }
  buida();
  expect(vista().k).toBe(5);
  for (let i = 0; i < 80; i++) rodeta(canvas, { deltaY: 500 });
  buida();
  expect(vista().k).toBe(0.1);
});

test('la rodeta en línies (Firefox) es passa a píxels', () => {
  const { container } = render(<BrainGraph />);
  rodeta(container.querySelector('canvas'), { deltaY: 3, deltaMode: 1 });
  buida();
  expect(vista().k).toBeCloseTo(Math.exp(-3 * 16 * 0.002));
});

test('pinça amb dos dits: escala amb la distància i es mou amb el punt mitjà', () => {
  const onNodeClick = vi.fn();
  const { container } = render(<BrainGraph onNodeClick={onNodeClick} />);
  const canvas = container.querySelector('canvas');
  punter(canvas, 'pointerdown', 1, 100, 100);
  punter(canvas, 'pointerdown', 2, 200, 100);
  punter(canvas, 'pointermove', 2, 300, 100);
  buida();
  expect(vista()).toEqual({ x: -100, y: -100, k: 2 });
  // Alçar un dit no fa botar la vista ni compta com a clic.
  punter(canvas, 'pointerup', 2, 300, 100);
  punter(canvas, 'pointerup', 1, 100, 100);
  buida();
  expect(vista()).toEqual({ x: -100, y: -100, k: 2 });
  expect(onNodeClick).not.toHaveBeenCalled();
});

test('els botons de zoom no desfan la pausa de la simulació', () => {
  const { container } = render(<BrainGraph />);
  fireEvent.click(screen.getByTitle('Pausar simulació'));
  rodeta(container.querySelector('canvas'), { deltaY: 100 });
  fireEvent.click(screen.getByTitle('Apropar'));
  buida();
  expect(vista().k).toBeCloseTo(Math.exp(-0.2) * 1.3);
  expect(screen.getByTitle('Reprendre simulació')).toBeTruthy();
  expect(useForceLayout.mock.lastCall[0].isSimulationActive).toBe(false);
});

test('clic selecciona; arrossegar no selecciona', () => {
  const onNodeClick = vi.fn();
  const { container } = render(<BrainGraph onNodeClick={onNodeClick} />);
  const canvas = container.querySelector('canvas');
  fireEvent.pointerDown(canvas, { button: 0, clientX: 490, clientY: 300 });
  fireEvent.pointerUp(canvas, { clientX: 490, clientY: 300 });
  expect(onNodeClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'doc' }));
  onNodeClick.mockClear();
  fireEvent.pointerDown(canvas, { button: 0, clientX: 490, clientY: 300 });
  fireEvent.pointerMove(canvas, { clientX: 520, clientY: 300 });
  fireEvent.pointerUp(canvas, { clientX: 520, clientY: 300 });
  expect(onNodeClick).not.toHaveBeenCalled();
});

test('amb `enquadra`, el graf quiet s’enquadra sol fins que l’usuari el mou', () => {
  const { container } = render(<BrainGraph enquadra />);
  // Tres nodes en fila (x 350–490, y 300) en un canvas de 800 × 600: escala màxima 3.
  useForceLayout.mock.lastCall[0].onAssentat();
  buida();
  expect(vista()).toEqual({ x: 400 - 420 * 3, y: 300 - 300 * 3, k: 3 });

  rodeta(container.querySelector('canvas'), { deltaY: 100 });
  buida();
  const tocada = vista();
  useForceLayout.mock.lastCall[0].onAssentat();
  buida();
  expect(vista()).toEqual(tocada);
});

test('canviar el tema repinta, també incrustat en un shadow root', async () => {
  // L'app sola porta data-theme a l'<html>; <soc-de-poble>, a l'amfitrió.
  for (const incrustat of [false, true]) {
    const amfitrio = document.body.appendChild(document.createElement('div'));
    amfitrio.dataset.theme = 'light';
    const container = document.createElement('div');
    (incrustat ? amfitrio.attachShadow({ mode: 'closed' }) : amfitrio).appendChild(container);
    const { unmount } = render(<BrainGraph />, { container });
    const abans = pintats.length;
    await act(async () => { amfitrio.dataset.theme = 'dark'; });
    expect(pintats.length).toBeGreaterThan(abans);
    unmount();
    amfitrio.remove();
  }
});

/* T4 (ordre del Mestre, 260930) · selecció controlada i inspector opcional
   (l'Explorador de la Consola). Sense estos props, la Wiki no canvia. */
test('mode controlat: la selecció és de qui munta el graf, i el graf només l’avisa', () => {
  const onSeleccio = vi.fn();
  const { rerender } = render(<BrainGraph seleccio="cat" onSeleccio={onSeleccio} />);
  const select = screen.getByRole('combobox');
  expect(select.value).toBe('cat');
  expect(screen.getByText('Categoria', { selector: 'dd' })).toBeTruthy();
  // Triar al selector avisa, però no canvia res fins que el pare ho diu.
  fireEvent.change(select, { target: { value: 'doc' } });
  expect(onSeleccio).toHaveBeenCalledWith('doc');
  expect(screen.getByRole('combobox').value).toBe('cat');
  rerender(<BrainGraph seleccio="doc" onSeleccio={onSeleccio} />);
  expect(screen.getByRole('combobox').value).toBe('doc');
  expect(screen.getByText('Document', { selector: 'dd' })).toBeTruthy();
});

test('amb inspector={false} no hi ha panell, i el clic al canvas tria pel pare', () => {
  const onSeleccio = vi.fn();
  const onNodeClick = vi.fn();
  const { container } = render(<BrainGraph seleccio="" onSeleccio={onSeleccio} onNodeClick={onNodeClick} inspector={false} />);
  expect(container.querySelector('.sdp-brain-graph-inspector')).toBeNull();
  expect(screen.queryByRole('combobox')).toBeNull();
  const canvas = container.querySelector('canvas');
  fireEvent.pointerDown(canvas, { button: 0, clientX: 490, clientY: 300 });
  fireEvent.pointerUp(canvas, { clientX: 490, clientY: 300 });
  expect(onSeleccio).toHaveBeenCalledWith('doc');
  expect(onNodeClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'doc' }));
  // Un clic al buit desfà la tria, com a la Wiki.
  fireEvent.pointerDown(canvas, { button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(canvas, { clientX: 10, clientY: 10 });
  expect(onSeleccio).toHaveBeenLastCalledWith('');
  // Els controls del graf (zoom, pausa) hi continuen.
  expect(screen.getByTitle('Apropar')).toBeTruthy();
});

test('sense `seleccio`, el graf guarda la tria ell i també l’avisa', () => {
  const onSeleccio = vi.fn();
  render(<BrainGraph onSeleccio={onSeleccio} />);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'doc' } });
  expect(onSeleccio).toHaveBeenCalledWith('doc');
  expect(screen.getByRole('combobox').value).toBe('doc');
});

test('sense `enquadra` (la Wiki), la simulació quieta no mou la vista', () => {
  render(<BrainGraph />);
  useForceLayout.mock.lastCall[0].onAssentat();
  buida();
  expect(vista()).toEqual({ x: 0, y: 0, k: 1 });
});

test('un graf buit desactiva els controls i els recupera quan arriben nodes', () => {
  const { rerender } = render(<BrainGraph graf={{ nodes: [], links: [] }} inspector={false} />);
  const controls = () => within(screen.getByRole('group', { name: 'Controls del graf' })).getAllByRole('button');
  expect(controls()).toHaveLength(4);
  for (const button of controls()) expect(button.disabled).toBe(true);
  fireEvent.click(screen.getByTitle('Apropar'));
  buida();
  expect(vista().k).toBe(1);

  rerender(<BrainGraph graf={{ nodes: [{ id: 'nota', label: 'Olivera', type: 'document' }], links: [] }} inspector={false} />);
  for (const button of controls()) expect(button.disabled).toBe(false);
  fireEvent.click(screen.getByTitle('Apropar'));
  buida();
  expect(vista().k).toBeCloseTo(1.3);
});
