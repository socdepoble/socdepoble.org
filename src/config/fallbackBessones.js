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
 * Sense política no s'instal·la res (Llei del Píxel).
 */
import { recursOriginalDeBessona } from './assetResolver.js';

export const MARCA_FALLBACK = 'sdpBessona';

/** Instal·la el recurs sobre `arrel` i torna la funció que el retira. */
export function instalaFallbackDeBessones(arrel) {
  if (!arrel || typeof arrel.addEventListener !== 'function') return () => {};
  const gestor = (event) => {
    const img = event.target;
    if (typeof HTMLImageElement === 'undefined' || !(img instanceof HTMLImageElement)) return;
    if (img.dataset[MARCA_FALLBACK] === 'original') return;
    const original = recursOriginalDeBessona(img.currentSrc || img.getAttribute('src') || '');
    if (!original) return;
    img.dataset[MARCA_FALLBACK] = 'original';
    event.stopPropagation();
    img.src = original;
  };
  arrel.addEventListener('error', gestor, true);
  return () => arrel.removeEventListener('error', gestor, true);
}
