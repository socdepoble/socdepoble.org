import { expect, test, vi } from 'vitest';
import { createLocalNotesAdapter } from './localNotes.js';
import { getDefaultUserId } from './appSeed.js';

function memoryDisk() {
  const records = new Map();
  return {
    read: async key => structuredClone(records.get(key) || {}),
    mutate: async (key, transform) => {
      const result = transform(structuredClone(records.get(key)));
      records.set(key, structuredClone(result));
      return result;
    }
  };
}
const config = { dataMode: 'local', tenantId: 'poble-a' };
test('a new adapter restores notes and copyright without a server or session', async () => {
  const storage = memoryDisk();
  const adapter = createLocalNotesAdapter(storage);
  const fetch = vi.spyOn(globalThis, 'fetch');
  try {
    const note = await adapter.create({ title: 'Autònom', content: '<p>Del poble</p>' }, config);
    await adapter.update(note.id, { copyright: '© Autoria lliure', title: '<img src=x onerror=alert(1)>' }, 0, config);
    const restored = await createLocalNotesAdapter(storage).load(getDefaultUserId(), config);
    expect(restored.notes[0]).toMatchObject({ id: note.id, copyright: '© Autoria lliure', revision: 1 });
    expect(restored.notes[0].title).not.toContain('onerror');
    expect(fetch).not.toHaveBeenCalled();
  } finally { fetch.mockRestore(); }
});
test('a stale revision cannot overwrite another tab and tenants do not share notes', async () => {
  const adapter = createLocalNotesAdapter(memoryDisk());
  const note = await adapter.create({ title: 'Original' }, config);
  await adapter.update(note.id, { title: 'Primer' }, 0, config);
  await expect(adapter.update(note.id, { title: 'Segon' }, 0, config)).rejects.toMatchObject({ status: 409 });
  expect((await adapter.load(getDefaultUserId(), { ...config, tenantId: 'poble-b' })).notes).toEqual([]);
  expect((await adapter.load(getDefaultUserId(), config)).notes[0].title).toBe('Primer');
});
test('seed notes become durable drafts without changing the seed or claiming publication', async () => {
  const storage = memoryDisk(), adapter = createLocalNotesAdapter(storage), seedConfig = { dataMode: 'seed' };
  const seed = (await adapter.load(getDefaultUserId(), seedConfig)).notes[0];
  const saved = await adapter.update(seed.id, { copyright: 'x'.repeat(300), isPublished: true }, seed.revision, seedConfig);
  expect(saved.copyright).toHaveLength(256);
  expect(saved.isPublished).toBe(false);
  expect((await createLocalNotesAdapter(storage).load(getDefaultUserId(), seedConfig)).notes.find(n => n.id === seed.id)).toEqual(saved);
  expect((await createLocalNotesAdapter(memoryDisk()).load(getDefaultUserId(), seedConfig)).notes[0].revision).toBe(seed.revision);
});
test('storage failure is reported, never shown as a successful save', async () => {
  const adapter = createLocalNotesAdapter({ mutate: async () => { throw new Error('QuotaExceededError'); } });
  await expect(adapter.create({}, config)).rejects.toThrow('QuotaExceededError');
});
