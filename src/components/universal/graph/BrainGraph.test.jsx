import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import BrainGraph from './BrainGraph';
import useForceLayout from './useForceLayout';
vi.mock('../../../data/wikiManifest', () => ({ wikiManifest: {
  categories: [{ id: 'cat', label: 'Saber' }],
  items: [{ id: 'doc', title: 'Olivera', categoryId: 'cat', tags: ['poble'] }]
} }));
vi.mock('./useForceLayout', () => ({ default: vi.fn(({ nodes }) => ({ current: nodes.map((node, i) => ({ ...node, x: 350 + i * 70, y: 300 })) })) }));
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ setTransform() {} });
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
test('wheel cancel·lable i zoom mantenen la simulació pausada', () => {
  const { container } = render(<BrainGraph />);
  fireEvent.click(screen.getByTitle('Pausar simulació'));
  const event = new WheelEvent('wheel', { deltaY: 100, ctrlKey: true, cancelable: true, bubbles: true });
  fireEvent(container.querySelector('canvas'), event);
  expect(event.defaultPrevented).toBe(true);

  // Wheel sense ctrlKey no s'ha de cancel·lar
  const eventSenseCtrl = new WheelEvent('wheel', { deltaY: 100, cancelable: true, bubbles: true });
  fireEvent(container.querySelector('canvas'), eventSenseCtrl);
  expect(eventSenseCtrl.defaultPrevented).toBe(false);

  fireEvent.click(screen.getByTitle('Apropar'));
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
