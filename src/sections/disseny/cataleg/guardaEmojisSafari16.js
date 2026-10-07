/**
 * guardaEmojisSafari16.js — la guarda dels emojis que es veuen a Safari 16
 * (Baseline 2022): RGI complets, sense seqüències ZWJ, Unicode 13 o anterior
 * i cap bandera. Una sola còpia per a les dues proves que la fan servir
 * (revisió del 261007, M2-14): manifest.icones.test.js (els espècimens de
 * Disseny) i wiki-de-poble/iconesWiki.test.js (la Wiki). Abans, cada prova en
 * duia la seua taula.
 *
 * Només la importen les proves: no entra al paquet.
 */
import { emojiSol } from '../../../utils/emoji.js';
import { GRUPS_EMOJIS } from './dades/emojisUnicode18.js';

/* Els emojis RGI completament qualificats (emoji-test.txt de Unicode). */
const RGI = new Set(GRUPS_EMOJIS.flatMap((grup) => grup.emojis.map(([, glif]) => glif)));

/* Punts de codi posteriors a Unicode 13 (Emoji 14, 15, 16 i 17): Safari 16.0
   no els pinta tots. Revisió del 261007 (M2-14) · Hi faltaven els tres cors
   d'Emoji 15.0 (U+1FA75–U+1FA77: 🩵🩶🩷). Ara sí: la resta del bloc
   U+1FA70–U+1FAFF és de la 12 o la 13. Les seqüències d'etiquetes
   (U+E0020–U+E007F, les banderes de 🏴 com Escòcia) cauen a l'últim tram. */
export const POSTERIORS_A_13 = Object.freeze([
  [0x1F6D8, 0x1F6D8], [0x1F6DC, 0x1F6DF], [0x1F7F0, 0x1F7F0], [0x1F979, 0x1F979], [0x1F9CC, 0x1F9CC],
  [0x1FA75, 0x1FA77], [0x1FA7B, 0x1FA7F], [0x1FA87, 0x1FA8F], [0x1FAA9, 0x1FAAF], [0x1FAB7, 0x1FABF],
  [0x1FAC3, 0x1FACF], [0x1FAD7, 0x1FAFF], [0x1FB00, 0x10FFFF]
].map((tram) => Object.freeze(tram)));

const posteriorA13 = (glif) => [...glif].some((caracter) => {
  const punt = caracter.codePointAt(0);
  return POSTERIORS_A_13.some(([de, fins]) => punt >= de && punt <= fins);
});

/* M2-14 · Una bandera és un parell d'indicadors regionals, i els indicadors
   són antics encara que la bandera siga nova (🇨🇶, Emoji 16): la guarda de
   punts de codi no la veu. Cap no val: les icones no fan servir banderes. */
const INDICADOR_REGIONAL = /\p{Regional_Indicator}/u;

/** Per què un glif no val com a icona que s'ha de veure a Safari 16, o null. */
export function defecteSafari16(glif) {
  if (typeof glif !== 'string' || !emojiSol(glif)) return 'no és un sol emoji';
  if (!RGI.has(glif)) return 'no és un emoji RGI complet (falta el selector U+FE0F?)';
  if (glif.includes('‍')) return 'és una seqüència ZWJ';
  if (INDICADOR_REGIONAL.test(glif)) return 'és una bandera';
  if (posteriorA13(glif)) return 'és posterior a Unicode 13';
  return null;
}
