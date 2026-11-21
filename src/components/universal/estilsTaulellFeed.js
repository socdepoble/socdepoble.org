/**
 * estilsTaulellFeed.js · v1.2.17 · El full diferit del mode de taulell (chrome="feed", R32.26 · IDEA-305).
 * Només l'importen el Mur, el Mercat i el Calendari (trossos diferits), que posen esta funció a la seua
 * `config` (adoptaEstilsChrome); PageFrame la crida abans del primer pintat amb un node de la pàgina, i el
 * full s'adopta a l'arrel (el document o el shadow root de <soc-de-poble>) una sola vegada. Així ni les
 * regles ni l'adoptador viatgen a l'arrencada estàtica del connector de WordPress (sostre D-v1214-1).
 */
import css from '../../css/diferit-taulell-feed.css?inline';
import { adoptaFullDiferit } from '../../config/fullDiferit.js';

/* La clau va literal a la crida (el tractor de classes estàtiques casa cada full ?inline amb la seua clau). */
export const CLAU_TAULELL_FEED = 'taulell-feed';

/** Adopta el full del mode de taulell a l'arrel de `node`. Torna true si l'ha afegit ara. */
export const adoptaEstilsTaulellFeed = (node) => adoptaFullDiferit(node, 'taulell-feed', css);
