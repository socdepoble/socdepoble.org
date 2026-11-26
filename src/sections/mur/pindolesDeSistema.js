/**
 * pindolesDeSistema.js — C26-2 #9 (Gauntlet c13, v1.2.26) · IDEA-365 (21:40, regla 3; 21:58, punt 1).
 * Les píndoles de Categoria de Sistema (sdp-badge-system) d'un element que declara les seues categories
 * (`categoriesSistema`) es pinten amb labelsSistema (taxonomiaPublicacio.js): el text en la llengua de la
 * interfície i la ruta canònica (/mur, /calendari, /categoria/<slug>), igual a la Card del Mur
 * (TargetaDelMur.jsx) i a la seua UniversalPage (elementDeSeccio.js). Abans el Mur i el detall pintaven les
 * de la llavor, en valencià en les 5 llengües, i la ruta es deduïa del text traduït (/categoria/bideoa).
 *
 * Mòdul pur, fora del graf d'arrencada del nucli de WordPress.
 */
import { labelsSistema, resolCategoriaSistema } from '../../data/taxonomia/taxonomiaPublicacio.js';

/* Una píndola del bloc de sistema: la classe sdp-badge-system i un text que és una de les 12 categories (en
   qualsevol de les 5 llengües). La pastilla de versió («v1.2.26»), també sdp-badge-system, no ho és i es queda. */
function esDeSistema(label) {
  return Boolean(label) && typeof label === 'object' && typeof label.className === 'string'
    && label.className.split(/\s+/).includes('sdp-badge-system')
    && typeof label.text === 'string' && resolCategoriaSistema(label.text) !== null;
}

/**
 * Les `labels` amb el bloc de sistema substituït per labelsSistema(categoriesSistema, idioma), al lloc on
 * era. Sense `categoriesSistema` (llista), sense cap categoria vàlida o sense cap píndola de sistema a les
 * labels, la MATEIXA llista (la mateixa referència): cap píndola nova on el productor no en posava cap.
 * Si les píndoles substituïdes declaraven la seua llengua (`lang`, les de les pàgines públiques), les noves
 * declaren la de la interfície, que és la del seu text.
 */
export function localitzaPindolesDeSistema(labels, categoriesSistema, idioma = 'ca') {
  if (!Array.isArray(labels) || !Array.isArray(categoriesSistema)) return labels;
  if (!labels.some(esDeSistema)) return labels;
  const sistema = labelsSistema(categoriesSistema, idioma);
  if (!sistema.length) return labels;
  const ambLlengua = labels.some((label) => esDeSistema(label) && typeof label.lang === 'string' && label.lang);
  const noves = ambLlengua ? sistema.map((label) => ({ ...label, lang: idioma })) : sistema;
  const resultat = [];
  let posades = false;
  for (const label of labels) {
    if (!esDeSistema(label)) resultat.push(label);
    else if (!posades) {
      resultat.push(...noves);
      posades = true;
    }
  }
  return resultat;
}
