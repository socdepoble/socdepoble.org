import { useEffect, useState } from 'react';

/**
 * useBarresAmbScroll — les barres acompanyen el scroll en compacte.
 *
 * Ordre del Mestre (261012, vespre): «L'acumulació de barres superiors i el
 * footer lleven massa espai de lectura. Fes que les barres acompanyen
 * l'scroll (que s'oculten al baixar) per alliberar el 100% de la pantalla per
 * a l'ERP.» I «Afig un botó suau de "Tornar a dalt" (Scroll to top) a la part
 * inferior dreta (damunt de 'Pobles')».
 *
 * Contracte de DOM (la presentació viu a layout.css, «Barres que acompanyen
 * el scroll»):
 *   arrel[data-sdp-barres] = (absent) | dalt | totes
 *     · absent: les barres es veuen. En repòs i en escriptori no hi és mai.
 *     · dalt: amaga la blava i la taronja (i hi pugen les peces enganxades).
 *     · totes: també la barra inferior, quan el desplaçador arriba fins a baix.
 * L'atribut s'escriu al DOM sense setState, com el gest de recarregar
 * (usePullToRefresh) i data-sdp-estret: un scroll no repinta la closca. La
 * barra negra no s'amaga mai (Fase de poliment del Mestre, 261007).
 *
 * Qui fa scroll canvia segons la pantalla (el visor general, una pàgina
 * «contingut», una columna de la graella), i l'esdeveniment scroll no
 * bombolleja ni travessa l'arrel ombra (<soc-de-poble>): s'escolta en fase
 * de captura sobre l'arrel de l'app, mai a window. Compta el desplaçador
 * vertical dins del <main> que fa almenys mitja alçada del <main>; fora: els
 * diàlegs, la conversa del Xat i l'àrea única (el TPV), que porten el
 * compositor o la barra d'accions damunt de la reserva. El primer scroll
 * d'un desplaçador només en pren la posició: pot ser horitzontal (una taula
 * o un carrusel alts) i no diu cap direcció.
 *
 * Les barres no s'amaguen (i tornen si ja ho estaven):
 *   · prop de dalt (dues alçades de barra) i al final del recorregut;
 *   · amb el focus de teclat (:focus-visible) dins d'una barra (WCAG 2.4.11);
 *     abans del focusin el navegador ja ha centrat la barra que el
 *     desplaçador retallava, i la posició d'abans es restaura;
 *   · amb un diàleg obert o l'Índex de la pàgina;
 *   · amb un menú obert en una barra ([aria-expanded="true"]): Safari i iOS
 *     no donen el focus a un botó en tocar-lo;
 *   · en canviar de ruta (clauRuta), que reinicia l'estat.
 * Amb un peu ancorat a baix dins del <main> (CLASSES_PEU_ANCORAT), la barra
 * inferior no se'n va mai («dalt», mai «totes»): el peu en reserva l'alçada.
 *
 * Torna un controlador estable per al botó «Tornar a dalt»: { subscriu,
 * potPujar, pujaADalt }, per a useSyncExternalStore. potPujar és cert quan
 * les barres es veuen i el desplaçador actiu ha baixat més d'una pantalla,
 * fora del final del recorregut (on ja no es pot baixar més per a traure el
 * contingut de davall del botó) i sense cap peu ancorat (el botó cauria
 * damunt de «Desar autoria» o del compositor); només avisa quan canvia. La
 * posició viu en memòria (WeakMap): res a localStorage ni a sessionStorage.
 *
 * Bloc 3.10 (pla 261016_1530) · Fora del compacte també s'activa en una
 * tauleta tàctil (l'iPad en horitzontal passa de 1023px) i en una caixa
 * baixa (useArrelTactil i esPantallaCurta, que App.jsx marca a l'arrel). Allà
 * (compacte=false) no hi ha barra inferior ni botó: només «dalt», potPujar
 * sempre fals, i una columna de la graella només compta si conté totes les
 * peces que l'atribut mouria (lesConteTotes): el scroll d'una llista no amaga
 * les barres del document del costat. En compacte, res d'açò canvia.
 */

