/**
 * configFonts.js — la configuració de les fonts de Google Calendar, llegida de
 * l'entorn (import.meta.env) i validada. Pur: l'entorn i l'origen es poden
 * passar (proves).
 *
 * T1 (prompt comú 261002_0125) · Dues variables públiques (van dins del
 * bundle; cap secret: el flux de token d'un client web no en porta):
 *   VITE_GOOGLE_OAUTH_CLIENT_ID  el client web de Google
 *                                («…apps.googleusercontent.com»). Sense ell,
 *                                cap font: fontsGoogleConfigurades() és fals i
 *                                /calendari es pinta com sempre (Llei del Píxel).
 *   VITE_GCAL_FONTS              JSON: [{ id, nom, calendarId, compte?,
 *                                colorToken?, activa? }]. Buida, una sola font:
 *                                el calendari 'primary' del compte que es
 *                                connecte. Mal escrita o sense cap font
 *                                vàlida, cap font (fallada tancada: no es cau
 *                                en silenci a la de per defecte).
 * Els valors suggerits (el privat i el de l'organització) són a .env.example.
 *
 * L'ADREÇA DE TORNADA és una capacitat de qui servix la pàgina, no una
 * suposició (auditoria Codex 261002_0148, punt 12): s'ha de registrar com a
 * «URI de redirecció autoritzat» del client a Google Cloud Console (una per
 * entorn) i ha de ser del mateix origen que l'app. Vegeu adrecaDeRetornGoogle:
 *   · l'SPA pròpia (socdepoble.org, el servidor local) servix
 *     public/auth/calendari-google.html: la ruta per defecte;
 *   · incrustada en un amfitrió (WordPress, Joomla, Sollutia), el paquet no
 *     porta auth/: Google només s'activa si l'amfitrió declara la seua amb
 *     window.SocDePoble.configura({ config: { retornCalendariGoogle } }).
 * Sense adreça, cap font, i `motiu` diu per què.
 */
import { getRuntimePolicy } from '../../../config/runtimePolicy.js';
import { COLORS_DE_FONT } from './contracteFonts.js';
import { esAdrecaDeRetorn, esClientGoogle } from './googleCalendar.js';

export const RUTA_RETORN_GOOGLE = '/auth/calendari-google.html';
/** La clau de configura({ config }) amb què un amfitrió declara la seua adreça de tornada de Google. */
export const CLAU_RETORN_AMFITRIO = 'retornCalendariGoogle';
/* L'element del contracte d'amfitrió (vite.standalone.config.js · CONTRACTE_AMFITRIO.element). */
const ELEMENT_INCRUSTAT = 'soc-de-poble';
/* El que la pàgina pot dir al veí; els detalls tècnics van als avisos de la consola. */
export const MOTIU_SENSE_RETORN = 'Esta web no té cap adreça registrada perquè Google hi torne: el calendari de Google no s’hi pot connectar.';
export const MOTIU_MAL_CONFIGURAT = 'El calendari de Google no està ben configurat en esta web.';
const AMB_ESPAIS = /[\s\u0000-\u001F\u007F]/;
/* Quantes fonts com a molt: el panell és una llista curta, no un directori. */
export const MAX_FONTS = 6;
/** Sense VITE_GCAL_FONTS: el calendari principal del compte que es connecte. */
export const FONTS_PER_DEFECTE = Object.freeze([
  Object.freeze({ id: 'privat', nom: 'El meu calendari', calendarId: 'primary', compte: null })
]);

const ID_FONT = /^[a-z][a-z0-9-]{0,31}$/;
const ID_CALENDARI = /^[^\s\u0000-\u001F\u007F]{1,254}$/;
const COMPTE = /^[^\s@\u0000-\u001F\u007F]{1,64}@[^\s@\u0000-\u001F\u007F]{1,189}$/;
const MAX_NOM = 60;

const NO_CONFIGURADA = Object.freeze({
  configurades: false, motiu: null, clientId: null, redirectUri: null, fonts: Object.freeze([]), avisos: Object.freeze([])
});

const textONull = (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : null);

/**
 * L'app està incrustada? Ho està quan la munta l'element <soc-de-poble> d'un
 * amfitrió (embed.jsx, el connector de WordPress, Sollutia); l'SPA pròpia
 * (main.jsx) pinta directament al #root, sense l'element.
 */
