/**
 * exifAmbUbicacio.js — v1.2.23 · IDEA-331 (ordre del Mestre 261123) · D-V1223-GEOLOC-PER-DEFECTE.
 *
 * Al xat, el contingut conserva per defecte la ubicació DINS del fitxer, i la persona ho veu abans de publicar
 * (ControlsAdjunt.jsx). Este mòdul és el tros diferit d'eixa decisió: només el demanen, amb import() dinàmic, la
 * preparació d'un adjunt (adjuntLocal.js) i la comprovació de bytes del transport (supabase/xatMultimedia.js). Així
 * exifIncrustat.js, que arriba a l'arrencada per imageUtils.js, només hi suma la tria del GPS (preparaTiffAmbUbicacio).
 *
 *   · imatgeAmbUbicacio: el mateix contenidor net que imatgeSenseUbicacio (netejaMetadades, cap píxel recodificat),
 *     però amb l'EXIF blanc que porta el GPS. És el punt fix que preparaAdjunt puja i que el transport torna a
 *     calcular; null vol dir format, estructura o mida no acreditable (el transport el veta).
 *   · tiffDeCoordenades: el rescat del lloc. Si l'original no porta un bloc que es puga conservar (una HEIC que el
 *     navegador descodifica, un EXIF que analitzaTiff no entén) però la inspecció prèvia (ubicacioMitjans.js) n'ha
 *     llegit { lat, lng, altitud } ABANS de comprimir, el GPS IFD es fa de nou amb eixes coordenades: la
 *     recompressió no el perd. Graus i minuts sencers i segons en milionèsimes (RATIONAL), l'altitud en centímetres
 *     amb la seua referència (0 damunt, 1 davall del nivell de la mar). En MM, passat per preparaTiffAmbUbicacio (el
 *     mateix bloc canònic que tornarà a calcular el transport); null si les coordenades no valen. Mai llança.
 *
 * Pur: sense DOM ni xarxa (es prova en Node amb bytes sintètics).
 */
import { extreuTiff, incrustaEnJpeg, incrustaEnWebp, preparaTiffAmbUbicacio } from './exifIncrustat.js';
import { FORMAT_JPEG, FORMAT_WEBP, netejaMetadades } from './netejaMetadades.js';

const TAG_GPS_IFD = 0x8825;
const TIPUS_BYTE = 1;
const TIPUS_ASCII = 2;
const TIPUS_LONG = 4;
const TIPUS_RATIONAL = 5;
/* Les etiquetes del GPS IFD que es tornen a escriure: versió, referències, latitud, longitud i altitud. */
const GPS = Object.freeze({ versio: 0, refLat: 1, lat: 2, refLng: 3, lng: 4, refAlt: 5, alt: 6 });
const MILIONESIMES = 1_000_000;
const SEGONS_PER_GRAU = 3600 * MILIONESIMES;

/** El contenidor net amb l'EXIF blanc i el GPS de l'entrada, o null si no és acreditable. No recodifica píxels. */
export function imatgeAmbUbicacio(entrada) {
  const net = netejaMetadades(entrada);
  if (!net || ![FORMAT_JPEG, FORMAT_WEBP].includes(net.format)) return null;
  const tiff = preparaTiffAmbUbicacio(extreuTiff(entrada));
  if (!tiff) return net;
  const bytes = (net.format === FORMAT_JPEG ? incrustaEnJpeg : incrustaEnWebp)(net.bytes, tiff) ?? net.bytes;
  return { ...net, bytes };
}

/* Graus, minuts i segons d'una coordenada, sense signe (la referència el porta). */
function grausMinutsSegons(valor) {
  const total = Math.round(Math.abs(valor) * SEGONS_PER_GRAU);
  const graus = Math.floor(total / SEGONS_PER_GRAU);
  const minuts = Math.floor((total - graus * SEGONS_PER_GRAU) / (60 * MILIONESIMES));
  return [[graus, 1], [minuts, 1], [total - graus * SEGONS_PER_GRAU - minuts * 60 * MILIONESIMES, MILIONESIMES]];
}

/** El bloc TIFF canònic amb només el GPS de { lat, lng, altitud }, o null. */
export function tiffDeCoordenades(coordenades) {
  try {
    const lat = coordenades?.lat, lng = coordenades?.lng, altitud = coordenades?.altitud;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    const ambAltitud = Number.isFinite(altitud) && Math.round(Math.abs(altitud) * 100) <= 0xffffffff;
    const entrades = [
      { tag: GPS.versio, tipus: TIPUS_BYTE, valors: [2, 3, 0, 0] },
      { tag: GPS.refLat, tipus: TIPUS_ASCII, valors: [lat < 0 ? 0x53 : 0x4e, 0] }, // «S» o «N»
      { tag: GPS.lat, tipus: TIPUS_RATIONAL, valors: grausMinutsSegons(lat) },
      { tag: GPS.refLng, tipus: TIPUS_ASCII, valors: [lng < 0 ? 0x57 : 0x45, 0] }, // «W» o «E»
      { tag: GPS.lng, tipus: TIPUS_RATIONAL, valors: grausMinutsSegons(lng) },
      ...(ambAltitud ? [
        { tag: GPS.refAlt, tipus: TIPUS_BYTE, valors: [altitud < 0 ? 1 : 0] },
        { tag: GPS.alt, tipus: TIPUS_RATIONAL, valors: [[Math.round(Math.abs(altitud) * 100), 100]] },
      ] : []),
    ];
    // Capçalera (8), IFD0 amb el punter al GPS IFD (2 + 12 + 4), i el GPS IFD amb els seus valors de més de 4 bytes.
    const iniciGps = 8 + 2 + 12 + 4;
    let dades = iniciGps + 2 + entrades.length * 12 + 4;
    const mida = dades + entrades.reduce((n, e) => n + (e.tipus === TIPUS_RATIONAL ? e.valors.length * 8 : 0), 0);
    const r = new Uint8Array(mida);
    const w = new DataView(r.buffer);
    w.setUint16(0, 0x4d4d); w.setUint16(2, 42); w.setUint32(4, 8);
    w.setUint16(8, 1); w.setUint16(10, TAG_GPS_IFD); w.setUint16(12, TIPUS_LONG); w.setUint32(14, 1); w.setUint32(18, iniciGps);
    w.setUint16(iniciGps, entrades.length);
    entrades.forEach((e, k) => {
      const q = iniciGps + 2 + k * 12;
      w.setUint16(q, e.tag); w.setUint16(q + 2, e.tipus); w.setUint32(q + 4, e.valors.length);
      if (e.tipus !== TIPUS_RATIONAL) { e.valors.forEach((v, i) => { r[q + 8 + i] = v; }); return; }
      w.setUint32(q + 8, dades);
      e.valors.forEach(([num, den]) => { w.setUint32(dades, num); w.setUint32(dades + 4, den); dades += 8; });
    });
    return preparaTiffAmbUbicacio(r);
  } catch {
    return null;
  }
}
