import { APP_SEED, APP_SEED_VERSION, getDefaultUserId } from './appSeed.js';
/* Només queda `getEfimer`: tota l'escriptura i l'esborrat de la sessió han
   passat a identitat.js. Deixar els altres quatre importats faria botar
   `no-unused-vars` a `npm run lint`. */
import { getEfimer, getVal } from '../config/storage.js';
import { CLAU_JWT, CLAU_REFRESC, desaSessio, esborraSessio, usuariDeSessio, actualitzaUsuariSessio } from './identitat.js';
import { entraAmbGoogle, gestionaTornada } from './oauthRelay.js';
import { mergeById, mapSectionSubmissionToItem } from './mapejadorSeccions.js';
import { permetOrigenMitjans } from '../utils/sanitize.js';





function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class ErrorSupabase extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ErrorSupabase';
    this.status = status;
  }
}

const CONNECTABLE_SECTION_IDS = new Set(['mur', 'mercat', 'events', 'multimedia', 'notes']);













const buildHeaders = (anonKey, extra = {}) => {
  const jwt = getEfimer(CLAU_JWT);
  return {
    apikey: anonKey,
    Authorization: `Bearer ${jwt ? jwt : anonKey}`,
    'Content-Type': 'application/json',
    ...extra
  };
};

export async function removeAllChannels(config = {}) {
  const { supabaseUrl } = getResolvedConfig(config);
  if (!supabaseUrl) return;
  // Si hi ha implementació WebSocket o realtime en ús a la instància de client,
  // aquest mètode ha de ser cridat en desmuntar els contextos de Xat o Mur.
  // Donat que usem crides REST en aquest fitxer, l'exportem per a complir amb el tancament de sockets
  // si més endavant s'instància realtime-js externament.
}

let renovacioEnCurs = null;

export function refreshSession(config = {}) {
  if (renovacioEnCurs) return renovacioEnCurs;
  renovacioEnCurs = _renova(config).finally(() => { renovacioEnCurs = null; });
  return renovacioEnCurs;
}

/** Nom del contracte. `refreshSession` es queda com a intern. */
export const refrescaSessio = (config = {}) => refreshSession(config);

/**
 * Rol de plataforma de qui crida. La política «llig el propi rol» ja existix
 * a l'esquema inicial i `user_platform_roles` només té SELECT per a
 * authenticated: no cal cap RPC nova. Fail-closed a 'usuari'.
 */
export async function elMeuRol(config = {}) {
  const u = usuariDeSessio();
  if (!u?.id) return null;
  const r = await requestMaybe(
    `/rest/v1/user_platform_roles?select=role&user_id=eq.${encodeURIComponent(u.id)}&limit=1`,
    config
  );
  if (!r.ok || !Array.isArray(r.data) || r.data.length === 0) return 'usuari';
  return r.data[0].role || 'usuari';
}

async function _renova(config) {
  const refreshToken = getEfimer(CLAU_REFRESC);
  if (!refreshToken) return false;

  const { supabaseUrl, supabaseAnonKey } = getResolvedConfig(config);
  if (!supabaseUrl) return false;

  let response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
  } catch (e) {
    void e;
    console.warn('Error de xarxa renovant sessió', e);
    // Xarxa caiguda != Sessió invàlida
    return false;
  }

  if (response.ok) {
    const result = await response.json();
    if (result?.access_token) {
      /* CORRECCIÓ P0 (260908). Abans el `user` anava a localStorage amb setVal
         mentre els tokens anaven a sessionStorage. Les tres peces a la mateixa
         capa, i per un sol camí. */
      desaSessio(result);
      reautenticaRealtime();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: result.user }}));
      }
      return true;
    }
  }

  if (response.status === 400 || response.status === 401) {
    logout();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null }}));
    }
  }
  return false;
}

