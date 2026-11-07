/* IDEA-161 (un sol visor del Pou de Neu) · El nom accessible del botó de veu de
   la publicació. Vivia al reproductor explicatiu del pou, que s'ha retirat: el
   visor únic és PouDeLaNeuAnatomiaCard. Mateix comportament i mateixes claus
   dels diccionaris (patrimoni.reproductorPou.veuPas i .veuPublicacio). */

/** R9V-C2-10 · El nom accessible d'un botó de veu: el rètol visible del botó
 *  (sense l'emoji, que és decoració) i què llig, perquè els dos botons de la
 *  publicació (tota la publicació i el pas) no es diguen igual. Comença pel
 *  rètol visible (WCAG 2.5.3, el nom conté l'etiqueta). */
export function nomDeLaVeu(t, abast) {
  const escolta = String(t('common.veuIaiaEscolta', '🔊 Escolta la IAIA')).replace(/^\p{Extended_Pictographic}️?\s*/u, '');
  const que = abast === 'pas'
    ? t('patrimoni.reproductorPou.veuPas', 'este pas')
    : t('patrimoni.reproductorPou.veuPublicacio', 'tota la publicació');
  return `${escolta}: ${que}`;
}
