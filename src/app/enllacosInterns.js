/**
 * Interceptor universal d'enllaços interns (enxufe, 260929).
 *
 * L'app pinta <a href> que no són <Link> del router: l'HTML de la Wiki de
 * Poble (parseMarkdown + sanitizeHtml, `?item=…`), articles com el de l'Aplec
 * (`/events/…`) o el cos de les connexions (`/mercat/…`). Incrustada en
 * memòria (qualsevol amfitrió sense base declarada: WordPress, Sollutia,
 * MediaWiki…), el clic natiu en eixos enllaços navegaria LA PÀGINA DE
 * L'AMFITRIÓ. L'arrel d'AppShell escolta el clic i, si l'enllaç és intern,
 * el passa al router.
 *
 * Només quan l'app NO és ama d'una URL d'arrel neta: router en memòria, o de
 * navegador amb una base declarada. A socdepoble.org (navegador sense base,
 * el #root de main.jsx) AppShell no munta l'interceptor: el clic fa la
 * recàrrega de sempre i el document nou apareix des de dalt (Llei del Píxel).
 *
 * Com que una navegació de router no carrega cap document, la vista es
 * recoloca a mà (preparaRecolocacio): el desplaçador de l'enllaç torna a
 * dalt, o, si el destí porta #fragment, l'element amb eixe id es porta a la
 * vista, que és el que faria el navegador amb un document nou.
 *
 * Intern vol dir la consulta de la ruta actual ('?…') o un camí de l'app
 * ('/…'), mai '//host' ni '/\host' (el navegador en fa un altre origen).
 * Tota la resta conserva el comportament natiu: enllaços externs, mailto:,
 * àncores (#…), clics amb modificadors o amb un altre botó, target distint de
 * _self, download, un clic que algú ja ha atés (un <Link> fa preventDefault),
 * el contingut editable (l'editor no segueix enllaços) i els recursos
 * estàtics (/assets/…), que són fitxers i no rutes de l'app.
 *
 * Amb una base declarada (router de navegador sota '/comunitat'), el
 * contingut de l'app escriu les rutes SENSE la base ('/events/…', '/mercat/…'):
 * són rutes de l'app i el router hi posa la base una sola vegada. Si un
 * enllaç ja porta la base ('/comunitat/xat'), se li lleva abans perquè no
 * esdevinga '/comunitat/comunitat/xat'. Un enllaç a una pàgina de l'amfitrió
 * és una URL completa (https://…) i la segueix el navegador. '?…' no porta
 * camí i es passa tal qual.
 */
import { normalitzaBase, resolRuta, treuBase } from './contexts/politicaRouter.js';

// Valors de `target` que obrin al mateix context de navegació.
const TARGET_PROPI = Object.freeze(new Set(['', '_self']));
// Fitxers servits tal qual (public/ i el paquet de l'enxufe): cap ruta de l'app hi comença.
const RECURSOS_ESTATICS = '/assets/';
const EDITABLE = '[contenteditable]:not([contenteditable="false"])';
// Origen fictici per a partir un href en camí, consulta i fragment sense tocar la xarxa.
const ORIGEN_FICTICI = 'http://x.invalid';

function esEditable(ancora) {
  if (ancora.isContentEditable === true) return true;
  try { return Boolean(ancora.closest?.(EDITABLE)); } catch { return false; }
}

function esHrefIntern(href) {
  if (href.startsWith('?')) return true;
  return href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/\\');
}

/**
 * Ruta de l'app d'un camí absolut quan hi ha base: sense la base si ja la
 * porta, i tal qual si no (és una ruta de l'app escrita sense base). El camí
 * es normalitza com el resol el parser d'URL (segments de punts, %2e).
 */
function rutaDeLApp(href, base) {
  let url;
  try { url = new URL(href, ORIGEN_FICTICI); } catch { return null; }
  const ruta = treuBase(url.pathname, base) ?? url.pathname;
  return ruta + url.search + url.hash;
}

/**
 * El destí per al router si el clic s'ha de passar a l'app; `null` si el
 * navegador l'ha d'atendre com sempre. Sense base és l'href CRU de l'enllaç
 * (getAttribute, no la propietat resolta); amb `basename` (el del router), un
 * camí absolut perd la base si la porta i, si no, arriba com a ruta de l'app.
 * Funció pura: no navega ni cancel·la res.
 */
export function hrefInternDeClic(event, ancora, basename = '') {
  if (!event || !ancora || typeof ancora.getAttribute !== 'function') return null;
  if (event.button !== 0) return null;
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return null;
  if (event.defaultPrevented) return null;
  if (ancora.hasAttribute('download')) return null;
  const target = (ancora.getAttribute('target') || '').trim().toLowerCase();
  if (!TARGET_PROPI.has(target)) return null;
  const href = ancora.getAttribute('href');
  if (typeof href !== 'string' || !esHrefIntern(href)) return null;
  if (href.startsWith(RECURSOS_ESTATICS)) return null;
  // El parser d'URL lleva tabuladors i salts de línia: '/' + TAB + '/host' també ix de l'origen.
  if (resolRuta(href) === null) return null;
  if (esEditable(ancora)) return null;
  const base = normalitzaBase(basename);
  if (!base || href.startsWith('?')) return href;
  const ruta = rutaDeLApp(href, base);
  if (ruta === null || ruta.startsWith(RECURSOS_ESTATICS)) return null;
  return ruta;
}

