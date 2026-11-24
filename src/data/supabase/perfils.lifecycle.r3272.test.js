import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { loadPerfilPublic } from './perfils.js';

const CONFIG = Object.freeze({ dataMode: 'remote', supabaseUrl: 'https://lifecycle.invalid', supabaseAnonKey: 'sb_publishable_lifecycle' });
const ORG = '33333333-3333-4333-8333-333333333333';
const row = { id: ORG, slug: 'fixture', name: 'Fixture', kind: 'company' };
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
const flush = async () => { for (let n = 0; n < 30; n++) await Promise.resolve(); };
const response = () => new Response(JSON.stringify([row]), { headers: { 'Content-Type': 'application/json' } });
function watchedSignal() {
  const controller = new AbortController(), active = new Set();
  const add = controller.signal.addEventListener.bind(controller.signal), remove = controller.signal.removeEventListener.bind(controller.signal);
  vi.spyOn(controller.signal, 'addEventListener').mockImplementation((name, callback, options) => { if (name === 'abort') active.add(callback); add(name, callback, options); });
  vi.spyOn(controller.signal, 'removeEventListener').mockImplementation((name, callback, options) => { if (name === 'abort') active.delete(callback); remove(name, callback, options); });
  return { controller, active, add };
}
beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('fetch', vi.fn(() => { throw Error('Unexpected transport'); })); });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('profile setup rolls back a genuine listener installed by an addEventListener that then throws', async () => {
  const { controller, active, add } = watchedSignal(), failure = new DOMException('Fixture registration failure', 'SecurityError');
  controller.signal.addEventListener.mockImplementation((name, callback, options) => { active.add(callback); add(name, callback, options); throw failure; });
  await expect(loadPerfilPublic('fixture', { ...CONFIG, signal: controller.signal })).rejects.toBe(failure);
  expect(fetch).not.toHaveBeenCalled(); expect(active.size).toBe(0); expect(vi.getTimerCount()).toBe(0);
});
test('invalid profile signal cannot leave a deadline timer behind or start a transport', async () => {
  await expect(loadPerfilPublic('fixture', { ...CONFIG, signal: {} })).rejects.toBeInstanceOf(TypeError);
  expect(fetch).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
});
test('successful real runtime response removes the external listener and both request timers', async () => {
  const { controller, active } = watchedSignal(); fetch.mockResolvedValue(response());
  expect(await loadPerfilPublic('fixture', { ...CONFIG, signal: controller.signal })).toMatchObject({ id: ORG, nom: 'Fixture' });
  expect(fetch).toHaveBeenCalledTimes(1); expect(active.size).toBe(0); expect(vi.getTimerCount()).toBe(0);
  controller.abort(); await flush(); expect(fetch).toHaveBeenCalledTimes(1);
});
test.each(['abort', 'timeout'])('pending profile %s disposes resources and ignores a late successful Response', async reason => {
  const { controller, active } = watchedSignal(), gate = deferred(); let transportSignal, settled = 0;
  fetch.mockImplementation((_url, options) => { transportSignal = options.signal; return gate.promise; });
  const task = loadPerfilPublic('fixture', { ...CONFIG, signal: controller.signal, terminiMs: 25 }).then(
    value => { settled++; return { value }; }, error => { settled++; return { error }; });
  await flush(); expect(fetch).toHaveBeenCalledTimes(1); expect(active.size).toBe(1);
  if (reason === 'abort') controller.abort(); else await vi.advanceTimersByTimeAsync(25);
  expect((await task).error.name).toBe(reason === 'abort' ? 'AbortError' : 'TimeoutError');
  expect(transportSignal.aborted).toBe(true); expect(active.size).toBe(0); expect(vi.getTimerCount()).toBe(0);
  gate.resolve(response()); await flush(); expect(settled).toBe(1); expect(vi.getTimerCount()).toBe(0);
});
