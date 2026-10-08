/**
 * carregadorDelPaquet.js — el costat CLÀSSIC del paquet trossejat
 * (protocol sdp.carregador.v1).
 *
 * Decisió 5 del Mestre (261007) · «Paquet WordPress de 4,4 MB: CODE SPLITTING
 * OBLIGATORI». Amb el format IIFE, Rollup força inlineDynamicImports: les
 * import() i els React.lazy viatjaven DINS de soc-de-poble.standalone.js i
 * s'avaluaven tots en carregar la pàgina. Ara eixe fitxer, amb el MATEIX nom
 * (marcatge.php i els amfitrions no canvien), és un carregador clàssic menut:
 * vite.standalone.config.js (codiDelCarregador) compila este fitxer en un IIFE
 * i hi afig una sola crida,
 *   instalaCarregador(window, document, document.currentScript, {…}, (url) => import(url))
 * que s'executa de manera síncrona mentre el navegador avalua l'script.
 *
 * Què fa, i en este ordre:
 *   1 · Guarda de doble càrrega: si la finestra ja té una propietat pròpia
 *       SocDePoble (l'API real, un altre provisional o el connector vell
 *       «soc-de-poble»), avisa i no carrega res. La mateixa semàntica que
 *       exposaGlobal (host.js).
 *   2 · La base del paquet: la carpeta de l'script que s'executa ara, sense
 *       consulta (el ?ver= de WordPress) ni fragment. Només val durant
 *       l'execució síncrona d'un script clàssic; en un mòdul, currentScript és
 *       null. D'ella ixen l'URL del mòdul d'entrada i la base de recursos
 *       (provisionalDelPaquet.js la passa a assetResolver).
 *   3 · Un SocDePoble PROVISIONAL, congelat i configurable, amb les mateixes
 *       claus que l'API real (CONTRACTE_AMFITRIO_V1.api.claus). El <script>
 *       que l'amfitrió posa DESPRÉS del paquet (LLEI 1, «Sessió»:
 *       `if (window.SocDePoble) { configura(…) }`) s'executa abans que arribe
 *       cap mòdul: sense el provisional, eixe `if` fallaria en silenci i la
 *       sessió de Sollutia no es configuraria. Cada crida s'encua en ordre i
 *       torna una promesa amb el resultat o l'error REALS; estat() respon de
 *       seguida; isReady val false i CONTRACTE_BACKEND undefined fins a
 *       l'adopció. Després, el mateix objecte reenvia cada crida de manera
 *       síncrona, per a qui n'haja guardat la referència.
 *   4 · import() del mòdul d'entrada amb l'URL ABSOLUTA new URL(modul, base),
 *       sense ?ver=: ha de coincidir exactament amb la que resolen els trossos
 *       relatius, o hi hauria dos mòduls d'entrada i dues Apps.
 *
 * No fa res més: no llig SocDePobleConfig ni SocDePobleCua, no definix
 * <soc-de-poble>, no segella, no fa fetch i no porta cap secret. Només toca el
 * DOM si l'import falla abans de l'adopció: llavors rebutja la cua i, amb el
 * DOM a punt, pinta en cada <soc-de-poble> el mateix bloc que arrencaAuto
 * (div.sdp-arranc-fallida amb h3, p i pre), amb textContent i mai innerHTML.
 * Relleu 261007 · també en els que l'amfitrió afig DESPRÉS de la fallada (un
 * MutationObserver, si la finestra en té): Sollutia i els amfitrions React o
 * Vue creen l'element quan munten la seua vista (canal elementApi).
 *
 * El mòdul d'entrada (embed.jsx) pren el control amb prenProvisional, exposa
 * l'API real (no configurable) i crida adopta(api), que reprodueix la cua. El
 * control porta també `url`, l'adreça exacta que s'ha demanat: el mòdul la
 * compara amb el seu import.meta.url per a delatar una redirecció
 * (provisionalDelPaquet.js, comprovaUrlDelModul).
 *
 * Fitxer PUR: cap import i cap referència directa a les globals del navegador
 * ni a import.meta; la finestra, el document i l'script arriben per paràmetre
 * (porta PURS de src/config/qualitat.amfitrio.test.js). Ha de passar el
 * Baseline 2022 (Safari 16, Chrome 100, Firefox 100): les promeses de la cua
 * es fan a mà.
 */

