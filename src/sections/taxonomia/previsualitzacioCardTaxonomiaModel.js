/**
 * Model pur per a PrevisualitzacioCardTaxonomia (R32.24).
 */
export const ALCARIA_INICIAL_PREVIEW = 640;

export const ATRIBUTS_PRESENTACIO_PREVIEW = Object.freeze(['data-theme', 'data-contrast']);

export const ATRIBUTS_OBSERVATS_PREVIEW = Object.freeze(['data-theme', 'data-contrast', 'style']);

export const CLASSE_FRAME_PREVIEW_MOBIL = 'sdp-taxonomia__frame sdp-taxonomia__frame--mobil';
export const CLASSE_FRAME_PREVIEW_ESCRIPTORI = 'sdp-taxonomia__frame sdp-taxonomia__frame--escriptori';

export const fontsDePresentacio = (frame) => [...new Set([
  frame.closest('.sdp-root'),
  frame.closest('[data-theme]'),
  frame.closest('[data-contrast]'),
  frame.getRootNode().host,
  frame.ownerDocument.documentElement,
].filter(Boolean))];

export const classeFramePreview = (amplaria) => (
  amplaria === 375 ? CLASSE_FRAME_PREVIEW_MOBIL : CLASSE_FRAME_PREVIEW_ESCRIPTORI
);

export const etiquetaPreviewCard = (amplaria, etapa = '') => (
  `Targeta real en viewport de ${amplaria} píxels${etapa ? ` · ${etapa}` : ''}`
);

export const titolIframePreviewCard = (amplaria, etapa = '') => (
  `UniversalCard a ${amplaria} px${etapa ? ` · ${etapa}` : ''}`
);
