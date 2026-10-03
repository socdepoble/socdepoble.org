import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { beginAuthAttempt, cancelAuthAttempts } from '../authAttempt.js';
import { getEfimer } from '../../config/storage.js';
import { jwtPerBackend, esBackendDeSessio, configuraBackendSessio, CLAU_ORIGEN, triaRefresc, rotaRegistre, oblidaRegistre, desaSessio, esborraSessio, usuariDeSessio, actualitzaUsuariSessio, capturaSessio, versioSessio, caducitatJwt, MARGE_RENOVACIO_MS } from '../identitat.js';
import { entraAmbGoogle, gestionaTornada } from '../oauthRelay.js';
import { configuraRefrescSessio, getCurrentUser, getResolvedConfig, request, rpc } from './runtime.js';
import { tancaRealtime } from './realtime.js';
import { resetClient } from './config.js';
import { emojiSol } from '../../utils/emoji.js';
import { CODI_ENTRADA, ambCodi, esBackendInabastable } from '../errorsBackend.js';

let renovacioEnCurs = null;
const emetCanvi = (user) => globalThis.window?.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user } }));

/* L'última configuració amb servidor. Qui ix sense passar-ne cap (l'amfitrió amb
   expulsaSessio, un botó antic) també ha de poder revocar la sessió al servidor. */
let configDarrera = {};
const recorda = (config) => { const resolved = normalizeBackendConfig(config); if (resolved.supabaseUrl) configDarrera = resolved; };

/* D1 (260926). Les pestanyes compartixen el refresh token del registre i GoTrue el
   rota a cada ús: passat l'interval de reutilització, un token gastat revoca la
   sessió sencera. Una sola renovació alhora per origen. navigator.locks és dins del
   baseline; sense ell (jsdom, WebViews velles) es renova igual que abans de D1. */
const PANY_RENOVACIO = 'sdp:sessio:renovacio';
const ambPany = (signal, fn) => (globalThis.navigator?.locks?.request
  ? globalThis.navigator.locks.request(PANY_RENOVACIO, { signal }, fn) : fn());

