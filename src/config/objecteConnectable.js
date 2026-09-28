/**
 * objecteConnectable.js — El nucli lleuger de l'objecte connectable
 * (T43, ordre del Mestre, 260928).
 *
 * Un sol model per a tots els «Connectar»: un descriptor pur
 *   { tipus, id, titol, seccio?, ruta, autor? }
 * amb `tipus` de la llista tancada de origenNota.js.
 *
 * Per què un mòdul a banda: navigation.js importa el contingut de llavor
 * (sectionContent.js) en carregar-se, i la barra blava (UniversalPage,
 * useAccions) no l'ha d'arrossegar. Ací només hi ha el que no necessita
 * dades; navigation.js ho reexporta, i és la porta que usen les seccions.
 * Funcions pures, sense React ni xarxa.
 */
import { TIPUS_OBJECTE } from '../data/origenNota.js';

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