async function request(path, config, { method = 'GET', headers = {}, body, signal, timeoutMs = 12000, _isRetry = false } = {}) {
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) {
    throw new Error('Falten VITE_SUPABASE_URL i/o VITE_SUPABASE_ANON_KEY.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  const handleAbort = () => controller.abort();
  if (signal) {
    signal.addEventListener('abort', handleAbort);
  }

  try {
    const response = await fetch(`${supabaseUrl}${path}`, {
      method,
      headers: buildHeaders(supabaseAnonKey, headers),
      signal: controller.signal,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      if (response.status === 401 && !_isRetry && !path.startsWith('/auth/')) {
        const refreshed = await refreshSession(config);
        if (refreshed) {
          return await request(path, config, { method, headers, body, signal, timeoutMs, _isRetry: true });
        }
      }
      const text = await response.text();
      throw new ErrorSupabase(`Supabase ${response.status}: ${text || 'Error desconegut.'}`, response.status);
    }

    if (response.status === 204) return null;
    return response.json();
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', handleAbort);
    }
  }
}

export async function requestMaybe(path, config, options = {}) {
  try {
    const data = await request(path, config, options);
    return { ok: true, data, status: 200 };
  } catch (error) {
    const match = String(error?.message || '').match(/^Supabase\s+(\d+):\s+(.*)$/s);
    return {
      ok: false,
      status: match ? Number(match[1]) : 500,
      errorMessage: match ? match[2] : String(error?.message || error)
    };
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FASE 4 · MITJANS (SUPABASE STORAGE)

   Per què un `requestBinari()` i no `request()`: `request()` fa
   `JSON.stringify(body)`. Un Blob passat per allí arriba com "{}".
   El reintent 401 → refresc → repeteix és el mateix, a posta: si es
   divergix, el bug de la sessió caducada torna per la porta del darrere.
   ═══════════════════════════════════════════════════════════════════ */

const BUCKET_MITJANS = 'mitjans';

/** L'usuari amb sessió viva. Renova si el JWT local ha caducat. */
async function asseguraUsuari(config = {}) {
  const actual = getCurrentUser();
  if (actual) return actual;
  const renovada = await refreshSession(config).catch(() => false);
  return renovada ? getCurrentUser() : null;
}

function extensioDe(tipusMime = '') {
  const mapa = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/avif': 'avif'
  };
  return mapa[tipusMime] || 'bin';
}

function camiSegur(cami) {
  return String(cami)
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
}

async function requestBinari(cami, config, {
  method = 'POST',
  body,
  contentType,
  upsert = false,
  signal,
  timeoutMs = 30000,
  _isRetry = false
} = {}) {
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) {
    throw new Error('Falten VITE_SUPABASE_URL i/o VITE_SUPABASE_ANON_KEY.');
  }

  const jwt = getEfimer(CLAU_JWT);
  if (!jwt) throw new Error('Cal una sessió activa per a pujar fitxers.');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const avorta = () => controller.abort();
  if (signal) signal.addEventListener('abort', avorta);

  try {
    const response = await fetch(`${supabaseUrl}${cami}`, {
      method,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${jwt}`,
        'Content-Type': contentType || 'application/octet-stream',
        'cache-control': 'max-age=3600',
        ...(upsert ? { 'x-upsert': 'true' } : {})
      },
      body,
      signal: controller.signal
    });

    if (!response.ok) {
      if (response.status === 401 && !_isRetry) {
        const renovada = await refreshSession(config);
        if (renovada) {
          return await requestBinari(cami, config, {
            method, body, contentType, upsert, signal, timeoutMs, _isRetry: true
          });
        }
      }
      const text = await response.text();
      throw new ErrorSupabase(`Storage ${response.status}: ${text || 'Error desconegut.'}`, response.status);
    }

    return await response.json().catch(() => null);
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', avorta);
  }
}

/**
 * Puja un fitxer al bucket. La ruta SEMPRE comença per l'uid: és el que
 * la política RLS comprova amb storage.foldername(name)[1].
 *
 * @returns {Promise<{bucket: string, cami: string, url: string}>}
 */
export async function uploadToStorage(fitxer, opcions = {}, config = {}) {
  const { bucket = BUCKET_MITJANS, carpeta = '', nom, upsert = true } = opcions;
  if (!fitxer) throw new Error('Cap fitxer per a pujar.');

  const { runtimeDataMode } = getResolvedConfig(config);
  if (runtimeDataMode === 'seed') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ bucket, cami: 'mock-local', url: e.target.result });
      reader.onerror = reject;
      reader.readAsDataURL(fitxer);
    });
  }

  const user = await asseguraUsuari(config);
  if (!user) throw new Error('La sessió ha caducat. Torna a entrar per a pujar la imatge.');

  const tipus = fitxer.type || 'application/octet-stream';
  if (!tipus.startsWith('image/')) throw new Error('Només imatges, de moment.');

  const sufix = extensioDe(tipus);
  const identificador = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const nomFinal = nom || `${identificador}.${sufix}`;
  const trossos = [user.id, ...String(carpeta).split('/').filter(Boolean), nomFinal];
  const cami = trossos.join('/');

  await requestBinari(
    `/storage/v1/object/${encodeURIComponent(bucket)}/${camiSegur(cami)}`,
    config,
    { method: 'POST', body: fitxer, contentType: tipus, upsert }
  );

  return { bucket, cami, url: getPublicUrl(cami, { bucket }, config) };
}

/** URL pública. El bucket 'mitjans' és public: true a la migració. */
export function getPublicUrl(cami, opcions = {}, config = {}) {
  const { bucket = BUCKET_MITJANS } = opcions;
  const { supabaseUrl } = getResolvedConfig(config);
  if (!supabaseUrl || !cami) return '';
  if (/^https?:\/\//.test(cami)) {
    try {
      const urlDesti = new URL(cami);
      const urlBase = new URL(supabaseUrl);
      if (urlDesti.origin !== urlBase.origin) return '';
    } catch { return ''; }
    return cami;
  }
  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${camiSegur(cami)}`;
}

function mapContentRowsToData(rows) {
  const lookup = new Map(rows.map((row) => [row.key, row.payload]));
  return {
    ownerUserId: getDefaultUserId(),
    agents: lookup.get('agents') || [],
    feedPosts: lookup.get('feedPosts') || [],
    marketItems: lookup.get('marketItems') || [],
    events: lookup.get('events') || [],
    towns: lookup.get('towns') || [],
    mediaItems: lookup.get('mediaItems') || [],
    noteFolders: (() => {
      const remote = lookup.get('noteFolders') || [];
      const ghostIds = new Set(['f-root', 'f-general', 'f-articles', 'f-histories', 'f-prompts', 'f-captures', 'f-event', 'f-mapa']);
      const ghostNames = new Set(['articles', 'històries del poble', 'captures de recerca', 'receptes']);
      const filteredRemote = remote.filter(f => !ghostIds.has(f.id) && !ghostNames.has((f.name || '').trim().toLowerCase()));
      
      const merged = APP_SEED.noteFolders.map(seedF => filteredRemote.find(f => f.id === seedF.id) || seedF);
      const custom = filteredRemote.filter(f => !APP_SEED.noteFolders.find(s => s.id === f.id));
      
      return [...merged, ...custom];
    })(),
    notes: (() => {
      const remote = lookup.get('notes') || [];
      const seedNotes = APP_SEED.notes.map(seedN => {
        const remoteN = remote.find(n => n.id === seedN.id);
        return { ...(remoteN || seedN), folderId: 'f-mur' };
      });
      const customNotes = remote.filter(n => !APP_SEED.notes.find(s => s.id === n.id));
      return [...seedNotes, ...customNotes];
    })(),
    pages: lookup.get('pages') || [],
    sectionSubmissions: [],
    chatMessages: []
  };
}

async function buildSeedAppData(ownerUserId = getDefaultUserId()) {
  return {
    ownerUserId,
    agents: APP_SEED.agents,
    chatThreads: APP_SEED.chatThreads || [],
    chatMessages: (APP_SEED.chatMessages || []).filter((message) => message.ownerUserId === ownerUserId),
    feedPosts: APP_SEED.feedPosts,
    marketItems: APP_SEED.marketItems,
    events: APP_SEED.events,
    towns: APP_SEED.towns,
    mediaItems: APP_SEED.mediaItems,
    noteFolders: APP_SEED.noteFolders,
    notes: APP_SEED.notes,
    pages: APP_SEED.pages,
    sectionSubmissions: [],
    seedVersion: APP_SEED_VERSION
  };
}
















// Fase 2B: WebSockets (Realtime)
import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
const activeSubscriptions = new Map();

function getSupabaseClient(config) {
  if (supabaseClient) return supabaseClient;
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) return null;
  
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return supabaseClient;
}

/** Tanca canals i client. Idempotent. */
export function tancaRealtime() {
  for (const [filId, sub] of activeSubscriptions) {
    try { sub.unsubscribe(); } catch { /* socket ja mort */ }
    activeSubscriptions.delete(filId);
  }
  if (supabaseClient) {
    try { supabaseClient.removeAllChannels?.(); } catch { /* res */ }
    supabaseClient = null;
  }
}

/** El token del socket ha de seguir el de les capçaleres. */
export function reautenticaRealtime() {
  if (!supabaseClient) return;
  const jwt = getEfimer(CLAU_JWT);
  if (jwt) supabaseClient.realtime.setAuth(jwt);
  else tancaRealtime();
}

export function subscribeToXat(filId, callback, config = {}) {
  if (activeSubscriptions.has(filId)) activeSubscriptions.get(filId).unsubscribe();
  
  const client = getSupabaseClient(config);
  if (!client) return;

  const jwt = getEfimer(CLAU_JWT);
  if (jwt) {
    client.realtime.setAuth(jwt);
  }

  const { tenantId } = getResolvedConfig(config);

  // Ens subscribim a inserts de xat_missatges del fil actual
  const sub = client.channel(`xat:${filId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'xat_missatges',
        filter: `fil_id=eq.${filId}`
      },
      (payload) => {
        if (payload.new && payload.new.fil_id === filId) {
          callback(payload.new);
        }
      }
    )
    .subscribe();

  activeSubscriptions.set(filId, sub);
}

export function unsubscribeFromXat(filId, _config = {}) {
  void _config;
  const sub = activeSubscriptions.get(filId);
  if (sub) {
    sub.unsubscribe();
    activeSubscriptions.delete(filId);
  }
}

// Removed chat conversation map per lint














async function loadStructuredSupabaseData(config, ownerUserId) {
  const safeOwnerId = ownerUserId || getDefaultUserId();
  const { tenantId } = getResolvedConfig(config);
  const [contentRows, sectionSubmissionsResponse, notesResponse] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal }),
    requestMaybe(`/rest/v1/section_submissions?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=50`, config, { signal: config.signal }),
    requestMaybe(`/rest/v1/notes?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&owner_user_id=eq.${encodeURIComponent(safeOwnerId)}&order=updated_at.desc&limit=50`, config, { signal: config.signal })
  ]);

  if (!Array.isArray(contentRows) || contentRows.length === 0) {
    throw new Error('La BD remota està buida. Executa les migracions de supabase/ i supabase/seed.sql.');
  }
  const sectionSubmissions = Array.isArray(sectionSubmissionsResponse?.data) ? sectionSubmissionsResponse.data : [];
  const baseData = mapContentRowsToData(contentRows || []);

  const mergedFeedPosts = mergeById(baseData.feedPosts || [], sectionSubmissions.filter(s => s.section_id === 'mur').map(s => s.payload));
  const mergedMarketItems = mergeById(baseData.marketItems || [], sectionSubmissions.filter(s => s.section_id === 'mercat').map(s => s.payload));
  const mergedEvents = mergeById(baseData.events || [], sectionSubmissions.filter(s => s.section_id === 'events').map(s => s.payload));
  const mergedMediaItems = mergeById(baseData.mediaItems || [], sectionSubmissions.filter(s => s.section_id === 'multimedia').map(s => s.payload));

  const dbNotes = Array.isArray(notesResponse?.data) ? notesResponse.data.map(n => ({
    id: n.id,
    folderId: n.folder_id,
    title: n.title,
    subtitle: n.subtitle,
    lead: n.lead,
    content: n.content,
    categories: n.categories,
    tags: n.tags,
    heroImage: n.hero_image,
    logoImage: n.logo_image,
    isPublished: n.is_published,
    publishedSubmissionId: n.published_submission_id,
    revision: n.revision,
    createdAt: n.created_at,
    updatedAt: n.updated_at
  })) : [];

  const notesSource = mergeById(baseData.notes || [], dbNotes);
  const mergedNotes = mergeById(notesSource, sectionSubmissions.filter(s => s.section_id === 'notes').map(s => s.payload));

  return {
    ...baseData,
    ownerUserId,
    feedPosts: mergedFeedPosts,
    marketItems: mergedMarketItems,
    events: mergedEvents,
    mediaItems: mergedMediaItems,
    notes: mergedNotes,
    chatMessages: [],
    sectionSubmissions,
    seedVersion: APP_SEED_VERSION
  };
}



export async function loadAppData(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig } = getResolvedConfig(config);

  if (runtimeDataMode === 'seed') {
    return buildSeedAppData(ownerUserId);
  }

  if (!hasSupabaseConfig) {
    throw new Error('Falten VITE_SUPABASE_URL i/o VITE_SUPABASE_ANON_KEY per carregar la AppData.');
  }

  return loadStructuredSupabaseData(config, ownerUserId);
}

/**
 * Compatibilitat amb el CONTRACTE_BACKEND de host.js.
 *
 * Ja no el crida ningú de src/ (XatContext usa `enviaMissatge`), però està
 * declarat al contracte i un host de Sollutia el pot invocar. Ara DELEGA, en
 * compte de fer l'insert cru que feia abans amb
 * `usuari_id: message.ownerUserId || getDefaultUserId()`, que escrivia l'UUID
 * de convidat o un slug d'entitat i acabava en 22P02 o en rebuig de RLS.
 */
export async function appendChatMessages(messages, config = {}) {
  const llista = Array.isArray(messages) ? messages : [];
  const resultat = [];
  for (const m of llista) {
    resultat.push(await enviaMissatge(m.threadId ?? m.filId, m.text, config));
  }
  return resultat;
}

export async function appendSectionSubmissionNetworkOnly(submission, config = {}) {
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  
  if (!hasSupabaseConfig) {
    throw new Error('No es pot escriure publicació sense connexió al servidor.');
  }

  const ownerUserId = submission?.ownerUserId || getDefaultUserId();
  const sectionId = String(submission?.sectionId || '').trim();
  if (!CONNECTABLE_SECTION_IDS.has(sectionId)) {
    throw new Error('Secció no suportada per a connectar.');
  }

  const id = String(submission?.id || generateUUID());
  const createdAt = submission?.createdAt || new Date().toISOString();
  const basePayload = submission?.payload && typeof submission.payload === 'object' ? submission.payload : {};
  const payload = mapSectionSubmissionToItem({
    ...submission,
    id,
    ownerUserId,
    sectionId,
    createdAt,
    payload: {
      ...basePayload,
      id,
      ownerUserId,
      sectionId,
      created_at: basePayload.created_at || createdAt
    }
  });
  
  const storedSubmission = {
    id,
    ownerUserId,
    sectionId,
    title: submission?.title || payload.title || '',
    description: submission?.description || payload.description || payload.summary || '',
    createdAt,
    payload
  };

  await request('/rest/v1/section_submissions?on_conflict=' + encodeURIComponent('id'), config, {
    method: 'POST',
    headers: {
      Prefer: 'return=representation,resolution=merge-duplicates'
    },
    body: [
      {
        id,
        tenant_id: tenantId,
        owner_user_id: ownerUserId,
        section_id: sectionId,
        title: storedSubmission.title,
        description: storedSubmission.description,
        payload,
        created_at: createdAt
      }
    ]
  });
  
  return storedSubmission;
}

export async function updateNote(id, updates, expectedRevision, config = {}) {
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  
  if (!hasSupabaseConfig) {
    throw new Error('ATURADOR CRÍTIC: No es pot actualitzar una nota sense connexió al servidor. El projecte és Online-First estricte i no permet fallbacks locals rotatoris.');
  }

  if (expectedRevision === undefined || expectedRevision === null) {
    throw new Error('ATURADOR CRÍTIC: expectedRevision és obligatori per a actualitzar una nota i evitar pèrdua de dades per concurrència.');
  }

  const payload = {
    folder_id: updates.folderId,
    title: updates.title,
    subtitle: updates.subtitle,
    lead: updates.lead,
    content: updates.content,
    categories: updates.categories,
    tags: updates.tags,
    hero_image: updates.heroImage,
    logo_image: updates.logoImage,
    is_published: updates.isPublished,
    published_submission_id: updates.publishedSubmissionId
  };

  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) delete payload[key];
  });

  const revFilter = expectedRevision ? `&revision=eq.${expectedRevision}` : '';
  const response = await request(`/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}${revFilter}`, config, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: payload
  });

  if (!Array.isArray(response) || response.length === 0) {
    throw new ErrorSupabase("No s'ha pogut actualitzar la nota. Conflicte de concurrència o nota no trobada (0 files afectades).", 409);
  }

  const n = response[0];
  return {
    id: n.id,
    folderId: n.folder_id,
    title: n.title,
    subtitle: n.subtitle,
    lead: n.lead,
    content: n.content,
    categories: n.categories,
    tags: n.tags,
    isPublished: n.is_published,
    publishedSubmissionId: n.published_submission_id,
    revision: n.revision,
    createdAt: n.created_at,
    updatedAt: n.updated_at
  };
}

export {

  getDefaultUserId,
};

export function getBackendConfigurat(config = {}) {
  return getResolvedConfig(config).hasSupabaseConfig;
}



export function getRuntimeDataMode(config = {}) {
  return getResolvedConfig(config).runtimeDataMode;
}



export function normalizeDataMode(mode) {
  const allowed = ['remote', 'seed', 'local'];
  return allowed.includes(mode) ? mode : 'remote';
}

export function getResolvedConfig(config = {}) {
  const supabaseUrl = config.supabaseUrl || '';
  const supabaseAnonKey = config.supabaseAnonKey || '';
  const tenantId = config.tenantId || '11111111-2222-3333-4444-555555555555';
  
  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
  const dataMode = normalizeDataMode(config.dataMode);
  
  /* El sanejador bloqueja tota IMG que no siga del nostre origen. Storage
     viu en un altre domini. Ací és l'únic lloc pel qual passa tota crida
     al backend, i el registre és idempotent. */
  if (supabaseUrl) permetOrigenMitjans(supabaseUrl);

  return {
    supabaseUrl,
    supabaseAnonKey,
    tenantId,
    dataMode,
    hasSupabaseConfig,
    runtimeDataMode: dataMode
  };
}


export async function listMyOrganizations(config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) {
    return [];
  }
  if (!getCurrentUser()?.id) {
    return [];
  }

  const result = await request('/rest/v1/rpc/list_my_organizations', config, {
    method: 'POST',
    body: { p_tenant_id: tenantId }
  });

  return Array.isArray(result) ? result : [];
}

export async function createOrganization(organization, config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) {
    throw new Error('No es pot crear una organització sense connexió al servidor.');
  }
  if (!getCurrentUser()?.id) {
    throw new Error('Cal iniciar sessió per crear una organització.');
  }

  const result = await request('/rest/v1/rpc/create_organization', config, {
    method: 'POST',
    body: {
      p_tenant_id: tenantId,
      p_kind: organization?.kind,
      p_name: organization?.name,
      p_slug: organization?.slug,
      p_description: organization?.description || '',
      p_parent_organization_id: organization?.parentOrganizationId || null
    }
  });

  return Array.isArray(result) ? result[0] : result;
}

export async function updateOrganization(id, updates, config = {}) {
  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.slug !== undefined) payload.slug = updates.slug;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.kind !== undefined) payload.kind = updates.kind;
  if (updates.parentOrganizationId !== undefined) payload.parent_organization_id = updates.parentOrganizationId;

  const result = await request(`/rest/v1/organizations?id=eq.${encodeURIComponent(id)}`, config, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: payload
  });

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('No s\'ha pogut actualitzar l\'organització.');
  }
  return result[0];
}

export async function getProfile(config = {}) {
  const user = getCurrentUser();
  if (!user) return null;

  try {
    const result = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, config);
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
  } catch (err) {
    console.warn('[supabaseBackend] Avís consultant profiles, emprant dades de sessió:', err?.message);
  }

  // Fallback si profiles no té fila o té restricció RLS: llegir de user_metadata
  return {
    id: user.id,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatar_url: user.user_metadata?.avatar_url || user.avatar_url || '',
    visibility: user.user_metadata?.visibility || 'private',
    town_name: user.user_metadata?.town_name || 'La Torre de les Maçanes'
  };
}

export async function updateProfile(updates, config = {}) {
  /* FASE 4. Abans: `getCurrentUser()` és fail-closed sobre l'`exp` del JWT
     local, i llançava «No hi ha sessió» SENSE intentar el refresc que
     `request()` sí que fa en el seu reintent 401. Passada una hora, l'usuari
     veia la interfície com si estiguera dins i cada desat moria ací. */
  const user = await asseguraUsuari(config);
  if (!user) throw new Error('La sessió ha caducat. Torna a entrar.');

  /* El base64 dins de user_metadata viatja dins del JWT en CADA petició.
     Es tanca la porta en codi perquè no puga tornar per descuit. */
  const { runtimeDataMode } = getResolvedConfig(config);
  
  if (runtimeDataMode !== 'seed') {
    if (typeof updates?.avatar_url === 'string' && updates.avatar_url.startsWith('data:')) {
      throw new Error('Les imatges no es desen incrustades. Puja-les amb uploadToStorage.');
    }
    if (typeof updates?.logo_url === 'string' && updates.logo_url.startsWith('data:')) {
      throw new Error('Les imatges no es desen incrustades. Puja-les amb uploadToStorage.');
    }
  }

  // 1. Persistència al cloud de Supabase Auth (user_metadata)
  let authUpdatedUser = null;
  try {
    authUpdatedUser = await request('/auth/v1/user', config, {
      method: 'PUT',
      body: { data: updates }
    });
  } catch (err) {
    console.warn('[supabaseBackend] Avís actualitzant auth metadata:', err?.message);
  }

  // 2. Intentem actualitzar a la taula public.profiles
  let profileRow = null;
  try {
    const result = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, config, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: updates
    });
    if (Array.isArray(result) && result.length > 0) {
      profileRow = result[0];
    }
  } catch (err) {
    console.warn('[supabaseBackend] Error fent PATCH a profiles (requereix migració SQL RLS):', err?.message);
    if (!authUpdatedUser && !user.id) {
      throw err;
    }
  }

  // 3. Actualitzem la sessió efímera perquè tota la interfície ho veja immediatament
  actualitzaUsuariSessio({
    ...updates,
    ...(authUpdatedUser ? authUpdatedUser : {})
  });

  return profileRow || {
    id: user.id,
    ...user.user_metadata,
    ...updates
  };
}

export async function updateUserPassword(newPassword, config = {}) {
  const result = await request('/auth/v1/user', config, {
    method: 'PUT',
    body: { password: newPassword }
  });

  if (!result || result.error) {
    throw new Error(result?.error_description || 'Error en canviar contrasenya.');
  }
  return true;
}

export async function registerWithPassword(email, password, metadata = {}, config = {}) {
  const result = await request('/auth/v1/signup', config, {
    method: 'POST',
    body: { email: String(email || '').trim().toLowerCase(), password, data: metadata }
  });
  if (result.session) {
    desaSessio(result.session);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: result.user } }));
    }
  }
  return result;
}

export async function loginWithPassword(email, password, config = {}) {
  const result = await request('/auth/v1/token?grant_type=password', config, {
    method: 'POST',
    body: { email: String(email || '').trim().toLowerCase(), password }
  });
  if (result.access_token) {
    desaSessio(result);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: result.user } }));
    }
  }
  return result;
}

export async function loginWithMagicLink(email, config = {}) {
  const { hasSupabaseConfig } = getResolvedConfig(config);

  if (!hasSupabaseConfig) {
    throw new Error('No hi ha connexió configurada amb el servidor Supabase. No es pot enviar l\'enllaç.');
  }



  // Afegim redirect_to explícitament perquè el correu d'autenticació ens torne al lloc actual
  // en comptes del SITE_URL global de Supabase.
  const redirectUrl = typeof window !== 'undefined' 
    ? encodeURIComponent(window.location.origin + window.location.pathname) 
    : '';
  
  const result = await request(`/auth/v1/magiclink${redirectUrl ? '?redirect_to=' + redirectUrl : ''}`, config, {
    method: 'POST',
    body: {
      email: String(email || '').trim().toLowerCase(),
      gotrue_meta_security: { captcha_token: null }
    },
  });

  return result;
}

/**
 * L'anterior enviava l'usuari a Google amb `redirect_to = origin + pathname`.
 * Com que eixe origen no estava a la llista blanca, GoTrue no fallava: queia
 * al SITE_URL i l'usuari acabava sempre a socdepoble.org. I ningú llegia la
 * tornada, així que ni tan sols des d'allí s'hauria guardat la sessió.
 *
 * Ara: relé fix + PKCE + finestra emergent. Torna una promesa amb la sessió.
 */
export function loginWithGoogle(config = {}) {
  return entraAmbGoogle(config, getResolvedConfig);
}

/** Crida-la una vegada quan l'app es munte. */
export function recullTornadaOAuth(config = {}) {
  return gestionaTornada(config, getResolvedConfig);
}

/**
 * CORRECCIÓ P0 (260908). Els tres `delVal` esborraven claus de localStorage
 * mentre el jwt i el refresh-token vivien a sessionStorage: el botó d'eixir era
 * decoratiu i la petició següent tornava a usar el token. `esborraSessio()`
 * buida les dues capes.
 *
 * A més, emet `sdp:auth-change`. Sense l'esdeveniment, SessionContext no es
 * repintava i la interfície es quedava mostrant l'usuari que acabaves de tancar.
 */
export async function logout() {
  tancaRealtime();
  esborraSessio();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } }));
  }
}

/**
 * Un sol lector de la sessió, a identitat.js. Abans ací es llegia amb `getVal`
 * (localStorage) i a `buildHeaders` amb `getEfimer` (sessionStorage): dues
 * fonts de veritat que podien discrepar, i discrepaven.
 *
 * `usuariDeSessio()` és fail-closed: sense jwt no torna cap usuari.
 */
export function getCurrentUser() {
  return usuariDeSessio();
}

export async function loadCoreContent(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  const seed = await buildSeedAppData(ownerUserId);
  if (runtimeDataMode === 'seed') {
    return { towns: seed.towns, pages: seed.pages, pageCopy: {}, agents: seed.agents, ownerUserId };
  }
  if (!hasSupabaseConfig) {
    throw new Error('Falten credencials de Supabase per carregar el contingut Core.');
  }
  const contentRows = await request(`/rest/v1/app_content?select=key,payload,version&key=in.(towns,agents)&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal });
  const baseData = mapContentRowsToData(contentRows || []);
  // En mode remot, forcem l'ús de les pàgines locals (textos legals, etc.) perquè sempre estiguen actualitzades amb el codi
  return { towns: baseData.towns, pages: seed.pages, pageCopy: {}, agents: baseData.agents, ownerUserId };
}

export async function loadMur(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId);
    return { feedPosts: seed.feedPosts, events: seed.events, marketItems: seed.marketItems };
  }
  if (!hasSupabaseConfig) {
    throw new Error('Falten credencials de Supabase per carregar el Mur.');
  }

  const [contentRows, submissionsResp] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&key=in.(feedPosts,marketItems,events)&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal }),
    requestMaybe(`/rest/v1/section_submissions?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=50`, config, { signal: config.signal })
  ]);
  const baseData = mapContentRowsToData(contentRows || []);
  const subs = Array.isArray(submissionsResp?.data) ? submissionsResp.data : [];
  const feedPosts = mergeById(baseData.feedPosts || [], subs.filter(s => s.section_id === 'mur').map(s => s.payload));
  const marketItems = mergeById(baseData.marketItems || [], subs.filter(s => s.section_id === 'mercat').map(s => s.payload));
  const events = mergeById(baseData.events || [], subs.filter(s => s.section_id === 'events').map(s => s.payload));
  return { feedPosts, marketItems, events };
}

