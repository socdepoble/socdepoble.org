import { useCallback, useEffect, useRef, useState } from 'react';

/* VIS-03 · La posició de lectura de cada avantpassat desplaçable de l'element (la cadena de pares
   del mateix element, no el document). Es guarda abans que la reserva el traga del flux. */
const desaDesplacaments = (element) => {
  const desats = [];
  for (let pare = element?.parentElement; pare; pare = pare.parentElement) desats.push([pare, pare.scrollTop, pare.scrollLeft]);
  return desats;
};

/** El pare compost travessa el host del Web Component, també quan l'arrel pròpia és tancada. */
const pareCompost = node => node?.assignedSlot ?? node?.parentElement ?? node?.getRootNode?.().host ?? null;
const dinsDe = (element, node) => {
  for (let actual = node; actual; actual = pareCompost(actual)) if (actual === element) return true;
  return false;
};
const disponible = node => {
  if (!node?.isConnected || node.matches(':disabled')) return false;
  for (let actual = node; actual; actual = pareCompost(actual)) {
    if (actual.matches('[hidden],[inert],[aria-hidden="true"],dialog:not([open])')
      || getComputedStyle(actual).display === 'none') return false;
  }
  return !['hidden', 'collapse'].includes(getComputedStyle(node).visibility);
};
const actiuDe = arrel => {
  let actiu = arrel.activeElement;
  while (actiu?.shadowRoot?.activeElement) actiu = actiu.shadowRoot.activeElement;
  return actiu;
};
/** Controls visibles en ordre de tabulació: positius primer, empat en ordre compost. */
const TABULABLES = 'button,input,select,textarea,summary,a[href],[tabindex],[contenteditable],audio[controls],video[controls],iframe,object,embed';
const tabulable = node => {
  if (node.matches('input[type="hidden"]')) return false;
  if (node.hasAttribute('tabindex')) return node.tabIndex >= 0;
  if (node.hasAttribute('contenteditable') && !['false', 'inherit'].includes(node.getAttribute('contenteditable').toLowerCase())) {
    // Només l'arrel d'edició entra en Tab; un editor niat requerix tabindex explícit.
    for (let pare = pareCompost(node); pare; pare = pareCompost(pare)) {
      if (pare.hasAttribute('contenteditable')) return pare.getAttribute('contenteditable').toLowerCase() === 'false';
    }
    return true;
  }
  return node.tabIndex >= 0;
};
const controlsDe = element => {
  const controls = [];
  const visita = node => {
    if (node !== element && node.matches(TABULABLES) && tabulable(node)
      && disponible(node) && node.getClientRects().length) controls.push(node);
    const fills = node.localName === 'slot' && node.assignedElements?.().length
      ? node.assignedElements({ flatten: true }) : (node.shadowRoot ?? node).children;
    for (const fill of fills) visita(fill);
  };
  visita(element);
  // Un grup de ràdios és un únic punt de Tab; les fletxes les gestiona el navegador.
  return controls.filter(node => {
    if (!node.matches('input[type="radio"]') || !node.name) return true;
    const grup = controls.filter(c => c.matches('input[type="radio"]') && c.name === node.name
      && c.form === node.form && c.getRootNode() === node.getRootNode());
    return node === (grup.find(c => c.checked) ?? grup[0]);
  }).sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity));
};
/** Els atributs que la contenció posa a l'element mentre és a pantalla completa (i restaura en eixir). */
const ATRIBUTS_MODALS = [['tabindex', '-1'], ['role', 'dialog'], ['aria-modal', 'true']];
/** V2C-01 · L'element que l'arrel de l'element té a pantalla completa. Dins d'un shadow root
    (el tancat de <soc-de-poble>), `document.fullscreenElement` retorna l'amfitrió; l'arrel pròpia
    (DocumentOrShadowRoot) retorna l'element de veritat. */
const enPantallaCompleta = (element) => {
  const arrel = element?.getRootNode?.();
  const fs = arrel && 'fullscreenElement' in arrel ? arrel.fullscreenElement : document.fullscreenElement;
  return Boolean(element) && fs === element;
};

