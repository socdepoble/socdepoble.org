/**
 * basesComu.js — Fase E (261020, tasca 2; pla 261020_2045 «El Comú») · les
 * peces comunes del nucli pur d'«El Comú»: els límits, l'error estable, qui
 * governa una llista i com es toca un element sense mutar res.
 *
 * Una llista d'«El Comú» (la forma neutra que el port omplirà a la tasca 4):
 *   { id, mode, titol, subtitol?, propietariId, revisio,
 *     configMode: {…, gestors?: [usuariId]},
 *     elementsComu: [{ id, nom, emoji?, ordre?, capaMode: {…} }],
 *     recentsComu?: [{ nom, especificacio, at }] }
 * El context de cada acció l'injecta qui crida (el hook): { actor: { id, nom },
 * ara: ISO 8601, nouId: () => string }. El nucli no llig cap rellotge ni cap
 * atzar: la mateixa entrada torna sempre la mateixa eixida.
 *
 * JS pur: sense DOM, sense React, sense xarxa ni emmagatzematge.
 */

export const LIMITS_COMU = Object.freeze({
  elements: 200,
  nom: 80,
  especificacio: 80,
  recents: 12,
  text: 500
});

/** Els codis estables que la vista tradueix (textosComu.js · errors). */
export const CODIS_COMU = Object.freeze([
  'mode-desconegut', 'accio-desconeguda', 'element-absent', 'no-autoritzat', 'ple',
  'ja-reclamat', 'ja-en-tens', 'nom-buit', 'massa-elements', 'valor-invalid', 'ordre-signatures',
  'llista-invalida'
]);

/** Un error del nucli: { ok: false, error: { codi } }. Mai llança cap a la vista. */
export const errorComu = (codi) => Object.freeze({ ok: false, error: Object.freeze({ codi }) });

/** El text net d'una entrada: sense espais als extrems ni repetits, tallat al màxim. */
export function textNet(valor, maxim = LIMITS_COMU.nom) {
  return String(valor ?? '').replace(/\s+/g, ' ').trim().slice(0, maxim);
}

/** La clau de comparació d'un nom: minúscules, sense accents ni espais repetits. */
export function clauDeNom(nom) {
  return textNet(nom, LIMITS_COMU.nom).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('ca');
}

/** Un enter dins d'un interval, o null. */
export function enterEntre(valor, minim, maxim) {
  const n = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor;
  return Number.isSafeInteger(n) && n >= minim && n <= maxim ? n : null;
}

/** Qui governa la llista: la persona que la va crear i els gestors que ha triat. */
export function esGestor(llista, actor) {
  const id = actor?.id;
  if (!id) return false;
  if (llista?.propietariId === id) return true;
  const gestors = llista?.configMode?.gestors;
  return Array.isArray(gestors) && gestors.includes(id);
}

/** L'element amb este id, o null. */
export const elementDe = (llista, id) => (llista?.elementsComu ?? []).find((e) => e.id === id) ?? null;

/** La llista amb l'element `id` substituït pel que torna `canvi(element)`. */
export function ambElement(llista, id, canvi) {
  return { ...llista, elementsComu: llista.elementsComu.map((e) => (e.id === id ? canvi(e) : e)) };
}

/** La llista sense l'element `id`. */
export const senseElement = (llista, id) => ({ ...llista, elementsComu: llista.elementsComu.filter((e) => e.id !== id) });

/** La llista amb un element nou al final (o l'error si ja n'hi ha massa). */
export function ambElementNou(llista, element) {
  if (llista.elementsComu.length >= LIMITS_COMU.elements) return errorComu('massa-elements');
  const ordre = llista.elementsComu.reduce((max, e) => Math.max(max, Number.isFinite(e.ordre) ? e.ordre : 0), 0) + 1;
  return { ok: true, llista: { ...llista, elementsComu: [...llista.elementsComu, { ...element, ordre }] } };
}

/** L'actor reduït al que es guarda en una llista: id i nom, res més. Sense nom, buit (la vista diu «Algú»):
    l'id intern no ix mai com a nom a la taula, al CSV ni al WhatsApp. */
export const signaturaDe = (actor, ara) => ({ usuariId: actor.id, nom: textNet(actor.nom), at: ara });

/** Un element nou amb el bloc nuclear comú; la capa la posa el mode. */
export function elementBase(entrada, ctx, capaMode) {
  const nom = textNet(entrada?.nom);
  if (!nom) return errorComu('nom-buit');
  const emoji = textNet(entrada?.emoji, 16);
  return { ok: true, element: { id: ctx.nouId(), nom, ...(emoji ? { emoji } : {}), capaMode } };
}

/** «Pere, trompa» → ['Pere', 'trompa']: les parts d'una entrada ràpida separades per comes. */
export const partsPerComes = (text) => String(text ?? '').split(',').map((p) => textNet(p)).filter(Boolean);

/** El tant per cent enter d'una part sobre un total (0 si no hi ha total). */
export const percent = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);
