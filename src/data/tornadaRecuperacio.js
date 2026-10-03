/**
 * tornadaRecuperacio.js — LA TORNADA D'UN ENLLAÇ DE RECUPERACIÓ DE CONTRASENYA
 *
 * R (Onada 3, 261003). L'enllaç del correu torna a la pàgina de l'amfitrió on
 * es va demanar (la tornada de P1: urlDeTornada, data/oauthRelay.js) amb el
 * token_hash d'un sol ús al FRAGMENT:
 *     <pàgina de l'amfitrió>#token_hash=<hash>&type=recovery
 * És la plantilla «Reset password» de Supabase
 *     {{ .RedirectTo }}#token_hash={{ .TokenHash }}&type=recovery
 * El fragment no arriba al servidor de l'amfitrió ni als seus registres, i un
 * escàner de correu que només baixa l'enllaç no el consumix (no l'envia ni
 * executa l'app). Per robustesa també s'admet a la consulta, la forma de la
 * documentació de Supabase, que sí que arriba al servidor.
 *
 * R2 (decisió del Mestre, 261003): el token NO es verifica en carregar la
 * pàgina, sinó en prémer «Desa» (supabase/auth.js, definixContrasenyaNova).
 * Un escàner que EXECUTA la pàgina (la detonació de Safe Links de Microsoft,
 * habitual amb Outlook i Hotmail) ja no el gasta. A canvi, la pantalla no pot
 * dir de quin compte és abans de desar (R.txt §7).
 *
 * Funcions pures sobre una URL, més la neteja de l'historial:
 *   llegixTornadaDeRecuperacio(href) → { tokenHash } | { motiu } | null
 *   rutaSenseRecuperacio(href)       → camí + consulta + fragment, sense restes
 *   netejaTornadaDeRecuperacio()     → la mateixa neteja, sobre window
 *
 * La forma implícita (#access_token=…&type=recovery, la plantilla per
 * defecte) es reconeix només per a dir-ho clar i netejar-la: MAI s'adopta
 * (ordre del Mestre 261002, data/oauthRelay.js gestionaTornada).
 */

export const TIPUS_RECUPERACIO = 'recovery';
const CLAU_TOKEN = 'token_hash';
const CLAU_TIPUS = 'type';

/* El token_hash de GoTrue és hexadecimal (56 caràcters), amb el prefix pkce_
   si el flux en porta. Un topall generós i res fora d'eixe alfabet: després
   viatja dins d'un cos JSON. */
const FORMA_TOKEN_HASH = /^[A-Za-z0-9_-]{16,256}$/;

/** Per què una tornada de recuperació no es pot usar. */
export const MOTIU_TORNADA = Object.freeze({ IMPLICITA: 'implicita', MALFORMADA: 'malformada' });

const parametresDe = (text) => new URLSearchParams(String(text || '').replace(/^[?#]/, ''));

function llegix(params) {
  if (params.get(CLAU_TIPUS) !== TIPUS_RECUPERACIO) return null;
  const tokenHash = params.get(CLAU_TOKEN);
  if (tokenHash !== null) return FORMA_TOKEN_HASH.test(tokenHash) ? { tokenHash } : { motiu: MOTIU_TORNADA.MALFORMADA };
  if (params.has('access_token') || params.has('refresh_token')) return { motiu: MOTIU_TORNADA.IMPLICITA };
  return null;
}

/**
 * La tornada d'un enllaç de recuperació, si la URL en porta: primer el
 * fragment (la forma recomanada), després la consulta. Pura.
 * @param {unknown} href
 * @returns {{ tokenHash: string } | { motiu: string } | null}
 */
export function llegixTornadaDeRecuperacio(href) {
  let url;
  try { url = new URL(String(href)); } catch { return null; }
  return llegix(parametresDe(url.hash)) || llegix(parametresDe(url.search));
}

/* Decodifica una part de la consulta com la llig URLSearchParams; mal
   codificada, es compara tal qual. */
function decodifica(part) {
  const text = part.replace(/\+/g, ' ');
  try { return decodeURIComponent(text); } catch { return text; }
}

/* La consulta sense token_hash ni type=recovery, la resta literal i sense
   reserialitzar (com senseParametresDeTornada d'oauthRelay.js). Només si hi
   ha token_hash: un `type` de la pàgina amfitriona sense ell no és nostre. */
function consultaSenseRecuperacio(cerca) {
  if (!cerca || cerca === '?' || !parametresDe(cerca).has(CLAU_TOKEN)) return cerca === '?' ? '' : cerca;
  const parells = cerca.slice(1).split('&').filter((parell) => {
    const [clau, ...resta] = parell.split('=');
    const nom = decodifica(clau);
    if (nom === CLAU_TOKEN) return false;
    return !(nom === CLAU_TIPUS && decodifica(resta.join('=')) === TIPUS_RECUPERACIO);
  });
  return parells.length ? `?${parells.join('&')}` : '';
}

/**
 * La ruta de la pàgina (camí + consulta + fragment) sense les restes de la
 * recuperació: token_hash i type=recovery de la consulta, i el fragment
 * sencer si en porta (o si porta la forma implícita). La resta, intacta.
 * Torna null si `href` no és una URL. Pura.
 */
export function rutaSenseRecuperacio(href) {
  let url;
  try { url = new URL(String(href)); } catch { return null; }
  const fragment = parametresDe(url.hash);
  const fragmentNostre = fragment.has(CLAU_TOKEN) || fragment.get(CLAU_TIPUS) === TIPUS_RECUPERACIO;
  return url.pathname + consultaSenseRecuperacio(url.search) + (fragmentNostre ? '' : url.hash);
}

/** Lleva de la barra d'adreces i de l'historial les restes de la recuperació. */
export function netejaTornadaDeRecuperacio() {
  if (typeof window === 'undefined') return;
  const neta = rutaSenseRecuperacio(window.location.href);
  if (neta === null) return;
  const actual = window.location.pathname + window.location.search + window.location.hash;
  if (neta !== actual) window.history.replaceState(window.history.state, '', neta);
}
