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
import { estatPerAlEditor } from '../../sections/notes/useEstatDesamentNota.js';

const config = { tenantId: '33333333-3333-4333-8333-333333333333' };
const NOTA = '44444444-4444-4444-8444-444444444444';
beforeEach(() => mocks.request.mockReset());

test('IDEA-70 · crear, actualitzar i carregar la variant de nit; llevar-la conserva el dia', async () => {
  mocks.request.mockResolvedValueOnce([{ id: NOTA, logo_image: '/assets/dia.png', logo_image_dark: '/assets/nit.png', revision: 0 }]);
  expect(await createNote({ id: NOTA, logoImageDark: '/assets/nit.png' }, config))
    .toMatchObject({ logoImageDark: '/assets/nit.png' });
  expect(mocks.request.mock.calls[0][2].body.logo_image_dark).toBe('/assets/nit.png');
  mocks.request.mockResolvedValueOnce([{ id: NOTA, logo_image: '/assets/dia.png', logo_image_dark: '', revision: 1 }]);
  expect(await updateNote(NOTA, { logoImageDark: '' }, 0, config))
    .toMatchObject({ logoImage: '/assets/dia.png', logoImageDark: '' });
  expect(mocks.request.mock.calls[1][2].body).toEqual({ logo_image_dark: '' });
  mocks.request.mockResolvedValueOnce([{ id: NOTA, logo_image_dark: '/assets/nit.png', revision: 1 }]);
  expect((await loadNotes(mocks.user.id, { ...config, noteId: NOTA })).notes[0].logoImageDark).toBe('/assets/nit.png');
});

test('un servidor antic no inventa el camp i no trenca la càrrega dels resums', async () => {
  mocks.request.mockResolvedValueOnce([{ id: NOTA, revision: 1 }]);
  expect((await loadNotes(mocks.user.id, { ...config, noteId: NOTA })).notes[0]).not.toHaveProperty('logoImageDark');
  mocks.request.mockResolvedValueOnce([{ id: NOTA, revision: 1 }]);
  await loadNotes(mocks.user.id, config);
  expect(mocks.request.mock.calls[1][0].split('&')[0]).not.toContain('logo_image_dark');
});

test('sense columna, la resta es desa a la mateixa revisió i el logotip queda explícitament pendent al dispositiu', async () => {
  mocks.request.mockRejectedValueOnce(Object.assign(new Error(
    'Supabase 400: {"code":"PGRST204","message":"Could not find the \'logo_image_dark\' column of \'notes\' in the schema cache"}'
  ), { status: 400 })).mockResolvedValueOnce([{ id: NOTA, title: 'Forn', revision: 2 }]);
  const saved = await updateNote(NOTA, { title: 'Forn', logoImageDark: '/assets/nit.png' }, 1, config);
  expect(mocks.request.mock.calls[0][0]).toBe(mocks.request.mock.calls[1][0]);
  expect(mocks.request.mock.calls[1][2].body).toEqual({ title: 'Forn' });
  expect(saved.campsNoDesats).toEqual(['logoImageDark']);
  expect(estatPerAlEditor({ estat: 'error', quarantena: saved.campsNoDesats }))
    .toEqual({ estat: 'error', detall: 'El servidor encara no pot guardar el logotip de mode nit: es guarda en este dispositiu.' });
  await expect(updateNote(NOTA, { logoImageDark: '' }, 2, config))
    .rejects.toMatchObject({ name: 'ErrorColumnaAbsent', camps: ['logoImageDark'] });
});
