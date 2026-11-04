/** FEDI-03 · Extracte públic contrastat, no és cap fitxa de memòria oral.
 * Les dades externes són metadades factuals i resums amb font, sense atribuir
 * una llicència que la font no declara. No es lligen notes ni comptes privats.
 * L'Aplec de 2023 es va celebrar a Benillup: no es reubica a La Torre.
 */
import { textDeCos, jsonCanonic } from '../../src/data/exportaMunicipiOpenData.js';
import { createHash } from 'node:crypto';

export const MUNICIPI_SNAPSHOT = Object.freeze({ slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' });
export const FONTS_SNAPSHOT = Object.freeze({
  noticia: 'https://socdepoble.org/mur/node-zero-mac-mini-m4',
  agenda: 'https://www.torremanzanas.es/eventos/etiqueta/casa-alta/mes/',
  memoria: 'https://rentonar.blogspot.com/2016/04/campanya-dajuda-als-refugiats-de-guerra.html',
});
const CLAUS = ['id', 'title', 'subtitle', 'entradilla', 'lead', 'body', 'content', 'created_at', 'updated_at', 'image_url', 'author_entity_id', 'author_org_id', 'poble_id', 'town_name', 'location', 'copyright'];
const PUBLICATS = new Set(['published', 'publicat', 'publicada']);
const pla = x => x !== null && typeof x === 'object' && !Array.isArray(x) && [Object.prototype, null].includes(Object.getPrototypeOf(x));
const claus = (x, permeses) => pla(x) && Object.keys(x).every(k => permeses.includes(k));
const CAMPS_TEXT = ['title', 'subtitle', 'entradilla', 'lead', 'body'];
const CAMPS_CURACIO = ['tipus', 'fontCapturadaEl', 'elaboratEl', 'fontTextSha256', 'textCuratSha256', 'criteri', 'observacions'];
const RELAT_ANTIC = /tercer\s+node|tres\s+nodes\s+actius|connectat\s+a\s+(?:https?:\/\/)?socdepoble\.cat|hem\s+posat\s+en\s+marxa/iu;
const instant = x => typeof x === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(x) && Number.isFinite(Date.parse(x))
  && new Date(x).toISOString().replace('.000Z', 'Z') === x.replace('.000Z', 'Z');
const hash = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const textCuracio = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 2000;
function urlDeContrast(x) {
  try {
    const u = new URL(x);
    return typeof x === 'string' && ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password && !u.port && !u.search && !u.hash
      && u.pathname === '/' && (['socdepoble.org', 'gentdelatorre.net', 'socdepoble.cat'].includes(u.hostname)
        || /^[a-z0-9-]+\.trycloudflare\.com$/.test(u.hostname));
  } catch { return false; }
}

/** Empremta del text públic normalitzat; no incorpora identitats de persones.
 * L'editor l'aporta en curar: una font canviada obliga a revisar el resum.
 */
export function empremtaTextNoticia(noticia) {
  const text = Object.fromEntries(CAMPS_TEXT.filter(k => typeof noticia[k] === 'string').map(k => [k, k === 'body' ? textDeCos(noticia[k]) : noticia[k]]));
  return createHash('sha256').update(jsonCanonic(text)).digest('hex');
}

function validaCuracio(curacio, noticia, ara) {
  const falla = () => { throw new TypeError('Curació editorial pública invàlida o sense procedència coherent.'); };
  if (!claus(curacio, CAMPS_CURACIO) || curacio.tipus !== 'resum-editorial-contrastat'
    || !instant(curacio.fontCapturadaEl) || !instant(curacio.elaboratEl) || !instant(ara)
    || Date.parse(curacio.fontCapturadaEl) > Date.parse(curacio.elaboratEl) || Date.parse(curacio.elaboratEl) > Date.parse(ara)
    || !hash(curacio.fontTextSha256) || !hash(curacio.textCuratSha256) || !textCuracio(curacio.criteri)
    || curacio.textCuratSha256 !== empremtaTextNoticia(noticia)
    || !Array.isArray(curacio.observacions) || curacio.observacions.length < 1 || curacio.observacions.length > 8) falla();
  for (const o of curacio.observacions) {
    if (!claus(o, ['url', 'consultatEl', 'httpStatus', 'error', 'redireccio']) || !urlDeContrast(o.url)
      || !instant(o.consultatEl) || Date.parse(o.consultatEl) > Date.parse(curacio.elaboratEl)
      || (Object.hasOwn(o, 'httpStatus') === Object.hasOwn(o, 'error'))
      || (Object.hasOwn(o, 'httpStatus') && (!Number.isInteger(o.httpStatus) || o.httpStatus < 100 || o.httpStatus > 599))
      || (Object.hasOwn(o, 'error') && !['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'AbortError', 'TimeoutError'].includes(o.error))
      || (Object.hasOwn(o, 'redireccio') && (![301, 302, 303, 307, 308].includes(o.httpStatus) || !urlDeContrast(o.redireccio)))) falla();
  }
}
const publicable = x => x && typeof x === 'object' && !Array.isArray(x)
  && (!Object.hasOwn(x, 'visibility') || x.visibility === 'public')
  && (!Object.hasOwn(x, 'status') || PUBLICATS.has(x.status))
  && !Object.hasOwn(x, 'owner_user_id') && !Object.hasOwn(x, 'ownerUserId')
  && (x.author_entity_id || x.author_org_id);

/** La notícia Node 0 ja és pública i el text situa el servidor a La Torre.
 * L'enriquiment de lloc és explícit i restringit a este document contrastat;
 * mai s'usa el poble de l'autor per a reassignar altres continguts.
 */
export function preparaSnapshotOpenDataPublic({ feedPosts, events, ara, curacioNoticia = null }) {
  if (!Array.isArray(feedPosts) || !Array.isArray(events)) throw new TypeError('Calen les dues col·leccions públiques completes.');
  if (feedPosts.length > 10000 || events.length > 10000) throw new RangeError('Massa elements públics; no es retalla cap font.');
  const trobades = feedPosts.filter(x => publicable(x) && x.id === 'node-zero-mac-mini-m4' && x.author_entity_id === 'socdepoble');
  if (trobades.length !== 1) throw new TypeError('La notícia pública contrastada de Node 0 falta o està duplicada.');
  const original = trobades[0];
  const cos = textDeCos(original.body || original.content);
  if (!cos.includes(MUNICIPI_SNAPSHOT.nom) || !original.title) throw new TypeError('La notícia ja no acredita el lloc ni el títol contrastats.');
  const noticia = Object.fromEntries(CLAUS.filter(k => Object.hasOwn(original, k) && typeof original[k] === 'string').map(k => [k, original[k]]));
  noticia.poble_id = MUNICIPI_SNAPSHOT.slug;
  noticia.visibility = 'public';
  noticia.body = cos;
  delete noticia.content;
  let curacio;
  if (curacioNoticia !== null) {
    if (!claus(curacioNoticia, [...CAMPS_CURACIO.filter(k => k !== 'textCuratSha256'), 'textos'])
      || !claus(curacioNoticia.textos, ['subtitle', 'entradilla', 'lead', 'body'])
      || ['subtitle', 'entradilla', 'lead', 'body'].some(k => typeof curacioNoticia.textos[k] !== 'string' || !curacioNoticia.textos[k].trim())) {
      throw new TypeError('Calen els quatre camps editorials i la procedència de la curació.');
    }
    if (curacioNoticia.fontTextSha256 !== empremtaTextNoticia(noticia)) throw new TypeError('La font pública ha canviat; revisa la curació abans de publicar-la.');
    const { textos, ...procedencia } = curacioNoticia;
    Object.assign(noticia, textos);
    curacio = procedencia;
  }
  noticia.body += `\n\n${curacio ? 'Font pública original' : 'Font pública'}: ${FONTS_SNAPSHOT.noticia}`;
  if (curacio) {
    curacio.textCuratSha256 = empremtaTextNoticia(noticia);
    validaCuracio(curacio, noticia, ara);
  }
  const entrada = {
    municipi: { ...MUNICIPI_SNAPSHOT }, ara, origen: 'https://socdepoble.org', actorsPublicats: [],
    entitats: [
      { id: 'socdepoble', slug: 'socdepoble', name: 'Sóc de Poble', kind: 'entity', town_name: MUNICIPI_SNAPSHOT.nom, visibility: 'public' },
      { id: 'ajuntament-la-torre-de-les-macanes', name: 'Ajuntament de La Torre de les Maçanes', kind: 'entity', town_name: MUNICIPI_SNAPSHOT.nom, visibility: 'public' },
      { id: 'rentonar', slug: 'rentonar', name: 'Associació El Rentonar', kind: 'entity', town_name: MUNICIPI_SNAPSHOT.nom, visibility: 'public' },
    ],
    noticies: [noticia],
    agenda: [{
      id: 'casa-alta-exposicio-2023-11-26', title: 'Exposició Casa Alta',
      entradilla: `Acte històric de l’agenda municipal: exposició a la Casa Alta el 26 de novembre de 2023, de 10.30 a 13.30 h. Font pública municipal: ${FONTS_SNAPSHOT.agenda}`,
      inici: '2023-11-26T10:30:00+01:00', fi: '2023-11-26T13:30:00+01:00',
      location: 'La Torre de les Maçanes · Casa Alta, carrer del Castell, s/n',
      poble_id: MUNICIPI_SNAPSHOT.slug, author_entity_id: 'ajuntament-la-torre-de-les-macanes', visibility: 'public',
    }],
    memoria: [{
      id: 'rentonar-solidaritat-refugiats-2016', title: 'Memòria de la campanya solidària del Rentonar de 2016',
      text: `Resum documental d’una publicació del Rentonar del 12 d’abril de 2016. L’associació de La Torre de les Maçanes va coordinar una recollida d’ajuda per a persones refugiades, amb punts al poble i a Xixona. El material es va transportar en set vehicles fins als voluntaris de SOS Refugiats d’Onil. És memòria documental pública de l’activitat associativa; no és una entrevista ni una fitxa oral revisada. Font original: ${FONTS_SNAPSHOT.memoria}`,
      poble_id: MUNICIPI_SNAPSHOT.slug, author_entity_id: 'rentonar', visibility: 'public',
    }],
    memoriaOral: [],
    pendents: [
      { coleccio: 'memoriaOral', motiu: 'no hi ha cap fitxa pública amb revisió humana acreditada en les fonts consultades; cal aportar-ne una abans d’exportar-la' },
      { coleccio: 'configuracio', motiu: 'la configuració és del node i no del municipi' },
    ],
  };
  return {
    format: 'socdepoble.snapshot-public.opendata.v1', entrada,
    provinencia: [
      { coleccio: 'noticies', id: noticia.id, url: FONTS_SNAPSHOT.noticia, extraccio: 'GET anònim d’app_content.feedPosts; municipi acreditat pel cos públic', ...(curacio ? { curacio } : {}) },
      { coleccio: 'agenda', id: entrada.agenda[0].id, url: FONTS_SNAPSHOT.agenda, extraccio: 'Metadades factuals de l’agenda municipal; acte passat, no convocatòria futura' },
      { coleccio: 'memoria', id: entrada.memoria[0].id, url: FONTS_SNAPSHOT.memoria, extraccio: 'Resum documental de l’arxiu públic del Rentonar; cap transcripció oral ni revisió humana inventada' },
    ],
    limits: ['No és el cens complet del municipi.', 'No atorga llicències de reutilització que les fonts no declaren.', 'Les fonts externes es van contrastar el 2026-11-03; no es consulten en reproduir el snapshot.', 'Les curacions editorials declaren la font, les empremtes i les observacions datades. No són una comprovació contínua de disponibilitat ni modifiquen la publicació remota original.'],
  };
}

/** Abans de publicar/reproduir el snapshot: no es permet que un fitxer amb
 * propietats privades afegides viatge com a annex mentre el ZIP les omet.
 * La confiança editorial en els textos públics continua sent necessària;
 * esta validació no autentica automàticament una font ni la seua clau.
 */
export function validaSnapshotOpenDataPublic(snapshot) {
  const falla = () => { throw new TypeError('Snapshot públic invàlid o amb camps no publicables.'); };
  if (!claus(snapshot, ['format', 'entrada', 'provinencia', 'limits']) || snapshot.format !== 'socdepoble.snapshot-public.opendata.v1') falla();
  const entrada = snapshot.entrada;
  if (!claus(entrada, ['municipi', 'ara', 'origen', 'actorsPublicats', 'entitats', 'noticies', 'agenda', 'memoria', 'memoriaOral', 'pendents', 'activityStreams'])
    || !claus(entrada.municipi, ['slug', 'nom']) || entrada.municipi.slug !== MUNICIPI_SNAPSHOT.slug || entrada.municipi.nom !== MUNICIPI_SNAPSHOT.nom
    || entrada.origen !== 'https://socdepoble.org') falla();
  const camps = {
    entitats: ['id', 'slug', 'name', 'kind', 'town_name', 'visibility'],
    noticies: [...CLAUS, 'visibility'],
    agenda: ['id', 'title', 'entradilla', 'inici', 'fi', 'location', 'poble_id', 'author_entity_id', 'visibility'],
    memoria: ['id', 'title', 'text', 'poble_id', 'author_entity_id', 'visibility'],
  };
  for (const [coleccio, permeses] of Object.entries(camps)) {
    if (!Array.isArray(entrada[coleccio]) || entrada[coleccio].some(x => !claus(x, permeses) || Object.values(x).some(v => typeof v !== 'string'))) falla();
  }
  if (!Array.isArray(entrada.memoriaOral) || entrada.memoriaOral.length || !Array.isArray(entrada.pendents)
    || entrada.pendents.some(x => !claus(x, ['coleccio', 'motiu']) || !['memoriaOral', 'configuracio'].includes(x.coleccio) || typeof x.motiu !== 'string')) falla();
  if (!Array.isArray(snapshot.provinencia) || snapshot.provinencia.length !== 3) falla();
  for (const [i, coleccio] of ['noticies', 'agenda', 'memoria'].entries()) {
    const font = snapshot.provinencia[i];
    if (!claus(font, ['coleccio', 'id', 'url', 'extraccio', ...(coleccio === 'noticies' ? ['curacio'] : [])]) || font.coleccio !== coleccio
      || font.id !== entrada[coleccio][0]?.id || font.url !== Object.values(FONTS_SNAPSHOT)[i] || typeof font.extraccio !== 'string') falla();
  }
  if (!Array.isArray(snapshot.limits) || snapshot.limits.some(x => typeof x !== 'string')) falla();
  if (!Array.isArray(entrada.actorsPublicats) || entrada.actorsPublicats.length > 1
    || entrada.actorsPublicats.some(x => x !== MUNICIPI_SNAPSHOT.slug)) falla();
  if (entrada.noticies.length !== 1 || entrada.noticies[0].id !== 'node-zero-mac-mini-m4'
    || entrada.noticies[0].author_entity_id !== 'socdepoble' || entrada.noticies[0].author_org_id !== undefined
    || entrada.noticies[0].poble_id !== MUNICIPI_SNAPSHOT.slug) falla();
  const noticia = entrada.noticies[0];
  if ([...CAMPS_TEXT, 'content'].some(k => typeof noticia[k] === 'string' && RELAT_ANTIC.test(textDeCos(noticia[k])))) falla();
  if (Object.hasOwn(snapshot.provinencia[0], 'curacio')) {
    try { validaCuracio(snapshot.provinencia[0].curacio, noticia, entrada.ara); } catch { falla(); }
  }
  for (const coleccio of Object.keys(camps)) if (entrada[coleccio].some(x => x.visibility !== 'public')) falla();
  // Els blocs contrastats no accepten camps ni textos lliures afegits al replay.
  const referencia = preparaSnapshotOpenDataPublic({ feedPosts: entrada.noticies, events: [], ara: entrada.ara });
  for (const k of ['entitats', 'agenda', 'memoria', 'memoriaOral', 'pendents']) {
    if (jsonCanonic(entrada[k]) !== jsonCanonic(referencia.entrada[k])) falla();
  }
  const provinenciaBase = snapshot.provinencia.map(font => Object.fromEntries(Object.entries(font).filter(([k]) => k !== 'curacio')));
  if (jsonCanonic(provinenciaBase) !== jsonCanonic(referencia.provinencia) || jsonCanonic(snapshot.limits) !== jsonCanonic(referencia.limits)) falla();
  if (entrada.activityStreams !== undefined) {
    const as = entrada.activityStreams;
    const base = `https://socdepoble.org/ap/`;
    const slug = MUNICIPI_SNAPSHOT.slug;
    const actor = `${base}actors/${slug}.json`, pagina = `${base}objectes/${slug}/pagina-del-poble.json`;
    const publicTo = x => Array.isArray(x) && x.length === 1 && x[0] === 'https://www.w3.org/ns/activitystreams#Public';
    const cc = x => Array.isArray(x) && x.length === 1 && x[0] === `${base}followers/${slug}.json`;
    if (!claus(as, ['@context', 'id', 'type', 'orderedItems', 'totalItems']) || as['@context'] !== 'https://www.w3.org/ns/activitystreams'
      || as.id !== `${base}outbox/${slug}.json` || as.type !== 'OrderedCollection' || as.totalItems !== 1
      || !Array.isArray(as.orderedItems) || as.orderedItems.length !== 1 || entrada.actorsPublicats[0] !== slug) falla();
    const a = as.orderedItems[0];
    if (!claus(a, ['actor', 'cc', 'id', 'object', 'to', 'type']) || a.actor !== actor || a.id !== `${pagina}#create`
      || a.type !== 'Create' || !publicTo(a.to) || !cc(a.cc)) falla();
    const o = a.object;
    if (!claus(o, ['attributedTo', 'cc', 'id', 'name', 'summary', 'summaryMap', 'to', 'type', 'url'])
      || o.attributedTo !== actor || o.id !== pagina || o.type !== 'Article' || !publicTo(o.to) || !cc(o.cc)
      || o.url !== `https://socdepoble.org/pobles/${slug}` || o.name !== `${MUNICIPI_SNAPSHOT.nom} a Sóc de Poble`
      || o.summary !== `<p>Pàgina pública de ${MUNICIPI_SNAPSHOT.nom} a Sóc de Poble. No és el compte oficial de l’Ajuntament.</p>`
      || !claus(o.summaryMap, ['ca']) || o.summaryMap.ca !== o.summary) falla();
  }
}
