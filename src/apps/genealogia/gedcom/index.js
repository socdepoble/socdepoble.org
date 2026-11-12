/**
 * gedcom/index.js — façana d'intercanvi de l'Arbre Genealògic: GEDCOM 7.0 i
 * 5.5.1 (lectura també de 5.5), còpia JSON i descàrrega local.
 */

export { llegeixGedcom } from './llegeixGedcom.js';
export { escriuGedcom, dataGedcom, VERSIONS_ESCRIPTURA } from './escriuGedcom.js';
export { creaCopiaJson, llegeixCopiaJson, ESQUEMA_COPIA } from './copiaJson.js';
export { descarregaText, nomFitxer, TIPUS_GED, TIPUS_JSON } from './descarrega.js';
export { llegeixLlavorPrivada, llegeixFitxerArbre, lligTextFitxerArbre, ESQUEMA_LLAVOR, MAX_PISTES } from './llavorPrivada.js';
