/* T47b (ordre del Mestre, 260928) · L'emoticona de les notes (T23) en remot.
   Fitxer propi: la memòria de columnes absents és del mòdul i dura tota la
   pàgina, i les proves d'ací en depenen EN ORDRE (primer amb columna, després
   sense). */
import { beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ request: vi.fn(), user: { id: '11111111-1111-4111-8111-111111111111' } }));
vi.mock('./runtime.js', () => ({
  request: mocks.request,
  getResolvedConfig: config => ({ hasSupabaseConfig: true, runtimeDataMode: 'remote', ...config }),
  getCurrentUser: () => mocks.user,
  generateUUID: () => '22222222-2222-4222-8222-222222222222',
  ErrorSupabase: class extends Error { constructor(message, status) { super(message); this.status = status; } }
}));
import { createNote, loadNotes, updateNote } from './notes.js';

const config = { tenantId: '33333333-3333-4333-8333-333333333333' };
const NOTA = '44444444-4444-4444-8444-444444444444';
const pgrst204 = (columna) => Object.assign(new Error(
  `Supabase 400: {"code":"PGRST204","message":"Could not find the '${columna}' column of 'notes' in the schema cache"}`),
{ status: 400 });
beforeEach(() => mocks.request.mockReset());

test('amb la columna al servidor, l’emoticona viatja i torna (update, create i detall)', async () => {
  mocks.request.mockResolvedValueOnce([{ id: NOTA, title: 'Hort', icon: '🌿', revision: 3 }]);
  const desada = await updateNote(NOTA, { title: 'Hort', icon: '🌿' }, 2, config);
  const [url, , opcions] = mocks.request.mock.calls[0];
  expect(url).toContain('&revision=eq.2');
  expect(opcions.body).toEqual({ title: 'Hort', icon: '🌿' });
  expect(desada).toMatchObject({ title: 'Hort', icon: '🌿', revision: 3 });
  expect(desada).not.toHaveProperty('campsNoDesats');

  // Només un emoji: la resta es neteja com a localNotes.
  mocks.request.mockResolvedValueOnce([{ id: NOTA, icon: '', revision: 4 }]);
  await updateNote(NOTA, { icon: 'no és cap emoji' }, 3, config);
  expect(mocks.request.mock.calls[1][2].body).toEqual({ icon: '' });

  mocks.request.mockResolvedValueOnce([{ id: NOTA, title: 'Nova', icon: '🍅', revision: 0 }]);
  const creada = await createNote({ id: NOTA, title: 'Nova', icon: '🍅' }, config);
  expect(mocks.request.mock.calls[2][2].body).toMatchObject({ title: 'Nova', icon: '🍅' });
  expect(creada.icon).toBe('🍅');

  mocks.request.mockResolvedValueOnce([{ id: NOTA, revision: 4, icon: null }]);
  expect((await loadNotes(mocks.user.id, { ...config, noteId: NOTA })).notes[0].icon).toBe('');
});

test('una fila sense la columna no inventa cap emoticona', async () => {
  mocks.request.mockResolvedValueOnce([{ id: NOTA, title: 'Sense', revision: 1 }]);
  const nota = (await loadNotes(mocks.user.id, { ...config, noteId: NOTA })).notes[0];
  expect(nota).not.toHaveProperty('icon');
});

test('sense la columna: PGRST204 no rebutja el desat, la resta s’envia amb la mateixa revisió i el DTO ho diu', async () => {
  mocks.request
    .mockRejectedValueOnce(pgrst204('icon'))
    .mockResolvedValueOnce([{ id: NOTA, title: 'Hort', revision: 3 }]);
  const desada = await updateNote(NOTA, { title: 'Hort', icon: '🌿' }, 2, config);
  expect(mocks.request).toHaveBeenCalledTimes(2);
  const [[url1, , primer], [url2, , segon]] = mocks.request.mock.calls;
  expect(url2).toBe(url1);
  expect(primer.body).toEqual({ title: 'Hort', icon: '🌿' });
  expect(segon.body).toEqual({ title: 'Hort' });
  expect(desada).toMatchObject({ title: 'Hort', revision: 3, campsNoDesats: ['icon'] });
});

test('recordada la columna absent: cap petició fallida més, i només l’emoticona no fa cap petició', async () => {
  mocks.request.mockResolvedValueOnce([{ id: NOTA, lead: 'Entradilla', revision: 4 }]);
  const desada = await updateNote(NOTA, { lead: 'Entradilla', icon: '🍅' }, 3, config);
  expect(mocks.request).toHaveBeenCalledTimes(1);
  expect(mocks.request.mock.calls[0][2].body).toEqual({ lead: 'Entradilla' });
  expect(desada.campsNoDesats).toEqual(['icon']);

  await expect(updateNote(NOTA, { icon: '🍅' }, 4, config)).rejects.toMatchObject({ name: 'ErrorColumnaAbsent', camps: ['icon'] });
  expect(mocks.request).toHaveBeenCalledTimes(1);

  // Crear una nota amb emoticona tampoc falla: es crea sense i ho diu.
  mocks.request.mockResolvedValueOnce([{ id: NOTA, title: 'Nova', revision: 0 }]);
  const creada = await createNote({ id: NOTA, title: 'Nova', icon: '🍅' }, config);
  expect(mocks.request.mock.calls[1][2].body).not.toHaveProperty('icon');
  expect(creada.campsNoDesats).toEqual(['icon']);
});

test('un PGRST204 d’una columna que no és opcional continua rebutjant el desat', async () => {
  mocks.request.mockRejectedValueOnce(pgrst204('title'));
  await expect(updateNote(NOTA, { title: 'T' }, 1, config)).rejects.toThrow("'title'");
  expect(mocks.request).toHaveBeenCalledTimes(1);
});
