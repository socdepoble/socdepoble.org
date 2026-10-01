/* T40 (ordre del Mestre, 260928) · En mode seed/local la data de publicació
   de la nota persistix de veres (IndexedDB) i sobreviu a un adaptador nou. */
import { expect, test } from 'vitest';
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
const config = { dataMode: 'local', tenantId: '00000000-0000-4000-8000-000000000000' };

test('la data de publicació es desa, torna amb un adaptador nou i la brossa es desa com a null', async () => {
  const storage = memoryDisk();
  const adapter = createLocalNotesAdapter(storage);
  const nota = await adapter.create({ title: 'Fira' }, config);
  const desada = await adapter.update(nota.id, { publishDate: '2026-10-05T10:30:00+02:00' }, 0, config);
  expect(desada.publishDate).toBe('2026-10-05T08:30:00.000Z');
  const restaurada = (await createLocalNotesAdapter(storage).load(getDefaultUserId(), config)).notes
    .find((n) => n.id === nota.id);
  expect(restaurada.publishDate).toBe('2026-10-05T08:30:00.000Z');
  const buidada = await adapter.update(nota.id, { publishDate: 'demà' }, 1, config);
  expect(buidada.publishDate).toBeNull();
});
