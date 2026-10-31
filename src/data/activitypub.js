/**
 * P1-23 · Pont federat ActivityPub + WebFinger dels pobles, FASE 1: descoberta
 * i lectura. Ordre del Mestre del 30-10-2026 (candidatura NLnet NGI
 * Fediversity, expedient 2026-08-1a6; la subvenció NO està concedida i res
 * d'ací no ho diu).
 *
 * Mòdul pur i determinista: sense imports, sense globals del navegador, sense
 * rellotge. La mateixa lògica servix el servidor de desenvolupament
 * (tooling/vite/federacio-iaia.mjs), el build web (els JSON-LD estàtics de /ap/
 * a dist/, que Firebase publica tal qual) i el generador
 * (tooling/seo/genera-federacio.mjs). L'origen arriba sempre per paràmetre:
 * mai window.location.
 *
 * Esquema d'URL, el mateix a tot arreu (dev, build web i NixOS):
 *   /ap/actors/<slug>.json          l'actor (Organization)
 *   /ap/outbox/<slug>.json          OrderedCollection, ordre cronològic invers
 *   /ap/followers/<slug>.json       col·lecció buida: hui ningú no pot seguir
 *   /ap/objectes/<slug>/<id>.json   cada objecte (Article, Note o Event)
 *   /ap/inbox/<slug>                OrderedCollection buida (GET); rebre-hi és de
 *                                   la fase 2: POST → 405 amb Allow: GET, HEAD, OPTIONS
 *   /.well-known/webfinger?resource=acct:<slug>@<host>
 *                                   només on hi ha servidor (dev, NixOS): un
 *                                   fitxer estàtic no veu ?resource=
 *   /.well-known/host-meta i /.well-known/webfinger/<slug>.json
 *                                   el lloc estàtic (Firebase): la plantilla
 *                                   LRDD que Mastodon consulta quan la consulta
 *                                   de dalt torna 404; només els actors
 *                                   principals (tooling/seo/genera-federacio.mjs)
 *
 * Fonts: ActivityPub (W3C Rec, 23-01-2018) §4.1 (inbox i outbox, MUST) i §5.1
 * (l'outbox és una OrderedCollection en ordre cronològic invers);
 * ActivityStreams 2.0 Vocabulary (Organization, Article, Note, Event, Place,
 * Create, OrderedCollection); RFC 7033 (WebFinger: JRD, paràmetre rel, 400 i
 * 404); RFC 7565 (acct:); docs de Mastodon spec/activitypub i spec/webfinger
 * (subject + rel=self de tipus application/activity+json, comprovació inversa
 * amb preferredUsername@host); NodeInfo 2.1.
 *
 * Tipus d'actor (decisió 3 de l'orquestrador; disseny NLnet A §3.5):
 * Organization. AS2 l'admet; Mastodon el té a SUPPORTED_TYPES i no el tracta
 * ni de bot (Application i Service, sí) ni de grup. El `name` del poble porta
 * «· Sóc de Poble» i el `summary` diu que no és el compte de l'Ajuntament.
 *
 * Què NO fa (fase 2, feina de la subvenció): rebre res a la inbox,
 * Follow/Accept, signatures HTTP, lliurament. Cap clau privada: `publicKey`
 * només ix si qui instal·la en passa una de PÚBLICA.
 *
 * Cap contingut inventat: l'outbox porta només el que li passen (contingut
 * públic real); sense data de publicació real, l'objecte no en porta cap.
 */

export const CONTEXT_AS = 'https://www.w3.org/ns/activitystreams';
export const CONTEXT_SEGURETAT = 'https://w3id.org/security/v1';
export const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';
export const TIPUS_AP = 'application/activity+json';
export const TIPUS_JRD = 'application/jrd+json';
export const REL_PERFIL = 'http://webfinger.net/rel/profile-page';
export const REL_NODEINFO = 'http://nodeinfo.diaspora.software/ns/schema/2.1';
export const PERFIL_NODEINFO = 'http://nodeinfo.diaspora.software/ns/schema/2.1#';
export const TIPUS_ACTOR = Object.freeze(['Organization', 'Service', 'Application', 'Group']);
export const TIPUS_OBJECTE = Object.freeze(['Note', 'Article', 'Event']);
/* slug i id: els noms d'usuari que Mastodon accepta per a comptes remots
   (USERNAME_RE) i un camí net. entrada: tall abans de cap expressió regular.
   recurs: el sostre del paràmetre resource de WebFinger. */
