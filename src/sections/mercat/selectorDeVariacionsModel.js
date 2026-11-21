/**
 * Model pur per a SelectorDeVariacions (puresa Vite Fast Refresh / HMR · R32.24).
 */
export const TEXT_ESGOTAT_PER_DEFECTE = 'Esgotat';

export const CLASSE_VARIANT = 'sdp-variant';
export const CLASSE_VARIANT_ESGOTADA = 'sdp-variant sdp-variant--esgotada';

export const idLlegendaVariacions = (idBase) => `${idBase}-llegenda`;

export const idOpcioVariacio = (idBase, valor) => `${idBase}-${valor}`;

export const classeVariantOpcio = (esgotada) => (
  esgotada ? CLASSE_VARIANT_ESGOTADA : CLASSE_VARIANT
);
