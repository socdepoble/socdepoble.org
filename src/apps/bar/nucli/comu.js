/**
 * El Bar · nucli/comu.js — les peces menudes que comparteixen tots els mòduls
 * purs del TPV (disseny del Bar §A.3 i §A.5). Sense React ni DOM.
 *
 *   · Diners sempre en CÈNTIMS enters (Number.isSafeInteger): mai coma flotant.
 *   · Moments en ISO 8601 UTC ('2026-10-02T08:15:00.000Z'); la vista els
 *     mostra en hora local.
 *   · Ids opacs ('c-lz3k9q-4f2a') i slugs ('cafe-tallat', 't5').
 *   · Un error del nucli porta un `codi` estable perquè la UI decidisca què diu.
 */

export const esCents = (valor) => Number.isSafeInteger(valor);

/** Slug: minúscules, xifres i guions solts ('cafe-tallat', 't5'). */
export function esSlug(valor) {
  return typeof valor === 'string' && valor.length <= 64 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(valor);
}

/** Id opac: minúscules, xifres, '-' i '_', com el que fa nouId. */
export function esId(valor) {
  return typeof valor === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(valor);
}

/** Moment ISO 8601 amb zona ('…Z' o '…+02:00') que Date entén. */
export function esMoment(valor) {
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(valor) && Number.isFinite(Date.parse(valor));
}

/** Un error amb codi: la UI tria el text pel codi, no pel missatge. */
export function errorBar(codi, missatge) {
  return Object.assign(new Error(missatge), { codi });
}

/**
 * Divisió entera arrodonida a la meitat cap amunt (lluny de zero en negatiu):
 * mitjaAmunt(10000, 110) = 91 (90,909…), mitjaAmunt(5, 2) = 3, mitjaAmunt(-5, 2) = -3.
 * Només enters: el resultat és exacte, sense coma flotant pel mig.
 */
export function mitjaAmunt(numerador, denominador) {
  if (!Number.isSafeInteger(numerador) || !Number.isSafeInteger(denominador) || denominador <= 0) {
    throw new RangeError('mitjaAmunt només treballa amb enters i un denominador positiu.');
  }
  const signe = numerador < 0 ? -1 : 1;
  const absolut = Math.abs(numerador);
  const resultat = Math.floor((absolut * 2 + denominador) / (denominador * 2));
  return resultat === 0 ? 0 : signe * resultat;
}

/** Divisió entera arrodonida cap amunt (per a enters no negatius). */
export function sostre(numerador, denominador) {
  return Math.floor((numerador + denominador - 1) / denominador);
}

/** Text net d'una persona (nota, motiu, àlies): retallat i amb un màxim; null si és buit. */
export function textNet(valor, maxim) {
  if (typeof valor !== 'string') return null;
  const net = valor.replace(/\s+/g, ' ').trim();
  if (!net) return null;
  return net.slice(0, maxim);
}

/** Àlies de qui atén («Cambrer 1»): curt, mai un nom complet obligat. */
const MAX_ALIES = 24;
export function aliesNet(valor, perDefecte = 'Caixa') {
  return textNet(valor, MAX_ALIES) || perDefecte;
}

/** Congela en profunditat (objectes i llistes). Torna el mateix valor. */
export function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.freeze(valor);
    for (const fill of Object.values(valor)) congela(fill);
  }
  return valor;
}

/** Suma de cèntims d'una llista amb una funció d'import. */
export function suma(llista, importDe) {
  let total = 0;
  for (const element of llista) total += importDe(element);
  return total;
}
