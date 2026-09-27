import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, tenantId: 'T', request: vi.fn() }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: m.request,
  getResolvedConfig: (config = {}) => ({ tenantId: m.tenantId, hasSupabaseConfig: true, runtimeDataMode: config.dataMode || 'remote' }) }));
import { createOrganization, listMyOrganizations, updateOrganization } from './organizations.js';

/* Les columnes amb grant de SELECT (M01 + F1). Cap més: el RETURNING les demana totes. */
const COLUMNES = ['id', 'tenant_id', 'slug', 'name', 'kind', 'parent_organization_id', 'lema', 'description',
  'visibility', 'logo_url', 'hero_url', 'presentacio_html', 'copyright', 'created_at', 'updated_at'];
beforeEach(() => { m.user = { id: 'A' }; m.tenantId = 'T'; m.request.mockReset(); m.request.mockResolvedValue([{ id: 'O' }]); });

test('updateOrganization mapeja els camps nous de la fitxa i conserva els d’abans', async () => {
  await updateOrganization('O', { name: 'Cooperativa', lema: 'Del camp a casa', logo_url: 'https://x.test/l.png',
    parentOrganizationId: 'P', visibility: 'public', presentacio_html: '<p>Hola</p>', hero_url: 'https://x.test/h.png' });
  const [, , opcions] = m.request.mock.calls[0];
  expect(opcions.method).toBe('PATCH');
  expect(opcions.headers).toEqual({ Prefer: 'return=representation' });
  expect(opcions.body).toEqual({ name: 'Cooperativa', lema: 'Del camp a casa', logo_url: 'https://x.test/l.png',
    parent_organization_id: 'P', visibility: 'public', presentacio_html: '<p>Hola</p>', hero_url: 'https://x.test/h.png' });
});
test('el RETURNING només demana columnes amb grant de SELECT', async () => {
  await updateOrganization('O/1', { name: 'Nom' });
  const url = new URL(m.request.mock.calls[0][0], 'https://example.test');
  expect(url.pathname).toBe('/rest/v1/organizations');
  expect(url.searchParams.get('id')).toBe('eq.O/1');
  expect(url.searchParams.get('select').split(',')).toEqual(COLUMNES);
});
test('un valor buit es desa; un camp absent o desconegut no viatja', async () => {
  await updateOrganization('O', { lema: '', presentacio_html: undefined, rol: 'owner' });
  expect(m.request.mock.calls[0][2].body).toEqual({ lema: '' });
});
for (const [nom, updates] of [['buit', {}], ['desconegut', { rol: 'owner' }], ['undefined', { name: undefined }], ['absent', undefined]]) {
  test(`sense cap camp conegut (${nom}) llança sense cridar el servidor`, async () => {
    await expect(updateOrganization('O', updates)).rejects.toThrow('Cap camp');
    expect(m.request).not.toHaveBeenCalled();
  });
}
test('una imatge incrustada (data:) no s’envia, ni com a logotip ni com a capçalera', async () => {
  await expect(updateOrganization('O', { logo_url: 'data:image/png;base64,AAAA' })).rejects.toThrow('no es desen incrustades');
  await expect(updateOrganization('O', { name: 'Forn', hero_url: 'data:image/webp;base64,AAAA' })).rejects.toThrow('no es desen incrustades');
  expect(m.request).not.toHaveBeenCalled();
});
test('sense fila confirmada no anuncia èxit', async () => {
  m.request.mockResolvedValueOnce([]);
  await expect(updateOrganization('O', { name: 'Nom' })).rejects.toThrow("No s'ha pogut actualitzar");
});

test('createOrganization envia p_lema només si ve', async () => {
  m.request.mockResolvedValue([{ id: 'O' }]);
  await createOrganization({ kind: 'company', name: 'Forn', slug: 'forn' });
  expect(m.request.mock.calls[0][2].body).not.toHaveProperty('p_lema');
  await createOrganization({ kind: 'company', name: 'Forn', slug: 'forn', lema: 'Pa de llenya' });
  expect(m.request.mock.calls[1][0]).toBe('/rest/v1/rpc/create_organization');
  expect(m.request.mock.calls[1][2].body).toEqual({ p_tenant_id: 'T', p_kind: 'company', p_name: 'Forn', p_slug: 'forn',
    p_description: '', p_parent_organization_id: null, p_lema: 'Pa de llenya' });
});
test('createOrganization sense sessió no crida el servidor', async () => {
  m.user = null;
  await expect(createOrganization({ name: 'Forn' })).rejects.toThrow('Cal iniciar sessió');
  expect(m.request).not.toHaveBeenCalled();
});
test.each(['seed', 'local'])('crear organització en %s no escriu al servidor real', async dataMode => {
  await expect(createOrganization({ kind: 'company', name: 'Sóc de Poble', slug: 'soc-de-poble' }, { dataMode }))
    .rejects.toThrow('formulari d’entrada');
  expect(m.request).not.toHaveBeenCalled();
});

test('createOrganization rebutja el tenant diferent del que ha enviat realment', async () => {
  m.request.mockResolvedValue({ id: 'O', tenant_id: 'un-altre-poble' });
  await expect(createOrganization({ kind: 'company', name: 'Forn', slug: 'forn' }, {})).rejects.toThrow('altre poble');
  expect(m.request.mock.calls[0][2].body.p_tenant_id).toBe('T');
});

test('createOrganization accepta el tenant confirmat i una resposta parcial sense tenant', async () => {
  for (const resposta of [{ id: 'O', tenant_id: 'T' }, { id: 'O' }]) {
    m.request.mockResolvedValueOnce([resposta]);
    expect(await createOrganization({ kind: 'company', name: 'Forn', slug: 'forn' })).toEqual(resposta);
  }
});

test('el tenant UUID és el mateix encara que PostgreSQL el retorne en minúscules', async () => {
  m.tenantId = 'AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA';
  const resposta = { id: 'O', tenant_id: m.tenantId.toLowerCase() };
  m.request.mockResolvedValue(resposta);
  expect(await createOrganization({ kind: 'company', name: 'Forn', slug: 'forn' })).toEqual(resposta);
});

test('listMyOrganizations torna les files tal qual, amb les columnes noves', async () => {
  const fila = { id: 'O', name: 'Forn', logo_url: 'https://x.test/l.png', hero_url: null, presentacio_html: '' };
  m.request.mockResolvedValueOnce([fila]);
  expect(await listMyOrganizations()).toEqual([fila]);
  expect(m.request.mock.calls[0][2].body).toEqual({ p_tenant_id: 'T' });
  m.user = null;
  expect(await listMyOrganizations()).toEqual([]);
  expect(m.request).toHaveBeenCalledTimes(1);
});
