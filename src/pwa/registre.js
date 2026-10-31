/* Fase 0 de l'empaquetat mòbil (261003) · registre del service worker de
   l'entrada pròpia (public/sw.js). Disseny: _wiki_de_poble/04_escriptori/
   02_investigacio_ia/261003_1330_empaquetat_mobil_claude/FASE0_PWA.txt.

   Només el crida src/main.jsx, l'entrada de socdepoble.org. El paquet autònom
   (embed.jsx) i qualsevol amfitrió no el registren mai: la PWA és de la
   pàgina, no del component (estandard_integracio_react, LLEI 3).
   En desenvolupament no fa res; tampoc toca un worker vell de localhost.

   Closca de les apps (ordre del Mestre, 261007; _wiki_de_poble/02_saber/
   architecture/ADR-2026-10-APPS-DEL-DISPOSITIU.md): el component no parla mai
   amb el worker. RutaApps (src/apps/plataforma/escalfamentMemoriaCau.js)
   només avisa amb ESDEVENIMENT_APP_VISITADA, sense cap dada i només quan és
   l'ama del document. Ací, a l'entrada pròpia i quan el worker s'ha de
   registrar, eixe avís i el canvi de controlador es convertixen en el
   missatge d'escalfament: els recursos amb empremta que la pàgina ja ha
   carregat (performance) i la ruta de l'app, per a la closca. Fora de
   /app/* no s'envia res.
   Revisió F1 (261007): el worker guarda una closca per app i només la dona
   si conté TOTS els recursos que la pàgina d'eixa app ha carregat. Com que
   RutaApps avisa abans que arribe el chunk lazy de l'app, el missatge
   s'envia després d'una espera curta (ESPERA_ESCALFAMENT_MS) i torna a eixir
   cada vegada que un observador de Resource Timing veu carregar un recurs
   amb empremta nou: el de l'app, el d'una vista oberta més tard. */

export const RUTA_DEL_SW = '/sw.js';
export const ABAST_DEL_SW = '/';
/* El nom que dispara src/apps/plataforma/escalfamentMemoriaCau.js (registre.test.js comprova que és el mateix). */
export const ESDEVENIMENT_APP_VISITADA = 'sdp:app-visitada';
/* El tipus de missatge que entén public/sw.js (sw.test.js comprova que és el mateix). */
export const MISSATGE_ESCALFAMENT = 'sdp-escalfa';
/* El patró de public/sw.js per als recursos del build amb empremta (sw.test.js comprova que és el mateix). */
export const RECURS_AMB_EMPREMTA = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.(js|mjs|css|woff2?)$/;
/* Quant s'espera després de l'últim avís o de l'últim recurs carregat abans
   d'enviar el missatge: un sol missatge amb el chunk de l'app val més que un
   a mitges (revisió F1, 261007). */
export const ESPERA_ESCALFAMENT_MS = 500;
const CAMI_D_APP = /^\/app(?:\/|$)/;

/** Si una entrada de Resource Timing és un recurs amb empremta de l'origen `origen`, sense consulta. */
function esRecursPropi(entrada, origen) {
  try {
    const url = new URL(entrada && entrada.name);
    return url.origin === origen && !url.search && RECURS_AMB_EMPREMTA.test(url.pathname);
  } catch {
    return false;
  }
}

/**
 * Observa els recursos que carrega la pàgina (Resource Timing) i passa cada
 * llista d'entrades a `avisa`. Torna l'observador, o null si no n'hi ha: amb
 * `type` i `buffered` per a tindre també els ja carregats; si el navegador no
 * admet eixa forma, la d'`entryTypes`.
 */
function observaRecursos(finestra, avisa) {
  const Observador = finestra.PerformanceObserver;
  if (typeof Observador !== 'function') return null;
  try {
    const observador = new Observador((llista) => {
      try {
        avisa(llista.getEntries());
      } catch {
        /* sense escalfament, la pàgina continua igual */
      }
    });
    try {
      observador.observe({ type: 'resource', buffered: true });
    } catch {
      observador.observe({ entryTypes: ['resource'] });
    }
    return observador;
  } catch {
    return null;
  }
}

/**
 * Per què NO s'ha de registrar, o null si s'ha de registrar.
 * Pura: rep la decisió de producció, el navigator i la finestra.
 */
export function motiuPerNoRegistrar({ produccio, navegador, finestra } = {}) {
  if (produccio !== true) return 'desenvolupament';
  if (!navegador || !('serviceWorker' in navegador)) return 'sense-suport';
  if (!finestra || finestra.isSecureContext !== true) return 'context-insegur';
  // Dins d'un iframe la pàgina és de l'amfitrió, no nostra.
  if (finestra.top !== finestra.self) return 'incrustat';
  // Dins de l'app de Capacitor (Fases 1 i 2) la capa nativa porta dades i actualitzacions.
  const capacitor = finestra.Capacitor;
  if (capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform()) return 'nativa';
  return null;
}