export async function loadMultimedia(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId);
    return { mediaItems: seed.mediaItems };
  }
  if (!hasSupabaseConfig) {
    throw new Error('Falten credencials de Supabase per carregar el Multimèdia.');
  }

  const [contentRows, submissionsResp] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&key=in.(mediaItems)&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal }),
    requestMaybe(`/rest/v1/section_submissions?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=50`, config, { signal: config.signal })
  ]);
  const baseData = mapContentRowsToData(contentRows || []);
  const subs = Array.isArray(submissionsResp?.data) ? submissionsResp.data : [];
  const mediaItems = mergeById(baseData.mediaItems || [], subs.filter(s => s.section_id === 'multimedia').map(s => s.payload));
  return { mediaItems };
}

/**
 * Compatibilitat amb el CONTRACTE_BACKEND.
 *
 * Torna els fils i CAP missatge, i això és intencionat: al model v2 els
 * missatges es carreguen per fil quan s'obri, no tots de colp. La versió
 * anterior demanava `xat_missatges?order=creat_al.desc&limit=500` sense filtrar
 * ni per fil ni per tenant, i es menjava mig xat del poble en cada arrencada.
 */
export async function loadXat(ownerUserId = null, config = {}) {
  const { runtimeDataMode, hasSupabaseConfig } = getResolvedConfig(config);
  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId || getDefaultUserId());
    return { chatThreads: seed.chatThreads, chatMessages: seed.chatMessages };
  }
  if (!hasSupabaseConfig) {
    throw new Error('Falten credencials de Supabase per carregar el Xat.');
  }
  return { chatThreads: await loadFils(config), chatMessages: [] };
}

