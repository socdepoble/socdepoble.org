// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { ALERGENS, matriuDeProducte } from '../../../data/menjarIBeure/allergens.js';
import { llavorCarta } from './llavor.js';
const esMatriu = (matriu) => {
  expect(Object.keys(matriu)).toEqual(ALERGENS);
  for (const cell of Object.values(matriu)) {
    expect(['ingredient', 'traca', 'absent', 'desconegut']).toContain(cell.estat);
    if (cell.estat !== 'desconegut') expect(cell.font.trim().length).toBeGreaterThan(0);
  }
};
const carta = llavorCarta();
const producte = (id) => carta.productes.find((p) => p.id === id);
describe('R32.51 · al·lèrgens de la carta d’exemple', () => {
  test('31 productes i els 6 ingredients del Bar porten camps i abast explícits', () => {
    expect(carta.productes).toHaveLength(31);
    for (const item of [...carta.productes, ...carta.ingredients]) {
      expect(item.fontAlergens, item.id).toMatch(/exemple|sintètic/i);
      expect(item.fontAlergens.length, item.id).toBeLessThanOrEqual(240);
      expect(item.abastAlergens, item.id).toMatch(/composició/);
      for (const camp of ['alergens', 'tracesAlergens', 'alergensAbsents']) expect(Array.isArray(item[camp]), `${item.id}: ${camp}`).toBe(true);
      esMatriu(matriuDeProducte(item));
    }
  });

  test('els casos incomplets expliquen la salsa, el farcit i el cacau sense certificar marques', () => {
    const patates = producte('patates-picants');
    expect(patates.fontAlergens).toMatch(/salsa/);
    expect(patates.fontAlergens).toMatch(/pendent|desconeg/);
    expect(patates.alergensAbsents).toEqual([]);
    expect(producte('entrepa-vegetal').alergens).toEqual(expect.arrayContaining(['gluten', 'ous']));
    expect(producte('entrepa-vegetal').fontAlergens).toMatch(/maionesa/);
    expect(producte('xocolata').alergens).toContain('llet');
    expect(producte('xocolata').fontAlergens).toMatch(/cacau|preparat/);
    expect(matriuDeProducte(producte('xocolata')).soja.estat).toBe('desconegut');
  });

  test('no s’estén l’exempció del destil·lat als licors ni als preus oberts', () => {
    for (const id of ['carajillo', 'ginebra-tonica', 'licor-herbes', 'plat-del-dia', 'varis']) {
      const matriu = matriuDeProducte(producte(id));
      expect(Object.values(matriu).every((cell) => cell.estat === 'desconegut'), id).toBe(true);
      expect(producte(id).alergensAbsents).toEqual([]);
    }
    expect(producte('carajillo').fontAlergens).toMatch(/destil·lat/);
    expect(producte('licor-herbes').fontAlergens).toMatch(/crema|ametla|sulfits/);
  });

});
