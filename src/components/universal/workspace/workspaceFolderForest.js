/** A cycle-safe, group-local forest. Unknown parents become roots. */
export function buildWorkspaceFolderForest(categories = []) {
  const nodes = new Map();
  for (const category of categories) {
    if (!category || category.id == null) continue;
    const id = String(category.id);
    if (!nodes.has(id)) nodes.set(id, { ...category, id, children: [] });
  }
  const parents = new Map();
  for (const node of nodes.values()) {
    const parent = node.parentId == null ? null : String(node.parentId);
    parents.set(node.id, parent !== node.id && nodes.has(parent) ? parent : null);
  }
  const done = new Set();
  for (const id of nodes.keys()) {
    const path = new Set();
    let current = id;
    while (current !== null && !done.has(current)) {
      if (path.has(current)) {
        parents.set(current, null);
        break;
      }
      path.add(current);
      current = parents.get(current);
    }
    for (const visited of path) done.add(visited);
  }
  const roots = [];
  const ordered = [...nodes.values()].sort((a, b) => (a.order || 0) - (b.order || 0));
  for (const node of ordered) {
    node.parentId = parents.get(node.id);
    if (node.parentId === null) roots.push(node);
    else nodes.get(node.parentId).children.push(node);
  }
  return { roots, nodes };
}
