import { expect, test } from 'vitest';
import { capturaLecturaPublica } from './lecturaPublicaOffline.js';

function captura(producte, ruta = '/mercat/oli') {
  const item = Object.freeze({ id: 'oli', title: 'Oli del poble', description: 'Collita dels bancals del poble, disponible per al veïnat.', ...producte });
  const sessio = () => ({ estat: 'fora', usuari: null, generacio: 2 });
  const fonts = () => new Map([['mur', { generacio: 2, capturadaEl: '2026-11-22T20:00:00.000Z',
    payload: { marketItems: [item], feedPosts: [item] } }]]);
  return capturaLecturaPublica({ finestra: { location: new URL(ruta, 'https://socdepoble.org') }, sessio, fonts });
}

test.each([
  [{ price: 1234.5 }, '1.234,50\u00a0€'],
  [{ price: 0 }, '0,00\u00a0€'],
  [{ price: 'A convenir' }, 'A convenir'],
  [{ price: 99, variations: [{ id: 'antic', price: 1, stock_status: 'Esgotat' }, { id: 'vigent', price: 4.95 }] }, '4,95\u00a0€'],
  [{ price: 99, variations: [{ id: 'mostra', price: 0 }] }, '0,00\u00a0€'],
  [{ price: 7.5, variations: [{ id: 'sense-preu', name: 'Unitat' }] }, '7,50\u00a0€']
])('R32.44 · la còpia pública del producte usa el preu inicial canònic de %j', (producte, preu) => {
  const copia = captura(producte);
  expect(copia.text.split('\n')).toContain(preu);
  expect(copia.capturadaEl).toBe('2026-11-22T20:00:00.000Z');
});

test('una nota del Mur conserva el seu import declarat sense adoptar variants del Mercat', () => {
  const copia = captura({ price: 99, variations: [{ id: 'exemple', price: 4.95 }] }, '/mur/oli');
  expect(copia.text.split('\n')).toContain('99,00\u00a0€');
  expect(copia.text).not.toContain('4,95');
});
