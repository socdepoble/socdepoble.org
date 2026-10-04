/**
 * Gestoria de Poble · les rutes de l'app (pur: sense React ni xarxa).
 *
 * Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
 * Gestoria i Wiki»). La Gestoria ja no viu a la Wiki, però la porta
 * d'aprovació dels tractors sí (Tractors i Sentinelles no es toquen). La
 * closca i el Full trimestral la demanen amb una consulta relativa,
 * CONSULTA_TRACTORS de gestoria/ContenidorGestoria.jsx, que és font signada
 * dels tractors i no es toca. Dins de l'app, eixa consulta cauria a
 * /app/gestoria/…?item=tractors_aprovacio i no obriria res: l'app la porta a
 * la Wiki, sempre a la mateixa ruta fixa. Cap altra consulta es desvia (la de
 * l'Índex, ?seccio=, es queda on és), i res de la consulta passa a la ruta
 * de destí. gestoria/privacitat.test.js confronta estes constants amb
 * CONSULTA_TRACTORS.
 */

/** L'entrada del manifest que munta Aprendre; la resta, la closca. */
export const ENTRADA_APRENDRE = 'aprendre';

/** L'ítem de la Wiki on s'aproven els tractors (WikiDePobleSection, modulsLocalsActius). */
export const ITEM_PORTA_TRACTORS = 'tractors_aprovacio';

/** On viu la porta d'aprovació: la carpeta i l'ítem de la Wiki, en desenvolupament. */
export const RUTA_PORTA_TRACTORS = '/wikidepoble?categoria=tractors_cat&item=tractors_aprovacio';

/**
 * Si la consulta de l'app demana la porta dels tractors, la ruta fixa de la
 * Wiki on viu; si no, null.
 * @param {string} search la consulta, amb «?» o sense
 * @returns {string|null}
 */
export function desviamentDeLaConsulta(search) {
  if (typeof search !== 'string' || !search) return null;
  return new URLSearchParams(search).get('item') === ITEM_PORTA_TRACTORS ? RUTA_PORTA_TRACTORS : null;
}
