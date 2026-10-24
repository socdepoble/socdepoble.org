/**
 * gestor.js · T5 (P1-07, 261024) · El servei de notícies del poble (contracte
 * sdp.noticies.v1): llig els feeds RSS i Atom perquè el navegador del veí no
 * toque mai l'origen d'una font (la regla de src/apps/lector/fontNoticies.js).
 *
 * PUR i provable: cap global de Deno, cap variable d'entorn, cap secret. El
 * fetch, el rellotge, el catàleg, el resoledor de noms i els interruptors
 * s'injecten; index.ts només l'embolcalla amb Deno.serve. Les proves són
 * gestor.test.js (Vitest, entorn node).
 *
 *   GET <base>/fonts            → 200 { categories, fonts, personals } (sense les adreces dels feeds)
 *   GET <base>/feed?font=<id>   → 200 { font, xml, obtingut, obsoleta }
 *   GET <base>/feed?url=<https> → 200 { url, xml, obtingut, obsoleta }   (fonts personals, T5b)
 *   GET <base>/imatge?u=<https> → 200 els bytes d'una imatge d'un host aprovat (el catàleg i els
 *                                 seus CDN) o, amb l'interruptor, d'una que ha eixit en un feed
 *                                 (261024 Lector; R6)
 *   error                       → { code: 'sdp_noticies_<codi>', message, data: { status } },
 *                                 la forma de WP REST (com el Traductor Sobirà)
 *
 * LES REGLES (totes les maneres)
 *   · A l'origen: GET amb l'agent honest AGENT_USUARI i el Accept del que es
 *     demana, cap galeta ni cap capçalera de qui demana; 6 s com a molt per a
 *     tot l'intercanvi (abans dels 8 s del client); com a molt 2 redireccions,
 *     manuals; i una mida fitada (2 MiB un feed del sistema, 512 KiB un de
 *     personal, 1 MiB una imatge).
 *   · El text es passa a UTF-8 (el BOM primer; si no, la capçalera; si no, el
 *     pròleg XML; també ISO-8859-1 i windows-1252), el pròleg ho torna a dir, i
 *     l'arrel ha de ser <rss>, <feed> o <rdf:RDF>. Cap declaració d'entitats
 *     (<!ENTITY): el lector del navegador no n'ha de veure cap. Ningú no rep res
 *     que no siga un feed.
 *   · Memòria cau en memòria de la instància: fresc 15 min; si l'origen falla,
 *     el de fins a 24 h, amb `obsoleta: true`. Dues peticions iguals alhora
 *     d'una font del sistema comparteixen una sola baixada.
 *   · CORS obert (Access-Control-Allow-Origin: *) i sense credencials: és un
 *     servei públic, de només lectura, sense galetes ni sessió.
 *   · Un límit per connexió (LIMIT, LIMIT_PERSONALS, LIMIT_IMATGES). La
 *     connexió és cf-connecting-ip; si no, l'ÚLTIM salt de x-forwarded-for (el
 *     que posa el proxy de la plataforma, no el que diu el navegador); si no,
 *     l'adreça remota; una IPv6 compta per la seua /64 (i, amb la taula mig
 *     plena, per la seua /48: R6 L-05). No se'n guarda l'adreça: només una
 *     empremta HMAC-SHA-256 amb una clau aleatòria de cada instància, que naix i
 *     mor amb ella. Les finestres vençudes s'esborren a cada petició; si la
 *     taula és plena, una connexió nova fa lloc traient la finestra viva menys
 *     gastada (mai una que ja és al límit), i només espera (429) si totes ho
 *     són. El gestor no escriu mai a la consola. (La plataforma sí que pot
 *     registrar la petició: README.)
 *
 * LES FONTS DEL SISTEMA (?font=<id>)
 *   · L'únic que entra és l'id d'una font de la llista blanca (fonts.json): cap
 *     adreça de la consulta. Les redireccions, només dins del mateix host, en
 *     https i sense port (T1 261024_1800, Codex C6-03). Cache-Control: public,
 *     max-age=300.
 *   · T1 (261024_1800, P1-07; Codex C6-02) · fonts.json no pot afegir cap host:
 *     el feed i el lloc de cada font han de ser d'HOSTS_DEL_SISTEMA, la llista
 *     blanca nativa (noms exactes, cap subdomini per extensió), en https net i
 *     sense port; si no, el gestor no es crea (validaCataleg).
 *   · I un nom aprovat no acredita la IP: amb resoledor, cada salt dels hosts
 *     aprovats (el catàleg i CDN_IMATGES) també es resol, i una sola resposta
 *     no pública el veta (adreca_vetada, sense baixar res), encara que l'altra
 *     família (A o AAAA) falle; si una família falla, o sense cap adreça,
 *     tampoc no passa (origen_caigut). Només sense resoledor a l'entorn un host aprovat val
 *     sense resoldre (la llista blanca nativa; decisió del Mestre, README); un
 *     de fora, mai.
 *
 * LES FONTS PERSONALS (?url=<adreça>) · T5b, i D-08 de Codex (261024)
 *   Una adreça qualsevol és un risc de SSRF (fer que el servei demane una cosa
 *   de la seua xarxa interna), i per això:
 *   · APAGADES per defecte: només amb `personals: true` (index.ts:
 *     SDP_NOTICIES_PERSONALS === '1'); apagat, `url` és un paràmetre que el
 *     servei no admet (peticio). I enceses, si l'entorn no té resoledor de noms
 *     (`resolDns` null), es tanquen: 503 personals_sense_dns, mai «sense
 *     resoledor, és pública»; /fonts diu llavors personals: false;
 *   · l'adreça (adrecaPersonal): https; port buit (443); cap usuari ni
 *     contrasenya; com a molt MAXIM_URL_PERSONAL caràcters; un nom DNS amb un
 *     punt com a mínim, mai una IP literal (cap forma: el parser WHATWG ja
 *     convertix 2130706433, 0x7f000001 o 0177.1 en quatre xifres, que no
 *     passen, i [::1] porta claudàtors); cap nom local (localhost i *.localhost,
 *     *.local, *.internal, *.arpa amb home.arpa, *.localdomain…), cap host del
 *     mateix projecte (`hostsVetats`, i el de la petició mateixa);
 *   · el nom es resol (`resolDns`) i cap resposta pot ser privada, de bucle,
 *     d'enllaç local (169.254/16, amb 169.254.169.254), CGNAT (100.64/10), ULA
 *     (fc00::/7), fe80::/10, ::1, 0.0.0.0/8, multidifusió, reservada, de
 *     documentació, de traducció (64:ff9b:1::/48, ::ffff:0:0:0/96) o de
 *     protocol (2001::/23) (esIpNoPublica); si el resoledor falla, no es baixa
 *     res. Risc residual (README): entre la comprovació i la baixada el nom pot
 *     canviar de resposta (DNS rebinding); el tanca un egrés aïllat de la
 *     plataforma, que és del Mestre, abans d'encendre-les;
 *   · cada redirecció (manual, com a molt 2) torna a passar les mateixes regles,
 *     resolució inclosa;
 *   · un límit per connexió més estricte (LIMIT_PERSONALS), a banda del
 *     general; com a molt MAXIM_PERSONALS_EN_VOL baixades personals alhora en
 *     tota la instància i MAXIM_PERSONALS_PER_QUI per connexió (si no, 429
 *     ocupat amb Retry-After); 512 KiB com a molt;
 *   · memòria cau per connexió i adreça normalitzada (sense fragment): una
 *     altra connexió no rep mai la còpia d'una altra, ni sap si algú l'ha
 *     demanada (`obtingut` és l'hora de la petició). Fitada en entrades
 *     (MAXIM_CAU_PERSONALS) i en caràcters (MAXIM_CARACTERS_CAU_PERSONALS);
 *   · Cache-Control: private, max-age=300; l'adreça no torna mai en un error.
 *
 * LES IMATGES (?u=<adreça>) · 261024 Lector, i R6 (Lector final)
 *   · D'un host del catàleg o d'un dels seus CDN (CDN_IMATGES, les miniatures
 *     de YouTube), qualsevol imatge, encara que la instància no l'haja vista
 *     (L-08: una notícia desada conserva la miniatura quan la instància es
 *     recicla). Els aprova el Mestre; amb resoledor, igualment es resolen, i
 *     una resposta no pública o cap adreça els veta (T1 261024_1800, Codex
 *     C6-02).
 *   · D'un altre host, APAGADES per defecte (L-12: el DNS rebinding de les
 *     personals hi valdria igual): 403 imatge_de_fora, sense resoldre ni baixar
 *     res; només amb `imatgesExternes: true` (index.ts:
 *     SDP_NOTICIES_IMATGES_EXTERNES === '1'). Enceses, només una imatge que ha
 *     eixit les últimes 24 h en un feed del sistema que ESTA instància ha
 *     baixat, o en una font personal d'ESTA connexió (L-11: ningú no pot saber
 *     si una altra l'ha llegida), mai una adreça qualsevol
 *     (imatge_desconeguda); el nom es resol (sense resoledor, 503
 *     imatge_sense_dns). Les adreces es trien i es resolen com al nucli del
 *     Lector (imatgesDelFeed; L-09).
 *   · Les mateixes regles del nom que les personals, cada redirecció inclosa
 *     (una cap a un host de fora, amb l'interruptor apagat, és imatge_de_fora).
 *     El tipus ha de ser image/(jpeg|png|webp|gif|avif) i els bytes ho han de
 *     dir (la signatura); 1 MiB; 6 s; Cache-Control: public, max-age=86400.
 *   · Com a molt MAXIM_IMATGES_EN_VOL baixades alhora; la resta espera el seu
 *     torn en una cua (L-02: com a molt MAXIM_IMATGES_EN_CUA, i 6 s); només si
 *     la cua és plena o el torn no arriba, 429 ocupat. Una memòria menuda dels
 *     bytes (MAXIM_IMATGES_CAU, MAXIM_BYTES_CAU_IMATGES, 15 min), compartida
 *     només per a les imatges dels feeds del sistema; la resta, per connexió.
 *
 * ELS CODIS (el client els llig per l'estat HTTP: src/data/adaptadors/noticies/client.js)
 *   ruta 404 · metode 405 · peticio 400 · font_desconeguda 404 · limit 429 · ocupat 429
 *   adreca_vetada 422 · origen_temps 504 · origen_buit 504 (un 304 sense haver-lo
 *   demanat: 'temps' al Lector, mai 'font') · origen_caigut 502 · origen_format 502
 *   origen_mida 502 · personals_sense_dns 503 · imatge_desconeguda 404
 *   imatge_sense_dns 503 · imatge_de_fora 403 · intern 500
 */

