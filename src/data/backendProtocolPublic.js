import { estatPort } from './backendPortEstat.js';
import {
  prefixMitjansPublics as prefixHeretat,
  classificaCamiMitja as classificaHeretat,
  esReferenciaMitjaPrivada as privadaHeretada,
  normalitzaVerificacioRecuperacio as recuperacioHeretada,
  urlAutoritzacioGoogle as autoritzacioHeretada,
  bescanviaCodiOAuth as bescanviHeretat
} from './supabase/protocolPublic.js';

/* R32.19 · Consultes síncrones del protocol públic: una implementació que
   anuncia la capacitat substituïx totes les formes. Abans de l'arrancada i en
   backends antics queda la compatibilitat pura, sense sessió ni xarxa. Cap
   resultat falsy/null de l'adaptador cau cap al proveïdor heretat. */
const consultaProtocolPublic = (nom, heretat) => (...args) => {
  const metode = estatPort.currentImpl?.[nom] ?? heretat;
  const resultat = metode(...args);
  if (resultat && typeof resultat.then === 'function') {
    // Una implementació invàlida pot haver creat una promesa rebutjada:
    // s'observa per no deixar un unhandledRejection; la crida falla igual.
    Promise.resolve(resultat).catch(() => {});
    throw new TypeError(`[backendPort] ${nom} ha de ser síncron`);
  }
  return resultat;
};
// La creació del wrapper no consulta l'estat ni produïx cap efecte. Els noms
// explícits deixen que el build conserve només les consultes que usa cada tros.
export const prefixMitjansPublics = /* @__PURE__ */ consultaProtocolPublic('prefixMitjansPublics', prefixHeretat);
export const classificaCamiMitja = /* @__PURE__ */ consultaProtocolPublic('classificaCamiMitja', classificaHeretat);
export const esReferenciaMitjaPrivada = /* @__PURE__ */ consultaProtocolPublic('esReferenciaMitjaPrivada', privadaHeretada);
export const normalitzaVerificacioRecuperacio = /* @__PURE__ */ consultaProtocolPublic('normalitzaVerificacioRecuperacio', recuperacioHeretada);
export const urlAutoritzacioGoogle = /* @__PURE__ */ consultaProtocolPublic('urlAutoritzacioGoogle', autoritzacioHeretada);
/* Amb un backend muntat el transport només pot ser seu: un canvi de backend
   no autoritza cap bescanvi contra el proveïdor anterior. Sense implementació,
   es conserva l'entrada inicial heretada de l'adaptador de paquet. */
export const bescanviaCodiOAuth = (...args) => {
  if (estatPort.currentImpl) {
    const metode = estatPort.currentImpl.bescanviaCodiOAuth;
    if (typeof metode !== 'function') throw new Error('[backendPort] El mètode "bescanviaCodiOAuth" no està implementat al backend actual.');
    return metode(...args);
  }
  return bescanviHeretat(...args);
};
