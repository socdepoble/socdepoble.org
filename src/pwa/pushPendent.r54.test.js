// @vitest-environment node
import fs from 'node:fs';
import vm from 'node:vm';
import { expect, test, vi } from 'vitest';
const source = fs.readFileSync('public/sw.js', 'utf8');
let instances = 0;
function worker(setAppBadge = vi.fn(async () => {})) {
  const handlers = new Map();
  const showNotification = vi.fn(async () => {});
  const fetch = vi.fn(() => { throw Error('No network expected'); });
  const prefix = ++instances;
  let sequence = 0;
  const clearAppBadge = vi.fn(async () => {});
  const self = { crypto: { randomUUID: () => `${prefix}-${++sequence}` }, location: { origin: 'https://example.test' }, navigator: { languages: ['ca'], setAppBadge, clearAppBadge }, registration: { showNotification }, clients: {}, addEventListener: (name, fn) => handlers.set(name, fn) };
  vm.runInNewContext(source, { self, URL, Request, Response, Headers, fetch, caches: {} });
  return { async wake() {
    let pending;
    handlers.get('push')({ get data() { throw Error('Blind wake must never inspect payload'); }, waitUntil: p => { pending = p; } });
    await pending;
  }, async message(data, url = 'https://example.test/mur') {
    let response;
    const pending = [];
    handlers.get('message')({ data, source: { url, postMessage: value => { response = value; } }, waitUntil: value => pending.push(value) });
    await Promise.all(pending);
    return response;
  }, setAppBadge, clearAppBadge, showNotification, fetch, self };
}
test('cada wake cec posa pendent genèric, mai un increment ni un recompte', async () => {
  const w = worker();
  await w.wake(); await w.wake();
  expect(w.setAppBadge.mock.calls).toEqual([[], []]);
  expect(w.showNotification).toHaveBeenCalledTimes(2);
  expect(w.showNotification.mock.calls[0][1].data).toEqual({ cami: '/xat?obri=no-llegits' });
  expect(w.fetch).not.toHaveBeenCalled();
});
test('una insígnia denegada no impedix l’avís visible', async () => {
  const w = worker(vi.fn(async () => { throw Error('denied'); }));
  await expect(w.wake()).resolves.toBeUndefined();
  expect(w.showNotification).toHaveBeenCalledTimes(1);
});
test('sense API de badging continua mostrant l’avís cec', async () => {
  const w = worker(null);
  await w.wake();
  expect(w.showNotification).toHaveBeenCalledTimes(1);
});
test('un zero d’una lectura anterior al wake o d’un worker anterior no neteja el pendent nou', async () => {
  const w = worker();
  const before = await w.message({ tipus: 'sdp-badge-token' });
  await w.wake();
  await w.message({ tipus: 'sdp-badge-zero', token: before.token });
  expect(w.clearAppBadge).not.toHaveBeenCalled();
  const after = await w.message({ tipus: 'sdp-badge-token' });
  await w.message({ tipus: 'sdp-badge-zero', token: after.token });
  expect(w.clearAppBadge).toHaveBeenCalledTimes(1);
  const reopened = worker();
  await reopened.message({ tipus: 'sdp-badge-token' });
  await reopened.message({ tipus: 'sdp-badge-zero', token: after.token });
  expect(reopened.clearAppBadge).not.toHaveBeenCalled();
});
test('un wake durant la lectura dels avisos invalida el zero abans de tancar-los', async () => {
  const w = worker();
  await w.wake();
  const { token } = await w.message({ tipus: 'sdp-badge-token' });
  let resolve;
  const close = vi.fn();
  w.self.registration.getNotifications = vi.fn(() => new Promise(done => { resolve = done; }));
  const zero = w.message({ tipus: 'sdp-badge-zero', token });
  await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
  const next = w.wake();
  resolve([{ tag: 'sdp-xat', close }]);
  await Promise.all([zero, next]);
  expect(close).not.toHaveBeenCalled();
  expect(w.clearAppBadge).not.toHaveBeenCalled();
});
