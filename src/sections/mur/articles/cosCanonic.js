/* P0-26 / IDEA-97 (Onada R6, Bloc 1) · Els articles canònics del Mur (el
   Manifest de Poble, WP 16893, i el 2n Aplec pel Territori, WP 16880) ja no
   són JSX dur: el document sencer viu en `item.content` (HTML que l'editor de
   /notes i el sanejador entenen igual) i la llavor en guarda l'única còpia.
   Ací només hi ha les dues regles de pintar-lo. */
import { resolveAsset } from '../../../config/assetResolver.js';
import { sanitizeHtml } from '../../../utils/sanitize.js';
import { semblaHtml } from '../../detail/detailHelpers.jsx';

/* Un enllaç a un recurs propi (el cartell A4, el dels ponents) viatja amb el
   paquet com les imatges: resolRecursosDeHtml només reescriu els src i els
   href de /opendata/. */
const RE_HREF_RECURS = /(\shref\s*=\s*)(["'])(\/assets\/[^"'<>\s]*)\2/gi;

/** El cos que es pinta: el de l'element si és HTML (la llavor, o una edició
 *  feta des de /notes); si no (la còpia d'app_content en text pla, o cap cos),
 *  el canònic de la llavor. Una sola còpia del text. */
export function cosDeLArticle(item, canonic) {
  const propi = typeof item?.content === 'string' ? item.content.trim() : '';
  return propi && semblaHtml(propi) ? propi : canonic;
}

/** El mode estricte del Mur (el de cosAmbImatgesPropies: cap <img> de
 *  tercers), jutjat sobre el valor guardat, i els href="/assets/…" a la base
 *  de l'amfitrió. Els src="/assets/…" els resol renderRichText en pintar-los
 *  (resolRecursosDeHtml), amb la base del paquet, que no és cap tercer. */
export function cosPerAPintar(html) {
  const ambEnllacos = textDelCos(html)
    .replace(RE_HREF_RECURS, (_, atribut, cometa, ruta) => `${atribut}${cometa}${resolveAsset(ruta)}${cometa}`);
  return sanitizeHtml(ambEnllacos, { imatgesPropies: true });
}

/* D-B4-4 (Onada R6, Bloc 4; Gauntlet del Node 0: Qwen 2.5 Coder 14B, Qwen 3
   8B i la IAIA MarIA) · Abans de cap replace, el cos ha de ser text: una
   cadena tal qual; un número finit, en xifres; qualsevol altra cosa (null,
   undefined, NaN, un objecte, una llista, una funció, un Symbol) és un cos
   buit, mai «[object Object]» ni una excepció que tombe la pàgina. */
function textDelCos(html) {
  if (typeof html === 'string') return html;
  if (typeof html === 'number' && Number.isFinite(html)) return String(html);
  return '';
}
