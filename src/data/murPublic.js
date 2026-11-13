import { elementDeFilaPublicada } from './mapejadorSeccions.js';
import { projeccioCatalegDe } from './projeccionsCataleg.js';

const text = value => typeof value === 'string' ? value : '';
/** DTO públic: cap spread de fila/payload extern, cap identitat ni mitjà cru. */
export function elementDeMurPublic(row, sectionId) {
  const payload = { sectionId, type: ({ mur: 'feed', mercat: 'product', events: 'event', multimedia: 'media' })[sectionId],
    title: text(row.title), description: text(row.description), content: text(row.public_content) };
  const item = elementDeFilaPublicada({ id: text(row.id), payload, titol: text(row.title),
    createdAt: text(row.created_at), updatedAt: text(row.updated_at), sectionId });
  item._murPublic = true;
  item.author_name = 'Autoria no publicada';
  item.author_location = 'Poble no indicat';
  item.copyright = 'Llicència no publicada'; // Cap llicència s'inferix de la projecció mínima.
  if (typeof row.catalog_font === 'string' && typeof row.catalog_id === 'string' && Array.isArray(row.catalog_destins)
      && row.catalog_destins.length <= 9 && row.catalog_destins.every(d => typeof d === 'string')) {
    const candidate = { ...item, sectionId, _projeccioPublicaFiltrada: true,
      projeccioCataleg: { v: 1, font: row.catalog_font, id: row.catalog_id, destins: [...row.catalog_destins], audiencia: 'publica' },
      ...(typeof row.destinacio_workspace === 'string' ? { destinacio_workspace: row.destinacio_workspace } : {}) };
    if (projeccioCatalegDe(candidate)) return candidate;
  }
  return item;
}

/** La fila rica té autoritat de columnes, mai del payload ni d'un perfil privat. */
export function elementDeMurMembre(row, sectionId) {
  if (!row || typeof row !== 'object' || Array.isArray(row) || typeof row.id !== 'string'
      || typeof row.owner_user_id !== 'string' || row.section_id !== sectionId) {
    throw new Error('Fila de membres amb un format inesperat.');
  }
  const item = elementDeFilaPublicada({ id: row.id, payload: { ...(row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload) ? row.payload : {}), title: text(row.title), sectionId }, titol: text(row.title),
    createdAt: text(row.created_at), updatedAt: text(row.updated_at), ownerUserId: row.owner_user_id,
    authorOrgId: typeof row.author_org_id === 'string' ? row.author_org_id : null, sectionId });
  delete item._murPublic;
  item.author_name = text(row.payload?.author_name) || text(row.payload?.seller) || 'Autoria no indicada';
  item.author_location ||= 'Poble no indicat';
  item.copyright ||= 'Llicència no indicada';
  return { ...item, sectionId, _murMembre: true };
}
