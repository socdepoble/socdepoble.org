import { EVENTS, FEED_POSTS, MARKET_ITEMS, MEDIA_ITEMS, NOTES, TOWNS } from '../data/sectionContent.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, ENTITATS_SEED } from '../data/identitatsSeed.js';
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
  anima: '/iaia',
  ia: '/iaia',
  legal: '/legal',
  versions: '/versions',
  /* T8 (261001) · la cerca i /page/fedivers van a la ruta canònica. */
  fedivers: '/fedivers'
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

/* Autoria editorial del Mur: l'entitat pilot porta a /projecte; la resta,
   al perfil públic. El Mercat usa rutaDePerfilPublicDAutor i porta sempre
   al perfil de qui ven, també per al pilot (marató2230, pla2045).
   Es resol per identificador (id, slug o àlies), mai pel nom visible. */

/** La pàgina del projecte: on porta la boina de l'entitat pilot. */
export const RUTA_PROJECTE = PAGE_ROUTE_MAP.projecte;

/* Tots els identificadors amb què signa l'entitat pilot (identitatsSeed.js). */
const IDS_DEL_PROJECTE = new Set([
  ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG,
  ...ENTITATS_SEED.filter((entitat) => entitat.id === ENTITAT_PILOT_ID).flatMap((entitat) => entitat.alies)
].map(String));

/* Una persona, un grup o un agent IA amb un id que coincidix amb un àlies de
   l'entitat no és l'entitat: només una entitat (o qui no diu el tipus) hi va. */
const TIPUS_D_ENTITAT = new Set(['entitat', 'empresa', '', undefined, null]);

/* T6 en remot (revisió del front «nucli», 261004) · Al servidor, l'entitat
   pilot no és 'socdepoble' (xatCorporatiu.js): és l'id que li dona el
   proveïdor, un UUID a Supabase (section_submissions.author_org_id). La
   llavor no el pot saber. La font única és el slug declarat
   (ENTITAT_PILOT_SLUG, identitatsSeed.js): quan el backend torna una entitat
   amb eixe slug, el seu id passa a ser un identificador del projecte. Mai pel
   nom. Qui pinta boines i vol tornar a pintar quan l'id arriba, escolta
   (subscriuEntitatDelProjecte: hooks/useEntitatDelProjecte.js). */
const IDS_REMOTS_DEL_PROJECTE = new Set();
const ESCOLTES_DEL_PROJECTE = new Set();
let versioDelProjecte = 0;

/* Només una entitat declarada pel backend pot ser el projecte. */
const TIPUS_DECLARATS_D_ENTITAT = new Set(['entitat', 'empresa']);
const MODES_LOCALS = new Set(['seed', 'local']);

/* Una resolució per abast de backend (backendScope): la promesa, en curs o resolta. */
const RESOLUCIONS_DEL_PROJECTE = new Map();
/* Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») ·
   L'hora de l'última fallada per abast. Només l'èxit es guarda per a sempre:
   una fallada (false, null o error) esborra la resolució i es torna a provar
   passat ESPERA_DESPRES_DE_FALLADA_MS. */
const FALLADES_DEL_PROJECTE = new Map();
const ESPERA_DESPRES_DE_FALLADA_MS = 60_000;

const esIdDelProjecte = (id) => IDS_DEL_PROJECTE.has(id) || IDS_REMOTS_DEL_PROJECTE.has(id);

function avisaDelProjecte() {
  versioDelProjecte += 1;
  ESCOLTES_DEL_PROJECTE.forEach((escolta) => escolta());
}

/**
 * Reconeix l'entitat pilot en una entitat que torna el backend, amb la forma
 * de loadPerfilPublic ({ tipus, id, slug }): si és una entitat i el seu slug
 * és el declarat, el seu id porta a RUTA_PROJECTE. Torna cert si ho és.
 */
export function registraEntitatDelProjecte(entitat) {
  const id = entitat?.id == null ? '' : String(entitat.id);
  if (!id || !TIPUS_DECLARATS_D_ENTITAT.has(entitat.tipus)) return false;
  if (String(entitat.slug ?? '') !== ENTITAT_PILOT_SLUG) return false;
  if (!esIdDelProjecte(id)) {
    IDS_REMOTS_DEL_PROJECTE.add(id);
    avisaDelProjecte();
  }
  return true;
}

/** Escolta els identificadors nous del projecte (per a useSyncExternalStore). */
export function subscriuEntitatDelProjecte(escolta) {
  ESCOLTES_DEL_PROJECTE.add(escolta);
  return () => { ESCOLTES_DEL_PROJECTE.delete(escolta); };
}