export const ATRIBUT_BARRES = 'data-sdp-barres';
export const BARRES_DALT = 'dalt';
export const BARRES_TOTES = 'totes';

/* Les barres que s'amaguen i les peces que hi pugen (més el botó). */
export const SELECTOR_BARRES = [
  'header.bar-blue', 'section.bar-orange', 'nav.mobile-nav',
  '.sdp-editor-eines', '.sdp-cal-setmana__capcal', '.sdp-tornar-dalt'
].join(', ');
/* Desplaçadors que no mouen les barres. */
export const SELECTOR_SENSE_AUTOAMAGAT = 'dialog, [role="dialog"], .sdp-xat-conversa, .sdp-app-unica';
/* Superposicions que les retenen a la vista. */
export const SELECTOR_SUPERPOSICIO = 'dialog[open], .toc-overlay';
/* Les pàgines «contingut» filles del visor: layout.css les estira fins a
   baix amb «totes», així que arriben a la vora encara que en repòs no hi
   arriben. El mateix selector que el full. */
export const SELECTOR_ESTIRABLE = '.app-main__content > .sdp-universal-page-container--contained';
/* Fracció de l'alçada del <main> per davall de la qual un desplaçador és
   intern (una taula, un camp, una llista dins de la pàgina) i no compta. */
export const FRACCIO_VISOR = 0.5;
/* Peus ancorats a la vora de baix que reserven l'alçada de la barra inferior
   (modules.css): el de «Desar autoria», el compositor del Xat (també amb
   l'avís o la selecció) i el de la fitxa de comunitat. La reserva queda buida
   si la barra se'n va, i el botó hi cauria damunt. Els espècimens del
   catàleg van en marcs (.sdp-especimen) i no compten. */
export const CLASSES_PEU_ANCORAT = Object.freeze(['sdp-drets__peu', 'sdp-xat-compositor', 'sdp-xat-fitxa-comunitat__peu']);
const SELECTOR_ESPECIMEN = '.sdp-especimen';

const SELECTOR_MENU_OBERT = SELECTOR_BARRES.split(', ').map((barra) => `${barra} [aria-expanded="true"]`).join(', ');
const SELECTOR_DIALEG = 'dialog, [role="dialog"]';

/* Bloc 3.10 · Les marques de l'arrel fora del compacte. Les escriu App.jsx i
   layout.css («Barres que acompanyen el scroll») hi penja les transicions i
   els estats amagats de la blava, la taronja i les peces enganxades. */
export const ATRIBUT_TACTIL = 'data-sdp-tactil';
export const ATRIBUT_CURTA = 'data-sdp-curta';
/* El punter principal és un dit i no passa per damunt: la tauleta, no el
   portàtil amb pantalla tàctil i ratolí. Avalua el dispositiu, no la caixa:
   també encastat a WordPress. */
export const CONSULTA_TACTIL = '(hover: none) and (pointer: coarse)';
/* El tall de «pantalla curta» que ja fa servir modules.css (Correcció C20,
   `(max-height: 760px)`), aplicat a l'alçada de la caixa de l'app. */
export const ALCADA_MAXIMA_CURTA = 760;

/** Cert si una caixa amb esta alçada (px) és curta. Sense mesura (0), no. */
export function esPantallaCurta(alcada) {
  return alcada > 0 && alcada <= ALCADA_MAXIMA_CURTA;
}

/* Les peces que l'atribut mou (layout.css). Les de pàgina només quan són
   filles directes de .sdp-universal-page-container, com al full. Les d'un
   espècimen, d'un diàleg o d'un node ocult no es veuen moure's. */
const CLASSES_PECES_DE_PAGINA = Object.freeze(['bar-blue', 'bar-orange']);
const CLASSES_PECES_ENGANXADES = Object.freeze(['sdp-editor-eines', 'sdp-cal-setmana__capcal']);
const SELECTOR_PECA_QUIETA = `${SELECTOR_ESPECIMEN}, ${SELECTOR_DIALEG}, [hidden]`;