export const MARCA_DEL_CARREGADOR = 'sdp.carregador.v1';

const GLOBAL = 'SocDePoble';
const ELEMENT = 'soc-de-poble';
/* El mateix títol que el bloc de fallada d'arrencaAuto (host.js). */
const TITOL = "Error crític d'arrencada";
const FALLADA = 'Sóc de Poble no ha pogut carregar els seus mòduls.';

/* La carpeta de l'script clàssic que s'executa ara, amb barra final i sense
   consulta ni fragment; '' si no n'hi ha cap de vàlida: un script de mòdul,
   sense src, o blob: i data:, que no tenen carpeta (new URL hi peta). */
function baseDeLScript(script) {
  if (!script || typeof script.src !== 'string' || !script.src) return '';
  if (String(script.type || '').trim().toLowerCase() === 'module') return '';
  try {
    const base = new URL('./', script.src);
    return base.protocol === 'https:' || base.protocol === 'http:' ? base.href : '';
  } catch {
    return '';
  }
}

/* div.sdp-arranc-fallida > h3 + p + pre, com el d'arrencaAuto. */
function blocDeFallada(doc, text, detall) {
  const bloc = doc.createElement('div');
  bloc.className = 'sdp-arranc-fallida';
  for (const [etiqueta, contingut] of [['h3', TITOL], ['p', text], ['pre', detall]]) {
    const node = doc.createElement(etiqueta);
    node.textContent = contingut;
    bloc.append(node);
  }
  return bloc;
}

/**
 * Instal·la el SocDePoble provisional i demana el mòdul d'entrada.
 *
 * @param {object} finestra       La finestra de la pàgina.
 * @param {object} doc            El seu document.
 * @param {object|null} script    document.currentScript, llegit de manera síncrona.
 * @param {{modul: string, claus: string[], fitxer: string}} opcions
 *   modul: el camí de l'entrada ESM respecte de la base (trossos/soc-de-poble-<hash>.js);
 *   claus: CONTRACTE_AMFITRIO_V1.api.claus; fitxer: el nom esperat del carregador.
 * @param {(url: string) => Promise<unknown>} importa  (url) => import(url).
 * @returns {object|null} El provisional, o null si la pàgina ja en tenia un.
 */
