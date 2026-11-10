import { CATEGORIES, totsElsArticles } from '../nucli/index.js';
import { entradetaDe, subtitolDe } from './vestits.js';

export function modelRebostWorkspace(estat) {
  return { status: 'ready', canAutoSelect: false,
    categories: CATEGORIES.map(categoria => ({ id: categoria.id, label: categoria.nom })),
    items: totsElsArticles(estat).map(article => ({ id: article.id, title: article.nom,
      subtitle: subtitolDe(article), lead: entradetaDe(article), glyph: '🧺',
      categoryIds: [article.categoriaId], dades: article })) };
}

