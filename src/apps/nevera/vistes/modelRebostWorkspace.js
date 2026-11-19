import { nomCategoriaNevera } from '../i18nNevera.js';
import { CATEGORIES, totsElsArticles } from '../nucli/index.js';
import { entradetaDe, subtitolDe } from './vestits.js';

export function modelRebostWorkspace(estat, idioma = 'ca') {
  return { status: 'ready', canAutoSelect: false,
    categories: CATEGORIES.map(categoria => ({
      id: categoria.id,
      label: idioma && idioma !== 'ca' ? (nomCategoriaNevera(categoria.id, idioma) || categoria.nom) : categoria.nom
    })),
    items: totsElsArticles(estat).map(article => ({ id: article.id, title: article.nom,
      subtitle: subtitolDe(article, idioma), lead: entradetaDe(article, idioma), glyph: '🧺',
      categoryIds: [article.categoriaId], dades: article })) };
}

