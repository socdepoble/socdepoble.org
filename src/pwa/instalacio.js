/* Ordre del Mestre (261021, prompt 261021_0015, tasca 3) · Instal·lar Sóc de
   Poble a l'ordinador (Mac, Windows i Linux) com una aplicació en finestra
   pròpia, des del botó de la barra negra
   (src/components/universal/BotoInstalaApp.jsx). Pausa de la beta (pla
   261021_2345 §1): App.jsx no munta el botó; la captura continua ací perquè
   reactivar-lo siga tornar-lo a muntar, i mentrestant el navegador tampoc no
   oferix la seua instal·lació pròpia.

   Chromium (Chrome, Edge, Brave, Opera) dispara «beforeinstallprompt» com a
   molt una volta per càrrega, quan la pàgina complix els criteris
   d'instal·lació (el manifest amb icones de 192 i 512, HTTPS i una
   interacció). Si ningú no l'escolta a temps, es perd fins a la càrrega
   següent: per això la captura la fa l'entrada pròpia (src/main.jsx) en
   avaluar-se el mòdul, abans de pintar, i no un component que pot muntar-se
   tard. Ni el paquet autònom (embed.jsx) ni l'app nativa (natiu/entrada.jsx)
   la criden: dins d'un amfitrió, quedar-se l'esdeveniment li furtaria la seua
   pròpia instal·lació (estandard_integracio_react, LLEI 3).

   Magatzem pur, sense React: `captura` guarda l'esdeveniment (preventDefault
   amaga l'oferta pròpia del navegador, que passa a ser el nostre botó), `pot`
   diu si n'hi ha un, `subscriu` avisa els components (useSyncExternalStore a
   src/hooks/useInstalacioApp.js) i `demana` obri el diàleg natiu. Safari i
   Firefox no tenen l'esdeveniment: allí no s'oferix res. Només escriptori:
   el text del botó diu «al teu ordinador».

   P1-69 (ordre del Mestre, 261028 20:13; decisions de l'onada 2 del Bloc
   H) · «📲 Instal·lar l'App (PWA)» de /page/descarregues
   (src/sections/detail/InstalaLaPwa.jsx) també llig este magatzem, i també
   al mòbil. Al mòbil la captura escolta i guarda l'esdeveniment SENSE
   preventDefault: Chrome conserva la seua oferta pròpia a totes les pàgines
   i només el botó de Descàrregues crida prompt(). La pastilla de la barra
   negra continua sent només d'escriptori: `pot` no veu l'oferta del mòbil
   (`ofereix` sí), i motiuPerNoOferir no canvia. `motiuDeLaCaptura` diu per
   què l'última captura no escolta ('sense-captura' si ningú no l'ha
   cridada: ni el paquet autònom ni l'app nativa no la criden mai).
   Revisió adversarial de P1-69 (261028) · Android és «mòbil» també a la
   tauleta, on userAgentData.mobile és false: sense preventDefault i fora de
   la pastilla. `estaInstalada` recorda una instal·lació d'esta càrrega
   (appinstalled o «accepted»), feta en qualsevol pàgina: al mòbil l'oferta
   pròpia de Chrome és el camí principal i Descàrregues no hi era muntada.
   Safari dins d'un iframe queda 'incrustat' per a Descàrregues (el motiu
   que torna la captura, el de la pastilla, no canvia). */

/* Els modes de finestra del manifest que volen dir «ja s'executa instal·lada». */
export const MODES_D_APP = Object.freeze(['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay']);

/**
 * L'app ja corre instal·lada: un dels MODES_D_APP o, a iOS,
 * navigator.standalone. El mateix criteri tolerant que esAppInstallada
 * (src/data/oauthRelay.js): un matchMedia que llança no és cap senyal.
 * @param {Window} [finestra]
 * @param {Navigator} [navegador]
 * @returns {boolean}
 */
export function esFinestraDApp(finestra, navegador = finestra?.navigator) {
  for (const mode of MODES_D_APP) {
    try {
      if (finestra?.matchMedia?.(`(display-mode: ${mode})`)?.matches === true) return true;
    } catch { /* un matchMedia que llança no és cap senyal */ }
  }
  try { return navegador?.standalone === true; } catch { return false; }
}

