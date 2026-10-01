/**
 * usePropietatsCss.js — propietats CSS personalitzades escrites des d'una ref.
 *
 * T10 (ordre del Mestre, 261001) · La porta de disseny prohibix l'atribut
 * `style` en JSX (tooling/gates/tractor-inline-styles.mjs). Una peça que s'ha
 * de posicionar amb números que només sap el JavaScript (el minut d'inici d'un
 * acte, la columna d'una barra) els escriu com a propietats CSS des d'una ref,
 * i el full canònic els llig amb var() i calc(): el patró d'EspecimenDivisor
 * (--cataleg-mostra-ample) i d'AppGridShell (--app-grid-col-sidebar).
 *
 * usePropietatsCss(ref, { '--sdp-cal-inici': 600, … }) · Un valor null o
 * undefined no s'escriu. En canviar els valors, i en desmuntar, es lleven les
 * que s'havien escrit: cap propietat òrfena al node.
 */
import { useLayoutEffect } from 'react';

export function usePropietatsCss(ref, propietats) {
  /* Els valors, en text i en un ordre estable: l'efecte només torna a córrer
     quan canvia algun número, no a cada objecte nou de la pintada. */
  const clau = JSON.stringify(Object.entries(propietats ?? {})
    .filter(([, valor]) => valor !== null && valor !== undefined)
    .map(([nom, valor]) => [nom, String(valor)]));
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const parelles = JSON.parse(clau);
    for (const [nom, valor] of parelles) node.style.setProperty(nom, valor);
    return () => {
      for (const [nom] of parelles) node.style.removeProperty(nom);
    };
  }, [ref, clau]);
}
