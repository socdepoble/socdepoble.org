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
 *   · «estret» (fins a 720 inclòs): una sola columna; navegació i llista són
 *     panells superposats.
 *   · «mitja»: llista i detall; la navegació és un panell superposat. Només
 *     el Xat i les apps: el Workspace porta columnesFixes.
 *   · «ample»: tres columnes; navegació i llista es poden plegar en rail.
 *
 * Columnes fixes (ordre del Mestre, 30-10-2026 ~12:45: «fora de mòbil, l'Universal-
 * Workspace ha de mantindre sempre les 3 columnes fixes en la graella, mai
 * superposades com a calaix flotant amb fons fosc»). Amb `columnesFixes`, la
 * closca no passa mai per «mitja»: per damunt d'«estret» és «ample», i si les
 * amplades desades no hi caben, pistesAjustades les reparteix fins al mínim de
 * cada columna (per davall de 762, fins al sòl de minimsDeGraella, i el detall
 * conserva el seu mínim). Els panells flotants (i el vel) queden per a «estret».
 * El Xat i les apps, que no el passen, conserven les tres mides. El rail fix
 * de la navegació en «mitja» (railEsquerra, 261004) i la llista en rail en
 * «mitja» (railMitja, 261003) només els passava el Workspace i, amb les
 * columnes fixes, ja no s'activaven: s'han retirat (ordre del Mestre,
 * 30-10-2026 ~15:00, decisió 4).
 */