async function renova(config, epochActual, controller) {
  const { supabaseUrl, supabaseAnonKey } = getResolvedConfig(config);
  if (!supabaseUrl || !esBackendDeSessio(config)) return false;
  /* 12 s en total, l'espera del pany inclosa. */
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    return await ambPany(controller.signal, async () => {
      if (!esBackendDeSessio(config) || versioSessio !== epochActual) return false;
      const tria = triaRefresc();   // dins del pany: una altra pestanya el pot haver rotat
      if (!tria) return false;
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST', redirect: 'error', headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tria.rt }),
        signal: controller.signal
      });

      if (response.ok) {
        const result = await response.json();
        if (!esBackendDeSessio(config)) return false;
        if (tria.mode !== 'efimer') {
          /* El servidor diu que el token és d'un altre compte: el registre no és de fiar. */
          if (result?.user?.id != null && String(result.user.id) !== tria.sub) { oblidaRegistre(tria.rt); return false; }
          /* ABANS de la guarda d'època: descartar el token nou deixaria al registre un de gastat. */
          rotaRegistre(tria.rt, result?.refresh_token, tria.sub);
        }
        if (versioSessio !== epochActual) return false;
        const opcions = tria.mode === 'restauracio' ? { restauracio: { sub: tria.sub } } : { renovacio: true };
        if (!result?.access_token || !desaSessio(result, opcions)) return false;
        emetCanvi(result.user);
        return true;
      }
      if (versioSessio !== epochActual) return false;
      if ([400, 401].includes(response.status)) {
        /* El servidor ja no reconeix el token: res a revocar. El registre cau només si
           encara el porta; una altra pestanya el pot haver rotat pel camí. */
        if (tria.mode !== 'efimer') oblidaRegistre(tria.rt);
        await tanca({ abast: 'pestanya' });
        return false;
      }
      throw new Error(`Error de servidor (${response.status})`);
    });
  } catch (error) {
    if (versioSessio !== epochActual) return false;
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** La promesa compartida pertany a credencials i origen concrets. */
export function refreshSession(config = {}) {
  if (!esBackendDeSessio(config)) return Promise.resolve(false);
  recorda(config);
  const epoch = versioSessio;
  const resolved = getResolvedConfig(config);
  const key = JSON.stringify([epoch, resolved.supabaseUrl, resolved.supabaseAnonKey]);
  if (renovacioEnCurs?.key === key) return renovacioEnCurs.promise;
  renovacioEnCurs?.controller.abort();
  const entry = { key, epoch, controller: new AbortController() };
  renovacioEnCurs = entry;
  entry.promise = renova({ ...config }, epoch, entry.controller).finally(() => {
    if (renovacioEnCurs === entry) renovacioEnCurs = null;
  });
  return entry.promise;
}
if (typeof window !== 'undefined') window.addEventListener('sdp:auth-change', () => {
  if (renovacioEnCurs && renovacioEnCurs.epoch !== versioSessio) {
    renovacioEnCurs.controller.abort();
    renovacioEnCurs = null;
  }
});
export const refrescaSessio = refreshSession;
configuraRefrescSessio(refreshSession);

/* El JWT desat encara val més enllà del marge (o és opac, o no n'hi ha): es pot enviar tal qual. */
const jwtEnviable = () => { const exp = caducitatJwt(); return exp === null || exp - Date.now() > MARGE_RENOVACIO_MS; };

/**
 * L'usuari de la sessió amb un JWT que no caducarà pel camí. Si ja ha caducat o
 * li falta menys del marge, es renova ABANS d'enviar res. request() no reintenta
 * les rutes /auth/ després d'un 401: qui hi escriu (perfil, contrasenya) ho ha de
 * garantir abans. Si la renovació falla, torna l'usuari només si el JWT encara val.
 */
export async function asseguraUsuari(config = {}, current = capturaSessio()) {
  current();
  if (!esBackendDeSessio(config)) return null;
  const user = getCurrentUser();
  if (user && jwtEnviable()) return user;
  await refreshSession(config).catch(() => false);
  current();
  return getCurrentUser();
}

export async function elMeuRol(config = {}) {
  const user = usuariDeSessio();
  if (!user?.id) return null;
  try {
    const rows = await request(`/rest/v1/user_platform_roles?select=role&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, config);
    return rows?.[0]?.role || 'usuari';
  } catch { return 'usuari'; }
}

/* Lògica d'Usuari · en seed i local la fitxa viu a localPerfils, que fa de
   servidor. La comprovació és explícita (no `!== 'remote'`) perquè una
   configuració sense mode és remota. */
const MODES_LOCALS = new Set(['seed', 'local']);
/* Síncrona a posta: la decisió de mode no pot afegir cap microtasca abans de
   la primera petició remota (capturaSessio ha de trobar la sessió on era). */
const esModeLocal = (config) => MODES_LOCALS.has(getResolvedConfig(config).runtimeDataMode);
/* T4 (ordre del Mestre, 260930) · El codi MODE_LOCAL diu a la interfície per
   què no s'ha pogut entrar sense que haja de llegir el text. */
function exigeixModeRemot(config) {
  if (esModeLocal(config)) {
    throw ambCodi(new Error('L’entrada real encara s’està preparant. Recarrega el formulari d’entrada.'), CODI_ENTRADA.MODE_LOCAL);
  }
}
async function perfilsLocals() {
  const { localPerfils } = await import('../localPerfils.js');
  return localPerfils;
}

/* Ordre del Mestre (261002) · Comptes a qui ja s'ha intentat reparar l'alta des
   de getProfile en este document: com a molt UNA crida per compte, encara que el
   perfil es torne a llegir (sdp:refresh-data, una altra vista). Sense bucles. */
const altesReparades = new Set();

export async function getProfile(config = {}) {
  const user = getCurrentUser();
  if (!user) return null;
  if (esModeLocal(config)) return (await perfilsLocals()).getProfile(user);
  const ruta = `/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`;
  try {
    const rows = await request(ruta, config);
    if (rows?.[0]) return rows[0];
    /* Ordre del Mestre (261002) · SENSE FILA no és cap error: és una persona
       orfe (el trigger d'alta no la va poder crear, o l'alta per correu no ha
       passat mai per una entrada explícita) i el cercador no la troba. Es
       repara una vegada amb completa_la_meua_alta, idempotent, i es torna a
       llegir. Només si la sessió continua sent la mateixa. */
    if (Array.isArray(rows) && getCurrentUser()?.id === user.id && !altesReparades.has(user.id)) {
      altesReparades.add(user.id);
      const reparada = await Promise.resolve()
        .then(() => reparaAlta(config))
        .then(() => true, (error) => { avisaAlta(error); return false; });
      if (reparada && getCurrentUser()?.id === user.id) {
        const reparades = await request(ruta, config);
        if (reparades?.[0]) return reparades[0];
      }
    }
  } catch (error) { console.warn('[supabase] Avís consultant profiles:', error?.message); }
  /* Fila de RESERVA, feta amb la sessió: no porta bio, lema ni presentació. `reserva`
     ho diu perquè cap editor la prenga per la de veres i hi trepitge els camps.
     Només per als errors (també una reparació que falla o que no deixa fila). */
  return { reserva: true, id: user.id, full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatar_url: user.user_metadata?.avatar_url || user.avatar_url || '',
    visibility: user.user_metadata?.visibility || 'private',
    town_name: user.user_metadata?.town_name || 'La Torre de les Maçanes' };
}

/* Fase 1 · Perfil (D2). Columnes de profiles que el PATCH pot escriure (i que la RLS admet).
   T66 · `icon` (migració 2609282035): l'emoticona de la fitxa, mai a user_metadata. */
const CAMPS_PERFIL = Object.freeze(['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public', 'lema', 'presentacio_html', 'hero_url', 'copyright', 'icon']);
/* Només estos viatgen també a user_metadata, que va dins del JWT. Les columnes noves,
   mai: una presentació de 20.000 caràcters inflaria cada petició de la sessió. */
const CAMPS_METADATA = Object.freeze(['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public']);

/* T66 · El contracte del camp `icon` (utils/emoji.emojiSol): un sol emoji o
   res. Postgres no el pot validar; ací es normalitza abans de les dues
   branques perquè seed/local i remot desen el mateix. Res = null (la columna
   l'admet), com una imatge esborrada. */
const ambIconNormalitzat = (updates) => (updates?.icon === undefined
  ? updates
  : { ...updates, icon: emojiSol(updates.icon) || null });

export async function updateProfile(entrada, config = {}) {
  const updates = ambIconNormalitzat(entrada);
  const current = capturaSessio();
  const capturedConfig = { ...config };
  if (esModeLocal(capturedConfig)) {
    const local = await perfilsLocals();
    current();
    const usuari = getCurrentUser();
    if (!usuari) throw new Error('Cal iniciar sessió per a desar la fitxa.');
    const segurs = {};
    for (const k of CAMPS_PERFIL) if (updates?.[k] !== undefined) segurs[k] = updates[k];
    const fila = local.updateProfile(usuari, segurs);
    const metadades = {};
    for (const k of CAMPS_METADATA) if (segurs[k] !== undefined) metadades[k] = segurs[k];
    if (Object.keys(metadades).length) actualitzaUsuariSessio(metadades);
    return fila;
  }
  const user = (jwtEnviable() && getCurrentUser()) || await asseguraUsuari(capturedConfig, current);
  current();
  if (!user) throw new Error('La sessió ha caducat. Torna a entrar.');
  const urls = [updates?.avatar_url, updates?.logo_url, updates?.hero_url];
  if (getResolvedConfig(capturedConfig).runtimeDataMode !== 'seed'
    && urls.some((url) => typeof url === 'string' && url.startsWith('data:'))) {
    throw new Error('Les imatges no es desen incrustades. Puja-les amb uploadToStorage.');
  }

  // Filtrar camps segurs per a RLS (evita l'error 42501 amb camps com logo_url)
  const safeUpdates = {};
  for (const k of CAMPS_PERFIL) {
    if (updates[k] !== undefined) safeUpdates[k] = updates[k];
  }
  const metadata = {};
  for (const k of CAMPS_METADATA) {
    if (safeUpdates[k] !== undefined) metadata[k] = safeUpdates[k];
  }
  /* Esborrar la foto també lleva la `picture` que Google deixa a user_metadata
     (a GoTrue, un null esborra la clau): si no, la barra hi tornaria a caure. */
  if (Object.hasOwn(metadata, 'avatar_url') && !metadata.avatar_url) metadata.picture = null;
  /* Només lema, presentació o capçalera: GoTrue no hi té res a veure. */
  const ambMetadata = Object.keys(metadata).length > 0;

  /* Primer el perfil i, només si confirma la fila, la còpia de GoTrue. Una fila que
     la RLS no deixa tocar (baixa en curs: «profiles sense baixa») no deixa GoTrue
     desquadrat amb un canvi que el perfil no té. */
  current();
  const rows = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, capturedConfig,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: safeUpdates });
  current();
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0].id !== user.id) {
    throw new Error('El perfil no s’ha confirmat. Recarrega abans de tornar a guardar.');
  }
  const authUser = ambMetadata
    ? await request('/auth/v1/user', capturedConfig, { method: 'PUT', body: { data: metadata } })
    : null;
  current();
  if (ambMetadata) actualitzaUsuariSessio({ ...metadata, ...(authUser || {}) });
  return rows[0];
}

export async function updateUserPassword(password, config = {}) {
  const current = capturaSessio();
  const capturedConfig = { ...config };
  if (!(await asseguraUsuari(capturedConfig, current))) throw new Error('La sessió ha caducat. Torna a entrar.');
  current();
  const result = await request('/auth/v1/user', capturedConfig, { method: 'PUT', body: { password } });
  current();
  if (!result || result.error) throw new Error(result?.error_description || 'Error en canviar contrasenya.');
  return true;
}

export async function registerWithPassword(email, password, metadata = {}, config = {}) {
  exigeixModeRemot(config);
  recorda(config);
  configuraBackendSessio(config);
  const attempt = beginAuthAttempt();
  try {
  const result = await request('/auth/v1/signup', config, {
    method: 'POST', signal: attempt.signal, body: { email: String(email || '').trim().toLowerCase(), password, data: metadata }
  }).catch((error) => { throw traduixErrorEntrada(error); });

  attempt.assertCurrent();
  if (result.access_token) {
    if (!desaSessio(result)) {
      emetCanvi(null);
      throw new Error('No s’ha pogut desar la sessió. Comprova l’emmagatzematge del navegador.');
    }
    resetClient();
    emetCanvi(result.user);
    completaAlta(config);
  }
  return result;
  } finally { attempt.finish(); }
}

export const registraConsentiment = (tipus, versio, config = {}) =>
  rpc('registra_consentiment', { p_tipus: tipus, p_versio: versio }, config);

/* T2 i T4 (ordre del Mestre, 260930) · Capacitat 'salut'. /registre la
   pregunta ABANS de desar l'elecció remota: també en seed o local sonda la URL
   configurada, que és justament el que es vol saber. GET /auth/v1/health amb
   la clau pública, com la resta de peticions de l'adaptador, i 5 s de topall.
   Mai rebutja: configuració invàlida, xarxa caiguda o temps esgotat tornen
   { ok: false }. */
const TOPALL_SALUT_MS = 5000;
export async function comprovaServidor(config = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TOPALL_SALUT_MS);
  try {
    const { supabaseUrl, supabaseAnonKey } = getResolvedConfig(config);
    if (!supabaseUrl) return { ok: false };
    const resposta = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET', redirect: 'error', cache: 'no-store',
      headers: { apikey: supabaseAnonKey }, signal: controller.signal
    });
    return { ok: resposta?.ok === true };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

/* T4 (ordre del Mestre, 260930) · El vocabulari de GoTrue (estat HTTP i
   `error_code` del cos) es queda ací, en l'adaptador. La interfície rep un
   `code` de CODI_ENTRADA (src/data/errorsBackend.js) i una frase en valencià;
   l'error original viatja a `cause`. «Credencials invàlides» no distingix
   compte inexistent de contrasenya errònia: el servidor tampoc. */
const MISSATGE_ENTRADA = Object.freeze({
  [CODI_ENTRADA.CREDENCIALS]: 'El correu o la contrasenya no són correctes.',
  [CODI_ENTRADA.CORREU_PENDENT]: 'Encara no has confirmat el correu. Obri l’enllaç que t’hem enviat i torna a entrar.',
  [CODI_ENTRADA.CONTRASENYA_FEBLE]: 'La contrasenya és massa feble. Tria’n una de més llarga i més difícil d’endevinar.',
  [CODI_ENTRADA.COMPTE_EXISTENT]: 'Ja hi ha un compte amb este correu. Entra amb la teua contrasenya.',
  [CODI_ENTRADA.MASSA_INTENTS]: 'Massa intents seguits. Espera uns minuts i torna-ho a provar.',
  [CODI_ENTRADA.SERVIDOR_INABASTABLE]: 'El servidor del poble no respon ara mateix. Torna-ho a provar d’ací a una estona.',
  [CODI_ENTRADA.DESCONEGUT]: 'No s’ha pogut completar l’operació. Revisa les dades i torna-ho a provar.'
});
const LIMIT_GOTRUE = /^over_[a-z_]+_rate_limit$/;

/* El cos JSON de «Supabase NNN: {…}» (runtime.request), o null. */
function cosDeGoTrue(error) {
  try {
    const cos = JSON.parse(String(error?.message ?? '').replace(/^Supabase\s+\d+:\s*/, ''));
    return cos && typeof cos === 'object' ? cos : null;
  } catch { return null; }
}

function codiDeGoTrue(error) {
  const { status } = error;
  /* Xarxa (estat 0), temps esgotat o el servidor caigut (5xx): no s'hi ha pogut entrar. */
  if (error.name === 'TimeoutError' || esBackendInabastable(error) || (Number.isInteger(status) && status >= 500)) {
    return CODI_ENTRADA.SERVIDOR_INABASTABLE;
  }
  const cos = cosDeGoTrue(error);
  const codi = typeof cos?.error_code === 'string' ? cos.error_code : '';
  if (status === 429 || LIMIT_GOTRUE.test(codi)) return CODI_ENTRADA.MASSA_INTENTS;
  if (status === 400 && codi === 'invalid_credentials') return CODI_ENTRADA.CREDENCIALS;
  if (status === 400 && codi === 'email_not_confirmed') return CODI_ENTRADA.CORREU_PENDENT;
  if (status === 422 && codi === 'weak_password') return CODI_ENTRADA.CONTRASENYA_FEBLE;
  if (status === 422 && (codi === 'user_already_exists' || codi === 'email_exists')) return CODI_ENTRADA.COMPTE_EXISTENT;
  /* Correcció de la revisió T1–T4 (260930) · Qualsevol altra resposta 4xx
     (signup_disabled, validation_failed, el GoTrue antic sense error_code…):
     una frase genèrica. El `msg` en anglés es queda a `cause`, mai a la vista. */
  if (Number.isInteger(status) && status >= 400 && status < 500) return CODI_ENTRADA.DESCONEGUT;
  return null;
}

/** L'error traduït, o l'original tal qual si no n'hi ha traducció (un AbortError, un error de codi). */
function traduixErrorEntrada(error) {
  if (!error || typeof error !== 'object' || error.name === 'AbortError') return error;
  const code = codiDeGoTrue(error);
  if (!code) return error;
  const traduit = ambCodi(new Error(MISSATGE_ENTRADA[code], { cause: error }), code);
  if (error.status !== undefined) traduit.status = error.status;
  return traduit;
}

export async function loginWithPassword(email, password, config = {}) {
  exigeixModeRemot(config);
  recorda(config);
  configuraBackendSessio(config);
  const attempt = beginAuthAttempt();
  try {
  const result = await request('/auth/v1/token?grant_type=password', config, {
    method: 'POST', signal: attempt.signal, body: { email: String(email || '').trim().toLowerCase(), password }
  }).catch((error) => { throw traduixErrorEntrada(error); });
  attempt.assertCurrent();
  if (!result?.access_token || !result?.user?.id) {
    throw new Error('El servidor no ha confirmat la sessió. Torna a intentar entrar.');
  }
  if (result.access_token) {
    if (!desaSessio(result)) {
      emetCanvi(null);
      throw new Error('No s’ha pogut desar la sessió. Comprova l’emmagatzematge del navegador.');
    }
    resetClient();
    emetCanvi(result.user);
    completaAlta(config);
  }
  return result;
  } finally { attempt.finish(); }
}

export function loginWithMagicLink(email, config = {}) {
  void email; void config;
  throw new Error("L'entrada per Magic Link està temporalment desactivada per seguretat (manca PKCE). Utilitza l'entrada amb Google.");
}

/* Sense la migració aplicada (404) no hi ha res a reparar ni a avisar. */
function avisaAlta(error) {
  if (error?.status !== 404) console.warn('[supabase] Avís completant l’alta:', error?.message);
}

/* La reparació sola, amb la seua promesa: completaAlta no l'espera i getProfile
   (ordre del Mestre, 261002) sí, per a tornar a llegir la fila que crea. Si la
   pertinença naix ara (poble_nou), les seccions que ja s'havien llegit sense
   poble es tornen a llegir (sdp:refresh-data). */
function reparaAlta(config) {
  const tenantId = getResolvedConfig(config).tenantId || null;
  return Promise.resolve(rpc('completa_la_meua_alta', { p_tenant_id: tenantId }, config))
    .then((resposta) => {
      const fila = Array.isArray(resposta) ? resposta[0] : resposta;
      if (fila?.poble_nou === true) globalThis.window?.dispatchEvent(new CustomEvent('sdp:refresh-data'));
      return fila;
    });
}

/* D11 (260926). L'alta amb Google no porta el poble a les metadades i el trigger la pot
   deixar sense poble; completa_la_meua_alta la repara i és idempotent. També l'alta
   amb correu: amb un poble tancat o un tenantId buit, el trigger la deixa amb incidència
   i només es repara quan la persona entra (contrasenya o Google). Millor esforç:
   l'entrada no l'espera ni cau si falla. */
function completaAlta(config) {
  try {
    reparaAlta(config).catch(avisaAlta);
  } catch (error) { avisaAlta(error); }
}

export const loginWithGoogle = async (config = {}) => {
  exigeixModeRemot(config);
  const { supabaseUrl } = getResolvedConfig(config);
  const hostname = new URL(supabaseUrl).hostname;
  if (['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    throw Object.assign(new Error('El login amb Google només està disponible a Producció. Utilitza correu i contrasenya.'),
      { code: 'GOOGLE_LOCAL_UNAVAILABLE' });
  }
  recorda(config);
  configuraBackendSessio(config);
  const result = await entraAmbGoogle(config, getResolvedConfig);
  if (result?.access_token) completaAlta(config);
  return result;
};
export const recullTornadaOAuth = async (config = {}) => {
  exigeixModeRemot(config);
  recorda(config);
  configuraBackendSessio(config);
  const result = await gestionaTornada(config, getResolvedConfig);
  if (result?.access_token) completaAlta(config);
  return result;
};

/* Abasts de /auth/v1/logout a GoTrue: esta sessió, totes les del compte o les altres. */
const ABASTS_REVOCACIO = Object.freeze(['local', 'global', 'others']);

/* D1. Millor esforç: quan s'arriba ací l'estat local ja és buit. keepalive perquè una
   pestanya que es tanca no talle la petició. El JWT arriba capturat d'abans d'esborrar.
   Torna una promesa que no falla mai (o null si no s'ha enviat res). */
function revoca(config, jwt, scope) {
  try {
    const { supabaseUrl, supabaseAnonKey } = getResolvedConfig(config);
    if (!jwt || !supabaseUrl) return null;
    const peticio = fetch(`${supabaseUrl}/auth/v1/logout?scope=${scope}`, {
      method: 'POST', redirect: 'error', keepalive: true,
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${jwt}` }
    });
    return Promise.resolve(peticio).then(() => {}, () => {});
  } catch { /* configuració invàlida o sense fetch: no hi ha res més a fer */ }
  return null;
}

