/**
 * copia.js — la còpia obligatòria del llibre de factures, la part pura.
 *
 * Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
 * xarxa»; pas 3 del mapa de la Gestoria, buit G9). IndexedDB es pot esborrar
 * (netejar les dades del lloc, un navegador que fa lloc): sense servidor, la
 * còpia fora del navegador és l'única manera de no perdre el llibre. Ací:
 *   · el nom del fitxer, amb el dia i l'hora de Madrid al segon (dos còpies
 *     no xoquen, i la carpeta les ordena soles);
 *   · la marca de la còpia: de cada cadena, l'ordre i l'empremta de l'últim
 *     registre que hi havia. El perfil fiscal la guarda
 *     (facturacio/magatzemPerfil.js) i verificaCadena la rep com a
 *     ultimsConeguts: un llibre que després en tinga menys és un TRUNCAMENT;
 *   · quants registres s'han fet des de l'última còpia, per a avisar-ne.
 * Només una còpia d'un llibre correcte, que conté el registre de la marca
 * vigent, deixa marca nova (useFacturacio.exporta; el magatzem refusa a més
 * una marca que recula, MARCA_ENRERE): si no, copiar un llibre truncat
 * esborraria la detecció del truncament (troballa F2, 261007).
 * Sense DOM, React ni xarxa.
 */
import { dataHoraAmbHus } from '../../facturacio/registre/empremta.js';

/** El tipus del fitxer de la còpia. */
export const TIPUS_COPIA = 'application/json';
/** El que accepta el selector de fitxers de la restauració. */
export const ACCEPTA_COPIA = '.json,application/json';

/**
 * El nom del fitxer de la còpia: «llibre-veri-factu-2026-10-07-034512.json».
 * La còpia d'un llibre amb incidències ho diu al nom
 * («llibre-veri-factu-incidencia-…»): serveix per a la gestoria, però no és
 * una còpia bona ni deixa marca (troballa F2 de la revisió, 261007).
 * @param {number|Date} instant
 * @param {{ incidencia?: boolean }} [opcions]
 * @returns {string}
 */
export function nomFitxerCopia(instant, { incidencia = false } = {}) {
  const iso = dataHoraAmbHus(instant);
  return `llibre-veri-factu-${incidencia ? 'incidencia-' : ''}${iso.slice(0, 10)}-${iso.slice(11, 19).split(':').join('')}.json`;
}

/** El tipus de l'XML de prova dels registres (Onada 6, 261009). */
export const TIPUS_XML = 'application/xml';

/**
 * El nom de l'XML de prova dels registres per a l'AEAT: «registres-aeat-prova-2026-10-07-034512.xml».
 * Porta «prova» al nom: no s'envia enlloc i encara li falta el bloc del sistema informàtic.
 * @param {number|Date} instant
 * @returns {string}
 */
export function nomFitxerXml(instant) {
  const iso = dataHoraAmbHus(instant);
  return `registres-aeat-prova-${iso.slice(0, 10)}-${iso.slice(11, 19).split(':').join('')}.xml`;
}

/**
 * La marca d'una còpia: l'últim registre de cada cadena del llibre exportat.
 * @param {ReadonlyArray<object>} registres els del llibre exportat (llibreDesDeJson), en l'ordre del llibre
 * @param {string} [nomFitxer]
 * @returns {{ cadenes: { idEmisor: string, ordre: number, empremta: string }[], nomFitxer?: string }}
 */
export function marcaDeCopia(registres, nomFitxer) {
  const ultims = new Map();
  for (const r of Array.isArray(registres) ? registres : []) {
    const actual = ultims.get(r.idEmisor);
    if (!actual || r.ordre > actual.ordre) ultims.set(r.idEmisor, { idEmisor: r.idEmisor, ordre: r.ordre, empremta: r.empremta });
  }
  return { cadenes: [...ultims.values()], ...(nomFitxer ? { nomFitxer } : {}) };
}

/**
 * Els registres coneguts per verificaCadena (ultimsConeguts): els de la marca de l'última còpia.
 * @param {{ dades?: { cadenes?: object[] } }|null} copia la versió vigent del perfil
 * @returns {{ idEmisor: string, ordre: number, empremta: string }[]}
 */
export function ultimsConegutsDe(copia) {
  return Array.isArray(copia?.dades?.cadenes) ? copia.dades.cadenes : [];
}

/**
 * Quants registres d'una cadena s'han fet després de l'última còpia (tots, si no n'hi ha cap).
 * @param {ReadonlyArray<object>} cadena la d'un emissor, en ordre
 * @param {{ dades?: { cadenes?: object[] } }|null} copia
 * @param {string} idEmisor
 * @returns {number}
 */
export function registresSenseCopia(cadena, copia, idEmisor) {
  const llista = Array.isArray(cadena) ? cadena : [];
  const conegut = ultimsConegutsDe(copia).find((c) => c.idEmisor === idEmisor);
  return llista.filter((r) => r.ordre > (conegut?.ordre ?? 0)).length;
}
