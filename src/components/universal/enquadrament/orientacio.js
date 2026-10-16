/**
 * orientacio.js — Orientació EXIF del retallador (Onada 4, T3a; ADR
 * multimèdia §3.2).
 *
 * Els navegadors de la Baseline apliquen l'orientació EXIF en descodificar una
 * <img> (image-orientation: from-image de sèrie) [NO VERIFICAT per a cada
 * versió]: naturalWidth/naturalHeight i drawImage ja parlen de la foto dreta.
 * Si un navegador no ho fa, la foto es gira UNA vegada amb
 * transformacioOrientacio sobre un canvas (que ja no porta EXIF): mai dues.
 *
 * Gauntlet 261016 (P2 de Codex, 02:04:33) · Que ho faça amb un JPEG no diu
 * res del PNG ni del WebP: Chromium 151 posa dret un JPEG o un PNG amb
 * l'Orientation 6, però no un WebP. Per això la sonda i la seua resposta són
 * PER FORMAT, i el format és el dels bytes (exif.js), no el MIME. I la
 * decisió és UNA (orientacioPendent) i el dibuix també (dibuixaDreta), per al
 * retallador (carregaImatge, imatgeCanvas.js) i per a la pujada directa
 * (compressImage, imageUtils.js): cap altre camí no gira.
 *
 * La matemàtica és pura. La detecció toca el DOM, es fa una sola vegada per
 * format i sessió, i és injectable per a les proves.
 */
import { llegixOrientacioImatge } from './exif.js';

/** Sense poder-ho comprovar (jsdom, error, temps esgotat, un format sense sonda): el navegador ja l'aplica. */
export const ORIENTACIO_AUTOMATICA_PER_DEFECTE = true;
const TEMPS_SONDA_MS = 3000;
const FORMAT_JPEG = 'image/jpeg';

/* Les sondes de PNG i de WebP: 2 × 1 px negres amb l'Orientation 6 i res més
   (Pillow 12.2.0; WebP sense pèrdua amb VP8X i el bit E). No són fotos, i no
   depenen que el canvas sàpia CODIFICAR eixe format (Safari 16 no codifica
   WebP): el que es prova és com el DESCODIFICA. El JPEG, com sempre, el fa el
   canvas. Les estructures (CRC, RIFF, mides i orientació) les comprova
   orientacio.test.js. */
const SONDES = Object.freeze({
  'image/png': 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAAGmVYSWZNTQAqAAAACAABARIAAwAAAAEABgAAAAAAANZnS2kAAAALSURBVHicY2AAAwAABwABsoas9AAAAABJRU5ErkJggg==',
  'image/webp': 'UklGRk4AAABXRUJQVlA4WAoAAAAIAAAAAQAAAAAAVlA4TA4AAAAvAQAAAAcQEf0PRET/A0VYSUYaAAAATU0AKgAAAAgAAQESAAMAAAABAAYAAAAAAAA=',
});
/** Els formats que tenen sonda. Un altre (GIF, AVIF, HEIC…) no hereta la resposta de cap. */
const FORMATS_SONDA = new Set([FORMAT_JPEG, ...Object.keys(SONDES)]);

/**
 * Per a dibuixar una foto de amplada×alcada píxels guardats amb l'orientació
 * EXIF o: la mida del canvas (girada en 5 a 8) i la matriu [a, b, c, d, e, f]
 * de ctx.setTransform. Després, drawImage(foto, 0, 0) la deixa dreta.
 * Una orientació desconeguda es tracta com 1 (tal com està).
 */
