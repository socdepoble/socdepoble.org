import { expect, test } from 'vitest';
import {
  PROFUNDITAT_MAXIMA_CARPETES, admetSubcarpeta, buildWorkspaceFolderForest, camiDeCarpeta,
  descendentsDeCarpeta, profunditatDeCarpeta
} from './workspaceFolderForest.js';

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

/* ── T7 (P5) · Carpetes niades fins a tres nivells ── */
const ARBRE = buildWorkspaceFolderForest([
  { id: 'tic', nom: 'TIC', parentId: null },
  { id: 'foto', nom: 'Foto', parentId: 'tic' },
  { id: 'ag', nom: 'Antigravity', parentId: 'foto' },
  { id: 'massa', nom: 'Massa fons', parentId: 'ag' },
  { id: 'hort', label: 'Hort' }
]);

test('P5 · profunditat: 1 a l’arrel, 0 fora del bosc; el màxim és 3', () => {
  expect(PROFUNDITAT_MAXIMA_CARPETES).toBe(3);
  expect(['hort', 'tic', 'foto', 'ag', 'massa', 'absent', null].map((id) => profunditatDeCarpeta(ARBRE, id)))
    .toEqual([1, 1, 2, 3, 4, 0, 0]);
});

test('P5 · només s’hi poden crear subcarpetes fins al tercer nivell', () => {
  expect(admetSubcarpeta(ARBRE, 'tic')).toBe(true);
  expect(admetSubcarpeta(ARBRE, 'foto')).toBe(true);
  expect(admetSubcarpeta(ARBRE, 'ag')).toBe(false);
  expect(admetSubcarpeta(ARBRE, 'absent')).toBe(false);
  expect(admetSubcarpeta(ARBRE, 'tic', 1)).toBe(false);
});

test('P5 · el camí «A › B › C», amb nom o label; un separador i una etiqueta propis', () => {
  expect(camiDeCarpeta(ARBRE, 'ag')).toBe('TIC › Foto › Antigravity');
  expect(camiDeCarpeta(ARBRE, 'hort')).toBe('Hort');
  expect(camiDeCarpeta(ARBRE, 'absent')).toBe('');
  expect(camiDeCarpeta(ARBRE, 'foto', { separador: ' / ', etiqueta: (node) => node.id })).toBe('tic / foto');
});

test('P5 · els descendents d’una carpeta, a qualsevol nivell, sense ella', () => {
  expect([...descendentsDeCarpeta(ARBRE, 'tic')].sort()).toEqual(['ag', 'foto', 'massa']);
  expect([...descendentsDeCarpeta(ARBRE, 'ag')]).toEqual(['massa']);
  expect(descendentsDeCarpeta(ARBRE, 'hort').size).toBe(0);
  expect(descendentsDeCarpeta(ARBRE, 'absent').size).toBe(0);
});

test('P5 · un bosc fet a mà amb un cicle no penja els helpers', () => {
  const a = { id: 'a', parentId: 'b', children: [] };
  const b = { id: 'b', parentId: 'a', children: [a] };
  a.children.push(b);
  const aMa = { roots: [], nodes: new Map([['a', a], ['b', b]]) };
  expect(profunditatDeCarpeta(aMa, 'a')).toBe(2);
  expect([...descendentsDeCarpeta(aMa, 'a')]).toEqual(['b']);
});
