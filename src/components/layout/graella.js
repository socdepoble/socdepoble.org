/**
 * graella.js · T7 (P2) · La font única dels punts de tall i del plegat de la
 * closca de tres columnes (AppGridShell). Pur: cap React ni cap DOM.
 *
 * Abans, els mateixos números vivien escrits a mà en set llocs. Ara el JS
 * els importa d'ací (AppGridShell, UniversalToolbar). Els fulls CSS no poden
 * importar JS: les xifres que hi queden (AppGridShell.css, layout.css) i les
 * d'App.jsx les vigila graella.capes.test.js contra este mòdul. Si se'n canvia
 * una, la prova falla fins que les altres la seguixen.
 *
 * Mides de la closca (data-layout):
 *   · «estret»: una sola columna; navegació i llista són panells superposats.
 *   · «mitja»: llista i detall; la navegació és un panell superposat. Amb
 *     railEsquerra (barres, ordre del Mestre 261004), la navegació és un rail
 *     fix de PUNTS_DE_TALL.plegada i desplegar-la obri el panell de damunt.
 *   · «ample»: tres columnes; navegació i llista es poden plegar en rail.
 */

export const PUNTS_DE_TALL = Object.freeze({
  /** Amplària de la closca per davall de la qual és «estret». És el tall de
   *  tauleta xicoteta de layout.css (≤720px) i el de data-sdp-estret
   *  d'App.jsx. */
  estret: 720,
  /** Amplària mínima de la closca per a «ample». Puja si les columnes
   *  desades no hi caben (amplariaMinimaAmple). */
  ample: 900,
  /** Columna plegada en rail (--app-grid-col-collapsed d'AppGridShell.css)
   *  i barra principal plegada (layout.css): el mateix eix d'icones. */
  plegada: 56,
  /** Amplària mínima de la columna de detall (la dreta), en «ample» i en
   *  «mitja» (AppGridShell.css: calc(100% - 320px) i minmax(320px, 1fr)). */
  detall: 320,
  /** Marge que el càlcul reserva per a cada separador en «ample». La pista
   *  de la CSS fa 0px (--app-grid-resizer): este píxel és només de mesura. */
  separador: 1,
  /** Amplària pròpia per davall de la qual la barra d'eines de l'editor
   *  agrupa els formats darrere d'«Aa» (UniversalToolbar). */
  eines: 500,
  /** Finestra fins on la barra lateral de l'app és calaix (App.jsx,
   *  AMPLE_MAXIM_COMPACTE; layout.css, «BREAKPOINT MESTRE · ≤1023px»). */
  compacte: 1023
});

/** Les tres columnes de la closca, en l'ordre del DOM. */
export const COLUMNES = Object.freeze(['left', 'middle', 'right']);

/**
 * Amplària mínima de la closca per a pintar tres columnes: navegació i
 * llista (la seua amplària desada o, plegades, la del rail), el mínim del
 * detall i els dos separadors. Mai per davall de PUNTS_DE_TALL.ample.
 * `plegades`: { left, middle } (booleans); `amplades`: { left, middle } en px.
 */
export function amplariaMinimaAmple(plegades = {}, amplades = {}) {
  const columna = (clau) => (plegades?.[clau] ? PUNTS_DE_TALL.plegada : Number(amplades?.[clau]) || 0);
  return Math.max(
    PUNTS_DE_TALL.ample,
    columna('left') + columna('middle') + PUNTS_DE_TALL.detall + PUNTS_DE_TALL.separador * 2
  );
}

/**
 * La mida de la closca per a una amplària: 'estret', 'mitja' o 'ample'.
 * Plegar una columna en «ample» lleva espai a la mínima: la closca pot
 * passar a «ample» sense que el contenidor canvie de mida.
 */
export function midaDeGraella(amplada, plegades = {}, amplades = {}) {
  if (amplada < PUNTS_DE_TALL.estret) return 'estret';
  if (amplada < amplariaMinimaAmple(plegades, amplades)) return 'mitja';
  return 'ample';
}

/**
 * T6 · Les columnes tancades per a una mida i un panell obert ('left',
 * 'middle' o null). La mateixa regla pinta inert i aria-hidden a la closca i
 * la llig la guarda del focus.
 *  · En «ample» no se'n tanca cap: plegar és un rail, no un tancament.
 *  · En «mitja» la navegació només és oberta com a panell. Amb
 *    `railEsquerra` (barres, ordre del Mestre 261004: «les dues barres de la
 *    Wiki han d'estar sempre presents plegades»), és un rail sempre obert.
 *  · En «estret» cada columna és oberta quan és el seu panell, i el detall,
 *    quan no n'hi ha cap.
 * Sense opcions, el d'abans (el Xat i les apps no passen railEsquerra).
 */
export function columnesTancades(mida, panell, { railEsquerra = false } = {}) {
  const navegacioEnRail = mida === 'mitja' && railEsquerra;
  return {
    left: mida !== 'ample' && panell !== 'left' && !navegacioEnRail,
    middle: mida === 'estret' && panell !== 'middle',
    right: mida === 'estret' && panell !== null
  };
}