/**
 * Per què NO s'ha d'oferir la instal·lació, o null si s'ha d'oferir.
 * Pura: rep la finestra i el navigator. Torna el primer motiu que s'aplica.
 */
export function motiuPerNoOferir({ finestra, navegador } = {}) {
  if (!finestra || typeof finestra.addEventListener !== 'function') return 'sense-finestra';
  // Safari, Firefox i jsdom no tenen l'esdeveniment.
  if (!('onbeforeinstallprompt' in finestra)) return 'sense-suport';
  if (finestra.isSecureContext !== true) return 'context-insegur';
  if (esIncrustada(finestra)) return 'incrustat';
  // Dins de l'app de Capacitor la instal·lació ja és la de la botiga.
  try {
    const capacitor = finestra.Capacitor;
    if (capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform() === true) return 'nativa';
  } catch { /* un pont natiu trencat no és l'app nativa */ }
  if (esFinestraDApp(finestra, navegador)) return 'instalada';
  // Només escriptori (ordre del Mestre): userAgentData és de Chromium, com l'esdeveniment.
  try {
    if (navegador?.userAgentData?.mobile === true) return 'mobil';
  } catch { /* sense dades de l'agent, no és cap senyal */ }
  return null;
}

/* Dins d'un iframe la pàgina és de l'amfitrió, no nostra. Un top que llança
   en llegir-lo és un iframe d'un altre origen. */
function esIncrustada(finestra) {
  try {
    return finestra.top !== finestra.self;
  } catch {
    return true;
  }
}

/* Android, també la tauleta i sense userAgentData (Firefox). Tolerant. */
function esAndroid(navegador) {
  try {
    if (navegador?.userAgentData?.platform === 'Android') return true;
    return /\bAndroid\b/.test(String(navegador?.userAgent || ''));
  } catch {
    return false;
  }
}

/* El resultat de l'elecció al diàleg natiu, o null si no és cap dels dos. */
function resultatDe(eleccio) {
  const resultat = eleccio && eleccio.outcome;
  return resultat === 'accepted' || resultat === 'dismissed' ? resultat : null;
}

/**
 * Un magatzem nou. Les set funcions són referències estables (les demana
 * useSyncExternalStore). Cap no llança.
 * @returns {{ captura: Function, subscriu: Function, pot: Function, demana: Function, ofereix: Function, motiuDeLaCaptura: Function, estaInstalada: Function }}
 */
