/**
 * arquetipDeData.js — què fa la data d'una targeta del Mur segons el tipus
 * de publicació (P0-77 / IDEA-208, R16-P).
 *
 * Ordre del Mestre, 261109 20:57 · La data d'una targeta no es comporta
 * igual per a tot: «si es un evento […] el botón de la fecha del evento es
 * pinchable y distinto a la card, que la card a lo mejor si es "busco perro"
 * no hace falta que el botón sea pinchable». Tres arquetips:
 *  · 'esdeveniment' · un acte (type 'event'): la data porta al dia de
 *    l'acte al Calendari (EventCard · usePastillaDelDia).
 *  · 'efimer' · un avís de veïnat que caduca (busco gos, claus trobades, avís
 *    d'aigua), una fitxa d'Animalets d'animal perdut o trobat
 *    (dades.modalitat) o una alerta municipal: la data és un <time> informatiu, sense
 *    clic (onDateTime={false}); les accions primàries són Comentar (el xat) i
 *    Compartir, al peu de la targeta.
 *  · 'editorial' · la resta (crònica, notícia, pàgina): la pastilla de
 *    sempre, cap al mes del Calendari (ordre del Mestre, 261001, carril A).
 *
 * Una pàgina del sistema, un producte del Mercat o un poble mai no són
 * efímers (esPublicacioDelMur). Es lligen la modalitat d'una fitxa d'Animalets
 * (el flux universal la desa a dades.modalitat, no a les etiquetes) i les
 * etiquetes que ja porta la publicació (labels, categories, tags, category i
 * tag), amb la mateixa
 * normalització de les alertes municipals (normalitzaEtiqueta: sense accents
 * ni majúscules, i cap etiqueta de més de 64 caràcters). Funció pura.
 */
import { esPublicacioDelMur, normalitzaEtiqueta, TIPUS_ALERTA } from './alertesMunicipals.js';

/* Les etiquetes normalitzades que fan efímera una publicació del Mur. */
const ETIQUETES_EFIMERES = new Set([
  'avis',
  'avis_veinal',
  'busco',
  'perdut',
  'perduda',
  'trobat',
  'trobada',
  'ajuda_veinal',
  'claus_trobades',
  'avis_d_aigua'
]);

/* El payload és d'un veí: una llista enorme no es recorre sencera (la mateixa
   cota d'alertesMunicipals.js). */
const MAXIM_ETIQUETES = 32;

/* Les modalitats d'Animalets que són un avís que caduca (MODALITATS.animalets
   a publicacioUniversal.js): l'adopció i la cura no ho són. */
const MODALITATS_ANIMALETS_EFIMERES = new Set(['perdut', 'trobat']);

function esAnimalPerdutOTrobat(item) {
  const dades = item.dades;
  return item.ambit === 'animalets'
    && Boolean(dades) && typeof dades === 'object' && !Array.isArray(dades)
    && typeof dades.modalitat === 'string'
    && MODALITATS_ANIMALETS_EFIMERES.has(dades.modalitat);
}

function etiquetesDe(item) {
  const llista = (valor) => (Array.isArray(valor) ? valor.slice(0, MAXIM_ETIQUETES) : []);
  return [...llista(item.labels), ...llista(item.categories), ...llista(item.tags), item.category, item.tag];
}

/**
 * L'arquetip de la data d'un element del Mur: 'esdeveniment' | 'efimer' |
 * 'editorial'. `alertaMunicipal`: el tipus d'alerta que ja ha comprovat qui
 * pinta la llista (TargetaDelMur), o null.
 */
export function arquetipDeLaData(item, { alertaMunicipal = null } = {}) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return 'editorial';
  if (item.type === 'event') return 'esdeveniment';
  if (!esPublicacioDelMur(item)) return 'editorial';
  if (typeof alertaMunicipal === 'string' && Object.hasOwn(TIPUS_ALERTA, alertaMunicipal)) return 'efimer';
  if (item.isAvis === true) return 'efimer';
  if (esAnimalPerdutOTrobat(item)) return 'efimer';
  return etiquetesDe(item).some((etiqueta) => ETIQUETES_EFIMERES.has(normalitzaEtiqueta(etiqueta)))
    ? 'efimer'
    : 'editorial';
}