export const AGENT_USUARI = 'SocDePoble/1.0 (+https://socdepoble.org/projecte)';
export const ACCEPTA = 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8';
export const ACCEPTA_IMATGE = 'image/avif, image/webp, image/png, image/jpeg, image/gif;q=0.9';
export const TEMPS_ORIGEN_MS = 6000;
export const MAXIM_BYTES = 2 * 1024 * 1024;
export const MAXIM_BYTES_PERSONAL = 512 * 1024;
export const MAXIM_BYTES_IMATGE = 1024 * 1024;
export const MAXIM_REDIRECCIONS = 2;
export const FRESC_MS = 15 * 60 * 1000;
export const OBSOLET_MS = 24 * 60 * 60 * 1000;
export const VIDA_IMATGES_MS = 24 * 60 * 60 * 1000;
export const MAX_AGE_S = 300;
export const MAX_AGE_IMATGE_S = 86400;
/* Generós a posta: darrere d'una sola IP hi pot haver un poble sencer (CGNAT, la wifi de
   l'ajuntament). L'origen ja el protegix la memòria cau (una baixada per font cada 15 min). */
export const LIMIT = Object.freeze({ peticions: 120, finestraMs: 10 * 60 * 1000 });
/* T5b · Les fonts personals: més estricte (cada adreça nova és una baixada de fora). */
export const LIMIT_PERSONALS = Object.freeze({ peticions: 60, finestraMs: 10 * 60 * 1000 });
/* Les imatges: una pàgina de notícies en porta moltes, i el navegador les guarda un dia. */
export const LIMIT_IMATGES = Object.freeze({ peticions: 600, finestraMs: 10 * 60 * 1000 });
export const MAXIM_URL_PERSONAL = 2048;
export const MAXIM_CAU_PERSONALS = 64;
export const MAXIM_CARACTERS_CAU_PERSONALS = 16 * 1024 * 1024;
export const MAXIM_EMPREMTES = 5000;
export const MAXIM_PERSONALS_EN_VOL = 4;
export const MAXIM_PERSONALS_PER_QUI = 1;
export const MAXIM_IMATGES_EN_VOL = 8;
/* R6 L-02 (Lector final) · Una imatge que no troba lloc entre les MAXIM_IMATGES_EN_VOL espera el
   seu torn (com a molt ESPERA_TORN_IMATGE_MS) en una cua de MAXIM_IMATGES_EN_CUA; només si la cua
   és plena, o el torn no arriba a temps, és 'ocupat' (una sobrecàrrega de veres). */
export const MAXIM_IMATGES_EN_CUA = 64;
export const ESPERA_TORN_IMATGE_MS = TEMPS_ORIGEN_MS;
/* I una memòria menuda dels bytes (fitada en entrades i en bytes): una imatge repetida no torna a l'origen. */
export const MAXIM_IMATGES_CAU = 64;
export const MAXIM_BYTES_CAU_IMATGES = 8 * 1024 * 1024;
export const FRESC_IMATGE_MS = FRESC_MS;
export const MAXIM_IMATGES_RECORDADES = 10000;
/* R6 L-11 · Les imatges d'una font personal es recorden per connexió (empremta i adreça). */
export const MAXIM_IMATGES_PERSONALS_RECORDADES = 2000;
export const MAXIM_IMATGES_PER_FEED = 500;
/**
 * R6 L-08 i L-12 (Lector final) · Els CDN d'imatges de les fonts del catàleg: els hosts on les dues
 * fonts de vídeo (www.youtube.com) posen les miniatures, comprovats el 261024 amb un GET dels feeds
 * (i1–i4.ytimg.com; i.ytimg.com, el seu nom canònic). Com dels hosts del catàleg, se'n servix
 * qualsevol imatge (no cal haver-la vista en un feed), i amb resoledor el nom es resol igual (T1
 * 261024_1800: una resposta no pública, o cap adreça, el veta). Aprovar-los és del Mestre, un per un, com els
 * hosts de fonts.json (gestor.test.js en porta la instantània).
 */
export const CDN_IMATGES = Object.freeze(['i.ytimg.com', 'i1.ytimg.com', 'i2.ytimg.com', 'i3.ytimg.com', 'i4.ytimg.com']);
/**
 * T1 (261024_1800, P1-07; Codex C6-02) · La llista blanca NATIVA: els únics hosts on poden viure
 * el feed i el lloc d'una font del catàleg, els dels sis referents del §23 que el Mestre ha aprovat
 * un per un (261024; les dues fonts de vídeo comparteixen www.youtube.com). Noms exactes: cap
 * subdomini per extensió, i cap host sense feed (youtu.be només porta a vídeos, mai a un feed).
 * Ha de dir el mateix que HOSTS_DEL_CATALEG de src/data/adaptadors/noticies/cataleg.test.js, i
 * aprovar-ne un de nou és del Mestre (gestor.test.js en porta la instantània).
 */
