/**
 * Arbre Genealògic · façana del grup «arxius»: catàleg tancat d'arxius
 * públics, consultes copiables i prompts mestres. Res d'ací cerca als
 * arxius ni envia res: només prepara textos que la persona copia.
 */
export { ARXIUS, DOMINIS_OFICIALS, arxiuPerId, esArxiu, arxiusPer, esAdrecaOficial } from './cataleg.js';
export { generaConsultes } from './consultes.js';
export { PLANTILLES_PROMPT, esPlantilla, generaPrompt } from './prompts.js';
