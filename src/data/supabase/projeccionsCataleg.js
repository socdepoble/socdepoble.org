import { getCurrentUser, getResolvedConfig, request } from './runtime.js';
import { capturaSessio } from '../identitat.js';
import { elementDeFilaPublicada } from '../mapejadorSeccions.js';
import { elementDeMurPublic, elementDeMurMembre } from '../murPublic.js';
import { capturaConsultaProjeccionsCataleg, capturaCursorProjeccionsCataleg, creaCursorProjeccionsCataleg,
  errorProjeccioCataleg, projeccioCatalegDe } from '../projeccionsCataleg.js';

/* Gauntlet R22 (dades-01) · El criteri de runtime.esRpcAbsent (moltes proves
   substituïxen runtime.js sencer): només un 404 amb PGRST202 diu que falta la funció. */
const esRpcAbsent = error => error?.status === 404 && error?.postgrestCode === 'PGRST202';

/** Read-only optional capability. Private references use the existing notes
 * RLS (owner uid); public references use the R21 filtered RPC.
 * Keyset cursor is tenant/account/audience bound, never an unchecked offset.
 * Gauntlet R22 (dades-01) · A server without the R21 RPCs (404 PGRST202)
 * degrades to what that server serves: without llig_mur_membres, the minimal
 * llig_mur_public read as a visitor; without either, the pre-R21 filtered
 * section_submissions read (the COMMIT 4 path). No other error falls back.
 * Gauntlet R22 (dades-05) · Both RPCs get p_nomes_projeccions=true: since
 * 2611122200 the server keeps only rows with a valid public catalogue marker,
 * in the WHERE and before the LIMIT, so a page no longer walks the whole Mur.
 * A 2611121430-only server has llig_mur_public without that argument (PGRST202
 * for the filtered call): it is read once more without it, and the client
 * filter below (projeccioCatalegDe) still decides on every path.
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
  const publicParams = new URLSearchParams({ p_tenant_id: scope.tenantId, p_section_id: 'mur', p_limit: String(query.limit) });
  if (cursor) { publicParams.set('p_before_created_at', cursor.instant); publicParams.set('p_before_id', cursor.id); }
  const senseFiltre = new URLSearchParams(publicParams);
  publicParams.set('p_nomes_projeccions', 'true');
  const autenticat = Boolean(getCurrentUser()?.id);
  const opcions = { signal: config.signal };
  const taula = () => request(`/rest/v1/section_submissions?${filters.join('&')}`, config, opcions);
  const rpc = (membres, filtrat = true) => request(`/rest/v1/rpc/${membres ? 'llig_mur_membres' : 'llig_mur_public'}?${filtrat ? publicParams : senseFiltre}`,
    config, { ...opcions, ...(membres ? {} : { anonim: true }) });
  /* 'membres' (sobre { lectura, files }), 'public' (llista mínima) o 'taula' (files de section_submissions). */
  let via = query.audiencia === 'publica' ? (autenticat ? 'membres' : 'public') : 'taula', data;
  try {
    data = await (via === 'taula' ? taula() : rpc(via === 'membres'));
  } catch (error) {
    if (via === 'taula' || !esRpcAbsent(error)) throw error;
    checkSession();
    try {
      /* Sense llig_mur_membres, o sense la llig_mur_public filtrada, el servidor és anterior a
         2611122200: la llig_mur_public de 2611121430 (cinc arguments), sense el filtre. */
      via = 'public'; data = await rpc(false, false);
    } catch (absent) {
      if (!esRpcAbsent(absent)) throw absent;
      checkSession();
      via = 'taula'; data = await taula();
    }
  }
  checkSession();
  if (config.signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
  const envelope = via === 'membres';
  if (envelope && !['membre', 'public'].includes(data?.lectura)) throw errorProjeccioCataleg('resposta-invalida');
  const rows = envelope ? data.files : data;
  if (!Array.isArray(rows) || rows.length > query.limit) throw errorProjeccioCataleg('resposta-invalida');
  const items = [], ids = new Set();
  for (const row of rows) {
    if (!row || row.section_id !== seccio || (ownerId && row.owner_user_id?.toLowerCase() !== ownerId) || ids.has(row.id)) throw errorProjeccioCataleg('resposta-invalida');
    ids.add(row.id);
    const item = via !== 'taula' ? (envelope && data.lectura === 'membre' ? elementDeMurMembre(row, seccio) : elementDeMurPublic(row, seccio)) : { ...elementDeFilaPublicada({ id: row.id, payload: row.payload, titol: row.title, createdAt: row.created_at,
      updatedAt: row.updated_at, ownerUserId: row.owner_user_id, authorOrgId: row.author_org_id, sectionId: row.section_id }), sectionId: row.section_id };
    if (projeccioCatalegDe(item)) items.push(item);
  }
  // Even a short page may be server-capped. Only an empty page ends reading.
  const next = rows.length ? creaCursorProjeccionsCataleg({ id: rows.at(-1).id, created_at: rows.at(-1).created_at }, scope) : null;
  if (next !== null && next === query.cursor) throw errorProjeccioCataleg('cursor-sense-progres');
  return { items, cursor: next };
}
