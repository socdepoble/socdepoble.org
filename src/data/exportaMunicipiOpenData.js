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
 *   dades-obertes-<slug>/data/agenda.ics          iCalendar (RFC 5545), només si hi ha cap acte amb data d'inici
 *   dades-obertes-<slug>/data/agenda.jsonld       schema.org Event
 *   dades-obertes-<slug>/data/configuracio.json   taxonomia i estil validats
 *   dades-obertes-<slug>/data/datapackage.json    Data Package v2 (hash sha256:…)
 *   dades-obertes-<slug>/data/directori.jsonld    schema.org Organization / LocalBusiness
 *   dades-obertes-<slug>/data/llicencies.md       la llicència de cada element
 *   dades-obertes-<slug>/data/memoria-cultural.jsonld   schema.org CreativeWork
 *   dades-obertes-<slug>/data/memoria-oral.jsonld schema.org CreativeWork, només amb fitxes (1.2.0)
 *   dades-obertes-<slug>/data/memoria.md          el paquet explicat (Markdown)
 *   dades-obertes-<slug>/data/municipi.jsonld     schema.org AdministrativeArea
 *   dades-obertes-<slug>/data/noticies.jsonld     schema.org NewsArticle
 *   dades-obertes-<slug>/data/okf/index.md, log.md i memoria-oral/<poble>/<fitxa>.md
 *                                                 fitxes de memòria oral en OKF v0.2 (1.2.0)
 *   dades-obertes-<slug>/manifest-sha256.txt      «<sha256>  data/…» (sha256sum -c)
 *   dades-obertes-<slug>/tagmanifest-sha256.txt
 *
 * Fonts: Data Package v2 (datapackage.org/standard/data-package i
 * data-resource: `hash` amb el prefix de l'algorisme), BagIt (RFC 8493),
 * schema.org (AdministrativeArea, NewsArticle, Event, Organization,
 * LocalBusiness, CreativeWork), iCalendar (RFC 5545, amb NAME de RFC 7986),
 * APPNOTE de PKWARE per al ZIP. Disseny NLnet B
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
import { COLECCIONS_DADES_OBERTES, LIMIT_DADES_OBERTES, LIMIT_DIRECTORI_ENTITATS } from './contracte.js';
import { fallesDeDadesObertes } from './dadesObertesLot.js';
import {
  FONT_SENSE_URL, NIVELLS_CONFIANCA, OKF_VERSIO, TIPUS_OKF, entradaLog, indexOkf, markdownOkf, nivellDeConfianca, validaFitxaOkf
} from '../sections/notes/memoriaOral.js';
import { validaTaxonomia } from './personalitzacio.js';
import { LLICENCIES, MARCA_CC0 } from '../components/universal/drets/llicencies.js';
import { declaracionsDe, validaEstil } from '../config/estil.js';
import { instantEnLaZona, ZONA_PER_DEFECTE } from '../utils/esdeveniment.js';
import { creaZip, llegeixZip } from '../utils/fulls/zip.js';
import { escapa as escapaTextIcs, plega as plegaLiniaIcs } from '../utils/ics.js';
import { nomDeLaGent } from '../sections/pobles/nomsDelPoble.js';
import { llevaEnquadrament } from '../utils/enquadramentUrl.js';

export const FORMAT_DADES_OBERTES = 'socdepoble.dadesobertes.v1';
/* La versió de l'esquema del paquet (schemaVersion a datapackage.json), en
   SemVer. 1.1.0 (T3.1 de la marató del 261101) hi afig data/agenda.ics, el
   camp schemaVersion i el recompte socdepoble.calendari.
   I hi canvia un valor (Gauntlet 2 261101, G2-08): l'endDate d'un acte de
   dies sencers a agenda.jsonld és l'ÚLTIM dia de l'acte, inclusiu, com
   schema.org (fiInclusiva, B1-01), i no la fi exclusiva del model
   d'esdeveniment, que la 1.0.0 copiava tal qual (un dia més). Un lector de
   la 1.0.0 llig, per al mateix acte, un endDate un dia abans. Cap descàrrega
   no n'ha portat cap encara: l'agenda de la fitxa del poble està pendent.
   Compatibilitat (Gauntlet 261101, B1-04): el verificador 1.0.0 (el
   verificaPaquetOpenData d'abans, amb la llista tancada .jsonld|.json|.md)
   REBUTJA un paquet 1.1.0 que porte data/agenda.ics, i accepta el que no en
   porta (cap acte amb data d'inici). El llegixen sha256sum -c, els validadors
   BagIt genèrics (RFC 8493 no limita els noms de la càrrega) i el verificador
   1.1.0, que també accepta els paquets 1.0.0. Per a un validador estricte, el
   salt menor no és retrocompatible; anunciar-ho amb una 2.0.0 és decisió del
   Mestre.
   1.2.0 (T2 · D04/D10, assalt 261101; pla 261101_1246, D-3) hi afig la
   memòria oral: data/memoria-oral.jsonld (schema.org CreativeWork) i el
   catàleg OKF v0.2 a data/okf/ (index.md, log.md i una fitxa .md per relat),
   NOMÉS si hi ha almenys una fitxa revisada per una persona i signada per una
   entitat. Sense cap, el paquet és el de la 1.1.0 llevat de la cadena de
   versió. El verificador 1.1.0 (NOM_DE_DADES sense okf/) rebutja un paquet
   amb okf/ i accepta els que no en porten; el 1.2.0 llig els tres formats, i
   el restaurador (importaMunicipiOpenData.js) també. */
export const VERSIO_FORMAT = '1.2.0';
export const ESQUEMA_DATAPACKAGE = 'https://datapackage.org/profiles/2.0/datapackage.json';
/* Perfil municipal de Data Package v2: la bossa conserva els drets de cada
 * element. El descriptor no pot atribuir una llicència nova al conjunt. */
export const LLICENCIES_DATAPACKAGE = Object.freeze([Object.freeze({
  path: 'llicencies.md',
  title: 'Cada element porta la seua llicència; sense llicència declarada no hi ha cap dret de reutilització'
})]);
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
    'copyright', 'town_name', 'visibility']),
  /* T2 · 1.2.0 · Una fitxa de memòria oral: la fitxa OKF sencera (okf) i qui la signa. */
  memoriaOral: new Set(['id', 'visibility', 'copyright', 'created_at', 'updated_at', ...AUTORIA, ...PERSONA, 'okf'])
});
const CLAUS_ENTRADA = Object.freeze(['municipi', 'ara', 'origen', 'actorsPublicats', 'noticies', 'agenda', 'entitats', 'memoria', 'memoriaOral',
  'personalitzacio', 'activityStreams', 'pendents']);
/* Les col·leccions que «pendents» pot declarar no exportades (recullDadesPubliquesDelMunicipi), amb el seu nom a memoria.md. */
export const NOMS_DE_PENDENT = Object.freeze({
  noticies: 'Notícies i avisos', agenda: 'Agenda', directori: "Directori d'entitats i comerços", memoria: 'Memòria cultural',
  memoriaOral: 'Memòria oral (fitxes OKF)', configuracio: 'Configuració del poble'
});
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
/* T2 · 1.2.0 · També el catàleg OKF: okf/index.md, okf/log.md i okf/memoria-oral/<poble>/<fitxa>.md. Cap «..», cap barra invertida ni cap camí absolut hi casa. */
const NOM_DE_DADES = /^(?:[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jsonld|json|md|ics)|okf\/(?:index|log)\.md|okf\/memoria-oral\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\.md)$/;

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
 * P0-80 / IDEA-211 (llei del Mestre, 09-11-2026) · Una capçalera desada és la
 * foto sencera amb el marc al fragment #sdp-crop=: qui reutilitza les dades
 * obertes no pinta el nostre CSS, i rep la foto sencera (sense el fragment,
 * que abans feia caure la imatge).
 */
