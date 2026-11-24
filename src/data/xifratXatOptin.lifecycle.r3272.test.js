import { expect, test } from 'vitest';
import { creaMagatzemOptinXat } from './xifratXatOptin.js';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';

const ci = actor => JSON.stringify(['origin', actor, 'scope']);
function channels(owner, active) {
  return class { constructor() { this.owner = owner; active.add(this); } postMessage() {} unref() {} close() { active.delete(this); } };
}
// Only the IDB completion boundary is controlled. Store/transaction code is real.
function closeOnWriteCommit(idb, close) {
  return { open(...args) {
    const request = idb.open(...args); let success;
    Object.defineProperty(request, 'onsuccess', { configurable: true, get: () => success, set(fn) {
      success = function (...event) {
        const db = request.result, transaction = db.transaction.bind(db);
        db.transaction = (...options) => {
          const tx = transaction(...options);
          if (options[1] === 'readwrite') { let complete; Object.defineProperty(tx, 'oncomplete', {
            configurable: true, get: () => function (...evt) { close(); return complete?.apply(this, evt); }, set(callback) { complete = callback; }
          }); }
          return tx;
        };
        return fn.apply(this, event);
      };
    } }); return request;
  } };
}
test('normal opt-in factory owns one BroadcastChannel, stays usable and closes idempotently', async () => {
  const idb = creaIdbFalsEstructurat(), active = new Set();
  const store = creaMagatzemOptinXat({ idb, navegador: {}, Canal: channels('A', active), ara: () => 1000 });
  try {
    await store.activa(ci('A'), 'one', 'key'); expect(active.size).toBe(1);
    expect(await store.llegix(ci('A'), 'one', { kid: 'key' })).toMatchObject({ actiu: true });
    await store.revoca(ci('A'), 'one'); expect(active.size).toBe(1);
    expect(await store.llegix(ci('A'), 'one', { kid: 'key' })).toMatchObject({ actiu: false });
  } finally { store.tanca(); store.tanca(); }
  expect(active.size).toBe(0); expect(idb.connexions('sdp-xat-optin-v1')).toHaveLength(0);
  await expect(store.llegix(ci('A'), 'one', { kid: 'key' })).rejects.toMatchObject({ codi: 'opt-in-tancat' });
});
test('closing A at an IDB commit drains multiple pending calls without retaining channels or closing B', async () => {
  const idb = creaIdbFalsEstructurat(), active = new Set(); let a, closed = false;
  const hooked = closeOnWriteCommit(idb, () => { if (!closed) { closed = true; a.tanca(); } });
  a = creaMagatzemOptinXat({ idb: hooked, navegador: {}, Canal: channels('A', active), ara: () => 1000 });
  const b = creaMagatzemOptinXat({ idb, navegador: {}, Canal: channels('B', active), ara: () => 1000 });
  try {
    const pending = [a.activa(ci('A'), 'one', 'key'), a.activa(ci('A'), 'two', 'key')];
    const outcomes = await Promise.allSettled(pending);
    expect(closed).toBe(true); expect(outcomes.every(x => x.status === 'rejected')).toBe(true);
    expect(outcomes.map(x => x.reason.codi)).toEqual(expect.arrayContaining(['opt-in-tancat', 'TANCAT']));
    // A commit may already have happened; rejection is not a rollback claim.
    expect(idb.files('sdp-xat-optin-v1', 'fils').some(x => x.valor.ci === ci('A'))).toBe(true);
    expect([...active].filter(x => x.owner === 'A')).toHaveLength(0);
    await b.activa(ci('B'), 'one', 'key'); expect(await b.llegix(ci('B'), 'one', { kid: 'key' })).toMatchObject({ actiu: true });
    a.tanca(); expect([...active].filter(x => x.owner === 'B')).toHaveLength(1);
  } finally { a.tanca(); b.tanca(); }
  expect(active.size).toBe(0); expect(idb.connexions('sdp-xat-optin-v1')).toHaveLength(0);
});
