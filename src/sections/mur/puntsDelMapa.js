/**
 * puntsDelMapa.js — de les publicacions del Mur als punts del Mapa Fotogràfic
 * (P1-64). Pur: sense React, sense xarxa i sense llegir cap fitxer d'imatge.
 *
 * El contracte de dades del Mapa (decisions del Mestre, 261028), el que
 * escriu la línia EXIF en publicar:
 *   · payload.geolocalitzacio (la foto principal): { lat, lng, altitud?,
 *     precisio: 'exacta' | '100m' | 'poble', precisio_m, origen: 'exif' | 'manual' };
 *   · payload.dataCaptura: el text d'exif.js, «AAAA-MM-DDThh:mm:ss[±hh:mm]»;
 *   · payload.fotos_geo (les fotos del cos, com a molt 24, en ordre):
 *     [{ src, lat, lng, precisio, precisio_m, dataCaptura }].
 * Verd vol dir GPS real de la foto: la principal amb origen 'exif' i les de
 * fotos_geo amb coordenades. Una precisió 'poble' és real però arrodonida:
 * continua verda, i la targeta en diu la precisió. Ocre vol dir que el lloc no
 * és el GPS de la foto: estimada per la foto amb GPS més pròxima en el temps de
 * la MATEIXA publicació (mai una interpolació, mai una altra publicació),
 * posada al centre del poble que declara (poble_id → les fitxes de /pobles, o
 * la llavor townsSeed.js si no hi és) o indicada per l'autor (origen 'manual').
 * Sense lloc i sense poble, la foto queda pendent d'ubicar: no es pinta.
 *
 * PRIVACITAT
 *   · Només entren publicacions, actes i patrimoni (TIPUS_DEL_MAPA): mai una
 *     foto de perfil, un avatar, un xat ni res de l'àmbit d'una persona.
 *   · Les coordenades s'usen exactament com es van desar (ja arrodonides a la
 *     precisió que va triar l'autor): ací no es refinen ni es lligen els bytes
 *     de cap foto, que podrien portar més precisió de la triada.
 *   · Una miniatura només es demana si és d'una font pròpia
 *     (esFontImatgePropia, Decisió 3 del Mestre: cap imatge externa al Mur).
 *
 * UNA PARADA · Les fotos d'una publicació, en ordre de captura, es parteixen
 * en parades com fa Emowe: una parada nova quan la foto queda a més de
 * RADI_DE_PARADA_KM de la primera de la parada o canvia el dia. La parada és al
 * lloc de la seua primera foto (la principal, si és la primera). Una
 * publicació d'un sol lloc és una sola parada.
 */
import { esFontImatgePropia } from '../../utils/sanitize.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { PRECISIONS } from '../../components/universal/enquadrament/geolocalitzacio.js';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';
import { slugDelPoble } from '../pobles/nomsDelPoble.js';
import {
  comparaCaptures, distanciaKm, esPuntValid, estimaUbicacions, instantDeCaptura, modeDeComparacio, pobleMesProper
} from './mapaFotografic.js';

/** Les menes d'element del Mur que poden portar fotos al mapa. */
export const TIPUS_DEL_MAPA = Object.freeze(['feed', 'post', 'publicacio', 'event', 'patrimoni']);
/** La foto principal i les 24 de fotos_geo, com a molt. */
export const MAX_FOTOS_PER_PUBLICACIO = 25;
/** Una foto a més d'esta distància de la primera de la parada en fa una de nova. */
export const RADI_DE_PARADA_KM = 1;
/** El nom d'una parada és el del poble de la llavor més pròxim dins d'este radi. */
export const RADI_DEL_NOM_KM = 15;

const CAP = Object.freeze([]);
const PRECISIO_EN_METRES = Object.freeze(Object.fromEntries(PRECISIONS.map((p) => [p.valor, p.precisio_m])));

const textDe = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const esObjecte = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
/* Una coordenada del payload: només un número (una cadena no es convertix: el
   mapejador no en valida el tipus, i un «38,59» no és cap lloc). */
const numeroDe = (valor) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : null);
/* Una coordenada d'una fitxa de poble (dades nostres): també el text d'un número. */
const numeroDelPoble = (valor) => {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  return typeof valor === 'string' && /^-?\d+(?:\.\d+)?$/.test(valor.trim()) ? Number(valor) : null;
};
/* La primera cadena d'un camp d'imatge (una cadena o una llista). */
/* Una foto sense el seu instant (de treball): el DTO només porta el text de la data. */
const senseInstant = (foto) => {
  const copia = { ...foto };
  delete copia.instant;
  return copia;
};
const primeraFont = (valor) => (Array.isArray(valor) ? valor.map(textDe).find(Boolean) || '' : textDe(valor));

