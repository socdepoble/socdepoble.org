/**
 * oauthRelay.js — ENTRADA AMB GOOGLE QUE TORNA A LA PÀGINA DE L'AMFITRIÓ
 *
 * PROBLEMA QUE RESOL (P1 de l'Onada 3, 261003 · Model B):
 *   Fins al 261003 la tornada d'OAuth era un relé fix d'un domini propi de
 *   Sóc de Poble, amb una llista d'orígens escrita a mà dins del seu HTML.
 *   Cap amfitrió nou no hi era: per a gentdelatorre.net calia canviar codi i
 *   redesplegar el relé. I, mentre el relé no era a la llista de GoTrue, GoTrue
 *   NO fallava: queia en silenci a la Site URL del projecte, i la persona
 *   acabava a la /registre d'una SPA vella, fora de l'amfitrió.
 *   (Auditoria 260829: abans del relé, el mateix forat amb `redirect_to =
 *   origin + pathname` i cap codi que llegira la tornada.)
 *
 * ESTRATÈGIA:
 *   L'SPA és cega al seu amfitrió. La tornada és la pàgina on la persona ha
 *   premut el botó, llegida en el moment de window.location (urlDeTornada):
 *   origen + camí + consulta, sense fragment ni paràmetres d'OAuth. Cap domini
 *   escrit en este fitxer. La persona torna a la mateixa pàgina, amb els
 *   mateixos paràmetres: GoTrue hi afig `code` i reescriu la consulta (ordena
 *   les claus i la recodifica), així que el text pot no ser idèntic.
 *   L'alta per correu (supabase/auth.js) usa la mateixa tornada perquè
 *   l'enllaç de confirmació no caiga a la Site URL del projecte.
 *
 * QUI VALIDA LA TORNADA:
 *   · GoTrue, al servidor: el `redirect_to` ha de ser a les Redirect URLs del
 *     projecte de Supabase (una entrada per amfitrió amb comodí final `**`,
 *     millor sobre el camí de l'app que sobre tot el lloc).
 *     És el control de veres, i és configuració, no codi. Si l'amfitrió no hi
 *     és, GoTrue cau en silenci a la Site URL.
 *   · El client, abans d'eixir (esTornadaValida): URL absoluta http(s), del
 *     mateix origen que la pàgina, sense fragment ni credencials i de
 *     LONGITUD_MAXIMA_TORNADA caràcters com a molt. Cap redirector obert.
 *   · De tornada, el codi només viatja cap a l'origen de la pàgina, que és el
 *     que GoTrue ha acceptat: la mare només escolta l'emergent i eixe origen, i
 *     l'emergent només li parla a eixe origen. Cap paràmetre de la URL tria el
 *     destinatari del codi.
 *
 * PER QUÈ PKCE I NO IMPLICIT:
 *   Amb el flux implícit torna un `access_token` al fragment de la URL, que
 *   acaba a l'historial del navegador. Amb PKCE torna un codi d'un sol ús
 *   que no val res sense el verificador, i el verificador no ix mai de la
 *   pestanya que va començar el flux.
 *
 * TRES CAMINS DE TORNADA, per ordre:
 *   1. Emergent + `window.opener.postMessage` — el camí net. L'emergent torna a
 *      la mateixa pàgina, hi arrenca l'SPA i gestionaTornada li passa el codi
 *      a la mare.
 *   2. Emergent + esdeveniment `storage` — quan Google talla l'`opener` amb
 *      capçaleres COOP. Passa de veres; no és teòric.
 *   3. Redirecció completa — iPads amb emergents bloquejats. La pàgina torna
 *      on estava i la URL es neteja després del bescanvi.
 *      P6 (PWA, 261003): també, i directament, quan l'app corre instal·lada
 *      (esAppInstallada). A la pantalla d'inici d'iOS, window.open obri un
 *      full de Safari a banda, sense opener ni el mateix emmagatzematge: ni el
 *      camí 1 ni el 2 hi arriben i l'entrada es penjaria fins a TEMPS_MAXIM_MS.
 *      La redirecció manté el verificador a la mateixa pestanya.
 *   La finestra amfitriona no navega mai fora en els casos 1 i 2.
 *
 * BESCANVI VERIFICAT (260925) contra @supabase/auth-js 2.112.4,
 *   `_exchangeCodeForSession`: POST /token?grant_type=pkce amb `auth_code` i
 *   `code_verifier`. Són `EXCHANGE_GRANT` i `EXCHANGE_FIELD`, aïllats a propòsit.
 *
 * SENSE `state` PROPI (auditoria 260925_1316, D2.1):
 *   el client oficial no n'envia cap a /authorize (`_getUrlForProvider`) i GoTrue
 *   no torna el del client: el seu `state` és intern, entre GoTrue i Google.
 *   Exigir-lo de tornada tancava la porta a tota entrada amb Google. La defensa
 *   contra el codi injectat (CSRF d'entrada) és PKCE: un codi només es bescanvia
 *   amb el verificador de la pestanya que va obrir el flux, i s'esborra en usar-lo.
 *   Es mantenen la validació d'origen i de font del missatge.
 */

