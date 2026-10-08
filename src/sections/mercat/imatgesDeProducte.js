/**
 * imatgesDeProducte.js — les fotos d'un producte, una sola regla per a quatre
 * superfícies: la targeta del Mercat, la del Mur, la pàgina de detall i el
 * MAS (Esmena 3 del pla 261007_1645: la fitxa del Bloc, masDeLUsuari.js, i
 * el seu lector, notes/PublicacioDetall.jsx, que hi arriba per la secció del
 * Mercat de detailSectionMeta).
 *
 * Mòdul pur (cap React, cap DOM). Abans vivia a detail/detailSectionMeta.jsx:
 * importar-lo des de les targetes arrossegava detailRichText i
 * Aplec2023Article al Mur i al Mercat. detailSectionMeta el torna a exportar.
 */
import { getFirstImage } from '../detail/detailHelpers.jsx';
import { resolveAsset } from '../../config/assetResolver.js';
import { camiDe } from '../../components/universal/UniversalUtils.js';

/* El camí d'un recurs, sense origen ni consulta, resolt amb la base d'ara:
   el mateix fitxer escrit com a camí o ja resolt (o com a URL absoluta) és
   el mateix camí. El criteri de PageFrame per a reconéixer la marca
   (esMarcaDeLEntitat).
   Relleu 261007 («Límits» §5) · Abans era una còpia de camiDe amb el
   resolveAsset dins; ara és la composició amb la d'UniversalUtils.js. Només
   diferia en la caiguda: el text cru en lloc del resolt.
   Revisió adversarial del 261008 · Eixa caiguda pot donar una altra clau per a
   les entrades que new URL() no analitza ni amb base (per exemple, barres
   inverses que fan un host buit), que sempre són brossa. La deduplicació
   continua sent coherent: les marques i les candidates passen per la mateixa
   funció. Cap efecte al DOM. */
const camiDeRecurs = (valor) => camiDe(resolveAsset(valor));

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
 * La foto principal d'un producte a la seua TARGETA (Mercat, Mur i la fitxa
 * del MAS): la mateixa que la portada de la pàgina, imatgesDeProducte(item)[0].
 * Sense cap foto pròpia, la `reserva` de cada targeta, la de sempre (Llei del
 * Píxel): hui hi entra el logotip de qui ven, i la pàgina queda sense
 * portada. Si eixa reserva s'ha de llevar és decisió pendent del Mestre.
 */
export function fotoDeLaTargeta(item, reserva = '') {
  return imatgesDeProducte(item)[0] || reserva || '';
}
