import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ALERGENS, matriuDeProducte } from '../src/data/menjarIBeure/allergens.js';
import { llavorCarta } from '../src/apps/bar/nucli/llavor.js';
import * as ingredients from '../src/apps/nevera/nucli/ingredients.js';
import * as receptari from '../src/apps/nevera/nucli/receptes.js';

const desconegut = (matriu) => Object.values(matriu).every((cell) => cell.estat === 'desconegut');
const entrada = (id, opcional = false, o = []) => ({ id, opcional, o });
const matriu = (llista) => receptari.matriuDeRecepta({ ingredients: llista });

test('Bar: inventari estable amb procedència i cap doble declaració', () => {
  const carta = llavorCarta();
  assert.equal(carta.productes.length, 31);
  assert.equal(carta.ingredients.length, 6);
  for (const item of [...carta.productes, ...carta.ingredients]) {
    assert.ok(item.fontAlergens?.includes('1169/2011'), item.id);
    const declarats = ['alergens', 'tracesAlergens', 'alergensAbsents'].flatMap((camp) => item[camp]);
    assert.equal(new Set(declarats).size, declarats.length, item.id);
    assert.deepEqual(Object.keys(matriuDeProducte(item)), ALERGENS);
  }
  carta.productes[0].tracesAlergens.push('ous');
  assert.deepEqual(llavorCarta().productes[0].tracesAlergens, []);
});

test('ingredients: matriu pura, null desconegut i absència només de composició', () => {
  assert.equal(typeof ingredients.matriuIngredient, 'function');
  for (const item of ingredients.INGREDIENTS) {
    assert.deepEqual(ingredients.matriuIngredient(item.id), matriuDeProducte(item));
    assert.match(item.abastAlergens, /composició/);
    assert.match(item.avisAlergens, /proveïdor|preparació/);
  }
  assert.ok(desconegut(ingredients.matriuIngredient('inexistent')));
  assert.equal(ingredients.matriuIngredient('ou').ous.estat, 'ingredient');
  assert.notEqual(ingredients.matriuIngredient('llentilla').gluten.estat, 'absent');
  assert.ok(desconegut(ingredients.matriuIngredient('botifarra')));
});

test('recepta: positiu obligatori domina l’opcional i les alternatives', () => {
  assert.equal(typeof receptari.matriuDeRecepta, 'function');
  const resultat = matriu([entrada('ou', true), entrada('ou'), entrada('bacalla', false, ['ou'])]);
  assert.equal(resultat.ous.estat, 'ingredient');
  assert.equal(resultat.peix.estat, 'traca');
  assert.match(resultat.peix.font, /alternativa/i);
});

test('recepta: cap desconegut, opcional o alternativa es perd ni inferix absència', () => {
  assert.equal(typeof receptari.matriuDeRecepta, 'function');
  const casos = [
    [entrada('inexistent')],
    [entrada('inexistent', true)],
    [entrada('inexistent', false, ['tampoc'])],
    [entrada('all'), entrada('inexistent')],
    [entrada('oli', true)]
  ];
  for (const cas of casos) assert.ok(desconegut(matriu(cas)));
  const alternativa = matriu([entrada('ou', false, ['inexistent'])]);
  assert.equal(alternativa.ous.estat, 'traca');
  assert.equal(alternativa.llet.estat, 'desconegut');
});

test('recepta: dades hostils o malformades no certifiquen res', () => {
  assert.equal(typeof receptari.matriuDeRecepta, 'function');
  for (const dada of [null, 9, [], {}, { ingredients: [] }, { ingredients: [null, {}] }, { ingredients: [entrada('__proto__')] }]) {
    assert.ok(desconegut(receptari.matriuDeRecepta(dada)));
  }
  assert.ok(desconegut(matriu([{ id: 'ou', opcional: 'false', o: [] }])));
  assert.ok(desconegut(matriu([{ id: 'ou', opcional: false, o: 'bacalla' }])));
});

test('recepta: determinisme, no mutació i cap absència de preparació', () => {
  assert.equal(typeof receptari.matriuDeRecepta, 'function');
  const abans = JSON.stringify(receptari.RECEPTES);
  for (const recepta of receptari.RECEPTES) {
    const a = receptari.matriuDeRecepta(recepta);
    const b = receptari.matriuDeRecepta(recepta.id);
    assert.deepEqual(a, b);
    assert.notStrictEqual(a, b);
    assert.deepEqual(Object.keys(a), ALERGENS);
    assert.ok(Object.values(a).every((cell) => cell.estat !== 'absent'));
  }
  assert.equal(JSON.stringify(receptari.RECEPTES), abans);
});
