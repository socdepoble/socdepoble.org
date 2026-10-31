/**
 * useMenuEmergent.js — Ordre del Mestre (261007) · Correcció C9 · El
 * comportament ÚNIC dels menús emergents de Pedra Seca: el de Traduir
 * (universal/traduccio/MenuTraduir.jsx) i el de Comentar
 * (organismes/Comentar.jsx), que abans en portaven dues còpies.
 *  · En obrir-lo, el focus entra a la primera fila (`files`: el selector de
 *    les files del menú, menuitem o menuitemradio).
 *  · Un clic fora el tanca. L'Escape també el tanca, torna el focus al botó
 *    que l'obri (`botoRef`) i queda consumit: ni la pàgina ni l'amfitrió el
 *    reben dos vegades. Les escoltes van a l'arrel del node (getRootNode):
 *    dins del Shadow DOM de WordPress, l'arrel és la de la instància i no el
 *    document de l'amfitrió. No es tornen a posar a cada pintat: el focus no
 *    ha de saltar a la primera fila a mitja tria.
 *  · Les fletxes, Inici i Fi mouen el focus per les files.
 *  · `tria(valor)` tanca el menú, torna el focus al botó i crida
 *    onTria(valor).
 *  · `mostra`: l'espècimen del catàleg el pinta obert i quiet, sense furtar
 *    el focus, sense escoltar la pàgina (Disseny no té cap botó on tornar) i
 *    sense tria. Les fletxes continuen movent el focus.
 * Torna { ref, tria, mouFocus }: `ref` va al node role=menu i `mouFocus`, al
 * seu onKeyDown. El marcatge, les classes i la pell són de cada menú: el
 * hook no pinta res (Llei del Píxel).
 *  · Gauntlet 261030 (Fase 3, TC3.3; menu-traduir-tab-dins-del-menu) ·
 *    `tancaAmbTab` (opt-in; hui només el menú de Traduir): el patró de menú
 *    de l'APG de WAI-ARIA. Tab i Maj+Tab no es consumixen: el navegador mou
 *    el focus a la parada següent (o anterior) de la pàgina i, just després,
 *    el menú es tanca, sense tornar el focus al botó. Les files van amb
 *    tabIndex -1 (les mou el teclat amb les fletxes): el menú és una sola
 *    parada. Sense l'opció (Comentar, Moderació), com abans.
 */
import { useEffect, useRef } from 'react';

const PASSOS = Object.freeze({ ArrowDown: 1, ArrowUp: -1 });

export function useMenuEmergent({ files, onTria, onTanca, botoRef = null, mostra = false, tancaAmbTab = false }) {
  const ref = useRef(null);
  const tancaRef = useRef(onTanca);
  /* TC3.3 · El tancament que espera que el Tab haja mogut el focus. */
  const tabRef = useRef(null);
  useEffect(() => { tancaRef.current = onTanca; }, [onTanca]);
  useEffect(() => () => clearTimeout(tabRef.current), []);

  useEffect(() => {
    if (mostra) return undefined;
    const node = ref.current;
    node?.querySelector(files)?.focus();
    const arrel = node?.getRootNode?.() || document;
    const tancaFora = (event) => {
      if (!node || node.contains(event.target) || botoRef?.current?.contains(event.target)) return;
      tancaRef.current?.();
    };
    const tancaEsc = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      tancaRef.current?.();
      botoRef?.current?.focus();
    };
    arrel.addEventListener('pointerdown', tancaFora);
    arrel.addEventListener('keydown', tancaEsc);
    return () => {
      arrel.removeEventListener('pointerdown', tancaFora);
      arrel.removeEventListener('keydown', tancaEsc);
    };
  }, [mostra, botoRef, files]);

  const tria = (valor) => {
    if (mostra) return;
    onTanca?.();
    botoRef?.current?.focus();
    onTria?.(valor);
  };

  const mouFocus = (event) => {
    if (tancaAmbTab && !mostra && event.key === 'Tab') {
      /* El Tab fa el seu camí (cap preventDefault) i el menú es tanca darrere. */
      clearTimeout(tabRef.current);
      tabRef.current = setTimeout(() => tancaRef.current?.(), 0);
      return;
    }
    if (!(event.key in PASSOS) && event.key !== 'Home' && event.key !== 'End') return;
    const totes = Array.from(ref.current?.querySelectorAll(files) || []);
    if (!totes.length) return;
    event.preventDefault();
    const ara = totes.indexOf(event.target);
    let seguent = 0;
    if (event.key === 'End') seguent = totes.length - 1;
    else if (event.key in PASSOS) seguent = (Math.max(ara, 0) + PASSOS[event.key] + totes.length) % totes.length;
    totes[seguent].focus();
  };

  return { ref, tria, mouFocus };
}
