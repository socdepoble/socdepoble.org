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
/**
 * P1-64 (Mestre 261028, decisió 8) · La d'una foto de PUBLICACIÓ (el hero i
 * les fotos del cos) quan la persona deixa marcada «Conserva la ubicació i la
 * data de la foto»: l'exacta, el que el fitxer ja publicava (mandat 261016:
 * fonts, arbres monumentals). La pot baixar a '100m' o 'poble' amb les
 * píndoles. La geolocalització manual continua amb PRECISIO_PER_DEFECTE.
 */
export const PRECISIO_PER_DEFECTE_PUBLICACIO = 'exacta';

/* P1-22 (assalt 261101) · Els textos que es veuen, en parells [clau,
   reserva]: la reserva és el valencià de sempre, lletra per lletra. Les
   funcions prenen un `t` opcional (el traductor de la interfície); sense, la
   reserva. PRECISIONS no canvia (la lligen geoDeLesFotos i puntsDelMapa): la
   versió traduïda és una còpia (precisionsTraduides). */
const tr = (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);
/* Un sol marcador, amb split i join: un «$&» del valor es pinta tal qual. */
const ompleUn = (plantilla, marcador, valor) => String(plantilla).split(`{${marcador}}`).join(String(valor));

export const PARELLS_PRECISIO = Object.freeze({
  exacta: Object.freeze({
    etiqueta: Object.freeze(['editor.enquadrament.precisioExacta', 'Exacta']),
    ajuda: Object.freeze(['editor.enquadrament.precisioExactaAjuda', 'El punt de la foto, a un metre.']),
  }),
  '100m': Object.freeze({
    etiqueta: Object.freeze(['editor.enquadrament.precisio100', 'Uns 100 m']),
    ajuda: Object.freeze(['editor.enquadrament.precisio100Ajuda', 'Es veu el paratge, no el punt exacte.']),
  }),
  poble: Object.freeze({
    etiqueta: Object.freeze(['editor.enquadrament.precisioPoble', 'Només el poble']),
    ajuda: Object.freeze(['editor.enquadrament.precisioPobleAjuda', 'Un quilòmetre a la rodona: no s’endevina cap casa.']),
  }),
});

/** La casella del diàleg (UbicacioImatge); l'avís de desar-la sense punt la nomena. */
export const PARELL_CASELLA_GEO = Object.freeze(['editor.enquadrament.geoCasella', 'Vull geolocalitzar aquesta imatge']);
const PARELL_LATITUD = Object.freeze(['editor.enquadrament.errorLatitud', 'Escriu una latitud entre -90 i 90 (per exemple, 38.5919).']);
const PARELL_LONGITUD = Object.freeze(['editor.enquadrament.errorLongitud', 'Escriu una longitud entre -180 i 180 (per exemple, -0.4184).']);
const PARELL_UBICACIO = Object.freeze(['editor.enquadrament.errorUbicacio', 'Falta la ubicació: escriu la latitud i la longitud o desmarca «{casella}».']);
const PARELL_ABAST_EXACTA = Object.freeze(['editor.enquadrament.abastExacta', 'exacta']);
const PARELL_ABAST_METRES = Object.freeze(['editor.enquadrament.abastMetres', 'uns {m} m']);
/* El separador dels milers dels metres: «1.000» en valencià i «1,000» en anglés. */
const PARELL_MILERS = Object.freeze(['editor.enquadrament.separadorMilers', '.']);

export const ERROR_LATITUD = PARELL_LATITUD[1];
export const ERROR_LONGITUD = PARELL_LONGITUD[1];
export const ERROR_UBICACIO = ompleUn(PARELL_UBICACIO[1], 'casella', PARELL_CASELLA_GEO[1]);

const precisioDe = (valor) => PRECISIONS.find((p) => p.valor === valor) || PRECISIONS.find((p) => p.valor === PRECISIO_PER_DEFECTE);

/**
 * PRECISIONS amb l'etiqueta i l'ajuda en la llengua de `t` (una còpia: la
 * taula no es toca). Sense traductor, la mateixa taula.
 */
export function precisionsTraduides(t) {
  if (typeof t !== 'function') return PRECISIONS;
  return Object.freeze(PRECISIONS.map((p) => {
    if (!Object.hasOwn(PARELLS_PRECISIO, p.valor)) return p;
    const parells = PARELLS_PRECISIO[p.valor];
    return Object.freeze({ ...p, etiqueta: tr(t, parells.etiqueta), ajuda: tr(t, parells.ajuda) });
  }));
}

/** L'avís de desar amb la casella marcada i sense punt, amb el nom de la casella que es veu. */
export function errorUbicacio(t) {
  return ompleUn(tr(t, PARELL_UBICACIO), 'casella', tr(t, PARELL_CASELLA_GEO));
}

/** Text d'un camp → número de graus, o null. Accepta la coma decimal. */
export function llegixCoordenada(text) {
  const net = String(text ?? '').trim().replace(',', '.');
  if (!/^[+-]?\d{1,3}(\.\d+)?$/.test(net)) return null;
  const n = Number(net);
  return Number.isFinite(n) ? n : null;
}

/** L'error d'un camp (null si és vàlid o encara és buit). `t`: el traductor, opcional. */
export function errorCoordenada(text, eix, t) {
  if (String(text ?? '').trim() === '') return null;
  const n = llegixCoordenada(text);
  const maxim = eix === 'lat' ? 90 : 180;
  if (n === null || Math.abs(n) > maxim) return tr(t, eix === 'lat' ? PARELL_LATITUD : PARELL_LONGITUD);
  return null;
}

export function arrodonix(valor, decimals) {
  const k = 10 ** decimals;
  return Math.round(valor * k) / k;
}

/**
 * El que es desa: { lat, lng, precisio, precisio_m, origen } amb les
 * coordenades ja arrodonides a la precisió triada, o null si no són vàlides.
 * P1-64 (pla 261028_1526 §3.1.1) · `precisio` és el valor de PRECISIONS que
 * s'ha aplicat (el contracte del Mapa: 'exacta' | '100m' | 'poble').
 */
export function geolocalitzacio({ lat, lng, precisio = PRECISIO_PER_DEFECTE, origen = 'manual' }) {
  if (!coordenadesValides(lat, lng)) return null;
  const p = precisioDe(precisio);
  const arrodonida = { lat: arrodonix(lat, p.decimals), lng: arrodonix(lng, p.decimals) };
  if (!coordenadesValides(arrodonida.lat, arrodonida.lng)) return null;
  return { ...arrodonida, precisio: p.valor, precisio_m: p.precisio_m, origen: origen === 'exif' ? 'exif' : 'manual' };
}

/**
 * «38.59, -0.42 (uns 1.000 m)»: el que es veurà desat, abans de desar-ho.
 * `t` (opcional) tradueix l'abast i el separador dels milers; les
 * coordenades van sempre amb el punt decimal.
 */
export function textUbicacio(geo, precisio = PRECISIO_PER_DEFECTE, t) {
  if (!geo) return '';
  const p = precisioDe(precisio);
  // El separador dels milers a mà: el resultat no depén de l'ICU de l'entorn.
  const separador = tr(t, PARELL_MILERS);
  const metres = String(p.precisio_m).replace(/\B(?=(\d{3})+(?!\d))/g, () => separador);
  const abast = p.precisio_m <= 1 ? tr(t, PARELL_ABAST_EXACTA) : ompleUn(tr(t, PARELL_ABAST_METRES), 'm', metres);
  return `${geo.lat.toFixed(p.decimals)}, ${geo.lng.toFixed(p.decimals)} (${abast})`;
}
