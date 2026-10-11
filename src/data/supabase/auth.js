import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { beginAuthAttempt, cancelAuthAttempts } from '../authAttempt.js';
import { getEfimer } from '../../config/storage.js';
import { jwtPerBackend, esBackendDeSessio, configuraBackendSessio, CLAU_ORIGEN, triaRefresc, rotaRegistre, oblidaRegistre, desaSessio, esborraSessio, usuariDeSessio, actualitzaUsuariSessio, capturaSessio, versioSessio, caducitatJwt, MARGE_RENOVACIO_MS } from '../identitat.js';
import { entraAmbGoogle, exigeixSenseMarcAlie, gestionaTornada, recullMarcaDeRecuperacio, urlDeTornadaAlta, urlDeTornadaRecuperacio } from '../oauthRelay.js';
import { MOTIU_TORNADA, TIPUS_RECUPERACIO, llegixTornadaDeRecuperacio, netejaTornadaDeRecuperacio } from '../tornadaRecuperacio.js';
import {
  ESTAT_ENLLAC, anunciaEnllacDeRecuperacio, escoltaRecuperacioPendent, estatEnllacDeRecuperacio, oblidaEnllacDeRecuperacio,
  oblidaRecuperacioPendent
} from '../recuperacioPendent.js';
import { configuraRefrescSessio, getCurrentUser, getResolvedConfig, request, rpc } from './runtime.js';
import { tancaRealtime } from './realtime.js';
import { resetClient } from './config.js';
import { emojiSol } from '../../utils/emoji.js';
import { CODI_ENTRADA, ambCodi, esBackendInabastable } from '../errorsBackend.js';
import { ErrorColumnaAbsent, columnaAbsent } from '../autodesament/errors.js';

let renovacioEnCurs = null;
/* Onada 11 (261010; prompt 261010_1730, tasca 2) · Exportat: el verify del
   segon factor (segonFactor.js) desa una sessió nova amb la mateixa
   coreografia que renova() i avisa igual. */
export const emetCanvi = (user) => globalThis.window?.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user } }));

/* L'última configuració amb servidor. Qui ix sense passar-ne cap (l'amfitrió amb
   expulsaSessio, un botó antic) també ha de poder revocar la sessió al servidor. */
let configDarrera = {};
const recorda = (config) => { const resolved = normalizeBackendConfig(config); if (resolved.supabaseUrl) configDarrera = resolved; };

/* D1 (260926). Les pestanyes compartixen el refresh token del registre i GoTrue el
   rota a cada ús: passat l'interval de reutilització, un token gastat revoca la
   sessió sencera. Una sola renovació alhora per origen. navigator.locks és dins del
   baseline; sense ell (jsdom, WebViews velles) es renova igual que abans de D1. */
const PANY_RENOVACIO = 'sdp:sessio:renovacio';
/* Onada 11 (261010) · Exportat per a segonFactor.js: la sessió nova del verify
   rota el registre dins del mateix pany que una renovació. */
export const ambPany = (signal, fn) => (globalThis.navigator?.locks?.request
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
   la primera petició remota (capturaSessio ha de trobar la sessió on era).
   Onada 11 (261010) · Exportada per a segonFactor.js, que sense GoTrue no té
   res a demanar. */
export const esModeLocal = (config) => MODES_LOCALS.has(getResolvedConfig(config).runtimeDataMode);
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
     Només per als errors (també una reparació que falla o que no deixa fila).
     Onada 6 (decisió 2 de la nit del 261009) · El poble és el de la sessió o
     cap: abans s'hi inventava «La Torre de les Maçanes», un poble que la
     persona no havia triat i que un editor podia acabar desant. */
  return { reserva: true, id: user.id, full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatar_url: user.user_metadata?.avatar_url || user.avatar_url || '',
    visibility: user.user_metadata?.visibility || 'private',
    town_name: user.user_metadata?.town_name || '' };
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

/* F1 (ordre del Mestre, 261004; pla 2045, Marató 2230) · Una base desfasada
   (2609110600 sense aplicar) rebutja el PATCH sencer amb PGRST204: PostgREST no
   troba la columna a la seua memòria de l'esquema. Arribava crua a la vista
   («Could not find the 'is_public' column…»: DetallAjust i SelectorVisibilitat
   pinten el missatge). Ara és un ErrorColumnaAbsent amb la columna i els camps
   que no s'han desat: la cua el classifica com a 'columna' i la frase diu què
   passa sense culpar ningú. El PATCH no ha escrit res, i GoTrue tampoc: el PUT
   només va després d'una fila confirmada. Torna null si l'error és un altre. */
function errorDeColumnaAbsent(error, cos) {
  const missatge = String(error?.message || '');
  const columna = columnaAbsent(missatge);
  const delCos = Boolean(columna) && Object.hasOwn(cos, columna);
  if (!delCos && !/PGRST204/.test(missatge)) return null;
  const quina = delCos ? `la columna «${columna}»` : 'una de les columnes';
  return Object.assign(new ErrorColumnaAbsent(
    `El servidor encara no té ${quina} del perfil: el canvi no s’ha desat. Cal aplicar-hi una migració pendent.`,
    { columna: delCos ? columna : null, camps: delCos ? [columna] : [] }
  ), { cause: error });
}

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
  let rows;
  try {
    rows = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, capturedConfig,
      { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: safeUpdates });
  } catch (error) {
    throw errorDeColumnaAbsent(error, safeUpdates) || error;
  }
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

