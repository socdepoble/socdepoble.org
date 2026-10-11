import { getRuntimePolicy } from '../config/runtimePolicy.js';
import { backendScope } from '../config/backendConfig.js';

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
 *
 * D1 (260926) · LA SESSIÓ SOBREVIU A LA PESTANYA, LA IDENTITAT NO
 *
 * El Mestre ha triat que no calga tornar a entrar cada vegada que s'obri el
 * navegador. La regla del P0 es conserva on importa: el JWT i l'usuari
 * continuen a la capa efímera, i `usuariDeSessio()` continua exigint un JWT
 * viu. A l'emmagatzematge local només baixa UN registre:
 *
 *   { v: 1, rt, sub, t }   refresh token, compte al qual pertany i data
 *
 * És una credencial per a PREGUNTAR al servidor, no una identitat per a
 * pintar. Una pestanya nova no es pinta «dins» fins que GoTrue torna una
 * sessió amb el registre; si no la torna, cau a «fora». La sessió fantasma
 * no torna, perquè cap usuari viu fora de la pestanya.
 *
 *   ENTRADA PRÒPIA   registre ← rt · pestanya ← jwt + usuari + origen 'registre'
 *   RENOVACIÓ        dins d'un Web Lock; el rt rotat es desa ABANS de mirar si
 *                    la sessió ha canviat, o quedaria al registre un de gastat
 *   PESTANYA NOVA    'comprovant' → renovació amb el registre → 'dins' o 'fora'
 *   EIXIR            esborra el registre, revoca al servidor i avisa les altres
 *                    pestanyes amb l'esdeveniment `storage`
 *   AMFITRIÓ         la seua sessió és de pestanya i no baixa MAI al registre;
 *                    si és d'un altre compte, esborra el registre que hi haja.
 *                    Eixir la deixa, però no la revoca: és de l'amfitrió
 *
 * Un compte per navegador: totes les pestanyes que viuen del registre el
 * seguixen (`reconciliaAmbRegistre`). La política `auth.persistencia:
 * 'pestanya'` torna al comportament del P0 per als amfitrions que ho vullguen.
 *
 * El preu no desapareix: qualsevol script del mateix origen pot llegir el
 * registre. Les mitigacions són la rotació amb detecció de reutilització de
 * GoTrue, la revocació en eixir i la política 'pestanya'.
 * ══════════════════════════════════════════════════════════════════════════
 */
import { getVal, setVal, delVal, getEfimer, setEfimer, delEfimer, desaGrupEfimer, STORAGE_PREFIX } from '../config/storage.js';
import { esFontImatgeSegura } from '../utils/sanitize.js';

/**
 * LES CLAUS VIUEN ACÍ I NOMÉS ACÍ.
 *
 * Estaven escrites a mà en quatre fitxers. Per això va ser possible moure'n
 * dues de capa i deixar-se'n una: no hi havia cap lloc on es veren juntes.
 */
export const CLAU_JWT = 'socdepoble-jwt';
export const CLAU_REFRESC = 'socdepoble-refresh-token';
export const CLAU_USUARI = 'socdepoble-user';
/* D1 (260926). Efímera: 'registre' si el refresh token d'esta pestanya viu al registre persistent;
   'amfitrio' si la sessió l'ha injectada l'amfitrió (no es revoca en eixir: és seua). */
export const CLAU_ORIGEN = 'socdepoble-sessio-origen';
/* D1 (260926). Persistent: { v: 1, rt, sub, t }. Cap JWT ni perfil. purgaLlegat no la toca. */
export const CLAU_PERSISTENT = 'socdepoble-sessio-persistent';
export const CLAU_BACKEND = 'socdepoble-sessio-backend';
let backendActiu = null;