/** Un número que creix cada vegada que el projecte guanya un identificador. */
export const versioEntitatDelProjecte = () => versioDelProjecte;

/* El port pot no tindre la capacitat, o no estar encara a punt: cap error ací. */
function teElDirectori(port) {
  try {
    return port.teCapacitat('directori') === true;
  } catch {
    return false;
  }
}

/**
 * Resol pel port l'id remot de l'entitat pilot, com resolXatCorporatiu:
 * loadPerfilPublic amb el slug declarat i la capacitat 'directori'. Una sola
 * crida per abast de backend mentre és en curs; l'èxit val fins que l'abast
 * canvia. En llavor no cal: els ids de la llavor ja hi són. Sense abast o
 * sense la capacitat (el backend encara no és a punt), no fa res i torna null,
 * i la crida següent ho torna a provar. Pur respecte de React: el port
 * s'injecta (les proves no toquen la xarxa).
 * Higiene d'amfitrió (ordre del Mestre, 261004) · Derogat per l'ordre del
 * Mestre del 261004: «la fallada val fins que l'abast canvia». Una fallada
 * (el perfil no és el pilot, és null o el port llança) esborra la resolució
 * i apunta l'hora: durant ESPERA_DESPRES_DE_FALLADA_MS torna null sense
 * cridar res, i després ho torna a provar. Abans, un tall de xarxa en
 * arrencar deixava la boina del projecte sense ruta fins a recarregar.
 */
export function resolEntitatDelProjecte({ abast, dataMode, port, config = {} } = {}) {
  if (!abast || MODES_LOCALS.has(dataMode)) return null;
  if (RESOLUCIONS_DEL_PROJECTE.has(abast)) return RESOLUCIONS_DEL_PROJECTE.get(abast);
  const fallada = FALLADES_DEL_PROJECTE.get(abast);
  if (fallada !== undefined && Date.now() - fallada < ESPERA_DESPRES_DE_FALLADA_MS) return null;
  if (!port || !teElDirectori(port)) return null;
  const resolucio = Promise.resolve()
    .then(() => port.loadPerfilPublic(ENTITAT_PILOT_SLUG, config))
    .then((perfil) => registraEntitatDelProjecte(perfil))
    .catch(() => false)
    .then((exit) => {
      /* Només si encara és la resolució vigent (oblidaEntitatDelProjecte pot haver-la llevat). */
      if (exit !== true && RESOLUCIONS_DEL_PROJECTE.get(abast) === resolucio) {
        RESOLUCIONS_DEL_PROJECTE.delete(abast);
        FALLADES_DEL_PROJECTE.set(abast, Date.now());
      }
      return exit;
    });
  RESOLUCIONS_DEL_PROJECTE.set(abast, resolucio);
  FALLADES_DEL_PROJECTE.delete(abast);
  return resolucio;
}

/** Per a les proves: oblida els ids remots, les resolucions i les fallades. */
export function oblidaEntitatDelProjecte() {
  RESOLUCIONS_DEL_PROJECTE.clear();
  FALLADES_DEL_PROJECTE.clear();
  if (IDS_REMOTS_DEL_PROJECTE.size === 0) return;
  IDS_REMOTS_DEL_PROJECTE.clear();
  avisaDelProjecte();
}

/**
 * Ruta de la pàgina de qui signa ({ tipus, id }): RUTA_PROJECTE per a
 * l'entitat pilot (pels ids de la llavor o pel remot que ha tornat el
 * backend), rutaDePerfil per a la resta, o null si no se sap qui és.
 */
export function rutaDAutoria(autor) {
  const id = autor?.id == null ? '' : String(autor.id);
  if (!id) return null;
  if (TIPUS_D_ENTITAT.has(autor.tipus) && esIdDelProjecte(id)) return RUTA_PROJECTE;
  return rutaDePerfil(autor.tipus, id);
}

/** Ruta de la pàgina de qui signa una publicació, o null si no se sap qui és. */
export const rutaDePerfilDAutor = (item) => rutaDAutoria(autorDe(item));

/* Marató 2230 · Al Mercat, la boina obri el perfil públic de qui ven,
   també quan és l'entitat pilot. Mai se substituïx per una pàgina editorial. */
export function rutaDePerfilPublicDAutor(item) {
  const autor = autorDe(item);
  return autor ? rutaDePerfil(autor.tipus, autor.id) : null;
}

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
