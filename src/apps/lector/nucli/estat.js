/**
 * Lector de notícies · l'estat de la persona (nucli pur).
 *
 *   { esquema, llegits: [id], despres: [resum], noSeguides: [fontId] }
 *   llegits     els ids llegits, el més nou al final; passat el límit, els
 *               més vells cauen (una notícia vella ja no és al feed)
 *   despres     «Per a després»: el RESUM sencer (model.js), el més nou
 *               davant. Es guarda perquè la notícia es puga llegir encara
 *               que la font ja no la servisca
 *   noSeguides  les fonts que la persona ha deixat de seguir: una font nova
 *               del poble apareix sola, sense que ningú la trie
 * Totes les operacions són pures i tornen el MATEIX objecte si no canvia res
 * (useLector no desa res aleshores). normalitzaEstat és la llista blanca del
 * magatzem: res més arriba al disc.
 */
import { esIdLector } from './ids.js';
import { esIdLliure, normalitzaResum } from './model.js';

export const ESQUEMA = 1;
export const LIMITS_ESTAT = Object.freeze({ llegits: 2000, despres: 500, noSeguides: 200 });

export function estatInicial() {
  return { esquema: ESQUEMA, llegits: [], despres: [], noSeguides: [] };
}

const unics = (valors, valid) => [...new Set((Array.isArray(valors) ? valors : []).filter(valid))];

/** L'estat net, sigui quin siga el que arriba (un registre vell o corrupte inclòs). */
export function normalitzaEstat(cru) {
  const font = cru !== null && typeof cru === 'object' ? cru : {};
  const vistos = new Set();
  const despres = (Array.isArray(font.despres) ? font.despres : [])
    .map(normalitzaResum)
    .filter((resum) => resum && !vistos.has(resum.id) && vistos.add(resum.id))
    .slice(0, LIMITS_ESTAT.despres)
    .map((resum) => ({ ...resum }));
  return {
    esquema: ESQUEMA,
    llegits: unics(font.llegits, esIdLector).slice(-LIMITS_ESTAT.llegits),
    despres,
    noSeguides: unics(font.noSeguides, esIdLliure).slice(0, LIMITS_ESTAT.noSeguides)
  };
}

export const esLlegit = (estat, id) => estat.llegits.includes(id);
export const esDesat = (estat, id) => estat.despres.some((resum) => resum.id === id);
export const seguix = (estat, fontId) => !estat.noSeguides.includes(fontId);

/** Marca llegits uns ids (un o una llista). */
export function marcaLlegits(estat, ids) {
  const nous = unics([].concat(ids), esIdLector).filter((id) => !estat.llegits.includes(id));
  if (nous.length === 0) return estat;
  return { ...estat, llegits: [...estat.llegits, ...nous].slice(-LIMITS_ESTAT.llegits) };
}

export const marcaLlegit = (estat, id) => marcaLlegits(estat, [id]);

export function marcaNoLlegit(estat, id) {
  if (!estat.llegits.includes(id)) return estat;
  return { ...estat, llegits: estat.llegits.filter((llegit) => llegit !== id) };
}

/** Desa o lleva de «Per a després». `resum`: el de la notícia (es normalitza). */
export function commutaDespres(estat, resum) {
  const net = normalitzaResum(resum);
  if (!net) return estat;
  if (esDesat(estat, net.id)) return { ...estat, despres: estat.despres.filter((desat) => desat.id !== net.id) };
  return { ...estat, despres: [{ ...net }, ...estat.despres].slice(0, LIMITS_ESTAT.despres) };
}

/** Seguix o deixa de seguir una font. */
export function commutaSeguiment(estat, fontId) {
  if (!esIdLliure(fontId)) return estat;
  if (estat.noSeguides.includes(fontId)) return { ...estat, noSeguides: estat.noSeguides.filter((id) => id !== fontId) };
  if (estat.noSeguides.length >= LIMITS_ESTAT.noSeguides) return estat;
  return { ...estat, noSeguides: [...estat.noSeguides, fontId] };
}