export function transformacioOrientacio(orientacio, amplada, alcada) {
  const w = amplada;
  const h = alcada;
  switch (orientacio) {
    case 2: return { amplada: w, alcada: h, matriu: [-1, 0, 0, 1, w, 0] }; // espill horitzontal
    case 3: return { amplada: w, alcada: h, matriu: [-1, 0, 0, -1, w, h] }; // 180°
    case 4: return { amplada: w, alcada: h, matriu: [1, 0, 0, -1, 0, h] }; // espill vertical
    case 5: return { amplada: h, alcada: w, matriu: [0, 1, 1, 0, 0, 0] }; // transposició
    case 6: return { amplada: h, alcada: w, matriu: [0, 1, -1, 0, h, 0] }; // 90° en el sentit del rellotge
    case 7: return { amplada: h, alcada: w, matriu: [0, -1, -1, 0, h, w] }; // transversa
    case 8: return { amplada: h, alcada: w, matriu: [0, -1, 1, 0, 0, w] }; // 90° en contra del rellotge
    default: return { amplada: w, alcada: h, matriu: [1, 0, 0, 1, 0, 0] };
  }
}

/** On cau el punt (x, y) amb la matriu de setTransform (per a les proves i la depuració). */
export function aplicaMatriu([a, b, c, d, e, f], x, y) {
  return { x: a * x + c * y + e, y: b * x + d * y + f };
}

/** Un segment APP1 «Exif» mínim (big-endian) amb només l'orientació. */
export function segmentOrientacio(orientacio) {
  const bytes = new Uint8Array(36);
  const v = new DataView(bytes.buffer);
  v.setUint16(0, 0xffe1);
  v.setUint16(2, 34); // longitud del segment sense el marcador
  v.setUint32(4, 0x45786966); // «Exif»
  v.setUint16(8, 0);
  v.setUint16(10, 0x4d4d); // «MM»
  v.setUint16(12, 42);
  v.setUint32(14, 8); // IFD0 just després de la capçalera TIFF
  v.setUint16(18, 1); // una entrada
  v.setUint16(20, 0x0112);
  v.setUint16(22, 3); // SHORT
  v.setUint32(24, 1);
  v.setUint16(28, orientacio);
  v.setUint32(32, 0); // sense IFD següent
  return bytes;
}

function ambTemps(promesa, ms) {
  let rellotge;
  const esgotat = new Promise((resol) => { rellotge = setTimeout(() => resol(ORIENTACIO_AUTOMATICA_PER_DEFECTE), ms); });
  return Promise.race([promesa, esgotat]).finally(() => clearTimeout(rellotge));
}

/* Un JPEG de 2×1 fet pel mateix canvas, amb l'orientació 6 injectada; null
   si el canvas no el sap fer. Gauntlet 261016 · Amb toDataURL i no toBlob: és
   síncron, i un canvas sense codificador (jsdom) torna null en lloc de no
   cridar mai la resposta. Ara la pujada directa també espera esta sonda. */
function sondaJpeg() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 1;
  const ctx = canvas.getContext?.('2d');
  if (!ctx || typeof canvas.toDataURL !== 'function') return null;
  const url = canvas.toDataURL(FORMAT_JPEG);
  const coma = typeof url === 'string' ? url.indexOf(',') : -1;
  if (coma < 0 || !/^data:image\/jpeg;base64$/i.test(url.slice(0, coma))) return null;
  const bytes = Uint8Array.from(atob(url.slice(coma + 1)), (c) => c.charCodeAt(0));
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  return new Blob([bytes.subarray(0, 2), segmentOrientacio(6), bytes.subarray(2)], { type: FORMAT_JPEG });
}

/* Una imatge 2×1 del format demanat amb l'orientació 6: si el navegador la
   respecta en eixe format, la <img> fa 1×2. */
