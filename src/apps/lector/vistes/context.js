/**
 * Lector de notícies · el context de les vistes (el posa AppLector).
 *
 *   lector    useLector: l'estat de la persona i les seues accions
 *   personals useFontsPersonals: les fonts que ha afegit la persona (pendents
 *             del connector) i `lleva`
 *   noticies  useNoticies: categories, fonts i resums, amb el seu estat
 *   font      el port de notícies (per a obrir un article sencer)
 *   ara       els mil·lisegons d'«ara» d'esta pintada (injectable a les proves)
 *   desfas    els minuts del fus de qui llig respecte d'UTC
 *   ruta      useApp().ruta: els camins absoluts de l'app
 */
import { createContext, useContext } from 'react';

export const ContextLector = createContext(null);

export function useVistaLector() {
  const valor = useContext(ContextLector);
  if (!valor) throw new Error('useVistaLector s’ha de cridar dins d’AppLector');
  return valor;
}
