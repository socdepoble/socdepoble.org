import { createClient } from '@supabase/supabase-js';
import { getResolvedConfig } from './runtime.js';
import { getEfimer } from '../../config/storage.js';
import { CLAU_JWT } from '../identitat.js';

let supabaseClient = null;

/**
 * Retorna l'estat del client oficial de Supabase (singleton).
 */
export async function getClient(config = {}) {
  if (supabaseClient) return supabaseClient;
  
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = getResolvedConfig(config);
  
  if (!hasSupabaseConfig) {
    throw new Error('Falten credencials de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY)');
  }

  const jwt = getEfimer(CLAU_JWT);

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt || supabaseAnonKey}`
      }
    }
  });
  
  return supabaseClient;
}
