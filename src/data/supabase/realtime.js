/**
 * @module supabase/realtime
 * @description Subscripcions en temps real a taules de Supabase.
 * @contract
 *   - subscribeToTable(table, callback)
 *   - unsubscribe(subscription)
 *   - subscribeToCustomChannel(channelName, callback)
 */

import { getClient } from './config.js';

/**
 * Subscriu a canvis en una taula.
 * @param {string} table - Nom de la taula.
 * @param {Function} callback - Funció a executar en cada canvi.
 * @param {object} options - Opcions (event: 'INSERT'|'UPDATE'|'DELETE'|'*').
 * @returns {Promise<{subscription: object, error: object}>}
 */
export const subscribeToTable = async (table, callback, options = {}) => {
  try {
    const supabase = await getClient();
    const channelName = options.channelName || `table_${table}_changes`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: 'public',
          table,
          filter: options.filter,
        },
        (payload) => callback(null, payload)
      )
      .on('error', (error) => callback(error, null))
      .subscribe();

    return { subscription: channel, error: null };
  } catch (error) {
    return { subscription: null, error };
  }
};

/**
 * Donar de baixa una subscripció.
 * @param {object} subscription - Subscripció a donar de baixa.
 */
export const unsubscribe = async (subscription) => {
  if (subscription) {
    const supabase = await getClient();
    supabase.removeChannel(subscription);
  }
};

/**
 * Subscriu a un canal personalitzat.
 * @param {string} channelName - Nom del canal.
 * @param {Function} callback - Funció a executar en rebre missatges.
 * @returns {Promise<{subscription: object, error: object}>}
 */
export const subscribeToCustomChannel = async (channelName, callback) => {
  try {
    const supabase = await getClient();
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: channelName }, (payload) => callback(null, payload))
      .on('error', (error) => callback(error, null))
      .subscribe();

    return { subscription: channel, error: null };
  } catch (error) {
    return { subscription: null, error };
  }
};

export const reautenticaRealtime = async () => {
  try {
    const supabase = await getClient();
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
    const supabase = await getClient();
    if (supabase && supabase.removeAllChannels) {
      supabase.removeAllChannels();
    }
  } catch (e) {
    console.warn("Error tancant realtime", e);
  }
};