export function esIncrustada(doc = globalThis.document) {
  try {
    return Boolean(doc?.querySelector?.(ELEMENT_INCRUSTAT));
  } catch {
    return false;
  }
}

/** L'adreça que l'amfitrió ha declarat amb configura({ config: { retornCalendariGoogle } }), o undefined. */
export function retornDeclaratPerLAmfitrio(politica = getRuntimePolicy(true)) {
  const valor = politica?.rawHostConfig?.[CLAU_RETORN_AMFITRIO];
  return valor === undefined || valor === null || valor === '' ? undefined : valor;
}

/**
 * L'adreça de tornada de Google: { redirectUri } o, si no n'hi ha, { motiu,
 * avis } (el motiu per al veí, l'avís per a la consola).
 *   · `declarada` (per l'amfitrió): https, o http en local, sense espais,
 *     credencials ni fragment, i del MATEIX origen que l'app: la pàgina de
 *     tornada parla amb l'app per postMessage i BroadcastChannel, que no
 *     travessen orígens. Es passa tal qual a Google, que la compara lletra a
 *     lletra amb la registrada. Mal escrita: cap (no es cau a la de per defecte).
 *   · sense declaració i sense estar `incrustada`: l'origen de l'app més
 *     RUTA_RETORN_GOOGLE, la pàgina de public/auth/ de l'SPA pròpia.
 *   · sense declaració i incrustada: cap. Mai es copia la pàgina de tornada a
 *     l'arrel d'una altra web.
 */
export function adrecaDeRetornGoogle({ origen, incrustada = false, declarada } = {}) {
  const cap = (avis) => ({ motiu: MOTIU_SENSE_RETORN, avis });
  if (declarada !== undefined) {
    const text = typeof declarada === 'string' ? declarada.trim() : '';
    if (!text || AMB_ESPAIS.test(text) || !esAdrecaDeRetorn(text)) {
      return cap(`${CLAU_RETORN_AMFITRIO} no és una adreça https (o http local) sense espais, credencials ni fragment.`);
    }
    if (typeof origen !== 'string' || new URL(text).origin !== origen) {
      return cap(`${CLAU_RETORN_AMFITRIO} ha de ser del mateix origen que l’app (${origen ?? 'desconegut'}): la pàgina de tornada només parla amb el seu origen.`);
    }
    return { redirectUri: text };
  }
  if (incrustada) {
    return cap(`L’app està incrustada i l’amfitrió no ha declarat cap adreça de tornada: el paquet no porta auth/. Cal configura({ config: { ${CLAU_RETORN_AMFITRIO}: 'https://…' } }) amb una pàgina del seu origen registrada a Google Cloud Console.`);
  }
  const redirectUri = typeof origen === 'string' ? `${origen}${RUTA_RETORN_GOOGLE}` : null;
  if (!esAdrecaDeRetorn(redirectUri)) return cap('L’app no s’està servint des d’un origen https (o http local): Google no hi pot tornar.');
  return { redirectUri };
}

/* Una entrada de VITE_GCAL_FONTS, neta, o el motiu pel qual no val. */
function fontDeLaConfiguracio(cru, index) {
  if (!cru || typeof cru !== 'object' || Array.isArray(cru)) return { motiu: `la font ${index + 1} no és un objecte` };
  const id = textONull(cru.id);
  if (!id || !ID_FONT.test(id)) return { motiu: `la font ${index + 1} no té un id de minúscules, xifres i guionets` };
  const nom = textONull(cru.nom);
  if (!nom || nom.length > MAX_NOM) return { motiu: `la font «${id}» no té nom (o passa de ${MAX_NOM} caràcters)` };
  const calendarId = textONull(cru.calendarId);
  if (!calendarId || !ID_CALENDARI.test(calendarId)) return { motiu: `la font «${id}» no té un calendarId vàlid` };
  const compte = cru.compte == null || cru.compte === '' ? null : textONull(cru.compte);
  if (cru.compte != null && cru.compte !== '' && !(compte && COMPTE.test(compte))) return { motiu: `el compte de la font «${id}» no és una adreça` };
  if (cru.colorToken != null && !COLORS_DE_FONT.includes(cru.colorToken)) return { motiu: `el color de la font «${id}» no és cap token (${COLORS_DE_FONT.join(', ')})` };
  return { font: { id, nom, calendarId, compte, colorToken: cru.colorToken ?? null, activa: cru.activa !== false } };
}

