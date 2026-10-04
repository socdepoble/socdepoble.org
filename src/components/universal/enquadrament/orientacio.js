/**
 * orientacio.js — Orientació EXIF del retallador (Onada 4, T3a; ADR
 * multimèdia §3.2).
 *
 * Els navegadors de la Baseline apliquen l'orientació EXIF en descodificar una
 * <img> (image-orientation: from-image de sèrie) [NO VERIFICAT per a cada
 * versió]: naturalWidth/naturalHeight i drawImage ja parlen de la foto dreta.
 * Si un navegador no ho fa, imatgeCanvas.js gira la foto UNA vegada amb
 * transformacioOrientacio sobre un canvas (que ja no porta EXIF): mai dues.
 *
 * La matemàtica és pura. La detecció toca el DOM, es fa una sola vegada per
 * sessió i és injectable per a les proves.
 */

/** Sense poder-ho comprovar (jsdom, error, temps esgotat): el navegador ja l'aplica. */
export const ORIENTACIO_AUTOMATICA_PER_DEFECTE = true;
const TEMPS_SONDA_MS = 3000;

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

/* Un JPEG de 2×1 fet pel mateix canvas, amb l'orientació 6 injectada: si el
   navegador la respecta, la <img> fa 1×2. Res d'imatges incrustades a mà. */
async function sondaNavegador() {
  if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof URL?.createObjectURL !== 'function') {
    return ORIENTACIO_AUTOMATICA_PER_DEFECTE;
  }
  const canvas = document.createElement('canvas');
  if (typeof canvas.toBlob !== 'function') return ORIENTACIO_AUTOMATICA_PER_DEFECTE;
  canvas.width = 2;
  canvas.height = 1;
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return ORIENTACIO_AUTOMATICA_PER_DEFECTE;
  const jpeg = await new Promise((resol) => canvas.toBlob(resol, 'image/jpeg'));
  if (!jpeg || jpeg.type !== 'image/jpeg' || typeof jpeg.arrayBuffer !== 'function') return ORIENTACIO_AUTOMATICA_PER_DEFECTE;
  const bytes = new Uint8Array(await jpeg.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return ORIENTACIO_AUTOMATICA_PER_DEFECTE;
  const prova = new Blob([bytes.subarray(0, 2), segmentOrientacio(6), bytes.subarray(2)], { type: 'image/jpeg' });
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

let memoria = null;

/**
 * Promise<boolean>: el navegador ja posa dreta la foto en descodificar-la?
 * Es calcula una vegada i es guarda. `sonda` i `refresca` són per a les proves.
 * Mai rebutja.
 */
export function navegadorAplicaOrientacio({ sonda = sondaNavegador, refresca = false } = {}) {
  if (!memoria || refresca) {
    memoria = ambTemps(Promise.resolve().then(sonda), TEMPS_SONDA_MS)
      .then((v) => (typeof v === 'boolean' ? v : ORIENTACIO_AUTOMATICA_PER_DEFECTE), () => ORIENTACIO_AUTOMATICA_PER_DEFECTE);
  }
  return memoria;
}
