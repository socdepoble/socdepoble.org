/**
 * Auditoria de seguretat 261019 (F14) · La fitxa de compra del Mercat
 * (CompraDelProducte) diu de qui ven el nom que força el servidor
 * (author_name), com la targeta; el `seller` del payload, que escriu qui
 * publica, només quan no n'hi ha cap altre.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { buildMercatDetailSectionMeta } from './detailSectionMeta.jsx';
import { MOCK_MARKET_ITEMS } from '../mercat/marketSeed.js';
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { deProducte } from '../search/indexCerca.js';

const t = (_, alternativa) => alternativa;
const VARIANT = { id: 'unica', name: 'Única', price: '5€' };
const venedor = (item) => render(buildMercatDetailSectionMeta({ t }).renderBody(item))
  .container.querySelector('.detail-seller')?.textContent ?? null;

afterEach(cleanup);

test('un seller del payload no fa ombra al nom que força el servidor', () => {
  expect(venedor({ id: 'p', title: 'Mel', author_name: 'Maria Real', seller: 'Ajuntament de Sella', variations: [VARIANT] }))
    .toBe('Venedor: Maria Real');
});

test('una publicació d’un veí amb el nom en blanc (un espai dur) no torna a donar pas al seller', () => {
  expect(venedor({ id: 'p', title: 'Mel', author_name: ' ', seller: 'Ajuntament de Sella', ownerUserId: 'U', variations: [VARIANT] }))
    .toBeNull();
  expect(deProducte({ id: 'p', title: 'Mel', author_name: ' ', seller: 'Ajuntament de Sella', ownerUserId: 'U' }).meta)
    .not.toContain('Ajuntament de Sella');
  expect(deProducte({ id: 'p', title: 'Mel', author_name: 'Maria Real', seller: 'Ajuntament de Sella', ownerUserId: 'U' }).meta)
    .toContain('Maria Real');
});

test('sense author_name, el seller (la llavor, d’abans)', () => {
  expect(venedor({ id: 'p', title: 'Mel', seller: 'Pepa', variations: [VARIANT] })).toBe('Venedor: Pepa');
  expect(venedor({ id: 'p', title: 'Mel', seller: '', variations: [VARIANT] })).toBeNull();
});

test('la llavor del Mercat es pinta igual: hi coincidixen tots dos', () => {
  for (const item of [...MOCK_MARKET_ITEMS, ...MARKET_ITEMS]) {
    if (item.author_name && item.seller) expect(item.author_name).toBe(item.seller);
  }
});
