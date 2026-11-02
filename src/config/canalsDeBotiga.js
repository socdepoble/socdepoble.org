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
 *
 * B9 (marató 261101_2143) · urlDeCanal rebutja també ?beta= i /beta, i
 * frasesCaducades guarda que /page/descarregues no parle de proves amb la botiga oberta.
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

/* Una adreça de proves: internaltest, TestFlight, testing o «beta» com a paraula en qualsevol part
   (?beta, &beta=, /beta, #beta, =beta), però no dins d'una altra paraula (/betanzos/). Lineal. */
const ADRECA_DE_PROVES = /internaltest|testflight|testing|\bbeta\b/i;

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
    // B9 · Cap enllaç de proves, tampoc amagat amb %-codis (%62eta); un %-codi mal format llança i el canal queda tancat.
    if (ADRECA_DE_PROVES.test(url.href) || ADRECA_DE_PROVES.test(decodeURIComponent(url.href))) return null;
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

/* B9 · Frases de PAGE_COPY.descarregues (lead, subtitle i html) que només són certes amb la botiga tancada.
   Quan el Mestre òbriga un canal (una línia de CANALS_DE_BOTIGA), canalsDeBotiga.test.js cau
   fins que el text deixe de dir-les (frontissa: --aprova descarregues). */
export const FRASES_DE_BOTIGA_TANCADA = Object.freeze({
  'google-play': Object.freeze([/proves internes/i, /no està publicada per a tothom/i, /equip de proves/i]),
  'app-store': Object.freeze([/TestFlight/i, /encara no és a l[’']App Store/i, /enllaç públic de proves/i, /grup de treball intern/i])
});
/* Per a qualsevol botiga d'apps oberta (Google Play o App Store). */
export const FRASES_DE_PROVES = Object.freeze([/\bbeta\b/i, /\ben proves\b/i, /en quin punt estan les proves/i]);
const BOTIGUES_D_APPS = new Set(['google-play', 'app-store']);

/* Cada «<…>» (fins al primer «>») passa a un espai, com /<[^>]*>/g però lineal: eixa regex
   és quadràtica amb molts «<» sense «>» (40.000 «<», ~5 s). Un «<» sense tancar es queda. */
function senseEtiquetes(text) {
  let pla = '';
  let i = 0;
  for (;;) {
    const obri = text.indexOf('<', i);
    const tanca = obri === -1 ? -1 : text.indexOf('>', obri + 1);
    if (tanca === -1) return pla + text.slice(i);
    pla += `${text.slice(i, obri)} `;
    i = tanca + 1;
  }
}

/* Les entitats que el cos pot portar en lloc del caràcter que es llig: les numèriques (decimals o hex)
   i un joc tancat de noms (apòstrofs, espai dur i lletres de la llengua). La resta es queda com està. */
const ENTITATS = Object.freeze({
  nbsp: ' ', rsquo: '’', lsquo: '‘', apos: "'", amp: '&', middot: '·',
  agrave: 'à', egrave: 'è', eacute: 'é', iacute: 'í', ograve: 'ò', oacute: 'ó', uacute: 'ú', ccedil: 'ç'
});
/* Una sola passada (&amp;rsquo; es llig «&rsquo;») i regex lineal: quantificadors acotats entre «&» i «;». */
const senseEntitats = (text) => text.replace(/&(?:#(\d{1,7})|#x([\da-f]{1,6})|([a-z]{2,8}));/gi, (entitat, dec, hex, nom) => {
  if (nom) return Object.hasOwn(ENTITATS, nom.toLowerCase()) ? ENTITATS[nom.toLowerCase()] : entitat;
  const codi = dec ? Number(dec) : parseInt(hex, 16);
  return codi > 0 && codi <= 0x10ffff ? String.fromCodePoint(codi) : entitat;
});

/* El text pla d'un tros de PAGE_COPY: sense etiquetes, amb les entitats llegides i els espais plegats. Un no-text no diu res. */
const textPla = (text) => (typeof text === 'string' ? senseEntitats(senseEtiquetes(text)).replace(/\s+/g, ' ') : '');

/**
 * [{ id, frase }] de les frases caducades per als canals oberts. `textos`: un
 * text o una llista (lead, subtitle i html). Lleva etiquetes; pura; mai llança.
 * @param {string|ReadonlyArray<string>} textos
 * @param {ReadonlyArray<{ id?: string }>} [oberts]
 * @returns {{ id: string, frase: string }[]}
 */
export function frasesCaducades(textos, oberts = canalsOberts()) {
  const text = (Array.isArray(textos) ? textos : [textos]).map(textPla).join(' ');
  const ids = new Set((Array.isArray(oberts) ? oberts : []).map((canal) => canal?.id));
  const trobades = [];
  for (const [id, frases] of Object.entries(FRASES_DE_BOTIGA_TANCADA)) {
    if (!ids.has(id)) continue;
    for (const frase of frases) if (frase.test(text)) trobades.push({ id, frase: frase.source });
  }
  const appsObertes = [...ids].filter((id) => BOTIGUES_D_APPS.has(id));
  if (appsObertes.length) {
    for (const frase of FRASES_DE_PROVES) if (frase.test(text)) trobades.push({ id: appsObertes.join('+'), frase: frase.source });
  }
  return trobades;
}
