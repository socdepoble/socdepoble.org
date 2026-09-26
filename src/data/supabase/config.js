import { createClient } from '@supabase/supabase-js';
import { getResolvedConfig } from './runtime.js';
import { jwtPerBackend } from '../identitat.js';

let supabaseClient = null;
let jwtDelClient = null;
let pinned = null;
export function resetClient() {
  const previous = supabaseClient;
  supabaseClient = null;
  jwtDelClient = null;
  try { Promise.resolve(previous?.removeAllChannels?.()).catch(() => {}); } catch { /* ja tancat */ }
}
export async function getClient(config = {}) {
  const supplied = !!(config.supabaseUrl || config.backend_url || config.backendUrl || config.supabaseAnonKey);
  const targetConfig = supplied ? config : { ...pinned, ...config };
  const resolved = getResolvedConfig(targetConfig);
  if (!resolved.hasSupabaseConfig) throw new Error('Falta configuració pública de Supabase');
  const { supabaseUrl, supabaseAnonKey } = resolved;
  if (pinned && (pinned.supabaseUrl !== supabaseUrl || pinned.supabaseAnonKey !== supabaseAnonKey))
    throw new Error('Un document només admet un origen i una clau pública de backend');
  const jwt = jwtPerBackend(targetConfig) || null;
  if (supabaseClient && jwtDelClient === jwt) return supabaseClient;
  resetClient();
  const candidate = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${jwt || supabaseAnonKey}` } },
  });
  if (jwt) await candidate.realtime?.setAuth?.(jwt);
  // Una sessió canviada mentre es configurava el client no es publica.
  if ((jwtPerBackend(targetConfig) || null) !== jwt) {
    await candidate.removeAllChannels();
    throw new Error('La sessió ha canviat mentre es creava el client; cal reintentar');
  }
  if (pinned && (pinned.supabaseUrl !== supabaseUrl || pinned.supabaseAnonKey !== supabaseAnonKey)) {
    await candidate.removeAllChannels();
    throw new Error('Configuració concurrent incompatible');
  }
  if (supabaseClient) {
    await candidate.removeAllChannels();
    return supabaseClient;
  }
  pinned ||= Object.freeze({ ...targetConfig, supabaseUrl, supabaseAnonKey });
  supabaseClient = candidate;
  jwtDelClient = jwt;
  return candidate;
}
if (typeof window !== 'undefined') window.addEventListener('sdp:auth-change', () => { resetClient(); pinned = null; });
