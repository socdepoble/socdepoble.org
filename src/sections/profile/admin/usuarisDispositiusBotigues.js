/**
 * usuarisDispositiusBotigues.js — R13-C7 (ordre del Mestre, 08-11-2026) · El model pur del 7é apartat
 * d'«🛡️ Administració del sistema»: «👥 Usuaris, Dispositius i Botigues (Google i Apple)».
 *
 * Ací viuen els textos i les decisions que no necessiten React: el nom de cada camí de la taula,
 * què diu el panell en cada estat de la consulta (cap estat sense dades porta cap xifra), el missatge
 * per al grup de WhatsApp dels verificadors i la còpia al porta-retalls (que mai diu «copiat» si el
 * navegador no l'ha deixat copiar).
 *
 * Regla 2.3.10 de l'App Store (appNativaIos.js): dins de l'app d'iOS el panell amaga les files, els
 * botons, la guia i el missatge que nomenen Android o Google Play (`nomenaAltres`).
 *
 * Les dades de les botigues són les d'assistentBotigues.js (no es dupliquen); les de les sessions, les de
 * src/data/resumSessionsDispositius.js.
 */
import { CODI_RESUM_SESSIONS, MIGRACIO_RESUM_SESSIONS } from '../../../data/resumSessionsDispositius.js';
import { ADRECA_VERIFICADORS_GOOGLE_PLAY, PASSOS_VERIFICADOR_GOOGLE_PLAY, URL_FITXA_APP_STORE, VERIFICADORS_DE_GOOGLE } from './assistentBotigues.js';

/** L'App Store: la versió publicada i l'identificador d'Apple (canal app-store de canalsDeBotiga.js). */
export const APP_STORE = Object.freeze({ versio: '1.0', id: 'id6826441844' });

/** Els camins de la taula, en l'ordre de la RPC. `nomenaAltres`: s'amaga dins de l'app d'iOS. */
export const CAMINS_PANELL = Object.freeze([
  Object.freeze({ cami: 'app_ios', titol: `🍎 App iPhone/iPad (App Store v${APP_STORE.versio} · ${APP_STORE.id})`, nomenaAltres: false }),
  Object.freeze({ cami: 'web_ios', titol: '🧭 Safari i navegadors d’iPhone/iPad (web)', nomenaAltres: false }),
  Object.freeze({ cami: 'app_android', titol: '🤖 App Android (Google Play, WebView)', nomenaAltres: true }),
  Object.freeze({ cami: 'web_android', titol: '🌐 Chrome i navegadors d’Android (web)', nomenaAltres: true }),
  Object.freeze({ cami: 'escriptori', titol: '💻 Escriptori (Mac/PC)', nomenaAltres: false }),
  Object.freeze({ cami: 'altres', titol: '❔ Altres (sessions sense navegador identificat)', nomenaAltres: false })
]);

/** Les files que es pinten d'un resum validat: [{ cami, titol, persones24h, persones7d, persones14d }]. */
export function filesDelResum(resum, { nativaIos = false } = {}) {
  const perCami = new Map((resum?.camins ?? []).map((fila) => [fila.cami, fila]));
  return CAMINS_PANELL
    .filter((c) => !(nativaIos && c.nomenaAltres) && perCami.has(c.cami))
    .map((c) => ({ ...perCami.get(c.cami), titol: c.titol }));
}

export const TEXT_BOTO_CONSULTA = '🔄 Consultar Usuaris i Dispositius Connectats Ara';
export const TEXT_ESTAT_INICIAL = 'Encara no s’ha consultat. El botó demana al servidor només recomptes: cap nom, cap correu ni cap identificador de persona.';
const FALTA_MIGRACIO = `La consulta del servidor encara no està aplicada: falta la migració ${MIGRACIO_RESUM_SESSIONS}, pendent d’ordre del Mestre.`;

