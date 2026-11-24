import vm from 'node:vm';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
import { buildSync } from 'esbuild';
const bundles = new Map();
export function laboratoriRevisions() {
  const root = path.resolve(process.env.SDP_EDITORIAL_SOURCE_ROOT || process.cwd());
  if (!bundles.has(root)) bundles.set(root, buildSync({ stdin: { contents: `export * from ${JSON.stringify(path.join(root, 'src/data/revisionsEditorialsDelNavegador.js'))};export * from ${JSON.stringify(path.join(root, 'src/data/historialRevisionsEditorials.js'))};`, resolveDir: root }, bundle: true, write: false, format: 'iife', globalName: 'API', platform: 'browser', target: 'es2022' }).outputFiles[0].text);
  const disk = new Map(), realms = []; let hook = null, beforeSet = null, quota = false, drop = false, historyQuota = false, historyReceiptFailure = false, deniedReceipt = null;
  const main = 'sdp_embed_publicacions.revisions.v1';
  function realm({ crypto = webcrypto, Date: Clock } = {}) {
    const listeners = new Set();
    const storage = { get length() { return disk.size; }, key: i => [...disk.keys()][i] ?? null,
      getItem(key) { if (key === deniedReceipt) { deniedReceipt = null; throw new DOMException('Read denied', 'SecurityError'); } const raw = disk.get(key) ?? null; if (key === main && hook) { const callback = hook; hook = null; callback(); } return raw; },
      setItem(key, value) { if (key.includes('.ops.v1.') && beforeSet) { const callback = beforeSet; beforeSet = null; callback(); } if (quota || historyQuota && key.includes('.histops.v1.')) throw new DOMException('Quota', 'QuotaExceededError'); if (!drop) disk.set(key, String(value)); if (historyReceiptFailure && key.includes('.histops.v1.')) { historyReceiptFailure = false; deniedReceipt = key; } },
      removeItem(key) { if (quota) throw new DOMException('Quota', 'QuotaExceededError'); disk.delete(key); } };
    const context = vm.createContext({ console, DOMException, crypto, ...(Clock ? { Date: Clock } : {}), structuredClone, TextEncoder, TextDecoder, navigator: {},
      localStorage: storage, sessionStorage: { getItem: () => null },
      addEventListener: (name, fn) => { if (name === 'storage') listeners.add(fn); }, removeEventListener: (_name, fn) => listeners.delete(fn) });
    context.window = context; context.globalThis = context;
    vm.runInContext(bundles.get(root), context, { timeout: 3000 });
    const result = { api: context.API, context, event: key => { for (const fn of listeners) fn({ key }); }, close: () => listeners.clear() };
    realms.push(result); return result;
  }
  return { disk, main, realm, interleave: fn => { hook = fn; }, beforeCommit: fn => { beforeSet = fn; }, quota: value => { quota = value; }, drop: value => { drop = value; }, historyQuota: value => { historyQuota = value; }, failHistoryReceipt: () => { historyReceiptFailure = true; }, close: () => realms.forEach(r => r.close()) };
}
export const plain = value => value == null ? value : JSON.parse(JSON.stringify(value));
export function registraCasosJournal(test, assert) {
  const run = (name, operation) => test(name, async () => { const lab = laboratoriRevisions(); try { await operation(lab); } finally { lab.close(); } });
  run('two actual independent realms preserve disjoint fields across a forced stale v1 read', lab => {
    const a = lab.realm().api, b = lab.realm().api;
    a.desaRevisioEditorial('mur', 'one', { title: 'Initial' });
    lab.interleave(() => b.desaRevisioEditorial('mur', 'one', { lead: 'B' }));
    assert.equal(a.desaRevisioEditorial('mur', 'one', { title: 'A' }), true);
    assert.deepEqual(plain(lab.realm().api.revisioEditorial('mur', 'one')), { title: 'A', lead: 'B' });
    assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:one')), true);
  });
  run('restoring original in a stale realm preserves another durable piece', lab => {
    const a = lab.realm().api, b = lab.realm().api;
    a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'A' });
    b.desaRevisioEditorial('mur', 'two', { title: 'B' });
    assert.equal(a.restauraVersioEditorial('mur', 'one', 0).restaurada, true);
    const c = lab.realm().api; assert.equal(c.revisioEditorial('mur', 'one'), null);
    assert.deepEqual(plain(c.revisioEditorial('mur', 'two')), { title: 'B' });
  });
  run('primed independent history caches retain both later append operations', lab => {
    const a = lab.realm().api, b = lab.realm().api;
    a.historialRevisionsEditorials('mur', 'one'); b.historialRevisionsEditorials('mur', 'one');
    a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'A' });
    b.desaRevisioEditorialAmbHistorial('mur', 'one', { lead: 'B' });
    const list = lab.realm().api.historialRevisionsEditorials('mur', 'one');
    assert.equal(list.length, 2); assert.equal(new Set(list.map(r => r.versio)).size, 2);
  });
  run('storage quota keeps the accepted RAM overlay but cannot create a durable receipt', lab => {
    const a = lab.realm().api; lab.quota(true);
    assert.equal(a.desaRevisioEditorial('mur', 'one', { title: 'RAM' }), true);
    assert.deepEqual(plain(a.revisioEditorial('mur', 'one')), { title: 'RAM' });
    assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:one')), false);
    assert.equal(lab.realm().api.revisioEditorial('mur', 'one'), null);
  });
  run('a corrupt v1 retains its raw bytes and rejects any new durable receipt', lab => {
    const raw = '{"mur:old":{"camps":{"title":"Old"}},"mur:bad":null}'; lab.disk.set(lab.main, raw);
    const a = lab.realm().api; a.desaRevisioEditorial('mur', 'one', { title: 'RAM' });
    assert.equal(lab.disk.get(lab.main), raw); assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:one')), false);
    assert.deepEqual(plain(a.revisioEditorial('mur', 'old')), { title: 'Old' });
  });
  run('a dropped journal write cannot produce a durable receipt', lab => {
    const a = lab.realm().api; lab.drop(true);
    assert.equal(a.desaRevisioEditorial('mur', 'one', { title: 'RAM' }), true);
    assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:one')), false);
    assert.equal(lab.disk.size, 0);
  });
  run('unavailable or duplicate UUID never overwrites an operation or certifies later RAM', lab => {
    const id = '00000000-0000-4000-8000-000000000001';
    const a = lab.realm({ crypto: { randomUUID: () => id } }).api;
    a.desaRevisioEditorial('mur', 'one', { title: 'First' });
    const key = [...lab.disk.keys()].find(k => k.includes('.ops.v1.')), raw = lab.disk.get(key);
    a.desaRevisioEditorial('mur', 'one', { title: 'Collision' });
    assert.equal(lab.disk.get(key), raw); assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:one')), false);
    const b = lab.realm({ crypto: {} }).api; b.desaRevisioEditorial('mur', 'two', { title: 'No UUID' });
    assert.equal(b.revisioPersistida(b.carregaMapa().get('mur:two')), false);
    const c = lab.realm().api; assert.deepEqual(plain(c.revisioEditorial('mur', 'one')), { title: 'First' });
    assert.equal(c.revisioEditorial('mur', 'two'), null);
  });
  run('tombstone and later recreation survive clock rollback without resurrecting old fields', lab => {
    const a = lab.realm().api; a.desaRevisioEditorial('mur', 'one', { title: 'Old', lead: 'Gone' });
    assert.equal(a.oblidaRevisioEditorial('mur', 'one'), true);
    class Past extends Date { constructor() { super('1990-01-01T00:00:00Z'); } }
    const b = lab.realm({ Date: Past }).api; b.desaRevisioEditorial('mur', 'one', { title: 'New' });
    assert.deepEqual(plain(lab.realm().api.revisioEditorial('mur', 'one')), { title: 'New' });
  });
  run('captured ACK does not certify an unseen concurrent human patch or untrusted metadata', lab => {
    let n = 0;
    const a = lab.realm({ crypto: { randomUUID: () => `ffffffff-ffff-4fff-8fff-${String(++n).padStart(12, '0')}` } }).api;
    const b = lab.realm({ crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000001' } }).api;
    lab.beforeCommit(() => {
      a.desaRevisioEditorial('mur', 'one', { title: 'A' });
      const map = a.carregaMapa(), original = map.get('mur:one');
      map.set('mur:one', a.marcaConfirmacioRevisio(original, { versio: 8, syntheticAuthority: true }));
      a.persisteixMapa(map);
    });
    b.desaRevisioEditorial('mur', 'one', { lead: 'B' });
    const entry = lab.realm().api.carregaMapa().get('mur:one');
    assert.deepEqual(plain(entry.camps), { lead: 'B', title: 'A' }); assert.equal(entry.servidor, undefined);
  });
  run('full physical journal consolidates losslessly and acknowledges later fields', lab => {
    lab.disk.set(lab.main, '{}');
    for (let n = 1; n <= 512; n++) {
      const id = `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
      lab.disk.set(`sdp_embed_publicacions.revisions.ops.v1.${id}`, JSON.stringify({ v: 1, n, id, k: 'mur:one', t: 'p', d: { title: String(n) }, at: null }));
    }
    const before = new Map(lab.disk), a = lab.realm().api;
    a.desaRevisioEditorial('mur', 'one', { lead: 'RAM' });
    assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:one')), true);
    const logical = new Map();
    for (const [key, raw] of lab.disk) if (key.includes('.ops.v1.')) {
      const item = JSON.parse(raw); let previous = '';
      const rows = item.format === 'sdp.editorial.lot.v1' ? item.rows.map(([p, s, text]) => {
        previous = previous.slice(0, p) + text + (s ? previous.slice(-s) : ''); return previous;
      }) : [JSON.stringify(item)];
      for (const text of rows) logical.set(JSON.parse(text).id, text);
    }
    for (const [key, raw] of before) if (key.includes('.ops.v1.')) assert.equal(logical.get(JSON.parse(raw).id), raw);
    assert.equal(logical.size, 513);
    assert.deepEqual(plain(lab.realm().api.revisioEditorial('mur', 'one')), { title: '512', lead: 'RAM' });
  });
  run('malformed journal preserves raw evidence, valid projection and the pending overlay', lab => {
    const a = lab.realm().api; a.desaRevisioEditorial('mur', 'one', { title: 'Durable' });
    const key = 'sdp_embed_publicacions.revisions.ops.v1.00000000-0000-4000-8000-000000000099';
    lab.disk.set(key, '{'); const b = lab.realm().api;
    b.desaRevisioEditorial('mur', 'one', { lead: 'RAM' });
    assert.equal(lab.disk.get(key), '{'); assert.equal(b.revisioPersistida(b.carregaMapa().get('mur:one')), false);
    assert.deepEqual(plain(b.revisioEditorial('mur', 'one')), { title: 'Durable', lead: 'RAM' });
    assert.deepEqual(plain(lab.realm().api.revisioEditorial('mur', 'one')), { title: 'Durable' });
  });
  run('restore quota reports failure while retaining RAM; rejected remote promise remains awaitable', async lab => {
    const a = lab.realm().api; a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'A' });
    const error = new Error('Offline'); let callbacks = 0;
    a.registraCosturaRestauracions(() => { callbacks++; return Promise.reject(error); });
    lab.quota(true); const result = a.restauraVersioEditorial('mur', 'one', 0);
    assert.equal(result.restaurada, false); assert.equal(result.acceptadaEnMemoria, true);
    assert.equal(a.revisioEditorial('mur', 'one'), null); assert.equal(callbacks, 1);
    await assert.rejects(result.sincronitzacio, e => e === error);
    assert.deepEqual(plain(lab.realm().api.revisioEditorial('mur', 'one')), { title: 'A' });
  });
  run('restoring already selected fields is durable without inventing another history entry', lab => {
    const a = lab.realm().api; a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'A' });
    const entry = a.historialRevisionsEditorials('mur', 'one')[0], id = a.identificadorVersioEditorial(entry);
    assert.equal(a.restauraVersioEditorial('mur', 'one', id).restaurada, true);
    assert.equal(a.historialRevisionsEditorials('mur', 'one').length, 1);
  });

  run('retrying restore-original after quota commits the pending tombstones without a phantom history', lab => {
    const a = lab.realm().api; a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'A' });
    lab.quota(true); assert.equal(a.restauraVersioEditorial('mur', 'one', 0).restaurada, false);
    lab.quota(false); assert.equal(a.restauraVersioEditorial('mur', 'one', 0).restaurada, true);
    const fresh = lab.realm().api; assert.equal(fresh.revisioEditorial('mur', 'one'), null);
    assert.equal(fresh.historialRevisionsEditorials('mur', 'one').length, 0);
  });
  run('a history created and undone during quota does not reappear after durable retry', lab => {
    const a = lab.realm().api; lab.quota(true);
    a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'RAM' });
    assert.equal(a.desferUltimaRevisioEditorial('mur', 'one').restaurada, false);
    lab.quota(false); assert.equal(a.restauraVersioEditorial('mur', 'one', 0).restaurada, true);
    const fresh = lab.realm().api; assert.equal(fresh.revisioEditorial('mur', 'one'), null);
    assert.equal(fresh.historialRevisionsEditorials('mur', 'one').length, 0);
  });

  run('history-only quota retry drains the prior pending entry before reporting durable restore', lab => {
    const a = lab.realm().api;
    a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'First' });
    a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'Second' });
    lab.historyQuota(true); assert.equal(a.restauraVersioEditorial('mur', 'one', 1).restaurada, false);
    assert.equal(lab.realm().api.historialRevisionsEditorials('mur', 'one').length, 2);
    lab.historyQuota(false); assert.equal(a.restauraVersioEditorial('mur', 'one', 1).restaurada, true);
    const fresh = lab.realm().api; assert.equal(fresh.historialRevisionsEditorials('mur', 'one').length, 3);
    assert.deepEqual(plain(fresh.revisioEditorial('mur', 'one')), { title: 'First' });
  });
  run('a committed history entry with a failed readback is retried under the same identity', lab => {
    const a = lab.realm().api; lab.failHistoryReceipt();
    a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'First' });
    const first = [...lab.disk].filter(([key]) => key.includes('.histops.v1.'));
    assert.equal(first.length, 1);
    a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'Second' });
    assert.equal(lab.disk.get(first[0][0]), first[0][1]);
    const list = lab.realm().api.historialRevisionsEditorials('mur', 'one');
    assert.equal(list.length, 2); assert.deepEqual(plain(list.map(e => e.campsNous.title)), ['First', 'Second']);
  });

  run('multiple pending history edits retain their observed order after quota recovery', lab => {
    let id = 100;
    const a = lab.realm({ crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(id--).padStart(12, '0')}` } }).api;
    lab.quota(true);
    a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'First' });
    a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'Second' });
    lab.quota(false); a.desaRevisioEditorialAmbHistorial('mur', 'one', { title: 'Third' });
    const list = lab.realm().api.historialRevisionsEditorials('mur', 'one');
    assert.deepEqual(plain(list.map(e => e.campsNous.title)), ['First', 'Second', 'Third']);
    assert.deepEqual(plain(list.map(e => e.versio)), [1, 2, 3]);
  });

  run('an incomplete storage enumeration cannot certify a durable write', lab => {
    const realm = lab.realm(), a = realm.api;
    Object.defineProperty(realm.context.localStorage, 'length', { value: undefined });
    assert.equal(a.desaRevisioEditorial('mur', 'one', { title: 'RAM' }), true);
    assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:one')), false);
    assert.equal(lab.disk.size, 0);
  });
  run('the observed character cap includes the complete new key, not only its JSON body', lab => {
    const limit = 2 * 1024 * 1024, prefix = 'sdp_embed_publicacions.revisions.ops.v1.';
    const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
    class Clock extends Date { constructor() { super('2000-01-01T00:00:00Z'); } }
    const next = { k: 'mur:one', t: 'p', d: { title: 'RAM' }, at: '2000-01-01T00:00:00.000Z', v: 1, n: 5, id: uuid(5) };
    const size = op => JSON.stringify(op).length + prefix.length + op.id.length;
    const ops = Array.from({ length: 4 }, (_, i) => ({ v: 1, n: i + 1, id: uuid(i + 1), k: 'mur:one', t: 'p', d: { content: '' }, at: null }));
    let remaining = limit - size(next) + 1 - ops.reduce((sum, op) => sum + size(op), 0);
    for (const op of ops) { const n = Math.min(600000, remaining); op.d.content = 'x'.repeat(n); remaining -= n; lab.disk.set(prefix + op.id, JSON.stringify(op)); }
    assert.equal(remaining, 0);
    const before = lab.disk.size, a = lab.realm({ crypto: { randomUUID: () => uuid(5) }, Date: Clock }).api;
    a.desaRevisioEditorial('mur', 'one', { title: 'RAM' });
    assert.equal(a.revisioPersistida(a.carregaMapa().get('mur:one')), false);
    assert.equal(lab.disk.size, before); assert.equal(lab.disk.has(prefix + uuid(5)), false);
  });

}