export const ESTAT_INICIAL = Object.freeze({ amagades: false, pos: 0, acumulat: 0 });

/**
 * La histèresi, pura. `previ` és { amagades, pos, acumulat } i la mesura,
 * { pos, max, llindar, cim }. La posició es retalla a [0, max] (el rebot
 * d'iOS). Prop de dalt (pos ≤ cim) i al final del recorregut (pos ≥ max −
 * llindar) les barres es veuen; entremig, s'amaguen quan el moviment
 * acumulat cap avall arriba al llindar i tornen quan l'acumulat cap amunt hi
 * arriba. Canviar de direcció torna a començar el compte.
 */
export function seguentEstat(previ, { pos, max, llindar, cim }) {
  const limit = Math.max(0, max);
  const ara = Math.min(Math.max(pos, 0), limit);
  const delta = ara - previ.pos;
  const acumulat = delta === 0
    ? previ.acumulat
    : (Math.sign(delta) === Math.sign(previ.acumulat) ? previ.acumulat + delta : delta);
  if (ara <= cim || ara >= limit - llindar) return { amagades: false, pos: ara, acumulat };
  if (acumulat >= llindar) return { amagades: true, pos: ara, acumulat };
  if (acumulat <= -llindar) return { amagades: false, pos: ara, acumulat };
  return { amagades: previ.amagades, pos: ara, acumulat };
}

/* Un desplaçador invertit (flex column-reverse) té el cim a −recorregut, no
   a 0 (el mateix criteri que usePullToRefresh). */
function esInvers(element, vista) {
  const estil = vista.getComputedStyle(element);
  return estil.flexDirection === 'column-reverse' && String(estil.display).includes('flex');
}

/* El focus de teclat. Un toc o un clic no l'encenen: no reté les barres. Si
   el navegador no coneix :focus-visible, compta qualsevol focus. */
function esFocusVisible(element) {
  try {
    return element.matches(':focus-visible');
  } catch {
    return true;
  }
}

/* L'store del botó: només avisa quan canvia el booleà. */
function creaMagatzem() {
  const oients = new Set();
  let potPujar = false;
  let accio = null;
  const publica = Object.freeze({
    subscriu: (oient) => {
      oients.add(oient);
      return () => { oients.delete(oient); };
    },
    potPujar: () => potPujar,
    pujaADalt: () => { accio?.(); }
  });
  return {
    publica,
    posa(valor) {
      if (valor === potPujar) return;
      potPujar = valor;
      for (const oient of [...oients]) oient();
    },
    enllaca(nova) { accio = nova; }
  };
}

