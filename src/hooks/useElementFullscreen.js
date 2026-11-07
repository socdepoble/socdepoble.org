import { useCallback, useEffect, useRef, useState } from 'react';

/* VIS-03 · La posició de lectura de cada avantpassat desplaçable de l'element (la cadena de pares
   del mateix element, no el document). Es guarda abans que la reserva el traga del flux. */
const desaDesplacaments = (element) => {
  const desats = [];
  for (let pare = element?.parentElement; pare; pare = pare.parentElement) desats.push([pare, pare.scrollTop, pare.scrollLeft]);
  return desats;
};

/** Els controls on pot anar el focus amb Tab dins de l'element (visibles i actius). */
const TABULABLES = 'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,a[href],[tabindex="0"]';
const controlsDe = (element) => [...element.querySelectorAll(TABULABLES)].filter((node) => node.getClientRects().length);
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
      restoreFocus.current?.focus();
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
          a l'element mateix o fora, al primer (o al darrer amb Maj+Tab);
        · si el focus ix (focusout cap a fora, o cap a enlloc perquè el control s'ha amagat),
          torna al primer control. L'arrel és la de l'element (el document o el shadow root
          tancat de <soc-de-poble>), i el seu activeElement diu on és el focus de veritat. */
    const element = elementRef.current;
    if (!element) return undefined;
    const arrel = element.getRootNode?.() ?? document;
    const dins = (node) => Boolean(node) && (node === element || element.contains(node));
    const abans = ATRIBUTS_MODALS.map(([nom]) => [nom, element.getAttribute(nom)]);
    for (const [nom, valor] of ATRIBUTS_MODALS) element.setAttribute(nom, valor);
    const entra = () => (controlsDe(element)[0] ?? element).focus();
    const gira = (event) => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const controls = controlsDe(element);
      const actiu = arrel.activeElement;
      const primer = controls[0], darrer = controls.at(-1);
      if (!primer) { event.preventDefault(); element.focus(); return; }
      if (!dins(actiu) || actiu === element) { event.preventDefault(); (event.shiftKey ? darrer : primer).focus(); }
      else if (event.shiftKey && actiu === primer) { event.preventDefault(); darrer.focus(); }
      else if (!event.shiftKey && actiu === darrer) { event.preventDefault(); primer.focus(); }
    };
    /* Es mira quan el canvi de focus ha acabat. Si la finestra sencera ha perdut el focus (canvi
       d'aplicació), el control continua actiu a l'arrel i no es toca. */
    let revisio = 0;
    const revisa = () => {
      clearTimeout(revisio);
      revisio = setTimeout(() => { revisio = 0; if (!dins(arrel.activeElement)) entra(); }, 0);
    };
    // El focus ix de l'element (cap a fora o cap a enlloc)…
    const vigila = (event) => { if (!dins(event.relatedTarget)) revisa(); };
    // …o entra en la pàgina de darrere sense haver passat per l'element (p. ex., per codi).
    const vigilaPagina = (event) => { if (!dins(event.composedPath?.()[0] ?? event.target)) revisa(); };
    arrel.addEventListener('keydown', gira);
    element.addEventListener('focusout', vigila);
    document.addEventListener('focusin', vigilaPagina);
    // En entrar, si el focus no és dins (Safari no enfoca el botó amb el clic), passa al primer control.
    if (!dins(arrel.activeElement)) entra();
    return () => {
      clearTimeout(revisio);
      arrel.removeEventListener('keydown', gira);
      element.removeEventListener('focusout', vigila);
      document.removeEventListener('focusin', vigilaPagina);
      for (const [nom, valor] of abans) {
        if (valor === null) element.removeAttribute(nom); else element.setAttribute(nom, valor);
      }
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
        restoreFocus.current = (element.getRootNode?.() ?? document).activeElement;
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
