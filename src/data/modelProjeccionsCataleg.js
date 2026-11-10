/** P0-59 · Domain identifiers are opaque. A reserved-looking identifier may
 * already belong to the source catalogue; references get deterministic free
 * identifiers and their own free category without renaming source records.
 */
function lliure(base, usats) {
  let id = base, sufix = 0;
  while (usats.has(id)) { sufix += 1; id = `${base}-${sufix}`; }
  usats.add(id);
  return id;
}
export function fusionaModelProjeccionsCataleg(model, projeccions, etiqueta = 'Referències publicades') {
  if (!projeccions.length) return model;
  const categories = model.categories ?? [];
  const categoria = lliure('__projeccions__', new Set(categories.map(row => String(row.id))));
  const ids = new Set(model.items.map(item => String(item.id)));
  const references = projeccions.map(item => ({ ...item, id: lliure(String(item.id), ids), categoryIds: [categoria] }));
  return { ...model, categories: [...categories, { id: categoria, label: etiqueta, count: references.length }],
    items: [...model.items, ...references] };
}