export function useBarresAmbScroll({ arrelRef, visorRef, actiu, clauRuta, compacte = true }) {
  const [magatzem] = useState(creaMagatzem);

  /* clauRuta: en canviar de ruta l'efecte es desfà i torna a començar, amb
     les barres a la vista i les posicions oblidades. compacte també: passar
     de la tauleta al compacte (o al revés) reinicia l'estat i el botó. */
  useEffect(() => {
    const arrel = arrelRef.current;
    const visor = visorRef.current;
    if (!actiu || !arrel || !visor) return undefined;

    const vista = arrel.ownerDocument?.defaultView || window;
    const demanaMarc = vista.requestAnimationFrame
      ? (fn) => vista.requestAnimationFrame(fn)
      : (fn) => vista.setTimeout(fn, 16);
    const cancelaMarc = vista.cancelAnimationFrame
      ? (id) => vista.cancelAnimationFrame(id)
      : (id) => vista.clearTimeout(id);
    /* El document o l'arrel ombra on viu l'app: el seu activeElement i les
       seues superposicions (l'Índex va al body a socdepoble.org). */
    const arrelDelNode = () => arrel.getRootNode?.() || arrel.ownerDocument;

    const registres = new WeakMap(); // element → { pos, invers, fons }
    const pendents = new Set();
    let estat = ESTAT_INICIAL;
    let actual = null;
    let marc = null;
    let programat = false;
    let escrit = null;
    let mesures = null;

    /* Els tokens, una vegada per activació i només primitius en px
       (--sdp-alt-barres és un calc() que getPropertyValue no resol). Sense
       ells (el full encara no hi és) no s'amaga res. */
    const mesura = () => {
      if (mesures) return mesures;
      const estil = vista.getComputedStyle(arrel);
      const llindar = parseFloat(estil.getPropertyValue('--sdp-space-6'));
      const altBarra = parseFloat(estil.getPropertyValue('--sdp-alt-accio'));
      if (!(llindar > 0) || !(altBarra > 0)) return null;
      mesures = { llindar, cim: altBarra * 2 };
      return mesures;
    };

    const escriu = (valor) => {
      if (valor === escrit) return;
      escrit = valor;
      if (valor) arrel.setAttribute(ATRIBUT_BARRES, valor);
      else arrel.removeAttribute(ATRIBUT_BARRES);
    };

    const retingudes = () => {
      const node = arrelDelNode();
      const enfocat = node.activeElement;
      if (enfocat && arrel.contains(enfocat) && enfocat.closest(SELECTOR_BARRES) && esFocusVisible(enfocat)) return true;
      if (node.querySelector?.(SELECTOR_SUPERPOSICIO)) return true;
      return Boolean(arrel.querySelector(SELECTOR_MENU_OBERT));
    };

    /* Si el desplaçador arriba fins a la vora de baix de l'arrel, la barra
       inferior també se'n va; si no, la seua reserva quedaria buida. */
    const arribaAlFons = (element, registre) => {
      if (registre.fons === null) {
        registre.fons = element.matches(SELECTOR_ESTIRABLE)
          || element.getBoundingClientRect().bottom >= arrel.getBoundingClientRect().bottom - 1;
      }
      return registre.fons;
    };

    /* Col·leccions vives: el navegador les manté al dia i llegir-les en
       cada fotograma no recorre el <main>. */
    const peus = CLASSES_PEU_ANCORAT.map((classe) => visor.getElementsByClassName(classe));
    const hiHaPeuAncorat = () => peus.some((llista) => Array.prototype.some.call(llista, (peu) => !peu.closest(SELECTOR_ESPECIMEN)));

    /* Bloc 3.10 · Fora del compacte (tauleta horitzontal, pantalla curta) la
       graella pot portar columnes que fan scroll cadascuna, i l'atribut mou
       les barres de totes les pàgines de l'arrel (FRACCIO_VISOR compara
       alçades: una columna sencera hi passa). Un desplaçador només compta si
       conté totes les peces que es mourien. Col·leccions vives de l'arrel,
       el mateix abast que el full: poques peces i cap recorregut del DOM. */
    const peces = [...CLASSES_PECES_DE_PAGINA, ...CLASSES_PECES_ENGANXADES]
      .map((classe) => arrel.getElementsByClassName(classe));
    const esMou = (peca) => !peca.closest(SELECTOR_PECA_QUIETA)
      && (!CLASSES_PECES_DE_PAGINA.some((classe) => peca.classList.contains(classe))
        || peca.parentElement?.classList.contains('sdp-universal-page-container') === true);
    const lesConteTotes = (element) => peces.every((llista) => Array.prototype.every.call(llista,
      (peca) => element.contains(peca) || !esMou(peca)));
    const contePeca = (element) => peces.some((llista) => Array.prototype.some.call(llista,
      (peca) => element.contains(peca) && esMou(peca)));

    /* El botó: més d'una pantalla avall, fora del final del recorregut (on
       ja no es pot baixar més per a traure el que queda davall del botó) i
       sense cap peu ancorat a baix. Les barres, les mira qui crida. Fora del
       compacte no n'hi ha: el seu lloc fix és damunt de «Pobles». */
    const potPujar = (element, pos) => {
      if (!compacte) return false;
      const m = mesura();
      const alcada = element.clientHeight;
      const max = Math.max(0, element.scrollHeight - alcada);
      return Boolean(m) && pos > alcada && pos < max - m.llindar && !hiHaPeuAncorat();
    };

    const processa = (element) => {
      if (!element.isConnected || !visor.contains(element) || element.closest(SELECTOR_SENSE_AUTOAMAGAT)) return;
      const alcada = element.clientHeight;
      if (alcada < visor.clientHeight * FRACCIO_VISOR) return;
      /* Un desplaçador que no les conté totes no les amaga. Si és una
         columna amb peces pròpies i ja estaven amagades per una altra, les
         torna: si no, les seues també s'amagarien en baixar-la. Un carrusel
         o una taula de dins de la pàgina, sense cap peça, no les torna. */
      if (!compacte && !lesConteTotes(element)) {
        if (escrit != null && contePeca(element)) {
          estat = { ...estat, amagades: false, acumulat: 0 };
          escriu(null);
        }
        return;
      }
      const m = mesura();
      if (!m) return;
      let registre = registres.get(element);
      if (!registre) {
        registre = { pos: null, invers: esInvers(element, vista), fons: null };
        registres.set(element, registre);
      }
      const max = Math.max(0, element.scrollHeight - alcada);
      const cru = registre.invers ? element.scrollTop + max : element.scrollTop;
      const pos = Math.min(Math.max(cru, 0), max);
      /* El primer scroll d'un desplaçador només en pren la posició: pot ser
         horitzontal (una taula o un carrusel alts, sense recorregut vertical)
         i no diu cap direcció. Ni les barres ni el botó en canvien. */
      if (registre.pos === null) {
        registre.pos = pos;
        return;
      }
      // Un scroll horitzontal no mou la posició vertical: no compta.
      if (registre.pos === pos) return;
      const previ = element === actual
        ? estat
        : { amagades: estat.amagades, pos: registre.pos, acumulat: 0 };
      registre.pos = pos;
      actual = element;
      estat = seguentEstat(previ, { pos, max, llindar: m.llindar, cim: m.cim });
      if (estat.amagades && retingudes()) estat = { ...estat, amagades: false, acumulat: 0 };
      // Fora del compacte no hi ha barra inferior: mai «totes».
      escriu(estat.amagades
        ? (compacte && arribaAlFons(element, registre) && !hiHaPeuAncorat() ? BARRES_TOTES : BARRES_DALT)
        : null);
      magatzem.posa(!estat.amagades && potPujar(element, pos));
    };

    const buida = () => {
      programat = false;
      marc = null;
      const llista = [...pendents];
      pendents.clear();
      for (const element of llista) processa(element);
    };

    /* Un fotograma per a tots els scrolls d'entremig. `programat` i no l'id:
       un marc que corre en el mateix moment (un rAF síncron) no deixa un id
       penjat que ja no es buidaria mai. */
    const enScroll = (e) => {
      const element = e.target;
      if (!element || element.nodeType !== 1) return;
      pendents.add(element);
      if (programat) return;
      programat = true;
      const id = demanaMarc(buida);
      if (programat) marc = id;
    };

    /* Les barres tornen quan el focus de teclat hi entra o quan s'obri un
       diàleg (el focus hi passa a dins).
       Abans del focusin, el navegador ja ha portat a la vista la barra
       enganxada que el desplaçador retallava: la centra i el contingut puja
       mig visor (Chrome, amb Tab i amb focus(); provat el 261012). El
       registre encara guarda la posició d'abans, perquè l'esdeveniment
       scroll arriba després: es torna a posar, la barra torna sola i
       processa descarta eixe scroll (la posició no ha canviat). */
    const enFocus = (e) => {
      if (escrit == null) return;
      const element = e.target;
      if (!element || element.nodeType !== 1) return;
      const aLaBarra = element.closest(SELECTOR_BARRES) && esFocusVisible(element);
      if (!aLaBarra && !element.closest(SELECTOR_DIALEG)) return;
      const registre = actual ? registres.get(actual) : null;
      if (aLaBarra && registre && registre.pos != null && actual.isConnected && actual.contains(element)) {
        const max = Math.max(0, actual.scrollHeight - actual.clientHeight);
        const cru = registre.invers ? registre.pos - max : registre.pos;
        if (actual.scrollTop !== cru) actual.scrollTop = cru;
      }
      estat = { ...estat, amagades: false, acumulat: 0 };
      escriu(null);
      if (actual) magatzem.posa(potPujar(actual, registre?.pos ?? 0));
    };

    /* El clic del botó: el desplaçador actiu torna a dalt (instantani amb
       moviment reduït) i el focus passa al <main>, el mateix destí que en
       canviar de ruta: el botó desapareix i el focus no cau al body. */
    magatzem.enllaca(() => {
      const element = actual;
      if (element?.isConnected) {
        const cim = registres.get(element)?.invers ? -Math.max(0, element.scrollHeight - element.clientHeight) : 0;
        const reduida = typeof vista.matchMedia === 'function'
          && vista.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (typeof element.scrollTo === 'function') element.scrollTo({ top: cim, behavior: reduida ? 'auto' : 'smooth' });
        else element.scrollTop = cim;
      }
      visor.focus?.({ preventScroll: true });
    });

    arrel.addEventListener('scroll', enScroll, { capture: true, passive: true });
    arrel.addEventListener('focusin', enFocus);

    return () => {
      arrel.removeEventListener('scroll', enScroll, { capture: true });
      arrel.removeEventListener('focusin', enFocus);
      if (programat && marc != null) cancelaMarc(marc);
      programat = false;
      pendents.clear();
      arrel.removeAttribute(ATRIBUT_BARRES);
      magatzem.enllaca(null);
      magatzem.posa(false);
    };
  }, [arrelRef, visorRef, actiu, clauRuta, compacte, magatzem]);

  return magatzem.publica;
}

