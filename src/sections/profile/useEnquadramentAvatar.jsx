import { useEnquadramentImatge } from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { FORMATS, MIDA_SORTIDA, tipusDeSortida } from '../../components/universal/enquadrament/enquadrament.js';
import { PES_MAXIM_ENTRADA } from '../../components/universal/enquadrament/limits.js';
import { validaFitxerImatge } from '../../hooks/useHeroImageHandler.js';

/** L'avatar només té una forma: el quadrat. */
export const FORMAT_AVATAR = '1:1';

/* Onada 4 · revisió adversarial (K2) · Una foto nova s'admet fins al límit
   d'ENTRADA del retallador (25 MB, limits.js): una foto de mòbil de 6-8 MB ha
   d'arribar-hi. El que puja és el que ix del retallador, i això continua
   passant pel límit de sempre (5 MB) a la pujada de cada lloc. */
export const PES_MAXIM_FOTO_AVATAR = PES_MAXIM_ENTRADA;

/* Onada 4 · revisió adversarial (K2, K3) · Una foto nova (File) ix SEMPRE
   recodificada del retallador, també quan es desa sencera: mai l'original,
   que pot pesar 25 MB i portar l'EXIF (ADR D4). Mateix tipus i mateixa mida
   que el camí T46 (JPEG o PNG, fins a 1.200 px; el PNG conserva la
   transparència d'un logotip). Una adreça ja resolta no canvia (T46). */
export function sortidaAvatar(font) {
  if (typeof Blob === 'undefined' || !(font instanceof Blob)) return null;
  return { ampladaMaxima: MIDA_SORTIDA, format: tipusDeSortida(font.type) };
}

/* La fila del quadrat és la del model (enquadrament.js); només canvia
   l'ajuda, que allí parla de la capçalera i de la targeta del Mur. */
const QUADRAT = FORMATS.find((f) => f.valor === FORMAT_AVATAR) || { valor: FORMAT_AVATAR, etiqueta: 'Quadrat (1:1)', ratio: 1 };
export const FORMATS_AVATAR = Object.freeze([
  Object.freeze({
    ...QUADRAT,
    ajuda: 'L’avatar sempre és quadrat: és la forma amb què acompanya el nom a la barra taronja, al Xat i a les targetes.',
  }),
]);

export const TITOL_ENQUADRAMENT_AVATAR = 'Enquadrar l’avatar';
export const DESCRIPCIO_ENQUADRAMENT_AVATAR = 'Mou la foto i amplia-la fins que la cara quede dins del quadrat. Només es guarda el que hi ha dins.';

/**
 * useEnquadramentAvatar — Onada 4, T3 (RETALLADOR.txt §3, AV.txt §8). Tot lloc
 * on una persona posa el seu avatar passa per ací: una foto nova s'obri en
 * DialegEnquadrament amb una sola forma, el quadrat, i ix ja retallada (el
 * retall es «cou» dins de l'arxiu: D1 i D2 de l'ADR multimèdia).
 *
 * Privacitat de sèrie: un avatar no oferix mai geolocalitzar la foto. Una
 * foto nova ix sempre recodificada del retallador (sortidaAvatar), i després
 * la compressió de sempre la torna a codificar amb el canvas: el fitxer que
 * puja no porta l'EXIF de l'original (ADR D4).
 *
 * CONTRACTE
 *   onEnquadrat(fitxer, info) → Promise: rep el File ja retallat i el puja pel
 *     camí de cada lloc. Si acaba bé, el retallador es tanca. Si llança, el
 *     missatge ix dins del retallador i este continua obert (l'avís de fora,
 *     toast o línia del formulari, el posa qui puja: el modal el tapa).
 *   onError(missatge) · la foto triada no es pot processar (la validació de
 *     la closca, validaFitxerImatge, amb el límit d'entrada del retallador):
 *     no s'obri res.
 *   Torna { obri(font) → boolean, obert, dialeg }. `font` és un File o una
 *   adreça ja resolta (l'espècimen del catàleg). `dialeg` es pinta on calga.
 *   Cancel·lar no puja res, i el focus torna a qui l'ha obert
 *   (DialegEnquadrament el captura en obrir-se).
 *
 * Onada 4 (retallador senzill, 261008) · Ara és un embolcall de
 * useEnquadramentImatge amb la configuració de sempre (CONFIG_AVATAR_T46):
 * els seus consumidors (DetallAjust, el diàleg intermedi del Perfil i
 * l'espècimen) veuen el mateix retallador T46, el mateix límit (25 MB) i la
 * mateixa eixida. La fitxa del Perfil ja no hi passa: va per
 * useImatgeDeFitxa, amb la finestra senzilla.
 */
const CONFIG_AVATAR_T46 = Object.freeze({
  senzill: false,
  mascara: null,
  formatInicial: FORMAT_AVATAR,
  formats: FORMATS_AVATAR,
  titol: TITOL_ENQUADRAMENT_AVATAR,
  descripcio: DESCRIPCIO_ENQUADRAMENT_AVATAR,
  valida: (font) => validaFitxerImatge(font, PES_MAXIM_FOTO_AVATAR),
  sortida: sortidaAvatar,
});

export function useEnquadramentAvatar({ onEnquadrat, onError } = {}) {
  const { obri, obert, dialeg } = useEnquadramentImatge({ config: CONFIG_AVATAR_T46, onEnquadrat, onError });
  return { obri, obert, dialeg };
}

export default useEnquadramentAvatar;