export function creaInstalacio() {
  let esdeveniment = null;
  let anterior = null;
  // P1-69 · l'oferta guardada és del mòbil (sense preventDefault), el motiu de l'última captura i si s'ha instal·lat en esta càrrega.
  let delMobil = false;
  let darrerMotiu = 'sense-captura';
  let instalada = false;
  const escoltes = new Set();

  const avisa = () => {
    for (const escolta of [...escoltes]) {
      try {
        escolta();
      } catch { /* un subscriptor trencat no para els altres */ }
    }
  };

  /** Afig un subscriptor; torna la funció que el retira. */
  const subscriu = (escolta) => {
    if (typeof escolta !== 'function') return () => {};
    escoltes.add(escolta);
    return () => { escoltes.delete(escolta); };
  };

  /** Hi ha un esdeveniment guardat d'escriptori: la pastilla de la barra negra es pot mostrar. */
  const pot = () => esdeveniment !== null && !delMobil;

  /** P1-69 · Hi ha un esdeveniment guardat, d'escriptori o del mòbil: el botó de Descàrregues el pot obrir. */
  const ofereix = () => esdeveniment !== null;

  /** P1-69 · Per què l'última captura no escolta: null (escolta a escriptori), 'mobil' (escolta al mòbil), un altre motiu, o 'sense-captura'. */
  const motiuDeLaCaptura = () => darrerMotiu;

  /** P1-69 · S'ha instal·lat en esta càrrega, des de qualsevol pàgina: appinstalled o «accepted» al diàleg. */
  const estaInstalada = () => instalada;

  /**
   * Escolta «beforeinstallprompt» i «appinstalled» a `finestra`. Torna
   * { escolta: true, deixa() } o, si no s'ha d'oferir, { escolta: false, motiu }
   * sense registrar res. Una captura nova deixa l'anterior: mai dos parells.
   * P1-69 · Al mòbil ('mobil') també escolta, sense preventDefault. Android
   * és mòbil també a la tauleta. Safari dins d'un iframe queda 'incrustat'
   * per a motiuDeLaCaptura; el `motiu` que torna no canvia. Una captura és
   * una càrrega nova: oblida la instal·lació de l'anterior.
   */
  const captura = ({ finestra = globalThis.window, navegador = globalThis.navigator } = {}) => {
    const motiu = motiuPerNoOferir({ finestra, navegador });
    darrerMotiu = motiu === 'sense-suport' && esIncrustada(finestra) ? 'incrustat' : motiu;
    instalada = false;
    if (motiu && motiu !== 'mobil') return { escolta: false, motiu };
    if (anterior) anterior.deixa();
    const mobil = motiu === 'mobil' || (motiu === null && esAndroid(navegador));

    const enOferir = (e) => {
      if (!mobil) {
        try {
          e.preventDefault();
        } catch { /* un doble sense preventDefault també es guarda */ }
      }
      esdeveniment = e;
      delMobil = mobil;
      // El navegador la torna a oferir: ja no hi és (desinstal·lada amb la pàgina oberta).
      instalada = false;
      avisa();
    };
    // Instal·lada (pel botó, pel menú o per l'oferta pròpia del navegador): l'oferta ja no té sentit i el magatzem se'n recorda.
    const enInstalar = () => {
      if (esdeveniment === null && instalada) return;
      esdeveniment = null;
      instalada = true;
      avisa();
    };
    finestra.addEventListener('beforeinstallprompt', enOferir);
    finestra.addEventListener('appinstalled', enInstalar);

    const handle = {
      escolta: true,
      deixa() {
        try {
          finestra.removeEventListener('beforeinstallprompt', enOferir);
          finestra.removeEventListener('appinstalled', enInstalar);
        } catch { /* una finestra sense removeEventListener ja no escolta */ }
        if (anterior === handle) anterior = null;
      }
    };
    anterior = handle;
    return handle;
  };

  /**
   * Obri el diàleg natiu d'instal·lació. S'ha de cridar dins del clic, sense
   * cap await abans: prompt() necessita l'activació de l'usuari i ací es crida
   * de manera síncrona. L'esdeveniment és d'un sol ús: el magatzem el buida
   * abans de resoldre. Mai no llança; resol 'accepted', 'dismissed',
   * 'no-disponible' (cap esdeveniment) o 'error'.
   */
  const demana = () => {
    const e = esdeveniment;
    if (e === null) return Promise.resolve('no-disponible');
    esdeveniment = null;
    let resposta;
    let fallada = false;
    try {
      resposta = e.prompt();
    } catch {
      fallada = true;
    }
    avisa();
    if (fallada) return Promise.resolve('error');
    // Chrome nou resol prompt() amb l'elecció; l'antic, només userChoice.
    return Promise.resolve(resposta)
      .then((eleccio) => resultatDe(eleccio) || Promise.resolve(e.userChoice).then(resultatDe))
      .then((resultat) => {
        if (resultat === 'accepted' && !instalada) {
          instalada = true;
          avisa();
        }
        return resultat || 'error';
      })
      .catch(() => 'error');
  };

  return Object.freeze({ captura, subscriu, pot, demana, ofereix, motiuDeLaCaptura, estaInstalada });
}

/* El de la pàgina: l'únic que captura és src/main.jsx. El lligen useInstalacioApp (sense cap lector muntat durant la pausa de la beta) i, des de P1-69, InstalaLaPwa a /page/descarregues. */
export const INSTALACIO = creaInstalacio();
export const capturaInstalacio = INSTALACIO.captura;
