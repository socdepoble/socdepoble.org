import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, request: vi.fn() }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: m.request,
  getResolvedConfig: (config = {}) => ({ tenantId: '00000000-0000-4000-8000-000000000000',
    supabaseUrl: 'https://poble.test', hasSupabaseConfig: true, runtimeDataMode: config.dataMode || 'remote' }) }));
import { createOrganization } from './organizations.js';

/* F5 (ordre del Mestre, 261004; pla 2045, Marató 2230) · El cos de
   create_organization per a un grup. organizations.test.js només prova el
   d'una empresa (i és de F1): ací es fixa que la mare viatja i que p_lema no
   s'hi afig quan no ve (M01: una crida sense lema és idèntica a la d'abans).
   Fitxer propi per no trepitjar les proves de F1 en l'arbre compartit.
   Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Tota entitat creada ha de
   portar el seu poble») · Cada alta porta el poble (town_name). La RPC no en
   té paràmetre (el cos no canvia); el poble es desa tot seguit amb un PATCH a
   la mateixa fila, la segona crida, i la resposta el porta. Abans hi havia
   una sola crida i la resposta era la de la RPC tal qual.
   Revisió adversarial del Gauntlet 261016 (encàrrec C) · Abans de la RPC,
   una lectura del slug (GET organizations?select=…) mira si la persona ja en
   té una: la RPC és ara la segona crida i el PATCH la tercera. Ací la lectura
   no troba cap fila (una alta nova); organizations.alta.test.js prova la
   resta de casos. Els índexs s'han actualitzat a propòsit. */
const POBLE = '00000000-0000-4000-8000-000000000000';
const NOM_POBLE = 'La Torre de les Maçanes';
const MARE = '11111111-2222-4333-8444-555555555555';
beforeEach(() => {
  m.user = { id: 'A' };
  m.request.mockReset().mockImplementation(async (ruta) => (ruta.startsWith('/rest/v1/organizations?select=') ? [] : [{ id: 'G' }]));
});

test('un grup envia p_kind group i p_parent_organization_id, sense p_lema', async () => {
  await expect(createOrganization({ kind: 'group', name: 'Colla', slug: 'colla', parentOrganizationId: MARE, town_name: NOM_POBLE }))
    .resolves.toEqual({ id: 'G', town_name: NOM_POBLE });
  expect(m.request).toHaveBeenCalledTimes(3);
  const [ruta, , opcions] = m.request.mock.calls[1];
  expect(ruta).toBe('/rest/v1/rpc/create_organization');
  expect(opcions.method).toBe('POST');
  expect(opcions.body).toEqual({ p_tenant_id: POBLE, p_kind: 'group', p_name: 'Colla', p_slug: 'colla',
    p_description: '', p_parent_organization_id: MARE });
  /* F5 · poliment · toEqual ignora les claus amb valor undefined: un
     p_lema: undefined passaria. La clau no ha d'existir (M01). */
  expect(opcions.body).not.toHaveProperty('p_lema');
  expect(opcions.body).not.toHaveProperty('p_town_name');
  const [rutaPoble, , opcionsPoble] = m.request.mock.calls[2];
  expect(new URL(rutaPoble, 'https://poble.test').searchParams.get('id')).toBe('eq.G');
  expect(opcionsPoble).toMatchObject({ method: 'PATCH', body: { town_name: NOM_POBLE } });
});

/* Ordre del Mestre (261008, grup C) · Un grup sense mare: la RPC rep
   p_parent_organization_id null (2610081400 l'accepta) i res més canvia. */
test('grup C · un grup sense mare envia p_parent_organization_id null, sense p_lema', async () => {
  await expect(createOrganization({ kind: 'group', name: 'Colla', slug: 'colla', town_name: NOM_POBLE }))
    .resolves.toEqual({ id: 'G', town_name: NOM_POBLE });
  const { body } = m.request.mock.calls[1][2];
  expect(body).toEqual({ p_tenant_id: POBLE, p_kind: 'group', p_name: 'Colla', p_slug: 'colla',
    p_description: '', p_parent_organization_id: null });
  expect(body).not.toHaveProperty('p_lema');
});

test('un grup amb lema i descripció els envia amb la mare', async () => {
  await createOrganization({ kind: 'group', name: 'Colla', slug: 'colla', parentOrganizationId: MARE,
    lema: 'Dolçaina i tabal', description: 'La colla del poble', town_name: NOM_POBLE });
  expect(m.request.mock.calls[1][2].body).toEqual({ p_tenant_id: POBLE, p_kind: 'group', p_name: 'Colla',
    p_slug: 'colla', p_description: 'La colla del poble', p_parent_organization_id: MARE, p_lema: 'Dolçaina i tabal' });
});
