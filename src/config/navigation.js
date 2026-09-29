import { EVENTS, FEED_POSTS, MARKET_ITEMS, MEDIA_ITEMS, NOTES, TOWNS } from '../data/sectionContent.js';
import {
  esRutaInterna, objecteDePagina, rutaConnectarObjecte, rutaXatDePagina, TIPUS_OBJECTE, tipusDeSeccio
} from './objecteConnectable.js';

const SECTION_ITEMS = {
  mur: FEED_POSTS,
  mercat: MARKET_ITEMS,
  events: EVENTS,
  pobles: TOWNS,
  multimedia: MEDIA_ITEMS,
  notes: NOTES,
};

const SECTION_ITEM_LOOKUPS = Object.fromEntries(
  Object.entries(SECTION_ITEMS).map(([sectionId, items]) => [
    sectionId,
    new Map(items.map((item) => [String(item.id), item]))
  ])
);

const PAGE_ROUTE_MAP = {
  'el-projecte': '/projecte',
  projecte: '/projecte',
  skills: '/skills',
  disseny: '/disseny',
  constitucio: '/constitucio',
  ruta: '/roadmap',
  roadmap: '/roadmap',
  anima: '/ia',
  ia: '/ia',
  legal: '/legal',
  versions: '/versions'
};
const KNOWN_PAGE_SLUGS = new Set(Object.keys(PAGE_ROUTE_MAP));

/** Ruta canònica d'una pàgina de text coneguda, o null (W01). */
export const resolvePageSlugPath = (slug) =>
  (KNOWN_PAGE_SLUGS.has(String(slug)) ? PAGE_ROUTE_MAP[String(slug)] : null);

const getBasePath = () => '';

export const getSectionItemPath = (sectionId, itemId) => {
  const base = getBasePath();
  if (sectionId === 'xat') {
    return `${base}/xat/${encodeURIComponent(String(itemId))}`;
  }
  return `${base}/${sectionId}/${encodeURIComponent(String(itemId))}`;
};

export const getSectionListPath = (sectionId) => {
  const base = getBasePath();
  return sectionId === 'xat' ? `${base}/xat` : `${base}/${sectionId}`;
};

/* ── Lògica d'Usuari (T4, T5) ─────────────────────────────────────────────
   Una sola font per a les rutes de perfil públic i de Connectar. */

/** Ruta del perfil públic d'una identitat: persona, entitat, grup o agent IA. */
export const rutaDePerfil = (tipus, id) => {
  if (id == null || String(id) === '') return null;
  const clau = encodeURIComponent(String(id));
  if (tipus === 'entitat' || tipus === 'empresa') return `/empresa/${clau}`;
  if (tipus === 'grup') return `/grup/${clau}`;
  if (tipus === 'ia') return `/perfil/${clau}`;
  return `/gent/${clau}`;
};

/** Qui signa una publicació del Mur o del Mercat: { tipus, id } o null. */
export function autorDe(item) {
  if (!item) return null;
  const entitat = item.author_org_id ?? item.authorOrgId ?? item.author_entity_id ?? null;
  if (entitat) return { tipus: 'entitat', id: String(entitat) };
  const persona = item.ownerUserId ?? item.owner_user_id ?? item.author_user_id ?? item.author_id ?? null;
  if (persona) return { tipus: 'persona', id: String(persona) };
  return null;
}

/** Ruta del perfil de qui signa una publicació, o null si no se sap qui és. */
export const rutaDePerfilDAutor = (item) => {
  const autor = autorDe(item);
  return autor ? rutaDePerfil(autor.tipus, autor.id) : null;
};

/* ── T43 (ordre del Mestre, 260928) · L'objecte connectable ──────────────
   Un sol model per a tots els «Connectar»: un descriptor pur
     { tipus, id, titol, seccio?, ruta, autor? }
   amb `tipus` de la llista tancada de origenNota.js. Funcions pures, sense
   React ni xarxa. La part que no necessita dades viu a objecteConnectable.js
   (la barra blava no ha d'arrossegar la llavor) i es reexporta ací. Les
   carpetes, categories i etiquetes del workspace són tipus vàlids però encara
   no tenen cap ruta de destí (el Bloc només entén ?nota=): no se n'inventa.
   T63.2 · El mateix descriptor diu on porta «Comentar» (rutaXatDePagina):
   la porta de les seccions també és esta. */
export { esRutaInterna, objecteDePagina, rutaConnectarObjecte, rutaXatDePagina, TIPUS_OBJECTE, tipusDeSeccio };

const TIPUS_DE_PERFIL = new Set(['persona', 'entitat', 'grup', 'ia']);

