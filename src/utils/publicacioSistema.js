/** IDEA-365. Frontera d'escriptura diferida: no carrega el tesaurus ni les traduccions. */
import { destinsPerDefecteDeProducte } from '../data/taxonomia/destinsDeProducte.js';

const NOMS = ['Sistema','Mur','Mercat','Calendari','Mapa','Transport','Animalets','Treball','Habitatge','Catàlegs','Vídeo','PDF'];
/* IDEA-367 (23:06) · Els formats ixen de l'arxiu adjunt real: no els tria qui publica. */
const FORMATS = ['Vídeo','PDF'];
const DESTINS = { mur:'Mur', mercat:'Mercat', calendari:'Calendari', mapa:'Mapa', vehicle:'Transport', animalets:'Animalets', treball:'Treball', habitatge:'Habitatge' };
const PUBLICS = ['mur','mercat','events','multimedia'];
const error = () => Object.assign(new TypeError('Cal almenys una Categoria de Sistema vàlida per publicar.'), { codi:'SDP-TAXONOMIA-DESTI' });

/* Només propietats pròpies de dades (cap getter ni prototip), com la llista de categories. */
const propi = (font, clau) => {
  const camp = Object.getOwnPropertyDescriptor(font, clau);
  return camp && Object.hasOwn(camp, 'value') ? camp.value : undefined;
};
const text = (valor) => (typeof valor === 'string' && valor.length <= 2048 ? valor.trim() : '');
/* La mateixa forma que admet el mapejador (validaVideoUrl): camí propi o http(s), sense data:. */
const RE_VIDEO = /^(?:\/(?!\/)|\.\/|https?:\/\/)[^\s\\\u0000-\u001f\u007f-\u009f]+$/i;
/* El marcador inert del vídeo editorial incrustat al cos (richText/extensions/videoEditorial.js).
   C26-2 (P2, vídeo falsificable) · Només un ATRIBUT d'una etiqueta HTML (`<div data-sdp-youtube="ID"`), no
   el text «data-sdp-youtube=abc» escrit dins d'un paràgraf. Zero ReDoS: [^<>]* talla a cada «<», i la
   cerca és lineal; amb [^>]* era quadràtica (unes 120 000 lletres «<a » sense «>» tardaven ~1,9 s).
   Integrador C1-3 (IDEA-367) · La mateixa regla que el lector (htmlEditorial.jsx · esIdVideoEditorial): un
   <div> amb un id de YouTube d'11 caràcters. Un <p data-sdp-youtube> o un id curt no es pinten mai com a
   vídeo i no fan «Vídeo». */
const RE_YOUTUBE = /<div\b[^<>]*\sdata-sdp-youtube\s*=\s*["']?[A-Za-z0-9_-]{11}(?![\w-])/i;
/* Un document PDF declarat al camp `pdf` (la forma de les obres del catàleg, patrimoni/queDinem.js). */
const RE_PDF = /^(?:\/(?!\/)|\.\/|https?:\/\/)[^\s?#\\]+\.pdf(?:[?#]\S*)?$/i;

/** C26-1 #3 (Gauntlet c13) · IDEA-367 (23:06): Vídeo i PDF es deriven dels adjunts reals de la
 *  publicació (video_url, video_youtube, data-sdp-youtube al cos, document `pdf`). */
function formatsDelsAdjunts(font) {
  const youtube = propi(font, 'video_youtube');
  const ambVideo = RE_VIDEO.test(text(propi(font, 'video_url')))
    || Boolean(text(youtube && typeof youtube === 'object' ? youtube.id : youtube))
    || ['content', 'description', 'body'].some((clau) => typeof propi(font, clau) === 'string' && RE_YOUTUBE.test(propi(font, clau)));
  return [...(ambVideo ? ['Vídeo'] : []), ...(RE_PDF.test(text(propi(font, 'pdf'))) ? ['PDF'] : [])];
}

/** El llegat sense camp rep el destí real de la secció/àmbit. Un buidatge explícit falla:
 * no es pot despublicar de tot per accident ni reparar silenciosament una ordre invàlida.
 * Les notes privades no reben categories públiques. La font no es modifica.
 * C26-1 #3 (Gauntlet c13) · «Sistema» és la categoria de les pàgines tècniques de Sóc de Poble
 * (IDEA-365, 21:35, punt 3): el client no té cap prova fiable de qui publica (l'autoria la posa el
 * servidor; mapejadorSeccions.js ja lleva isSystem i type:'sistema' del payload), i per això cap
 * entrada de client no la pot afirmar: falla. Vídeo i PDF ja no es trien: es deriven dels
 * adjunts, i no compten com a destí (una llista amb només formats falla).
 * C26-2 #3 · Sense camp, un producte de 'mercat' rep el destí per defecte de la font única
 * (destinsDeProducte.js): Mur + Mercat mentre el Mur mostre productes (IDEA-365, 21:40, regla 1). */
export function categoriesSistemaPerPublicar(payload, sectionId) {
  const font = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  if (!PUBLICS.includes(sectionId)) return font;
  let categories;
  if (Object.hasOwn(font, 'categoriesSistema')) {
    const camp = Object.getOwnPropertyDescriptor(font, 'categoriesSistema');
    if (!Object.hasOwn(camp, 'value')) throw error();
    const llista = camp.value;
    if (!Array.isArray(llista) || !llista.length || llista.length > 12) throw error();
    categories = [];
    for (let i = 0; i < llista.length; i++) {
      const element = Object.getOwnPropertyDescriptor(llista, String(i));
      if (!element || !Object.hasOwn(element, 'value') || typeof element.value !== 'string' || !NOMS.includes(element.value) || element.value === 'Sistema') throw error();
      if (!FORMATS.includes(element.value)) categories.push(element.value);
    }
    if (!categories.length) throw error();
  } else {
    const ambit = typeof font.ambit === 'string' && Object.hasOwn(DESTINS, font.ambit) ? font.ambit : null;
    const compatible = ambit && (ambit === 'mercat' ? sectionId === 'mercat' : sectionId === 'mur');
    categories = sectionId === 'mercat' ? destinsPerDefecteDeProducte(font)
      : [compatible ? DESTINS[ambit] : sectionId === 'events' ? 'Calendari' : 'Mur'];
  }
  return { ...font, categoriesSistema: [...new Set([...categories, ...formatsDelsAdjunts(font)])] };
}