/**
 * El missatge d'escalfament per al worker, o null fora de /app/*. Pura.
 * `entrades`: les de performance.getEntriesByType('resource'), de les quals
 * només passen els recursos amb empremta del mateix origen i sense consulta,
 * com a camins i sense repetir. `ubicacio`: { origin, pathname } de la pàgina.
 * El worker ho torna a validar tot (planDEscalfament) i hi posa els sostres.
 */
export function missatgeDEscalfament({ entrades, ubicacio } = {}) {
  if (!ubicacio || !CAMI_D_APP.test(String(ubicacio.pathname || ''))) return null;
  const recursos = [];
  for (const entrada of Array.isArray(entrades) ? entrades : []) {
    if (!esRecursPropi(entrada, ubicacio.origin)) continue;
    const cami = new URL(entrada.name).pathname;
    if (!recursos.includes(cami)) recursos.push(cami);
  }
  return { tipus: MISSATGE_ESCALFAMENT, recursos, closca: ubicacio.pathname };
}

/**
 * Escolta l'avís de les apps (ESDEVENIMENT_APP_VISITADA), el canvi de
 * controlador i els recursos amb empremta que la pàgina carrega, i envia el
 * missatge d'escalfament al worker que controla la pàgina, si n'hi ha cap i
 * si la pàgina és de /app/*. Cada causa programa l'enviament per a d'ací a
 * ESPERA_ESCALFAMENT_MS i les que arriben dins d'eixa espera s'hi ajunten:
 * el chunk lazy de l'app arriba després de l'avís de RutaApps i ha d'anar en
 * el missatge (revisió F1, 261007). Escalfar és una ajuda: no llança mai.
 * Torna la funció que deixa d'escoltar.
 */
export function escoltaEscalfament({ navegador, finestra } = {}) {
  const sw = navegador && navegador.serviceWorker;
  if (!sw || !finestra || typeof finestra.addEventListener !== 'function') return () => {};
  /* Els que l'observador ha vist carregar: el buffer de Resource Timing (250
     entrades per defecte) pot deixar de guardar-ne; l'observador, no. */
  const vistos = new Set();
  let espera = null;
  const envia = () => {
    espera = null;
    try {
      const controlador = sw.controller;
      if (!controlador || typeof controlador.postMessage !== 'function') return;
      const rendiment = finestra.performance;
      const delBuffer = rendiment && typeof rendiment.getEntriesByType === 'function' ? rendiment.getEntriesByType('resource') : [];
      const entrades = (Array.isArray(delBuffer) ? delBuffer : []).concat([...vistos].map((name) => ({ name })));
      const missatge = missatgeDEscalfament({ entrades, ubicacio: finestra.location });
      if (missatge) controlador.postMessage(missatge);
    } catch {
      /* sense escalfament, la pàgina continua igual */
    }
  };
  const programa = () => {
    try {
      if (typeof finestra.setTimeout !== 'function') {
        envia();
        return;
      }
      if (espera !== null && typeof finestra.clearTimeout === 'function') finestra.clearTimeout(espera);
      espera = finestra.setTimeout(envia, ESPERA_ESCALFAMENT_MS);
    } catch {
      envia();
    }
  };
  const observador = observaRecursos(finestra, (entrades) => {
    const ubicacio = finestra.location || {};
    let nous = false;
    for (const entrada of entrades) {
      if (!esRecursPropi(entrada, ubicacio.origin) || vistos.has(entrada.name)) continue;
      vistos.add(entrada.name);
      nous = true;
    }
    if (nous && CAMI_D_APP.test(String(ubicacio.pathname || ''))) programa();
  });
  finestra.addEventListener(ESDEVENIMENT_APP_VISITADA, programa);
  if (typeof sw.addEventListener === 'function') sw.addEventListener('controllerchange', programa);
  return () => {
    if (typeof finestra.removeEventListener === 'function') finestra.removeEventListener(ESDEVENIMENT_APP_VISITADA, programa);
    if (typeof sw.removeEventListener === 'function') sw.removeEventListener('controllerchange', programa);
    if (observador && typeof observador.disconnect === 'function') observador.disconnect();
    if (espera !== null && typeof finestra.clearTimeout === 'function') finestra.clearTimeout(espera);
    espera = null;
  };
}

/**
 * Registra /sw.js amb abast / quan la pàgina ha acabat de carregar, per no
 * competir amb la primera pintada. No llança mai: torna
 * { registrat: true, registre } o { registrat: false, motiu[, error] }.
 * Quan s'ha de registrar, escolta des d'ara l'escalfament (escoltaEscalfament):
 * l'avís de RutaApps pot arribar abans de l'esdeveniment load.
 */