function precisioDe(camps) {
  const precisio = Object.hasOwn(PRECISIO_EN_METRES, camps?.precisio) ? camps.precisio : null;
  const metres = numeroDe(camps?.precisio_m);
  return { precisio, precisio_m: metres !== null && metres >= 0 ? metres : (precisio ? PRECISIO_EN_METRES[precisio] : null) };
}

/** Si un element del Mur pot portar fotos al mapa (TIPUS_DEL_MAPA, amb id; mai sistema ni àmbit de persona). */
export function esPublicacioDelMapa(item) {
  if (!esObjecte(item) || item.id == null || item.isSystem === true) return false;
  if (textDe(item.ambit) === 'persona') return false;
  return TIPUS_DEL_MAPA.includes(textDe(item.type));
}

/**
 * Les coordenades del poble `slug`: de les fitxes de /pobles i, si no hi és
 * (o no en porta), de la llavor (MOCK_TOWNS). { lat, lng, title, comarca } o null.
 */
export function coordenadesDelPoble(slug, pobles) {
  const clau = slugDelPoble(textDe(slug));
  if (!clau) return null;
  for (const llista of [Array.isArray(pobles) ? pobles : CAP, MOCK_TOWNS]) {
    for (const poble of llista) {
      if (!esObjecte(poble)) continue;
      const claus = [poble.id, poble.slug, poble.title || poble.name].map((v) => slugDelPoble(textDe(String(v ?? ''))));
      if (!claus.includes(clau)) continue;
      const punt = { lat: numeroDelPoble(poble.lat), lng: numeroDelPoble(poble.lng) };
      if (!esPuntValid(punt)) continue;
      return { ...punt, title: textDe(poble.title || poble.name), comarca: textDe(poble.comarca) };
    }
  }
  return null;
}

/* Les fonts que mai són una foto de la publicació: les cares de qui signa. */
const fontsDeLaCara = (item) => new Set([item.avatar_url, item.author_avatar, item.logo_image].map(primeraFont).filter(Boolean));

/**
 * Les fotos d'una publicació, en l'ordre en què les porta: la principal (amb
 * la seua geolocalitzacio i dataCaptura), les de fotos_geo i les de la galeria
 * (images) que no hi són, sense repetides i com a molt MAX_FOTOS_PER_PUBLICACIO.
 * Cada una: { id, src, miniatura, lat, lng, origen, precisio, precisio_m, dataCaptura, principal }.
 */
export function fotosDeLaPublicacio(item, publicacio = `${textDe(item?.type)}:${item?.id}`) {
  if (!esObjecte(item)) return [];
  const cares = fontsDeLaCara(item);
  const vistes = new Set();
  const fotos = [];
  const afig = (src, camps, principal) => {
    if (!src || vistes.has(src) || cares.has(src) || fotos.length >= MAX_FOTOS_PER_PUBLICACIO) return;
    vistes.add(src);
    const lat = numeroDe(camps?.lat);
    const lng = numeroDe(camps?.lng);
    const ambLloc = esPuntValid({ lat, lng });
    const origenDesat = textDe(camps?.origen);
    let origen = null;
    if (ambLloc) origen = origenDesat === 'exif' || (!principal && !origenDesat) ? 'exif' : 'manual';
    fotos.push({
      id: `${publicacio}|${src}`,
      src,
      /* Una pujada pròpia (sdp-media://) també és miniatura: és una referència opaca
         que només el port convertix en URL, al renderitzador (MapaFotografic). */
      miniatura: esFontImatgePropia(src) || esMitjaOpac(src) ? src : null,
      lat: ambLloc ? lat : null,
      lng: ambLloc ? lng : null,
      origen,
      ...(ambLloc ? precisioDe(camps) : { precisio: null, precisio_m: null }),
      dataCaptura: textDe(camps?.dataCaptura) || null,
      principal
    });
  };
  const geo = esObjecte(item.geolocalitzacio) ? item.geolocalitzacio : null;
  afig(primeraFont(item.image_url) || primeraFont(item.image), { ...(geo || {}), dataCaptura: item.dataCaptura }, true);
  for (const foto of Array.isArray(item.fotos_geo) ? item.fotos_geo : CAP) {
    if (esObjecte(foto)) afig(textDe(foto.src), foto, false);
  }
  for (const src of Array.isArray(item.images) ? item.images : CAP) afig(textDe(src), null, false);
  return fotos;
}

/* El nom d'una parada: el poble on s'ha posat, o el de la llavor més pròxim. */
function llocDe(foto, poble) {
  if (foto.estat === 'poble' && poble?.title) return poble.title;
  const proper = pobleMesProper(foto, MOCK_TOWNS);
  return proper && proper.km <= RADI_DEL_NOM_KM ? proper.nom : null;
}

