/**
 * Telemetria poca-solta: compta visites i actes conscients (Connectar) en un
 * Umami, sense carregar cap script de fora.
 *
 * Per què no el `script.js` oficial d'Umami: la CSP d'`index.html` i de
 * `vercel.json` diu `script-src 'self'`, i carregar-lo obligaria a obrir-la.
 * Umami accepta el mateix missatge per `POST /api/send` i `connect-src` ja
 * admet `https:`. Resultat: cap dependència nova, cap script bloquejant, cap
 * galeta.
 *
 * Contracte:
 *   - Sense `VITE_UMAMI_WEBSITE_ID` i `VITE_UMAMI_HOST` vàlids no s'envia res
 *     (servidor de desenvolupament i nodes sense comptador).
 *   - La persona el pot apagar: Do Not Track, Global Privacy Control o
 *     `localStorage['umami.disabled']` (la mateixa clau que respecta el script
 *     oficial). `estableixTelemetriaApagada()` l'escriu.
 *   - Si l'amfitrió ja porta `window.umami` (WordPress, Sollutia), li delega
 *     els esdeveniments i no compta visites: el seu script ja les compta.
 *     Encastada en una pàgina d'un altre sense `window.umami` (WordPress amb
 *     `manageDocumentHead: false`, iframe o `__SDP_EMBEDDED__`) no envia res
 *     al nostre comptador: allí mana la política de privacitat de l'amfitrió.
 *     RouteTelemetria ho declara amb `declaraEncastada()`.
 *   - Mai s'envia la query ni el hash (poden portar títols: `?item_id=`), ni
 *     el que va després del primer tram de la ruta (`/notes/<id>` ix com a
 *     `/notes/*`), ni el títol de la pestanya (una fitxa de detall hi posa el
 *     títol de la nota), ni identificadors de persona, ni el camí del referent.
 *   - Cada intent, enviat o no, es publica com a `sdp:telemetria` a `window` i
 *     es guarda en memòria (`darrersEnviaments`): el que el navegador envia es
 *     pot vore a la pàgina de privacitat. Transparència, no promesa.
 */

export const CLAU_APAGADA = 'umami.disabled';
export const ESDEVENIMENT_DOM = 'sdp:telemetria';

const MAX_REGISTRE = 20;
const MAX_TEXT = 120;
const WEBSITE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const registre = [];
let darreraRuta = null;
let referentEnviat = false;
let encastadaDeclarada = false;

function origenSegur(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return '';
  let url;
  try { url = new URL(valor.trim()); } catch { return ''; }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!(url.protocol === 'https:' || (local && url.protocol === 'http:'))) return '';
  if (url.username || url.password) return '';
  return url.href.replace(/\/+$/, '');
}

/** Llig la configuració pública de compilació. Congelada: ningú la muta. */
export function configTelemetria(env = import.meta.env || {}) {
  const websiteId = String(env.VITE_UMAMI_WEBSITE_ID || '').trim();
  const host = origenSegur(env.VITE_UMAMI_HOST);
  const shareUrl = origenSegur(env.VITE_UMAMI_SHARE_URL);
  return Object.freeze({
    actiu: WEBSITE_ID.test(websiteId) && Boolean(host),
    websiteId: WEBSITE_ID.test(websiteId) ? websiteId : '',
    host,
    shareUrl
  });
}

export function telemetriaApagada() {
  if (typeof window === 'undefined') return true;
  try {
    const nav = window.navigator || {};
    if (nav.doNotTrack === '1' || window.doNotTrack === '1' || nav.globalPrivacyControl === true) return true;
  } catch { /* navegador sense eixes propietats */ }
  try { return Boolean(window.localStorage.getItem(CLAU_APAGADA)); } catch { return false; }
}

/** Només la tria de la persona; DNT i GPC no es poden anul·lar des d'ací. */
export function estableixTelemetriaApagada(apagada) {
  try {
    if (apagada) window.localStorage.setItem(CLAU_APAGADA, '1');
    else window.localStorage.removeItem(CLAU_APAGADA);
    return true;
  } catch { return false; }
}

/** Primer segment de la ruta: «notes», «mur»… Dada de secció, mai de persona. */
export function seccioActual(pathname) {
  const ruta = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  return String(ruta).split('/').filter(Boolean)[0] || 'inici';
}

/** L'app declara si viu dins d'una pàgina d'un altre (config de l'amfitrió). */
export function declaraEncastada(valor) {
  encastadaDeclarada = Boolean(valor);
}

function encastada() {
  if (encastadaDeclarada || window.__SDP_EMBEDDED__) return true;
  try { return window.self !== window.top; } catch { return true; }
}

