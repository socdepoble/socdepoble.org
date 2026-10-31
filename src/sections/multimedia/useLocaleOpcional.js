/**
 * useLocaleOpcional.js — El locale de la interfície (UIContext: 'ca-ES',
 * 'en-GB'…) per a les xifres del Gestor d'arxius locals (formatKb), o null.
 *
 * Gauntlet 261029 (cicle 1, i18n) · Les mides es pintaven sempre amb punt
 * decimal («2.50 MB» també en valencià). Cada peça que pinta una mida el
 * demana ací i el passa a formatKb.
 *
 * null fora de l'app (sense UIProvider) o amb una prova que simula UIContext
 * sense esta exportació: el mock llança en llegir-la, i això passa dins del
 * try (la forma de useTraductorOpcional). Aleshores formatKb fa servir el
 * valencià.
 */
import { useUIStateOpcional } from '../../app/contexts/UIContext';

export function useLocaleOpcional() {
  try {
    return useUIStateOpcional()?.locale || null;
  } catch {
    return null;
  }
}
