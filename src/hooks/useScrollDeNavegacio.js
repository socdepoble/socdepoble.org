import { useCallback, useLayoutEffect, useRef } from 'react';
import { novaClauDeRuta } from '../app/contexts/historialDeRuta.js';

/** Refs nous de l'entrada Browser; MemoryRouter no crida este hook. */
export function useIdentitatDelDocument() {
  const inicial = useRef(null);
  inicial.current ??= { clau: novaClauDeRuta(), href: window.location.href };
  const accio = useRef('INITIAL');
  return [inicial, accio];
}

/** Captura síncrona abans que el router substituïsca el DOM de la ruta. */
export function useCapturaDeNavegacio() {
  const listeners = useRef(new Set());
  const captura = useCallback(() => { for (const listener of listeners.current) listener(); }, []);
  const subscriu = useCallback(listener => {
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, []);
  return [captura, subscriu];
}

const CONTAINED = 'sdp-universal-page-container--contained';
const GESTOS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

/** Només els dos desplaçadors de ruta del CSS. Cap taula, xat o diàleg intern. */
export function desplacadorDeNavegacio(content) {
  return [...(content?.children ?? [])].find(node => node.classList.contains(CONTAINED)
    && !node.hidden && node.style.display !== 'none') || content;
}

function posa(node, top) {
  if (!node) return;
  try { node.scrollTo?.({ top, behavior: 'instant' }); } catch { /* Safari sense instant. */ }
  node.scrollTop = top;
}

/** P0-44 · Posicions per entrada del router, només durant la vida de la
    instància. Espera geometria/càrregues reals; cap termini fals de 280 ms. */
export function useScrollDeNavegacio({ contentRef, pathname, search = '', hash = '', navegacio, subscriuAbansDeNavegar }) {
  const posicions = useRef(new Map());
  const actual = useRef(null);
  const pendent = useRef(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;
    const desa = event => {
      const current = actual.current;
      if (!current || current.clau == null || !current.pathname) return;
      const node = desplacadorDeNavegacio(content);
      if (event && event.target !== content && event.target !== node) return;
      if (event && pendent.current) return;
      const top = pendent.current?.top ?? node?.scrollTop;
      if (Number.isFinite(top)) posicions.current.set(current.clau, Math.max(0, top));
    };
    content.addEventListener('scroll', desa, { capture: true, passive: true });
    const unsubscribe = subscriuAbansDeNavegar?.(() => desa());
    return () => {
      content.removeEventListener('scroll', desa, true);
      unsubscribe?.(); pendent.current?.atura();
    };
  }, [contentRef, subscriuAbansDeNavegar]);

  useLayoutEffect(() => {
    pendent.current?.atura();
    const clau = navegacio?.clau;
    actual.current = { clau, pathname };
    const content = contentRef.current;
    if (!content || !pathname || clau == null || navegacio.accio === 'INITIAL') return undefined;
    // L'àncora existent governa el seu desplaçador, també en POP.
    if (hash || new URLSearchParams(search).has('seccio')) return undefined;
    const top = navegacio.accio === 'POP' ? posicions.current.get(clau) ?? 0 : 0;
    let cancelat = false, marc = null;
    const view = content.ownerDocument.defaultView;
    const gestos = content.parentElement || content;
    const observats = new Set();
    const programa = () => {
      if (cancelat || marc !== null) return;
      if (view?.requestAnimationFrame) marc = view.requestAnimationFrame(aplica);
      else aplica();
    };
    const mides = typeof ResizeObserver === 'function' ? new ResizeObserver(programa) : null;
    const aplica = () => {
      marc = null;
      if (cancelat || !content.isConnected) return;
      const node = desplacadorDeNavegacio(content);
      if (node !== content && content.scrollTop !== 0) posa(content, 0);
      if (node.scrollTop !== top) posa(node, top);
      // Els fills de mida natural reflectixen scrollHeight encara que el
      // viewport contained no canvie de mida quan arriba text o una imatge.
      const vius = new Set([content, node, ...node.children]);
      for (const old of observats) if (!vius.has(old)) { mides?.unobserve(old); observats.delete(old); }
      for (const element of vius) if (!observats.has(element)) { mides?.observe(element); observats.add(element); }
    };
    const mutacions = typeof MutationObserver === 'function' ? new MutationObserver(programa) : null;
    const atura = () => {
      if (cancelat) return;
      cancelat = true;
      if (marc !== null) view?.cancelAnimationFrame?.(marc);
      mutacions?.disconnect(); mides?.disconnect();
      for (const gest of GESTOS) gestos.removeEventListener(gest, atura, true);
      for (const event of ['load', 'error', 'loadedmetadata']) content.removeEventListener(event, programa, true);
      if (pendent.current?.atura === atura) pendent.current = null;
    };
    pendent.current = { top, atura };
    for (const gest of GESTOS) gestos.addEventListener(gest, atura, { capture: true, passive: true });
    for (const event of ['load', 'error', 'loadedmetadata']) content.addEventListener(event, programa, true);
    mutacions?.observe(content, { childList: true, subtree: true, characterData: true });
    aplica();
    return atura;
  }, [contentRef, pathname, search, hash, navegacio?.clau, navegacio?.accio]);
}
