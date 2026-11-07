/** Criteri públic per al navegador (/pobles · clauDelPoble.js). Sense I/O.
 * Arbitratge R11 (R37-L2-01) · És una CÒPIA: la font de veritat dels
 * exportadors continua a tooling (publicMetadata a
 * tooling/wiki/lib/publication-policy.mjs, esPublicada a
 * tooling/seo/projeccio-publica.mjs), perquè la imatge del bot, els fixtures
 * de fortificacio/documental i el manifest social no depenguen de src/.
 * publicationPolicy.test.js en fixa la paritat: un canvi d'un costat sense
 * l'altre la fa fallar. */
const ESTATS_PUBLICATS = new Set(['published', 'publicat', 'publicada']);

export function publicMetadata(attributes = {}) {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return false;
  if (Object.hasOwn(attributes, 'visibility') && attributes.visibility !== 'public') return false;
  return !['arxivat', 'quarantena'].includes(attributes.status);
}

/** Mateix criteri històric de la projecció SEO: legacy sense status admès;
 * un status explícit ha de declarar publicació, mai esborrany o retirada. */
export function esPublicada(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item) || !publicMetadata(item)) return false;
  return item.status === undefined || ESTATS_PUBLICATS.has(item.status);
}