export function imatgeDe(valor, base = null) {
  const text = typeof valor === 'string' ? llevaEnquadrament(valor.trim()) : '';
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

/* Gauntlet 261101 (B1-01) · La `fi` de l'acte és la del model d'esdeveniment,
   EXCLUSIVA (utils/esdeveniment.js: un acte de tot el dia del 29 acaba
   { data: '…-30' }, com a l'RFC 5545 i a Google; així la lligen agendaMur.js
   i l'ActeDTO de Sollutia), i l'endDate de schema.org d'un dia sencer és
   l'ÚLTIM dia de l'acte: un dia abans. Cap endDate si eixe últim dia cauria
   abans del dia d'inici (la fi no seria posterior: el model no admet l'acte)
   o abans de l'any 1000. Amb un inici amb hora (tipus barrejats, que el model
   tampoc no admet), el dia d'inici és el de la seua data, la de paret del
   seu desfasament. Una fi amb hora és un instant, el mateix en les dues
   convencions, i ix tal qual. */
function fiInclusiva(fi, inici) {
  if (typeof fi !== 'string' || !DIA.test(fi)) return fi;
  const [any, mes, dia] = fi.split('-').map(Number);
  const abans = new Date(Date.UTC(any, mes - 1, dia - 1));
  const ultim = diaValid(`${String(abans.getUTCFullYear()).padStart(4, '0')}-${dosXifres(abans.getUTCMonth() + 1)}-${dosXifres(abans.getUTCDate())}`);
  return ultim && !(inici && ultim < inici.slice(0, 10)) ? ultim : null;
}

/* T2-G02 · L'endDate que escrivia la 1.0.0 per a la `fi` d'un acte sense
   zona pròpia (com les files restaurades): el moment del model tal qual, la
   fi EXCLUSIVA, sense fiInclusiva. El restaurador
   (importaMunicipiOpenData.js) el fa servir per a regenerar l'agenda d'un
   paquet 1.0.0 i comparar-la byte a byte. null si no és cap moment. */
export const endDateDeLaVersio100 = (fi) => momentSchema(fi, ZONA_PER_DEFECTE);

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
    endDate: fiInclusiva(momentSchema(item.fi, zona), inici),
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

/* ── Memòria oral: fitxes OKF v0.2 (T2 · 1.2.0) ─────────────────────────── */

/* L'únic actor humà que una fitxa pública pot portar: la persona sense
   identificador del Bloc (memoriaOralDelBloc.js · PERSONA_SENSE_IDENTIFICADOR).
   Mai l'id d'un compte. */
export const ACTOR_HUMA_PUBLICABLE = 'human:sense-identificador';
/* El motor que proposa la fitxa (memoriaOral.js · ACTOR_ESTRUCTURADOR), de qualsevol versió. */
const ACTOR_MOTOR = /^socdepoble-memoria-oral\/\d{1,4}\.\d{1,4}\.\d{1,4}$/;
/* memoria-oral/<poble>/<fitxa>.md, el camí d'estructuraMemoriaOral, amb segments de slug. */
const CAMI_OKF = /^memoria-oral\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const MAXIM_CAMI_OKF = 200;
const MAXIM_COS_OKF = 256 * 1024;

/* El poble d'una fitxa: el que DECLARA el seu frontmatter (`municipi`, el
   slug), i cap altre. Sense, no és de cap poble. */
function pobleDeLaFitxa(item, municipi) {
  const fm = esObjecte(item.okf) && esObjecte(item.okf.frontmatter) ? item.okf.frontmatter : null;
  const poble = typeof fm?.municipi === 'string' ? fm.municipi.trim() : '';
  if (!poble) return null;
  return poble === municipi.slug ? 'declarada' : 'altre';
}

/* Una referència publicable d'una font o d'un recurs: el text del Bloc sense
   URL o una URL https sense credencials, consulta, fragment ni camí de
   Storage, escrita ja en la seua forma normal (mai es reescriu: el relat
   revisat és el que és). */
function recursPublicable(valor) {
  if (valor === FONT_SENSE_URL) return true;
  if (typeof valor !== 'string' || valor.length > 2048) return false;
  let url = null;
  try { url = new URL(valor); } catch { return false; }
  return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash
    && !url.pathname.startsWith(PREFIX_STORAGE) && url.href === valor;
}

/* Els instants d'una fitxa que arriba com a JSON: text, mai un Date. */
const instantsDeText = (fm, verificacions) => [fm.generated?.at, fm.stale_after, ...verificacions.map((v) => v?.at)]
  .every((valor) => valor === undefined || typeof valor === 'string');

/* El frontmatter publicable, refet camp a camp en l'ordre del serialitzador
   (memoriaOral.js · serialitzaFrontmatter): cap clau d'extensió, els textos
   en una línia i sense marcatge. */
function frontmatterPublicable(fm, verificacions) {
  const fonts = Array.isArray(fm.sources) ? fm.sources : null;
  return {
    type: TIPUS_OKF,
    title: textLinia(fm.title),
    description: textLinia(fm.description),
    ...(fm.resource !== undefined ? { resource: fm.resource } : {}),
    ...(Array.isArray(fm.tags) ? { tags: fm.tags.map(textLinia) } : {}),
    status: 'stable',
    generated: { by: fm.generated.by, ...(fm.generated.at !== undefined ? { at: fm.generated.at } : {}) },
    verified: verificacions.map((v) => ({ by: v.by, at: v.at })),
    ...(fm.stale_after !== undefined ? { stale_after: fm.stale_after } : {}),
    ...(fonts ? { sources: fonts.map((font) => ({
      ...(font.id !== undefined ? { id: textLinia(String(font.id)) } : {}),
      resource: font.resource,
      ...(font.title !== undefined ? { title: textLinia(font.title) } : {}),
      ...(font.author !== undefined ? { author: font.author } : {})
    })) } : {}),
    municipi: fm.municipi
  };
}

/* La fitxa publicable d'un element ja triat (públic, signat per una entitat i
   del poble), o el motiu de l'omissió. Només ix una fitxa OKF v0.2 vàlida, de
   tipus «Memòria oral», estable i revisada per una persona (§5.3,
   human-reviewed), proposada pel motor del Mas, amb cap actor humà que no
   siga la persona sense identificador i amb fonts publicables. */
function fitxaPublicable(item) {
  const okf = item.okf;
  if (!esObjecte(okf) || typeof okf.cami !== 'string' || !esObjecte(okf.frontmatter) || typeof okf.cos !== 'string') return { motiu: 'okfInvalides' };
  const fm = okf.frontmatter;
  const cami = okf.cami.length <= MAXIM_CAMI_OKF ? CAMI_OKF.exec(okf.cami) : null;
  if (!cami || cami[1] !== fm.municipi || fm.type !== TIPUS_OKF || !validaFitxaOkf(fm).valida) return { motiu: 'okfInvalides' };
  if (fm.status !== 'stable' || nivellDeConfianca(fm) !== NIVELLS_CONFIANCA.huma) return { motiu: 'noRevisades' };
  const verificacions = [].concat(fm.verified ?? []);
  const fonts = Array.isArray(fm.sources) ? fm.sources : [];
  if (!esObjecte(fm.generated) || !ACTOR_MOTOR.test(fm.generated.by) || verificacions.some((v) => v.by !== ACTOR_HUMA_PUBLICABLE)
    || fonts.some((font) => font.author !== undefined && font.author !== ACTOR_HUMA_PUBLICABLE)) return { motiu: 'actorsAmbIdentificador' };
  if (typeof fm.title !== 'string' || typeof fm.description !== 'string' || !instantsDeText(fm, verificacions)
    || (fm.resource !== undefined && !recursPublicable(fm.resource)) || fonts.some((font) => !recursPublicable(font.resource))) return { motiu: 'okfInvalides' };
  const cos = senseMarcatge(textNet(okf.cos));
  if (new TextEncoder().encode(cos).length > MAXIM_COS_OKF) return { motiu: 'okfInvalides' };
  const frontmatter = frontmatterPublicable(fm, verificacions);
  if (!validaFitxaOkf(frontmatter).valida) return { motiu: 'okfInvalides' };
  let markdown = '';
  try { markdown = markdownOkf(frontmatter, cos); } catch { return { motiu: 'okfInvalides' }; }
  return { okf: { cami: okf.cami, frontmatter, cos, markdown } };
}

function fitxaOralSchema({ item, id, entitat, okf }, { signants, municipi }) {
  const fm = okf.frontmatter;
  return {
    '@type': 'CreativeWork',
    '@id': referencia('memoria-oral.jsonld', id),
    identifier: id,
    name: fm.title,
    abstract: fm.description,
    genre: fm.type,
    keywords: fm.tags ?? null,
    creativeWorkStatus: fm.status,
    contentLocation: { '@id': referencia('municipi.jsonld', municipi.slug) },
    /* El text sencer és al seu fitxer Markdown, al costat. */
    url: `okf/${okf.cami}`,
    encodingFormat: 'text/markdown',
    ...datesDePublicacio(item),
    author: autorSchema(entitat, signants),
    ...llicenciaSchema(llicenciaDe(item.copyright))
  };
}

/* okf/log.md (OKF v0.2 §9): una línia per fitxa (entradaLog, amb el dia de la
   seua última revisió), agrupades per dia i, dins del dia, per camí. */
function logOkf(fitxes) {
  const entrades = fitxes.map((fitxa) => {
    const darrera = [].concat(fitxa.okf.frontmatter.verified).at(-1).at;
    const [capcalera, linia] = entradaLog({ okf: fitxa.okf }, { ara: darrera }).split('\n');
    return { capcalera, linia, cami: fitxa.okf.cami };
  }).sort((a, b) => compara(a.capcalera, b.capcalera) || compara(a.cami, b.cami));
  const linies = ['---', `okf_version: ${JSON.stringify(OKF_VERSIO)}`, '---', '', '# Registre de la memòria oral', ''];
  let dia = null;
  for (const { capcalera, linia } of entrades) {
    if (capcalera !== dia) {
      if (dia !== null) linies.push('');
      linies.push(capcalera);
      dia = capcalera;
    }
    linies.push(linia);
  }
  linies.push('');
  return linies.join('\n');
}

/* Els fitxers del catàleg OKF (ordenats per camí): una fitxa per relat, l'índex i el registre. Cap fitxa, cap fitxer. */
function fitxersOkf(fitxes, municipi) {
  if (!fitxes.length) return [];
  const perCami = [...fitxes].sort((a, b) => compara(a.okf.cami, b.okf.cami));
  return [
    ...perCami.map(({ okf }) => {
      const [, poble, fitxa] = CAMI_OKF.exec(okf.cami);
      return { nom: `okf/${okf.cami}`, recurs: `okf-${poble}--${fitxa}`, text: okf.markdown, mediatype: 'text/markdown', format: 'md', titol: 'Fitxa de memòria oral (Open Knowledge Format v0.2)' };
    }),
    {
      nom: 'okf/index.md', recurs: 'okf-index', mediatype: 'text/markdown', format: 'md', titol: 'Índex de la memòria oral (Open Knowledge Format v0.2)',
      text: indexOkf(perCami.map(({ okf }) => ({ okf: { cami: okf.cami, frontmatter: okf.frontmatter }, municipi: { nom: municipi.nom } })), { titol: 'Memòria oral' })
    },
    { nom: 'okf/log.md', recurs: 'okf-log', text: logOkf(perCami), mediatype: 'text/markdown', format: 'md', titol: 'Registre de revisions de la memòria oral (Open Knowledge Format v0.2)' }
  ];
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

/* Els registres anteriors podien contindre «<» com a text. Es neutralitza
   abans de validar la forma actual; no es perden en l'exportació del poble. */
function taxonomiaNeta(payload) {
  if (!esObjecte(payload)) return null;
  const netText=text=>typeof text==='string'?senseMarcatge(text.trim()):text;
  payload={...payload,
    ...(esObjecte(payload.pagines)?{pagines:Object.fromEntries(Object.entries(payload.pagines).map(([key,page])=>[key,esObjecte(page)&&Array.isArray(page.labels)?{...page,labels:page.labels.map(label=>esObjecte(label)?{...label,text:netText(label.text)}:label)}:page]))}:{}),
    ...(Array.isArray(payload.categories)?{categories:payload.categories.map(netText)}:{}),
    ...(Array.isArray(payload.etiquetes)?{etiquetes:payload.etiquetes.map(netText)}:{})};
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
/* Gauntlet 2 261101 (G2-06) · «de» davant del nom del poble, amb l'article
   contret i l'apòstrof, com mana l'AVL: «d'Alcoi», «del Campello», «dels
   Poblets», «de l'Alfàs del Pi», «de la Torre de les Maçanes», «de Benillup».
   La regla és una sola, la de nomDeLaGent (sections/pobles/nomsDelPoble.js:
   l'article en minúscula, la i i la u semivocals que no s'apostrofen), que
   hi posa «Gent » davant: ací se li lleva. Pur: cap xarxa ni rellotge. */
const GENT = 'Gent ';
function deNomDelPoble(nom) {
  const ambGent = nomDeLaGent(nom);
  return ambGent.startsWith(GENT) ? ambGent.slice(GENT.length) : `de ${nom}`;
}

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
      name: `Actor ActivityPub ${deNomDelPoble(municipi.nom)} a Sóc de Poble (fase 1, només lectura)`,
      url: enllacos.actor,
      encodingFormat: 'application/activity+json'
    } : null,
    geo: municipi.geo ? { '@type': 'GeoCoordinates', latitude: municipi.geo.lat, longitude: municipi.geo.lng } : null
  };
}

