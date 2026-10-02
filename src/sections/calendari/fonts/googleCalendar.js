/**
 * googleCalendar.js — l'adaptador de LECTURA de Google Calendar (API v3) al
 * contracte de fonts (contracteFonts.js).
 *
 * T1 (prompt comú 261002_0125) · Dues peces, cap dependència:
 *   · crearFontGoogle · una font del contracte que llig els esdeveniments
 *     d'un calendari (events.list) amb un token Bearer que li dona
 *     `obteToken`. No guarda res: ni token, ni resposta.
 *   · l'autorització OAuth 2.0 de client web (flux de token, sense secret):
 *     urlAutoritzacioGoogle obri la porta, esperaRespostaOAuth espera la
 *     tornada de la pàgina public/auth/calendari-google.html i
 *     llegixRespostaOAuth la comprova (state) i en trau el token. El token
 *     només viu en memòria (sessioFonts.js).
 *
 * PER QUÈ NO EL RELLEU D'OAUTH (oauthRelay.js). El relleu és de Supabase: rep
 * un `code` de GoTrue i el bescanvia amb PKCE contra /auth/v1/token. Google
 * Calendar torna un `access_token` al fragment, sense GoTrue al mig i sense
 * cap bescanvi, i el relleu no el llig (callback.html només mira ?code=). Per
 * això la tornada és una pàgina pròpia i mínima, sense scripts en línia, que
 * no guarda res i no parla amb cap servidor.
 *
 * PER QUÈ NO LA LLIBRERIA DE GOOGLE. La CSP d'index.html és script-src
 * 'self': gsi/client no es pot carregar. connect-src https: sí que deixa
 * parlar amb www.googleapis.com.
 *
 * ZONA. La consulta demana timeZone=Europe/Madrid: les hores tornen amb el
 * desplaçament del poble i el model les guarda amb eixa zona. Els actes de
 * tot el dia porten start.date i end.date EXCLUSIU, com el model.
 */
import { dataIsoONull } from '../../../utils/calendari.js';
import { extractPlainText } from '../../../utils/contentAdapter.js';
import { ZONA_PER_DEFECTE, deGoogleCalendar } from '../../../utils/esdeveniment.js';
import { ERRORS_DE_FONT, ErrorDeFont, creaFont, entradesDeFont } from './contracteFonts.js';

export const API_GOOGLE_CALENDAR = 'https://www.googleapis.com/calendar/v3';
export const URL_AUTORITZACIO_GOOGLE = 'https://accounts.google.com/o/oauth2/v2/auth';
export const AMBIT_LECTURA = 'https://www.googleapis.com/auth/calendar.readonly';
/* El màxim que admet events.list per pàgina, i quantes pàgines com a molt:
   2.500 esdeveniments en el període que es veu (l'any, el més llarg). */
export const MAX_RESULTATS = 250;
export const MAX_PAGINES = 10;
/* El missatge i el canal de la pàgina de tornada (calendari-google.js). */
export const TIPUS_MISSATGE_OAUTH = 'sdp:gcal-oauth';
export const CANAL_OAUTH = 'sdp-gcal-oauth';
export const TEMPS_MAXIM_OAUTH_MS = 300000;

/* Només els camps que es pinten: ni convidats, ni organitzador, ni creador. */
const CAMPS = 'items(id,status,summary,description,location,start,end,htmlLink,updated),nextPageToken';
const CLIENT_GOOGLE = /^[A-Za-z0-9-]{1,100}\.apps\.googleusercontent\.com$/;
/* Un calendarId ('primary', una adreça o l'id d'un calendari compartit). */
const ID_CALENDARI = /^[^\s\u0000-\u001F\u007F]{1,254}$/;
const ESTAT_OAUTH = /^[A-Za-z0-9_-]{16,128}$/;
/* Un access_token: ASCII visible, sense espais. */
const TOKEN = /^[!-~]{8,4096}$/;
const HTTPS = /^https:\/\/[^\s\u0000-\u001F\u007F]+$/i;
const PROMPTS = new Set(['none', 'consent', 'select_account']);
const LIMITS_DE_QUOTA = new Set(['rateLimitExceeded', 'userRateLimitExceeded', 'quotaExceeded']);
const HOSTS_LOCALS = new Set(['localhost', '127.0.0.1', '[::1]']);
/* Un minut de marge: el token es dona per caducat abans que Google el rebutge. */
const MARGE_CADUCITAT_S = 60;

/** El client és un client web de Google («…apps.googleusercontent.com»)? */
export const esClientGoogle = (clientId) => typeof clientId === 'string' && CLIENT_GOOGLE.test(clientId);

