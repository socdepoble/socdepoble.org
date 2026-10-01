/**
 * T9 (ordre del Mestre, 261001) · nodes.js, pur: la llista de «Els nodes»
 * del Perfil (PerfilShell). «Actiu» vol dir el node on estàs ara; una dada
 * de configuració no pot declarar-se activa.
 */
import { expect, test } from 'vitest';
import { NODE_PRINCIPAL, nodesDelPerfil } from './nodes.js';

const resum = (nodes) => nodes.map(({ id, nom, actiu }) => [id, nom, actiu]);

test('dins d’un amfitrió: el seu node, actiu, i després Sóc de Poble', () => {
  const nodes = nodesDelPerfil({ nomPoble: 'Gent de la Torre' });
  expect(resum(nodes)).toEqual([['amfitrio', 'Gent de la Torre', true], ['soc-de-poble', 'Sóc de Poble', false]]);
  expect(nodes[1].descripcio).toBe(NODE_PRINCIPAL.descripcio);
  expect(nodes[0].descripcio).toMatch(/les dades les guarda Sóc de Poble/);
});

test('sense nomPoble (o amb un nom buit), només Sóc de Poble, actiu', () => {
  for (const nomPoble of [undefined, null, '', '   ', 42]) {
    expect(resum(nodesDelPerfil({ nomPoble }))).toEqual([['soc-de-poble', 'Sóc de Poble', true]]);
  }
  expect(resum(nodesDelPerfil())).toEqual([['soc-de-poble', 'Sóc de Poble', true]]);
});

test('un nom brut (bidi, invisibles, espais) es saneja', () => {
  const [amfitrio] = nodesDelPerfil({ nomPoble: '  Gent\u{202E} de la\u{200B} Torre\u{2066}  ' });
  expect(amfitrio.nom).toBe('Gent de la Torre');
});

test('els nodes de més: mal formats o repetits fora, i cap és actiu encara que ho diga', () => {
  const nodes = nodesDelPerfil({
    nomPoble: 'Gent de la Torre',
    extra: [
      { id: 'la-vall', nom: 'La Vall', descripcio: '  El node veí.  ', actiu: true },
      { id: 'Mal Format', nom: 'No' },
      { id: 'sense-nom' },
      { id: 'la-vall', nom: 'Repetit' },
      { id: 'amfitrio', nom: 'Es fa passar per l’amfitrió' },
      { id: 'soc-de-poble', nom: 'Es fa passar pel principal' },
      null
    ]
  });
  expect(resum(nodes)).toEqual([
    ['amfitrio', 'Gent de la Torre', true], ['soc-de-poble', 'Sóc de Poble', false], ['la-vall', 'La Vall', false]
  ]);
  expect(nodes[2].descripcio).toBe('El node veí.');
  expect(nodesDelPerfil({ extra: 'no és llista' })).toHaveLength(1);
});