export function instalaCarregador(finestra, doc, script, { modul, claus, fitxer }, importa) {
  if (Object.prototype.hasOwnProperty.call(finestra, GLOBAL)) {
    console.warn(`[sdp-carregador] ${GLOBAL} ja existix en esta pàgina (un altre paquet o el connector antic «soc-de-poble»): este no es carrega.`);
    return null;
  }
  const base = baseDeLScript(script);
  const url = base ? new URL(modul, base).href : '';
  const cua = [];
  let api = null;
  let error = null;

  const rebutja = (motiu) => {
    error = motiu;
    for (const pendent of cua.splice(0)) pendent.reject(motiu);
  };

  /* Abans de l'adopció, s'encua; després, es reenvia tal qual (síncron). */
  const crida = (verb, args) => {
    if (api) return api[verb](...args);
    if (error) return Promise.reject(error);
    return new Promise((resolve, reject) => { cua.push({ verb, args, resolve, reject }); });
  };

  /* Una sola vegada, i només amb l'API real: la propietat vigent de la
     finestra, no configurable (exposaGlobal). Cap altre script la falsifica. */
  function adopta(real) {
    const vigent = Object.getOwnPropertyDescriptor(finestra, GLOBAL);
    if (api || error || !real || !vigent || vigent.configurable || vigent.value !== real) return false;
    api = real;
    for (const { verb, args, resolve, reject } of cua.splice(0)) {
      try { resolve(real[verb](...args)); } catch (motiu) { reject(motiu); }
    }
    return true;
  }

  /* Mai una pantalla blanca muda: el motiu va a la consola, a cada promesa
     encuada i a cada <soc-de-poble>, amb la pista que toque. */
  function falla(motiu) {
    if (api) {
      console.error('[sdp-carregador] El paquet ha fallat després de prendre el control:', motiu);
      return;
    }
    if (error) return;
    let text = FALLADA;
    if (!base) {
      text += ' El paquet ha d\'anar en un <script src> clàssic, sense type="module".';
    } else {
      const origen = new URL(base).origin;
      if (finestra.location && origen !== finestra.location.origin) {
        text += ` Els mòduls vénen d'un altre origen (${origen}): eixe servidor ha d'enviar Access-Control-Allow-Origin.`;
      }
      if (new URL(script.src).pathname.split('/').pop() !== fitxer) {
        text += ` L'script no es diu ${fitxer}: un optimitzador l'ha combinat o reanomenat; exclou-lo.`;
      }
    }
    rebutja(new Error(text));
    console.error(`[sdp-carregador] ${text}`, motiu);
    const detall = `${motiu && motiu.message ? motiu.message : motiu}${url ? `\n${url}` : ''}`;
    const pintaEn = (element) => element.replaceChildren(blocDeFallada(doc, text, detall));
    /* Relleu 261007 · els que hi ha ara i els que l'amfitrió afija després:
       sense l'observador, un <soc-de-poble> creat per una SPA quedaria en
       blanc i el motiu només aniria a la consola. El bloc que s'hi pinta no és
       cap <soc-de-poble>: l'observador no es realimenta. */
    const pinta = () => {
      for (const element of doc.querySelectorAll(ELEMENT)) pintaEn(element);
      if (typeof finestra.MutationObserver !== 'function') return;
      new finestra.MutationObserver((canvis) => {
        for (const { addedNodes } of canvis) {
          for (const node of addedNodes) {
            if (node.nodeType !== 1) continue;
            if (node.localName === ELEMENT) pintaEn(node);
            for (const element of node.querySelectorAll(ELEMENT)) pintaEn(element);
          }
        }
      }).observe(doc.documentElement, { childList: true, subtree: true });
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', pinta, { once: true });
    else pinta();
  }

  /* Les mateixes claus i el mateix ordre que l'API real: Object.keys hi coincidix. */
  const provisional = {};
  for (const clau of claus) {
    if (clau === 'isReady' || clau === 'CONTRACTE_BACKEND') {
      Object.defineProperty(provisional, clau, {
        enumerable: true,
        get: () => (api ? api[clau] : clau === 'isReady' ? false : undefined)
      });
    } else if (clau === 'estat') {
      provisional.estat = (...args) => (api ? api.estat(...args) : { fase: error ? 'fallida' : 'carregant', configurable: !error });
    } else {
      provisional[clau] = (...args) => crida(clau, args);
    }
  }
  Object.defineProperty(provisional, Symbol.for(MARCA_DEL_CARREGADOR), { value: Object.freeze({ base, url, adopta }) });
  /* El nom en literal: la segona i última escriptura del global a src/, al
     costat d'exposaGlobal (host.js). tractor-enxufe E4 no la veu perquè el
     destí és un paràmetre; la declara qualitat.amfitrio.test.js. Configurable
     perquè el mòdul la puga substituir per l'API real, que ja no ho és. */
  Object.defineProperty(finestra, 'SocDePoble', { value: Object.freeze(provisional), configurable: true, writable: false, enumerable: false });

  if (!base) {
    falla(new Error('El paquet no sap on viu: currentScript no és un script clàssic amb src http(s).'));
  } else {
    /* Ara mateix, sense esperar el DOM: la xarxa va en paral·lel amb l'anàlisi
       de la pàgina. Un import() que peta de manera síncrona també és una fallada. */
    let peticio;
    try { peticio = importa(url); } catch (motiu) { peticio = Promise.reject(motiu); }
    peticio.then(() => {
      if (api || error) return;
      rebutja(new Error(`${FALLADA} El mòdul s'ha avaluat sense prendre el control.`));
      console.error(`[sdp-carregador] ${error.message}`);
    }, falla);
  }
  return provisional;
}
