/**
 * El Bar · llavors/index.js — les cartes que es poden carregar des
 * d'Ajustos › Carta (Onada 3).
 *
 *   exemple       la carta genèrica de nucli/llavor.js, la de la primera càrrega
 *   la-parroquia  la carta real de La Parròquia (llavors/laParroquia.js)
 *
 * La real porta els preus i els costos d'un negoci concret: només hi és al
 * servidor de desenvolupament i als builds que la demanen amb el literal de
 * compilació de baix (VITE_SDP_BAR_LLAVOR_LA_PARROQUIA=1, com el del
 * manifest). Sense, Vite trau del paquet l'adaptador i el seu CSV, i el botó
 * no ix. Amb, es carrega amb import() dinàmic: al build de l'app el CSV va en
 * un tros a part que només baixa qui la carrega; al paquet autònom (IIFE)
 * els import() s'incrusten i el CSV hi va sencer (uns 67 KB). Cap altre
 * fitxer l'importa de manera estàtica (frontera.test.js).
 */
import { errorBar } from '../nucli/comu.js';
import { ESTABLIMENT_EXEMPLE, llavorCarta } from '../nucli/llavor.js';

/* La de La Parròquia, darrere del literal de compilació EXACTE. */
const carregaLaParroquia = import.meta.env.DEV || import.meta.env.VITE_SDP_BAR_LLAVOR_LA_PARROQUIA === '1'
  ? () => import('./laParroquia.js').then((m) => m.llavorLaParroquia())
  : null;

/*
 * Totes les que coneix el Bar: { id, nom, accio, nomDelBar }. `nomDelBar` és
 * el nom que la llavor posa a l'establiment (null: el bar conserva el seu).
 */
const CONEGUDES = Object.freeze([
  Object.freeze({ id: 'la-parroquia', nom: 'La Parròquia · Menjar i Beure', accio: 'Carrega la carta de La Parròquia', nomDelBar: 'La Parròquia · Menjar i Beure' }),
  Object.freeze({ id: 'exemple', nom: 'Carta d’exemple', accio: 'Torna a la carta d’exemple', nomDelBar: null })
]);

const CARREGADORS = Object.freeze({
  /* La d'exemple no porta nom: només el slug (el camí de les fotos). */
  exemple: async () => ({ carta: llavorCarta(), establiment: { slug: ESTABLIMENT_EXEMPLE.slug }, avisos: [], resum: null }),
  ...(carregaLaParroquia ? { 'la-parroquia': carregaLaParroquia } : {})
});

/** Les llavors que es poden carregar en este build, en l'ordre dels botons: { id, nom, accio, nomDelBar }. */
export const LLAVORS = Object.freeze(CONEGUDES.filter((l) => Object.hasOwn(CARREGADORS, l.id)));

/** El nom d'una llavor pel seu id (sense id, la d'exemple: és la de la primera càrrega). */
export function nomDeLlavor(id) {
  return (CONEGUDES.find((l) => l.id === (id || 'exemple')) || { nom: 'Carta pròpia' }).nom;
}

/**
 * La llavor `id`: { carta, establiment, avisos, resum } (resum null a la d'exemple).
 * Una llavor que no existix, o que este build no porta, rebutja amb el codi LLAVOR.
 */
export function obteLlavor(id) {
  if (typeof id !== 'string' || !Object.hasOwn(CARREGADORS, id)) {
    return Promise.reject(errorBar('LLAVOR', `No hi ha cap carta «${String(id)}».`));
  }
  return CARREGADORS[id]();
}