export const LIMITS = Object.freeze({ slug: 64, id: 128, entrada: 256, recurs: 512 });

/* Cada repetició comença per un guionet: cap ambigüitat, temps lineal. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2})$/;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const LLENGUA = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const CAMI_DEL_PERFIL = /^\/(?!\/)[A-Za-z0-9/_.~-]*$/;
const PEM_PUBLICA = /^-----BEGIN PUBLIC KEY-----\n[A-Za-z0-9+/=\n]+-----END PUBLIC KEY-----\n?$/;
/* El resource de WebFinger, ja descodificat de la consulta. URI_GENERAL: la
   forma general d'un URI (RFC 3986: esquema, «:» i només caràcters d'URI o
   %XX). URI_ACCT: acct:usuari@host (RFC 7565), amb el port tolerat per al
   servidor de desenvolupament. «%» i «@» no són de cap classe: cap alternativa
   ambigua, temps lineal. */
const URI_GENERAL = /^[A-Za-z][A-Za-z0-9+.-]*:(?:[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=-]|%[0-9A-Fa-f]{2})*$/;
const URI_ACCT = /^acct:((?:[A-Za-z0-9._~!$&'()*+,;=-]|%[0-9A-Fa-f]{2})+)@((?:[A-Za-z0-9._~!$&'()*+,;=:[\]-]|%[0-9A-Fa-f]{2})+)$/i;
const VERSIO = /^\d+\.\d+\.\d+$/;
/* Per extensió, mai fix (defecte 9 del codi de Gemini: image/webp per a tot).
   Sense SVG: Mastodon no l'admet com a avatar. Extensió desconeguda: sense
   mediaType. */
const TIPUS_IMATGE = Object.freeze({
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif'
});
const ESCAPA = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' });

const esLoopback = (nom) => nom === 'localhost' || nom.endsWith('.localhost') || nom === '127.0.0.1' || nom === '[::1]';
const tall = (valor) => String(valor).slice(0, 80);

/* Sense claus buides a l'eixida (defecte 9: claus undefined). Una llista buida
   sí que hi és: orderedItems [] diu «cap element». */
const net = (objecte) => Object.fromEntries(Object.entries(objecte).filter(([, valor]) => valor !== undefined && valor !== null && valor !== ''));

/**
 * L'origen públic normalitzat (esquema://host[:port], sense barra final):
 * https sempre, o http només en loopback (el servidor de desenvolupament).
 * Sense camí, consulta, fragment ni credencials. Llança TypeError si no.
 */
export function normalitzaOrigen(origen) {
  let url = null;
  try { url = new URL(String(origen ?? '')); } catch { url = null; }
  const net = url && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/';
  if (net && (url.protocol === 'https:' || (url.protocol === 'http:' && esLoopback(url.hostname)))) return url.origin;
  throw new TypeError(`Origen federat invàlid (cal https://host, o http:// en loopback): ${tall(origen)}`);
}

/**
 * El slug federat d'un municipi a partir del seu nom o identificador:
 * minúscules ASCII, sense diacrítics, guionets entre paraules i cap guionet
 * als extrems («La Torre de les Maçanes» → «la-torre-de-les-macanes»,
 * «Penàguila» → «penaguila», «Gel·la» → «gella»). '' si no en queda cap de
 * vàlid o si l'entrada passa de LIMITS.entrada (es talla abans de cap regex) o
 * el slug de LIMITS.slug (no es retalla: dos noms llargs no han de col·lidir).
 */
export function normalitzaSlugMunicipi(valor) {
  if (typeof valor !== 'string' && typeof valor !== 'number') return '';
  const text = String(valor);
  if (text.length > LIMITS.entrada) return '';
  const slug = text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[·∙]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.length <= LIMITS.slug && SLUG.test(slug) ? slug : '';
}

/** Cert si `valor` ja és un slug federat (la forma que torna normalitzaSlugMunicipi). */
export function esSlugFederat(valor) {
  return typeof valor === 'string' && valor.length <= LIMITS.slug && SLUG.test(valor);
}

function slugValid(slug) {
  if (!esSlugFederat(slug)) throw new TypeError(`Slug federat invàlid: ${tall(slug)}`);
  return slug;
}

