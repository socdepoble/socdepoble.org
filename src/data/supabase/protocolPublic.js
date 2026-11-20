/**
 * Formes públiques del proveïdor. Les consultes pures es poden fer abans
 * d'arrancar el backend; cap consulta de mitjans consumeix xarxa ni sessió.
 * El port conserva esta compatibilitat per a llavors i eines Node.
 */
const PREFIX = '/storage/v1/';
const PUBLIC = `${PREFIX}object/public/`;
const MITJANS = `${PUBLIC}mitjans/`;
const SEGMENT = /^[A-Za-z0-9_.~-]+$/;
const camiSegur = (cami) => {
  const parts = cami.split('/');
  return parts.length >= 2 && parts.every(part => SEGMENT.test(part) && part !== '.' && part !== '..');
};

/** Prefix literal, sense normalitzar la base que el consumidor ja ha validat. */
export function prefixMitjansPublics(base) { return `${base}${MITJANS}`; }
/** null: camí alié; {ref:null}: servei privat/malformat; {ref}: públic i segur. */
export function classificaCamiMitja(cami) {
  if (typeof cami !== 'string' || !cami.startsWith(PREFIX)) return null;
  const relatiu = cami.startsWith(PUBLIC) ? cami.slice(PUBLIC.length) : '';
  return { ref: camiSegur(relatiu) ? `sdp-media://${relatiu}` : null };
}
export function esReferenciaMitjaPrivada(text) {
  return typeof text === 'string' && /mitjans_privats|\/object\/sign\/|\/object\/authenticated\/|\/render\/image\//i.test(text);
}
/** L'origen/credencials els valida la política neutral abans de cridar ací. */
export function normalitzaVerificacioRecuperacio(url) {
  if (url.pathname !== '/auth/v1/verify') return null;
  if (url.searchParams.get('type') !== 'recovery') return { href: null };
  const token = url.searchParams.get('token_hash') ?? url.searchParams.get('token');
  if (!token) return { href: null };
  const fragment = new URLSearchParams({ token_hash: token, type: 'recovery' });
  return { href: `${url.origin}/#${fragment}` };
}
export function urlAutoritzacioGoogle(base, repte, tornada) {
  return `${base}/auth/v1/authorize?provider=google`
    + `&code_challenge=${encodeURIComponent(repte)}&code_challenge_method=S256`
    + `&redirect_to=${encodeURIComponent(tornada)}`;
}
/** Només el transport del protocol. L'intent, la sessió i el termini són del relé. */
export function bescanviaCodiOAuth(codi, verificador, config, signal, fetchImpl = (url, init) => globalThis.fetch(url, init)) {
  if (typeof codi !== 'string' || !codi || typeof verificador !== 'string' || !verificador
      || typeof config?.supabaseUrl !== 'string' || !config.supabaseUrl
      || typeof config?.supabaseAnonKey !== 'string' || !config.supabaseAnonKey) {
    throw new TypeError('Arguments del bescanvi OAuth invàlids.');
  }
  return fetchImpl(`${config.supabaseUrl}/auth/v1/token?grant_type=pkce`, {
    method: 'POST', redirect: 'error', signal,
    headers: { apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: codi, code_verifier: verificador })
  });
}
