/**
 * missatgeXifratHonest.js — Semàntica honesta i serena del missatge E2EE que
 * este dispositiu no ha pogut obrir. Font única: conversa.js la reexporta per
 * a Bombolla.jsx, la cita, la barra de resposta i l'anunci en viu, i retall.js
 * la llig per al retall cap al Bloc de Notes.
 *
 * Onada R32 (fusió semàntica sobre bdefec55a) · Tres fonts, una sola veritat:
 *   · R29-E2EE-02 (decisió tancada del Mestre, Onada R30) mana el text VISIBLE:
 *     «Missatge xifrat d’extrem a extrem en un altre dispositiu» només quan a
 *     este aparell li falta la clau (`epoca-desconeguda`, `sense-epoca`,
 *     `epoca-saltada`, `sense-context`, `claus-bloquejades`); la integritat,
 *     una clau nova sense confirmar i qualsevol codi desconegut diuen el text
 *     neutre «No s’ha pogut obrir este missatge xifrat», que sempre és cert.
 *   · La separació causal del kit Gemini R30.2 (R30-C3-E2EE-CAUSA-01) entra com
 *     a classificació interna (causaMissatgeXifratTancat: `clau-absent`,
 *     `integritat`, `no-disponible`). La família `integritat` NO té text propi:
 *     un tercer text visible és un canvi de píxel que el Mestre no ha ordenat.
 *     La família `clau-absent` són els codis que el motor emet de veres
 *     (xifratXatPipeline.js / xifratXatProtocol.js); el codi literal
 *     `clau-absent` del kit no l'emet cap productor i pren el text neutre, i
 *     `clau-absent-del-contacte` és la clau DEL CONTACTE, no la d'este aparell.
 *   · La conciliació de Codex R31: els codis estructurals sense prova
 *     criptogràfica (`etiqueta-invalida`, `longitud-invalida`, `sobre-invalid`)
 *     són `no-disponible`: ni integritat ni «un altre dispositiu».
 * Els textos viuen només als cinc diccionaris de src/config/idiomes/ (L1): ací
 * hi ha la parella [clau, reserva valenciana], mai una còpia de les traduccions.
 * Mai s'hi mostra el codi tècnic.
 */

export const TEXT_XIFRAT_TANCAT = /* @__PURE__ */ Object.freeze(['section.xat.xifratge.tancat', 'Missatge xifrat d’extrem a extrem en un altre dispositiu']);
export const TEXT_XIFRAT_NO_OBERT = /* @__PURE__ */ Object.freeze(['section.xat.xifratge.noObert', 'No s’ha pogut obrir este missatge xifrat']);

/* Les llistes que decidixen són privades i congelades: un Set exportat es pot
   mutar encara que estiga congelat, i la classificació no en depén. Les marques
   @__PURE__ (com a xifratXatCripto.js) deixen que el paquet de producció llance
   el que només usa la classificació interna. */
const SENSE_CLAU_AL_DISPOSITIU = /* @__PURE__ */ Object.freeze(['epoca-desconeguda', 'sense-epoca', 'epoca-saltada', 'sense-context', 'claus-bloquejades']);
const INTEGRITAT = /* @__PURE__ */ Object.freeze([
  'xifrat-manipulat',
  'farciment-invalid',
  'compromis-invalid',
  'contingut-invalid',
  'franqueig-invalid',
  'adjunt-manipulat',
  'adjunt-incoherent'
]);

/** R29-E2EE-02 · Els codis amb què a este aparell li falta la clau (vista de lectura). */
export const CODIS_SENSE_CLAU_AL_DISPOSITIU = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ new Set(SENSE_CLAU_AL_DISPOSITIU));
/** Gemini R30.2 · Els codis d'una fallada d'integritat criptogràfica (classificació interna). */
export const CODIS_INTEGRITAT_E2EE = INTEGRITAT;

export const CAUSA_XIFRAT_TANCAT = /* @__PURE__ */ Object.freeze({
  clauAbsent: 'clau-absent',
  integritat: 'integritat',
  noDisponible: 'no-disponible'
});

/** Cert si el missatge és xifrat i este dispositiu no l'ha pogut obrir. */
export function esXifratTancat(msg) {
  return Boolean(
    msg
    && typeof msg === 'object'
    && msg.seguretat?.xifrat === true
    && msg.seguretat.verificat !== true
  );
}

/** La família causal d'un xifrat tancat (`clau-absent`, `integritat` o `no-disponible`), o `null` si s'obri. */
export function causaMissatgeXifratTancat(msg) {
  if (!esXifratTancat(msg)) return null;
  const codi = msg.seguretat.codi;
  if (SENSE_CLAU_AL_DISPOSITIU.includes(codi)) return CAUSA_XIFRAT_TANCAT.clauAbsent;
  if (INTEGRITAT.includes(codi)) return CAUSA_XIFRAT_TANCAT.integritat;
  return CAUSA_XIFRAT_TANCAT.noDisponible;
}

/** La parella [clau, reserva] del text serè: «un altre dispositiu» només si hi falta la clau.
 *  Només llig la família de clau absent (la mateixa llista que causaMissatgeXifratTancat): el text
 *  visible no depén de la família d'integritat, i el paquet de producció no l'arrossega. */
export function textXifratTancat(msg) {
  return esXifratTancat(msg) && SENSE_CLAU_AL_DISPOSITIU.includes(msg.seguretat.codi) ? TEXT_XIFRAT_TANCAT : TEXT_XIFRAT_NO_OBERT;
}

/** El text serè ja traduït; sense traductor, la reserva valenciana. Buit si el missatge s'obri. */
export function textMissatgeXifratTancat(msg, t = null) {
  if (!esXifratTancat(msg)) return '';
  const [clau, reserva] = textXifratTancat(msg);
  return typeof t === 'function' ? t(clau, reserva) : reserva;
}
