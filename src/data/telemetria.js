import { getPreferenciaLlegat, setPreferenciaLlegat } from '../config/storage.js';
import { CLAUS_FUNDACIONALS } from './identitatsSeed.js';
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
 *   - Des d'un servidor local (localhost, 127.0.0.1 o [::1]) tampoc, encara
 *     que porte el comptador configurat: motiu `servidor-local`. Només les
 *     proves que passen `cfg` explícit hi envien (ordre del Mestre, T3.3).
 *   - La persona el pot apagar: Do Not Track, Global Privacy Control o
 *     `localStorage['umami.disabled']` (la mateixa clau que respecta el script
 *     oficial). `estableixTelemetriaApagada()` l'escriu.
 *   - Si l'amfitrió ja porta `window.umami` (WordPress, Sollutia), li delega
 *     els esdeveniments i no compta visites: el seu script ja les compta.
 *     Encastada en una pàgina d'un altre sense `window.umami` (qualsevol
 *     amfitrió que no declare `manageDocumentHead: true`, iframe o
 *     `__SDP_EMBEDDED__`) no envia res al nostre comptador: allí mana la
 *     política de privacitat de l'amfitrió. RouteTelemetria ho declara amb
 *     `declaraEncastada()`.
 *   - Mai s'envia la query ni el hash (poden portar títols: `?item_id=`), ni
 *     el que va després del primer tram de la ruta (`/notes/<id>` ix com a
 *     `/notes/*`), ni el títol de la pestanya (una fitxa de detall hi posa el
 *     títol de la nota), ni identificadors de persona, ni el camí del referent.
 *   - Cada intent, iniciat o no, es publica com a `sdp:telemetria` a `window` i
 *     es guarda en memòria (`darrersEnviaments`) amb el seu estat de
 *     `verificacio` (`'intent' | 'acceptat' | 'fallat' | 'no_comprovat'`,
 *     P2-14 · C0545-S3). `enviat: true` acredita que s'ha iniciat fetch
 *     (`verificacio: 'intent'`, que passa a `'acceptat'` o `'fallat'` quan
 *     resol la promesa) o s'ha delegat a l'amfitrió (`'no_comprovat'`).
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

/* Gauntlet c3 (vapid-detector-cec-al-build-real) · Només les tres claus que
   es lligen, mai import.meta.env sencer: Vite incrustaria al bundle totes les
   VITE_* de l'entorn, també una privada mal anomenada. Fora de Vite (node
   --test) import.meta.env no existix i el try/catch ho tolera (versio.js). */
function entornDeTelemetria() {
  try {
    return {
      VITE_UMAMI_WEBSITE_ID: import.meta.env.VITE_UMAMI_WEBSITE_ID,
      VITE_UMAMI_HOST: import.meta.env.VITE_UMAMI_HOST,
      VITE_UMAMI_SHARE_URL: import.meta.env.VITE_UMAMI_SHARE_URL
    };
  } catch {
    return {};
  }
}

/** Llig la configuració pública de compilació. Congelada: ningú la muta. */
export function configTelemetria(env = entornDeTelemetria()) {
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
  return Boolean(getPreferenciaLlegat(CLAU_APAGADA));
}

/** Només la tria de la persona; DNT i GPC no es poden anul·lar des d'ací. */
export function estableixTelemetriaApagada(apagada) {
  return setPreferenciaLlegat(CLAU_APAGADA, apagada ? '1' : null);
}

/* Gauntlet 261016 (F28) · Les fitxes canòniques de primer nivell
   (/javillinares, /socdepoble, /rentonar; navigation.js · RUTES_CANONIQUES)
   porten el sobrenom de la identitat en el PRIMER tram, que és el que viatja.
   Es tapen com qualsevol altra fitxa: la secció és «perfil» i la ruta
   «/perfil/*». La llista ix de la llavor, mai es copia ací. */
const PRIMERS_TRAMS_PERSONALS = new Set(CLAUS_FUNDACIONALS.map((clau) => String(clau).toLowerCase()));
const esTramPersonal = (tram) => PRIMERS_TRAMS_PERSONALS.has(String(tram).toLowerCase());

