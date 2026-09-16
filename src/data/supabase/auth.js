import { getEfimer } from '../../config/storage.js';
import { CLAU_REFRESC, desaSessio, esborraSessio, usuariDeSessio, actualitzaUsuariSessio } from '../identitat.js';
import { entraAmbGoogle, gestionaTornada } from '../oauthRelay.js';
import { configuraRefrescSessio, getCurrentUser, getResolvedConfig, request, rpc } from './runtime.js';
import { reautenticaRealtime, tancaRealtime } from './realtime.js';
import { resetClient } from './config.js';

let renovacioEnCurs = null;
const emetCanvi = (user) => globalThis.window?.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user } }));

async function renova(config = {}) {
  const refreshToken = getEfimer(CLAU_REFRESC);
  if (!refreshToken) return false;
  const { supabaseUrl, supabaseAnonKey } = getResolvedConfig(config);
  if (!supabaseUrl) return false;
  let response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
  } catch (error) {
    console.warn('Error de xarxa renovant sessió', error);
    return false;
  }
  if (response.ok) {
    const result = await response.json();
    if (result?.access_token) {
      desaSessio(result); resetClient(); reautenticaRealtime(); emetCanvi(result.user); return true;
    }
  }
  if ([400, 401].includes(response.status)) await logout();
  return false;
}

export function refreshSession(config = {}) {
  if (renovacioEnCurs) return renovacioEnCurs;
  renovacioEnCurs = renova(config).finally(() => { renovacioEnCurs = null; });
  return renovacioEnCurs;
}
export const refrescaSessio = refreshSession;
configuraRefrescSessio(refreshSession);

export async function asseguraUsuari(config = {}) {
  return getCurrentUser() || (await refreshSession(config).catch(() => false) ? getCurrentUser() : null);
}

export async function elMeuRol(config = {}) {
  const user = usuariDeSessio();
  if (!user?.id) return null;
  try {
    const rows = await request(`/rest/v1/user_platform_roles?select=role&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, config);
    return rows?.[0]?.role || 'usuari';
  } catch { return 'usuari'; }
}

export async function getProfile(config = {}) {
  const user = getCurrentUser();
  if (!user) return null;
  try {
    const rows = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, config);
    if (rows?.[0]) return rows[0];
  } catch (error) { console.warn('[supabase] Avís consultant profiles:', error?.message); }
  return { id: user.id, full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatar_url: user.user_metadata?.avatar_url || user.avatar_url || '',
    visibility: user.user_metadata?.visibility || 'private',
    town_name: user.user_metadata?.town_name || 'La Torre de les Maçanes' };
}

export async function updateProfile(updates, config = {}) {
  const user = await asseguraUsuari(config);
  if (!user) throw new Error('La sessió ha caducat. Torna a entrar.');
  const urls = [updates?.avatar_url, updates?.logo_url];
  if (getResolvedConfig(config).runtimeDataMode !== 'seed'
    && urls.some((url) => typeof url === 'string' && url.startsWith('data:'))) {
    throw new Error('Les imatges no es desen incrustades. Puja-les amb uploadToStorage.');
  }

  // Filtrar camps segurs per a RLS (evita l'error 42501 amb camps com logo_url)
  const allowedFields = ['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public'];
  const safeUpdates = {};
  for (const k of allowedFields) {
    if (updates[k] !== undefined) safeUpdates[k] = updates[k];
  }

  const authUser = await request('/auth/v1/user', config, { method: 'PUT', body: { data: safeUpdates } });
  const rows = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, config,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: safeUpdates });
  actualitzaUsuariSessio({ ...safeUpdates, ...(authUser || {}) });
  return rows?.[0] || { id: user.id, ...user.user_metadata, ...safeUpdates };
}

export async function updateUserPassword(password, config = {}) {
  const result = await request('/auth/v1/user', config, { method: 'PUT', body: { password } });
  if (!result || result.error) throw new Error(result?.error_description || 'Error en canviar contrasenya.');
  return true;
}

export async function registerWithPassword(email, password, metadata = {}, config = {}) {
  const result = await request('/auth/v1/signup', config, {
    method: 'POST', body: { email: String(email || '').trim().toLowerCase(), password, data: metadata }
  });
  
  if (result.session) { 
    desaSessio(result.session);
    resetClient();
    emetCanvi(result.user); 
  }
  return result;
}

export const registraConsentiment = (tipus, versio, config = {}) =>
  rpc('registra_consentiment', { p_tipus: tipus, p_versio: versio }, config);

export async function loginWithPassword(email, password, config = {}) {
  const result = await request('/auth/v1/token?grant_type=password', config, {
    method: 'POST', body: { email: String(email || '').trim().toLowerCase(), password }
  });
  if (result.access_token) { 
    desaSessio(result);
    resetClient();
    emetCanvi(result.user); 
  }
  return result;
}

export function loginWithMagicLink(email, config = {}) {
  if (!getResolvedConfig(config).hasSupabaseConfig) throw new Error('No hi ha connexió configurada amb el servidor Supabase.');
  
  let redirectUrl = '';
  if (typeof window !== 'undefined') {
    const relayOriginUrl = config?.oauthRelayUrl || (import.meta.env.DEV ? window.location.origin + '/auth/callback.html' : 'https://auth.socdepoble.org/callback');
    redirectUrl = `${relayOriginUrl}?sdp_origin=${encodeURIComponent(window.location.origin)}&sdp_path=${encodeURIComponent(window.location.pathname)}`;
  }
  
  return request(`/auth/v1/magiclink${redirectUrl ? `?redirect_to=${encodeURIComponent(redirectUrl)}` : ''}`, config, {
    method: 'POST', body: { email: String(email || '').trim().toLowerCase(), gotrue_meta_security: { captcha_token: null } }
  });
}

export const loginWithGoogle = async (config = {}) => {
  const result = await entraAmbGoogle(config, getResolvedConfig);
  return result;
};
export const recullTornadaOAuth = async (config = {}) => {
  const result = await gestionaTornada(config, getResolvedConfig);
  return result;
};
export async function logout() { resetClient(); tancaRealtime(); esborraSessio(); emetCanvi(null); }
