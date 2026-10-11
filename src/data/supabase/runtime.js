import { validatePublicCredentials } from '../../config/publicCredentials.js';
import { APP_SEED, APP_SEED_VERSION, getDefaultUserId } from '../appSeed.js';
import { getEfimer } from '../../config/storage.js';
import { CLAU_USUARI, usuariDeSessio, versioSessio, jwtPerBackend } from '../identitat.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';
import { llistaDe } from '../../utils/autocuracio.js';

/* T2 (ordre del Mestre, 260930) · `codi` és el vocabulari neutral del port
   (errorsBackend.js): la vista decidix per ell i mai pel text de l'adaptador. */
export class ErrorSupabase extends Error {
  constructor(message, status, codi) {
    super(message); this.name = 'ErrorSupabase'; this.status = status;
    if (codi) this.codi = codi;
  }
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
  config = normalizeBackendConfig(config);
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

const buildHeaders = (config, anonKey, extra = {}) => {
  const jwt = jwtPerBackend(config);
  return { apikey: anonKey, Authorization: `Bearer ${jwt || anonKey}`, 'Content-Type': 'application/json', ...extra };
};

/* L'actor es llig del blob desat i no d'usuariDeSessio(): amb el jwt caducat (el
   motiu del 401) usuariDeSessio() ja torna null i el reintent legítim no passaria. */
const actorDesat = () => getEfimer(CLAU_USUARI, null)?.id ?? null;
const sessioCanviada = () => new DOMException('La sessió ha canviat durant la renovació.', 'AbortError');

export async function request(path, config = {}, options = {}) {
  const epoch = versioSessio;
  const actor = actorDesat();
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
    const response = await fetch(`${supabaseUrl}${path}`, { method, redirect: 'error', headers: buildHeaders(config, supabaseAnonKey, headers),
      signal: controller.signal, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.ok) {
      if (response.status === 401 && epoch === versioSessio && !_isRetry && !path.startsWith('/auth/') && await refresca(config)) {
        /* C14: el reintent només val per a la sessió que ha produït ESTA renovació.
           desaSessio() de la renovació incrementa la versió exactament una vegada i
           conserva l'actor; qualsevol altre salt (logout, canvi d'usuari, nova entrada
           del mateix usuari) vol dir que l'acció pertany a una sessió que ja no existix. */
        if (versioSessio !== epoch + 1 || actorDesat() !== actor) throw sessioCanviada();
        return request(path, config, { ...options, _isRetry: true });
      }
      const text = await response.text();
      throw new ErrorSupabase(`Supabase ${response.status}: ${text || 'Error desconegut.'}`, response.status);
    }
    if (response.status === 204) return null;
    const json = await response.json(); // F06: Esperar que descarregue tot el cos abans del finally
    options.onResponseMetadata?.({ contentRange: response.headers.get('content-range') });
    return json;
  } catch (err) {
    if (timedOut) {
      const timeoutErr = new Error('La petició ha trigat massa temps.');
      timeoutErr.name = 'TimeoutError';
      throw timeoutErr;
    }
    /* T2 · La petició no ha arribat al servidor (aturat o sense xarxa): estat 0
       i el codi neutral. El missatge es conserva (readableBackendError i les
       proves d'Onboarding el lligen). Un temps esgotat no porta el codi: el
       servidor pot estar viu i lent. No hi ha sonda ni circuit per a les
       peticions concurrents (decisió del coordinador, 260930): tocaria totes
       les peticions, també les d'entrada. */
    if (err instanceof TypeError) {
      throw new ErrorSupabase('Error de xarxa: No es pot connectar al servidor. Comprova la teua connexió a internet o que el backend local estiga en marxa.', 0, CODI_BACKEND_INABASTABLE);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', avorta);
  }
}

/* `opcions` arriba tal qual a request() (timeoutMs, signal): l'exportació de
   dades pot passar dels 12 s. El mètode i el cos no es poden sobreescriure. */
export async function rpc(nom, cos, config = {}, opcions = {}) {
  try { return await request(`/rest/v1/rpc/${nom}`, config, { ...opcions, method: 'POST', body: cos }); }
  catch (error) {
    if (error?.status === 404 || /PGRST20[25]/.test(String(error?.message || ''))) {
      throw new ErrorSupabase(`L'esquema requerit no està aplicat (falta "${nom}"). Executa les migracions corresponents.`, 404);
    }
    throw error;
  }
}

export function mapContentRowsToData(rows) {
  const lookup = new Map(rows.map((row) => [row.key, row.payload]));
  /* Onada 12 (261011; ordres 261011_0130, punt 7) · Llistes tolerants: una
     fila d'app_content amb un objecte o un text on toca una llista es pren
     buida (llistaDe l'anota i avisa una vegada). Abans passava tal qual i
     byId(payload.towns) petava dins del proveïdor del contingut, per damunt
     de la barrera de la ruta: tota l'app en blanc per una fila malmesa. */
  const llista = (clau) => llistaDe(lookup.get(clau), clau);
  // El contingut remot és autoritatiu: una llista buida no activa la demostració.
  return { ownerUserId: getDefaultUserId(), agents: llista('agents'), feedPosts: llista('feedPosts'),
    marketItems: llista('marketItems'), events: llista('events'), towns: llista('towns'),
    mediaItems: llista('mediaItems'),
    noteFolders: llista('noteFolders'),
    notes: llista('notes'),
    pages: llista('pages'), sectionSubmissions: [], chatMessages: [] };
}

export const buildSeedAppData = (ownerUserId = getDefaultUserId()) => Promise.resolve({ ownerUserId,
  agents: APP_SEED.agents, chatThreads: APP_SEED.chatThreads || [],
  chatMessages: (APP_SEED.chatMessages || []).filter((m) => m.ownerUserId === ownerUserId),
  feedPosts: APP_SEED.feedPosts, marketItems: APP_SEED.marketItems, events: APP_SEED.events, towns: APP_SEED.towns,
  mediaItems: APP_SEED.mediaItems, noteFolders: APP_SEED.noteFolders, notes: APP_SEED.notes, pages: APP_SEED.pages,
  sectionSubmissions: [], seedVersion: APP_SEED_VERSION });
export { APP_SEED_VERSION };
