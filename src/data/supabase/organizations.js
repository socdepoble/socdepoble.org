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
  const body = { p_tenant_id: tenantId,
    p_kind: organization?.kind, p_name: organization?.name, p_slug: organization?.slug,
    p_description: organization?.description || '', p_parent_organization_id: organization?.parentOrganizationId || null };
  /* create_organization ja accepta p_lema (M01); només s'envia si ve, i així
     una crida sense lema és idèntica a la d'abans. */
  if (organization?.lema !== undefined) body.p_lema = organization.lema;
  const rows = await request('/rest/v1/rpc/create_organization', config, { method: 'POST', body });
  return Array.isArray(rows) ? rows[0] : rows;
}
/* Només columnes amb grant de SELECT: el RETURNING de return=representation
   exigix SELECT sobre cada columna que torna, i una sola sense grant fa fallar
   tot el PATCH amb 42501. */
const COLUMNES_ORG = 'id,tenant_id,slug,name,kind,parent_organization_id,lema,description,visibility,logo_url,hero_url,presentacio_html,copyright,created_at,updated_at';
export async function updateOrganization(id, updates, config = {}) {
  const payload = {};
  const camps = { name: 'name', slug: 'slug', description: 'description', kind: 'kind',
    parentOrganizationId: 'parent_organization_id', lema: 'lema', logo_url: 'logo_url',
    visibility: 'visibility', presentacio_html: 'presentacio_html', hero_url: 'hero_url', copyright: 'copyright' };
  for (const [origen, desti] of Object.entries(camps)) if (updates?.[origen] !== undefined) payload[desti] = updates[origen];
  if (!Object.keys(payload).length) throw new Error('Cap camp de l’organització per desar.');
  /* Com updateProfile: una imatge incrustada no es desa mai a la fila (hero_url
     la rebutjaria el CHECK amb 23514; logo_url no en té cap i s'inflaria). */
  if (getResolvedConfig(config).runtimeDataMode !== 'seed'
    && [payload.logo_url, payload.hero_url].some((url) => typeof url === 'string' && url.startsWith('data:'))) {
    throw new Error('Les imatges no es desen incrustades. Puja-les amb uploadToStorage.');
  }
  const rows = await request(`/rest/v1/organizations?id=eq.${encodeURIComponent(id)}&select=${COLUMNES_ORG}`, config,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: payload });
  if (!rows?.[0]) throw new Error("No s'ha pogut actualitzar l'organització.");
  return rows[0];
}
