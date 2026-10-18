import { resolveAsset } from '../../config/assetResolver';
import { useCallback, useEffect, useId, useLayoutEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from '../../app/contexts/RouterContext';
import { Camera, Trash2 } from 'lucide-react';
import { isSafeAsset, isSafeUrl, DEFAULT_AUTHOR, MARQUES_SVG_ANTIGUES, PAGE_CHROME_MODES, esAvatarSegur, esMarcaDeLEntitat, esRutaDelProjecte } from './UniversalUtils';
import { RUTA_DRETS_AUTOR } from '../../config/systemPages.js';
import { useResolvedAssetState } from '../../hooks/useResolvedAsset.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { escriuSeccio, llegixSeccio, rutaAmbConsulta, slugsDeSeccions } from './workspace/seleccioUrl.js';
import { useAccions } from '../PedraSeca/hooks/useAccions.js';
import { useTraduccioPagina } from '../PedraSeca/hooks/useTraduccioPagina.js';
import { llevaPuntFinal } from './editorial.js';
import { BarraBlava } from './barres/BarraBlava.jsx';
import { BarraTaronja } from './barres/BarraTaronja.jsx';
import { AvisTraduccio, CosTraduit } from './traduccio/TraduccioPagina.jsx';
import { useToast } from './NotificationContext.jsx';

/* Ordre del Mestre, 261004 (D-A) · El Traduir d'una pàgina que no es
   traduïx (traduccio={false}: la pàgina de les apps, PaginaApp): ho diu i no
   envia res al servei de traducció, com les eines locals de la Wiki
   (AVIS_EINA_LOCAL_SENSE_TRADUCCIO de WikiDePobleSection). */
export const AVIS_PAGINA_SENSE_TRADUCCIO = 'Esta pàgina no es traduïx: el que mostra no ix d’este dispositiu.';

/* T2 (ordre del Mestre, 260930) · Fins a quin nivell d'encapçalament arriba
   l'Índex: h6 per defecte, perquè tot nivell d'encapçalament del contingut hi
   entra (els h4, h5 i h6 de les targetes decoren i estructuren, i el Mestre
   els vol a l'Índex); els sr-only i els buits, no. Cada pàgina encara en pot
   demanar d'1 a 6. Un sol selector per a la consulta i
   per al filtre de l'observador: si no coincidixen, l'Índex obert no
   s'assabenta quan Refrescar canvia el text d'un h5. */
export const NIVELL_INDEX_PER_DEFECTE = 6;

export function selectorIndex(nivellMax) {
  const n = Number.isInteger(nivellMax) ? Math.min(6, Math.max(1, nivellMax)) : NIVELL_INDEX_PER_DEFECTE;
  return Array.from({ length: n }, (_, i) => `h${i + 1}`).join(', ');
}

/* T7 (P9) · Les entrades de l'Índex d'un contenidor, amb el slug estable de
   cada una: fet del text i, si es repetix, amb sufix (-2, -3…) en l'ordre del
   document (seleccioUrl.js). El mateix recorregut servix per a pintar
   l'Índex i per a trobar la secció de la URL en carregar. */
export function encapcalamentsIndex(container, selector) {
  const elements = Array.from(container?.querySelectorAll?.(selector) || [])
    .filter((el) => !el.classList.contains('sr-only') && el.textContent.trim() !== '');
  const slugs = slugsDeSeccions(elements.map((el) => el.textContent));
  return elements.map((element, i) => ({ element, slug: slugs[i] }));
}

/* Ordre del Mestre, 261004 (integració final, auditoria d'amfitrió) · Dins de
   WordPress l'app viu en l'arrel ombra tancada de <soc-de-poble>. L'Índex es
   pintava amb un portal al body del tema (sense estils, al peu de la pàgina)
   i els salts a una secció feien scrollIntoView, que també desplaçava la
   pàgina de l'amfitrió. Ara l'Índex es pinta dins de l'app i el salt només
   mou el desplaçador de l'app. A socdepoble.org, el portal continua al body. */
function dinsDeLEncastat(node) {
  return node?.getRootNode?.().host?.localName === 'soc-de-poble';
}

/* On es pinta l'Índex, com Dialeg.jsx: encastat, a l'arrel de l'app
   (.sdp-root, la caixa que l'amfitrió reserva; layout.css, :host
   .toc-overlay); si no, al body de sempre (Llei del Píxel). */
function destiDeLIndex(node) {
  if (dinsDeLEncastat(node)) return node.closest('.sdp-root') || node.getRootNode();
  return document.body;
}

/* L'id estable del diàleg de l'Índex: el botó «Índex» de la barra blava hi
   apunta amb aria-controls, i qui el busque (el Lector) no depén de la
   classe. El doble guió no ix mai d'un slug (seleccioUrl.js): no pot
   coincidir amb l'id que l'Índex posa als encapçalaments (`${idPrefix}-${slug}`). */
export const idDeLIndex = (idPrefix = 'toc') => `${idPrefix}--index`;

/* Verificació «index-amfitrio», D1 (ordre del Mestre, 261004) · En tancar
   l'Índex encastat, el focus es pot tornar al botó «Índex» sense robar-lo:
   és al calaix (o en un fill seu) o s'ha perdut (el calaix ja s'ha desmuntat i
   el document l'ha portat al body o a l'amfitrió). Si és en un altre control de
   l'app o en un camp de la pàgina de WordPress, és d'un altre i no es toca
   (el mateix criteri que focusPerdutALOmbra del Lector).
   Correcció final (ordre del Mestre, 261004) · A socdepoble.org l'arrel és el
   document: quan el calaix es desmunta, el focus perdut és al body (o a
   l'element arrel), no a null. */
function focusDelCalaixOPerdut(arrel, calaix) {
  const actiu = arrel?.activeElement;
  if (!arrel?.host) return !actiu || actiu === arrel?.body || actiu === arrel?.documentElement || calaix.contains(actiu);
  if (actiu) return calaix.contains(actiu);
  const pagina = arrel?.host?.ownerDocument;
  const delDocument = pagina?.activeElement;
  return !delDocument || delDocument === arrel.host || delDocument === pagina.body || delDocument === pagina.documentElement;
}

/* Valors d'overflow-y amb què un element fa de desplaçador: el mateix criteri
   que enllacosInterns.js ('overlay' és l'àlies antic de WebKit per a auto). */
const OVERFLOW_DESPLACA = new Set(['auto', 'scroll', 'overlay']);
const px = (valor) => {
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : 0;
};
const estilDe = (node) => node.ownerDocument.defaultView.getComputedStyle(node);

/* El desplaçador de l'app més pròxim a l'element: el primer ascendent amb
   overflow-y auto o scroll i contingut per davall del que es veu (una columna
   de l'AppGridShell, .app-main__content). Puja per parentElement, que no
   travessa l'arrel ombra, i para a .sdp-root inclosa: el de l'amfitrió no és
   nostre. null si no n'hi ha cap. */
function desplacadorDeLApp(element) {
  const arrel = element.closest('.sdp-root');
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (OVERFLOW_DESPLACA.has(estilDe(node).overflowY) && node.scrollHeight > node.clientHeight) return node;
    if (node === arrel) return null;
  }
  return null;
}

/* El que tapen, enganxades a dalt del desplaçador, les barres sticky de la
   pàgina (la blava i la taronja, fills directes del contenidor de la pàgina):
   la més baixa acaba a top + alçada. Si el desplaçador és dins de la pàgina
   (un bloc amb scroll propi), les barres no hi són i no compten. */
function reservaDeLesBarres(element, desplacador) {
  const pagina = element.closest('.sdp-universal-page-container');
  if (!pagina || !desplacador.contains(pagina)) return 0;
  let reserva = 0;
  for (const fill of pagina.children) {
    const estil = estilDe(fill);
    if (estil.position !== 'sticky') continue;
    const dalt = parseFloat(estil.top);
    if (Number.isFinite(dalt)) reserva = Math.max(reserva, dalt + fill.offsetHeight);
  }
  return reserva;
}

/* On ha de deixar desplacaASeccio el desplaçador de l'app perquè la secció
   quede per davall de les barres: { desplacador, top }, o null si no hi ha cap
   desplaçador de l'app. El top és posició del contingut (no depén del scroll
   d'ara): si no canvia res de dalt, no canvia. */
