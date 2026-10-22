/**
 * fallbackBessones.js — si una bessona .webp no arriba, l'original (encàrrec
 * 261019_1425; pla: «fallback automàtic a la versió original»).
 *
 * Els paquets del directori i de l'autònom (D3) demanen la bessona en lloc de
 * l'original (assetResolver.js, política de mitjans). Les del paquet hi són
 * sempre (les tria el mateix build), però l'origen extern del directori pot
 * no tindre-les encara (un
 * desplegament a mitges, o un origen que torna una pàgina en lloc de la
 * imatge). Un sol escoltador en fase de captura sobre l'arrel (el shadow root
 * de <soc-de-poble>) veu l'error de qualsevol <img> de dins, també les de
 * l'HTML sanejat, que no poden portar onerror: torna a demanar, una sola
 * vegada, l'original al mateix lloc i atura l'error perquè el component no
 * amague la imatge mentrestant. Si l'original tampoc no arriba, el segon
 * error seguix el seu camí de sempre.
 * L'app nativa també demana la bessona (vite.natiu.config.js), però no hi
 * munta este recurs: ni hi ha <soc-de-poble> ni hi viatja l'original d'una
 * bessona.
 *
 * Pla 261022_1645 (tasca 3; àudio del Mestre 261022_1637: «el fallback és un
 * salvavides invisible per si de cas») · El web propi (main.jsx, socdepoble.org)
 * també el munta, sobre la seua arrel (#root). Allí no hi ha política segellada (el
 * contingut ja demana .webp directament: app_content), i per tant no se sap
 * quin era l'original: una .webp d'assets/ que no arriba es torna a demanar
 * al mateix camí amb les extensions dels originals de public/ (.jpg, .png i
 * .JPG), una darrere l'altra, i acabades, l'error seguix el seu camí. Amb
 * política, com sempre: l'original exacte, una vegada, i res més. Cada salt
 * deixa un avís a la consola (console.warn): una bessona que falta s'ha de
 * pujar, no amagar.
 */
import { hiHaPoliticaDeMitjans, recursOriginalDeBessona } from './assetResolver.js';

export const MARCA_FALLBACK = 'sdpBessona';
/** Les extensions dels originals de public/ (jpg 69, png 105, JPG 3 el 261022), per ordre de prova. */
export const EXTENSIONS_ORIGINALS = Object.freeze(['.jpg', '.png', '.JPG']);
/* Una bessona pròpia: un camí que passa per assets/ i acaba en .webp (abans de la consulta o el fragment). */
const BESSONA_PROPIA = /^(.*(?:^|\/)assets\/[^?#]*)\.webp([?#].*)?$/;

/* La pròxima adreça per a una imatge que no ha arribat, o '' si ja no n'hi ha. */
function seguentAdreca(img) {
  const marca = img.dataset[MARCA_FALLBACK];
  if (marca === 'original') return '';
  const src = img.currentSrc || img.getAttribute('src') || '';
  if (hiHaPoliticaDeMitjans()) {
    const original = marca ? '' : recursOriginalDeBessona(src);
    if (original) img.dataset[MARCA_FALLBACK] = 'original';
    return original;
  }
  /* Sense política: la base es fixa al primer error (la bessona), i la marca
     diu quantes extensions s'han provat. */
  if (!marca) {
    const peces = BESSONA_PROPIA.exec(src);
    if (!peces) return '';
    img.dataset.sdpBessonaBase = peces[1];
    img.dataset.sdpBessonaResta = peces[2] || '';
  }
  const provades = marca ? Number(marca) : 0;
  if (!(provades < EXTENSIONS_ORIGINALS.length)) {
    img.dataset[MARCA_FALLBACK] = 'original';
    return '';
  }
  img.dataset[MARCA_FALLBACK] = String(provades + 1);
  return `${img.dataset.sdpBessonaBase}${EXTENSIONS_ORIGINALS[provades]}${img.dataset.sdpBessonaResta}`;
}

/** Instal·la el recurs sobre `arrel` i torna la funció que el retira. */
export function instalaFallbackDeBessones(arrel) {
  if (!arrel || typeof arrel.addEventListener !== 'function') return () => {};
  const gestor = (event) => {
    const img = event.target;
    if (typeof HTMLImageElement === 'undefined' || !(img instanceof HTMLImageElement)) return;
    const abans = img.currentSrc || img.getAttribute('src') || '';
    const seguent = seguentAdreca(img);
    if (!seguent) return;
    event.stopPropagation();
    console.warn('[Bessones] No ha arribat', abans, '→ es prova', seguent);
    img.src = seguent;
  };
  arrel.addEventListener('error', gestor, true);
  return () => arrel.removeEventListener('error', gestor, true);
}