function urlDelPerfil(perfil, base, slug) {
  const cami = perfil ?? `/pobles/${slug}`;
  if (typeof cami !== 'string' || cami.length > LIMITS.entrada || !CAMI_DEL_PERFIL.test(cami)
    || cami.split('/').some((tros) => tros === '.' || tros === '..')) {
    throw new TypeError(`Camí del perfil invàlid (cal un camí absolut del mateix origen): ${tall(cami)}`);
  }
  return `${base}${cami}`;
}

/**
 * Totes les adreces federades d'un actor (un poble o el projecte). `slug` ha
 * de ser ja un slug federat (normalitzaSlugMunicipi abans, si cal): cap
 * reassignació silenciosa. `perfil` és el camí de la seua pàgina HTML pública
 * (per defecte /pobles/<slug>). Llança TypeError amb un slug, un origen o un
 * perfil invàlids.
 */
export function urlsDeMunicipi(slug, { origen, perfil } = {}) {
  const s = slugValid(slug);
  const base = normalitzaOrigen(origen);
  const acct = `acct:${s}@${new URL(base).host}`;
  return Object.freeze({
    actor: `${base}/ap/actors/${s}.json`,
    outbox: `${base}/ap/outbox/${s}.json`,
    followers: `${base}/ap/followers/${s}.json`,
    inbox: `${base}/ap/inbox/${s}`,
    objectes: `${base}/ap/objectes/${s}/`,
    perfil: urlDelPerfil(perfil, base, s),
    acct,
    webfinger: `${base}/.well-known/webfinger?resource=${encodeURIComponent(acct)}`
  });
}

/* ── Text ─────────────────────────────────────────────────────────────── */

const netejaText = (valor) => (typeof valor === 'string' ? valor.replace(/\r\n?/g, '\n').replace(CONTROL, '') : '');

/** Text pla d'una línia: sense caràcters de control i amb els blancs plegats. */
export function textPla(valor) {
  return netejaText(valor).replace(/\s+/g, ' ').trim();
}