/** A configuration change is a new handshake, never a credential migration. */
export function configuraBackendSessio(config) {
  const scope = backendScope(config);
  if (scope === backendActiu) return;
  const canviDeBackend = backendActiu !== null;
  if (getEfimer(CLAU_BACKEND, null) !== scope) esborraSessio({ abast: 'pestanya' });
  backendActiu = scope;
  const stored = getVal(CLAU_PERSISTENT, null);
  if (stored && stored.backend !== scope) delVal(CLAU_PERSISTENT);
  // At initial boot the adapter is not ready yet; SessionProvider resolves it.
  if (canviDeBackend) globalThis.window?.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuariDeSessio() } }));
}

export function esBackendDeSessio(config) {
  return backendActiu !== null && backendScope(config) === backendActiu;
}

export function jwtPerBackend(config) {
  return esBackendDeSessio(config) && getEfimer(CLAU_BACKEND, null) === backendActiu
    ? getEfimer(CLAU_JWT, null) : null;
}

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

export let versioSessio = 0;
let generacioEntrada = 0;

/* ═══════════════ D1 · Registre persistent del refresh token ═══════════════ */

/** La política vigent demana conservar el refresh token. Sense política (proves, abans d'arrencar): no. */
export function persistenciaActiva() {
  return getRuntimePolicy(true)?.auth?.persistencia === 'local';
}

/**
 * El registre vàlid, o null.
 *
 * SIDE EFFECT DINS D'UNA LECTURA, com purgaLlegat: amb la política 'pestanya' el
 * que quede d'una arrencada anterior s'esborra, i un registre malformat també.
 */
export function llegixRegistre() {
  const politica = getRuntimePolicy(true);
  if (!politica) return null;
  if (politica.auth?.persistencia !== 'local') { delVal(CLAU_PERSISTENT); return null; }
  const r = getVal(CLAU_PERSISTENT, null);
  const valid = !!r && typeof r === 'object' && r.v === 1 && typeof r.rt === 'string' && r.rt !== ''
    && typeof r.sub === 'string' && RE_UUID.test(r.sub)
    && (r.backend ?? null) === backendActiu;
  if (r && !valid) delVal(CLAU_PERSISTENT);
  return valid ? r : null;
}
function desaRegistre(rt, sub) {
  return setVal(CLAU_PERSISTENT, { v: 1, rt, sub, t: Date.now(), backend: backendActiu });
}

/** L'esdeveniment `storage` d'una altra pestanya parla del registre (null: s'ha buidat tot). */
export const esClauDelRegistre = (key) => key === null || key === STORAGE_PREFIX + CLAU_PERSISTENT;

/**
 * CAS del refresh token rotat: només substituïx el token que s'acaba de gastar i
 * només si el registre és encara del mateix compte. Es crida DINS del pany i
 * ABANS de mirar si la sessió ha canviat. Torna true si el registre porta `rtNou`.
 */
export function rotaRegistre(rtUsat, rtNou, sub) {
  const r = llegixRegistre();
  if (!r || r.rt !== rtUsat || r.sub !== sub) return false;
  if (typeof rtNou === 'string' && rtNou !== '' && desaRegistre(rtNou, sub)) return true;
  /* Sense token nou o sense quota: un token gastat al registre és pitjor que cap,
     perquè reutilitzar-lo fa que GoTrue revoque la sessió sencera. */
  delVal(CLAU_PERSISTENT);
  return false;
}

/** GoTrue ha rebutjat el token: el registre cau només si encara el porta. */
export function oblidaRegistre(rtUsat) {
  const r = getVal(CLAU_PERSISTENT, null);
  if (r && typeof r === 'object' && r.rt === rtUsat) delVal(CLAU_PERSISTENT);
}

/**
 * Quin refresh token toca gastar, i per a què. Es llig DINS del pany: una altra
 * pestanya el pot haver rotat mentre esta esperava.
 *   'efimer'      la pestanya té el seu (P0, amfitrió o recurs per quota)
 *   'renovacio'   la pestanya viu del registre i el compte hi coincidix
 *   'restauracio' pestanya sense sessió i registre vàlid
 */