/** Què diu el panell quan no hi ha dades, per a cada codi d'error de la consulta. Cap porta cap xifra. */
export const TEXTOS_ERROR_RESUM = Object.freeze({
  [CODI_RESUM_SESSIONS.SENSE_MIGRACIO]: FALTA_MIGRACIO,
  [CODI_RESUM_SESSIONS.SENSE_PORT]: `La consulta del servidor encara no està connectada: la migració ${MIGRACIO_RESUM_SESSIONS} consta com a no aplicada, pendent d’ordre del Mestre, i el port de dades de l’app encara no porta el mètode adminResumSessionsDispositius (declarar-lo al contracte també és decisió del Mestre).`,
  [CODI_RESUM_SESSIONS.SENSE_SERVIDOR]: 'Este node no té cap servidor configurat (mode local o de demostració): no hi ha cap sessió que comptar.',
  [CODI_RESUM_SESSIONS.SENSE_PERMIS]: 'El servidor ha refusat la consulta: cal ser superadmin amb el segon factor confirmat (aal2) en esta sessió. Confirma’l des d’«El compte» del teu perfil o des del Tauler.',
  [CODI_RESUM_SESSIONS.RESPOSTA_INVALIDA]: 'El servidor ha tornat una resposta que no és la d’esta consulta: no es mostra cap xifra.',
  [CODI_RESUM_SESSIONS.ERROR]: 'La consulta ha fallat (xarxa o servidor): no es mostra cap xifra. Torna-ho a provar amb el mateix botó.'
});
export const textErrorResum = (codi) => TEXTOS_ERROR_RESUM[codi] ?? TEXTOS_ERROR_RESUM[CODI_RESUM_SESSIONS.ERROR];

export const NOTA_RECOMPTES = 'Persones distintes amb alguna sessió activa en cada finestra. Qui entra des de dos camins compta en tots dos; la fila del total compta cada persona una vegada. Un iPad en mode escriptori (el de fàbrica des d’iPadOS 13) es presenta com a Mac i compta a l’escriptori.';
export const NOTA_VERIFICADORS = `L’app d’Android activa en 14 dies no és la xifra de verificadors de Google: Google en demana ${VERIFICADORS_DE_GOOGLE.persones} amb l’app instal·lada durant ${VERIFICADORS_DE_GOOGLE.dies} dies seguits, i quants en són ara només es llig a Google Play Console › Proves › Prova tancada.`;
export const NOTA_PAS_1_GOOGLE_PLAY = `És el pas 1 dels verificadors: Google Play encara no té cap fitxa pública (prova tancada, ${VERIFICADORS_DE_GOOGLE.persones} verificadors durant ${VERIFICADORS_DE_GOOGLE.dies} dies).`;

/** El missatge per al grup de WhatsApp: els tres passos de la guia i els enllaços, en text pla. */
export const MISSATGE_WHATSAPP_VERIFICADORS = [
  `Sóc de Poble per a Android: Google ens demana ${VERIFICADORS_DE_GOOGLE.persones} verificadors amb l’app instal·lada durant ${VERIFICADORS_DE_GOOGLE.dies} dies seguits per a publicar-la. Si tens un mòbil Android, fes estos tres passos:`,
  '',
  ...PASSOS_VERIFICADOR_GOOGLE_PLAY,
  '',
  `Enllaç del pas 1: ${ADRECA_VERIFICADORS_GOOGLE_PLAY}`,
  `A l’iPhone i a l’iPad ja és a l’App Store: ${URL_FITXA_APP_STORE}`
].join('\n');

/**
 * Copia `text` al porta-retalls. Cert només si el navegador ho ha fet; fals si no hi ha
 * navigator.clipboard o si ho refusa (permís, context no segur). Mai llança.
 */
export async function copiaAlPortaretalls(text, navegador = typeof navigator === 'undefined' ? undefined : navigator) {
  const portaretalls = navegador?.clipboard;
  if (!portaretalls || typeof portaretalls.writeText !== 'function') return false;
  try {
    await portaretalls.writeText(text);
    return true;
  } catch {
    return false;
  }
}
