/* Onada R24 · wp_trinquet (SEO-R22-08, trinquet de l'arrencada estàtica) · De qui
   és un element (masDeLUsuari.js), en un mòdul propi: signaturaDAltri.js, que
   és de l'arrencada, només en vol pertanyALActor i, important-la de
   masDeLUsuari.js, arrossegava al tros d'entrada les carpetes de publicacions
   de Notes (publicacioComANota, itemsPublicatsDe) i les fotos de producte del
   Mercat, que només fan servir vistes diferides. masDeLUsuari.js en reexporta
   les dues funcions amb els mateixos noms: cap altre importador no canvia. */
import { autorDe } from '../../config/navigation.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';

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
