import { imatgeDe, pictogramaFamiliaBar, valorDeProducte } from './vestits.js';

export function modelCartaWorkspace(carta, establiment) {
  const categories = (carta?.categories || []).map(categoria => ({ id: categoria.id, label: categoria.nom }));
  const noms = new Map(categories.map(categoria => [categoria.id, categoria.label]));
  /* v1.2.17 · Gauntlet R1 (L3-08) · El dibuix de la família, només ací: amb la icona pròpia de la categoria si en té. */
  const icones = new Map((carta?.categories || []).map(categoria => [categoria.id, categoria.icona]));
  return { status: 'ready', canAutoSelect: false, categories,
    items: (carta?.productes || []).map(producte => ({ id: producte.id, title: producte.nom,
      subtitle: noms.get(producte.categoriaId) || 'Carta',
      lead: `${valorDeProducte(producte)}${producte.exemple ? ' · Preu d’exemple' : ''}`,
      imageUrl: imatgeDe(producte, establiment),
      glyph: pictogramaFamiliaBar(producte.categoriaId, noms.get(producte.categoriaId), icones.get(producte.categoriaId)),
      categoryIds: [producte.categoriaId], dades: producte })) };
}

