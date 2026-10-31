/**
 * P1-23 · Exportació Open Data per municipi (bala B de la candidatura NLnet
 * NGI Fediversity, expedient 2026-08-1a6; la subvenció NO està concedida i el
 * paquet no ho diu enlloc). Ordre del Mestre del 30-10-2026.
 *
 * El paquet descarregable de les dades PÚBLIQUES d'un municipi, perquè
 * qualsevol ajuntament o entitat se l'emporte a un altre servidor sense
 * dependre del Mas: notícies i avisos, agenda, directori d'entitats i
 * comerços, memòria cultural i configuració, en JSON-LD (schema.org) i en
 * Markdown, amb un Data Package v2 de Frictionless i un manifest SHA-256,
 * dins d'una bossa BagIt (RFC 8493) i en un ZIP reproduïble byte a byte.
 *
 *   dades-obertes-<slug>/bag-info.txt            Bagging-Date = el dia de `ara`
 *   dades-obertes-<slug>/bagit.txt
 *   dades-obertes-<slug>/data/agenda.jsonld       schema.org Event
 *   dades-obertes-<slug>/data/configuracio.json   taxonomia i estil validats
 *   dades-obertes-<slug>/data/datapackage.json    Data Package v2 (hash sha256:…)
 *   dades-obertes-<slug>/data/directori.jsonld    schema.org Organization / LocalBusiness
 *   dades-obertes-<slug>/data/llicencies.md       la llicència de cada element
 *   dades-obertes-<slug>/data/memoria-cultural.jsonld   schema.org CreativeWork
 *   dades-obertes-<slug>/data/memoria.md          el paquet explicat (Markdown)
 *   dades-obertes-<slug>/data/municipi.jsonld     schema.org AdministrativeArea
 *   dades-obertes-<slug>/data/noticies.jsonld     schema.org NewsArticle
 *   dades-obertes-<slug>/manifest-sha256.txt      «<sha256>  data/…» (sha256sum -c)
 *   dades-obertes-<slug>/tagmanifest-sha256.txt
 *
 * Fonts: Data Package v2 (datapackage.org/standard/data-package i
 * data-resource: `hash` amb el prefix de l'algorisme), BagIt (RFC 8493),
 * schema.org (AdministrativeArea, NewsArticle, Event, Organization,
 * LocalBusiness, CreativeWork), APPNOTE de PKWARE per al ZIP. Disseny NLnet B
 * (scratchpad nlnet/disseny_opendata.md) i decisions 2, 5, 9 i 10 de
 * l'orquestrador.
 *
 * Privacitat (decisió 5; disseny B §5):
 *   · LLISTA BLANCA de camps per tipus: cada document es construïx camp a camp
 *     i mai es copia cap objecte d'entrada (el codi de Gemini feia
 *     JSON.stringify dels objectes sencers i filtrava correus, ids d'usuari i
 *     membres: defecte 9).
 *   · Cap publicació de persona física: un element sense autoria d'entitat
 *     (author_entity_id, author_org_id o authorOrgId) no ix, ni tampoc cap
 *     que vinga de section_submissions, és a dir, que porte la clau de la
 *     persona propietària (owner_user_id o ownerUserId, encara que siga null:
 *     elementDeFilaPublicada de mapejadorSeccions.js la posa sempre): és una
 *     publicació del veïnat, que hui només llegixen els membres del poble.
 *     Obrir-ho demana base legal (decisió del Mestre i del DPD) i un canvi de
 *     codi amb proves: no hi ha cap interruptor.
 *   · Cap element sense poble: el poble el DECLARA l'element (poble_id, o el
 *     town_name d'una entitat) o es deduïx del lloc de l'element (town_name o
 *     location) amb el nom sencer, i la deducció queda dita a memoria.md. Mai
 *     del lloc de qui signa (author_location): l'Aplec de Benillup el signa
 *     una entitat de La Torre. Un element sense cap poble NO és del poble
 *     (defecte 9: el `|| slug` de Gemini).
 *   · El nom de l'entitat que signa ix del directori públic de l'entrada
 *     (`entitats`), per l'id; mai del text lliure author_name, que pot ser el
 *     d'una persona. Sense fitxa pública, l'autoria porta només l'id.
 *   · El Mercat no entra (disseny B, D-B4: hi ha persones venedores).
 *   · Les omissions només porten recomptes, mai valors.
 *   · Les URL de Storage de Supabase es tornen referències opaques
 *     sdp-media:// (el criteri de tooling/migrations/01_migrar_urls_absolutes.mjs):
 *     el paquet no porta l'URL del projecte, tampoc amb un domini propi o un
 *     Supabase autoallotjat (es reconeix el camí /storage/v1/ en qualsevol host).
 *   · Mai HTML cru: els textos són text pla i cap «<» no obri marcatge (vegeu
 *     senseMarcatge).
 *
 * schema.org: cada propietat va en un tipus que la té. license,
 * copyrightNotice, datePublished i dateModified són de CreativeWork: en un
 * Event o una Organization van a la fitxa (subjectOf, un CreativeWork).
 * L'autoria d'una entitat del directori exportat porta el seu @id
 * (directori.jsonld#<id>): el graf enllaça l'acte i l'entitat.
 *
 * Cap contingut inventat: sense data de publicació real, l'element no en porta
 * cap (mai `ara`); sense descripció del municipi, cap descripció (ni comarca ni
 * resum per defecte); el poble no porta població, coordenades ni imatge si
 * qui exporta no les passa.
 *
 * Determinisme: cap rellotge (l'instant `ara` és obligatori), claus ordenades,
 * llistes ordenades, el mateix text sempre en UTF-8 i salts \n, i el ZIP de
 * src/utils/fulls/zip.js (STORE, CRC-32, data DOS fixa 1980-01-01) amb els
 * noms en ordre de bytes. Dos exportacions de les mateixes dades donen els
 * mateixos bytes, i l'ordre de l'entrada no hi influïx.
 *
 * Els SHA-256 es calculen amb crypto.subtle (context segur: la web en https,
 * l'app nativa i Node ≥ 20). No es reutilitza src/natiu/resum.js: la frontera
 * nativa (src/natiu/frontera.test.js) prohibix importar src/natiu/ des de fora.
 *
 * Federació: amb `origen` i el municipi dins d'`actorsPublicats` (els slugs
 * que el build publica a ap/actors/, recullActorsPublics de
 * tooling/seo/genera-federacio.mjs), el municipi enllaça la seua pàgina
 * (url) i el document del seu actor ActivityPub (subjectOf), amb
 * urlsDeMunicipi de ./activitypub.js. Mai `sameAs`: l'actor és la pàgina del
 * poble a Sóc de Poble, no el municipi ni el compte de l'Ajuntament. Sense
 * eixe actor publicat, cap enllaç ni cap compte @ a memoria.md.
 */
import { comparaInstants, dataIso, normalitzaOrigen, normalitzaSlugMunicipi, urlsDeMunicipi } from './activitypub.js';
import { LIMIT_DIRECTORI_ENTITATS } from './contracte.js';
import { validaTaxonomia } from './personalitzacio.js';
import { LLICENCIES, MARCA_CC0 } from '../components/universal/drets/llicencies.js';
import { declaracionsDe, validaEstil } from '../config/estil.js';
import { instantEnLaZona, ZONA_PER_DEFECTE } from '../utils/esdeveniment.js';
import { creaZip, llegeixZip } from '../utils/fulls/zip.js';

export const FORMAT_DADES_OBERTES = 'socdepoble.dadesobertes.v1';
export const VERSIO_FORMAT = '1.0.0';
export const ESQUEMA_DATAPACKAGE = 'https://datapackage.org/profiles/2.0/datapackage.json';
/* Les llicències que permeten reutilitzar sense demanar permís ni limitar
   l'ús comercial (disseny B §4.4). NC, ND i © no ho són. */
export const LLICENCIES_OBERTES = Object.freeze(['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0']);
/* Sostre de lectura del verificador (contra les bombes de ZIP). */
export const MAXIM_PAQUET = 64 * 1024 * 1024;

const SPDX_PER_OPCIO = Object.freeze({
  'cc-by-nc-sa': 'CC-BY-NC-SA-4.0', 'cc-by-nc-nd': 'CC-BY-NC-ND-4.0', 'cc-by-nc': 'CC-BY-NC-4.0',
  'cc-by-nd': 'CC-BY-ND-4.0', 'cc-by-sa': 'CC-BY-SA-4.0', 'cc-by': 'CC-BY-4.0', cc0: 'CC0-1.0'
});
const URL_LLICENCIA = Object.freeze({
  'CC-BY-NC-SA-4.0': 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  'CC-BY-NC-ND-4.0': 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
  'CC-BY-NC-4.0': 'https://creativecommons.org/licenses/by-nc/4.0/',
  'CC-BY-ND-4.0': 'https://creativecommons.org/licenses/by-nd/4.0/',
  'CC-BY-SA-4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC-BY-4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC0-1.0': 'https://creativecommons.org/publicdomain/zero/1.0/'
});
/* El valor que desa l'editor («CC BY 4.0»…) → SPDX, des del catàleg de drets. */
const SPDX_PER_CODI = new Map(LLICENCIES.filter((l) => l.codi && SPDX_PER_OPCIO[l.id]).map((l) => [l.codi, SPDX_PER_OPCIO[l.id]]));