export async function loadNotes(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId);
    return { notes: seed.notes, noteFolders: seed.noteFolders };
  }
  if (!hasSupabaseConfig) {
    throw new Error('Falten credencials de Supabase per carregar les Notes.');
  }
  const safeOwnerId = ownerUserId || getDefaultUserId();
  const [contentRows, submissionsResp, notesResp] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&key=in.(notes,noteFolders)&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal }),
    requestMaybe(`/rest/v1/section_submissions?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=50`, config, { signal: config.signal }),
    requestMaybe(`/rest/v1/notes?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&owner_user_id=eq.${encodeURIComponent(safeOwnerId)}&order=updated_at.desc&limit=50`, config, { signal: config.signal })
  ]);
  const baseData = mapContentRowsToData(contentRows || []);
  const subs = Array.isArray(submissionsResp?.data) ? submissionsResp.data : [];
  const dbNotes = Array.isArray(notesResp?.data) ? notesResp.data.map(n => ({
    id: n.id, folderId: n.folder_id, title: n.title, subtitle: n.subtitle, lead: n.lead,
    content: n.content, categories: n.categories, tags: n.tags, heroImage: n.hero_image, logoImage: n.logo_image,
    isPublished: n.is_published, publishedSubmissionId: n.published_submission_id, revision: n.revision,
    createdAt: n.created_at, updatedAt: n.updated_at
  })) : [];
  const notesSource = mergeById(baseData.notes || [], dbNotes);
  const notes = mergeById(notesSource, subs.filter(s => s.section_id === 'notes').map(s => s.payload));
  return { notes, noteFolders: baseData.noteFolders || [] };
}