import { setVal, delVal, getEfimer, setEfimer, delEfimer, STORAGE_PREFIX } from '../config/storage.js';
import { beginAuthAttempt } from './authAttempt.js';
import { backendScope } from '../config/backendConfig.js';
import { desaSessio } from './identitat.js';

/* ───────────────────────── Configuració ───────────────────────── */

const CLAU_VERIFICADOR = 'sdp:oauth:verificador';
const CLAU_TRASPAS = 'sdp:oauth:traspas';
const EXCHANGE_GRANT = 'pkce';
const EXCHANGE_FIELD = 'auth_code';
const TEMPS_MAXIM_MS = 180000;

/* ───────────────────────── La tornada ───────────────────────── */

/* Paràmetres que l'entrada deixa a la URL de la pàgina i que no en formen part:
   els de GoTrue (code; error, error_code i error_description si falla), els del
   relé retirat (sdp_code, sdp_oauth_error) i el state llegat. Mai no viatgen
   dins de la tornada i es lleven en tornar. */
const PARAMETRES_DE_TORNADA = Object.freeze([
  'code', 'state', 'error', 'error_code', 'error_description', 'sdp_code', 'sdp_oauth_error'
]);

/* La tornada viatja codificada dins de `redirect_to`, i GoTrue la guarda: un
   topall que cap navegador ni proxy no talla. */
const LONGITUD_MAXIMA_TORNADA = 2048;

const esHttp = (url) => url.protocol === 'https:' || url.protocol === 'http:';

/**
 * Una tornada és vàlida si és una URL absoluta http(s) del mateix origen que
 * la pàgina, sense fragment ni credencials i de LONGITUD_MAXIMA_TORNADA
 * caràcters com a molt. Pura: no llig window.
 * @param {unknown} url
 * @param {string} origenPagina
 * @returns {boolean}
 */
export function esTornadaValida(url, origenPagina) {
  if (typeof url !== 'string' || !url || url.length > LONGITUD_MAXIMA_TORNADA || url.includes('#')) return false;
  let tornada;
  try { tornada = new URL(url); } catch { return false; }
  if (!esHttp(tornada) || tornada.username || tornada.password) return false;
  return tornada.origin === origenPagina;
}

/* La consulta sense els PARAMETRES_DE_TORNADA. La resta va literal, sense
   reserialitzar: «?buit&a=b%20c» no es convertix en «?buit=&a=b+c». En la
   tornada, la consulta ja ve reescrita per GoTrue, i també es deixa tal qual. */
function senseParametresDeTornada(cerca) {
  if (!cerca || cerca === '?') return '';
  const parells = cerca.slice(1).split('&').filter((parell) => {
    const clau = parell.split('=')[0].replace(/\+/g, ' ');
    let nom = clau;
    try { nom = decodeURIComponent(clau); } catch { /* clau mal codificada: es compara tal qual */ }
    return !PARAMETRES_DE_TORNADA.includes(nom);
  });
  return parells.length ? `?${parells.join('&')}` : '';
}