const text = (valor) => (valor == null ? '' : String(valor));

/** Descriptor d'un element d'una secció. Una secció desconeguda és una 'pagina'. */
export function objecteDe(item, seccio) {
  if (!item) return null;
  const id = text(item.id);
  const ruta = seccio && id ? getSectionItemPath(seccio, id) : '';
  const autor = autorDe(item);
  const nom = text(item.author_name || item.seller || item.author);
  return {
    tipus: tipusDeSeccio(seccio) || 'pagina',
    id,
    titol: text(item.title || item.name),
    seccio: seccio ? String(seccio) : '',
    ruta: esRutaInterna(ruta) ? ruta : '',
    autor: autor || nom ? { tipus: autor?.tipus || '', id: autor?.id || '', nom } : null
  };
}

/** Descriptor d'un perfil públic: persona, entitat, grup o IA. Sense id, null. */
export function objecteDePerfil(perfil) {
  const id = text(perfil?.id);
  if (!id) return null;
  const tipus = TIPUS_DE_PERFIL.has(perfil.tipus) ? perfil.tipus
    : (perfil.tipus === 'empresa' ? 'entitat' : 'persona');
  return { tipus, id, titol: text(perfil.nom || perfil.name), seccio: 'perfil', ruta: rutaDePerfil(tipus, id), autor: null };
}

/* La inversa exacta de rutaDePerfil: el prefix que ella escriu per a cada tipus. */
const TIPUS_DE_PREFIX = Object.freeze({ gent: 'persona', empresa: 'entitat', grup: 'grup', perfil: 'ia' });

/**
 * T63.2 · El descriptor d'un perfil a partir de la ruta que en fa rutaDePerfil
 * (/gent/:id, /empresa/:id, /grup/:id, /perfil/:id), o null si no n'és cap.
 * Només val per a rutes fetes amb rutaDePerfil (el directori): a la fitxa
 * pública el prefix és orientatiu i l'id pot ser un slug.
 */
export function objecteDeRutaDePerfil(ruta, nom = '') {
  const trossos = /^\/(gent|empresa|grup|perfil)\/([^/?#]+)$/.exec(typeof ruta === 'string' ? ruta : '');
  if (!trossos) return null;
  let id;
  try { id = decodeURIComponent(trossos[2]); } catch { return null; }
  return objecteDePerfil({ tipus: TIPUS_DE_PREFIX[trossos[1]], id, nom });
}

/**
 * T43 (ordre del Mestre, 260928) · Connectar una fitxa de perfil (la pública
 * o la del directori): el seu descriptor i, per a una entitat o un grup,
 * `organitzacio=ID`, el paràmetre del lent d'administrar organitzacions.
 * Un sol camí per a la mateixa entitat, vinga d'on vinga. Sense id, null.
 */
export function rutaConnectarPerfil(perfil) {
  const objecte = objecteDePerfil(perfil);
  if (!objecte) return null;
  const organitzacio = objecte.tipus === 'entitat' || objecte.tipus === 'grup' ? objecte.id : null;
  return rutaConnectarObjecte(objecte, { organitzacio });
}

/** Ruta de Connectar amb tot el que la connexió necessita recordar (origen de la nota). */
export function rutaConnectar(item, sectionId) {
  return rutaConnectarObjecte(objecteDe(item, sectionId));
}

export const getSectionItems = (sectionId) => SECTION_ITEMS[sectionId] || [];

export const findSectionItem = (sectionId, itemId) =>
  SECTION_ITEM_LOOKUPS[sectionId]?.get(String(itemId)) || null;

export const resolveItemPath = (item) => {
  if (!item) return null;

  if (item.type === 'page' && item.slug) {
    if (KNOWN_PAGE_SLUGS.has(item.slug)) {
      return PAGE_ROUTE_MAP[item.slug] || '/projecte';
    }
    return `/page/${encodeURIComponent(String(item.slug))}`;
  }

  const type = String(item.type || '').toLowerCase();
  if (['agent', 'person', 'user', 'profile', 'gent'].includes(type)) return `/gent/${encodeURIComponent(String(item.id))}`;
  if (['empresa', 'official', 'entitat', 'entity', 'organization'].includes(type)) return `/empresa/${encodeURIComponent(String(item.id))}`;
  if (['ajuntament', 'cityhall', 'townhall'].includes(type)) return `/ajuntament/${encodeURIComponent(String(item.id))}`;
  if (['grup', 'group'].includes(type)) return `/grup/${encodeURIComponent(String(item.id))}`;

  const sectionId = item?.sectionId;
  if (!sectionId || item?.id == null) return null;
  return getSectionItemPath(sectionId, item.id);
};
