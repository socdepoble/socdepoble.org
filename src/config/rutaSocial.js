/* Pla 261028_1526 (P1-61, Fase 2) · La clau social d'una ruta: el que
   identifica el <head> d'una pàgina. Sense cap import: la lligen el client
   (useSEO i seoHead) i les eines del build (tooling/seo), amb la mateixa
   normalització que routeKey del port del servidor (social-edge.mjs).
     · Sense la barra final (l'arrel es queda '/').
     · A /wikidepoble, un sol ?item= vàlid és part de la clau: cada document
       té el seu head i el d'un no es congela per a un altre. Dos item, cap o
       un id invàlid: el camí sol. La resta de paràmetres (utm_*, categoria)
       no identifiquen cap document.
     · Decisió 2 del Mestre (261028) · La forma de camí per a compartir,
       /wikidepoble/<id>, és el mateix document: la mateixa clau que
       ?item=<id>. Així el head servit d'eixa adreça no es purga mentre l'app
       la redirigix a ?item= (App.jsx · RedireccioWikiDePoble). */
export const RUTA_WIKI = '/wikidepoble';
export const ID_DOCUMENT_WIKI = /^[a-zA-Z0-9_-]{1,180}$/;

const senseBarraFinal = (cami) => String(cami || '').replace(/\/+$/, '') || '/';

/** L'id d'un document de la Wiki si és vàlid; si no, null. */
export function idDeDocumentWiki(valor) {
  return typeof valor === 'string' && ID_DOCUMENT_WIKI.test(valor) ? valor : null;
}

/** La forma de camí d'un document de la Wiki (/wikidepoble/<id>), o null. */
export function camiDeDocumentWiki(id) {
  return idDeDocumentWiki(id) ? `${RUTA_WIKI}/${id}` : null;
}

/** La clau social de `pathname` i `search` ('?…' o ''). */
export function clauSocialDeRuta(pathname, search = '') {
  const cami = senseBarraFinal(pathname);
  if (cami.startsWith(`${RUTA_WIKI}/`)) {
    const id = idDeDocumentWiki(cami.slice(RUTA_WIKI.length + 1));
    return id ? `${RUTA_WIKI}?item=${id}` : cami;
  }
  if (cami !== RUTA_WIKI) return cami;
  let items;
  try {
    items = new URLSearchParams(String(search || '')).getAll('item');
  } catch {
    return cami;
  }
  const id = items.length === 1 ? idDeDocumentWiki(items[0]) : null;
  return id ? `${RUTA_WIKI}?item=${id}` : cami;
}
