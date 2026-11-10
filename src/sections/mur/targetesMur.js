/**
 * targetesMur.js — les targetes del Mur, pur: les pàgines del sistema que s'hi
 * barregen i l'instant pel qual s'ordenen.
 *
 * Ordre del Mestre, 261001 · La pàgina /calendari pinta TOTES les targetes del
 * Mur, amb la mateixa data i el mateix ordre que el Mur. Esta lògica vivia
 * dins de MurSection; ara la compartixen totes dues pàgines, i ni la llista ni
 * la pastilla no poden dir dues dates diferents en cap de les dues.
 * R51 (P0-49 / IDEA-180) · L'ordre és l'instant editorial R51
 * (momentEditorial), i la pastilla (editorial.js · dataDElement) ja no hi
 * posa l'edició: totes dues diuen publish_date o, sense, created_at.
 */
import { fontsDeLActe } from '../../components/universal/EventCard.jsx';
import { dataDeDocument } from '../../components/universal/editorial.js';
import { publicationSortKey } from '../../utils/publicationDateControl.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { esPaginaVisible, SYSTEM_PAGES } from '../../config/systemPages.js';
import { paginaPerAppNativa } from '../text/perAppNativa.js';
import { clauDePaginaPublica, etiquetesDePaginaPublica } from '../../data/taxonomia/classificacioPaginesPubliques.js';

/**
 * Les pàgines del sistema (SYSTEM_PAGES) que el Mur barreja amb les
 * publicacions, fetes targeta amb el seu copy (PAGE_COPY). Una pàgina declarada
 * i absent no es pinta: `quanFalta(clau)` deixa que qui la demana ho diga en
 * veu alta (incident del 24-09: `wikidepoble` → `skills`).
 * Ordre del Mestre (261027) · Dins de l'app nativa (`nativa`, per defecte
 * esAppNativa), les pàgines `nomesWeb` no hi són (esPaginaVisible): no falten,
 * i no avisen. El Mur, el Calendari i usePaginesDelSistema passen tots per ací.
 * Pla 261027_0845 (Guarda Nocturna), T1-06 · I el copy de cada targeta hi
 * entra passat per paginaPerAppNativa: dins de l'app, cap altra plataforma
 * mòbil al títol, al lema ni a l'entradeta (a la web, el mateix objecte).
 */
/* P0-51 · Anatomia rural ja no és cap targeta (la seua adreça porta a
   l'article per l'àlies de navigation.js); l'article del Pou de Neu és
   l'única targeta amb eixa portada al Mur i al Calendari. */
const PAGINES_PATRIMONI_MUR = Object.freeze([
  { key: 'herbari', href: '/page/herbari', isAvis: false },
  { key: 'banc-de-llavors', href: '/page/banc-de-llavors', isAvis: false },
  { key: 'rutes-de-poble', href: '/page/rutes-de-poble', isAvis: false },
  { key: 'arbres-monumentals', href: '/page/arbres-monumentals', isAvis: false }
]);

/* PRODUCCIO-02 (revisió R15b) · Nodrir la IAIA només és targeta (del Mur, del Calendari i del Bloc de
   l'entitat, que passen tots per ací) quan el build porta VITE_SDP_CURADORIA_CULTURAL=1, el mateix literal
   que encén la capacitat 'curadoriaCultural' (data/supabase/index.js). Apagada, la pàgina no recull res i la
   seua data de creació (9-11-2026) l'enlairava al capdamunt del Mur. No falta: no avisa. La ruta
   /page/nodrir-la-iaia i SYSTEM_PAGES no canvien. Es llig en cada crida perquè vi.stubEnv la governe. */
const PAGINES_AMB_CURADORIA = Object.freeze(['nodrir-la-iaia']);
export function esTargetaDelMur(clau) {
  return !PAGINES_AMB_CURADORIA.includes(clau) || import.meta.env.VITE_SDP_CURADORIA_CULTURAL === '1';
}

