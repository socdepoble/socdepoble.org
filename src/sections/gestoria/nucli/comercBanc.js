/**
 * comercBanc.js — fulla pura compartida pels dos lectors de CSV bancari.
 * No importa cap lector: conserva el mateix reconeixement de comerç i
 * permet a movimentsBanc reexportar-lo sense un cicle d'avaluació.
 */
/* La primera línia del concepte d'una compra (o devolució) amb targeta: «OP.TARJ.COMPRA COMERCIO». */
const TARGETA = /TARJ/i;
/* El número de targeta emmascarat que obri la segona línia: sis xifres, asteriscs i les quatre últimes. */
const NUMERO_TARGETA = /^\s*\d{4,6}[*xX]+\d{4}\s*/;

/**
 * El comerç d'una compra amb targeta: la segona línia del concepte, sense el
 * número de targeta. null si no és una compra amb targeta.
 * @param {string} concepte
 * @returns {string|null}
 */
export function comercDelConcepte(concepte) {
  const linies = String(concepte ?? '').split(/\r\n|\n|\r/);
  if (linies.length < 2 || !TARGETA.test(linies[0])) return null;
  const resta = linies.slice(1).join(' ');
  if (!NUMERO_TARGETA.test(resta)) return null;
  const comerc = resta.replace(NUMERO_TARGETA, '').replace(/\s+/g, ' ').trim();
  return comerc || null;
}

