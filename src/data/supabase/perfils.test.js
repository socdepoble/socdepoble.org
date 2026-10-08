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

/* Ordre del Mestre (261007, prompt 261007_1628, peça C) · Un slug és únic dins
   d'un poble, no entre pobles: amb el poble actiu a la configuració, la cerca
   per slug s'hi limita; sense, la forma d'abans. L'id no es limita. */
const POBLE = '33333333-3c3c-4000-8000-000000000000';
const rutesDelDirectori = () => m.request.mock.calls.map(([ruta]) => ruta).filter((ruta) => ruta.includes('organization_directory'));

test('peça C · amb el poble actiu, la cerca per slug filtra per tenant_id', async () => {
  m.request.mockResolvedValue([{ id: 'org-real', name: 'Sóc de Poble', slug: 'socdepoble', kind: 'company' }]);
  expect(await loadPerfilPublic('socdepoble', { tenantId: POBLE })).toMatchObject({ id: 'org-real', tipus: 'entitat' });
  expect(rutesDelDirectori()).toEqual([`/rest/v1/organization_directory?select=*&slug=eq.socdepoble&tenant_id=eq.${POBLE}&limit=1`]);
});

test('peça C · sense poble a la configuració, la cerca per slug és la d’abans', async () => {
  await loadPerfilPublic('socdepoble');
  expect(rutesDelDirectori()).toEqual(['/rest/v1/organization_directory?select=*&slug=eq.socdepoble&limit=1']);
});

test('peça C · el poble i el slug van codificats: res no s’escapa de la consulta', async () => {
  await loadPerfilPublic('forn&tenant_id=eq.x', { tenantId: 'poble&slug=eq.y' });
  expect(rutesDelDirectori()).toEqual([
    '/rest/v1/organization_directory?select=*&slug=eq.forn%26tenant_id%3Deq.x&tenant_id=eq.poble%26slug%3Deq.y&limit=1'
  ]);
});

/* Esmena de la revisió adversarial de la peça C · Amb una clau en forma
   d'UUID, l'id continua sense límit (és únic a tot el servidor), però la
   meitat del slug sí que es limita al poble: el check de organizations admet
   un slug amb forma d'UUID en minúscules, i `limit=1` podia tornar l'homònim
   d'un altre poble. */
test('peça C · la cerca per id no es limita al poble; la meitat del slug, sí', async () => {
  const id = '44444444-4d4d-4000-8000-000000000000';
  await loadPerfilPublic(id, { tenantId: POBLE });
  expect(rutesDelDirectori()).toEqual([
    `/rest/v1/organization_directory?select=*&or=(id.eq.${id},and(slug.eq.${id},tenant_id.eq.${POBLE}))&limit=1`
  ]);
});

test('peça C · clau en forma d’UUID sense poble a la configuració: la cerca doble d’abans', async () => {
  const id = '44444444-4d4d-4000-8000-000000000000';
  await loadPerfilPublic(id);
  expect(rutesDelDirectori()).toEqual([`/rest/v1/organization_directory?select=*&or=(id.eq.${id},slug.eq.${id})&limit=1`]);
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

/* Auditoria 261007 (B) · El copyright d'una entitat es desa (organizations.js)
   i la vista el porta: la fitxa pública remota l'ha de llegir. Sense la
   columna (vista d'abans) o sense tria, buit, i la pàgina hi posa «© nom». */
test('contracte · una organització del directori porta el copyright triat; sense columna o sense tria, buit', async () => {
  const drets = 'CC BY-SA 4.0 · Forn de la Torre';
  expect(perfilDOrganitzacio({ id: 'o', name: 'Forn', copyright: drets }).copyright).toBe(drets);
  expect(perfilDOrganitzacio({ id: 'o', name: 'Forn' }).copyright).toBe('');
  expect(perfilDOrganitzacio({ id: 'o', name: 'Forn', copyright: null }).copyright).toBe('');
  expect(perfilDOrganitzacio({ id: 'o', name: 'Forn', copyright: '' }).copyright).toBe('');
  m.request.mockResolvedValue([{ id: 'org-real', name: 'Forn', slug: 'forn', kind: 'company', copyright: drets }]);
  expect(await loadPerfilPublic('forn')).toMatchObject({ tipus: 'entitat', copyright: drets });
});

/* Ordre del Mestre (261008, grup C) · El poble d'una organització (columna
   town_name de la vista, 2610081401): la fitxa pública el porta. Sense la
   columna (vista d'abans) o sense tria, buit com abans. */
test('grup C · una organització del directori porta el seu poble; sense columna o sense tria, buit', async () => {
  expect(perfilDOrganitzacio({ id: 'o', name: 'El Rentonar', town_name: 'La Torre de les Maçanes' }).poble).toBe('La Torre de les Maçanes');
  expect(perfilDOrganitzacio({ id: 'o', name: 'El Rentonar' }).poble).toBe('');
  expect(perfilDOrganitzacio({ id: 'o', name: 'El Rentonar', town_name: null }).poble).toBe('');
  m.request.mockResolvedValue([{ id: 'org-real', name: 'El Rentonar', slug: 'rentonar', kind: 'group', town_name: 'Relleu' }]);
  expect(await loadPerfilPublic('rentonar')).toMatchObject({ tipus: 'grup', poble: 'Relleu' });
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