export async function createNote(note, config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('No es pot crear la nota sense connexió.');
  const user = getCurrentUser();
  if (!user) throw new Error('Cal iniciar sessió per crear una nota.');

  const id = note.id || generateUUID();
  const payload = {
    id,
    tenant_id: tenantId,
    owner_user_id: user.id,
    folder_id: note.folderId || 'f-notes',
    title: note.title || '',
    content: note.content || ''
  };

  const response = await request('/rest/v1/notes', config, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: payload
  });

  if (!Array.isArray(response) || response.length === 0) {
    throw new ErrorSupabase("Error al crear la nota.", 500);
  }
  
  const n = response[0];
  return {
    id: n.id,
    folderId: n.folder_id,
    title: n.title,
    subtitle: n.subtitle,
    lead: n.lead,
    content: n.content,
    categories: n.categories,
    tags: n.tags,
    heroImage: n.hero_image,
    logoImage: n.logo_image,
    isPublished: n.is_published,
    publishedSubmissionId: n.published_submission_id,
    revision: n.revision,
    createdAt: n.created_at,
    updatedAt: n.updated_at
  };
}

/**
 * Crida un RPC i tradueix el 404 de PostgREST.
 *
 * PGRST202 = la funció no existix. PGRST205 = la taula no existix. Els dos
 * signifiquen el mateix per a qui està desplegant: falta executar un fitxer.
 * Sense esta traducció, l'usuari veu "Supabase 404" i el Mestre perd una hora.
 */