/* ── iCalendar (RFC 5545) ───────────────────────────────────────────────── */

/* La segona forma dels mateixos actes d'agenda.jsonld (cap altra font, cap
   camp nou): els que tenen data d'inici, per a importar-los a qualsevol
   calendari. Sense cap acte amb data no hi ha fitxer, perquè un VCALENDAR
   sense cap component no és vàlid (§3.6, «1*(eventc / …)»).
   Gauntlet 261101 (B1-02) · El TEXT s'escapa i les línies es pleguen amb
   escapa i plega d'utils/ics.js, les del serialitzador de l'App (aIcs): «\»,
   «;», «,» i els salts escapats i cap caràcter de control (§3.3.11), i trossos
   de 75 octets d'UTF-8 amb CRLF i un espai, mai dins d'un caràcter (§3.1).
   El VEVENT, en canvi, es fa ací i no amb aIcs: parteix d'un Event de
   schema.org ja filtrat per la llista blanca (no d'un esdeveniment del
   model) i és el contracte del paquet. Les diferències amb aIcs, a propòsit:
   · UID opac i estable: l'id de l'acte i el poble, sense l'origen ni cap
     instant, perquè dos exportacions del mateix acte (també després de
     traure-ho tot a un altre servidor) no el dupliquen al calendari. aIcs
     escriu l'uid del model («mur:<id>@socdepoble.org» per a un acte del Mur,
     o el de la font), i un calendari que importe les dos fonts duplica
     l'acte. Quin UID promet el paquet va amb la decisió B1-06 del Mestre (si
     l'uid i la recurrència de la font entren a la llista blanca); mentre
     l'agenda de la fitxa del poble continue pendent, cap descàrrega no n'ha
     portat cap i canviar-lo no duplica res.
   · DTSTAMP, sense METHOD, és l'última revisió de l'acte al magatzem
     (§3.8.7.2): la data d'edició, la de publicació o, sense cap de les dues,
     `ara`. Mai cap rellotge, i un altre `ara` no canvia l'.ics d'un acte
     amb dates. aIcs hi posa el seu `ara` a tots.
   · Les hores, en UTC (forma 2 de §3.3.5): cap TZID que demane un VTIMEZONE.
     aIcs escriu l'hora de paret amb TZID i el VTIMEZONE, que una regla de
     repetició necessita; el paquet no porta cap recurrència.
   · Sense fi, cap DTEND: un dia sencer dura el seu dia i un acte amb hora
     acaba on comença (§3.6.1). aIcs n'escriu una (fiEfectiva: el dia o una
     hora, perquè Google exigix la fi); el paquet no hi afig cap durada que
     la font no porte.
   · Un dia sencer és VALUE=DATE, i el seu DTEND és el dia SEGÜENT a l'endDate
     (l'últim dia, fiInclusiva): exclusiu (§3.6.1), el mateix DTEND que aIcs.
     Un DTEND d'un altre tipus que DTSTART o que no siga posterior no ix.
   · El PRODID és el del paquet, amb la versió del format.
   · Cada VEVENT porta UID, DTSTAMP i DTSTART, els obligatoris quan el
     calendari no porta METHOD (§3.6.1).
   · Mai ORGANIZER ni ATTENDEE (demanen una adreça, normalment mailto:) ni
     CONTACT: el paquet no porta cap correu ni telèfon. Tot és CLASS:PUBLIC
     perquè només hi entra el que és públic. */
