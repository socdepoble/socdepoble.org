// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { ALERGENS, matriuDeProducte } from '../../../data/menjarIBeure/allergens.js';
import { INGREDIENTS, ingredientPerId } from './ingredients.js';
import * as receptari from './receptes.js';

const esMatriu = (matriu) => {
  expect(Object.keys(matriu)).toEqual(ALERGENS);
  for (const cell of Object.values(matriu)) {
    expect(['ingredient', 'traca', 'absent', 'desconegut']).toContain(cell.estat);
    if (cell.estat !== 'desconegut') expect(cell.font.trim().length).toBeGreaterThan(0);
  }
};

describe('R32.51 · declaracions auditables Bar / Nevera', () => {
  test('cada ingredient real conserva el seu id i explicita la composició i els límits', () => {
    expect(INGREDIENTS).toHaveLength(30);
    for (const item of INGREDIENTS) {
      expect(item.fontAlergens, item.id).toMatch(/1169\/2011/);
      expect(item.abastAlergens, item.id).toMatch(/composició/);
      expect(item.avisAlergens, item.id).toMatch(/proveïdor|preparació/);
      for (const camp of ['alergens', 'tracesAlergens', 'alergensAbsents']) expect(Object.isFrozen(item[camp]), `${item.id}: ${camp}`).toBe(true);
      esMatriu(matriuDeProducte(item));
    }
    expect(matriuDeProducte(ingredientPerId('ou')).ous.estat).toBe('ingredient');
    for (const id of ['farina', 'pa']) expect(matriuDeProducte(ingredientPerId(id)).gluten.estat).toBe('ingredient');
    for (const id of ['tonyina', 'bacalla']) expect(matriuDeProducte(ingredientPerId(id)).peix.estat).toBe('ingredient');
  });

  test('pinyó fora dels huit fruits de closca de l’Annex II; cap promesa de seguretat', () => {
    const pinyo = ingredientPerId('pinyo');
    expect(pinyo.alergens).not.toContain('fruits-closca');
    expect(pinyo.fontAlergens).toMatch(/Annex II\.8/);
    expect(pinyo.avisAlergens).toMatch(/fora dels 14|fora d’estos 14/);
  });

  test('ni forn ni botifarra ni tots els llegums reben traces inventades', () => {
    for (const id of ['pa', 'farina', 'botifarra', 'cigro', 'fesol', 'llentilla']) expect(ingredientPerId(id).tracesAlergens, id).toEqual([]);
    expect(Object.values(matriuDeProducte(ingredientPerId('botifarra'))).every((cell) => cell.estat === 'desconegut')).toBe(true);
    expect(matriuDeProducte(ingredientPerId('llentilla')).gluten.estat).toBe('desconegut');
  });
});

describe('R32.51 · matriu determinista de recepta sense regressió del receptari', () => {
  test('les 14 receptes exposen el helper i mantenen les cinc claus originals', () => {
    expect(typeof receptari.matriuDeRecepta).toBe('function');
    expect(receptari.RECEPTES).toHaveLength(14);
    for (const recepta of receptari.RECEPTES) {
      expect(Object.keys(recepta).sort()).toEqual(['id', 'ingredients', 'nom', 'racions', 'resum']);
      esMatriu(receptari.matriuDeRecepta(recepta));
      expect(receptari.matriuDeRecepta(recepta.id)).toEqual(receptari.matriuDeRecepta(recepta));
      expect(Object.values(receptari.matriuDeRecepta(recepta)).some((cell) => cell.estat === 'absent')).toBe(false);
    }
  });

  test('ingredient obligatori domina, opcional es presenta com a potencial', () => {
    expect(typeof receptari.matriuDeRecepta).toBe('function');
    expect(receptari.matriuDeRecepta('pa-amb-tomaca').gluten.estat).toBe('ingredient');
    expect(receptari.matriuDeRecepta('truita-de-creilla').ous.estat).toBe('ingredient');
    expect(receptari.matriuDeRecepta('espencat').peix.estat).toBe('traca');
    expect(receptari.matriuDeRecepta('sopa-d-all').ous.estat).toBe('traca');
    expect(receptari.matriuDeRecepta('coca-de-tomaca-i-pebrera').peix.estat).toBe('traca');
    expect(receptari.matriuDeRecepta('coca-en-tonyina').peix.estat).toBe('ingredient');
    expect(receptari.matriuDeRecepta('espencat').peix.font).toMatch(/opcional/);
  });

  test('alternativa és potencial encara que siga la primera, i un desconegut no esdevé absent', () => {
    expect(typeof receptari.matriuDeRecepta).toBe('function');
    const recepta = { ingredients: [{ id: 'ou', opcional: false, o: ['bacalla'] }] };
    const matriu = receptari.matriuDeRecepta(recepta);
    expect(matriu.ous.estat).toBe('traca');
    expect(matriu.peix.estat).toBe('traca');
    expect(matriu.peix.font).toMatch(/alternativa/i);
    const desconeguda = receptari.matriuDeRecepta({ ingredients: [{ id: 'inexistent', opcional: false, o: [] }] });
    expect(Object.values(desconeguda).every((cell) => cell.estat === 'desconegut')).toBe(true);
  });

  test('dades invàlides, id absent i recepta buida fallen cap a desconegut', () => {
    expect(typeof receptari.matriuDeRecepta).toBe('function');
    for (const entrada of [null, undefined, 42, 'inexistent', {}, { ingredients: [] }, { ingredients: [null] }, { ingredients: 'ou' }]) {
      const matriu = receptari.matriuDeRecepta(entrada);
      expect(Object.values(matriu).every((cell) => cell.estat === 'desconegut')).toBe(true);
    }
  });
});
