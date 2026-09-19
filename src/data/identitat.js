import { getRuntimePolicy } from '../config/runtimePolicy.js';

/**
 * identitat.js — Font única de la identitat.
 *
 * REGLA: si hi ha sessió, la identitat és la de la sessió. El convidat només
 * existix mentre no s'ha entrat, i mai substituix un usuari real.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CORRECCIÓ P0 (260908) · EL CISMA DE LA SESSIÓ
 *
 * Hi havia dues meitats d'un mateix sistema d'autenticació que no es parlaven.
 * La capa efímera es va afegir a l'auditoria 260829 per al verificador PKCE;
 * després algú hi va moure també els tokens, però ni el `user`, ni la lectura
 * d'`identitat()`, ni el `logout()` van fer el mateix viatge:
 *
 *   ESCRIPTURA   _renova() i bescanvia()
 *                  jwt           → setEfimer  (sessionStorage)
 *                  refresh-token → setEfimer  (sessionStorage)
 *                  user          → setVal     (emmagatzematge local)   ← desaparellat
 *
 *   LECTURA      buildHeaders()  → getEfimer  ✓
 *                identitat()     → getVal     ✗  no el trobava MAI
 *
 *   ESBORRAT     logout()        → delVal × 3 ✗  no esborrava cap token
 *
 * Tres conseqüències reals, no teòriques:
 *
 *   1 · `getDefaultUserId()` tornava SEMPRE l'uuid de convidat, encara que la
 *       sessió estiguera oberta. `identitat()` buscava el jwt a emmagatzematge local,
 *       on no ha estat mai.
 *
 *   2 · `logout()` no tancava res. Esborrava tres claus de emmagatzematge local; el jwt
 *       i el refresh-token es quedaven vius a sessionStorage i la petició
 *       següent els tornava a usar. El botó d'eixir era decoratiu.
 *
 *   3 · SESSIÓ FANTASMA, la pitjor de les tres. En tancar la pestanya moria el
 *       sessionStorage però el `user` de emmagatzematge local sobrevivia. En tornar:
 *       `getCurrentUser()` tornava una persona, la interfície es pintava com si
 *       hagueres entrat, `buildHeaders()` enviava la clau anònima i CADA
 *       escriptura moria amb un 42501 de RLS. L'usuari veu que està dins i no
 *       pot fer res, sense cap missatge que explique per què.
 *
 * DECISIÓ: les tres peces de la sessió viuen a la MATEIXA capa, l'efímera.
 * Un token que mor amb la pestanya i un usuari que sobreviu no són una sessió:
 * són dues sessions distintes fingint que són una. El preu és tornar a entrar
 * en obrir el navegador; l'alternativa era baixar els tokens a emmagatzematge local, i
 * a un origen de CMS compartit amb Sollutia i qualsevol altre connector
 * això és regalar la sessió a qui vullga llegir-la.
 * ══════════════════════════════════════════════════════════════════════════
 */
import { getVal, setVal, delVal, getEfimer, setEfimer, delEfimer } from '../config/storage.js';

/**
 * LES CLAUS VIUEN ACÍ I NOMÉS ACÍ.
 *
 * Estaven escrites a mà en quatre fitxers. Per això va ser possible moure'n
 * dues de capa i deixar-se'n una: no hi havia cap lloc on es veren juntes.
 */
export const CLAU_JWT = 'socdepoble-jwt';
export const CLAU_REFRESC = 'socdepoble-refresh-token';
export const CLAU_USUARI = 'socdepoble-user';

const CLAU_CONVIDAT = 'socdepoble-guest-session-id';
const UUID_NUL = '00000000-0000-0000-0000-000000000000';
const RE_UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function idConvidat() {
  if (typeof window === 'undefined') return UUID_NUL;
  try {
    let id = getVal(CLAU_CONVIDAT);
    if (!id || !RE_UUID.test(String(id).replace('guest-', ''))) {
      const pseudoRandom = () => 'guest-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
    id = crypto?.randomUUID?.() || pseudoRandom();
      setVal(CLAU_CONVIDAT, id);
    } else if (String(id).startsWith('guest-')) {
      id = String(id).replace('guest-', '');
      setVal(CLAU_CONVIDAT, id);
    }
    return id;
  } catch {
    return UUID_NUL;
  }
}

