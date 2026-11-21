/**
 * indicadorsAdminModel.js — Constants i projeccions pures dels Indicadors d'administració (Onada R32.22 · T2 HMR).
 */
import { LLINDAR_GRUP_PETIT } from './indicadors.js';

export const LIMIT_PERSONES = 500;

export const UNITAT_ALTES = Object.freeze(['alta', 'altes']);
export const UNITAT_PERSONES = Object.freeze(['persona', 'persones']);
export const UNITAT_ENTITATS = Object.freeze(['entitat', 'entitats']);

export const TEXT_SERIE_PROTEGIDA = `No es mostra: amb tan poques persones, restant es podria saber la xifra d’un grup de menys de ${LLINDAR_GRUP_PETIT}.`;
export const TEXT_XIFRES_PROTEGIDES = `Algunes xifres es protegixen: sense això, restant del total es podria saber la d’un grup de menys de ${LLINDAR_GRUP_PETIT}.`;

export const SENSE_XIFRA = 'sense xifra';
export const APARELLS = Object.freeze([
  Object.freeze({ clau: 'android-app', nom: '📱 App Android (Google Play)', on: 'Google Play Console › Proves › Prova tancada: Google en demana 12 verificadors amb l’app instal·lada durant 14 dies seguits.' }),
  Object.freeze({ clau: 'ios-app', nom: '🍎 App iPhone i iPad (App Store oberta, id6826441844)', on: 'App Store Connect › Analítica (instal·lacions de la 1.0, publicada el 6-11-2026).' }),
  Object.freeze({ clau: 'android-web', nom: '🌐 Android web', on: 'Cap font.' }),
  Object.freeze({ clau: 'escriptori', nom: '💻 Escriptori', on: 'Cap font.' }),
]);
export const TEXT_APARELLS_SENSE_FONT = 'Cap consulta del servidor no compta encara els aparells per camí, i ací no es mostra cap xifra que no vinga d’una font real. Comptar-los des d’este Tauler demana una consulta agregada nova al servidor (P0-42): és una decisió del Mestre.';

export const TITOL_APARELLS = 'Aparells amb l’app instal·lada i connectada';
export const TAULA_APARELLS = 'Aparells amb l’app, per camí';

export const filesValides = (valor) => (Array.isArray(valor) ? valor.filter((f) => f && typeof f === 'object') : []);
/* Només el que es compta: ni l'adreça de contacte, ni l'identificador, ni el nom. */
export const dadesDePersona = (fila) => ({ created_at: fila.created_at, last_sign_in_at: fila.last_sign_in_at });
export const dadesDEntitat = (fila) => ({ kind: fila.kind });
