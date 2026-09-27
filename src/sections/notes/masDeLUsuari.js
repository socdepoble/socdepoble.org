/**
 * masDeLUsuari.js — El que la persona, o l'entitat amb què actua, ha publicat,
 * vist des del seu Bloc de Notes (Lògica d'Usuari, T1). Funcions pures.
 *
 * El MAS és l'arxiu de qui mira: a la carpeta «Mur» hi ha les seues
 * publicacions del Mur, a «Mercat» els seus articles, a «Esdeveniments» els
 * seus actes. Cap d'estos elements és una nota: es deriven del Mur en memòria
 * i s'obrin en lectura (PublicacioDetall). L'exemple d'or: qui actua com
 * «Sóc de Poble» veu la samarreta a «Mercat» i res del que és d'altri.
 *
 * Qui signa cada element ho diu `autorDe` (navigation.js): una entitat si hi
 * ha signatura d'entitat, si no la persona. Els àlies de l'actor (id, slug i,
 * en seed, els noms amb què la llavor signa) els dona identitatsSeed.
 */
import { autorDe, getSectionItemPath } from '../../config/navigation.js';
import { extractPlainText } from '../../utils/contentAdapter.js';

export const CARPETA_PER_SECCIO = Object.freeze({ mur: 'f-mur', mercat: 'f-mercat', events: 'f-events' });
export const ETIQUETA_SECCIO = Object.freeze({ mur: 'Mur', mercat: 'Mercat', events: 'Esdeveniments' });

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
    categoryIds: [CARPETA_PER_SECCIO[seccio] || 'f-notes'],
    title: titol,
    subtitle: dataCurta(data, locale),
    excerpt: resum,
    image: item.imageSrc || item.image_url || item.image || item.images?.[0] || '',
    tags: [],
    labels: [{ text: ETIQUETA_SECCIO[seccio] || seccio, className: 'sdp-badge-system' }],
    searchText: `${titol} ${resum}`.toLowerCase(),
    updatedAt: data,
    data: { seccio, item, ruta: getSectionItemPath(seccio, item.id) }
  };
}

/** Tot el que l'actor ha publicat al Mur, al Mercat i a l'agenda, per carpeta. */
export function itemsPublicatsDe({ feedPosts = [], marketItems = [], events = [] } = {}, alies, opcions = {}) {
  const fonts = [['mur', feedPosts], ['mercat', marketItems], ['events', events]];
  const items = [];
  for (const [seccio, llista] of fonts) {
    for (const item of llista || []) {
      if (!item || item.isSystem || item.id == null) continue;
      if (!pertanyALActor(item, alies)) continue;
      items.push(publicacioComANota(item, seccio, opcions));
    }
  }
  return items;
}