/**
 * Purga el `user` que va quedar a emmagatzematge local abans d'aquesta correcció.
 *
 * SIDE EFFECT DINS D'UNA LECTURA, I ÉS INTENCIONAT. Els testers que ja tenen
 * la Beta instal·lada porten el blob del GoTrue (amb el seu correu) a
 * emmagatzematge local. Si només canviàrem la capa de lectura, eixe blob es quedaria
 * allí per sempre, perquè només `logout()` el tocava i `logout()` ja no mira
 * emmagatzematge local. S'esborra la primera volta que algú òbriga l'app.
 */
function purgaLlegat() {
  if (typeof document !== 'undefined' && /(?:^|; )(?:socdepoble-|sdp:oauth:)/.test(document.cookie)) {
    for (const k of ['socdepoble-jwt','socdepoble-refresh-token','socdepoble-user', 'sdp:oauth:verificador','sdp:oauth:state','sdp:oauth:cb'])
      document.cookie = `${k}=; path=/; max-age=0; SameSite=Lax`;
  }
  if (typeof window === 'undefined') return;
  try {
    if (getVal(CLAU_USUARI, null)) {
      delVal(CLAU_USUARI);
      delVal(CLAU_JWT);
      delVal(CLAU_REFRESC);
    }
  } catch {
    /* Un navegador que no deixa escriure tampoc deixarà llegir res perillós. */
  }
}

/**
 * L'usuari de la sessió, o null.
 *
 * FAIL-CLOSED: sense jwt no hi ha usuari, encara que el blob hi siga. És el que
 * impedix la sessió fantasma. `getCurrentUser()` de supabaseBackend delega ací
 * perquè hi haja un sol lector i no es torne a obrir el cisma.
 */
export function usuariDeSessio() {
  purgaLlegat();
  const jwt = getEfimer(CLAU_JWT, null);
  if (!jwt) return null;
  /* Un token caducat és un token que no val. Sense açò, la interfície pinta
     l'usuari i cada escriptura mor amb 401: la sessió fantasma, versió 2. */
  const exp = caducitatJwt(jwt);
  if (exp !== null && exp <= Date.now()) return null;
  const usuari = getEfimer(CLAU_USUARI, null);
  return usuari && usuari.id ? usuari : null;
}

/** Guarda la sessió sencera d'una sola volta. Les tres peces o cap. */
export function desaSessio(sessio) {
  if (!sessio?.access_token) return false;
  setEfimer(CLAU_JWT, sessio.access_token);
  setEfimer(CLAU_REFRESC, sessio.refresh_token);
  setEfimer(CLAU_USUARI, sessio.user);
  return true;
}

/** Actualitza camps de l'usuari a la sessió efímera i avisa la UI via sdp:auth-change. */
export function actualitzaUsuariSessio(novesDades = {}) {
  const usuari = getEfimer(CLAU_USUARI, null);
  if (!usuari) return null;

  const actualitzat = {
    ...usuari,
    ...novesDades,
    user_metadata: {
      ...(usuari.user_metadata || {}),
      ...(novesDades.user_metadata || {}),
      ...(novesDades.avatar_url ? { avatar_url: novesDades.avatar_url } : {}),
      ...(novesDades.full_name ? { full_name: novesDades.full_name, name: novesDades.full_name } : {}),
      ...(novesDades.town_name ? { town_name: novesDades.town_name } : {})
    },
    ...(novesDades.avatar_url ? { avatar_url: novesDades.avatar_url } : {})
  };

  setEfimer(CLAU_USUARI, actualitzat);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: actualitzat } }));
  }

  return actualitzat;
}

/** Esborra la sessió sencera. Les dues capes: la nova i el llegat. */
export function esborraSessio() {
  delEfimer(CLAU_JWT);
  delEfimer(CLAU_REFRESC);
  delEfimer(CLAU_USUARI);
  /* El llegat també, perquè qui tanque sessió no s'emporte el fantasma. */
  delVal(CLAU_JWT);
  delVal(CLAU_REFRESC);
  delVal(CLAU_USUARI);
}

/** Torna { id, autenticat, usuari }. Mai llança. */
export function identitat() {
  const usuari = usuariDeSessio();
  if (usuari) return { id: String(usuari.id), autenticat: true, usuari };
  return { id: idConvidat(), autenticat: false, usuari: null };
}

export const getDefaultUserId = () => identitat().id;

/** Oblida el convidat quan ja no fa falta (part del protocol d'Apoptosi). */
export function oblidaConvidat() {
  delVal(CLAU_CONVIDAT);
}

export async function reclamaContingutDelConvidat() {
  // Mode Online-First: la persistència recau completament en el backend.
  return { migrat: 0 };
}

