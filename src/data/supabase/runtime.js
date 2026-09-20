import { validatePublicCredentials } from '../../config/publicCredentials.js';
import { APP_SEED, APP_SEED_VERSION, getDefaultUserId } from '../appSeed.js';
import { getEfimer } from '../../config/storage.js';
import { CLAU_JWT, usuariDeSessio } from '../identitat.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';

export class ErrorSupabase extends Error {
  constructor(message, status) { super(message); this.name = 'ErrorSupabase'; this.status = status; }
}

let refresca = async () => false;
export const configuraRefrescSessio = (callback) => { refresca = callback; };

export function generateUUID() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (c ^ globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 3 | 8)).toString(16);
  });
}

export const normalizeDataMode = (mode) => ['remote', 'seed', 'local'].includes(mode) ? mode : 'remote';
export function getResolvedConfig(config = {}) {
  const supabaseUrl = typeof config.supabaseUrl === 'string' ? config.supabaseUrl.replace(/\/$/, '') : (config.supabaseUrl || '');
  const supabaseAnonKey = config.supabaseAnonKey || '';
  const tenantId = config.tenantId || null;
  if (supabaseUrl || supabaseAnonKey) {
    validatePublicCredentials(supabaseUrl, supabaseAnonKey);
    permetOrigenMitjans(supabaseUrl);
  }
  return { supabaseUrl, supabaseAnonKey, tenantId, dataMode: normalizeDataMode(config.dataMode),
    hasSupabaseConfig: Boolean(supabaseUrl && supabaseAnonKey), runtimeDataMode: normalizeDataMode(config.dataMode) };
}
export const getBackendConfigurat = (config = {}) => getResolvedConfig(config).hasSupabaseConfig;
export const getRuntimeDataMode = (config = {}) => getResolvedConfig(config).runtimeDataMode;
export const getCurrentUser = () => usuariDeSessio();

const buildHeaders = (anonKey, extra = {}) => {
  const jwt = getEfimer(CLAU_JWT);
  return { apikey: anonKey, Authorization: `Bearer ${jwt || anonKey}`, 'Content-Type': 'application/json', ...extra };
};

export async function request(path, config = {}, options = {}) {
  const { method = 'GET', headers = {}, body, signal, timeoutMs = 12000, _isRetry = false } = options;
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('Falten VITE_SUPABASE_URL i/o VITE_SUPABASE_ANON_KEY.');
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const avorta = () => controller.abort();
  signal?.addEventListener('abort', avorta);
  try {
    if (signal?.aborted) {
      const err = new Error('Abortat abans de començar');
      err.name = 'AbortError';
      throw err;
    }
    const response = await fetch(`${supabaseUrl}${path}`, { method, redirect: 'error', headers: buildHeaders(supabaseAnonKey, headers),
      signal: controller.signal, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.ok) {
      if (response.status === 401 && !_isRetry && !path.startsWith('/auth/') && await refresca(config)) {
        return request(path, config, { ...options, _isRetry: true });
      }
      const text = await response.text();
      throw new ErrorSupabase(`Supabase ${response.status}: ${text || 'Error desconegut.'}`, response.status);
    }
    if (response.status === 204) return null;
    const json = await response.json(); // F06: Esperar que descarregue tot el cos abans del finally
    return json;
  } catch (err) {
    if (timedOut) {
      const timeoutErr = new Error('La petició ha trigat massa temps.');
      timeoutErr.name = 'TimeoutError';
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', avorta);
  }
}

export async function rpc(nom, cos, config = {}) {
  try { return await request(`/rest/v1/rpc/${nom}`, config, { method: 'POST', body: cos }); }
  catch (error) {
    if (error?.status === 404 || /PGRST20[25]/.test(String(error?.message || ''))) {
      throw new ErrorSupabase(`L'esquema requerit no està aplicat (falta "${nom}"). Executa les migracions corresponents.`, 404);
    }
    throw error;
  }
}

export function mapContentRowsToData(rows) {
  const lookup = new Map(rows.map((row) => [row.key, row.payload]));
  const remotes = lookup.get('noteFolders') || [];
  const ghostIds = new Set(['f-root', 'f-general', 'f-articles', 'f-histories', 'f-prompts', 'f-captures', 'f-event', 'f-mapa']);
  const folders = remotes.filter((f) => !ghostIds.has(f.id));
  const remoteNotes = lookup.get('notes') || [];
  return { ownerUserId: getDefaultUserId(), agents: lookup.get('agents') || [], feedPosts: lookup.get('feedPosts') || [],
    marketItems: lookup.get('marketItems') || [], events: lookup.get('events') || [], towns: lookup.get('towns') || [],
    mediaItems: lookup.get('mediaItems') || [],
    noteFolders: [...APP_SEED.noteFolders.map((s) => folders.find((f) => f.id === s.id) || s), ...folders.filter((f) => !APP_SEED.noteFolders.some((s) => s.id === f.id))],
    notes: [...APP_SEED.notes.map((s) => ({ ...(remoteNotes.find((n) => n.id === s.id) || s), folderId: 'f-mur' })), ...remoteNotes.filter((n) => !APP_SEED.notes.some((s) => s.id === n.id))],
    pages: lookup.get('pages') || [], sectionSubmissions: [], chatMessages: [] };
}

export const buildSeedAppData = (ownerUserId = getDefaultUserId()) => Promise.resolve({ ownerUserId,
  agents: APP_SEED.agents, chatThreads: APP_SEED.chatThreads || [],
  chatMessages: (APP_SEED.chatMessages || []).filter((m) => m.ownerUserId === ownerUserId),
  feedPosts: APP_SEED.feedPosts, marketItems: APP_SEED.marketItems, events: APP_SEED.events, towns: APP_SEED.towns,
  mediaItems: APP_SEED.mediaItems, noteFolders: APP_SEED.noteFolders, notes: APP_SEED.notes, pages: APP_SEED.pages,
  sectionSubmissions: [], seedVersion: APP_SEED_VERSION });
export { APP_SEED_VERSION };