/**
 * masDeLUsuari.js — El que la persona, o l'entitat amb què actua, ha publicat,
 * vist des del seu Bloc de Notes (Lògica d'Usuari, T1). Funcions pures.
 *
 * El MAS és l'arxiu de qui mira: a la carpeta «Mur» hi ha les seues
 * publicacions del Mur, a «Mercat» els seus articles, a «Esdeveniments» els
 * seus actes i a «Multimèdia» els seus mitjans. Cap d'estos elements és una
 * nota: es deriven en memòria de les dades del Mur (MurContext) i de
 * Multimèdia (MultimediaContext), i s'obrin en lectura (PublicacioDetall).
 * L'exemple d'or: qui actua com «Sóc de Poble» veu la samarreta a «Mercat» i
 * res del que és d'altri.
 *
 * Qui signa cada element ho diu `autorDe` (navigation.js): una entitat si hi
 * ha signatura d'entitat, si no la persona. Els àlies de l'actor els dona
 * identitatsSeed (aliesDeLActor): l'id i l'slug, els de l'entitat pilot en
 * qualsevol mode i, només en seed, els de la persona pilot.
 *
 * F4 (ordre del Mestre, 261004; PRD de la Marató 2230, Fase 1) · Totes les
 * seccions de publicació entren al MAS: Multimèdia a «Multimèdia» (f-media) i
 * qualsevol secció sense carpeta pròpia a «Altres notes» (CARPETA_ALTRES, D6),
 * amb l'etiqueta neutra «Publicació» (etiquetaDeSeccio).
 */
import { autorDe, getSectionItemPath } from '../../config/navigation.js';
import { extractPlainText } from '../../utils/contentAdapter.js';

/* La carpeta «Altres notes» del catàleg (appSeed.js · NOTE_FOLDERS_SEED). */
export const CARPETA_ALTRES = 'f-notes';
export const CARPETA_PER_SECCIO = Object.freeze({ mur: 'f-mur', mercat: 'f-mercat', events: 'f-events', multimedia: 'f-media' });
export const ETIQUETA_SECCIO = Object.freeze({ mur: 'Mur', mercat: 'Mercat', events: 'Esdeveniments', multimedia: 'Multimèdia' });
/* Poliment de F4 (revisió de la Marató 2230) · Una secció sense nom al
   catàleg (les `fonts` genèriques) no pinta el seu id cru a la fitxa: porta
   l'etiqueta neutra. */
export const ETIQUETA_NEUTRA = 'Publicació';
export const etiquetaDeSeccio = (seccio) => ETIQUETA_SECCIO[seccio] || ETIQUETA_NEUTRA;

/* F4 (bloquejant de Codex, relleus 16 i 21 de l'auditoria 261004_2240) · Qui
   llig la URL del Bloc ha de saber de quina font és una publicació triada, i
   de quina font s'omplin les carpetes del catàleg: el format de l'id és
   d'este mòdul (publicacioComANota), i només ací es desfà. */
const PREFIX_PUBLICACIO = /^publicacio:([^:]+):/;

/** La secció d'un id de publicació del MAS (`publicacio:<seccio>:<id>`); null si no ho és. */
export function seccioDePublicacio(id) {
  const trobada = PREFIX_PUBLICACIO.exec(String(id ?? ''));
  return trobada ? trobada[1] : null;
}

/* Revisió de F4 (ronda 2, R2d; proposta 0101 de Codex, relleu 23) · Qui
   decidix el camí d'un id triat (publicació o nota) mira només el prefix:
   un id que comença per `publicacio:` però no porta secció ('publicacio::x')
   o tercer segment ('publicacio:mur') no és cap nota. seccioDePublicacio en
   torna null i, sense esta guarda, el Bloc l'enviava a resolveNote (el port
   de notes privades) com si ho fora. */
/** Si un id té la forma d'una publicació del MAS, ben formada o no (el prefix `publicacio:`). */
export function esIdDePublicacio(id) {
  return String(id ?? '').startsWith('publicacio:');
}

/** La secció que omple una carpeta pròpia del catàleg (CARPETA_PER_SECCIO); null per a qualsevol altra. */
export function seccioDeCarpeta(carpeta) {
  if (carpeta == null) return null;
  return Object.keys(CARPETA_PER_SECCIO).find((seccio) => CARPETA_PER_SECCIO[seccio] === String(carpeta)) ?? null;
}

/** L'element és de l'actor si qui el signa és un dels seus àlies. */
export function pertanyALActor(item, alies) {
  if (!item || !alies || !alies.size) return false;
  const autor = autorDe(item);
  return Boolean(autor) && alies.has(autor.id);
}

function dataCurta(valor, locale) {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** Una publicació com a element de l'espai de treball (només lectura). */
export function publicacioComANota(item, seccio, { locale = 'ca-ES' } = {}) {
  const data = item.date || item.publish_date || item.created_at || null;
  const titol = extractPlainText(String(item.title || item.name || ''), Infinity).trim() || 'Publicació';
  const resum = extractPlainText(String(item.summary || item.subtitle || item.post_subtitle || item.description || ''), 240).trim();
  return {
    id: `publicacio:${seccio}:${item.id}`,
    kind: 'publicacio',
    categoryIds: [CARPETA_PER_SECCIO[seccio] || CARPETA_ALTRES],
    title: titol,
    subtitle: dataCurta(data, locale),
    excerpt: resum,
    /* F4 · Un mitjà porta el fitxer a `src` (mediaContent.js; el normalitza
       mapejadorSeccions.js). L'últim de la cadena, i només si és una
       imatge: un vídeo no es pinta com a portada. Poliment de F4 · Només a
       Multimèdia: un element del Mur o del Mercat amb `src` i sense cap camp
       d'imatge no és cap portada. */
    image: item.imageSrc || item.image_url || item.image || item.images?.[0]
      || (seccio === 'multimedia' && item.src && (!item.kind || item.kind === 'image') ? item.src : ''),
    tags: [],
    labels: [{ text: etiquetaDeSeccio(seccio), className: 'sdp-badge-system' }],
    searchText: `${titol} ${resum}`.toLowerCase(),
    updatedAt: data,
    data: { seccio, item, ruta: getSectionItemPath(seccio, item.id) }
  };
}

/**
 * Tot el que l'actor ha publicat al Mur, al Mercat, a l'agenda i a
 * Multimèdia, per carpeta. F4 · `fonts` admet qualsevol altra secció com a
 * parells [seccio, llista] (sense carpeta pròpia, va a CARPETA_ALTRES).
 * F4 (D2) · `opcions.publicadesDesDeNotes`, un Set d'ids: les publicacions del
 * Mur nascudes d'una nota pròpia (publishedSubmissionId) no s'emeten. La peça
 * és la nota editable, que el Bloc posa també a la carpeta «Mur».
 */
export function itemsPublicatsDe({ feedPosts = [], marketItems = [], events = [], mediaItems = [], fonts = [] } = {}, alies, opcions = {}) {
  const { publicadesDesDeNotes = null, ...format } = opcions;
  const totes = [['mur', feedPosts], ['mercat', marketItems], ['events', events], ['multimedia', mediaItems], ...(fonts || [])];
  const items = [];
  for (const [seccio, llista] of totes) {
    for (const item of llista || []) {
      if (!item || item.isSystem || item.id == null) continue;
      if (!pertanyALActor(item, alies)) continue;
      /* Publicar una nota només escriu al Mur (NotesContext · publishNote). */
      if (seccio === 'mur' && publicadesDesDeNotes?.has(String(item.id))) continue;
      items.push(publicacioComANota(item, seccio, format));
    }
  }
  return items;
}