export function triaRefresc() {
  const actor = getEfimer(CLAU_USUARI, null)?.id ?? null;
  if (actor != null && getEfimer(CLAU_ORIGEN, null) !== 'registre') {
    const rt = getEfimer(CLAU_REFRESC, null);
    return typeof rt === 'string' && rt !== '' ? { rt, mode: 'efimer', sub: String(actor) } : null;
  }
  const r = llegixRegistre();
  if (!r || (actor != null && String(actor) !== r.sub)) return null;
  return { rt: r.rt, mode: actor != null ? 'renovacio' : 'restauracio', sub: r.sub };
}

/**
 * Un compte per navegador. Una pestanya que viu del registre i que el registre ja
 * no cobrix (eixida o canvi de compte en una altra pestanya) s'esborra ella sola i
 * avisa. Les sessions de l'amfitrió i les de recurs efímer no depenen del registre.
 */
export function reconciliaAmbRegistre() {
  if (getEfimer(CLAU_ORIGEN, null) !== 'registre') return false;
  const actor = getEfimer(CLAU_USUARI, null)?.id;
  if (actor != null && llegixRegistre()?.sub === String(actor)) return false;
  esborraSessio({ abast: 'pestanya' });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } }));
  }
  return true;
}

/** Comptador d'entrades: una renovació no el mou; eixir o tornar a entrar, sí. */
export const entradaSessio = () => generacioEntrada;

/** Una renovació conserva l'entrada; logout o reentrada, inclús d'A, la canvia. */
export function capturaSessio() {
  const generacio = generacioEntrada;
  const actor = getEfimer(CLAU_USUARI, null)?.id;
  return () => {
    if (generacio !== generacioEntrada || actor !== getEfimer(CLAU_USUARI, null)?.id) {
      throw new DOMException('La sessió ha canviat.', 'AbortError');
    }
  };
}

/**
 * Guarda la sessió sencera d'una sola volta. Les tres peces o cap.
 *
 * D1: una entrada pròpia amb la política 'local' deixa el refresh token al
 * registre i no a la pestanya. Renovar o restaurar no reescriu el registre: el
 * rota auth.js amb CAS abans d'arribar ací. Una entrada nova d'un altre compte,
 * també la de l'amfitrió (`origen: 'amfitrio'`), esborra el registre anterior.
 */
export function desaSessio(sessio, { renovacio = false, restauracio = null, origen = 'propia' } = {}) {
  if (!sessio?.access_token || !sessio?.user?.id) return false;
  if (renovacio && sessio.user.id !== getEfimer(CLAU_USUARI, null)?.id) return false;
  if (restauracio && String(sessio.user.id) !== restauracio.sub) return false;
  const sub = String(sessio.user.id);
  const rt = typeof sessio.refresh_token === 'string' && sessio.refresh_token ? sessio.refresh_token : null;
  const entradaNova = !renovacio && !restauracio;
  let viaRegistre = !!restauracio || (renovacio && getEfimer(CLAU_ORIGEN, null) === 'registre');
  if (entradaNova) {
    const previ = getVal(CLAU_PERSISTENT, null);
    if (previ && previ.sub !== sub) delVal(CLAU_PERSISTENT);
    viaRegistre = origen === 'propia' && !!rt && persistenciaActiva() && RE_UUID.test(sub) && desaRegistre(rt, sub);
    /* Quota o política: recurs efímer, com abans de D1, i cap registre d'una altra entrada. */
    if (origen === 'propia' && !viaRegistre) delVal(CLAU_PERSISTENT);
  }
  /* 'amfitrio' es conserva en renovar: la sessió continua sent de l'amfitrió i no es revoca en eixir. */
  const deLAmfitrio = entradaNova ? origen === 'amfitrio' : getEfimer(CLAU_ORIGEN, null) === 'amfitrio';
  versioSessio++;
  if (!renovacio) generacioEntrada++;
  const ok = desaGrupEfimer({
    [CLAU_BACKEND]: backendActiu,
    [CLAU_USUARI]: sessio.user,
    [CLAU_REFRESC]: viaRegistre ? null : rt,
    [CLAU_ORIGEN]: viaRegistre ? 'registre' : deLAmfitrio ? 'amfitrio' : null,
    [CLAU_JWT]: sessio.access_token
  });
  /* Una entrada que acaba de crear el registre i no pot omplir la pestanya no deixa res
     recuperable; una renovació o restauració fallida no trau les altres pestanyes. */
  if (!ok) esborraSessio({ abast: entradaNova && viaRegistre ? 'tot' : 'pestanya' });
  return ok;
}

