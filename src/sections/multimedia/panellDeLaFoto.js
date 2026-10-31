/**
 * panellDeLaFoto.js — les files del panell d'informació del visor de l'Arxiu
 * visual (VisorDeLArxiu.jsx), en dades pures.
 *
 * Onada 0.3 (Gauntlet 261016, M06; pla 261016_1530: «panell lateral
 * desplegable de metadades EXIF (data i hora exactes, coordenades GPS,
 * càmera, autor, poble i drets d'ús)») · Cada fila és { clau, etiqueta,
 * valor, ruta? }: amb `ruta`, qui pinta en fa un enllaç intern. Llei de M06:
 * el que no se sap es diu «Desconegut», mai s'inventa:
 *   · Data i hora de captura · la de l'element (dataCaptura, la de la
 *     pujada, ADR D6) o la de l'EXIF; la data de publicació no és la de la foto.
 *   · Coordenades GPS · les de l'element (geolocalitzacio) o les de l'EXIF; en
 *     la foto d'una persona, mai: la fila ho diu.
 *   · Càmera, autor · de l'EXIF; l'autor, també l'autoria declarada de
 *     l'element (autorDeclarat): el camp `autor` si el porta (null: no consta)
 *     i, si no, qui signa l'element (source), llevat de la foto d'un poble, on
 *     `source` és el nom del poble. Cap reserva inventada (mediaContent.js ja
 *     no n'escriu cap).
 *   · Resolució · Gauntlet 261017 (C05 de Codex: «la resolució coneguda no
 *     s'ha d'ocultar perquè falte EXIF») · les mides reals de la foto pintada
 *     (naturalWidth × naturalHeight, les que el visor llig en carregar-la),
 *     no les de l'EXIF: són les del fitxer que es veu. Mentre carrega,
 *     «Llegint…»; si no carrega, «Desconegut».
 *   · Poble · el del cens o el de l'article d'un poble, amb el seu enllaç; el
 *     d'una publicació (nomPoble, el nom que porta), sense si no és al cens
 *     de pobles.
 *   · Drets d'ús · dretsDe (origenImatges.js); sense, «No declarats».
 *   · Origen · il·lustració d'IA, fotografia o recurs del sistema.
 *   · Publicat a · l'article on s'usa la foto, amb el seu enllaç; sense, que
 *     és de l'arxiu.
 *   · Enllaç de la imatge · Ordre del Mestre (30-10-2026, B3) · la URL
 *     completa del fitxer (el src resolt), que el visor pinta amb el botó
 *     «Copiar l’enllaç de la imatge» (VisorDeLArxiu.jsx). La fila porta
 *     `enllac` (la URL) només quan n'hi ha una de pública: vegeu
 *     enllacPublicDe. Sense, diu «No té cap enllaç públic d’este lloc» i no
 *     hi ha res a copiar. Gauntlet 261030 (f4b, B3-FITXA-FALS) · La fila és
 *     NOMÉS de qui passa l'origen de la pàgina (`origenPagina`: el visor).
 *     Sense origen no se sap si n'hi ha cap, i la fila no hi és: la fitxa
 *     ?item= de /multimedia (FitxaWeb), que B3 no tocava, deia «No té cap
 *     enllaç públic d’este lloc» de fotos públiques.
 *     Ordre del Mestre (30-10-2026, prompt 2208, T4.2; QA-T3-UX-01) · El text
 *     de quan no n'hi ha cap és NOMÉS de l'Arxiu (`avisSenseEnllac`, que hi
 *     posa el visor de /multimedia). Fora de l'Arxiu (les publicacions, el
 *     Perfil), sense enllaç públic la fila no hi és; amb un, sí.
 *   · Comentar i Connectar · el xat comú de la foto (multimedia:<id>) i
 *     Connectar-la, els dos enllaços interns que portava la pàgina
 *     /multimedia/<id> abans del visor (revisió adversarial del 261016: sense
 *     ells, des de l'Arxiu ja no es podia obrir cap fil nou ni connectar cap
 *     foto). Si l'element no en té (cap id), la fila no es pinta.
 * Mentre l'EXIF es llig, els camps que en depenen diuen «Llegint…».
 */
import { getSectionItemPath, objecteDe, rutaConnectarObjecte, rutaXatDePagina } from '../../config/navigation.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { dretsDe, origenDe } from './origenImatges.js';

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;

/** «dd/mm/aaaa hh:mm:ss» del text ISO tal qual (l'hora local de la càmera),
 *  sense els segons si el text no en porta, o null. El pla demana «data i hora
 *  exactes»: els segons de DateTimeOriginal no es tallen. */
