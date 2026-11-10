import { imatgeDe, valorDeProducte } from './vestits.js';

export function modelCartaWorkspace(carta, establiment) {
  const categories = (carta?.categories || []).map(categoria => ({ id: categoria.id, label: categoria.nom }));
  const noms = new Map(categories.map(categoria => [categoria.id, categoria.label]));
  return { status: 'ready', canAutoSelect: false, categories,
    items: (carta?.productes || []).map(producte => ({ id: producte.id, title: producte.nom,
      subtitle: noms.get(producte.categoriaId) || 'Carta',
      lead: `${valorDeProducte(producte)}${producte.exemple ? ' · Preu d’exemple' : ''}`,
      imageUrl: imatgeDe(producte, establiment), glyph: '🍽️', categoryIds: [producte.categoriaId], dades: producte })) };
}

