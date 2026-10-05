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
   Fitxer propi per no trepitjar les proves de F1 en l'arbre compartit. */
const POBLE = '00000000-0000-4000-8000-000000000000';
const MARE = '11111111-2222-4333-8444-555555555555';
beforeEach(() => { m.user = { id: 'A' }; m.request.mockReset().mockResolvedValue([{ id: 'G' }]); });

test('un grup envia p_kind group i p_parent_organization_id, sense p_lema', async () => {
  await expect(createOrganization({ kind: 'group', name: 'Colla', slug: 'colla', parentOrganizationId: MARE }))
    .resolves.toEqual({ id: 'G' });
  expect(m.request).toHaveBeenCalledTimes(1);
  const [ruta, , opcions] = m.request.mock.calls[0];
  expect(ruta).toBe('/rest/v1/rpc/create_organization');
  expect(opcions.method).toBe('POST');
  expect(opcions.body).toEqual({ p_tenant_id: POBLE, p_kind: 'group', p_name: 'Colla', p_slug: 'colla',
    p_description: '', p_parent_organization_id: MARE });
  /* F5 · poliment · toEqual ignora les claus amb valor undefined: un
     p_lema: undefined passaria. La clau no ha d'existir (M01). */
  expect(opcions.body).not.toHaveProperty('p_lema');
});

test('un grup amb lema i descripció els envia amb la mare', async () => {
  await createOrganization({ kind: 'group', name: 'Colla', slug: 'colla', parentOrganizationId: MARE,
    lema: 'Dolçaina i tabal', description: 'La colla del poble' });
  expect(m.request.mock.calls[0][2].body).toEqual({ p_tenant_id: POBLE, p_kind: 'group', p_name: 'Colla',
    p_slug: 'colla', p_description: 'La colla del poble', p_parent_organization_id: MARE, p_lema: 'Dolçaina i tabal' });
});
