import { describe, expect, test } from 'vitest';
import { nomDeLaGent, nomDeLaGentDelPoble, slugDelPoble } from './nomsDelPoble.js';
import { MOCK_TOWNS } from './townsSeed.js';
import { rutaDeSubjecte } from '../../data/contracte.js';

describe('nomDeLaGent · l’article es contrau i s’apostrofa com mana l’IEC', () => {
  test.each([
    ['El Campello', 'Gent del Campello'],
    ['Els Poblets', 'Gent dels Poblets'],
    ['La Torre de les Maçanes', 'Gent de la Torre de les Maçanes'],
    ['la Torre de les Maçanes', 'Gent de la Torre de les Maçanes'],
    ['Les Coves de Vinromà', 'Gent de les Coves de Vinromà'],
    ["L'Alfàs del Pi", "Gent de l'Alfàs del Pi"],
    ['L’Alfàs del Pi', "Gent de l'Alfàs del Pi"],
    ['Orxeta', "Gent d'Orxeta"],
    ['Alcoleja', "Gent d'Alcoleja"],
    ['Ibi', "Gent d'Ibi"],
    ['Hondón de las Nieves', "Gent d'Hondón de las Nieves"],
    ['Uixó', "Gent d'Uixó"],
    ['Iecla', 'Gent de Iecla'],
    ['Huelva', 'Gent de Huelva'],
    ['Yátova', 'Gent de Yátova'],
    ['Elx', "Gent d'Elx"],
    ['Xixona', 'Gent de Xixona'],
    ['  Sella  ', 'Gent de Sella']
  ])('%s → %s', (nom, gent) => {
    expect(nomDeLaGent(nom)).toBe(gent);
  });

  test('sense nom no hi ha gent', () => {
    expect(nomDeLaGent('')).toBe('');
    expect(nomDeLaGent('   ')).toBe('');
    expect(nomDeLaGent(null)).toBe('');
  });

  test('l’apòstrof és el recte (U+0027), com el de la llavor', () => {
    expect(nomDeLaGent('Orxeta')).not.toContain('’');
    expect(MOCK_TOWNS.find((town) => town.id === 'orxeta').author).toBe(nomDeLaGent('Orxeta'));
  });
});

describe('paritat amb la llavor de /pobles', () => {
  test('town.author || nomDeLaGent(town.title) dona l’autor que ja pinta cada targeta', () => {
    for (const town of MOCK_TOWNS) {
      expect(town.author || nomDeLaGent(town.title)).toBe(town.author);
    }
  });

  test('la regla reproduïx l’autor de tots els pobles de la llavor menys el nom curt de la Torre', () => {
    const ambNomPropi = MOCK_TOWNS.filter((town) => town.author !== nomDeLaGent(town.title)).map((town) => town.id);
    expect(ambNomPropi).toEqual(['la-torre-de-les-macanes']);
  });

  test('sense author, la fitxa rep el nom derivat', () => {
    const senseAutor = { ...MOCK_TOWNS.find((town) => town.id === 'penaguila'), author: undefined };
    expect(senseAutor.author || nomDeLaGent(senseAutor.title)).toBe('Gent de Penàguila');
  });

  /* Onada 6 (pla 261009_0245, ítem 4) · La mateixa regla, d'una fitxa. */
  test('nomDeLaGentDelPoble: l’author de la fitxa mana; sense, nomDeLaGent del seu nom; sense fitxa, buit', () => {
    for (const town of MOCK_TOWNS) expect(nomDeLaGentDelPoble(town)).toBe(town.author);
    expect(nomDeLaGentDelPoble({ id: 'el-campello', title: 'El Campello' })).toBe('Gent del Campello');
    expect(nomDeLaGentDelPoble({ id: 'i', name: 'Ibi', author: '   ' })).toBe("Gent d'Ibi");
    expect(nomDeLaGentDelPoble(null)).toBe('');
    expect(nomDeLaGentDelPoble({ id: 'x' })).toBe('');
  });
});

describe('slugDelPoble · l’id de la fitxa i la clau de /pobles/<id>', () => {
  test.each([
    ['La Torre de les Maçanes', 'la-torre-de-les-macanes'],
    ["Callosa d'en Sarrià", 'callosa-d-en-sarria'],
    ['Vila-real', 'vila-real'],
    /* El punt volat és un diacrític per a seleccioUrl: la l·l queda ll. */
    ['Bel·lús', 'bellus'],
    ['  El Campello ', 'el-campello']
  ])('%s → %s', (nom, slug) => {
    expect(slugDelPoble(nom)).toBe(slug);
    expect(rutaDeSubjecte('poble', slug)).toBe(`/pobles/${slug}`);
  });

  test('dona exactament l’id de cada poble de la llavor', () => {
    for (const town of MOCK_TOWNS) expect(slugDelPoble(town.title)).toBe(town.id);
  });

  test('un nom sense lletres ni xifres, o d’un alfabet que no cap en una ruta, no té slug', () => {
    expect(slugDelPoble('')).toBeNull();
    expect(slugDelPoble('—·—')).toBeNull();
    expect(slugDelPoble(null)).toBeNull();
    expect(slugDelPoble('Αθήνα')).toBeNull();
  });
});
