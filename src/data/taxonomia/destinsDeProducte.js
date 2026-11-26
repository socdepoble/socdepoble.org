/**
 * destinsDeProducte.js — IDEA-365 · Les Categories de Sistema (destins) d'un producte del Mercat.
 * Sense inferir autoria ni marques del títol. Mòdul pur i sense imports (fora del graf d'arrencada).
 *
 * C26-2 #3 (Gauntlet c13) · FONT ÚNICA del destí per defecte, la mateixa per a publicar
 * (utils/publicacioSistema.js · categoriesSistemaPerPublicar, secció 'mercat') i per a llegir el
 * llegat sense camp. Llibre Mestre, IDEA-365 (21:40, regla 1): «un producte del /mercat que també
 * ix al /mur porta Mur + Mercat»; i (21:58, punt 2) les botelles d'Oli de La Torre, mentre es
 * mostren al /mur i al /mercat, porten Mur + Mercat. Abans, publicar donava [Mercat] i llegir el
 * llegat [Mur, Mercat]. Qui declara que no vol eixir al Mur (mostrarAlMur false o ocultarDelMur
 * true, els interruptors del Bloc) només porta Mercat.
 */
export function destinsPerDefecteDeProducte(item) {
  return item?.mostrarAlMur === false || item?.ocultarDelMur === true ? ['Mercat'] : ['Mur', 'Mercat'];
}

/** Els destins declarats (categoriesSistema) o, sense cap, els de sèrie. */
export function destinsDeProducte(item) {
  const explicits = Array.isArray(item?.categoriesSistema) ? item.categoriesSistema.filter((nom) => typeof nom === 'string') : null;
  return explicits?.length ? explicits : destinsPerDefecteDeProducte(item);
}

/**
 * C26-2 #1 (Gauntlet c13) · Només completa `categoriesSistema`; NO fabrica `labels`. Les pastilles
 * d'un producte (destins, categoria, etiqueta, variants i poble, en 5L) es calculen en pintar amb
 * propsDeTargetaDeProducte (mercat/targetaDeProducte.js), la mateixa projecció per a la Card del
 * Mercat, la Card del Mur (TargetaDelMur.jsx) i la UniversalPage (elementDeSeccio.js): IDEA-365
 * (21:58, punt 1), paritat absoluta Card ↔ UniversalPage. Abans les `labels` fabricades ací
 * substituïen la reserva de TargetaDelMur i el Mur només pintava «Mur · Mercat», sense categoria,
 * etiqueta, recompte de variants ni poble, i en valencià en les 5 llengües.
 */
export function classificaProducte(item) {
  return { ...item, categoriesSistema: destinsDeProducte(item) };
}
