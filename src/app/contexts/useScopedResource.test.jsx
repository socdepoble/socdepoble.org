import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
vi.mock('../../host.js', () => ({ quanLlest: vi.fn(async () => undefined) }));
import { useScopedResource } from './useScopedResource.js';
afterEach(cleanup);
test('StrictMode arranca la càrrega i aïlla el primer render del nou àmbit', async () => {
  const config = {};
  let finish;
  const loader = vi.fn().mockResolvedValueOnce({ id: 'A' });
  const { result, rerender, unmount } = renderHook(({ scope }) => useScopedResource(loader, scope, scope, config), {
    initialProps: { scope: 'A' }, wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>
  });
  await waitFor(() => expect(result.current.payload).toEqual({ id: 'A' }));
  loader.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  rerender({ scope: 'B' });
  expect(result.current.payload).toBeNull();
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  const signal = loader.mock.calls[1][1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => finish({ id: 'B' }));
});
