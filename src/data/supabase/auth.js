import { getEfimer } from '../../config/storage.js';
import { CLAU_REFRESC, desaSessio, esborraSessio, usuariDeSessio, actualitzaUsuariSessio, versioSessio } from '../identitat.js';
import { entraAmbGoogle, gestionaTornada } from '../oauthRelay.js';
import { configuraRefrescSessio, getCurrentUser, getResolvedConfig, request, rpc } from './runtime.js';
import { tancaRealtime } from './realtime.js';
import { resetClient } from './config.js';

let renovacioEnCurs = null;
let authRequest = 0;
const emetCanvi = (user) => globalThis.window?.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user } }));

async function renova(config, epochActual, controller) {
  const refreshToken = getEfimer(CLAU_REFRESC);
  if (!refreshToken) return false;
  const { supabaseUrl, supabaseAnonKey } = getResolvedConfig(config);
  if (!supabaseUrl) return false;
  let timeoutId;
  try {
    timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', redirect: 'error', headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal
    });
    if (versioSessio !== epochActual) return false;

    if (response.ok) {
      const result = await response.json();
      if (versioSessio !== epochActual) return false;
      if (result?.access_token && desaSessio(result)) {
        emetCanvi(result.user); 
        return true;
      }
    }
    if ([400, 401].includes(response.status)) {
      await logout();
      return false;
    }
    throw new Error(`Error de servidor (${response.status})`);
  } catch (error) {
    if (versioSessio !== epochActual) return false;
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/** La promesa compartida pertany a credencials i origen concrets. */
export function refreshSession(config = {}) {
  const epoch = versioSessio;
  const resolved = getResolvedConfig(config);
  const key = JSON.stringify([epoch, resolved.supabaseUrl, resolved.supabaseAnonKey]);
  if (renovacioEnCurs?.key === key) return renovacioEnCurs.promise;
  renovacioEnCurs?.controller.abort();
  const entry = { key, epoch, controller: new AbortController() };
  renovacioEnCurs = entry;
  entry.promise = renova({ ...config }, epoch, entry.controller).finally(() => {
    if (renovacioEnCurs === entry) renovacioEnCurs = null;
  });
  return entry.promise;
}
if (typeof window !== 'undefined') window.addEventListener('sdp:auth-change', () => {
  if (renovacioEnCurs && renovacioEnCurs.epoch !== versioSessio) {
    renovacioEnCurs.controller.abort();
    renovacioEnCurs = null;
  }
});
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
  const requestId = ++authRequest;
  const epoch = versioSessio;
  const result = await request('/auth/v1/signup', config, {
    method: 'POST', body: { email: String(email || '').trim().toLowerCase(), password, data: metadata }
  });
  
  if (requestId !== authRequest || epoch !== versioSessio) throw new DOMException('La sessió ha canviat.', 'AbortError');
  if (result.access_token) { 
    desaSessio(result);
    resetClient();
    emetCanvi(result.user); 
  }
  return result;
}

export const registraConsentiment = (tipus, versio, config = {}) =>
  rpc('registra_consentiment', { p_tipus: tipus, p_versio: versio }, config);

export async function loginWithPassword(email, password, config = {}) {
  const requestId = ++authRequest;
  const epoch = versioSessio;
  const result = await request('/auth/v1/token?grant_type=password', config, {
    method: 'POST', body: { email: String(email || '').trim().toLowerCase(), password }
  });
  if (requestId !== authRequest || epoch !== versioSessio) throw new DOMException('La sessió ha canviat.', 'AbortError');
  if (result.access_token) { 
    desaSessio(result);
    resetClient();
    emetCanvi(result.user); 
  }
  return result;
}

export function loginWithMagicLink(email, config = {}) {
  void email; void config;
  throw new Error("L'entrada per Magic Link està temporalment desactivada per seguretat (manca PKCE). Utilitza l'entrada amb Google.");
}

export const loginWithGoogle = async (config = {}) => {
  const result = await entraAmbGoogle(config, getResolvedConfig);
  return result;
};
export const recullTornadaOAuth = async (config = {}) => {
  const result = await gestionaTornada(config, getResolvedConfig);
  return result;
};
export async function logout() {
  authRequest++;
  renovacioEnCurs?.controller.abort();
  renovacioEnCurs = null;
  // Invalidar abans del primer await: una resposta tardana no restaura la sessió.
  esborraSessio();
  resetClient();
  emetCanvi(null);
  await tancaRealtime();
}
