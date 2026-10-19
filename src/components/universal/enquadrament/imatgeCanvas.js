/**
 * imatgeCanvas.js — L'ÚNICA frontera del re-enquadrament amb el navegador.
 * T46 (ordre del Mestre, 260928). Res s'executa en importar el mòdul.
 *
 * El canvas no queda mai «tacat»: sempre es dibuixa un blob: propi.
 *   · File o Blob (foto nova)        → URL.createObjectURL, sense fetch.
 *   · URL ja resolta (foto existent) → fetch cors → blob → objectURL. Si el
 *     servidor no permet CORS, l'error salta ací i el diàleg el mostra.
 *   · blob: de la mateixa pàgina     → directe (la CSP no en deixa fer fetch
 *     i no taca el canvas).
 *
 * Onada 4, T3a (RETALLADOR §2) · Límits d'entrada (limits.js), orientació
 * EXIF aplicada UNA vegada (orientacio.js) i eixida WebP amb reserva JPEG. El
 * fitxer que ix és sempre un canvas nou: no porta cap EXIF (ADR D4).
 * Gauntlet 261016 (Bloc 1.2) · Continua així: si la persona conserva la
 * ubicació i la data (la casella del DialegEnquadrament), l'EXIF publicable
 * de l'original el torna a posar la compressió de la pujada (compressImage
 * amb conservaExif, exifIncrustat.js), no este retall.
 * Gauntlet 261016 (P2 de Codex, 02:04:33) · Si el navegador posa dreta la
 * foto es decidix PEL FORMAT dels bytes (un WebP no és un JPEG), amb la
 * mateixa decisió i el mateix dibuix que la pujada directa (orientacioPendent
 * i dibuixaDreta, orientacio.js): el retall ix sempre d'un raster ja dret, i
 * l'EXIF que hi torna la pujada porta l'orientació 1.
 */
import { esFontImatgePropia } from '../../../utils/sanitize.js';
import { llegixOrientacioImatge } from './exif.js';
import { ErrorImatge, comprovaDimensions, comprovaPes, esHeic } from './limits.js';
import {
  dibuixaDreta, navegadorAplicaOrientacio, orientacioPendent, transformacioOrientacio,
} from './orientacio.js';

const esBlob = (valor) => typeof Blob !== 'undefined' && valor instanceof Blob;
const cancellada = () => new DOMException('Càrrega cancel·lada.', 'AbortError');

/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2; correcció de la
   revisió, «sense referent») · Re-enquadrar la foto que ja hi ha pot demanar
   una adreça de fora (la foto del compte de Google de la sessió): com
   AvatarDeCapcalera i Miniatura, que la pinten sense referent, es demana sense
   referent (referrerPolicy 'no-referrer'). Una font pròpia (esFontImatgePropia:
   un camí de casa, el nostre servidor de fitxers) es demana com sempre. */
async function blobDe(font, signal) {
  if (esBlob(font)) return font;
  const peticio = { mode: 'cors', credentials: 'omit', signal };
  if (!esFontImatgePropia(font)) peticio.referrerPolicy = 'no-referrer';
  const resposta = await fetch(font, peticio);
  if (!resposta.ok) throw new Error(`No s'ha pogut descarregar la imatge (${resposta.status}).`);
  return resposta.blob();
}

/* onload/onerror abans que decode(): Safari ha tingut decode() que rebutja
   imatges grans vàlides. */
function espera(element, url) {
  return new Promise((resol, rebutja) => {
    element.onload = () => resol();
    element.onerror = () => rebutja(new Error('El navegador no pot obrir esta imatge.'));
    element.src = url;
  });
}

/* Si el navegador NO posa dreta la foto en descodificar-la (en el seu
   format: orientacioPendent), es gira una sola vegada sobre un canvas de la
   mida girada, i el canvas passa a ser la font del visor i de l'exportació
   (un canvas no porta EXIF: ningú la tornarà a girar). Si el navegador ja
   l'ha posada dreta, o no hi ha res a girar, no es fa res. */
