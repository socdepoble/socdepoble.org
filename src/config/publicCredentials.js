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