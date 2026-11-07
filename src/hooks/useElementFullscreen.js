import { useCallback, useEffect, useRef, useState } from 'react';

/** One fullscreen owner, with an accessible CSS fallback when the API is unavailable. */
export function useElementFullscreen() {
  const elementRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const [native, setNative] = useState(false);
  const restoreFocus = useRef(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  const isFullscreen = fallback || native;
  useEffect(() => {
    mounted.current = true;
    const element = elementRef.current;
    const changed = () => setNative(document.fullscreenElement === elementRef.current);
    document.addEventListener('fullscreenchange', changed);
    return () => {
      mounted.current = false;
      document.removeEventListener('fullscreenchange', changed);
      if (document.fullscreenElement === element) document.exitFullscreen?.().catch?.(() => {});
    };
  }, []);
  useEffect(() => {
    if (!fallback) return undefined;
    /* LLEI_06 · La UI no toca el document amfitrió: la capa fixa de la reserva
       (components.css, [data-element-fullscreen].is-fullscreen) té el seu propi
       desplaçament amb overscroll-behavior: contain. */
    const close = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setFallback(false); }
      if (event.key !== 'Tab') return;
      const controls = [...elementRef.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')].filter((node) => node.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('keydown', close);
      restoreFocus.current?.focus();
    };
  }, [fallback]);
  const toggleFullscreen = useCallback(async () => {
    if (pending.current) return;
    const element = elementRef.current;
    if (!element) return;
    if (fallback) { setFallback(false); return; }
    pending.current = true;
    try {
      if (document.fullscreenElement === element) {
        await document.exitFullscreen();
      } else {
        restoreFocus.current = document.activeElement;
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
