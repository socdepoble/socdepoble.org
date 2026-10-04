/**
 * contracteMapa.js — vocabulari tancat de sdp.mapa.v1.
 *
 * El compartixen el compilador (construeixMapa.js, que només corre en node) i
 * la interfície (mapaContent.js). Així el paquet del navegador no porta el
 * compilador, i cap dels dos pot inventar un tipus que l'altre no conega.
 * Font: _wiki_de_poble/02_saber/03_consola_termodinamica/04_contracte_de_dades.md
 */
export const ESQUEMA_MAPA = 'sdp.mapa.v1';
export const TIPUS_NODE = Object.freeze(['skill', 'plantilla', 'ruta', 'script', 'hook', 'tasca', 'agent', 'document', 'porta']);
export const TIPUS_ARESTA = Object.freeze(['crida', 'llig', 'escriu', 'dispara', 'encamina', 'carrega', 'governa']);
export const CONFIANCES = Object.freeze(['declarat', 'derivat', 'inferit']);
export const SEVERITATS = Object.freeze(['alta', 'mitjana', 'baixa']);
export const ESTATS_TASCA = Object.freeze(['viu', 'mort', 'declarat-sense-llancador', 'llancador-sense-declaracio', 'desconegut']);

/**
 * Correcció 261004 (verificador de la tercera passada, punt 1) · Les unitats
 * de les mètriques amb valor (les altres són fraccions), tal com les escriu el
 * compilador, en plural, amb el seu singular: la interfície les fa concordar
 * amb el valor («1 minut», «2 minuts»; mapaContent.js · valorMetrica). Una
 * prova contrasta esta llista amb el compilador: una unitat nova que no siga
 * ací fa roja la prova.
 */
export const UNITATS_METRICA = Object.freeze({
  minuts: 'minut',
  hores: 'hora',
  recaigudes: 'recaiguda',
  'segells fòssils': 'segell fòssil',
  'línies mal formades': 'línia mal formada'
});
