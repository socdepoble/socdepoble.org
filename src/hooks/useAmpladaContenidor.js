/**
 * useAmpladaContenidor.js — l'amplada d'un contenidor i la seua unitat em.
 *
 * Fase visual del calendari (prompt 261001_0445) · Les vistes decidixen
 * quantes columnes pinten per l'amplada del SEU contenidor, no per la del
 * viewport: la closca (AppGridShell) i l'amfitrió (WordPress, Sollutia) els
 * donen caixes de qualsevol mida. @container no és de la base canònica
 * (Chrome 100, Firefox 100), i per això mesura el JavaScript: ResizeObserver
 * i, si no n'hi ha, l'event resize de la finestra (el patró d'App.jsx). L'em
 * és el font-size calculat del node: dins del shadow root d'un amfitrió, el
 * rem és el de la pàgina aliena i no servix de llindar.
 *
 * useAmpladaContenidor(ref) → { amplada, em }. Mesura en useLayoutEffect,
 * abans de pintar: no hi ha cap primer fotograma amb el mode equivocat.
 * amplada és null mentre no es coneix (abans de muntar, en jsdom o dins d'un
 * display: none), i el consumidor tria llavors el mode ample, el de sempre.
 *
 * esEstret(mida, llindarEm) → cert només amb una amplada coneguda per davall
 * del llindar (en em del contenidor).
 */
import { useLayoutEffect, useState } from 'react';

const EM_PER_DEFECTE = 16;

function mesura(node) {
  const amplada = node.getBoundingClientRect().width || node.clientWidth || 0;
  const em = parseFloat(window.getComputedStyle(node).fontSize) || EM_PER_DEFECTE;
  return { amplada: amplada > 0 ? amplada : null, em };
}

export function useAmpladaContenidor(ref) {
  const [mida, setMida] = useState({ amplada: null, em: EM_PER_DEFECTE });
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const actualitza = () => {
      const nova = mesura(node);
      setMida((abans) => (abans.amplada === nova.amplada && abans.em === nova.em ? abans : nova));
    };
    actualitza();
    if (typeof ResizeObserver === 'function') {
      const observador = new ResizeObserver(actualitza);
      observador.observe(node);
      return () => observador.disconnect();
    }
    window.addEventListener('resize', actualitza);
    return () => window.removeEventListener('resize', actualitza);
  }, [ref]);
  return mida;
}

export const esEstret = ({ amplada, em } = {}, llindarEm) =>
  typeof amplada === 'number' && amplada > 0 && amplada / (em || EM_PER_DEFECTE) < llindarEm;