export function targetesDeSistema(pageCopy, { quanFalta, nativa = esAppNativa(), language = 'ca' } = {}) {
  const paginesPatrimoni = PAGINES_PATRIMONI_MUR.filter((item) => Boolean(pageCopy?.[item.key]));
  return [...SYSTEM_PAGES.filter((item) => esPaginaVisible(item.key, { nativa }) && esTargetaDelMur(item.key)), ...paginesPatrimoni].map((item) => {
    // Només documents del namespace públic; cap marker d’un post orgànic dona accés.
    if (pageCopy?.[item.key] && !clauDePaginaPublica(pageCopy[item.key], item.key)) return null;
    const data = paginaPerAppNativa(pageCopy?.[item.key], { nativa });
    if (!data) {
      quanFalta?.(item.key);
      return null;
    }
    return {
      ...data,
      labels: etiquetesDePaginaPublica(item.key, data.labels, language),
      /* T51 · La data del copy és la de CREACIÓ de la pàgina (com a
         TextSection): un dia serialitzat, que la regla pinta com el dia sol.
         No és el dia d'un acte (`date`), que dataDElement llegiria com a data
         triada i hi posaria les «02:00» de la mitjanit UTC. */
      date: undefined,
      created_at: data.date,
      id: item.key,
      isSystem: true,
      isAvis: item.isAvis,
      mainHref: item.href,
      type: 'sistema'
    };
  }).filter(Boolean);
}

/* R51 (P0-49 / IDEA-180) · PostgREST envia fins a sis decimals de segon
   («…T10:00:00.123456+00:00»); el contracte R51 n'admet tres. Es retallen als
   mil·lisegons, el mateix instant que en llig Date.parse. Només a created_at,
   la columna del servidor (R51V-05): publish_date l'escriu l'editor amb tres
   decimals, i un de quatre és invàlid com diu el contracte. Res més no
   s'adapta: un dia sol o una hora sense zona continuen sent invàlids (D-R51-5). */
const FRACCIO_LLARGA = /(\.\d{3})\d+(?=Z$|[+-]\d{2}:\d{2}$)/;

function instantR51(valor, retallaFraccio = false) {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? valor : valor.toISOString();
  return retallaFraccio && typeof valor === 'string' ? valor.replace(FRACCIO_LLARGA, '$1') : valor;
}

/**
 * R51 · L'instant editorial (ms) d'un element de secció: `publish_date` i, si
 * és absent, null o buit, `created_at` (publicationSortKey). `updated_at` no
 * hi compta: editar no puja cap peça (D-R51-1). null sense cap instant real.
 * Un valor present però invàlid NO cau a `created_at`: l'element va al final,
 * com un sense data, i en desenvolupament ho diu la consola (mai no s'amaga
 * cap targeta, T40). No llança mai: les llistes porten brossa de tota mena.
 */
export function momentEditorial(item) {
  if (!item || typeof item !== 'object') return null;
  try {
    return publicationSortKey({ publish_date: instantR51(item.publish_date), created_at: instantR51(item.created_at, true) });
  } catch (error) {
    if (import.meta.env.DEV) avisaUnaVegada(`${error?.code || 'R51_PUBLICATION_DATE_INVALID'}: ${item.type ?? ''}-${item.id ?? ''}`);
    return null;
  }
}

/* En desenvolupament, un avís per element i codi (el Mur es recalcula sovint), amb sostre. */
const AVISATS = new Set();
function avisaUnaVegada(motiu) {
  if (AVISATS.has(motiu) || AVISATS.size >= 500) return;
  AVISATS.add(motiu);
  console.warn(`[R51] ${motiu} va al final del Mur.`);
}

/**
 * T5 i R51 · L'instant (ms) pel qual s'ordena una targeta. Un acte del model,
 * el del seu inici (EventCard · fontsDeLActe), fins que el Mestre decidisca
 * D-R51-3; la resta, i un acte amb la boina de publicació, l'instant
 * editorial R51 (momentEditorial). null sense cap data real: no se n'inventa
 * cap per a ordenar.
 */
export function momentDeLaTargeta(item, esdeveniment) {
  if (!esdeveniment || item?.boinaDataPublicacio === true) return momentEditorial(item);
  return dataDeDocument(fontsDeLActe(esdeveniment))?.instant.getTime() ?? null;
}

/**
 * T51 i R51 · De més nova a més vella per `moment`; sense cap data real, al
 * final. Empat (també entre dues sense data): si totes dues entrades porten
 * `clau` (`${type}-${id}`, la de calendariGlobal · entradaDeLaTargeta), per
 * clau ascendent en ordre de codi, independent de la llengua (D-R51-2). Sense
 * clau, l'ordre en què han arribat (sort és estable des d'ES2019).
 */
export function perMomentDescendent(a, b) {
  if (a.moment !== b.moment) {
    if (a.moment === null) return 1;
    if (b.moment === null) return -1;
    return b.moment - a.moment;
  }
  if (typeof a.clau !== 'string' || typeof b.clau !== 'string') return 0;
  return a.clau < b.clau ? -1 : a.clau > b.clau ? 1 : 0;
}

/** R51 · La clau d'empat d'una targeta, la mateixa del calendari global. */
export const clauDeLaTargeta = (item) => `${item?.type}-${item?.id}`;
