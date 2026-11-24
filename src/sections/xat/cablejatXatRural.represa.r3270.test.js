import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { creaCablejatXatRural } from './cablejatXatRural.js';
import { creaCuaSincronitzacioRural, construeixAmbitCuaRural } from '../../data/xat/estatSincronitzacioRural.js';
import { backendScope } from '../../config/backendConfig.js';

const session = vi.hoisted(() => ({ entry: 1 }));
vi.mock('../../data/identitat.js', async original => ({ ...await original(), entradaSessio: () => session.entry }));
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const FIL = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CONFIG = Object.freeze({ dataMode: 'remote', backendUrl: 'https://fixture.invalid', tenantId: null });
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const instances = [], controllers = [];
const control = () => { const c = new AbortController(); controllers.push(c); return c; };
function environment() {
  let token = { ambit: 'persona-A', jo: A, actor: null, config: CONFIG };
  let operation = { token, llinatge: {}, controller: control() };
  const effects = new Set();
  const transport = vi.fn(async (_fil, payload) => { effects.add(payload.id); return { id: payload.id, seq: 11 }; });
  const wire = creaCablejatXatRural({ obteToken: () => token, obteOperacio: () => operation, enviaMissatge: transport, refreshSession: vi.fn(async () => true) });
  instances.push(wire);
  return { wire, transport, effects, origin: operation,
    rotate(id = B) {
      const previous = operation; session.entry++;
      token = { ...token, jo: id, ambit: id ? `persona-${id}` : 'none' };
      operation = { token, llinatge: {}, controller: control() };
      previous.controller.abort(); wire.revalida();
    },
    send: origin => wire.envia(origin || operation, FIL, { id: ID, text: 'Exactly once' }, CONFIG),
  };
}
function track(target) {
  const add = vi.spyOn(target, 'addEventListener'), remove = vi.spyOn(target, 'removeEventListener');
  return () => {
    const interesting = target === window ? ['online'] : ['visibilitychange', 'resume', 'abort'];
    for (const [name, listener] of add.mock.calls.filter(([name]) => interesting.includes(name))) {
      expect(remove.mock.calls.some(([n, fn]) => n === name && fn === listener), `cleanup ${name}`).toBe(true);
    }
  };
}
beforeEach(() => { session.entry = 1; });
afterEach(async () => {
  for (const c of controllers.splice(0)) c.abort();
  for (const instance of instances.splice(0)) instance.tanca();
  await flush(); vi.restoreAllMocks(); delete document.hidden;
});

test('native resume settles the actual offline waiter without asserting delivery', async () => {
  const e = environment(), c = control();
  const pending = e.wire.esperaXarxa(c.signal);
  document.dispatchEvent(new Event('resume'));
  expect(await pending).toBe(true); expect(e.transport).not.toHaveBeenCalled();
});

test('native resume wakes even if the WebView has not yet changed document.hidden', async () => {
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  const e = environment(), c = control(); const pending = e.wire.esperaXarxa(c.signal);
  document.dispatchEvent(new Event('visibilitychange')); let settled = false; pending.then(() => { settled = true; }); await flush();
  expect(settled).toBe(false); document.dispatchEvent(new Event('resume')); expect(await pending).toBe(true);
});

for (const event of ['resume', 'online', 'visibilitychange']) test(`successful ${event} removes every listener`, async () => {
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  const e = environment(), c = control(); const checkWindow = track(window), checkDocument = track(document), checkSignal = track(c.signal);
  const pending = e.wire.esperaXarxa(c.signal);
  (event === 'online' ? window : document).dispatchEvent(new Event(event));
  expect(await pending).toBe(true); checkWindow(); checkDocument(); checkSignal();
});

test('an already aborted owner installs no listeners and never sends', async () => {
  const e = environment(), c = control(); c.abort();
  const addWindow = vi.spyOn(window, 'addEventListener'), addDocument = vi.spyOn(document, 'addEventListener');
  expect(await e.wire.esperaXarxa(c.signal)).toBe(false);
  expect(addWindow).not.toHaveBeenCalled(); expect(addDocument).not.toHaveBeenCalled(); expect(e.transport).not.toHaveBeenCalled();
});

test('abort during the wait removes resume, visibility, online and abort listeners', async () => {
  const e = environment(), c = control(); const checks = [track(window), track(document), track(c.signal)];
  const pending = e.wire.esperaXarxa(c.signal); c.abort(); expect(await pending).toBe(false);
  for (const check of checks) check(); document.dispatchEvent(new Event('resume')); expect(e.transport).not.toHaveBeenCalled();
});

test('overlapping foreground events drain the actual queue once with one UUID and a strict ACK', async () => {
  const e = environment(), c = control();
  const ambit = construeixAmbitCuaRural({ backend: backendScope(CONFIG), tenantId: null, usuariId: A, actorOrgId: null });
  const queue = creaCuaSincronitzacioRural({ ambitInicial: ambit });
  await queue.encua({ filId: FIL, client_msg_id: ID, text: 'Exactly once' });
  let wakes = 0;
  const pending = e.wire.esperaXarxa(c.signal).then(async allowed => {
    if (!allowed) return [];
    wakes++;
    return queue.drenaPendents((_fil, payload) => e.wire.envia(e.origin, FIL, payload, CONFIG).then(result => result.desat));
  });
  document.dispatchEvent(new Event('resume')); window.dispatchEvent(new Event('online')); document.dispatchEvent(new Event('resume'));
  expect((await pending)[0].ok).toBe(true);
  await queue.drenaPendents((_fil, payload) => e.wire.envia(e.origin, FIL, payload, CONFIG).then(result => result.desat));
  expect(wakes).toBe(1); expect(e.transport).toHaveBeenCalledTimes(1); expect(e.effects.size).toBe(1);
  expect(e.transport.mock.calls[0][1]).toMatchObject({ id: ID, client_msg_id: ID, text: 'Exactly once' });
  expect(queue.llistaMissatges()[0]).toMatchObject({ estat: 'enviat_servidor', client_msg_id: ID, seq: 11 });
});

for (const id of [null, B, A]) test(`logout/switch/reentry (${id}) cancels the old waiter before a resume`, async () => {
  const e = environment();
  const pending = e.wire.esperaXarxa(e.origin.controller.signal).then(allowed => allowed ? e.send(e.origin) : null);
  e.rotate(id); document.dispatchEvent(new Event('resume'));
  expect(await pending).toBeNull(); expect(e.transport).not.toHaveBeenCalled();
  await expect(e.send(e.origin)).rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA' });
});

test('teardown cancels the explicit owner before closing the wiring and cannot replay on resume', async () => {
  const e = environment();
  const pending = e.wire.esperaXarxa(e.origin.controller.signal).then(allowed => allowed ? e.send(e.origin) : null);
  e.origin.controller.abort(); e.wire.tanca(); document.dispatchEvent(new Event('resume'));
  expect(await pending).toBeNull(); expect(e.transport).not.toHaveBeenCalled(); expect(e.effects.size).toBe(0);
});
