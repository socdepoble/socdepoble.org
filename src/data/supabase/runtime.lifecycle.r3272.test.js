import { afterEach, expect, test, vi } from 'vitest';
import { request } from './runtime.js';

const CONFIG = { dataMode: 'remote', supabaseUrl: 'https://lifecycle.invalid', supabaseAnonKey: 'sb_publishable_lifecycle' };
const flush = async () => { for (let n = 0; n < 20; n++) await Promise.resolve(); };
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
test.each(['abort', 'timeout'])('the real runtime %s disposes its own timer/listener before an abort-ignoring fetch settles', async reason => {
  vi.useFakeTimers(); const controller = new AbortController(), active = new Set();
  const add = controller.signal.addEventListener.bind(controller.signal), remove = controller.signal.removeEventListener.bind(controller.signal);
  vi.spyOn(controller.signal, 'addEventListener').mockImplementation((event, callback, options) => { active.add(callback); add(event, callback, options); });
  vi.spyOn(controller.signal, 'removeEventListener').mockImplementation((event, callback, options) => { active.delete(callback); remove(event, callback, options); });
  let release, transportSignal; const gate = new Promise(resolve => { release = resolve; });
  const metadata = vi.fn(); vi.stubGlobal('fetch', vi.fn((_url, options) => { transportSignal = options.signal; return gate; }));
  const task = request('/rest/v1/fixture', CONFIG, { signal: controller.signal, timeoutMs: 10, anonim: true, onResponseMetadata: metadata }).then(value => ({ value }), error => ({ error }));
  await flush(); expect(active.size).toBe(1); expect(vi.getTimerCount()).toBe(1);
  if (reason === 'abort') controller.abort(); else await vi.advanceTimersByTimeAsync(10);
  try { expect(transportSignal.aborted).toBe(true); expect(active.size).toBe(0); expect(vi.getTimerCount()).toBe(0); }
  finally { release(new Response(JSON.stringify({ late: true }), { headers: { 'Content-Type': 'application/json' } })); await task; }
  expect((await task).error.name).toBe(reason === 'abort' ? 'AbortError' : 'TimeoutError');
  expect(metadata).not.toHaveBeenCalled(); expect(fetch).toHaveBeenCalledTimes(1);
});
test('direct runtime setup rolls back an abort listener whose registration then throws', async () => {
  vi.useFakeTimers(); const controller = new AbortController(), failure = new Error('Synthetic registration failure'), active = new Set();
  const add = controller.signal.addEventListener.bind(controller.signal), remove = controller.signal.removeEventListener.bind(controller.signal);
  vi.spyOn(controller.signal, 'addEventListener').mockImplementation((event, callback, options) => { active.add(callback); add(event, callback, options); throw failure; });
  vi.spyOn(controller.signal, 'removeEventListener').mockImplementation((event, callback, options) => { active.delete(callback); remove(event, callback, options); });
  vi.stubGlobal('fetch', vi.fn());
  await expect(request('/rest/v1/fixture', CONFIG, { signal: controller.signal, anonim: true })).rejects.toBe(failure);
  expect(active.size).toBe(0); expect(vi.getTimerCount()).toBe(0); expect(fetch).not.toHaveBeenCalled();
});
