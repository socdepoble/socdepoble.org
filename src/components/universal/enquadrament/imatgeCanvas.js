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
 */

const esBlob = (valor) => typeof Blob !== 'undefined' && valor instanceof Blob;

async function blobDe(font, signal) {
  if (esBlob(font)) return font;
  const resposta = await fetch(font, { mode: 'cors', credentials: 'omit', signal });
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

/**
 * Carrega la font i torna { element, amplada, alcada, tipus, allibera }.
 * `allibera()` revoca l'objectURL: el crida qui la carrega quan ja no la vol.
 */
export async function carregaImatge(font, { signal } = {}) {
  if (!esBlob(font) && (typeof font !== 'string' || !font)) {
    throw new TypeError('Cal un fitxer o una adreça d’imatge.');
  }
  const directe = typeof font === 'string' && /^blob:/i.test(font);
  const blob = directe ? null : await blobDe(font, signal);
  const url = directe ? font : URL.createObjectURL(blob);
  const allibera = directe ? () => {} : () => URL.revokeObjectURL(url);
  const element = new Image();
  element.decoding = 'async';
  try {
    await espera(element, url);
    if (signal?.aborted) throw new DOMException('Càrrega cancel·lada.', 'AbortError');
    const amplada = element.naturalWidth;
    const alcada = element.naturalHeight;
    if (!amplada || !alcada) throw new Error('La imatge no té mides.');
    return { element, amplada, alcada, tipus: blob?.type || '', allibera };
  } catch (err) {
    allibera();
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

/**
 * Exporta el retall a un File nou de amplada×alcada px. En JPEG, el fons és
 * blanc: la transparència no hi cap i, sense fons, eixiria negra.
 */
export async function exportaRetall(element, rect, { amplada, alcada, tipus = 'image/jpeg', qualitat = 0.92 } = {}) {
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
  const real = blob.type || tipus;
  return new File([blob], `enquadrament.${real === 'image/png' ? 'png' : 'jpg'}`, { type: real });
}
