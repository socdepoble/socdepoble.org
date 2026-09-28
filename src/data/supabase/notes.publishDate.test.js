/* T40 (ordre del Mestre, 260928) · La data de publicació de les notes en
   remot: columna opcional `publish_date`, amb la mateixa quarantena que
   l'emoticona (T47b). Fitxer propi: la memòria de columnes absents és del
   mòdul i dura tota la pàgina, i les proves d'ací en depenen EN ORDRE
   (primer amb columna, després sense). */
import { beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ request: vi.fn(), user: { id: '11111111-1111-4111-8111-111111111111' } }));
vi.mock('./runtime.js', () => ({
  request: mocks.request,
  getResolvedConfig: config => ({ hasSupabaseConfig: true, runtimeDataMode: 'remote', ...config }),
  getCurrentUser: () => mocks.user,
  generateUUID: () => '22222222-2222-4222-8222-222222222222',
  ErrorSupabase: class extends Error { constructor(message, status) { super(message); this.status = status; } }
}));
import { createNote, loadNotes, loadNotesPage, updateNote } from './notes.js';

const config = { tenantId: '33333333-3333-4333-8333-333333333333' };
const NOTA = '44444444-4444-4444-8444-444444444444';
const DATA = '2026-10-05T08:30:00.000Z';
const pgrst204 = (columna) => Object.assign(new Error(
  `Supabase 400: {"code":"PGRST204","message":"Could not find the '${columna}' column of 'notes' in the schema cache"}`),
{ status: 400 });
beforeEach(() => mocks.request.mockReset());

test('amb la columna al servidor, la data viatja i torna (update, create i detall)', async () => {
  mocks.request.mockResolvedValueOnce([{ id: NOTA, title: 'Fira', publish_date: '2026-10-05T08:30:00+00:00', revision: 3 }]);
  const desada = await updateNote(NOTA, { title: 'Fira', publishDate: DATA }, 2, config);
  expect(mocks.request.mock.calls[0][2].body).toEqual({ title: 'Fira', publish_date: DATA });
  expect(desada).toMatchObject({ publishDate: DATA, revision: 3 });
  expect(desada).not.toHaveProperty('campsNoDesats');

  // Brossa o buidar: null.
  mocks.request.mockResolvedValueOnce([{ id: NOTA, publish_date: null, revision: 4 }]);
  const buidada = await updateNote(NOTA, { publishDate: 'demà' }, 3, config);
  expect(mocks.request.mock.calls[1][2].body).toEqual({ publish_date: null });
  expect(buidada.publishDate).toBeNull();

  mocks.request.mockResolvedValueOnce([{ id: NOTA, title: 'Nova', publish_date: DATA, revision: 0 }]);
  await createNote({ id: NOTA, title: 'Nova', publishDate: DATA }, config);
  expect(mocks.request.mock.calls[2][2].body).toMatchObject({ publish_date: DATA });

  mocks.request.mockResolvedValueOnce([{ id: NOTA, revision: 4, publish_date: '2026-10-05T08:30:00.123456+00:00' }]);
  expect((await loadNotes(mocks.user.id, { ...config, noteId: NOTA })).notes[0].publishDate).toBe('2026-10-05T08:30:00.123Z');
});

test('el resum no demana la columna ni inventa cap data (una base sense migració serveix el Bloc)', async () => {
  mocks.request.mockResolvedValueOnce([{ id: NOTA, title: 'Sense', revision: 1 }]);
  const pagina = await loadNotesPage({ ownerUserId: mocks.user.id }, config);
  expect(mocks.request.mock.calls[0][0]).not.toContain('publish_date');
  expect(pagina.notes[0]).not.toHaveProperty('publishDate');
});

test('sense la columna: la resta es desa, la data queda en quarantena i el DTO ho diu', async () => {
  mocks.request
    .mockRejectedValueOnce(pgrst204('publish_date'))
    .mockResolvedValueOnce([{ id: NOTA, title: 'Fira', revision: 3 }]);
  const desada = await updateNote(NOTA, { title: 'Fira', publishDate: DATA }, 2, config);
  expect(mocks.request).toHaveBeenCalledTimes(2);
  expect(mocks.request.mock.calls[1][2].body).toEqual({ title: 'Fira' });
  expect(desada).toMatchObject({ revision: 3, campsNoDesats: ['publishDate'] });
  // Recordada: només la data no fa cap petició.
  await expect(updateNote(NOTA, { publishDate: DATA }, 3, config)).rejects.toMatchObject({ name: 'ErrorColumnaAbsent', camps: ['publishDate'] });
  expect(mocks.request).toHaveBeenCalledTimes(2);
});