/**
 * D6 (auditoria 260925_1316) · Hi ha una sessió desada que el JWT ja no cobrix,
 * però el refresh token encara la pot tornar. Només ho diu: renovar és cosa de
 * sessionService, que ho prova una sola volta abans de declarar-la fora.
 * D1: també quan la pestanya és nova i només hi ha el registre persistent.
 */
export function sessioRecuperable() {
  if (usuariDeSessio()) return false;
  const tria = triaRefresc();
  if (!tria) return false;
  return tria.mode !== 'efimer' || !!getEfimer(CLAU_JWT, null);
}

/** Actualitza camps de l'usuari a la sessió efímera i avisa la UI via sdp:auth-change. */
export function actualitzaUsuariSessio(novesDades = {}) {
  const usuari = getEfimer(CLAU_USUARI, null);
  if (!usuari) return null;

  let avatar_url = novesDades.avatar_url;
  if (avatar_url && !esFontImatgeSegura(avatar_url)) {
    avatar_url = undefined;
  }
  /* avatar_url present i buit = la persona ha esborrat la foto. Fora també la
     `picture` de Google: si no, la barra i el selector hi tornarien a caure. */
  const esborraAvatar = Object.hasOwn(novesDades, 'avatar_url') && !novesDades.avatar_url;
  const metadades = { ...(usuari.user_metadata || {}) };
  if (esborraAvatar) { delete metadades.avatar_url; delete metadades.picture; }

  const actualitzat = {
    ...usuari,
    ...(novesDades.email ? { email: novesDades.email } : {}),
    ...(novesDades.phone ? { phone: novesDades.phone } : {}),
    ...(novesDades.role ? { role: novesDades.role } : {}),
    user_metadata: {
      ...metadades,
      ...(avatar_url ? { avatar_url } : {}),
      ...(novesDades.full_name ? { full_name: novesDades.full_name, name: novesDades.full_name } : {}),
      ...(novesDades.town_name ? { town_name: novesDades.town_name } : {})
    },
    ...(avatar_url ? { avatar_url } : {})
  };
  if (esborraAvatar) delete actualitzat.avatar_url;

  if (!setEfimer(CLAU_USUARI, actualitzat)) {
    /* La pestanya no pot escriure; el compte no ha fet res. D1: el registre es queda. */
    esborraSessio({ abast: 'pestanya' });
    throw new Error('No s’ha pogut desar la sessió. Torna a entrar.');
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: actualitzat } }));
  }

  return actualitzat;
}

/**
 * Esborra la sessió de la pestanya. Les dues capes: la nova i el llegat.
 * D1 · què li passa al registre persistent segons l'abast:
 *   'actor'    (per defecte, eixir) s'esborra si és del compte d'esta pestanya
 *   'pestanya' es queda: una fallada local no trau les altres pestanyes
 *   'tot'      s'esborra, siga de qui siga
 */
