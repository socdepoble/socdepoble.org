import { estatPort } from './backendPortEstat.js';
import * as protocolPublicHeretat from './supabase/protocolPublic.js';

/* R32.19 · Consultes síncrones del protocol públic: una implementació que
   anuncia la capacitat substituïx totes les formes. Abans de l'arrancada i en
   backends antics queda la compatibilitat pura, sense sessió ni xarxa. Cap
   resultat falsy/null de l'adaptador cau cap al proveïdor heretat. */
const consultaProtocolPublic = (nom) => (...args) => {
  const metode = estatPort.currentImpl?.[nom] ?? protocolPublicHeretat[nom];
  const resultat = metode(...args);
  if (resultat && typeof resultat.then === 'function') {
    // Una implementació invàlida pot haver creat una promesa rebutjada:
    // s'observa per no deixar un unhandledRejection; la crida falla igual.
    Promise.resolve(resultat).catch(() => {});
    throw new TypeError(`[backendPort] ${nom} ha de ser síncron`);
  }
  return resultat;
};
export const prefixMitjansPublics = consultaProtocolPublic('prefixMitjansPublics');
export const classificaCamiMitja = consultaProtocolPublic('classificaCamiMitja');
export const esReferenciaMitjaPrivada = consultaProtocolPublic('esReferenciaMitjaPrivada');
export const normalitzaVerificacioRecuperacio = consultaProtocolPublic('normalitzaVerificacioRecuperacio');
export const urlAutoritzacioGoogle = consultaProtocolPublic('urlAutoritzacioGoogle');
/* Amb un backend muntat el transport només pot ser seu: un canvi de backend
   no autoritza cap bescanvi contra el proveïdor anterior. Sense implementació,
   es conserva l'entrada inicial heretada de l'adaptador de paquet. */
export const bescanviaCodiOAuth = (...args) => {
  if (estatPort.currentImpl) {
    const metode = estatPort.currentImpl.bescanviaCodiOAuth;
    if (typeof metode !== 'function') throw new Error('[backendPort] El mètode "bescanviaCodiOAuth" no està implementat al backend actual.');
    return metode(...args);
  }
  return protocolPublicHeretat.bescanviaCodiOAuth(...args);
};
