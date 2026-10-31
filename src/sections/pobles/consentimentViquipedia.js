/**
 * consentimentViquipedia.js · Fase 3a de l'eina de pobles nous (disseny
 * nit/viquipedia_disseny.md §4.6) · Si la persona ha dit que sí a portar
 * dades de la Viquipèdia i a pintar les fotos de Wikimedia Commons. És el
 * mateix patró de clic per a carregar que «Vore mapa» (Legal §21):
 *   · sense cap gest, no; el «sí» de la visita viu en una variable i mor en
 *     recarregar la pàgina;
 *   · «Recorda-ho en este navegador» el guarda com a preferència
 *     (storage.js · setVal('viquipedia', 'sempre'): la clau sdp_embed_viquipedia);
 *   · «Deixa de portar-ho de la Viquipèdia» desfà els dos.
 * Només es llig quan una fitxa està incompleta: un poble complet no hi passa.
 */
import { delVal, getVal, setVal } from '../../config/storage.js';

export const CLAU_CONSENTIMENT = 'viquipedia';
const SEMPRE = 'sempre';

let deLaVisita = false;
const oients = new Set();
const avisa = () => { for (const oient of [...oients]) oient(); };

/** Cert si la persona ha triat recordar-ho en este navegador. */
export const consentimentRecordat = () => getVal(CLAU_CONSENTIMENT) === SEMPRE;

/** Cert si es poden pintar les fotos de Commons (sí de la visita o recordat). */
export const consentimentActiu = () => deLaVisita || consentimentRecordat();

/** El «sí» d'un gest de la persona; amb `recorda`, també en este navegador. Torna si s'ha pogut recordar. */
export function donaConsentiment({ recorda = false } = {}) {
  deLaVisita = true;
  const recordat = recorda ? setVal(CLAU_CONSENTIMENT, SEMPRE) : false;
  avisa();
  return recordat;
}

/** «Deixa de portar-ho de la Viquipèdia»: ni el de la visita ni el recordat. */
export function retiraConsentiment() {
  deLaVisita = false;
  delVal(CLAU_CONSENTIMENT);
  avisa();
}

/** Per a useSyncExternalStore. */
export function subscriuConsentiment(oient) {
  oients.add(oient);
  return () => { oients.delete(oient); };
}

/** Només per a les proves: torna a l'estat d'una visita nova. */
export function oblidaConsentimentDeLaVisita() {
  deLaVisita = false;
  avisa();
}
