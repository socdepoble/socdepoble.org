import { afterEach, expect, test, vi } from 'vitest';
import { creaIdbCaosRural } from '../../utils/__fixtures__/idbCaosRural.js';
import { mutateDraft } from './GlobalSaveManager.js';
afterEach(() => { vi.unstubAllGlobals(); });
test('Notes draft: onblocked seguit d’onsuccess tardà no deixa cap connexió oberta', async () => {
  let request, closed = 0;
  vi.stubGlobal('indexedDB', { open() { request = {}; queueMicrotask(() => request.onblocked()); return request; } });
  await expect(mutateDraft('scope:n', () => ({ title: 'Pendent' }))).rejects.toThrow(/bloquejat/);
  request.result = { close() { closed++; } }; request.onsuccess();
  expect(closed).toBe(1);
});
test('Notes draft: l’excepció del transform avorta, arriba al caller i no escapa de l’event handler', async () => {
  let request, get, tx;
  const original = new Error('Transformació rebutjada');
  vi.stubGlobal('indexedDB', { open() {
    request = {};
    queueMicrotask(() => {
      request.result = { close() {}, transaction() {
        tx = { objectStore() { return { get() { get = {}; return get; }, put() { throw new Error('No ha de desar'); } }; },
        abort() { queueMicrotask(() => tx.onabort()); } };
        return tx;
      } };
      request.onsuccess();
    }); return request;
  } });
  const pending = mutateDraft('scope:n', () => { throw original; });
  const assertion = expect(pending).rejects.toBe(original);
  await vi.waitFor(() => expect(get).toBeDefined());
  expect(() => get.onsuccess()).not.toThrow();
  await assertion;
});
test('Notes draft: quota no confirma cap esborrany nou ni sobreescriu el que ja era durable', async () => {
  const disk = creaIdbCaosRural(); vi.stubGlobal('indexedDB', disk.idb);
  await mutateDraft('scope:n', () => ({ title: 'Original' }));
  disk.control.errorEscriptura = new DOMException('Disc ple', 'QuotaExceededError');
  await expect(mutateDraft('scope:n', () => ({ title: 'Pendent' }))).rejects.toMatchObject({ name: 'QuotaExceededError' });
  expect(disk.files('SdpNotesQueue', 'drafts')).toEqual([{ title: 'Original' }]);
  expect(disk.registre.obertes).toBe(0);
});
