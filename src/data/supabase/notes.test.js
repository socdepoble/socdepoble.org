import { beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ request: vi.fn(), user: { id: '11111111-1111-4111-8111-111111111111' } }));
vi.mock('./runtime.js', () => ({
  request: mocks.request,
  getResolvedConfig: config => ({ hasSupabaseConfig: true, ...config }),
  getCurrentUser: () => mocks.user,
  generateUUID: () => '22222222-2222-4222-8222-222222222222',
  buildSeedAppData: vi.fn(),
  ErrorSupabase: class extends Error { constructor(message, status) { super(message); this.status = status; } }
}));
import { loadNotes, createNote, updateNote } from './notes.js';
const config = { tenantId: '33333333-3333-4333-8333-333333333333' };
beforeEach(() => mocks.request.mockReset());
test('tenant absent o ID/revisió invàlids no arriben a la xarxa', async () => {
  await expect(loadNotes(mocks.user.id, {})).rejects.toThrow('Poble');
  await expect(createNote({}, {})).rejects.toThrow('Poble');
  await expect(updateNote(mocks.user.id, {}, 1, {})).rejects.toThrow('Poble');
  await expect(updateNote('n1', {}, 1, config)).rejects.toThrow('Nota');
  await expect(updateNote(mocks.user.id, {}, -1, config)).rejects.toThrow('expectedRevision');
  expect(mocks.request).not.toHaveBeenCalled();
});
test('51 notes es carreguen sense barrejar fonts editorials', async () => {
  mocks.request.mockResolvedValueOnce(Array.from({ length: 50 }, (_, id) => ({ id, revision: 1 })))
    .mockResolvedValueOnce([{ id: 50, revision: 1 }]);
  const result = await loadNotes(mocks.user.id, config);
  expect(result.notes).toHaveLength(51);
  expect(result.notesComplete).toBe(true);
  expect(mocks.request.mock.calls.every(([url]) => url.startsWith('/rest/v1/notes?'))).toBe(true);
  expect(mocks.request.mock.calls[1][0]).toContain('offset=50');
});
