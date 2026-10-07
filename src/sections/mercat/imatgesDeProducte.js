/**
 * imatgesDeProducte.js — les fotos d'un producte, una sola regla per a la
 * targeta del Mercat, la del Mur i la pàgina de detall.
 *
 * Mòdul pur (cap React, cap DOM). Abans vivia a detail/detailSectionMeta.jsx:
 * importar-lo des de les targetes arrossegava detailRichText i
 * Aplec2023Article al Mur i al Mercat. detailSectionMeta el torna a exportar.
 */
import { getFirstImage } from '../detail/detailHelpers.jsx';
import { resolveAsset } from '../../config/assetResolver.js';

/* El camí d'un recurs, sense origen ni consulta, resolt amb la base d'ara:
   el mateix fitxer escrit com a camí o ja resolt (o com a URL absoluta) és
   el mateix camí. El criteri de PageFrame per a reconéixer la marca. */
const camiDeRecurs = (valor) => {
  try {
    return new URL(resolveAsset(valor), 'http://sdp.invalid').pathname;
  } catch {
    return String(valor);
  }
};

/**
 * Ordre del Mestre (261007) · Les fotos d'un producte, en ordre: la primera
 * és la principal, a la targeta i a la pàgina. Mai el logotip ni l'avatar de
 * qui ven (avatar_url, author_avatar): la Samarreta Sóc de Poble pintava a la
 * portada el quadrat verd de la marca, perquè el detall llegia primer
 * imageSrc, que marketContent.js i el mapejador del node omplin amb
 * l'avatar_url quan el producte no porta image_url ni image. Primer `images`;
 * sense, image_url, image i imageSrc. Sense repetits. Torna [] si el producte
 * no té cap foto pròpia.
 */
export function imatgesDeProducte(item) {
  if (!item || typeof item !== 'object') return [];
  const marques = new Set([item.avatar_url, item.author_avatar]
    .filter((valor) => typeof valor === 'string' && valor.trim() !== '')
    .map(camiDeRecurs));
  const propies = Array.isArray(item.images) ? item.images.map(getFirstImage) : [];
  const candidates = propies.some(Boolean) ? propies : [item.image_url, item.image, item.imageSrc].map(getFirstImage);
  const vistos = new Set();
  const imatges = [];
  for (const src of candidates) {
    if (typeof src !== 'string' || src.trim() === '') continue;
    const cami = camiDeRecurs(src);
    if (marques.has(cami) || vistos.has(cami)) continue;
    vistos.add(cami);
    imatges.push(src);
  }
  return imatges;
}

/**
 * La foto principal d'un producte a la seua TARGETA (Mercat i Mur): la mateixa
 * que la portada de la pàgina, imatgesDeProducte(item)[0]. Sense cap foto
 * pròpia, la `reserva` de cada targeta, la de sempre (Llei del Píxel): hui hi
 * entra el logotip de qui ven, i la pàgina queda sense portada. Si eixa
 * reserva s'ha de llevar és decisió pendent del Mestre.
 */
export function fotoDeLaTargeta(item, reserva = '') {
  return imatgesDeProducte(item)[0] || reserva || '';
}
