import { useEnquadramentImatge } from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { FORMATS, tipusDeSortida } from '../../components/universal/enquadrament/enquadrament.js';
import { PES_MAXIM_ENTRADA } from '../../components/universal/enquadrament/limits.js';
import { validaFitxerImatge } from '../../hooks/useHeroImageHandler.js';
import { MIDA_AVATAR } from '../../utils/pujadaImatge.js';

/** L'avatar només té una forma: el quadrat. */
export const FORMAT_AVATAR = '1:1';

/* Onada 4 · revisió adversarial (K2) · Una foto nova s'admet fins al límit
   d'ENTRADA del retallador (25 MB, limits.js): una foto de mòbil de 6-8 MB ha
   d'arribar-hi. El que puja és el que ix del retallador, i això continua
   passant pel límit de sempre (5 MB) a la pujada de cada lloc. */
export const PES_MAXIM_FOTO_AVATAR = PES_MAXIM_ENTRADA;

/* Onada 4 · revisió adversarial (K2, K3) · Una foto nova (File) ix SEMPRE
   recodificada del retallador, també quan es desa sencera: mai l'original,
   que pot pesar 25 MB. Mateix tipus que el camí T46 (JPEG o PNG; el PNG
   conserva la transparència d'un logotip).
   Gauntlet 261016 (Bloc 1, Llei del Quadrat) · I a la mida exacta de
   l'avatar: 400 × 400 (MIDA_AVATAR, la font única de utils/pujadaImatge.js),
   també si cal ampliar el retall, com la finestra senzilla de la fitxa
   (FORMES.avatar). Abans ixia fins a 1.200 px i la compressió el reduïa pel
   costat llarg: un retall menut es quedava menut. Una adreça ja resolta
   desada sencera continua sense res a desar (T46); retallada, ix també a
   400 × 400, en JPEG (una adreça no diu el seu tipus abans de carregar-se,
   el mateix criteri que configDeForma). */
export const EXACTA_AVATAR = Object.freeze({ amplada: MIDA_AVATAR, alcada: MIDA_AVATAR });
export function sortidaAvatar(font) {
  const fitxer = typeof Blob !== 'undefined' && font instanceof Blob;
  return { ampladaMaxima: MIDA_AVATAR, format: tipusDeSortida(fitxer ? font.type : ''), exacta: EXACTA_AVATAR };
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
 * Un avatar no oferix mai geolocalitzar la foto. Una foto nova ix sempre
 * recodificada del retallador (sortidaAvatar, 400 × 400 exactes), i després
 * la compressió de sempre la torna a codificar amb el canvas.
 * Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · L'EXIF el
 * decidix la persona: si la foto porta la ubicació o la data, el retallador
 * oferix la casella «Conserva la ubicació i la data de la foto», marcada de
 * sèrie, i la seua tria arriba a onEnquadrat (tercer argument, `exif`).
 * Marcada, la compressió hi torna a posar l'EXIF publicable de l'original
 * (DetallAjust: fotoDinsDelPressupost); desmarcada, el fitxer que puja ix net.
 *
 * CONTRACTE
 *   onEnquadrat(fitxer, info, exif) → Promise: rep el File ja retallat (i la
 *     tria de la casella, o undefined si no n'hi ha hagut) i el puja pel
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
