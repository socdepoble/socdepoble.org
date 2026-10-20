/** Comprova la forma pública de les credencials; no valida signatures ni permisos remots. */
export function validatePublicCredentials(supabaseUrl, anonKey) {
  if (typeof supabaseUrl !== 'string' || typeof anonKey !== 'string' || !supabaseUrl || !anonKey)
    throw new Error('Falta URL o clau pública de Supabase');
  let url;
  try { url = new URL(supabaseUrl); } catch { throw new Error('URL de Supabase invàlida'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!(url.protocol === 'https:' || (local && url.protocol === 'http:')) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/')
    throw new Error('Cal un origen HTTPS, o HTTP local, sense credencials ni ruta');
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(anonKey)) return;
  const parts = anonKey.split('.');
  if (parts.length !== 3 || parts.some(p => !/^[A-Za-z0-9_-]+$/.test(p))) throw new Error('Format de clau pública no admés');
  let payload;
  try {
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    payload = JSON.parse(atob(encoded + '='.repeat((4 - encoded.length % 4) % 4)));
  } catch { throw new Error('Clau JWT il·legible'); }
  if (payload.role !== 'anon') throw new Error('El navegador només admet la clau anon o publishable');
}

/* Fase D (261020, tasca 5) · L'esquema d'URL invertit d'un client OAuth d'iOS de Google
   (com.googleusercontent.apps.<número>-<id>), o null si el client no en té la forma.
   El client és públic. GoogleSignIn fa petar l'app si Info.plist no registra este
   esquema a CFBundleURLTypes: el build natiu el contrasta (vite.natiu.config.js) i
   l'entrada nativa només oferix Google a iOS quan n'hi ha. Ningú de src/data/supabase
   no l'ha d'importar (runtime.test.js simula este mòdul només amb la funció de dalt). */
const RE_CLIENT_IOS_DE_GOOGLE = /^([0-9]+-[a-z0-9]+)\.apps\.googleusercontent\.com$/;
export function esquemaInvertitDeGoogleIos(clientId) {
  const m = RE_CLIENT_IOS_DE_GOOGLE.exec(typeof clientId === 'string' ? clientId.trim() : '');
  return m ? `com.googleusercontent.apps.${m[1]}` : null;
}
