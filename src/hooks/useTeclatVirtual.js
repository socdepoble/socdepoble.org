/**
 * Onada R28 · Empatia nativa amb el teclat virtual (iOS WKWebView + Android Edge-to-Edge).
 *
 * En iOS WKWebView (capacitor.config.json · contentInset: "never") i iOS Safari,
 * quan puja el teclat de pantalla l'alçada del layout (100% / innerHeight) NO
 * s'encongix: només baixa window.visualViewport.height i el compositor del Xat,
 * l'editor de Notes o els camps de Registre quedaven tapats davall del teclat.
 * A més, en les rutes no immersives (/notes, /registre, /cerca, /mur), la barra
 * inferior fixa (nav.mobile-nav, 96px) es quedava damunt del teclat i menjava
 * quasi mitja pantalla útil.
 *
 * Contracte d'aquest hook:
 *   1. Només intervé quan l'arrel és ama del document (esAmaDelDocument): cap
 *      efecte col·lateral sobre un <soc-de-poble> incrustat en WordPress/Sollutia.
 *   2. Si l'usuari fa zoom amb dos dits (visualViewport.scale > 1.05, WCAG 1.4.4),
 *      no retalla mai l'alçada ni toca res.
 *   3. Quan un camp d'escriptura de dins de l'arrel té el focus i el teclat
 *      ocupa pantalla (oclusió visualViewport >= 100px o caiguda d'innerHeight >= 120px
 *      en dispositiu compacte/tàctil):
 *        · Marca data-sdp-teclat="obert" a l'arrel (amaga nav.mobile-nav i posa
 *          --sdp-alt-nav-mobil: 0px).
 *        · Si hi ha oclusió de visualViewport (iOS), marca data-sdp-teclat-vv i
 *          escriu --teclat-vv-alt amb l'alçada real visible, anul·lant la reserva del
 *          Home Indicator (que ja queda cobert pel teclat) i corregint qualsevol
 *          desplaçament involuntari del document per mantindre la barra negra fixa.
 *        · Revela suaument el camp enfocat dins del seu contenidor amb scroll intern.
 */
import { useEffect } from 'react';

export const ATRIBUT_TECLAT = 'data-sdp-teclat';
export const ATRIBUT_TECLAT_VV = 'data-sdp-teclat-vv';
export const VAR_VV_ALT = '--teclat-vv-alt';

const TIPUS_INPUT_NO_TECLAT = new Set([
  'button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'range', 'color', 'image', 'hidden',
]);

const LLINDAR_OCLUSIO_OBRI = 100;
const LLINDAR_LAYOUT_OBRI = 120;
const MARGE_REVELACIO_PX = 16;

export function campEditableEnfocat(node, arrel) {
  if (!node || !arrel || typeof node.closest !== 'function' || !arrel.contains(node)) return null;
  const candidat = node.closest('textarea, select, input, [contenteditable="true"], [contenteditable=""], .ProseMirror');
  if (!candidat || !arrel.contains(candidat)) return null;
  if (candidat.disabled || candidat.readOnly) return null;
  if (candidat.getAttribute?.('contenteditable') === 'false') return null;
  if (candidat.tagName === 'INPUT') {
    const tipus = String(candidat.getAttribute('type') || candidat.type || 'text').toLowerCase();
    if (TIPUS_INPUT_NO_TECLAT.has(tipus)) return null;
  }
  return candidat;
}

function contenidorDesplacable(inici, arrel) {
  let actual = inici?.parentElement || null;
  while (actual && actual !== arrel && actual !== document.body) {
    const estil = window.getComputedStyle(actual);
    if ((estil.overflowY === 'auto' || estil.overflowY === 'scroll') && actual.scrollHeight > actual.clientHeight + 2) {
      return actual;
    }
    actual = actual.parentElement;
  }
  return null;
}

/* Onada R28 · Prova real a l'iPhone · En un editor ric llarg (.ProseMirror) el marc fa milers de píxels:
   el que ha de quedar a la vista és el cursor. Sense selecció dins del camp, no es mou res. */
