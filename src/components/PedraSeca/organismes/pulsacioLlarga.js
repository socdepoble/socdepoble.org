/**
 * pulsacioLlarga.js — l'acció secundària d'un element tàctil (una rajola,
 * una fila): el detall d'un article, les seues variants.
 *
 * Tres camins que porten al mateix lloc, perquè cap persona en quede fora:
 *   · pulsació llarga amb el dit o el ratolí (DURADA_PULSACIO);
 *   · el menú contextual del navegador (botó dret, i la pulsació llarga
 *     d'Android, que també el dispara);
 *   · el teclat: Maj+F10 i la tecla de menú, sobre l'element enfocat.
 * Si dos camins arriben junts (Android: el temporitzador i el menú
 * contextual), només compta el primer. El clic que ve després d'una pulsació
 * llarga no fa l'acció principal.
 *
 *   const premuda = usePulsacioLlarga(onSecundaria);
 *   const { handlers, consumeix } = premuda(article);
 *   <button {...handlers} onClick={(e) => { if (consumeix()) return; onTria(article); }} />
 */
import { useCallback, useEffect, useRef } from 'react';

export const DURADA_PULSACIO = 500;
const TOLERANCIA_PX = 10;
const FINESTRA_DUPLICAT_MS = 400;

const SENSE_PULSACIO = Object.freeze({ handlers: Object.freeze({}), consumeix: () => false });

export function usePulsacioLlarga(onLlarga) {
  /* Un sol estat per a tota la llista: només hi ha una pulsació alhora. */
  const estat = useRef({ temps: null, x: 0, y: 0, premut: false, disparada: false, ultim: -Infinity });

  useEffect(() => {
    const viu = estat.current;
    return () => clearTimeout(viu.temps);
  }, []);

  /* L'estat només es llig dins dels gestors, mai mentre es pinta. */
  const atura = useCallback(() => {
    const viu = estat.current;
    clearTimeout(viu.temps);
    viu.temps = null;
    viu.premut = false;
  }, []);

  return useCallback((objecte) => {
    if (typeof onLlarga !== 'function') return SENSE_PULSACIO;
    const dispara = (element) => {
      const viu = estat.current;
      const ara = Date.now();
      if (ara - viu.ultim < FINESTRA_DUPLICAT_MS) return;
      viu.ultim = ara;
      onLlarga(objecte, element);
    };
    return {
      handlers: {
        onPointerDown(event) {
          if (event.button !== 0) return;
          atura();
          const viu = estat.current;
          const element = event.currentTarget;
          viu.premut = true;
          viu.disparada = false;
          viu.x = event.clientX;
          viu.y = event.clientY;
          viu.temps = setTimeout(() => {
            viu.temps = null;
            viu.disparada = true;
            dispara(element);
          }, DURADA_PULSACIO);
        },
        onPointerMove(event) {
          const viu = estat.current;
          if (viu.temps && Math.hypot(event.clientX - viu.x, event.clientY - viu.y) > TOLERANCIA_PX) atura();
        },
        onPointerUp: atura,
        onPointerLeave: atura,
        onPointerCancel: atura,
        onContextMenu(event) {
          event.preventDefault();
          /* Amb el dit encara damunt (Android), el clic de després no compta. */
          if (estat.current.premut) {
            atura();
            estat.current.disparada = true;
          }
          dispara(event.currentTarget);
        },
        onKeyDown(event) {
          estat.current.disparada = false;
          if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') {
            event.preventDefault();
            dispara(event.currentTarget);
          }
        }
      },
      /** true si el clic que arriba és la cua d'una pulsació llarga (i el gasta). */
      consumeix() {
        if (!estat.current.disparada) return false;
        estat.current.disparada = false;
        return true;
      }
    };
  }, [onLlarga, atura]);
}