/** Marge abans de la caducitat real. 60 s cobrix la deriva de rellotge del client. */
export const MARGE_RENOVACIO_MS = 60_000;

/**
 * `exp` del JWT en ms, o null.
 *
 * NO VERIFICA LA SIGNATURA I NO HO HA DE FER. Un client no pot validar res:
 * no té la clau. Açò només servix per a saber QUAN demanar la renovació i no
 * esperar el 401. Qui decidix si el token val és Sollutia, sempre.
 * Un `exp` mentit per l'usuari només el perjudica a ell: renovarà abans.
 */
export function caducitatJwt(jwt = getEfimer(CLAU_JWT, null)) {
  if (!jwt || typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const carrega = JSON.parse(decodeURIComponent(
      atob(b64 + '='.repeat((4 - b64.length % 4) % 4))
        .split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ));
    return typeof carrega.exp === 'number' ? carrega.exp * 1000 : null;
  } catch {
    return null;   // token opac o corromput: que decidisca el servidor
  }
}

/** true si el token ja no val. Sense token → true. */
export function sessioCaducada() {
  const exp = caducitatJwt();
  return exp === null ? !getEfimer(CLAU_JWT, null) : exp <= Date.now();
}

/**
 * Accepta una sessió emesa per l'amfitrió (Sollutia).
 *
 * FAIL-CLOSED. Es rebutja i es torna `false` si:
 *   · no hi ha access_token, o no té forma de JWT
 *   · ja està caducat
 *   · `sub` no és un uuid
 *   · l'emissor no és el que esperem (si se'n declara un)
 *
 * El que NO comprova: la signatura. Ací no es pot. Si Sollutia envia un token
 * fals, la primera crida a PostgREST tornarà 401 i el `logout()` del reintent
 * el traurà. Esta funció evita pintar una sessió òbviament morta, no suplix
 * la verificació del servidor.
 */
export function adoptaSessioExterna(sessio, opcionsJS = {}) {
  if (!sessio || typeof sessio !== 'object') return false;
  
  const policy = getRuntimePolicy();
  const issuer = policy.auth.issuer;
  if (!issuer) return false; // si la política no en té, no acceptem sessions externes
  
  if (opcionsJS.emissorEsperat && opcionsJS.emissorEsperat !== issuer) {
    console.error('[identitat] Intents de sessió rebutjats: l\'emissor donat no concorda amb la política immutable.');
    return false;
  }
  
  const { access_token: jwt, refresh_token: refresc, user } = sessio;
  if (typeof jwt !== 'string' || jwt.split('.').length !== 3) return false;

  const exp = caducitatJwt(jwt);
  if (exp === null || exp <= Date.now()) {
    return false;
  }

  let carrega = null;
  try {
    const b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    carrega = JSON.parse(decodeURIComponent(
      atob(b64 + '='.repeat((4 - b64.length % 4) % 4))
        .split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ));
  } catch { return false; }

  if (!carrega?.sub || !RE_UUID.test(String(carrega.sub))) return false;
  if (carrega.iss !== issuer) return false;

  const audiences = policy.auth.audiences || [];
  if (carrega.aud) {
    const tokenAuds = Array.isArray(carrega.aud) ? carrega.aud : [carrega.aud];
    const audValida = tokenAuds.some(a => audiences.includes(a));
    if (!audValida) {
      console.error('[identitat] Audiència del token rebutjada.');
      return false;
    }
  } else {
    // Tokens externs JWT requereixen tenir audiència validada
    return false;
  }

  // Permetem a l'usuari extern proveir dades addicionals, però validant l'identificador
  // Sanegem les dades per evitar injeccions a user_metadata
  const allowedMetadata = ['avatar_url', 'full_name', 'name', 'email'];
  const cleanMetadata = {};
  if (user?.user_metadata) {
    allowedMetadata.forEach(k => {
      if (user.user_metadata[k] !== undefined) cleanMetadata[k] = user.user_metadata[k];
    });
  }

  const usuariFinal = (user && user.id === carrega.sub)
    ? { ...user, user_metadata: cleanMetadata }
    : { id: carrega.sub, email: carrega.email ?? null, user_metadata: cleanMetadata };

  const desada = desaSessio({ access_token: jwt, refresh_token: refresc ?? null, user: usuariFinal });
  if (!desada) return false;

  oblidaConvidat();   // ja no és convidat: el protocol d'Apoptosi tanca ací
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuariFinal } }));
  }
  return true;
}