export const HOSTS_DEL_SISTEMA = Object.freeze(['ayudawp.com', 'emowe.com', 'iaenaccion.com', 'www.jonhernandez.education', 'www.youtube.com']);
/* Els segons que diu Retry-After quan el servei ja està ocupat (ocupat). */
export const ESPERA_OCUPAT_S = 2;
export const TIPUS_IMATGE = Object.freeze(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const PATRO_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;
/* Una etiqueta DNS: lletres, xifres i guionets, sense guionet als extrems (punycode inclòs). */
const ETIQUETA_DNS = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
/* Els noms que no són de la xarxa pública (l'últim tram, o el nom sencer). */
const NOMS_LOCALS = Object.freeze(['localhost', 'local', 'internal', 'arpa', 'localdomain', 'lan', 'home', 'corp', 'intranet', 'test', 'invalid']);
const ESTENSIO_IMATGE = /\.(?:jpe?g|png|gif|webp|avif)(?:[?#]|$)/i;

export const ERRORS = Object.freeze({
  ruta: Object.freeze([404, 'Esta adreça no és del servei de notícies.']),
  metode: Object.freeze([405, 'El servei de notícies només respon a GET.']),
  peticio: Object.freeze([400, 'La petició porta paràmetres que el servei no admet.']),
  font_desconeguda: Object.freeze([404, 'El servei no coneix esta font.']),
  limit: Object.freeze([429, 'Massa peticions seguides. Torna-ho a provar d’ací a uns minuts.']),
  ocupat: Object.freeze([429, 'El servei ja està llegint prou coses alhora. Torna-ho a provar d’ací a un moment.']),
  adreca_vetada: Object.freeze([422, 'El servei només llig fonts de webs públiques en https.']),
  personals_sense_dns: Object.freeze([503, 'El servei no pot comprovar les adreces de les fonts personals.']),
  imatge_desconeguda: Object.freeze([404, 'El servei no ha vist esta imatge en cap feed recent.']),
  imatge_sense_dns: Object.freeze([503, 'El servei no pot comprovar d’on ve esta imatge.']),
  imatge_de_fora: Object.freeze([403, 'El servei només servix imatges de les webs del catàleg de fonts.']),
  origen_temps: Object.freeze([504, 'La font ha tardat massa a contestar.']),
  /* R6 L-06 · Un 304 a una petició sense condicions: la memòria cau de la web de la font no dona el
     feed. No és que la font envie una cosa que no es llig (502 'font' al Lector): és un 504, 'temps'. */
  origen_buit: Object.freeze([504, 'La web de la font ha respost sense el feed (una còpia buida de la seua memòria cau).']),
  origen_caigut: Object.freeze([502, 'La font no ha contestat bé.']),
  origen_format: Object.freeze([502, 'La font no ha enviat el que s’esperava.']),
  origen_mida: Object.freeze([502, 'La font ha enviat una cosa massa gran.']),
  intern: Object.freeze([500, 'El servei de notícies ha tingut un error.'])
});

const CORS = Object.freeze({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'Retry-After' });

/* Les etiquetes de charset que s'accepten, cap a la del descodificador (WHATWG: «iso-8859-1» i
   «us-ascii» ja són windows-1252). Una altra, o cap, és UTF-8. */
const DESCODIFICADORS = Object.freeze({
  'utf-8': 'utf-8', utf8: 'utf-8', 'unicode-1-1-utf-8': 'utf-8',
  'iso-8859-1': 'windows-1252', 'iso8859-1': 'windows-1252', 'iso_8859-1': 'windows-1252', latin1: 'windows-1252', l1: 'windows-1252',
  'us-ascii': 'windows-1252', ascii: 'windows-1252', 'windows-1252': 'windows-1252', cp1252: 'windows-1252',
  'iso-8859-15': 'iso-8859-15', latin9: 'iso-8859-15', 'utf-16': 'utf-16le', 'utf-16le': 'utf-16le', 'utf-16be': 'utf-16be'
});

/* T1 (261024_1800) · Una adreça del catàleg (el feed o el lloc d'una font): https net, sense port,
   d'un host d'HOSTS_DEL_SISTEMA; o null. */
function adrecaDelSistema(text) {
  let adreca;
  try {
    adreca = new URL(text);
  } catch {
    return null;
  }
  if (adreca.protocol !== 'https:' || adreca.username || adreca.password || adreca.hash || adreca.port !== '') return null;
  return esNomPublic(adreca.hostname) && HOSTS_DEL_SISTEMA.includes(adreca.hostname) ? adreca : null;
}

/** Valida i congela el catàleg (fonts.json): { categories, fonts: [{ id, nom, categoriaId, descripcio, lloc, feed, llengua }] }. */
export function validaCataleg(cataleg) {
  const fonts = Array.isArray(cataleg?.fonts) ? cataleg.fonts : null;
  const categories = Array.isArray(cataleg?.categories) ? cataleg.categories : null;
  if (!fonts || !categories) throw new TypeError('noticies: el catàleg necessita categories i fonts');
  const vistos = new Set();
  for (const font of fonts) {
    if (!PATRO_ID.test(font?.id ?? '') || vistos.has(font.id)) throw new TypeError(`noticies: id de font invàlid o repetit: ${font?.id}`);
    vistos.add(font.id);
    const feed = adrecaDelSistema(font.feed);
    if (!feed) throw new TypeError(`noticies: el feed de ${font.id} ha de ser https net, sense port, d'un host de HOSTS_DEL_SISTEMA`);
    /* El lloc fa de base de les imatges del feed i el Lector l'enllaça: del mateix host que el feed. */
    if (adrecaDelSistema(font.lloc)?.hostname !== feed.hostname) {
      throw new TypeError(`noticies: el lloc de ${font.id} ha de ser https net, sense port, del host del seu feed`);
    }
  }
  return Object.freeze({
    categories: Object.freeze(categories.map((categoria) => Object.freeze({ ...categoria }))),
    fonts: Object.freeze(fonts.map((font) => Object.freeze({ ...font })))
  });
}

/* ── Les adreces de fora (fonts personals i imatges) ──────────────────────── */

/** Si un nom (ja passat pel parser WHATWG: minúscules, punycode) és un nom DNS públic. */
export function esNomPublic(host) {
  if (typeof host !== 'string' || host.length === 0 || host.length > 253 || host.endsWith('.')) return false;
  const trams = host.split('.');
  if (trams.length < 2 || !trams.every((tram) => ETIQUETA_DNS.test(tram))) return false;
  /* Un últim tram de xifres és una IPv4 (el parser ja ha normalitzat totes les seues formes). */
  if (/^\d+$/.test(trams[trams.length - 1])) return false;
  return !NOMS_LOCALS.includes(trams[trams.length - 1]) && !NOMS_LOCALS.includes(host);
}

/**
 * Una adreça de fora (una font personal o una imatge), normalitzada i sense fragment (un URL),
 * o null si no passa les regles: https, port buit, sense credencials, un nom públic que no és
 * cap dels `vetats` i com a molt MAXIM_URL_PERSONAL caràcters.
 */
export function adrecaPersonal(cru, vetats = []) {
  if (typeof cru !== 'string' || cru.length === 0 || cru.length > MAXIM_URL_PERSONAL) return null;
  let url;
  try {
    url = new URL(cru);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port !== '') return null;
  if (!esNomPublic(url.hostname) || vetats.includes(url.hostname)) return null;
  url.hash = '';
  return url.href.length > MAXIM_URL_PERSONAL ? null : url;
}

/* Els quatre octets d'una IPv4 en text, o null. */
function octetsDe(text) {
  const trams = String(text).split('.');
  if (trams.length !== 4 || !trams.every((tram) => /^\d{1,3}$/.test(tram))) return null;
  const octets = trams.map(Number);
  return octets.every((octet) => octet <= 255) ? octets : null;
}

function ipv4NoPublica([a, b, c]) {
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 192 && b === 0 && (c === 0 || c === 2))
    || (a === 192 && b === 88 && c === 99)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113);
}

/* Els huit grups de 16 bits d'una IPv6 en text (amb «::» i una IPv4 al final), o null. */
function grupsDe(text) {
  let resta = String(text).toLowerCase().replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  const final = /(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(resta);
  const cua = [];
  if (final) {
    const octets = octetsDe(final[1]);
    if (!octets) return null;
    cua.push((octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]);
    /* Fora la IPv4: queda «…::» (es manté) o «…:» (el separador se'n va). */
    resta = resta.slice(0, resta.length - final[1].length);
    if (resta.endsWith(':') && !resta.endsWith('::')) resta = resta.slice(0, -1);
  }
  const parts = resta.split('::');
  if (parts.length > 2) return null;
  const llegix = (tros) => (tros === '' ? [] : tros.split(':'));
  const davant = llegix(parts[0]);
  const darrere = parts.length === 2 ? llegix(parts[1]) : [];
  if (![...davant, ...darrere].every((grup) => /^[0-9a-f]{1,4}$/.test(grup))) return null;
  const falten = 8 - cua.length - davant.length - darrere.length;
  if (parts.length === 1 ? falten !== 0 : falten < 1) return null;
  return [...davant, ...Array(parts.length === 2 ? falten : 0).fill('0'), ...darrere].map((grup) => parseInt(grup, 16)).concat(cua);
}

/** Si una IP en text (IPv4 o IPv6) NO és de la xarxa pública; una que no s'entén, tampoc no ho és. */
export function esIpNoPublica(text) {
  const octets = octetsDe(text);
  if (octets) return ipv4NoPublica(octets);
  const g = grupsDe(text);
  if (!g) return true;
  const v4 = (alt, baix) => ipv4NoPublica([alt >> 8, alt & 0xff, baix >> 8, baix & 0xff]);
  const zeros = (fins) => g.slice(0, fins).every((grup) => grup === 0);
  if (zeros(8)) return true;
  if (zeros(7) && g[7] === 1) return true;
  if (zeros(5) && g[5] === 0xffff) return v4(g[6], g[7]);
  /* SIIT, ::ffff:0:0:0/96 (RFC 2765): una adreça traduïda, mai una de pública. */
  if (zeros(4) && g[4] === 0xffff && g[5] === 0) return true;
  if (zeros(6)) return v4(g[6], g[7]);
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((grup) => grup === 0)) return v4(g[6], g[7]);
  /* NAT64 d'ús local, 64:ff9b:1::/48 (RFC 8215): una xarxa de traducció pròpia. */
  if (g[0] === 0x64 && g[1] === 0xff9b && g[2] === 1) return true;
  if (g[0] === 0x2002) return v4(g[1], g[2]);
  if ((g[0] & 0xfe00) === 0xfc00) return true;
  if ((g[0] & 0xffc0) === 0xfe80 || (g[0] & 0xffc0) === 0xfec0) return true;
  if ((g[0] & 0xff00) === 0xff00) return true;
  /* 2001::/23, les assignacions de protocol de l'IETF (Teredo, 2001::/32, hi és dins), i la
     documentació: 2001:db8::/32 i 3fff::/20 (RFC 9637). */
  if (g[0] === 0x2001 && (g[1] < 0x0200 || g[1] === 0x0db8)) return true;
  if (g[0] === 0x3fff && g[1] < 0x1000) return true;
  return g[0] === 0x0100 && g[1] === 0 && g[2] === 0 && g[3] === 0;
}

/* ── Qui demana (el límit) ────────────────────────────────────────────────── */

/**
 * La clau de xarxa d'una IP en text, per al límit: «4:a.b.c.d» per a una IPv4 (també una IPv6
 * que en porta una, ::ffff:a.b.c.d), «6:<els primers quatre grups>» per a una IPv6 (la seua /64:
 * una casa en té milions), o null si no és cap IP.
 */
export function clauDeXarxa(text) {
  if (typeof text !== 'string') return null;
  const net = text.trim().replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  if (!net || net.length > 64) return null;
  const octets = octetsDe(net);
  if (octets) return `4:${octets.join('.')}`;
  if (!net.includes(':')) return null;
  const g = grupsDe(net);
  if (!g) return null;
  if (g.slice(0, 5).every((grup) => grup === 0) && g[5] === 0xffff) return `4:${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`;
  return `6:${g.slice(0, 4).map((grup) => grup.toString(16)).join(':')}`;
}

/**
 * R6 L-05 (Lector final) · La clau de xarxa SOTA PRESSIÓ (la taula del límit mig plena): una IPv6
 * compta per la seua /48 («6/48:<els primers tres grups>»), la xarxa d'un lloc sencer, perquè qui en
 * té una no ompliga la taula amb milers de /64 distintes. Una IPv4, o una clau que no és d'IPv6,
 * no canvia.
 */
export function clauAmple(clau) {
  if (typeof clau !== 'string' || !clau.startsWith('6:')) return clau;
  return `6/48:${clau.slice(2).split(':').slice(0, 3).join(':')}`;
}

/**
 * Qui demana, per al límit i prou: cf-connecting-ip (el posa la vora de la plataforma); si no,
 * l'ÚLTIM salt de x-forwarded-for (el del proxy més pròxim; els d'abans els pot escriure el
 * navegador); si no, l'adreça remota. Una que no és una IP no compta i es passa a la següent.
 */
export function clauDeQui(peticio, info) {
  const capcaleres = peticio.headers;
  const directa = clauDeXarxa(capcaleres.get('cf-connecting-ip'));
  if (directa) return directa;
  const salts = (capcaleres.get('x-forwarded-for') || '').split(',');
  return clauDeXarxa(salts[salts.length - 1]) || clauDeXarxa(info?.remoteAddr?.hostname) || 'desconeguda';
}

/**
 * L'empremta d'una clau de xarxa: HMAC-SHA-256 amb una clau aleatòria de 32 bytes que naix amb la
 * instància i no ix mai d'ella (no es pot exportar). Sense la clau, l'empremta no torna a la IP;
 * dues instàncies no en fan la mateixa. Torna `empremta(text) → Promise<hex de 32>`.
 */
export function creaEmpremtador({ subtle = globalThis.crypto?.subtle, aleatori = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n)) } = {}) {
  let clau = null;
  const codificador = new TextEncoder();
  return async function empremta(text) {
    if (!clau) {
      clau = subtle.importKey('raw', aleatori(32), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      clau.catch(() => { clau = null; });
    }
    const signatura = new Uint8Array(await subtle.sign('HMAC', await clau, codificador.encode(text)));
    return Array.from(signatura.subarray(0, 16), (byte) => byte.toString(16).padStart(2, '0')).join('');
  };
}

const segonsFins = (fi, moment) => Math.max(1, Math.ceil((fi - moment) / 1000));

/**
 * Un límit per empremta, amb finestres fixes. `espera(clau, moment)` torna 0 si pot passar, o els
 * segons d'espera. Les finestres vençudes s'esborren a cada crida (i amb `escombra`). R6 L-05
 * (Lector final): si la taula ja té `maxim` finestres vives, una clau nova NO espera sense més
 * (seria un bloqueig barat per a tothom: n'hi hauria prou d'omplir la taula): primer es fa lloc
 * traient la finestra viva MENYS GASTADA (la més vella dels empats), que mai és una que ja ha
 * arribat al límit (així ningú no buida el límit d'una connexió tallada omplint la taula). Només
 * si totes les vives ja són al límit (una sobrecàrrega de veres), la clau nova espera fins que
 * vença la més vella. `pressio()`: si la taula és mig plena (el gestor hi agrega les IPv6 per /48).
 */
export function creaLimit({ peticions, finestraMs }, maxim = MAXIM_EMPREMTES) {
  /* Per ordre d'inici: les finestres noves van al final, i les vençudes són les primeres. */
  const finestres = new Map();
  function escombra(moment) {
    for (const [clau, finestra] of finestres) {
      if (moment - finestra.inici < finestraMs) break;
      finestres.delete(clau);
    }
  }
  function espera(clau, moment) {
    escombra(moment);
    const finestra = finestres.get(clau);
    if (finestra) {
      finestra.n += 1;
      return finestra.n > peticions ? segonsFins(finestra.inici + finestraMs, moment) : 0;
    }
    if (finestres.size >= maxim && !fesLloc()) return segonsFins(finestres.values().next().value.inici + finestraMs, moment);
    finestres.set(clau, { inici: moment, n: 1 });
    return 0;
  }
  /* Trau la finestra viva menys gastada que encara no és al límit; fals si no n'hi ha cap. Una
     d'una sola petició ja és la mínima: la cerca s'atura ací (la inundació en fa moltes). */
  function fesLloc() {
    let triada = null;
    let minim = Infinity;
    for (const [clau, finestra] of finestres) {
      if (finestra.n < minim) {
        triada = clau;
        minim = finestra.n;
        if (minim <= 1) break;
      }
    }
    if (triada === null || minim >= peticions) return false;
    finestres.delete(triada);
    return true;
  }
  return Object.freeze({ espera, escombra, mida: () => finestres.size, pressio: () => finestres.size * 2 >= maxim });
}

/* ── Les respostes ────────────────────────────────────────────────────────── */

const json = (status, cos, extra = {}) => new Response(JSON.stringify(cos), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ...CORS, ...extra }
});

