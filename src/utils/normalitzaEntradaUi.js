/**
 * normalitzaEntradaUi.js — Normalització Unicode NFC amb pressupost O(n) de
 * marques combinants (\p{M}) per a formularis JSX de contrasenyes i cerimònies
 * (Onada R32.12 · Lot 03 · Handoff sinàptic de seguretat).
 *
 * Cap entrada d'usuari pot invocar String.prototype.normalize abans de passar
 * per un recompte lineal de marques combinants seguides (<= 64) i d'absència de
 * substituts UTF-16 desaparellats: una cadena hostil amb milers de marques
 * combinants (reordenació canònica de composició/descomposició) es rebutja en
 * O(n) sense cridar mai .normalize().
 */

export const MAX_MARQUES_COMBINANTS_SEGUIDES = 64;

const RE_MARCA_COMBINANT = /\p{M}/u;
const ELA_GEMINADA = /l[\u00b7\u0387\u2027\u2219\u22c5\u2022\u30fb\uff65.]l/g;

/**
 * Cert si `valor` no és una cadena UTF-16 ben formada o supera `maxSeguits`
 * marques combinants (\p{M}) consecutives. Escaneig pur en O(n) sense cridar
 * mai String.prototype.normalize.
 */
export function superaPressupostMarques(valor, maxSeguits = MAX_MARQUES_COMBINANTS_SEGUIDES) {
  if (typeof valor !== 'string') return true;
  let seguits = 0;
  for (const ch of valor) {
    const cp = ch.codePointAt(0);
    if (cp >= 0xd800 && cp <= 0xdfff) return true;
    if (RE_MARCA_COMBINANT.test(ch)) {
      seguits += 1;
      if (seguits > maxSeguits) return true;
    } else {
      seguits = 0;
    }
  }
  return false;
}

/**
 * Retorna la cadena normalitzada en `NFC` si és ben formada, no supera
 * `maxLongitud` unitats UTF-16 i compleix el pressupost de marques combinants;
 * altrament retorna `null` sense invocar `.normalize()`.
 */
export function normalitzaNfcSeguraUi(
  valor,
  { maxLongitud = 1024, maxMarquesSeguides = MAX_MARQUES_COMBINANTS_SEGUIDES } = {}
) {
  if (typeof valor !== 'string' || valor.length > maxLongitud) return null;
  if (superaPressupostMarques(valor, maxMarquesSeguides)) return null;
  return valor.normalize('NFC');
}

/**
 * Plegat tolerant i segur per a comparar paraules de la cerimònia E2EE del Xat:
 * verifica primer el pressupost O(n) de marques combinants (<= 64), normalitza
 * en NFC, unifica la ela geminada (l·l, l.l, ŀ, Ŀ -> ll), treu diacrítics i
 * deixa lletres ASCII en minúscules, en paritat amb indexDeParaula.
 * Retorna `null` si l'entrada viola el pressupost o la longitud màxima.
 */
export function plegaParaulaCerimoniaSegura(
  valor,
  { maxLongitud = 256, maxMarquesSeguides = MAX_MARQUES_COMBINANTS_SEGUIDES } = {}
) {
  const nfc = normalitzaNfcSeguraUi(valor, { maxLongitud, maxMarquesSeguides });
  if (nfc === null) return null;
  return nfc
    .replace(/[ŀĿ]/g, 'l·')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(ELA_GEMINADA, 'll')
    .replace(/[^a-z]/g, '');
}
