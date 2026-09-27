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
const DIA = 24 * 60 * 60 * 1000;
const rellotge = (inici = Date.parse('2026-09-27T10:00:00Z')) => {
  let ara = inici;
  return { rellotge: () => new Date(ara), avança: dies => { ara += dies * DIA; } };
};

test('moure a la paperera anota la data i avança la revisió; una revisió vella no mou res', async () => {
  const temps = rellotge();
  const adapter = createLocalNotesAdapter(memoryDisk(), { rellotge: temps.rellotge });
  const note = await adapter.create({ title: 'Prova' }, config);
  const moguda = await adapter.move(note.id, 'paperera', 0, config);
  expect(moguda).toMatchObject({ estat: 'paperera', enPapereraAl: '2026-09-27T10:00:00.000Z', revision: 1 });
  await expect(adapter.move(note.id, 'arxivada', 0, config)).rejects.toMatchObject({ status: 409 });
  temps.avança(3);
  // Si ja hi era, la data d'entrada no es mou.
  expect((await adapter.move(note.id, 'paperera', 1, config)).enPapereraAl).toBe('2026-09-27T10:00:00.000Z');
  expect((await adapter.move(note.id, 'arxivada', 2, config))).toMatchObject({ estat: 'arxivada', enPapereraAl: null });
  await expect(adapter.move(note.id, 'perduda', 3, config)).rejects.toThrow('Estat de nota invàlid');
  await expect(adapter.move('no-hi-és', 'paperera', 0, config)).rejects.toMatchObject({ status: 404 });
});

test('borrar definitivament: la nota desapareix i un desat posterior dona 404, no 409', async () => {
  const storage = memoryDisk(), adapter = createLocalNotesAdapter(storage);
  const note = await adapter.create({ title: 'Efímera' }, config);
  await expect(adapter.remove(note.id, 5, config)).rejects.toMatchObject({ status: 409 });
  expect(await adapter.remove(note.id, 0, config)).toEqual({ id: note.id });
  expect((await createLocalNotesAdapter(storage).load(getDefaultUserId(), config)).notes).toEqual([]);
  await expect(adapter.update(note.id, { title: 'Tard' }, 0, config)).rejects.toMatchObject({ status: 404 });
});

test('la nota de llavor n1 es pot borrar i no ressuscita amb un adaptador nou', async () => {
  const storage = memoryDisk(), seedConfig = { dataMode: 'seed' };
  const adapter = createLocalNotesAdapter(storage);
  const n1 = (await adapter.load(getDefaultUserId(), seedConfig)).notes.find(n => n.id === 'n1');
  await adapter.remove('n1', n1.revision, seedConfig);
  const restants = (await createLocalNotesAdapter(storage).load(getDefaultUserId(), seedConfig)).notes;
  expect(restants.map(n => n.id)).not.toContain('n1');
  expect(restants.some(n => n._esborrada)).toBe(false);
  await expect(adapter.update('n1', { title: 'Torna' }, n1.revision, seedConfig)).rejects.toMatchObject({ status: 404 });
});

test('la purga als 30 dies s’emporta la de 31 dies i conserva la de 29 i l’arxivada', async () => {
  const temps = rellotge();
  const storage = memoryDisk();
  const adapter = createLocalNotesAdapter(storage, { rellotge: temps.rellotge });
  const vella = await adapter.create({ title: 'Vella' }, config);
  const arxivada = await adapter.create({ title: 'Arxivada' }, config);
  await adapter.move(vella.id, 'paperera', 0, config);
  await adapter.move(arxivada.id, 'arxivada', 0, config);
  temps.avança(2);
  const recent = await adapter.create({ title: 'Recent' }, config);
  await adapter.move(recent.id, 'paperera', 0, config);
  temps.avança(29);
  expect(await adapter.purgaPaperera(config)).toBe(1);
  const ids = (await adapter.load(getDefaultUserId(), config)).notes.map(n => n.id);
  expect(ids).not.toContain(vella.id);
  expect(ids).toEqual(expect.arrayContaining([recent.id, arxivada.id]));
  expect(await adapter.purgaPaperera(config)).toBe(0);
});

test('una purga sense res vençut no escriu', async () => {
  const storage = memoryDisk();
  const adapter = createLocalNotesAdapter(storage);
  await adapter.create({ title: 'Activa' }, config);
  const mutate = vi.spyOn(storage, 'mutate');
  expect(await adapter.purgaPaperera(config)).toBe(0);
  expect(mutate).not.toHaveBeenCalled();
});

test('storage failure is reported, never shown as a successful save', async () => {
  const adapter = createLocalNotesAdapter({ mutate: async () => { throw new Error('QuotaExceededError'); } });
  await expect(adapter.create({}, config)).rejects.toThrow('QuotaExceededError');
});
