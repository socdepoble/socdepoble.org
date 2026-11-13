/**
 * fallbackBessones.js — si una bessona .webp no arriba, l'original (encàrrec
 * 261019_1425; pla: «fallback automàtic a la versió original»).
 *
 * Amb política de mitjans segellada (connector WordPress / autònom), consulta
 * el parell exacte de la política (`recursOriginalDeBessona`) i fa un sol salt.
 *
 * Sense política (el web propi, `socdepoble.org` / `main.jsx`), Onada R21.7
 * elimina la cascada cega `.jpg → .png → .JPG` i consulta el cens exacte
 * `MAPA_BESSONES_PUBLIC` (`public/assets/`):
 *   · Si la `.webp` té un original ràster real en disc (ex. `towns/tibi/1.jpg`),
 *     demana una única vegada eixa extensió exacta i mai `.png` o `.JPG` falsos.
 *   · Si la `.webp` és autònoma sense bessona ràster (ex. `xat_portada.webp`,
 *     `que-dinem/` o `arbres-2020/`), no dispara cap petició 404 inventada.
 *
 * Onada R22 · BOOT3 · Dos instal·ladors sobre el mateix gestor:
 *   · instalaFallbackDeBessones (main.jsx, el web propi): la política si n'hi
 *     ha i, si no, el cens. És l'únic que llig `MAPA_BESSONES_PUBLIC`.
 *   · instalaFallbackDeLaPolitica (PedraSecaEmbed.jsx, el paquet): només el
 *     parell exacte de la política. L'embed només l'instal·la quan hi ha
 *     política, i la política és la segellada al build (assetResolver.js),
 *     que cap codi de producció no retira: la branca del cens no s'hi
 *     executava mai. Sense cap referència al cens, Rollup el deixa fora del
 *     paquet, i l'arrencada estàtica s'estalvia uns 12 kB minificats.
 */
import { hiHaPoliticaDeMitjans, recursOriginalDeBessona } from './assetResolver.js';
import { extensioOriginalPublica } from './mapaBessonesPublic.js';

export const MARCA_FALLBACK = 'sdpBessona';
/** Extensions històriques dels originals ràster del repositori. */
export const EXTENSIONS_ORIGINALS = Object.freeze(['.jpg', '.png', '.JPG']);
/* Una bessona pròpia: prefix opcional + camí `assets/...` acabat en `.webp` + consulta/fragment opcional. */
const BESSONA_PROPIA = /^(.*?(?:^|\/))(assets\/[^?#]*)\.webp([?#].*)?$/;

function descodificaSegur(cami) {
  try {
    return decodeURIComponent(cami);
  } catch {
    return cami;
  }
}

/* La pròxima adreça per a una imatge que no ha arribat, o '' si ja no n'hi ha.
   `extensioSensePolitica` és la consulta del cens del web propi, o null. */
function seguentAdreca(img, extensioSensePolitica) {
  const marca = img.dataset[MARCA_FALLBACK];
  if (marca) return '';
  const src = img.currentSrc || img.getAttribute('src') || '';
  if (hiHaPoliticaDeMitjans()) {
    const original = recursOriginalDeBessona(src);
    if (original) img.dataset[MARCA_FALLBACK] = 'original';
    return original;
  }
  if (!extensioSensePolitica) return '';
  const peces = BESSONA_PROPIA.exec(src);
  if (!peces) return '';
  const [, prefix, tronc, resta = ''] = peces;
  const relWebp = `${tronc}.webp`;
  const ext = extensioSensePolitica(relWebp) || extensioSensePolitica(descodificaSegur(relWebp));
  if (!ext) return '';
  img.dataset[MARCA_FALLBACK] = 'original';
  return `${prefix}${tronc}${ext}${resta}`;
}

function instala(arrel, extensioSensePolitica) {
  if (!arrel || typeof arrel.addEventListener !== 'function') return () => {};
  const gestor = (event) => {
    const img = event.target;
    if (typeof HTMLImageElement === 'undefined' || !(img instanceof HTMLImageElement)) return;
    const abans = img.currentSrc || img.getAttribute('src') || '';
    const seguent = seguentAdreca(img, extensioSensePolitica);
    if (!seguent) return;
    event.stopPropagation();
    console.warn('[Bessones] No ha arribat', abans, '→ es prova', seguent);
    img.src = seguent;
  };
  arrel.addEventListener('error', gestor, true);
  return () => arrel.removeEventListener('error', gestor, true);
}

/** Instal·la el recurs sobre `arrel` i torna la funció que el retira: la política i, sense política, el cens del web propi. */
export function instalaFallbackDeBessones(arrel) {
  return instala(arrel, extensioOriginalPublica);
}

/** El del paquet: només el parell exacte de la política vigent; sense política no toca cap imatge. Torna la funció que el retira. */
export function instalaFallbackDeLaPolitica(arrel) {
  return instala(arrel, null);
}
