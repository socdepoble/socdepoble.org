/* Auditoria 261007 (B) · Ja no s'importa el contingut de llavor
   (data/sectionContent.js): només l'usaven SECTION_ITEMS,
   SECTION_ITEM_LOOKUPS, getSectionItems i findSectionItem, i cap pantalla,
   eina ni prova no els cridava. La llavor arriba a l'app per appSeed.js. */
import {
  CLAUS_FUNDACIONALS, ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, ENTITATS_SEED, clauFundacional, esIAIA
} from '../data/identitatsSeed.js';
import {
  esRutaInterna, objecteDePagina, rutaConnectarObjecte, rutaXatDePagina, TIPUS_OBJECTE, tipusDeSeccio
} from './objecteConnectable.js';

const PAGE_ROUTE_MAP = {
  'el-projecte': '/projecte',
  projecte: '/projecte',
  skills: '/skills',
  disseny: '/disseny',
  constitucio: '/constitucio',
  ruta: '/roadmap',
  roadmap: '/roadmap',
  /* Gauntlet 261016_1530 (Bloc 3.6.3; relleu F64) · El manifest «L'Ànima de
     la IAIA» viu a /anima: és un assaig escrit per la IAIA, no la seua fitxa.
     /iaia queda per a la fitxa (RUTA_FITXA_IAIA, davall). 'ia' és l'àlies
     històric del mateix manifest. */
  anima: '/anima',
  ia: '/anima',
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

/* Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre) · Les rutes canòniques netes
   de les tres identitats que controla el Mestre: /javillinares (la persona),
   /socdepoble (l'organització i portal central) i /rentonar (el grup de
   treball de l'associació ecologista), cadascuna amb el slug declarat de la
   seua identitat (CLAUS_FUNDACIONALS, identitatsSeed.js). Són rutes de primer
   nivell (App.jsx · ActorRoutes) que obrin el perfil públic de sempre
   (PerfilPublicSection): cap component nou. Cap no és una pàgina coneguda
   (PAGE_ROUTE_MAP) ni el primer tram d'una altra ruta: ho vigila
   navigation.canoniques.test.js. Les rutes d'abans (/gent/:id, /empresa/:id,
   /grup/:id i qualsevol àlies) obrin la mateixa fitxa: la canònica és
   l'adreça neta, la que declara el SEO. */
export const RUTES_CANONIQUES = Object.freeze(Object.fromEntries(CLAUS_FUNDACIONALS.map((clau) => [clau, `/${clau}`])));

/* Gauntlet 261016_1530 (Bloc 3.6.3; relleu F65; ordre del Mestre: «La ruta
   /iaia queda reservada per a la pròpia IAIA MarIA […], que és on s'ha
   d'accedir des del xat i des del cercador») · La fitxa pública de la IAIA
   MarIA, la de sempre (PerfilPublicSection amb el seu id, App.jsx), a una
   adreça neta de primer nivell. Com les tres de RUTES_CANONIQUES, és una
   adreça més: /perfil/<id> i /perfil/iaia-maria obrin la mateixa fitxa i
   rutaDePerfil no canvia. La clau '/iaia' del xat públic de la IAIA
   (PAGINES_AMB_XAT, data/contracte.js; el servidor, 2610042330) és la
   mateixa ruta: ara coincidix amb la seua fitxa. El manifest que hi vivia
   és ara a /anima (PAGE_ROUTE_MAP, damunt). */
export const RUTA_FITXA_IAIA = '/iaia';

/* La IAIA MarIA, per identificador i amb el tipus que toca: mai pel nom ni
   pel slug que torne un servidor (el seu id és el del paquet, IAIA_ID). */
const esLaFitxaDeLaIAIA = (perfil) => perfil?.tipus === 'ia' && esIAIA(perfil.id);

/**
 * La ruta canònica neta d'un perfil públic ({ tipus, id, slug }): la d'una de
 * les tres identitats del Mestre (RUTES_CANONIQUES) o, per a la IAIA MarIA,
 * RUTA_FITXA_IAIA (Bloc 3.6.3); null per a la resta.
 */
export const rutaCanonicaDePerfil = (perfil) => RUTES_CANONIQUES[clauFundacional(perfil)]
  || (esLaFitxaDeLaIAIA(perfil) ? RUTA_FITXA_IAIA : null);

/** Qui signa una publicació del Mur o del Mercat: { tipus, id } o null. */
export function autorDe(item) {
  if (!item) return null;
  const entitat = item.author_org_id ?? item.authorOrgId ?? item.author_entity_id ?? null;
  if (entitat) return { tipus: 'entitat', id: String(entitat) };
  const persona = item.ownerUserId ?? item.owner_user_id ?? item.author_user_id ?? item.author_id ?? null;
  if (persona) return { tipus: 'persona', id: String(persona) };
  return null;
}

/* Autoria editorial del Mur: l'entitat pilot porta al seu perfil públic; la
   resta, també al seu. El Mercat usa rutaDePerfilPublicDAutor i porta sempre
   al perfil de qui ven, també per al pilot (marató2230, pla2045).
   Es resol per identificador (id, slug o àlies), mai pel nom visible.
   Onada 8 (261009) · Derogat el /projecte de la boina: un clic a QUALSEVOL
   boina taronja porta al perfil públic de qui signa, mai a /projecte ni al
   xat. */

/** La pàgina editorial del projecte (/projecte). Ja no és cap boina (Onada 8). */
export const RUTA_PROJECTE = PAGE_ROUTE_MAP.projecte;

/** Onada 8 (261009) · El perfil públic de l'entitat pilot, pel seu slug
 *  declarat: on porta la boina de Sóc de Poble. DEFAULT_AUTHOR.href
 *  (UniversalUtils.js) l'escriu en literal; una prova en fixa la igualtat. */
export const RUTA_PERFIL_PROJECTE = rutaDePerfil('entitat', ENTITAT_PILOT_SLUG);

/* Tots els identificadors amb què signa l'entitat pilot (identitatsSeed.js). */
const IDS_DEL_PROJECTE = new Set([
  ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG,
  ...ENTITATS_SEED.filter((entitat) => entitat.id === ENTITAT_PILOT_ID).flatMap((entitat) => entitat.alies)
].map(String));

/* Una persona, un grup o un agent IA amb un id que coincidix amb un àlies de
   l'entitat no és l'entitat: només una entitat (o qui no diu el tipus) hi va. */
const TIPUS_D_ENTITAT = new Set(['entitat', 'empresa', '', undefined, null]);

/* T6 en remot (revisió del front «nucli», 261004) · Al servidor, l'id de
   l'entitat pilot no és el de la llavor (xatCorporatiu.js): és el que li
   dona el proveïdor, un UUID a Supabase (section_submissions.author_org_id).
   La llavor no el pot saber. La font única és el slug declarat
   (ENTITAT_PILOT_SLUG, identitatsSeed.js; ordre del Mestre del 261007:
   'socdepoble', el mateix text que l'id de la llavor): quan el backend
   torna una entitat amb eixe slug, el seu id passa a ser un identificador
   del projecte. Mai pel nom. Qui pinta boines i vol tornar a pintar quan
   l'id arriba, escolta
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
   passat ESPERA_DESPRES_DE_FALLADA_MS. La mateixa espera la fa servir el xat
   privat amb Sóc de Poble (control/xatCorporatiu.js), que resol la mateixa
   entitat pel mateix port. */
const FALLADES_DEL_PROJECTE = new Map();
export const ESPERA_DESPRES_DE_FALLADA_MS = 60_000;

const esIdDelProjecte = (id) => IDS_DEL_PROJECTE.has(id) || IDS_REMOTS_DEL_PROJECTE.has(id);

function avisaDelProjecte() {
  versioDelProjecte += 1;
  ESCOLTES_DEL_PROJECTE.forEach((escolta) => escolta());
}

/**
 * Reconeix l'entitat pilot en una entitat que torna el backend, amb la forma
 * de loadPerfilPublic ({ tipus, id, slug }): si és una entitat i el seu slug
 * és el declarat, el seu id porta a RUTA_PERFIL_PROJECTE. Torna cert si ho és.
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

/* Onada 8 (261009) · L'entitat pilot, per identificador (mai pel nom): una
   entitat, o qui no diu el tipus, amb un id de la llavor o un de remot ja
   registrat. La lligen la boina (rutaDAutoria) i «En privat» (objecteDe). */
function esAutorDelProjecte(autor) {
  const id = autor?.id == null ? '' : String(autor.id);
  return Boolean(id) && TIPUS_D_ENTITAT.has(autor.tipus) && esIdDelProjecte(id);
}

/**
 * Gauntlet 261016_1530 (Bloc 3.6; relleu F57, F58 i F61) · Cert si
 * `identitat` ({ tipus, id }: el subjecte d'un fil o l'altra part d'un
 * directe) és l'entitat pilot, amb el tipus declarat i per identificador:
 * els de la llavor o el remot que ja ha registrat el backend. Mai pel nom.
 * El Xat hi reconeix la comunitat de Sóc de Poble i la seua capçalera.
 */
export const esEntitatDelProjecte = (identitat) => TIPUS_DECLARATS_D_ENTITAT.has(identitat?.tipus)
  && esAutorDelProjecte(identitat);

/** Cert si el backend remot ja ha donat l'id de l'entitat pilot (registraEntitatDelProjecte). */
export const coneixIdRemotDelProjecte = () => IDS_REMOTS_DEL_PROJECTE.size > 0;

/**
 * Ruta de la pàgina de qui signa ({ tipus, id }): RUTA_PERFIL_PROJECTE per a
 * l'entitat pilot (pels ids de la llavor o pel remot que ha tornat el
 * backend), rutaDePerfil per a la resta, o null si no se sap qui és.
 * Onada 8 (261009) · El pilot va al seu perfil pel slug declarat, el mateix
 * en llavor i en remot: abans anava a /projecte.
 */
export function rutaDAutoria(autor) {
  const id = autor?.id == null ? '' : String(autor.id);
  if (!id) return null;
  if (esAutorDelProjecte(autor)) return RUTA_PERFIL_PROJECTE;
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

/* Onada 8 (261009) · «En privat» obri el xat amb l'autor (useAccions), i el
   de Sóc de Poble és el canal del projecte (useXatSocDePoble): `projecte`
   diu que l'autor, o el perfil, és l'entitat pilot, per id, àlies o UUID
   registrat. Només hi és quan és cert: la resta de descriptors no canvien.
   Pedra Seca ho llig sense importar la llavor. */
const marcaDelProjecte = (identitat) => (esAutorDelProjecte(identitat) ? { projecte: true } : null);

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
    autor: autor || nom ? { tipus: autor?.tipus || '', id: autor?.id || '', nom, ...marcaDelProjecte(autor) } : null
  };
}