/* ── Llistes blanques: els ÚNICS camps que es lligen de cada tipus. ──────── */
/* author_name no s'hi llig: el nom de l'entitat ix del directori (autorSchema). */
const AUTORIA = Object.freeze(['author_entity_id', 'author_org_id', 'authorOrgId']);
/* Les claus que porta una fila de section_submissions (la persona propietària). */
const PROPIETARI = Object.freeze(['owner_user_id', 'ownerUserId']);
const PERSONA = Object.freeze([...PROPIETARI, 'author_user_id', 'author_id']);
/* El lloc de l'ELEMENT. author_location (el de qui signa) no s'hi llig. */
const LLOC = Object.freeze(['poble_id', 'town_name', 'location']);
const IMATGE = Object.freeze(['image_url', 'featured_image', 'og_image']);
const BASE = Object.freeze(['id', 'visibility', 'copyright', 'created_at', 'updated_at', ...AUTORIA, ...PERSONA, ...LLOC, ...IMATGE]);
const CAMPS = Object.freeze({
  noticies: new Set([...BASE, 'title', 'name', 'subtitle', 'post_subtitle', 'entradilla', 'lead', 'excerpt', 'summary', 'body', 'content', 'plainText']),
  agenda: new Set([...BASE, 'title', 'name', 'subtitle', 'entradilla', 'summary', 'description', 'date', 'time', 'inici', 'fi', 'zona']),
  memoria: new Set([...BASE, 'title', 'titol', 'name', 'entradilla', 'description', 'text', 'body', 'content']),
  directori: new Set(['id', 'slug', 'name', 'kind', 'parent_organization_id', 'lema', 'description', 'logo_url', 'hero_url',
    'copyright', 'town_name', 'visibility'])
});
const CLAUS_ENTRADA = Object.freeze(['municipi', 'ara', 'origen', 'actorsPublicats', 'noticies', 'agenda', 'entitats', 'memoria', 'personalitzacio']);
const CLAUS_MUNICIPI = Object.freeze(['slug', 'nom', 'id', 'descripcio', 'wikidata', 'lat', 'lng']);

/* ── Text ───────────────────────────────────────────────────────────────── */

