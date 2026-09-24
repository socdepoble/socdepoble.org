import React from 'react';
import { act, cleanup, render, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useSearchParams } from '../app/contexts/RouterContext.jsx';
import { useResolvedAssetState } from './useResolvedAsset.js';
import useForceLayout from '../components/universal/graph/useForceLayout.js';
import { WorkspaceProvider, useWorkspace } from '../components/universal/workspace/WorkspaceContext.jsx';
vi.mock('../data/backendPort.js', () => ({ resolveAsset: vi.fn(), teCapacitat: () => true }));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('aplica modificacions successives als paràmetres vigents de la mateixa ruta', () => {
  let params, setParams;
  function Probe() { [params, setParams] = useSearchParams(); return null; }
  render(<MemoryRouter><Probe /></MemoryRouter>);
  act(() => setParams({ a: '1' }));
  act(() => setParams({ b: '2' }));
  expect(params.toString()).toBe('a=1&b=2');
  act(() => setParams({ a: null }));
  expect(params.toString()).toBe('b=2');
});

it('canviar scope del mateix recurs aborta i descarta el resultat anterior', async () => {
  const a = deferred(), b = deferred();
  const resolver = vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const { result, rerender } = renderHook(({ scopeKey }) => useResolvedAssetState('sdp-media://asset', { scopeKey, resolver }), { initialProps: { scopeKey: 'A' } });
  const signalA = resolver.mock.calls[0][1].signal;
  rerender({ scopeKey: 'B' });
  expect(signalA.aborted).toBe(true); expect(result.current.url).toBe('');
  await act(async () => a.resolve('https://example.test/private-A.png'));
  expect(result.current.url).toBe('');
  await act(async () => b.resolve('https://example.test/B.png'));
  expect(result.current.url).toBe('https://example.test/B.png');
});

it('retry conserva la invalidació del token encara que ref i scope siguen iguals', async () => {
  const resolver = vi.fn().mockResolvedValueOnce('https://example.test/v1.png').mockResolvedValueOnce('https://example.test/v2.png');
  const { result } = renderHook(() => useResolvedAssetState('sdp-media://asset', { scopeKey: 'A', resolver }));
  await waitFor(() => expect(result.current.url).toBe('https://example.test/v1.png'));
  await act(async () => result.current.retry());
  expect(resolver).toHaveBeenCalledTimes(2); expect(result.current.url).toBe('https://example.test/v2.png');
});

it('canviar onTick actualitza el callback sense reiniciar la simulació', () => {
  let frame;
  const raf = vi.fn(callback => { frame = callback; return 1; });
  const cancel = vi.fn(); vi.stubGlobal('requestAnimationFrame', raf); vi.stubGlobal('cancelAnimationFrame', cancel);
  const nodes = [{ id: 'n', x: 100, y: 100 }], links = [], first = vi.fn(), next = vi.fn();
  const { rerender } = renderHook(({ onTick }) => useForceLayout({ nodes, links, width: 200, height: 200, isSimulationActive: true, onTick }), { initialProps: { onTick: first } });
  rerender({ onTick: next });
  expect(raf).toHaveBeenCalledTimes(1); expect(cancel).not.toHaveBeenCalled();
  act(() => frame());
  expect(first).not.toHaveBeenCalled(); expect(next).toHaveBeenCalledTimes(1);
});

it('Workspace canvia generació de resolució i descarta la resolució anterior', async () => {
  let workspace;
  function Probe() { workspace = useWorkspace(); return null; }
  const a = deferred(), b = deferred();
  const resolver = vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const items = [], categories = [], selection = { categoryId: '__all__', itemId: 'doc' };
  const tree = resolutionKey => <WorkspaceProvider categories={categories} items={items} selection={selection} resolveItemId={resolver} resolutionKey={resolutionKey}><Probe /></WorkspaceProvider>;
  const { rerender } = render(tree('A'));
  await waitFor(() => expect(resolver).toHaveBeenCalledTimes(1));
  const signal = resolver.mock.calls[0][1].signal;
  rerender(tree('B'));
  expect(signal.aborted).toBe(true);
  await act(async () => a.resolve({ status: 'not-found' }));
  expect(workspace.itemResolution.status).toBe('loading');
  await act(async () => b.resolve({ status: 'found' }));
  expect(workspace.itemResolution.status).toBe('found');
});
