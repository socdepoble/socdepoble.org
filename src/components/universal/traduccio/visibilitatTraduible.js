/**
 * visibilitatTraduible.js — Quan una pàgina amb contingut de la gent es pot
 * traduir (Gauntlet 261030, Fase 3, TC3.2; troballa P1 dels verificadors
 * `traduir-contingut-de-membres`).
 *
 * El paràgraf aprovat pel Mestre (decisions 261030 §1) diu que Traduir envia
 * «el text públic» de la pàgina; /traduccions, «mai els teus missatges ni les
 * teues notes». Una publicació del veïnat (section_submissions: Mur, Mercat,
 * agenda i Multimèdia) només la llegixen els membres del poble (RLS «public
 * read section_submissions», 2609080000:764-768, private.is_town_member), i
 * el generador del paquet Open Data (data/) tampoc no la tracta com a
 * pública. Per això:
 *  · un element és públic només si no porta cap marca de persona propietària
 *    (owner_user_id / ownerUserId, que elementDeFilaPublicada posa SEMPRE a
 *    una fila de section_submissions, encara que siga null; author_user_id) i
 *    la seua `visibility`, si en porta, és 'public'. El contingut
 *    d'app_content (lectura pública, 2609200300) i les pàgines del sistema no
 *    porten cap marca;
 *  · una superfície es traduïx només si TOTS els seus elements són públics:
 *    un de sol que no ho és, o que no se sap (no és un objecte), l'apaga
 *    (fallada tancada). El botó no canvia (Llei del Píxel): PageFrame avisa
 *    i no ix cap text (traduccio={false}, el mecanisme de les apps i del
 *    multimèdia local).
 * Pur: sense React ni backend.
 */

/* Les claus que diuen «açò ho ha publicat una persona» (fila del veïnat). */
const MARQUES_DE_PERSONA = Object.freeze(['ownerUserId', 'owner_user_id', 'author_user_id']);

/* Les seccions on un element PODRIA ser públic. Notes, apps i qualsevol
   secció desconeguda, mai (fallada tancada). */
export const SECCIONS_AMB_CONTINGUT_PUBLIC = Object.freeze(['mur', 'mercat', 'events', 'pobles', 'multimedia']);

/** Un element que es pot enviar al traductor: objecte, sense marca de
 *  persona i amb `visibility` absent o 'public'. */
export function esElementPublic(element) {
  if (!element || typeof element !== 'object' || Array.isArray(element)) return false;
  if (MARQUES_DE_PERSONA.some((clau) => Object.hasOwn(element, clau))) return false;
  if (Object.hasOwn(element, 'visibility') && element.visibility !== 'public') return false;
  return true;
}

/** Totes les llistes donades (arrays d'elements) són d'elements públics.
 *  Una llista que no és un array no se sap: fals. Sense cap element, cert. */
export function totsPublics(...llistes) {
  return llistes.every((llista) => Array.isArray(llista) && llista.every(esElementPublic));
}

/** L'element `element` de la secció `seccio` es pot traduir. */
export function elementTraduible(seccio, element) {
  return SECCIONS_AMB_CONTINGUT_PUBLIC.includes(seccio) && esElementPublic(element);
}
