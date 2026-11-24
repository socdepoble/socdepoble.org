import { createElement, StrictMode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CAPACITATS, CONTRACTE_NUCLI } from '../data/contracte.js';
import { destroy, setBackendImplementation } from '../data/backendPort.js';
import { estatPort } from '../data/backendPortEstat.js';
import { useResolvedAssetState } from './useResolvedAsset.js';
import { usePublicadorsRegistrats } from './usePublicadorsRegistrats.js';
import { useAra } from './useAra.js';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
let backend;
beforeEach(() => {
  backend = Object.fromEntries([...CONTRACTE_NUCLI, ...CAPACITATS.mitjans,
    ...CAPACITATS.copublicacio].map(name => [name, vi.fn()]));
});
afterEach(() => {
  cleanup(); destroy(); estatPort.currentImpl = null; estatPort.isLocked = false;
  vi.useRealTimers(); vi.restoreAllMocks();
});

// Cap mock del port ni dels hooks: els productors ignoren l'abort expressament.
test('recurs privat: canvi d’abast i finalització fora d’ordre no exposen la URL antiga', async () => {
  const old = deferred(), next = deferred();
  backend.resolveAsset.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
  setBackendImplementation(backend);
  const { result, rerender, unmount } = renderHook(({ scope }) =>
    useResolvedAssetState('sdp-media://mitjans/prova', { scopeKey: scope }),
  { initialProps: { scope: 'A' } });
  const first = backend.resolveAsset.mock.calls[0][1].signal;
  rerender({ scope: 'B' });
  const second = backend.resolveAsset.mock.calls[1][1].signal;
  expect(first.aborted).toBe(true); expect(second.aborted).toBe(false);
  expect(result.current.url).toBe('');
  await act(async () => next.resolve('https://fixture.invalid/B.png'));
  await act(async () => old.resolve('https://fixture.invalid/A.png'));
  expect(result.current).toMatchObject({ status: 'ready', url: 'https://fixture.invalid/B.png' });
  unmount(); expect(second.aborted).toBe(true);
});

test('cancel·lar i reintentar el recurs no permet que la promesa cancel·lada el republique', async () => {
  const old = deferred(), next = deferred();
  backend.resolveAsset.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
  setBackendImplementation(backend);
  const { result, unmount } = renderHook(() => useResolvedAssetState('sdp-media://mitjans/prova'));
  const first = backend.resolveAsset.mock.calls[0][1].signal;
  act(() => result.current.cancel());
  expect(first.aborted).toBe(true); expect(result.current.status).toBe('cancelled');
  act(() => result.current.retry());
  const second = backend.resolveAsset.mock.calls[1][1].signal;
  await act(async () => old.resolve('https://fixture.invalid/cancelled.png'));
  expect(result.current).toMatchObject({ status: 'loading', url: '' });
  unmount(); expect(second.aborted).toBe(true);
  await act(async () => next.resolve('https://fixture.invalid/unmounted.png'));
  expect(result.current.url).toBe('');
});

test('publicadors pel port real: canviar recurs avorta l’anterior i descarta una fallada tardana', async () => {
  const old = deferred(), next = deferred();
  backend.lligPublicadorsRegistrats.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
  setBackendImplementation(backend);
  const { result, rerender, unmount } = renderHook(({ id }) =>
    usePublicadorsRegistrats({ recursTipus: 'pagina', recursId: id }),
  { initialProps: { id: 'old' } });
  await act(async () => {});
  const first = backend.lligPublicadorsRegistrats.mock.calls[0][1].signal;
  rerender({ id: 'next' }); await act(async () => {});
  const second = backend.lligPublicadorsRegistrats.mock.calls[1][1].signal;
  expect(first.aborted).toBe(true); expect(result.current.dadesBarra).toBeNull();
  const publisher = { nom: 'Compte sintètic B', poble_nom: 'Poble B', avatar_url: null, slug_ruta: '/perfil/B' };
  await act(async () => next.resolve({ recursTipus: 'pagina', recursId: 'next', versio: 7,
    publicadorsRegistrats: [publisher], publicadorEfectiu: publisher }));
  await act(async () => old.reject(new Error('Fallada antiga.')));
  expect(result.current).toMatchObject({ recursId: 'next', versio: 7, fase: 'llest', error: null,
    dadesBarra: { authorName: 'Compte sintètic B' } });
  unmount(); expect(second.aborted).toBe(true);
});

test('StrictMode, desactivació i remuntatge netegen exactament els listeners de visibilitat i el timer', () => {
  vi.useFakeTimers();
  const added = vi.spyOn(document, 'addEventListener'), removed = vi.spyOn(document, 'removeEventListener');
  const wrapper = ({ children }) => createElement(StrictMode, null, children);
  let instant = 60001;
  const { result, rerender, unmount } = renderHook(({ active }) =>
    useAra({ actiu: active, rellotge: () => instant }),
  { initialProps: { active: true }, wrapper });
  expect(vi.getTimerCount()).toBe(1);
  // Canvi de rellotge abans de la pròxima activació, sense reinstal·lar cap efecte en bucle.
  instant = -120001;
  rerender({ active: false }); expect(vi.getTimerCount()).toBe(0);
  rerender({ active: true }); expect(result.current.getTime()).toBe(instant);
  expect(vi.getTimerCount()).toBe(1);
  unmount(); expect(vi.getTimerCount()).toBe(0);
  const listeners = added.mock.calls.filter(([type]) => type === 'visibilitychange');
  expect(listeners.length).toBeGreaterThan(1);
  for (const [, handler] of listeners) {
    expect(removed.mock.calls.filter(([type, fn]) => type === 'visibilitychange' && fn === handler)).toHaveLength(1);
  }
});
