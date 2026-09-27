import { createContext, isValidElement } from 'react';
import { FileText, Folder } from 'lucide-react';
import { emojiInicial } from '../../../utils/emoji.js';

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

/* L'emoji amb què comença un text («🍅 Tomaques» → «🍅»), o null. La lògica
   viu a src/utils/emoji.js (T23: la capa de dades també la necessita i no
   pot importar components); ací es reexporta perquè qui ja la consumia
   d'ací no canvie. */
export { emojiInicial };

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