/** Una resposta d'error amb la forma de WP REST. */
export function respostaDError(codi, extra = {}) {
  const [status, message] = ERRORS[codi] || ERRORS.origen_caigut;
  return json(status, { code: `sdp_noticies_${codi}`, message, data: { status } }, { 'Cache-Control': 'no-store', ...extra });
}

const ocupat = () => respostaDError('ocupat', { 'Retry-After': String(ESPERA_OCUPAT_S) });

/* Llig un cos sencer, com a molt `maxim` bytes; null si en porta més. */
async function llegixFitat(resposta, maxim) {
  if (!resposta.body?.getReader) {
    const tot = new Uint8Array(await resposta.arrayBuffer());
    return tot.byteLength > maxim ? null : tot;
  }
  const lector = resposta.body.getReader();
  const trossos = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxim) {
        await lector.cancel().catch(() => {});
        return null;
      }
      trossos.push(value);
    }
  } finally {
    lector.releaseLock();
  }
  const tot = new Uint8Array(total);
  let posicio = 0;
  for (const tros of trossos) {
    tot.set(tros, posicio);
    posicio += tros.byteLength;
  }
  return tot;
}

const descarta = async (resposta) => {
  try { await resposta.body?.cancel?.(); } catch { /* el cos ja no interessa */ }
};

/* ── El text dels feeds ───────────────────────────────────────────────────── */

/* La codificació: la del BOM (és el que porten els bytes de veres, i mana sobre la capçalera,
   com al WHATWG); si no, la de la capçalera; si no, la del pròleg XML; si no, UTF-8. */
