export function dinsDeLEncastat(node) { return node?.getRootNode?.().host?.localName === 'soc-de-poble'; }

/* Valors d'overflow-y amb què un element fa de desplaçador: el mateix criteri
   que enllacosInterns.js ('overlay' és l'àlies antic de WebKit per a auto). */
const OVERFLOW_DESPLACA = new Set(['auto', 'scroll', 'overlay']);
const px = (valor) => {
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : 0;
};
const estilDe = (node) => node.ownerDocument.defaultView.getComputedStyle(node);

/* El desplaçador de l'app més pròxim a l'element: el primer ascendent amb
   overflow-y auto o scroll i contingut per davall del que es veu (una columna
   de l'AppGridShell, .app-main__content). Puja per parentElement, que no
   travessa l'arrel ombra, i para a .sdp-root inclosa: el de l'amfitrió no és
   nostre. null si no n'hi ha cap. */
function desplacadorDeLApp(element) {
  const arrel = element.closest('.sdp-root');
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (OVERFLOW_DESPLACA.has(estilDe(node).overflowY) && node.scrollHeight > node.clientHeight) return node;
    if (node === arrel) return null;
  }
  return null;
}

/* El que tapen, enganxades a dalt del desplaçador, les barres sticky de la
   pàgina (la blava i la taronja, fills directes del contenidor de la pàgina):
   la més baixa acaba a top + alçada. Si el desplaçador és dins de la pàgina
   (un bloc amb scroll propi), les barres no hi són i no compten. */
function reservaDeLesBarres(element, desplacador) {
  const pagina = element.closest('.sdp-universal-page-container');
  if (!pagina || !desplacador.contains(pagina)) return 0;
  let reserva = 0;
  for (const fill of pagina.children) {
    const estil = estilDe(fill);
    if (estil.position !== 'sticky') continue;
    const dalt = parseFloat(estil.top);
    if (Number.isFinite(dalt)) reserva = Math.max(reserva, dalt + fill.offsetHeight);
  }
  return reserva;
}

/* On ha de deixar desplacaASeccio el desplaçador de l'app perquè la secció
   quede per davall de les barres: { desplacador, top }, o null si no hi ha cap
   desplaçador de l'app. El top és posició del contingut (no depén del scroll
   d'ara): si no canvia res de dalt, no canvia. */
export function destiDelSalt(element) {
  const desplacador = desplacadorDeLApp(element);
  if (!desplacador) return null;
  const estil = estilDe(element);
  const barres = reservaDeLesBarres(element, desplacador);
  // Les tres reserves descriuen la mateixa zona tapada. El CSS del focus
  // i els scroll-margin de la Consola ja inclouen les barres: no se sumen.
  const reserva = Math.max(px(estilDe(desplacador).scrollPaddingTop), px(estil.scrollMarginTop),
    barres > 0 ? barres + px(estil.getPropertyValue('--sdp-space-4')) : 0);
  const top = desplacador.scrollTop + element.getBoundingClientRect().top - desplacador.getBoundingClientRect().top
    - desplacador.clientTop - reserva;
  return { desplacador, top };
}

/**
 * Porta una secció a dalt de la vista, com scrollIntoView({ block: 'start' }),
 * però movent NOMÉS el desplaçador de l'app més pròxim: mai la pàgina de
 * l'amfitrió. El destí queda per davall de les barres enganxades amb el marge
 * acordat (--sdp-space-4), o al seu scroll-margin-top si en demana més (el
 * dels desplegables i les mètriques de la Consola ja reserva les dues barres).
 * `opcions` són les de scrollIntoView d'abans: el behavior es conserva
 * (smooth a l'Índex; sense, el del CSS a la secció de la URL). Sense cap
 * desplaçador de l'app: a socdepoble.org, scrollIntoView com abans; encastat,
 * res (moure's ací seria moure la pàgina de l'amfitrió).
 */
export function desplacaASeccio(element, opcions = { block: 'start' }) {
  const desti = destiDelSalt(element);
  if (!desti) {
    if (!dinsDeLEncastat(element)) element.scrollIntoView?.(opcions);
    return;
  }
  const { desplacador, top } = desti;
  // L'encastat pot començar fora de finestra; només es mou el visor propi.
  const inici = element.getBoundingClientRect().top + desplacador.scrollTop - top;
  const topVisible = opcions.respectaFinestra ? top - Math.max(0, -inici) : top;
  if (typeof desplacador.scrollTo === 'function') {
    desplacador.scrollTo(opcions.behavior ? { top: topVisible, behavior: opcions.behavior } : { top: topVisible });
  } else {
    desplacador.scrollTop = topVisible;
  }
}
