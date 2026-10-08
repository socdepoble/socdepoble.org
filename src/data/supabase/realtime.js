/**
 * @module supabase/realtime
 * @description Cicle de vida dels canals en temps real de Supabase.
 * @contract
 *   - tancaRealtime()
 * ENX-17 (261006) · Sense subscripcions genèriques (subscribeToTable,
 * subscribeToCustomChannel): no les cridava ningú. L'únic canal viu és el del
 * Xat (subscribeToXat, xat.js), que només avisa {tipus:'nous', filId, seq}, i
 * es dona de baixa amb unsubscribeFromXat.
 * Auditoria 261007 (B) · Retirats `unsubscribe` i `reautenticaRealtime`: cap
 * codi no els cridava (només una prova). El JWT nou ja entra pel client
 * (config.js, accessToken) i tancar és l'única operació del cicle de vida que
 * fa servir algú (auth.js, en eixir).
 */

import { clientActual } from './config.js';

/** Tanca tots els canals del client viu. Sense client viu no en crea cap. */
export const tancaRealtime = async () => {
  try {
    const supabase = clientActual();
    if (supabase && supabase.removeAllChannels) {
      supabase.removeAllChannels();
    }
  } catch (e) {
    console.warn("Error tancant realtime", e);
  }
};
