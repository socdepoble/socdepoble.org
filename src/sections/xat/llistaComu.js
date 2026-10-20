/**
 * llistaComu.js — Fase E (261020, tasca 3; pla 261020_2045 «El Comú») · quan
 * un missatge del xat porta una llista viva d'«El Comú».
 *
 * Ordre del Mestre (261020): la bombolla munta la targeta quan
 * `missatge.tipus === 'llista_comu'`. La instantània viatja a
 * `missatge.metadades.llista` (les dades de mostra i l'espècimen); el port de
 * la tasca 4 la donarà viva. Sense una instantània amb la forma mínima, la
 * bombolla pinta el text de sempre: un client vell o una llista que encara no
 * ha arribat no trenquen la conversa.
 *
 * El servidor encara no accepta este tipus (xat_envia només admet 'text' i el
 * CHECK de xat_missatges no el porta): ho resol la migració de la tasca 1.
 *
 * La instantània ha de passar la mateixa validació que la targeta
 * (validaLlista del nucli): un mode que este client no coneix, un títol buit o
 * un element trencat tornen el text de reserva, mai l'alerta «No es pot llegir
 * esta llista» al lloc del missatge (revisió adversarial 261020).
 *
 * JS pur: sense DOM ni React.
 */
import { validaLlista } from '../../components/PedraSeca/UniversalListCard/nucliComu.js';

export const TIPUS_LLISTA_COMU = 'llista_comu';

/** La instantània de la llista d'un missatge, o null si el missatge no en porta cap de llegible. */
export function llistaDeMissatge(missatge) {
  if (missatge?.tipus !== TIPUS_LLISTA_COMU) return null;
  const llista = missatge.metadades?.llista;
  if (!llista || typeof llista !== 'object') return null;
  return validaLlista(llista).ok ? llista : null;
}