/* P1 (261003) · Model B. Si el projecte demana confirmar el correu, l'enllaç del
   correu torna on diga `redirect_to`: la pàgina de l'amfitrió on s'ha fet l'alta,
   amb la mateixa tornada i la mateixa validació que l'entrada amb Google. Sense
   ell, GoTrue tria el Referer (només l'origen) o la Site URL del projecte. Sense
   pàgina http(s) no hi ha tornada possible, i l'alta continua sense.
   F1v2 (Onada 4, 261003, W4-02) · La tornada porta la marca de l'alta
   (`sdp_auth=alta`, urlDeTornadaAlta): de tornada, gestionaTornada només neteja
   els tokens implícits del fragment quan la porta; sense ella, la pàgina és
   de l'amfitrió i no s'hi toca res. */
function rutaAlta() {
  let tornada = null;
  try { tornada = urlDeTornadaAlta(); } catch { /* cap pàgina http(s) on tornar */ }
  return tornada ? `/auth/v1/signup?redirect_to=${encodeURIComponent(tornada)}` : '/auth/v1/signup';
}

export async function registerWithPassword(email, password, metadata = {}, config = {}) {
  exigeixModeRemot(config);
  recorda(config);
  configuraBackendSessio(config);
  const attempt = beginAuthAttempt();
  try {
  const result = await request(rutaAlta(), config, {
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
  [CODI_ENTRADA.ENLLAC_CADUCAT]: 'L’enllaç per a restablir la contrasenya ja no val: ha caducat o ja s’ha fet servir. Demana’n un altre des de «Has oblidat la contrasenya?».',
  [CODI_ENTRADA.MATEIXA_CONTRASENYA]: 'La contrasenya nova ha de ser diferent de l’anterior.',
  [CODI_ENTRADA.DESCONEGUT]: 'No s’ha pogut completar l’operació. Revisa les dades i torna-ho a provar.'
});
const LIMIT_GOTRUE = /^over_[a-z_]+_rate_limit$/;

/* El cos JSON de «Supabase NNN: {…}» (runtime.request), o null.
   Onada 11 (261010) · Exportada: segonFactor.js traduïx els error_code de
   l'API MFA de GoTrue amb el mateix patró que codiDeGoTrue. */
export function cosDeGoTrue(error) {
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
  /* R (Onada 3, 261003) · Recuperació: l'enllaç caducat o ja usat, i una
     contrasenya nova igual a l'anterior. */
  if (codi === 'otp_expired') return CODI_ENTRADA.ENLLAC_CADUCAT;
  if (status === 422 && codi === 'same_password') return CODI_ENTRADA.MATEIXA_CONTRASENYA;
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
  /* B (Onada 4, 261003, directriu de MarIA 261003_2221) · En un marc d'un altre
     origen, l'error tipat ENTRADA_EN_MARC ABANS de configuraBackendSessio, que
     pot buidar la sessió de la pestanya: una entrada rebutjada no toca res.
     oauthRelay.js en té la política i la torna a aplicar ell mateix. */
  exigeixSenseMarcAlie();
  recorda(config);
  configuraBackendSessio(config);
  const result = await entraAmbGoogle(config, getResolvedConfig);
  if (result?.access_token) completaAlta(config);
  return result;
};

/* ── R (Onada 3, 261003) · Recuperació de contrasenya ───────────────────
   Capacitat 'recuperacioContrasenya' (contracte.js). Disseny i alternatives:
   _wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_produccio_claude/R.txt.
   · Anada: POST /recover amb redirect_to = la pàgina de l'amfitrió (urlDeTornada
     de P1, la mateixa funció i la mateixa validació que Google i l'alta).
     F1-seguiments (Onada 4, 261003) · Amb la marca `sdp_auth=recuperacio`
     (urlDeTornadaRecuperacio), com l'alta: la tornada es reconeix com a nostra.
   · Tornada: la plantilla «Reset password» porta el token_hash al fragment
     (tornadaRecuperacio.js); recullTornadaOAuth el llig i neteja la URL.
     F1-seguiments · Amb la plantilla per defecte, un enllaç caducat torna amb
     #error=access_denied&error_code=otp_expired: amb la marca, l'avís en
     valencià (ENLLAC_CADUCAT_EN_ARRIBAR) i la URL neta (recullMarcaDeRecuperacio).
     Sense la marca (un enllaç enviat abans), l'error de l'amfitrió no es toca.
   · Sense PKCE a posta: el verificador viu a la capa efímera de la pestanya
     (storage.js) i l'enllaç del correu s'obri en una pestanya nova.
   · Correcció de la revisió: el límit de correus d'un compte es contesta com un
     enviament (anti-enumeració).
   · R2 (decisió del Mestre, 261003) · Safe Links d'Outlook: en arribar NO es
     verifica res. El token espera en la memòria d'este mòdul i es verifica en
     prémer «Desa» (definixContrasenyaNova): un escàner que executa la pàgina ja
     no el gasta. Cap sessió fins que la contrasenya és la nova (R.txt §7). */

/* Sense tornada, GoTrue posaria la Site URL a l'enllaç: l'SPA vella, fora de
   l'amfitrió. Millor no enviar res i dir-ho. */
const SENSE_TORNADA_RECUPERACIO = 'Esta pàgina no té cap adreça http o https on tornar: no es pot enviar l’enllaç de recuperació.';
const ENLLAC_INSERVIBLE = 'Este enllaç de recuperació no es pot usar ací. Demana’n un altre des de «Has oblidat la contrasenya?» i, si torna a passar, avisa l’equip del poble.';
const SENSE_CONFIRMACIO_ENLLAC = 'El servidor no ha confirmat l’enllaç de recuperació. Demana’n un altre.';
/* F1-seguiments · L'enllaç del correu ha tornat amb l'error de GoTrue. */
const ENLLAC_CADUCAT_EN_ARRIBAR = 'L’enllaç ha caducat o ja s’ha fet servir. Demana’n un altre.';
const DESADA_SENSE_SESSIO = 'La contrasenya nova ja està desada, però este navegador no ha pogut obrir la sessió. Torna a entrar amb el correu i la contrasenya nova.';
const DESADA_SESSIO_CANVIADA = 'La contrasenya nova ja està desada, però la sessió d’este navegador ha canviat mentre es desava. Torna a entrar amb el correu i la contrasenya nova.';
const TORNA_A_DESAR = 'La sessió d’este navegador ha canviat mentre es desava. Torna a escriure la contrasenya nova i prem «Desa» una altra vegada: l’enllaç encara val.';
/* Correcció de la revisió de R2 · El topall de /verify i del PUT de «Desa».
   Totes dues canvien el servidor sense tornada (el token es gasta, la
   contrasenya canvia): si el topall salta quan el servidor ja ho ha fet, la
   persona perd la resposta. 30 s en compte dels 12 de request(): una connexió
   rural lenta no ha de cremar l'enllaç. */
const TOPALL_DESA_MS = 30000;

/* R2 · L'enllaç que espera «Desa», NOMÉS en la memòria d'este document: mai a
   cap emmagatzematge ni fora d'este mòdul (el nucli només en sap l'estat,
   recuperacioPendent.js). `sessio` és la sessió PRIVADA que torna /verify: el
   token ja s'ha gastat i, si el PUT de la contrasenya falla (feble, la mateixa,
   xarxa), el reintent la reutilitza. No passa mai per identitat.js: cap vista
   ni cap petició de la resta de l'app la pot fer servir. `enCurs` és el «Desa»
   que treballa: un segon el comparteix (definixContrasenyaNova). `desada` és
   l'avís d'una contrasenya que JA és la nova però sense sessió en este
   navegador (contrasenyaDesadaSenseSessio): un altre «Desa» el repetix. */
let enllacPendent = null;   // { tokenHash, sessio: null | { access_token, refresh_token, user }, enCurs: null | Promise, desada: null | string }

/* L'enllaç s'ha deixat mentre «Desa» treballava (eixir, una altra entrada,
   «Torna a entrar»): la pantalla ja no hi és i no es desa cap sessió. */
const enllacDeixat = () => new DOMException('L’enllaç de recuperació s’ha deixat mentre es desava.', 'AbortError');

/* Descarta l'enllaç. Si ja s'havia verificat, la sessió privada es revoca al
   servidor (millor esforç): ningú la farà servir. */
function descartaEnllac() {
  const sessio = enllacPendent?.sessio;
  enllacPendent = null;
  if (sessio?.access_token) revoca(configDarrera, sessio.access_token, 'local');
}
/* Quan el nucli oblida l'enllaç («Torna a entrar», «Demana un enllaç nou»,
   eixir, una entrada explícita), l'adaptador també. */
escoltaRecuperacioPendent(() => {
  if (enllacPendent && estatEnllacDeRecuperacio() !== ESTAT_ENLLAC.PENDENT) descartaEnllac();
});

const enllacCaducat = (causa) => ambCodi(
  new Error(MISSATGE_ENTRADA[CODI_ENTRADA.ENLLAC_CADUCAT], causa ? { cause: causa } : undefined),
  CODI_ENTRADA.ENLLAC_CADUCAT
);

function rutaRecuperacio() {
  let tornada;
  try { tornada = urlDeTornadaRecuperacio(); } catch { throw new Error(SENSE_TORNADA_RECUPERACIO); }
  return `/auth/v1/recover?redirect_to=${encodeURIComponent(tornada)}`;
}

/* Correcció de la revisió · Anti-enumeració. A /recover, GoTrue respon 200 si
   el correu no té compte, però 429 over_email_send_rate_limit si el compte
   existix i ja ha rebut un correu fa massa poc (la freqüència mínima) o si el
   projecte ha esgotat el límit de correus: les dues només passen quan hi ha
   compte. La interfície ha de dir el mateix en tots els casos, i este 429 es
   pren com un enviament. over_request_rate_limit (per IP, no depén del compte)
   continua sent MASSA_INTENTS. L'oracle continua per a qui cride l'API de
   GoTrue directament: això només es pot tancar al servidor. */
const LIMIT_DE_CORREU = 'over_email_send_rate_limit';
const esLimitDeCorreu = (error) => cosDeGoTrue(error)?.error_code === LIMIT_DE_CORREU;

/**
 * Envia l'enllaç per a definir una contrasenya nova. Resol amb
 * { enviat: true } tant si el correu té compte com si no (GoTrue també respon
 * 200; el límit de correus d'un compte, també): la interfície no pot saber-ho
 * ni dir-ho. Només rebutja amb CODI_ENTRADA: servidor inabastable, massa
 * intents des d'esta connexió o desconegut.
 */
export async function demanaRecuperacioContrasenya(correu, config = {}) {
  exigeixModeRemot(config);
  const email = String(correu || '').trim().toLowerCase();
  if (!email) throw ambCodi(new Error(MISSATGE_ENTRADA[CODI_ENTRADA.DESCONEGUT]), CODI_ENTRADA.DESCONEGUT);
  await request(rutaRecuperacio(), config, { method: 'POST', body: { email } })
    .catch((error) => {
      if (esLimitDeCorreu(error)) return null;
      throw traduixErrorEntrada(error);
    });
  return { enviat: true };
}

/* Un GoTrue sense error_code respon 403 a un token caducat o ja usat. */
function traduixErrorDeVerificacio(error) {
  const traduit = traduixErrorEntrada(error);
  if (traduit?.code === CODI_ENTRADA.DESCONEGUT && error?.status === 403) return enllacCaducat(error);
  return traduit;
}

/* El PUT amb la sessió privada: un 401, o un 403 de sessió, vol dir que eixa
   sessió ja no val (ha caducat mentre la persona triava): l'enllaç tampoc. */
const SESSIO_PRIVADA_MORTA = new Set(['bad_jwt', 'session_not_found', 'session_expired']);
function traduixErrorDeContrasenyaNova(error) {
  const codi = cosDeGoTrue(error)?.error_code;
  if (error?.status === 401 || (error?.status === 403 && SESSIO_PRIVADA_MORTA.has(codi))) return enllacCaducat(error);
  return traduixErrorEntrada(error);
}

/* Un enllaç que ja no val s'oblida a l'adaptador; l'estat del nucli es queda
   perquè la pantalla diga per què i oferisca «Demana un enllaç nou». */
const siCaducat = (enllac, error) => {
  if (error?.code === CODI_ENTRADA.ENLLAC_CADUCAT && enllacPendent === enllac) enllacPendent = null;
  return error;
};

/* Correcció de la revisió de R2 · La contrasenya JA és la nova però la sessió
   no es pot desar en este navegador. La privada es revoca (millor esforç):
   ningú la farà servir. L'enllaç es queda, gastat, perquè la pantalla continue
   dient-ho: un altre «Desa» repetix el mateix avís sense xarxa, i «Torna a
   entrar» l'oblida. Torna l'error per a llançar-lo. */
function contrasenyaDesadaSenseSessio(enllac, config, missatge, causa) {
  const { sessio } = enllac;
  enllac.sessio = null;
  enllac.desada = missatge;
  if (sessio?.access_token) revoca(config, sessio.access_token, 'local');
  return new Error(missatge, causa ? { cause: causa } : undefined);
}

/* R2 · «Desa» amb l'enllaç pendent. POST /verify amb el token_hash (com
   verifyOtp({ token_hash, type: 'recovery' }) d'auth-js) → sessió PRIVADA →
   PUT /auth/v1/user amb l'Authorization d'eixa sessió → només llavors es desa
   i s'avisa (sdp:auth-change), pel mateix camí que loginWithPassword. */
async function definixAmbEnllac(enllac, contrasenya, config) {
  recorda(config);
  configuraBackendSessio(config);
  const attempt = beginAuthAttempt();
  try {
    if (!enllac.sessio) {
      /* Sense el senyal de l'intent, a posta (verificació de R2): quan /verify
         arriba al servidor, el token ja s'ha gastat. Avortar-ne la resposta
         perquè la sessió d'abans d'esta pestanya caduca o canvia pel camí el
         cremaria sense deixar cap sessió per al reintent. El topall de la
         petició continua, més generós (TOPALL_DESA_MS). */
      const result = await request('/auth/v1/verify', config, {
        method: 'POST', timeoutMs: TOPALL_DESA_MS, body: { type: TIPUS_RECUPERACIO, token_hash: enllac.tokenHash }
      }).catch((error) => { throw siCaducat(enllac, traduixErrorDeVerificacio(error)); });
      if (!result?.access_token || !result?.user?.id) {
        /* El token s'ha gastat sense sessió: l'enllaç ja no val i la pantalla
           ha d'oferir «Demana un enllaç nou» (ENLLAC_CADUCAT). */
        throw siCaducat(enllac, enllacCaducat(new Error(SENSE_CONFIRMACIO_ENLLAC)));
      }
      if (enllacPendent !== enllac) {
        /* Deixat mentre es verificava: ningú farà servir esta sessió. */
        revoca(config, result.access_token, 'local');
        throw enllacDeixat();
      }
      /* El token ja s'ha gastat: la sessió es guarda ABANS de mirar l'intent, i
         un reintent no torna a verificar. */
      enllac.sessio = result;
    }
    try { attempt.assertCurrent(); } catch (error) { throw new Error(TORNA_A_DESAR, { cause: error }); }
    const { sessio } = enllac;
    /* Correcció de la revisió de R2 · Tampoc el PUT porta el senyal de l'intent:
       quan arriba al servidor, la contrasenya ja és la nova, i avortar-ne la
       resposta deixava un AbortError en anglés a la pantalla i un reintent que
       rebia same_password. Qui deixa l'enllaç pel camí el talla igual (la
       vigència, davall); qui canvia la sessió d'esta pestanya, també (l'intent). */
    const usuari = await request('/auth/v1/user', config, {
      method: 'PUT', timeoutMs: TOPALL_DESA_MS,
      headers: { Authorization: `Bearer ${sessio.access_token}` }, body: { password: contrasenya }
    }).catch((error) => { throw siCaducat(enllac, traduixErrorDeContrasenyaNova(error)); });
    if (!usuari || usuari.error) {
      throw ambCodi(new Error(MISSATGE_ENTRADA[CODI_ENTRADA.DESCONEGUT]), CODI_ENTRADA.DESCONEGUT);
    }
    /* Deixat durant el PUT: l'escolta ja n'ha revocat la sessió privada. */
    if (enllacPendent !== enllac) throw enllacDeixat();
    /* La sessió d'abans d'esta pestanya ha canviat (o una altra entrada ha
       començat) durant el PUT: la contrasenya ja és la nova, però una resposta
       tardana no desa cap sessió damunt (la regla de l'intent). Es diu clar. */
    try { attempt.assertCurrent(); } catch (error) {
      throw contrasenyaDesadaSenseSessio(enllac, config, DESADA_SESSIO_CANVIADA, error);
    }
    /* La contrasenya ja és la nova: ara, i només ara, la sessió és de veres.
       L'adaptador oblida l'enllaç ABANS que el nucli avise: la seua escolta no
       ha de revocar la sessió que es desa. */
    enllacPendent = null;
    if (!desaSessio(sessio)) {
      enllacPendent = enllac;
      const error = contrasenyaDesadaSenseSessio(enllac, config, DESADA_SENSE_SESSIO);
      emetCanvi(null);
      throw error;
    }
    oblidaEnllacDeRecuperacio();
    resetClient();
    emetCanvi(sessio.user);
    completaAlta(config);
    return true;
  } finally { attempt.finish(); }
}

/**
 * «Desa» de la pantalla «Definix la contrasenya nova». R2: UNA sola crida que
 * verifica i definix.
 * · Amb un enllaç pendent en este document (recuperacioPendent.js, 'pendent'):
 *   el verifica ARA i definix la contrasenya amb la sessió que en trau; la
 *   sessió només es desa quan la contrasenya ja és la nova.
 * · Amb una recuperació en curs però sense token (recàrrega, enllaç caducat,
 *   adaptador nou): ENLLAC_CADUCAT, sense xarxa i MAI la sessió viva, que
 *   podria ser d'un altre compte.
 * · Sense cap recuperació en curs: la sessió viva, el PUT /auth/v1/user de
 *   updateUserPassword (la compatibilitat de recuperacioPendent.js, §2).
 * Un segon «Desa» mentre el primer treballa (la interfície ja no el deixa)
 * espera el mateix resultat: el token d'un sol ús no viatja dues vegades.
 * Si la contrasenya ja és la nova però no s'ha pogut obrir la sessió (el
 * navegador no la desa, o la sessió d'esta pestanya ha canviat durant el PUT),
 * un altre «Desa» repetix eixe avís sense xarxa: mai «caducat».
 * Errors de GoTrue traduïts a CODI_ENTRADA (caducat, feble, la mateixa d'abans,
 * servidor, límit). L'estat del nucli l'esborra qui crida (SessionContext), per
 * a tots els backends igual.
 */
export async function definixContrasenyaNova(contrasenya, config = {}) {
  exigeixModeRemot(config);
  if (estatEnllacDeRecuperacio() === null) {
    descartaEnllac();
    try {
      return await updateUserPassword(contrasenya, config);
    } catch (error) {
      throw traduixErrorEntrada(error);
    }
  }
  const enllac = enllacPendent;
  if (!enllac) throw enllacCaducat();
  if (!enllac.enCurs) {
    /* La contrasenya ja és la nova i no hi ha sessió: el mateix avís, sense xarxa. */
    if (enllac.desada) throw new Error(enllac.desada);
    enllac.enCurs = definixAmbEnllac(enllac, contrasenya, config).finally(() => { enllac.enCurs = null; });
  }
  return enllac.enCurs;
}

/* Un error de la tornada de recuperació porta la marca: la interfície porta
   la persona a l'entrada, on pot demanar-ne un altre. */
const deRecuperacio = (error) => {
  if (error && typeof error === 'object') error.recuperacio = true;
  return error;
};

/* R2 · Si la pàgina torna d'un enllaç de recuperació, la URL es neteja de
   seguida i el token espera «Desa» en la memòria d'este mòdul: CAP petició.
   Torna { recuperacio: true } SENSE sessió; si no n'hi ha, null i seguix Google.
   F1-seguiments · Amb la marca `sdp_auth=recuperacio` i sense token, un error
   de GoTrue (l'enllaç caducat o ja usat de la plantilla per defecte): l'avís
   en valencià, ENLLAC_CADUCAT, i la URL neta. Fins ara no deia res i l'error es
   quedava a la URL. La mecànica del token_hash no canvia: es llig i es neteja
   primer, i la marca se'n va després. */
function recullTornadaDeRecuperacio() {
  if (typeof window === 'undefined') return null;
  const tornada = llegixTornadaDeRecuperacio(window.location.href);
  if (tornada) netejaTornadaDeRecuperacio();
  const marca = recullMarcaDeRecuperacio();
  if (!tornada) {
    if (!marca?.error) return null;
    descartaEnllac();
    /* L'estat 'perdut' d'una arribada anterior en esta pestanya no tapa l'avís. */
    oblidaEnllacDeRecuperacio();
    throw deRecuperacio(ambCodi(new Error(ENLLAC_CADUCAT_EN_ARRIBAR), CODI_ENTRADA.ENLLAC_CADUCAT));
  }
  descartaEnllac();
  if (!tornada.tokenHash) {
    /* La forma implícita (plantilla per defecte) no s'adopta mai: ordre del Mestre 261002. */
    if (tornada.motiu === MOTIU_TORNADA.IMPLICITA) console.warn('[supabase] Recuperació amb tokens implícits: cal la plantilla «Reset password» amb token_hash (R.txt).');
    /* L'estat 'perdut' d'una arribada anterior en esta pestanya no tapa l'avís. */
    oblidaEnllacDeRecuperacio();
    throw deRecuperacio(new Error(ENLLAC_INSERVIBLE));
  }
  enllacPendent = { tokenHash: tornada.tokenHash, sessio: null, enCurs: null, desada: null };
  /* ABANS de tornar: l'estat del nucli i el token no es desquadren mai. */
  anunciaEnllacDeRecuperacio();
  return { recuperacio: true };
}

export const recullTornadaOAuth = async (config = {}) => {
  exigeixModeRemot(config);
  recorda(config);
  configuraBackendSessio(config);
  const recuperacio = recullTornadaDeRecuperacio();
  if (recuperacio) return recuperacio;
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
  /* R · Eixir de veres també oblida la recuperació en curs, la marca i l'enllaç
     pendent (també qui ix des de l'amfitrió, sense passar per SessionContext).
     Buidar només la pestanya, no: la sessió continua a les altres. */
  if (abast !== 'pestanya') oblidaRecuperacioPendent();
  /* La revocació ix abans del primer await: el keepalive no espera que tanque
     el Realtime. revoca() usa fetch i la configuració, no el client. */
  const revocacio = jwt ? revoca(destination, jwt, scope) : null;
  await tancaRealtime();
  resetClient();
  emetCanvi(null);
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
  if (scope === 'others') {
    const destination = normalizeBackendConfig(config?.supabaseUrl || config?.backend_url || config?.backendUrl ? config : configDarrera);
    const jwt = getEfimer(CLAU_ORIGEN, null) !== 'amfitrio' ? jwtPerBackend(destination) : null;
    const revocacio = jwt ? revoca(destination, jwt, scope) : null;
    if (revocacio) await esperaAmbTopall(revocacio, ESPERA_REVOCACIO_MS);
    return;
  }
  if (abast === 'pestanya') return tanca({ config, abast: 'pestanya' });
  return tanca({ config, scope: ABASTS_REVOCACIO.includes(scope) ? scope : 'local' });
}