/* Totes lineals: cap quantificador niat (cap ReDoS amb 100.000 caràcters). */
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const SALT_HTML = /<br\s*\/?>|<\/(?:p|li|div|h[1-6]|blockquote)>/gi;
const ETIQUETA_HTML = /<[^<>]*>/g;
const ENTITAT_HTML = /&(?:amp|lt|gt|quot|#39|apos|nbsp);/g;
const ENTITATS = Object.freeze({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ' });
const SEMBLA_HTML = /<\/?[a-z][a-z0-9]*[\s/>]/i;
const DIA = /^(\d{4})-(\d{2})-(\d{2})$/;
const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATA_HORA_PARET = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
/* Un id és opac: cap blanc, control ni angle (un id amb «<» no és de veres). */
const ID = /^[^\s\u0000-\u001f\u007f<>]{1,128}$/;
/* Un «<» que obriria marcatge: l'analitzador de l'HTML (WHATWG, «tag open
   state») només n'obri davant d'una lletra ASCII, «/», «!» o «?». */
const INICI_DE_MARCATGE = /<(?=[A-Za-z/!?])/g;
/* El seu substitut: es llig igual i no obri res (U+2039). */
const ANGLE_NEUTRE = '‹';
/* Les passades d'etiquetes de textDeCos: cada una és lineal; el que en
   quede després, ho neutralitza senseMarcatge. */
const MAXIM_PASSADES_HTML = 4;
const PREFIX_STORAGE = '/storage/v1/';
const PREFIX_STORAGE_PUBLIC = '/storage/v1/object/public/';
const CAMI_PROPI = /^\/(?![/\\])[A-Za-z0-9/_.~%-]*$/;
const REF_OPACA = 'sdp-media://';
/* Un segment d'una referència opaca: lletres ASCII, xifres, «_», «.», «~» i
   «-». Cap «%»: un %2F o un %2e%2e que algú descodifique més avant mou el camí
   (la regla de resolveAsset, data/supabase/storage.js, segmentNet, que tampoc
   no en resol cap amb «%»). */
const SEGMENT_SEGUR = /^[A-Za-z0-9_.~-]+$/;
const WIKIDATA = /^Q[1-9]\d{0,11}$/;
const NOM_DE_DADES = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jsonld|json|md)$/;

const compara = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const textNet = (valor) => (typeof valor === 'string' ? valor.replace(/\r\n?/g, '\n').replace(CONTROL, '') : '');
/** Text pla sense cap «<» que obriga marcatge (cap etiqueta, comentari ni declaració). */
export const senseMarcatge = (text) => text.replace(INICI_DE_MARCATGE, ANGLE_NEUTRE);
/** Text d'una línia: sense control, amb els blancs plegats i sense marcatge; '' si no és text. */
const textLinia = (valor) => senseMarcatge(textNet(valor).replace(/\s+/g, ' ').trim());
const primerText = (item, camps) => {
  for (const camp of camps) {
    const text = textLinia(item[camp]);
    if (text) return text;
  }
  return '';
};
const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const presentDe = (valor) => (typeof valor === 'string' ? valor.trim() !== '' : valor !== undefined && valor !== null && valor !== false);
/* L'id tal qual (mai neutralitzat: un id canviat seria un altre id). */
const idDe = (valor) => {
  const text = typeof valor === 'number' && Number.isFinite(valor) ? String(valor) : textNet(valor).trim();
  return ID.test(text) ? text : '';
};

/**
 * Text de diversos paràgrafs a partir de text pla o d'HTML: els salts de
 * paràgraf es conserven, les etiquetes es lleven i les entitats bàsiques es
 * descodifiquen. Mai HTML cru a l'eixida:
 *   · les etiquetes es lleven fins que no en quede cap (una etiqueta partida,
 *     «<<b>script>», en deixa una de nova en llevar la de dins), amb un
 *     sostre de passades lineals;
 *   · les entitats es descodifiquen DESPRÉS (l'ordre de l'HTML: «x &lt; y i
 *     z &gt; w» és text, i descodificar-lo abans el faria etiqueta i se'n
 *     perdria un tros);
 *   · i, al final, cap «<» que quede (d'una entitat, d'una etiqueta sense
 *     tancar o del text pla) no obri marcatge (senseMarcatge).
 * Deterministe: la mateixa eixida al navegador i a Node (extractPlainText no
 * ho és, perquè usa DOMParser si n'hi ha).
 */
export function textDeCos(valor) {
  let text = textNet(valor);
  if (SEMBLA_HTML.test(text)) {
    for (let passada = 0; passada < MAXIM_PASSADES_HTML; passada += 1) {
      const net = text.replace(SALT_HTML, '\n').replace(ETIQUETA_HTML, '');
      if (net === text) break;
      text = net;
    }
    text = text.replace(ENTITAT_HTML, (e) => ENTITATS[e]);
  }
  return senseMarcatge(text.split('\n').map((linia) => linia.replace(BLANCS_DE_LINIA, ' ').trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim());
}

/* Els blancs dins d'una línia: espai, tabulador i espai dur (U+00A0, literal
   dins de la cadena). */
const BLANCS_DE_LINIA = new RegExp('[ \t ]+', 'g');

/* ── JSON canònic ───────────────────────────────────────────────────────── */

function ordena(valor) {
  if (Array.isArray(valor)) return valor.map(ordena);
  if (valor !== null && typeof valor === 'object') {
    const net = Object.create(null);
    for (const clau of Object.keys(valor).sort(compara)) {
      const fill = valor[clau];
      if (fill === undefined || fill === null || fill === '') continue;
      net[clau] = ordena(fill);
    }
    return net;
  }
  if (typeof valor === 'number' && !Number.isFinite(valor)) throw new TypeError('JSON canònic: nombre no finit.');
  if (typeof valor === 'function' || typeof valor === 'symbol' || typeof valor === 'bigint') {
    throw new TypeError(`JSON canònic: valor no serialitzable (${typeof valor}).`);
  }
  return valor;
}

/**
 * JSON amb les claus ordenades (per punts de codi UTF-16, com Array#sort),
 * sense claus buides (undefined, null o ''), indentat amb dos espais i amb
 * salt de línia final: els mateixos bytes per a les mateixes dades.
 */
export function jsonCanonic(valor) {
  return `${JSON.stringify(ordena(valor), null, 2)}\n`;
}

/* ── Llicències (disseny B §4.4) ────────────────────────────────────────── */

/**
 * La llicència d'un element a partir del text desat a `copyright`.
 * Un buit és sempre «no declarada» (mai la de sèrie de l'editor: triaDe('')
 * torna CC BY-NC-SA, que en una exportació seria fals). `oberta` només per a
 * CC0 1.0, CC BY 4.0 i CC BY-SA 4.0. El text es conserva tal qual (pot dur
 * l'atribució que la llicència exigix).
 */
export function llicenciaDe(valor) {
  const text = textLinia(valor);
  if (!text) return Object.freeze({ valor: null, estat: 'no-declarada', oberta: false, spdx: null });
  const ambMarca = text.endsWith(MARCA_CC0) && text.length > MARCA_CC0.length;
  const spdx = SPDX_PER_CODI.get(text) ?? (ambMarca ? 'CC0-1.0' : null);
  return Object.freeze({ valor: text, estat: 'declarada', oberta: LLICENCIES_OBERTES.includes(spdx), spdx });
}

const llicenciaSchema = (llicencia) => ({
  license: llicencia.spdx ? URL_LLICENCIA[llicencia.spdx] : null,
  copyrightNotice: llicencia.valor
});

/* schema.org · license, copyrightNotice, datePublished i dateModified només
   són de CreativeWork (schema.org/license, /copyrightNotice, /datePublished,
   /dateModified: «Used on these types»). Un Event o una Organization els
   porta a la seua fitxa: un CreativeWork a subjectOf (domini Thing, rang
   CreativeWork o Event). Sense cap d'eixos valors, cap fitxa. */
function fitxaSchema(propietats) {
  const amb = Object.values(propietats).some((valor) => valor !== null && valor !== undefined && valor !== '');
  return amb ? { '@type': 'CreativeWork', ...propietats } : null;
}

/* ── Imatges ────────────────────────────────────────────────────────────── */

const ambSegmentsBruts = (cami) => cami.split('/').some((tros) => tros === '.' || tros === '..');
/* El camí d'una referència opaca (darrere de sdp-media://): el bucket i almenys
   un segment més, tots SEGMENT_SEGUR, cap de buit, «.» ni «..». */
const refSegura = (cami) => {
  const trossos = cami.split('/');
  return trossos.length >= 2 && trossos.every((tros) => SEGMENT_SEGUR.test(tros) && tros !== '.' && tros !== '..');
};

/**
 * Una referència d'imatge publicable, o null: una ruta pròpia (absoluta amb
 * `base`), una referència opaca sdp-media:// amb segments segurs (refSegura)
 * o una URL https sense credencials, consulta ni fragment (una consulta pot
 * portar un testimoni de signatura). Storage de Supabase → sdp-media://
 * (sense l'URL del projecte): QUALSEVOL host amb el camí de l'API de Storage
 * (/storage/v1/), perquè el projecte pot anar amb un domini propi o
 * autoallotjat (el criteri de l'App és `${supabaseUrl}/storage/v1/object/public/`,
 * imatgeSocial.js, i l'exportació no coneix supabaseUrl). Del bucket públic,
 * la referència opaca si cada segment és segur; de qualsevol altre camí de
 * Storage (signat, autenticat, transformat), res. Contrapartida: la imatge
 * pública d'un altre Supabase també es torna opaca i se'n perd l'origen (mai
 * el contrari).
 * Gauntlet 261030 (G8 de Gemini) · El que decidix és el camí, no el host:
 * abans un host supabase.co o *.supabase.co fora de /storage/v1/ (el web de
 * Supabase, d'un tercer) no ixia mai, i la referència podia portar «%» o un
 * segment buit (…/public/mitjans%2F..%2Fmitjans_privats/a.webp).
 */
export function imatgeDe(valor, base = null) {
  const text = typeof valor === 'string' ? valor.trim() : '';
  if (!text || text.length > 2048) return null;
  if (text.startsWith(REF_OPACA)) return refSegura(text.slice(REF_OPACA.length)) ? text : null;
  if (CAMI_PROPI.test(text)) return ambSegmentsBruts(text) ? null : `${base ?? ''}${text}`;
  let url = null;
  try { url = new URL(text); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
  if (url.pathname.startsWith(PREFIX_STORAGE)) {
    const cami = url.pathname.startsWith(PREFIX_STORAGE_PUBLIC) ? url.pathname.slice(PREFIX_STORAGE_PUBLIC.length) : '';
    return refSegura(cami) ? `${REF_OPACA}${cami}` : null;
  }
  return url.href;
}

/* ── Dates ──────────────────────────────────────────────────────────────── */

function diaValid(text) {
  const p = DIA.exec(text);
  if (!p) return null;
  const [any, mes, dia] = [Number(p[1]), Number(p[2]), Number(p[3])];
  const d = new Date(Date.UTC(any, mes - 1, dia));
  return any >= 1000 && d.getUTCFullYear() === any && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia ? text : null;
}

const dosXifres = (n) => String(n).padStart(2, '0');

/* Una hora de paret d'una zona IANA amb el seu desfasament (+01:00 a l'hivern
   de Madrid), o null si la data no existix o la zona no és vàlida. */
function ambDesfasament(dataHora, zona) {
  const p = DATA_HORA_PARET.exec(dataHora);
  if (!p || !diaValid(`${p[1]}-${p[2]}-${p[3]}`) || Number(p[4]) > 23 || Number(p[5]) > 59 || Number(p[6] ?? 0) > 59) return null;
  const segons = p[6] ?? '00';
  const instant = instantEnLaZona({ dataHora: `${p[1]}-${p[2]}-${p[3]}T${p[4]}:${p[5]}:${segons}`, zona });
  if (instant === null) return null;
  const paret = Date.UTC(Number(p[1]), Number(p[2]) - 1, Number(p[3]), Number(p[4]), Number(p[5]), Number(segons));
  const minuts = Math.round((paret - instant) / 60000);
  const signe = minuts < 0 ? '-' : '+';
  const absolut = Math.abs(minuts);
  return `${p[1]}-${p[2]}-${p[3]}T${p[4]}:${p[5]}:${segons}${signe}${dosXifres(Math.floor(absolut / 60))}:${dosXifres(absolut % 60)}`;
}

/* Un moment de l'agenda (model d'esdeveniment o text) com a data de
   schema.org: 'AAAA-MM-DD' o una data i hora amb desfasament. */
function momentSchema(valor, zona) {
  if (esObjecte(valor)) {
    if (typeof valor.data === 'string') return diaValid(valor.data.trim());
    if (typeof valor.dataHora === 'string') return momentSchema(valor.dataHora, typeof valor.zona === 'string' ? valor.zona : zona);
    return null;
  }
  const text = typeof valor === 'string' ? valor.trim() : '';
  if (!text) return null;
  if (DIA.test(text)) return diaValid(text);
  return dataIso(text, { conservaDesplacament: true }) ?? ambDesfasament(text, zona);
}

/* Una data de schema.org com a instant que comparaInstants admet (un dia, a
   les 00:00 UTC), o null si no n'hi ha. Es compara sencera, amb la fracció de
   segon (C8 de Codex, 261030): mai amb Date.parse, que talla als mil·lisegons. */
const instantDe = (data) => (typeof data === 'string' && data ? (DIA.test(data) ? `${data}T00:00:00Z` : data) : null);

/* ── Poble, autoria i visibilitat de cada element ───────────────────────── */

/* 'declarada', 'deduida', 'altre' o null (sense cap poble). Mana poble_id; si
   no n'hi ha, el primer camp de lloc DE L'ELEMENT amb text (el poble i el
   lloc genèric, en l'ordre de clauDelPoble.js), amb el nom sencer (el primer
   poble d'«A · B»): «La Torre» a seques no casa. Mai author_location, el lloc
   de qui signa: la pestanya del poble (clauDelPoble.js) el fa servir per a
   MOSTRAR d'on es publica, però un paquet de dades obertes AFIRMA on passa
   cada cosa, i l'acte de la llavor (eventsSeed.js) es fa a Benillup i el
   signa una entitat de La Torre. */
function coincidenciaDelPoble(item, municipi) {
  const declarat = textLinia(item.poble_id);
  if (declarat) {
    return declarat === municipi.id || normalitzaSlugMunicipi(declarat) === municipi.slug ? 'declarada' : 'altre';
  }
  for (const camp of ['town_name', 'location']) {
    const lloc = textLinia(item[camp]);
    if (!lloc) continue;
    return normalitzaSlugMunicipi(lloc.split(' · ')[0]) === municipi.slug ? 'deduida' : 'altre';
  }
  return null;
}

/* Una entitat del directori és del poble que DECLARA a town_name (la columna
   de organization_directory), i de cap altre: ni lloc, ni deducció. */
function pobleDeLEntitat(fila, municipi) {
  const poble = textLinia(fila.town_name);
  if (!poble) return null;
  return normalitzaSlugMunicipi(poble) === municipi.slug ? 'declarada' : 'altre';
}

/* 'entitat' (amb { id }) o el motiu pel qual l'element no ix. La regla de
   autorDe (src/config/navigation.js): mana l'entitat, i si no n'hi ha, la
   persona. Però una fila de section_submissions és del veïnat i hui només la
   llegixen els membres: fora encara que la signe una entitat. Se la coneix
   per la CLAU de la persona propietària, no pel valor: elementDeFilaPublicada
   (mapejadorSeccions.js) hi posa sempre ownerUserId (null si la fila no en
   porta) i la columna és NOT NULL; un null no fa pública una publicació del
   veïnat (falla tancat). author_id i author_user_id són claus de payload que
   el mapejador lleva a les publicacions del veïnat (CLAUS_D_AUTORITAT):
   només les porta l'administració. */
function autoriaDe(item) {
  const entitat = idDe(item.author_org_id) || idDe(item.authorOrgId) || idDe(item.author_entity_id);
  if (PROPIETARI.some((camp) => Object.hasOwn(item, camp))) return { motiu: entitat ? 'nomesMembres' : 'persones' };
  if (entitat) return { entitat: { id: entitat } };
  return { motiu: PERSONA.some((camp) => presentDe(item[camp])) ? 'persones' : 'senseEntitat' };
}

/* Les fitxes PÚBLIQUES del directori de l'entrada (de qualsevol poble), per
   id: d'ací ix el nom i el tipus de l'entitat que signa. Un id repetit no
   resol res (quin nom és el bo no es pot triar). `exportades`: els ids del
   directori d'este paquet, els que tenen @id a directori.jsonld. */
function signantsDelDirectori(llista, exportades) {
  const signants = new Map();
  const repetits = new Set();
  for (const fila of Array.isArray(llista) ? llista : []) {
    if (!esObjecte(fila) || (presentDe(fila.visibility) && fila.visibility !== 'public')) continue;
    const id = idDe(fila.id);
    const nom = textLinia(fila.name);
    if (!id || !nom) continue;
    if (signants.has(id)) { repetits.add(id); continue; }
    signants.set(id, { nom, tipus: fila.kind === 'company' ? 'LocalBusiness' : 'Organization', exportada: exportades.has(id) });
  }
  for (const id of repetits) signants.delete(id);
  return signants;
}

function nouRecompte() {
  return Object.create(null);
}
const suma = (recompte, motiu, n = 1) => { if (n) recompte[motiu] = (recompte[motiu] ?? 0) + n; };

function campsFora(item, permesos) {
  return Object.keys(item).filter((clau) => !permesos.has(clau)).length;
}

/* Els elements publicables d'una col·lecció, amb el seu poble i la seua
   autoria. Mai cap valor als recomptes. Un id repetit atura l'exportació:
   quin dels dos és el bo no es pot triar sense inventar. */
function triaElements(llista, municipi, coleccio, recompte, { ambAutoria = true, pobleDe = coincidenciaDelPoble } = {}) {
  if (llista !== undefined && !Array.isArray(llista)) throw new TypeError(`«${coleccio}» ha de ser una llista.`);
  const vistos = new Set();
  const triats = [];
  for (const item of llista ?? []) {
    if (!esObjecte(item)) { suma(recompte, 'noObjectes'); continue; }
    suma(recompte, 'campsDescartats', campsFora(item, CAMPS[coleccio]));
    if (presentDe(item.visibility) && item.visibility !== 'public') { suma(recompte, 'noPubliques'); continue; }
    const autoria = ambAutoria ? autoriaDe(item) : { entitat: null };
    if (autoria.motiu) { suma(recompte, autoria.motiu); continue; }
    const coincidencia = pobleDe(item, municipi);
    if (coincidencia === null) { suma(recompte, 'sensePoble'); continue; }
    if (coincidencia === 'altre') { suma(recompte, 'altresPobles'); continue; }
    const id = idDe(item.id);
    if (!id) { suma(recompte, 'senseId'); continue; }
    if (vistos.has(id)) throw new TypeError(`Identificador repetit a «${coleccio}»: ${id.slice(0, 80)}`);
    vistos.add(id);
    triats.push({ item, id, coincidencia, entitat: autoria.entitat });
  }
  return triats;
}

const referencia = (fitxer, id) => `${fitxer}#${encodeURIComponent(id)}`;

function imatgeDeLElement(item, base, recompte) {
  for (const camp of IMATGE) {
    if (typeof item[camp] !== 'string' || !item[camp].trim()) continue;
    const imatge = imatgeDe(item[camp], base);
    if (!imatge) suma(recompte, 'imatgesDescartades');
    return imatge;
  }
  return null;
}

/* L'entitat que signa: el seu node del directori (@id) si el paquet l'exporta,
   perquè un processador JSON-LD unisca l'acte i l'entitat (els dos @id
   relatius es resolen contra la mateixa carpeta data/); si no, un node en
   blanc amb l'identificador. El nom, només de la seua fitxa pública. */
function autorSchema(entitat, signants) {
  const fitxa = signants.get(entitat.id);
  return {
    '@type': fitxa?.tipus ?? 'Organization',
    '@id': fitxa?.exportada ? referencia('directori.jsonld', entitat.id) : null,
    identifier: entitat.id,
    name: fitxa?.nom ?? null
  };
}

/* La data de publicació REAL (created_at) i la d'edició, si és posterior. Les
   dues amb la fracció de segon que porten (Postgres en dona microsegons) i
   comparades com a instants: una edició dins del mateix segon també ho és, i
   '…:00Z' no passa per posterior a '…:00.5Z' (l'ordre del text ho diria). */
function datesDePublicacio(item) {
  const publicat = dataIso(item.created_at);
  const editat = dataIso(item.updated_at);
  return { datePublished: publicat, dateModified: editat && publicat && comparaInstants(editat, publicat) > 0 ? editat : null };
}

/* ── Vistes de schema.org ───────────────────────────────────────────────── */

/* `context`: { base, recompte, signants } (vegeu preparaDadesObertesMunicipi). */
function noticiaSchema({ item, id, entitat }, { base, recompte, signants }) {
  return {
    '@type': 'NewsArticle',
    '@id': referencia('noticies.jsonld', id),
    identifier: id,
    headline: primerText(item, ['title', 'name']),
    alternativeHeadline: primerText(item, ['subtitle', 'post_subtitle']),
    abstract: primerText(item, ['entradilla', 'lead', 'excerpt', 'summary']),
    articleBody: textDeCos(item.body || item.content || item.plainText),
    ...datesDePublicacio(item),
    image: imatgeDeLElement(item, base, recompte),
    author: autorSchema(entitat, signants),
    ...llicenciaSchema(llicenciaDe(item.copyright))
  };
}

function acteSchema({ item, id, entitat }, { base, recompte, signants }) {
  const zona = textLinia(item.zona) || ZONA_PER_DEFECTE;
  const dia = typeof item.date === 'string' ? diaValid(item.date.trim()) : null;
  const hora = typeof item.time === 'string' && HORA.test(item.time.trim()) ? item.time.trim() : null;
  const inici = momentSchema(item.inici, zona) ?? (dia && hora ? momentSchema(`${dia}T${hora}`, zona) : dia);
  const lloc = textLinia(item.location);
  return {
    '@type': 'Event',
    '@id': referencia('agenda.jsonld', id),
    identifier: id,
    name: primerText(item, ['title', 'name']),
    /* El subtítol de la targeta: schema.org no té «subtitle» per a Event. */
    disambiguatingDescription: textLinia(item.subtitle),
    description: textDeCos(item.entradilla || item.summary || item.description),
    startDate: inici,
    endDate: momentSchema(item.fi, zona),
    location: lloc ? { '@type': 'Place', name: lloc } : null,
    image: imatgeDeLElement(item, base, recompte),
    organizer: autorSchema(entitat, signants),
    subjectOf: fitxaSchema({ ...datesDePublicacio(item), ...llicenciaSchema(llicenciaDe(item.copyright)) })
  };
}

function memoriaSchema({ item, id, entitat }, { base, recompte, signants }) {
  return {
    '@type': 'CreativeWork',
    '@id': referencia('memoria-cultural.jsonld', id),
    identifier: id,
    name: primerText(item, ['title', 'titol', 'name']),
    abstract: primerText(item, ['entradilla', 'description']),
    text: textDeCos(item.text || item.body || item.content),
    ...datesDePublicacio(item),
    image: imatgeDeLElement(item, base, recompte),
    author: autorSchema(entitat, signants),
    ...llicenciaSchema(llicenciaDe(item.copyright))
  };
}

/* El directori: les files de organization_directory (contracte.js,
   capacitat directoriEntitats). Ni membres, ni àlies, ni correus, ni
   presentacio_html (HTML d'usuari: la descripció ja és text). */
function entitatsDelDirectori(triades, base, recompte, municipi) {
  const ids = new Set(triades.map(({ id }) => id));
  return triades.map(({ item, id }) => {
    const pare = idDe(item.parent_organization_id);
    const slug = normalitzaSlugMunicipi(item.slug) === textLinia(item.slug) ? textLinia(item.slug) : '';
    const logo = typeof item.logo_url === 'string' && item.logo_url.trim() ? imatgeDe(item.logo_url, base) : null;
    const portada = typeof item.hero_url === 'string' && item.hero_url.trim() ? imatgeDe(item.hero_url, base) : null;
    if (item.logo_url && !logo) suma(recompte, 'imatgesDescartades');
    if (item.hero_url && !portada) suma(recompte, 'imatgesDescartades');
    return {
      '@type': item.kind === 'company' ? 'LocalBusiness' : 'Organization',
      '@id': referencia('directori.jsonld', id),
      identifier: id,
      alternateName: slug,
      name: textLinia(item.name),
      slogan: textLinia(item.lema),
      description: textDeCos(item.description),
      logo,
      image: portada,
      location: { '@id': referencia('municipi.jsonld', municipi.slug) },
      parentOrganization: pare && ids.has(pare) ? { '@id': referencia('directori.jsonld', pare) } : null,
      /* La llicència de la fitxa, no de l'entitat (fitxaSchema). */
      subjectOf: fitxaSchema(llicenciaSchema(llicenciaDe(item.copyright)))
    };
  });
}

/* ── Configuració (taxonomia i estil: formes tancades i validades) ──────── */

/* Els textos de la taxonomia (validaTaxonomia només en mira la llargària):
   també sense marcatge. */
function taxonomiaNeta(payload) {
  if (validaTaxonomia(payload).length) return null;
  const pagines = esObjecte(payload.pagines) ? payload.pagines : {};
  const net = (text) => senseMarcatge(text.trim());
  return {
    v: payload.v,
    pagines: Object.fromEntries(Object.keys(pagines).sort(compara).map((clau) => [clau, {
      labels: pagines[clau].labels.map((label) => ({ text: net(label.text), className: label.className }))
    }])),
    categories: (payload.categories ?? []).map(net),
    etiquetes: (payload.etiquetes ?? []).map(net)
  };
}

function estilNet(payload) {
  if (!esObjecte(payload) || validaEstil(payload).length) return null;
  return {
    v: payload.v,
    tokens: Object.fromEntries(declaracionsDe(payload)),
    crom: esObjecte(payload.crom) ? { to: payload.crom.to } : null
  };
}

function configuracioDe(personalitzacio, recompte) {
  if (personalitzacio === undefined || personalitzacio === null) return {};
  if (!esObjecte(personalitzacio)) throw new TypeError('«personalitzacio» ha de ser { taxonomia, estil } (la forma de loadCoreContent).');
  const una = (clau, neteja) => {
    const desat = personalitzacio[clau];
    if (desat === undefined || desat === null) return null;
    const net = esObjecte(desat) ? neteja(desat.payload) : null;
    if (!net) { suma(recompte, `${clau}Invalida`); return null; }
    const versio = Number.isSafeInteger(desat.versio) && desat.versio >= 0 ? desat.versio : null;
    return { payload: net, versio };
  };
  return { taxonomia: una('taxonomia', taxonomiaNeta), estil: una('estil', estilNet) };
}

/* ── Municipi ───────────────────────────────────────────────────────────── */

function municipiDe(municipi) {
  if (!esObjecte(municipi)) throw new TypeError('Cal el municipi: { slug, nom }.');
  const desconeguda = Object.keys(municipi).find((clau) => !CLAUS_MUNICIPI.includes(clau));
  if (desconeguda) {
    throw new TypeError(`Camp de municipi no admés: ${desconeguda.slice(0, 40)} (només ${CLAUS_MUNICIPI.join(', ')}: cap dada de mostra passa com a real).`);
  }
  const nom = textLinia(municipi.nom);
  if (!nom) throw new TypeError('Cal el nom del municipi.');
  const slug = normalitzaSlugMunicipi(municipi.slug ?? nom);
  if (!slug || (municipi.slug !== undefined && municipi.slug !== slug)) {
    throw new TypeError(`Slug de municipi invàlid: ${String(municipi.slug ?? nom).slice(0, 80)}`);
  }
  const lat = municipi.lat;
  const lng = municipi.lng;
  const ambGeo = typeof lat === 'number' && typeof lng === 'number' && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const wikidata = typeof municipi.wikidata === 'string' && WIKIDATA.test(municipi.wikidata) ? municipi.wikidata : null;
  return {
    slug, nom, id: idDe(municipi.id) || null, descripcio: textDeCos(municipi.descripcio), wikidata,
    geo: ambGeo ? { lat, lng } : null
  };
}

/* sameAs vol dir «la mateixa identitat» (schema.org/sameAs): l'entitat de
   Wikidata del municipi ho és; l'actor de Sóc de Poble no (és la pàgina del
   poble a la plataforma, i ell mateix diu que no és el compte de
   l'Ajuntament). L'actor va com un document sobre el municipi (subjectOf) i
   la pàgina com a url, i només si el build publica eixe actor. */
function municipiSchema(municipi, enllacos) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AdministrativeArea',
    '@id': referencia('municipi.jsonld', municipi.slug),
    identifier: municipi.slug,
    name: municipi.nom,
    description: municipi.descripcio,
    url: enllacos?.perfil ?? null,
    sameAs: municipi.wikidata ? [`https://www.wikidata.org/entity/${municipi.wikidata}`] : null,
    subjectOf: enllacos ? {
      '@type': 'CreativeWork',
      name: `Actor ActivityPub de ${municipi.nom} a Sóc de Poble (fase 1, només lectura)`,
      url: enllacos.actor,
      encodingFormat: 'application/activity+json'
    } : null,
    geo: municipi.geo ? { '@type': 'GeoCoordinates', latitude: municipi.geo.lat, longitude: municipi.geo.lng } : null
  };
}

/* ── Markdown ───────────────────────────────────────────────────────────── */

const MARKDOWN_ACTIU = /[\\`*_[\]<>#|~&!]/g;
const ESCAPA_MD = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;' });
/** Text d'una línia segur dins de Markdown: cap enllaç, imatge, HTML ni èmfasi. */
export function escapaMarkdown(valor) {
  return textLinia(valor).replace(MARKDOWN_ACTIU, (c) => ESCAPA_MD[c] ?? `\\${c}`);
}
const resum = (valor, maxim = 280) => {
  const punts = Array.from(textLinia(valor));
  return escapaMarkdown(punts.length > maxim ? `${punts.slice(0, maxim - 1).join('')}…` : punts.join(''));
};

const NOMS_DE_MOTIU = Object.freeze({
  persones: 'publicacions de persones físiques',
  nomesMembres: 'publicacions del veïnat que només llegixen els membres',
  senseEntitat: 'elements sense cap entitat que els signe',
  sensePoble: 'elements sense poble declarat ni deduïble',
  altresPobles: "elements d'altres pobles",
  senseId: 'elements sense identificador',
  noPubliques: 'elements no públics',
  noObjectes: 'entrades que no són elements',
  campsDescartats: 'camps fora de la llista blanca',
  imatgesDescartades: 'imatges amb una adreça no publicable',
  taxonomiaInvalida: 'taxonomia amb una forma no vàlida',
  estilInvalida: 'estil amb una forma no vàlida'
});

function liniaDElement(element, data, coincidencia) {
  const parts = [`**${resum(element.headline || element.name || element.identifier, 160)}**`];
  if (data) parts.push(escapaMarkdown(data));
  const autor = element.author?.name || element.organizer?.name;
  if (autor) parts.push(escapaMarkdown(autor));
  const linia = `- ${parts.join(' · ')} (\`${encodeURIComponent(element.identifier)}\`)`;
  const segona = [
    resum(element.abstract || element.description || element.slogan || ''),
    coincidencia === 'deduida' ? '_Poble deduït del lloc, no declarat._' : ''
  ].filter(Boolean).join(' ');
  return segona ? `${linia}\n  ${segona}` : linia;
}

function memoriaMd({ municipi, ara, enllacos, seccions, omissions, configuracio }) {
  const linies = [
    `# Dades obertes de ${escapaMarkdown(municipi.nom)}`,
    '',
    `Paquet \`${FORMAT_DADES_OBERTES}\` (versió ${VERSIO_FORMAT}) generat per el Mas (Sóc de Poble) el ${ara}.`,
    'Conté només contingut públic del municipi i de les seues entitats. No conté cap dada de persones: ni perfils, ni publicacions del veïnat, ni xats, ni el Mercat.',
    '',
    `_English:_ open data package of ${escapaMarkdown(municipi.nom)} (schema.org JSON-LD, Frictionless Data Package v2, BagIt with a SHA-256 manifest). It holds public municipal and organisation content only, never personal data.`,
    '',
    '## Contingut',
    '',
    '| Fitxer | Elements |',
    '| --- | --- |',
    ...seccions.map(({ fitxer, elements }) => `| \`${fitxer}\` | ${elements.length} |`),
    `| \`configuracio.json\` | ${['taxonomia', 'estil'].filter((clau) => configuracio[clau]).join(', ') || 'sense personalització'} |`,
    ''
  ];
  for (const { titol, elements, data, coincidencies } of seccions) {
    linies.push(`## ${titol} (${elements.length})`, '');
    if (!elements.length) linies.push('Sense elements en esta exportació.', '');
    else linies.push(...elements.map((element, i) => liniaDElement(element, data(element), coincidencies[i])), '');
  }
  if (enllacos) {
    linies.push(
      '## Federació (ActivityPub, fase 1: només lectura)',
      '',
      `- Compte: \`@${municipi.slug}@${new URL(enllacos.actor).host}\``,
      `- Actor: \`${enllacos.actor}\``,
      `- Outbox: \`${enllacos.outbox}\``,
      '',
      "L'actor i l'outbox es poden consultar per URL. Seguir el poble des del Fedivers necessita la fase 2 (inbox i signatures HTTP), que encara no existix.",
      'El compte @ només es resol on hi ha WebFinger (un servidor propi, com el mòdul NixOS): una web estàtica no en pot respondre cap.',
      ''
    );
  }
  linies.push('## Què queda fora', '', 'Només recomptes, mai valors.', '');
  const files = Object.entries(omissions).flatMap(([coleccio, motius]) => Object.entries(motius)
    .map(([motiu, n]) => `- ${coleccio}: ${n} ${NOMS_DE_MOTIU[motiu] ?? motiu}`));
  linies.push(...(files.length ? files : ['- Res.']), '');
  linies.push(
    '## Verificació',
    '',
    `Des de la carpeta \`dades-obertes-${municipi.slug}\`: \`sha256sum -c manifest-sha256.txt\` (a macOS, \`shasum -a 256 -c manifest-sha256.txt\`).`,
    'La llicència de cada element és a `llicencies.md`.',
    ''
  );
  return linies.join('\n');
}

function llicenciesMd(seccions) {
  const files = seccions.flatMap(({ coleccio, elements }) => elements.map((element) => {
    /* La de l'element (CreativeWork) o la de la seua fitxa (Event, Organization). */
    const llicencia = llicenciaDe(element.copyrightNotice ?? element.subjectOf?.copyrightNotice);
    return `| ${coleccio} | \`${encodeURIComponent(element.identifier)}\` | ${llicencia.valor ? escapaMarkdown(llicencia.valor) : '(no declarada)'} | ${llicencia.oberta ? 'sí' : 'no'} |`;
  }));
  return [
    '# Llicències dels elements',
    '',
    "Este paquet no canvia la llicència de cap contingut: cada element porta la seua. Sense llicència declarada, no s'atorga cap dret de reutilització.",
    'Obertes: CC0 1.0, CC BY 4.0 i CC BY-SA 4.0. Les NC, ND i «©» no ho són.',
    '',
    '| Col·lecció | Element | Llicència declarada | Oberta |',
    '| --- | --- | --- | --- |',
    ...(files.length ? files : ['| — | — | — | — |']),
    ''
  ].join('\n');
}

/* ── Preparació (pura i síncrona) ───────────────────────────────────────── */

const perData = (camp, descendent) => (a, b) => {
  const [ta, tb] = [instantDe(a.element[camp]), instantDe(b.element[camp])];
  if ((ta === null) !== (tb === null)) return ta === null ? 1 : -1;
  const ordre = ta === null ? 0 : comparaInstants(ta, tb);
  if (ordre) return descendent ? -ordre : ordre;
  return compara(a.element.identifier, b.element.identifier);
};

/**
 * Els fitxers de dades del paquet (data/…), sense hashos: pur, síncron i
 * deterministe. Llança TypeError amb una entrada invàlida (claus
 * desconegudes, municipi sense nom, `ara` absent, el Mercat…).
 * @param {{ municipi: { slug?, nom, id?, descripcio?, wikidata?, lat?, lng? }, ara: string,
 *   origen?: string, actorsPublicats?: string[], noticies?: object[], agenda?: object[],
 *   entitats?: object[], memoria?: object[], personalitzacio?: { taxonomia?, estil? } }} entrada
 *   `actorsPublicats`: els slugs dels actors que el build publica a `origen`
 *   (recullActorsPublics(...).map((a) => a.slug)); sense, cap enllaç federat.
 * @returns {{ slug, nom, ara, arrel, fitxers: Array<{ nom, text, mediatype, format, titol }>, omissions, comptes }}
 */
export function preparaDadesObertesMunicipi(entrada) {
  if (!esObjecte(entrada)) throw new TypeError("Cal l'entrada de l'exportació.");
  if (Object.hasOwn(entrada, 'mercat') || Object.hasOwn(entrada, 'marketItems')) {
    throw new TypeError('El Mercat no entra al paquet: hi ha persones venedores (disseny NLnet B, D-B4).');
  }
  const desconeguda = Object.keys(entrada).find((clau) => !CLAUS_ENTRADA.includes(clau));
  if (desconeguda) throw new TypeError(`Camp d'entrada no admés: ${desconeguda.slice(0, 40)}`);
  const ara = dataIso(entrada.ara);
  if (!ara) throw new TypeError("Cal l'instant de l'exportació (`ara`, ISO 8601 amb zona): el paquet no llig cap rellotge.");
  const municipi = municipiDe(entrada.municipi);
  const base = entrada.origen === undefined || entrada.origen === null ? null : normalitzaOrigen(entrada.origen);
  const actors = entrada.actorsPublicats ?? [];
  if (!Array.isArray(actors) || actors.some((slug) => typeof slug !== 'string')) {
    throw new TypeError('«actorsPublicats» ha de ser la llista dels slugs dels actors publicats.');
  }
  const enllacos = base && actors.includes(municipi.slug) ? urlsDeMunicipi(municipi.slug, { origen: base }) : null;

  const omissions = { noticies: nouRecompte(), agenda: nouRecompte(), directori: nouRecompte(), memoria: nouRecompte(), configuracio: nouRecompte() };
  /* Primer el directori: l'autoria de cada element s'hi enllaça (autorSchema). */
  const triades = triaElements(entrada.entitats, municipi, 'directori', omissions.directori, { ambAutoria: false, pobleDe: pobleDeLEntitat });
  const signants = signantsDelDirectori(entrada.entitats, new Set(triades.map(({ id }) => id)));
  const directori = entitatsDelDirectori(triades, base, omissions.directori, municipi)
    .sort((a, b) => compara(a.name, b.name) || compara(a.identifier, b.identifier))
    .map((element) => ({ element, coincidencia: 'declarada' }));
  const vista = (coleccio, llista, aSchema) => triaElements(llista, municipi, coleccio, omissions[coleccio])
    .map((triat) => ({ element: aSchema(triat, { base, recompte: omissions[coleccio], signants }), coincidencia: triat.coincidencia }));
  const noticies = vista('noticies', entrada.noticies, noticiaSchema).sort(perData('datePublished', true));
  const agenda = vista('agenda', entrada.agenda, acteSchema).sort(perData('startDate', false));
  const memoria = vista('memoria', entrada.memoria, memoriaSchema).sort((a, b) => compara(a.element.identifier, b.element.identifier));
  const configuracio = configuracioDe(entrada.personalitzacio, omissions.configuracio);

  const seccions = [
    { coleccio: 'noticies', fitxer: 'noticies.jsonld', titol: 'Notícies i avisos', llista: noticies, data: (e) => e.datePublished },
    { coleccio: 'agenda', fitxer: 'agenda.jsonld', titol: 'Agenda', llista: agenda, data: (e) => e.startDate },
    { coleccio: 'directori', fitxer: 'directori.jsonld', titol: "Directori d'entitats i comerços", llista: directori, data: () => null },
    { coleccio: 'memoria', fitxer: 'memoria-cultural.jsonld', titol: 'Memòria cultural', llista: memoria, data: () => null }
  ].map((s) => ({ ...s, elements: s.llista.map(({ element }) => element), coincidencies: s.llista.map(({ coincidencia }) => coincidencia) }));
  const grafs = Object.fromEntries(seccions.map(({ coleccio, elements }) => [coleccio, { '@context': 'https://schema.org', '@graph': elements }]));
  /* Els motius en ordre fix: l'ordre de l'entrada no ha de canviar cap byte de memoria.md. */
  const netes = Object.fromEntries(Object.entries(omissions).map(([clau, motius]) => [clau,
    Object.fromEntries(Object.keys(motius).sort(compara).map((motiu) => [motiu, motius[motiu]]))]));

  const fitxers = [
    { nom: 'agenda.jsonld', text: jsonCanonic(grafs.agenda), mediatype: 'application/ld+json', format: 'jsonld', titol: 'Agenda (schema.org Event)' },
    {
      nom: 'configuracio.json',
      text: jsonCanonic({ format: FORMAT_DADES_OBERTES, municipi: { slug: municipi.slug, nom: municipi.nom }, personalitzacio: configuracio }),
      mediatype: 'application/json', format: 'json', titol: 'Configuració del poble (taxonomia i estil)'
    },
    { nom: 'directori.jsonld', text: jsonCanonic(grafs.directori), mediatype: 'application/ld+json', format: 'jsonld', titol: "Directori d'entitats i comerços (schema.org)" },
    { nom: 'llicencies.md', text: llicenciesMd(seccions), mediatype: 'text/markdown', format: 'md', titol: 'Llicència de cada element' },
    { nom: 'memoria-cultural.jsonld', text: jsonCanonic(grafs.memoria), mediatype: 'application/ld+json', format: 'jsonld', titol: 'Memòria cultural (schema.org CreativeWork)' },
    {
      nom: 'memoria.md',
      text: memoriaMd({ municipi, ara, enllacos, seccions, omissions: netes, configuracio }),
      mediatype: 'text/markdown', format: 'md', titol: 'Memòria del paquet (Markdown)'
    },
    { nom: 'municipi.jsonld', text: jsonCanonic(municipiSchema(municipi, enllacos)), mediatype: 'application/ld+json', format: 'jsonld', titol: 'El municipi (schema.org AdministrativeArea)' },
    { nom: 'noticies.jsonld', text: jsonCanonic(grafs.noticies), mediatype: 'application/ld+json', format: 'jsonld', titol: 'Notícies i avisos (schema.org NewsArticle)' }
  ];
  return {
    slug: municipi.slug,
    nom: municipi.nom,
    ara,
    origen: base,
    arrel: `dades-obertes-${municipi.slug}`,
    fitxers,
    omissions: netes,
    comptes: Object.fromEntries(seccions.map(({ coleccio, elements }) => [coleccio, elements.length]))
  };
}

/* ── SHA-256, BagIt, Data Package i ZIP ─────────────────────────────────── */

const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

async function sha256Hex(bytes, subtle) {
  return hex(new Uint8Array(await subtle.digest('SHA-256', bytes)));
}

function subtleDe(subtle) {
  if (typeof subtle?.digest !== 'function') {
    throw new Error('Cal crypto.subtle (un context segur) per a calcular els SHA-256 del paquet.');
  }
  return subtle;
}

/**
 * El ZIP de `fitxers` ({ nom, dades }) amb els noms en ordre de bytes (tots
 * són ASCII: l'ordre de les unitats UTF-16 és el dels bytes), STORE, CRC-32 i
 * data DOS fixa (creaZip): els mateixos fitxers donen sempre els mateixos bytes.
 */
export function empaquetaZip(fitxers) {
  if (!Array.isArray(fitxers)) throw new TypeError('empaquetaZip espera una llista de fitxers.');
  return creaZip([...fitxers].sort((a, b) => compara(a?.nom, b?.nom)));
}

const manifest = (entrades) => entrades.map(({ cami, sha256 }) => `${sha256}  ${cami}\n`).join('');

/**
 * El paquet complet: els fitxers de dades, el datapackage.json amb el SHA-256 i
 * la mida de cada recurs, la bossa BagIt i el ZIP. Mateixa entrada, mateixos
 * bytes. `subtle` (per defecte, globalThis.crypto.subtle) només calcula hashos.
 * @returns {Promise<{ slug, arrel, nomFitxer, fitxers: Array<{ cami, bytes, sha256 }>,
 *   datapackage: object, zip: Uint8Array, sha256: string, omissions, comptes }>}
 */
export async function exportaMunicipiOpenData(entrada, { subtle = globalThis.crypto?.subtle } = {}) {
  const digest = subtleDe(subtle);
  const preparat = preparaDadesObertesMunicipi(entrada);
  const codificador = new TextEncoder();
  const dades = await Promise.all(preparat.fitxers.map(async (fitxer) => {
    const bytes = codificador.encode(fitxer.text);
    return { ...fitxer, bytes, sha256: await sha256Hex(bytes, digest) };
  }));
  const datapackage = {
    $schema: ESQUEMA_DATAPACKAGE,
    name: preparat.arrel,
    title: `Dades obertes de ${preparat.nom}`,
    description: 'Contingut públic del municipi i de les seues entitats exportat per el Mas (Sóc de Poble). '
      + "Sense dades de persones. La llicència de cada element és a llicencies.md: el conjunt no n'atorga cap de nova.",
    created: preparat.ara,
    licenses: [{ path: 'llicencies.md', title: 'Cada element porta la seua llicència; sense llicència declarada no hi ha cap dret de reutilització' }],
    sources: [{ title: 'Sóc de Poble (el Mas)', path: preparat.origen }],
    keywords: ['dades obertes', 'municipi', preparat.slug],
    resources: dades.map((fitxer) => ({
      name: fitxer.nom.replace(/\.[a-z]+$/, ''),
      path: fitxer.nom,
      title: fitxer.titol,
      format: fitxer.format,
      mediatype: fitxer.mediatype,
      encoding: 'utf-8',
      bytes: fitxer.bytes.length,
      hash: `sha256:${fitxer.sha256}`
    })),
    socdepoble: {
      format: FORMAT_DADES_OBERTES,
      versio: VERSIO_FORMAT,
      municipi: preparat.slug,
      comptes: preparat.comptes,
      omissions: preparat.omissions
    }
  };
  const textDatapackage = jsonCanonic(datapackage);
  const bytesDatapackage = codificador.encode(textDatapackage);
  const carrega = [...dades, { nom: 'datapackage.json', bytes: bytesDatapackage, sha256: await sha256Hex(bytesDatapackage, digest) }]
    .map(({ nom, bytes, sha256 }) => ({ cami: `data/${nom}`, bytes, sha256 }))
    .sort((a, b) => compara(a.cami, b.cami));
  const octets = carrega.reduce((total, { bytes }) => total + bytes.length, 0);
  const etiquetes = [
    ['bagit.txt', 'BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n'],
    ['bag-info.txt', [
      `Bag-Software-Agent: Sóc de Poble · exportaMunicipiOpenData ${VERSIO_FORMAT}`,
      `Bagging-Date: ${preparat.ara.slice(0, 10)}`,
      `External-Description: Dades obertes públiques de ${preparat.nom} (${FORMAT_DADES_OBERTES})`,
      `External-Identifier: ${preparat.arrel}`,
      `Payload-Oxum: ${octets}.${carrega.length}`
    ].join('\n').concat('\n')],
    ['manifest-sha256.txt', manifest(carrega)]
  ];
  const tags = await Promise.all(etiquetes.map(async ([cami, text]) => {
    const bytes = codificador.encode(text);
    return { cami, bytes, sha256: await sha256Hex(bytes, digest) };
  }));
  const tagmanifest = codificador.encode(manifest([...tags].sort((a, b) => compara(a.cami, b.cami))));
  const tots = [...tags, ...carrega, { cami: 'tagmanifest-sha256.txt', bytes: tagmanifest, sha256: await sha256Hex(tagmanifest, digest) }]
    .sort((a, b) => compara(a.cami, b.cami));
  const zip = empaquetaZip(tots.map(({ cami, bytes }) => ({ nom: `${preparat.arrel}/${cami}`, dades: bytes })));
  return {
    slug: preparat.slug,
    arrel: preparat.arrel,
    nomFitxer: `${preparat.arrel}-${preparat.ara.slice(0, 10).replace(/-/g, '')}.zip`,
    fitxers: tots.map(({ cami, bytes, sha256 }) => ({ cami, bytes: bytes.length, sha256 })),
    datapackage: JSON.parse(textDatapackage),
    zip,
    sha256: await sha256Hex(zip, digest),
    omissions: preparat.omissions,
    comptes: preparat.comptes
  };
}

/* ── Verificació (falla tancat) ─────────────────────────────────────────── */

const LINIA_MANIFEST = /^([0-9a-f]{64}) {2}([A-Za-z0-9/._-]{1,128})$/;
/* El name d'un recurs (Data Package v2: minúscules, xifres, «.», «-» i «_»). */
const NOM_DE_RECURS = /^[a-z0-9._-]{1,128}$/;
const ETIQUETES = Object.freeze(['bag-info.txt', 'bagit.txt', 'manifest-sha256.txt', 'tagmanifest-sha256.txt']);

function llegeixManifest(text, nom) {
  if (!text.endsWith('\n')) throw new TypeError(`${nom}: falta el salt de línia final.`);
  const entrades = new Map();
  for (const linia of text.slice(0, -1).split('\n')) {
    const m = LINIA_MANIFEST.exec(linia);
    if (!m || entrades.has(m[2])) throw new TypeError(`${nom}: línia invàlida o repetida.`);
    entrades.set(m[2], m[1]);
  }
  return entrades;
}

/**
 * Comprova un paquet: un sol directori arrel `dades-obertes-<slug>/`, només
 * els noms esperats, bagit.txt de BagIt 1.0, cada fitxer de data/ al
 * manifest i cada línia del manifest amb el SHA-256 del seu fitxer (i el
 * mateix per al tagmanifest), Payload-Oxum, i el datapackage.json coherent
 * (hash i bytes de cada recurs, path i name únics, i un recurs per a cada
 * fitxer de dades, ni més ni menys). Qualsevol diferència → TypeError: falla
 * tancat. No escriu res ni fa cap petició.
 * @returns {Promise<{ slug, arrel, fitxers: number, recursos: number }>}
 */
export async function verificaPaquetOpenData(zip, { subtle = globalThis.crypto?.subtle, maxEixida = MAXIM_PAQUET } = {}) {
  const digest = subtleDe(subtle);
  const entrades = llegeixZip(zip, { maxEixida });
  const arrel = /^(dades-obertes-[a-z0-9]+(?:-[a-z0-9]+)*)\//.exec(entrades[0]?.nom ?? '')?.[1];
  if (!arrel || !normalitzaSlugMunicipi(arrel.slice('dades-obertes-'.length))) throw new TypeError('Paquet sense directori arrel dades-obertes-<slug>/.');
  const fitxers = new Map();
  for (const { nom, dades } of entrades) {
    const cami = nom.startsWith(`${arrel}/`) ? nom.slice(arrel.length + 1) : '';
    const valid = ETIQUETES.includes(cami) || (cami.startsWith('data/') && NOM_DE_DADES.test(cami.slice(5)));
    if (!valid || fitxers.has(cami)) throw new TypeError(`Fitxer no esperat o repetit dins del paquet: ${nom.slice(0, 120)}`);
    fitxers.set(cami, dades);
  }
  if (ETIQUETES.some((nom) => !fitxers.has(nom))) throw new TypeError('Falten fitxers de la bossa BagIt.');
  const descodificador = new TextDecoder('utf-8', { fatal: true });
  const text = (cami) => descodificador.decode(fitxers.get(cami));
  if (text('bagit.txt') !== 'BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n') throw new TypeError('bagit.txt no és de BagIt 1.0 en UTF-8.');

  const comprova = async (nomManifest, esperats) => {
    const llistats = llegeixManifest(text(nomManifest), nomManifest);
    if (llistats.size !== esperats.length || esperats.some((cami) => !llistats.has(cami))) {
      throw new TypeError(`${nomManifest}: no llista exactament els fitxers del paquet.`);
    }
    for (const cami of esperats) {
      if (await sha256Hex(fitxers.get(cami), digest) !== llistats.get(cami)) throw new TypeError(`SHA-256 que no quadra: ${cami}`);
    }
  };
  const carrega = [...fitxers.keys()].filter((cami) => cami.startsWith('data/')).sort(compara);
  await comprova('manifest-sha256.txt', carrega);
  await comprova('tagmanifest-sha256.txt', ['bag-info.txt', 'bagit.txt', 'manifest-sha256.txt']);
  const octets = carrega.reduce((total, cami) => total + fitxers.get(cami).length, 0);
  if (!text('bag-info.txt').split('\n').includes(`Payload-Oxum: ${octets}.${carrega.length}`)) throw new TypeError('bag-info.txt: Payload-Oxum que no quadra.');

  if (!fitxers.has('data/datapackage.json')) throw new TypeError('Falta data/datapackage.json.');
  let datapackage = null;
  try { datapackage = JSON.parse(text('data/datapackage.json')); } catch { datapackage = null; }
  if (!esObjecte(datapackage) || !Array.isArray(datapackage.resources)) throw new TypeError('datapackage.json invàlid.');
  /* Gauntlet 261030 (C9 de Codex) · Cada recurs amb un path i un name únics
     (Data Package v2: el name és únic dins del paquet) i el conjunt dels paths
     IGUAL al dels fitxers de dades, ni més ni menys. Abans només se'n comparava
     el nombre: un recurs repetit en podia substituir un altre i el recompte
     quadrava. */
  const camins = new Set();
  const noms = new Set();
  for (const recurs of datapackage.resources) {
    const cami = `data/${esObjecte(recurs) && typeof recurs.path === 'string' ? recurs.path : ''}`;
    if (!fitxers.has(cami) || cami === 'data/datapackage.json') throw new TypeError(`Recurs sense fitxer: ${cami.slice(0, 120)}`);
    const nom = typeof recurs.name === 'string' && NOM_DE_RECURS.test(recurs.name) ? recurs.name : '';
    if (!nom) throw new TypeError(`Recurs sense un name vàlid: ${cami.slice(0, 120)}`);
    if (camins.has(cami) || noms.has(nom)) throw new TypeError(`Recurs repetit a datapackage.json (path o name): ${cami.slice(0, 120)}`);
    camins.add(cami);
    noms.add(nom);
    const bytes = fitxers.get(cami);
    if (recurs.bytes !== bytes.length || recurs.hash !== `sha256:${await sha256Hex(bytes, digest)}`) {
      throw new TypeError(`datapackage.json no quadra amb ${cami}.`);
    }
  }
  const deDades = carrega.filter((cami) => cami !== 'data/datapackage.json');
  if (camins.size !== deDades.length || deDades.some((cami) => !camins.has(cami))) throw new TypeError('datapackage.json no descriu tots els fitxers de dades.');
  return { slug: arrel.slice('dades-obertes-'.length), arrel, fitxers: fitxers.size, recursos: datapackage.resources.length };
}

/* ── Recollida des del port neutral ─────────────────────────────────────── */

/**
 * El que el port (src/data/backendPort.js) ja servix com a PÚBLIC per a un
 * municipi. Hui només el directori d'entitats: listPublicOrganizations
 * (capacitat 'directoriEntitats'; visibility 'public' i mai cap correu,
 * contracte.js) filtrat pel NOM del poble al servidor i, ací, una altra
 * volta (town_name igual, visibility pública si ve).
 *
 * Què NO es recull i per què (decisió 5: només amb mètodes públics adequats):
 *   · notícies, agenda i memòria: loadMur barreja el contingut de
 *     l'administració (app_content, públic) amb les publicacions del veïnat
 *     (section_submissions, només per a membres) i envia el JWT de la sessió
 *     si n'hi ha (runtime.js): amb una sessió d'administració, el paquet
 *     arreplegaria contingut que el convidat no veu. loadActesAgenda no el
 *     té cap adaptador. Cal una capacitat de lectura anònima garantida
 *     (disseny NLnet B §4.1: `dadesObertes: ['llegixDadesObertes']`), que
 *     toca contracte.js (SDP-LOCK: aprovació del Mestre, D-B7).
 *   · configuració: loadCoreContent porta `personalitzacio` del tenant, no
 *     d'un poble; qui exporta la passa a mà si el tenant és d'un sol poble.
 * El directori no es pagina: amb LIMIT_DIRECTORI_ENTITATS files no se sap si
 * en falten, i s'atura (RangeError) en lloc de tallar en silenci.
 * @param {{ teCapacitat: Function, listPublicOrganizations?: Function }} port
 * @param {{ slug?: string, nom: string }} municipi
 * @returns {Promise<{ municipi, entitats: object[]|null, pendents: Array<{ coleccio, motiu }> }>}
 */
export async function recullDadesPubliquesDelMunicipi(port, municipi, { config = {}, signal } = {}) {
  if (!port || typeof port.teCapacitat !== 'function') throw new TypeError('Cal el port de dades (backendPort).');
  const { slug, nom } = municipiDe({ ...(municipi?.slug === undefined ? {} : { slug: municipi.slug }), nom: municipi?.nom });
  const pendents = [
    { coleccio: 'noticies', motiu: 'sense lectura anònima garantida al port (cal la capacitat dadesObertes, D-B7)' },
    { coleccio: 'agenda', motiu: 'sense lectura anònima garantida al port (cal la capacitat dadesObertes, D-B7)' },
    { coleccio: 'memoria', motiu: 'el Mas no té cap mòdul de memòria cultural' },
    { coleccio: 'configuracio', motiu: "la personalització és del tenant: la passa qui exporta" }
  ];
  if (!port.teCapacitat('directoriEntitats')) {
    return { municipi: { slug, nom }, entitats: null, pendents: [{ coleccio: 'directori', motiu: 'el backend no té la capacitat directoriEntitats' }, ...pendents] };
  }
  const files = await port.listPublicOrganizations({ poble: nom, limit: LIMIT_DIRECTORI_ENTITATS, signal }, config);
  if (!Array.isArray(files)) throw new TypeError('listPublicOrganizations no ha tornat cap llista.');
  if (files.length >= LIMIT_DIRECTORI_ENTITATS) {
    throw new RangeError(`El directori de ${nom} arriba al sostre de ${LIMIT_DIRECTORI_ENTITATS} entitats: no se sap si en falten i no es talla en silenci.`);
  }
  const entitats = files.filter((fila) => esObjecte(fila) && textLinia(fila.town_name) === nom
    && (!presentDe(fila.visibility) || fila.visibility === 'public'));
  return { municipi: { slug, nom }, entitats, pendents };
}
