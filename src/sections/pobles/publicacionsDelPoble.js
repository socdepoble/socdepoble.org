/**
 * publicacionsDelPoble.js · Onada 6 (pla 261009_0245, ítems 5 i 11) · Les
 * targetes d'un poble, en l'ordre del Mur.
 *
 * De quin poble és una publicació (pobleDeLaPublicacio, esDelPoble) i el
 * naixement del poble viuen a clauDelPoble.js, la part lleugera, i es
 * reexporten ací: este mòdul hi afig l'ordre del Mur (momentDeLaTargeta i
 * perMomentDescendent de targetesMur.js, amb el model de l'acte), que
 * arrossega les targetes, i la forma d'entrada de GraellaTargetes
 * ({ id: 'seccio:id', seccio, item, esdeveniment }), la mateixa de
 * l'històric de l'actor (usePublicacionsDeLActor · publicacionsDeLaSeccio).
 *
 * Cap nom de poble escrit ací (prompt 261009_0230, punt 6). Pur: sense React,
 * sense xarxa i sense dades pròpies.
 */
import { acteAEsdeveniment } from '../mur/agendaMur.js';
import { momentDeLaTargeta, perMomentDescendent } from '../mur/targetesMur.js';
import { itemsDelPoble } from './clauDelPoble.js';

export {
  FONTS_DEL_POBLE, clausDelPoble, esDelPoble, itemsDelPoble, pobleDeLaPublicacio, poblesAmbNaixement
} from './clauDelPoble.js';

const CAP = Object.freeze([]);

/**
 * Les targetes que són del poble `town`, de més nova a més vella com al Mur.
 * `fonts` és el que dona useMur ({ feedPosts, marketItems, events }). Cada
 * entrada porta un id textual propi ('seccio:id', el que GraellaTargetes
 * demana), la secció (quina targeta canònica la pinta), l'element cru i, per
 * a un acte, el seu model. Sense cap, CAP (la mateixa constant buida).
 */
export function publicacionsDelPoble(fonts, town) {
  const trobats = itemsDelPoble(fonts, town);
  if (!trobats.length) return CAP;
  return trobats
    .map(({ seccio, item }) => {
      const esdeveniment = item.type === 'event' ? acteAEsdeveniment(item) : null;
      return { id: `${seccio}:${item.id}`, seccio, item, esdeveniment, moment: momentDeLaTargeta(item, esdeveniment) };
    })
    .sort(perMomentDescendent)
    .map(({ id, seccio, item, esdeveniment }) => ({ id, seccio, item, esdeveniment }));
}
