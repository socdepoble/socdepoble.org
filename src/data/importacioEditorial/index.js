/** Contracte pur d’importació editorial, consumit pel CLI diferit canònic. */
export { importaEditorial, verificaAdjuntsEditorials, sha256Editorial, origenEditorial } from './pipelineEditorial.js';
export { sanejaHtmlEditorial, textEditorialNet, urlEditorialSegura } from './htmlEditorialSegur.js';
export { parsejaXmlEditorialSegur, LIMITS_EDITORIALS } from './xmlEditorialSegur.js';