export function esborraSessio({ abast = 'actor' } = {}) {
  const actor = getEfimer(CLAU_USUARI, null)?.id ?? null;
  versioSessio++;
  generacioEntrada++;
  delEfimer(CLAU_JWT);
  delEfimer(CLAU_REFRESC);
  delEfimer(CLAU_ORIGEN);
  delEfimer(CLAU_USUARI);
  /* El llegat també, perquè qui tanque sessió no s'emporte el fantasma. */
  delVal(CLAU_JWT);
  delVal(CLAU_REFRESC);
  delVal(CLAU_USUARI);
  if (abast === 'pestanya') return;
  const registre = getVal(CLAU_PERSISTENT, null);
  if (registre && (abast === 'tot' || (actor != null && registre.sub === String(actor)))) {
    delVal(CLAU_PERSISTENT);
  }
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
  const carrega = carregaJwt(jwt);
  return typeof carrega?.exp === 'number' ? carrega.exp * 1000 : null;
}

/**
 * Onada 11 (261010; prompt 261010_1730, tasca 2) · La càrrega (payload) del
 * JWT descodificada, o null si no té forma de JWT, és opac o està corromput.
 * Pura. NO VERIFICA LA SIGNATURA, com caducitatJwt: ací només es llig el que
 * el servidor ha dit; qui decidix si val és el servidor. Un sol descodificador
 * per a caducitatJwt, nivellDAsseguranca i adoptaSessioExterna.
 */
export function carregaJwt(jwt) {
  if (!jwt || typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const carrega = JSON.parse(decodeURIComponent(
      atob(b64 + '='.repeat((4 - b64.length % 4) % 4))
        .split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ));
    return carrega && typeof carrega === 'object' ? carrega : null;
  } catch {
    return null;   // token opac o corromput: que decidisca el servidor
  }
}

/**
 * Onada 11 (261010; prompt 261010_1730, tasca 2) · El nivell d'asseguranca
 * de la sessió, el claim `aal` de GoTrue: 'aal1' (només contrasenya o Google)
 * o 'aal2' (segon factor confirmat). null sense JWT, amb un token opac o sense
 * el claim. private.es_superadmin() exigix aal2 (migració 2610061448): la
 * interfície ho pregunta ací per a saber si el superadmin ha de confirmar el
 * segon factor abans que el servidor li torne 42501.
 */
export function nivellDAsseguranca(jwt = getEfimer(CLAU_JWT, null)) {
  const aal = carregaJwt(jwt)?.aal;
  return aal === 'aal1' || aal === 'aal2' ? aal : null;
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
  
  const policy = getRuntimePolicy(true);
  const issuer = policy?.auth?.issuer;
  if (!issuer) {
    console.error('[identitat] Intents de sessió rebutjats: no s\'ha configurat cap emissor (issuer). Reviseu VITE_SOLLUTIA_ISSUER.');
    return false; // si la política no en té, no acceptem sessions externes
  }
  
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

  /* Onada 11 (261010) · El mateix descodificador que caducitatJwt (carregaJwt). */
  const carrega = carregaJwt(jwt);
  if (!carrega) return false;

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
  /* Només del blob del mateix `sub`: el nom i l'avatar d'una altra persona no
     es pengen a este token. */
  if (user?.user_metadata && user.id === carrega.sub) {
    allowedMetadata.forEach(k => {
      if (user.user_metadata[k] !== undefined) cleanMetadata[k] = user.user_metadata[k];
    });
  }

  const usuariFinal = (user && user.id === carrega.sub)
    ? { ...user, user_metadata: cleanMetadata }
    : { id: carrega.sub, email: carrega.email ?? null, user_metadata: cleanMetadata };

  /* D1: la sessió de l'amfitrió és de pestanya; mai baixa al registre persistent. */
  const desada = desaSessio({ access_token: jwt, refresh_token: refresc ?? null, user: usuariFinal }, { origen: 'amfitrio' });
  if (!desada) return false;

  oblidaConvidat();   // ja no és convidat: el protocol d'Apoptosi tanca ací
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuariFinal } }));
  }
  return true;
}
