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

/* ── T7 (P5) · Carpetes niades: helpers purs sobre el bosc de dalt ──────
   El contracte de les opcions de carpeta és { id, nom | label, parentId }
   (ids en text, parentId null a l'arrel). buildWorkspaceFolderForest no
   canvia de signatura: estes funcions en llegixen el resultat. */

/** Fins a tres nivells: carpeta › subcarpeta › subsubcarpeta. */
export const PROFUNDITAT_MAXIMA_CARPETES = 3;

const nodeDe = (forest, id) => (id == null ? null : forest?.nodes?.get(String(id)) || null);

/** Els avantpassats d'una carpeta, de l'arrel fins a ella mateixa inclosa. */
function cadenaDe(forest, id) {
  const cadena = [];
  /* El bosc ja trenca els cicles; la guarda és per a un bosc fet a mà. */
  for (let node = nodeDe(forest, id); node && !cadena.includes(node); node = nodeDe(forest, node.parentId)) {
    cadena.unshift(node);
  }
  return cadena;
}

/** La profunditat d'una carpeta: 1 a l'arrel; 0 si no és al bosc. */
export function profunditatDeCarpeta(forest, id) {
  return cadenaDe(forest, id).length;
}

/** Si una carpeta pot tindre subcarpetes sense passar del màxim. */
export function admetSubcarpeta(forest, id, maxim = PROFUNDITAT_MAXIMA_CARPETES) {
  const profunditat = profunditatDeCarpeta(forest, id);
  return profunditat > 0 && profunditat < maxim;
}

const etiquetaPerDefecte = (node) => node.label ?? node.nom ?? node.name ?? node.id;

/** El camí d'una carpeta per a llegir-lo: «TIC › Foto › Antigravity». Buit si no és al bosc. */
export function camiDeCarpeta(forest, id, { separador = ' › ', etiqueta = etiquetaPerDefecte } = {}) {
  return cadenaDe(forest, id).map((node) => String(etiqueta(node))).join(separador);
}

/** Els ids de totes les subcarpetes d'una carpeta, a qualsevol nivell (ella no hi és). */
export function descendentsDeCarpeta(forest, id) {
  const inici = nodeDe(forest, id);
  const descendents = new Set();
  const pendents = [...(inici?.children || [])];
  while (pendents.length) {
    const node = pendents.pop();
    if (node === inici || descendents.has(node.id)) continue;
    descendents.add(node.id);
    pendents.push(...node.children);
  }
  return descendents;
}