function codificacioDe(bytes, tipus) {
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return 'utf-8';
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'utf-16le';
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'utf-16be';
  const delTipus = /;\s*charset\s*=\s*"?([\w.:-]+)"?/i.exec(tipus || '')?.[1];
  if (delTipus) return DESCODIFICADORS[delTipus.toLowerCase()] || 'utf-8';
  const cap = descodificaCp1252(bytes.subarray(0, 256));
  const delProleg = /^\s*<\?xml[^>]*?\bencoding\s*=\s*["']([\w.:-]+)["']/i.exec(cap)?.[1];
  return (delProleg && DESCODIFICADORS[delProleg.toLowerCase()]) || 'utf-8';
}

/* windows-1252 a mà, amb la taula de WHATWG per a 0x80–0x9F: no tots els entorns la
   descodifiquen igual (alguns Node la llegixen com a latin1 i «’» es perdria com a U+0092). */
const CP1252_80_9F = [
  0x20AC, 0x81, 0x201A, 0x192, 0x201E, 0x2026, 0x2020, 0x2021, 0x2C6, 0x2030, 0x160, 0x2039, 0x152, 0x8D, 0x17D, 0x8F,
  0x90, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x2DC, 0x2122, 0x161, 0x203A, 0x153, 0x9D, 0x17E, 0x178
];
function descodificaCp1252(bytes) {
  let text = '';
  for (let inici = 0; inici < bytes.length; inici += 8192) {
    const tros = Array.from(bytes.subarray(inici, inici + 8192), (b) => (b >= 0x80 && b <= 0x9F ? CP1252_80_9F[b - 0x80] : b));
    text += String.fromCharCode(...tros);
  }
  return text;
}

/** El text UTF-8 d'un feed: descodificat, sense BOM i amb el pròleg que ho diu. */
export function descodificaFeed(bytes, tipus = '') {
  const codificacio = codificacioDe(bytes, tipus);
  const cru = codificacio === 'windows-1252' ? descodificaCp1252(bytes) : new TextDecoder(codificacio).decode(bytes);
  const text = cru.replace(/^\uFEFF/, '');
  return text.replace(/^(\s*<\?xml[^>]*?\bencoding\s*=\s*)(["'])[\w.:-]+\2/i, '$1$2UTF-8$2');
}

/** Si el text és un feed: l'arrel, després del pròleg, els comentaris i el DOCTYPE, és rss, feed o RDF. */
export function esFeed(text) {
  if (typeof text !== 'string' || /<!ENTITY/i.test(text)) return false;
  const salta = /^\s*(?:<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>[]*(?:\[[^\]]*\])?\s*>)/i;
  let resta = text.slice(0, 65536);
  for (let i = 0; i < 32; i += 1) {
    const salt = salta.exec(resta);
    if (!salt) break;
    resta = resta.slice(salt[0].length);
  }
  return /^\s*<(?:[A-Za-z_][\w.-]*:)?(?:rss|feed|RDF)[\s/>]/.test(resta);
}

/* ── Les imatges d'un feed ────────────────────────────────────────────────── */

const ENTITATS = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" });

/* Les entitats d'XML (i les numèriques) d'un text, una vegada. */
function desentitza(text) {
  return String(text).replace(/&(#[xX][0-9a-fA-F]{1,6}|#\d{1,7}|amp|lt|gt|quot|apos);/g, (tot, nom) => {
    if (nom[0] !== '#') return ENTITATS[nom];
    const codi = nom[1] === 'x' || nom[1] === 'X' ? parseInt(nom.slice(2), 16) : parseInt(nom.slice(1), 10);
    return codi > 0 && codi <= 0x10FFFF ? String.fromCodePoint(codi) : tot;
  });
}

/* Els atributs d'una etiqueta (els noms en minúscules, els valors sense entitats). */
function atributsDe(etiqueta) {
  const atributs = Object.create(null);
  for (const [, nom, doble, simple] of etiqueta.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    atributs[nom.toLowerCase()] = desentitza(doble ?? simple);
  }
  return atributs;
}

const esTipusImatge = (tipus) => /^image\//i.test(tipus || '');

/* Els caràcters que el nucli del Lector lleva d'una adreça abans de llegir-la (nucli/entitats.js ·
   netejaText): controls, C1, amplada zero, bidireccionals, BOM i no-caràcters (escrits com a
   seqüències d'escapament: cap invisible al fitxer). */
const NO_TEXT = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF\uFFFE\uFFFF]/g;
/* Els elements de l'HTML d'un contingut que el nucli del Lector no llig com a HTML (text cru) o que
   descarta amb tot el que porten dins (nucli/html.js): les seues <img> no són mai la imatge d'un
   article. Un <picture> no hi és: el nucli sí que en recull la <img>. Els comentaris, tampoc. */
const SENSE_IMATGES = 'script|style|textarea|title|xmp|iframe|noembed|noframes|noscript|template|plaintext|svg|math|canvas|video|audio|object'
  + '|applet|frameset|map|form|button|select|datalist|label|fieldset|legend|output|meter|progress|dialog|slot|head|optgroup|option|portal';
const NOM_SENSE_IMATGES = new RegExp(`(${SENSE_IMATGES})\\b`, 'iy');
/* Els elements d'una entrada que es lleven abans de buscar-ne l'enllaç (vegeu senseNiats). */
const NIATS_RSS = 'source|description|encoded|content|summary';
const NIATS_ATOM = 'entry|source|content|summary|subtitle|title|rights';
/* Els noms dels continguts sense tancar que es busquen en un tros (continguts): un feed en porta
   quatre o cinc, i un que en porta més ja no és un feed. */
const MAXIM_NOMS_SENSE_TANCAR = 32;

/* ── G-03 · Un recorregut lineal de l'XML ─────────────────────────────────────
   Gauntlet 261024_1945, Codex G-03 (CWE-1333). Les expressions d'abans tornaven a recórrer el text
   des de cada «<» quan hi faltava el terminador (un element sense tancar, una etiqueta sense «>»,
   una secció CDATA sense «]]>», una <img> sense src): un feed trencat a posta d'1 MB costava 7 s de
   CPU, ja fora del temporitzador de la baixada. Estes peces diuen el mateix que aquelles
   expressions, però cap no torna enrere: el «>» de després d'una posició es memoritza (els «<»
   d'abans d'eixe «>» el compartixen), un terminador que no hi és no es torna a buscar i els
   tancaments d'un tros es llisten una sola vegada. L'única fita nova és MAXIM_NOMS_SENSE_TANCAR.
   gestor.test.js ho prova amb les entrades que abans eren quadràtiques. */

const ESPAI = /\s/;

/* El lector d'un text per a posicions que creixen: fi(posicio), el primer «>» des d'ella (o -1).
   Cada cerca comença on acabava l'anterior: tots els «<» d'abans d'un «>» el compartixen. */
function creaLector(text) {
  let des = Infinity;
  let fi = -1;
  return {
    fi(posicio) {
      if (posicio < des || (fi >= 0 && posicio > fi)) {
        des = posicio;
        fi = text.indexOf('>', posicio);
      }
      return fi;
    }
  };
}

/* La pròxima etiqueta `<nom…>` des de `des`: { inici, nom, final, fi } (final: on acaba el nom; fi:
   el «>»), o null. `nom` és una expressió enganxosa (y) amb el nom en el grup 1, que es prova just
   després de cada «<»; `valida(final, fi)`, la forma de la resta de l'etiqueta. Sense cap «>» més,
   cap etiqueta més. */
function etiquetaDe(text, lector, des, nom, valida) {
  for (let i = text.indexOf('<', des); i >= 0; i = text.indexOf('<', i + 1)) {
    nom.lastIndex = i + 1;
    const trobat = nom.exec(text);
    if (!trobat) continue;
    const final = nom.lastIndex;
    const fi = lector.fi(final);
    if (fi < 0) return null;
    if (valida(final, fi)) return { inici: i, nom: trobat[1], final, fi };
  }
  return null;
}

/* Una obertura que no s'autotanca, com <nom(?:\s[^>]*[^/>])?\s*>: el nom seguit d'un espai o del
   «>» (ho mira l'expressió del nom), i el «>» de seguida o darrere d'un caràcter que no és «/» (un
   espai hi val: <nom / > és una obertura; <nom /> i <nom a="b"/>, no). */
const noSAutotanca = (text) => (final, fi) => fi === final || text[fi - 1] !== '/';

/* El nom d'una obertura d'element (sense prefix o amb un), per a un patró de noms. */
const nomDElement = (noms, banderes = '') => new RegExp(`((?:[\\w.-]+:)?(?:${noms}))(?=[\\s>])`, `y${banderes}`);

/* Els trossos d'un text separant-ne les seccions CDATA, com text.split(/(<!\[CDATA\[[\s\S]*?\]\]>)/):
   els parells, text; els senars, seccions senceres. Una secció sense «]]>» no és cap secció. */
function trossosCdata(text) {
  const trossos = [];
  let des = 0;
  for (let i = text.indexOf('<![CDATA['); i >= 0; i = text.indexOf('<![CDATA[', des)) {
    const fi = text.indexOf(']]>', i + 9);
    if (fi < 0) break;
    trossos.push(text.slice(des, i), text.slice(i, fi + 3));
    des = fi + 3;
  }
  trossos.push(text.slice(des));
  return trossos;
}

/* Un text sense les seccions CDATA (com text.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')). */
const senseCdata = (text) => trossosCdata(text).filter((_, k) => k % 2 === 0).join('');

/* Un text sense etiquetes (com text.replace(/<[^>]*>/g, '')). */
function senseEtiquetesXml(text) {
  let eixida = '';
  let des = 0;
  for (let i = text.indexOf('<'); i >= 0; i = text.indexOf('<', des)) {
    const fi = text.indexOf('>', i);
    if (fi < 0) break;
    eixida += text.slice(des, i);
    des = fi + 1;
  }
  return eixida + text.slice(des);
}

/* Els tancaments `</nom\s*>` d'un text, llistats una vegada: tancament(nom, des) torna el primer
   que comença des de `des`, [inici, final], o null. Per a cada nom, `des` ha de créixer. */
function creaTancaments(text) {
  const perNom = new Map();
  for (const trobat of text.matchAll(/<\/([\w.:-]+)\s*>/g)) {
    if (!perNom.has(trobat[1])) perNom.set(trobat[1], { llista: [], punter: 0 });
    perNom.get(trobat[1]).llista.push([trobat.index, trobat.index + trobat[0].length]);
  }
  return (nom, des) => {
    const del = perNom.get(nom);
    if (!del) return null;
    while (del.punter < del.llista.length && del.llista[del.punter][0] < des) del.punter += 1;
    return del.llista[del.punter] ?? null;
  };
}

/* L'HTML d'un contingut sense el que el nucli no hi llig (els comentaris i els elements de
   SENSE_IMATGES, amb el que porten dins, fins al tancament o fins a la fi), com l'expressió
   <!--[\s\S]*?(?:-->|$)|<(SENSE_IMATGES)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$) (gi). */
function senseForaDeLHtml(html) {
  const lector = creaLector(html);
  let eixida = '';
  let des = 0;
  for (let i = html.indexOf('<'); i >= 0; i = html.indexOf('<', i + 1)) {
    let fi;
    if (html.startsWith('<!--', i)) {
      const tanca = html.indexOf('-->', i + 4);
      fi = tanca < 0 ? html.length : tanca + 3;
    } else {
      NOM_SENSE_IMATGES.lastIndex = i + 1;
      const nom = NOM_SENSE_IMATGES.exec(html);
      if (!nom) continue;
      const gt = lector.fi(NOM_SENSE_IMATGES.lastIndex);
      if (gt < 0) continue;
      const tancament = new RegExp(`<\\/${nom[1]}\\s*>`, 'gi');
      tancament.lastIndex = gt + 1;
      fi = tancament.exec(html) ? tancament.lastIndex : html.length;
    }
    eixida += html.slice(des, i);
    des = fi;
    i = fi - 1;
  }
  return eixida + html.slice(des);
}

/* Els valors dels src de les <img> d'un HTML, en ordre, com els donava
   html.matchAll(/<img\b[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi): el src s'ha
   d'escriure abans del «>» de la <img>, però un valor entre cometes pot passar-lo. */
function* srcsDeLHtml(html) {
  const lector = creaLector(html);
  const img = /img\b/iy;
  const src = /([^>]*?)\ssrc\s*=\s*/iy;
  const nu = /[^\s"'>]+/y;
  const senseCometa = { '"': false, "'": false };
  let senseSrc = -2;
  for (let i = html.indexOf('<'); i >= 0; i = html.indexOf('<', i + 1)) {
    img.lastIndex = i + 1;
    if (!img.test(html)) continue;
    const fi = lector.fi(img.lastIndex);
    if (fi === senseSrc) continue;
    let valor = null;
    let final = -1;
    for (let des = img.lastIndex; valor === null;) {
      src.lastIndex = des;
      const trobat = src.exec(html);
      if (!trobat) break;
      const inici = src.lastIndex;
      const cometa = html[inici];
      if (cometa === '"' || cometa === "'") {
        const tanca = senseCometa[cometa] ? -1 : html.indexOf(cometa, inici + 1);
        if (tanca < 0) senseCometa[cometa] = true;
        else [valor, final] = [html.slice(inici + 1, tanca), tanca + 1];
      } else {
        nu.lastIndex = inici;
        const valorNu = nu.exec(html);
        if (valorNu) [valor, final] = [valorNu[0], nu.lastIndex];
      }
      des = trobat.index + trobat[1].length + 1;
    }
    if (valor === null) {
      senseSrc = fi;
      continue;
    }
    yield valor;
    i = final - 1;
  }
}

/* Una base web absoluta, o undefined (nucli/urls.js · baseValida). */
function baseWeb(base) {
  if (typeof base !== 'string' || base === '') return undefined;
  try {
    const url = new URL(base);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/* Una adreça com la resol el nucli del Lector (nucli/urls.js · urlAbsoluta amb PROTOCOLS_WEB):
   la relativa i la de protocol relatiu («//cdn…»), contra la base; http o https, sense credencials,
   com a molt MAXIM_URL_PERSONAL caràcters. Torna l'adreça, o null. */
function absolutaWeb(valor, base) {
  if (typeof valor !== 'string') return null;
  const net = valor.replace(NO_TEXT, '').trim();
  if (net === '' || net.length > MAXIM_URL_PERSONAL) return null;
  let url;
  try {
    url = new URL(net, baseWeb(base));
  } catch {
    return null;
  }
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username !== '' || url.password !== '') return null;
  return url.href.length > MAXIM_URL_PERSONAL ? null : url.href;
}

/* Una adreça d'imatge com la guarda el servei (i com la torna a fer el client): https i sense
   fragment; una http (el Lector no la demana) o massa llarga no compta. */
function hrefDImatge(absoluta) {
  if (!absoluta) return null;
  const url = new URL(absoluta);
  if (url.protocol !== 'https:') return null;
  url.hash = '';
  return url.href.length > MAXIM_URL_PERSONAL ? null : url.href;
}

/* El contingut d'un element com el veu el nucli (xml.js · textDe): les seccions CDATA, crues; la
   resta, sense entitats d'XML. `senseEtiquetes`: el text i prou (un enllaç, un guid). */
function textXml(cru, { senseEtiquetes = false } = {}) {
  return trossosCdata(cru).map((tros) => {
    if (tros.startsWith('<![CDATA[')) return tros.slice(9, -3);
    return desentitza(senseEtiquetes ? senseEtiquetesXml(tros) : tros);
  }).join('');
}

/* Tots els espais seguits en un i sense vores (nucli/entitats.js · plega). */
const plega = (text) => text.replace(NO_TEXT, '').replace(/\s+/g, ' ').trim();

/* El primer element `nom` sense prefix d'un tros d'XML: { text, etiqueta } (el text, '' si
   s'autotanca; l'etiqueta d'obertura, crua), o null si no n'hi ha cap. */
function primerElement(tros, nom) {
  /* Com <nom(\s[^>]*)?>: el nom i, darrere, el «>» o un espai. */
  const obertura = etiquetaDe(tros, creaLector(tros), 0, new RegExp(`(${nom})`, 'y'), (final, fi) => fi === final || ESPAI.test(tros[final]));
  if (!obertura) return null;
  const etiqueta = tros.slice(obertura.inici, obertura.fi + 1);
  if (obertura.fi > obertura.final && tros[obertura.fi - 1] === '/') return { text: '', etiqueta };
  const inici = obertura.fi + 1;
  const fi = tros.indexOf(`</${nom}`, inici);
  return { text: textXml(tros.slice(inici, fi < 0 ? tros.length : fi), { senseEtiquetes: true }), etiqueta };
}

/* L'enllaç d'Atom d'un tros (nucli/analitzador.js · enllacAtom): rel «alternate» o sense rel,
   millor si és text/html (sense tipus, ho és). */
function enllacAtomDe(tros, base) {
  /* Cada <link> i <atom:link> (com /<(?:atom:)?link\b[^>]*>/g). */
  const lector = creaLector(tros);
  const nom = /((?:atom:)?link)\b/y;
  const enllacos = [];
  for (let trobat = etiquetaDe(tros, lector, 0, nom, () => true); trobat; trobat = etiquetaDe(tros, lector, trobat.fi + 1, nom, () => true)) {
    const a = atributsDe(tros.slice(trobat.inici, trobat.fi + 1));
    if (a.rel === undefined || a.rel === 'alternate') enllacos.push(a);
  }
  const html = enllacos.find((a) => /html/i.test(a.type || 'text/html'));
  return absolutaWeb((html || enllacos[0])?.href || '', base);
}

/* Els elements `nom` (item o entry) d'un feed: [{ inici, cos }], en ordre. Una obertura sense
   tancament s'emporta la resta i acaba la cerca (cap cerca quadràtica). */
function elementsDe(xml, nom) {
  const lector = creaLector(xml);
  const nomDe = nomDElement(nom);
  const valida = noSAutotanca(xml);
  const eixida = [];
  for (let trobat = etiquetaDe(xml, lector, 0, nomDe, valida); trobat && eixida.length < MAXIM_IMATGES_PER_FEED;) {
    const fi = xml.indexOf(`</${trobat.nom}`, trobat.fi + 1);
    eixida.push({ inici: trobat.inici, cos: xml.slice(trobat.fi + 1, fi < 0 ? xml.length : fi) });
    if (fi < 0) break;
    trobat = etiquetaDe(xml, lector, fi, nomDe, valida);
  }
  return eixida;
}

/* L'arrel d'un feed (rss, feed o RDF), o null. */
function arrelDe(xml) {
  const salta = /^\s*(?:<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>[]*(?:\[[^\]]*\])?\s*>)/i;
  let resta = xml.slice(0, 65536);
  for (let i = 0; i < 32; i += 1) {
    const salt = salta.exec(resta);
    if (!salt) break;
    resta = resta.slice(salt[0].length);
  }
  return /^\s*<(?:[A-Za-z_][\w.-]*:)?(rss|feed|RDF)[\s/>]/.exec(resta)?.[1] || null;
}

/* Un tros sense els elements de dins que porten enllaços que no són del canal o de l'element (la
   imatge i el quadre de text del canal; la font; els continguts, amb el seu HTML). */
function senseNiats(tros, noms) {
  /* Cada obertura fins al seu primer tancament `</nom\s*>`; una que no es tanca, es queda, i la
     cerca seguix pel «<» de després (com l'expressió d'abans amb el cos [\s\S]*?). */
  const lector = creaLector(tros);
  const nom = nomDElement(noms);
  const valida = noSAutotanca(tros);
  const tancament = creaTancaments(tros);
  let eixida = '';
  let copiat = 0;
  for (let trobat = etiquetaDe(tros, lector, 0, nom, valida); trobat;) {
    const tancat = tancament(trobat.nom, trobat.fi + 1);
    if (!tancat) {
      trobat = etiquetaDe(tros, lector, trobat.inici + 1, nom, valida);
      continue;
    }
    eixida += tros.slice(copiat, trobat.inici);
    copiat = tancat[1];
    trobat = etiquetaDe(tros, lector, tancat[1], nom, valida);
  }
  return eixida + tros.slice(copiat);
}

/**
 * Les adreces de les imatges d'un feed (com a molt MAXIM_IMATGES_PER_FEED, sense repetir): les
 * dels enclosure d'imatge (RSS i Atom), media:thumbnail, media:content d'imatge, itunes:image i
 * la primera <img> de cada contingut (description, content:encoded, content, summary; en CDATA o
 * escapat). R6 L-09 (Lector final): cada adreça es resol COM LA RESOL EL NUCLI DEL LECTOR
 * (nucli/analitzador.js): la relativa i la de protocol relatiu, contra l'enllaç de l'element; si
 * no en té, contra el del canal (o del feed d'Atom); si no, contra `base` (el `lloc` de la font,
 * el mateix que passa el Lector). La primera <img> és la mateixa que tria el nucli: la primera que
 * es resol (http o https, sense credencials), fora de les que el nucli no llig (script, noscript,
 * svg, vídeo…); si és http, el Lector no demana res i no es guarda. Només es guarden les https,
 * sense fragment. Pura i fitada: no llança mai, i el recorregut és lineal, també per a un feed trencat
 * a posta (G-03, Gauntlet 261024_1945). La paritat amb el nucli la vigila paritat.test.js.
 */
export function imatgesDelFeed(xml, base = null) {
  const eixida = new Set();
  if (typeof xml !== 'string') return [];
  const afig = (absoluta) => {
    const href = hrefDImatge(absoluta);
    if (href && eixida.size < MAXIM_IMATGES_PER_FEED) eixida.add(href);
  };
  const arrel = arrelDe(xml);
  const elements = elementsDe(xml, arrel === 'feed' ? 'entry' : 'item');
  const capcalera = xml.slice(0, elements.length ? elements[0].inici : xml.length);
  const delFeed = arrel === 'feed'
    ? enllacAtomDe(senseNiats(capcalera, NIATS_ATOM), base)
    : absolutaWeb(plega(primerElement(senseNiats(capcalera, `image|textInput|textinput|${NIATS_RSS}`), 'link')?.text ?? ''), base);
  const baseDelFeed = delFeed || absolutaWeb(base ?? '', null);
  /* Les etiquetes d'imatge (no les de dins d'un contingut en CDATA) d'un tros. */
  const etiquetes = (tros, baseTros) => {
    /* Com /<(?:[\w.-]+:)?(enclosure|thumbnail|content|image|link)\b[^>]*>/gi, sense el CDATA. */
    const net = senseCdata(tros);
    const lector = creaLector(net);
    const nomDe = /(?:[\w.-]+:)?(enclosure|thumbnail|content|image|link)\b/iy;
    for (let trobat = etiquetaDe(net, lector, 0, nomDe, () => true); trobat; trobat = etiquetaDe(net, lector, trobat.fi + 1, nomDe, () => true)) {
      if (eixida.size >= MAXIM_IMATGES_PER_FEED) return;
      const { nom } = trobat;
      const a = atributsDe(net.slice(trobat.inici, trobat.fi + 1));
      const local = nom.toLowerCase();
      let cru = null;
      if (local === 'enclosure') {
        if (esTipusImatge(a.type) || (!a.type && ESTENSIO_IMATGE.test(a.url || ''))) cru = a.url;
      } else if (local === 'thumbnail') {
        cru = a.url;
      } else if (local === 'content') {
        if (a.url && (a.medium === 'image' || esTipusImatge(a.type) || (!a.medium && !a.type && ESTENSIO_IMATGE.test(a.url)))) cru = a.url;
      } else if (local === 'image') {
        cru = a.href;
      } else if (a.rel === 'enclosure' && esTipusImatge(a.type)) {
        cru = a.href;
      }
      if (cru) afig(absolutaWeb(cru, baseTros));
    }
  };
  /* La primera <img> de cada contingut d'un tros, com la tria el nucli. Cada element es busca fins
     al seu tancament; un nom que no es tanca no es torna a buscar (cap cerca quadràtica). */
  const continguts = (tros, baseTros) => {
    /* Com /<((?:[\w.-]+:)?(?:description|encoded|content|summary))\b(?:[^>]*[^/>])?>/gi: el nom, i
       el «>» de seguida o darrere d'un caràcter que no és «/». */
    const lector = creaLector(tros);
    const nomDe = /((?:[\w.-]+:)?(?:description|encoded|content|summary))\b/iy;
    const valida = (final, fi) => fi === final || tros[fi - 1] !== '/';
    const senseTancar = new Set();
    let comptats = 0;
    for (let trobat = etiquetaDe(tros, lector, 0, nomDe, valida); trobat && comptats < MAXIM_IMATGES_PER_FEED;) {
      if (eixida.size >= MAXIM_IMATGES_PER_FEED) return;
      const { nom } = trobat;
      const fi = senseTancar.has(nom) ? -1 : tros.indexOf(`</${nom}`, trobat.fi + 1);
      if (fi < 0) {
        senseTancar.add(nom);
        if (senseTancar.size > MAXIM_NOMS_SENSE_TANCAR) return;
        trobat = etiquetaDe(tros, lector, trobat.fi + 1, nomDe, valida);
        continue;
      }
      comptats += 1;
      const html = senseForaDeLHtml(textXml(tros.slice(trobat.fi + 1, fi)));
      for (const cru of srcsDeLHtml(html)) {
        const absoluta = absolutaWeb(desentitza(cru), baseTros);
        if (absoluta) {
          afig(absoluta);
          break;
        }
      }
      trobat = etiquetaDe(tros, lector, fi, nomDe, valida);
    }
  };
  etiquetes(capcalera, baseDelFeed);
  continguts(capcalera, baseDelFeed);
  for (const { cos } of elements) {
    if (eixida.size >= MAXIM_IMATGES_PER_FEED) break;
    let propi;
    if (arrel === 'feed') {
      propi = enllacAtomDe(senseNiats(cos, NIATS_ATOM), baseDelFeed);
    } else {
      const net = senseNiats(cos, NIATS_RSS);
      const guid = primerElement(net, 'guid');
      /* Un guid és permanent si no diu exactament isPermaLink="false" (el nom com s'escriu). */
      const permanent = guid && !/\sisPermaLink\s*=\s*(?:"false"|'false')/.test(guid.etiqueta);
      propi = absolutaWeb(plega(primerElement(net, 'link')?.text ?? ''), baseDelFeed)
        || (permanent ? absolutaWeb(plega(guid.text), baseDelFeed) : null);
    }
    etiquetes(cos, propi || baseDelFeed);
    continguts(cos, propi || baseDelFeed);
  }
  return [...eixida];
}

/* El tipus d'una imatge pels seus primers bytes (la signatura), o null si no és cap de TIPUS_IMATGE. */
function tipusPelsBytes(b) {
  const text = (inici, fi) => String.fromCharCode(...b.subarray(inici, fi));
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
  if (b[0] === 0x89 && text(1, 4) === 'PNG') return 'image/png';
  if (text(0, 4) === 'GIF8') return 'image/gif';
  if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return 'image/webp';
  if (text(4, 8) === 'ftyp' && /^avi[fs]$/.test(text(8, 12))) return 'image/avif';
  return null;
}

/* ── El gestor ────────────────────────────────────────────────────────────── */

/* Una promesa que es rebutja quan el senyal s'avorta (per a un resoledor que no l'escolta). */
const finsQueSAvorte = (senyal) => new Promise((resol, rebutja) => {
  if (senyal.aborted) rebutja(new Error('avortada'));
  else senyal.addEventListener('abort', () => rebutja(new Error('avortada')), { once: true });
});

/* Llig un feed de l'origen: { xml } o { error }. */
async function lligFeed(resposta, maxim) {
  const bytes = await llegixFitat(resposta, maxim);
  if (!bytes) return { error: 'origen_mida' };
  const xml = descodificaFeed(bytes, resposta.headers.get('content-type'));
  return esFeed(xml) ? { xml } : { error: 'origen_format' };
}

/* Llig una imatge de l'origen: { bytes, tipus } o { error }. El tipus declarat ha de ser una
   imatge de TIPUS_IMATGE, i els bytes també (la signatura mana: és el que es diu al navegador). */
async function lligImatge(resposta, maxim) {
  const declarat = String(resposta.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!TIPUS_IMATGE.includes(declarat)) {
    await descarta(resposta);
    return { error: 'origen_format' };
  }
  const bytes = await llegixFitat(resposta, maxim);
  if (!bytes) return { error: 'origen_mida' };
  const tipus = tipusPelsBytes(bytes);
  return tipus ? { bytes, tipus } : { error: 'origen_format' };
}

/**
 * El gestor. `fetchImpl`, `ara`, els temporitzadors, el resoledor i l'empremta s'injecten (les
 * proves). Torna `gestiona(peticio, info)`, la funció de Deno.serve.
 *   personals      cert: admet ?url= (les fonts personals); fals per defecte
 *   imatgesExternes cert: servix també imatges de hosts de fora del catàleg i dels seus CDN
 *                  (CDN_IMATGES) que han eixit en un feed; fals per defecte (R6 L-12: 403
 *                  imatge_de_fora, sense resoldre ni baixar res)
 *   resolDns       (host, 'A' | 'AAAA', { signal }) → Promise<[ip]> ([] si no n'hi ha; llança si
 *                  no es pot resoldre), o null si l'entorn no en té: llavors les personals es
 *                  tanquen (503) i les imatges de fora del catàleg també
 *   hostsVetats    els noms que mai es demanen de fora (el host del projecte)
 *   maximEmpremtes les finestres vives que cap a cada límit
 */
export function creaGestor({
  cataleg,
  fetchImpl = (url, init) => globalThis.fetch(url, init),
  ara = () => Date.now(),
  temporitzador = { posa: (fer, ms) => setTimeout(fer, ms), lleva: (id) => clearTimeout(id) },
  personals = false,
  imatgesExternes = false,
  resolDns = null,
  hostsVetats = [],
  empremta = creaEmpremtador(),
  maximEmpremtes = MAXIM_EMPREMTES
} = {}) {
  const { categories, fonts } = validaCataleg(cataleg);
  const perId = new Map(fonts.map((font) => [font.id, font]));
  const teResoledor = typeof resolDns === 'function';
  const ambPersonals = personals === true && teResoledor;
  /* Els hosts del catàleg i els seus CDN d'imatges (el Mestre els aprova un per un): se'n servix
     qualsevol imatge, encara que esta instància no l'haja vista (R6 L-08: una notícia desada «per a
     després» conserva la miniatura quan la instància es recicla). Amb resoledor, el nom es resol
     igual i una resposta no pública, o cap adreça, el veta (T1, aprovatVetat). */
  const hostsDelCataleg = new Set(fonts.map((font) => new URL(font.feed).hostname));
  const hostsAprovats = new Set([...hostsDelCataleg, ...CDN_IMATGES]);
  const ambExternes = imatgesExternes === true;
  const publiques = Object.freeze({
    categories,
    fonts: Object.freeze(fonts.map(({ id, nom, categoriaId, descripcio, lloc }) => Object.freeze({ id, nom, categoriaId, descripcio, lloc }))),
    personals: ambPersonals
  });
  const vetatsFixos = Object.freeze((Array.isArray(hostsVetats) ? hostsVetats : []).filter((host) => typeof host === 'string' && host)
    .map((host) => host.toLowerCase()));
  const cau = new Map();
  /* `${qui} ${adreça}` → { xml, obtingut }, per ordre d'obtingut (desaPersonal ho manté). */
  const cauPersonals = new Map();
  let caractersPersonals = 0;
  const enVol = new Map();
  /* adreça → moment en què ha eixit en un feed del sistema, per ordre (recordaImatges ho manté). */
  const imatgesVistes = new Map();
  /* R6 L-11 · `${qui} ${adreça}` → moment en què ha eixit en una font personal d'eixa connexió. */
  const imatgesPersonals = new Map();
  /* R6 L-02 · La memòria dels bytes: clau → { bytes, tipus, obtingut }, per ordre d'obtingut. */
  const cauImatges = new Map();
  let bytesCauImatges = 0;
  /* Les imatges que esperen el seu torn: [{ dona }], per ordre d'arribada. */
  const cuaImatges = [];
  const enVolPerQui = new Map();
  let personalsEnVol = 0;
  let imatgesEnVol = 0;
  const limitGeneral = creaLimit(LIMIT, maximEmpremtes);
  const limitPersonals = creaLimit(LIMIT_PERSONALS, maximEmpremtes);
  const limitImatges = creaLimit(LIMIT_IMATGES, maximEmpremtes);

  /* Les adreces d'un nom, { adreces, fallades } (fallades: les famílies, A i AAAA, que no han
     respost), o null si l'entorn no té resoledor. T1 (261024_1800; Codex C6-02, segona passada):
     allSettled i no all, perquè una resposta privada d'una família no es perda si l'altra falla. */
  async function resolNom(host, senyal) {
    if (!teResoledor) return null;
    const resol = (tipus) => Promise.race([Promise.resolve().then(() => resolDns(host, tipus, { signal: senyal })), finsQueSAvorte(senyal)]);
    const respostes = await Promise.allSettled([resol('A'), resol('AAAA')]);
    return {
      adreces: respostes.flatMap((resposta) => (resposta.status === 'fulfilled' && Array.isArray(resposta.value) ? resposta.value : [])),
      fallades: respostes.filter((resposta) => resposta.status === 'rejected').length
    };
  }

  /* Si el nom d'una adreça de fora només porta a la xarxa pública: 'publica', 'privada' (una sola
     resposta no pública, encara que l'altra família falle), 'desconeguda' (alguna família no ha
     respost, o cap adreça) o 'sense-dns' (l'entorn no té resoledor: mai pública). */
  async function xarxaDe(host, senyal) {
    if (!teResoledor) return 'sense-dns';
    const { adreces, fallades } = await resolNom(host, senyal);
    if (adreces.some(esIpNoPublica)) return 'privada';
    return fallades > 0 || adreces.length === 0 ? 'desconeguda' : 'publica';
  }

  /* Les regles d'una adreça de fora: les personals es resolen sempre; les imatges, si el seu
     host no és del catàleg. `senseDns`: el codi quan l'entorn no té resoledor. */
  const reglesPersonals = (vetats) => Object.freeze({ vetats, confiats: null, senseDns: 'personals_sense_dns' });
  const reglesImatge = (vetats) => Object.freeze({
    vetats, confiats: hostsAprovats, senseDns: 'imatge_sense_dns', fora: ambExternes ? null : 'imatge_de_fora'
  });

  /* T1 (261024_1800; Codex C6-02, i la segona passada) · Un host aprovat (el catàleg i CDN_IMATGES),
     amb resoledor: una sola resposta no pública el veta (adreca_vetada), també si l'altra família
     ha fallat; una família que falla, o cap adreça, tampoc no passa (origen_caigut: el Lector rep la
     còpia de reserva si en té; Gauntlet 261024_1945, Gemini G1945-01: abans, una adreça pública i
     l'altra família amb error passaven). Un host sense IPv6 no cau per l'AAAA: un nom que no
     existix (NotFound) és cap resposta, no una fallada (index.ts). Sense resoledor a l'entorn,
     passa per la llista blanca nativa: és l'única porta oberta, i la decisió és del Mestre
     (supabase/README.md). */
  async function aprovatVetat(host, senyal) {
    const nom = await resolNom(host, senyal);
    if (!nom) return null;
    if (nom.adreces.some(esIpNoPublica)) return 'adreca_vetada';
    return nom.fallades > 0 || nom.adreces.length === 0 ? 'origen_caigut' : null;
  }

  /* Les regles d'un salt (el primer o una redirecció): null si val; si no, el codi d'error.
     Sense `regles`, una font del sistema: el mateix host, en https, sense port ni credencials
     (T1, Codex C6-03: abans, una redirecció podia canviar el port), i el seu nom resolt. */
  function regleDelSalt(regles, host) {
    return async function valida(seguent, senyal) {
      if (!regles) {
        if (seguent.protocol !== 'https:' || seguent.hostname !== host || seguent.port !== '' || seguent.username || seguent.password) {
          return 'origen_caigut';
        }
        return aprovatVetat(seguent.hostname, senyal);
      }
      const neta = adrecaPersonal(seguent.href, regles.vetats);
      if (!neta) return 'adreca_vetada';
      if (regles.confiats?.has(neta.hostname)) return aprovatVetat(neta.hostname, senyal);
      /* Una redirecció d'imatge cap a un host de fora, amb l'interruptor apagat: tampoc. */
      if (regles.fora) return regles.fora;
      const xarxa = await xarxaDe(neta.hostname, senyal);
      if (xarxa === 'sense-dns') return regles.senseDns;
      if (xarxa === 'privada') return 'adreca_vetada';
      return xarxa === 'publica' ? null : 'origen_caigut';
    };
  }

  /* Una baixada de l'origen: el que torna `llig` ({ xml }, { bytes, tipus }) o { error } (un codi
     d'ERRORS). Mai llança. Cada salt, també el primer, passa les regles: amb `regles`, les d'una
     adreça de fora; sense, les d'una font del sistema (redireccions només dins del seu host). */
  async function baixa(adreca, { regles = null, maxim = MAXIM_BYTES, accepta = ACCEPTA, llig = lligFeed } = {}) {
    const controlador = new AbortController();
    const rellotge = temporitzador.posa(() => controlador.abort(), TEMPS_ORIGEN_MS);
    try {
      let actual = new URL(adreca);
      const valida = regleDelSalt(regles, actual.hostname);
      const primer = await valida(actual, controlador.signal);
      if (controlador.signal.aborted) return { error: 'origen_temps' };
      if (primer) return { error: primer };
      for (let salts = 0; ; salts += 1) {
        const resposta = await fetchImpl(actual.href, {
          method: 'GET', redirect: 'manual', headers: { 'User-Agent': AGENT_USUARI, Accept: accepta }, signal: controlador.signal
        });
        /* R6 L-06 · Un 304 sense haver-lo demanat (cap capçalera condicional ix d'ací): la memòria cau
           de la web no dona el feed. No és una redirecció ni una cosa que no es llig. */
        if (resposta.status === 304) {
          await descarta(resposta);
          return { error: 'origen_buit' };
        }
        if (resposta.status >= 300 && resposta.status < 400) {
          await descarta(resposta);
          const desti = resposta.headers.get('location');
          if (!desti || salts >= MAXIM_REDIRECCIONS) return { error: 'origen_caigut' };
          let seguent;
          try {
            seguent = new URL(desti, actual);
          } catch {
            return { error: 'origen_caigut' };
          }
          const error = await valida(seguent, controlador.signal);
          if (controlador.signal.aborted) return { error: 'origen_temps' };
          if (error) return { error };
          seguent.hash = '';
          actual = seguent;
          continue;
        }
        if (!resposta.ok) {
          await descarta(resposta);
          return { error: 'origen_caigut' };
        }
        if (Number(resposta.headers.get('content-length')) > maxim) {
          await descarta(resposta);
          return { error: 'origen_mida' };
        }
        return await llig(resposta, maxim);
      }
    } catch {
      return { error: controlador.signal.aborted ? 'origen_temps' : 'origen_caigut' };
    } finally {
      temporitzador.lleva(rellotge);
    }
  }

  /* Recorda les imatges d'un mapa (24 h), fitat: les més velles se'n van primer. */
  function recordaEn(mapa, claus, moment, maxim) {
    for (const clau of claus) {
      mapa.delete(clau);
      mapa.set(clau, moment);
    }
    for (const clau of mapa.keys()) {
      if (mapa.size <= maxim) break;
      mapa.delete(clau);
    }
  }

  /* Les imatges d'un feed del sistema baixat ara: les de fora del catàleg que /imatge servix (24 h),
     amb l'interruptor encés. `base`: el lloc de la font, el mateix que fa servir el Lector. */
  function recordaImatges(xml, moment, base) {
    recordaEn(imatgesVistes, imatgesDelFeed(xml, base), moment, MAXIM_IMATGES_RECORDADES);
  }

  /* R6 L-11 · Les d'una font personal, només per a la connexió que l'ha demanada: ningú més no pot
     saber, demanant-les, si algú ha llegit eixa font. */
  function recordaImatgesPersonals(qui, xml, moment, base) {
    recordaEn(imatgesPersonals, imatgesDelFeed(xml, base).map((href) => `${qui} ${href}`), moment, MAXIM_IMATGES_PERSONALS_RECORDADES);
  }

  /* R6 L-02 · El torn d'una baixada d'imatge: tot d'una si hi ha lloc; si no, a la cua, com a molt
     ESPERA_TORN_IMATGE_MS. Torna Promise<bool> (fals: el torn no ha arribat a temps). */
  function tornDImatge() {
    if (imatgesEnVol < MAXIM_IMATGES_EN_VOL) {
      imatgesEnVol += 1;
      return Promise.resolve(true);
    }
    return new Promise((resol) => {
      const espera = { dona: null };
      const rellotge = temporitzador.posa(() => {
        const posicio = cuaImatges.indexOf(espera);
        if (posicio >= 0) cuaImatges.splice(posicio, 1);
        resol(false);
      }, ESPERA_TORN_IMATGE_MS);
      espera.dona = () => {
        temporitzador.lleva(rellotge);
        resol(true);
      };
      cuaImatges.push(espera);
    });
  }

  /* Acaba una baixada d'imatge: el seu lloc passa a la primera de la cua, o queda lliure. */
  function alliberaImatge() {
    const seguent = cuaImatges.shift();
    if (seguent) seguent.dona();
    else imatgesEnVol -= 1;
  }

  function oblidaImatge(clau) {
    const vella = cauImatges.get(clau);
    if (!vella) return;
    bytesCauImatges -= vella.bytes.byteLength;
    cauImatges.delete(clau);
  }

  /* Desa els bytes d'una imatge bona, fitat en entrades i en bytes: les més velles se'n van primer. */
  function desaImatge(clau, { bytes, tipus }) {
    oblidaImatge(clau);
    cauImatges.set(clau, { bytes, tipus, obtingut: ara() });
    bytesCauImatges += bytes.byteLength;
    for (const k of cauImatges.keys()) {
      if (cauImatges.size <= MAXIM_IMATGES_CAU && bytesCauImatges <= MAXIM_BYTES_CAU_IMATGES) break;
      if (k !== clau) oblidaImatge(k);
    }
  }

  /* Desa una font personal a la seua memòria, fitada: les més velles se'n van primer. */
  function desaPersonal(clau, entrada) {
    oblidaPersonal(clau);
    cauPersonals.set(clau, entrada);
    caractersPersonals += entrada.xml.length;
    for (const [k, v] of cauPersonals) {
      if (cauPersonals.size <= MAXIM_CAU_PERSONALS && caractersPersonals <= MAXIM_CARACTERS_CAU_PERSONALS) break;
      if (k === clau) continue;
      cauPersonals.delete(k);
      caractersPersonals -= v.xml.length;
    }
  }

  function oblidaPersonal(clau) {
    const vella = cauPersonals.get(clau);
    if (!vella) return;
    caractersPersonals -= vella.xml.length;
    cauPersonals.delete(clau);
  }

  /* El que ja ha vençut, fora: les finestres dels límits (les empremtes), les còpies personals de
     més de 24 h i les imatges que fa més de 24 h que no ixen en cap feed. A cada petició. */
  function escombra(moment) {
    limitGeneral.escombra(moment);
    limitPersonals.escombra(moment);
    limitImatges.escombra(moment);
    for (const [clau, entrada] of cauPersonals) {
      if (moment - entrada.obtingut < OBSOLET_MS) break;
      oblidaPersonal(clau);
    }
    for (const mapa of [imatgesVistes, imatgesPersonals]) {
      for (const [clau, vist] of mapa) {
        if (moment - vist < VIDA_IMATGES_MS) break;
        mapa.delete(clau);
      }
    }
    for (const [clau, desada] of cauImatges) {
      if (moment - desada.obtingut < FRESC_IMATGE_MS) break;
      oblidaImatge(clau);
    }
  }

  /* Torna a baixar, una sola vegada encara que la demanen alhora; desa el que va bé. */
  function refresca(clau, baixada, desa) {
    if (!enVol.has(clau)) {
      const promesa = baixada().then((resultat) => {
        if (!resultat.error) desa(resultat);
        return resultat;
      }).finally(() => enVol.delete(clau));
      enVol.set(clau, promesa);
    }
    return enVol.get(clau);
  }

  /* El feed d'una font del sistema: el fresc; si no, una baixada; si falla, el de reserva (24 h) o l'error. */
  async function feedDe(font) {
    const desat = cau.get(font.id);
    if (desat && ara() - desat.obtingut < FRESC_MS) return { ...desat, obsoleta: false };
    const resultat = await refresca(font.id, () => baixa(font.feed), ({ xml }) => {
      const moment = ara();
      cau.set(font.id, { xml, obtingut: moment });
      recordaImatges(xml, moment, font.lloc);
    });
    if (resultat.xml) return { ...(cau.get(font.id) || { xml: resultat.xml, obtingut: ara() }), obsoleta: false };
    const vell = cau.get(font.id);
    if (vell && ara() - vell.obtingut < OBSOLET_MS) return { ...vell, obsoleta: true };
    if (vell) cau.delete(font.id);
    return { error: resultat.error };
  }

  /* Una font personal (?url=): només per a la mateixa connexió. */
  async function personal(adreca, qui, moment) {
    const vetats = [...vetatsFixos, adreca.hostname];
    const url = adrecaPersonal(adreca.searchParams.get('url'), vetats);
    if (!url) return respostaDError('adreca_vetada');
    const clau = `${qui} ${url.href}`;
    const desat = cauPersonals.get(clau);
    let xml;
    let obsoleta = false;
    if (desat && moment - desat.obtingut < FRESC_MS) {
      xml = desat.xml;
    } else {
      if ((enVolPerQui.get(qui) || 0) >= MAXIM_PERSONALS_PER_QUI || personalsEnVol >= MAXIM_PERSONALS_EN_VOL) return ocupat();
      enVolPerQui.set(qui, (enVolPerQui.get(qui) || 0) + 1);
      personalsEnVol += 1;
      let resultat;
      try {
        resultat = await baixa(url.href, { regles: reglesPersonals(vetats), maxim: MAXIM_BYTES_PERSONAL });
      } finally {
        personalsEnVol -= 1;
        const queden = (enVolPerQui.get(qui) || 1) - 1;
        if (queden > 0) enVolPerQui.set(qui, queden);
        else enVolPerQui.delete(qui);
      }
      if (resultat.xml) {
        xml = resultat.xml;
        desaPersonal(clau, { xml, obtingut: ara() });
        recordaImatgesPersonals(qui, xml, ara(), url.origin);
      } else {
        const vell = cauPersonals.get(clau);
        if (!vell || ara() - vell.obtingut >= OBSOLET_MS) {
          oblidaPersonal(clau);
          return respostaDError(resultat.error);
        }
        xml = vell.xml;
        obsoleta = true;
      }
    }
    /* `obtingut` és l'hora d'esta petició: no diu quan (ni si) la font s'havia baixat abans. */
    return json(200, { url: url.href, xml, obtingut: new Date(moment).toISOString(), obsoleta }, { 'Cache-Control': `private, max-age=${MAX_AGE_S}` });
  }

  /* La resposta d'una imatge bona (de l'origen o de la memòria). */
  const respostaImatge = ({ bytes, tipus }) => new Response(bytes, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': tipus,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': `public, max-age=${MAX_AGE_IMATGE_S}`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Referrer-Policy': 'no-referrer'
    }
  });

  /* Una imatge (?u=). D'un host del catàleg o d'un dels seus CDN, sempre (R6 L-08); d'un altre host,
     només amb l'interruptor encés (R6 L-12) i si ha eixit les últimes 24 h en un feed del sistema
     que esta instància ha baixat o en una font personal d'esta mateixa connexió (R6 L-11). */
  async function imatge(adreca, claus, qui, moment) {
    if (claus.length !== 1 || claus[0] !== 'u') return respostaDError('peticio');
    const vetats = [...vetatsFixos, adreca.hostname];
    const url = adrecaPersonal(adreca.searchParams.get('u'), vetats);
    if (!url) return respostaDError('adreca_vetada');
    const aprovat = hostsAprovats.has(url.hostname);
    if (!aprovat && !ambExternes) return respostaDError('imatge_de_fora');
    const vigent = (vista) => vista !== undefined && moment - vista < VIDA_IMATGES_MS;
    const delSistema = vigent(imatgesVistes.get(url.href));
    if (!aprovat && !delSistema && !vigent(imatgesPersonals.get(`${qui} ${url.href}`))) return respostaDError('imatge_desconeguda');
    if (!aprovat && !teResoledor) return respostaDError('imatge_sense_dns');
    /* La memòria i la baixada compartida, per a tothom només si la imatge és d'un feed del sistema;
       si no, per connexió: una còpia ràpida no ha de dir a ningú què ha demanat una altra. */
    const clau = delSistema ? url.href : `${qui} ${url.href}`;
    const desada = cauImatges.get(clau);
    if (desada && moment - desada.obtingut < FRESC_IMATGE_MS) return respostaImatge(desada);
    const clauDeVol = `imatge:${clau}`;
    if (!enVol.has(clauDeVol) && imatgesEnVol >= MAXIM_IMATGES_EN_VOL && cuaImatges.length >= MAXIM_IMATGES_EN_CUA) return ocupat();
    const resultat = await refresca(clauDeVol, async () => {
      if (!(await tornDImatge())) return { error: 'ocupat' };
      try {
        return await baixa(url.href, { regles: reglesImatge(vetats), maxim: MAXIM_BYTES_IMATGE, accepta: ACCEPTA_IMATGE, llig: lligImatge });
      } finally {
        alliberaImatge();
      }
    }, (bona) => desaImatge(clau, bona));
    if (resultat.error === 'ocupat') return ocupat();
    if (resultat.error) return respostaDError(resultat.error);
    return respostaImatge(resultat);
  }

  async function aten(peticio, info) {
    if (peticio.method === 'OPTIONS') {
      return new Response(null, {
        status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' }
      });
    }
    if (peticio.method !== 'GET') return respostaDError('metode', { Allow: 'GET, OPTIONS' });
    const adreca = new URL(peticio.url);
    const accio = /\/(fonts|feed|imatge)\/?$/.exec(adreca.pathname)?.[1] || null;
    if (!accio) return respostaDError('ruta');
    const moment = ara();
    escombra(moment);
    const limit = accio === 'imatge' ? limitImatges : limitGeneral;
    /* R6 L-05 · Amb la taula mig plena, una IPv6 compta per la seua /48 (clauAmple). */
    const xarxa = clauDeQui(peticio, info);
    const qui = await empremta(limit.pressio() ? clauAmple(xarxa) : xarxa);
    const segons = limit.espera(qui, moment);
    if (segons) return respostaDError('limit', { 'Retry-After': String(segons) });
    const claus = [...adreca.searchParams.keys()];
    if (accio === 'imatge') return imatge(adreca, claus, qui, moment);
    const capcaleraBona = { 'Cache-Control': `public, max-age=${MAX_AGE_S}` };
    if (accio === 'fonts') return claus.length ? respostaDError('peticio') : json(200, publiques, capcaleraBona);
    if (claus.length === 1 && claus[0] === 'url') {
      if (personals !== true) return respostaDError('peticio');
      if (!teResoledor) return respostaDError('personals_sense_dns');
      const espera = limitPersonals.espera(qui, moment);
      if (espera) return respostaDError('limit', { 'Retry-After': String(espera) });
      return personal(adreca, qui, moment);
    }
    if (claus.length !== 1 || claus[0] !== 'font') return respostaDError('peticio');
    const id = adreca.searchParams.get('font');
    const font = PATRO_ID.test(id) && perId.has(id) ? perId.get(id) : null;
    if (!font) return respostaDError('font_desconeguda');
    const resultat = await feedDe(font);
    if (resultat.error) return respostaDError(resultat.error);
    return json(200, {
      font: font.id, xml: resultat.xml, obtingut: new Date(resultat.obtingut).toISOString(), obsoleta: resultat.obsoleta
    }, capcaleraBona);
  }

  return async function gestiona(peticio, info) {
    try {
      return await aten(peticio, info);
    } catch {
      /* Cap error es filtra cap a qui demana (ni la pila ni l'adreça). */
      return respostaDError('intern');
    }
  };
}
