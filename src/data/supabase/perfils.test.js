import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ request: vi.fn(), local: vi.fn(), user: null }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: m.request,
  getResolvedConfig: (config = {}) => ({ hasSupabaseConfig: true, runtimeDataMode: config.dataMode || 'remote', ...config }) }));
vi.mock('../localPerfils.js', () => ({ localPerfils: { loadPerfilPublic: m.local } }));
import { loadPerfilPublic, perfilDOrganitzacio, perfilDePersona } from './perfils.js';
beforeEach(() => { vi.clearAllMocks(); m.user = null; m.request.mockResolvedValue([]); m.local.mockResolvedValue({ id: 'demo' }); });

test.each(['socdepoble', '0001', '11111111-1a1a-0000-0000-000000000000'])('remot no suplix %s amb el catàleg demostratiu', async id => {
  expect(await loadPerfilPublic(id)).toBeNull();
  expect(m.local).not.toHaveBeenCalled();
});

test('només una organització confirmada pel servidor proporciona la identitat pública', async () => {
  m.request.mockResolvedValue([{ id: 'org-real', name: 'Sóc de Poble', slug: 'soc-de-poble', kind: 'company' }]);
  expect(await loadPerfilPublic('soc-de-poble')).toMatchObject({ id: 'org-real', nom: 'Sóc de Poble', tipus: 'entitat' });
});

/* T51 · Cap document sense data: la fitxa pública porta la creació i l'última
   modificació de la fila (la vista i la taula les tenen). */
test('T51 · una organització del directori porta created_at i updated_at com a creat i modificat', async () => {
  m.request.mockResolvedValue([{ id: 'org-real', name: 'Forn', slug: 'forn', kind: 'company',
    created_at: '2026-08-01T09:00:00+00:00', updated_at: '2026-09-27T17:30:00+00:00' }]);
  expect(await loadPerfilPublic('forn')).toMatchObject({ creat: '2026-08-01T09:00:00+00:00', modificat: '2026-09-27T17:30:00+00:00' });
  // Sense les columnes (una vista d'abans), res inventat.
  expect(perfilDOrganitzacio({ id: 'o', name: 'Forn' })).toMatchObject({ creat: null, modificat: null });
});

test('T51 · la fitxa pròpia (profiles) porta created_at i updated_at com a creat i modificat', async () => {
  const id = '11111111-1a1a-4000-8000-000000000000';
  m.user = { id };
  m.request.mockImplementation(async (url) => (url.includes('/profiles')
    ? [{ id, full_name: 'Pep', created_at: '2026-08-01T09:00:00+00:00', updated_at: '2026-09-27T17:30:00+00:00' }]
    : []));
  expect(await loadPerfilPublic(id)).toMatchObject({ tipus: 'persona', propietari: true, creat: '2026-08-01T09:00:00+00:00', modificat: '2026-09-27T17:30:00+00:00' });
  expect(perfilDePersona({ id, full_name: 'Pep', created_at: '', updated_at: 7 }, null)).toMatchObject({ creat: null, modificat: null });
});

/* T66 · L'emoticona de la persona (profiles.icon) arriba al DTO passada per
   emojiSol: Postgres no en valida la forma. Les organitzacions no en tenen. */
test('T66 · la fitxa pròpia porta l’emoticona triada; sense tria, brossa o sense la columna, buida', async () => {
  const id = '11111111-1a1a-4000-8000-000000000000';
  m.user = { id };
  m.request.mockImplementation(async (url) => (url.includes('/profiles') ? [{ id, full_name: 'Pep', icon: '🌾' }] : []));
  expect(await loadPerfilPublic(id)).toMatchObject({ tipus: 'persona', emoticona: '🌾' });
  expect(perfilDePersona({ id, icon: null }, null).emoticona).toBe('');
  expect(perfilDePersona({ id, icon: '🌾 i text' }, null).emoticona).toBe('');
  expect(perfilDePersona({ id }, null).emoticona).toBe('');
  expect(perfilDOrganitzacio({ id: 'o', name: 'Forn', icon: '🍞' }).emoticona).toBe('');
});

test.each(['seed', 'local'])('%s conserva el catàleg darrere del seu adaptador', async dataMode => {
  expect(await loadPerfilPublic('socdepoble', { dataMode })).toEqual({ id: 'demo' });
  expect(m.local).toHaveBeenCalledWith('socdepoble', null);
  expect(m.request).not.toHaveBeenCalled();
});
