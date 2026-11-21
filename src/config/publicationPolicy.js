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

/* v1.2.18 · Gauntlet R1 (L3-01) · Els trams del camí, cadascun descodificat
   com fa el router (RouterContext · safeDecode): una sola capa i, si la
   seqüència no és vàlida, el tram cru. Primer es parteix i després es
   descodifica, com el ([^\/]+) del router: un %2F no obri cap tram nou.
   Abans, /pob%6Ces/<poble> obria la fitxa del poble i la política llegia
   'pob%6Ces', de manera que la regla anti-doorway no s'aplicava. Mirall de
   tooling/wiki/lib/publication-policy.mjs; paritat provada. */
export function tramsDeRuta(route) {
  return String(route).replace(/^\/+/, '').split(/[/?#]/).map((tram) => {
    try { return decodeURIComponent(tram); } catch { return tram; }
  });
}

/** Mirall pur de la política anti-doorway del productor; paritat provada. */
export function pobleAllowsIndex(route, attributes = {}) {
  const [section, detail] = tramsDeRuta(route);
  if (!['pobles', 'poblacio'].includes(section) || !detail) return true;
  return attributes?.contingut_local_verificat === true
    && typeof attributes.content === 'string' && Boolean(attributes.content.replace(/<[^>]*>/g, '').trim());
}
