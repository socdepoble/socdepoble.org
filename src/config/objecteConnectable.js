/**
 * objecteConnectable.js — El nucli lleuger de l'objecte connectable
 * (T43, ordre del Mestre, 260928).
 *
 * Un sol model per a tots els «Connectar»: un descriptor pur
 *   { tipus, id, titol, seccio?, ruta, autor? }
 * amb `tipus` de la llista tancada de origenNota.js. T63.2 · el mateix
 * descriptor diu on porta «Comentar» (rutaXatDePagina, modeXat, esPrivat).
 *
 * Per què un mòdul a banda: navigation.js importa el contingut de llavor
 * (sectionContent.js) en carregar-se, i la barra blava (UniversalPage,
 * useAccions) no l'ha d'arrossegar. Ací només hi ha el que no necessita
 * dades; navigation.js ho reexporta, i és la porta que usen les seccions.
 * Funcions pures, sense React ni xarxa.
 */
import { TIPUS_OBJECTE } from '../data/origenNota.js';
import { subjecteDeXat } from '../data/contracte.js';

export { TIPUS_OBJECTE };

const MAXIM_RUTA = 300;
const text = (valor) => (valor == null ? '' : String(valor));

/** Ruta interna i segura: relativa a l'arrel de l'app, mai «//», «\\», espais ni un esquema. */
export function esRutaInterna(ruta) {
  if (typeof ruta !== 'string' || !ruta || ruta.length > MAXIM_RUTA) return false;
  if (!ruta.startsWith('/') || ruta.startsWith('//')) return false;
  return !/[\\\u0000-\u001F\u007F\s]/.test(ruta);
}

/** Descriptor d'una pàgina. Sense id propi, la clau és la ruta i, si no n'hi ha, el títol. */
export function objecteDePagina({ titol = '', ruta = '', id = '' } = {}) {
  const rutaNeta = esRutaInterna(ruta) ? ruta : '';
  return { tipus: 'pagina', id: text(id) || rutaNeta || text(titol), titol: text(titol), seccio: '', ruta: rutaNeta, autor: null };
}

/* El tipus d'objecte d'un element de secció (Mur, Mercat, agenda, Pobles…).
   Viu ací, sense dades, perquè el lector de connexions (notes/connexions.js)
   el necessita sense arrossegar la llavor; navigation.js el reexporta. */
const TIPUS_DE_SECCIO = Object.freeze({
  mur: 'publicacio', mercat: 'producte', events: 'esdeveniment',
  pobles: 'poble', multimedia: 'multimedia', notes: 'nota'
});

/** El tipus d'objecte d'una secció, o null si no és cap secció d'elements. */
export const tipusDeSeccio = (seccio) => TIPUS_DE_SECCIO[seccio] || null;

/* ── T63.2 (doctrina del Mestre, 260928) · El Xat comú de la Pàgina Universal ──
   Cada element té la seua Pàgina Universal i no hi ha comentaris niats davall
   de cap publicació: «Comentar» obri (o crea) el xat comú d'eixa pàgina. Qui
   decidix si és un grup de debat (un element) o la Comunitat (una entitat, un
   grup o un poble) és XatContext.obriFilDePagina, no ací. Una persona o una
   IA: el missatge directe de sempre (/xat?amb=). Les notes, les carpetes, les
   categories i les etiquetes són privades: no tenen xat comú.
   Qui té xat comú ho diu UNA sola regla, la del contracte (subjecteDeXat,
   src/data/contracte.js): els mateixos tipus, el mateix límit d'id i la
   mateixa llista tancada de pàgines amb xat (PAGINES_AMB_XAT) que la llavor
   (localXat) i l'RPC. Ací no se'n fa cap còpia: el botó no pot prometre un
   xat que obriFilDePagina rebutjaria. Per això una pàgina privada (/notes,
   /el-meu-perfil, /registre), una fitxa amb consulta (?item=) o una ruta que
   no és a la llista no en tenen. */
const TIPUS_XAT_DIRECTE = Object.freeze(['persona', 'ia']);
const TIPUS_PRIVATS = Object.freeze(['nota', 'carpeta', 'categoria', 'etiqueta']);

