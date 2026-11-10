import { getCurrentUser, getResolvedConfig, request } from './runtime.js';
import { capturaSessio } from '../identitat.js';
import { elementDeFilaPublicada } from '../mapejadorSeccions.js';
import { capturaConsultaProjeccionsCataleg, capturaCursorProjeccionsCataleg, creaCursorProjeccionsCataleg,
  errorProjeccioCataleg, projeccioCatalegDe } from '../projeccionsCataleg.js';

/** Read-only optional capability. Private references use the existing notes
 * RLS (owner uid); public references use Mur's existing membership policy.
 * Keyset cursor is tenant/account/audience bound, never an unchecked offset.
 */
export async function loadProjeccionsCataleg(input = {}, config = {}) {
  const query = capturaConsultaProjeccionsCataleg(input), resolved = getResolvedConfig(config), checkSession = capturaSessio();
  if (resolved.runtimeDataMode !== 'remote' || !resolved.hasSupabaseConfig || !resolved.tenantId) throw errorProjeccioCataleg('no-disponible');
  const ownerId = query.audiencia === 'privada' ? getCurrentUser()?.id?.toLowerCase() : null;
  if (query.audiencia === 'privada' && !ownerId) throw errorProjeccioCataleg('sense-sessio');
  const scope = { tenantId: resolved.tenantId.toLowerCase(), ownerId, audiencia: query.audiencia };
  const cursor = capturaCursorProjeccionsCataleg(query.cursor, scope), seccio = query.audiencia === 'privada' ? 'notes' : 'mur';
  const filters = [
    'select=id,payload,title,created_at,updated_at,owner_user_id,author_org_id,section_id',
    `tenant_id=eq.${encodeURIComponent(scope.tenantId)}`, `section_id=eq.${seccio}`,
    'payload->projeccioCataleg->>v=eq.1', `payload->projeccioCataleg->>audiencia=eq.${query.audiencia}`,
    `order=created_at.desc,id.desc`, `limit=${query.limit}`
  ];
  if (ownerId) filters.push(`owner_user_id=eq.${encodeURIComponent(ownerId)}`);
  if (cursor) filters.push(`or=${encodeURIComponent(`(created_at.lt.${cursor.instant},and(created_at.eq.${cursor.instant},id.lt.${cursor.id}))`)}`);
  const rows = await request(`/rest/v1/section_submissions?${filters.join('&')}`, config, { signal: config.signal });
  checkSession();
  if (config.signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
  if (!Array.isArray(rows) || rows.length > query.limit) throw errorProjeccioCataleg('resposta-invalida');
  const items = [], ids = new Set();
  for (const row of rows) {
    if (!row || row.section_id !== seccio || (ownerId && row.owner_user_id?.toLowerCase() !== ownerId) || ids.has(row.id)) throw errorProjeccioCataleg('resposta-invalida');
    ids.add(row.id);
    const item = { ...elementDeFilaPublicada({ id: row.id, payload: row.payload, titol: row.title, createdAt: row.created_at,
      updatedAt: row.updated_at, ownerUserId: row.owner_user_id, authorOrgId: row.author_org_id, sectionId: row.section_id }), sectionId: row.section_id };
    if (projeccioCatalegDe(item)) items.push(item);
  }
  // Even a short page may be server-capped. Only an empty page ends reading.
  const next = rows.length ? creaCursorProjeccionsCataleg({ id: rows.at(-1).id, created_at: rows.at(-1).created_at }, scope) : null;
  if (next !== null && next === query.cursor) throw errorProjeccioCataleg('cursor-sense-progres');
  return { items, cursor: next };
}