function rectDelCursor(camp) {
  const seleccio = typeof window.getSelection === 'function' ? window.getSelection() : null;
  if (!seleccio || !seleccio.rangeCount) return null;
  const rang = seleccio.getRangeAt(0);
  if (!rang || !camp.contains(rang.endContainer)) return null;
  const rects = typeof rang.getClientRects === 'function' ? rang.getClientRects() : null;
  const rect = rects && rects.length ? rects[rects.length - 1]
    : (typeof rang.getBoundingClientRect === 'function' ? rang.getBoundingClientRect() : null);
  if (!rect || (rect.top === 0 && rect.bottom === 0)) return null;
  return rect;
}

function revelaCampDinsDelVisor(camp, arrel) {
  if (!camp || typeof camp.getBoundingClientRect !== 'function') return;
  const esEditorRic = camp.classList?.contains('ProseMirror') || camp.getAttribute?.('contenteditable') === 'true';
  const visor = contenidorDesplacable(camp, arrel);
  if (!visor) return;
  const rectCamp = esEditorRic ? rectDelCursor(camp) : camp.getBoundingClientRect();
  if (!rectCamp) return;
  const rectVisor = visor.getBoundingClientRect();
  if (rectVisor.height <= 0) return;
  const excésBaix = rectCamp.bottom + MARGE_REVELACIO_PX - rectVisor.bottom;
  if (excésBaix > 0) {
    visor.scrollTop += excésBaix;
  } else if (rectCamp.top - MARGE_REVELACIO_PX < rectVisor.top) {
    visor.scrollTop -= (rectVisor.top - (rectCamp.top - MARGE_REVELACIO_PX));
  }
}

