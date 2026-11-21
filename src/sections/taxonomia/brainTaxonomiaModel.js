/**
 * Model pur d'estil, fonts i normalització per a BrainTaxonomia (R32.24).
 */
export const ESTIL_BRAIN_TAXONOMIA = Object.freeze({
  radis: Object.freeze({ category: 16, tema: 7, entitat: 8, format: 6 }),
  colors: Object.freeze({
    category: 'var(--sdp-accio)',
    tema: 'var(--sdp-exit)',
    entitat: 'var(--sdp-accent)',
    format: 'var(--sdp-text-suau)',
    proposta: 'var(--sdp-accent)',
  }),
  noms: Object.freeze({
    category: 'Categoria',
    tema: 'Tema',
    entitat: 'Entitat o lloc',
    format: 'Format',
  }),
  etiquetaAmbZoom: Object.freeze({ category: 0.3, tema: 1, entitat: 1, format: 1 }),
});

export const FONT_NOMS_BRAIN = Object.freeze({
  wordpress: 'WordPress històric',
  mur: 'Mur carregat',
  mercat: 'Mercat carregat',
  events: 'Calendari carregat',
});

export const SECCIONS_VIVES_BRAIN = Object.freeze(['mur', 'mercat', 'events']);

export const AMPLARIES_PREVIEW_BRAIN = Object.freeze([375, 1440]);

export const netaTextBrain = (valor) => (
  String(valor ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('ca')
);

export const nomRelacioBrain = (link) => (
  link.tipus === 'coaparicio'
    ? `${link.weight} documents compartits`
    : link.tipus === 'skos'
      ? 'Jerarquia SKOS declarada'
      : 'Candidatura editorial'
);
