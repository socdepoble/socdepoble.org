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
