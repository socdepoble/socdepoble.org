import { expect, test } from 'vitest';
import { buildWorkspaceFolderForest } from './workspaceFolderForest.js';

test('recupera orfes i cicles sense perdre nodes ni mutar les dades', () => {
  const categories = [
    { id: 1, parentId: 2 }, { id: 2, parentId: 3 }, { id: 3, parentId: 1 },
    { id: 'orfe', parentId: 'absent' }, { id: 'auto', parentId: 'auto' },
    { id: 'fill', parentId: 2 }, { id: 'primer', order: -1 }
  ];
  const original = JSON.stringify(categories);
  const { roots } = buildWorkspaceFolderForest(categories);
  const visited = [];
  function walk(nodes) { for (const node of nodes) { visited.push(node.id); walk(node.children); } }
  walk(roots);
  expect(visited).toHaveLength(categories.length);
  expect(new Set(visited).size).toBe(categories.length);
  expect(roots[0].id).toBe('primer');
  expect(roots.map(n => n.id)).toEqual(expect.arrayContaining(['orfe', 'auto']));
  expect(JSON.stringify(categories)).toBe(original);
});

test('noms iguals conserven identitats diferents i els pares no travessen grups', () => {
  const { roots, nodes } = buildWorkspaceFolderForest([
    { id: 'a', label: 'Documents' }, { id: 'b', label: 'Documents', parentId: 'altre-grup' }
  ]);
  expect(roots).toHaveLength(2);
  expect(nodes.size).toBe(2);
});