async function sondaNavegador(format) {
  if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof URL?.createObjectURL !== 'function') {
    return ORIENTACIO_AUTOMATICA_PER_DEFECTE;
  }
  const prova = format === FORMAT_JPEG
    ? sondaJpeg()
    : new Blob([Uint8Array.from(atob(SONDES[format]), (c) => c.charCodeAt(0))], { type: format });
  if (!prova) return ORIENTACIO_AUTOMATICA_PER_DEFECTE;
  const url = URL.createObjectURL(prova);
  try {
    const img = new Image();
    await new Promise((resol, rebutja) => {
      img.onload = resol;
      img.onerror = rebutja;
      img.src = url;
    });
    if (img.naturalWidth === 1 && img.naturalHeight === 2) return true;
    if (img.naturalWidth === 2 && img.naturalHeight === 1) return false;
    return ORIENTACIO_AUTOMATICA_PER_DEFECTE;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const memoria = new Map();

/**
 * Promise<boolean>: el navegador ja posa dreta una foto d'este `format` en
 * descodificar-la? Es calcula una vegada PER FORMAT i es guarda. Sense
 * `format`, el JPEG (com abans); un format sense sonda (o null: no se sap
 * quin és) torna el valor segur i no en pregunta ni en guarda res. `sonda`
 * (rep el format) i `refresca` són per a les proves. Mai rebutja.
 */
export function navegadorAplicaOrientacio({ format = FORMAT_JPEG, sonda = sondaNavegador, refresca = false } = {}) {
  const tipus = typeof format === 'string' ? format.trim().toLowerCase() : '';
  if (!FORMATS_SONDA.has(tipus)) return Promise.resolve(ORIENTACIO_AUTOMATICA_PER_DEFECTE);
  if (!memoria.has(tipus) || refresca) {
    memoria.set(tipus, ambTemps(Promise.resolve().then(() => sonda(tipus)), TEMPS_SONDA_MS)
      .then((v) => (typeof v === 'boolean' ? v : ORIENTACIO_AUTOMATICA_PER_DEFECTE), () => ORIENTACIO_AUTOMATICA_PER_DEFECTE));
  }
  return memoria.get(tipus);
}

const esOrientacioAGirar = (o) => Number.isInteger(o) && o >= 2 && o <= 8;

/**
 * Gauntlet 261016 (P2 de Codex) · La normalització ÚNICA de la
 * descodificació: l'orientació que encara falta aplicar als píxels que el
 * navegador ha descodificat de `blob`.
 *   · 1: res a fer. El fitxer no porta cap orientació a girar, no es pot
 *     llegir, no és un JPEG, un PNG ni un WebP, o el navegador ja la posa
 *     dreta en eixe format.
 *   · 2 a 8: s'ha de dibuixar UNA vegada amb dibuixaDreta.
 * Primer es llig el fitxer (el format pels bytes i l'orientació, en una sola
 * lectura) i, només si hi ha res a girar, es pregunta al navegador pel seu
 * format. La criden carregaImatge i compressImage. `orienta` (rep { format })
 * i `lligOrientacio` (torna { format, orientacio }) són injectables. Mai
 * rebutja.
 */
export async function orientacioPendent(blob, { orienta = navegadorAplicaOrientacio, lligOrientacio = llegixOrientacioImatge } = {}) {
  try {
    const { format = null, orientacio = null } = (await lligOrientacio(blob)) || {};
    if (!esOrientacioAGirar(orientacio)) return 1;
    return (await orienta({ format })) ? 1 : orientacio;
  } catch {
    return 1;
  }
}

/**
 * Dibuixa `font` (els píxels tal com es guarden) dreta i omplint un canvas de
 * amplada×alcada px, la mida DRETA (girada en 5 a 8): la transformació
 * d'`orientacio` una sola vegada i, després, la identitat. Amb 1 (o una
 * orientació desconeguda), un drawImage com sempre, sense cap setTransform.
 */
export function dibuixaDreta(ctx, font, orientacio, amplada, alcada) {
  if (!esOrientacioAGirar(orientacio)) {
    ctx.drawImage(font, 0, 0, amplada, alcada);
    return;
  }
  // La mida dels píxels guardats, a l'escala del canvas.
  const w = orientacio >= 5 ? alcada : amplada;
  const h = orientacio >= 5 ? amplada : alcada;
  ctx.setTransform(...transformacioOrientacio(orientacio, w, h).matriu);
  ctx.drawImage(font, 0, 0, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
