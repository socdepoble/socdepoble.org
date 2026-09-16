import { createClient } from '@supabase/supabase-js';
import { getResolvedConfig } from './runtime.js';
import { getEfimer } from '../../config/storage.js';
import { CLAU_JWT } from '../identitat.js';

/**
 * Singleton de supabase-js lligat a UN jwt.
 *
 * La capçalera Authorization es fixa en crear el client. Si la sessió canvia
 * (entrada, renovació, eixida, sessió de l'amfitrió) i el client no es refà,
 * les peticions seguixen eixint amb el token vell o amb la clau anònima.
 * Per això: es refà en cada `sdp:auth-change` i, per si algun camí no avisa,
 * també quan el jwt actual no és el del client.
 */
let supabaseClient = null;
let jwtDelClient = null;
let darreraConfig = null;

export function resetClient() {
  const vell = supabaseClient;
  supabaseClient = null;
  jwtDelClient = null;
  try { vell?.removeAllChannels?.(); } catch { /* client ja tancat */ }
}

export async function getClient(config = {}) {
  const jwt = getEfimer(CLAU_JWT, null) || null;
  const resolta = getResolvedConfig(config);
  
  // Si hi ha una config demanada i és diferent de l'establerta globalment
  if (resolta.hasSupabaseConfig && darreraConfig) {
    if (resolta.supabaseUrl !== darreraConfig.supabaseUrl) {
      throw new Error('[Supabase] Col·lisió de configuració: Múltiples instàncies de Sóc de Poble a la mateixa pàgina intenten usar backends diferents. L\'enxufabilitat actual només suporta un únic backend per document.');
    }
  }

  const efectiva = resolta.hasSupabaseConfig ? config : (darreraConfig || config);
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = getResolvedConfig(efectiva);
  
  if (!hasSupabaseConfig) {
    throw new Error('Falten credencials de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY)');
  }
  
  if (supabaseClient && jwtDelClient === jwt) return supabaseClient;
  if (supabaseClient) resetClient();

  darreraConfig = efectiva;

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${jwt || supabaseAnonKey}` } }
  });
  jwtDelClient = jwt;
  if (jwt) supabaseClient.realtime?.setAuth?.(jwt);
  return supabaseClient;
}

if (typeof window !== 'undefined') {
  window.addEventListener('sdp:auth-change', () => resetClient());
}
