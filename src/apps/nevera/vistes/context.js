/**
 * La Nevera de Casa · el context de la vista.
 *
 * Les columnes de la taula de rutes són constants del mòdul (ClosaAplicacio no
 * les desmunta en navegar) i reben només { params }: les dades i les accions
 * els arriben per este context, que posa AppNevera.
 *
 *   estat, mode, persistent, error, errorEn, llegit, accions   (useNevera)
 *   ruta(...trams)        el camí absolut dins de l'app (useApp().ruta)
 *   llistaDe(params)      la llista del camí (params.llista) o, sense, la per
 *                         defecte; null si el camí nomena una llista que no existix
 *   llistaVigent(params)  mai null: la del camí o, si el camí no en porta cap o
 *                         la que porta ja no existix, la per defecte (la que
 *                         AppNevera hi posarà amb replace)
 *   obriNovaLlista()      el diàleg «Llista nova»
 *   demanaConfirmacio({ titol, descripcio, etiquetaConfirma, accio })
 *   descarrega({ nom, tipus, dades })
 * La llista per defecte és l'última que esta pestanya ha tingut al camí, si
 * encara existix; si no, la darrera desada (estat.darreraLlista).
 */
import { createContext, useContext } from 'react';
import { llistaPerId } from '../nucli/index.js';

export const ContextNevera = createContext(null);

export function useVistaNevera() {
  const valor = useContext(ContextNevera);
  if (!valor) throw new Error('Les columnes de La Nevera de Casa van dins d’AppNevera.');
  return valor;
}

/** L'id de la llista del camí, o null si el camí no en porta cap. */
export const llistaDelCami = (params) => (typeof params?.llista === 'string' ? params.llista : null);

/** La llista que mana: la del camí si n'hi ha (null si no existix) o la per defecte. */
export function llistaDeLaRuta(estat, params, perDefecte) {
  return llistaPerId(estat, llistaDelCami(params) ?? perDefecte);
}

/** «3 articles», «1 article», «Res per comprar». */
export const textArticles = (n) => (n === 0 ? 'Res per comprar' : `${n} ${n === 1 ? 'article' : 'articles'}`);
