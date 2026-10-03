import { validatePublicCredentials } from './publicCredentials.js';

let _policy = null;
const DEFAULT_PARENTS = Object.freeze(['https://socdepoble.org', 'https://sollutia.cat', 'https://socdepoble.sollutia.com']);
/* P1 (261003) · Model B. Cap llista d'orígens de tornada d'OAuth: la tornada és
   la pàgina de l'amfitrió (data/oauthRelay.js, urlDeTornada) i la valida GoTrue
   amb les Redirect URLs del projecte. */
const LOCAL_ORIGINS = Object.freeze([5173, 3000, 3340, 8080, 54321].map(port => `http://localhost:${port}`));
const local = () => typeof window !== 'undefined' && window.location.hostname === 'localhost';
function originExacte(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return value === url.origin && (url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost')) ? value : null;
  } catch { return null; }
}
function origens(values) {
  if (!Array.isArray(values) || values.some(value => !originExacte(value))) throw new Error('Cal una llista d’orígens exactes (protocol, host i port).');
  return Object.freeze([...new Set(values)]);
}
/* D1 (260926): on pot viure el refresh token. 'local' el conserva entre pestanyes
   i reinicis; 'pestanya' torna al P0 260908 (tot mor amb la pestanya). */
const PERSISTENCIES = Object.freeze(['local', 'pestanya']);
function persistencia(value = 'local') {
  if (!PERSISTENCIES.includes(value)) throw new Error('auth.persistencia ha de ser «local» o «pestanya».');
  return value;
}

/**
 * Estableix una política immutable abans d'arrencar:
 * Backend, emissor exacte, audiències admeses, orígens de missatge i persistència de la sessió.
 */
export function setRuntimePolicy({ backend, backendConfig, auth = {}, rawHostConfig } = {}) {
  if (_policy) {
    throw new Error('[RuntimePolicy] La política ja està configurada i és immutable.');
  }

  // Si l'amfitrió injecta un client de backend customitzat, o URLs de backend.
  if (backend?.supabaseUrl && backend?.anonKey) {
    validatePublicCredentials(backend.supabaseUrl, backend.anonKey);
  }

  // Obtenir de l'entorn de compilació el fallback
  const envIssuer = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SOLLUTIA_ISSUER : undefined;
  
  const issuer = auth.issuer || envIssuer;
  if (!issuer) {
    console.warn('[RuntimePolicy] Cap emissor configurat (issuer). La sessió externa via JWT requerirà verificacions addicionals al servidor.');
  }

  _policy = Object.freeze({
    backend,
    backendConfig: backendConfig ? Object.freeze({ ...backendConfig }) : undefined,
    rawHostConfig: rawHostConfig ? Object.freeze({ ...rawHostConfig }) : undefined,
    auth: Object.freeze({
      issuer,
      audiences: Object.freeze([...(auth.audiences || ['socdepoble'])]),
      parentOrigins: origens(auth.parentOrigins ?? [...DEFAULT_PARENTS, ...(local() ? LOCAL_ORIGINS : [])]),
      persistencia: persistencia(auth.persistencia)
    })
  });
  
  return _policy;
}

/**
 * Retorna la política vigent. Si no s'ha configurat, en crea una per defecte per evitar errors null-pointer,
 * excepte si s'especifica noAutoFreeze=true.
 */
export function getRuntimePolicy(noAutoFreeze = false) {
  if (!_policy && !noAutoFreeze) {
    return setRuntimePolicy({});
  }
  return _policy;
}

/** La llista explícita substituïx els defaults, també per a l'origen propi. */
export function esOrigenParePermes(origin) {
  if (!originExacte(origin)) return false;
  return (_policy?.auth.parentOrigins ?? [...DEFAULT_PARENTS, ...(local() ? LOCAL_ORIGINS : [])]).includes(origin);
}
