/**
 * natiu/origenInstallacio.js — Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · D'on ve
 * l'App instal·lada: el canal que ha d'obrir l'avís d'actualització d'un toc.
 *
 *   · Android · el paquet instal·lador (PackageManager): Google Play és «com.android.vending» (i, en
 *     telèfons molt vells, «com.google.android.feedback») → 'play'. Qualsevol altre, o cap (un APK
 *     obert des del navegador o el gestor de fitxers, o «adb install»), és una instal·lació directa →
 *     'directa'. Ho diu OrigenInstallacioPlugin.java: { llegit: true, instalador? }.
 *   · iOS · el nom del rebut de la botiga (Bundle.main.appStoreReceiptURL): «sandboxReceipt» és
 *     TestFlight (o un build d'Xcode) → 'testflight'; «receipt» és l'App Store → 'app-store'. Ho diu
 *     OrigenInstallacioPlugin (dins de ControladorSdp.swift): { llegit: true, rebut }.
 *   · Sense pont, sense el connector (un binari d'abans no el porta), amb un error, un tall o una
 *     resposta que no s'entén → 'desconegut'. El detector decidix què fer amb el desconegut
 *     (actualitzacioAppNativa.js): el comportament de sempre, la botiga pública (Google Play a Android,
 *     l'App Store a iOS). P0123-02 · TestFlight només per a 'testflight' demostrat: una App de l'App
 *     Store amb el pont mut no ha de vore «Actualitza a TestFlight». El rebut de proves també el porta
 *     l'App en App Review: d'això en fa la guarda publica-tot.mjs --sincronitza-proves.
 *
 * Cap paquet nou ni cap import del nucli de Capacitor (frontera.test.js): el pont que injecta el
 * WebView (window.Capacitor.nativePromise), com enrereNatiu.js i compartirNatiu.js. Capacitor
 * gotchas 261026: una promesa d'un connector pot no tornar mai; per això, sempre amb un tall.
 * Mai llança ni escriu a la consola.
 */
export const CONNECTOR_ORIGEN = 'OrigenInstallacio';
export const METODE_ORIGEN = 'consulta';
export const TEMPS_MAXIM_ORIGEN_MS = 2000;

export const ORIGENS = Object.freeze({
  PLAY: 'play',
  DIRECTA: 'directa',
  TESTFLIGHT: 'testflight',
  APP_STORE: 'app-store',
  DESCONEGUT: 'desconegut'
});

/** Els paquets instal·ladors de Google Play. */
export const INSTALADORS_PLAY = Object.freeze(['com.android.vending', 'com.google.android.feedback']);
/** El nom del fitxer del rebut a TestFlight (i als builds d'Xcode) i a l'App Store. */
export const REBUT_TESTFLIGHT = 'sandboxReceipt';
export const REBUT_APP_STORE = 'receipt';

const NOM_DE_PAQUET = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/;

/** Pur: el canal d'origen a partir de la resposta del connector natiu. Mai llança. */
export function classificaOrigen(plataforma, resposta) {
  try {
    if (!resposta || typeof resposta !== 'object' || Array.isArray(resposta) || resposta.llegit !== true) return ORIGENS.DESCONEGUT;
    if (plataforma === 'android') {
      const instalador = resposta.instalador;
      if (instalador === undefined || instalador === null || instalador === '') return ORIGENS.DIRECTA;
      if (typeof instalador !== 'string' || instalador.length > 255 || !NOM_DE_PAQUET.test(instalador)) return ORIGENS.DESCONEGUT;
      return INSTALADORS_PLAY.includes(instalador) ? ORIGENS.PLAY : ORIGENS.DIRECTA;
    }
    if (plataforma === 'ios') {
      if (resposta.rebut === REBUT_TESTFLIGHT) return ORIGENS.TESTFLIGHT;
      if (resposta.rebut === REBUT_APP_STORE) return ORIGENS.APP_STORE;
    }
  } catch { /* una resposta rara és un origen desconegut */ }
  return ORIGENS.DESCONEGUT;
}

/**
 * Pregunta l'origen al connector natiu i el classifica. Torna sempre un dels ORIGENS (mai llança):
 * sense pont o fora d'Android i iOS, 'desconegut'.
 */
export async function consultaOrigenInstallacio({
  plataforma,
  finestra = globalThis,
  tempsMaxim = TEMPS_MAXIM_ORIGEN_MS,
  rellotge = globalThis
} = {}) {
  if (plataforma !== 'android' && plataforma !== 'ios') return ORIGENS.DESCONEGUT;
  let pont = null;
  try { pont = finestra?.Capacitor ?? null; } catch { pont = null; }
  if (typeof pont?.nativePromise !== 'function') return ORIGENS.DESCONEGUT;
  let temporitzador = null;
  const tall = new Promise((resolve) => {
    try { temporitzador = rellotge.setTimeout(() => resolve(null), tempsMaxim); } catch { resolve(null); }
  });
  const pregunta = Promise.resolve()
    .then(() => pont.nativePromise(CONNECTOR_ORIGEN, METODE_ORIGEN, {}))
    .catch(() => null);
  try {
    return classificaOrigen(plataforma, await Promise.race([pregunta, tall]));
  } finally {
    try { rellotge.clearTimeout(temporitzador); } catch { /* res */ }
  }
}