/** Ruta sense query ni hash: la clau per a no comptar dues vegades la mateixa. */
function rutaSenseQuery(ruta) {
  const valor = ruta ?? window.location.pathname;
  return String(valor).split(/[?#]/)[0] || '/';
}

/** Ruta que viatja: la secció i, si era una fitxa, un asterisc (`/perfil/*`). */
function rutaTapada(ruta) {
  const [primer, ...resta] = rutaSenseQuery(ruta).split('/').filter(Boolean);
  if (!primer) return '/';
  return resta.length ? `/${primer}/*` : `/${primer}`;
}

function dadesNetes(dades) {
  if (!dades || typeof dades !== 'object') return undefined;
  const netes = {};
  for (const [clau, valor] of Object.entries(dades).slice(0, 10)) {
    if (typeof valor === 'string') netes[clau] = valor.slice(0, MAX_TEXT);
    else if (typeof valor === 'number' && Number.isFinite(valor)) netes[clau] = valor;
    else if (typeof valor === 'boolean') netes[clau] = valor;
  }
  return Object.keys(netes).length ? netes : undefined;
}

function referentExtern() {
  if (referentEnviat) return '';
  referentEnviat = true;
  try {
    const ref = new URL(document.referrer);
    return ref.origin === window.location.origin ? '' : ref.origin;
  } catch { return ''; }
}

function publica(intent) {
  registre.unshift(intent);
  registre.length = Math.min(registre.length, MAX_REGISTRE);
  try { window.dispatchEvent(new CustomEvent(ESDEVENIMENT_DOM, { detail: intent })); } catch { /* sense DOM */ }
  return intent;
}

function envia(tipus, { nom, dades, ruta, cfg }) {
  if (typeof window === 'undefined') return { enviat: false, motiu: 'sense-navegador' };
  const url = rutaTapada(ruta);
  const netes = dadesNetes(dades);
  const base = { tipus, nom: nom || null, url, dades: netes || null, moment: new Date().toISOString() };

  if (telemetriaApagada()) return publica({ ...base, enviat: false, motiu: 'apagada' });

  const amfitrio = window.umami;
  if (amfitrio && typeof amfitrio.track === 'function') {
    if (tipus === 'visita') return publica({ ...base, enviat: false, motiu: 'amfitrio-compta-visites' });
    try { amfitrio.track(nom, netes); return publica({ ...base, enviat: true, motiu: 'amfitrio' }); }
    catch { return publica({ ...base, enviat: false, motiu: 'error-amfitrio' }); }
  }

  if (encastada()) return publica({ ...base, enviat: false, motiu: 'encastada' });

  const config = cfg || configTelemetria();
  if (!config.actiu) return publica({ ...base, enviat: false, motiu: 'sense-configurar' });
  if (typeof window.fetch !== 'function') return publica({ ...base, enviat: false, motiu: 'sense-fetch' });

  const payload = {
    website: config.websiteId,
    hostname: window.location.hostname,
    language: window.navigator?.language || '',
    screen: window.screen ? `${window.screen.width}x${window.screen.height}` : '',
    url,
    referrer: tipus === 'visita' ? referentExtern() : ''
  };
  if (nom) payload.name = String(nom).slice(0, 50);
  if (netes) payload.data = netes;

  try {
    window.fetch(`${config.host}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'event', payload }),
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    }).catch(() => { /* la telemetria mai trenca la interfície */ });
    return publica({ ...base, enviat: true, motiu: 'umami' });
  } catch {
    return publica({ ...base, enviat: false, motiu: 'error-xarxa' });
  }
}

/**
 * Compta una visita. Dues crides seguides a la mateixa ruta compten una; la
 * comparació es fa abans de tapar, perquè dues notes diferents són dues visites.
 */
export function registraVisita(ruta, { cfg } = {}) {
  if (typeof window === 'undefined') return { enviat: false, motiu: 'sense-navegador' };
  const clau = rutaSenseQuery(ruta);
  if (clau === darreraRuta) return { enviat: false, motiu: 'repetida' };
  darreraRuta = clau;
  return envia('visita', { ruta: clau, cfg });
}

/** Compta un acte conscient («connectar»…). `dades`: només valors simples. */
export function registraEsdeveniment(nom, dades, { cfg, ruta } = {}) {
  if (!nom) return { enviat: false, motiu: 'sense-nom' };
  return envia('esdeveniment', { nom, dades, ruta, cfg });
}

/** Còpia dels últims intents (el més recent primer), per al tauler de privacitat. */
export function darrersEnviaments() {
  return registre.map((intent) => ({ ...intent }));
}

/** Només per a proves: torna el mòdul a l'estat d'arrencada. */
export function _reiniciaTelemetria() {
  registre.length = 0;
  darreraRuta = null;
  referentEnviat = false;
  encastadaDeclarada = false;
}