/** One fullscreen owner, with an accessible CSS fallback when the API is unavailable. */
export function useElementFullscreen() {
  const elementRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const [native, setNative] = useState(false);
  const restoreFocus = useRef(null);
  const restoreScroll = useRef([]);
  const pending = useRef(false);
  const mounted = useRef(true);
  const isFullscreen = fallback || native;
  useEffect(() => {
    mounted.current = true;
    const element = elementRef.current;
    const changed = () => setNative(enPantallaCompleta(elementRef.current));
    document.addEventListener('fullscreenchange', changed);
    return () => {
      mounted.current = false;
      document.removeEventListener('fullscreenchange', changed);
      if (enPantallaCompleta(element)) document.exitFullscreen?.().catch?.(() => {});
    };
  }, []);
  useEffect(() => {
    if (!fallback) return undefined;
    /* LLEI_06 · La UI no toca el document amfitrió: la capa fixa de la reserva
       (components.css, [data-element-fullscreen].is-fullscreen) té el seu propi
       desplaçament amb overscroll-behavior: contain.
       Onada R11 · Un avantpassat amb container-type (la UniversalPage) fa de bloc
       contenidor dels fills fixos i deixava la reserva davall de les barres. Si el
       navegador té l'API popover, l'element puja a la capa superior (top layer),
       que no depén de cap avantpassat; sense l'API, es queda com abans. */
    const element = elementRef.current;
    let promogut = false;
    if (element && typeof element.showPopover === 'function' && !element.hasAttribute('popover')) {
      element.setAttribute('popover', 'manual');
      try { element.showPopover(); promogut = true; } catch { element.removeAttribute('popover'); }
    }
    const close = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setFallback(false); }
    };
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('keydown', close);
      if (promogut) {
        try { element.hidePopover(); } catch { /* ja era fora de la capa superior */ }
        element.removeAttribute('popover');
      }
      /* VIS-03 · El focus que camina dins de la capa superior desplaça els pares de darrere:
         en eixir, cada pare torna on la persona llegia abans d'entrar. */
      for (const [pare, dalt, esquerra] of restoreScroll.current) {
        if (pare.scrollTop !== dalt) pare.scrollTop = dalt;
        if (pare.scrollLeft !== esquerra) pare.scrollLeft = esquerra;
      }
      restoreScroll.current = [];
    };
  }, [fallback]);
  useEffect(() => {
    if (!isFullscreen) return undefined;
    /* A11Y-01 · Contenció del focus mentre l'element és a pantalla completa (reserva o API nativa).
       La pàgina de darrere no es veu però continua viva: el focus no hi pot anar. Sense tocar el
       document amfitrió (LLEI_06):
        · l'element és enfocable (tabindex -1) i modal per als lectors (role dialog + aria-modal):
          un clic en una zona sense control (la vista, el fons) deixa el focus dins;
        · Tab i Maj+Tab giren dins: del darrer al primer, del primer al darrer, i si el focus és
          a l'element mateix o fora, al primer (o al darrer amb Maj+Tab). Onada R30 · FOCUS-01 ·
          l'ordre és el del navegador (tabindex positiu primer, després l'ordre compost, que
          travessa shadow roots oberts i slots) i el focus de l'activador torna en eixir, també
          de la pantalla completa nativa;
        · si el focus ix (focusout cap a fora, o cap a enlloc perquè el control s'ha amagat),
          torna al primer control. L'arrel és la de l'element (el document o el shadow root
          tancat de <soc-de-poble>), i el seu activeElement diu on és el focus de veritat. */
    const element = elementRef.current;
    if (!element) return undefined;
    const arrel = element.getRootNode?.() ?? document;
    const dins = node => dinsDe(element, node);
    const abans = ATRIBUTS_MODALS.map(([nom]) => [nom, element.getAttribute(nom)]);
    for (const [nom, valor] of ATRIBUTS_MODALS) element.setAttribute(nom, valor);
    const entra = () => { if (disponible(element)) (controlsDe(element)[0] ?? element).focus(); };
    const gira = (event) => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const controls = controlsDe(element);
      if (!disponible(element)) return;
      const actiu = event.composedPath?.()[0] ?? actiuDe(arrel);
      event.preventDefault();
      if (!controls.length) { element.focus(); return; }
      /* Onada R30 · FOCUS-02 · Tab ara el mou sempre el hook (no només als extrems). Si el
         navegador refusa el focus d'un candidat que el filtre no ha sabut descartar, es prova el
         següent: Tab no es queda mai encallat en un control (WCAG 2.1.2). */
      const index = controls.indexOf(actiu);
      const pas = event.shiftKey ? -1 : 1;
      const inici = index < 0 ? (event.shiftKey ? 0 : controls.length - 1) : index;
      for (let salt = 1; salt <= controls.length; salt += 1) {
        const candidat = controls[(((inici + pas * salt) % controls.length) + controls.length) % controls.length];
        candidat.focus();
        if (actiuDe(arrel) === candidat) return;
      }
      element.focus();
    };
    /* Es mira quan el canvi de focus ha acabat. Si la finestra sencera ha perdut el focus (canvi
       d'aplicació), el control continua actiu a l'arrel i no es toca. */
    let revisio = 0;
    const revisa = () => {
      clearTimeout(revisio);
      revisio = setTimeout(() => { revisio = 0; if (!dins(actiuDe(arrel))) entra(); }, 0);
    };
    // El focus ix de l'element (cap a fora o cap a enlloc)…
    const vigila = (event) => { if (!dins(event.relatedTarget)) revisa(); };
    // …o entra en la pàgina de darrere sense haver passat per l'element (p. ex., per codi).
    const vigilaPagina = (event) => { if (!dins(event.composedPath?.()[0] ?? event.target)) revisa(); };
    arrel.addEventListener('keydown', gira);
    element.addEventListener('focusout', vigila);
    document.addEventListener('focusin', vigilaPagina);
    // En entrar, si el focus no és dins (Safari no enfoca el botó amb el clic), passa al primer control.
    if (!dins(actiuDe(arrel))) entra();
    return () => {
      clearTimeout(revisio);
      arrel.removeEventListener('keydown', gira);
      element.removeEventListener('focusout', vigila);
      document.removeEventListener('focusin', vigilaPagina);
      for (const [nom, valor] of abans) {
        if (valor === null) element.removeAttribute(nom); else element.setAttribute(nom, valor);
      }
      if (restoreFocus.current && disponible(restoreFocus.current)) restoreFocus.current.focus();
      restoreFocus.current = null;
    };
  }, [isFullscreen]);
  const toggleFullscreen = useCallback(async () => {
    if (pending.current) return;
    const element = elementRef.current;
    if (!element) return;
    if (fallback) { setFallback(false); return; }
    pending.current = true;
    try {
      if (enPantallaCompleta(element)) {
        await document.exitFullscreen();
      } else {
        restoreFocus.current = actiuDe(element.getRootNode?.() ?? document);
        restoreScroll.current = desaDesplacaments(element);
        if (typeof element.requestFullscreen !== 'function') {
          setFallback(true);
        } else {
          try { await element.requestFullscreen(); }
          catch { if (mounted.current) setFallback(true); }
        }
      }
    } finally { pending.current = false; }
  }, [fallback]);
  return { elementRef, isFullscreen, toggleFullscreen };
}
