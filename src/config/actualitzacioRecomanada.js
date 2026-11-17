/**
 * actualitzacioRecomanada.js — Registre reactiu i obridor de botiga per a
 * l'avís suau i no bloquejant quan l'app nativa instal·lada (`org.socdepoble.app`
 * / iOS `id6826441844`) té una `versioRecomanada` superior a `VERSIO_CLIENT_NATIU`,
 * però encara complix `versioMinima` (Onada R22 · T2).
 *
 *   · Viu fora de `src/natiu/` perquè `src/natiu/` és un pou estricte d'importació:
 *     `natiu/entrada.jsx` hi publica l'estat resolt per `estatDeVersio` i, des de
 *     R32.3, el de `natiu/actualitzacioAppNativa.js` (el manifest de socdepoble.org), i
 *     `App.jsx` pinta la barra només si hi ha avís actiu i l'usuari no l'ha
 *     ajornat per a eixa versió concreta.
 *   · Quan arriba una `versioRecomanada` nova més alta que l'ajornada abans,
 *     la barra torna a mostrar-se de manera honesta.
 *   · L'ajornament es recorda amb un sol enter positiu a través de `storage.js`.
 *   · Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · Els mòbils de prova i la web: un
 *     avís pot portar `canal` ('testflight' a iOS, 'apk' a Android, amb la `sha256` de l'APK, o 'web'),
 *     i la PWA (src/pwa/actualitzacioWeb.js) hi publica la versió web nova amb FONT_WEB (l'enter
 *     `versioRecomanada` de la web és ordinalSemver de config/manifestVersio.js). El botó obri el canal
 *     de l'avís (obriBotigaActualitzacio). Sense canal, l'avís i el botó de sempre.
 */
import { useSyncExternalStore } from 'react';
import { delVal, getVal, setVal } from './storage.js';

export const CLAU_ACTUALITZACIO_DESCARTADA = 'natiu-versio-recomanada-descartada';

export const ENLLAC_ANDROID_PLAY = 'https://play.google.com/store/apps/details?id=org.socdepoble.app';
export const ENLLAC_ANDROID_MARKET = 'market://details?id=org.socdepoble.app';
export const ENLLAC_IOS_APP_STORE = 'https://apps.apple.com/es/app/soc-de-poble/id6826441844';
/* Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · Els dos canals de proves i la web.
   · TestFlight · l'esquema de l'app TestFlight obri la fitxa de Sóc de Poble (el mateix identificador
     d'Apple que l'App Store); si TestFlight no s'obri, la mateixa adreça en https, a Safari.
     [NO VERIFICAT en un iPhone: la forma beta.itunes.apple.com/v1/app/<id> és la que fan servir les
     apps per a obrir TestFlight; l'App ve de TestFlight i, per tant, TestFlight hi és.]
   · APK directe · l'adreça única de canalsDeBotiga.js (FITXER_APK), que socdepoble.org redirigix (302)
     al Node 0; Android l'obri al navegador, que el baixa.
   · Web · recarregar la pàgina amb la versió nova (src/pwa/actualitzacioWeb.js n'és l'amo). */
export const ID_APPLE = '6826441844';
export const ENLLAC_TESTFLIGHT = `https://beta.itunes.apple.com/v1/app/${ID_APPLE}`;
export const ESQUEMA_TESTFLIGHT = `itms-beta://beta.itunes.apple.com/v1/app/${ID_APPLE}`;
export const ENLLAC_APK_DIRECTE = 'https://socdepoble.org/descarregues/socdepoble-android-latest.apk';

/** El canal que obri el botó de la barra. Un avís sense canal és el de la botiga de sempre. */
export const CANALS_ACTUALITZACIO = Object.freeze({
  PLAY: 'play',
  APP_STORE: 'app-store',
  TESTFLIGHT: 'testflight',
  APK: 'apk',
  WEB: 'web'
});
const CANALS_PER_PLATAFORMA = Object.freeze({
  android: Object.freeze([CANALS_ACTUALITZACIO.PLAY, CANALS_ACTUALITZACIO.APK]),
  ios: Object.freeze([CANALS_ACTUALITZACIO.APP_STORE, CANALS_ACTUALITZACIO.TESTFLIGHT]),
  web: Object.freeze([CANALS_ACTUALITZACIO.WEB])
});

const PLATAFORMES_VALIDES = new Set(['android', 'ios', 'web']);
const SEMVER = /^\d{1,6}\.\d{1,6}\.\d{1,6}$/;
const SHA256 = /^[0-9a-f]{64}$/;

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

