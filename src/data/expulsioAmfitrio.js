/**
 * src/data/expulsioAmfitrio.js — L'expulsió de l'amfitrió passa per l'eixida
 * de veres (QA-A01a, Gauntlet 261029_1858).
 *
 * host.js (expulsaSessio: l'API de window.SocDePoble i el pont d'iframe) no
 * importa SessionContext: el cicle passaria per PedraSecaEmbed i les proves de
 * l'amfitrió no carreguen la interfície. SessionContext hi registra l'eixida de
 * veres, la MATEIXA de «Tancar sessió» (intent final, logout i, només si ha
 * anat bé, DESPRES_DE_TANCAR: Notes, carpetes locals i, amb E2EE, el xat), i
 * host.js la demana. Una sola font de veritat: la llista d'accions només viu a
 * SessionContext.
 *
 * Garanties:
 *   · Sense cap eixida registrada (la interfície no s'ha carregat), torna null
 *     i host.js fa el camí curt de sempre (logout sense res més).
 *   · Una eixida que llança en cridar-la també torna null: el camí curt tanca
 *     la sessió igualment (mai una expulsió que es queda a mitges).
 *   · La promesa que torna no rebutja mai (com el `catch` buit de sempre).
 *   · Sense dependències ni accés a globals: el pot importar qualsevol.
 */
const eixides = [];

/**
 * Registra una eixida de veres. L'última registrada mana (el proveïdor de
 * sessió muntat més recent; per davall, la de reserva del mòdul). Torna la
 * funció que la dona de baixa (idempotent).
 */
export function registraEixidaDeVeres(eixida) {
  if (typeof eixida !== 'function') return () => {};
  eixides.push(eixida);
  let donadaDeBaixa = false;
  return () => {
    if (donadaDeBaixa) return;
    donadaDeBaixa = true;
    const index = eixides.lastIndexOf(eixida);
    if (index >= 0) eixides.splice(index, 1);
  };
}

/**
 * L'amfitrió expulsa la sessió: crida l'eixida de veres vigent i en torna la
 * promesa (true si ha acabat bé, false si el tancament ha fallat), o null si
 * no n'hi ha cap o no s'ha pogut començar.
 */
export function expulsaPerLEixidaDeVeres() {
  const eixida = eixides[eixides.length - 1];
  if (typeof eixida !== 'function') return null;
  let promesa;
  try {
    promesa = eixida();
  } catch {
    return null;
  }
  return Promise.resolve(promesa).then(() => true, () => false);
}
