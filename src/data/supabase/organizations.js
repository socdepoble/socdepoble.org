import { getCurrentUser, getResolvedConfig, request } from './runtime.js';
export async function listMyOrganizations(config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig || !getCurrentUser()?.id) return [];
  const rows = await request('/rest/v1/rpc/list_my_organizations', config, { method: 'POST', body: { p_tenant_id: tenantId } });
  return Array.isArray(rows) ? rows : [];
}
export async function createOrganization(organization, config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('No es pot crear una organització sense connexió al servidor.');
  if (!getCurrentUser()?.id) throw new Error('Cal iniciar sessió per crear una organització.');
  const rows = await request('/rest/v1/rpc/create_organization', config, { method: 'POST', body: { p_tenant_id: tenantId,
    p_kind: organization?.kind, p_name: organization?.name, p_slug: organization?.slug,
    p_description: organization?.description || '', p_parent_organization_id: organization?.parentOrganizationId || null } });
  return Array.isArray(rows) ? rows[0] : rows;
}
export async function updateOrganization(id, updates, config = {}) {
  const payload = {};
  const camps = { name: 'name', slug: 'slug', description: 'description', kind: 'kind',
    parentOrganizationId: 'parent_organization_id', lema: 'lema', logo_url: 'logo_url' };
  for (const [origen, desti] of Object.entries(camps)) if (updates[origen] !== undefined) payload[desti] = updates[origen];
  const rows = await request(`/rest/v1/organizations?id=eq.${encodeURIComponent(id)}`, config,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: payload });
  if (!rows?.[0]) throw new Error("No s'ha pogut actualitzar l'organització.");
  return rows[0];
}