export function useTeclatVirtual(arrelRef, amaDelDocument = true) {
  useEffect(() => {
    const arrel = arrelRef?.current;
    if (!arrel || !amaDelDocument || typeof window === 'undefined' || window.__SDP_EMBEDDED__) return undefined;
    try {
      if (window.self !== window.top) return undefined;
    } catch {
      return undefined;
    }

    let rafId = 0;
    let rafRevelacio = 0;
    let revisaRepos = false;
    let ultimAmple = window.innerWidth || 0;
    let alcadaRepos = window.innerHeight || 0;

    const neteja = () => {
      cancelAnimationFrame(rafRevelacio);
      arrel.removeAttribute(ATRIBUT_TECLAT);
      arrel.removeAttribute(ATRIBUT_TECLAT_VV);
      arrel.style.removeProperty(VAR_VV_ALT);
    };

    const actualitza = () => {
      const reposPotCanviar = revisaRepos;
      revisaRepos = false;
      const vv = window.visualViewport || null;
      const ampleActual = window.innerWidth || 0;
      const altActual = window.innerHeight || 0;

      /* Canvi d'orientació o redimensionament ample: reinicia l'alçada de referència. */
      if (Math.abs(ampleActual - ultimAmple) > 48) {
        ultimAmple = ampleActual;
        alcadaRepos = altActual;
      }

      /* Amb zoom de pinça actiu (WCAG 1.4.4), mai toquem l'alçada de la closca. */
      if (vv && typeof vv.scale === 'number' && vv.scale > 1.05) {
        neteja();
        return;
      }

      const arrelOmbra = arrel.getRootNode?.();
      const actiu = (arrelOmbra && 'activeElement' in arrelOmbra ? arrelOmbra.activeElement : null) || document.activeElement;
      const camp = campEditableEnfocat(actiu, arrel);

      if (!camp) {
        /* Un resize sense cap camp no és un teclat. Conservem la referència
           en un simple focusout: pot precedir el focus d'un altre camp mentre
           el teclat encara és obert. */
        if (reposPotCanviar || altActual > alcadaRepos) alcadaRepos = altActual;
        neteja();
        return;
      }

      /* Onada R28 · Prova real a l'iPhone (iOS 27, WKWebView): en enfocar un camp baix, WebKit desplaça el
         visor visual (offsetTop 396 px) i retalla innerHeight just eixa quantitat (874 → 478), de manera que
         innerHeight − (vv.height + offsetTop) donava 0 i el document sencer pujava davall de la Dynamic Island.
         I just després del retorn a dalt, WebKit avisa amb offsetTop 0 i innerHeight encara a 478: tampoc
         innerHeight servix de referència. L'alçada de disseny és la del contenidor de l'arrel (el nostre arbre,
         no el document amfitrió), que el teclat d'iOS no encongix; en Android el WebView s'encongix sencer,
         el contenidor també, l'oclusió és 0 i actua caigudaLayout. Sense contenidor mesurable (jsdom, ombra),
         innerHeight + offsetTop. */
      const altDisseny = arrel.parentElement?.clientHeight || (altActual + (vv?.offsetTop || 0));
      const oclusioVv = vv ? Math.max(0, Math.round(altDisseny - vv.height)) : 0;
      const esMobilOTactil = arrel.classList.contains('is-compact') || arrel.hasAttribute('data-sdp-tactil');
      const caigudaLayout = esMobilOTactil ? Math.max(0, Math.round(alcadaRepos - altActual)) : 0;

      const teclatObert = oclusioVv >= LLINDAR_OCLUSIO_OBRI || caigudaLayout >= LLINDAR_LAYOUT_OBRI;
      if (!teclatObert) {
        if (oclusioVv < 32 && altActual > alcadaRepos) alcadaRepos = altActual;
        neteja();
        return;
      }

      arrel.setAttribute(ATRIBUT_TECLAT, 'obert');

      if (oclusioVv >= LLINDAR_OCLUSIO_OBRI && vv) {
        /* En horitzontal poden quedar menys de 180px: no inventem espai
           davall del teclat. La closca mai excedix el visor mesurat. */
        const altVisible = Math.max(0, Math.floor(vv.height));
        arrel.setAttribute(ATRIBUT_TECLAT_VV, '');
        /* Onada R28 · El nom va literal (és VAR_VV_ALT): el Tractor Pedra Seca (LLEI_02) només dona per
           declarada una propietat que el JS fixa si setProperty en rep el nom escrit. */
        arrel.style.setProperty('--teclat-vv-alt', `${altVisible}px`);
        if (window.scrollY > 0) {
          window.scrollTo(0, 0);
        }
      } else {
        arrel.removeAttribute(ATRIBUT_TECLAT_VV);
        arrel.style.removeProperty(VAR_VV_ALT);
      }

      /* L'animació de visualViewport i el canvi de camp poden arribar abans
         del frame de revelació: cada actualització oberta el reprograma i
         cap resize pot cancel·lar-lo definitivament. */
      cancelAnimationFrame(rafRevelacio);
      rafRevelacio = requestAnimationFrame(() => revelaCampDinsDelVisor(camp, arrel));
    };

    const programaActualitzacio = (event) => {
      revisaRepos ||= event?.type === 'resize';
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(rafRevelacio);
      rafId = requestAnimationFrame(actualitza);
    };

    const vv = window.visualViewport || null;
    arrel.addEventListener('focusin', programaActualitzacio);
    arrel.addEventListener('focusout', programaActualitzacio);
    window.addEventListener('resize', programaActualitzacio);
    vv?.addEventListener('resize', programaActualitzacio);
    vv?.addEventListener('scroll', programaActualitzacio);

    return () => {
      cancelAnimationFrame(rafId);
      arrel.removeEventListener('focusin', programaActualitzacio);
      arrel.removeEventListener('focusout', programaActualitzacio);
      window.removeEventListener('resize', programaActualitzacio);
      vv?.removeEventListener('resize', programaActualitzacio);
      vv?.removeEventListener('scroll', programaActualitzacio);
      neteja();
    };
  }, [arrelRef, amaDelDocument]);
}
