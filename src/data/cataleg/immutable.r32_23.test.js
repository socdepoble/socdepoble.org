// @vitest-environment node
import { expect, test } from 'vitest';
import { universalItemCataleg } from './universalItemCataleg.js';
import { ESPECIES_HERBARI_LA_TORRE_117 } from '../patrimoni/herbariLaTorre117.js';
test('R3223-CAT-01: el catàleg congelat no compartix cap dada aniuada mutable amb el consumidor', () => {
  const notes = ['Original'];
  const entrada = { id: 'id', tipus: 'planta', nom: 'Planta', font: { document: 'Font', sha256: 'a'.repeat(64), extra: { revisio: 1 } }, dades: { notes, origen: { poble: 'El Mas' } } };
  const item = universalItemCataleg(entrada);
  expect(Object.isFrozen(item.dades.notes)).toBe(true);
  expect(() => item.dades.notes.push('Canvi')).toThrow(TypeError);
  notes.push('Canvi extern'); entrada.dades.origen.poble = 'Un altre'; entrada.font.extra.revisio = 2;
  expect(item.dades).toEqual({ notes: ['Original'], origen: { poble: 'El Mas' } });
  expect(item.font.extra.revisio).toBe(1);
  expect(Object.isFrozen(notes)).toBe(false);
});


test('Gauntlet: la còpia immutable conserva àlies, cicles, arrays disperses i claus __proto__ com a dades', () => {
  const dades = JSON.parse('{"__proto__":{"valor":1}}');
  dades.notes = new Array(3); dades.notes[1] = 'Nota'; dades.cicle = dades; dades.alias = dades.notes;
  const item = universalItemCataleg({ id: 'id', tipus: 'planta', nom: 'Planta', font: { document: 'Font', sha256: 'a'.repeat(64) }, dades });
  expect(item.dades.cicle).toBe(item.dades); expect(item.dades.alias).toBe(item.dades.notes);
  expect(item.dades.notes.length).toBe(3); expect(0 in item.dades.notes).toBe(false);
  expect(Object.getPrototypeOf(item.dades)).toBe(Object.prototype);
  expect(Object.hasOwn(item.dades, '__proto__')).toBe(true); expect(Object.isFrozen(item.dades.__proto__)).toBe(true);
});


test('Àrbitre independent: vint mil nivells de dades planes es copien sense recursió ni pila esgotada', () => {
  const leaf = { valor: 'Original' }; let dades = leaf;
  for (let i = 0; i < 20_000; i++) dades = { branca: dades };
  const item = universalItemCataleg({ id: 'id', tipus: 'planta', nom: 'Planta', font: { document: 'Font', sha256: 'a'.repeat(64) }, dades });
  let copia = item.dades;
  for (let i = 0; i < 20_000; i++) { expect(Object.isFrozen(copia)).toBe(true); copia = copia.branca; }
  leaf.valor = 'Canvi extern'; expect(copia.valor).toBe('Original'); expect(Object.isFrozen(copia)).toBe(true);
});
test('Àrbitre independent: la còpia refusa accessors sense executar-los', () => {
  let calls = 0; const dades = {};
  Object.defineProperty(dades, 'secret', { get() { calls++; return 'No llegir'; } });
  expect(() => universalItemCataleg({ id: 'id', tipus: 'planta', nom: 'Planta', font: { document: 'Font', sha256: 'a'.repeat(64) }, dades })).toThrow(TypeError);
  expect(calls).toBe(0);
});

test('Àrbitre global: els usos ja immutables de les 117 fitxes de l’Herbari conserven la identitat canònica', () => {
  for (const dades of ESPECIES_HERBARI_LA_TORRE_117) {
    expect(Object.isFrozen(dades)).toBe(true); expect(Object.isFrozen(dades.usos)).toBe(true);
    const item = universalItemCataleg({ id: 'id', tipus: 'planta', nom: 'Planta', font: dades.font, dades });
    expect(item.dades.usos).toBe(dades.usos);
  }
});

test('Àrbitre global: només es reutilitzen subgrafs profundament immutables, sense congelar entrades alienes', () => {
  const compartida = Object.freeze({ usos: Object.freeze(['Medicinal']) });
  const mutable = { valor: 'Original' };
  const superficial = Object.freeze({ compartida, mutable });
  const item = universalItemCataleg({ id: 'id', tipus: 'planta', nom: 'Planta', font: { document: 'Font', sha256: 'a'.repeat(64) }, dades: { superficial, alias: mutable, compartida } });
  expect(item.dades.compartida).toBe(compartida); expect(item.dades.superficial.compartida).toBe(compartida);
  expect(item.dades.superficial).not.toBe(superficial); expect(item.dades.alias).not.toBe(mutable);
  expect(item.dades.alias).toBe(item.dades.superficial.mutable);
  mutable.valor = 'Canvi extern'; expect(item.dades.alias.valor).toBe('Original'); expect(Object.isFrozen(mutable)).toBe(false);
});

test('Àrbitre global: els cicles congelats es reutilitzen i una branca mutable invalida tots els seus antecessors', () => {
  const immutable = {}; immutable.cicle = immutable; Object.freeze(immutable);
  const mutable = {}; const superficial = Object.freeze({ mutable }); mutable.cicle = superficial;
  const item = universalItemCataleg({ id: 'id', tipus: 'planta', nom: 'Planta', font: { document: 'Font', sha256: 'a'.repeat(64) }, dades: { immutable, superficial } });
  expect(item.dades.immutable).toBe(immutable); expect(item.dades.immutable.cicle).toBe(immutable);
  expect(item.dades.superficial).not.toBe(superficial); expect(item.dades.superficial.mutable).not.toBe(mutable);
  expect(item.dades.superficial.mutable.cicle).toBe(item.dades.superficial);
  expect(Object.isFrozen(mutable)).toBe(false);
});

test('Àrbitre global: congelar un accessor no el convertix en dada immutable ni executa el getter', () => {
  let calls = 0; const dades = Object.freeze(Object.defineProperty({}, 'usos', { get() { calls++; return []; } }));
  expect(() => universalItemCataleg({ id: 'id', tipus: 'planta', nom: 'Planta', font: { document: 'Font', sha256: 'a'.repeat(64) }, dades })).toThrow(TypeError);
  expect(calls).toBe(0);
});