/* Parteix les fotos (ja en ordre) d'una publicació en parades. */
function paradesDe(fotos) {
  const parades = [];
  for (const foto of fotos) {
    const actual = parades[parades.length - 1];
    const dia = foto.instant?.dia ?? null;
    const nova = !actual
      || distanciaKm(actual.fotos[0], foto) > RADI_DE_PARADA_KM
      || (dia !== null && actual.dia !== null && dia !== actual.dia);
    if (nova) parades.push({ fotos: [foto], dia });
    else {
      actual.fotos.push(foto);
      if (actual.dia === null) actual.dia = dia;
    }
  }
  return parades;
}

/**
 * Els punts del mapa d'una llista d'elements del Mur:
 *   · fotos: cada foto amb lloc, en ordre de captura, amb { publicacio, titol,
 *     estat, lloc, parada, ordre } i, si és estimada, { referencia,
 *     diferencia_s, incertesaAlta };
 *   · parades: { id, publicacio, titol, lat, lng, estat, precisio,
 *     precisio_m, dataCaptura, lloc, fotos: [índexs de fotos], estimada }, en
 *     ordre de la primera captura (el número de cada grup és el de la seua
 *     primera visita);
 *   · pendents: les fotos sense lloc ni poble.
 * L'ordre es decidix una vegada per a tot el conjunt (modeDeComparacio): per
 * l'instant si totes les fotos amb data porten zona, si no per l'hora de
 * rellotge; les que no tenen data van darrere, en l'ordre en què arriben.
 */
export function puntsDelMapa(items, { pobles = null } = {}) {
  const publicacions = [];
  const pendents = [];
  for (const item of Array.isArray(items) ? items : CAP) {
    if (!esPublicacioDelMapa(item)) continue;
    const publicacio = `${textDe(item.type)}:${item.id}`;
    const fotos = fotosDeLaPublicacio(item, publicacio);
    if (!fotos.length) continue;
    const poble = coordenadesDelPoble(item.poble_id, pobles);
    const titol = textDe(item.title) || textDe(item.name);
    const comunes = { publicacio, titol, poble_id: poble ? slugDelPoble(textDe(item.poble_id)) : null };
    const estimades = estimaUbicacions(fotos, { centreDelPoble: poble }).map((foto) => ({ ...foto, ...comunes }));
    for (const foto of estimades) {
      if (foto.estat === 'pendent') pendents.push(foto);
    }
    const ambLloc = estimades.filter((foto) => foto.estat !== 'pendent')
      .map((foto) => ({ ...foto, lloc: llocDe(foto, poble), instant: instantDeCaptura(foto.dataCaptura) }));
    if (ambLloc.length) publicacions.push({ publicacio, titol, fotos: ambLloc });
  }
  const mode = modeDeComparacio(publicacions.flatMap((p) => p.fotos.map((foto) => foto.instant)));
  const perCaptura = (a, b) => comparaCaptures(a.foto.instant, b.foto.instant, mode) || a.index - b.index;
  const enOrdre = (fotos) => fotos.map((foto, index) => ({ foto, index })).sort(perCaptura).map((entrada) => entrada.foto);

  const crues = publicacions.flatMap((p) => paradesDe(enOrdre(p.fotos)).map((parada, k) => ({ ...parada, publicacio: p.publicacio, titol: p.titol, k })));
  const paradesEnOrdre = crues.map((parada, index) => ({ foto: parada.fotos[0], parada, index }))
    .sort(perCaptura).map((entrada) => entrada.parada);

  const fotosEnOrdre = enOrdre(paradesEnOrdre.flatMap((parada, indexParada) => parada.fotos.map((foto) => ({ ...foto, parada: indexParada }))));
  const fotos = fotosEnOrdre.map((foto, index) => ({ ...senseInstant(foto), ordre: index + 1 }));
  // Les fotos de cada parada, d'una sola passada: una volta sencera per parada era quadràtica (7 s amb 25 000 fotos).
  const perParada = paradesEnOrdre.map(() => []);
  fotos.forEach((foto, index) => perParada[foto.parada].push(index));
  const parades = paradesEnOrdre.map((parada, indexParada) => {
    const primera = parada.fotos[0];
    const datada = parada.fotos.find((foto) => foto.instant);
    return {
      id: `${parada.publicacio}~${parada.k}`,
      publicacio: parada.publicacio,
      titol: parada.titol,
      lat: primera.lat,
      lng: primera.lng,
      estat: primera.estat,
      precisio: primera.precisio ?? null,
      precisio_m: primera.precisio_m ?? null,
      dataCaptura: datada ? datada.dataCaptura : null,
      lloc: primera.lloc,
      fotos: perParada[indexParada],
      estimada: parada.fotos.some((foto) => foto.estat !== 'gps')
    };
  });
  return { fotos, parades, pendents };
}
