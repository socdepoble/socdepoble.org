import { createContext, isValidElement } from 'react';
import { FileText, Folder } from 'lucide-react';

/**
 * NavGlyph — resolutor únic del glif de navegació (arbre, rail plegat i fitxes).
 *
 * Una secció pot injectar el glif d'una carpeta, categoria o document de dues
 * maneres, i totes dues han de funcionar a tot arreu:
 *   · un text (emoji)            → <span aria-hidden="true">🧱</span>
 *   · un component d'icona       → <Icona /> (funció, forwardRef o memo: les
 *                                  icones de lucide són objectes forwardRef)
 *   · res o un valor no vàlid    → icona de carpeta o de document per defecte.
 * Mai pinta un buit ni una lletra: la inicial és cosa de la fitxa (ItemMedia),
 * i només com a últim recurs.
 */

export const GLIF_CARPETA = Folder;
export const GLIF_DOCUMENT = FileText;

/* Un glif vàlid és un text no buit o un component. Un element React ja
   pintat (<Icona />) no ho és: el resolutor no sabria donar-li mida. */
export function esGlif(glif) {
  if (typeof glif === 'string') return glif.trim() !== '';
  if (typeof glif === 'function') return true;
  return typeof glif === 'object' && glif !== null && '$$typeof' in glif && !isValidElement(glif);
}

/* El primer candidat vàlid, en l'ordre de preferència que dóna qui crida. */
export function primerGlif(...candidats) {
  return candidats.find(esGlif) ?? null;
}

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
 * Resolutor del glif de categoria d'un document: (item) => glif | null.
 * El proveïx la columna de documents del UniversalWorkspace; fora d'ella val
 * null i les fitxes es comporten com sempre.
 */
export const GlifCategoriaContext = createContext(null);

export function NavGlyph({ glyph, fallback = GLIF_CARPETA, size = 18, className = '' }) {
  const glif = primerGlif(glyph, fallback) || GLIF_CARPETA;

  if (typeof glif === 'string') {
    return (
      <span className={['sdp-nav-glyph', className].filter(Boolean).join(' ')} aria-hidden="true">
        {glif.trim()}
      </span>
    );
  }

  const Icona = glif;
  return <Icona size={size} aria-hidden="true" focusable="false" className={className || undefined} />;
}