function destiDelSalt(element) {
  const desplacador = desplacadorDeLApp(element);
  if (!desplacador) return null;
  const estil = estilDe(element);
  const barres = reservaDeLesBarres(element, desplacador);
  const marge = Math.max(px(estil.scrollMarginTop), barres > 0 ? barres + px(estil.getPropertyValue('--sdp-space-4')) : 0);
  const top = desplacador.scrollTop + element.getBoundingClientRect().top - desplacador.getBoundingClientRect().top
    - desplacador.clientTop - px(estilDe(desplacador).scrollPaddingTop) - marge;
  return { desplacador, top };
}

/* Correcció final (ordre del Mestre, 261004) · Si la secció ja no és on la
   deixaria desplacaASeccio (el contingut de dalt ha canviat d'alçada després
   del salt): el scroll d'ara no és el que toca, amb el límit natural del
   desplaçador (a dalt de tot o al final no es pot anar més enllà). Un píxel
   de marge, pels arredoniments del navegador. Sense desplaçador de l'app no
   hi ha res a corregir. */
function seccioFora(element) {
  const desti = destiDelSalt(element);
  if (!desti) return false;
  const { desplacador, top } = desti;
  const maxim = Math.max(0, desplacador.scrollHeight - desplacador.clientHeight);
  return Math.abs(desplacador.scrollTop - Math.min(Math.max(top, 0), maxim)) > 1;
}

/**
 * Porta una secció a dalt de la vista, com scrollIntoView({ block: 'start' }),
 * però movent NOMÉS el desplaçador de l'app més pròxim: mai la pàgina de
 * l'amfitrió. El destí queda per davall de les barres enganxades amb el marge
 * acordat (--sdp-space-4), o al seu scroll-margin-top si en demana més (el
 * dels desplegables i les mètriques de la Consola ja reserva les dues barres).
 * `opcions` són les de scrollIntoView d'abans: el behavior es conserva
 * (smooth a l'Índex; sense, el del CSS a la secció de la URL). Sense cap
 * desplaçador de l'app: a socdepoble.org, scrollIntoView com abans; encastat,
 * res (moure's ací seria moure la pàgina de l'amfitrió).
 */
export function desplacaASeccio(element, opcions = { block: 'start' }) {
  const desti = destiDelSalt(element);
  if (!desti) {
    if (!dinsDeLEncastat(element)) element.scrollIntoView?.(opcions);
    return;
  }
  const { desplacador, top } = desti;
  if (typeof desplacador.scrollTo === 'function') {
    desplacador.scrollTo(opcions.behavior ? { top, behavior: opcions.behavior } : { top });
  } else {
    desplacador.scrollTop = top;
  }
}