/* R32.3 · Quant espera l'App que Google Play (o, des de la v1.2.7, TestFlight) prenga el primer pla
   abans d'obrir l'https de reserva. */
export const ESPERA_RESERVA_MARKET_MS = 1500;
const MARKET_VALID = /^market:\/\/details\?id=[A-Za-z0-9._-]+$/;

/* Cert només si hi ha window.open i no ha llançat: sense open no s'ha obert res (R32.3, Elefant). */
function obri(finestra, url) {
  if (typeof finestra?.open !== 'function') return false;
  try {
    finestra.open(url, '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    return false;
  }
}

/**
 * R32.3 · `market://` amb reserva https, sense obrir mai dues botigues pel valor de
 * window.open (amb 'noopener' torna sempre null). La reserva només s'obri si, passada
 * l'espera, l'App continua en primer pla: si Google Play s'ha obert, l'App ha rebut abans
 * `pause` (el pont de Capacitor), `visibilitychange` amagat o `pagehide`, i la reserva es
 * cancel·la. Sense document ni temporitzadors (una finestra mínima), torna fals i qui la
 * crida obri directament l'https.
 */
function obriEsquemaAmbReserva(finestra, market, httpsUrl, espera) {
  const document = finestra.document;
  if (typeof finestra.setTimeout !== 'function' || typeof document?.addEventListener !== 'function'
    || typeof finestra.addEventListener !== 'function') return false;
  let resolt = false;
  let temporitzador = null;
  const desescolta = () => {
    try {
      document.removeEventListener('visibilitychange', haMarxat);
      document.removeEventListener('pause', haMarxat);
      finestra.removeEventListener('pagehide', haMarxat);
    } catch { /* res */ }
  };
  const acaba = () => {
    if (resolt) return false;
    resolt = true;
    try { finestra.clearTimeout?.(temporitzador); } catch { /* res */ }
    desescolta();
    return true;
  };
  function haMarxat(event) {
    if (event?.type === 'visibilitychange' && document.visibilityState !== 'hidden') return;
    acaba();
  }
  document.addEventListener('visibilitychange', haMarxat);
  document.addEventListener('pause', haMarxat);
  finestra.addEventListener('pagehide', haMarxat);
  temporitzador = finestra.setTimeout(() => {
    if (!acaba() || document.visibilityState === 'hidden') return;
    obri(finestra, httpsUrl);
  }, espera);
  if (obri(finestra, market)) return true;
  acaba();
  return false;
}

/**
 * Obri la fitxa oficial de la botiga corresponent amb un sol toc. Retorna l'URL
 * que s'ha intentat obrir primer, o null.
 *   · Android · `market://details?id=org.socdepoble.app` (l'app de Google Play, sense
 *     passar pel navegador) i, només si l'App no perd el primer pla, l'adreça https de
 *     Play com a reserva (obriMarketAmbReserva);
 *   · iOS · l'adreça https de l'App Store, que el pont de Capacitor obri a l'app de la botiga.
 *
 * Auditoria del kit de Gemini R22 · Mai dues botigues alhora: amb 'noopener'
 * window.open torna sempre null (HTML) i no diu si s'ha obert res; per això la
 * reserva no depén d'eixe valor, sinó de si l'App ha passat a segon pla.
 */
export function obriBotigaActualitzacio(avis, {
  finestra = typeof window !== 'undefined' ? window : null,
  espera = ESPERA_RESERVA_MARKET_MS
} = {}) {
  if (!avis || typeof avis !== 'object' || !finestra) return null;
  /* v1.2.7 · P0-123 · La web no obri cap botiga: recarrega amb la versió nova. TestFlight, amb
     l'esquema i la reserva https; l'APK directe, l'adreça fixa (mai una que vinga de fora). */
  if (avis.plataforma === 'web') return recarregaWeb(finestra) ? CANALS_ACTUALITZACIO.WEB : null;
  if (avis.plataforma === 'ios' && avis.canal === CANALS_ACTUALITZACIO.TESTFLIGHT) {
    if (obriEsquemaAmbReserva(finestra, ESQUEMA_TESTFLIGHT, ENLLAC_TESTFLIGHT, espera)) return ESQUEMA_TESTFLIGHT;
    return obri(finestra, ENLLAC_TESTFLIGHT) ? ENLLAC_TESTFLIGHT : null;
  }
  if (avis.plataforma === 'android' && avis.canal === CANALS_ACTUALITZACIO.APK) {
    return obri(finestra, ENLLAC_APK_DIRECTE) ? ENLLAC_APK_DIRECTE : null;
  }
  const httpsUrl = enllacSegur(avis.enllac) || enllacBotigaPerDefecte(avis.plataforma);
  if (!httpsUrl) return null;
  const market = avis.plataforma === 'android' && typeof avis.marketUrl === 'string' && MARKET_VALID.test(avis.marketUrl)
    ? avis.marketUrl
    : null;
  if (market && obriEsquemaAmbReserva(finestra, market, httpsUrl, espera)) return market;
  return obri(finestra, httpsUrl) ? httpsUrl : null;
}

/* R32.3 (Elefant) · Les fonts que hi publiquen, en ordre de desempat: el port del node
   (natiu/versioMinima.js, via natiu/entrada.jsx; és la font per defecte dels qui no en diuen
   cap) i el manifest de socdepoble.org (natiu/actualitzacioAppNativa.js). Cada font té la seua
   recomanació; la barra mostra la més alta i, amb el mateix build, la de la primera font. Així
   l'ordre d'arribada no importa, una font no esborra l'altra i una font pot retirar (o rebaixar)
   la seua: un build retirat de la botiga deixa de prometre's dins de la mateixa sessió. */
export const FONT_NODE = 'node';
export const FONT_MANIFEST = 'manifest';
/* v1.2.7 · P0-123 · La PWA (src/pwa/actualitzacioWeb.js): mai conviu amb les altres dues, que només
   publiquen dins de l'App nativa. */
export const FONT_WEB = 'web';
const FONTS = Object.freeze([FONT_NODE, FONT_MANIFEST, FONT_WEB]);

/* v1.2.7 · P0-123 · Qui sap recarregar la web amb la versió nova (activar el worker que espera i
   tornar a carregar): ho fixa src/pwa/actualitzacioWeb.js, l'única peça que en té el dret. Sense,
   la recàrrega de sempre del navegador. */
let recarregadorWeb = null;
export function fixaRecarregaWeb(recarrega) {
  recarregadorWeb = typeof recarrega === 'function' ? recarrega : null;
}
function recarregaWeb(finestra) {
  try {
    if (recarregadorWeb) {
      recarregadorWeb();
      return true;
    }
    if (typeof finestra?.location?.reload !== 'function') return false;
    finestra.location.reload();
    return true;
  } catch {
    return false;
  }
}

const perFont = new Map();
/* Ajornament de la sessió quan l'emmagatzematge no el pot desar (navegació privada, quota). */
let descartadaEnSessio = 0;
const oients = new Set();

/** La recomanació més alta entre les fonts (la de la primera font si empaten), o null. */
function actualitzacioActual() {
  let millor = null;
  for (const font of FONTS) {
    const avis = perFont.get(font);
    if (avis && (!millor || avis.versioRecomanada > millor.versioRecomanada)) millor = avis;
  }
  return millor;
}

function notifica() {
  for (const avisa of oients) avisa();
}

/** Retorna l'enter positiu de l'última `versioRecomanada` ajornada, o 0. */
export function versioRecomanadaDescartada() {
  const valor = getVal(CLAU_ACTUALITZACIO_DESCARTADA, null);
  const enter = typeof valor === 'number' ? valor : Number(valor?.versio);
  return Number.isSafeInteger(enter) && enter >= 1 ? enter : 0;
}

/* v1.2.7 · P0-123 · Els camps nous (canal, versio i sha256) només hi són quan l'avís els porta: l'avís
   de la botiga de sempre té la forma de sempre. Un canal que no és de la plataforma, o un APK sense
   una SHA-256 vàlida (la barra l'ha de dir), no és cap avís. La web sempre porta el seu canal. */
function normalitzaAvis(dades) {
  if (!dades || typeof dades !== 'object') return null;
  const plataforma = PLATAFORMES_VALIDES.has(dades.plataforma) ? dades.plataforma : null;
  const versioRecomanada = dades.versioRecomanada;
  if (!plataforma || !Number.isSafeInteger(versioRecomanada) || versioRecomanada < 1) return null;
  const canal = dades.canal === undefined || dades.canal === null
    ? (plataforma === 'web' ? CANALS_ACTUALITZACIO.WEB : null)
    : dades.canal;
  if (canal !== null && !CANALS_PER_PLATAFORMA[plataforma].includes(canal)) return null;
  if (plataforma === 'web' && canal !== CANALS_ACTUALITZACIO.WEB) return null;
  const sha256 = typeof dades.sha256 === 'string' && SHA256.test(dades.sha256) ? dades.sha256 : null;
  if (canal === CANALS_ACTUALITZACIO.APK && !sha256) return null;
  const versio = typeof dades.versio === 'string' && SEMVER.test(dades.versio) ? dades.versio : null;
  if (plataforma === 'web' && !versio) return null;
  const enllac = plataforma === 'web' ? null : enllacSegur(dades.enllac);
  const marketUrl = plataforma === 'android'
    && typeof dades.marketUrl === 'string'
    && /^market:\/\/details\?id=[A-Za-z0-9._-]+$/.test(dades.marketUrl)
    ? dades.marketUrl
    : null;
  return Object.freeze({
    plataforma,
    versioRecomanada,
    enllac,
    marketUrl,
    ...(canal !== null ? { canal } : null),
    ...(canal !== null && versio ? { versio } : null),
    ...(canal === CANALS_ACTUALITZACIO.APK ? { sha256 } : null)
  });
}

function estatVisibleActual() {
  const actual = actualitzacioActual();
  if (!actual) return null;
  if (Math.max(versioRecomanadaDescartada(), descartadaEnSessio) >= actual.versioRecomanada) return null;
  return actual;
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
    && nova.canal === instantaniaVisible.canal
    && nova.versio === instantaniaVisible.versio
    && nova.sha256 === instantaniaVisible.sha256
  );
  if (igual) return false;
  instantaniaVisible = nova;
  return true;
}