async function rpc(nom, cos, config) {
  try {
    return await request(`/rest/v1/rpc/${nom}`, config, { method: 'POST', body: cos });
  } catch (error) {
    const missatge = String(error?.message || '');
    if (error?.status === 404 || /PGRST20[25]/.test(missatge)) {
      throw new ErrorSupabase(
        `L'esquema del xat no està aplicat a la base de dades (falta "${nom}"). `
        + 'Executa supabase/migrations/260908_xat_v2.sql i després '
        + 'supabase/migrations/260908_xat_v2_correccions.sql al SQL Editor.',
        404
      );
    }
    throw error;
  }
}

/**
 * Els fils de la persona que té la sessió oberta.
 *
 * UNA SOLA CRIDA. La versió anterior llegia /rest/v1/xat_fils i prou: no podia
 * saber ni com es diu l'altra persona (RLS de `profiles` només deixa llegir el
 * teu propi perfil), ni l'últim missatge, ni els no llegits. La barra lateral
 * pintava "Ahir" i "Cap missatge." per a tot.
 *
 * @returns {Promise<Array<{id, titol, actualitzatAl, altresNoms, ultimText, ultimAl, noLlegits}>>}
 */
export async function loadFils(config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) return [];
  if (!getCurrentUser()?.id) return [];

  const files = await rpc('xat_fils_meus', { p_tenant_id: tenantId }, config);

  return (Array.isArray(files) ? files : []).map((f) => ({
    id: f.id,
    titol: f.titol || null,
    actualitzatAl: f.actualitzat_al || null,
    altresNoms: Array.isArray(f.altres_noms) ? f.altres_noms : [],
    ultimText: f.ultim_text || '',
    ultimAl: f.ultim_al || null,
    noLlegits: Number(f.no_llegits) || 0
  }));
}

