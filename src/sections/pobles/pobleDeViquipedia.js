/**
 * pobleDeViquipedia.js · Onada 5 (F5, fase 2) · L'algoritme de pobles nous:
 * a partir del nom que escriu un habitant, la proposta de fitxa de /pobles amb
 * el text i les tres fotos que trau de la Viquipèdia, Wikidata i Commons.
 *
 *   1. Cerca el municipi a Wikidata (cap títol pelat: «Sella» és una
 *      desambiguació) i el tria per l'etiqueta i, si es dona, la província.
 *   2. Llig l'article de la Viquipèdia en català que enllaça l'element.
 *   3. Llig les etiquetes de la comarca i la província (P131).
 *   4. Demana a Commons les dades i la llicència de les fotos candidates.
 *   5. Tria la panoràmica, l'avatar i la de reserva, i talla l'entradilla.
 *
 * L'H1 («Gent de…»), l'H2 (el nom), l'entradilla i el botó del xat no es
 * guarden a banda: els pinta la maquinària de sempre a partir de `author`,
 * `title`, `content` i `id` (detailSectionMeta.jsx, elementDeSeccio.js,
 * objecteConnectable.js). `chat` es torna només per a la previsualització.
 *
 * No llança mai: sempre torna un DTO tancat i congelat amb un `estat`:
 *   · 'complet'       municipi verificat, entradilla i les tres fotos distintes;
 *   · 'parcial'       municipi verificat, però hi falta text, una foto (o
 *                     l'avatar és la mateixa panoràmica) o un pas;
 *   · 'sense-article' cap municipi verificat amb eixe nom (o més d'un);
 *   · 'no-disponible' la xarxa, Wikimedia o una cancel·lació ho han tallat.
 * En els dos últims no hi ha cap text inventat: només el nom, l'id, l'autor
 * derivat i la província que haja donat qui crida.
 *
 * Fase 2: res d'ací escriu enlloc. Proposar el poble al backend (capacitat
 * del port, RPC, moderació) és la fase 3: vegeu
 * src/data/adaptadors/viquipedia/README.md.
 */
import { MUNICIPI_D_ESPANYA, llig as lligViquipedia, partixTitols } from '../../data/adaptadors/viquipedia/client.js';
import { MAXIM_LEMA } from '../../data/limitsText.js';
import { netejaText } from '../../utils/sanitize.js';
import { rutaXatDePagina } from '../../config/navigation.js';
import { nomDeLaGent, slugDelPoble } from './nomsDelPoble.js';
import { objecteDelPobleXat } from './xatDelPoble.js';

/* El text de la Viquipèdia és CC BY-SA 4.0 i cada foto porta la seua
   llicència: res d'això admet la NC de COPYRIGHT_SDP (editorial.js). */
export const DRETS_TEXT = 'Text: Viquipèdia (CC BY-SA 4.0)';
export const DRETS_IMATGES = 'Imatges: Wikimedia Commons (vegeu els crèdits)';

const MAXIM_NOM = 120;
const MAXIM_ENTITATS = 5;
const MAXIM_FITXERS = 8;
const AMPLADA_MINIMA = 1000;
const APAISADA = Object.freeze([1.3, 3]);
const QUADRADA = Object.freeze([0.8, 1.25]);

/* ── Text ─────────────────────────────────────────────────────────────── */

const punts = (text) => Array.from(text);
const espais = (text) => text.replace(/\s+/g, ' ').trim();

/** El nom tal com l'ha escrit l'habitant, net i fitat. '' si no n'hi ha. */
export function netejaNom(nom) {
  return punts(espais(netejaText(nom, 4 * MAXIM_NOM))).slice(0, MAXIM_NOM).join('').trim();
}

const majuscula = (text) => (text ? text.charAt(0).toLocaleUpperCase('ca') + text.slice(1) : text);

/**
 * L'entradilla: el primer paragraf de l'extracte, en text pla i com a molt
 * de `maxim` caràcters de veres (punts de codi, com MAXIM_LEMA). Si no hi
 * cap, es talla a l'última fi de frase dins del límit; si no n'hi ha cap, a
 * l'última paraula sencera, amb «…». Sense Intl.Segmenter (baseline 2022).
 */