const CRLF = '\r\n';
const DATA_HORA_UTC = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z$/;

/* Una data de schema.org com a valor d'iCalendar: { dia: true, valor:
   'AAAAMMDD' } o { dia: false, valor: 'AAAAMMDDTHHMMSSZ' } (en UTC; la fracció
   de segon no hi cap, §3.3.12, i es talla), o null. */
function momentIcs(data) {
  if (typeof data !== 'string' || !data) return null;
  if (DIA.test(data)) return diaValid(data) ? { dia: true, valor: data.replace(/-/g, '') } : null;
  const p = DATA_HORA_UTC.exec(dataIso(data) ?? '');
  return p ? { dia: false, valor: `${p[1]}${p[2]}${p[3]}T${p[4]}${p[5]}${p[6]}Z` } : null;
}

/* El dia després d'AAAAMMDD. L'endDate de dia és l'últim dia de l'acte
   (fiInclusiva), com a molt el 9999-12-30: el següent no passa mai de l'any
   9999. */
function diaSeguent(valor) {
  const d = new Date(Date.UTC(Number(valor.slice(0, 4)), Number(valor.slice(4, 6)) - 1, Number(valor.slice(6, 8)) + 1));
  return `${d.getUTCFullYear()}${dosXifres(d.getUTCMonth() + 1)}${dosXifres(d.getUTCDate())}`;
}

const uidIcs = (id, slug) => `agenda-${encodeURIComponent(id)}.${slug}@socdepoble.org`;

/* Les línies (sense plegar) del VEVENT d'un Event d'agenda.jsonld, o null si
   no té data d'inici. */
function veventIcs(acte, slug, ara) {
  const inici = momentIcs(acte.startDate);
  if (!inici) return null;
  const fitxa = acte.subjectOf ?? {};
  const publicat = momentIcs(fitxa.datePublished);
  const editat = momentIcs(fitxa.dateModified);
  const fi = momentIcs(acte.endDate);
  let dtend = null;
  if (fi && fi.dia === inici.dia) {
    if (fi.dia && fi.valor >= inici.valor) dtend = `DTEND;VALUE=DATE:${diaSeguent(fi.valor)}`;
    else if (!fi.dia && fi.valor > inici.valor) dtend = `DTEND:${fi.valor}`;
  }
  const descripcio = [acte.disambiguatingDescription, acte.description].filter(Boolean).join('\n\n');
  return [
    'BEGIN:VEVENT',
    `UID:${uidIcs(acte.identifier, slug)}`,
    `DTSTAMP:${(editat ?? publicat ?? momentIcs(ara)).valor}`,
    inici.dia ? `DTSTART;VALUE=DATE:${inici.valor}` : `DTSTART:${inici.valor}`,
    dtend,
    acte.name ? `SUMMARY:${escapaTextIcs(acte.name)}` : null,
    descripcio ? `DESCRIPTION:${escapaTextIcs(descripcio)}` : null,
    acte.location?.name ? `LOCATION:${escapaTextIcs(acte.location.name)}` : null,
    'CLASS:PUBLIC',
    publicat ? `CREATED:${publicat.valor}` : null,
    editat ? `LAST-MODIFIED:${editat.valor}` : null,
    'END:VEVENT'
  ].filter(Boolean);
}

/* agenda.ics: { text, actes, senseInici, foraDAbast }, amb text null si cap acte no hi cap.
   Gauntlet 2 261101 (G2-07) · senseInici compta només els actes sense startDate. Un acte AMB
   startDate que iCalendar no pot escriure (en UTC cau fora dels anys 0000-9999: el
   9999-12-31T23:30:00-01:00 és el +010000-01-01T00:30:00Z, que momentIcs no admet) té data
   d'inici, a agenda.jsonld, i es compta a part, a foraDAbast: memoria.md no pot dir que no en té. */
function calendariIcs(actes, municipi, ara) {
  const vevents = actes.map((acte) => veventIcs(acte, municipi.slug, ara));
  const amb = vevents.filter(Boolean);
  const senseInici = actes.filter((acte) => !acte.startDate).length;
  const foraDAbast = vevents.length - amb.length - senseInici;
  if (!amb.length) return { text: null, actes: 0, senseInici, foraDAbast };
  const nom = escapaTextIcs(`Agenda ${deNomDelPoble(municipi.nom)}`);
  const linies = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Soc de Poble//exportaMunicipiOpenData ${VERSIO_FORMAT}//CA`,
    'CALSCALE:GREGORIAN',
    /* NAME és de RFC 7986; X-WR-CALNAME, el nom que hi busquen els calendaris que encara no la llegixen. */
    `NAME:${nom}`,
    `X-WR-CALNAME:${nom}`,
    ...amb.flat(),
    'END:VCALENDAR'
  ];
  return { text: `${linies.map(plegaLiniaIcs).join(CRLF)}${CRLF}`, actes: amb.length, senseInici, foraDAbast };
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
  estilInvalida: 'estil amb una forma no vàlida',
  /* T2 · 1.2.0 · La memòria oral. */
  noRevisades: 'fitxes de memòria oral sense revisió humana',
  okfInvalides: 'fitxes que no són OKF v0.2 vàlides',
  actorsAmbIdentificador: "fitxes amb l'identificador d'una persona"
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

