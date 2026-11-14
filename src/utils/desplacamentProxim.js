/**
 * desplacamentProxim.js — Onada R26.3 · Porta a la vista el resultat d'una acció i hi mou el
 * focus, dins de l'app (CENS01 al Calendari Agrícola, CENS02 al Banc d'importació editorial).
 *
 * El salt és el canònic de l'app, desplacaASeccio (utils/desplacamentApp.js, el de PageFrame,
 * l'Índex i el SelectorOpcionsDesplegable): només mou el desplaçador de l'app més pròxim, para a
 * .sdp-root, encastat no toca mai la pàgina de l'amfitrió (Llei 8) i deixa el destí per davall de
 * les barres enganxades (la blava i la taronja). La primera versió del kit de Gemini en duia una
 * còpia pròpia amb un marge fix de 16 px: davall de les barres el principi del resultat quedava
 * tapat. Ací només hi ha el que és d'esta peça: el moviment reduït i el focus sense salt.
 */
import { desplacaASeccio } from './desplacamentApp.js';

function prefereixMovimentReduit(node) {
  const vista = node?.ownerDocument?.defaultView;
  return typeof vista?.matchMedia === 'function' && vista.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Porta `desti` a dalt del visor de l'app; suau, o immediat amb moviment reduït. */
export function desplacaDinsApp(desti) {
  if (!desti || typeof desti.getBoundingClientRect !== 'function') return false;
  desplacaASeccio(desti, { block: 'start', behavior: prefereixMovimentReduit(desti) ? 'auto' : 'smooth' });
  return true;
}

/** Mou el focus a `desti` sense cap salt de scroll (el salt ja l'ha fet desplacaDinsApp). */
export function enfocaSenseSalt(desti) {
  if (!desti || typeof desti.focus !== 'function') return false;
  desti.focus({ preventScroll: true });
  return true;
}
