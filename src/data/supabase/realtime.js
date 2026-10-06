/**
 * @module supabase/realtime
 * @description Cicle de vida dels canals en temps real de Supabase.
 * @contract
 *   - unsubscribe(subscription)
 *   - reautenticaRealtime()
 *   - tancaRealtime()
 * ENX-17 (261006) · Sense subscripcions genèriques (subscribeToTable,
 * subscribeToCustomChannel): no les cridava ningú. L'únic canal viu és el del
 * Xat (subscribeToXat, xat.js), que només avisa {tipus:'nous', filId, seq}.
 */

import { clientActual } from './config.js';

/**
 * Donar de baixa una subscripció. Sense client viu no hi ha canal a tancar:
 * donar de baixa, tancar i reautenticar mai creen un client nou.
 * @param {object} subscription - Subscripció a donar de baixa.
 */
export const unsubscribe = async (subscription) => {
  if (subscription) {
    const supabase = clientActual();
    supabase?.removeChannel(subscription);
  }
};

export const reautenticaRealtime = async () => {
  try {
    const supabase = clientActual();
    if (supabase && supabase.realtime) {
      supabase.realtime.disconnect();
      supabase.realtime.connect();
    }
  } catch (e) {
    console.warn("Error reautenticant realtime", e);
  }
};

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