/* keepalive no és a tot el baseline (Firefox l'admet des de la 133) i l'eixida
   recarrega la pàgina de seguida: la revocació s'espera, amb topall, abans de tornar. */
const ESPERA_REVOCACIO_MS = 3000;
function esperaAmbTopall(promesa, ms) {
  let id = null;
  const topall = new Promise((resolve) => { id = setTimeout(resolve, ms); });
  return Promise.race([promesa, topall]).finally(() => clearTimeout(id));
}

/** Buida la sessió local. Amb `scope`, la revoca també al servidor. */
async function tanca({ abast = 'actor', config = {}, scope = null } = {}) {
  cancelAuthAttempts();
  renovacioEnCurs?.controller.abort();
  renovacioEnCurs = null;
  /* Una sessió injectada per l'amfitrió és seua: SdP la deixa, però no la revoca. */
  const destination = normalizeBackendConfig(config?.supabaseUrl || config?.backend_url || config?.backendUrl ? config : configDarrera);
  const jwt = scope && getEfimer(CLAU_ORIGEN, null) !== 'amfitrio' ? jwtPerBackend(destination) : null;
  // Invalidar abans del primer await: una resposta tardana no restaura la sessió.
  esborraSessio({ abast });
  resetClient();
  emetCanvi(null);
  const revocacio = jwt ? revoca(destination, jwt, scope) : null;
  await tancaRealtime();
  if (revocacio) await esperaAmbTopall(revocacio, ESPERA_REVOCACIO_MS);
}

/**
 * Eixir. Buida la pestanya i el registre persistent del compte (les altres pestanyes
 * ho senten per l'esdeveniment `storage`) i revoca al servidor: 'local' tanca esta
 * sessió, 'global' totes les del compte (la baixa).
 *
 * `abast: 'pestanya'` no és eixir: és la sessió d'esta pestanya que ha caducat sense
 * poder-se renovar (xarxa, 5xx, amfitrió sense refresh token). Només es buida la
 * pestanya, sense revocar res; el registre es queda perquè 'online' o una altra
 * pestanya el puguen tornar a provar.
 */
export async function logout(config = {}, { scope = 'local', abast = 'actor' } = {}) {
  if (abast === 'pestanya') return tanca({ config, abast: 'pestanya' });
  return tanca({ config, scope: ABASTS_REVOCACIO.includes(scope) ? scope : 'local' });
}