export function TableOfContentsDrawer({
  isOpen, onClose, contentRef, idPrefix = 'toc', nivellMaxIndex = NIVELL_INDEX_PER_DEFECTE,
  /* T7 (P9) · Opcional: rep el slug de l'entrada clicada (PageFrame l'escriu a ?seccio=). */
  onSeccio = null
}) {
  const [headings, setHeadings] = useState([]);
  /* Ordre del Mestre, 261004 (integració final) · On es pinta l'Índex: es
     decidix per node en obrir, abans de pintar (com Dialeg.jsx). */
  const [desti, setDesti] = useState(null);
  const selector = selectorIndex(nivellMaxIndex);

  useLayoutEffect(() => {
    setDesti(isOpen ? destiDeLIndex(contentRef?.current) : null);
  }, [contentRef, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const container = contentRef?.current;
    if (!container) return;

    let currentParsed = [];

    const buildToc = () => {
      /* T7 (P9) · L'id que posa l'Índex ja no és la posició: és el slug del
         text, estable entre càrregues. Si el text canvia, l'id el seguix. Un
         id propi de l'encapçalament no es toca. */
      const parsedHeadings = encapcalamentsIndex(container, selector).map(({ element: el, slug }) => {
        if (!el.id || el.dataset.sdpTocGenerated === 'true') {
          el.id = `${idPrefix}-${slug}`;
          el.dataset.sdpTocGenerated = 'true';
        }
        return {
          id: el.id,
          slug,
          /* Correcció final (ordre del Mestre, 261004) · El text tal com està
             escrit, no com el pinta la CSS: innerText copiava el text-transform
             de l'encapçalament (un h6 eixia en majúscules a l'Índex i al lector
             de pantalla). Els espais, plegats. El slug ja ve de textContent. */
          text: el.textContent.replace(/\s+/g, ' ').trim(),
          level: parseInt(el.tagName.substring(1), 10),
          element: el
        };
      });
      
      currentParsed = parsedHeadings;
      setHeadings(parsedHeadings);
    };

    buildToc();

    // Use MutationObserver for live updates as suggested by the Council
    const observer = new MutationObserver((mutations) => {
      // Only rebuild if there are meaningful text or node changes
      const shouldRebuild = mutations.some(m => 
        m.type === 'childList' || 
        (m.type === 'characterData' && m.target.parentElement?.matches?.(selector))
      );
      if (shouldRebuild) {
        buildToc();
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
      currentParsed.forEach(({ element, id }) => {
        if (element.dataset.sdpTocGenerated === 'true' && element.id === id) {
          element.removeAttribute('id');
          delete element.dataset.sdpTocGenerated;
        }
      });
      setHeadings([]);
    };
  }, [contentRef, idPrefix, isOpen, selector]);

  /* Ordre del Mestre, 261004 (integració final) · Esc s'escolta a l'arrel
     del destí: el document a socdepoble.org, com abans; encastat, l'arrel
     ombra de la instància (com modalLocal.js i el Lector): una tecla de la
     pàgina de WordPress no tanca l'Índex de dins. */
  useEffect(() => {
    if (!isOpen || !desti) return undefined;
    const arrel = desti.getRootNode();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    arrel.addEventListener('keydown', handleKeyDown);
    return () => arrel.removeEventListener('keydown', handleKeyDown);
  }, [desti, isOpen, onClose]);

  /* Verificació «index-amfitrio», D1 (ordre del Mestre, 261004) · Encastat,
     Esc només arriba a l'oient de l'arrel ombra si el focus és dins d'ella.
     Safari i Firefox de macOS no enfoquen el botó «Índex» en clicar-lo, i un
     clic a un text no enfocable del calaix portava el focus al body del tema:
     la tecla anava a la pàgina de WordPress i l'Índex no es tancava mai. Ara,
     encastat, el calaix és enfocable (tabIndex -1: un clic a un text de dins
     deixa el focus en ell) i el rep en obrir-se, com enfoca() de
     modalLocal.js. En tancar-se, el focus torna al botó «Índex» (el que hi
     apunta amb aria-controls), si no se n'ha anat a una altra banda.
     Correcció final (ordre del Mestre, 261004) · Derogat «a socdepoble.org,
     res»: el diàleg aria-modal no rebia el focus i el teclat havia de
     travessar tota la pàgina per a arribar-hi. Ara la SPA fa el mateix que
     l'encastat. El calaix és un contenidor enfocat per programa: no pinta cap
     anell, tampoc després d'un ús del teclat (modules.css, .toc-drawer:focus);
     les entrades i l'aspa conserven el seu. Depén de `desti`: el calaix es
     munta en el pintat que el posa. */
  const calaixRef = useRef(null);
  useEffect(() => {
    const calaix = calaixRef.current;
    if (!isOpen || !desti || !calaix) return undefined;
    const id = idDeLIndex(idPrefix);
    const pagina = contentRef?.current?.closest?.('.sdp-universal-page-container');
    const boto = pagina
      ? [...pagina.querySelectorAll('[aria-controls]')].find((el) => el.getAttribute('aria-controls') === id) || null
      : null;
    calaix.focus({ preventScroll: true });
    return () => {
      if (boto?.isConnected && focusDelCalaixOPerdut(boto.getRootNode(), calaix)) boto.focus({ preventScroll: true });
    };
  }, [contentRef, desti, idPrefix, isOpen]);

  if (!isOpen || !desti) return null;

  return createPortal(
    <div className="toc-overlay" onClick={onClose}>
      <aside
        id={idDeLIndex(idPrefix)}
        ref={calaixRef}
        tabIndex={-1}
        className="toc-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="toc-title"
      >
        <div className="toc-header">
          <h2 id="toc-title">Taula de continguts</h2>
          <button className="toc-close-btn" onClick={onClose} aria-label="Tancar taula">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <nav className="toc-nav">
          {headings.length === 0 ? (
            <p className="toc-empty">No s'han trobat seccions.</p>
          ) : (
            <ul>
              {headings.map((h, idx) => (
                <li key={idx} className={`toc-item toc-level-${h.level}`}>
                  <button
                    onClick={() => {
                      desplacaASeccio(h.element, { behavior: 'smooth', block: 'start' });
                      onSeccio?.(h.slug);
                      onClose();
                    }}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
    </div>,
    desti
  );
}

/* T7 (P9) · El router on viu la pàgina, si n'hi ha cap de llegible; null si
   no (una prova sense RouterProvider, o un mock que només porta useNavigate):
   llavors l'Índex no escriu cap URL ni en llig la secció, com abans. Mateix
   patró que useUbicacioApp (useAccions.js): `return useRouter()` dins del try. */
function useRouterOpcional() {
  try {
    return useRouter() ?? null;
  } catch {
    return null;
  }
}

/* Quant espera, com a molt, que la secció de la URL aparega al cos (un
   contingut que arriba tard). Després ja no fa scroll: la persona pot estar
   escrivint i un encapçalament nou no l'ha d'arrossegar. També és el temps
   que, després del salt, la pàgina vigila que la secció no se'n vaja quan el
   contingut de dalt canvia d'alçada. */
const ESPERA_SECCIO_MS = 3000;

/* Qualsevol d'estes vol dir que la persona ja mou la pàgina: el salt a la
   secció de la URL deixa de corregir-se. */
const GESTOS_DE_LA_PERSONA = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

/* La secció de la URL que ja s'ha fet servir en esta sessió: l'ha escrita un
   Índex o una pàgina ja hi ha fet scroll. Una pàgina que es munta després
   amb la mateixa secció a la URL no hi torna a saltar: les seccions que
   arrosseguen la Wiki o el Disseny en canviar de document (no l'esborren)
   no mouen el document nou. Un enllaç que entra de fora sí que hi salta. Es
   buida quan la URL ja no porta cap secció. */
let seccioConsumida = null;

/* Decisió del Mestre (261008) · El nom del botó del copyright en edició:
   comença pel text visible (WCAG 2.5.3: qui dona ordres amb la veu diu el
   que veu) i diu què fa («CC BY 4.0: canviar els drets d'autor»). Un copyright que no
   és text (un node) es queda amb l'acció sola. */
export const ETIQUETA_CANVIA_DRETS = "canviar els drets d'autor";
export function nomDelBotoDeDrets(copyright) {
  if (typeof copyright === 'string' && copyright.trim()) return `${copyright.trim()}: ${ETIQUETA_CANVIA_DRETS}`;
  return "Canviar els drets d'autor";
}

export function PageFrame({
  title, subtitle, lead, labels = [], copyright, showLogos = false,
  chrome = 'page', topBarData = {}, heroImage, heroAlt = '',
  /* Dimensions conegudes de la portada: es passen juntes per reservar-ne
     la proporció abans de carregar. Sense un parell vàlid, no s'endevina.
     La prioritat alta és una decisió explícita de qui posa la portada. */
  heroWidth, heroHeight, heroFetchPriority,
  /* T6 (ordre del Mestre, 261004) · Sense nom propi (ni ací ni a
     topBarData), la barra signa amb DEFAULT_AUTHOR i, si ningú hi posa ruta,
     enllaça al perfil de Sóc de Poble (DEFAULT_AUTHOR.href; Onada 8, 261009:
     abans, la pàgina del projecte). */
  authorName, authorLocation = DEFAULT_AUTHOR.location,
  authorAvatar = DEFAULT_AUTHOR.avatarUrl,
  /* T4 · amb ruta, avatar i nom de la barra taronja enllacen al perfil públic. */
  authorHref = null,
  time, date, dateTime,
  /* Ordre del Mestre, 261001 (tasca 4) · el nom accessible de la pastilla de
     la barra taronja; UniversalPage hi posa el que diu on porta el clic (el
     Calendari en eixe mes). Sense, el de DateTimeControl. */
  dateTimeLabel,
  onBack, onForward, onIndex, onTranslate, onComment, onShare, onConnect, onDateTime,
  connectLabel = 'Connectar', price, layout = 'page',
  /* T43 (ordre del Mestre, 260928, D1) · showConnect={false} amaga el botó
     CONNECTAR de la barra blava (UniversalPage el passa amb onConnect={false}).
     Sense la prop, el de sempre: visible. */
  showConnect,
  /* T63.2 (doctrina del Mestre, 260928) · `objecte`: el descriptor tipat de
     l'element de la pàgina. Sense onComment propi, Comentar obri el menú de
     dues vies (ordre del Mestre, 261007): «En privat» i «En públic», el xat
     públic de l'objecte (useAccions); una nota no en té i Comentar no es
     pinta. objecte={null}: ara no hi ha cap element (carregant, no trobat):
     «En públic» queda desactivada i diu per què.
     showComment={false} l'amaga (UniversalPage el passa amb onComment={false}).
     Amb accionsInoperatives (l'editor, T36) l'objecte no hi compta: el botó
     es queda inoperatiu, amb l'avís de la closca, siga quin siga el document. */
  objecte,
  showComment,
  /* Ordre del Mestre, 261004 (D-A) · showShare={false} amaga Compartir de la
     barra blava (una llista privada d'una app no té res a compartir). Sense
     la prop, el de sempre: visible. */
  showShare,
  // Ranura opcional de l'editor: la botonera de classificació ocupa el lloc
  // de les píndoles, davall del títol. Sense ella el DOM és el de sempre.
  classificacio = null,
  /* T36 · Ranures opcionals de l'editor (UniversalEditorShell). Amb
     accionsInoperatives, Comentar, Compartir i Connectar es pinten igual i
     continuen clicables, però el clic va a onClickInoperatiu (la closca hi
     mostra l'avís) i no fa la seua acció; Índex, Traduir i les fletxes
     continuen vius. avisAccions es pinta just davall de la barra blava.
     Sense elles el DOM és el de sempre. */
  accionsInoperatives = false,
  onClickInoperatiu = null,
  avisAccions = null,
  /* Gauntlet 261016 (Bloc 3.9) · Opcional, només amb accionsInoperatives:
     Traduir també es pinta inoperatiu i el seu clic va a
     onClickInoperatiu('traduir'). Només el passa l'editor
     (UniversalEditorShell): en edició, Traduir portava a /traduccions i treia
     la persona de l'editor. Sense la prop (la Gestoria, la lectura), Traduir
     com sempre. */
  traduirInoperatiu = false,
  /* T2 (ordre del Mestre, 260930) · últim nivell d'encapçalament que recull
     l'Índex (1-6). Sense la prop, h1-h6: tots. */
  nivellMaxIndex = NIVELL_INDEX_PER_DEFECTE,
  /* Ordre del Mestre, 261004 (prompt 261004_0515 §6, «el botonaco de
     Publicar») · `accioPrincipal`: l'acció gran de la pàgina, dins del bloc
     del títol, davall de l'H1 i de les etiquetes (o de la classificació) i
     abans del copyright, en un div.page-title-accio. Sense, el DOM de sempre. */
  accioPrincipal = null,
  /* Ordre del Mestre, 261004 (D-A) · `traduccio={false}`: la pàgina no es
     traduïx. Traduir avisa (AVIS_PAGINA_SENSE_TRADUCCIO) i el Traductor
     Sobirà queda inert: cap text ix cap al servei. Sense la prop, el de
     sempre. */
  traduccio: ambTraduccio = true,
  /* Ordre del Mestre, 261004 (D-A) · `refTitol`: un ref a l'H1 perquè qui
     obri la pàgina hi porte el focus. Només amb ell l'H1 porta tabIndex -1. */
  refTitol,
  /* Ordre del Mestre, 261004 (D-A) · `telemetria`: com es compta el
     Connectar de la barra (useAccions). { comptar: false } no el compta (les
     apps no hi entren). L'origen sempre és 'pagina'. Sense, el de sempre. */
  telemetria,
  /* Ordre del Mestre, 261004 (segona decisió: barra taronja universal) ·
     Tota pàgina porta la barra taronja, siga quin siga el `chrome` (també
     'system', 'page' i 'none') i encara que no tinga portada. Esta és l'única
     via d'excepció: senseBarraTaronja la lleva. Només s'hi pot posar per ordre
     explícita del Mestre, amb el motiu escrit al costat; hui no la passa cap
     pàgina (PageFrame.barraTaronja.test.jsx ho fixa). */
  senseBarraTaronja = false,
  /* Norma del Mestre, 261004 (prompt 261004_1108, logotips) · `logoEntitat`:
     el logotip de l'entitat que signa la pàgina, { clar, fosc?, alt }, amb
     els src ja resolts (un sdp-media:// es resol abans, amb
     useResolvedAsset: PageFrame no el resol). Amb `fosc`, dues imatges (tema
     clar i fosc), el format ample de Sóc de Poble; sense, una sola per als
     dos temes (page-title-logo--entitat: fins a 600x600). */
  logoEntitat = null,
  /* Norma del Mestre, 261004 · L'única via d'excepció del logotip de
     l'entitat: senseLogo el lleva, i només amb `true` explícit. Només s'hi
     pot posar per ordre explícita del Mestre, amb el motiu escrit al costat;
     hui no la passa cap pàgina (PageFrame.logo.test.jsx ho fixa). No lleva la
     ranura de l'editor: el logotip que puja la persona és contingut. */
  senseLogo = false,
  /* Norma del Mestre, 261004 (prompt 261004_1108, línies 66-69 i T2) ·
     `avatarAutor`: l'avatar redó de qui signa quan és una persona o la IA,
     { src, alt, onCanvia? }. El passa qui sap que signa una persona o la IA
     (la fitxa pública, el detall d'un element), mai s'endevina de la ruta
     de la boina. El src pot ser un camí, una URL o un sdp-media://: PageFrame
     el resol (resolveAsset, o useResolvedAsset per a sdp-media://). Va
     després de les vies del logotip: amb logotip, cap avatar; senseLogo
     també el lleva. Amb onCanvia (la pàgina és de qui mira i la pot
     editar), l'avatar és un botó que obri el canvi d'imatge.
     Contracte-1 (pla 261008_1201, el retallador) · Claus opcionals noves:
     amb onCanvia i `etiquetaCanvia` (text), davall de l'avatar una píndola
     de text visible que fa el mateix que l'avatar; amb `onLleva` (funció) i
     una imatge pintada, una segona píndola que la lleva (`etiquetaLleva`,
     per defecte ETIQUETA_LLEVA_AVATAR). Sense eixes claus, el DOM de sempre.
     Correcció de la revisió (261008) · Si la referència no es pot pintar (la
     marca, una adreça insegura, un sdp-media:// que el port no resol), les
     píndoles es pinten soles, «lleva» inclosa: la persona la pot substituir
     o buidar.
     Línia I1 de l'Onada 4 (pla 261008_1201) · Dues claus opcionals més, que
     només compten si hi ha fila de píndoles (també la de les píndoles
     soles): `ajuda` (text no buit) pinta una línia .sdp-camp__ajuda davall
     de les píndoles, dins de la fila; `pujant` (només true) deixa les
     píndoles disabled i aria-busy mentre la imatge puja. Sense, el DOM de
     sempre. */
  avatarAutor = null,
  /* Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «Esta lògica de
     llistar elements de la categoria per a l'avatar actiu ha d'estar
     disponible per tot el sistema») · `peuDePagina`: el que va al peu de la
     pàgina, DESPRÉS de l'article original i de la traducció, dins del
     contenidor que fa scroll (.sdp-universal-page-container), en un
     section.sdp-pagina-peu amb nom accessible (`etiquetaPeuDePagina`). Queda
     fora de l'article (containerRef): l'Índex, la traducció i el Lector no el
     recullen. No és el `peu` fix de MarcColumna. Arriba sol per {...props}
     d'UniversalPage i, a l'editor, per {...rest} d'UniversalEditorShell i de
     DocumentEditor (la clau d'adaptador del mateix nom). Sense la prop, el DOM
     de sempre. */
  peuDePagina = null,
  etiquetaPeuDePagina,
  /* Decisió del Mestre (261008, drets d'autor dins de l'editor) ·
     `onCanviaCopyright`: només el passa l'editor (DocumentEditor, quan la
     persona pot triar els drets). Si és una funció, el text del copyright de
     la capçalera és un botó que obri el selector de drets, sense eixir de
     l'editor. Sense la prop (lectura, connexions, l'estat buit), l'enllaç de
     sempre a la pàgina «Drets d'autor». */
  onCanviaCopyright,
  children,
  className = '',
  LinkComponent = 'a' // To decouple from React Router's Link
}) {
  const [isTocOpen, setIsTocOpen] = useState(false);
  const containerRef = useRef(null);
  const traduccioRef = useRef(null);
  const tocIdPrefix = `toc-${useId().replace(/:/g, '')}`;

  /* Traductor Sobirà (ordre del Mestre, 260930 · via B) · L'estat de la
     traducció d'esta pàgina. La font és sempre l'article original
     (containerRef), que no es desmunta mai. A l'editor (T36) no hi ha
     traducció: substituiria el cos que s'està escrivint. */
  const traduccio = useTraduccioPagina(ambTraduccio ? { titol: title, cosRef: containerRef } : {});
  /* D-A · Sense traducció el hook es munta (l'ordre dels hooks no canvia mai)
     però no rep ni títol ni cos, i ningú no li demana res: inert. */
  const ambTraductor = ambTraduccio && !accionsInoperatives;
  const traduida = ambTraductor && traduccio.llengua ? traduccio : null;
  const { showToast } = useToast();
  const senseTraduccio = useCallback(() => showToast(AVIS_PAGINA_SENSE_TRADUCCIO), [showToast]);

  const {
    handleConnect,
    handleTranslate,
    handleComment,
    handleShare,
    traduirVisible,
    comentarVisible,
    compartirVisible,
    connectarVisible,
    comentarXat,
    comentarPrivatAmb,
    menuTraduir
  } = useAccions({
    title,
    objecte: accionsInoperatives ? undefined : objecte,
    onConnect,
    onTranslate: ambTraduccio ? onTranslate : (onTranslate || senseTraduccio),
    onComment,
    onShare,
    showConnect,
    showComment,
    showShare,
    hasFooter: true, // Assuming full chrome provides a footer-like context for these
    // el Connectar de la barra es compta ací, i només ací (D-A: {comptar:false} no el compta)
    telemetria: { ...telemetria, origen: 'pagina' },
    traduccio: ambTraductor ? traduccio : undefined
  });

  const handleIndex = onIndex || (() => setIsTocOpen(true));

  /* T7 (P9) · La secció a la URL (?seccio=). Clicar una entrada de l'Índex
     l'escriu amb replace (no omple l'historial i conserva l'estat de
     l'entrada, com el preloadedItem del detall); en carregar amb una secció,
     la pàgina hi fa scroll. La que acaba d'escriure l'Índex no torna a fer
     scroll: el clic ja l'ha portada (seccioConsumida). */
  const router = useRouterOpcional();
  const seccioUrl = llegixSeccio(router?.searchParams);

  const escriuSeccioUrl = useCallback((slug) => {
    seccioConsumida = slug;
    if (!router || typeof router.navigate !== 'function' || typeof router.currentPath !== 'string') return;
    const abans = router.searchParams instanceof URLSearchParams ? router.searchParams : new URLSearchParams();
    const despres = escriuSeccio(abans, slug);
    if (despres.toString() === abans.toString()) return;
    const estat = router.memoria ? (router.estat ?? null) : (window.history?.state ?? null);
    router.navigate(rutaAmbConsulta(router.currentPath, despres), { replace: true, state: estat });
  }, [router]);

  useEffect(() => {
    if (!seccioUrl) {
      seccioConsumida = null;
      return undefined;
    }
    if (seccioUrl === seccioConsumida) return undefined;
    const container = containerRef.current;
    if (!container || typeof MutationObserver !== 'function') return undefined;
    const selector = selectorIndex(nivellMaxIndex);
    let observador = null;
    let termini = null;
    let fotograma = null;
    let paraLaVigilancia = null;
    const deixaDeVigilar = () => {
      paraLaVigilancia?.();
      paraLaVigilancia = null;
    };
    /* Correcció final (ordre del Mestre, 261004) · El salt es feia una sola
       vegada. Si després el contingut de dalt canvia d'alçada (les dades de la
       Consola, una imatge sense mides a Safari 16), la secció se n'anava
       davall de la barra taronja. Fins a ESPERA_SECCIO_MS després del salt,
       cada canvi del cos (MutationObserver) o de mida de l'article o de la
       pàgina (ResizeObserver) comprova si la secció continua on la deixa
       desplacaASeccio i, si no, hi torna. El primer gest de la persona (roda,
       toc, clic o tecla) ho para: qui ja llig no s'arrossega. Els gestos
       s'escolten a l'arrel del cos: el document o, encastat, l'arrel ombra. */
    const vigilaElSalt = (element) => {
      deixaDeVigilar();
      const arrel = container.getRootNode();
      const pagina = container.closest('.sdp-universal-page-container') || container.parentElement;
      const reajusta = () => {
        if (!element.isConnected) deixaDeVigilar();
        else if (seccioFora(element)) desplacaASeccio(element, { block: 'start' });
      };
      const mutacions = new MutationObserver(reajusta);
      mutacions.observe(container, { childList: true, subtree: true, characterData: true });
      const mides = typeof ResizeObserver === 'function' ? new ResizeObserver(reajusta) : null;
      for (const node of [container, pagina]) if (node) mides?.observe(node);
      const opcions = { capture: true, passive: true };
      for (const gest of GESTOS_DE_LA_PERSONA) arrel.addEventListener(gest, deixaDeVigilar, opcions);
      const fi = setTimeout(deixaDeVigilar, ESPERA_SECCIO_MS);
      paraLaVigilancia = () => {
        mutacions.disconnect();
        mides?.disconnect();
        for (const gest of GESTOS_DE_LA_PERSONA) arrel.removeEventListener(gest, deixaDeVigilar, opcions);
        clearTimeout(fi);
      };
    };
    /* Correcció T3 · El scroll es fa en el fotograma següent. Un enllaç intern
       clicat amb el router en memòria o amb base (l'interceptor d'App.jsx,
       preparaRecolocacio) torna el desplaçador a dalt en el fotograma següent
       al clic; el que demana este efecte va a la cua després i guanya. La
       secció només es dona per consumida quan s'hi ha fet scroll: un efecte
       que es desfà abans (StrictMode, un remuntatge) no se la menja. */
    const salta = (element) => {
      const fes = () => {
        fotograma = null;
        if (!element.isConnected) return;
        seccioConsumida = seccioUrl;
        // Ordre del Mestre, 261004 (integració final) · només el desplaçador de l'app (desplacaASeccio).
        desplacaASeccio(element, { block: 'start' });
        vigilaElSalt(element);
      };
      if (typeof requestAnimationFrame === 'function') fotograma = requestAnimationFrame(fes);
      else fes();
    };
    const busca = () => {
      const trobat = encapcalamentsIndex(container, selector).find(({ slug }) => slug === seccioUrl);
      if (!trobat) return false;
      salta(trobat.element);
      return true;
    };
    const deixaDEsperar = () => {
      observador?.disconnect();
      clearTimeout(termini);
    };
    const para = () => {
      deixaDEsperar();
      deixaDeVigilar();
      if (fotograma !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(fotograma);
      fotograma = null;
    };
    if (busca()) return para;
    // El cos encara no hi és (un editor que carrega): s'espera, amb un límit.
    observador = new MutationObserver(() => {
      if (busca()) deixaDEsperar();
    });
    observador.observe(container, { childList: true, subtree: true, characterData: true });
    termini = setTimeout(deixaDEsperar, ESPERA_SECCIO_MS);
    return para;
  }, [seccioUrl, nivellMaxIndex]);

  /* T6 · Signa per defecte qui no porta nom ni ací ni a topBarData (abans,
     el valor per defecte del paràmetre: el mateix nom, ara amb ruta). */
  const nomDeLaBarra = topBarData.authorName ?? authorName;
  const signaPerDefecte = nomDeLaBarra === undefined;
  const barAuthorName = signaPerDefecte ? DEFAULT_AUTHOR.name : nomDeLaBarra;
  const barAuthorLocation = topBarData.authorLocation ?? authorLocation;
  // La barra taronja resol i valida l'avatar i la ruta de l'autoria (BarraTaronja).
  const barAuthorAvatar = topBarData.authorAvatar ?? authorAvatar;
  const barAuthorHref = topBarData.authorHref ?? authorHref ?? (signaPerDefecte ? DEFAULT_AUTHOR.href : null);
  const barTime = topBarData.time ?? time;
  const barDate = topBarData.date ?? date;
  const barDateTime = topBarData.dateTime ?? dateTime;
  const barHeroImage = topBarData.heroImage ?? heroImage;
  const barHeroAlt = topBarData.heroAlt ?? heroAlt;
  // El parell és una unitat lligada a la imatge: una portada nova no
  // hereta la proporció de la que topBarData ha substituït.
  const dimensionsHero = topBarData.heroWidth !== undefined || topBarData.heroHeight !== undefined
    ? [topBarData.heroWidth, topBarData.heroHeight] : (barHeroImage === heroImage ? [heroWidth, heroHeight] : null);
  const midaHero = dimensionsHero?.every((valor) => Number.isFinite(valor) && valor > 0)
    ? { width: dimensionsHero[0], height: dimensionsHero[1] } : null;
  const prioritatHero = (topBarData.heroFetchPriority ?? heroFetchPriority) === 'high' ? 'high' : undefined;

  const resolvedChrome = PAGE_CHROME_MODES.has(chrome) ? chrome : 'page';
  const showBlueBar = resolvedChrome === 'full' || resolvedChrome === 'context' || resolvedChrome === 'system';
  /* Ordre del Mestre, 261004 · La barra taronja ja no depén del `chrome`:
     abans només la portaven 'full' i 'context', i les pàgines de sistema (la
     Consola, el Mur, el Control…) en quedaven sense. Signa qui passa la pàgina
     o, si ningú no en passa cap, DEFAULT_AUTHOR (logo, nom i poble de Sóc de
     Poble) enllaçat al seu perfil (Onada 8). La pastilla de data és la que du la pàgina:
     ací no se n'inventa cap (ni la d'ara ni guionets; skill sdp-pedra-seca
     §10 i barraTaronjaData.contracte.test.jsx). Només un `true` explícit
     la lleva: un text o un 1 no l'apaguen, i la config del ContentProvider
     tampoc, perquè UniversalPage hi torna a escriure la prop de la pàgina
     damunt de la config (PageFrame.barraTaronja.test.jsx). */
  const showOrangeBar = senseBarraTaronja !== true;
  /* Sense barra blava ('page' i 'none') la taronja no té res damunt: el
     modificador la deixa enganxar-se a dalt de tot (modules.css) en lloc de
     deixar el forat de la blava que no hi és. Amb la blava, cap classe nova. */
  const senseBlava = showOrangeBar && !showBlueBar ? 'sdp-universal-page-container--sense-blava' : '';
  const showPageHeader = resolvedChrome !== 'none';
  const pageLabels = Array.isArray(labels) ? labels.filter(Boolean) : [];
  // L'H1 i l'H2 no porten punt final (poliment editorial 260925). Només es
  // toca el text: un node de React passa tal qual.
  const titol = llevaPuntFinal(title);
  const subtitol = llevaPuntFinal(subtitle);
  /* Norma del Mestre, 261004 (prompt 261004_1108, logotips) · Tota pàgina
     creada per una entitat, també les de sistema, porta dalt de l'H1 el
     logotip de l'entitat, gran (fins a 600px) i responsiu. Qui decidix és qui
     signa, no un interruptor. Per ordre de prioritat:
       a) la ranura de l'editor (topBarData.logoComponent), com sempre;
       b) senseLogo === true: cap logotip. L'única excepció, per ordre
          explícita del Mestre (una cadena o un 1 no l'activen);
       c) logoEntitat: el logotip de l'entitat que signa;
       d) signa Sóc de Poble: la ruta de la boina és la del projecte
          (esRutaDelProjecte: DEFAULT_AUTHOR.href, '/empresa/socdepoble'
          des de l'Onada 8, o la vella '/projecte'), que rutaDAutoria només
          dona per identificador, mai pel nom. El seu logotip rectangular,
          amb el marcatge de sempre. Onada 8 (261009, revisió) · També el
          guanya una pàgina que ja signava amb rutaDePerfil del pilot, com la
          caiguda d'una connexió al seu perfil (ConnexioDetall.test.jsx):
          pendent de confirmar per MarIA;
       e) compatibilitat: showLogos === true continua pintant el de Sóc de
          Poble, de manera que cap pàgina no el perd hui (Llei del Píxel);
       f) avatarAutor: una persona o la IA no porten logotip, porten el seu
          avatar redó (ordre del Mestre, 261004, prompt 261004_1108 T2);
       g) altrament, res: una font de fora no en porta.
     Derogat per l'ordre del Mestre, 261004: showLogos ja no decidix sol, i
     showLogos={false} no lleva el logotip a una pàgina que signa Sóc de
     Poble. El logotip, o l'avatar, compta per a fer aparéixer el bloc del
     títol. */
  const logoDeLaRanura = topBarData?.logoComponent || null;
  const logoAutomatic = senseLogo === true ? null
    : (logoDescrit(logoEntitat) ?? (esRutaDelProjecte(barAuthorHref) || showLogos === true ? DEFAULT_AUTHOR.logo : null));
  const avatarDeCapcalera = logoDeLaRanura || logoAutomatic || senseLogo === true ? null : avatarDescrit(avatarAutor);
  /* Correcció de la revisió (261008, CONTRACTE-1) · Una referència que no es
     pot pintar, amb les claus per a canviar-la: les píndoles soles. */
  const accionsSenseAvatar = logoDeLaRanura || logoAutomatic || senseLogo === true || avatarDeCapcalera ? null : accionsDAvatarNoPintable(avatarAutor);
  const ambLogo = Boolean(logoDeLaRanura || logoAutomatic || avatarDeCapcalera || accionsSenseAvatar);
  const hasHeader = Boolean(showPageHeader && (ambLogo || titol || pageLabels.length || copyright || classificacio || accioPrincipal));

  return (
    <>
      <div className={['sdp-universal-page-container', `sdp-universal-page-container--${layout}`, senseBlava, className].filter(Boolean).join(' ')}>
      {/* T51 · Les dues barres de color són components propis (barres/): el
          catàleg pinta les de veres. PageFrame hi posa useAccions i les dades. */}
      {showBlueBar && (
        <BarraBlava
          onBack={onBack}
          onForward={onForward}
          onIndex={handleIndex}
          /* Ordre del Mestre, 261004 (integració final) · obert, el botó
             apunta al diàleg de l'Índex propi (aria-controls); tancat, o amb
             un onIndex de fora, a cap: cap id penjat a un element que no hi
             és, i el DOM tancat és el de sempre. */
          indexControla={!onIndex && isTocOpen ? idDeLIndex(tocIdPrefix) : undefined}
          traduirVisible={traduirVisible}
          comentarVisible={comentarVisible}
          compartirVisible={compartirVisible}
          connectarVisible={connectarVisible}
          onTranslate={handleTranslate}
          onComment={handleComment}
          onShare={handleShare}
          onConnect={handleConnect}
          connectLabel={connectLabel}
          /* T63.2 · Inoperatiu (l'editor, T36) no porta enlloc: el nom no en promet cap xat. */
          comentarXat={accionsInoperatives ? null : comentarXat}
          comentarPrivatAmb={comentarPrivatAmb}
          accionsInoperatives={accionsInoperatives}
          onClickInoperatiu={onClickInoperatiu}
          {...(traduirInoperatiu === true ? { traduirInoperatiu: true } : null)}
          menuTraduir={menuTraduir}
        />
      )}
      {showBlueBar && avisAccions}

      {topBarData?.heroComponent ? (
        <div className={`hero-image ${topBarData.isEmptyHero ? 'hero-image--buit' : ''}`.trim()}>
          {topBarData.heroComponent}
        </div>
      ) : barHeroImage ? (
        <div className="hero-image">
          <ImatgeDePortada alt={barHeroAlt} src={barHeroImage} width={midaHero?.width} height={midaHero?.height} fetchpriority={prioritatHero} />
        </div>
      ) : null}

      {/* T51 · Espai central: topBarData.emoticona (camp cru del document) i,
          en edició, topBarData.onObriEmoticona (obri el diàleg d'emoticona). */}
      {showOrangeBar && (
        <BarraTaronja
          authorName={barAuthorName}
          authorLocation={barAuthorLocation}
          authorAvatar={barAuthorAvatar}
          authorHref={barAuthorHref}
          LinkComponent={LinkComponent}
          emoticona={topBarData?.emoticona}
          onObriEmoticona={topBarData?.onObriEmoticona ?? null}
          barActions={topBarData?.barActions}
          time={barTime}
          date={barDate}
          dateTime={barDateTime}
          onDateTime={onDateTime}
          etiquetaData={dateTimeLabel}
        />
      )}

      {hasHeader && (
        <header className="page-title">
          {logoDeLaRanura ? (
            <div className="page-title-logo-personalitzat">
              {logoDeLaRanura}
            </div>
          ) : logoAutomatic ? (
            <LogoDeCapcalera {...logoAutomatic} />
          ) : avatarDeCapcalera ? (
            <AvatarDeCapcalera {...avatarDeCapcalera} />
          ) : accionsSenseAvatar}
          {titol && (
            <h1 lang={traduida?.titol ? traduida.lang : undefined} ref={refTitol} tabIndex={refTitol ? -1 : undefined}>
              {traduida?.titol ? llevaPuntFinal(traduida.titol) : titol}
              {price && <span className="sp-card-price sp-card-price--en-linia">{price}</span>}
            </h1>
          )}
          {classificacio ? (
            <div className="page-title-classificacio">{classificacio}</div>
          ) : pageLabels.length > 0 && (
            <ul className="sp-card-labels page-title-labels" aria-label="Categories">
              {pageLabels.map((label, index) => {
                const text = typeof label === 'string' ? label : label.text;
                const className = typeof label === 'string' ? 'sdp-badge-tag' : label.className || 'sdp-badge-tag';
                const href = typeof label === 'string' ? null : label.href;
                const safeHref = href && isSafeUrl(href) ? href : null;
                /* D-C (ordre del Mestre, 261004) · `sp-card-label--amb-accio`
                   marca l'etiqueta que porta botó: la CSS hi deixa de
                   preguntar amb :has() (fora de la Baseline 2022). */
                return (
                  <li key={`${text}-${index}`} className={['sp-card-label', className, label.onClick && 'sp-card-label--amb-accio'].filter(Boolean).join(' ')}>
                    {label.onClick ? (
                      <button type="button" className="sp-card-label__action" onClick={label.onClick}>
                        {text}
                      </button>
                    ) : safeHref ? (
                      safeHref.startsWith('http') ? (
                        <a href={safeHref} target="_blank" rel="noopener noreferrer" className="sp-card-label">{text}</a>
                      ) : LinkComponent === 'a' ? (
                        <a href={safeHref} className="sp-card-label">{text}</a>
                      ) : (
                        <LinkComponent to={safeHref} className="sp-card-label">{text}</LinkComponent>
                      )
                    ) : (
                      text
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {accioPrincipal ? <div className="page-title-accio">{accioPrincipal}</div> : null}
          {/* Ordre del Mestre (261007) · En LECTURA el copyright, siga quin
              siga el text, és SEMPRE un enllaç a la pàgina «Drets d'autor»
              (RUTA_DRETS_AUTOR), amb el LinkComponent de les etiquetes: el
              router de l'app (UniversalPage hi passa Link) o, sense, un <a>
              que l'interceptor d'App.jsx passa al router. El paràgraf es
              queda; l'enllaç va dins (.sp-card-copyright__enllac,
              components.css).
              Decisió del Mestre (261008) · En EDICIÓ (onCanviaCopyright), el
              mateix text dins del mateix paràgraf és un botó que obri el
              selector de drets: l'enllaç treia la persona de l'editor. La
              classe és la de l'enllaç (es veu igual) i el nom accessible
              comença pel text visible. data-sdp-drets és el destí estable del
              focus (UniversalEditorShell, DESTINS_FOCUS). */}
          {copyright && (
            <p className="sp-card-copyright page-title-copyright">
              {typeof onCanviaCopyright === 'function' ? (
                <button type="button" className="sp-card-copyright__enllac" data-sdp-drets=""
                  aria-label={nomDelBotoDeDrets(copyright)} onClick={onCanviaCopyright}>{copyright}</button>
              ) : LinkComponent === 'a' ? (
                <a href={RUTA_DRETS_AUTOR} className="sp-card-copyright__enllac">{copyright}</a>
              ) : (
                <LinkComponent to={RUTA_DRETS_AUTOR} className="sp-card-copyright__enllac">{copyright}</LinkComponent>
              )}
            </p>
          )}
        </header>
      )}

      {/* Traductor Sobirà · L'avís, entre el títol i el cos: «Traduint…» o
          «Traduït automàticament del valencià · Veure l'original». Sense
          traducció no es pinta res (Llei del Píxel). */}
      {ambTraductor ? (
        <AvisTraduccio llengua={traduccio.llengua} carregant={traduccio.carregant} onOriginal={traduccio.original} />
      ) : null}

      {/* L'original no es desmunta mai: amb una traducció a la vista s'amaga
          (hidden) i conserva el seu estat; la traducció és un article germà
          amb el seu lang. Sense traducció, el DOM és el de sempre. */}
      <article className="content-wrapper" ref={containerRef} hidden={traduida ? true : undefined}>
        {(subtitol || lead) && (
          <div className="page-intro">
            {subtitol && <h2>{subtitol}</h2>}
            {lead && <p className="lead">{lead}</p>}
          </div>
        )}
        {children}
      </article>
      {traduida ? (
        <article className="content-wrapper sdp-traduccio-cos" ref={traduccioRef} lang={traduida.lang}>
          <CosTraduit blocs={traduida.blocs} />
        </article>
      ) : null}
      {/* Esmena 2 (261007_1645) · El peu de la pàgina, l'últim fill i sempre en
          esta posició: l'article no canvia de lloc i el cos que s'escriu
          (TipTap) no es remunta quan el peu apareix o canvia. */}
      {peuDePagina ? (
        <section className="sdp-pagina-peu" aria-label={etiquetaPeuDePagina || undefined}>
          {peuDePagina}
        </section>
      ) : null}
      </div>

      {/* L'Índex llig el cos que es veu: la traducció o l'original.
          Correcció T2 · Traduïda, l'Índex no escriu ?seccio=: el slug seria
          el del text traduït, que un enllaç copiat (sempre en l'original) no
          troba, i canviar la consulta canvia la clau de useTraduccioPagina i
          tornaria la pàgina a l'original. La URL conserva la secció d'abans. */}
      <TableOfContentsDrawer isOpen={isTocOpen} onClose={() => setIsTocOpen(false)}
        contentRef={traduida ? traduccioRef : containerRef}
        idPrefix={tocIdPrefix} nivellMaxIndex={nivellMaxIndex} onSeccio={traduida ? null : escriuSeccioUrl} />
    </>
  );
}

/* Una portada pujada és una referència opaca: només el port la pot
   convertir en URL. Mentre es resol, o si falla, no es demana cap imatge.
   La resta de fonts conserva la resolució síncrona de l'amfitrió. */
export function ImatgeDePortada({ src, ...props }) {
  const ref = esMitjaOpac(src) ? src.trim().replace(/^sdp-media:/i, 'sdp-media:') : '';
  const { url } = useResolvedAssetState(ref);
  const font = ref ? (!esMitjaOpac(url) && isSafeAsset(url) ? url : '') : resolveAsset(src);
  return font ? <img {...props} src={font} /> : null;
}

/* Norma del Mestre, 261004 (prompt 261004_1108, logotips) · Un src de
   logotip: un text no buit, o res. */
const srcDeLogo = (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : null);

/* El descriptor `logoEntitat` net ({ clar, fosc, alt }), o null si no porta
   cap imatge clara: llavors és com si no n'hi haguera. */
function logoDescrit(logo) {
  if (!logo || typeof logo !== 'object') return null;
  const clar = srcDeLogo(logo.clar);
  if (!clar) return null;
  return { clar, fosc: srcDeLogo(logo.fosc), alt: typeof logo.alt === 'string' ? logo.alt : '' };
}

/* Correcció final (ordre del Mestre, 261004; risc de Safari 16 en el salt de
   ?seccio=) · La mida natural de l'SVG del logotip de Sóc de Poble: viewBox
   800x208 (el negre) i 3334x867 (el blanc), 300x78 en px CSS. Amb width i
   height el navegador reserva el lloc del logotip abans de carregar-lo i la
   secció de la URL no salta quan arriba. El CSS continua manant l'ample
   (.page-title-logo: fins a 600px, i l'ample de la capçalera en pantalla
   estreta) amb height: auto, i un cop carregat val la proporció de l'SVG:
   els píxels finals són els d'abans. Només per als dos fitxers de Sóc de
   Poble: el d'una altra entitat té la seua mida, que ací no sabem.
   Onada 8 (261009) · Ara són PNG de 985x256, amb la mateixa proporció. Els
   SVG d'abans (MARQUES_SVG_ANTIGUES) continuen portant la seua mida: una
   pàgina desada amb ells no salta. */
const MIDA_NATURAL_LOGO_SDP = Object.freeze({ width: '300', height: '78' });
function midaNaturalDelLogo(clar, fosc) {
  const sdp = DEFAULT_AUTHOR.logo;
  const esLaMarca = (src, ara, antic) => src === ara || src === resolveAsset(antic);
  return esLaMarca(clar, sdp.clar, MARQUES_SVG_ANTIGUES.clar) && esLaMarca(fosc, sdp.fosc, MARQUES_SVG_ANTIGUES.fosc)
    ? MIDA_NATURAL_LOGO_SDP
    : null;
}

/* El logotip del bloc del títol, abans de l'H1.
   · Amb `fosc`: dues imatges, la clara (light-only) i la fosca (dark-only).
     És el marcatge de sempre del logotip de Sóc de Poble: el mateix ordre
     d'atributs i les mateixes classes (la mida la dona .page-title-logo:
     fins a 600px d'ample, i a l'ample de la capçalera en pantalla estreta).
     Derogat (ordre del Mestre, 261004): ja no és byte a byte el d'abans, el
     de Sóc de Poble porta al final width i height (la seua mida natural).
   · Sense `fosc`: una sola imatge per als dos temes, el logo_url d'una
     altra entitat (sovint quadrat). page-title-logo--entitat la limita a
     600px d'alt (fins a 600x600, skill sdp-universal-page §1.D) i no envia
     cap Referer, com l'avatar de la boina (BarraTaronja).
   resolveAsset és idempotent sobre el que ja ha resolt: un src resolt
   (DEFAULT_AUTHOR.logo, useResolvedAsset) no canvia. */
function LogoDeCapcalera({ clar, fosc, alt }) {
  if (fosc) {
    const srcClar = resolveAsset(clar);
    const srcFosc = resolveAsset(fosc);
    const mida = midaNaturalDelLogo(srcClar, srcFosc);
    return (
      <>
        <img alt={alt} className="page-title-logo light-only" src={srcClar} width={mida?.width} height={mida?.height} />
        <img alt={alt} className="page-title-logo dark-only" src={srcFosc} width={mida?.width} height={mida?.height} />
      </>
    );
  }
  return <img alt={alt} className="page-title-logo page-title-logo--entitat" src={resolveAsset(clar)} referrerPolicy="no-referrer" />;
}

/* Norma del Mestre, 261004 (prompt 261004_1108, línies 66-69 i T2) · Un
   sdp-media:// és una referència opaca: només la resol el port. */
const esDelPort = (src) => src.startsWith('sdp-media://');

/* El descriptor `avatarAutor` net ({ src, alt, onCanvia }), o null si no
   porta cap imatge que es puga pintar: un src buit, o una adreça que no és
   segura ni abans ni després de resoldre-la (esAvatarSegur). Un sdp-media://
   passa: el resol AvatarDeCapcalera. Mai la marca de Sóc de Poble
   (esMarcaDeLEntitat), que es pintava com a avatar redó de 300px.
   Relleu 261007 («Límits» §5) · esAvatarSegur, camiDe i esMarcaDeLEntitat
   vivien ací, sense exportar, i el detall i el Mercat en portaven còpies:
   ara són d'UniversalUtils.js, amb el mateix cos (DOM idèntic). */
function avatarDescrit(avatar) {
  if (!avatar || typeof avatar !== 'object') return null;
  const src = srcDeLogo(avatar.src);
  if (!src || (!esDelPort(src) && (!esAvatarSegur(src) || esMarcaDeLEntitat(src)))) return null;
  return {
    src,
    alt: typeof avatar.alt === 'string' ? avatar.alt : '',
    ...clausDeLAvatar(avatar)
  };
}

/* Les claus d'acció d'un descriptor `avatarAutor`, netes.
   Contracte-1 (261008) · Les píndoles de davall: un text buit o que no és
   text és com si no n'hi haguera (srcDeLogo: text net, o null).
   Línia I1 (pla 261008_1201) · `ajuda`, el mateix criteri que les
   etiquetes; `pujant`, només amb true (com senseLogo): un text o un 1 no
   desactiven res. */
function clausDeLAvatar(avatar) {
  return {
    onCanvia: typeof avatar.onCanvia === 'function' ? avatar.onCanvia : null,
    etiquetaCanvia: srcDeLogo(avatar.etiquetaCanvia),
    onLleva: typeof avatar.onLleva === 'function' ? avatar.onLleva : null,
    etiquetaLleva: srcDeLogo(avatar.etiquetaLleva) || ETIQUETA_LLEVA_AVATAR,
    ajuda: srcDeLogo(avatar.ajuda),
    pujant: avatar.pujant === true
  };
}

/* Correcció de la revisió (261008, CONTRACTE-1) · Un `avatarAutor` amb una
   referència que avatarDescrit no deixa pintar (la marca de Sóc de Poble,
   una adreça que no és segura): sense l'avatar, qui el pot canviar es
   quedava sense cap control. Ara, les píndoles soles (filaDeLAvatar), també
   la de llevar, perquè la referència es puga buidar. Sense cap referència
   (src buit: la pàgina hi posa la seua ranura) o sense les claus noves, null:
   el DOM de sempre. */
function accionsDAvatarNoPintable(avatar) {
  if (!avatar || typeof avatar !== 'object' || !srcDeLogo(avatar.src)) return null;
  const claus = clausDeLAvatar(avatar);
  return teFilaDeLAvatar(claus) ? <FilaDeLAvatarSola {...claus} /> : null;
}

/* Correcció de la revisió de la línia I1 (261008) · Les píndoles soles en un
   component propi: l'id de la línia d'ajuda (useId) només es demana quan la
   fila es pinta, no a cada PageFrame. */
function FilaDeLAvatarSola(claus) {
  const id = useId();
  return filaDeLAvatar({ ...claus, idAjuda: `${id}-ajuda` });
}

/* El nom del botó de l'avatar quan la pàgina és de qui mira. */
export const ETIQUETA_CANVIA_AVATAR = 'Canvia la teua imatge';
/* Contracte-1 (261008) · El text de la píndola que lleva l'avatar, si qui
   passa onLleva no en dona cap. */
export const ETIQUETA_LLEVA_AVATAR = "Llevar l'avatar";

/* Contracte-1 (261008) · Una píndola de text davall de l'avatar: la pell de
   les píndoles de l'editor (.sdp-classificacio-pindola amb la píndola buida
   de dins, modules.css), amb la seua icona decorativa.
   Línia I1 (pla 261008_1201) · Amb `pujant`, disabled i aria-busy="true":
   mentre la imatge puja no es pot canviar ni llevar. Sense, cap atribut nou
   (React no escriu disabled={false}).
   Correcció de la revisió de la línia I1 · `descritPer`: l'id de la línia
   d'ajuda (aria-describedby). Sense, cap atribut. */
function PindolaDeLAvatar({ icona: Icona, text, onClick, pujant = false, descritPer = undefined }) {
  return (
    <button type="button" className="sdp-classificacio-pindola" onClick={onClick}
      disabled={pujant} aria-busy={pujant ? 'true' : undefined} aria-describedby={descritPer}>
      <span className="sp-card-label sdp-badge-buit">
        <Icona aria-hidden="true" focusable="false" />
        <span className="sdp-classificacio-pindola__text">{text}</span>
      </span>
    </button>
  );
}

/* Contracte-1 (261008) · La fila de píndoles de davall de l'avatar: «canvia»
   amb onCanvia i etiquetaCanvia, «lleva» amb onLleva. Sense cap, null.
   Línia I1 (pla 261008_1201) · `ajuda`: l'últim fill de la fila, un
   p.sdp-camp__ajuda que ocupa una línia sencera davall de les píndoles
   (components.css). Sense cap píndola no es pinta: l'ajuda acompanya un
   control. `pujant` arriba a les dues píndoles.
   Correcció de la revisió de la línia I1 · `idAjuda` (de qui pinta la fila,
   amb useId): amb `ajuda`, la línia porta l'id i la píndola «canvia», la
   que tria la foto, la cita amb aria-describedby, com el Camp de Pedra Seca
   (formulari.jsx). «Llevar» no: el límit de la foto no li diu res. Sense
   `ajuda`, cap id ni cap atribut nou. */
const teFilaDeLAvatar = ({ onCanvia = null, etiquetaCanvia = null, onLleva = null }) => Boolean((onCanvia && etiquetaCanvia) || onLleva);

function filaDeLAvatar({ onCanvia = null, etiquetaCanvia = null, onLleva = null, etiquetaLleva = ETIQUETA_LLEVA_AVATAR, ajuda = null, pujant = false, idAjuda = null }) {
  if (!teFilaDeLAvatar({ onCanvia, etiquetaCanvia, onLleva })) return null;
  const descritPer = ajuda && idAjuda ? idAjuda : undefined;
  const canvia = onCanvia && etiquetaCanvia
    ? <PindolaDeLAvatar icona={Camera} text={etiquetaCanvia} onClick={onCanvia} pujant={pujant} descritPer={descritPer} /> : null;
  const lleva = onLleva ? <PindolaDeLAvatar icona={Trash2} text={etiquetaLleva} onClick={onLleva} pujant={pujant} /> : null;
  return (
    <div className="page-title-avatar-accions">
      {canvia}
      {lleva}
      {ajuda ? <p id={descritPer} className="sdp-camp__ajuda">{ajuda}</p> : null}
    </div>
  );
}

/* L'avatar redó del bloc del títol, centrat davant de l'H1: més menut que el
   logotip (--sdp-avatar-capcalera, 300px) i a l'ample de la capçalera en
   pantalla estreta (modules.css). La caixa reserva el lloc (aspect-ratio)
   abans que arribe la imatge. Un camí o una URL es resolen en el mateix
   render (resolveAsset); un sdp-media://, pel port (useResolvedAsset):
   mentre es resol queda la caixa buida i, si no es pot resoldre, no es pinta
   res. Sense Referer, com l'avatar de la boina. Amb onCanvia és un botó, amb
   la marca de la càmera: punxant-hi es canvia la imatge pel flux que ja
   existix (el passa la pàgina).
   Contracte-1 (261008) · Amb etiquetaCanvia o onLleva, davall de l'avatar
   (germà, abans de l'H1) un div.page-title-avatar-accions amb les píndoles:
   «canvia» crida el mateix onCanvia que l'avatar; «lleva», només si hi ha
   imatge pintada (mentre el port la resol no hi ha res a llevar). Sense
   cap píndola, l'avatar sol, com sempre.
   Correcció de la revisió (261008, CONTRACTE-1) · Sense imatge i sense res a
   esperar (el port torna 'missing', 'error' o 'unsupported', o la resol a la
   marca), abans no es pintava res i qui la podia canviar es quedava sense
   control: ara, amb les claus noves, les píndoles soles, i «lleva» també,
   perquè la referència trencada es puga buidar. Sense, res, com sempre.
   Línia I1 (pla 261008_1201) · `ajuda` i `pujant` van a la fila en tots dos
   camins. L'avatar-botó no canvia: la guarda de la pujada és del
   consumidor (useImatgeDeFitxa).
   Correcció de la revisió de la línia I1 · Amb la línia d'ajuda pintada,
   l'avatar-botó (que també tria la foto) la cita amb aria-describedby, com
   la píndola «canvia». Sense ajuda, cap atribut nou. */
/* Encàrrec d'harmonització (261018) · Exportat: el Perfil el pinta dins del
   desplegable «Edició avançada» (UniversalEditorShell · identitatEdicioAvancada)
   en lloc de damunt de l'H1. El mateix component, cap còpia. */
export function AvatarDeCapcalera({ src, alt, onCanvia, etiquetaCanvia = null, onLleva = null, etiquetaLleva = ETIQUETA_LLEVA_AVATAR, ajuda = null, pujant = false }) {
  const idAjuda = `${useId()}-ajuda`;
  const delPort = esDelPort(src);
  const resolucio = useResolvedAssetState(delPort ? src : '');
  const url = delPort ? resolucio.url : resolveAsset(src);
  // Correcció dels verificadors (261004) · tampoc si el port resol la marca de l'entitat.
  const imatge = url && isSafeAsset(url) && !esMarcaDeLEntitat(url)
    ? <img className="page-title-avatar__imatge" src={url} alt={alt} decoding="async" referrerPolicy="no-referrer" />
    : null;
  if (!imatge && !(delPort && resolucio.isLoading)) return filaDeLAvatar({ onCanvia, etiquetaCanvia, onLleva, etiquetaLleva, ajuda, pujant, idAjuda });
  const accions = filaDeLAvatar({ onCanvia, etiquetaCanvia, onLleva: imatge ? onLleva : null, etiquetaLleva, ajuda, pujant, idAjuda });
  const avatar = onCanvia ? (
    <button type="button" className="page-title-avatar page-title-avatar--canvia" aria-label={ETIQUETA_CANVIA_AVATAR}
      aria-describedby={accions && ajuda ? idAjuda : undefined} onClick={onCanvia}>
      {imatge}
      <span className="page-title-avatar__marca" aria-hidden="true">
        <Camera size={24} focusable="false" />
      </span>
    </button>
  ) : <div className="page-title-avatar">{imatge}</div>;
  if (!accions) return avatar;
  return (
    <>
      {avatar}
      {accions}
    </>
  );
}