/**
 * La pàgina de l'amfitrió on s'ha premut el botó, llegida en el moment: origen
 * + camí + consulta, sense fragment ni PARAMETRES_DE_TORNADA. Si passa del
 * topall, cau al camí sense consulta i, després, a l'arrel del mateix origen:
 * mai ix de l'origen de la pàgina. Llança si la pàgina no és http(s) (un
 * about:blank, un file:): no hi ha cap tornada possible.
 * @param {{ href: string }} [pagina] window.location per defecte
 * @returns {string}
 */
export function urlDeTornada(pagina = window.location) {
  let actual = null;
  try { actual = new URL(String(pagina?.href)); } catch { /* no és una URL */ }
  if (!actual || !esHttp(actual)) {
    throw new Error('L’entrada amb Google necessita una pàgina http o https on tornar.');
  }
  const candidates = [
    actual.origin + actual.pathname + senseParametresDeTornada(actual.search),
    actual.origin + actual.pathname,
    `${actual.origin}/`
  ];
  const tornada = candidates.find((url) => esTornadaValida(url, actual.origin));
  if (!tornada) throw new Error('L’entrada amb Google necessita una pàgina http o https on tornar.');
  return tornada;
}

/* ───────────────────────── PKCE ───────────────────────── */

const ALFABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

export function generaVerificador(longitud = 64) {
  const bytes = new Uint8Array(longitud);
  crypto.getRandomValues(bytes);
  let eixida = '';
  for (const b of bytes) eixida += ALFABET[b % ALFABET.length];
  return eixida;
}