/**
 * L'<a> on ha caigut el clic. Es busca a composedPath(), que travessa el
 * shadow root de <soc-de-poble> sense perdre el node real; la cerca para a
 * `arrel` (l'arrel de l'app): un <a> de l'amfitrió que embolcalle l'element no
 * és nostre. Si el camí no està disponible (esdeveniment ja despatxat), es
 * recorre a event.target.closest('a').
 */
export function ancoraDelClic(event, arrel = null) {
  if (!event) return null;
  const cami = typeof event.composedPath === 'function' ? event.composedPath() : [];
  if (cami.length) {
    for (const node of cami) {
      if (node === arrel) return null;
      if (node && node.tagName === 'A') return node;
    }
    return null;
  }
  const ancora = event.target?.closest?.('a') ?? null;
  if (ancora && arrel && !arrel.contains(ancora)) return null;
  return ancora;
}

/* ── Recol·locació de la vista després de navegar ────────────────────────── */

// Valors d'overflow-y amb què un element fa de desplaçador ('overlay' és l'àlies antic de WebKit per a auto).
const OVERFLOW_DESPLACA = Object.freeze(new Set(['auto', 'scroll', 'overlay']));
// Tipus de node: element i fragment de document (el ShadowRoot n'és un).
const NODE_ELEMENT = 1;
const NODE_FRAGMENT = 11;

function esDesplacador(node) {
  if (!node || node.nodeType !== NODE_ELEMENT) return false;
  let overflowY = '';
  try {
    const vista = node.ownerDocument?.defaultView;
    overflowY = vista ? vista.getComputedStyle(node).getPropertyValue('overflow-y').trim() : '';
  } catch { return false; }
  return OVERFLOW_DESPLACA.has(overflowY) && node.scrollHeight > node.clientHeight;
}

/* Els ascendents d'un node pel pare, travessant els shadow roots cap al seu
   host: el camí que faria composedPath() si ja no es pot llegir. */
function ascendentsDe(node) {
  const llista = [];
  let actual = node?.parentNode ?? null;
  while (actual) {
    if (actual.nodeType === NODE_FRAGMENT && actual.host) actual = actual.host;
    llista.push(actual);
    actual = actual.parentNode ?? null;
  }
  return llista;
}

/**
 * El desplaçador més pròxim a l'<a> del clic: el primer ascendent amb
 * overflow-y auto/scroll que té contingut per davall del que es veu. Es puja
 * pel camí compost (travessa el shadow root de <soc-de-poble>) i la cerca
 * para a `arrel` inclosa: el desplaçador de l'amfitrió no és nostre. `null`
 * si no n'hi ha cap.
 */
export function desplacadorDelClic(event, ancora, arrel = null) {
  if (!ancora) return null;
  const cami = typeof event?.composedPath === 'function' ? event.composedPath() : [];
  const inici = cami.indexOf(ancora);
  const ascendents = inici >= 0 ? cami.slice(inici + 1) : ascendentsDe(ancora);
  for (const node of ascendents) {
    if (esDesplacador(node)) return node;
    if (node === arrel) return null;
  }
  return null;
}

/** El #fragment d'un destí, sense la coixinera i tal com ve; '' si no en porta. */
export function fragmentDelDesti(desti) {
  if (typeof desti !== 'string') return '';
  const posicio = desti.indexOf('#');
  return posicio < 0 ? '' : desti.slice(posicio + 1);
}

/* Com fa el navegador: primer l'id tal com ve i, si no hi és, descodificat
   ('#pl%C3%A0tan' troba id="plàtan"). */
function elementDelFragment(arrelDelNode, fragment) {
  if (!fragment || typeof arrelDelNode?.getElementById !== 'function') return null;
  const directe = arrelDelNode.getElementById(fragment);
  if (directe) return directe;
  let descodificat;
  try { descodificat = decodeURIComponent(fragment); } catch { return null; }
  return descodificat === fragment ? null : arrelDelNode.getElementById(descodificat);
}

/* A dalt de colp, com arriba un document nou: sense el scroll-behavior suau
   del contenidor. Un navegador que no coneix 'instant' rebutja el diccionari
   i es cau a scrollTop. */
function portaADalt(desplacador) {
  if (typeof desplacador.scrollTo === 'function') {
    try { desplacador.scrollTo({ top: 0, behavior: 'instant' }); return; } catch { /* scrollTop */ }
  }
  desplacador.scrollTop = 0;
}

/**
 * Prepara, EN EL CLIC, on ha de quedar la vista després de passar l'enllaç al
 * router: després l'<a> ja pot no ser al document i el camí compost ja no es
 * pot llegir. Torna la funció que ho aplica, per a cridar-la en el fotograma
 * següent a la navegació:
 *  - amb #fragment, l'element amb eixe id dins del mateix node arrel que l'<a>
 *    (el document o el shadow root de l'element) es porta a la vista;
 *  - sense fragment, o si l'id no hi és, el desplaçador més pròxim a l'<a>
 *    torna a dalt, si continua al document.
 */
export function preparaRecolocacio(event, ancora, arrel, desti) {
  const fragment = fragmentDelDesti(desti);
  const arrelDelNode = fragment && typeof ancora?.getRootNode === 'function' ? ancora.getRootNode() : null;
  const desplacador = desplacadorDelClic(event, ancora, arrel);
  return function recoloca() {
    const objectiu = elementDelFragment(arrelDelNode, fragment);
    if (objectiu && typeof objectiu.scrollIntoView === 'function') {
      objectiu.scrollIntoView();
      return;
    }
    if (desplacador?.isConnected) portaADalt(desplacador);
  };
}
