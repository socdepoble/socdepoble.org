/**
 * emoji.js — què és un emoji per a Sóc de Poble, en un sol lloc i sense React.
 *
 * Ho consumixen la UI (NavGlyph: glifs de navegació) i la capa de dades
 * (localNotes, NotesContext: neteja del camp `icon` d'una nota, T23). Abans
 * vivia dins de NavGlyph.jsx; la capa de dades no pot importar components.
 */

/* Un grafema és emoji si du presentació d'emoji: un punt de codi
   Emoji_Presentation (🍅, 🇪🇸, 👩‍🌾) o el selector U+FE0F (🗂️, ❤️, 1️⃣).
   Els símbols de text (©, ™, ▶, dígits) no ho són: la fitxa hi posa la
   lletra. Amb Extended_Pictographic, Chrome i Firefox < 125 discrepaven. */
const PRESENTACIO_EMOJI = /\p{Emoji_Presentation}|️/u;
/* El mateix criteri sense segmentador, sobre la seqüència inicial sencera
   (bandera, ZWJ, to de pell, tecla): tallada, pintaria mig emoji («🇪»). */
const SEQUENCIA_EMOJI = /^(?:\p{Regional_Indicator}{2}|(?:\p{Emoji_Presentation}|\p{Emoji}️)\p{Emoji_Modifier}?(?:‍(?:\p{Emoji_Presentation}|\p{Emoji}️?)\p{Emoji_Modifier}?)*⃣?)/u;

/* Un sol segmentador per a tota l'aplicació: el rail i les fitxes el
   consulten per cada document a cada pintat. */
let segmentador;
function primerGrafema(text) {
  if (segmentador === undefined) {
    segmentador = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter('ca', { granularity: 'grapheme' })
      : null;
  }
  if (!segmentador) return null;
  return segmentador.segment(text)[Symbol.iterator]().next().value?.segment || '';
}

/**
 * L'emoji amb què comença un text («🍅 Tomaques» → «🍅»), o null.
 * Intl.Segmenter no arriba a Firefox fins a la 125: sense ell, l'expressió
 * de seqüència dona el mateix resultat per als casos habituals.
 */
export function emojiInicial(text) {
  const net = String(text ?? '').trim();
  if (!net) return null;
  const grafema = primerGrafema(net);
  if (grafema !== null) return PRESENTACIO_EMOJI.test(grafema) ? grafema : null;
  return net.match(SEQUENCIA_EMOJI)?.[0] ?? null;
}

/**
 * Un text és UN emoji i prou («🍅»; no «🍅 Tomaques» ni «ab»). És el
 * contracte del camp `icon` d'una nota (T23): el que torna null no es desa.
 */
export function emojiSol(text) {
  const net = String(text ?? '').trim();
  return net && emojiInicial(net) === net ? net : null;
}
