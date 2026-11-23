import { expect, test } from 'vitest';
import { deProducte } from './indexCerca.js';
import { propsDeTargetaDeResultat } from './targetaDeResultat.js';

test.each([
  [{ price: 1234.5 }, '1.234,50 €'],
  [{ price: 0 }, '0,00 €'],
  [{ price: 'A convenir' }, 'A convenir'],
  [{ price: 99, variations: [{ id: 'antic', price: 1, stock_status: 'Esgotat' }, { id: 'vigent', price: 4.95 }] }, '4,95 €'],
  [{ price: 99, variations: [{ id: 'mostra', price: 0 }] }, '0,00 €'],
  [{ price: 7.5, variations: [{ id: 'sense-preu', name: 'Unitat' }] }, '7,50 €']
])('R32.44 · llista i targeta de cerca mostren el preu inicial canònic de %j', (dades, preu) => {
  const producte = Object.freeze({ id: 'oli', title: 'Oli del poble', ...dades });
  const entrada = deProducte(producte);
  expect(entrada.meta[0]).toBe(preu);
  expect(propsDeTargetaDeResultat(entrada).labels[0]).toBe(preu);
  expect(producte.price).toBe(dades.price);
});
