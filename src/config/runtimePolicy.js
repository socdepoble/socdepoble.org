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
      audiences: Object.freeze(auth.audiences || ['socdepoble']),
      parentOrigins: Object.freeze(auth.parentOrigins || [
        'https://socdepoble.org',
        'https://sollutia.cat',
        'https://socdepoble.sollutia.com',
        ...(isDev ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3340', 'http://localhost:8080'] : [])
      ])
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

/**
 * Funció centralitzada per comprovar si un origen està a la llista blanca de la política.
 * @param {string} o - URL origen a verificar
 * @returns {boolean}
 */
export function esOrigenPermes(o) {
  if (!o) return false;
  let u;
  try { u = new URL(o); } catch { return false; }
  
  if (u.protocol !== 'https:' && u.hostname !== 'localhost') return false;
  const h = u.hostname;
  
  // Condicions per defecte basades en la visió de Sollutia
  if (h === 'socdepoble.org' || h.endsWith('.socdepoble.org')) return true;
  if (h === 'sollutia.cat' || h.endsWith('.sollutia.cat')) return true;
  if (h === 'socdepoble.sollutia.com') return true;
  
  // Entorns de dev, restringint localhost a quan el propi relé s'executa localment (si estem al client)
  if (h === 'localhost') {
    const isLocalhostHost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    if (isLocalhostHost && ['5173', '3000', '3340', '8080'].includes(u.port)) return true;
  }
  
  // Comprovacions dinàmiques contra _policy (si s'han injectat parentOrigins extres)
  if (_policy && _policy.auth && _policy.auth.parentOrigins) {
    return _policy.auth.parentOrigins.some(po => {
      try {
        return u.origin === new URL(po).origin;
      } catch {
        return false;
      }
    });
  }
  
  return false;
}
