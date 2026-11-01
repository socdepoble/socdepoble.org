/**
 * canalsDeBotiga.js · P1-69 (ordre del Mestre, 261028 20:13; decisions de
 * l'onada 2 del Bloc H) · Les ranures de les botigues de /page/descarregues:
 * Google Play, App Store i WordPress.org (el connector de WordPress, que al
 * directori oficial té l'slug «socdepoble»).
 *
 * Són configuració, no promeses: amb `url: null` una ranura no pinta res, ni
 * l'enllaç ni cap «pròximament» que anuncie una botiga que encara no és
 * oberta. La promesa del cos de la pàgina (PAGE_COPY.descarregues: «no
 * enllaça botigues que encara no estan obertes») continua certa: l'única
 * adreça de botiga que porta el text és la d'un canal obert, i les proves
 * d'honestedat de systemPages.test.js ho comproven contra canalsOberts().
 *
 * 01-11-2026 (ordre del Mestre 261101_0311, T1) · WordPress.org és obert: el
 * connector socdepoble 1.1.10 és públic a https://wordpress.org/plugins/socdepoble/
 * (api.wordpress.org i la fitxa responen 200, verificat el 01-11-2026).
 * Google Play i App Store continuen tancats.
 *
 * Obrir un canal és canviar UNA línia d'ací, amb l'adreça pública que done
 * el Mestre; la prova dels canals oberts (canalsDeBotiga.test.js) canvia amb
 * ella. Mai des d'una configuració remota: saltaria les proves. urlDeCanal
 * només admet l'adreça pública de la botiga de cada canal (https, el seu host
 * exacte i la fitxa de Sóc de Poble), mai una de proves internes ni la
 * fitxa d'una altra app o d'un altre connector.
 *
 * Pur i sense imports, com systemPages.js: el pinta InstalaLaPwa.jsx
 * (src/sections/detail), que ja no es munta dins de l'app nativa.
 */

/* L'identificador de l'app d'Android (capacitor.config.json, appId). */
const APP_ANDROID = 'org.socdepoble.app';
/* L'slug del connector al directori de WordPress.org (api.wordpress.org,
   plugins/info 1.2: slug «socdepoble», 01-11-2026). */
const CONNECTOR_WORDPRESS = 'socdepoble';

export const CANALS_DE_BOTIGA = Object.freeze([
  Object.freeze({ id: 'google-play', nom: 'Google Play', url: null }),
  Object.freeze({ id: 'app-store', nom: 'App Store', url: null }),
  Object.freeze({ id: 'wordpress-org', nom: 'WordPress.org', url: 'https://wordpress.org/plugins/socdepoble/' })
]);

/* id del canal → l'única forma d'adreça pública que hi val (URL ja analitzada). */
const FORMES = Object.freeze({
  'google-play': (url) => url.hostname === 'play.google.com' && url.pathname === '/store/apps/details'
    && url.searchParams.get('id') === APP_ANDROID,
  'app-store': (url) => url.hostname === 'apps.apple.com'
    && /^\/(?:[a-z]{2}(?:-[a-z]{2,4})?\/)?app\/(?:[\w%-]+\/)?id\d+\/?$/i.test(url.pathname),
  'wordpress-org': (url) => url.hostname === 'wordpress.org'
    && (url.pathname === `/plugins/${CONNECTOR_WORDPRESS}/` || url.pathname === `/plugins/${CONNECTOR_WORDPRESS}`)
});

/**
 * L'adreça normalitzada d'un canal obert, o null si està tancat (`url` no és
 * un text) o si l'adreça no és la pública de la seua botiga: un altre
 * protocol, credencials o port, un host que no és l'exacte, una fitxa d'una
 * altra app o d'un altre connector, o un enllaç de proves internes. Mai no
 * llança.
 * @param {{ id?: string, url?: unknown }} [canal]
 * @returns {string|null}
 */
export function urlDeCanal(canal) {
  try {
    if (!canal || typeof canal.url !== 'string' || !Object.hasOwn(FORMES, canal.id)) return null;
    const url = new URL(canal.url);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (/internaltest|testflight|testing/i.test(url.href)) return null;
    return FORMES[canal.id](url) ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Els canals oberts, en l'ordre de la llista: { id, nom, url } amb l'adreça
 * ja validada. Hui, només WordPress.org (des del 01-11-2026).
 * @param {ReadonlyArray<{ id: string, nom: string, url: string|null }>} [canals]
 */
export function canalsOberts(canals = CANALS_DE_BOTIGA) {
  if (!Array.isArray(canals)) return [];
  return canals
    .map((canal) => ({ id: canal?.id, nom: canal?.nom, url: urlDeCanal(canal) }))
    .filter((canal) => canal.url && typeof canal.nom === 'string' && canal.nom.trim());
}