function base64url(buffer) {
  let bin = '';
  for (const b of new Uint8Array(buffer)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generaRepte(verificador) {
  const dades = new TextEncoder().encode(verificador);
  return base64url(await crypto.subtle.digest('SHA-256', dades));
}

/* ───────────────────────── Bescanvi ───────────────────────── */

async function bescanvia(codi, verificador, config, attempt) {
  const { supabaseUrl, supabaseAnonKey } = config;
  if (getEfimer('sdp:oauth:backend', null) !== backendScope(config)) {
    throw new Error('El backend de l’entrada ha canviat. Torna a entrar.');
  }
  attempt.assertCurrent();
  const timeout = setTimeout(() => attempt.controller.abort(), 12000);
  try {
  const resposta = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=${EXCHANGE_GRANT}`, {
    method: 'POST', redirect: 'error', signal: attempt.signal,
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ [EXCHANGE_FIELD]: codi, code_verifier: verificador })
  });

  attempt.assertCurrent();
  if (!resposta.ok) {
    const cos = await resposta.text().catch(() => '');
    throw new Error(`No s'ha pogut completar l'entrada (${resposta.status}). ${cos}`);
  }

  const sessio = await resposta.json();
  attempt.assertCurrent();
  if (!sessio?.access_token) throw new Error('El servidor no ha tornat cap sessió.');

  /* CORRECCIÓ P0 (260908). Abans: els dos tokens a sessionStorage i el `user`
     a localStorage amb setVal. Les tres peces han de tindre la mateixa vida o
     l'app es queda amb un usuari sense token (sessió fantasma). Ho fa
     `desaSessio`, que és l'únic lloc del projecte que escriu les tres claus.
     D1 (260926): és una entrada pròpia, i amb la política 'local' el refresh
     token va al registre persistent; el JWT i l'usuari continuen a la pestanya. */
  if (!desaSessio(sessio)) throw new Error('El servidor no ha tornat una sessió vàlida.');
  netejaIntent(verificador);
  window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: sessio.user } }));
  return sessio;
  } finally { clearTimeout(timeout); }
}

function netejaIntent(verificador) {
  if (getEfimer(CLAU_VERIFICADOR, null) !== verificador) return;
  delEfimer(CLAU_VERIFICADOR);
  delEfimer('sdp:oauth:backend');
  delEfimer('sdp:oauth:state');   // llegat: pestanyes que van començar el flux abans del 260925
}

/* ───────────────────────── Anada ───────────────────────── */

/**
 * P6 (PWA, 261003) · L'app corre instal·lada (pantalla d'inici): el mode de
 * visualització «standalone» del manifest o, a iOS, navigator.standalone.
 * Allí l'entrada no obri cap emergent (camí 3, vegeu la capçalera).
 * @param {Window} [finestra]
 * @returns {boolean}
 */
export function esAppInstallada(finestra = window) {
  try {
    if (finestra?.matchMedia?.('(display-mode: standalone)')?.matches === true) return true;
  } catch { /* un matchMedia que llança no és cap senyal */ }
  try { return finestra?.navigator?.standalone === true; } catch { return false; }
}

/* Camí 3 · la pestanya sencera va a l'autorització. Les crides passen per
   _intern perquè les proves la puguen observar: jsdom no navega. */
function redirigeix(url) {
  window.location.href = url;
}

/**
 * Obri l'entrada amb Google. Resol amb la sessió; rebutja amb un error
 * llegible. La pàgina amfitriona no navega si l'emergent s'obri.
 */
export async function entraAmbGoogle(config = {}, resolConfig) {
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = resolConfig(config);
  if (!hasSupabaseConfig) throw new Error('L\'entrada amb Google necessita connexió amb Supabase.');

  /* P1 (261003) · On torna la persona, abans d'obrir res: si la pàgina no té
     tornada possible, no s'obri cap finestra. Síncron, com tot fins a
     window.open: Safari no perd el gest. */
  const tornada = urlDeTornada();

  // Circuit Breaker per evitar bucles de redirecció cap a l'autenticació
  const clauCb = 'sdp:oauth:cb';
  const intentsCb = getEfimer(clauCb, { count: 0, time: Date.now() });
  if (Date.now() - intentsCb.time > 60000) {
    intentsCb.count = 1;
    intentsCb.time = Date.now();
  } else {
    intentsCb.count += 1;
  }
  setEfimer(clauCb, intentsCb);

  if (intentsCb.count > 4) {
    throw new Error('Massa intents d\'inici de sessió seguits. Circuit Breaker activat. Espera un minut.');
  }

  // Obertura síncrona per evitar bloqueig a Safari (Safari matarà el popup si ve després d'un await)
  const attempt = beginAuthAttempt();
  /* P6 · Instal·lada, cap emergent: emergent = null porta al camí 3. */
  let emergent = null;
  if (!esAppInstallada()) {
    try { emergent = window.open('', 'sdp-oauth', 'width=520,height=680'); }
    catch (error) { attempt.finish(); throw error; }
  }

  // Cancel·lar A tanca la seua finestra abans que B puga reutilitzar el nom.
  // Els catch tardans d'A no poden tornar a tancar el WindowProxy de B.
  let popupTancat = false;
  const tancaPopup = () => {
    if (popupTancat) return;
    popupTancat = true;
    try { emergent?.close(); } catch { /* ja tancada */ }
  };
  attempt.signal.addEventListener('abort', tancaPopup, { once: true });
  const acabaIntent = () => {
    attempt.signal.removeEventListener('abort', tancaPopup);
    attempt.finish();
  };

  let verificador, repte;
  try {
    verificador = generaVerificador();
    repte = await generaRepte(verificador);
    attempt.assertCurrent();
  } catch (error) { tancaPopup(); acabaIntent(); throw error; }
  if (!setEfimer(CLAU_VERIFICADOR, verificador)
      || !setEfimer('sdp:oauth:backend', backendScope({ ...config, supabaseUrl, supabaseAnonKey }))) {
    netejaIntent(verificador); tancaPopup(); acabaIntent();
    throw new Error('No s’ha pogut desar el verificador d’entrada.');
  }

  // Els mateixos paràmetres que auth-js: PKCE i res més (cap `state`, vegeu la capçalera).
  const url = `${supabaseUrl}/auth/v1/authorize`
    + `?provider=google`
    + `&code_challenge=${encodeURIComponent(repte)}`
    + `&code_challenge_method=S256`
    + `&redirect_to=${encodeURIComponent(tornada)}`;

  // Camí 3: emergent bloquejat, o l'app instal·lada (P6). Redirecció completa.
  if (!emergent) {
    _intern.redirigeix(url);
    return new Promise(() => {}); // Penjarà a propòsit perquè ja naveguem.
  }

  try {
    emergent.location.href = url;
  } catch {
    // Fallback extrem si el navegador bloqueja mutar l'emergent
    _intern.redirigeix(url);
    return new Promise(() => {});
  }

  return esperaCodi(emergent, new URL(tornada).origin, attempt, tancaPopup)
    .then((codi) => bescanvia(codi, verificador, { ...config, supabaseUrl, supabaseAnonKey }, attempt))
    .catch((err) => {
      tancaPopup();
      throw err;
    })
    .finally(() => { netejaIntent(verificador); acabaIntent(); });
}

/**
 * Escolta les dues vies de tornada de l'emergent alhora. `origenTornada` és el
 * de la pàgina: l'únic des d'on l'emergent pot parlar.
 */
function esperaCodi(emergent, origenTornada, attempt, tancaPopup) {
  return new Promise((resol, rebutja) => {
    let acabat = false;

    const neteja = () => {
      attempt.signal.removeEventListener('abort', perAbort);
      window.removeEventListener('message', perMissatge);
      window.removeEventListener('storage', perStorage);
      clearInterval(vigilant);
      clearTimeout(rellotge);
      delVal(CLAU_TRASPAS);
    };
    const acaba = (fn, valor) => { if (acabat) return; acabat = true; neteja(); fn(valor); };

    function perAbort() {
      tancaPopup();
      acaba(rebutja, new DOMException('Entrada cancel·lada.', 'AbortError'));
    }

    // Camí 1 — l'emergent ha tornat a la pàgina, del mateix origen, i ens parla.
    function perMissatge(e) {
      if (e.origin !== origenTornada) return; // Validació estricta: l'origen de la tornada
      if (e.source !== emergent) return;
      const d = e.data;
      if (!d || d.type !== 'sdp:oauth') return;
      if (d.error) return acaba(rebutja, new Error(d.error));
      if (d.code) acaba(resol, d.code);
    }

    // Camí 2 — Google ha tallat l'`opener` amb COOP. L'emergent deixa el
    // codi a l'emmagatzematge del nostre origen i açò el replega.
    function perStorage(e) {
      if (e.key !== STORAGE_PREFIX + CLAU_TRASPAS || !e.newValue) return;
      try {
        const d = JSON.parse(e.newValue);
        if (!d.t || Date.now() - d.t > 120000) return;
        if (d?.error) return acaba(rebutja, new Error(d.error));
        if (d?.code) acaba(resol, d.code);
      } catch { /* valor malmés: s'ignora */ }
    }

    const vigilant = setInterval(() => {
      try {
        if (emergent.closed) acaba(rebutja, new Error('S\'ha tancat la finestra abans d\'acabar d\'entrar.'));
      } catch {
        // Bloqueig de COOP. No podem accedir a emergent.closed, confiem en storage o timeout.
      }
    }, 700);

    const rellotge = setTimeout(() => {
      tancaPopup();
      acaba(rebutja, new Error('L\'entrada ha tardat massa. Torna a provar.'));
    }, TEMPS_MAXIM_MS);

    attempt.signal.addEventListener('abort', perAbort, { once: true });
    if (attempt.signal.aborted) { perAbort(); return; }
    window.addEventListener('message', perMissatge);
    window.addEventListener('storage', perStorage);
  });
}

/* ───────────────────────── Tornada ───────────────────────── */

/**
 * Crida-la UNA vegada quan l'app es munte, abans de pintar res.
 *
 * Resol tres situacions:
 *   a) Som l'emergent que acaba de tornar a la pàgina → passem el codi a la
 *      finestra mare i ens tanquem.
 *   b) Som la finestra principal després d'una redirecció completa → bescanviem.
 *   c) No hi ha res a la URL → no fem res.
 */
export async function gestionaTornada(config = {}, resolConfig) {
  if (typeof window === 'undefined') return null;
  delVal(CLAU_TRASPAS);

  const qSearch = new URLSearchParams(window.location.search);
  const qHash = new URLSearchParams(window.location.hash.substring(1));

  // (Suport per a flux implícit suprimit per motius de seguretat - utilitzem PKCE amb auth.js)

  const codi = qSearch.get('sdp_code') || qSearch.get('code') || qHash.get('sdp_code') || qHash.get('code');
  const error = qSearch.get('sdp_oauth_error') || qSearch.get('error') || qSearch.get('error_description') || qHash.get('sdp_oauth_error') || qHash.get('error') || qHash.get('error_description');
  if (!codi && !error) {
    /* Ordre del Mestre (261002) · Tokens del flux implícit al fragment (un
       enllaç de confirmació de correu de GoTrue, o un d'injectat): mai
       s'adopten, però tampoc es deixen a la barra d'adreces ni a l'historial. */
    if (qHash.has('access_token') || qHash.has('refresh_token')) netejaRetorn();
    return null;
  }

  const somEmergent = (() => {
    try { return window.opener && window.opener !== window; } catch { return false; }
  })();

  // (a) Som l'emergent: no bescanviem ací — el verificador viu a la mare.
  if (somEmergent || window.name === 'sdp-oauth') {
    netejaRetorn();

    /* P1 (261003) · L'emergent ha tornat a la pàgina on va començar l'entrada,
       del mateix origen que la mare i acceptada per GoTrue: el codi només ix cap
       a este origen. Cap paràmetre de la URL (un sdp_origin del relé retirat, o
       un d'injectat) tria el destinatari. */
    const carrega = error ? { type: 'sdp:oauth', error } : { type: 'sdp:oauth', code: codi };
    try {
      window.opener.postMessage(carrega, window.location.origin);
    } catch {
      // COOP ens ha tallat l'`opener`. Via storage.
      setVal(CLAU_TRASPAS, { ...carrega, t: Date.now() });
    }
    if (!window.opener) setVal(CLAU_TRASPAS, { ...carrega, t: Date.now() });
    setTimeout(() => { try { window.close(); } catch { /* ignora */ } }, 60);
    return null;
  }

  // (b) Finestra principal després de redirecció completa.
  if (error) {
    netejaRetorn();
    throw new Error(error);
  }

  /* Fail-closed per PKCE: un codi que arriba a una pestanya sense verificador
     (enllaç injectat, pestanya nova) no es bescanvia; un codi d'un altre flux no
     casa amb este verificador i GoTrue el rebutja. */
  const verificador = getEfimer(CLAU_VERIFICADOR, null);
  if (!verificador) {
    netejaRetorn();
    throw new Error('S\'ha perdut el verificador d\'esta entrada. Torna a començar des del botó d\'entrar.');
  }
  const { supabaseUrl, supabaseAnonKey } = resolConfig(config);
  const attempt = beginAuthAttempt();
  const returnUrl = window.location.href;
  return bescanvia(codi, verificador, { ...config, supabaseUrl, supabaseAnonKey }, attempt)
    .finally(() => { netejaIntent(verificador); attempt.finish(); if (window.location.href === returnUrl) netejaRetorn(); });
}

/* La pàgina torna on estava: fora els PARAMETRES_DE_TORNADA (la resta de la
   consulta, literal) i el fragment si porta codi, error o tokens. */
function netejaRetorn() {
  const u = new URL(window.location.href);

  if (u.hash.includes('code=') || u.hash.includes('sdp_code=') || u.hash.includes('error=') || u.hash.includes('access_token=') || u.hash.includes('refresh_token=')) {
    u.hash = '';
  }

  window.history.replaceState(null, '', u.pathname + senseParametresDeTornada(u.search) + u.hash);
}

/** Utilitat per a proves. */
export const _intern = { CLAU_VERIFICADOR, CLAU_TRASPAS, PARAMETRES_DE_TORNADA, LONGITUD_MAXIMA_TORNADA, base64url, redirigeix };