/** Primer segment de la ruta: «notes», «mur»… Dada de secció, mai de persona. */
export function seccioActual(pathname) {
  const ruta = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const primer = String(ruta).split(/[?#]/)[0].split('/').filter(Boolean)[0];
  if (!primer) return 'inici';
  return esTramPersonal(primer) ? 'perfil' : primer;
}

/** L'app declara si viu dins d'una pàgina d'un altre (config de l'amfitrió). */
export function declaraEncastada(valor) {
  encastadaDeclarada = Boolean(valor);
}

function encastada() {
  if (encastadaDeclarada || window.__SDP_EMBEDDED__) return true;
  try { return window.self !== window.top; } catch { return true; }
}

/* Ordre del Mestre (30-10-2026, prompt 2208, T3.3). Les mateixes tres adreces
   que origenSegur. L'app nativa (https://localhost a Android,
   capacitor://localhost a iOS) no porta comptador (vite.natiu.config.js, D10):
   hi diu «sense-configurar» abans d'arribar ací. */
const HOSTS_LOCALS = ['localhost', '127.0.0.1', '[::1]'];

/** Cert si la pàgina la servix un servidor local (localhost, 127.0.0.1 o [::1]). */
export function esServidorLocal() {
  try { return HOSTS_LOCALS.includes(window.location.hostname); } catch { return false; }
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
  if (esTramPersonal(primer)) return '/perfil/*';
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

function notificaDom(intent) {
  try { window.dispatchEvent(new CustomEvent(ESDEVENIMENT_DOM, { detail: { ...intent } })); } catch { /* sense DOM */ }
}

function publica(intent) {
  registre.unshift(intent);
  registre.length = Math.min(registre.length, MAX_REGISTRE);
  notificaDom(intent);
  return { ...intent };
}

function envia(tipus, { nom, dades, ruta, cfg }) {
  if (typeof window === 'undefined') return { enviat: false, motiu: 'sense-navegador', verificacio: 'no_comprovat' };
  const url = rutaTapada(ruta);
  const netes = dadesNetes(dades);
  const base = { tipus, nom: nom || null, url, dades: netes || null, moment: new Date().toISOString() };

  if (telemetriaApagada()) return publica({ ...base, enviat: false, motiu: 'apagada', verificacio: 'no_comprovat' });

  const amfitrio = window.umami;
  if (amfitrio && typeof amfitrio.track === 'function') {
    if (tipus === 'visita') return publica({ ...base, enviat: false, motiu: 'amfitrio-compta-visites', verificacio: 'no_comprovat' });
    try { amfitrio.track(nom, netes); return publica({ ...base, enviat: true, motiu: 'amfitrio', verificacio: 'no_comprovat' }); }
    catch { return publica({ ...base, enviat: false, motiu: 'error-amfitrio', verificacio: 'fallat' }); }
  }

  if (encastada()) return publica({ ...base, enviat: false, motiu: 'encastada', verificacio: 'no_comprovat' });

  const config = cfg || configTelemetria();
  if (!config.actiu) return publica({ ...base, enviat: false, motiu: 'sense-configurar', verificacio: 'no_comprovat' });
  /* Ordre del Mestre (30-10-2026, prompt 2208, T3.3): un servidor local amb el
     comptador configurat (.env.local) no suma res a les xifres públiques.
     Només una prova que passa `cfg` explícit hi pot enviar. */
  if (!cfg && esServidorLocal()) return publica({ ...base, enviat: false, motiu: 'servidor-local', verificacio: 'no_comprovat' });
  if (typeof window.fetch !== 'function') return publica({ ...base, enviat: false, motiu: 'sense-fetch', verificacio: 'no_comprovat' });

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
    const promesa = window.fetch(`${config.host}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'event', payload }),
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    });
    const entrada = { ...base, enviat: true, motiu: 'umami', verificacio: 'intent' };
    const retorn = publica(entrada);
    Promise.resolve(promesa)
      .then((resposta) => {
        if(!registre.includes(entrada))return;
        entrada.verificacio = resposta?.ok === true ? 'acceptat' : resposta?.ok === false ? 'fallat' : 'no_comprovat';
        notificaDom(entrada);
      })
      .catch(() => {
        /* la telemetria mai trenca la interfície */
        if(!registre.includes(entrada))return;
        entrada.verificacio = 'fallat';
        notificaDom(entrada);
      });
    return retorn;
  } catch {
    return publica({ ...base, enviat: false, motiu: 'error-xarxa', verificacio: 'fallat' });
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
