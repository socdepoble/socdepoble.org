import { beforeEach, expect, test, vi } from 'vitest';
const remote = vi.hoisted(() => ({ folders: [], calls: 0, endless: false }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: () => ({ hasSupabaseConfig: true, tenantId: '00000000-0000-4000-8000-000000000001', runtimeDataMode: 'remote' }),
  request: async url => {
    if (!url.startsWith('/rest/v1/note_folders')) return [];
    remote.calls++;
    const after = new URL(url, 'http://local').searchParams.get('id')?.slice(3) || '';
    if (remote.endless) return [{ id: `f-${String(remote.calls).padStart(8, '0')}-0000-4000-8000-000000000001`, nom: 'Nova' }];
    return remote.folders.filter(folder => folder.id > after).slice(0, 7);
  },
  getCurrentUser: () => ({ id: '00000000-0000-4000-8000-000000000002' }), generateUUID: vi.fn(), ErrorSupabase: class extends Error {}
}));
import { loadNotesPage } from './notes.js';
import { NOTE_FOLDERS_SEED } from '../appSeed.js';
beforeEach(() => { remote.folders = []; remote.calls = 0; remote.endless = false; });
const load = () => loadNotesPage({ ownerUserId: '00000000-0000-4000-8000-000000000002' });
test('R32.54 · carpetes amb max-rows 7 continuen fins a buida, sense perdre la cua', async () => {
  remote.folders = Array.from({ length: 101 }, (_, i) => ({ id: `f-${String(i + 1).padStart(8, '0')}-0000-4000-8000-000000000001`, nom: `Carpeta ${i}` }));
  const page = await load();
  expect(page.noteFolders.map(folder => folder.id)).toEqual([...NOTE_FOLDERS_SEED.map(folder => folder.id), ...remote.folders.map(folder => folder.id)]);
  expect(remote.calls).toBe(Math.ceil(101 / 7) + 1);
});
test('R32.54 · servidor infinit de pàgines curtes falla al pressupost 32 sense catàleg parcial', async () => {
  remote.endless = true;
  await expect(load()).rejects.toThrow('límit de pàgines de carpetes');
  expect(remote.calls).toBe(32);
});
