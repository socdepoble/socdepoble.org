/**
 * geolocalitzacio.js — Geolocalització voluntària d'una imatge (Onada 4, T3a;
 * ADR multimèdia D5, D6 i §3.3). Pur: es prova en Node.
 *
 * Les coordenades viatgen com a CAMPS al costat del fitxer, mai dins: el
 * fitxer que ix del retallador és un canvas nou, sense EXIF (D4). Abans de
 * desar, la persona tria la precisió i el que es guarda ja va arrodonit.
 */
import { coordenadesValides } from './exif.js';

/* La taula de precisions: per a canviar-ne una, n'hi ha prou amb la fila.
   decimals: els decimals de grau que es guarden (0,01° de latitud són uns
   1.100 m; 0,001°, uns 110 m). precisio_m: el que s'anota a la columna. */
export const PRECISIONS = Object.freeze([
  Object.freeze({ valor: 'exacta', etiqueta: 'Exacta', ajuda: 'El punt de la foto, a un metre.', decimals: 5, precisio_m: 1 }),
  Object.freeze({ valor: '100m', etiqueta: 'Uns 100 m', ajuda: 'Es veu el paratge, no el punt exacte.', decimals: 3, precisio_m: 100 }),
  Object.freeze({ valor: 'poble', etiqueta: 'Només el poble', ajuda: 'Un quilòmetre a la rodona: no s’endevina cap casa.', decimals: 2, precisio_m: 1000 }),
]);
/** Privacitat de sèrie (ADR §3.3): la més vaga. Qui vol el punt exacte el tria. */
export const PRECISIO_PER_DEFECTE = 'poble';

export const ERROR_LATITUD = 'Escriu una latitud entre -90 i 90 (per exemple, 38.5919).';
export const ERROR_LONGITUD = 'Escriu una longitud entre -180 i 180 (per exemple, -0.4184).';
export const ERROR_UBICACIO = 'Falta la ubicació: escriu la latitud i la longitud o desmarca «Vull geolocalitzar aquesta imatge».';

const precisioDe = (valor) => PRECISIONS.find((p) => p.valor === valor) || PRECISIONS.find((p) => p.valor === PRECISIO_PER_DEFECTE);

/** Text d'un camp → número de graus, o null. Accepta la coma decimal. */
export function llegixCoordenada(text) {
  const net = String(text ?? '').trim().replace(',', '.');
  if (!/^[+-]?\d{1,3}(\.\d+)?$/.test(net)) return null;
  const n = Number(net);
  return Number.isFinite(n) ? n : null;
}

/** L'error d'un camp (null si és vàlid o encara és buit). */
export function errorCoordenada(text, eix) {
  if (String(text ?? '').trim() === '') return null;
  const n = llegixCoordenada(text);
  const maxim = eix === 'lat' ? 90 : 180;
  if (n === null || Math.abs(n) > maxim) return eix === 'lat' ? ERROR_LATITUD : ERROR_LONGITUD;
  return null;
}

export function arrodonix(valor, decimals) {
  const k = 10 ** decimals;
  return Math.round(valor * k) / k;
}

/**
 * El que es desa: { lat, lng, precisio_m, origen } amb les coordenades ja
 * arrodonides a la precisió triada, o null si no són vàlides.
 */
export function geolocalitzacio({ lat, lng, precisio = PRECISIO_PER_DEFECTE, origen = 'manual' }) {
  if (!coordenadesValides(lat, lng)) return null;
  const p = precisioDe(precisio);
  const arrodonida = { lat: arrodonix(lat, p.decimals), lng: arrodonix(lng, p.decimals) };
  if (!coordenadesValides(arrodonida.lat, arrodonida.lng)) return null;
  return { ...arrodonida, precisio_m: p.precisio_m, origen: origen === 'exif' ? 'exif' : 'manual' };
}

/** «38.59, -0.42 (uns 1.000 m)»: el que es veurà desat, abans de desar-ho. */
export function textUbicacio(geo, precisio = PRECISIO_PER_DEFECTE) {
  if (!geo) return '';
  const p = precisioDe(precisio);
  // El punt dels milers a mà: el resultat no depén de l'ICU de l'entorn.
  const metres = String(p.precisio_m).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const abast = p.precisio_m <= 1 ? 'exacta' : `uns ${metres} m`;
  return `${geo.lat.toFixed(p.decimals)}, ${geo.lng.toFixed(p.decimals)} (${abast})`;
}
