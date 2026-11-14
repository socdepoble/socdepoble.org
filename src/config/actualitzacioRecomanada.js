/**
 * actualitzacioRecomanada.js — Registre reactiu i obridor de botiga per a
 * l'avís suau i no bloquejant quan l'app nativa instal·lada (`org.socdepoble.app`
 * / iOS `id6826441844`) té una `versioRecomanada` superior a `VERSIO_CLIENT_NATIU`,
 * però encara complix `versioMinima` (Onada R22 · T2).
 *
 *   · Viu fora de `src/natiu/` perquè `src/natiu/` és un pou estricte d'importació:
 *     `natiu/entrada.jsx` hi publica l'estat resolt per `estatDeVersio`, i
 *     `App.jsx` pinta la barra només si hi ha avís actiu i l'usuari no l'ha
 *     ajornat per a eixa versió concreta.
 *   · Quan arriba una `versioRecomanada` nova més alta que l'ajornada abans,
 *     la barra torna a mostrar-se de manera honesta.
 *   · L'ajornament es recorda amb un sol enter positiu a través de `storage.js`.
 */
import { useSyncExternalStore } from 'react';
import { delVal, getVal, setVal } from './storage.js';

export const CLAU_ACTUALITZACIO_DESCARTADA = 'natiu-versio-recomanada-descartada';

export const ENLLAC_ANDROID_PLAY = 'https://play.google.com/store/apps/details?id=org.socdepoble.app';
export const ENLLAC_ANDROID_MARKET = 'market://details?id=org.socdepoble.app';
export const ENLLAC_IOS_APP_STORE = 'https://apps.apple.com/es/app/soc-de-poble/id6826441844';

const PLATAFORMES_VALIDES = new Set(['android', 'ios']);

/** L'enllaç d'actualitzar, només si és una adreça https; si no, null. Mai llança. */
export function enllacSegur(valor) {
  if (typeof valor !== 'string' || valor.length > 2048) return null;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && url.hostname ? url.href : null;
  } catch {
    return null;
  }
}

/** Adreça https oficial de la botiga de cada plataforma quan el servidor no en passa cap. */
export function enllacBotigaPerDefecte(plataforma) {
  if (plataforma === 'android') return ENLLAC_ANDROID_PLAY;
  if (plataforma === 'ios') return ENLLAC_IOS_APP_STORE;
  return null;
}

/**
 * Obri la fitxa oficial de la botiga corresponent: l'adreça https (Google Play
 * a Android, App Store a iOS), com el botó de CalActualitzar. Retorna l'URL
 * que s'ha intentat obrir, o null.
 *
 * Auditoria del kit de Gemini R22 · UNA sola destinació. Abans s'hi provava
 * `market://` i, si `window.open` no tornava finestra, l'https: amb
 * 'noopener' window.open torna sempre null (HTML), i a Android s'obrien
 * totes dues. L'adreça https de Play l'obri l'app de Google Play quan hi és
 * (i el navegador quan no), sense dependre d'un esquema propi.
 */
export function obriBotigaActualitzacio(avis, { finestra = typeof window !== 'undefined' ? window : null } = {}) {
  if (!avis || typeof avis !== 'object' || !finestra) return null;
  const httpsUrl = enllacSegur(avis.enllac) || enllacBotigaPerDefecte(avis.plataforma);
  if (!httpsUrl) return null;
  try {
    finestra.open?.(httpsUrl, '_blank', 'noopener,noreferrer');
    return httpsUrl;
  } catch {
    return null;
  }
}

let actualitzacioActual = null;
const oients = new Set();

function notifica() {
  for (const avisa of oients) avisa();
}

/** Retorna l'enter positiu de l'última `versioRecomanada` ajornada, o 0. */
export function versioRecomanadaDescartada() {
  const valor = getVal(CLAU_ACTUALITZACIO_DESCARTADA, null);
  const enter = typeof valor === 'number' ? valor : Number(valor?.versio);
  return Number.isSafeInteger(enter) && enter >= 1 ? enter : 0;
}

function normalitzaAvis(dades) {
  if (!dades || typeof dades !== 'object') return null;
  const plataforma = PLATAFORMES_VALIDES.has(dades.plataforma) ? dades.plataforma : null;
  const versioRecomanada = dades.versioRecomanada;
  if (!plataforma || !Number.isSafeInteger(versioRecomanada) || versioRecomanada < 1) return null;
  const enllac = enllacSegur(dades.enllac);
  const marketUrl = plataforma === 'android'
    && typeof dades.marketUrl === 'string'
    && /^market:\/\/details\?id=[A-Za-z0-9._-]+$/.test(dades.marketUrl)
    ? dades.marketUrl
    : null;
  return Object.freeze({
    plataforma,
    versioRecomanada,
    enllac,
    marketUrl
  });
}

function estatVisibleActual() {
  if (!actualitzacioActual) return null;
  if (versioRecomanadaDescartada() >= actualitzacioActual.versioRecomanada) return null;
  return actualitzacioActual;
}

let instantaniaVisible = null;

function recalculaInstantania() {
  const nova = estatVisibleActual();
  const igual = nova === instantaniaVisible || (
    nova !== null
    && instantaniaVisible !== null
    && nova.plataforma === instantaniaVisible.plataforma
    && nova.versioRecomanada === instantaniaVisible.versioRecomanada
    && nova.enllac === instantaniaVisible.enllac
    && nova.marketUrl === instantaniaVisible.marketUrl
  );
  if (igual) return false;
  instantaniaVisible = nova;
  return true;
}

/** Publica (o buida amb `null`) la recomanació d'actualització de l'entrada nativa. */
export function publicaActualitzacioRecomanada(dades) {
  actualitzacioActual = normalitzaAvis(dades);
  if (recalculaInstantania()) notifica();
}

/** Ajorna l'avís per a la `versioRecomanada` indicada (o l'actual) i amaga la barra. */
export function descartaActualitzacioRecomanada(versio = actualitzacioActual?.versioRecomanada) {
  if (!Number.isSafeInteger(versio) || versio < 1) return false;
  const desat = setVal(CLAU_ACTUALITZACIO_DESCARTADA, { versio });
  if (!desat && actualitzacioActual && actualitzacioActual.versioRecomanada <= versio) {
    actualitzacioActual = null;
  }
  if (recalculaInstantania()) notifica();
  return true;
}

export function subscriuActualitzacioRecomanada(avisa) {
  oients.add(avisa);
  return () => { oients.delete(avisa); };
}

export function llegixActualitzacioRecomanada() {
  return instantaniaVisible;
}

export function useActualitzacioRecomanada() {
  return useSyncExternalStore(subscriuActualitzacioRecomanada, llegixActualitzacioRecomanada, () => null);
}

/** Només per a proves unitàries: deixa el registre i l'ajornament en blanc. */
export function netejaActualitzacioRecomanadaPerProves() {
  actualitzacioActual = null;
  instantaniaVisible = null;
  delVal(CLAU_ACTUALITZACIO_DESCARTADA);
  notifica();
}