export function entradillaDe(extracte, maxim = MAXIM_LEMA) {
  const paragraf = netejaText(extracte, 20000).split(/\n+/).map(espais).find(Boolean) || '';
  const caracters = punts(paragraf);
  if (caracters.length <= maxim) return paragraf;
  let fiDeFrase = -1;
  for (let i = 0; i < maxim; i += 1) {
    if ('.!?…'.includes(caracters[i]) && /\s/.test(caracters[i + 1] || ' ')) fiDeFrase = i;
  }
  if (fiDeFrase >= 0) return caracters.slice(0, fiDeFrase + 1).join('');
  let espai = -1;
  for (let i = 0; i < maxim; i += 1) if (/\s/.test(caracters[i])) espai = i;
  const tros = espai > 0 ? caracters.slice(0, espai) : caracters.slice(0, maxim - 1);
  return `${tros.join('').replace(/[\s,;:·–—-]+$/u, '')}…`;
}

/* ── On és el poble ───────────────────────────────────────────────────── */

const PROVINCIES_INE = Object.freeze({ '03': 'Alacant', 12: 'Castelló', 46: 'València' });
const ALIES_PROVINCIA = Object.freeze({
  '03': Object.freeze(['03', 'alacant', 'alicante']),
  12: Object.freeze(['12', 'castello', 'castellon', 'castello de la plana']),
  46: Object.freeze(['46', 'valencia'])
});

/** La província valenciana pel prefix del codi INE del municipi (P772), o null. */
export function provinciaDeIne(codi) {
  return /^\d{5}$/.test(String(codi ?? '')) ? (PROVINCIES_INE[String(codi).slice(0, 2)] || null) : null;
}

/* Minúscules, sense diacrítics ni l'article del davant: «la Torre de les
   Maçanes», «La Torre de les Maçanes» i «Torre de les Macanes» són el mateix. */
const normalitza = (text) => espais(String(text ?? '')
  .normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .replace(/’/g, "'").toLocaleLowerCase('ca'));
