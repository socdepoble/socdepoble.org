import { validatePublicCredentials } from './publicCredentials.js';

let _policy = null;

/**
 * Estableix una política immutable abans d'arrencar:
 * Backend, emissor exacte, audiències admeses i orígens de missatge.
 */
export function setRuntimePolicy({ backend, auth = {} } = {}) {
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

  const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : (typeof import.meta !== 'undefined' && import.meta.env?.DEV);

  _policy = Object.freeze({
    backend,
    auth: Object.freeze({
      issuer,
      audiences: auth.audiences || ['socdepoble'],
      parentOrigins: auth.parentOrigins || [
        'https://socdepoble.org',
        'https://sollutia.cat',
        'https://socdepoble.sollutia.com',
        ...(isDev ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3340', 'http://localhost:8080'] : [])
      ]
    })
  });
  
  return _policy;
}

/**
 * Retorna la política vigent. Si no s'ha configurat, en crea una per defecte per evitar errors null-pointer.
 */
export function getRuntimePolicy() {
  if (!_policy) {
    return setRuntimePolicy({});
  }
  return _policy;
}