export function registraServiceWorker({
  produccio = import.meta.env.PROD,
  navegador = globalThis.navigator,
  finestra = globalThis.window
} = {}) {
  const motiu = motiuPerNoRegistrar({ produccio, navegador, finestra });
  if (motiu) return Promise.resolve({ registrat: false, motiu });

  try {
    escoltaEscalfament({ navegador, finestra });
  } catch {
    /* sense escalfament, el registre continua */
  }

  const registra = () => Promise.resolve()
    .then(() => navegador.serviceWorker.register(RUTA_DEL_SW, { scope: ABAST_DEL_SW }))
    .then((registre) => ({ registrat: true, registre }))
    .catch((error) => ({ registrat: false, motiu: 'error', error }));

  if (finestra.document?.readyState === 'complete') return registra();
  return new Promise((resol) => {
    finestra.addEventListener('load', () => resol(registra()), { once: true });
  });
}

/* Ordre nocturna 261030_0252 (Fase 3, WP) · Avisos push del Xat, fase N1 i
   inert: encara no la crida ningú. */
/** Quant s'espera, com a molt, el registre del worker per als avisos push. */
export const TOPALL_REGISTRE_ACTIU_MS = 3000;

/**
 * El registre del worker propi (RUTA_DEL_SW, abast ABAST_DEL_SW) quan té un
 * worker actiu i cap versió en espera ni instal·lant-se, o null. És el que
 * rep src/pwa/avisosPush.js, que no pot nomenar el worker (la frontera de
 * registre.test.js): un worker vell actiu amb un de nou en espera (el de juny
 * també es deia /sw.js) no es pot subscriure. Usa getRegistration, que torna
 * de seguida, i no `ready`, que no es resol mai si no hi ha cap worker; i, per
 * si de cas, un topall. Mai llança.
 */
export async function registreActiu({ navegador = globalThis.navigator, topallMs = TOPALL_REGISTRE_ACTIU_MS } = {}) {
  const sw = navegador && navegador.serviceWorker;
  if (!sw || typeof sw.getRegistration !== 'function') return null;
  let rellotge = null;
  try {
    const topall = new Promise((resol) => {
      rellotge = setTimeout(() => resol(null), topallMs);
    });
    const registre = await Promise.race([Promise.resolve().then(() => sw.getRegistration(ABAST_DEL_SW)), topall]);
    if (!registre || !registre.active || registre.waiting || registre.installing) return null;
    return new URL(registre.active.scriptURL).pathname === RUTA_DEL_SW ? registre : null;
  } catch {
    return null;
  } finally {
    clearTimeout(rellotge);
  }
}

/* Si un worker (actiu, en espera o instal·lant-se) és el propi. Mai llança. */
function esWorkerPropi(worker) {
  try {
    return Boolean(worker) && new URL(worker.scriptURL).pathname === RUTA_DEL_SW;
  } catch {
    return false;
  }
}

/**
 * Gauntlet c3 (push-desactiva-fals-exit-amb-worker-en-espera) · El registre
 * del worker propi (abast ABAST_DEL_SW) si el seu worker actiu, en espera o
 * instal·lant-se és RUTA_DEL_SW, o null; AMB versió en espera o sense. És el
 * de la BAIXA dels avisos push: desactivaAvisosPush, l'interruptor
 * (sincronitzaAvisosPush) i netejaAvisosPush. La subscripció penja del
 * registre, no del worker actiu, i després de cada desplegament de
 * public/sw.js hi ha una versió en espera fins que es tanquen les pestanyes
 * (el worker no fa skipWaiting): amb registreActiu() la baixa no trobaria el
 * registre i la subscripció continuaria viva. Per a SUBSCRIURE, registreActiu().
 * Mateix getRegistration i mateix topall. Mai llança.
 */
export async function registreDelSw({ navegador = globalThis.navigator, topallMs = TOPALL_REGISTRE_ACTIU_MS } = {}) {
  const sw = navegador && navegador.serviceWorker;
  if (!sw || typeof sw.getRegistration !== 'function') return null;
  let rellotge = null;
  try {
    const topall = new Promise((resol) => {
      rellotge = setTimeout(() => resol(null), topallMs);
    });
    const registre = await Promise.race([Promise.resolve().then(() => sw.getRegistration(ABAST_DEL_SW)), topall]);
    if (!registre) return null;
    return [registre.active, registre.waiting, registre.installing].some(esWorkerPropi) ? registre : null;
  } catch {
    return null;
  } finally {
    clearTimeout(rellotge);
  }
}