/**
 * Missatges d'un fil, amb el nom de qui els ha escrit.
 *
 * `autorNom` ve de l'RPC, no d'un embed de PostgREST: `xat_missatges.usuari_id`
 * apunta a `auth.users`, no a `public.profiles`, i encara que hi apuntara, la
 * política "profiles read own" el tallaria igual.
 */
export async function loadMissatges(filId, config = {}) {
  const { hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig || !filId) return [];
  if (!getCurrentUser()?.id) return [];

  const files = await rpc('xat_missatges_del_fil', { p_fil_id: filId, p_limit: 200 }, config);

  return (Array.isArray(files) ? files : []).map((m) => ({
    id: m.id,
    filId,
    usuariId: m.usuari_id,
    autorNom: m.autor_nom || 'Veí',
    text: m.cos ?? '',
    esIA: Boolean(m.es_ia),
    creatAl: m.creat_al || null
  }));
}

/**
 * Escriu un missatge. Torna la fila real del servidor, amb `id` i `creat_al`
 * de la base de dades: així el missatge optimista es pot reconciliar amb la
 * versió canònica en compte de quedar-se amb un uuid inventat pel client.
 */
export async function enviaMissatge(filId, text, config = {}) {
  const { hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('No es pot escriure al xat sense connexió al servidor.');

  const user = getCurrentUser();
  if (!user?.id) throw new Error('Cal iniciar sessió per escriure al xat.');

  const cos = String(text ?? '').trim();
  if (!cos) throw new Error('El missatge està buit.');
  if (!filId) throw new Error('Falta el fil de destinació.');

  const resposta = await request('/rest/v1/xat_missatges', config, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: { fil_id: filId, usuari_id: user.id, text: cos }
  });

  const fila = Array.isArray(resposta) ? resposta[0] : resposta;
  if (!fila?.id) {
    throw new ErrorSupabase("El servidor ha acceptat el missatge però no l'ha tornat.", 500);
  }

  return {
    id: fila.id,
    filId: fila.fil_id,
    usuariId: fila.usuari_id,
    autorNom: null,          /* és meu: el nom el posa el frontend */
    text: fila.text,
    esIA: Boolean(fila.es_ia),
    creatAl: fila.creat_al
  };
}