async function giraSiCal(element, blob, { orienta, lligOrientacio }) {
  const orientacio = await orientacioPendent(blob, { orienta, lligOrientacio });
  if (orientacio === 1) return null;
  const t = transformacioOrientacio(orientacio, element.naturalWidth, element.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = t.amplada;
  canvas.height = t.alcada;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  dibuixaDreta(ctx, element, orientacio, t.amplada, t.alcada);
  return { element: canvas, amplada: t.amplada, alcada: t.alcada };
}

/**
 * Carrega la font i torna { element, amplada, alcada, tipus, blob, allibera }.
 * `allibera()` revoca l'objectURL: el crida qui la carrega quan ja no la vol.
 * Gauntlet 261016 (Bloc B, P2) · `blob` és el que s'ha obert (el File, o el
 * que s'ha baixat d'una adreça ja desada; null per a un blob: directe): el
 * DialegEnquadrament en llig l'EXIF, i la pujada el rep com a `original`.
 * Llança ErrorImatge('pes' | 'pixels' | 'heic') quan la foto passa dels
 * límits o és un HEIC que el navegador no sap obrir.
 * `orienta` (rep { format }) i `lligOrientacio` (torna { format, orientacio })
 * són injectables per a les proves.
 */
export async function carregaImatge(font, { signal, orienta = navegadorAplicaOrientacio, lligOrientacio = llegixOrientacioImatge } = {}) {
  if (!esBlob(font) && (typeof font !== 'string' || !font)) {
    throw new TypeError('Cal un fitxer o una adreça d’imatge.');
  }
  const directe = typeof font === 'string' && /^blob:/i.test(font);
  const blob = directe ? null : await blobDe(font, signal);
  if (blob && comprovaPes(blob)) throw new ErrorImatge('pes');
  const url = directe ? font : URL.createObjectURL(blob);
  const revoca = directe ? () => {} : () => URL.revokeObjectURL(url);
  const element = new Image();
  element.decoding = 'async';
  try {
    try {
      await espera(element, url);
    } catch (err) {
      throw esHeic(blob) ? new ErrorImatge('heic') : err;
    }
    if (signal?.aborted) throw cancellada();
    const amplada = element.naturalWidth;
    const alcada = element.naturalHeight;
    if (!amplada || !alcada) throw new Error('La imatge no té mides.');
    if (comprovaDimensions(amplada, alcada)) throw new ErrorImatge('pixels');
    const girada = blob ? await giraSiCal(element, blob, { orienta, lligOrientacio }) : null;
    if (girada) {
      const allibera = () => {
        revoca();
        girada.element.width = 0;
        girada.element.height = 0;
      };
      if (signal?.aborted) {
        allibera();
        throw cancellada();
      }
      return { ...girada, tipus: blob.type || '', blob, allibera };
    }
    if (signal?.aborted) throw cancellada();
    return { element, amplada, alcada, tipus: blob?.type || '', blob, allibera: revoca };
  } catch (err) {
    revoca();
    throw err;
  }
}

/** Pinta el retall `rect` omplint el <canvas> del visor. Sense context 2D (jsdom), no fa res. */
export function dibuixaVisor(canvas, element, rect) {
  const ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx || !element || !rect) return false;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(element, rect.x, rect.y, rect.w, rect.h, 0, 0, canvas.width, canvas.height);
  return true;
}

const EXTENSIONS = { 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' };

/* Un canvas nou, el retall i toBlob: l'ÚNIC camí d'eixida. En JPEG, el fons
   és blanc: la transparència no hi cap i, sense fons, eixiria negra. */
async function codifica(element, rect, amplada, alcada, tipus, qualitat) {
  const canvas = document.createElement('canvas');
  canvas.width = amplada;
  canvas.height = alcada;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no ha pogut preparar la imatge enquadrada.');
  if (tipus === 'image/jpeg') {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, amplada, alcada);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(element, rect.x, rect.y, rect.w, rect.h, 0, 0, amplada, alcada);
  const blob = await new Promise((resol) => canvas.toBlob(resol, tipus, qualitat));
  if (!blob) throw new Error('El navegador no ha pogut preparar la imatge enquadrada.');
  return blob;
}

/**
 * Exporta el retall a un File nou de amplada×alcada px. Si es demana WebP i
 * el navegador no el sap codificar (toBlob torna un altre tipus, com Safari
 * [NO VERIFICAT per a la versió exacta]), es torna a codificar en JPEG.
 */
export async function exportaRetall(element, rect, { amplada, alcada, tipus = 'image/jpeg', qualitat = 0.92 } = {}) {
  let blob = await codifica(element, rect, amplada, alcada, tipus, qualitat);
  if (tipus === 'image/webp' && blob.type !== 'image/webp') {
    blob = await codifica(element, rect, amplada, alcada, 'image/jpeg', qualitat);
  }
  const real = blob.type || (tipus === 'image/webp' ? 'image/jpeg' : tipus);
  return new File([blob], `enquadrament.${EXTENSIONS[real] || 'jpg'}`, { type: real });
}
