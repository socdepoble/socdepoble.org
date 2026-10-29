/* Pla 261028_1526 (P1-61, Fase 2) · El <head> d'un document de la Wiki.
   Abans, WikiDetail no en registrava cap: només la reserva de RouteSEO
   («Wiki de Poble»), amb el canonical i l'og:url de /wikidepoble per a tots
   els documents, i un cercador que pinta JS els plegava tots en un.
   Pur i carregable des de node: el client (WikiDetail) i el prerender del
   build (tooling/seo/build-social-manifest.mjs) el criden amb les mateixes
   dades (wikiManifest.items), i per això diuen el mateix.
   Un document és públic amb la semàntica de publicMetadata
   (tooling/wiki/lib/publication-policy.mjs): sense `visibility` (llegat) o
   amb 'public', i que no estiga arxivat ni en quarantena. Les eines locals,
   la documentació de la Maquinària i la Consola no són al manifest: un id
   que no hi és, o repetit, porta el head genèric sense indexar. */
import { extreuEditorial } from './parseMarkdown.js';
import { SOCIAL_IMAGES } from '../../config/socialImages.js';
import { camiDeDocumentWiki, idDeDocumentWiki } from '../../config/rutaSocial.js';
import { LIMIT_DESCRIPCIO, LIMIT_TITOL, textPla } from '../../config/metadadesSocials.js';

export const TITOL_WIKI = 'Wiki de Poble';
export const DESCRIPCIO_WIKI = 'La base de coneixement de Sóc de Poble.';

/** Cert si els atributs d'un document el deixen publicar (publicMetadata). */
export function atributsPublics(attributes) {
  if (attributes === undefined) return true;
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return false;
  if (Object.hasOwn(attributes, 'visibility') && attributes.visibility !== 'public') return false;
  return !['arxivat', 'quarantena'].includes(attributes.status);
}

/** El document públic `id` d'`items` (un de sol amb eixe id), o null. */
export function documentWikiPublic(id, items) {
  if (!idDeDocumentWiki(id) || !Array.isArray(items)) return null;
  const trobats = items.filter((candidat) => candidat?.id === id);
  return trobats.length === 1 && atributsPublics(trobats[0].attributes) ? trobats[0] : null;
}

/* R-07 (pla 261029_0216, Pas 2 i Pas 9) · Un títol humà a partir de l'id quan
   el document no té H1 ni títol propi: guions i guions baixos són espais, la
   primera lletra en majúscula i la resta tal com ve (ADR, IAIA o SEO es
   queden). Buit si l'id no té cap paraula. Lineal: una partició i una lletra. */
export function titolHumaDeId(id) {
  const paraules = String(id ?? '').split(/[-_]+/).filter(Boolean);
  return paraules.join(' ').replace(/\p{L}/u, (lletra) => lletra.toUpperCase());
}

/* El títol propi d'un document sense H1: el del manifest o dels atributs quan
   és un títol de veres. El compilador de la Wiki hi posa el nom del fitxer,
   l'id, si el frontmatter no en du: eixe no compta. */
function titolPropi(document) {
  const atributs = document.attributes || {};
  const propi = [document.title, atributs.title, atributs.name]
    .find((valor) => typeof valor === 'string' && valor.trim() && valor.trim() !== document.id);
  return propi || '';
}

/* Un títol d'una sola paraula que ve de l'id («Acta») no diu de què és la
   targeta: porta « · Wiki de Poble» darrere si cap dins de LIMIT_TITOL. No
   « · Wiki Sóc de Poble»: seoHead i social-edge ja afigen « | Sóc de Poble»
   a tot títol, i la marca eixiria dues voltes. */
function ambSufixDeWiki(titol) {
  const sufixat = `${titol} · ${TITOL_WIKI}`;
  return /\s/.test(titol) || sufixat.length > LIMIT_TITOL ? titol : sufixat;
}

/**
 * Les metadades d'un document públic: l'H1 editorial (darrere del preàmbul
 * de comentaris, si n'hi ha), si no el títol propi del manifest o dels
 * atributs, si no l'id humanitzat (titolHumaDeId) i, sense cap paraula, l'id;
 * de descripció, l'H2 que va just davall de l'H1 quan no hi ha entradeta, si
 * no la descripció del frontmatter, si no l'entradeta i, sense res,
 * «Document públic de la Wiki de Poble: <títol>.»; la imatge pròpia de
 * SOCIAL_IMAGES (`imatges`) o cap; og:type 'article'. El canonical no va
 * ací: és el de la clau de la ruta (useSEO · clauSocialDeRuta), ?item=<id>.
 */
export function metadadesDeDocumentPublic(document, { imatges = SOCIAL_IMAGES } = {}) {
  const editorial = extreuEditorial(document.content || '');
  const atributs = document.attributes || {};
  const h2 = !editorial.entradilla ? editorial.cos?.trimStart().match(/^##[ \t]+([^\n]+)/)?.[1] : null;
  const propi = editorial.titol || titolPropi(document);
  const huma = propi || titolHumaDeId(document.id) || document.id;
  const titol = propi || ambSufixDeWiki(huma);
  const descripcio = h2 || atributs.description || editorial.entradilla
    || `Document públic de la Wiki de Poble: ${huma}.`;
  return {
    title: textPla(titol, LIMIT_TITOL),
    description: textPla(descripcio, LIMIT_DESCRIPCIO),
    image: imatges && Object.hasOwn(imatges, document.id) ? imatges[document.id] : null,
    ogType: 'article',
    index: true
  };
}

/**
 * Les metadades del <head> de WikiDetail per a l'ítem que pinta (`item`) i la
 * consulta de la ruta (`search`):
 *   · sense ?item=: la portada, «Wiki de Poble», indexable;
 *   · un sol ?item= igual a l'id de l'ítem i públic a `items`: les seues;
 *   · qualsevol altra cosa (desconegut, privat, repetit, una eina): «Wiki de
 *     Poble» sense indexar, i per tant sense canonical ni og:url.
 */
export function metadadesDeDocumentWiki(item, search, items, opcions) {
  let demanats;
  try {
    demanats = new URLSearchParams(String(search || '')).getAll('item');
  } catch {
    demanats = [];
  }
  if (demanats.length === 0) return { title: TITOL_WIKI, description: DESCRIPCIO_WIKI, index: true };
  const document = demanats.length === 1 && demanats[0] === item?.id ? documentWikiPublic(item.id, items) : null;
  if (!document) return { title: TITOL_WIKI, description: DESCRIPCIO_WIKI, index: false };
  return metadadesDeDocumentPublic(document, opcions);
}

/* Decisió 2 del Mestre (261028) · Compartir un document públic envia la seua
   forma de camí, /wikidepoble/<id>: és l'adreça que el build prerenderitza
   amb el seu head (títol i imatge), i l'app la porta a ?item=<id>. La resta
   d'ítems, cap: el Compartir de sempre. */
export function rutaDeCompartirDocumentWiki(item, items) {
  const document = documentWikiPublic(item?.id, items);
  return document ? camiDeDocumentWiki(document.id) : null;
}
