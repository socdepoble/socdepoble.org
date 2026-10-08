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
 *
 * Grup E de l'Onada 4 (prompt 261008_1201, tasca 2; decisió del Mestre del
 * 261008: el «Sóc de Poble loguejat» és l'ENTITAT socdepoble triada al
 * selector d'identitat) · Les pàgines del sistema que el Mur signa com a «Sóc
 * de Poble» (targetesDeSistema, TargetaDelMur · isSystem) són de l'entitat
 * pilot: entren a la seua carpeta «Mur». Abans itemsPublicatsDe les saltava i
 * el Bloc de Sóc de Poble no en mostrava cap.
 */
import { autorDe, esRutaInterna, getSectionItemPath } from '../../config/navigation.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { fotoDeLaTargeta } from '../mercat/imatgesDeProducte.js';

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

/* Grup E (261008) · Els identificadors de l'entitat pilot que porta el seu
   conjunt d'àlies (identitatsSeed · aliesDeLActor): l'id de la llavor i el
   slug declarat, que en remot acompanya l'uuid de servidor. Una persona no en
   rep mai cap (el slug i el padró només són àlies d'una entitat). */
const ALIES_DEL_PROJECTE = Object.freeze([...new Set([ENTITAT_PILOT_SLUG, ENTITAT_PILOT_ID])]);

/** Si un conjunt d'àlies és el de l'entitat pilot (Sóc de Poble), en llavor o en remot. */
export const esAliesDelProjecte = (alies) => Boolean(alies?.size) && ALIES_DEL_PROJECTE.some((clau) => alies.has(clau));

/** L'element és de l'actor si qui el signa és un dels seus àlies.
 *  Grup E (261008) · Una pàgina del sistema (isSystem) no porta cap autor:
 *  la signa Sóc de Poble, i només és de l'entitat pilot. Les publicacions dels
 *  veïns no poden dir que ho són (elementDeFilaPublicada en lleva isSystem). */
export function pertanyALActor(item, alies) {
  if (!item || !alies || !alies.size) return false;
  if (item.isSystem) return esAliesDelProjecte(alies);
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
  /* F4 · Un mitjà porta el fitxer a `src` (mediaContent.js; el normalitza
     mapejadorSeccions.js). L'últim de la cadena, i només si és una
     imatge: un vídeo no es pinta com a portada. Poliment de F4 · Només a
     Multimèdia: un element del Mur o del Mercat amb `src` i sense cap camp
     d'imatge no és cap portada. */
  const imatge = item.imageSrc || item.image_url || item.image || item.images?.[0]
    || (seccio === 'multimedia' && item.src && (!item.kind || item.kind === 'image') ? item.src : '');
  return {
    id: `publicacio:${seccio}:${item.id}`,
    kind: 'publicacio',
    categoryIds: [CARPETA_PER_SECCIO[seccio] || CARPETA_ALTRES],
    title: titol,
    subtitle: dataCurta(data, locale),
    excerpt: resum,
    /* Esmena 3 del pla 261007_1645 · Un producte porta la seua primera foto
       (fotoDeLaTargeta, la regla de TargetaDelMur i de targetaDeProducte), no
       l'imageSrc que per a la Samarreta és el logotip quadrat de qui ven
       (marketContent.js). Sense cap foto pròpia, la cadena de sempre. Les
       altres seccions no canvien. */
    image: seccio === 'mercat' ? fotoDeLaTargeta(item, imatge) : imatge,
    tags: [],
    labels: [{ text: etiquetaDeSeccio(seccio), className: 'sdp-badge-system' }],
    searchText: `${titol} ${resum}`.toLowerCase(),
    updatedAt: data,
    data: { seccio, item, ruta: rutaDeLaPublicacio(item, seccio) }
  };
}

/* Grup E (261008) · Una pàgina del sistema viu a la seua ruta (mainHref:
   /projecte, /page/xat…), com la seua targeta del Mur; mai a /mur/:id. Només
   una ruta de l'app (esRutaInterna, la mateixa defensa de TargetaDelMur). */
function rutaDeLaPublicacio(item, seccio) {
  if (item.isSystem && esRutaInterna(item.mainHref)) return item.mainHref;
  return getSectionItemPath(seccio, item.id);
}

/**
 * Tot el que l'actor ha publicat al Mur, al Mercat, a l'agenda i a
 * Multimèdia, per carpeta. F4 · `fonts` admet qualsevol altra secció com a
 * parells [seccio, llista] (sense carpeta pròpia, va a CARPETA_ALTRES).
 * F4 (D2) · `opcions.publicadesDesDeNotes`, un Set d'ids: les publicacions del
 * Mur nascudes d'una nota pròpia (publishedSubmissionId) no s'emeten. La peça
 * és la nota editable, que el Bloc posa també a la carpeta «Mur».
 * Grup E (261008) · Les pàgines del sistema ja no se salten: pertanyALActor
 * decidix de qui són (de l'entitat pilot i de ningú més).
 */
export function itemsPublicatsDe({ feedPosts = [], marketItems = [], events = [], mediaItems = [], fonts = [] } = {}, alies, opcions = {}) {
  const { publicadesDesDeNotes = null, ...format } = opcions;
  const totes = [['mur', feedPosts], ['mercat', marketItems], ['events', events], ['multimedia', mediaItems], ...(fonts || [])];
  const items = [];
  for (const [seccio, llista] of totes) {
    for (const item of llista || []) {
      if (!item || item.id == null) continue;
      if (!pertanyALActor(item, alies)) continue;
      /* Publicar una nota només escriu al Mur (NotesContext · publishNote). */
      if (seccio === 'mur' && publicadesDesDeNotes?.has(String(item.id))) continue;
      items.push(publicacioComANota(item, seccio, format));
    }
  }
  return items;
}
