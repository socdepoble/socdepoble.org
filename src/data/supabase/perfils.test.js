import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ request: vi.fn(), rpc: vi.fn(), local: vi.fn(), user: null }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: m.request, rpc: m.rpc,
  getResolvedConfig: (config = {}) => ({ hasSupabaseConfig: true, runtimeDataMode: config.dataMode || 'remote', ...config }) }));
vi.mock('../localPerfils.js', () => ({ localPerfils: { loadPerfilPublic: m.local } }));
import { loadPerfilPublic, perfilDOrganitzacio, perfilDePersona } from './perfils.js';
beforeEach(() => { vi.clearAllMocks(); m.user = null; m.request.mockResolvedValue([]); m.rpc.mockResolvedValue([]); m.local.mockResolvedValue({ id: 'demo' }); });

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
  expect(m.rpc).not.toHaveBeenCalled();
});

/* ───────── Ordre del Mestre (261002) · La fitxa d'una altra persona: RPC perfil_public ───────── */

const JO = '11111111-1a1a-4000-8000-000000000000';
const ELLA = '22222222-2b2b-4000-8000-000000000000';

test('261002 · una altra persona amb sessió: es demana a perfil_public i mai a profiles', async () => {
  m.user = { id: JO };
  m.rpc.mockResolvedValue([{ id: ELLA, full_name: 'Pepa Soler', avatar_url: 'https://img.example/pepa.webp', town_name: 'Benifallim',
    lema: 'Del Comtat', bio: 'Llauradora', is_public: true, created_at: '2026-08-01T09:00:00+00:00', updated_at: null, icon: '🌾' }]);
  const signal = new AbortController().signal;
  expect(await loadPerfilPublic(ELLA, { signal })).toMatchObject({
    tipus: 'persona', id: ELLA, nom: 'Pepa Soler', avatar: 'https://img.example/pepa.webp', poble: 'Benifallim',
    lema: 'Del Comtat', bio: 'Llauradora', publicat: true, propietari: false, emoticona: '🌾', creat: '2026-08-01T09:00:00+00:00', modificat: null
  });
  expect(m.rpc).toHaveBeenCalledTimes(1);
  expect(m.rpc).toHaveBeenCalledWith('perfil_public', { p_id: ELLA }, { signal }, { signal });
  expect(m.request.mock.calls.map(([ruta]) => ruta).some((ruta) => ruta.includes('/profiles'))).toBe(false);
});

test('261002 · la fitxa mínima (mateix poble, no publicada): nom, foto i poble, la resta buida i sense publicar', async () => {
  m.user = { id: JO };
  m.rpc.mockResolvedValue([{ id: ELLA, full_name: 'Pepa Soler', avatar_url: null, town_name: 'Benifallim', hero_url: null, lema: null,
    bio: null, presentacio_html: null, copyright: null, icon: null, is_public: false, created_at: null, updated_at: null }]);
  expect(await loadPerfilPublic(ELLA)).toEqual({
    tipus: 'persona', id: ELLA, slug: null, nom: 'Pepa Soler', avatar: '', hero: '', lema: '', bio: '', presentacioHtml: '',
    poble: 'Benifallim', esIA: false, publicat: false, propietari: false, copyright: '', creat: null, modificat: null, emoticona: ''
  });
});

test('261002 · sense fila, sense la migració (404) o amb error, null com abans; un avortament es propaga', async () => {
  m.user = { id: JO };
  m.rpc.mockResolvedValueOnce([]);
  expect(await loadPerfilPublic(ELLA)).toBeNull();
  m.rpc.mockRejectedValueOnce(Object.assign(new Error('L\'esquema requerit no està aplicat (falta "perfil_public").'), { status: 404 }));
  expect(await loadPerfilPublic(ELLA)).toBeNull();
  m.rpc.mockRejectedValueOnce(Object.assign(new Error('SDP-PERFIL-010: cal la sessió iniciada.'), { status: 403 }));
  expect(await loadPerfilPublic(ELLA)).toBeNull();
  m.rpc.mockRejectedValueOnce(new DOMException('Avortat', 'AbortError'));
  await expect(loadPerfilPublic(ELLA)).rejects.toMatchObject({ name: 'AbortError' });
});

test('261002 · sense sessió, amb un slug o amb el propi id no es pregunta a perfil_public', async () => {
  expect(await loadPerfilPublic(ELLA)).toBeNull();          // anon no té permís: ni s'intenta
  m.user = { id: JO };
  expect(await loadPerfilPublic('pepa-soler')).toBeNull();  // un slug és d'organització
  m.request.mockImplementation(async (url) => (url.includes('/profiles') ? [{ id: JO, full_name: 'Jo' }] : []));
  expect(await loadPerfilPublic(JO)).toMatchObject({ propietari: true, nom: 'Jo' });
  expect(m.rpc).not.toHaveBeenCalled();
});