/* La consulta tàctil, si l'entorn en té (jsdom no porta matchMedia; el
   mateix patró que theme.js · sistemaDemanaContrast). */
function consultaTactil(vista) {
  if (!vista || typeof vista.matchMedia !== 'function') return null;
  try {
    return vista.matchMedia(CONSULTA_TACTIL) || null;
  } catch {
    return null;
  }
}

/**
 * useArrelTactil — Bloc 3.10 · cert quan el dispositiu és una tauleta o un
 * mòbil (CONSULTA_TACTIL), i ho marca a l'arrel (data-sdp-tactil) perquè el
 * full hi penge les transicions de les barres. Escolta `change` (un iPad que
 * connecta o desconnecta el ratolí); Safari < 14 només té addListener. Sense
 * matchMedia, fals i cap atribut. En desmuntar, l'atribut se'n va.
 */
export function useArrelTactil(arrelRef) {
  const [tactil, setTactil] = useState(() => consultaTactil(typeof window === 'undefined' ? null : window)?.matches === true);

  useEffect(() => {
    const arrel = arrelRef.current;
    if (!arrel) return undefined;
    const vista = arrel.ownerDocument?.defaultView || (typeof window === 'undefined' ? null : window);
    const consulta = consultaTactil(vista);
    const aplica = () => {
      const ara = consulta?.matches === true;
      arrel.toggleAttribute(ATRIBUT_TACTIL, ara);
      setTactil(ara);
    };
    aplica();
    let deixa = () => {};
    if (consulta && typeof consulta.addEventListener === 'function') {
      consulta.addEventListener('change', aplica);
      deixa = () => consulta.removeEventListener('change', aplica);
    } else if (consulta && typeof consulta.addListener === 'function') {
      consulta.addListener(aplica);
      deixa = () => consulta.removeListener(aplica);
    }
    return () => {
      deixa();
      arrel.removeAttribute(ATRIBUT_TACTIL);
    };
  }, [arrelRef]);

  return tactil;
}
