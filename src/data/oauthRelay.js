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
 *   F1v2 (Onada 4, 261003): l'entrada amb Google hi afig la MARCA DE L'INTENT,
 *   `sdp_oauth_attempt=<id>` (urlDeTornadaOAuth), i l'alta per correu
 *   (supabase/auth.js) la seua, `sdp_auth=alta` (urlDeTornadaAlta), perquè
 *   l'enllaç de confirmació no caiga a la Site URL del projecte i, de tornada,
 *   es reconega com a nostre. F1-seguiments: la recuperació de contrasenya
 *   també, `sdp_auth=recuperacio` (urlDeTornadaRecuperacio i
 *   recullMarcaDeRecuperacio): un enllaç caducat torna amb l'error de GoTrue.
 *
 * DE QUI ÉS LA TORNADA (W4-02 i W4-03, auditoria de Codex 261003_1950):
 *   La pàgina és de l'amfitrió, i la seua consulta també. Un WordPress amb
 *   `?page_id=12&code=HOST-COUPON&state=HOST-STATE` o `?error=HOST-CHECKOUT-
 *   FAILED` no ha passat mai per GoTrue. Ni `code`, ni `error`, ni `state`, ni
 *   un `opener`, ni una mare que espera en una altra pestanya no proven que la
 *   tornada siga nostra. La prova és la marca: un id aleatori de 128 bits
 *   (FORMA_INTENT) que només coneixen la pestanya que ha començat l'entrada i el
 *   registre d'espera d'eixe id. Sense una marca ben formada, gestionaTornada no
 *   fa RES: ni historial, ni emmagatzematge, ni finestres, ni errors. Amb la
 *   marca, només lleva els PARAMETRES_DE_TORNADA i conserva history.state.
 *
 * QUI VALIDA LA TORNADA:
 *   · GoTrue, al servidor: el `redirect_to` ha de casar amb les Redirect URLs
 *     del projecte de Supabase. GoTrue compara la URL sencera sense fragment,
 *     consulta inclosa (Codex, request.go): cal un patró LIMITAT per amfitrió i
 *     per camí de l'app que admeta la consulta de la marca, mai un `**` sobre
 *     tot el lloc. Patrons i verificació: 02_investigacio_ia/
 *     261003_1330_onada4_claude/REDIRECT_URLS_GOTRUE.txt [NO VERIFICAT contra
 *     la configuració real]. És el control de veres, i és configuració, no
 *     codi. Si l'amfitrió no hi és, GoTrue cau en silenci a la Site URL.
 *   · El client, abans d'eixir (esTornadaValida): URL absoluta http(s), del
 *     mateix origen que la pàgina, sense fragment ni credencials i de
 *     LONGITUD_MAXIMA_TORNADA caràcters com a molt, marca inclosa. Cap
 *     redirector obert.
 *   · De tornada, el codi només viatja cap a l'origen de la pàgina, que és el
 *     que GoTrue ha acceptat, i només el consumix la mare del mateix id: la
 *     mare escolta eixe origen i el seu id, i l'emergent només li parla a eixe
 *     origen. Cap paràmetre de la URL tria el destinatari del codi.
 *
 * LA INSTANTÀNIA DE LA PÀGINA (W4-02, quarta passada de l'Onada 4, 261003):
 *   La tornada no pot portar els `code`, `state` o `error` de l'amfitrió:
 *   GoTrue hi posa el seu `code` i xocarien. Per això el callback els lleva
 *   (tornadaAmb), i un WordPress amb `?page_id=12&code=HOST-COUPON` tornava
 *   d'una redirecció completa sense el seu cupó (reproducció de Codex,
 *   261003_1950). Ara, en prémer el botó i al mateix moment que la tornada, la
 *   pestanya pren una INSTANTÀNIA (capturaInstantania): la URL literal (camí,
 *   consulta i fragment, sense reserialitzar) i el history.state si és JSON pla
 *   (esJsonPla); si no ho és, o si passa de LONGITUD_MAXIMA_INSTANTANIA, l'estat
 *   és null i una nota ho diu. Només en el camí 3, i abans d'eixir, es desa a
 *   la capa efímera amb una clau per id (PREFIX_INSTANTANIA). Cap secret: ni
 *   verificador, ni codi nostre, ni token. Revisió adversarial: una pàgina que
 *   ja és una tornada nostra (una marca a la consulta) no es guarda, i un
 *   fragment amb tokens es queda fora de la instantània (MARQUES_PROPIES,
 *   FRAGMENT_AMB_SECRET).
 *   De tornada, NOMÉS quan la tornada és nostra (la marca i el verificador
 *   d'eixe id en esta pestanya), es pren la instantània d'eixe id i cap altra.
 *   Tant si el bescanvi va bé com si el proveïdor torna un error (la persona
 *   cancel·la a Google) o el bescanvi falla, history.replaceState hi torna la
 *   pàgina (restauraInstantania): mateix origen, mai una navegació, mai un
 *   redirector. Sense instantània vàlida (absent, d'un altre id, caducada en
 *   VIGENCIA_INSTANTANIA_MS o manipulada), com abans: fora els nostres
 *   paràmetres. Un intent nou oblida la de l'anterior. La ruta interna d'un
 *   router en memòria no s'hi guarda: amb èxit, l'app va a la pròpia
 *   identitat; amb un error, ho decidix App.jsx [pendent, fora d'este fitxer].
 *   EL REINTENT (sisena passada, 261004; Codex 261003_1950, «el segon intent
 *   perd la instantània»): amb el bescanvi d'un intent A encara en curs, la
 *   barra és el callback d'A (la seua marca i el seu code) i la persona torna a
 *   prémer Google. Eixa pàgina no es guarda, i l'intent B se n'anava sense
 *   instantània: tornava sense el cupó ni el history.state de WordPress. Ara
 *   la instantània d'A, ja validada, queda lligada al seu bescanvi mentre dura
 *   (lligaInstantania) i B l'hereta en prémer el botó (heretaInstantania):
 *   síncron, abans de beginAuthAttempt i de window.open, sense cap await. Només
 *   si el bescanvi d'A és encara l'intent actiu, la barra és encara exactament
 *   el seu callback (cap navegació aliena) i la instantània no ha caducat; amb
 *   la seua hora, que no es renova. Viu a la memòria d'esta pestanya: mai d'una
 *   altra ni de l'emmagatzematge. El callback d'A no es guarda mai. El final
 *   d'A continua tornant la pàgina de WordPress mentre B se'n va.
 *
 * B · ENTRADA EN UN MARC D'UN ALTRE ORIGEN (directriu de MarIA 261003_2221):
 *   Dins d'un iframe d'un altre lloc amb COOP no arriba cap camí de tornada (el
 *   LÍMIT CONEGUT). En compte de començar una entrada que no pot acabar, es
 *   rebutja ABANS: cap configuració, cap intent, cap emergent, cap PKCE, cap id
 *   ni cap registre (exigeixSenseMarcAlie, la primera línia d'entraAmbGoogle).
 *   /registre ho sap abans del clic (googleEnMarcAlie) i pinta un avís honest
 *   amb un enllaç a una pestanya nova, a l'entrada real de l'app
 *   (urlPerAObrirFora). L'enllaç no autentica el marc d'origen: la partició del
 *   navegador continua.
 *   POLÍTICA CONSERVADORA: el detector (esMarcDAltreOrigen) veu si el document
 *   de dalt, o qualsevol marc pare pel camí (revisió adversarial: A → B → A),
 *   és d'un altre ORIGEN (llegir el seu location.href llança), no si és
 *   d'un altre LLOC ni quina partició d'emmagatzematge té. Es rebutja Google en
 *   qualsevol marc d'origen diferent, també en els subdominis del mateix lloc,
 *   on potser sí que funcionaria, i en un sandbox sense allow-same-origin. El
 *   marc del mateix origen i el component directe de WordPress (cap marc: top
 *   és la mateixa finestra) fan el camí de sempre. L'opció A, el pare que
 *   autentica a dalt i injecta la sessió pel pont d'iframe, és un contracte
 *   futur amb Sollutia: 261003_1330_onada4_claude/CONTRACTE_SDP_AUTH_REQUEST.txt.
 *
 * PER QUÈ PKCE I NO IMPLICIT:
 *   Amb el flux implícit torna un `access_token` al fragment de la URL, que
 *   acaba a l'historial del navegador. Amb PKCE torna un codi d'un sol ús
 *   que no val res sense el verificador, i el verificador no ix mai de la
 *   pestanya que va començar el flux. L'id de l'intent no és cap secret: el
 *   verificador continua sent l'única prova per al bescanvi.
 *
 * TRES CAMINS DE TORNADA, per ordre:
 *   1. Emergent + `window.opener.postMessage` — el camí net. L'emergent torna a
 *      la mateixa pàgina, hi arrenca l'SPA i gestionaTornada li passa el codi
 *      a la mare: { type, id, code | error }.
 *      F1-seguiments · La mare en un IFRAME D'UN ALTRE LLOC (host.js): el seu
 *      localStorage és particionat pel lloc de dalt, i l'emergent, que torna
 *      com a finestra de dalt, no hi veu el registre del seu id. Però l'opener
 *      hi és: amb la marca, sense verificador d'este id a la pestanya i sense
 *      cap registre seu a la vista, un opener viu vol dir emergent. La propietat
 *      la dona la marca; el registre només distingix l'emergent d'una
 *      redirecció que ha perdut el verificador.
 *   2. Emergent + esdeveniment `storage` — quan COOP talla l'`opener`. Passa de
 *      veres; no és teòric. Prova de Codex amb Chrome 154 i capçaleres COOP
 *      reals (auditoria 261003_1950, W4-03): de tornada, l'emergent té
 *      `window.name === ""` i `window.opener === null`, i no té el verificador.
 *      Ni el nom ni l'opener no el poden delatar. El delata el registre
 *      d'espera del seu id (CAMI.EMERGENT, a localStorage perquè és una altra
 *      pestanya, sense cap secret), i deixa el resultat a la clau de traspàs
 *      del mateix id, que només llig la mare d'eixe id.
 *   3. Redirecció completa — iPads amb emergents bloquejats. El verificador i
 *      l'id viuen a la capa efímera de la mateixa pestanya (CAMI.REDIRECCIO),
 *      i també la INSTANTÀNIA de la pàgina (W4-02, vegeu més avall): de
 *      tornada, la pàgina torna a ser exactament la d'abans o, sense
 *      instantània, la URL es neteja després del bescanvi.
 *      P6 (PWA, 261003): també, i directament, quan l'app corre instal·lada
 *      (esAppInstallada). A la pantalla d'inici d'iOS, window.open obri un
 *      full de Safari a banda, sense opener ni el mateix emmagatzematge: ni el
 *      camí 1 ni el 2 hi arriben i l'entrada es penjaria fins a TEMPS_MAXIM_MS.
 *      Si el registre de l'emergent no es pot escriure, tampoc no s'obri cap
 *      emergent: sense registre, la tornada no seria reconeixible.
 *   La finestra amfitriona no navega mai fora en els casos 1 i 2.
 *   LÍMIT CONEGUT · iframe d'un altre lloc I COOP alhora: l'emergent no té
 *   opener ni veu el registre, i el traspàs que escriu cau en un altre
 *   emmagatzematge. Cap camí no arriba a la mare: l'emergent dona l'error
 *   amable (VERIFICADOR_PERDUT) i la mare espera fins a la cancel·lació o
 *   TEMPS_MAXIM_MS [NO VERIFICAT en navegador real]. Des de B (quarta passada)
 *   l'entrada ja no hi arriba: en un marc d'un altre origen, Google es
 *   rebutja abans de començar (vegeu B, més avall).
 *   Si l'emergent no pot passar el resultat per cap camí (sense opener i sense
 *   poder escriure el traspàs), no es tanca: dona l'error amable (RELE_FALLIT).
 *
 * L'ESCOMBRADA (F1-seguiments): un registre d'espera es queda si la mare es
 *   tanca a mitja entrada, i un traspàs si l'emergent torna quan la mare ja no
 *   hi és. En començar un intent i en processar la marca d'un intent,
 *   s'esborren els de fa més de TEMPS_MAXIM_MS. Mai un de fresc: pot ser d'una
 *   altra pestanya que encara espera. Vegeu escombraIntentsVells.
 *
 * L'EMERGENT NO ES VIGILA (F1, auditoria de Codex 261003_1903):
 *   Amb COOP, el WindowProxy que guarda la mare diu `closed === true` mentre la
 *   persona encara s'autentica: el context que mira ja no és el de l'emergent
 *   (MDN, Window.open). No és cap prova de cancel·lació. Fins al 261003 un
 *   vigilant de 700 ms ho prenia per una: rebutjava al primer tic, llevava els
 *   escoltadors i esborrava el verificador, i el camí 2 ja no podia acabar.
 *   `closed` ja no es llig. L'intent només acaba per:
 *     a) una cancel·lació explícita: l'intent s'avorta (cancelAuthAttempts, el
 *        botó «Cancel·la l'entrada» de /registre, o un intent d'entrada nou);
 *     b) un codi o un error del seu id que arriba pel camí 1 o pel 2;
 *     c) TEMPS_MAXIM_MS.
 *   A cada final, la mare esborra el verificador, el registre i el traspàs del
 *   seu id. Un codi que arriba després ja no troba cap escoltador ni cap
 *   registre i no es bescanvia. Per la mateixa raó, tancaPopup no pot tancar
 *   un emergent tallat [NO VERIFICAT]: la persona el tanca.
 *
 * BESCANVI VERIFICAT (260925) contra @supabase/auth-js 2.112.4,
 *   `_exchangeCodeForSession`: POST /token?grant_type=pkce amb `auth_code` i
 *   `code_verifier`. Són `EXCHANGE_GRANT` i `EXCHANGE_FIELD`, aïllats a propòsit.
 *
 * SENSE `state` PROPI (auditoria 260925_1316, D2.1):
 *   el client oficial no n'envia cap a /authorize (`_getUrlForProvider`) i GoTrue
 *   no torna el del client: el seu `state` és intern, entre GoTrue i Google.
 *   Exigir-lo de tornada tancava la porta a tota entrada amb Google. Per això la
 *   marca de l'intent viatja dins de `redirect_to`, que GoTrue conserva, i no a
 *   `state`. La defensa contra el codi injectat (CSRF d'entrada) és PKCE: un
 *   codi només es bescanvia amb el verificador de la pestanya que va obrir el
 *   flux, i s'esborra en usar-lo. Es mantenen la validació d'origen, de font i
 *   d'id del missatge.
 */

import { getVal, setVal, delVal, getEfimer, setEfimer, delEfimer, STORAGE_PREFIX } from '../config/storage.js';
import { beginAuthAttempt } from './authAttempt.js';
import { backendScope } from '../config/backendConfig.js';
import { desaSessio } from './identitat.js';

/* ───────────────────────── Configuració ───────────────────────── */

/* Capa efímera de la pestanya que comença l'entrada: el verificador i, al
   costat, l'id del seu intent. Cap dels dos ix mai d'esta pestanya. */
const CLAU_VERIFICADOR = 'sdp:oauth:verificador';
const CLAU_INTENT = 'sdp:oauth:intent';
/* localStorage, perquè l'emergent és una altra pestanya. Una clau per id i cap
   secret: el registre d'espera { t, cami } i el traspàs { type, id, code |
   error, t }. Un codi sense el verificador de la mare no val res. */
const PREFIX_ESPERA = 'sdp:oauth:espera:';
const PREFIX_TRASPAS = 'sdp:oauth:traspas:';
const clauEspera = (intent) => PREFIX_ESPERA + intent;
const clauTraspas = (intent) => PREFIX_TRASPAS + intent;
/* Per on ha d'arribar el codi de cada intent (vegeu TRES CAMINS). */
const CAMI = Object.freeze({ EMERGENT: 'emergent', REDIRECCIO: 'redireccio' });
const TIPUS_MISSATGE = 'sdp:oauth';
const EXCHANGE_GRANT = 'pkce';
const EXCHANGE_FIELD = 'auth_code';
const TEMPS_MAXIM_MS = 180000;
/* Un traspàs més vell que açò no s'accepta: no és la tornada d'ara. */
const VIGENCIA_TRASPAS_MS = 120000;

/* ───────────────────────── Les marques ───────────────────────── */

/* La marca de l'entrada amb Google: 16 octets aleatoris (128 bits) en
   base64url, sense farciment. GoTrue no la recodifica (són caràcters no
   reservats). Qualsevol altra forma no és nostra. */
const PARAM_INTENT = 'sdp_oauth_attempt';
const FORMA_INTENT = /^[A-Za-z0-9_-]{22}$/;
/* Les marques dels enllaços per correu, `sdp_auth=<valor>`. L'alta: l'enllaç
   de confirmació torna amb tokens del flux implícit al fragment, i només amb
   ella sabem que són nostres. F1-seguiments · La recuperació de contrasenya: amb
   la plantilla per defecte de GoTrue, un enllaç caducat torna amb l'error al
   fragment, i només amb ella sabem que l'error és nostre. */
const PARAM_AUTH = 'sdp_auth';
const VALOR_ALTA = 'alta';
const VALOR_RECUPERACIO = 'recuperacio';

const esIntentValid = (intent) => typeof intent === 'string' && FORMA_INTENT.test(intent);

/* ───────────────────────── La tornada ───────────────────────── */

/* Paràmetres que l'entrada deixa a la URL de la pàgina i que no en formen part:
   els de GoTrue (code; error, error_code i error_description si falla), els del
   relé retirat (sdp_code, sdp_oauth_error), el state llegat i les dues marques
   (F1v2). Mai no viatgen dins de la tornada i, quan la tornada és nostra, es
   lleven en tornar. */
const PARAMETRES_DE_TORNADA = Object.freeze([
  'code', 'state', 'error', 'error_code', 'error_description', 'sdp_code', 'sdp_oauth_error', PARAM_INTENT, PARAM_AUTH
]);
/* F1-seguiments · De la tornada de la recuperació només es lleven la marca i
   els paràmetres d'error de GoTrue: cap altre no és d'este flux. */
const PARAMETRES_DE_RECUPERACIO = Object.freeze(['error', 'error_code', 'error_description', PARAM_AUTH]);

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

/* La consulta sense els `parametres` (els PARAMETRES_DE_TORNADA si no se'n
   donen). La resta va literal, sense reserialitzar: «?buit&a=b%20c» no es
   convertix en «?buit=&a=b+c». En la tornada, la consulta ja ve reescrita per
   GoTrue, i també es deixa tal qual. */
function senseParametresDeTornada(cerca, parametres = PARAMETRES_DE_TORNADA) {
  if (!cerca || cerca === '?') return '';
  const parells = cerca.slice(1).split('&').filter((parell) => {
    const clau = parell.split('=')[0].replace(/\+/g, ' ');
    let nom = clau;
    try { nom = decodeURIComponent(clau); } catch { /* clau mal codificada: es compara tal qual */ }
    return !parametres.includes(nom);
  });
  return parells.length ? `?${parells.join('&')}` : '';
}

/* La tornada de la pàgina, amb `marca` (un «nom=valor» ja segur per a una
   consulta) al final si n'hi ha. Si passa del topall, cau al camí sense
   consulta i, després, a l'arrel del mateix origen; la marca va a tots tres. */
function tornadaAmb(pagina, marca) {
  let actual = null;
  try { actual = new URL(String(pagina?.href)); } catch { /* no és una URL */ }
  if (!actual || !esHttp(actual)) {
    throw new Error('L’entrada amb Google necessita una pàgina http o https on tornar.');
  }
  const ambMarca = (url) => (marca ? `${url}${url.includes('?') ? '&' : '?'}${marca}` : url);
  const candidates = [
    actual.origin + actual.pathname + senseParametresDeTornada(actual.search),
    actual.origin + actual.pathname,
    `${actual.origin}/`
  ].map(ambMarca);
  const tornada = candidates.find((url) => esTornadaValida(url, actual.origin));
  if (!tornada) throw new Error('L’entrada amb Google necessita una pàgina http o https on tornar.');
  return tornada;
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
  return tornadaAmb(pagina, '');
}

/**
 * F1v2 · La tornada de l'entrada amb Google: urlDeTornada amb la marca de
 * l'intent, `sdp_oauth_attempt=<intent>`, dins del topall i en tots els
 * recursos de longitud. Llança si l'intent no té FORMA_INTENT.
 * @param {string} intent
 * @param {{ href: string }} [pagina] window.location per defecte
 * @returns {string}
 */
export function urlDeTornadaOAuth(intent, pagina = window.location) {
  if (!esIntentValid(intent)) throw new Error('L’intent d’entrada no té una marca vàlida.');
  return tornadaAmb(pagina, `${PARAM_INTENT}=${intent}`);
}

/**
 * F1v2 · La tornada de l'alta per correu: urlDeTornada amb `sdp_auth=alta`, la
 * marca que fa reconeixible l'enllaç de confirmació quan torna.
 * @param {{ href: string }} [pagina] window.location per defecte
 * @returns {string}
 */
export function urlDeTornadaAlta(pagina = window.location) {
  return tornadaAmb(pagina, `${PARAM_AUTH}=${VALOR_ALTA}`);
}

/**
 * F1-seguiments · La tornada de la recuperació de contrasenya: urlDeTornada
 * amb `sdp_auth=recuperacio`, la marca que fa reconeixible l'error d'un enllaç
 * caducat quan torna (recullMarcaDeRecuperacio).
 * @param {{ href: string }} [pagina] window.location per defecte
 * @returns {string}
 */
export function urlDeTornadaRecuperacio(pagina = window.location) {
  return tornadaAmb(pagina, `${PARAM_AUTH}=${VALOR_RECUPERACIO}`);
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

/* F1v2 · L'id d'un intent: 128 bits del generador del navegador, en base64url.
   Síncron: es fa abans de window.open i Safari no perd el gest. */
function nouIntent() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

/* ───────────────────────── El registre d'espera ───────────────────────── */

/* F1-seguiments · L'índex de l'escombrada: { [id]: t }, els ids que tenen
   registre o traspàs en este emmagatzematge. Cap secret. Fa falta perquè
   storage.js no llista claus i el tractor de persistència (L2) no deixa llegir
   localStorage fora d'allí. Dues pestanyes que l'escriuen alhora poden perdre
   un id: els seus registres ja no s'escombren. Només és brossa, sense cap
   risc: sense el verificador de la mare, un codi no val res. */
const CLAU_INDEX = 'sdp:oauth:intents';

function llegixIndex() {
  const index = getVal(CLAU_INDEX, null);
  return index && typeof index === 'object' && !Array.isArray(index) ? index : {};
}
const desaIndex = (index) => (Object.keys(index).length ? setVal(CLAU_INDEX, index) : delVal(CLAU_INDEX));
const apuntaIntent = (intent) => { const index = llegixIndex(); index[intent] = Date.now(); return desaIndex(index); };

/* El registre d'espera d'un id i, si s'ha desat, l'id a l'índex. */
function desaEspera(intent, cami) {
  const desat = setVal(clauEspera(intent), { t: Date.now(), cami });
  if (desat) apuntaIntent(intent);
  return desat;
}

/* El registre d'un id si és d'un camí conegut i de fa TEMPS_MAXIM_MS com a
   molt; si no, null. Només llig. */
function esperaVigent(intent) {
  const espera = getVal(clauEspera(intent), null);
  if (!espera || typeof espera !== 'object' || !Object.values(CAMI).includes(espera.cami)) return null;
  const edat = Date.now() - Number(espera.t);
  return edat >= 0 && edat <= TEMPS_MAXIM_MS ? espera : null;
}

/* Fora el registre, el traspàs i l'entrada a l'índex d'un id. Cada mare només
   esborra els seus. */
function oblidaIntent(intent) {
  delVal(clauEspera(intent));
  delVal(clauTraspas(intent));
  const index = llegixIndex();
  if (Object.hasOwn(index, intent)) { delete index[intent]; desaIndex(index); }
}

/* Vell: sense hora, o a més de TEMPS_MAXIM_MS d'ara, cap avant o cap arrere
   (un rellotge canviat). */
const esVell = (t) => !(Math.abs(Date.now() - Number(t)) <= TEMPS_MAXIM_MS);

/* F1-seguiments · L'escombrada. Per a cada id de l'índex, fora el registre i
   el traspàs vells; un id sense cap entrada fresca i apuntat fa temps ix de
   l'índex. Mai una entrada fresca: pot ser d'una altra pestanya que encara
   espera. Un id de l'índex sense FORMA_INTENT no és nostre: ix de l'índex i
   les seues claus no es toquen. */
function escombraIntentsVells() {
  const index = llegixIndex();
  let canvi = false;
  for (const [id, t] of Object.entries(index)) {
    let fresc = false;
    if (esIntentValid(id)) {
      for (const clau of [clauEspera(id), clauTraspas(id)]) {
        const valor = getVal(clau, null);
        if (valor === null) continue;
        if (esVell(valor?.t)) delVal(clau); else fresc = true;
      }
    }
    if (!fresc && (!esIntentValid(id) || esVell(t))) { delete index[id]; canvi = true; }
  }
  if (canvi) desaIndex(index);
}

/* ───────────────────────── La instantània (W4-02) ───────────────────────── */

/* Capa efímera de la pestanya que se'n va pel camí 3: una clau per id. */
const PREFIX_INSTANTANIA = 'sdp:oauth:instantania:';
const clauInstantania = (intent) => PREFIX_INSTANTANIA + intent;
const VERSIO_INSTANTANIA = 1;
/* Topall de la URL i del history.state serialitzat, cadascun: la capa efímera
   és per a coses xicotetes (storage.js). Una URL més llarga no es guarda; un
   estat més gran, tampoc (nota). */
const LONGITUD_MAXIMA_INSTANTANIA = 8192;
/* Una tornada més tardana no restaura res: més que una entrada lenta amb
   Google (doble factor inclòs), molt menys que una sessió de navegació. */
const VIGENCIA_INSTANTANIA_MS = 600000;
const NOTA_ESTAT = Object.freeze({ NO_SERIALITZABLE: 'no-serialitzable', MASSA_GRAN: 'massa-gran' });
const PROFUNDITAT_MAXIMA_ESTAT = 32;

/* Cert si `valor` torna idèntic d'un JSON.stringify i un JSON.parse: null,
   text, booleans, nombres finits (no -0), llistes denses i objectes plans. Un
   Map, una Date, un Blob o una classe del router de l'amfitrió, no. */
function esJsonPla(valor, profunditat = 0) {
  if (profunditat > PROFUNDITAT_MAXIMA_ESTAT) return false;
  if (valor === null || typeof valor === 'string' || typeof valor === 'boolean') return true;
  if (typeof valor === 'number') return Number.isFinite(valor) && !Object.is(valor, -0);
  if (typeof valor !== 'object') return false;
  if (Array.isArray(valor)) {
    return Object.keys(valor).length === valor.length
      && Array.from(valor).every((fill) => esJsonPla(fill, profunditat + 1));
  }
  const proto = Object.getPrototypeOf(valor);
  if (proto !== Object.prototype && proto !== null) return false;
  return Object.getOwnPropertySymbols(valor).length === 0
    && Object.values(valor).every((fill) => esJsonPla(fill, profunditat + 1));
}

/* Revisió adversarial de la quarta passada (261003) · «Cap secret».
   Una consulta amb una marca nostra (o un paràmetre del relé retirat) és una
   tornada NOSTRA, no la pàgina de l'amfitrió: el seu code, state o error són de
   GoTrue. Passa quan es torna a prémer Google amb el bescanvi encara en curs.
   Restaurada, deixaria una marca sense verificador a la barra i la recàrrega
   següent donaria VERIFICADOR_PERDUT. Eixa pàgina no es guarda. */
const MARQUES_PROPIES = Object.freeze([PARAM_INTENT, PARAM_AUTH, 'sdp_code', 'sdp_oauth_error']);
const portaMarcaPropia = (pagina) => MARQUES_PROPIES.some((nom) => pagina.searchParams.has(nom));
/* Un fragment amb tokens (l'alta que GoTrue fa caure a la Site URL sense la
   marca, o l'entrada implícita de l'amfitrió) tampoc entra a la capa efímera:
   la instantània es queda sense eixe fragment, i la consulta, literal. El
   criteri és el de netejaRetorn: el nom del token en qualsevol lloc del
   fragment (també el token_hash de la recuperació). */
const FRAGMENT_AMB_SECRET = /(?:access_token|refresh_token|token_hash)=/;
const senseFragmentSecret = (url) => {
  const lloc = url.indexOf('#');
  return lloc >= 0 && FRAGMENT_AMB_SECRET.test(url.slice(lloc)) ? url.slice(0, lloc) : url;
};

/* La pàgina tal com és ara, o null si no se'n pot guardar cap (no és http(s),
   la URL passa del topall o és una tornada nostra). Síncrona i sense cap
   escriptura: es pren en prémer el botó, al mateix moment que la tornada.
   L'estat es copia ara: el router de l'amfitrió no el pot canviar pel camí. */
function capturaInstantania() {
  let url;
  try { url = senseFragmentSecret(String(window.location.href)); } catch { return null; }
  if (url.length > LONGITUD_MAXIMA_INSTANTANIA) return null;
  let pagina = null;
  try { pagina = new URL(url); } catch { /* no és una URL */ }
  if (!pagina || !esHttp(pagina) || portaMarcaPropia(pagina)) return null;
  let estat = null;
  let nota = null;
  try {
    const actual = window.history.state ?? null;
    const text = esJsonPla(actual) ? JSON.stringify(actual) : null;
    if (text === null) nota = NOTA_ESTAT.NO_SERIALITZABLE;
    else if (text.length > LONGITUD_MAXIMA_INSTANTANIA) nota = NOTA_ESTAT.MASSA_GRAN;
    else estat = JSON.parse(text);
  } catch { nota = NOTA_ESTAT.NO_SERIALITZABLE; }
  return { v: VERSIO_INSTANTANIA, url, estat, nota };
}

/* Desa la instantània d'un id amb la seua hora: la d'ara si és nova, la que
   ja porta si és heretada (heretaInstantania), perquè un reintent no la
   rejoveneix. Si no es pot (quota), res: la tornada farà el de sempre. */
function desaInstantania(intent, instantania) {
  if (!instantania) return;
  const t = typeof instantania.t === 'number' ? instantania.t : Date.now();
  setEfimer(clauInstantania(intent), { ...instantania, t });
}

/* Una instantània desada és vàlida si té la forma d'esta versió, és del mateix
   origen que la pàgina d'ara, sense credencials, i no ha caducat (cap avant ni
   cap arrere: un rellotge canviat). */
function esInstantaniaValida(desada, origen) {
  if (!desada || typeof desada !== 'object' || desada.v !== VERSIO_INSTANTANIA) return false;
  if (typeof desada.url !== 'string' || desada.url.length > LONGITUD_MAXIMA_INSTANTANIA) return false;
  if (typeof desada.t !== 'number' || !(Math.abs(Date.now() - desada.t) <= VIGENCIA_INSTANTANIA_MS)) return false;
  let pagina = null;
  try { pagina = new URL(desada.url); } catch { return false; }
  if (!esHttp(pagina) || pagina.username || pagina.password || pagina.origin !== origen) return false;
  // Revisió · Ni una tornada nostra ni un fragment amb tokens: no l'ha desada capturaInstantania.
  if (portaMarcaPropia(pagina) || senseFragmentSecret(desada.url) !== desada.url) return false;
  if (desada.nota === null) return esJsonPla(desada.estat);
  return Object.values(NOTA_ESTAT).includes(desada.nota) && desada.estat === null;
}

/* La instantània d'este id, i només d'este: es llig i s'esborra alhora. null
   si no n'hi ha o si no és vàlida. Només per a una tornada ja reconeguda com a
   nostra (la marca i el verificador d'eixe id). */
function presInstantania(intent) {
  const clau = clauInstantania(intent);
  const desada = getEfimer(clau, null);
  if (desada === null) return null;
  delEfimer(clau);
  return esInstantaniaValida(desada, window.location.origin) ? desada : null;
}

/* La pàgina torna a ser la de la instantània: replaceState, mai una navegació
   ni un altre origen. Amb nota, l'estat d'ara, com netejaRetorn. Torna si
   l'ha restaurada. */
function restauraInstantania(instantania) {
  if (!instantania) return false;
  try {
    if (new URL(instantania.url).origin !== window.location.origin) return false;
    const estat = instantania.nota === null ? instantania.estat : window.history.state;
    window.history.replaceState(estat, '', instantania.url);
    return true;
  } catch { return false; }
}

/* El final d'una tornada nostra: la instantània o, sense, la neteja de sempre. */
function tancaTornada(instantania) {
  if (!restauraInstantania(instantania)) netejaRetorn();
}

/* Sisena passada (261004) · EL REINTENT (vegeu la capçalera). La instantània
   del bescanvi en curs d'esta pestanya, lligada al seu intent: { intent,
   attempt, tornada, instantania }. Memòria del mòdul, mai l'emmagatzematge:
   cap altra pestanya no hi arriba. */
let instantaniaEnCurs = null;

/* La lliga mentre dura el bescanvi; torna el lligam per a deslligar-lo. */
function lligaInstantania(intent, attempt, tornada, instantania) {
  if (!instantania) return null;
  instantaniaEnCurs = { intent, attempt, tornada, instantania };
  return instantaniaEnCurs;
}

/* Fora el lligam, si encara és este: un bescanvi posterior ja té el seu. */
function deslligaInstantania(lligam) {
  if (lligam && instantaniaEnCurs === lligam) instantaniaEnCurs = null;
}

/* La instantània que hereta un intent nou quan substituïx el bescanvi en curs,
   o null. Síncrona i sense cap escriptura: es crida en prémer el botó, abans
   de beginAuthAttempt (que avorta el bescanvi) i de window.open. Només si el
   bescanvi és encara l'intent actiu, la barra és encara exactament el seu
   callback (cap navegació aliena pel camí) i la instantània és vàlida ara (no
   ha caducat). Una còpia amb la seua hora: no es renova. */
function heretaInstantania() {
  const lligam = instantaniaEnCurs;
  if (!lligam) return null;
  try { lligam.attempt.assertCurrent(); } catch { return null; }
  try { if (String(window.location.href) !== lligam.tornada) return null; } catch { return null; }
  if (!esInstantaniaValida(lligam.instantania, window.location.origin)) return null;
  return { ...lligam.instantania };
}

/* ───────────────────────── B · Marc d'un altre origen ───────────────────────── */

/** B · El codi de l'error d'una entrada amb Google rebutjada dins d'un marc. */
export const CODI_ENTRADA_EN_MARC = 'ENTRADA_EN_MARC';
/** B · L'avís: la frase clau primer. */
export const AVIS_ENTRADA_EN_MARC = 'Dins d’este marc no es pot entrar amb Google. Obri Sóc de Poble en una pestanya nova per a entrar.';
/* Marcs niuats que el detector recorre com a molt: cap pàgina real no hi arriba. */
const PROFUNDITAT_MAXIMA_MARCS = 32;

/**
 * B · Cert si `finestra` és un marc i el document de dalt, o un marc pare pel
 * camí, és d'un altre ORIGEN: top no és ella mateixa i llegir el location.href
 * d'algun d'ells llança (o no dona cap text, en un navegador que no llançara).
 * No distingix lloc ni partició: és la POLÍTICA CONSERVADORA de la capçalera. Un sandbox sense
 * allow-same-origin (origen opac) també hi cau. Sense finestra (fora del
 * navegador) o amb top null (un marc desenganxat), cap marc.
 * @param {Window|null} [finestra] window per defecte
 * @returns {boolean}
 */
export function esMarcDAltreOrigen(finestra = globalThis.window) {
  if (!finestra) return false;
  let dalt;
  try { dalt = finestra.top; } catch { return true; }
  if (!dalt || dalt === finestra || dalt === finestra.self) return false;
  /* Revisió adversarial (261003, nit) · Cada pare fins a dalt, no només el de
     dalt: un marc de l'app dins d'un marc d'un altre origen, amb l'app a dalt
     (A → B → A), també té l'emmagatzematge particionat. `parent` es pot llegir
     entre orígens; el seu location.href, no. Sense `parent` (una finestra que no
     el dona), decidix el de dalt. Més pares que PROFUNDITAT_MAXIMA_MARCS: no es
     pot comprovar, i la política falla tancada. */
  let marc = finestra;
  for (let pas = 0; ; pas += 1) {
    if (pas >= PROFUNDITAT_MAXIMA_MARCS) return true;
    let pare;
    try { pare = marc.parent; } catch { return true; }
    if (!pare || pare === marc || pare === dalt) break;
    try { if (typeof pare.location.href !== 'string') return true; } catch { return true; }
    marc = pare;
  }
  try { return typeof dalt.location.href !== 'string'; } catch { return true; }
}

/**
 * B · La política en esta finestra: cert si l'entrada amb Google s'hi rebutja.
 * Passa per _intern perquè les proves hi puguen posar un marc: window.top és
 * [LegacyUnforgeable] i jsdom no el deixa falsejar.
 * @returns {boolean}
 */
export function googleEnMarcAlie() {
  return typeof window !== 'undefined' && _intern.esMarcDAltreOrigen(window) === true;
}

/**
 * B · Llança l'error tipat (code CODI_ENTRADA_EN_MARC, missatge
 * AVIS_ENTRADA_EN_MARC) si l'entrada amb Google s'ha de rebutjar en esta
 * finestra. No escriu res.
 */
export function exigeixSenseMarcAlie() {
  if (googleEnMarcAlie()) throw Object.assign(new Error(AVIS_ENTRADA_EN_MARC), { code: CODI_ENTRADA_EN_MARC });
}

/**
 * B · L'adreça per a obrir l'app fora del marc: l'entrada real, al seu origen
 * (la pàgina del marc és de l'app), sense fragment ni PARAMETRES_DE_TORNADA:
 * cap codi OAuth, cap marca, cap token. null si no hi ha pàgina http(s).
 * @param {{ href: string }} [pagina] window.location per defecte
 * @returns {string|null}
 */
export function urlPerAObrirFora(pagina = globalThis.window?.location) {
  try { return urlDeTornada(pagina); } catch { return null; }
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
  delEfimer(CLAU_INTENT);
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

/* Camí 3 · el registre del seu id, la instantània de la pàgina (W4-02) i la
   pestanya sencera cap a l'autorització. */
function surtPerRedireccio(intent, url, instantania) {
  desaEspera(intent, CAMI.REDIRECCIO);
  desaInstantania(intent, instantania);
  _intern.redirigeix(url);
}

/**
 * Obri l'entrada amb Google. Resol amb la sessió; rebutja amb un error
 * llegible. La pàgina amfitriona no navega si l'emergent s'obri. B: en un
 * marc d'un altre origen rebutja amb CODI_ENTRADA_EN_MARC abans de res.
 */
export async function entraAmbGoogle(config = {}, resolConfig) {
  /* B (directriu de MarIA 261003_2221) · Dins d'un marc d'un altre origen,
     cap entrada: ni configuració, ni intent, ni emergent, ni PKCE, ni id, ni
     registre. La primera línia, abans de qualsevol escriptura. */
  exigeixSenseMarcAlie();
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = resolConfig(config);
  if (!hasSupabaseConfig) throw new Error('L\'entrada amb Google necessita connexió amb Supabase.');

  /* P1 (261003) · On torna la persona, abans d'obrir res: si la pàgina no té
     tornada possible, no s'obri cap finestra. F1v2: amb la marca d'este
     intent. Síncron, com tot fins a window.open: Safari no perd el gest.
     W4-02 · Al mateix moment, la instantània de la pàgina: només es desarà si
     la pestanya se'n va (camí 3). Sisena passada (261004) · Si la barra és el
     callback d'un bescanvi encara en curs, no se'n pot capturar cap: s'hereta
     la d'eixe bescanvi, ara, abans que beginAuthAttempt l'avorte. */
  const intent = nouIntent();
  const tornada = urlDeTornadaOAuth(intent);
  const instantania = capturaInstantania() ?? heretaInstantania();

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
  /* F1 · L'emergent naix amb una còpia de l'emmagatzematge de pestanya de la
     mare [NO VERIFICAT en cada navegador]: no ha d'heretar cap verificador ni
     cap id. Un intent anterior d'esta pestanya (un camí 3 que no va tornar)
     deixa ací el seu registre, que ja no espera res. L'intent nou ja ha avortat
     l'anterior. W4-02 · I la seua instantània: la tornada d'eixe id ja no és
     d'esta pestanya. */
  const anterior = getEfimer(CLAU_INTENT, null);
  if (esIntentValid(anterior)) {
    oblidaIntent(anterior);
    delEfimer(clauInstantania(anterior));
  }
  delEfimer(CLAU_VERIFICADOR);
  delEfimer(CLAU_INTENT);
  /* P6 · Instal·lada, cap emergent: emergent = null porta al camí 3. */
  let emergent = null;
  if (!esAppInstallada()) {
    try { emergent = window.open('', 'sdp-oauth', 'width=520,height=680'); }
    catch (error) { attempt.finish(); throw error; }
  }
  /* Revisió de F1v2 (261003) · Una pestanya que ja es diu 'sdp-oauth' (un
     emergent que no s'ha tancat) es rep a si mateixa: window.open(...) ===
     window, comprovat a Chromium. No és cap emergent: si ho fóra, el registre
     diria CAMI.EMERGENT, la tornada passaria el codi en compte de bescanviar-lo
     i tancaPopup tancaria esta pestanya. Camí 3. */
  if (emergent === window) emergent = null;
  /* F1-seguiments · Un intent nou escombra els registres i traspassos vells
     (vegeu escombraIntentsVells). Després de window.open: el gest ja és fet. */
  escombraIntentsVells();

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
      || !setEfimer(CLAU_INTENT, intent)
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

  /* F1v2 · El registre de l'emergent, ABANS que navegue. Si no es pot escriure
     (emmagatzematge ple o blocat), la tornada de l'emergent no seria
     reconeixible: fora l'emergent i camí 3, que només necessita la capa
     efímera d'esta pestanya. */
  if (emergent && !desaEspera(intent, CAMI.EMERGENT)) {
    tancaPopup();
    emergent = null;
  }

  // Camí 3: emergent bloquejat, l'app instal·lada (P6) o sense registre. Redirecció completa.
  if (!emergent) {
    surtPerRedireccio(intent, url, instantania);
    return new Promise(() => {}); // Penjarà a propòsit perquè ja naveguem.
  }

  try {
    emergent.location.href = url;
  } catch {
    // Fallback extrem si el navegador bloqueja mutar l'emergent: és un camí 3.
    surtPerRedireccio(intent, url, instantania);
    return new Promise(() => {});
  }

  return esperaCodi(emergent, new URL(tornada).origin, intent, attempt, tancaPopup)
    .then((codi) => bescanvia(codi, verificador, { ...config, supabaseUrl, supabaseAnonKey }, attempt))
    .catch((err) => {
      tancaPopup();
      throw err;
    })
    .finally(() => { netejaIntent(verificador); acabaIntent(); });
}

/* Un resultat de l'emergent és d'este intent si porta el tipus i el mateix id. */
const esCarregaDe = (d, intent) => Boolean(d) && typeof d === 'object' && d.type === TIPUS_MISSATGE && d.id === intent;

/**
 * Escolta les dues vies de tornada de l'emergent alhora, només per a `intent`.
 * `origenTornada` és el de la pàgina: l'únic des d'on l'emergent pot parlar.
 * F1: `emergent.closed` no es llig (vegeu la capçalera); acaben l'intent
 * l'avort, el codi o l'error del seu id que arriben, i el termini.
 */
function esperaCodi(emergent, origenTornada, intent, attempt, tancaPopup) {
  return new Promise((resol, rebutja) => {
    let acabat = false;
    const clau = clauTraspas(intent);

    const neteja = () => {
      attempt.signal.removeEventListener('abort', perAbort);
      window.removeEventListener('message', perMissatge);
      window.removeEventListener('storage', perStorage);
      clearTimeout(rellotge);
      oblidaIntent(intent);
    };
    const acaba = (fn, valor) => { if (acabat) return; acabat = true; neteja(); fn(valor); };

    function perAbort() {
      tancaPopup();
      acaba(rebutja, new DOMException('Entrada cancel·lada.', 'AbortError'));
    }

    // El resultat d'este intent, vinga pel camí que vinga. Un altre id s'ignora.
    function rep(d) {
      if (!esCarregaDe(d, intent)) return;
      if (typeof d.error === 'string' && d.error) return acaba(rebutja, new Error(d.error));
      if (typeof d.code === 'string' && d.code) acaba(resol, d.code);
    }

    // Camí 1 — l'emergent ha tornat a la pàgina, del mateix origen, i ens parla.
    function perMissatge(e) {
      if (e.origin !== origenTornada) return; // Validació estricta: l'origen de la tornada
      if (e.source !== emergent) return;
      rep(e.data);
    }

    // Camí 2 — COOP ha tallat l'`opener`. L'emergent deixa el resultat a la
    // clau de traspàs d'este id i açò el replega.
    function perStorage(e) {
      if (e.key !== STORAGE_PREFIX + clau || !e.newValue) return;
      let d = null;
      try { d = JSON.parse(e.newValue); } catch { return; /* valor malmés: s'ignora */ }
      if (!d?.t || Date.now() - d.t > VIGENCIA_TRASPAS_MS) return;
      rep(d);
    }

    // F1 · Cap vigilant d'emergent.closed: amb COOP diu true mentre la persona
    // encara entra. L'eixida de la persona és la cancel·lació explícita.
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

const VERIFICADOR_PERDUT = 'S\'ha perdut el verificador d\'esta entrada. Torna a començar des del botó d\'entrar.';
const CONFIRMACIO_FALLIDA = 'No s’ha pogut confirmar el correu: l’enllaç pot haver caducat o ja s’ha fet servir. Prova d’entrar amb el correu i la contrasenya.';
/* F1-seguiments · L'emergent no ha pogut passar el resultat per cap camí. */
const RELE_FALLIT = 'L’entrada no ha pogut tornar a la pàgina. Tanca esta finestra i torna a provar.';

/* La marca de l'intent, si la consulta en porta UNA i ben formada; si no, null. */
function intentDeLaTornada(consulta) {
  const valors = consulta.getAll(PARAM_INTENT);
  return valors.length === 1 && esIntentValid(valors[0]) ? valors[0] : null;
}

/* Cert si la consulta porta UNA marca `sdp_auth` i és `valor`. */
const portaMarcaAuth = (consulta, valor) => {
  const valors = consulta.getAll(PARAM_AUTH);
  return valors.length === 1 && valors[0] === valor;
};
const esTornadaDAlta = (consulta) => portaMarcaAuth(consulta, VALOR_ALTA);

/* L'opener, si n'hi ha, no és esta finestra i no s'ha tancat; si no, null.
   Amb COOP, l'opener és null. */
function mareViva() {
  try {
    const mare = window.opener;
    return mare && mare !== window && mare.closed !== true ? mare : null;
  } catch { return null; }
}

/**
 * Crida-la UNA vegada quan l'app es munte, abans de pintar res.
 *
 * W4-02 · Primer, de qui és la tornada. Sense la marca d'un intent ben formada
 * (ni la de l'alta), la pàgina és de l'amfitrió: torna null sense tocar res,
 * encara que porte `code`, `error`, `state` o tokens al fragment.
 *
 * Amb la marca d'un intent, es mira si hi ha registre d'eixe id i, després,
 * l'escombrada (escombraIntentsVells). Amb un codi o un error:
 *   a) El registre d'eixe id diu CAMI.EMERGENT → som l'emergent (la mare no
 *      navega mai en este camí): passem el resultat a la mare i ens tanquem.
 *   b) Esta pestanya té el verificador d'eixe id → camí 3: bescanviem. W4-02:
 *      amb èxit o amb error, la pàgina torna a la instantània d'eixe id, si
 *      n'hi ha una de vàlida; si no, es lleven els nostres paràmetres.
 *   a') F1-seguiments · Cap registre d'eixe id a la vista i un opener viu → som
 *      l'emergent d'una mare en un iframe d'un altre lloc: com en (a).
 *   c) Cap de les tres (registre caducat, d'un altre camí o absent sense
 *      opener) → fora les nostres marques i l'error amable de sempre.
 * Si l'emergent no pot passar el resultat per cap camí, no es tanca i dona
 * l'error amable (RELE_FALLIT).
 * Amb la marca de l'alta: vegeu tornadaDAlta. La de la recuperació la
 * processa supabase/auth.js (recullMarcaDeRecuperacio), abans.
 */
export async function gestionaTornada(config = {}, resolConfig) {
  if (typeof window === 'undefined') return null;
  const consulta = new URLSearchParams(window.location.search);
  const intent = intentDeLaTornada(consulta);
  if (intent) return tornadaDeGoogle(intent, consulta, config, resolConfig);
  if (esTornadaDAlta(consulta)) return tornadaDAlta(consulta);
  return null;
}

function tornadaDeGoogle(intent, consulta, config, resolConfig) {
  /* Revisió de F1-seguiments (261003) · El registre d'este id es mira ABANS de
     l'escombrada: un de caducat també diu que no som l'emergent d'un iframe
     (a'), i l'escombrada l'esborraria. */
  const registreALaVista = getVal(clauEspera(intent), null) !== null;
  escombraIntentsVells();
  /* GoTrue torna el codi PKCE a la consulta; els errors, a la consulta i al
     fragment (redirectErrors). */
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const codi = consulta.get('code');
  const error = consulta.get('error') || consulta.get('error_description')
    || fragment.get('error') || fragment.get('error_description');
  if (!codi && !error) {
    netejaRetorn();
    return null;
  }
  const resultat = error ? { error } : { code: codi };

  /* (a) L'emergent. No bescanviem ací: el verificador viu a la mare. Encara
     que un navegador haguera copiat el verificador a l'emergent, el registre
     mana: la mare no ha de quedar-se esperant fins al termini. P1 (261003) ·
     El codi només ix cap a l'origen de la pàgina, acceptada per GoTrue; cap
     paràmetre de la URL (un sdp_origin del relé retirat, o un d'injectat) tria
     el destinatari. */
  if (esperaVigent(intent)?.cami === CAMI.EMERGENT) return relleva(intent, resultat);

  /* (b) Camí 3. Fail-closed per PKCE: només el verificador lligat a este id. */
  const verificador = getEfimer(CLAU_INTENT, null) === intent ? getEfimer(CLAU_VERIFICADOR, null) : null;
  if (!verificador) {
    /* (a') F1-seguiments · La mare en un iframe d'un altre lloc: el seu
       registre és en un altre emmagatzematge i ací no se'n veu cap d'este id,
       però l'opener hi és. Un registre a la vista (caducat, o d'un camí 3 que
       ha perdut el verificador) diu que no som eixe emergent. */
    if (!registreALaVista && mareViva()) return relleva(intent, resultat);
    // (c) Ni emergent ni verificador d'este id: un enllaç vell o copiat.
    netejaRetorn();
    throw new Error(VERIFICADOR_PERDUT);
  }
  /* W4-02 · La tornada és nostra: la marca i el verificador d'este id. Ara, i
     no abans, la instantània d'este id. Amb èxit, amb l'error del proveïdor o
     amb un bescanvi que falla, la pàgina torna a ser la d'abans. */
  const instantania = presInstantania(intent);
  if (error) {
    tancaTornada(instantania);
    netejaIntent(verificador);
    oblidaIntent(intent);
    throw new Error(error);
  }
  const { supabaseUrl, supabaseAnonKey } = resolConfig(config);
  const attempt = beginAuthAttempt();
  const returnUrl = window.location.href;
  /* Sisena passada (261004) · Mentre dura el bescanvi, la instantània queda
     lligada a este intent i a este callback: si la persona torna a prémer
     Google, el nou la hereta (heretaInstantania). */
  const lligam = lligaInstantania(intent, attempt, returnUrl, instantania);
  return bescanvia(codi, verificador, { ...config, supabaseUrl, supabaseAnonKey }, attempt)
    .finally(() => {
      deslligaInstantania(lligam);
      netejaIntent(verificador);
      oblidaIntent(intent);
      attempt.finish();
      // Si l'app ja ha canviat d'adreça pel camí, no es trepitja.
      if (window.location.href === returnUrl) tancaTornada(instantania);
    });
}

/* (a) i (a') · Fora les nostres marques de la URL i el resultat a la mare. Si
   no ha eixit per cap camí, l'emergent es queda obert amb l'error amable. */
function relleva(intent, resultat) {
  netejaRetorn();
  if (!passaALaMare(intent, resultat)) throw new Error(RELE_FALLIT);
  return null;
}

/* Pels dos camins alhora: l'opener viu (camí 1, només a este origen) i la clau
   de traspàs del seu id (camí 2). La mare es queda amb el primer que li
   arriba. F1-seguiments (4): torna si n'ha eixit per algun i, només llavors,
   l'emergent es tanca. Sense opener i sense poder escriure el traspàs, torna
   false i no es tanca: la persona ha de vore l'error. */
function passaALaMare(intent, resultat) {
  const carrega = { type: TIPUS_MISSATGE, id: intent, ...resultat };
  let eixit = false;
  try {
    const mare = mareViva();
    if (mare) { mare.postMessage(carrega, window.location.origin); eixit = true; }
  } catch { /* COOP ens ha tallat l'`opener`: queda el traspàs */ }
  if (setVal(clauTraspas(intent), { ...carrega, t: Date.now() })) {
    eixit = true;
    /* L'emergent d'un iframe d'un altre lloc l'escriu en un altre
       emmagatzematge, on cap mare no l'esborrarà: a l'índex, per a
       l'escombrada. Si la mare ja l'hi ha apuntat, no s'hi torna a escriure. */
    if (!Object.hasOwn(llegixIndex(), intent)) apuntaIntent(intent);
  }
  if (!eixit) return false;
  setTimeout(() => { try { window.close(); } catch { /* ignora */ } }, 60);
  return true;
}

/* Ordre del Mestre (261002) · L'enllaç de confirmació de l'alta torna amb
   tokens del flux implícit al fragment (o amb un error): mai s'adopten, però
   tampoc es deixen a la barra d'adreces ni a l'historial. Només ací, amb la
   marca de l'alta: sense marca, uns tokens al fragment poden ser de
   l'amfitrió, i no es toquen (W4-02). */
function tornadaDAlta(consulta) {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const error = fragment.get('error') || fragment.get('error_description')
    || consulta.get('error') || consulta.get('error_description');
  netejaRetorn();
  if (error) throw new Error(CONFIRMACIO_FALLIDA);
  return null;
}

/**
 * F1-seguiments · La marca de la recuperació de contrasenya, per a
 * supabase/auth.js. Sense `sdp_auth=recuperacio` (una sola, i eixe valor),
 * torna null i no toca res. Amb ella, lleva de la URL la marca i els paràmetres
 * d'error de GoTrue (PARAMETRES_DE_RECUPERACIO; la resta de la consulta,
 * literal), i el fragment si porta un error o tokens; conserva history.state.
 * Diu si GoTrue hi ha deixat un error: amb la plantilla per defecte, un enllaç
 * caducat o ja usat torna amb #error=access_denied&error_code=otp_expired.
 * El token_hash no el llig ni el toca: és de tornadaRecuperacio.js, abans.
 * @returns {null | { error: boolean }}
 */
export function recullMarcaDeRecuperacio() {
  if (typeof window === 'undefined') return null;
  const consulta = new URLSearchParams(window.location.search);
  if (!portaMarcaAuth(consulta, VALOR_RECUPERACIO)) return null;
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const error = ['error', 'error_code', 'error_description'].some((clau) => Boolean(fragment.get(clau) || consulta.get(clau)));
  netejaRetorn(PARAMETRES_DE_RECUPERACIO);
  return { error };
}

/* La pàgina torna on estava: fora els `parametres` (els PARAMETRES_DE_TORNADA
   si no se'n donen; la resta de la consulta, literal) i el fragment si porta
   codi, error o tokens. Conserva history.state (el del router o el de
   l'amfitrió). Només es crida quan la tornada és nostra. */
function netejaRetorn(parametres = PARAMETRES_DE_TORNADA) {
  const u = new URL(window.location.href);

  if (u.hash.includes('code=') || u.hash.includes('sdp_code=') || u.hash.includes('error=') || u.hash.includes('access_token=') || u.hash.includes('refresh_token=')) {
    u.hash = '';
  }

  const neta = u.pathname + senseParametresDeTornada(u.search, parametres) + u.hash;
  if (neta !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(window.history.state, '', neta);
  }
}

/** Utilitat per a proves. */
export const _intern = {
  CLAU_VERIFICADOR, CLAU_INTENT, PREFIX_ESPERA, PREFIX_TRASPAS, CLAU_INDEX, CAMI, PARAM_INTENT, PARAM_AUTH, VALOR_ALTA,
  VALOR_RECUPERACIO, FORMA_INTENT, TEMPS_MAXIM_MS, VIGENCIA_TRASPAS_MS, PARAMETRES_DE_TORNADA, PARAMETRES_DE_RECUPERACIO,
  LONGITUD_MAXIMA_TORNADA, RELE_FALLIT, clauEspera, clauTraspas, base64url, redirigeix,
  /* W4-02 i B (quarta passada, 261003). */
  PREFIX_INSTANTANIA, LONGITUD_MAXIMA_INSTANTANIA, VIGENCIA_INSTANTANIA_MS, esMarcDAltreOrigen
};
