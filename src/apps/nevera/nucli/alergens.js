/**
 * Declaracions de composició del rebost i projecció pura de receptes.
 * Taxonomia única: Reglament (UE) 1169/2011, Annex II. Les absències ací
 * descriuen només la identitat de l'ingredient simple, sense mescles ni
 * additius: no una marca, lot, subministrament o preparació real.
 * Les fonts legals i les limitacions de consulta consten al dossier R32.51.
 */
import { ALERGENS, agregaMatrius, matriuAlergens, matriuDeProducte } from '../../../utils/alergens.js';

const PRINCIPALS = Object.freeze({
  ou: ['ous'], farina: ['gluten'], pa: ['gluten'], tonyina: ['peix'], bacalla: ['peix']
});
/* Una denominació genèrica d'elaborat no descriu els altres ingredients. */
const ELABORATS = new Set(['farina', 'pa', 'llevat', 'tonyina', 'bacalla', 'botifarra', 'cansalada']);
const SIMPLES = new Set(['tomaca', 'creilla', 'ceba', 'all', 'pebrot', 'alberginia', 'carabasso', 'bajoca', 'nap', 'penca', 'bleda', 'safanoria', 'arros', 'cigro', 'fesol', 'llentilla', 'ou', 'oli', 'sal', 'costella', 'pebre-roig', 'safra', 'pinyo']);
const AVIS = 'Composició teòrica: cal comprovar etiqueta, proveïdor i preparació; no acredita absència de contaminació encreuada ni aptitud per a una persona al·lèrgica.';
const NOTES = Object.freeze({
  ou: 'Ou de gallina: ous (Annex II.3).',
  farina: 'Base de blat de la llavor: gluten (Annex II.1); altres components i traces de la farina comercial pendents d’etiqueta.',
  pa: 'Base de pa de blat: gluten (Annex II.1); formulació, forn i traces pendents de proveïdor, sense traces genèriques presumides.',
  tonyina: 'Tonyina en conserva: peix (Annex II.4); líquid de cobertura i additius pendents d’etiqueta.',
  bacalla: 'Bacallà salat o dessalat: peix (Annex II.4); altres components pendents d’etiqueta.',
  botifarra: 'Botifarra de formulació desconeguda: cal la fitxa del fabricant; no es pressuposen llet, soja, gluten, sulfits ni traces.',
  cansalada: 'Cansalada de formulació desconeguda: cal confirmar si és carn sense preparar o un elaborat amb additius.',
  llevat: 'Llevat comercial: excipients, suport i traces pendents de la fitxa del fabricant.',
  llentilla: 'Llentilla: fora dels grups de l’Annex II; gluten desconegut per possible presència accidental de cereals. Guia AESAN 2024 d’etiquetatge de cereals amb gluten, apartat 6 (llentilles): no acredita una partida concreta.',
  cigro: 'Cigró simple: fora dels grups de l’Annex II; no es deduïxen traces pel fet de ser llegum.',
  fesol: 'Fesol simple: fora dels grups de l’Annex II; no es deduïxen traces pel fet de ser llegum.',
  pinyo: 'Pinyó: no figura en la llista de huit fruits de closca de l’Annex II.8; això no exclou al·lèrgia al pinyó.'
});

/** Camps retrocompatibles de producte, per a la identitat d'un ingredient. */
export function declaracioIngredient(id, nom) {
  const alergens = Object.hasOwn(PRINCIPALS, id) ? PRINCIPALS[id] : [];
  const absents = ELABORATS.has(id) || !SIMPLES.has(id) ? [] : ALERGENS.filter((alergen) => !alergens.includes(alergen) && !(id === 'llentilla' && alergen === 'gluten'));
  return {
    fontAlergens: `Reglament (UE) 1169/2011, Annex II; composició de ${nom}. ${Object.hasOwn(NOTES, id) ? NOTES[id] : SIMPLES.has(id) ? 'Ingredient simple sense mescles ni additius, fora dels grups de l’Annex II.' : 'Identitat o formulació pendent; no es deduïx cap declaració.'}`,
    abastAlergens: 'composició teòrica de l’ingredient simple; sense certificació del lot ni de la preparació',
    avisAlergens: `${AVIS}${id === 'pinyo' || ['cigro', 'fesol', 'llentilla'].includes(id) ? ' Pot causar al·lèrgia fora dels 14 grups regulats.' : ''}`,
    alergens: Object.freeze([...alergens]),
    tracesAlergens: Object.freeze([]),
    alergensAbsents: Object.freeze(absents)
  };
}

/** No rep dades d'etiqueta implícites: un ingredient absent és desconegut. */
export function matriuDeIngredient(ingredient) {
  return matriuDeProducte(ingredient);
}

/* T és la convenció del projecte per a un ingredient possible d'una recepta;
   la font ho explica. No és una afirmació de contaminació encreuada física. */
function potencial(matriu, motiu) {
  return matriuAlergens(Object.fromEntries(ALERGENS.map((id) => {
    const cell = matriu[id];
    return [id, cell.estat === 'ingredient' ? { estat: 'traca', font: `${motiu}; ingredient potencial de recepta, no traça de fabricació. ${cell.font}` } : cell];
  })));
}

/**
 * Agrega tots els obligatoris, opcionals i alternatives. Cada referència
 * desconeguda aporta una matriu desconeguda. Sense revisió de preparació no
 * es projecta cap absent, ni tan sols per a un plat de vegetals simples.
 */
export function agregaAlergensRecepta(recepta, trobaIngredient) {
  if (!recepta || !Array.isArray(recepta.ingredients) || typeof trobaIngredient !== 'function') return matriuAlergens();
  const matrius = recepta.ingredients.flatMap((entrada) => {
    if (!entrada || typeof entrada.id !== 'string' || typeof entrada.opcional !== 'boolean' || !Array.isArray(entrada.o)) return [matriuAlergens()];
    const esPotencial = entrada.opcional || entrada.o.length > 0;
    const motiu = entrada.opcional ? 'Ingredient opcional' : 'Ingredient alternatiu (alternativa o)';
    return [entrada.id, ...entrada.o].map((id) => {
      const ingredient = typeof id === 'string' ? trobaIngredient(id) : null;
      const matriu = matriuDeIngredient(ingredient);
      return esPotencial ? potencial(matriu, motiu) : matriu;
    });
  });
  return agregaMatrius(matrius);
}
