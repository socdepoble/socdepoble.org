/**
 * geoDeLesFotos.js — P1-64 (pla 261028_1526 §3.1.1 i §3.7.1; Mestre 261028,
 * decisions 7 i 8) · La ubicació de les fotos d'una publicació, derivada en
 * publicar-la (publishNote, NotesContext) per al Mapa fotogràfic. Sense
 * migració: el registre de cada foto és el seu, i ací només se'n fa l'índex.
 *   · Les fotos del COS: els data-* de l'<img> que escriu l'ordre «/» Imatge
 *     quan la persona conserva la ubicació (SdpImage, richText/extensions):
 *     fotosGeoDelCos(html) → payload.fotos_geo, com a molt MAX_FOTOS_GEO, en
 *     l'ordre del cos, sense repetir cap src i només amb fonts pròpies.
 *   · El HERO: el seu EXIF, que la compressió ja ha arrodonit a la precisió
 *     triada (ajustaPrecisioGps): geoDelHero(src) → payload.geolocalitzacio i
 *     payload.dataCaptura. Un data: URL es llig dels bytes (amb la precisió
 *     del denominador, precisioDeGps); una foto del bucket públic
 *     (sdp-media://mitjans/…), per Range (llegixExifRemot) dins d'un temps
 *     fitat (TEMPS_HERO_MS), amb la precisió del denominador si la lectura
 *     porta el TIFF (ambTiff) o, si no, deduïda de les coordenades. Si
 *     falla o tarda, cap clau: la publicació no es bloqueja mai.
 * El contracte (decisions_mestre, «Contracte de dades del Mapa»):
 *   geolocalitzacio = { lat, lng, altitud?, precisio, precisio_m, origen: 'exif' }
 *   fotos_geo = [{ src, lat, lng, precisio, precisio_m, dataCaptura }]
 * Les dades d'un veí són declaracions seues: el Mapa en diu l'origen, no les
 * avala. El servidor no les valida: els sanejadors són a mapejadorSeccions.js.
 */
import { coordenadesValides, llegixExif } from '../../components/universal/enquadrament/exif.js';
import { extreuTiff, precisioDeGps } from '../../components/universal/enquadrament/exifIncrustat.js';
import { PRECISIONS, geolocalitzacio } from '../../components/universal/enquadrament/geolocalitzacio.js';
import { fotoDelBucketPublic } from '../../utils/mitjaOpac.js';
import { resolveAsset } from '../../data/backendPort.js';
import { atributsDEtiqueta, esFontDeFotoGeo, etiquetesDImatge } from '../../data/mapejadorSeccions.js';
import { esLlegible, llegixExifRemot } from '../multimedia/useMetadadesFoto.js';

/** Fotos del cos amb ubicació que es desen a l'índex d'una publicació, com a molt. */
export const MAX_FOTOS_GEO = 24;
/** El temps màxim de la lectura de l'EXIF del hero en publicar (mil·lisegons). */
export const TEMPS_HERO_MS = 4000;

