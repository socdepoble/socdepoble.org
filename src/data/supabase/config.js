import { createClient } from '@supabase/supabase-js';
import { getResolvedConfig, tokenPerClient } from './runtime.js';
import { caducitatJwt, capturaSessio, jwtPerBackend } from '../identitat.js';

/* Un client per origen, clau pública i JWT. Sense GoTrueClient: l'autenticació
   és pròpia (auth.js) i el JWT hi entra per `accessToken`. Així auth-js no compta
   instàncies («Multiple GoTrueClient instances detected») i `client.auth` llança
   a posta: ningú no l'ha de fer servir. */
let supabaseClient = null;
let jwtDelClient = null;
let vigentDelClient = null;
const entradaVigent = comprova => { try { comprova?.(); return true; } catch { return false; } };
let pinned = null;
/* La creació en curs, compartida per clau: dues crides en el mateix tic reben el
   mateix client. `resetClient` l'anul·la i el candidat ja no es publica. */
let enCurs = null;
const tancaments = new WeakMap();
/** One SDK teardown per client while it is pending; reset remains synchronous. */
export function tancaClientRealtime(client) {
  if (!client || typeof client.removeAllChannels !== 'function') return Promise.resolve();
  if (tancaments.has(client)) return tancaments.get(client);
  let resol, rebutja;
  const feina = new Promise((yes, no) => { resol = yes; rebutja = no; });
  const pendent = feina.finally(() => {
    if (tancaments.get(client) === pendent) tancaments.delete(client);
  });
  tancaments.set(client, pendent);
  try { Promise.resolve(client.removeAllChannels()).then(resol, rebutja); }
  catch (error) { rebutja(error); }
  return pendent;
}
export function resetClient() {
  const previous = supabaseClient;
  supabaseClient = null;
  jwtDelClient = null;
  vigentDelClient = null;
  enCurs = null;
  try { tancaClientRealtime(previous).catch(() => {}); } catch { /* ja tancat */ }
}
/** El client publicat o null. Mai en crea cap: és per a tancar i reautenticar. */
export const clientActual = () => supabaseClient;
export async function getClient(config = {}) {
  const supplied = !!(config.supabaseUrl || config.backend_url || config.backendUrl || config.supabaseAnonKey);
  const targetConfig = supplied ? config : { ...pinned, ...config };
  const resolved = getResolvedConfig(targetConfig);
  if (!resolved.hasSupabaseConfig) throw new Error('Falta configuració pública de Supabase');
  const { supabaseUrl, supabaseAnonKey } = resolved;
  if (pinned && (pinned.supabaseUrl !== supabaseUrl || pinned.supabaseAnonKey !== supabaseAnonKey))
    throw new Error('Un document només admet un origen i una clau pública de backend');
  let jwt = jwtPerBackend(targetConfig) || null;
  const vigent = jwt ? capturaSessio() : null;
  const exp = jwt ? caducitatJwt(jwt) : null;
  if (exp !== null && exp <= Date.now()) {
    jwt = await tokenPerClient(targetConfig);
    vigent?.();
  }
  if (supabaseClient && jwtDelClient === jwt && entradaVigent(vigentDelClient)) return supabaseClient;
  const clau = JSON.stringify([supabaseUrl, supabaseAnonKey, jwt]);
  if (enCurs?.clau === clau && entradaVigent(enCurs.vigent)) return enCurs.promesa;
  resetClient();
  // Primer es registra: sense JWT la creació acaba sense cap await.
  const entrada = { clau, jwt, config: targetConfig, vigent };
  enCurs = entrada;
  entrada.promesa = creaClient(entrada, supabaseUrl, supabaseAnonKey)
    .finally(() => { if (enCurs === entrada) enCurs = null; });
  return entrada.promesa;
}
async function creaClient(entrada, supabaseUrl, supabaseAnonKey) {
  const { jwt, config: targetConfig } = entrada;
  const candidate = createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => {
      entrada.vigent?.();
      if (!jwt) return null; // An anonymous client never borrows a later login.
      const token = await tokenPerClient(targetConfig);
      entrada.vigent?.();
      return token;
    },
  });
  if (jwt) await Promise.resolve(candidate.realtime?.setAuth?.(jwt)).catch(() => {});
  // Una sessió canviada mentre es configurava el client no es publica.
  if (!entradaVigent(entrada.vigent) || (jwtPerBackend(targetConfig) || null) !== jwt) {
    await candidate.removeAllChannels();
    throw new Error('La sessió ha canviat mentre es creava el client; cal reintentar');
  }
  if (pinned && (pinned.supabaseUrl !== supabaseUrl || pinned.supabaseAnonKey !== supabaseAnonKey)) {
    await candidate.removeAllChannels();
    throw new Error('Configuració concurrent incompatible');
  }
  // Anul·lada per resetClient (eixida o una altra clau): el client viu seria d'un altre JWT.
  if (enCurs !== entrada || supabaseClient) {
    await candidate.removeAllChannels();
    throw new Error('La sessió ha canviat mentre es creava el client; cal reintentar');
  }
  pinned ||= Object.freeze({ ...targetConfig, supabaseUrl, supabaseAnonKey });
  supabaseClient = candidate;
  jwtDelClient = jwt;
  vigentDelClient = entrada.vigent;
  return candidate;
}
/* Desar el nom o l'avatar també avisa per `sdp:auth-change`: amb el mateix JWT
   (no nul) el client continua i els canals de temps real no es tanquen. */
function mateixJwt() {
  const [jwt, origen, vigent] = supabaseClient ? [jwtDelClient, pinned, vigentDelClient] : [enCurs?.jwt, enCurs?.config, enCurs?.vigent];
  return Boolean(jwt && origen && (jwtPerBackend(origen) || null) === jwt && entradaVigent(vigent));
}
function alCanviarSessio() {
  if (mateixJwt()) return;
  resetClient();
  pinned = null;
}
if (typeof window !== 'undefined') {
  window.addEventListener('sdp:auth-change', alCanviarSessio);
  // HMR: el mòdul nou porta el seu client; el vell tanca canals i deixa d'escoltar.
  import.meta.hot?.dispose(() => { window.removeEventListener('sdp:auth-change', alCanviarSessio); resetClient(); });
}