/** Escapa &, <, >, " i ' per a posar text dins d'HTML. */
export function escapaHtml(text) {
  return String(text).replace(/[&<>"']/g, (caracter) => ESCAPA[caracter]);
}

/**
 * L'HTML del `content` o del `summary` a partir de TEXT PLA (mai d'HTML
 * d'origen): cada bloc separat per una línia en blanc és un <p>, i cada salt
 * de línia dins del bloc, un <br>. Tot escapat. '' si no hi ha text.
 */
export function htmlDeText(valor) {
  const paragrafs = [];
  let actual = [];
  for (const linia of netejaText(valor).split('\n')) {
    const neta = linia.replace(/\s+/g, ' ').trim();
    if (neta) actual.push(escapaHtml(neta));
    else if (actual.length) { paragrafs.push(actual); actual = []; }
  }
  if (actual.length) paragrafs.push(actual);
  return paragrafs.map((linies) => `<p>${linies.join('<br>')}</p>`).join('');
}

/* Les parts d'una data xsd:dateTime amb zona, validades, o null: el dia i
   l'hora tal com venen, la fracció de segon en la forma canònica d'xsd:dateTime
   (sense zeros al final; '' si no n'hi ha o si tota és zero) i l'instant UTC
   en mil·lisegons de segons sencers (la fracció va a banda: un Number no en
   guarda els nanosegons). */
function partsDeData(valor) {
  if (typeof valor !== 'string' || valor.length > 40) return null;
  const m = DATA_ISO.exec(valor);
  if (!m) return null;
  const [, a, me, d, h, mi, s = '00', fraccio = '', zona] = m;
  const [any, mes, dia, hora, minut, segon] = [a, me, d, h, mi, s].map(Number);
  const local = Date.UTC(any, mes - 1, dia, hora, minut, segon);
  const comprova = new Date(local);
  if (comprova.getUTCFullYear() !== any || comprova.getUTCMonth() !== mes - 1 || comprova.getUTCDate() !== dia
    || hora > 23 || minut > 59 || segon > 59) return null;
  let desplacament = 0;
  if (zona !== 'Z') {
    const [hz, mz] = [Number(zona.slice(1, 3)), Number(zona.slice(4, 6))];
    if (hz > 23 || mz > 59) return null;
    desplacament = (zona[0] === '-' ? -1 : 1) * (hz * 60 + mz);
  }
  return { a, me, d, h, mi, s, fraccio: fraccio.replace(/0+$/, ''), zona, instant: local - desplacament * 60000 };
}

/**
 * Una data xsd:dateTime amb zona (Z o ±hh:mm), validada de veres (V8 accepta
 * el 30 de febrer i el passa al 2 de març). Per defecte torna l'instant en UTC
 * (2026-08-20T00:00:00Z); amb conservaDesplacament, l'hora local tal com ve
 * (l'hora d'un acte a Europe/Madrid es llig millor amb el seu +01:00). null si
 * no és vàlida: mai una data per defecte inventada (defecte 9).
 * Gauntlet 261030 (C8 de Codex) · Les fraccions de segon es conserven en els
 * dos modes, en la forma canònica d'xsd:dateTime (sense zeros al final; .000
 * no n'escriu cap): abans es perdien, .123Z i .987Z eren el mateix instant i
 * una edició dins del mateix segon no tenia dateModified. Per a comparar-les,
 * comparaInstants (mai Date.parse, que talla als mil·lisegons, ni el text).
 */
export function dataIso(valor, { conservaDesplacament = false } = {}) {
  const parts = partsDeData(valor);
  if (!parts) return null;
  const { a, me, d, h, mi, s, zona, instant } = parts;
  const fraccio = parts.fraccio ? `.${parts.fraccio}` : '';
  if (conservaDesplacament) return `${a}-${me}-${d}T${h}:${mi}:${s}${fraccio}${zona}`;
  return `${new Date(instant).toISOString().slice(0, -'.000Z'.length)}${fraccio}Z`;
}

/**
 * Compara dos instants que dataIso admet (amb zona, amb fracció de segon o
 * sense) sense truncar-los: primer el segon UTC i després la fracció, fins al
 * nanosegon. El text no servix ('…:00Z' va darrere de '…:00.5Z' en ordre de
 * caràcters) i Date.parse talla als mil·lisegons. Negatiu si `a` és anterior,
 * 0 si és el mateix instant (també en una altra zona), positiu si és
 * posterior, i NaN si algun no és una data vàlida.
 */
export function comparaInstants(a, b) {
  const [pa, pb] = [partsDeData(a), partsDeData(b)];
  if (!pa || !pb) return Number.NaN;
  if (pa.instant !== pb.instant) return pa.instant < pb.instant ? -1 : 1;
  const [fa, fb] = [pa.fraccio.padEnd(9, '0'), pb.fraccio.padEnd(9, '0')];
  return fa < fb ? -1 : fa > fb ? 1 : 0;
}

/** L'URL absoluta (https, o http en loopback) sense credencials, o null. */
function urlPublica(valor) {
  let url = null;
  try { url = new URL(String(valor)); } catch { return null; }
  if (url.username || url.password) return null;
  return url.protocol === 'https:' || (url.protocol === 'http:' && esLoopback(url.hostname)) ? url.href : null;
}

/** El mediaType d'una imatge per l'extensió del camí, o null si no es coneix. */
export function tipusDImatge(url) {
  let cami = '';
  try { cami = new URL(String(url)).pathname; } catch { return null; }
  const extensio = /\.([a-z0-9]{1,5})$/i.exec(cami)?.[1]?.toLowerCase();
  return (extensio && TIPUS_IMATGE[extensio]) || null;
}

/* ── WebFinger (RFC 7033) ─────────────────────────────────────────────── */

const descriptors = (municipis) => {
  const coneguts = new Map();
  for (const m of Array.isArray(municipis) ? municipis : []) {
    const descriptor = typeof m === 'string' ? { slug: m } : m;
    if (esSlugFederat(descriptor?.slug)) coneguts.set(descriptor.slug, descriptor);
  }
  return coneguts;
};

/**
 * La forma del paràmetre resource de WebFinger, ja descodificat de la
 * consulta. null si és malformat (absent, de més de LIMITS.recurs caràcters,
 * sense esquema, amb caràcters que cap URI no porta, o un acct: sense
 * usuari@host): l'RFC 7033 §4.2 mana respondre-ho amb 400. Si no,
 * { esquema: 'acct', usuari, host } (usuari descodificat i en minúscules,
 * host en minúscules) o { esquema, uri } per a un altre esquema. Ben format no
 * vol dir d'este servidor: això ho decidix construeixWebFinger (404).
 */
export function analitzaRecursWebFinger(resource) {
  if (typeof resource !== 'string' || !resource || resource.length > LIMITS.recurs || !URI_GENERAL.test(resource)) return null;
  const esquema = resource.slice(0, resource.indexOf(':')).toLowerCase();
  if (esquema !== 'acct') return { esquema, uri: resource };
  const compte = URI_ACCT.exec(resource);
  if (!compte) return null;
  let usuari = '';
  try { usuari = decodeURIComponent(compte[1]); } catch { return null; }
  return { esquema, usuari: usuari.toLowerCase(), host: compte[2].toLowerCase() };
}

/**
 * Els àlies d'usuari de WebFinger dels actors, com a Map àlies → slug. Un
 * descriptor pot portar `alies`: altres noms d'usuari (slugs federats) que
 * resolen al MATEIX actor (ordre del Mestre del 30-10-2026:
 * @latorredelesmacanes@socdepoble.org per a @la-torre-de-les-macanes). El
 * JRD d'un àlies és el de l'actor, amb el subject canònic: Mastodon
 * (app/services/resolve_account_service.rb) veu que el subject no és el que ha
 * demanat i torna a preguntar pel canònic. Llança TypeError si un àlies no és
 * un slug federat, si és el slug d'un altre actor o si dos actors el
 * reclamen: mai el JRD d'un compte per a un altre.
 */
export function aliesWebFinger(municipis) {
  const coneguts = descriptors(municipis);
  const alies = new Map();
  for (const [slug, descriptor] of coneguts) {
    const llista = descriptor.alies ?? [];
    if (!Array.isArray(llista)) throw new TypeError(`Els àlies de WebFinger de ${slug} han de ser una llista.`);
    for (const nom of llista) {
      if (!esSlugFederat(nom)) throw new TypeError(`Àlies de WebFinger invàlid per a ${slug}: ${tall(nom)}`);
      if (coneguts.has(nom) || alies.has(nom)) throw new TypeError(`Àlies de WebFinger repetit o d'un altre actor: ${nom}`);
      alies.set(nom, slug);
    }
  }
  return alies;
}

/**
 * El JRD de WebFinger d'un actor conegut, o null (recurs malformat —vegeu
 * analitzaRecursWebFinger—, d'un altre host, d'un esquema que no és acct: ni
 * l'URL de l'actor o del perfil, o d'un slug que no és a `municipis`).
 * `municipis`: els actors publicats (slugs o descriptors { slug, perfil }),
 * pobles i projecte. `rel` (RFC 7033 §4.3): si n'hi ha, només ixen eixos
 * enllaços (subject i aliases, sempre). L'usuari es compara en minúscules (com
 * Mastodon, que compara el subject sense caixa); el host, amb el de l'origen
 * (amb port si no és el per defecte: en desenvolupament,
 * acct:<slug>@localhost:3340, que l'RFC 7565 no preveu però Mastodon en dev sí
 * que fa servir). Un acct: amb un àlies (aliesWebFinger) torna el JRD del seu
 * actor, amb el subject canònic.
 */
export function construeixWebFinger(resource, { origen, municipis = [], rel } = {}) {
  const recurs = analitzaRecursWebFinger(resource);
  if (!recurs) return null;
  const base = normalitzaOrigen(origen);
  const host = new URL(base).host;
  const coneguts = descriptors(municipis);
  let slug = null;
  if (recurs.esquema === 'acct') {
    if (recurs.host !== host) return null;
    slug = coneguts.has(recurs.usuari) ? recurs.usuari : aliesWebFinger(municipis).get(recurs.usuari) ?? null;
  } else {
    for (const [s, descriptor] of coneguts) {
      const urls = urlsDeMunicipi(s, { origen: base, perfil: descriptor.perfil });
      if (resource === urls.actor || resource === urls.perfil) { slug = s; break; }
    }
  }
  if (!slug || !coneguts.has(slug)) return null;
  const urls = urlsDeMunicipi(slug, { origen: base, perfil: coneguts.get(slug).perfil });
  const enllacos = [
    { rel: 'self', type: TIPUS_AP, href: urls.actor },
    { rel: REL_PERFIL, type: 'text/html', href: urls.perfil }
  ];
  const rels = (Array.isArray(rel) ? rel : rel === undefined || rel === null ? [] : [rel]).filter((r) => typeof r === 'string' && r);
  return {
    subject: urls.acct,
    aliases: [urls.actor, urls.perfil],
    links: rels.length ? enllacos.filter((enllac) => rels.includes(enllac.rel)) : enllacos
  };
}

/* ── Actor, objectes i col·leccions (ActivityStreams 2.0) ─────────────── */

/**
 * L'actor d'un poble o del projecte. descriptor: { slug, nom, resum (text pla,
 * o llista de paràgrafs), perfil (camí de la pàgina pública), tipus
 * (Organization per defecte), icona (URL; el mediaType ix de l'extensió),
 * clauPublicaPem (opcional; només una clau PÚBLICA en PEM) }. Sense `published`
 * (defecte 9: cap data fixa inventada).
 */
export function construeixActor(descriptor = {}, { origen } = {}) {
  const { slug, nom, resum, perfil, tipus = 'Organization', icona, clauPublicaPem } = descriptor ?? {};
  const urls = urlsDeMunicipi(slug, { origen, perfil });
  if (!TIPUS_ACTOR.includes(tipus)) throw new TypeError(`Tipus d'actor no admés: ${tall(tipus)}`);
  const nomNet = textPla(nom);
  if (!nomNet) throw new TypeError(`L'actor ${slug} necessita un nom.`);
  let pem = null;
  if (clauPublicaPem !== undefined && clauPublicaPem !== null) {
    if (typeof clauPublicaPem !== 'string' || clauPublicaPem.length > 4096 || !PEM_PUBLICA.test(clauPublicaPem)) {
      throw new TypeError(`La clau de l'actor ${slug} ha de ser una clau PÚBLICA en PEM.`);
    }
    pem = clauPublicaPem;
  }
  let icon;
  if (icona !== undefined && icona !== null) {
    const url = urlPublica(typeof icona === 'string' ? icona : icona?.url);
    if (!url) throw new TypeError(`Icona invàlida per a l'actor ${slug}.`);
    icon = net({ type: 'Image', mediaType: tipusDImatge(url), url });
  }
  return net({
    '@context': pem ? [CONTEXT_AS, CONTEXT_SEGURETAT] : CONTEXT_AS,
    id: urls.actor,
    type: tipus,
    preferredUsername: urls.acct.slice(5, urls.acct.indexOf('@')),
    name: nomNet,
    summary: htmlDeText(Array.isArray(resum) ? resum.join('\n\n') : resum),
    url: urls.perfil,
    inbox: urls.inbox,
    outbox: urls.outbox,
    followers: urls.followers,
    icon,
    publicKey: pem ? { id: `${urls.actor}#main-key`, owner: urls.actor, publicKeyPem: pem } : undefined
  });
}

/* Ordre cronològic invers, amb la fracció de segon sencera (comparaInstants);
   sense data, darrere; a igual instant, per id. */
const ordreCronologicInvers = (a, b) => {
  if (Boolean(a.published) !== Boolean(b.published)) return a.published ? -1 : 1;
  const ordre = a.published ? comparaInstants(b.published, a.published) : 0;
  if (ordre) return ordre;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

function dataOpcional(valor, camp, id) {
  if (valor === undefined || valor === null) return null;
  const data = dataIso(valor);
  if (!data) throw new TypeError(`Data invàlida a ${camp} de ${id}: ${tall(valor)}`);
  return data;
}

/**
 * Els objectes AS2 d'un actor, en ordre cronològic invers. Cada element:
 * { id (estable i únic: [a-z0-9-], 128 com a molt), tipus ('Note', 'Article'
 * o 'Event'), nom, text (el cos, TEXT PLA: ix com a content), resum (TEXT PLA:
 * l'entradeta d'un Article o d'un Event, ix com a summary), url, publicat i
 * actualitzat (ISO amb zona), llengua (BCP 47 curt, p. ex. 'ca': contentMap i
 * summaryMap), i per a un Event inici (obligatori), fi i lloc: { nom } (només
 * si és real) }. Tot s'escapa. Un element mal format llança TypeError: res no
 * ix a mitges.
 *
 * Per què l'entradeta va a summary: Mastodon (app/lib/activitypub/activity.rb,
 * CONVERTED_TYPES) convertix un Article o un Event en un estat amb el name, el
 * summary i l'enllaç, i NO en mostra el content. En una Note, en canvi, el
 * summary és un avís de contingut que amaga el text: una Note no en porta.
 */
export function construeixObjectes(slug, elements = [], { origen, perfil } = {}) {
  const urls = urlsDeMunicipi(slug, { origen, perfil });
  if (!Array.isArray(elements)) throw new TypeError('Els elements de l’outbox han de ser una llista.');
  const vistos = new Set();
  return elements.map((element) => {
    const id = element?.id;
    if (typeof id !== 'string' || id.length > LIMITS.id || !SLUG.test(id)) throw new TypeError(`Identificador d'objecte invàlid: ${tall(id)}`);
    if (vistos.has(id)) throw new TypeError(`Identificador d'objecte repetit: ${id}`);
    vistos.add(id);
    const { tipus } = element;
    if (!TIPUS_OBJECTE.includes(tipus)) throw new TypeError(`Tipus d'objecte no admés a ${id}: ${tall(tipus)}`);
    const nom = textPla(element.nom);
    let contingut = htmlDeText(element.text);
    const resum = htmlDeText(element.resum);
    if (tipus === 'Note' && resum) throw new TypeError(`Una Note no porta resum (Mastodon el mostra com a avís de contingut): ${id}`);
    if (tipus === 'Note' && nom) contingut = `<p><strong>${escapaHtml(nom)}</strong></p>${contingut}`;
    if (tipus === 'Note' && !contingut) throw new TypeError(`Una Note necessita text: ${id}`);
    if (tipus !== 'Note' && !nom) throw new TypeError(`Un ${tipus} necessita nom: ${id}`);
    let url = null;
    if (element.url !== undefined && element.url !== null) {
      url = urlPublica(element.url);
      if (!url) throw new TypeError(`URL invàlida a ${id}.`);
    }
    if (element.llengua !== undefined && (typeof element.llengua !== 'string' || !LLENGUA.test(element.llengua))) {
      throw new TypeError(`Llengua invàlida a ${id}: ${tall(element.llengua)}`);
    }
    let inici = null;
    let fi = null;
    let lloc = null;
    if (tipus === 'Event') {
      inici = dataIso(element.inici, { conservaDesplacament: true });
      if (!inici) throw new TypeError(`Un Event necessita una hora d'inici ISO amb zona: ${id}`);
      if (element.fi !== undefined && element.fi !== null) {
        fi = dataIso(element.fi, { conservaDesplacament: true });
        if (!fi || comparaInstants(fi, inici) < 0) throw new TypeError(`Hora de fi invàlida a ${id}.`);
      }
      const nomDelLloc = textPla(element.lloc?.nom);
      if (nomDelLloc) lloc = { type: 'Place', name: nomDelLloc };
    }
    return net({
      id: `${urls.objectes}${id}.json`,
      type: tipus,
      attributedTo: urls.actor,
      name: tipus === 'Note' ? undefined : nom,
      summary: resum,
      summaryMap: resum && element.llengua ? { [element.llengua]: resum } : undefined,
      content: contingut,
      contentMap: contingut && element.llengua ? { [element.llengua]: contingut } : undefined,
      url,
      published: dataOpcional(element.publicat, 'publicat', id),
      updated: dataOpcional(element.actualitzat, 'actualitzat', id),
      startTime: inici,
      endTime: fi,
      location: lloc,
      to: [PUBLIC],
      cc: [urls.followers]
    });
  }).sort(ordreCronologicInvers);
}

/**
 * L'outbox (ActivityPub §5.1): una OrderedCollection amb un Create per objecte,
 * en ordre cronològic invers, ids estables (<objecte>#create) i públics.
 * Sense elements, totalItems 0 i orderedItems [].
 */
export function construeixOutbox(slug, elements = [], { origen, perfil } = {}) {
  const urls = urlsDeMunicipi(slug, { origen, perfil });
  const activitats = construeixObjectes(slug, elements, { origen, perfil }).map((objecte) => net({
    id: `${objecte.id}#create`,
    type: 'Create',
    actor: urls.actor,
    published: objecte.published,
    to: [PUBLIC],
    cc: [urls.followers],
    object: objecte
  }));
  return { '@context': CONTEXT_AS, id: urls.outbox, type: 'OrderedCollection', totalItems: activitats.length, orderedItems: activitats };
}

/** Els seguidors: buida i honesta. Sense inbox (fase 2) ningú no pot seguir. */
export function construeixFollowers(slug, { origen, perfil } = {}) {
  const urls = urlsDeMunicipi(slug, { origen, perfil });
  return { '@context': CONTEXT_AS, id: urls.followers, type: 'OrderedCollection', totalItems: 0, orderedItems: [] };
}

/**
 * La inbox per a llegir-la (ActivityPub §5.2: una OrderedCollection): buida i
 * certa, perquè en la fase 1 no es rep res. Rebre-hi (POST) és de la fase 2:
 * els servidors (dev i NixOS) responen 405 amb Allow: GET, HEAD, OPTIONS
 * (RFC 9110 §15.5.6).
 */
export function construeixInbox(slug, { origen, perfil } = {}) {
  const urls = urlsDeMunicipi(slug, { origen, perfil });
  return { '@context': CONTEXT_AS, id: urls.inbox, type: 'OrderedCollection', totalItems: 0, orderedItems: [] };
}

/* ── NodeInfo 2.1 (descobriment per /.well-known/nodeinfo) ────────────── */

/** El document de descobriment de /.well-known/nodeinfo. */
export function construeixEnllacosNodeInfo({ origen } = {}) {
  return { links: [{ rel: REL_NODEINFO, href: `${normalitzaOrigen(origen)}/nodeinfo/2.1.json` }] };
}

/**
 * NodeInfo 2.1. openRegistrations és fals perquè en este node no es pot crear
 * cap compte federat (cap actor Person); usage.users va buit a propòsit: no es
 * publica el nombre de persones.
 */
export function construeixNodeInfo({ origen, versio } = {}) {
  const base = normalitzaOrigen(origen);
  if (typeof versio !== 'string' || !VERSIO.test(versio)) throw new TypeError(`Versió invàlida per a NodeInfo: ${tall(versio)}`);
  return {
    version: '2.1',
    software: { name: 'socdepoble', version: versio, homepage: `${base}/` },
    protocols: ['activitypub'],
    services: { inbound: [], outbound: [] },
    openRegistrations: false,
    usage: { users: {} },
    metadata: { nodeName: 'Sóc de Poble', federacio: 'fase 1: descoberta i lectura; sense inbox' }
  };
}

/* ── Els fitxers federats ─────────────────────────────────────────────── */

/**
 * Tots els documents federats dels actors, com a Map de camí relatiu
 * (ap/actors/<slug>.json, ap/outbox/…, ap/followers/…, ap/inbox/<slug> —sense
 * extensió: és l'URL que l'actor declara—, ap/objectes/<slug>/<id>.json)
 * → objecte JSON-LD, ordenat per camí. El mateix mapa servix el servidor de
 * desenvolupament (per petició) i el build (un fitxer per entrada). actors:
 * [{ slug, nom, resum, perfil, tipus, icona, clauPublicaPem, elements }].
 */
export function construeixFitxersFederats({ origen, actors = [] } = {}) {
  const base = normalitzaOrigen(origen);
  const relatiu = (url) => url.slice(base.length + 1);
  const fitxers = new Map();
  const afegeix = (cami, document) => {
    if (fitxers.has(cami)) throw new TypeError(`Camí federat repetit: ${cami}`);
    fitxers.set(cami, document);
  };
  const slugs = new Set();
  for (const actor of Array.isArray(actors) ? actors : []) {
    const slug = slugValid(actor?.slug);
    if (slugs.has(slug)) throw new TypeError(`Actor federat repetit: ${slug}`);
    slugs.add(slug);
    const opcions = { origen: base, perfil: actor.perfil };
    const document = construeixActor(actor, { origen: base });
    const outbox = construeixOutbox(slug, actor.elements ?? [], opcions);
    const seguidors = construeixFollowers(slug, opcions);
    const inbox = construeixInbox(slug, opcions);
    afegeix(relatiu(document.id), document);
    afegeix(relatiu(outbox.id), outbox);
    afegeix(relatiu(seguidors.id), seguidors);
    afegeix(relatiu(inbox.id), inbox);
    for (const { object } of outbox.orderedItems) afegeix(relatiu(object.id), { '@context': CONTEXT_AS, ...object });
  }
  return new Map([...fitxers].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/** La forma de cada fitxer: JSON indentat amb salt de línia final (bytes estables). */
export function serialitzaJson(document) {
  return `${JSON.stringify(document, null, 2)}\n`;
}