/* La forma dels atributs del node SdpImage (la mateixa regla que en llegir-los). */
const FORMA_COORDENADA = /^-?\d{1,3}(?:\.\d{1,7})?$/;
const FORMA_CAPTURA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2})?$/;
const VALORS_PRECISIO = new Set(PRECISIONS.map((p) => p.valor));
const ENTITATS = Object.freeze({ '&amp;': '&', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&lt;': '<', '&gt;': '>' });
const desentitza = (text) => text.replace(/&(?:amp|quot|lt|gt|#39|#x27);/g, (e) => ENTITATS[e]);

/* Els atributs d'una etiqueta <img …>, en minúscules i amb les entitats
   desfetes; el primer de cada nom mana. Revisió adversarial 261028 · En una
   passada lineal, la mateixa del sanejador (mapejadorSeccions.js ·
   etiquetesDImatge i atributsDEtiqueta): abans /<img\b[^>]*>/g era
   quadràtica amb un cos sense '>'. */
function atributsDe(etiqueta) {
  return Object.fromEntries(Object.entries(atributsDEtiqueta(etiqueta)).map(([nom, valor]) => [nom, desentitza(valor)]));
}

/**
 * L'índex de les fotos del cos que porten ubicació (vegeu dalt), pur. Una
 * <img> hi entra si porta data-lat i data-lng amb la forma del node i unes
 * coordenades possibles, data-precisio de PRECISIONS i un src d'una foto de
 * l'índex (esFontDeFotoGeo, la regla del sanejador: pròpia i que qualsevol
 * lector pot obrir; cap data: ni el bucket privat); data-captura, si té la
 * forma ISO. Les coordenades es
 * tornen a arrodonir a la precisió que diuen (geolocalitzacio): un data-lat
 * més precís que la seua precisió no passa.
 */
export function fotosGeoDelCos(html) {
  if (typeof html !== 'string' || !html) return [];
  const fotos = [];
  const vistes = new Set();
  for (const etiqueta of etiquetesDImatge(html)) {
    if (fotos.length >= MAX_FOTOS_GEO) break;
    const a = atributsDe(etiqueta);
    const src = typeof a.src === 'string' ? a.src.trim() : '';
    if (!src || vistes.has(src) || !esFontDeFotoGeo(src)) continue;
    if (!FORMA_COORDENADA.test(a['data-lat'] || '') || !FORMA_COORDENADA.test(a['data-lng'] || '')) continue;
    if (!VALORS_PRECISIO.has(a['data-precisio'])) continue;
    const lat = Number(a['data-lat']);
    const lng = Number(a['data-lng']);
    if (!coordenadesValides(lat, lng)) continue;
    const geo = geolocalitzacio({ lat, lng, precisio: a['data-precisio'], origen: 'exif' });
    if (!geo) continue;
    vistes.add(src);
    fotos.push({
      src, lat: geo.lat, lng: geo.lng, precisio: geo.precisio, precisio_m: geo.precisio_m,
      dataCaptura: FORMA_CAPTURA.test(a['data-captura'] || '') ? a['data-captura'] : null,
    });
  }
  return fotos;
}

/**
 * La precisió que diuen unes coordenades ja llegides (sense el TIFF, com les
 * de llegixExifRemot): '100m' o 'poble' si les dues tenen com a molt els
 * decimals d'eixa precisió (la marca d'ajustaPrecisioGps), 'exacta' si no.
 * Una coordenada exacta d'una càmera amb tan pocs decimals en les dues és un
 * cas d'una entre milions.
 */
export function precisioDeCoordenades(gps) {
  if (!gps || !coordenadesValides(gps.lat, gps.lng)) return null;
  const cap = PRECISIONS.filter((p) => p.valor !== 'exacta').sort((a, b) => a.decimals - b.decimals)
    .find((p) => [gps.lat, gps.lng].every((v) => Math.abs(v * 10 ** p.decimals - Math.round(v * 10 ** p.decimals)) < 1e-6));
  return cap ? cap.valor : 'exacta';
}

/* Revisió adversarial 261028 (dades, 5) · La precisió d'una lectura remota:
   la marca del denominador si la lectura porta el bloc TIFF (llegixExifRemot
   amb ambTiff, quan el torna), i si no, la deduïda de les coordenades. Una foto
   '100m' a 38.590 té dos decimals «de veres» i la deducció en diria 'poble'
   (mai a l'inrevés: és la direcció segura). */
function precisioDeLaLecturaRemota(exif) {
  const tiff = exif?.tiff instanceof Uint8Array ? exif.tiff : null;
  return (tiff && precisioDeGps(tiff)) || precisioDeCoordenades(exif?.gps);
}

/* { geolocalitzacio?, dataCaptura? } d'una lectura d'EXIF i la seua precisió. */
function deLaLectura(exif, precisio) {
  const resultat = {};
  const gps = exif?.gps;
  if (gps && precisio) {
    const geo = geolocalitzacio({ lat: gps.lat, lng: gps.lng, precisio, origen: 'exif' });
    if (geo) resultat.geolocalitzacio = Number.isFinite(gps.altitud) ? { ...geo, altitud: gps.altitud } : geo;
  }
  if (typeof exif?.dataCaptura === 'string' && FORMA_CAPTURA.test(exif.dataCaptura)) resultat.dataCaptura = exif.dataCaptura;
  return resultat;
}

function bytesDeDataUrl(src) {
  const coma = src.indexOf(',');
  if (coma < 0 || !/^data:image\/[a-z+.-]+;base64$/i.test(src.slice(0, coma))) return null;
  try {
    return Uint8Array.from(atob(src.slice(coma + 1)), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/**
 * La ubicació i la data del hero (vegeu dalt): { geolocalitzacio?,
 * dataCaptura? }, mai rebutja. `resol` i `llegix` són injectables per a les
 * proves (el port de recursos i llegixExifRemot).
 */
export async function geoDelHero(src, { resol = resolveAsset, llegix = llegixExifRemot, temps = TEMPS_HERO_MS } = {}) {
  if (typeof src !== 'string' || !src) return {};
  try {
    if (src.startsWith('data:')) {
      const bytes = bytesDeDataUrl(src);
      if (!bytes) return {};
      return deLaLectura(llegixExif(bytes, { ambGps: true, ambData: true }), precisioDeGps(extreuTiff(bytes)));
    }
    const ref = fotoDelBucketPublic(src);
    if (!ref || typeof AbortController !== 'function') return {};
    const control = new AbortController();
    let rellotge = null;
    const limit = new Promise((resol) => { rellotge = setTimeout(() => { control.abort(); resol(null); }, temps); });
    const lectura = (async () => {
      const url = await resol(ref, { signal: control.signal });
      if (!esLlegible(url)) return null;
      return llegix(url, { signal: control.signal, temps, tempsPrefix: temps, ambGps: true, ambData: true, ambTiff: true });
    })().catch(() => null);
    try {
      const exif = await Promise.race([lectura, limit]);
      return exif ? deLaLectura(exif, precisioDeLaLecturaRemota(exif)) : {};
    } finally {
      clearTimeout(rellotge);
    }
  } catch {
    return {};
  }
}