/* El subjecte del xat comú (subjecteDeXat), o null. Una 'pagina' es clava per
   la seua ruta, mai per l'id (objecteDePagina hi pot posar el títol, i un títol
   canvia). */
function subjecteDeComentar(objecte) {
  if (!objecte || typeof objecte !== 'object') return null;
  if (objecte.tipus !== 'pagina') return subjecteDeXat(objecte);
  const ruta = typeof objecte.ruta === 'string' ? objecte.ruta.trim() : '';
  return ruta ? subjecteDeXat({ ...objecte, id: ruta, ruta }) : null;
}

/** Una nota, una carpeta, una categoria o una etiqueta: no tenen xat comú MAI,
 * i Comentar no s'hi ofereix (useAccions l'amaga). */
export const esPrivat = (objecte) => TIPUS_PRIVATS.includes(objecte?.tipus);

/**
 * On porta «Comentar» sobre un objecte tipat, o null si no té on anar:
 *   · xat comú: /xat?sobre=<tipus>:<id>&titol=<titol>&ruta=<ruta>
 *     (cada valor amb encodeURIComponent; el que no ve, no s'escriu). Tipus,
 *     id, títol i ruta són els que en queden després de subjecteDeXat: una
 *     'organitzacio' viatja com a 'entitat', el títol en porta 100 com a molt.
 *   · persona o IA: el missatge directe, /xat?amb=<id>.
 * El lector de ?sobre= és XatSection (onada 3): talla pel PRIMER «:» i passa
 * { tipus, id, ruta, titol } a obriFilDePagina, que torna a validar-ho igual.
 */
export function rutaXatDePagina(objecte) {
  if (TIPUS_XAT_DIRECTE.includes(objecte?.tipus)) {
    const id = text(objecte.id);
    return id.trim() ? `/xat?amb=${encodeURIComponent(id)}` : null;
  }
  const subjecte = subjecteDeComentar(objecte);
  if (!subjecte) return null;
  const parts = [`sobre=${encodeURIComponent(subjecte.tipus)}:${encodeURIComponent(subjecte.id)}`];
  if (subjecte.titol) parts.push(`titol=${encodeURIComponent(subjecte.titol)}`);
  if (subjecte.ruta) parts.push(`ruta=${encodeURIComponent(subjecte.ruta)}`);
  return `/xat?${parts.join('&')}`;
}

/** Quin xat obri «Comentar»: 'comu', 'directe' o null (cap). Dona nom al botó de la barra blava. */
export function modeXat(objecte) {
  if (!rutaXatDePagina(objecte)) return null;
  return TIPUS_XAT_DIRECTE.includes(objecte.tipus) ? 'directe' : 'comu';
}

/**
 * Ruta de Connectar per a un descriptor: els paràmetres de sempre (item_id,
 * title, sectionId, targetUserId, autorTipus, author) més `objecte` i `ruta`.
 * `extra` afig paràmetres propis d'un lent (p. ex. organitzacio=ID, que llig
 * T43b). No s'inventa res: el que no ve, no s'escriu.
 */
export function rutaConnectarObjecte(objecte, extra = {}) {
  const params = new URLSearchParams();
  if (objecte?.id) params.set('item_id', String(objecte.id));
  if (objecte?.titol) params.set('title', String(objecte.titol));
  if (objecte?.seccio) params.set('sectionId', String(objecte.seccio));
  if (objecte?.autor?.id) {
    params.set('targetUserId', String(objecte.autor.id));
    if (objecte.autor.tipus) params.set('autorTipus', String(objecte.autor.tipus));
  }
  if (objecte?.autor?.nom) params.set('author', String(objecte.autor.nom));
  if (TIPUS_OBJECTE.includes(objecte?.tipus)) params.set('objecte', objecte.tipus);
  if (esRutaInterna(objecte?.ruta)) params.set('ruta', objecte.ruta);
  for (const [clau, valor] of Object.entries(extra || {})) {
    if (valor != null && String(valor) !== '') params.set(clau, String(valor));
  }
  return `/connectar?${params.toString()}`;
}
