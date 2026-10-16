import React, { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { UniversalWorkspace } from '../src/components/universal/workspace/UniversalWorkspace.jsx';
import { WorkspaceProvider, useWorkspace } from '../src/components/universal/workspace/WorkspaceContext.jsx';
import { useAppGrid } from '../src/components/layout/AppGridShell.jsx';
import * as folderStore from '../src/components/universal/workspace/carpetesVisibles.js';

let width, observers, subscribers, frames, nextFrameId, widthDescriptor;
beforeEach(() => {
  width = 375; observers = new Set(); subscribers = new Set(); frames = new Map(); nextFrameId = 0;
  widthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width });
  vi.stubGlobal('ResizeObserver', class {
    constructor(cb) { this.cb = cb; }
    observe() { observers.add(this); }
    disconnect() { observers.delete(this); }
  });
  vi.stubGlobal('requestAnimationFrame', cb => { const id = ++nextFrameId; frames.set(id, cb); return id; });
  vi.stubGlobal('cancelAnimationFrame', id => frames.delete(id));
  const subscribe = folderStore.subscriuCarpetesVisibles;
  vi.spyOn(folderStore, 'subscriuCarpetesVisibles').mockImplementation(listener => {
    subscribers.add(listener);
    const unsubscribe = subscribe(listener);
    return () => { subscribers.delete(listener); unsubscribe(); };
  });
  sessionStorage.clear(); localStorage.clear();
});
afterEach(() => {
  cleanup();
  if (widthDescriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', widthDescriptor);
  else delete HTMLElement.prototype.clientWidth;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const flushFrame = () => act(() => { const batch = [...frames.values()]; frames.clear(); batch.forEach(cb => cb(0)); });
const model = {
  status: 'ready', itemsComplete: true,
  categories: [{ id: 'c', label: 'Carpeta' }],
  items: [{ id: 'a', title: 'Nota A', categoryIds: ['c'] }]
};
function Detail() {
  const { obriPanell } = useAppGrid();
  return <><input aria-label="Editor" /><button onClick={() => obriPanell('middle')}>Tornar ràpid</button></>;
}
function instance(props = {}) { return <UniversalWorkspace model={model} initialSelection={{ categoryId: 'c', itemId: 'a' }} mestreDetall="detall" renderDetail={() => <Detail />} {...props} />; }

test('100 StrictMode mount/unmount cycles dispose every ResizeObserver and folder subscription', () => {
  for (let n = 0; n < 100; n++) {
    const mounted = render(<StrictMode>{instance()}</StrictMode>);
    expect(observers.size).toBe(1);
    expect(subscribers.size).toBe(1);
    mounted.unmount();
    expect(observers.size).toBe(0);
    expect(subscribers.size).toBe(0);
  }
});

test('delayed layout focus preserves a newer focus inside the editor', () => {
  render(instance());
  fireEvent.click(screen.getByRole('button', { name: 'Tornar ràpid' }));
  fireEvent.click(screen.getByRole('button', { name: 'Nota A' }));
  const editor = screen.getByRole('textbox', { name: 'Editor' });
  editor.focus();
  expect(document.activeElement).toBe(editor);
  expect(frames.size).toBeGreaterThan(0);
  flushFrame(); flushFrame();
  expect(document.activeElement).toBe(editor);
});

test.each([0, 1])('unmount cancels pending layout focus after %i frames', (elapsedFrames) => {
  const mounted = render(instance());
  fireEvent.click(screen.getByRole('button', { name: 'Tornar ràpid' }));
  fireEvent.click(screen.getByRole('button', { name: 'Nota A' }));
  if (elapsedFrames) flushFrame();
  expect(frames.size).toBeGreaterThan(0);
  mounted.unmount();
  expect(frames.size).toBe(0);
  expect(observers.size).toBe(0);
});

test('a newer navigation request replaces the previous pending focus', () => {
  const { container } = render(instance({ mestreDetall: 'navegacio' }));
  fireEvent.click(screen.getByRole('button', { name: 'Carpeta' }));
  expect(frames.size).toBe(1);
  flushFrame();
  fireEvent.click(screen.getByRole('button', { name: 'Nota A' }));
  expect(frames.size).toBe(1);
  flushFrame(); flushFrame();
  expect(frames.size).toBe(0);
  expect(document.activeElement).toBe(container.querySelector('.sdp-workspace-detail'));
});

test('delayed focus preserves editor focus inside a closed host shadow root', () => {
  const host = document.createElement('soc-de-poble');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const container = document.createElement('div');
  shadow.append(container);
  const mounted = render(instance(), { container, baseElement: container });
  try {
    const local = within(container);
    fireEvent.click(local.getByRole('button', { name: 'Tornar ràpid' }));
    fireEvent.click(local.getByRole('button', { name: 'Nota A' }));
    const editor = local.getByRole('textbox', { name: 'Editor' });
    editor.focus();
    expect(document.activeElement).toBe(host);
    flushFrame(); flushFrame();
    expect(shadow.activeElement).toBe(editor);
  } finally {
    mounted.unmount();
    host.remove();
  }
});

test('resolver pending requests abort on change and unmount, stale results are ignored', async () => {
  const pending = [];
  const resolveItemId = (id, { signal }) => new Promise(resolve => pending.push({ id, signal, resolve }));
  function Probe() { const w = useWorkspace(); return <span data-testid="resolution">{w.itemResolution.id}:{w.itemResolution.status}</span>; }
  const props = { categories: [], items: [], resolveItemId, itemsComplete: false };
  const mounted = render(<WorkspaceProvider {...props} selection={{ itemId: 'a' }}><Probe /></WorkspaceProvider>);
  expect(pending).toHaveLength(1);
  mounted.rerender(<WorkspaceProvider {...props} selection={{ itemId: 'b' }}><Probe /></WorkspaceProvider>);
  expect(pending[0].signal.aborted).toBe(true);
  expect(pending.at(-1).id).toBe('b');
  await act(async () => pending[0].resolve({ status: 'not-found' }));
  expect(screen.getByTestId('resolution').textContent).toBe('b:loading');
  mounted.unmount();
  expect(pending.every(p => p.signal.aborted)).toBe(true);
});