export const PUNTS_DE_TALL = Object.freeze({
  /** Amplària de la closca fins a la qual (inclosa) és «estret». És el tall
   *  de tauleta xicoteta de layout.css (@media i @container, max-width:
   *  720px) i el de data-sdp-estret d'App.jsx (≤ 720). Ordre del Mestre
   *  (30-10-2026 ~15:00, decisió 1: «> 720 px per a 3 columnes fixes i
   *  <= 720 px per a vista mòbil»): abans, 720 justos ja eren «ample» o
   *  «mitja» i la CSS ja pintava el mòbil. */
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
 * Ordre del Mestre (30-10-2026, Bloc de Notes) · Amb la finestra entre
 * «estret» i «compacte» (de 721 a 1023 px), les tres columnes obertes hi
 * anirien justes: l'UniversalWorkspace arrenca amb la navegació plegada en
 * rail. Des de 1024 arrenquen totes obertes, i fins a 720 és la vista mòbil.
 * Només decidix l'estat de muntada: després mana la persona.
 */
export function navegacioPlegadaEnArrencar(ampladaFinestra) {
  const amplada = Number(ampladaFinestra);
  return amplada > PUNTS_DE_TALL.estret && amplada <= PUNTS_DE_TALL.compacte;
}

/** La mateixa decisió amb la finestra d'ara, com la llig App.jsx en muntar.
 *  Fora del navegador no plega res. */
export function navegacioPlegadaDeLaFinestra() {
  return typeof window !== 'undefined' && navegacioPlegadaEnArrencar(window.innerWidth);
}

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
 * Amb `columnesFixes` (ordre del Mestre, 30-10-2026), mai 'mitja': per damunt
 * d'«estret», 'ample' (les pistes s'ajusten amb pistesAjustades).
 * «Estret» fins a PUNTS_DE_TALL.estret inclòs (decisió 1 del Mestre,
 * 30-10-2026 ~15:00): el mateix tall que la CSS i App.jsx, per a tots els
 * consumidors (el Workspace, el Xat i les apps).
 */
export function midaDeGraella(amplada, plegades = {}, amplades = {}, { columnesFixes = false } = {}) {
  if (amplada <= PUNTS_DE_TALL.estret) return 'estret';
  if (columnesFixes) return 'ample';
  if (amplada < amplariaMinimaAmple(plegades, amplades)) return 'mitja';
  return 'ample';
}

/* Les columnes desplegades, en l'ordre del DOM. */
const obertesDe = (plegades) => ['left', 'middle'].filter((clau) => !plegades?.[clau]);

/* L'espai de navegació i llista: el de la closca menys els rails de les
   plegades, el mínim del detall i els dos separadors. */
const espaiDeColumnes = (amplada, obertes) => amplada
  - (2 - obertes.length) * PUNTS_DE_TALL.plegada
  - PUNTS_DE_TALL.detall
  - PUNTS_DE_TALL.separador * 2;

/* Cada columna oberta cedix l'excés sobre `espai` en proporció al marge que
   té sobre el seu `terra`, i mai baixa d'ell. Sense excés, les pistes. */
function cedixFins(pistes, obertes, espai, terra) {
  const exces = obertes.reduce((suma, clau) => suma + pistes[clau], 0) - espai;
  if (exces <= 0) return pistes;
  const marge = Object.fromEntries(obertes.map((clau) => [clau, Math.max(0, pistes[clau] - (Number(terra?.[clau]) || 0))]));
  const margeTotal = obertes.reduce((suma, clau) => suma + marge[clau], 0);
  if (margeTotal <= 0) return pistes;
  const resultat = { ...pistes };
  let perCedir = Math.min(exces, margeTotal);
  obertes.forEach((clau, index) => {
    const darrera = index === obertes.length - 1;
    const cedix = Math.min(marge[clau], darrera ? perCedir : Math.ceil((exces * marge[clau]) / margeTotal));
    resultat[clau] -= cedix;
    perCedir -= cedix;
  });
  return resultat;
}

/**
 * Columnes fixes (ordre del Mestre, 30-10-2026: «si l'espai total és més
 * ajustat, reparteix/adapta els límits de les pistes de la graella sense fer
 * saltar la columna a panell flotant») · Les amplades que es pinten en
 * «ample» per a una amplària de closca. Si navegació i llista (desplegades)
 * caben amb el mínim del detall i els dos separadors, les desades, sense
 * tocar. Si no, cada columna desplegada cedix l'excés en proporció al marge
 * que té sobre el seu mínim (`minims`), i mai baixa d'ell: el detall s'estreny
 * només quan les dues ja són al mínim. Les desades no canvien (eixamplar la
 * finestra les torna). Una columna plegada conserva la seua desada (el rail
 * fa PUNTS_DE_TALL.plegada i no se'n pinta cap). Sense amplària mesurada (0),
 * les desades.
 * Amb `sols` (Gauntlet 261030, cicle 4), quan els mínims no hi caben (vegeu
 * minimsDeGraella), les dues cedixen encara, en proporció al marge que tenen
 * sobre el seu sòl, i el detall conserva el seu mínim. Una oberta per davall
 * del mínim que val ara (un arrossegament fet en una graella estreta) es pinta
 * al mínim. Sense `sols`, els mínims són el terra, com abans.
 * `plegades`: { left, middle }; `amplades`, `minims` i `sols`: { left, middle } en px.
 */
export function pistesAjustades(amplada, plegades = {}, amplades = {}, minims = {}, sols = minims) {
  const desades = { left: Math.round(Number(amplades?.left) || 0), middle: Math.round(Number(amplades?.middle) || 0) };
  if (!(amplada > 0)) return desades;
  const obertes = obertesDe(plegades);
  const espai = espaiDeColumnes(amplada, obertes);
  const efectius = minimsDeGraella(amplada, plegades, minims, sols);
  const base = { ...desades };
  obertes.forEach((clau) => { base[clau] = Math.max(base[clau], efectius[clau]); });
  /* Primer fins als mínims (les xifres de sempre per damunt de 762) i, si
     encara no hi caben, fins als sòls: sense salts d'una amplària a l'altra. */
  return cedixFins(cedixFins(base, obertes, espai, minims), obertes, espai, efectius);
}

/**
 * Columnes fixes (Gauntlet 261030, cicle 4; l'ordre del Mestre demana
 * «reparteix/adapta els límits de les pistes» i separadors que l'usuari puga
 * moure lliurement) · Els mínims de navegació i llista que valen per a una
 * amplària de closca. Si els de les desplegades caben amb el mínim del detall
 * i els dos separadors, `minims`. Si no (les dues obertes en una closca de 720
 * a 761 px: 200 + 240 + 320 + 2 = 762), els `sols`: el detall conserva el seu
 * mínim i els separadors poden intercanviar espai entre navegació i llista en
 * lloc de quedar congelats. Sense amplària mesurada (0) o sense `sols`, `minims`.
 * `plegades`: { left, middle }; `minims` i `sols`: { left, middle } en px.
 */
export function minimsDeGraella(amplada, plegades = {}, minims = {}, sols = minims) {
  const base = { left: Number(minims?.left) || 0, middle: Number(minims?.middle) || 0 };
  if (!(amplada > 0)) return base;
  const obertes = obertesDe(plegades);
  if (obertes.reduce((suma, clau) => suma + base[clau], 0) <= espaiDeColumnes(amplada, obertes)) return base;
  const sol = (clau) => Math.min(base[clau], Number(sols?.[clau]) || base[clau]);
  return { left: sol('left'), middle: sol('middle') };
}

/**
 * T6 · Les columnes tancades per a una mida i un panell obert ('left',
 * 'middle' o null). La mateixa regla pinta inert i aria-hidden a la closca i
 * la llig la guarda del focus.
 *  · En «ample» no se'n tanca cap: plegar és un rail, no un tancament.
 *  · En «mitja» la navegació només és oberta com a panell.
 *  · En «estret» cada columna és oberta quan és el seu panell, i el detall,
 *    quan no n'hi ha cap.
 * Decisió 4 del Mestre (30-10-2026 ~15:00) · L'opció railEsquerra (la
 * navegació en rail fix en «mitja») només la passava el Workspace, que amb
 * les columnes fixes ja no hi arriba: s'ha retirat.
 */
export function columnesTancades(mida, panell) {
  return {
    left: mida !== 'ample' && panell !== 'left',
    middle: mida === 'estret' && panell !== 'middle',
    right: mida === 'estret' && panell !== null
  };
}
