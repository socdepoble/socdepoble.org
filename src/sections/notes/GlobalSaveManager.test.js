import { expect, test, vi } from 'vitest';
import { GlobalSaveManager, draftFields } from './GlobalSaveManager.js';

function setup() {
  const records = new Map();
  const persist = async (key, transform) => {
    const result = transform(structuredClone(records.get(key) || {}));
    records.set(key, structuredClone(result));
    return result;
  };
  const manager = new GlobalSaveManager({ persist, delay: 60000 });
  const clear = vi.fn();
  const toast = vi.fn();
  const enqueue = (field, value, update, scope = 'tenant') => manager.enqueue(scope, 'note', field, value,
    () => ({ revision: 1 }), update, clear, toast);
  return { manager, records, enqueue, clear, toast };
}
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

test('un error antic conserva el títol nou i els altres camps acumulats', async () => {
  const { manager, records, enqueue } = setup();
  const request = deferred();
  const started = deferred();
  const a = enqueue('title', 'antic', () => { started.resolve(); return request.promise; });
  const flushed = manager.flush('tenant', 'note');
  await started.promise;
  const b = enqueue('title', 'nou', async (_id, payload) => ({ ...payload, revision: 2 }));
  const c = enqueue('content', 'cos', async () => ({ revision: 2 }));
  await manager.writes.get('tenant:note');
  const version = records.get('tenant:note')._operationVersion;
  request.reject(new Error('xarxa'));
  expect(await flushed).toBe(false);
  expect(await a).toBe(false);
  expect(draftFields(records.get('tenant:note'))).toEqual({ title: 'nou', content: 'cos' });
  expect(records.get('tenant:note')._operationVersion).toBe(version);
  await manager.flush('tenant', 'note');
  expect(await b).toBe(true);
  expect(await c).toBe(true);
  expect(draftFields(records.get('tenant:note'))).toEqual({});
});

test('èxit antic només confirma les versions dels seus camps', async () => {
  const { manager, records, enqueue } = setup();
  const request = deferred();
  const started = deferred();
  const a = enqueue('title', 'A', () => { started.resolve(); return request.promise; });
  const flushed = manager.flush('tenant', 'note');
  await started.promise;
  const update = vi.fn(async () => ({ revision: 3 }));
  const b = enqueue('content', 'B', update);
  await manager.writes.get('tenant:note');
  request.resolve({ revision: 2 });
  await flushed;
  expect(await a).toBe(true);
  expect(draftFields(records.get('tenant:note'))).toEqual({ content: 'B' });
  await manager.flush('tenant', 'note');
  expect(await b).toBe(true);
  expect(update.mock.calls[0][2]).toBe(2);
});

test('publicació i autosave s’executen en ordre, sense esborrar edicions posteriors', async () => {
  const { manager, records, enqueue } = setup();
  const order = [];
  const publication = deferred();
  const started = deferred();
  const a = enqueue('title', 'A', async () => { order.push('save A'); return { revision: 2 }; });
  const published = manager.runExclusive('tenant', 'note', async () => {
    order.push('publish'); started.resolve(); await publication.promise;
    manager.setRevision('tenant', 'note', 3);
  });
  await started.promise;
  const b = enqueue('title', 'B', async (_id, _payload, revision) => {
    expect(revision).toBe(3); order.push('save B'); return { revision: 4 };
  });
  const pending = manager.flush('tenant', 'note');
  await manager.writes.get('tenant:note');
  expect(draftFields(records.get('tenant:note'))).toEqual({ title: 'B' });
  publication.resolve();
  await Promise.all([published, pending, a, b]);
  expect(order).toEqual(['save A', 'publish', 'save B']);
});

test('clear resol les promeses i una revisió remota més nova preval', async () => {
  const { manager, enqueue } = setup();
  const update = vi.fn();
  const pending = enqueue('title', 'A', update);
  await manager.clearDraft('tenant', 'note');
  expect(await pending).toBe(false);
  expect(update).not.toHaveBeenCalled();
  manager.setRevision('tenant', 'note', 2);
  expect(manager.getExpectedRevision('tenant', 'note', 5)).toBe(5);
});

test('oblida resol la cua pendent a false, no desa i esborra el registre i la revisió', async () => {
  const { manager, records, enqueue } = setup();
  const update = vi.fn();
  const pending = enqueue('title', 'A', update);
  manager.setRevision('tenant', 'note', 4);
  await manager.oblida('tenant', 'note');
  expect(await pending).toBe(false);
  expect(records.get('tenant:note') ?? null).toBeNull();
  expect(manager.queues.size).toBe(0);
  expect(manager.getExpectedRevision('tenant', 'note', 0)).toBe(0);
  expect(await manager.flush('tenant', 'note')).toBe(true);
  expect(update).not.toHaveBeenCalled();
});