/**
 * La configuració: { configurades, motiu, clientId, redirectUri, fonts, avisos }.
 * Cada font és { id, nom, calendarId, compte, colorToken, activa }; el color
 * que no es diu es pren de COLORS_DE_FONT per ordre. `avisos` explica (en
 * text, per a la consola) el que s'ha descartat; `motiu`, per al veí, per què
 * no hi ha cap font (null si simplement no hi ha client de Google).
 * `incrustada` i `retorn` (l'adreça declarada per l'amfitrió) es lligen de
 * l'entorn si no es passen: adrecaDeRetornGoogle.
 */
export function llegixConfigFonts(env = import.meta.env || {}, {
  origen = globalThis.location?.origin, incrustada = esIncrustada(), retorn = retornDeclaratPerLAmfitrio()
} = {}) {
  const clientId = textONull(env.VITE_GOOGLE_OAUTH_CLIENT_ID);
  if (!clientId) return NO_CONFIGURADA;
  const avisos = [];
  const tanca = (avis, motiu = MOTIU_MAL_CONFIGURAT) => Object.freeze({ ...NO_CONFIGURADA, motiu, avisos: Object.freeze([...avisos, avis]) });
  if (!esClientGoogle(clientId)) return tanca('VITE_GOOGLE_OAUTH_CLIENT_ID no té la forma d’un client web de Google.');
  const { redirectUri, motiu, avis } = adrecaDeRetornGoogle({ origen, incrustada, declarada: retorn });
  if (!redirectUri) return tanca(avis, motiu);

  const textFonts = textONull(env.VITE_GCAL_FONTS);
  let crues = FONTS_PER_DEFECTE;
  if (textFonts) {
    try {
      crues = JSON.parse(textFonts);
    } catch {
      return tanca('VITE_GCAL_FONTS no és JSON.');
    }
    if (!Array.isArray(crues)) return tanca('VITE_GCAL_FONTS ha de ser una llista.');
  }

  const fonts = [];
  crues.forEach((cru, index) => {
    const { font, motiu } = fontDeLaConfiguracio(cru, index);
    if (!font) avisos.push(`VITE_GCAL_FONTS: ${motiu}.`);
    else if (fonts.some((altra) => altra.id === font.id)) avisos.push(`VITE_GCAL_FONTS: l’id «${font.id}» està repetit.`);
    else if (fonts.length >= MAX_FONTS) avisos.push(`VITE_GCAL_FONTS: només es lligen ${MAX_FONTS} fonts.`);
    else fonts.push(font);
  });
  if (!fonts.length) return tanca('VITE_GCAL_FONTS no porta cap font vàlida.');

  const ambColor = fonts.map((font, index) => Object.freeze({ ...font, colorToken: font.colorToken ?? COLORS_DE_FONT[index % COLORS_DE_FONT.length] }));
  return Object.freeze({ configurades: true, motiu: null, clientId, redirectUri, fonts: Object.freeze(ambColor), avisos: Object.freeze(avisos) });
}

/** Hi ha alguna font de Google configurada? Sense client, o sense adreça de tornada, mai: el motiu el dona llegixConfigFonts. */
export const fontsGoogleConfigurades = (env, opcions) => llegixConfigFonts(env, opcions).configurades;

/* La configuració de l'entorn, memoritzada pels valors crus: el mateix
   objecte mentre no canvien (els hooks en depenen sense tornar a llegir). */
let memoria = null;
export function configFontsDeLEntorn(env = import.meta.env || {}, {
  origen = globalThis.location?.origin, incrustada = esIncrustada(), retorn = retornDeclaratPerLAmfitrio()
} = {}) {
  const clau = [env.VITE_GOOGLE_OAUTH_CLIENT_ID ?? '', env.VITE_GCAL_FONTS ?? '', origen ?? '', incrustada ? 'incrustada' : 'propia', String(retorn ?? '')].join('\n');
  if (memoria?.clau !== clau) {
    const config = llegixConfigFonts(env, { origen, incrustada, retorn });
    if (config.avisos.length) console.warn('[calendari] Fonts de Google:', config.avisos.join(' '));
    memoria = { clau, config };
  }
  return memoria.config;
}