/**
 * Publica (o retira amb `null`) la recomanació d'actualització d'una font.
 *   · `font` · FONT_NODE (per defecte) o FONT_MANIFEST; una altra no fa res.
 *   · Una recomanació substituïx la de la MATEIXA font (també si és més baixa: retirada);
 *     la d'una altra font no la toca, i la barra mostra la més alta (R32.3, Elefant).
 *   · `null` amb font retira la d'eixa font; `null` sense font les buida totes (la porta de
 *     versió mínima, quan bloqueja l'App, natiu/entrada.jsx).
 */
export function publicaActualitzacioRecomanada(dades, font = null) {
  // v1.2.7 · P0-123 · Un avís de la web només el publica la font de la web, i la font de la web només en publica de la web.
  if ((font === FONT_WEB) !== (dades?.plataforma === 'web') && dades) return;
  if (font !== null && !FONTS.includes(font)) return;
  const nova = normalitzaAvis(dades);
  if (nova) perFont.set(font ?? FONT_NODE, nova);
  else if (font === null) perFont.clear();
  else perFont.delete(font);
  if (recalculaInstantania()) notifica();
}

/** Ajorna l'avís per a la `versioRecomanada` indicada (o l'actual) i amaga la barra. */
export function descartaActualitzacioRecomanada(versio = actualitzacioActual()?.versioRecomanada) {
  if (!Number.isSafeInteger(versio) || versio < 1) return false;
  const desat = setVal(CLAU_ACTUALITZACIO_DESCARTADA, { versio });
  // Sense emmagatzematge, l'ajornament val almenys fins que es tanque l'App (cap font el desfà).
  if (!desat) descartadaEnSessio = Math.max(descartadaEnSessio, versio);
  if (recalculaInstantania()) notifica();
  return true;
}

