/**
 * fitxaDelPoble.js · Fase 3a de l'eina de pobles nous (ordre nocturna
 * 261030_0252, Fase 3; disseny nit/viquipedia_disseny.md §4.2 i §4.4) · Quan
 * a la fitxa d'un poble que ja tenim li falta alguna dada, la seua pàgina
 * oferix portar-la de la Viquipèdia (PanellDeViquipedia.jsx, diferit, només
 * després d'un clic). Ací només hi ha la part pura que va al tros principal:
 *   · fitxaCompleta: si la fitxa porta tot el que pinta la pàgina;
 *   · clauDeViquipedia: la clau de la memòria cau local d'un poble;
 *   · fusionaAmbViquipedia: ompli els buits amb una entrada de la cau;
 *   · pobleHidratable: si la pàgina del poble porta el panell.
 *
 * Res d'ací importa l'algoritme (pobleDeViquipedia.js) ni el client de
 * Wikimedia: el tros principal no creix (qualitat.test.js ho vigila).
 *
 * La fitxa mana: mai no se sobreescriu un camp que la fitxa ja porte, ni
 * l'id, ni el títol, ni l'autor, ni els drets. Les imatges de Commons no
 * entren a la capçalera ni a la targeta (decisió del Mestre pendent, D-3):
 * només les pinta el panell, amb els seus crèdits i sense galetes.
 */
import { esAppNativa } from '../../config/origenPublic.js';
import { slugDelPoble } from './nomsDelPoble.js';

/** Les dades que fan completa la fitxa d'un poble (les que pinta la seua pàgina). */
export const CAMPS_DE_FITXA = Object.freeze(['content', 'image_url', 'provincia', 'comarca']);

/** Els que pot omplir la Viquipèdia, en l'ordre del DTO de pobleDeViquipedia.js. */
export const CAMPS_QUE_OMPLI = Object.freeze([
  'content', 'provincia', 'comarca', 'population', 'lat', 'lng', 'wikipedia_title', 'wikidata_id'
]);

/** Pujar-la invalida la cau de tots els pobles (la clau la porta). */
export const VERSIO_ALGORITME = 1;

const ESTATS_AMB_DADES = Object.freeze(['complet', 'parcial']);

const buit = (valor) => valor === undefined || valor === null
  || (typeof valor === 'string' && valor.trim() === '')
  || (typeof valor === 'number' && !Number.isFinite(valor));

/* Sobre les dades CRUES de la fitxa: `imageSrc` ja porta la imatge genèrica
   de resolveTownImageUrl i faria que tot semblara complet. */
/** Els camps de CAMPS_DE_FITXA que la fitxa no porta. */
export function campsQueFalten(town) {
  if (!town || typeof town !== 'object') return [...CAMPS_DE_FITXA];
  return CAMPS_DE_FITXA.filter((camp) => buit(town[camp]));
}

/** Cert si la fitxa porta totes les dades que pinta la pàgina del poble. */
export function fitxaCompleta(town) {
  return campsQueFalten(town).length === 0;
}

const nomDelPoble = (town) => (typeof town?.title === 'string' && town.title.trim() ? town.title
  : typeof town?.name === 'string' ? town.name : '');

const normalitza = (text) => String(text ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase('ca').replace(/\s+/g, ' ').trim();

/**
 * La clau de la cau d'un poble: el seu nom com a slug, la província de la
 * fitxa (per a no barrejar homònims) i la versió de l'algoritme. null si el
 * poble no té cap nom que es puga buscar.
 */
export function clauDeViquipedia(town) {
  const slug = slugDelPoble(nomDelPoble(town));
  if (!slug) return null;
  return `${slug}|${normalitza(town.provincia)}|a${VERSIO_ALGORITME}`;
}

/**
 * La guarda final (disseny §3.10): fora del País Valencià, la província no
 * desfà homònims. Una proposta només val per a un poble si porta el mateix
 * nom (el mateix slug) que la fitxa.
 */
export function esDelMateixPoble(town, dto) {
  const slug = slugDelPoble(nomDelPoble(town));
  return Boolean(slug) && typeof dto?.title === 'string' && slugDelPoble(dto.title) === slug;
}

/** Cert si una entrada de la cau porta dades que es poden posar a la fitxa. */
export function entradaAmbDades(entrada) {
  return Boolean(entrada?.dto) && ESTATS_AMB_DADES.includes(entrada.dto.estat);
}

/**
 * La fitxa amb els buits omplits per una entrada de la cau ({ dto, llegitEl }).
 * Només es tria entre CAMPS_QUE_OMPLI i només els que la fitxa no porta.
 * Torna EL MATEIX objecte si la fitxa ja és completa o si no s'hi ha omplit
 * res (Llei del Píxel); si no, una còpia amb `fontsDeViquipedia`:
 * { original, omplits, llegitEl }.
 */
export function fusionaAmbViquipedia(town, entrada) {
  if (!town || typeof town !== 'object' || fitxaCompleta(town)
    || !entradaAmbDades(entrada) || !esDelMateixPoble(town, entrada.dto)) return town;
  const omplits = CAMPS_QUE_OMPLI.filter((camp) => buit(town[camp]) && !buit(entrada.dto[camp]));
  if (!omplits.length) return town;
  return {
    ...town,
    ...Object.fromEntries(omplits.map((camp) => [camp, entrada.dto[camp]])),
    fontsDeViquipedia: Object.freeze({ original: town, omplits: Object.freeze(omplits), llegitEl: entrada.llegitEl ?? null })
  };
}

/** La fitxa crua d'una fitxa potser hidratada. */
export const fitxaOriginal = (town) => town?.fontsDeViquipedia?.original || town;

/**
 * Cert si la pàgina del poble porta el panell de la Viquipèdia: la fitxa
 * està incompleta (o ja s'ha completat amb la Viquipèdia, i el panell en
 * porta els crèdits) i no som a l'app nativa, on la CSP talla l'API
 * (vite.natiu.config.js) i el panell no es munta.
 */
export function pobleHidratable(town) {
  if (!town || typeof town !== 'object' || esAppNativa()) return false;
  const original = fitxaOriginal(town);
  return clauDeViquipedia(original) !== null && (Boolean(town.fontsDeViquipedia) || !fitxaCompleta(original));
}

/* Les mides estàndard de miniatura de Wikimedia (Common thumbnail sizes,
   consultat el 30-10-2026): una mida no estàndard es rebutja (T414805). */
const AMPLADA_DE_MINIATURA = 960;
const MINIATURA = /^(https:\/\/(?:upload|thumb)\.wikimedia\.org\/[^?#]*\/thumb\/[^?#]+\/)(\d+)px-([^/?#]+)$/;

/**
 * La miniatura de Commons a 960 px (mida estàndard) en lloc de la de 1920
 * que torna l'API (iiurlwidth=1600 s'arrodonix a 1920): la de la Torre Gran
 * passa de 700.626 a 188.601 bytes (GET del 30-10-2026). Una URL que no és
 * una miniatura de Commons, o que ja és més estreta, torna tal qual.
 */
export function miniaturaDeCommons(src) {
  const trossos = typeof src === 'string' ? MINIATURA.exec(src) : null;
  if (!trossos || Number(trossos[2]) <= AMPLADA_DE_MINIATURA) return src;
  return `${trossos[1]}${AMPLADA_DE_MINIATURA}px-${trossos[3]}`;
}