/** Una adreça de tornada vàlida: https, o http només en local; sense credencials ni fragment. */
export function esAdrecaDeRetorn(adreca) {
  if (typeof adreca !== 'string') return false;
  let url;
  try { url = new URL(adreca); } catch { return false; }
  const local = HOSTS_LOCALS.has(url.hostname);
  return (url.protocol === 'https:' || (local && url.protocol === 'http:')) && !url.username && !url.password && !url.hash;
}

const errorAvortat = () => new DOMException('Consulta cancel·lada.', 'AbortError');

/* ── Lectura (events.list) ─────────────────────────────────────────────── */

/** L'adreça d'una pàgina d'esdeveniments del calendari en el rang [desde, fins). */
export function urlEsdevenimentsGoogle({ calendarId, desde, fins, pageToken = null }) {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: desde.toISOString(),
    timeMax: fins.toISOString(),
    maxResults: String(MAX_RESULTATS),
    timeZone: ZONA_PER_DEFECTE,
    fields: CAMPS
  });
  if (pageToken) params.set('pageToken', pageToken);
  return `${API_GOOGLE_CALENDAR}/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
}

/* Un moment de Google en la forma que llig deGoogleCalendar: { date } o
   { dateTime } amb la zona del poble (la de la consulta). */
function momentDeGoogle(moment) {
  if (!moment || typeof moment !== 'object') return undefined;
  if (typeof moment.date === 'string') return { date: moment.date };
  if (typeof moment.dateTime === 'string') return { dateTime: moment.dateTime, timeZone: ZONA_PER_DEFECTE };
  return undefined;
}

/**
 * Un recurs Event de Google com a esdeveniment del model (via
 * deGoogleCalendar, la traducció canònica d'utils/esdeveniment.js), o null.
 * Un cancel·lat és null. La descripció passa a text pla (Google hi porta
 * HTML); l'enllaç només si és https. L'uid porta la font: el mateix acte en
 * dos calendaris són dues ocurrències a les vistes, no una clau repetida.
 */
export function esdevenimentDeGoogle(recurs, idFont) {
  if (!recurs || typeof recurs !== 'object' || recurs.status === 'cancelled') return null;
  if (typeof recurs.id !== 'string' || !recurs.id) return null;
  return deGoogleCalendar({
    id: recurs.id,
    iCalUID: `gcal-${idFont}:${recurs.id}@socdepoble.org`,
    summary: recurs.summary,
    description: typeof recurs.description === 'string' ? extractPlainText(recurs.description, Infinity) : undefined,
    location: typeof recurs.location === 'string' ? recurs.location : undefined,
    start: momentDeGoogle(recurs.start),
    end: momentDeGoogle(recurs.end),
    status: recurs.status,
    htmlLink: typeof recurs.htmlLink === 'string' && HTTPS.test(recurs.htmlLink) ? recurs.htmlLink : undefined,
    updated: dataIsoONull(recurs.updated) ?? undefined
  });
}

/* L'error tipat d'una resposta que no és 2xx. 401: el token ja no val. 403
   (que no siga de quota) i 404: el compte no veu este calendari. La resta
   (quota, 5xx, 4xx estranys), XARXA: tornar-ho a provar té sentit. */
async function errorDeResposta(resposta) {
  const estat = resposta.status;
  let motiu = null;
  try {
    const cos = await resposta.json();
    motiu = cos?.error?.errors?.[0]?.reason ?? cos?.error?.status ?? null;
  } catch { /* sense cos llegible */ }
  if (estat === 401) return new ErrorDeFont(ERRORS_DE_FONT.TOKEN_CADUCAT, undefined, { estat, motiu });
  if ((estat === 403 && !LIMITS_DE_QUOTA.has(motiu)) || estat === 404) {
    return new ErrorDeFont(ERRORS_DE_FONT.SENSE_ACCES, undefined, { estat, motiu });
  }
  return new ErrorDeFont(ERRORS_DE_FONT.XARXA, undefined, { estat, motiu });
}

/**
 * Una font de Google Calendar. `obteToken` → el token d'accés (o una promesa)
 * o null si el compte no està connectat (SENSE_AUTORITZACIO, sense cap
 * petició). `fetchImpl` es crida sempre com a funció lliure (mai com a mètode:
 * el fetch del navegador no admet un altre `this`).
 */
export function crearFontGoogle({
  id, nom, calendarId, colorToken, obteToken, fetchImpl = globalThis.fetch, compte = null, activa = true, maxPagines = MAX_PAGINES
} = {}) {
  if (typeof calendarId !== 'string' || !ID_CALENDARI.test(calendarId)) throw new TypeError(`[fonts] La font «${id}» necessita un calendarId de Google.`);
  if (typeof obteToken !== 'function') throw new TypeError(`[fonts] La font «${id}» necessita obteToken.`);
  if (typeof fetchImpl !== 'function') throw new TypeError('[fonts] No hi ha cap fetch per a parlar amb Google.');

  async function demana(url, token, signal) {
    let resposta;
    try {
      resposta = await fetchImpl(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal,
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        referrerPolicy: 'no-referrer'
      });
    } catch (error) {
      if (signal?.aborted || error?.name === 'AbortError') throw error;
      throw new ErrorDeFont(ERRORS_DE_FONT.XARXA, undefined, { causa: error });
    }
    if (!resposta?.ok) throw await errorDeResposta(resposta ?? {});
    try {
      return await resposta.json();
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ErrorDeFont(ERRORS_DE_FONT.RESPOSTA_INVALIDA, undefined, { causa: error });
    }
  }

  async function llistaEntrades({ desde, fins, signal } = {}) {
    if (!(desde instanceof Date) || !(fins instanceof Date) || !(fins.getTime() > desde.getTime())) {
      throw new TypeError('[fonts] El rang ha de ser dos Date, i «fins» després de «desde».');
    }
    if (signal?.aborted) throw errorAvortat();
    const token = await obteToken();
    if (typeof token !== 'string' || !TOKEN.test(token)) throw new ErrorDeFont(ERRORS_DE_FONT.SENSE_AUTORITZACIO);
    const recursos = [];
    let pageToken = null;
    for (let pagina = 0; pagina < maxPagines; pagina += 1) {
      const cos = await demana(urlEsdevenimentsGoogle({ calendarId, desde, fins, pageToken }), token, signal);
      if (!cos || typeof cos !== 'object' || (cos.items !== undefined && !Array.isArray(cos.items))) {
        throw new ErrorDeFont(ERRORS_DE_FONT.RESPOSTA_INVALIDA, 'La resposta de Google no porta cap llista d’esdeveniments.');
      }
      recursos.push(...(cos.items ?? []));
      pageToken = typeof cos.nextPageToken === 'string' && cos.nextPageToken ? cos.nextPageToken : null;
      if (!pageToken) {
        const vius = recursos.filter((recurs) => recurs?.status !== 'cancelled');
        return entradesDeFont(id, vius.map((recurs) => esdevenimentDeGoogle(recurs, id)));
      }
    }
    throw new ErrorDeFont(ERRORS_DE_FONT.RESPOSTA_INVALIDA,
      `Este calendari té més de ${maxPagines * MAX_RESULTATS} esdeveniments en este període: no se’n mostra cap abans que mitja llista.`);
  }

  return creaFont({ id, nom, tipus: 'gcal', colorToken, activa, compte, llistaEntrades });
}

/* ── Autorització (OAuth 2.0 per a aplicacions web, flux de token) ────── */

/** Un `state` nou, imprevisible: 24 octets aleatoris en hexadecimal. */
export function generaEstatOAuth(cripto = globalThis.crypto) {
  if (typeof cripto?.getRandomValues !== 'function') {
    throw new ErrorDeFont(ERRORS_DE_FONT.SENSE_CONFIGURACIO, 'Este navegador no pot generar una petició segura per a Google.');
  }
  return Array.from(cripto.getRandomValues(new Uint8Array(24)), (octet) => octet.toString(16).padStart(2, '0')).join('');
}

/**
 * L'adreça d'autorització de Google per a un client web: response_type=token,
 * include_granted_scopes=true, l'àmbit de només lectura per defecte i, si de
 * cas, el compte suggerit (login_hint) i el prompt. Llança
 * SENSE_CONFIGURACIO si alguna peça no és vàlida.
 */
export function urlAutoritzacioGoogle({ clientId, redirectUri, estat, loginHint = null, scope = AMBIT_LECTURA, prompt = null } = {}) {
  const falla = (missatge) => new ErrorDeFont(ERRORS_DE_FONT.SENSE_CONFIGURACIO, missatge);
  if (!esClientGoogle(clientId)) throw falla('Falta el client OAuth de Google (VITE_GOOGLE_OAUTH_CLIENT_ID) o no en té la forma.');
  if (!esAdrecaDeRetorn(redirectUri)) throw falla('L’adreça de tornada de Google ha de ser https (o http en local).');
  if (typeof estat !== 'string' || !ESTAT_OAUTH.test(estat)) throw falla('Falta l’estat de la petició a Google.');
  if (typeof scope !== 'string' || !scope.trim()) throw falla('Falta l’àmbit de la petició a Google.');
  if (prompt !== null && !PROMPTS.has(prompt)) throw falla(`«${prompt}» no és cap prompt de Google.`);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: scope.trim(),
    state: estat,
    include_granted_scopes: 'true'
  });
  if (typeof loginHint === 'string' && ID_CALENDARI.test(loginHint.trim())) params.set('login_hint', loginHint.trim());
  if (prompt) params.set('prompt', prompt);
  return `${URL_AUTORITZACIO_GOOGLE}?${params}`;
}

/**
 * El fragment de la tornada de Google ('#access_token=…&state=…' o
 * '#error=…&state=…') → { token, caduca } (caduca: ms, amb un minut de
 * marge). Primer el state: una resposta que no és d'esta petició llança
 * SENSE_AUTORITZACIO amb motiu 'estat' (qui espera la ignora). Després,
 * l'error de Google, el token, el tipus i l'àmbit concedit.
 */
export function llegixRespostaOAuth(hash, estatEsperat, { ambit = AMBIT_LECTURA, ara = Date.now() } = {}) {
  const params = new URLSearchParams(String(hash ?? '').replace(/^#/, ''));
  const sense = (missatge, motiu = null) => new ErrorDeFont(ERRORS_DE_FONT.SENSE_AUTORITZACIO, missatge, { motiu });
  if (typeof estatEsperat !== 'string' || !estatEsperat || params.get('state') !== estatEsperat) {
    throw sense('La resposta de Google no correspon a cap connexió demanada des d’ací.', 'estat');
  }
  const error = params.get('error');
  if (error) {
    throw sense(error === 'access_denied'
      ? 'No has donat permís per a llegir el calendari.'
      : 'Google no ha autoritzat la connexió.', error);
  }
  const token = params.get('access_token');
  if (!token || !TOKEN.test(token)) throw sense('Google no ha tornat cap permís per a llegir el calendari.', 'token');
  const tipus = params.get('token_type');
  if (tipus && tipus.toLowerCase() !== 'bearer') throw sense('Google ha tornat un permís d’un tipus desconegut.', 'tipus');
  if (params.has('scope') && !params.get('scope').split(/\s+/).includes(ambit)) {
    throw sense('No has marcat el permís per a veure el calendari.', 'ambit');
  }
  const segons = /^\d{1,6}$/.test(params.get('expires_in') ?? '') ? Number(params.get('expires_in')) : 3600;
  return Object.freeze({ token, caduca: ara + Math.max(segons - MARGE_CADUCITAT_S, 1) * 1000 });
}

const creaCanalOAuth = () => (typeof BroadcastChannel === 'function' ? new BroadcastChannel(CANAL_OAUTH) : null);

/**
 * Espera la tornada de l'autorització de la pàgina calendari-google.html, per
 * dos camins: postMessage de la finestra emergent (només del mateix origen i
 * d'eixa finestra) o, si Google ha tallat l'`opener` (COOP), el canal
 * BroadcastChannel del mateix origen. Cap emmagatzematge. Resol amb
 * { token, caduca }; rebutja amb l'error de Google, amb SENSE_AUTORITZACIO
 * si passa `temps` o amb un AbortError si `signal` s'avorta. Una resposta
 * amb un altre state no és nostra: s'ignora.
 */
export function esperaRespostaOAuth({
  estat, finestra = null, finestraMare = globalThis.window, crearCanal = creaCanalOAuth, temps = TEMPS_MAXIM_OAUTH_MS, signal, ambit = AMBIT_LECTURA
} = {}) {
  return new Promise((resol, rebutja) => {
    if (signal?.aborted) {
      rebutja(errorAvortat());
      return;
    }
    const origen = finestraMare.location.origin;
    let canal = null;
    let rellotge = null;
    let acabat = false;

    function acaba(continua, valor) {
      if (acabat) return;
      acabat = true;
      finestraMare.removeEventListener('message', perMissatge);
      signal?.removeEventListener('abort', perAbort);
      clearTimeout(rellotge);
      if (canal) {
        canal.removeEventListener('message', perCanal);
        try { canal.close(); } catch { /* ja tancat */ }
      }
      continua(valor);
    }
    function tracta(dades) {
      if (!dades || dades.type !== TIPUS_MISSATGE_OAUTH || typeof dades.hash !== 'string') return;
      let resposta;
      try {
        resposta = llegixRespostaOAuth(dades.hash, estat, { ambit });
      } catch (error) {
        if (error?.motiu !== 'estat') acaba(rebutja, error);
        return;
      }
      acaba(resol, resposta);
    }
    function perMissatge(event) {
      if (event.origin !== origen || (finestra && event.source !== finestra)) return;
      tracta(event.data);
    }
    function perCanal(event) {
      tracta(event.data);
    }
    function perAbort() {
      acaba(rebutja, errorAvortat());
    }

    rellotge = setTimeout(() => acaba(rebutja, new ErrorDeFont(ERRORS_DE_FONT.SENSE_AUTORITZACIO,
      'La connexió amb Google ha tardat massa. Torna a provar.', { motiu: 'temps' })), temps);
    finestraMare.addEventListener('message', perMissatge);
    signal?.addEventListener('abort', perAbort, { once: true });
    try {
      canal = crearCanal();
      canal?.addEventListener('message', perCanal);
    } catch {
      canal = null;
    }
  });
}
