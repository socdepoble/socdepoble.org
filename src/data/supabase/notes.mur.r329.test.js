import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ request: vi.fn(), user: { id: '11111111-1111-4111-8111-111111111111' } }));
vi.mock('./runtime.js', () => ({ request: (url, ...args) => url.startsWith('/rest/v1/note_folders') ? Promise.resolve([]) : m.request(url, ...args),
  getResolvedConfig: config => ({ hasSupabaseConfig: true, runtimeDataMode: 'remote', ...config }), getCurrentUser: () => m.user,
  generateUUID: () => '22222222-2222-4222-8222-222222222222', ErrorSupabase: class extends Error {} }));
import { createNote, loadNotes, updateNote } from './notes.js';
const config = { tenantId: '33333333-3333-4333-8333-333333333333' }, id = '44444444-4444-4444-8444-444444444444';
beforeEach(() => m.request.mockReset());
test('servidor amb camp: create/update/read preserven el booleà i no canvien publicació ni carpeta', async () => {
  m.request.mockResolvedValueOnce([{ id, mostrar_al_mur: false, is_published: true, folder_id: 'llibre', revision: 3 }]);
  const updated = await updateNote(id, { mostrarAlMur: false }, 2, config);
  expect(m.request.mock.calls[0][2].body).toEqual({ mostrar_al_mur: false });
  expect(updated).toMatchObject({ mostrarAlMur: false, ocultarDelMur: true, isPublished: true, folderId: 'llibre' });
  expect(updated).not.toHaveProperty('campsNoDesats');
  m.request.mockResolvedValueOnce([{ id, mostrar_al_mur: true, revision: 0 }]);
  expect(await createNote({ id, ocultarDelMur: false }, config)).toMatchObject({ mostrarAlMur: true, ocultarDelMur: false });
  expect(m.request.mock.calls[1][2].body).toMatchObject({ mostrar_al_mur: true });
  m.request.mockResolvedValueOnce([{ id, mostrar_al_mur: false, revision: 1 }]);
  expect((await loadNotes(m.user.id, { ...config, noteId: id })).notes[0].mostrarAlMur).toBe(false);
});
test('fila sense camp o valor mal tipat no inventa confirmació; ACK antic que ignora el camp deixa pendent', async () => {
  m.request.mockResolvedValueOnce([{ id, revision: 3 }]);
  expect(await updateNote(id, { title: 'T', mostrarAlMur: false }, 2, config)).toMatchObject({ campsNoDesats: ['mostrarAlMur'] });
  m.request.mockResolvedValueOnce([{ id, mostrar_al_mur: 'false', revision: 3 }]);
  const note = (await loadNotes(m.user.id, { ...config, noteId: id })).notes[0];
  expect(note).not.toHaveProperty('mostrarAlMur'); expect(note).not.toHaveProperty('ocultarDelMur');
});
test('401/403 i entrada mal tipada continuen rojos, sense fallback ni POST', async () => {
  for (const status of [401, 403]) {
    const error = Object.assign(new Error('Prohibit'), { status }); m.request.mockRejectedValueOnce(error);
    await expect(updateNote(id, { mostrarAlMur: false }, 2, config)).rejects.toBe(error);
  }
  m.request.mockClear();
  await expect(createNote({ mostrarAlMur: 'false' }, config)).rejects.toMatchObject({ code: 'mur-visibilitat-invalida' });
  expect(m.request).not.toHaveBeenCalled();
});
test('camp absent: mateixa CAS, resta desada, preferència declarada no desada; només preferència falla clarament', async () => {
  m.request.mockRejectedValueOnce(Object.assign(new Error("Could not find the 'mostrar_al_mur' column of 'notes' in the schema cache"), { status: 400 }))
    .mockResolvedValueOnce([{ id, title: 'T', revision: 4 }]);
  const result = await updateNote(id, { title: 'T', ocultarDelMur: true }, 3, config);
  expect(result.campsNoDesats).toEqual(['ocultarDelMur']);
  expect(m.request.mock.calls[0][0]).toBe(m.request.mock.calls[1][0]);
  expect(m.request.mock.calls[1][2].body).toEqual({ title: 'T' });
  m.request.mockClear();
  await expect(updateNote(id, { mostrarAlMur: false }, 4, config)).rejects.toMatchObject({ name: 'ErrorColumnaAbsent', camps: ['mostrarAlMur'] });
  expect(m.request).not.toHaveBeenCalled();
});