test('fallada local de persistència és visible i no inicia xarxa', async () => {
  const manager = new GlobalSaveManager({ persist: async () => { throw new Error('quota'); } });
  const update = vi.fn(), toast = vi.fn();
  const pending = manager.enqueue('a', 'n', 'title', 'A', () => ({}), update, vi.fn(), toast);
  await manager.flush('a', 'n');
  expect(await pending).toBe(false);
  expect(update).not.toHaveBeenCalled();
  expect(toast).toHaveBeenCalled();
});

test('1.000 desats alliberen writes i acoten revisions sense tocar esborranys', async () => {
  const { manager, records } = setup();
  for (let i = 0; i < 1000; i++) {
    await manager.write(`scope:${i}`, () => ({ title: 'pendent' }));
    manager.setRevision('scope', i, 1);
  }
  expect(manager.writes.size).toBe(0);
  expect(manager.knownRevisions.size).toBe(256);
  expect(records.size).toBe(1000);
  expect(manager.getExpectedRevision('scope', 0, 12)).toBe(12);
});
test('una promesa antiga no esborra la nova i les revisions actives no s’expulsen', async () => {
  const blocked = deferred();
  const manager = new GlobalSaveManager({ persist: async () => blocked.promise, maxInactiveRevisions: 0 });
  const first = manager.write('scope:n', () => ({}));
  const second = manager.write('scope:n', () => ({}));
  manager.setRevision('scope', 'n', 4);
  expect(manager.knownRevisions.size).toBe(1);
  blocked.resolve({}); await first; await second;
  expect(manager.writes.size).toBe(0);
  expect(manager.knownRevisions.size).toBe(0);
});

test('D01: un esborrany antic no hereta la revisió remota nova', async () => {
  const records = new Map([['tenant:note', {
    title: 'Draft antic', _operationVersion: 1, _fieldVersions: { title: 1 }, _baseRevision: 1
  }]]);
  const persist = async (key, transform) => {
    const result = transform(structuredClone(records.get(key) || {}));
    records.set(key, structuredClone(result));
    return result;
  };
  const manager = new GlobalSaveManager({ persist, delay: 60000 });
  const update = vi.fn(async () => { const error = new Error('conflicte'); error.status = 409; throw error; });
  const toast = vi.fn();
  const pending = manager.enqueue('tenant', 'note', 'subtitle', 'Edició posterior',
    () => ({ revision: 3 }), update, vi.fn(), toast);
  await manager.flush('tenant', 'note');
  expect(await pending).toBe(false);
  expect(update.mock.calls[0][2]).toBe(1);
  expect(update.mock.calls[0][1]).toEqual({ title: 'Draft antic', subtitle: 'Edició posterior' });
  expect(toast).toHaveBeenCalledWith(expect.stringContaining('Conflicte'), 'error');
  expect(draftFields(records.get('tenant:note'))).toEqual({ title: 'Draft antic', subtitle: 'Edició posterior' });
});

test('D01: només la decisió explícita mou la base i permet desar', async () => {
  const { manager, records } = setup();
  records.set('tenant:note', { title: 'Meu', _operationVersion: 1, _fieldVersions: { title: 1 }, _baseRevision: 1 });
  expect(await manager.rebaseDraft('tenant', 'note', 3)).toEqual({ title: 'Meu' });
  const update = vi.fn(async () => ({ revision: 4 }));
  const pending = manager.enqueue('tenant', 'note', 'title', 'Meu', () => ({ revision: 3 }), update, vi.fn(), vi.fn());
  await manager.flush('tenant', 'note');
  expect(await pending).toBe(true);
  expect(update.mock.calls[0][2]).toBe(3);
});

test('D01: un esborrany nou sobre un registre net naix a la revisió que es veu, no a la del desat vell', async () => {
  const { manager, records } = setup();
  // Desat propi antic confirmat a la 2; després la nota ha avançat a la 5 per un altre camí
  // i la persona ja la veu així: editar-la ara no és cap conflicte.
  records.set('tenant:note', { _operationVersion: 3, _fieldVersions: {}, _baseRevision: 2 });
  const update = vi.fn(async () => ({ revision: 6 }));
  const pending = manager.enqueue('tenant', 'note', 'title', 'Nou', () => ({ revision: 5 }), update, vi.fn(), vi.fn());
  expect((await manager.writes.get('tenant:note'))._baseRevision).toBe(5);
  await manager.flush('tenant', 'note');
  expect(await pending).toBe(true);
  expect(update.mock.calls[0][2]).toBe(5);
});

test('D01: la publicació pròpia avança la base persistida i no inventa registres', async () => {
  const { manager, records } = setup();
  records.set('tenant:note', { title: 'Pendent', _operationVersion: 1, _fieldVersions: { title: 1 }, _baseRevision: 2 });
  await manager.confirmRevision('tenant', 'note', 3);
  expect(records.get('tenant:note')._baseRevision).toBe(3);
  expect(draftFields(records.get('tenant:note'))).toEqual({ title: 'Pendent' });
  expect(manager.getExpectedRevision('tenant', 'note', 0)).toBe(3);
  await manager.confirmRevision('tenant', 'buida', 7);
  expect(records.get('tenant:buida') ?? null).toBeNull();
});
