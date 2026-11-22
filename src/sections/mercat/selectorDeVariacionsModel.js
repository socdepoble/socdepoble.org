/**
 * Model pur per a SelectorDeVariacions (puresa Vite Fast Refresh / HMR · R32.24 + R32.33).
 */
export const TEXT_ESGOTAT_PER_DEFECTE = 'Esgotat';

export const TEXTOS_ESGOTAT_VARIACIO = Object.freeze({
  ca: 'Esgotat',
  es: 'Agotado',
  en: 'Out of stock',
  eu: 'Agortuta',
  gl: 'Esgotado',
});

export function textEsgotatVariacio(idioma = 'ca') {
  const codi = String(idioma || 'ca').trim().toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(TEXTOS_ESGOTAT_VARIACIO, codi)
    ? TEXTOS_ESGOTAT_VARIACIO[codi]
    : TEXT_ESGOTAT_PER_DEFECTE;
}

export const CLASSE_VARIANT = 'sdp-variant';
export const CLASSE_VARIANT_ESGOTADA = 'sdp-variant sdp-variant--esgotada';

export const idLlegendaVariacions = (idBase) => `${idBase}-llegenda`;

export const idOpcioVariacio = (idBase, valor) => `${idBase}-${valor}`;

export const classeVariantOpcio = (esgotada) => (
  esgotada ? CLASSE_VARIANT_ESGOTADA : CLASSE_VARIANT
);
