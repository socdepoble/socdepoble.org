/**
 * EmoticonaBarra.jsx — L'espai central de la barra taronja (T51).
 *
 * T51 (ordre del Mestre, 260928). La barra taronja té tres columnes:
 * autoria · ESPAI CENTRAL · accions i data. Ací viu el del mig. Què s'hi
 * pinta ho decidix emoticonaDeBarra (utils/emoji.js), sense React:
 *   · EDICIÓ (amb `onObri`) → un <button aria-haspopup="dialog"> que obri el
 *     diàleg d'emoticona del pare. Sense emoticona hi va la ploma de lucide
 *     (Feather), blanca: la ploma queda reservada a este botó. Amb emoticona,
 *     l'emoticona.
 *   · LECTURA (sense `onObri`) → l'emoticona triada o una cel·la buida que
 *     conserva l'espai de la graella. Mai la ploma.
 * El mode es deduïx de la presència d'`onObri`, com la bola del món (T41).
 *
 * CONTRACTE
 *   emoticona (el camp CRU del document: '' | un emoji; mai item.icon del
 *     model de vista de la llista, que porta la 🪶 de T34) ·
 *   onObri (fn | null: amb ell, mode edició)
 */
import { Feather } from 'lucide-react';
import { emoticonaDeBarra } from '../../utils/emoji.js';

export const NOM_TRIAR_EMOTICONA = 'Triar l’emoticona del document';
export const nomCanviarEmoticona = (glif) => `Emoticona del document: ${glif}. Canviar-la`;
export const nomEmoticona = (glif) => `Emoticona del document: ${glif}`;

export function EmoticonaBarra({ emoticona = '', onObri = null }) {
  const edicio = typeof onObri === 'function';
  const { mostra, glif } = emoticonaDeBarra({ mode: edicio ? 'edicio' : 'lectura', icon: emoticona });

  if (mostra === 'boto') {
    const nom = glif ? nomCanviarEmoticona(glif) : NOM_TRIAR_EMOTICONA;
    return (
      <button type="button" className="sdp-emoticona-barra sdp-emoticona-barra--boto" aria-haspopup="dialog"
        aria-label={nom} title={nom} onClick={onObri}>
        {glif
          ? <span className="sdp-emoticona-barra__glif" aria-hidden="true">{glif}</span>
          : <Feather className="icon" aria-hidden="true" focusable="false" />}
      </button>
    );
  }

  if (mostra === 'glif') {
    return (
      <span className="sdp-emoticona-barra sdp-emoticona-barra--glif" role="img" aria-label={nomEmoticona(glif)}>
        <span className="sdp-emoticona-barra__glif" aria-hidden="true">{glif}</span>
      </span>
    );
  }

  return <span className="sdp-emoticona-barra sdp-emoticona-barra--buida" aria-hidden="true" />;
}

export default EmoticonaBarra;
