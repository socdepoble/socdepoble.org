/**
 * ubicacioMitjaUI.js — Utilitat pura de la capa UI per a la geolocalització
 * per defecte (opt-out d'1 toc) de fotos i vídeos rurals al Xat (P0-126 / P0-125).
 *
 * Compatible tant amb `adjunt.ubicacio` servit per `adjuntLocal.js` com amb
 * l'extracció directa local des del `File`/`Blob` original abans de comprimir
 * (EXIF GPS en JPEG/PNG/WebP via `exif.js` i ISO-6709 `+DD.DDDD-DDD.DDDD/` en
 * caixes `udta`/`meta` d'MP4/MOV). Zero peticions de xarxa.
 */
import { llegixMetadadesImatge } from '../../components/universal/enquadrament/exif.js';

const MAX_VIDEO_SLICE = 512 * 1024;
const ISO_6709_RE = /([+-]\d{2}(?:\.\d{1,8})?)([+-]\d{3}(?:\.\d{1,8})?)(?:([+-]\d{1,5}(?:\.\d{1,4})?))?\//;

function numFinit(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Valida i normalitza un objecte de coordenades `{ lat, lng, altitud? }`.
 * Rebutja valors fora de rang geogràfic i el punt nul `(0, 0)`.
 */
export function normalitzaUbicacio(valor) {
  if (!valor || typeof valor !== 'object') return null;
  const lat = numFinit(valor.lat ?? valor.latitude);
  const lng = numFinit(valor.lng ?? valor.lon ?? valor.longitude);
  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return null;
  const alt = numFinit(valor.altitud ?? valor.alt ?? valor.altitude);
  return alt !== null
    ? { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), altitud: Number(alt.toFixed(1)) }
    : { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

export function ubicacioDePreparat(preparat) {
  if (!preparat || typeof preparat !== 'object') return null;
  return normalitzaUbicacio(preparat.ubicacio ?? preparat.metadades?.ubicacio ?? null);
}

export function ubicacioDeMissatge(missatge) {
  if (!missatge || typeof missatge !== 'object') return null;
  return normalitzaUbicacio(
    missatge.metadades?.ubicacio
    ?? missatge.metadades?.adjunt?.ubicacio
    ?? missatge.ubicacio
    ?? null
  );
}

export function formataCoordenadesCurtes(ubicacio) {
  const u = normalitzaUbicacio(ubicacio);
  if (!u) return '';
  return `${u.lat.toFixed(2)}°, ${u.lng.toFixed(2)}°`;
}

export function urlMapaUbicacio(ubicacio) {
  const u = normalitzaUbicacio(ubicacio);
  if (!u) return null;
  const lat = u.lat.toFixed(5);
  const lng = u.lng.toFixed(5);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

function lligIso6709DeBytes(bytes) {
  let ascii = '';
  for (let i = 0; i < bytes.length; i += 1) {
    const b = bytes[i];
    ascii += (b >= 0x20 && b <= 0x7e) ? String.fromCharCode(b) : ' ';
  }
  const m = ISO_6709_RE.exec(ascii);
  if (!m) return null;
  return normalitzaUbicacio({
    lat: Number(m[1]),
    lng: Number(m[2]),
    ...(m[3] ? { altitud: Number(m[3]) } : {})
  });
}

/**
 * Intenta rescatar coordenades GPS del fitxer original abans de comprimir.
 * Mai llança; si el fitxer no porta GPS o no es pot llegir, torna `null`.
 */
export async function extreuUbicacioFitxer(fitxer) {
  try {
    if (typeof Blob === 'undefined' || !(fitxer instanceof Blob) || !fitxer.size) return null;
    const tipus = String(fitxer.type || '').toLowerCase();
    if (/^image\/(jpeg|png|webp)$/.test(tipus)) {
      const meta = await llegixMetadadesImatge(fitxer, { ambGps: true, ambData: false, ambCamera: false });
      return normalitzaUbicacio(meta?.gps ?? null);
    }
    if (/^video\/(mp4|quicktime|webm)$/.test(tipus)) {
      const cap = new Uint8Array(await fitxer.slice(0, Math.min(fitxer.size, MAX_VIDEO_SLICE)).arrayBuffer());
      const deCap = lligIso6709DeBytes(cap);
      if (deCap) return deCap;
      if (fitxer.size > MAX_VIDEO_SLICE) {
        const iniciCua = Math.max(0, fitxer.size - MAX_VIDEO_SLICE);
        const cua = new Uint8Array(await fitxer.slice(iniciCua, fitxer.size).arrayBuffer());
        return lligIso6709DeBytes(cua);
      }
    }
    return null;
  } catch {
    return null;
  }
}
