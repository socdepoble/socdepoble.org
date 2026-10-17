/**
 * balancGovern.js — el Balanç de sessió del Govern del Mestre, pur.
 *
 * Pla 261016_1530, Onada 0.5, mòdul 2: «Resum executiu que compara el que el
 * Mestre va demanar a l'inici del torn contra el que les IAs han lliurat. El
 * que no s'ha pogut acabar es mou automàticament a la següent tanda, sense
 * esborrar-se mai ni quedar en l'oblit.» Relleu de Codex (pla 261016_1639,
 * fila I10): «Trasllat idempotent de tots els pendents entre sessions [...]
 * comparar conjunts d'IDs.»
 *
 * Tot es compta de la mateixa matriu (vistaMatriu, matriuGovern.js), sense
 * inventar res:
 *  · demanat: tots els ids de la matriu;
 *  · fet: els que es pinten [FET I SEGELLAT] (mai els d'una matriu obsoleta);
 *  · traslladat: la resta, amb el seu id.
 * La Consola no mou res: el trasllat el fa MarIA al pla nou (lliçó 261009 de
 * wiki-documentacio-i-reflex). Ací només es compara el que Codex diu que ha
 * traslladat (trasllat.json) amb el que la matriu deixa obert.
 */
import { instantISO } from './matriuGovern.js';

/**
 * { demanat, fet, traslladat, oberts, perRevisar }, cada un una llista
 * d'ids en l'ordre de la matriu. `oberts` són els que la matriu mateixa no
 * dona per fets (els que un trasllat ha de portar); `perRevisar`, els que
 * deia fets però que la Consola no pot creure perquè la matriu és obsoleta:
 * també es traslladen, per a tornar-los a comprovar. Null sense matriu.
 */
export function balancDe(vista) {
  if (!vista) return null;
  const ids = (prova) => vista.files.filter(prova).map((f) => f.id);
  return {
    demanat: ids(() => true),
    fet: ids((f) => f.estatVist === 'fet'),
    traslladat: ids((f) => f.estatVist !== 'fet'),
    oberts: ids((f) => f.estat !== 'fet'),
    perRevisar: ids((f) => f.estat === 'fet' && f.estatVist !== 'fet')
  };
}

/**
 * Compara el trasllat (normalitzaTrasllat, governContent.js) amb el que la
 * matriu deixa obert, com a conjunts d'ids: { igual, falten, sobren,
 * duplicats, mateixMoment }. `falten`: obertes a la matriu que el trasllat
 * no porta (es quedarien en l'oblit); `sobren`: ids del trasllat que la
 * matriu no té oberts. `mateixMoment`: si els dos fitxers diuen la mateixa
 * data (null si algun no en diu). Null sense balanç o sense trasllat.
 */
export function comparaTrasllat(balanc, trasllat, vista = null) {
  if (!balanc || !trasllat) return null;
  const esperat = new Set(balanc.oberts);
  const rebut = new Set(trasllat.ids);
  const falten = balanc.oberts.filter((id) => !rebut.has(id));
  const sobren = trasllat.ids.filter((id) => !esperat.has(id));
  const a = instantISO(vista?.at);
  const b = instantISO(trasllat.at);
  return {
    igual: falten.length === 0 && sobren.length === 0 && trasllat.duplicats.length === 0,
    falten,
    sobren,
    duplicats: trasllat.duplicats,
    mateixMoment: a !== null && b !== null ? a === b : null
  };
}
