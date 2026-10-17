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
 *   · Poble · el del cens o el de l'article d'un poble, amb el seu enllaç.
 *   · Drets d'ús · dretsDe (origenImatges.js); sense, «No declarats».
 *   · Origen · il·lustració d'IA, fotografia o recurs del sistema.
 *   · Publicat a · l'article on s'usa la foto, amb el seu enllaç; sense, que
 *     és de l'arxiu.
 *   · Comentar i Connectar · el xat comú de la foto (multimedia:<id>) i
 *     Connectar-la, els dos enllaços interns que portava la pàgina
 *     /multimedia/<id> abans del visor (revisió adversarial del 261016: sense
 *     ells, des de l'Arxiu ja no es podia obrir cap fil nou ni connectar cap
 *     foto). Si l'element no en té (cap id), la fila no es pinta.
 * Mentre l'EXIF es llig, els camps que en depenen diuen «Llegint…».
 */
import { getSectionItemPath, objecteDe, rutaConnectarObjecte, rutaXatDePagina } from '../../config/navigation.js';
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
 * 'llegint' | 'llest' | 'sense'. `nomDelPoble(slug)` torna el nom del poble.
 */
export function filesDelPanell(item, { exif = null, estatExif = 'sense', persona = false, cens = null, nomDelPoble = null, t = null } = {}) {
  if (!item) return [];
  const tr = (clau, reserva) => (typeof t === 'function' ? t(clau, reserva) : reserva);
  const tradueix = ([clau, reserva]) => tr(clau, reserva);
  const desconegut = tr('section.multimedia.visor.desconegut', 'Desconegut');
  const llegint = estatExif === 'llegint' ? tr('section.multimedia.visor.llegint', 'Llegint…') : null;
  const delExif = (valor) => valor || llegint || desconegut;

  const data = formataDataHora(item.dataCaptura) || formataDataHora(exif?.dataCaptura);
  const geo = item.geolocalitzacio || exif?.gps || null;
  const origen = origenDe(item, cens);
  const autor = textNet(exif?.autor) || autorDeclarat(item);
  const slug = pobleDe(item);
  const nomPoble = slug ? (typeof nomDelPoble === 'function' && nomDelPoble(slug)) || (item.article?.sectionId === 'pobles' && item.title) || slug : null;
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

  return [
    { clau: 'data', etiqueta: tr('section.multimedia.visor.data', 'Data i hora de captura'), valor: delExif(data) },
    {
      clau: 'gps',
      etiqueta: tr('section.multimedia.visor.gps', 'Coordenades GPS'),
      valor: persona ? tr('section.multimedia.visor.gpsPrivat', 'No es mostren en la foto d’una persona') : (formataGps(geo) || delExif(null))
    },
    { clau: 'camera', etiqueta: tr('section.multimedia.visor.camera', 'Càmera'), valor: delExif(formataCamera(exif?.camera)) },
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
    ...accions
  ];
}
