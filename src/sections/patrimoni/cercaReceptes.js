import { RECEPTES_QUE_DINEM, liniesIngredients } from '../../data/patrimoni/queDinem.js';

/* Onada R14 · La cerca i les rutes del receptari «Què dinem?» (les compartixen /page/receptes i /receptes/:slug).
   La cerca no distingix majúscules, accents ni la ela geminada escrita amb punt volat o amb punt baix
   («col·loqueu», «col.loqueu»): el llibre usa totes dues. Busca al títol i a les línies d'ingredients. */
export const normalitzaCerca = (text) => String(text ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/l[·.]l/g, 'll').trim();

const TEXT_DE_CERCA = new Map(RECEPTES_QUE_DINEM.map((r) => [r.slug, normalitzaCerca([r.titol, ...liniesIngredients(r)].join(' \n '))]));

/** Les receptes de l'apartat (o de tots, amb '') que contenen la cerca, en l'ordre del llibre. */
export function filtraReceptes(apartat, cerca) {
  const consulta = normalitzaCerca(cerca);
  return RECEPTES_QUE_DINEM.filter((r) => (!apartat || r.apartat === apartat) && (!consulta || TEXT_DE_CERCA.get(r.slug).includes(consulta)));
}

/** La pàgina pròpia d'una recepta (ItemDetailSection la servix pel comodí :sectionId/:itemId). */
export const rutaDeRecepta = (recepta) => `/receptes/${recepta.slug}`;

/** On viu la llista de totes les receptes. */
export const RUTA_DEL_RECEPTARI = '/page/receptes';

/* El nom curt de cada apartat del llibre, en la llengua de la interfície (`tr` és traductorPatrimoni(t)). Crides
   literals: la prova de les claus les ha de vore als 5 diccionaris. El títol sencer de l'apartat, tal com l'imprimix
   l'índex del llibre, és a OBRA_QUE_DINEM.apartats. */
export function etiquetaDApartat(tr, id) {
  switch (id) {
    case 'entrades': return tr('patrimoni.receptes.apartat.entrades', 'Entrades');
    case 'plats': return tr('patrimoni.receptes.apartat.plats', 'Plats');
    case 'postres': return tr('patrimoni.receptes.apartat.postres', 'Postres i pastes');
    case 'licors': return tr('patrimoni.receptes.apartat.licors', 'Licors');
    default: return '';
  }
}