export function formataDataHora(valor) {
  const m = typeof valor === 'string' ? ISO.exec(valor.trim()) : null;
  if (!m) return null;
  const [, any, mes, dia, hora, minut, segon] = m;
  if (!hora) return `${dia}/${mes}/${any}`;
  return segon ? `${dia}/${mes}/${any} ${hora}:${minut}:${segon}` : `${dia}/${mes}/${any} ${hora}:${minut}`;
}

const textNet = (valor) => (typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null);

/** L'autoria declarada de la foto, o null: el camp `autor` de l'element si el
 *  porta (també quan és null: l'arxiu diu d'on ve, `source`, però no qui la va
 *  fer) i, si no, qui la signa (source), llevat de la foto d'un poble. */
export function autorDeclarat(item) {
  if (!item) return null;
  if (Object.hasOwn(item, 'autor')) return textNet(item.autor);
  return item.tag !== 'Poble' ? textNet(item.source) : null;
}

/** «38.59190, -0.41840 · 456,7 m», o null. */
export function formataGps(gps) {
  const lat = Number(gps?.lat);
  const lng = Number(gps?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const altitud = Number.isFinite(gps?.altitud) ? ` · ${String(gps.altitud).replace('.', ',')} m` : '';
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}${altitud}`;
}

/** La càmera en una línia: el model si ja porta la marca; si no, marca i model. */
export function formataCamera(camera) {
  const marca = typeof camera?.marca === 'string' ? camera.marca.trim() : '';
  const model = typeof camera?.model === 'string' ? camera.model.trim() : '';
  if (!marca && !model) return null;
  if (!marca) return model;
  if (!model) return marca;
  return model.toLowerCase().startsWith(marca.toLowerCase()) ? model : `${marca} ${model}`;
}

/** Gauntlet 261017 (C05) · «4032 × 3024 px» de les mides reals de la foto
 *  ({ amplada, alcada }, enters positius), o null: mai s'inventen. */
export function formataResolucio(mides) {
  const amplada = Number(mides?.amplada);
  const alcada = Number(mides?.alcada);
  if (!Number.isInteger(amplada) || !Number.isInteger(alcada) || amplada <= 0 || alcada <= 0) return null;
  return `${amplada} × ${alcada} px`;
}

/* Ordre del Mestre (30-10-2026, B3) · Què pot eixir com a «enllaç» d'una foto.
   Només una URL pública i absoluta del lloc: el recurs públic de l'Arxiu
   ('/assets/…', resolt amb `resol`, el resolRecursPropi del visor: dins d'un
   amfitrió, la URL del paquet; a l'app nativa, l'origen públic) o una URL
   http(s) del MATEIX origen que també és dins de /assets/. Gauntlet 261030
   (f4b, B3-AMFITRIO-FALS-NEGATIU) · I la forma JA RESOLTA d'un recurs propi,
   tal qual: una URL on algun '/assets/…' del camí, resolt amb `resol`, torna
   EXACTAMENT ella (la base de l'amfitrió, absoluta o un camí, o l'origen
   extern de la política de mitjans). L'enllaç de la resolta és el de la
   crua, i res més. Dins d'un amfitrió, les fotos dels pobles i del Mercat
   (townsContent.js i marketContent.js les resolen en importar-se) i les del
   cos d'una publicació (resolRecursosDeHtml) ja arriben així. Mai:
     · cap arxiu local (el Gestor d'arxius locals, IDEA-55): ni blob:, ni
       data:, ni file:, ni cap camí del disc ('/Users/…', 'C:\…'), ni cap
       element amb un id de l'espai ('__lf_…', '__lc_…': els ids opacs dels
       locals, arbreMultimedia.js · esIdSintetic);
     · cap referència opaca del port (sdp-media://) ni la URL que en torna
       (srcDelPort): la del bucket privat és una URL signada, amb el testimoni
       dins, i la del públic és d'un altre origen;
     · cap URL d'un altre origen (Viquipèdia, Storage) que no siga la forma
       resolta exacta d'un recurs propi, cap esquema que no siga http(s) ni
       cap URL amb credencials;
     · cap camí que, normalitzat ('/assets/../', '%2e%2e'), isca de /assets/.
   El que no passa, null: la fila ho diu i no hi ha res a copiar. */
const CARACTER_DE_FORA = /[\u0000-\u001F\u007F\\]/;
const esHttp = (url) => (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password;
const dinsDAssets = (url) => url.pathname.startsWith('/assets/');

/* Un recurs cru '/assets/…' resolt amb `resol` (sense, tal qual): la URL
   http(s) absoluta, o null. */
function resolCru(cru, pagina, resol) {
  const resolt = typeof resol === 'function' ? resol(cru) : cru;
  if (typeof resolt !== 'string' || !resolt.trim() || CARACTER_DE_FORA.test(resolt)) return null;
  const url = new URL(resolt.trim(), pagina);
  return esHttp(url) ? url.href : null;
}

/* B3-AMFITRIO-FALS-NEGATIU · Cert si algun '/assets/…' del camí de la URL,
   resolt, torna exactament la URL: és un recurs propi ja resolt. Sense
   resolutor, mai. */
function esFormaResolta(url, pagina, resol) {
  if (typeof resol !== 'function') return false;
  const { pathname } = url;
  for (let pos = pathname.indexOf('/assets/'); pos !== -1; pos = pathname.indexOf('/assets/', pos + 1)) {
    if (resolCru(`${pathname.slice(pos)}${url.search}${url.hash}`, pagina, resol) === url.href) return true;
  }
  return false;
}

/** La URL pública i absoluta de la foto (string) o null. `origen` és l'origen
 *  de la pàgina (origenDeLaPagina) i `resol`, el resolutor dels recursos propis. */
export function enllacPublicDe(item, { origen = null, resol = null } = {}) {
  if (!item || typeof origen !== 'string' || !origen) return null;
  if (item.id != null && String(item.id).startsWith('__')) return null;
  const src = typeof item.src === 'string' ? item.src.trim() : '';
  if (!src || esMitjaOpac(src) || CARACTER_DE_FORA.test(src)) return null;
  try {
    const pagina = new URL(origen);
    if (!esHttp(pagina) || src.startsWith('//')) return null;
    const relatiu = src.startsWith('/');
    if (!relatiu && !/^https?:\/\//i.test(src)) return null;
    const url = new URL(src, pagina);
    if (!esHttp(url)) return null;
    /* El recurs de l'Arxiu: el cru ('/assets/…') es resol com el pinta el visor; l'absolut del lloc, tal qual. */
    if (url.origin === pagina.origin && dinsDAssets(url)) return relatiu ? resolCru(src, pagina, resol) : url.href;
    return esFormaResolta(url, pagina, resol) ? url.href : null;
  } catch {
    return null;
  }
}

const SECCIONS = Object.freeze({
  mur: ['nav.mur', 'Mur'],
  mercat: ['nav.mercat', 'Mercat'],
  pobles: ['nav.pobles', 'Pobles'],
  events: ['section.events.title', 'Agenda']
});

const ORIGENS = Object.freeze({
  ia: ['section.multimedia.visor.origenIa', 'Il·lustració d’IA'],
  foto: ['section.multimedia.visor.origenFoto', 'Fotografia'],
  sistema: ['section.multimedia.visor.origenSistema', 'Recurs del sistema']
});

/** El slug del poble d'una foto: el del cens o el de l'article d'un poble. */
export function pobleDe(item) {
  if (typeof item?.poble === 'string' && item.poble) return item.poble;
  if (item?.article?.sectionId === 'pobles' && item.article.id != null) return String(item.article.id);
  return null;
}

/**
 * Les files del panell. `exif` és el que ha llegit useMetadadesFoto
 * ({ dataCaptura, gps, camera, autor, copyright } o null) i `estatExif`
 * 'llegint' | 'llest' | 'sense'. `mides` són les mides reals de la foto
 * pintada ({ amplada, alcada } o null) i `estatMides`, com `estatExif`.
 * `nomDelPoble(slug)` torna el nom del poble. `origenPagina` i `resol` són
 * l'`origen` i el `resol` d'enllacPublicDe (B3): sense origen, la fila de
 * l'enllaç no hi és. `avisSenseEnllac` (T4.2): només a l'Arxiu, la fila diu
 * que no n'hi ha cap; sense, una foto sense enllaç públic no porta la fila.
 */
export function filesDelPanell(item, {
  exif = null, estatExif = 'sense', mides = null, estatMides = 'sense', persona = false, cens = null, nomDelPoble = null, t = null,
  origenPagina = null, resol = null, avisSenseEnllac = false
} = {}) {
  if (!item) return [];
  const tr = (clau, reserva) => (typeof t === 'function' ? t(clau, reserva) : reserva);
  const tradueix = ([clau, reserva]) => tr(clau, reserva);
  const desconegut = tr('section.multimedia.visor.desconegut', 'Desconegut');
  const textLlegint = tr('section.multimedia.visor.llegint', 'Llegint…');
  const llegint = estatExif === 'llegint' ? textLlegint : null;
  const delExif = (valor) => valor || llegint || desconegut;
  const resolucio = formataResolucio(mides) || (estatMides === 'llegint' ? textLlegint : desconegut);

  const data = formataDataHora(item.dataCaptura) || formataDataHora(exif?.dataCaptura);
  const geo = item.geolocalitzacio || exif?.gps || null;
  const origen = origenDe(item, cens);
  const autor = textNet(exif?.autor) || autorDeclarat(item);
  const slug = pobleDe(item);
  const nomPoble = slug ? (typeof nomDelPoble === 'function' && nomDelPoble(slug)) || (item.article?.sectionId === 'pobles' && item.title) || slug : textNet(item.nomPoble);
  const drets = dretsDe(item, { origen, copyrightExif: exif?.copyright });
  const article = item.article && item.article.id != null && Object.hasOwn(SECCIONS, item.article.sectionId) ? item.article : null;
  /* El mateix descriptor que feia servir la pàgina /multimedia/<id>
     (ItemDetailSection: objecteDe de l'element a la secció 'multimedia'): el
     fil de xat que ja existix per a eixa foto és el mateix. */
  const objecte = item.id != null && String(item.id) !== '' ? objecteDe(item, 'multimedia') : null;
  const rutaComentar = objecte ? rutaXatDePagina(objecte) : null;
  const accions = objecte
    ? [
      ...(rutaComentar ? [{ clau: 'comentar', etiqueta: tr('section.multimedia.visor.comentar', 'Comentar'), valor: tr('section.multimedia.visor.comentarFoto', 'Obrir el xat de la foto'), ruta: rutaComentar }] : []),
      { clau: 'connectar', etiqueta: tr('section.multimedia.visor.connectar', 'Connectar'), valor: tr('section.multimedia.visor.connectarFoto', 'Connectar la foto'), ruta: rutaConnectarObjecte(objecte) }
    ]
    : [];
  /* B3 · La URL pública de la foto, o el text que diu que no n'hi ha. Només
     amb l'origen de la pàgina (el visor): sense, cap fila (B3-FITXA-FALS).
     Ordre del Mestre (30-10-2026, prompt 2208, T4.2) · El text, només a
     l'Arxiu (avisSenseEnllac); fora, sense enllaç públic, cap fila. */
  const ambEnllac = typeof origenPagina === 'string' && origenPagina !== '';
  const enllac = ambEnllac ? enllacPublicDe(item, { origen: origenPagina, resol }) : null;
  const filesEnllac = ambEnllac && (enllac || avisSenseEnllac === true)
    ? [{
      clau: 'enllac',
      etiqueta: tr('section.multimedia.visor.enllac', 'Enllaç de la imatge'),
      valor: enllac || tr('section.multimedia.visor.senseEnllac', 'No té cap enllaç públic d’este lloc'),
      ...(enllac ? { enllac } : {})
    }]
    : [];

  return [
    { clau: 'data', etiqueta: tr('section.multimedia.visor.data', 'Data i hora de captura'), valor: delExif(data) },
    {
      clau: 'gps',
      etiqueta: tr('section.multimedia.visor.gps', 'Coordenades GPS'),
      valor: persona ? tr('section.multimedia.visor.gpsPrivat', 'No es mostren en la foto d’una persona') : (formataGps(geo) || delExif(null))
    },
    { clau: 'camera', etiqueta: tr('section.multimedia.visor.camera', 'Càmera'), valor: delExif(formataCamera(exif?.camera)) },
    { clau: 'resolucio', etiqueta: tr('section.multimedia.visor.resolucio', 'Resolució'), valor: resolucio },
    { clau: 'autor', etiqueta: tr('section.multimedia.visor.autor', 'Autor'), valor: delExif(autor) },
    {
      clau: 'poble',
      etiqueta: tr('section.multimedia.visor.poble', 'Poble'),
      valor: nomPoble || desconegut,
      ...(slug ? { ruta: getSectionItemPath('pobles', slug) } : {})
    },
    { clau: 'drets', etiqueta: tr('section.multimedia.visor.drets', 'Drets d’ús'), valor: drets || tr('section.multimedia.visor.dretsNoDeclarats', 'No declarats') },
    { clau: 'origen', etiqueta: tr('section.multimedia.visor.origen', 'Origen'), valor: tradueix(ORIGENS[origen]) },
    article
      ? {
        clau: 'publicat',
        etiqueta: tr('section.multimedia.visor.publicatA', 'Publicat a'),
        valor: `${tradueix(SECCIONS[article.sectionId])} · ${item.title || article.id}`,
        ruta: getSectionItemPath(article.sectionId, article.id)
      }
      : { clau: 'publicat', etiqueta: tr('section.multimedia.visor.publicatA', 'Publicat a'), valor: tr('section.multimedia.visor.senseArticle', 'Cap article: és de l’arxiu') },
    ...filesEnllac,
    ...accions
  ];
}
