/**
 * useTraductorOpcional.js — el traductor de la interfície, o null.
 *
 * Una sola còpia (revisió del 261007, M6). Abans n'hi havia tres d'idèntiques:
 * Comentar.jsx, UniversalWorkspace.jsx i xatCorporatiu.js (useTraductorDeLApp).
 *
 * null fora de l'app (sense UIProvider: un espècimen del catàleg muntat sol)
 * o amb una prova que simula UIContext sense useUIActionsOpcional: el mock
 * llança en llegir l'exportació que li falta, i això passa dins del try.
 * Aleshores, la reserva en valencià. La forma `return …` dins del try és la de
 * useUbicacioApp (useAccions.js), la que rules-of-hooks accepta.
 */
import { useUIActionsOpcional } from '../../../app/contexts/UIContext';

export function useTraductorOpcional() {
  try {
    return useUIActionsOpcional()?.t ?? null;
  } catch {
    return null;
  }
}

/** Un parell [clau i18n, reserva en valencià], traduït si hi ha traductor. */
export const tradueix = (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);