/* R32.3 (Elefant) · Per què no hi ha avís (o quin s'ha publicat), segons el detector del manifest:
   { motiu, quan, … } amb motiu 'inert-plataforma', 'inert-csp', 'sense-xarxa', 'tall', 'http-<codi>',
   'json', 'manifest-invalid', 'al-dia', 'publicada', 'error-publica'… Dades pures per a la diagnosi
   (la Consola la pot llegir sense importar src/natiu/); mai a la consola. */
let diagnosiDetector = Object.freeze({ motiu: 'absent', quan: null });

/** L'anota el detector natiu. Només còpia plana de valors primitius; mai llança. */
export function anotaDiagnosiActualitzacio(estat) {
  try {
    const net = {};
    for (const [clau, valor] of Object.entries(estat ?? {})) {
      if (valor === null || ['string', 'number', 'boolean'].includes(typeof valor)) net[clau] = valor;
    }
    diagnosiDetector = Object.freeze({ motiu: typeof net.motiu === 'string' ? net.motiu : 'desconegut', quan: null, ...net });
  } catch { /* res */ }
  return diagnosiDetector;
}

export function llegixDiagnosiActualitzacio() {
  return diagnosiDetector;
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
  perFont.clear();
  recarregadorWeb = null;
  descartadaEnSessio = 0;
  diagnosiDetector = Object.freeze({ motiu: 'absent', quan: null });
  instantaniaVisible = null;
  delVal(CLAU_ACTUALITZACIO_DESCARTADA);
  notifica();
}
