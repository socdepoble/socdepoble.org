/**
 * vistaDeLaFitxa.js · CU (Onada 3, correcció de la revisió, 261003) · On
 * queda la vista quan s'obri o es tanca la fitxa del Snippet.
 *
 * Obrir la fitxa només canvia la consulta (/control → /control?fitxa=snippet):
 * el camí és el mateix. App només mou el focus a <main> quan canvia el camí
 * (App.jsx, «Restaurar el focus a main en canviar de ruta»), i navigate() no
 * torna a dalt cap desplaçador: el del contingut (.app-main__content) continua
 * muntat i conserva el seu scrollTop. Al mòbil, la fitxa s'obria al final i el
 * títol i el botó principal quedaven amagats per dalt, amb el focus perdut al
 * <body>.
 *
 * Ací es fa el que fa una ruta nova: el desplaçador de l'app a la posició que
 * toca (dalt en obrir la fitxa; on era el Panell en tornar-hi) i el focus a
 * <main>, sense moure la vista.
 *
 * El desplaçador es busca pujant des d'un node de la vista fins al <main> de
 * l'app, inclòs, amb la mateixa regla que l'interceptor d'enllaços
 * (desplacadorDelClic): el de l'amfitrió no és nostre. Sense <main> no es toca
 * res. Res de scrollIntoView, que dins d'un amfitrió també mouria la seua
 * pàgina.
 */
import { desplacadorDelClic } from '../../app/enllacosInterns.js';

const mainDe = (node) => (typeof node?.closest === 'function' ? node.closest('main') : null);

/** El desplaçador de l'app que conté `node`, o null (sense <main>, o cap). */
export function desplacadorDeLaVista(node) {
  const main = mainDe(node);
  return main ? desplacadorDelClic(null, node, main) : null;
}

/** Fins on està desplaçada la vista que conté `node` (0 si no n'hi ha). */
export function posicioDeLaVista(node) {
  return desplacadorDeLaVista(node)?.scrollTop ?? 0;
}

/* De colp, com arriba un document nou: sense el desplaçament suau del
   contenidor. Un navegador que no coneix 'instant' rebutja el diccionari i es
   cau a scrollTop (com portaADalt, a enllacosInterns.js). */
function porta(desplacador, top) {
  if (typeof desplacador.scrollTo === 'function') {
    try { desplacador.scrollTo({ top, behavior: 'instant' }); return; } catch { /* scrollTop */ }
  }
  desplacador.scrollTop = top;
}

/**
 * Porta la vista que conté `node` a `top` i el focus al <main> de l'app, sense
 * desplaçar res més. Sense <main> no fa res.
 */
export function recolocaLaVista(node, top = 0) {
  const main = mainDe(node);
  if (!main) return;
  const desplacador = desplacadorDelClic(null, node, main);
  if (desplacador) porta(desplacador, top);
  if (typeof main.focus === 'function') main.focus({ preventScroll: true });
}