/**
 * Marca el fil com a llegit fins ara mateix.
 *
 * Ara passa per RPC. L'upsert directe contra /rest/v1/xat_lectures NO avançava
 * la marca: `ultim_llegit_al` no anava al cos, i PostgREST només actualitza les
 * columnes que rep. La primera lectura entrava i la resta es perdien en silenci.
 *
 * NO LLANÇA. Que falle la marca de lectura no pot tombar la conversa.
 */
export async function marcaLlegit(filId, config = {}) {
  const { hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig || !filId) return null;
  if (!getCurrentUser()?.id) return null;

  try {
    return await rpc('xat_marca_llegit', { p_fil_id: filId }, config);
  } catch (error) {
    console.warn('[xat] no s\'ha pogut marcar el fil com a llegit:', error?.message || error);
    return null;
  }
}

/**
 * El padró del poble, per a triar amb qui obrir conversa.
 *
 * Torna només `{ id, nom, filId }`. `filId` ve informat si ja teniu un fil
 * directe obert: amb això la interfície hi navega sense escriure res.
 * La divulgació la controla l'RPC, no aquest fitxer.
 */
export async function carregaMembres(cerca = null, config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) return [];
  if (!getCurrentUser()?.id) return [];

  const net = cerca == null ? null : String(cerca).trim();

  const files = await rpc('membres_del_poble', {
    p_tenant_id: tenantId,
    p_cerca: net || null,
    p_limit: 100
  }, config);

  return (Array.isArray(files) ? files : []).map((m) => ({
    id: m.usuari_id,
    nom: m.nom || 'Veí',
    filId: m.fil_id || null
  }));
}

/**
 * Obri (o recupera) la conversa directa amb una altra persona del poble.
 *
 * És IDEMPOTENT al servidor: dues crides amb la mateixa persona tornen el
 * mateix fil. Sense això, cada clic crearia un fil buit nou.
 */
export async function creaFilDirecte(altreUsuariId, titol = null, config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('No es pot obrir una conversa sense connexió al servidor.');
  if (!getCurrentUser()?.id) throw new Error('Cal iniciar sessió per obrir una conversa.');

  const filId = await rpc('crea_fil_directe', {
    p_tenant_id: tenantId,
    p_altre_usuari: altreUsuariId,
    p_titol: titol
  }, config);

  return typeof filId === 'string' ? filId : (filId?.crea_fil_directe ?? null);
}


/**
 * Implementació local (Mock) de la Gestoria.
 * Aquesta funció permet veure la UI de la Gestoria de manera segura en local,
 * garantint que les dades financeres NO pugen a Supabase/Internet.
 * Intenta recuperar la base de dades antiga de Dexie (GestoriaDePoble) usant IndexedDB natiu
 * perquè l'usuari puga veure les seues dades sense perdre-les.
 */
export async function loadGestoria(options = {}) {
  if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  
  try {
    const isDemoMode = new URLSearchParams(window.location.search).get('mode') === 'demo';
    const dbName = isDemoMode ? "GestoriaDePoble_Demo" : "GestoriaDePoble";
    
    // Promesa per llegir de IndexedDB natiu
    const dadesAntigues = await new Promise((resolve) => {
      const request = indexedDB.open(dbName);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('events')) {
          db.close();
          resolve(null);
          return;
        }
        
        try {
          const transaction = db.transaction(['events', 'factures', 'contactes', 'documents'], 'readonly');
          const results = { events: [], factures: [], contactes: [], documents: [] };
          let pending = 4;
          
          const onComplete = () => {
            pending--;
            if (pending === 0) {
              db.close();
              resolve(results);
            }
          };
          
          ['events', 'factures', 'contactes', 'documents'].forEach(storeName => {
            if (db.objectStoreNames.contains(storeName)) {
              const req = transaction.objectStore(storeName).getAll();
              req.onsuccess = (e) => { results[storeName] = e.target.result || []; onComplete(); };
              req.onerror = () => onComplete();
            } else {
              onComplete();
            }
          });
        } catch (e) {
          void e;
          db.close();
          resolve(null);
        }
      };
      
      request.onerror = () => resolve(null);
      request.onupgradeneeded = (e) => {
        // Si no existia, cancel·lem l'upgrade per no crear-la buida innecessàriament
        e.target.transaction.abort();
        resolve(null);
      };
    });
    
    if (dadesAntigues && (dadesAntigues.events.length > 0 || dadesAntigues.factures.length > 0)) {
      return dadesAntigues;
    }

    // Fallback a localStorage si no hi ha res a IndexedDB
    const dadesLocals = getVal('sdp_gestoria_local');
    if (dadesLocals) return dadesLocals;

  } catch (e) {
    void e;
    console.warn('Error llegint dades locals de gestoria:', e);
  }
  
  return { events: [], factures: [], contactes: [], documents: [] };
}

/**
 * ============================================================================
 * MODE ADMINISTRADOR
 * ============================================================================
 * Crides que solament funcionaran si la RPC `private.es_superadmin()` 
 * retorna cert. S'encarreguen de proveir el llistat complet de la plataforma.
 */

export async function adminListUsers(config = {}) {
  const { hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) return [];
  
  const usuaris = await rpc('admin_list_users', {}, config);

  return Array.isArray(usuaris) ? usuaris : [];
}

export async function adminListOrganizations(config = {}) {
  const { hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) return [];
  
  const orgs = await rpc('admin_list_organizations', {}, config);

  return Array.isArray(orgs) ? orgs : [];
}