/* Gauntlet 261101 (B1-07) · Els actes sense data d'inici SÍ que són al paquet (agenda.jsonld):
   es diuen a la secció de l'agenda, mai a «Què queda fora», que compta el que no s'exporta.
   Gauntlet 2 261101 (G2-07) · Els que tenen una data d'inici que iCalendar no pot escriure
   (foraDAbast), amb una frase pròpia: la tenen, i memoria.md no diu el contrari. Sense cap
   d'estos, les frases de sempre, byte a byte. */
function frasesDelCalendari({ actes, senseInici, foraDAbast = 0 }) {
  const frases = [];
  if (actes) frases.push(`${actes === 1 ? "L'acte amb data d'inici també és" : `Els ${actes} actes amb data d'inici també són`} a \`agenda.ics\` (iCalendar, RFC 5545), per a importar-${actes === 1 ? 'lo' : 'los'} a qualsevol calendari.`);
  if (senseInici && (actes || foraDAbast)) frases.push(`${senseInici === 1 ? "L'acte sense data d'inici només és" : `Els ${senseInici} actes sense data d'inici només són`} a \`agenda.jsonld\`: cap calendari no ${senseInici === 1 ? 'el' : 'els'} pot situar.`);
  else if (senseInici) frases.push(`${senseInici === 1 ? "L'acte no té data d'inici" : `Cap dels ${senseInici} actes no té data d'inici`}: cap calendari no ${senseInici === 1 ? 'el' : 'els'} pot situar, i el paquet no porta cap calendari .ics.`);
  if (foraDAbast) frases.push(`${foraDAbast === 1 ? "L'acte amb una data d'inici que, en UTC, cau fora dels anys 0000 a 9999 només és" : `Els ${foraDAbast} actes amb una data d'inici que, en UTC, cau fora dels anys 0000 a 9999 només són`} a \`agenda.jsonld\`: iCalendar (RFC 5545) no pot escriure eixa data${actes ? '' : ', i el paquet no porta cap calendari .ics'}.`);
  return frases.flatMap((frase) => [frase, '']);
}

function memoriaMd({ municipi, ara, enllacos, seccions, omissions, configuracio, federades = null, pendents, calendari = { actes: 0, senseInici: 0, foraDAbast: 0 } }) {
  const pendent = new Map((pendents ?? []).map(({ coleccio, motiu }) => [coleccio, motiu]));
  const linies = [
    `# Dades obertes ${escapaMarkdown(deNomDelPoble(municipi.nom))}`,
    '',
    `Paquet \`${FORMAT_DADES_OBERTES}\` (versió ${VERSIO_FORMAT}) generat pel Mas (Sóc de Poble) el ${ara}.`,
    'Conté només contingut públic del municipi i de les seues entitats. No conté cap dada de persones: ni perfils, ni publicacions del veïnat, ni xats, ni el Mercat.',
    '',
    `_English:_ open data package of ${escapaMarkdown(municipi.nom)} (schema.org JSON-LD${calendari.actes ? ', iCalendar RFC 5545' : ''}, Frictionless Data Package v2, BagIt with a SHA-256 manifest). It holds public municipal and organisation content only, never personal data.`,
    '',
    '## Contingut',
    '',
    '| Fitxer | Elements |',
    '| --- | --- |',
    /* memoria-oral.jsonld només existix amb alguna fitxa. */
    ...seccions.filter(({ coleccio, elements }) => coleccio !== 'memoriaOral' || elements.length)
      .map(({ fitxer, elements }) => `| \`${fitxer}\` | ${elements.length} |`),
    ...(calendari.actes ? [`| \`agenda.ics\` | ${calendari.actes} |`] : []),
    ...(federades === null ? [] : [`| \`activitystreams.json\` | ${federades} |`]),
    /* V2-02 · Una configuració pendent no s'ha llegit: «sense personalització» diria que el poble no en té. */
    `| \`configuracio.json\` | ${['taxonomia', 'estil'].filter((clau) => configuracio[clau]).join(', ') || (pendent.has('configuracio') ? "no s'exporta" : 'sense personalització')} |`,
    ''
  ];
  for (const { coleccio, titol, elements, data, coincidencies } of seccions) {
    linies.push(`## ${titol} (${elements.length})`, '');
    if (!elements.length && pendent.has(coleccio)) linies.push(`No s'exporta en esta versió: ${escapaMarkdown(pendent.get(coleccio))}.`, '');
    else if (!elements.length) linies.push('Sense elements en esta exportació.', '');
    else linies.push(...elements.map((element, i) => liniaDElement(element, data(element), coincidencies[i])), '');
    if (coleccio === 'agenda') linies.push(...frasesDelCalendari(calendari));
    if (coleccio === 'memoriaOral' && elements.length) {
      linies.push(`${elements.length === 1 ? 'La fitxa també és' : 'Cada fitxa també és'} a \`okf/\` en Open Knowledge Format v0.2, amb un índex (\`okf/index.md\`) i el registre de les revisions (\`okf/log.md\`). Només hi entren les fitxes revisades per una persona, signades per una entitat i sense l'identificador de cap persona.`, '');
    }
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
      "En un allotjament estàtic com socdepoble.org, el compte @ es troba amb host-meta i un JRD estàtic; la consulta WebFinger per paràmetre (`?resource=`) necessita un servidor propi, com el mòdul NixOS.",
      ''
    );
  }
  linies.push('## Què queda fora', '', 'Només recomptes, mai valors.', '');
  const files = Object.entries(omissions).flatMap(([coleccio, motius]) => Object.entries(motius)
    .map(([motiu, n]) => `- ${coleccio}: ${n} ${NOMS_DE_MOTIU[motiu] ?? motiu}`));
  /* V1-02 · Amb fonts pendents, un «Res.» sol diria que no falta res: només parla de les col·leccions exportades. */
  const resFora = pendents?.length ? "- Res entre les col·leccions exportades. El que encara no s'exporta és a «Fonts pendents»." : '- Res.';
  linies.push(...(files.length ? files : [resFora]), '');
  /* Les col·leccions que el paquet no ha llegit, i per què: mai un «sense elements» que semble un poble sense notícies. */
  if (pendents !== undefined) {
    linies.push('## Fonts pendents', '', "El que este paquet encara no exporta, i per què. No vol dir que el poble no en tinga.", '');
    linies.push(...(pendents.length ? pendents.map(({ coleccio, motiu }) => `- ${NOMS_DE_PENDENT[coleccio]}: ${escapaMarkdown(motiu)}.`) : ['- Cap.']), '');
  }
  linies.push(
    '## Verificació',
    '',
    `Des de la carpeta \`dades-obertes-${municipi.slug}\`: \`sha256sum -c manifest-sha256.txt\` (a macOS, \`shasum -a 256 -c manifest-sha256.txt\`).`,
    'La llicència de cada element és a `llicencies.md`.',
    ''
  );
  return linies.join('\n');
}

function llicenciesMd(seccions, federades = null) {
  const files = seccions.flatMap(({ coleccio, etiqueta = coleccio, elements }) => elements.map((element) => {
    /* La de l'element (CreativeWork) o la de la seua fitxa (Event, Organization). */
    const llicencia = llicenciaDe(element.copyrightNotice ?? element.subjectOf?.copyrightNotice);
    return `| ${etiqueta} | \`${encodeURIComponent(element.identifier)}\` | ${llicencia.valor ? escapaMarkdown(llicencia.valor) : '(no declarada)'} | ${llicencia.oberta ? 'sí' : 'no'} |`;
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
    '',
    ...(federades === null ? [] : [`Publicacions federades (\`activitystreams.json\`): ${federades} ${federades === 1 ? 'element' : 'elements'} sense llicència declarada; no s'atorga cap dret de reutilització.`, ''])
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
 * @returns {{ slug, nom, ara, arrel, fitxers: Array<{ nom, text, mediatype, format, titol, recurs? }>, omissions, comptes,
 *   calendari: { actes: number, senseInici: number, foraDAbast: number } }}
 *   `recurs`: el name del recurs al Data Package quan no és el nom sense extensió (agenda.ics → agenda-ics).
 *   `calendari`: els actes d'agenda.jsonld que són a agenda.ics, els que no hi són perquè no tenen data d'inici
 *   i els que no hi són perquè la seua data d'inici, en UTC, cau fora dels anys 0000-9999 (G2-07).
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
  /* Gauntlet 261101 (B1-05) · Un `ara` vàlid amb desfasament pot passar de l'any 9999 en UTC
     (9999-12-31T23:30:00-01:00 és +010000-01-01T00:30:00Z): ni el DTSTAMP de l'.ics ni la
     Bagging-Date de BagIt no tenen forma per a eixe any, i s'atura amb un missatge clar. */
  if (!/^\d{4}-/.test(ara)) throw new TypeError("L'instant de l'exportació (`ara`) ha de caure dins de l'any 9999 en UTC.");
  const municipi = municipiDe(entrada.municipi);
  const base = entrada.origen === undefined || entrada.origen === null ? null : normalitzaOrigen(entrada.origen);
  const actors = entrada.actorsPublicats ?? [];
  if (!Array.isArray(actors) || actors.some((slug) => typeof slug !== 'string')) {
    throw new TypeError('«actorsPublicats» ha de ser la llista dels slugs dels actors publicats.');
  }
  const enllacos = base && actors.includes(municipi.slug) ? urlsDeMunicipi(municipi.slug, { origen: base }) : null;
  const pendents = entrada.pendents;
  if (pendents !== undefined && (!Array.isArray(pendents) || pendents.some((p) => !esObjecte(p) || !Object.hasOwn(NOMS_DE_PENDENT, p.coleccio)
      || !textLinia(p.motiu)) || new Set(pendents.map((p) => p.coleccio)).size !== pendents.length)) {
    throw new TypeError('«pendents» ha de ser [{ coleccio, motiu }], una vegada per col·lecció.');
  }

  /* T2 · 1.2.0 · La memòria oral entra al paquet (memoria.md, comptes, omissions) si l'entrada la porta o si és pendent;
     els seus fitxers, només amb almenys una fitxa. Sense, el paquet és el de la 1.1.0 llevat de la versió. */
  const ambMemoriaOral = entrada.memoriaOral !== undefined || (pendents ?? []).some((p) => p.coleccio === 'memoriaOral');
  const omissions = { noticies: nouRecompte(), agenda: nouRecompte(), directori: nouRecompte(), memoria: nouRecompte(),
    ...(ambMemoriaOral ? { memoriaOral: nouRecompte() } : {}), configuracio: nouRecompte() };
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
  const fitxesOrals = [];
  if (ambMemoriaOral) {
    const camins = new Set();
    for (const triat of triaElements(entrada.memoriaOral, municipi, 'memoriaOral', omissions.memoriaOral, { pobleDe: pobleDeLaFitxa })) {
      const publicable = fitxaPublicable(triat.item);
      if (publicable.motiu) { suma(omissions.memoriaOral, publicable.motiu); continue; }
      if (camins.has(publicable.okf.cami)) throw new TypeError(`Camí OKF repetit a «memoriaOral»: ${publicable.okf.cami.slice(0, 120)}`);
      camins.add(publicable.okf.cami);
      fitxesOrals.push({ ...triat, okf: publicable.okf });
    }
  }
  const memoriaOral = fitxesOrals.map((fitxa) => ({ element: fitxaOralSchema(fitxa, { signants, municipi }), coincidencia: fitxa.coincidencia }))
    .sort((a, b) => compara(a.element.identifier, b.element.identifier));
  const configuracio = configuracioDe(entrada.personalitzacio, omissions.configuracio);

  const seccions = [
    { coleccio: 'noticies', fitxer: 'noticies.jsonld', titol: 'Notícies i avisos', llista: noticies, data: (e) => e.datePublished },
    { coleccio: 'agenda', fitxer: 'agenda.jsonld', titol: 'Agenda', llista: agenda, data: (e) => e.startDate },
    { coleccio: 'directori', fitxer: 'directori.jsonld', titol: "Directori d'entitats i comerços", llista: directori, data: () => null },
    { coleccio: 'memoria', fitxer: 'memoria-cultural.jsonld', titol: 'Memòria cultural', llista: memoria, data: () => null },
    ...(ambMemoriaOral ? [{ coleccio: 'memoriaOral', etiqueta: 'memoria-oral', fitxer: 'memoria-oral.jsonld', titol: 'Memòria oral (fitxes OKF)', llista: memoriaOral, data: () => null }] : [])
  ].map((s) => ({ ...s, elements: s.llista.map(({ element }) => element), coincidencies: s.llista.map(({ coincidencia }) => coincidencia) }));
  const grafs = Object.fromEntries(seccions.map(({ coleccio, elements }) => [coleccio, { '@context': 'https://schema.org', '@graph': elements }]));
  /* El calendari: els mateixos actes d'agenda.jsonld, en el mateix ordre. Els que no hi caben
     (sense data d'inici, o amb una que iCalendar no pot escriure) no són omissions: són a
     agenda.jsonld (B1-07, G2-07). */
  const calendari = calendariIcs(agenda.map(({ element }) => element), municipi, ara);
  /* Els motius en ordre fix: l'ordre de l'entrada no ha de canviar cap byte de memoria.md. */
  const netes = Object.fromEntries(Object.entries(omissions).map(([clau, motius]) => [clau,
    Object.fromEntries(Object.keys(motius).sort(compara).map((motiu) => [motiu, motius[motiu]]))]));

  const outbox = entrada.activityStreams;
  if (outbox !== undefined) {
    const urls = base && urlsDeMunicipi(municipi.slug, { origen: base });
    if (!urls || outbox?.id !== urls.outbox || outbox.type !== 'OrderedCollection' || !Array.isArray(outbox.orderedItems)) throw new TypeError('Outbox municipal invàlid.');
  }
  const federades = outbox === undefined ? null : outbox.orderedItems.length;
  const fitxers = [
    ...(calendari.text === null ? [] : [{
      /* `recurs`: el name del recurs al Data Package, que ha de ser únic (agenda ja és el d'agenda.jsonld). */
      nom: 'agenda.ics', recurs: 'agenda-ics', text: calendari.text, mediatype: 'text/calendar', format: 'ics', titol: 'Agenda (iCalendar, RFC 5545)'
    }]),
    { nom: 'agenda.jsonld', text: jsonCanonic(grafs.agenda), mediatype: 'application/ld+json', format: 'jsonld', titol: 'Agenda (schema.org Event)' },
    {
      nom: 'configuracio.json',
      text: jsonCanonic({ format: FORMAT_DADES_OBERTES, municipi: { slug: municipi.slug, nom: municipi.nom }, personalitzacio: configuracio }),
      mediatype: 'application/json', format: 'json', titol: 'Configuració del poble (taxonomia i estil)'
    },
    { nom: 'directori.jsonld', text: jsonCanonic(grafs.directori), mediatype: 'application/ld+json', format: 'jsonld', titol: "Directori d'entitats i comerços (schema.org)" },
    { nom: 'llicencies.md', text: llicenciesMd(seccions, federades), mediatype: 'text/markdown', format: 'md', titol: 'Llicència de cada element' },
    { nom: 'memoria-cultural.jsonld', text: jsonCanonic(grafs.memoria), mediatype: 'application/ld+json', format: 'jsonld', titol: 'Memòria cultural (schema.org CreativeWork)' },
    ...(memoriaOral.length ? [{ nom: 'memoria-oral.jsonld', text: jsonCanonic(grafs.memoriaOral), mediatype: 'application/ld+json', format: 'jsonld', titol: 'Memòria oral (schema.org CreativeWork; el text de cada fitxa és a okf/)' }] : []),
    {
      nom: 'memoria.md',
      text: memoriaMd({ municipi, ara, enllacos, seccions, omissions: netes, configuracio, federades, pendents, calendari }),
      mediatype: 'text/markdown', format: 'md', titol: 'Memòria del paquet (Markdown)'
    },
    { nom: 'municipi.jsonld', text: jsonCanonic(municipiSchema(municipi, enllacos)), mediatype: 'application/ld+json', format: 'jsonld', titol: 'El municipi (schema.org AdministrativeArea)' },
    { nom: 'noticies.jsonld', text: jsonCanonic(grafs.noticies), mediatype: 'application/ld+json', format: 'jsonld', titol: 'Notícies i avisos (schema.org NewsArticle)' },
    ...fitxersOkf(fitxesOrals, municipi)
  ];
  if (outbox !== undefined) {
    fitxers.push({ nom: 'activitystreams.json', text: jsonCanonic(outbox), mediatype: 'application/activity+json', format: 'json', titol: 'Publicacions municipals (ActivityStreams 2.0)' });
  }
  return {
    slug: municipi.slug,
    nom: municipi.nom,
    ara,
    origen: base,
    arrel: `dades-obertes-${municipi.slug}`,
    fitxers,
    omissions: netes,
    comptes: Object.fromEntries(seccions.map(({ coleccio, elements }) => [coleccio, elements.length])),
    calendari: { actes: calendari.actes, senseInici: calendari.senseInici, foraDAbast: calendari.foraDAbast },
    /* T2 · Les col·leccions que el paquet no ha llegit (les de «Fonts pendents»). */
    pendents: (pendents ?? []).map((p) => p.coleccio)
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
export async function exportaMunicipiOpenData(entrada, opcions = {}) {
  const { subtle = globalThis.crypto?.subtle } = opcions;
  if (typeof entrada === 'string') {
    const { entradaOpenDataDelPoble } = await import('./entradaOpenDataDelPoble.js');
    entrada = await entradaOpenDataDelPoble(entrada, opcions);
  }
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
    title: `Dades obertes ${deNomDelPoble(preparat.nom)}`,
    /* Gauntlet D-06 · Amb memòria oral, «sense dades de persones» seria fals: un relat pot nomenar veïns. */
    description: 'Contingut públic del municipi i de les seues entitats exportat pel Mas (Sóc de Poble). '
      + (preparat.comptes.memoriaOral > 0
        ? 'Sense dades de cap compte de persona. Les fitxes de memòria oral són relats revisats per una persona i signats per una entitat, i poden nomenar persones del poble. '
        : 'Sense dades de persones. ')
      + "La llicència de cada element és a llicencies.md: el conjunt no n'atorga cap de nova.",
    created: preparat.ara,
    licenses: LLICENCIES_DATAPACKAGE.map(llicencia => ({ ...llicencia })),
    sources: [{ title: 'Sóc de Poble (el Mas)', path: preparat.origen }],
    keywords: ['dades obertes', 'municipi', preparat.slug],
    resources: dades.map((fitxer) => ({
      name: fitxer.recurs ?? fitxer.nom.replace(/\.[a-z]+$/, ''),
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
      /* schemaVersion: la versió de l'esquema del paquet (T3.1); versio, el mateix valor, per als lectors de la 1.0.0. */
      schemaVersion: VERSIO_FORMAT,
      versio: VERSIO_FORMAT,
      municipi: preparat.slug,
      comptes: preparat.comptes,
      /* B1-07 · Els actes d'agenda.jsonld que són (actes) i que no són a agenda.ics, perquè no
         tenen data d'inici (senseInici) o perquè iCalendar no la pot escriure (foraDAbast, G2-07):
         comptes.agenda = actes + senseInici + foraDAbast. Sense cap acte a l'agenda, res. */
      calendari: preparat.comptes.agenda ? preparat.calendari : null,
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
      `External-Description: Dades obertes públiques ${deNomDelPoble(preparat.nom)} (${FORMAT_DADES_OBERTES})`,
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
    comptes: preparat.comptes,
    pendents: preparat.pendents
  };
}

/* ── Verificació (falla tancat) ─────────────────────────────────────────── */

/* T2 · 1.2.0 · Fins a 255 caràcters: els camins i els noms dels recursos d'okf/ passen dels 128. */
const LINIA_MANIFEST = /^([0-9a-f]{64}) {2}([A-Za-z0-9/._-]{1,255})$/;
/* El name d'un recurs (Data Package v2: minúscules, xifres, «.», «-» i «_»). */
const NOM_DE_RECURS = /^[a-z0-9._-]{1,255}$/;
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
  validaDescriptorMunicipal(datapackage);
  return { slug: arrel.slice('dades-obertes-'.length), arrel, fitxers: fitxers.size, recursos: datapackage.resources.length };
}

/* Validem el perfil tancat que produïx este exportador, no qualsevol extensió
 * arbitrària del general DataPackagev2. No es carrega cap esquema ni llicència
 * per xarxa. SHA/BagIt prova integritat; este pas comprova les declaracions.
 * https://datapackage.org/standard/data-package/ */
function validaDescriptorMunicipal(descriptor) {
  const falla = motiu => { throw new TypeError(`Data Package municipal invàlid: ${motiu}.`); };
  if (descriptor.$schema !== ESQUEMA_DATAPACKAGE) falla('perfil DataPackagev2 no admés');
  const llicencia = Array.isArray(descriptor.licenses) && descriptor.licenses.length === 1 ? descriptor.licenses[0] : null;
  if (!esObjecte(llicencia) || Object.keys(llicencia).sort().join(',') !== 'path,title'
    || llicencia.path !== LLICENCIES_DATAPACKAGE[0].path || llicencia.title !== LLICENCIES_DATAPACKAGE[0].title) falla('llicències diferents de la política per element');
  if (!descriptor.resources.length) falla('cap recurs');
  for (const clau of ['name', 'title', 'description', 'created']) {
    if (typeof descriptor[clau] !== 'string' || !descriptor[clau].trim() || descriptor[clau].length > 4096) falla(`camp ${clau}`);
  }
  if (dataIso(descriptor.created) !== descriptor.created) falla('data de creació');
  const camps = new Set(['name', 'path', 'title', 'format', 'mediatype', 'encoding', 'bytes', 'hash']);
  const tipus = { json: 'application/json', jsonld: 'application/ld+json', md: 'text/markdown', ics: 'text/calendar' };
  for (const recurs of descriptor.resources) {
    if (!esObjecte(recurs) || Object.keys(recurs).some(clau => !camps.has(clau)) || Object.keys(recurs).length !== camps.size) falla('camps del recurs');
    if (typeof recurs.title !== 'string' || !recurs.title.trim() || recurs.title.length > 4096) falla('títol del recurs');
    const formatEsperat = recurs.path.slice(recurs.path.lastIndexOf('.') + 1);
    const mediatype = recurs.path === 'activitystreams.json' ? 'application/activity+json' : tipus[formatEsperat];
    if (!Object.hasOwn(tipus, formatEsperat) || recurs.format !== formatEsperat || mediatype !== recurs.mediatype
      || recurs.encoding !== 'utf-8') falla('tipus o codificació del recurs');
    if (!Number.isSafeInteger(recurs.bytes) || recurs.bytes < 0 || recurs.bytes > MAXIM_PAQUET || typeof recurs.hash !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(recurs.hash)) falla('mida o hash del recurs');
  }
}

/* ── Recollida des del port neutral ─────────────────────────────────────── */

/* V1-02 · Els motius ixen tal qual a memoria.md, per a qualsevol veí: en
   valencià planer, sense noms de codi, sense decisions internes i sense cap
   dos punts (la línia ja en porta un darrere del nom de la font). */
const SENSE_LECTURA_PUBLICA = "encara no hi ha cap lectura pública garantida d'estes dades";
const SENSE_MODUL_DE_MEMORIA = 'el Mas no té cap mòdul de memòria cultural';
/* Sense la lectura pública (capacitat 'dadesObertes'). */
const MOTIUS_SENSE_LECTURA = Object.freeze({
  noticies: SENSE_LECTURA_PUBLICA, agenda: SENSE_LECTURA_PUBLICA, memoria: SENSE_MODUL_DE_MEMORIA, memoriaOral: SENSE_LECTURA_PUBLICA
});
/* Amb la lectura pública, quan el servidor diu que no té eixa font (null). */
const MOTIUS_SENSE_FONT = Object.freeze({
  noticies: 'este servidor de dades no en té cap font pública',
  agenda: 'este servidor de dades no en té cap font pública',
  memoria: SENSE_MODUL_DE_MEMORIA,
  memoriaOral: 'el servidor de dades encara no desa cap fitxa de memòria oral revisada'
});
const MOTIU_DE_LA_CONFIGURACIO = "la personalització és de tot el node, no d'un poble, i la fitxa del poble no la inclou";

/**
 * El que el port (src/data/backendPort.js) ja servix com a PÚBLIC per a un
 * municipi, amb dos mètodes públics adequats (decisió 5):
 *   · el directori d'entitats: listPublicOrganizations (capacitat
 *     'directoriEntitats'; visibility 'public' i mai cap correu, contracte.js)
 *     filtrat pel NOM del poble al servidor i, ací, una altra volta (town_name
 *     igual, visibility pública si ve);
 *   · notícies, agenda, memòria cultural i memòria oral: llegixDadesObertes
 *     (T2 · capacitat 'dadesObertes', sempre anònima: el paquet d'una
 *     administradora és el d'un visitant). Una sola crida. Cada llista va a
 *     l'entrada de l'exportador, que torna a filtrar amb la seua llista blanca
 *     (públic, signat per una entitat, del poble) i falla tancat; un null
 *     (el servidor no té eixa font) va a «pendents» amb el seu motiu.
 * Mai loadMur: barreja el contingut de l'administració amb les publicacions
 * del veïnat (section_submissions, només per a membres) i envia el JWT de la
 * sessió (runtime.js). Sense la capacitat, el que no es pot llegir va a
 * «pendents», com abans. La configuració, sempre pendent: loadCoreContent
 * porta `personalitzacio` del tenant, no d'un poble.
 * Cap llista es pagina ni es talla: amb LIMIT_DIRECTORI_ENTITATS files, o amb
 * més de LIMIT_DADES_OBERTES elements, s'atura (RangeError).
 * @param {{ teCapacitat: Function, listPublicOrganizations?: Function, llegixDadesObertes?: Function }} port
 * @param {{ slug?: string, nom: string }} municipi
 * @returns {Promise<{ municipi, entitats: object[]|null, noticies?, agenda?, memoria?, memoriaOral?,
 *   pendents: Array<{ coleccio, motiu }> }>}
 */
export async function recullDadesPubliquesDelMunicipi(port, municipi, { config = {}, signal } = {}) {
  if (!port || typeof port.teCapacitat !== 'function') throw new TypeError('Cal el port de dades (backendPort).');
  const { slug, nom } = municipiDe({ ...(municipi?.slug === undefined ? {} : { slug: municipi.slug }), nom: municipi?.nom });
  /* El typeof manté els ports de prova d'abans (teCapacitat: () => true i sense el mètode). */
  const ambLectura = port.teCapacitat('dadesObertes') && typeof port.llegixDadesObertes === 'function';
  let obertes = null;
  if (ambLectura) {
    obertes = await port.llegixDadesObertes({ poble: { slug, nom }, signal }, config);
    if (fallesDeDadesObertes(obertes).length) throw new TypeError('llegixDadesObertes no ha tornat { noticies, agenda, memoria, memoriaOral }.');
    const massaLlarga = COLECCIONS_DADES_OBERTES.find((coleccio) => (obertes[coleccio]?.length ?? 0) > LIMIT_DADES_OBERTES);
    if (massaLlarga) {
      throw new RangeError(`«${massaLlarga}» ${deNomDelPoble(nom)} passa de ${LIMIT_DADES_OBERTES} elements: no se sap si en falten i no es talla en silenci.`);
    }
  }
  const llegides = {};
  const pendents = [];
  for (const coleccio of COLECCIONS_DADES_OBERTES) {
    if (Array.isArray(obertes?.[coleccio])) llegides[coleccio] = obertes[coleccio];
    else pendents.push({ coleccio, motiu: (ambLectura ? MOTIUS_SENSE_FONT : MOTIUS_SENSE_LECTURA)[coleccio] });
  }
  pendents.push({ coleccio: 'configuracio', motiu: MOTIU_DE_LA_CONFIGURACIO });
  if (!port.teCapacitat('directoriEntitats')) {
    return { municipi: { slug, nom }, entitats: null, ...llegides,
      pendents: [{ coleccio: 'directori', motiu: "este servidor de dades no oferix el directori d'entitats" }, ...pendents] };
  }
  const files = await port.listPublicOrganizations({ poble: nom, limit: LIMIT_DIRECTORI_ENTITATS, signal }, config);
  if (!Array.isArray(files)) throw new TypeError('listPublicOrganizations no ha tornat cap llista.');
  if (files.length >= LIMIT_DIRECTORI_ENTITATS) {
    throw new RangeError(`El directori ${deNomDelPoble(nom)} arriba al sostre de ${LIMIT_DIRECTORI_ENTITATS} entitats: no se sap si en falten i no es talla en silenci.`);
  }
  const entitats = files.filter((fila) => esObjecte(fila) && textLinia(fila.town_name) === nom
    && (!presentDe(fila.visibility) || fila.visibility === 'public'));
  return { municipi: { slug, nom }, entitats, ...llegides, pendents };
}
