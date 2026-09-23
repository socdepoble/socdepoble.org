// Servei únic de sessió: identitat, configuració i consultes segellades.
import { caducitatJwt, MARGE_RENOVACIO_MS, versioSessio } from './identitat.js';
import { getCurrentUser, teCapacitat, refrescaSessio, logout, elMeuRol } from './backendPort.js';

let generacio = 0;
let roleRequest = 0;
let configRequest = 0;
let temporitzador = null;
let renovacio = null;
let intents = 0;
let epoch = versioSessio;
let currentConfig = Object.freeze({});
let configKey = '';
const owners = new Map();
const defaultOwner = Symbol('sessio');
const listeners = new Set();
let estatActual = { usuari: null, estat: 'comprovant', rol: null, generacio: 0 };

export const getSessionState = () => estatActual;
export function subscribeSession(listener) {
  listeners.add(listener);
  listener(estatActual);
  return () => listeners.delete(listener);
}
function notify() { listeners.forEach(listener => listener(estatActual)); }
function clearTimer() { clearTimeout(temporitzador); temporitzador = null; }

/** Retorna un alliberador; dos muntatges no poden canviar-se l’àmbit global. */
export function setSessionConfig(config = {}, owner = defaultOwner) {
  const normalized = Object.freeze({
    backendId: config.backendId || 'supabase', tenantId: config.tenantId || null,
    supabaseUrl: (config.supabaseUrl || '').replace(/\/$/, ''),
    supabaseAnonKey: config.supabaseAnonKey || '', dataMode: config.dataMode || 'remote'
  });
  const key = JSON.stringify(normalized);
  if ([...owners].some(([id, entry]) => id !== owner && entry.key !== key)) {
    throw new Error('Dos instàncies no poden compartir una sessió amb configuracions diferents.');
  }
  owners.get(owner)?.controller.abort();
  const controller = new AbortController();
  const entry = { key, controller };
  owners.set(owner, entry);
  const requestId = ++configRequest;
  ++roleRequest;
  if (key !== configKey) {
    currentConfig = normalized;
    configKey = key;
    generacio++;
    intents = 0;
    clearTimer();
    estatActual = { ...estatActual, rol: estatActual.usuari ? 'desconegut' : null, generacio };
    notify();
  }
  import('../host.js').then(m => m.quanLlest({ signal: controller.signal })).then(() => {
    if (!controller.signal.aborted && requestId === configRequest) sincronitza();
  }).catch(() => {
    if (!controller.signal.aborted && requestId === configRequest) sincronitza();
  });
  return () => {
    controller.abort();
    if (owners.get(owner) === entry) owners.delete(owner);
  };
}

export function sincronitza() {
  const requestId = ++roleRequest;
  let user = null;
  try { user = getCurrentUser(); } catch { /* backend encara no arrencat */ }
  if (estatActual.usuari?.id !== user?.id || epoch !== versioSessio) {
    generacio++;
    epoch = versioSessio;
    intents = 0;
    estatActual = { ...estatActual, rol: user ? 'desconegut' : null };
  }
  estatActual = { ...estatActual, usuari: user, estat: user ? 'dins' : 'fora', generacio };
  if (!user) estatActual = { ...estatActual, rol: null };
  else if (teCapacitat('sessio')) {
    const myGen = generacio;
    const config = currentConfig;
    const aplicaRol = rol => {
      if (myGen !== generacio || requestId !== roleRequest) return;
      estatActual = { ...estatActual, rol: rol || 'usuari' };
      notify();
    };
    Promise.resolve().then(() => elMeuRol(config)).then(aplicaRol, () => aplicaRol('usuari'));
  } else estatActual = { ...estatActual, rol: 'usuari' };
  notify();
  gestionaTemporitzador();
}

/** Una renovació activa i un sol timer; tres reintents amb backoff, sense allargar el JWT. */
export async function renovaAra() {
  if (renovacio?.generacio === generacio) return renovacio.promise;
  clearTimer();
  const myGen = generacio;
  const myEpoch = versioSessio;
  const config = currentConfig;
  const entry = { generacio: myGen };
  renovacio = entry;
  entry.promise = (async () => {
    try {
      if (!teCapacitat('sessio')) { await logout(); return; }
      const ok = await refrescaSessio(config);
      if (myGen !== generacio || myEpoch !== versioSessio) return;
      if (!ok) await logout();
      else intents = 0;
    } catch {
      if (myGen !== generacio || myEpoch !== versioSessio) return;
      const exp = caducitatJwt();
      if (exp && exp <= Date.now()) { await logout(); return; }
      intents++;
      const delay = intents <= 3 ? Math.min(1000 * 2 ** (intents - 1), exp ? exp - Date.now() : 8000)
        : (exp ? exp - Date.now() : null);
      if (delay !== null) temporitzador = setTimeout(() => {
        if (myGen !== generacio || myEpoch !== versioSessio) return;
        if (caducitatJwt() && caducitatJwt() <= Date.now()) void logout();
        else void renovaAra();
      }, Math.max(1, delay));
    } finally {
      if (renovacio === entry) renovacio = null;
    }
  })();
  return entry.promise;
}

function gestionaTemporitzador() {
  clearTimer();
  if (estatActual.estat !== 'dins') return;
  const exp = caducitatJwt();
  if (!exp) return;
  const myGen = generacio;
  temporitzador = setTimeout(() => {
    if (myGen !== generacio) return;
    if (caducitatJwt() <= Date.now() + MARGE_RENOVACIO_MS) void renovaAra();
    else sincronitza();
  }, Math.max(1, Math.min(exp - Date.now() - MARGE_RENOVACIO_MS, 600000)));
}

if (typeof window !== 'undefined') {
  window.addEventListener('sdp:auth-change', sincronitza);
  const alDespertar = () => {
    if (document.visibilityState !== 'visible') return;
    const exp = caducitatJwt();
    if (exp && exp - Date.now() <= MARGE_RENOVACIO_MS) void renovaAra();
  };
  document.addEventListener('visibilitychange', alDespertar);
  window.addEventListener('online', alDespertar);
}