const senseArticle = (text) => normalitza(text).replace(/^(?:els|el|les|la)\s+|^l'\s*/, '');

const casaProvincia = (ine, provincia) => {
  const alies = ALIES_PROVINCIA[String(ine).slice(0, 2)];
  return !alies || alies.includes(provincia);
};

/**
 * El municipi que correspon al nom: un element amb P31 = municipi d'Espanya i
 * la mateixa etiqueta en català; si es dona la província, el seu codi INE hi
 * ha de casar. null si no n'hi ha cap o n'hi ha més d'un: no s'endevina.
 */
export function triaMunicipi(entitats, nom, { provincia } = {}) {
  const objectiu = senseArticle(nom);
  const provinciaNeta = normalitza(provincia);
  const candidats = (Array.isArray(entitats) ? entitats : []).filter((entitat) => entitat?.esMunicipi
    && entitat.etiqueta && senseArticle(entitat.etiqueta) === objectiu
    && (!provinciaNeta || !entitat.ine || casaProvincia(entitat.ine, provinciaNeta)));
  return candidats.length === 1 ? candidats[0] : null;
}

const ES_PROVINCIA = /^prov[ií]ncia\s+(?:de\s+|d')/i;

/** La província i la comarca a partir de les etiquetes de P131 ({ qid, etiqueta }). */
export function divisionsDe(etiquetes) {
  const noms = (Array.isArray(etiquetes) ? etiquetes : [])
    .map((e) => (typeof e?.etiqueta === 'string' ? espais(e.etiqueta.replace(/’/g, "'")) : ''))
    .filter(Boolean);
  const provincia = noms.find((nom) => ES_PROVINCIA.test(nom));
  const comarca = noms.find((nom) => !/^prov[ií]ncia\b/i.test(nom));
  return {
    provincia: provincia ? majuscula(provincia.replace(ES_PROVINCIA, '')) : null,
    comarca: comarca ? majuscula(comarca) : null
  };
}

/* ── Imatges ──────────────────────────────────────────────────────────── */

/* Ni escuts, ni banderes, ni mapes, ni logotips, ni icones: l'avatar de
   «Gent de…» no ha de semblar institucional, i un mapa no és una foto. */
const NOM_EXCLOS = /escut|escudo|coat[ _-]?of[ _-]?arms|\barms\b|bandera|\bflag|\bmapa|\bmap\b|locator|locali[tz]?zaci|situaci|\blogo|\bicon|pl[àa]nol|\bplano\b|emblem|disambig|confusion/i;
const EXTENSIO_RASTER = /\.(?:jpe?g|png|webp)$/i;
const MIME_RASTER = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);

const clauDeFitxer = (nom) => {
  const net = String(nom ?? '').replace(/_/g, ' ').trim();
  return net.charAt(0).toUpperCase() + net.slice(1);
};
const mateixFitxer = (a, b) => Boolean(a && b) && clauDeFitxer(a) === clauDeFitxer(b);

/**
 * Els noms de fitxer que val la pena preguntar a Commons, sense repetir i en
 * ordre de preferència: la imatge de Wikidata (P18), la de la pàgina i les de
 * l'article. Mai l'escut (P94) ni el que pel nom o l'extensió no és una foto.
 */
export function candidatsDeFitxers({ p18 = null, p94 = null, imatgePagina = null, fitxers = [] } = {}) {
  const vistos = new Set();
  return [p18, imatgePagina, ...(Array.isArray(fitxers) ? fitxers : [])]
    .filter((nom) => typeof nom === 'string' && EXTENSIO_RASTER.test(nom) && !NOM_EXCLOS.test(nom) && !mateixFitxer(nom, p94))
    .map(clauDeFitxer)
    .filter((nom) => !vistos.has(nom) && vistos.add(nom))
    .slice(0, MAXIM_FITXERS);
}

/** Llicència lliure i reutilitzable: CC0, domini públic, CC BY o CC BY-SA. Mai NC ni ND. */
export function esLlicenciaLliure(llicencia) {
  const nom = String(llicencia ?? '').trim();
  if (!nom || /(?:^|[\s-])(?:nc|nd)(?:[\s-]|$)/i.test(nom)) return false;
  return /^(?:cc0|cc[ -]by(?:-sa)?(?:[ -]|$)|public domain|pd(?:[ -]|$))/i.test(nom);
}

/** Una foto que es pot posar: ràster, prou ampla, lliure, sense restriccions i no exclosa pel nom. */
export function esFotoValida(fitxer) {
  return Boolean(fitxer?.src) && MIME_RASTER.includes(fitxer.mime)
    && fitxer.amplada >= AMPLADA_MINIMA && fitxer.alcada > 0
    && !NOM_EXCLOS.test(fitxer.fitxer || '') && esLlicenciaLliure(fitxer.llicencia)
    && !String(fitxer.restriccions ?? '').trim();
}

const proporcio = (f) => f.amplada / f.alcada;
const dins = (valor, [minim, maxim]) => valor >= minim && valor <= maxim;
const area = (f) => f.amplada * f.alcada;
const diferent = (f, g) => !g || (f.fitxer !== g.fitxer && (!f.sha1 || f.sha1 !== g.sha1));

const imatge = (f) => (f ? Object.freeze({
  src: f.src, fitxer: f.fitxer, amplada: f.amplada, alcada: f.alcada,
  autor: f.autor ?? null, llicencia: f.llicencia ?? null, llicenciaUrl: f.llicenciaUrl ?? null, fontUrl: f.fontUrl ?? null
}) : null);

/**
 * Les tres fotos del poble entre els fitxers de Commons (DTO de recursos.js):
 *   · hero, la panoràmica: apaïsada (1,3–3), primer la de Wikidata, després
 *     la de la pàgina i, a igualtat, la de més resolució;
 *   · avatar: la foto més quadrada (0,8–1,25) que no siga la panoràmica; si
 *     no n'hi ha, la mateixa panoràmica. Mai l'escut;
 *   · reserva: una altra apaïsada, amb un fitxer i un sha1 diferents; o null.
 * La clau és `hero` (el nom del pla de l'Onada 5 i el `heroImage` de la
 * Pàgina): el nom de la variant 16:9 de Pedra Seca és només del Lector
 * (qualitat.panoramica.test.js).
 */
export function triaImatges(fitxers, { p18 = null, imatgePagina = null } = {}) {
  const valides = (Array.isArray(fitxers) ? fitxers : []).filter(esFotoValida);
  const preferencia = (f) => (mateixFitxer(f.fitxer, p18) ? 2 : 0) + (mateixFitxer(f.fitxer, imatgePagina) ? 1 : 0);
  const apaisades = valides.filter((f) => dins(proporcio(f), APAISADA))
    .sort((a, b) => preferencia(b) - preferencia(a) || area(b) - area(a));
  const hero = apaisades[0] || null;
  const [quadrada] = valides.filter((f) => dins(proporcio(f), QUADRADA) && diferent(f, hero))
    .sort((a, b) => Math.abs(Math.log(proporcio(a))) - Math.abs(Math.log(proporcio(b))) || area(b) - area(a));
  const reserva = apaisades.find((f) => f !== hero && diferent(f, hero)) || null;
  return Object.freeze({ hero: imatge(hero), avatar: imatge(quadrada || hero), reserva: imatge(reserva) });
}

/* Les tres fotos que demana l'ordre del Mestre (Onada 5), distintes: un
   avatar que repetix la panoràmica o una reserva que falta no en compten.
   L'avatar quadrat i la reserva apaïsada no poden ser el mateix fitxer. */
const teTresFotos = ({ hero, avatar, reserva }) => Boolean(hero && avatar && reserva) && avatar.fitxer !== hero.fitxer;

/* ── El DTO ───────────────────────────────────────────────────────────── */

const SENSE_IMATGES = Object.freeze({ hero: null, avatar: null, reserva: null });
const arrodonix = (valor) => (typeof valor === 'number' && Number.isFinite(valor) ? Math.round(valor * 1e4) / 1e4 : null);

function dtoDelPoble({
  estat, title, provincia = null, comarca = null, content = '', population = null, lat = null, lng = null,
  wikidataId = null, wikipediaTitle = null, imatges = SENSE_IMATGES
}) {
  const id = slugDelPoble(title);
  const drets = [content ? DRETS_TEXT : null, Object.values(imatges).some(Boolean) ? DRETS_IMATGES : null].filter(Boolean);
  return Object.freeze({
    estat,
    id,
    title,
    author: nomDeLaGent(title),
    content,
    provincia,
    comarca,
    population,
    lat: arrodonix(lat),
    lng: arrodonix(lng),
    wikidata_id: wikidataId,
    wikipedia_title: wikipediaTitle,
    copyright: drets.length ? drets.join(' · ') : null,
    imatges: Object.freeze({ ...SENSE_IMATGES, ...imatges }),
    /* El mateix camí que el botó del xat de la Pàgina del poble: es
       genera, no es guarda. Onada 6 (pla 261009_0245, ítem 4) · Amb el nom
       de la gent (objecteDelPobleXat), com el fil que obrirà. */
    chat: id ? rutaXatDePagina(objecteDelPobleXat({ id, title, author: nomDeLaGent(title) })) : null
  });
}

/* El lector torna DTO de recursos.js. Qualsevol altra cosa és una fallada,
   no un «no hi ha res». */
const llista = (valor) => {
  if (!Array.isArray(valor)) throw new TypeError('Resposta inesperada del lector');
  return valor;
};
const pagina = (valor) => {
  if (!valor || typeof valor.titol !== 'string' || !Array.isArray(valor.fitxers)) throw new TypeError('Resposta inesperada del lector');
  return valor;
};

/* Un pas que pot fallar sense tombar la proposta (la comarca, les fotos).
   Una cancel·lació sí que la tomba. */
async function opcional(fer, signal) {
  try {
    return { ok: true, valor: await fer() };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { ok: false, valor: null };
  }
}

async function resolMunicipi(nom, provincia, llig, signal) {
  const qids = llista(await llig('cercaMunicipi', { srsearch: `${nom} haswbstatement:P31=${MUNICIPI_D_ESPANYA}` }, { signal }));
  if (qids.length) {
    const entitats = llista(await llig('entitats', { ids: qids.slice(0, MAXIM_ENTITATS).join('|') }, { signal }));
    const entitat = triaMunicipi(entitats, nom, { provincia });
    if (entitat) return { entitat, article: null };
  }
  /* L'índex de cerca de Wikidata pot anar tard. El títol pelat només val si
     l'article existix, no és una desambiguació i el seu element és un
     municipi amb el mateix nom. */
  const article = pagina(await llig('article', { titles: nom }, { signal }));
  if (article.falta || article.desambiguacio || !article.qid || qids.includes(article.qid)) return null;
  const entitats = llista(await llig('entitats', { ids: article.qid }, { signal }));
  const entitat = triaMunicipi(entitats, nom, { provincia });
  if (!entitat) return null;
  return { entitat, article: entitat.titolCawiki === article.titol ? article : null };
}

async function completa({ entitat, article: articleLlegit }, provinciaDonada, llig, signal) {
  let article = articleLlegit;
  if (!article && entitat.titolCawiki) {
    const llegit = pagina(await llig('article', { titles: entitat.titolCawiki }, { signal }));
    article = !llegit.falta && !llegit.desambiguacio && llegit.qid === entitat.qid ? llegit : null;
  }
  const divisions = await opcional(
    async () => (entitat.p131.length ? llista(await llig('etiquetes', { ids: entitat.p131.join('|') }, { signal })) : []), signal);
  const noms = candidatsDeFitxers({
    p18: entitat.p18, p94: entitat.p94, imatgePagina: article?.imatgePagina, fitxers: article?.fitxers
  });
  const fitxers = await opcional(async () => {
    const grups = partixTitols(noms.map((nom) => `File:${nom}`));
    const llegits = await Promise.all(grups.map(async (titles) => llista(await llig('fitxers', { titles }, { signal }))));
    return llegits.flat();
  }, signal);
  const { provincia: provinciaP131, comarca } = divisionsDe(divisions.valor);
  const content = article ? entradillaDe(article.extracte) : '';
  const imatges = triaImatges(fitxers.valor, { p18: entitat.p18, imatgePagina: article?.imatgePagina });
  const complet = Boolean(content) && teTresFotos(imatges) && divisions.ok && fitxers.ok;
  return dtoDelPoble({
    estat: complet ? 'complet' : 'parcial',
    title: majuscula(espais(entitat.etiqueta)),
    provincia: provinciaDeIne(entitat.ine) || provinciaP131 || provinciaDonada,
    comarca,
    content,
    population: entitat.poblacio === null ? null : `${entitat.poblacio} hab`,
    lat: entitat.lat ?? article?.lat,
    lng: entitat.lng ?? article?.lng,
    wikidataId: entitat.qid,
    wikipediaTitle: article ? article.titol : null,
    imatges
  });
}

/**
 * La proposta de fitxa d'un poble nou a partir del seu nom. Opcions:
 *   · provincia: la que ha triat l'habitant, per a desfer homònims;
 *   · llig: el lector de Wikimedia (client.js); les proves en passen un fals;
 *   · signal: per a cancel·lar-ho tot (torna 'no-disponible').
 */
export async function pobleDeViquipedia(nom, { provincia = null, llig = lligViquipedia, signal } = {}) {
  const nomNet = netejaNom(nom);
  const provinciaDonada = netejaNom(provincia) || null;
  if (!slugDelPoble(nomNet)) return dtoDelPoble({ estat: 'sense-article', title: nomNet, provincia: provinciaDonada });
  try {
    const resolt = await resolMunicipi(nomNet, provinciaDonada, llig, signal);
    if (!resolt) return dtoDelPoble({ estat: 'sense-article', title: nomNet, provincia: provinciaDonada });
    return await completa(resolt, provinciaDonada, llig, signal);
  } catch {
    return dtoDelPoble({ estat: 'no-disponible', title: nomNet, provincia: provinciaDonada });
  }
}
