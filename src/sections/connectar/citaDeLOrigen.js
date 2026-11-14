/* Onada R24 · wp_trinquet (SEO-R22-08, trinquet de l'arrencada estàtica) · La
   cita de l'origen d'un contingut de fora (contingutExtern.js), en un mòdul
   propi: NotesContext.jsx, que és de l'arrencada, només en vol
   cosDeLExternPerAlMur (T71b) i, important-la de contingutExtern.js,
   arrossegava al tros d'entrada la validació de l'entrada (validaContingutExtern,
   la lectura d'una adreça dins d'un text, notaDeContingutExtern) i les carpetes
   de Notes, que només fan servir /connectar i el Snippet Curador, diferits.
   contingutExtern.js els reexporta amb els mateixos noms: cap altre importador
   no canvia. */
import { urlExterna, validaUrlExterna } from '../../data/origenNota.js';
import { aHtml, hrefsDe } from '../notes/connexions.js';

/** «Font: <a href=url>lloc</a>», escapat; '' sense url vàlida. */
export function citaDeLOrigenExtern(origen) {
  const { url } = validaUrlExterna(origen?.url);
  if (!url) return '';
  return `<p>Font: <a href="${aHtml(url)}">${aHtml(new URL(url).hostname)}</a></p>`;
}

/* El cos porta un enllaç a l'adreça d'origen (normalitzada com la desa
   origenNota)? Els href es lligen amb hrefsDe (notes/connexions.js), la
   mateixa lectura que fa el cos d'una connexió per al Mur (D4). */
function portaEnllacDeLOrigen(html, origen) {
  const url = urlExterna(origen?.url);
  if (!url) return false;
  return hrefsDe(html).some((href) => urlExterna(href) === url);
}

/**
 * T71b · El cos d'un contingut de fora quan es compartix al Mur: el de la
 * nota (és de la persona, que l'ha pogut editar) i, només si ja no porta cap
 * enllaç a l'adreça d'origen, la cita al final. Sense url vàlida, el cos tal
 * qual. `html` ha de ser el cos ja sanejat: es mira el que arribarà al Mur.
 */
export function cosDeLExternPerAlMur(html, origen) {
  const cos = String(html ?? '');
  return portaEnllacDeLOrigen(cos, origen) ? cos : `${cos}${citaDeLOrigenExtern(origen)}`;
}