/** Descriptor d'un perfil públic: persona, entitat, grup o IA. Sense id, null. */
export function objecteDePerfil(perfil) {
  const id = text(perfil?.id);
  if (!id) return null;
  const tipus = TIPUS_DE_PERFIL.has(perfil.tipus) ? perfil.tipus
    : (perfil.tipus === 'empresa' ? 'entitat' : 'persona');
  return {
    tipus, id, titol: text(perfil.nom || perfil.name), seccio: 'perfil', ruta: rutaDePerfil(tipus, id), autor: null,
    ...marcaDelProjecte({ tipus, id })
  };
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
  /* Onada 0.3 (Gauntlet 261016, M07; pla 261016_1530: «Qualsevol referència o
     enllaç a un poble ha de redirigir a la seua pàgina canònica
     /pobles/[slug]») · La foto d'un poble porta a l'article del poble, mai a
     /multimedia/town-<slug>: pel seu `article` (mediaContent.js ·
     fotosDelsPobles) o, en una fila vella sense article, pel prefix de l'id. */
  if (sectionId === 'multimedia') {
    const article = item.article;
    if (article?.sectionId === 'pobles' && article.id != null && String(article.id) !== '') return getSectionItemPath('pobles', article.id);
    const id = String(item.id);
    if (id.startsWith('town-') && id.length > 'town-'.length) return getSectionItemPath('pobles', id.slice('town-'.length));
  }
  return getSectionItemPath(sectionId, item.id);
};
